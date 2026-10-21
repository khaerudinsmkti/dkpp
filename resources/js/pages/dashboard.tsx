import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    CheckCircle2,
    ChevronRight,
    Compass,
    ExternalLink,
    Layers,
    MapPin,
    Package,
    PieChart,
    Scale,
    ShieldCheck,
    Store,
    TrendingDown,
    TrendingUp,
    Wheat,
} from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { dashboard } from '@/routes';

export interface IkpData {
    tahun: number;
    nilai_ikp: number;
    target_renstra: number;
    diff_renstra: number;
    capaian_percentage: number;
    is_achieved: boolean;
    status: string;
    indeks_ketersediaan: number | null;
    indeks_keterjangkauan: number | null;
    indeks_pemanfaatan: number | null;
    kelompok_ikp: string | null;
    keterangan: string | null;
}

export interface CppdData {
    tahun: number;
    total_stok: number;
    total_penyaluran: number;
    stok_awal: number;
    total_pengadaan: number;
    total_addendum: number;
}

export interface FoodBalanceData {
    year: number;
    month: number;
    month_name: string;
    period_label: string;
    is_current_month: boolean;
    total_ketersediaan: number;
    total_kebutuhan: number;
    total_produksi: number;
    total_neraca: number;
    status: 'Surplus' | 'Defisit';
    surplus_count: number;
    defisit_count: number;
    commodities_count: number;
}

export interface PphData {
    tahun: number;
    skor_pph: number;
    target_renstra: number;
    diff_renstra: number;
    capaian_percentage: number;
    is_achieved: boolean;
    keterangan: string | null;
}

export interface FsvaData {
    tahun: number;
    total_desa: number;
    rentan_count: number;
    rentan_percentage: number;
    tahan_count: number;
    tahan_percentage: number;
    p1_count: number;
    p2_count: number;
    p3_count: number;
    p4_count: number;
    p5_count: number;
    p6_count: number;
}

export interface ConsumerAboveHetItem {
    id: number;
    name: string;
    unit: string;
    price: number;
    het_price: number;
    diff: number;
    diff_percentage: number;
    image_url: string | null;
}

export interface ConsumerPricesData {
    market_name: string;
    effective_date: string;
    effective_date_formatted: string;
    is_today: boolean;
    total_monitored: number;
    above_het_count: number;
    normal_het_count: number;
    commodities: ConsumerAboveHetItem[];
}

export interface ProducerBelowHapItem {
    id: number;
    key: string;
    name: string;
    unit: string;
    price: number;
    hap_price: number;
    diff: number;
    diff_percentage: number;
    image_url: string | null;
}

export interface ProducerPricesData {
    effective_date: string;
    effective_date_formatted: string;
    is_today: boolean;
    total_monitored: number;
    below_hap_count: number;
    normal_hap_count: number;
    commodities: ProducerBelowHapItem[];
}

export interface SkpgAlertKecamatan {
    id: number;
    kecamatan: string;
    kode_kecamatan: string;
    ikb: string;
    ik: string;
    ia: string;
    ip: string;
    keterangan: string | null;
}

export interface SkpgData {
    year: number;
    month: number;
    month_name: string;
    period_label: string;
    is_current_month: boolean;
    total_kecamatan: number;
    alert_count: number;
    waspada_count: number;
    rentan_count: number;
    aman_count: number;
    alert_kecamatan: SkpgAlertKecamatan[];
    last_alert_record: {
        year: number;
        month: number;
        month_name: string;
        count: number;
    } | null;
}

interface DashboardProps {
    ikp: IkpData | null;
    cppd: CppdData;
    foodBalance: FoodBalanceData;
    pph: PphData | null;
    fsva: FsvaData;
    consumerPrices: ConsumerPricesData;
    producerPrices: ProducerPricesData;
    skpg: SkpgData;
}

function formatNumber(value: number, decimals = 2): string {
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    }).format(value);
}

function formatRupiah(value: number): string {
    return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;
}

export default function Dashboard({
    ikp,
    cppd,
    foodBalance,
    pph,
    fsva,
    consumerPrices,
    producerPrices,
    skpg,
}: DashboardProps) {
    // Dialog modals for viewing all items
    const [consumerModalOpen, setConsumerModalOpen] = useState(false);
    const [producerModalOpen, setProducerModalOpen] = useState(false);
    const [skpgModalOpen, setSkpgModalOpen] = useState(false);

    return (
        <>
            <Head title="Dashboard Ketahanan Pangan" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
                {/* Header Welcome Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 p-6 text-white shadow-lg md:p-8">
                    <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div className="space-y-1.5">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-emerald-100 backdrop-blur-md">
                                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                                Sistem Informasi Ketahanan Pangan Daerah
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                                Dashboard Eksekutif Ketahanan Pangan
                            </h1>
                            <p className="text-sm text-emerald-100/90 max-w-2xl">
                                Ringkasan pemantauan terpadu ketersediaan, keterjangkauan, pemanfaatan, stok cadangan, serta stabilitas harga pangan Kabupaten Indramayu.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link href="/ikp" target="_blank">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm cursor-pointer"
                                >
                                    <ExternalLink className="mr-1.5 size-4" />
                                    Portal Publik
                                </Button>
                            </Link>
                            <Link href="/tv" target="_blank">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm cursor-pointer"
                                >
                                    <Store className="mr-1.5 size-4" />
                                    Display TV Lobby
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Subtle decorative background circles */}
                    <div className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-emerald-400/10 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-16 right-48 size-48 rounded-full bg-teal-300/10 blur-xl" />
                </div>

                {/* 8 Primary Cards Grid */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {/* ======================================================== */}
                    {/* CARD 1: Nilai IKP tahun ini dan target renstra */}
                    {/* ======================================================== */}
                    <Card className="flex flex-col justify-between border-border/70 shadow-sm transition-all hover:shadow-md overflow-hidden">
                        <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-3">
                            <div className="flex items-start justify-between gap-2">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                                    <ShieldCheck className="size-5" />
                                </span>
                                <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-[calc(100%-2.75rem)]">
                                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 font-medium shrink-0">
                                        Tahun {ikp?.tahun ?? new Date().getFullYear()}
                                    </Badge>
                                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] px-2 py-0.5 shrink-0">
                                        {ikp?.status ?? 'Sangat Tahan'}
                                    </Badge>
                                </div>
                            </div>
                            <CardTitle className="pt-2 text-base font-semibold leading-snug">
                                Indeks Ketahanan Pangan (IKP)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Skor komposit ketahanan pangan daerah
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 px-4 sm:px-5 pb-3">
                            <div className="flex items-baseline justify-between">
                                <div>
                                    <div className="text-3xl font-extrabold tracking-tight text-foreground">
                                        {ikp ? ikp.nilai_ikp.toFixed(2) : '-'}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Target Renstra: <span className="font-semibold text-foreground">{ikp ? ikp.target_renstra.toFixed(2) : '-'}</span>
                                    </p>
                                </div>
                                {ikp && (
                                    <div className="text-right">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                ikp.diff_renstra >= 0
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                                            }`}
                                        >
                                            {ikp.diff_renstra >= 0 ? (
                                                <TrendingUp className="size-3.5" />
                                            ) : (
                                                <TrendingDown className="size-3.5" />
                                            )}
                                            {ikp.diff_renstra >= 0 ? '+' : ''}
                                            {ikp.diff_renstra.toFixed(2)}
                                        </span>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            {ikp.capaian_percentage.toFixed(1)}% Capaian
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* 3 Sub-Indeks */}
                            {ikp && (
                                <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-muted/50 p-2 text-center text-xs">
                                    <div className="rounded-lg bg-background p-1.5 shadow-2xs">
                                        <div className="text-[10px] text-muted-foreground">Ketersediaan</div>
                                        <div className="font-bold text-foreground">
                                            {ikp.indeks_ketersediaan !== null ? ikp.indeks_ketersediaan.toFixed(1) : '-'}
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-background p-1.5 shadow-2xs">
                                        <div className="text-[10px] text-muted-foreground">Keterjangkauan</div>
                                        <div className="font-bold text-foreground">
                                            {ikp.indeks_keterjangkauan !== null ? ikp.indeks_keterjangkauan.toFixed(1) : '-'}
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-background p-1.5 shadow-2xs">
                                        <div className="text-[10px] text-muted-foreground">Pemanfaatan</div>
                                        <div className="font-bold text-foreground">
                                            {ikp.indeks_pemanfaatan !== null ? ikp.indeks_pemanfaatan.toFixed(1) : '-'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="border-t border-border/50 px-4 sm:px-5 py-3">
                            <Link
                                href="/ikp-scores"
                                className="inline-flex w-full items-center justify-between text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                            >
                                <span>Kelola Data IKP</span>
                                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* ======================================================== */}
                    {/* CARD 2: Total Stok CPPD, total penyaluran CPPD tahun ini */}
                    {/* ======================================================== */}
                    <Card className="flex flex-col justify-between border-border/70 shadow-sm transition-all hover:shadow-md overflow-hidden">
                        <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-3">
                            <div className="flex items-start justify-between gap-2">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                                    <Package className="size-5" />
                                </span>
                                <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-[calc(100%-2.75rem)]">
                                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 font-medium shrink-0">
                                        Tahun {cppd.tahun}
                                    </Badge>
                                </div>
                            </div>
                            <CardTitle className="pt-2 text-base font-semibold leading-snug">
                                Cadangan Pangan (CPPD)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Stok beras & penyaluran darurat Pemda
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3.5 px-4 sm:px-5 pb-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl border border-blue-200/60 bg-blue-50/50 p-2.5 dark:border-blue-900/40 dark:bg-blue-950/20">
                                    <span className="text-[11px] font-medium text-blue-800 dark:text-blue-300">
                                        Total Stok Saat Ini
                                    </span>
                                    <div className="text-lg font-bold text-foreground mt-0.5">
                                        {formatNumber(cppd.total_stok, 0)} <span className="text-xs font-normal text-muted-foreground">Kg</span>
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                        {(cppd.total_stok / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ton
                                    </div>
                                </div>
                                <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-2.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                                    <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                                        Penyaluran Tahun Ini
                                    </span>
                                    <div className="text-lg font-bold text-foreground mt-0.5">
                                        {formatNumber(cppd.total_penyaluran, 0)} <span className="text-xs font-normal text-muted-foreground">Kg</span>
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                        {(cppd.total_penyaluran / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ton
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                                <span>Stok Awal: <strong className="text-foreground">{formatNumber(cppd.stok_awal, 0)} Kg</strong></span>
                                <span>Pengadaan: <strong className="text-foreground">+{formatNumber(cppd.total_pengadaan, 0)} Kg</strong></span>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-border/50 px-4 sm:px-5 py-3">
                            <Link
                                href="/cppd-admin"
                                className="inline-flex w-full items-center justify-between text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                                <span>Kelola Stok & Penyaluran CPPD</span>
                                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* ======================================================== */}
                    {/* CARD 3: Total Neraca bulan ini (ketersediaan - kebutuhan) */}
                    {/* ======================================================== */}
                    <Card className="flex flex-col justify-between border-border/70 shadow-sm transition-all hover:shadow-md overflow-hidden">
                        <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-3">
                            <div className="flex items-start justify-between gap-2">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
                                    <Scale className="size-5" />
                                </span>
                                <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-[calc(100%-2.75rem)]">
                                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 font-medium shrink-0">
                                        {foodBalance.period_label}
                                    </Badge>
                                    <Badge
                                        className={`text-[11px] px-2 py-0.5 text-white shrink-0 ${
                                            foodBalance.status === 'Surplus'
                                                ? 'bg-teal-600 hover:bg-teal-700'
                                                : 'bg-rose-600 hover:bg-rose-700'
                                        }`}
                                    >
                                        {foodBalance.status}
                                    </Badge>
                                </div>
                            </div>
                            <CardTitle className="pt-2 text-base font-semibold leading-snug">
                                Total Neraca Pangan
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Ketersediaan dikurangi kebutuhan bulan ini
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3.5 px-4 sm:px-5 pb-3">
                            <div>
                                <div className="text-3xl font-extrabold tracking-tight text-foreground">
                                    {foodBalance.total_neraca >= 0 ? '+' : ''}
                                    {formatNumber(foodBalance.total_neraca)} <span className="text-sm font-normal text-muted-foreground">Ton</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Total Ketersediaan - Total Kebutuhan
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-2.5 text-xs">
                                <div>
                                    <div className="text-[10px] text-muted-foreground">Ketersediaan</div>
                                    <div className="font-bold text-foreground">
                                        {formatNumber(foodBalance.total_ketersediaan)} Ton
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-muted-foreground">Kebutuhan</div>
                                    <div className="font-bold text-foreground">
                                        {formatNumber(foodBalance.total_kebutuhan)} Ton
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                                <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-medium">
                                    <CheckCircle2 className="size-3.5" />
                                    {foodBalance.surplus_count} Surplus
                                </span>
                                <span className="text-muted-foreground">
                                    {foodBalance.defisit_count} Defisit ({foodBalance.commodities_count} Komoditas)
                                </span>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-border/50 px-4 sm:px-5 py-3">
                            <Link
                                href="/food-balances"
                                className="inline-flex w-full items-center justify-between text-xs font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400"
                            >
                                <span>Kelola Neraca Pangan</span>
                                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* ======================================================== */}
                    {/* CARD 4: Skor PPh tahun ini dibandingkan dengan target renstra */}
                    {/* ======================================================== */}
                    <Card className="flex flex-col justify-between border-border/70 shadow-sm transition-all hover:shadow-md overflow-hidden">
                        <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-3">
                            <div className="flex items-start justify-between gap-2">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
                                    <PieChart className="size-5" />
                                </span>
                                <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-[calc(100%-2.75rem)]">
                                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 font-medium shrink-0">
                                        Tahun {pph?.tahun ?? new Date().getFullYear()}
                                    </Badge>
                                    <Badge className="bg-purple-600 text-white hover:bg-purple-700 text-[11px] px-2 py-0.5 shrink-0">
                                        {pph?.is_achieved ? 'Target Tercapai' : 'Perlu Peningkatan'}
                                    </Badge>
                                </div>
                            </div>
                            <CardTitle className="pt-2 text-base font-semibold leading-snug">
                                Skor Pola Pangan Harapan (PPH)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Diversifikasi konsumsi pangan gizi seimbang
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 px-4 sm:px-5 pb-3">
                            <div className="flex items-baseline justify-between">
                                <div>
                                    <div className="text-3xl font-extrabold tracking-tight text-foreground">
                                        {pph ? pph.skor_pph.toFixed(2) : '-'}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Target Renstra: <span className="font-semibold text-foreground">{pph ? pph.target_renstra.toFixed(2) : '-'}</span>
                                    </p>
                                </div>
                                {pph && (
                                    <div className="text-right">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                pph.diff_renstra >= 0
                                                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                                            }`}
                                        >
                                            {pph.diff_renstra >= 0 ? (
                                                <TrendingUp className="size-3.5" />
                                            ) : (
                                                <TrendingDown className="size-3.5" />
                                            )}
                                            {pph.diff_renstra >= 0 ? '+' : ''}
                                            {pph.diff_renstra.toFixed(2)}
                                        </span>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            {pph.capaian_percentage.toFixed(1)}% Capaian
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Progress bar visualizing score towards 100 */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px] text-muted-foreground">
                                    <span>Skor Aktual: {pph?.skor_pph.toFixed(1)}</span>
                                    <span>Skor Maksimal: 100</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500"
                                        style={{ width: `${Math.min(100, Math.max(0, pph?.skor_pph ?? 0))}%` }}
                                    />
                                </div>
                            </div>

                            <p className="line-clamp-1 text-xs text-muted-foreground italic">
                                {pph?.keterangan ?? 'Konsumsi pangan penduduk memenuhi standar mutu gizi seimbang.'}
                            </p>
                        </CardContent>
                        <CardFooter className="border-t border-border/50 px-4 sm:px-5 py-3">
                            <Link
                                href="/pph-scores"
                                className="inline-flex w-full items-center justify-between text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400"
                            >
                                <span>Kelola Skor PPH</span>
                                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* ======================================================== */}
                    {/* CARD 5: Persentase desa rentan (1-3) & desa tahan (4-6) */}
                    {/* ======================================================== */}
                    <Card className="flex flex-col justify-between border-border/70 shadow-sm transition-all hover:shadow-md md:col-span-2 overflow-hidden">
                        <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-3">
                            <div className="flex items-start justify-between gap-2">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                                    <Compass className="size-5" />
                                </span>
                                <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-[calc(100%-2.75rem)]">
                                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 font-medium shrink-0">
                                        Tahun {fsva.tahun}
                                    </Badge>
                                    <Badge className="bg-amber-600 text-white hover:bg-amber-700 text-[11px] px-2 py-0.5 shrink-0">
                                        {fsva.total_desa} Desa
                                    </Badge>
                                </div>
                            </div>
                            <CardTitle className="pt-2 text-base font-semibold leading-snug">
                                Peta Kerentanan Desa (FSVA)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Perbandingan desa tahan pangan (Prioritas 4-6) dan desa rentan pangan (Prioritas 1-3)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 px-4 sm:px-5 pb-3">
                            <div className="grid grid-cols-2 gap-3">
                                {/* Tahan Pangan */}
                                <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                            Desa Tahan Pangan
                                        </span>
                                        <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">
                                            Prioritas 4-6
                                        </Badge>
                                    </div>
                                    <div className="mt-1 flex items-baseline gap-1.5">
                                        <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                                            {fsva.tahan_percentage.toFixed(1)}%
                                        </span>
                                        <span className="text-xs text-muted-foreground font-medium">
                                            ({fsva.tahan_count} Desa)
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-emerald-900/80 dark:text-emerald-300/80">
                                        Kondisi pasokan, akses, dan kesehatan pangan relatif aman dan stabil.
                                    </p>
                                </div>

                                {/* Rentan Rawan Pangan */}
                                <div className="rounded-xl border border-rose-200/70 bg-rose-50/60 p-3 dark:border-rose-900/50 dark:bg-rose-950/30">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                                            Desa Rentan Pangan
                                        </span>
                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                            Prioritas 1-3
                                        </Badge>
                                    </div>
                                    <div className="mt-1 flex items-baseline gap-1.5">
                                        <span className="text-2xl font-black text-rose-700 dark:text-rose-400">
                                            {fsva.rentan_percentage.toFixed(1)}%
                                        </span>
                                        <span className="text-xs text-muted-foreground font-medium">
                                            ({fsva.rentan_count} Desa)
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-rose-900/80 dark:text-rose-300/80">
                                        Memerlukan fokus intervensi bantuan sosial, irigasi, dan akses pasar.
                                    </p>
                                </div>
                            </div>

                            {/* Dual Segment Progress Bar */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Distribusi Tingkat Prioritas</span>
                                    <span>{fsva.total_desa} Desa/Kelurahan</span>
                                </div>
                                <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="bg-emerald-500 transition-all duration-500"
                                        style={{ width: `${fsva.tahan_percentage}%` }}
                                        title={`Tahan Pangan: ${fsva.tahan_count} Desa (${fsva.tahan_percentage}%)`}
                                    />
                                    <div
                                        className="bg-rose-500 transition-all duration-500"
                                        style={{ width: `${fsva.rentan_percentage}%` }}
                                        title={`Rentan Pangan: ${fsva.rentan_count} Desa (${fsva.rentan_percentage}%)`}
                                    />
                                </div>
                            </div>

                            {/* 6 Sub-Priority Pills */}
                            <div className="grid grid-cols-6 gap-1.5 text-center text-xs">
                                <div className="rounded-lg bg-red-100 p-1.5 text-red-900 dark:bg-red-950/60 dark:text-red-300">
                                    <div className="text-[10px] font-semibold">P1 (Sgt Rentan)</div>
                                    <div className="font-bold text-sm">{fsva.p1_count}</div>
                                </div>
                                <div className="rounded-lg bg-orange-100 p-1.5 text-orange-900 dark:bg-orange-950/60 dark:text-orange-300">
                                    <div className="text-[10px] font-semibold">P2 (Rentan)</div>
                                    <div className="font-bold text-sm">{fsva.p2_count}</div>
                                </div>
                                <div className="rounded-lg bg-amber-100 p-1.5 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                                    <div className="text-[10px] font-semibold">P3 (Agak Rentan)</div>
                                    <div className="font-bold text-sm">{fsva.p3_count}</div>
                                </div>
                                <div className="rounded-lg bg-lime-100 p-1.5 text-lime-900 dark:bg-lime-950/60 dark:text-lime-300">
                                    <div className="text-[10px] font-semibold">P4 (Agak Tahan)</div>
                                    <div className="font-bold text-sm">{fsva.p4_count}</div>
                                </div>
                                <div className="rounded-lg bg-emerald-100 p-1.5 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    <div className="text-[10px] font-semibold">P5 (Tahan)</div>
                                    <div className="font-bold text-sm">{fsva.p5_count}</div>
                                </div>
                                <div className="rounded-lg bg-teal-100 p-1.5 text-teal-900 dark:bg-teal-950/60 dark:text-teal-300">
                                    <div className="text-[10px] font-semibold">P6 (Sgt Tahan)</div>
                                    <div className="font-bold text-sm">{fsva.p6_count}</div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-border/50 px-4 sm:px-5 py-3">
                            <Link
                                href="/fsva-admin"
                                className="inline-flex w-full items-center justify-between text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400"
                            >
                                <span>Buka Peta & Data Detail FSVA Desa</span>
                                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* ======================================================== */}
                    {/* CARD 8: Kecamatan yang kompositnya status waspada/rentan pada SKPG */}
                    {/* ======================================================== */}
                    <Card className="flex flex-col justify-between border-border/70 shadow-sm transition-all hover:shadow-md md:col-span-2 overflow-hidden">
                        <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-3">
                            <div className="flex items-start justify-between gap-2">
                                <span
                                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                                        skpg.alert_count > 0
                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                    }`}
                                >
                                    {skpg.alert_count > 0 ? (
                                        <AlertTriangle className="size-5" />
                                    ) : (
                                        <MapPin className="size-5" />
                                    )}
                                </span>
                                <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-[calc(100%-2.75rem)]">
                                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 font-medium shrink-0">
                                        {skpg.period_label}
                                    </Badge>
                                    <Badge
                                        className={`text-[11px] px-2 py-0.5 text-white shrink-0 ${
                                            skpg.alert_count > 0
                                                ? 'bg-rose-600 hover:bg-rose-700'
                                                : 'bg-emerald-600 hover:bg-emerald-700'
                                        }`}
                                    >
                                        {skpg.alert_count > 0 ? `${skpg.alert_count} Waspada/Rentan` : '31 Kec Aman'}
                                    </Badge>
                                </div>
                            </div>
                            <CardTitle className="pt-2 text-base font-semibold leading-snug">
                                Status Kerawanan Pangan SKPG
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Indikator komposit (IKB) Sistem Peringatan Dini Kerawanan Pangan dan Gizi
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 px-4 sm:px-5 pb-3">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-2.5 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
                                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                        Status Aman
                                    </span>
                                    <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                                        {skpg.aman_count} <span className="text-xs font-normal text-muted-foreground">Kec</span>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-2.5 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
                                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                        Status Waspada
                                    </span>
                                    <div className="text-xl font-black text-amber-700 dark:text-amber-400 mt-0.5">
                                        {skpg.waspada_count} <span className="text-xs font-normal text-muted-foreground">Kec</span>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-rose-200/60 bg-rose-50/50 p-2.5 text-center dark:border-rose-900/40 dark:bg-rose-950/20">
                                    <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                                        Status Rentan
                                    </span>
                                    <div className="text-xl font-black text-rose-700 dark:text-rose-400 mt-0.5">
                                        {skpg.rentan_count} <span className="text-xs font-normal text-muted-foreground">Kec</span>
                                    </div>
                                </div>
                            </div>

                            {/* List of alert kecamatan or all safe message */}
                            {skpg.alert_count > 0 ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-rose-700 dark:text-rose-400">
                                            Daftar Kecamatan Status Waspada / Rentan:
                                        </span>
                                        {skpg.alert_kecamatan.length > 3 && (
                                            <button
                                                type="button"
                                                onClick={() => setSkpgModalOpen(true)}
                                                className="text-xs font-medium text-emerald-600 hover:underline cursor-pointer"
                                            >
                                                Lihat Semua ({skpg.alert_kecamatan.length})
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        {skpg.alert_kecamatan.slice(0, 3).map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-2.5 text-xs shadow-2xs"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-foreground">
                                                        {item.kecamatan}
                                                    </span>
                                                    <Badge
                                                        className={
                                                            item.ikb === 'RENTAN'
                                                                ? 'bg-rose-600 text-white text-[10px]'
                                                                : 'bg-amber-500 text-white text-[10px]'
                                                        }
                                                    >
                                                        {item.ikb}
                                                    </Badge>
                                                </div>
                                                <div className="text-[11px] text-muted-foreground">
                                                    IK: <strong className="text-foreground">{item.ik}</strong> • IA:{' '}
                                                    <strong className="text-foreground">{item.ia}</strong> • IP:{' '}
                                                    <strong className="text-foreground">{item.ip}</strong>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-3 text-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
                                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-emerald-900 dark:text-emerald-300">
                                            Seluruh 31 Kecamatan Berstatus AMAN
                                        </div>
                                        <div className="text-muted-foreground mt-0.5">
                                            Tidak ditemukan kecamatan dengan indikator komposit waspada maupun rentan pada pemantauan bulan {skpg.period_label}.
                                            {skpg.last_alert_record && (
                                                <span className="block mt-1 text-[11px] text-muted-foreground">
                                                    Catatan: Peringatan waspada terakhir terdeteksi pada <strong>{skpg.last_alert_record.month_name} {skpg.last_alert_record.year}</strong> ({skpg.last_alert_record.count} Kecamatan).
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="border-t border-border/50 px-4 sm:px-5 py-3">
                            <Link
                                href="/skpg-admin"
                                className="inline-flex w-full items-center justify-between text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                            >
                                <span>Kelola Peta & Matriks SKPG Kecamatan</span>
                                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* ======================================================== */}
                    {/* CARD 6: Card Harga konsumen hari ini yang di atas HET */}
                    {/* ======================================================== */}
                    <Card className="flex flex-col justify-between border-border/70 shadow-sm transition-all hover:shadow-md md:col-span-2 overflow-hidden">
                        <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-3">
                            <div className="flex items-start justify-between gap-2">
                                <span
                                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                                        consumerPrices.above_het_count > 0
                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                    }`}
                                >
                                    <TrendingUp className="size-5" />
                                </span>
                                <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-[calc(100%-2.75rem)]">
                                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 font-medium shrink-0">
                                        {consumerPrices.effective_date_formatted}
                                        {consumerPrices.is_today && ' (Hari Ini)'}
                                    </Badge>
                                    <Badge
                                        className={`text-[11px] px-2 py-0.5 text-white shrink-0 ${
                                            consumerPrices.above_het_count > 0
                                                ? 'bg-rose-600 hover:bg-rose-700'
                                                : 'bg-emerald-600 hover:bg-emerald-700'
                                        }`}
                                    >
                                        {consumerPrices.above_het_count > 0
                                            ? `${consumerPrices.above_het_count} Di Atas HET`
                                            : 'Semua Sesuai HET'}
                                    </Badge>
                                </div>
                            </div>
                            <CardTitle className="pt-2 text-base font-semibold leading-snug">
                                Harga Konsumen di Atas HET
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Pemantauan komoditas pangan yang melampaui Harga Eceran Tertinggi di {consumerPrices.market_name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3.5 px-4 sm:px-5 pb-3">
                            {consumerPrices.above_het_count > 0 ? (
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">
                                            {consumerPrices.above_het_count} dari {consumerPrices.total_monitored} komoditas di atas batas HET:
                                        </span>
                                        {consumerPrices.commodities.length > 3 && (
                                            <button
                                                type="button"
                                                onClick={() => setConsumerModalOpen(true)}
                                                className="text-xs font-medium text-rose-600 hover:underline cursor-pointer"
                                            >
                                                Lihat Semua ({consumerPrices.commodities.length})
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        {consumerPrices.commodities.slice(0, 3).map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between rounded-xl border border-rose-200/70 bg-rose-50/40 p-2.5 text-xs transition-colors hover:bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-950/20"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    {item.image_url ? (
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.name}
                                                            className="size-8 rounded-lg object-cover border border-rose-200 dark:border-rose-800"
                                                        />
                                                    ) : (
                                                        <span className="flex size-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                                            <TrendingUp className="size-4" />
                                                        </span>
                                                    )}
                                                    <div>
                                                        <div className="font-bold text-foreground">
                                                            {item.name}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground">
                                                            HET: {formatRupiah(item.het_price)} / {item.unit}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="font-bold text-rose-600 dark:text-rose-400">
                                                        {formatRupiah(item.price)}
                                                    </div>
                                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                                                        <ArrowUpRight className="size-3" />
                                                        +{item.diff_percentage}% (+{formatRupiah(item.diff)})
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-4 text-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
                                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <div>
                                        <div className="font-semibold text-emerald-900 dark:text-emerald-300">
                                            Seluruh Harga Komoditas Konsumen Berada Dalam Batas HET
                                        </div>
                                        <div className="text-muted-foreground mt-0.5">
                                            Tidak ditemukan komoditas pangan yang melampaui Harga Eceran Tertinggi pada tanggal {consumerPrices.effective_date_formatted}.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="border-t border-border/50 px-4 sm:px-5 py-3">
                            <Link
                                href="/consumer-prices"
                                className="inline-flex w-full items-center justify-between text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400"
                            >
                                <span>Kelola Data Harga Konsumen & HET</span>
                                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* ======================================================== */}
                    {/* CARD 7: Card Harga produsen hari ini yang di Bawah HAP */}
                    {/* ======================================================== */}
                    <Card className="flex flex-col justify-between border-border/70 shadow-sm transition-all hover:shadow-md md:col-span-2 overflow-hidden">
                        <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-3">
                            <div className="flex items-start justify-between gap-2">
                                <span
                                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                                        producerPrices.below_hap_count > 0
                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                    }`}
                                >
                                    <Wheat className="size-5" />
                                </span>
                                <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-[calc(100%-2.75rem)]">
                                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 font-medium shrink-0">
                                        {producerPrices.effective_date_formatted}
                                        {producerPrices.is_today && ' (Hari Ini)'}
                                    </Badge>
                                    <Badge
                                        className={`text-[11px] px-2 py-0.5 text-white shrink-0 ${
                                            producerPrices.below_hap_count > 0
                                                ? 'bg-amber-600 hover:bg-amber-700'
                                                : 'bg-emerald-600 hover:bg-emerald-700'
                                        }`}
                                    >
                                        {producerPrices.below_hap_count > 0
                                            ? `${producerPrices.below_hap_count} Di Bawah HAP`
                                            : 'Sesuai HAP'}
                                    </Badge>
                                </div>
                            </div>
                            <CardTitle className="pt-2 text-base font-semibold leading-snug">
                                Harga Produsen di Bawah HAP
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Pemantauan harga di tingkat produsen/petani terhadap Harga Acuan Pembelian (HAP) Bapanas
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3.5 px-4 sm:px-5 pb-3">
                            {producerPrices.below_hap_count > 0 ? (
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">
                                            {producerPrices.below_hap_count} dari {producerPrices.total_monitored} komoditas di bawah HAP acuan:
                                        </span>
                                        {producerPrices.commodities.length > 3 && (
                                            <button
                                                type="button"
                                                onClick={() => setProducerModalOpen(true)}
                                                className="text-xs font-medium text-amber-600 hover:underline cursor-pointer"
                                            >
                                                Lihat Semua ({producerPrices.commodities.length})
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        {producerPrices.commodities.slice(0, 3).map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between rounded-xl border border-amber-200/70 bg-amber-50/40 p-2.5 text-xs transition-colors hover:bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    {item.image_url ? (
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.name}
                                                            className="size-8 rounded-lg object-cover border border-amber-200 dark:border-amber-800"
                                                        />
                                                    ) : (
                                                        <span className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                                            <Wheat className="size-4" />
                                                        </span>
                                                    )}
                                                    <div>
                                                        <div className="font-bold text-foreground">
                                                            {item.name}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground">
                                                            HAP Acuan: {formatRupiah(item.hap_price)} / {item.unit}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="font-bold text-amber-600 dark:text-amber-400">
                                                        {formatRupiah(item.price)}
                                                    </div>
                                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                                                        <ArrowDownRight className="size-3" />
                                                        -{item.diff_percentage}% (-{formatRupiah(item.diff)})
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-4 text-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
                                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <div>
                                        <div className="font-semibold text-emerald-900 dark:text-emerald-300">
                                            Seluruh Harga Produsen Sesuai / Di Atas Batas Acuan HAP
                                        </div>
                                        <div className="text-muted-foreground mt-0.5">
                                            Harga komoditas pangan di tingkat produsen/petani aman terlindungi, tidak ada harga yang anjlok di bawah batas acuan pemerintah.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="border-t border-border/50 px-4 sm:px-5 py-3">
                            <Link
                                href="/producer-prices"
                                className="inline-flex w-full items-center justify-between text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400"
                            >
                                <span>Kelola Data Harga Produsen & HAP</span>
                                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </CardFooter>
                    </Card>
                </div>
            </div>

            {/* Modal: Full Consumer Prices Above HET */}
            <Dialog open={consumerModalOpen} onOpenChange={setConsumerModalOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <TrendingUp className="size-5 text-rose-600" />
                            Daftar Komoditas Konsumen di Atas HET
                        </DialogTitle>
                        <DialogDescription>
                            Pemantauan harga komoditas yang melampaui batas HET pada {consumerPrices.effective_date_formatted} ({consumerPrices.market_name})
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                        {consumerPrices.commodities.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-xs dark:border-rose-900/40 dark:bg-rose-950/20"
                            >
                                <div className="flex items-center gap-3">
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="size-10 rounded-lg object-cover border border-rose-200 dark:border-rose-800"
                                        />
                                    ) : (
                                        <span className="flex size-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                            <TrendingUp className="size-5" />
                                        </span>
                                    )}
                                    <div>
                                        <div className="font-bold text-foreground text-sm">{item.name}</div>
                                        <div className="text-muted-foreground">
                                            HET: <strong className="text-foreground">{formatRupiah(item.het_price)}</strong> / {item.unit}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-base font-bold text-rose-600 dark:text-rose-400">
                                        {formatRupiah(item.price)}
                                    </div>
                                    <div className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                                        +{item.diff_percentage}% (+{formatRupiah(item.diff)})
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal: Full Producer Prices Below HAP */}
            <Dialog open={producerModalOpen} onOpenChange={setProducerModalOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wheat className="size-5 text-amber-600" />
                            Daftar Komoditas Produsen di Bawah HAP
                        </DialogTitle>
                        <DialogDescription>
                            Komoditas tingkat produsen/petani yang tercatat di bawah Harga Acuan Pembelian pada {producerPrices.effective_date_formatted}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                        {producerPrices.commodities.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs dark:border-amber-900/40 dark:bg-amber-950/20"
                            >
                                <div className="flex items-center gap-3">
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="size-10 rounded-lg object-cover border border-amber-200 dark:border-amber-800"
                                        />
                                    ) : (
                                        <span className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                            <Wheat className="size-5" />
                                        </span>
                                    )}
                                    <div>
                                        <div className="font-bold text-foreground text-sm">{item.name}</div>
                                        <div className="text-muted-foreground">
                                            HAP: <strong className="text-foreground">{formatRupiah(item.hap_price)}</strong> / {item.unit}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                                        {formatRupiah(item.price)}
                                    </div>
                                    <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                                        -{item.diff_percentage}% (-{formatRupiah(item.diff)})
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal: Full SKPG Alert Kecamatan */}
            <Dialog open={skpgModalOpen} onOpenChange={setSkpgModalOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="size-5 text-rose-600" />
                            Daftar Kecamatan Status Waspada / Rentan SKPG
                        </DialogTitle>
                        <DialogDescription>
                            Kecamatan dengan status komposit (IKB) Waspada atau Rentan pada periode {skpg.period_label}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                        {skpg.alert_kecamatan.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3 text-xs shadow-2xs"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-foreground text-sm">
                                            {item.kecamatan}
                                        </span>
                                        <Badge
                                            className={
                                                item.ikb === 'RENTAN'
                                                    ? 'bg-rose-600 text-white'
                                                    : 'bg-amber-500 text-white'
                                            }
                                        >
                                            {item.ikb}
                                        </Badge>
                                    </div>
                                    {item.keterangan && (
                                        <p className="text-muted-foreground italic text-[11px]">
                                            {item.keterangan}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right text-muted-foreground">
                                    <div>IK (Ketersediaan): <strong className="text-foreground">{item.ik}</strong></div>
                                    <div>IA (Akses): <strong className="text-foreground">{item.ia}</strong></div>
                                    <div>IP (Pemanfaatan): <strong className="text-foreground">{item.ip}</strong></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
