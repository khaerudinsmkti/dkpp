import { Link } from '@inertiajs/react';
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center bg-[#f7f9fb] px-4 py-8 antialiased selection:bg-[#006565] selection:text-white">
            {/* Ambient Radial Glow from KapanKosong Design */}
            <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[520px] w-[860px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-[#006565]/15 via-emerald-100/35 to-teal-500/15 opacity-80 blur-3xl" />
            <div className="pointer-events-none absolute right-1/4 bottom-0 -z-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="w-full max-w-[430px] space-y-6">
                {/* Brand Header */}
                <div className="flex flex-col items-center text-center">
                    <Link
                        href={home()}
                        className="group flex flex-col items-center gap-2.5 transition-transform hover:scale-105"
                    >
                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-105">
                            <img
                                src="/storage/indramayu_logo.png"
                                alt="Logo DKPP Indramayu"
                                className="h-14 w-auto max-h-full object-contain drop-shadow-sm"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tight text-[#191c1e]">
                                DKPP INDRAMAYU
                            </span>
                            <span className="text-[11px] font-bold tracking-wider text-[#006565] uppercase">
                                Lumbung Padi Nasional
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Card Container (KapanKosong Design: rounded-3xl with subtle border & shadow) */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xl shadow-[#006565]/5 backdrop-blur-xl sm:p-9">
                    <div className="mb-6 text-center">
                        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#006565]/10 px-3 py-1 text-[10px] font-bold tracking-wider text-[#006565] uppercase">
                            <Sparkles className="h-3 w-3 text-[#006565]" />
                            <span>Portal Terpadu</span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-[#191c1e]">
                            {title}
                        </h1>
                        {description && (
                            <p className="mt-2 text-xs leading-relaxed font-medium text-slate-500 sm:text-sm">
                                {description}
                            </p>
                        )}
                    </div>

                    {children}
                </div>

                {/* Bottom Navigation & Security Note */}
                <div className="flex flex-col items-center gap-2.5 text-center text-xs">
                    <Link
                        href={home()}
                        className="inline-flex items-center gap-1.5 font-bold text-slate-500 transition-colors hover:text-[#006565]"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Kembali ke Beranda Utama</span>
                    </Link>

                    <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>
                            Terenkripsi Sesi • Hak Akses RBAC Terlindungi
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
