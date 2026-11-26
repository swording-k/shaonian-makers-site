import { assets } from './assets.mjs';

const feishu = 'https://open.feishu.cn/open-apis';
const settings = ['FEISHU_APP_ID', 'FEISHU_APP_SECRET', 'FEISHU_BASE_TOKEN', 'FEISHU_TABLE_ID'];
const encoder = new TextEncoder();
let snapshot;
let pending;

const json = (value, status = 200) => Response.json(value, {
  status,
  headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});

function asText(value) {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(part => asText(part)).join('').trim();
  if (value && typeof value === 'object') return asText(value.text ?? value.name ?? value.link);
  return '';
}

function asUrl(value, host) {
  try {
    const url = new URL(value?.link || asText(value));
    if (url.protocol !== 'https:' || url.username || url.password || (host && url.hostname !== host)) return '';
    return url.href;
  } catch {
    return '';
  }
}

function timestamp(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  const raw = asText(value);
  if (!raw) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw + 'T00:00:00+08:00' : raw;
  const parsed = Date.parse(date);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function publicEvent(record) {
  const fields = record.fields || {};
  if (asText(fields['发布状态']) !== '已发布') return null;
  const title = asText(fields['活动标题']);
  const start = timestamp(fields['开始时间']);
  const end = timestamp(fields['结束时间']);
  const schedule = asText(fields['活动状态']);
  const postponed = schedule === '延期';
  const cancelled = schedule === '取消';
  if (!title || !record.record_id || (!(start && end && start < end) && !postponed && !cancelled)) return null;
  return {
    id: record.record_id,
    title: title.slice(0, 80),
    body: asText(fields['文章正文']).slice(0, 8000),
    start,
    end,
    postponed,
    cancelled,
    articleUrl: asUrl(fields['公众号原文'], 'mp.weixin.qq.com'),
    signupUrl: asText(fields['报名状态']) === '开放' ? asUrl(fields['报名链接']) : '',
    audioUrl: asUrl(fields['语音链接']),
  };
}

async function api(path, options, request) {
  const response = await request(feishu + path, { ...options, signal: AbortSignal.timeout(6500) });
  if (!response.ok) throw new Error('Feishu HTTP ' + response.status);
  const result = await response.json();
  if (result.code !== 0) throw new Error('Feishu API ' + (Number(result.code) || 'invalid'));
  return result;
}

export async function getFeishuEvents(env, request = fetch) {
  const credentials = await api('/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: env.FEISHU_APP_ID, app_secret: env.FEISHU_APP_SECRET }),
  }, request);
  if (typeof credentials.tenant_access_token !== 'string') throw new Error('Feishu token unavailable');
  const path = '/bitable/v1/apps/' + encodeURIComponent(env.FEISHU_BASE_TOKEN)
    + '/tables/' + encodeURIComponent(env.FEISHU_TABLE_ID) + '/records/search';
  let next = '';
  const events = new Map();
  for (let page = 0; page < 20; page++) {
    const query = new URLSearchParams({ page_size: '100' });
    if (next) query.set('page_token', next);
    const { data } = await api(path + '?' + query, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + credentials.tenant_access_token },
      body: JSON.stringify({ automatic_fields: false }),
    }, request);
    if (!data || (data.items && !Array.isArray(data.items))) throw new Error('Feishu records unavailable');
    for (const row of data.items || []) {
      const event = publicEvent(row);
      if (event) events.set(event.id, event);
    }
    if (!data.has_more) return [...events.values()];
    if (!data.page_token || data.page_token === next) throw new Error('Feishu pagination incomplete');
    next = data.page_token;
  }
  throw new Error('Feishu record limit reached');
}

function publicSnapshot(events, stale = false) {
  return json({ source: 'feishu', stale, events: stale ? events.map(event => ({ ...event, signupUrl: '' })) : events });
}

async function listEvents(env) {
  if (!settings.every(name => env[name])) return json({ source: 'demo', events: [] });
  if (snapshot?.expires > Date.now()) return publicSnapshot(snapshot.events);
  try {
    pending ??= getFeishuEvents(env)
      .then(events => (snapshot = { events, expires: Date.now() + 60_000 }))
      .finally(() => { pending = undefined; });
    const result = await pending;
    return publicSnapshot(result.events);
  } catch {
    return snapshot ? publicSnapshot(snapshot.events, true) : json({ status: 'content_unavailable' }, 503);
  }
}

const headers = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; media-src 'self' https: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'",
};

export default {
  async fetch(request, env = {}) {
    const pathname = new URL(request.url).pathname;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    if (pathname === '/api/events') {
      const response = await listEvents(env);
      return request.method === 'HEAD' ? new Response(null, response) : response;
    }
    const eventPage = /^\/events\/[A-Za-z0-9_-]+\/?$/.test(pathname);
    const asset = assets[eventPage ? '/event.html' : pathname === '/' ? '/index.html' : pathname];
    if (!asset) return new Response('Not found', { status: 404, headers });
    const bytes = request.method === 'HEAD' ? null : (asset.binary
      ? Uint8Array.from(atob(asset.contents), byte => byte.charCodeAt(0))
      : encoder.encode(asset.contents));
    return new Response(bytes, { headers: { ...headers, 'Content-Type': asset.type,
      'Cache-Control': pathname.startsWith('/assets/') ? 'public,max-age=3600' : 'no-cache' } });
  },
};
