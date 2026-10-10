import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ChevronDown,
    Clock,
    Layers,
    Menu,
    Scale,
    Store,
    TrendingUp,
    Wheat,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';

export interface ProducerCommodity {
    key: string;
    name: string;
    short_name: string;
    category: string;
    unit: string;
    order: number;
    hap: number;
    hap_label: string;
    description: string;
    today_price: number | null;
    yesterday_price: number | null;
    diff_hap: number | null;
    diff_hap_percentage: number | null;
    status: 'above' | 'equal' | 'below' | 'not_recorded';
    diff_yesterday: number | null;
    diff_yesterday_percentage: number | null;
    change_type: 'up' | 'down' | 'stable';
}

export interface HargaProdusenProps {
    marketName?: string;
    selectedDate?: string;
    latestDate?: string;
    prevDate?: string | null;
    minDate?: string;
    maxDate?: string;
    commodities?: ProducerCommodity[];
}

export default function HargaProdusen({
    marketName = 'Kabupaten Indramayu',
    selectedDate,
    latestDate,
    prevDate,
    minDate = '2026-01-01',
    maxDate,
    commodities = [],
}: HargaProdusenProps = {}) {
    const { auth } = usePage().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [hargaMenuOpen, setHargaMenuOpen] = useState(false);
    const [mobileHargaOpen, setMobileHargaOpen] = useState(true);
    const [filterDate, setFilterDate] = useState(selectedDate || latestDate || new Date().toISOString().split('T')[0]);
    const hargaMenuRef = useRef<HTMLDivElement>(null);

    const handleDateChange = (newDate: string) => {
        setFilterDate(newDate);
        router.get('/harga-produsen', { date: newDate }, { preserveState: true, preserveScroll: true });
    };

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

    return (
        <>
            <Head>
                <title>Harga Produsen Pangan - DKPP Indramayu</title>
                <meta
                    name="description"
                    content="Monitoring harga komoditas pangan di tingkat petani, penggilingan padi, dan peternak di wilayah Kabupaten Indramayu."
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
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-600/30 bg-amber-50/70 px-4 py-2 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-100 lg:text-sm"
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
                                            className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-emerald-50/70 group"
                                        >
                                            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-[#006565] group-hover:text-white transition-colors">
                                                <Store className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-900 group-hover:text-[#006565]">
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
                                            className="flex items-start gap-3 rounded-xl p-2.5 bg-amber-50/80 text-amber-950 transition-colors group"
                                        >
                                            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#006565] text-white">
                                                <Wheat className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-[#006565]">
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
                                                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white hover:text-[#006565]"
                                            >
                                                <Store className="h-3.5 w-3.5 text-emerald-600" />
                                                <span>Harga Konsumen (25 Komoditi)</span>
                                            </Link>
                                            <Link
                                                href="/harga-produsen"
                                                onClick={() =>
                                                    setMobileMenuOpen(false)
                                                }
                                                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-bold text-[#006565] bg-amber-50/80"
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
                {/* 2. MAIN HARGA PRODUSEN CONTENT                                 */}
                {/* ============================================================== */}
                <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
                    {/* Header Banner */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3.5 py-1 text-xs font-bold tracking-wider text-amber-800 uppercase">
                                <Wheat className="h-3.5 w-3.5 text-amber-600" />
                                <span>Tingkat Produsen &amp; Sentra Tani</span>
                            </div>
                            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                                Harga Produsen Pangan Strategis
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-600 sm:text-base">
                                Monitoring harga transaksi di tingkat petani sawah, penggilingan padi, dan peternak se-Kabupaten Indramayu sebagai barometer pendapatan produsen pangan dan pasokan awal.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 self-start md:self-end">
                            <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-3.5 py-2 text-xs font-semibold text-amber-900 shrink-0 shadow-xs">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                                <span>Integrasi Sentra Pertanian &amp; Bapanas</span>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-xs">
                                <Clock className="h-3.5 w-3.5 text-slate-500" />
                                <span className="font-semibold text-slate-600">Pilih Tanggal:</span>
                                <input
                                    type="date"
                                    value={filterDate}
                                    min={minDate}
                                    max={maxDate}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="text-xs font-bold text-slate-800 bg-slate-50 rounded-lg px-2 py-1 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Produsen 6 Commodity Cards */}
                    {(() => {
                        const defaultCommodities: ProducerCommodity[] = [
                            {
                                key: 'gkp_petani',
                                name: 'GKP Tingkat Petani',
                                short_name: 'GKP Petani',
                                category: 'Gabah',
                                unit: 'Kg',
                                order: 1,
                                hap: 6000,
                                hap_label: 'HAP Bapanas',
                                description: 'Gabah Kering Panen di tingkat petani sawah',
                                today_price: 6800,
                                yesterday_price: 6750,
                                diff_hap: 800,
                                diff_hap_percentage: 13.3,
                                status: 'above',
                                diff_yesterday: 50,
                                diff_yesterday_percentage: 0.7,
                                change_type: 'up',
                            },
                            {
                                key: 'gkp_penggilingan',
                                name: 'GKP Tingkat Penggilingan',
                                short_name: 'GKP Penggilingan',
                                category: 'Gabah',
                                unit: 'Kg',
                                order: 2,
                                hap: 6200,
                                hap_label: 'HAP Bapanas',
                                description: 'Gabah Kering Panen di tingkat usaha penggilingan padi',
                                today_price: 7000,
                                yesterday_price: 6950,
                                diff_hap: 800,
                                diff_hap_percentage: 12.9,
                                status: 'above',
                                diff_yesterday: 50,
                                diff_yesterday_percentage: 0.7,
                                change_type: 'up',
                            },
                            {
                                key: 'gkg_penggilingan',
                                name: 'GKG Tingkat Penggilingan',
                                short_name: 'GKG Penggilingan',
                                category: 'Gabah',
                                unit: 'Kg',
                                order: 3,
                                hap: 7400,
                                hap_label: 'HAP Bapanas',
                                description: 'Gabah Kering Giling di tingkat usaha penggilingan padi',
                                today_price: 7900,
                                yesterday_price: 7850,
                                diff_hap: 500,
                                diff_hap_percentage: 6.8,
                                status: 'above',
                                diff_yesterday: 50,
                                diff_yesterday_percentage: 0.6,
                                change_type: 'up',
                            },
                            {
                                key: 'beras_medium_penggilingan',
                                name: 'Beras Medium Penggilingan',
                                short_name: 'Beras Medium Giling',
                                category: 'Beras',
                                unit: 'Kg',
                                order: 4,
                                hap: 12000,
                                hap_label: 'HAP Bapanas',
                                description: 'Beras Medium hasil produksi di tingkat penggilingan',
                                today_price: 12200,
                                yesterday_price: 12150,
                                diff_hap: 200,
                                diff_hap_percentage: 1.7,
                                status: 'above',
                                diff_yesterday: 50,
                                diff_yesterday_percentage: 0.4,
                                change_type: 'up',
                            },
                            {
                                key: 'beras_premium_penggilingan',
                                name: 'Beras Premium Penggilingan',
                                short_name: 'Beras Premium Giling',
                                category: 'Beras',
                                unit: 'Kg',
                                order: 5,
                                hap: 13900,
                                hap_label: 'HAP Bapanas',
                                description: 'Beras Premium hasil produksi di tingkat penggilingan',
                                today_price: 14200,
                                yesterday_price: 14100,
                                diff_hap: 300,
                                diff_hap_percentage: 2.2,
                                status: 'above',
                                diff_yesterday: 100,
                                diff_yesterday_percentage: 0.7,
                                change_type: 'up',
                            },
                            {
                                key: 'sapi_hidup',
                                name: 'Sapi Hidup',
                                short_name: 'Sapi Hidup Farm Gate',
                                category: 'Peternakan',
                                unit: 'Kg',
                                order: 6,
                                hap: 56000,
                                hap_label: 'HAP Farm Gate',
                                description: 'Sapi potong hidup di tingkat peternak / produsen',
                                today_price: 58000,
                                yesterday_price: 58000,
                                diff_hap: 2000,
                                diff_hap_percentage: 3.6,
                                status: 'above',
                                diff_yesterday: 0,
                                diff_yesterday_percentage: 0,
                                change_type: 'stable',
                            },
                        ];

                        const displayCommodities = commodities && commodities.length > 0 ? commodities : defaultCommodities;

                        return (
                            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {displayCommodities.map((comm) => (
                                    <div
                                        key={comm.key}
                                        className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between text-[11px] font-bold uppercase">
                                                <span className="text-amber-800 font-extrabold">{comm.category}</span>
                                                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-800 font-extrabold text-[10px]">
                                                    {comm.short_name}
                                                </span>
                                            </div>
                                            <h4 className="mt-2 text-base font-black text-slate-900">{comm.name}</h4>
                                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{comm.description}</p>
                                        </div>

                                        <div className="mt-4">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-black text-slate-900">
                                                    {comm.today_price ? `Rp ${comm.today_price.toLocaleString('id-ID')}` : 'Belum Terdata'}
                                                </span>
                                                {comm.today_price && (
                                                    <span className="text-xs font-semibold text-slate-500">/{comm.unit}</span>
                                                )}
                                            </div>

                                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                                                <span className="text-slate-500">{comm.hap_label}:</span>
                                                <span className="font-extrabold text-emerald-700">
                                                    Rp {comm.hap.toLocaleString('id-ID')} /{comm.unit}
                                                </span>
                                            </div>

                                            <div className="mt-2 flex items-center justify-between text-[11px]">
                                                <span className="text-slate-500">vs Kemarin:</span>
                                                {comm.today_price !== null && comm.yesterday_price !== null ? (
                                                    comm.change_type === 'up' ? (
                                                        <span className="font-bold text-rose-600">
                                                            +Rp {comm.diff_yesterday?.toLocaleString('id-ID')} (+{comm.diff_yesterday_percentage}%)
                                                        </span>
                                                    ) : comm.change_type === 'down' ? (
                                                        <span className="font-bold text-emerald-700">
                                                            -Rp {Math.abs(comm.diff_yesterday || 0).toLocaleString('id-ID')} ({comm.diff_yesterday_percentage}%)
                                                        </span>
                                                    ) : (
                                                        <span className="font-bold text-slate-500">Tetap (0%)</span>
                                                    )
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </div>

                                            <div className="mt-2 text-right">
                                                {comm.status === 'above' && (
                                                    <span className="inline-block rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 border border-amber-200">
                                                        Di Atas HAP (+Rp {comm.diff_hap?.toLocaleString('id-ID')})
                                                    </span>
                                                )}
                                                {comm.status === 'equal' && (
                                                    <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">
                                                        Sesuai HAP Bapanas
                                                    </span>
                                                )}
                                                {comm.status === 'below' && (
                                                    <span className="inline-block rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-extrabold text-rose-700 border border-rose-200">
                                                        Di Bawah HAP
                                                    </span>
                                                )}
                                                {comm.status === 'not_recorded' && (
                                                    <span className="inline-block rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-200">
                                                        Belum Dicatat
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

                    {/* Info Banner */}
                    <div className="mt-8 rounded-2xl border border-amber-200/80 bg-amber-50/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-200/80 text-amber-900">
                                <Scale className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">
                                    Harga Acuan Pembelian Pemerintah (HAP Produsen)
                                </h4>
                                <p className="text-xs text-slate-600">
                                    Menjamin kepastian harga batas bawah bagi petani &amp; peternak Indramayu sesuai regulasi Badan Pangan Nasional (Bapanas RI) No. 6/2023.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Switch to Harga Konsumen Promo Card */}
                    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <Store className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    Ingin Memantau Harga Konsumen 25 Komoditi?
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Lihat pergerakan harga eceran harian di pasar daerah dengan status warna kepatuhan HET dan perbandingan hari kemarin.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/harga-konsumen"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#006565] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#006565]/20 hover:bg-[#005252] transition-colors shrink-0"
                        >
                            <span>Buka Halaman Harga Konsumen</span>
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
                                <Link href="/harga-konsumen" className="hover:text-[#006565] transition-colors">
                                    Harga Konsumen
                                </Link>
                                <span className="text-slate-300">•</span>
                                <Link href="/harga-produsen" className="text-[#006565] font-bold">
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

