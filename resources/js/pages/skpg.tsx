import { Head, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    Calendar,
    CheckCircle2,
    CloudRain,
    Compass,
    Download,
    Droplets,
    ExternalLink,
    Filter,
    HelpCircle,
    Info,
    Layers,
    MapPin,
    Search,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Sun,
    TrendingUp,
    Wheat,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import PortalFooter from '@/components/portal-footer';
import PortalNavbar from '@/components/portal-navbar';
import SkpgMap, { getStatusColor, type SkpgKecamatanItem } from '@/components/skpg-map';
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

export interface SkpgPageProps {
    kecamatanItems: SkpgKecamatanItem[];
    summary: {
        year: number;
        month: number;
        month_name: string;
        selected_indicator: string;
        indicator_label: string;
        total_kecamatan: number;
        count_aman: number;
        count_waspada: number;
        count_rentan: number;
        overall_status: string;
        indicator_counts: Record<string, { AMAN: number; WASPADA: number; RENTAN: number }>;
    };
    indicators: Record<string, string>;
    availableYears: number[];
    availableMonths: number[];
    filters: {
        year: number;
        month: number;
        indicator: string;
    };
}

const MONTH_NAMES = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

const INDICATOR_DETAILS: Record<
    string,
    { label: string; short: string; description: string; icon: React.ComponentType<{ className?: string }> }
> = {
    ikb: {
        label: 'Komposit (IKB)',
        short: 'IKB',
        description: 'Indeks Komposit Bulanan akumulasi seluruh pilar ketahanan pangan & iklim.',
        icon: Activity,
    },
    ik: {
        label: 'Ketersediaan (IK)',
        short: 'IK',
        description: 'Indikator ketersediaan pangan pokok lokal dan produksi pertanian di kecamatan.',
        icon: Wheat,
    },
    ia: {
        label: 'Keterjangkauan (IA)',
        short: 'IA',
        description: 'Akses fisik dan ekonomi masyarakat terhadap pangan serta kestabilan pasokan.',
        icon: Compass,
    },
    ip: {
        label: 'Pemanfaatan (IP)',
        short: 'IP',
        description: 'Pemanfaatan pangan, gizi keluarga, akses sanitasi, dan kesehatan pangan.',
        icon: ShieldCheck,
    },
    potensi_kering: {
        label: 'Potensi Kering',
        short: 'Kering',
        description: 'Peringatan dini ancaman defisit air, kekeringan lahan pertanian, & curah hujan rendah.',
        icon: Sun,
    },
    potensi_basah: {
        label: 'Potensi Basah',
        short: 'Basah',
        description: 'Peringatan dini curah hujan tinggi, banjir rob pesisir, & genangan areal sawah.',
        icon: CloudRain,
    },
    kondisi_iklim: {
        label: 'Kondisi Iklim',
        short: 'Iklim',
        description: 'Variabilitas iklim makro dan anomali cuaca BMKG yang memengaruhi ketahanan pangan.',
        icon: Droplets,
    },
};

export default function SkpgPublicPage({
    kecamatanItems,
    summary,
    indicators,
    availableYears,
    availableMonths,
    filters,
}: SkpgPageProps) {
    const [selectedIndicator, setSelectedIndicator] = useState<string>(filters.indicator || 'ikb');
    const [selectedYear, setSelectedYear] = useState<number>(summary.year);
    const [selectedMonth, setSelectedMonth] = useState<number>(summary.month);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedKecamatan, setSelectedKecamatan] = useState<string | null>(null);

    // Apply filter changes via Inertia visit
    const handlePeriodChange = (newYear: number, newMonth: number, newIndicator?: string) => {
        setSelectedYear(newYear);
        setSelectedMonth(newMonth);
        router.get(
            '/skpg',
            {
                year: newYear,
                month: newMonth,
                indicator: newIndicator || selectedIndicator,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleIndicatorChange = (indKey: string) => {
        setSelectedIndicator(indKey);
        router.get(
            '/skpg',
            {
                year: selectedYear,
                month: selectedMonth,
                indicator: indKey,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Filter subdistrict items by search query
    const searchFilteredItems = useMemo(() => {
        if (!searchQuery.trim()) return kecamatanItems;
        const q = searchQuery.toLowerCase().trim();
        return kecamatanItems.filter((item) => {
            const matchName = item.kecamatan.toLowerCase().includes(q);
            const matchCode = item.kode_kecamatan.toLowerCase().includes(q);
            const matchKet = (item.keterangan || '').toLowerCase().includes(q);
            return matchName || matchCode || matchKet;
        });
    }, [kecamatanItems, searchQuery]);

    // Split into 3 status buckets based on the currently active indicator:
    const amanItems = useMemo(() => {
        return searchFilteredItems.filter((item) => {
            const currentStatus =
                (item[selectedIndicator as keyof SkpgKecamatanItem] as string) || item.ikb || 'AMAN';
            return currentStatus === 'AMAN';
        });
    }, [searchFilteredItems, selectedIndicator]);

    const waspadaItems = useMemo(() => {
        return searchFilteredItems.filter((item) => {
            const currentStatus =
                (item[selectedIndicator as keyof SkpgKecamatanItem] as string) || item.ikb || 'AMAN';
            return currentStatus === 'WASPADA';
        });
    }, [searchFilteredItems, selectedIndicator]);

    const rentanItems = useMemo(() => {
        return searchFilteredItems.filter((item) => {
            const currentStatus =
                (item[selectedIndicator as keyof SkpgKecamatanItem] as string) || item.ikb || 'AMAN';
            return currentStatus === 'RENTAN';
        });
    }, [searchFilteredItems, selectedIndicator]);

    const handleFocusKecamatan = (name: string) => {
        if (selectedKecamatan?.toUpperCase() === name.toUpperCase()) {
            setSelectedKecamatan(null);
        } else {
            setSelectedKecamatan(name);
            const mapEl = document.getElementById('peta-sebaran-skpg');
            if (mapEl) {
                mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    // Active indicator metadata
    const activeIndMeta = INDICATOR_DETAILS[selectedIndicator] || INDICATOR_DETAILS.ikb;
    const ActiveIndIcon = activeIndMeta.icon;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-emerald-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
            <Head title="SKPG - Sistem Peringatan Dini Kerawanan Pangan dan Gizi Indramayu" />

            {/* Public Navigation */}
            <PortalNavbar activePage="skpg" />

            {/* MODERN HERO BANNER */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#003838] via-[#004e4e] to-[#006565] text-white pt-10 pb-16 lg:pt-14 lg:pb-20 shadow-xl">
                {/* Decorative background effects & gradients */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(16,185,129,0.22),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(20,184,166,0.18),transparent_50%)] pointer-events-none" />
                <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                        {/* Hero Text Column */}
                        <div className="lg:col-span-7">
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-bold tracking-wide text-emerald-200 backdrop-blur-md">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                                <span className="font-black uppercase tracking-wider">SKPG INDRAMAYU</span>
                                <span className="text-emerald-400/60">•</span>
                                <span>31 Kecamatan Terpantau</span>
                            </div>

                            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                                Sistem Peringatan Dini Kerawanan Pangan &amp; Gizi
                            </h1>

                            <p className="mt-4 text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl">
                                Platform pemantauan spasial bulanan DKPP Kabupaten Indramayu untuk mendeteksi
                                risiko kerawanan pangan, aksesibilitas, gizi, serta ancaman iklim (kekeringan &amp; banjir)
                                secara dini dan presisi di seluruh kecamatan.
                            </p>

                            {/* Active Period & Indicator Chips */}
                            <div className="mt-6 flex flex-wrap items-center gap-2.5">
                                <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-1.5 backdrop-blur-md border border-white/15 text-xs font-bold text-white">
                                    <Calendar className="h-4 w-4 text-emerald-300" />
                                    <span>
                                        Periode: {summary.month_name} {summary.year}
                                    </span>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-1.5 backdrop-blur-md border border-white/15 text-xs font-bold text-white">
                                    <ActiveIndIcon className="h-4 w-4 text-teal-300" />
                                    <span>Indikator: {activeIndMeta.label}</span>
                                </div>
                                <a
                                    href="/api/skpg/geojson"
                                    download="indramayu_kecamatan.geojson"
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 px-3 py-1.5 backdrop-blur-md border border-emerald-400/30 text-xs font-bold text-emerald-200 transition-colors"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    <span>Unduh GeoJSON</span>
                                </a>
                            </div>
                        </div>

                        {/* Hero KPI Summary Card */}
                        <div className="lg:col-span-5">
                            <div className="rounded-3xl border border-white/20 bg-white/10 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
                                <div className="flex items-center justify-between border-b border-white/15 pb-4">
                                    <div>
                                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200">
                                            Status Umum Kabupaten
                                        </span>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black tracking-wider uppercase ${
                                                    summary.overall_status === 'RENTAN'
                                                        ? 'bg-rose-500 text-white'
                                                        : summary.overall_status === 'WASPADA'
                                                          ? 'bg-amber-500 text-white'
                                                          : 'bg-emerald-500 text-white'
                                                }`}
                                            >
                                                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                                                Kondisi {summary.overall_status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-white">{summary.total_kecamatan}</span>
                                        <span className="block text-[10px] font-bold text-emerald-200 uppercase">
                                            Kecamatan
                                        </span>
                                    </div>
                                </div>

                                {/* 3 Status Breakdown Metric Bars */}
                                <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
                                    <div className="rounded-2xl bg-emerald-500/20 border border-emerald-400/30 p-2.5">
                                        <span className="block text-2xl font-black text-emerald-300">
                                            {summary.count_aman}
                                        </span>
                                        <span className="text-[10px] font-extrabold text-emerald-100 uppercase">
                                            AMAN (Hijau)
                                        </span>
                                    </div>
                                    <div className="rounded-2xl bg-amber-500/20 border border-amber-400/30 p-2.5">
                                        <span className="block text-2xl font-black text-amber-300">
                                            {summary.count_waspada}
                                        </span>
                                        <span className="text-[10px] font-extrabold text-amber-100 uppercase">
                                            WASPADA (Kuning)
                                        </span>
                                    </div>
                                    <div className="rounded-2xl bg-rose-500/20 border border-rose-400/30 p-2.5">
                                        <span className="block text-2xl font-black text-rose-300">
                                            {summary.count_rentan}
                                        </span>
                                        <span className="text-[10px] font-extrabold text-rose-100 uppercase">
                                            RENTAN (Merah)
                                        </span>
                                    </div>
                                </div>

                                <p className="mt-4 text-center text-xs text-emerald-100/80">
                                    Berdasarkan klasifikasi peringatan dini Badan Pangan Nasional (Bapanas).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* MAIN CONTENT SECTION */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
                {/* Filter Indicator & Period Controls Bar */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        {/* Left: Indicator Title */}
                        <div>
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-[#006565] dark:text-emerald-400" />
                                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Pilih Indikator SKPG:
                                </span>
                            </div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white sm:text-xl">
                                {activeIndMeta.label}
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                                {activeIndMeta.description}
                            </p>
                        </div>

                        {/* Right: Period Dropdowns (Month & Year) */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            <div className="w-36">
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                                    Bulan
                                </label>
                                <Select
                                    value={String(selectedMonth)}
                                    onValueChange={(val) => handlePeriodChange(selectedYear, Number(val))}
                                >
                                    <SelectTrigger className="h-9 rounded-xl font-bold text-xs">
                                        <SelectValue placeholder="Pilih Bulan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableMonths.map((m) => (
                                            <SelectItem key={m} value={String(m)} className="text-xs font-semibold">
                                                {MONTH_NAMES[m - 1] ?? `Bulan ${m}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-28">
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                                    Tahun
                                </label>
                                <Select
                                    value={String(selectedYear)}
                                    onValueChange={(val) => handlePeriodChange(Number(val), selectedMonth)}
                                >
                                    <SelectTrigger className="h-9 rounded-xl font-bold text-xs">
                                        <SelectValue placeholder="Pilih Tahun" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableYears.map((y) => (
                                            <SelectItem key={y} value={String(y)} className="text-xs font-semibold">
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Filter Indicator Toggle Pills (7 Indicators) */}
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        {Object.entries(indicators).map(([key, label]) => {
                            const isSelected = selectedIndicator === key;
                            const IconComp = INDICATOR_DETAILS[key]?.icon || Activity;
                            const counts = summary.indicator_counts[key] || { AMAN: 0, WASPADA: 0, RENTAN: 0 };

                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleIndicatorChange(key)}
                                    className={`group flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-black transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-gradient-to-r from-[#006565] to-teal-700 text-white shadow-md shadow-[#006565]/20 ring-2 ring-[#006565]/30'
                                            : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/90 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <IconComp className={`h-4 w-4 ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`} />
                                    <span>{label}</span>
                                    <span
                                        className={`ml-1 flex items-center gap-1 text-[10px] font-black rounded-full px-1.5 py-0.5 ${
                                            isSelected
                                                ? 'bg-white/20 text-white'
                                                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        {counts.RENTAN > 0 ? (
                                            <span className="text-rose-400 font-black">! {counts.RENTAN}</span>
                                        ) : (
                                            <span>✓ {counts.AMAN}</span>
                                        )}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* INTERACTIVE GEOSPATIAL MAP */}
                <section id="peta-sebaran-skpg">
                    <SkpgMap
                        items={kecamatanItems}
                        selectedIndicator={selectedIndicator}
                        indicatorLabel={activeIndMeta.label}
                        selectedKecamatan={selectedKecamatan}
                        onSelectKecamatan={setSelectedKecamatan}
                    />
                </section>

                {/* CARD STATUS DENGAN LIST DAFTAR KECAMATAN (3 CARDS: AMAN, WASPADA, RENTAN) */}
                <section className="space-y-6">
                    {/* Header Bar & Global Search */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-[#006565] dark:text-emerald-400" />
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                    Daftar Status Kecamatan: {activeIndMeta.label}
                                </h3>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Dikelompokkan ke dalam 3 kartu status (Aman, Waspada, Rentan) untuk 31 kecamatan di Kabupaten Indramayu.
                            </p>
                        </div>

                        {/* Search box across all 3 cards */}
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Cari nama kecamatan / kode BPS..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 pl-9 pr-8 rounded-xl text-xs bg-white dark:bg-slate-900 shadow-xs"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 3 Status Cards Grid */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
                        {/* CARD 1: KECAMATAN AMAN */}
                        <div className="flex flex-col rounded-3xl border border-emerald-200/90 bg-emerald-50/40 p-5 shadow-sm backdrop-blur-sm dark:border-emerald-800/60 dark:bg-emerald-950/20">
                            {/* Card 1 Header */}
                            <div className="flex items-center justify-between border-b border-emerald-200/80 pb-4 dark:border-emerald-800/60">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-black tracking-tight text-emerald-950 dark:text-emerald-100">
                                            Kecamatan AMAN
                                        </h4>
                                        <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300/90">
                                            Kondisi Pangan Stabil &amp; Aman
                                        </p>
                                    </div>
                                </div>
                                <Badge className="rounded-xl border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800 shadow-xs dark:border-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                    {amanItems.length} Kecamatan
                                </Badge>
                            </div>

                            {/* Card 1 Subdistrict List */}
                            <div className="mt-4 max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
                                {amanItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-white/70 p-8 text-center dark:border-emerald-900 dark:bg-slate-900/60">
                                        <Info className="h-7 w-7 text-emerald-400" />
                                        <p className="mt-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                            Tidak ada kecamatan aman
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-slate-500">
                                            {searchQuery
                                                ? 'Tidak ada hasil untuk pencarian ini.'
                                                : 'Seluruh kecamatan berada di kategori status lain.'}
                                        </p>
                                    </div>
                                ) : (
                                    amanItems.map((item) => {
                                        const isSelected = selectedKecamatan?.toUpperCase() === item.kecamatan.toUpperCase();
                                        return (
                                            <div
                                                key={item.kecamatan}
                                                onClick={() => handleFocusKecamatan(item.kecamatan)}
                                                className={`group rounded-2xl border p-3.5 transition-all duration-200 cursor-pointer ${
                                                    isSelected
                                                        ? 'border-[#006565] bg-white shadow-lg ring-2 ring-[#006565] dark:border-emerald-500 dark:bg-slate-900'
                                                        : 'border-white/90 bg-white/95 shadow-xs hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                                                                BPS: {item.kode_kecamatan}
                                                            </span>
                                                            {isSelected && (
                                                                <Badge className="bg-[#006565] text-white text-[9px] px-1.5 py-0 font-bold dark:bg-emerald-600">
                                                                    Aktif di Peta
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <h5 className="mt-0.5 text-sm font-black text-slate-900 group-hover:text-[#006565] transition-colors dark:text-white dark:group-hover:text-emerald-400">
                                                            {item.kecamatan}
                                                        </h5>
                                                    </div>

                                                    <Badge className="rounded-xl border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                                                        AMAN
                                                    </Badge>
                                                </div>

                                                {/* Sub-Indicators matrix */}
                                                <div className="mt-2.5 grid grid-cols-4 gap-1 rounded-xl bg-slate-50 p-2 border border-slate-100 text-[10px] dark:bg-slate-800/60 dark:border-slate-800">
                                                    <div className="text-center">
                                                        <span className="block text-[8px] font-bold text-slate-400">IKB</span>
                                                        <span className={`font-black ${getStatusColor(item.ikb).textClass}`}>
                                                            {item.ikb}
                                                        </span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="block text-[8px] font-bold text-slate-400">IK</span>
                                                        <span className={`font-black ${getStatusColor(item.ik).textClass}`}>
                                                            {item.ik}
                                                        </span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="block text-[8px] font-bold text-slate-400">IA</span>
                                                        <span className={`font-black ${getStatusColor(item.ia).textClass}`}>
                                                            {item.ia}
                                                        </span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="block text-[8px] font-bold text-slate-400">IP</span>
                                                        <span className={`font-black ${getStatusColor(item.ip).textClass}`}>
                                                            {item.ip}
                                                        </span>
                                                    </div>
                                                    <div className="text-center pt-1 border-t border-slate-200/60 dark:border-slate-700">
                                                        <span className="block text-[8px] font-bold text-slate-400">Kering</span>
                                                        <span className={`font-black ${getStatusColor(item.potensi_kering).textClass}`}>
                                                            {item.potensi_kering}
                                                        </span>
                                                    </div>
                                                    <div className="text-center pt-1 border-t border-slate-200/60 dark:border-slate-700">
                                                        <span className="block text-[8px] font-bold text-slate-400">Basah</span>
                                                        <span className={`font-black ${getStatusColor(item.potensi_basah).textClass}`}>
                                                            {item.potensi_basah}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-2 text-center pt-1 border-t border-slate-200/60 dark:border-slate-700">
                                                        <span className="block text-[8px] font-bold text-slate-400">Iklim</span>
                                                        <span className={`font-black ${getStatusColor(item.kondisi_iklim).textClass}`}>
                                                            {item.kondisi_iklim}
                                                        </span>
                                                    </div>
                                                </div>

                                                {item.keterangan && (
                                                    <p className="mt-2 text-[10px] text-slate-500 italic line-clamp-1 dark:text-slate-400">
                                                        "{item.keterangan}"
                                                    </p>
                                                )}

                                                <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-bold text-slate-500 dark:border-slate-800">
                                                    <span className="text-[10px] text-slate-400">
                                                        {summary.month_name} {summary.year}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 text-[#006565] group-hover:underline dark:text-emerald-400">
                                                        <span>{isSelected ? 'Batal Sorot' : 'Sorot di Peta'}</span>
                                                        <MapPin className="h-3 w-3" />
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* CARD 2: KECAMATAN WASPADA */}
                        <div className="flex flex-col rounded-3xl border border-amber-200/90 bg-amber-50/40 p-5 shadow-sm backdrop-blur-sm dark:border-amber-800/60 dark:bg-amber-950/20">
                            {/* Card 2 Header */}
                            <div className="flex items-center justify-between border-b border-amber-200/80 pb-4 dark:border-amber-800/60">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                                        <ShieldAlert className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-black tracking-tight text-amber-950 dark:text-amber-100">
                                            KECAMATAN WASPADA
                                        </h4>
                                        <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300/90">
                                            Perlu Pemantauan Berkala
                                        </p>
                                    </div>
                                </div>
                                <Badge className="rounded-xl border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800 shadow-xs dark:border-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                                    {waspadaItems.length} Kecamatan
                                </Badge>
                            </div>

                            {/* Card 2 Subdistrict List */}
                            <div className="mt-4 max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
                                {waspadaItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-white/70 p-8 text-center dark:border-amber-900 dark:bg-slate-900/60">
                                        <CheckCircle2 className="h-7 w-7 text-amber-500" />
                                        <p className="mt-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                                            Tidak ada kecamatan waspada
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-slate-500">
                                            {searchQuery
                                                ? 'Tidak ada hasil untuk pencarian ini.'
                                                : 'Seluruh kecamatan dalam kondisi aman atau berada di kategori lain.'}
                                        </p>
                                    </div>
                                ) : (
                                    waspadaItems.map((item) => {
                                        const isSelected = selectedKecamatan?.toUpperCase() === item.kecamatan.toUpperCase();
                                        return (
                                            <div
                                                key={item.kecamatan}
                                                onClick={() => handleFocusKecamatan(item.kecamatan)}
                                                className={`group rounded-2xl border p-3.5 transition-all duration-200 cursor-pointer ${
                                                    isSelected
                                                        ? 'border-amber-500 bg-white shadow-lg ring-2 ring-amber-500 dark:border-amber-500 dark:bg-slate-900'
                                                        : 'border-white/90 bg-white/95 shadow-xs hover:border-amber-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                                                                BPS: {item.kode_kecamatan}
                                                            </span>
                                                            {isSelected && (
                                                                <Badge className="bg-amber-600 text-white text-[9px] px-1.5 py-0 font-bold">
                                                                    Aktif di Peta
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <h5 className="mt-0.5 text-sm font-black text-slate-900 group-hover:text-amber-600 transition-colors dark:text-white dark:group-hover:text-amber-400">
                                                            {item.kecamatan}
                                                        </h5>
                                                    </div>

                                                    <Badge className="rounded-xl border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[10px] font-black text-amber-800 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                                                        WASPADA
                                                    </Badge>
                                                </div>

                                                {/* Sub-Indicators matrix */}
                                                <div className="mt-2.5 grid grid-cols-4 gap-1 rounded-xl bg-slate-50 p-2 border border-slate-100 text-[10px] dark:bg-slate-800/60 dark:border-slate-800">
                                                    <div className="text-center">
                                                        <span className="block text-[8px] font-bold text-slate-400">IKB</span>
                                                        <span className={`font-black ${getStatusColor(item.ikb).textClass}`}>
                                                            {item.ikb}
                                                        </span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="block text-[8px] font-bold text-slate-400">IK</span>
                                                        <span className={`font-black ${getStatusColor(item.ik).textClass}`}>
                                                            {item.ik}
                                                        </span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="block text-[8px] font-bold text-slate-400">IA</span>
                                                        <span className={`font-black ${getStatusColor(item.ia).textClass}`}>
                                                            {item.ia}
                                                        </span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="block text-[8px] font-bold text-slate-400">IP</span>
                                                        <span className={`font-black ${getStatusColor(item.ip).textClass}`}>
                                                            {item.ip}
                                                        </span>
                                                    </div>
                                                    <div className="text-center pt-1 border-t border-slate-200/60 dark:border-slate-700">
                                                        <span className="block text-[8px] font-bold text-slate-400">Kering</span>
                                                        <span className={`font-black ${getStatusColor(item.potensi_kering).textClass}`}>
                                                            {item.potensi_kering}
                                                        </span>
                                                    </div>
                                                    <div className="text-center pt-1 border-t border-slate-200/60 dark:border-slate-700">
                                                        <span className="block text-[8px] font-bold text-slate-400">Basah</span>
                                                        <span className={`font-black ${getStatusColor(item.potensi_basah).textClass}`}>
                                                            {item.potensi_basah}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-2 text-center pt-1 border-t border-slate-200/60 dark:border-slate-700">
                                                        <span className="block text-[8px] font-bold text-slate-400">Iklim</span>
                                                        <span className={`font-black ${getStatusColor(item.kondisi_iklim).textClass}`}>
                                                            {item.kondisi_iklim}
                                                        </span>
                                                    </div>
                                                </div>

                                                {item.keterangan && (
                                                    <p className="mt-2 text-[10px] text-slate-500 italic line-clamp-1 dark:text-slate-400">
                                                        "{item.keterangan}"
                                                    </p>
                                                )}

                                                <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-bold text-slate-500 dark:border-slate-800">
                                                    <span className="text-[10px] text-slate-400">
                                                        {summary.month_name} {summary.year}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 text-amber-600 group-hover:underline dark:text-amber-400">
                                                        <span>{isSelected ? 'Batal Sorot' : 'Sorot di Peta'}</span>
                                                        <MapPin className="h-3 w-3" />
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* CARD 3: KECAMATAN RENTAN */}
                        <div className="flex flex-col rounded-3xl border border-rose-200/90 bg-rose-50/40 p-5 shadow-sm backdrop-blur-sm dark:border-rose-800/60 dark:bg-rose-950/20">
                            {/* Card 3 Header */}
                            <div className="flex items-center justify-between border-b border-rose-200/80 pb-4 dark:border-rose-800/60">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-md shadow-rose-500/20">
                                        <AlertTriangle className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-black tracking-tight text-rose-950 dark:text-rose-100">
                                            KECAMATAN RENTAN
                                        </h4>
                                        <p className="text-[11px] font-medium text-rose-700 dark:text-rose-300/90">
                                            Prioritas Tindakan &amp; Intervensi
                                        </p>
                                    </div>
                                </div>
                                <Badge className="rounded-xl border border-rose-300 bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-800 shadow-xs dark:border-rose-800 dark:bg-rose-900/60 dark:text-rose-200">
                                    {rentanItems.length} Kecamatan
                                </Badge>
                            </div>

                            {/* Card 3 Subdistrict List */}
                            <div className="mt-4 max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
                                {rentanItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-rose-200 bg-white/70 p-8 text-center dark:border-rose-900 dark:bg-slate-900/60">
                                        <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                                        <p className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                                            Nol Kecamatan Rentan
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-slate-500">
                                            {searchQuery
                                                ? 'Tidak ada hasil untuk pencarian ini.'
                                                : 'Alhamdulillah pada indikator ini tidak ada kecamatan berstatus rentan.'}
                                        </p>
                                    </div>
                                ) : (
                                    rentanItems.map((item) => {
                                        const isSelected = selectedKecamatan?.toUpperCase() === item.kecamatan.toUpperCase();
                                        return (
                                            <div
                                                key={item.kecamatan}
                                                onClick={() => handleFocusKecamatan(item.kecamatan)}
                                                className={`group rounded-2xl border p-3.5 transition-all duration-200 cursor-pointer ${
                                                    isSelected
                                                        ? 'border-rose-500 bg-white shadow-lg ring-2 ring-rose-500 dark:border-rose-500 dark:bg-slate-900'
                                                        : 'border-white/90 bg-white/95 shadow-xs hover:border-rose-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                                                                BPS: {item.kode_kecamatan}
                                                            </span>
                                                            {isSelected && (
                                                                <Badge className="bg-rose-600 text-white text-[9px] px-1.5 py-0 font-bold">
                                                                    Aktif di Peta
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <h5 className="mt-0.5 text-sm font-black text-slate-900 group-hover:text-rose-600 transition-colors dark:text-white dark:group-hover:text-rose-400">
                                                            {item.kecamatan}
                                                        </h5>
                                                    </div>

                                                    <Badge className="rounded-xl border border-rose-300 bg-rose-100 px-2.5 py-0.5 text-[10px] font-black text-rose-800 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
                                                        RENTAN
                                                    </Badge>
                                                </div>

                                                {/* Sub-Indicators matrix */}
                                                <div className="mt-2.5 grid grid-cols-4 gap-1 rounded-xl bg-slate-50 p-2 border border-slate-100 text-[10px] dark:bg-slate-800/60 dark:border-slate-800">
                                                    <div className="text-center">
                                                        <span className="block text-[8px] font-bold text-slate-400">IKB</span>
                                                        <span className={`font-black ${getStatusColor(item.ikb).textClass}`}>
                                                            {item.ikb}
                                                        </span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="block text-[8px] font-bold text-slate-400">IK</span>
                                                        <span className={`font-black ${getStatusColor(item.ik).textClass}`}>
                                                            {item.ik}
                                                        </span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="block text-[8px] font-bold text-slate-400">IA</span>
                                                        <span className={`font-black ${getStatusColor(item.ia).textClass}`}>
                                                            {item.ia}
                                                        </span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="block text-[8px] font-bold text-slate-400">IP</span>
                                                        <span className={`font-black ${getStatusColor(item.ip).textClass}`}>
                                                            {item.ip}
                                                        </span>
                                                    </div>
                                                    <div className="text-center pt-1 border-t border-slate-200/60 dark:border-slate-700">
                                                        <span className="block text-[8px] font-bold text-slate-400">Kering</span>
                                                        <span className={`font-black ${getStatusColor(item.potensi_kering).textClass}`}>
                                                            {item.potensi_kering}
                                                        </span>
                                                    </div>
                                                    <div className="text-center pt-1 border-t border-slate-200/60 dark:border-slate-700">
                                                        <span className="block text-[8px] font-bold text-slate-400">Basah</span>
                                                        <span className={`font-black ${getStatusColor(item.potensi_basah).textClass}`}>
                                                            {item.potensi_basah}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-2 text-center pt-1 border-t border-slate-200/60 dark:border-slate-700">
                                                        <span className="block text-[8px] font-bold text-slate-400">Iklim</span>
                                                        <span className={`font-black ${getStatusColor(item.kondisi_iklim).textClass}`}>
                                                            {item.kondisi_iklim}
                                                        </span>
                                                    </div>
                                                </div>

                                                {item.keterangan && (
                                                    <p className="mt-2 text-[10px] text-slate-500 italic line-clamp-1 dark:text-slate-400">
                                                        "{item.keterangan}"
                                                    </p>
                                                )}

                                                <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-bold text-slate-500 dark:border-slate-800">
                                                    <span className="text-[10px] text-slate-400">
                                                        {summary.month_name} {summary.year}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 text-rose-600 group-hover:underline dark:text-rose-400">
                                                        <span>{isSelected ? 'Batal Sorot' : 'Sorot di Peta'}</span>
                                                        <MapPin className="h-3 w-3" />
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Educational Alert: What is SKPG */}
                <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-slate-50 p-6 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-900">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#006565] text-white shadow-md">
                            <Info className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-base font-black text-slate-900 dark:text-white">
                                Mengenai Sistem Peringatan Dini Kerawanan Pangan dan Gizi (SKPG)
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                SKPG merupakan instrumen strategis yang dilaksanakan oleh Dinas Ketahanan Pangan dan
                                Pertanian (DKPP) Kabupaten Indramayu setiap bulan untuk memantau situasi kerawanan pangan
                                secara berkala. Berdasarkan pedoman teknis Badan Pangan Nasional (Bapanas), SKPG mengintegrasikan
                                aspek ketersediaan pangan (IK), aksesibilitas (IA), pemanfaatan (IP), serta indikator iklim
                                ekstrem guna memberikan rekomendasi tindakan mitigasi cepat kepada pemangku kebijakan.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Portal Footer */}
            <PortalFooter />
        </div>
    );
}

