import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ChevronDown,
    Layers,
    Menu,
    PieChart,
    Store,
    TrendingUp,
    Wheat,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { dashboard, login, register } from '@/routes';

export type PortalActivePage = 'harga-konsumen' | 'harga-produsen' | 'neraca-pangan' | 'pph';

interface PortalNavbarProps {
    activePage: PortalActivePage;
}

export default function PortalNavbar({ activePage }: PortalNavbarProps) {
    const { auth } = usePage<{ auth?: { user?: { name?: string; email?: string } } }>().props;

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [hargaMenuOpen, setHargaMenuOpen] = useState(false);
    const [mobileHargaOpen, setMobileHargaOpen] = useState(true);

    const hargaMenuRef = useRef<HTMLDivElement>(null);

    // Close desktop dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                hargaMenuRef.current &&
                !hargaMenuRef.current.contains(event.target as Node)
            ) {
                setHargaMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const isHargaActive =
        activePage === 'harga-konsumen' || activePage === 'harga-produsen';
    const isNeracaActive = activePage === 'neraca-pangan';
    const isPphActive = activePage === 'pph';

    return (
        <header className="sticky top-0 z-50 transition-all">
            {/* Top Accent Gradient Shimmer Line */}
            <div className="h-[2.5px] w-full bg-gradient-to-r from-emerald-500 via-[#006565] to-teal-400" />

            <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-xs dark:border-slate-800 dark:bg-slate-900/95">
                <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Logo & Brand Identity */}
                    <Link
                        href="/harga-konsumen"
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
                        {/* 1. Dropdown Menu: Harga Pangan */}
                        <div className="relative" ref={hargaMenuRef}>
                            <button
                                type="button"
                                onClick={() => setHargaMenuOpen(!hargaMenuOpen)}
                                onMouseEnter={() => setHargaMenuOpen(true)}
                                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                                    isHargaActive || hargaMenuOpen
                                        ? 'bg-white text-[#006565] shadow-xs ring-1 ring-slate-200/80 dark:bg-slate-900 dark:text-emerald-400 dark:ring-slate-700'
                                        : 'text-slate-700 hover:text-[#006565] hover:bg-white/70 dark:text-slate-300 dark:hover:bg-slate-900/60 dark:hover:text-white'
                                }`}
                                aria-expanded={hargaMenuOpen}
                            >
                                <TrendingUp className="h-4 w-4 text-[#006565] dark:text-emerald-400" />
                                <span>Harga Pangan</span>
                                <ChevronDown
                                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                        hargaMenuOpen
                                            ? 'rotate-180 text-[#006565] dark:text-emerald-400'
                                            : 'text-slate-400'
                                    }`}
                                />
                            </button>

                            {hargaMenuOpen && (
                                <div
                                    onMouseLeave={() => setHargaMenuOpen(false)}
                                    className="absolute left-0 mt-2 w-72 rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-slate-900/5 transition-all z-50 animate-in fade-in slide-in-from-top-2 duration-200 dark:border-slate-700 dark:bg-slate-900/95"
                                >
                                    <div className="px-3 pt-2 pb-1 text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                        Pilih Pasar &amp; Tingkat Harga
                                    </div>

                                    {/* Submenu 1: Harga Konsumen */}
                                    <Link
                                        href="/harga-konsumen"
                                        onClick={() => setHargaMenuOpen(false)}
                                        className={`group flex items-start gap-3 rounded-xl p-2.5 transition-all ${
                                            activePage === 'harga-konsumen'
                                                ? 'bg-gradient-to-r from-emerald-50/90 to-teal-50/40 text-slate-900 border border-emerald-500/25 dark:from-emerald-950/40 dark:to-teal-950/20 dark:text-white dark:border-emerald-500/30'
                                                : 'hover:bg-slate-50 border border-transparent dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <div
                                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs transition-colors ${
                                                activePage === 'harga-konsumen'
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
                                                        activePage === 'harga-konsumen'
                                                            ? 'text-[#006565] dark:text-emerald-400'
                                                            : 'text-slate-800 group-hover:text-[#006565] dark:text-slate-200 dark:group-hover:text-emerald-400'
                                                    }`}
                                                >
                                                    Harga Konsumen
                                                </span>
                                                {activePage === 'harga-konsumen' && (
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

                                    {/* Submenu 2: Harga Produsen */}
                                    <Link
                                        href="/harga-produsen"
                                        onClick={() => setHargaMenuOpen(false)}
                                        className={`group mt-1 flex items-start gap-3 rounded-xl p-2.5 transition-all ${
                                            activePage === 'harga-produsen'
                                                ? 'bg-gradient-to-r from-amber-50/90 to-yellow-50/40 text-slate-900 border border-amber-500/25 dark:from-amber-950/40 dark:to-yellow-950/20 dark:text-white dark:border-amber-500/30'
                                                : 'hover:bg-slate-50 border border-transparent dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <div
                                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs transition-colors ${
                                                activePage === 'harga-produsen'
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
                                                        activePage === 'harga-produsen'
                                                            ? 'text-amber-800 dark:text-amber-400'
                                                            : 'text-slate-800 group-hover:text-amber-800 dark:text-slate-200 dark:group-hover:text-amber-400'
                                                    }`}
                                                >
                                                    Harga Produsen
                                                </span>
                                                {activePage === 'harga-produsen' && (
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

                        {/* 2. Menu Utama: Neraca Pangan */}
                        <Link
                            href="/neraca-pangan"
                            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                                isNeracaActive
                                    ? 'bg-white text-[#006565] shadow-xs ring-1 ring-slate-200/80 dark:bg-slate-900 dark:text-emerald-400 dark:ring-slate-700'
                                    : 'text-slate-700 hover:text-[#006565] hover:bg-white/70 dark:text-slate-300 dark:hover:bg-slate-900/60 dark:hover:text-white'
                            }`}
                        >
                            <Layers className="h-4 w-4 text-[#006565] dark:text-emerald-400" />
                            <span>Neraca Pangan</span>
                            {isNeracaActive && (
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            )}
                        </Link>

                        {/* 3. Menu Utama: Skor PPH */}
                        <Link
                            href="/pph"
                            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                                isPphActive
                                    ? 'bg-white text-[#006565] shadow-xs ring-1 ring-slate-200/80 dark:bg-slate-900 dark:text-emerald-400 dark:ring-slate-700'
                                    : 'text-slate-700 hover:text-[#006565] hover:bg-white/70 dark:text-slate-300 dark:hover:bg-slate-900/60 dark:hover:text-white'
                            }`}
                        >
                            <PieChart className="h-4 w-4 text-[#006565] dark:text-emerald-400" />
                            <span>PPH</span>
                            {isPphActive && (
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            )}
                        </Link>
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

                            {/* Menu 1: Harga Pangan Dropdown in Mobile */}
                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/80">
                                <button
                                    type="button"
                                    onClick={() => setMobileHargaOpen(!mobileHargaOpen)}
                                    className="flex w-full items-center justify-between px-2 py-1 text-xs font-black uppercase tracking-wider text-slate-700 cursor-pointer dark:text-slate-200"
                                >
                                    <span className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-[#006565] dark:text-emerald-400" />
                                        <span>Harga Pangan</span>
                                    </span>
                                    <ChevronDown
                                        className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                                            mobileHargaOpen ? 'rotate-180 text-[#006565]' : ''
                                        }`}
                                    />
                                </button>
                                {mobileHargaOpen && (
                                    <div className="mt-2 space-y-1.5 border-t border-slate-200/70 pt-2 dark:border-slate-700">
                                        {/* Submenu 1: Harga Konsumen */}
                                        <Link
                                            href="/harga-konsumen"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                                                activePage === 'harga-konsumen'
                                                    ? 'text-[#006565] bg-emerald-50 border border-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                    : 'text-slate-700 hover:bg-white hover:text-[#006565] dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Store className="h-4 w-4 text-emerald-600" />
                                                <span>Harga Konsumen</span>
                                            </div>
                                            {activePage === 'harga-konsumen' && (
                                                <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-black text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100">
                                                    Aktif
                                                </span>
                                            )}
                                        </Link>

                                        {/* Submenu 2: Harga Produsen */}
                                        <Link
                                            href="/harga-produsen"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                                                activePage === 'harga-produsen'
                                                    ? 'text-amber-800 bg-amber-50 border border-amber-500/20 dark:bg-amber-950/50 dark:text-amber-300'
                                                    : 'text-slate-700 hover:bg-white hover:text-amber-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Wheat className="h-4 w-4 text-amber-600" />
                                                <span>Harga Produsen</span>
                                            </div>
                                            {activePage === 'harga-produsen' && (
                                                <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-black text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                                                    Aktif
                                                </span>
                                            )}
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Menu 2: Neraca Pangan in Mobile */}
                            <Link
                                href="/neraca-pangan"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                                    isNeracaActive
                                        ? 'text-[#006565] bg-emerald-50 border border-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-300'
                                        : 'text-slate-700 border border-slate-200/80 bg-slate-50/80 hover:bg-white hover:text-[#006565] dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Layers className="h-4 w-4 text-[#006565] dark:text-emerald-400" />
                                    <span>Neraca Pangan</span>
                                </div>
                                {isNeracaActive && (
                                    <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-black text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100">
                                        Aktif
                                    </span>
                                )}
                            </Link>

                            {/* Menu 3: Skor PPH in Mobile */}
                            <Link
                                href="/pph"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                                    isPphActive
                                        ? 'text-[#006565] bg-emerald-50 border border-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-300'
                                        : 'text-slate-700 border border-slate-200/80 bg-slate-50/80 hover:bg-white hover:text-[#006565] dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <PieChart className="h-4 w-4 text-[#006565] dark:text-emerald-400" />
                                    <span>PPH</span>
                                </div>
                                {isPphActive && (
                                    <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-black text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100">
                                        Aktif
                                    </span>
                                )}
                            </Link>

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

