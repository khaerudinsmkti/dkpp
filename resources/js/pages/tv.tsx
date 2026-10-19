import { Head, router } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    Calendar,
    CheckCircle2,
    Clock,
    Cloud,
    CloudDrizzle,
    CloudFog,
    CloudLightning,
    CloudRain,
    CloudSun,
    ExternalLink,
    Maximize,
    Minimize,
    Minus,
    Pause,
    Play,
    RefreshCw,
    ShieldCheck,
    Store,
    Sun,
    TrendingDown,
    TrendingUp,
    Wheat,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface CommodityTvItem {
    id: number;
    name: string;
    category?: string;
    unit: string;
    image?: string | null;
    image_url?: string | null;
    today_price: number | null;
    yesterday_price: number | null;
    het_price: number | null;
    date?: string;
}

export interface TvPageProps {
    consumerCommodities?: CommodityTvItem[];
    marketName?: string;
    effectiveDate?: string;
}

interface WeatherData {
    temperature: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
    description: string;
}

export default function TvPage({
    consumerCommodities = [],
    marketName = 'Pasar Daerah Indramayu',
    effectiveDate,
}: TvPageProps) {
    // --- FORCE LIGHT MODE UNTUK HALAMAN TV DISPLAY ---
    useEffect(() => {
        const root = document.documentElement;
        const wasDark = root.classList.contains('dark');
        if (wasDark) {
            root.classList.remove('dark');
        }
        return () => {
            if (wasDark) {
                root.classList.add('dark');
            }
        };
    }, []);

    // --- 1. FULLSCREEN STATE & HANDLER ---
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.warn('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen().catch((err) => {
                console.warn('Error attempting to exit fullscreen:', err);
            });
        }
    };

    // --- 2. REALTIME CLOCK & DATE ---
    const [currentTime, setCurrentTime] = useState<Date>(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatClock = useMemo(() => {
        return currentTime.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    }, [currentTime]);

    const formatDateIndo = useMemo(() => {
        return currentTime.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }, [currentTime]);

    // --- 3. REALTIME WEATHER INDRAMAYU (OPEN-METEO) ---
    const [weather, setWeather] = useState<WeatherData>({
        temperature: 30,
        humidity: 75,
        windSpeed: 10,
        weatherCode: 1,
        description: 'Cerah Berawan',
    });

    const getWeatherInfo = (code: number): string => {
        switch (code) {
            case 0:
                return 'Cerah';
            case 1:
            case 2:
                return 'Cerah Berawan';
            case 3:
                return 'Berawan';
            case 45:
            case 48:
                return 'Berkabut';
            case 51:
            case 53:
            case 55:
                return 'Gerimis';
            case 61:
            case 63:
            case 65:
                return 'Hujan Sedang';
            case 80:
            case 81:
            case 82:
                return 'Hujan Lebat';
            case 95:
            case 96:
            case 99:
                return 'Hujan Petir';
            default:
                return 'Cerah Berawan';
        }
    };

    const fetchWeather = useCallback(async () => {
        try {
            const res = await fetch(
                'https://api.open-meteo.com/v1/forecast?latitude=-6.3264&longitude=108.3200&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FJakarta'
            );
            if (!res.ok) throw new Error('Failed to fetch weather');
            const data = await res.json();
            const current = data.current;
            if (current) {
                setWeather({
                    temperature: Math.round(current.temperature_2m),
                    humidity: Math.round(current.relative_humidity_2m),
                    windSpeed: Math.round(current.wind_speed_10m),
                    weatherCode: current.weather_code,
                    description: getWeatherInfo(current.weather_code),
                });
            }
        } catch (error) {
            console.warn('Weather fetch error, using fallback:', error);
        }
    }, []);

    useEffect(() => {
        fetchWeather();
        // Refresh cuaca setiap 15 menit
        const interval = setInterval(fetchWeather, 15 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchWeather]);

    const renderWeatherIcon = (code: number) => {
        if (code === 0) return <Sun className="h-7 w-7 text-amber-300 animate-spin-slow" />;
        if (code === 1 || code === 2) return <CloudSun className="h-7 w-7 text-amber-200" />;
        if (code === 3) return <Cloud className="h-7 w-7 text-sky-100" />;
        if (code === 45 || code === 48) return <CloudFog className="h-7 w-7 text-slate-200" />;
        if (code >= 51 && code <= 55) return <CloudDrizzle className="h-7 w-7 text-sky-200" />;
        if (code >= 61 && code <= 82) return <CloudRain className="h-7 w-7 text-sky-200 animate-bounce-subtle" />;
        if (code >= 95) return <CloudLightning className="h-7 w-7 text-yellow-300 animate-pulse" />;
        return <CloudSun className="h-7 w-7 text-amber-200" />;
    };

    // --- 4. COMMODITY AUTO SLIDER (5 per slide, 25 commodities) ---
    const ITEMS_PER_SLIDE = 5;
    const SLIDE_DURATION_SEC = 8; // 8 detik per slide
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isSliderPaused, setIsSliderPaused] = useState(false);
    const [progress, setProgress] = useState(0);

    const totalCommodities = consumerCommodities.length;
    const totalSlides = Math.max(1, Math.ceil(totalCommodities / ITEMS_PER_SLIDE));

    // Chunk commodities into slides
    const slides = useMemo(() => {
        const chunks: CommodityTvItem[][] = [];
        for (let i = 0; i < totalCommodities; i += ITEMS_PER_SLIDE) {
            chunks.push(consumerCommodities.slice(i, i + ITEMS_PER_SLIDE));
        }
        return chunks.length > 0 ? chunks : [[]];
    }, [consumerCommodities, totalCommodities]);

    // Handle auto slide interval & smooth progress bar
    useEffect(() => {
        if (isSliderPaused || totalSlides <= 1) return;

        const intervalStepMs = 100;
        const totalSteps = (SLIDE_DURATION_SEC * 1000) / intervalStepMs;

        const progressTimer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    setCurrentSlideIndex((oldSlide) => (oldSlide + 1) % totalSlides);
                    return 0;
                }
                return prev + 100 / totalSteps;
            });
        }, intervalStepMs);

        return () => clearInterval(progressTimer);
    }, [isSliderPaused, totalSlides]);

    const handlePrevSlide = () => {
        setProgress(0);
        setCurrentSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    };

    const handleNextSlide = () => {
        setProgress(0);
        setCurrentSlideIndex((prev) => (prev + 1) % totalSlides);
    };

    // --- 5. BACKGROUND DATA REFRESH (setiap 10 menit reload data) ---
    useEffect(() => {
        const reloadTimer = setInterval(() => {
            router.reload({
                only: ['consumerCommodities', 'effectiveDate'],
            });
        }, 10 * 60 * 1000);
        return () => clearInterval(reloadTimer);
    }, []);

    // Format Rupiah
    const formatRp = (num: number | null | undefined): string => {
        if (num === null || num === undefined || num === 0) return 'Rp 0';
        return `Rp ${Number(num).toLocaleString('id-ID')}`;
    };

    // Format tanggal efektif data harga
    const formattedDataDate = useMemo(() => {
        if (!effectiveDate) return null;
        try {
            const d = new Date(effectiveDate);
            return d.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return effectiveDate;
        }
    }, [effectiveDate]);

    const currentSlideCommodities = slides[currentSlideIndex] || [];

    return (
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-white text-slate-800 select-none">
            <Head title="Display TV Lobby • Dinas Ketahanan Pangan dan Pertanian Indramayu">
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            {/* ========================================================================= */}
            {/* 1. TOP NAVIGASI (Gradasi Biru Tua & Biru Muda, Logo, Sub Judul, Fullscreen) */}
            {/* ========================================================================= */}
            <header className="relative z-20 flex shrink-0 items-center justify-between bg-gradient-to-r from-[#09203f] via-[#123e73] to-[#1e6091] px-5 py-3 text-white shadow-md">
                {/* Left: Logo & Nama Instansi */}
                <div className="flex items-center gap-3.5 sm:gap-4">
                    <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-md ring-2 ring-white/40">
                        <img
                            src="/storage/indramayu_logo.png"
                            alt="Logo DKPP Indramayu"
                            className="h-full w-full object-contain filter drop-shadow-sm"
                        />
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-base font-black tracking-tight uppercase text-white sm:text-xl lg:text-2xl drop-shadow-sm">
                                Dinas Ketahanan Pangan dan Pertanian
                            </h1>
                            <span className="hidden items-center gap-1.5 rounded-full border border-sky-300/40 bg-sky-400/20 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-sky-100 uppercase sm:inline-flex shadow-xs">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                TV LOBBY DISPLAY
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm font-medium tracking-wide text-sky-100 drop-shadow-xs">
                            Jl. Pasar Baru No.445, Kel. Karangmalang - INDRAMAYU
                        </p>
                    </div>
                </div>

                {/* Right: Fullscreen Toggle */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={toggleFullScreen}
                        title={isFullscreen ? 'Keluar dari Layar Penuh (ESC)' : 'Tampilkan Layar Penuh (F11)'}
                        className="group flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-3.5 py-2 text-xs sm:text-sm font-bold text-white backdrop-blur-sm transition-all duration-200 hover:border-white/50 hover:bg-white/25 hover:shadow-md cursor-pointer"
                    >
                        {isFullscreen ? (
                            <>
                                <Minimize className="h-4 w-4 text-sky-200 transition-transform group-hover:scale-110" />
                                <span className="hidden sm:inline">Keluar Penuh</span>
                            </>
                        ) : (
                            <>
                                <Maximize className="h-4 w-4 text-sky-200 transition-transform group-hover:scale-110" />
                                <span className="hidden sm:inline">Layar Penuh</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* ========================================================================= */}
            {/* 2. BODY LAYOUT (Background Putih: 70% Video Playlist + 30% Slider Harga)  */}
            {/* ========================================================================= */}
            <main className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 bg-slate-50/70 p-4 lg:flex-row lg:gap-4 lg:p-4">
                {/* --------------------------------------------------------------------- */}
                {/* LAYOUT 1 (70%): VIDEO PLAYLIST YOUTUBE                                */}
                {/* --------------------------------------------------------------------- */}
                <section className="flex flex-col min-h-0 w-full lg:w-[70%] lg:flex-[7]">
                    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2 shadow-sm">
                        {/* Video Frame */}
                        <div className="relative h-full w-full overflow-hidden rounded-xl bg-black">
                            <iframe
                                src="https://www.youtube.com/embed/videoseries?list=PL28h8nQalyhkRoOd27-h2vvMhB7PybZTw&autoplay=1&mute=1&loop=1&controls=1&rel=0&modestbranding=1&enablejsapi=1"
                                title="Video Informasi DKPP Indramayu"
                                className="h-full w-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </section>

                {/* --------------------------------------------------------------------- */}
                {/* LAYOUT 2 (30%): LIST HARGA PANGAN 25 KOMODITI SLIDER                  */}
                {/* --------------------------------------------------------------------- */}
                <section className="flex flex-col min-h-0 w-full lg:w-[30%] lg:flex-[3]">
                    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-sm">
                        {/* Panel Header */}
                        <div className="mb-2.5 flex shrink-0 items-center justify-between border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#09203f] to-[#1e6091] shadow-xs">
                                    <Store className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black tracking-wide uppercase text-slate-900 sm:text-base">
                                        Harga Pangan Harian
                                    </h2>
                                    <p className="text-[11px] font-semibold text-slate-500">
                                        {marketName}
                                        {formattedDataDate && ` • ${formattedDataDate}`}
                                    </p>
                                </div>
                            </div>

                            {/* Slide Counter & Pause/Play */}
                            <div className="flex items-center gap-1.5">
                                <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-800">
                                    {currentSlideIndex + 1}/{totalSlides}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsSliderPaused((prev) => !prev)}
                                    title={isSliderPaused ? 'Lanjutkan Auto Slide' : 'Jeda Auto Slide'}
                                    className="rounded-md border border-slate-200 bg-slate-100 p-1 text-slate-700 transition-colors hover:bg-slate-200 cursor-pointer"
                                >
                                    {isSliderPaused ? (
                                        <Play className="h-3.5 w-3.5" />
                                    ) : (
                                        <Pause className="h-3.5 w-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Slide Auto Timer Progress Line */}
                        <div className="relative mb-2.5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full bg-gradient-to-r from-[#09203f] via-[#123e73] to-[#1e6091] transition-all duration-100 ease-linear"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Commodity Cards Container */}
                        <div className="flex flex-1 flex-col justify-between gap-2 overflow-hidden">
                            {currentSlideCommodities.length > 0 ? (
                                currentSlideCommodities.map((item, idx) => {
                                    const todayPrice = Number(item.today_price || 0);
                                    const hetPrice = item.het_price !== null ? Number(item.het_price) : null;
                                    const hasHet = hetPrice !== null && hetPrice > 0;

                                    let comparisonStatus: 'above' | 'below' | 'equal' | 'no_het' = 'no_het';
                                    let diffAmount = 0;
                                    let diffPct = 0;

                                    if (hasHet && todayPrice > 0) {
                                        diffAmount = todayPrice - hetPrice;
                                        diffPct = Math.round((diffAmount / hetPrice) * 100);

                                        if (diffAmount > 0) comparisonStatus = 'above';
                                        else if (diffAmount < 0) comparisonStatus = 'below';
                                        else comparisonStatus = 'equal';
                                    }

                                    return (
                                        <div
                                            key={item.id || idx}
                                            className="group flex flex-1 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2 sm:p-2.5 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/40 shadow-xs"
                                        >
                                            {/* Sisi Kiri: Foto Komoditas & Nama */}
                                            <div className="flex min-w-0 items-center gap-2.5">
                                                <div className="relative flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-xs">
                                                    {item.image_url || item.image ? (
                                                        <img
                                                            src={item.image_url || item.image || ''}
                                                            alt={item.name}
                                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                            onError={(e) => {
                                                                (e.currentTarget as HTMLElement).style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <Wheat className="h-6 w-6 text-slate-400" />
                                                    )}
                                                </div>

                                                <div className="flex min-w-0 flex-col">
                                                    <span className="truncate text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-900">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-[11px] font-medium text-slate-500">
                                                        Satuan: {item.unit || 'Kg'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Sisi Kanan: Harga Hari Ini, HET & Perbandingan */}
                                            <div className="flex shrink-0 flex-col items-end text-right">
                                                {/* Harga Hari Ini */}
                                                <span className="font-mono text-sm sm:text-base font-black text-[#0f2c59]">
                                                    {formatRp(todayPrice)}
                                                </span>

                                                {/* Harga HET */}
                                                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                                                    <span>HET:</span>
                                                    <span className="font-mono text-slate-700">
                                                        {hasHet ? formatRp(hetPrice) : '-'}
                                                    </span>
                                                </div>

                                                {/* Badge Perbandingan terhadap HET */}
                                                <div className="mt-0.5">
                                                    {comparisonStatus === 'above' && (
                                                        <span className="inline-flex items-center gap-0.5 rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                                                            <ArrowUp className="h-2.5 w-2.5 text-rose-600" />
                                                            +{formatRp(diffAmount)} (+{diffPct}%)
                                                        </span>
                                                    )}

                                                    {comparisonStatus === 'below' && (
                                                        <span className="inline-flex items-center gap-0.5 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                                            <ArrowDown className="h-2.5 w-2.5 text-emerald-600" />
                                                            -{formatRp(Math.abs(diffAmount))} ({diffPct}%)
                                                        </span>
                                                    )}

                                                    {comparisonStatus === 'equal' && (
                                                        <span className="inline-flex items-center gap-0.5 rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                                                            <CheckCircle2 className="h-2.5 w-2.5 text-blue-600" />
                                                            Sesuai HET
                                                        </span>
                                                    )}

                                                    {comparisonStatus === 'no_het' && (
                                                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                                                            Non-HET
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                                    <Wheat className="mb-2 h-10 w-10 text-slate-400 animate-pulse" />
                                    <p className="text-xs text-slate-500">Memuat data komoditas...</p>
                                </div>
                            )}
                        </div>

                        {/* Slider Dots & Navigation Controls */}
                        <div className="mt-2.5 flex shrink-0 items-center justify-between border-t border-slate-100 pt-2">
                            <div className="flex items-center gap-1.5">
                                {Array.from({ length: totalSlides }).map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                            setProgress(0);
                                            setCurrentSlideIndex(i);
                                        }}
                                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                            i === currentSlideIndex
                                                ? 'w-6 bg-gradient-to-r from-[#09203f] to-[#1e6091] shadow-xs'
                                                : 'w-2 bg-slate-300 hover:bg-slate-400'
                                        }`}
                                        title={`Buka Slide ${i + 1}`}
                                    />
                                ))}
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handlePrevSlide}
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                                >
                                    ◀
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextSlide}
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                                >
                                    ▶
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* ========================================================================= */}
            {/* 3. FOOTER (Gradasi Biru Tua & Biru Muda: Jam, Running Text, Cuaca)        */}
            {/* ========================================================================= */}
            <footer className="relative z-20 flex shrink-0 items-center justify-between bg-gradient-to-r from-[#09203f] via-[#123e73] to-[#1e6091] px-5 py-2.5 text-white shadow-md">
                {/* --------------------------------------------------------------------- */}
                {/* KIRI BAWAH: JAM SAAT INI REALTIME                                     */}
                {/* --------------------------------------------------------------------- */}
                <div className="flex shrink-0 items-center gap-3 border-r border-white/20 pr-4 sm:pr-5">
                    <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-white/15 border border-white/25 text-white shadow-xs">
                        <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-mono text-lg sm:text-xl font-black tracking-wider text-amber-300 drop-shadow-xs">
                                {formatClock}
                            </span>
                            <span className="text-[10px] sm:text-xs font-bold text-sky-200 uppercase">
                                WIB
                            </span>
                        </div>
                        <span className="text-[11px] sm:text-xs font-medium text-sky-100 whitespace-nowrap">
                            {formatDateIndo}
                        </span>
                    </div>
                </div>

                {/* --------------------------------------------------------------------- */}
                {/* TENGAH BAWAH: TULISAN BERJALAN (MARQUEE)                              */}
                {/* --------------------------------------------------------------------- */}
                <div className="relative mx-3 sm:mx-6 flex-1 overflow-hidden">
                    <div className="animate-tv-marquee flex items-center gap-8 py-0.5">
                        <span className="text-xs sm:text-sm font-bold tracking-wide text-amber-300 drop-shadow-xs">
                            📢 SELAMAT DATANG DI DINAS KETAHANAN PANGAN DAN PERTANIAN KABUPATEN INDRAMAYU
                        </span>
                        <span className="text-sky-300 font-black">•</span>
                        <span className="text-xs sm:text-sm font-semibold tracking-wide text-white drop-shadow-xs">
                            INFORMASI HARGA PANGAN POKOK HARIAN TERCATAT REALTIME DARI PASAR DAERAH INDRAMAYU
                        </span>
                        <span className="text-sky-300 font-black">•</span>
                        <span className="text-xs sm:text-sm font-semibold tracking-wide text-sky-100 drop-shadow-xs">
                            BERSAMA MENJAGA STABILITAS PASOKAN DAN KETERJANGKAUAN HARGA PANGAN MASYARAKAT
                        </span>
                        <span className="text-sky-300 font-black">•</span>
                        <span className="text-xs sm:text-sm font-bold tracking-wide text-amber-300 drop-shadow-xs">
                            KABUPATEN INDRAMAYU LUMBUNG PANGAN JAWA BARAT & NASIONAL
                        </span>
                        <span className="text-sky-300 font-black">•</span>
                        <span className="text-xs sm:text-sm font-semibold tracking-wide text-white drop-shadow-xs">
                            KUNJUNGI PORTAL RESMI: HTTPS://DKPP.INDRAMAYUKAB.GO.ID
                        </span>
                        <span className="text-sky-300 font-black">•</span>
                        <span className="text-xs sm:text-sm font-semibold tracking-wide text-sky-100 drop-shadow-xs">
                            ALAMAT KANTOR: JL. PASAR BARU NO. 445 KEL. KARANGMALANG - INDRAMAYU
                        </span>
                        <span className="text-sky-300 font-black">•</span>
                        {/* Duplicate content for seamless infinite marquee loop */}
                        <span className="text-xs sm:text-sm font-bold tracking-wide text-amber-300 drop-shadow-xs">
                            📢 SELAMAT DATANG DI DINAS KETAHANAN PANGAN DAN PERTANIAN KABUPATEN INDRAMAYU
                        </span>
                        <span className="text-sky-300 font-black">•</span>
                        <span className="text-xs sm:text-sm font-semibold tracking-wide text-white drop-shadow-xs">
                            INFORMASI HARGA PANGAN POKOK HARIAN TERCATAT REALTIME DARI PASAR DAERAH INDRAMAYU
                        </span>
                        <span className="text-sky-300 font-black">•</span>
                        <span className="text-xs sm:text-sm font-semibold tracking-wide text-sky-100 drop-shadow-xs">
                            BERSAMA MENJAGA STABILITAS PASOKAN DAN KETERJANGKAUAN HARGA PANGAN MASYARAKAT
                        </span>
                        <span className="text-sky-300 font-black">•</span>
                        <span className="text-xs sm:text-sm font-bold tracking-wide text-amber-300 drop-shadow-xs">
                            KABUPATEN INDRAMAYU LUMBUNG PANGAN JAWA BARAT & NASIONAL
                        </span>
                    </div>
                </div>

                {/* --------------------------------------------------------------------- */}
                {/* KANAN BAWAH: ICON DAN SUHU CUACA INDRAMAYU REALTIME                   */}
                {/* --------------------------------------------------------------------- */}
                <div className="flex shrink-0 items-center gap-3 border-l border-white/20 pl-4 sm:pl-5">
                    <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-white/15 border border-white/25 shadow-xs">
                        {renderWeatherIcon(weather.weatherCode)}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-mono text-lg sm:text-xl font-black text-white drop-shadow-xs">
                                {weather.temperature}°C
                            </span>
                            <span className="text-[10px] sm:text-xs font-black tracking-wider text-sky-200 uppercase">
                                INDRAMAYU
                            </span>
                        </div>
                        <span className="text-[11px] sm:text-xs font-medium text-sky-100 whitespace-nowrap">
                            {weather.description}
                            {weather.humidity ? ` • ${weather.humidity}%` : ''}
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Pastikan Inertia tidak membungkus halaman ini dengan default AppLayout (Sidebar)
TvPage.layout = (page: React.ReactNode) => page;
