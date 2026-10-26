import { Head, router } from '@inertiajs/react';
import {
    Archive,
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    FileSpreadsheet,
    FileText,
    Filter,
    GitCompare,
    HelpCircle,
    Info,
    Layers,
    LayoutGrid,
    ListFilter,
    Map,
    MapPin,
    Package,
    PlusCircle,
    Printer,
    Search,
    ShieldCheck,
    TrendingDown,
    TrendingUp,
    Truck,
    Wheat,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import CppdMap, { formatKg, type RecipientVillageItem } from '@/components/cppd-map';
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

export interface MonthlyPenyaluranItem {
    month: number;
    month_name: string;
    month_short: string;
    total_penyaluran: number;
    transaksi_count: number;
    desa_count: number;
}

export interface CppdPublicPageProps {
    selectedYear: number;
    availableYears: number[];
    summary: {
        stok_awal: number;
        total_pengadaan: number;
        total_penyaluran: number;
        total_addendum: number;
        stok_akhir: number;
        initial_stock_note?: string | null;
    };
    recipientVillages: RecipientVillageItem[];
    recentTransactions: Array<{
        id: number;
        tanggal: string;
        status: string;
        status_label: string;
        kecamatan: string;
        desa: string;
        jumlah: number;
        keterangan: string | null;
    }>;
    monthlyPenyaluranByYear?: Record<number, MonthlyPenyaluranItem[]>;
    territory: {
        kecamatanList: string[];
        desaByKecamatan: Record<string, string[]>;
    };
}

const YEAR_SERIES_COLORS = [
    '#006565', // Primary year (Teal/Emerald)
    '#3b82f6', // Comparison year 1 (Blue)
    '#f59e0b', // Comparison year 2 (Amber)
    '#e11d48', // Comparison year 3 (Rose)
    '#8b5cf6', // Comparison year 4 (Purple)
];

const DEFAULT_MONTHS: Array<{ month: number; month_name: string; month_short: string }> = [
    { month: 1, month_name: 'Januari', month_short: 'Jan' },
    { month: 2, month_name: 'Februari', month_short: 'Feb' },
    { month: 3, month_name: 'Maret', month_short: 'Mar' },
    { month: 4, month_name: 'April', month_short: 'Apr' },
    { month: 5, month_name: 'Mei', month_short: 'Mei' },
    { month: 6, month_name: 'Juni', month_short: 'Jun' },
    { month: 7, month_name: 'Juli', month_short: 'Jul' },
    { month: 8, month_name: 'Agustus', month_short: 'Agu' },
    { month: 9, month_name: 'September', month_short: 'Sep' },
    { month: 10, month_name: 'Oktober', month_short: 'Okt' },
    { month: 11, month_name: 'November', month_short: 'Nov' },
    { month: 12, month_name: 'Desember', month_short: 'Des' },
];

function formatCompactKg(num: number): string {
    const abs = Math.abs(num);
    if (abs >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(1)}M`;
    }
    if (abs >= 1_000) {
        return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
    }
    return String(Math.round(num));
}

function CustomMonthlyCppdTooltip({
    active,
    payload,
    activeYears,
}: {
    active?: boolean;
    payload?: any[];
    activeYears: number[];
}) {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    const primaryYear = activeYears[0];
    const secondYear = activeYears.length === 2 ? activeYears[1] : null;
    const primaryVal = Number(data[`penyaluran_${primaryYear}`] ?? 0);
    const secondVal = secondYear !== null ? Number(data[`penyaluran_${secondYear}`] ?? 0) : null;
    const diffVal = secondVal !== null ? primaryVal - secondVal : null;

    return (
        <div className="min-w-[240px] rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 text-xs shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95">
            <div className="mb-2.5 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white">
                    <Calendar className="h-3.5 w-3.5 text-[#006565] dark:text-emerald-400" />
                    <span>Bulan {data.month_name}</span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#006565] dark:bg-emerald-950/70 dark:text-emerald-300">
                    Penyaluran CPPD
                </span>
            </div>

            <div className="space-y-2">
                {activeYears.map((yr, idx) => {
                    const val = Number(data[`penyaluran_${yr}`] ?? 0);
                    const txCount = Number(data[`transaksi_${yr}`] ?? 0);
                    const desaCount = Number(data[`desa_${yr}`] ?? 0);
                    const color = YEAR_SERIES_COLORS[idx % YEAR_SERIES_COLORS.length];

                    return (
                        <div
                            key={yr}
                            className="rounded-xl bg-slate-50/80 p-2 dark:bg-slate-800/60"
                        >
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                                    <span
                                        className="inline-block h-2.5 w-2.5 rounded-sm"
                                        style={{ backgroundColor: color }}
                                    />
                                    Tahun {yr}
                                </span>
                                <span className="font-mono font-black text-slate-900 dark:text-white">
                                    {formatKg(val)}
                                </span>
                            </div>
                            <div className="mt-0.5 flex items-center justify-between pl-4 text-[10px] text-slate-500 dark:text-slate-400">
                                <span>{txCount} transaksi penyaluran</span>
                                <span>{desaCount} desa penerima</span>
                            </div>
                        </div>
                    );
                })}

                {secondYear !== null && diffVal !== null && (
                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                            Selisih ({primaryYear} vs {secondYear}):
                        </span>
                        <span
                            className={`font-mono font-black ${
                                diffVal > 0
                                    ? 'text-[#006565] dark:text-emerald-400'
                                    : diffVal < 0
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : 'text-slate-500'
                            }`}
                        >
                            {diffVal > 0 ? '+' : ''}
                            {formatKg(diffVal)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CppdPublicPage({
    selectedYear,
    availableYears,
    summary,
    recipientVillages,
    recentTransactions,
    monthlyPenyaluranByYear = {},
    territory,
}: CppdPublicPageProps) {
    // Layout selection: 'map' (Layout 1) | 'list' (Layout 2) | 'both'
    const [activeLayout, setActiveLayout] = useState<'map' | 'list' | 'both'>('map');

    // Filters for list and map
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedKecamatan, setSelectedKecamatan] = useState<string>('all');
    const [selectedVillageKey, setSelectedVillageKey] = useState<string | null>(null);

    // Monthly chart comparison & visualization controls
    const [compareYearOption, setCompareYearOption] = useState<string>('none');
    const [monthlyChartType, setMonthlyChartType] = useState<'bar' | 'line'>('bar');

    // Change year filter
    const handleYearChange = (year: number) => {
        router.get(
            '/cppd',
            { year },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Filtered recipient villages for list view and search
    const filteredVillages = useMemo(() => {
        return recipientVillages.filter((v) => {
            const matchesKecamatan =
                selectedKecamatan === 'all' ||
                v.kecamatan.toUpperCase() === selectedKecamatan.toUpperCase();

            const query = searchQuery.toLowerCase().trim();
            const matchesSearch =
                query === '' ||
                v.desa.toLowerCase().includes(query) ||
                v.kecamatan.toLowerCase().includes(query) ||
                (v.keterangan_list &&
                    v.keterangan_list.some((k) =>
                        k.keterangan.toLowerCase().includes(query)
                    ));

            return matchesKecamatan && matchesSearch;
        });
    }, [recipientVillages, selectedKecamatan, searchQuery]);

    // Total distributed among filtered list
    const filteredTotalKg = useMemo(() => {
        return filteredVillages.reduce((sum, v) => sum + v.total_penyaluran, 0);
    }, [filteredVillages]);

    // Selected village detail
    const activeVillageData = useMemo(() => {
        if (!selectedVillageKey) return null;
        return recipientVillages.find((v) => v.key === selectedVillageKey) || null;
    }, [recipientVillages, selectedVillageKey]);

    // Other years available for comparison (excluding selectedYear)
    const comparisonYearCandidates = useMemo(() => {
        return availableYears.filter((yr) => yr !== selectedYear);
    }, [availableYears, selectedYear]);

    // Effective comparison option (reset if user switched selectedYear to the same as compareYearOption)
    const effectiveCompareOption = useMemo(() => {
        if (compareYearOption === 'none' || compareYearOption === 'all') {
            return compareYearOption;
        }
        const num = Number(compareYearOption);
        if (num === selectedYear) {
            return comparisonYearCandidates.length > 0 ? String(comparisonYearCandidates[0]) : 'none';
        }
        return compareYearOption;
    }, [compareYearOption, selectedYear, comparisonYearCandidates]);

    // Active years to plot on the monthly chart
    const activeChartYears = useMemo(() => {
        if (effectiveCompareOption === 'none') {
            return [selectedYear];
        }
        if (effectiveCompareOption === 'all') {
            return [selectedYear, ...comparisonYearCandidates];
        }
        const compYr = Number(effectiveCompareOption);
        if (!Number.isNaN(compYr) && compYr !== selectedYear) {
            return [selectedYear, compYr];
        }
        return [selectedYear];
    }, [selectedYear, effectiveCompareOption, comparisonYearCandidates]);

    // Unified 12-month (Januari - Desember) dataset across activeChartYears
    const monthlyChartData = useMemo(() => {
        return DEFAULT_MONTHS.map((mInfo, idx) => {
            const row: Record<string, any> = {
                month: mInfo.month,
                month_name: mInfo.month_name,
                month_short: mInfo.month_short,
            };

            activeChartYears.forEach((yr) => {
                const yearArr = monthlyPenyaluranByYear[yr] || [];
                const found = yearArr[idx] || yearArr.find((item) => item.month === mInfo.month);
                row[`penyaluran_${yr}`] = found ? found.total_penyaluran : 0;
                row[`transaksi_${yr}`] = found ? found.transaksi_count : 0;
                row[`desa_${yr}`] = found ? found.desa_count : 0;
            });

            return row;
        });
    }, [monthlyPenyaluranByYear, activeChartYears]);

    // Summary & YoY comparison stats for the monthly chart
    const monthlyChartStats = useMemo(() => {
        const currentYearArr = monthlyPenyaluranByYear[selectedYear] || [];
        const currentYearTotal = currentYearArr.reduce((acc, m) => acc + m.total_penyaluran, 0);
        const activeMonthsCount = currentYearArr.filter((m) => m.total_penyaluran > 0).length;
        const avgPerMonth = currentYearTotal / 12;

        let peakMonth: MonthlyPenyaluranItem | null = null;
        for (const m of currentYearArr) {
            if (m.total_penyaluran > 0 && (!peakMonth || m.total_penyaluran > peakMonth.total_penyaluran)) {
                peakMonth = m;
            }
        }

        const primaryCompareYear =
            activeChartYears.length >= 2
                ? activeChartYears[1]
                : comparisonYearCandidates[0] ?? null;

        const compareYearArr = primaryCompareYear ? monthlyPenyaluranByYear[primaryCompareYear] || [] : [];
        const compareYearTotal = compareYearArr.reduce((acc, m) => acc + m.total_penyaluran, 0);
        const yoyDiff = currentYearTotal - compareYearTotal;
        const yoyPercent =
            compareYearTotal > 0 ? ((currentYearTotal - compareYearTotal) / compareYearTotal) * 100 : null;

        return {
            currentYearTotal,
            activeMonthsCount,
            avgPerMonth,
            peakMonth,
            primaryCompareYear,
            compareYearTotal,
            yoyDiff,
            yoyPercent,
        };
    }, [monthlyPenyaluranByYear, selectedYear, activeChartYears, comparisonYearCandidates]);

    // Download PDF Report
    const handleDownloadPdf = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Mohon izinkan pop-up browser untuk mencetak atau mengunduh PDF.');
            return;
        }

        const currentDateFormatted = new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date());

        let rowsHtml = '';
        recentTransactions.forEach((tx, idx) => {
            const statusLabel =
                tx.status === 'penyaluran'
                    ? '<span style="color:#e11d48;font-weight:bold">Penyaluran</span>'
                    : tx.status === 'pengadaan'
                      ? '<span style="color:#059669;font-weight:bold">Pengadaan</span>'
                      : '<span style="color:#d97706;font-weight:bold">Addendum</span>';

            const sign = tx.status === 'penyaluran' ? '− ' : '+ ';

            rowsHtml += `
                <tr>
                    <td style="text-align:center">${idx + 1}</td>
                    <td style="white-space:nowrap">${tx.tanggal}</td>
                    <td style="text-align:center">${statusLabel}</td>
                    <td>${tx.kecamatan}</td>
                    <td>${tx.desa}</td>
                    <td style="text-align:right;font-weight:bold;white-space:nowrap">${sign}${formatKg(tx.jumlah)}</td>
                    <td>${tx.keterangan || '-'}</td>
                </tr>
            `;
        });

        if (recentTransactions.length === 0) {
            rowsHtml = `
                <tr>
                    <td colspan="7" style="text-align:center;padding:16px;color:#64748b;font-style:italic">
                        Tidak ada riwayat transaksi yang tercatat untuk Tahun Anggaran ${selectedYear}.
                    </td>
                </tr>
            `;
        }

        const html = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8"/>
            <title>Laporan Transaksi CPPD Tahun ${selectedYear} - DKPP Kabupaten Indramayu</title>
            <style>
                @page {
                    size: A4 portrait;
                    margin: 12mm 10mm;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    margin: 0;
                    padding: 10px;
                    color: #0f172a;
                    font-size: 8.5pt;
                    line-height: 1.4;
                }
                .no-print {
                    margin-bottom: 16px;
                    padding: 10px 14px;
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                }
                .btn {
                    background: #006565;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: bold;
                    font-size: 9pt;
                    cursor: pointer;
                }
                .btn:hover {
                    background: #004d4d;
                }
                .header-kop {
                    text-align: center;
                    border-bottom: 3px double #0f172a;
                    padding-bottom: 8px;
                    margin-bottom: 14px;
                }
                .header-kop h2 {
                    margin: 0;
                    font-size: 13pt;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }
                .header-kop h3 {
                    margin: 2px 0;
                    font-size: 11pt;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .header-kop p {
                    margin: 2px 0 0 0;
                    font-size: 8pt;
                    color: #475569;
                }
                .doc-title {
                    text-align: center;
                    margin: 14px 0 10px 0;
                }
                .doc-title h4 {
                    margin: 0;
                    font-size: 11pt;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: #006565;
                }
                .doc-title p {
                    margin: 3px 0 0 0;
                    font-size: 8.5pt;
                    color: #475569;
                }
                .summary-box {
                    margin: 12px 0;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    overflow: hidden;
                }
                .summary-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .summary-table th, .summary-table td {
                    padding: 6px 8px;
                    border: 1px solid #e2e8f0;
                    font-size: 8pt;
                }
                .summary-table th {
                    background: #f8fafc;
                    color: #334155;
                    font-weight: 700;
                    text-align: center;
                }
                .summary-table td {
                    text-align: center;
                    font-weight: 800;
                }
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }
                .data-table th, .data-table td {
                    border: 1px solid #cbd5e1;
                    padding: 6px 8px;
                    font-size: 8pt;
                }
                .data-table th {
                    background: #006565;
                    color: #ffffff;
                    font-weight: 700;
                    text-align: center;
                }
                .data-table tr:nth-child(even) {
                    background-color: #f8fafc;
                }
                .sig-box {
                    margin-top: 24px;
                    display: flex;
                    justify-content: flex-end;
                }
                .sig-inner {
                    text-align: center;
                    width: 240px;
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
                <div>
                    <button class="btn" onclick="window.print()">🖨️ Cetak / Simpan sebagai PDF</button>
                    <span style="font-size:8pt;color:#334155;margin-left:8px">Tips: Pada printer tujuan, pilih <strong>Save as PDF (Simpan sebagai PDF)</strong>.</span>
                </div>
                <button class="btn" style="background:#64748b" onclick="window.close()">Tutup</button>
            </div>

            <div class="header-kop">
                <h2>Pemerintah Daerah Kabupaten Indramayu</h2>
                <h3>Dinas Ketahanan Pangan dan Pertanian</h3>
                <p>Jl. MT. Haryono No. 12, Indramayu, Jawa Barat 45214 • Telp: (0234) 272211 • Email: dkpp@indramayukab.go.id</p>
            </div>

            <div class="doc-title">
                <h4>Laporan Riwayat Mutasi Cadangan Pangan Pemerintah Daerah (CPPD)</h4>
                <p>Tahun Anggaran ${selectedYear} | Tanggal Cetak: ${currentDateFormatted}</p>
            </div>

            <div class="summary-box">
                <table class="summary-table">
                    <thead>
                        <tr>
                            <th>Stok Awal Tahun</th>
                            <th>Total Pengadaan</th>
                            <th>Total Penyaluran</th>
                            <th>Total Addendum</th>
                            <th style="background:#e0f2fe;color:#0369a1">Stok Akhir CPPD</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${formatKg(summary.stok_awal)}</td>
                            <td style="color:#059669">+ ${formatKg(summary.total_pengadaan)}</td>
                            <td style="color:#e11d48">− ${formatKg(summary.total_penyaluran)}</td>
                            <td style="color:#d97706">+ ${formatKg(summary.total_addendum)}</td>
                            <td style="color:#0284c7;font-size:9pt">${formatKg(summary.stok_akhir)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width:28px">No</th>
                        <th style="width:75px">Tanggal</th>
                        <th style="width:85px">Jenis Mutasi</th>
                        <th>Kecamatan</th>
                        <th>Desa</th>
                        <th style="width:95px">Volume (Kg)</th>
                        <th>Keterangan</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

        </body>
        </html>
        `;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 300);
    };

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const totalPasokanTersedia =
        summary.stok_awal + summary.total_pengadaan + summary.total_addendum;
    const rasioStokAkhir =
        totalPasokanTersedia > 0
            ? Math.min(100, Math.max(0, (summary.stok_akhir / totalPasokanTersedia) * 100))
            : 0;
    const rasioPenyaluran =
        totalPasokanTersedia > 0
            ? Math.min(100, Math.max(0, (summary.total_penyaluran / totalPasokanTersedia) * 100))
            : 0;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans">
            <Head title={`Cadangan Pangan Pemerintah Daerah (CPPD) Tahun ${selectedYear} - DKPP Indramayu`} />

            {/* Navbar */}
            <PortalNavbar activePage="cppd" />

            {/* HERO BANNER */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#003d3d] via-[#005757] to-[#002828] text-white">
                {/* Ambient Decorative Glow Orbs & Mesh Pattern */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
                    <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-cyan-400/10 blur-2xl" />
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07]" />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
                    <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                        {/* Left Column: Live Badge, Heading, Description, Action Buttons & Value Pillars */}
                        <div className="lg:col-span-7 space-y-5">
                            {/* Live Badge with Ping Dot */}
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3.5 py-1 text-xs font-bold text-emerald-200 backdrop-blur-md shadow-inner">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                                    </span>
                                    <span>CADANGAN PANGAN PEMERINTAH DAERAH (CPPD)</span>
                                </div>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-teal-100 backdrop-blur-md">
                                    <Wheat className="h-3.5 w-3.5 text-emerald-300" />
                                    <span>Lumbung Beras Indramayu</span>
                                </span>
                            </div>

                            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl leading-tight sm:leading-tight">
                                Transparansi Stok &amp; Distribusi{' '}
                                <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-200 bg-clip-text text-transparent">
                                    Cadangan Beras Daerah
                                </span>
                            </h1>

                            <p className="text-sm sm:text-base font-medium text-emerald-100/90 leading-relaxed max-w-2xl">
                                Pantau secara terbuka posisi stok awal, pengadaan beras APBD, penyesuaian kontrak (addendum), hingga peta geospasial dan tren bulanan penyaluran bantuan pangan ke desa-desa di seluruh wilayah Kabupaten Indramayu.
                            </p>

                            {/* Quick Navigation Action Buttons */}
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => scrollToSection('peta-sebaran-cppd')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] cursor-pointer"
                                >
                                    <Map className="h-4 w-4" />
                                    <span>Eksplorasi Peta Sebaran</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => scrollToSection('grafik-penyaluran-bulanan')}
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98] cursor-pointer"
                                >
                                    <BarChart3 className="h-4 w-4 text-emerald-300" />
                                    <span>Grafik Tren &amp; Komparasi Tahun</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => scrollToSection('riwayat-transaksi-cppd')}
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-emerald-100 backdrop-blur-md transition-all hover:bg-white/15 active:scale-[0.98] cursor-pointer"
                                >
                                    <FileText className="h-4 w-4 text-teal-300" />
                                    <span>Riwayat &amp; Laporan</span>
                                </button>
                            </div>

                            {/* Value Pillars */}
                            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10 text-xs text-emerald-100/85">
                                <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 backdrop-blur-xs">
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                                    <span>Stok Siap Salur Terjaga</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 backdrop-blur-xs">
                                    <MapPin className="h-3.5 w-3.5 text-cyan-300" />
                                    <span>{recipientVillages.length} Desa Penerima Bantuan</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 backdrop-blur-xs">
                                    <FileSpreadsheet className="h-3.5 w-3.5 text-teal-300" />
                                    <span>Ekspor Laporan PDF &amp; Excel Resmi</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Modern Glassmorphic Control & Stock Radar Card */}
                        <div className="lg:col-span-5">
                            <div className="rounded-3xl border border-white/20 bg-white/10 p-5 sm:p-6 backdrop-blur-xl shadow-2xl ring-1 ring-white/10 space-y-4">
                                {/* Card Header */}
                                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-emerald-300" />
                                        <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                                            Panel Tahun &amp; Radar Stok
                                        </span>
                                    </div>

                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/25 px-2.5 py-0.5 text-[11px] font-bold text-emerald-100">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                                        <span>Stok Siaga Aman</span>
                                    </span>
                                </div>

                                {/* Year Selector */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-100/80">
                                        <span>Pilih Tahun Anggaran Pantau:</span>
                                        <span className="font-bold text-emerald-300">TA {selectedYear}</span>
                                    </div>
                                    <Select
                                        value={String(selectedYear)}
                                        onValueChange={(val) => handleYearChange(Number(val))}
                                    >
                                        <SelectTrigger className="h-10 w-full rounded-xl bg-white text-slate-900 border-none font-bold text-xs sm:text-sm shadow-md hover:bg-emerald-50/95 focus:ring-2 focus:ring-emerald-400 cursor-pointer">
                                            <SelectValue placeholder="Pilih Tahun" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50">
                                            {availableYears.map((y) => (
                                                <SelectItem
                                                    key={y}
                                                    value={String(y)}
                                                    className="text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
                                                >
                                                    Tahun Anggaran {y}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 3 Quick Gauges */}
                                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-xs">
                                        <div className="text-[10px] font-bold text-emerald-200/80 uppercase">
                                            Total Pasokan
                                        </div>
                                        <div className="mt-1 font-mono text-sm sm:text-base font-black text-white truncate">
                                            {formatCompactKg(totalPasokanTersedia)} kg
                                        </div>
                                        <div className="text-[10px] text-emerald-100/60">awal + masuk</div>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-xs">
                                        <div className="text-[10px] font-bold text-rose-200/85 uppercase">
                                            Tersalurkan
                                        </div>
                                        <div className="mt-1 font-mono text-sm sm:text-base font-black text-rose-300 truncate">
                                            {formatCompactKg(summary.total_penyaluran)} kg
                                        </div>
                                        <div className="text-[10px] text-emerald-100/60">
                                            {recipientVillages.length} desa
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/20 p-2.5 backdrop-blur-xs">
                                        <div className="text-[10px] font-bold text-emerald-200 uppercase">
                                            Stok Akhir
                                        </div>
                                        <div className="mt-1 font-mono text-sm sm:text-base font-black text-emerald-300 truncate">
                                            {formatCompactKg(summary.stok_akhir)} kg
                                        </div>
                                        <div className="text-[10px] text-emerald-100/75">siap salur</div>
                                    </div>
                                </div>

                                {/* Stock Ratio Progress Bar & Summary */}
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2 text-xs">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="font-semibold text-emerald-100/90">
                                            Rasio Ketersediaan Stok Akhir:
                                        </span>
                                        <span className="font-mono font-extrabold text-emerald-300">
                                            {rasioStokAkhir.toFixed(1)}% Tersedia ({rasioPenyaluran.toFixed(1)}% Tersalurkan)
                                        </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 transition-all duration-500"
                                            style={{ width: `${rasioStokAkhir}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-emerald-100/75 pt-0.5">
                                        <span>Saldo Akhir: <strong className="text-white font-mono">{formatKg(summary.stok_akhir)}</strong></span>
                                        <span>Penyaluran: <strong className="text-rose-200 font-mono">{formatKg(summary.total_penyaluran)}</strong></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* MAIN CONTENT AREA */}
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-8">
                {/* 3. CARD RINGKASAN: 5 CARDS */}
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl flex items-center gap-2">
                                <Package className="h-5 w-5 text-[#006565] dark:text-emerald-400" />
                                <span>Ringkasan Neraca Cadangan Pangan (Tahun {selectedYear})</span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Dasar perhitungan: Stok Akhir = (Stok Awal + Total Pengadaan + Total Addendum) − Total Penyaluran
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {/* 1. Stok Awal */}
                        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider">1. Stok Awal Tahun</span>
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    <Archive className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl tracking-tight">
                                {formatKg(summary.stok_awal)}
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                {summary.initial_stock_note || 'Penetapan saldo awal tahun'}
                            </p>
                        </div>

                        {/* 2. Total Pengadaan */}
                        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-white p-4 shadow-sm hover:shadow-md transition-all dark:border-emerald-900/60 dark:from-emerald-950/20 dark:to-slate-900">
                            <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider">2. Total Pengadaan</span>
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-[#006565] dark:bg-emerald-900/60 dark:text-emerald-300">
                                    <ArrowUpRight className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="text-xl font-black text-[#006565] dark:text-emerald-400 sm:text-2xl tracking-tight">
                                + {formatKg(summary.total_pengadaan)}
                            </div>
                            <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                                Pengadaan beras APBD tahun {selectedYear}
                            </p>
                        </div>

                        {/* 3. Total Penyaluran */}
                        <div className="relative overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/60 to-white p-4 shadow-sm hover:shadow-md transition-all dark:border-rose-900/60 dark:from-rose-950/20 dark:to-slate-900">
                            <div className="flex items-center justify-between text-rose-800 dark:text-rose-300 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider">3. Total Penyaluran</span>
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                                    <Truck className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="text-xl font-black text-rose-600 dark:text-rose-400 sm:text-2xl tracking-tight">
                                − {formatKg(summary.total_penyaluran)}
                            </div>
                            <p className="mt-1 text-[11px] text-rose-700/80 dark:text-rose-400/80">
                                Bantuan ke {recipientVillages.length} desa penerima
                            </p>
                        </div>

                        {/* 4. Total Addendum */}
                        <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-white p-4 shadow-sm hover:shadow-md transition-all dark:border-amber-900/60 dark:from-amber-950/20 dark:to-slate-900">
                            <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider">4. Total Addendum</span>
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                                    <PlusCircle className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="text-xl font-black text-amber-600 dark:text-amber-400 sm:text-2xl tracking-tight">
                                + {formatKg(summary.total_addendum)}
                            </div>
                            <p className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-400/80">
                                Penyesuaian volume kontrak CPPD
                            </p>
                        </div>

                        {/* 5. Stok Akhir CPPD */}
                        <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-[#006565] to-[#004e4e] p-4 text-white shadow-md hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between text-emerald-200 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider">5. Stok Akhir CPPD</span>
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="text-xl font-black sm:text-2xl tracking-tight text-white">
                                {formatKg(summary.stok_akhir)}
                            </div>
                            <p className="mt-1 text-[11px] text-emerald-200/90 font-medium">
                                Saldo cadangan pangan siap pakai
                            </p>
                        </div>
                    </div>
                </section>

                {/* 4. LAYOUT CONTROLS (SWITCHER ANTARA LAYOUT 1 & LAYOUT 2) */}
                <section id="peta-sebaran-cppd" className="space-y-4 scroll-mt-20">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-3 dark:border-slate-800">
                        <div>
                            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                                <span>Penyaluran Cadangan Pangan Daerah</span>
                                <Badge className="bg-emerald-100 text-[#006565] border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
                                    {recipientVillages.length} Desa
                                </Badge>
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Pilih tampilan tata letak untuk menganalisis peta sebaran marker atau daftar tabel rincian desa.
                            </p>
                        </div>

                        {/* Layout Mode Buttons */}
                        <div className="inline-flex rounded-2xl border border-slate-200/80 bg-white p-1 shadow-xs dark:border-slate-800 dark:bg-slate-900 shrink-0">
                            <button
                                type="button"
                                onClick={() => setActiveLayout('map')}
                                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                                    activeLayout === 'map'
                                        ? 'bg-[#006565] text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Map className="h-4 w-4" />
                                <span>Layout 1: Peta Sebaran</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveLayout('list')}
                                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                                    activeLayout === 'list'
                                        ? 'bg-[#006565] text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                            >
                                <ListFilter className="h-4 w-4" />
                                <span>Layout 2: Daftar Desa</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveLayout('both')}
                                className={`hidden lg:inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                    activeLayout === 'both'
                                        ? 'bg-[#006565] text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                            >
                                <LayoutGrid className="h-4 w-4" />
                                <span>Berdampingan</span>
                            </button>
                        </div>
                    </div>

                    {/* Filter bar (shared across both layouts) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3 border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
                        {/* Search input */}
                        <div className="relative flex-1 min-w-[220px]">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Cari desa atau kecamatan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700"
                            />
                        </div>

                        {/* Kecamatan Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                <Filter className="h-3.5 w-3.5" />
                                <span>Kecamatan:</span>
                            </span>
                            <Select
                                value={selectedKecamatan}
                                onValueChange={(val) => setSelectedKecamatan(val)}
                            >
                                <SelectTrigger className="w-[180px] h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700">
                                    <SelectValue placeholder="Semua Kecamatan" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    <SelectItem value="all">Semua Kecamatan</SelectItem>
                                    {territory.kecamatanList.map((kec) => (
                                        <SelectItem key={kec} value={kec}>
                                            {kec}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {(searchQuery || selectedKecamatan !== 'all') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedKecamatan('all');
                                }}
                                className="h-9 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                                Reset Filter
                            </Button>
                        )}
                    </div>

                    {/* LAYOUT 1: PETA SEBARAN */}
                    {(activeLayout === 'map' || activeLayout === 'both') && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                                {/* Map area (col-span 3) */}
                                <div className={activeLayout === 'both' ? 'lg:col-span-2' : 'lg:col-span-3'}>
                                    <CppdMap
                                        recipientVillages={filteredVillages}
                                        selectedVillageKey={selectedVillageKey}
                                        onSelectVillage={(v) => setSelectedVillageKey(v ? v.key : null)}
                                        year={selectedYear}
                                        selectedKecamatanFilter={selectedKecamatan === 'all' ? null : selectedKecamatan}
                                        onSelectKecamatanFilter={(kec) => setSelectedKecamatan(kec || 'all')}
                                    />
                                </div>

                                {/* Village Details Sidebar (col-span 1) */}
                                <div className={activeLayout === 'both' ? 'lg:col-span-2 space-y-4' : 'lg:col-span-1 space-y-4'}>
                                    {/* Active selected village card or instructions */}
                                    {activeVillageData ? (
                                        <Card className="rounded-3xl border border-emerald-300 bg-emerald-50/50 p-4 shadow-md dark:border-emerald-800 dark:bg-emerald-950/30">
                                            <CardHeader className="p-0 pb-3 border-b border-emerald-200/60 dark:border-emerald-800">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-[#006565] dark:text-emerald-400">
                                                            Detail Titik Penyaluran
                                                        </span>
                                                        <CardTitle className="text-base font-black text-slate-900 dark:text-white">
                                                            Desa {activeVillageData.desa}
                                                        </CardTitle>
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                            Kecamatan {activeVillageData.kecamatan}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedVillageKey(null)}
                                                        className="h-6 px-2 text-[10px] text-slate-400 hover:text-slate-600"
                                                    >
                                                        Tutup
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-0 pt-3 space-y-2.5 text-xs">
                                                <div className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-2xs dark:bg-slate-900">
                                                    <span className="text-slate-500">Total Bantuan:</span>
                                                    <span className="font-black text-sm text-[#006565] dark:text-emerald-400">
                                                        {formatKg(activeVillageData.total_penyaluran)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-2xs dark:bg-slate-900">
                                                    <span className="text-slate-500">Jumlah Tahap:</span>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                                        {activeVillageData.transaksi_count} Kali
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-2xs dark:bg-slate-900">
                                                    <span className="text-slate-500">Tanggal Terakhir:</span>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                                        {activeVillageData.latest_tanggal}
                                                    </span>
                                                </div>

                                                {/* History notes */}
                                                {activeVillageData.keterangan_list && activeVillageData.keterangan_list.length > 0 && (
                                                    <div className="pt-2">
                                                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                                                            Riwayat Penyaluran:
                                                        </span>
                                                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                                            {activeVillageData.keterangan_list.map((item, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="rounded-xl border border-slate-200/80 bg-white p-2 text-[11px] dark:border-slate-800 dark:bg-slate-900"
                                                                >
                                                                    <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                                                                        <span>{item.tanggal}</span>
                                                                        <span className="font-bold text-[#006565] dark:text-emerald-400">
                                                                            {formatKg(item.jumlah)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-slate-700 dark:text-slate-300">
                                                                        {item.keterangan}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <Card className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-4 text-center dark:border-slate-800 dark:bg-slate-900/60">
                                            <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-[#006565] dark:bg-slate-800 dark:text-emerald-400">
                                                    <MapPin className="h-5 w-5 animate-bounce" />
                                                </div>
                                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                    Pilih Titik Marker
                                                </h4>
                                                <p className="text-xs text-slate-500 max-w-xs">
                                                    Klik salah satu marker desa di peta untuk meninjau rincian penyaluran bantuan pangan daerah.
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Top 5 Recipient Quick List */}
                                    <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                                                Penyaluran Terbanyak
                                            </span>
                                            <Badge variant="outline" className="text-[10px]">
                                                Top Desa
                                            </Badge>
                                        </div>
                                        <div className="mt-3 space-y-2">
                                            {filteredVillages.slice(0, 5).map((v, i) => (
                                                <button
                                                    key={v.key}
                                                    type="button"
                                                    onClick={() => setSelectedVillageKey(v.key)}
                                                    className={`w-full text-left rounded-xl p-2 transition-all flex items-center justify-between cursor-pointer ${
                                                        selectedVillageKey === v.key
                                                            ? 'bg-emerald-50 border border-emerald-300 dark:bg-emerald-950/40'
                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                                    }`}
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                                {i + 1}
                                                            </span>
                                                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                                {v.desa}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 pl-5.5 block">
                                                            Kec. {v.kecamatan}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-black text-[#006565] dark:text-emerald-400 shrink-0">
                                                        {formatKg(v.total_penyaluran)}
                                                    </span>
                                                </button>
                                            ))}
                                            {filteredVillages.length === 0 && (
                                                <p className="text-xs text-slate-400 py-3 text-center">
                                                    Tidak ada data desa penyaluran pada filter ini.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* GRAFIK PENYALURAN CPPD BULANAN (JANUARI - DESEMBER) & PERBANDINGAN ANTAR TAHUN */}
                    <Card
                        id="grafik-penyaluran-bulanan"
                        className="rounded-3xl border border-slate-200/90 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900/95 scroll-mt-20"
                    >
                        <CardHeader className="border-b border-slate-100 p-4 sm:p-6 pb-4 dark:border-slate-800">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-[#006565] dark:bg-emerald-950 dark:text-emerald-300">
                                            <BarChart3 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                                                Grafik Penyaluran CPPD Bulanan (Januari – Desember{' '}
                                                {activeChartYears.length > 1
                                                    ? `Perbandingan Tahun ${activeChartYears.join(' vs ')}`
                                                    : `Tahun ${selectedYear}`}
                                                )
                                            </CardTitle>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Tren volume distribusi cadangan pangan daerah setiap bulan sepanjang tahun serta analisis komparasi antar tahun anggaran.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Controls: Year Comparison Selector & Chart Type Toggle */}
                                <div className="flex flex-wrap items-center gap-2.5">
                                    {/* Year Comparison Dropdown */}
                                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-slate-50/80 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-800/60">
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                                            <GitCompare className="h-3.5 w-3.5 text-[#006565] dark:text-emerald-400" />
                                            <span>Bandingkan Tahun:</span>
                                        </span>
                                        <Select
                                            value={effectiveCompareOption}
                                            onValueChange={(val) => setCompareYearOption(val)}
                                        >
                                            <SelectTrigger className="h-8 w-48 rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                                                <SelectValue placeholder="Pilih Pembanding" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="none" className="text-xs font-semibold">
                                                    Tidak Dibandingkan ({selectedYear})
                                                </SelectItem>
                                                {comparisonYearCandidates.map((yr) => (
                                                    <SelectItem
                                                        key={yr}
                                                        value={String(yr)}
                                                        className="text-xs font-semibold"
                                                    >
                                                        Tahun {selectedYear} vs Tahun {yr}
                                                    </SelectItem>
                                                ))}
                                                {comparisonYearCandidates.length > 1 && (
                                                    <SelectItem
                                                        value="all"
                                                        className="text-xs font-bold text-[#006565] dark:text-emerald-400"
                                                    >
                                                        Semua Tahun ({availableYears.join(', ')})
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Chart Type Toggle: Bar vs Line */}
                                    <div className="inline-flex items-center rounded-2xl border border-slate-200/90 bg-slate-50/80 p-1 text-xs dark:border-slate-800 dark:bg-slate-800/60">
                                        <button
                                            type="button"
                                            onClick={() => setMonthlyChartType('bar')}
                                            className={`rounded-xl px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                                                monthlyChartType === 'bar'
                                                    ? 'bg-[#006565] text-white shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                                            }`}
                                        >
                                            Grafik Batang
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMonthlyChartType('line')}
                                            className={`rounded-xl px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                                                monthlyChartType === 'line'
                                                    ? 'bg-[#006565] text-white shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                                            }`}
                                        >
                                            Garis Tren
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Comparison Year Pills */}
                            {comparisonYearCandidates.length > 0 && (
                                <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Pintasan Komparasi:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setCompareYearOption('none')}
                                        className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer border ${
                                            effectiveCompareOption === 'none'
                                                ? 'border-[#006565] bg-emerald-50 text-[#006565] dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                                        }`}
                                    >
                                        Hanya {selectedYear}
                                    </button>
                                    {comparisonYearCandidates.map((yr) => (
                                        <button
                                            key={yr}
                                            type="button"
                                            onClick={() =>
                                                setCompareYearOption(
                                                    effectiveCompareOption === String(yr) ? 'none' : String(yr)
                                                )
                                            }
                                            className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer border ${
                                                effectiveCompareOption === String(yr)
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/60 dark:text-blue-300'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                                            }`}
                                        >
                                            + Bandingkan {yr}
                                        </button>
                                    ))}
                                    {comparisonYearCandidates.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setCompareYearOption(
                                                    effectiveCompareOption === 'all' ? 'none' : 'all'
                                                )
                                            }
                                            className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer border ${
                                                effectiveCompareOption === 'all'
                                                    ? 'border-amber-500 bg-amber-50 text-amber-800 dark:border-amber-400 dark:bg-amber-950/60 dark:text-amber-300'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                                            }`}
                                        >
                                            Semua Tahun ({availableYears.length})
                                        </button>
                                    )}
                                </div>
                            )}
                        </CardHeader>

                        <CardContent className="p-4 sm:p-6 pt-5 space-y-6">
                            {/* Legend & Unit Info Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex flex-wrap items-center gap-4">
                                    {activeChartYears.map((yr, idx) => {
                                        const color = YEAR_SERIES_COLORS[idx % YEAR_SERIES_COLORS.length];
                                        return (
                                            <div
                                                key={yr}
                                                className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200"
                                            >
                                                <span
                                                    className="inline-block h-3 w-3 rounded-sm"
                                                    style={{ backgroundColor: color }}
                                                />
                                                <span>
                                                    Penyaluran Tahun {yr}
                                                    {idx === 0 ? ' (Tahun Dipilih)' : ' (Pembanding)'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="text-xs text-slate-400 font-semibold">
                                    Satuan Volume:{' '}
                                    <span className="font-bold text-slate-700 dark:text-slate-200">
                                        Kilogram (kg)
                                    </span>
                                </div>
                            </div>

                            {/* Recharts Canvas (Januari - Desember) */}
                            <div className="h-80 sm:h-96 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart
                                        data={monthlyChartData}
                                        margin={{ top: 15, right: 20, left: 10, bottom: 10 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            opacity={0.25}
                                        />
                                        <XAxis
                                            dataKey="month_short"
                                            tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                                            axisLine={{ stroke: '#cbd5e1' }}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tickFormatter={(val) => `${formatCompactKg(Number(val))} kg`}
                                            tick={{ fontSize: 11, fill: '#64748b' }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={65}
                                        />
                                        <Tooltip
                                            content={
                                                <CustomMonthlyCppdTooltip
                                                    activeYears={activeChartYears}
                                                />
                                            }
                                        />
                                        <Legend
                                            verticalAlign="top"
                                            height={36}
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingBottom: '8px' }}
                                        />

                                        {activeChartYears.map((yr, idx) => {
                                            const color =
                                                YEAR_SERIES_COLORS[idx % YEAR_SERIES_COLORS.length];
                                            const seriesName = `Tahun ${yr}`;

                                            if (monthlyChartType === 'line') {
                                                return (
                                                    <Line
                                                        key={yr}
                                                        type="monotone"
                                                        dataKey={`penyaluran_${yr}`}
                                                        name={seriesName}
                                                        stroke={color}
                                                        strokeWidth={3}
                                                        dot={{
                                                            r: 4.5,
                                                            fill: color,
                                                            strokeWidth: 2,
                                                            stroke: '#ffffff',
                                                        }}
                                                        activeDot={{
                                                            r: 6.5,
                                                            fill: color,
                                                            strokeWidth: 2,
                                                            stroke: '#ffffff',
                                                        }}
                                                    />
                                                );
                                            }

                                            return (
                                                <Bar
                                                    key={yr}
                                                    dataKey={`penyaluran_${yr}`}
                                                    name={seriesName}
                                                    fill={color}
                                                    radius={[6, 6, 0, 0]}
                                                    maxBarSize={activeChartYears.length > 1 ? 28 : 42}
                                                />
                                            );
                                        })}
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Monthly Summary & Year-over-Year Comparison Metrics */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <div className="rounded-2xl bg-slate-50/90 p-3.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Total Penyaluran ({selectedYear})
                                    </span>
                                    <div className="mt-1 font-mono text-base font-black text-[#006565] dark:text-emerald-400">
                                        {formatKg(monthlyChartStats.currentYearTotal)}
                                    </div>
                                    <span className="text-[11px] text-slate-400">
                                        Tersalurkan pada {monthlyChartStats.activeMonthsCount} dari 12 bulan
                                    </span>
                                </div>

                                <div className="rounded-2xl bg-slate-50/90 p-3.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Puncak Penyaluran ({selectedYear})
                                    </span>
                                    <div className="mt-1 text-base font-black text-slate-900 dark:text-white">
                                        {monthlyChartStats.peakMonth
                                            ? monthlyChartStats.peakMonth.month_name
                                            : 'Belum Ada Data'}
                                    </div>
                                    <span className="text-[11px] text-slate-400">
                                        {monthlyChartStats.peakMonth
                                            ? `Volume: ${formatKg(monthlyChartStats.peakMonth.total_penyaluran)} (${monthlyChartStats.peakMonth.desa_count} desa)`
                                            : 'Tidak ada penyaluran tercatat'}
                                    </span>
                                </div>

                                <div className="rounded-2xl bg-slate-50/90 p-3.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Rata-rata Bulanan ({selectedYear})
                                    </span>
                                    <div className="mt-1 font-mono text-base font-black text-slate-900 dark:text-white">
                                        {formatKg(monthlyChartStats.avgPerMonth)} / bln
                                    </div>
                                    <span className="text-[11px] text-slate-400">
                                        Akumulasi Januari s/d Desember {selectedYear}
                                    </span>
                                </div>

                                <div className="rounded-2xl bg-slate-50/90 p-3.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Perbandingan vs Tahun {monthlyChartStats.primaryCompareYear ?? '-'}
                                    </span>
                                    {monthlyChartStats.primaryCompareYear ? (
                                        <>
                                            <div className="mt-1 flex items-center gap-1.5">
                                                {monthlyChartStats.yoyDiff > 0 ? (
                                                    <TrendingUp className="h-4 w-4 text-[#006565] dark:text-emerald-400" />
                                                ) : monthlyChartStats.yoyDiff < 0 ? (
                                                    <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                                ) : null}
                                                <span
                                                    className={`font-mono text-base font-black ${
                                                        monthlyChartStats.yoyDiff > 0
                                                            ? 'text-[#006565] dark:text-emerald-400'
                                                            : monthlyChartStats.yoyDiff < 0
                                                              ? 'text-rose-600 dark:text-rose-400'
                                                              : 'text-slate-700 dark:text-slate-300'
                                                    }`}
                                                >
                                                    {monthlyChartStats.yoyDiff > 0 ? '+' : ''}
                                                    {formatKg(monthlyChartStats.yoyDiff)}
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-400">
                                                Tahun {monthlyChartStats.primaryCompareYear}:{' '}
                                                {formatKg(monthlyChartStats.compareYearTotal)}
                                                {monthlyChartStats.yoyPercent !== null
                                                    ? ` (${monthlyChartStats.yoyPercent >= 0 ? '+' : ''}${monthlyChartStats.yoyPercent.toFixed(1)}%)`
                                                    : ''}
                                            </span>
                                        </>
                                    ) : (
                                        <div className="mt-1 text-xs text-slate-400">
                                            Belum ada tahun pembanding lain
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* LAYOUT 2: LIST DESA PENERIMA BANTUAN */}
                    {(activeLayout === 'list' || activeLayout === 'both') && (
                        <div className="space-y-4">
                            <div className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900/95 sm:p-6">
                                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white sm:text-lg flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-[#006565] dark:text-emerald-400" />
                                            <span>Daftar Desa Penerima Bantuan CPPD (Tahun {selectedYear})</span>
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Daftar lengkap seluruh desa penerima distribusi beras cadangan pangan beserta akumulasi total bantuan.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-emerald-100 text-[#006565] border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 px-3 py-1 text-xs font-extrabold">
                                            Total Volume: {formatKg(filteredTotalKg)}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="py-3 px-3.5 w-12 text-center">No</th>
                                                <th className="py-3 px-3.5">Desa</th>
                                                <th className="py-3 px-3.5">Kecamatan</th>
                                                <th className="py-3 px-3.5 text-right">Total Penyaluran (kg)</th>
                                                <th className="py-3 px-3.5 text-center">Frekuensi</th>
                                                <th className="py-3 px-3.5">Penyaluran Terakhir</th>
                                                <th className="py-3 px-3.5">Catatan Bantuan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {filteredVillages.map((item, index) => (
                                                <tr
                                                    key={item.key}
                                                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                                                >
                                                    <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                                                        {index + 1}
                                                    </td>
                                                    <td className="py-3 px-3.5 font-black text-slate-900 dark:text-white">
                                                        {item.desa}
                                                    </td>
                                                    <td className="py-3 px-3.5 font-bold text-slate-600 dark:text-slate-300">
                                                        {item.kecamatan}
                                                    </td>
                                                    <td className="py-3 px-3.5 text-right font-black text-[#006565] dark:text-emerald-400 text-sm">
                                                        {formatKg(item.total_penyaluran)}
                                                    </td>
                                                    <td className="py-3 px-3.5 text-center">
                                                        <Badge variant="secondary" className="font-extrabold text-[10px]">
                                                            {item.transaksi_count} Kali
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-3.5 font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                        {item.latest_tanggal}
                                                    </td>
                                                    <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 italic max-w-xs truncate">
                                                        {item.keterangan_list?.[0]?.keterangan || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredVillages.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="py-12 text-center text-slate-400 font-medium"
                                                    >
                                                        Tidak ada data desa penerima bantuan cadangan pangan yang sesuai dengan filter pencarian.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {filteredVillages.length > 0 && (
                                            <tfoot className="bg-slate-100/80 font-black text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-t-2 border-slate-200 dark:border-slate-700">
                                                <tr>
                                                    <td colSpan={3} className="py-3 px-3.5 uppercase tracking-wider text-xs">
                                                        Total Akumulasi ({filteredVillages.length} Desa)
                                                    </td>
                                                    <td className="py-3 px-3.5 text-right text-sm text-[#006565] dark:text-emerald-400 font-black">
                                                        {formatKg(filteredTotalKg)}
                                                    </td>
                                                    <td
                                                        colSpan={3}
                                                        className="py-3 px-3.5 text-xs text-slate-500 font-normal"
                                                    >
                                                        Bantuan Beras CPPD Kabupaten Indramayu
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* 5. LOG RIWAYAT TRANSAKSI TERAKHIR (PENGADAAN, PENYALURAN, ADDENDUM) */}
                <section id="riwayat-transaksi-cppd" className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/95 sm:p-6 scroll-mt-20">
                    <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Clock className="h-4 w-4 text-[#006565] dark:text-emerald-400" />
                                <span>Riwayat Transaksi CPPD Terkini ({selectedYear})</span>
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Log histori seluruh aktivitas mutasi pengadaan, penyaluran, dan addendum cadangan pangan.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {recentTransactions.length > 5 && (
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full">
                                    {recentTransactions.length} aktivitas
                                </span>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadPdf}
                                className="h-8 gap-1.5 rounded-xl border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer shadow-xs"
                                title="Unduh / Cetak Dokumen PDF"
                            >
                                <FileText className="h-3.5 w-3.5 text-rose-600" />
                                <span>Unduh PDF</span>
                            </Button>
                            <a
                                href={`/cppd/export-excel?year=${selectedYear}`}
                                download
                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-colors shadow-xs"
                                title="Unduh Berkas Excel (.xlsx)"
                            >
                                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Unduh Excel</span>
                            </a>
                        </div>
                    </div>

                    <div className="max-h-[365px] overflow-y-auto overscroll-contain pr-1.5 space-y-2 scrollbar-thin">
                        {recentTransactions.map((tx) => {
                            let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                            if (tx.status === 'pengadaan') {
                                badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300';
                            } else if (tx.status === 'penyaluran') {
                                badgeClass = 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300';
                            } else if (tx.status === 'addendum') {
                                badgeClass = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300';
                            }

                            return (
                                <div
                                    key={tx.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-slate-200/70 p-3 hover:bg-slate-50/80 transition-colors dark:border-slate-800 dark:hover:bg-slate-800/60"
                                >
                                    <div className="flex items-center gap-3">
                                        <Badge className={`rounded-xl px-2.5 py-1 text-[10px] font-black border ${badgeClass}`}>
                                            {tx.status_label}
                                        </Badge>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-slate-900 dark:text-white">
                                                    Desa {tx.desa}, Kec. {tx.kecamatan}
                                                </span>
                                                <span className="text-[10px] text-slate-400">• {tx.tanggal}</span>
                                            </div>
                                            {tx.keterangan && (
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                                                    {tx.keterangan}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <span className={`text-sm font-black ${
                                            tx.status === 'penyaluran'
                                                ? 'text-rose-600 dark:text-rose-400'
                                                : tx.status === 'pengadaan'
                                                    ? 'text-[#006565] dark:text-emerald-400'
                                                    : 'text-amber-600 dark:text-amber-400'
                                        }`}>
                                            {tx.status === 'penyaluran' ? '− ' : '+ '}
                                            {formatKg(tx.jumlah)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {recentTransactions.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-6">
                                Belum ada transaksi yang tercatat untuk tahun {selectedYear}.
                            </p>
                        )}
                    </div>
                </section>
            </main>

            {/* Portal Footer */}
            <PortalFooter />
        </div>
    );
}

