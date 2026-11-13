/* 여행 계획: 여행 목록 → 여행 상세(지도 + 일차별 일정) · 동행 초대 */
(function (global) {
  'use strict';
  var UI = global.TPUI, P = global.TPPets, S = global.TPStore;
  var current = null; // 지도 인스턴스

  function cleanup() { if (current) { try { current.destroy(); } catch (e) {} current = null; } }

  function nights(t) {
    var d = Math.round((new Date(t.end) - new Date(t.start)) / 86400000);
    return d > 0 ? d + '박 ' + (d + 1) + '일' : '당일치기';
  }
  function avatars(members) {
    return '<div class="members">' + members.slice(0, 5).map(function (m) {
      return '<span class="avatar" title="' + UI.esc(m.name) + '">' + (m.zodiac ? P.petSVG(m.zodiac) : UI.esc(m.name.slice(0, 1))) + '</span>';
    }).join('') + '</div>';
  }

  /* ---------- 목록 ---------- */
  function list(root) {
    cleanup();
    var s = S.get();
    var trips = s.trips.slice().sort(function (a, b) { return a.start < b.start ? -1 : 1; });
    root.innerHTML = '<div class="page"><div class="page-head"><div><p class="eyebrow">여행 플래너</p><h1>어디로 떠나볼까요?</h1></div></div>' +
      '<button class="btn block" id="new-trip">＋ 새 여행 계획 만들기</button>' +
      (trips.length ? trips.map(function (t) {
        var stops = t.days.reduce(function (n, d) { return n + d.length; }, 0);
        return '<a class="card stack" href="#/plan/' + t.id + '" style="text-decoration:none;gap:10px">' +
          '<div class="row between"><span class="badge ' + (UI.dday(t.start) === '다녀옴' ? 'lav' : 'pink') + '">' + UI.dday(t.start) + '</span><span class="hint">' + nights(t) + '</span></div>' +
          '<h2>' + UI.esc(t.title) + '</h2><p class="muted">' + UI.fmtDate(t.start) + ' – ' + UI.fmtDate(t.end) + ' · 장소 ' + stops + '곳</p>' +
          '<div class="row between">' + avatars(t.members) + '<span class="muted" style="font-weight:700">' + t.members.length + '명이 함께 →</span></div></a>';
      }).join('') : '<div class="card empty"><span class="big">🧳</span>아직 계획한 여행이 없어요.<br>첫 여행을 만들어볼까요?</div>') +
      '</div>';
    root.querySelector('#new-trip').onclick = function () { newTrip(); };
  }

  function newTrip() {
    var today = new Date().toISOString().slice(0, 10);
    var b = UI.openSheet('새 여행 만들기',
      '<form class="stack" id="nt"><label class="field"><span>여행 이름</span><input class="input" name="title" required placeholder="예: 부산 바다 여행" autofocus></label>' +
      '<label class="field"><span>여행지</span><input class="input" name="dest" placeholder="예: 부산"></label>' +
      '<div class="grid2"><label class="field"><span>출발일</span><input class="input" type="date" name="start" value="' + today + '" required></label>' +
      '<label class="field"><span>도착일</span><input class="input" type="date" name="end" value="' + today + '" required></label></div>' +
      '<button class="btn block">만들기</button></form>');
    b.querySelector('#nt').onsubmit = function (e) {
      e.preventDefault();
      var f = new FormData(e.target), s = S.get();
      var start = f.get('start'), end = f.get('end') < start ? start : f.get('end');
      var n = Math.min(14, Math.round((new Date(end) - new Date(start)) / 86400000) + 1);
      var days = []; for (var i = 0; i < n; i++) days.push([]);
      var t = { id: 't' + Date.now().toString(36), title: String(f.get('title')).trim(), dest: String(f.get('dest') || '').trim(), start: start, end: end, days: days,
        members: [{ name: s.user.name || '나', me: true, zodiac: s.user.zodiac }] };
      s.trips.push(t); S.save(); UI.closeSheet();
      location.hash = '#/plan/' + t.id;
    };
  }

  /* ---------- 상세 ---------- */
  function detail(root, id, dayIdx) {
    cleanup();
    var s = S.get();
    var t = s.trips.filter(function (x) { return x.id === id; })[0];
    if (!t) { location.hash = '#/plan'; return; }
    var day = Math.min(dayIdx || 0, t.days.length - 1);
    var stops = t.days[day];
    root.innerHTML = '<div class="page">' +
      '<div class="row"><a class="icon-btn" href="#/plan" aria-label="목록으로">←</a><div style="flex:1"><p class="eyebrow">' + UI.dday(t.start) + ' · ' + nights(t) + '</p><h1 style="font-size:22px;font-weight:800">' + UI.esc(t.title) + '</h1></div>' +
      '<button class="icon-btn" id="trip-more" aria-label="여행 설정">⋯</button></div>' +
      '<div class="card row between" style="padding:14px 16px"><div>' + avatars(t.members) + '<p class="hint" style="margin-top:4px">' + t.members.map(function (m) { return UI.esc(m.name); }).join(', ') + '</p></div>' +
      '<button class="btn small mint" id="invite">＋ 동행 초대</button></div>' +
      '<div class="chips">' + t.days.map(function (d, i) {
        var dt = new Date(t.start); dt.setDate(dt.getDate() + i);
        return '<button class="chip" data-day="' + i + '" aria-pressed="' + (i === day) + '">' + (i + 1) + '일차 · ' + (dt.getMonth() + 1) + '/' + dt.getDate() + '</button>';
      }).join('') + '</div>' +
      '<div class="map-box"><div class="map-el" id="trip-map"></div>' + (global.TPMap.usingGoogle() ? '' : '<div class="map-note">설정에서 구글 지도 API 키를 넣으면 구글 지도로 바뀌어요</div>') + '</div>' +
      '<div class="timeline">' + (stops.length ? stops.map(function (p, i) {
        return '<div class="stop"><span class="num">' + (i + 1) + '</span><div style="flex:1;min-width:0"><div class="t">' + UI.esc(p.name) + '</div>' +
          '<div class="s">' + (p.time ? '🕒 ' + UI.esc(p.time) + ' · ' : '') + UI.esc(p.memo || '') + '</div>' +
          (p.by ? '<span class="badge sky" style="margin-top:6px">' + UI.esc(p.by) + '님이 추가</span>' : '') + '</div>' +
          '<div class="stack" style="gap:6px">' +
          '<button class="icon-btn" data-up="' + i + '" aria-label="위로" ' + (i === 0 ? 'disabled style="opacity:.3"' : '') + '>↑</button>' +
          '<button class="icon-btn" data-del="' + i + '" aria-label="삭제">🗑</button></div></div>';
      }).join('') : '<div class="card empty"><span class="big">📍</span>' + (day + 1) + '일차 일정이 비어 있어요</div>') + '</div>' +
      '<div class="grid2"><button class="btn" id="add-search">🔍 장소 검색</button><button class="btn sky" id="add-pick">✨ 추천에서 담기</button></div>' +
      '</div>';

    current = global.TPMap.create(root.querySelector('#trip-map'));
    current.setStops(stops);
    document.addEventListener('tp:gmaps-failed', function once() {
      document.removeEventListener('tp:gmaps-failed', once);
      if (location.hash.indexOf('#/plan/' + id) === 0) detail(root, id, day);
    });

    UI.$$('[data-day]', root).forEach(function (b) { b.onclick = function () { detail(root, id, +b.dataset.day); }; });
    UI.$$('[data-del]', root).forEach(function (b) {
      b.onclick = function () { stops.splice(+b.dataset.del, 1); S.save(); detail(root, id, day); };
    });
    UI.$$('[data-up]', root).forEach(function (b) {
      b.onclick = function () { var i = +b.dataset.up; if (!i) return; var x = stops[i]; stops[i] = stops[i - 1]; stops[i - 1] = x; S.save(); detail(root, id, day); };
    });
    root.querySelector('#add-search').onclick = function () { searchSheet(function (p) { addStop(p); }); };
    root.querySelector('#add-pick').onclick = function () {
      var b = UI.openSheet('추천 장소에서 담기', '<div class="list">' + global.TPData.PLACES.map(function (p) {
        return '<button class="list-item" data-pid="' + p.id + '" style="background:none;border-left:0;border-right:0;border-top:0;text-align:left;width:100%"><span class="thumb">' + p.emoji + '</span><span style="flex:1"><span class="t">' + UI.esc(p.name) + '</span><br><span class="s">' + p.area + ' · ' + p.city + '</span></span><span class="badge pink">담기</span></button>';
      }).join('') + '</div>');
      UI.$$('[data-pid]', b).forEach(function (el) {
        el.onclick = function () { var p = global.TPData.PLACES.filter(function (x) { return x.id === el.dataset.pid; })[0]; addStop({ name: p.name, lat: p.lat, lng: p.lng, memo: p.desc }); };
      });
    };
    root.querySelector('#invite').onclick = function () { invite(t, function () { detail(root, id, day); }); };
    root.querySelector('#trip-more').onclick = function () {
      UI.confirm('여행 삭제', '"' + t.title + '" 계획을 삭제할까요? 되돌릴 수 없어요.', '삭제', function () {
        s.trips = s.trips.filter(function (x) { return x.id !== id; }); S.save(); location.hash = '#/plan';
      });
    };

    function addStop(p) {
      UI.closeSheet();
      var b = UI.openSheet(p.name, '<form class="stack" id="st"><label class="field"><span>방문 시간</span><input class="input" type="time" name="time" value="12:00"></label>' +
        '<label class="field"><span>메모</span><input class="input" name="memo" value="' + UI.esc(p.memo || '') + '" placeholder="예약, 꼭 먹을 것 등"></label>' +
        '<button class="btn block">' + (day + 1) + '일차에 추가</button></form>');
      b.querySelector('#st').onsubmit = function (e) {
        e.preventDefault();
        var f = new FormData(e.target);
        stops.push({ name: p.name, lat: p.lat, lng: p.lng, time: f.get('time'), memo: String(f.get('memo') || '').trim() });
        stops.sort(function (a, c) { return (a.time || '99') < (c.time || '99') ? -1 : 1; });
        S.save(); UI.closeSheet(); UI.toast('일정에 추가했어요 📍');
        detail(root, id, day);
      };
    }
  }

  function searchSheet(onPick) {
    var b = UI.openSheet('장소 검색', '<form class="row" id="sf"><input class="input" name="q" placeholder="예: 해운대, 성산일출봉, 카페" autofocus><button class="btn" style="flex-shrink:0">검색</button></form><div id="sr" class="list"></div>' +
      '<p class="hint">' + (global.TPMap.usingGoogle() ? '구글 지도 장소 검색을 사용해요' : 'OpenStreetMap 검색을 사용해요 · 설정에서 구글 지도 키를 넣으면 더 정확해져요') + '</p>');
    b.querySelector('#sf').onsubmit = function (e) {
      e.preventDefault();
      var q = String(new FormData(e.target).get('q') || '').trim(); if (!q) return;
      var out = b.querySelector('#sr');
      out.innerHTML = '<p class="hint">찾는 중…</p>';
      global.TPMap.search(q).then(function (rs) {
        out.innerHTML = rs.length ? rs.map(function (r, i) {
          return '<button class="list-item" data-i="' + i + '" style="background:none;border-left:0;border-right:0;border-top:0;text-align:left;width:100%"><span class="thumb">📍</span><span style="flex:1;min-width:0"><span class="t">' + UI.esc(r.name) + '</span><br><span class="s">' + UI.esc(r.address) + '</span></span></button>';
        }).join('') : '<p class="empty">검색 결과가 없어요. 다른 이름으로 찾아보세요.</p>';
        UI.$$('[data-i]', out).forEach(function (el) { el.onclick = function () { onPick(rs[+el.dataset.i]); }; });
      });
    };
  }

  /* ---------- 동행 초대: 여행 내용을 담은 링크로 공유 ---------- */
  function encodeTrip(t) {
    var json = JSON.stringify({ v: 1, trip: t, from: S.get().user.name });
    return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodeTrip(code) {
    try {
      var b64 = code.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(b64))));
    } catch (e) { return null; }
  }
  function invite(t, after) {
    var link = location.href.split('#')[0] + '#/join/' + encodeTrip(t);
    var b = UI.openSheet('동행 초대하기',
      '<p class="muted">초대 링크를 받은 친구가 열면 이 여행 계획이 친구 앱에 추가돼요. 친구가 고친 일정은 다시 링크로 보내 서로 맞출 수 있어요.</p>' +
      '<button class="btn block" id="share">🔗 초대 링크 공유하기</button>' +
      '<div class="card stack"><h2>동행 직접 추가</h2><form class="row" id="add-m"><input class="input" name="n" placeholder="친구 이름" maxlength="10"><button class="btn small mint" style="min-height:52px">추가</button></form>' +
      '<div class="list">' + t.members.map(function (m, i) {
        return '<div class="list-item"><span class="avatar">' + (m.zodiac ? P.petSVG(m.zodiac) : UI.esc(m.name.slice(0, 1))) + '</span><span style="flex:1" class="t">' + UI.esc(m.name) + (m.me ? ' (나)' : '') + '</span>' +
          (m.me ? '' : '<button class="icon-btn" data-rm="' + i + '" aria-label="' + UI.esc(m.name) + ' 빼기">✕</button>') + '</div>';
      }).join('') + '</div></div>', { onClose: after });
    b.querySelector('#share').onclick = function () {
      if (navigator.share) navigator.share({ title: '여행펫 · ' + t.title + ' 같이 계획해요!', url: link }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(link).then(function () { UI.toast('초대 링크를 복사했어요. 친구에게 보내주세요 💌'); }, function () { prompt('초대 링크', link); });
      else prompt('초대 링크', link);
    };
    b.querySelector('#add-m').onsubmit = function (e) {
      e.preventDefault();
      var n = String(new FormData(e.target).get('n') || '').trim(); if (!n) return;
      var zs = global.TPZodiac.ZODIAC;
      t.members.push({ name: n, zodiac: zs[Math.floor(Math.random() * 12)].id });
      S.save(); invite(t, after);
    };
    UI.$$('[data-rm]', b).forEach(function (el) { el.onclick = function () { t.members.splice(+el.dataset.rm, 1); S.save(); invite(t, after); }; });
  }

  function join(root, code) {
    cleanup();
    var data = decodeTrip(code);
    if (!data || !data.trip) { UI.toast('초대 링크가 올바르지 않아요'); location.hash = '#/plan'; return; }
    var t = data.trip, s = S.get();
    root.innerHTML = '<div class="page"><div class="page-head"><div><p class="eyebrow">' + UI.esc(data.from || '친구') + '님의 초대</p><h1>같이 여행 계획을<br>짜볼까요?</h1></div></div>' +
      '<div class="card stack"><h2>' + UI.esc(t.title) + '</h2><p class="muted">' + UI.fmtDate(t.start) + ' – ' + UI.fmtDate(t.end) + ' · ' + nights(t) + '</p>' + avatars(t.members) + '</div>' +
      '<button class="btn block" id="accept">초대 수락하고 계획 열기</button><a class="btn ghost block" href="#/plan">다음에 할게요</a></div>';
    root.querySelector('#accept').onclick = function () {
      var me = s.user.name || '나';
      t.members.forEach(function (m) { m.me = false; });
      if (!t.members.some(function (m) { return m.name === me; })) t.members.push({ name: me, me: true, zodiac: s.user.zodiac });
      else t.members.forEach(function (m) { if (m.name === me) m.me = true; });
      s.trips = s.trips.filter(function (x) { return x.id !== t.id; });
      s.trips.push(t); S.save();
      UI.toast('여행 계획에 합류했어요! 🎉');
      location.hash = '#/plan/' + t.id;
    };
  }

  global.TPPlan = { list: list, detail: detail, join: join, cleanup: cleanup, searchSheet: searchSheet };
})(window);
