/* MCU Notes · Shared chrome: top bar, theme, table of contents, pager, site-wide find (Ctrl+K), KaTeX auto-render. */
(function(){
  const EN = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const t = (zh, en) => EN ? en : zh;
  const PAGES = [
    {id:'index',       href:'index.html',       label:t('首頁', 'Home')},
    {id:'core',        href:'core.html',        label:t('01 核心架構', '01 Core'),         ch:'core',   en:'Core & Architecture'},
    {id:'analog',      href:'analog.html',      label:t('02 類比電源', '02 Analog & PMIC'),ch:'analog', en:'Precision Analog & PMIC'},
    {id:'application', href:'application.html', label:t('03 車用應用', '03 Automotive'),    ch:'app',    en:'Automotive & BMS'},
    {id:'process',     href:'process.html',     label:t('04 半導體製程', '04 Process'),     ch:'fab',    en:'HV Process & Silicon'},
    {id:'test',        href:'test.html',        label:t('05 測試校準', '05 Test & AEC'),   ch:'test',   en:'Test, Calibration & AEC'},
    {id:'safety',      href:'safety.html',      label:t('06 功能安全', '06 FuSa & Rel'),    ch:'safety', en:'Functional Safety & Rel'},
    {sep:true},
    {id:'glossary',    href:'glossary.html',    label:t('術語辭典', 'Glossary')},
    {id:'lab',         href:'lab.html',         label:t('互動實驗室', 'MCU Lab')},
    {id:'designer',    href:'designer.html',    label:t('規格設計器', 'Spec Designer')},
    {sep:true},
    {id:'lessons',     href:'lessons.html',     label:t('業界案例', 'Lessons')},
    {id:'roles',       href:'roles.html',       label:t('職務地圖', 'Careers')},
    {id:'quiz',        href:'quiz.html',        label:t('專業測驗', 'Quiz')}
  ];
  const CHAPTERS = PAGES.filter(p => p.ch);
  const page = document.body.dataset.page || 'index';

  const ICON = {
    mcu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="2.5"/><circle cx="12" cy="12" r="3.2" stroke-width="1.6"/><path d="M9 1v3M12 1v3M15 1v3M9 20v3M12 20v3M15 20v3M1 9h3M1 12h3M1 15h3M20 9h3M20 12h3M20 15h3"/></svg>',
    find:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
  };

  /* ---------- theme ---------- */
  const root = document.documentElement;
  function store(k, v){ try{ if(v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch(e){ return null; } }
  const saved = store('mcu-theme');
  if(saved === 'light' || saved === 'dark') root.dataset.theme = saved;
  function isDark(){
    if(root.dataset.theme) return root.dataset.theme === 'dark';
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /* ---------- header ---------- */
  const hdr = document.createElement('header');
  hdr.className = 'top';
  hdr.innerHTML = '<div class="top-in">' +
    '<a class="brand" href="index.html" aria-label="' + t('MCU Notes 首頁', 'MCU Notes home') + '">' + ICON.mcu + '<span>MCU Notes</span></a>' +
    '<nav class="nav" aria-label="' + t('章節', 'Chapters') + '">' + PAGES.filter(p => p.id !== 'index').map(p => p.sep ? '<span class="sep"></span>' :
      '<a href="' + p.href + '"' + (p.id === page ? ' aria-current="page"' : '') + '>' + p.label + '</a>').join('') + '</nav>' +
    '<button class="tbtn" id="findBtn" type="button" title="' + t('搜尋', 'Search') + ' (Ctrl+K)">' + ICON.find + '<span class="lbl">' + t('搜尋', 'Search') + '</span></button>' +
    '<a class="tbtn" id="langBtn" href="#" title="' + t('Switch to English', '切換為中文') + '" lang="' + t('en', 'zh-Hant') + '">' + t('EN', '中') + '</a>' +
    '<button class="tbtn" id="themeBtn" type="button" title="' + t('切換深淺色', 'Toggle theme') + '"></button>' +
    '</div>';
  document.body.prepend(hdr);

  /* language switch */
  const langBtn = hdr.querySelector('#langBtn');
  function langHref(){
    const file = location.pathname.split('/').pop() || 'index.html';
    return (EN ? '../' : 'en/') + file + location.search + location.hash;
  }
  langBtn.href = langHref();
  window.addEventListener('hashchange', () => { langBtn.href = langHref(); });
  langBtn.addEventListener('click', () => { store('mcu-lang', EN ? 'zh' : 'en'); langBtn.href = langHref(); });

  const themeBtn = hdr.querySelector('#themeBtn');
  function paintThemeBtn(){ themeBtn.innerHTML = isDark() ? ICON.sun : ICON.moon; themeBtn.setAttribute('aria-label', isDark() ? t('切換至淺色', 'Switch to light') : t('切換至深色', 'Switch to dark')); }
  paintThemeBtn();
  themeBtn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next; store('mcu-theme', next); paintThemeBtn();
    document.dispatchEvent(new CustomEvent('themechange'));
  });
  if(window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { paintThemeBtn(); document.dispatchEvent(new CustomEvent('themechange')); });
  const navCur = hdr.querySelector('.nav a[aria-current]');
  if(navCur) navCur.scrollIntoView({block:'nearest', inline:'center'});

  /* ---------- TOC + scrollspy ---------- */
  const toc = document.querySelector('.toc');
  const heads = [...document.querySelectorAll('article h2[id]')];
  if(toc && heads.length){
    toc.innerHTML = '<b>' + t('本頁目錄', 'On this page') + '</b>' + heads.map(h => '<a href="#' + h.id + '">' + h.textContent + '</a>').join('');
    const links = new Map([...toc.querySelectorAll('a')].map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if(e.isIntersecting){ links.forEach(a => a.classList.remove('on')); const a = links.get(e.target.id); if(a) a.classList.add('on'); } });
    }, {rootMargin:'-20% 0px -70% 0px'});
    heads.forEach(h => io.observe(h));
  }
  heads.forEach((h, i) => { if(!h.querySelector('.num')) h.insertAdjacentHTML('afterbegin', '<span class="num">' + String(i + 1).padStart(2, '0') + '</span>'); });

  /* ---------- pager ---------- */
  const pager = document.querySelector('.pager');
  const ci = CHAPTERS.findIndex(c => c.id === page);
  if(pager && ci >= 0){
    const prev = CHAPTERS[ci - 1], next = CHAPTERS[ci + 1];
    const name = c => EN ? c.en : c.label + ' · ' + c.en;
    pager.innerHTML = (prev ? '<a href="' + prev.href + '"><small>' + t('← 上一章', '← Previous') + '</small>' + name(prev) + '</a>' : '<span></span>') +
      (next ? '<a class="next" href="' + next.href + '"><small>' + t('下一章 →', 'Next →') + '</small>' + name(next) + '</a>'
            : '<a class="next" href="lab.html"><small>' + t('動手試試 →', 'Try it →') + '</small>' + t('MCU 互動實驗室', 'MCU Lab') + '</a>');
  }

  /* ---------- find (Ctrl+K) ---------- */
  const PAGE_LABEL = EN ? {core:'Core', analog:'Analog', app:'Apps', fab:'Process', test:'Test', safety:'FuSa', glossary:'Glossary', lab:'Lab', designer:'Designer', roles:'Careers', quiz:'Quiz', lessons:'Lessons', index:'Home'}
    : {core:'核心', analog:'類比', app:'應用', fab:'製程', test:'測試', safety:'安全', glossary:'辭典', lab:'實驗室', designer:'設計器', roles:'職務', quiz:'測驗', lessons:'案例', index:'首頁'};

  function openFind(){
    let modal = document.getElementById('findModal');
    if(!modal){
      modal = document.createElement('div');
      modal.id = 'findModal';
      modal.className = 'find-modal';
      modal.innerHTML = '<div class="find-box">' +
        '<div class="find-in">' + ICON.find + '<input type="search" id="findInput" placeholder="' + t('搜尋 MCU 知識、暫存器、類比參數、演算法、車規規範…', 'Search MCU architecture, registers, analog specs, ISO 26262…') + '" autocomplete="off" autofocus></div>' +
        '<div class="find-res" id="findRes"></div>' +
        '<div class="find-foot"><span>' + t('按 ↑↓ 選擇，Enter 開啟，Esc 關閉', 'Use ↑↓ to navigate, Enter to open, Esc to close') + '</span><span>' + t('MCU Notes 快速檢索', 'MCU Notes Search') + '</span></div>' +
        '</div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if(e.target === modal) closeFind(); });
      const inp = modal.querySelector('#findInput');
      inp.addEventListener('input', () => runFind(inp.value));
      inp.addEventListener('keydown', e => {
        const items = [...modal.querySelectorAll('.find-item')];
        const active = modal.querySelector('.find-item.active');
        let idx = items.indexOf(active);
        if(e.key === 'ArrowDown'){ e.preventDefault(); if(items.length){ idx = (idx + 1) % items.length; items.forEach(it=>it.classList.remove('active')); items[idx].classList.add('active'); items[idx].scrollIntoView({block:'nearest'}); } }
        else if(e.key === 'ArrowUp'){ e.preventDefault(); if(items.length){ idx = (idx - 1 + items.length) % items.length; items.forEach(it=>it.classList.remove('active')); items[idx].classList.add('active'); items[idx].scrollIntoView({block:'nearest'}); } }
        else if(e.key === 'Enter'){ if(active){ active.click(); } }
        else if(e.key === 'Escape'){ closeFind(); }
      });
    }
    modal.hidden = false;
    const inp = modal.querySelector('#findInput');
    inp.value = '';
    inp.focus();
    runFind('');
  }

  function closeFind(){
    const modal = document.getElementById('findModal');
    if(modal) modal.hidden = true;
  }

  function runFind(q){
    const res = document.getElementById('findRes');
    if(!res) return;
    const items = (window.SEARCH_INDEX || []).filter(item => {
      if(!q) return true;
      const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      const text = (item.t + ' ' + (item.s || '') + ' ' + item.p).toLowerCase();
      return terms.every(term => text.includes(term));
    }).slice(0, 30);

    if(!items.length){
      res.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">' + t('找不到相關內容', 'No matching results') + '</div>';
      return;
    }

    res.innerHTML = items.map((it, idx) => {
      const href = (EN ? '' : '') + it.p + (it.a ? '#' + it.a : '');
      const tag = PAGE_LABEL[it.g] || it.g;
      return '<a class="find-item' + (idx === 0 ? ' active' : '') + '" href="' + href + '">' +
        '<span class="find-tag" data-g="' + it.g + '">' + tag + '</span>' +
        '<span style="flex:1"><b>' + it.t + '</b>' + (it.s ? '<div class="find-snippet">' + it.s + '</div>' : '') + '</span>' +
        '</a>';
    }).join('');

    res.querySelectorAll('.find-item').forEach(it => {
      it.addEventListener('click', () => closeFind());
    });
  }

  const findBtn = document.getElementById('findBtn');
  if(findBtn) findBtn.addEventListener('click', openFind);
  document.querySelectorAll('[data-open-find]').forEach(btn => btn.addEventListener('click', openFind));
  window.addEventListener('keydown', e => {
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){
      e.preventDefault();
      const modal = document.getElementById('findModal');
      if(modal && !modal.hidden) closeFind(); else openFind();
    } else if(e.key === 'Escape'){
      closeFigModal();
    }
  });

  /* ---------- Figure Zoom Lightbox (Square Icon) ---------- */
  let figModal = null;
  let currentScale = 1.0;
  let panX = 0, panY = 0;
  let isDragging = false;
  let startX = 0, startY = 0;

  function ensureFigModal(){
    if(figModal) return figModal;
    figModal = document.createElement('div');
    figModal.id = 'figModal';
    figModal.className = 'fig-modal';
    figModal.setAttribute('role', 'dialog');
    figModal.setAttribute('aria-modal', 'true');
    figModal.innerHTML = '<div class="fig-modal-box">' +
      '<div class="fig-modal-head">' +
        '<div class="fig-modal-title">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M8 3.5v4.5H3.5M16 3.5v4.5h4.5M8 20.5v-4.5H3.5M16 20.5v-4.5h4.5"/></svg>' +
          '<span id="figModalLabel">' + t('電路原理圖放大檢視', 'Schematic Diagram Viewer') + '</span>' +
        '</div>' +
        '<div class="fig-modal-tools">' +
          '<button class="fig-modal-btn icon-only" id="figZoomOut" type="button" title="' + t('縮小', 'Zoom Out') + ' (−)">−</button>' +
          '<button class="fig-modal-btn" id="figZoomReset" type="button" title="' + t('還原比例', 'Reset Zoom') + '">100%</button>' +
          '<button class="fig-modal-btn icon-only" id="figZoomIn" type="button" title="' + t('放大', 'Zoom In') + ' (+)">+</button>' +
          '<button class="fig-modal-btn icon-only" id="figModalClose" type="button" title="' + t('關閉', 'Close') + ' (Esc)">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="fig-modal-body" id="figModalBody">' +
        '<div class="fig-modal-stage" id="figModalStage"></div>' +
      '</div>' +
      '<div class="fig-modal-foot">' +
        '<span id="figModalCaption"></span>' +
        '<span style="opacity:.75">' + t('滾輪縮放 · 拖曳平移 · Esc 關閉', 'Mouse Wheel: Zoom · Drag: Pan · Esc: Close') + '</span>' +
      '</div>' +
    '</div>';
    document.body.appendChild(figModal);

    const stage = figModal.querySelector('#figModalStage');
    const body = figModal.querySelector('#figModalBody');
    const resetBtn = figModal.querySelector('#figZoomReset');

    function updateTransform(){
      stage.style.transform = `translate(${panX}px, ${panY}px) scale(${currentScale})`;
      resetBtn.textContent = `${Math.round(currentScale * 100)}%`;
    }

    function setZoom(newScale, centerOnMouse = false, clientX = 0, clientY = 0){
      const clamped = Math.max(0.6, Math.min(3.5, newScale));
      if(centerOnMouse){
        const rect = body.getBoundingClientRect();
        const mouseX = clientX - rect.left - rect.width / 2;
        const mouseY = clientY - rect.top - rect.height / 2;
        const factor = clamped / currentScale;
        panX -= (mouseX - panX) * (factor - 1);
        panY -= (mouseY - panY) * (factor - 1);
      }
      currentScale = clamped;
      updateTransform();
    }

    figModal.querySelector('#figZoomIn').addEventListener('click', () => setZoom(currentScale + 0.25));
    figModal.querySelector('#figZoomOut').addEventListener('click', () => setZoom(currentScale - 0.25));
    resetBtn.addEventListener('click', () => { currentScale = 1.0; panX = 0; panY = 0; updateTransform(); });
    figModal.querySelector('#figModalClose').addEventListener('click', closeFigModal);

    figModal.addEventListener('click', e => {
      if(e.target === figModal) closeFigModal();
    });

    body.addEventListener('wheel', e => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      setZoom(currentScale + delta, true, e.clientX, e.clientY);
    }, {passive: false});

    body.addEventListener('mousedown', e => {
      if(e.button !== 0) return;
      isDragging = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      body.classList.add('panning');
    });

    window.addEventListener('mousemove', e => {
      if(!isDragging) return;
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      updateTransform();
    });

    window.addEventListener('mouseup', () => {
      if(isDragging){
        isDragging = false;
        body.classList.remove('panning');
      }
    });

    return figModal;
  }

  function openFigModal(fig){
    const modal = ensureFigModal();
    const svg = fig.querySelector('svg');
    if(!svg) return;
    const caption = fig.querySelector('figcaption');
    const stage = modal.querySelector('#figModalStage');
    const capEl = modal.querySelector('#figModalCaption');
    const labelEl = modal.querySelector('#figModalLabel');

    stage.innerHTML = svg.outerHTML;
    const clonedSvg = stage.querySelector('svg');
    if(clonedSvg){
      clonedSvg.style.width = '100%';
      clonedSvg.style.height = 'auto';
      clonedSvg.style.minWidth = '850px';
    }
    capEl.textContent = caption ? caption.textContent : '';
    const capText = caption ? caption.textContent : '';
    labelEl.textContent = capText ? (capText.split('：')[0].split(':')[0] || capText) : t('電路圖放大檢視', 'Schematic Viewer');

    currentScale = 1.0;
    panX = 0;
    panY = 0;
    stage.style.transform = 'translate(0px, 0px) scale(1)';
    modal.querySelector('#figZoomReset').textContent = '100%';

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeFigModal(){
    if(!figModal) return;
    figModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function initFigureZoom(){
    document.querySelectorAll('.fig').forEach(fig => {
      if(fig.querySelector('.fig-zoom-btn')) return;
      const svg = fig.querySelector('svg');
      if(!svg) return;
      const btn = document.createElement('button');
      btn.className = 'fig-zoom-btn';
      btn.type = 'button';
      btn.title = t('一鍵放大檢視電路圖 (點擊查看高解析原理圖)', 'Click to enlarge schematic diagram');
      btn.setAttribute('aria-label', t('一鍵放大電路圖', 'Enlarge schematic'));
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/>' +
        '<path d="M8 3.5v4.5H3.5M16 3.5v4.5h4.5M8 20.5v-4.5H3.5M16 20.5v-4.5h4.5"/>' +
        '</svg>';
      btn.addEventListener('click', e => {
        e.stopPropagation();
        openFigModal(fig);
      });
      fig.appendChild(btn);
    });
  }

  /* ---------- KaTeX auto-render helper ---------- */
  function tryRenderMath(){
    if(window.renderMathInElement){
      try{
        renderMathInElement(document.body, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '\\[', right: '\\]', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\(', right: '\\)', display: false}
          ],
          throwOnError: false
        });
      }catch(e){ console.warn('KaTeX render error:', e); }
    } else {
      setTimeout(tryRenderMath, 200);
    }
  }
  function initApp(){
    tryRenderMath();
    initFigureZoom();
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();