import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    Database,
    Download,
    FileSpreadsheet,
    FileText,
    Layers,
    LineChart,
    Lock,
    Map,
    Menu,
    Scale,
    Search,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Store,
    TrendingUp,
    Warehouse,
    Wheat,
    X,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { dashboard, login, register } from '@/routes';

// Data simulasi komoditas strategis sesuai PRD & pasar Indramayu
interface CommodityPrice {
    name: string;
    category: string;
    price: number;
    het: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
    market: string;
    updatedAt: string;
}

const STRATEGIC_COMMODITIES: CommodityPrice[] = [
    {
        name: 'Beras Medium',
        category: 'Bahan Pokok Utama',
        price: 12500,
        het: 13100,
        unit: 'Kg',
        trend: 'stable',
        changePercent: -0.8,
        market: 'Pasar Daerah Indramayu',
        updatedAt: '06:00 WIB Hari Ini',
    },
    {
        name: 'Beras Premium',
        category: 'Bahan Pokok Utama',
        price: 14800,
        het: 14900,
        unit: 'Kg',
        trend: 'stable',
        changePercent: 0.0,
        market: 'Pasar Jatibarang',
        updatedAt: '06:30 WIB Hari Ini',
    },
    {
        name: 'Cabai Rawit Merah',
        category: 'Hortikultura Strategis',
        price: 43500,
        het: 40000,
        unit: 'Kg',
        trend: 'up',
        changePercent: 8.75,
        market: 'Pasar Karangampel',
        updatedAt: '06:15 WIB Hari Ini',
    },
    {
        name: 'Bawang Merah Brebes/Lokal',
        category: 'Bumbu Dapur Strategis',
        price: 31000,
        het: 36500,
        unit: 'Kg',
        trend: 'down',
        changePercent: -3.2,
        market: 'Pasar Haurgeulis',
        updatedAt: '07:00 WIB Hari Ini',
    },
    {
        name: 'Daging Sapi Segar',
        category: 'Protein Hewani',
        price: 135000,
        het: 140000,
        unit: 'Kg',
        trend: 'stable',
        changePercent: 0.0,
        market: 'Pasar Daerah Indramayu',
        updatedAt: '05:45 WIB Hari Ini',
    },
    {
        name: 'Telur Ayam Ras',
        category: 'Protein Hewani',
        price: 28500,
        het: 27000,
        unit: 'Kg',
        trend: 'up',
        changePercent: 5.5,
        market: 'Pasar Patrol',
        updatedAt: '06:20 WIB Hari Ini',
    },
    {
        name: 'Minyak Goreng Curah',
        category: 'Minyak & Lemak',
        price: 15400,
        het: 15700,
        unit: 'Liter',
        trend: 'stable',
        changePercent: -0.5,
        market: 'Pasar Jatibarang',
        updatedAt: '06:40 WIB Hari Ini',
    },
    {
        name: 'Minyakita (Kemasan)',
        category: 'Minyak & Lemak',
        price: 16000,
        het: 15700,
        unit: 'Liter',
        trend: 'up',
        changePercent: 1.9,
        market: 'Pasar Daerah Indramayu',
        updatedAt: '06:10 WIB Hari Ini',
    },
];

const MARKETS = [
    'Semua Pasar',
    'Pasar Daerah Indramayu',
    'Pasar Jatibarang',
    'Pasar Karangampel',
    'Pasar Haurgeulis',
    'Pasar Patrol',
];

interface SKPGKecamatan {
    kecamatan: string;
    ketersediaan: 'Aman' | 'Waspada' | 'Rentan';
    akses: 'Aman' | 'Waspada' | 'Rentan';
    pemanfaatan: 'Aman' | 'Waspada' | 'Rentan';
    statusAkhir: 'Aman' | 'Waspada' | 'Rentan';
    luasPusoHa: number;
    prevalensiGizi: string;
    fsvaPrioritas: number; // 1-6
}

const SAMPLE_KECAMATAN: SKPGKecamatan[] = [
    {
        kecamatan: 'Indramayu',
        ketersediaan: 'Aman',
        akses: 'Aman',
        pemanfaatan: 'Aman',
        statusAkhir: 'Aman',
        luasPusoHa: 0,
        prevalensiGizi: 'Rendah (4.1%)',
        fsvaPrioritas: 6,
    },
    {
        kecamatan: 'Jatibarang',
        ketersediaan: 'Aman',
        akses: 'Aman',
        pemanfaatan: 'Aman',
        statusAkhir: 'Aman',
        luasPusoHa: 2.5,
        prevalensiGizi: 'Rendah (5.3%)',
        fsvaPrioritas: 5,
    },
    {
        kecamatan: 'Losarang',
        ketersediaan: 'Waspada',
        akses: 'Aman',
        pemanfaatan: 'Waspada',
        statusAkhir: 'Waspada',
        luasPusoHa: 45.0,
        prevalensiGizi: 'Sedang (9.8%)',
        fsvaPrioritas: 3,
    },
    {
        kecamatan: 'Cantigi',
        ketersediaan: 'Waspada',
        akses: 'Rentan',
        pemanfaatan: 'Waspada',
        statusAkhir: 'Rentan',
        luasPusoHa: 80.2,
        prevalensiGizi: 'Tinggi (14.2%)',
        fsvaPrioritas: 2,
    },
    {
        kecamatan: 'Krangkeng',
        ketersediaan: 'Rentan',
        akses: 'Waspada',
        pemanfaatan: 'Rentan',
        statusAkhir: 'Rentan',
        luasPusoHa: 112.0,
        prevalensiGizi: 'Tinggi (16.5%)',
        fsvaPrioritas: 1,
    },
    {
        kecamatan: 'Haurgeulis',
        ketersediaan: 'Aman',
        akses: 'Aman',
        pemanfaatan: 'Aman',
        statusAkhir: 'Aman',
        luasPusoHa: 5.0,
        prevalensiGizi: 'Rendah (4.8%)',
        fsvaPrioritas: 6,
    },
    {
        kecamatan: 'Karangampel',
        ketersediaan: 'Aman',
        akses: 'Aman',
        pemanfaatan: 'Waspada',
        statusAkhir: 'Waspada',
        luasPusoHa: 14.3,
        prevalensiGizi: 'Sedang (8.1%)',
        fsvaPrioritas: 4,
    },
    {
        kecamatan: 'Kandanghaur',
        ketersediaan: 'Waspada',
        akses: 'Waspada',
        pemanfaatan: 'Waspada',
        statusAkhir: 'Waspada',
        luasPusoHa: 62.0,
        prevalensiGizi: 'Sedang (11.0%)',
        fsvaPrioritas: 3,
    },
];

export default function Welcome() {
    const { auth } = usePage().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Interactive Preview Tabs in Hero Mockup
    const [activeHeroTab, setActiveHeroTab] = useState<
        'harga' | 'neraca' | 'cadangan' | 'skpg'
    >('harga');

    // Interactive Simulator State
    const [simTab, setSimTab] = useState<'harga' | 'neraca' | 'skpg' | 'fsva'>(
        'harga',
    );
    const [selectedMarket, setSelectedMarket] = useState('Semua Pasar');
    const [searchCommodity, setSearchCommodity] = useState('');

    // Interactive Neraca Calculator State
    const [produksi, setProduksi] = useState(45000);
    const [pasokanMasuk, setPasokanMasuk] = useState(12000);
    const [pasokanKeluar, setPasokanKeluar] = useState(18000);
    const [susutPakan, setSusutPakan] = useState(4500);
    const [konsumsi, setKonsumsi] = useState(26000);

    const ketersediaanNeto = useMemo(() => {
        return Math.max(
            0,
            produksi + pasokanMasuk - pasokanKeluar - susutPakan,
        );
    }, [produksi, pasokanMasuk, pasokanKeluar, susutPakan]);

    const neracaSurplus = useMemo(() => {
        return ketersediaanNeto - konsumsi;
    }, [ketersediaanNeto, konsumsi]);

    // Interactive SKPG Selected Kecamatan
    const [selectedKecamatan, setSelectedKecamatan] = useState<SKPGKecamatan>(
        SAMPLE_KECAMATAN[2],
    );

    // Accordion FAQ state
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
    const toggleFaq = (index: number) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    // Filtered Commodities for Simulator
    const filteredCommodities = useMemo(() => {
        return STRATEGIC_COMMODITIES.filter((item) => {
            const matchMarket =
                selectedMarket === 'Semua Pasar' ||
                item.market === selectedMarket;
            const matchSearch = item.name
                .toLowerCase()
                .includes(searchCommodity.toLowerCase());
            return matchMarket && matchSearch;
        });
    }, [selectedMarket, searchCommodity]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(val);
    };

    const formatNumber = (val: number) => {
        return new Intl.NumberFormat('id-ID').format(val);
    };

    return (
        <>
            <Head>
                <title>
                    DKPP Indramayu - Sistem Informasi Ketahanan Pangan &
                    Pertanian Terpadu
                </title>
                <meta
                    name="description"
                    content="Sistem informasi digital terpadu Dinas Ketahanan Pangan dan Pertanian (DKPP) Kabupaten Indramayu: monitoring harga pangan strategis harian, neraca pangan wilayah, cadangan pangan CPPD/CPM, serta evaluasi kerentanan SKPG dan FSVA 31 kecamatan."
                />
                <meta
                    name="keywords"
                    content="DKPP Indramayu, ketahanan pangan indramayu, lumbung padi nasional, harga pangan indramayu, neraca pangan, cadangan pangan CPPD, SKPG, FSVA 31 kecamatan, dinas pertanian indramayu"
                />
                <meta
                    property="og:title"
                    content="DKPP Indramayu - Sistem Informasi Ketahanan Pangan & Pertanian Terpadu"
                />
                <meta
                    property="og:description"
                    content="Platform terpadu DKPP Kabupaten Indramayu untuk stabilisasi harga, neraca ketersediaan pangan, dan peringatan dini kerentanan wilayah."
                />
            </Head>

            <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] antialiased selection:bg-[#006565] selection:text-white">
                {/* ============================================================== */}
                {/* 1. TOP NAVBAR (Design System: Sleek Glassmorphism Header)      */}
                {/* ============================================================== */}
                <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all">
                    <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        {/* Logo & Brand Identity */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#006565] text-white shadow-md shadow-[#006565]/20">
                                <Wheat className="h-6 w-6 stroke-[2.2]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-base font-extrabold tracking-tight text-[#191c1e] sm:text-lg">
                                    DKPP INDRAMAYU
                                </span>
                                <span className="text-[11px] font-semibold tracking-wider text-[#006565] uppercase">
                                    Lumbung Padi Nasional
                                </span>
                            </div>
                        </div>

                        {/* Desktop Navigation Links */}
                        <nav className="hidden items-center gap-1 md:flex">
                            <a
                                href="#modul"
                                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#006565] lg:text-sm"
                            >
                                5 Modul PRD
                            </a>
                            <a
                                href="#simulasi"
                                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#006565] lg:text-sm"
                            >
                                Data & Simulasi
                            </a>
                            <a
                                href="#alur"
                                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#006565] lg:text-sm"
                            >
                                Alur Kerja
                            </a>
                            <a
                                href="#perbandingan"
                                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#006565] lg:text-sm"
                            >
                                Keunggulan
                            </a>
                            <a
                                href="#keamanan"
                                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#006565] lg:text-sm"
                            >
                                NFR & Akses
                            </a>
                            <a
                                href="#faq"
                                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#006565] lg:text-sm"
                            >
                                FAQ
                            </a>
                        </nav>

                        {/* Action Buttons */}
                        <div className="hidden items-center gap-3 md:flex">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#006565] px-4.5 py-2 text-xs font-bold text-white shadow-md shadow-[#006565]/20 transition-all hover:bg-[#005252] lg:text-sm"
                                >
                                    <Layers className="h-4 w-4" />
                                    <span>Buka Dashboard</span>
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:border-[#006565]/40 hover:bg-slate-50 hover:text-[#006565] lg:text-sm"
                                    >
                                        Portal Masuk
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#006565] px-4.5 py-2 text-xs font-bold text-white shadow-md shadow-[#006565]/20 transition-all hover:bg-[#005252] lg:text-sm"
                                    >
                                        <span>Registrasi Petugas</span>
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Hamburger */}
                        <div className="flex md:hidden">
                            <button
                                type="button"
                                onClick={() =>
                                    setMobileMenuOpen(!mobileMenuOpen)
                                }
                                className="inline-flex items-center justify-center rounded-xl p-2 text-slate-600 hover:bg-slate-100"
                                aria-label="Toggle Menu"
                            >
                                {mobileMenuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Dropdown Menu */}
                    {mobileMenuOpen && (
                        <div className="border-b border-slate-200 bg-white px-4 pt-2 pb-6 md:hidden">
                            <div className="flex flex-col space-y-2">
                                <a
                                    href="#modul"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    5 Modul PRD
                                </a>
                                <a
                                    href="#simulasi"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Data & Simulasi
                                </a>
                                <a
                                    href="#alur"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Alur Kerja
                                </a>
                                <a
                                    href="#perbandingan"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Keunggulan
                                </a>
                                <a
                                    href="#keamanan"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    NFR & Hak Akses
                                </a>
                                <a
                                    href="#faq"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    FAQ
                                </a>

                                <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-2">
                                    {auth.user ? (
                                        <Link
                                            href={dashboard()}
                                            className="w-full rounded-xl bg-[#006565] py-2.5 text-center text-sm font-bold text-white shadow-md"
                                        >
                                            Buka Dashboard
                                        </Link>
                                    ) : (
                                        <>
                                            <Link
                                                href={login()}
                                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-center text-sm font-bold text-slate-700"
                                            >
                                                Portal Masuk
                                            </Link>
                                            <Link
                                                href={register()}
                                                className="w-full rounded-xl bg-[#006565] py-2.5 text-center text-sm font-bold text-white shadow-md"
                                            >
                                                Registrasi Petugas
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                {/* ============================================================== */}
                {/* 2. HERO SECTION (KapanKosong Design: Radial Glow & Mockup)     */}
                {/* ============================================================== */}
                <section
                    id="home"
                    className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28"
                >
                    {/* Background Radial Glow Effect from KapanKosong */}
                    <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[560px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-[#006565]/20 via-emerald-100/40 to-teal-500/20 opacity-80 blur-3xl" />
                    <div className="pointer-events-none absolute top-1/2 -right-28 -z-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

                    <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
                        {/* Pill Badge */}
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#006565]/25 bg-[#006565]/8 px-4 py-1.5 text-xs font-bold text-[#006565] shadow-xs">
                            <Sparkles className="h-3.5 w-3.5 text-[#006565]" />
                            <span>
                                SISTEM INFORMASI TERPADU • DINAS KETAHANAN
                                PANGAN & PERTANIAN
                            </span>
                        </div>

                        {/* Hero Headline */}
                        <h1 className="mx-auto mt-6 max-w-5xl text-4xl leading-[1.14] font-black tracking-tight text-[#191c1e] sm:text-5xl lg:text-6xl">
                            Lumbung Padi Nasional yang{' '}
                            <span className="text-[#006565]">Tangguh</span>,{' '}
                            <span className="text-[#006565]">Terukur</span>{' '}
                            &amp; Terintegrasi.
                        </h1>

                        {/* Hero Subtitle */}
                        <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed font-medium text-slate-600 sm:text-xl">
                            Platform digital terpadu DKPP Kabupaten Indramayu
                            untuk monitoring stabilitas harga harian,
                            penghitungan neraca pangan wilayah, pengawasan
                            cadangan logistik CPPD &amp; CPM, serta peringatan
                            dini kerentanan pangan tingkat 31 kecamatan (SKPG
                            &amp; WebGIS FSVA).
                        </p>

                        {/* Hero Action Buttons */}
                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                            <a
                                href="#modul"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#006565] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#006565]/25 transition-all hover:bg-[#005252] hover:shadow-xl sm:w-auto"
                            >
                                <Wheat className="h-4 w-4" />
                                <span>Eksplorasi 5 Modul PRD</span>
                            </a>
                            <a
                                href="#simulasi"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300/80 bg-white px-7 py-3.5 text-sm font-bold text-slate-800 shadow-xs transition-all hover:border-[#006565]/40 hover:bg-slate-50 sm:w-auto"
                            >
                                <LineChart className="h-4 w-4 text-[#006565]" />
                                <span>Simulasi Data Terkini</span>
                            </a>
                        </div>

                        {/* Key Trust Numbers Bar */}
                        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-md sm:grid-cols-4 sm:p-5">
                            <div className="text-center">
                                <div className="text-2xl font-black text-[#006565] sm:text-3xl">
                                    31
                                </div>
                                <div className="mt-0.5 text-xs font-semibold text-slate-500">
                                    Kecamatan Terpetakan
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-black text-[#006565] sm:text-3xl">
                                    6
                                </div>
                                <div className="mt-0.5 text-xs font-semibold text-slate-500">
                                    Komoditas Strategis
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-black text-[#006565] sm:text-3xl">
                                    5
                                </div>
                                <div className="mt-0.5 text-xs font-semibold text-slate-500">
                                    Pasar Pantauan Utama
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-black text-[#006565] sm:text-3xl">
                                    &lt; 1.5s
                                </div>
                                <div className="mt-0.5 text-xs font-semibold text-slate-500">
                                    Render SPA Inertia
                                </div>
                            </div>
                        </div>

                        {/* Hero Interactive Device Mockup (Design Reference: KapanKosong Hero Phone Frame) */}
                        <div className="relative mx-auto mt-14 max-w-4xl">
                            {/* Floating Badge 1 - Top Left */}
                            <div className="animate-float absolute -top-6 -left-6 z-20 hidden max-w-[240px] rounded-2xl border border-emerald-100 bg-white/95 p-3.5 text-left shadow-xl backdrop-blur-md sm:block">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                            Status HET Beras
                                        </div>
                                        <div className="text-xs font-extrabold text-slate-900">
                                            Beras Medium Stabil
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                    Rp 12.500 (HET: Rp 13.100)
                                </div>
                            </div>

                            {/* Floating Badge 2 - Bottom Right */}
                            <div className="animate-float-delayed absolute -right-6 -bottom-6 z-20 hidden max-w-[240px] rounded-2xl border border-teal-100 bg-white/95 p-3.5 text-left shadow-xl backdrop-blur-md sm:block">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-[#006565]">
                                        <Warehouse className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                            Stok Gudang Bulog
                                        </div>
                                        <div className="text-xs font-extrabold text-slate-900">
                                            1.250 Ton CPPD
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 inline-block rounded-md bg-[#006565]/10 px-2 py-0.5 text-[11px] font-semibold text-[#006565]">
                                    Lead-Time: 84 Hari Ketahanan
                                </div>
                            </div>

                            {/* Main Frame */}
                            <div className="rounded-[2.2rem] border-4 border-slate-900/10 bg-white p-3 shadow-2xl ring-1 ring-slate-900/5 sm:p-5">
                                {/* Top Browser/App Header Bar */}
                                <div className="flex flex-col items-center justify-between gap-3 border-b border-slate-100 pb-3 text-left sm:flex-row sm:pb-4">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-3 w-3 rounded-full bg-rose-500" />
                                        <span className="flex h-3 w-3 rounded-full bg-amber-400" />
                                        <span className="flex h-3 w-3 rounded-full bg-emerald-500" />
                                        <span className="ml-2 text-xs font-bold text-slate-600">
                                            dkpp.indramayukab.go.id /
                                            dashboard-eksekutif
                                        </span>
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-600" />
                                        <span>
                                            Data Real-Time Terverifikasi
                                        </span>
                                    </div>
                                </div>

                                {/* Mockup Tabs Navigation */}
                                <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 sm:mt-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveHeroTab('harga')
                                        }
                                        className={`rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                                            activeHeroTab === 'harga'
                                                ? 'bg-[#006565] text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                                        }`}
                                    >
                                        📈 Harga Pangan (HET)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveHeroTab('neraca')
                                        }
                                        className={`rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                                            activeHeroTab === 'neraca'
                                                ? 'bg-[#006565] text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                                        }`}
                                    >
                                        ⚖️ Neraca Ketersediaan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveHeroTab('cadangan')
                                        }
                                        className={`rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                                            activeHeroTab === 'cadangan'
                                                ? 'bg-[#006565] text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                                        }`}
                                    >
                                        🏢 Stok CPPD &amp; Bulog
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveHeroTab('skpg')}
                                        className={`rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                                            activeHeroTab === 'skpg'
                                                ? 'bg-[#006565] text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                                        }`}
                                    >
                                        ⚠️ Peringatan SKPG
                                    </button>
                                </div>

                                {/* Mockup Active Content View */}
                                <div className="mt-3 rounded-2xl border border-slate-100 bg-[#f8fafc] p-3 text-left sm:p-5">
                                    {activeHeroTab === 'harga' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                                                <span>
                                                    Komoditas Pantauan (Pasar
                                                    Indramayu)
                                                </span>
                                                <span>
                                                    Harga vs HET Pemerintah
                                                </span>
                                            </div>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {STRATEGIC_COMMODITIES.slice(
                                                    0,
                                                    4,
                                                ).map((item) => (
                                                    <div
                                                        key={item.name}
                                                        className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white p-3 shadow-xs"
                                                    >
                                                        <div>
                                                            <div className="text-xs font-extrabold text-slate-900">
                                                                {item.name}
                                                            </div>
                                                            <div className="text-[11px] text-slate-500">
                                                                HET:{' '}
                                                                {formatCurrency(
                                                                    item.het,
                                                                )}
                                                                /{item.unit}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs font-black text-[#006565]">
                                                                {formatCurrency(
                                                                    item.price,
                                                                )}
                                                            </div>
                                                            <div
                                                                className={`text-[10px] font-bold ${
                                                                    item.price >
                                                                    item.het
                                                                        ? 'text-rose-600'
                                                                        : 'text-emerald-600'
                                                                }`}
                                                            >
                                                                {item.price >
                                                                item.het
                                                                    ? `⚠️ +${formatCurrency(
                                                                          item.price -
                                                                              item.het,
                                                                      )}`
                                                                    : '✅ Di Bawah HET'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeHeroTab === 'neraca' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                                <span>
                                                    Kalkulasi Neraca Pangan
                                                    Beras (Bulan Berjalan)
                                                </span>
                                                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800">
                                                    Status: SURPLUS +10.500 Ton
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                                                <div className="rounded-xl border border-slate-200/80 bg-white p-2.5">
                                                    <div className="text-[10px] font-bold text-slate-400">
                                                        PRODUKSI LOKAL
                                                    </div>
                                                    <div className="text-sm font-black text-slate-900">
                                                        45.000 Ton
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-slate-200/80 bg-white p-2.5">
                                                    <div className="text-[10px] font-bold text-slate-400">
                                                        PASOKAN MASUK
                                                    </div>
                                                    <div className="text-sm font-black text-slate-900">
                                                        +12.000 Ton
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-slate-200/80 bg-white p-2.5">
                                                    <div className="text-[10px] font-bold text-slate-400">
                                                        PASOKAN KELUAR
                                                    </div>
                                                    <div className="text-sm font-black text-slate-900">
                                                        -20.500 Ton
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-slate-200/80 bg-emerald-50 p-2.5">
                                                    <div className="text-[10px] font-bold text-emerald-800">
                                                        KONSUMSI BULANAN
                                                    </div>
                                                    <div className="text-sm font-black text-emerald-900">
                                                        26.000 Ton
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeHeroTab === 'cadangan' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                                <span>
                                                    Gudang Cadangan Pangan
                                                    Pemerintah Daerah (CPPD)
                                                </span>
                                                <span className="text-[11px] text-slate-500">
                                                    Kapasitas Maksimal: 2.000
                                                    Ton
                                                </span>
                                            </div>
                                            <div className="space-y-2 rounded-xl border border-slate-200/80 bg-white p-3.5">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span>
                                                        Stok Fisik Tersedia:
                                                        1.250 Ton Beras Medium
                                                    </span>
                                                    <span className="text-[#006565]">
                                                        62.5% Terisi
                                                    </span>
                                                </div>
                                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                                                    <div className="h-full w-[62.5%] rounded-full bg-[#006565]" />
                                                </div>
                                                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                                                    <span>
                                                        Ambang Batas Minimum:
                                                        500 Ton
                                                    </span>
                                                    <span className="font-semibold text-emerald-700">
                                                        Lead-time Cadangan: 84
                                                        Hari
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeHeroTab === 'skpg' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                                <span>
                                                    Peringatan Dini Sistem
                                                    Kewaspadaan Pangan &amp;
                                                    Gizi
                                                </span>
                                                <span className="text-[11px] text-slate-500">
                                                    31 Kecamatan
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-2.5">
                                                    <div className="text-xs font-bold text-emerald-800">
                                                        Status AMAN
                                                    </div>
                                                    <div className="text-lg font-black text-emerald-900">
                                                        24 Kecamatan
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-2.5">
                                                    <div className="text-xs font-bold text-amber-800">
                                                        Status WASPADA
                                                    </div>
                                                    <div className="text-lg font-black text-amber-900">
                                                        5 Kecamatan
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-2.5">
                                                    <div className="text-xs font-bold text-rose-800">
                                                        Status RENTAN
                                                    </div>
                                                    <div className="text-lg font-black text-rose-900">
                                                        2 Kecamatan
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================== */}
                {/* 3. 5 SPESIFIKASI FUNGSIONAL PER MODUL (PRD.md)                 */}
                {/* ============================================================== */}
                <section
                    id="modul"
                    className="relative border-y border-slate-200/70 bg-white py-20"
                >
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {/* Section Header */}
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#006565]/10 px-4 py-1.5 text-xs font-bold tracking-wider text-[#006565] uppercase">
                                <Wheat className="h-3.5 w-3.5" />
                                <span>Spesifikasi Fungsional PRD</span>
                            </div>
                            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#191c1e] sm:text-4xl lg:text-5xl">
                                5 Modul Terintegrasi Ketahanan Pangan
                            </h2>
                            <p className="mt-4 text-base leading-relaxed font-medium text-slate-600 sm:text-lg">
                                Dirancang sesuai dokumen Product Requirements
                                Document (PRD) untuk mendigitalkan seluruh mata
                                rantai pelaporan, kalkulasi neraca, serta
                                intervensi logistik dan stabilitas harga di
                                Kabupaten Indramayu.
                            </p>
                        </div>

                        {/* 5 Cards Grid */}
                        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Card 1: Harga Pangan */}
                            <div className="group relative rounded-3xl border border-slate-200/80 bg-[#f8fafc]/60 p-7 transition-all duration-300 hover:border-[#006565]/40 hover:bg-white hover:shadow-xl sm:p-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006565]/10 text-[#006565] transition-colors group-hover:bg-[#006565] group-hover:text-white">
                                        <TrendingUp className="h-6 w-6 stroke-[2.2]" />
                                    </div>
                                    <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold tracking-wider text-blue-700 uppercase">
                                        Publik &amp; Enumerator
                                    </span>
                                </div>

                                <h3 className="mt-6 text-xl font-extrabold text-[#191c1e]">
                                    Modul 1: Harga Pangan
                                </h3>

                                <p className="mt-3 text-xs leading-relaxed font-medium text-slate-600">
                                    Pencatatan harian komoditas strategis
                                    (beras, cabai, bawang, daging, telur,
                                    minyak), grafik fluktuasi harian/mingguan,
                                    serta deteksi deviasi harga otomatis di atas
                                    HET/HAP.
                                </p>

                                <div className="mt-6 space-y-2.5 border-t border-slate-200/80 pt-4 text-xs">
                                    <div className="flex items-start gap-2">
                                        <span className="w-16 shrink-0 font-bold text-slate-900">
                                            Input:
                                        </span>
                                        <span className="text-slate-600">
                                            Form harga harian per pasar
                                            pantauan.
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="w-16 shrink-0 font-bold text-slate-900">
                                            Output:
                                        </span>
                                        <span className="text-slate-600">
                                            Grafik tren, tabel disparitas harga,
                                            ekspor PDF/Excel.
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="w-16 shrink-0 font-bold text-slate-900">
                                            Hak Akses:
                                        </span>
                                        <span className="font-semibold text-[#006565]">
                                            Enumerator, Analis, Publik (view).
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Neraca Pangan */}
                            <div className="group relative rounded-3xl border border-slate-200/80 bg-[#f8fafc]/60 p-7 transition-all duration-300 hover:border-[#006565]/40 hover:bg-white hover:shadow-xl sm:p-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006565]/10 text-[#006565] transition-colors group-hover:bg-[#006565] group-hover:text-white">
                                        <Scale className="h-6 w-6 stroke-[2.2]" />
                                    </div>
                                    <span className="rounded-full bg-purple-50 px-3 py-1 text-[11px] font-bold tracking-wider text-purple-700 uppercase">
                                        Analis &amp; Eksekutif
                                    </span>
                                </div>

                                <h3 className="mt-6 text-xl font-extrabold text-[#191c1e]">
                                    Modul 2: Neraca Pangan
                                </h3>

                                <p className="mt-3 text-xs leading-relaxed font-medium text-slate-600">
                                    Kalkulasi ketersediaan pangan neto bulanan
                                    &amp; tahunan:
                                    <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-[11px] font-semibold text-slate-800">
                                        (Produksi + Masuk - Keluar - Susut) vs
                                        Konsumsi
                                    </code>{' '}
                                    secara presisi.
                                </p>

                                <div className="mt-6 space-y-2.5 border-t border-slate-200/80 pt-4 text-xs">
                                    <div className="flex items-start gap-2">
                                        <span className="w-16 shrink-0 font-bold text-slate-900">
                                            Input:
                                        </span>
                                        <span className="text-slate-600">
                                            Data panen lokal, distribusi
                                            logistik masuk &amp; keluar.
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="w-16 shrink-0 font-bold text-slate-900">
                                            Output:
                                        </span>
                                        <span className="text-slate-600">
                                            Neraca surplus / defisit per
                                            komoditas pangan.
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="w-16 shrink-0 font-bold text-slate-900">
                                            Hak Akses:
                                        </span>
                                        <span className="font-semibold text-[#006565]">
                                            Analis Ketahanan Pangan, Eksekutif.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Cadangan Pangan */}
                            <div className="group relative rounded-3xl border border-slate-200/80 bg-[#f8fafc]/60 p-7 transition-all duration-300 hover:border-[#006565]/40 hover:bg-white hover:shadow-xl sm:p-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006565]/10 text-[#006565] transition-colors group-hover:bg-[#006565] group-hover:text-white">
                                        <Warehouse className="h-6 w-6 stroke-[2.2]" />
                                    </div>
                                    <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold tracking-wider text-amber-700 uppercase">
                                        Petugas Gudang
                                    </span>
                                </div>

                                <h3 className="mt-6 text-xl font-extrabold text-[#191c1e]">
                                    Modul 3: Cadangan Pangan
                                </h3>

                                <p className="mt-3 text-xs leading-relaxed font-medium text-slate-600">
                                    Monitoring stok CPPD di gudang Bulog &amp;
                                    daerah, penyaluran darurat bencana/stunting,
                                    serta audit fisik lumbung pangan masyarakat
                                    (CPM) desa.
                                </p>

                                <div className="mt-6 space-y-2.5 border-t border-slate-200/80 pt-4 text-xs">
                                    <div className="flex items-start gap-2">
                                        <span className="w-16 shrink-0 font-bold text-slate-900">
                                            Input:
                                        </span>
                                        <span className="text-slate-600">
                                            Transaksi mutasi masuk/keluar stok,
                                            berita acara serah terima.
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="w-16 shrink-0 font-bold text-slate-900">
                                            Output:
                                        </span>
                                        <span className="text-slate-600">
                                            Kartu stok digital, laporan
                                            lead-time cadangan hari.
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="w-16 shrink-0 font-bold text-slate-900">
                                            Hak Akses:
                                        </span>
                                        <span className="font-semibold text-[#006565]">
                                            Petugas Gudang, Analis Pangan.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: SKPG */}
                            <div className="group relative rounded-3xl border border-slate-200/80 bg-[#f8fafc]/60 p-7 transition-all duration-300 hover:border-[#006565]/40 hover:bg-white hover:shadow-xl sm:p-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006565]/10 text-[#006565] transition-colors group-hover:bg-[#006565] group-hover:text-white">
                                        <ShieldAlert className="h-6 w-6 stroke-[2.2]" />
                                    </div>
                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
                                        Peringatan Dini
                                    </span>
                                </div>

                                <h3 className="mt-6 text-xl font-extrabold text-[#191c1e]">
                                    Modul 4: SKPG
                                </h3>

                                <p className="mt-3 text-xs leading-relaxed font-medium text-slate-600">
                                    Sistem Kewaspadaan Pangan &amp; Gizi:
                                    Evaluasi 3 aspek fundamental (Ketersediaan,
                                    Akses, Pemanfaatan gizi) bulanan tingkat
                                    kecamatan. Klasifikasi status: Aman,
                                    Waspada, Rentan.
                                </p>

                                <div className="mt-6 space-y-2.5 border-t border-slate-200/80 pt-4 text-xs">
                                    <div className="flex items-start gap-2">
                                        <span className="w-16 shrink-0 font-bold text-slate-900">
                                            Input:
                                        </span>
                                        <span className="text-slate-600">
                                            Luas puso pertanian, kasus gizi,
                                            rasio daya beli warga.
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="w-16 shrink-0 font-bold text-slate-900">
                                            Output:
                                        </span>
                                        <span className="text-slate-600">
                                            Indeks komposit SKPG, matriks skor
                                            bulanan kecamatan.
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="w-16 shrink-0 font-bold text-slate-900">
                                            Hak Akses:
                                        </span>
                                        <span className="font-semibold text-[#006565]">
                                            Enumerator Lapangan, Analis Pangan.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 5: FSVA */}
                            <div className="group relative rounded-3xl border border-slate-200/80 bg-[#f8fafc]/60 p-7 transition-all duration-300 hover:border-[#006565]/40 hover:bg-white hover:shadow-xl sm:col-span-2 sm:p-8 lg:col-span-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006565]/10 text-[#006565] transition-colors group-hover:bg-[#006565] group-hover:text-white">
                                        <Map className="h-6 w-6 stroke-[2.2]" />
                                    </div>
                                    <span className="rounded-full bg-teal-50 px-3 py-1 text-[11px] font-bold tracking-wider text-[#006565] uppercase">
                                        WebGIS Spasial 31 Kecamatan
                                    </span>
                                </div>

                                <h3 className="mt-6 text-xl font-extrabold text-[#191c1e]">
                                    Modul 5: FSVA (Food Security &amp;
                                    Vulnerability Atlas)
                                </h3>

                                <p className="mt-3 text-xs leading-relaxed font-medium text-slate-600">
                                    Pemetaan tematik indikator komposit
                                    kerentanan pangan pada 31 kecamatan di
                                    Kabupaten Indramayu (kategori Prioritas 1–6:
                                    Sangat Rawan hingga Sangat Tahan)
                                    menggunakan render layer WebGIS spasial
                                    responsif.
                                </p>

                                <div className="mt-6 grid gap-3 border-t border-slate-200/80 pt-4 text-xs sm:grid-cols-3">
                                    <div>
                                        <span className="mb-1 block font-bold text-slate-900">
                                            Input Data:
                                        </span>
                                        <span className="text-slate-600">
                                            Indikator spasial kemiskinan, akses
                                            air bersih, fasilitas kesehatan
                                            &amp; stunting.
                                        </span>
                                    </div>
                                    <div>
                                        <span className="mb-1 block font-bold text-slate-900">
                                            Output Sistem:
                                        </span>
                                        <span className="text-slate-600">
                                            Peta interaktif WebGIS GeoJSON
                                            dengan gradasi warna tematik
                                            wilayah.
                                        </span>
                                    </div>
                                    <div>
                                        <span className="mb-1 block font-bold text-slate-900">
                                            Hak Akses:
                                        </span>
                                        <span className="font-semibold text-[#006565]">
                                            Analis Pangan, Eksekutif (Bupati),
                                            Publik.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================== */}
                {/* 4. INTERACTIVE SIMULATOR (Experience PRD Calculations Live)   */}
                {/* ============================================================== */}
                <section
                    id="simulasi"
                    className="relative overflow-hidden bg-[#f7f9fb] py-20"
                >
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {/* Section Header */}
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-bold tracking-wider text-emerald-800 uppercase">
                                <LineChart className="h-3.5 w-3.5" />
                                <span>Simulasi &amp; Interaktivitas PRD</span>
                            </div>
                            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#191c1e] sm:text-4xl">
                                Uji Langsung Logika &amp; Formula Modul
                            </h2>
                            <p className="mt-4 text-base leading-relaxed font-medium text-slate-600">
                                Coba interaksi kalkulator neraca pangan neto,
                                pantau deteksi deviasi HET pasar harian, dan
                                periksa status SKPG serta prioritas FSVA 31
                                kecamatan.
                            </p>
                        </div>

                        {/* Interactive Tabs Pill Header */}
                        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={() => setSimTab('harga')}
                                className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                                    simTab === 'harga'
                                        ? 'bg-[#006565] text-white shadow-md shadow-[#006565]/20'
                                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                📈 Harga Pangan &amp; Deteksi HET
                            </button>
                            <button
                                type="button"
                                onClick={() => setSimTab('neraca')}
                                className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                                    simTab === 'neraca'
                                        ? 'bg-[#006565] text-white shadow-md shadow-[#006565]/20'
                                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                ⚖️ Kalkulator Neraca Neto
                            </button>
                            <button
                                type="button"
                                onClick={() => setSimTab('skpg')}
                                className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                                    simTab === 'skpg'
                                        ? 'bg-[#006565] text-white shadow-md shadow-[#006565]/20'
                                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                ⚠️ Evaluasi Tri-Status SKPG
                            </button>
                            <button
                                type="button"
                                onClick={() => setSimTab('fsva')}
                                className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                                    simTab === 'fsva'
                                        ? 'bg-[#006565] text-white shadow-md shadow-[#006565]/20'
                                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                🗺️ Atlas Kerentanan FSVA
                            </button>
                        </div>

                        {/* Simulator Card Container */}
                        <div className="mt-8 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl sm:p-8">
                            {/* TAB 1: HARGA PANGAN */}
                            {simTab === 'harga' && (
                                <div className="space-y-6">
                                    <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
                                        <div>
                                            <h3 className="text-xl font-extrabold text-[#191c1e]">
                                                Deteksi Disparitas &amp; Deviasi
                                                HET Komoditas
                                            </h3>
                                            <p className="mt-1 text-xs font-medium text-slate-500">
                                                Setiap harga yang melebihi
                                                HET/HAP memicu notifikasi
                                                peringatan otomatis bagi analis.
                                            </p>
                                        </div>

                                        {/* Filter Pasar Dropdown */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="relative">
                                                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={searchCommodity}
                                                    onChange={(e) =>
                                                        setSearchCommodity(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Cari komoditas..."
                                                    className="rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pr-3 pl-8 text-xs font-semibold focus:border-[#006565] focus:outline-hidden"
                                                />
                                            </div>

                                            <select
                                                value={selectedMarket}
                                                onChange={(e) =>
                                                    setSelectedMarket(
                                                        e.target.value,
                                                    )
                                                }
                                                className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-[#006565] focus:outline-hidden"
                                            >
                                                {MARKETS.map((m) => (
                                                    <option key={m} value={m}>
                                                        {m}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Commodities Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                                    <th className="px-4 py-3">
                                                        Komoditas Strategis
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        Pasar Pantauan
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        Harga Terkini
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        HET Acuan
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        Deviasi HET
                                                    </th>
                                                    <th className="px-4 py-3 text-right">
                                                        Status Sistem
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium">
                                                {filteredCommodities.map(
                                                    (item) => {
                                                        const isAboveHet =
                                                            item.price >
                                                            item.het;
                                                        const diff =
                                                            item.price -
                                                            item.het;
                                                        return (
                                                            <tr
                                                                key={
                                                                    item.name +
                                                                    item.market
                                                                }
                                                                className="transition-colors hover:bg-slate-50/80"
                                                            >
                                                                <td className="px-4 py-3.5 font-bold text-slate-900">
                                                                    <div>
                                                                        {
                                                                            item.name
                                                                        }
                                                                    </div>
                                                                    <div className="text-[10px] font-normal text-slate-400">
                                                                        {
                                                                            item.category
                                                                        }
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3.5 text-slate-600">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Store className="h-3.5 w-3.5 text-slate-400" />
                                                                        <span>
                                                                            {
                                                                                item.market
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3.5 font-extrabold text-slate-900">
                                                                    {formatCurrency(
                                                                        item.price,
                                                                    )}
                                                                    <span className="ml-0.5 text-[10px] font-normal text-slate-400">
                                                                        /
                                                                        {
                                                                            item.unit
                                                                        }
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3.5 text-slate-600">
                                                                    {formatCurrency(
                                                                        item.het,
                                                                    )}
                                                                    /{item.unit}
                                                                </td>
                                                                <td className="px-4 py-3.5">
                                                                    {isAboveHet ? (
                                                                        <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                                                                            <TrendingUp className="h-3.5 w-3.5" />
                                                                            <span>
                                                                                +
                                                                                {formatCurrency(
                                                                                    diff,
                                                                                )}{' '}
                                                                                (
                                                                                {
                                                                                    item.changePercent
                                                                                }
                                                                                %)
                                                                            </span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                                            <span>
                                                                                Stabil
                                                                                (
                                                                                {diff ===
                                                                                0
                                                                                    ? 'Tepat HET'
                                                                                    : `-${formatCurrency(Math.abs(diff))}`}
                                                                                )
                                                                            </span>
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3.5 text-right">
                                                                    {isAboveHet ? (
                                                                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700">
                                                                            <AlertCircle className="h-3 w-3" />
                                                                            <span>
                                                                                Waspada
                                                                                Deviasi
                                                                            </span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                                                            <Check className="h-3 w-3" />
                                                                            <span>
                                                                                Aman
                                                                                Terkendali
                                                                            </span>
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    },
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex flex-col items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 sm:flex-row">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-[#006565]" />
                                            <span>
                                                Pembaruan harian dilakukan oleh
                                                enumerator terdaftar setiap
                                                pukul 06:00 - 08:00 WIB.
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    alert(
                                                        'Simulasi ekspor laporan PDF PRD berhasil diinisiasi!',
                                                    )
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-xs hover:bg-slate-100"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                <span>Ekspor PDF</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    alert(
                                                        'Simulasi ekspor laporan Excel PRD berhasil diinisiasi!',
                                                    )
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-xs hover:bg-slate-100"
                                            >
                                                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                                                <span>Ekspor Excel</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: NERACA PANGAN CALCULATOR */}
                            {simTab === 'neraca' && (
                                <div className="space-y-6">
                                    <div className="border-b border-slate-100 pb-4">
                                        <h3 className="text-xl font-extrabold text-[#191c1e]">
                                            Formula Interaktif Neraca Pangan
                                            Wilayah
                                        </h3>
                                        <p className="mt-1 text-xs font-medium text-slate-500">
                                            Formula PRD:{' '}
                                            <span className="font-bold text-[#006565]">
                                                Ketersediaan Neto
                                            </span>{' '}
                                            = (Produksi Lokal + Pasokan Masuk -
                                            Pasokan Keluar - Susut/Pakan/Bibit)
                                            vs{' '}
                                            <span className="font-bold text-slate-700">
                                                Konsumsi Kebutuhan Wilayah
                                            </span>
                                            .
                                        </p>
                                    </div>

                                    {/* Sliders Grid */}
                                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                        {/* Produksi Lokal */}
                                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                                            <div className="mb-2 flex items-center justify-between text-xs font-bold">
                                                <label
                                                    htmlFor="input-produksi"
                                                    className="text-slate-700"
                                                >
                                                    Produksi Lokal (Panen)
                                                </label>
                                                <span className="font-extrabold text-[#006565]">
                                                    {formatNumber(produksi)} Ton
                                                </span>
                                            </div>
                                            <input
                                                id="input-produksi"
                                                type="range"
                                                min={10000}
                                                max={100000}
                                                step={1000}
                                                value={produksi}
                                                onChange={(e) =>
                                                    setProduksi(
                                                        Number(e.target.value),
                                                    )
                                                }
                                                className="w-full cursor-pointer accent-[#006565]"
                                            />
                                            <p className="mt-1 text-[10px] text-slate-400">
                                                Estimasi panen gabah/beras per
                                                siklus
                                            </p>
                                        </div>

                                        {/* Pasokan Masuk */}
                                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                                            <div className="mb-2 flex items-center justify-between text-xs font-bold">
                                                <label
                                                    htmlFor="input-pasokan-masuk"
                                                    className="text-slate-700"
                                                >
                                                    Pasokan Masuk
                                                </label>
                                                <span className="font-extrabold text-emerald-700">
                                                    +
                                                    {formatNumber(pasokanMasuk)}{' '}
                                                    Ton
                                                </span>
                                            </div>
                                            <input
                                                id="input-pasokan-masuk"
                                                type="range"
                                                min={0}
                                                max={40000}
                                                step={500}
                                                value={pasokanMasuk}
                                                onChange={(e) =>
                                                    setPasokanMasuk(
                                                        Number(e.target.value),
                                                    )
                                                }
                                                className="w-full cursor-pointer accent-emerald-600"
                                            />
                                            <p className="mt-1 text-[10px] text-slate-400">
                                                Distribusi antar-daerah &amp;
                                                logistik Bulog
                                            </p>
                                        </div>

                                        {/* Pasokan Keluar */}
                                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                                            <div className="mb-2 flex items-center justify-between text-xs font-bold">
                                                <label
                                                    htmlFor="input-pasokan-keluar"
                                                    className="text-slate-700"
                                                >
                                                    Pasokan Keluar
                                                </label>
                                                <span className="font-extrabold text-amber-700">
                                                    -
                                                    {formatNumber(
                                                        pasokanKeluar,
                                                    )}{' '}
                                                    Ton
                                                </span>
                                            </div>
                                            <input
                                                id="input-pasokan-keluar"
                                                type="range"
                                                min={0}
                                                max={50000}
                                                step={500}
                                                value={pasokanKeluar}
                                                onChange={(e) =>
                                                    setPasokanKeluar(
                                                        Number(e.target.value),
                                                    )
                                                }
                                                className="w-full cursor-pointer accent-amber-600"
                                            />
                                            <p className="mt-1 text-[10px] text-slate-400">
                                                Pengiriman logistik ke luar
                                                Indramayu
                                            </p>
                                        </div>

                                        {/* Susut / Pakan / Bibit */}
                                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                                            <div className="mb-2 flex items-center justify-between text-xs font-bold">
                                                <label
                                                    htmlFor="input-susut-pakan"
                                                    className="text-slate-700"
                                                >
                                                    Susut / Pakan / Bibit
                                                </label>
                                                <span className="font-extrabold text-rose-700">
                                                    -{formatNumber(susutPakan)}{' '}
                                                    Ton
                                                </span>
                                            </div>
                                            <input
                                                id="input-susut-pakan"
                                                type="range"
                                                min={1000}
                                                max={15000}
                                                step={500}
                                                value={susutPakan}
                                                onChange={(e) =>
                                                    setSusutPakan(
                                                        Number(e.target.value),
                                                    )
                                                }
                                                className="w-full cursor-pointer accent-rose-600"
                                            />
                                            <p className="mt-1 text-[10px] text-slate-400">
                                                Penyusutan panen, cadangan pakan
                                                &amp; benih
                                            </p>
                                        </div>

                                        {/* Kebutuhan Konsumsi */}
                                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 sm:col-span-2 lg:col-span-2">
                                            <div className="mb-2 flex items-center justify-between text-xs font-bold">
                                                <label
                                                    htmlFor="input-konsumsi"
                                                    className="text-slate-700"
                                                >
                                                    Kebutuhan Konsumsi Wilayah
                                                    (Bulanan)
                                                </label>
                                                <span className="font-extrabold text-slate-900">
                                                    {formatNumber(konsumsi)} Ton
                                                </span>
                                            </div>
                                            <input
                                                id="input-konsumsi"
                                                type="range"
                                                min={10000}
                                                max={60000}
                                                step={1000}
                                                value={konsumsi}
                                                onChange={(e) =>
                                                    setKonsumsi(
                                                        Number(e.target.value),
                                                    )
                                                }
                                                className="w-full cursor-pointer accent-slate-800"
                                            />
                                            <p className="mt-1 text-[10px] text-slate-400">
                                                Kebutuhan konsumsi riil ~1.85
                                                juta jiwa penduduk Indramayu
                                            </p>
                                        </div>
                                    </div>

                                    {/* Hasil Kalkulasi Otomatis */}
                                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6">
                                        <div className="grid gap-4 text-center sm:grid-cols-3 sm:text-left">
                                            <div className="border-slate-200/80 pr-4 sm:border-r">
                                                <div className="text-[11px] font-bold text-slate-500 uppercase">
                                                    Ketersediaan Neto
                                                </div>
                                                <div className="mt-1 text-2xl font-black text-slate-900">
                                                    {formatNumber(
                                                        ketersediaanNeto,
                                                    )}{' '}
                                                    <span className="text-xs font-bold text-slate-500">
                                                        Ton
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 text-[10px] text-slate-400">
                                                    Produksi + Masuk - Keluar -
                                                    Susut
                                                </p>
                                            </div>

                                            <div className="border-slate-200/80 pr-4 sm:border-r">
                                                <div className="text-[11px] font-bold text-slate-500 uppercase">
                                                    Kebutuhan Konsumsi
                                                </div>
                                                <div className="mt-1 text-2xl font-black text-slate-900">
                                                    {formatNumber(konsumsi)}{' '}
                                                    <span className="text-xs font-bold text-slate-500">
                                                        Ton
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 text-[10px] text-slate-400">
                                                    Konsumsi bulanan kabupaten
                                                </p>
                                            </div>

                                            <div>
                                                <div className="text-[11px] font-bold text-slate-500 uppercase">
                                                    Status Neraca Wilayah
                                                </div>
                                                <div
                                                    className={`mt-1 text-2xl font-black ${
                                                        neracaSurplus >= 0
                                                            ? 'text-emerald-600'
                                                            : 'text-rose-600'
                                                    }`}
                                                >
                                                    {neracaSurplus >= 0
                                                        ? `SURPLUS +${formatNumber(neracaSurplus)} Ton`
                                                        : `DEFISIT ${formatNumber(neracaSurplus)} Ton`}
                                                </div>
                                                <span
                                                    className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                        neracaSurplus >= 0
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-rose-100 text-rose-800'
                                                    }`}
                                                >
                                                    {neracaSurplus >= 0
                                                        ? '✅ Ketahanan Pangan Aman & Mandiri'
                                                        : '⚠️ Diperlukan Intervensi Pasokan CPPD'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: SKPG TRI-STATUS */}
                            {simTab === 'skpg' && (
                                <div className="space-y-6">
                                    <div className="border-b border-slate-100 pb-4">
                                        <h3 className="text-xl font-extrabold text-[#191c1e]">
                                            Matriks Indeks Komposit SKPG Bulanan
                                        </h3>
                                        <p className="mt-1 text-xs font-medium text-slate-500">
                                            Evaluasi 3 aspek fundamental
                                            (Ketersediaan, Akses, Pemanfaatan
                                            gizi) dengan klasifikasi: Aman,
                                            Waspada, Rentan.
                                        </p>
                                    </div>

                                    {/* Pilih Kecamatan */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold text-slate-700">
                                            Pilih Kecamatan Contoh:
                                        </span>
                                        {SAMPLE_KECAMATAN.map((k) => (
                                            <button
                                                key={k.kecamatan}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedKecamatan(k)
                                                }
                                                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                                    selectedKecamatan.kecamatan ===
                                                    k.kecamatan
                                                        ? 'bg-[#006565] text-white shadow-xs'
                                                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                Kec. {k.kecamatan}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Detail Kecamatan Terpilih */}
                                    <div className="grid gap-4 sm:grid-cols-4">
                                        {/* Ketersediaan */}
                                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">
                                                Aspek 1: Ketersediaan
                                            </div>
                                            <div className="mt-1 text-base font-extrabold text-slate-900">
                                                Luas Puso:{' '}
                                                {selectedKecamatan.luasPusoHa}{' '}
                                                Ha
                                            </div>
                                            <span
                                                className={`mt-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                                                    selectedKecamatan.ketersediaan ===
                                                    'Aman'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : selectedKecamatan.ketersediaan ===
                                                            'Waspada'
                                                          ? 'bg-amber-100 text-amber-800'
                                                          : 'bg-rose-100 text-rose-800'
                                                }`}
                                            >
                                                Status:{' '}
                                                {selectedKecamatan.ketersediaan}
                                            </span>
                                        </div>

                                        {/* Akses */}
                                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">
                                                Aspek 2: Aksesibilitas
                                            </div>
                                            <div className="mt-1 text-base font-extrabold text-slate-900">
                                                Daya Beli Pangan
                                            </div>
                                            <span
                                                className={`mt-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                                                    selectedKecamatan.akses ===
                                                    'Aman'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : selectedKecamatan.akses ===
                                                            'Waspada'
                                                          ? 'bg-amber-100 text-amber-800'
                                                          : 'bg-rose-100 text-rose-800'
                                                }`}
                                            >
                                                Status:{' '}
                                                {selectedKecamatan.akses}
                                            </span>
                                        </div>

                                        {/* Pemanfaatan */}
                                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">
                                                Aspek 3: Pemanfaatan Gizi
                                            </div>
                                            <div className="mt-1 text-base font-extrabold text-slate-900">
                                                Gizi:{' '}
                                                {
                                                    selectedKecamatan.prevalensiGizi
                                                }
                                            </div>
                                            <span
                                                className={`mt-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                                                    selectedKecamatan.pemanfaatan ===
                                                    'Aman'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : selectedKecamatan.pemanfaatan ===
                                                            'Waspada'
                                                          ? 'bg-amber-100 text-amber-800'
                                                          : 'bg-rose-100 text-rose-800'
                                                }`}
                                            >
                                                Status:{' '}
                                                {selectedKecamatan.pemanfaatan}
                                            </span>
                                        </div>

                                        {/* Status Akhir Komposit */}
                                        <div
                                            className={`rounded-2xl border p-4 ${
                                                selectedKecamatan.statusAkhir ===
                                                'Aman'
                                                    ? 'border-emerald-200 bg-emerald-50/70'
                                                    : selectedKecamatan.statusAkhir ===
                                                        'Waspada'
                                                      ? 'border-amber-200 bg-amber-50/70'
                                                      : 'border-rose-200 bg-rose-50/70'
                                            }`}
                                        >
                                            <div className="text-[10px] font-bold text-slate-500 uppercase">
                                                Status Komposit SKPG
                                            </div>
                                            <div className="mt-1 text-xl font-black text-slate-900">
                                                Kec.{' '}
                                                {selectedKecamatan.kecamatan}
                                            </div>
                                            <div className="mt-2 text-sm font-black">
                                                {selectedKecamatan.statusAkhir ===
                                                    'Aman' && (
                                                    <span className="text-emerald-800">
                                                        ✅ KONDISI AMAN
                                                    </span>
                                                )}
                                                {selectedKecamatan.statusAkhir ===
                                                    'Waspada' && (
                                                    <span className="text-amber-800">
                                                        ⚠️ WASPADA GIZI/PUSO
                                                    </span>
                                                )}
                                                {selectedKecamatan.statusAkhir ===
                                                    'Rentan' && (
                                                    <span className="text-rose-800">
                                                        🚨 RENTAN DARURAT
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: FSVA 31 KECAMATAN */}
                            {simTab === 'fsva' && (
                                <div className="space-y-6">
                                    <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
                                        <div>
                                            <h3 className="text-xl font-extrabold text-[#191c1e]">
                                                Food Security &amp;
                                                Vulnerability Atlas (FSVA)
                                            </h3>
                                            <p className="mt-1 text-xs font-medium text-slate-500">
                                                Peta tematik 31 kecamatan di
                                                Kabupaten Indramayu dengan 6
                                                tingkatan prioritas kerentanan
                                                pangan.
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                                            <span className="rounded-md bg-rose-600 px-2 py-0.5 text-white">
                                                P1 Sangat Rawan
                                            </span>
                                            <span className="rounded-md bg-rose-400 px-2 py-0.5 text-white">
                                                P2 Rawan
                                            </span>
                                            <span className="rounded-md bg-amber-400 px-2 py-0.5 text-slate-900">
                                                P3 Agak Rawan
                                            </span>
                                            <span className="rounded-md bg-emerald-300 px-2 py-0.5 text-slate-900">
                                                P4 Agak Tahan
                                            </span>
                                            <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-white">
                                                P5 Tahan
                                            </span>
                                            <span className="rounded-md bg-emerald-700 px-2 py-0.5 text-white">
                                                P6 Sangat Tahan
                                            </span>
                                        </div>
                                    </div>

                                    {/* 31 Kecamatan Grid Cards */}
                                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
                                        {[
                                            { name: 'Krangkeng', p: 1 },
                                            { name: 'Cantigi', p: 2 },
                                            { name: 'Losarang', p: 3 },
                                            { name: 'Kandanghaur', p: 3 },
                                            { name: 'Pasekan', p: 3 },
                                            { name: 'Karangampel', p: 4 },
                                            { name: 'Kedokan Bunder', p: 4 },
                                            { name: 'Juntinyuat', p: 4 },
                                            { name: 'Sukagumiwang', p: 4 },
                                            { name: 'Kertasemaya', p: 5 },
                                            { name: 'Jatibarang', p: 5 },
                                            { name: 'Sliyeg', p: 5 },
                                            { name: 'Widasari', p: 5 },
                                            { name: 'Bangodua', p: 5 },
                                            { name: 'Tukdana', p: 5 },
                                            { name: 'Lelea', p: 5 },
                                            { name: 'Cikedung', p: 5 },
                                            { name: 'Terisi', p: 5 },
                                            { name: 'Gabuswetan', p: 5 },
                                            { name: 'Kroya', p: 5 },
                                            { name: 'Bongas', p: 5 },
                                            { name: 'Anjatan', p: 5 },
                                            { name: 'Sukra', p: 5 },
                                            { name: 'Patrol', p: 5 },
                                            { name: 'Haurgeulis', p: 6 },
                                            { name: 'Gantar', p: 6 },
                                            { name: 'Sindang', p: 6 },
                                            { name: 'Indramayu', p: 6 },
                                            { name: 'Balongan', p: 6 },
                                            { name: 'Arahan', p: 6 },
                                            { name: 'Lohbener', p: 6 },
                                        ].map((kec) => {
                                            const bgColors = [
                                                '',
                                                'bg-rose-600 text-white',
                                                'bg-rose-500 text-white',
                                                'bg-amber-400 text-slate-900',
                                                'bg-emerald-300 text-slate-900',
                                                'bg-emerald-500 text-white',
                                                'bg-emerald-700 text-white',
                                            ];
                                            return (
                                                <div
                                                    key={kec.name}
                                                    className="cursor-pointer rounded-xl border border-slate-200/80 bg-white p-2.5 text-center shadow-2xs transition-transform hover:scale-105"
                                                >
                                                    <div className="truncate text-xs font-bold text-slate-800">
                                                        {kec.name}
                                                    </div>
                                                    <span
                                                        className={`mt-1.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold ${bgColors[kec.p]}`}
                                                    >
                                                        Prioritas {kec.p}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600">
                                        <span>
                                            💡 Layer WebGIS GeoJSON interaktif
                                            penuh dapat diakses oleh analis dan
                                            eksekutif di modul dashboard.
                                        </span>
                                        <span className="font-bold text-[#006565]">
                                            Waktu Render GeoJSON &lt; 2.0 Detik
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ============================================================== */}
                {/* 5. 3 LANGKAH ALUR KERJA TERPADU (KapanKosong Workflow)          */}
                {/* ============================================================== */}
                <section
                    id="alur"
                    className="relative border-t border-slate-200/80 bg-white py-20"
                >
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {/* Section Header */}
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#006565]/10 px-4 py-1.5 text-xs font-bold tracking-wider text-[#006565] uppercase">
                                <Activity className="h-3.5 w-3.5" />
                                <span>Alur Sistem Terintegrasi</span>
                            </div>
                            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#191c1e] sm:text-4xl">
                                3 Langkah Operasional Pengendalian Pangan
                            </h2>
                            <p className="mt-4 text-base leading-relaxed font-medium text-slate-600">
                                Proses terstruktur dari pendataan harga pasar di
                                lapangan hingga eksekusi intervensi logistik dan
                                stabilisasi pasokan oleh Pemerintah Daerah.
                            </p>
                        </div>

                        {/* 3 Steps Cards */}
                        <div className="mt-14 grid gap-8 md:grid-cols-3">
                            {/* Step 1 */}
                            <div className="relative rounded-3xl border border-slate-200/80 bg-[#f8fafc]/50 p-8 text-left transition-all hover:border-[#006565]/40 hover:bg-white hover:shadow-xl">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006565] text-lg font-black text-white shadow-md shadow-[#006565]/20">
                                    1
                                </div>
                                <h3 className="mt-6 text-xl font-extrabold text-[#191c1e]">
                                    Pencatatan Lapangan Terverifikasi
                                </h3>
                                <p className="mt-3 text-xs leading-relaxed font-medium text-slate-600">
                                    Petualas dan Enumerator lapangan menginput
                                    data harga 6 komoditas strategis setiap pagi
                                    di 5 pasar pantauan serta mutasi
                                    masuk/keluar stok gudang CPPD Bulog melalui
                                    form mobile.
                                </p>
                                <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#006565]">
                                    <Check className="h-4 w-4" />
                                    <span>Form Cepat &lt; 2 Menit</span>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="relative rounded-3xl border border-slate-200/80 bg-[#f8fafc]/50 p-8 text-left transition-all hover:border-[#006565]/40 hover:bg-white hover:shadow-xl">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006565] text-lg font-black text-white shadow-md shadow-[#006565]/20">
                                    2
                                </div>
                                <h3 className="mt-6 text-xl font-extrabold text-[#191c1e]">
                                    Agregasi &amp; Analisis Komposit
                                </h3>
                                <p className="mt-3 text-xs leading-relaxed font-medium text-slate-600">
                                    Sistem memproses otomatis kalkulasi neraca
                                    surplus/defisit, mendeteksi deviasi harga
                                    melebihi batas HET/HAP, serta menghitung
                                    matriks komposit SKPG dan peta kerentanan
                                    FSVA 31 kecamatan.
                                </p>
                                <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#006565]">
                                    <Check className="h-4 w-4" />
                                    <span>Otomatisasi Algoritma Real-Time</span>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="relative rounded-3xl border border-slate-200/80 bg-[#f8fafc]/50 p-8 text-left transition-all hover:border-[#006565]/40 hover:bg-white hover:shadow-xl">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006565] text-lg font-black text-white shadow-md shadow-[#006565]/20">
                                    3
                                </div>
                                <h3 className="mt-6 text-xl font-extrabold text-[#191c1e]">
                                    Pengambilan Keputusan &amp; Intervensi
                                </h3>
                                <p className="mt-3 text-xs leading-relaxed font-medium text-slate-600">
                                    Kepala Dinas &amp; Bupati memantau executive
                                    dashboard alert untuk menginisiasi Operasi
                                    Pasar Murah, pelepasan cadangan pangan CPPD,
                                    atau bantuan darurat di kecamatan rentan
                                    secara presisi.
                                </p>
                                <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#006565]">
                                    <Check className="h-4 w-4" />
                                    <span>Pencegahan Krisis Pangan Cepat</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================== */}
                {/* 6. PERBANDINGAN TRADISIONAL VS DIGITAL DKPP (Comparison)       */}
                {/* ============================================================== */}
                <section
                    id="perbandingan"
                    className="relative overflow-hidden border-t border-slate-200/80 bg-slate-50 py-20"
                >
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {/* Section Header */}
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-4 py-1.5 text-xs font-bold tracking-wider text-red-800 uppercase">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span>Modernisasi Tata Kelola Pangan</span>
                            </div>
                            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#191c1e] sm:text-4xl">
                                Tinggalkan Sistem Pelaporan Manual yang Lambat
                            </h2>
                            <p className="mt-4 text-base leading-relaxed font-medium text-slate-600">
                                Bandingkan cara konvensional yang berisiko
                                manipulasi dan keterlambatan data dengan
                                platform digital terintegrasi DKPP Kabupaten
                                Indramayu.
                            </p>
                        </div>

                        {/* Dual Comparison Cards */}
                        <div className="mt-14 grid gap-8 lg:grid-cols-2">
                            {/* Konvensional Card */}
                            <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-red-200/80 bg-white p-8 shadow-sm sm:p-10">
                                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-red-50 blur-2xl" />
                                <div>
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold tracking-wider text-red-800 uppercase">
                                        ❌ Cara Konvensional (Sebelumnya)
                                    </div>
                                    <h3 className="mt-4 text-2xl font-black text-slate-900">
                                        Manual, Terfragmentasi &amp; Rawan
                                        Terlambat
                                    </h3>
                                    <ul className="mt-6 space-y-4 text-xs font-medium text-slate-600">
                                        <li className="flex items-start gap-3">
                                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                                            <span>
                                                Pencatatan harga via kertas dan
                                                spreadsheet terpisah
                                                antar-pasar.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                                            <span>
                                                Lonjakan harga di atas HET baru
                                                terdeteksi beberapa hari
                                                kemudian.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                                            <span>
                                                Perhitungan neraca pangan
                                                bulanan memakan waktu hingga
                                                mingguan.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                                            <span>
                                                Data stok lumbung CPPD tidak
                                                sinkron dengan kondisi riil di
                                                lapangan.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                                            <span>
                                                Ketiadaan audit trail log
                                                aktivitas atas perubahan data
                                                komoditas.
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="mt-8 border-t border-slate-100 pt-4 text-xs font-bold text-red-600">
                                    Rentan Keterlambatan Intervensi Pangan &amp;
                                    Risiko Lonjakan Inflasi
                                </div>
                            </div>

                            {/* Modern DKPP Digital Card */}
                            <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#006565]/30 bg-gradient-to-br from-slate-900 to-[#003b3b] p-8 text-white shadow-xl sm:p-10">
                                <div className="pointer-events-none absolute right-1/4 -bottom-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
                                <div>
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#006565]/80 px-3 py-1 text-xs font-bold tracking-wider text-[#93f2f2] uppercase">
                                        ✨ Ekosistem Digital DKPP
                                    </div>
                                    <h3 className="mt-4 text-2xl font-black text-white">
                                        Real-Time, Terpadu &amp; Siap Intervensi
                                    </h3>
                                    <ul className="mt-6 space-y-4 text-xs font-medium text-slate-300">
                                        <li className="flex items-start gap-3">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#93f2f2]" />
                                            <span>
                                                Form pencatatan mobile instan
                                                oleh enumerator resmi di 5
                                                pasar.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#93f2f2]" />
                                            <span>
                                                Deteksi anomali harga di atas
                                                HET/HAP seketika dengan alarm
                                                peringatan.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#93f2f2]" />
                                            <span>
                                                Otomatisasi kalkulasi neraca
                                                surplus/defisit berbasis formula
                                                ilmiah.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#93f2f2]" />
                                            <span>
                                                Kartu stok digital CPPD
                                                terverifikasi dengan estimasi
                                                lead-time ketahanan.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#93f2f2]" />
                                            <span>
                                                Visualisasi spasial WebGIS 31
                                                kecamatan dan audit activity log
                                                terjamin.
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="mt-8 border-t border-white/10 pt-4 text-xs font-bold text-[#93f2f2]">
                                    Keputusan Intervensi Berbasis Data Nyata
                                    untuk Ketahanan Pangan Rakyat
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================== */}
                {/* 7. NON-FUNCTIONAL REQUIREMENTS & AUDITABILITY (PRD NFR)         */}
                {/* ============================================================== */}
                <section
                    id="keamanan"
                    className="relative border-t border-slate-200/80 bg-white py-20"
                >
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {/* Section Header */}
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold tracking-wider text-blue-700 uppercase">
                                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                                <span>Non-Functional Requirements (NFR)</span>
                            </div>
                            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#191c1e] sm:text-4xl">
                                Standar Keandalan, Kecepatan &amp; Keamanan Data
                            </h2>
                            <p className="mt-4 text-base leading-relaxed font-medium text-slate-600">
                                Sesuai ketetapan PRD untuk menjamin integritas
                                pelaporan publik dan perlindungan data strategis
                                ketahanan pangan Kabupaten Indramayu.
                            </p>
                        </div>

                        {/* NFR 3 Cards */}
                        <div className="mt-14 grid gap-6 md:grid-cols-3">
                            {/* NFR 1: Performa */}
                            <div className="rounded-3xl border border-slate-200/80 bg-[#f8fafc] p-8 shadow-xs">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                                    <Clock className="h-5 w-5 stroke-[2.2]" />
                                </div>
                                <h3 className="mt-5 text-lg font-extrabold text-slate-900">
                                    Performa Tinggi (Sub-1.5s)
                                </h3>
                                <p className="mt-2.5 text-xs leading-relaxed font-medium text-slate-600">
                                    Waktu render awal Single Page Application
                                    (SPA) Inertia.js di bawah{' '}
                                    <strong className="text-slate-900">
                                        1.5 detik
                                    </strong>
                                    . Pemuatan layer GeoJSON peta 31 kecamatan
                                    di bawah{' '}
                                    <strong className="text-slate-900">
                                        2.0 detik
                                    </strong>
                                    .
                                </p>
                                <div className="mt-5 flex items-center gap-2 text-xs font-bold text-emerald-700">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>
                                        Vite + Wayfinder Cache Optimized
                                    </span>
                                </div>
                            </div>

                            {/* NFR 2: Keamanan & RBAC */}
                            <div className="rounded-3xl border border-slate-200/80 bg-[#f8fafc] p-8 shadow-xs">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-800">
                                    <Lock className="h-5 w-5 stroke-[2.2]" />
                                </div>
                                <h3 className="mt-5 text-lg font-extrabold text-slate-900">
                                    Keamanan Ketat (RBAC)
                                </h3>
                                <p className="mt-2.5 text-xs leading-relaxed font-medium text-slate-600">
                                    Role-Based Access Control bertingkat,
                                    enkripsi token sesi, serta sanitasi ketat
                                    seluruh input data form untuk mencegah
                                    ancaman XSS dan SQL Injection.
                                </p>
                                <div className="mt-5 flex items-center gap-2 text-xs font-bold text-blue-700">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>
                                        Session Protection &amp; Auth Guard
                                    </span>
                                </div>
                            </div>

                            {/* NFR 3: Auditability */}
                            <div className="rounded-3xl border border-slate-200/80 bg-[#f8fafc] p-8 shadow-xs">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-800">
                                    <Database className="h-5 w-5 stroke-[2.2]" />
                                </div>
                                <h3 className="mt-5 text-lg font-extrabold text-slate-900">
                                    Auditability &amp; Activity Log
                                </h3>
                                <p className="mt-2.5 text-xs leading-relaxed font-medium text-slate-600">
                                    Pencatatan riwayat setiap penyesuaian neraca
                                    pangan dan pergeseran harga komoditas secara
                                    otomatis dan tidak dapat dimanipulasi untuk
                                    akuntabilitas publik.
                                </p>
                                <div className="mt-5 flex items-center gap-2 text-xs font-bold text-purple-700">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>Activity Trail Immutable</span>
                                </div>
                            </div>
                        </div>

                        {/* Hak Akses Stakeholder Table (BRD & PRD) */}
                        <div className="mt-14 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                            <h3 className="mb-2 text-xl font-extrabold text-slate-900">
                                Matriks Hak Akses Stakeholder (BRD &amp; PRD)
                            </h3>
                            <p className="mb-6 text-xs font-medium text-slate-500">
                                Pemisahan hak akses sesuai wewenang dan tanggung
                                jawab jabatan.
                            </p>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase">
                                            <th className="px-4 py-3">
                                                Peran Pengguna
                                            </th>
                                            <th className="px-4 py-3">
                                                Harga Pangan
                                            </th>
                                            <th className="px-4 py-3">
                                                Neraca Pangan
                                            </th>
                                            <th className="px-4 py-3">
                                                Cadangan CPPD
                                            </th>
                                            <th className="px-4 py-3">
                                                SKPG &amp; FSVA
                                            </th>
                                            <th className="px-4 py-3">
                                                Akses Master Data
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        <tr className="hover:bg-slate-50/60">
                                            <td className="px-4 py-3.5 font-bold text-slate-900">
                                                Super Admin / Tim IT DKPP
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-emerald-600">
                                                Full Akses
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-emerald-600">
                                                Full Akses
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-emerald-600">
                                                Full Akses
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-emerald-600">
                                                Full Akses
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-emerald-600">
                                                Kelola User/Konfigurasi
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-slate-50/60">
                                            <td className="px-4 py-3.5 font-bold text-slate-900">
                                                Petualas / Enumerator Lapangan
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-emerald-600">
                                                Input Harian Pasar
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-400">
                                                -
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-400">
                                                -
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-emerald-600">
                                                Input Data Puso
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-400">
                                                -
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-slate-50/60">
                                            <td className="px-4 py-3.5 font-bold text-slate-900">
                                                Analis Ketahanan Pangan
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-emerald-600">
                                                Verifikasi &amp; Disparitas
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-emerald-600">
                                                Kalkulasi Netto
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-emerald-600">
                                                Analisis Stok
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-emerald-600">
                                                Kalkulator Komposit
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-400">
                                                -
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-slate-50/60">
                                            <td className="px-4 py-3.5 font-bold text-slate-900">
                                                Kepala Dinas &amp; Bupati
                                                (Eksekutif)
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-emerald-600">
                                                Executive View
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-emerald-600">
                                                Executive View
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-emerald-600">
                                                Alert Cadangan
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-emerald-600">
                                                Peta Spasial Alert
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-400">
                                                -
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-slate-50/60">
                                            <td className="px-4 py-3.5 font-bold text-slate-900">
                                                Masyarakat Umum (Publik)
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-emerald-600">
                                                Lihat Terbuka
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-400">
                                                -
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-400">
                                                -
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-emerald-600">
                                                Lihat Peta FSVA
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-400">
                                                -
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================== */}
                {/* 8. FAQ ACCORDION SECTION (KapanKosong Design System)           */}
                {/* ============================================================== */}
                <section
                    id="faq"
                    className="relative border-t border-slate-200/80 bg-[#f7f9fb] py-20"
                >
                    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                        {/* Section Header */}
                        <div className="text-center">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#006565]/10 px-4 py-1.5 text-xs font-bold tracking-wider text-[#006565] uppercase">
                                <Wheat className="h-3.5 w-3.5" />
                                <span>Pertanyaan Umum (FAQ)</span>
                            </div>
                            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#191c1e] sm:text-4xl">
                                Semua Hal Seputar Sistem DKPP Indramayu
                            </h2>
                            <p className="mt-4 text-base leading-relaxed font-medium text-slate-600">
                                Panduan dan informasi mendasar mengenai
                                pengoperasian aplikasi, transparansi data harga
                                pangan, dan tata cara pelaporan.
                            </p>
                        </div>

                        {/* Accordion Items */}
                        <div className="mt-12 space-y-3.5">
                            {[
                                {
                                    q: 'Apakah publik dapat melihat data harga harian tanpa perlu login?',
                                    a: 'Ya, publik dapat mengakses portal informasi harga pangan harian di 5 pasar pantauan secara bebas dan transparan tanpa perlu login. Fitur ini dirancang untuk mendukung keterbukaan informasi publik bagi konsumen dan pedagang.',
                                },
                                {
                                    q: 'Bagaimana sistem mendeteksi lonjakan harga di atas HET/HAP?',
                                    a: 'Sistem membandingkan data input harga harian dari enumerator dengan master data Harga Eceran Tertinggi (HET) atau Harga Acuan Penjualan (HAP). Deviasi positif di atas ambang batas toleransi secara otomatis memicu label alert peringatan bagi analis dan pembuat kebijakan.',
                                },
                                {
                                    q: 'Apa perbedaan antara evaluasi bulanan SKPG dan pemetaan FSVA?',
                                    a: 'SKPG (Sistem Kewaspadaan Pangan dan Gizi) difokuskan pada pemantauan bulanan 3 aspek (ketersediaan pangan, akses daya beli, dan status gizi) untuk deteksi tri-status (Aman, Waspada, Rentan). Sedangkan FSVA (Food Security & Vulnerability Atlas) merupakan pemetaan komposit spasial komprehensif tahunan tingkat 31 kecamatan dalam 6 prioritas kerentanan.',
                                },
                                {
                                    q: 'Bagaimana formula perhitungan Neraca Pangan Wilayah bekerja?',
                                    a: 'Formula menghitung Ketersediaan Neto = (Produksi Lokal + Pasokan Masuk - Pasokan Keluar - Susut/Pakan/Bibit). Nilai ini kemudian dibandingkan dengan proyeksi Kebutuhan Konsumsi penduduk bulanan untuk menentukan status Surplus atau Defisit per komoditas strategis.',
                                },
                                {
                                    q: 'Bagaimana keamanan transaksi mutasi stok cadangan CPPD dijamin?',
                                    a: 'Setiap transaksi mutasi masuk dan keluar pada stok CPPD wajib disertai berita acara resmi dan diverifikasi oleh petugas gudang. Seluruh riwayat mutasi dicatat secara permanen dalam activity log yang terenkripsi dan terlindungi audit trail.',
                                },
                            ].map((faq, idx) => {
                                const isOpen = openFaqIndex === idx;
                                return (
                                    <div
                                        key={faq.q}
                                        className="rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleFaq(idx)}
                                            className="flex w-full cursor-pointer items-center justify-between p-5 text-left text-sm font-bold text-slate-900 sm:text-base"
                                        >
                                            <span>{faq.q}</span>
                                            <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                                {isOpen ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </span>
                                        </button>
                                        {isOpen && (
                                            <div className="border-t border-slate-100 px-5 pt-1 pb-5 text-xs leading-relaxed font-medium text-slate-600 sm:text-sm">
                                                {faq.a}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ============================================================== */}
                {/* 9. DARK/TEAL HEROIC CTA BANNER (Design from KapanKosong)       */}
                {/* ============================================================== */}
                <section className="relative overflow-hidden bg-slate-900 py-20 text-white">
                    {/* Glowing radial circles */}
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,101,101,0.5),rgba(255,255,255,0))]" />
                    <div className="pointer-events-none absolute right-1/4 -bottom-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

                    <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#006565]/40 bg-[#006565]/20 px-4 py-1.5 text-xs font-bold text-[#93f2f2]">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Pemerintah Kabupaten Indramayu • DKPP</span>
                        </div>

                        <h2 className="text-3xl leading-[1.15] font-black tracking-tight sm:text-5xl lg:text-6xl">
                            Wujudkan Ketahanan Pangan Mandiri untuk Indramayu
                        </h2>

                        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed font-medium text-slate-300 sm:text-xl">
                            Integrasikan data harga pasar, pantau stok gudang
                            cadangan, dan amankan pasokan pangan bagi seluruh
                            masyarakat Kabupaten Indramayu melalui satu platform
                            terpadu.
                        </p>

                        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#006565] px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-[#006565]/30 transition-all hover:bg-[#005252] sm:w-auto"
                                >
                                    <Layers className="h-4 w-4" />
                                    <span>Buka Dashboard Petugas</span>
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#006565] px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-[#006565]/30 transition-all hover:bg-[#005252] sm:w-auto"
                                    >
                                        <Lock className="h-4 w-4" />
                                        <span>Masuk ke Portal Petugas</span>
                                    </Link>
                                    <a
                                        href="#simulasi"
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 sm:w-auto"
                                    >
                                        <LineChart className="h-4 w-4 text-[#93f2f2]" />
                                        <span>Lihat Data Harga Publik</span>
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {/* ============================================================== */}
                {/* 10. FOOTER                                                     */}
                {/* ============================================================== */}
                <footer className="border-t border-slate-200 bg-white text-slate-600">
                    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                        <div className="grid gap-8 md:grid-cols-4">
                            {/* Brand Info */}
                            <div className="space-y-4 md:col-span-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#006565] text-white">
                                        <Wheat className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-base font-extrabold text-slate-900">
                                            DKPP INDRAMAYU
                                        </span>
                                        <span className="text-[10px] font-semibold tracking-wider text-[#006565] uppercase">
                                            Dinas Ketahanan Pangan dan Pertanian
                                        </span>
                                    </div>
                                </div>
                                <p className="max-w-md text-xs leading-relaxed font-medium text-slate-500">
                                    Pemerintah Daerah Kabupaten Indramayu, Jawa
                                    Barat. Menjaga ketahanan pangan, stabilitas
                                    harga komoditas strategis, serta
                                    mengoptimalkan peran Indramayu sebagai
                                    lumbung padi nasional.
                                </p>
                                <div className="space-y-1 text-xs text-slate-500">
                                    <div>
                                        📍 Jl. Letnan Joni No. 45, Jatibarang -
                                        Indramayu, Jawa Barat
                                    </div>
                                    <div>
                                        📞 Hotline Krisis Pangan: (0234) 272-111
                                        • dkpp@indramayukab.go.id
                                    </div>
                                </div>
                            </div>

                            {/* Modul Sistem Links */}
                            <div>
                                <h4 className="mb-3 text-xs font-bold tracking-wider text-slate-900 uppercase">
                                    Modul Terintegrasi
                                </h4>
                                <ul className="space-y-2 text-xs font-semibold text-slate-600">
                                    <li>
                                        <a
                                            href="#modul"
                                            className="hover:text-[#006565]"
                                        >
                                            Harga Pangan Harian
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#modul"
                                            className="hover:text-[#006565]"
                                        >
                                            Kalkulasi Neraca Pangan
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#modul"
                                            className="hover:text-[#006565]"
                                        >
                                            Stok CPPD &amp; Lumbung CPM
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#modul"
                                            className="hover:text-[#006565]"
                                        >
                                            Peringatan Dini SKPG
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#modul"
                                            className="hover:text-[#006565]"
                                        >
                                            WebGIS Kerentanan FSVA
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            {/* Layanan & Akses */}
                            <div>
                                <h4 className="mb-3 text-xs font-bold tracking-wider text-slate-900 uppercase">
                                    Akses Portal
                                </h4>
                                <ul className="space-y-2 text-xs font-semibold text-slate-600">
                                    <li>
                                        <Link
                                            href={login()}
                                            className="hover:text-[#006565]"
                                        >
                                            Login Petugas &amp; Analis
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={register()}
                                            className="hover:text-[#006565]"
                                        >
                                            Registrasi Enumerator
                                        </Link>
                                    </li>
                                    <li>
                                        <a
                                            href="#simulasi"
                                            className="hover:text-[#006565]"
                                        >
                                            Portal Informasi Publik
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#keamanan"
                                            className="hover:text-[#006565]"
                                        >
                                            Keamanan &amp; Audit Trail
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#faq"
                                            className="hover:text-[#006565]"
                                        >
                                            Bantuan &amp; FAQ
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-10 flex flex-col items-center justify-between border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row">
                            <div>
                                &copy; 2026 Dinas Ketahanan Pangan dan Pertanian
                                Kabupaten Indramayu. Seluruh Hak Cipta
                                Dilindungi.
                            </div>
                            <div className="mt-2 font-medium sm:mt-0">
                                Sistem Informasi Ketahanan Pangan Terpadu •
                                Laravel &amp; Inertia React
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
