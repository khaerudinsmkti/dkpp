import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowDown,
    ArrowRight,
    ArrowUp,
    ArrowUpRight,
    BarChart3,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    FileSpreadsheet,
    FileText,
    Filter,
    Info,
    Layers,
    LineChart,
    MapPin,
    Menu,
    Minus,
    Pause,
    Play,
    Printer,
    RefreshCw,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    Store,
    TrendingDown,
    TrendingUp,
    Wheat,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import PortalFooter from '@/components/portal-footer';
import PortalNavbar from '@/components/portal-navbar';
import {
    Area,
    AreaChart,
    Bar,
    CartesianGrid,
    Cell,
    ComposedChart,
    LabelList,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
 
const WhatsAppIcon = ({ className = 'h-3.5 w-3.5 fill-current' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z" />
    </svg>
);

export interface ConsumerCommodityItem {
    id: number;
    name: string;
    category?: string;
    unit: string;
    image?: string | null;
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

// ==============================================================================
// LOCAL BROWSER CACHING SYSTEM (Images & Commodity Data)
// Prevents image reloads across slide transitions & page navigation
// ==============================================================================
const CONSUMER_DATA_CACHE_KEY = 'dkpp_consumer_commodities_cache_v1';
const IMAGE_CACHE_PREFIX = 'dkpp_img_cache_';
const memoryImageCache = new Map<string, string>();

/**
 * Get cached image from RAM or browser localStorage
 */
function getLocalCachedImage(url?: string | null): string | null {
    if (!url) return null;
    if (memoryImageCache.has(url)) {
        return memoryImageCache.get(url)!;
    }
    if (typeof window === 'undefined') return null;
    try {
        const cached = localStorage.getItem(IMAGE_CACHE_PREFIX + url);
        if (cached) {
            memoryImageCache.set(url, cached);
            return cached;
        }
    } catch {
        // Ignore localStorage error (private mode or quota)
    }
    return null;
}

/**
 * Pre-cache image into RAM and localStorage as Base64 data URL
 */
async function cacheImageLocally(url?: string | null): Promise<string | null> {
    if (!url) return null;
    const existing = getLocalCachedImage(url);
    if (existing) return existing;

    if (typeof window === 'undefined') return url;

    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error('Fetch failed');
        const blob = await response.blob();
        return await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                if (base64data && base64data.startsWith('data:image')) {
                    memoryImageCache.set(url, base64data);
                    try {
                        localStorage.setItem(IMAGE_CACHE_PREFIX + url, base64data);
                    } catch {
                        // Ignore quota limit error gracefully
                    }
                    resolve(base64data);
                } else {
                    resolve(url);
                }
            };
            reader.onerror = () => resolve(url);
            reader.readAsDataURL(blob);
        });
    } catch {
        // Fallback: preload into browser HTTP cache via standard Image constructor
        try {
            const img = new Image();
            img.src = url;
            memoryImageCache.set(url, url);
        } catch {
            // Ignore error
        }
        return url;
    }
}

/**
 * Fast cached image component that avoids reloading from server
 */
function CachedCommodityImage({
    src,
    alt,
    className,
}: {
    src: string;
    alt: string;
    className?: string;
}) {
    const [imageSrc, setImageSrc] = useState<string>(() => {
        return getLocalCachedImage(src) || src;
    });

    useEffect(() => {
        let isMounted = true;
        const cached = getLocalCachedImage(src);
        if (cached) {
            setImageSrc(cached);
        } else {
            cacheImageLocally(src).then((cachedUrl) => {
                if (isMounted && cachedUrl) {
                    setImageSrc(cachedUrl);
                }
            });
        }
        return () => {
            isMounted = false;
        };
    }, [src]);

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={className}
            loading="eager"
            decoding="async"
        />
    );
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

    // 25 komoditas list from DB, local browser cache, or fallback
    const commoditiesList = useMemo(() => {
        if (consumerCommodities && consumerCommodities.length > 0) {
            try {
                if (typeof window !== 'undefined') {
                    localStorage.setItem(
                        CONSUMER_DATA_CACHE_KEY,
                        JSON.stringify(consumerCommodities),
                    );
                }
            } catch {
                // Ignore localStorage quota
            }
            return consumerCommodities;
        }

        try {
            if (typeof window !== 'undefined') {
                const cached = localStorage.getItem(CONSUMER_DATA_CACHE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        return parsed;
                    }
                }
            }
        } catch {
            // Ignore error
        }

        return DEFAULT_CONSUMER_COMMODITIES;
    }, [consumerCommodities]);

    // Preload & store all commodity images into browser local cache (RAM & localStorage)
    useEffect(() => {
        commoditiesList.forEach((item) => {
            if (item.image) {
                cacheImageLocally(item.image);
            }
        });
    }, [commoditiesList]);

    // Slider state for commodities (6 cols x 2 rows = 12 cards per slide)
    const [consumerSlide, setConsumerSlide] = useState(0);
    const [isSliderPlaying, setIsSliderPlaying] = useState(true);
    const [isSliderHovered, setIsSliderHovered] = useState(false);
    const CONSUMER_ITEMS_PER_SLIDE = 12;

    const totalConsumerSlides = Math.ceil(commoditiesList.length / CONSUMER_ITEMS_PER_SLIDE);

    // Auto slider timer (5 seconds)
    useEffect(() => {
        if (!isSliderPlaying || isSliderHovered) return;
        const timer = setInterval(() => {
            setConsumerSlide((prev) => (prev + 1) % totalConsumerSlides);
        }, 5000);
        return () => clearInterval(timer);
    }, [isSliderPlaying, isSliderHovered, totalConsumerSlides]);

    // Hero Banner carousel state & interactions
    const [heroSlide, setHeroSlide] = useState(0);
    const [isHeroPlaying, setIsHeroPlaying] = useState(true);
    const [isHeroHovered, setIsHeroHovered] = useState(false);
    const TOTAL_HERO_SLIDES = 3;

    // Auto rotate hero banner every 6 seconds unless paused or hovered
    useEffect(() => {
        if (!isHeroPlaying || isHeroHovered) return;
        const timer = setInterval(() => {
            setHeroSlide((prev) => (prev + 1) % TOTAL_HERO_SLIDES);
        }, 6000);
        return () => clearInterval(timer);
    }, [isHeroPlaying, isHeroHovered]);

    // Smooth scroll helper for quick navigation pills & buttons
    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Chart states & tabulasi
    const [chartTab, setChartTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [chartCommodityId, setChartCommodityId] = useState<number>(1);
    const [chartLoading, setChartLoading] = useState(false);
    const [chartPoints, setChartPoints] = useState<any[]>([]);

    // Daily chart filter (max 31 days)
    const [dailyEndDate, setDailyEndDate] = useState<string>(selectedDate || (latestDate ?? ''));
    const [dailyStartDate, setDailyStartDate] = useState<string>(() => {
        const anchor = selectedDate || (latestDate ?? '');
        if (anchor) {
            const d = new Date(anchor + 'T00:00:00');
            d.setDate(d.getDate() - 30);
            return d.toISOString().split('T')[0];
        }
        return '';
    });

    // Weekly chart filter (month & year)
    const [weeklyYear, setWeeklyYear] = useState<number>(() => {
        const anchor = selectedDate || (latestDate ?? '');
        return anchor ? new Date(anchor + 'T00:00:00').getFullYear() : new Date().getFullYear();
    });
    const [weeklyMonth, setWeeklyMonth] = useState<number>(() => {
        const anchor = selectedDate || (latestDate ?? '');
        return anchor ? new Date(anchor + 'T00:00:00').getMonth() + 1 : new Date().getMonth() + 1;
    });

    // Monthly chart filter (year only)
    const [monthlyYear, setMonthlyYear] = useState<number>(() => {
        const anchor = selectedDate || (latestDate ?? '');
        return anchor ? new Date(anchor + 'T00:00:00').getFullYear() : new Date().getFullYear();
    });

    // Sync chart commodity id if commodity list loads
    useEffect(() => {
        if (consumerCommodities && consumerCommodities.length > 0) {
            if (!consumerCommodities.some((c) => c.id === chartCommodityId)) {
                setChartCommodityId(consumerCommodities[0].id);
            }
        }
    }, [consumerCommodities]);

    // Fetch chart data from API
    useEffect(() => {
        let isMounted = true;
        setChartLoading(true);

        const params = new URLSearchParams();
        params.append('type', chartTab);
        params.append('commodity_id', String(chartCommodityId));
        params.append('market_id', String(currentMarketId));

        if (chartTab === 'daily') {
            if (dailyStartDate) params.append('start_date', dailyStartDate);
            if (dailyEndDate) params.append('end_date', dailyEndDate);
        } else if (chartTab === 'weekly') {
            params.append('year', String(weeklyYear));
            params.append('month', String(weeklyMonth));
        } else if (chartTab === 'monthly') {
            params.append('year', String(monthlyYear));
        }

        fetch(`/api/public-chart-data?${params.toString()}`)
            .then((res) => res.json())
            .then((json) => {
                if (isMounted) {
                    if (json.data) {
                        setChartPoints(json.data);
                        if (json.start_date && !dailyStartDate) setDailyStartDate(json.start_date);
                        if (json.end_date && !dailyEndDate) setDailyEndDate(json.end_date);
                    }
                    setChartLoading(false);
                }
            })
            .catch((err) => {
                console.error('Failed to load chart data:', err);
                if (isMounted) setChartLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [
        chartTab,
        chartCommodityId,
        currentMarketId,
        dailyStartDate,
        dailyEndDate,
        weeklyYear,
        weeklyMonth,
        monthlyYear,
    ]);

    // Handle Daily End Date change and enforce max 31 days
    const handleDailyEndDateChange = (val: string) => {
        setDailyEndDate(val);
        if (val && dailyStartDate) {
            const startD = new Date(dailyStartDate + 'T00:00:00');
            const endD = new Date(val + 'T00:00:00');
            const diffDays = Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 0 || diffDays > 31) {
                const newStart = new Date(endD);
                newStart.setDate(newStart.getDate() - 30);
                setDailyStartDate(newStart.toISOString().split('T')[0]);
            }
        }
    };

    const handleDailyStartDateChange = (val: string) => {
        setDailyStartDate(val);
        if (val && dailyEndDate) {
            const startD = new Date(val + 'T00:00:00');
            const endD = new Date(dailyEndDate + 'T00:00:00');
            const diffDays = Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 0 || diffDays > 31) {
                const newEnd = new Date(startD);
                newEnd.setDate(newEnd.getDate() + 30);
                setDailyEndDate(newEnd.toISOString().split('T')[0]);
            }
        }
    };

    // ==============================================================
    // FITUR TABEL HISTORIS PERKEMBANGAN HARGA PANGAN (25 KOMODITAS)
    // ==============================================================
    interface HistoryRow {
        date: string;
        formatted_date: string;
        day_name: string;
        prices: Record<number | string, number | null>;
        hets?: Record<number | string, number | null>;
        is_above_het?: Record<number | string, boolean>;
        diffs?: Record<number | string, 'up' | 'down' | 'stable' | null>;
    }

    interface HistoryCommodity {
        id: number;
        name: string;
        category: string;
        unit: string;
    }

    const [historyRows, setHistoryRows] = useState<HistoryRow[]>([]);
    const [historyCommodities, setHistoryCommodities] = useState<HistoryCommodity[]>([]);
    const [historyLoading, setHistoryLoading] = useState<boolean>(true);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [historyStartDate, setHistoryStartDate] = useState<string>('');
    const [historyEndDate, setHistoryEndDate] = useState<string>('');
    const [historyPreset, setHistoryPreset] = useState<'14' | '7' | '30' | 'custom'>('14');
    const [historyDateWarning, setHistoryDateWarning] = useState<string | null>(null);
    const [historyPrevMonthLabel, setHistoryPrevMonthLabel] = useState<string>('');
    const [historyPrevMonthAvgs, setHistoryPrevMonthAvgs] = useState<Record<number | string, number | null>>({});
    const [historyCommodityHets, setHistoryCommodityHets] = useState<Record<number | string, number | null>>({});

    const fetchHistoryData = async (start?: string, end?: string) => {
        setHistoryLoading(true);
        setHistoryError(null);
        try {
            const params = new URLSearchParams();
            params.append('market_id', String(currentMarketId));
            if (start) params.append('start_date', start);
            if (end) params.append('end_date', end);

            const res = await fetch(`/api/public-history-data?${params.toString()}`);
            if (!res.ok) throw new Error('Gagal mengambil data historis');
            const data = await res.json();

            setHistoryRows(data.rows || []);
            setHistoryCommodities(data.commodities || []);
            if (data.start_date) setHistoryStartDate(data.start_date);
            if (data.end_date) setHistoryEndDate(data.end_date);
            if (data.prev_month_label) setHistoryPrevMonthLabel(data.prev_month_label);
            if (data.prev_month_averages) setHistoryPrevMonthAvgs(data.prev_month_averages);
            if (data.commodity_hets) setHistoryCommodityHets(data.commodity_hets);
        } catch (err: any) {
            setHistoryError(err.message || 'Terjadi kesalahan saat memuat data historis');
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchHistoryData();
    }, [currentMarketId]);

    const handleApplyHistoryPreset = (preset: '14' | '7' | '30') => {
        setHistoryPreset(preset);
        setHistoryDateWarning(null);
        if (preset === '14') {
            fetchHistoryData();
            return;
        }
        const anchor = historyEndDate || currentDate || maxDate || new Date().toISOString().split('T')[0];
        const days = preset === '7' ? 7 : 30;
        const dEnd = new Date(anchor + 'T00:00:00');
        const dStart = new Date(anchor + 'T00:00:00');
        dStart.setDate(dStart.getDate() - (days - 1));

        const sStr = dStart.toISOString().split('T')[0];
        const eStr = dEnd.toISOString().split('T')[0];
        setHistoryStartDate(sStr);
        setHistoryEndDate(eStr);
        fetchHistoryData(sStr, eStr);
    };

    const handleHistoryStartDateChange = (val: string) => {
        setHistoryPreset('custom');
        let newStart = val;
        let newEnd = historyEndDate;

        if (newStart && newEnd) {
            const dStart = new Date(newStart + 'T00:00:00');
            const dEnd = new Date(newEnd + 'T00:00:00');
            if (dStart > dEnd) {
                newEnd = newStart;
                setHistoryEndDate(newEnd);
            } else {
                const diffDays = Math.round((dEnd.getTime() - dStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                if (diffDays > 31) {
                    setHistoryDateWarning('Rentang tanggal maksimal 31 hari. Tanggal akhir disesuaikan.');
                    const adjustedEnd = new Date(dStart);
                    adjustedEnd.setDate(adjustedEnd.getDate() + 30);
                    newEnd = adjustedEnd.toISOString().split('T')[0];
                    setHistoryEndDate(newEnd);
                } else {
                    setHistoryDateWarning(null);
                }
            }
        }
        setHistoryStartDate(newStart);
        fetchHistoryData(newStart, newEnd);
    };

    const handleHistoryEndDateChange = (val: string) => {
        setHistoryPreset('custom');
        let newStart = historyStartDate;
        let newEnd = val;

        if (newStart && newEnd) {
            const dStart = new Date(newStart + 'T00:00:00');
            const dEnd = new Date(newEnd + 'T00:00:00');
            if (dStart > dEnd) {
                newStart = newEnd;
                setHistoryStartDate(newStart);
            } else {
                const diffDays = Math.round((dEnd.getTime() - dStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                if (diffDays > 31) {
                    setHistoryDateWarning('Rentang tanggal maksimal 31 hari. Tanggal awal disesuaikan.');
                    const adjustedStart = new Date(dEnd);
                    adjustedStart.setDate(adjustedStart.getDate() - 30);
                    newStart = adjustedStart.toISOString().split('T')[0];
                    setHistoryStartDate(newStart);
                } else {
                    setHistoryDateWarning(null);
                }
            }
        }
        setHistoryEndDate(newEnd);
        fetchHistoryData(newStart, newEnd);
    };

    const handleDownloadHistoryExcel = () => {
        const params = new URLSearchParams({
            market_id: String(currentMarketId),
            start_date: historyStartDate,
            end_date: historyEndDate,
        });
        window.location.href = `/api/public-history-excel?${params.toString()}`;
    };

    // Calculate period average for each commodity across historyRows
    const historyPeriodAvgs = useMemo(() => {
        const comms = historyCommodities.length > 0 ? historyCommodities : commoditiesList;
        const avgs: Record<number | string, number | null> = {};
        comms.forEach((c) => {
            let sum = 0;
            let count = 0;
            historyRows.forEach((r) => {
                const p = r.prices[c.id];
                if (p !== null && p !== undefined && Number(p) > 0) {
                    sum += Number(p);
                    count += 1;
                }
            });
            avgs[c.id] = count > 0 ? Math.round(sum / count) : null;
        });
        return avgs;
    }, [historyRows, historyCommodities, commoditiesList]);

    // Format % change and determine color styling:
    // - Penurunan (<0%): HIJAU
    // - Kenaikan 1-10%: KUNING
    // - Kenaikan >10%: MERAH
    const getChangeColorAndText = (current: number | null, base: number | null) => {
        if (current === null || base === null || base <= 0) {
            return {
                text: '-',
                bgClass: 'bg-white text-slate-400',
                style: 'background-color:#ffffff;color:#94a3b8;',
            };
        }
        const diff = current - base;
        const pct = (diff / base) * 100;
        const text = `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
        if (pct < 0) {
            // Penurunan: HIJAU
            return {
                text,
                bgClass: 'bg-emerald-100/90 text-emerald-900 font-black',
                style: 'background-color:#dcfce7;color:#15803d;',
            };
        } else if (pct > 0 && pct <= 10) {
            // Kenaikan 1-10%: KUNING
            return {
                text,
                bgClass: 'bg-amber-100/90 text-amber-900 font-black',
                style: 'background-color:#fef9c3;color:#a16207;',
            };
        } else if (pct > 10) {
            // Kenaikan >10%: MERAH
            return {
                text,
                bgClass: 'bg-rose-100/90 text-rose-950 font-black',
                style: 'background-color:#fee2e2;color:#b91c1c;',
            };
        }
        return {
            text: '0.0%',
            bgClass: 'bg-white text-slate-700 font-bold',
            style: 'background-color:#ffffff;color:#0f172a;',
        };
    };

    const handleDownloadHistoryPdf = () => {
        const marketObj = markets.find((m) => m.id === currentMarketId);
        const marketTitle = marketObj?.name || selectedMarketName || 'Pasar Daerah Indramayu';
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Mohon izinkan pop-up browser untuk mencetak / mendownload PDF.');
            return;
        }

        const commoditiesToRender = historyCommodities.length > 0 ? historyCommodities : commoditiesList;

        let tableHeaders = '<th>No</th><th>Tanggal</th>';
        commoditiesToRender.forEach((c) => {
            tableHeaders += `<th>${c.name}<br/><span style="font-weight:normal;font-size:7pt">(${c.unit})</span></th>`;
        });

        let tableRowsHtml = '';
        historyRows.forEach((r, idx) => {
            let cells = `<td style="text-align:center;font-weight:bold">${idx + 1}</td>`;
            cells += `<td style="white-space:nowrap;font-weight:bold">${r.formatted_date || r.date}</td>`;
            commoditiesToRender.forEach((c) => {
                const price = r.prices[c.id];
                const isAbove = r.is_above_het?.[c.id];
                const diff = r.diffs?.[c.id];
                const bgStyle = isAbove ? 'background-color:#fee2e2;color:#991b1b;font-weight:bold;' : '';
                let arrowHtml = '';
                if (diff === 'up') {
                    arrowHtml = '<span style="color:#e11d48;font-weight:bold;margin-right:2px">▲</span>';
                } else if (diff === 'down') {
                    arrowHtml = '<span style="color:#059669;font-weight:bold;margin-right:2px">▼</span>';
                }
                cells += `<td style="text-align:right;white-space:nowrap;${bgStyle}">${price ? arrowHtml + formatCurrency(price) : '-'}</td>`;
            });
            tableRowsHtml += `<tr>${cells}</tr>`;
        });

        // 1. Baris Rata-rata periode
        let avgRowHtml = '<td colspan="2" style="text-align:center;font-weight:bold;background-color:#f1f5f9;color:#0f172a;">Rata-rata</td>';
        commoditiesToRender.forEach((c) => {
            const avg = historyPeriodAvgs[c.id];
            avgRowHtml += `<td style="text-align:right;font-weight:bold;background-color:#f8fafc;white-space:nowrap;color:#0f172a;">${avg !== null ? formatCurrency(avg) : '-'}</td>`;
        });

        // 2. Baris Harga HET/HAP
        let hetRowHtml = '<td colspan="2" style="text-align:center;font-weight:bold;background-color:#f1f5f9;color:#0f172a;">Harga HET/HAP</td>';
        commoditiesToRender.forEach((c) => {
            const het = historyCommodityHets[c.id] ?? (historyRows[0]?.hets?.[c.id] ?? null);
            hetRowHtml += `<td style="text-align:right;font-weight:bold;background-color:#f8fafc;white-space:nowrap;color:#0f172a;">${het !== null && Number(het) > 0 ? formatCurrency(Number(het)) : '-'}</td>`;
        });

        // 3. Baris % terhadap HET/HAP
        let pctHetRowHtml = '<td colspan="2" style="text-align:center;font-weight:bold;background-color:#f1f5f9;color:#0f172a;">% thd HET/HAP</td>';
        commoditiesToRender.forEach((c) => {
            const avg = historyPeriodAvgs[c.id];
            const het = historyCommodityHets[c.id] ?? (historyRows[0]?.hets?.[c.id] ?? null);
            const res = getChangeColorAndText(avg, het ? Number(het) : null);
            pctHetRowHtml += `<td style="text-align:right;font-weight:bold;white-space:nowrap;${res.style}">${res.text}</td>`;
        });

        // 4. Baris Rata-rata Bulan Lalu
        const prevMonthLabelText = historyPrevMonthLabel ? ` (${historyPrevMonthLabel})` : '';
        let prevMonthRowHtml = `<td colspan="2" style="text-align:center;font-weight:bold;background-color:#f1f5f9;color:#0f172a;">Rata-rata Bln Lalu${prevMonthLabelText}</td>`;
        commoditiesToRender.forEach((c) => {
            const prevAvg = historyPrevMonthAvgs[c.id];
            prevMonthRowHtml += `<td style="text-align:right;font-weight:bold;background-color:#f8fafc;white-space:nowrap;color:#0f172a;">${prevAvg !== null && prevAvg !== undefined && Number(prevAvg) > 0 ? formatCurrency(Number(prevAvg)) : '-'}</td>`;
        });

        // 5. Baris % Kenaikan/Penurunan terhadap Bulan Lalu
        let pctMonthRowHtml = '<td colspan="2" style="text-align:center;font-weight:bold;background-color:#f1f5f9;color:#0f172a;">% vs Bln Lalu</td>';
        commoditiesToRender.forEach((c) => {
            const avg = historyPeriodAvgs[c.id];
            const prevAvg = historyPrevMonthAvgs[c.id];
            const res = getChangeColorAndText(avg, prevAvg ? Number(prevAvg) : null);
            pctMonthRowHtml += `<td style="text-align:right;font-weight:bold;white-space:nowrap;${res.style}">${res.text}</td>`;
        });

        const html = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8"/>
            <title>Historis Perkembangan Harga Pangan - ${marketTitle}</title>
            <style>
                @page {
                    size: landscape;
                    margin: 8mm 6mm;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                    margin: 0;
                    padding: 10px;
                    color: #0f172a;
                    font-size: 7.5pt;
                }
                .no-print {
                    margin-bottom: 12px;
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    background: #f1f5f9;
                    padding: 8px 12px;
                    border-radius: 8px;
                    border: 1px solid #cbd5e1;
                }
                .btn {
                    background: #006565;
                    color: white;
                    border: none;
                    padding: 6px 14px;
                    border-radius: 6px;
                    font-weight: bold;
                    font-size: 8.5pt;
                    cursor: pointer;
                }
                .btn-close {
                    background: #64748b;
                }
                .header {
                    text-align: center;
                    margin-bottom: 10px;
                    border-bottom: 2px solid #006565;
                    padding-bottom: 6px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 12pt;
                    font-weight: 800;
                    color: #0f172a;
                    text-transform: uppercase;
                }
                .header h2 {
                    margin: 2px 0 0 0;
                    font-size: 10pt;
                    font-weight: 700;
                    color: #006565;
                }
                .header p {
                    margin: 3px 0 0 0;
                    font-size: 7.5pt;
                    color: #475569;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid #cbd5e1;
                    padding: 3.5px 4px;
                    font-size: 7pt;
                }
                th {
                    background-color: #006565;
                    color: white;
                    font-weight: bold;
                    text-align: center;
                    vertical-align: middle;
                }
                tbody tr:nth-child(even) {
                    background-color: #f8fafc;
                }
                tfoot tr td {
                    font-size: 6.8pt;
                    padding: 3.5px 4px;
                }
                .footer {
                    margin-top: 10px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 7pt;
                    color: #64748b;
                }
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        padding: 0;
                    }
                }
            </style>
        </head>
        <body>
            <div class="no-print">
                <button class="btn" onclick="window.print()">🖨️ Cetak / Simpan sebagai PDF</button>
                <button class="btn btn-close" onclick="window.close()">Tutup</button>
                <span style="font-size: 8pt; color: #475569">Tips: Pada menu print browser, pilih <strong>Save as PDF</strong> dan orientasi <strong>Landscape</strong>.</span>
            </div>
            <div class="header">
                <h1>Pemerintah Kabupaten Indramayu</h1>
                <h2>Dinas Ketahanan Pangan dan Pertanian</h2>
                <p><strong>Tabel Historis Perkembangan Harga Pangan Tingkat Konsumen</strong> | Pasar: <strong>${marketTitle}</strong> | Periode: <strong>${historyStartDate} s/d ${historyEndDate}</strong></p>
            </div>
            <table>
                <thead>
                    <tr>${tableHeaders}</tr>
                </thead>
                <tbody>
                    ${tableRowsHtml}
                </tbody>
                <tfoot>
                    <tr style="border-top: 2px solid #006565;">${avgRowHtml}</tr>
                    <tr>${hetRowHtml}</tr>
                    <tr>${pctHetRowHtml}</tr>
                    <tr>${prevMonthRowHtml}</tr>
                    <tr>${pctMonthRowHtml}</tr>
                </tfoot>
            </table>
            <div class="legend" style="margin-top: 8px; font-size: 6.8pt; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; border-top: 1px dashed #cbd5e1; padding-top: 5px;">
                <span><strong>Keterangan Tabel:</strong></span>
                <span style="display:inline-flex;align-items:center;gap:3px;"><span style="display:inline-block;width:9px;height:9px;background:#fee2e2;border:1px solid #fca5a5;border-radius:2px;"></span> Harga Di Atas HET</span>
                <span style="display:inline-flex;align-items:center;gap:3px;"><span style="color:#e11d48;font-weight:bold;">▲</span> Naik vs Kemarin</span>
                <span style="display:inline-flex;align-items:center;gap:3px;"><span style="color:#059669;font-weight:bold;">▼</span> Turun vs Kemarin</span>
                <span style="display:inline-flex;align-items:center;gap:3px;"><span style="display:inline-block;width:9px;height:9px;background:#dcfce7;border:1px solid #86efac;border-radius:2px;"></span> Hijau: Penurunan</span>
                <span style="display:inline-flex;align-items:center;gap:3px;"><span style="display:inline-block;width:9px;height:9px;background:#fef9c3;border:1px solid #fde047;border-radius:2px;"></span> Kuning: Kenaikan (1 - 10%)</span>
                <span style="display:inline-flex;align-items:center;gap:3px;"><span style="display:inline-block;width:9px;height:9px;background:#fee2e2;border:1px solid #fca5a5;border-radius:2px;"></span> Merah: Kenaikan (&gt; 10%)</span>
            </div>
            <div class="footer">
                <span>DKPP Kabupaten Indramayu &copy; ${new Date().getFullYear()}</span>
                <span>Dicetak pada: ${new Date().toLocaleString('id-ID')}</span>
            </div>
        </body>
        </html>
        `;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 400);
    };

    const handleSendWhatsapp = (row: HistoryRow) => {
        const marketObj = markets.find((m) => m.id === currentMarketId);
        const marketNameText = marketObj?.name || selectedMarketName || 'Pasar Daerah Indramayu';
        const commoditiesToRender = historyCommodities.length > 0 ? historyCommodities : commoditiesList;
        const dateFormatted = row.formatted_date || row.date;
        const dayName = row.day_name || '';

        let text = `📊 *LAPORAN PERKEMBANGAN HARGA PANGAN*\n`;
        text += `🏛️ *DKPP KABUPATEN INDRAMAYU*\n`;
        text += `━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `📍 *Pasar:* ${marketNameText}\n`;
        text += `📅 *Tanggal:* ${dayName ? dayName + ', ' : ''}${dateFormatted}\n`;
        text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

        commoditiesToRender.forEach((comm, idx) => {
            const price = row.prices[comm.id];
            const het = row.hets?.[comm.id];

            let icon = '⚪';
            let statusText = '';

            if (price !== null && price !== undefined && Number(price) > 0) {
                const numPrice = Number(price);
                const priceStr = `Rp ${numPrice.toLocaleString('id-ID')}`;

                if (het !== null && het !== undefined && Number(het) > 0) {
                    const numHet = Number(het);
                    const hetStr = `Rp ${numHet.toLocaleString('id-ID')}`;
                    const diff = numPrice - numHet;
                    const pct = (diff / numHet) * 100;

                    if (numPrice <= numHet) {
                        icon = '🟢';
                        if (diff < 0) {
                            statusText = `Di Bawah HET (-${Math.abs(pct).toFixed(1)}% / -Rp ${Math.abs(diff).toLocaleString('id-ID')})`;
                        } else {
                            statusText = `Sesuai HET (0.0% / Rp 0)`;
                        }
                    } else {
                        const diffStr = `+Rp ${diff.toLocaleString('id-ID')}`;
                        const pctStr = `+${pct.toFixed(1)}%`;

                        if (pct <= 10) {
                            icon = '🟡';
                            statusText = `Di Atas HET 1-10% (${pctStr} / ${diffStr})`;
                        } else {
                            icon = '🔴';
                            statusText = `Di Atas HET >10% (${pctStr} / ${diffStr})`;
                        }
                    }

                    text += `${icon} *${idx + 1}. ${comm.name}* (${comm.unit})\n`;
                    text += `   • Harga: *${priceStr}* | HET: ${hetStr}\n`;
                    text += `   • Status: ${statusText}\n\n`;
                } else {
                    icon = '⚪';
                    text += `${icon} *${idx + 1}. ${comm.name}* (${comm.unit})\n`;
                    text += `   • Harga: *${priceStr}* (Non-HET)\n\n`;
                }
            } else {
                text += `⚪ *${idx + 1}. ${comm.name}* (${comm.unit})\n`;
                text += `   • Harga: *Tidak Ada Data*\n\n`;
            }
        });

        text += `━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `*Keterangan Status HET:*\n`;
        text += `🟢 Sesuai / Di Bawah HET\n`;
        text += `🟡 Di Atas HET (1% - 10%)\n`;
        text += `🔴 Di Atas HET (>10%)\n`;
        text += `⚪ Komoditas Non-HET\n\n`;
        text += `🌐 *Portal Informasi Pangan:*\n`;
        text += `${typeof window !== 'undefined' ? window.location.origin : ''}/harga-konsumen?market_id=${currentMarketId}&date=${row.date}\n`;

        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
    };

    // Filter daftar komoditas hari ini yang statusnya di atas HET
    const aboveHetCommodities = useMemo(() => {
        return commoditiesList
            .filter((item) => {
                if (
                    item.today_price === null ||
                    item.het_price === null ||
                    item.het_price <= 0
                ) {
                    return false;
                }
                return item.today_price > item.het_price;
            })
            .map((item) => {
                const diff = (item.today_price ?? 0) - (item.het_price ?? 0);
                const pct = ((item.het_price ?? 0) > 0 ? (diff / (item.het_price ?? 1)) * 100 : 0);
                // Status warna: kuning (1-10%), merah (> 10% / 11%+)
                const isRed = pct > 10;
                return {
                    ...item,
                    diff,
                    pct,
                    isRed,
                };
            })
            .sort((a, b) => b.pct - a.pct); // Urutkan kenaikan tertinggi lebih dulu
    }, [commoditiesList]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(val);
    };

    // Hero statistical metrics computed from commoditiesList
    const heroStats = useMemo(() => {
        let countUp = 0;
        let countDown = 0;
        let countStable = 0;
        let withHetCount = 0;
        let compliedHetCount = 0;

        commoditiesList.forEach((c) => {
            if (c.today_price !== null && c.yesterday_price !== null) {
                if (c.today_price > c.yesterday_price) countUp++;
                else if (c.today_price < c.yesterday_price) countDown++;
                else countStable++;
            } else if (c.today_price !== null) {
                countStable++;
            }

            if (c.het_price !== null && c.het_price > 0 && c.today_price !== null) {
                withHetCount++;
                if (c.today_price <= c.het_price) {
                    compliedHetCount++;
                }
            }
        });

        const hetComplianceRate =
            withHetCount > 0
                ? Math.round((compliedHetCount / withHetCount) * 100)
                : 100;

        // Key spotlight commodities for quick ticker / radar
        const spotlightNames = [
            'Beras Premium',
            'Cabai Rawit Merah',
            'Minyak Goreng Kemasan',
            'Bawang Merah',
            'Daging Sapi',
        ];
        const spotlights = commoditiesList
            .filter((c) =>
                spotlightNames.some((n) =>
                    c.name.toLowerCase().includes(n.toLowerCase()),
                ),
            )
            .slice(0, 3);

        return {
            total: commoditiesList.length,
            countUp,
            countDown,
            countStable,
            withHetCount,
            compliedHetCount,
            hetComplianceRate,
            spotlights,
        };
    }, [commoditiesList]);

    // Share Radar Pasar via WhatsApp
    const handleShareRadarWhatsApp = () => {
        const marketNameText =
            selectedMarketName || marketName || 'Pasar Daerah Indramayu';
        const dateText = formatIndoDate(currentDate) || 'Hari Ini';
        let text = `📢 *RINGKASAN HARGA PANGAN KONSUMEN*\n`;
        text += `🏛️ DKPP KABUPATEN INDRAMAYU\n`;
        text += `📍 Pasar: ${marketNameText}\n`;
        text += `📅 Tanggal: ${dateText}\n`;
        text += `━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `📊 *Kondisi 25 Komoditas:*\n`;
        text += `• Tetap/Stabil: ${heroStats.countStable} komoditas\n`;
        text += `• Kenaikan: ${heroStats.countUp} komoditas\n`;
        text += `• Penurunan: ${heroStats.countDown} komoditas\n`;
        text += `• Kepatuhan HET: ${heroStats.hetComplianceRate}%\n`;
        if (aboveHetCommodities.length > 0) {
            text += `\n⚠️ *Di Atas HET (${aboveHetCommodities.length} komoditas):*\n`;
            aboveHetCommodities.slice(0, 5).forEach((item) => {
                text += `• ${item.name}: ${formatCurrency(item.today_price ?? 0)} (HET: ${formatCurrency(item.het_price ?? 0)})\n`;
            });
            if (aboveHetCommodities.length > 5) {
                text += `  ...dan ${aboveHetCommodities.length - 5} komoditas lainnya\n`;
            }
        }
        text += `━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `🌐 Cek selengkapnya:\n${typeof window !== 'undefined' ? window.location.origin : ''}/harga-konsumen?market_id=${currentMarketId}&date=${currentDate}\n`;
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
    };

    // Helper penentu warna grafik batang berdasarkan persentase selisih terhadap batas HET:
    // - Hijau (#006565): harga <= HET atau tidak memiliki HET (normal)
    // - Kuning (#f59e0b): harga melebihi HET 1 - 10%
    // - Merah (#ef4444): harga melebihi HET > 10%
    const getBarColor = (entry: any) => {
        if (
            entry?.price === null ||
            entry?.price === undefined ||
            entry?.het === null ||
            entry?.het === undefined ||
            Number(entry?.het) <= 0
        ) {
            return '#006565';
        }
        const diff = Number(entry.price) - Number(entry.het);
        if (diff <= 0) {
            return '#006565';
        }
        const pct = (diff / Number(entry.het)) * 100;
        if (pct > 10) {
            return '#ef4444'; // Merah (> 10%)
        }
        return '#f59e0b'; // Kuning (1 - 10%)
    };

    // Group all commodities into slides (12 commodities per slide: 6 cols x 2 rows).
    // Pre-rendering and keeping slides mounted in the DOM avoids unmounting elements and reloading images from server.
    const commoditySlides = useMemo(() => {
        const slides: ConsumerCommodityItem[][] = [];
        for (let i = 0; i < commoditiesList.length; i += CONSUMER_ITEMS_PER_SLIDE) {
            slides.push(commoditiesList.slice(i, i + CONSUMER_ITEMS_PER_SLIDE));
        }
        return slides;
    }, [commoditiesList]);

    // Card styling and HET status calculation based on user requirements:
    // - Putih: harga di bawah HET / sesuai HET / tidak ada HET (default putih)
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

        // 2. Apabila harga di bawah atau sesuai HET: card berwarna default putih
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
                    'bg-white border-slate-200/90 text-slate-900 hover:border-slate-300 hover:shadow-md',
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
                {/* ============================================================== */}
                {/* 1. TOP NAVBAR - MODERN & KEKINIAN (DKPP INDRAMAYU)             */}
                {/* ============================================================== */}
                <PortalNavbar activePage="harga-konsumen" />

                {/* ============================================================== */}
                {/* 2. HERO BANNER - MODERN & KEKINIAN (DKPP SATU DATA PANGAN)    */}
                {/* ============================================================== */}
                <section
                    className="relative overflow-hidden bg-gradient-to-br from-[#003737] via-[#005252] to-[#012626] text-white border-b border-emerald-950/40 shadow-xl"
                    onMouseEnter={() => setIsHeroHovered(true)}
                    onMouseLeave={() => setIsHeroHovered(false)}
                    aria-label="Hero Banner Pusat Data Harga Pangan"
                >
                    {/* Glowing ambient orbs & mesh background effect */}
                    <div className="pointer-events-none absolute -top-40 -left-20 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
                    <div className="pointer-events-none absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-amber-400/15 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-teal-300/15 blur-3xl" />
                    <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:24px_24px]" />

                    <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                        {/* Top Context & Live Status Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-[11px] font-bold tracking-wider text-emerald-200 uppercase backdrop-blur-md">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                                    </span>
                                    <span>Pusat Data Pangan Real-Time</span>
                                </span>
                                <span className="hidden sm:inline-flex text-xs font-semibold text-emerald-200/70">
                                    DKPP Kabupaten Indramayu
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-emerald-100/90">
                                <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1 backdrop-blur-md">
                                    <MapPin className="h-3.5 w-3.5 text-emerald-300" />
                                    <span className="font-semibold text-white">
                                        {selectedMarketName || marketName || 'Pasar Daerah Indramayu'}
                                    </span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1 backdrop-blur-md">
                                    <Calendar className="h-3.5 w-3.5 text-emerald-300" />
                                    <span>{formatIndoDate(currentDate) || 'Hari Ini'}</span>
                                </span>
                            </div>
                        </div>

                        {/* Main Grid: Left Slider Content & Right Radar Card */}
                        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                            {/* Left Column: Interactive Banner Slide */}
                            <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between">
                                {/* Slide 0: Stabilitas 25 Komoditi Pangan */}
                                {heroSlide === 0 && (
                                    <div className="animate-in fade-in zoom-in-95 duration-500">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3.5 py-1 text-xs font-bold text-emerald-200 backdrop-blur-md">
                                            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                                            <span>PORTAL PEMANTAUAN HARGA KONSUMEN</span>
                                        </div>

                                        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight sm:leading-tight">
                                            Stabilitas Harga Pangan,{' '}
                                            <span className="bg-gradient-to-r from-emerald-300 via-teal-100 to-amber-200 bg-clip-text text-transparent">
                                                Kesejahteraan Warga
                                            </span>{' '}
                                            Indramayu
                                        </h1>

                                        <p className="mt-4 max-w-2xl text-sm font-medium text-emerald-100/90 sm:text-base leading-relaxed">
                                            Monitoring pergerakan harga eceran harian 25 komoditas pangan pokok, evaluasi kepatuhan Harga Eceran Tertinggi (HET), dan deteksi dini lonjakan disparitas pasar di Kabupaten Indramayu.
                                        </p>

                                        {/* Action Buttons */}
                                        <div className="mt-6 flex flex-wrap items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => scrollToSection('komoditas-section')}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-[#006565] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] hover:from-emerald-400 hover:to-[#005555] active:scale-[0.98] cursor-pointer"
                                            >
                                                <Store className="h-4 w-4" />
                                                <span>Jelajahi 25 Komoditas</span>
                                                <ArrowDown className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => scrollToSection('grafik-section')}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98] cursor-pointer"
                                            >
                                                <LineChart className="h-4 w-4 text-emerald-300" />
                                                <span>Tren &amp; Fluktuasi</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => scrollToSection('rekap-section')}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98] cursor-pointer"
                                            >
                                                <FileSpreadsheet className="h-4 w-4 text-teal-300" />
                                                <span>Rekapitulasi</span>
                                            </button>
                                        </div>

                                        {/* Dynamic Mini Metric Pills */}
                                        <div className="mt-7 flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                                                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                                                <span>25 Komoditas Terpantau</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                                                <span className="h-2 w-2 rounded-full bg-teal-400" />
                                                <span>{heroStats.countStable} Stabil</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                                                <span className="h-2 w-2 rounded-full bg-rose-400" />
                                                <span>{heroStats.countUp} Naik</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                                <span>{heroStats.countDown} Turun</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-200">
                                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                                                <span>{heroStats.hetComplianceRate}% Sesuai HET</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Slide 1: Lumbung Padi & Pengendalian Inflasi */}
                                {heroSlide === 1 && (
                                    <div className="animate-in fade-in zoom-in-95 duration-500">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/15 px-3.5 py-1 text-xs font-bold text-amber-200 backdrop-blur-md">
                                            <Wheat className="h-3.5 w-3.5 text-amber-300" />
                                            <span>LUMBUNG PADI NASIONAL &amp; KETAHANAN PANGAN</span>
                                        </div>

                                        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight sm:leading-tight">
                                            Kawal Pasokan Pokok &amp;{' '}
                                            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
                                                Perlindungan Daya Beli
                                            </span>
                                        </h1>

                                        <p className="mt-4 max-w-2xl text-sm font-medium text-emerald-100/90 sm:text-base leading-relaxed">
                                            Kabupaten Indramayu sebagai lumbung pangan utama berkomitmen menjaga ketersediaan Beras SPHP, aneka cabai, minyak goreng, dan daging melalui sinergi Bapanas, Bulog, serta TPID.
                                        </p>

                                        {/* Action Buttons */}
                                        <div className="mt-6 flex flex-wrap items-center gap-3">
                                            <Link
                                                href="/harga-produsen"
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-amber-950/40 transition-all hover:scale-[1.02] hover:from-amber-400 hover:to-amber-600 active:scale-[0.98]"
                                            >
                                                <Wheat className="h-4 w-4" />
                                                <span>Portal Harga Produsen</span>
                                                <ArrowUpRight className="h-4 w-4" />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => scrollToSection('het-warning-section')}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/15 px-5 py-3 text-xs sm:text-sm font-bold text-amber-200 backdrop-blur-md transition-all hover:bg-amber-500/25 active:scale-[0.98] cursor-pointer"
                                            >
                                                <AlertTriangle className="h-4 w-4 text-amber-300" />
                                                <span>Peringatan Batas HET</span>
                                            </button>
                                        </div>

                                        {/* Value Badges */}
                                        <div className="mt-7 flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-100">
                                                <span>🌾 Lumbung Beras Nasional</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-100">
                                                <span>⚖️ Evaluasi HET Bapanas &amp; Kemendag</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-100">
                                                <span>🛡️ Deteksi Lonjakan Cepat TPID</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Slide 2: Transparansi Satu Data & Rekapitulasi */}
                                {heroSlide === 2 && (
                                    <div className="animate-in fade-in zoom-in-95 duration-500">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/15 px-3.5 py-1 text-xs font-bold text-teal-200 backdrop-blur-md">
                                            <ShieldCheck className="h-3.5 w-3.5 text-teal-300" />
                                            <span>SATU DATA PANGAN INDRAMAYU</span>
                                        </div>

                                        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight sm:leading-tight">
                                            Akses Data Terbuka,{' '}
                                            <span className="bg-gradient-to-r from-teal-200 via-cyan-100 to-emerald-200 bg-clip-text text-transparent">
                                                Laporan Resmi Siap Unduh
                                            </span>
                                        </h1>

                                        <p className="mt-4 max-w-2xl text-sm font-medium text-emerald-100/90 sm:text-base leading-relaxed">
                                            Dapatkan transparansi data perkembangan harga pangan harian, mingguan, dan bulanan. Tersedia fitur ekspor PDF resmi, spreadsheet Excel, serta share laporan cepat via WhatsApp.
                                        </p>

                                        {/* Action Buttons */}
                                        <div className="mt-6 flex flex-wrap items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => scrollToSection('rekap-section')}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-teal-950/40 transition-all hover:scale-[1.02] hover:from-teal-400 hover:to-emerald-500 active:scale-[0.98] cursor-pointer"
                                            >
                                                <Download className="h-4 w-4" />
                                                <span>Buka Lembar Rekap &amp; Ekspor</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => scrollToSection('grafik-section')}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98] cursor-pointer"
                                            >
                                                <BarChart3 className="h-4 w-4 text-cyan-300" />
                                                <span>Grafik Dinamis Harian</span>
                                            </button>
                                        </div>

                                        {/* Value Badges */}
                                        <div className="mt-7 flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-teal-400/20 bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-100">
                                                <FileSpreadsheet className="h-3.5 w-3.5 text-teal-300" />
                                                <span>Ekspor PDF &amp; Excel Resmi</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-teal-400/20 bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-100">
                                                <LineChart className="h-3.5 w-3.5 text-teal-300" />
                                                <span>Analisis MoM &amp; Historis</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-teal-400/20 bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-100">
                                                <WhatsAppIcon className="h-3.5 w-3.5 fill-current text-emerald-300" />
                                                <span>Integrasi Ringkasan WhatsApp</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Modern Glassmorphic "Radar Pasar Hari Ini" Card */}
                            <div className="lg:col-span-5 xl:col-span-4">
                                <div className="rounded-3xl border border-white/20 bg-white/10 p-5 sm:p-6 backdrop-blur-xl shadow-2xl ring-1 ring-white/10">
                                    {/* Header Radar Card */}
                                    <div className="flex items-center justify-between border-b border-white/15 pb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                                                </span>
                                                <span className="text-[10px] font-extrabold tracking-wider text-emerald-200 uppercase">
                                                    Radar Pasar Terkini
                                                </span>
                                            </div>
                                            <h3 className="mt-1 text-sm font-bold text-white line-clamp-1">
                                                {selectedMarketName || marketName || 'Pasar Daerah Indramayu'}
                                            </h3>
                                        </div>

                                        {aboveHetCommodities.length > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => scrollToSection('het-warning-section')}
                                                className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/40 bg-rose-500/25 px-2.5 py-1 text-[11px] font-bold text-rose-200 transition-colors hover:bg-rose-500/40 cursor-pointer"
                                                title="Klik untuk melihat daftar komoditas di atas HET"
                                            >
                                                <AlertTriangle className="h-3 w-3 text-rose-300" />
                                                <span>{aboveHetCommodities.length} Di Atas HET</span>
                                            </button>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/25 px-2.5 py-1 text-[11px] font-bold text-emerald-200">
                                                <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                                                <span>100% Sesuai HET</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Quick 3-Gauge Price Movement */}
                                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-xs">
                                            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-teal-200">
                                                <Minus className="h-3 w-3 text-teal-300" />
                                                <span>Stabil</span>
                                            </div>
                                            <div className="mt-1 text-lg font-black text-white">
                                                {heroStats.countStable}
                                            </div>
                                            <div className="text-[10px] text-emerald-100/70">komoditas</div>
                                        </div>

                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-xs">
                                            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-rose-200">
                                                <TrendingUp className="h-3 w-3 text-rose-400" />
                                                <span>Naik</span>
                                            </div>
                                            <div className="mt-1 text-lg font-black text-white">
                                                {heroStats.countUp}
                                            </div>
                                            <div className="text-[10px] text-emerald-100/70">komoditas</div>
                                        </div>

                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-xs">
                                            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-200">
                                                <TrendingDown className="h-3 w-3 text-emerald-400" />
                                                <span>Turun</span>
                                            </div>
                                            <div className="mt-1 text-lg font-black text-white">
                                                {heroStats.countDown}
                                            </div>
                                            <div className="text-[10px] text-emerald-100/70">komoditas</div>
                                        </div>
                                    </div>

                                    {/* Spotlight Komoditas Strategis Hari Ini */}
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-200/80 uppercase tracking-wider mb-2">
                                            <span>Spotlight Komoditas</span>
                                            <span className="text-[10px] text-emerald-200/60 lowercase">vs kemarin</span>
                                        </div>

                                        <div className="space-y-2">
                                            {heroStats.spotlights.map((item) => {
                                                const diff =
                                                    item.today_price !== null && item.yesterday_price !== null
                                                        ? item.today_price - item.yesterday_price
                                                        : 0;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition-all hover:bg-white/10"
                                                    >
                                                        <div className="min-w-0 flex-1 pr-2">
                                                            <div className="text-xs font-bold text-white truncate">
                                                                {item.name}
                                                            </div>
                                                            <div className="text-[10px] text-emerald-100/60">
                                                                per {item.unit}
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <div className="text-xs font-mono font-black text-white">
                                                                {item.today_price !== null
                                                                    ? formatCurrency(item.today_price)
                                                                    : '-'}
                                                            </div>
                                                            <div className="text-[10px] font-semibold">
                                                                {diff > 0 ? (
                                                                    <span className="text-rose-300 font-mono">
                                                                        +{formatCurrency(diff)}
                                                                    </span>
                                                                ) : diff < 0 ? (
                                                                    <span className="text-emerald-300 font-mono">
                                                                        {formatCurrency(diff)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-teal-200/80">
                                                                        Stabil
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Card Footer Actions */}
                                    <div className="mt-5 flex items-center gap-2 pt-3 border-t border-white/15">
                                        <button
                                            type="button"
                                            onClick={() => scrollToSection('komoditas-section')}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 py-2.5 px-3 text-xs font-bold text-white transition-all cursor-pointer"
                                        >
                                            <span>Lihat Semua 25 Komoditi</span>
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleShareRadarWhatsApp}
                                            className="inline-flex items-center justify-center rounded-xl bg-emerald-500/30 hover:bg-emerald-500/50 p-2.5 text-emerald-200 border border-emerald-400/30 transition-all cursor-pointer"
                                            title="Bagikan Ringkasan Radar via WhatsApp"
                                            aria-label="Bagikan Ringkasan Radar via WhatsApp"
                                        >
                                            <WhatsAppIcon className="h-4 w-4 fill-current" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Banner Navigation Bar: Dots, Counter, and Controls */}
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-4">
                            {/* Slide Indicator Pills */}
                            <div className="flex items-center gap-2">
                                {[0, 1, 2].map((idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setHeroSlide(idx)}
                                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                            heroSlide === idx
                                                ? 'w-8 bg-gradient-to-r from-emerald-300 to-teal-200 shadow-md shadow-emerald-400/30'
                                                : 'w-2 bg-white/30 hover:bg-white/60'
                                        }`}
                                        aria-label={`Pindah ke banner slide ${idx + 1}`}
                                    />
                                ))}
                                <span className="ml-2 text-xs font-mono font-medium text-emerald-200/80">
                                    0{heroSlide + 1} / 0{TOTAL_HERO_SLIDES}
                                </span>
                            </div>

                            {/* Banner Navigation Controls */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setHeroSlide(
                                            (prev) =>
                                                (prev - 1 + TOTAL_HERO_SLIDES) %
                                                TOTAL_HERO_SLIDES,
                                        )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/25 active:scale-95 cursor-pointer"
                                    aria-label="Slide banner sebelumnya"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsHeroPlaying(!isHeroPlaying)}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/25 active:scale-95 cursor-pointer"
                                    aria-label={
                                        isHeroPlaying
                                            ? 'Jeda rotasi otomatis'
                                            : 'Putar rotasi otomatis'
                                    }
                                    title={
                                        isHeroPlaying
                                            ? 'Jeda rotasi otomatis'
                                            : 'Putar rotasi otomatis'
                                    }
                                >
                                    {isHeroPlaying ? (
                                        <Pause className="h-3.5 w-3.5" />
                                    ) : (
                                        <Play className="h-3.5 w-3.5 fill-current" />
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setHeroSlide(
                                            (prev) => (prev + 1) % TOTAL_HERO_SLIDES,
                                        )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/25 active:scale-95 cursor-pointer"
                                    aria-label="Slide banner berikutnya"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================== */}
                {/* 3. HARGA KONSUMEN - 25 KOMODITI CARD SLIDER                    */}
                {/* ============================================================== */}
                <main id="komoditas-section" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
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
                                    <span className="h-3.5 w-3.5 rounded-full bg-white border-2 border-slate-400 shadow-xs" />
                                    <span className="font-bold text-slate-800">Putih:</span>
                                    <span className="text-slate-600">Sesuai / Di Bawah HET</span>
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
                                    const startItem = idx * CONSUMER_ITEMS_PER_SLIDE + 1;
                                    const endItem = Math.min(
                                        (idx + 1) * CONSUMER_ITEMS_PER_SLIDE,
                                        commoditiesList.length,
                                    );
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

                    {/* Cards Grid: 6 Kolom x 2 Baris (12 card per slide) */}
                    <div
                        className="mt-6"
                        onMouseEnter={() => setIsSliderHovered(true)}
                        onMouseLeave={() => setIsSliderHovered(false)}
                    >
                        {commoditySlides.map((slideItems, slideIdx) => {
                            const isActive = slideIdx === consumerSlide;
                            return (
                                <div
                                    key={slideIdx}
                                    className={
                                        isActive
                                            ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 animate-in fade-in duration-200'
                                            : 'hidden'
                                    }
                                    aria-hidden={!isActive}
                                >
                                    {slideItems.map((item) => {
                                        const hetInfo = getCommodityHetInfo(item);
                                        const yestInfo = getYesterdayDiff(item);

                                        return (
                                            <div
                                                key={item.id}
                                                className={`group relative flex flex-col justify-between rounded-2xl border-2 p-2.5 sm:p-3 transition-all duration-200 shadow-xs hover:shadow-md ${hetInfo.cardBgClass}`}
                                            >
                                                {/* Card Top: Image Showcase & Floating Badges */}
                                                <div>
                                                    <div className="relative mb-2.5 aspect-[16/11] w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 shadow-inner">
                                                        {item.image ? (
                                                            <CachedCommodityImage
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="h-full w-full object-contain p-2.5 transition-transform duration-300 group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-amber-50/60 via-slate-50 to-emerald-50/50 text-slate-400">
                                                                <Wheat className="h-8 w-8 stroke-[1.5] text-amber-500/70 mb-0.5 transition-transform duration-300 group-hover:scale-110" />
                                                                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                                                                    {item.category || 'Pangan'}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Floating Category Tag */}
                                                        <div className="absolute top-1.5 left-1.5">
                                                            <span className="inline-block truncate max-w-[95px] rounded-md bg-white/95 dark:bg-slate-900/90 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-slate-700 dark:text-slate-200 uppercase shadow-2xs backdrop-blur-xs">
                                                                {item.category || `Komoditas #${item.id}`}
                                                            </span>
                                                        </div>

                                                        {/* Floating HET Pill Badge */}
                                                        <div className="absolute top-1.5 right-1.5">
                                                            <span
                                                                className={`inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold shadow-2xs backdrop-blur-xs ${hetInfo.badgeClass}`}
                                                            >
                                                                {hetInfo.badgeText}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Commodity Name */}
                                                    <h4
                                                        className="line-clamp-1 text-sm font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-[#006565]"
                                                        title={item.name}
                                                    >
                                                        {item.name}
                                                    </h4>

                                                    {/* Today's Price */}
                                                    <div className="mt-1.5 flex items-baseline gap-1">
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
                            );
                        })}
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

                    {/* ============================================================== */}
                    {/* 4. DUA KOLOM: 70% GRAFIK HARGA & 30% DAFTAR DI ATAS HET        */}
                    {/* ============================================================== */}
                    <div id="grafik-section" className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-10 items-start scroll-mt-20">
                        {/* ---------------------------------------------------------- */}
                        {/* KOLOM KIRI (70%): GRAFIK PERKEMBANGAN HARGA PANGAN          */}
                        {/* ---------------------------------------------------------- */}
                        <div className="lg:col-span-7 space-y-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                                {/* Header Grafik & Tabulasi */}
                                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#006565]">
                                            {chartTab === 'daily' ? (
                                                <LineChart className="h-3.5 w-3.5" />
                                            ) : (
                                                <BarChart3 className="h-3.5 w-3.5" />
                                            )}
                                            <span>Tren Perkembangan Harga</span>
                                        </div>
                                        <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">
                                            Grafik Perkembangan Harga Pangan
                                        </h3>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Pantau fluktuasi harga komoditas dan perbandingannya terhadap batas HET di{' '}
                                            <span className="font-semibold text-slate-700">
                                                {markets.find((m) => m.id === currentMarketId)?.name || selectedMarketName || marketName}
                                            </span>
                                        </p>
                                    </div>

                                    {/* 3 Tabulasi: Harian, Mingguan, Bulanan */}
                                    <div className="inline-flex rounded-xl bg-slate-100 p-1">
                                        <button
                                            type="button"
                                            onClick={() => setChartTab('daily')}
                                            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                                                chartTab === 'daily'
                                                    ? 'bg-white text-[#006565] shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            Grafik Harian
                                            <span className="ml-1 text-[10px] font-normal opacity-75">(31 Hari)</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setChartTab('weekly')}
                                            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                                                chartTab === 'weekly'
                                                    ? 'bg-white text-[#006565] shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            Grafik Mingguan
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setChartTab('monthly')}
                                            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                                                chartTab === 'monthly'
                                                    ? 'bg-white text-[#006565] shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            Grafik Bulanan
                                        </button>
                                    </div>
                                </div>

                                {/* Controls & Filter Bar Sesuai Tabulasi */}
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50/80 p-3 text-xs border border-slate-100">
                                    {/* Filter Komoditas (Tersedia di semua tabulasi) */}
                                    <div className="flex items-center gap-2">
                                        <label htmlFor="chart-commodity" className="font-bold text-slate-600 shrink-0">
                                            Komoditas:
                                        </label>
                                        <select
                                            id="chart-commodity"
                                            value={chartCommodityId}
                                            onChange={(e) => setChartCommodityId(Number(e.target.value))}
                                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-xs focus:border-[#006565] focus:outline-none"
                                        >
                                            {commoditiesList.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} ({c.unit})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filter Khusus Tab 1: Harian (Rentang tanggal, maks 31 hari) */}
                                    {chartTab === 'daily' && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-bold text-slate-600">Rentang (Maks 31 Hari):</span>
                                            <div className="flex items-center gap-1.5">
                                                <input
                                                    type="date"
                                                    value={dailyStartDate}
                                                    onChange={(e) => handleDailyStartDateChange(e.target.value)}
                                                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-xs focus:border-[#006565] focus:outline-none"
                                                />
                                                <span className="text-slate-400">s/d</span>
                                                <input
                                                    type="date"
                                                    value={dailyEndDate}
                                                    onChange={(e) => handleDailyEndDateChange(e.target.value)}
                                                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-xs focus:border-[#006565] focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Filter Khusus Tab 2: Mingguan (Filter Bulan & Tahun) */}
                                    {chartTab === 'weekly' && (
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-slate-600">Bulan:</span>
                                                <select
                                                    value={weeklyMonth}
                                                    onChange={(e) => setWeeklyMonth(Number(e.target.value))}
                                                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs focus:border-[#006565] focus:outline-none"
                                                >
                                                    {[
                                                        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                                                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
                                                    ].map((mName, i) => (
                                                        <option key={i + 1} value={i + 1}>
                                                            {mName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-slate-600">Tahun:</span>
                                                <select
                                                    value={weeklyYear}
                                                    onChange={(e) => setWeeklyYear(Number(e.target.value))}
                                                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs focus:border-[#006565] focus:outline-none"
                                                >
                                                    {[2024, 2025, 2026, 2027].map((y) => (
                                                        <option key={y} value={y}>
                                                            {y}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* Filter Khusus Tab 3: Bulanan (Filter Tahun saja) */}
                                    {chartTab === 'monthly' && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-slate-600">Tahun:</span>
                                            <select
                                                value={monthlyYear}
                                                onChange={(e) => setMonthlyYear(Number(e.target.value))}
                                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs focus:border-[#006565] focus:outline-none"
                                            >
                                                {[2024, 2025, 2026, 2027].map((y) => (
                                                    <option key={y} value={y}>
                                                        {y}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Indikator Status Warna Batang HET (Mingguan & Bulanan) */}
                                    {chartTab !== 'daily' && (
                                        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-2.5 py-1 text-[11px] border border-slate-200/80 shadow-2xs">
                                            <span className="font-bold text-slate-600">Status HET:</span>
                                            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                                <span className="h-2 w-2 rounded-full bg-[#006565]" />
                                                Normal
                                            </span>
                                            <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                                                <span className="h-2 w-2 rounded-full bg-amber-500" />
                                                Kuning (1-10%)
                                            </span>
                                            <span className="inline-flex items-center gap-1 font-medium text-rose-700">
                                                <span className="h-2 w-2 rounded-full bg-rose-500" />
                                                Merah (&gt;10%)
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Area Canvas Grafik */}
                                <div className="mt-6 h-[340px] w-full overflow-x-auto">
                                    <div
                                        className="h-full w-full"
                                        style={{
                                            minWidth: chartTab === 'monthly' ? '540px' : chartTab === 'daily' ? '540px' : '100%',
                                        }}
                                    >
                                        {chartLoading ? (
                                            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
                                                <RefreshCw className="h-6 w-6 animate-spin text-[#006565]" />
                                                <span className="text-xs">Memuat data grafik tren harga...</span>
                                            </div>
                                        ) : chartPoints.length === 0 ? (
                                            <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                                                <BarChart3 className="h-8 w-8 stroke-1 text-slate-300" />
                                                <span className="mt-2 text-xs">Belum ada rekaman harga untuk parameter yang dipilih.</span>
                                            </div>
                                        ) : chartTab === 'daily' ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart
                                                    data={chartPoints}
                                                    margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
                                                >
                                                    <defs>
                                                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#1C8379" stopOpacity={0.85} />
                                                            <stop offset="50%" stopColor="#3AAB91" stopOpacity={0.55} />
                                                            <stop offset="100%" stopColor="#58CEA7" stopOpacity={0.25} />
                                                        </linearGradient>
                                                        <linearGradient id="colorHet" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis
                                                        dataKey="label"
                                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                                        axisLine={{ stroke: '#cbd5e1' }}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tickFormatter={(val) => `Rp ${(val / 1000).toFixed(0)}k`}
                                                        domain={[0, (dataMax: number) => (dataMax > 0 ? Math.ceil(dataMax * 1.15) : 'auto')]}
                                                    />
                                                    <Tooltip
                                                        formatter={(value: any, name: any) => [
                                                            value !== null && value !== undefined ? formatCurrency(Number(value)) : '-',
                                                            name === 'price' ? 'Harga Rata-rata' : 'Harga Eceran Tertinggi (HET)',
                                                        ]}
                                                        labelFormatter={(label, payload) => {
                                                            const p = payload && payload[0]?.payload;
                                                            return p?.full_date || p?.date_range || p?.full_month || label;
                                                        }}
                                                        contentStyle={{
                                                            borderRadius: '12px',
                                                            border: '1px solid #e2e8f0',
                                                            backgroundColor: '#ffffff',
                                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                            fontSize: '12px',
                                                        }}
                                                    />
                                                    <Legend
                                                        verticalAlign="top"
                                                        align="right"
                                                        wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                                                        formatter={(value) =>
                                                            value === 'price' ? 'Harga Pasar' : 'Batas HET'
                                                        }
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="price"
                                                        stroke="#1C8379"
                                                        strokeWidth={2.5}
                                                        fillOpacity={1}
                                                        fill="url(#colorPrice)"
                                                        name="price"
                                                        connectNulls
                                                        dot={{ r: 4, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                                                        activeDot={{ r: 6, fill: '#d97706', stroke: '#ffffff', strokeWidth: 2 }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="het"
                                                        stroke="#ef4444"
                                                        strokeWidth={2}
                                                        strokeDasharray="4 4"
                                                        fillOpacity={1}
                                                        fill="url(#colorHet)"
                                                        name="het"
                                                        connectNulls
                                                        dot={false}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ComposedChart
                                                    data={chartPoints}
                                                    margin={{ top: 25, right: 15, left: 10, bottom: 0 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis
                                                        dataKey="label"
                                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                                        axisLine={{ stroke: '#cbd5e1' }}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tickFormatter={(val) => `Rp ${(val / 1000).toFixed(0)}k`}
                                                        domain={[0, (dataMax: number) => (dataMax > 0 ? Math.ceil(dataMax * 1.15) : 'auto')]}
                                                    />
                                                    <Tooltip
                                                        formatter={(value: any, name: any, item: any) => {
                                                            if (value === null || value === undefined) return ['-', name];
                                                            const valFormatted = formatCurrency(Number(value));
                                                            if (name === 'price') {
                                                                const pHet = item?.payload?.het;
                                                                if (pHet && Number(value) > Number(pHet)) {
                                                                    const pDiff = Number(value) - Number(pHet);
                                                                    const pPct = (pDiff / Number(pHet)) * 100;
                                                                    const statusText = pPct > 10 ? 'Di atas HET >10%' : 'Di atas HET 1-10%';
                                                                    return [valFormatted, `Harga Rata-rata (${statusText} / +${pPct.toFixed(1)}%)`];
                                                                }
                                                                return [valFormatted, 'Harga Rata-rata'];
                                                            }
                                                            return [valFormatted, 'Harga Eceran Tertinggi (HET)'];
                                                        }}
                                                        labelFormatter={(label, payload) => {
                                                            const p = payload && payload[0]?.payload;
                                                            return p?.full_date || p?.date_range || p?.full_month || label;
                                                        }}
                                                        contentStyle={{
                                                            borderRadius: '12px',
                                                            border: '1px solid #e2e8f0',
                                                            backgroundColor: '#ffffff',
                                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                            fontSize: '12px',
                                                        }}
                                                    />
                                                    <Legend
                                                        verticalAlign="top"
                                                        align="right"
                                                        wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                                                        formatter={(value) =>
                                                            value === 'price' ? 'Harga Pasar' : 'Batas HET'
                                                        }
                                                    />
                                                    <Bar
                                                        dataKey="price"
                                                        name="price"
                                                        fill="#006565"
                                                        radius={[6, 6, 0, 0]}
                                                        maxBarSize={chartTab === 'weekly' ? 60 : 36}
                                                    >
                                                        {chartPoints.map((entry, index) => (
                                                            <Cell
                                                                key={`bar-cell-${index}`}
                                                                fill={getBarColor(entry)}
                                                            />
                                                        ))}
                                                        <LabelList
                                                            dataKey="price"
                                                            position="top"
                                                            offset={8}
                                                            formatter={(val: any) => {
                                                                if (val === null || val === undefined || isNaN(val) || Number(val) <= 0) return '';
                                                                return formatCurrency(Number(val));
                                                            }}
                                                            fill="#0f172a"
                                                            fontSize={chartTab === 'weekly' ? 11 : 10}
                                                            fontWeight={700}
                                                        />
                                                    </Bar>
                                                    <Line
                                                        type="monotone"
                                                        dataKey="het"
                                                        stroke="#ef4444"
                                                        strokeWidth={2}
                                                        strokeDasharray="4 4"
                                                        dot={false}
                                                        name="het"
                                                        connectNulls
                                                    />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ---------------------------------------------------------- */}
                        {/* KOLOM KANAN (30%): DAFTAR KOMODITAS DI ATAS HET HARI INI   */}
                        {/* ---------------------------------------------------------- */}
                        <div id="het-warning-section" className="lg:col-span-3 scroll-mt-20">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                                {/* Header Widget */}
                                <div className="border-b border-slate-100 pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            <span>Peringatan HET</span>
                                        </div>
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                            {aboveHetCommodities.length} Komoditas
                                        </span>
                                    </div>
                                    <h4 className="mt-2 text-sm font-black text-slate-900 leading-tight">
                                        Daftar Komoditas di Atas HET Hari Ini
                                    </h4>
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        Komoditas yang melampaui Harga Eceran Tertinggi pada pasar dan tanggal terpilih.
                                    </p>
                                </div>

                                {/* Legend Warna Kenaikan */}
                                <div className="mt-3 flex items-center justify-between gap-1 rounded-xl bg-slate-50 px-2.5 py-2 text-[10px]">
                                    <div className="flex items-center gap-1">
                                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400 border border-amber-500" />
                                        <span className="font-bold text-amber-900">Kuning:</span>
                                        <span className="text-slate-600">1 - 10%</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500 border border-rose-600" />
                                        <span className="font-bold text-rose-900">Merah:</span>
                                        <span className="text-slate-600">&gt; 10% / 11%+</span>
                                    </div>
                                </div>

                                {/* List Komoditas di Atas HET */}
                                <div className="mt-3 divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
                                    {aboveHetCommodities.length === 0 ? (
                                        <div className="py-8 text-center">
                                            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            <p className="mt-2 text-xs font-bold text-slate-800">
                                                Semua Harga Aman!
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-slate-500">
                                                Tidak ada komoditas dengan harga di atas HET pada tanggal ini.
                                            </p>
                                        </div>
                                    ) : (
                                        aboveHetCommodities.map((item) => (
                                            <div
                                                key={item.id}
                                                className={`py-2.5 px-2.5 rounded-xl transition-colors mb-1.5 border ${
                                                    item.isRed
                                                        ? 'bg-rose-50/60 border-rose-200 hover:bg-rose-50'
                                                        : 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className="relative size-9 shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-2xs">
                                                        {item.image ? (
                                                            <CachedCommodityImage
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center bg-amber-50 text-amber-600">
                                                                <Wheat className="size-4 stroke-[1.75]" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-1.5">
                                                            <span className="text-xs font-extrabold text-slate-900 line-clamp-1" title={item.name}>
                                                                {item.name}
                                                            </span>
                                                            <span
                                                                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black border ${
                                                                    item.isRed
                                                                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                                                                        : 'bg-amber-100 text-amber-800 border-amber-300'
                                                                }`}
                                                            >
                                                                +{item.pct.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-1.5 flex items-baseline justify-between text-xs">
                                                    <span className="text-[11px] text-slate-500">
                                                        Harga Pasar:
                                                    </span>
                                                    <span className="font-extrabold text-slate-900">
                                                        {formatCurrency(item.today_price!)}
                                                        <span className="text-[10px] font-normal text-slate-500">/{item.unit}</span>
                                                    </span>
                                                </div>

                                                <div className="mt-0.5 flex items-baseline justify-between text-xs">
                                                    <span className="text-[11px] text-slate-500">
                                                        Batas HET:
                                                    </span>
                                                    <span className="font-semibold text-slate-600">
                                                        {formatCurrency(item.het_price!)}
                                                    </span>
                                                </div>

                                                <div className="mt-1 flex items-center justify-between border-t border-slate-200/50 pt-1 text-[11px]">
                                                    <span className="text-slate-500 font-medium">Selisih Kenaikan:</span>
                                                    <span
                                                        className={`font-bold inline-flex items-center gap-0.5 ${
                                                            item.isRed ? 'text-rose-700' : 'text-amber-800'
                                                        }`}
                                                    >
                                                        <ArrowUp className="h-3 w-3 stroke-[2.5]" />
                                                        +{formatCurrency(item.diff)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ============================================================== */}
                    {/* TABEL HISTORIS PERKEMBANGAN HARGA PANGAN (1 KOLOM FULL)        */}
                    {/* ============================================================== */}
                    <div id="rekap-section" className="mt-12 rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xs scroll-mt-20">
                        {/* Header & Export Actions */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-5">
                            <div>
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#006565]">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>Data Historis 25 Komoditas</span>
                                </div>
                                <h3 className="mt-2 text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                                    Tabel Historis Perkembangan Harga Pangan
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Pergerakan harga komoditas pangan harian di{' '}
                                    <strong className="text-slate-800">
                                        {markets.find((m) => m.id === currentMarketId)?.name || selectedMarketName || 'Pasar Daerah Indramayu'}
                                    </strong>
                                    {historyStartDate && historyEndDate && (
                                        <> ({historyStartDate} s/d {historyEndDate})</>
                                    )}
                                </p>
                            </div>

                            {/* Export Buttons */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={handleDownloadHistoryExcel}
                                    disabled={historyLoading || historyRows.length === 0}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                                    title="Download data tabel dalam format Excel (.xlsx)"
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                    <span>Download Excel</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDownloadHistoryPdf}
                                    disabled={historyLoading || historyRows.length === 0}
                                    className="inline-flex items-center gap-2 rounded-xl bg-rose-700 hover:bg-rose-800 active:scale-95 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                                    title="Cetak atau unduh dokumen PDF format Landscape"
                                >
                                    <FileText className="h-4 w-4" />
                                    <span>Download PDF</span>
                                </button>
                            </div>
                        </div>

                        {/* Filter Bar: Presets & Date Range */}
                        <div className="mt-5 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 p-3.5">
                            {/* Preset Buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-slate-500 mr-1">
                                    Rentang Cepat:
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleApplyHistoryPreset('14')}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                        historyPreset === '14'
                                            ? 'bg-[#006565] text-white shadow-xs'
                                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    14 Data Terbaru (Default)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyHistoryPreset('7')}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                        historyPreset === '7'
                                            ? 'bg-[#006565] text-white shadow-xs'
                                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    7 Hari
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyHistoryPreset('30')}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                        historyPreset === '30'
                                            ? 'bg-[#006565] text-white shadow-xs'
                                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    30 Hari
                                </button>
                            </div>

                            {/* Date Pickers */}
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700">
                                    <span className="text-[11px] font-bold text-slate-400">Dari:</span>
                                    <input
                                        type="date"
                                        value={historyStartDate}
                                        max={historyEndDate || maxDate || undefined}
                                        onChange={(e) => handleHistoryStartDateChange(e.target.value)}
                                        className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer py-0.5"
                                    />
                                </div>
                                <span className="text-slate-400 font-bold text-xs">-</span>
                                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700">
                                    <span className="text-[11px] font-bold text-slate-400">Sampai:</span>
                                    <input
                                        type="date"
                                        value={historyEndDate}
                                        max={maxDate || undefined}
                                        onChange={(e) => handleHistoryEndDateChange(e.target.value)}
                                        className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer py-0.5"
                                    />
                                </div>
                                <span className="rounded-lg bg-emerald-100/70 px-2 py-1 text-[10px] font-extrabold text-emerald-800">
                                    Maks. 31 Hari
                                </span>
                            </div>
                        </div>

                        {/* Date Adjustment Notice */}
                        {historyDateWarning && (
                            <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 text-xs font-medium text-amber-800">
                                <Info className="h-4 w-4 shrink-0 text-amber-600" />
                                <span>{historyDateWarning}</span>
                            </div>
                        )}

                        {/* Table Display */}
                        <div className="mt-5 relative">
                            {historyLoading && (
                                <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-2xs rounded-2xl">
                                    <div className="flex items-center gap-2.5 rounded-xl bg-white px-4 py-2.5 shadow-md border border-slate-100 text-xs font-bold text-[#006565]">
                                        <RefreshCw className="h-4 w-4 animate-spin text-[#006565]" />
                                        <span>Memuat data historis harga...</span>
                                    </div>
                                </div>
                            )}

                            {historyError ? (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-6 text-center text-xs text-rose-700">
                                    <p className="font-bold">{historyError}</p>
                                    <button
                                        type="button"
                                        onClick={() => fetchHistoryData()}
                                        className="mt-2 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
                                    >
                                        Muat Ulang
                                    </button>
                                </div>
                            ) : historyRows.length === 0 && !historyLoading ? (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-500">
                                    Tidak ada data historis yang tersedia untuk rentang tanggal ini.
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-inner max-h-[580px] overflow-y-auto">
                                    <table className="w-full border-collapse text-left text-xs">
                                        <thead className="sticky top-0 z-30 bg-slate-100 text-slate-700 shadow-xs">
                                            <tr>
                                                {/* Kolom 1: No (Sticky) */}
                                                <th className="sticky left-0 z-40 bg-slate-100 px-3 py-3 text-center font-extrabold text-slate-700 min-w-[50px] border-r border-slate-200">
                                                    No
                                                </th>
                                                {/* Kolom 2: Tanggal (Sticky) */}
                                                <th className="sticky left-[50px] z-40 bg-slate-100 px-4 py-3 text-left font-extrabold text-slate-700 min-w-[130px] border-r-2 border-slate-300 shadow-xs">
                                                    Tanggal
                                                </th>
                                                {/* Kolom 3 s/d 27: 25 Komoditas */}
                                                {(historyCommodities.length > 0 ? historyCommodities : commoditiesList).map((c) => (
                                                    <th
                                                        key={c.id}
                                                        className="px-3.5 py-3 text-right min-w-[135px] border-r border-slate-200/60 whitespace-nowrap"
                                                        title={`${c.name} (${c.unit})`}
                                                    >
                                                        <div className="font-extrabold text-slate-800 line-clamp-1">
                                                            {c.name}
                                                        </div>
                                                        <div className="text-[10px] font-normal text-slate-400">
                                                            Rp/{c.unit}
                                                        </div>
                                                    </th>
                                                ))}
                                                {/* Kolom Paling Akhir: Kirim */}
                                                <th className="sticky right-0 z-40 bg-slate-100 px-3.5 py-3 text-center font-extrabold text-slate-700 min-w-[105px] border-l-2 border-slate-300 shadow-xs">
                                                    Kirim
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {historyRows.map((row, idx) => {
                                                const commoditiesListToRender = historyCommodities.length > 0 ? historyCommodities : commoditiesList;
                                                return (
                                                    <tr
                                                        key={row.date}
                                                        className="group hover:bg-emerald-50/40 transition-colors"
                                                    >
                                                        {/* No (Sticky) */}
                                                        <td className="sticky left-0 z-20 bg-white group-hover:bg-emerald-50/40 px-3 py-2.5 text-center font-bold text-slate-500 border-r border-slate-200">
                                                            {idx + 1}
                                                        </td>
                                                        {/* Tanggal (Sticky) */}
                                                        <td className="sticky left-[50px] z-20 bg-white group-hover:bg-emerald-50/40 px-4 py-2.5 border-r-2 border-slate-300 shadow-xs whitespace-nowrap">
                                                            <div className="font-bold text-slate-800">
                                                                {row.formatted_date || row.date}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400">
                                                                {row.day_name}
                                                            </div>
                                                        </td>
                                                        {/* Prices for each commodity */}
                                                        {commoditiesListToRender.map((c) => {
                                                            const price = row.prices[c.id];
                                                            const isAbove = !!row.is_above_het?.[c.id];
                                                            const diff = row.diffs?.[c.id];

                                                            return (
                                                                <td
                                                                    key={c.id}
                                                                    className={`px-3 py-2 text-right border-r whitespace-nowrap transition-colors ${
                                                                        isAbove
                                                                            ? 'bg-rose-100/90 text-rose-950 font-bold border-rose-200'
                                                                            : 'border-slate-100 font-semibold text-slate-800'
                                                                    }`}
                                                                >
                                                                    {price !== null && price !== undefined && Number(price) > 0 ? (
                                                                        <div className="inline-flex items-center justify-end gap-1.5 font-mono">
                                                                            {diff === 'up' && (
                                                                                <span title="Harga naik dibanding kemarin">
                                                                                    <ArrowUp className="h-3.5 w-3.5 stroke-[2.5] text-rose-600 shrink-0" />
                                                                                </span>
                                                                            )}
                                                                            {diff === 'down' && (
                                                                                <span title="Harga turun dibanding kemarin">
                                                                                    <ArrowDown className="h-3.5 w-3.5 stroke-[2.5] text-emerald-600 shrink-0" />
                                                                                </span>
                                                                            )}
                                                                            <span className={isAbove ? 'font-black text-rose-950' : 'text-slate-800'}>
                                                                                {formatCurrency(Number(price))}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-slate-300 font-normal">
                                                                            -
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                        {/* Kolom Paling Akhir: Tombol WhatsApp */}
                                                        <td className="sticky right-0 z-20 bg-white group-hover:bg-emerald-50/40 px-3 py-2 text-center border-l-2 border-slate-300 shadow-xs whitespace-nowrap">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSendWhatsapp(row)}
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
                                                                title={`Kirim laporan harga pangan tanggal ${row.formatted_date || row.date} ke WhatsApp`}
                                                            >
                                                                <WhatsAppIcon className="h-3.5 w-3.5 fill-current" />
                                                                <span>Kirim</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        {/* TFOOT: Rata-rata, HET/HAP, % thd HET, Rata-rata Bln Lalu, % vs Bln Lalu */}
                                        <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-800">
                                            {/* Baris 1: Rata-rata */}
                                            <tr className="border-b border-slate-200">
                                                <td className="sticky left-0 z-20 bg-slate-100 px-3 py-2 text-center font-bold text-slate-500 border-r border-slate-200">
                                                    -
                                                </td>
                                                <td className="sticky left-[50px] z-20 bg-slate-100 px-4 py-2 border-r-2 border-slate-300 shadow-xs whitespace-nowrap font-black text-slate-800">
                                                    Rata-rata
                                                </td>
                                                {(historyCommodities.length > 0 ? historyCommodities : commoditiesList).map((c) => {
                                                    const avg = historyPeriodAvgs[c.id];
                                                    return (
                                                        <td
                                                            key={c.id}
                                                            className="px-3 py-2 text-right border-r border-slate-200 font-mono font-bold whitespace-nowrap bg-slate-50 text-slate-900"
                                                        >
                                                            {avg !== null ? formatCurrency(avg) : '-'}
                                                        </td>
                                                    );
                                                })}
                                                <td className="sticky right-0 z-20 bg-slate-100 px-3 py-2 text-center border-l-2 border-slate-300 shadow-xs text-slate-400">
                                                    -
                                                </td>
                                            </tr>

                                            {/* Baris 2: Harga HET/HAP */}
                                            <tr className="border-b border-slate-200">
                                                <td className="sticky left-0 z-20 bg-slate-100 px-3 py-2 text-center font-bold text-slate-500 border-r border-slate-200">
                                                    -
                                                </td>
                                                <td className="sticky left-[50px] z-20 bg-slate-100 px-4 py-2 border-r-2 border-slate-300 shadow-xs whitespace-nowrap font-black text-slate-800">
                                                    Harga HET/HAP
                                                </td>
                                                {(historyCommodities.length > 0 ? historyCommodities : commoditiesList).map((c) => {
                                                    const het = historyCommodityHets[c.id] ?? (historyRows[0]?.hets?.[c.id] ?? null);
                                                    return (
                                                        <td
                                                            key={c.id}
                                                            className="px-3 py-2 text-right border-r border-slate-200 font-mono font-bold whitespace-nowrap bg-slate-50 text-slate-700"
                                                        >
                                                            {het !== null && Number(het) > 0 ? formatCurrency(Number(het)) : '-'}
                                                        </td>
                                                    );
                                                })}
                                                <td className="sticky right-0 z-20 bg-slate-100 px-3 py-2 text-center border-l-2 border-slate-300 shadow-xs text-slate-400">
                                                    -
                                                </td>
                                            </tr>

                                            {/* Baris 3: % terhadap HET/HAP */}
                                            <tr className="border-b border-slate-200">
                                                <td className="sticky left-0 z-20 bg-slate-100 px-3 py-2 text-center font-bold text-slate-500 border-r border-slate-200">
                                                    -
                                                </td>
                                                <td className="sticky left-[50px] z-20 bg-slate-100 px-4 py-2 border-r-2 border-slate-300 shadow-xs whitespace-nowrap font-black text-slate-800">
                                                    % thd HET/HAP
                                                </td>
                                                {(historyCommodities.length > 0 ? historyCommodities : commoditiesList).map((c) => {
                                                    const avg = historyPeriodAvgs[c.id];
                                                    const het = historyCommodityHets[c.id] ?? (historyRows[0]?.hets?.[c.id] ?? null);
                                                    const res = getChangeColorAndText(avg, het ? Number(het) : null);
                                                    return (
                                                        <td
                                                            key={c.id}
                                                            className={`px-3 py-2 text-right border-r border-slate-200 font-mono whitespace-nowrap ${res.bgClass}`}
                                                        >
                                                            {res.text}
                                                        </td>
                                                    );
                                                })}
                                                <td className="sticky right-0 z-20 bg-slate-100 px-3 py-2 text-center border-l-2 border-slate-300 shadow-xs text-slate-400">
                                                    -
                                                </td>
                                            </tr>

                                            {/* Baris 4: Rata-rata Bulan Lalu */}
                                            <tr className="border-b border-slate-200">
                                                <td className="sticky left-0 z-20 bg-slate-100 px-3 py-2 text-center font-bold text-slate-500 border-r border-slate-200">
                                                    -
                                                </td>
                                                <td className="sticky left-[50px] z-20 bg-slate-100 px-4 py-2 border-r-2 border-slate-300 shadow-xs whitespace-nowrap font-black text-slate-800">
                                                    <div>Rata-rata Bln Lalu</div>
                                                    {historyPrevMonthLabel && (
                                                        <div className="text-[10px] text-slate-400 font-normal">
                                                            ({historyPrevMonthLabel})
                                                        </div>
                                                    )}
                                                </td>
                                                {(historyCommodities.length > 0 ? historyCommodities : commoditiesList).map((c) => {
                                                    const prevAvg = historyPrevMonthAvgs[c.id];
                                                    return (
                                                        <td
                                                            key={c.id}
                                                            className="px-3 py-2 text-right border-r border-slate-200 font-mono font-bold whitespace-nowrap bg-slate-50 text-slate-700"
                                                        >
                                                            {prevAvg !== null && prevAvg !== undefined && Number(prevAvg) > 0
                                                                ? formatCurrency(Number(prevAvg))
                                                                : '-'}
                                                        </td>
                                                    );
                                                })}
                                                <td className="sticky right-0 z-20 bg-slate-100 px-3 py-2 text-center border-l-2 border-slate-300 shadow-xs text-slate-400">
                                                    -
                                                </td>
                                            </tr>

                                            {/* Baris 5: % Kenaikan/Penurunan terhadap Bulan Lalu */}
                                            <tr>
                                                <td className="sticky left-0 z-20 bg-slate-100 px-3 py-2 text-center font-bold text-slate-500 border-r border-slate-200">
                                                    -
                                                </td>
                                                <td className="sticky left-[50px] z-20 bg-slate-100 px-4 py-2 border-r-2 border-slate-300 shadow-xs whitespace-nowrap font-black text-slate-800">
                                                    % vs Bln Lalu
                                                </td>
                                                {(historyCommodities.length > 0 ? historyCommodities : commoditiesList).map((c) => {
                                                    const avg = historyPeriodAvgs[c.id];
                                                    const prevAvg = historyPrevMonthAvgs[c.id];
                                                    const res = getChangeColorAndText(avg, prevAvg ? Number(prevAvg) : null);
                                                    return (
                                                        <td
                                                            key={c.id}
                                                            className={`px-3 py-2 text-right border-r border-slate-200 font-mono whitespace-nowrap ${res.bgClass}`}
                                                        >
                                                            {res.text}
                                                        </td>
                                                    );
                                                })}
                                                <td className="sticky right-0 z-20 bg-slate-100 px-3 py-2 text-center border-l-2 border-slate-300 shadow-xs text-slate-400">
                                                    -
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}

                            {/* Legend & Scroll Hint */}
                            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px] text-slate-500 border-t border-slate-200/60 pt-3 px-1">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="font-bold text-slate-700">Keterangan:</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="inline-block h-3.5 w-6 rounded bg-rose-100 border border-rose-300" />
                                        <span className="text-slate-700 font-medium">Merah: Di atas HET</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <ArrowUp className="h-3.5 w-3.5 stroke-[2.5] text-rose-600" />
                                        <span className="text-slate-700 font-medium">Panah Merah: Naik vs Kemarin</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <ArrowDown className="h-3.5 w-3.5 stroke-[2.5] text-emerald-600" />
                                        <span className="text-slate-700 font-medium">Panah Hijau: Turun vs Kemarin</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="inline-block h-3.5 w-3.5 rounded bg-emerald-100 border border-emerald-300" />
                                        <span className="text-slate-700 font-medium">Hijau: Penurunan</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="inline-block h-3.5 w-3.5 rounded bg-amber-100 border border-amber-300" />
                                        <span className="text-slate-700 font-medium">Kuning: Naik 1-10%</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="inline-block h-3.5 w-3.5 rounded bg-rose-100 border border-rose-300" />
                                        <span className="text-slate-700 font-medium">Merah: Naik &gt;10%</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-600 fill-current" />
                                        <span className="text-slate-700 font-medium">Kirim: Bagikan Laporan ke WA</span>
                                    </div>
                                </div>
                                <div className="text-slate-400">
                                    👉 Geser tabel ke samping untuk melihat seluruh 25 komoditas.
                                </div>
                            </div>
                        </div>
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

                {/* Public Portal Footer */}
                <PortalFooter />
            </div>
        </>
    );
}

