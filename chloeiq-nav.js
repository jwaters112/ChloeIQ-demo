/**
 * ChloeIQ Desktop Demo — Unified Navigation Layer
 * Inject via: <script src="chloeiq-nav.js"></script> at end of <body>
 *
 * Features:
 *  - Floating demo nav bar (jump between all apps)
 *  - URL param routing (?view=X&address=Y&action=Z)
 *  - Cross-app deep-link helpers
 *  - Option-C modal flow (confirm → continue to destination)
 */

(function () {
  'use strict';


  // ── THEME READER — reads from localStorage, applies on every page load ──
  (function applyLockedTheme() {
  // ChloeIQ locked to Apple Light design system
  var r = document.documentElement;
  r.style.setProperty('--bg',  '#F5F5F7');
  r.style.setProperty('--s1',  '#FFFFFF');
  r.style.setProperty('--s2',  '#F0F0F2');
  r.style.setProperty('--s3',  '#E8E8EA');
  r.style.setProperty('--s4',  '#E0E0E2');
  r.style.setProperty('--acc', '#1D6F42');
  r.style.setProperty('--ad',  'rgba(29,111,66,.10)');
  r.style.setProperty('--am',  'rgba(29,111,66,.18)');
  r.style.setProperty('--tx',  '#1D1D1F');
  r.style.setProperty('--txm', '#6E6E73');
  r.style.setProperty('--txd', '#AEAEB2');
  r.style.setProperty('--br',  'rgba(29,111,66,.25)');
  r.style.setProperty('--bs',  'rgba(0,0,0,.08)');
  r.style.setProperty('--grn', '#1D6F42');
  r.style.setProperty('--red', '#D93025');
  r.style.setProperty('--amb', '#B06000');
  r.style.setProperty('--blu', '#1A56DB');
  r.style.setProperty('--pur', '#6741D9');
  r.style.setProperty('--radius', '11px');

  // Force body background + color immediately (prevents flash)
  document.documentElement.style.background = '#F5F5F7';
  document.documentElement.style.color = '#1D1D1F';

  // Inject override style to beat any hardcoded backgrounds
  var styleTag = document.getElementById('ciq-theme-override');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'ciq-theme-override';
    (document.head || document.documentElement).appendChild(styleTag);
  }
  styleTag.textContent = [
    'html, body { background: #F5F5F7 !important; color: #1D1D1F !important; }',
    ':root {',
    '  --bg:#F5F5F7;--s1:#FFFFFF;--s2:#F0F0F2;--s3:#E8E8EA;',
    '  --acc:#1D6F42;--ad:rgba(29,111,66,.10);--am:rgba(29,111,66,.18);',
    '  --tx:#1D1D1F;--txm:#6E6E73;--txd:#AEAEB2;',
    '  --br:rgba(29,111,66,.25);--bs:rgba(0,0,0,.08);',
    '}'
  ].join('\n');
})();

  // ── APP REGISTRY ──
  var APPS = [
    // ── Agent Flow ──
    { id: 'agent',   label: 'Agent Dashboard',      file: 'chloeiq-agent-dashboard-desktop.html',       icon: '🏠', color: '#B8E030', group: 'agent' },
    { id: 'followup',          label: 'Follow-Up',            file: 'chloeiq-followup-desktop.html',              icon: '✉️',  color: '#B8E030', group: 'agent' },
    { id: 'listing-dashboard', label: 'Listing Dashboard',    file: 'chloeiq-listing-dashboard-desktop.html',     icon: '📋', color: '#B8E030', group: 'agent' },
    { id: 'agent-scorecard',   label: 'Agent Scorecard',      file: 'chloeiq-agent-scorecard-desktop.html',       icon: '🏆', color: '#B8E030', group: 'agent' },
    { id: 'roi-calculator',    label: 'ROI Calculator',       file: 'chloeiq-roi-calculator-desktop.html',        icon: '📈', color: '#B8E030', group: 'agent' },
    { id: 'agent-setup',       label: 'Agent Setup',          file: 'chloeiq-agent-setup-desktop.html',           icon: '⚙️',  color: '#B8E030', group: 'agent' },
    // ── Buyer Journey ──
    { id: 'early-adopter-deck',  label: 'Early Partner Deck',   file: 'chloeiq-early-adopter-deck.html',            icon: '🤝', color: '#F5A623', group: 'platform' },
    { id: 'consumer-landing',   label: 'Buyer Landing',        file: 'chloeiq-consumer-landing.html',              icon: '🌟', color: '#B8E030', group: 'buyer' },
    { id: 'exterior-code',     label: 'Exterior Chloe Code',  file: 'chloeiq-exterior-code.html',                 icon: '🪧', color: '#B8E030', group: 'buyer' },
    { id: 'notify-confirm',    label: 'Notify Confirm',       file: 'chloeiq-notify-confirm.html',                icon: '✅', color: '#4ADE80', group: 'buyer' },
    { id: 'buyer-app',         label: 'Buyer App',            file: 'chloeiq-buyer-app-desktop.html',             icon: '👤', color: '#60A5FA', group: 'buyer' },
    { id: 'styledna-quiz',     label: 'StyleDNA Quiz',        file: 'chloeiq-styledna-quiz-desktop.html',         icon: '🧬', color: '#60A5FA', group: 'buyer' },
    { id: 'home-report',       label: 'Home Report',          file: 'chloeiq-home-report-desktop.html',           icon: '📄', color: '#60A5FA', group: 'buyer' },
    { id: 'onboarding',        label: 'Buyer Onboarding',     file: 'chloeiq-onboarding-desktop.html',            icon: '🎯', color: '#60A5FA', group: 'buyer' },
    { id: 'tour',              label: 'Live Tour',            file: 'chloeiq-tour-desktop.html',                  icon: '🔴', color: '#60A5FA', group: 'buyer' },
    { id: 'buyer-heatmap',     label: 'Buyer Heatmap',        file: 'chloeiq-buyer-heatmap-desktop.html',         icon: '🗺', color: '#60A5FA', group: 'buyer' },
    // ── Marketplace ──
    { id: 'opportunity',       label: 'Opportunity Board',    file: 'chloeiq-opportunity-board-desktop.html',     icon: '📍', color: '#4ADE80', group: 'mktplace' },
    { id: 'marketplace',       label: 'Marketplace',          file: 'chloeiq-marketplace-desktop.html',           icon: '🏪', color: '#4ADE80', group: 'mktplace' },
    { id: 'sign-manager',      label: 'Sign Manager',         file: 'chloeiq-sign-manager-desktop.html',          icon: '🪧', color: '#4ADE80', group: 'mktplace' },
    // ── Platform & Data ──
    { id: 'brokerage',         label: 'Brokerage',            file: 'chloeiq-brokerage-dashboard-desktop.html',   icon: '🏢', color: '#F5A623', group: 'platform' },
    { id: 'market',            label: 'Market Intelligence',  file: 'chloeiq-market-intelligence-desktop.html',   icon: '📊', color: '#F5A623', group: 'platform' },
    { id: 'vendor',            label: 'Vendor Dashboard',     file: 'chloeiq-vendor-dashboard-desktop.html',      icon: '🎯', color: '#F5A623', group: 'platform' },
    // ── Investor & Strategy ──
    { id: 'seed',              label: 'Seed Deck',            file: 'chloeiq-seed-deck-desktop.html',             icon: '💼', color: '#FB923C', group: 'investor' },
    { id: 'feature-mastermind',label: 'Feature Mastermind',   file: 'chloeiq-feature-mastermind-desktop.html',    icon: '🗺', color: '#FB923C', group: 'investor' },
    { id: 'outreach-kit',      label: 'Outreach Kit',         file: 'chloeiq-outreach-kit-desktop.html',          icon: '📦', color: '#FB923C', group: 'investor' },
    { id: 'landing',           label: 'Landing Page',         file: 'chloeiq-landing-desktop.html',               icon: '🌐', color: '#FB923C', group: 'investor' },
  ];

  // Detect current app from filename
  var currentFile = window.location.pathname.split('/').pop() || '';
  var currentApp = APPS.find(function(a) { return a.file === currentFile; }) || APPS[0];

  // ── URL PARAM HELPERS ──
  function getParam(key) {
    return new URLSearchParams(window.location.search).get(key);
  }

  function buildURL(file, params) {
    var base = file;
    if (params && Object.keys(params).length) {
      base += '?' + Object.keys(params).map(function(k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      }).join('&');
    }
    return base;
  }

  // ── CROSS-APP NAVIGATE ──
  window.ChloeIQ = {
    go: function(appId, params) {
      var app = APPS.find(function(a) { return a.id === appId; });
      if (!app) return;
      window.location.href = buildURL(app.file, params || {});
    },

    // Option-C: confirm modal → "Continue to X" button
    handoff: function(opts) {
      // opts: { title, body, destApp, destParams, confirmLabel }
      var app = APPS.find(function(a) { return a.id === opts.destApp; });
      if (!app) return;
      var destURL = buildURL(app.file, opts.destParams || {});

      var old = document.getElementById('ciq-handoff-modal');
      if (old) old.remove();

      var el = document.createElement('div');
      el.id = 'ciq-handoff-modal';
      el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:99990;display:flex;align-items:center;justify-content:center;';
      el.innerHTML = [
        '<div style="background:#13160D;border:1px solid rgba(184,224,48,.2);border-radius:14px;padding:28px 32px;min-width:420px;max-width:500px;box-shadow:0 24px 80px rgba(0,0,0,.7);">',
          '<div style="font-family:DM Mono,monospace;font-size:10px;color:#B8E030;letter-spacing:.8px;margin-bottom:8px;">',
            app.icon + ' CONTINUE TO ' + app.label.toUpperCase(),
          '</div>',
          '<div style="font-family:Fraunces,serif;font-size:20px;color:#EEF0E5;margin-bottom:10px;">' + (opts.title || 'Continue?') + '</div>',
          '<div style="font-size:13px;color:#8A8F7A;line-height:1.65;margin-bottom:22px;">' + (opts.body || '') + '</div>',
          '<div style="display:flex;gap:10px;justify-content:flex-end;align-items:center;">',
            '<button id="ciq-ho-cancel" style="padding:8px 18px;border-radius:8px;border:1px solid rgba(238,240,229,.08);background:transparent;color:#8A8F7A;font-family:DM Sans,sans-serif;font-size:13px;cursor:pointer;">Cancel</button>',
            '<a href="' + destURL + '" id="ciq-ho-confirm" style="padding:8px 22px;border-radius:8px;border:none;background:#B8E030;color:#0A0B07;font-family:DM Sans,sans-serif;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:7px;">',
              (opts.confirmLabel || 'Continue to ' + app.label),
              '<span style="font-size:14px;">→</span>',
            '</a>',
          '</div>',
        '</div>'
      ].join('');

      document.body.appendChild(el);
      el.querySelector('#ciq-ho-cancel').onclick = function() { el.remove(); };
      el.onclick = function(e) { if (e.target === el) el.remove(); };
    },

    // Simple cross-app toast then redirect
    redirect: function(appId, params, delay) {
      var app = APPS.find(function(a) { return a.id === appId; });
      if (!app) return;
      var url = buildURL(app.file, params || {});
      setTimeout(function() { window.location.href = url; }, delay || 400);
    }
  };

  // ── INJECT STYLES ──
  var style = document.createElement('style');
  style.textContent = [
    '#ciq-demo-nav{',
      'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);',
      'background:rgba(19,22,13,.96);border:1px solid rgba(184,224,48,.18);',
      'border-radius:50px;padding:6px 8px;',
      'display:flex;align-items:center;gap:4px;',
      'z-index:99980;backdrop-filter:blur(12px);',
      'box-shadow:0 8px 40px rgba(0,0,0,.6);',
      'transition:opacity .2s;',
    '}',
    '#ciq-demo-nav.hidden{opacity:0;pointer-events:none;}',
    '.ciq-nav-btn{',
      'display:flex;align-items:center;gap:5px;',
      'padding:7px 13px;border-radius:40px;',
      'font-family:DM Sans,sans-serif;font-size:11.5px;font-weight:500;',
      'cursor:pointer;transition:all .15s;white-space:nowrap;',
      'border:none;background:transparent;color:#8A8F7A;',
    '}',
    '.ciq-nav-btn:hover{background:rgba(238,240,229,.07);color:#EEF0E5;}',
    '.ciq-nav-btn.current{background:rgba(184,224,48,.12);color:#B8E030;}',
    '.ciq-nav-sep{width:1px;height:18px;background:rgba(238,240,229,.08);flex-shrink:0;}',
    '.ciq-nav-icon{font-size:13px;line-height:1;}',
    '#ciq-nav-toggle{',
      'width:26px;height:26px;border-radius:50%;',
      'background:rgba(238,240,229,.06);border:1px solid rgba(238,240,229,.08);',
      'display:flex;align-items:center;justify-content:center;',
      'cursor:pointer;color:#8A8F7A;font-size:14px;flex-shrink:0;',
      'transition:all .15s;margin-left:2px;',
    '}',
    '#ciq-nav-toggle:hover{background:rgba(238,240,229,.1);color:#EEF0E5;}',
    '#ciq-back-btn{',
      'display:flex;align-items:center;gap:5px;',
      'padding:6px 10px 6px 8px;border-radius:40px;',
      'font-size:11.5px;cursor:pointer;transition:all .15s;',
      'border:none;background:transparent;color:#8A8F7A;',
      'font-family:DM Sans,sans-serif;',
    '}',
    '#ciq-back-btn:hover{background:rgba(238,240,229,.07);color:#EEF0E5;}',
    '#ciq-back-btn.hidden{display:none;}',
  ].join('');
  document.head.appendChild(style);

  // ── BUILD NAV BAR ──
  function buildNav() {
    var nav = document.createElement('div');
    nav.id = 'ciq-demo-nav';

    // Back button
    var backBtn = document.createElement('button');
    backBtn.id = 'ciq-back-btn';
    backBtn.innerHTML = '← Back';
    backBtn.className = window.history.length > 1 ? '' : 'hidden';
    backBtn.onclick = function() { window.history.back(); };
    nav.appendChild(backBtn);

    // Hub button — always show
    var hubBtn = document.createElement('button');
    hubBtn.className = 'ciq-nav-btn';
    hubBtn.innerHTML = '<span class="ciq-nav-icon">🗂</span>Hub';
    hubBtn.title = 'Demo Hub';
    hubBtn.onclick = function() { window.location.href = 'chloeiq-demo-hub.html'; };
    nav.appendChild(hubBtn);

    var sep0 = document.createElement('div');
    sep0.className = 'ciq-nav-sep';
    nav.appendChild(sep0);

    // Show apps in same group as current page, or all if no group match
    var groupApps = currentApp.group
      ? APPS.filter(function(a) { return a.group === currentApp.group; })
      : APPS;

    // If group has more than 6, just show current + 5 nearest
    if (groupApps.length > 6) groupApps = groupApps.slice(0, 6);

    groupApps.forEach(function(app, i) {
      var btn = document.createElement('button');
      btn.className = 'ciq-nav-btn' + (app.id === currentApp.id ? ' current' : '');
      btn.innerHTML = '<span class="ciq-nav-icon">' + app.icon + '</span>' + app.label;
      btn.title = app.label;
      btn.onclick = function() {
        if (app.id === currentApp.id) return;
        window.location.href = app.file;
      };
      nav.appendChild(btn);

      if (i < groupApps.length - 1) {
        var sep = document.createElement('div');
        sep.className = 'ciq-nav-sep';
        nav.appendChild(sep);
      }
    });

    // Hide/show toggle
    var sep2 = document.createElement('div');
    sep2.className = 'ciq-nav-sep';
    nav.appendChild(sep2);

    var toggle = document.createElement('div');
    toggle.id = 'ciq-nav-toggle';
    toggle.innerHTML = '–';
    toggle.title = 'Hide nav';
    var collapsed = false;
    toggle.onclick = function() {
      collapsed = !collapsed;
      // Hide all nav buttons except toggle itself
      Array.from(nav.children).forEach(function(el) {
        if (el !== toggle && el !== sep2) el.style.display = collapsed ? 'none' : '';
      });
      toggle.innerHTML = collapsed ? '+' : '–';
      toggle.title = collapsed ? 'Show nav' : 'Hide nav';
    };
    nav.appendChild(toggle);

    document.body.appendChild(nav);
  }

  // ── HANDLE INCOMING URL PARAMS ──
  function handleIncomingParams() {
    var view    = getParam('view');
    var action  = getParam('action');
    var address = getParam('address');
    var zip     = getParam('zip');
    var from    = getParam('from');

    if (!view && !action) return;

    // Each app handles its own params
    var appId = currentApp.id;

    if (appId === 'agent') {
      // ?view=openhouses → switch to Open Houses view
      // ?view=followup   → switch to Follow-Up view
      // ?view=leads      → switch to Leads view
      if (view && window.switchView) {
        var labelMap = {
          openhouses: 'Open Houses', followup: 'Follow-Up', leads: 'Leads',
          home: 'Dashboard', score: 'Host Score', chloecodes: 'Chloe Codes'
        };
        setTimeout(function() {
          switchView(view, labelMap[view] || view, null);
          // If address passed, pre-fill the new open house form
          if (address && view === 'openhouses') {
            setTimeout(function() {
              var toast = window._ciqToast || function(){};
              // Show a welcome context toast
              _navToast('📍 ' + decodeURIComponent(address) + (zip ? ' · ' + zip : '') + ' — ready to set up', 'success');
            }, 300);
          }
        }, 200);
      }
    }

    if (appId === 'brokerage') {
      var bLabels = {
        overview:'Overview', agents:'Agents', listings:'Listings',
        insights:'Insights', revenue:'Revenue Attribution', coaching:'Coaching Queue',
        onboarding:'Onboarding Progress', leaderboard:'Team Leaderboard',
        export:'Export Reports', market:'Market Comparison'
      };
      if (view && window.switchView) {
        setTimeout(function() { switchView(view, bLabels[view] || view); }, 200);
      }
    }

    if (appId === 'market') {
      var mLabels = {
        demand:'Demand Overview', dna:'DNA Trends', zip:'By ZIP Code',
        forecast:'30-Day Forecast', segments:'Buyer Segments',
        priceintel:'Price Intelligence', aiprojections:'AI Projections',
        mktreports:'Market Reports'
      };
      if (view && window.switchView) {
        setTimeout(function() { switchView(view, mLabels[view] || view); }, 200);
        if (zip) {
          setTimeout(function() {
            // Highlight the ZIP in the ZIP view
            var zipData = window.zipData;
            if (zipData) {
              var idx = zipData.findIndex ? zipData.findIndex(function(z){ return z.zip === zip; }) : -1;
              if (idx >= 0 && window.selectedZIP !== undefined) {
                window.selectedZIP = idx;
                if (window.buildZIPRows) window.buildZIPRows();
              }
            }
          }, 400);
        }
      }
    }

    if (appId === 'opportunity') {
      // ?view=map or ?view=list, ?zip=75022 to highlight a zip
      if (view === 'list' && window.showListView) {
        setTimeout(function() { showListView(); }, 200);
      }
      if (zip) {
        setTimeout(function() {
          var opps = window.opportunities;
          if (!opps) return;
          var idx = -1;
          for (var i = 0; i < opps.length; i++) {
            if (opps[i].zip === zip) { idx = i; break; }
          }
          if (idx >= 0) {
            window.selectedOpp = idx;
            if (window.buildDetailPanel) window.buildDetailPanel();
            if (window.highlightPin) window.highlightPin(idx);
            if (window.openScorecard) {
              setTimeout(function() { window.openScorecard(idx); }, 400);
            }
          }
        }, 500);
      }
    }

    if (appId === 'vendor') {
      var vLabels = {
        overview:'Overview', audience:'Audience Intelligence',
        campaigns:'Campaigns', creator:'Campaign Creator',
        pricing:'Pricing & Plans', settings:'Settings'
      };
      if (view && window.switchView) {
        setTimeout(function() { switchView(view, vLabels[view] || view); }, 200);
        if (view === 'creator' && window.setCreatorStep) {
          setTimeout(function() { setCreatorStep(1); }, 300);
        }
      }
    }

    // Show incoming context toast
    if (from) {
      var fromApp = APPS.find(function(a) { return a.id === from; });
      if (fromApp) {
        setTimeout(function() {
          _navToast('↩ From ' + fromApp.icon + ' ' + fromApp.label, '');
        }, 600);
      }
    }
  }

  function _navToast(msg, type) {
    var old = document.getElementById('ciq-nav-toast'); if (old) old.remove();
    var t = document.createElement('div'); t.id = 'ciq-nav-toast';
    t.textContent = msg;
    var bg = type === 'success' ? '#B8E030' : '#1A1E12';
    var col = type === 'success' ? '#0A0B07' : '#EEF0E5';
    t.style.cssText = 'position:fixed;top:70px;left:50%;transform:translateX(-50%) translateY(-10px);background:' + bg + ';color:' + col + ';padding:9px 18px;border-radius:8px;font-family:DM Sans,sans-serif;font-size:12px;font-weight:500;z-index:99989;opacity:0;transition:all .2s;pointer-events:none;box-shadow:0 4px 20px rgba(0,0,0,.4);border:1px solid rgba(184,224,48,.15);';
    document.body.appendChild(t);
    requestAnimationFrame(function() { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
    setTimeout(function() { t.style.opacity = '0'; }, 3000);
  }

  // ── PATCH CROSS-APP ACTIONS IN EACH FILE ──
  // These run after DOMContentLoaded so the page's own JS has already run
  function patchCrossAppActions() {
    var appId = currentApp.id;

    // ── AGENT DASHBOARD patches ──
    if (appId === 'agent') {
      // "Follow Up" button → go to Follow-Up view (already internal, just ensure)
      // "Draft All Follow-Ups" → same
      // "New Open House" / "Schedule" → go to Open Houses view
      // "Boost My Score" → stay internal (already modal)
      // These are already handled internally; nothing to patch for cross-app
    }

    // ── BROKERAGE patches ──
    if (appId === 'brokerage') {
      // Clicking an agent row → go to Agent Dashboard
      document.querySelectorAll('#agents-list .trow').forEach(function(row) {
        row.addEventListener('click', function() {
          ChloeIQ.handoff({
            title: 'View Agent Dashboard',
            body: 'Open the full Agent Dashboard to see this agent\'s leads, Host Score, open houses, and follow-up queue.',
            destApp: 'agent',
            destParams: { from: 'brokerage', view: 'home' },
            confirmLabel: 'Open Agent Dashboard →'
          });
        });
      });

      // "View Insights" → Market Intelligence
      var insBtn = document.getElementById('ov-btn-insights');
      if (insBtn) {
        var origClick = insBtn.onclick;
        insBtn.onclick = null;
        insBtn.addEventListener('click', function() {
          ChloeIQ.handoff({
            title: 'Market Intelligence',
            body: 'Open the full Market Intelligence dashboard for DFW demand trends, DNA analysis, ZIP rankings, and AI forecasts.',
            destApp: 'market',
            destParams: { from: 'brokerage', view: 'demand' },
            confirmLabel: 'Open Market Intelligence →'
          });
        });
      }

      // Coaching Queue nav item → also offer jump to agent
      document.querySelectorAll('#coaching-cards .panel').forEach(function(card, i) {
        var schedBtn = card.querySelector('[data-coach-call]');
        if (schedBtn) {
          schedBtn.addEventListener('click', function(e) {
            // Already has modal — after it fires, offer agent dashboard
          });
        }
      });
    }

    // ── OPPORTUNITY BOARD patches ──
    if (appId === 'opportunity') {
      // Patch "Set Up Open House" buttons — Option C flow
      function patchSetupButtons() {
        document.querySelectorAll('[data-setup]').forEach(function(btn) {
          // Remove old listener by cloning
          var newBtn = btn.cloneNode(true);
          btn.parentNode.replaceChild(newBtn, btn);
          newBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var b = e.target.closest('[data-setup]');
            var idx = parseInt(b ? b.getAttribute('data-setup') : 0);
            var opps = window.opportunities;
            var o = opps ? opps[idx] : null;
            var addrText = o ? o.addr + ', ' + o.area + ' TX ' + o.zip : 'selected property';
            ChloeIQ.handoff({
              title: 'Set Up Open House at ' + (o ? o.area : 'this property'),
              body: 'Deploy a Chloe Code open house event at <strong>' + addrText + '</strong>. The Agent Dashboard will open with this address pre-loaded so you can configure your event and generate the Chloe Code.',
              destApp: 'agent',
              destParams: {
                from: 'opportunity',
                view: 'openhouses',
                address: o ? o.addr : '',
                zip: o ? o.zip : ''
              },
              confirmLabel: 'Continue to Agent Dashboard →'
            });
          });
        });

        // Also patch scorecard "Set Up Open House" button
        var scActionBtn = document.getElementById('sc-action-btn');
        if (scActionBtn) {
          scActionBtn.onclick = function() {
            var idx = window.selectedOpp || 0;
            var opps = window.opportunities;
            var o = opps ? opps[idx] : null;
            document.getElementById('scorecard-overlay').classList.remove('open');
            ChloeIQ.handoff({
              title: 'Set Up Open House' + (o ? ' at ' + o.area : ''),
              body: 'Open the Agent Dashboard to configure a Chloe Code open house event' + (o ? ' at <strong>' + o.addr + ', ' + o.area + '</strong>' : '') + '. The address and ZIP will be pre-loaded.',
              destApp: 'agent',
              destParams: {
                from: 'opportunity',
                view: 'openhouses',
                address: o ? o.addr : '',
                zip: o ? o.zip : ''
              },
              confirmLabel: 'Continue to Agent Dashboard →'
            });
          };
        }
      }

      // Run after buildDetailPanel populates buttons
      var origBuildDetailPanel = window.buildDetailPanel;
      if (origBuildDetailPanel) {
        window.buildDetailPanel = function() {
          origBuildDetailPanel();
          setTimeout(patchSetupButtons, 50);
        };
      }
      setTimeout(patchSetupButtons, 600);

      // "Export Report" in scorecard → stays local (PDF export)
      // "Set Zone Alert" → stays local

      // Alert items clicking through → map (already handled)

      // List view "Set Up Open House" equivalent — rows with events=0
      var origBuildListRows = window.buildListRows;
      if (origBuildListRows) {
        window.buildListRows = function() {
          origBuildListRows();
          // After rows render, no extra setup needed — scorecard handles it
        };
      }
    }

    // ── VENDOR DASHBOARD patches ──
    if (appId === 'vendor') {
      // DNA segment "Target This Segment" already goes to creator (internal)
      // "Contact Sales" → could go to seed deck contact slide
      var scaleBtn = document.getElementById('price-scale-btn');
      if (scaleBtn) {
        scaleBtn.addEventListener('click', function() {
          ChloeIQ.handoff({
            title: 'Talk to the ChloeIQ Team',
            body: 'The Scale plan is custom-quoted for enterprise vendors. View the investor deck for full platform capabilities, or reach out directly to josh@chloeiq.com.',
            destApp: 'seed',
            destParams: { from: 'vendor', view: 'contact' },
            confirmLabel: 'View Investor Deck →'
          });
        });
      }

      // Overview campaign rows → go to campaigns view (already internal)
      // "Download Report" → local PDF
    }

    // ── MARKET INTELLIGENCE patches ──
    if (appId === 'market') {
      // ZIP detail "Set ZIP Alert" / "Export" → local
      // Properties in demand table → go to opportunity board
      document.querySelectorAll('#view-demand .trow:not(.thead)').forEach(function(row) {
        row.addEventListener('click', function() {
          var nameEl = row.querySelector('.n');
          var name = nameEl ? nameEl.textContent : '';
          // Extract ZIP from the subtitle
          var subEl = row.querySelector('.s');
          var sub = subEl ? subEl.textContent : '';
          var zipMatch = sub.match(/\d{5}/);
          var zip = zipMatch ? zipMatch[0] : '';
          ChloeIQ.handoff({
            title: 'View on Opportunity Board',
            body: 'Open the Opportunity Board to see the full demand scorecard, buyer DNA breakdown, and set up a Chloe Code event at <strong>' + name + '</strong>' + (zip ? ' (' + zip + ')' : '') + '.',
            destApp: 'opportunity',
            destParams: { from: 'market', zip: zip, view: 'map' },
            confirmLabel: 'Open Opportunity Board →'
          });
        });
      });

      // ZIP rows → opportunity board
      var origBuildZIPRows = window.buildZIPRows;
      if (origBuildZIPRows) {
        window.buildZIPRows = function() {
          origBuildZIPRows();
          document.querySelectorAll('#zip-rows .trow:not(.thead)').forEach(function(row) {
            row.addEventListener('click', function(e) {
              // Don't interfere with existing click that updates detail panel
              // Instead patch the detail panel's "Export Report" to go to opp board
            });
          });
          // Patch ZIP detail action buttons
          setTimeout(function() {
            var reportBtn = document.getElementById('zd-report-btn');
            if (reportBtn) {
              reportBtn.onclick = function() {
                var zd = window.zipData;
                var idx = window.selectedZIP || 0;
                var z = zd ? zd[idx] : null;
                ChloeIQ.handoff({
                  title: 'View on Opportunity Board',
                  body: 'Open the Opportunity Board to see the full demand scorecard and set up events for <strong>' + (z ? z.area + ' · ' + z.zip : 'this ZIP') + '</strong>.',
                  destApp: 'opportunity',
                  destParams: { from: 'market', zip: z ? z.zip : '', view: 'map' },
                  confirmLabel: 'Open Opportunity Board →'
                });
              };
            }
          }, 500);
        };
        // Patch immediately too
        setTimeout(function() {
          var reportBtn = document.getElementById('zd-report-btn');
          if (reportBtn) {
            reportBtn.onclick = function() {
              var zd = window.zipData;
              var idx = window.selectedZIP || 0;
              var z = zd ? zd[idx] : null;
              ChloeIQ.handoff({
                title: 'View on Opportunity Board',
                body: 'Open the Opportunity Board to see the full demand scorecard for <strong>' + (z ? z.area + ' · ' + z.zip : 'this ZIP') + '</strong>.',
                destApp: 'opportunity',
                destParams: { from: 'market', zip: z ? z.zip : '', view: 'map' },
                confirmLabel: 'Open Opportunity Board →'
              });
            };
          }
        }, 800);
      }
    }

    // ── AGENT DASHBOARD patches ──
    if (appId === 'agent') {
      // Leads → could show buyer heatmap (future)
      // "View Insights" type links → market intelligence
      // Host Score stat card → market intelligence for context
      var scoreStat = document.querySelector('#view-home .stat-card:last-child');
      if (scoreStat) {
        var orig = scoreStat.onclick;
        scoreStat.addEventListener('click', function() {
          // Already goes to score view internally — that's correct
        });
      }
    }
  }

  // ── SEED DECK: handle ?view=contact ──
  function handleSeedDeckParams() {
    if (currentApp.id !== 'seed') return;
    var view = getParam('view');
    if (view === 'contact') {
      // Jump to slide 10 (contact)
      setTimeout(function() {
        if (window.goTo) goTo(10, false);
      }, 300);
    }
    if (view) {
      var slideMap = {
        cover:1, problem:2, solution:3, traction:4, market:5,
        bizmodel:6, competition:7, team:8, ask:9, contact:10
      };
      var n = slideMap[view];
      if (n && window.goTo) setTimeout(function() { goTo(n, false); }, 300);
    }
  }

  // ── INIT ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      buildNav();
      handleIncomingParams();
      handleSeedDeckParams();
      setTimeout(patchCrossAppActions, 800);
    });
  } else {
    buildNav();
    handleIncomingParams();
    handleSeedDeckParams();
    setTimeout(patchCrossAppActions, 800);
  }

})();
