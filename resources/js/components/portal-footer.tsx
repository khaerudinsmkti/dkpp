import { Link, usePage } from '@inertiajs/react';
import {
    Layers,
    MapPin,
    PieChart,
    ShieldCheck,
    Store,
    Wheat,
} from 'lucide-react';
import { dashboard, login } from '@/routes';

interface PortalFooterProps {
    currentYear?: number;
}

export default function PortalFooter({
    currentYear = new Date().getFullYear(),
}: PortalFooterProps) {
    const { auth } = usePage<{ auth?: { user?: { name?: string } } }>().props;

    return (
        <footer className="mt-16 border-t border-slate-200/90 bg-white text-slate-600 transition-colors dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-400">
            {/* Top accent gradient line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-[#006565] to-teal-400" />

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
                    {/* Brand & Address Column */}
                    <div className="space-y-4 lg:col-span-5">
                        <Link href="/harga-konsumen" className="group inline-flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#006565] via-[#005252] to-[#003838] text-white shadow-md shadow-[#006565]/20 ring-1 ring-white/20 transition-all duration-300 group-hover:scale-105">
                                <Wheat className="h-6 w-6 stroke-[2.2] text-emerald-100" />
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
                            Portal Satu Data Pangan Kabupaten Indramayu menyajikan transparansi data harga konsumen harian, harga produsen, neraca pangan bulanan, serta pemantauan mutu konsumsi pangan Pola Pangan Harapan (PPH) secara akurat dan berkala.
                        </p>

                        <div className="space-y-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-start gap-2.5">
                                <MapPin className="h-4 w-4 shrink-0 text-[#006565] dark:text-emerald-400 mt-0.5" />
                                <span>Jl. MT Haryono No. 1, Sindang, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat 45222</span>
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
                <div className="mt-10 flex flex-col items-center justify-between border-t border-slate-200/80 pt-6 text-xs text-slate-400 sm:flex-row dark:border-slate-800">
                    <div className="text-center sm:text-left">
                        &copy; {currentYear} Dinas Ketahanan Pangan dan Pertanian Kabupaten Indramayu. Lumbung Padi Nasional.
                    </div>
                    <div className="mt-2 text-center font-medium text-slate-500 sm:mt-0 sm:text-right dark:text-slate-400">
                        Sistem Informasi Satu Data Ketahanan Pangan Terpadu
                    </div>
                </div>
            </div>
        </footer>
    );
}
