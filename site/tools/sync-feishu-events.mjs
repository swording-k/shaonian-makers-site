#!/usr/bin/env node
/**
 * 飞书活动表 → 官网静态数据
 *
 * 两种数据源：
 *   1) lark-cli（本机已登录的飞书账号，适合本地预览和验收）
 *      node site/tools/sync-feishu-events.mjs --source=lark-cli --base=<base_token> --table=<table_id>
 *   2) 飞书自建应用（CI 用，凭据只走环境变量）
 *      FEISHU_APP_ID=xx FEISHU_APP_SECRET=yy node site/tools/sync-feishu-events.mjs --base=<base_token> --table=<table_id>
 *
 * 产物：
 *   site/public/data/events.json            官网读取的活动数据
 *   site/public/assets/events/<id>-cover.jpg  活动封面（附件自动下载）
 */

import { mkdir, writeFile, readFile, readdir, copyFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const options = args();
const outRoot = options.out ? resolve(root, options.out) : join(root, 'site/public');
const OUT_JSON = join(outRoot, 'data/events.json');
const OUT_ASSETS = join(outRoot, 'assets/events');
const FEISHU = 'https://open.feishu.cn/open-apis';

function args() {
  const out = {};
  for (const item of process.argv.slice(2)) {
    const [key, value = 'true'] = item.replace(/^--/, '').split('=');
    out[key] = value;
  }
  return out;
}

function asText(value) {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(asText).join('').trim();
  if (value && typeof value === 'object') return asText(value.text ?? value.name ?? value.link);
  return '';
}

function findLink(value, depth = 0) {
  if (!value || depth > 3) return '';
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findLink(item, depth + 1);
      if (found) return found;
    }
    return '';
  }
  if (typeof value === 'object') {
    if (typeof value.link === 'string' && value.link.trim()) return value.link.trim();
    return findLink(value.text ?? '', depth + 1);
  }
  return '';
}

function asUrl(value) {
  const raw = findLink(value);
  if (!raw) return '';
  // lark-cli 会把超链接字段渲染成 [文案](链接)，这里取出真实地址
  const target = raw.match(/\((https?:\/\/[^)\s]+)\)/)?.[1]
    || raw.match(/https?:\/\/[^\s)\]，。]+/)?.[0]
    || '';
  try {
    const url = new URL(target);
    if (url.protocol !== 'https:') return '';
    return url.href;
  } catch {
    return '';
  }
}

function asTime(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  const raw = asText(value);
  if (!raw) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw + 'T00:00:00+08:00' : raw;
  const parsed = Date.parse(date.replace(' ', 'T'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function pick(record) {
  const fields = record.fields || {};
  if (asText(fields['发布状态']) !== '已发布') return null;
  const title = asText(fields['活动标题']);
  const start = asTime(fields['开始时间']);
  const end = asTime(fields['结束时间']);
  const state = asText(fields['活动状态']);
  const postponed = state === '延期';
  const cancelled = state === '取消';
  if (!title || !record.record_id) return null;
  if (!(start && end && start < end) && !postponed && !cancelled) return null;

  const attachments = Array.isArray(fields['活动封面']) ? fields['活动封面'] : [];
  const coverToken = attachments[0]?.file_token || '';

  return {
    id: record.record_id,
    title: title.slice(0, 80),
    summary: asText(fields['活动简介']).slice(0, 160),
    form: asText(fields['活动形式']),
    location: asText(fields['活动地点']).slice(0, 60),
    start,
    end,
    postponed,
    cancelled,
    coverToken,
    articleUrl: asUrl(fields['公众号原文']),
    channelsUrl: asUrl(fields['视频号链接']),
    signupUrl: asText(fields['报名状态']) === '开放' ? asUrl(fields['报名链接']) : '',
  };
}

async function httpRecords(base, table, env) {
  const call = async (path, init, token = '') => {
    const response = await fetch(FEISHU + path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(init?.headers || {}),
      },
      signal: AbortSignal.timeout(10000),
    });
    const json = await response.json();
    if (!response.ok || json.code !== 0) throw new Error('Feishu ' + (json.code || response.status) + ' ' + (json.msg || ''));
    return json;
  };
  const auth = await call('/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    body: JSON.stringify({ app_id: env.FEISHU_APP_ID, app_secret: env.FEISHU_APP_SECRET }),
  });
  const token = auth.tenant_access_token;
  const records = [];
  let pageToken = '';
  for (let page = 0; page < 20; page++) {
    const query = new URLSearchParams({ page_size: '100' });
    if (pageToken) query.set('page_token', pageToken);
    const res = await call('/bitable/v1/apps/' + encodeURIComponent(base) + '/tables/' + encodeURIComponent(table) + '/records/search?' + query, {
      method: 'POST',
      body: JSON.stringify({ automatic_fields: false }),
    }, token);
    for (const row of res.data.items || []) records.push(row);
    if (!res.data.has_more) break;
    pageToken = res.data.page_token;
    if (!pageToken) break;
  }
  return { records, token };
}

async function cliRecords(base, table) {
  const result = spawnSync('lark-cli', [
    'base', '+record-list',
    '--base-token', base, '--table-id', table,
    '--format', 'json', '--limit', '200', '--as', 'user',
  ], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) throw new Error('lark-cli 读取失败：' + (result.stderr || '').slice(0, 300));
  const parsed = JSON.parse(result.stdout);
  const names = parsed.data.fields || [];
  const rows = parsed.data.data || [];
  const ids = parsed.data.record_id_list || [];
  const records = rows.map((row, index) => {
    const fields = {};
    names.forEach((name, column) => { fields[name] = row[column]; });
    return { record_id: ids[index], fields };
  });
  return { records, token: '' };
}

async function saveCover(event, base, table, token) {
  if (!event.coverToken) return '';
  const name = event.id + '-cover.jpg';
  const target = join(OUT_ASSETS, name);
  if (existsSync(target)) return './assets/events/' + name;
  try {
    if (token) {
      const response = await fetch(FEISHU + '/drive/v1/medias/' + encodeURIComponent(event.coverToken) + '/download', {
        headers: { Authorization: 'Bearer ' + token },
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const bytes = Buffer.from(await response.arrayBuffer());
      await writeFile(target, bytes);
    } else {
      // lark-cli 只允许写入 cwd / /tmp 等目录，先落临时目录再拷贝
      const staging = join(root, '.tmp-cover-' + event.id);
      await mkdir(staging, { recursive: true });
      const result = spawnSync('lark-cli', [
        'base', '+record-download-attachment',
        '--base-token', base, '--table-id', table,
        '--record-id', event.id, '--file-token', event.coverToken,
        '--output', staging, '--overwrite', '--as', 'user',
      ], { encoding: 'utf8' });
      if (result.status !== 0) throw new Error((result.stderr || '').slice(0, 200));
      const downloaded = (await readdir(staging)).find(file => !file.startsWith('.'));
      if (!downloaded) throw new Error('封面未落盘：' + staging);
      await copyFile(join(staging, downloaded), target);
      await rm(staging, { recursive: true, force: true });
    }
    return './assets/events/' + name;
  } catch (error) {
    console.warn('封面下载失败（该活动将显示无图卡片）：' + event.id + ' · ' + error.message);
    return '';
  }
}

const base = options.base || process.env.FEISHU_BASE_TOKEN;
const table = options.table || process.env.FEISHU_TABLE_ID;
const mode = options.source || 'http';

if (!base || !table) {
  console.error('缺少 base / table，例如 --base=<base_token> --table=<table_id>');
  process.exit(1);
}

await mkdir(OUT_ASSETS, { recursive: true });
await mkdir(dirname(OUT_JSON), { recursive: true });

const { records, token } = mode === 'lark-cli'
  ? await cliRecords(base, table)
  : await httpRecords(base, table, process.env);

const events = [];
for (const record of records) {
  const event = pick(record);
  if (!event) continue;
  const cover = await saveCover(event, base, table, token);
  delete event.coverToken;
  events.push({ ...event, cover });
}

events.sort((a, b) => (a.start || 0) - (b.start || 0));

const payload = {
  generatedAt: new Date().toISOString(),
  source: mode === 'lark-cli' ? 'feishu-cli' : 'feishu',
  count: events.length,
  events,
};

const previous = existsSync(OUT_JSON) ? await readFile(OUT_JSON, 'utf8').catch(() => '') : '';
const next = JSON.stringify(payload, null, 2) + '\n';
if (previous !== next) await writeFile(OUT_JSON, next);

console.log('同步完成：' + events.length + ' 条已发布活动 · 读取 ' + records.length + ' 条记录 · 输出 ' + OUT_JSON.replace(root + '/', ''));
