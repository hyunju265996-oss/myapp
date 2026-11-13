/* 12간지 펫 캐릭터 · 꾸미기 아이템 · 방 아이템 (모두 SVG, 색 변경 가능)
 * 좌표계: 200 x 200. 머리 중심 (100, 92), 몸통 중심 (100, 150).
 */
(function (global) {
  'use strict';

  /* ---------- 색 유틸 ---------- */
  function hexToHsl(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, s = 0, hu = 0;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      hu = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      hu *= 60;
    }
    return [hu, s * 100, l * 100];
  }
  function hsl(h, s, l) { return 'hsl(' + Math.round(h) + ',' + Math.round(Math.max(0, Math.min(100, s))) + '%,' + Math.round(Math.max(0, Math.min(100, l))) + '%)'; }
  function shades(hex) {
    var c = hexToHsl(hex);
    return {
      main: hex,
      dark: hsl(c[0], c[1] * 0.75, c[2] - 22),
      mid: hsl(c[0], c[1] * 0.9, c[2] - 9),
      light: hsl(c[0], c[1] * 0.8, Math.min(97, c[2] + 13)),
      line: hsl(c[0], Math.min(40, c[1] * 0.5), Math.max(18, c[2] - 50))
    };
  }

  var INK = '#3A3034';
  var BLUSH = '#FF9EB5';

  // 처음 색을 고를 수 있는 파스텔 팔레트
  var PALETTE = [
    { id: 'mint', name: '민트', hex: '#A7E4D3' },
    { id: 'pink', name: '벚꽃', hex: '#F7B9CA' },
    { id: 'peach', name: '복숭아', hex: '#FFCBAA' },
    { id: 'butter', name: '버터', hex: '#F8E3A0' },
    { id: 'sky', name: '하늘', hex: '#B5DAF4' },
    { id: 'lavender', name: '라벤더', hex: '#D4CCF4' },
    { id: 'coral', name: '코랄', hex: '#FFB3A3' },
    { id: 'cream', name: '크림', hex: '#F3E6D6' },
    { id: 'cloud', name: '구름', hex: '#E4E2EC' }
  ];
  var DEFAULT_COLOR = {
    rat: '#E4E2EC', ox: '#F3E6D6', tiger: '#FFCBAA', rabbit: '#F7B9CA', dragon: '#A7E4D3', snake: '#B5DAF4',
    horse: '#F8E3A0', sheep: '#F3E6D6', monkey: '#FFCBAA', rooster: '#F8E3A0', dog: '#F3E6D6', pig: '#F7B9CA'
  };

  /* ---------- 공통 몸 ---------- */
  function eyes(y) {
    y = y || 96;
    return '<g class="pet-eyes">' +
      '<ellipse cx="78" cy="' + y + '" rx="7.5" ry="9" fill="' + INK + '"/><ellipse cx="122" cy="' + y + '" rx="7.5" ry="9" fill="' + INK + '"/>' +
      '<circle cx="80.8" cy="' + (y - 3.4) + '" r="3" fill="#fff"/><circle cx="124.8" cy="' + (y - 3.4) + '" r="3" fill="#fff"/>' +
      '<circle cx="76" cy="' + (y + 3.5) + '" r="1.4" fill="#fff"/><circle cx="120" cy="' + (y + 3.5) + '" r="1.4" fill="#fff"/></g>';
  }
  function blush(y) {
    y = y || 112;
    return '<ellipse cx="62" cy="' + y + '" rx="9" ry="5.5" fill="' + BLUSH + '" opacity=".55"/><ellipse cx="138" cy="' + y + '" rx="9" ry="5.5" fill="' + BLUSH + '" opacity=".55"/>';
  }
  function mouth(y) {
    y = y || 108;
    return '<path d="M92 ' + y + ' q4 5.5 8 0 q4 5.5 8 0" fill="none" stroke="' + INK + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function head(c, rx, ry) {
    return '<ellipse cx="100" cy="92" rx="' + (rx || 58) + '" ry="' + (ry || 51) + '" fill="' + c.main + '"/>' +
      '<ellipse cx="100" cy="92" rx="' + (rx || 58) + '" ry="' + (ry || 51) + '" fill="none" stroke="' + c.mid + '" stroke-width="2" opacity=".55"/>';
  }
  function body(c, opts) {
    opts = opts || {};
    var s = '';
    // 그림자
    s += '<ellipse cx="100" cy="190" rx="46" ry="6.5" fill="#2D2627" opacity=".09"/>';
    if (!opts.noFeet) s += '<ellipse cx="80" cy="180" rx="14" ry="9" fill="' + c.mid + '"/><ellipse cx="120" cy="180" rx="14" ry="9" fill="' + c.mid + '"/>';
    s += '<ellipse cx="100" cy="150" rx="40" ry="34" fill="' + c.main + '"/>';
    s += '<ellipse cx="100" cy="157" rx="25" ry="21" fill="' + (opts.belly || c.light) + '"/>';
    if (!opts.noArms) s += '<ellipse cx="63" cy="150" rx="10" ry="14" transform="rotate(25 63 150)" fill="' + c.mid + '"/><ellipse cx="137" cy="150" rx="10" ry="14" transform="rotate(-25 137 150)" fill="' + c.mid + '"/>';
    return s;
  }
  function face(c, o) {
    o = o || {};
    return eyes(o.eyeY) + blush(o.blushY) + (o.noMouth ? '' : mouth(o.mouthY));
  }

  /* ---------- 12간지 ---------- */
  var DRAW = {
    rat: function (c) {
      return '<path d="M138 168 q34 4 30 -18 q-3 -14 -14 -8" fill="none" stroke="' + c.mid + '" stroke-width="5" stroke-linecap="round"/>' +
        '<circle cx="52" cy="50" r="25" fill="' + c.main + '"/><circle cx="52" cy="50" r="15" fill="#FFC3D1"/>' +
        '<circle cx="148" cy="50" r="25" fill="' + c.main + '"/><circle cx="148" cy="50" r="15" fill="#FFC3D1"/>' +
        body(c) + head(c, 56, 49) + face(c, { mouthY: 112 }) +
        '<ellipse cx="100" cy="106" rx="5.5" ry="4" fill="#FF9EB5"/>' +
        '<g stroke="' + c.dark + '" stroke-width="1.6" stroke-linecap="round" opacity=".6"><path d="M70 108 l-18 -3"/><path d="M70 113 l-17 3"/><path d="M130 108 l18 -3"/><path d="M130 113 l17 3"/></g>';
    },
    ox: function (c) {
      return '<path d="M64 56 q-20 -8 -18 -30 q10 12 26 16 z" fill="#F6E7B8" stroke="#E2CC8C" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M136 56 q20 -8 18 -30 q-10 12 -26 16 z" fill="#F6E7B8" stroke="#E2CC8C" stroke-width="2" stroke-linejoin="round"/>' +
        '<ellipse cx="40" cy="84" rx="17" ry="9" transform="rotate(-18 40 84)" fill="' + c.mid + '"/><ellipse cx="160" cy="84" rx="17" ry="9" transform="rotate(18 160 84)" fill="' + c.mid + '"/>' +
        body(c) + head(c) +
        '<path d="M88 44 q6 -10 12 0 q6 -10 12 0" fill="' + c.dark + '" opacity=".55"/>' +
        eyes(90) + blush(108) +
        '<ellipse cx="100" cy="116" rx="27" ry="16" fill="' + c.light + '"/>' +
        '<ellipse cx="91" cy="113" rx="3" ry="4" fill="' + c.dark + '"/><ellipse cx="109" cy="113" rx="3" ry="4" fill="' + c.dark + '"/>' +
        '<path d="M94 123 q6 4 12 0" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/>';
    },
    tiger: function (c) {
      var st = c.dark;
      return '<path d="M138 170 q30 0 28 -26" fill="none" stroke="' + c.main + '" stroke-width="9" stroke-linecap="round"/>' +
        '<path d="M160 158 l9 2 M163 148 l8 -1" stroke="' + st + '" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="56" cy="52" r="17" fill="' + c.main + '"/><circle cx="56" cy="52" r="9" fill="' + c.light + '"/>' +
        '<circle cx="144" cy="52" r="17" fill="' + c.main + '"/><circle cx="144" cy="52" r="9" fill="' + c.light + '"/>' +
        body(c) + head(c) +
        '<g fill="' + st + '" opacity=".7"><path d="M92 46 h16 v4 h-16z"/><path d="M90 55 h20 v4 h-20z"/><path d="M98 44 h4 v18 h-4z"/>' +
        '<path d="M43 88 q10 2 16 6 q-9 0 -16 -2z"/><path d="M45 100 q9 0 14 3 q-8 2 -14 0z"/>' +
        '<path d="M157 88 q-10 2 -16 6 q9 0 16 -2z"/><path d="M155 100 q-9 0 -14 3 q8 2 14 0z"/>' +
        '<path d="M86 146 q14 4 28 0 q-14 8 -28 0z"/></g>' +
        '<ellipse cx="100" cy="112" rx="17" ry="11" fill="' + c.light + '"/>' + face(c, { mouthY: 112 }) +
        '<path d="M96 105 h8 l-4 4z" fill="' + INK + '"/>';
    },
    rabbit: function (c) {
      return '<circle cx="142" cy="170" r="11" fill="' + c.light + '"/>' +
        '<ellipse cx="76" cy="34" rx="14" ry="36" transform="rotate(-12 76 34)" fill="' + c.main + '"/><ellipse cx="76" cy="36" rx="7" ry="26" transform="rotate(-12 76 36)" fill="#FFC3D1"/>' +
        '<ellipse cx="124" cy="34" rx="14" ry="36" transform="rotate(12 124 34)" fill="' + c.main + '"/><ellipse cx="124" cy="36" rx="7" ry="26" transform="rotate(12 124 36)" fill="#FFC3D1"/>' +
        body(c) + head(c, 56, 49) + face(c, { mouthY: 110 }) +
        '<ellipse cx="100" cy="105" rx="4.5" ry="3.4" fill="#FF8FAA"/>' +
        '<rect x="96" y="116" width="8" height="7" rx="2" fill="#fff" stroke="' + c.mid + '" stroke-width="1.2"/>';
    },
    dragon: function (c) {
      var horn = '#FFE7A3', hornLine = '#EBC66B';
      return '<path d="M134 168 q36 6 40 -22 l8 -6 l-4 12 q-6 30 -44 26z" fill="' + c.main + '" stroke="' + c.mid + '" stroke-width="2"/>' +
        '<path d="M176 140 l10 -8 l-2 12z" fill="' + horn + '"/>' +
        // 날개
        '<path d="M64 132 q-30 -24 -38 -2 q10 -2 12 6 q8 -6 12 4 q8 -4 14 2z" fill="' + c.light + '" stroke="' + c.mid + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M136 132 q30 -24 38 -2 q-10 -2 -12 6 q-8 -6 -12 4 q-8 -4 -14 2z" fill="' + c.light + '" stroke="' + c.mid + '" stroke-width="2" stroke-linejoin="round"/>' +
        // 뿔
        '<path d="M72 50 q-6 -22 4 -32 q6 14 14 24z" fill="' + horn + '" stroke="' + hornLine + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M128 50 q6 -22 -4 -32 q-6 14 -14 24z" fill="' + horn + '" stroke="' + hornLine + '" stroke-width="2" stroke-linejoin="round"/>' +
        // 귀 지느러미
        '<path d="M44 84 q-18 -6 -20 -20 q14 2 24 10z" fill="' + c.mid + '"/><path d="M156 84 q18 -6 20 -20 q-14 2 -24 10z" fill="' + c.mid + '"/>' +
        body(c, { belly: '#FFF3C9' }) +
        '<g stroke="#EBC66B" stroke-width="1.8" opacity=".7" stroke-linecap="round"><path d="M86 150 h28"/><path d="M84 160 h32"/><path d="M88 170 h24"/></g>' +
        head(c) +
        // 머리 갈기
        '<path d="M90 44 q5 -12 10 -12 q5 0 10 12 q-10 -4 -20 0z" fill="' + c.dark + '" opacity=".55"/>' +
        '<ellipse cx="100" cy="114" rx="20" ry="12" fill="' + c.light + '"/>' +
        '<circle cx="94" cy="110" r="1.8" fill="' + c.dark + '"/><circle cx="106" cy="110" r="1.8" fill="' + c.dark + '"/>' +
        eyes(92) + blush(108) + mouth(116);
    },
    snake: function (c) {
      var spot = c.light;
      return '<ellipse cx="100" cy="190" rx="52" ry="6.5" fill="#2D2627" opacity=".09"/>' +
        '<ellipse cx="100" cy="174" rx="54" ry="16" fill="' + c.mid + '"/>' +
        '<ellipse cx="100" cy="170" rx="54" ry="15" fill="' + c.main + '"/>' +
        '<ellipse cx="100" cy="150" rx="44" ry="15" fill="' + c.mid + '"/>' +
        '<ellipse cx="100" cy="146" rx="44" ry="14" fill="' + c.main + '"/>' +
        '<g fill="' + spot + '"><circle cx="66" cy="170" r="5"/><circle cx="92" cy="176" r="5"/><circle cx="120" cy="175" r="5"/><circle cx="144" cy="168" r="5"/><circle cx="76" cy="146" r="4.5"/><circle cx="104" cy="152" r="4.5"/><circle cx="130" cy="145" r="4.5"/></g>' +
        '<path d="M150 172 q22 -2 20 -14" fill="none" stroke="' + c.main + '" stroke-width="8" stroke-linecap="round"/>' +
        head(c, 56, 48) +
        '<g fill="' + spot + '"><path d="M100 46 l8 8 l-8 8 l-8 -8z"/><circle cx="76" cy="58" r="4"/><circle cx="124" cy="58" r="4"/></g>' +
        face(c, { mouthY: 110 }) +
        '<path d="M100 117 v8 m0 0 l-4 5 m4 -5 l4 5" fill="none" stroke="#FF7E9C" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
    },
    horse: function (c) {
      var mane = c.dark;
      return '<path d="M136 166 q30 4 30 -18 q8 14 -2 26 q-12 6 -28 -2z" fill="' + mane + '" opacity=".75"/>' +
        '<path d="M60 52 l-6 -32 l24 22z" fill="' + c.main + '" stroke="' + c.mid + '" stroke-width="2" stroke-linejoin="round"/><path d="M62 46 l-3 -16 l12 11z" fill="#FFC3D1"/>' +
        '<path d="M140 52 l6 -32 l-24 22z" fill="' + c.main + '" stroke="' + c.mid + '" stroke-width="2" stroke-linejoin="round"/><path d="M138 46 l3 -16 l-12 11z" fill="#FFC3D1"/>' +
        body(c) + head(c, 56, 50) +
        '<path d="M78 46 q8 -16 22 -12 q14 -4 22 12 q-8 -4 -12 2 q-4 -8 -10 -2 q-6 -6 -10 2 q-6 -6 -12 -2z" fill="' + mane + '" opacity=".85"/>' +
        eyes(90) + blush(106) +
        '<ellipse cx="100" cy="118" rx="25" ry="15" fill="' + c.light + '"/>' +
        '<ellipse cx="91" cy="115" rx="2.6" ry="3.4" fill="' + c.dark + '"/><ellipse cx="109" cy="115" rx="2.6" ry="3.4" fill="' + c.dark + '"/>' +
        '<path d="M94 124 q6 4 12 0" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/>';
    },
    sheep: function (c) {
      var wool = '#FFFDF8', woolLine = '#EDE4D6';
      var puffs = [[58, 56], [76, 42], [100, 36], [124, 42], [142, 56], [152, 76], [48, 76], [44, 98], [156, 98]];
      var w = puffs.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="18" fill="' + wool + '" stroke="' + woolLine + '" stroke-width="2"/>'; }).join('');
      var bodyPuffs = [[70, 140], [100, 130], [130, 140], [68, 162], [132, 162], [100, 172]].map(function (p) {
        return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="20" fill="' + wool + '" stroke="' + woolLine + '" stroke-width="2"/>';
      }).join('');
      return '<ellipse cx="100" cy="190" rx="46" ry="6.5" fill="#2D2627" opacity=".09"/>' +
        '<ellipse cx="80" cy="182" rx="12" ry="8" fill="' + c.dark + '" opacity=".7"/><ellipse cx="120" cy="182" rx="12" ry="8" fill="' + c.dark + '" opacity=".7"/>' +
        bodyPuffs + '<ellipse cx="100" cy="152" rx="36" ry="28" fill="' + wool + '"/>' + w +
        '<path d="M46 88 q-16 -2 -16 12 q0 12 12 10 q8 -2 6 -10" fill="none" stroke="#E7C98D" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M154 88 q16 -2 16 12 q0 12 -12 10 q-8 -2 -6 -10" fill="none" stroke="#E7C98D" stroke-width="7" stroke-linecap="round"/>' +
        '<ellipse cx="100" cy="98" rx="44" ry="40" fill="' + c.main + '"/>' +
        '<circle cx="86" cy="62" r="13" fill="' + wool + '"/><circle cx="100" cy="58" r="14" fill="' + wool + '"/><circle cx="114" cy="62" r="13" fill="' + wool + '"/>' +
        eyes(98) + blush(114) + mouth(112);
    },
    monkey: function (c) {
      return '<path d="M136 168 q34 0 30 -26 q-4 -14 -16 -6" fill="none" stroke="' + c.mid + '" stroke-width="6" stroke-linecap="round"/>' +
        '<circle cx="40" cy="96" r="19" fill="' + c.main + '"/><circle cx="40" cy="96" r="11" fill="' + c.light + '"/>' +
        '<circle cx="160" cy="96" r="19" fill="' + c.main + '"/><circle cx="160" cy="96" r="11" fill="' + c.light + '"/>' +
        body(c) + head(c, 56, 50) +
        '<path d="M100 72 q-10 -10 -22 -6 q-20 6 -16 30 q4 26 38 26 q34 0 38 -26 q4 -24 -16 -30 q-12 -4 -22 6z" fill="' + c.light + '"/>' +
        '<path d="M92 48 q8 -12 16 0" fill="none" stroke="' + c.dark + '" stroke-width="3" stroke-linecap="round" opacity=".6"/>' +
        eyes(94) + blush(110) + mouth(110) +
        '<circle cx="96" cy="104" r="1.6" fill="' + c.dark + '"/><circle cx="104" cy="104" r="1.6" fill="' + c.dark + '"/>';
    },
    rooster: function (c) {
      return '<path d="M134 150 q30 -30 40 -12 q-14 0 -18 8 q14 -6 18 8 q-14 -2 -18 6 q10 0 12 10 q-18 -6 -34 0z" fill="#F7B9CA" stroke="#EE9DB3" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M140 150 q20 -10 24 4" fill="none" stroke="#B5DAF4" stroke-width="5" stroke-linecap="round"/>' +
        body(c, { noArms: true }) +
        '<path d="M60 142 q-16 6 -10 22 q12 2 18 -8z" fill="' + c.mid + '"/><path d="M140 142 q16 6 10 22 q-12 2 -18 -8z" fill="' + c.mid + '"/>' +
        '<path d="M80 46 q-4 -22 12 -18 q2 -16 16 -8 q10 -10 16 6 q12 2 4 20z" fill="#FF8FA3" stroke="#F27391" stroke-width="2" stroke-linejoin="round"/>' +
        head(c, 54, 49) + eyes(94) + blush(108) +
        '<path d="M92 104 l8 -6 l8 6 l-8 7z" fill="#FFB86B" stroke="#F0A04B" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<path d="M96 112 q4 12 8 0z" fill="#FF8FA3"/>';
    },
    dog: function (c) {
      return '<path d="M138 160 q24 -8 26 -24" fill="none" stroke="' + c.main + '" stroke-width="9" stroke-linecap="round"/>' +
        '<ellipse cx="46" cy="94" rx="16" ry="32" transform="rotate(16 46 94)" fill="' + c.dark + '" opacity=".85"/>' +
        '<ellipse cx="154" cy="94" rx="16" ry="32" transform="rotate(-16 154 94)" fill="' + c.dark + '" opacity=".85"/>' +
        body(c) + head(c, 54, 50) +
        '<ellipse cx="122" cy="92" rx="15" ry="14" fill="' + c.mid + '" opacity=".7"/>' +
        '<ellipse cx="100" cy="114" rx="20" ry="13" fill="' + c.light + '"/>' +
        eyes(92) + blush(108) +
        '<ellipse cx="100" cy="107" rx="6.5" ry="4.8" fill="' + INK + '"/><circle cx="98" cy="105.5" r="1.6" fill="#fff"/>' +
        '<path d="M92 115 q4 5 8 0 q4 5 8 0" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M96 118 q4 9 8 0z" fill="#FF8FAA"/>';
    },
    pig: function (c) {
      return '<path d="M138 166 q12 2 12 -8 q0 -8 -8 -6 q-6 2 -2 8 q6 4 10 -2" fill="none" stroke="' + c.mid + '" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M52 66 l2 -34 l28 20z" fill="' + c.main + '" stroke="' + c.mid + '" stroke-width="2" stroke-linejoin="round"/><path d="M58 56 l1 -14 l12 9z" fill="' + c.mid + '"/>' +
        '<path d="M148 66 l-2 -34 l-28 20z" fill="' + c.main + '" stroke="' + c.mid + '" stroke-width="2" stroke-linejoin="round"/><path d="M142 56 l-1 -14 l-12 9z" fill="' + c.mid + '"/>' +
        body(c) + head(c) + eyes(90) + blush(106) +
        '<ellipse cx="100" cy="112" rx="18" ry="12" fill="' + c.mid + '"/><ellipse cx="100" cy="111" rx="16" ry="10" fill="' + c.light + '"/>' +
        '<ellipse cx="94" cy="111" rx="2.8" ry="4" fill="' + c.dark + '"/><ellipse cx="106" cy="111" rx="2.8" ry="4" fill="' + c.dark + '"/>' +
        '<path d="M95 126 q5 4 10 0" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/>';
    }
  };

  /* ---------- 펫 꾸미기 아이템 (slot: head / face / neck / hand) ---------- */
  var ACCESSORIES = [
    { id: 'cap', slot: 'head', name: '여행 캡모자', price: 120, svg: '<path d="M60 52 q40 -40 80 0z" fill="#B5DAF4" stroke="#8FBEE0" stroke-width="2"/><path d="M128 50 q24 -2 30 8 q-16 4 -32 -2z" fill="#8FBEE0"/><circle cx="100" cy="22" r="5" fill="#FFB3A3"/>' },
    { id: 'straw', slot: 'head', name: '밀짚모자', price: 160, svg: '<ellipse cx="100" cy="50" rx="62" ry="12" fill="#F6DFA0" stroke="#E2C27A" stroke-width="2"/><path d="M68 50 q2 -34 32 -34 q30 0 32 34z" fill="#F8E7B5" stroke="#E2C27A" stroke-width="2"/><path d="M69 42 q31 8 62 0 v8 q-31 6 -62 0z" fill="#FF9EB5"/>' },
    { id: 'beret', slot: 'head', name: '파리 베레모', price: 180, svg: '<ellipse cx="96" cy="40" rx="44" ry="18" transform="rotate(-8 96 40)" fill="#D4CCF4" stroke="#B9AEE6" stroke-width="2"/><path d="M98 22 l2 -8" stroke="#B9AEE6" stroke-width="4" stroke-linecap="round"/>' },
    { id: 'party', slot: 'head', name: '파티 고깔', price: 140, svg: '<path d="M82 46 l18 -44 l18 44z" fill="#FFCBAA" stroke="#F4A97E" stroke-width="2" stroke-linejoin="round"/><path d="M88 32 l24 0 M84 42 l32 0" stroke="#fff" stroke-width="3"/><circle cx="100" cy="2" r="6" fill="#F7B9CA"/>' },
    { id: 'flower', slot: 'head', name: '꽃 화관', price: 220, svg: (function () { var s = ''; [[62, 52, '#F7B9CA'], [76, 42, '#F8E3A0'], [92, 37, '#B5DAF4'], [108, 37, '#F7B9CA'], [124, 42, '#D4CCF4'], [138, 52, '#F8E3A0']].forEach(function (p) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="8" fill="' + p[2] + '" stroke="#fff" stroke-width="2"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.6" fill="#FFB86B"/>'; }); return s; })() },
    { id: 'crown', slot: 'head', name: '여행왕 왕관', price: 500, svg: '<path d="M70 48 l4 -30 l14 16 l12 -22 l12 22 l14 -16 l4 30z" fill="#FFE07A" stroke="#E9BE45" stroke-width="2.4" stroke-linejoin="round"/><circle cx="100" cy="36" r="4.5" fill="#FF8FA3"/><circle cx="82" cy="40" r="3.5" fill="#8FD3C1"/><circle cx="118" cy="40" r="3.5" fill="#8FBEE0"/>' },
    { id: 'sunglasses', slot: 'face', name: '선글라스', price: 100, svg: '<rect x="62" y="86" width="30" height="20" rx="9" fill="#3A3034" opacity=".88"/><rect x="108" y="86" width="30" height="20" rx="9" fill="#3A3034" opacity=".88"/><path d="M92 94 h16" stroke="#3A3034" stroke-width="3"/><path d="M68 91 l8 0" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>' },
    { id: 'roundglasses', slot: 'face', name: '동글 안경', price: 90, svg: '<circle cx="78" cy="96" r="14" fill="#fff" fill-opacity=".25" stroke="#8A6E5E" stroke-width="3"/><circle cx="122" cy="96" r="14" fill="#fff" fill-opacity=".25" stroke="#8A6E5E" stroke-width="3"/><path d="M92 95 q8 -5 16 0" fill="none" stroke="#8A6E5E" stroke-width="3"/>' },
    { id: 'heartglasses', slot: 'face', name: '하트 안경', price: 150, svg: '<path d="M78 108 l-14 -14 a7 7 0 0 1 14 -8 a7 7 0 0 1 14 8z" fill="#FF8FA3" stroke="#F27391" stroke-width="2"/><path d="M122 108 l-14 -14 a7 7 0 0 1 14 -8 a7 7 0 0 1 14 8z" fill="#FF8FA3" stroke="#F27391" stroke-width="2"/><path d="M92 94 h16" stroke="#F27391" stroke-width="3"/>' },
    { id: 'scarf', slot: 'neck', name: '체크 스카프', price: 110, svg: '<path d="M62 124 q38 18 76 0 v12 q-38 16 -76 0z" fill="#FFB3A3"/><path d="M118 132 l6 30 l12 -4 l-6 -28z" fill="#FFB3A3"/><path d="M70 128 v10 M84 132 v10 M98 134 v10 M112 132 v10 M126 128 v10" stroke="#fff" stroke-width="2.4" opacity=".7"/>' },
    { id: 'bowtie', slot: 'neck', name: '나비넥타이', price: 80, svg: '<path d="M100 130 l-18 -10 v20z" fill="#8FBEE0" stroke="#6FA6D1" stroke-width="2" stroke-linejoin="round"/><path d="M100 130 l18 -10 v20z" fill="#8FBEE0" stroke="#6FA6D1" stroke-width="2" stroke-linejoin="round"/><circle cx="100" cy="130" r="5" fill="#6FA6D1"/>' },
    { id: 'lei', slot: 'neck', name: '하와이 레이', price: 200, svg: (function () { var s = ''; for (var i = 0; i < 9; i++) { var a = Math.PI * (0.1 + 0.8 * i / 8); var x = 100 - Math.cos(a) * 40, y = 124 + Math.sin(a) * 14; s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="7" fill="' + ['#F7B9CA', '#F8E3A0', '#A7E4D3'][i % 3] + '" stroke="#fff" stroke-width="1.6"/>'; } return s; })() },
    { id: 'medal', slot: 'neck', name: '발자국 메달', price: 260, svg: '<path d="M84 122 l16 22 l16 -22" fill="none" stroke="#B5DAF4" stroke-width="5"/><circle cx="100" cy="150" r="11" fill="#FFE07A" stroke="#E9BE45" stroke-width="2.4"/><path d="M96 150 l3 3 l6 -7" fill="none" stroke="#C99A2E" stroke-width="2.4" stroke-linecap="round"/>' },
    { id: 'camera', slot: 'hand', name: '즉석 카메라', price: 170, svg: '<rect x="128" y="138" width="34" height="26" rx="6" fill="#FFF7EC" stroke="#E2C9A8" stroke-width="2"/><circle cx="145" cy="152" r="8" fill="#B5DAF4" stroke="#8FBEE0" stroke-width="2.4"/><rect x="132" y="141" width="7" height="4" rx="1.5" fill="#FF8FA3"/>' },
    { id: 'balloon', slot: 'hand', name: '하트 풍선', price: 130, svg: '<path d="M150 146 q8 -40 4 -70" fill="none" stroke="#C9B9BD" stroke-width="1.6"/><path d="M154 78 l-17 -17 a10 10 0 0 1 17 -11 a10 10 0 0 1 17 11z" fill="#FF8FA3" stroke="#F27391" stroke-width="2"/>' },
    { id: 'passport', slot: 'hand', name: '여권', price: 90, svg: '<rect x="132" y="140" width="24" height="30" rx="4" transform="rotate(-12 144 155)" fill="#8FBEE0" stroke="#6FA6D1" stroke-width="2"/><circle cx="144" cy="152" r="5" fill="none" stroke="#FFE07A" stroke-width="2" transform="rotate(-12 144 155)"/>' },
    { id: 'backpack', slot: 'hand', name: '여행 배낭', price: 210, svg: '<rect x="38" y="128" width="30" height="38" rx="10" fill="#FFCBAA" stroke="#F4A97E" stroke-width="2"/><rect x="42" y="146" width="22" height="12" rx="4" fill="#F4A97E" opacity=".5"/><path d="M60 128 q16 0 20 12" fill="none" stroke="#F4A97E" stroke-width="4"/>' }
  ];
  var SLOTS = [
    { id: 'head', name: '모자' }, { id: 'face', name: '안경' }, { id: 'neck', name: '목' }, { id: 'hand', name: '소품' }
  ];

  // 레벨에 따라 점점 화려해지는 효과
  function aura(level) {
    var s = '';
    if (level >= 6) {
      s += '<defs><radialGradient id="tpAura"><stop offset="0" stop-color="#FFF6C9" stop-opacity=".95"/><stop offset=".6" stop-color="#F7D5E6" stop-opacity=".45"/><stop offset="1" stop-color="#D4CCF4" stop-opacity="0"/></radialGradient></defs>' +
        '<circle cx="100" cy="112" r="98" fill="url(#tpAura)"/>';
    }
    if (level >= 9) {
      s += '<ellipse cx="100" cy="20" rx="30" ry="7" fill="none" stroke="#FFE07A" stroke-width="4" opacity=".9"/>';
    }
    return s;
  }
  function sparkles(level) {
    if (level < 3) return '';
    var pts = [[30, 60, 1], [172, 50, .8], [22, 140, .7], [178, 128, 1], [150, 20, .6], [48, 18, .7]];
    var n = Math.min(pts.length, 2 + Math.floor(level / 2));
    return '<g class="pet-sparkles">' + pts.slice(0, n).map(function (p, i) {
      return '<path class="spark" style="animation-delay:' + (i * 0.35) + 's" transform="translate(' + p[0] + ' ' + p[1] + ') scale(' + p[2] + ')" d="M0 -9 q2 7 9 9 q-7 2 -9 9 q-2 -7 -9 -9 q7 -2 9 -9z" fill="' + ['#FFE07A', '#F7B9CA', '#B5DAF4'][i % 3] + '"/>';
    }).join('') + '</g>';
  }

  /* 펫 SVG 문자열.
   * opts: { color, equip: {head,face,neck,hand}, level, mood: 'happy'|'eat'|'sleep' } */
  function petSVG(animal, opts) {
    opts = opts || {};
    var c = shades(opts.color || DEFAULT_COLOR[animal] || '#A7E4D3');
    var eq = opts.equip || {};
    var acc = function (slot) {
      var a = ACCESSORIES.filter(function (x) { return x.id === eq[slot]; })[0];
      return a ? '<g class="acc acc-' + slot + '">' + a.svg + '</g>' : '';
    };
    var lvl = opts.level || 1;
    var inner = (DRAW[animal] || DRAW.dragon)(c);
    return '<svg class="pet-svg" viewBox="-10 -10 220 214" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + (opts.label || animal) + '">' +
      aura(lvl) + acc('hand').replace('class="acc acc-hand"', 'class="acc acc-hand acc-back"') +
      '<g class="pet-body">' + inner + acc('neck') + acc('face') + acc('head') + '</g>' + sparkles(lvl) + '</svg>';
  }

  /* ---------- 방 꾸미기 아이템 ---------- */
  var WALLPAPERS = [
    { id: 'plain', name: '기본 벽', price: 0, css: '#F7F3EE' },
    { id: 'pinkstripe', name: '딸기우유 줄무늬', price: 150, css: 'repeating-linear-gradient(90deg,#FCE6EC 0 22px,#FFF3F6 22px 44px)' },
    { id: 'mintdot', name: '민트 도트', price: 150, css: 'radial-gradient(#CBEFE4 3px,transparent 3.5px) 0 0/26px 26px,#F1FBF7' },
    { id: 'sky', name: '하늘 구름', price: 220, css: 'radial-gradient(ellipse 60px 22px at 20% 30%,#fff 98%,transparent),radial-gradient(ellipse 80px 26px at 75% 18%,#fff 98%,transparent),radial-gradient(ellipse 50px 18px at 60% 55%,#ffffffcc 98%,transparent),linear-gradient(#CDE7F8,#EAF5FC)' },
    { id: 'night', name: '별빛 밤하늘', price: 300, css: 'radial-gradient(#FFF6C9 1.6px,transparent 2px) 0 0/34px 34px,radial-gradient(#ffffffaa 1px,transparent 1.5px) 17px 17px/34px 34px,linear-gradient(#C9C1EE,#E6E1FA)' },
    { id: 'lavgrid', name: '라벤더 체크', price: 180, css: 'linear-gradient(#E9E4FA 2px,transparent 2px) 0 0/30px 30px,linear-gradient(90deg,#E9E4FA 2px,transparent 2px) 0 0/30px 30px,#F7F5FE' }
  ];
  var FLOORS = [
    { id: 'plain', name: '기본 바닥', price: 0, css: '#EDE5DA' },
    { id: 'wood', name: '원목 마루', price: 140, css: 'repeating-linear-gradient(90deg,#F2D9B8 0 46px,#EACDA6 46px 48px)' },
    { id: 'tile', name: '크림 타일', price: 140, css: 'linear-gradient(45deg,#F4EEE6 25%,transparent 25%,transparent 75%,#F4EEE6 75%) 0 0/40px 40px,linear-gradient(45deg,#F4EEE6 25%,#FBF8F3 25%,#FBF8F3 75%,#F4EEE6 75%) 20px 20px/40px 40px' },
    { id: 'grass', name: '잔디 정원', price: 220, css: 'radial-gradient(#9FD9B9 2px,transparent 2.5px) 0 0/18px 18px,#C9EBD6' },
    { id: 'sand', name: '해변 모래', price: 220, css: 'radial-gradient(#E9D3A6 1.6px,transparent 2px) 0 0/14px 14px,#F7E8C8' }
  ];
  var FURNITURE = [
    { id: 'window', name: '바다 창문', price: 160, w: 30, h: 26, place: [6, 21], svg: '<svg viewBox="0 0 120 100"><rect x="4" y="4" width="112" height="92" rx="14" fill="#fff" stroke="#E6D9CC" stroke-width="6"/><rect x="12" y="12" width="96" height="76" rx="8" fill="#CDE7F8"/><rect x="12" y="58" width="96" height="30" fill="#9CCFEA"/><circle cx="84" cy="34" r="9" fill="#FFE7A3"/><path d="M60 12 v76 M12 50 h96" stroke="#fff" stroke-width="5"/></svg>' },
    { id: 'frame', name: '여행 사진 액자', price: 120, w: 20, h: 22, place: [74, 22], svg: '<svg viewBox="0 0 80 90"><rect x="4" y="4" width="72" height="82" rx="8" fill="#FFF7EC" stroke="#E7C98D" stroke-width="5"/><rect x="13" y="13" width="54" height="50" rx="4" fill="#F7B9CA"/><path d="M13 58 l16 -18 l12 12 l8 -8 l18 18v1h-54z" fill="#A7E4D3"/><circle cx="52" cy="26" r="6" fill="#FFE7A3"/><rect x="18" y="70" width="44" height="6" rx="3" fill="#E7C98D"/></svg>' },
    { id: 'garland', name: '깃발 가랜드', price: 90, w: 80, h: 12, place: [10, 17], svg: '<svg viewBox="0 0 300 40" preserveAspectRatio="none"><path d="M0 4 q150 28 300 0" fill="none" stroke="#C9B9BD" stroke-width="2"/>' + (function () { var s = ''; for (var i = 0; i < 9; i++) { var x = 12 + i * 33, y = 4 + Math.sin(Math.PI * (x / 300)) * 14; s += '<path d="M' + x + ' ' + y + ' l20 0 l-10 18z" fill="' + ['#F7B9CA', '#B5DAF4', '#F8E3A0', '#A7E4D3', '#D4CCF4'][i % 5] + '"/>'; } return s; })() + '</svg>' },
    { id: 'rug', name: '동글 러그', price: 130, w: 70, h: 14, place: [14, 66], floor: true, svg: '<svg viewBox="0 0 200 40"><ellipse cx="100" cy="20" rx="98" ry="18" fill="#F7D5E6"/><ellipse cx="100" cy="20" rx="80" ry="12" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 6"/></svg>' },
    { id: 'plant', name: '몬스테라 화분', price: 120, w: 17, h: 26, place: [80, 52], svg: '<svg viewBox="0 0 70 110"><path d="M35 70 q-30 -10 -28 -40 q18 6 28 30z" fill="#9FD9B9"/><path d="M35 70 q30 -14 26 -46 q-18 8 -26 34z" fill="#8FD3B0"/><path d="M35 72 q-4 -40 4 -66 q12 26 -4 66z" fill="#A7E4C4"/><path d="M14 70 h42 l-6 36 h-30z" fill="#FFCBAA"/><rect x="11" y="66" width="48" height="9" rx="4" fill="#F4A97E"/></svg>' },
    { id: 'lamp', name: '구름 무드등', price: 140, w: 15, h: 28, place: [4, 50], svg: '<svg viewBox="0 0 60 120"><path d="M8 40 q-4 -26 22 -30 q26 4 22 30z" fill="#FFF3C9" stroke="#F3DE95" stroke-width="3"/><rect x="27" y="40" width="6" height="66" rx="3" fill="#E6D9CC"/><ellipse cx="30" cy="110" rx="20" ry="6" fill="#E6D9CC"/><circle cx="30" cy="28" r="22" fill="#FFF6C9" opacity=".35"/></svg>' },
    { id: 'suitcase', name: '캐리어', price: 150, w: 16, h: 22, place: [74, 60], svg: '<svg viewBox="0 0 70 100"><rect x="24" y="2" width="22" height="16" rx="5" fill="none" stroke="#C9B9BD" stroke-width="4"/><rect x="6" y="16" width="58" height="72" rx="12" fill="#B5DAF4" stroke="#8FBEE0" stroke-width="3"/><path d="M22 24 v56 M48 24 v56" stroke="#8FBEE0" stroke-width="3"/><circle cx="18" cy="92" r="5" fill="#9E8F93"/><circle cx="52" cy="92" r="5" fill="#9E8F93"/><rect x="28" y="40" width="16" height="12" rx="3" fill="#FFE7A3"/></svg>' },
    { id: 'shelf', name: '기념품 선반', price: 200, w: 26, h: 18, place: [4, 37], svg: '<svg viewBox="0 0 120 80"><rect x="4" y="54" width="112" height="8" rx="4" fill="#E7C98D"/><rect x="12" y="24" width="18" height="30" rx="3" fill="#F7B9CA"/><rect x="32" y="30" width="14" height="24" rx="3" fill="#B5DAF4"/><path d="M60 54 l12 -34 l12 34z" fill="#A7E4D3"/><circle cx="98" cy="40" r="14" fill="#D4CCF4"/><path d="M90 40 h16 M98 26 v28" stroke="#fff" stroke-width="2"/></svg>' },
    { id: 'bed', name: '구름 쿠션', price: 240, w: 34, h: 16, place: [52, 64], floor: true, svg: '<svg viewBox="0 0 160 70"><path d="M10 50 q-6 -30 26 -28 q8 -20 34 -10 q20 -14 40 4 q30 -4 36 20 q8 16 -6 24 h-124 q-12 -2 -6 -10z" fill="#fff" stroke="#E6DCF0" stroke-width="4"/><ellipse cx="80" cy="44" rx="40" ry="10" fill="#F2EDF9"/></svg>' },
    { id: 'globe', name: '지구본', price: 180, w: 14, h: 20, place: [84, 38], svg: '<svg viewBox="0 0 60 90"><circle cx="30" cy="34" r="26" fill="#B5DAF4" stroke="#8FBEE0" stroke-width="3"/><path d="M16 22 q10 -6 14 4 q-2 8 -10 6 q-6 4 -4 -10zM34 40 q10 -4 14 6 q-6 10 -14 4z" fill="#A7E4D3"/><path d="M30 60 v16" stroke="#C9B9BD" stroke-width="4"/><ellipse cx="30" cy="80" rx="16" ry="5" fill="#C9B9BD"/></svg>' },
    { id: 'balloons', name: '풍선 묶음', price: 110, w: 16, h: 30, place: [62, 17], svg: '<svg viewBox="0 0 60 120"><path d="M30 118 q-4 -40 -12 -62 M30 118 q2 -40 14 -66 M30 118 q0 -40 0 -76" stroke="#C9B9BD" stroke-width="1.5" fill="none"/><ellipse cx="18" cy="44" rx="14" ry="17" fill="#F7B9CA"/><ellipse cx="44" cy="40" rx="14" ry="17" fill="#B5DAF4"/><ellipse cx="30" cy="24" rx="14" ry="17" fill="#F8E3A0"/></svg>' }
  ];

  var FOODS = [
    { id: 'cookie', name: '감귤 쿠키', price: 0, full: 12, happy: 2, emoji: '🍪', note: '매일 무료' },
    { id: 'tteok', name: '오메기떡', price: 30, full: 25, happy: 6, emoji: '🍡' },
    { id: 'sushi', name: '도쿄 초밥', price: 60, full: 40, happy: 10, emoji: '🍣' },
    { id: 'croissant', name: '파리 크루아상', price: 60, full: 35, happy: 12, emoji: '🥐' },
    { id: 'cake', name: '여행 기념 케이크', price: 120, full: 50, happy: 25, emoji: '🍰' }
  ];
  var TOYS = [
    { id: 'ball', name: '공놀이', emoji: '⚽', happy: 15, anim: 'hop' },
    { id: 'bubble', name: '비눗방울', emoji: '🫧', happy: 18, anim: 'sway' },
    { id: 'pat', name: '쓰담쓰담', emoji: '🤍', happy: 10, anim: 'wiggle' }
  ];

  global.TPPets = {
    PALETTE: PALETTE, DEFAULT_COLOR: DEFAULT_COLOR, ACCESSORIES: ACCESSORIES, SLOTS: SLOTS,
    WALLPAPERS: WALLPAPERS, FLOORS: FLOORS, FURNITURE: FURNITURE, FOODS: FOODS, TOYS: TOYS,
    petSVG: petSVG, shades: shades
  };
})(typeof window !== 'undefined' ? window : globalThis);
