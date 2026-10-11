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
    Legend,
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

interface PageProps {
    items: NeracaItem[];
    selectedYear: number;
    selectedMonth: number;
    availableYears: number[];
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

export default function NeracaPanganPublic({
    items,
    selectedYear,
    selectedMonth,
    availableYears,
    statistics,
}: PageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

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

    // Data for Recharts comparison
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

