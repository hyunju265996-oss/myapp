/* 메인: 펫의 방 (먹이주기 · 놀아주기 · 펫 꾸미기 · 방 꾸미기) */
(function (global) {
  'use strict';
  var UI = global.TPUI, P = global.TPPets, Z = global.TPZodiac, S = global.TPStore;

  function zodiac(id) { return Z.ZODIAC.filter(function (z) { return z.id === id; })[0]; }
  function find(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }

  function petHTML(s) {
    return P.petSVG(s.user.zodiac, { color: s.user.color, equip: s.pet.equip, level: S.level(), label: s.user.petName });
  }

  function speech(s) {
    var p = s.pet, z = zodiac(s.user.zodiac);
    if (p.full < 30) return '배고파요… 맛있는 거 주세요 🥺';
    if (p.happy < 30) return '심심해요! 같이 놀아요 ⚽';
    var trip = (s.trips || []).filter(function (t) { return UI.dday(t.start) !== '다녀옴'; })[0];
    if (trip) return trip.title + ' ' + UI.dday(trip.start) + '! 벌써 설레요 ✨';
    var rec = s.records[0];
    if (rec) return rec.regionName.split(' ').pop() + ' 또 가고 싶다~ 다음엔 어디 갈까요?';
    if (!Object.keys(s.room.items).length) return '방이 조금 허전해요. 여행 다녀와서 꾸며줄래요?';
    return z.style + ' 좋아해요! 같이 떠나요 🧳';
  }

  function render(root) {
    var s = S.get();
    S.tick();
    var z = zodiac(s.user.zodiac);
    var wall = find(P.WALLPAPERS, s.room.wall) || P.WALLPAPERS[0];
    var floor = find(P.FLOORS, s.room.floor) || P.FLOORS[0];
    root.innerHTML =
      '<div class="room" id="room">' +
      '<div class="room-wall" style="background:' + wall.css + '"></div>' +
      '<div class="room-floor" style="background:' + floor.css + '"></div>' +
      '<div class="room-items" id="room-items"></div>' +
      '<div class="home-top">' +
      '<div class="glass name-card"><div class="n">' + UI.esc(s.user.petName) + ' <span class="badge pink" style="vertical-align:3px">Lv.' + S.level() + '</span></div>' +
      '<div class="s">' + z.ko + '띠 · ' + z.trait + '</div></div>' +
      '<div class="row" style="gap:8px"><div class="glass coin" aria-label="보유 코인">🪙 <span id="coin">' + s.coins.toLocaleString() + '</span></div>' +
      '<button class="icon-btn glass" id="settings" aria-label="설정">⚙️</button></div></div>' +
      '<div class="home-stats">' +
      stat('😊 행복도', s.pet.happy, '') + stat('🍙 포만감', s.pet.full, 'mint') + '</div>' +
      '<div class="bubble" id="bubble">' + UI.esc(speech(s)) + '</div>' +
      '<div class="pet-stage" id="pet" role="button" tabindex="0" aria-label="' + UI.esc(s.user.petName) + ' 쓰다듬기">' + petHTML(s) + '</div>' +
      '<div class="home-actions" id="actions">' +
      act('feed', '🍙', '먹이주기', 'var(--butter-soft)') + act('play', '⚽', '놀아주기', 'var(--mint-soft)') +
      act('dress', '🎀', '펫 꾸미기', 'var(--pink-soft)') + act('room', '🛋️', '방 꾸미기', 'var(--sky-soft)') + '</div>' +
      '</div>';
    drawItems(root);
    bind(root);
  }
  function stat(label, v, cls) {
    return '<div class="glass stat"><div class="row"><span>' + label + '</span><span>' + Math.round(v) + '%</span></div><div class="bar ' + cls + '"><i style="width:' + Math.round(v) + '%"></i></div></div>';
  }
  function act(id, e, label, bg) {
    return '<button class="act" data-act="' + id + '"><span class="e" style="background:' + bg + '">' + e + '</span>' + label + '</button>';
  }

  function drawItems(root) {
    var s = S.get(), box = root.querySelector('#room-items');
    box.innerHTML = '';
    Object.keys(s.room.items).forEach(function (id) {
      var f = find(P.FURNITURE, id); if (!f) return;
      var pos = s.room.items[id];
      var el = document.createElement('div');
      el.className = 'furn';
      el.dataset.id = id;
      el.style.left = pos.x + '%'; el.style.top = pos.y + '%'; el.style.width = f.w + '%';
      el.style.zIndex = f.floor ? 1 : 2;
      el.innerHTML = f.svg;
      el.setAttribute('aria-label', f.name);
      box.appendChild(el);
    });
  }

  function refresh(root) {
    var s = S.get();
    root.querySelector('#coin').textContent = s.coins.toLocaleString();
    var stats = root.querySelector('.home-stats');
    stats.innerHTML = stat('😊 행복도', s.pet.happy, '') + stat('🍙 포만감', s.pet.full, 'mint');
    root.querySelector('#pet').innerHTML = petHTML(s);
    root.querySelector('#bubble').textContent = speech(s);
    document.dispatchEvent(new CustomEvent('tp:pet-changed'));
  }

  function animate(root, cls, emoji, text) {
    var pet = root.querySelector('#pet');
    pet.classList.remove('hop', 'wiggle', 'sway', 'eat');
    void pet.offsetWidth;
    pet.classList.add(cls);
    setTimeout(function () { pet.classList.remove(cls); }, 1800);
    if (emoji) {
      for (var i = 0; i < 3; i++) {
        var fx = document.createElement('span');
        fx.className = 'fx'; fx.textContent = emoji;
        var r = pet.getBoundingClientRect(), rr = root.querySelector('#room').getBoundingClientRect();
        fx.style.left = (r.left - rr.left + r.width * (0.3 + i * 0.2)) + 'px';
        fx.style.top = (r.top - rr.top + r.height * 0.25) + 'px';
        fx.style.animationDelay = (i * 0.18) + 's';
        root.querySelector('#room').appendChild(fx);
        setTimeout(function (el) { el.remove(); }.bind(null, fx), 1700);
      }
    }
    if (text) root.querySelector('#bubble').textContent = text;
  }

  function bind(root) {
    var pet = root.querySelector('#pet');
    var pat = function () { S.care(0, 2, 1); animate(root, 'wiggle', '💗', '히히, 간지러워요!'); setTimeout(function () { refresh(root); }, 1600); };
    pet.onclick = pat;
    pet.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pat(); } };
    root.querySelector('#settings').onclick = function () { global.TPApp.openSettings(); };
    UI.$$('[data-act]', root).forEach(function (b) {
      b.onclick = function () { ({ feed: feed, play: play, dress: dress, room: decorate })[b.dataset.act](root); };
    });
  }

  /* ---------- 먹이주기 ---------- */
  function feed(root) {
    var s = S.get(), today = new Date().toISOString().slice(0, 10);
    var html = '<p class="muted">포만감 ' + Math.round(s.pet.full) + '% · 보유 🪙 ' + s.coins.toLocaleString() + '</p><div class="shop-grid">' +
      P.FOODS.map(function (f) {
        var free = f.price === 0, used = free && s.pet.freeFood === today;
        return '<button class="shop-item" data-food="' + f.id + '" ' + (used ? 'disabled style="opacity:.45"' : '') + '><span class="ic">' + f.emoji + '</span>' + f.name +
          '<span class="p">' + (free ? (used ? '내일 또 받아요' : '오늘 무료') : '🪙 ' + f.price) + ' · 포만 +' + f.full + '</span></button>';
      }).join('') + '</div>';
    var b = UI.openSheet('먹이주기', html);
    UI.$$('[data-food]', b).forEach(function (el) {
      el.onclick = function () {
        var f = find(P.FOODS, el.dataset.food);
        if (s.pet.full >= 100) { UI.toast(s.user.petName + '는 지금 배불러요!'); return; }
        if (f.price === 0) s.pet.freeFood = today;
        else if (!S.spend(f.price)) { UI.toast('코인이 부족해요. 여행 기록을 남기면 코인을 받아요!'); return; }
        var up = S.care(f.full, f.happy, 5);
        UI.closeSheet();
        animate(root, 'eat', f.emoji, '냠냠! ' + f.name + ' 최고예요 😋');
        setTimeout(function () { refresh(root); if (up) levelUp(root); }, 1600);
      };
    });
  }

  /* ---------- 놀아주기 ---------- */
  function play(root) {
    var s = S.get();
    var b = UI.openSheet('놀아주기', '<p class="muted">행복도 ' + Math.round(s.pet.happy) + '% · 놀면 배가 조금 고파져요</p><div class="shop-grid">' +
      P.TOYS.map(function (t) { return '<button class="shop-item" data-toy="' + t.id + '"><span class="ic">' + t.emoji + '</span>' + t.name + '<span class="p">행복 +' + t.happy + '</span></button>'; }).join('') + '</div>');
    UI.$$('[data-toy]', b).forEach(function (el) {
      el.onclick = function () {
        var t = find(P.TOYS, el.dataset.toy);
        if (s.pet.full < 10) { UI.toast('너무 배고파서 못 놀겠대요. 먹이를 먼저 주세요!'); return; }
        var up = S.care(-5, t.happy, 8);
        UI.closeSheet();
        animate(root, t.anim, t.emoji, ['신난다!', '한 번 더!', '최고의 하루예요!'][Math.floor(Math.random() * 3)]);
        setTimeout(function () { refresh(root); if (up) levelUp(root); }, 1700);
      };
    });
  }

  function levelUp(root) {
    var lv = S.level();
    var extra = lv === 3 ? ' 반짝이가 생겼어요!' : lv === 6 ? ' 빛나는 오라가 생겼어요!' : lv === 9 ? ' 천사 링이 생겼어요!' : '';
    UI.toast('🎉 레벨 업! Lv.' + lv + extra);
    animate(root, 'hop', '🎉');
  }

  /* ---------- 펫 꾸미기 ---------- */
  function dress(root) {
    var s = S.get(), tab = 'color';
    function draw() {
      var html = '<div class="big-pet" style="width:180px;height:180px">' + petHTML(s) + '</div>' +
        '<div class="chips" role="tablist">' + [['color', '🎨 색상']].concat(P.SLOTS.map(function (x) { return [x.id, x.name]; })).map(function (t) {
          return '<button class="chip" role="tab" data-tab="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + t[1] + '</button>';
        }).join('') + '</div>';
      if (tab === 'color') {
        html += '<div class="colors">' + P.PALETTE.map(function (p) {
          return '<button type="button" class="swatch" data-color="' + p.hex + '" aria-pressed="' + (p.hex === s.user.color) + '" aria-label="' + p.name + '" style="background:' + p.hex + '"></button>';
        }).join('') + '</div><p class="hint">색 변경은 무료예요</p>';
      } else {
        var items = P.ACCESSORIES.filter(function (a) { return a.slot === tab; });
        html += '<div class="shop-grid">' + items.map(function (a) {
          var own = s.pet.owned.indexOf(a.id) !== -1, on = s.pet.equip[tab] === a.id;
          return '<button class="shop-item ' + (on ? 'on' : '') + (own ? '' : ' locked') + '" data-acc="' + a.id + '"><span class="ic"><svg viewBox="20 -10 160 190">' + a.svg + '</svg></span>' + a.name +
            '<span class="p">' + (on ? '착용 중' : own ? '보유 중' : '🪙 ' + a.price) + '</span></button>';
        }).join('') + '</div>';
      }
      html += '<p class="hint">보유 🪙 ' + s.coins.toLocaleString() + ' · 여행 기록 1건마다 🪙100</p>';
      var b = UI.openSheet('펫 꾸미기', html, { onClose: function () { refresh(root); } });
      UI.$$('[data-tab]', b).forEach(function (el) { el.onclick = function () { tab = el.dataset.tab; draw(); }; });
      UI.$$('[data-color]', b).forEach(function (el) { el.onclick = function () { s.user.color = el.dataset.color; S.save(); draw(); }; });
      UI.$$('[data-acc]', b).forEach(function (el) {
        el.onclick = function () {
          var a = find(P.ACCESSORIES, el.dataset.acc);
          if (s.pet.owned.indexOf(a.id) === -1) {
            if (!S.spend(a.price)) { UI.toast('코인이 ' + (a.price - s.coins) + ' 부족해요. 여행을 기록해보세요!'); return; }
            s.pet.owned.push(a.id);
            UI.toast(a.name + ' 구입 완료! 🎁');
          }
          s.pet.equip[a.slot] = s.pet.equip[a.slot] === a.id ? null : a.id;
          S.save(); draw();
        };
      });
    }
    draw();
  }

  /* ---------- 방 꾸미기 ---------- */
  function decorate(root) {
    var s = S.get(), tab = 'furn';
    function draw() {
      var html = '<div class="chips">' + [['furn', '🪑 가구·소품'], ['wall', '🖼️ 벽지'], ['floor', '🟫 바닥']].map(function (t) {
        return '<button class="chip" data-tab="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + t[1] + '</button>';
      }).join('') + '</div><div class="shop-grid">';
      if (tab === 'furn') {
        html += P.FURNITURE.map(function (f) {
          var own = s.room.owned ? s.room.owned.indexOf(f.id) !== -1 : false, on = !!s.room.items[f.id];
          return '<button class="shop-item ' + (on ? 'on' : '') + '" data-furn="' + f.id + '"><span class="ic" style="padding:6px">' + f.svg + '</span>' + f.name +
            '<span class="p">' + (on ? '배치됨 · 빼기' : own ? '보관 중 · 놓기' : '🪙 ' + f.price) + '</span></button>';
        }).join('');
      } else {
        var list = tab === 'wall' ? P.WALLPAPERS : P.FLOORS, owned = tab === 'wall' ? s.room.ownedWall : s.room.ownedFloor, cur = tab === 'wall' ? s.room.wall : s.room.floor;
        html += list.map(function (w) {
          var own = owned.indexOf(w.id) !== -1;
          return '<button class="shop-item ' + (w.id === cur ? 'on' : '') + '" data-surf="' + w.id + '"><span class="ic" style="background:' + w.css + '"></span>' + w.name +
            '<span class="p">' + (w.id === cur ? '사용 중' : own ? '보유 중' : '🪙 ' + w.price) + '</span></button>';
        }).join('');
      }
      html += '</div><p class="hint">보유 🪙 ' + s.coins.toLocaleString() + '</p>' +
        '<button class="btn sky block" id="arrange">✋ 가구 위치 옮기기</button>';
      var b = UI.openSheet('방 꾸미기', html, { onClose: function () { render(root); } });
      UI.$$('[data-tab]', b).forEach(function (el) { el.onclick = function () { tab = el.dataset.tab; draw(); }; });
      UI.$$('[data-furn]', b).forEach(function (el) {
        el.onclick = function () {
          var f = find(P.FURNITURE, el.dataset.furn);
          s.room.owned = s.room.owned || [];
          if (s.room.items[f.id]) { delete s.room.items[f.id]; S.save(); draw(); return; }
          if (s.room.owned.indexOf(f.id) === -1) {
            if (!S.spend(f.price)) { UI.toast('코인이 ' + (f.price - s.coins) + ' 부족해요'); return; }
            s.room.owned.push(f.id);
            S.care(0, 8, 10);
            UI.toast(f.name + '을(를) 들였어요! ' + s.user.petName + '가 좋아해요 💕');
          }
          s.room.items[f.id] = { x: f.place[0], y: f.place[1] };
          S.save(); draw();
        };
      });
      UI.$$('[data-surf]', b).forEach(function (el) {
        el.onclick = function () {
          var list = tab === 'wall' ? P.WALLPAPERS : P.FLOORS, owned = tab === 'wall' ? s.room.ownedWall : s.room.ownedFloor;
          var w = find(list, el.dataset.surf);
          if (owned.indexOf(w.id) === -1) {
            if (!S.spend(w.price)) { UI.toast('코인이 ' + (w.price - s.coins) + ' 부족해요'); return; }
            owned.push(w.id); S.care(0, 6, 8);
          }
          if (tab === 'wall') s.room.wall = w.id; else s.room.floor = w.id;
          S.save(); draw();
        };
      });
      b.querySelector('#arrange').onclick = function () {
        if (!Object.keys(s.room.items).length) { UI.toast('먼저 가구를 하나 놓아주세요'); return; }
        UI.closeSheet();
        arrange(root);
      };
    }
    draw();
  }

  /* 가구 끌어서 옮기기 */
  function arrange(root) {
    var room = root.querySelector('#room'), s = S.get();
    room.classList.add('editing');
    root.querySelector('#actions').hidden = true;
    root.querySelector('#bubble').hidden = true;
    var bar = document.createElement('div');
    bar.className = 'glass edit-bar';
    bar.innerHTML = '<strong>가구를 끌어서 옮겨보세요</strong><button class="btn small" id="done">완료</button>';
    room.appendChild(bar);
    var drag = null;
    UI.$$('.furn', room).forEach(function (el) {
      el.onpointerdown = function (e) {
        var r = room.getBoundingClientRect(), er = el.getBoundingClientRect();
        drag = { el: el, dx: e.clientX - er.left, dy: e.clientY - er.top, r: r };
        el.classList.add('dragging');
        el.setPointerCapture(e.pointerId);
      };
      el.onpointermove = function (e) {
        if (!drag || drag.el !== el) return;
        var x = (e.clientX - drag.r.left - drag.dx) / drag.r.width * 100;
        var y = (e.clientY - drag.r.top - drag.dy) / drag.r.height * 100;
        x = Math.max(-5, Math.min(95, x)); y = Math.max(0, Math.min(92, y));
        el.style.left = x + '%'; el.style.top = y + '%';
        s.room.items[el.dataset.id] = { x: +x.toFixed(1), y: +y.toFixed(1) };
      };
      el.onpointerup = el.onpointercancel = function () { if (drag) drag.el.classList.remove('dragging'); drag = null; };
    });
    bar.querySelector('#done').onclick = function () { S.save(); UI.toast('방 배치를 저장했어요 🏠'); render(root); };
  }

  global.TPHome = { render: render };
})(window);
