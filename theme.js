"use strict";

/* =====================================================
   SampahMap Palembang — theme.js
   Dipakai di semua halaman:
   1. Sprite ikon SVG
   2. Tema gelap / terang
   3. Drawer menu samping
   4. (dihapus) scroll-spy: tiap menu kini halaman sendiri
   5. Install PWA + Service Worker
   6. Helper peta (tile, pin) dan animasi angka
===================================================== */
(function () {
  const SM = (window.SM = window.SM || {});
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- 1. SPRITE IKON ---------- */
  const ICONS = {
    logo: '<rect width="32" height="32" rx="10" fill="url(#smg)" stroke="none"/><path d="M16 5.5c-4.7 0-8 3.4-8 7.7 0 5.6 8 13.3 8 13.3s8-7.7 8-13.3c0-4.3-3.3-7.7-8-7.7Z" fill="#052E16" stroke="none"/><path d="M16 9.6c-2.9 1-4.2 3.2-3.7 5.4.3 1.2 1.1 2 2.4 2.5 3.1-.4 4.9-3.2 4.9-6.3-1 0-2.5-.6-3.6-1.6Z" fill="#BBF7D0" stroke="none"/><path d="M15.2 18.2c.7-2.2 1.9-3.7 3.4-4.8" stroke="#052E16" stroke-width="1.4" stroke-linecap="round"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/>',
    recycle: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
    clipboard: '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.4 2.6a1.9 1.9 0 0 1 3 3l-9 9a2 2 0 0 1-.85.5l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .5-.85z"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
    book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    locate: '<path d="M3 11 22 2l-9 19-2-8z"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    arrowUp: '<path d="M7 7h10v10M7 17 17 7"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    factory: '<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    flask: '<path d="M10 2v7.53a2 2 0 0 1-.21.9L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.07-10.13a2 2 0 0 1-.21-.9V2"/><path d="M8.5 2h7M7 16h10"/>',
    box: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .71-1.53l7-6a2 2 0 0 1 2.58 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  };
  SM.icons = ICONS;

  function injectSprite() {
    if (document.getElementById("sm-sprite")) return;
    const symbols = Object.keys(ICONS)
      .map((name) => {
        const vb = name === "logo" ? "0 0 32 32" : "0 0 24 24";
        return '<symbol id="i-' + name + '" viewBox="' + vb + '">' + ICONS[name] + "</symbol>";
      })
      .join("");
    const svg =
      '<svg id="sm-sprite" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" ' +
      'style="position:absolute;width:0;height:0;overflow:hidden">' +
      '<defs><linearGradient id="smg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">' +
      '<stop stop-color="#16A34A"/><stop offset="1" stop-color="#166534"/></linearGradient></defs>' +
      symbols + "</svg>";
    document.body.insertAdjacentHTML("afterbegin", svg);
  }

  /* Buat elemen ikon: SM.icon("pin") */
  SM.icon = function (name, className) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "i" + (className ? " " + className : ""));
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(NS, "use");
    use.setAttribute("href", "#i-" + name);
    svg.appendChild(use);
    return svg;
  };
  SM.iconHTML = function (name, className) {
    return (
      '<svg class="i' + (className ? " " + className : "") +
      '" aria-hidden="true"><use href="#i-' + name + '"/></svg>'
    );
  };

  /* ---------- 2. TEMA GELAP / TERANG ---------- */
  const THEME_KEY = "sm-theme";

  function readStored() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function systemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function currentTheme() {
    return root.getAttribute("data-theme") || systemTheme();
  }

  function applyTheme(theme, persist) {
    root.classList.add("theme-anim");
    root.setAttribute("data-theme", theme);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0B1F14" : "#F0FDF4");

    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      btn.setAttribute("aria-label", theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap");
    });

    if (persist) {
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* abaikan */ }
    }

    window.dispatchEvent(new CustomEvent("smtheme", { detail: { theme: theme } }));
    window.setTimeout(function () { root.classList.remove("theme-anim"); }, 450);
  }

  SM.theme = {
    get: currentTheme,
    set: function (t) { applyTheme(t, true); },
  };

  function initTheme() {
    applyTheme(currentTheme(), false);
    root.classList.remove("theme-anim");

    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
      });
    });

    // Ikuti pengaturan sistem selama pengguna belum memilih sendiri.
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
      if (!readStored()) applyTheme(e.matches ? "dark" : "light", false);
    });
  }

  /* ---------- 3. DRAWER MENU ---------- */
  function initDrawer() {
    const menuButton = document.getElementById("menuButton");
    const closeButton = document.getElementById("closeMenuButton");
    const sideMenu = document.getElementById("sideMenu");
    const overlay = document.getElementById("menuOverlay");
    if (!menuButton || !sideMenu || !overlay) return;

    sideMenu.setAttribute("inert", "");

    function open() {
      sideMenu.removeAttribute("inert");
      sideMenu.classList.add("show");
      overlay.classList.add("show");
      menuButton.setAttribute("aria-expanded", "true");
      document.body.classList.add("no-scroll");
      window.setTimeout(function () { closeButton && closeButton.focus(); }, 60);
    }
    function close() {
      if (!sideMenu.classList.contains("show")) return;
      sideMenu.classList.remove("show");
      overlay.classList.remove("show");
      sideMenu.setAttribute("inert", "");
      menuButton.setAttribute("aria-expanded", "false");
      document.body.classList.remove("no-scroll");
      menuButton.focus();
    }

    menuButton.addEventListener("click", open);
    closeButton && closeButton.addEventListener("click", close);
    overlay.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
    window.matchMedia("(min-width: 960px)").addEventListener("change", function (e) {
      if (e.matches) close();
    });
  }

  /* ---------- 5. PWA ---------- */
  function initPWA() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").catch(function (err) {
          console.log("SW gagal:", err);
        });
      });
    }

    let deferredPrompt = null;
    const buttons = Array.from(document.querySelectorAll("[data-install]"));

    function setVisible(show) {
      buttons.forEach(function (b) { b.hidden = !show; });
    }
    setVisible(false);

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferredPrompt = e;
      setVisible(true);
    });

    buttons.forEach(function (b) {
      b.addEventListener("click", async function () {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === "accepted") setVisible(false);
        deferredPrompt = null;
      });
    });

    window.addEventListener("appinstalled", function () { setVisible(false); });
  }

  /* ---------- 6. HELPER ---------- */

  // Tile peta: OpenStreetMap standar (tanpa API key).
  // Mode gelap ditangani lewat filter CSS pada .leaflet-tile-pane (lihat pages.css).
  SM.addBaseLayer = function (map) {
    return L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
  };

  // Kategori sesuai data di tps-data.js (dipakai halaman Beranda dan Peta).
  SM.CATEGORY = {
    tps:        { label: "TPS",         full: "Tempat Penampungan Sementara", color: "#166534", icon: "trash" },
    tpa:        { label: "TPA",         full: "Tempat Pemrosesan Akhir",      color: "#0284c7", icon: "factory" },
    tpst:       { label: "TPST",        full: "TPS Terpadu",                  color: "#92400E", icon: "layers" },
    banksampah: { label: "Bank Sampah", full: "Bank Sampah",                  color: "#4D7C0F", icon: "recycle" },
    fasilitas:  { label: "Fasilitas",   full: "Fasilitas kebersihan",         color: "#78716C", icon: "building" },
  };

  SM.getLocations = function () {
    try {
      if (typeof tpsLocations !== "undefined" && Array.isArray(tpsLocations)) {
        return tpsLocations.filter(function (item) {
          return item && Array.isArray(item.position) && item.position.length === 2;
        });
      }
      console.error("Data TPS tidak ditemukan. Periksa tps-data.js");
    } catch (error) {
      console.error("Gagal membaca data TPS:", error);
    }
    return [];
  };

  // Pin berbentuk tetesan untuk fasilitas.
  SM.pinIcon = function (color, iconName) {
    return L.divIcon({
      className: "sm-pin-wrap",
      html:
        '<div class="sm-pin" style="--c:' + color + '"><span class="sm-pin-body">' +
        SM.iconHTML(iconName) + '</span><span class="sm-pin-shadow"></span></div>',
      iconSize: [34, 34],
      iconAnchor: [17, 41],
      popupAnchor: [0, -38],
      tooltipAnchor: [20, -22],
    });
  };

  // Hitung naik untuk angka statistik.
  SM.countUp = function (el, to, opts) {
    if (!el) return;
    const target = Number(to);
    if (!Number.isFinite(target)) { el.textContent = "—"; return; }
    const duration = (opts && opts.duration) || 1100;
    if (reduceMotion.matches || target === 0) { el.textContent = target.toLocaleString("id-ID"); return; }
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString("id-ID");
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };

  SM.timeAgo = function (value) {
    const d = new Date(value);
    if (isNaN(d)) return "";
    const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
    if (s < 60) return "Baru saja";
    if (s < 3600) return Math.floor(s / 60) + " menit lalu";
    if (s < 86400) return Math.floor(s / 3600) + " jam lalu";
    if (s < 86400 * 30) return Math.floor(s / 86400) + " hari lalu";
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  /* ---------- START ---------- */
  injectSprite();
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
  initTheme();
  initDrawer();
  initPWA();
})();
