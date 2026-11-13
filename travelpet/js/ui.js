/* 화면 공통 도구: 토스트, 바텀시트, 이스케이프, 사진 축소 */
(function (global) {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var tt;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(tt);
    tt = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  var onClose = null, lastFocus = null;
  function openSheet(title, html, opts) {
    opts = opts || {};
    lastFocus = document.activeElement;
    $('#sheet-title').textContent = title;
    var body = $('#sheet-body');
    if (typeof html === 'string') body.innerHTML = html; else { body.innerHTML = ''; body.appendChild(html); }
    $('#sheet').hidden = false;
    $('#sheet-dim').hidden = false;
    onClose = opts.onClose || null;
    setTimeout(function () {
      var f = body.querySelector('[autofocus]') || $('#sheet-close');
      f && f.focus();
    }, 60);
    return body;
  }
  function closeSheet() {
    if ($('#sheet').hidden) return;
    $('#sheet').hidden = true;
    $('#sheet-dim').hidden = true;
    var cb = onClose; onClose = null;
    if (cb) cb();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener('DOMContentLoaded', function () {
    $('#sheet-close').addEventListener('click', closeSheet);
    $('#sheet-dim').addEventListener('click', closeSheet);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
  });

  function confirmSheet(title, msg, okText, onOk) {
    var b = openSheet(title, '<p class="muted">' + esc(msg) + '</p><div class="grid2"><button class="btn ghost" data-no>취소</button><button class="btn" data-ok>' + esc(okText || '확인') + '</button></div>');
    b.querySelector('[data-no]').onclick = closeSheet;
    b.querySelector('[data-ok]').onclick = function () { closeSheet(); onOk(); };
  }

  // 사진 → 긴 변 720px JPEG data URL (저장 공간 절약)
  function shrinkImage(file, max) {
    max = max || 720;
    return new Promise(function (resolve) {
      var r = new FileReader();
      r.onload = function () {
        var img = new Image();
        img.onload = function () {
          var s = Math.min(1, max / Math.max(img.width, img.height));
          var c = document.createElement('canvas');
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.75));
        };
        img.onerror = function () { resolve(null); };
        img.src = r.result;
      };
      r.onerror = function () { resolve(null); };
      r.readAsDataURL(file);
    });
  }

  function fmtDate(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    return p[0] + '.' + p[1] + '.' + p[2];
  }
  function dday(iso) {
    var t = new Date(); t.setHours(0, 0, 0, 0);
    var d = new Date(iso + 'T00:00:00');
    var n = Math.round((d - t) / 86400000);
    return n > 0 ? 'D-' + n : n === 0 ? 'D-DAY' : '다녀옴';
  }
  function petMini(animal, color) {
    return global.TPPets.petSVG(animal, { color: color });
  }

  global.TPUI = { $: $, $$: $$, esc: esc, toast: toast, openSheet: openSheet, closeSheet: closeSheet, confirm: confirmSheet, shrinkImage: shrinkImage, fmtDate: fmtDate, dday: dday, petMini: petMini };
})(window);
