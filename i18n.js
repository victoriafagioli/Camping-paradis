/* ═══════════════════════════════════════════════════════════════
   CAMPING PARADIS — MOTEUR MULTILINGUE (i18n)
   FR (source) · EN · NL · DE · ES
   ───────────────────────────────────────────────────────────────
   Fonctionnement :
   - Les pages restent écrites en français (source de vérité).
   - Au chargement, ce script remplace chaque texte par sa
     traduction trouvée dans i18n/<lang>.js (clé = texte français).
   - Un texte absent du dictionnaire reste simplement en français.
   - Le choix de langue est mémorisé (localStorage) et la langue
     du navigateur est détectée à la première visite.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var LANGS = {
    fr: { flag: '🇫🇷', label: 'Français' },
    en: { flag: '🇬🇧', label: 'English' },
    nl: { flag: '🇳🇱', label: 'Nederlands' },
    de: { flag: '🇩🇪', label: 'Deutsch' },
    es: { flag: '🇪🇸', label: 'Español' }
  };
  var STORAGE_KEY = 'cp-lang';
  var ATTRS = ['placeholder', 'title', 'alt', 'aria-label'];
  var isApplying = false;
  var observer = null;

  /* ── Langue courante ───────────────────────────────────────── */
  function detectLang() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (saved && LANGS[saved]) return saved;
    var nav = (navigator.language || 'fr').slice(0, 2).toLowerCase();
    return LANGS[nav] ? nav : 'fr';
  }
  var currentLang = detectLang();

  /* ── Chargement dynamique du dictionnaire ──────────────────── */
  window.CP_I18N = window.CP_I18N || {};
  function loadDict(lang, cb) {
    if (lang === 'fr' || window.CP_I18N[lang]) { cb(); return; }
    var s = document.createElement('script');
    s.src = 'i18n/' + lang + '.js';
    s.onload = cb;
    s.onerror = function () { console.warn('[i18n] dictionnaire introuvable :', lang); cb(); };
    document.head.appendChild(s);
  }

  /* ── Traduction du DOM ─────────────────────────────────────── */
  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }

  function translateTextNode(node, dict) {
    if (node.__fr === undefined) node.__fr = node.nodeValue;
    var key = norm(node.__fr);
    if (!key) return;
    if (!dict) { // retour au français
      if (node.nodeValue !== node.__fr) node.nodeValue = node.__fr;
      return;
    }
    var tr = dict[key];
    if (tr !== undefined) {
      // on préserve les espaces de début/fin du nœud d'origine
      var m = node.__fr.match(/^(\s*)[\s\S]*?(\s*)$/);
      node.nodeValue = (m ? m[1] : '') + tr + (m ? m[2] : '');
    } else if (node.nodeValue !== node.__fr) {
      node.nodeValue = node.__fr; // pas de traduction → français
    }
  }

  function translateAttributes(el, dict) {
    ATTRS.forEach(function (attr) {
      if (!el.hasAttribute(attr)) return;
      el.__frAttr = el.__frAttr || {};
      if (el.__frAttr[attr] === undefined) el.__frAttr[attr] = el.getAttribute(attr);
      var key = norm(el.__frAttr[attr]);
      var tr = dict ? dict[key] : undefined;
      el.setAttribute(attr, tr !== undefined ? tr : el.__frAttr[attr]);
    });
  }

  function shouldSkip(el) {
    var tag = el.nodeName;
    return tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' ||
           (el.id === 'cp-lang-switcher') ||
           (el.closest && el.closest('#cp-lang-switcher, [data-no-i18n]'));
  }

  function applyLang(lang) {
    var dict = lang === 'fr' ? null : (window.CP_I18N[lang] || null);
    isApplying = true;

    // Nœuds texte
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        return n.parentElement && shouldSkip(n.parentElement)
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) translateTextNode(n, dict);

    // Attributs
    var els = document.body.querySelectorAll('[placeholder],[title],[alt],[aria-label]');
    for (var i = 0; i < els.length; i++) {
      if (!shouldSkip(els[i])) translateAttributes(els[i], dict);
    }

    document.documentElement.lang = lang;
    isApplying = false;
  }

  /* ── Changement de langue ──────────────────────────────────── */
  function setLang(lang) {
    if (!LANGS[lang]) return;
    currentLang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    if (typeof gtag === 'function') {
      gtag('event', 'language_change', { language: lang });
    }
    loadDict(lang, function () {
      applyLang(lang);
      updateButton();
    });
  }

  /* ── Observation du contenu dynamique (météo, bon plan…) ───── */
  function startObserver() {
    if (observer) return;
    var pending = null;
    observer = new MutationObserver(function () {
      if (isApplying || currentLang === 'fr') return;
      clearTimeout(pending);
      pending = setTimeout(function () { applyLang(currentLang); }, 80);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  /* ── Sélecteur de langue (UI) ──────────────────────────────── */
  var btn, panel;
  function updateButton() {
    if (btn) btn.textContent = LANGS[currentLang].flag;
    if (panel) {
      var items = panel.querySelectorAll('button');
      for (var i = 0; i < items.length; i++) {
        items[i].classList.toggle('active', items[i].dataset.lang === currentLang);
      }
    }
  }

  function buildSwitcher() {
    var hasTheme = !!document.getElementById('theme-toggle');
    var css = document.createElement('style');
    css.textContent =
      '#cp-lang-switcher{position:fixed;top:14px;right:' + (hasTheme ? '64px' : '14px') + ';z-index:10000;font-family:inherit;}' +
      '#cp-lang-btn{width:42px;height:42px;border-radius:50%;border:none;cursor:pointer;' +
        'background:rgba(255,255,255,0.9);box-shadow:0 2px 10px rgba(0,0,0,0.2);font-size:20px;' +
        'line-height:1;display:flex;align-items:center;justify-content:center;' +
        '-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}' +
      'body.mode-nuit #cp-lang-btn{background:rgba(40,40,40,0.92);}' +
      '#cp-lang-panel{display:none;position:absolute;top:50px;right:0;background:#fff;' +
        'border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,0.18);padding:6px;min-width:160px;}' +
      '#cp-lang-panel.open{display:block;}' +
      'body.mode-nuit #cp-lang-panel{background:#2a2a2a;}' +
      '#cp-lang-panel button{display:flex;align-items:center;gap:10px;width:100%;border:none;' +
        'background:none;cursor:pointer;padding:10px 12px;border-radius:10px;font-size:15px;' +
        'color:#333;text-align:left;font-family:inherit;}' +
      'body.mode-nuit #cp-lang-panel button{color:#eee;}' +
      '#cp-lang-panel button:hover{background:rgba(52,189,239,0.12);}' +
      '#cp-lang-panel button.active{background:rgba(52,189,239,0.18);font-weight:600;color:#2a9ec4;}';
    document.head.appendChild(css);

    var wrap = document.createElement('div');
    wrap.id = 'cp-lang-switcher';
    wrap.setAttribute('data-no-i18n', '');

    btn = document.createElement('button');
    btn.id = 'cp-lang-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Choisir la langue / Choose language');
    btn.textContent = LANGS[currentLang].flag;

    panel = document.createElement('div');
    panel.id = 'cp-lang-panel';
    Object.keys(LANGS).forEach(function (code) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.lang = code;
      b.innerHTML = '<span>' + LANGS[code].flag + '</span><span>' + LANGS[code].label + '</span>';
      b.addEventListener('click', function () {
        setLang(code);
        panel.classList.remove('open');
      });
      panel.appendChild(b);
    });

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.classList.toggle('open');
    });
    document.addEventListener('click', function () { panel.classList.remove('open'); });

    wrap.appendChild(btn);
    wrap.appendChild(panel);
    document.body.appendChild(wrap);
    updateButton();
  }

  /* ── Init ──────────────────────────────────────────────────── */
  function init() {
    buildSwitcher();
    startObserver();
    if (currentLang !== 'fr') {
      loadDict(currentLang, function () { applyLang(currentLang); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
