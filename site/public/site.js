(() => {
  const el = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const staticHosting = document.documentElement.hasAttribute('data-static-hosting');
  const standalone = window.location.protocol === 'file:' || document.documentElement.hasAttribute('data-standalone-demo');

  /* LeiBox CardSwap: four real project images, no outer demo frame. */
  function initHeroCardSwap() {
    const host = el('hero-card-swap');
    if (!host || !window.CardSwap?.mount) return;
    const poster = host.querySelector('.hero-photo');
    window.CardSwap.mount(host, {
      auto: false,
      height: 350,
      cards: [
        { title: '卡丁车小游戏 · 第一期学员作品', src: './assets/work-racer.jpg' },
        { title: '太阳系探索任务 · 第一期学员作品', src: './assets/work-solar-system.jpg' },
        { title: '拍照背单词卡 · 第一期学员作品', src: './assets/work-word-cards.jpg' },
        { title: '下一件作品 · 敬请期待', src: './assets/work-soon.svg' },
      ],
    });
    const surface = host.querySelector('[data-motion-surface]');
    const scene = surface?.shadowRoot?.querySelector('.csw-scene');
    if (scene) {
      scene.style.background = 'transparent';
      poster?.remove();
    }
  }

  function initHeroOcean() {
    const host = el('idea-ocean');
    if (!host || !window.AsciiSharks) return;
    const ocean = window.AsciiSharks.mount(host, {
      height: host.parentElement.clientHeight, showComposer: true,
      fishCount: 100, sharks: [{kind: 'hammerhead', size: 1}, {kind: 'classic', size: .8}],
      onSubmit: () => {
        document.dispatchEvent(new Event('open-wecom-consultation'));
      },
    });
    const root = ocean.root;
    root.querySelector('.ao-title').textContent = '你想做出什么？';
    const input = root.querySelector('.ao-input');
    input.placeholder = '比如，做一个会游动的海洋世界…';
    input.setAttribute('aria-label', '写下你的作品想法');
    root.querySelector('.ao-send').setAttribute('aria-label', '发送作品想法');
    root.querySelector('.ao-hint').textContent = '发送后添加企微咨询';
    root.querySelector('.ao-history-wrap').hidden = true;
    root.querySelector('.ao-add').hidden = true;
    root.querySelector('.ao-voice').hidden = true;
    root.querySelector('canvas').setAttribute('aria-label', '字符鲨鱼与鱼群。移动指针或轻点水面可与鱼群互动，空格暂停。');
    const style = document.createElement('style');
    style.textContent = '.ao-scene{--ao-bg:#f7faff}.ao-title{font-family:inherit;font-size:clamp(23px,3vw,32px);margin-bottom:14px}.ao-composer{top:65%;bottom:auto;transform:translateX(-50%);width:calc(100% - 40px);max-width:580px}.ao-history-wrap{display:none!important}@media(max-width:960px){.ao-composer{top:var(--composer-mobile-top,420px);bottom:auto}}.ao-form{background:#ffffffed}.ao-canvas{touch-action:pan-y}.ao-haze{display:none!important}';
    root.append(style);
    const updateOceanLayout = () => {
      const copy = document.querySelector('.hero-copy');
      ocean.element.style.setProperty('--composer-mobile-top', (document.querySelector('.hero-grid').offsetTop + copy.offsetTop + copy.offsetHeight + 30) + 'px');
      ocean.update({height: host.parentElement.clientHeight});
    };
    new ResizeObserver(updateOceanLayout).observe(host.parentElement);
    updateOceanLayout();
  }

  function initCapabilityScenes() {
    if (!window.DeepAgentUI) return;
    const composer = window.DeepAgentUI.mountComposer(el('cap-composer'), {
      height: 280, models: ['创作练习'], selectedModel: '创作练习',
      onSubmit: () => {
        el('cap-feedback').textContent = '再想一想：谁会用它？怎样操作？做到什么就算成功？';
      },
    });
    const slider = window.DeepAgentUI.mountSlider(el('cap-effort'), {
      height: 280,
      onValueChange: (value) => {
        const labels = {simple: '简单 · 先试一个小步骤', medium: '中度 · 拆开问题，逐步检查', deep: '深度 · 多想几种方案，再比较'};
        el('effort-feedback').textContent = labels[value];
      },
    });
    for (const control of [composer, slider]) {
      const style = document.createElement('style');
      style.textContent = '.original-deep-agent-stage{padding:12px 8px;min-height:280px;background:transparent}.original-composer-container{max-width:100%}.original-deep-agent-stage button[aria-label="添加文件"],.original-deep-agent-stage button[aria-label^="Context"],.original-deep-agent-stage button[class~="max-w-full"][class~="whitespace-nowrap"]{display:none}';
      control.root.append(style);
    }
  }

  function loadCapabilityScenes() {
    const host = el('cap-composer');
    const section = host?.closest('.capability-chapter');
    if (!section) return;

    const load = () => {
      const script = document.createElement('script');
      const offlineBundle = el('offline-deep-agent');
      if (offlineBundle) {
        script.textContent = offlineBundle.textContent;
        document.head.append(script);
        initCapabilityScenes();
        return;
      }
      script.src = host.dataset.agentSrc;
      script.onload = initCapabilityScenes;
      script.onerror = () => {
        el('cap-feedback').textContent = '互动暂时无法加载，请刷新后再试。';
        el('effort-feedback').textContent = '互动暂时无法加载。';
      };
      document.head.append(script);
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      load();
    }, {rootMargin: '480px 0px'});
    observer.observe(section);
  }

  /* 活动卡片读取 ./data/events.json，由飞书活动表同步生成（site/tools/sync-feishu-events.mjs）。
     第一期一日营回顾是真实素材，固定留在往期，不依赖活动表。 */
  const BUILTIN_PAST = {
    real: true,
    title: '第一期 · 11 月青少年 AI 线下一日营',
    date: '2026 年 11 月 22 日',
    excerpt: '一天时间，孩子们把自己的点子做成了能运行的作品。点开看这次活动的现场视频。',
    image: './assets/event-2026-11-22.jpg',
    href: 'https://weixin.qq.com/sph/AwtVM1OP01',
  };

  function timeLabel(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric',
    }).format(new Date(value));
  }

  function metadata(event) {
    const flag = event.cancelled ? '已取消 · ' : event.postponed ? '时间待定 · ' : '';
    const start = timeLabel(event.start);
    const end = timeLabel(event.end ? event.end - 1 : null);
    const range = end && start !== end ? `${start} 至 ${end}` : start;
    return flag + range;
  }

  function eventCard(event) {
    const href = event.href || event.articleUrl || event.channelsUrl || event.signupUrl || '';
    const image = event.image || event.cover || '';
    const item = document.createElement(href ? 'a' : 'div');
    item.className = 'event-item' + (image ? ' has-cover' : '') + (href ? '' : ' is-static');
    if (href) {
      item.href = href;
      item.target = '_blank';
      item.rel = 'noopener noreferrer';
    }

    if (image) {
      const cover = document.createElement('img');
      cover.className = 'event-cover';
      cover.src = image;
      cover.alt = `${event.title}封面`;
      cover.loading = 'lazy';
      cover.decoding = 'async';
      item.append(cover);
    }

    const meta = document.createElement('span');
    meta.className = 'event-date';
    meta.textContent = event.real ? event.date : metadata(event);

    const content = document.createElement('span');
    content.className = 'event-content';
    const title = document.createElement('strong');
    title.textContent = event.title;
    const excerpt = document.createElement('small');
    excerpt.textContent = event.real
      ? event.excerpt
      : [event.summary || '查看活动介绍与报名入口。', event.location].filter(Boolean).join(' · ');
    content.append(title, excerpt);

    const arrow = document.createElement('span');
    arrow.className = 'event-read';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.innerHTML = '<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M4.5 11.5L11.5 4.5M11.5 4.5H6M11.5 4.5V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    item.append(meta, content, arrow);
    return item;
  }

  function emptyNotice(text) {
    const note = document.createElement('p');
    note.className = 'event-empty';
    note.textContent = text;
    return note;
  }

  function renderEvents(events) {
    const near = [];
    const past = [];
    const now = Date.now();
    for (const event of events) {
      (event.cancelled || (event.end && now >= event.end) ? past : near).push(event);
    }
    near.sort((a, b) => (a.start || Infinity) - (b.start || Infinity));
    past.sort((a, b) => (b.end || 0) - (a.end || 0));

    el('upcoming').replaceChildren(...(near.length
      ? near.map(eventCard)
      : [emptyNotice('近期暂无公开场次，新一期排期会在这里和公众号同步。')]));
    el('past').replaceChildren(...[BUILTIN_PAST, ...past].map(eventCard));
  }

  async function loadEvents() {
    if (standalone) {
      el('event-source').textContent = '离线预览：活动数据需联网读取，当前仅显示往期回顾。';
      renderEvents([]);
      return;
    }
    try {
      const response = await fetch('./data/events.json', { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('活动数据读取失败');
      const result = await response.json();
      if (!Array.isArray(result.events)) throw new Error('活动数据格式异常');
      const stamp = result.generatedAt ? new Date(result.generatedAt) : null;
      el('event-source').textContent = result.events.length
        ? '活动信息来自团队活动表' + (stamp ? `，更新于 ${timeLabel(stamp)}` : '') + '。'
        : '近期暂无公开场次，新一期排期会在这里和公众号同步。';
      renderEvents(result.events);
    } catch {
      el('event-source').textContent = '活动数据暂未加载，近期安排以公众号发布为准。';
      renderEvents([]);
    }
  }

  function initEventFilter() {
    const buttons = [...document.querySelectorAll('.filter-btn')];
    const pill = document.querySelector('.filter-pill');
    const columns = [...document.querySelectorAll('.event-column')];
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        buttons.forEach((item) => {
          const on = item === button;
          item.classList.toggle('is-active', on);
          item.setAttribute('aria-selected', String(on));
        });
        if (pill) pill.style.transform = `translateX(${index * 100}%)`;
        columns.forEach((column) => {
          column.hidden = filter !== 'all' && column.dataset.group !== filter;
        });
      });
    });
  }

  /* QR lightbox uses the already loaded thumbnail, including standalone demos. */
  function initQrLightbox() {
    const dialog = el('qr-dialog');
    const image = el('qr-lightbox-img');
    const note = el('qr-lightbox-note');
    if (!dialog) return;
    const sources = {
      wecom: { note: '长按或使用微信扫一扫添加企业微信', alt: '少年创想家企业微信名片大图' },
      channels: { note: '长按或使用微信扫一扫关注视频号', alt: '老师视频号名片大图' },
    };
    const open = (key, community = false) => {
      const source = sources[key];
      const thumbnail = document.querySelector('.qr-thumb[data-lightbox="' + key + '"] img');
      if (!source || !thumbnail) return;
      image.src = thumbnail.currentSrc || thumbnail.src;
      image.alt = source.alt;
      el('qr-lightbox-title').textContent = community
        ? '添加企微，了解并加入社群' : key === 'wecom' ? '添加企业微信' : '关注视频号';
      note.textContent = '长按图片可保存到相册或识别二维码；也可点击下方下载图片。';
      el('qr-download').href = image.src;
      el('qr-download').download = key === 'wecom' ? '少年创想家-企业微信.jpg' : '少年创想家-视频号.jpg';
      dialog.showModal();
    };
    document.querySelectorAll('.qr-thumb').forEach((button) => {
      button.addEventListener('click', () => open(button.dataset.lightbox));
    });
    document.querySelectorAll('[data-course-consult]').forEach(button => button.addEventListener('click', () => open('wecom', !!button.closest('[data-detail="community"]'))));
    document.addEventListener('open-wecom-consultation', () => {
      open('wecom');
      el('qr-lightbox-title').textContent = '添加企业微信，聊聊你的作品想法';
      note.textContent = '长按保存或扫码添加，将你的想法发给老师，了解课程详情。';
    });
    el('qr-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  function initCopyButton() {
    const button = el('copy-link-btn');
    if (!button) return;
    const label = button.querySelector('.copy-label');
    let timer = 0;
    button.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(window.location.href); } catch {}
      label.textContent = '已复制链接';
      button.classList.add('is-copied');
      clearTimeout(timer);
      timer = setTimeout(() => {
        label.textContent = '复制本页链接';
        button.classList.remove('is-copied');
      }, 2000);
    });
  }

  function initNavigation() {
    const bar = el('scroll-bar');
    const sections = [...document.querySelectorAll('main > section[id]')];
    const links = [...document.querySelectorAll('.main-nav a')];
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      if (bar) bar.style.transform = `scaleX(${Math.min(1, Math.max(0, scrollY / max))})`;
      const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 4;
      const current = atEnd ? sections.at(-1) : sections.filter((section) => section.getBoundingClientRect().top <= innerHeight * 0.35).at(-1) || sections[0];
      links.forEach((link) => {
        if (current && link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  }

  function initScrollMotion() {
    const { gsap, ScrollTrigger } = window;
    if (!gsap || !ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('.split-left', { x: 18 }, { x: -18, ease: 'none', scrollTrigger: { trigger: '.manifesto-chapter', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo('.split-right', { x: -18 }, { x: 18, ease: 'none', scrollTrigger: { trigger: '.manifesto-chapter', start: 'top bottom', end: 'bottom top', scrub: true } });

      gsap.fromTo('.manifesto-inner', {y: 26}, {
        y: 0, ease: 'none',
        scrollTrigger: {trigger: '#manifesto', start: 'top bottom', end: 'top 40%', scrub: true},
      });
      gsap.to('.hero-grid', {
        opacity: 0, y: -46, scale: .97, ease: 'none',
        scrollTrigger: {trigger: '#manifesto', start: 'top 88%', end: 'top 42%', scrub: .45},
      });
      gsap.to('.hero-stage', {
        y: -32, rotation: -1, ease: 'none',
        scrollTrigger: {trigger: '.hero-chapter', start: 'top top', end: 'bottom top', scrub: .5},
      });
      gsap.fromTo('.ink-line', {opacity: .3, y: 10}, {
        opacity: 1, y: 0, stagger: .22, ease: 'none',
        scrollTrigger: {trigger: '.ink-statement', start: 'top 85%', end: 'bottom 55%', scrub: .4},
      });

      const reveals = [
        ['.program-list .program-row', '.program-list', 0.06],
        ['.mentor-card', '.mentor-grid', 0.08],
        ['.cap-item', '.capability-strip', 0.09],
        ['.event-column', '.event-groups', 0.1],
        ['.contact-card, .qr-card', '.contact-options', 0.08],
      ];
      for (const [selector, trigger, stagger] of reveals) {
        const nodes = [...document.querySelectorAll(selector)];
        if (!nodes.length) continue;
        gsap.from(nodes, {
          y: 18, opacity: 0, duration: 0.55, stagger, ease: 'power3.out', clearProps: 'transform,opacity',
          scrollTrigger: { trigger, start: 'top 88%', once: true },
        });
      }
    });
  }


  initHeroCardSwap();
  initHeroOcean();
  loadCapabilityScenes();
  initEventFilter();
  initQrLightbox();
  initCopyButton();
  initNavigation();
  initScrollMotion();
  window.dispatchEvent(new Event('makers-hero-ready'));
  loadEvents();
})();
