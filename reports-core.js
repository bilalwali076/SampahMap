"use strict";

/* =====================================================
   SampahMap Palembang — reports-core.js
   Bagian bersama untuk semua halaman yang membaca laporan warga:
   Beranda (angka + pratinjau), Peta (penanda), Laporan (daftar).
   Mengambil data dari Supabase (tabel laporan_sampah).
===================================================== */
(function () {
  const SM = window.SM;
  const cfg = window.SM_CONFIG;

  const STATUS = {
    menunggu: { label: "Menunggu", badge: "badge--menunggu", color: "#D97706" },
    diproses: { label: "Diproses", badge: "badge--diproses", color: "#0284C7" },
    selesai: { label: "Selesai", badge: "badge--selesai", color: "#16A34A" },
  };

  /* ---------- Supabase ---------- */
  let client = null;
  try {
    if (window.supabase && cfg) {
      client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    }
  } catch (error) {
    console.error("Supabase gagal diinisialisasi:", error);
  }

  /* ---------- Helper ---------- */
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function num(value) {
    if (value === null || value === undefined || value === "") return NaN;
    return Number(value);
  }

  function normalizeStatus(raw) {
    const s = String(raw || "").toLowerCase();
    if (/selesai|tuntas|teratasi|bersih/.test(s)) return "selesai";
    if (/proses|tindak|kerja|tangani/.test(s)) return "diproses";
    return "menunggu";
  }

  function parseRow(r, index) {
    return {
      id: String(r.kode_laporan || r.id || "laporan-" + index),
      nama: String(r.nama_pelapor || "").trim(),
      jenis: r.jenis_laporan || "Laporan sampah",
      alamat: r.alamat || "",
      lat: num(r.latitude),
      lng: num(r.longitude),
      deskripsi: r.deskripsi || "",
      foto: r.foto_url || "",
      status: normalizeStatus(r.status),
      created: r.created_at || r.tanggal || r.dibuat_pada || r.inserted_at || null,
    };
  }

  /* Urgensi diturunkan dari jenis laporan dan lama menunggu. */
  function urgencyOf(row) {
    if (row.status === "selesai") return null;

    const jenis = row.jenis.toLowerCase();
    const days = row.created ? (Date.now() - new Date(row.created).getTime()) / 86400000 : 0;
    const waiting = row.status === "menunggu";

    if (jenis.includes("bakar") || (waiting && days >= 3)) return { key: "tinggi", label: "Urgensi tinggi" };
    if (jenis.includes("menumpuk") || (waiting && days >= 1)) return { key: "sedang", label: "Urgensi sedang" };
    return { key: "rendah", label: "Urgensi rendah" };
  }

  /* Nama pelapor hanya ditampilkan nama depannya. */
  function publicName(nama) {
    const first = nama.split(/\s+/)[0] || "";
    return first ? first.slice(0, 20) : "Warga";
  }

  function photoUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    if (!client) return "";
    try {
      return client.storage.from(cfg.STORAGE_BUCKET).getPublicUrl(path).data.publicUrl || "";
    } catch (error) {
      return "";
    }
  }

  function statusBadge(row, solid) {
    const st = STATUS[row.status];
    return el("span", "badge " + st.badge + (solid ? " badge--solid" : ""), st.label);
  }

  function urgencyBadge(row, solid) {
    const u = urgencyOf(row);
    if (!u) return null;
    return el("span", "badge badge--plain badge--" + u.key + (solid ? " badge--solid" : ""), u.label);
  }

  function formatDate(value) {
    const d = new Date(value);
    if (isNaN(d)) return "";
    return d.toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  /* ---------- Ambil data ---------- */
  async function fetchRows() {
    if (!client) throw new Error("Library Supabase belum dimuat.");

    let res = await client.from(cfg.REPORT_TABLE).select("*").order("created_at", { ascending: false }).limit(60);
    if (res.error) {
      // Kolom created_at mungkin tidak ada; coba tanpa urutan.
      res = await client.from(cfg.REPORT_TABLE).select("*").limit(60);
    }
    if (res.error) throw res.error;
    return (res.data || []).map(parseRow);
  }

  /* Popup penanda laporan di halaman Peta. */
  function mapPopup(row) {
    const wrap = el("div", "pop");
    wrap.appendChild(statusBadge(row, false));
    wrap.appendChild(el("h4", "", row.jenis));
    wrap.appendChild(el("p", "", row.alamat || "Alamat belum dicantumkan"));
    if (row.deskripsi) wrap.appendChild(el("p", "", row.deskripsi));

    if (row.created) {
      const meta = el("div", "pop-meta");
      meta.appendChild(SM.icon("clock"));
      meta.appendChild(document.createTextNode(SM.timeAgo(row.created)));
      wrap.appendChild(meta);
    }

    return wrap;
  }

  SM.reports = {
    STATUS: STATUS,
    el: el,
    fetch: fetchRows,
    urgencyOf: urgencyOf,
    publicName: publicName,
    photoUrl: photoUrl,
    statusBadge: statusBadge,
    urgencyBadge: urgencyBadge,
    formatDate: formatDate,
    mapPopup: mapPopup,
  };
})();
