/* 회원가입: 이름·생년월일 → 띠 자동 결정 → 펫 색 고르기 → 펫 이름 */
(function (global) {
  'use strict';
  var UI = global.TPUI, P = global.TPPets, Z = global.TPZodiac;

  function render(root, done) {
    var form = { name: '', birth: '', birthText: '', zodiac: null, color: null, petName: '', override: null };
    var step = 1;

    function zodiacOf() {
      if (form.override) return Z.ZODIAC.filter(function (z) { return z.id === form.override; })[0];
      if (!form.birth) return null;
      var r = Z.fromBirth(form.birth);
      return r && r.zodiac;
    }

    function resultHTML() {
      var z = zodiacOf();
      if (!z) return '';
      var color = form.color || P.DEFAULT_COLOR[z.id];
      var info = form.birth ? Z.fromBirth(form.birth) : null;
      return '<div class="zodiac-result"><div class="pv">' + P.petSVG(z.id, { color: color }) + '</div><div class="stack" style="gap:4px">' +
        '<span class="badge pink">' + z.hanja + ' · ' + z.ko + '띠</span><strong style="font-size:20px">' + z.name + '</strong>' +
        '<span class="muted" style="font-size:15px">' + z.trait + '</span>' +
        (info && info.beforeSeollal && !form.override ? '<span class="hint">설날(' + info.seollal.m + '월 ' + info.seollal.d + '일) 전에 태어나 ' + info.year + '년 띠로 정해졌어요</span>' : '') +
        '</div></div><button type="button" class="btn ghost small" id="f-other" style="align-self:flex-start">내 띠가 다른가요?</button>';
    }

    // 숫자만 입력하면 '2000.05.05' 형태로 점을 자동으로 넣는다
    function formatBirth(raw) {
      var d = raw.replace(/[^0-9]/g, '').slice(0, 8);
      if (d.length > 6) return d.slice(0, 4) + '.' + d.slice(4, 6) + '.' + d.slice(6);
      if (d.length > 4) return d.slice(0, 4) + '.' + d.slice(4);
      return d;
    }
    function parseBirth(text) {
      var d = text.replace(/[^0-9]/g, '');
      if (d.length !== 8) return { ok: false };
      var y = +d.slice(0, 4), m = +d.slice(4, 6), day = +d.slice(6, 8);
      var dt = new Date(y, m - 1, day);
      if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== day) return { ok: false, msg: '없는 날짜예요. 다시 확인해주세요' };
      if (y < 1920 || dt > new Date()) return { ok: false, msg: '1920년부터 오늘까지의 날짜를 입력해주세요' };
      return { ok: true, iso: d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6, 8) };
    }
    // 입력칸은 그대로 두고 결과 카드만 바꿔서 입력이 끊기지 않게
    function updateResult() {
      var box = root.querySelector('#z-result'); if (!box) return;
      box.innerHTML = resultHTML();
      root.querySelector('#f-next').disabled = !zodiacOf();
      bindOther();
    }
    function bindOther() {
      var b = root.querySelector('#f-other');
      if (!b) return;
      b.onclick = function () {
        var sh = UI.openSheet('띠 직접 고르기', '<p class="muted">음력 생일 기준으로 띠가 다르다면 직접 골라주세요.</p><div class="dex-grid">' +
          Z.ZODIAC.map(function (z) { return '<button class="dex-card" data-z="' + z.id + '"><div class="pv">' + P.petSVG(z.id) + '</div><span class="n">' + z.ko + '</span></button>'; }).join('') + '</div>');
        UI.$$('[data-z]', sh).forEach(function (el) {
          el.onclick = function () { form.override = el.dataset.z; form.color = null; UI.closeSheet(); updateResult(); };
        });
      };
    }

    function draw() {
      var z = zodiacOf();
      var color = form.color || (z && P.DEFAULT_COLOR[z.id]);
      var html = '<div class="onb"><div class="steps" aria-label="' + step + '/3 단계"><i class="on"></i><i class="' + (step > 1 ? 'on' : '') + '"></i><i class="' + (step > 2 ? 'on' : '') + '"></i></div>';
      if (step === 1) {
        html += '<div><p class="eyebrow">여행펫 가입하기</p><h1>생년월일을 알려주시면<br>내 띠 펫이 찾아와요</h1></div>' +
          '<label class="field"><span>이름 (닉네임)</span><input class="input" id="f-name" maxlength="12" placeholder="예: 여행자" value="' + UI.esc(form.name) + '" autocomplete="nickname"></label>' +
          '<label class="field"><span>생년월일 (숫자 8자리)</span><input class="input" id="f-birth" type="text" inputmode="numeric" autocomplete="bday" maxlength="10" placeholder="예: 2000.05.05" value="' + UI.esc(form.birthText) + '" aria-describedby="f-birth-msg"></label>' +
          '<p class="hint" id="f-birth-msg" style="margin-top:-12px">숫자만 입력하면 점(.)은 자동으로 들어가요</p>' +
          '<div id="z-result" class="stack" style="gap:12px">' + resultHTML() + '</div>';
        html += '<div style="flex:1"><button class="btn block" id="f-next" ' + (z ? '' : 'disabled') + '>다음</button>' +
          '<button type="button" class="btn ghost block" id="f-demo">예시(용띠)로 바로 둘러보기</button>';
      } else if (step === 2) {
        html += '<div><p class="eyebrow">' + z.ko + '띠 펫이 왔어요!</p><h1>' + z.name + '의 색을<br>골라주세요</h1></div>' +
          '<div class="big-pet">' + P.petSVG(z.id, { color: color }) + '</div>' +
          '<div class="colors" role="group" aria-label="펫 색상">' + P.PALETTE.map(function (p) {
            return '<button type="button" class="swatch" data-color="' + p.hex + '" aria-pressed="' + (p.hex === color) + '" aria-label="' + p.name + '" style="background:' + p.hex + '"></button>';
          }).join('') + '</div><p class="hint" style="text-align:center">색은 나중에 펫 꾸미기에서 언제든 바꿀 수 있어요</p>' +
          '<div style="flex:1"></div><div class="grid2"><button class="btn ghost" id="f-back">이전</button><button class="btn" id="f-next">다음</button></div>';
      } else {
        html += '<div><p class="eyebrow">마지막 단계</p><h1>펫의 이름을<br>지어주세요</h1></div>' +
          '<div class="big-pet">' + P.petSVG(z.id, { color: color }) + '</div>' +
          '<label class="field"><span>펫 이름</span><input class="input" id="f-pet" maxlength="10" value="' + UI.esc(form.petName || z.name) + '"></label>' +
          '<div style="flex:1"></div><div class="grid2"><button class="btn ghost" id="f-back">이전</button><button class="btn" id="f-next">함께 여행 시작!</button></div>';
      }
      root.innerHTML = html + '</div>';
      bind();
    }

    function bind() {
      var $ = function (s) { return root.querySelector(s); };
      if ($('#f-name')) $('#f-name').oninput = function (e) { form.name = e.target.value; };
      var bi = $('#f-birth');
      if (bi) bi.oninput = function () {
        var f = formatBirth(bi.value);
        if (f !== bi.value) bi.value = f;
        form.birthText = f;
        var r = parseBirth(f), msg = $('#f-birth-msg');
        var next = r.ok ? r.iso : '';
        if (next !== form.birth) { form.birth = next; form.override = null; form.color = null; updateResult(); }
        msg.textContent = r.msg || '숫자만 입력하면 점(.)은 자동으로 들어가요';
        msg.style.color = r.msg ? '#B3261E' : '';
      };
      bindOther();
      if ($('#f-demo')) $('#f-demo').onclick = function () { done(global.TPData.demoState()); };
      UI.$$('[data-color]', root).forEach(function (b) { b.onclick = function () { form.color = b.dataset.color; draw(); }; });
      if ($('#f-pet')) $('#f-pet').oninput = function (e) { form.petName = e.target.value; };
      if ($('#f-back')) $('#f-back').onclick = function () { step--; draw(); };
      $('#f-next').onclick = function () {
        var z = zodiacOf();
        if (step === 1) {
          if (!form.name.trim()) { UI.toast('이름을 입력해주세요'); $('#f-name').focus(); return; }
          if (!z) { UI.toast('생년월일 8자리를 입력해주세요'); $('#f-birth').focus(); return; }
          step = 2; draw(); return;
        }
        if (step === 2) { form.color = form.color || P.DEFAULT_COLOR[z.id]; step = 3; draw(); return; }
        var s = global.TPData.demoState();
        // 새 계정은 기록·계획 없이 시작하고, 첫 꾸미기를 위해 코인 300을 준다
        s.user = { name: form.name.trim(), birth: form.birth, zodiac: z.id, petName: (form.petName || z.name).trim(), color: form.color, joined: new Date().toISOString().slice(0, 10) };
        s.coins = 300; s.records = []; s.trips = []; s.pet.exp = 0; s.pet.full = 70; s.pet.happy = 80;
        done(s);
      };
    }
    draw();
  }

  global.TPOnboarding = { render: render };
})(window);
