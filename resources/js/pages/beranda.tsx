import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    BarChart3,
    CheckCircle2,
    ChevronRight,
    Compass,
    Download,
    FileSpreadsheet,
    Globe2,
    Layers,
    LayoutGrid,
    LineChart,
    MapPin,
    Package,
    PieChart,
    Scale,
    Search,
    ShieldCheck,
    Sparkles,
    Store,
    Target,
    TrendingUp,
    Users,
    Wheat,
    Zap,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import PortalFooter from '@/components/portal-footer';
import PortalNavbar from '@/components/portal-navbar';
import { Badge } from '@/components/ui/badge';

export interface IkpHistoryItem {
    tahun: number;
    nilai_ikp: number;
    target_renstra: number;
    status: string;
}

export interface IkpSummaryData {
    tahun: number;
    nilai_ikp: number;
    target_renstra: number;
    diff_renstra: number;
    capaian_percentage: number;
    is_achieved: boolean;
    status: string;
    indeks_ketersediaan: number | null;
    indeks_keterjangkauan: number | null;
    indeks_pemanfaatan: number | null;
    kelompok_ikp: string | null;
    keterangan: string | null;
    total_years?: number;
    history?: IkpHistoryItem[];
}

export interface CppdSummaryData {
    tahun: number;
    total_stok: number;
    total_penyaluran: number;
    stok_awal: number;
    total_pengadaan: number;
    total_addendum: number;
    desa_penerima_count?: number;
    kecamatan_penerima_count?: number;
    transaksi_penyaluran_count?: number;
}

export interface FoodBalanceCommodityPreview {
    id: number;
    name: string;
    unit: string;
    produksi: number;
    ketersediaan: number;
    kebutuhan: number;
    selisih: number;
    status: 'Surplus' | 'Defisit';
}

export interface FoodBalanceSummaryData {
    year: number;
    month: number;
    month_name: string;
    period_label: string;
    is_current_month: boolean;
    total_ketersediaan: number;
    total_kebutuhan: number;
    total_produksi: number;
    total_neraca: number;
    status: 'Surplus' | 'Defisit';
    surplus_count: number;
    defisit_count: number;
    commodities_count: number;
    top_commodities?: FoodBalanceCommodityPreview[];
}

export interface PphHistoryItem {
    tahun: number;
    skor_pph: number;
    target_renstra: number;
}

export interface PphSummaryData {
    tahun: number;
    skor_pph: number;
    target_renstra: number;
    diff_renstra: number;
    capaian_percentage: number;
    is_achieved: boolean;
    keterangan: string | null;
    total_food_groups?: number;
    total_years?: number;
    history?: PphHistoryItem[];
}

export interface FsvaSummaryData {
    tahun: number;
    total_desa: number;
    rentan_count: number;
    rentan_percentage: number;
    tahan_count: number;
    tahan_percentage: number;
    p1_count: number;
    p2_count: number;
    p3_count: number;
    p4_count: number;
    p5_count: number;
    p6_count: number;
}

export interface ConsumerAboveHetItem {
    id: number;
    name: string;
    unit: string;
    price: number;
    het_price: number;
    diff: number;
    diff_percentage: number;
    image_url: string | null;
}

export interface ConsumerFeaturedItem {
    id: number;
    name: string;
    unit: string;
    price: number;
    het_price: number | null;
    diff_percentage: number;
    is_above_het: boolean;
    image_url: string | null;
}

export interface ConsumerPricesSummaryData {
    market_name: string;
    active_markets_count?: number;
    effective_date: string;
    effective_date_formatted: string;
    is_today: boolean;
    total_monitored: number;
    above_het_count: number;
    normal_het_count: number;
    commodities: ConsumerAboveHetItem[];
    featured_commodities?: ConsumerFeaturedItem[];
}

export interface ProducerBelowHapItem {
    id: number;
    key: string;
    name: string;
    unit: string;
    price: number;
    hap_price: number;
    diff: number;
    diff_percentage: number;
    image_url: string | null;
}

export interface ProducerFeaturedItem {
    id: number;
    key: string;
    name: string;
    unit: string;
    price: number;
    hap_price: number;
    is_below_hap: boolean;
    image_url: string | null;
}

export interface ProducerPricesSummaryData {
    effective_date: string;
    effective_date_formatted: string;
    is_today: boolean;
    total_monitored: number;
    below_hap_count: number;
    normal_hap_count: number;
    commodities: ProducerBelowHapItem[];
    all_commodities?: ProducerFeaturedItem[];
}

export interface SkpgAlertKecamatan {
    id: number;
    kecamatan: string;
    kode_kecamatan: string;
    ikb: string;
    ik: string;
    ia: string;
    ip: string;
    keterangan: string | null;
}

export interface SkpgSummaryData {
    year: number;
    month: number;
    month_name: string;
    period_label: string;
    is_current_month: boolean;
    total_kecamatan: number;
    alert_count: number;
    waspada_count: number;
    rentan_count: number;
    aman_count: number;
    alert_kecamatan: SkpgAlertKecamatan[];
    last_alert_record: {
        year: number;
        month: number;
        month_name: string;
        count: number;
    } | null;
}

export interface BerandaProps {
    ikp: IkpSummaryData | null;
    cppd: CppdSummaryData;
    foodBalance: FoodBalanceSummaryData;
    pph: PphSummaryData | null;
    fsva: FsvaSummaryData;
    consumerPrices: ConsumerPricesSummaryData;
    producerPrices: ProducerPricesSummaryData;
    skpg: SkpgSummaryData;
}

type ModuleCategory =
    | 'all'
    | 'indeks-mutu'
    | 'ketersediaan-cadangan'
    | 'spasial-kewaspadaan'
    | 'stabilitas-harga';

function formatNumber(value: number, decimals = 2): string {
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    }).format(value);
}

export default function Beranda({
    ikp,
    cppd,
    foodBalance,
    pph,
    fsva,
    consumerPrices,
    producerPrices,
    skpg,
}: BerandaProps) {
    const [activeCategory, setActiveCategory] = useState<ModuleCategory>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Detailed persuasive sales-pitch catalog for all 8 modules
    const modulesCatalog = useMemo(
        () => [
            {
                id: 'ikp',
                number: '01',
                title: 'Indeks Ketahanan Pangan (IKP)',
                shortTitle: 'IKP',
                href: '/ikp',
                category: 'indeks-mutu' as ModuleCategory,
                categoryLabel: 'Indeks & Mutu Pangan',
                icon: ShieldCheck,
                tagline: 'Tolok Ukur Utama Kemandirian & Ketangguhan Pangan Daerah',
                hookBadge: ikp ? `Skor IKP ${ikp.nilai_ikp.toFixed(2)} (${ikp.status})` : 'Sangat Tahan',
                pitchIntro:
                    'Ingin mengetahui seberapa tangguh ketahanan pangan Kabupaten Indramayu dari tahun ke tahun? Modul IKP hadir sebagai barometer eksekutif yang membedah kinerja ketahanan pangan daerah secara menyeluruh dan membandingkannya langsung dengan Target Rencana Strategis (Renstra) pemerintah daerah.',
                pitchValue:
                    'Tidak sekadar menampilkan satu angka akhir, modul ini membuka transparansi penuh atas 3 pilar pembentuk ketahanan pangan nasional: Indeks Ketersediaan, Indeks Keterjangkauan, dan Indeks Pemanfaatan Pangan—lengkap dengan visualisasi tren multi-tahun yang mudah dipahami siapa saja.',
                sellingPoints: [
                    'Evaluasi otomatis capaian Skor IKP terhadap Target Renstra beserta persentase deviasinya.',
                    'Bedah mendalam 3 Pilar Komposit (Ketersediaan, Keterjangkauan Ekonomi, dan Pemanfaatan Gizi).',
                    '3 mode grafik interaktif (Composed Chart, Side-by-Side Bar, dan Line Trend) untuk analisis lintas tahun.',
                    'Fitur unduh laporan resmi dalam format PDF siap cetak dan tabel Excel dengan satu klik.',
                ],
                audience: 'Pengambil Kebijakan, Perencana Daerah (Bappeda), Akademisi & Publik',
                liveHighlightLabel: 'Capaian Terkini',
                liveHighlightValue: ikp
                    ? `Skor ${ikp.nilai_ikp.toFixed(2)} dari Target ${ikp.target_renstra.toFixed(2)} (${ikp.capaian_percentage.toFixed(1)}%)`
                    : 'Status Sangat Tahan Pangan',
                ctaText: 'Eksplorasi Modul IKP Sekarang',
                gradientBar: 'from-emerald-500 via-[#006565] to-teal-500',
                iconBg: 'bg-emerald-100 text-[#006565] dark:bg-emerald-950/60 dark:text-emerald-400',
                accentBox:
                    'border-emerald-500/20 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-teal-950/20',
                accentText: 'text-[#006565] dark:text-emerald-400',
                buttonClass:
                    'from-[#006565] to-emerald-700 hover:from-[#005252] hover:to-emerald-800 shadow-emerald-900/15',
            },
            {
                id: 'neraca-pangan',
                number: '02',
                title: 'Neraca Pangan Bulanan',
                shortTitle: 'Neraca Pangan',
                href: '/neraca-pangan',
                category: 'ketersediaan-cadangan' as ModuleCategory,
                categoryLabel: 'Ketersediaan & Cadangan',
                icon: Layers,
                tagline: 'Ketahui Surplus atau Defisit Pasokan Pangan Setiap Bulan Tanpa Tebak-tebakan',
                hookBadge: `Status ${foodBalance.status} (${foodBalance.period_label})`,
                pitchIntro:
                    'Apakah produksi dan stok pangan di Kabupaten Indramayu cukup untuk memenuhi kebutuhan seluruh penduduk bulan ini? Modul Neraca Pangan Bulanan memberikan jawaban pasti melalui perhitungan presisi antara produksi domestik, total ketersediaan pasokan, dan estimasi kebutuhan konsumsi masyarakat.',
                pitchValue:
                    'Dirancang dengan sistem tabulasi pintar 4-in-1 (Neraca Bulanan, Matriks Ketersediaan, Kebutuhan, dan Produksi Januari–Desember), Anda dapat membandingkan status neraca baik berdasarkan Ketersediaan vs Kebutuhan maupun Produksi vs Kebutuhan secara instan!',
                sellingPoints: [
                    'Fitur pembanding ganda: analisis Surplus/Defisit berbasis Ketersediaan vs Kebutuhan atau Produksi vs Kebutuhan.',
                    'Matriks rekapitulasi tahunan (Januari s.d. Desember) untuk memantau tren pasokan sepanjang tahun.',
                    'Pemantauan terperinci pada berbagai komoditas pangan strategis daerah setiap bulan.',
                    'Ekspor laporan PDF dan Excel yang otomatis menyesuaikan dengan tabulasi yang sedang Anda buka.',
                ],
                audience: 'Pelaku Distribusi Pangan, Bulog, Tim Pengendali Inflasi (TPID) & Peneliti',
                liveHighlightLabel: `Ringkasan ${foodBalance.period_label}`,
                liveHighlightValue: `${foodBalance.surplus_count} Komoditas Surplus • Selisih ${foodBalance.total_neraca >= 0 ? '+' : ''}${formatNumber(foodBalance.total_neraca, 1)} Ton`,
                ctaText: 'Cek Surplus & Neraca Pangan',
                gradientBar: 'from-teal-500 via-emerald-600 to-cyan-500',
                iconBg: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400',
                accentBox:
                    'border-teal-500/20 bg-gradient-to-br from-teal-50/90 via-white to-emerald-50/50 dark:from-teal-950/30 dark:via-slate-900 dark:to-emerald-950/20',
                accentText: 'text-teal-700 dark:text-teal-400',
                buttonClass:
                    'from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 shadow-teal-900/15',
            },
            {
                id: 'cppd',
                number: '03',
                title: 'Cadangan Pangan Pemerintah Daerah (CPPD)',
                shortTitle: 'CPPD',
                href: '/cppd',
                category: 'ketersediaan-cadangan' as ModuleCategory,
                categoryLabel: 'Ketersediaan & Cadangan',
                icon: Package,
                tagline: 'Transparansi Penuh Stok Lumbung Beras Pemda & Penyaluran Bantuan ke Desa',
                hookBadge: `Stok ${formatNumber(cppd.total_stok / 1000, 1)} Ton (${cppd.tahun})`,
                pitchIntro:
                    'Sebagai benteng pertahanan saat terjadi kerawanan pangan, bencana alam, maupun gejolak harga, Cadangan Pangan Pemerintah Daerah (CPPD) harus dikelola secara transparan. Modul CPPD menyajikan pembukuan stok beras pemerintah daerah secara terbuka mulai dari stok awal, pengadaan baru, addendum, hingga sisa stok akhir.',
                pitchValue:
                    'Dilengkapi dengan Peta Interaktif Leaflet JS (dengan opsi citra Satelit, Peta Jalan, dan OSM) serta matriks penyaluran bulanan berfilter Triwulan dan Semester, masyarakat dapat melihat langsung desa mana saja yang telah menerima penyaluran bantuan pangan.',
                sellingPoints: [
                    'Peta sebaran penerima bantuan CPPD berbasis Leaflet JS lengkap dengan mode tampilan Citra Satelit.',
                    'Tabulasi Riwayat Transaksi (History) dan Matriks Penyaluran Bulanan per Desa (Januari–Desember).',
                    'Filter pintar rekapitulasi Triwulan (total tiap 3 bulan) dan Semester (total tiap 6 bulan).',
                    'Unduh data PDF & Excel yang otomatis mengikuti tampilan filter Triwulan/Semester yang aktif.',
                ],
                audience: 'Pemerintah Desa/Kecamatan, Aparat Pengawasan, Lembaga Sosial & Masyarakat Umum',
                liveHighlightLabel: `Realisasi Tahun ${cppd.tahun}`,
                liveHighlightValue: `Stok Tersedia ${formatNumber(cppd.total_stok, 0)} Kg • Tersalurkan ke ${cppd.desa_penerima_count ?? 0} Desa`,
                ctaText: 'Pantau Peta & Stok CPPD',
                gradientBar: 'from-blue-600 via-cyan-600 to-teal-500',
                iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
                accentBox:
                    'border-blue-500/20 bg-gradient-to-br from-blue-50/90 via-white to-cyan-50/50 dark:from-blue-950/30 dark:via-slate-900 dark:to-cyan-950/20',
                accentText: 'text-blue-700 dark:text-blue-400',
                buttonClass:
                    'from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 shadow-blue-900/15',
            },
            {
                id: 'fsva',
                number: '04',
                title: 'Peta Ketahanan & Kerentanan Pangan (FSVA)',
                shortTitle: 'FSVA',
                href: '/fsva',
                category: 'spasial-kewaspadaan' as ModuleCategory,
                categoryLabel: 'Spasial & Kewaspadaan',
                icon: Compass,
                tagline: 'Atlas Spasial Cerdas 317 Desa: Temukan Wilayah Prioritas Intervensi Secara Presisi',
                hookBadge: `${fsva.tahan_percentage.toFixed(1)}% Desa Tahan Pangan`,
                pitchIntro:
                    'Bagaimana cara memastikan program pembangunan dan bantuan pangan tepat sasaran hingga ke tingkat desa? Modul Food Security and Vulnerability Atlas (FSVA) memetakan seluruh 317 desa/kelurahan di Kabupaten Indramayu ke dalam 6 tingkat prioritas ketahanan dan kerentanan pangan.',
                pitchValue:
                    'Melalui peta tematik interaktif dan belasan indikator pembentuk (seperti rasio konsumsi normatif/NCPR, kemiskinan, akses air bersih, prevalensi stunting, hingga angka kecukupan energi & protein), Anda dapat menelusuri profil kerentanan setiap desa secara mikro.',
                sellingPoints: [
                    'Peta geospasial interaktif 317 desa dengan pewarnaan otomatis Prioritas 1 (Sangat Rentan) hingga Prioritas 6 (Sangat Tahan).',
                    'Filter analisis per indikator pembentuk (Komposit, NCPR, Kemiskinan, Stunting, Tanpa Air Bersih, dll.) dan per Kecamatan.',
                    'Visualisasi grafik distribusi prioritas serta proporsi Desa Tahan Pangan vs Desa Rentan Pangan.',
                    'Tabel peringkat desa lengkap dengan fitur pencarian cepat dan ekspor data lengkap ke Excel & PDF.',
                ],
                audience: 'Kepala Daerah, Dinas Terkait (Kesehatan, Sosial, PU), Camat, Kuwu/Kepala Desa & Peneliti',
                liveHighlightLabel: `Pemetaan ${fsva.total_desa} Desa (${fsva.tahun})`,
                liveHighlightValue: `${fsva.tahan_count} Desa Tahan (Prioritas 4–6) • ${fsva.rentan_count} Desa Rentan (Prioritas 1–3)`,
                ctaText: 'Buka Peta Spasial 317 Desa',
                gradientBar: 'from-amber-500 via-orange-500 to-emerald-600',
                iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
                accentBox:
                    'border-amber-500/20 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 dark:from-amber-950/30 dark:via-slate-900 dark:to-orange-950/20',
                accentText: 'text-amber-700 dark:text-amber-400',
                buttonClass:
                    'from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-900/15',
            },
            {
                id: 'skpg',
                number: '05',
                title: 'Sistem Kewaspadaan Pangan & Gizi (SKPG)',
                shortTitle: 'SKPG',
                href: '/skpg',
                category: 'spasial-kewaspadaan' as ModuleCategory,
                categoryLabel: 'Spasial & Kewaspadaan',
                icon: MapPin,
                tagline: 'Radar Peringatan Dini Bulanan di 31 Kecamatan Sebelum Rawan Pangan Terjadi',
                hookBadge:
                    skpg.alert_count > 0
                        ? `${skpg.alert_count} Kec Waspada/Rentan`
                        : `31 Kecamatan Aman`,
                pitchIntro:
                    'Mencegah krisis pangan jauh lebih efektif daripada mengobatinya. Modul SKPG bekerja sebagai sistem radar peringatan dini (early warning system) bulanan yang memantau situasi pangan dan gizi di seluruh 31 kecamatan Kabupaten Indramayu secara berkala.',
                pitchValue:
                    'Dengan memadukan Indeks Ketersediaan (IK), Indeks Akses (IA), Indeks Pemanfaatan (IP), serta indikator iklim (potensi kekeringan dan kebasahan/banjir), modul ini langsung memberi sinyal status Aman, Waspada, atau Rentan pada setiap kecamatan.',
                sellingPoints: [
                    'Peta komposit bulanan 31 kecamatan dengan indikator warna status Aman, Waspada, Siaga, dan Rentan.',
                    'Pemantauan terintegrasi 7 indikator: Komposit (IKB), Ketersediaan, Akses, Pemanfaatan, Potensi Kering, Potensi Basah, dan Kondisi Iklim.',
                    'Navigasi histori bulanan dan tahunan untuk melacak perubahan situasi pangan antar-musim tanam.',
                    'Matriks tabel status seluruh kecamatan yang rapi dan mendukung pencetakan laporan eksekutif.',
                ],
                audience: 'Tim Kewaspadaan Pangan, BPBD, Penyuluh Pertanian Kecamatan & Pemerintah Daerah',
                liveHighlightLabel: `Status Periode ${skpg.period_label}`,
                liveHighlightValue: `${skpg.aman_count} Kecamatan Aman • ${skpg.waspada_count} Waspada • ${skpg.rentan_count} Rentan`,
                ctaText: 'Lihat Radar SKPG 31 Kecamatan',
                gradientBar: 'from-cyan-500 via-teal-600 to-emerald-600',
                iconBg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400',
                accentBox:
                    'border-cyan-500/20 bg-gradient-to-br from-cyan-50/90 via-white to-teal-50/50 dark:from-cyan-950/30 dark:via-slate-900 dark:to-teal-950/20',
                accentText: 'text-cyan-700 dark:text-cyan-400',
                buttonClass:
                    'from-cyan-600 to-teal-700 hover:from-cyan-700 hover:to-teal-800 shadow-cyan-900/15',
            },
            {
                id: 'pph',
                number: '06',
                title: 'Pola Pangan Harapan (PPH Ketersediaan)',
                shortTitle: 'PPH Ketersediaan',
                href: '/pph',
                category: 'indeks-mutu' as ModuleCategory,
                categoryLabel: 'Indeks & Mutu Pangan',
                icon: PieChart,
                tagline: 'Ukur Mutu Keanekaragaman & Keseimbangan Gizi Ketersediaan Pangan Daerah',
                hookBadge: pph
                    ? `Skor PPH ${pph.skor_pph.toFixed(2)} (${pph.tahun})`
                    : '9 Kelompok Pangan',
                pitchIntro:
                    'Ketersediaan pangan yang melimpah saja belum cukup—apakah komposisi pangan yang tersedia sudah beragam dan bergizi seimbang? Modul Pola Pangan Harapan (PPH Ketersediaan) menjawab pertanyaan tersebut dengan menilai mutu keberagaman ketersediaan energi (kkal/kapita/hari) di Kabupaten Indramayu.',
                pitchValue:
                    'Modul ini menguraikan kontribusi 9 kelompok bahan pangan strategis (mulai dari Padi-padian, Umbi-umbian, Pangan Hewani, Minyak & Lemak, hingga Sayur dan Buah) terhadap skor ideal 100 dan membandingkannya dengan Target Renstra daerah.',
                sellingPoints: [
                    'Rincian kontribusi energi (kkal), bobot, skor aktual, skor AKE, dan skor PPH dari 9 kelompok bahan pangan.',
                    'Perbandingan visual Skor Aktual vs Skor Maksimal Ideal untuk melihat kelompok pangan yang perlu ditingkatkan.',
                    'Grafik perkembangan Skor PPH Ketersediaan lintas tahun bersanding dengan Target Renstra.',
                    'Filter Tahun Analisis yang fleksibel beserta unduhan laporan rincian kelompok pangan.',
                ],
                audience: 'Ahli Gizi, Bidang Ketersediaan & Konsumsi Pangan, Akademisi & Pemerhati Kesehatan',
                liveHighlightLabel: `Evaluasi PPH Tahun ${pph?.tahun ?? new Date().getFullYear()}`,
                liveHighlightValue: pph
                    ? `Skor PPH Ketersediaan ${pph.skor_pph.toFixed(2)} dari Target Renstra ${pph.target_renstra.toFixed(2)}`
                    : 'Analisis 9 Kelompok Bahan Pangan',
                ctaText: 'Analisis Skor Gizi PPH',
                gradientBar: 'from-purple-600 via-indigo-600 to-cyan-500',
                iconBg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400',
                accentBox:
                    'border-purple-500/20 bg-gradient-to-br from-purple-50/90 via-white to-indigo-50/40 dark:from-purple-950/30 dark:via-slate-900 dark:to-indigo-950/20',
                accentText: 'text-purple-700 dark:text-purple-400',
                buttonClass:
                    'from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 shadow-purple-900/15',
            },
            {
                id: 'harga-konsumen',
                number: '07',
                title: 'Harga Pangan Tingkat Konsumen',
                shortTitle: 'Harga Konsumen',
                href: '/harga-konsumen',
                category: 'stabilitas-harga' as ModuleCategory,
                categoryLabel: 'Stabilitas Harga Pasar',
                icon: Store,
                tagline: 'Panduan Belanja Cerdas & Pemantauan Harian 25 Komoditas Pasar terhadap HET',
                hookBadge: `${consumerPrices.total_monitored} Komoditas Pasar Daerah`,
                pitchIntro:
                    'Ingin tahu harga beras, cabai, bawang, daging, telur, atau minyak goreng di pasar daerah hari ini sebelum berbelanja? Modul Harga Pangan Tingkat Konsumen menyajikan update harga eceran harian dari pasar-pasar aktif di Kabupaten Indramayu secara transparan.',
                pitchValue:
                    'Setiap harga komoditas langsung disandingkan dengan harga hari sebelumnya (naik/turun/stabil) serta batas Harga Eceran Tertinggi (HET) pemerintah, dilengkapi grafik tren perkembangan harga dan ukuran volatilitas statistik (Standar Deviasi & Koefisien Variasi/CV%).',
                sellingPoints: [
                    'Katalog visual 25 komoditas pangan strategis dengan indikator kenaikan/penurunan harga harian dan status HET.',
                    'Grafik Perkembangan Harga Pangan interaktif dengan 3 mode waktu: Harian (maks 31 hari), Mingguan, dan Bulanan.',
                    'Tabel Historis Harian & Rata-rata Bulanan lengkap dengan perhitungan Standar Deviasi (STDEV) dan CV (%).',
                    'Filter pilihan Pasar Daerah dan Tanggal Data serta fitur unduh laporan Excel & PDF resmi.',
                ],
                audience: 'Ibu Rumah Tangga, Konsumen, Pedagang Pasar, TPID & Pelaku Usaha Kuliner',
                liveHighlightLabel: `Update ${consumerPrices.effective_date_formatted}`,
                liveHighlightValue: `${consumerPrices.normal_het_count} Komoditas Sesuai HET • ${consumerPrices.above_het_count} Komoditas Di Atas HET`,
                ctaText: 'Cek Harga Pasar Konsumen Hari Ini',
                gradientBar: 'from-[#006565] via-emerald-500 to-rose-500',
                iconBg: 'bg-emerald-100 text-[#006565] dark:bg-emerald-950/60 dark:text-emerald-400',
                accentBox:
                    'border-emerald-500/20 bg-gradient-to-br from-emerald-50/90 via-white to-rose-50/30 dark:from-emerald-950/30 dark:via-slate-900 dark:to-rose-950/20',
                accentText: 'text-[#006565] dark:text-emerald-400',
                buttonClass:
                    'from-[#006565] to-emerald-700 hover:from-[#005252] hover:to-emerald-800 shadow-emerald-900/15',
            },
            {
                id: 'harga-produsen',
                number: '08',
                title: 'Harga Pangan Tingkat Produsen',
                shortTitle: 'Harga Produsen',
                href: '/harga-produsen',
                category: 'stabilitas-harga' as ModuleCategory,
                categoryLabel: 'Stabilitas Harga Pasar',
                icon: Wheat,
                tagline: 'Kawal Kesejahteraan Petani & Penggilingan Melalui Pemantauan Harga Acuan (HAP)',
                hookBadge: `Pantauan Harga Petani & HAP`,
                pitchIntro:
                    'Sebagai daerah Lumbung Padi Nasional, menjaga agar harga jual gabah dan hasil panen petani tidak jatuh di bawah standar sangatlah krusial. Modul Harga Pangan Tingkat Produsen hadir khusus untuk memantau perkembangan harga jual di tingkat petani, peternak, dan penggilingan di Kabupaten Indramayu.',
                pitchValue:
                    'Modul ini membandingkan harga aktual tingkat produsen secara langsung dengan Harga Acuan Pembelian (HAP) yang ditetapkan Badan Pangan Nasional (Bapanas), sehingga potensi anjloknya harga saat panen raya dapat terdeteksi lebih cepat.',
                sellingPoints: [
                    'Pemantauan harga komoditas strategis tingkat petani/produsen (GKP Petani, GKP Penggilingan, GKG, Beras, Jagung, dll.).',
                    'Indikator otomatis status harga terhadap HAP Bapanas (Di Atas HAP, Sesuai HAP, atau Di Bawah HAP).',
                    'Grafik tren pergerakan harga produsen harian, mingguan, dan bulanan bersanding garis batas HAP.',
                    'Tabel matriks historis harga produsen yang dapat diekspor ke Excel dan PDF untuk bahan evaluasi kebijakan.',
                ],
                audience: 'Petani, Kelompok Tani (Gapoktan), Usaha Penggilingan Padi, Bulog & Dinas Pertanian',
                liveHighlightLabel: `Update ${producerPrices.effective_date_formatted}`,
                liveHighlightValue: `${producerPrices.normal_hap_count} Komoditas Sesuai/Di Atas HAP • ${producerPrices.below_hap_count} Di Bawah HAP`,
                ctaText: 'Pantau Harga Gabah & Produsen',
                gradientBar: 'from-amber-500 via-yellow-500 to-emerald-600',
                iconBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400',
                accentBox:
                    'border-amber-500/20 bg-gradient-to-br from-amber-50/90 via-white to-yellow-50/40 dark:from-amber-950/30 dark:via-slate-900 dark:to-yellow-950/20',
                accentText: 'text-amber-700 dark:text-amber-400',
                buttonClass:
                    'from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800 shadow-amber-900/15',
            },
        ],
        [ikp, foodBalance, cppd, fsva, skpg, pph, consumerPrices, producerPrices],
    );

    const filteredModules = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return modulesCatalog.filter((m) => {
            const matchCategory = activeCategory === 'all' || m.category === activeCategory;
            const matchQuery =
                !q ||
                m.title.toLowerCase().includes(q) ||
                m.shortTitle.toLowerCase().includes(q) ||
                m.tagline.toLowerCase().includes(q) ||
                m.pitchIntro.toLowerCase().includes(q) ||
                m.pitchValue.toLowerCase().includes(q) ||
                m.categoryLabel.toLowerCase().includes(q) ||
                m.sellingPoints.some((sp) => sp.toLowerCase().includes(q));
            return matchCategory && matchQuery;
        });
    }, [modulesCatalog, activeCategory, searchQuery]);

    const scrollToModules = () => {
        const el = document.getElementById('katalog-modul');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
            <Head>
                <title>Beranda Satu Data Pangan - DKPP Kabupaten Indramayu</title>
                <meta
                    name="description"
                    content="Portal Satu Data Ketahanan Pangan Dinas Ketahanan Pangan dan Pertanian (DKPP) Kabupaten Indramayu: Katalog & Penjelasan Lengkap Modul IKP, Neraca Pangan, CPPD, FSVA, SKPG, Skor PPH Ketersediaan, Harga Konsumen, dan Harga Produsen."
                />
            </Head>

            {/* Navigation Bar */}
            <PortalNavbar activePage="beranda" />

            {/* ===================================================================== */}
            {/* HERO LANDING BANNER (TETAP DIPERTAHANKAN SESUAI PERMINTAAN) */}
            {/* ===================================================================== */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#003838] via-[#005454] to-[#002424] text-white">
                {/* Ambient Geometric Glow & Grid Pattern */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
                    <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-teal-300/15 blur-3xl" />
                    <div className="absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 pt-10 pb-14 sm:px-6 sm:pt-14 sm:pb-16 lg:px-8">
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
                        {/* Left Column: Hero Headline & Quick Actions */}
                        <div className="space-y-6 lg:col-span-7">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3.5 py-1 text-xs font-black tracking-wider text-emerald-200 uppercase backdrop-blur-md">
                                    <Wheat className="h-3.5 w-3.5 text-amber-300" />
                                    <span>Lumbung Padi Nasional</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-bold text-white/95 backdrop-blur-md">
                                    <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                                    <span>Portal Satu Data Pangan • 8 Modul Terintegrasi</span>
                                </span>
                            </div>

                            <div className="space-y-3">
                                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-[2.65rem] lg:leading-[1.15]">
                                    Pusat Informasi &amp; Pemantauan{' '}
                                    <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
                                        Ketahanan Pangan Terpadu
                                    </span>{' '}
                                    Kabupaten Indramayu
                                </h1>
                                <p className="max-w-2xl text-sm leading-relaxed text-emerald-100/90 sm:text-base">
                                    Sajian rangkuman eksekutif secara langsung (<em>real-time</em>) dari{' '}
                                    <strong className="font-bold text-white">
                                        8 Modul Utama Bidang Ketersediaan dan Distribusi Pangan
                                    </strong>{' '}
                                    Dinas Ketahanan Pangan dan Pertanian (DKPP) Kabupaten Indramayu untuk transparansi publik dan pengambilan kebijakan berbasis data.
                                </p>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={scrollToModules}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 px-5 py-3 text-xs font-black text-slate-950 shadow-lg shadow-emerald-950/30 transition-all hover:scale-[1.02] hover:from-emerald-300 hover:to-teal-300 active:scale-[0.98] sm:text-sm cursor-pointer"
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                    <span>Jelajahi Rangkuman 8 Modul</span>
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                                <Link
                                    href="/harga-konsumen"
                                    className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-4.5 py-3 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 sm:text-sm"
                                >
                                    <Store className="h-4 w-4 text-emerald-300" />
                                    <span>Harga Pasar Hari Ini</span>
                                </Link>
                                <Link
                                    href="/fsva"
                                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-xs font-bold text-emerald-100 backdrop-blur-md transition-all hover:bg-white/15 sm:text-sm"
                                >
                                    <Compass className="h-4 w-4 text-amber-300" />
                                    <span>Peta Spasial 317 Desa</span>
                                </Link>
                            </div>

                            {/* Quick Module Pills Strip */}
                            <div className="pt-2">
                                <div className="mb-2 text-[11px] font-bold tracking-wider text-emerald-200/80 uppercase">
                                    Akses Cepat Modul Publik:
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {modulesCatalog.map((mod) => {
                                        const Icon = mod.icon;
                                        return (
                                            <Link
                                                key={mod.id}
                                                href={mod.href}
                                                className="group inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90 backdrop-blur-md transition-all hover:border-emerald-300/50 hover:bg-white/20 hover:text-white"
                                            >
                                                <Icon className="h-3.5 w-3.5 text-emerald-300 transition-transform group-hover:scale-110" />
                                                <span>{mod.shortTitle}</span>
                                                <ChevronRight className="h-3 w-3 text-white/50 group-hover:translate-x-0.5 group-hover:text-white" />
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: 4 Flagship Executive KPI Highlights */}
                        <div className="lg:col-span-5">
                            <div className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
                                <div className="mb-3.5 flex items-center justify-between border-b border-white/10 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                                        </span>
                                        <span className="text-xs font-black tracking-wider text-emerald-200 uppercase">
                                            Indikator Makro Ketahanan Pangan
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold text-white">
                                        Kab. Indramayu
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Highlight 1: IKP */}
                                    <Link
                                        href="/ikp"
                                        className="group rounded-2xl border border-white/15 bg-white/10 p-3.5 transition-all hover:border-emerald-300/40 hover:bg-white/15"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300">
                                                <ShieldCheck className="h-4 w-4" />
                                            </span>
                                            <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-200">
                                                {ikp?.status ?? 'Sangat Tahan'}
                                            </span>
                                        </div>
                                        <div className="mt-2.5 text-2xl font-black tracking-tight text-white">
                                            {ikp ? ikp.nilai_ikp.toFixed(2) : '-'}
                                        </div>
                                        <div className="mt-0.5 flex items-center justify-between text-[11px] text-emerald-100/80">
                                            <span>Skor IKP ({ikp?.tahun ?? new Date().getFullYear()})</span>
                                            <ArrowRight className="h-3 w-3 opacity-60 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                                        </div>
                                    </Link>

                                    {/* Highlight 2: Skor PPH Ketersediaan */}
                                    <Link
                                        href="/pph"
                                        className="group rounded-2xl border border-white/15 bg-white/10 p-3.5 transition-all hover:border-emerald-300/40 hover:bg-white/15"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/20 text-cyan-200">
                                                <PieChart className="h-4 w-4" />
                                            </span>
                                            <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-extrabold text-cyan-200">
                                                Target {pph ? pph.target_renstra.toFixed(1) : '94.0'}
                                            </span>
                                        </div>
                                        <div className="mt-2.5 text-2xl font-black tracking-tight text-white">
                                            {pph ? pph.skor_pph.toFixed(2) : '-'}
                                        </div>
                                        <div className="mt-0.5 flex items-center justify-between text-[11px] text-emerald-100/80">
                                            <span>PPH Ketersediaan</span>
                                            <ArrowRight className="h-3 w-3 opacity-60 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                                        </div>
                                    </Link>

                                    {/* Highlight 3: Neraca Pangan */}
                                    <Link
                                        href="/neraca-pangan"
                                        className="group rounded-2xl border border-white/15 bg-white/10 p-3.5 transition-all hover:border-emerald-300/40 hover:bg-white/15"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-400/20 text-teal-200">
                                                <Scale className="h-4 w-4" />
                                            </span>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                                                    foodBalance.status === 'Surplus'
                                                        ? 'bg-emerald-400/25 text-emerald-200'
                                                        : 'bg-rose-400/25 text-rose-200'
                                                }`}
                                            >
                                                {foodBalance.status}
                                            </span>
                                        </div>
                                        <div className="mt-2.5 text-xl font-black tracking-tight text-white">
                                            {foodBalance.total_neraca >= 0 ? '+' : ''}
                                            {formatNumber(foodBalance.total_neraca, 0)}{' '}
                                            <span className="text-xs font-normal text-emerald-200">Ton</span>
                                        </div>
                                        <div className="mt-0.5 flex items-center justify-between text-[11px] text-emerald-100/80">
                                            <span>Neraca {foodBalance.month_name}</span>
                                            <ArrowRight className="h-3 w-3 opacity-60 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                                        </div>
                                    </Link>

                                    {/* Highlight 4: Cadangan Pangan CPPD */}
                                    <Link
                                        href="/cppd"
                                        className="group rounded-2xl border border-white/15 bg-white/10 p-3.5 transition-all hover:border-emerald-300/40 hover:bg-white/15"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/20 text-amber-200">
                                                <Package className="h-4 w-4" />
                                            </span>
                                            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-200">
                                                Tahun {cppd.tahun}
                                            </span>
                                        </div>
                                        <div className="mt-2.5 text-xl font-black tracking-tight text-white">
                                            {formatNumber(cppd.total_stok / 1000, 1)}{' '}
                                            <span className="text-xs font-normal text-emerald-200">Ton</span>
                                        </div>
                                        <div className="mt-0.5 flex items-center justify-between text-[11px] text-emerald-100/80">
                                            <span>Stok Beras CPPD</span>
                                            <ArrowRight className="h-3 w-3 opacity-60 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                                        </div>
                                    </Link>
                                </div>

                                {/* Territory Coverage Footer Bar */}
                                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-black/20 px-3.5 py-2.5 text-[11px] text-emerald-100/90">
                                    <div className="flex items-center gap-2">
                                        <Globe2 className="h-3.5 w-3.5 text-emerald-300" />
                                        <span>
                                            Cakupan: <strong className="text-white">31 Kecamatan</strong> •{' '}
                                            <strong className="text-white">
                                                {fsva.total_desa || 317} Desa/Kelurahan
                                            </strong>
                                        </span>
                                    </div>
                                    <span className="font-bold text-amber-300">
                                        {consumerPrices.total_monitored} Komoditas Pasar
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================================================================== */}
            {/* KEUNGGULAN UTAMA PORTAL (VALUE PROPOSITION STRIP) */}
            {/* ===================================================================== */}
            <section className="border-b border-slate-200/80 bg-white py-8 dark:border-slate-800 dark:bg-slate-900/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-[#006565] dark:bg-emerald-950/60 dark:text-emerald-400">
                                <Zap className="h-5 w-5" />
                            </span>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                    100% Transparan &amp; Akurat
                                </h3>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                    Data bersumber langsung dari enumerator pasar, verifikator kecamatan, dan tim analis DKPP Indramayu.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
                                <Globe2 className="h-5 w-5" />
                            </span>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                    Peta Satelit &amp; Spasial Desa
                                </h3>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                    Visualisasi pemetaan interaktif berbasis Leaflet JS hingga tingkat 31 kecamatan dan 317 desa/kelurahan.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                                <LineChart className="h-5 w-5" />
                            </span>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                    Analitik &amp; Statistik Lengkap
                                </h3>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                    Dilengkapi perhitungan otomatis Standar Deviasi (STDEV), CV (%), status HET/HAP, hingga rekap Triwulan &amp; Semester.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                                <FileSpreadsheet className="h-5 w-5" />
                            </span>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                    Siap Unduh PDF &amp; Excel Resmi
                                </h3>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                    Seluruh modul mendukung ekspor dokumen laporan PDF ber-kop resmi dan file Excel untuk kebutuhan analisis Anda.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================================================================== */}
            {/* MAIN SHOWCASE: PENAWARAN & PENJELASAN 8 MODUL LAYAKNYA KATALOG PRODUK */}
            {/* ===================================================================== */}
            <main
                id="katalog-modul"
                className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-8"
            >
                {/* Section Header + Filter & Search */}
                <div className="flex flex-col gap-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div className="space-y-1.5 max-w-3xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black tracking-wider text-[#006565] uppercase dark:text-emerald-400">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Katalog Solusi &amp; Layanan Data Pangan</span>
                            </div>
                            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                                Temukan Modul Data Pangan yang Anda Butuhkan
                            </h2>
                            <p className="text-xs leading-relaxed text-slate-500 sm:text-sm dark:text-slate-400">
                                Setiap modul dirancang khusus dengan fitur analitik, peta interaktif, dan laporan siap pakai untuk menjawab kebutuhan masyarakat, petani, pelaku usaha, hingga pengambil kebijakan di Kabupaten Indramayu.
                            </p>
                        </div>

                        {/* Search input */}
                        <div className="relative w-full lg:w-80">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari fitur atau modul (misal: peta, HET, surplus...)"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#006565] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                        </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        {[
                            { id: 'all', label: 'Semua Modul Unggulan (8)' },
                            { id: 'indeks-mutu', label: 'Indeks & Mutu Gizi (IKP & PPH)' },
                            {
                                id: 'ketersediaan-cadangan',
                                label: 'Ketersediaan & Cadangan (Neraca & CPPD)',
                            },
                            {
                                id: 'spasial-kewaspadaan',
                                label: 'Peta Spasial & Peringatan Dini (FSVA & SKPG)',
                            },
                            {
                                id: 'stabilitas-harga',
                                label: 'Pemantauan Harga Pasar (Konsumen & Produsen)',
                            },
                        ].map((tab) => {
                            const active = activeCategory === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveCategory(tab.id as ModuleCategory)}
                                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                                        active
                                            ? 'bg-gradient-to-r from-[#006565] to-emerald-700 text-white shadow-sm'
                                            : 'border border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-[#006565] dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-300'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ===================================================================== */}
                {/* 8 MODULE PRODUCT PITCH SHOWCASE CARDS */}
                {/* ===================================================================== */}
                <div className="space-y-8">
                    {filteredModules.map((mod, index) => {
                        const Icon = mod.icon;
                        const isEven = index % 2 === 1;

                        return (
                            <article
                                key={mod.id}
                                className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:border-[#006565]/40 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
                            >
                                {/* Top Gradient Accent Bar */}
                                <div className={`h-2 w-full bg-gradient-to-r ${mod.gradientBar}`} />

                                <div
                                    className={`grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-12 lg:items-center ${
                                        isEven ? 'lg:flex-row-reverse' : ''
                                    }`}
                                >
                                    {/* Left/Main Pitch Column (7 cols): Story, Description & Persuasive Pitch */}
                                    <div className="space-y-5 lg:col-span-7">
                                        {/* Module Number, Category & Live Hook Badge */}
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <span
                                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-xs ${mod.iconBg}`}
                                                >
                                                    <Icon className="h-6 w-6" />
                                                </span>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`text-[11px] font-black uppercase tracking-wider ${mod.accentText}`}
                                                        >
                                                            MODUL {mod.number} • {mod.categoryLabel}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                                                        {mod.title}
                                                    </h3>
                                                </div>
                                            </div>

                                            <Badge
                                                variant="outline"
                                                className="rounded-full border-slate-300 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                            >
                                                {mod.hookBadge}
                                            </Badge>
                                        </div>

                                        {/* Catchy Sales Tagline */}
                                        <div
                                            className={`rounded-2xl border px-4 py-3 ${mod.accentBox}`}
                                        >
                                            <p
                                                className={`text-sm font-extrabold sm:text-base ${mod.accentText}`}
                                            >
                                                &ldquo;{mod.tagline}&rdquo;
                                            </p>
                                        </div>

                                        {/* Detailed Persuasive Explanation (2 Paragraphs) */}
                                        <div className="space-y-3 text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
                                            <p>{mod.pitchIntro}</p>
                                            <p>{mod.pitchValue}</p>
                                        </div>

                                        {/* Target Audience & Live Data Proof */}
                                        <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                                            <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                                <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#006565] dark:text-emerald-400" />
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                        Sangat Cocok Untuk:
                                                    </div>
                                                    <div className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                                        {mod.audience}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                                <Target className="mt-0.5 h-4 w-4 shrink-0 text-[#006565] dark:text-emerald-400" />
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                        Cuplikan Data Live ({mod.liveHighlightLabel}):
                                                    </div>
                                                    <div className="mt-0.5 text-xs font-black text-[#006565] dark:text-emerald-400">
                                                        {mod.liveHighlightValue}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column (5 cols): Selling Points Box & Strong Call-To-Action */}
                                    <div className="lg:col-span-5">
                                        <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-800/50">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between border-b border-slate-200/70 pb-3 dark:border-slate-700">
                                                    <div className="flex items-center gap-2">
                                                        <Award
                                                            className={`h-4.5 w-4.5 ${mod.accentText}`}
                                                        />
                                                        <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                                            Keunggulan &amp; Fitur Modul Ini
                                                        </span>
                                                    </div>
                                                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-[#006565] dark:text-emerald-400">
                                                        Akses Gratis
                                                    </span>
                                                </div>

                                                <ul className="space-y-3">
                                                    {mod.sellingPoints.map((point, i) => (
                                                        <li
                                                            key={i}
                                                            className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300"
                                                        >
                                                            <CheckCircle2
                                                                className={`mt-0.5 h-4 w-4 shrink-0 ${mod.accentText}`}
                                                            />
                                                            <span className="font-medium">{point}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Action Button Area */}
                                            <div className="mt-6 border-t border-slate-200/70 pt-4 dark:border-slate-700">
                                                <Link
                                                    href={mod.href}
                                                    className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-5 py-3.5 text-xs font-black text-white shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] sm:text-sm ${mod.buttonClass}`}
                                                >
                                                    <span>{mod.ctaText}</span>
                                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                </Link>
                                                <div className="mt-2 flex items-center justify-center gap-4 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                                                    <span className="inline-flex items-center gap-1">
                                                        <BarChart3 className="h-3 w-3" />
                                                        Visualisasi Interaktif
                                                    </span>
                                                    <span>•</span>
                                                    <span className="inline-flex items-center gap-1">
                                                        <Download className="h-3 w-3" />
                                                        Ekspor PDF &amp; Excel
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>

                {/* Empty search state */}
                {filteredModules.length === 0 && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            Tidak ditemukan modul yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveCategory('all');
                                setSearchQuery('');
                            }}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#006565] px-4 py-2 text-xs font-bold text-white cursor-pointer"
                        >
                            Tampilkan Semua 8 Modul
                        </button>
                    </div>
                )}

                {/* ===================================================================== */}
                {/* BOTTOM CALL-TO-ACTION BANNER */}
                {/* ===================================================================== */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#004444] via-[#006565] to-emerald-800 p-6 text-white shadow-lg sm:p-10">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/15 blur-2xl" />
                    <div className="relative z-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
                        <div className="max-w-2xl space-y-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-200">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Siap Menjelajahi Data Pangan Indramayu?</span>
                            </span>
                            <h3 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                                Mulai Pantau Ketahanan Pangan, Ketersediaan &amp; Harga Pasar Sekarang
                            </h3>
                            <p className="text-xs leading-relaxed text-emerald-100/90 sm:text-sm">
                                Pilih salah satu dari 8 modul di atas untuk membuka dashboard penuh, melakukan filter waktu dan wilayah, serta mengunduh laporan resmi DKPP Kabupaten Indramayu.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href="/ikp"
                                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black text-[#006565] shadow-md transition-all hover:bg-emerald-50 sm:text-sm"
                            >
                                <ShieldCheck className="h-4 w-4" />
                                <span>Mulai dari Modul IKP</span>
                            </Link>
                            <Link
                                href="/harga-konsumen"
                                className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 sm:text-sm"
                            >
                                <Store className="h-4 w-4 text-emerald-200" />
                                <span>Cek Harga Konsumen</span>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <PortalFooter />
        </div>
    );
}
