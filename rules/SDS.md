## 3. System Design Specification (SDS)

**Arsitektur Sistem (Monolith Modern)**
Aplikasi menggunakan arsitektur *monolithic* modular dengan Laravel sebagai backend API/data-layer dan React sebagai antarmuka pengguna melalui adapter Inertia.js.

* **Backend:** Laravel 13 (PHP 8.5+)
* **State & Routing Glue:** Inertia.js (menghilangkan kebutuhan routing API REST terpisah untuk dashboard)
* **Frontend:** React 18, TypeScript, Tailwind CSS, Shadcn UI, Leaflet.js / React-Leaflet (WebGIS)
* **Database:** PostgreSQL 16 (dengan ekstensi PostGIS untuk query spasial peta kecamatan) atau MySQL 8.0 dengan spatial type.
* **Cache & Queue:** Redis (kalkulasi agregat harga harian dan parsing ekspor laporan)

**Skema Basis Data Utama**

* **`markets`**: `id`, `name`, `district_id`, `latitude`, `longitude`, `created_at`
* **`commodities`**: `id`, `name`, `unit`, `het_price`, `is_strategic`
* **`price_logs`**: `id`, `market_id`, `commodity_id`, `price`, `recorded_date`, `recorder_id`, `status`
* **`food_balances`**: `id`, `commodity_id`, `month`, `year`, `production_volume`, `incoming_supply`, `outgoing_supply`, `consumption_need`, `balance_value`
* **`reserve_stocks`**: `id`, `warehouse_name`, `commodity_id`, `current_stock`, `min_threshold`, `last_inspection_date`
* **`skpg_assessments`**: `id`, `district_id`, `month`, `year`, `availability_score`, `access_score`, `utilization_score`, `final_status`
* **`fsva_indicators`**: `id`, `district_id`, `year`, `poverty_ratio`, `clean_water_access`, `stunting_rate`, `composite_score`, `priority_rank`
* **`districts_geom`**: `id`, `code`, `name`, `geojson_boundary` (MultiPolygon)

**Alur Implementasi Komponen React + Inertia**

```
Client (React Component)
  ├── Pages/
  │    ├── Price/Index.tsx          <-- Filter Pasar & Tanggal (Recharts untuk tren)
  │    ├── Balance/Calculator.tsx   <-- Interaksi input formula neraca pangan
  │    ├── Reserves/Inventory.tsx   <-- Kartu stok gudang & tabel log mutasi
  │    ├── SKPG/Matrix.tsx          <-- Matriks komposit bulanan indikator gizi
  │    └── FSVA/MapView.tsx         <-- React-Leaflet render layer polygon per kecamatan
  │
Inertia Request/Response Bridge
  │
Laravel Controllers
  ├── PriceController.php         --> Validasi form & simpan ke price_logs
  ├── BalanceController.php       --> Hitung netto ketersediaan vs konsumsi
  ├── SKPGController.php          --> Logic pembobotan indeks komposit SKPG
  └── FSVAController.php          --> Query spasial GeoJSON per batas kecamatan