import { Download, Laptop, Smartphone, Sparkles, X, Share, PlusSquare, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePwa } from '@/hooks/use-pwa';

export default function PwaInstallPrompt() {
    const { isInstalled, isIOS, canInstall, promptInstall } = usePwa();
    const [isVisible, setIsVisible] = useState(false);
    const [showIosGuide, setShowIosGuide] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [installedSuccess, setInstalledSuccess] = useState(false);

    useEffect(() => {
        // If already installed, never show prompt
        if (isInstalled) {
            setIsVisible(false);
            return;
        }

        // Check if user dismissed it in this session
        const isDismissed = sessionStorage.getItem('dkpp_pwa_prompt_dismissed') === 'true';
        if (isDismissed) {
            return;
        }

        // Delay prompt appearance for smooth user onboarding
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 2000);

        return () => clearTimeout(timer);
    }, [isInstalled]);

    if (isInstalled || !isVisible) {
        return null;
    }

    const handleDismiss = () => {
        sessionStorage.setItem('dkpp_pwa_prompt_dismissed', 'true');
        setIsVisible(false);
    };

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIosGuide(true);
            return;
        }

        setInstalling(true);
        const accepted = await promptInstall();
        setInstalling(false);

        if (accepted) {
            setInstalledSuccess(true);
            setTimeout(() => {
                setIsVisible(false);
            }, 2500);
        } else if (!canInstall) {
            // If beforeinstallprompt hasn't fired yet or not supported, show helper modal
            setShowIosGuide(true);
        }
    };

    return (
        <>
            {/* Main Floating Notification Card */}
            <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-[380px] animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-emerald-500/20 dark:bg-slate-900/95 dark:shadow-emerald-950/40">
                    {/* Top ambient highlight gradient */}
                    <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
                    <div className="absolute -left-12 -bottom-12 h-28 w-28 rounded-full bg-teal-500/15 blur-2xl pointer-events-none" />

                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                        title="Tutup notifikasi"
                        aria-label="Tutup notifikasi"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    {installedSuccess ? (
                        <div className="py-3 text-center animate-in zoom-in-95 duration-300">
                            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                                <Check className="h-6 w-6 stroke-[2.5]" />
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white">Aplikasi Berhasil Dipasang!</h4>
                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                Sekarang Anda dapat mengakses DKPP - Bidang KDP langsung dari layar utama perangkat Anda.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-start gap-3">
                                {/* App Icon */}
                                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/20 p-1.5 border border-emerald-500/30 shadow-xs dark:from-emerald-950/40 dark:to-teal-950/40">
                                    <img
                                        src="/icons/icon-192x192.png"
                                        alt="Logo DKPP"
                                        className="h-full w-full object-contain"
                                    />
                                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                                        <Sparkles className="h-2.5 w-2.5" />
                                    </span>
                                </div>

                                <div className="flex-1 pr-4">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs font-black uppercase tracking-wider text-[#006565] dark:text-emerald-400">
                                            Aplikasi Web Resmi
                                        </span>
                                        <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            PWA
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 leading-tight dark:text-white mt-0.5">
                                        Pasang DKPP Indramayu
                                    </h3>
                                    <p className="mt-1 text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                                        Akses cepat portal harga & ketahanan pangan langsung dari desktop atau beranda HP Anda layaknya aplikasi asli.
                                    </p>
                                </div>
                            </div>

                            {/* Features Pill */}
                            <div className="flex items-center justify-around rounded-xl bg-slate-50 py-1.5 px-2 text-[11px] font-medium text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                                <span className="flex items-center gap-1">
                                    <Laptop className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                    Desktop
                                </span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="flex items-center gap-1">
                                    <Smartphone className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                    Android & iOS
                                </span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="text-emerald-600 font-bold dark:text-emerald-400">
                                    Layar Penuh
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    onClick={handleInstallClick}
                                    disabled={installing}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#006565] px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-[#006565]/25 hover:bg-[#005252] active:scale-[0.98] transition-all disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                                >
                                    <Download className="h-3.5 w-3.5 stroke-[2.5]" />
                                    <span>{installing ? 'Menyiapkan...' : 'Install Aplikasi'}</span>
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    Nanti Saja
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* iOS / Manual Guide Modal */}
            {showIosGuide && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setShowIosGuide(false)}
                            className="absolute right-3.5 top-3.5 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                                {isIOS ? <Smartphone className="h-5 w-5" /> : <Download className="h-5 w-5" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                    {isIOS ? 'Cara Pasang di iPhone/iPad' : 'Panduan Pasang Aplikasi'}
                                </h3>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Ikuti langkah praktis berikut ini:
                                </p>
                            </div>
                        </div>

                        {isIOS ? (
                            <div className="space-y-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                                <div className="flex items-start gap-2.5">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-800 text-[11px] dark:bg-slate-800 dark:text-white">
                                        1
                                    </div>
                                    <p className="pt-0.5 leading-relaxed">
                                        Ketuk ikon <span className="font-semibold inline-flex items-center gap-1 rounded bg-slate-100 px-1 py-0.5 text-slate-900 dark:bg-slate-800 dark:text-white"><Share className="h-3 w-3" /> Bagikan (Share)</span> pada bilah bawah browser Safari.
                                    </p>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-800 text-[11px] dark:bg-slate-800 dark:text-white">
                                        2
                                    </div>
                                    <p className="pt-0.5 leading-relaxed">
                                        Gulir ke bawah dan pilih menu <span className="font-semibold inline-flex items-center gap-1 rounded bg-slate-100 px-1 py-0.5 text-slate-900 dark:bg-slate-800 dark:text-white"><PlusSquare className="h-3 w-3" /> Tambahkan ke Layar Utama</span> (Add to Home Screen).
                                    </p>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-800 text-[11px] dark:bg-slate-800 dark:text-white">
                                        3
                                    </div>
                                    <p className="pt-0.5 leading-relaxed">
                                        Ketuk tombol <span className="font-bold text-[#006565] dark:text-emerald-400">"Tambah" (Add)</span> di pojok kanan atas. Ikon aplikasi akan otomatis muncul di layar utama Anda.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                                <div className="flex items-start gap-2.5">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-800 text-[11px] dark:bg-slate-800 dark:text-white">
                                        1
                                    </div>
                                    <p className="pt-0.5 leading-relaxed">
                                        Klik tombol menu browser Anda (ikon titik tiga <span className="font-bold">⋮</span> di pojok kanan atas atau ikon install di kolom URL/address bar).
                                    </p>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-800 text-[11px] dark:bg-slate-800 dark:text-white">
                                        2
                                    </div>
                                    <p className="pt-0.5 leading-relaxed">
                                        Pilih opsi <span className="font-semibold text-slate-900 dark:text-white">"Install DKPP Indramayu"</span> atau <span className="font-semibold text-slate-900 dark:text-white">"Tambahkan ke Layar Utama"</span>.
                                    </p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setShowIosGuide(false);
                                handleDismiss();
                            }}
                            className="mt-4 w-full rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                        >
                            Saya Mengerti
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

