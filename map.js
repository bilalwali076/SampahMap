"use strict";

/* =====================================================
   SampahMap Palembang — map.js (halaman Peta)
   Peta, penanda, filter, pencarian, lokasi saya, pelacakan
   posisi, TPS terdekat, rute dan navigasi.
===================================================== */

/* =====================================
   1. DATA DAN INISIALISASI PETA
===================================== */

const SM = window.SM;
const palembangCenter = [-2.9761, 104.7754];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const CATEGORY = SM.CATEGORY;

const map = L.map("map", {
  zoomControl: false,
  attributionControl: true,
}).setView(palembangCenter, 13);

map.attributionControl.setPrefix(false);
SM.addBaseLayer(map);

const layerGroups = {};
Object.keys(CATEGORY).forEach(function (key) {
  layerGroups[key] = L.layerGroup().addTo(map);
});
layerGroups.laporan = L.layerGroup().addTo(map);

const routeLayer = L.layerGroup().addTo(map);

let userMarker = null;
let userAccuracyCircle = null;
let userPosition = null;
let selectedLocation = null;
let routeRequestId = 0;

/* Ambil data dari tps-data.js */
const locations = SM.getLocations();

/* =====================================
   2. PENANDA DAN POPUP
===================================== */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function categoryOf(location) {
  return CATEGORY[location.type] ? location.type : "tps";
}

function createPopupContent(location) {
  const key = categoryOf(location);
  const cat = CATEGORY[key];

  const wrapper = el("div", "pop");

  const badge = el("span", "badge badge--plain", cat.full);
  badge.style.setProperty("--b-dot", cat.color);
  badge.style.setProperty("--b-fg", "var(--ink-2)");
  wrapper.appendChild(badge);

  wrapper.appendChild(el("h4", "", location.name || "Lokasi"));
  wrapper.appendChild(el("p", "", location.description || "Alamat belum tersedia"));

  const actions = el("div", "pop-actions");

  const routeButton = el("button", "btn btn-primary btn-sm route-action-button");
  routeButton.type = "button";
  routeButton.append(SM.icon("locate"), document.createTextNode("Pilih rute"));
  routeButton.addEventListener("click", function () {
    map.closePopup();
    prepareRoute(location);
  });

  const googleButton = el("button", "btn btn-ghost btn-sm route-secondary-button");
  googleButton.type = "button";
  googleButton.append(SM.icon("arrowUp", "arrow-up"), document.createTextNode("Buka Google Maps"));
  googleButton.addEventListener("click", function () {
    openGoogleMaps(location);
  });

  actions.append(routeButton, googleButton);
  wrapper.appendChild(actions);

  return wrapper;
}

const POPUP_OPTIONS = { minWidth: 240, maxWidth: 290, autoPanPaddingTopLeft: [40, 90], autoPanPaddingBottomRight: [40, 40] };

function openLocationPopup(location) {
  selectedLocation = location;
  L.popup(POPUP_OPTIONS)
    .setLatLng(location.position)
    .setContent(createPopupContent(location))
    .openOn(map);
}

locations.forEach(function (location) {
  const key = categoryOf(location);
  const cat = CATEGORY[key];

  const marker = L.marker(location.position, {
    icon: SM.pinIcon(cat.color, cat.icon),
    title: location.name,
    riseOnHover: true,
  });

  marker.bindTooltip(location.name, { direction: "right", offset: [4, 0] });
  marker.bindPopup(createPopupContent(location), POPUP_OPTIONS);
  marker.on("click", function () {
    selectedLocation = location;
  });

  marker.addTo(layerGroups[key]);
});

/* Filter penanda lewat chip */
function updateChipCounts() {
  const counts = {};
  locations.forEach(function (location) {
    const key = categoryOf(location);
    counts[key] = (counts[key] || 0) + 1;
  });
  counts.laporan = SM.mapApi ? SM.mapApi.reportCount : 0;

  document.querySelectorAll("#layerChips .chip").forEach(function (chip) {
    const count = chip.querySelector("[data-count]");
    if (count) count.textContent = counts[chip.dataset.layer] || 0;
  });
}

document.querySelectorAll("#layerChips .chip").forEach(function (chip) {
  chip.addEventListener("click", function () {
    const group = layerGroups[chip.dataset.layer];
    if (!group) return;

    const turnOn = chip.getAttribute("aria-pressed") !== "true";
    chip.setAttribute("aria-pressed", String(turnOn));

    if (turnOn) map.addLayer(group);
    else map.removeLayer(group);
  });
});

/* =====================================
   2c. PENANDA LAPORAN WARGA
===================================== */

const STATUS_COLOR = { menunggu: "#D97706", diproses: "#0284C7", selesai: "#16A34A" };
const reportMarkers = new Map();

SM.mapApi = {
  map: map,
  reportCount: 0,

  setReports: function (rows, buildPopup) {
    layerGroups.laporan.clearLayers();
    reportMarkers.clear();

    let count = 0;

    rows.forEach(function (row) {
      if (!Number.isFinite(row.lat) || !Number.isFinite(row.lng)) return;
      count++;

      const color = STATUS_COLOR[row.status] || STATUS_COLOR.menunggu;
      const icon = L.divIcon({
        className: "sm-rpt-wrap",
        html:
          '<div class="sm-rpt' + (row.status === "menunggu" ? " pulse" : "") + '" style="--c:' + color + '">' +
          '<span class="sm-rpt-dot">' + SM.iconHTML(row.status === "selesai" ? "check" : "alert") + "</span></div>",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([row.lat, row.lng], { icon: icon, title: row.jenis, riseOnHover: true });
      marker.bindPopup(function () { return buildPopup(row); }, POPUP_OPTIONS);
      marker.addTo(layerGroups.laporan);
      reportMarkers.set(row.id, marker);
    });

    SM.mapApi.reportCount = count;
    updateChipCounts();
  },

  focusReport: function (id) {
    const marker = reportMarkers.get(id);
    if (!marker) return false;

    const chip = document.querySelector('#layerChips .chip[data-layer="laporan"]');
    if (chip && chip.getAttribute("aria-pressed") !== "true") chip.click();

    map.flyTo(marker.getLatLng(), 17, { duration: reduceMotion ? 0 : 0.9 });
    map.once("moveend", function () { marker.openPopup(); });
    return true;
  },
};

updateChipCounts();

/* =====================================
   3. TOMBOL ZOOM
===================================== */

document.getElementById("zoomInButton").addEventListener("click", function () {
  map.zoomIn();
});

document.getElementById("zoomOutButton").addEventListener("click", function () {
  map.zoomOut();
});

/* =====================================
   4. LOKASI PENGGUNA
===================================== */

function updateUserLocation(position) {
  userPosition = [position.coords.latitude, position.coords.longitude];

  if (userMarker) {
    userMarker.setLatLng(userPosition);
  } else {
    userMarker = L.marker(userPosition, {
      icon: L.divIcon({
        className: "sm-me-wrap",
        html: '<div class="sm-me"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
      zIndexOffset: 1000,
      keyboard: false,
    }).addTo(map);

    userMarker.bindTooltip("Lokasi saya");
  }

  if (userAccuracyCircle) {
    map.removeLayer(userAccuracyCircle);
  }

  const accuracy = Number(position.coords.accuracy);

  if (Number.isFinite(accuracy) && accuracy > 0) {
    userAccuracyCircle = L.circle(userPosition, {
      radius: accuracy,
      color: "#0284C7",
      weight: 1,
      fillColor: "#7DD3FC",
      fillOpacity: 0.12,
    }).addTo(map);
  }
}

function locationError(error) {
  let message = "Lokasi tidak dapat diperoleh.";

  if (error.code === 1) {
    message = "Izin lokasi ditolak. Izinkan akses lokasi di browser.";
  } else if (error.code === 2) {
    message = "Lokasi tidak tersedia. Periksa GPS atau koneksi internet.";
  } else if (error.code === 3) {
    message = "Pencarian lokasi terlalu lama. Coba kembali.";
  }

  const nearestMessage = document.getElementById("nearestMessage");
  nearestMessage.textContent = message;
}

function locateUser(shouldCenter = true) {
  if (!navigator.geolocation) {
    document.getElementById("nearestMessage").textContent =
      "Browser ini tidak mendukung GPS.";
    return;
  }

  document.getElementById("myLocationButton").disabled = true;

  navigator.geolocation.getCurrentPosition(
    function (position) {
      updateUserLocation(position);

      if (shouldCenter) {
        map.flyTo(userPosition, 16, { duration: 0.8 });
        userMarker.openTooltip();
      }

      document.getElementById("myLocationButton").disabled = false;
    },
    function (error) {
      locationError(error);
      document.getElementById("myLocationButton").disabled = false;
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    },
  );
}

document
  .getElementById("myLocationButton")
  .addEventListener("click", function () {
    locateUser(true);
  });

/* =====================================
   5. JARAK ANTARLOKASI
===================================== */

function distanceInMeters(from, to) {
  return L.latLng(from[0], from[1]).distanceTo(L.latLng(to[0], to[1]));
}

function formatDistance(meters) {
  if (meters < 1000) {
    return Math.round(meters) + " m";
  }

  return (meters / 1000).toFixed(2) + " km";
}

/* =====================================
   6. PENCARIAN NAMA DAN ALAMAT
===================================== */

const searchInput = document.getElementById("searchLocation");
const searchButton = document.getElementById("searchButton");
const searchResults = document.getElementById("searchResults");

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findLocations(query) {
  const words = normalizeText(query).split(" ").filter(Boolean);

  if (!words.length) {
    return [];
  }

  return locations
    .map(function (location) {
      const name = normalizeText(location.name);
      const address = normalizeText(location.description);
      const allText = name + " " + address;

      let score = 0;

      if (name === words.join(" ")) {
        score = 100;
      } else if (name.startsWith(words.join(" "))) {
        score = 80;
      } else if (name.includes(words.join(" "))) {
        score = 60;
      } else if (words.every((word) => allText.includes(word))) {
        score = 40;
      }

      return { location: location, score: score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.location);
}

function showSearchResults(results) {
  searchResults.replaceChildren();

  if (!results.length) {
    const empty = document.createElement("div");
    empty.className = "search-result";
    empty.textContent = "Lokasi tidak ditemukan dalam data TPS.";
    searchResults.appendChild(empty);
    searchResults.classList.add("show");
    return;
  }

  results.slice(0, 8).forEach(function (location) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";

    const title = document.createElement("strong");
    title.textContent = location.name;

    const address = document.createElement("small");
    address.textContent = location.description || "Alamat belum tersedia";

    button.append(title, address);

    button.addEventListener("click", function () {
      selectedLocation = location;
      map.flyTo(location.position, 16);
      openLocationPopup(location);

      searchInput.value = location.name;
      searchResults.classList.remove("show");
    });

    searchResults.appendChild(button);
  });

  searchResults.classList.add("show");
}

function searchPlace() {
  const results = findLocations(searchInput.value);
  showSearchResults(results);

  if (results.length) {
    map.flyTo(results[0].position, 15);
  }
}

searchInput.addEventListener("input", function () {
  const query = searchInput.value.trim();

  if (!query) {
    searchResults.classList.remove("show");
    searchResults.replaceChildren();
    return;
  }

  showSearchResults(findLocations(query));
});

searchButton.addEventListener("click", searchPlace);

searchInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    searchPlace();
  }

  if (event.key === "Escape") {
    searchResults.classList.remove("show");
  }
});

document.addEventListener("click", function (event) {
  if (!event.target.closest(".map-search")) {
    searchResults.classList.remove("show");
  }
});

/* =====================================
   7. TPS TERDEKAT
===================================== */

const findNearestButton = document.getElementById("findNearestButton");
const nearestMessage = document.getElementById("nearestMessage");
const nearestList = document.getElementById("nearestList");

findNearestButton.addEventListener("click", function () {
  if (!navigator.geolocation) {
    nearestMessage.textContent = "Browser tidak mendukung akses lokasi.";
    return;
  }

  findNearestButton.disabled = true;
  nearestMessage.textContent = "Sedang mencari lokasi kamu...";
  nearestList.replaceChildren();

  navigator.geolocation.getCurrentPosition(
    function (position) {
      updateUserLocation(position);

      const nearest = locations
        .filter((location) => location.type === "tps")
        .map((location) => ({
          location: location,
          distance: distanceInMeters(userPosition, location.position),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

      nearestMessage.textContent =
        "5 TPS terdekat berdasarkan jarak garis lurus:";

      nearest.forEach(function (item, index) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "nearest-item";

        const rank = el("span", "ni-rank", String(index + 1));

        const main = el("span", "ni-main");
        main.append(
          el("strong", "", item.location.name),
          el("small", "", item.location.description || "Alamat belum tersedia"),
        );

        const dist = el("span", "ni-dist", formatDistance(item.distance));
        dist.title = "Jarak garis lurus";

        button.append(rank, main, dist);

        button.addEventListener("click", function () {
          selectedLocation = item.location;
          map.flyTo(item.location.position, 16);

          openLocationPopup(item.location);
        });

        nearestList.appendChild(button);
      });

      map.flyTo(userPosition, 14);
      findNearestButton.disabled = false;
    },
    function (error) {
      locationError(error);
      findNearestButton.disabled = false;
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    },
  );
});

/* =====================================
   8. DETAIL DAN PILIHAN NAVIGASI
===================================== */

let previewRoutes = [];
let activeRoute = null;
let navigationActive = false;
let gpsWatchId = null;
let lastRerouteTime = 0;
let isRerouting = false;
let navigationDestination = null;
let navigationSteps = [];
let currentStepIndex = 0;
let navigationStartTime = 0;
let lastProgressUpdate = 0;

function showLocationOptions(location) {
  openLocationPopup(location);
}

function openGoogleMaps(location) {
  const destination = location.position.join(",");
  const origin = userPosition
    ? "&origin=" + encodeURIComponent(userPosition.join(","))
    : "";

  const url =
    "https://www.google.com/maps/dir/?api=1" +
    origin +
    "&destination=" +
    encodeURIComponent(destination) +
    "&travelmode=driving";

  window.open(url, "_blank", "noopener,noreferrer");
}

/* =====================================
   9. PRATINJAU DAN MODE NAVIGASI
===================================== */

function getRoutePanel() {
  let panel = document.getElementById("routePanel");

  if (!panel) {
    panel = document.createElement("section");
    panel.id = "routePanel";
    panel.className = "route-panel";
    panel.setAttribute("aria-live", "polite");
    (document.querySelector(".map-side") || document.querySelector(".map-section")).appendChild(panel);
  }

  return panel;
}


function showRouteMessage(message) {
  const panel = getRoutePanel();
  panel.replaceChildren();

  const text = document.createElement("p");
  text.className = "route-message";
  text.textContent = message;

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "btn btn-danger route-stop-button";
  cancelButton.textContent = "Batalkan pencarian";

  cancelButton.addEventListener("click", closeRoutePanel);

  panel.append(text, cancelButton);
  panel.classList.add("show");
}


function closeRoutePanel() {
  stopNavigationGPS();

  navigationActive = false;
  isRerouting = false;
  navigationDestination = null;
  activeRoute = null;
  previewRoutes = [];
  navigationSteps = [];
  currentStepIndex = 0;

  routeRequestId++;
  routeLayer.clearLayers();

  const panel = document.getElementById("routePanel");
  if (panel) {
    panel.classList.remove("show");
    panel.classList.remove("navigation-focus");
  }

  const nearestSection = document.querySelector(".nearest-section");
  if (nearestSection) {
    nearestSection.classList.remove("navigation-hidden");
  }

  setTimeout(function () {
    map.invalidateSize();
  }, 350);
}

function stopNavigationGPS() {
  if (gpsWatchId !== null) {
    navigator.geolocation.clearWatch(gpsWatchId);
    gpsWatchId = null;
  }
}

// Di layar kecil panel rute berada di bawah peta; bawa ke layar agar tidak terlewat.
function revealRoutePanel(panel) {
  if (!window.matchMedia("(max-width: 1039px)").matches) return;
  window.setTimeout(function () {
    panel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  }, 60);
}

function prepareRoute(location) {
  selectedLocation = location;

  if (!navigator.geolocation) {
    showRouteMessage(
      "Browser ini tidak mendukung GPS. Kamu bisa menggunakan Google Maps.",
    );
    return;
  }

  if (!userPosition) {
    showRouteMessage(
      "Sedang mencari lokasi kamu. Izinkan akses GPS di browser.",
    );

    navigator.geolocation.getCurrentPosition(
      function (position) {
        updateUserLocation(position);
        prepareRoute(location);
      },
      function (error) {
        locationError(error);
        showRouteMessage(
          "Lokasi belum tersedia. Periksa izin GPS lalu coba lagi.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      },
    );

    return;
  }

  navigationDestination = location;
navigationActive = false;
stopNavigationGPS();
activeRoute = null;
previewRoutes = [];
routeLayer.clearLayers();

// Sembunyikan panel TPS terdekat saat mencari rute.
const nearestSection = document.querySelector(".nearest-section");
if (nearestSection) {
  nearestSection.classList.add("navigation-hidden");
}

// Tampilkan panel pencarian rute.
const panel = getRoutePanel();
panel.classList.add("show");
panel.classList.add("navigation-focus");
revealRoutePanel(panel);

  
 
  panel.replaceChildren();

  const loading = document.createElement("p");
  loading.className = "route-message";
  loading.textContent = "Sedang menghitung rute...";
  panel.appendChild(loading);
  panel.classList.add("show");

  requestRoutes(location, false);
}

async function requestRoutes(location, isReroute) {
  if (!userPosition || !location) return;

  if (isReroute) isRerouting = true;

  const thisRequest = ++routeRequestId;
  const origin = userPosition[1] + "," + userPosition[0];
  const destination = location.position[1] + "," + location.position[0];

  const url =
    "https://router.project-osrm.org/route/v1/driving/" +
    origin +
    ";" +
    destination +
    "?overview=full&geometries=geojson&steps=true&alternatives=true";

  try {
    const response = await fetch(url);

    if (!response.ok) throw new Error("Layanan rute tidak tersedia.");

    const data = await response.json();

    if (thisRequest !== routeRequestId) return;

    if (data.code !== "Ok" || !data.routes || !data.routes.length) {
      throw new Error("Rute tidak ditemukan.");
    }

    previewRoutes = data.routes;

    if (isReroute && navigationActive) {
      activeRoute = previewRoutes[0];
      loadNavigationSteps(activeRoute);
      drawPreviewLine(activeRoute);
      lastRerouteTime = Date.now();
      updateNavigationPanel("Rute diperbarui karena posisi kamu berubah.");
    } else {
      showRoutePreview(location);
    }
  } catch (error) {
    if (thisRequest !== routeRequestId) return;

    console.error("Kesalahan rute:", error);

    if (isReroute && navigationActive) {
      updateNavigationPanel(
        "Gagal menghitung ulang rute. Periksa koneksi internet.",
      );
    } else {
      showRouteMessage(
        "Rute gagal dimuat. Periksa koneksi atau gunakan Google Maps.",
      );
    }
  } finally {
    if (thisRequest === routeRequestId) isRerouting = false;
  }
}

function showRoutePreview(location) {
  const panel = getRoutePanel();
  panel.replaceChildren();

  const heading = document.createElement("h3");
  heading.textContent = "Rute ke " + location.name;

  const subtitle = document.createElement("p");
  subtitle.textContent = "Pilih rute sebelum memulai perjalanan.";

  const choices = document.createElement("div");
  choices.className = "route-choices";

  previewRoutes.forEach(function (route, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "route-choice";
    if (index === 0) button.classList.add("selected");

    const title = document.createElement("strong");
    title.textContent = index === 0 ? "Rute utama" : "Alternatif " + index;

    const info = document.createElement("span");
    info.textContent =
      formatDistance(route.distance) +
      " · sekitar " +
      Math.max(1, Math.round(route.duration / 60)) +
      " menit";

    button.append(title, info);
    button.addEventListener("click", function () {
      choices.querySelectorAll(".route-choice").forEach(function (item) {
        item.classList.remove("selected");
      });

      button.classList.add("selected");
      activeRoute = route;
      drawPreviewLine(route);
    });

    choices.appendChild(button);
  });

  activeRoute = previewRoutes[0];
  drawPreviewLine(activeRoute);

  const startButton = document.createElement("button");
  startButton.type = "button";
  startButton.className = "btn btn-primary route-start-button";
  startButton.textContent = "Mulai navigasi";
  startButton.addEventListener("click", startNavigation);

  const googleButton = document.createElement("button");
  googleButton.type = "button";
  googleButton.className = "btn btn-ghost route-secondary-button";
  googleButton.textContent = "Google Maps";
  googleButton.addEventListener("click", function () {
    openGoogleMaps(location);
  });

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "btn btn-ghost route-secondary-button";
  cancelButton.textContent = "Batal";
  cancelButton.addEventListener("click", closeRoutePanel);

  panel.append(
    heading,
    subtitle,
    choices,
    startButton,
    googleButton,
    cancelButton,
  );
  panel.classList.add("show");
}

function drawPreviewLine(route) {
  routeLayer.clearLayers();
  if (!route || !route.geometry) return;

  const line = L.geoJSON(route.geometry, {
    style: {
      color: "#0284C7",
      weight: 6,
      opacity: 0.9,
    },
  }).addTo(routeLayer);

  if (navigationDestination) {
    L.circleMarker(navigationDestination.position, {
      radius: 9,
      color: "#ffffff",
      weight: 3,
      fillColor: "#DC2626",
      fillOpacity: 1,
    }).addTo(routeLayer);
  }

  // Di HP, sisakan ruang untuk panel rute (bawah) dan pencarian (atas) agar rute tidak tertutup.
  const compact = window.matchMedia("(max-width: 959px)").matches;
  map.fitBounds(line.getBounds(), compact
    ? { paddingTopLeft: [24, 130], paddingBottomRight: [24, Math.round(window.innerHeight * 0.34) + 110] }
    : { padding: [40, 40] });
}


function loadNavigationSteps(route) {
  navigationSteps = route?.legs?.[0]?.steps || [];

  // Lewati langkah "depart" jika ada, agar langsung menampilkan
  // petunjuk perjalanan berikutnya.
  currentStepIndex = navigationSteps.findIndex(function (step) {
    return step.maneuver?.type !== "depart";
  });

  if (currentStepIndex < 0) currentStepIndex = 0;
}

const MODIFIER_ID = {
  left: "kiri",
  right: "kanan",
  "slight left": "sedikit ke kiri",
  "slight right": "sedikit ke kanan",
  "sharp left": "tajam ke kiri",
  "sharp right": "tajam ke kanan",
  straight: "lurus",
  uturn: "putar balik",
};

function describeManeuver(step) {
  const maneuver = step?.maneuver || {};
  const type = maneuver.type || "continue";
  const rawModifier = maneuver.modifier || "";
  const modifier = MODIFIER_ID[rawModifier] || rawModifier;
  const road = step?.name ? " ke " + step.name : "";

  if (type === "depart") return "Mulai perjalanan" + road;
  if (type === "arrive") return "Kamu hampir sampai di tujuan";
  if (type === "turn") return "Belok " + modifier + road;
  if (type === "roundabout" || type === "rotary") {
    return "Masuk bundaran" + road;
  }
  if (type === "merge") return "Bergabung ke jalan" + road;
  if (type === "on ramp") return "Masuk jalan" + road;
  if (type === "off ramp") return "Keluar jalan" + road;
  if (type === "fork") return "Ambil cabang " + modifier + road;
  if (type === "end of road") {
    return "Di ujung jalan, belok " + modifier + road;
  }
  if (type === "continue" || type === "new name") {
    return "Lanjutkan perjalanan" + road;
  }

  return type.replace(/_/g, " ") + road;
}

// Menghitung perkiraan kemajuan berdasarkan titik terdekat
// pada garis rute, bukan hanya jarak garis lurus ke tujuan.
function getRouteProgress(route) {
  const coordinates = route?.geometry?.coordinates;

  if (!coordinates || coordinates.length < 2 || !userPosition) {
    return null;
  }

  let nearestIndex = 0;
  let nearestDistance = Infinity;
  let distanceAlongRoute = 0;

  for (let i = 0; i < coordinates.length; i++) {
    const point = [coordinates[i][1], coordinates[i][0]];
    const distance = distanceInMeters(userPosition, point);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = i;
    }
  }

  for (let i = 1; i <= nearestIndex; i++) {
    const previous = [coordinates[i - 1][1], coordinates[i - 1][0]];
    const current = [coordinates[i][1], coordinates[i][0]];
    distanceAlongRoute += distanceInMeters(previous, current);
  }

  const totalDistance = Number(route.distance) || 0;

  return {
    distanceAlongRoute: Math.min(distanceAlongRoute, totalDistance),
    remainingDistance: Math.max(0, totalDistance - distanceAlongRoute),
    nearestDistance
  };
}

// Di HP panel rute menutupi bagian bawah peta: geser titik tengah agar posisi pengguna tetap terlihat.
function followCenter(latlng, zoom) {
  if (!window.matchMedia("(max-width: 959px)").matches) return latlng;
  const shift = Math.round(window.innerHeight * 0.14);
  const point = map.project(latlng, zoom).add([0, shift]);
  return map.unproject(point, zoom);
}

function startNavigation() {
  if (!activeRoute || !navigationDestination) return;

  navigationActive = true;
  navigationStartTime = Date.now();
  lastProgressUpdate = 0;
  lastRerouteTime = 0;

  loadNavigationSteps(activeRoute);
  updateNavigationProgress();

  if (userPosition) map.setView(followCenter(userPosition, 17), 17);

  stopNavigationGPS();

  gpsWatchId = navigator.geolocation.watchPosition(
    function (position) {
      updateUserLocation(position);

      if (!navigationActive || !activeRoute) return;

      const accuracy = position.coords.accuracy;

if (Number.isFinite(accuracy) && accuracy > 60) {
  updateNavigationProgress();

  const status = document.getElementById("navigationStatus");
  if (status) {
    status.classList.add("warn");
    status.textContent =
      "GPS kurang akurat (±" + Math.round(accuracy) +
      " m). Perkiraan navigasi bisa kurang tepat.";
  }

  return;
}

      map.panTo(followCenter(userPosition, map.getZoom()), { animate: true });
      updateNavigationProgress();
      checkRouteDeviation();
    },
    function (error) {
      console.warn("GPS navigasi:", error.message);
      updateNavigationPanel(
        "GPS tidak tersedia. Periksa izin lokasi dan sinyal."
      );
    },
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 15000
    }
  );
}

function updateNavigationProgress() {
  if (!navigationActive || !activeRoute || !navigationDestination) return;

  const now = Date.now();
  if (now - lastProgressUpdate < 700) return;
  lastProgressUpdate = now;

  const progress = getRouteProgress(activeRoute);

  if (!progress) {
    updateNavigationPanel("Menunggu posisi GPS...");
    return;
  }

  // Cari langkah belokan berikutnya.
  // Jika sudah dekat dengan titik manuver, lanjutkan ke langkah selanjutnya.
  while (currentStepIndex < navigationSteps.length - 1) {
    const step = navigationSteps[currentStepIndex];
    const maneuverLocation = step?.maneuver?.location;

    if (!maneuverLocation) break;

    const maneuverPosition = [
      maneuverLocation[1],
      maneuverLocation[0]
    ];

    const distanceToManeuver = distanceInMeters(
      userPosition,
      maneuverPosition
    );

    if (distanceToManeuver <= 30) {
      currentStepIndex++;
    } else {
      break;
    }
  }

  const currentStep = navigationSteps[currentStepIndex];
  const nextInstruction = currentStep
    ? describeManeuver(currentStep)
    : "Lanjutkan menuju tujuan";

  let distanceToNext = null;
  const stepLocation = currentStep?.maneuver?.location;

  if (stepLocation) {
    distanceToNext = distanceInMeters(
      userPosition,
      [stepLocation[1], stepLocation[0]]
    );
  }

  const remainingMeters = progress.remainingDistance;

  // Perkiraan waktu menggunakan durasi rute dari OSRM.
  const totalRouteDistance = Number(activeRoute.distance) || 0;
  const totalRouteDuration = Number(activeRoute.duration) || 0;

  const estimatedMinutes = totalRouteDistance > 0
    ? Math.ceil(
        (remainingMeters / totalRouteDistance) *
        totalRouteDuration / 60
      )
    : 0;

  if (remainingMeters < 30) {
    updateNavigationPanel(
      "Kamu sudah dekat dengan tujuan.",
      null,
      remainingMeters,
      0
    );
    return;
  }

  updateNavigationPanel(
    nextInstruction,
    distanceToNext,
    remainingMeters,
    estimatedMinutes
  );
}

function updateNavigationPanel(
  status,
  distanceToNext = null,
  remainingMeters = null,
  estimatedMinutes = null
) {
  const panel = getRoutePanel();
  panel.replaceChildren();

  const heading = document.createElement("h3");
  heading.textContent =
    "Navigasi ke " +
    (navigationDestination ? navigationDestination.name : "TPS");

  // Bagian petunjuk belokan.
  const instruction = document.createElement("div");
  instruction.className = "navigation-summary";

  if (distanceToNext !== null) {
    instruction.textContent =
      status + " dalam " + formatDistance(distanceToNext);
  } else {
    instruction.textContent = status;
  }

  // Bagian sisa jarak dan waktu.
  const stats = document.createElement("div");
  stats.className = "navigation-stats";

  const distanceBox = document.createElement("div");
  const distanceLabel = document.createElement("small");
  distanceLabel.textContent = "Sisa jarak";
  const distanceValue = document.createElement("strong");
  distanceValue.textContent = remainingMeters !== null
    ? formatDistance(remainingMeters)
    : "Menghitung...";

  distanceBox.append(distanceLabel, distanceValue);

  const timeBox = document.createElement("div");
  const timeLabel = document.createElement("small");
  timeLabel.textContent = "Estimasi";
  const timeValue = document.createElement("strong");
  timeValue.textContent = estimatedMinutes !== null
    ? estimatedMinutes + " menit"
    : "Menghitung...";

  timeBox.append(timeLabel, timeValue);
  stats.append(distanceBox, timeBox);

  const note = document.createElement("p");
  note.id = "navigationStatus";
  note.textContent =
    "Perkiraan dapat berubah. Perhatikan rambu dan kondisi jalan.";

  const googleButton = document.createElement("button");
  googleButton.type = "button";
  googleButton.className = "btn btn-ghost route-secondary-button";
  googleButton.textContent = "Buka Google Maps";
  googleButton.addEventListener("click", function () {
    if (navigationDestination) {
      openGoogleMaps(navigationDestination);
    }
  });

  const stopButton = document.createElement("button");
  stopButton.type = "button";
  stopButton.className = "btn btn-danger route-stop-button";
  stopButton.textContent = "Akhiri navigasi";
  stopButton.addEventListener("click", closeRoutePanel);

  panel.append(
    heading,
    instruction,
    stats,
    note,
    googleButton,
    stopButton
  );

  panel.classList.add("show");
}


function checkRouteDeviation() {
  if (!navigationActive || !activeRoute || isRerouting) return;
  if (Date.now() - lastRerouteTime < 15000) return;

  const line = L.geoJSON(activeRoute.geometry);
  const coordinates = activeRoute.geometry.coordinates;

  if (!coordinates || !coordinates.length) return;

  // Cari jarak GPS ke titik-titik garis rute terdekat.
  let closestDistance = Infinity;
  const sampleEvery = Math.max(1, Math.floor(coordinates.length / 250));

  for (let i = 0; i < coordinates.length; i += sampleEvery) {
    const point = [coordinates[i][1], coordinates[i][0]];
    const distance = distanceInMeters(userPosition, point);

    if (distance < closestDistance) closestDistance = distance;
  }

  // Toleransi lebih besar agar GPS yang sedikit bergeser tidak memicu reroute.
  if (closestDistance > 90 && navigationDestination) {
    lastRerouteTime = Date.now();
    isRerouting = true;

    updateNavigationPanel("Kamu keluar dari rute. Menghitung ulang...");

    requestRoutes(navigationDestination, true);
  }
}

/* =====================================
   10. RAPIIKAN UKURAN PETA
===================================== */

window.addEventListener("load", function () {
  setTimeout(function () {
    map.invalidateSize();
  }, 300);
});

console.log("SampahMap siap. Jumlah lokasi:", locations.length);


/* =====================================
   11. PELACAKAN POSISI (IKUTI LOKASI SAYA)
   Tiga keadaan tombol: off -> follow -> (digeser pengguna) free -> follow
===================================== */

const trackButton = document.getElementById("trackButton");
let trackWatchId = null;
let trackState = "off";
let trackFirstFix = true;

function setTrackState(state) {
  trackState = state;
  if (!trackButton) return;
  trackButton.dataset.state = state;
  trackButton.setAttribute("aria-pressed", String(state === "follow"));
  trackButton.setAttribute(
    "aria-label",
    state === "off"
      ? "Mulai lacak posisi saya"
      : state === "follow"
        ? "Hentikan pelacakan posisi"
        : "Kembali mengikuti posisi saya"
  );
}

function startTracking() {
  if (!navigator.geolocation) {
    document.getElementById("nearestMessage").textContent = "Browser ini tidak mendukung GPS.";
    return;
  }

  trackFirstFix = true;
  setTrackState("follow");

  trackWatchId = navigator.geolocation.watchPosition(
    function (position) {
      updateUserLocation(position);

      // Saat navigasi aktif, kamera diatur oleh navigasi.
      if (navigationActive || trackState !== "follow") return;

      if (trackFirstFix) {
        trackFirstFix = false;
        map.flyTo(userPosition, Math.max(map.getZoom(), 16), { duration: reduceMotion ? 0 : 0.8 });
      } else {
        map.panTo(userPosition, { animate: !reduceMotion });
      }
    },
    function (error) {
      locationError(error);
      stopTracking();
    },
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
  );
}

function stopTracking() {
  if (trackWatchId !== null) {
    navigator.geolocation.clearWatch(trackWatchId);
    trackWatchId = null;
  }
  setTrackState("off");
}

if (trackButton) {
  setTrackState("off");

  trackButton.addEventListener("click", function () {
    if (trackState === "off") {
      startTracking();
    } else if (trackState === "free") {
      setTrackState("follow");
      if (userPosition) map.panTo(userPosition, { animate: !reduceMotion });
    } else {
      stopTracking();
    }
  });

  // Jika peta digeser sendiri oleh pengguna, berhenti mengikuti (marker tetap diperbarui).
  map.on("dragstart", function () {
    if (trackState === "follow") setTrackState("free");
  });
}

/* =====================================
   12. DATA LAPORAN WARGA + PARAMETER URL
   ?q=...        cari lokasi (dari pencarian di Beranda)
   ?laporan=ID   langsung menuju penanda laporan (dari halaman Laporan)
===================================== */

const urlParams = new URLSearchParams(window.location.search);

SM.reports.fetch()
  .then(function (rows) {
    SM.mapApi.setReports(rows, SM.reports.mapPopup);

    const wanted = urlParams.get("laporan");
    if (wanted && !SM.mapApi.focusReport(wanted)) {
      document.getElementById("nearestMessage").textContent =
        "Laporan yang dicari tidak punya titik koordinat di peta.";
    }
  })
  .catch(function (error) {
    console.warn("Laporan gagal dimuat:", error);
  });

(function () {
  const query = (urlParams.get("q") || "").trim();
  if (!query) return;
  searchInput.value = query;
  searchPlace();
})();


/* =====================================
   TPS TERDEKAT: panel di atas peta (mobile)
===================================== */
(function () {
  const toggle = document.getElementById("nearestToggle");
  const sheet = document.getElementById("nearestSection");
  const closeBtn = document.getElementById("nearestClose");
  if (!toggle || !sheet) return;

  function setOpen(open) {
    sheet.classList.toggle("sheet-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.classList.toggle("is-on", open);
  }

  toggle.addEventListener("click", function () {
    const open = !sheet.classList.contains("sheet-open");
    setOpen(open);
    if (open && !nearestList.children.length && !findNearestButton.disabled) {
      findNearestButton.click();
    }
  });
  if (closeBtn) closeBtn.addEventListener("click", function () { setOpen(false); });

  // Pilih TPS dari daftar: tutup panel agar peta dan popup terlihat penuh.
  nearestList.addEventListener("click", function (event) {
    if (event.target.closest(".nearest-item")) setOpen(false);
  });
})();
