// Sources page: lists every source used on the main page, built from the same data as the
// messages so it never goes out of date. German strings come from i18n_de.js when loaded.
(function() {
  var S = (window.i18n_data && window.i18n_data.strings) || {};
  var isDe = window.i18n_data && window.i18n_data.code === 'de';

  function t(key, fallback) {
    return S[key] !== undefined ? S[key] : fallback;
  }
  function ui(key, fallback) {
    return t('i18n-ui-' + key, fallback);
  }
  function fill(text, vars) {
    return text.replace(/\{(\w+)\}/g, function(_, k) { return vars[k] !== undefined ? vars[k] : '{' + k + '}'; });
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function plain(html) {
    var d = document.createElement('div');
    d.innerHTML = String(html || '').replace(/<br\s*\/?>/gi, ' ');
    return (d.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function host(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url; }
  }
  function shorten(text, max) {
    if (text.length <= max) return text;
    return text.slice(0, max - 1).replace(/\s+\S*$/, '') + ' …';
  }
  function fetchJson(path) {
    return fetch(path).then(function(r) {
      if (r.ok) return r.json();
      return fetch('../' + path).then(function(r2) {
        if (!r2.ok) throw new Error(path + ' not found');
        return r2.json();
      });
    });
  }
  // Links in a piece of message HTML, split into sources and organisation lists
  function linksIn(html) {
    var d = document.createElement('div');
    d.innerHTML = html || '';
    var out = { sources: [], orgs: [] };
    d.querySelectorAll('a[href]').forEach(function(a) {
      var href = a.getAttribute('href');
      if (!/^https?:/.test(href)) return;
      var li = a.closest('ul.orgs li');
      if (li) {
        var note = li.querySelector('span');
        out.orgs.push({ name: plain(a.innerHTML), url: href, note: note ? plain(note.innerHTML) : '' });
      } else {
        out.sources.push({ label: plain(a.innerHTML), url: href });
      }
    });
    return out;
  }
  function formatDate(iso) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return iso || '';
    if (isDe) return Number(p[2]) + '. ' + ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][Number(p[1]) - 1] + ' ' + p[0];
    return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][Number(p[1]) - 1] + ' ' + Number(p[2]) + ', ' + p[0];
  }
  function money(usd) {
    var tn = usd / 1e12;
    var n = tn.toLocaleString(isDe ? 'de-DE' : 'en-US', { maximumFractionDigits: 1 });
    return isDe ? n + ' Bio. $' : '$' + n + ' trillion';
  }

  function render(wealth, story) {
    var root = document.getElementById('sources');
    document.title = ui('sources-title', 'Sources') + ' · ' + document.title;
    var seen = {};
    var items = [];
    var orgs = [];
    story.comparisons.forEach(function(c) {
      var base = c.i18nKey || ('i18n-' + c.id);
      var titleHtml = t(base, c.title || c.text || '');
      var html = titleHtml + ' ' + t(base + '-desc', c.description || '');
      var found = linksIn(html);
      var list = [];
      if (c.sourceUrl) list.push({ label: t(base + '-source-name', c.sourceName || ''), url: c.sourceUrl });
      found.sources.forEach(function(l) { list.push(l); });
      list = list.filter(function(l) {
        if (seen[l.url + '|' + c.id]) return false;
        seen[l.url + '|' + c.id] = true;
        return true;
      });
      found.orgs.forEach(function(o) { orgs.push(o); });
      var calc = t(base + '-calc-note', c.calcNote || '');
      if (list.length) items.push({ title: shorten(plain(titleHtml), 90), links: list, calc: calc });
    });

    var forbes = '<a href="' + esc(wealth.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(wealth.source) + '</a>';
    var html = '<a class="sources-back" href="./">‹ ' + esc(ui('sources-back', 'Back to the page')) + '</a>' +
      '<h1>' + esc(ui('sources-title', 'Sources')) + '</h1>' +
      '<section class="sources-wealth"><h2>' + esc(ui('sources-wealth', 'Wealth')) + '</h2><p>' +
      fill(ui('sources-wealth-text', '{source}, as of {date}. {count} billionaires, together {total}.'), {
        source: forbes,
        date: formatDate(wealth.snapshotDate),
        count: Number(wealth.allBillionairesCount).toLocaleString(isDe ? 'de-DE' : 'en-US'),
        total: money(Number(wealth.allBillionairesTotalUsd))
      }) + '</p></section>' +
      '<h2 class="sources-h">' + esc(ui('sources-messages', 'Evidence for the messages')) + '</h2><ol class="sources-list">' +
      items.map(function(i) {
        return '<li><span class="sources-msg">' + esc(i.title) + '</span>' + i.links.map(function(l) {
          // Many links in the text carry only a number; the site name says what it is.
          var label = /[A-Za-zÄÖÜäöü]{3}/.test(l.label) ? l.label : host(l.url);
          var site = label === host(l.url) ? '' : ' <span class="sources-host">' + esc(host(l.url)) + '</span>';
          return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + '</a>' + site;
        }).join('<br>') +
          (i.calc ? '<p class="sources-calc"><b>' + esc(ui('sources-calc', 'Calculation')) + ':</b> ' + esc(i.calc) + '</p>' : '') +
          '</li>';
      }).join('') + '</ol>';
    if (orgs.length) {
      html += '<h2 class="sources-h">' + esc(ui('sources-orgs', 'Organisations named on the page (not sources)')) + '</h2><ul class="sources-list">' +
        orgs.map(function(o) {
          return '<li><a href="' + esc(o.url) + '" target="_blank" rel="noopener noreferrer">' + esc(o.name) + '</a>' + (o.note ? ' <span class="sources-host">' + esc(o.note) + '</span>' : '') + '</li>';
        }).join('') + '</ul>';
    }
    root.innerHTML = html;
  }

  Promise.all([fetchJson('data/billionaires.json'), fetchJson('data/story.json')])
    .then(function(r) { render(r[0], r[1]); })
    .catch(function(e) { console.warn('Could not load sources:', e); });
})();
