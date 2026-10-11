import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowDown,
    BarChart3,
    Calendar,
    CheckCircle2,
    Download,
    FileSpreadsheet,
    FileText,
    Layers,
    Printer,
    Search,
    ShieldCheck,
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

    const handleDownloadExcel = () => {
        window.location.href = `/neraca-pangan/export-excel?year=${selectedYear}&month=${selectedMonth}`;
    };

    const handleDownloadPdf = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Mohon izinkan pop-up browser untuk mencetak / mendownload PDF.');
            return;
        }

        const monthLabel = getMonthLabel(selectedMonth);
        const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        const itemsToPrint = filteredItems.length > 0 ? filteredItems : items;

        let tableRowsHtml = '';
        itemsToPrint.forEach((item, idx) => {
            const isSurplus = item.selisih !== null && item.selisih >= 0;
            const statusBadge = !item.is_recorded
                ? '<span style="color:#64748b;background:#f1f5f9;padding:2px 8px;border-radius:99px;font-size:7pt;">Belum Ada Data</span>'
                : item.keterangan === 'Surplus'
                ? '<span style="color:#065f46;background:#d1fae5;padding:2px 8px;border-radius:99px;font-weight:bold;font-size:7pt;">Surplus</span>'
                : '<span style="color:#991b1b;background:#fee2e2;padding:2px 8px;border-radius:99px;font-weight:bold;font-size:7pt;">Defisit</span>';

            const selisihText = item.is_recorded && item.selisih !== null
                ? `<span style="font-weight:bold;color:${isSurplus ? '#059669' : '#dc2626'}">${item.selisih >= 0 ? '+' : ''}${formatNumber(item.selisih)}</span>`
                : '-';

            tableRowsHtml += `
                <tr>
                    <td style="text-align:center;color:#64748b;">${idx + 1}</td>
                    <td style="font-weight:bold;color:#0f172a;">${item.name}</td>
                    <td style="text-align:center;color:#475569;">${item.unit}</td>
                    <td style="text-align:right;">${item.is_recorded ? formatNumber(item.produksi) : '-'}</td>
                    <td style="text-align:right;font-weight:600;">${item.is_recorded ? formatNumber(item.ketersediaan) : '-'}</td>
                    <td style="text-align:right;font-weight:600;">${item.is_recorded ? formatNumber(item.kebutuhan) : '-'}</td>
                    <td style="text-align:right;">${selisihText}</td>
                    <td style="text-align:center;">${statusBadge}</td>
                    <td style="color:#64748b;font-size:7pt;">${item.notes || '-'}</td>
                </tr>
            `;
        });

        const html = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8"/>
            <title>Neraca_Pangan_Indramayu_${monthLabel}_${selectedYear}</title>
            <style>
                @page {
                    size: A4 landscape;
                    margin: 10mm 10mm;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    margin: 0;
                    padding: 15px;
                    color: #0f172a;
                    font-size: 8pt;
                    background-color: #fff;
                }
                .no-print {
                    margin-bottom: 16px;
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    background: #f8fafc;
                    padding: 10px 16px;
                    border-radius: 8px;
                    border: 1px solid #cbd5e1;
                }
                .btn {
                    background: #047857;
                    color: white;
                    border: none;
                    padding: 7px 16px;
                    border-radius: 6px;
                    font-weight: bold;
                    font-size: 9pt;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                .btn-close {
                    background: #64748b;
                }
                .kop-container {
                    text-align: center;
                    margin-bottom: 12px;
                    border-bottom: 3px double #047857;
                    padding-bottom: 8px;
                }
                .kop-sub {
                    font-size: 9pt;
                    font-weight: 600;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    color: #334155;
                    margin: 0;
                }
                .kop-main {
                    font-size: 14pt;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    color: #047857;
                    margin: 2px 0;
                }
                .kop-address {
                    font-size: 7.5pt;
                    color: #64748b;
                    margin: 0;
                }
                .title-section {
                    text-align: center;
                    margin: 12px 0 16px 0;
                }
                .title-section h1 {
                    margin: 0;
                    font-size: 12pt;
                    font-weight: 800;
                    color: #0f172a;
                    text-transform: uppercase;
                }
                .title-section p {
                    margin: 3px 0 0 0;
                    font-size: 9pt;
                    font-weight: 600;
                    color: #047857;
                }
                .summary-cards {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 14px;
                }
                .card {
                    flex: 1;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    padding: 6px 10px;
                    background: #f8fafc;
                }
                .card-title {
                    font-size: 7pt;
                    text-transform: uppercase;
                    font-weight: 700;
                    color: #64748b;
                }
                .card-value {
                    font-size: 11pt;
                    font-weight: 800;
                    margin-top: 2px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 16px;
                }
                th, td {
                    border: 1px solid #cbd5e1;
                    padding: 4.5px 6px;
                    font-size: 7.5pt;
                }
                th {
                    background-color: #047857;
                    color: white;
                    font-weight: 700;
                    text-align: center;
                    vertical-align: middle;
                }
                tbody tr:nth-child(even) {
                    background-color: #f8fafc;
                }
                tfoot tr td {
                    font-weight: bold;
                    background-color: #f1f5f9;
                    padding: 5px 6px;
                }
                .signatures {
                    margin-top: 24px;
                    display: flex;
                    justify-content: flex-end;
                    page-break-inside: avoid;
                }
                .sign-box {
                    text-align: center;
                    width: 250px;
                    font-size: 8pt;
                }
                .sign-space {
                    height: 55px;
                }
                .footer-info {
                    margin-top: 16px;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 6px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 7pt;
                    color: #94a3b8;
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
                <span style="font-size: 8pt; color: #475569;">
                    Tips: Pada dialog print browser, pilih printer <strong>Save as PDF (Simpan sebagai PDF)</strong> dan orientasi <strong>Landscape</strong>.
                </span>
            </div>

            <div class="kop-container">
                <p class="kop-sub">Pemerintah Kabupaten Indramayu</p>
                <h2 class="kop-main">Dinas Ketahanan Pangan dan Pertanian</h2>
                <p class="kop-address">Jl. Pasar Baru No.445, Kel. Karangmalang, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat 45213 | Laman: dkpp.indramayukab.go.id</p>
            </div>

            <div class="title-section">
                <h1>Laporan Neraca Pangan Bulanan</h1>
                <p>Periode: Bulan ${monthLabel} ${selectedYear}</p>
            </div>

            <div class="summary-cards">
                <div class="card">
                    <div class="card-title">Komoditas Dipantau</div>
                    <div class="card-value" style="color:#0f172a;">${statistics.total_commodities} Komoditas</div>
                </div>
                <div class="card" style="background:#ecfdf5;border-color:#a7f3d0;">
                    <div class="card-title" style="color:#065f46;">Komoditas Surplus</div>
                    <div class="card-value" style="color:#059669;">${statistics.surplus_count} Komoditas</div>
                </div>
                <div class="card" style="background:#fff1f2;border-color:#fecdd3;">
                    <div class="card-title" style="color:#9f1239;">Komoditas Defisit</div>
                    <div class="card-value" style="color:#e11d48;">${statistics.defisit_count} Komoditas</div>
                </div>
                <div class="card">
                    <div class="card-title">Total Neraca Pangan</div>
                    <div class="card-value" style="color:${statistics.total_selisih >= 0 ? '#059669' : '#dc2626'};">
                        ${statistics.total_selisih >= 0 ? '+' : ''}${formatNumber(statistics.total_selisih)} Ton
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 30px;">No</th>
                        <th>Nama Komoditas</th>
                        <th style="width: 60px;">Satuan</th>
                        <th style="width: 90px; text-align: right;">Produksi</th>
                        <th style="width: 100px; text-align: right;">Ketersediaan</th>
                        <th style="width: 100px; text-align: right;">Kebutuhan</th>
                        <th style="width: 100px; text-align: right;">Selisih</th>
                        <th style="width: 85px; text-align: center;">Status</th>
                        <th>Catatan</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="text-align: center;">TOTAL KUMULATIF</td>
                        <td style="text-align: right;">${formatNumber(statistics.total_produksi)}</td>
                        <td style="text-align: right;">${formatNumber(statistics.total_ketersediaan)}</td>
                        <td style="text-align: right;">${formatNumber(statistics.total_kebutuhan)}</td>
                        <td style="text-align: right; color: ${statistics.total_selisih >= 0 ? '#059669' : '#dc2626'};">
                            ${statistics.total_selisih >= 0 ? '+' : ''}${formatNumber(statistics.total_selisih)}
                        </td>
                        <td style="text-align: center;">
                            ${statistics.total_selisih >= 0 ? 'Surplus' : 'Defisit'}
                        </td>
                        <td>-</td>
                    </tr>
                </tfoot>
            </table>

            <div class="signatures">
                <div class="sign-box">
                    <div>Indramayu, ${currentDateFormatted}</div>
                    <div style="font-weight: 600; margin-top: 4px;">Kepala Dinas Ketahanan Pangan dan Pertanian<br/>Kabupaten Indramayu</div>
                    <div class="sign-space"></div>
                    <div style="font-weight: bold; text-decoration: underline;">( .................................................... )</div>
                    <div style="color: #64748b; font-size: 7pt; margin-top: 2px;">NIP. ....................................................</div>
                </div>
            </div>

            <div class="footer-info">
                <span>Dinas Ketahanan Pangan dan Pertanian Kabupaten Indramayu &copy; ${new Date().getFullYear()}</span>
                <span>Dicetak dari Sistem Informasi DKPP pada: ${new Date().toLocaleString('id-ID')}</span>
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

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const deficitItems = useMemo(() => {
        return items.filter((item) => item.is_recorded && item.selisih !== null && item.selisih < 0);
    }, [items]);

    const surplusItems = useMemo(() => {
        return items.filter((item) => item.is_recorded && item.selisih !== null && item.selisih >= 0);
    }, [items]);

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
                {/* Modern & Kekinian Hero Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-900 p-6 sm:p-8 lg:p-10 text-white shadow-2xl shadow-emerald-950/25 border border-white/10">
                    {/* Background Decorative Mesh & Glow Orbs */}
                    <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl" />
                    <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-cyan-500/10 blur-2xl" />

                    <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                        {/* Left Column: Heading, Description, Action Buttons & Value Badges */}
                        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
                            {/* Live Badge with Ping Dot */}
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-md shadow-inner">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                                </span>
                                <span>SATU DATA KETAHANAN PANGAN KABUPATEN INDRAMAYU</span>
                            </div>

                            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl leading-tight sm:leading-tight">
                                Neraca Pangan Strategis{' '}
                                <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-200 bg-clip-text text-transparent">
                                    Kabupaten Indramayu
                                </span>
                            </h1>

                            <p className="text-sm font-medium text-emerald-100/90 sm:text-base leading-relaxed max-w-2xl">
                                Pantau ketersediaan pasokan, estimasi kebutuhan pangan masyarakat, dan deteksi dini status surplus/defisit pangan pokok secara akurat dan transparan setiap periode bulanan.
                            </p>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => scrollToSection('tabel-neraca')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] cursor-pointer"
                                >
                                    <Layers className="size-4" />
                                    <span>Lihat Tabel Neraca</span>
                                    <ArrowDown className="size-3.5 opacity-80" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => scrollToSection('grafik-tren-tahunan')}
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98] cursor-pointer"
                                >
                                    <TrendingUp className="size-4 text-emerald-300" />
                                    <span>Grafik Tren Bulanan (Jan - Des)</span>
                                </button>
                            </div>

                            {/* Value Pillars */}
                            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10 text-xs text-emerald-100/80">
                                <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 backdrop-blur-xs">
                                    <ShieldCheck className="size-3.5 text-emerald-300" />
                                    <span>11 Komoditas Utama</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 backdrop-blur-xs">
                                    <BarChart3 className="size-3.5 text-cyan-300" />
                                    <span>Analisis Real-Time</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 backdrop-blur-xs">
                                    <FileSpreadsheet className="size-3.5 text-teal-300" />
                                    <span>Ekspor PDF &amp; Excel Resmi</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Modern Glassmorphic Period Radar Card */}
                        <div className="lg:col-span-5 xl:col-span-5">
                            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 sm:p-6 backdrop-blur-xl shadow-2xl ring-1 ring-white/10 space-y-4">
                                {/* Card Header */}
                                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="size-4 text-emerald-300" />
                                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                                            Panel Periode Pantau
                                        </span>
                                    </div>

                                    {statistics.total_selisih >= 0 ? (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/25 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200">
                                            <CheckCircle2 className="size-3 text-emerald-300" />
                                            <span>Surplus Aman</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-500/25 px-2.5 py-0.5 text-[11px] font-bold text-rose-200">
                                            <AlertCircle className="size-3 text-rose-300" />
                                            <span>Defisit Waspada</span>
                                        </span>
                                    )}
                                </div>

                                {/* Modern Period Selector Inputs */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-medium text-emerald-100/75">
                                        Pilih Periode Neraca:
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Select
                                            value={String(selectedMonth)}
                                            onValueChange={(val) => handlePeriodChange(selectedYear, parseInt(val, 10))}
                                        >
                                            <SelectTrigger className="w-full h-9 text-xs bg-white text-slate-900 border-none font-semibold shadow-sm">
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
                                            <SelectTrigger className="w-full h-9 text-xs bg-white text-slate-900 border-none font-semibold shadow-sm">
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

                                {/* Quick Gauges */}
                                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-xs">
                                        <div className="text-[10px] font-bold text-emerald-200/80 uppercase">
                                            Surplus
                                        </div>
                                        <div className="text-lg font-black text-emerald-300 mt-0.5">
                                            {statistics.surplus_count}
                                        </div>
                                        <div className="text-[10px] text-emerald-100/60">komoditas</div>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-xs">
                                        <div className="text-[10px] font-bold text-rose-200/80 uppercase">
                                            Defisit
                                        </div>
                                        <div className="text-lg font-black text-rose-300 mt-0.5">
                                            {statistics.defisit_count}
                                        </div>
                                        <div className="text-[10px] text-emerald-100/60">komoditas</div>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-xs">
                                        <div className="text-[10px] font-bold text-teal-200/80 uppercase">
                                            Net Neraca
                                        </div>
                                        <div className={`text-sm font-black mt-1 font-mono truncate ${
                                            statistics.total_selisih >= 0 ? 'text-emerald-300' : 'text-rose-300'
                                        }`}>
                                            {statistics.total_selisih >= 0 ? '+' : ''}
                                            {formatCompactNumber(statistics.total_selisih)} Ton
                                        </div>
                                        <div className="text-[10px] text-emerald-100/60">kumulatif</div>
                                    </div>
                                </div>

                                {/* Dynamic Status / Alert Bar */}
                                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-relaxed">
                                    {deficitItems.length > 0 ? (
                                        <div className="flex items-start gap-2 text-rose-200">
                                            <AlertTriangle className="size-4 shrink-0 text-rose-300 mt-0.5" />
                                            <div>
                                                <strong className="text-rose-100">Perhatian Defisit:</strong>{' '}
                                                Terdapat {deficitItems.length} komoditas dengan kebutuhan melebihi ketersediaan ({deficitItems.map((d) => d.name).slice(0, 3).join(', ')}{deficitItems.length > 3 ? '...' : ''}).
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-2 text-emerald-200">
                                            <CheckCircle2 className="size-4 shrink-0 text-emerald-300 mt-0.5" />
                                            <div>
                                                <strong className="text-emerald-100">Pasokan Aman:</strong>{' '}
                                                Seluruh komoditas pangan pokok Kabupaten Indramayu berada dalam status surplus pada periode ini.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
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

                    <div className="flex flex-wrap items-center gap-2.5">
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

                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadExcel}
                            className="h-9 gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/80 font-medium text-xs shadow-sm"
                            title="Download data neraca pangan format Microsoft Excel (.xlsx)"
                        >
                            <FileSpreadsheet className="size-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Download Excel</span>
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadPdf}
                            className="h-9 gap-1.5 border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/80 font-medium text-xs shadow-sm"
                            title="Download atau cetak dokumen laporan neraca pangan resmi sebagai PDF"
                        >
                            <Printer className="size-4 text-rose-600 dark:text-rose-400" />
                            <span>Download PDF</span>
                        </Button>
                    </div>
                </div>

                {/* Food Balance Public Table */}
                <Card id="tabel-neraca" className="border-slate-200/80 shadow-sm overflow-hidden dark:border-slate-800 scroll-mt-20">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <Layers className="size-4 text-emerald-600" />
                                    Tabel Neraca Pangan Bulanan ({getMonthLabel(selectedMonth)} {selectedYear})
                                </CardTitle>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Informasi produksi, ketersediaan, kebutuhan, dan posisi neraca pangan komoditas strategis
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownloadExcel}
                                    className="h-8 gap-1.5 border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-400 dark:hover:bg-emerald-950 text-xs font-semibold"
                                >
                                    <FileSpreadsheet className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Download Excel</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownloadPdf}
                                    className="h-8 gap-1.5 border-rose-300 bg-white text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950 text-xs font-semibold"
                                >
                                    <Printer className="size-3.5 text-rose-600 dark:text-rose-400" />
                                    <span>Download PDF</span>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
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
                            <tfoot className="bg-slate-50 border-t border-slate-200/90 font-semibold text-xs text-slate-800 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200">
                                <tr>
                                    <td colSpan={3} className="py-3 px-4 text-center font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        Total Kumulatif
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono">
                                        {formatNumber(statistics.total_produksi)}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                                        {formatNumber(statistics.total_ketersediaan)}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                                        {formatNumber(statistics.total_kebutuhan)}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono font-bold">
                                        <span className={statistics.total_selisih < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                                            {statistics.total_selisih >= 0 ? '+' : ''}{formatNumber(statistics.total_selisih)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${statistics.total_selisih < 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                                            {statistics.total_selisih >= 0 ? 'Surplus' : 'Defisit'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-xs text-slate-400">-</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Card>

                {/* Yearly Trend Chart (January - December) */}
                <Card id="grafik-tren-tahunan" className="border-slate-200/80 shadow-sm dark:border-slate-800 scroll-mt-20">
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

