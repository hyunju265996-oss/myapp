/* 고정 데이터: 가볼만한 곳, 공항, 예시(데모) 계정 */
(function (global) {
  'use strict';

  var PLACES = [
    { id: 'gn-anmok', area: '국내', city: '강릉', name: '안목해변 커피거리', emoji: '☕', tag: '카페', lat: 37.7722, lng: 128.9479, desc: '바다를 보며 커피 한 잔, 강릉 대표 카페 거리' },
    { id: 'gn-gyeongpo', area: '국내', city: '강릉', name: '경포호 & 경포해변', emoji: '🌊', tag: '자연', lat: 37.7955, lng: 128.9087, desc: '호수 둘레길 산책과 해변 일몰 명소' },
    { id: 'sc-market', area: '국내', city: '속초', name: '속초관광수산시장', emoji: '🦐', tag: '맛집', lat: 38.2047, lng: 128.5903, desc: '닭강정과 오징어순대, 먹거리 천국' },
    { id: 'sc-seorak', area: '국내', city: '속초', name: '설악산 권금성', emoji: '⛰️', tag: '자연', lat: 38.1691, lng: 128.4915, desc: '케이블카로 오르는 설악의 절경' },
    { id: 'bs-haeundae', area: '국내', city: '부산', name: '해운대 블루라인파크', emoji: '🚃', tag: '액티비티', lat: 35.1601, lng: 129.1912, desc: '바다 위를 달리는 해변열차와 스카이캡슐' },
    { id: 'bs-gamcheon', area: '국내', city: '부산', name: '감천문화마을', emoji: '🏘️', tag: '포토존', lat: 35.0975, lng: 129.0106, desc: '알록달록 계단식 마을, 어린왕자 포토존' },
    { id: 'jj-seongsan', area: '국내', city: '제주', name: '성산일출봉', emoji: '🌅', tag: '자연', lat: 33.4581, lng: 126.9425, desc: '유네스코 세계자연유산, 일출 명소' },
    { id: 'jj-hyeopjae', area: '국내', city: '제주', name: '협재해수욕장', emoji: '🏝️', tag: '자연', lat: 33.3940, lng: 126.2397, desc: '에메랄드빛 바다와 비양도 뷰' },
    { id: 'gj-hwangni', area: '국내', city: '경주', name: '황리단길 & 대릉원', emoji: '🏯', tag: '역사', lat: 35.8384, lng: 129.2096, desc: '한옥 카페 골목과 신라 고분 산책' },
    { id: 'jeonju-hanok', area: '국내', city: '전주', name: '전주한옥마을', emoji: '🍚', tag: '역사', lat: 35.8150, lng: 127.1530, desc: '한복 입고 걷는 한옥 골목, 비빔밥 맛집' },
    { id: 'ys-night', area: '국내', city: '여수', name: '여수 밤바다 & 해상케이블카', emoji: '🎆', tag: '야경', lat: 34.7385, lng: 127.7470, desc: '노래처럼 낭만적인 여수 밤바다' },
    { id: 'sl-bukchon', area: '국내', city: '서울', name: '북촌한옥마을', emoji: '🏮', tag: '역사', lat: 37.5826, lng: 126.9830, desc: '도심 속 한옥 골목 산책' },
    { id: 'tk-shibuya', area: '해외', city: '도쿄', name: '시부야 스카이', emoji: '🌃', tag: '야경', lat: 35.6585, lng: 139.7023, desc: '도쿄 360도 야경 전망대' },
    { id: 'os-dotonbori', area: '해외', city: '오사카', name: '도톤보리', emoji: '🐙', tag: '맛집', lat: 34.6687, lng: 135.5013, desc: '타코야키와 글리코 간판 앞 인증샷' },
    { id: 'dn-bana', area: '해외', city: '다낭', name: '바나힐 골든브릿지', emoji: '🌉', tag: '포토존', lat: 15.9950, lng: 107.9967, desc: '거대한 손이 받치는 구름 위 다리' },
    { id: 'bkk-wat', area: '해외', city: '방콕', name: '왓 아룬', emoji: '🛕', tag: '역사', lat: 13.7437, lng: 100.4888, desc: '짜오프라야 강변의 새벽 사원' },
    { id: 'tp-jiufen', area: '해외', city: '타이베이', name: '지우펀 홍등 거리', emoji: '🏮', tag: '야경', lat: 25.1090, lng: 121.8443, desc: '해 질 녘 홍등이 켜지는 산골 마을' },
    { id: 'pr-eiffel', area: '해외', city: '파리', name: '에펠탑 & 샹드마르스', emoji: '🗼', tag: '랜드마크', lat: 48.8584, lng: 2.2945, desc: '잔디밭 피크닉과 반짝이는 정각 조명' },
    { id: 'rm-trevi', area: '해외', city: '로마', name: '트레비 분수', emoji: '⛲', tag: '랜드마크', lat: 41.9009, lng: 12.4833, desc: '동전을 던지면 다시 로마로' },
    { id: 'ny-central', area: '해외', city: '뉴욕', name: '센트럴파크', emoji: '🌳', tag: '자연', lat: 40.7829, lng: -73.9654, desc: '도시 한가운데 거대한 초록 쉼표' }
  ];

  var AIRPORTS = [
    { code: 'ICN', name: '인천' }, { code: 'GMP', name: '김포' }, { code: 'PUS', name: '부산 김해' }, { code: 'CJU', name: '제주' },
    { code: 'TAE', name: '대구' }, { code: 'CJJ', name: '청주' }, { code: 'RSU', name: '여수' }, { code: 'YNY', name: '양양' },
    { code: 'NRT', name: '도쿄 나리타' }, { code: 'HND', name: '도쿄 하네다' }, { code: 'KIX', name: '오사카 간사이' }, { code: 'FUK', name: '후쿠오카' },
    { code: 'CTS', name: '삿포로' }, { code: 'OKA', name: '오키나와' }, { code: 'TPE', name: '타이베이' }, { code: 'HKG', name: '홍콩' },
    { code: 'DAD', name: '다낭' }, { code: 'SGN', name: '호찌민' }, { code: 'BKK', name: '방콕' }, { code: 'SIN', name: '싱가포르' },
    { code: 'CEB', name: '세부' }, { code: 'DPS', name: '발리' }, { code: 'GUM', name: '괌' }, { code: 'SYD', name: '시드니' },
    { code: 'CDG', name: '파리' }, { code: 'LHR', name: '런던' }, { code: 'FCO', name: '로마' }, { code: 'BCN', name: '바르셀로나' },
    { code: 'JFK', name: '뉴욕' }, { code: 'LAX', name: 'LA' }, { code: 'HNL', name: '호놀룰루' }
  ];

  // 예시 계정: 용띠 '미르'. 방은 처음엔 텅 빈 상태.
  function demoState() {
    var today = new Date();
    var iso = function (d) { return d.toISOString().slice(0, 10); };
    var plus = function (n) { var d = new Date(today); d.setDate(d.getDate() + n); return iso(d); };
    return {
      v: 1,
      user: { name: '여행자', birth: '2000-05-05', zodiac: 'dragon', petName: '미르', color: '#A7E4D3', joined: iso(today) },
      coins: 800,
      pet: { full: 62, happy: 80, exp: 140, last: Date.now(), freeFood: '', equip: {}, owned: [] },
      room: { wall: 'plain', floor: 'plain', items: {}, ownedWall: ['plain'], ownedFloor: ['plain'] },
      settings: { gmapsKey: '' },
      records: [
        { id: 'r1', scope: 'kr', region: '51:강릉시', regionName: '강원특별자치도 강릉시', date: '2025-03-15', title: '안목해변 커피거리', memo: '바다 냄새 가득한 카페 거리. 미르랑 순두부 젤라또도 먹었다!', photos: [], mood: '😊' },
        { id: 'r2', scope: 'kr', region: '51:강릉시', regionName: '강원특별자치도 강릉시', date: '2024-08-02', title: '경포해변 여름휴가', memo: '튜브 타고 둥둥', photos: [], mood: '🥰' },
        { id: 'r3', scope: 'kr', region: '51:속초시', regionName: '강원특별자치도 속초시', date: '2025-03-16', title: '속초 중앙시장 닭강정', memo: '줄 서서 산 닭강정, 기다린 보람!', photos: [], mood: '😋' },
        { id: 'r4', scope: 'kr', region: '50:제주시', regionName: '제주특별자치도 제주시', date: '2024-10-12', title: '협재 바다 산책', memo: '비양도가 보이는 에메랄드 바다', photos: [], mood: '😍' },
        { id: 'r5', scope: 'kr', region: '26:해운대구', regionName: '부산광역시 해운대구', date: '2024-05-04', title: '해변열차 타기', memo: '청사포 쪽 바다가 제일 예뻤다', photos: [], mood: '😊' },
        { id: 'r6', scope: 'world', country: 'JPN', countryName: '일본', region: 'JPN-1860', regionName: '일본 도쿄도', date: '2024-12-20', title: '도쿄 연말 일루미네이션', memo: '시부야 스카이 야경 최고', photos: [], mood: '🤩' },
        { id: 'r7', scope: 'world', country: 'VNM', countryName: '베트남', region: 'VNM-491', regionName: '베트남 다낭', date: '2024-02-10', title: '다낭 미케비치', memo: '반미랑 코코넛 커피!', photos: [], mood: '😎' }
      ],
      trips: [
        {
          id: 't1', title: '강릉 바다 힐링 여행', start: plus(5), end: plus(7), dest: '강릉',
          members: [{ name: '나', me: true, zodiac: 'dragon' }, { name: '민지', zodiac: 'rabbit' }, { name: '준호', zodiac: 'tiger' }],
          days: [
            [
              { name: '강릉역', time: '09:30', lat: 37.7644, lng: 128.8996, memo: 'KTX 도착' },
              { name: '초당순두부마을', time: '11:30', lat: 37.7910, lng: 128.9145, memo: '순두부 젤라또 필수' },
              { name: '안목해변 커피거리', time: '13:30', lat: 37.7722, lng: 128.9479, memo: '오션뷰 카페' },
              { name: '경포호', time: '16:00', lat: 37.7955, lng: 128.9087, memo: '자전거 타고 한 바퀴' }
            ],
            [
              { name: '정동진 해변', time: '06:30', lat: 37.6908, lng: 129.0347, memo: '일출 보기' },
              { name: '강릉중앙시장', time: '12:00', lat: 37.7540, lng: 128.8990, memo: '닭강정, 감자전' }
            ],
            []
          ]
        }
      ]
    };
  }

  global.TPData = { PLACES: PLACES, AIRPORTS: AIRPORTS, demoState: demoState };
})(window);
