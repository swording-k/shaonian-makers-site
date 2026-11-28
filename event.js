(() => {
  const el = (id) => document.getElementById(id);
  const staticHosting = document.documentElement.hasAttribute('data-static-hosting');
  const standalone = location.protocol === 'file:' || document.documentElement.hasAttribute('data-standalone-demo');
  const samples = {
    recruit: {
      title: '活动招募 · 页面示例',
      meta: '页面示例 · 非真实活动',
      summary: '这里将展示活动主题、流程、适龄范围与参与方式。',
      body: '这是活动介绍页面的版式示例，并非真实活动。正式内容发布后，这里会显示对应活动的完整介绍，并按实际情况提供报名入口与公众号原文。',
    },
    recap: {
      title: '活动回顾 · 页面示例',
      meta: '页面示例 · 非真实活动',
      summary: '这里将汇总现场记录、孩子的作品与活动复盘。',
      body: '这是活动回顾页面的版式示例，并非真实活动。正式内容发布后，这里会保留同一个活动网址，并补充现场照片、作品介绍与公众号原文。',
    },
  };

  if (standalone && !staticHosting) {
    const inPreview = location.pathname.split('/').includes('preview');
    document.querySelectorAll('[data-back-home]').forEach((link) => {
      link.href = inPreview ? './index.html#events' : './site-demo.html#events';
    });
  } else if (!staticHosting) {
    document.querySelectorAll('[data-back-home]').forEach((link) => { link.href = '/index.html#events'; });
  }

  function httpsUrl(value, host) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password) return '';
      if (host && url.hostname !== host) return '';
      return url.href;
    } catch { return ''; }
  }

  function timeLabel(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric',
    }).format(new Date(value));
  }

  function metadata(event) {
    if (event.cancelled) return '已取消';
    if (event.postponed) return '时间待定';
    const now = Date.now();
    const state = now < event.start ? '即将开始' : now < event.end ? '进行中' : '已结束';
    const start = timeLabel(event.start);
    const end = timeLabel(event.end ? event.end - 1 : null);
    return [state, end && start !== end ? `${start} 至 ${end}` : start].filter(Boolean).join(' · ');
  }

  function render(event, real = false) {
    el('event-detail-title').textContent = event.title;
    el('event-detail-meta').textContent = real ? metadata(event) : event.meta;
    el('event-detail-summary').textContent = real ? (event.body || '活动介绍待补充。').slice(0, 120) : event.summary;
    el('event-detail-body').textContent = real ? (event.body || '正文待补充。') : event.body;
    document.title = `${event.title}｜少年创想家`;

    if (!real) return;
    const article = httpsUrl(event.articleUrl, 'mp.weixin.qq.com');
    const signup = !event.cancelled && !event.postponed && Date.now() < event.start ? httpsUrl(event.signupUrl) : '';
    const articleLink = el('event-article');
    const signupLink = el('event-signup');
    articleLink.hidden = !article;
    signupLink.hidden = !signup;
    if (article) articleLink.href = article;
    if (signup) signupLink.href = signup;
    const audio = httpsUrl(event.audioUrl);
    const player = el('event-detail-audio');
    player.hidden = !audio;
    if (audio) player.src = audio;
  }

  function initCamp() {
    el('general-event').hidden = true;
    el('camp-2026-11-28').hidden = false;
    document.title = '11 月 28–29 日青少年 AI 线下一日营（两场）｜少年创想家';

    for (const id of ['camp-materials', 'camp-submit']) {
      const link = el(id);
      if (httpsUrl(link.getAttribute('href'))) {
        link.hidden = false;
        el(`${id}-pending`).hidden = true;
      }
    }

    const status = el('camp-copy-status');
    const prompt = el('camp-prompt');
    const url = el('camp-link-fallback');
    url.value = prompt.value.trim().split('\n').at(-1).replace('活动页：', '');

    function bindCopy(id, field, success) {
      el(id).addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(field.value.trim());
          status.textContent = success;
        } catch {
          field.hidden = false;
          field.focus();
          field.select();
          status.textContent = '文字已选中，按 Ctrl+C 或 ⌘+C 复制。';
        }
      });
    }

    bindCopy('camp-copy-prompt', prompt, '提示词已复制，可以粘贴给智能体。');
    bindCopy('camp-copy-link', url, '活动页链接已复制。');
  }

  async function load() {
    const params = new URLSearchParams(location.search);
    const sample = params.get('sample');
    if (sample && samples[sample]) {
      render(samples[sample]);
      return;
    }
    const pathMatch = location.pathname.match(/\/events\/([^/]+)\/?$/);
    const slug = params.get('slug') || (pathMatch ? decodeURIComponent(pathMatch[1]) : '');
    if (slug === 'camp-2026-11-28') {
      initCamp();
      return;
    }
    if (!slug || standalone || staticHosting) {
      render(samples.recruit);
      return;
    }
    try {
      const response = await fetch('/api/events', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('活动读取失败');
      const result = await response.json();
      const event = Array.isArray(result.events) ? result.events.find((item) => item.id === slug) : null;
      if (!event) throw new Error('活动不存在');
      render(event, true);
    } catch {
      el('event-detail-title').textContent = '暂时找不到这个活动';
      el('event-detail-meta').textContent = '内容不可用或活动尚未发布';
      el('event-detail-summary').textContent = '请返回活动列表查看当前公开的内容。';
      el('event-detail-body').textContent = '';
    }
  }

  load();
})();
