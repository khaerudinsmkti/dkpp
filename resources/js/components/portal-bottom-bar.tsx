import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Compass,
    Layers,
    LayoutGrid,
    MapPin,
    Package,
    PieChart,
    ShieldCheck,
    Store,
    Wheat,
    X,
} from 'lucide-react';
import { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { dashboard, login } from '@/routes';
import type { PortalActivePage } from './portal-navbar';

interface PortalBottomBarProps {
    activePage: PortalActivePage;
}

export default function PortalBottomBar({ activePage }: PortalBottomBarProps) {
    const { auth } = usePage<{ auth?: { user?: { name?: string; email?: string } } }>().props;
    const [sheetOpen, setSheetOpen] = useState(false);

    // Deteksi halaman aktif
    const isIkpActive = activePage === 'ikp';
    const isHargaKonsumenActive = activePage === 'harga-konsumen';
    const isHargaProdusenActive = activePage === 'harga-produsen';
    const isNeracaActive = activePage === 'neraca-pangan';

    // Menu yang tidak muat di bilah bawah
    const isCppdActive = activePage === 'cppd';
    const isFsvaActive = activePage === 'fsva';
    const isSkpgActive = activePage === 'skpg';
    const isPphActive = activePage === 'pph';

    // Status apakah halaman saat ini merupakan salah satu menu di dalam "Lainnya"
    const isOtherActive = isCppdActive || isFsvaActive || isSkpgActive || isPphActive;

    // 4 menu utama yang muat di bottom bar
    const primaryNavItems = [
        {
            name: 'IKP',
            href: '/ikp',
            icon: ShieldCheck,
            isActive: isIkpActive,
        },
        {
            name: 'Konsumen',
            href: '/harga-konsumen',
            icon: Store,
            isActive: isHargaKonsumenActive,
        },
        {
            name: 'Produsen',
            href: '/harga-produsen',
            icon: Wheat,
            isActive: isHargaProdusenActive,
        },
        {
            name: 'Neraca',
            href: '/neraca-pangan',
            icon: Layers,
            isActive: isNeracaActive,
        },
    ];

    // Menu yang tidak muat di bilah bawah dan ditampilkan di sheet "Lainnya"
    const overflowNavItems = [
        {
            title: 'CPPD',
            fullTitle: 'Cadangan Pangan Pemerintah Daerah',
            desc: 'Stok beras, lumbung pangan & cadangan daerah',
            href: '/cppd',
            icon: Package,
            color: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300',
            borderActive: 'border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/40',
            isActive: isCppdActive,
        },
        {
            title: 'FSVA',
            fullTitle: 'Food Security and Vulnerability Atlas',
            desc: 'Peta tematik ketahanan & kerentanan 317 Desa',
            href: '/fsva',
            icon: Compass,
            color: 'text-[#006565] bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300',
            borderActive: 'border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/40',
            isActive: isFsvaActive,
        },
        {
            title: 'SKPG',
            fullTitle: 'Sistem Kewaspadaan Pangan & Gizi',
            desc: 'Peringatan dini status pangan bulanan 31 Kecamatan',
            href: '/skpg',
            icon: MapPin,
            color: 'text-teal-700 bg-teal-100 dark:bg-teal-950/60 dark:text-teal-300',
            borderActive: 'border-teal-500/30 bg-teal-50/80 dark:bg-teal-950/40',
            isActive: isSkpgActive,
        },
        {
            title: 'PPH',
            fullTitle: 'Pola Pangan Harapan (Ketersediaan)',
            desc: 'Skor PPH Ketersediaan & mutu keanekaragaman pangan',
            href: '/pph',
            icon: PieChart,
            color: 'text-cyan-700 bg-cyan-100 dark:bg-cyan-950/60 dark:text-cyan-300',
            borderActive: 'border-cyan-500/30 bg-cyan-50/80 dark:bg-cyan-950/40',
            isActive: isPphActive,
        },
    ];

    return (
        <>
            {/* Fixed Bottom Navigation Bar (Khusus Tampilan Mobile) */}
            <nav
                aria-label="Navigasi Bawah Mobile"
                className="fixed inset-x-0 bottom-0 z-40 block border-t border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-[0_-4px_25px_rgba(0,0,0,0.08)] transition-all md:hidden dark:border-slate-800 dark:bg-slate-900/95"
                style={{
                    paddingBottom: 'calc(0.25rem + env(safe-area-inset-bottom, 0px))',
                }}
            >
                <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
                    {/* 4 Menu Utama */}
                    {primaryNavItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all duration-200 active:scale-95 ${
                                    item.isActive
                                        ? 'text-[#006565] font-extrabold dark:text-emerald-400'
                                        : 'text-slate-500 font-medium hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                {/* Active Top Indicator Pill */}
                                {item.isActive && (
                                    <span className="absolute top-0 h-1 w-8 rounded-full bg-gradient-to-r from-emerald-500 to-[#006565] shadow-xs" />
                                )}

                                <div
                                    className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all ${
                                        item.isActive
                                            ? 'bg-emerald-50 text-[#006565] dark:bg-emerald-950/50 dark:text-emerald-400'
                                            : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                >
                                    <Icon className="h-4.5 w-4.5" />
                                </div>
                                <span className="text-[10.5px] tracking-tight leading-none">
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Menu Paling Kanan: Lainnya (Membuka Sheet Menu yang Tidak Muat) */}
                    <button
                        type="button"
                        onClick={() => setSheetOpen(true)}
                        aria-label="Buka menu lainnya"
                        aria-expanded={sheetOpen}
                        className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all duration-200 active:scale-95 cursor-pointer ${
                            isOtherActive || sheetOpen
                                ? 'text-[#006565] font-extrabold dark:text-emerald-400'
                                : 'text-slate-500 font-medium hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        {/* Active Top Indicator Pill jika salah satu menu di dalam Lainnya aktif */}
                        {isOtherActive && (
                            <span className="absolute top-0 h-1 w-8 rounded-full bg-gradient-to-r from-emerald-500 to-[#006565] shadow-xs" />
                        )}

                        <div
                            className={`relative flex h-7 w-7 items-center justify-center rounded-xl transition-all ${
                                isOtherActive || sheetOpen
                                    ? 'bg-emerald-50 text-[#006565] dark:bg-emerald-950/50 dark:text-emerald-400'
                                    : 'text-slate-500 dark:text-slate-400'
                            }`}
                        >
                            <LayoutGrid className="h-4.5 w-4.5" />
                            {/* Dot badge jika menu di lainnya aktif */}
                            {isOtherActive && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600 border border-white dark:border-slate-900" />
                                </span>
                            )}
                        </div>
                        <span className="text-[10.5px] tracking-tight leading-none">
                            Lainnya
                        </span>
                    </button>
                </div>
            </nav>

            {/* Bottom Sheet Drawer: Menu Yang Tidak Muat */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent
                    side="bottom"
                    className="z-50 mx-auto max-h-[88vh] max-w-lg rounded-t-3xl border-t border-slate-200/90 bg-white/98 p-0 backdrop-blur-2xl shadow-2xl dark:border-slate-800 dark:bg-slate-900/98"
                    style={{
                        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
                    }}
                >
                    {/* Pull Indicator Pill */}
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
                    </div>

                    <SheetHeader className="px-5 pt-2 pb-3 text-left border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-[#006565] dark:bg-emerald-950/60 dark:text-emerald-400">
                                    <LayoutGrid className="h-4 w-4" />
                                </span>
                                <div>
                                    <SheetTitle className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                                        Menu Lainnya
                                    </SheetTitle>
                                    <SheetDescription className="text-xs text-slate-500 dark:text-slate-400">
                                        Modul Satu Data Pangan yang tidak muat di bilah bawah
                                    </SheetDescription>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSheetOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all cursor-pointer dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                aria-label="Tutup menu"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </SheetHeader>

                    {/* Content Scrollable List */}
                    <div className="max-h-[calc(88vh-140px)] overflow-y-auto px-5 py-4 space-y-4">
                        {/* Section 1: Modul Tambahan */}
                        <div>
                            <div className="mb-2.5 flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Modul Pemantauan Lanjutan
                                </span>
                                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9.5px] font-bold text-[#006565] border border-emerald-500/20 dark:text-emerald-400">
                                    {overflowNavItems.length} Modul
                                </span>
                            </div>

                            <div className="space-y-2">
                                {overflowNavItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.title}
                                            href={item.href}
                                            onClick={() => setSheetOpen(false)}
                                            className={`group flex items-start gap-3.5 rounded-2xl p-3 border transition-all active:scale-[0.98] ${
                                                item.isActive
                                                    ? `${item.borderActive} shadow-xs`
                                                    : 'border-slate-200/80 bg-slate-50/70 hover:bg-white hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-800/50 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <div
                                                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs transition-colors ${
                                                    item.isActive
                                                        ? 'bg-gradient-to-br from-[#006565] to-emerald-700 text-white'
                                                        : item.color
                                                }`}
                                            >
                                                <Icon className="h-5 w-5" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-1">
                                                    <span
                                                        className={`text-sm font-black ${
                                                            item.isActive
                                                                ? 'text-[#006565] dark:text-emerald-400'
                                                                : 'text-slate-800 group-hover:text-[#006565] dark:text-slate-200'
                                                        }`}
                                                    >
                                                        {item.title}
                                                    </span>
                                                    {item.isActive && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                                            Halaman Aktif
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 text-xs text-slate-600 font-medium dark:text-slate-300">
                                                    {item.fullTitle}
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-slate-400 leading-tight dark:text-slate-500">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section 2: Akses Petugas & Sistem */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="block mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Akses Petugas DKPP
                            </span>

                            {auth?.user ? (
                                <Link
                                    href={dashboard()}
                                    onClick={() => setSheetOpen(false)}
                                    className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-[#006565] to-emerald-700 p-3.5 text-white shadow-md shadow-[#006565]/20 active:scale-[0.98] transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white font-black text-xs uppercase">
                                            {auth.user.name ? auth.user.name.charAt(0) : 'U'}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs font-black">Buka Dashboard Petugas</div>
                                            <div className="text-[11px] text-emerald-100 truncate max-w-[200px]">
                                                {auth.user.name}
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-emerald-100" />
                                </Link>
                            ) : (
                                <Link
                                    href={login()}
                                    onClick={() => setSheetOpen(false)}
                                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-800 shadow-xs hover:border-[#006565] hover:text-[#006565] active:scale-[0.98] transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-[#006565] dark:bg-slate-700 dark:text-emerald-400">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs font-bold">Portal Masuk Petugas</div>
                                            <div className="text-[11px] text-slate-400 dark:text-slate-500">
                                                Login enumerator & verifikator DKPP
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-slate-400" />
                                </Link>
                            )}
                        </div>

                        {/* Banner Identitas Footer Sheet */}
                        <div className="rounded-xl bg-slate-50 p-2.5 text-center border border-slate-100 text-[11px] text-slate-500 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-400">
                            <span className="font-bold text-[#006565] dark:text-emerald-400">DKPP Indramayu</span> • Sistem Informasi Satu Data Ketahanan Pangan
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}

