## 2. Product Requirements Document (PRD)

**Spesifikasi Fungsional Per Modul**

| Modul | Fitur Utama | Input / Output | Hak Akses |
| --- | --- | --- | --- |
| **Harga Pangan** | Pencatatan harian komoditas strategis (beras, cabai, bawang, daging, telur, minyak), grafik fluktuasi harian/mingguan, deteksi deviasi harga di atas HET/HAP. | **Input:** Form harga per pasar.<br>

<br>**Output:** Grafik tren, tabel disparitas harga, ekspor PDF/Excel. | Enumerator, Analis, Publik (view) |
| **Neraca Pangan** | Kalkulasi ketersediaan pangan neto (produksi lokal + pasokan masuk - pasokan keluar - susut/pakan/bibit) vs konsumsi bulanan/tahunan. | **Input:** Data panen, distribusi masuk/keluar.<br>

<br>**Output:** Neraca surplus/defisit per komoditas. | Analis, Eksekutif |
| **Cadangan Pangan** | Monitoring stok CPPD di gudang Bulog/daerah, penyaluran darurat bencana/stunting, monitoring lumbung pangan masyarakat (CPM). | **Input:** Transaksi mutasi masuk/keluar stok, berita acara.<br>

<br>**Output:** Kartu stok digital, laporan *lead-time* cadangan. | Petugas Gudang, Analis |
| **SKPG** | Evaluasi 3 aspek (Ketersediaan, Akses, Pemanfaatan gizi) bulanan tingkat kecamatan. Klasifikasi status: Aman, Waspada, Rentan. | **Input:** Luas puso, kasus gizi, rasio daya beli.<br>

<br>**Output:** Indeks komposit SKPG, matriks skor bulanan. | Enumerator, Analis |
| **FSVA** | Pemetaan tematik indikator komposit kerentanan pangan 31 kecamatan di Indramayu (kategori 1–6 / Sangat Rawan hingga Sangat Tahan). | **Input:** Indikator spasial/kemiskinan/air bersih/kesehatan.<br>

<br>**Output:** Peta interaktif WebGIS GeoJSON dengan gradasi warna. | Analis, Eksekutif, Publik |

**Non-Functional Requirements (NFR)**

* **Performa:** Waktu render awal SPA Inertia di bawah 1.5 detik; pemuatan GeoJSON peta kecamatan di bawah 2 detik.
* **Keamanan:** RBAC (*Role-Based Access Control*), enkripsi token sesi, sanitasi input untuk mencegah XSS/SQL Injection.
* **Auditability:** *Activity log* mencatat setiap perubahan data neraca pangan dan harga komoditas.
