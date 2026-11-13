/* 여행 발자국 지도: 국내(시·군·구 229곳) / 해외(국가 → 주·도·현) 색칠하기 + 여행 기록 */
(function (global) {
  'use strict';
  var UI = global.TPUI, S = global.TPStore, d3 = global.d3, topojson = global.topojson;
  var scope = 'kr';          // 'kr' | 'world'
  var country = null;        // 해외 상세로 들어간 국가 ISO3
  var sido = null;           // 국내 시·도 필터
  var cache = {};

  var COLORS = { 0: '#ECE6DF', 1: '#A7E4D3', 2: '#9FCDEF', 3: '#F4A6B8' };
  function fillFor(n) { return COLORS[Math.min(3, n)]; }

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
  }
  function features(topo) {
    var key = Object.keys(topo.objects)[0];
    return topojson.feature(topo, topo.objects[key]).features;
  }
  function korea() { return cache.kr || (cache.kr = features(global.TP_KOREA)); }
  function world() { return cache.world || (cache.world = features(global.TP_WORLD)); }
  function admin1(iso) {
    var t = global.TP_WORLD_ADMIN1;
    if (!t.objects[iso]) return [];
    var k = 'a1:' + iso;
    return cache[k] || (cache[k] = topojson.feature(t, t.objects[iso]).features);
  }

  function counts() {
    var c = {}, cc = {};
    S.get().records.forEach(function (r) {
      c[r.region] = (c[r.region] || 0) + 1;
      if (r.country) cc[r.country] = (cc[r.country] || 0) + 1;
    });
    return { region: c, country: cc };
  }

  function render(root) {
    var s = S.get(), cnt = counts();
    var krVisited = korea().filter(function (f) { return cnt.region[f.properties.key]; }).length;
    var countries = Object.keys(cnt.country).length;
    var provs = s.records.filter(function (r) { return r.scope === 'world'; }).map(function (r) { return r.region; })
      .filter(function (v, i, a) { return a.indexOf(v) === i; }).length;
    var head = scope === 'kr'
      ? '<div class="card stack" style="gap:10px"><p class="eyebrow">대한민국 방방곡곡</p><div class="row between"><h2 style="font-size:22px">' + krVisited + ' / 229 지역 색칠</h2><span class="badge pink">' + (krVisited / 229 * 100).toFixed(1) + '%</span></div>' +
        '<div class="bar"><i style="width:' + (krVisited / 229 * 100) + '%"></i></div><p class="hint">시·군·구를 누르면 기록을 보거나 남길 수 있어요</p></div>'
      : '<div class="card stack" style="gap:10px"><p class="eyebrow">세계 발자국</p><div class="row between"><h2 style="font-size:22px">' + countries + '개국 · ' + provs + '개 지역</h2><span class="badge sky">' + (countries / 195 * 100).toFixed(1) + '%</span></div>' +
        '<div class="bar sky"><i style="width:' + (countries / 195 * 100) + '%"></i></div><p class="hint">나라를 누르면 주·도·현 단위로 자세히 색칠할 수 있어요</p></div>';

    root.innerHTML = '<div class="page"><div class="page-head"><div><p class="eyebrow">여행 발자국</p><h1>나의 여행지도</h1></div></div>' +
      '<div class="seg"><button data-s="kr" aria-pressed="' + (scope === 'kr') + '">🇰🇷 국내</button><button data-s="world" aria-pressed="' + (scope === 'world') + '">🌏 해외</button></div>' +
      head +
      (scope === 'kr' ? sidoChips() : '') +
      '<div class="geo" id="geo"><svg id="geo-svg" role="img" aria-label="' + (scope === 'kr' ? '대한민국 시군구 지도' : '세계 지도') + '"></svg>' +
      '<div class="zoom"><button data-z="in" aria-label="확대">＋</button><button data-z="out" aria-label="축소">－</button><button data-z="reset" aria-label="처음 크기로">⟲</button></div>' +
      (scope === 'world' && country ? '<div class="crumb"><button class="btn small ghost" id="back-world" style="background:#fff;box-shadow:var(--shadow)">← 세계지도</button></div>' : '') + '</div>' +
      '<div class="legend"><span><i style="background:' + COLORS[0] + '"></i>아직</span><span><i style="background:' + COLORS[1] + '"></i>1번</span><span><i style="background:' + COLORS[2] + '"></i>2번</span><span><i style="background:' + COLORS[3] + '"></i>3번 이상</span></div>' +
      '<div class="stack"><div class="row between"><h2 style="font-size:19px;font-weight:800">최근 여행 기록</h2><button class="btn small" id="new-rec">＋ 기록하기</button></div>' + recent() + '</div>' +
      '</div>';

    UI.$$('[data-s]', root).forEach(function (b) { b.onclick = function () { scope = b.dataset.s; country = null; sido = null; render(root); }; });
    UI.$$('[data-sido]', root).forEach(function (b) {
      b.onclick = function () { sido = sido === b.dataset.sido ? null : b.dataset.sido; UI.$$('[data-sido]', root).forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.sido === sido); }); focusSido(); };
    });
    var back = root.querySelector('#back-world');
    if (back) back.onclick = function () { country = null; render(root); };
    root.querySelector('#new-rec').onclick = function () { pickRegion(root); };
    UI.$$('[data-rec]', root).forEach(function (el) { el.onclick = function () { var r = S.get().records.filter(function (x) { return x.id === el.dataset.rec; })[0]; if (r) regionSheet(root, r.region, r.regionName, r.scope, r.country, r.countryName); }; });

    var geo = root.querySelector('#geo');
    if (scope === 'world' && country) {
      if (!global.TP_WORLD_ADMIN1) {
        geo.insertAdjacentHTML('beforeend', '<div class="map-note">지역 경계를 불러오는 중…</div>');
        loadScript('data/world_admin1.js').then(function () { render(root); }, function () { UI.toast('지도 데이터를 불러오지 못했어요'); });
        return;
      }
    }
    draw(root, geo);
  }

  function sidoChips() {
    var cnt = counts(), map = {};
    korea().forEach(function (f) {
      var p = f.properties; map[p.sido] = map[p.sido] || { name: p.sidonm, total: 0, done: 0 };
      map[p.sido].total++; if (cnt.region[p.key]) map[p.sido].done++;
    });
    var short = function (n) { return n.replace(/특별자치도|특별자치시|특별시|광역시/, '').replace(/^(충청|전라|경상)(남|북)도$/, function (m, a, b) { return a[0] + b; }).replace(/도$/, '') || n; };
    return '<div class="chips">' + Object.keys(map).map(function (k) {
      return '<button class="chip" data-sido="' + k + '" aria-pressed="' + (sido === k) + '">' + short(map[k].name) + ' ' + map[k].done + '/' + map[k].total + '</button>';
    }).join('') + '</div>';
  }

  var zoomer, svgSel, gSel, path, size;
  function draw(root, geo) {
    var W = geo.clientWidth || 380, H = geo.clientHeight || 480;
    size = [W, H];
    var cnt = counts();
    var feats, proj;
    if (scope === 'kr') {
      feats = korea();
      proj = d3.geoMercator().fitExtent([[12, 12], [W - 12, H - 12]], { type: 'FeatureCollection', features: feats });
    } else if (!country) {
      feats = world();
      proj = d3.geoNaturalEarth1().fitExtent([[6, 6], [W - 6, H - 6]], { type: 'Sphere' });
    } else {
      feats = admin1(country);
      var cf = world().filter(function (f) { return f.properties.iso === country; })[0];
      if (!feats.length && cf) feats = [cf];
      var c = d3.geoCentroid(cf || feats[0]);
      proj = d3.geoMercator().rotate([-c[0], 0]).fitExtent([[16, 56], [W - 16, H - 16]], { type: 'FeatureCollection', features: feats });
    }
    path = d3.geoPath(proj);
    svgSel = d3.select(geo).select('svg').attr('viewBox', '0 0 ' + W + ' ' + H);
    svgSel.selectAll('*').remove();
    if (scope === 'world' && !country) svgSel.append('path').attr('d', path({ type: 'Sphere' })).attr('fill', '#E3F0F8');
    gSel = svgSel.append('g');
    gSel.selectAll('path.region').data(feats).enter().append('path')
      .attr('class', 'region')
      .attr('d', path)
      .attr('tabindex', 0)
      .attr('fill', function (f) {
        var p = f.properties;
        if (scope === 'kr') return fillFor(cnt.region[p.key] || 0);
        if (!country) return fillFor(cnt.country[p.iso] || 0);
        return fillFor(cnt.region[p.id || p.iso] || 0);
      })
      .attr('data-fill', function () { return this.getAttribute('fill'); })
      .attr('aria-label', function (f) { return label(f); })
      .on('click', function (e, f) { onRegion(root, f); })
      .on('keydown', function (e, f) { if (e.key === 'Enter') onRegion(root, f); })
      .append('title').text(function (f) { return label(f); });

    // 확대하면 지역 이름 표시
    var labels = gSel.append('g').attr('class', 'labels');
    labels.selectAll('text').data(feats.filter(function (f) { return path.area(f) > 30; })).enter().append('text')
      .attr('class', 'label').attr('text-anchor', 'middle')
      .attr('transform', function (f) { var c = path.centroid(f); return 'translate(' + c + ')'; })
      .text(function (f) { return f.properties.name; })
      .style('display', 'none');

    zoomer = d3.zoom().scaleExtent([1, 24]).translateExtent([[-W, -H], [2 * W, 2 * H]]).on('zoom', function (e) {
      gSel.attr('transform', e.transform);
      var k = e.transform.k;
      labels.selectAll('text').style('display', function (f) { return path.area(f) * k * k > 2200 ? null : 'none'; })
        .style('font-size', (11 / k) + 'px').style('stroke-width', (3 / k) + 'px');
    });
    svgSel.call(zoomer).on('dblclick.zoom', null);
    UI.$$('[data-z]', geo).forEach(function (b) {
      b.onclick = function () {
        if (b.dataset.z === 'reset') svgSel.transition().duration(350).call(zoomer.transform, d3.zoomIdentity);
        else svgSel.transition().duration(250).call(zoomer.scaleBy, b.dataset.z === 'in' ? 1.6 : 1 / 1.6);
      };
    });
    if (scope === 'kr' && sido) focusSido(true);
  }

  function zoomTo(feats, instant) {
    var b = feats.map(function (f) { return path.bounds(f); }).reduce(function (a, c) {
      return [[Math.min(a[0][0], c[0][0]), Math.min(a[0][1], c[0][1])], [Math.max(a[1][0], c[1][0]), Math.max(a[1][1], c[1][1])]];
    });
    var W = size[0], H = size[1];
    var k = Math.min(24, 0.88 / Math.max((b[1][0] - b[0][0]) / W, (b[1][1] - b[0][1]) / H));
    var t = d3.zoomIdentity.translate(W / 2 - k * (b[0][0] + b[1][0]) / 2, H / 2 - k * (b[0][1] + b[1][1]) / 2).scale(k);
    (instant ? svgSel : svgSel.transition().duration(500)).call(zoomer.transform, t);
  }
  function focusSido(instant) {
    if (!svgSel) return;
    if (!sido) { svgSel.transition().duration(400).call(zoomer.transform, d3.zoomIdentity); return; }
    zoomTo(korea().filter(function (f) { return f.properties.sido === sido; }), instant);
  }

  function label(f) {
    var p = f.properties;
    if (scope === 'kr') return p.sidonm + ' ' + p.name;
    return p.name;
  }

  function onRegion(root, f) {
    var p = f.properties;
    // 선택한 지역만 진한 색으로
    gSel.selectAll('path.region').attr('fill', function (x) {
      var base = this.getAttribute('data-fill');
      return x === f ? d3.color(base).darker(0.9).formatHex() : base;
    });
    if (scope === 'kr') return regionSheet(root, p.key, p.sidonm + ' ' + p.name, 'kr');
    if (!country) {
      if (p.iso === 'KOR') { scope = 'kr'; render(root); return; }
      var w = world().filter(function (x) { return x.properties.iso === p.iso; })[0];
      country = p.iso; cache.countryName = w ? w.properties.name : p.name;
      render(root);
      return;
    }
    var cn = cache.countryName || country;
    regionSheet(root, p.id || p.iso, cn + ' ' + p.name, 'world', country, cn);
  }

  /* ---------- 지역 기록 시트 ---------- */
  function regionSheet(root, region, regionName, sc, iso, countryName) {
    var recs = S.get().records.filter(function (r) { return r.region === region; });
    var b = UI.openSheet(regionName,
      '<div class="row"><span class="badge ' + (recs.length ? 'pink' : 'lav') + '">' + (recs.length ? recs.length + '번 다녀왔어요' : '아직 안 가본 곳') + '</span></div>' +
      (recs.length ? recs.map(recCard).join('') : '<div class="empty"><span class="big">🗺️</span>다녀왔다면 기록을 남기고 지도를 색칠해보세요!<br><b>기록 1건마다 🪙100, 처음 가본 곳은 🪙50 더!</b></div>') +
      '<button class="btn block" id="add-here">✍️ 여기 다녀온 기록 남기기</button>');
    b.querySelector('#add-here').onclick = function () { recordForm(root, { region: region, regionName: regionName, scope: sc, country: iso, countryName: countryName }); };
    UI.$$('[data-delrec]', b).forEach(function (el) {
      el.onclick = function () {
        UI.confirm('기록 삭제', '이 기록을 지울까요? 받은 코인은 그대로 남아요.', '삭제', function () {
          var s = S.get(); s.records = s.records.filter(function (r) { return r.id !== el.dataset.delrec; }); S.save(); render(root);
        });
      };
    });
  }
  function recCard(r) {
    return '<div class="rec"><div class="row between"><span class="t">' + UI.esc(r.mood || '') + ' ' + UI.esc(r.title) + '</span><button class="icon-btn" data-delrec="' + r.id + '" aria-label="기록 삭제">🗑</button></div>' +
      '<span class="hint">' + UI.fmtDate(r.date) + '</span>' +
      (r.memo ? '<p style="font-size:16px">' + UI.esc(r.memo) + '</p>' : '') +
      (r.photos && r.photos.length ? '<div class="photo-grid">' + r.photos.map(function (src) { return '<img alt="" src="' + src + '">'; }).join('') + '</div>' : '') + '</div>';
  }

  function recordForm(root, target) {
    var photos = [];
    var moods = ['😊', '🥰', '😍', '🤩', '😋', '😎', '🥹'];
    var b = UI.openSheet('여행 기록 남기기',
      '<p class="muted">📍 ' + UI.esc(target.regionName) + '</p>' +
      '<form class="stack" id="rf"><label class="field"><span>제목</span><input class="input" name="title" required maxlength="30" placeholder="예: 바다 보며 커피 한 잔" autofocus></label>' +
      '<label class="field"><span>다녀온 날</span><input class="input" type="date" name="date" value="' + new Date().toISOString().slice(0, 10) + '" required></label>' +
      '<div class="field"><span>기분</span><div class="chips" style="margin:0;padding:0">' + moods.map(function (m, i) { return '<button type="button" class="chip" data-mood="' + m + '" aria-pressed="' + (i === 0) + '" style="font-size:20px">' + m + '</button>'; }).join('') + '</div></div>' +
      '<label class="field"><span>메모</span><textarea class="input" name="memo" maxlength="300" placeholder="어떤 순간이 좋았나요?"></textarea></label>' +
      '<div class="field"><span>사진 (최대 6장)</span><label class="btn ghost block" style="cursor:pointer">📷 사진 고르기<input type="file" accept="image/*" multiple hidden id="rf-photo"></label><div class="photo-grid" id="rf-prev"></div></div>' +
      '<button class="btn block">기록 저장하고 색칠하기</button></form>');
    var mood = moods[0];
    UI.$$('[data-mood]', b).forEach(function (el) { el.onclick = function () { mood = el.dataset.mood; UI.$$('[data-mood]', b).forEach(function (x) { x.setAttribute('aria-pressed', x === el); }); }; });
    b.querySelector('#rf-photo').onchange = function (e) {
      var files = Array.prototype.slice.call(e.target.files).slice(0, 6 - photos.length);
      Promise.all(files.map(function (f) { return UI.shrinkImage(f); })).then(function (srcs) {
        photos = photos.concat(srcs.filter(Boolean));
        b.querySelector('#rf-prev').innerHTML = photos.map(function (s) { return '<img alt="" src="' + s + '">'; }).join('');
      });
    };
    b.querySelector('#rf').onsubmit = function (e) {
      e.preventDefault();
      var f = new FormData(e.target);
      var res = S.addRecord({
        scope: target.scope, region: target.region, regionName: target.regionName, country: target.country, countryName: target.countryName,
        date: f.get('date'), title: String(f.get('title')).trim(), memo: String(f.get('memo') || '').trim(), mood: mood, photos: photos
      });
      UI.closeSheet();
      UI.toast('🎉 기록 완료! 🪙' + res.reward + ' 받았어요' + (res.first ? ' (첫 방문 보너스!)' : '') + (res.levelUp ? ' · 펫 레벨 업!' : ''));
      render(root);
    };
  }

  /* 지도 밖에서 '기록하기' → 지역 검색해서 고르기 */
  function pickRegion(root) {
    var b = UI.openSheet('어디를 다녀왔나요?', '<input class="input" id="rq" placeholder="예: 강릉, 해운대, 도쿄, 파리" autofocus><div class="list" id="rl"></div><p class="hint">국내는 시·군·구, 해외는 주·도·현 단위로 찾아요</p>');
    var ready = global.TP_WORLD_ADMIN1 ? Promise.resolve() : loadScript('data/world_admin1.js');
    var inp = b.querySelector('#rq'), out = b.querySelector('#rl');
    inp.oninput = function () {
      var q = inp.value.trim(); if (q.length < 1) { out.innerHTML = ''; return; }
      ready.then(function () {
        var res = [];
        korea().forEach(function (f) { var p = f.properties; if ((p.sidonm + ' ' + p.name).indexOf(q) !== -1) res.push({ region: p.key, regionName: p.sidonm + ' ' + p.name, scope: 'kr' }); });
        var names = {}; world().forEach(function (f) { names[f.properties.iso] = f.properties.name; });
        var t = global.TP_WORLD_ADMIN1;
        Object.keys(t.objects).forEach(function (iso) {
          t.objects[iso].geometries.forEach(function (g) {
            var p = g.properties;
            if (p.name.indexOf(q) !== -1 || (p.en || '').toLowerCase().indexOf(q.toLowerCase()) !== -1 || (names[iso] || '').indexOf(q) === 0) {
              res.push({ region: p.id, regionName: (names[iso] || iso) + ' ' + p.name, scope: 'world', country: iso, countryName: names[iso] || iso });
            }
          });
        });
        res = res.slice(0, 30);
        out.innerHTML = res.length ? res.map(function (r, i) {
          return '<button class="list-item" data-i="' + i + '" style="background:none;border-left:0;border-right:0;border-top:0;text-align:left;width:100%"><span class="thumb">' + (r.scope === 'kr' ? '🇰🇷' : '🌏') + '</span><span class="t">' + UI.esc(r.regionName) + '</span></button>';
        }).join('') : '<p class="empty">찾는 지역이 없어요</p>';
        UI.$$('[data-i]', out).forEach(function (el) { el.onclick = function () { recordForm(root, res[+el.dataset.i]); }; });
      });
    };
  }

  function recent() {
    var recs = S.get().records.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 5);
    if (!recs.length) return '<div class="card empty"><span class="big">✍️</span>첫 여행 기록을 남겨보세요</div>';
    return '<div class="card list" style="padding:4px 16px">' + recs.map(function (r) {
      return '<button class="list-item" data-rec="' + r.id + '" style="background:none;border-left:0;border-right:0;border-top:0;text-align:left;width:100%"><span class="thumb" style="background:' + (r.scope === 'kr' ? 'var(--mint-soft)' : 'var(--sky-soft)') + '">' + (r.photos && r.photos[0] ? '<img alt="" src="' + r.photos[0] + '" style="width:100%;height:100%;object-fit:cover;border-radius:16px">' : (r.mood || '📍')) + '</span>' +
        '<span style="flex:1;min-width:0"><span class="t">' + UI.esc(r.title) + '</span><br><span class="s">' + UI.esc(r.regionName) + ' · ' + UI.fmtDate(r.date) + '</span></span></button>';
    }).join('') + '</div>';
  }

  global.TPTravelMap = { render: render };
})(window);
