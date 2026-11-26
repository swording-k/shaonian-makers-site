(() => {
  const el = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const standalone = window.location.protocol === 'file:' || document.documentElement.hasAttribute('data-standalone-demo');

  /* LeiBox CardSwap: four real project images, no outer demo frame. */
  function initHeroCardSwap() {
    const host = el('hero-card-swap');
    if (!host || !window.CardSwap?.mount) return;
    host.replaceChildren();
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
    if (scene) scene.style.background = 'transparent';
  }

  /* Programs: show only confirmed facts; pending products stay pending. */
  const PROGRAMS = {
    'day-camp': {
      heading: '99 元体验课，用一天做出一个小作品。',
      copy: '孩子从自己的点子出发，把要求讲给智能体，再亲手检验做出来的效果。',
      note: '具体排期与报名链接即将公布。',
    },
    'ai-course': {
      heading: '少年创想家·青少年AI实战成长营',
      copy: '课程设计正在推进。',
      note: '课程内容与报名安排敬请期待。',
    },
    community: {
      heading: 'AI 高效育儿俱乐部·线上社群',
      copy: '社群内将持续分享知识文档与课程。',
      note: '更多介绍敬请期待。',
    },
    'online-coaching': {
      heading: '长期线上营',
      copy: '长期项目正在推进。',
      note: '具体形式与安排敬请期待。',
    },
  };

  function initPrograms() {
    const rows = [...document.querySelectorAll('.program-row')];
    const indicator = document.querySelector('.list-indicator');
    const stage = el('program-stage');
    const heading = el('stage-heading');
    const copy = el('stage-copy');
    const note = el('stage-note');
    let active = 'day-camp';

    const positionIndicator = (row) => {
      if (!indicator || !row) return;
      indicator.style.height = `${row.offsetHeight}px`;
      indicator.style.transform = `translateY(${row.offsetTop}px)`;
    };

    const apply = (id) => {
      const data = PROGRAMS[id];
      heading.textContent = data.heading;
      copy.textContent = data.copy;
      note.textContent = data.note;
    };

    const initial = rows.find((row) => row.classList.contains('is-active'));
    if (initial) positionIndicator(initial);
    window.addEventListener('resize', () => positionIndicator(rows.find((row) => row.classList.contains('is-active'))));

    rows.forEach((row) => {
      const select = () => {
        const id = row.dataset.program;
        if (id === active) return;
        active = id;
        rows.forEach((item) => item.classList.toggle('is-active', item === row));
        positionIndicator(row);
        if (reduceMotion.matches || !window.gsap) {
          apply(id);
          return;
        }
        window.gsap.killTweensOf(stage);
        window.gsap.to(stage, {
          opacity: 0,
          y: 4,
          duration: 0.12,
          ease: 'power1.in',
          onComplete: () => {
            apply(id);
            window.gsap.to(stage, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' });
          },
        });
      };
      row.addEventListener('pointerenter', select);
      row.addEventListener('focus', select);
      row.addEventListener('click', select);
    });
  }

  function initCapabilityScenes() {
    const host = el('idea-ocean');
    if (!host || !window.AsciiSharks) return;
    const ocean = window.AsciiSharks.mount(host, {
      height: window.innerWidth < 620 ? 480 : 540, showComposer: true,
      fishCount: 100, sharks: [{kind: 'hammerhead', size: 1}, {kind: 'classic', size: .8}],
      onSubmit: () => {
        el('idea-feedback').textContent = '想法已留在本次演示中。试着继续想一想：谁会用它？怎样操作？做到什么就算成功？';
      },
    });
    const root = ocean.root;
    root.querySelector('.ao-title').textContent = '你想做出什么？';
    const input = root.querySelector('.ao-input');
    input.placeholder = '比如，做一个会游动的海洋世界…';
    input.setAttribute('aria-label', '写下你的作品想法');
    root.querySelector('.ao-send').setAttribute('aria-label', '发送作品想法');
    root.querySelector('.ao-hint').textContent = '互动演示';
    root.querySelector('.ao-history-wrap').hidden = true;
    root.querySelector('.ao-add').hidden = true;
    root.querySelector('.ao-voice').hidden = true;
    root.querySelector('canvas').setAttribute('aria-label', '字符鲨鱼与鱼群。移动指针或轻点水面可与鱼群互动，空格暂停。');
    const style = document.createElement('style');
    style.textContent = '.ao-scene{--ao-bg:#f6f7fa}.ao-title{font-family:inherit;font-size:clamp(26px,4vw,42px)}.ao-composer{max-width:540px}.ao-form{background:#fffffff0}.ao-canvas{touch-action:pan-y}';
    root.append(style);
    let paused = false;
    el('ocean-pause').addEventListener('click', (event) => {
      paused = !paused;
      ocean.update({paused});
      event.currentTarget.textContent = paused ? '播放动效' : '暂停动效';
      event.currentTarget.setAttribute('aria-pressed', String(paused));
    });
  }

  function initBrandIntro() {
    const intro = el('brand-intro');
    let seen = false;
    try { seen = sessionStorage.getItem('makers-intro') === 'seen'; } catch {}
    if (!intro || seen || reduceMotion.matches || !window.BlueFlutedGlass) return;
    intro.hidden = false;
    const scene = window.BlueFlutedGlass.mount(el('brand-intro-scene'), {height: window.innerHeight});
    scene.root.querySelector('.bfg-logo')?.remove();
    let timer;
    const close = () => {
      clearTimeout(timer);
      intro.hidden = true;
      scene.destroy();
      try { sessionStorage.setItem('makers-intro', 'seen'); } catch {}
    };
    el('intro-skip').addEventListener('click', close, {once: true});
    timer = setTimeout(close, 1400);
  }

  /* Events: blog-style cards; the first camp links to its activity video. */
  const REAL_PAST = {
    real: true,
    title: '第一期 · 11 月青少年 AI 线下一日营',
    date: '2026 年 11 月 22 日',
    excerpt: '一天时间，孩子们把自己的点子做成了能运行的作品。点开看这次活动的现场视频。',
    image: './assets/event-2026-11-22.jpg',
    href: 'https://weixin.qq.com/sph/AwtVM1OP01',
  };

  const SAMPLE_EVENTS = [
    {
      sample: 'recruit',
      group: 'upcoming',
      title: '活动招募标题待发布',
      excerpt: '活动流程、适龄与报名入口将在这里呈现。',
      label: '招募页示例',
    },
  ];

  function eventCard(event) {
    const item = document.createElement('a');
    item.className = 'event-item' + (event.image ? ' has-cover' : '');
    if (event.real) {
      item.href = event.href;
      item.target = '_blank';
      item.rel = 'noopener noreferrer';
    } else {
      item.href = event.sample
        ? (standalone ? `./event-demo.html?sample=${event.sample}` : `./event.html?sample=${event.sample}`)
        : `/events/${encodeURIComponent(event.id)}/`;
    }

    if (event.image) {
      const cover = document.createElement('img');
      cover.className = 'event-cover';
      cover.src = event.image;
      cover.alt = `${event.title}封面`;
      cover.loading = 'lazy';
      item.append(cover);
    }

    const meta = document.createElement('span');
    meta.className = 'event-date';
    meta.textContent = event.real ? event.date : event.sample ? event.label : metadata(event);

    const content = document.createElement('span');
    content.className = 'event-content';
    const title = document.createElement('strong');
    title.textContent = event.title;
    const excerpt = document.createElement('small');
    excerpt.textContent = event.real
      ? event.excerpt
      : event.sample
        ? event.excerpt
        : (event.body || '查看活动介绍、报名入口与公众号原文。').slice(0, 100);
    content.append(title, excerpt);

    const arrow = document.createElement('span');
    arrow.className = 'event-read';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.innerHTML = '<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M4.5 11.5L11.5 4.5M11.5 4.5H6M11.5 4.5V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    item.append(meta, content, arrow);
    return item;
  }

  function timeLabel(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric',
    }).format(new Date(value));
  }

  function metadata(event) {
    const now = Date.now();
    const state = event.cancelled ? '已取消' : event.postponed ? '待定' : now < event.start ? '即将开始' : now < event.end ? '进行中' : '已结束';
    const start = timeLabel(event.start);
    const end = timeLabel(event.end ? event.end - 1 : null);
    const range = end && start !== end ? `${start} 至 ${end}` : start;
    return [state, range].filter(Boolean).join(' · ');
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

    const upcoming = near.length ? near : SAMPLE_EVENTS;
    const previous = [REAL_PAST, ...past];
    el('upcoming').replaceChildren(...upcoming.map(eventCard));
    el('past').replaceChildren(...previous.map(eventCard));
    if (!events.length) el('event-source').textContent = '近期安排以正式发布为准；往期回顾已接入第一期一日营实录。';
  }

  async function loadLiveEvents() {
    if (standalone) {
      renderEvents([]);
      return;
    }
    try {
      const response = await fetch('./api/events', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('活动读取失败');
      const result = await response.json();
      if (!Array.isArray(result.events)) throw new Error('活动格式异常');
      el('event-source').textContent = result.source === 'feishu'
        ? (result.stale ? '飞书暂不可用，以下是上次同步的活动。' : '官网活动来自团队活动表。')
        : '近期安排以正式发布为准；往期回顾已接入第一期一日营实录。';
      renderEvents(result.events);
    } catch {
      el('event-source').textContent = '近期安排以正式发布为准；往期回顾已接入第一期一日营实录。';
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
    document.querySelector('[data-program="community"]')?.addEventListener('click', () => open('wecom', true));
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

      const reveals = [
        ['.program-list .program-row', '.program-list', 0.06],
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

  function initIntro() {
    const { gsap } = window;
    if (!gsap || reduceMotion.matches) return;
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.site-header', { y: -14, opacity: 0, duration: 0.55, ease: 'power2.out' });
      gsap.from('.hero-english', { opacity: 0, y: 16, duration: 0.7, delay: 0.55, ease: 'power3.out', clearProps: 'all' });
      gsap.from('.hero-stage', { opacity: 0, y: 30, rotate: 1.6, duration: 0.95, delay: 0.4, ease: 'power3.out', clearProps: 'all' });
    });
  }

  initHeroCardSwap();
  initPrograms();
  initCapabilityScenes();
  initBrandIntro();
  initIntro();
  initEventFilter();
  initQrLightbox();
  initCopyButton();
  initNavigation();
  initScrollMotion();
  loadLiveEvents();
})();
