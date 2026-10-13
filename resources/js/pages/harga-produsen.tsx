import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowDown,
    ArrowRight,
    ArrowUp,
    ArrowUpRight,
    BarChart3,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    Download,
    FileSpreadsheet,
    FileText,
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
    Scale,
    ShieldCheck,
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
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export interface ProducerCommodity {
    id: number;
    key: string;
    name: string;
    short_name: string;
    category: string;
    unit: string;
    order: number;
    hap: number;
    hap_label: string;
    description: string;
    image?: string | null;
    image_url?: string | null;
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

interface HistoryRow {
    date: string;
    formatted_date: string;
    day_name: string;
    prices: Record<number | string, number | null>;
    haps?: Record<number | string, number | null>;
    hets?: Record<number | string, number | null>;
    is_above_hap?: Record<number | string, boolean>;
    is_above_het?: Record<number | string, boolean>;
    diffs?: Record<number | string, 'up' | 'down' | 'stable' | null>;
}

interface HistoryCommodity {
    id: number;
    key?: string;
    name: string;
    category?: string;
    unit: string;
}

const formatCurrency = (val: number | null | undefined): string => {
    if (val === null || val === undefined || isNaN(val)) return '-';
    return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
};

export const DEFAULT_PRODUCER_COMMODITIES: ProducerCommodity[] = [
    {
        id: 1,
        key: 'gkp_petani',
        name: 'GKP Tingkat Petani',
        short_name: 'GKP Petani',
        category: 'Gabah',
        unit: 'Kg',
        order: 1,
        hap: 6000,
        hap_label: 'HAP Bapanas',
        description: 'Gabah Kering Panen di tingkat petani sawah',
        image: '/storage/producer-commodities/ORZlz1j9Gxgp48BO8fqCw85WxfhYhYaQXoJuaZ8Z.png',
        image_url: '/storage/producer-commodities/ORZlz1j9Gxgp48BO8fqCw85WxfhYhYaQXoJuaZ8Z.png',
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
        id: 2,
        key: 'gkp_penggilingan',
        name: 'GKP Tingkat Penggilingan',
        short_name: 'GKP Penggilingan',
        category: 'Gabah',
        unit: 'Kg',
        order: 2,
        hap: 6200,
        hap_label: 'HAP Bapanas',
        description: 'Gabah Kering Panen di tingkat usaha penggilingan padi',
        image: '/storage/producer-commodities/wX2Z0Z34usT99z3BvDyyZDCKCStGvgnMEGvUbfpQ.png',
        image_url: '/storage/producer-commodities/wX2Z0Z34usT99z3BvDyyZDCKCStGvgnMEGvUbfpQ.png',
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
        id: 3,
        key: 'gkg_penggilingan',
        name: 'GKG Tingkat Penggilingan',
        short_name: 'GKG Penggilingan',
        category: 'Gabah',
        unit: 'Kg',
        order: 3,
        hap: 7400,
        hap_label: 'HAP Bapanas',
        description: 'Gabah Kering Giling di tingkat usaha penggilingan padi',
        image: '/storage/producer-commodities/k1FZOc3yFsVMnTUBmttEwQV2cww75faa3LQZsdQG.png',
        image_url: '/storage/producer-commodities/k1FZOc3yFsVMnTUBmttEwQV2cww75faa3LQZsdQG.png',
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
        id: 4,
        key: 'beras_medium_penggilingan',
        name: 'Beras Medium Penggilingan',
        short_name: 'Beras Medium Giling',
        category: 'Beras',
        unit: 'Kg',
        order: 4,
        hap: 12000,
        hap_label: 'HAP Bapanas',
        description: 'Beras Medium hasil produksi di tingkat penggilingan',
        image: '/storage/producer-commodities/xV6yGFEyNTDOyO6N9Tk3wnKQm6Npcyr9MrSV5lj4.png',
        image_url: '/storage/producer-commodities/xV6yGFEyNTDOyO6N9Tk3wnKQm6Npcyr9MrSV5lj4.png',
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
        id: 5,
        key: 'beras_premium_penggilingan',
        name: 'Beras Premium Penggilingan',
        short_name: 'Beras Premium Giling',
        category: 'Beras',
        unit: 'Kg',
        order: 5,
        hap: 13900,
        hap_label: 'HAP Bapanas',
        description: 'Beras Premium hasil produksi di tingkat penggilingan',
        image: '/storage/producer-commodities/KekCOZQavP4CQpDDBHfG6O3A7TV3XrR5LESzvBSL.png',
        image_url: '/storage/producer-commodities/KekCOZQavP4CQpDDBHfG6O3A7TV3XrR5LESzvBSL.png',
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
        id: 6,
        key: 'sapi_hidup',
        name: 'Sapi Hidup',
        short_name: 'Sapi Hidup Farm Gate',
        category: 'Peternakan',
        unit: 'Kg',
        order: 6,
        hap: 56000,
        hap_label: 'HAP Farm Gate',
        description: 'Sapi potong hidup di tingkat peternak / produsen',
        image: '/storage/producer-commodities/N2o103RzRgRrmlsXsOjKaoQITNdtWhHNOwcTgKnN.png',
        image_url: '/storage/producer-commodities/N2o103RzRgRrmlsXsOjKaoQITNdtWhHNOwcTgKnN.png',
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

export function getProducerCommodityImageUrl(item?: { image?: string | null; image_url?: string | null }): string | null {
    if (!item) return null;
    const raw = item.image_url || item.image;
    if (!raw) return null;

    if (raw.startsWith('http://') || raw.startsWith('https://')) {
        try {
            const parsed = new URL(raw);
            if (parsed.pathname.startsWith('/storage/')) {
                return parsed.pathname;
            }
        } catch {
            // keep raw if url parsing fails
        }
        return raw;
    }

    if (raw.startsWith('/') || raw.startsWith('data:')) {
        return raw;
    }

    return `/storage/${raw}`;
}

function ProducerCommodityImage({
    item,
    className,
    fallbackSize = 'default',
}: {
    item: { name: string; image?: string | null; image_url?: string | null };
    className?: string;
    fallbackSize?: 'default' | 'small';
}) {
    const src = useMemo(() => getProducerCommodityImageUrl(item), [item]);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [src]);

    if (!src || hasError) {
        if (fallbackSize === 'small') {
            return (
                <div className="flex h-full w-full items-center justify-center bg-amber-50 text-amber-600">
                    <Wheat className="size-4 stroke-[1.75]" />
                </div>
            );
        }
        return (
            <div className="flex flex-col items-center justify-center text-amber-200">
                <Wheat className="size-10 stroke-[1.2]" />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={item.name}
            onError={() => setHasError(true)}
            loading="lazy"
            decoding="async"
            className={className}
        />
    );
}

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

export default function HargaProdusen({
    marketName = 'Kabupaten Indramayu',
    selectedDate,
    latestDate,
    prevDate,
    minDate = '2026-01-01',
    maxDate,
    commodities = [],
}: HargaProdusenProps = {}) {
    const [filterDate, setFilterDate] = useState(selectedDate || latestDate || new Date().toISOString().split('T')[0]);

    // Hero Banner carousel state & interactions
    const [heroSlide, setHeroSlide] = useState(0);
    const [isHeroPlaying, setIsHeroPlaying] = useState(true);
    const [isHeroHovered, setIsHeroHovered] = useState(false);
    const TOTAL_HERO_SLIDES = 3;

    // Display commodities memoized
    const displayCommodities = useMemo(() => {
        return commodities && commodities.length > 0 ? commodities : DEFAULT_PRODUCER_COMMODITIES;
    }, [commodities]);

    // Hero metrics statistics
    const heroStats = useMemo(() => {
        const list = displayCommodities;
        const countAboveHap = list.filter((c) => c.status === 'above').length;
        const countBelowHap = list.filter((c) => c.status !== 'above').length;
        const countUp = list.filter((c) => c.change_type === 'up').length;
        const countDown = list.filter((c) => c.change_type === 'down').length;
        const countStable = list.filter((c) => c.change_type === 'stable' || !c.change_type).length;
        const hapComplianceRate = list.length > 0 ? Math.round((countBelowHap / list.length) * 100) : 100;

        const gkp = list.find((c) => c.key === 'gkp_petani') || list[0];
        const beras = list.find((c) => c.key === 'beras_medium_penggilingan') || list[3];

        return {
            total: list.length,
            countAboveHap,
            countBelowHap,
            countUp,
            countDown,
            countStable,
            hapComplianceRate,
            gkp,
            beras,
        };
    }, [displayCommodities]);

    // List of commodities whose today_price > hap (Di atas HAP/HET)
    const aboveHapCommodities = useMemo(() => {
        return displayCommodities
            .filter((item) => {
                if (
                    item.today_price === null ||
                    item.today_price === undefined ||
                    item.hap === null ||
                    item.hap === undefined ||
                    item.hap <= 0
                ) {
                    return false;
                }
                return item.today_price > item.hap;
            })
            .map((item) => {
                const diff = (item.today_price ?? 0) - (item.hap ?? 0);
                const pct = (item.hap ?? 0) > 0 ? (diff / (item.hap ?? 0)) * 100 : 0;
                const isRed = pct > 10;
                return {
                    ...item,
                    diff,
                    pct,
                    isRed,
                };
            })
            .sort((a, b) => b.pct - a.pct);
    }, [displayCommodities]);

    // Auto rotate hero banner every 6 seconds
    useEffect(() => {
        if (!isHeroPlaying || isHeroHovered) return;
        const timer = setInterval(() => {
            setHeroSlide((prev) => (prev + 1) % TOTAL_HERO_SLIDES);
        }, 6000);
        return () => clearInterval(timer);
    }, [isHeroPlaying, isHeroHovered]);

    const handleDateChange = (newDate: string) => {
        setFilterDate(newDate);
        router.get('/harga-produsen', { date: newDate }, { preserveState: true, preserveScroll: true });
    };


    // Smooth scroll helper for quick navigation pills & buttons
    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // ==============================================================
    // 1. STATE & FITUR GRAFIK PERKEMBANGAN HARGA PRODUSEN
    // ==============================================================
    const [chartTab, setChartTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [chartCommodityId, setChartCommodityId] = useState<number>(1);
    const [chartLoading, setChartLoading] = useState(false);
    const [chartPoints, setChartPoints] = useState<any[]>([]);

    // Daily chart filter (maks 31 hari)
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

    // Weekly chart filter (bulan & tahun)
    const [weeklyYear, setWeeklyYear] = useState<number>(() => {
        const anchor = selectedDate || (latestDate ?? '');
        return anchor ? new Date(anchor + 'T00:00:00').getFullYear() : new Date().getFullYear();
    });
    const [weeklyMonth, setWeeklyMonth] = useState<number>(() => {
        const anchor = selectedDate || (latestDate ?? '');
        return anchor ? new Date(anchor + 'T00:00:00').getMonth() + 1 : new Date().getMonth() + 1;
    });

    // Monthly chart filter (tahun saja)
    const [monthlyYear, setMonthlyYear] = useState<number>(() => {
        const anchor = selectedDate || (latestDate ?? '');
        return anchor ? new Date(anchor + 'T00:00:00').getFullYear() : new Date().getFullYear();
    });

    // Sync chart commodity id if commodity list loads
    useEffect(() => {
        if (commodities && commodities.length > 0) {
            if (!commodities.some((c) => (c.id ?? 1) === chartCommodityId)) {
                setChartCommodityId(commodities[0].id || 1);
            }
        }
    }, [commodities]);

    // Fetch chart data from API
    useEffect(() => {
        let isMounted = true;
        setChartLoading(true);

        const params = new URLSearchParams();
        params.append('type', chartTab);
        params.append('commodity_id', String(chartCommodityId));

        if (chartTab === 'daily') {
            if (dailyStartDate) params.append('start_date', dailyStartDate);
            if (dailyEndDate) params.append('end_date', dailyEndDate);
        } else if (chartTab === 'weekly') {
            params.append('year', String(weeklyYear));
            params.append('month', String(weeklyMonth));
        } else if (chartTab === 'monthly') {
            params.append('year', String(monthlyYear));
        }

        fetch(`/api/public-producer-chart-data?${params.toString()}`)
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
        dailyStartDate,
        dailyEndDate,
        weeklyYear,
        weeklyMonth,
        monthlyYear,
    ]);

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
    // 2. STATE & FITUR TABEL HISTORIS PERKEMBANGAN HARGA PRODUSEN
    // ==============================================================
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
    const [historyCommodityHaps, setHistoryCommodityHaps] = useState<Record<number | string, number | null>>({});

    const fetchHistoryData = async (start?: string, end?: string) => {
        setHistoryLoading(true);
        setHistoryError(null);
        try {
            const params = new URLSearchParams();
            if (start) params.append('start_date', start);
            if (end) params.append('end_date', end);

            const res = await fetch(`/api/public-producer-history-data?${params.toString()}`);
            if (!res.ok) throw new Error('Gagal mengambil data historis harga produsen');
            const data = await res.json();

            setHistoryRows(data.rows || []);
            setHistoryCommodities(data.commodities || []);
            if (data.start_date) setHistoryStartDate(data.start_date);
            if (data.end_date) setHistoryEndDate(data.end_date);
            if (data.prev_month_label) setHistoryPrevMonthLabel(data.prev_month_label);
            if (data.prev_month_averages) setHistoryPrevMonthAvgs(data.prev_month_averages);
            if (data.commodity_haps) setHistoryCommodityHaps(data.commodity_haps);
        } catch (err: any) {
            setHistoryError(err.message || 'Terjadi kesalahan saat memuat data historis produsen');
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchHistoryData();
    }, []);

    const handleApplyHistoryPreset = (preset: '14' | '7' | '30') => {
        setHistoryPreset(preset);
        setHistoryDateWarning(null);
        if (preset === '14') {
            fetchHistoryData();
            return;
        }
        const anchor = historyEndDate || filterDate || maxDate || new Date().toISOString().split('T')[0];
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
        const params = new URLSearchParams();
        if (historyStartDate) params.append('start_date', historyStartDate);
        if (historyEndDate) params.append('end_date', historyEndDate);
        window.location.href = `/api/public-producer-history-excel?${params.toString()}`;
    };

    // Calculate period average for each commodity across historyRows
    const historyPeriodAvgs = useMemo(() => {
        const comms = historyCommodities.length > 0 ? historyCommodities : (commodities || []);
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
    }, [historyRows, historyCommodities, commodities]);

    // Format % change and color styling
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
            return {
                text,
                bgClass: 'bg-emerald-100/90 text-emerald-900 font-black',
                style: 'background-color:#dcfce7;color:#15803d;',
            };
        } else if (pct > 0 && pct <= 10) {
            return {
                text,
                bgClass: 'bg-amber-100/90 text-amber-900 font-black',
                style: 'background-color:#fef9c3;color:#a16207;',
            };
        } else if (pct > 10) {
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
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Mohon izinkan pop-up browser untuk mencetak / mendownload PDF.');
            return;
        }

        const commoditiesToRender = historyCommodities.length > 0 ? historyCommodities : (commodities || []);

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
                const isAbove = r.is_above_hap?.[c.id] ?? r.is_above_het?.[c.id];
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

        // 1. Rata-rata periode
        let avgRowHtml = '<td colspan="2" style="text-align:center;font-weight:bold;background-color:#f1f5f9;color:#0f172a;">Rata-rata Periode</td>';
        commoditiesToRender.forEach((c) => {
            const avg = historyPeriodAvgs[c.id];
            avgRowHtml += `<td style="text-align:right;font-weight:bold;background-color:#f8fafc;white-space:nowrap;color:#0f172a;">${avg !== null ? formatCurrency(avg) : '-'}</td>`;
        });

        // 2. Harga HAP
        let hapRowHtml = '<td colspan="2" style="text-align:center;font-weight:bold;background-color:#f1f5f9;color:#0f172a;">Harga HAP (Bapanas)</td>';
        commoditiesToRender.forEach((c) => {
            const hap = historyCommodityHaps[c.id] ?? (historyRows[0]?.haps?.[c.id] ?? null);
            hapRowHtml += `<td style="text-align:right;font-weight:bold;background-color:#f8fafc;white-space:nowrap;color:#0f172a;">${hap !== null && Number(hap) > 0 ? formatCurrency(Number(hap)) : '-'}</td>`;
        });

        // 3. % terhadap HAP
        let pctHapRowHtml = '<td colspan="2" style="text-align:center;font-weight:bold;background-color:#f1f5f9;color:#0f172a;">% thd HAP</td>';
        commoditiesToRender.forEach((c) => {
            const avg = historyPeriodAvgs[c.id];
            const hap = historyCommodityHaps[c.id] ?? (historyRows[0]?.haps?.[c.id] ?? null);
            const res = getChangeColorAndText(avg, hap ? Number(hap) : null);
            pctHapRowHtml += `<td style="text-align:right;font-weight:bold;white-space:nowrap;${res.style}">${res.text}</td>`;
        });

        // 4. Rata-rata bulan lalu
        const prevMonthLabel = historyPrevMonthLabel || 'Bulan Lalu';
        let prevMonthRowHtml = `<td colspan="2" style="text-align:center;font-weight:bold;background-color:#f1f5f9;color:#0f172a;">Rata-rata ${prevMonthLabel}</td>`;
        commoditiesToRender.forEach((c) => {
            const pAvg = historyPrevMonthAvgs[c.id];
            prevMonthRowHtml += `<td style="text-align:right;font-weight:bold;background-color:#f8fafc;white-space:nowrap;color:#0f172a;">${pAvg !== null && Number(pAvg) > 0 ? formatCurrency(Number(pAvg)) : '-'}</td>`;
        });

        // 5. % terhadap bulan lalu
        let pctPrevMonthRowHtml = `<td colspan="2" style="text-align:center;font-weight:bold;background-color:#f1f5f9;color:#0f172a;">% thd ${prevMonthLabel}</td>`;
        commoditiesToRender.forEach((c) => {
            const avg = historyPeriodAvgs[c.id];
            const pAvg = historyPrevMonthAvgs[c.id];
            const res = getChangeColorAndText(avg, pAvg ? Number(pAvg) : null);
            pctPrevMonthRowHtml += `<td style="text-align:right;font-weight:bold;white-space:nowrap;${res.style}">${res.text}</td>`;
        });

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <title>Rekap Perkembangan Harga Produsen Pangan - DKPP Indramayu</title>
            <style>
                @page { size: landscape; margin: 12mm; }
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 8.5pt; color: #1e293b; margin: 0; padding: 15px; }
                .header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #b45309; padding-bottom: 10px; }
                .header h1 { font-size: 13pt; margin: 0; color: #78350f; font-weight: 800; text-transform: uppercase; }
                .header h2 { font-size: 10.5pt; margin: 3px 0 0 0; color: #1e293b; font-weight: 700; }
                .header p { font-size: 8pt; margin: 4px 0 0 0; color: #64748b; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 8pt; }
                th, td { border: 1px solid #cbd5e1; padding: 5px 6px; }
                th { background-color: #fef3c7; color: #78350f; font-weight: 800; text-align: center; font-size: 7.5pt; }
                tr:nth-child(even) td { background-color: #fefce8; }
                .footer-info { margin-top: 15px; font-size: 7.5pt; color: #64748b; display: flex; justify-content: space-between; }
                @media print {
                    button { display: none !important; }
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <div style="text-align:right; margin-bottom: 10px;">
                <button onclick="window.print()" style="background:#b45309; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">
                    🖨️ Cetak / Simpan PDF
                </button>
            </div>
            <div class="header">
                <h1>Dinas Ketahanan Pangan dan Pertanian (DKPP) Kabupaten Indramayu</h1>
                <h2>REKAPITULASI HISTORIS PERKEMBANGAN HARGA PANGAN TINGKAT PRODUSEN</h2>
                <p>Sentra Pertanian, Petani, dan Penggilingan Padi | Periode: ${historyStartDate || '-'} s/d ${historyEndDate || '-'}</p>
            </div>
            <table>
                <thead>
                    <tr>${tableHeaders}</tr>
                </thead>
                <tbody>
                    ${tableRowsHtml}
                    <tr style="border-top:2px solid #94a3b8;">${avgRowHtml}</tr>
                    <tr>${hapRowHtml}</tr>
                    <tr>${pctHapRowHtml}</tr>
                    <tr>${prevMonthRowHtml}</tr>
                    <tr>${pctPrevMonthRowHtml}</tr>
                </tbody>
            </table>
            <div class="footer-info">
                <span>Sumber Data: Aplikasi Si-Pangan DKPP Kab. Indramayu</span>
                <span>Dicetak pada: ${new Date().toLocaleString('id-ID')}</span>
            </div>
            <script>
                setTimeout(() => { window.print(); }, 600);
            </script>
        </body>
        </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };


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
                <PortalNavbar activePage="harga-produsen" />

                {/* ============================================================== */}
                {/* 2. HERO BANNER - MODERN & KEKINIAN (DKPP PRODUSEN PANGAN)       */}
                {/* ============================================================== */}
                <section
                    className="relative overflow-hidden bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#451a03] text-white border-b border-amber-950/40 shadow-xl"
                    onMouseEnter={() => setIsHeroHovered(true)}
                    onMouseLeave={() => setIsHeroHovered(false)}
                    aria-label="Hero Banner Pusat Data Harga Produsen"
                >
                    {/* Glowing ambient orbs & mesh background effect */}
                    <div className="pointer-events-none absolute -top-40 -left-20 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
                    <div className="pointer-events-none absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-orange-400/15 blur-3xl" />
                    <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:24px_24px]" />

                    <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                        {/* Top Context & Live Status Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/20 px-3 py-1 text-[11px] font-bold tracking-wider text-amber-200 uppercase backdrop-blur-md">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                                    </span>
                                    <span>Barometer Produsen Real-Time</span>
                                </span>
                                <span className="hidden sm:inline-flex text-xs font-semibold text-emerald-200/80">
                                    DKPP Indramayu • Tingkat Petani &amp; Penggilingan
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-emerald-100/90">
                                <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1 backdrop-blur-md">
                                    <MapPin className="h-3.5 w-3.5 text-amber-300" />
                                    <span className="font-semibold text-white">
                                        {marketName || 'Sentra Pertanian Indramayu'}
                                    </span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1 backdrop-blur-md">
                                    <Calendar className="h-3.5 w-3.5 text-emerald-300" />
                                    <span>{formatIndoDate(filterDate) || 'Hari Ini'}</span>
                                </span>
                            </div>
                        </div>

                        {/* Main Grid: Left Slider Content & Right Radar Card */}
                        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                            {/* Left Column: Interactive Banner Slide */}
                            <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between">
                                {/* Slide 0: Barometer Harga Produsen & Sentra Tani */}
                                {heroSlide === 0 && (
                                    <div className="animate-in fade-in zoom-in-95 duration-500">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/15 px-3.5 py-1 text-xs font-bold text-amber-200 backdrop-blur-md">
                                            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                                            <span>PORTAL PEMANTAUAN HARGA PRODUSEN</span>
                                        </div>

                                        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight sm:leading-tight">
                                            Barometer Harga Petani &amp;{' '}
                                            <span className="bg-gradient-to-r from-amber-300 via-yellow-100 to-emerald-200 bg-clip-text text-transparent">
                                                Sentra Pangan Hulu
                                            </span>{' '}
                                            Indramayu
                                        </h1>

                                        <p className="mt-4 max-w-2xl text-sm font-medium text-emerald-100/90 sm:text-base leading-relaxed">
                                            Monitoring transaksi riil Gabah Kering Panen (GKP), Gabah Kering Giling (GKG), Beras Penggilingan, dan komoditas pangan strategis di tingkat petani serta pelaku usaha penggilingan se-Kabupaten Indramayu.
                                        </p>

                                        {/* Action Buttons */}
                                        <div className="mt-6 flex flex-wrap items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => scrollToSection('cards-section')}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-amber-950/40 transition-all hover:scale-[1.02] hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] cursor-pointer"
                                            >
                                                <Wheat className="h-4 w-4" />
                                                <span>Lihat 6 Komoditas Hari Ini</span>
                                                <ArrowDown className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => scrollToSection('grafik-section')}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98] cursor-pointer"
                                            >
                                                <LineChart className="h-4 w-4 text-amber-300" />
                                                <span>Grafik Tren &amp; HAP</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => scrollToSection('rekap-section')}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98] cursor-pointer"
                                            >
                                                <FileSpreadsheet className="h-4 w-4 text-emerald-300" />
                                                <span>Tabel Historis</span>
                                            </button>
                                        </div>

                                        {/* Dynamic Mini Metric Pills */}
                                        <div className="mt-7 flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                                                <Activity className="h-3.5 w-3.5 text-amber-400" />
                                                <span>6 Komoditas Terpantau</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                                <span>{heroStats.countBelowHap} Sesuai/Bawah HAP</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                                                <span className="h-2 w-2 rounded-full bg-amber-400" />
                                                <span>{heroStats.countAboveHap} Di Atas HAP</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                                                <span className="h-2 w-2 rounded-full bg-teal-400" />
                                                <span>{heroStats.countStable} Stabil</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-200">
                                                <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
                                                <span>{heroStats.hapComplianceRate}% Sesuai HAP</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Slide 1: Pengawalan HAP Bapanas & Lumbung Pangan */}
                                {heroSlide === 1 && (
                                    <div className="animate-in fade-in zoom-in-95 duration-500">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3.5 py-1 text-xs font-bold text-emerald-200 backdrop-blur-md">
                                            <Scale className="h-3.5 w-3.5 text-emerald-300" />
                                            <span>PENGENDALIAN HARGA ACUAN PENJUALAN (HAP)</span>
                                        </div>

                                        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight sm:leading-tight">
                                            Kawal Batas HAP,{' '}
                                            <span className="bg-gradient-to-r from-emerald-300 via-teal-100 to-amber-200 bg-clip-text text-transparent">
                                                Lindungi Kesejahteraan
                                            </span>{' '}
                                            Petani &amp; Penggilingan
                                        </h1>

                                        <p className="mt-4 max-w-2xl text-sm font-medium text-emerald-100/90 sm:text-base leading-relaxed">
                                            Integrasi acuan Harga Acuan Pembelian/Penjualan (HAP) Badan Pangan Nasional guna memastikan kepatuhan regulasi, mencegah fluktuasi tajam di masa panen, dan menjaga rantai pasok pangan.
                                        </p>

                                        {/* Action Buttons */}
                                        <div className="mt-6 flex flex-wrap items-center gap-3">
                                            <Link
                                                href="/harga-konsumen"
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-700 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] hover:from-emerald-400 hover:to-teal-600 active:scale-[0.98]"
                                            >
                                                <Store className="h-4 w-4" />
                                                <span>Cek Harga Konsumen Eceran</span>
                                                <ArrowUpRight className="h-4 w-4" />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => scrollToSection('cards-section')}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98] cursor-pointer"
                                            >
                                                <Wheat className="h-4 w-4 text-emerald-300" />
                                                <span>Kepatuhan HAP 6 Komoditas</span>
                                            </button>
                                        </div>

                                        {/* Value Badges */}
                                        <div className="mt-7 flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-100">
                                                <span>🌾 Sentra Produksi Padi Terbesar</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                                                <span>⚖️ HAP Bapanas Perbadan 6 &amp; 7/2024</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-teal-400/20 bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-100">
                                                <span>🚜 Sinergi Kelompok Tani &amp; Penggilingan</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Slide 2: Satu Data & Laporan Resmi Siap Ekspor */}
                                {heroSlide === 2 && (
                                    <div className="animate-in fade-in zoom-in-95 duration-500">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/15 px-3.5 py-1 text-xs font-bold text-teal-200 backdrop-blur-md">
                                            <ShieldCheck className="h-3.5 w-3.5 text-teal-300" />
                                            <span>SATU DATA PRODUSEN PANGAN INDRAMAYU</span>
                                        </div>

                                        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight sm:leading-tight">
                                            Transparansi Data Terbuka,{' '}
                                            <span className="bg-gradient-to-r from-teal-200 via-cyan-100 to-amber-200 bg-clip-text text-transparent">
                                                Laporan Resmi Siap Cetak
                                            </span>
                                        </h1>

                                        <p className="mt-4 max-w-2xl text-sm font-medium text-emerald-100/90 sm:text-base leading-relaxed">
                                            Unduh rekapitulasi data harga produsen dalam format spreadsheet Excel komprehensif atau cetak langsung format PDF lanskap resmi dinas lengkap dengan kop surat dan legalitas DKPP.
                                        </p>

                                        {/* Action Buttons */}
                                        <div className="mt-6 flex flex-wrap items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => scrollToSection('rekap-section')}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] cursor-pointer"
                                            >
                                                <Download className="h-4 w-4" />
                                                <span>Buka Tabel &amp; Ekspor Excel</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => scrollToSection('grafik-section')}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98] cursor-pointer"
                                            >
                                                <BarChart3 className="h-4 w-4 text-cyan-300" />
                                                <span>Grafik Harian, Mingguan &amp; Bulanan</span>
                                            </button>
                                        </div>

                                        {/* Value Badges */}
                                        <div className="mt-7 flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-teal-400/20 bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-100">
                                                <FileSpreadsheet className="h-3.5 w-3.5 text-teal-300" />
                                                <span>Ekspor Excel &amp; Cetak PDF Otomatis</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-100">
                                                <LineChart className="h-3.5 w-3.5 text-amber-300" />
                                                <span>Filter Rentang 31 Hari Fleksibel</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                                                <Activity className="h-3.5 w-3.5 text-emerald-300" />
                                                <span>Tracking Tren MoM Akurat</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Slider Pagination Controls & Play/Pause */}
                                <div className="mt-8 flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        {[0, 1, 2].map((idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setHeroSlide(idx)}
                                                aria-label={`Buka slide ${idx + 1}`}
                                                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                                    heroSlide === idx
                                                        ? 'w-8 bg-amber-400'
                                                        : 'w-2 bg-white/30 hover:bg-white/60'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsHeroPlaying(!isHeroPlaying)}
                                        aria-label={isHeroPlaying ? 'Jeda rotasi otomatis' : 'Mulai rotasi otomatis'}
                                        className="rounded-lg p-1 text-white/50 hover:text-white transition-colors cursor-pointer"
                                        title={isHeroPlaying ? 'Jeda otomatis' : 'Putar otomatis'}
                                    >
                                        {isHeroPlaying ? (
                                            <Pause className="h-3.5 w-3.5" />
                                        ) : (
                                            <Play className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                    <span className="text-[11px] font-medium text-emerald-200/60">
                                        {heroSlide + 1} / 3 Slide
                                    </span>
                                </div>
                            </div>

                            {/* Right Column: Modern Glassmorphic "Radar Sentra Produsen Hari Ini" Card */}
                            <div className="lg:col-span-5 xl:col-span-4">
                                <div className="rounded-3xl border border-white/20 bg-white/10 p-5 sm:p-6 backdrop-blur-xl shadow-2xl ring-1 ring-white/10">
                                    {/* Header Radar Card */}
                                    <div className="flex items-center justify-between border-b border-white/15 pb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                                                </span>
                                                <span className="text-[10px] font-extrabold tracking-wider text-amber-300 uppercase">
                                                    Radar Produsen Terkini
                                                </span>
                                            </div>
                                            <h3 className="mt-1 text-sm font-bold text-white line-clamp-1">
                                                Sentra Pertanian Indramayu
                                            </h3>
                                        </div>

                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/25 px-2.5 py-1 text-[11px] font-bold text-amber-200">
                                            <Wheat className="h-3.5 w-3.5 text-amber-300" />
                                            <span>6 Komoditas</span>
                                        </span>
                                    </div>

                                    {/* Quick Date Switcher Inside Card */}
                                    <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-white/10 p-2.5 border border-white/15 backdrop-blur-md">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Clock className="h-4 w-4 text-amber-300 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[10px] uppercase font-bold text-emerald-200/80">Tanggal Pantauan</p>
                                                <p className="text-xs font-black text-white truncate">
                                                    {formatIndoDate(filterDate)}
                                                </p>
                                            </div>
                                        </div>
                                        <input
                                            type="date"
                                            value={filterDate}
                                            min={minDate}
                                            max={maxDate}
                                            onChange={(e) => handleDateChange(e.target.value)}
                                            className="text-xs font-bold text-slate-800 bg-white rounded-xl px-2.5 py-1.5 border border-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-xs cursor-pointer"
                                        />
                                    </div>

                                    {/* Mini Highlight Metrics Grid */}
                                    <div className="mt-3.5 grid grid-cols-2 gap-2.5">
                                        <div className="rounded-2xl border border-white/15 bg-white/5 p-3 backdrop-blur-md">
                                            <p className="text-[10px] font-bold uppercase text-amber-200/90">GKP Petani Hari Ini</p>
                                            <p className="mt-1 text-base sm:text-lg font-black text-white">
                                                {formatCurrency(heroStats.gkp?.today_price)}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-emerald-200/70 font-medium">
                                                HAP: {formatCurrency(heroStats.gkp?.hap)}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-white/15 bg-white/5 p-3 backdrop-blur-md">
                                            <p className="text-[10px] font-bold uppercase text-amber-200/90">Beras Medium Giling</p>
                                            <p className="mt-1 text-base sm:text-lg font-black text-white">
                                                {formatCurrency(heroStats.beras?.today_price)}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-emerald-200/70 font-medium">
                                                HAP: {formatCurrency(heroStats.beras?.hap)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Compact Mini Commodity Snapshot Ticker */}
                                    <div className="mt-3.5 space-y-2">
                                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200/70">
                                            Ringkasan Transaksi Produsen
                                        </p>
                                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                            {displayCommodities.slice(0, 4).map((comm) => (
                                                <div
                                                    key={comm.key}
                                                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs transition-colors hover:bg-white/10"
                                                >
                                                    <div className="min-w-0 pr-2">
                                                        <p className="font-bold text-white truncate text-[11px]">
                                                            {comm.name}
                                                        </p>
                                                        <p className="text-[9px] text-emerald-200/70">
                                                            {comm.category} • {comm.unit}
                                                        </p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="font-black text-amber-300 text-xs">
                                                            {formatCurrency(comm.today_price)}
                                                        </p>
                                                        <span
                                                            className={`inline-block text-[9px] font-bold ${
                                                                comm.status === 'above'
                                                                    ? 'text-amber-300'
                                                                    : 'text-emerald-300'
                                                            }`}
                                                        >
                                                            {comm.status === 'above' ? '▲ Di Atas HAP' : '✓ Sesuai HAP'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Footer Card Jump Link */}
                                    <div className="mt-4 border-t border-white/15 pt-3">
                                        <button
                                            type="button"
                                            onClick={() => scrollToSection('cards-section')}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 py-2 text-center text-xs font-bold text-white hover:bg-white/25 transition-all cursor-pointer"
                                        >
                                            <span>Lihat Kartu Lengkap 6 Komoditas</span>
                                            <ChevronRight className="h-3.5 w-3.5 text-amber-300" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================== */}
                {/* 3. MAIN HARGA PRODUSEN CONTENT                                 */}
                {/* ============================================================== */}
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                    {/* Section Header & Quick Jump Navigation */}
                    <div id="cards-section" className="scroll-mt-24">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-200 pb-5">
                            <div>
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3.5 py-1 text-xs font-bold tracking-wider text-amber-800 uppercase">
                                    <Wheat className="h-3.5 w-3.5 text-amber-600" />
                                    <span>Tingkat Produsen • 6 Komoditas Strategis</span>
                                </div>
                                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                                    Daftar Harga Transaksi Tingkat Produsen
                                </h2>
                                <p className="mt-1 max-w-2xl text-xs sm:text-sm font-medium text-slate-600">
                                    Data harga di tingkat petani sawah, penggilingan padi, dan peternak se-Kabupaten Indramayu per {formatIndoDate(filterDate)}.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => scrollToSection('grafik-section')}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:border-[#006565] hover:text-[#006565] transition-colors cursor-pointer"
                                >
                                    <LineChart className="h-3.5 w-3.5 text-[#006565]" />
                                    <span>Grafik Tren</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => scrollToSection('rekap-section')}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:border-[#006565] hover:text-[#006565] transition-colors cursor-pointer"
                                >
                                    <FileSpreadsheet className="h-3.5 w-3.5 text-[#006565]" />
                                    <span>Tabel Historis</span>
                                </button>
                                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs shadow-xs">
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

                        {/* Commodity Cards Grid */}
                        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
                            {displayCommodities.map((comm) => (
                                        <div
                                            key={comm.key}
                                            className="group rounded-2xl border-2 border-slate-200 bg-white overflow-hidden shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
                                        >
                                            <div>
                                                {/* Photo Showcase (Aspect 4:3, Zoom Out / Object Contain) */}
                                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-amber-50/60 via-slate-50/40 to-orange-50/40 border-b border-slate-100 flex items-center justify-center p-3">
                                                    <ProducerCommodityImage
                                                        item={comm}
                                                        className="h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
                                                        fallbackSize="default"
                                                    />
                                                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none gap-1">
                                                        <span className="truncate rounded-md bg-white/95 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-extrabold text-amber-900 uppercase shadow-2xs">
                                                            {comm.category}
                                                        </span>
                                                        <span className="truncate rounded-md bg-amber-600/95 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow-2xs">
                                                            {comm.short_name}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="p-3 pb-0">
                                                    <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-amber-900 transition-colors line-clamp-1" title={comm.name}>
                                                        {comm.name}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5" title={comm.description}>
                                                        {comm.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="p-3 pt-2.5">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-base sm:text-lg font-black text-slate-900">
                                                        {comm.today_price ? `Rp ${comm.today_price.toLocaleString('id-ID')}` : 'Belum Terdata'}
                                                    </span>
                                                    {comm.today_price && (
                                                        <span className="text-[10px] font-semibold text-slate-500">/{comm.unit}</span>
                                                    )}
                                                </div>

                                                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px]">
                                                    <span className="text-slate-500">{comm.hap_label}:</span>
                                                    <span className="font-extrabold text-emerald-700">
                                                        Rp {comm.hap.toLocaleString('id-ID')}
                                                    </span>
                                                </div>

                                                <div className="mt-1 flex items-center justify-between text-[10px]">
                                                    <span className="text-slate-500">vs Kemarin:</span>
                                                    {comm.today_price !== null && comm.yesterday_price !== null ? (
                                                        comm.change_type === 'up' ? (
                                                            <span className="font-bold text-rose-600 truncate ml-1 text-right">
                                                                +Rp {comm.diff_yesterday?.toLocaleString('id-ID')} (+{comm.diff_yesterday_percentage}%)
                                                            </span>
                                                        ) : comm.change_type === 'down' ? (
                                                            <span className="font-bold text-emerald-700 truncate ml-1 text-right">
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
                                                        <span className="inline-block truncate max-w-full rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-700 border border-amber-200">
                                                            Di Atas HAP (+Rp {comm.diff_hap?.toLocaleString('id-ID')})
                                                        </span>
                                                    )}
                                                    {comm.status === 'equal' && (
                                                        <span className="inline-block truncate max-w-full rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700 border border-emerald-200">
                                                            Sesuai HAP Bapanas
                                                        </span>
                                                    )}
                                                    {comm.status === 'below' && (
                                                        <span className="inline-block truncate max-w-full rounded-md bg-rose-50 px-1.5 py-0.5 text-[9px] font-extrabold text-rose-700 border border-rose-200">
                                                            Di Bawah HAP
                                                        </span>
                                                    )}
                                                    {comm.status === 'not_recorded' && (
                                                        <span className="inline-block truncate max-w-full rounded-md bg-slate-50 px-1.5 py-0.5 text-[9px] font-medium text-slate-400 border border-slate-200">
                                                            Belum Dicatat
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                    {/* ============================================================== */}
                    {/* 4. DUA KOLOM: 70% GRAFIK HARGA & 30% DAFTAR DI ATAS HAP/HET    */}
                    {/* ============================================================== */}
                    <div id="grafik-section" className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-10 items-start scroll-mt-20">
                        {/* ---------------------------------------------------------- */}
                        {/* KOLOM KIRI (70% / 7 cols di grid 10)                        */}
                        {/* ---------------------------------------------------------- */}
                        <div className="lg:col-span-7 space-y-4">
                            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xs">
                        {/* Header & Tab Buttons */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-5">
                            <div>
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                                    <LineChart className="h-3.5 w-3.5 text-amber-600" />
                                    <span>Analitik Tren Harga Produsen</span>
                                </div>
                                <h3 className="mt-2 text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                                    Grafik Perkembangan Harga Produsen
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Pergerakan harga komoditas pangan di tingkat petani &amp; produsen dibandingkan batas acuan HAP Bapanas.
                                </p>
                            </div>

                            {/* Tab Switcher (Harian, Mingguan, Bulanan) */}
                            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80">
                                <button
                                    type="button"
                                    onClick={() => setChartTab('daily')}
                                    className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                                        chartTab === 'daily'
                                            ? 'bg-white text-amber-900 shadow-xs ring-1 ring-slate-900/5'
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
                                            ? 'bg-white text-amber-900 shadow-xs ring-1 ring-slate-900/5'
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
                                            ? 'bg-white text-amber-900 shadow-xs ring-1 ring-slate-900/5'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Grafik Bulanan
                                </button>
                            </div>
                        </div>

                        {/* Controls & Filter Bar Sesuai Tabulasi */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50/80 p-3 text-xs border border-slate-100">
                            {/* Filter Komoditas Produsen */}
                            <div className="flex items-center gap-2">
                                <label htmlFor="chart-commodity-prod" className="font-bold text-slate-700 shrink-0">
                                    Komoditas:
                                </label>
                                <select
                                    id="chart-commodity-prod"
                                    value={chartCommodityId}
                                    onChange={(e) => setChartCommodityId(Number(e.target.value))}
                                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-xs focus:border-amber-600 focus:outline-none"
                                >
                                    {(commodities && commodities.length > 0 ? commodities : [
                                        { id: 1, name: 'GKP Tingkat Petani', unit: 'Kg' },
                                        { id: 2, name: 'GKP Tingkat Penggilingan', unit: 'Kg' },
                                        { id: 3, name: 'GKG Tingkat Penggilingan', unit: 'Kg' },
                                        { id: 4, name: 'Beras Medium Penggilingan', unit: 'Kg' },
                                        { id: 5, name: 'Beras Premium Penggilingan', unit: 'Kg' },
                                        { id: 6, name: 'Sapi Hidup', unit: 'Kg' },
                                    ]).map((c) => (
                                        <option key={c.id ?? c.name} value={c.id ?? 1}>
                                            {c.name} ({c.unit})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Filter Harian: Rentang Tanggal (Maks 31 Hari) */}
                            {chartTab === 'daily' && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-slate-600">Rentang (Maks 31 Hari):</span>
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="date"
                                            value={dailyStartDate}
                                            onChange={(e) => handleDailyStartDateChange(e.target.value)}
                                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-xs focus:border-amber-600 focus:outline-none"
                                        />
                                        <span className="text-slate-400">s/d</span>
                                        <input
                                            type="date"
                                            value={dailyEndDate}
                                            onChange={(e) => handleDailyEndDateChange(e.target.value)}
                                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-xs focus:border-amber-600 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Filter Mingguan: Bulan & Tahun */}
                            {chartTab === 'weekly' && (
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-slate-600">Bulan:</span>
                                        <select
                                            value={weeklyMonth}
                                            onChange={(e) => setWeeklyMonth(Number(e.target.value))}
                                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs focus:border-amber-600 focus:outline-none"
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
                                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs focus:border-amber-600 focus:outline-none"
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

                            {/* Filter Bulanan: Tahun saja */}
                            {chartTab === 'monthly' && (
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-600">Tahun:</span>
                                    <select
                                        value={monthlyYear}
                                        onChange={(e) => setMonthlyYear(Number(e.target.value))}
                                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs focus:border-amber-600 focus:outline-none"
                                    >
                                        {[2024, 2025, 2026, 2027].map((y) => (
                                            <option key={y} value={y}>
                                                {y}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Indikator Status HAP */}
                            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-2.5 py-1 text-[11px] border border-slate-200/80 shadow-2xs">
                                <span className="font-bold text-slate-600">Status HAP:</span>
                                <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                                    Sesuai/Bawah
                                </span>
                                <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                    Di Atas HAP
                                </span>
                            </div>
                        </div>

                        {/* Area Canvas Grafik Recharts */}
                        <div className="mt-6 w-full overflow-x-auto overflow-y-hidden">
                            <div
                                className="w-full"
                                style={{
                                    minWidth: chartTab === 'monthly' ? '540px' : chartTab === 'daily' ? '540px' : '100%',
                                    height: 320,
                                }}
                            >
                                {chartLoading ? (
                                    <div className="flex h-[320px] w-full flex-col items-center justify-center gap-2 text-slate-400">
                                        <RefreshCw className="h-6 w-6 animate-spin text-amber-600" />
                                        <span className="text-xs">Memuat data grafik tren harga produsen...</span>
                                    </div>
                                ) : chartPoints.length === 0 ? (
                                    <div className="flex h-[320px] w-full flex-col items-center justify-center text-slate-400">
                                        <BarChart3 className="h-8 w-8 stroke-1 text-slate-300" />
                                        <span className="mt-2 text-xs">Belum ada rekaman harga untuk parameter yang dipilih.</span>
                                    </div>
                                ) : chartTab === 'daily' ? (
                                    <ResponsiveContainer width="100%" height={320} debounce={50}>
                                        <AreaChart
                                            data={chartPoints}
                                            margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorProdPrice" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#b45309" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="#b45309" stopOpacity={0.0} />
                                                </linearGradient>
                                                <linearGradient id="colorProdHap" x1="0" y1="0" x2="0" y2="1">
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
                                                    name === 'price' ? 'Harga Produsen' : 'Batas HAP Acuan',
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
                                                    value === 'price' ? 'Harga Transaksi' : 'Batas HAP Bapanas'
                                                }
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="price"
                                                stroke="#b45309"
                                                strokeWidth={2.5}
                                                fillOpacity={1}
                                                fill="url(#colorProdPrice)"
                                                name="price"
                                                connectNulls
                                                dot={{ r: 3, fill: '#b45309' }}
                                                activeDot={{ r: 5 }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="hap"
                                                stroke="#ef4444"
                                                strokeWidth={2}
                                                strokeDasharray="4 4"
                                                fillOpacity={1}
                                                fill="url(#colorProdHap)"
                                                name="hap"
                                                connectNulls
                                                dot={false}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ResponsiveContainer width="100%" height={320} debounce={50}>
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
                                                        const pHap = item?.payload?.hap;
                                                        if (pHap && Number(value) > Number(pHap)) {
                                                            const pDiff = Number(value) - Number(pHap);
                                                            const pPct = (pDiff / Number(pHap)) * 100;
                                                            return [valFormatted, `Harga Rata-rata (Di Atas HAP / +${pPct.toFixed(1)}%)`];
                                                        }
                                                        return [valFormatted, 'Harga Rata-rata'];
                                                    }
                                                    return [valFormatted, 'HAP Acuan Bapanas'];
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
                                                    value === 'price' ? 'Harga Rata-rata' : 'Batas HAP Acuan'
                                                }
                                            />
                                            <Bar dataKey="price" name="price" radius={[6, 6, 0, 0]} maxBarSize={48}>
                                                {chartPoints.map((entry, index) => {
                                                    const isAbove = entry.price && entry.hap && Number(entry.price) > Number(entry.hap);
                                                    return (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={isAbove ? '#d97706' : '#059669'}
                                                        />
                                                    );
                                                })}
                                            </Bar>
                                            <Line
                                                type="monotone"
                                                dataKey="hap"
                                                stroke="#ef4444"
                                                strokeWidth={2}
                                                strokeDasharray="4 4"
                                                name="hap"
                                                dot={{ r: 3, fill: '#ef4444' }}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Statistik Rangkuman Grafik */}
                        {(() => {
                            const validPoints = chartPoints.filter((p) => p.price !== null && p.price !== undefined);
                            if (validPoints.length === 0) return null;

                            const prices = validPoints.map((p) => Number(p.price));
                            const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
                            const maxP = Math.max(...prices);
                            const minP = Math.min(...prices);
                            const currentHap = validPoints[validPoints.length - 1]?.hap ?? null;

                            return (
                                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-slate-100 pt-5">
                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                                        <div className="text-[10px] font-extrabold uppercase text-slate-400">Rata-rata Periode</div>
                                        <div className="mt-1 text-base font-black text-slate-900">{formatCurrency(avgPrice)}</div>
                                    </div>
                                    <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-100">
                                        <div className="text-[10px] font-extrabold uppercase text-emerald-700">Harga Terendah</div>
                                        <div className="mt-1 text-base font-black text-emerald-900">{formatCurrency(minP)}</div>
                                    </div>
                                    <div className="rounded-xl bg-amber-50/70 p-3 border border-amber-100">
                                        <div className="text-[10px] font-extrabold uppercase text-amber-700">Harga Tertinggi</div>
                                        <div className="mt-1 text-base font-black text-amber-900">{formatCurrency(maxP)}</div>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                                        <div className="text-[10px] font-extrabold uppercase text-slate-400">HAP Acuan Terakhir</div>
                                        <div className="mt-1 text-base font-black text-slate-700">{formatCurrency(currentHap)}</div>
                                    </div>
                                </div>
                            );
                        })()}
                            </div>
                        </div>

                        {/* ---------------------------------------------------------- */}
                        {/* KOLOM KANAN (30% / 3 cols di grid 10)                       */}
                        {/* STATUS LIST KOMODITAS DI ATAS HAP/HET                       */}
                        {/* ---------------------------------------------------------- */}
                        <div id="hap-warning-section" className="lg:col-span-3 scroll-mt-20">
                            <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
                                {/* Header Widget */}
                                <div className="border-b border-slate-100 pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            <span>Peringatan HAP</span>
                                        </div>
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                            {aboveHapCommodities.length} Komoditas
                                        </span>
                                    </div>
                                    <h4 className="mt-2 text-sm font-black text-slate-900 leading-tight">
                                        Daftar Komoditas di Atas HAP/HET Hari Ini
                                    </h4>
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        Komoditas produsen yang melampaui batas HAP Bapanas pada tanggal terpilih.
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
                                        <span className="text-slate-600">&gt; 10%</span>
                                    </div>
                                </div>

                                {/* List Komoditas di Atas HAP */}
                                <div className="mt-3 divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
                                    {aboveHapCommodities.length === 0 ? (
                                        <div className="py-8 text-center">
                                            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            <p className="mt-2 text-xs font-bold text-slate-800">
                                                Semua Harga Aman!
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-slate-500">
                                                Tidak ada komoditas dengan harga di atas HAP pada tanggal ini.
                                            </p>
                                        </div>
                                    ) : (
                                        aboveHapCommodities.map((item) => (
                                            <div
                                                key={item.key || item.id}
                                                className={`py-2.5 px-2.5 rounded-2xl transition-colors mb-2 border ${
                                                    item.isRed
                                                        ? 'bg-rose-50/60 border-rose-200 hover:bg-rose-50'
                                                        : 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className="relative size-9 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs flex items-center justify-center p-0.5">
                                                        <ProducerCommodityImage
                                                            item={item}
                                                            className="h-full w-full object-contain"
                                                            fallbackSize="small"
                                                        />
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
                                                        <p className="text-[10px] text-slate-500">{item.category} • {item.unit}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-1.5 flex items-baseline justify-between text-xs">
                                                    <span className="text-[11px] text-slate-500">
                                                        Harga Produsen:
                                                    </span>
                                                    <span className="font-extrabold text-slate-900">
                                                        {formatCurrency(item.today_price)}
                                                        <span className="text-[10px] font-normal text-slate-500">/{item.unit}</span>
                                                    </span>
                                                </div>

                                                <div className="mt-0.5 flex items-baseline justify-between text-xs">
                                                    <span className="text-[11px] text-slate-500">
                                                        Batas HAP:
                                                    </span>
                                                    <span className="font-semibold text-slate-600">
                                                        {formatCurrency(item.hap)}
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
                    {/* TABEL HISTORIS PERKEMBANGAN HARGA PRODUSEN                     */}
                    {/* ============================================================== */}
                    <div id="rekap-section" className="mt-12 rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xs scroll-mt-20">
                        {/* Header & Export Actions */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-5">
                            <div>
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
                                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                                    <span>Data Historis 6 Komoditas Produsen</span>
                                </div>
                                <h3 className="mt-2 text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                                    Tabel Historis Perkembangan Harga Produsen
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Pergerakan harga komoditas pangan di tingkat petani &amp; produsen se-Kabupaten Indramayu
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
                                            ? 'bg-amber-600 text-white shadow-xs'
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
                                            ? 'bg-amber-600 text-white shadow-xs'
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
                                            ? 'bg-amber-600 text-white shadow-xs'
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
                                <span className="rounded-lg bg-amber-100/70 px-2 py-1 text-[10px] font-extrabold text-amber-900">
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
                                    <div className="flex items-center gap-2.5 rounded-xl bg-white px-4 py-2.5 shadow-md border border-slate-100 text-xs font-bold text-amber-900">
                                        <RefreshCw className="h-4 w-4 animate-spin text-amber-600" />
                                        <span>Memuat data historis harga produsen...</span>
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
                                    Tidak ada data historis produsen yang tersedia untuk rentang tanggal ini.
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
                                                {/* Kolom Komoditas Produsen */}
                                                {(historyCommodities.length > 0 ? historyCommodities : (commodities || [])).map((c) => (
                                                    <th
                                                        key={c.id ?? c.name}
                                                        className="px-3.5 py-3 text-right font-extrabold text-slate-700 min-w-[140px] border-r border-slate-200"
                                                    >
                                                        <div className="font-bold text-slate-900">{c.name}</div>
                                                        <div className="text-[10px] font-normal text-slate-500">
                                                            ({c.unit})
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 bg-white">
                                            {historyRows.map((row, idx) => (
                                                <tr
                                                    key={row.date}
                                                    className="hover:bg-amber-50/40 transition-colors"
                                                >
                                                    {/* Kolom 1: No */}
                                                    <td className="sticky left-0 z-20 bg-white px-3 py-2.5 text-center font-bold text-slate-400 border-r border-slate-200">
                                                        {idx + 1}
                                                    </td>
                                                    {/* Kolom 2: Tanggal */}
                                                    <td className="sticky left-[50px] z-20 bg-white px-4 py-2.5 whitespace-nowrap font-bold text-slate-800 border-r-2 border-slate-300 shadow-xs">
                                                        <span>{row.formatted_date || row.date}</span>
                                                        <span className="ml-1.5 text-[10px] font-normal text-slate-400">
                                                            ({row.day_name})
                                                        </span>
                                                    </td>
                                                    {/* Nilai Harga Tiap Komoditas */}
                                                    {(historyCommodities.length > 0 ? historyCommodities : (commodities || [])).map((c) => {
                                                        const pVal = row.prices[c.id];
                                                        const isAbove = row.is_above_hap?.[c.id] ?? row.is_above_het?.[c.id];
                                                        const diff = row.diffs?.[c.id];

                                                        return (
                                                            <td
                                                                key={c.id ?? c.name}
                                                                className={`px-3.5 py-2.5 text-right font-semibold border-r border-slate-100 whitespace-nowrap ${
                                                                    isAbove
                                                                        ? 'bg-amber-50 text-amber-950 font-bold'
                                                                        : 'text-slate-800'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-end gap-1">
                                                                    {diff === 'up' && (
                                                                        <ArrowUp className="h-3 w-3 text-rose-600 stroke-[2.5]" />
                                                                    )}
                                                                    {diff === 'down' && (
                                                                        <ArrowDown className="h-3 w-3 text-emerald-600 stroke-[2.5]" />
                                                                    )}
                                                                    {diff === 'stable' && (
                                                                        <Minus className="h-3 w-3 text-slate-300 stroke-[2]" />
                                                                    )}
                                                                    <span>{formatCurrency(pVal)}</span>
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}

                                            {/* BARIS RATA-RATA PERIODE */}
                                            <tr className="border-t-2 border-slate-300 bg-slate-100/90 font-extrabold text-slate-900">
                                                <td
                                                    colSpan={2}
                                                    className="sticky left-0 z-20 bg-slate-100 px-4 py-2.5 text-center font-black text-slate-800 border-r-2 border-slate-300"
                                                >
                                                    Rata-rata Periode
                                                </td>
                                                {(historyCommodities.length > 0 ? historyCommodities : (commodities || [])).map((c) => {
                                                    const avg = historyPeriodAvgs[c.id];
                                                    return (
                                                        <td
                                                            key={c.id ?? c.name}
                                                            className="px-3.5 py-2.5 text-right font-black text-slate-900 border-r border-slate-200 whitespace-nowrap"
                                                        >
                                                            {formatCurrency(avg)}
                                                        </td>
                                                    );
                                                })}
                                            </tr>

                                            {/* BARIS HARGA HAP ACUAN */}
                                            <tr className="bg-slate-50 font-bold text-slate-700">
                                                <td
                                                    colSpan={2}
                                                    className="sticky left-0 z-20 bg-slate-50 px-4 py-2 text-center text-[11px] font-bold text-slate-600 border-r-2 border-slate-300"
                                                >
                                                    Harga HAP (Bapanas)
                                                </td>
                                                {(historyCommodities.length > 0 ? historyCommodities : (commodities || [])).map((c) => {
                                                    const hapVal = historyCommodityHaps[c.id] ?? (historyRows[0]?.haps?.[c.id] ?? null);
                                                    return (
                                                        <td
                                                            key={c.id ?? c.name}
                                                            className="px-3.5 py-2 text-right text-[11px] font-bold text-emerald-700 border-r border-slate-200 whitespace-nowrap"
                                                        >
                                                            {formatCurrency(hapVal)}
                                                        </td>
                                                    );
                                                })}
                                            </tr>

                                            {/* BARIS % TERHADAP HAP ACUAN */}
                                            <tr className="bg-white font-bold">
                                                <td
                                                    colSpan={2}
                                                    className="sticky left-0 z-20 bg-white px-4 py-2 text-center text-[11px] font-bold text-slate-600 border-r-2 border-slate-300"
                                                >
                                                    % terhadap HAP
                                                </td>
                                                {(historyCommodities.length > 0 ? historyCommodities : (commodities || [])).map((c) => {
                                                    const avg = historyPeriodAvgs[c.id];
                                                    const hapVal = historyCommodityHaps[c.id] ?? (historyRows[0]?.haps?.[c.id] ?? null);
                                                    const res = getChangeColorAndText(avg, hapVal ? Number(hapVal) : null);
                                                    return (
                                                        <td
                                                            key={c.id ?? c.name}
                                                            className={`px-3.5 py-2 text-right text-[11px] border-r border-slate-200 whitespace-nowrap ${res.bgClass}`}
                                                        >
                                                            {res.text}
                                                        </td>
                                                    );
                                                })}
                                            </tr>

                                            {/* BARIS RATA-RATA BULAN LALU */}
                                            <tr className="bg-slate-50 font-bold text-slate-700">
                                                <td
                                                    colSpan={2}
                                                    className="sticky left-0 z-20 bg-slate-50 px-4 py-2 text-center text-[11px] font-bold text-slate-600 border-r-2 border-slate-300"
                                                >
                                                    Rata-rata {historyPrevMonthLabel || 'Bulan Lalu'}
                                                </td>
                                                {(historyCommodities.length > 0 ? historyCommodities : (commodities || [])).map((c) => {
                                                    const prevAvg = historyPrevMonthAvgs[c.id];
                                                    return (
                                                        <td
                                                            key={c.id ?? c.name}
                                                            className="px-3.5 py-2 text-right text-[11px] font-semibold text-slate-600 border-r border-slate-200 whitespace-nowrap"
                                                        >
                                                            {prevAvg ? formatCurrency(prevAvg) : '-'}
                                                        </td>
                                                    );
                                                })}
                                            </tr>

                                            {/* BARIS % TERHADAP BULAN LALU */}
                                            <tr className="bg-white font-bold">
                                                <td
                                                    colSpan={2}
                                                    className="sticky left-0 z-20 bg-white px-4 py-2 text-center text-[11px] font-bold text-slate-600 border-r-2 border-slate-300"
                                                >
                                                    % thd {historyPrevMonthLabel || 'Bulan Lalu'}
                                                </td>
                                                {(historyCommodities.length > 0 ? historyCommodities : (commodities || [])).map((c) => {
                                                    const avg = historyPeriodAvgs[c.id];
                                                    const prevAvg = historyPrevMonthAvgs[c.id];
                                                    const res = getChangeColorAndText(avg, prevAvg ? Number(prevAvg) : null);
                                                    return (
                                                        <td
                                                            key={c.id ?? c.name}
                                                            className={`px-3.5 py-2 text-right text-[11px] border-r border-slate-200 whitespace-nowrap ${res.bgClass}`}
                                                        >
                                                            {res.text}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>


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

                {/* Public Portal Footer */}
                <PortalFooter />
            </div>
        </>
    );
}

