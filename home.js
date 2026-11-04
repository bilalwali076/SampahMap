"use strict";

/* =====================================================
   SampahMap Palembang — home.js (Beranda)
   1. Pratinjau peta di hero
   2. Angka ringkas di hero
   3. Pencarian cepat -> membuka halaman Peta
===================================================== */
(function () {
  const SM = window.SM;
  const CATEGORY = SM.CATEGORY;
  const locations = SM.getLocations();
  const palembangCenter = [-2.9761, 104.7754];

  /* ---------- Angka total lokasi ---------- */
  document.querySelectorAll("[data-total-lokasi]").forEach(function (node) {
    node.textContent = locations.length;
  });
  SM.countUp(document.getElementById("statLokasi"), locations.length);

  /* ---------- Pratinjau peta ---------- */
  const previewEl = document.getElementById("previewMap");
  let previewMap = null;
  let previewReports = null;
  let previewBounds = null;

  function fitPreview() {
    if (!previewMap) return;
    previewMap.invalidateSize();
    if (previewBounds) previewMap.fitBounds(previewBounds, { padding: [48, 48], maxZoom: 13, animate: false });
  }

  function dot(color) {
    return L.divIcon({
      className: "",
      html: '<div class="pv-dot" style="--c:' + color + '"></div>',
      iconSize: [12, 12],
    });
  }

  let previewRows = null;
  function addPreviewReports() {
    if (!previewReports || !previewRows) return;
    previewReports.clearLayers();
    previewRows.forEach(function (row) {
      if (!Number.isFinite(row.lat) || !Number.isFinite(row.lng)) return;
      const color = (SM.reports.STATUS[row.status] || SM.reports.STATUS.menunggu).color;
      L.marker([row.lat, row.lng], { icon: dot(color), interactive: false, keyboard: false }).addTo(previewReports);
    });
  }

  function initPreview() {
    if (previewMap || !previewEl || !window.L) return;
    {
    previewMap = L.map(previewEl, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
    }).setView(palembangCenter, 12);

    L.control.attribution({ position: "topright", prefix: false }).addTo(previewMap);
    SM.addBaseLayer(previewMap);

    locations.forEach(function (location) {
      const cat = CATEGORY[CATEGORY[location.type] ? location.type : "tps"];
      L.marker(location.position, { icon: dot(cat.color), interactive: false, keyboard: false }).addTo(previewMap);
    });

    previewReports = L.layerGroup().addTo(previewMap);
    if (locations.length) previewBounds = L.latLngBounds(locations.map(function (l) { return l.position; }));
    fitPreview();

    let resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fitPreview, 200);
    });
    window.addEventListener("load", function () { setTimeout(fitPreview, 350); });
  }
    addPreviewReports();
  }

  // Peta pratinjau dibuat saat terlihat / browser idle agar halaman terbuka lebih cepat.
  if (previewEl && window.L) {
    const start = function () { (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(initPreview, { timeout: 1500 }); };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); start(); }
      }, { rootMargin: "200px" });
      io.observe(previewEl);
    } else { start(); }
  }

  /* ---------- Laporan: angka hero + titik di pratinjau ---------- */
  const aktifEl = document.getElementById("statAktif");
  const kontribEl = document.getElementById("statKontributor");

  SM.reports.fetch().then(function (rows) {
    const aktif = rows.filter(function (r) { return r.status !== "selesai"; }).length;
    const names = new Set(rows.map(function (r) { return r.nama.toLowerCase(); }).filter(Boolean));
    SM.countUp(aktifEl, aktif);
    SM.countUp(kontribEl, names.size);

    previewRows = rows;
    addPreviewReports();
  }).catch(function (error) {
    console.warn("Laporan gagal dimuat:", error);
    if (aktifEl) aktifEl.textContent = "—";
    if (kontribEl) kontribEl.textContent = "—";
  });

  /* ---------- Pencarian cepat -> halaman Peta ---------- */
  const heroSearch = document.getElementById("heroSearch");
  if (heroSearch) {
    heroSearch.addEventListener("submit", function (event) {
      event.preventDefault();
      const query = document.getElementById("heroSearchInput").value.trim();
      window.location.href = "peta.html" + (query ? "?q=" + encodeURIComponent(query) : "");
    });
  }
})();
