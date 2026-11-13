/* 12간지 펫 도감 */
(function (global) {
  'use strict';
  var UI = global.TPUI, P = global.TPPets, Z = global.TPZodiac, S = global.TPStore;

  function render(root) {
    var s = S.get(), mine = s.user.zodiac;
    var me = Z.ZODIAC.filter(function (z) { return z.id === mine; })[0];
    root.innerHTML = '<div class="page"><div class="page-head"><div><p class="eyebrow">12간지 친구들</p><h1>여행펫 도감</h1></div></div>' +
      '<div class="card row" style="background:linear-gradient(135deg,var(--pink-soft),var(--lav-soft))"><div class="pv" style="width:96px;height:96px;flex-shrink:0">' + P.petSVG(mine, { color: s.user.color, equip: s.pet.equip }) + '</div>' +
      '<div class="stack" style="gap:2px"><span class="badge pink" style="align-self:flex-start">나의 펫 · ' + me.hanja + ' ' + me.ko + '띠</span><strong style="font-size:20px">' + UI.esc(s.user.petName) + '</strong><span class="muted" style="font-size:15px">' + me.trait + '</span><span class="hint">생일 ' + UI.fmtDate(s.user.birth) + '</span></div></div>' +
      '<p class="muted">태어난 해의 띠에 따라 가입할 때 펫이 정해져요. 친구들의 펫도 구경해보세요!</p>' +
      '<div class="dex-grid">' + Z.ZODIAC.map(function (z) {
        return '<button class="dex-card' + (z.id === mine ? ' mine' : '') + '" data-z="' + z.id + '"><div class="pv">' + P.petSVG(z.id, { color: z.id === mine ? s.user.color : null }) + '</div>' +
          '<span class="k">' + z.hanja + ' · ' + z.ko + '</span><span class="n">' + z.name + '</span></button>';
      }).join('') + '</div></div>';
    UI.$$('[data-z]', root).forEach(function (b) { b.onclick = function () { detail(b.dataset.z); }; });
  }

  function detail(id) {
    var z = Z.ZODIAC.filter(function (x) { return x.id === id; })[0];
    var color = P.DEFAULT_COLOR[id];
    var years = []; for (var y = 1960; y <= 2031; y++) if (((y - 4) % 12 + 12) % 12 === Z.ZODIAC.indexOf(z)) years.push(y);
    function draw() {
      var b = UI.openSheet(z.name + ' · ' + z.ko + '띠',
        '<div class="big-pet">' + P.petSVG(id, { color: color }) + '</div>' +
        '<div class="colors">' + P.PALETTE.map(function (p) { return '<button class="swatch" data-c="' + p.hex + '" aria-pressed="' + (p.hex === color) + '" aria-label="' + p.name + '" style="background:' + p.hex + '"></button>'; }).join('') + '</div>' +
        '<div class="card stack" style="gap:6px"><div class="row between"><span class="muted">성격</span><strong>' + z.trait + '</strong></div><div class="row between"><span class="muted">좋아하는 여행</span><strong>' + z.style + '</strong></div>' +
        '<div class="row between" style="align-items:flex-start"><span class="muted">해당 연도</span><strong style="text-align:right;font-size:15px">' + years.join(', ') + '</strong></div></div>' +
        '<p class="hint">1~2월생은 설날 이전이면 전 해의 띠예요</p>');
      UI.$$('[data-c]', b).forEach(function (el) { el.onclick = function () { color = el.dataset.c; draw(); }; });
    }
    draw();
  }

  global.TPDex = { render: render };
})(window);
