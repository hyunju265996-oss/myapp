/* 상태 저장소 (브라우저 localStorage) */
(function (global) {
  'use strict';
  var KEY = 'travelpet:v1';
  var state = null;
  var listeners = [];

  function load() {
    try { state = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { state = null; }
    return state;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { global.TPUI && global.TPUI.toast('저장 공간이 부족해요. 사진 몇 장을 지워주세요.'); }
    listeners.forEach(function (fn) { fn(state); });
  }
  function set(s) { state = s; save(); }
  function get() { return state; }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} state = null; }
  function onChange(fn) { listeners.push(fn); }

  /* 시간이 지나면 배고프고 심심해진다 (시간당 포만 -4, 행복 -3, 최소 5) */
  function tick() {
    if (!state) return;
    var p = state.pet, now = Date.now();
    var h = (now - (p.last || now)) / 3600000;
    if (h > 0.02) {
      p.full = Math.max(5, p.full - h * 4);
      p.happy = Math.max(5, p.happy - h * 3);
      p.last = now;
    }
  }

  function level() { return Math.floor((state.pet.exp || 0) / 100) + 1; }
  function addExp(n) {
    var before = level();
    state.pet.exp = (state.pet.exp || 0) + n;
    return level() > before;
  }
  function clamp(v) { return Math.max(0, Math.min(100, v)); }

  // 펫 상태 변경 (포만/행복/경험치)
  function care(full, happy, exp) {
    var p = state.pet;
    p.full = clamp(p.full + (full || 0));
    p.happy = clamp(p.happy + (happy || 0));
    var up = addExp(exp || 0);
    save();
    return up;
  }

  /* 여행 기록 보상: 기록 1건 +100코인, 처음 가 본 지역이면 +50 추가 */
  function addRecord(rec) {
    var first = !state.records.some(function (r) { return r.region === rec.region; });
    rec.id = 'r' + Date.now().toString(36);
    state.records.unshift(rec);
    var reward = 100 + (first ? 50 : 0);
    state.coins += reward;
    state.pet.happy = clamp(state.pet.happy + 15);
    var up = addExp(40);
    save();
    return { reward: reward, first: first, levelUp: up };
  }

  function spend(n) {
    if (state.coins < n) return false;
    state.coins -= n;
    return true;
  }

  global.TPStore = {
    load: load, save: save, set: set, get: get, reset: reset, onChange: onChange,
    tick: tick, level: level, care: care, addRecord: addRecord, spend: spend
  };
})(window);
