import { Link, usePage } from '@inertiajs/react';
import {
    ArrowUp,
    Layers,
    MapPin,
    PieChart,
    ShieldCheck,
    Store,
    Wheat,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { dashboard, login } from '@/routes';

interface PortalFooterProps {
    currentYear?: number;
}

export default function PortalFooter({
    currentYear = new Date().getFullYear(),
}: PortalFooterProps) {
    const { auth } = usePage<{ auth?: { user?: { name?: string } } }>().props;
    const [showFloatingTop, setShowFloatingTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 400) {
                setShowFloatingTop(true);
            } else {
                setShowFloatingTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <footer className="mt-16 border-t border-slate-200/90 bg-white text-slate-600 transition-colors dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-400">
            {/* Top accent gradient line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-[#006565] to-teal-400" />

            <div className="mx-auto max-w-7xl px-4 pt-12 pb-24 sm:px-6 sm:pb-16 lg:px-8 lg:pb-12">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
                    {/* Brand & Address Column */}
                    <div className="space-y-4 lg:col-span-5">
                        <Link href="/ikp" className="group inline-flex items-center gap-3">
                            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-105">
                                <img
                                    src="/storage/indramayu_logo.png"
                                    alt="Logo DKPP Indramayu"
                                    className="h-11 w-auto max-h-full object-contain drop-shadow-sm"
                                />
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-base font-black tracking-tight text-slate-900 group-hover:text-[#006565] transition-colors dark:text-white dark:group-hover:text-emerald-400">
                                        DKPP INDRAMAYU
                                    </span>
                                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black tracking-wider text-[#006565] border border-emerald-500/20 uppercase dark:text-emerald-400 dark:border-emerald-500/30">
                                        Satu Data
                                    </span>
                                </div>
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                                    Dinas Ketahanan Pangan dan Pertanian
                                </span>
                            </div>
                        </Link>

                        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 max-w-md">
                            Portal Satu Data Pangan Kabupaten Indramayu menyajikan data Indeks Ketahanan Pangan (IKP), transparansi harga konsumen harian, harga produsen, neraca pangan bulanan, serta Pola Pangan Harapan (PPH) secara akurat dan berkala.
                        </p>

                        <div className="space-y-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-start gap-2.5">
                                <MapPin className="h-4 w-4 shrink-0 text-[#006565] dark:text-emerald-400 mt-0.5" />
                                <span>Jl. Pasar Baru No. 445, Kel. Karangmalang, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat 45222</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Portal Menu Navigation */}
                    <div className="space-y-3 lg:col-span-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                            Modul Publik &amp; Layanan Data
                        </h4>
                        <ul className="space-y-2 text-xs font-medium">
                            <li>
                                <Link
                                    href="/ikp"
                                    className="inline-flex items-center gap-2 hover:text-[#006565] transition-colors dark:hover:text-emerald-400"
                                >
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Indeks Ketahanan Pangan (IKP vs Renstra)</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/harga-konsumen"
                                    className="inline-flex items-center gap-2 hover:text-[#006565] transition-colors dark:hover:text-emerald-400"
                                >
                                    <Store className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Harga Konsumen (25 Komoditas &amp; Status HET)</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/harga-produsen"
                                    className="inline-flex items-center gap-2 hover:text-amber-700 transition-colors dark:hover:text-amber-400"
                                >
                                    <Wheat className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                    <span>Harga Produsen (Tingkat Petani &amp; HAP)</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/neraca-pangan"
                                    className="inline-flex items-center gap-2 hover:text-[#006565] transition-colors dark:hover:text-emerald-400"
                                >
                                    <Layers className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                                    <span>Neraca Pangan Bulanan</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/pph"
                                    className="inline-flex items-center gap-2 hover:text-[#006565] transition-colors dark:hover:text-emerald-400"
                                >
                                    <PieChart className="h-3.5 w-3.5 text-[#006565] dark:text-emerald-400" />
                                    <span>Pola Pangan Harapan (PPH Antar Tahun &amp; Komoditas)</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Officer Portal & Status Column */}
                    <div className="space-y-3 lg:col-span-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                            Akses Petugas &amp; Sistem
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed dark:text-slate-400">
                            Khusus enumerator, petugas survei pasar, dan verifikator data DKPP Indramayu.
                        </p>
                        <div>
                            {auth?.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#006565] to-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    <Layers className="h-3.5 w-3.5" />
                                    <span>Buka Dashboard Petugas</span>
                                </Link>
                            ) : (
                                <Link
                                    href={login()}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-[#006565] transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750"
                                >
                                    <ShieldCheck className="h-3.5 w-3.5 text-[#006565] dark:text-emerald-400" />
                                    <span>Login Portal Petugas</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Copyright & Sub-bar */}
                <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-6 text-xs text-slate-400 md:flex-row dark:border-slate-800">
                    <div className="text-center md:text-left">
                        &copy; {currentYear} Dinas Ketahanan Pangan dan Pertanian Kabupaten Indramayu.
                    </div>

                    {/* Tombol Kembali ke Atas Modern di Footer */}
                    <button
                        type="button"
                        onClick={scrollToTop}
                        className="group inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:border-[#006565] hover:bg-[#006565]/5 hover:text-[#006565] hover:shadow-xs active:scale-95 transition-all dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 cursor-pointer"
                        title="Kembali ke atas halaman"
                        aria-label="Kembali ke atas"
                    >
                        <span>Kembali ke Atas</span>
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all duration-300 group-hover:bg-[#006565] group-hover:text-white dark:bg-slate-700 dark:text-slate-300 dark:group-hover:bg-emerald-500 dark:group-hover:text-white">
                            <ArrowUp className="h-3 w-3 stroke-[2.5] transition-transform duration-300 group-hover:-translate-y-0.5" />
                        </div>
                    </button>

                    <div className="text-center font-medium text-slate-500 md:text-right dark:text-slate-400">
                        Sistem Informasi Satu Data Ketahanan Pangan Terpadu
                    </div>
                </div>
            </div>

            {/* Floating Back to Top Button */}
            <button
                type="button"
                onClick={scrollToTop}
                aria-label="Kembali ke atas"
                title="Kembali ke atas"
                className={`fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-30 flex items-center justify-center rounded-full bg-gradient-to-r from-[#006565] to-teal-700 p-3 sm:p-3.5 text-white shadow-lg shadow-[#006565]/30 ring-1 ring-white/20 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:from-[#005252] hover:to-teal-800 active:scale-95 dark:from-emerald-600 dark:to-teal-600 dark:hover:from-emerald-500 dark:hover:to-teal-500 cursor-pointer ${
                    showFloatingTop
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 translate-y-6 pointer-events-none'
                }`}
            >
                <ArrowUp className="h-5 w-5 stroke-[2.5]" />
            </button>
        </footer>
    );
}
