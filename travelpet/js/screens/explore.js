/* 항공권 검색 · 가볼만한 곳 */
(function (global) {
  'use strict';
  var UI = global.TPUI, S = global.TPStore, D = global.TPData;
  var tab = 'flight', area = '전체', mapView = null;
  var form = { from: 'ICN', to: 'NRT', go: '', back: '', adult: 1 };

  function cleanup() { if (mapView) { try { mapView.destroy(); } catch (e) {} mapView = null; } }

  function render(root) {
    cleanup();
    root.innerHTML = '<div class="page"><div class="page-head"><div><p class="eyebrow">여행 준비</p><h1>항공권 & 가볼만한 곳</h1></div></div>' +
      '<div class="seg" role="tablist"><button data-t="flight" aria-pressed="' + (tab === 'flight') + '">✈️ 항공권</button><button data-t="places" aria-pressed="' + (tab === 'places') + '">📍 가볼만한 곳</button></div>' +
      '<div id="ex-body" class="stack" style="gap:20px"></div></div>';
    UI.$$('[data-t]', root).forEach(function (b) { b.onclick = function () { tab = b.dataset.t; render(root); }; });
    (tab === 'flight' ? flights : places)(root.querySelector('#ex-body'));
  }

  function airportOptions(sel) {
    return D.AIRPORTS.map(function (a) { return '<option value="' + a.code + '"' + (a.code === sel ? ' selected' : '') + '>' + a.name + ' (' + a.code + ')</option>'; }).join('');
  }
  function plusDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

  function flights(box) {
    if (!form.go) { form.go = plusDays(14); form.back = plusDays(17); }
    box.innerHTML = '<form class="card stack" id="ff" style="gap:16px">' +
      '<label class="field"><span>출발</span><select class="input" name="from">' + airportOptions(form.from) + '</select></label>' +
      '<button type="button" class="btn ghost small" id="swap" aria-label="출발 도착 바꾸기" style="align-self:center">⇅ 출발·도착 바꾸기</button>' +
      '<label class="field"><span>도착</span><select class="input" name="to">' + airportOptions(form.to) + '</select></label>' +
      '<div class="grid2"><label class="field"><span>가는 날</span><input class="input" type="date" name="go" value="' + form.go + '" required></label>' +
      '<label class="field"><span>오는 날 (선택)</span><input class="input" type="date" name="back" value="' + form.back + '"></label></div>' +
      '<label class="field"><span>인원 (성인)</span><select class="input" name="adult">' + [1, 2, 3, 4, 5, 6].map(function (n) { return '<option' + (n === form.adult ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label>' +
      '<p class="hint">원하는 사이트를 누르면 같은 조건으로 실시간 항공권 가격을 보여줘요</p>' +
      '<div class="stack" style="gap:10px"><button class="btn block" data-site="naver">네이버 항공권에서 보기</button>' +
      '<div class="grid2"><button class="btn sky" data-site="google">구글 항공편</button><button class="btn mint" data-site="sky">스카이스캐너</button></div></div></form>' +
      '<div class="card stack"><h2>인기 노선</h2><div class="chips" style="flex-wrap:wrap;margin:0;padding:0">' +
      [['GMP', 'CJU'], ['ICN', 'NRT'], ['ICN', 'KIX'], ['ICN', 'DAD'], ['ICN', 'BKK'], ['ICN', 'TPE'], ['ICN', 'CDG'], ['PUS', 'FUK']].map(function (r) {
        return '<button class="chip" data-route="' + r.join('-') + '">' + name(r[0]) + ' → ' + name(r[1]) + '</button>';
      }).join('') + '</div></div>';
    var f = box.querySelector('#ff');
    function read() {
      var d = new FormData(f);
      form = { from: d.get('from'), to: d.get('to'), go: d.get('go'), back: d.get('back') || '', adult: +d.get('adult') };
    }
    f.onchange = read;
    box.querySelector('#swap').onclick = function () { read(); var x = form.from; form.from = form.to; form.to = x; flights(box); };
    UI.$$('[data-route]', box).forEach(function (b) { b.onclick = function () { read(); var r = b.dataset.route.split('-'); form.from = r[0]; form.to = r[1]; flights(box); UI.toast(name(r[0]) + ' → ' + name(r[1]) + ' 노선을 골랐어요'); }; });
    UI.$$('[data-site]', box).forEach(function (b) {
      b.onclick = function (e) {
        e.preventDefault(); read();
        if (form.from === form.to) { UI.toast('출발지와 도착지가 같아요'); return; }
        if (!form.go) { UI.toast('가는 날을 골라주세요'); return; }
        window.open(flightUrl(b.dataset.site), '_blank', 'noopener');
      };
    });
  }
  function name(code) { var a = D.AIRPORTS.filter(function (x) { return x.code === code; })[0]; return a ? a.name.split(' ')[0] : code; }
  function flightUrl(site) {
    var go = form.go, back = form.back && form.back >= form.go ? form.back : '';
    var ymd = function (d) { return d.replace(/-/g, ''); };
    if (site === 'naver') {
      var domestic = ['GMP', 'CJU', 'PUS', 'TAE', 'CJJ', 'RSU', 'YNY', 'ICN'];
      var dom = domestic.indexOf(form.from) !== -1 && domestic.indexOf(form.to) !== -1;
      var seg = form.from + '-' + form.to + '-' + ymd(go) + (back ? '/' + form.to + '-' + form.from + '-' + ymd(back) : '');
      return 'https://flight.naver.com/flights/' + (dom ? 'domestic' : 'international') + '/' + seg + '?adult=' + form.adult + '&fareType=' + (dom ? 'YC' : 'Y');
    }
    if (site === 'google') {
      var q = 'Flights from ' + form.from + ' to ' + form.to + ' on ' + go + (back ? ' through ' + back : ' one way') + ' ' + form.adult + ' adults';
      return 'https://www.google.com/travel/flights?hl=ko&q=' + encodeURIComponent(q);
    }
    var yymmdd = function (d) { return d.slice(2).replace(/-/g, ''); };
    return 'https://www.skyscanner.co.kr/transport/flights/' + form.from.toLowerCase() + '/' + form.to.toLowerCase() + '/' + yymmdd(go) + '/' + (back ? yymmdd(back) + '/' : '') + '?adultsv2=' + form.adult;
  }

  function places(box) {
    var list = D.PLACES.filter(function (p) { return area === '전체' || p.area === area; });
    box.innerHTML = '<div class="chips">' + ['전체', '국내', '해외'].map(function (a) { return '<button class="chip" data-a="' + a + '" aria-pressed="' + (a === area) + '">' + a + '</button>'; }).join('') + '</div>' +
      '<div class="map-box tall"><div class="map-el" id="pl-map"></div></div>' +
      '<div class="stack">' + list.map(function (p, i) {
        return '<div class="card row" style="padding:14px 16px;align-items:flex-start"><span class="thumb">' + p.emoji + '</span><div style="flex:1;min-width:0">' +
          '<div class="row" style="gap:6px;flex-wrap:wrap"><span class="badge ' + (p.area === '국내' ? '' : 'sky') + '">' + (i + 1) + ' · ' + p.city + '</span><span class="badge lav">' + p.tag + '</span></div>' +
          '<div style="font-weight:800;font-size:17px;margin-top:4px">' + UI.esc(p.name) + '</div><p class="muted" style="font-size:15px">' + UI.esc(p.desc) + '</p>' +
          '<div class="row" style="margin-top:8px;gap:8px"><button class="btn small ghost" data-focus="' + i + '">지도에서 보기</button><button class="btn small" data-add="' + p.id + '">계획에 담기</button></div></div></div>';
      }).join('') + '</div>';
    UI.$$('[data-a]', box).forEach(function (b) { b.onclick = function () { area = b.dataset.a; cleanup(); places(box); }; });
    mapView = global.TPMap.create(box.querySelector('#pl-map'));
    mapView.setStops(list);
    UI.$$('[data-focus]', box).forEach(function (b) {
      b.onclick = function () { var p = list[+b.dataset.focus]; mapView.focus(p.lat, p.lng); box.querySelector('#pl-map').scrollIntoView({ behavior: 'smooth', block: 'center' }); };
    });
    UI.$$('[data-add]', box).forEach(function (b) { b.onclick = function () { addToTrip(D.PLACES.filter(function (x) { return x.id === b.dataset.add; })[0]); }; });
  }

  function addToTrip(p) {
    var s = S.get();
    if (!s.trips.length) { UI.toast('먼저 여행 계획을 만들어주세요'); location.hash = '#/plan'; return; }
    var b = UI.openSheet(p.name + ' 담기', '<div class="list">' + s.trips.map(function (t) {
      return t.days.map(function (d, i) {
        return '<button class="list-item" data-t="' + t.id + '" data-d="' + i + '" style="background:none;border-left:0;border-right:0;border-top:0;text-align:left;width:100%"><span class="thumb">🗓️</span><span style="flex:1"><span class="t">' + UI.esc(t.title) + '</span><br><span class="s">' + (i + 1) + '일차 · 장소 ' + d.length + '곳</span></span></button>';
      }).join('');
    }).join('') + '</div>');
    UI.$$('[data-t]', b).forEach(function (el) {
      el.onclick = function () {
        var t = s.trips.filter(function (x) { return x.id === el.dataset.t; })[0];
        t.days[+el.dataset.d].push({ name: p.name, lat: p.lat, lng: p.lng, time: '', memo: p.desc });
        S.save(); UI.closeSheet(); UI.toast(t.title + ' ' + (+el.dataset.d + 1) + '일차에 담았어요 ✨');
      };
    });
  }

  global.TPExplore = { render: render, cleanup: cleanup };
})(window);
