// ─── Constants & Formatters ─────────────────────────────────────────
const MAX_SEGMENT_HEIGHT = 10_000_000;
const RULER_TICK_PX = 160;
const COUNTER_SCROLL_OFFSET = 175;
const DOLLARS_PER_PIXEL = 1000;
const SCROLL_RATE_PX = 10;
const BAR_VISIBILITY_OFFSET_PX = 200;
const MAX_SQUARE_WIDTH_FRACTION = 0.8;
const MIN_RECT_HEIGHT_FOR_INNER_TEXT = 60;
const MIN_RECT_WIDTH_FOR_INNER_TEXT = 150;
const MIN_COMPARISON_GAP_VH = 1.5;
const MIN_COMPARISON_CONTENT_PADDING_PX = 64;
const MAX_BAR_SEGMENTS = 100;
const STICKY_BOTTOM_RESERVE_PX = 74; // room for the two pills at the bottom
const TICKER_INTRO_MS = 6000; // how long the ticker stays open when it first appears
const FETCH_TIMEOUT_MS = 15_000;
const TICKER_UPDATE_MS = 1000;
const WEALTH_COUNTER_ANNUAL_USD = 500_000_000_000;
const WEALTH_COUNTER_PER_SECOND = WEALTH_COUNTER_ANNUAL_USD / (365.25 * 24 * 3600);
const AUTO_SCROLL_MIN_DURATION_MS = 350;
const AUTO_SCROLL_MAX_DURATION_MS = 2200;
const AUTO_SCROLL_PIXELS_PER_SECOND = 12_000;
const LANGUAGE_STORAGE_KEY = 'preferred-language';
// A picture may shrink to this share of its size to make a message fit on a small screen.
const MIN_PICTURE_SCALE = 0.6;
const MIN_ILLUSTRATION_SCALE = 0.45; // environment pictures in a compact message
const SECONDS_PER_YEAR = 365.25 * 24 * 3600;
// A person, red as everywhere on the page; the dark outline keeps it visible on the blue bar.
const DEATH_FIGURE_SVG = '<svg width="14" height="30" viewBox="0 0 18 40" aria-hidden="true">' +
  '<circle cx="9" cy="6" r="5" fill="#C62828" stroke="#111" stroke-width="1.5"/>' +
  '<path d="M3 15h12v13h-3v11H6V28H3z" fill="#C62828" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>';
// The same figure, outlined only: the people not affected.
const AFFECTED_OTHER_SVG = DEATH_FIGURE_SVG.replace(/#C62828/g, 'none');

function isGermanPath(pathname) {
  return /\/de(\/|$)/.test(pathname);
}

function getCurrentLanguage() {
  return isGermanPath(window.location.pathname) ? 'de' : 'en';
}

function getStoredLanguagePreference() {
  try {
    const value = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (value === 'de' || value === 'en') return value;
  } catch (error) {
    console.warn('Could not read language preference:', error);
  }
  return null;
}

function getBrowserLanguagePreference() {
  const browserLang = (navigator.language || '').toLowerCase();
  return browserLang.startsWith('de') ? 'de' : 'en';
}

function persistLanguagePreference(lang) {
  if (lang !== 'de' && lang !== 'en') return;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (error) {
    console.warn('Could not save language preference:', error);
  }
}

function getLanguageTargetUrl(lang) {
  const onGermanPage = getCurrentLanguage() === 'de';
  if (lang === 'de') return onGermanPage ? './' : 'de/';
  return onGermanPage ? '../' : './';
}

function redirectToLanguageIfNeeded() {
  const storedPreference = getStoredLanguagePreference();
  const currentLanguage = getCurrentLanguage();

  if (storedPreference) {
    if (storedPreference === currentLanguage) return false;
    window.location.replace(getLanguageTargetUrl(storedPreference));
    return true;
  }

  // Auto-route first-time users only from EN to DE based on browser language.
  if (currentLanguage !== 'en') return false;

  const browserPreference = getBrowserLanguagePreference();
  if (browserPreference === 'de') {
    window.location.replace(getLanguageTargetUrl('de'));
    return true;
  }
  return false;
}

function createLanguageMenu() {
  const titleScreen = document.querySelector('.title-screen');
  if (!titleScreen) return;

  const menu = document.createElement('div');
  menu.className = 'language-menu';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'language-menu-trigger';
  const currentLang = getCurrentLanguage();
  trigger.textContent = currentLang.toUpperCase();
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'true');
  trigger.setAttribute('aria-label', getCurrentLanguage() === 'de' ? 'Sprache wechseln' : 'Switch language');

  const panel = document.createElement('div');
  panel.className = 'language-menu-panel';
  panel.hidden = true;

  const enBtn = document.createElement('button');
  enBtn.type = 'button';
  enBtn.className = 'language-menu-item';
  enBtn.textContent = 'English';
  enBtn.dataset.lang = 'en';

  const deBtn = document.createElement('button');
  deBtn.type = 'button';
  deBtn.className = 'language-menu-item';
  deBtn.textContent = 'Deutsch';
  deBtn.dataset.lang = 'de';

  panel.appendChild(enBtn);
  panel.appendChild(deBtn);

  const activeBtn = currentLang === 'de' ? deBtn : enBtn;
  activeBtn.classList.add('is-active');
  activeBtn.setAttribute('aria-current', 'true');

  function setMenuOpen(open) {
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
  }

  trigger.addEventListener('click', function(event) {
    event.stopPropagation();
    setMenuOpen(panel.hidden);
  });

  panel.addEventListener('click', function(event) {
    const target = event.target.closest('.language-menu-item');
    if (!target) return;

    const lang = target.dataset.lang;
    if (lang !== 'de' && lang !== 'en') return;

    setMenuOpen(false);
    if (lang === currentLang) return;

    persistLanguagePreference(lang);
    trigger.textContent = lang.toUpperCase();
    window.location.assign(getLanguageTargetUrl(lang));
  });

  document.addEventListener('click', function(event) {
    if (menu.contains(event.target)) return;
    setMenuOpen(false);
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') setMenuOpen(false);
  });

  menu.appendChild(trigger);
  menu.appendChild(panel);
  titleScreen.appendChild(menu);
  createThemeToggle(titleScreen);
}

// ─── Dark mode switch ───────────────────────────────────────────────
// The page follows the device setting until the reader picks a mode here. A pick that matches
// the device setting is forgotten again, so the page goes back to following the device.
// The first theme is set by the small script in the page head, before anything is drawn.
const THEME_STORAGE_KEY = 'theme';
const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function getStoredTheme() {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY);
    return t === 'dark' || t === 'light' ? t : null;
  } catch (e) {
    return null;
  }
}

function getSystemTheme() {
  return darkQuery && darkQuery.matches ? 'dark' : 'light';
}

function createThemeToggle(titleScreen) {
  const isDe = getCurrentLanguage() === 'de';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-toggle';
  btn.setAttribute('aria-label', isDe ? 'Dunkler Modus' : 'Dark mode');
  btn.innerHTML =
    '<svg class="theme-moon" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M14.5 11.2A6.5 6.5 0 0 1 6.8 3.5a6.5 6.5 0 1 0 7.7 7.7z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>' +
    '<svg class="theme-sun" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="3.4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';

  function sync() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.setAttribute('aria-pressed', String(dark));
    btn.title = dark
      ? (isDe ? 'Hellen Modus einschalten' : 'Switch to light mode')
      : (isDe ? 'Dunklen Modus einschalten' : 'Switch to dark mode');
  }

  btn.addEventListener('click', function() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      if (next === getSystemTheme()) localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (e) { /* storage blocked: the choice lasts for this visit */ }
    sync();
  });

  // While the reader has not picked a mode, follow the device when it switches.
  if (darkQuery) {
    const onSystemChange = function() {
      if (getStoredTheme()) return;
      document.documentElement.setAttribute('data-theme', getSystemTheme());
      sync();
    };
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', onSystemChange);
    else if (darkQuery.addListener) darkQuery.addListener(onSystemChange);
  }

  sync();
  titleScreen.appendChild(btn);
}

function getActiveLocale() {
  var lang = window.i18n_data && window.i18n_data.code;
  if (lang === 'de') return 'de-DE';
  return 'en-US';
}

const thousand = new Intl.NumberFormat(getActiveLocale());
const money = new Intl.NumberFormat(getActiveLocale(), {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatCompactMoney(n) {
  var lang = window.i18n_data && window.i18n_data.code;
  if (lang === 'de') {
    if (n >= 1e12) return (n / 1e12).toFixed(2).replace(/\.?0+$/, '').replace('.', ',') + ' Bio. $';
    if (n >= 1e9)  return (n / 1e9).toFixed(1).replace(/\.0$/, '').replace('.', ',') + ' Mrd. $';
    if (n >= 1e6)  return (n / 1e6).toFixed(1).replace(/\.0$/, '').replace('.', ',') + ' Mio. $';
    return money.format(n);
  }
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2).replace(/\.?0+$/, '') + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  return money.format(n);
}

// German sets a (non-breaking) space before the percent sign and uses a decimal comma.
function fmtPctNumber(text) {
  var lang = window.i18n_data && window.i18n_data.code;
  if (lang === 'de') return String(text).replace('.', ',') + ' %';
  return text + '%';
}

function fmtPct(n) {
  if (n >= 10) return fmtPctNumber(n.toFixed(1).replace(/\.0$/, ''));
  if (n >= 1)  return fmtPctNumber(n.toFixed(1));
  return fmtPctNumber(n.toFixed(2));
}

function fmtInt(n) {
  return thousand.format(n);
}

// ─── Globals ────────────────────────────────────────────────────────
let currentBarWidth = 500;
let richestPersonWealthUsd = 839_000_000_000;
let allBillionairesTotalUsd = 20_100_000_000_000;
let richestName = 'the richest person';
let billionaireCount = 3428;
let story = null;
let pageOpenedAt = Date.now();
let tickerIntervalId = null;
let scrollRateComp = null;
let _detectedMaxScrollHeight = null;
let nextMessageBtn = null;
let nextMessageNavInitialized = false;
let autoScrollRafId = null;
let rulerMajorUsd = 50_000_000;
let rulerMajorPx = 160;
let pendingVizMounts = [];
let stickyContentObserver = null;

// ─── Capping state ──────────────────────────────────────────────────
let isCapped = false;
let cappedFraction = 1;
let pctReached = 100;
let prevCappedFraction = 1;

// ─── Helpers ────────────────────────────────────────────────────────
function getStableVh() {
  return document.documentElement.clientHeight || window.innerHeight;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function interpolate(text, vars) {
  return text.replace(/\{(\w+)\}/g, function(_, key) {
    return vars[key] !== undefined ? vars[key] : '{' + key + '}';
  });
}

function detectMaxScrollHeight() {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:99999999px;visibility:hidden;pointer-events:none;';
  document.body.appendChild(probe);
  const actualMax = document.documentElement.scrollHeight;
  document.body.removeChild(probe);
  return actualMax;
}

function getMaxSafeAllBillionairesH(barWidth) {
  if (_detectedMaxScrollHeight === null) {
    _detectedMaxScrollHeight = detectMaxScrollHeight();
  }
  const richestH = Math.round(richestPersonWealthUsd / (barWidth * DOLLARS_PER_PIXEL));
  const otherContentH = 10000;
  return Math.max(0, _detectedMaxScrollHeight - richestH - otherContentH);
}

// ─── i18n Helpers ───────────────────────────────────────────────────
function t(key, fallback) {
  if (window.i18n_data && window.i18n_data.strings && key) {
    var val = window.i18n_data.strings[key];
    if (val !== undefined) return val;
  }
  return fallback;
}

function tUI(key, fallback) {
  return t('i18n-ui-' + key, fallback);
}

function localizeComp(comp) {
  var c = {};
  for (var k in comp) { if (comp.hasOwnProperty(k)) c[k] = comp[k]; }
  var base = comp.i18nKey;
  if (base) {
    c.title = t(base, c.title);
    c.description = t(base + '-desc', c.description);
    c.deathLabel = t(base + '-death-label', c.deathLabel);
    c.deathRhythm = t(base + '-death-rhythm', c.deathRhythm);
    c.affectedLine = t(base + '-affected-line', c.affectedLine);
    c.sourceName = t(base + '-source-name', c.sourceName);
    c.imageAlt = t(base + '-image-alt', c.imageAlt);
    c.tickerDescription = t(base + '-ticker-desc', c.tickerDescription);
  }
  return c;
}

// ─── Layout Computation ─────────────────────────────────────────────
function computeBarWidth() {
  const em = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Math.max(200, Math.floor(document.documentElement.clientWidth - 2 * em));
}

function applyDimensions(barWidth) {
  currentBarWidth = barWidth;
  const billionBarWidth = Math.min(barWidth, 1000);
  const billionH = Math.round(1e9 / (billionBarWidth * DOLLARS_PER_PIXEL));
  const richestH = Math.round(richestPersonWealthUsd / (barWidth * DOLLARS_PER_PIXEL));

  // Calculate logical height, then cap if needed
  const logicalAllBillionairesH = Math.round(allBillionairesTotalUsd / (barWidth * DOLLARS_PER_PIXEL));
  const maxSafeH = getMaxSafeAllBillionairesH(barWidth);
  let allBillionairesH;

  if (logicalAllBillionairesH > maxSafeH) {
    allBillionairesH = maxSafeH;
    isCapped = true;
    cappedFraction = maxSafeH / logicalAllBillionairesH;
    pctReached = cappedFraction * 100;
  } else {
    allBillionairesH = logicalAllBillionairesH;
    isCapped = false;
    cappedFraction = 1;
    pctReached = 100;
  }

  const root = document.documentElement.style;
  root.setProperty('--bar-width', barWidth + 'px');
  root.setProperty('--bar-width-billion', billionBarWidth + 'px');
  root.setProperty('--billion-h', billionH + 'px');
  root.setProperty('--richest-h', richestH + 'px');
  root.setProperty('--all-billionaires-h', allBillionairesH + 'px');

  // Ruler and bracket show a round amount (1, 2 or 5 × 10ⁿ) at every screen width.
  rulerMajorUsd = pickRoundRulerStep(RULER_TICK_PX * barWidth * DOLLARS_PER_PIXEL);
  rulerMajorPx = rulerMajorUsd / (barWidth * DOLLARS_PER_PIXEL);
  const scaleText = formatCompactMoney(rulerMajorUsd);
  const scaleEls = document.querySelectorAll('.scale-label');
  for (let i = 0; i < scaleEls.length; i++) { scaleEls[i].textContent = scaleText; }

  segmentBar('allBillionaires', allBillionairesH, barWidth);
  buildRulers();
  updateRulers();
}

// ─── Ruler (round steps, snapped to device pixels) ──────────────────
function pickRoundRulerStep(targetUsd) {
  const exp = Math.floor(Math.log10(targetUsd));
  let best = null;
  for (let e = exp - 1; e <= exp + 1; e++) {
    [1, 2, 5].forEach(function(m) {
      const candidate = m * Math.pow(10, e);
      const distance = Math.abs(Math.log(candidate / targetUsd));
      if (best === null || distance < best.distance) best = { value: candidate, distance: distance };
    });
  }
  return best.value;
}

function getDevicePixelRatio() {
  return window.devicePixelRatio || 1;
}

function snapToDevicePixel(v) {
  const dpr = getDevicePixelRatio();
  return Math.round(v * dpr) / dpr;
}

function buildRulers() {
  const dpr = getDevicePixelRatio();
  const thick = Math.max(1, Math.round(dpr)) / dpr;
  const minor = rulerMajorPx / 10;
  const viewH = getStableVh() + Math.ceil(rulerMajorPx) * 2;

  const tracks = document.querySelectorAll('.ruler-track');
  for (let t = 0; t < tracks.length; t++) {
    let html = '';
    for (let i = 0; i * minor <= viewH; i++) {
      html += '<i style="top:' + snapToDevicePixel(i * minor) + 'px;height:' + thick + 'px;width:' + (i % 10 === 0 ? 18 : 9) + 'px"></i>';
    }
    tracks[t].innerHTML = html;
    tracks[t].style.height = viewH + 'px';
  }

  const keys = document.querySelectorAll('.bar-hud .key');
  for (let k = 0; k < keys.length; k++) {
    keys[k].style.height = (snapToDevicePixel(rulerMajorPx) + thick) + 'px';
    keys[k].style.borderWidth = thick + 'px';
    keys[k].style.borderRightWidth = '0';
  }

  // The header height is needed to centre messages in the space below it.
  const bars = document.querySelectorAll('.wealth');
  for (let b = 0; b < bars.length; b++) {
    const header = bars[b].querySelector('.wealth-header');
    if (header) bars[b].style.setProperty('--hud-h', header.offsetHeight + 'px');
  }
}

function updateRulers() {
  const dpr = getDevicePixelRatio();
  const vh = getStableVh();
  const huds = document.querySelectorAll('.bar-hud');
  for (let i = 0; i < huds.length; i++) {
    const bar = huds[i].parentElement;
    const view = huds[i].querySelector('.ruler-view');
    const track = huds[i].querySelector('.ruler-track');
    if (!bar || !view || !track) continue;

    const barRect = bar.getBoundingClientRect();
    if (barRect.bottom < 0 || barRect.top > vh) continue;

    const hudTop = huds[i].getBoundingClientRect().top;
    // How far the bar has scrolled past the HUD, wrapped to one major step.
    const phase = Math.max(0, hudTop - barRect.top) % rulerMajorPx;
    // Snap to the absolute device-pixel grid so every tick is equally dark.
    const offset = Math.round((hudTop - phase) * dpr) / dpr - hudTop;
    track.style.transform = 'translateY(' + offset + 'px)';
    view.style.height = Math.max(0, Math.min(vh, barRect.bottom - hudTop)) + 'px';
  }
}

// ─── Segmented Virtual Scroll ───────────────────────────────────────
function segmentBar(barId, totalHeight, barWidth) {
  const el = document.getElementById(barId);
  if (!el) return;

  el.querySelectorAll('.bar-segment').forEach(function(s) { s.remove(); });

  if (totalHeight <= MAX_SEGMENT_HEIGHT) {
    el.style.height = totalHeight + 'px';
    return;
  }

  let remaining = totalHeight;
  let iterations = 0;
  while (remaining > 0 && iterations < MAX_BAR_SEGMENTS) {
    iterations++;
    const h = Math.min(remaining, MAX_SEGMENT_HEIGHT);
    const seg = document.createElement('div');
    seg.className = 'bar-segment';
    seg.style.width = barWidth + 'px';
    seg.style.height = h + 'px';
    seg.style.backgroundColor = 'inherit';
    el.appendChild(seg);
    remaining -= h;
  }
}

// ─── Scroll Counter ─────────────────────────────────────────────────
function updateWealthCounters() {
  const scrollTop = window.scrollY || window.pageYOffset || 0;
  const vh = getStableVh();
  updateBarCounter('richest', richestPersonWealthUsd, scrollTop, vh);
  updateBarCounter('allBillionaires', allBillionairesTotalUsd, scrollTop, vh);
}

function updateBarCounter(barId, maxWealth, scrollTop, vh) {
  const el = document.getElementById(barId);
  const counterEl = document.getElementById(barId + '-counter');
  if (!el || !counterEl) return;

  const barTop = el.offsetTop;
  const barBot = barTop + el.offsetHeight;

  if (scrollTop + vh < barTop + BAR_VISIBILITY_OFFSET_PX || scrollTop > barBot) {
    counterEl.textContent = '';
    return;
  }

  if (barId === 'richest') {
    const jk = document.querySelector('.comparison-just-kidding');
    if (jk && scrollTop + vh < jk.offsetTop) {
      counterEl.textContent = '';
      return;
    }
  }

  const wealth = Math.max(0, (scrollTop - barTop + COUNTER_SCROLL_OFFSET) * (currentBarWidth * DOLLARS_PER_PIXEL));
  counterEl.textContent = (wealth < maxWealth) ? money.format(wealth) : money.format(maxWealth);
}

// ─── Wealth Counter (time-based, Musk earnings since page open) ─────
function updateWealthCounter() {
  const el = document.getElementById('wealth-counter');
  if (!el) return;
  const elapsed = (Date.now() - pageOpenedAt) / 1000;
  el.textContent = money.format(Math.floor(WEALTH_COUNTER_PER_SECOND * elapsed));
}

function findNextInfobox(fromScrollTop) {
  const items = document.querySelectorAll('#richest-comparisons .infobox, #allBillionaires-comparisons .infobox');
  for (let i = 0; i < items.length; i++) {
    if (items[i].offsetTop > fromScrollTop + 4) return items[i];
  }
  return null;
}

function hasReachedFirstRichestMessage(scrollTop) {
  const firstRichest = document.querySelector('#richest-comparisons .infobox');
  if (!firstRichest) return false;
  return scrollTop + getStableVh() >= firstRichest.offsetTop;
}

function updateNextMessageButtonState() {
  if (!nextMessageBtn) return;
  const scrollTop = window.scrollY || window.pageYOffset || 0;
  const reachedFirstRichest = hasReachedFirstRichestMessage(scrollTop);
  const hasNext = !!findNextInfobox(scrollTop);
  const shouldShow = reachedFirstRichest && hasNext;
  nextMessageBtn.hidden = !shouldShow;
  nextMessageBtn.disabled = !shouldShow || autoScrollRafId !== null;
}

function stopAutoScroll() {
  if (autoScrollRafId === null) return;
  cancelAnimationFrame(autoScrollRafId);
  autoScrollRafId = null;
  if (nextMessageBtn) {
    nextMessageBtn.classList.remove('is-scrolling');
  }
  updateNextMessageButtonState();
}

function startAutoScroll(targetY) {
  const startY = window.scrollY || window.pageYOffset || 0;
  const distance = Math.max(0, targetY - startY);
  if (distance <= 0) return;

  stopAutoScroll();

  const duration = Math.min(
    AUTO_SCROLL_MAX_DURATION_MS,
    Math.max(AUTO_SCROLL_MIN_DURATION_MS, Math.round((distance / AUTO_SCROLL_PIXELS_PER_SECOND) * 1000))
  );
  const startedAt = performance.now();

  if (nextMessageBtn) {
    nextMessageBtn.classList.add('is-scrolling');
    nextMessageBtn.disabled = true;
  }

  function step(now) {
    const elapsed = now - startedAt;
    const progress = Math.min(1, elapsed / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const y = startY + distance * eased;
    window.scrollTo(0, y);

    if (progress < 1) {
      autoScrollRafId = requestAnimationFrame(step);
      return;
    }

    autoScrollRafId = null;
    if (nextMessageBtn) {
      nextMessageBtn.classList.remove('is-scrolling');
    }
    updateNextMessageButtonState();
  }

  autoScrollRafId = requestAnimationFrame(step);
}

function initNextMessageNav() {
  if (nextMessageNavInitialized) return;

  nextMessageBtn = document.getElementById('next-message-btn');
  if (!nextMessageBtn) return;
  nextMessageNavInitialized = true;

  const nextPointLabel = tUI('next-point', 'Next message');
  nextMessageBtn.textContent = nextPointLabel;
  nextMessageBtn.title = nextPointLabel;

  nextMessageBtn.addEventListener('click', function() {
    const scrollTop = window.scrollY || window.pageYOffset || 0;
    const nextEl = findNextInfobox(scrollTop);
    if (!nextEl) return;
    startAutoScroll(nextEl.offsetTop);
  });

  const interruptAutoScroll = function() {
    stopAutoScroll();
  };
  window.addEventListener('wheel', interruptAutoScroll, { passive: true });
  window.addEventListener('touchstart', interruptAutoScroll, { passive: true });
  window.addEventListener('mousedown', interruptAutoScroll);
  window.addEventListener('keydown', interruptAutoScroll);

  updateNextMessageButtonState();
}

// ─── Data Loading ───────────────────────────────────────────────────
function fetchWithFallback(path) {
  const opts = { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) };
  return fetch(path, opts).then(function(r) {
    if (r.ok) return r.json();
    return fetch('../' + path, opts).then(function(r2) {
      if (!r2.ok) throw new Error(path + ' not found');
      return r2.json();
    });
  });
}

function loadData() {
  Promise.all([
    fetchWithFallback('data/billionaires.json'),
    fetchWithFallback('data/story.json'),
  ])
    .then(function(results) { applyData(results[0], results[1]); })
    .catch(function(e) { console.warn('Could not load data:', e); });
}

function applyData(billionaireData, storyData) {
  if (!billionaireData || !Array.isArray(billionaireData.people) || billionaireData.people.length === 0) {
    throw new Error('Invalid billionaire data: expected object with non-empty people array');
  }
  if (!storyData || !Array.isArray(storyData.comparisons)) {
    throw new Error('Invalid story data: expected object with comparisons array');
  }

  story = storyData;
  richestPersonWealthUsd = Number(billionaireData.people[0].wealthUsd);
  richestName = billionaireData.people[0].name;

  if (billionaireData.allBillionairesTotalUsd) {
    allBillionairesTotalUsd = Number(billionaireData.allBillionairesTotalUsd);
    billionaireCount = Number(billionaireData.allBillionairesCount || billionaireCount);
  } else {
    allBillionairesTotalUsd = Number(billionaireData.totalWealthUsd);
    billionaireCount = Number(billionaireData.count);
  }

  // Cache dynamic text lookup once
  scrollRateComp = story.comparisons.find(function(c) { return c.dynamic === 'scrollRate'; }) || null;

  applyDimensions(computeBarWidth());

  // Bar headers: the total in large type, whose wealth it is on its own line.
  setText('richest-total', money.format(richestPersonWealthUsd));
  setText('richest-who', interpolate(tUI('richest-who', 'Wealth of {name}'), { name: richestName }));
  setText('allBillionaires-total', formatCompactMoney(allBillionairesTotalUsd));
  setText('allBillionaires-who', interpolate(
    tUI('all-billionaires-who', 'All {count} billionaires'),
    { count: thousand.format(billionaireCount) }
  ));
  buildRulers();

  renderComparisons();
  initNextMessageNav();
  updateNextMessageButtonState();

  // Re-layout after fonts are fully loaded (prevents mismeasured content on mobile)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function() {
      updateRectSizes();
      updateAllComparisonPositions();
    });
  }

  if (story.deathTicker && story.deathTicker.enabled) {
    startDeathTicker(story.deathTicker);
  } else {
    setInterval(updateWealthCounter, TICKER_UPDATE_MS);
  }
}

// ─── Comparison Renderer ────────────────────────────────────────────
function renderComparisons() {
  if (!story || !story.comparisons) return;

  const richestContainer = document.getElementById('richest-comparisons');
  const allContainer = document.getElementById('allBillionaires-comparisons');

  const templateVars = {
    richestName: richestName,
    richestDailyIncome: formatCompactMoney(Math.round(richestPersonWealthUsd / 365)),
    scrollRate: formatCompactMoney(currentBarWidth * DOLLARS_PER_PIXEL * SCROLL_RATE_PX),
    allBillionairesFormatted: formatCompactMoney(allBillionairesTotalUsd),
    billionaireCount: thousand.format(billionaireCount),
  };

  const groups = { richest: [], allBillionaires: [] };
  story.comparisons.forEach(function(c) {
    const barKey = c.bar || 'allBillionaires';
    if (groups[barKey]) groups[barKey].push(c);
  });

  // For the allBillionaires bar: filter, remap, and add cap message if needed
  const allComps = prepareAllBillionairesComparisons(groups.allBillionaires);

  if (richestContainer) {
    richestContainer.innerHTML = '';
    renderGroup(groups.richest, richestContainer, richestPersonWealthUsd, templateVars);
  }
  if (allContainer) {
    allContainer.innerHTML = '';
    renderGroup(allComps, allContainer, allBillionairesTotalUsd, templateVars);
  }

  updateNextMessageButtonState();
}

function prepareAllBillionairesComparisons(comparisons) {
  if (!isCapped) return comparisons;

  // Filter out comparisons beyond the capped portion
  const visible = comparisons.filter(function(c) {
    return c.positionFraction <= cappedFraction;
  });

  // Remap fractions to capped bar coordinates
  const remapped = visible.map(function(c) {
    const copy = {};
    for (const key in c) {
      if (c.hasOwnProperty(key)) copy[key] = c[key];
    }
    copy.positionFraction = c.positionFraction / cappedFraction;
    return copy;
  });

  // Add the "browser broke" message near the bottom
  const remainingWealth = allBillionairesTotalUsd * (1 - cappedFraction);
  const brokeMessage = {
    id: 'browser-broke',
    bar: 'allBillionaires',
    type: 'text',
    positionFraction: 0.95,
    title: interpolate(
      tUI('browser-broke',
        '<span class="step-hd">Even your browser can’t handle this much money!</span>' +
        'You’ve scrolled through ~<strong>{pctReached}</strong> ' +
        'of their wealth, and your device has reached its limit. ' +
        'The remaining <strong>{pctRemaining}</strong> (about <strong>' +
        '{remainingFormatted}</strong>) simply can’t be displayed.<br><br>' +
        '{totalFormatted}: a number too large for your browser to show. But not too large for {billionaireCount} billionaires to own.'
      ),
      {
        pctReached: fmtPct(pctReached),
        pctRemaining: fmtPct(100 - pctReached),
        remainingFormatted: formatCompactMoney(remainingWealth),
        totalFormatted: formatCompactMoney(allBillionairesTotalUsd),
        billionaireCount: thousand.format(billionaireCount)
      }
    )
  };
  remapped.push(brokeMessage);

  return remapped;
}

function renderGroup(comparisons, container, totalWealth, vars) {
  const fragment = document.createDocumentFragment();

  comparisons.forEach(function(comp) {
    const el = createComparisonElement(comp, totalWealth, vars);
    if (!el) return;

    if (typeof comp.positionFraction === 'number') {
      el.setAttribute('data-position-fraction', comp.positionFraction);
    }
    fragment.appendChild(el);
  });

  container.appendChild(fragment);

  // Visualisations need their elements in the document (path lengths, observers).
  const mounts = pendingVizMounts;
  pendingVizMounts = [];
  mounts.forEach(function(run) {
    try { run(); } catch (error) { console.warn('Visualisation failed:', error); }
  });
  observeStickyContent(container);

  // Re-layout after async image loads
  const images = container.querySelectorAll('img');
  for (let i = 0; i < images.length; i++) {
    images[i].addEventListener('load', function() {
      updateComparisonPositions(container);
    }, { once: true });
  }

  updateComparisonPositions(container);
}

// ─── Sticky content that is taller than the screen ──────────────────
// Messages are centred in the space below the bar header (CSS). If a message does not fit
// there, its picture is first made smaller. If that is not enough, the message scrolls
// through and then sticks with its lower edge above the buttons (class "is-tall"), so every
// line can be read on the way.
function fitStickyContent(el, available, vh, hudH) {
  // Cause and summary messages first try their normal size; if they do not fit, a tighter
  // setting ("is-compact": smaller type and spacing, picture allowed to shrink further).
  const canCompact = el.classList.contains('cause-card') || el.classList.contains('summary-card');
  if (canCompact) el.classList.remove('is-compact');
  let height = measureStickyContent(el, available);
  if (canCompact && height > available + 1) {
    el.classList.add('is-compact');
    height = measureStickyContent(el, available);
  }

  const tall = height > available + 1;
  el.classList.toggle('is-tall', tall);
  if (tall) el.style.setProperty('--tall-top', Math.round(vh - STICKY_BOTTOM_RESERVE_PX - height) + 'px');
  else el.style.removeProperty('--tall-top');
  // Centred on the CSS line (see .cause-card in main.css), but never so low that the lower
  // edge reaches the buttons: a block that fills the space is moved up as far as needed.
  const centre = vh / 2 + hudH / 2 - 20;
  const shift = Math.max(height / 2, height - (vh - STICKY_BOTTOM_RESERVE_PX - centre));
  el.style.setProperty('--sticky-half', Math.round(shift) + 'px');
}

// Height the message will have once its picture is fitted into the available space.
function measureStickyContent(el, available) {
  // Summary arrows depend on the width, so they are drawn whenever a message is measured.
  const arrows = el.querySelectorAll('.summary-arrow');
  for (let i = 0; i < arrows.length; i++) layoutSummaryArrow(arrows[i]);

  // The picture of the message: the tallest drawing that sits below the text.
  const drawings = el.querySelectorAll('.viz:not(.v-ring) > svg');
  let svg = null;
  let fullHeight = 0;
  for (let i = 0; i < drawings.length; i++) {
    const w = parseFloat(drawings[i].getAttribute('width')) || 0;
    const h = parseFloat(drawings[i].getAttribute('height')) || 0;
    const room = drawings[i].parentElement ? drawings[i].parentElement.clientWidth : 0;
    // Most pictures are never drawn larger than their width attribute. The environment
    // pictures (.v-env) fill the width up to their CSS max-width and may grow beyond it.
    const cap = drawings[i].closest('.v-env') ? parseFloat(getComputedStyle(drawings[i]).maxWidth) || w : w;
    const shownFull = (w > 0 && room > 0) ? h * Math.min(cap, room) / w : h;
    if (shownFull > fullHeight) { fullHeight = shownFull; svg = drawings[i]; }
  }

  let height = el.offsetHeight;
  if (svg) {
    const shown = svg.getBoundingClientRect().height;
    const rest = height - shown; // text, captions, replay button
    const roomForPicture = available - rest;
    // Illustrations without a scale (.v-env) may shrink further than measured pictures.
    const minScale = svg.closest('.v-env') && el.classList.contains('is-compact') ? MIN_ILLUSTRATION_SCALE : MIN_PICTURE_SCALE;
    let maxHeight = '';
    if (fullHeight > roomForPicture && roomForPicture >= fullHeight * minScale) {
      maxHeight = Math.floor(roomForPicture) + 'px';
      height = rest + Math.floor(roomForPicture);
    } else {
      height = rest + fullHeight;
    }
    if (svg.style.maxHeight !== maxHeight) svg.style.maxHeight = maxHeight;
  }
  return height;
}

const STICKY_CONTENT_SELECTOR = '.title, .cause-card, .summary-card, .comparison-image-wrapper, .comparison-rect-wrapper:not(.comparison-rect-large)';

function fitStickyContentOf(el) {
  const vh = getStableVh();
  const bar = el.closest('.wealth');
  const hudH = bar ? parseFloat(getComputedStyle(bar).getPropertyValue('--hud-h')) || 96 : 96;
  fitStickyContent(el, vh - hudH - STICKY_BOTTOM_RESERVE_PX, vh, hudH);
}

function observeStickyContent(container) {
  if (typeof ResizeObserver === 'undefined') return;
  if (!stickyContentObserver) {
    stickyContentObserver = new ResizeObserver(function(entries) {
      entries.forEach(function(entry) { fitStickyContentOf(entry.target); });
    });
  }
  const els = container.querySelectorAll(STICKY_CONTENT_SELECTOR);
  for (let i = 0; i < els.length; i++) stickyContentObserver.observe(els[i]);
}

// Infoboxes use content-visibility: auto, and the ResizeObserver does not reliably report
// blocks while their infobox is skipped. Measure again whenever an infobox starts rendering.
document.addEventListener('contentvisibilityautostatechange', function(event) {
  if (event.skipped || !event.target.classList || !event.target.classList.contains('infobox')) return;
  const els = event.target.querySelectorAll(STICKY_CONTENT_SELECTOR);
  for (let i = 0; i < els.length; i++) fitStickyContentOf(els[i]);
}, true);

// The screen height can change without any message changing its size (rotating a phone).
function refitStickyContent() {
  const els = document.querySelectorAll('.infobox ' + STICKY_CONTENT_SELECTOR.split(', ').join(', .infobox '));
  for (let i = 0; i < els.length; i++) fitStickyContentOf(els[i]);
}

// ─── Comparison Positioning ─────────────────────────────────────────
function getComparisonContentHeightPx(itemEl) {
  const contentEl = itemEl.querySelector(
    '.cause-card, .summary-card, .comparison-image-wrapper, .comparison-rect-wrapper, .title'
  );
  if (!contentEl) return 0;
  const rect = contentEl.getBoundingClientRect();
  if (!rect || !Number.isFinite(rect.height)) return 0;
  return Math.max(0, Math.ceil(rect.height));
}

function updateComparisonPositions(container) {
  const barEl = container.closest('.wealth') || container.parentElement;
  const barH = barEl ? barEl.offsetHeight : 0;
  if (barH <= 0) return;

  const items = container.querySelectorAll('[data-position-fraction]');
  if (items.length === 0) return;

  const fracs = [];
  for (let i = 0; i < items.length; i++) {
    fracs.push(parseFloat(items[i].getAttribute('data-position-fraction')) || 0);
  }

  // Use offsetTop (layout-relative) instead of getBoundingClientRect (viewport-relative)
  const headerOffset = container.offsetTop - barEl.offsetTop;
  const stableVh = getStableVh();

  let lastBottom = headerOffset;
  for (let i = 0; i < items.length; i++) {
    const targetPx = Math.max(headerOffset, Math.round(fracs[i] * barH));
    const nextTargetPx = (i + 1 < fracs.length)
      ? Math.round(fracs[i + 1] * barH)
      : barH;
    const minGapPx = Math.round(stableVh * MIN_COMPARISON_GAP_VH);
    const contentHeightPx = getComparisonContentHeightPx(items[i]);
    const requiredHeightPx = contentHeightPx + MIN_COMPARISON_CONTENT_PADDING_PX;
    const targetHeightPx = Math.max(minGapPx, nextTargetPx - targetPx);
    const gapHeight = Math.max(requiredHeightPx, targetHeightPx);

    const topPx = Math.max(targetPx, lastBottom);
    const diff = Math.max(0, topPx - lastBottom);
    items[i].style.marginTop = diff + 'px';
    items[i].style.height = gapHeight + 'px';
    items[i].style.alignItems = 'flex-start';

    lastBottom = lastBottom + diff + gapHeight;
  }
}

function updateAllComparisonPositions() {
  const richestContainer = document.getElementById('richest-comparisons');
  const allContainer = document.getElementById('allBillionaires-comparisons');
  if (richestContainer) updateComparisonPositions(richestContainer);
  if (allContainer) updateComparisonPositions(allContainer);
}

// ─── Rect Sizing (squares) ──────────────────────────────────────────
function computeRectDimensions(amountUsd) {
  const areaPixels = amountUsd / DOLLARS_PER_PIXEL;
  const maxWidth = Math.min(currentBarWidth * MAX_SQUARE_WIDTH_FRACTION, window.innerWidth * 0.9);
  const side = Math.sqrt(areaPixels);
  if (side <= maxWidth) return { width: side, height: side };
  return { width: maxWidth, height: areaPixels / maxWidth };
}

function getRectSizeClass(dims) {
  if (dims.height < MIN_RECT_HEIGHT_FOR_INNER_TEXT || dims.width < MIN_RECT_WIDTH_FOR_INNER_TEXT) return 'small';
  if (dims.height > window.innerHeight || dims.width > window.innerWidth) return 'large';
  return 'medium';
}

function updateRectSizes() {
  const rects = document.querySelectorAll('.comparison-rect[data-amount-usd]');
  for (let i = 0; i < rects.length; i++) {
    const amountUsd = parseFloat(rects[i].getAttribute('data-amount-usd'));
    if (!amountUsd || amountUsd <= 0) continue;
    const dims = computeRectDimensions(amountUsd);
    rects[i].style.width = dims.width.toFixed(1) + 'px';
    rects[i].style.height = dims.height.toFixed(1) + 'px';

    const wrapper = rects[i].closest('.comparison-rect-wrapper');
    if (!wrapper) continue;
    const label = wrapper.querySelector('.comparison-rect-label');
    const sizeClass = getRectSizeClass(dims);
    wrapper.classList.remove('comparison-rect-large', 'comparison-rect-medium');

    if (sizeClass === 'small') {
      if (label && label.parentElement === rects[i]) {
        wrapper.insertBefore(label, rects[i]);
      }
    } else {
      if (label && label.parentElement !== rects[i]) {
        rects[i].appendChild(label);
      }
      if (sizeClass === 'large') wrapper.classList.add('comparison-rect-large');
      else wrapper.classList.add('comparison-rect-medium');
    }
  }
}

// ─── Dynamic Text Updates ───────────────────────────────────────────
function updateDynamicText() {
  if (!scrollRateComp) return;
  const els = document.querySelectorAll('[data-dynamic="scrollRate"]');
  const newRate = formatCompactMoney(currentBarWidth * DOLLARS_PER_PIXEL * SCROLL_RATE_PX);
  const localizedTitle = t(scrollRateComp.i18nKey, scrollRateComp.title);
  for (let i = 0; i < els.length; i++) {
    const titleEl = els[i].querySelector('.title');
    if (titleEl) {
      // The picture (band and magnifier) lives inside the title: keep it while the text is rewritten.
      const vizEl = titleEl.querySelector(':scope > .viz');
      titleEl.innerHTML = interpolate(localizedTitle, {
        richestName: richestName,
        scrollRate: newRate,
      });
      if (vizEl) titleEl.appendChild(vizEl);
    }
  }
}

// ─── Comparison Content Renderers ───────────────────────────────────
// Chapter question ("What could we do with less than 5% of the money?"):
// the percentage becomes the eye-catcher, a small line translates it into money.
function renderChapterInner(comp, text, totalWealth) {
  const pct = Number(comp.chapterPct) || 0;
  const prefix = comp.chapterPrefix || '';
  const pctText = fmtPctNumber(String(pct));
  const moneyLine = interpolate(tUI('chapter-of', '{pct} of {total} = {amount}'), {
    pct: pctText,
    total: formatCompactMoney(totalWealth),
    amount: formatCompactMoney(totalWealth * pct / 100),
  });
  return '<span class="chapter">' +
    '<span class="big num">' + (prefix ? prefix + ' ' : '') + pctText + '</span>' +
    '<span class="q">' + text.trim() + '</span>' +
    '<span class="of num">' + moneyLine + '</span>' +
  '</span>';
}

// Numbered step of the call to action. The text starts with "<strong>Heading</strong><br><br>".
function renderStepInner(comp, text) {
  const match = text.match(/^\s*<strong>([\s\S]*?)<\/strong>\s*(?:<br\s*\/?>\s*)*([\s\S]*)$/);
  const heading = match ? match[1] : '';
  const body = match ? match[2] : text;
  const counter = interpolate(tUI('step-counter', '{n} of {total}'), { n: comp.step, total: comp.stepTotal || 5 });
  return '<span class="step-top"><span class="step-icon" data-step-icon="' + (comp.stepIcon || '') + '"></span>' +
      '<span class="no num">' + counter + '</span></span>' +
    '<span class="step-hd">' + heading + '</span>' + body;
}

function renderTextContent(comp, vars, totalWealth) {
  const text = interpolate(comp.title, vars);
  let inner = text;
  if (comp.variant === 'chapter') inner = renderChapterInner(comp, text, totalWealth);
  else if (comp.variant === 'note') inner = '<span class="note-inner">' + text + '</span>';
  else if (comp.variant === 'step') inner = renderStepInner(comp, text);

  let html = '<div class="title">' + inner;
  if (comp.showShareButton) {
    html += '<div class="share-inline-row">' +
      '<button type="button" class="share-inline-btn" aria-live="polite">' +
      tUI('share-button', 'Share this page') +
      '</button>' +
    '</div>';
  }
  html += '</div>';
  return html;
}

function getSharePageUrl() {
  return window.location.origin + window.location.pathname;
}

function bindShareButton(wrapper, comp) {
  if (!comp.showShareButton) return;

  const btn = wrapper.querySelector('.share-inline-btn');
  if (!btn) return;

  const baseLabel = tUI('share-button', 'Share this page');
  const copiedLabel = tUI('share-copied', 'Link copied');
  const failedLabel = tUI('share-copy-failed', 'Copy failed');
  const shareTitle = tUI('share-title', document.title || 'Wealth shown to scale');
  let feedbackTimerId = null;

  function setButtonLabel(label) {
    btn.textContent = label;
  }

  function resetButtonLabelSoon() {
    if (feedbackTimerId !== null) {
      clearTimeout(feedbackTimerId);
    }
    feedbackTimerId = setTimeout(function() {
      setButtonLabel(baseLabel);
      feedbackTimerId = null;
    }, 1600);
  }

  function tryCopyToClipboard(shareUrl) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      setButtonLabel(failedLabel);
      resetButtonLabelSoon();
      return;
    }

    navigator.clipboard.writeText(shareUrl)
      .then(function() {
        setButtonLabel(copiedLabel);
        resetButtonLabelSoon();
      })
      .catch(function() {
        setButtonLabel(failedLabel);
        resetButtonLabelSoon();
      });
  }

  btn.addEventListener('click', function() {
    const shareUrl = getSharePageUrl();
    if (!shareUrl) return;

    if (navigator.share) {
      navigator.share({ title: shareTitle, url: shareUrl })
        .then(function() {
          setButtonLabel(copiedLabel);
          resetButtonLabelSoon();
        })
        .catch(function() {
          tryCopyToClipboard(shareUrl);
        });
      return;
    }

    tryCopyToClipboard(shareUrl);
  });
}

function renderImageContent(comp, vars) {
  const alt = (comp.imageAlt || comp.title || '').replace(/"/g, '&quot;');
  let html = '<div class="comparison-image-wrapper">';
  if (comp.title) {
    html += '<div class="title">' + interpolate(comp.title, vars) + '</div>';
  }
  html += '<img class="comparison-image" src="' + comp.imageUrl + '" alt="' + alt + '">';
  html += '</div>';
  return html;
}

function renderSquareContent(comp, vars) {
  const titleHtml = interpolate(comp.title, vars);

  if (!comp.amountUsd || comp.amountUsd <= 0) {
    return '<div class="comparison-rect-wrapper"><span class="comparison-rect-label">' + titleHtml + '</span></div>';
  }

  const dims = computeRectDimensions(comp.amountUsd);
  const color = comp.squareColor || '#2196F3';
  const rectStyle = 'width:' + dims.width.toFixed(1) + 'px;height:' + dims.height.toFixed(1) + 'px;background-color:' + color;
  const sizeClass = getRectSizeClass(dims);

  if (sizeClass === 'large') {
    return '<div class="comparison-rect-wrapper comparison-rect-large">' +
      '<div class="comparison-rect" data-amount-usd="' + comp.amountUsd + '" style="' + rectStyle + '">' +
        '<span class="comparison-rect-label">' + titleHtml + '</span>' +
      '</div></div>';
  }
  if (sizeClass === 'medium') {
    return '<div class="comparison-rect-wrapper comparison-rect-medium">' +
      '<div class="comparison-rect" data-amount-usd="' + comp.amountUsd + '" style="' + rectStyle + '">' +
        '<span class="comparison-rect-label">' + titleHtml + '</span>' +
      '</div></div>';
  }
  return '<div class="comparison-rect-wrapper">' +
    '<span class="comparison-rect-label">' + titleHtml + '</span>' +
    '<div class="comparison-rect" data-amount-usd="' + comp.amountUsd + '" style="' + rectStyle + '"></div>' +
  '</div>';
}

function renderShareStripHtml(pct) {
  return '<div class="share-strip"><i style="width:' + Math.min(100, pct).toFixed(2) + '%"></i></div>';
}

// Cause message (directly on the bar): the cost, its share of all billionaire wealth as a strip,
// the description, the death toll as a rhythm and the source.
function renderCauseContent(comp, totalWealth) {
  const pct = (comp.costUsd / totalWealth) * 100;
  const costSuffix = comp.costPeriod === 'yearly' ? tUI('cost-yearly', '/year') : '';
  const ofWealth = tUI('of-wealth-of-all-billionaires', 'of the wealth of<br>all billionaires');

  let html = '<div class="cause-card">' +
    '<h3 class="cause-title">' + comp.title + '</h3>' +
    '<div class="cause-cost num"><b>' + formatCompactMoney(comp.costUsd) + costSuffix + '</b>' +
      '<span>' + fmtPct(pct) + ' ' + ofWealth + '</span></div>' +
    renderShareStripHtml(pct) +
    '<div class="share-labels num"><span>' + formatCompactMoney(comp.costUsd) + '</span>' +
      '<span>' + formatCompactMoney(totalWealth) + '</span></div>' +
    '<p class="cause-desc">' + comp.description + '</p>';

  if (comp.deathsPerYear) {
    const perDay = Math.round(comp.deathsPerYear / 365);
    const counts = '<div class="cause-counts num">' +
      '<span><b>' + thousand.format(perDay) + '</b> ' + tUI('per-day', 'per day') + '</span>' +
      '<span><b>' + thousand.format(comp.deathsPerYear) + '</b> ' + tUI('per-year', 'per year') + '</span>' +
    '</div>';
    if (comp.deathRhythm) {
      // The yearly toll as a rhythm: one death every N seconds, with a line that runs down in real time.
      const seconds = SECONDS_PER_YEAR / comp.deathsPerYear;
      const interval = seconds < 120
        ? interpolate(tUI('interval-seconds', '{n} seconds'), { n: thousand.format(Math.round(seconds)) })
        : interpolate(tUI('interval-minutes', '{n} minutes'), { n: thousand.format(Math.round(seconds / 60)) });
      const phase = ((Date.now() - pageOpenedAt) / 1000) % seconds;
      html += '<div class="cause-deaths">' +
        '<p class="cause-rhythm">' + DEATH_FIGURE_SVG +
          '<span>' + interpolate(comp.deathRhythm, { interval: interval }) + '</span></p>' +
        '<div class="cause-beat" aria-hidden="true"><i style="animation-duration:' + seconds.toFixed(2) +
          's;animation-delay:-' + phase.toFixed(2) + 's"></i></div>' +
        counts +
      '</div>';
    } else {
      const deathLabel = comp.deathLabel || tUI('deaths', 'deaths');
      html += '<div class="cause-deaths">' +
        '<p class="cause-rhythm">' + DEATH_FIGURE_SVG + '<span>' + deathLabel + '</span></p>' + counts +
      '</div>';
    }
  }

  if (comp.affectedLine && Array.isArray(comp.affectedShare)) {
    html += renderAffectedHtml(comp.affectedLine, comp.affectedShare[0], comp.affectedShare[1]);
  }

  if (comp.sourceUrl) {
    html += '<p class="cause-source">' + tUI('source', 'Source') + ': <a href="' + comp.sourceUrl + '" target="_blank" rel="noopener noreferrer">' + (comp.sourceName || 'Link') + '</a></p>';
  }

  html += '</div>';
  return html;
}

// Share of the world's people affected: `total` figures, the first `affected` of them red,
// so the red part is as large as the share (1 in 7 → 7 figures, 1 in 300 → 300 small ones).
function renderAffectedHtml(line, affected, total) {
  const few = total <= 12;
  const cols = total <= 30 ? total : 50;
  const cell = few ? 'minmax(0, 22px)' : 'minmax(0, 1fr)';
  let figures = '';
  for (let i = 0; i < total; i++) {
    figures += i < affected ? DEATH_FIGURE_SVG : AFFECTED_OTHER_SVG;
  }
  return '<div class="cause-affected">' +
    '<p class="cause-affected-line">' + line + '</p>' +
    '<div class="cause-figures' + (few ? ' is-few' : '') + '" aria-hidden="true" ' +
      'style="grid-template-columns:repeat(' + cols + ',' + cell + ')">' + figures + '</div>' +
  '</div>';
}

// Rows of a summary card. Either one row per included cause (includeIds) or grouped
// areas (rows: [{ title, i18nKey, sub, ids }]). Costs always come from the causes themselves.
function getSummaryRows(comp) {
  const byId = {};
  (story.comparisons || []).forEach(function(c) { byId[c.id] = c; });
  const costOf = function(ids) {
    return (ids || []).reduce(function(sum, id) {
      const c = byId[id];
      if (!c || !c.costUsd) { console.warn('Summary refers to unknown cause:', id); return sum; }
      return sum + c.costUsd;
    }, 0);
  };

  let rows;
  if (Array.isArray(comp.rows)) {
    rows = comp.rows.map(function(row) {
      return {
        title: t(row.i18nKey, row.title),
        sub: row.i18nKey ? t(row.i18nKey + '-sub', row.sub || '') : (row.sub || ''),
        cost: costOf(row.ids),
      };
    });
  } else {
    rows = (comp.includeIds || []).filter(function(id) { return byId[id] && byId[id].costUsd; }).map(function(id) {
      return { title: t(byId[id].i18nKey, byId[id].title), sub: '', cost: byId[id].costUsd };
    });
  }
  rows.sort(function(x, y) { return y.cost - x.cost; });
  return rows;
}

// Summary card: areas sorted by cost with labelled bars, then the total and its share.
function replayButtonHtmlForSummary() {
  const util = window.WEALTH_VIZ && window.WEALTH_VIZ._util;
  return util ? util.replayButtonHtml(tUI('replay', 'Replay')) : '';
}

// Plays once when the summary scrolls in: the steps appear one after another, then the sum
// bar, the arrow and the share in the strip. The end state is the normal state.
function animateSummary(wrapper) {
  const util = window.WEALTH_VIZ && window.WEALTH_VIZ._util;
  const card = wrapper.querySelector('.summary-card');
  if (!util || !card) return;
  const steps = card.querySelectorAll('.summary-step i');
  const sumbar = card.querySelector('.summary-sumbar');
  const arrow = card.querySelector('.summary-arrow');
  const share = card.querySelector('.share-strip i');
  const stepMs = 220;
  const afterSteps = steps.length * stepMs + 150;
  const total = afterSteps + 1100;
  util.playOnce(card, total, function(t) {
    for (let i = 0; i < steps.length; i++) {
      steps[i].style.transform = 'scaleX(' + util.seg(t, i * stepMs, i * stepMs + 320).toFixed(3) + ')';
    }
    sumbar.style.opacity = util.seg(t, afterSteps, afterSteps + 250).toFixed(3);
    arrow.style.opacity = util.seg(t, afterSteps + 250, afterSteps + 550).toFixed(3);
    share.style.transform = 'scaleX(' + util.seg(t, afterSteps + 550, afterSteps + 1100).toFixed(3) + ')';
  });
}

// Arrow from the right end of the sum bar down to the right end of its share in the strip below
// (targetPct: that end in % of the width), so the whole sum visibly becomes the black share.
// It is drawn in pixels by layoutSummaryArrow, because its angle depends on the width.
function summaryArrowHtml(targetPct) {
  return '<div class="summary-arrow" data-pct="' + targetPct.toFixed(3) + '" aria-hidden="true"></div>';
}

// Draws the arrow for the current width: a curve that leaves the sum bar going down and
// arrives at the share at an angle, with a small arrow head along that last direction.
function layoutSummaryArrow(box) {
  const w = box.clientWidth;
  const h = box.clientHeight;
  if (!w || !h) return;
  const ex = Math.max(3, w * parseFloat(box.getAttribute('data-pct')) / 100);
  const ey = h - 0.5;
  const sx = w - 1;
  const c2x = ex + 22;
  const c2y = ey - 22;
  let dx = ex - c2x;
  let dy = ey - c2y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  dx /= len; dy /= len;
  const headLen = 7;
  const headHalf = 3.2;
  const bx = ex - dx * headLen;
  const by = ey - dy * headLen;
  const f = function(n) { return n.toFixed(1); };
  box.innerHTML = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
    '<path class="line" d="M' + f(sx) + ' 0C' + f(sx) + ' ' + f(h * 0.55) + ' ' + f(c2x) + ' ' + f(c2y) + ' ' + f(bx) + ' ' + f(by) + '"/>' +
    '<path class="tip" d="M' + f(ex) + ' ' + f(ey) +
      'L' + f(bx - dy * headHalf) + ' ' + f(by + dx * headHalf) +
      'L' + f(bx + dy * headHalf) + ' ' + f(by - dx * headHalf) + 'Z"/>' +
  '</svg>';
}

function renderSummaryContent(comp, totalWealth) {
  const rows = getSummaryRows(comp);
  const totalCost = rows.reduce(function(sum, row) { return sum + row.cost; }, 0);
  const summaryPct = (totalCost / totalWealth) * 100;
  const ofWealth = tUI('of-wealth-of-all-billionaires', 'of the wealth of<br>all billionaires');

  // A staircase: full width is the sum, each step starts where the one before ended, so the
  // steps together fill the sum bar below. An arrow then points from the sum to its share of
  // all billionaire wealth in the usual strip (full width there = all billionaires).
  const pctOfSum = function(v) { return totalCost ? (v / totalCost * 100).toFixed(3) + '%' : '0%'; };
  let acc = 0;
  let cuts = '';
  let html = '<div class="cause-card summary-card' + (rows.length >= 7 ? ' is-dense' : '') + '">' +
    '<h3 class="cause-title">' + comp.title + '</h3>' +
    '<p class="cause-desc">' + comp.description + '</p>' +
    '<div class="summary-rows num">';
  rows.forEach(function(row, i) {
    const left = acc;
    acc += row.cost;
    if (i < rows.length - 1) cuts += '<i style="left:' + pctOfSum(acc) + '"></i>';
    html += '<div class="summary-row">' +
      '<div class="l"><span>' + row.title + (row.sub ? '<small>' + row.sub + '</small>' : '') + '</span>' +
        '<b>' + formatCompactMoney(row.cost) + '</b></div>' +
      // The last step ends exactly at the right edge (its minimum width must not push it past).
      '<div class="summary-step"><i style="' + (i === rows.length - 1 ? 'right:0' : 'left:' + pctOfSum(left)) +
        ';width:' + pctOfSum(row.cost) + '"></i></div>' +
    '</div>';
  });
  html += '</div>' +
    '<div class="summary-total num">' +
      '<div class="cause-cost"><b>' + formatCompactMoney(totalCost) + '</b><span>' + fmtPct(summaryPct) + ' ' + ofWealth + '</span></div>' +
      '<div class="summary-sumbar">' + cuts + '</div>' +
      summaryArrowHtml(Math.min(100, summaryPct)) +
      renderShareStripHtml(summaryPct) +
      // The replay button sits between the two labels, so it adds no height.
      '<div class="share-labels num"><span>' + formatCompactMoney(totalCost) + '</span>' +
        replayButtonHtmlForSummary() +
        '<span>' + formatCompactMoney(totalWealth) + '</span></div>' +
    '</div>' +
  '</div>';
  return html;
}

// ─── Visualisations (registered by viz.js, one per comparison id) ───
function getVizContext(comp, wrapper, totalWealth) {
  return {
    comp: comp,
    root: wrapper,
    lang: getCurrentLanguage(),
    locale: getActiveLocale(),
    getComp: function(id) {
      return (story && story.comparisons || []).find(function(c) { return c.id === id; }) || null;
    },
    t: t,
    tUI: tUI,
    interpolate: interpolate,
    money: money,
    fmtInt: fmtInt,
    fmtPct: fmtPct,
    compact: formatCompactMoney,
    dollarsPerPixel: DOLLARS_PER_PIXEL,
    getBarWidth: function() { return currentBarWidth; },
    richestWealthUsd: richestPersonWealthUsd,
    richestName: richestName,
    allBillionairesUsd: allBillionairesTotalUsd,
    billionaireCount: billionaireCount,
    totalWealth: totalWealth,
  };
}

function attachViz(wrapper, comp, totalWealth) {
  const registry = window.WEALTH_VIZ;
  const make = registry && registry[comp.id];
  if (typeof make !== 'function') return;

  let result;
  try {
    result = make(getVizContext(comp, wrapper, totalWealth));
  } catch (error) {
    console.warn('Visualisation ' + comp.id + ' failed:', error);
    return;
  }
  if (!result) return;

  const host = wrapper.querySelector('.title, .comparison-rect-wrapper, .comparison-image-wrapper, .cause-card');
  if (!host) return;

  let vizEl = null;
  if (result.html) {
    vizEl = document.createElement('div');
    vizEl.className = 'viz' + (result.className ? ' ' + result.className : '');
    vizEl.innerHTML = result.html;
    // "replace" swaps out the default content (for example the plain image of the concert hall).
    if (result.replace) {
      const old = host.querySelector(result.replace);
      if (old) old.replaceWith(vizEl); else host.appendChild(vizEl);
    } else if (host.querySelector(':scope > .cause-source')) {
      // In a cause message the picture belongs to the text, above the source line.
      host.insertBefore(vizEl, host.querySelector(':scope > .cause-source'));
    } else {
      host.appendChild(vizEl);
    }
  }
  if (typeof result.mount === 'function') {
    pendingVizMounts.push(function() { result.mount(vizEl, wrapper); });
  }
  if (typeof result.resize === 'function') {
    wrapper._vizResize = function() { result.resize(vizEl, wrapper); };
  }
}

function runVizResize() {
  const els = document.querySelectorAll('.infobox');
  for (let i = 0; i < els.length; i++) {
    if (typeof els[i]._vizResize === 'function') {
      try { els[i]._vizResize(); } catch (error) { console.warn('Visualisation resize failed:', error); }
    }
  }
}

function createComparisonElement(comp, totalWealth, vars) {
  comp = localizeComp(comp);
  const wrapper = document.createElement('div');
  wrapper.className = 'infobox comparison-' + comp.id;
  if (comp.variant) wrapper.classList.add('is-' + comp.variant);
  if (comp.dense) wrapper.classList.add('is-dense');

  switch (comp.type) {
    case 'text':
      wrapper.classList.add('text-infobox');
      if (comp.dynamic) wrapper.setAttribute('data-dynamic', comp.dynamic);
      wrapper.innerHTML = renderTextContent(comp, vars, totalWealth);
      break;
    case 'square':
      wrapper.classList.add('text-infobox');
      wrapper.innerHTML = renderSquareContent(comp, vars);
      break;
    case 'cause':
      wrapper.classList.add('text-infobox', 'cause-infobox');
      wrapper.innerHTML = renderCauseContent(comp, totalWealth);
      break;
    case 'summary':
      wrapper.classList.add('text-infobox', 'summary-infobox');
      wrapper.innerHTML = renderSummaryContent(comp, totalWealth);
      break;
    case 'image':
      wrapper.classList.add('text-infobox', 'image-infobox');
      wrapper.innerHTML = renderImageContent(comp, vars);
      break;
    default:
      wrapper.classList.add('text-infobox');
      wrapper.innerHTML = renderTextContent(comp, vars, totalWealth);
  }

  bindShareButton(wrapper, comp);
  attachViz(wrapper, comp, totalWealth);
  if (comp.type === 'summary') animateSummary(wrapper);

  return wrapper;
}

// ─── Death Ticker ───────────────────────────────────────────────────
function getTickerItemLabel(comp) {
  const raw = comp.tickerDescription || comp.deathLabel || comp.title || '';
  return String(raw).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function startDeathTicker() {
  const tickerEl = document.getElementById('death-ticker');
  const countsEl = document.getElementById('death-ticker-counts');
  const closeBtn = document.getElementById('death-ticker-close');
  const reopenBtn = document.getElementById('death-ticker-reopen');
  if (!tickerEl || !countsEl || !closeBtn || !reopenBtn) return;

  var tickerLabel = tickerEl.querySelector('.death-ticker-label');
  if (tickerLabel) {
    tickerLabel.textContent = tUI('preventable-deaths-label', 'Preventable deaths since you opened this page');
  }
  const pillCountEl = document.getElementById('death-ticker-pill-count');
  const pillLabelEl = document.getElementById('death-ticker-pill-label');
  if (pillLabelEl) pillLabelEl.textContent = tUI('deaths', 'deaths');
  // The ticker is a pill that opens on tap. When it first appears it opens by itself for a few
  // seconds, so readers see what is behind it, then folds back so it never covers the text.
  if (tickerEl.dataset.minimized === undefined) tickerEl.dataset.minimized = 'true';
  let introShown = false;
  let introTimer = null;

  // Build groups from comparisons that have both deathsPerYear and tickerGroup
  const groups = {};
  const groupOrder = [];
  if (story && story.comparisons) {
    story.comparisons.forEach(function(c) {
      if (!c.deathsPerYear || !c.tickerGroup) return;
      var lc = localizeComp(c);  // ← localize here
      if (!groups[c.tickerGroup]) {
        groups[c.tickerGroup] = [];
        groupOrder.push(c.tickerGroup);
      }
      groups[c.tickerGroup].push({
        label: getTickerItemLabel(lc),
        perSecond: c.deathsPerYear / (365.25 * 24 * 3600),
      });
    });
  }

  if (groupOrder.length === 0) return;

  const groupCauseText = {};
  groupOrder.forEach(function(groupName) {
    groupCauseText[groupName] = groups[groupName].map(function(item) { return item.label; }).join(', ');
  });

  // The ticker starts at a chosen message (story.deathTicker.startAt), else at the first death toll.
  const firstGroupComp = story.comparisons.find(function(c) { return c.tickerGroup && c.deathsPerYear; });
  const startId = (story.deathTicker && story.deathTicker.startAt) || (firstGroupComp && firstGroupComp.id);
  // Looked up on every check: the messages are rebuilt after the ticker starts (language, resize).
  let triggerEl = null;
  let triggerMsgEl = null;
  function findTrigger() {
    if (triggerEl && triggerEl.isConnected) return;
    triggerEl = startId ? document.querySelector('.comparison-' + startId) : null;
    triggerMsgEl = triggerEl ? (triggerEl.querySelector(STICKY_CONTENT_SELECTOR) || triggerEl) : null;
  }

  // Breakdown link, shown only in the small intro panel
  const moreBtn = document.createElement('button');
  moreBtn.type = 'button';
  moreBtn.className = 'ticker-more';
  moreBtn.innerHTML = tUI('ticker-breakdown', 'Breakdown') +
    '<svg width="7" height="11" viewBox="0 0 7 11" aria-hidden="true"><path d="M1.5 1.5l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  tickerEl.appendChild(moreBtn);

  let tickerVisible = null;

  function endIntro() {
    if (introTimer) { clearTimeout(introTimer); introTimer = null; }
  }

  // The intro opens the full panel only where it leaves the start message free; where it
  // would cover it (phones), it opens small: heading, total and a link to the breakdown.
  function chooseIntroSize() {
    tickerEl.classList.remove('is-compact');
    if (!triggerMsgEl) return;
    const panel = tickerEl.getBoundingClientRect();
    const msg = triggerMsgEl.getBoundingClientRect();
    const stickyTop = parseFloat(getComputedStyle(triggerMsgEl).top);
    const msgTop = isNaN(stickyTop) ? msg.top : stickyTop;
    const msgBottom = msgTop + msg.height;
    const overlapX = panel.left < msg.right && panel.right > msg.left;
    const overlapY = panel.top < msgBottom + 8 && panel.bottom > msgTop;
    if (overlapX && overlapY) tickerEl.classList.add('is-compact');
  }

  function checkVisibility() {
    findTrigger();
    if (!triggerEl) return;
    // Until the messages are placed along the bars they all sit at the top; ignore that state.
    const placed = triggerEl.offsetTop > getStableVh();
    const reached = placed && triggerMsgEl.getBoundingClientRect().top < getStableVh() * 0.6;
    // The intro opens only while the start message is on screen; someone who jumps past it
    // (scrollbar, link) just gets the pill, so the panel never lands on an unrelated message.
    if (reached && !introShown) {
      introShown = true;
      if (triggerMsgEl.getBoundingClientRect().bottom > 0) openIntro();
    }
    finishCheck(reached);
  }

  function openIntro() {
    tickerEl.dataset.minimized = 'false';
    tickerEl.hidden = false;
    chooseIntroSize();
    introTimer = setTimeout(function() {
      introTimer = null;
      tickerEl.dataset.minimized = 'true';
      checkVisibility();
    }, TICKER_INTRO_MS);
  }

  function finishCheck(reached) {
    const minimized = tickerEl.dataset.minimized === 'true';
    if (minimized) tickerEl.classList.remove('is-compact');
    // The pill stays once the first death toll is reached; it opens and closes the panel above it.
    tickerEl.hidden = !reached || minimized;
    reopenBtn.style.display = reached ? 'flex' : 'none';
    reopenBtn.setAttribute('aria-expanded', minimized ? 'false' : 'true');
    tickerVisible = reached;
    fitTickerPill();
  }

  let tickerVisibilityRafId = null;
  window.addEventListener('scroll', function() {
    if (tickerVisibilityRafId !== null) return;
    tickerVisibilityRafId = requestAnimationFrame(function() {
      tickerVisibilityRafId = null;
      checkVisibility();
    });
  }, { passive: true });
  checkVisibility();

  function translateGroupName(name) {
    return t('i18n-ticker-group-' + name.toLowerCase().replace(/ /g, '-'), name);
  }

  function update() {
    const elapsed = (Date.now() - pageOpenedAt) / 1000;
    let grandTotal = 0;
    let html = '';

    groupOrder.forEach(function(groupName) {
      let groupTotal = 0;
      groups[groupName].forEach(function(r) {
        groupTotal += Math.floor(r.perSecond * elapsed);
      });
      grandTotal += groupTotal;
      html += '<div class="ticker-group">' +
        '<span class="ticker-count">' + thousand.format(groupTotal) + '</span>' +
        '<span>' + translateGroupName(groupName) +
          '<small class="ticker-group-causes">' + groupCauseText[groupName] + '</small></span>' +
      '</div>';
    });

    html += '<div class="ticker-total">' +
      '<span class="ticker-count">' + thousand.format(grandTotal) + '</span>' +
      '<span>' + tUI('total-preventable-deaths', 'total preventable deaths') + '</span>' +
    '</div>';
    countsEl.innerHTML = html;
    if (pillCountEl) pillCountEl.textContent = thousand.format(grandTotal);
    if (pillLabelEl) pillLabelEl.textContent = grandTotal === 1 ? tUI('death', 'death') : tUI('deaths', 'deaths');
    fitTickerPill();
  }

  // The two pills must never touch: on narrow screens (or with a long number) the word
  // "deaths" is left out of the ticker pill; the red figure still says what is counted.
  function fitTickerPill() {
    if (reopenBtn.style.display === 'none' || !nextMessageBtn || nextMessageBtn.hidden) return;
    reopenBtn.classList.remove('is-short');
    const gap = reopenBtn.getBoundingClientRect().left - nextMessageBtn.getBoundingClientRect().right;
    if (gap < 8) reopenBtn.classList.add('is-short');
  }

  update();
  if (tickerIntervalId) clearInterval(tickerIntervalId);
  tickerIntervalId = setInterval(function() {
    update();
    updateWealthCounter();
  }, TICKER_UPDATE_MS);

  // Once the reader opens or closes it, the ticker stays as they left it.
  closeBtn.onclick = function(e) {
    e.stopPropagation();
    endIntro();
    tickerEl.dataset.minimized = 'true';
    checkVisibility();
  };
  reopenBtn.onclick = function() {
    endIntro();
    tickerEl.classList.remove('is-compact');
    tickerEl.dataset.minimized = tickerEl.dataset.minimized === 'true' ? 'false' : 'true';
    checkVisibility();
  };
  // Tapping the small intro panel opens the full breakdown.
  tickerEl.addEventListener('click', function() {
    if (!tickerEl.classList.contains('is-compact')) return;
    endIntro();
    tickerEl.classList.remove('is-compact');
  });
  // Moving on to the next message ends the intro, so the panel never sits on the next text.
  if (nextMessageBtn) {
    nextMessageBtn.addEventListener('click', function() {
      if (!introTimer) return;
      endIntro();
      tickerEl.dataset.minimized = 'true';
      checkVisibility();
    });
  }
  reopenBtn.setAttribute('aria-controls', 'death-ticker');
  checkVisibility();
}

// ─── Init ───────────────────────────────────────────────────────────
const redirectedForLanguagePreference = redirectToLanguageIfNeeded();

if (!redirectedForLanguagePreference) {
  createLanguageMenu();
}

applyDimensions(computeBarWidth());

let resizeRafId = null;
window.addEventListener('resize', function() {
  if (resizeRafId) cancelAnimationFrame(resizeRafId);
  resizeRafId = requestAnimationFrame(function() {
    resizeRafId = null;
    const scrollTop = window.scrollY || window.pageYOffset || 0;

    let anchor = null;
    const richestEl = document.getElementById('richest');
    const allEl = document.getElementById('allBillionaires');

    if (richestEl && scrollTop >= richestEl.offsetTop && scrollTop < richestEl.offsetTop + richestEl.offsetHeight) {
      anchor = { id: 'richest', frac: (scrollTop - richestEl.offsetTop) / richestEl.offsetHeight };
    } else if (allEl && scrollTop >= allEl.offsetTop && scrollTop < allEl.offsetTop + allEl.offsetHeight) {
      anchor = { id: 'allBillionaires', frac: (scrollTop - allEl.offsetTop) / allEl.offsetHeight };
    }

    prevCappedFraction = cappedFraction;
    applyDimensions(computeBarWidth());
    updateRectSizes();
    updateDynamicText();
    runVizResize();

    // Re-render comparisons if capping state changed
    if (cappedFraction !== prevCappedFraction) {
      renderComparisons();
    } else {
      updateAllComparisonPositions();
    }
    refitStickyContent();

    if (anchor) {
      const el = document.getElementById(anchor.id);
      if (el) window.scrollTo(0, el.offsetTop + anchor.frac * el.offsetHeight);
    }
  });
});

let scrollRafScheduled = false;
window.addEventListener('scroll', function() {
  if (!scrollRafScheduled) {
    scrollRafScheduled = true;
    requestAnimationFrame(function() {
      updateWealthCounters();
      updateRulers();
      updateNextMessageButtonState();
      scrollRafScheduled = false;
    });
  }
}, { passive: true });

if (!redirectedForLanguagePreference) {
  loadData();
}