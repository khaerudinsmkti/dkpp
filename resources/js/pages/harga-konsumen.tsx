import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowRight,
    ArrowUp,
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    Filter,
    Info,
    Layers,
    Menu,
    Minus,
    Pause,
    Play,
    RefreshCw,
    Store,
    TrendingUp,
    Wheat,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { dashboard, login, register } from '@/routes';

export interface ConsumerCommodityItem {
    id: number;
    name: string;
    category?: string;
    unit: string;
    today_price: number | null;
    yesterday_price: number | null;
    het_price: number | null;
    date?: string;
}

export interface MarketOption {
    id: number;
    name: string;
    location?: string | null;
}

export interface HargaKonsumenProps {
    consumerCommodities?: ConsumerCommodityItem[];
    markets?: MarketOption[];
    selectedMarketId?: number;
    selectedMarketName?: string;
    selectedDate?: string;
    prevDate?: string;
    minDate?: string;
    maxDate?: string;
    marketName?: string;
    latestDate?: string;
}

export const DEFAULT_CONSUMER_COMMODITIES: ConsumerCommodityItem[] = [
    {
        id: 1,
        name: 'Beras Premium',
        category: 'Bahan Pokok Utama',
        unit: 'Kg',
        today_price: 14900,
        yesterday_price: 14900,
        het_price: 14900,
    },
    {
        id: 2,
        name: 'Beras Medium',
        category: 'Bahan Pokok Utama',
        unit: 'Kg',
        today_price: 13250,
        yesterday_price: 13250,
        het_price: 13500,
    },
    {
        id: 3,
        name: 'Beras SPHP',
        category: 'Bahan Pokok Utama',
        unit: 'Kg',
        today_price: 12000,
        yesterday_price: 12000,
        het_price: 12500,
    },
    {
        id: 4,
        name: 'Beras Medium Non SPHP',
        category: 'Bahan Pokok Utama',
        unit: 'Kg',
        today_price: 13500,
        yesterday_price: 13500,
        het_price: 13500,
    },
    {
        id: 5,
        name: 'Jagung Tk Peternak',
        category: 'Pakan Ternak & Palawija',
        unit: 'Kg',
        today_price: 5200,
        yesterday_price: 5148,
        het_price: 5800,
    },
    {
        id: 6,
        name: 'Kedelai Biji Kering (Impor)',
        category: 'Palawija & Kacang',
        unit: 'Kg',
        today_price: 11400,
        yesterday_price: 11375,
        het_price: 12000,
    },
    {
        id: 7,
        name: 'Bawang Merah',
        category: 'Bumbu Dapur Strategis',
        unit: 'Kg',
        today_price: 32333,
        yesterday_price: 32333,
        het_price: 40000,
    },
    {
        id: 8,
        name: 'Bawang Putih Bonggol',
        category: 'Bumbu Dapur Strategis',
        unit: 'Kg',
        today_price: 32333,
        yesterday_price: 32333,
        het_price: 38000,
    },
    {
        id: 9,
        name: 'Cabai Merah Keriting',
        category: 'Hortikultura Strategis',
        unit: 'Kg',
        today_price: 58000,
        yesterday_price: 56333,
        het_price: 55000,
    },
    {
        id: 10,
        name: 'Cabai Merah Besar',
        category: 'Hortikultura Strategis',
        unit: 'Kg',
        today_price: 42000,
        yesterday_price: 41333,
        het_price: null,
    },
    {
        id: 11,
        name: 'Daging Sapi Murni',
        category: 'Protein Hewani',
        unit: 'Kg',
        today_price: 150000,
        yesterday_price: 150000,
        het_price: 140000,
    },
    {
        id: 12,
        name: 'Cabai Rawit Merah',
        category: 'Hortikultura Strategis',
        unit: 'Kg',
        today_price: 75333,
        yesterday_price: 76333,
        het_price: 57500,
    },
    {
        id: 13,
        name: 'Daging Ayam Ras',
        category: 'Protein Hewani',
        unit: 'Kg',
        today_price: 38667,
        yesterday_price: 38333,
        het_price: 40000,
    },
    {
        id: 14,
        name: 'Telur Ayam Ras',
        category: 'Protein Hewani',
        unit: 'Kg',
        today_price: 25167,
        yesterday_price: 25167,
        het_price: 27000,
    },
    {
        id: 15,
        name: 'Gula Konsumsi',
        category: 'Bahan Pokok Utama',
        unit: 'Kg',
        today_price: 18500,
        yesterday_price: 18500,
        het_price: 17500,
    },
    {
        id: 16,
        name: 'Minyak Goreng Kemasan',
        category: 'Minyak & Lemak',
        unit: 'Liter',
        today_price: 23750,
        yesterday_price: 23542,
        het_price: null,
    },
    {
        id: 17,
        name: 'Minyak Goreng Curah',
        category: 'Minyak & Lemak',
        unit: 'Liter',
        today_price: 16400,
        yesterday_price: 16400,
        het_price: null,
    },
    {
        id: 18,
        name: 'Tepung Terigu (Curah)',
        category: 'Olahan Tepung',
        unit: 'Kg',
        today_price: 8667,
        yesterday_price: 8833,
        het_price: null,
    },
    {
        id: 19,
        name: 'Minyakita',
        category: 'Minyak & Lemak',
        unit: 'Liter',
        today_price: 15700,
        yesterday_price: 15700,
        het_price: 15700,
    },
    {
        id: 20,
        name: 'Tepung Terigu Kemasan',
        category: 'Olahan Tepung',
        unit: 'Kg',
        today_price: 12500,
        yesterday_price: 12500,
        het_price: null,
    },
    {
        id: 21,
        name: 'Ikan Kembung',
        category: 'Hasil Perikanan',
        unit: 'Kg',
        today_price: 50000,
        yesterday_price: 50000,
        het_price: null,
    },
    {
        id: 22,
        name: 'Ikan Tongkol',
        category: 'Hasil Perikanan',
        unit: 'Kg',
        today_price: 33667,
        yesterday_price: 33667,
        het_price: null,
    },
    {
        id: 23,
        name: 'Ikan Bandeng',
        category: 'Hasil Perikanan',
        unit: 'Kg',
        today_price: 33667,
        yesterday_price: 33667,
        het_price: null,
    },
    {
        id: 24,
        name: 'Garam Konsumsi',
        category: 'Bumbu & Garam',
        unit: 'Kg',
        today_price: 12000,
        yesterday_price: 12000,
        het_price: null,
    },
    {
        id: 25,
        name: 'Daging Kerbau Beku (Impor Luar Negeri)',
        category: 'Protein Hewani',
        unit: 'Kg',
        today_price: 80000,
        yesterday_price: 80000,
        het_price: 80000,
    },
];

export default function HargaKonsumen({
    consumerCommodities,
    markets = [],
    selectedMarketId = 1,
    selectedMarketName = 'Pasar Daerah Indramayu',
    selectedDate = '',
    prevDate = '',
    minDate = '',
    maxDate = '',
    marketName = 'Pasar Daerah Indramayu',
    latestDate,
}: HargaKonsumenProps = {}) {
    const { auth } = usePage().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [hargaMenuOpen, setHargaMenuOpen] = useState(false);
    const [mobileHargaOpen, setMobileHargaOpen] = useState(true);
    const hargaMenuRef = useRef<HTMLDivElement>(null);

    // Filter states
    const [currentMarketId, setCurrentMarketId] = useState<number>(
        selectedMarketId || 1,
    );
    const [currentDate, setCurrentDate] = useState<string>(
        selectedDate || (latestDate ?? ''),
    );
    const [isFiltering, setIsFiltering] = useState(false);

    // Sync with props when server returns updated props
    useEffect(() => {
        if (selectedMarketId) {
            setCurrentMarketId(selectedMarketId);
        }
    }, [selectedMarketId]);

    useEffect(() => {
        if (selectedDate) {
            setCurrentDate(selectedDate);
        }
    }, [selectedDate]);

    // Handle filter changes via Inertia
    const applyFilter = (newMarketId: number, newDate: string) => {
        setIsFiltering(true);
        router.get(
            '/harga-konsumen',
            {
                market_id: newMarketId,
                date: newDate,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => {
                    setIsFiltering(false);
                    setConsumerSlide(0); // reset slide to first page
                },
            },
        );
    };

    const handleMarketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = Number(e.target.value);
        setCurrentMarketId(val);
        applyFilter(val, currentDate);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCurrentDate(val);
        if (val) {
            applyFilter(currentMarketId, val);
        }
    };

    // Format human readable date in Indonesian
    const formatIndoDate = (dateStr?: string) => {
        if (!dateStr) return '';
        try {
            const dateObj = new Date(dateStr + 'T00:00:00');
            return new Intl.DateTimeFormat('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }).format(dateObj);
        } catch {
            return dateStr;
        }
    };

    // 25 komoditas list from DB or fallback
    const commoditiesList = useMemo(() => {
        return consumerCommodities && consumerCommodities.length > 0
            ? consumerCommodities
            : DEFAULT_CONSUMER_COMMODITIES;
    }, [consumerCommodities]);

    // Slider state for 25 commodities (5 cols x 2 rows = 10 cards per slide)
    const [consumerSlide, setConsumerSlide] = useState(0);
    const [isSliderPlaying, setIsSliderPlaying] = useState(true);
    const [isSliderHovered, setIsSliderHovered] = useState(false);

    const totalConsumerSlides = Math.ceil(commoditiesList.length / 10); // 3 slides

    // Auto slider timer (5 seconds)
    useEffect(() => {
        if (!isSliderPlaying || isSliderHovered) return;
        const timer = setInterval(() => {
            setConsumerSlide((prev) => (prev + 1) % totalConsumerSlides);
        }, 5000);
        return () => clearInterval(timer);
    }, [isSliderPlaying, isSliderHovered, totalConsumerSlides]);

    // Close desktop dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                hargaMenuRef.current &&
                !hargaMenuRef.current.contains(event.target as Node)
            ) {
                setHargaMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(val);
    };

    // Sliced commodities for the active slide (10 commodities per slide: 5 cols x 2 rows)
    const currentSlideCommodities = useMemo(() => {
        const start = consumerSlide * 10;
        return commoditiesList.slice(start, start + 10);
    }, [consumerSlide, commoditiesList]);

    // Card styling and HET status calculation based on user requirements:
    // - Hijau: harga di bawah HET (today <= het)
    // - Putih: tidak ada HET
    // - Kuning: HET 1-10% (0% < diffPct <= 10%)
    // - Merah: di atas HET >10% (diffPct > 10%)
    const getCommodityHetInfo = (item: ConsumerCommodityItem) => {
        // 1. Apabila tidak ada HET: warna putih
        if (
            item.het_price === null ||
            item.het_price === undefined ||
            item.het_price <= 0 ||
            item.today_price === null
        ) {
            return {
                color: 'white' as const,
                hasHet: false,
                hetDiff: null,
                hetDiffPct: null,
                badgeText: 'Non-HET',
                badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                cardBgClass:
                    'bg-white border-slate-200/90 text-slate-900 hover:border-slate-300 hover:shadow-md',
                statusText: 'Tidak ada regulasi HET',
            };
        }

        const hetDiff = item.today_price - item.het_price;
        const hetDiffPct = (hetDiff / item.het_price) * 100;

        // 2. Apabila harga di bawah HET: card berwarna hijau (diff <= 0)
        if (hetDiff <= 0) {
            return {
                color: 'green' as const,
                hasHet: true,
                hetDiff,
                hetDiffPct,
                badgeText: hetDiff === 0 ? 'Sesuai HET' : 'Di Bawah HET',
                badgeClass:
                    'bg-emerald-100 text-emerald-800 border-emerald-300',
                cardBgClass:
                    'bg-emerald-50/75 border-emerald-300 text-emerald-950 hover:border-emerald-400 hover:shadow-md',
                statusText:
                    hetDiff === 0
                        ? 'Sesuai batas HET'
                        : `${formatCurrency(Math.abs(hetDiff))} di bawah HET`,
            };
        }

        // 3. Apabila HET 1-10%: berwarna kuning (0% < hetDiffPct <= 10%)
        if (hetDiffPct <= 10) {
            return {
                color: 'yellow' as const,
                hasHet: true,
                hetDiff,
                hetDiffPct,
                badgeText: `HET +${hetDiffPct.toFixed(1)}%`,
                badgeClass:
                    'bg-amber-100 text-amber-800 border-amber-300',
                cardBgClass:
                    'bg-amber-50/85 border-amber-300 text-amber-950 hover:border-amber-400 hover:shadow-md',
                statusText: 'Waspada: di atas HET 1-10%',
            };
        }

        // 4. Apabila di atas HET >10%: berwarna merah
        return {
            color: 'red' as const,
            hasHet: true,
            hetDiff,
            hetDiffPct,
            badgeText: `HET +${hetDiffPct.toFixed(1)}%`,
            badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
            cardBgClass:
                'bg-rose-50/85 border-rose-300 text-rose-950 hover:border-rose-400 hover:shadow-md',
            statusText: 'Lonjakan: di atas HET >10%',
        };
    };

    // Calculation for price difference compared to yesterday
    const getYesterdayDiff = (item: ConsumerCommodityItem) => {
        if (item.today_price === null || item.yesterday_price === null) {
            return {
                diff: null,
                pct: null,
                type: 'none' as const,
                label: 'Data belum ada',
            };
        }

        const diff = item.today_price - item.yesterday_price;
        const pct =
            item.yesterday_price > 0
                ? (diff / item.yesterday_price) * 100
                : 0;

        if (diff > 0) {
            return {
                diff,
                pct,
                type: 'up' as const,
                label: `+${formatCurrency(diff)} (+${pct.toFixed(1)}%)`,
            };
        }
        if (diff < 0) {
            return {
                diff,
                pct,
                type: 'down' as const,
                label: `-${formatCurrency(Math.abs(diff))} (${pct.toFixed(1)}%)`,
            };
        }
        return {
            diff: 0,
            pct: 0,
            type: 'stable' as const,
            label: 'Rp 0 (0,0%) Tetap',
        };
    };

    return (
        <>
            <Head>
                <title>Harga Konsumen 25 Komoditi - DKPP Indramayu</title>
                <meta
                    name="description"
                    content="Pemantauan harga konsumen 25 komoditas pangan pokok harian di pasar eceran Kabupaten Indramayu."
                />
            </Head>

            <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] antialiased selection:bg-[#006565] selection:text-white">
                {/* ============================================================== */}
                {/* 1. TOP NAVBAR (MENU HARGA PANGAN: HARGA KONSUMEN & PRODUSEN)   */}
                {/* ============================================================== */}
                <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all">
                    <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        {/* Logo & Brand Identity */}
                        <Link href="/harga-konsumen" className="flex items-center gap-3">
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
                        </Link>

                        {/* Desktop Navigation Links */}
                        <nav className="hidden items-center gap-1 md:flex">
                            {/* Dropdown Menu Harga Pangan */}
                            <div className="relative" ref={hargaMenuRef}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setHargaMenuOpen(!hargaMenuOpen)
                                    }
                                    onMouseEnter={() => setHargaMenuOpen(true)}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-50/70 px-4 py-2 text-xs font-bold text-[#006565] transition-colors hover:bg-emerald-100 lg:text-sm"
                                    aria-expanded={hargaMenuOpen}
                                >
                                    <TrendingUp className="h-4 w-4 text-[#006565]" />
                                    <span>Harga Pangan</span>
                                    <ChevronDown
                                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                            hargaMenuOpen
                                                ? 'rotate-180 text-[#006565]'
                                                : ''
                                        }`}
                                    />
                                </button>

                                {hargaMenuOpen && (
                                    <div
                                        onMouseLeave={() =>
                                            setHargaMenuOpen(false)
                                        }
                                        className="absolute left-0 mt-1.5 w-64 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl ring-1 ring-slate-900/5 transition-all z-50 animate-in fade-in slide-in-from-top-1"
                                    >
                                        <Link
                                            href="/harga-konsumen"
                                            onClick={() =>
                                                setHargaMenuOpen(false)
                                            }
                                            className="flex items-start gap-3 rounded-xl p-2.5 bg-emerald-50/80 text-emerald-950 transition-colors group"
                                        >
                                            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#006565] text-white">
                                                <Store className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-[#006565]">
                                                    Harga Konsumen
                                                </div>
                                                <div className="text-[11px] text-slate-500">
                                                    Card 25 komoditi &amp; status HET
                                                </div>
                                            </div>
                                        </Link>
                                        <Link
                                            href="/harga-produsen"
                                            onClick={() =>
                                                setHargaMenuOpen(false)
                                            }
                                            className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-amber-50/70 group"
                                        >
                                            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 group-hover:bg-[#006565] group-hover:text-white transition-colors">
                                                <Wheat className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-900 group-hover:text-[#006565]">
                                                    Harga Produsen
                                                </div>
                                                <div className="text-[11px] text-slate-500">
                                                    Tingkat petani &amp; produsen pangan
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                )}
                            </div>
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
                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setMobileHargaOpen(!mobileHargaOpen)
                                        }
                                        className="flex w-full items-center justify-between px-2 py-1.5 text-sm font-bold text-slate-800"
                                    >
                                        <span className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-[#006565]" />
                                            <span>Harga Pangan</span>
                                        </span>
                                        <ChevronDown
                                            className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                                                mobileHargaOpen
                                                    ? 'rotate-180 text-[#006565]'
                                                    : ''
                                            }`}
                                        />
                                    </button>
                                    {mobileHargaOpen && (
                                        <div className="mt-1 space-y-1 border-t border-slate-200/60 pt-2 pl-3">
                                            <Link
                                                href="/harga-konsumen"
                                                onClick={() =>
                                                    setMobileMenuOpen(false)
                                                }
                                                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-bold text-[#006565] bg-emerald-50/80"
                                            >
                                                <Store className="h-3.5 w-3.5 text-emerald-600" />
                                                <span>Harga Konsumen (25 Komoditi)</span>
                                            </Link>
                                            <Link
                                                href="/harga-produsen"
                                                onClick={() =>
                                                    setMobileMenuOpen(false)
                                                }
                                                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white hover:text-[#006565]"
                                            >
                                                <Wheat className="h-3.5 w-3.5 text-amber-600" />
                                                <span>Harga Produsen</span>
                                            </Link>
                                        </div>
                                    )}
                                </div>

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
                {/* 2. HARGA KONSUMEN - 25 KOMODITI CARD SLIDER                    */}
                {/* ============================================================== */}
                <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
                    {/* Header Banner */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-[#006565]/10 px-3.5 py-1.5 text-xs font-bold tracking-wider text-[#006565] uppercase">
                                <Store className="h-3.5 w-3.5" />
                                <span>Pusat Data Harga Pangan</span>
                            </div>
                            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                                Harga Konsumen 25 Komoditi
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-600 sm:text-base">
                                Monitoring pergerakan harga eceran harian 25 komoditas pangan pokok, perbandingan harga terhadap hari kemarin, dan evaluasi kepatuhan terhadap Harga Eceran Tertinggi (HET).
                            </p>
                        </div>

                        {/* Location & Date Calendar Filter */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-stretch md:self-end bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 shadow-sm">
                            {/* Market Selector */}
                            <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-2 text-xs font-semibold text-slate-700">
                                <Store className="h-4 w-4 shrink-0 text-[#006565]" />
                                <div className="flex flex-col">
                                    <label
                                        htmlFor="market-select"
                                        className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                                    >
                                        Pilih Pasar
                                    </label>
                                    <select
                                        id="market-select"
                                        value={currentMarketId}
                                        onChange={handleMarketChange}
                                        disabled={isFiltering}
                                        className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer py-0.5"
                                    >
                                        {markets.length > 0 ? (
                                            markets.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name}
                                                </option>
                                            ))
                                        ) : (
                                            <option value={currentMarketId}>
                                                {selectedMarketName || marketName}
                                            </option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* Date Calendar Picker */}
                            <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-2 text-xs font-semibold text-slate-700">
                                <Calendar className="h-4 w-4 shrink-0 text-[#006565]" />
                                <div className="flex flex-col">
                                    <label
                                        htmlFor="date-select"
                                        className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                                    >
                                        Tanggal Data
                                    </label>
                                    <input
                                        id="date-select"
                                        type="date"
                                        value={currentDate}
                                        min={minDate || undefined}
                                        max={maxDate || undefined}
                                        onChange={handleDateChange}
                                        disabled={isFiltering}
                                        className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer py-0.5"
                                    />
                                </div>
                            </div>

                            {/* Loading Indicator when filtering */}
                            {isFiltering && (
                                <div className="flex items-center justify-center px-2 py-1 text-xs text-[#006565]">
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Active Filter Info Bar */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 bg-emerald-50/60 border border-emerald-100 rounded-xl px-4 py-2">
                        <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-[#006565]" />
                            <span>
                                Menampilkan data harga komoditas di{' '}
                                <strong className="text-slate-800">
                                    {markets.find((m) => m.id === currentMarketId)?.name || selectedMarketName || marketName}
                                </strong>{' '}
                                per tanggal{' '}
                                <strong className="text-slate-800">
                                    {formatIndoDate(currentDate) || currentDate}
                                </strong>
                            </span>
                        </div>
                        {prevDate && (
                            <span className="text-[11px] text-slate-400">
                                (Perbandingan hari sebelumnya: {formatIndoDate(prevDate) || prevDate})
                            </span>
                        )}
                    </div>

                    {/* Color Legend Bar */}
                    <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                <Info className="h-4 w-4 text-[#006565]" />
                                <span>Keterangan Status &amp; Warna Card:</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 border border-emerald-600 shadow-xs" />
                                    <span className="font-bold text-emerald-950">Hijau:</span>
                                    <span className="text-slate-600">Di Bawah / Sesuai HET</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-3.5 w-3.5 rounded-full bg-white border-2 border-slate-400 shadow-xs" />
                                    <span className="font-bold text-slate-800">Putih:</span>
                                    <span className="text-slate-600">Tidak Ada HET</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-3.5 w-3.5 rounded-full bg-amber-400 border border-amber-500 shadow-xs" />
                                    <span className="font-bold text-amber-950">Kuning:</span>
                                    <span className="text-slate-600">HET 1% - 10%</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-3.5 w-3.5 rounded-full bg-rose-500 border border-rose-600 shadow-xs" />
                                    <span className="font-bold text-rose-950">Merah:</span>
                                    <span className="text-slate-600">Di Atas HET &gt;10%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Slider Controls Bar */}
                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
                        {/* Slide Switchers */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">Halaman:</span>
                            <div className="flex items-center gap-1.5">
                                {Array.from({ length: totalConsumerSlides }).map((_, idx) => {
                                    const startItem = idx * 10 + 1;
                                    const endItem = Math.min((idx + 1) * 10, commoditiesList.length);
                                    const isActive = consumerSlide === idx;
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setConsumerSlide(idx)}
                                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                                isActive
                                                    ? 'bg-[#006565] text-white shadow-md shadow-[#006565]/20 ring-2 ring-[#006565]'
                                                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            Slide {idx + 1} ({startItem}-{endItem})
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Play/Pause & Prev/Next Navigation */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                                type="button"
                                onClick={() => setIsSliderPlaying(!isSliderPlaying)}
                                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                                    isSliderPlaying
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                                title={
                                    isSliderPlaying
                                        ? 'Klik untuk jeda slider otomatis'
                                        : 'Klik untuk memutar slider otomatis'
                                }
                            >
                                {isSliderPlaying ? (
                                    <>
                                        <Pause className="h-3.5 w-3.5" />
                                        <span>Otomatis (5s)</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-3.5 w-3.5" />
                                        <span>Jeda</span>
                                    </>
                                )}
                            </button>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setConsumerSlide(
                                            (prev) =>
                                                (prev - 1 + totalConsumerSlides) %
                                                totalConsumerSlides,
                                        )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs transition-colors hover:border-[#006565] hover:text-[#006565]"
                                    aria-label="Slide sebelumnya"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setConsumerSlide(
                                            (prev) =>
                                                (prev + 1) %
                                                totalConsumerSlides,
                                        )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs transition-colors hover:border-[#006565] hover:text-[#006565]"
                                    aria-label="Slide berikutnya"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Cards Grid: 5 Kolom x 2 Baris (10 card per slide) */}
                    <div
                        className="mt-6"
                        onMouseEnter={() => setIsSliderHovered(true)}
                        onMouseLeave={() => setIsSliderHovered(false)}
                    >
                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                            {currentSlideCommodities.map((item) => {
                                const hetInfo = getCommodityHetInfo(item);
                                const yestInfo = getYesterdayDiff(item);

                                return (
                                    <div
                                        key={item.id}
                                        className={`group relative flex flex-col justify-between rounded-2xl border-2 p-3.5 transition-all duration-200 shadow-xs ${hetInfo.cardBgClass}`}
                                    >
                                        {/* Card Top: Category & HET Pill Badge */}
                                        <div>
                                            <div className="mb-2 flex items-center justify-between gap-1">
                                                <span className="truncate text-[10px] font-bold tracking-wider text-slate-500 uppercase max-w-[105px]">
                                                    {item.category || `Komoditas #${item.id}`}
                                                </span>
                                                <span
                                                    className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${hetInfo.badgeClass}`}
                                                >
                                                    {hetInfo.badgeText}
                                                </span>
                                            </div>

                                            {/* Commodity Name */}
                                            <h4
                                                className="line-clamp-1 text-sm font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-[#006565]"
                                                title={item.name}
                                            >
                                                {item.name}
                                            </h4>

                                            {/* Today's Price */}
                                            <div className="mt-2.5 flex items-baseline gap-1">
                                                <span className="text-lg font-black tracking-tight text-slate-900">
                                                    {item.today_price !== null
                                                        ? formatCurrency(item.today_price)
                                                        : '-'}
                                                </span>
                                                <span className="text-xs font-semibold text-slate-500">
                                                    /{item.unit}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Bottom: Differences */}
                                        <div className="mt-3.5 space-y-1.5 border-t border-slate-200/60 pt-2.5 text-xs">
                                            {/* Kenaikan/penurunan terhadap hari kemarin */}
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="font-medium text-slate-500">
                                                    vs Kemarin:
                                                </span>
                                                <span
                                                    className={`inline-flex items-center gap-0.5 font-bold ${
                                                        yestInfo.type === 'up'
                                                            ? 'text-rose-600'
                                                            : yestInfo.type === 'down'
                                                            ? 'text-emerald-700'
                                                            : 'text-slate-600'
                                                    }`}
                                                >
                                                    {yestInfo.type === 'up' && (
                                                        <ArrowUp className="h-3 w-3 stroke-[2.5]" />
                                                    )}
                                                    {yestInfo.type === 'down' && (
                                                        <ArrowDown className="h-3 w-3 stroke-[2.5]" />
                                                    )}
                                                    {yestInfo.type === 'stable' && (
                                                        <Minus className="h-3 w-3 stroke-[2.5]" />
                                                    )}
                                                    <span>{yestInfo.label}</span>
                                                </span>
                                            </div>

                                            {/* Kenaikan/penurunan terhadap HET */}
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="font-medium text-slate-500">
                                                    vs HET:
                                                </span>
                                                {hetInfo.hasHet && item.het_price !== null ? (
                                                    <div className="text-right">
                                                        <span
                                                            className={`font-bold ${
                                                                hetInfo.color === 'green'
                                                                    ? 'text-emerald-700'
                                                                    : hetInfo.color === 'yellow'
                                                                    ? 'text-amber-700'
                                                                    : 'text-rose-600'
                                                            }`}
                                                        >
                                                            {hetInfo.hetDiff! > 0
                                                                ? `+${formatCurrency(hetInfo.hetDiff!)} (+${hetInfo.hetDiffPct!.toFixed(1)}%)`
                                                                : hetInfo.hetDiff! < 0
                                                                ? `-${formatCurrency(Math.abs(hetInfo.hetDiff!))} (${hetInfo.hetDiffPct!.toFixed(1)}%)`
                                                                : 'Sesuai HET'}
                                                        </span>
                                                        <div className="text-[10px] font-normal text-slate-400">
                                                            HET: {formatCurrency(item.het_price)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="font-semibold text-slate-400 italic">
                                                        Tidak ada HET
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Slider Dots Indicator */}
                    <div className="mt-8 flex items-center justify-center gap-2">
                        {Array.from({ length: totalConsumerSlides }).map((_, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setConsumerSlide(idx)}
                                className={`h-2.5 rounded-full transition-all ${
                                    consumerSlide === idx
                                        ? 'w-8 bg-[#006565]'
                                        : 'w-2.5 bg-slate-200 hover:bg-slate-300'
                                }`}
                                aria-label={`Pindah ke slide ${idx + 1}`}
                            />
                        ))}
                    </div>

                    {/* Switch to Harga Produsen Promo Card */}
                    <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                <Wheat className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    Ingin Melihat Harga di Tingkat Petani &amp; Penggilingan?
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Kunjungi halaman Harga Produsen untuk memantau harga Gabah Kering Panen (GKP), Beras Giling, dan komoditas sentra lainnya.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/harga-produsen"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 transition-colors shrink-0"
                        >
                            <span>Buka Halaman Harga Produsen</span>
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </main>

                {/* ============================================================== */}
                {/* 3. FOOTER                                                      */}
                {/* ============================================================== */}
                <footer className="border-t border-slate-200 bg-white text-slate-600">
                    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#006565] text-white">
                                    <Wheat className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-extrabold text-slate-900">
                                        DKPP KABUPATEN INDRAMAYU
                                    </span>
                                    <span className="text-[10px] font-semibold tracking-wider text-[#006565] uppercase">
                                        Dinas Ketahanan Pangan dan Pertanian
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
                                <Link href="/harga-konsumen" className="text-[#006565] font-bold">
                                    Harga Konsumen
                                </Link>
                                <span className="text-slate-300">•</span>
                                <Link href="/harga-produsen" className="hover:text-[#006565] transition-colors">
                                    Harga Produsen
                                </Link>
                                <span className="text-slate-300">•</span>
                                <Link href={login()} className="hover:text-[#006565] transition-colors">
                                    Portal Petugas
                                </Link>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col items-center justify-between border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row">
                            <div>
                                &copy; 2026 Dinas Ketahanan Pangan dan Pertanian Kabupaten Indramayu. Lumbung Padi Nasional.
                            </div>
                            <div className="mt-2 font-medium sm:mt-0">
                                Sistem Informasi Ketahanan Pangan Terpadu
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}

