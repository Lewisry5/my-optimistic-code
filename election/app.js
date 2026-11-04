/* New England Election Map — renders election/data/*.json with d3 + topojson.
 * Data files:
 *   geo.topo.json        boundaries (objects: states, counties, cd, sldu, sldl)
 *   officeholders.json   who holds every seat right now (pre-election)
 *   results.json         2026 results; re-fetched every POLL_MS so the map updates live
 */
(() => {
  'use strict';

  const DATA = 'election/data/';
  const POLL_MS = 90 * 1000;

  const STATES = [
    { st: 'ME', name: 'Maine', fips: '23' },
    { st: 'NH', name: 'New Hampshire', fips: '33' },
    { st: 'VT', name: 'Vermont', fips: '50' },
    { st: 'MA', name: 'Massachusetts', fips: '25' },
    { st: 'RI', name: 'Rhode Island', fips: '44' },
    { st: 'CT', name: 'Connecticut', fips: '09' },
  ];
  const ST = Object.fromEntries(STATES.map(s => [s.st, s]));
  const FIPS2ST = Object.fromEntries(STATES.map(s => [s.fips, s.st]));

  const OFFICES = [
    { key: 'gov', label: 'Governor', layer: 'counties', statewide: true },
    { key: 'ussen', label: 'U.S. Senate', layer: 'counties', statewide: true },
    { key: 'ushouse', label: 'U.S. House', layer: 'cd', unit: 'district' },
    { key: 'stsen', label: 'State Senate', layer: 'sldu', unit: 'district' },
    { key: 'sthouse', label: 'State House', layer: 'sldl', unit: 'district' },
    { key: 'ltgov', label: 'Lt. Governor', layer: 'counties', statewide: true },
    { key: 'ag', label: 'Attorney General', layer: 'counties', statewide: true },
    { key: 'sos', label: 'Secretary of State', layer: 'counties', statewide: true },
    { key: 'treas', label: 'Treasurer', layer: 'counties', statewide: true },
    { key: 'auditor', label: 'Auditor', layer: 'counties', statewide: true },
    { key: 'comptroller', label: 'Comptroller', layer: 'counties', statewide: true },
    { key: 'execcouncil', label: 'Exec. Council', layer: 'council', unit: 'district', altKeys: ['govcouncil'] },
  ];
  const OFF = Object.fromEntries(OFFICES.map(o => [o.key, o]));

  // Offices that do not exist (as an elected/held statewide post) in a state.
  const NO_OFFICE = {
    ltgov: { ME: 'Maine has no lieutenant governor (Senate President is next in line).', NH: 'New Hampshire has no lieutenant governor (Senate President is next in line).' },
    comptroller: { ME: 'No elected comptroller in Maine.', NH: 'No elected comptroller in New Hampshire.', VT: 'No elected comptroller in Vermont.', MA: 'Massachusetts’ comptroller is appointed, not elected.', RI: 'No elected comptroller in Rhode Island.' },
    execcouncil: { ME: 'Maine has no executive council.', VT: 'Vermont has no executive council.', CT: 'Connecticut has no executive council.', RI: 'Rhode Island has no executive council.' },
  };

  const PARTY = {
    D: { name: 'Democrat', color: '#3b7ddd' },
    R: { name: 'Republican', color: '#e0483f' },
    I: { name: 'Independent', color: '#d9a21b' },
    P: { name: 'Progressive', color: '#9b6ad6' },
    O: { name: 'Other', color: '#8a93a6' },
    V: { name: 'Vacant', color: '#4a5368' },
  };
  const NONE = '#232c40';
  const TINT = '#dfe4ee';

  function pk(p) {
    if (!p) return 'O';
    const s = String(p).trim().toLowerCase();
    if (/^(d|dem|democrat|democratic|dp|d\/p|democrat\/progressive|democratic\/progressive)$/.test(s)) return 'D';
    if (/^(r|rep|republican|gop|rd|r\/d|republican\/democrat)$/.test(s)) return 'R';
    if (/^(p|prog|progressive|pd|p\/d|progressive\/democrat|progressive\/democratic)$/.test(s)) return 'P';
    if (/^(i|ind|independent|u|unaffiliated|unenrolled|nonpartisan|forward)$/.test(s)) return 'I';
    if (/^(v|vacant|vacancy)$/.test(s)) return 'V';
    if (s.startsWith('democrat')) return 'D';
    if (s.startsWith('republican')) return 'R';
    if (s.startsWith('progressive')) return 'P';
    if (s.startsWith('independent')) return 'I';
    return 'O';
  }
  const pcolor = p => (PARTY[p] || PARTY.O).color;
  const pname = p => (PARTY[p] || PARTY.O).name;

  /* ---------- district-name canonicalisation (joins data to shapes) ---------- */
  function canon(s) {
    let x = String(s ?? '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
    x = x.replace(/&/g, ' and ');
    x = x.replace(/\b(state|house|senate|senatorial|representatives?|assembly|legislative|congressional|district|dist|no)\b\.?/g, ' ');
    x = x.replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
    x = x.replace(/\b0+(\d)/g, '$1');
    if (/^(at large|al|0|00)$/.test(x)) x = 'al';
    return x;
  }

  /* ---------- state ---------- */
  const S = {
    office: 'gov', mode: 'results', countyLines: true, marginShade: true,
    topo: null, layers: {}, holders: null, results: null, resultsStamp: null,
    hIdx: null, rIdx: null, chambers: {}, selected: null, k: 1,
    lastCheck: null, lastOk: true,
  };

  /* ---------- DOM ---------- */
  const $ = sel => document.querySelector(sel);
  const svg = d3.select('#map');
  const gRoot = svg.append('g');
  const defs = svg.append('defs');
  const gFill = gRoot.append('g');
  const gCounty = gRoot.append('g');
  const gState = gRoot.append('g');
  const gLabel = gRoot.append('g');
  const tip = $('#tip');
  let projection, path, width = 800, height = 600;

  const zoom = d3.zoom().scaleExtent([1, 60]).on('zoom', ev => {
    gRoot.attr('transform', ev.transform);
    S.k = ev.transform.k;
    gLabel.selectAll('text').attr('font-size', 13 / S.k).attr('stroke-width', 3 / S.k);
    defs.selectAll('pattern').attr('patternTransform', `rotate(45) scale(${1 / S.k})`);
  });
  svg.call(zoom).on('dblclick.zoom', null);

  /* ---------- loading ---------- */
  async function getJSON(name, bust) {
    const r = await fetch(DATA + name + (bust ? `?t=${Date.now()}` : ''), { cache: bust ? 'no-store' : 'default' });
    if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
    return r.json();
  }

  async function init() {
    readHash();
    buildControls();
    try {
      const [topo, holders] = await Promise.all([getJSON('geo.topo.json'), getJSON('officeholders.json').catch(() => ({ seats: [] }))]);
      S.topo = topo;
      for (const name of Object.keys(topo.objects)) {
        const fc = topojson.feature(topo, topo.objects[name]);
        fc.features = fc.features.filter(f => f.properties && ST[f.properties.st || FIPS2ST[String(f.properties.id).slice(0, 2)]]);
        fc.features.forEach(f => { f.properties.st = f.properties.st || FIPS2ST[String(f.properties.id).slice(0, 2)]; });
        S.layers[name] = { fc, byId: new Map(fc.features.map(f => [f.properties.id, f])), byKey: buildKeyIndex(fc.features) };
      }
      S.holders = holders;
      S.hIdx = indexSeats(holders.seats || [], 'holder');
    } catch (e) {
      $('#loading').textContent = 'Could not load map data (' + e.message + ').';
      return;
    }
    await loadResults(true);
    $('#loading').hidden = true;
    fit();
    renderAll();
    new ResizeObserver(() => { fit(); renderPaths(); }).observe($('.mapwrap'));
    setInterval(() => loadResults(false), POLL_MS);
    setInterval(updateLive, 15 * 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) loadResults(false); });
  }

  async function loadResults(first) {
    S.lastCheck = new Date();
    try {
      const res = await getJSON('results.json', true);
      S.lastOk = true;
      const stamp = res.updated || JSON.stringify(res).length;
      if (stamp !== S.resultsStamp) {
        S.results = res;
        S.resultsStamp = stamp;
        S.rIdx = indexSeats(res.races || [], 'race');
        S.chambers = {};
        for (const c of res.chambers || []) S.chambers[`${c.st}|${c.office}`] = c;
        if (!first) renderAll();
      }
    } catch (e) {
      S.lastOk = false;
      if (first) { S.results = { races: [] }; S.rIdx = indexSeats([], 'race'); }
    }
    updateLive();
  }

  function updateLive() {
    const el = $('#live'), t = $('#liveText');
    el.classList.toggle('ok', S.lastOk);
    el.classList.toggle('err', !S.lastOk);
    const upd = S.results && S.results.updated ? new Date(S.results.updated) : null;
    const fmt = d => d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    if (!S.lastOk) t.textContent = 'Results feed unreachable — retrying';
    else t.textContent = upd && !isNaN(upd) ? `Live · results as of ${fmt(upd)}` : 'Live · awaiting results';
    el.title = `Results file re-checked every ${POLL_MS / 1000}s` + (S.lastCheck ? ` · last check ${S.lastCheck.toLocaleTimeString()}` : '');
  }

  /* ---------- indexing ---------- */
  function buildKeyIndex(features) {
    const m = new Map();
    for (const f of features) {
      const p = f.properties, st = p.st;
      const raw = String(p.id || '');
      const keys = [p.num, p.name, p.namelsad, raw.startsWith(st + '-') ? raw.slice(st.length + 1) : null, ...(p.aliases || [])];
      for (const k of keys) {
        if (k == null || k === '') continue;
        const c = canon(k);
        if (c && !m.has(`${st}|${c}`)) m.set(`${st}|${c}`, f);
      }
    }
    return m;
  }

  function officeOf(code) {
    const c = String(code || '').toLowerCase();
    for (const o of OFFICES) if (o.key === c || (o.altKeys || []).includes(c)) return o.key;
    return c;
  }

  function resolveFeature(officeKey, st, district, geoId) {
    const o = OFF[officeKey];
    const layer = S.layers[o.layer];
    if (!layer) return null;
    if (geoId && layer.byId.has(geoId)) return layer.byId.get(geoId);
    if (district == null) return null;
    const tries = [district, String(district).replace(/^.*?district\s*/i, '')];
    for (const d of tries) {
      const f = layer.byKey.get(`${st}|${canon(d)}`);
      if (f) return f;
    }
    if (officeKey === 'ushouse') return layer.byId.get(`${st}-${canon(district) === 'al' ? 'AL' : canon(district)}`) || null;
    return null;
  }

  // Index seat-like records (officeholders or races) by statewide key or by map feature.
  function indexSeats(list, kind) {
    const idx = { st: {}, geo: {}, unmatched: {}, all: {} };
    for (const rec of list) {
      const office = officeOf(rec.office);
      const o = OFF[office];
      if (!o || !ST[rec.st]) continue;
      ((idx.all[office] ||= {})[rec.st] ||= []).push(rec);
      if (o.statewide || !S.layers[o.layer]) {
        ((idx.st[office] ||= {})[rec.st] ||= []).push(rec);
        continue;
      }
      const f = resolveFeature(office, rec.st, rec.district, rec.geo);
      if (f) ((idx.geo[office] ||= {})[f.properties.id] ||= []).push(rec);
      else ((idx.unmatched[office] ||= {})[rec.st] ||= []).push(rec);
    }
    return idx;
  }

  /* ---------- outcome logic ---------- */
  const share = c => (c.votes != null ? +c.votes : c.pct != null ? +c.pct : 0);

  function rankCands(cands) {
    return [...(cands || [])].sort((a, b) => (b.winner === true) - (a.winner === true) || share(b) - share(a));
  }

  function raceTotal(cands) {
    if (cands.some(c => c.votes != null)) return d3.sum(cands, c => +c.votes || 0);
    if (cands.some(c => c.pct != null)) return 100;
    return 0;
  }

  function pctOf(c, cands) {
    if (c.pct != null) return +c.pct;
    const t = raceTotal(cands);
    return t && c.votes != null ? (100 * c.votes) / t : null;
  }

  // Returns {parties:[...], called, margin} or null when no usable numbers/calls yet.
  function outcome(race, seats) {
    if (!race) return null;
    const cands = race.candidates || [];
    if (!cands.length) return null;
    const n = Math.max(1, race.seats || seats || 1);
    const ranked = rankCands(cands);
    const winners = ranked.filter(c => c.winner);
    const hasNums = cands.some(c => share(c) > 0);
    if (!winners.length && !hasNums) return null;
    const top = winners.length ? winners : ranked.slice(0, n);
    let margin = null;
    if (hasNums && ranked.length > n) {
      const a = pctOf(ranked[n - 1], cands), b = pctOf(ranked[n], cands);
      if (a != null && b != null) margin = a - b;
    } else if (hasNums && ranked.length <= n) margin = 100;
    return { parties: top.map(c => pk(c.party)), called: !!(race.called || winners.length), margin };
  }

  function countyOutcome(race, fips) {
    const rows = race && race.counties && race.counties[fips];
    if (!rows || !rows.length) return null;
    const r = [...rows].sort((a, b) => share(b) - share(a));
    const t = d3.sum(r, share);
    if (!t) return null;
    return { parties: [pk(r[0].party)], called: false, margin: r.length > 1 ? (100 * (share(r[0]) - share(r[1]))) / t : 100, county: true, rows: r, total: t };
  }

  function composition(parties) {
    const c = d3.rollup(parties, v => v.length, p => p);
    return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }

  function shade(color, margin) {
    if (!S.marginShade || margin == null) return color;
    const t = 0.38 + 0.62 * Math.min(Math.max(margin, 0) / 30, 1);
    return d3.interpolateRgb(TINT, color)(t);
  }

  function pattern(comp, style) {
    const id = `pat-${style}-${comp.map(([p, n]) => p + n).join('_')}`;
    if (defs.select('#' + id).empty()) {
      const W = 10;
      const pat = defs.append('pattern').attr('id', id).attr('patternUnits', 'userSpaceOnUse')
        .attr('width', W).attr('height', W).attr('patternTransform', `rotate(45) scale(${1 / S.k})`);
      if (style === 'notup') {
        pat.append('rect').attr('width', W).attr('height', W).attr('fill', '#1d263a');
        const sw = W / comp.length;
        comp.forEach(([p], i) => pat.append('rect').attr('x', i * sw).attr('width', Math.max(2.2, sw * 0.5)).attr('height', W).attr('fill', pcolor(p)));
      } else {
        const tot = d3.sum(comp, d => d[1]);
        let x = 0;
        for (const [p, n] of comp) {
          const w = (W * n) / tot;
          pat.append('rect').attr('x', x).attr('width', w + 0.05).attr('height', W).attr('fill', pcolor(p));
          x += w;
        }
      }
    }
    return `url(#${id})`;
  }

  function fillFor(comp, style, margin) {
    if (!comp.length) return NONE;
    if (comp.length === 1 && style !== 'notup') return shade(pcolor(comp[0][0]), margin);
    return pattern(comp, style);
  }

  // Everything known about one map feature for the current office.
  function assess(f) {
    const o = OFF[S.office];
    const st = f.properties.st;
    const statewide = o.statewide || !S.layers[o.layer];
    const keyAll = o.altKeys ? [o.key, ...o.altKeys] : [o.key];
    const holders = statewide ? (S.hIdx.st[S.office] || {})[st] || [] : (S.hIdx.geo[S.office] || {})[f.properties.id] || [];
    const races = statewide ? (S.rIdx.st[S.office] || {})[st] || [] : (S.rIdx.geo[S.office] || {})[f.properties.id] || [];
    const noOffice = !holders.length && !races.length && NO_OFFICE[S.office] && NO_OFFICE[S.office][st];
    const raceUp = races.length > 0;
    const upHolders = holders.filter(h => h.upIn2026 !== false);
    const notUp = !raceUp && holders.length > 0 && upHolders.length === 0;

    let out = null;
    if (raceUp) {
      if (o.statewide && f.properties.id && /^\d{5}$/.test(f.properties.id)) {
        for (const r of races) { out = countyOutcome(r, f.properties.id); if (out) { out.race = r; break; } }
      }
      if (!out) {
        const parts = [];
        let called = true, margin = null, any = false;
        for (const r of races) {
          const oc = outcome(r, statewide ? 1 : upHolders.length || 1);
          if (oc) { any = true; parts.push(...oc.parties); called = called && oc.called; margin = margin == null ? oc.margin : Math.min(margin, oc.margin ?? margin); }
        }
        // Statewide offices with seats not up (e.g. the other U.S. senator) keep that holder in the mix.
        if (any) {
          if (statewide && S.office === 'ussen') holders.filter(h => h.upIn2026 === false).forEach(h => parts.push(pk(h.party)));
          out = { parties: parts, called, margin: parts.length > 1 ? null : margin };
        }
      }
    }
    return { o, st, holders, races, noOffice, notUp, out, statewide };
  }

  function styleFor(a) {
    if (a.noOffice) return { fill: NONE, opacity: 1 };
    const hComp = composition(a.holders.map(h => pk(h.party)));
    if (S.mode === 'holders') return { fill: fillFor(hComp, 'split'), opacity: hComp.length ? 1 : 0.35 };
    if (a.out) return { fill: fillFor(composition(a.out.parties), 'split', a.out.margin), opacity: a.out.called ? 1 : 0.62 };
    if (a.notUp) return { fill: fillFor(hComp, 'notup'), opacity: 1 };
    if (hComp.length) return { fill: fillFor(hComp, 'split'), opacity: 0.22 };
    return { fill: NONE, opacity: 1 };
  }

  /* ---------- rendering ---------- */
  function fit() {
    const box = $('.mapwrap').getBoundingClientRect();
    width = Math.max(300, box.width);
    height = Math.max(300, box.height);
    svg.attr('viewBox', `0 0 ${width} ${height}`);
    const states = S.layers.states ? S.layers.states.fc : S.layers.counties.fc;
    const pad = Math.min(30, width * 0.04);
    projection = d3.geoConicConformal().parallels([41, 45]).rotate([71.4, 0])
      .fitExtent([[pad, pad], [width - pad - (width > 700 ? 120 : 0), height - pad]], states);
    path = d3.geoPath(projection);
  }

  function currentLayer() {
    const o = OFF[S.office];
    return S.layers[o.layer] || S.layers.counties;
  }

  function renderAll() {
    renderChips();
    renderMap();
    renderLegend();
    renderSidebar();
    writeHash();
  }

  function renderMap() {
    const layer = currentLayer();
    const feats = layer.fc.features;
    const sel = gFill.selectAll('path.feat').data(feats, d => S.office + '|' + d.properties.id);
    sel.exit().remove();
    const all = sel.enter().append('path').attr('class', 'feat')
      .on('mousemove', onHover).on('mouseleave', () => { tip.hidden = true; })
      .on('click', (ev, d) => { ev.stopPropagation(); select(d); })
      .merge(sel);
    all.each(function (d) {
      const a = assess(d);
      d.__a = a;
      const s = styleFor(a);
      d3.select(this).attr('fill', s.fill).attr('fill-opacity', s.opacity)
        .classed('sel', S.selected === d.properties.id);
    });
    if (!gState.selectAll('path').size()) {
      if (S.layers.counties) gCounty.selectAll('path').data(S.layers.counties.fc.features).enter().append('path').attr('class', 'county-line');
      const stFeats = S.layers.states ? S.layers.states.fc.features : [];
      gState.selectAll('path').data(stFeats).enter().append('path').attr('class', 'state-line');
      gLabel.selectAll('text').data(stFeats).enter().append('text').attr('class', 'state-label').attr('text-anchor', 'middle').text(d => d.properties.st);
    }
    gCounty.style('display', S.countyLines && OFF[S.office].layer !== 'counties' ? null : 'none');
    renderPaths();
  }

  function renderPaths() {
    if (!path) return;
    gFill.selectAll('path.feat').attr('d', path);
    gCounty.selectAll('path').attr('d', path);
    gState.selectAll('path').attr('d', path);
    const nudge = { MA: [0, -0.15], RI: [0.12, 0], NH: [0, 0.12], CT: [0, 0], VT: [0, 0], ME: [0, 0] };
    gLabel.selectAll('text').attr('transform', d => {
      const [x, y] = path.centroid(d);
      const b = path.bounds(d), n = nudge[d.properties.st] || [0, 0];
      return `translate(${x + n[0] * (b[1][0] - b[0][0])},${y + n[1] * (b[1][1] - b[0][1])})`;
    }).attr('font-size', 13 / S.k).attr('stroke-width', 3 / S.k);
  }

  function renderChips() {
    const wrap = d3.select('#officeChips');
    const c = wrap.selectAll('button').data(OFFICES, d => d.key);
    c.enter().append('button').attr('type', 'button').attr('class', 'chip').attr('role', 'tab')
      .on('click', (ev, d) => { S.office = d.key; S.selected = null; $('#detail').hidden = true; renderAll(); })
      .merge(c)
      .classed('on', d => d.key === S.office).attr('aria-selected', d => d.key === S.office)
      .text(d => d.label);
  }

  function buildControls() {
    document.querySelectorAll('.seg [data-mode]').forEach(b => b.addEventListener('click', () => {
      S.mode = b.dataset.mode;
      document.querySelectorAll('.seg [data-mode]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
      renderAll();
    }));
    document.querySelectorAll('.seg [data-mode]').forEach(x => { x.classList.toggle('on', x.dataset.mode === S.mode); x.setAttribute('aria-checked', x.dataset.mode === S.mode); });
    const sb = d3.select('#stateBtns');
    sb.append('button').attr('type', 'button').text('All').on('click', () => zoomTo(null));
    STATES.forEach(s => sb.append('button').attr('type', 'button').text(s.st).attr('title', s.name).on('click', () => zoomTo(s.st)));
    $('#countyLines').checked = S.countyLines;
    $('#marginShade').checked = S.marginShade;
    $('#countyLines').addEventListener('change', e => { S.countyLines = e.target.checked; renderMap(); });
    $('#marginShade').addEventListener('change', e => { S.marginShade = e.target.checked; renderMap(); renderLegend(); });
    svg.on('click', () => { S.selected = null; $('#detail').hidden = true; gFill.selectAll('path.feat').classed('sel', false); });
  }

  function zoomTo(st) {
    d3.selectAll('#stateBtns button').classed('on', function () { return this.textContent === (st || 'All'); });
    if (!st || !S.layers.states) {
      svg.transition().duration(650).call(zoom.transform, d3.zoomIdentity);
      return;
    }
    const f = S.layers.states.fc.features.find(x => x.properties.st === st);
    const [[x0, y0], [x1, y1]] = path.bounds(f);
    const k = Math.min(40, 0.88 / Math.max((x1 - x0) / width, (y1 - y0) / height));
    const t = d3.zoomIdentity.translate(width / 2, height / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    svg.transition().duration(750).call(zoom.transform, t);
  }

  /* ---------- legend ---------- */
  function renderLegend() {
    const L = d3.select('#legend').html('');
    const o = OFF[S.office];
    L.append('div').attr('class', 'lt').text(`${o.label} · ${S.mode === 'results' ? '2026 results' : 'current officeholders'}`);
    const item = (sw, label) => { const r = L.append('div').attr('class', 'li'); r.append('span').attr('class', 'sw').style('background', sw); r.append('span').text(label); };
    ['D', 'R', 'I', 'P'].forEach(p => item(pcolor(p), pname(p)));
    if (S.mode === 'results') {
      if (S.marginShade) {
        const r = L.append('div').attr('class', 'ramp');
        r.append('span').text('Close');
        r.append('span').attr('class', 'bar').style('background', `linear-gradient(90deg, ${shade(pcolor('D'), 0)}, ${pcolor('D')})`);
        r.append('span').attr('class', 'bar').style('background', `linear-gradient(90deg, ${shade(pcolor('R'), 0)}, ${pcolor('R')})`);
        r.append('span').text('Safe');
      }
      item(`${pcolor('D')}9e`, 'Faded = leading, not yet called');
      item(`repeating-linear-gradient(45deg, ${pcolor('R')} 0 3px, #1d263a 3px 8px)`, 'Hatched = not on 2026 ballot (current holder)');
      item(`${pcolor('D')}38`, 'Very faint = awaiting results (current holder)');
    }
    item(`repeating-linear-gradient(45deg, ${pcolor('D')} 0 5px, ${pcolor('R')} 5px 10px)`, 'Striped = split seats / delegation');
    item(NONE, 'No such office / no data');
  }

  /* ---------- tooltip & detail ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const chip = p => `<span class="pchip" style="background:${pcolor(p)}">${p}</span>`;
  const fmtN = n => (n == null ? '' : d3.format(',')(n));
  const fmtP = n => (n == null ? '' : `${(+n).toFixed(1)}%`);

  function featTitle(f) {
    const p = f.properties, o = OFF[S.office];
    if (o.statewide || !S.layers[o.layer]) return `${p.name || p.id}${ST[p.st] ? ', ' + p.st : ''}`;
    if (S.office === 'ushouse') return `${ST[p.st].name} ${String(p.id).endsWith('AL') ? 'at-large' : 'District ' + (p.num || String(p.id).split('-')[1])}`;
    return `${ST[p.st].name} ${o.label} · ${p.name || p.num || p.id}`;
  }

  function holdersHTML(holders, compact) {
    if (!holders.length) return '<div class="empty">No officeholder data for this seat.</div>';
    const list = compact && holders.length > 4 ? holders.slice(0, 4) : holders;
    let h = list.map(x => `<div class="holder">${chip(pk(x.party))}<span>${esc(x.name || 'Vacant')}</span><span class="role">${esc(x.seat || '')}${x.elected === false ? ' (not popularly elected)' : ''}${x.upIn2026 === false ? ' · not up in 2026' : ''}</span></div>`).join('');
    if (list.length < holders.length) h += `<div class="empty">+${holders.length - list.length} more</div>`;
    return h;
  }

  function raceHTML(race, compact) {
    const cands = rankCands(race.candidates || []);
    if (!cands.length) return `<div class="status">${race.status === 'no-data' ? 'Results not in yet.' : 'No candidate data yet.'}</div>`;
    const list = compact ? cands.slice(0, 3) : cands;
    const maxP = d3.max(cands, c => pctOf(c, cands)) || 1;
    let h = list.map(c => {
      const p = pctOf(c, cands);
      return `<div class="cand"><div class="top"><span class="nm">${chip(pk(c.party))}<span class="t">${esc(c.name)}</span>${c.incumbent ? '<span class="inc">inc.</span>' : ''}${c.winner ? '<span class="win">✓ WON</span>' : ''}</span><span class="v">${fmtP(p)}${c.votes != null && !compact ? ' · ' + fmtN(c.votes) : ''}</span></div>${p != null ? `<div class="track"><div class="fill" style="width:${(100 * p) / Math.max(maxP, 50)}%;background:${pcolor(pk(c.party))}"></div></div>` : ''}</div>`;
    }).join('');
    const bits = [];
    if (race.reportingPct != null) bits.push(`${race.reportingPct}% reporting`);
    if (race.called || cands.some(c => c.winner)) bits.push(`<span class="pill called">Called${race.calledBy ? ' · ' + esc(race.calledBy) : ''}</span>`);
    else if (cands.some(c => share(c) > 0)) bits.push('<span class="pill">Not called</span>');
    if (!compact && race.asOf) bits.push(`as of ${esc(race.asOf)}`);
    if (bits.length) h += `<div class="status">${bits.join(' · ')}</div>`;
    if (!compact && race.sources && race.sources.length) h += `<div class="status">Source: ${race.sources.slice(0, 3).map((u, i) => `<a href="${esc(u)}" target="_blank" rel="noopener">${i + 1}</a>`).join(' ')}</div>`;
    return h;
  }

  function featureBody(a, f, compact) {
    if (a.noOffice) return `<div class="empty">${esc(a.noOffice)}</div>`;
    let h = '';
    if (a.out && a.out.county) {
      const r = a.out.rows;
      h += `<div class="sublabel">${esc(f.properties.name)} — county vote</div>` + r.slice(0, 3).map(x => `<div class="holder">${chip(pk(x.party))}<span>${esc(x.name || pname(pk(x.party)))}</span><span class="role">${fmtP((100 * share(x)) / a.out.total)}${x.votes != null ? ' · ' + fmtN(x.votes) : ''}</span></div>`).join('');
    }
    if (a.races.length) {
      h += `<div class="sublabel">2026 race${a.statewide ? ' — statewide' : ''}</div>`;
      h += a.races.map(r => raceHTML(r, compact)).join('');
    } else if (!a.notUp && a.holders.length) {
      h += `<div class="sublabel">2026 race</div><div class="status">No results reported yet.</div>`;
    }
    h += `<div class="sublabel">${a.notUp ? 'Current holder · not on 2026 ballot' : 'Officeholder before the election'}</div>` + holdersHTML(a.holders, compact);
    return h;
  }

  function onHover(ev, f) {
    const a = f.__a || assess(f);
    tip.innerHTML = `<h4>${esc(featTitle(f))}</h4>` + featureBody(a, f, true);
    tip.hidden = false;
    const box = $('.mapwrap').getBoundingClientRect();
    let x = ev.clientX - box.left + 14, y = ev.clientY - box.top + 14;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    if (x + tw > box.width - 6) x = ev.clientX - box.left - tw - 14;
    if (y + th > box.height - 6) y = Math.max(6, box.height - th - 6);
    tip.style.left = `${Math.max(6, x)}px`;
    tip.style.top = `${y}px`;
  }

  function select(f) {
    S.selected = f.properties.id;
    gFill.selectAll('path.feat').classed('sel', d => d.properties.id === S.selected);
    const a = assess(f);
    const d = $('#detail');
    d.innerHTML = `<button class="x" aria-label="Close">×</button><h3>${esc(featTitle(f))}</h3><div class="meta">${esc(OFF[S.office].label)}</div>` + featureBody(a, f, false);
    d.hidden = false;
    d.querySelector('.x').onclick = () => { d.hidden = true; S.selected = null; gFill.selectAll('path.feat').classed('sel', false); };
    d.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  /* ---------- sidebar ---------- */
  function seatBar(comp, total) {
    if (!total) return '';
    const bar = comp.map(([p, n]) => `<div style="width:${(100 * n) / total}%;background:${pcolor(p)}" title="${pname(p)}: ${n}"></div>`).join('');
    const leg = comp.map(([p, n]) => `<span><i style="background:${pcolor(p)}"></i>${pname(p)} ${n}</span>`).join('');
    return `<div class="seatbar">${bar}</div><div class="seatleg">${leg}</div>`;
  }

  function districtTallies(st) {
    const o = OFF[S.office];
    const holders = ((S.hIdx.all[S.office] || {})[st]) || [];
    const races = ((S.rIdx.all[S.office] || {})[st]) || [];
    const won = [], lead = [];
    let pending = 0;
    for (const r of races) {
      const oc = outcome(r, r.seats || 1);
      if (!oc) { pending++; continue; }
      (oc.called ? won : lead).push(...oc.parties);
    }
    const unmatched = (((S.hIdx.unmatched[S.office] || {})[st]) || []).length;
    return { o, holders, races, won, lead, pending, unmatched };
  }

  function renderSidebar() {
    const o = OFF[S.office];
    // Region summary
    const rs = d3.select('#regionSummary');
    let h = `<h3>${esc(o.label)} <span class="k">All New England</span></h3>`;
    const allH = STATES.flatMap(s => ((S.hIdx.all[S.office] || {})[s.st]) || []);
    if (o.statewide) {
      const comp = composition(allH.map(x => pk(x.party)));
      h += `<div class="meta">Current holders across the six states${S.office === 'ussen' ? ' (12 seats)' : ''}</div>` + seatBar(comp, allH.length);
      const races = STATES.flatMap(s => ((S.rIdx.st[S.office] || {})[s.st]) || []);
      const won = [], lead = [];
      races.forEach(r => { const oc = outcome(r, 1); if (oc) (oc.called ? won : lead).push(...oc.parties); });
      if (races.length) h += `<div class="sublabel">2026: ${races.length} race${races.length > 1 ? 's' : ''} on the ballot</div>` + (won.length ? `<div class="meta">Called</div>` + seatBar(composition(won), won.length) : '') + (lead.length ? `<div class="meta">Leading, not called</div>` + seatBar(composition(lead), lead.length) : '') + (!won.length && !lead.length ? '<div class="empty">No results reported yet.</div>' : '');
    } else {
      const comp = composition(allH.map(x => pk(x.party)));
      h += `<div class="meta">${allH.length} seats · party of current holders</div>` + seatBar(comp, allH.length);
      const T = STATES.map(s => districtTallies(s.st));
      const won = T.flatMap(t => t.won), lead = T.flatMap(t => t.lead);
      h += `<div class="sublabel">2026 results</div>`;
      h += won.length ? `<div class="meta">Seats called</div>` + seatBar(composition(won), won.length) : '';
      h += lead.length ? `<div class="meta">Leading, not called</div>` + seatBar(composition(lead), lead.length) : '';
      if (!won.length && !lead.length) h += '<div class="empty">No district results reported yet.</div>';
    }
    rs.html(h);

    // Per-state cards
    const cards = d3.select('#stateCards').selectAll('div.state-card').data(STATES, d => d.st);
    cards.enter().append('div').attr('class', 'card state-card').on('click', (ev, d) => { if (!ev.target.closest('a')) zoomTo(d.st); })
      .merge(cards).html(d => stateCardHTML(d));
  }

  function stateCardHTML(s) {
    const o = OFF[S.office];
    let h = `<h3>${esc(s.name)} <span class="k">${esc(o.label)}</span></h3>`;
    const no = NO_OFFICE[S.office] && NO_OFFICE[S.office][s.st];
    if (o.statewide || !S.layers[o.layer]) {
      const holders = ((S.hIdx.st[S.office] || {})[s.st]) || [];
      const races = ((S.rIdx.st[S.office] || {})[s.st]) || [];
      if (!holders.length && !races.length) return h + `<div class="empty">${esc(no || 'No data for this office.')}</div>`;
      if (races.length) h += races.map(r => raceHTML(r, false)).join('');
      else if (holders.some(x => x.upIn2026 !== false)) h += '<div class="status">On the 2026 ballot — no results reported yet.</div>';
      else h += '<div class="status">Not on the 2026 ballot.</div>';
      if (!o.statewide && holders.length) {
        h += `<div class="sublabel">Current members</div>` + seatBar(composition(holders.map(x => pk(x.party))), holders.length);
      }
      h += `<div class="sublabel">Before the election</div>` + holdersHTML(holders, false);
      return h;
    }
    const t = districtTallies(s.st);
    if (!t.holders.length && !t.races.length) return h + `<div class="empty">${esc(no || 'No data loaded for this chamber yet.')}</div>`;
    h += `<div class="meta">${t.holders.length} seats · current holders</div>` + seatBar(composition(t.holders.map(x => pk(x.party))), t.holders.length);
    const ch = S.chambers[`${s.st}|${S.office}`];
    if (ch) {
      const comp = ['D', 'R', 'other'].filter(k => ch[k]).map(k => [k === 'other' ? 'O' : k, ch[k]]);
      if (ch.undecided) comp.push(['V', ch.undecided]);
      h += `<div class="sublabel">2026 chamber result${ch.called ? '' : ' (so far)'}</div>` + seatBar(comp, ch.seats || d3.sum(comp, x => x[1])).replace('Vacant', 'Undecided');
      if (ch.control) h += `<div class="status">Control: <b>${esc(pname(pk(ch.control)))}</b>${ch.called ? ' <span class="pill called">Called</span>' : ''}</div>`;
    }
    if (t.won.length || t.lead.length) {
      h += `<div class="sublabel">Mapped district results</div>`;
      if (t.won.length) h += `<div class="meta">Called</div>` + seatBar(composition(t.won), t.won.length);
      if (t.lead.length) h += `<div class="meta">Leading</div>` + seatBar(composition(t.lead), t.lead.length);
    } else if (!ch) h += '<div class="status">No 2026 district results reported yet.</div>';
    if (t.unmatched) h += `<div class="empty">${t.unmatched} seat${t.unmatched > 1 ? 's' : ''} in districts without a mapped shape (e.g. floterial districts) — counted above, not drawn.</div>`;
    return h;
  }

  /* ---------- notes & URL hash ---------- */
  function renderNotes() {
    const n = $('#dataNotes');
    const srcs = [...((S.holders && S.holders.sources) || [])];
    let h = '<p><b>Colors:</b> blue = Democrat, red = Republican, gold = independent, purple = Vermont Progressive. In “2026 results”, darker = wider margin; faded = still being counted; hatched = seat not on this year’s ballot (current holder shown).</p>';
    h += '<p><b>Statewide offices</b> are drawn by county. When county-level returns are not available, every county shows the statewide result.</p>';
    if (S.results && S.results.notes) h += `<p><b>Results:</b> ${esc(S.results.notes)}</p>`;
    if (srcs.length) h += '<p><b>Officeholders:</b> ' + srcs.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join(', ') + '</p>';
    h += '<p><b>Boundaries:</b> U.S. Census Bureau TIGER/Line districts used for the 2022–2026 elections.</p>';
    n.innerHTML = h;
  }

  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    if (OFF[p.get('office')]) S.office = p.get('office');
    if (['results', 'holders'].includes(p.get('mode'))) S.mode = p.get('mode');
  }
  function writeHash() {
    history.replaceState(null, '', `#office=${S.office}&mode=${S.mode}`);
    renderNotes();
  }

  init();
})();
