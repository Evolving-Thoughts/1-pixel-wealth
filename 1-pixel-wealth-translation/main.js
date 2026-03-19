var bezos = document.getElementById('bezos');
var bezos_counter = document.getElementById('bezos-counter');
var bezosCounterStart = document.getElementById('bezos-counter-start');

var four_hundred = document.getElementById('four-hundred');
var four_hundred_counter = document.getElementById('four-hundred-counter');
var four_hundred_counter_start = document.getElementById('four-hundred-counter-start');

var sixtyPercent = document.getElementById('sixty-percent');
var sixtyPercentIndicator = document.getElementById('sixty-percent-indicator');
var sixtyPercentScrollPercentage = 0.0;
var babies = document.getElementById('babies-wrapper');
var baby_counter = document.getElementById('baby-counter');

var thousand = new Intl.NumberFormat('en-US')
var money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

var richestPersonWealthUsd = 139000000000;  // updated from data/billionaires.json
var top200WealthUsd        = 5920000000000; // updated from data/billionaires.json
var currentBarWidth        = 500;           // updated on load and resize

function computeBarWidth() {
  // clientWidth excludes the scrollbar, giving the true usable content width
  var em = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Math.max(200, Math.floor(document.documentElement.clientWidth - 2 * em));
}

function applyDimensions(barWidth) {
  currentBarWidth = barWidth;
  // The $1B bar is capped at 1000px wide so it never becomes wider than tall
  var billionBarWidth = Math.min(barWidth, 1000);
  var billionH = Math.round(1e9 / (billionBarWidth * 1000));
  var richestH = Math.round(richestPersonWealthUsd / (barWidth * 1000));
  var top200H  = Math.round(top200WealthUsd        / (barWidth * 1000));
  var scale    = richestH / 278000; // proportional to original Bezos bar
  var root     = document.documentElement.style;
  root.setProperty('--bar-width',              barWidth          + 'px');
  root.setProperty('--bar-width-billion',      billionBarWidth   + 'px');
  root.setProperty('--billion-h',              billionH   + 'px');
  root.setProperty('--richest-h',              richestH   + 'px');
  root.setProperty('--top200-h',               top200H    + 'px');
  root.setProperty('--infobox-margin',         Math.round(6000  * scale) + 'px');
  root.setProperty('--infobox-first-margin',   Math.round(30000 * scale) + 'px');
  root.setProperty('--infobox-half-margin',    Math.round(4000  * scale) + 'px');
  root.setProperty('--infobox-quarter-margin', Math.round(2000  * scale) + 'px');
  root.setProperty('--infobox-close-margin',   Math.round(500   * scale) + 'px');
  // update scale label: 160px tall × barWidth px wide × $1000/px² = scale value in $
  var scaleText = formatCompactMoney(160 * barWidth * 1000);
  var scaleEls = document.querySelectorAll('.scale-label');
  for (var i = 0; i < scaleEls.length; i++) { scaleEls[i].textContent = scaleText; }
}

function formatCompactMoney(n) {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2).replace(/\.?0+$/, '') + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  return money.format(n);
}

function applyBillionaireData(data) {
  richestPersonWealthUsd = Number(data.people[0].wealthUsd);
  top200WealthUsd        = Number(data.totalWealthUsd);
  var richestName = data.people[0].name;

  // recompute all heights for current bar width
  applyDimensions(computeBarWidth());

  // Update section titles
  var richestTitle = document.getElementById('richest-title');
  if (richestTitle) richestTitle.textContent = money.format(richestPersonWealthUsd) + ' (wealth of ' + richestName + ')';

  var top200Title = document.getElementById('top200-title');
  if (top200Title) top200Title.textContent = '200 richest people worldwide (' + formatCompactMoney(top200WealthUsd) + ')';

  // Update richest-person intro blurb
  var richestIntro = document.getElementById('richest-intro-text');
  if (richestIntro) richestIntro.textContent = richestName + '\u2019s wealth is quite literally unimaginable.';

  // Update chemo comparison text
  var chemoText = document.getElementById('richest-chemo-text');
  if (chemoText) {
    var dailyWealth = Math.round(richestPersonWealthUsd / 365);
    chemoText.textContent = richestName + ' earns approximately ' + formatCompactMoney(dailyWealth) + ' per day.';
  }

  // Update top-200 intro
  var top200Intro = document.getElementById('top200-intro-text');
  if (top200Intro) top200Intro.textContent = 'The wealth of the richest person may seem staggering, but it is a drop in the ocean compared to the combined wealth of the 200 richest people worldwide. Together they own ' + formatCompactMoney(top200WealthUsd) + '.';

  // Source attribution
  var sourceEl = document.getElementById('data-source');
  if (sourceEl) {
    var d = new Date(data.fetchedAt);
    var dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
    sourceEl.innerHTML = 'Wealth data: <a href="' + data.sourceUrl + '" target="_blank" rel="noreferrer">' + data.source + '</a> &mdash; last updated ' + dateStr;
  }
}

// Fetch billionaires.json — tries local first, then parent dir (for /de/ page)
(function loadBillionaireData() {
  fetch('data/billionaires.json')
    .then(function(r) {
      if (r.ok) return r.json();
      return fetch('../data/billionaires.json').then(function(r2) {
        if (r2.ok) return r2.json();
        throw new Error('billionaires.json not found');
      });
    })
    .then(applyBillionaireData)
    .catch(function(e) { console.warn('Could not load billionaire data:', e); });
}());

// Apply dimensions on load and on every resize
applyDimensions(computeBarWidth());
window.addEventListener('resize', function() { applyDimensions(computeBarWidth()); });

//todo: also work for 400 richest
window.addEventListener('scroll', function(){
  update_wealth_counter();
});

function generate_sixty_percent() {
  for (var i = 0; i < 100; i++) {
    var node = document.createElement("div");
    node.classList = "people";
    if (i === 0) {
      node.classList += " first";
    }
    document.getElementById("sixty-percent").appendChild(node);
  }
}
generate_sixty_percent();

sixtyPercent.addEventListener('scroll', function(){
  let newScroll = ((sixtyPercent.scrollTop / sixtyPercent.scrollHeight) * 60).toFixed(1);
  if (sixtyPercentScrollPercentage !== newScroll) {
    sixtyPercentScrollPercentage = newScroll;
    sixtyPercentIndicator.innerHTML = newScroll + '%';
  }
})
babies.addEventListener('scroll', function(){
  let is_mobile = window.innerWidth <= 450;
  let bg_size = (is_mobile) ? 68 : 160;
  baby_counter.innerHTML = thousand.format(Math.floor(babies.scrollTop / bg_size * 5));
})

//Todo: stop executing once scrolled past
function update_wealth_counter() {
  var scrollTop = window.scrollY || window.pageYOffset || 0;
  if (bezos_viewable()) {
    if (bezos_counter_viewable()) {
      let wealth = (scrollTop - bezos.offsetTop + 175) * (currentBarWidth * 1000);
      bezos_counter.innerHTML = (wealth < richestPersonWealthUsd) ? money.format(wealth) : money.format(richestPersonWealthUsd);
    }
    else {
      bezos_counter.innerHTML = '';
    }
  }
  else if (four_hundred_viewable()) {
    if (four_hundred_counter_viewable()) {
      let wealth = (scrollTop - four_hundred.offsetTop + 175) * (currentBarWidth * 1000);
      four_hundred_counter.innerHTML = (wealth < top200WealthUsd) ? money.format(wealth) : money.format(top200WealthUsd);
    }
    else {
      four_hundred_counter.innerHTML = '';
    }
  }
  function bezos_viewable() {
    return scrollTop < bezos.offsetTop + bezos.offsetHeight + 100;
  }
  function bezos_counter_viewable() {
    return bezosCounterStart.offsetTop - scrollTop < (window.innerHeight);
  }
  function four_hundred_viewable() {
    return scrollTop < four_hundred.offsetTop + four_hundred.offsetHeight + 100;
  }
  function four_hundred_counter_viewable() {
    return four_hundred_counter_start.offsetTop - scrollTop < (window.innerHeight);
  }
}
function toggleZoom() {
  document.getElementById('line-chart').classList.toggle('zoom');
}
