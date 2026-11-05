
const tpsLocations = [
  // ==========================================
  // KELOMPOK TPS (Tempat Penampungan Sementara)
  // ==========================================
  {
    name: "TPS Pulau Layang",
    position: [-2.9984, 104.8115],
    type: "tps",
    description: "Jl. Kapten Robani Kadir No.15, Talang Putri, Kec. Plaju, Kota Palembang, Sumatera Selatan 30119"
  },
  {
    name: "TPS Talang Aman",
    position: [-2.9645, 104.7432],
    type: "tps",
    description: "Jl. Perikanan 4, Talang Aman, Kec. Kemuning, Kota Palembang, Sumatera Selatan 30151"
  },
  {
    name: "TPS Panca Usaha",
    position: [-2.9936, 104.7681],
    type: "tps",
    description: "Jl. Panca Usaha 2563-2533, 5 Ulu, Kecamatan Seberang Ulu I, Kota Palembang, Sumatera Selatan 30267"
  },
  {
    name: "TPS Lemabang",
    position: [-2.9680, 104.7765],
    type: "tps",
    description: "Jl. Bambang Utoyo No.110a, Kelurahan 3 Ilir, Kec. Ilir Tim. II, Kota Palembang, Sumatera Selatan 30116"
  },
  {
    name: "TPS Way Hitam (Tempat Pembuangan Sampah Sementara)",
    position: [-2.9750, 104.7120],
    type: "tps",
    description: "Jl. Kapten A. Anwar Arsyad, Siring Agung, Kec. Ilir Bar. I, Kota Palembang, Sumatera Selatan 30138"
  },
  {
    name: "TPS Pancasila",
    position: [-3.0125, 104.7250],
    type: "tps",
    description: "Karang Anyar, Kec. Gandus, Kota Palembang, Sumatera Selatan 30148"
  },
  {
    name: "TPS Puncak Sekuning",
    position: [-2.9780, 104.7352],
    type: "tps",
    description: "Jl. Puncak Sekuning, Bukit Lama, Kec. Ilir Bar. I, Kota Palembang, Sumatera Selatan 30128"
  },
  {
    name: "TPS Sultan Syahrir",
    position: [-2.9800, 104.7700],
    type: "tps",
    description: "Jl. Sutan Syahrir No.1497, 5 Ilir, Kec. Ilir Timur II, Kota Palembang, Sumatera Selatan 30114"
  },
  {
    name: "TPS Sampah Pasar Sako Mandiri",
    position: [-2.9210, 104.7785],
    type: "tps",
    description: "Sako, Kec. Sako, Kota Palembang, Sumatera Selatan 30961"
  },
  {
    name: "TPS Kebon Sirih",
    position: [-2.9612, 104.7925],
    type: "tps",
    description: "Jl. Said Toyib, Bukit Sangkal, Kec. Kalidoni, Kota Palembang, Sumatera Selatan 30163"
  },
  {
    name: "TPS Pasar Gubah",
    position: [-2.9720, 104.7400],
    type: "tps",
    description: "Jl. S. M. Mansyur, 26 Ilir, Kec. Bukit Kecil, Kota Palembang, Sumatera Selatan 30128"
  },
  {
    name: "TPS Rajawali",
    position: [-2.9690, 104.7700],
    type: "tps",
    description: "Jl. Rajawali, 9 Ilir, Kec. Ilir Timur II, Kota Palembang, Sumatera Selatan 30114"
  },
  {
    name: "TPS Depo Transfer 3 Ilir",
    position: [-2.9685, 104.7750],
    type: "tps",
    description: "Jl. Mayor Memet Sastrawirya, 3 Ilir, Kec. Ilir Timur II, Kota Palembang, Sumatera Selatan 30116"
  },
  {
    name: "TPS Macan Lindungan",
    position: [-2.9850, 104.7100],
    type: "tps",
    description: "Jl. Macan Lindungan, Bukit Baru, Kec. Ilir Barat I, Kota Palembang, Sumatera Selatan 30139"
  },
  {
    name: "TPS Jakabaring (Dekat Pasar Induk)",
    position: [-3.0100, 104.7800],
    type: "tps",
    description: "Jl. Pangeran Ratu, 15 Ulu, Kec. Jakabaring, Kota Palembang, Sumatera Selatan 30267"
  },

  // ==========================================
  // KELOMPOK TPA (Tempat Pemrosesan Akhir)
  // ==========================================
  {
    name: "TPA Sukawinatan",
    position: [-2.9372, 104.7395],
    type: "tpa",
    description: "Jl. TPA Sukawinatan, Sukajaya, Kec. Sukarami, Kota Palembang, Sumatera Selatan 30961"
  },
  {
    name: "TPA Karyajaya",
    position: [-3.0415, 104.7082],
    type: "tpa",
    description: "Karya Jaya, Kec. Kertapati, Kota Palembang, Sumatera Selatan 30259"
  },
  {
    name: "TPA Gandus",
    position: [-3.0150, 104.7200],
    type: "tpa",
    description: "Gandus, Kec. Gandus, Kota Palembang, Sumatera Selatan"
  },

  // ==========================================
  // KELOMPOK FASILITAS KEBERSIHAN
  // ==========================================
  {
    name: "UPTD Kebersihan Kecamatan Ilir Timur I",
    position: [-2.9715, 104.7540],
    type: "fasilitas",
    description: "Jl. Bay Salim, 20 Ilir D. I, Kec. Ilir Timur I, Kota Palembang, Sumatera Selatan 30126"
  },

  // ==========================================
  // KELOMPOK TPST & FASILITAS PENGOLAHAN
  // ==========================================
  {
    name: "PSEL Kota Palembang",
    position: [-3.0310, 104.7125],
    type: "tpst",
    description: "Jl. Mayor Jend. Satibi Darwis, Keramasan, Kec. Kertapati, Kota Palembang, Sumatera Selatan 30259"
  },
  {
    name: "Rencana TPST Sukawinatan (Program LSDP Bank Dunia)",
    position: [-2.9350, 104.7380],
    type: "tpst",
    description: "Sukarami, Kota Palembang, Sumatera Selatan"
  },
  {
    name: "Instalasi TPS 3R Kalidoni",
    position: [-2.9612, 104.7925],
    type: "tpst",
    description: "Kalidoni, Kec. Kalidoni, Kota Palembang, Sumatera Selatan"
  },

  // ==========================================
  // KELOMPOK BANK SAMPAH
  // ==========================================
  {
    name: "Bank Sampah Indonesia Provinsi Sumatera Selatan",
    position: [-2.9510, 104.7180],
    type: "banksampah",
    description: "Jl. KM 12 Alang - Alang Lebar, Lorong Kenanga No.015, RT.01/RW.01, Sukodadi, Kec. Sukarami, Kota Palembang, Sumatera Selatan 30151"
  },
  {
    name: "Bank Sampah KGS (Kreatif & Daur Ulang)",
    position: [-2.9812, 104.7750],
    type: "banksampah",
    description: "Jl. Sersan Zaini No. 2819, RT. 27, 2 Ilir, Kec. Ilir Tim. II, Kota Palembang, Sumatera Selatan 30163"
  },
  {
    name: "Bank Sampah Induk Palembang",
    position: [-2.9620, 104.7520],
    type: "banksampah",
    description: "Jl. Kolonel H. Burlian, Sukarami, Kec. Sukarami, Kota Palembang, Sumatera Selatan"
  },
  {
    name: "Bank Sampah Hijau Lestari",
    position: [-2.9650, 104.7435],
    type: "banksampah",
    description: "Jl. Perikanan 4, Talang Aman, Kec. Kemuning, Kota Palembang, Sumatera Selatan"
  },
  {
    name: "Bank Sampah Pelangi (KSE UNSRI)",
    position: [-2.9450, 104.6980],
    type: "banksampah",
    description: "Lrg. Jambu Klutuk No.3, Sukodadi, Kec. Sukarami, Kota Palembang, Sumatera Selatan"
  },
  {
    name: "Bank Sampah Sejahtera 35 Ilir",
    position: [-2.9910, 104.7510],
    type: "banksampah",
    description: "35 Ilir, Kec. Ilir Bar. II, Kota Palembang, Sumatera Selatan"
  },
  {
    name: "Bank Sampah Bukit Baru",
    position: [-2.9850, 104.7150],
    type: "banksampah",
    description: "Jl. Tanjung Raeds, Bukit Baru, Kec. Ilir Bar. I, Kota Palembang, Sumatera Selatan"
  },
  {
    name: "Bank Sampah Sukarami Mandiri",
    position: [-2.9420, 104.7280],
    type: "banksampah",
    description: "Sukarami, Kec. Sukarami, Kota Palembang, Sumatera Selatan"
  }
];
