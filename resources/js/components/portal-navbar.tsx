import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ChevronDown,
    Layers,
    Menu,
    PieChart,
    ShieldCheck,
    Store,
    Wheat,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { dashboard, login, register } from '@/routes';

export type PortalActivePage = 'ikp' | 'harga-konsumen' | 'harga-produsen' | 'neraca-pangan' | 'pph';

interface PortalNavbarProps {
    activePage: PortalActivePage;
}

export default function PortalNavbar({ activePage }: PortalNavbarProps) {
    const { auth } = usePage<{ auth?: { user?: { name?: string; email?: string } } }>().props;

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [dropdownMenuOpen, setDropdownMenuOpen] = useState(false);
    const [mobileDataOpen, setMobileDataOpen] = useState(true);

    const dropdownMenuRef = useRef<HTMLDivElement>(null);

    // Close desktop dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownMenuRef.current &&
                !dropdownMenuRef.current.contains(event.target as Node)
            ) {
                setDropdownMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const isIkpActive = activePage === 'ikp';
    const isNeracaActive = activePage === 'neraca-pangan';
    const isPphActive = activePage === 'pph';
    const isHargaKonsumenActive = activePage === 'harga-konsumen';
    const isHargaProdusenActive = activePage === 'harga-produsen';
    const isAnyActive =
        isIkpActive ||
        isNeracaActive ||
        isPphActive ||
        isHargaKonsumenActive ||
        isHargaProdusenActive;

    return (
        <header className="sticky top-0 z-50 transition-all">
            {/* Top Accent Gradient Shimmer Line */}
            <div className="h-[2.5px] w-full bg-gradient-to-r from-emerald-500 via-[#006565] to-teal-400" />

            <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-xs dark:border-slate-800 dark:bg-slate-900/95">
                <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Logo & Brand Identity */}
                    <Link
                        href="/ikp"
                        className="group flex items-center gap-3 transition-transform"
                    >
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#006565] via-[#005555] to-[#003838] text-white shadow-md shadow-[#006565]/25 ring-1 ring-white/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-[#006565]/35">
                            <Wheat className="h-6 w-6 stroke-[2.2] text-emerald-100 transition-transform group-hover:rotate-6" />
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900">
                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <span className="text-base font-black tracking-tight text-slate-900 transition-colors group-hover:text-[#006565] sm:text-lg dark:text-white dark:group-hover:text-emerald-400">
                                    DKPP INDRAMAYU
                                </span>
                                <span className="hidden sm:inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black tracking-wider text-[#006565] border border-emerald-500/20 uppercase dark:text-emerald-400 dark:border-emerald-500/30">
                                    Satu Data
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-[#006565] dark:text-emerald-400">
                                <span>Lumbung Padi Nasional</span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="font-semibold text-slate-400 lowercase dark:text-slate-500">
                                    portal pangan
                                </span>
                            </div>
                        </div>
                    </Link>

                    {/* Desktop Navigation Links Island */}
                    <nav className="hidden items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1.5 backdrop-blur-md md:flex dark:border-slate-800 dark:bg-slate-800/80">
                        {/* Dropdown Menu: Data Pangan */}
                        <div className="relative" ref={dropdownMenuRef}>
                            <button
                                type="button"
                                onClick={() => setDropdownMenuOpen(!dropdownMenuOpen)}
                                onMouseEnter={() => setDropdownMenuOpen(true)}
                                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                                    isAnyActive || dropdownMenuOpen
                                        ? 'bg-white text-[#006565] shadow-xs ring-1 ring-slate-200/80 dark:bg-slate-900 dark:text-emerald-400 dark:ring-slate-700'
                                        : 'text-slate-700 hover:text-[#006565] hover:bg-white/70 dark:text-slate-300 dark:hover:bg-slate-900/60 dark:hover:text-white'
                                }`}
                                aria-expanded={dropdownMenuOpen}
                            >
                                <Layers className="h-4 w-4 text-[#006565] dark:text-emerald-400" />
                                <span>Data Pangan</span>
                                <ChevronDown
                                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                        dropdownMenuOpen
                                            ? 'rotate-180 text-[#006565] dark:text-emerald-400'
                                            : 'text-slate-400'
                                    }`}
                                />
                            </button>

                            {dropdownMenuOpen && (
                                <div
                                    onMouseLeave={() => setDropdownMenuOpen(false)}
                                    className="absolute left-0 mt-2 w-80 rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-slate-900/5 transition-all z-50 animate-in fade-in slide-in-from-top-2 duration-200 dark:border-slate-700 dark:bg-slate-900/95"
                                >
                                    <div className="px-3 pt-2 pb-1 text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                        Pilih Data &amp; Pemantauan Pangan
                                    </div>

                                    {/* Submenu 1: IKP */}
                                    <Link
                                        href="/ikp"
                                        onClick={() => setDropdownMenuOpen(false)}
                                        className={`group flex items-start gap-3 rounded-xl p-2.5 transition-all ${
                                            isIkpActive
                                                ? 'bg-gradient-to-r from-emerald-50/90 to-teal-50/40 text-slate-900 border border-emerald-500/25 dark:from-emerald-950/40 dark:to-teal-950/20 dark:text-white dark:border-emerald-500/30'
                                                : 'hover:bg-slate-50 border border-transparent dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <div
                                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs transition-colors ${
                                                isIkpActive
                                                    ? 'bg-gradient-to-br from-[#006565] to-[#004e4e] text-white'
                                                    : 'bg-emerald-100 text-[#006565] group-hover:bg-[#006565] group-hover:text-white dark:bg-slate-800 dark:text-emerald-400'
                                            }`}
                                        >
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`text-xs font-bold ${
                                                        isIkpActive
                                                            ? 'text-[#006565] dark:text-emerald-400'
                                                            : 'text-slate-800 group-hover:text-[#006565] dark:text-slate-200 dark:group-hover:text-emerald-400'
                                                    }`}
                                                >
                                                    IKP
                                                </span>
                                                {isIkpActive && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                                        Aktif
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-[11px] text-slate-500 leading-tight dark:text-slate-400">
                                                Indeks Ketahanan Pangan Kabupaten
                                            </p>
                                        </div>
                                    </Link>

                                    {/* Submenu 2: Neraca */}
                                    <Link
                                        href="/neraca-pangan"
                                        onClick={() => setDropdownMenuOpen(false)}
                                        className={`group mt-1 flex items-start gap-3 rounded-xl p-2.5 transition-all ${
                                            isNeracaActive
                                                ? 'bg-gradient-to-r from-teal-50/90 to-emerald-50/40 text-slate-900 border border-teal-500/25 dark:from-teal-950/40 dark:to-emerald-950/20 dark:text-white dark:border-teal-500/30'
                                                : 'hover:bg-slate-50 border border-transparent dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <div
                                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs transition-colors ${
                                                isNeracaActive
                                                    ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white'
                                                    : 'bg-teal-100 text-teal-800 group-hover:bg-teal-600 group-hover:text-white dark:bg-slate-800 dark:text-teal-400'
                                            }`}
                                        >
                                            <Layers className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`text-xs font-bold ${
                                                        isNeracaActive
                                                            ? 'text-teal-800 dark:text-teal-400'
                                                            : 'text-slate-800 group-hover:text-teal-800 dark:text-slate-200 dark:group-hover:text-teal-400'
                                                    }`}
                                                >
                                                    Neraca
                                                </span>
                                                {isNeracaActive && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-1.5 py-0.5 text-[9px] font-extrabold text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse" />
                                                        Aktif
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-[11px] text-slate-500 leading-tight dark:text-slate-400">
                                                Neraca Pangan 11 komoditas bulanan
                                            </p>
                                        </div>
                                    </Link>

                                    {/* Submenu 3: PPH */}
                                    <Link
                                        href="/pph"
                                        onClick={() => setDropdownMenuOpen(false)}
                                        className={`group mt-1 flex items-start gap-3 rounded-xl p-2.5 transition-all ${
                                            isPphActive
                                                ? 'bg-gradient-to-r from-cyan-50/90 to-teal-50/40 text-slate-900 border border-cyan-500/25 dark:from-cyan-950/40 dark:to-teal-950/20 dark:text-white dark:border-cyan-500/30'
                                                : 'hover:bg-slate-50 border border-transparent dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <div
                                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs transition-colors ${
                                                isPphActive
                                                    ? 'bg-gradient-to-br from-[#006565] to-cyan-700 text-white'
                                                    : 'bg-cyan-100 text-cyan-800 group-hover:bg-[#006565] group-hover:text-white dark:bg-slate-800 dark:text-cyan-400'
                                            }`}
                                        >
                                            <PieChart className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`text-xs font-bold ${
                                                        isPphActive
                                                            ? 'text-[#006565] dark:text-cyan-400'
                                                            : 'text-slate-800 group-hover:text-[#006565] dark:text-slate-200 dark:group-hover:text-cyan-400'
                                                    }`}
                                                >
                                                    PPH
                                                </span>
                                                {isPphActive && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                                        Aktif
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-[11px] text-slate-500 leading-tight dark:text-slate-400">
                                                Pola Pangan Harapan &amp; mutu konsumsi
                                            </p>
                                        </div>
                                    </Link>

                                    {/* Submenu 4: Harga Konsumen */}
                                    <Link
                                        href="/harga-konsumen"
                                        onClick={() => setDropdownMenuOpen(false)}
                                        className={`group mt-1 flex items-start gap-3 rounded-xl p-2.5 transition-all ${
                                            isHargaKonsumenActive
                                                ? 'bg-gradient-to-r from-emerald-50/90 to-teal-50/40 text-slate-900 border border-emerald-500/25 dark:from-emerald-950/40 dark:to-teal-950/20 dark:text-white dark:border-emerald-500/30'
                                                : 'hover:bg-slate-50 border border-transparent dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <div
                                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs transition-colors ${
                                                isHargaKonsumenActive
                                                    ? 'bg-gradient-to-br from-[#006565] to-[#004e4e] text-white'
                                                    : 'bg-emerald-100 text-[#006565] group-hover:bg-[#006565] group-hover:text-white dark:bg-slate-800 dark:text-emerald-400'
                                            }`}
                                        >
                                            <Store className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`text-xs font-bold ${
                                                        isHargaKonsumenActive
                                                            ? 'text-[#006565] dark:text-emerald-400'
                                                            : 'text-slate-800 group-hover:text-[#006565] dark:text-slate-200 dark:group-hover:text-emerald-400'
                                                    }`}
                                                >
                                                    Harga Konsumen
                                                </span>
                                                {isHargaKonsumenActive && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                                        Aktif
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-[11px] text-slate-500 leading-tight dark:text-slate-400">
                                                25 Komoditi eceran harian &amp; status HET
                                            </p>
                                        </div>
                                    </Link>

                                    {/* Submenu 5: Harga Produsen */}
                                    <Link
                                        href="/harga-produsen"
                                        onClick={() => setDropdownMenuOpen(false)}
                                        className={`group mt-1 flex items-start gap-3 rounded-xl p-2.5 transition-all ${
                                            isHargaProdusenActive
                                                ? 'bg-gradient-to-r from-amber-50/90 to-yellow-50/40 text-slate-900 border border-amber-500/25 dark:from-amber-950/40 dark:to-yellow-950/20 dark:text-white dark:border-amber-500/30'
                                                : 'hover:bg-slate-50 border border-transparent dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <div
                                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs transition-colors ${
                                                isHargaProdusenActive
                                                    ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                                                    : 'bg-amber-100 text-amber-800 group-hover:bg-amber-600 group-hover:text-white dark:bg-slate-800 dark:text-amber-400'
                                            }`}
                                        >
                                            <Wheat className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`text-xs font-bold ${
                                                        isHargaProdusenActive
                                                            ? 'text-amber-800 dark:text-amber-400'
                                                            : 'text-slate-800 group-hover:text-amber-800 dark:text-slate-200 dark:group-hover:text-amber-400'
                                                    }`}
                                                >
                                                    Harga Produsen
                                                </span>
                                                {isHargaProdusenActive && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-900 dark:bg-amber-900/60 dark:text-amber-300">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
                                                        Aktif
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-[11px] text-slate-500 leading-tight dark:text-slate-400">
                                                Tingkat petani, peternak &amp; penggilingan
                                            </p>
                                        </div>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </nav>

                    {/* Action Buttons & Status (Desktop) */}
                    <div className="hidden items-center gap-3 md:flex">
                        {/* Live Status Badge */}
                        <div className="hidden xl:inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50/70 px-3 py-1.5 text-[11px] font-bold text-[#006565] dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                            </span>
                            <span>Live Monitoring</span>
                        </div>

                        {auth?.user ? (
                            <div className="flex items-center gap-2">
                                <div className="hidden lg:flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-xs dark:bg-slate-800 dark:border-slate-700">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#006565] text-[10px] font-bold text-white uppercase">
                                        {auth.user.name ? auth.user.name.charAt(0) : 'U'}
                                    </div>
                                    <span className="font-bold text-slate-700 max-w-[120px] truncate dark:text-slate-200">
                                        {auth.user.name}
                                    </span>
                                </div>
                                <Link
                                    href={dashboard()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#006565] to-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#006565]/20 transition-all hover:shadow-lg hover:shadow-[#006565]/30 hover:scale-[1.02] active:scale-[0.98] lg:text-sm"
                                >
                                    <Layers className="h-4 w-4" />
                                    <span>Dashboard</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2.5">
                                <Link
                                    href={login()}
                                    className="rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:border-[#006565]/40 hover:bg-emerald-50/40 hover:text-[#006565] lg:text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-750"
                                >
                                    Portal Masuk
                                </Link>
                                <Link
                                    href={register()}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#006565] to-emerald-700 px-4.5 py-2 text-xs font-bold text-white shadow-md shadow-[#006565]/20 transition-all hover:shadow-lg hover:shadow-[#006565]/30 hover:scale-[1.02] active:scale-[0.98] lg:text-sm"
                                >
                                    <span>Registrasi Petugas</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Hamburger */}
                    <div className="flex md:hidden">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100 hover:text-[#006565] transition-all cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
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

                {/* Mobile Dropdown Menu Drawer */}
                {mobileMenuOpen && (
                    <div className="border-t border-slate-200/80 bg-white/95 px-4 pt-3 pb-6 backdrop-blur-xl md:hidden shadow-xl animate-in slide-in-from-top-2 duration-200 dark:border-slate-800 dark:bg-slate-900/95">
                        <div className="flex flex-col space-y-3">
                            {/* Mobile Top Context Pill */}
                            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-500/15 dark:bg-emerald-950/30 dark:border-emerald-500/30">
                                <span className="flex items-center gap-2 text-xs font-bold text-[#006565] dark:text-emerald-400">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                    </span>
                                    <span>Satu Data Pangan Indramayu</span>
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                    Live Harian
                                </span>
                            </div>

                            {/* Dropdown Menu: Data Pangan in Mobile */}
                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/80">
                                <button
                                    type="button"
                                    onClick={() => setMobileDataOpen(!mobileDataOpen)}
                                    className="flex w-full items-center justify-between px-2 py-1 text-xs font-black uppercase tracking-wider text-slate-700 cursor-pointer dark:text-slate-200"
                                >
                                    <span className="flex items-center gap-2">
                                        <Layers className="h-4 w-4 text-[#006565] dark:text-emerald-400" />
                                        <span>Data Pangan</span>
                                    </span>
                                    <ChevronDown
                                        className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                                            mobileDataOpen ? 'rotate-180 text-[#006565]' : ''
                                        }`}
                                    />
                                </button>
                                {mobileDataOpen && (
                                    <div className="mt-2 space-y-1.5 border-t border-slate-200/70 pt-2 dark:border-slate-700">
                                        {/* Submenu 1: IKP */}
                                        <Link
                                            href="/ikp"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                                                isIkpActive
                                                    ? 'text-[#006565] bg-emerald-50 border border-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                    : 'text-slate-700 hover:bg-white hover:text-[#006565] dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <ShieldCheck className="h-4 w-4 text-[#006565] dark:text-emerald-400" />
                                                <span>IKP</span>
                                            </div>
                                            {isIkpActive && (
                                                <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-black text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100">
                                                    Aktif
                                                </span>
                                            )}
                                        </Link>

                                        {/* Submenu 2: Neraca */}
                                        <Link
                                            href="/neraca-pangan"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                                                isNeracaActive
                                                    ? 'text-teal-800 bg-teal-50 border border-teal-500/20 dark:bg-teal-950/50 dark:text-teal-300'
                                                    : 'text-slate-700 hover:bg-white hover:text-teal-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Layers className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                                                <span>Neraca</span>
                                            </div>
                                            {isNeracaActive && (
                                                <span className="rounded-full bg-teal-200/80 px-2 py-0.5 text-[10px] font-black text-teal-900 dark:bg-teal-800 dark:text-teal-100">
                                                    Aktif
                                                </span>
                                            )}
                                        </Link>

                                        {/* Submenu 3: PPH */}
                                        <Link
                                            href="/pph"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                                                isPphActive
                                                    ? 'text-[#006565] bg-cyan-50 border border-cyan-500/20 dark:bg-cyan-950/50 dark:text-cyan-300'
                                                    : 'text-slate-700 hover:bg-white hover:text-[#006565] dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <PieChart className="h-4 w-4 text-[#006565] dark:text-cyan-400" />
                                                <span>PPH</span>
                                            </div>
                                            {isPphActive && (
                                                <span className="rounded-full bg-cyan-200/80 px-2 py-0.5 text-[10px] font-black text-[#006565] dark:bg-cyan-800 dark:text-cyan-100">
                                                    Aktif
                                                </span>
                                            )}
                                        </Link>

                                        {/* Submenu 4: Harga Konsumen */}
                                        <Link
                                            href="/harga-konsumen"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                                                isHargaKonsumenActive
                                                    ? 'text-[#006565] bg-emerald-50 border border-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                    : 'text-slate-700 hover:bg-white hover:text-[#006565] dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Store className="h-4 w-4 text-emerald-600" />
                                                <span>Harga Konsumen</span>
                                            </div>
                                            {isHargaKonsumenActive && (
                                                <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-black text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100">
                                                    Aktif
                                                </span>
                                            )}
                                        </Link>

                                        {/* Submenu 5: Harga Produsen */}
                                        <Link
                                            href="/harga-produsen"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                                                isHargaProdusenActive
                                                    ? 'text-amber-800 bg-amber-50 border border-amber-500/20 dark:bg-amber-950/50 dark:text-amber-300'
                                                    : 'text-slate-700 hover:bg-white hover:text-amber-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Wheat className="h-4 w-4 text-amber-600" />
                                                <span>Harga Produsen</span>
                                            </div>
                                            {isHargaProdusenActive && (
                                                <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-black text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                                                    Aktif
                                                </span>
                                            )}
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Auth Actions */}
                            <div className="pt-2 border-t border-slate-100 space-y-2 dark:border-slate-800">
                                {auth?.user ? (
                                    <Link
                                        href={dashboard()}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#006565] to-emerald-700 py-2.5 text-xs font-bold text-white shadow-md"
                                    >
                                        <Layers className="h-4 w-4" />
                                        <span>Buka Dashboard ({auth.user.name})</span>
                                    </Link>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link
                                            href={login()}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                                        >
                                            Portal Masuk
                                        </Link>
                                        <Link
                                            href={register()}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center justify-center rounded-xl bg-gradient-to-r from-[#006565] to-emerald-700 py-2 text-xs font-bold text-white shadow-md"
                                        >
                                            Registrasi
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}

