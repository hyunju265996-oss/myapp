/* 생년월일 → 띠 계산.
 * 띠는 양력 1월 1일이 아니라 음력 설날을 기준으로 바뀐다.
 * 설날 = 동지 이후 두 번째 합삭(새달)이 드는 날(한국 표준시)로 계산한다.
 * (Jean Meeus, Astronomical Algorithms 49장 합삭 공식 사용. 윤11·12월이 끼는 아주 드문 해는 예외가 있을 수 있어
 *  가입 화면에서 사용자가 직접 바꿀 수 있게 해 둔다.)
 */
(function (global) {
  'use strict';

  var ZODIAC = [
    { id: 'rat',     ko: '쥐',     hanja: '子', name: '찍찍이', trait: '꼼꼼한 계획왕',   style: '골목 맛집 탐험' },
    { id: 'ox',      ko: '소',     hanja: '丑', name: '느긋소', trait: '든든한 힐링러',   style: '숲속 산책 여행' },
    { id: 'tiger',   ko: '호랑이', hanja: '寅', name: '어흥이', trait: '용감한 모험가',   style: '등산 & 트레킹' },
    { id: 'rabbit',  ko: '토끼',   hanja: '卯', name: '깡총이', trait: '감성 카페러',     style: '오션뷰 카페 투어' },
    { id: 'dragon',  ko: '용',     hanja: '辰', name: '미르',   trait: '바람을 부르는 길잡이', style: '바다 & 전망 명소' },
    { id: 'snake',   ko: '뱀',     hanja: '巳', name: '스르르', trait: '지혜로운 탐구가', style: '박물관 & 유적지' },
    { id: 'horse',   ko: '말',     hanja: '午', name: '다그닥', trait: '자유로운 로드트립러', style: '드라이브 여행' },
    { id: 'sheep',   ko: '양',     hanja: '未', name: '몽글이', trait: '포근한 휴양러',   style: '온천 & 호캉스' },
    { id: 'monkey',  ko: '원숭이', hanja: '申', name: '까불이', trait: '에너지 액티비티러', style: '서핑 & 테마파크' },
    { id: 'rooster', ko: '닭',     hanja: '酉', name: '꼬꼬',   trait: '부지런한 일출러', style: '일출 & 아침시장' },
    { id: 'dog',     ko: '개',     hanja: '戌', name: '멍멍이', trait: '다정한 캠핑러',   style: '캠핑 & 차박' },
    { id: 'pig',     ko: '돼지',   hanja: '亥', name: '꿀꿀이', trait: '행복한 미식가',   style: '로컬 미식 여행' }
  ];

  var RAD = Math.PI / 180;

  // k번째 합삭의 JDE (Meeus 49장)
  function newMoonJDE(k) {
    var T = k / 1236.85, T2 = T * T, T3 = T2 * T, T4 = T3 * T;
    var JDE = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4;
    var E = 1 - 0.002516 * T - 0.0000074 * T2;
    var M = (2.5534 + 29.10535670 * k - 0.0000014 * T2 - 0.00000011 * T3) * RAD;
    var Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4) * RAD;
    var F = (160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4) * RAD;
    var O = (124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3) * RAD;
    var s = Math.sin;
    JDE += -0.40720 * s(Mp) + 0.17241 * E * s(M) + 0.01608 * s(2 * Mp) + 0.01039 * s(2 * F)
      + 0.00739 * E * s(Mp - M) - 0.00514 * E * s(Mp + M) + 0.00208 * E * E * s(2 * M)
      - 0.00111 * s(Mp - 2 * F) - 0.00057 * s(Mp + 2 * F) + 0.00056 * E * s(2 * Mp + M)
      - 0.00042 * s(3 * Mp) + 0.00042 * E * s(M + 2 * F) + 0.00038 * E * s(M - 2 * F)
      - 0.00024 * E * s(2 * Mp - M) - 0.00017 * s(O) - 0.00007 * s(Mp + 2 * M)
      + 0.00004 * s(2 * Mp - 2 * F) + 0.00004 * s(3 * M) + 0.00003 * s(Mp + M - 2 * F)
      + 0.00003 * s(2 * Mp + 2 * F) - 0.00003 * s(Mp + M + 2 * F) + 0.00003 * s(Mp - M + 2 * F)
      - 0.00002 * s(Mp - M - 2 * F) - 0.00002 * s(3 * Mp + M) + 0.00002 * s(4 * Mp);
    return JDE;
  }

  // 동지 JDE (Meeus 27장 평균식, 오차 수 분)
  function decSolsticeJDE(year) {
    var Y = (year - 2000) / 1000;
    return 2451900.05952 + 365242.74049 * Y - 0.06223 * Y * Y - 0.00823 * Y * Y * Y + 0.00032 * Y * Y * Y * Y;
  }

  // JD → 한국 시간(UTC+9) 기준 날짜. (TT-UT 차이 약 1분은 무시)
  function jdToKstDate(jd) {
    var ms = (jd - 2440587.5) * 86400000 + 9 * 3600000;
    var d = new Date(ms);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
  }

  var cache = {};
  // 해당 양력 연도의 설날 날짜
  function seollal(year) {
    if (cache[year]) return cache[year];
    var sol = decSolsticeJDE(year - 1);
    var k = Math.floor((sol - 2451550.09766) / 29.530588861) - 1;
    var count = 0, jd;
    while (count < 2) {
      jd = newMoonJDE(k++);
      // 합삭 날짜(한국 시간)가 동지 날짜 이후이면 센다
      if (Math.floor(jd + 0.5 + 9 / 24) > Math.floor(sol + 0.5 + 9 / 24)) count++;
    }
    return (cache[year] = jdToKstDate(jd));
  }

  // 'YYYY-MM-DD' → { zodiac, year(띠 기준 연도), beforeSeollal, seollal }
  function fromBirth(iso) {
    var p = String(iso).split('-').map(Number);
    if (p.length !== 3 || !p[0]) return null;
    var y = p[0], m = p[1], d = p[2];
    var s = seollal(y);
    var before = m < s.m || (m === s.m && d < s.d);
    var zy = before ? y - 1 : y;
    var idx = ((zy - 4) % 12 + 12) % 12; // 1984, 1996, 2008 = 쥐
    return { zodiac: ZODIAC[idx], index: idx, year: zy, beforeSeollal: before, seollal: s };
  }

  global.TPZodiac = { ZODIAC: ZODIAC, seollal: seollal, fromBirth: fromBirth };
})(typeof window !== 'undefined' ? window : globalThis);
