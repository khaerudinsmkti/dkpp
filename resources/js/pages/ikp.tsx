import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    Award,
    BarChart2,
    CheckCircle2,
    ChevronRight,
    ExternalLink,
    FileSpreadsheet,
    HelpCircle,
    Info,
    Layers,
    LineChart as LineChartIcon,
    PieChart,
    Printer,
    Scale,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Store,
    TrendingDown,
    TrendingUp,
    Utensils,
    Wheat,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import PortalFooter from '@/components/portal-footer';
import PortalNavbar from '@/components/portal-navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface YearlyIkpItem {
    id: number;
    tahun: number;
    nilai_ikp: number;
    target_renstra: number;
    diff_renstra: number;
    capaian_percentage: number;
    diff_previous: number;
    diff_percentage: number;
    status: string;
    is_achieved: boolean;
    keterangan: string | null;
}

export interface IkpPageProps {
    yearlyScores: YearlyIkpItem[];
    summary: {
        total_years: number;
        latest_year: number;
        latest_nilai_ikp: number;
        latest_target_renstra: number;
        latest_status: string;
        latest_diff_renstra: number;
        latest_diff_previous: number;
        avg_nilai_ikp: number;
        avg_target_renstra: number;
        highest_score: number;
        lowest_score: number;
    };
}

type ChartDisplayMode = 'composed' | 'side-by-side' | 'line';

function getCategoryBadge(status: string) {
    switch (status) {
        case 'Sangat Tahan':
            return {
                label: 'Sangat Tahan Pangan',
                badgeClass:
                    'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
                color: '#059669',
            };
        case 'Tahan':
            return {
                label: 'Tahan Pangan',
                badgeClass:
                    'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
                color: '#0d9488',
            };
        case 'Agak Tahan':
            return {
                label: 'Agak Tahan Pangan',
                badgeClass:
                    'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
                color: '#d97706',
            };
        case 'Agak Rentan':
            return {
                label: 'Agak Rentan Pangan',
                badgeClass:
                    'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
                color: '#ea580c',
            };
        case 'Rentan':
        case 'Sangat Rentan':
            return {
                label: status + ' Pangan',
                badgeClass:
                    'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
                color: '#e11d48',
            };
        default:
            return {
                label: status,
                badgeClass:
                    'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                color: '#64748b',
            };
    }
}

export default function IkpPage({ yearlyScores, summary }: IkpPageProps) {
    const [chartMode, setChartMode] = useState<ChartDisplayMode>('composed');

    const handlePrint = () => {
        window.print();
    };

    const latestItem = useMemo(() => {
        return (
            yearlyScores.find((s) => s.tahun === summary.latest_year) ??
            yearlyScores[yearlyScores.length - 1]
        );
    }, [yearlyScores, summary.latest_year]);

    const latestCategory = getCategoryBadge(summary.latest_status);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
            <Head>
                <title>Indeks Ketahanan Pangan (IKP) - Satu Data DKPP Indramayu</title>
                <meta
                    name="description"
                    content="Pemantauan capaian Indeks Ketahanan Pangan (IKP) dan Target Renstra Kabupaten Indramayu berbasis 3 pilar ketahanan pangan nasional."
                />
            </Head>

            {/* Public Portal Navigation */}
            <PortalNavbar activePage="ikp" />

            {/* Hero Section Banner */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#003d3d] via-[#005757] to-[#002828] text-white">
                {/* Background Geometric Glow & Mesh Pattern */}
                <div className="absolute inset-0 opacity-15 pointer-events-none">
                    <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-emerald-400 blur-3xl" />
                    <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-teal-300 blur-3xl" />
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                        {/* Hero Text */}
                        <div className="max-w-3xl space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black tracking-wider text-emerald-300 border border-emerald-400/30 uppercase">
                                    <Wheat className="h-3.5 w-3.5" />
                                    <span>Lumbung Padi Nasional</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/90 backdrop-blur-md border border-white/20">
                                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                                    <span>Status: {latestCategory.label}</span>
                                </span>
                            </div>

                            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                                Indeks Ketahanan Pangan{' '}
                                <span className="bg-gradient-to-r from-emerald-200 via-teal-100 to-white bg-clip-text text-transparent">
                                    (IKP)
                                </span>
                            </h1>

                            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl">
                                Mengukur ketahanan pangan daerah Kabupaten Indramayu secara komprehensif melalui integrasi 3 pilar utama: <strong>Ketersediaan Pangan</strong>, <strong>Keterjangkauan Pangan</strong>, dan <strong>Pemanfaatan Pangan</strong> disandingkan dengan Target Rencana Strategis (RENSTRA).
                            </p>

                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <a
                                    href="#grafik-ikp"
                                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-[#006565] shadow-lg shadow-black/10 hover:bg-emerald-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <BarChart2 className="h-4 w-4" />
                                    <span>Lihat Grafik IKP vs Renstra</span>
                                </a>
                                <a
                                    href="#tabel-data"
                                    className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs sm:text-sm font-bold text-white backdrop-blur-md border border-white/25 hover:bg-white/25 transition-all"
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                    <span>Data Historis Tahunan</span>
                                </a>
                            </div>
                        </div>

                        {/* Hero Score Badge Highlight */}
                        <div className="shrink-0">
                            <div className="relative rounded-3xl border border-white/20 bg-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl text-center space-y-3 lg:w-72">
                                <div className="text-[11px] font-black uppercase tracking-widest text-emerald-200">
                                    Skor IKP Terkini ({summary.latest_year})
                                </div>
                                <div className="text-5xl sm:text-6xl font-black tracking-tight text-white font-mono">
                                    {summary.latest_nilai_ikp.toFixed(2)}
                                </div>
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/25 px-3 py-1 text-xs font-bold text-emerald-100 border border-emerald-300/30">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                                    <span>{latestCategory.label}</span>
                                </div>
                                <div className="pt-2 border-t border-white/15 text-xs text-emerald-100/80">
                                    Target RENSTRA: <strong className="text-white font-mono">{summary.latest_target_renstra.toFixed(2)}</strong>
                                    {summary.latest_diff_renstra >= 0 ? (
                                        <span className="block mt-0.5 text-emerald-300 font-bold">
                                            Melampaui Target (+{summary.latest_diff_renstra.toFixed(2)})
                                        </span>
                                    ) : (
                                        <span className="block mt-0.5 text-rose-300 font-bold">
                                            Selisih {summary.latest_diff_renstra.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Summary Cards Grid */}
                    <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                            <div className="flex items-center justify-between text-emerald-200">
                                <span className="text-[11px] font-bold uppercase tracking-wider">Capaian Renstra</span>
                                <TrendingUp className="h-4 w-4" />
                            </div>
                            <div className="mt-2 text-xl sm:text-2xl font-black text-white">
                                {latestItem ? `${latestItem.capaian_percentage.toFixed(1)}%` : '100%'}
                            </div>
                            <div className="text-[11px] text-emerald-100/70 mt-1">
                                {summary.latest_diff_renstra >= 0 ? 'Surplus target daerah' : 'Evaluasi berkala'}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                            <div className="flex items-center justify-between text-emerald-200">
                                <span className="text-[11px] font-bold uppercase tracking-wider">Pertumbuhan</span>
                                <Activity className="h-4 w-4" />
                            </div>
                            <div className="mt-2 text-xl sm:text-2xl font-black text-white">
                                {summary.latest_diff_previous >= 0 ? '+' : ''}
                                {summary.latest_diff_previous.toFixed(2)}
                            </div>
                            <div className="text-[11px] text-emerald-100/70 mt-1">
                                Poin vs tahun sebelumnya
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                            <div className="flex items-center justify-between text-emerald-200">
                                <span className="text-[11px] font-bold uppercase tracking-wider">Rata-rata IKP</span>
                                <ShieldCheck className="h-4 w-4" />
                            </div>
                            <div className="mt-2 text-xl sm:text-2xl font-black text-white">
                                {summary.avg_nilai_ikp.toFixed(2)}
                            </div>
                            <div className="text-[11px] text-emerald-100/70 mt-1">
                                Dari {summary.total_years} tahun evaluasi
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                            <div className="flex items-center justify-between text-emerald-200">
                                <span className="text-[11px] font-bold uppercase tracking-wider">Rentang Skor</span>
                                <Award className="h-4 w-4" />
                            </div>
                            <div className="mt-2 text-xl sm:text-2xl font-black text-white">
                                {summary.highest_score.toFixed(1)}
                            </div>
                            <div className="text-[11px] text-emerald-100/70 mt-1">
                                Skor tertinggi tercatat
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content Container */}
            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
                {/* 1. Grafik IKP Disandingkan Dengan Target Renstra */}
                <section id="grafik-ikp" className="space-y-4">
                    <Card className="rounded-3xl border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none overflow-hidden">
                        <CardHeader className="p-5 sm:p-7 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#006565] dark:bg-emerald-950 dark:text-emerald-400">
                                            <BarChart2 className="h-5 w-5" />
                                        </div>
                                        <CardTitle className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                                            Grafik Perbandingan IKP vs Target RENSTRA
                                        </CardTitle>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                        Perkembangan tahunan capaian Indeks Ketahanan Pangan riil disandingkan dengan target Renstra Kabupaten Indramayu.
                                    </p>
                                </div>

                                {/* Controls: Chart View Switcher */}
                                <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setChartMode('composed')}
                                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                                            chartMode === 'composed'
                                                ? 'bg-white text-[#006565] shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                        }`}
                                    >
                                        <BarChart2 className="h-3.5 w-3.5" />
                                        <span>Batang + Garis</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setChartMode('side-by-side')}
                                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                                            chartMode === 'side-by-side'
                                                ? 'bg-white text-[#006565] shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                        }`}
                                    >
                                        <Scale className="h-3.5 w-3.5" />
                                        <span>Berdampingan</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setChartMode('line')}
                                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                                            chartMode === 'line'
                                                ? 'bg-white text-[#006565] shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                        }`}
                                    >
                                        <LineChartIcon className="h-3.5 w-3.5" />
                                        <span>Tren Garis</span>
                                    </button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-4 sm:p-7 space-y-6">
                            {/* Recharts Chart Component */}
                            <div className="h-80 sm:h-96 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartMode === 'composed' ? (
                                        <ComposedChart
                                            data={yearlyScores}
                                            margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                                        >
                                            <defs>
                                                <linearGradient id="ikpBarGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#006565" stopOpacity={0.95} />
                                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.7} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis
                                                dataKey="tahun"
                                                tickLine={false}
                                                axisLine={{ stroke: '#cbd5e1' }}
                                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }}
                                            />
                                            <YAxis
                                                domain={[60, 100]}
                                                tickLine={false}
                                                axisLine={{ stroke: '#cbd5e1' }}
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                                unit=""
                                            />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload as YearlyIkpItem;
                                                        return (
                                                            <div className="rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 space-y-2 text-xs">
                                                                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1.5 dark:border-slate-800">
                                                                    <span className="font-black text-slate-900 dark:text-white">
                                                                        Tahun {data.tahun}
                                                                    </span>
                                                                    <Badge className="bg-emerald-50 text-[10px] font-bold text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                                                                        {data.status}
                                                                    </Badge>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <div className="flex justify-between gap-4">
                                                                        <span className="text-slate-500">Nilai IKP:</span>
                                                                        <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                                                                            {data.nilai_ikp.toFixed(2)}
                                                                        </strong>
                                                                    </div>
                                                                    <div className="flex justify-between gap-4">
                                                                        <span className="text-slate-500">Target RENSTRA:</span>
                                                                        <strong className="font-mono text-amber-600 dark:text-amber-400">
                                                                            {data.target_renstra.toFixed(2)}
                                                                        </strong>
                                                                    </div>
                                                                    <div className="flex justify-between gap-4 pt-1 border-t border-slate-100 dark:border-slate-800">
                                                                        <span className="text-slate-500">Selisih:</span>
                                                                        <strong
                                                                            className={`font-mono ${
                                                                                data.diff_renstra >= 0
                                                                                    ? 'text-emerald-600'
                                                                                    : 'text-rose-600'
                                                                            }`}
                                                                        >
                                                                            {data.diff_renstra >= 0 ? '+' : ''}
                                                                            {data.diff_renstra.toFixed(2)} ({data.capaian_percentage.toFixed(1)}%)
                                                                        </strong>
                                                                    </div>
                                                                    {data.keterangan && (
                                                                        <p className="pt-1 text-[11px] text-slate-400 italic">
                                                                            {data.keterangan}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Legend
                                                verticalAlign="top"
                                                align="right"
                                                wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
                                            />
                                            <Bar
                                                dataKey="nilai_ikp"
                                                name="Nilai IKP"
                                                fill="url(#ikpBarGrad)"
                                                radius={[8, 8, 0, 0]}
                                                barSize={38}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="target_renstra"
                                                name="Target RENSTRA"
                                                stroke="#f59e0b"
                                                strokeWidth={3}
                                                strokeDasharray="4 4"
                                                dot={{ fill: '#d97706', r: 5, strokeWidth: 2, stroke: '#fff' }}
                                                activeDot={{ r: 7 }}
                                            />
                                        </ComposedChart>
                                    ) : chartMode === 'side-by-side' ? (
                                        <BarChart
                                            data={yearlyScores}
                                            margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis
                                                dataKey="tahun"
                                                tickLine={false}
                                                axisLine={{ stroke: '#cbd5e1' }}
                                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }}
                                            />
                                            <YAxis
                                                domain={[60, 100]}
                                                tickLine={false}
                                                axisLine={{ stroke: '#cbd5e1' }}
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload as YearlyIkpItem;
                                                        return (
                                                            <div className="rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 space-y-2 text-xs">
                                                                <span className="font-black text-slate-900 dark:text-white">
                                                                    Tahun {data.tahun}
                                                                </span>
                                                                <div className="space-y-1">
                                                                    <div className="flex justify-between gap-4">
                                                                        <span className="text-slate-500">Nilai IKP:</span>
                                                                        <strong className="font-mono text-emerald-700">
                                                                            {data.nilai_ikp.toFixed(2)}
                                                                        </strong>
                                                                    </div>
                                                                    <div className="flex justify-between gap-4">
                                                                        <span className="text-slate-500">Target RENSTRA:</span>
                                                                        <strong className="font-mono text-amber-600">
                                                                            {data.target_renstra.toFixed(2)}
                                                                        </strong>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }} />
                                            <Bar
                                                dataKey="nilai_ikp"
                                                name="Nilai IKP"
                                                fill="#006565"
                                                radius={[6, 6, 0, 0]}
                                                barSize={24}
                                            />
                                            <Bar
                                                dataKey="target_renstra"
                                                name="Target RENSTRA"
                                                fill="#f59e0b"
                                                radius={[6, 6, 0, 0]}
                                                barSize={24}
                                            />
                                        </BarChart>
                                    ) : (
                                        <AreaChart
                                            data={yearlyScores}
                                            margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                                        >
                                            <defs>
                                                <linearGradient id="areaIkp" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#006565" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#006565" stopOpacity={0.0} />
                                                </linearGradient>
                                                <linearGradient id="areaRenstra" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis
                                                dataKey="tahun"
                                                tickLine={false}
                                                axisLine={{ stroke: '#cbd5e1' }}
                                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }}
                                            />
                                            <YAxis domain={[60, 100]} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <Tooltip />
                                            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }} />
                                            <Area
                                                type="monotone"
                                                dataKey="nilai_ikp"
                                                name="Nilai IKP"
                                                stroke="#006565"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#areaIkp)"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="target_renstra"
                                                name="Target RENSTRA"
                                                stroke="#f59e0b"
                                                strokeWidth={2.5}
                                                strokeDasharray="4 4"
                                                fillOpacity={1}
                                                fill="url(#areaRenstra)"
                                            />
                                        </AreaChart>
                                    )}
                                </ResponsiveContainer>
                            </div>

                            {/* Chart Context Callout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 text-xs dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                                <div className="flex items-start gap-3">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-[#006565] dark:bg-emerald-950 dark:text-emerald-400 font-bold">
                                        ✓
                                    </span>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200">
                                            Konsistensi Melampaui Target Renstra
                                        </p>
                                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                                            Kabupaten Indramayu secara konsisten mempertahankan status Sangat Tahan Pangan dengan skor di atas target tahunan Renstra.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 font-bold">
                                        ★
                                    </span>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200">
                                            Rujukan Badan Pangan Nasional (Bapanas)
                                        </p>
                                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                                            Perhitungan komposit memadukan rasio normatif konsumsi, akses ekonomi, serta mutu kesehatan dan pemanfaatan gizi.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* 2. Tabel Data Historis IKP */}
                <section id="tabel-data" className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">
                                Tabel Capaian IKP dan Target Renstra
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Rincian data historis evaluasi IKP tahun ke tahun Pemerintah Kabupaten Indramayu
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="self-start sm:self-auto gap-2 rounded-xl text-xs font-bold"
                        >
                            <Printer className="h-4 w-4" />
                            <span>Cetak Laporan</span>
                        </Button>
                    </div>

                    <Card className="overflow-hidden rounded-3xl border-slate-200/90 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300">
                                    <tr>
                                        <th className="px-5 py-4 text-center">No</th>
                                        <th className="px-5 py-4">Tahun Evaluasi</th>
                                        <th className="px-5 py-4 text-right">Nilai IKP</th>
                                        <th className="px-5 py-4 text-right">Target RENSTRA</th>
                                        <th className="px-5 py-4 text-right">Deviasi (Poin)</th>
                                        <th className="px-5 py-4 text-center">Capaian (%)</th>
                                        <th className="px-5 py-4">Status Ketahanan</th>
                                        <th className="px-5 py-4">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {yearlyScores.map((row, idx) => {
                                        const badge = getCategoryBadge(row.status);
                                        return (
                                            <tr
                                                key={row.id}
                                                className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-850/50"
                                            >
                                                <td className="px-5 py-3.5 text-center text-slate-400 font-medium">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-5 py-3.5 font-extrabold text-slate-900 dark:text-white">
                                                    {row.tahun}
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-black text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                                                    {row.nilai_ikp.toFixed(2)}
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-300 font-mono text-sm">
                                                    {row.target_renstra.toFixed(2)}
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-bold font-mono">
                                                    <span
                                                        className={
                                                            row.diff_renstra >= 0
                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                : 'text-rose-600 dark:text-rose-400'
                                                        }
                                                    >
                                                        {row.diff_renstra >= 0 ? '+' : ''}
                                                        {row.diff_renstra.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <Badge
                                                        className={`font-mono text-[10px] font-bold ${
                                                            row.is_achieved
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                        }`}
                                                    >
                                                        {row.capaian_percentage.toFixed(1)}%
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <Badge
                                                        variant="outline"
                                                        className={`font-bold text-[11px] ${badge.badgeClass}`}
                                                    >
                                                        {badge.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate dark:text-slate-400">
                                                    {row.keterangan || '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </section>

                {/* 3. Edukasi: 3 Pilar Utama Indeks Ketahanan Pangan (Bapanas) */}
                <section className="space-y-6">
                    <div className="text-center max-w-2xl mx-auto space-y-2">
                        <Badge className="bg-emerald-100 text-[#006565] border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400">
                            Pedoman Indeks Ketahanan Pangan
                        </Badge>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                            3 Pilar Utama Penilaian IKP
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            IKP disusun berdasarkan metodologi Badan Pangan Nasional dengan menganalisis sembilan indikator komposit yang mencakup tiga subsistem pangan utama.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Pilar 1 */}
                        <Card className="rounded-3xl border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#006565] dark:bg-emerald-950 dark:text-emerald-400 mb-4">
                                <Wheat className="h-6 w-6" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                                1. Pilar Ketersediaan Pangan
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                Mengukur kemampuan daerah dalam memproduksi dan menyediakan pangan bagi seluruh penduduk secara berkelanjutan.
                            </p>
                            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <span>Rasio konsumsi normatif beras per kapita</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <span>Ketersediaan beras &amp; komoditas pokok</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <span>Cadangan pangan pemerintah daerah</span>
                                </li>
                            </ul>
                        </Card>

                        {/* Pilar 2 */}
                        <Card className="rounded-3xl border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 mb-4">
                                <Store className="h-6 w-6" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                                2. Pilar Keterjangkauan Pangan
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                Mengukur akses ekonomi dan fisik masyarakat untuk memperoleh pangan yang cukup dan bergizi setiap saat.
                            </p>
                            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                                    <span>Persentase penduduk di bawah garis kemiskinan</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                                    <span>Proporsi pengeluaran pangan terhadap total</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                                    <span>Konektivitas jalan dan akses sarana pasar</span>
                                </li>
                            </ul>
                        </Card>

                        {/* Pilar 3 */}
                        <Card className="rounded-3xl border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 mb-4">
                                <Utensils className="h-6 w-6" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                                3. Pilar Pemanfaatan Pangan
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                Mengukur kualitas penyerapan gizi pangan, sanitasi lingkungan, dan kesehatan masyarakat.
                            </p>
                            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    <span>Akses terhadap air bersih layak konsumsi</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    <span>Rasio fasilitas dan tenaga kesehatan</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    <span>Angka Harapan Hidup (AHH) masyarakat</span>
                                </li>
                            </ul>
                        </Card>
                    </div>
                </section>

                {/* 4. Skala Standar IKP Badan Pangan Nasional */}
                <section className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-emerald-50/30 p-6 sm:p-8 dark:border-slate-800 dark:from-slate-900 dark:to-emerald-950/20">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="space-y-2 max-w-lg">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                Klasifikasi Skor IKP Nasional
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Badan Pangan Nasional mengelompokkan ketahanan pangan ke dalam 6 kelompok status prioritas ketahanan pangan.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
                            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-center dark:bg-emerald-950/40 dark:border-emerald-800">
                                <div className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                                    Skor ≥ 80.00
                                </div>
                                <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                    Sangat Tahan Pangan
                                </div>
                            </div>
                            <div className="rounded-2xl border border-teal-300 bg-teal-50 p-3 text-center dark:bg-teal-950/40 dark:border-teal-800">
                                <div className="text-xs font-black text-teal-800 dark:text-teal-300">
                                    70.00 - 79.99
                                </div>
                                <div className="text-[11px] font-bold text-teal-700 dark:text-teal-400">
                                    Tahan Pangan
                                </div>
                            </div>
                            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-center dark:bg-amber-950/40 dark:border-amber-800">
                                <div className="text-xs font-black text-amber-800 dark:text-amber-300">
                                    60.00 - 69.99
                                </div>
                                <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                                    Agak Tahan Pangan
                                </div>
                            </div>
                            <div className="rounded-2xl border border-orange-300 bg-orange-50 p-3 text-center dark:bg-orange-950/40 dark:border-orange-800">
                                <div className="text-xs font-black text-orange-800 dark:text-orange-300">
                                    50.00 - 59.99
                                </div>
                                <div className="text-[11px] font-bold text-orange-700 dark:text-orange-400">
                                    Agak Rentan
                                </div>
                            </div>
                            <div className="rounded-2xl border border-rose-300 bg-rose-50 p-3 text-center dark:bg-rose-950/40 dark:border-rose-800">
                                <div className="text-xs font-black text-rose-800 dark:text-rose-300">
                                    40.00 - 49.99
                                </div>
                                <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
                                    Rentan Pangan
                                </div>
                            </div>
                            <div className="rounded-2xl border border-red-400 bg-red-100 p-3 text-center dark:bg-red-950/60 dark:border-red-900">
                                <div className="text-xs font-black text-red-900 dark:text-red-200">
                                    &lt; 40.00
                                </div>
                                <div className="text-[11px] font-bold text-red-800 dark:text-red-300">
                                    Sangat Rentan
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. Quick Links ke Modul Lain */}
                <section className="border-t border-slate-200 pt-8 dark:border-slate-800">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4 dark:text-slate-400">
                        Eksplorasi Modul Satu Data Pangan Lainnya
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link
                            href="/harga-konsumen"
                            className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-[#006565]/40 hover:bg-emerald-50/30 transition-all dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-[#006565] dark:bg-emerald-950 dark:text-emerald-400">
                                    <Store className="h-4 w-4" />
                                </span>
                                <div>
                                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#006565]">
                                        Harga Konsumen
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                        25 Komoditas Harian &amp; HET
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#006565] transition-colors" />
                        </Link>

                        <Link
                            href="/harga-produsen"
                            className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-amber-600/40 hover:bg-amber-50/30 transition-all dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400">
                                    <Wheat className="h-4 w-4" />
                                </span>
                                <div>
                                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-800">
                                        Harga Produsen
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                        Tingkat Petani &amp; HAP
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-amber-800 transition-colors" />
                        </Link>

                        <Link
                            href="/neraca-pangan"
                            className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-teal-600/40 hover:bg-teal-50/30 transition-all dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-400">
                                    <Layers className="h-4 w-4" />
                                </span>
                                <div>
                                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-800">
                                        Neraca Pangan
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                        11 Komoditas Bulanan
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-800 transition-colors" />
                        </Link>

                        <Link
                            href="/pph"
                            className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-[#006565]/40 hover:bg-emerald-50/30 transition-all dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-[#006565] dark:bg-emerald-950 dark:text-emerald-400">
                                    <PieChart className="h-4 w-4" />
                                </span>
                                <div>
                                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#006565]">
                                        Pola Pangan Harapan
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                        Skor Mutu Konsumsi PPH
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#006565] transition-colors" />
                        </Link>
                    </div>
                </section>
            </main>

            {/* Portal Footer */}
            <PortalFooter />
        </div>
    );
}

