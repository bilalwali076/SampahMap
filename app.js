"use strict";

/* =====================================
   1. DATA DAN INISIALISASI PETA
===================================== */

const palembangCenter = [-2.9761, 104.7754];

const map = L.map("map", {
  zoomControl: false,
}).setView(palembangCenter, 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const tpsLayer = L.layerGroup().addTo(map);
const tpaLayer = L.layerGroup().addTo(map);
const routeLayer = L.layerGroup().addTo(map);

let userMarker = null;
let userAccuracyCircle = null;
let userPosition = null;
let selectedLocation = null;
let routeRequestId = 0;

/* Ambil data dari data/tps-data.js */
let locations = [];

try {
  if (typeof tpsLocations !== "undefined" && Array.isArray(tpsLocations)) {
    locations = tpsLocations;
  } else {
    console.error("Data TPS tidak ditemukan. Periksa data/tps-data.js");
  }
} catch (error) {
  console.error("Gagal membaca data TPS:", error);
}

/* =====================================
   2. PENANDA TPS DAN TPA
===================================== */

function createPopupContent(location) {
  const wrapper = document.createElement("div");

  const title = document.createElement("strong");
  title.textContent = location.name || "Lokasi";
  wrapper.appendChild(title);

  const address = document.createElement("p");
  address.textContent = location.description || "Alamat belum tersedia";
  wrapper.appendChild(address);

  const detailButton = document.createElement("button");
  detailButton.type = "button";
  detailButton.textContent = "Lihat pilihan navigasi";
  detailButton.style.cssText =
    "padding:8px;border:0;border-radius:6px;background:#166534;color:white;cursor:pointer;";

  detailButton.addEventListener("click", function () {
    showLocationOptions(location);
  });

  wrapper.appendChild(detailButton);
  return wrapper;
}

locations.forEach(function (location) {
  if (!Array.isArray(location.position) || location.position.length !== 2) {
    return;
  }

  const isTPA = location.type === "tpa";

  const marker = L.circleMarker(location.position, {
    radius: 8,
    color: isTPA ? "#1d4ed8" : "#15803d",
    fillColor: isTPA ? "#3b82f6" : "#22c55e",
    fillOpacity: 0.95,
    weight: 2,
  });

  marker.bindPopup(createPopupContent(location));
  marker.on("click", function () {
    selectedLocation = location;
  });

  marker.addTo(isTPA ? tpaLayer : tpsLayer);
});

L.control
  .layers(
    null,
    {
      "Lokasi TPS": tpsLayer,
      "Lokasi TPA": tpaLayer,
    },
    { collapsed: true },
  )
  .addTo(map);

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
    userMarker = L.circleMarker(userPosition, {
      radius: 8,
      color: "#ffffff",
      weight: 3,
      fillColor: "#2563eb",
      fillOpacity: 1,
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
      color: "#2563eb",
      weight: 1,
      fillColor: "#60a5fa",
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
      L.popup()
        .setLatLng(location.position)
        .setContent(createPopupContent(location))
        .openOn(map);

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

        const title = document.createElement("strong");
        title.textContent = index + 1 + ". " + item.location.name;

        const detail = document.createElement("small");
        detail.textContent =
          (item.location.description || "Alamat belum tersedia") +
          " · " +
          formatDistance(item.distance) +
          " (garis lurus)";

        button.append(title, detail);

        button.addEventListener("click", function () {
          selectedLocation = item.location;
          map.flyTo(item.location.position, 16);

          L.popup()
            .setLatLng(item.location.position)
            .setContent(createPopupContent(item.location))
            .openOn(map);
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
  selectedLocation = location;

  const popup = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = location.name;

  const address = document.createElement("p");
  address.textContent = location.description || "Alamat belum tersedia";

  const routeButton = document.createElement("button");
  routeButton.type = "button";
  routeButton.textContent = "Pilih rute";
  routeButton.className = "route-action-button";
  routeButton.addEventListener("click", function () {
    map.closePopup();
    prepareRoute(location);
  });

  const googleButton = document.createElement("button");
  googleButton.type = "button";
  googleButton.textContent = "Buka Google Maps";
  googleButton.className = "route-secondary-button";
  googleButton.addEventListener("click", function () {
    openGoogleMaps(location);
  });

  popup.append(title, address, routeButton, googleButton);

  L.popup({ maxWidth: 280 })
    .setLatLng(location.position)
    .setContent(popup)
    .openOn(map);
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
    document.querySelector(".map-section").appendChild(panel);
  }

  return panel;
}


function showRouteMessage(message) {
  const panel = getRoutePanel();
  panel.replaceChildren();

  const text = document.createElement("p");
  text.textContent = message;

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "route-stop-button";
  cancelButton.textContent = "✕ Batalkan pencarian";

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

  
 
  panel.replaceChildren();

  const loading = document.createElement("p");
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
  startButton.className = "route-start-button";
  startButton.textContent = "▶ Mulai";
  startButton.addEventListener("click", startNavigation);

  const googleButton = document.createElement("button");
  googleButton.type = "button";
  googleButton.className = "route-secondary-button";
  googleButton.textContent = "Navigasi dengan Google Maps";
  googleButton.addEventListener("click", function () {
    openGoogleMaps(location);
  });

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "route-secondary-button";
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
      color: "#2563eb",
      weight: 6,
      opacity: 0.9,
    },
  }).addTo(routeLayer);

  if (navigationDestination) {
    L.circleMarker(navigationDestination.position, {
      radius: 9,
      color: "#ffffff",
      weight: 3,
      fillColor: "#dc2626",
      fillOpacity: 1,
    }).addTo(routeLayer);
  }

  map.fitBounds(line.getBounds(), { padding: [40, 40] });
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

function describeManeuver(step) {
  const maneuver = step?.maneuver || {};
  const type = maneuver.type || "continue";
  const modifier = maneuver.modifier || "";
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

function startNavigation() {
  if (!activeRoute || !navigationDestination) return;

  navigationActive = true;
  navigationStartTime = Date.now();
  lastProgressUpdate = 0;
  lastRerouteTime = 0;

  loadNavigationSteps(activeRoute);
  updateNavigationProgress();

  if (userPosition) map.setView(userPosition, 17);

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
    status.textContent =
      "GPS kurang akurat (±" + Math.round(accuracy) +
      " m). Perkiraan navigasi bisa kurang tepat.";
  }

  return;
}

      map.panTo(userPosition, { animate: true });
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
  distanceLabel.textContent = "Sisa perjalanan";
  const distanceValue = document.createElement("strong");
  distanceValue.textContent = remainingMeters !== null
    ? formatDistance(remainingMeters)
    : "Menghitung...";

  distanceBox.append(distanceLabel, distanceValue);

  const timeBox = document.createElement("div");
  const timeLabel = document.createElement("small");
  timeLabel.textContent = "Perkiraan waktu";
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
  googleButton.className = "route-secondary-button";
  googleButton.textContent = "Buka Google Maps";
  googleButton.addEventListener("click", function () {
    if (navigationDestination) {
      openGoogleMaps(navigationDestination);
    }
  });

  const stopButton = document.createElement("button");
  stopButton.type = "button";
  stopButton.className = "route-stop-button";
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

/* NAVIGASI MENU SAMPING */
const menuButton = document.getElementById("menuButton");
const closeMenuButton = document.getElementById("closeMenuButton");
const sideMenu = document.getElementById("sideMenu");
const menuOverlay = document.getElementById("menuOverlay");

function openSideMenu() {
    sideMenu.classList.add("show");
    menuOverlay.classList.add("show");
    menuButton.setAttribute("aria-expanded", "true");
}

function closeSideMenu() {
    sideMenu.classList.remove("show");
    menuOverlay.classList.remove("show");
    menuButton.setAttribute("aria-expanded", "false");
}

menuButton?.addEventListener("click", openSideMenu);
closeMenuButton?.addEventListener("click", closeSideMenu);
menuOverlay?.addEventListener("click", closeSideMenu);

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closeSideMenu();
    }
});
