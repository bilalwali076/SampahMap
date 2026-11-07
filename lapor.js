"use strict";

/* =====================================================
   SAMPahMAP PALEMBANG — LAPORAN.JS
   Fitur:
   1. Peta pemilihan lokasi
   2. GPS lokasi pengguna
   3. Penanda lokasi laporan
   4. Pencarian alamat melalui koordinat
   5. Pratinjau dan kompresi foto
   6. Upload foto ke Supabase Storage
   7. Simpan laporan ke Supabase Database
===================================================== */

/* =====================================================
   1. KONFIGURASI SUPABASE
===================================================== */

// Nilai konfigurasi ada di config.js
const { SUPABASE_URL, SUPABASE_ANON_KEY, STORAGE_BUCKET, REPORT_TABLE } =
  window.SM_CONFIG;
const MAX_PHOTO_SIZE = 1024 * 1024; // 1 MB

if (!window.supabase) {
  console.error(
    "Supabase belum dimuat. Periksa script Supabase di lapor.html.",
  );
  throw new Error("Library Supabase tidak ditemukan.");
}

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

/* =====================================================
   2. AMBIL ELEMEN HTML
===================================================== */

const locationPicker = document.getElementById("locationPicker");
const useCurrentLocation = document.getElementById("useCurrentLocation");
const getCurrentGPS = document.getElementById("getCurrentGPS");
const confirmLocation = document.getElementById("confirmLocation");
const cancelLocation = document.getElementById("cancelLocation");

const reportAddress = document.getElementById("reportAddress");
const latitudeInput = document.getElementById("latitude");
const longitudeInput = document.getElementById("longitude");

const locationMessage = document.getElementById("locationMessage");
const selectedCoordinates = document.getElementById("selectedCoordinates");

const reportForm = document.getElementById("reportForm");
const reportMessage = document.getElementById("reportMessage");

const reporterName = document.getElementById("reporterName");
const reportType = document.getElementById("reportType");
const reportDescription = document.getElementById("reportDescription");

const reportPhoto = document.getElementById("reportPhoto");
const photoPreview = document.getElementById("photoPreview");

/* =====================================================
   3. VARIABEL
===================================================== */

let reportMap = null;
let locationMarker = null;
let accuracyCircle = null;

let temporaryLocation = null;
let confirmedLocation = null;
let selectedPhoto = null;

/* =====================================================
   4. FUNGSI PESAN
===================================================== */

function showLocationMessage(message, type = "info") {
  if (!locationMessage) return;

  locationMessage.textContent = message;
  locationMessage.dataset.type = type;
}

function showReportMessage(message, type = "info") {
  if (!reportMessage) return;

  reportMessage.textContent = message;
  reportMessage.dataset.type = type;
}

/* =====================================================
   5. VALIDASI ELEMEN HTML
===================================================== */

function validateRequiredElements() {
  const requiredElements = {
    locationPicker,
    confirmLocation,
    reportAddress,
    latitudeInput,
    longitudeInput,
    reportForm,
    reportMessage,
    reporterName,
    reportType,
    reportDescription,
    reportPhoto,
  };

  const missingElements = Object.entries(requiredElements)
    .filter(([, element]) => !element)
    .map(([name]) => name);

  if (missingElements.length > 0) {
    console.error("Elemen HTML tidak ditemukan:", missingElements.join(", "));

    showReportMessage(
      "Ada elemen formulir yang belum sesuai. Periksa ID di lapor.html.",
      "error",
    );

    return false;
  }

  return true;
}

/* =====================================================
   6. INISIALISASI PETA LEAFLET
===================================================== */

function getMapElement() {
  // Mendukung beberapa nama elemen peta.
  const candidates = [
    document.getElementById("reportMap"),
    locationPicker?.querySelector("#reportMap"),
    locationPicker?.querySelector(".report-map"),
    locationPicker?.querySelector(".map-container"),
    locationPicker?.querySelector("[data-report-map]"),
  ];

  for (const element of candidates) {
    if (element) return element;
  }

  // Jika locationPicker sendiri adalah wadah peta.
  if (locationPicker) return locationPicker;

  return null;
}

function initializeReportMap() {
  if (reportMap) {
    setTimeout(() => reportMap.invalidateSize(), 100);
    return true;
  }

  if (!window.L) {
    showLocationMessage(
      "Peta gagal dimuat. Periksa koneksi internet dan Leaflet.",
      "error",
    );
    console.error("Library Leaflet tidak ditemukan.");
    return false;
  }

  const mapElement = getMapElement();

  if (!mapElement) {
    showLocationMessage(
      "Elemen peta tidak ditemukan. Periksa lapor.html.",
      "error",
    );
    return false;
  }

  // Palembang sebagai titik awal peta.
  const palembangCenter = [-2.9761, 104.7754];

  reportMap = L.map(mapElement).setView(palembangCenter, 13);

  reportMap.attributionControl.setPrefix(false);
  window.SM.addBaseLayer(reportMap);

  reportMap.on("click", function (event) {
    selectTemporaryLocation(event.latlng.lat, event.latlng.lng);
  });

  if (confirmedLocation) {
    selectTemporaryLocation(confirmedLocation.lat, confirmedLocation.lng);
  }

  setTimeout(() => {
    if (reportMap) reportMap.invalidateSize();
  }, 200);

  return true;
}

/* =====================================================
   7. PILIH LOKASI SEMENTARA
===================================================== */

function selectTemporaryLocation(lat, lng, accuracy = null) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    showLocationMessage("Koordinat lokasi tidak valid.", "error");
    return;
  }

  temporaryLocation = { lat, lng };

  if (!reportMap && !initializeReportMap()) {
    return;
  }

  const selectedLatLng = [lat, lng];

  if (!locationMarker) {
    locationMarker = L.marker(selectedLatLng, {
      draggable: true,
      icon: window.SM.pinIcon("#166534", "pin"),
      title: "Geser untuk memindahkan lokasi",
    }).addTo(reportMap);

    locationMarker.on("dragend", function () {
      const position = locationMarker.getLatLng();

      selectTemporaryLocation(position.lat, position.lng);
    });
  } else {
    locationMarker.setLatLng(selectedLatLng);
  }

  if (accuracyCircle) {
    reportMap.removeLayer(accuracyCircle);
    accuracyCircle = null;
  }

  if (Number.isFinite(accuracy) && accuracy > 0) {
    accuracyCircle = L.circle(selectedLatLng, {
      radius: accuracy,
      color: "#0284C7",
      fillColor: "#7DD3FC",
      fillOpacity: 0.12,
      weight: 1,
    }).addTo(reportMap);
  }

  reportMap.setView(selectedLatLng, 16);

  if (selectedCoordinates) {
    selectedCoordinates.textContent = `Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  if (confirmLocation) {
    confirmLocation.disabled = false;
  }

  showLocationMessage(
    "Lokasi dipilih. Tekan Gunakan lokasi ini untuk menyimpan.",
    "success",
  );
}

/* =====================================================
   8. AMBIL LOKASI DARI GPS
===================================================== */

function getGPSLocation() {
  if (!navigator.geolocation) {
    showLocationMessage("Browser ini tidak mendukung GPS.", "error");
    return;
  }

  if (!initializeReportMap()) return;

  showLocationMessage("Sedang mengambil lokasi GPS...", "info");

  const gpsButtons = [useCurrentLocation, getCurrentGPS].filter(Boolean);

  gpsButtons.forEach((button) => {
    button.disabled = true;
  });

  navigator.geolocation.getCurrentPosition(
    function (position) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      selectTemporaryLocation(lat, lng, accuracy);

      showLocationMessage(
        "Lokasi GPS ditemukan. Pastikan titiknya sudah benar.",
        "success",
      );

      gpsButtons.forEach((button) => {
        button.disabled = false;
      });
    },

    function (error) {
      let message = "Gagal mengambil lokasi GPS.";

      if (error.code === error.PERMISSION_DENIED) {
        message = "Izin lokasi ditolak. Aktifkan izin lokasi di browser.";
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        message = "Lokasi belum tersedia. Coba aktifkan GPS perangkat.";
      } else if (error.code === error.TIMEOUT) {
        message = "GPS terlalu lama merespons. Coba tekan tombol GPS lagi.";
      }

      showLocationMessage(message, "error");

      gpsButtons.forEach((button) => {
        button.disabled = false;
      });
    },

    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 10000,
    },
  );
}

/* =====================================================
   9. KONFIRMASI LOKASI
===================================================== */

async function reverseGeocode(lat, lng) {
  // Nominatim digunakan untuk mencoba mendapatkan alamat.
  // Jika gagal, laporan tetap bisa memakai alamat yang
  // dimasukkan pengguna secara manual.

  const url =
    "https://nominatim.openstreetmap.org/reverse" +
    `?format=jsonv2&lat=${encodeURIComponent(lat)}` +
    `&lon=${encodeURIComponent(lng)}` +
    "&accept-language=id";

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Alamat tidak berhasil ditemukan.");
  }

  const data = await response.json();
  return data.display_name || "";
}

async function confirmSelectedLocation() {
  if (!temporaryLocation) {
    showLocationMessage("Pilih lokasi di peta terlebih dahulu.", "error");
    return;
  }

  const { lat, lng } = temporaryLocation;

  confirmedLocation = { lat, lng };

  latitudeInput.value = lat.toFixed(7);
  longitudeInput.value = lng.toFixed(7);

  if (selectedCoordinates) {
    selectedCoordinates.textContent = `Koordinat tersimpan: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  showLocationMessage("Koordinat tersimpan. Sedang mencari alamat...", "info");

  // Jangan menimpa alamat yang sudah diketik pengguna.
  const addressBeforeLookup = reportAddress.value.trim();

  try {
    const address = await reverseGeocode(lat, lng);

    if (
      address &&
      reportAddress.value.trim() === addressBeforeLookup &&
      !addressBeforeLookup
    ) {
      reportAddress.value = address;
    }

    showLocationMessage(
      address
        ? "Lokasi berhasil dikonfirmasi."
        : "Koordinat tersimpan. Silakan isi alamat secara manual.",
      "success",
    );
  } catch (error) {
    console.warn("Reverse geocoding gagal:", error);

    showLocationMessage(
      "Koordinat tersimpan. Jika alamat belum muncul, isi alamat secara manual.",
      "success",
    );
  }

  // Tutup peta setelah lokasi dikonfirmasi
  if (locationPicker) {
    locationPicker.hidden = true;
  }
}

/* =====================================================
   10. BATALKAN PEMILIHAN LOKASI
===================================================== */

function cancelLocationSelection() {
  temporaryLocation = confirmedLocation ? { ...confirmedLocation } : null;

  if (confirmedLocation) {
    selectTemporaryLocation(confirmedLocation.lat, confirmedLocation.lng);

    showLocationMessage(
      "Kembali ke lokasi yang sebelumnya dikonfirmasi.",
      "info",
    );
  } else {
    if (locationMarker && reportMap) {
      reportMap.removeLayer(locationMarker);
      locationMarker = null;
    }

    if (accuracyCircle && reportMap) {
      reportMap.removeLayer(accuracyCircle);
      accuracyCircle = null;
    }

    if (selectedCoordinates) {
      selectedCoordinates.textContent = "Belum ada lokasi yang dipilih.";
    }

    if (confirmLocation) {
      confirmLocation.disabled = true;
    }

    showLocationMessage("Pemilihan lokasi dibatalkan.", "info");
  }
  // Tutup panel peta ketika tombol Batal ditekan
  if (locationPicker) {
    locationPicker.hidden = true;
  }
}

/* =====================================================
   11. KOMPRESI FOTO
===================================================== */

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = function () {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = function () {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Foto tidak dapat dibaca."));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Gagal memproses foto."));
        }
      },
      "image/jpeg",
      quality,
    );
  });
}

async function compressImage(file) {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("File yang dipilih bukan gambar.");
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Gunakan foto JPG, PNG, atau WebP.");
  }

  const image = await loadImage(file);

  // Batasi dimensi agar ukuran file lebih ringan.
  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));

  const canvas = document.createElement("canvas");

  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Browser tidak dapat memproses foto.");
  }

  // JPEG tidak mendukung transparansi; gunakan latar putih.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.85;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > MAX_PHOTO_SIZE && quality > 0.35) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, quality);
  }

  if (blob.size > MAX_PHOTO_SIZE) {
    throw new Error("Foto masih lebih dari 1 MB. Pilih foto yang lebih kecil.");
  }

  const filename = `laporan-${Date.now()}.jpg`;

  return new File([blob], filename, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

/* =====================================================
   12. PRATINJAU FOTO
===================================================== */

if (reportPhoto) {
  reportPhoto.addEventListener("change", async function () {
    selectedPhoto = null;

    if (photoPreview) {
      photoPreview.removeAttribute("src");
      photoPreview.hidden = true;
    }

    const file = reportPhoto.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showReportMessage("Pilih file foto yang valid.", "error");
      reportPhoto.value = "";
      return;
    }

    showReportMessage("Sedang memproses foto...", "info");

    try {
      const compressedPhoto = await compressImage(file);
      selectedPhoto = compressedPhoto;

      if (photoPreview) {
        photoPreview.src = URL.createObjectURL(compressedPhoto);
        photoPreview.hidden = false;
      }

      const sizeInKB = Math.round(compressedPhoto.size / 1024);

      showReportMessage(`Foto siap diunggah (${sizeInKB} KB).`, "success");
    } catch (error) {
      console.error("Pemrosesan foto gagal:", error);

      selectedPhoto = null;
      reportPhoto.value = "";

      showReportMessage(error.message || "Foto gagal diproses.", "error");
    }
  });
}

/* =====================================================
   13. NAMA FILE FOTO UNIK
===================================================== */

function createPhotoPath(file) {
  const extension = "jpg";
  const randomPart = Math.random().toString(36).slice(2, 10);

  return `${Date.now()}-${randomPart}.${extension}`;
}

/* =====================================================
   14. UPLOAD FOTO KE SUPABASE STORAGE
===================================================== */

async function uploadReportPhoto(file) {
  if (!file) return null;

  const filePath = createPhotoPath(file);

  const { data, error } = await supabaseClient.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload foto gagal:", error);
    throw new Error(
      "Foto gagal diunggah. Periksa bucket dan kebijakan Storage Supabase.",
    );
  }

  return data.path;
}

/* =====================================================
   15. SIMPAN LAPORAN KE DATABASE
===================================================== */

async function saveReport(reportData) {
  const { error } = await supabaseClient
    .from(REPORT_TABLE)
    .insert([reportData]);

  if (error) {
    console.error("Detail error Supabase:", error);
    throw new Error(
      `Gagal menyimpan laporan: ${error.message} (kode: ${error.code || "tidak tersedia"})`,
    );
  }
}

/* =====================================================
   16. KIRIM FORMULIR LAPORAN
===================================================== */

if (reportForm) {
  reportForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!validateRequiredElements()) return;

    const name = reporterName.value.trim();
    const type = reportType.value;
    const address = reportAddress.value.trim();
    const description = reportDescription.value.trim();

    const lat = Number(latitudeInput.value);
    const lng = Number(longitudeInput.value);

    if (!name) {
      showReportMessage("Nama pelapor wajib diisi.", "error");
      reporterName.focus();
      return;
    }

    if (!type) {
      showReportMessage("Pilih jenis laporan terlebih dahulu.", "error");
      reportType.focus();
      return;
    }

    if (!address) {
      showReportMessage("Alamat lokasi wajib diisi.", "error");
      reportAddress.focus();
      return;
    }

    if (
      latitudeInput.value.trim() === "" ||
      longitudeInput.value.trim() === "" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      showReportMessage(
        "Pilih dan konfirmasi lokasi laporan di peta terlebih dahulu.",
        "error",
      );
      return;
    }

    if (!description) {
      showReportMessage("Deskripsi laporan wajib diisi.", "error");
      reportDescription.focus();
      return;
    }

    if (reportPhoto.files?.length > 0 && !selectedPhoto) {
      showReportMessage(
        "Tunggu sampai foto selesai diproses, atau pilih ulang fotonya.",
        "error",
      );
      return;
    }

    const submitButton = reportForm.querySelector(
      'button[type="submit"], input[type="submit"]',
    );

    const originalButtonText = submitButton
      ? submitButton.tagName === "INPUT"
        ? submitButton.value
        : submitButton.textContent
      : "";

    let uploadedPhotoPath = null;

    if (submitButton) {
      submitButton.disabled = true;

      if (submitButton.tagName === "INPUT") {
        submitButton.value = "Mengirim laporan...";
      } else {
        submitButton.textContent = "Mengirim laporan...";
      }
    }

    try {
      showReportMessage(
        "Sedang mengirim laporan. Jangan tutup halaman...",
        "info",
      );

      // 1. Unggah foto jika pengguna memilih foto.
      if (selectedPhoto) {
        uploadedPhotoPath = await uploadReportPhoto(selectedPhoto);
      }

      // 2. Susun data sesuai kolom tabel Supabase.
      //    (Kolom kode_laporan tidak ada di tabel, sehingga tidak dikirim.)
      const reportData = {
        nama_pelapor: name,
        jenis_laporan: type,
        alamat: address,
        latitude: lat,
        longitude: lng,
        deskripsi: description,
        foto_url: uploadedPhotoPath,
        status: "menunggu_verifikasi",
      };

      // 3. Simpan data laporan.
      await saveReport(reportData);

      showReportMessage(
        "Laporan berhasil dikirim. Terima kasih sudah membantu menjaga Palembang tetap bersih.",
        "success",
      );

      reportForm.reset();

      selectedPhoto = null;
      confirmedLocation = null;
      temporaryLocation = null;

      latitudeInput.value = "";
      longitudeInput.value = "";

      if (photoPreview) {
        photoPreview.removeAttribute("src");
        photoPreview.hidden = true;
      }

      if (selectedCoordinates) {
        selectedCoordinates.textContent = "Belum ada lokasi yang dipilih.";
      }

      if (confirmLocation) {
        confirmLocation.disabled = true;
      }

      if (locationMarker && reportMap) {
        reportMap.removeLayer(locationMarker);
        locationMarker = null;
      }

      if (accuracyCircle && reportMap) {
        reportMap.removeLayer(accuracyCircle);
        accuracyCircle = null;
      }

      showLocationMessage(
        "Pilih lokasi baru untuk laporan berikutnya.",
        "info",
      );
    } catch (error) {
      console.error("Pengiriman laporan gagal:", error);

      // Jika foto sudah terunggah tetapi penyimpanan laporan gagal,
      // coba hapus foto agar tidak meninggalkan file yatim.
      if (uploadedPhotoPath) {
        const { error: cleanupError } = await supabaseClient.storage
          .from(STORAGE_BUCKET)
          .remove([uploadedPhotoPath]);

        if (cleanupError) {
          console.warn("Foto sementara tidak berhasil dihapus:", cleanupError);
        }
      }

      showReportMessage(
        error.message || "Terjadi kesalahan saat mengirim laporan. Coba lagi.",
        "error",
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;

        if (submitButton.tagName === "INPUT") {
          submitButton.value = originalButtonText;
        } else {
          submitButton.textContent = originalButtonText;
        }
      }
    }
  });
}

/* =====================================================
   17. HUBUNGKAN TOMBOL
===================================================== */

if (getCurrentGPS && getCurrentGPS !== useCurrentLocation) {
  getCurrentGPS.addEventListener("click", getGPSLocation);
}

if (confirmLocation) {
  confirmLocation.addEventListener("click", confirmSelectedLocation);
}

if (cancelLocation) {
  cancelLocation.addEventListener("click", cancelLocationSelection);
}

/* BUKA PANEL PETA */
if (useCurrentLocation) {
  useCurrentLocation.addEventListener("click", function () {
    if (!locationPicker) return;

    locationPicker.hidden = false;

    // Tunggu panel tampil sebelum Leaflet menghitung ukuran peta.
    requestAnimationFrame(() => {
      const initialized = initializeReportMap();

      if (initialized && reportMap) {
        reportMap.invalidateSize();
      }
    });
  });
}

/* =====================================================
   18. PERSIAPAN AWAL
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
  if (!validateRequiredElements()) return;

  if (confirmLocation) {
    confirmLocation.disabled = true;
  }

  if (photoPreview) {
    photoPreview.hidden = true;
  }

  // Inisialisasi peta jika elemen peta sudah terlihat.
  // Jika peta berada dalam panel tersembunyi, inisialisasi
  // dilakukan ketika pengguna meminta lokasi GPS.
  const mapElement = getMapElement();

  if (
    mapElement &&
    mapElement.getBoundingClientRect().width > 0 &&
    mapElement.getBoundingClientRect().height > 0
  ) {
    initializeReportMap();
  }

  console.log("SampahMap: lapor.js berhasil dimuat.");
});
