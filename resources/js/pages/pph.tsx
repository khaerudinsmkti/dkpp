import { Head, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowDown,
    ArrowUpRight,
    Award,
    BarChart2,
    Calendar,
    CheckCircle2,
    ChevronRight,
    Download,
    FileSpreadsheet,
    FileText,
    HelpCircle,
    Info,
    Layers,
    LineChart as LineChartIcon,
    PieChart as PieChartIcon,
    Printer,
    Scale,
    Search,
    ShieldCheck,
    Sparkles,
    TrendingDown,
    TrendingUp,
    Utensils,
    Wheat,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
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
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface YearlyScoreItem {
    id: number;
    tahun: number;
    skor_pph: number;
    target_ideal: number;
    target_renstra: number;
    keterangan: string | null;
    status: 'Sangat Baik' | 'Baik' | 'Sedang' | 'Kurang';
    diff_previous: number;
    diff_percentage: number;
}

export interface CommodityDetailItem {
    id: number | null;
    pph_food_group_id: number;
    food_group_name: string;
    food_group_slug: string;
    food_group_order: number;
    food_group_description: string | null;
    energi: number;
    ake_percentage: number;
    bobot: number;
    skor_riil: number;
    skor_pph: number;
    skor_maksimal: number;
    capaian_percentage: number;
    keterangan: string | null;
    is_recorded: boolean;
}

export interface PphPageProps {
    yearlyScores: YearlyScoreItem[];
    selectedYear: number;
    availableYears: number[];
    commodityDetails: CommodityDetailItem[];
    totals: {
        total_energi: number;
        total_ake: number;
        total_bobot: number;
        total_skor_riil: number;
        total_skor_maksimal: number;
        total_skor_pph: number;
    };
    allYearCommodities?: Record<number, CommodityDetailItem[]>;
    allYearTotals?: Record<
        number,
        {
            total_energi: number;
            total_ake: number;
            total_bobot: number;
            total_skor_riil: number;
            total_skor_maksimal: number;
            total_skor_pph: number;
        }
    >;
    initialCompareYear?: number | null;
    statistics: {
        selected_year: number;
        current_score: number;
        prev_score: number | null;
        prev_year: number | null;
        diff_score: number;
        diff_percentage: number;
        status: string;
        achieved_count: number;
        total_groups: number;
        standard_ake: number;
        ideal_score: number;
        target_renstra?: number;
    };
}

function formatNumber(num: number | null | undefined, decimals = 2): string {
    if (num === null || num === undefined) return '-';
    return Number(num).toLocaleString('id-ID', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

function getScoreBadgeColor(score: number): {
    badge: string;
    text: string;
    bg: string;
    label: string;
} {
    if (score >= 90) {
        return {
            badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700',
            text: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500',
            label: 'Sangat Baik (Prima)',
        };
    }
    if (score >= 80) {
        return {
            badge: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-700',
            text: 'text-teal-600 dark:text-teal-400',
            bg: 'bg-teal-500',
            label: 'Baik (Cukup)',
        };
    }
    if (score >= 70) {
        return {
            badge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700',
            text: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500',
            label: 'Sedang (Perlu Perbaikan)',
        };
    }
    return {
        badge: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700',
        text: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-500',
        label: 'Kurang (Rendah)',
    };
}

function CustomYearTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: any[];
}) {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload as YearlyScoreItem;
    if (!data) return null;

    const badge = getScoreBadgeColor(data.skor_pph);
    const isUp = data.diff_previous >= 0;

    return (
        <div className="min-w-[240px] rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-[#006565] dark:text-emerald-400" />
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Tahun {data.tahun}
                    </span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${badge.badge}`}>
                    {data.status}
                </span>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Skor PPH:</span>
                    <span className="font-mono font-black text-sm text-[#006565] dark:text-emerald-400">
                        {formatNumber(data.skor_pph)} / 100.0
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Target RENSTRA:</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {formatNumber(data.target_renstra ?? 94.0)}
                    </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Status vs Renstra:</span>
                    <span
                        className={`font-mono font-bold ${
                            data.skor_pph >= (data.target_renstra ?? 94.0)
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                        }`}
                    >
                        {data.skor_pph >= (data.target_renstra ?? 94.0)
                            ? `✓ Melampaui (+${formatNumber(data.skor_pph - (data.target_renstra ?? 94.0))})`
                            : `Selisih ${formatNumber(data.skor_pph - (data.target_renstra ?? 94.0))}`}
                    </span>
                </div>

                {data.diff_previous !== 0 && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Pertumbuhan:</span>
                        <span
                            className={`font-mono font-bold flex items-center gap-0.5 ${
                                isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}
                        >
                            {isUp ? '+' : ''}
                            {formatNumber(data.diff_previous)} poin ({isUp ? '+' : ''}
                            {formatNumber(data.diff_percentage, 1)}%)
                        </span>
                    </div>
                )}

                {data.keterangan && (
                    <div className="border-t border-slate-100 pt-1.5 text-[11px] text-slate-500 italic dark:border-slate-800 dark:text-slate-400">
                        "{data.keterangan}"
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PphPublic({
    yearlyScores,
    selectedYear,
    availableYears,
    commodityDetails,
    totals,
    statistics,
    allYearCommodities,
    allYearTotals,
    initialCompareYear,
}: PphPageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [chartMode, setChartMode] = useState<'composed' | 'line' | 'area'>('composed');
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [compareYear, setCompareYear] = useState<number | null>(
        initialCompareYear && initialCompareYear !== selectedYear ? initialCompareYear : null
    );

    const handleYearChange = (year: number) => {
        router.get(
            '/pph',
            {
                year,
                ...(compareYear && compareYear !== year ? { compare: compareYear } : {}),
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Data for comparison year
    const compCommodities = useMemo(() => {
        if (!compareYear || !allYearCommodities) return null;
        return allYearCommodities[compareYear] ?? null;
    }, [compareYear, allYearCommodities]);

    const compTotals = useMemo(() => {
        if (!compareYear || !allYearTotals) return null;
        return allYearTotals[compareYear] ?? null;
    }, [compareYear, allYearTotals]);

    const compMap = useMemo(() => {
        if (!compCommodities) return new Map<number, CommodityDetailItem>();
        return new Map(compCommodities.map((c) => [c.pph_food_group_id, c]));
    }, [compCommodities]);

    // Comparison summary metrics
    const comparisonSummary = useMemo(() => {
        if (!compareYear || !compTotals || !compCommodities) return null;

        const diffScore = Number((totals.total_skor_pph - compTotals.total_skor_pph).toFixed(2));
        const diffEnergi = Number((totals.total_energi - compTotals.total_energi).toFixed(1));
        const diffAke = Number((totals.total_ake - compTotals.total_ake).toFixed(2));

        let increased = 0;
        let decreased = 0;
        let stable = 0;

        commodityDetails.forEach((cur) => {
            const prev = compMap.get(cur.pph_food_group_id);
            if (!prev) return;
            const diff = Number((cur.skor_pph - prev.skor_pph).toFixed(2));
            if (diff > 0.01) increased++;
            else if (diff < -0.01) decreased++;
            else stable++;
        });

        return {
            diffScore,
            diffEnergi,
            diffAke,
            increased,
            decreased,
            stable,
        };
    }, [compareYear, compTotals, compCommodities, compMap, totals, commodityDetails]);

    const filteredCommodities = useMemo(() => {
        if (!searchTerm.trim()) return commodityDetails;
        const q = searchTerm.toLowerCase();
        return commodityDetails.filter(
            (c) =>
                c.food_group_name.toLowerCase().includes(q) ||
                (c.food_group_description && c.food_group_description.toLowerCase().includes(q)) ||
                (c.keterangan && c.keterangan.toLowerCase().includes(q))
        );
    }, [commodityDetails, searchTerm]);

    const handleExportCsv = () => {
        if (compareYear && compCommodities && compTotals) {
            // Mode Komparasi Antar Tahun
            const headers = [
                'No',
                'Kelompok Bahan Pangan',
                'Deskripsi / Contoh Komoditas',
                `Energi ${compareYear} (Kkal)`,
                `Energi ${selectedYear} (Kkal)`,
                'Selisih Energi (Kkal)',
                `% AKE ${compareYear}`,
                `% AKE ${selectedYear}`,
                'Selisih % AKE',
                'Bobot',
                `Skor PPH ${compareYear}`,
                `Skor PPH ${selectedYear}`,
                'Selisih Skor PPH',
                'Status Perubahan',
            ];

            const rows = commodityDetails.map((c, idx) => {
                const prev = compMap.get(c.pph_food_group_id);
                const prevE = prev?.energi ?? 0;
                const currE = c.energi;
                const diffE = Number((currE - prevE).toFixed(1));

                const prevA = prev?.ake_percentage ?? 0;
                const currA = c.ake_percentage;
                const diffA = Number((currA - prevA).toFixed(2));

                const prevS = prev?.skor_pph ?? 0;
                const currS = c.skor_pph;
                const diffS = Number((currS - prevS).toFixed(2));

                const status = diffS > 0.01 ? 'Meningkat' : diffS < -0.01 ? 'Menurun' : 'Stabil';

                return [
                    idx + 1,
                    `"${c.food_group_name}"`,
                    `"${c.food_group_description || ''}"`,
                    prevE,
                    currE,
                    diffE,
                    `${prevA}%`,
                    `${currA}%`,
                    `${diffA}%`,
                    c.bobot,
                    prevS,
                    currS,
                    diffS,
                    `"${status}"`,
                ];
            });

            const diffTotE = Number((totals.total_energi - compTotals.total_energi).toFixed(1));
            const diffTotA = Number((totals.total_ake - compTotals.total_ake).toFixed(2));
            const diffTotS = Number((totals.total_skor_pph - compTotals.total_skor_pph).toFixed(2));

            const totalRow = [
                '',
                `"TOTAL KESELURUHAN (KOMPARASI)"`,
                '',
                compTotals.total_energi,
                totals.total_energi,
                diffTotE,
                `${compTotals.total_ake}%`,
                `${totals.total_ake}%`,
                `${diffTotA}%`,
                totals.total_bobot,
                compTotals.total_skor_pph,
                totals.total_skor_pph,
                diffTotS,
                `"Komparasi Tahun ${selectedYear} vs ${compareYear}"`,
            ];

            const csvContent =
                'data:text/csv;charset=utf-8,\uFEFF' +
                [headers.join(','), ...rows.map((r) => r.join(',')), totalRow.join(',')].join('\n');

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `Komparasi_PPH_Indramayu_${selectedYear}_vs_${compareYear}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        // Mode Normal (Tahun Tunggal)
        const headers = [
            'No',
            'Kelompok Bahan Pangan',
            'Deskripsi / Contoh Komoditas',
            'Energi (Kkal)',
            '% AKE',
            'Bobot',
            'Skor Riil',
            'Skor Maksimal',
            'Skor PPH',
            '% Capaian',
            'Keterangan',
        ];

        const rows = commodityDetails.map((c, idx) => [
            idx + 1,
            `"${c.food_group_name}"`,
            `"${c.food_group_description || ''}"`,
            c.energi,
            c.ake_percentage,
            c.bobot,
            c.skor_riil,
            c.skor_maksimal,
            c.skor_pph,
            `${c.capaian_percentage}%`,
            `"${c.keterangan || ''}"`,
        ]);

        const totalRow = [
            '',
            '"TOTAL KESELURUHAN"',
            '',
            totals.total_energi,
            totals.total_ake,
            totals.total_bobot,
            totals.total_skor_riil,
            totals.total_skor_maksimal,
            totals.total_skor_pph,
            `${totals.total_skor_maksimal > 0 ? ((totals.total_skor_pph / totals.total_skor_maksimal) * 100).toFixed(1) : 0}%`,
            `"Skor PPH Indramayu Tahun ${selectedYear}"`,
        ];

        const csvContent =
            'data:text/csv;charset=utf-8,\uFEFF' +
            [headers.join(','), ...rows.map((r) => r.join(',')), totalRow.join(',')].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `PPH_Kabupaten_Indramayu_${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrintPdf = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Mohon izinkan pop-up browser untuk mencetak laporan.');
            return;
        }

        const formattedToday = new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        if (compareYear && compCommodities && compTotals && comparisonSummary) {
            // Mode Cetak Komparasi
            let tableRowsHtml = '';
            commodityDetails.forEach((c, idx) => {
                const prev = compMap.get(c.pph_food_group_id);
                const prevE = prev?.energi ?? 0;
                const currE = c.energi;
                const diffE = Number((currE - prevE).toFixed(1));

                const prevA = prev?.ake_percentage ?? 0;
                const currA = c.ake_percentage;
                const diffA = Number((currA - prevA).toFixed(2));

                const prevS = prev?.skor_pph ?? 0;
                const currS = c.skor_pph;
                const diffS = Number((currS - prevS).toFixed(2));

                const isUp = diffS > 0.01;
                const isDown = diffS < -0.01;

                tableRowsHtml += `
                    <tr>
                        <td style="text-align:center;color:#64748b;">${idx + 1}</td>
                        <td style="font-weight:bold;color:#0f172a;">${c.food_group_name}</td>
                        <td style="text-align:right;">${formatNumber(prevE, 1)}</td>
                        <td style="text-align:right;font-weight:bold;">${formatNumber(currE, 1)}</td>
                        <td style="text-align:right;color:${diffE >= 0 ? '#047857' : '#e11d48'};">${diffE >= 0 ? '+' : ''}${formatNumber(diffE, 1)}</td>
                        <td style="text-align:right;">${formatNumber(prevA, 2)}%</td>
                        <td style="text-align:right;font-weight:bold;">${formatNumber(currA, 2)}%</td>
                        <td style="text-align:center;">${formatNumber(c.bobot, 1)}</td>
                        <td style="text-align:right;">${formatNumber(prevS)}</td>
                        <td style="text-align:right;font-weight:bold;color:#047857;">${formatNumber(currS)}</td>
                        <td style="text-align:right;font-weight:bold;color:${isUp ? '#047857' : isDown ? '#e11d48' : '#64748b'};">
                            ${isUp ? '+' : ''}${formatNumber(diffS)}
                        </td>
                        <td style="text-align:center;font-size:7.5pt;font-weight:bold;color:${isUp ? '#047857' : isDown ? '#e11d48' : '#64748b'};">
                            ${isUp ? '▲ Naik' : isDown ? '▼ Turun' : '— Stabil'}
                        </td>
                    </tr>
                `;
            });

            const printHtml = `
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8"/>
                <title>Laporan_Komparasi_PPH_${selectedYear}_vs_${compareYear}</title>
                <style>
                    @page { size: A4 landscape; margin: 10mm 12mm; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        margin: 0; padding: 12px; color: #0f172a; font-size: 8pt; background: #fff;
                    }
                    .no-print {
                        margin-bottom: 12px; display: flex; gap: 12px; align-items: center;
                        background: #f8fafc; padding: 8px 14px; border-radius: 8px; border: 1px solid #cbd5e1;
                    }
                    .btn {
                        background: #006565; color: white; border: none; padding: 7px 16px;
                        border-radius: 6px; font-weight: bold; font-size: 8.5pt; cursor: pointer;
                    }
                    .kop-container {
                        text-align: center; margin-bottom: 10px; border-bottom: 3px double #006565; padding-bottom: 6px;
                    }
                    .kop-sub { font-size: 8.5pt; font-weight: 600; text-transform: uppercase; color: #334155; margin: 0; }
                    .kop-main { font-size: 13pt; font-weight: 800; text-transform: uppercase; color: #006565; margin: 2px 0; }
                    .kop-address { font-size: 7.5pt; color: #64748b; margin: 0; }
                    .title-section { text-align: center; margin: 10px 0; }
                    .title-section h1 { margin: 0; font-size: 11pt; font-weight: 800; text-transform: uppercase; color: #0f172a; }
                    .title-section p { margin: 3px 0 0 0; font-size: 8pt; color: #475569; }
                    .summary-box {
                        display: flex; justify-content: space-around; background: #f0fdf4; border: 1px solid #bbf7d0;
                        padding: 8px 12px; border-radius: 8px; margin-bottom: 10px;
                    }
                    .summary-item { text-align: center; }
                    .summary-item .label { font-size: 7pt; color: #166534; text-transform: uppercase; font-weight: bold; }
                    .summary-item .val { font-size: 11pt; font-weight: 800; color: #14532d; font-family: monospace; }
                    table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 7.5pt; }
                    th { background-color: #006565; color: white; border: 1px solid #004d4d; padding: 5px 5px; font-weight: bold; text-align: center; }
                    td { border: 1px solid #cbd5e1; padding: 4px 5px; }
                    tr:nth-child(even) td { background-color: #f8fafc; }
                    tfoot tr td { background-color: #ecfdf5; font-weight: bold; border-top: 2px solid #006565; }
                    .footer-sign { margin-top: 18px; display: flex; justify-content: flex-end; }
                    .sign-box { text-align: center; width: 220px; font-size: 7.5pt; }
                    @media print { .no-print { display: none !important; } }
                </style>
            </head>
            <body>
                <div class="no-print">
                    <button class="btn" onclick="window.print()">Cetak Dokumen Sekarang</button>
                    <span style="font-size: 8pt; color: #64748b;">(Gunakan orientasi Lanskap di dialog cetak)</span>
                </div>

                <div class="kop-container">
                    <p class="kop-sub">Pemerintah Kabupaten Indramayu</p>
                    <h2 class="kop-main">Dinas Ketahanan Pangan dan Pertanian</h2>
                    <p class="kop-address">Jl. MT Haryono No. 1, Sindang, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat 45222</p>
                </div>

                <div class="title-section">
                    <h1>Laporan Komparasi Pola Pangan Harapan (PPH)</h1>
                    <p>Kabupaten Indramayu: Perbandingan Tahun ${selectedYear} vs Tahun ${compareYear}</p>
                </div>

                <div class="summary-box">
                    <div class="summary-item">
                        <div class="label">Skor PPH ${compareYear}</div>
                        <div class="val">${formatNumber(compTotals.total_skor_pph)}</div>
                    </div>
                    <div class="summary-item">
                        <div class="label">Skor PPH ${selectedYear}</div>
                        <div class="val">${formatNumber(totals.total_skor_pph)}</div>
                    </div>
                    <div class="summary-item">
                        <div class="label">Selisih Skor PPH</div>
                        <div class="val" style="color:${comparisonSummary.diffScore >= 0 ? '#047857' : '#e11d48'};">
                            ${comparisonSummary.diffScore >= 0 ? '+' : ''}${formatNumber(comparisonSummary.diffScore)} Poin
                        </div>
                    </div>
                    <div class="summary-item">
                        <div class="label">Selisih Energi</div>
                        <div class="val">
                            ${comparisonSummary.diffEnergi >= 0 ? '+' : ''}${formatNumber(comparisonSummary.diffEnergi, 1)} Kkal
                        </div>
                    </div>
                    <div class="summary-item">
                        <div class="label">Komoditas Meningkat</div>
                        <div class="val" style="color:#047857;">${comparisonSummary.increased} Kelompok</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th rowspan="2">No</th>
                            <th rowspan="2">Kelompok Bahan Pangan</th>
                            <th colspan="3">Energi (Kkal)</th>
                            <th colspan="2">% AKE</th>
                            <th rowspan="2">Bobot</th>
                            <th colspan="3">Skor PPH</th>
                            <th rowspan="2">Status</th>
                        </tr>
                        <tr>
                            <th>${compareYear}</th>
                            <th>${selectedYear}</th>
                            <th>Δ (+/-)</th>
                            <th>${compareYear}</th>
                            <th>${selectedYear}</th>
                            <th>${compareYear}</th>
                            <th>${selectedYear}</th>
                            <th>Δ Skor</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" style="text-align:center;">TOTAL KESELURUHAN</td>
                            <td style="text-align:right;">${formatNumber(compTotals.total_energi, 1)}</td>
                            <td style="text-align:right;color:#047857;">${formatNumber(totals.total_energi, 1)}</td>
                            <td style="text-align:right;color:${comparisonSummary.diffEnergi >= 0 ? '#047857' : '#e11d48'};">
                                ${comparisonSummary.diffEnergi >= 0 ? '+' : ''}${formatNumber(comparisonSummary.diffEnergi, 1)}
                            </td>
                            <td style="text-align:right;">${formatNumber(compTotals.total_ake, 2)}%</td>
                            <td style="text-align:right;color:#047857;">${formatNumber(totals.total_ake, 2)}%</td>
                            <td style="text-align:center;">${formatNumber(totals.total_bobot, 1)}</td>
                            <td style="text-align:right;">${formatNumber(compTotals.total_skor_pph)}</td>
                            <td style="text-align:right;color:#047857;font-size:9pt;">${formatNumber(totals.total_skor_pph)}</td>
                            <td style="text-align:right;color:${comparisonSummary.diffScore >= 0 ? '#047857' : '#e11d48'};font-size:9pt;">
                                ${comparisonSummary.diffScore >= 0 ? '+' : ''}${formatNumber(comparisonSummary.diffScore)}
                            </td>
                            <td style="text-align:center;font-size:7.5pt;">${comparisonSummary.diffScore >= 0 ? 'Peningkatan' : 'Penurunan'}</td>
                        </tr>
                    </tfoot>
                </table>

                <div class="footer-sign">
                    <div class="sign-box">
                        <p style="margin: 0 0 35px 0;">Indramayu, ${formattedToday}<br/>Kepala DKPP Kabupaten Indramayu</p>
                        <p style="margin: 0; font-weight: bold; text-decoration: underline;">DINAS KETAHANAN PANGAN &amp; PERTANIAN</p>
                        <p style="margin: 0; color: #64748b; font-size: 7pt;">Pemerintah Kabupaten Indramayu</p>
                    </div>
                </div>
            </body>
            </html>
            `;

            printWindow.document.open();
            printWindow.document.write(printHtml);
            printWindow.document.close();
            return;
        }

        // Mode Normal (Tahun Tunggal)
        let tableRowsHtml = '';
        commodityDetails.forEach((c, idx) => {
            const isFull = c.skor_pph >= c.skor_maksimal && c.skor_maksimal > 0;
            tableRowsHtml += `
                <tr>
                    <td style="text-align:center;color:#64748b;">${idx + 1}</td>
                    <td style="font-weight:bold;color:#0f172a;">${c.food_group_name}</td>
                    <td style="text-align:right;">${formatNumber(c.energi)}</td>
                    <td style="text-align:right;">${formatNumber(c.ake_percentage)}%</td>
                    <td style="text-align:center;">${formatNumber(c.bobot, 1)}</td>
                    <td style="text-align:right;">${formatNumber(c.skor_riil)}</td>
                    <td style="text-align:right;">${formatNumber(c.skor_maksimal)}</td>
                    <td style="text-align:right;font-weight:bold;color:#047857;">${formatNumber(c.skor_pph)}</td>
                    <td style="text-align:center;">
                        <span style="font-weight:bold;color:${isFull ? '#047857' : '#b45309'}">
                            ${formatNumber(c.capaian_percentage, 1)}%
                        </span>
                    </td>
                    <td style="color:#475569;font-size:7.5pt;">${c.keterangan || '-'}</td>
                </tr>
            `;
        });

        const printHtml = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8"/>
            <title>Laporan_PPH_Indramayu_${selectedYear}</title>
            <style>
                @page { size: A4 portrait; margin: 12mm 15mm; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    margin: 0; padding: 15px; color: #0f172a; font-size: 8.5pt; background: #fff;
                }
                .no-print {
                    margin-bottom: 16px; display: flex; gap: 12px; align-items: center;
                    background: #f8fafc; padding: 10px 16px; border-radius: 8px; border: 1px solid #cbd5e1;
                }
                .btn {
                    background: #006565; color: white; border: none; padding: 7px 16px;
                    border-radius: 6px; font-weight: bold; font-size: 9pt; cursor: pointer;
                }
                .kop-container {
                    text-align: center; margin-bottom: 12px; border-bottom: 3px double #006565; padding-bottom: 8px;
                }
                .kop-sub { font-size: 9pt; font-weight: 600; text-transform: uppercase; color: #334155; margin: 0; }
                .kop-main { font-size: 14pt; font-weight: 800; text-transform: uppercase; color: #006565; margin: 2px 0; }
                .kop-address { font-size: 7.5pt; color: #64748b; margin: 0; }
                .title-section { text-align: center; margin: 14px 0; }
                .title-section h1 { margin: 0; font-size: 12pt; font-weight: 800; text-transform: uppercase; color: #0f172a; }
                .title-section p { margin: 4px 0 0 0; font-size: 8.5pt; color: #475569; }
                .summary-box {
                    display: flex; justify-content: space-between; background: #f0fdf4; border: 1px solid #bbf7d0;
                    padding: 10px 15px; border-radius: 8px; margin-bottom: 12px;
                }
                .summary-item { text-align: center; }
                .summary-item .label { font-size: 7.5pt; color: #166534; text-transform: uppercase; font-weight: bold; }
                .summary-item .val { font-size: 13pt; font-weight: 800; color: #14532d; font-family: monospace; }
                table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 8pt; }
                th { background-color: #006565; color: white; border: 1px solid #004d4d; padding: 6px 6px; font-weight: bold; text-align: center; }
                td { border: 1px solid #cbd5e1; padding: 5px 6px; }
                tr:nth-child(even) td { background-color: #f8fafc; }
                tfoot tr td { background-color: #ecfdf5; font-weight: bold; border-top: 2px solid #006565; }
                .footer-sign { margin-top: 25px; display: flex; justify-content: flex-end; }
                .sign-box { text-align: center; width: 220px; font-size: 8pt; }
                @media print { .no-print { display: none !important; } }
            </style>
        </head>
        <body>
            <div class="no-print">
                <button class="btn" onclick="window.print()">Cetak Dokumen Sekarang</button>
                <span style="font-size: 8.5pt; color: #64748b;">(Gunakan opsi Save as PDF di dialog cetak)</span>
            </div>

            <div class="kop-container">
                <p class="kop-sub">Pemerintah Kabupaten Indramayu</p>
                <h2 class="kop-main">Dinas Ketahanan Pangan dan Pertanian</h2>
                <p class="kop-address">Jl. MT Haryono No. 1, Sindang, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat 45222</p>
            </div>

            <div class="title-section">
                <h1>Laporan Pola Pangan Harapan (PPH)</h1>
                <p>Kabupaten Indramayu - Tahun ${selectedYear} (Standar AKE: 2.100 Kkal/kapita/hari)</p>
            </div>

            <div class="summary-box">
                <div class="summary-item">
                    <div class="label">Skor PPH Akhir</div>
                    <div class="val">${formatNumber(totals.total_skor_pph)} / 100.0</div>
                </div>
                <div class="summary-item">
                    <div class="label">Status Mutu Gizi</div>
                    <div class="val" style="font-size: 10.5pt; padding-top: 4px;">${statistics.status}</div>
                </div>
                <div class="summary-item">
                    <div class="label">Total Energi</div>
                    <div class="val">${formatNumber(totals.total_energi)} Kkal</div>
                </div>
                <div class="summary-item">
                    <div class="label">Total % AKE</div>
                    <div class="val">${formatNumber(totals.total_ake)}%</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 25px;">No</th>
                        <th>Kelompok Bahan Pangan</th>
                        <th style="width: 65px;">Energi (Kkal)</th>
                        <th style="width: 55px;">% AKE</th>
                        <th style="width: 40px;">Bobot</th>
                        <th style="width: 55px;">Skor Riil</th>
                        <th style="width: 60px;">Skor Maks</th>
                        <th style="width: 60px;">Skor PPH</th>
                        <th style="width: 60px;">Capaian</th>
                        <th>Keterangan</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2" style="text-align:center;">TOTAL KESELURUHAN</td>
                        <td style="text-align:right;">${formatNumber(totals.total_energi)}</td>
                        <td style="text-align:right;">${formatNumber(totals.total_ake)}%</td>
                        <td style="text-align:center;">${formatNumber(totals.total_bobot, 1)}</td>
                        <td style="text-align:right;">${formatNumber(totals.total_skor_riil)}</td>
                        <td style="text-align:right;">${formatNumber(totals.total_skor_maksimal)}</td>
                        <td style="text-align:right;color:#047857;font-size:9.5pt;">${formatNumber(totals.total_skor_pph)}</td>
                        <td style="text-align:center;">${formatNumber(totals.total_skor_maksimal > 0 ? (totals.total_skor_pph / totals.total_skor_maksimal) * 100 : 0, 1)}%</td>
                        <td style="font-size:7.5pt;">Skor PPH Indramayu ${selectedYear}</td>
                    </tr>
                </tfoot>
            </table>

        </body>
        </html>
        `;

        printWindow.document.open();
        printWindow.document.write(printHtml);
        printWindow.document.close();
    };

    const currentYearScore = totals.total_skor_pph;
    const badgeMeta = getScoreBadgeColor(currentYearScore);
    const currentYearData = yearlyScores.find((y) => y.tahun === selectedYear);
    const currentTargetRenstra = currentYearData?.target_renstra ?? statistics.target_renstra ?? 94.0;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
            <Head title={`Skor Pola Pangan Harapan (PPH) Tahun ${selectedYear} - DKPP Kabupaten Indramayu`} />

            {/* Public Portal Top Navigation Bar */}
            <PortalNavbar activePage="pph" />

            {/* Main Content Area */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
                {/* 1. HERO BANNER */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-[#004e4e] to-teal-950 p-6 sm:p-8 lg:p-10 text-white shadow-2xl shadow-emerald-950/25 border border-white/10">
                    {/* Glowing Mesh Orbs */}
                    <div className="pointer-events-none absolute -top-28 -left-28 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-28 -right-28 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl" />
                    <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-cyan-500/10 blur-2xl" />

                    <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                        {/* Left Column: Heading, Context, Badges & Action Buttons */}
                        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
                            {/* Live Badge */}
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-md shadow-inner">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                                </span>
                                <span>STANDAR MUTU &amp; KEANEKARAGAMAN PANGAN DAERAH</span>
                            </div>

                            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl leading-tight">
                                Pola Pangan Harapan{' '}
                                <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-200 bg-clip-text text-transparent">
                                    (PPH) Indramayu
                                </span>
                            </h1>

                            <p className="text-sm font-medium text-emerald-100/90 sm:text-base leading-relaxed max-w-2xl">
                                Indikator penilaian kualitas konsumsi dan keragaman pangan masyarakat Kabupaten Indramayu
                                berbasis 9 kelompok pangan pokok dengan standar kecukupan energi 2.100 Kkal/kapita/hari.
                            </p>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => scrollToSection('tabel-komoditas')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] cursor-pointer"
                                >
                                    <Layers className="size-4" />
                                    <span>Tabel 9 Komoditas</span>
                                    <ArrowDown className="size-3.5 opacity-80" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => scrollToSection('grafik-pph')}
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98] cursor-pointer"
                                >
                                    <TrendingUp className="size-4 text-emerald-300" />
                                    <span>Grafik Antar Tahun</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowInfoModal(true)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-emerald-200 backdrop-blur-md transition-all hover:bg-white/15 cursor-pointer"
                                >
                                    <HelpCircle className="size-4 text-cyan-300" />
                                    <span>Rumus &amp; Metodologi</span>
                                </button>
                            </div>

                            {/* Value Pillars */}
                            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10 text-xs text-emerald-100/80">
                                <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 backdrop-blur-xs">
                                    <ShieldCheck className="size-3.5 text-emerald-300" />
                                    <span>Skor Maksimal: 100.0</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 backdrop-blur-xs">
                                    <Award className="size-3.5 text-amber-300" />
                                    <span>Target RENSTRA: {formatNumber(currentTargetRenstra, 1)}</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 backdrop-blur-xs">
                                    <Utensils className="size-3.5 text-teal-300" />
                                    <span>Standar AKE: 2.100 Kkal</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Hero Score Radar Glassmorphic Widget */}
                        <div className="lg:col-span-5 xl:col-span-5">
                            <div className="rounded-3xl border border-white/20 bg-white/10 p-5 sm:p-6 backdrop-blur-xl shadow-2xl ring-1 ring-white/10 space-y-4">
                                {/* Header Widget */}
                                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="size-4 text-emerald-300" />
                                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                                            Tahun Analisis
                                        </span>
                                    </div>

                                    {/* Year Selector */}
                                    <div className="w-32">
                                        <Select
                                            value={String(selectedYear)}
                                            onValueChange={(val) => handleYearChange(Number(val))}
                                        >
                                            <SelectTrigger className="h-8 rounded-xl bg-white/15 border-white/20 text-white font-bold text-xs backdrop-blur-md">
                                                <SelectValue placeholder="Pilih Tahun" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-200 bg-white/95 backdrop-blur-xl text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                                                {availableYears.map((yr) => (
                                                    <SelectItem key={yr} value={String(yr)} className="font-semibold text-xs">
                                                        Tahun {yr}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Main Big Score Card */}
                                <div className="rounded-2xl border border-white/15 bg-black/20 p-4 sm:p-5 backdrop-blur-md">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
                                            Skor PPH {selectedYear}
                                        </span>
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black border ${badgeMeta.badge}`}>
                                            <Sparkles className="size-3" />
                                            {statistics.status.split(' ')[0]}
                                        </span>
                                    </div>

                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                                            {formatNumber(currentYearScore)}
                                        </span>
                                        <span className="text-sm sm:text-base font-bold text-emerald-200/70">
                                            / 100.00
                                        </span>
                                    </div>

                                    {/* Visual Progress Bar to 100 */}
                                    <div className="mt-3 space-y-1">
                                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 transition-all duration-500 shadow-sm"
                                                style={{ width: `${Math.min(100, Math.max(0, currentYearScore))}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] font-semibold text-emerald-200/70">
                                            <span>0 (Rendah)</span>
                                            <span>Target RENSTRA: {formatNumber(currentTargetRenstra, 1)}</span>
                                            <span>100 (Ideal)</span>
                                        </div>
                                    </div>

                                    {/* Year-on-Year Growth comparison */}
                                    {statistics.prev_score !== null && (
                                        <div className="mt-3.5 flex items-center justify-between border-t border-white/10 pt-2.5 text-xs">
                                            <span className="text-emerald-100/80">
                                                Dibanding Tahun {statistics.prev_year}:
                                            </span>
                                            <span
                                                className={`font-mono font-bold flex items-center gap-1 ${
                                                    statistics.diff_score >= 0 ? 'text-emerald-300' : 'text-rose-300'
                                                }`}
                                            >
                                                {statistics.diff_score >= 0 ? (
                                                    <TrendingUp className="size-3.5" />
                                                ) : (
                                                    <TrendingDown className="size-3.5" />
                                                )}
                                                {statistics.diff_score >= 0 ? '+' : ''}
                                                {formatNumber(statistics.diff_score)} poin ({statistics.diff_score >= 0 ? '+' : ''}
                                                {formatNumber(statistics.diff_percentage, 1)}%)
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Mini Stats Grid */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-xs">
                                        <span className="block text-[10px] font-semibold text-emerald-200/70 uppercase">
                                            Total Energi
                                        </span>
                                        <span className="text-base font-black font-mono text-white">
                                            {formatNumber(totals.total_energi, 1)}
                                        </span>
                                        <span className="block text-[9px] text-emerald-200/60">Kkal/kapita/hari</span>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-xs">
                                        <span className="block text-[10px] font-semibold text-emerald-200/70 uppercase">
                                            Capaian % AKE
                                        </span>
                                        <span className="text-base font-black font-mono text-white">
                                            {formatNumber(totals.total_ake, 1)}%
                                        </span>
                                        <span className="block text-[9px] text-emerald-200/60">dari target 2.100 Kkal</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. GRAFIK SKOR PPH ANTAR TAHUN */}
                <section id="grafik-pph" className="scroll-mt-24 space-y-4">
                    <Card className="rounded-3xl border-slate-200/80 bg-white shadow-xl shadow-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                        <CardHeader className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-[#006565] dark:bg-emerald-950 dark:text-emerald-400">
                                            <TrendingUp className="size-4.5" />
                                        </div>
                                        <CardTitle className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                                            Grafik Perkembangan Skor PPH Antar Tahun
                                        </CardTitle>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                        Tren capaian mutu konsumsi pangan penduduk Kabupaten Indramayu antar periode tahunan terhadap Target RENSTRA dan Skor Ideal (100.0).
                                    </p>
                                </div>

                                {/* Chart Display Mode Switcher */}
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
                                        <BarChart2 className="size-3.5" />
                                        <span>Batang</span>
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
                                        <LineChartIcon className="size-3.5" />
                                        <span>Garis</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setChartMode('area')}
                                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                                            chartMode === 'area'
                                                ? 'bg-white text-[#006565] shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                        }`}
                                    >
                                        <Activity className="size-3.5" />
                                        <span>Area</span>
                                    </button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-4 sm:p-6 space-y-6">
                            {/* Recharts Chart Container */}
                            <div className="h-80 sm:h-96 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartMode === 'composed' ? (
                                        <ComposedChart
                                            data={yearlyScores}
                                            margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                                        >
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#059669" stopOpacity={0.9} />
                                                    <stop offset="100%" stopColor="#006565" stopOpacity={0.7} />
                                                </linearGradient>
                                                <linearGradient id="barActiveGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                                    <stop offset="100%" stopColor="#047857" stopOpacity={0.95} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                                            <XAxis
                                                dataKey="tahun"
                                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                                tickLine={false}
                                                axisLine={{ stroke: '#cbd5e1' }}
                                            />
                                            <YAxis
                                                domain={[60, 105]}
                                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(v) => `${v}`}
                                            />
                                            <Tooltip content={<CustomYearTooltip />} />
                                            <Legend
                                                verticalAlign="top"
                                                height={36}
                                                formatter={(val) => <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{val}</span>}
                                            />
                                            <ReferenceLine
                                                y={100}
                                                stroke="#10b981"
                                                strokeDasharray="4 4"
                                                strokeWidth={1.5}
                                                label={{
                                                    value: 'Ideal (100.0)',
                                                    position: 'insideTopRight',
                                                    fill: '#059669',
                                                    fontSize: 11,
                                                    fontWeight: 'bold',
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="target_renstra"
                                                name="Target RENSTRA"
                                                stroke="#f59e0b"
                                                strokeDasharray="4 4"
                                                strokeWidth={2}
                                                dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1.5 }}
                                                activeDot={{ r: 6 }}
                                            />
                                            <Bar
                                                dataKey="skor_pph"
                                                name="Skor PPH Indramayu"
                                                radius={[10, 10, 0, 0]}
                                                maxBarSize={56}
                                                onClick={(entry: any) => {
                                                    if (entry && entry.tahun) {
                                                        handleYearChange(Number(entry.tahun));
                                                    }
                                                }}
                                            >
                                                {yearlyScores.map((entry) => (
                                                    <Cell
                                                        key={`cell-${entry.tahun}`}
                                                        fill={entry.tahun === selectedYear ? 'url(#barActiveGradient)' : 'url(#barGradient)'}
                                                        stroke={entry.tahun === selectedYear ? '#059669' : 'transparent'}
                                                        strokeWidth={entry.tahun === selectedYear ? 2 : 0}
                                                    />
                                                ))}
                                            </Bar>
                                            <Line
                                                type="monotone"
                                                dataKey="skor_pph"
                                                name="Garis Tren"
                                                stroke="#0f766e"
                                                strokeWidth={2.5}
                                                dot={{ r: 5, fill: '#0f766e', stroke: '#fff', strokeWidth: 2 }}
                                                activeDot={{ r: 7 }}
                                            />
                                        </ComposedChart>
                                    ) : chartMode === 'line' ? (
                                        <ComposedChart
                                            data={yearlyScores}
                                            margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                                            <XAxis
                                                dataKey="tahun"
                                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                domain={[60, 105]}
                                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Tooltip content={<CustomYearTooltip />} />
                                            <Legend
                                                verticalAlign="top"
                                                height={36}
                                                formatter={(val) => <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{val}</span>}
                                            />
                                            <ReferenceLine y={100} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Ideal (100.0)', position: 'insideTopRight', fill: '#059669', fontSize: 11, fontWeight: 'bold' }} />
                                            <Line
                                                type="monotone"
                                                dataKey="target_renstra"
                                                name="Target RENSTRA"
                                                stroke="#f59e0b"
                                                strokeDasharray="4 4"
                                                strokeWidth={2}
                                                dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1.5 }}
                                                activeDot={{ r: 6 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="skor_pph"
                                                name="Skor PPH Indramayu"
                                                stroke="#006565"
                                                strokeWidth={3.5}
                                                dot={{ r: 6, fill: '#006565', stroke: '#fff', strokeWidth: 2 }}
                                                activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 3 }}
                                            />
                                        </ComposedChart>
                                    ) : (
                                        <AreaChart
                                            data={yearlyScores}
                                            margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                                        >
                                            <defs>
                                                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                                                    <stop offset="100%" stopColor="#006565" stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                                            <XAxis
                                                dataKey="tahun"
                                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                domain={[60, 105]}
                                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Tooltip content={<CustomYearTooltip />} />
                                            <Legend
                                                verticalAlign="top"
                                                height={36}
                                                formatter={(val) => <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{val}</span>}
                                            />
                                            <ReferenceLine y={100} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Ideal (100.0)', position: 'insideTopRight', fill: '#059669', fontSize: 11, fontWeight: 'bold' }} />
                                            <Line
                                                type="monotone"
                                                dataKey="target_renstra"
                                                name="Target RENSTRA"
                                                stroke="#f59e0b"
                                                strokeDasharray="4 4"
                                                strokeWidth={2}
                                                dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1.5 }}
                                                activeDot={{ r: 6 }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="skor_pph"
                                                name="Skor PPH Indramayu"
                                                stroke="#006565"
                                                strokeWidth={3}
                                                fill="url(#areaGradient)"
                                                dot={{ r: 5, fill: '#006565', stroke: '#fff', strokeWidth: 2 }}
                                            />
                                        </AreaChart>
                                    )}
                                </ResponsiveContainer>
                            </div>

                            {/* Year Cards Quick Comparison Bar */}
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 pt-2">
                                {yearlyScores.map((y) => {
                                    const isSelected = y.tahun === selectedYear;
                                    const yMeta = getScoreBadgeColor(y.skor_pph);
                                    const isGrow = y.diff_previous >= 0;

                                    return (
                                        <button
                                            key={y.tahun}
                                            type="button"
                                            onClick={() => handleYearChange(y.tahun)}
                                            className={`rounded-2xl p-3 text-left transition-all border cursor-pointer ${
                                                isSelected
                                                    ? 'bg-emerald-50/80 border-[#006565] ring-2 ring-[#006565]/20 shadow-md dark:bg-emerald-950/40 dark:border-emerald-500'
                                                    : 'bg-slate-50 border-slate-200/80 hover:bg-white hover:border-slate-300 dark:bg-slate-800/60 dark:border-slate-800 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                                    Tahun {y.tahun}
                                                </span>
                                                {isSelected && (
                                                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                                )}
                                            </div>

                                            <div className="mt-1 flex items-baseline justify-between">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="font-mono text-xl font-black text-slate-900 dark:text-white">
                                                        {formatNumber(y.skor_pph)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-semibold">/100</span>
                                                </div>
                                                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold" title="Target RENSTRA">
                                                    Renstra {formatNumber(y.target_renstra ?? 94.0, 1)}
                                                </span>
                                            </div>

                                            <div className="mt-1 flex items-center justify-between">
                                                <span className={`text-[10px] font-bold ${yMeta.text}`}>
                                                    {y.status}
                                                </span>
                                                {y.diff_previous !== 0 && (
                                                    <span
                                                        className={`text-[10px] font-mono font-bold ${
                                                            isGrow ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                                        }`}
                                                    >
                                                        {isGrow ? '+' : ''}
                                                        {formatNumber(y.diff_previous, 1)}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* 3. TABEL KOMODITAS SKOR PPH */}
                <section id="tabel-komoditas" className="scroll-mt-24 space-y-4">
                    <Card className="rounded-3xl border-slate-200/80 bg-white shadow-xl shadow-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                        <CardHeader className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-8 items-center justify-center rounded-xl bg-teal-50 text-[#006565] dark:bg-teal-950 dark:text-teal-400">
                                            <Utensils className="size-4.5" />
                                        </div>
                                        <CardTitle className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                                            Tabel Rincian Skor PPH 9 Kelompok Bahan Pangan
                                        </CardTitle>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                        Rincian konsumsi energi, persentase AKE, bobot, skor riil, dan skor akhir per kelompok pangan untuk Tahun{' '}
                                        <strong className="text-slate-800 dark:text-slate-200">{selectedYear}</strong>.
                                    </p>
                                </div>

                                {/* Controls: Year Selector, Compare Selector, Quick Toggle, Search, Export buttons */}
                                <div className="flex flex-wrap items-center gap-2.5">
                                    {/* Primary Year Selector */}
                                    <div className="w-32">
                                        <Select
                                            value={String(selectedYear)}
                                            onValueChange={(val) => handleYearChange(Number(val))}
                                        >
                                            <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-slate-50 text-xs font-bold dark:border-slate-700 dark:bg-slate-800">
                                                <SelectValue placeholder="Pilih Tahun" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                                                {availableYears.map((yr) => (
                                                    <SelectItem key={yr} value={String(yr)} className="text-xs font-semibold">
                                                        Tahun {yr}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Compare Year Selector */}
                                    <div className="w-44">
                                        <Select
                                            value={compareYear ? String(compareYear) : 'none'}
                                            onValueChange={(val) => setCompareYear(val === 'none' ? null : Number(val))}
                                        >
                                            <SelectTrigger className={`h-9 rounded-xl text-xs font-bold border transition-colors ${
                                                compareYear
                                                    ? 'border-[#006565] bg-emerald-50/70 text-[#006565] dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                            }`}>
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <Scale className="size-3.5 shrink-0" />
                                                    <span>{compareYear ? `Vs Tahun ${compareYear}` : 'Bandingkan Tahun'}</span>
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                                                <SelectItem value="none" className="text-xs font-semibold text-slate-500">
                                                    -- Tanpa Pembanding --
                                                </SelectItem>
                                                {availableYears
                                                    .filter((yr) => yr !== selectedYear)
                                                    .map((yr) => (
                                                        <SelectItem key={yr} value={String(yr)} className="text-xs font-semibold">
                                                            Bandingkan vs {yr}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Quick Comparison Toggle Button (Vs Previous Year) */}
                                    {statistics.prev_year && statistics.prev_year !== selectedYear && (
                                        <Button
                                            type="button"
                                            variant={compareYear === statistics.prev_year ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() =>
                                                setCompareYear(
                                                    compareYear === statistics.prev_year ? null : statistics.prev_year
                                                )
                                            }
                                            className={`h-9 rounded-xl text-xs font-bold transition-all ${
                                                compareYear === statistics.prev_year
                                                    ? 'bg-[#006565] text-white hover:bg-[#005252] shadow-xs'
                                                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                                            }`}
                                            title={
                                                compareYear === statistics.prev_year
                                                    ? 'Batalkan perbandingan'
                                                    : `Bandingkan cepat dengan tahun ${statistics.prev_year}`
                                            }
                                        >
                                            <Scale className="size-3.5 mr-1" />
                                            <span>Vs {statistics.prev_year}</span>
                                            {compareYear === statistics.prev_year && <X className="size-3 ml-1 opacity-80" />}
                                        </Button>
                                    )}

                                    {/* Search Input */}
                                    <div className="relative w-44 sm:w-52">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                                        <Input
                                            type="text"
                                            placeholder="Cari komoditas..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="h-9 rounded-xl pl-9 text-xs border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                                        />
                                    </div>

                                    {/* Export CSV / Excel */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleExportCsv}
                                        className="h-9 rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        <FileSpreadsheet className="size-3.5 text-emerald-600 mr-1.5" />
                                        <span>Excel</span>
                                    </Button>

                                    {/* Print / PDF */}
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handlePrintPdf}
                                        className="h-9 rounded-xl bg-[#006565] text-white hover:bg-[#005252] text-xs font-bold shadow-xs"
                                    >
                                        <Printer className="size-3.5 mr-1.5" />
                                        <span>Cetak PDF</span>
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {/* Comparison Active Banner */}
                            {compareYear && compTotals && compCommodities && comparisonSummary && (
                                <div className="mx-5 my-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border border-teal-200/90 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-amber-950/20 dark:border-teal-800/60 shadow-xs">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex size-9 items-center justify-center rounded-xl bg-[#006565] text-white shadow-xs">
                                                <Scale className="size-4.5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                                        Mode Komparasi: Tahun {selectedYear} vs Tahun {compareYear}
                                                    </span>
                                                    <Badge className="bg-[#006565] text-white text-[10px] py-0 px-2 font-bold">
                                                        Perbandingan Aktif
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                                    Analisis perbedaan konsumsi energi, capaian % AKE, dan skor mutu pangan antar tahun.
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCompareYear(null)}
                                            className="h-8 px-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/80 dark:text-slate-300 dark:hover:bg-slate-800 self-start sm:self-auto rounded-xl"
                                        >
                                            <X className="size-3.5 mr-1" />
                                            <span>Tutup Komparasi</span>
                                        </Button>
                                    </div>

                                    {/* Quick Comparison Highlights */}
                                    <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-teal-200/60 dark:border-teal-800/40">
                                        {/* Diff Skor */}
                                        <div className="rounded-xl bg-white/90 p-2.5 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                                Selisih Skor PPH
                                            </span>
                                            <div className="mt-1 flex items-baseline gap-1.5">
                                                <span
                                                    className={`font-mono text-base font-black ${
                                                        comparisonSummary.diffScore >= 0
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-rose-600 dark:text-rose-400'
                                                    }`}
                                                >
                                                    {comparisonSummary.diffScore >= 0 ? '+' : ''}
                                                    {formatNumber(comparisonSummary.diffScore)}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-semibold">poin</span>
                                            </div>
                                        </div>

                                        {/* Diff Energi */}
                                        <div className="rounded-xl bg-white/90 p-2.5 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                                Selisih Energi
                                            </span>
                                            <div className="mt-1 flex items-baseline gap-1.5">
                                                <span
                                                    className={`font-mono text-base font-black ${
                                                        comparisonSummary.diffEnergi >= 0
                                                            ? 'text-teal-600 dark:text-teal-400'
                                                            : 'text-rose-600 dark:text-rose-400'
                                                    }`}
                                                >
                                                    {comparisonSummary.diffEnergi >= 0 ? '+' : ''}
                                                    {formatNumber(comparisonSummary.diffEnergi, 1)}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-semibold">Kkal</span>
                                            </div>
                                        </div>

                                        {/* Kelompok Naik */}
                                        <div className="rounded-xl bg-white/90 p-2.5 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                                Kelompok Naik
                                            </span>
                                            <div className="mt-1 flex items-center gap-1.5">
                                                <TrendingUp className="size-4 text-emerald-600" />
                                                <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                                                    {comparisonSummary.increased}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-semibold">kelompok</span>
                                            </div>
                                        </div>

                                        {/* Kelompok Turun & Stabil */}
                                        <div className="rounded-xl bg-white/90 p-2.5 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                                Turun / Tetap
                                            </span>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className="flex items-center gap-1 font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                                                    <TrendingDown className="size-3.5" />
                                                    {comparisonSummary.decreased} Turun
                                                </span>
                                                <span className="text-slate-300 dark:text-slate-700">|</span>
                                                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    {comparisonSummary.stable} Tetap
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* The Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                                    {compareYear && compCommodities && compTotals ? (
                                        /* 2-LEVEL COMPARATIVE THEAD */
                                        <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
                                            <tr>
                                                <th rowSpan={2} className="py-3 pl-5 pr-2 w-10 text-center border-r border-slate-200/80 dark:border-slate-700">
                                                    No
                                                </th>
                                                <th rowSpan={2} className="py-3 px-3 min-w-[200px] border-r border-slate-200/80 dark:border-slate-700">
                                                    Kelompok Bahan Pangan
                                                </th>
                                                <th colSpan={3} className="py-2 px-2 text-center border-r border-slate-200/80 bg-emerald-50/70 text-[#006565] dark:border-slate-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                    Konsumsi Energi (Kkal)
                                                </th>
                                                <th colSpan={3} className="py-2 px-2 text-center border-r border-slate-200/80 bg-teal-50/70 text-teal-800 dark:border-slate-700 dark:bg-teal-950/40 dark:text-teal-300">
                                                    % AKE
                                                </th>
                                                <th rowSpan={2} className="py-3 px-2 text-center w-12 border-r border-slate-200/80 dark:border-slate-700">
                                                    Bobot
                                                </th>
                                                <th colSpan={3} className="py-2 px-2 text-center border-r border-slate-200/80 bg-amber-50/70 text-amber-800 dark:border-slate-700 dark:bg-amber-950/40 dark:text-amber-300">
                                                    Skor PPH
                                                </th>
                                                <th rowSpan={2} className="py-3 pr-5 pl-3 text-center min-w-[130px]">
                                                    Status Tren
                                                </th>
                                            </tr>
                                            <tr className="border-t border-slate-200/80 text-[10px] dark:border-slate-700">
                                                {/* Energi sub-headers */}
                                                <th className="py-1.5 px-2 text-right bg-emerald-50/40 text-slate-600 dark:bg-emerald-950/20 dark:text-slate-400">
                                                    {compareYear}
                                                </th>
                                                <th className="py-1.5 px-2 text-right bg-emerald-50/70 font-black text-[#006565] dark:bg-emerald-950/50 dark:text-emerald-300">
                                                    {selectedYear}
                                                </th>
                                                <th className="py-1.5 px-2 text-right border-r border-slate-200/80 dark:border-slate-700 font-bold">
                                                    Δ Selisih
                                                </th>

                                                {/* % AKE sub-headers */}
                                                <th className="py-1.5 px-2 text-right bg-teal-50/40 text-slate-600 dark:bg-teal-950/20 dark:text-slate-400">
                                                    {compareYear}
                                                </th>
                                                <th className="py-1.5 px-2 text-right bg-teal-50/70 font-black text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                                                    {selectedYear}
                                                </th>
                                                <th className="py-1.5 px-2 text-right border-r border-slate-200/80 dark:border-slate-700 font-bold">
                                                    Δ Selisih
                                                </th>

                                                {/* Skor PPH sub-headers */}
                                                <th className="py-1.5 px-2 text-right bg-amber-50/40 text-slate-600 dark:bg-amber-950/20 dark:text-slate-400">
                                                    {compareYear}
                                                </th>
                                                <th className="py-1.5 px-2 text-right bg-amber-50/70 font-black text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                                                    {selectedYear}
                                                </th>
                                                <th className="py-1.5 px-2 text-right border-r border-slate-200/80 dark:border-slate-700 font-black text-[#006565] dark:text-emerald-400">
                                                    Δ Skor
                                                </th>
                                            </tr>
                                        </thead>
                                    ) : (
                                        /* STANDARD SINGLE YEAR THEAD */
                                        <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                                            <tr>
                                                <th className="py-3.5 pl-5 pr-2 w-12 text-center">No</th>
                                                <th className="py-3.5 px-3 min-w-[220px]">Kelompok Bahan Pangan</th>
                                                <th className="py-3.5 px-3 text-right">Energi (Kkal)</th>
                                                <th className="py-3.5 px-3 text-right">% AKE</th>
                                                <th className="py-3.5 px-3 text-center">Bobot</th>
                                                <th className="py-3.5 px-3 text-right">Skor Riil</th>
                                                <th className="py-3.5 px-3 text-right">Skor Maks</th>
                                                <th className="py-3.5 px-3 text-right font-black text-[#006565] dark:text-emerald-400">
                                                    Skor PPH
                                                </th>
                                                <th className="py-3.5 px-3 text-center min-w-[130px]">% Capaian</th>
                                                <th className="py-3.5 pr-5 pl-3 min-w-[180px]">Keterangan</th>
                                            </tr>
                                        </thead>
                                    )}

                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                        {filteredCommodities.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={compareYear && compCommodities ? 12 : 10}
                                                    className="py-12 text-center text-slate-400"
                                                >
                                                    Tidak ada data kelompok pangan yang sesuai pencarian "{searchTerm}".
                                                </td>
                                            </tr>
                                        ) : compareYear && compCommodities && compTotals ? (
                                            /* COMPARATIVE TABLE ROWS */
                                            filteredCommodities.map((item, idx) => {
                                                const prev = compMap.get(item.pph_food_group_id);
                                                const prevE = prev?.energi ?? 0;
                                                const currE = item.energi;
                                                const diffE = Number((currE - prevE).toFixed(1));

                                                const prevA = prev?.ake_percentage ?? 0;
                                                const currA = item.ake_percentage;
                                                const diffA = Number((currA - prevA).toFixed(2));

                                                const prevS = prev?.skor_pph ?? 0;
                                                const currS = item.skor_pph;
                                                const diffS = Number((currS - prevS).toFixed(2));

                                                const isUp = diffS > 0.01;
                                                const isDown = diffS < -0.01;
                                                const isMax = currS >= item.skor_maksimal && item.skor_maksimal > 0;

                                                return (
                                                    <tr
                                                        key={item.pph_food_group_id}
                                                        className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/50"
                                                    >
                                                        {/* No */}
                                                        <td className="py-3 pl-5 pr-2 text-center font-bold text-slate-400 border-r border-slate-100 dark:border-slate-800">
                                                            {idx + 1}
                                                        </td>

                                                        {/* Kelompok Bahan Pangan */}
                                                        <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800">
                                                            <div className="font-extrabold text-slate-900 text-xs sm:text-sm dark:text-white">
                                                                {item.food_group_name}
                                                            </div>
                                                            {item.food_group_description && (
                                                                <div className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-1 dark:text-slate-400">
                                                                    {item.food_group_description}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Energi compareYear */}
                                                        <td className="py-3 px-2 text-right font-mono text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-900/30">
                                                            {formatNumber(prevE, 1)}
                                                        </td>

                                                        {/* Energi selectedYear */}
                                                        <td className="py-3 px-2 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                                                            {formatNumber(currE, 1)}
                                                        </td>

                                                        {/* Diff Energi */}
                                                        <td
                                                            className={`py-3 px-2 text-right font-mono text-xs font-bold border-r border-slate-100 dark:border-slate-800 ${
                                                                diffE > 0
                                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                                    : diffE < 0
                                                                    ? 'text-rose-600 dark:text-rose-400'
                                                                    : 'text-slate-400'
                                                            }`}
                                                        >
                                                            {diffE > 0 ? '+' : ''}
                                                            {formatNumber(diffE, 1)}
                                                        </td>

                                                        {/* % AKE compareYear */}
                                                        <td className="py-3 px-2 text-right font-mono text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-900/30">
                                                            {formatNumber(prevA, 2)}%
                                                        </td>

                                                        {/* % AKE selectedYear */}
                                                        <td className="py-3 px-2 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                                                            {formatNumber(currA, 2)}%
                                                        </td>

                                                        {/* Diff % AKE */}
                                                        <td
                                                            className={`py-3 px-2 text-right font-mono text-xs font-bold border-r border-slate-100 dark:border-slate-800 ${
                                                                diffA > 0
                                                                    ? 'text-teal-600 dark:text-teal-400'
                                                                    : diffA < 0
                                                                    ? 'text-rose-600 dark:text-rose-400'
                                                                    : 'text-slate-400'
                                                            }`}
                                                        >
                                                            {diffA > 0 ? '+' : ''}
                                                            {formatNumber(diffA, 2)}%
                                                        </td>

                                                        {/* Bobot */}
                                                        <td className="py-3 px-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                                                            {formatNumber(item.bobot, 1)}
                                                        </td>

                                                        {/* Skor PPH compareYear */}
                                                        <td className="py-3 px-2 text-right font-mono text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-900/30">
                                                            {formatNumber(prevS)}
                                                        </td>

                                                        {/* Skor PPH selectedYear */}
                                                        <td className="py-3 px-2 text-right font-mono font-black text-[#006565] dark:text-emerald-400">
                                                            {formatNumber(currS)}
                                                        </td>

                                                        {/* Diff Skor PPH */}
                                                        <td className="py-3 px-2 text-right border-r border-slate-100 dark:border-slate-800">
                                                            <span
                                                                className={`inline-flex items-center gap-0.5 font-mono text-xs font-black px-1.5 py-0.5 rounded-md ${
                                                                    isUp
                                                                        ? 'text-emerald-700 bg-emerald-100/80 dark:bg-emerald-950 dark:text-emerald-300'
                                                                        : isDown
                                                                        ? 'text-rose-700 bg-rose-100/80 dark:bg-rose-950 dark:text-rose-300'
                                                                        : 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
                                                                }`}
                                                            >
                                                                {isUp ? '+' : ''}
                                                                {formatNumber(diffS)}
                                                            </span>
                                                        </td>

                                                        {/* Status Tren Badge */}
                                                        <td className="py-3 pr-5 pl-3 text-center">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span
                                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                                        isUp
                                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                                            : isDown
                                                                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                                    }`}
                                                                >
                                                                    {isUp ? (
                                                                        <>
                                                                            <TrendingUp className="size-3" />
                                                                            <span>Meningkat</span>
                                                                        </>
                                                                    ) : isDown ? (
                                                                        <>
                                                                            <TrendingDown className="size-3" />
                                                                            <span>Menurun</span>
                                                                        </>
                                                                    ) : (
                                                                        <span>Stabil</span>
                                                                    )}
                                                                </span>
                                                                {isMax && (
                                                                    <span className="text-[9px] font-bold text-emerald-600">
                                                                        ✓ Skor Maks
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            /* STANDARD SINGLE YEAR ROWS */
                                            filteredCommodities.map((item, idx) => {
                                                const isMaxAchieved = item.skor_pph >= item.skor_maksimal && item.skor_maksimal > 0;
                                                const capaianPercent = item.capaian_percentage;

                                                return (
                                                    <tr
                                                        key={item.pph_food_group_id}
                                                        className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/50"
                                                    >
                                                        {/* No */}
                                                        <td className="py-3 pl-5 pr-2 text-center font-bold text-slate-400">
                                                            {idx + 1}
                                                        </td>

                                                        {/* Kelompok Bahan Pangan */}
                                                        <td className="py-3 px-3">
                                                            <div className="font-extrabold text-slate-900 text-xs sm:text-sm dark:text-white">
                                                                {item.food_group_name}
                                                            </div>
                                                            {item.food_group_description && (
                                                                <div className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-1 dark:text-slate-400">
                                                                    {item.food_group_description}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Energi (Kkal) */}
                                                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                                                            {item.is_recorded ? formatNumber(item.energi, 1) : '-'}
                                                        </td>

                                                        {/* % AKE */}
                                                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                                                            {item.is_recorded ? `${formatNumber(item.ake_percentage, 2)}%` : '-'}
                                                        </td>

                                                        {/* Bobot */}
                                                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                                                            {formatNumber(item.bobot, 1)}
                                                        </td>

                                                        {/* Skor Riil */}
                                                        <td className="py-3 px-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                                                            {item.is_recorded ? formatNumber(item.skor_riil) : '-'}
                                                        </td>

                                                        {/* Skor Maksimal */}
                                                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                                                            {formatNumber(item.skor_maksimal)}
                                                        </td>

                                                        {/* Skor PPH (Hasil Akhir) */}
                                                        <td className="py-3 px-3 text-right font-mono font-black text-sm text-[#006565] dark:text-emerald-400">
                                                            {item.is_recorded ? formatNumber(item.skor_pph) : '-'}
                                                        </td>

                                                        {/* % Capaian Progress Bar */}
                                                        <td className="py-3 px-3 text-center">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center justify-between text-[10px] font-bold">
                                                                    <span
                                                                        className={
                                                                            isMaxAchieved
                                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                                : 'text-amber-600 dark:text-amber-400'
                                                                        }
                                                                    >
                                                                        {formatNumber(capaianPercent, 1)}%
                                                                    </span>
                                                                    {isMaxAchieved && (
                                                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
                                                                            Maks
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                                                                    <div
                                                                        className={`h-full rounded-full ${
                                                                            isMaxAchieved ? 'bg-emerald-500' : 'bg-amber-500'
                                                                        }`}
                                                                        style={{ width: `${Math.min(100, Math.max(0, capaianPercent))}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Keterangan */}
                                                        <td className="py-3 pr-5 pl-3 text-[11px] text-slate-500 dark:text-slate-400">
                                                            {item.keterangan || (
                                                                <span className="text-slate-400 italic">
                                                                    {isMaxAchieved ? 'Capaian optimal' : 'Potensi ditingkatkan'}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>

                                    {/* Table Total Summary Footer */}
                                    {compareYear && compCommodities && compTotals ? (
                                        /* COMPARATIVE TFOOT */
                                        <tfoot className="border-t-2 border-[#006565] bg-emerald-50/80 font-bold text-slate-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-white">
                                            <tr>
                                                <td colSpan={2} className="py-4 pl-5 pr-3 text-left border-r border-emerald-200/60 dark:border-emerald-800/60">
                                                    <div className="text-xs uppercase tracking-wider text-[#006565] dark:text-emerald-400">
                                                        TOTAL KOMPARASI {selectedYear} VS {compareYear}
                                                    </div>
                                                    <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                                                        Kabupaten Indramayu (9 Kelompok Komoditas)
                                                    </div>
                                                </td>
                                                {/* Tot Energi */}
                                                <td className="py-4 px-2 text-right font-mono text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                                    {formatNumber(compTotals.total_energi, 1)}
                                                </td>
                                                <td className="py-4 px-2 text-right font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                                                    {formatNumber(totals.total_energi, 1)}
                                                </td>
                                                <td className="py-4 px-2 text-right font-mono font-black text-xs border-r border-emerald-200/60 dark:border-emerald-800/60">
                                                    <span
                                                        className={
                                                            totals.total_energi >= compTotals.total_energi
                                                                ? 'text-emerald-700 dark:text-emerald-300'
                                                                : 'text-rose-700 dark:text-rose-300'
                                                        }
                                                    >
                                                        {totals.total_energi >= compTotals.total_energi ? '+' : ''}
                                                        {formatNumber(totals.total_energi - compTotals.total_energi, 1)}
                                                    </span>
                                                </td>

                                                {/* Tot % AKE */}
                                                <td className="py-4 px-2 text-right font-mono text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                                    {formatNumber(compTotals.total_ake, 2)}%
                                                </td>
                                                <td className="py-4 px-2 text-right font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                                                    {formatNumber(totals.total_ake, 2)}%
                                                </td>
                                                <td className="py-4 px-2 text-right font-mono font-black text-xs border-r border-emerald-200/60 dark:border-emerald-800/60">
                                                    <span
                                                        className={
                                                            totals.total_ake >= compTotals.total_ake
                                                                ? 'text-teal-700 dark:text-teal-300'
                                                                : 'text-rose-700 dark:text-rose-300'
                                                        }
                                                    >
                                                        {totals.total_ake >= compTotals.total_ake ? '+' : ''}
                                                        {formatNumber(totals.total_ake - compTotals.total_ake, 2)}%
                                                    </span>
                                                </td>

                                                {/* Tot Bobot */}
                                                <td className="py-4 px-2 text-center font-mono font-black text-xs sm:text-sm border-r border-emerald-200/60 dark:border-emerald-800/60">
                                                    {formatNumber(totals.total_bobot, 1)}
                                                </td>

                                                {/* Tot Skor PPH */}
                                                <td className="py-4 px-2 text-right font-mono text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                                    {formatNumber(compTotals.total_skor_pph)}
                                                </td>
                                                <td className="py-4 px-2 text-right font-mono font-black text-sm sm:text-base text-[#006565] dark:text-emerald-400">
                                                    {formatNumber(totals.total_skor_pph)}
                                                </td>
                                                <td className="py-4 px-2 text-right border-r border-emerald-200/60 dark:border-emerald-800/60">
                                                    <span
                                                        className={`inline-flex items-center gap-1 font-mono text-xs font-black px-2 py-0.5 rounded-lg ${
                                                            totals.total_skor_pph >= compTotals.total_skor_pph
                                                                ? 'bg-emerald-600 text-white'
                                                                : 'bg-rose-600 text-white'
                                                        }`}
                                                    >
                                                        {totals.total_skor_pph >= compTotals.total_skor_pph ? '+' : ''}
                                                        {formatNumber(totals.total_skor_pph - compTotals.total_skor_pph)}
                                                    </span>
                                                </td>

                                                {/* Tot Status Komparasi */}
                                                <td className="py-4 pr-5 pl-3 text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black border ${
                                                            totals.total_skor_pph >= compTotals.total_skor_pph
                                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                                                                : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                                                        }`}
                                                    >
                                                        {totals.total_skor_pph >= compTotals.total_skor_pph
                                                            ? '▲ Skor Meningkat'
                                                            : '▼ Skor Menurun'}
                                                    </span>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    ) : (
                                        /* STANDARD SINGLE YEAR TFOOT */
                                        <tfoot className="border-t-2 border-[#006565] bg-emerald-50/60 font-bold text-slate-900 dark:border-emerald-500 dark:bg-emerald-950/30 dark:text-white">
                                            <tr>
                                                <td colSpan={2} className="py-4 pl-5 pr-3 text-left">
                                                    <div className="text-xs uppercase tracking-wider text-[#006565] dark:text-emerald-400">
                                                        TOTAL POLA PANGAN HARAPAN {selectedYear}
                                                    </div>
                                                    <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                                                        Kabupaten Indramayu (9 Kelompok Komoditas)
                                                    </div>
                                                </td>
                                                <td className="py-4 px-3 text-right font-mono font-black text-xs sm:text-sm">
                                                    {formatNumber(totals.total_energi, 1)}
                                                </td>
                                                <td className="py-4 px-3 text-right font-mono font-black text-xs sm:text-sm">
                                                    {formatNumber(totals.total_ake, 2)}%
                                                </td>
                                                <td className="py-4 px-3 text-center font-mono font-black text-xs sm:text-sm">
                                                    {formatNumber(totals.total_bobot, 1)}
                                                </td>
                                                <td className="py-4 px-3 text-right font-mono font-black text-xs sm:text-sm">
                                                    {formatNumber(totals.total_skor_riil)}
                                                </td>
                                                <td className="py-4 px-3 text-right font-mono font-black text-xs sm:text-sm">
                                                    {formatNumber(totals.total_skor_maksimal)}
                                                </td>
                                                <td className="py-4 px-3 text-right font-mono font-black text-base sm:text-lg text-[#006565] dark:text-emerald-400">
                                                    <div className="inline-flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1 shadow-xs border border-emerald-300 dark:bg-slate-900 dark:border-emerald-700">
                                                        <span>{formatNumber(totals.total_skor_pph)}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-3 text-center font-mono font-black text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
                                                    {formatNumber(totals.total_skor_maksimal > 0 ? (totals.total_skor_pph / totals.total_skor_maksimal) * 100 : 0, 1)}%
                                                </td>
                                                <td className="py-4 pr-5 pl-3">
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black border ${badgeMeta.badge}`}>
                                                        {statistics.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* 4. ANALYTICAL INSIGHTS & METHODOLOGY PILLARS */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Card 1: Mutu Gizi Pangan */}
                    <Card className="rounded-3xl border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex size-9 items-center justify-center rounded-2xl bg-emerald-50 text-[#006565] dark:bg-emerald-950 dark:text-emerald-400">
                                <Award className="size-5" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                    Capaian Mutu Pangan
                                </h3>
                                <p className="text-[11px] text-slate-500">Klasifikasi Skor {selectedYear}</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed dark:text-slate-400">
                            Dengan skor <strong className="text-[#006565] dark:text-emerald-400">{formatNumber(currentYearScore)}</strong>, mutu konsumsi pangan penduduk Kabupaten Indramayu berada pada kategori <strong>{badgeMeta.label}</strong>
                            {currentYearScore >= currentTargetRenstra ? (
                                <>, berhasil melampaui Target RENSTRA ({formatNumber(currentTargetRenstra)}).</>
                            ) : (
                                <>, menuju capaian Target RENSTRA ({formatNumber(currentTargetRenstra)}).</>
                            )}
                        </p>
                    </Card>

                    {/* Card 2: Kelompok Capaian Maksimal */}
                    <Card className="rounded-3xl border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex size-9 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                                <CheckCircle2 className="size-5" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                    Diversifikasi Kelompok
                                </h3>
                                <p className="text-[11px] text-slate-500">Kelompok Optimal</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed dark:text-slate-400">
                            Sebanyak <strong className="text-teal-700 dark:text-teal-300">{statistics.achieved_count} dari {statistics.total_groups} kelompok bahan pangan</strong> telah mencapai skor maksimal standar. Konsumsi padi-padian, pangan hewani, dan kacang-kacangan menjadi kontributor gizi terkuat.
                        </p>
                    </Card>

                    {/* Card 3: Rekomendasi B2SA */}
                    <Card className="rounded-3xl border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex size-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                                <Wheat className="size-5" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                    Promosi Pangan B2SA
                                </h3>
                                <p className="text-[11px] text-slate-500">Rekomendasi DKPP</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed dark:text-slate-400">
                            Peningkatan konsumsi sayuran, buah-buahan lokal khas Indramayu (mangga, jeruk), serta diversifikasi karbohidrat berbasis umbi-umbian terus didorong untuk mencapai skor ideal 100.
                        </p>
                    </Card>
                </section>
            </main>

            {/* Public Portal Footer */}
            <PortalFooter />

            {/* MODAL: Penjelasan & Rumus Perhitungan PPH */}
            {showInfoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 text-[#006565] dark:bg-emerald-950 dark:text-emerald-400">
                                    <Info className="size-4.5" />
                                </div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Metodologi &amp; Rumus Pola Pangan Harapan (PPH)
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowInfoModal(false)}
                                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed dark:text-slate-300">
                            <p>
                                <strong>Pola Pangan Harapan (PPH)</strong> adalah susunan beragam pangan atau kelompok pangan yang didasarkan atas proporsi keseimbangan energi dari 9 kelompok pangan pokok untuk memenuhi kebutuhan gizi yang cukup, seimbang, dan aman.
                            </p>

                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2 dark:border-emerald-900 dark:bg-emerald-950/40">
                                <span className="block font-bold text-emerald-900 dark:text-emerald-200">
                                    Rumus Perhitungan Standar:
                                </span>
                                <ul className="space-y-1.5 list-disc list-inside font-mono text-[11px]">
                                    <li>% AKE = (Energi Konsumsi ÷ 2.100 Kkal) × 100%</li>
                                    <li>Skor Riil = % AKE × Bobot Kelompok Pangan</li>
                                    <li>Skor PPH = MIN(Skor Riil, Skor Maksimal)</li>
                                    <li>Skor Total PPH = SUM(Skor PPH 9 Kelompok Pangan) [Maksimal 100.0]</li>
                                </ul>
                            </div>

                            <div>
                                <span className="block font-bold text-slate-800 mb-1 dark:text-slate-200">
                                    Kategori Kualitas Gizi Skor PPH:
                                </span>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 dark:border-emerald-900 dark:bg-emerald-950/40">
                                        <strong className="text-emerald-800 dark:text-emerald-300">≥ 90.0:</strong> Sangat Baik / Prima
                                    </div>
                                    <div className="rounded-xl border border-teal-200 bg-teal-50 p-2 dark:border-teal-900 dark:bg-teal-950/40">
                                        <strong className="text-teal-800 dark:text-teal-300">80.0 - 89.9:</strong> Baik / Cukup
                                    </div>
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-2 dark:border-amber-900 dark:bg-amber-950/40">
                                        <strong className="text-amber-800 dark:text-amber-300">70.0 - 79.9:</strong> Sedang
                                    </div>
                                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-2 dark:border-rose-900 dark:bg-rose-950/40">
                                        <strong className="text-rose-800 dark:text-rose-300">&lt; 70.0:</strong> Kurang
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-3 flex justify-end dark:border-slate-800">
                            <Button
                                type="button"
                                onClick={() => setShowInfoModal(false)}
                                className="rounded-xl bg-[#006565] text-white hover:bg-[#005252] text-xs font-bold"
                            >
                                Mengerti &amp; Tutup
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

PphPublic.layout = null;


