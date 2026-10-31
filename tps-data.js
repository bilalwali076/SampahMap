
const tpsLocations = [
  {
    name: "TPS Talang Aman",
    position: [-2.9463, 104.7538],
    type: "tps",
    description: "Jl. Perikanan 4, Talang Aman, Kec. Kemuning"
  },
 ,
  {
    name: "TPS Sultan Syahrir",
    position: [-2.9735, 104.7781],
    type: "tps",
    description: "Jl. Sutan Syahrir No.1497, 5 Ilir, Kec. Ilir Timur II"
  },
  {
    name: "TPS Pasar Sako Mandiri",
    position: [-2.9360, 104.7925],
    type: "tps",
    description: "Kawasan Pasar Sako, Sako, Kec. Sako"
  },
  {
    name: "TPS Bukit Lama",
    position: [-2.9862, 104.7335],
    type: "tps",
    description: "Jl. Puncak Sekuning, Bukit Lama, Kec. Ilir Barat I"
  },
  {
    name: "TPS Lemabang (Pasar Lemabang)",
    position: [-2.9721, 104.7745],
    type: "tps",
    description: "Kawasan Pasar Lemabang, Kec. Ilir Timur II"
  },
  {
    name: "TPS Pasar KM 5",
    position: [-2.9515, 104.7388],
    type: "tps",
    description: "Jl. Kolonel Atmo / Pasar Cinde, Kec. Ilir Timur I"
  },
  {
    name: "TPS Jakabaring",
    position: [-3.0185, 104.7892],
    type: "tps",
    description: "Area Kompleks Jakabaring Sport City / Kec. Jakabaring"
  },
  {
    name: "TPS Pasar Plaju",
    position: [-2.9984, 104.8211],
    type: "tps",
    description: "Kawasan Pasar Plaju, Kec. Plaju"
  },
  {
    name: "TPA Sukawitan (Pengolahan Akhir)",
    position: [-2.9248, 104.7852],
    type: "tpa",
    description: "Tempat Pembuangan Akhir Sukawitan, Kec. Sukarami"
  },

  {
    name: "TPS Kota Baru",
    position: [-2.9328, 104.7210],
    type: "tps",
    description: "Lrg. Kota Baru, Srijaya, Kec. Alang-Alang Lebar, Kota Palembang"
  },
  {
    name: "TPS Pulau Layang",
    position: [-2.9984, 104.8115],
    type: "tps",
    description: "Jl. Kapten Robani Kadir No.15, Talang Putri, Kec. Plaju, Kota Palembang"
  },
  {
    name: "Tps Pancasila",
    position: [-3.0125, 104.7250],
    type: "tps",
    description: "Karang Anyar, Kec. Gandus, Kota Palembang, Sumatera Selatan"
  },
  {
    name: "TPS Panca Usaha",
    position: [-2.9936, 104.7681],
    type: "tps",
    description: "Jl. Panca Usaha, 5 Ulu, Kecamatan Seberang Ulu I, Kota Palembang"
  },
  {
    name: "Tempat Pembuangan Sampah Talang Aman",
    position: [-2.9645, 104.7432],
    type: "tps",
    description: "Jl. Perikanan 4, Talang Aman, Kec. Kemuning, Kota Palembang"
  },
  {
    name: "TPS Nurul Ma'unah",
    position: [-3.0245, 104.7562],
    type: "tps",
    description: "Kemas Rindo, Kec. Kertapati, Kota Palembang, Sumatera Selatan 30257"
  },
  {
    name: "TPS 3R Sako",
    position: [-2.9210, 104.7785],
    type: "tps",
    description: "Jl. Lebak Rejo, Sako, Kec. Sako, Kota Palembang"
  },
  {
    name: "TPS Lemabang",
    position: [-2.9680, 104.7765],
    type: "tps",
    description: "Jl. RE Martadinata, Lemabang, Kec. Ilir Tim. II, Kota Palembang"
  },
  {
    name: "TPS Demang Lebar Daun",
    position: [-2.9750, 104.7255],
    type: "tps",
    description: "Jl. Demang Lebar Daun, Lorok Pakjo, Kec. Ilir Bar. I, Kota Palembang"
  },
  {
    name: "TPS Soak Simbur",
    position: [-2.9550, 104.7120],
    type: "tps",
    description: "Sukajadi, Kec. Sukarami, Kota Palembang"
  },

  // --- KELOMPOK TPA (Tempat Pemrosesan Akhir) ---
  {
    name: "TPA Sukawinatan",
    position: [-2.9372, 104.7395],
    type: "tpa",
    description: "Jl. TPA Sukawinatan, Sukarami, Kec. Sukarami, Kota Palembang"
  },
  {
    name: "TPA Karya Jaya",
    position: [-3.0415, 104.7082],
    type: "tpa",
    description: "Karya Jaya, Kec. Kertapati, Kota Palembang, Sumatera Selatan 30259"
  },
  {
    name: "Tempat Pembuangan Akhir Puncak Sekuning",
    position: [-2.9780, 104.7352],
    type: "tpa",
    description: "Jl. Puncak Sekuning, Bukit Lama, Kec. Ilir Bar. I, Kota Palembang"
  },

  // --- KELOMPOK TPST & FASILITAS PENGOLAHAN ---
  {
    name: "PSEL Kota Palembang (Pembangkit Listrik Tenaga Sampah)",
    position: [-3.0310, 104.7125],
    type: "tpst",
    description: "Jl. Mayor Jend. Satibi Darwis, Keramasan, Kec. Kertapati, Kota Palembang"
  },
  {
    name: "Instalasi TPS 3R Kalidoni",
    position: [-2.9612, 104.7925],
    type: "tpst",
    description: "Kalidoni, Kec. Kalidoni, Kota Palembang, Sumatera Selatan 30163"
  },
  {
    name: "TPST Sematang Borang",
    position: [-2.9315, 104.8050],
    type: "tpst",
    description: "Sematang Borang, Kec. Sematang Borang, Kota Palembang"
  },
  {
    name: "TPST Plaju Darat",
    position: [-3.0040, 104.7890],
    type: "tpst",
    description: "Plaju Darat, Kec. Plaju, Kota Palembang"
  },
  {
    name: "UPTD Kebersihan Kec. Ilir Timur I",
    position: [-2.9715, 104.7540],
    type: "fasilitas",
    description: "Jl. Bay Salim, 20 Ilir D. I, Kec. Ilir Tim. I, Kota Palembang"
  },

  // --- KELOMPOK BANK SAMPAH ---
  {
    name: "Bank Sampah Indonesia Provinsi Sumatera Selatan",
    position: [-2.9510, 104.7180],
    type: "banksampah",
    description: "Jl. KM 12 Alang-Alang Lebar, Lorong Kenanga No.015, Sukodadi, Kec. Sukarami, Kota Palembang"
  },
  {
    name: "Bank Sampah Kartini",
    position: [-2.9782, 104.7355],
    type: "banksampah",
    description: "Jl. Puncak Sekuning, Bukit Lama, Kec. Ilir Bar. I, Kota Palembang"
  },
  {
    name: "Bank Sampah Hijau Lestari",
    position: [-2.9650, 104.7435],
    type: "banksampah",
    description: "Jl. Perikanan 4, Talang Aman, Kec. Kemuning, Kota Palembang"
  },
  {
    name: "Bank Sampah KGS",
    position: [-2.9812, 104.7750],
    type: "banksampah",
    description: "Jl. Sersan Zaini No.rt. 27, 2 Ilir, Kec. Ilir Tim. II, Kota Palembang"
  },
  {
    name: "Bank Sampah Pelangi (KSE UNSRI)",
    position: [-2.9450, 104.6980],
    type: "banksampah",
    description: "Lrg. Jambu Klutuk No.3, Sukodadi, Kec. Sukarami, Kota Palembang"
  },
  {
    name: "Bank Sampah Induk Palembang",
    position: [-2.9620, 104.7520],
    type: "banksampah",
    description: "Jl. Kolonel H. Burlian, Sukarami, Kota Palembang"
  },
  {
    name: "Bank Sampah Sejahtera 35 Ilir",
    position: [-2.9910, 104.7510],
    type: "banksampah",
    description: "35 Ilir, Kec. Ilir Bar. II, Kota Palembang"
  },
  {
    name: "Bank Sampah Bukit Baru",
    position: [-2.9850, 104.7150],
    type: "banksampah",
    description: "Jl. Tanjung Raeds, Bukit Baru, Kec. Ilir Bar. I, Kota Palembang"
  },
  {
    name: "Bank Sampah Sukarami Mandiri",
    position: [-2.9420, 104.7280],
    type: "banksampah",
    description: "Sukarami, Kec. Sukarami, Kota Palembang"
  }
];
