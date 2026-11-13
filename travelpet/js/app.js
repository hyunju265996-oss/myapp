/* 라우터 · 설정 */
(function (global) {
  'use strict';
  var UI = global.TPUI, S = global.TPStore, P = global.TPPets, Z = global.TPZodiac;
  var screen = document.getElementById('screen');
  var tabbar = document.querySelector('.tabbar');

  function updateTabPet() {
    var s = S.get(); if (!s) return;
    document.getElementById('tab-pet').innerHTML = P.petSVG(s.user.zodiac, { color: s.user.color, equip: s.pet.equip });
  }
  document.addEventListener('tp:pet-changed', updateTabPet);

  function route() {
    global.TPPlan.cleanup(); global.TPExplore.cleanup();
    UI.closeSheet();
    var s = S.get();
    var h = (location.hash || '').replace(/^#\/?/, '');
    var parts = h.split('/');
    if (!s) {
      // 초대 링크로 처음 들어온 경우, 가입 후 다시 초대 화면으로
      var pendingJoin = parts[0] === 'join' ? h : null;
      tabbar.hidden = true;
      screen.className = 'screen no-tabbar';
      global.TPOnboarding.render(screen, function (state) {
        S.set(state);
        UI.toast(Z.ZODIAC.filter(function (z) { return z.id === state.user.zodiac; })[0].ko + '띠 ' + state.user.petName + '와 함께 여행을 시작해요! 🎉');
        location.hash = pendingJoin ? '#/' + pendingJoin : '#/home';
        route();
      });
      return;
    }
    tabbar.hidden = false;
    screen.className = 'screen';
    var tab = parts[0] || 'home';
    if (tab === 'join') tab = 'plan';
    UI.$$('.tabbar a').forEach(function (a) {
      if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    updateTabPet();
    window.scrollTo(0, 0); screen.scrollTop = 0;
    switch (parts[0]) {
      case 'plan': parts[1] ? global.TPPlan.detail(screen, parts[1], 0) : global.TPPlan.list(screen); break;
      case 'join': global.TPPlan.join(screen, parts.slice(1).join('/')); break;
      case 'explore': global.TPExplore.render(screen); break;
      case 'map': global.TPTravelMap.render(screen); break;
      case 'dex': global.TPDex.render(screen); break;
      default: global.TPHome.render(screen);
    }
  }

  function openSettings() {
    var s = S.get();
    var b = UI.openSheet('설정',
      '<form class="card stack" id="gk"><h2>🗺️ 구글 지도 API 키</h2>' +
      '<p class="muted" style="font-size:15px">키를 넣으면 여행 계획·명소 지도가 실제 구글 지도로 바뀌고, 장소 검색도 구글로 해요. 없으면 OpenStreetMap 지도를 보여줘요.</p>' +
      '<input class="input" name="k" value="' + UI.esc(s.settings.gmapsKey || '') + '" placeholder="AIza…" autocomplete="off" spellcheck="false">' +
      '<p class="hint">Google Cloud에서 Maps JavaScript API와 Places API (New)를 켜고, 키에 이 사이트 주소만 허용(HTTP 리퍼러 제한)해 두세요. 키는 이 기기에만 저장돼요.</p>' +
      '<button class="btn block">저장</button></form>' +
      '<div class="card stack"><h2>👤 내 정보</h2><div class="row between"><span class="muted">이름</span><strong>' + UI.esc(s.user.name) + '</strong></div>' +
      '<div class="row between"><span class="muted">생년월일</span><strong>' + UI.fmtDate(s.user.birth) + '</strong></div>' +
      '<div class="row between"><span class="muted">띠 펫</span><strong>' + Z.ZODIAC.filter(function (z) { return z.id === s.user.zodiac; })[0].ko + '띠 · ' + UI.esc(s.user.petName) + '</strong></div>' +
      '<button class="btn ghost block" id="rename">펫 이름 바꾸기</button></div>' +
      '<button class="btn ghost block" id="logout">처음부터 다시 가입하기</button>');
    b.querySelector('#gk').onsubmit = function (e) {
      e.preventDefault();
      var k = String(new FormData(e.target).get('k') || '').trim();
      var changed = k !== (s.settings.gmapsKey || '');
      s.settings.gmapsKey = k; S.save(); UI.closeSheet();
      if (changed) { UI.toast(k ? '구글 지도를 켰어요. 새로고침할게요' : '기본 지도로 돌아가요'); setTimeout(function () { location.reload(); }, 900); }
    };
    b.querySelector('#rename').onclick = function () {
      var n = prompt('새 펫 이름', s.user.petName);
      if (n && n.trim()) { s.user.petName = n.trim().slice(0, 10); S.save(); UI.closeSheet(); route(); }
    };
    b.querySelector('#logout').onclick = function () {
      UI.confirm('다시 가입하기', '이 기기에 저장된 펫, 여행 기록, 계획이 모두 지워져요.', '모두 지우기', function () { S.reset(); location.hash = ''; route(); });
    };
  }

  /* PC처럼 넓은 화면에서는 스마트폰 프레임에 넣고, 창 크기·브라우저 확대에 맞춰 프레임 크기를 맞춘다 */
  var wide = global.matchMedia('(min-width: 700px)');
  function fitDevice() {
    var on = wide.matches;
    document.body.classList.toggle('device-mode', on);
    if (on) {
      var s = Math.min(1, (window.innerHeight - 32) / 868, (window.innerWidth - 32) / 414);
      document.documentElement.style.setProperty('--device-scale', Math.max(0.4, s).toFixed(3));
    }
  }
  fitDevice();
  window.addEventListener('resize', fitDevice);
  // 휴대폰에서 두 손가락 확대·두 번 탭 확대로 화면 전체가 움직이지 않게
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('touchmove', function (e) { if (e.touches && e.touches.length > 1 && !e.target.closest('.geo, .map-box')) e.preventDefault(); }, { passive: false });
  var lastTap = 0;
  document.addEventListener('touchend', function (e) {
    var now = Date.now();
    if (now - lastTap < 300 && !e.target.closest('.geo, .map-box, input, textarea, select')) e.preventDefault();
    lastTap = now;
  }, { passive: false });

  global.TPApp = { openSettings: openSettings, route: route };
  S.load();
  window.addEventListener('hashchange', route);
  route();
})(window);
