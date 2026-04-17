/**
 * ChloeIQ Demo — Unified Navigation Layer
 * Drop-in replacement. Loaded by every page via:
 *   <script src="chloeiq-nav.js"></script>
 *
 * What changed in this version:
 *  - MOBILE: defaults to collapsed. Shows a small floating pill button in the
 *    bottom-right corner that's ALWAYS reachable (never overflows off-screen).
 *    Tap the pill → full-screen bottom sheet opens listing every app.
 *    Preference persists across pages via sessionStorage.
 *  - DESKTOP: keeps the existing horizontal pill bar with the − / + collapse
 *    toggle exactly as before.
 *  - Breakpoint: 768px. Auto re-renders on resize / orientationchange.
 *  - Safe-area insets honored for iPhone home indicator.
 *
 * Public API preserved:
 *   window.ChloeIQ.go(appId, params)
 *   window.ChloeIQ.handoff({ title, body, destApp, destParams, confirmLabel })
 *   window.ChloeIQ.redirect(appId, params, delay)
 *   window._navToast(msg, type)
 */

(function () {
  'use strict';

  // ════════════════════════════════════════════════════════════════════════
  // APP REGISTRY — every demo page grouped by flow
  // ════════════════════════════════════════════════════════════════════════
  var APPS = [
    // ── Agent Flow ──
    { id: 'agent-dashboard',   label: 'Agent Dashboard',      file: 'chloeiq-agent-dashboard-desktop.html',   icon: '🏠', group: 'agent' },
    { id: 'followup',          label: 'Follow-Up',            file: 'chloeiq-followup-desktop.html',          icon: '✉️',  group: 'agent' },
    { id: 'listing-dashboard', label: 'Listing Dashboard',    file: 'chloeiq-listing-dashboard-desktop.html', icon: '📋', group: 'agent' },
    { id: 'agent-scorecard',   label: 'Agent Scorecard',      file: 'chloeiq-agent-scorecard-desktop.html',   icon: '🏆', group: 'agent' },
    { id: 'roi-calculator',    label: 'ROI Calculator',       file: 'chloeiq-roi-calculator-desktop.html',    icon: '📈', group: 'agent' },
    { id: 'agent-setup',       label: 'Agent Setup',          file: 'chloeiq-agent-setup-desktop.html',       icon: '⚙️',  group: 'agent' },

    // ── Buyer Journey ──
    { id: 'exterior-code',     label: 'Exterior Chloe Code',  file: 'chloeiq-exterior-code.html',             icon: '🪧', group: 'buyer' },
    { id: 'notify-confirm',    label: 'Showing Confirmed',    file: 'chloeiq-notify-confirm.html',            icon: '✅', group: 'buyer' },
    { id: 'buyer-app',         label: 'Buyer App',            file: 'chloeiq-buyer-app-desktop.html',         icon: '👤', group: 'buyer' },
    { id: 'buyer-app-mobile',  label: 'Buyer App (Mobile)',   file: 'chloeiq-buyer-app.html',                 icon: '📱', group: 'buyer' },
    { id: 'styledna-quiz',     label: 'StyleDNA Quiz',        file: 'chloeiq-styledna-quiz-desktop.html',     icon: '🧬', group: 'buyer' },
    { id: 'home-report',       label: 'Home Report',          file: 'chloeiq-home-report-desktop.html',       icon: '📄', group: 'buyer' },
    { id: 'onboarding',        label: 'Buyer Onboarding',     file: 'chloeiq-onboarding-desktop.html',        icon: '🎯', group: 'buyer' },
    { id: 'tour',              label: 'Live Tour',            file: 'chloeiq-tour-desktop.html',              icon: '🔴', group: 'buyer' },
    { id: 'buyer-heatmap',     label: 'Buyer Heatmap',        file: 'chloeiq-buyer-heatmap-desktop.html',     icon: '🗺', group: 'buyer' },
    { id: 'consumer-landing',  label: 'Consumer Landing',     file: 'chloeiq-consumer-landing.html',          icon: '🏡', group: 'buyer' },

    // ── Marketplace ──
    { id: 'marketplace',       label: 'Marketplace',          file: 'chloeiq-marketplace-desktop.html',       icon: '🛍', group: 'marketplace' },
    { id: 'opportunity-board', label: 'Opportunity Board',    file: 'chloeiq-opportunity-board-desktop.html', icon: '📍', group: 'marketplace' },
    { id: 'sign-manager',      label: 'Sign Manager',         file: 'chloeiq-sign-manager-desktop.html',      icon: '🪧', group: 'marketplace' },

    // ── Platform & Data ──
    { id: 'brokerage',         label: 'Brokerage',            file: 'chloeiq-brokerage-dashboard-desktop.html', icon: '🏢', group: 'platform' },
    { id: 'vendor',            label: 'Vendor Dashboard',     file: 'chloeiq-vendor-dashboard-desktop.html',    icon: '🎯', group: 'platform' },
    { id: 'market-intelligence', label: 'Market Intelligence', file: 'chloeiq-market-intelligence-desktop.html', icon: '📊', group: 'platform' },
    { id: 'market-pulse',      label: 'Market Pulse',         file: 'chloeiq-market-pulse-desktop.html',      icon: '⚡', group: 'platform' },

    // ── Investor & Strategy ──
    { id: 'seed-deck',         label: 'Seed Deck',            file: 'chloeiq-seed-deck-desktop.html',         icon: '💼', group: 'investor' },
    { id: 'feature-mastermind', label: 'Feature Mastermind',  file: 'chloeiq-feature-mastermind-desktop.html', icon: '💡', group: 'investor' },
    { id: 'outreach-kit',      label: 'Outreach Kit',         file: 'chloeiq-outreach-kit-desktop.html',      icon: '📨', group: 'investor' },
    { id: 'landing',           label: 'Landing',              file: 'chloeiq-landing-desktop.html',           icon: '🚀', group: 'investor' },
  ];

  var GROUP_LABELS = {
    agent: 'Agent Flow',
    buyer: 'Buyer Journey',
    marketplace: 'Marketplace',
    platform: 'Platform & Data',
    investor: 'Investor & Strategy'
  };

  var HUB_FILE = 'chloeiq-demo-hub.html';

  // ── Detect current page ──
  var currentFile = (window.location.pathname.split('/').pop() || '').toLowerCase();
  var currentApp = APPS.find(function (a) { return a.file.toLowerCase() === currentFile; }) || null;
  var isHub = currentFile === HUB_FILE.toLowerCase() || currentFile === '' || currentFile === 'index.html';

  // ════════════════════════════════════════════════════════════════════════
  // URL PARAM HELPERS
  // ════════════════════════════════════════════════════════════════════════
  function getParam(key) {
    try { return new URLSearchParams(window.location.search).get(key); }
    catch (e) { return null; }
  }

  function buildURL(file, params) {
    var base = file;
    if (params && Object.keys(params).length) {
      base += '?' + Object.keys(params).map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      }).join('&');
    }
    return base;
  }

  // ════════════════════════════════════════════════════════════════════════
  // SESSION PREFERENCE (persists collapsed/open state across pages)
  // ════════════════════════════════════════════════════════════════════════
  var PREF_KEY = 'ciq_nav_expanded';
  function getPref() {
    try { return sessionStorage.getItem(PREF_KEY); } catch (e) { return null; }
  }
  function setPref(v) {
    try { sessionStorage.setItem(PREF_KEY, v); } catch (e) {}
  }

  // ════════════════════════════════════════════════════════════════════════
  // VIEWPORT DETECTION
  // ════════════════════════════════════════════════════════════════════════
  var MOBILE_BREAKPOINT = 768;
  function isMobile() { return window.innerWidth < MOBILE_BREAKPOINT; }

  // ════════════════════════════════════════════════════════════════════════
  // STYLES
  // ════════════════════════════════════════════════════════════════════════
  var style = document.createElement('style');
  style.id = 'ciq-nav-styles';
  style.textContent = [
    // ── Desktop horizontal pill bar ──
    '#ciq-demo-nav{',
      'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);',
      'background:rgba(19,22,13,.96);border:1px solid rgba(184,224,48,.18);',
      'border-radius:50px;padding:6px 8px;',
      'display:flex;align-items:center;gap:4px;',
      'z-index:99980;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);',
      'box-shadow:0 8px 40px rgba(0,0,0,.6);',
      'max-width:calc(100vw - 32px);',
      'transition:opacity .2s;',
    '}',
    '#ciq-demo-nav.hidden{display:none;}',
    '.ciq-nav-btn{',
      'display:flex;align-items:center;gap:5px;',
      'padding:7px 13px;border-radius:40px;',
      'font-family:"DM Sans",sans-serif;font-size:11.5px;font-weight:500;',
      'cursor:pointer;transition:all .15s;white-space:nowrap;',
      'border:none;background:transparent;color:#8A8F7A;',
    '}',
    '.ciq-nav-btn:hover{background:rgba(238,240,229,.07);color:#EEF0E5;}',
    '.ciq-nav-btn.current{background:rgba(184,224,48,.12);color:#B8E030;}',
    '.ciq-nav-btn.hub{color:#EEF0E5;background:rgba(238,240,229,.05);}',
    '.ciq-nav-btn.hub:hover{background:rgba(184,224,48,.15);color:#B8E030;}',
    '.ciq-nav-sep{width:1px;height:18px;background:rgba(238,240,229,.08);flex-shrink:0;}',
    '.ciq-nav-icon{font-size:13px;line-height:1;}',
    '#ciq-nav-toggle{',
      'width:28px;height:28px;border-radius:50%;',
      'background:rgba(238,240,229,.06);border:1px solid rgba(238,240,229,.1);',
      'display:flex;align-items:center;justify-content:center;',
      'cursor:pointer;color:#8A8F7A;font-size:16px;line-height:1;flex-shrink:0;',
      'transition:all .15s;margin-left:2px;',
    '}',
    '#ciq-nav-toggle:hover{background:rgba(238,240,229,.12);color:#EEF0E5;}',
    '#ciq-back-btn{',
      'display:flex;align-items:center;gap:5px;',
      'padding:6px 10px 6px 8px;border-radius:40px;',
      'font-size:11.5px;cursor:pointer;transition:all .15s;',
      'border:none;background:transparent;color:#8A8F7A;',
      'font-family:"DM Sans",sans-serif;',
    '}',
    '#ciq-back-btn:hover{background:rgba(238,240,229,.07);color:#EEF0E5;}',
    '#ciq-back-btn.hidden{display:none;}',

    // ── Mobile floating FAB ──
    '#ciq-nav-fab{',
      'position:fixed;',
      'bottom:calc(16px + env(safe-area-inset-bottom,0px));',
      'right:calc(16px + env(safe-area-inset-right,0px));',
      'z-index:99980;',
      'display:flex;align-items:center;gap:8px;',
      'padding:10px 16px 10px 12px;',
      'background:rgba(19,22,13,.96);border:1px solid rgba(184,224,48,.28);',
      'border-radius:40px;',
      'box-shadow:0 8px 24px rgba(0,0,0,.55);',
      'backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);',
      'cursor:pointer;',
      'font-family:"DM Sans",sans-serif;font-size:12.5px;font-weight:500;',
      'color:#EEF0E5;',
      'transition:transform .15s,box-shadow .15s;',
      '-webkit-tap-highlight-color:transparent;',
    '}',
    '#ciq-nav-fab:active{transform:scale(0.95);}',
    '#ciq-nav-fab .fab-icon{',
      'width:28px;height:28px;border-radius:50%;',
      'background:rgba(184,224,48,.15);color:#B8E030;',
      'display:flex;align-items:center;justify-content:center;font-size:15px;',
    '}',
    '#ciq-nav-fab .fab-label{max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '#ciq-nav-fab.hidden{display:none;}',

    // ── Mobile bottom sheet ──
    '#ciq-sheet-backdrop{',
      'position:fixed;inset:0;background:rgba(0,0,0,.6);',
      'z-index:99985;opacity:0;pointer-events:none;',
      'transition:opacity .22s ease;',
      '-webkit-tap-highlight-color:transparent;',
    '}',
    '#ciq-sheet-backdrop.open{opacity:1;pointer-events:auto;}',
    '#ciq-sheet{',
      'position:fixed;left:0;right:0;bottom:0;',
      'z-index:99986;',
      'background:#0F120A;border-top:1px solid rgba(184,224,48,.22);',
      'border-radius:20px 20px 0 0;',
      'max-height:85vh;overflow-y:auto;',
      '-webkit-overflow-scrolling:touch;',
      'transform:translateY(100%);transition:transform .28s cubic-bezier(.33,1,.68,1);',
      'padding:10px 0 calc(20px + env(safe-area-inset-bottom,0px));',
      'box-shadow:0 -12px 40px rgba(0,0,0,.5);',
    '}',
    '#ciq-sheet.open{transform:translateY(0);}',
    '.ciq-sheet-grabber{',
      'width:40px;height:4px;border-radius:2px;',
      'background:rgba(238,240,229,.2);',
      'margin:8px auto 14px;',
    '}',
    '.ciq-sheet-header{',
      'display:flex;align-items:center;justify-content:space-between;',
      'padding:0 20px 14px;',
      'border-bottom:1px solid rgba(238,240,229,.06);',
    '}',
    '.ciq-sheet-title{',
      'font-family:"Fraunces",serif;font-size:17px;font-weight:500;color:#EEF0E5;',
    '}',
    '.ciq-sheet-close{',
      'width:34px;height:34px;border-radius:50%;',
      'background:rgba(238,240,229,.08);border:none;',
      'display:flex;align-items:center;justify-content:center;',
      'color:#EEF0E5;font-size:18px;line-height:1;cursor:pointer;',
      '-webkit-tap-highlight-color:transparent;',
    '}',
    '.ciq-sheet-close:active{background:rgba(238,240,229,.15);}',
    '.ciq-sheet-hub{',
      'display:flex;align-items:center;gap:12px;',
      'margin:14px 16px 6px;padding:12px 14px;',
      'background:rgba(184,224,48,.08);border:1px solid rgba(184,224,48,.2);',
      'border-radius:12px;',
      'color:#B8E030;font-family:"DM Sans",sans-serif;font-size:14px;font-weight:500;',
      'cursor:pointer;-webkit-tap-highlight-color:transparent;',
    '}',
    '.ciq-sheet-hub:active{background:rgba(184,224,48,.14);}',
    '.ciq-sheet-hub .hub-icon{font-size:18px;}',
    '.ciq-sheet-group{padding:14px 16px 4px;}',
    '.ciq-sheet-group-label{',
      'font-family:"DM Mono",monospace;font-size:10px;font-weight:500;',
      'color:#8A8F7A;letter-spacing:1px;text-transform:uppercase;',
      'padding:0 4px 8px;',
    '}',
    '.ciq-sheet-item{',
      'display:flex;align-items:center;gap:12px;',
      'padding:12px 14px;border-radius:10px;',
      'color:#EEF0E5;font-family:"DM Sans",sans-serif;font-size:14px;',
      'cursor:pointer;-webkit-tap-highlight-color:transparent;',
      'transition:background .12s;',
    '}',
    '.ciq-sheet-item:active{background:rgba(238,240,229,.06);}',
    '.ciq-sheet-item.current{background:rgba(184,224,48,.1);color:#B8E030;}',
    '.ciq-sheet-item .item-icon{',
      'width:32px;height:32px;border-radius:8px;',
      'background:rgba(238,240,229,.06);',
      'display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;',
    '}',
    '.ciq-sheet-item.current .item-icon{background:rgba(184,224,48,.15);}',
    '.ciq-sheet-item .item-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.ciq-sheet-item .item-chevron{color:#8A8F7A;font-size:14px;}',

    // ── Modals / toasts (unchanged) ──
    '#ciq-nav-toast{',
      'position:fixed;bottom:calc(90px + env(safe-area-inset-bottom,0px));left:50%;',
      'transform:translateX(-50%);',
      'padding:10px 16px;border-radius:10px;',
      'font-family:"DM Sans",sans-serif;font-size:12.5px;',
      'background:#1A1E12;color:#EEF0E5;',
      'border:1px solid rgba(238,240,229,.12);',
      'z-index:99995;',
      'box-shadow:0 8px 24px rgba(0,0,0,.5);',
      'max-width:calc(100vw - 40px);text-align:center;',
      'animation:ciq-toast-in .28s ease;',
    '}',
    '@keyframes ciq-toast-in{from{opacity:0;transform:translate(-50%,10px);}to{opacity:1;transform:translate(-50%,0);}}',
  ].join('');
  document.head.appendChild(style);

  // ════════════════════════════════════════════════════════════════════════
  // BUILD: DESKTOP HORIZONTAL PILL BAR
  // ════════════════════════════════════════════════════════════════════════
  function buildDesktopNav() {
    removeAllNav();

    var nav = document.createElement('div');
    nav.id = 'ciq-demo-nav';

    // Back button
    var backBtn = document.createElement('button');
    backBtn.id = 'ciq-back-btn';
    backBtn.innerHTML = '← Back';
    var hasHistory = window.history.length > 1 && !isHub;
    backBtn.className = hasHistory ? '' : 'hidden';
    backBtn.onclick = function () { window.history.back(); };
    nav.appendChild(backBtn);

    if (hasHistory) {
      var sep0 = document.createElement('div');
      sep0.className = 'ciq-nav-sep';
      nav.appendChild(sep0);
    }

    // Hub button (always first after back)
    if (!isHub) {
      var hubBtn = document.createElement('button');
      hubBtn.className = 'ciq-nav-btn hub';
      hubBtn.innerHTML = '<span class="ciq-nav-icon">📚</span>Hub';
      hubBtn.title = 'Demo Hub';
      hubBtn.onclick = function () { window.location.href = HUB_FILE; };
      nav.appendChild(hubBtn);

      var sepHub = document.createElement('div');
      sepHub.className = 'ciq-nav-sep';
      nav.appendChild(sepHub);
    }

    // Current group's siblings — keeps the bar from overflowing even on desktop
    var groupApps;
    if (currentApp) {
      groupApps = APPS.filter(function (a) { return a.group === currentApp.group; });
    } else {
      // No match (e.g. hub page itself) — show one representative from each group
      var seen = {};
      groupApps = [];
      APPS.forEach(function (a) {
        if (!seen[a.group]) { seen[a.group] = true; groupApps.push(a); }
      });
    }

    groupApps.forEach(function (app, i) {
      var btn = document.createElement('button');
      btn.className = 'ciq-nav-btn' + (currentApp && app.id === currentApp.id ? ' current' : '');
      btn.innerHTML = '<span class="ciq-nav-icon">' + app.icon + '</span>' + app.label;
      btn.title = app.label;
      btn.onclick = function () {
        if (currentApp && app.id === currentApp.id) return;
        window.location.href = app.file;
      };
      nav.appendChild(btn);

      if (i < groupApps.length - 1) {
        var sep = document.createElement('div');
        sep.className = 'ciq-nav-sep';
        nav.appendChild(sep);
      }
    });

    // Collapse toggle
    var sepT = document.createElement('div');
    sepT.className = 'ciq-nav-sep';
    nav.appendChild(sepT);

    var toggle = document.createElement('button');
    toggle.id = 'ciq-nav-toggle';
    toggle.innerHTML = '−';
    toggle.title = 'Hide nav';
    toggle.setAttribute('aria-label', 'Hide nav');
    var collapsed = getPref() === 'collapsed-desktop';
    if (collapsed) applyDesktopCollapsed(nav, toggle, true);

    toggle.onclick = function () {
      collapsed = !collapsed;
      applyDesktopCollapsed(nav, toggle, collapsed);
      setPref(collapsed ? 'collapsed-desktop' : 'expanded');
    };
    nav.appendChild(toggle);

    document.body.appendChild(nav);
  }

  function applyDesktopCollapsed(nav, toggle, collapsed) {
    Array.prototype.slice.call(nav.children).forEach(function (el) {
      if (el === toggle) return;
      el.style.display = collapsed ? 'none' : '';
    });
    toggle.innerHTML = collapsed ? '+' : '−';
    toggle.title = collapsed ? 'Show nav' : 'Hide nav';
    toggle.setAttribute('aria-label', toggle.title);
  }

  // ════════════════════════════════════════════════════════════════════════
  // BUILD: MOBILE FAB + BOTTOM SHEET (default collapsed)
  // ════════════════════════════════════════════════════════════════════════
  function buildMobileNav() {
    removeAllNav();

    // Floating action button (always visible, always reachable)
    var fab = document.createElement('button');
    fab.id = 'ciq-nav-fab';
    fab.setAttribute('aria-label', 'Open demo navigation');
    var label = currentApp ? currentApp.label : (isHub ? 'Demo Hub' : 'Navigate');
    var icon = currentApp ? currentApp.icon : (isHub ? '📚' : '☰');
    fab.innerHTML =
      '<span class="fab-icon">' + icon + '</span>' +
      '<span class="fab-label">' + label + '</span>' +
      '<span style="color:#8A8F7A;font-size:14px;margin-left:2px;">▴</span>';

    fab.onclick = function () { openSheet(); };
    document.body.appendChild(fab);

    // Backdrop + sheet (built once, shown on demand)
    var backdrop = document.createElement('div');
    backdrop.id = 'ciq-sheet-backdrop';
    backdrop.onclick = function () { closeSheet(); };
    document.body.appendChild(backdrop);

    var sheet = document.createElement('div');
    sheet.id = 'ciq-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-label', 'Demo navigation');

    var html = [];
    html.push('<div class="ciq-sheet-grabber"></div>');
    html.push('<div class="ciq-sheet-header">');
    html.push('  <div class="ciq-sheet-title">Jump to…</div>');
    html.push('  <button class="ciq-sheet-close" aria-label="Close">✕</button>');
    html.push('</div>');

    // Hub shortcut
    if (!isHub) {
      html.push('<div class="ciq-sheet-hub" data-hub="1">');
      html.push('  <span class="hub-icon">📚</span>');
      html.push('  <span style="flex:1;">Demo Hub</span>');
      html.push('  <span style="color:#B8E030;">→</span>');
      html.push('</div>');
    }

    // Group each category
    var groups = {};
    APPS.forEach(function (a) {
      if (!groups[a.group]) groups[a.group] = [];
      groups[a.group].push(a);
    });

    Object.keys(GROUP_LABELS).forEach(function (groupKey) {
      var list = groups[groupKey];
      if (!list || !list.length) return;
      html.push('<div class="ciq-sheet-group">');
      html.push('  <div class="ciq-sheet-group-label">' + GROUP_LABELS[groupKey] + '</div>');
      list.forEach(function (app) {
        var isCur = currentApp && app.id === currentApp.id;
        html.push(
          '<div class="ciq-sheet-item' + (isCur ? ' current' : '') + '" data-file="' + app.file + '">' +
            '<span class="item-icon">' + app.icon + '</span>' +
            '<span class="item-label">' + app.label + '</span>' +
            (isCur
              ? '<span style="color:#B8E030;font-size:11px;font-family:DM Mono,monospace;">CURRENT</span>'
              : '<span class="item-chevron">›</span>') +
          '</div>'
        );
      });
      html.push('</div>');
    });

    sheet.innerHTML = html.join('');
    document.body.appendChild(sheet);

    // Wire sheet interactions
    sheet.querySelector('.ciq-sheet-close').onclick = function () { closeSheet(); };

    var hubBtn = sheet.querySelector('.ciq-sheet-hub');
    if (hubBtn) hubBtn.onclick = function () { window.location.href = HUB_FILE; };

    Array.prototype.slice.call(sheet.querySelectorAll('.ciq-sheet-item')).forEach(function (el) {
      var file = el.getAttribute('data-file');
      if (el.classList.contains('current')) {
        el.onclick = function () { closeSheet(); };
        return;
      }
      el.onclick = function () { window.location.href = file; };
    });

    // On mobile we always START collapsed. sessionStorage override allows a
    // user who explicitly opened it to keep it easily accessible, but since
    // the FAB is already minimal, we don't auto-expand.
  }

  function openSheet() {
    var backdrop = document.getElementById('ciq-sheet-backdrop');
    var sheet = document.getElementById('ciq-sheet');
    if (!backdrop || !sheet) return;
    backdrop.classList.add('open');
    sheet.classList.add('open');
    // Prevent body scroll beneath the sheet
    document.body.style.overflow = 'hidden';
  }

  function closeSheet() {
    var backdrop = document.getElementById('ciq-sheet-backdrop');
    var sheet = document.getElementById('ciq-sheet');
    if (!backdrop || !sheet) return;
    backdrop.classList.remove('open');
    sheet.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ════════════════════════════════════════════════════════════════════════
  // CLEANUP + RESIZE HANDLING
  // ════════════════════════════════════════════════════════════════════════
  function removeAllNav() {
    ['ciq-demo-nav', 'ciq-nav-fab', 'ciq-sheet-backdrop', 'ciq-sheet'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.remove();
    });
    document.body.style.overflow = '';
  }

  function render() {
    if (isMobile()) buildMobileNav();
    else buildDesktopNav();
  }

  var resizeTimer = null;
  var lastIsMobile = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var mob = isMobile();
      if (mob !== lastIsMobile) {
        lastIsMobile = mob;
        render();
      }
    }, 120);
  });
  window.addEventListener('orientationchange', function () {
    setTimeout(render, 250);
  });

  // ════════════════════════════════════════════════════════════════════════
  // TOAST
  // ════════════════════════════════════════════════════════════════════════
  function _navToast(msg, type) {
    var old = document.getElementById('ciq-nav-toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.id = 'ciq-nav-toast';
    t.textContent = msg;
    if (type === 'success') {
      t.style.background = '#B8E030';
      t.style.color = '#0A0B07';
      t.style.borderColor = '#B8E030';
    }
    document.body.appendChild(t);
    setTimeout(function () {
      if (t && t.parentNode) {
        t.style.transition = 'opacity .3s';
        t.style.opacity = '0';
        setTimeout(function () { if (t.parentNode) t.remove(); }, 320);
      }
    }, 3200);
  }
  window._navToast = _navToast;

  // ════════════════════════════════════════════════════════════════════════
  // PUBLIC API (preserved for backward compatibility)
  // ════════════════════════════════════════════════════════════════════════
  window.ChloeIQ = window.ChloeIQ || {};

  window.ChloeIQ.go = function (appId, params) {
    var app = APPS.find(function (a) { return a.id === appId; });
    if (!app) return;
    window.location.href = buildURL(app.file, params || {});
  };

  window.ChloeIQ.handoff = function (opts) {
    opts = opts || {};
    var app = APPS.find(function (a) { return a.id === opts.destApp; });
    if (!app) return;
    var destURL = buildURL(app.file, opts.destParams || {});

    var old = document.getElementById('ciq-handoff-modal');
    if (old) old.remove();

    var el = document.createElement('div');
    el.id = 'ciq-handoff-modal';
    el.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:99990;' +
      'display:flex;align-items:center;justify-content:center;padding:16px;';
    el.innerHTML = [
      '<div style="background:#13160D;border:1px solid rgba(184,224,48,.2);',
          'border-radius:14px;padding:24px 28px;min-width:280px;max-width:480px;',
          'width:100%;box-shadow:0 24px 80px rgba(0,0,0,.7);font-family:DM Sans,sans-serif;">',
        '<div style="font-family:DM Mono,monospace;font-size:10px;color:#B8E030;',
            'letter-spacing:.8px;margin-bottom:8px;">',
          app.icon + ' CONTINUE TO ' + app.label.toUpperCase(),
        '</div>',
        '<div style="font-family:Fraunces,serif;font-size:19px;color:#EEF0E5;margin-bottom:10px;">',
          (opts.title || 'Continue?'),
        '</div>',
        '<div style="font-size:13px;color:#8A8F7A;line-height:1.65;margin-bottom:22px;">',
          (opts.body || ''),
        '</div>',
        '<div style="display:flex;gap:10px;justify-content:flex-end;align-items:center;flex-wrap:wrap;">',
          '<button id="ciq-ho-cancel" style="padding:9px 18px;border-radius:8px;',
              'border:1px solid rgba(238,240,229,.1);background:transparent;',
              'color:#8A8F7A;font-family:DM Sans,sans-serif;font-size:13px;cursor:pointer;">',
            'Cancel',
          '</button>',
          '<a href="' + destURL + '" id="ciq-ho-confirm" style="padding:9px 20px;',
              'border-radius:8px;border:none;background:#B8E030;color:#0A0B07;',
              'font-family:DM Sans,sans-serif;font-size:13px;font-weight:600;',
              'cursor:pointer;text-decoration:none;display:inline-flex;',
              'align-items:center;gap:7px;">',
            (opts.confirmLabel || 'Continue to ' + app.label),
            '<span style="font-size:14px;">→</span>',
          '</a>',
        '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(el);
    el.querySelector('#ciq-ho-cancel').onclick = function () { el.remove(); };
    el.onclick = function (e) { if (e.target === el) el.remove(); };
  };

  window.ChloeIQ.redirect = function (appId, params, delay) {
    var app = APPS.find(function (a) { return a.id === appId; });
    if (!app) return;
    var url = buildURL(app.file, params || {});
    setTimeout(function () { window.location.href = url; }, delay || 400);
  };

  // ════════════════════════════════════════════════════════════════════════
  // URL PARAM ROUTING (preserved from prior versions — per-app handlers)
  // ════════════════════════════════════════════════════════════════════════
  function handleIncomingParams() {
    var view = getParam('view');
    var action = getParam('action');
    var address = getParam('address');
    var zip = getParam('zip');
    var from = getParam('from');

    if (!view && !action && !from) return;

    var appId = currentApp ? currentApp.id : null;

    if (appId === 'agent-dashboard' || appId === 'agent') {
      if (view && window.switchView) {
        var labelMap = {
          openhouses: 'Open Houses', followup: 'Follow-Up', leads: 'Leads',
          home: 'Dashboard', score: 'Host Score', chloecodes: 'Chloe Codes'
        };
        setTimeout(function () {
          try { window.switchView(view, labelMap[view] || view, null); } catch (e) {}
        }, 200);
      }
    }

    if (appId === 'opportunity-board' || appId === 'opportunity') {
      if (view === 'list' && window.showListView) {
        setTimeout(function () { try { window.showListView(); } catch (e) {} }, 200);
      }
      if (zip) {
        setTimeout(function () {
          var opps = window.opportunities;
          if (!opps) return;
          var idx = -1;
          for (var i = 0; i < opps.length; i++) {
            if (opps[i].zip === zip) { idx = i; break; }
          }
          if (idx >= 0) {
            window.selectedOpp = idx;
            try { if (window.buildDetailPanel) window.buildDetailPanel(); } catch (e) {}
            try { if (window.highlightPin) window.highlightPin(idx); } catch (e) {}
          }
        }, 500);
      }
    }

    if (appId === 'vendor') {
      var vLabels = {
        overview: 'Overview', audience: 'Audience Intelligence',
        campaigns: 'Campaigns', creator: 'Campaign Creator',
        pricing: 'Pricing & Plans', settings: 'Settings'
      };
      if (view && window.switchView) {
        setTimeout(function () {
          try { window.switchView(view, vLabels[view] || view); } catch (e) {}
        }, 200);
      }
    }

    // Show context toast when coming from another app
    if (from) {
      var fromApp = APPS.find(function (a) { return a.id === from; });
      if (fromApp) {
        setTimeout(function () {
          _navToast('↩ From ' + fromApp.icon + ' ' + fromApp.label);
        }, 600);
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // BOOT
  // ════════════════════════════════════════════════════════════════════════
  function boot() {
    lastIsMobile = isMobile();
    render();
    handleIncomingParams();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
