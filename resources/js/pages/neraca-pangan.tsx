import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    BarChart3,
    Calendar,
    CheckCircle2,
    Layers,
    Search,
    ShoppingBag,
    TrendingDown,
    TrendingUp,
    Wheat,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import AppLogo from '@/components/app-logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface NeracaItem {
    id: number;
    name: string;
    slug: string;
    unit: string;
    order: number;
    produksi: number | null;
    ketersediaan: number | null;
    kebutuhan: number | null;
    selisih: number | null;
    keterangan: string;
    notes: string | null;
    is_recorded: boolean;
}

export interface MonthlyTrendItem {
    month: number;
    month_name: string;
    month_short: string;
    produksi: number;
    ketersediaan: number;
    kebutuhan: number;
    selisih: number;
    keterangan: 'Surplus' | 'Defisit';
    has_data: boolean;
}

export interface MonthlyTrendsData {
    all: MonthlyTrendItem[];
    by_commodity: Record<number, MonthlyTrendItem[]>;
}

interface PageProps {
    items: NeracaItem[];
    selectedYear: number;
    selectedMonth: number;
    availableYears: number[];
    monthlyTrends?: MonthlyTrendsData;
    statistics: {
        total_commodities: number;
        recorded_count: number;
        surplus_count: number;
        defisit_count: number;
        total_produksi: number;
        total_ketersediaan: number;
        total_kebutuhan: number;
        total_selisih: number;
    };
}

const MONTH_NAMES = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
];

function getMonthLabel(m: number): string {
    return MONTH_NAMES.find((item) => item.value === m)?.label ?? `Bulan ${m}`;
}

function formatNumber(num: number | null): string {
    if (num === null || num === undefined) return '-';
    return Number(num).toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

function formatCompactNumber(num: number): string {
    const abs = Math.abs(num);
    if (abs >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(1)}M`;
    }
    if (abs >= 1_000) {
        return `${(num / 1_000).toFixed(0)}k`;
    }
    return String(Math.round(num));
}

function CustomTrendTooltip({
    active,
    payload,
    year,
    unit,
}: {
    active?: boolean;
    payload?: any[];
    year: number;
    unit: string;
}) {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload as MonthlyTrendItem;
    if (!data) return null;

    const isSurplus = data.selisih >= 0;

    return (
        <div className="rounded-xl border border-slate-200/90 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 text-xs min-w-[230px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 dark:border-slate-800">
                <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-emerald-600" />
                    <span>
                        {data.month_name} {year}
                    </span>
                </div>
                {data.has_data ? (
                    <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isSurplus
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                    >
                        {isSurplus ? (
                            <>
                                <CheckCircle2 className="size-2.5" /> Surplus
                            </>
                        ) : (
                            <>
                                <AlertCircle className="size-2.5" /> Defisit
                            </>
                        )}
                    </span>
                ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        Belum Ada Data
                    </span>
                )}
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <span className="size-2.5 rounded-sm bg-emerald-600 inline-block" />
                        Ketersediaan:
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {data.has_data ? `${formatNumber(data.ketersediaan)} ${unit}` : '-'}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <span className="size-2.5 rounded-sm bg-blue-500 inline-block" />
                        Kebutuhan:
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {data.has_data ? `${formatNumber(data.kebutuhan)} ${unit}` : '-'}
                    </span>
                </div>

                {data.produksi > 0 && (
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-sm bg-slate-300 inline-block" />
                            Produksi:
                        </span>
                        <span className="font-mono">
                            {formatNumber(data.produksi)} {unit}
                        </span>
                    </div>
                )}

                <div className="border-t border-slate-100 pt-1.5 mt-1.5 dark:border-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                        <span className="size-2.5 rounded-full bg-amber-500 inline-block" />
                        Garis Neraca:
                    </span>
                    <span
                        className={`font-mono font-bold ${
                            isSurplus
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                        }`}
                    >
                        {data.has_data ? (
                            <>
                                {data.selisih >= 0 ? '+' : ''}
                                {formatNumber(data.selisih)} {unit}
                            </>
                        ) : (
                            '-'
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function NeracaPanganPublic({
    items,
    selectedYear,
    selectedMonth,
    availableYears,
    monthlyTrends,
    statistics,
}: PageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedTrendCommodity, setSelectedTrendCommodity] = useState<string>('all');
    const [trendScaleMode, setTrendScaleMode] = useState<'dual' | 'single'>('dual');

    const handlePeriodChange = (yr: number, mo: number) => {
        router.get(
            '/neraca-pangan',
            { year: yr, month: mo },
            { preserveState: true, preserveScroll: true }
        );
    };

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch =
                searchTerm === '' ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'surplus' && item.keterangan === 'Surplus') ||
                (statusFilter === 'defisit' && item.keterangan === 'Defisit');

            return matchesSearch && matchesStatus;
        });
    }, [items, searchTerm, statusFilter]);

    // Data for single-month Recharts comparison
    const chartData = useMemo(() => {
        return items
            .filter((item) => item.is_recorded)
            .map((item) => ({
                name: item.name,
                Ketersediaan: item.ketersediaan || 0,
                Kebutuhan: item.kebutuhan || 0,
                Selisih: item.selisih || 0,
            }));
    }, [items]);

    // Trend commodity metadata
    const activeTrendCommodity = useMemo(() => {
        if (selectedTrendCommodity === 'all') {
            return { id: 0, name: 'Semua Komoditas (Kumulatif)', unit: 'Ton' };
        }
        const found = items.find((i) => i.id === Number(selectedTrendCommodity));
        return {
            id: found?.id ?? 0,
            name: found?.name ?? 'Komoditas',
            unit: found?.unit ?? 'Ton',
        };
    }, [selectedTrendCommodity, items]);

    // Monthly data from January to December
    const activeTrendData = useMemo(() => {
        if (!monthlyTrends) return [];
        if (selectedTrendCommodity === 'all') {
            return monthlyTrends.all || [];
        }
        return monthlyTrends.by_commodity?.[Number(selectedTrendCommodity)] || [];
    }, [monthlyTrends, selectedTrendCommodity]);

    // Annual cumulative metrics for the selected trend commodity
    const trendStats = useMemo(() => {
        const data = activeTrendData;
        const validMonths = data.filter((d) => d.has_data);
        const totalKet = validMonths.reduce((acc, curr) => acc + curr.ketersediaan, 0);
        const totalKbt = validMonths.reduce((acc, curr) => acc + curr.kebutuhan, 0);
        const totalDiff = totalKet - totalKbt;
        const avgKet = validMonths.length > 0 ? totalKet / validMonths.length : 0;
        const avgKbt = validMonths.length > 0 ? totalKbt / validMonths.length : 0;
        const surplusMonthsCount = validMonths.filter((d) => d.selisih >= 0).length;
        const defisitMonthsCount = validMonths.filter((d) => d.selisih < 0).length;

        return {
            totalKet,
            totalKbt,
            totalDiff,
            avgKet,
            avgKbt,
            surplusMonthsCount,
            defisitMonthsCount,
            recordedMonthsCount: validMonths.length,
        };
    }, [activeTrendData]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
            <Head title={`Neraca Pangan Bulanan (${getMonthLabel(selectedMonth)} ${selectedYear}) - DKPP Indramayu`} />

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2.5">
                            <AppLogo />
                        </Link>
                    </div>

                    {/* Navigation Pills */}
                    <nav className="flex items-center gap-1.5 sm:gap-2">
                        <Link
                            href="/harga-konsumen"
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
                        >
                            <ShoppingBag className="size-3.5" />
                            <span className="hidden sm:inline">Harga Konsumen</span>
                        </Link>
                        <Link
                            href="/harga-produsen"
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
                        >
                            <Wheat className="size-3.5" />
                            <span className="hidden sm:inline">Harga Produsen</span>
                        </Link>
                        <Link
                            href="/neraca-pangan"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60"
                        >
                            <Layers className="size-3.5" />
                            <span>Neraca Pangan</span>
                        </Link>

                        <div className="ml-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                                Masuk Admin
                            </Link>
                        </div>
                    </nav>
                </div>
            </header>

            {/* Main Content Container */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
                {/* Hero Title & Period Selector */}
                <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 p-6 sm:p-8 text-white shadow-lg lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100 backdrop-blur-sm border border-white/10 mb-3">
                            <Layers className="size-3.5" />
                            Dinas Ketahanan Pangan dan Pertanian Kabupaten Indramayu
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                            Neraca Pangan Bulanan
                        </h1>
                        <p className="mt-1.5 text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
                            Informasi ketersediaan, kebutuhan, dan status surplus/defisit pangan strategis bulanan Kabupaten Indramayu.
                        </p>
                    </div>

                    {/* Period Picker in Hero */}
                    <div className="flex flex-wrap items-center gap-2.5 rounded-xl bg-white/10 p-3 backdrop-blur-md border border-white/20">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-100">
                            <Calendar className="size-4" />
                            Periode:
                        </div>

                        <Select
                            value={String(selectedMonth)}
                            onValueChange={(val) => handlePeriodChange(selectedYear, parseInt(val, 10))}
                        >
                            <SelectTrigger className="w-32 h-8 text-xs bg-white text-slate-900 border-none font-semibold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTH_NAMES.map((m) => (
                                    <SelectItem key={m.value} value={String(m.value)}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={String(selectedYear)}
                            onValueChange={(val) => handlePeriodChange(parseInt(val, 10), selectedMonth)}
                        >
                            <SelectTrigger className="w-24 h-8 text-xs bg-white text-slate-900 border-none font-semibold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableYears.map((yr) => (
                                    <SelectItem key={yr} value={String(yr)}>
                                        {yr}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Komoditas Dipantau
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {statistics.total_commodities} Komoditas
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                {statistics.recorded_count} komoditas memiliki data tercatat
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-200 bg-emerald-50/40 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                Komoditas Surplus
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="size-5 text-emerald-600" />
                                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                                    {statistics.surplus_count} Komoditas
                                </div>
                            </div>
                            <p className="text-xs text-emerald-600/80 mt-1">
                                Pasokan ketersediaan melebihi kebutuhan
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-rose-200 bg-rose-50/40 shadow-sm dark:border-rose-900 dark:bg-rose-950/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                                Komoditas Defisit
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <TrendingDown className="size-5 text-rose-600" />
                                <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                                    {statistics.defisit_count} Komoditas
                                </div>
                            </div>
                            <p className="text-xs text-rose-600/80 mt-1">
                                Perlu intervensi / pasokan tambahan dari luar
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Total Neraca Pangan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`text-2xl font-bold ${
                                    statistics.total_selisih < 0
                                        ? 'text-rose-600 dark:text-rose-400'
                                        : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                            >
                                {statistics.total_selisih >= 0 ? '+' : ''}
                                {formatNumber(statistics.total_selisih)} Ton
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Selisih kumulatif seluruh komoditas
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Comparison Bar Chart Card */}
                {chartData.length > 0 && (
                    <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="size-4 text-emerald-600" />
                                    <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                        Grafik Perbandingan Ketersediaan vs Kebutuhan ({getMonthLabel(selectedMonth)} {selectedYear})
                                    </CardTitle>
                                </div>
                                <span className="text-xs text-slate-400">Satuan: Ton</span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={chartData}
                                        margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                        <XAxis
                                            dataKey="name"
                                            angle={-30}
                                            textAnchor="end"
                                            interval={0}
                                            height={50}
                                            tick={{ fontSize: 11 }}
                                        />
                                        <YAxis
                                            tickFormatter={(val) =>
                                                val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val
                                            }
                                            tick={{ fontSize: 11 }}
                                        />
                                        <Tooltip
                                            formatter={(value: any) => [
                                                formatNumber(Number(value)) + ' Ton',
                                            ]}
                                        />
                                        <Legend verticalAlign="top" height={36} />
                                        <Bar
                                            dataKey="Ketersediaan"
                                            fill="#059669"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="Kebutuhan"
                                            fill="#3b82f6"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Filter and Search Bar */}
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Cari komoditas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9 border-slate-200 dark:border-slate-700"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-36 h-9 border-slate-200 dark:border-slate-700">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="surplus">Surplus</SelectItem>
                                <SelectItem value="defisit">Defisit</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Food Balance Public Table */}
                <Card className="border-slate-200/80 shadow-sm overflow-hidden dark:border-slate-800">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-50 border-b border-slate-200/80 text-xs uppercase text-slate-500 font-semibold dark:bg-slate-800/50 dark:border-slate-700">
                                <tr>
                                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                                    <th className="py-3.5 px-4">Nama Komoditas</th>
                                    <th className="py-3.5 px-4 w-24 text-center">Satuan</th>
                                    <th className="py-3.5 px-4 text-right">Produksi</th>
                                    <th className="py-3.5 px-4 text-right">Ketersediaan</th>
                                    <th className="py-3.5 px-4 text-right">Kebutuhan</th>
                                    <th className="py-3.5 px-4 text-right">Selisih</th>
                                    <th className="py-3.5 px-4 w-32 text-center">Status Neraca</th>
                                    <th className="py-3.5 px-4">Catatan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-8 text-center text-slate-400">
                                            Tidak ada data komoditas ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item, idx) => (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-xs">
                                                {idx + 1}
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                                                {item.name}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                >
                                                    {item.unit}
                                                </Badge>
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                                                {item.is_recorded ? formatNumber(item.produksi) : '-'}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                                                {item.is_recorded ? formatNumber(item.ketersediaan) : '-'}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                                                {item.is_recorded ? formatNumber(item.kebutuhan) : '-'}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold">
                                                {item.is_recorded ? (
                                                    <span
                                                        className={
                                                            item.selisih !== null && item.selisih < 0
                                                                ? 'text-rose-600 dark:text-rose-400'
                                                                : 'text-emerald-600 dark:text-emerald-400'
                                                        }
                                                    >
                                                        {item.selisih !== null && item.selisih >= 0 ? '+' : ''}
                                                        {formatNumber(item.selisih)}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                {!item.is_recorded ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                                        Belum Ada Data
                                                    </span>
                                                ) : item.keterangan === 'Surplus' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                        <CheckCircle2 className="size-3" />
                                                        Surplus
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                                        <AlertCircle className="size-3" />
                                                        Defisit
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                                                {item.notes || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Yearly Trend Chart (January - December) */}
                <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
                    <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                        <TrendingUp className="size-4" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100">
                                            Grafik Ketersediaan, Kebutuhan & Garis Neraca ({selectedYear})
                                        </CardTitle>
                                        <p className="text-xs text-slate-500">
                                            Tren bulanan ketersediaan, kebutuhan, dan posisi surplus/defisit dari Januari sampai Desember
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Chart Controls: Commodity Selector & Scale Toggle */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-slate-500">Komoditas:</span>
                                    <Select
                                        value={selectedTrendCommodity}
                                        onValueChange={setSelectedTrendCommodity}
                                    >
                                        <SelectTrigger className="w-56 h-8 text-xs border-slate-200 dark:border-slate-700">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Semua Komoditas (Kumulatif)
                                            </SelectItem>
                                            {items.map((item) => (
                                                <SelectItem key={item.id} value={String(item.id)}>
                                                    {item.name} ({item.unit})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 text-xs dark:border-slate-700 dark:bg-slate-800/80">
                                    <button
                                        type="button"
                                        onClick={() => setTrendScaleMode('dual')}
                                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                            trendScaleMode === 'dual'
                                                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                                        }`}
                                        title="Skala ganda: Volume bar di sumbu kiri, Garis Neraca di sumbu kanan"
                                    >
                                        Skala Ganda
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTrendScaleMode('single')}
                                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                            trendScaleMode === 'single'
                                                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                                        }`}
                                        title="Skala tunggal: Semua metrik dalam satu sumbu nilai"
                                    >
                                        Skala Tunggal
                                    </button>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                        {activeTrendData.length === 0 || !activeTrendData.some((d) => d.has_data) ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                                <AlertCircle className="size-8 text-slate-300 mb-2" />
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    Belum ada data neraca pangan tercatat untuk tahun {selectedYear}.
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Data akan otomatis muncul di grafik setelah data bulanan disimpan di sistem.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Visual badges indicating the series */}
                                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                                            <span className="size-3 rounded-sm bg-emerald-600" />
                                            <span>Batang Hijau: Ketersediaan</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                                            <span className="size-3 rounded-sm bg-blue-500" />
                                            <span>Batang Biru: Kebutuhan</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                                            <span className="h-0.5 w-4 bg-amber-500 rounded-full" />
                                            <span>Garis Oranye: Neraca (Surplus/Defisit)</span>
                                        </div>
                                    </div>

                                    <div className="text-xs text-slate-400 font-medium">
                                        Satuan: <span className="font-semibold text-slate-600 dark:text-slate-300">{activeTrendCommodity.unit}</span>
                                    </div>
                                </div>

                                {/* Responsive Chart Canvas */}
                                <div className="h-80 sm:h-96 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart
                                            data={activeTrendData}
                                            margin={{
                                                top: 15,
                                                right: trendScaleMode === 'dual' ? 25 : 15,
                                                left: 10,
                                                bottom: 10,
                                            }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                                            <XAxis
                                                dataKey="month_short"
                                                tick={{ fontSize: 12, fill: '#64748b' }}
                                                axisLine={{ stroke: '#cbd5e1' }}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                yAxisId="left"
                                                orientation="left"
                                                tickFormatter={(val) => formatCompactNumber(Number(val))}
                                                tick={{ fontSize: 11, fill: '#64748b' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            {trendScaleMode === 'dual' && (
                                                <YAxis
                                                    yAxisId="right"
                                                    orientation="right"
                                                    tickFormatter={(val) =>
                                                        val > 0
                                                            ? `+${formatCompactNumber(Number(val))}`
                                                            : formatCompactNumber(Number(val))
                                                    }
                                                    tick={{ fontSize: 11, fill: '#d97706' }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                            )}

                                            {trendScaleMode === 'dual' ? (
                                                <ReferenceLine
                                                    yAxisId="right"
                                                    y={0}
                                                    stroke="#94a3b8"
                                                    strokeDasharray="3 3"
                                                />
                                            ) : (
                                                <ReferenceLine
                                                    yAxisId="left"
                                                    y={0}
                                                    stroke="#94a3b8"
                                                    strokeDasharray="3 3"
                                                />
                                            )}

                                            <Tooltip
                                                content={
                                                    <CustomTrendTooltip
                                                        year={selectedYear}
                                                        unit={activeTrendCommodity.unit}
                                                    />
                                                }
                                            />
                                            <Legend
                                                verticalAlign="top"
                                                height={36}
                                                iconType="circle"
                                                wrapperStyle={{ fontSize: '12px', paddingBottom: '8px' }}
                                            />

                                            <Bar
                                                yAxisId="left"
                                                dataKey="ketersediaan"
                                                name="Ketersediaan"
                                                fill="#059669"
                                                radius={[4, 4, 0, 0]}
                                                maxBarSize={36}
                                            />
                                            <Bar
                                                yAxisId="left"
                                                dataKey="kebutuhan"
                                                name="Kebutuhan"
                                                fill="#3b82f6"
                                                radius={[4, 4, 0, 0]}
                                                maxBarSize={36}
                                            />
                                            <Line
                                                yAxisId={trendScaleMode === 'dual' ? 'right' : 'left'}
                                                type="monotone"
                                                dataKey="selisih"
                                                name="Garis Neraca (Surplus/Defisit)"
                                                stroke="#f59e0b"
                                                strokeWidth={3}
                                                dot={{
                                                    r: 4,
                                                    fill: '#f59e0b',
                                                    strokeWidth: 2,
                                                    stroke: '#ffffff',
                                                }}
                                                activeDot={{
                                                    r: 6,
                                                    fill: '#d97706',
                                                    strokeWidth: 2,
                                                    stroke: '#ffffff',
                                                }}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Annual Cumulative Metrics Cards */}
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                                            Total Ketersediaan
                                        </span>
                                        <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
                                            {formatNumber(trendStats.totalKet)} {activeTrendCommodity.unit}
                                        </div>
                                        <span className="text-[11px] text-slate-400">
                                            Rata-rata: {formatNumber(trendStats.avgKet)} / bln
                                        </span>
                                    </div>

                                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                                            Total Kebutuhan
                                        </span>
                                        <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
                                            {formatNumber(trendStats.totalKbt)} {activeTrendCommodity.unit}
                                        </div>
                                        <span className="text-[11px] text-slate-400">
                                            Rata-rata: {formatNumber(trendStats.avgKbt)} / bln
                                        </span>
                                    </div>

                                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                                            Akumulasi Garis Neraca
                                        </span>
                                        <div
                                            className={`text-base font-bold mt-1 font-mono ${
                                                trendStats.totalDiff >= 0
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-rose-600 dark:text-rose-400'
                                            }`}
                                        >
                                            {trendStats.totalDiff >= 0 ? '+' : ''}
                                            {formatNumber(trendStats.totalDiff)} {activeTrendCommodity.unit}
                                        </div>
                                        <span className="text-[11px] text-slate-400">
                                            Kumulatif Jan - Des
                                        </span>
                                    </div>

                                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                                            Status Periode Bulanan
                                        </span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                                <TrendingUp className="size-3.5" />
                                                {trendStats.surplusMonthsCount} Surplus
                                            </span>
                                            <span className="text-slate-300">/</span>
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
                                                <TrendingDown className="size-3.5" />
                                                {trendStats.defisitMonthsCount} Defisit
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-slate-400">
                                            Dari {trendStats.recordedMonthsCount} bulan tercatat
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Explanatory Callout */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-xs text-slate-600 space-y-2 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Layers className="size-4 text-emerald-600" />
                        Tentang Neraca Pangan Bulanan Kabupaten Indramayu
                    </div>
                    <p className="leading-relaxed">
                        Neraca Pangan merupakan instrumen analisis untuk mengetahui gambaran ketersediaan, kebutuhan, dan cadangan pangan suatu wilayah dalam periode bulanan. Selisih positif menandakan <strong>Surplus</strong> pangan, sedangkan selisih negatif menandakan <strong>Defisit</strong> yang memerlukan langkah antisipatif seperti pasokan antar daerah atau operasi pasar.
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-12 border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto max-w-7xl px-4">
                    &copy; {new Date().getFullYear()} Dinas Ketahanan Pangan dan Pertanian Kabupaten Indramayu. Seluruh Hak Cipta Dilindungi.
                </div>
            </footer>
        </div>
    );
}

