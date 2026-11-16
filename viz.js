// Visualisations for single messages.
//
// Each entry of window.WEALTH_VIZ is keyed by the comparison id from data/story.json and
// returns { html, mount(el, wrapper), resize(el, wrapper), replace, className }.
// main.js appends the markup to the message and calls mount() once it is in the document.
// Rule of the page: area always stands for an amount. One square pixel is $1,000.
(function() {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var VIZ = window.WEALTH_VIZ = window.WEALTH_VIZ || {};

  // ─── Helpers ──────────────────────────────────────────────────────
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function svgEl(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) { if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]); }
    if (parent) parent.appendChild(e);
    return e;
  }

  function ease(t) {
    t = Math.max(0, Math.min(1, t));
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  // Eased progress of t between a and b.
  function seg(t, a, b) {
    return ease((t - a) / (b - a));
  }

  function replayButtonHtml(label) {
    return '<button class="viz-replay" type="button">' +
      '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7a4.5 4.5 0 1 0 1.3-3.2M2.5 1.5v2.8h2.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      label + '</button>';
  }

  // Plays render(t) from 0 to total once when the element scrolls into view.
  // Afterwards a "replay" button appears. With reduced motion the end state is shown at once,
  // and there is no replay button: it would have nothing to play.
  function playOnce(root, total, render) {
    var replay = root.querySelector('.viz-replay');
    var raf = 0;
    var played = false;

    function finish() {
      if (replay) replay.classList.add('show');
    }

    function play() {
      cancelAnimationFrame(raf);
      if (replay) replay.classList.remove('show');
      if (prefersReducedMotion()) { render(total); return; }
      var startedAt = performance.now();
      (function step(now) {
        var t = now - startedAt;
        render(Math.min(t, total));
        if (t < total) raf = requestAnimationFrame(step);
        else finish();
      })(startedAt);
    }

    if (replay) replay.addEventListener('click', play);
    render(0);

    if (typeof IntersectionObserver === 'undefined') { play(); return play; }
    new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting && !played) { played = true; play(); }
      });
    }, { threshold: 0.5 }).observe(root);
    return play;
  }

  // Shared with the entries below.
  VIZ._util = {
    svgEl: svgEl,
    ease: ease,
    seg: seg,
    playOnce: playOnce,
    replayButtonHtml: replayButtonHtml,
    prefersReducedMotion: prefersReducedMotion,
  };
})();

// ════════════════════════════════════════════════════════════════════
// Richest-person bar (orange)
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';
  var VIZ = window.WEALTH_VIZ;
  var U = VIZ._util;

  // Picks the German or English wording.
  function L(ctx, de, en) {
    return ctx.lang === 'de' ? de : en;
  }

  function decimals(ctx, n, digits) {
    return n.toLocaleString(ctx.locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function replay(ctx) {
    return U.replayButtonHtml(ctx.tUI('replay', 'Replay'));
  }

  function squareSide(ctx, amountUsd) {
    return Math.sqrt(amountUsd / ctx.dollarsPerPixel);
  }

  U.L = L;
  U.decimals = decimals;
  U.replay = replay;
  U.squareSide = squareSide;

  // 2 ─ Ten pixels of scrolling: a band as wide as the bar and ten pixels high, magnified below.
  VIZ['scroll-rate'] = function(ctx) {
    return {
      html:
        '<div class="v-band"></div>' +
        '<svg width="20" height="24" viewBox="0 0 20 24" aria-hidden="true" style="margin-top:3px"><path d="M10 23V3M5 8l5-5 5 5" fill="none" stroke="#111" stroke-width="1.5"/></svg>' +
        '<div class="v-zoom-wrap" aria-hidden="true">' +
          '<div class="v-zoom"><div class="rows"></div><div class="brk"></div>' +
            '<div class="brk-t">' + L(ctx, '10 Pixel', '10 pixels') + '</div></div>' +
          '<div class="v-zoom-handle"></div>' +
        '</div>',
    };
  };

  // 7 ─ Buckling a seat belt takes four real seconds; the amount counts up meanwhile.
  VIZ['seat-belt'] = function(ctx) {
    var amountUsd = ctx.comp.amountUsd || 63420;
    var DRAW = 3600;
    var TOTAL = 4000;
    return {
      className: 'v-belt',
      html:
        '<svg width="120" height="99" viewBox="0 0 150 124" aria-hidden="true">' +
          '<g fill="#E39500" stroke="rgba(17,17,17,.55)" stroke-width="2" stroke-linejoin="round">' +
            '<rect x="58" y="4" width="30" height="17" rx="6"/>' +
            '<rect x="44" y="24" width="58" height="70" rx="13"/>' +
            '<rect x="36" y="90" width="74" height="22" rx="9"/>' +
          '</g>' +
          '<rect x="20" y="12" width="14" height="11" rx="2.5" fill="#111"/>' +
          '<rect class="receiver" x="108" y="92" width="16" height="20" rx="3.5" fill="#111"/>' +
          '<rect x="113" y="95" width="6" height="2.5" rx="1" fill="#F2A63B" style="fill:var(--orange)"/>' +
          '<path class="strap" d="M30 22L110 98" fill="none" stroke="#111" stroke-width="7" stroke-dasharray="111" stroke-dashoffset="111"/>' +
          '<g class="tongue"><rect x="-7" y="-4.5" width="14" height="9" rx="2" fill="#fff" stroke="#111" stroke-width="2"/></g>' +
          '<g class="click" stroke="#111" stroke-width="2" stroke-linecap="round"><path d="M130 90l6-6M133 101h8M130 112l6 6"/></g>' +
        '</svg>' +
        '<div class="amount num"></div>' +
        '<div class="clock num"></div>' +
        replay(ctx),
      mount: function(el, wrapper) {
        var strap = el.querySelector('.strap');
        var tongue = el.querySelector('.tongue');
        var click = el.querySelector('.click');
        var amount = el.querySelector('.amount');
        var clock = el.querySelector('.clock');
        var square = wrapper.querySelector('.comparison-rect');
        var A = { x: 30, y: 22 };
        var B = { x: 110, y: 98 };
        var LEN = 111;
        var pinged = false;

        U.playOnce(el, TOTAL, function(t) {
          var p = t > DRAW ? 1 : U.ease(Math.min(t / DRAW, 1));
          strap.style.strokeDashoffset = String(LEN * (1 - p));
          var x = A.x + (B.x - A.x) * p;
          var y = A.y + (B.y - A.y) * p;
          var push = t > DRAW ? Math.min((t - DRAW) / (TOTAL - DRAW), 1) * 4 : 0;
          tongue.setAttribute('transform', 'translate(' + (x + push * 0.72) + ' ' + (y + push * 0.69) + ') rotate(43.5)');
          var done = t >= TOTAL;
          click.classList.toggle('on', done);
          amount.textContent = ctx.money.format(Math.round(amountUsd * Math.min(t / TOTAL, 1)));
          clock.textContent = decimals(ctx, Math.min(t, TOTAL) / 1000, 1) + ' ' + L(ctx, 'Sekunden', 'seconds');
          // When the belt clicks in, the square briefly gets a ring: the eye goes back to it.
          if (!done) { pinged = false; return; }
          if (!pinged && square) {
            pinged = true;
            square.classList.add('ping');
            setTimeout(function() { square.classList.remove('ping'); }, 900);
          }
        });
      },
    };
  };

  // 9 ─ One minute of coffee: more than two US houses fit into the square.
  VIZ['instant-coffee'] = function(ctx) {
    var house = ctx.getComp('average-cost-house');
    if (!house || !house.amountUsd) return null;
    var side = squareSide(ctx, house.amountUsd);
    var ratio = ctx.comp.amountUsd / house.amountUsd;
    return {
      html:
        '<div class="viz-legend num">' +
          '<span><i class="k-solid" style="background:' + (ctx.comp.squareColor || '#00E676') + '"></i>' + L(ctx, '1 Minute Kaffee', '1 minute of coffee') + '</span>' +
          '<span><i class="k-dashed"></i>' + L(ctx, '1 Haus in den USA', '1 house in the US') + '</span>' +
        '</div>' +
        '<p class="viz-cap">' + (ratio >= 2
          ? L(ctx, 'Mehr als zwei Häuser pro Kaffee', 'More than two houses per coffee')
          : L(ctx, 'Mehr als ein Haus pro Kaffee', 'More than one house per coffee')) + '</p>',
      mount: function(el, wrapper) {
        var rect = wrapper.querySelector('.comparison-rect');
        if (!rect) return;
        rect.classList.add('has-inner');
        var inner = document.createElement('i');
        inner.className = 'v-inner-dashed';
        inner.style.width = inner.style.height = side.toFixed(2) + 'px';
        rect.appendChild(inner);
      },
    };
  };

  // 11 ─ A lifetime of the poorer half, inside the lifetime income of a median American (dashed).
  VIZ['lifetime-earnings-poorest-half'] = function(ctx) {
    var american = ctx.getComp('lifetime-earnings-american');
    if (!american || !american.amountUsd) return null;
    var side = squareSide(ctx, american.amountUsd);
    return {
      html:
        '<div class="viz-legend num">' +
          '<span><i class="k-solid" style="background:' + (ctx.comp.squareColor || '#2196F3') + '"></i>' + ctx.compact(ctx.comp.amountUsd) + '</span>' +
          '<span><i class="k-dashed"></i>' + L(ctx, 'US-Amerikaner: ', 'US American: ') + ctx.compact(american.amountUsd) + '</span>' +
        '</div>',
      mount: function(el, wrapper) {
        var rect = wrapper.querySelector('.comparison-rect');
        if (!rect || !rect.parentElement) return;
        var ghost = document.createElement('div');
        ghost.className = 'v-ghost';
        ghost.style.width = ghost.style.height = side.toFixed(2) + 'px';
        rect.parentElement.insertBefore(ghost, rect);
        ghost.appendChild(rect);
      },
    };
  };

  // 16 ─ Watching Barbie: the part beyond Ryan Gosling's entire wealth is outlined with dashes.
  VIZ['movie-barbie'] = function(ctx) {
    var gosling = ctx.getComp('estimated-wealth-ryan-gosling');
    if (!gosling || !gosling.amountUsd || gosling.amountUsd >= ctx.comp.amountUsd) return null;
    var extraUsd = ctx.comp.amountUsd - gosling.amountUsd;
    var extraPct = extraUsd / ctx.comp.amountUsd * 100;
    return {
      mount: function(el, wrapper) {
        var rect = wrapper.querySelector('.comparison-rect');
        if (!rect) return;
        rect.classList.add('v-split');
        // The label is centred with flexbox; one inner element keeps its text and link in one flow.
        var label = rect.querySelector('.comparison-rect-label');
        if (label && !label.querySelector('.v-split-text')) {
          var text = document.createElement('span');
          text.className = 'v-split-text';
          while (label.firstChild) text.appendChild(label.firstChild);
          label.appendChild(text);
        }
        rect.style.setProperty('--split-main', (100 - extraPct).toFixed(2) + '%');
        var extra = document.createElement('div');
        extra.className = 'v-extra';
        extra.style.height = extraPct.toFixed(2) + '%';
        extra.innerHTML = '<b class="num">+ ' + ctx.compact(extraUsd) + '</b><span>' +
          L(ctx, 'mehr, als Ryan Gosling insgesamt besitzt (~', 'more than Ryan Gosling owns in total (~') +
          ctx.compact(gosling.amountUsd) + ')</span>';
        rect.appendChild(extra);
        // Too low for both lines: keep the amount inside, put the explanation below the square.
        var fit = function() {
          extra.classList.remove('is-outside');
          if (extra.scrollHeight > extra.clientHeight + 1) extra.classList.add('is-outside');
        };
        fit();
        if (window.ResizeObserver) new ResizeObserver(fit).observe(rect);
      },
    };
  };

  // 17 ─ A number line from you to Elon Musk; Gosling sits a fraction of a pixel next to you.
  VIZ['gosling-musk-comparison'] = function(ctx) {
    var gosling = ctx.getComp('estimated-wealth-ryan-gosling');
    var goslingUsd = gosling && gosling.amountUsd ? gosling.amountUsd : 90e6;
    function update(el) {
      var axis = el.querySelector('.axis');
      var out = el.querySelector('.zoomline');
      if (!axis || !out) return;
      var width = axis.getBoundingClientRect().width;
      if (!width) return;
      var px = goslingUsd / ctx.richestWealthUsd * width;
      var value = decimals(ctx, px, px < 0.1 ? 3 : 2);
      out.textContent = ctx.lang === 'de'
        ? 'Gosling (' + ctx.compact(goslingUsd) + ') liegt auf diesem ' + Math.round(width) + ' Pixel langen Strahl nur ' + value + ' Pixel neben dir.'
        : 'On this ' + Math.round(width) + '-pixel line, Gosling (' + ctx.compact(goslingUsd) + ') sits just ' + value + ' pixels away from you.';
    }
    return {
      className: 'v-nl',
      html:
        '<div class="axis"><i class="tick"></i><i class="tick end"></i></div>' +
        '<div class="v-row-labels num"><span>' + L(ctx, 'Du und<br>Ryan Gosling', 'You and<br>Ryan Gosling') + '</span>' +
          '<span>' + ctx.richestName + '<br>' + ctx.compact(ctx.richestWealthUsd) + '</span></div>' +
        '<div class="zoomline num"></div>',
      mount: function(el) {
        update(el);
        if (typeof ResizeObserver !== 'undefined') new ResizeObserver(function() { update(el); }).observe(el);
      },
      resize: update,
    };
  };

  // 25 ─ One dot per country; the filled ones have a larger yearly economic output than this wealth.
  VIZ['richest-wealth-larger-than-gdp'] = function(ctx) {
    var COUNTRIES = 195;
    var LARGER = 22;
    var dots = '';
    for (var i = 0; i < COUNTRIES; i++) dots += '<i' + (i < LARGER ? ' class="on"' : '') + '></i>';
    return {
      html:
        '<div class="v-dots" aria-hidden="true">' + dots + '</div>' +
        '<div class="viz-legend num" style="margin-top:10px">' +
          '<span><i class="k-dot-on"></i>' + LARGER + ' ' + L(ctx, 'größer', 'larger') + '</span>' +
          '<span><i class="k-dot"></i>' + (COUNTRIES - LARGER) + ' ' + L(ctx, 'kleiner als Musks Vermögen', 'smaller than Musk’s wealth') + '</span>' +
        '</div>',
    };
  };

  // 26 ─ Spending a million dollars a day since the year 1.
  VIZ['jesus-christ-spending'] = function(ctx) {
    var YEARS = 2026;
    var spent = YEARS * 365.25 * 1e6;
    var left = Math.max(0, ctx.richestWealthUsd - spent);
    var pct = Math.min(100, spent / ctx.richestWealthUsd * 100);
    return {
      html:
        '<div class="v-strip"><i style="width:' + pct.toFixed(2) + '%"></i></div>' +
        '<div class="v-row-labels num">' +
          '<span>' + ctx.fmtInt(YEARS) + ' ' + L(ctx, 'Jahre × 1 Mio. $ pro Tag', 'years × $1M per day') + '<br>≈ ' + ctx.compact(Math.round(spent / 1e9) * 1e9) + ' ' + L(ctx, 'ausgegeben', 'spent') + '</span>' +
          '<span>~' + ctx.compact(Math.round(left / 1e10) * 1e10) + '<br>' + L(ctx, 'übrig', 'left') + '</span>' +
        '</div>',
    };
  };

  // 29 ─ 14 million years of work; humans have existed for 300,000 of them.
  VIZ['first-humans-comparison'] = function(ctx) {
    var HUMANS = 300000;
    var WORK = 14e6;
    return {
      html:
        '<div class="v-strip"><i style="width:' + (HUMANS / WORK * 100).toFixed(2) + '%"></i></div>' +
        '<div class="v-row-labels num">' +
          '<span>↑ ' + ctx.fmtInt(HUMANS) + ' ' + L(ctx, 'Jahre:<br>so lange gibt es Menschen', 'years:<br>how long humans have existed') + '</span>' +
          '<span>' + L(ctx, '14 Mio. Jahre<br>arbeiten', '14 million years<br>of work') + '</span>' +
        '</div>',
    };
  };

  // 30 ─ A 100-dollar bill travels Earth to Moon and back as often as the lined-up bills would reach.
  VIZ['wealth-in-bills'] = function(ctx) {
    var BILL_M = 0.156;
    var MOON_KM = 384400;
    var km = ctx.richestWealthUsd / 100 * BILL_M / 1000;
    var trips = km / (2 * MOON_KM);
    var TOTAL = 4000;
    var X0 = 46, X1 = 233, Y = 34, LEN = X1 - X0;
    return {
      html:
        '<svg width="274" height="76" viewBox="0 0 274 76" aria-hidden="true">' +
          '<defs><clipPath id="v-earth-clip"><circle cx="0" cy="0" r="17"/></clipPath></defs>' +
          '<path d="M39 34H243" stroke="#111" stroke-width="1" stroke-dasharray="2 3"/>' +
          '<path class="trail" d="M46 34H233" stroke="#111" stroke-width="3" stroke-linecap="round" stroke-dasharray="0 999"/>' +
          '<g class="bill"><rect x="-8" y="-4.5" width="16" height="9" rx="1.5" fill="#7FB069" stroke="#111" stroke-width="1"/><circle r="2" fill="none" stroke="#111" stroke-width=".8"/></g>' +
          '<circle cx="19" cy="34" r="17" fill="#2D6CC0"/>' +
          '<g clip-path="url(#v-earth-clip)" fill="#6FAE5A" transform="translate(19 34)">' +
            '<path d="M-4-15.5 1-16.5 4.5-15 4-12.5 7-11.5 6.5-9 3.5-8.5 1-9.8-1.5-8-4.5-9-6-11.5Z"/>' +
            '<path d="M-7.5-6.5-3-7.5 1-6.8 3.5-5.5 7-4.8 9.5-2 9 1.5 6.5 3.5 5.5 7 3 10.5 0.5 13.5-1.5 12.8-2.2 8.5-3.5 5-6 3.5-8.8 1.5-9.5-2.5Z"/>' +
            '<path d="M8.5 9.5 10 8.5 10.8 11 9.5 13.2 8.3 12Z"/>' +
            '<path d="M8-13.5 13-12.5 17-10.5 18-6 15.5-5.5 13.5-3 11.5-4.5 9.5-7.5 10.5-10Z"/>' +
            '<path d="M-18-8-14.5-10.5-12-7.5-13.5-4-11.5-1-13 2.5-12 6.5-14.5 11-18 9Z"/>' +
          '</g>' +
          '<circle cx="19" cy="34" r="17" fill="none" stroke="#111" stroke-width="1.5"/>' +
          '<circle cx="254" cy="34" r="10" fill="#E9E4D8"/>' +
          '<circle cx="250.5" cy="30.5" r="2.2" fill="#CFC8B8"/><circle cx="257" cy="37" r="1.6" fill="#CFC8B8"/><circle cx="256.5" cy="29" r="1.1" fill="#CFC8B8"/>' +
          '<circle cx="254" cy="34" r="10" fill="none" stroke="#111" stroke-width="1.5"/>' +
          '<text x="19" y="70" text-anchor="middle" font-size="11" font-weight="700" fill="#111">' + L(ctx, 'Erde', 'Earth') + '</text>' +
          '<text x="254" y="70" text-anchor="middle" font-size="11" font-weight="700" fill="#111">' + L(ctx, 'Mond', 'Moon') + '</text>' +
        '</svg>' +
        '<div class="v-counters num"><div><b class="km"></b>' + L(ctx, 'Strecke', 'distance') + '</div>' +
          '<div><b class="trips"></b>' + L(ctx, 'hin und zurück', 'there and back') + '</div></div>' +
        replay(ctx),
      mount: function(el) {
        var bill = el.querySelector('.bill');
        var trail = el.querySelector('.trail');
        var kmEl = el.querySelector('.km');
        var tripsEl = el.querySelector('.trips');
        U.playOnce(el, TOTAL, function(t) {
          var p = Math.min(t / TOTAL, 1);
          var n = trips * p;
          var phase = p === 1 ? trips % 1 : n % 1;
          var x = phase < 0.5 ? X0 + LEN * (phase * 2) : X1 - LEN * ((phase - 0.5) * 2);
          bill.setAttribute('transform', 'translate(' + x.toFixed(2) + ' ' + Y + ')');
          var on = phase < 0.5 ? x - X0 : X1 - x;
          var off = phase < 0.5 ? 0 : x - X0;
          trail.setAttribute('stroke-dasharray', phase < 0.5 ? (on + ' 999') : ('0 ' + off + ' ' + on + ' 999'));
          kmEl.textContent = ctx.fmtInt(Math.round(km * p / 1000) * 1000) + ' km';
          tripsEl.textContent = decimals(ctx, n, 1) + '×';
        });
      },
    };
  };

  // 35 ─ Twitter inside Musk's wealth, true to area.
  VIZ['twitter-acquisition'] = function(ctx) {
    var TWITTER_USD = 44e9;
    var OUTER = 140;
    var inner = OUTER * Math.sqrt(TWITTER_USD / ctx.richestWealthUsd);
    return {
      html:
        '<div class="v-nest" style="width:' + OUTER + 'px;height:' + OUTER + 'px"><i style="width:' + inner.toFixed(1) + 'px;height:' + inner.toFixed(1) + 'px"></i></div>' +
        '<div class="viz-legend num">' +
          '<span><i class="k-solid"></i>Twitter (' + ctx.compact(TWITTER_USD) + ')</span>' +
          '<span><i class="k-outline"></i>' + L(ctx, 'Musks Vermögen', 'Musk’s wealth') + '</span>' +
        '</div>',
    };
  };
})();

// ════════════════════════════════════════════════════════════════════
// All-billionaires bar (blue): the group, health and basic needs
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';
  var VIZ = window.WEALTH_VIZ;
  var U = VIZ._util;
  var L = U.L;
  var seg = U.seg;
  var svgEl = U.svgEl;

  var INK = '#111';

  // ─── Shared drawings ──────────────────────────────────────────────
  // Four small signs for "everything so far": food, water, electricity, health.
  function needsIcons(x, y) {
    var s = ' fill="none" stroke="#111" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"';
    return '<g transform="translate(' + x + ' ' + y + ')">' +
      '<path d="M0 9h18a9 8 0 0 1-18 0z"' + s + '/>' +
      '<path transform="translate(24 0)" d="M8 0c4.5 6 7 9.5 7 13a7 7 0 0 1-14 0c0-3.5 2.5-7 7-13z"' + s + '/>' +
      '<path transform="translate(45 0)" d="M5 14a7 7 0 1 1 6 0v3h-6zM5 19.6h6"' + s + '/>' +
      '<g transform="translate(65 0)">' +
        '<rect x="0" y="5" width="18" height="14" rx="2.5" fill="#2E7D32" stroke="#111" stroke-width="1.6"/>' +
        '<path d="M6 5V3a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 12 3v2"' + s + '/>' +
        '<path d="M7.4 7.5h3.2v2.9h2.9v3.2h-2.9v2.9H7.4v-2.9H4.5v-3.2h2.9z" fill="#fff"/>' +
      '</g></g>';
  }
  U.needsIcons = needsIcons;

  // A stack of coins seen from the side; (x, y) is the middle of the surface it stands on.
  function coinStack(x, y, count, width, height) {
    var out = '';
    var top = y - (height - 0.4);
    for (var i = 0; i < count; i++) {
      out += '<rect x="' + (x - width / 2).toFixed(2) + '" y="' + (top - i * height).toFixed(2) + '" width="' + width + '" height="' + height + '" fill="#E0B53C" stroke="#111" stroke-width=".8"/>';
    }
    out += '<ellipse cx="' + x + '" cy="' + (top - (count - 1) * height).toFixed(2) + '" rx="' + (width / 2) + '" ry="' + (width * 0.133).toFixed(2) + '" fill="#F2C94C" stroke="#111" stroke-width=".8"/>';
    return out;
  }

  // ─── 39: a drop on a hot stone (German) / a drop in the bucket (English) ───
  var DROP_PATH = 'M0-2.4L.909-.4167A1 1 0 1 1-.909-.4167Z';
  var DROP_UNIT_AREA = 4.1826; // area of DROP_PATH at scale 1
  var STONE_OUTLINE = 'M38 136L34 118L44 98L62 80L88 64L118 56L146 58L172 68L194 86L208 106L214 124L212 136Z';
  var BUCKET_OUTLINE = 'M61 64A64 10 0 0 1 189 64L175 148A50 7 0 0 1 75 148Z';

  // Area enclosed by a closed path, measured along its outline.
  function enclosedArea(path, fallback) {
    try {
      var len = path.getTotalLength();
      var N = 800, pts = [], sum = 0, i;
      for (i = 0; i < N; i++) pts.push(path.getPointAtLength(len * i / N));
      for (i = 0; i < N; i++) {
        var a = pts[i], b = pts[(i + 1) % N];
        sum += a.x * b.y - b.x * a.y;
      }
      var area = Math.abs(sum) / 2;
      return area > 0 ? area : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function stoneSvg() {
    var wave = 'M0 0c-3-4 3-7 0-11s3-7 0-11';
    function heat(x, y, delay) {
      return '<g transform="translate(' + x + ' ' + y + ')"><path class="v-wave" style="animation-delay:' + delay + 's" d="' + wave + '"/></g>';
    }
    return '<svg class="v-to-scale" width="250" height="150" viewBox="0 0 250 150" aria-hidden="true">' +
      '<defs>' +
        '<radialGradient id="v-stone-glow"><stop offset="0" stop-color="#FF6A1A"/><stop offset=".55" stop-color="#FF6A1A" stop-opacity=".7"/><stop offset="1" stop-color="#FF6A1A" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="v-stone-heat" gradientUnits="userSpaceOnUse" x1="0" y1="108" x2="0" y2="137"><stop offset="0" stop-color="#FF4A12" stop-opacity="0"/><stop offset=".55" stop-color="#FF4A12" stop-opacity=".35"/><stop offset="1" stop-color="#FF5A14" stop-opacity=".9"/></linearGradient>' +
      '</defs>' +
      '<ellipse class="v-ember" cx="125" cy="137" rx="122" ry="17" fill="url(#v-stone-glow)"/>' +
      heat(56, 86, -0.2) + heat(82, 66, -1.4) + heat(154, 60, -2.1) + heat(180, 74, -0.6) + heat(203, 96, -1.8) +
      '<path class="area" d="' + STONE_OUTLINE + '" fill="#6A635E"/>' +
      '<path d="M44 98L62 80L88 64L118 56L112 78L84 92L60 102Z" fill="#A39C96"/>' +
      '<path d="M118 56L146 58L172 68L194 86L166 92L136 84L112 78Z" fill="#878079"/>' +
      '<path d="M194 86L208 106L214 124L212 136L180 136L176 112L166 92Z" fill="#433D3A"/>' +
      '<path d="M38 136L34 118L44 98L60 102L58 122L62 136Z" fill="#524C49"/>' +
      '<path d="M60 102L84 92L112 78L136 84L166 92M112 78L118 56M166 92L176 112L180 136M60 102L58 122L62 136" fill="none" stroke="#111" stroke-opacity=".3" stroke-width="1" stroke-linejoin="round"/>' +
      '<g fill="#C4BDB7" opacity=".75"><circle cx="74" cy="84" r="1.2"/><circle cx="98" cy="72" r=".9"/><circle cx="150" cy="70" r="1.2"/><circle cx="132" cy="66" r=".8"/></g>' +
      '<g fill="#2E2926" opacity=".7"><circle cx="92" cy="108" r="1.3"/><circle cx="150" cy="104" r="1"/><circle cx="196" cy="114" r="1.2"/><circle cx="48" cy="120" r="1"/><circle cx="118" cy="98" r=".9"/></g>' +
      '<path d="' + STONE_OUTLINE + '" fill="url(#v-stone-heat)"/>' +
      '<path d="' + STONE_OUTLINE + '" fill="none" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<g class="v-ember"><ellipse cx="22" cy="134" rx="6" ry="3.2" fill="#2A2421"/><ellipse cx="22" cy="133.5" rx="3" ry="1.3" fill="#FF7A22"/>' +
        '<ellipse cx="229" cy="134" rx="6.5" ry="3.2" fill="#2A2421"/><ellipse cx="229" cy="133.5" rx="3.2" ry="1.3" fill="#FF7A22"/>' +
        '<ellipse cx="8" cy="135" rx="4" ry="2.2" fill="#2A2421"/><ellipse cx="243" cy="135" rx="4" ry="2.2" fill="#2A2421"/></g>' +
      '<path d="M2 136.5H248" stroke="#111" stroke-width="1.5"/>' +
      '<path class="drop" d="' + DROP_PATH + '" fill="#F2A63B" style="fill:var(--orange)" stroke="#111" stroke-width="1.5" vector-effect="non-scaling-stroke"/>' +
    '</svg>';
  }

  function bucketSvg() {
    return '<svg class="v-to-scale" width="250" height="158" viewBox="0 0 250 158" aria-hidden="true">' +
      '<defs><linearGradient id="v-bucket-metal" gradientUnits="userSpaceOnUse" x1="61" y1="0" x2="189" y2="0"><stop offset="0" stop-color="#6C7780"/><stop offset=".28" stop-color="#C8D0D7"/><stop offset=".5" stop-color="#97A2AB"/><stop offset="1" stop-color="#56606A"/></linearGradient></defs>' +
      '<path class="area" d="' + BUCKET_OUTLINE + '" fill="url(#v-bucket-metal)"/>' +
      '<ellipse cx="125" cy="64" rx="61" ry="8.3" fill="#2C3338"/>' +
      '<path d="M66 65.5A59 6.5 0 0 0 184 65.5" fill="none" stroke="#56606A" stroke-width="2"/>' +
      '<path d="M65.7 92A59.3 8.6 0 0 0 184.3 92M71 124A54 7.6 0 0 0 179 124" fill="none" stroke="#111" stroke-opacity=".38" stroke-width="1.3"/>' +
      '<path d="M65.9 94A59.1 8.6 0 0 0 184.1 94M71.2 126A53.8 7.6 0 0 0 178.8 126" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1"/>' +
      '<path d="M61 64L75 148A50 7 0 0 0 175 148L189 64" fill="none" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<ellipse cx="125" cy="64" rx="64" ry="10" fill="none" stroke="#111" stroke-width="2"/>' +
      '<path d="M64 63A61 8 0 0 1 186 63" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1"/>' +
      '<path d="M64 72C72 116 178 116 186 72" fill="none" stroke="#111" stroke-width="2.2" stroke-linecap="round"/>' +
      '<circle cx="64" cy="71" r="3" fill="#111"/><circle cx="186" cy="71" r="3" fill="#111"/>' +
      '<path class="drop" d="' + DROP_PATH + '" fill="#F2A63B" style="fill:var(--orange)" stroke="#111" stroke-width="1.5" vector-effect="non-scaling-stroke"/>' +
    '</svg>';
  }

  VIZ['all-billionaires-intro'] = function(ctx) {
    var share = ctx.richestWealthUsd / ctx.allBillionairesUsd;
    if (!(share > 0 && share < 1)) return null;
    // The German sentence speaks of a hot stone, the English one of a bucket.
    var stone = ctx.lang === 'de';
    var dropKey = '<svg width="9" height="12" viewBox="-1.2 -2.6 2.4 3.8" aria-hidden="true"><path d="' + DROP_PATH + '" fill="#F2A63B" style="fill:var(--orange)" stroke="#111" stroke-width=".25"/></svg>';
    var groupKey = stone
      ? '<svg width="14" height="9" viewBox="0 0 14 9" aria-hidden="true"><path d="M1.5 8.5L1 6 2.5 3.5 5 1.5 8 1 11 2.5 13 5 13 8.5Z" fill="#6A635E" stroke="#111" stroke-width=".8"/></svg>'
      : '<svg width="12" height="11" viewBox="0 0 12 11" aria-hidden="true"><path d="M.5 1.5H11.5L10 10.5H2Z" fill="#97A2AB" stroke="#111" stroke-width=".8"/></svg>';
    return {
      html: (stone ? stoneSvg() : bucketSvg()) +
        '<div class="viz-legend"><span>' + dropKey + ctx.richestName + '</span><span>' + groupKey + L(ctx, 'alle Milliardäre', 'all billionaires') + '</span></div>',
      mount: function(el) {
        var svg = el.querySelector('svg.v-to-scale');
        var drop = svg.querySelector('.drop');
        // The drop covers the same share of the stone (or bucket) as this wealth of the total.
        var area = enclosedArea(svg.querySelector('.area'), stone ? 10676 : 9795);
        var r = Math.sqrt(area * share / DROP_UNIT_AREA);
        var x = stone ? 118 : 125;
        var y = stone ? 56.5 : 46;
        drop.setAttribute('transform', 'translate(' + x + ' ' + (y - r).toFixed(2) + ') scale(' + r.toFixed(3) + ')');
        function stroke(d, opacity) {
          svgEl('path', { d: d, fill: 'none', stroke: INK, 'stroke-width': 1.4, 'stroke-linecap': 'round', 'stroke-opacity': opacity }, svg);
        }
        if (stone) {
          // Steam curls left and right of the drop.
          var lx = x - r * 1.5, rx = x + r * 1.5, by = y - 2;
          stroke('M' + lx + ' ' + by + 'c-4-2-4-6 0-8', 0.55);
          stroke('M' + rx + ' ' + by + 'c4-2 4-6 0-8', 0.55);
          stroke('M' + (lx - 5) + ' ' + (by - 10) + 'c-3-2-3-5 0-7', 0.35);
          stroke('M' + (rx + 5) + ' ' + (by - 10) + 'c3-2 3-5 0-7', 0.35);
        } else {
          // Short lines above the drop: it is falling.
          var top = y - 3.4 * r;
          stroke('M' + (x - r * 0.55) + ' ' + (top - 2) + 'v-7', 0.5);
          stroke('M' + (x + r * 0.55) + ' ' + (top + 2) + 'v-9', 0.5);
        }
      },
    };
  };

  // ─── 42: a hall with exactly one seat per billionaire ─────────────
  VIZ['billionaires-concert-hall'] = function(ctx) {
    var SEATS = Math.round(ctx.billionaireCount || 0);
    if (SEATS < 200) return null;
    var PITCH = 1, FIRST_RADIUS = 19;
    var FROM = Math.PI * 1.04, TO = Math.PI * 1.96;
    var AISLES = [Math.PI * 1.37, Math.PI * 1.63];
    var AISLE_GAP = 1.6, CROSS_AISLE_AFTER = 24, CROSS_AISLE_GAP = 1.4;
    var bounds = [FROM].concat(AISLES).concat([TO]);

    // One row: three blocks of seats between the aisles, evenly spaced along the arc.
    function rowBlocks(r) {
      var blocks = [];
      for (var s = 0; s < bounds.length - 1; s++) {
        var a0 = bounds[s] + (s > 0 ? AISLE_GAP / 2 / r : 0);
        var a1 = bounds[s + 1] - (s < bounds.length - 2 ? AISLE_GAP / 2 / r : 0);
        var n = Math.floor((a1 - a0) * r / PITCH) + 1;
        var used = (n - 1) * PITCH / r;
        blocks.push({ start: a0 + ((a1 - a0) - used) / 2, n: n, r: r });
      }
      return blocks;
    }
    function point(a, r) {
      return { x: Math.cos(a) * r, y: Math.sin(a) * r };
    }

    var placed = 0, row = 0, parts = '', singles = '';
    var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    function grow(p) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
    while (placed < SEATS) {
      var r = FIRST_RADIUS + row * PITCH + (row >= CROSS_AISLE_AFTER ? CROSS_AISLE_GAP : 0);
      var blocks = rowBlocks(r);
      var inRow = blocks.reduce(function(sum, b) { return sum + b.n; }, 0);
      var need = SEATS - placed;
      if (inRow <= need) {
        // Full row: each block is one arc whose dash pattern draws a round dot per seat.
        blocks.forEach(function(b) {
          var p0 = point(b.start, b.r);
          var p1 = point(b.start + ((b.n - 1) * PITCH + 0.02) / b.r, b.r);
          grow(p0); grow(p1); grow(point(Math.PI * 1.5, b.r));
          parts += 'M' + p0.x.toFixed(2) + ' ' + p0.y.toFixed(2) + 'A' + b.r + ' ' + b.r + ' 0 0 1 ' + p1.x.toFixed(2) + ' ' + p1.y.toFixed(2);
        });
        placed += inRow;
      } else {
        // Last row: the remaining seats are spread evenly over the whole arc.
        var all = [];
        blocks.forEach(function(b) {
          for (var i = 0; i < b.n; i++) all.push(point(b.start + i * PITCH / b.r, b.r));
        });
        for (var k = 0; k < need; k++) {
          var seat = all[need === 1 ? Math.floor(all.length / 2) : Math.round(k * (all.length - 1) / (need - 1))];
          grow(seat);
          singles += '<circle cx="' + seat.x.toFixed(2) + '" cy="' + seat.y.toFixed(2) + '" r=".36"/>';
        }
        placed += need;
      }
      row++;
    }

    var PAD = 0.8, STAGE_H = 3.6, STAGE_Y = -6.5; // the stage sits in the opening of the arcs
    var box = [minX - PAD, minY - PAD, (maxX - minX) + 2 * PAD, Math.max(maxY, STAGE_Y + STAGE_H) - minY + 2 * PAD];
    var WIDTH = 274;
    var height = Math.round(WIDTH * box[3] / box[2]);
    var stageHalf = FIRST_RADIUS * 0.62;
    var seatsText = ctx.fmtInt(SEATS);
    var label = L(ctx, 'Saalplan mit ' + seatsText + ' Plätzen', 'Seating plan with ' + seatsText + ' seats');
    return {
      html:
        '<svg class="v-hall" width="' + WIDTH + '" height="' + height + '" viewBox="' + box.map(function(v) { return v.toFixed(2); }).join(' ') + '" role="img" aria-label="' + label + '" data-seats="' + placed + '">' +
          // Each full row is drawn as a dotted arc: dash length 0 with round caps gives one dot per seat.
          '<path d="' + parts + '" fill="none" stroke="#111" stroke-opacity=".82" stroke-width=".72" stroke-linecap="round" stroke-dasharray="0 ' + PITCH + '"/>' +
          '<g fill="#111" fill-opacity=".82">' + singles + '</g>' +
          '<rect x="' + (-stageHalf).toFixed(2) + '" y="' + STAGE_Y + '" width="' + (stageHalf * 2).toFixed(2) + '" height="' + STAGE_H + '" fill="#111"/>' +
          '<text x="0" y="' + (STAGE_Y + STAGE_H / 2) + '" dy=".36em" text-anchor="middle" font-size="2.1" font-weight="700" letter-spacing=".3" fill="#fff">' + L(ctx, 'BÜHNE', 'STAGE') + '</text>' +
        '</svg>' +
        '<p class="viz-cap num"><b>' + seatsText + ' ' + L(ctx, 'Plätze', 'seats') + '</b>' + L(ctx, ', einer pro Milliardär', ', one per billionaire') + '</p>',
    };
  };

  // ─── 59, 62: every dollar comes back many times over (a pair of scales) ───
  // o: pivotX, leftX, rightX, rightHalf, stacks (x positions on the right pan),
  //    perStack, coinW, coinH, height, leftLabel, rightLabel (svg text markup)
  function scalesSvg(o) {
    var SLOPE = 0.2125, PIVOT_Y = 40, DROP = 41;
    var leftY = PIVOT_Y - (o.pivotX - o.leftX) * SLOPE;
    var rightY = PIVOT_Y + (o.rightX - o.pivotX) * SLOPE;
    var leftPan = leftY + DROP, rightPan = rightY + DROP;
    var LEFT_HALF = 28;
    function pan(cx, y, half) {
      return '<path d="M' + (cx - half) + ' ' + y + 'H' + (cx + half) + 'Q' + (cx + half - 4) + ' ' + (y + 10) + ' ' + cx + ' ' + (y + 10) + 'T' + (cx - half) + ' ' + y + 'Z" fill="#fff" stroke="#111" stroke-width="1.5"/>';
    }
    function f(n) { return n.toFixed(1); }
    var coins = '';
    o.stacks.forEach(function(x) { coins += coinStack(x, rightPan, o.perStack, o.coinW, o.coinH); });
    return '<svg width="260" height="' + o.height + '" viewBox="0 0 260 ' + o.height + '" aria-hidden="true">' +
      '<path d="M' + (o.pivotX - 26) + ' 150h52l-8-10h-36z" fill="#111"/>' +
      '<path d="M' + o.pivotX + ' 140V' + PIVOT_Y + '" stroke="#111" stroke-width="3"/>' +
      '<path d="M' + o.leftX + ' ' + f(leftY) + 'L' + o.rightX + ' ' + f(rightY) + '" stroke="#111" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="' + o.pivotX + '" cy="' + PIVOT_Y + '" r="4" fill="#111"/>' +
      '<path d="M' + o.leftX + ' ' + f(leftY) + 'L' + (o.leftX - LEFT_HALF + 4) + ' ' + f(leftPan) +
        'M' + o.leftX + ' ' + f(leftY) + 'L' + (o.leftX + LEFT_HALF - 4) + ' ' + f(leftPan) +
        'M' + o.rightX + ' ' + f(rightY) + 'L' + (o.rightX - o.rightHalf + 4) + ' ' + f(rightPan) +
        'M' + o.rightX + ' ' + f(rightY) + 'L' + (o.rightX + o.rightHalf - 4) + ' ' + f(rightPan) + '" stroke="#111" stroke-width="1"/>' +
      pan(o.leftX, Number(f(leftPan)), LEFT_HALF) + pan(o.rightX, Number(f(rightPan)), o.rightHalf) +
      coinStack(o.leftX, leftPan, 1, o.coinW, o.coinH) + coins +
      '<g fill="#111" font-size="12.5" font-weight="600" text-anchor="middle">' +
        '<text x="' + o.leftX + '" y="' + f(leftPan + 30) + '">' + o.leftLabel + '</text>' +
        o.rightLabel(o.rightX, rightPan + 30) +
      '</g>' +
    '</svg>';
  }

  function investedLabel(ctx) {
    return '<tspan font-weight="800" font-size="16">' + ctx.money.format(1) + '</tspan> ' + L(ctx, 'investiert', 'invested');
  }

  // 62 ─ Eye care: $28 come back for every dollar. One coin on the left, 28 on the right.
  VIZ['end-blindness-2'] = function(ctx) {
    var RETURN = 28;
    return {
      html: scalesSvg({
        pivotX: 130, leftX: 42, rightX: 218, rightHalf: 32,
        stacks: [198.5, 211.5, 224.5, 237.5], perStack: RETURN / 4, coinW: 12, coinH: 3.4, height: 160,
        leftLabel: investedLabel(ctx),
        rightLabel: function(x, y) {
          return '<text x="' + x + '" y="' + y.toFixed(1) + '"><tspan font-weight="800" font-size="16">' + ctx.money.format(RETURN) + '</tspan> ' + L(ctx, 'zurück', 'back') + '</text>';
        },
      }),
    };
  };

  // 59 ─ Lead: hundreds to thousands of dollars come back. The picture can only hold a hundred coins.
  VIZ['lead-poisoning-investment-return'] = function(ctx) {
    var STACKS = 10, PER_STACK = 10, COIN_W = 8, STEP = 8.8, RIGHT_X = 206;
    var stacks = [];
    for (var i = 0; i < STACKS; i++) stacks.push(Number((RIGHT_X + (i - (STACKS - 1) / 2) * STEP).toFixed(1)));
    return {
      html: scalesSvg({
        pivotX: 120, leftX: 34, rightX: RIGHT_X, rightHalf: 50,
        stacks: stacks, perStack: PER_STACK, coinW: COIN_W, coinH: 2.6, height: 174,
        leftLabel: investedLabel(ctx),
        rightLabel: function(x, y) {
          return '<text x="' + x + '" y="' + y.toFixed(1) + '" font-weight="800" font-size="14.5">' + L(ctx, 'Hunderte $', 'hundreds to') + '</text>' +
            '<text x="' + x + '" y="' + (y + 16).toFixed(1) + '" font-weight="800" font-size="14.5">' + L(ctx, 'bis Tausende $', 'thousands of $') + '</text>' +
            '<text x="' + x + '" y="' + (y + 31).toFixed(1) + '">' + L(ctx, 'zurück', 'back') + '</text>';
        },
      }) +
      '<p class="viz-cap">' + L(ctx,
        'Im Bild: nur ' + (STACKS * PER_STACK) + ' Münzen.<br>Für alle wäre kein Platz.',
        'Shown: only ' + (STACKS * PER_STACK) + ' coins.<br>There is no room for all of them.') + '</p>',
    };
  };

  // ─── 60: the single pixel under the magnifying glass, as on the title screen ───
  VIZ['remember-scale'] = function(ctx) {
    return {
      html:
        '<svg width="210" height="92" viewBox="0 0 210 92" aria-hidden="true">' +
          '<rect x="40" y="88" width="1" height="1" fill="#111"/>' +
          '<path d="M89.3 59.4L52.6 81.3" stroke="#111" stroke-width="1.6"/>' +
          '<path d="M45.7 85.4L54.4 84.3 50.8 78.3Z" fill="#111"/>' +
          '<circle cx="122" cy="40" r="36" fill="#fff" stroke="#111" stroke-width="2"/>' +
          '<path d="M147.5 65.5L162 80" stroke="#111" stroke-width="6" stroke-linecap="round"/>' +
          '<rect x="110" y="18" width="24" height="24" fill="#111"/>' +
          '<text x="122" y="62" text-anchor="middle" font-size="13" font-weight="800" fill="#111">' + ctx.money.format(ctx.dollarsPerPixel) + '</text>' +
        '</svg>',
    };
  };

  // ─── 67: one life every 22 seconds, running live while the message is on screen ───
  VIZ['water-and-sanitation-deaths'] = function(ctx) {
    var PERIOD_MS = 22000;
    var RADIUS = 27;
    var CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    function livesText(n) {
      return ctx.fmtInt(n) + ' ' + (ctx.lang === 'de' ? 'Leben' : (n === 1 ? 'life' : 'lives'));
    }
    return {
      className: 'v-ring num',
      html:
        '<svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">' +
          '<circle cx="32" cy="32" r="' + RADIUS + '" fill="none" stroke="#111" stroke-opacity=".18" stroke-width="6"/>' +
          '<circle class="arc" cx="32" cy="32" r="' + RADIUS + '" fill="none" stroke="#111" stroke-width="6" stroke-dasharray="0 ' + CIRCUMFERENCE.toFixed(1) + '" transform="rotate(-90 32 32)"/>' +
          '<text class="sec" x="32" y="37" text-anchor="middle" font-size="15" font-weight="800" fill="#111">22</text>' +
        '</svg>' +
        '<div class="lab"><b class="saved">' + livesText(0) + '</b>' +
          L(ctx, 'hätten seit dieser Nachricht<br>gerettet werden können', 'could have been saved<br>since you got here') + '</div>',
      mount: function(el) {
        var arc = el.querySelector('.arc');
        var sec = el.querySelector('.sec');
        var saved = el.querySelector('.saved');
        var startedAt = null;
        var visible = false;
        var raf = 0;
        var lastSecond = -1, lastLives = -1;

        function frame(now) {
          var t = now - startedAt;
          var lives = Math.floor(t / PERIOD_MS);
          var p = (t % PERIOD_MS) / PERIOD_MS;
          if (!U.prefersReducedMotion()) arc.setAttribute('stroke-dasharray', (CIRCUMFERENCE * p).toFixed(2) + ' ' + CIRCUMFERENCE.toFixed(2));
          var second = Math.ceil(22 - p * 22);
          if (second !== lastSecond) { lastSecond = second; sec.textContent = String(second); }
          if (lives !== lastLives) { lastLives = lives; saved.textContent = livesText(lives); }
          if (visible) raf = requestAnimationFrame(frame);
        }

        if (typeof IntersectionObserver === 'undefined') return;
        // The clock starts when the message is first seen and only draws while it is on screen.
        new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            visible = entry.isIntersecting;
            cancelAnimationFrame(raf);
            if (!visible) return;
            if (startedAt === null) startedAt = performance.now();
            raf = requestAnimationFrame(frame);
          });
        }, { threshold: 0.6 }).observe(el);
      },
    };
  };

  // ─── 69: seven coins go into gambling; one of them would end hunger ───
  VIZ['end-hunger-2'] = function(ctx) {
    var HUNGER_USD = 93e9;
    var TIMES = 7;
    var TRAIL = 'M244 44C244 98 160 114 58 114';
    var perYear = L(ctx, ' pro Jahr', ' per year');
    return {
      html:
        '<svg width="274" height="150" viewBox="0 0 274 150" aria-hidden="true">' +
          '<defs><mask id="v-coin-trail" maskUnits="userSpaceOnUse" x="0" y="0" width="274" height="150"><path class="reveal" d="' + TRAIL + '" fill="none" stroke="#fff" stroke-width="8"/></mask></defs>' +
          // slot machine
          '<g transform="translate(1 26)"><rect x="2" y="4" width="26" height="30" rx="4" fill="#C62828" stroke="#111" stroke-width="1.3"/><rect x="6" y="9" width="18" height="10" rx="1.5" fill="#fff" stroke="#111"/><text x="15" y="17.2" text-anchor="middle" font-size="8.5" font-weight="800" fill="#C62828">777</text><rect x="10" y="23" width="10" height="2.4" rx="1.2" fill="#111"/><path d="M28 18h3l3-10" stroke="#111" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="34" cy="7" r="2.4" fill="#111"/></g>' +
          '<text x="44" y="16" font-size="13" font-weight="800" fill="#111">' + L(ctx, 'Glücksspiel', 'Gambling') + ' <tspan font-weight="600">~' + ctx.compact(Math.round(HUNGER_USD * TIMES / 1e10) * 1e10) + perYear + '</tspan></text>' +
          '<circle class="ghost" cx="244" cy="44" r="12.3" fill="none" stroke="#111" stroke-width="1.4" stroke-dasharray="3 3" opacity="0"/>' +
          '<path class="trail" d="' + TRAIL + '" fill="none" stroke="#111" stroke-width="1.4" stroke-dasharray="3 4" mask="url(#v-coin-trail)"/>' +
          '<g class="coins"></g>' +
          // bowl of food
          '<g transform="translate(3 98)"><path d="M0 14H30A15 12 0 0 1 0 14Z" fill="#fff" stroke="#111" stroke-width="1.3"/><path d="M3 14c2-4 5-4 7 0 2-4 5-4 7 0 2-4 5-4 7 0 2-3 4-3 5 0" fill="#F4ECD8" stroke="#111" stroke-width=".8"/><path d="M10 9c-2-3 2-4 0-7M17 8c-2-3 2-4 0-7" fill="none" stroke="#111" stroke-opacity=".5" stroke-width="1" stroke-linecap="round"/></g>' +
          '<text x="44" y="144" font-size="13" font-weight="800" fill="#111">' + L(ctx, 'Hunger beenden', 'End hunger') + ' <tspan font-weight="600">' + ctx.compact(HUNGER_USD) + perYear + '</tspan></text>' +
        '</svg>' +
        U.replay(ctx),
      mount: function(el) {
        var group = el.querySelector('.coins');
        var ghost = el.querySelector('.ghost');
        var reveal = el.querySelector('.reveal');
        var trail = el.querySelector('.trail');
        var length = trail.getTotalLength();
        var coins = [];
        reveal.setAttribute('stroke-dasharray', length + ' ' + length);
        for (var i = 0; i < TIMES; i++) {
          var coin = svgEl('g', {}, group);
          svgEl('circle', { r: 13, fill: '#F2C94C', stroke: INK, 'stroke-width': 1.4 }, coin);
          svgEl('circle', { r: 8.6, fill: 'none', stroke: INK, 'stroke-opacity': 0.35, 'stroke-width': 1.2 }, coin);
          svgEl('text', { y: 4.6, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 800, fill: INK, 'fill-opacity': 0.6 }, coin).textContent = '$';
          coins.push(coin);
        }
        U.playOnce(el, 4600, function(t) {
          // The coins appear one after the other; then the seventh travels down to the bowl.
          var travel = seg(t, 2700, 4200);
          coins.forEach(function(coin, i) {
            var x = 58 + i * 31;
            var appear = seg(t, i * 260, i * 260 + 320);
            var y = 44 - 16 * (1 - appear);
            if (i === TIMES - 1 && travel > 0) {
              var p = trail.getPointAtLength(length * travel);
              x = p.x; y = p.y;
            }
            coin.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
            coin.setAttribute('opacity', appear.toFixed(2));
          });
          // Its place stays behind as a dashed circle, and a dashed line shows the way.
          ghost.setAttribute('opacity', seg(t, 2700, 3100).toFixed(2));
          reveal.setAttribute('stroke-dashoffset', (length * (1 - travel)).toFixed(1));
        });
      },
    };
  };

  // ─── 78: spend two trillion and still end the year two trillion richer ───
  // Stacks true to scale: one bundle is one trillion dollars.
  VIZ['health-and-basic-needs-combined-4'] = function(ctx) {
    var BEFORE = 16, GROWTH = 4, SPENT = 2;
    var BASE = 206, STEP = 7.4, H = 6.4, W = 64, LEFT_X = 8, RIGHT_X = 92;
    var trillion = function(n) { return ctx.compact(n * 1e12); };
    function label(cls, bracket, x, y, big, small, bigSize) {
      return '<g class="' + cls + '" opacity="0"><path d="' + bracket + '" stroke="#111" stroke-width="1.5" fill="none"/>' +
        '<text x="' + x + '" y="' + y + '" font-size="' + bigSize + '" font-weight="800" fill="#111">' + big + '</text>' +
        '<text x="' + x + '" y="' + (y + (bigSize > 14 ? 15 : 14)) + '" font-size="' + (bigSize > 14 ? 12.5 : 11.5) + '" font-weight="600" fill="#111">' + small + '</text></g>';
    }
    return {
      html:
        // The view is shifted 13 px to the right: the stacks on the left would otherwise look heavier.
        '<svg width="274" height="244" viewBox="-13 0 274 244" aria-hidden="true">' +
          '<g class="left"></g><g class="right"></g>' +
          '<path d="M6 87.2H158" stroke="#111" stroke-width="1.3" stroke-dasharray="4 3"/>' +
          '<g class="ghosts" opacity="0"></g><g class="fly"></g>' +
          '<text x="40" y="222" text-anchor="middle" font-size="12.5" font-weight="800" fill="#111">' + L(ctx, 'vorher', 'before') + '</text>' +
          '<text x="124" y="222" text-anchor="middle" font-size="12.5" font-weight="800" fill="#111">' + L(ctx, '1 Jahr später', '1 year later') + '</text>' +
          '<text x="82" y="240" text-anchor="middle" font-size="11.5" font-weight="600" fill="#111">' + L(ctx, '1 Bündel = ', '1 bundle = ') + trillion(1) + '</text>' +
          label('t1', 'M162 58v29M158 58h8M158 87h8', 172, 72, '+ ' + trillion(GROWTH), L(ctx, 'Zuwachs', 'growth'), 15) +
          '<g class="icons" opacity="0">' + U.needsIcons(172, 14) + '</g>' +
          label('t2', 'M162 58v13M158 58h8M158 71h8', 172, 54, '− ' + trillion(SPENT), L(ctx, 'für alles bisher', 'for all of the above'), 14) +
          label('t3', 'M162 73.5v13.5M158 73.5h8M158 87h8', 172, 92, '+ ' + trillion(GROWTH - SPENT), L(ctx, 'trotzdem reicher', 'richer anyway'), 14) +
        '</svg>' +
        U.replay(ctx),
      mount: function(el) {
        var left = el.querySelector('.left');
        var right = el.querySelector('.right');
        var ghosts = el.querySelector('.ghosts');
        var fly = el.querySelector('.fly');
        var icons = el.querySelector('.icons');
        var t1 = el.querySelector('.t1'), t2 = el.querySelector('.t2'), t3 = el.querySelector('.t3');

        function bundle(parent, x, i, fill) {
          var b = svgEl('g', {}, parent);
          svgEl('rect', { x: x, y: 0, width: W, height: H, rx: 1.2, fill: fill, stroke: INK, 'stroke-width': 1 }, b);
          svgEl('rect', { x: x + W / 2 - 4, y: 0, width: 8, height: H, fill: '#F4ECD8', stroke: INK, 'stroke-width': 0.8 }, b);
          b._y = BASE - (i + 1) * STEP;
          b.setAttribute('transform', 'translate(0 ' + b._y + ')');
          return b;
        }

        var i, kept = [], added = [];
        for (i = 0; i < BEFORE; i++) bundle(left, LEFT_X, i, '#5E8A4C');
        for (i = 0; i < BEFORE; i++) kept.push(bundle(right, RIGHT_X, i, '#5E8A4C'));
        for (i = BEFORE; i < BEFORE + GROWTH - SPENT; i++) added.push(bundle(right, RIGHT_X, i, '#A5DB7F'));
        for (i = BEFORE + GROWTH - SPENT; i < BEFORE + GROWTH; i++) {
          added.push(bundle(fly, RIGHT_X, i, '#A5DB7F'));
          svgEl('rect', { x: RIGHT_X, y: BASE - (i + 1) * STEP, width: W, height: H, rx: 1.2, fill: 'none', stroke: INK, 'stroke-width': 1, 'stroke-dasharray': '3 2.5' }, ghosts);
        }

        U.playOnce(el, 6200, function(t) {
          kept.forEach(function(b, k) { b.setAttribute('opacity', seg(t, k * 45, k * 45 + 160).toFixed(2)); });
          added.forEach(function(b, k) {
            // The four new bundles drop onto the stack; the top two then leave for the causes.
            var drop = seg(t, 1300 + k * 280, 1300 + k * 280 + 420);
            var y = b._y - 26 * (1 - drop), x = 0, opacity = drop;
            if (k >= GROWTH - SPENT) {
              var order = GROWTH - 1 - k;
              var leave = seg(t, 3300 + order * 250, 4100 + order * 250);
              x = leave * 100;
              y = y + leave * (22 - b._y);
              opacity = drop * (1 - seg(t, 3900 + order * 250, 4100 + order * 250));
            }
            b.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
            b.setAttribute('opacity', opacity.toFixed(2));
          });
          t1.setAttribute('opacity', (seg(t, 2400, 2700) * (1 - seg(t, 3100, 3300))).toFixed(2));
          ghosts.setAttribute('opacity', seg(t, 3400, 3900).toFixed(2));
          icons.setAttribute('opacity', seg(t, 4000, 4400).toFixed(2));
          t2.setAttribute('opacity', seg(t, 4200, 4600).toFixed(2));
          t3.setAttribute('opacity', seg(t, 5100, 5600).toFixed(2));
        });
      },
    };
  };
})();

// ════════════════════════════════════════════════════════════════════
// All-billionaires bar (blue): people and planet
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';
  var VIZ = window.WEALTH_VIZ;
  var U = VIZ._util;
  var L = U.L;
  var seg = U.seg;
  var svgEl = U.svgEl;

  var INK = '#111';
  // Figures of people: the marked ones are red, never black; all others stay light.
  var MARKED = '#C62828';
  var UNMARKED = 'rgba(255,255,255,.55)';

  // One simple figure (head and body); (x, y) is the top middle.
  function figure(x, y, scale, fill) {
    var stroke = (1.4 / scale).toFixed(2);
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + scale + ')" fill="' + fill + '" stroke="#111" stroke-width="' + stroke + '">' +
      '<circle cx="0" cy="7" r="5.5"/><path d="M-8 42V24a8 8 0 0 1 16 0v18z" stroke-linejoin="round"/></g>';
  }
  U.figure = figure;

  // A grid of figures. o: total, cols, step, rowHeight, scale, isMarked(index)
  function people(o) {
    var out = '';
    for (var i = 0; i < o.total; i++) {
      out += figure(o.step / 2 + (i % o.cols) * o.step, Math.floor(i / o.cols) * o.rowHeight, o.scale, o.isMarked(i) ? MARKED : UNMARKED);
    }
    return out;
  }
  U.people = people;

  // ─── 84: one in ten people lives in extreme poverty ───────────────
  VIZ['end-extreme-poverty-2'] = function() {
    return {
      html: '<svg width="250" height="44" viewBox="0 0 250 44" aria-hidden="true">' +
        people({ total: 10, cols: 10, step: 25, rowHeight: 48, scale: 1, isMarked: function(i) { return i === 0; } }) + '</svg>',
    };
  };

  // ─── 87: child labour, as a school class of 25 ────────────────────
  VIZ['child-labor'] = function(ctx) {
    var ILO_URL = 'https://www.ilo.org/resource/other/2024-global-estimates-child-labour-figures';
    var CLASS_SIZE = 25, AFFECTED = [7, 18]; // almost 8 % of 25 children are 2
    var link = '<a href="' + ILO_URL + '" target="_blank" rel="noopener noreferrer">ILO</a>';
    return {
      html:
        '<svg width="130" height="196" viewBox="0 0 130 196" aria-hidden="true">' +
          people({ total: CLASS_SIZE, cols: 5, step: 26, rowHeight: 40, scale: 0.8, isMarked: function(i) { return AFFECTED.indexOf(i) >= 0; } }) +
        '</svg>' +
        '<p class="viz-cap">' + L(ctx,
          'In einer Klasse mit ' + CLASS_SIZE + ' Kindern wären es <b>' + AFFECTED.length + '</b>',
          'In a class of ' + CLASS_SIZE + ' children, it would be <b>' + AFFECTED.length + '</b>') +
          '<br><span class="src">' + L(ctx,
            'Fast 8 % aller Kinder weltweit, laut ' + link,
            'Almost 8% of all children worldwide, according to the ' + link) + '</span></p>',
    };
  };

  // ─── 95: the yearly costs next to last year's growth, one bundle per trillion ───
  VIZ['all-human-focused-causes-combined-3'] = function(ctx) {
    var COSTS = 2.93, GROWTH = 4;
    var W = 80, H = 13, STEP = 14.1, BASE = 104;
    function bundles(value, x, fill) {
      var out = '';
      for (var i = 0; i < Math.ceil(value); i++) {
        // The last bundle is narrower when the value is not a whole number of trillions.
        var w = W * Math.min(1, value - i);
        var y = BASE - (i + 1) * STEP;
        out += '<rect x="' + x + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + H + '" rx="2" fill="' + fill + '" stroke="#111" stroke-width="1.2"/>' +
          '<rect x="' + (x + w / 2 - 6).toFixed(1) + '" y="' + (y - 1).toFixed(1) + '" width="12" height="' + (H + 2) + '" fill="#F4ECD8" stroke="#111" stroke-width="1"/>';
      }
      return out;
    }
    function label(x, y, big, small, smallAbove) {
      return '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="14" font-weight="800" fill="#111">' + big + '</text>' +
        '<text x="' + x + '" y="' + (smallAbove ? y - 15 : y + 15) + '" text-anchor="middle" font-size="11.5" font-weight="600" fill="#111">' + small + '</text>';
    }
    var top = BASE - GROWTH * STEP;                 // upper edge of the growth stack
    var costsTop = BASE - Math.ceil(COSTS) * STEP - 0.6; // upper edge of the cost stack (outer edge of its outline)
    return {
      html:
        '<svg width="274" height="150" viewBox="-13 0 274 150" aria-hidden="true">' +
          bundles(COSTS, 20, '#7FB069') + bundles(GROWTH, 150, '#A5DB7F') +
          '<path d="M14 ' + top.toFixed(1) + 'H236" stroke="#111" stroke-width="1.3" stroke-dasharray="4 3"/>' +
          // The bracket runs exactly from the dashed line to the top of the cost stack.
          '<path d="M34 ' + top.toFixed(1) + 'V' + costsTop.toFixed(1) + 'M30 ' + top.toFixed(1) + 'h8M30 ' + costsTop.toFixed(1) + 'h8" stroke="#111" stroke-width="1.5" fill="none"/>' +
          label(60, 38, ctx.compact((GROWTH - COSTS) * 1e12), L(ctx, 'bleiben übrig', 'left over'), true) +
          label(60, 124, ctx.compact(COSTS * 1e12), L(ctx, 'Kosten pro Jahr', 'cost per year'), false) +
          label(190, 124, ctx.compact(GROWTH * 1e12), L(ctx, 'Zuwachs letztes Jahr', 'growth last year'), false) +
        '</svg>',
    };
  };

  // ─── 102: one person each, the same amount of CO₂: one day against one year ───
  VIZ['climate-richest-emissions'] = function(ctx) {
    var CLOUD = 'M-36 20a16 16 0 0 1 1-31a21 21 0 0 1 39-9a15 15 0 0 1 28 8a16 16 0 0 1-3 32z';
    var POOR_AREA = 0.9; // a year of the poorer half is slightly less than a day of the richest
    var DAYS = 365;
    function side(x, cls, puff) {
      return '<g transform="translate(' + x + ' 44)"><g class="' + cls + '"><path d="' + CLOUD + '" fill="#3B3B3B" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>' +
          '<text y="9" text-anchor="middle" font-size="15" font-weight="800" fill="#fff">CO₂</text></g></g>' +
        '<g class="' + puff + '" fill="#3B3B3B" stroke="#111" stroke-width="1"><circle cx="' + x + '" cy="74" r="3.6"/><circle cx="' + x + '" cy="83" r="2.4"/></g>' +
        // Both figures are neutral: neither of them is marked as affected.
        U.figure(x, 88, 1, 'rgba(255,255,255,.8)');
    }
    function lines(x, a, b) {
      return '<text x="' + x + '" y="172" text-anchor="middle" font-size="12.5" font-weight="600" fill="#111">' + a + '</text>' +
        '<text x="' + x + '" y="187" text-anchor="middle" font-size="12.5" font-weight="600" fill="#111">' + b + '</text>';
    }
    var dayLabel = function(n) { return L(ctx, 'Tag ', 'day ') + n; };
    return {
      html:
        '<svg width="262" height="202" viewBox="0 0 262 202" aria-hidden="true">' +
          side(64, 'cl-rich', 'puff-rich') +
          '<text x="64" y="154" text-anchor="middle" font-size="20" font-weight="800" fill="#111">' + L(ctx, 'in 1 Tag', 'in 1 day') + '</text>' +
          lines(64, L(ctx, '1 Person aus den', '1 person from the'), L(ctx, 'reichsten 0,1 %', 'richest 0.1%')) +
          side(198, 'cl-poor', 'puff-poor') +
          '<text class="days" x="198" y="154" text-anchor="middle" font-size="20" font-weight="800" fill="#111">' + dayLabel(1) + '</text>' +
          lines(198, L(ctx, '1 Person aus der', '1 person from the'), L(ctx, 'ärmeren Hälfte', 'poorer half')) +
        '</svg>' +
        U.replay(ctx),
      mount: function(el) {
        var rich = el.querySelector('.cl-rich');
        var poor = el.querySelector('.cl-poor');
        var days = el.querySelector('.days');
        var puffRich = el.querySelector('.puff-rich');
        var puffPoor = el.querySelector('.puff-poor');
        U.playOnce(el, 4600, function(t) {
          // Left: the cloud of one day is there at once. Right: it grows day by day for a year.
          var pop = seg(t, 0, 450);
          var p = Math.min(1, Math.max(0, (t - 800) / 3300));
          rich.setAttribute('transform', 'scale(' + (pop * (1 + 0.08 * Math.sin(pop * Math.PI))).toFixed(3) + ')');
          puffRich.setAttribute('opacity', pop.toFixed(2));
          var day = Math.max(1, Math.ceil(DAYS * p));
          var scale = Math.sqrt(POOR_AREA * day / DAYS); // area grows with the days
          poor.setAttribute('transform', 'scale(' + (t < 800 ? 0 : scale).toFixed(3) + ')');
          puffPoor.setAttribute('opacity', t < 800 ? 0 : 1);
          days.textContent = t >= 4300 ? L(ctx, 'in 1 Jahr', 'in 1 year') : dayLabel(day);
        });
      },
    };
  };

  // ─── 107: extinction rate, true to area, with species fading away ───
  VIZ['biodiversity'] = function(ctx) {
    // f = filled shape, l = lines (legs, branches)
    var SPECIES = {
      butterfly: { f: 'M0 1C-4-12-17-12-15-2C-14 4-6 5 0 1ZM0 1C4-12 17-12 15-2C14 4 6 5 0 1ZM0 1C-3 5-11 7-9 12C-7 15-2 11 0 3ZM0 1C3 5 11 7 9 12C7 15 2 11 0 3Z' },
      fish:      { f: 'M-15 0C-9-9 5-9 10 0C5 9-9 9-15 0ZM10 0L18-7V7Z' },
      bird:      { f: 'M-16-2C-10-10-3-8 0-1C3-8 10-10 16-2C10-4 4-2 0 6C-4-2-10-4-16-2Z' },
      turtle:    { f: 'M-12 3A12 9 0 0 1 12 3ZM12 1a3.6 3.6 0 1 0 7.2 0a3.6 3.6 0 1 0-7.2 0ZM-9 3h4.5v4.5h-4.5zM4.5 3h4.5v4.5h-4.5zM-12 3l-4-1 4-1z' },
      frog:      { f: 'M0-10C4-10 7-7 7-3C7 1 8 5 6 8C4 11-4 11-6 8C-8 5-7 1-7-3C-7-7-4-10 0-10ZM-7.4-9a2.7 2.7 0 1 0 5.4 0a2.7 2.7 0 1 0-5.4 0ZM2-9a2.7 2.7 0 1 0 5.4 0a2.7 2.7 0 1 0-5.4 0Z', l: 'M-6-1L-12-4L-13-8M6-1L12-4L13-8M-6 6L-13 3L-12 10L-15 12M6 6L13 3L12 10L15 12' },
      elephant:  { f: 'M-15 9V-1C-15-8-8-10-1-9C3-12 10-12 13-8C15-5 15-1 14 2C14 5 15 7 17 8L15 10C12 9 11 6 11 3L9 2V9H5V3H-6V9Z' },
      crab:      { f: 'M-10 3A10 6.5 0 1 1 10 3A10 6.5 0 1 1-10 3ZM-11-2L-15-7A4.5 4.5 0 1 1-9-10L-12-8L-8-6ZM11-2L15-7A4.5 4.5 0 1 0 9-10L12-8L8-6Z', l: 'M-9 6L-14 10M9 6L14 10M-10 3L-16 5M10 3L16 5' },
      snail:     { f: 'M-15 9C-15 6-12 5-9 5H9C11 5 12 3 12 0V-6H13.5V0L15-5L16.3-4.5L14.5 2C14 6 12 9 8 9ZM-9 5A8.5 8.5 0 1 1 6 5Z' },
      spider:    { f: 'M-3-3a3 3 0 1 0 6 0a3 3 0 1 0-6 0ZM-4.5 4a4.5 5 0 1 0 9 0a4.5 5 0 1 0-9 0Z', l: 'M-3-3L-8-11M3-3L8-11M-3-1L-10-6L-14-2M3-1L10-6L14-2M-4 2L-11 1L-15 6M4 2L11 1L15 6M-4 5L-10 8L-12 13M4 5L10 8L12 13' },
      coral:     { l: 'M0 13V2M0 5C-6 3-8-3-7-10M0 2C5 0 8-5 7-11M-5-1C-10-2-12-6-12-10M5-2C10-3 12-7 13-11M0 2V-8' },
      leaf:      { f: 'M-13 9C-13-6 2-13 14-11C13 2 4 13-13 9Z' },
      mushroom:  { f: 'M-12 0A12 10 0 0 1 12 0ZM-4 0H4V10C4 12-4 12-4 10Z' },
    };
    // name, x, y, scale. Twelve different species; frog and mushroom sit in the small square.
    var ITEMS = [['butterfly', 92, 34, 1], ['bird', 142, 30, 1], ['coral', 190, 60, 1], ['fish', 236, 56, 1], ['elephant', 92, 88, 1], ['spider', 142, 90, 1],
      ['leaf', 188, 118, 1], ['turtle', 234, 108, 1], ['crab', 152, 148, 1], ['snail', 232, 160, 1], ['frog', 80, 158, 0.82], ['mushroom', 104, 184, 0.82]];
    var ORDER = [3, 7, 0, 10, 5, 1, 8, 4, 11, 2, 9, 6];
    // Sides of the squares: 2 px for the natural rate, so 1,000 times is 63.2 px and 10,000 times is 200 px.
    return {
      html:
        '<svg width="262" height="230" viewBox="0 0 262 230" aria-hidden="true">' +
          '<rect x="60" y="1" width="200" height="200" fill="none" stroke="#111" stroke-width="1.5" stroke-dasharray="5 4"/>' +
          '<rect x="60" y="137.8" width="63.2" height="63.2" fill="#0594D4" stroke="#111" stroke-width="1.5"/>' +
          '<g class="species"></g>' +
          '<rect x="26" y="199" width="2" height="2" fill="#111"/>' +
          '<path d="M27 211v-3" stroke="#111" stroke-width="1.2"/><path d="M27 204l-3 5h6z" fill="#111"/>' +
          '<text x="130" y="192" font-size="12.5" font-weight="800" fill="#111">' + L(ctx, '1.000-mal', '1,000 times') + '</text>' +
          '<text x="252" y="20" text-anchor="end" font-size="12.5" font-weight="800" fill="#111">' + L(ctx, '10.000-mal', '10,000 times') + '</text>' +
          '<text x="27" y="225" text-anchor="middle" font-size="13" font-weight="800" fill="#111">' + L(ctx, 'natürlich', 'natural') + '</text>' +
          '<text x="160" y="225" text-anchor="middle" font-size="13" font-weight="800" fill="#111">' + L(ctx, 'heute', 'today') + '</text>' +
        '</svg>' +
        U.replay(ctx),
      mount: function(el) {
        var group = el.querySelector('.species');
        var nodes = ITEMS.map(function(item, i) {
          var shape = SPECIES[item[0]];
          var wrap = svgEl('g', { transform: 'translate(' + item[1] + ' ' + item[2] + ') scale(' + item[3] + ')' }, group);
          var solid = svgEl('g', {}, wrap);
          var ghost = svgEl('g', { opacity: 0 }, wrap);
          if (shape.f) {
            svgEl('path', { d: shape.f, fill: INK, 'fill-opacity': 0.78, stroke: INK, 'stroke-width': 1, 'stroke-linejoin': 'round' }, solid);
            svgEl('path', { d: shape.f, fill: 'none', stroke: INK, 'stroke-opacity': 0.6, 'stroke-width': 1, 'stroke-dasharray': '2 2', 'stroke-linejoin': 'round' }, ghost);
          }
          if (shape.l) {
            svgEl('path', { d: shape.l, fill: 'none', stroke: INK, 'stroke-opacity': 0.85, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, solid);
            svgEl('path', { d: shape.l, fill: 'none', stroke: INK, 'stroke-opacity': 0.6, 'stroke-width': 1, 'stroke-dasharray': '2 2', 'stroke-linecap': 'round' }, ghost);
          }
          return { solid: solid, ghost: ghost, turn: ORDER[i] };
        });
        U.playOnce(el, 6400, function(t) {
          // One after the other, each species fades into a dashed outline.
          nodes.forEach(function(n) {
            var gone = seg(t, 700 + n.turn * 420, 700 + n.turn * 420 + 600);
            n.solid.setAttribute('opacity', (1 - gone).toFixed(2));
            n.ghost.setAttribute('opacity', gone.toFixed(2));
          });
        });
      },
    };
  };

  // ─── 109: a 24-hour clock runs to 16 while the amount counts up ───
  VIZ['GPGP-cost-comparison'] = function(ctx) {
    var HOURS = 16;
    var COST_BN = (ctx.comp && ctx.comp.amountUsd ? ctx.comp.amountUsd : 7.5e9) / 1e9;
    var R = 56;
    function amount(bn) {
      var n = U.decimals(ctx, bn, 1);
      return ctx.lang === 'de' ? n + ' Mrd. $' : '$' + n + 'B';
    }
    function hours(n) {
      return n + ' ' + (ctx.lang === 'de' ? 'Stunden' : (n === 1 ? 'hour' : 'hours'));
    }
    var ticks = '';
    for (var i = 0; i < 24; i++) {
      var a = i / 24 * 2 * Math.PI - Math.PI / 2;
      var big = i % 6 === 0;
      var r0 = big ? R - 9 : R - 5;
      ticks += '<path d="M' + (Math.cos(a) * r0).toFixed(2) + ' ' + (Math.sin(a) * r0).toFixed(2) + 'L' + (Math.cos(a) * R).toFixed(2) + ' ' + (Math.sin(a) * R).toFixed(2) + '" stroke="#111" stroke-width="' + (big ? 2 : 1) + '"/>';
    }
    // Numbers and ticks are drawn twice: dark on the open face, white (clipped) on the filled sector.
    var numbers = [['0', 0, -37], ['6', 39, 4], ['12', 0, 44], ['18', -39, 4]].map(function(n) {
      return '<text x="' + n[1] + '" y="' + n[2] + '" text-anchor="middle" font-size="11" font-weight="800">' + n[0] + '</text>';
    }).join('');
    return {
      html:
        '<svg width="262" height="132" viewBox="0 0 262 132" aria-hidden="true">' +
          '<defs><clipPath id="v-clock-sector"><path class="sector-clip" d=""/></clipPath></defs>' +
          '<g transform="translate(66 66)">' +
            '<circle r="' + R + '" fill="rgba(255,255,255,.75)" stroke="#111" stroke-width="2"/>' +
            '<g fill="#111">' + ticks + numbers + '</g>' +
            '<path class="sector" d="" fill="#111"/>' +
            '<g clip-path="url(#v-clock-sector)" fill="#fff" class="v-clock-light">' + ticks.replace(/stroke="#111"/g, 'stroke="#fff"') + numbers + '</g>' +
            '<path class="hand" d="M0 0V-50" stroke="#C62828" stroke-width="2.5" stroke-linecap="round"/>' +
            '<circle r="3.5" fill="#C62828"/>' +
          '</g>' +
          '<text class="hrs" x="140" y="48" font-size="22" font-weight="800" fill="#111">' + hours(0) + '</text>' +
          '<text x="140" y="70" font-size="13" font-weight="600" fill="#111">' + L(ctx, 'Zuwachs in dieser Zeit:', 'Growth in that time:') + '</text>' +
          '<text class="amt" x="140" y="98" font-size="22" font-weight="800" fill="#111">' + amount(0) + '</text>' +
        '</svg>' +
        U.replay(ctx),
      mount: function(el) {
        var sector = el.querySelector('.sector');
        var clip = el.querySelector('.sector-clip');
        var hand = el.querySelector('.hand');
        var hrs = el.querySelector('.hrs');
        var amt = el.querySelector('.amt');
        U.playOnce(el, 3400, function(t) {
          var p = seg(t, 200, 3000);
          var h = HOURS * p;
          var deg = h / 24 * 360;
          var a = (deg - 90) * Math.PI / 180;
          var d = deg < 0.5 ? '' : 'M0 0L0 ' + (-R) + 'A' + R + ' ' + R + ' 0 ' + (deg > 180 ? 1 : 0) + ' 1 ' + (Math.cos(a) * R).toFixed(2) + ' ' + (Math.sin(a) * R).toFixed(2) + 'Z';
          sector.setAttribute('d', d);
          clip.setAttribute('d', d);
          hand.setAttribute('transform', 'rotate(' + deg.toFixed(2) + ')');
          hrs.textContent = hours(Math.round(h));
          amt.textContent = amount(COST_BN * p);
        });
      },
    };
  };

  // ─── 114: 99 of 100 people breathe air below the WHO guidelines ───
  VIZ['air-pollution'] = function(ctx) {
    var AFFECTED = 99, TOTAL = 100;
    return {
      html:
        '<svg width="250" height="118" viewBox="0 0 250 118" aria-hidden="true">' +
          people({ total: TOTAL, cols: 20, step: 12.5, rowHeight: 24, scale: 0.5, isMarked: function(i) { return i < AFFECTED; } }) +
        '</svg>' +
        '<p class="viz-cap"><b>' + L(ctx, AFFECTED + ' von ' + TOTAL, AFFECTED + ' out of ' + TOTAL) + '</b> ' + L(ctx, 'Menschen', 'people') + '</p>',
    };
  };
})();

// ════════════════════════════════════════════════════════════════════
// All-billionaires bar (blue): the ending and the five steps
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';
  var VIZ = window.WEALTH_VIZ;
  var U = VIZ._util;
  var L = U.L;
  var seg = U.seg;
  var svgEl = U.svgEl;

  var INK = '#111';
  var NEUTRAL = 'rgba(255,255,255,.8)';

  function text(x, y, size, weight, content, anchor, cls) {
    return '<text' + (cls ? ' class="' + cls + '"' : '') + ' x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') +
      '" font-size="' + size + '" font-weight="' + weight + '" fill="#111">' + content + '</text>';
  }

  // ─── 119: everything gets paid, and the number of billionaires stays the same ───
  VIZ['still-billionaires'] = function(ctx) {
    var count = Math.round(ctx.billionaireCount || 0);
    if (!count) return null;
    var summary = ctx.getComp('grand-summary');
    var costTrillion = (summary && summary.costUsd ? summary.costUsd : 12.7327e12) / 1e12;
    var billionaires = function(n) { return ctx.fmtInt(n) + ' ' + L(ctx, 'Milliardäre', 'billionaires'); };
    function cost(trillion) {
      var n = U.decimals(ctx, trillion, 2);
      return '− ' + (ctx.lang === 'de' ? n + ' Bio. $' : '$' + n + 'T');
    }
    function group(top, cls) {
      return '<g class="' + cls + '">' + U.figure(76, top + 4, 1.05, NEUTRAL) +
        text(100, top + 40, 40, 800, ctx.fmtInt(count), 'start', 'bignum') + '</g>';
    }
    var ARROW_TOP = 84;
    return {
      html:
        '<svg class="num" width="274" height="230" viewBox="0 0 274 230" aria-hidden="true">' +
          text(137, 13, 13, 600, L(ctx, 'vorher: ', 'before: ') + '<tspan font-weight="800">' + billionaires(count) + '</tspan>') +
          group(24, 'before') +
          '<path d="M137 ' + ARROW_TOP + 'V' + (ARROW_TOP + 50) + '" stroke="#111" stroke-width="1.8"/>' +
          '<path d="M137 ' + (ARROW_TOP + 58) + 'l-5.5-9.5h11z" fill="#111"/>' +
          '<g class="money"></g>' +
          text(150, ARROW_TOP + 26, 19, 800, cost(0), 'start', 'cost') +
          text(150, ARROW_TOP + 43, 12.5, 600, L(ctx, 'bezahlen ALLES', 'pay for EVERYTHING'), 'start') +
          group(ARROW_TOP + 68, 'after') +
          '<text class="after-line" x="137" y="' + (ARROW_TOP + 68 + 52 + 18) + '" text-anchor="middle" font-size="13" font-weight="600" fill="#111">' +
            L(ctx, 'nachher: ', 'after: ') + '<tspan class="after-count" font-weight="800"></tspan></text>' +
        '</svg>' +
        U.replay(ctx),
      mount: function(el) {
        var money = el.querySelector('.money');
        var costEl = el.querySelector('.cost');
        var after = el.querySelector('.after');
        var afterNumber = after.querySelector('.bignum');
        var afterLine = el.querySelector('.after-line');
        var afterCount = el.querySelector('.after-count');
        var bundles = [];
        for (var i = 0; i < 5; i++) {
          var b = svgEl('g', {}, money);
          svgEl('rect', { x: 0, y: 0, width: 34, height: 10, rx: 1.5, fill: '#7FB069', stroke: INK, 'stroke-width': 1 }, b);
          svgEl('rect', { x: 13, y: -0.8, width: 8, height: 11.6, fill: '#F4ECD8', stroke: INK, 'stroke-width': 0.8 }, b);
          bundles.push(b);
        }
        U.playOnce(el, 6000, function(t) {
          // The price counts up while bundles of money fly off to the left ...
          costEl.textContent = cost(costTrillion * seg(t, 500, 2700));
          bundles.forEach(function(b, k) {
            var q = Math.min(1, Math.max(0, (t - 500 - k * 380) / 1100));
            b.setAttribute('transform', 'translate(' + (96 - 92 * q).toFixed(1) + ' ' + (ARROW_TOP + 20 - 14 * Math.sin(q * Math.PI)).toFixed(1) + ')');
            b.setAttribute('opacity', (q <= 0 || q >= 1 ? 0 : Math.sin(q * Math.PI)).toFixed(2));
          });
          // ... then the group below counts up to the very same number.
          var f = seg(t, 3100, 5200);
          var shown = Math.min(1, f * 3).toFixed(2);
          after.setAttribute('opacity', shown);
          afterLine.setAttribute('opacity', shown);
          afterNumber.textContent = ctx.fmtInt(Math.round(count * f));
          afterCount.textContent = billionaires(Math.round(count * f));
        });
      },
    };
  };

  // ─── 122: one new dollar is cut up between the richest 1 %, the next 49 % and the poorer half ───
  VIZ['systemic-problem'] = function(ctx) {
    var X0 = 47, W = 180, BILL_Y = 178, BILL_H = 30;
    var GROUPS = [
      { people: 1, cx: 40, cents: 41, de: 'reichstes 1 %', en: 'richest 1%' },
      { people: 49, cx: 134, cents: 58, de: 'übrige 49 %', en: 'other 49%' },
      { people: 50, cx: 232, cents: 1, de: 'ärmere Hälfte', en: 'poorer half' },
    ];
    var pct = function(n) { return ctx.lang === 'de' ? n + ' %' : n + '%'; };
    var cents = function(n) { return n + ' ' + (ctx.lang === 'de' ? 'Cent' : (n === 1 ? 'cent' : 'cents')); };

    var start = X0, clips = '', figures = '', names = '', amounts = '';
    GROUPS.forEach(function(g, i) {
      g.x = start;
      g.w = W * g.cents / 100;
      start += g.w;
      clips += '<clipPath id="v-bill-part' + i + '"><rect x="' + g.x.toFixed(1) + '" y="' + (BILL_Y - 2) + '" width="' + g.w.toFixed(1) + '" height="' + (BILL_H + 4) + '"/></clipPath>';
      // All figures look the same; the groups differ only in how many people they hold.
      var cols = Math.min(10, g.people), fx = g.cx - (cols - 1) * 8.4 / 2;
      for (var k = 0; k < g.people; k++) figures += U.figure((fx + (k % cols) * 8.4).toFixed(1), 20 + Math.floor(k / cols) * 15, 0.3, 'rgba(255,255,255,.85)');
      names += '<text x="' + g.cx + '" y="11">' + L(ctx, g.de, g.en) + '</text>';
      amounts += '<text class="amount" x="' + g.cx + '" y="156" opacity="0">' + cents(g.cents) + '</text>';
    });
    var cutA = GROUPS[1].x.toFixed(1), cutB = GROUPS[2].x.toFixed(1);
    return {
      html:
        '<svg width="274" height="250" viewBox="0 0 274 250" aria-hidden="true">' +
          '<defs>' + clips +
            '<g id="v-bill-art">' +
              '<rect x="' + X0 + '" y="' + BILL_Y + '" width="' + W + '" height="' + BILL_H + '" rx="2.5" fill="#7FB069"/>' +
              '<rect x="' + (X0 + 4) + '" y="' + (BILL_Y + 4) + '" width="' + (W - 8) + '" height="' + (BILL_H - 8) + '" rx="1.5" fill="none" stroke="#111" stroke-opacity=".45" stroke-width="1"/>' +
              '<ellipse cx="137" cy="193" rx="13" ry="9" fill="#A5DB7F" stroke="#111" stroke-opacity=".55" stroke-width="1"/>' +
              '<g font-size="13" font-weight="800" fill="#111" fill-opacity=".7" text-anchor="middle"><text x="137" y="198">$</text><text x="62" y="198">1</text><text x="212" y="198">1</text></g>' +
            '</g>' +
          '</defs>' +
          '<g font-size="12" font-weight="800" fill="#111" text-anchor="middle">' + names + '</g>' +
          figures +
          // What stays behind: the outline of the original bill with its shares.
          '<g class="ghost" opacity="0">' +
            '<rect x="' + X0 + '" y="' + BILL_Y + '" width="' + W + '" height="' + BILL_H + '" rx="2.5" fill="none" stroke="#111" stroke-width="1.3" stroke-dasharray="4 3"/>' +
            '<path d="M' + cutA + ' ' + BILL_Y + 'V' + (BILL_Y + BILL_H) + 'M' + cutB + ' ' + BILL_Y + 'V' + (BILL_Y + BILL_H) + '" stroke="#111" stroke-width="1.3" stroke-dasharray="4 3"/>' +
            '<g font-size="12" font-weight="800" fill="#111" text-anchor="middle"><text x="84" y="197">' + pct(GROUPS[0].cents) + '</text><text x="173" y="197">' + pct(GROUPS[1].cents) + '</text></g>' +
            '<path d="M226 212v7" stroke="#111" stroke-width="1.2"/><text x="226" y="231" text-anchor="middle" font-size="12" font-weight="800" fill="#111">' + pct(GROUPS[2].cents) + '</text>' +
          '</g>' +
          text(137, 246, 12, 600, L(ctx, '1 neuer Dollar', '1 new dollar')) +
          '<g class="pieces"></g>' +
          '<g font-size="15" font-weight="800" fill="#111" text-anchor="middle">' + amounts + '</g>' +
        '</svg>' +
        U.replay(ctx),
      mount: function(el) {
        var pieces = el.querySelector('.pieces');
        var ghost = el.querySelector('.ghost');
        var labels = el.querySelectorAll('.amount');
        var parts = GROUPS.map(function(g, i) {
          var part = svgEl('g', {}, pieces);
          var inner = svgEl('g', { 'clip-path': 'url(#v-bill-part' + i + ')' }, part);
          svgEl('use', { href: '#v-bill-art' }, inner);
          var edge = svgEl('rect', { x: g.x.toFixed(1), y: BILL_Y, width: g.w.toFixed(1), height: BILL_H, fill: 'none', stroke: INK, 'stroke-width': 1.3, opacity: 0 }, part);
          return { el: part, edge: edge, label: labels[i], dx: g.cx - (g.x + g.w / 2), gap: i === 0 ? -3 : (i === GROUPS.length - 1 ? 3 : 0) };
        });
        var whole = svgEl('rect', { x: X0, y: BILL_Y, width: W, height: BILL_H, rx: 2.5, fill: 'none', stroke: INK, 'stroke-width': 1.3 }, pieces);
        // Only the split is animated: the bill is cut, and each piece travels up to its group.
        U.playOnce(el, 3800, function(t) {
          var cut = seg(t, 500, 1000);
          var fly = seg(t, 1300, 3000);
          parts.forEach(function(p) {
            p.el.setAttribute('transform', 'translate(' + (p.gap * cut * (1 - fly) + p.dx * fly).toFixed(1) + ' ' + (-68 * fly).toFixed(1) + ')');
            p.edge.setAttribute('opacity', seg(t, 400, 600).toFixed(2));
            p.label.setAttribute('opacity', seg(t, 2900, 3400).toFixed(2));
          });
          ghost.setAttribute('opacity', seg(t, 1500, 2500).toFixed(2));
          whole.setAttribute('opacity', (1 - seg(t, 400, 600)).toFixed(2));
        });
      },
    };
  };

  // ─── 123: interest per year, total debt and the wealth of all billionaires ───
  // Stacks true to scale: one bundle is one trillion dollars.
  VIZ['developing-countries-debt'] = function(ctx) {
    var W = 64, H = 6.4, STEP = 7.4;
    var wealth = ctx.allBillionairesUsd / 1e12;
    if (!(wealth > 0)) return null;
    var STACKS = [
      { value: 1.4, x: 14, fill: '#C62828', lines: L(ctx, ['Zinsen', 'pro Jahr'], ['interest', 'per year']) },
      { value: 11.4, x: 104, fill: '#5E8A4C', lines: L(ctx, ['Schulden der', 'Entwicklungs-', 'länder'], ['debt of', 'developing', 'countries']) },
      { value: wealth, x: 194, fill: '#A5DB7F', lines: L(ctx, ['Vermögen aller', 'Milliardäre'], ['wealth of all', 'billionaires']) },
    ];
    var tallest = Math.max.apply(null, STACKS.map(function(s) { return Math.ceil(s.value - 1e-9); }));
    var base = tallest * STEP + 11;
    var out = '';
    STACKS.forEach(function(s) {
      for (var i = 0; i < Math.ceil(s.value - 1e-9); i++) {
        var w = Math.max(6, W * Math.min(1, s.value - i));
        var y = (base - (i + 1) * STEP).toFixed(1);
        out += '<rect x="' + s.x + '" y="' + y + '" width="' + w.toFixed(1) + '" height="' + H + '" rx="1.2" fill="' + s.fill + '" stroke="#111" stroke-width="1"/>';
        if (w > 20) out += '<rect x="' + (s.x + w / 2 - 4).toFixed(1) + '" y="' + y + '" width="8" height="' + H + '" fill="#F4ECD8" stroke="#111" stroke-width=".8"/>';
      }
      var cx = s.x + W / 2;
      out += text(cx, base + 20, 14, 800, ctx.compact(s.value * 1e12));
      s.lines.forEach(function(line, k) { out += text(cx, base + 36 + k * 15, 12, 600, line); });
    });
    var height = Math.round(base + 74);
    return {
      html: '<svg width="274" height="' + height + '" viewBox="0 0 274 ' + height + '" aria-hidden="true">' + out + '</svg>',
    };
  };

  // ─── 129–133: a small animated sign next to "n of 5" ──────────────
  var STEP_ICONS = {
    // two lines grow to two new dots
    share: '<path class="l" d="M14 24L33 12" stroke="#111" stroke-width="2.6"/><path class="l" d="M14 24L33 36" stroke="#111" stroke-width="2.6"/><circle cx="12" cy="24" r="6.5" fill="#111"/><circle class="pop d1" cx="35" cy="11" r="6.5" fill="#111"/><circle class="pop d2" cx="35" cy="37" r="6.5" fill="#111"/>',
    // a magnifying glass moves across a sheet
    inform: '<rect x="7" y="5" width="26" height="34" rx="2" fill="#fff" stroke="#111" stroke-width="2"/><path d="M12 13h16M12 19h16M12 25h10" stroke="#111" stroke-width="2" stroke-linecap="round"/><g class="scan"><circle cx="30" cy="30" r="8.5" fill="rgba(255,255,255,.85)" stroke="#111" stroke-width="3"/><path d="M36.5 36.5L44 44" stroke="#111" stroke-width="4.5" stroke-linecap="round"/></g>',
    // a ballot drops into the box
    vote: '<g class="drop"><rect x="16" y="2" width="16" height="20" rx="1.5" fill="#fff" stroke="#111" stroke-width="1.8"/><path d="M19.5 11l3.5 4 6-7.5" fill="none" stroke="#111" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g><path d="M6 26H42L39 45H9Z" fill="#111"/><rect x="3" y="21" width="42" height="7" rx="2" fill="#111"/><rect class="slot" x="14" y="23.4" width="20" height="2.2" rx="1.1"/>',
    // one speech bubble, then the answer
    talk: '<path class="pop d0" d="M3 5H29V23H16L8 30V23H3Z" fill="#111"/><path class="pop d3" d="M21 27H34L40 33V27H45V13H33" fill="#fff" stroke="#111" stroke-width="2.4" stroke-linejoin="round"/>',
    // stairs are drawn, then an arrow points further down
    stairs: '<path class="l2" d="M4 8H16V19H28V30H40V38" fill="none" stroke="#111" stroke-width="3.6" stroke-linejoin="round"/><path class="pop d3" d="M40 44l-6-9h12z" fill="#111"/>',
  };

  function stepIcon() {
    return function(ctx) {
      var art = STEP_ICONS[ctx.comp.stepIcon];
      if (!art) return null;
      return {
        mount: function(el, wrapper) {
          var holder = wrapper.querySelector('.step-icon');
          if (!holder) return;
          holder.innerHTML = '<svg width="56" height="56" viewBox="0 0 48 48" aria-hidden="true">' + art + '</svg>';
          if (typeof IntersectionObserver === 'undefined') return;
          // The sign plays every time the message comes into view.
          new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
              holder.classList.remove('go');
              if (!entry.isIntersecting) return;
              void holder.offsetWidth; // restart the CSS animations
              holder.classList.add('go');
            });
          }, { threshold: 0.9 }).observe(holder);
        },
      };
    };
  }
  ['share-this', 'learn-more', 'vote', 'talk-about-this', 'go-deeper'].forEach(function(id) {
    VIZ[id] = stepIcon();
  });
})();

// ════════════════════════════════════════════════════════════════════
// Environment causes: a picture of what the message is about
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';
  var VIZ = window.WEALTH_VIZ;
  var U = VIZ._util;
  var L = U.L;

// BEGIN ENV PICTURES (generated by .impeccable/mocks/compare/build-env-pictures.cjs, do not edit by hand)
var ENV_PICTURES = {
  land: "<svg class=\"env-land\" width=\"260\" height=\"150\" viewBox=\"0 0 260 150\" preserveAspectRatio=\"xMidYMax meet\" role=\"img\" aria-label=\"{{LAND_ALT}}\"><defs><clipPath id=\"env-land-clip\"><rect class=\"env-land-reveal\" x=\"130\" y=\"-10\" width=\"140\" height=\"170\"/></clipPath></defs><g class=\"env-dry\"><path class=\"l\" d=\"M22 9v6M22 39v6M4 27h6M34 27h6M9.3 14.3l4.2 4.2M30.5 35.5l4.2 4.2M9.3 39.7l4.2-4.2M30.5 18.5l4.2-4.2\"/><circle class=\"w\" cx=\"22\" cy=\"27\" r=\"9\"/><path class=\"w\" d=\"M-2 104C30 97 82 98 130 102C172 106 216 100 262 91V152H-2Z\"/><path class=\"l1\" d=\"M8 114l11 7-5 10 8 10M19 121l15-4 9 9 13-2M56 124l-3 12 8 9M62 105l-5 11 9 8M86 110l9 10-6 10 8 13M95 120l14-5 9 7M109 115l-2-9M30 150l4-9M66 124l12 3 5 10M118 122l5 12-4 12\"/><path class=\"l\" style=\"stroke-width:3.2\" d=\"M40 101C41 88 39 74 40 56M40 82L27 68M40 72L54 57M40 60L33 44M40 60L47 43M27 68L19 66M54 57L62 58M33 44L28 40\"/><path class=\"w\" d=\"M80 102v-10h15v10\"/><ellipse class=\"w\" cx=\"87.5\" cy=\"92\" rx=\"7.5\" ry=\"2.6\"/><ellipse cx=\"87.5\" cy=\"92\" rx=\"3\" ry=\"1\" fill=\"none\" stroke=\"#111\" stroke-width=\".8\"/><path class=\"l1\" transform=\"translate(128 -4)\" d=\"M8 114l11 7-5 10 8 10M19 121l15-4 9 9 13-2M56 124l-3 12 8 9M62 105l-5 11 9 8M86 110l9 10-6 10 8 13M95 120l14-5 9 7M109 115l-2-9M30 150l4-9M66 124l12 3 5 10M118 122l5 12-4 12\"/><path class=\"l\" style=\"stroke-width:3\" d=\"M214 97C215 86 213 76 214 62M214 82L204 72M214 74L224 63\"/></g><g clip-path=\"url(#env-land-clip)\"><rect x=\"130\" y=\"-10\" width=\"140\" height=\"112\" fill=\"#45A6DC\" style=\"fill:var(--blue)\"/><path class=\"w\" d=\"M130 102C172 106 216 100 262 91V152H130Z\"/><path class=\"l1\" d=\"M136 150C140 132 148 116 158 105M149 150C152 133 159 117 168 105M162 150C165 134 171 119 178 105M175 150C178 135 183 120 188 104M188 150C190 136 193 122 196 110\"/><path class=\"riv\" d=\"M204 100.5C197 112 223 117 213 130C207 138 214 146 220 152H246C238 144 228 139 236 127C246 113 214 110 214 100Z\"/><path class=\"l1\" d=\"M250 118l-2-6M250 118v-7M250 118l3-6M252 142l-2-6M252 142v-7M252 142l3-6M232 108l-2-5M232 108l1-6\"/><path class=\"w\" d=\"M167 40a8 8 0 0 1 3-15a12 12 0 0 1 22-3a9 9 0 0 1 12 9a7 7 0 0 1-2 9Z\"/><path class=\"l1\" d=\"M174 46l-2 6M184 46l-2 6M194 46l-2 6\"/><path class=\"l\" style=\"stroke-width:3\" d=\"M151 104V73.3M151 85.2l-7.5 -8.5M151 81.8l7.5 -7.5\"/><g class=\"k\"><ellipse cx=\"151\" cy=\"66.8\" rx=\"14.3\" ry=\"9.2\"/><ellipse cx=\"141.5\" cy=\"71.6\" rx=\"9.2\" ry=\"6.5\"/><ellipse cx=\"161.2\" cy=\"70.9\" rx=\"8.8\" ry=\"6.5\"/></g><path class=\"l\" style=\"stroke-width:3.6\" d=\"M236 96V52M236 66l-8.8 -10M236 62l8.8 -8.8\"/><g class=\"k\"><ellipse cx=\"236\" cy=\"44.4\" rx=\"16.8\" ry=\"10.8\"/><ellipse cx=\"224.8\" cy=\"50\" rx=\"10.8\" ry=\"7.6\"/><ellipse cx=\"248\" cy=\"49.2\" rx=\"10.4\" ry=\"7.6\"/></g><ellipse class=\"k\" cx=\"176\" cy=\"101\" rx=\"8\" ry=\"5.5\"/><ellipse class=\"k\" cx=\"222\" cy=\"97\" rx=\"7\" ry=\"5\"/></g><g class=\"env-land-divider\"><path class=\"l\" style=\"stroke-width:2\" d=\"M130 4V150\"/><circle class=\"k\" cx=\"130\" cy=\"62\" r=\"11\"/><path d=\"M124.5 62h10M130.5 57.5l4.5 4.5-4.5 4.5\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></g></svg>",
  ocean: "<svg class=\"env-ocean\" width=\"260\" height=\"158\" viewBox=\"0 0 260 158\" preserveAspectRatio=\"xMidYMax meet\" role=\"img\" aria-label=\"{{OCEAN_ALT}}\"><g class=\"env-patch\"><path class=\"t\" d=\"M246.4 67.8L242.5 73L238.9 77.7L235.8 82.2L233.2 86.6L231 91L229 95.5L226.9 100.2L224.4 104.9L221.4 109.5L217.7 113.8L213.4 117.8L208.5 121.3L203.1 124.5L197.4 127.3L191.3 129.9L185 132.2L178.4 134.3L171.4 136.2L164.1 137.6L156.5 138.3L148.8 138.1L141.2 136.9L134.1 134.5L127.5 131.1L121.9 126.7L117.1 121.7L113.3 116.2L110.1 110.6L107.4 105.1L105 99.8L102.4 94.6L99.8 89.5L97 84.4L94.3 79.1L92 73.6L90.4 67.8L89.9 61.9L90.6 55.9L92.6 50.2L95.9 44.9L100.2 40.2L105.2 36L110.6 32.4L116.1 29.1L121.4 26.2L126.5 23.3L131.5 20.4L136.4 17.4L141.5 14.4L146.8 11.5L152.5 9L158.5 6.9L164.8 5.3L171.4 4.4L178.1 4L184.9 4.1L191.7 4.6L198.7 5.3L205.8 6.3L213.1 7.5L220.6 9.2L228.1 11.4L235.4 14.5L242.1 18.3L247.8 23.2L252.2 28.9L255 35.3L256 42.1L255.3 49.1L253.2 55.8L250.1 62.1Z\"/><g class=\"fl\"><rect x=\"205.6\" y=\"110.3\" width=\"3.7\" height=\"2.2\" transform=\"rotate(112 207.4 111.5)\"/><path d=\"M211.3 62.5L213.2 59.2L215.1 62.5Z\" transform=\"rotate(41 213.2 61.1)\"/><path d=\"M162.9 37.2L164.8 34L166.7 37.2Z\" transform=\"rotate(52 164.8 35.9)\"/><rect x=\"218\" y=\"102.5\" width=\"3.7\" height=\"2.2\" transform=\"rotate(3 219.9 103.6)\"/><rect x=\"225.3\" y=\"20\" width=\"3.7\" height=\"2.2\" transform=\"rotate(22 227.1 21.1)\"/><rect x=\"235.7\" y=\"37.4\" width=\"3.7\" height=\"2.2\" transform=\"rotate(177 237.6 38.5)\"/><rect x=\"126.2\" y=\"48.5\" width=\"3.7\" height=\"2.2\" transform=\"rotate(156 128.1 49.6)\"/><circle cx=\"173.6\" cy=\"116.6\" r=\"1.3\"/><rect x=\"195.4\" y=\"79.1\" width=\"3.7\" height=\"2.2\" transform=\"rotate(140 197.2 80.2)\"/><rect x=\"141\" y=\"126.6\" width=\"3.7\" height=\"2.2\" transform=\"rotate(32 142.9 127.8)\"/><path d=\"M232.9 33.8L234.8 30.6L236.6 33.8Z\" transform=\"rotate(2 234.8 32.4)\"/><rect x=\"141.2\" y=\"108.1\" width=\"3.7\" height=\"2.2\" transform=\"rotate(119 143.1 109.2)\"/><rect x=\"214.1\" y=\"70.7\" width=\"3.7\" height=\"2.2\" transform=\"rotate(167 216 71.8)\"/><path d=\"M175.8 126.2L177.7 123L179.5 126.2Z\" transform=\"rotate(104 177.7 124.9)\"/><rect x=\"130.4\" y=\"71.4\" width=\"3.7\" height=\"2.2\" transform=\"rotate(45 132.2 72.5)\"/><circle cx=\"138.4\" cy=\"100.3\" r=\"1.3\"/><rect x=\"143.2\" y=\"51.2\" width=\"3.7\" height=\"2.2\" transform=\"rotate(76 145.1 52.3)\"/><rect x=\"171.8\" y=\"119\" width=\"3.7\" height=\"2.2\" transform=\"rotate(107 173.6 120.1)\"/><circle cx=\"202.4\" cy=\"28.5\" r=\"1.3\"/><circle cx=\"198.6\" cy=\"60.3\" r=\"1.3\"/><rect x=\"192\" y=\"91.6\" width=\"3.7\" height=\"2.2\" transform=\"rotate(26 193.9 92.7)\"/><circle cx=\"139.8\" cy=\"41.4\" r=\"1.3\"/><rect x=\"221.4\" y=\"32.1\" width=\"3.7\" height=\"2.2\" transform=\"rotate(31 223.3 33.2)\"/><rect x=\"243.8\" y=\"59\" width=\"3.7\" height=\"2.2\" transform=\"rotate(140 245.7 60.1)\"/><path d=\"M185.9 34.9L187.8 31.7L189.6 34.9Z\" transform=\"rotate(139 187.8 33.6)\"/><rect x=\"126.3\" y=\"115.5\" width=\"3.7\" height=\"2.2\" transform=\"rotate(53 128.1 116.6)\"/><rect x=\"199.6\" y=\"71.6\" width=\"3.7\" height=\"2.2\" transform=\"rotate(44 201.5 72.7)\"/><circle cx=\"202.8\" cy=\"117.3\" r=\"1.3\"/><circle cx=\"203.9\" cy=\"56\" r=\"1.3\"/><circle cx=\"192.1\" cy=\"60.5\" r=\"1.3\"/><rect x=\"169.6\" y=\"43.9\" width=\"3.7\" height=\"2.2\" transform=\"rotate(78 171.5 45)\"/><rect x=\"174.5\" y=\"92.5\" width=\"3.7\" height=\"2.2\" transform=\"rotate(44 176.4 93.6)\"/><rect x=\"144.2\" y=\"97.1\" width=\"3.7\" height=\"2.2\" transform=\"rotate(25 146 98.2)\"/><rect x=\"172.7\" y=\"49.4\" width=\"3.7\" height=\"2.2\" transform=\"rotate(38 174.6 50.5)\"/><circle cx=\"207\" cy=\"110.7\" r=\"1.3\"/><rect x=\"168.5\" y=\"36.3\" width=\"3.7\" height=\"2.2\" transform=\"rotate(88 170.3 37.4)\"/><rect x=\"168.8\" y=\"75.7\" width=\"3.7\" height=\"2.2\" transform=\"rotate(57 170.7 76.8)\"/><rect x=\"125.7\" y=\"44.6\" width=\"3.7\" height=\"2.2\" transform=\"rotate(51 127.6 45.7)\"/><path d=\"M229.3 68.6L231.2 65.3L233 68.6Z\" transform=\"rotate(176 231.2 67.2)\"/><rect x=\"170.4\" y=\"90.3\" width=\"3.7\" height=\"2.2\" transform=\"rotate(20 172.2 91.4)\"/><circle cx=\"171.9\" cy=\"69.3\" r=\"1.3\"/><path d=\"M143 128.5L144.8 125.3L146.7 128.5Z\" transform=\"rotate(158 144.8 127.2)\"/><path d=\"M219.2 42.4L221.1 39.2L222.9 42.4Z\" transform=\"rotate(125 221.1 41.1)\"/><path d=\"M206.2 81L208.1 77.8L209.9 81Z\" transform=\"rotate(37 208.1 79.6)\"/><circle cx=\"189.8\" cy=\"47.2\" r=\"1.3\"/><rect x=\"148.8\" y=\"49\" width=\"3.7\" height=\"2.2\" transform=\"rotate(58 150.7 50.1)\"/><circle cx=\"149.6\" cy=\"111.7\" r=\"1.3\"/><rect x=\"119.6\" y=\"97.4\" width=\"3.7\" height=\"2.2\" transform=\"rotate(145 121.5 98.6)\"/><circle cx=\"182.4\" cy=\"105\" r=\"1.3\"/><rect x=\"237\" y=\"66.1\" width=\"3.7\" height=\"2.2\" transform=\"rotate(17 238.9 67.2)\"/><circle cx=\"231.8\" cy=\"55.2\" r=\"1.3\"/><rect x=\"186.9\" y=\"74.1\" width=\"3.7\" height=\"2.2\" transform=\"rotate(43 188.8 75.2)\"/><rect x=\"131\" y=\"100.9\" width=\"3.7\" height=\"2.2\" transform=\"rotate(113 132.9 102)\"/><rect x=\"138\" y=\"39.1\" width=\"3.7\" height=\"2.2\" transform=\"rotate(72 139.9 40.2)\"/><path d=\"M158.4 89.3L160.3 86.1L162.2 89.3Z\" transform=\"rotate(46 160.3 88)\"/><rect x=\"146.2\" y=\"79.1\" width=\"3.7\" height=\"2.2\" transform=\"rotate(103 148 80.2)\"/><path d=\"M147 69L148.9 65.8L150.8 69Z\" transform=\"rotate(42 148.9 67.7)\"/><rect x=\"115.3\" y=\"86.6\" width=\"3.7\" height=\"2.2\" transform=\"rotate(128 117.2 87.7)\"/><rect x=\"173.2\" y=\"68.5\" width=\"3.7\" height=\"2.2\" transform=\"rotate(61 175.1 69.6)\"/><rect x=\"172\" y=\"63.9\" width=\"3.7\" height=\"2.2\" transform=\"rotate(97 173.8 65)\"/><path d=\"M102.9 86.1L104.8 82.9L106.6 86.1Z\" transform=\"rotate(34 104.8 84.8)\"/><rect x=\"158.4\" y=\"30.5\" width=\"3.7\" height=\"2.2\" transform=\"rotate(86 160.2 31.6)\"/><circle cx=\"132\" cy=\"67\" r=\"1.3\"/><rect x=\"158.1\" y=\"25.7\" width=\"3.7\" height=\"2.2\" transform=\"rotate(3 159.9 26.8)\"/><rect x=\"141.1\" y=\"50.7\" width=\"3.7\" height=\"2.2\" transform=\"rotate(85 143 51.8)\"/><rect x=\"129.6\" y=\"54.5\" width=\"3.7\" height=\"2.2\" transform=\"rotate(75 131.5 55.6)\"/><path d=\"M146.5 131.9L148.3 128.6L150.2 131.9Z\" transform=\"rotate(157 148.3 130.5)\"/><circle cx=\"171.1\" cy=\"74.6\" r=\"1.3\"/><circle cx=\"185.4\" cy=\"71.3\" r=\"1.3\"/><rect x=\"187.2\" y=\"53.6\" width=\"3.7\" height=\"2.2\" transform=\"rotate(131 189.1 54.7)\"/><path d=\"M209.5 72L211.3 68.8L213.2 72Z\" transform=\"rotate(128 211.3 70.6)\"/><path d=\"M126.4 76L128.3 72.8L130.1 76Z\" transform=\"rotate(173 128.3 74.6)\"/><path d=\"M121.4 98L123.3 94.8L125.2 98Z\" transform=\"rotate(83 123.3 96.7)\"/><rect x=\"154.9\" y=\"100.7\" width=\"3.7\" height=\"2.2\" transform=\"rotate(96 156.8 101.8)\"/><rect x=\"201\" y=\"59.6\" width=\"3.7\" height=\"2.2\" transform=\"rotate(73 202.8 60.7)\"/><path d=\"M187.4 47.7L189.3 44.5L191.2 47.7Z\" transform=\"rotate(102 189.3 46.3)\"/><path d=\"M101.7 78.7L103.5 75.5L105.4 78.7Z\" transform=\"rotate(177 103.5 77.3)\"/><circle cx=\"170.9\" cy=\"65.6\" r=\"1.3\"/><path d=\"M134.7 115.2L136.6 112L138.4 115.2Z\" transform=\"rotate(84 136.6 113.8)\"/><path d=\"M197.3 119.4L199.2 116.2L201.1 119.4Z\" transform=\"rotate(82 199.2 118)\"/><path d=\"M216.6 87L218.4 83.8L220.3 87Z\" transform=\"rotate(126 218.4 85.6)\"/><circle cx=\"153.3\" cy=\"132\" r=\"1.3\"/><circle cx=\"154.8\" cy=\"67.9\" r=\"1.3\"/><circle cx=\"170.9\" cy=\"17.9\" r=\"1.3\"/><rect x=\"164.8\" y=\"57.5\" width=\"3.7\" height=\"2.2\" transform=\"rotate(66 166.7 58.6)\"/><rect x=\"227.3\" y=\"47.1\" width=\"3.7\" height=\"2.2\" transform=\"rotate(66 229.2 48.2)\"/><circle cx=\"114.5\" cy=\"67.7\" r=\"1.3\"/><circle cx=\"142.1\" cy=\"39.6\" r=\"1.3\"/><rect x=\"226.2\" y=\"69.9\" width=\"3.7\" height=\"2.2\" transform=\"rotate(154 228 71)\"/><circle cx=\"105\" cy=\"77.8\" r=\"1.3\"/><rect x=\"227.3\" y=\"35.6\" width=\"3.7\" height=\"2.2\" transform=\"rotate(78 229.2 36.7)\"/><path d=\"M146.9 110.2L148.8 106.9L150.6 110.2Z\" transform=\"rotate(83 148.8 108.8)\"/><circle cx=\"162.6\" cy=\"86.9\" r=\"1.3\"/><path d=\"M185.5 43.5L187.3 40.3L189.2 43.5Z\" transform=\"rotate(46 187.3 42.1)\"/><path d=\"M146.2 99.5L148 96.2L149.9 99.5Z\" transform=\"rotate(121 148 98.1)\"/><circle cx=\"152.1\" cy=\"52.9\" r=\"1.3\"/><rect x=\"136.3\" y=\"39.7\" width=\"3.7\" height=\"2.2\" transform=\"rotate(109 138.2 40.8)\"/><rect x=\"204.6\" y=\"88.7\" width=\"3.7\" height=\"2.2\" transform=\"rotate(139 206.5 89.8)\"/><rect x=\"135.9\" y=\"107.8\" width=\"3.7\" height=\"2.2\" transform=\"rotate(58 137.7 108.9)\"/><rect x=\"210\" y=\"94\" width=\"3.7\" height=\"2.2\" transform=\"rotate(163 211.8 95.1)\"/><path d=\"M170.8 66.4L172.7 63.2L174.6 66.4Z\" transform=\"rotate(103 172.7 65.1)\"/><rect x=\"103\" y=\"74.8\" width=\"3.7\" height=\"2.2\" transform=\"rotate(143 104.8 75.9)\"/><path d=\"M170 18.1L171.9 14.8L173.8 18.1Z\" transform=\"rotate(90 171.9 16.7)\"/><circle cx=\"101.6\" cy=\"52.3\" r=\"1.3\"/><rect x=\"216.6\" y=\"102.5\" width=\"3.7\" height=\"2.2\" transform=\"rotate(15 218.5 103.6)\"/><rect x=\"157.9\" y=\"26\" width=\"3.7\" height=\"2.2\" transform=\"rotate(91 159.7 27.1)\"/><rect x=\"210.6\" y=\"33.3\" width=\"3.7\" height=\"2.2\" transform=\"rotate(80 212.5 34.4)\"/><rect x=\"137.2\" y=\"120\" width=\"3.7\" height=\"2.2\" transform=\"rotate(3 139.1 121.1)\"/><path d=\"M159.3 48.3L161.1 45.1L163 48.3Z\" transform=\"rotate(3 161.1 47)\"/><rect x=\"125.8\" y=\"101.1\" width=\"3.7\" height=\"2.2\" transform=\"rotate(33 127.6 102.2)\"/><path d=\"M117.3 52L119.2 48.8L121 52Z\" transform=\"rotate(167 119.2 50.7)\"/><circle cx=\"225.8\" cy=\"25.8\" r=\"1.3\"/><rect x=\"161.3\" y=\"99.2\" width=\"3.7\" height=\"2.2\" transform=\"rotate(118 163.2 100.3)\"/><circle cx=\"212.9\" cy=\"96.5\" r=\"1.3\"/><rect x=\"101.3\" y=\"43.5\" width=\"3.7\" height=\"2.2\" transform=\"rotate(176 103.2 44.6)\"/><path d=\"M244.5 35L246.3 31.8L248.2 35Z\" transform=\"rotate(63 246.3 33.7)\"/><path d=\"M191.1 13.2L193 10L194.9 13.2Z\" transform=\"rotate(25 193 11.9)\"/><circle cx=\"172.9\" cy=\"76\" r=\"1.3\"/><circle cx=\"214.7\" cy=\"76.2\" r=\"1.3\"/><rect x=\"138.2\" y=\"97.9\" width=\"3.7\" height=\"2.2\" transform=\"rotate(153 140 99)\"/><path d=\"M190.7 111.8L192.6 108.5L194.5 111.8Z\" transform=\"rotate(140 192.6 110.4)\"/><rect x=\"119.1\" y=\"39.6\" width=\"3.7\" height=\"2.2\" transform=\"rotate(131 120.9 40.7)\"/><rect x=\"105.9\" y=\"86.2\" width=\"3.7\" height=\"2.2\" transform=\"rotate(96 107.8 87.3)\"/><rect x=\"182.5\" y=\"66.3\" width=\"3.7\" height=\"2.2\" transform=\"rotate(104 184.4 67.4)\"/><rect x=\"195\" y=\"31.9\" width=\"3.7\" height=\"2.2\" transform=\"rotate(21 196.9 33)\"/><rect x=\"162.9\" y=\"48.8\" width=\"3.7\" height=\"2.2\" transform=\"rotate(172 164.8 49.9)\"/><rect x=\"147.6\" y=\"74.4\" width=\"3.7\" height=\"2.2\" transform=\"rotate(31 149.5 75.5)\"/><circle cx=\"153.1\" cy=\"108.3\" r=\"1.3\"/><circle cx=\"113.9\" cy=\"76.8\" r=\"1.3\"/><rect x=\"139.3\" y=\"95.6\" width=\"3.7\" height=\"2.2\" transform=\"rotate(16 141.1 96.7)\"/><rect x=\"102.9\" y=\"65.6\" width=\"3.7\" height=\"2.2\" transform=\"rotate(95 104.8 66.7)\"/><rect x=\"141.9\" y=\"34.8\" width=\"3.7\" height=\"2.2\" transform=\"rotate(176 143.8 35.9)\"/><rect x=\"157.7\" y=\"127.2\" width=\"3.7\" height=\"2.2\" transform=\"rotate(176 159.5 128.3)\"/><path d=\"M123 54L124.8 50.7L126.7 54Z\" transform=\"rotate(63 124.8 52.6)\"/><rect x=\"201.5\" y=\"106.9\" width=\"3.7\" height=\"2.2\" transform=\"rotate(23 203.3 108)\"/><path d=\"M188.6 21.2L190.5 18L192.3 21.2Z\" transform=\"rotate(101 190.5 19.9)\"/><rect x=\"138.7\" y=\"28.5\" width=\"3.7\" height=\"2.2\" transform=\"rotate(5 140.6 29.6)\"/><path d=\"M219.1 103.6L221 100.4L222.8 103.6Z\" transform=\"rotate(96 221 102.2)\"/><path d=\"M234.7 35.6L236.6 32.4L238.4 35.6Z\" transform=\"rotate(80 236.6 34.3)\"/><circle cx=\"174.3\" cy=\"53.5\" r=\"1.3\"/><rect x=\"236\" y=\"22.7\" width=\"3.7\" height=\"2.2\" transform=\"rotate(102 237.9 23.8)\"/><rect x=\"219\" y=\"17.6\" width=\"3.7\" height=\"2.2\" transform=\"rotate(140 220.9 18.7)\"/><rect x=\"210.2\" y=\"45.3\" width=\"3.7\" height=\"2.2\" transform=\"rotate(25 212.1 46.4)\"/><rect x=\"200.1\" y=\"87.9\" width=\"3.7\" height=\"2.2\" transform=\"rotate(150 201.9 89.1)\"/><rect x=\"227.2\" y=\"29.5\" width=\"3.7\" height=\"2.2\" transform=\"rotate(72 229.1 30.6)\"/><path d=\"M148.2 33.5L150.1 30.2L151.9 33.5Z\" transform=\"rotate(95 150.1 32.1)\"/><path d=\"M162 59.8L163.8 56.6L165.7 59.8Z\" transform=\"rotate(50 163.8 58.5)\"/><circle cx=\"198.3\" cy=\"23.7\" r=\"1.3\"/><rect x=\"131.1\" y=\"34.1\" width=\"3.7\" height=\"2.2\" transform=\"rotate(47 132.9 35.2)\"/><rect x=\"182.3\" y=\"13.8\" width=\"3.7\" height=\"2.2\" transform=\"rotate(96 184.1 14.9)\"/><rect x=\"222.3\" y=\"33.6\" width=\"3.7\" height=\"2.2\" transform=\"rotate(152 224.2 34.7)\"/><rect x=\"119.3\" y=\"66.3\" width=\"3.7\" height=\"2.2\" transform=\"rotate(24 121.2 67.4)\"/><rect x=\"196.5\" y=\"21.2\" width=\"3.7\" height=\"2.2\" transform=\"rotate(90 198.3 22.3)\"/><circle cx=\"207.5\" cy=\"19.2\" r=\"1.3\"/><rect x=\"191.2\" y=\"73.2\" width=\"3.7\" height=\"2.2\" transform=\"rotate(139 193.1 74.3)\"/><circle cx=\"192.8\" cy=\"79.7\" r=\"1.3\"/><path d=\"M109.3 65.5L111.2 62.3L113 65.5Z\" transform=\"rotate(135 111.2 64.1)\"/><rect x=\"203.7\" y=\"23.2\" width=\"3.7\" height=\"2.2\" transform=\"rotate(164 205.6 24.3)\"/><rect x=\"103.8\" y=\"59.6\" width=\"3.7\" height=\"2.2\" transform=\"rotate(124 105.6 60.7)\"/><rect x=\"219.7\" y=\"77.2\" width=\"3.7\" height=\"2.2\" transform=\"rotate(147 221.6 78.3)\"/><path d=\"M204.9 52.8L206.8 49.6L208.6 52.8Z\" transform=\"rotate(117 206.8 51.5)\"/><rect x=\"202.8\" y=\"30.6\" width=\"3.7\" height=\"2.2\" transform=\"rotate(75 204.7 31.7)\"/><circle cx=\"188.5\" cy=\"48.2\" r=\"1.3\"/><circle cx=\"196.3\" cy=\"73.1\" r=\"1.3\"/><rect x=\"227.4\" y=\"68.4\" width=\"3.7\" height=\"2.2\" transform=\"rotate(39 229.3 69.5)\"/><path d=\"M141.6 126.5L143.4 123.3L145.3 126.5Z\" transform=\"rotate(48 143.4 125.2)\"/><path d=\"M127.2 45.6L129.1 42.4L131 45.6Z\" transform=\"rotate(117 129.1 44.3)\"/><circle cx=\"130.9\" cy=\"88.1\" r=\"1.3\"/><circle cx=\"209\" cy=\"38\" r=\"1.3\"/><circle cx=\"137.1\" cy=\"71.3\" r=\"1.3\"/><path d=\"M138.6 124.5L140.5 121.3L142.4 124.5Z\" transform=\"rotate(120 140.5 123.2)\"/><rect x=\"191.8\" y=\"108.7\" width=\"3.7\" height=\"2.2\" transform=\"rotate(145 193.6 109.9)\"/><path d=\"M95.2 69L97 65.8L98.9 69Z\" transform=\"rotate(73 97 67.7)\"/><circle cx=\"160\" cy=\"113.6\" r=\"1.3\"/><circle cx=\"140.1\" cy=\"122.7\" r=\"1.3\"/><rect x=\"173.1\" y=\"68.1\" width=\"3.7\" height=\"2.2\" transform=\"rotate(80 175 69.2)\"/><circle cx=\"235.8\" cy=\"59.9\" r=\"1.3\"/><rect x=\"132.2\" y=\"49.2\" width=\"3.7\" height=\"2.2\" transform=\"rotate(171 134.1 50.3)\"/><circle cx=\"122.8\" cy=\"95.1\" r=\"1.3\"/><rect x=\"145.1\" y=\"28.7\" width=\"3.7\" height=\"2.2\" transform=\"rotate(54 146.9 29.8)\"/><circle cx=\"133.9\" cy=\"61.2\" r=\"1.3\"/><circle cx=\"170.7\" cy=\"109.1\" r=\"1.3\"/><rect x=\"156.1\" y=\"129.5\" width=\"3.7\" height=\"2.2\" transform=\"rotate(16 158 130.6)\"/><circle cx=\"167.3\" cy=\"123.3\" r=\"1.3\"/><path d=\"M170.5 90L172.4 86.8L174.2 90Z\" transform=\"rotate(157 172.4 88.6)\"/><circle cx=\"120.5\" cy=\"101.1\" r=\"1.3\"/><rect x=\"209.3\" y=\"96.7\" width=\"3.7\" height=\"2.2\" transform=\"rotate(107 211.2 97.8)\"/><rect x=\"141.8\" y=\"109.3\" width=\"3.7\" height=\"2.2\" transform=\"rotate(37 143.7 110.4)\"/><rect x=\"223.3\" y=\"73.6\" width=\"3.7\" height=\"2.2\" transform=\"rotate(144 225.2 74.7)\"/><path d=\"M180.7 76.5L182.6 73.3L184.5 76.5Z\" transform=\"rotate(105 182.6 75.1)\"/></g></g><path class=\"w\" style=\"stroke-width:1.2\" d=\"M13.5 52.7L12.1 50.3L13 48.4L16.2 47.4L19.4 48L20.5 50.7L22.6 49.2L23.8 45.6L26.5 45.5L25 42.7L23.4 40.8L25.8 38.7L23.8 34L29.3 34.8L32.8 35.6L32.1 38.8L34.2 40.4L38.1 40.8L40.8 39.6L38.8 43L39.4 44.6L43.4 45.3L45.5 42.5L48 42.1L50.5 39.1L55.1 37.4L57.4 36.5L58.9 38.3L57.5 42.2L60.7 43.4L62.9 45L63.3 47.5L64.4 52L62.4 57.1L65.7 60.1L65.3 62.7L66.5 65.9L65.7 68.6L68.3 74L68.6 76.6L67.2 79.4L63.5 77.4L61.4 80L57.9 81.3L54.4 84.2L50.8 85.1L48 85.6L51 90.1L50.1 92L51.9 95.4L54.4 97.1L57.2 99.9L60.2 103.1L57.5 105.3L57.2 107.6L52.6 110.6L54.4 113.8L54.9 117.4L52.6 115.5L48.5 116.3L44.5 116.5L40.1 118.3L36.3 116.6L34.8 120L33 117.2L30.3 116.8L27.4 115.6L24.7 114.9L22.9 114L21.9 116.1L19 116.7L16.2 116.5L15.7 112.9L16.2 108.4L17.6 105.2L20.7 100.8L18.7 100.2L14.8 98.6L10.2 98.6L7.5 95.2L8.6 91.5L5.8 87.8L7.6 85.5L5.1 80.8L4 77.4L6.1 75.9L6.5 72.3L4.6 68.6L7.7 68.6L10.8 67L12.3 64L10 61.3L12.3 59.5L13.4 55.4Z\"/><text class=\"tx\" text-anchor=\"middle\" x=\"35.9\" y=\"135\">{{GERMANY}}</text><text class=\"tx\" text-anchor=\"middle\" x=\"171.4\" y=\"153.3\">{{PATCH}}</text></svg>",
  forest: "<svg class=\"env-forest\" width=\"260\" height=\"160\" viewBox=\"0 0 260 160\" preserveAspectRatio=\"xMidYMax meet\" role=\"img\" aria-label=\"{{FOREST_ALT}}\"><path class=\"w\" d=\"M-2 132H262V162H-2Z\"/><path class=\"l1\" d=\"M150 141l-2-5M150 141l1-6M186 146l-2-5M186 146l1-6M224 140l-2-5M224 140l1-6M246 148l-2-5M246 148l1-6M166 152l-2-5M166 152l1-6\"/><path class=\"w\" d=\"M4 132v-9h14v9\"/><ellipse class=\"w\" cx=\"11\" cy=\"123\" rx=\"7\" ry=\"2.6\"/><ellipse cx=\"11\" cy=\"123\" rx=\"2.8\" ry=\"1\" fill=\"none\" stroke=\"#111\" stroke-width=\".8\"/><path class=\"w\" d=\"M28 132v-11h16v11\"/><ellipse class=\"w\" cx=\"36\" cy=\"121\" rx=\"8\" ry=\"2.6\"/><ellipse cx=\"36\" cy=\"121\" rx=\"3.2\" ry=\"1\" fill=\"none\" stroke=\"#111\" stroke-width=\".8\"/><path class=\"w\" d=\"M14 149v-9h15v9\"/><ellipse class=\"w\" cx=\"21.5\" cy=\"140\" rx=\"7.5\" ry=\"2.6\"/><ellipse cx=\"21.5\" cy=\"140\" rx=\"3\" ry=\"1\" fill=\"none\" stroke=\"#111\" stroke-width=\".8\"/><path class=\"w\" d=\"M66 145v-9h14v9\"/><ellipse class=\"w\" cx=\"73\" cy=\"136\" rx=\"7\" ry=\"2.6\"/><ellipse cx=\"73\" cy=\"136\" rx=\"2.8\" ry=\"1\" fill=\"none\" stroke=\"#111\" stroke-width=\".8\"/><g transform=\"translate(36 154) rotate(-4)\"><rect class=\"w\" x=\"0\" y=\"-5\" width=\"34\" height=\"10\" rx=\"5\"/><ellipse class=\"w\" cx=\"34\" cy=\"0\" rx=\"3\" ry=\"5\"/></g><path d=\"M52 98L40 117\" stroke=\"#111\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M52 98L40 117\" stroke=\"#fff\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path class=\"k\" style=\"stroke:#111;stroke-width:1;stroke-linejoin:round\" d=\"M-7 -3H3V3L5 13C1 15-5 15-9 13L-7 3Z\" transform=\"translate(40 117) rotate(122.3) scale(1 -1)\"/><g class=\"env-fall\" transform=\"rotate(-38 106 132)\"><path class=\"l\" style=\"stroke-width:3.4\" d=\"M106 132V78.9M106 93.6l-9.2 -10.5M106 89.4l9.2 -9.2\"/><g class=\"k\"><ellipse cx=\"106\" cy=\"70.9\" rx=\"17.6\" ry=\"11.3\"/><ellipse cx=\"94.2\" cy=\"76.8\" rx=\"11.3\" ry=\"8\"/><ellipse cx=\"118.6\" cy=\"76\" rx=\"10.9\" ry=\"8\"/></g></g><path class=\"l1 env-whoosh\" d=\"M88 52q9 6 12 18M98 46q8 6 11 15\"/><path class=\"w\" d=\"M118 18h7V132h-7Z\"/><path class=\"k\" d=\"M118 18h7v10h-7ZM118 38h7v10h-7ZM118 58h7v10h-7ZM118 78h7v10h-7ZM118 98h7v10h-7ZM118 118h7v14h-7Z\"/><text class=\"tx\" x=\"121.5\" y=\"12\" text-anchor=\"middle\" style=\"font-weight:800;font-size:12.5px\">2030</text><path class=\"l\" style=\"stroke-width:3.6\" d=\"M146 132V60.7M146 76.8l-10.1 -11.5M146 72.2l10.1 -10.1\"/><g class=\"k\"><ellipse cx=\"146\" cy=\"52\" rx=\"19.3\" ry=\"12.4\"/><ellipse cx=\"133.1\" cy=\"58.4\" rx=\"12.4\" ry=\"8.7\"/><ellipse cx=\"159.8\" cy=\"57.5\" rx=\"12\" ry=\"8.7\"/></g><path class=\"l\" style=\"stroke-width:3\" d=\"M170 132V79.1M170 92.4l-8.4 -9.5M170 88.6l8.4 -8.4\"/><g class=\"k\"><ellipse cx=\"170\" cy=\"71.9\" rx=\"16\" ry=\"10.3\"/><ellipse cx=\"159.4\" cy=\"77.2\" rx=\"10.3\" ry=\"7.2\"/><ellipse cx=\"181.4\" cy=\"76.4\" rx=\"9.9\" ry=\"7.2\"/></g><path class=\"l\" style=\"stroke-width:4\" d=\"M196 132V45.2M196 64.8l-12.3 -14M196 59.2l12.3 -12.3\"/><g class=\"k\"><ellipse cx=\"196\" cy=\"34.6\" rx=\"23.5\" ry=\"15.1\"/><ellipse cx=\"180.3\" cy=\"42.4\" rx=\"15.1\" ry=\"10.6\"/><ellipse cx=\"212.8\" cy=\"41.3\" rx=\"14.6\" ry=\"10.6\"/></g><path class=\"l\" style=\"stroke-width:3.4\" d=\"M220 132V66.9M220 81.6l-9.2 -10.5M220 77.4l9.2 -9.2\"/><g class=\"k\"><ellipse cx=\"220\" cy=\"58.9\" rx=\"17.6\" ry=\"11.3\"/><ellipse cx=\"208.2\" cy=\"64.8\" rx=\"11.3\" ry=\"8\"/><ellipse cx=\"232.6\" cy=\"64\" rx=\"10.9\" ry=\"8\"/></g><path class=\"l\" style=\"stroke-width:3.8\" d=\"M240 132V46M240 60l-8.8 -10M240 56l8.8 -8.8\"/><g class=\"k\"><ellipse cx=\"240\" cy=\"38.4\" rx=\"16.8\" ry=\"10.8\"/><ellipse cx=\"228.8\" cy=\"44\" rx=\"10.8\" ry=\"7.6\"/><ellipse cx=\"252\" cy=\"43.2\" rx=\"10.4\" ry=\"7.6\"/></g><path class=\"l1\" d=\"M158 62q4 22-2 40M228 66q-5 20 1 38M187 50q3 16 0 30\"/><ellipse class=\"k\" cx=\"158\" cy=\"129\" rx=\"10\" ry=\"6\"/><ellipse class=\"k\" cx=\"184\" cy=\"130\" rx=\"9\" ry=\"5\"/><ellipse class=\"k\" cx=\"232\" cy=\"129\" rx=\"11\" ry=\"6\"/><g transform=\"translate(198 44)\"><path class=\"w\" d=\"M2 5l5 11-5-2Z\"/><ellipse class=\"w\" cx=\"0\" cy=\"0\" rx=\"5.5\" ry=\"8\"/><circle class=\"w\" cx=\"-1.5\" cy=\"-9\" r=\"4.6\"/><path class=\"w\" d=\"M-5-12C-12-14-19-11-20-6C-15-5-9-5.5-5-6.5Z\"/><path class=\"k\" d=\"M-20-6c1-2 2-3.4 3.6-4.4l1.4 4.8Z\"/><circle class=\"k\" cx=\"-2.6\" cy=\"-10\" r=\"1.1\"/></g><g class=\"env-bird\" transform=\"translate(106 64)\"><g transform=\"translate(0 0) scale(-1 1)\"><path class=\"w\" d=\"M2 5l5 11-5-2Z\"/><ellipse class=\"w\" cx=\"0\" cy=\"0\" rx=\"5.5\" ry=\"8\"/><circle class=\"w\" cx=\"-1.5\" cy=\"-9\" r=\"4.6\"/><path class=\"w\" d=\"M-5-12C-12-14-19-11-20-6C-15-5-9-5.5-5-6.5Z\"/><path class=\"k\" d=\"M-20-6c1-2 2-3.4 3.6-4.4l1.4 4.8Z\"/><circle class=\"k\" cx=\"-2.6\" cy=\"-10\" r=\"1.1\"/></g></g></svg>",
  energy: "<svg class=\"env-energy\" width=\"260\" height=\"156\" viewBox=\"0 0 260 156\" preserveAspectRatio=\"xMidYMax meet\" role=\"img\" aria-label=\"{{ENERGY_ALT}}\"><path class=\"w\" d=\"M-2 92H80L72 158H-2ZM262 92H180L188 158H262Z\"/><path class=\"l1\" d=\"M10 110l8 8M30 128l-5 9M52 108l5 10M200 112l7 8M228 126l-5 10M246 106l4 9\"/><g transform=\"translate(-2 92) scale(0.52)\"><g class=\"k\"><circle cx=\"54\" cy=\"-58\" r=\"5\"/><circle cx=\"61\" cy=\"-64\" r=\"6.5\"/><circle cx=\"71\" cy=\"-68\" r=\"8\"/><circle cx=\"84\" cy=\"-69\" r=\"9.5\"/><circle cx=\"98\" cy=\"-66\" r=\"8\"/><path d=\"M0 0C5-13 5-22 3-36H23C21-22 21-13 26 0Z\"/><rect x=\"28\" y=\"-24\" width=\"36\" height=\"24\"/><rect x=\"48\" y=\"-54\" width=\"8\" height=\"32\"/><path d=\"M66 0l9-10 5 4 4-3 8 9Z\"/></g><path d=\"M34-16h6v6h-6zM45-16h6v6h-6z\" fill=\"#fff\"/></g><rect class=\"w\" x=\"78\" y=\"92\" width=\"30\" height=\"9\"/><rect class=\"w\" x=\"152\" y=\"92\" width=\"30\" height=\"9\"/><path class=\"l1\" d=\"M78 114L100 101M182 114L160 101\"/><path class=\"dash\" style=\"stroke-width:1.2\" d=\"M108 92H152M108 101H152\"/><path class=\"l1 env-rope\" d=\"M130 0V8\"/><g class=\"env-piece\"><path class=\"l1\" d=\"M112 36L130 8L148 36\"/><rect class=\"w\" x=\"108\" y=\"36\" width=\"44\" height=\"9\"/><text class=\"cs\" x=\"119\" y=\"43.6\" style=\"font-size:8.5px\">$</text><text class=\"cs\" x=\"130\" y=\"43.6\" style=\"font-size:8.5px\">$</text><text class=\"cs\" x=\"141\" y=\"43.6\" style=\"font-size:8.5px\">$</text></g><path class=\"l env-arrow\" d=\"M130 54v24M125 72l5 6 5-6\"/><g transform=\"translate(60 74) scale(0.44)\"><circle cx=\"9\" cy=\"6\" r=\"5\" fill=\"#fff\" stroke=\"#111\" stroke-width=\"2.95\"/><path d=\"M3 15h12v13h-3v11H6V28H3z\" fill=\"#fff\" stroke=\"#111\" stroke-width=\"2.95\" stroke-linejoin=\"round\"/></g><g transform=\"translate(72 74) scale(0.44)\"><circle cx=\"9\" cy=\"6\" r=\"5\" fill=\"#fff\" stroke=\"#111\" stroke-width=\"2.95\"/><path d=\"M3 15h12v13h-3v11H6V28H3z\" fill=\"#fff\" stroke=\"#111\" stroke-width=\"2.95\" stroke-linejoin=\"round\"/></g><g transform=\"translate(84 74) scale(0.44)\"><circle cx=\"9\" cy=\"6\" r=\"5\" fill=\"#fff\" stroke=\"#111\" stroke-width=\"2.95\"/><path d=\"M3 15h12v13h-3v11H6V28H3z\" fill=\"#fff\" stroke=\"#111\" stroke-width=\"2.95\" stroke-linejoin=\"round\"/></g><g transform=\"translate(96 74) scale(0.44)\"><circle cx=\"9\" cy=\"6\" r=\"5\" fill=\"#fff\" stroke=\"#111\" stroke-width=\"2.95\"/><path d=\"M3 15h12v13h-3v11H6V28H3z\" fill=\"#fff\" stroke=\"#111\" stroke-width=\"2.95\" stroke-linejoin=\"round\"/></g><path class=\"l\" d=\"M252 22L257 22M247.9 31.9L251.4 35.4M238 36L238 41M228.1 31.9L224.6 35.4M224 22L219 22M228.1 12.1L224.6 8.6M238 8L238 3M247.9 12.1L251.4 8.6\"/><circle class=\"w\" cx=\"238\" cy=\"22\" r=\"10\"/><path class=\"w\" d=\"M199.8 92L201 48h2L204.2 92Z\"/><g transform=\"translate(202 48)\"><g class=\"spin\"><path class=\"w\" d=\"M0 0C2.6 -4.4 2.2 -14.3 0 -22C-1.3 -14.3 -1.8 -4.4 0 0Z\" transform=\"rotate(30)\"/><path class=\"w\" d=\"M0 0C2.6 -4.4 2.2 -14.3 0 -22C-1.3 -14.3 -1.8 -4.4 0 0Z\" transform=\"rotate(150)\"/><path class=\"w\" d=\"M0 0C2.6 -4.4 2.2 -14.3 0 -22C-1.3 -14.3 -1.8 -4.4 0 0Z\" transform=\"rotate(270)\"/></g><circle class=\"k\" r=\"2.3\"/></g><path class=\"l\" d=\"M226.5 84v7M241.8 84v7\"/><g transform=\"translate(218 66) skewX(-16)\"><rect class=\"w\" width=\"34\" height=\"18\"/><path class=\"l1\" d=\"M8.5 0v18M17 0v18M25.5 0v18M0 9h34\"/></g></svg>",
};
// END ENV PICTURES

  function fill(svg, words) {
    return svg.replace(/\{\{(\w+)\}\}/g, function(m, key) { return words[key] || ''; });
  }

  // Land: everything is dry at first; the green land pushes in from the right up to the middle.
  VIZ['land-restoration'] = function(ctx) {
    return {
      className: 'v-env',
      html: fill(ENV_PICTURES.land, {
        LAND_ALT: L(ctx, 'Ausgetrocknetes, rissiges Land mit totem Baum wird von rechts zu Land mit Feldern, Fluss und Bäumen',
          'Dry, cracked land with a dead tree turns, from the right, into land with fields, a river and trees'),
      }) + U.replay(ctx),
      mount: function(el) {
        var reveal = el.querySelector('.env-land-reveal');
        var divider = el.querySelector('.env-land-divider');
        U.playOnce(el, 2200, function(t) {
          var x = 262 - 132 * U.seg(t, 300, 2200);
          reveal.setAttribute('x', x.toFixed(1));
          divider.setAttribute('transform', 'translate(' + (x - 130).toFixed(1) + ' 0)');
        });
      },
    };
  };

  // Ocean: Germany and the garbage patch at the same scale (area 1 : 4.5).
  VIZ['ocean-cleanup'] = function(ctx) {
    return {
      className: 'v-env',
      html: '<p class="cause-affected-line">' +
          L(ctx, 'Der Müllteppich ist etwa 4,5-mal so groß wie Deutschland.', 'The garbage patch is about 4.5 times the size of Germany.') + '</p>' +
        fill(ENV_PICTURES.ocean, {
          OCEAN_ALT: L(ctx, 'Umriss von Deutschland neben dem Müllteppich im selben Maßstab. Der Müllteppich ist etwa viereinhalbmal so groß.',
            'Outline of Germany next to the garbage patch at the same scale. The garbage patch is about four and a half times as large.'),
          GERMANY: L(ctx, 'Deutschland', 'Germany'),
          PATCH: L(ctx, 'Müllteppich', 'Garbage patch'),
        }),
    };
  };

  // Forest: a tree falls once, the forest behind the 2030 barrier stays standing.
  VIZ['end-deforestation'] = function(ctx) {
    return {
      className: 'v-env',
      html: fill(ENV_PICTURES.forest, {
        FOREST_ALT: L(ctx, 'Links Baumstümpfe und ein fallender Baum, rechts dichter Tropenwald. Dazwischen eine Schranke mit der Aufschrift 2030.',
          'On the left tree stumps and a falling tree, on the right dense tropical forest. In between a barrier saying 2030.'),
      }) + U.replay(ctx),
      mount: function(el) {
        var tree = el.querySelector('.env-fall');
        var whoosh = el.querySelector('.env-whoosh');
        var bird = el.querySelector('.env-bird');
        U.playOnce(el, 2000, function(t) {
          var p = Math.max(0, Math.min(1, (t - 400) / 1000));
          var angle = -38 * p * p; // falls faster and faster
          tree.setAttribute('transform', 'rotate(' + angle.toFixed(2) + ' 106 132)');
          whoosh.style.opacity = p > 0.5 ? String(Math.min(1, (p - 0.5) * 2)) : '0';
          // The toucan leaves the falling tree and flies over the barrier into the forest.
          var q = U.seg(t, 500, 1900);
          var x = 106 + (170 - 106) * q;
          var y = (1 - q) * (1 - q) * 64 + 2 * (1 - q) * q * 22 + q * q * 54;
          var flap = q > 0 && q < 1 ? 1 - 0.25 * Math.abs(Math.sin(t / 60)) : 1;
          bird.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(1 ' + flap.toFixed(2) + ')');
        });
      },
    };
  };

  // Energy: the missing piece of the bridge, the money, is lowered into the gap.
  VIZ['energy-transition'] = function(ctx) {
    return {
      className: 'v-env',
      html: fill(ENV_PICTURES.energy, {
        ENERGY_ALT: L(ctx, 'Eine Brücke mit einer Lücke. Links ein Kohlekraftwerk und wartende Menschen, rechts Sonne, Windrad und Solarmodul. Das fehlende Brückenstück mit Dollarzeichen wird in die Lücke gesenkt.',
          'A bridge with a gap. On the left a coal power plant and people waiting, on the right sun, a wind turbine and a solar panel. The missing piece with dollar signs is lowered into the gap.'),
      }) + U.replay(ctx),
      mount: function(el) {
        var piece = el.querySelector('.env-piece');
        var rope = el.querySelector('.env-rope');
        var arrow = el.querySelector('.env-arrow');
        U.playOnce(el, 2000, function(t) {
          var dy = 56 * U.seg(t, 400, 1900);
          piece.setAttribute('transform', 'translate(0 ' + dy.toFixed(1) + ')');
          rope.setAttribute('d', 'M130 0V' + (8 + dy).toFixed(1));
          arrow.style.opacity = String(1 - U.seg(t, 0, 500));
        });
      },
    };
  };
})();
