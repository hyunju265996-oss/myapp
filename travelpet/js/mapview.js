/* 실제 지도: 구글 지도 API 키가 있으면 Google Maps, 없으면 OpenStreetMap(Leaflet)
 * TPMap.create(el, { onReady }) → { setStops(stops), focus(lat,lng), destroy() }
 * TPMap.search(query) → Promise<[{name,address,lat,lng}]>
 */
(function (global) {
  'use strict';
  var gLoading = null, gFailed = false;

  function key() { var s = global.TPStore.get(); return (s && s.settings && s.settings.gmapsKey || '').trim(); }

  function loadGoogle() {
    if (global.google && global.google.maps && global.google.maps.Map) return Promise.resolve(global.google.maps);
    if (gLoading) return gLoading;
    gLoading = new Promise(function (resolve, reject) {
      global.__tpGmapsReady = function () { resolve(global.google.maps); };
      global.gm_authFailure = function () {
        gFailed = true;
        global.TPUI.toast('구글 지도 키를 확인해주세요. 지금은 기본 지도로 보여드려요.');
        document.dispatchEvent(new CustomEvent('tp:gmaps-failed'));
      };
      var s = document.createElement('script');
      s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(key()) +
        '&v=weekly&language=ko&region=KR&libraries=places&loading=async&callback=__tpGmapsReady';
      s.async = true;
      s.onerror = function () { gLoading = null; reject(new Error('load')); };
      document.head.appendChild(s);
    });
    return gLoading;
  }
  function useGoogle() { return !!key() && !gFailed; }

  /* ---------- Google ---------- */
  function googleView(el) {
    var map, markers = [], line;
    var api = {
      ready: loadGoogle().then(function (g) {
        map = new g.Map(el, {
          center: { lat: 36.5, lng: 127.8 }, zoom: 7, disableDefaultUI: true, zoomControl: true, clickableIcons: false,
          gestureHandling: 'greedy',
          styles: [
            { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
            { featureType: 'water', stylers: [{ color: '#BFE0F2' }] },
            { featureType: 'landscape', stylers: [{ color: '#F6F2EA' }] }
          ]
        });
      }),
      setStops: function (stops) {
        api.ready.then(function () {
          var g = global.google.maps;
          markers.forEach(function (m) { m.setMap(null); });
          if (line) line.setMap(null);
          markers = stops.map(function (s, i) {
            return new g.Marker({
              map: map, position: { lat: s.lat, lng: s.lng }, title: s.name,
              label: { text: String(i + 1), color: '#4A1F2C', fontWeight: '800' },
              icon: { path: g.SymbolPath.CIRCLE, scale: 15, fillColor: '#F4A6B8', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 }
            });
          });
          if (stops.length > 1) {
            line = new g.Polyline({ map: map, path: stops.map(function (s) { return { lat: s.lat, lng: s.lng }; }), strokeColor: '#8FBEE0', strokeWeight: 4, strokeOpacity: .9 });
          }
          fit(stops);
        });
      },
      focus: function (lat, lng) { api.ready.then(function () { map.panTo({ lat: lat, lng: lng }); map.setZoom(14); }); },
      destroy: function () { markers.forEach(function (m) { m.setMap(null); }); }
    };
    function fit(stops) {
      if (!stops.length) return;
      if (stops.length === 1) { map.setCenter({ lat: stops[0].lat, lng: stops[0].lng }); map.setZoom(13); return; }
      var b = new global.google.maps.LatLngBounds();
      stops.forEach(function (s) { b.extend({ lat: s.lat, lng: s.lng }); });
      map.fitBounds(b, 40);
    }
    api.kind = 'google';
    return api;
  }

  /* ---------- OpenStreetMap (Leaflet) ---------- */
  function leafletView(el) {
    var L = global.L;
    var map = L.map(el, { zoomControl: true, attributionControl: true }).setView([36.5, 127.8], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    var layer = L.layerGroup().addTo(map);
    var api = {
      kind: 'osm',
      ready: Promise.resolve(),
      setStops: function (stops) {
        layer.clearLayers();
        stops.forEach(function (s, i) {
          L.marker([s.lat, s.lng], {
            title: s.name,
            icon: L.divIcon({ className: '', html: '<div class="pin"><b>' + (i + 1) + '</b></div>', iconSize: [34, 34], iconAnchor: [17, 34] })
          }).bindPopup('<b>' + global.TPUI.esc(s.name) + '</b>').addTo(layer);
        });
        if (stops.length > 1) L.polyline(stops.map(function (s) { return [s.lat, s.lng]; }), { color: '#8FBEE0', weight: 4 }).addTo(layer);
        if (stops.length === 1) map.setView([stops[0].lat, stops[0].lng], 13);
        else if (stops.length) map.fitBounds(stops.map(function (s) { return [s.lat, s.lng]; }), { padding: [36, 36] });
      },
      focus: function (lat, lng) { map.setView([lat, lng], 14); },
      destroy: function () { map.remove(); }
    };
    setTimeout(function () { map.invalidateSize(); }, 50);
    return api;
  }

  function create(el) {
    var view = useGoogle() ? googleView(el) : leafletView(el);
    if (view.kind === 'google') {
      view.ready.catch(function () {
        gFailed = true;
        global.TPUI.toast('구글 지도를 불러오지 못해 기본 지도로 보여드려요.');
      });
    }
    return view;
  }

  /* ---------- 장소 검색 ---------- */
  function searchOSM(q) {
    var url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&accept-language=ko&limit=8&q=' + encodeURIComponent(q);
    return fetch(url, { headers: { 'Accept': 'application/json' } }).then(function (r) { return r.json(); }).then(function (list) {
      return list.map(function (x) {
        return { name: x.name || x.display_name.split(',')[0], address: x.display_name, lat: +x.lat, lng: +x.lon };
      });
    });
  }
  function searchGoogle(q) {
    return loadGoogle().then(function () { return global.google.maps.importLibrary('places'); }).then(function (lib) {
      return lib.Place.searchByText({ textQuery: q, fields: ['displayName', 'formattedAddress', 'location'], language: 'ko', maxResultCount: 8 });
    }).then(function (res) {
      return (res.places || []).map(function (p) {
        return { name: p.displayName, address: p.formattedAddress, lat: p.location.lat(), lng: p.location.lng() };
      });
    });
  }
  function search(q) {
    var local = global.TPData.PLACES.filter(function (p) { return (p.name + p.city).indexOf(q) !== -1; })
      .map(function (p) { return { name: p.name, address: p.city + ' · ' + p.desc, lat: p.lat, lng: p.lng }; });
    var remote = useGoogle() ? searchGoogle(q).catch(function () { return searchOSM(q); }) : searchOSM(q);
    return remote.catch(function () { return []; }).then(function (r) { return local.concat(r); });
  }

  global.TPMap = { create: create, search: search, usingGoogle: useGoogle };
})(window);
