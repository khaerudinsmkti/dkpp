import { Head, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    Award,
    BarChart3,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Compass,
    Download,
    Droplets,
    ExternalLink,
    FileSpreadsheet,
    Filter,
    HelpCircle,
    Info,
    Layers,
    MapPin,
    PieChart as PieChartIcon,
    Printer,
    Scale,
    Search,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    TrendingDown,
    TrendingUp,
    Wheat,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from 'recharts';

import FsvaMap, { type FsvaVillageItem } from '@/components/fsva-map';
import PortalFooter from '@/components/portal-footer';
import PortalNavbar from '@/components/portal-navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface PriorityBarItem {
    priority: number;
    name: string;
    full_name: string;
    short_name: string;
    count: number;
    percentage: number;
    color: string;
    category: string;
}

export interface DonutItem {
    name: string;
    value: number;
    percentage: number;
    color: string;
}

export interface ClassificationCardItem {
    priority: number;
    title: string;
    status: string;
    full_title: string;
    count: number;
    percentage: number;
    avg_ikp: number;
    avg_indicator: number;
    color: string;
    bg_class: string;
    category: string;
    description: string;
    villages: Array<{
        id: number;
        desa: string;
        kecamatan: string;
        ikp: number | null;
        rank: number | null;
        current_indicator_value: number | null;
    }>;
}

interface FsvaPageProps {
    items: FsvaVillageItem[];
    summary: {
        year: number;
        total_desa: number;
        indicator: string;
        indicator_info: {
            label: string;
            short: string;
            unit: string;
            description: string;
        };
        avg_value: number;
        min_value: number;
        max_value: number;
        min_desa?: FsvaVillageItem | null;
        max_desa?: FsvaVillageItem | null;
        count_rentan: number;
        count_aman: number;
        pct_rentan: number;
        pct_aman: number;
    };
    priorityChartData: PriorityBarItem[];
    donutSummary: {
        total_desa: number;
        count_rentan: number;
        percentage_rentan: number;
        count_aman: number;
        percentage_aman: number;
        chart_data: DonutItem[];
    };
    classificationCards: ClassificationCardItem[];
    indicators: Record<string, { label: string; short: string; unit: string; description: string }>;
    availableYears: number[];
    kecamatanList: string[];
    filters: {
        year: number;
        indicator: string;
        kecamatan: string;
    };
}

const PRIORITY_CONFIG: Record<number, { color: string; label: string; short: string; category: string }> = {
    1: { color: '#dc2626', label: 'Prioritas 1 (Sangat Rentan)', short: 'Sangat Rentan', category: 'rentan' },
    2: { color: '#ea580c', label: 'Prioritas 2 (Rentan)', short: 'Rentan', category: 'rentan' },
    3: { color: '#f59e0b', label: 'Prioritas 3 (Agak Rentan)', short: 'Agak Rentan', category: 'rentan' },
    4: { color: '#84cc16', label: 'Prioritas 4 (Agak Tahan)', short: 'Agak Tahan', category: 'aman' },
    5: { color: '#10b981', label: 'Prioritas 5 (Tahan)', short: 'Tahan', category: 'aman' },
    6: { color: '#047857', label: 'Prioritas 6 (Sangat Tahan)', short: 'Sangat Tahan', category: 'aman' },
};

export const INDICATOR_GROUPS = [
    {
        title: 'Ketersediaan Pangan',
        shortTitle: 'Ketersediaan',
        description: 'Kapasitas produksi, energi, protein & cadangan beras',
        icon: Wheat,
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
        borderColor: 'border-emerald-200/70 dark:border-emerald-900/40',
        headerBg: 'bg-emerald-50/60 dark:bg-emerald-950/30',
        items: [
            {
                key: 'ncpr',
                label: 'Rasio Konsumsi Normatif Per Kapita (NCPR)',
                unit: 'Rasio',
            },
            {
                key: 'energy',
                label: 'Rasio Ketersediaan Energy',
                unit: 'kkal/kapita/hari',
            },
            {
                key: 'protein',
                label: 'Rasio Ketersediaan Protein Hewani',
                unit: 'gram/kapita/hari',
            },
            {
                key: 'food_reserves',
                label: 'Rasio Cadangan Beras Pemerintah Kabupaten/Kota (Cadangan Pangan)',
                unit: 'ton',
            },
        ],
    },
    {
        title: 'Keterjangkauan Pangan',
        shortTitle: 'Keterjangkauan',
        description: 'Daya beli, stabilitas harga pangan & kerentanan konsumsi',
        icon: Scale,
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
        borderColor: 'border-amber-200/70 dark:border-amber-900/40',
        headerBg: 'bg-amber-50/60 dark:bg-amber-950/30',
        items: [
            {
                key: 'poverty',
                label: 'Persentase Penduduk Miskin',
                unit: '%',
            },
            {
                key: 'price_cv',
                label: 'Koefisien Variasi Harga Pangan',
                unit: '%',
            },
            {
                key: 'pou',
                label: 'Prevalance of Undernourishment (PoU)',
                unit: '%',
            },
        ],
    },
    {
        title: 'Pemanfaatan Pangan',
        shortTitle: 'Pemanfaatan',
        description: 'Akses air bersih, sanitasi, mutu konsumsi & balita stunting',
        icon: Droplets,
        badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
        borderColor: 'border-sky-200/70 dark:border-sky-900/40',
        headerBg: 'bg-sky-50/60 dark:bg-sky-950/30',
        items: [
            {
                key: 'female_school',
                label: 'Rata-rata lama sekolah perempuan',
                unit: 'tahun',
            },
            {
                key: 'no_water',
                label: 'Persentase rumah tangga tanpa akses air bersih',
                unit: '%',
            },
            {
                key: 'pph',
                label: 'Skor Pola Pangan Harapan (PPH) Konsumsi',
                unit: 'Skor (0-100)',
            },
            {
                key: 'stunting',
                label: 'Persentase Balita Stunting',
                unit: '%',
            },
        ],
    },
];

export default function FsvaPage({
    items,
    summary,
    priorityChartData,
    donutSummary,
    classificationCards,
    indicators,
    availableYears,
    kecamatanList,
    filters,
}: FsvaPageProps) {
    const [selectedCardModal, setSelectedCardModal] = useState<ClassificationCardItem | null>(null);
    const [modalSearch, setModalSearch] = useState('');
    const [tableSearch, setTableSearch] = useState('');
    const [tableKecFilter, setTableKecFilter] = useState('ALL');
    const [tablePriorityFilter, setTablePriorityFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 15;

    // Filter change handler
    const handleFilterChange = (key: 'year' | 'indicator' | 'kecamatan', value: string) => {
        router.get(
            '/fsva',
            {
                ...filters,
                [key]: value,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    // Filter villages in modal
    const filteredModalVillages = useMemo(() => {
        if (!selectedCardModal) return [];
        if (!modalSearch.trim()) return selectedCardModal.villages;
        const q = modalSearch.toLowerCase();
        return selectedCardModal.villages.filter(
            (v) =>
                v.desa.toLowerCase().includes(q) ||
                v.kecamatan.toLowerCase().includes(q)
        );
    }, [selectedCardModal, modalSearch]);

    // Filter villages for table
    const filteredTableItems = useMemo(() => {
        return items.filter((it) => {
            if (tableKecFilter !== 'ALL' && it.kecamatan !== tableKecFilter) return false;
            if (tablePriorityFilter !== 'ALL' && it.komposit !== Number(tablePriorityFilter)) return false;
            if (tableSearch.trim()) {
                const q = tableSearch.toLowerCase();
                const match =
                    it.desa.toLowerCase().includes(q) ||
                    it.kecamatan.toLowerCase().includes(q);
                if (!match) return false;
            }
            return true;
        });
    }, [items, tableKecFilter, tablePriorityFilter, tableSearch]);

    const totalPages = Math.ceil(filteredTableItems.length / rowsPerPage);
    const paginatedTableItems = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredTableItems.slice(start, start + rowsPerPage);
    }, [filteredTableItems, currentPage]);

    // Download Excel export for current evaluation year
    const handleDownloadExcel = () => {
        window.location.href = `/fsva/export?year=${summary.year}`;
    };

    // Download PDF formatted official report
    const handleDownloadPdf = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Mohon izinkan pop-up browser untuk mencetak atau mengunduh PDF.');
            return;
        }

        const formattedToday = new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date());

        const rowsHtml = filteredTableItems
            .map((item, index) => {
                const pInfo = PRIORITY_CONFIG[item.komposit] || PRIORITY_CONFIG[1];
                return `
                <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td style="text-align: center; font-weight: bold;">${item.rank ?? '-'}</td>
                    <td style="font-weight: 700;">${item.desa}</td>
                    <td>${item.kecamatan}</td>
                    <td style="text-align: center;">
                        <span style="display: inline-block; padding: 2px 7px; border-radius: 9999px; font-weight: 800; font-size: 6.5pt; color: white; background-color: ${pInfo.color};">
                            P${item.komposit}: ${pInfo.short}
                        </span>
                    </td>
                    <td style="text-align: right; font-weight: bold; color: #006565;">${item.ikp ?? '-'}</td>
                    <td style="text-align: right;">${item.ncpr ?? '-'}</td>
                    <td style="text-align: right;">${item.energy ?? '-'}</td>
                    <td style="text-align: right;">${item.protein ?? '-'}</td>
                    <td style="text-align: right;">${item.food_reserves ?? '-'}</td>
                    <td style="text-align: right;">${item.poverty !== null && item.poverty !== undefined ? item.poverty + '%' : '-'}</td>
                    <td style="text-align: right;">${item.price_cv !== null && item.price_cv !== undefined ? item.price_cv + '%' : '-'}</td>
                    <td style="text-align: right;">${item.pou !== null && item.pou !== undefined ? item.pou + '%' : '-'}</td>
                    <td style="text-align: right;">${item.female_school ?? '-'}</td>
                    <td style="text-align: right;">${item.no_water !== null && item.no_water !== undefined ? item.no_water + '%' : '-'}</td>
                    <td style="text-align: right;">${item.pph ?? '-'}</td>
                    <td style="text-align: right;">${item.stunting !== null && item.stunting !== undefined ? item.stunting + '%' : '-'}</td>
                </tr>
            `;
            })
            .join('');

        const printHtml = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8"/>
            <title>Laporan_FSVA_Indramayu_${summary.year}</title>
            <style>
                @page {
                    size: A4 landscape;
                    margin: 8mm 10mm;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    margin: 0;
                    padding: 14px;
                    color: #0f172a;
                    font-size: 7.5pt;
                    background: #fff;
                }
                .no-print {
                    margin-bottom: 14px;
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    background: #f1f5f9;
                    padding: 10px 14px;
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
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                .btn-close {
                    background: #64748b;
                }
                .kop-header {
                    text-align: center;
                    margin-bottom: 12px;
                }
                .kop-sub {
                    font-size: 10pt;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    margin: 0;
                    color: #334155;
                }
                .kop-main {
                    font-size: 14pt;
                    font-weight: 900;
                    color: #006565;
                    text-transform: uppercase;
                    margin: 2px 0;
                    letter-spacing: 0.5px;
                }
                .kop-address {
                    font-size: 7.5pt;
                    color: #64748b;
                    margin: 0;
                }
                .kop-line {
                    height: 2.5px;
                    background: #006565;
                    margin-top: 8px;
                }
                .kop-line-thin {
                    height: 1px;
                    background: #006565;
                    margin-top: 1.5px;
                    margin-bottom: 10px;
                }
                .title-section {
                    text-align: center;
                    margin-bottom: 10px;
                }
                .title-section h1 {
                    font-size: 12pt;
                    font-weight: 900;
                    margin: 0;
                    color: #0f172a;
                    text-transform: uppercase;
                }
                .title-section p {
                    margin: 2px 0 0 0;
                    font-size: 8.5pt;
                    color: #475569;
                }
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 8px;
                    background: #f8fafc;
                    border: 1px solid #cbd5e1;
                    padding: 8px 12px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                }
                .summary-card {
                    text-align: center;
                }
                .summary-card .label {
                    font-size: 7pt;
                    color: #64748b;
                    text-transform: uppercase;
                    font-weight: bold;
                }
                .summary-card .val {
                    font-size: 11pt;
                    font-weight: 900;
                    color: #0f172a;
                    margin-top: 2px;
                }
                .summary-card .sub {
                    font-size: 6.5pt;
                    color: #64748b;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 7pt;
                }
                th {
                    background-color: #006565;
                    color: white;
                    border: 1px solid #004d4d;
                    padding: 5px 4px;
                    font-weight: bold;
                    text-align: center;
                    font-size: 6.5pt;
                    text-transform: uppercase;
                }
                td {
                    border: 1px solid #cbd5e1;
                    padding: 4px 4px;
                }
                tr:nth-child(even) td {
                    background-color: #f8fafc;
                }
                .footer-sign {
                    margin-top: 18px;
                    display: flex;
                    justify-content: flex-end;
                }
                .sign-box {
                    text-align: center;
                    width: 250px;
                    font-size: 7.5pt;
                }
                .footer-meta {
                    margin-top: 16px;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 4px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 6.5pt;
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

            <div class="kop-header">
                <p class="kop-sub">Pemerintah Kabupaten Indramayu</p>
                <h2 class="kop-main">Dinas Ketahanan Pangan dan Pertanian</h2>
                <p class="kop-address">Jl. Letnan Gatot No. 04 Indramayu - Jawa Barat 45212 | Laman Resmi: dkpp.indramayukab.go.id</p>
                <div class="kop-line"></div>
                <div class="kop-line-thin"></div>
            </div>

            <div class="title-section">
                <h1>Laporan Food Security and Vulnerability Atlas (FSVA) Desa</h1>
                <p>Kabupaten Indramayu — Tahun Evaluasi ${summary.year}</p>
            </div>

            <div class="summary-grid">
                <div class="summary-card">
                    <div class="label">Total Desa Terdata</div>
                    <div class="val">${filteredTableItems.length} Desa</div>
                    <div class="sub">31 Kecamatan Se-Kabupaten</div>
                </div>
                <div class="summary-card">
                    <div class="label">Desa Tahan (P4 - P6)</div>
                    <div class="val" style="color: #047857;">${summary.count_aman} Desa</div>
                    <div class="sub">${summary.pct_aman}% Total Desa</div>
                </div>
                <div class="summary-card">
                    <div class="label">Desa Rentan (P1 - P3)</div>
                    <div class="val" style="color: #dc2626;">${summary.count_rentan} Desa</div>
                    <div class="sub">${summary.pct_rentan}% Perlu Intervensi</div>
                </div>
                <div class="summary-card">
                    <div class="label">Indikator Terpilih</div>
                    <div class="val" style="color: #006565;">${summary.indicator_info.label}</div>
                    <div class="sub">Rata-rata: ${summary.avg_value} ${summary.indicator_info.unit}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 20px;">No</th>
                        <th style="width: 28px;">Rank</th>
                        <th>Desa / Kelurahan</th>
                        <th>Kecamatan</th>
                        <th style="width: 90px;">Prioritas</th>
                        <th>IKP</th>
                        <th>NCPR</th>
                        <th>Energi</th>
                        <th>Protein</th>
                        <th>Cadangan</th>
                        <th>Kemiskinan</th>
                        <th>Var. Harga</th>
                        <th>PoU</th>
                        <th>Sekolah Pr.</th>
                        <th>Tanpa Air</th>
                        <th>PPH</th>
                        <th>Stunting</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <div class="footer-meta">
                <span>Dicetak melalui Sistem Informasi Ketahanan Pangan DKPP Indramayu</span>
                <span>Dokumen Resmi — Tahun ${summary.year}</span>
            </div>
        </body>
        </html>
        `;

        printWindow.document.open();
        printWindow.document.write(printHtml);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 350);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col dark:bg-slate-950 dark:text-slate-100">
            <Head>
                <title>FSVA - Food Security and Vulnerability Atlas | Ketahanan Pangan Indramayu</title>
                <meta
                    name="description"
                    content="Peta Ketahanan dan Kerentanan Pangan (FSVA) 317 Desa/Kelurahan Kabupaten Indramayu. Pemetaan tingkat prioritas ketahanan pangan terpadu."
                />
            </Head>

            {/* Public Portal Top Navbar */}
            <PortalNavbar activePage="fsva" />

            <main className="flex-1 pb-16">
                {/* 1. HERO BANNER */}
                <section className="relative overflow-hidden bg-gradient-to-br from-[#004d4d] via-[#006565] to-teal-900 text-white pt-10 pb-16 shadow-lg">
                    {/* Background abstract grid pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:18px_18px]" />

                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                            <div className="max-w-2xl space-y-4">
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold backdrop-blur-md border border-white/20 text-emerald-200">
                                    <Compass className="h-3.5 w-3.5 animate-spin-slow" />
                                    <span>Food Security and Vulnerability Atlas</span>
                                </div>

                                <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl text-white">
                                    Peta Ketahanan &amp; Kerentanan Pangan (FSVA)
                                </h1>

                                <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
                                    Pemetaan spasial tingkat ketahanan dan kerentanan pangan tingkat desa/kelurahan se-Kabupaten Indramayu. Instrumen perumusan kebijakan pengentasan kerentanan pangan terarah dan berbasis bukti.
                                </p>

                                {/* Badges */}
                                <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 font-bold text-white backdrop-blur-xs border border-white/10">
                                        <MapPin className="h-3.5 w-3.5 text-emerald-300" />
                                        <span>317 Desa &amp; Kelurahan</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 font-bold text-white backdrop-blur-xs border border-white/10">
                                        <Layers className="h-3.5 w-3.5 text-emerald-300" />
                                        <span>31 Kecamatan</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 font-bold text-white backdrop-blur-xs border border-white/10">
                                        <Activity className="h-3.5 w-3.5 text-emerald-300" />
                                        <span>11 Indikator Ketahanan Pangan</span>
                                    </span>
                                </div>
                            </div>

                            {/* Hero Right: Summary Status Card */}
                            <div className="w-full lg:w-96 rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl space-y-4">
                                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                                        Status Umum Tahun {summary.year}
                                    </span>
                                    <Badge className="bg-emerald-500 text-white font-extrabold text-[10px]">
                                        Tersinkronisasi
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-center">
                                    <div className="rounded-2xl bg-emerald-500/20 p-3 border border-emerald-400/30">
                                        <span className="text-[11px] font-bold text-emerald-200 block">
                                            Desa Tahan / Aman
                                        </span>
                                        <span className="text-2xl font-black text-white">
                                            {summary.count_aman}
                                        </span>
                                        <span className="text-[10px] text-emerald-200/80 block">
                                            {summary.pct_aman}% (P4 - P6)
                                        </span>
                                    </div>

                                    <div className="rounded-2xl bg-rose-500/20 p-3 border border-rose-400/30">
                                        <span className="text-[11px] font-bold text-rose-200 block">
                                            Desa Rentan
                                        </span>
                                        <span className="text-2xl font-black text-white">
                                            {summary.count_rentan}
                                        </span>
                                        <span className="text-[10px] text-rose-200/80 block">
                                            {summary.pct_rentan}% (P1 - P3)
                                        </span>
                                    </div>
                                </div>

                                <p className="text-[11px] text-emerald-100/80 text-center leading-tight">
                                    Sebanyak <b>{summary.count_aman} desa</b> ({summary.pct_aman}%) berada pada klasifikasi tahan, dan <b>{summary.count_rentan} desa</b> ({summary.pct_rentan}%) memerlukan intervensi prioritas.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-7 space-y-8">
                    {/* 2. FILTER BAR */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-[#006565] dark:bg-emerald-950/60 dark:text-emerald-400">
                                    <Filter className="h-4 w-4" />
                                </span>
                                <div>
                                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        Filter Indikator &amp; Periode
                                    </h2>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Pilih tahun evaluasi dan indikator FSVA
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {/* Tahun Filter */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                        Tahun:
                                    </span>
                                    <Select
                                        value={String(summary.year)}
                                        onValueChange={(val) => handleFilterChange('year', val)}
                                    >
                                        <SelectTrigger className="h-9 w-28 rounded-xl font-bold bg-slate-50 dark:bg-slate-800">
                                            <SelectValue placeholder="Tahun" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableYears.map((y) => (
                                                <SelectItem key={y} value={String(y)} className="font-bold">
                                                    {y}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Indicator Filter Grouped */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                        Indikator:
                                    </span>
                                    <Select
                                        value={summary.indicator}
                                        onValueChange={(val) => handleFilterChange('indicator', val)}
                                    >
                                        <SelectTrigger className="h-9 w-60 sm:w-72 md:w-84 rounded-xl font-bold bg-slate-50 dark:bg-slate-800 text-xs">
                                            <SelectValue placeholder="Pilih Indikator FSVA" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-80 w-[88vw] sm:w-[380px] md:w-[420px] rounded-xl p-1.5 z-50">
                                            {/* Opsi Komposit */}
                                            <SelectGroup>
                                                <SelectItem
                                                    value="komposit"
                                                    className="font-extrabold text-[#006565] dark:text-emerald-400 text-xs py-2 cursor-pointer"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                        <span>Komposit FSVA (Prioritas 1-6)</span>
                                                    </span>
                                                </SelectItem>
                                            </SelectGroup>

                                            {/* Group Ketersediaan, Keterjangkauan, Pemanfaatan */}
                                            {INDICATOR_GROUPS.map((group) => {
                                                const GroupIcon = group.icon;
                                                return (
                                                    <React.Fragment key={group.title}>
                                                        <SelectSeparator className="my-1.5" />
                                                        <SelectGroup>
                                                            <SelectLabel className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                                                <GroupIcon className="h-3.5 w-3.5 text-[#006565] dark:text-emerald-400" />
                                                                <span>{group.title}</span>
                                                            </SelectLabel>
                                                            {group.items.map((it) => (
                                                                <SelectItem
                                                                    key={it.key}
                                                                    value={it.key}
                                                                    className="text-xs font-medium py-1.5 pl-6 pr-8 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                                                >
                                                                    <div className="flex items-center justify-between gap-2 w-full">
                                                                        <span className="truncate">{it.label}</span>
                                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-normal">
                                                                            ({it.unit})
                                                                        </span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. NOTIFIKASI PENGERTIAN & DESKRIPSI INDIKATOR SESUAI FILTER */}
                    <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white p-4 sm:p-5 shadow-sm backdrop-blur-sm dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900">
                        {/* Decorative background aura */}
                        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />

                        <div className="flex flex-col sm:flex-row items-start gap-3.5 sm:gap-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#006565] text-white shadow-xs dark:bg-emerald-600">
                                <Info className="h-5 w-5" />
                            </span>

                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className="border-emerald-300 bg-emerald-100/60 text-[11px] font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                            Pengertian Indikator
                                        </Badge>
                                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                                            {summary.indicator_info.label}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-[#006565] text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full dark:bg-emerald-600">
                                            Satuan: {summary.indicator_info.unit}
                                        </Badge>
                                        <Badge variant="secondary" className="text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            Tahun {summary.year}
                                        </Badge>
                                    </div>
                                </div>

                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {summary.indicator_info.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 4. PETA SEBARAN DESA STATUS FSVA (LEAFLET JS) */}
                    <section className="space-y-3 relative z-0 isolate">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Compass className="h-5 w-5 text-[#006565] dark:text-emerald-400" />
                                    <span>Peta Spasial Ketahanan &amp; Kerentanan Pangan Desa</span>
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Batas wilayah desa dan visualisasi tingkat prioritas FSVA (Default: Indikator Komposit). Klik desa untuk melihat detail.
                                </p>
                            </div>
                        </div>

                        <FsvaMap
                            items={items}
                            selectedIndicator={summary.indicator}
                            indicatorLabel={summary.indicator_info.label}
                            selectedYear={summary.year}
                        />
                    </section>

                    {/* 5. GRAFIK BATANG & GRAFIK LINGKARAN */}
                    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Grafik Batang: Distribusi Desa Tingkat Prioritas (6 Prioritas) */}
                        <Card className="lg:col-span-7 rounded-2xl border-slate-200/80 shadow-md bg-white dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[#006565] dark:bg-emerald-950/60 dark:text-emerald-400">
                                            <BarChart3 className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <CardTitle className="text-sm font-black text-slate-900 dark:text-white">
                                                Distribusi Desa Tingkat Prioritas
                                            </CardTitle>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                Klasifikasi 6 Tingkat Prioritas Komposit FSVA
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-bold">
                                        6 Prioritas
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={priorityChartData}
                                            margin={{ top: 25, right: 20, left: 0, bottom: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                            <XAxis
                                                dataKey="short_name"
                                                tick={{ fontSize: 11, fontWeight: 600 }}
                                                interval={0}
                                                angle={-15}
                                                textAnchor="end"
                                                height={45}
                                            />
                                            <YAxis
                                                allowDecimals={false}
                                                tick={{ fontSize: 11 }}
                                                label={{ value: 'Jumlah Desa', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
                                            />
                                            <RechartsTooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload as PriorityBarItem;
                                                        return (
                                                            <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl text-xs dark:border-slate-700 dark:bg-slate-900/95">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span
                                                                        className="h-2.5 w-2.5 rounded-full"
                                                                        style={{ backgroundColor: data.color }}
                                                                    />
                                                                    <span className="font-extrabold text-slate-900 dark:text-white">
                                                                        {data.full_name}
                                                                    </span>
                                                                </div>
                                                                <p className="text-slate-600 dark:text-slate-300">
                                                                    Jumlah: <b>{data.count} Desa</b> ({data.percentage}%)
                                                                </p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                                <LabelList
                                                    dataKey="count"
                                                    position="top"
                                                    offset={6}
                                                    style={{ fontSize: 11, fontWeight: 800, fill: '#0f172a' }}
                                                    formatter={(val: any) => `${val}`}
                                                />
                                                {priorityChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Grafik Lingkaran: Ringkasan Ketahanan Pangan Desa (Rentan P1-3 vs Aman P4-6) */}
                        <Card className="lg:col-span-5 rounded-2xl border-slate-200/80 shadow-md bg-white dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-[#006565] dark:bg-teal-950/60 dark:text-teal-400">
                                            <PieChartIcon className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <CardTitle className="text-sm font-black text-slate-900 dark:text-white">
                                                Ringkasan Ketahanan Pangan Desa
                                            </CardTitle>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                Desa Rentan (P1-3) vs Desa Aman (P4-6)
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className="bg-[#006565] text-white text-[10px] font-bold">
                                        Komposit
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 flex flex-col items-center">
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={donutSummary.chart_data}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={75}
                                                paddingAngle={4}
                                                dataKey="value"
                                                label={(props: any) => `${props.value} Desa (${((props.percent || 0) * 100).toFixed(1)}%)`}
                                                labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                                            >
                                                {donutSummary.chart_data.map((entry, idx) => (
                                                    <Cell key={`donut-${idx}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const d = payload[0].payload as DonutItem;
                                                        return (
                                                            <div className="rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-xl text-xs dark:border-slate-700 dark:bg-slate-900/95">
                                                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                                                                    <span>{d.name}</span>
                                                                </div>
                                                                <div className="text-slate-600 mt-1">
                                                                    <b>{d.value} Desa</b> ({d.percentage}%)
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Custom Legend */}
                                <div className="w-full mt-2 grid grid-cols-2 gap-2 text-xs">
                                    <div className="rounded-xl bg-rose-50/80 p-2.5 border border-rose-200/60 dark:bg-rose-950/30 dark:border-rose-900">
                                        <div className="flex items-center gap-1.5 text-rose-700 font-extrabold dark:text-rose-400">
                                            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                                            <span>Desa Rentan</span>
                                        </div>
                                        <div className="mt-1 text-base font-black text-rose-800 dark:text-rose-200">
                                            {donutSummary.count_rentan} Desa
                                        </div>
                                        <span className="text-[10px] text-rose-600 dark:text-rose-400">
                                            Prioritas 1-3 ({donutSummary.percentage_rentan}%)
                                        </span>
                                    </div>

                                    <div className="rounded-xl bg-emerald-50/80 p-2.5 border border-emerald-200/60 dark:bg-emerald-950/30 dark:border-emerald-900">
                                        <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold dark:text-emerald-400">
                                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                            <span>Desa Aman / Tahan</span>
                                        </div>
                                        <div className="mt-1 text-base font-black text-emerald-800 dark:text-emerald-200">
                                            {donutSummary.count_aman} Desa
                                        </div>
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                            Prioritas 4-6 ({donutSummary.percentage_aman}%)
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* 6. 6 CARD KLASIFIKASI DESA BERDASARKAN INDIKATOR */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-[#006565] dark:text-emerald-400" />
                                    <span>6 Klasifikasi Tingkat Prioritas Desa</span>
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Rincian 6 kelas kerentanan pangan desa dan jumlah desa pada tiap prioritas
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {classificationCards.map((card) => (
                                <div
                                    key={card.priority}
                                    className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
                                >
                                    {/* Priority Accent Stripe */}
                                    <div
                                        className="absolute top-0 left-5 right-5 h-1 rounded-b-md"
                                        style={{ backgroundColor: card.color }}
                                    />

                                    <div>
                                        {/* Card Top Title & Badge */}
                                        <div className="flex items-start justify-between gap-2 pt-1 mb-2">
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                                    {card.title}
                                                </span>
                                                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                                                    {card.status}
                                                </h3>
                                            </div>
                                            <Badge
                                                className="font-bold text-[10px] shrink-0"
                                                style={{
                                                    backgroundColor: `${card.color}20`,
                                                    color: card.color,
                                                    border: `1px solid ${card.color}50`,
                                                }}
                                            >
                                                {card.category === 'rentan' ? 'Rentan' : 'Aman'}
                                            </Badge>
                                        </div>

                                        <p className="text-xs text-slate-500 leading-snug dark:text-slate-400 line-clamp-2 mb-4">
                                            {card.description}
                                        </p>

                                        {/* Count & Stats */}
                                        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800 space-y-2">
                                            <div className="flex items-baseline justify-between">
                                                <span className="text-xs font-semibold text-slate-500">
                                                    Jumlah Desa:
                                                </span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black" style={{ color: card.color }}>
                                                        {card.count}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-400">
                                                        ({card.percentage}%)
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50 dark:border-slate-700">
                                                <span className="text-slate-500 font-medium">Rata-rata IKP:</span>
                                                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                                                    {card.avg_ikp}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button: Lihat Daftar Desa */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedCardModal(card);
                                            setModalSearch('');
                                        }}
                                        className="mt-4 w-full rounded-xl text-xs font-bold border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                                    >
                                        <span>Lihat {card.count} Desa</span>
                                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 7. TABEL LENGKAP SEMUA DESA SE-KABUPATEN INDRAMAYU */}
                    <Card className="rounded-2xl border-slate-200/80 shadow-md bg-white dark:border-slate-800 dark:bg-slate-900">
                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div>
                                    <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <Wheat className="h-4.5 w-4.5 text-[#006565] dark:text-emerald-400" />
                                        <span>Tabel Lengkap Data FSVA Desa ({summary.year})</span>
                                    </CardTitle>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Menampilkan {filteredTableItems.length} dari total {items.length} desa &bull; 11 Indikator Ketahanan Pangan
                                    </p>
                                </div>

                                {/* Table Filters & Actions */}
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder="Cari desa..."
                                            value={tableSearch}
                                            onChange={(e) => {
                                                setTableSearch(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            className="h-8 w-40 sm:w-52 rounded-xl text-xs pl-8 bg-slate-50 dark:bg-slate-800"
                                        />
                                        <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                                    </div>

                                    <Select
                                        value={tableKecFilter}
                                        onValueChange={(val) => {
                                            setTableKecFilter(val);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-36 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800">
                                            <SelectValue placeholder="Kecamatan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">Semua Kecamatan</SelectItem>
                                            {kecamatanList.map((k) => (
                                                <SelectItem key={k} value={k}>
                                                    {k}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={tablePriorityFilter}
                                        onValueChange={(val) => {
                                            setTablePriorityFilter(val);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-36 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800">
                                            <SelectValue placeholder="Prioritas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">Semua Prioritas</SelectItem>
                                            {[1, 2, 3, 4, 5, 6].map((p) => (
                                                <SelectItem key={p} value={String(p)}>
                                                    Prioritas {p}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Action Buttons: Download Excel & PDF */}
                                    <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2 dark:border-slate-700">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleDownloadExcel}
                                            className="h-8 rounded-xl px-2.5 text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/50 cursor-pointer"
                                            title={`Download Data Excel FSVA Tahun ${summary.year}`}
                                        >
                                            <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                                            <span>Excel</span>
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleDownloadPdf}
                                            className="h-8 rounded-xl px-2.5 text-xs font-bold text-rose-700 border-rose-200 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/50 cursor-pointer"
                                            title={`Download / Cetak Dokumen PDF FSVA Tahun ${summary.year}`}
                                        >
                                            <Printer className="h-3.5 w-3.5 mr-1 text-rose-600" />
                                            <span>PDF</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200/80 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-800">
                                        <tr>
                                            <th className="px-3.5 py-3 whitespace-nowrap">Rank</th>
                                            <th className="px-3.5 py-3 whitespace-nowrap">Desa</th>
                                            <th className="px-3.5 py-3 whitespace-nowrap">Kecamatan</th>
                                            <th className="px-3.5 py-3 whitespace-nowrap">Prioritas FSVA</th>
                                            <th className={`px-3.5 py-3 text-right whitespace-nowrap ${summary.indicator === 'ikp' ? 'bg-emerald-50/80 text-[#006565] dark:bg-emerald-950/40 dark:text-emerald-300' : ''}`} title="Indeks Ketahanan Pangan (IKP)">IKP</th>
                                            <th className={`px-3.5 py-3 text-right whitespace-nowrap ${summary.indicator === 'ncpr' ? 'bg-emerald-50/80 text-[#006565] dark:bg-emerald-950/40 dark:text-emerald-300' : ''}`} title="Rasio Konsumsi Normatif Per Kapita (NCPR)">NCPR</th>
                                            <th className={`px-3.5 py-3 text-right whitespace-nowrap ${summary.indicator === 'energy' ? 'bg-emerald-50/80 text-[#006565] dark:bg-emerald-950/40 dark:text-emerald-300' : ''}`} title="Rasio Ketersediaan Energy (kkal/kapita/hari)">Energi</th>
                                            <th className={`px-3.5 py-3 text-right whitespace-nowrap ${summary.indicator === 'protein' ? 'bg-emerald-50/80 text-[#006565] dark:bg-emerald-950/40 dark:text-emerald-300' : ''}`} title="Rasio Ketersediaan Protein Hewani (gram/kapita/hari)">Protein</th>
                                            <th className={`px-3.5 py-3 text-right whitespace-nowrap ${summary.indicator === 'food_reserves' ? 'bg-emerald-50/80 text-[#006565] dark:bg-emerald-950/40 dark:text-emerald-300' : ''}`} title="Rasio Cadangan Beras / Cadangan Pangan (ton)">Cadangan Pangan</th>
                                            <th className={`px-3.5 py-3 text-right whitespace-nowrap ${summary.indicator === 'poverty' ? 'bg-emerald-50/80 text-[#006565] dark:bg-emerald-950/40 dark:text-emerald-300' : ''}`} title="Persentase Penduduk Miskin (%)">Kemiskinan</th>
                                            <th className={`px-3.5 py-3 text-right whitespace-nowrap ${summary.indicator === 'price_cv' ? 'bg-emerald-50/80 text-[#006565] dark:bg-emerald-950/40 dark:text-emerald-300' : ''}`} title="Koefisien Variasi Harga Pangan (%)">Variasi Harga</th>
                                            <th className={`px-3.5 py-3 text-right whitespace-nowrap ${summary.indicator === 'pou' ? 'bg-emerald-50/80 text-[#006565] dark:bg-emerald-950/40 dark:text-emerald-300' : ''}`} title="Prevalence of Undernourishment (PoU) (%)">PoU</th>
                                            <th className={`px-3.5 py-3 text-right whitespace-nowrap ${summary.indicator === 'female_school' ? 'bg-emerald-50/80 text-[#006565] dark:bg-emerald-950/40 dark:text-emerald-300' : ''}`} title="Rata-rata Lama Sekolah Perempuan (tahun)">Sekolah Perempuan</th>
                                            <th className={`px-3.5 py-3 text-right whitespace-nowrap ${summary.indicator === 'no_water' ? 'bg-emerald-50/80 text-[#006565] dark:bg-emerald-950/40 dark:text-emerald-300' : ''}`} title="Persentase Rumah Tangga Tanpa Akses Air Bersih (%)">Tanpa Air Bersih</th>
                                            <th className={`px-3.5 py-3 text-right whitespace-nowrap ${summary.indicator === 'pph' ? 'bg-emerald-50/80 text-[#006565] dark:bg-emerald-950/40 dark:text-emerald-300' : ''}`} title="Skor Pola Pangan Harapan (PPH) Konsumsi">Skor PPH</th>
                                            <th className={`px-3.5 py-3 text-right whitespace-nowrap ${summary.indicator === 'stunting' ? 'bg-emerald-50/80 text-[#006565] dark:bg-emerald-950/40 dark:text-emerald-300' : ''}`} title="Persentase Balita Stunting (%)">Stunting</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                        {paginatedTableItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={16} className="px-4 py-8 text-center text-slate-500">
                                                    Tidak ada desa yang cocok dengan filter.
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedTableItems.map((v) => {
                                                const pInfo = classificationCards.find((c) => c.priority === v.komposit);
                                                return (
                                                    <tr
                                                        key={v.id}
                                                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                                                    >
                                                        <td className="px-3.5 py-2.5 font-bold text-slate-400 whitespace-nowrap">
                                                            #{v.rank ?? '-'}
                                                        </td>
                                                        <td className="px-3.5 py-2.5 font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                                                            {v.desa}
                                                        </td>
                                                        <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                                            {v.kecamatan}
                                                        </td>
                                                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                                                            <span
                                                                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black"
                                                                style={{
                                                                    backgroundColor: `${pInfo?.color}18`,
                                                                    color: pInfo?.color,
                                                                    border: `1px solid ${pInfo?.color}40`,
                                                                }}
                                                            >
                                                                <span
                                                                    className="h-1.5 w-1.5 rounded-full"
                                                                    style={{ backgroundColor: pInfo?.color }}
                                                                />
                                                                <span>P{v.komposit} - {pInfo?.status}</span>
                                                            </span>
                                                        </td>
                                                        <td className={`px-3.5 py-2.5 text-right font-black whitespace-nowrap ${summary.indicator === 'ikp' ? 'bg-emerald-50/80 dark:bg-emerald-950/30 text-[#006565] dark:text-emerald-300' : 'text-[#006565] dark:text-emerald-400'}`}>
                                                            {v.ikp ?? '-'}
                                                        </td>
                                                        <td className={`px-3.5 py-2.5 text-right whitespace-nowrap ${summary.indicator === 'ncpr' ? 'bg-emerald-50/80 dark:bg-emerald-950/30 font-bold text-[#006565] dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            {v.ncpr ?? '-'}
                                                        </td>
                                                        <td className={`px-3.5 py-2.5 text-right whitespace-nowrap ${summary.indicator === 'energy' ? 'bg-emerald-50/80 dark:bg-emerald-950/30 font-bold text-[#006565] dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            {v.energy ?? '-'}
                                                        </td>
                                                        <td className={`px-3.5 py-2.5 text-right whitespace-nowrap ${summary.indicator === 'protein' ? 'bg-emerald-50/80 dark:bg-emerald-950/30 font-bold text-[#006565] dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            {v.protein ?? '-'}
                                                        </td>
                                                        <td className={`px-3.5 py-2.5 text-right whitespace-nowrap ${summary.indicator === 'food_reserves' ? 'bg-emerald-50/80 dark:bg-emerald-950/30 font-bold text-[#006565] dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            {v.food_reserves ?? '-'}
                                                        </td>
                                                        <td className={`px-3.5 py-2.5 text-right whitespace-nowrap ${summary.indicator === 'poverty' ? 'bg-emerald-50/80 dark:bg-emerald-950/30 font-bold text-[#006565] dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            {v.poverty !== null && v.poverty !== undefined ? `${v.poverty}%` : '-'}
                                                        </td>
                                                        <td className={`px-3.5 py-2.5 text-right whitespace-nowrap ${summary.indicator === 'price_cv' ? 'bg-emerald-50/80 dark:bg-emerald-950/30 font-bold text-[#006565] dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            {v.price_cv !== null && v.price_cv !== undefined ? `${v.price_cv}%` : '-'}
                                                        </td>
                                                        <td className={`px-3.5 py-2.5 text-right whitespace-nowrap ${summary.indicator === 'pou' ? 'bg-emerald-50/80 dark:bg-emerald-950/30 font-bold text-[#006565] dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            {v.pou !== null && v.pou !== undefined ? `${v.pou}%` : '-'}
                                                        </td>
                                                        <td className={`px-3.5 py-2.5 text-right whitespace-nowrap ${summary.indicator === 'female_school' ? 'bg-emerald-50/80 dark:bg-emerald-950/30 font-bold text-[#006565] dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            {v.female_school ?? '-'}
                                                        </td>
                                                        <td className={`px-3.5 py-2.5 text-right whitespace-nowrap ${summary.indicator === 'no_water' ? 'bg-emerald-50/80 dark:bg-emerald-950/30 font-bold text-[#006565] dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            {v.no_water !== null && v.no_water !== undefined ? `${v.no_water}%` : '-'}
                                                        </td>
                                                        <td className={`px-3.5 py-2.5 text-right whitespace-nowrap ${summary.indicator === 'pph' ? 'bg-emerald-50/80 dark:bg-emerald-950/30 font-bold text-[#006565] dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            {v.pph ?? '-'}
                                                        </td>
                                                        <td className={`px-3.5 py-2.5 text-right whitespace-nowrap ${summary.indicator === 'stunting' ? 'bg-emerald-50/80 dark:bg-emerald-950/30 font-bold text-[#006565] dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            {v.stunting !== null && v.stunting !== undefined ? `${v.stunting}%` : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800 text-xs">
                                    <span className="text-slate-500">
                                        Halaman {currentPage} dari {totalPages}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={currentPage <= 1}
                                            onClick={() => setCurrentPage((p) => p - 1)}
                                            className="h-7 rounded-lg text-xs"
                                        >
                                            Sebelumnya
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={currentPage >= totalPages}
                                            onClick={() => setCurrentPage((p) => p + 1)}
                                            className="h-7 rounded-lg text-xs"
                                        >
                                            Berikutnya
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Modal: Daftar Desa dalam Prioritas */}
            <Dialog open={!!selectedCardModal} onOpenChange={(open) => !open && setSelectedCardModal(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col rounded-2xl">
                    <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span
                                    className="h-3.5 w-3.5 rounded-full"
                                    style={{ backgroundColor: selectedCardModal?.color }}
                                />
                                <DialogTitle className="text-base font-black">
                                    {selectedCardModal?.full_title}
                                </DialogTitle>
                            </div>
                            <Badge
                                className="font-bold text-xs"
                                style={{
                                    backgroundColor: `${selectedCardModal?.color}20`,
                                    color: selectedCardModal?.color,
                                }}
                            >
                                {selectedCardModal?.count} Desa
                            </Badge>
                        </div>
                        <DialogDescription className="text-xs">
                            {selectedCardModal?.description}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Search inside modal */}
                    <div className="py-2">
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="Cari desa / kecamatan..."
                                value={modalSearch}
                                onChange={(e) => setModalSearch(e.target.value)}
                                className="h-9 rounded-xl text-xs pl-8"
                            />
                            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        </div>
                    </div>

                    {/* Village list scroll */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 dark:divide-slate-800">
                        {filteredModalVillages.length === 0 ? (
                            <div className="py-8 text-center text-xs text-slate-500">
                                Tidak ada desa yang cocok.
                            </div>
                        ) : (
                            filteredModalVillages.map((v) => (
                                <div
                                    key={v.id}
                                    className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 rounded-xl transition-colors dark:hover:bg-slate-800"
                                >
                                    <div>
                                        <div className="text-xs font-black text-slate-900 dark:text-white">
                                            DESA {v.desa}
                                        </div>
                                        <div className="text-[11px] font-semibold text-slate-500">
                                            Kecamatan {v.kecamatan}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-black text-[#006565] dark:text-emerald-400">
                                            IKP: {v.ikp ?? '-'}
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                            Peringkat #{v.rank ?? '-'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Footer */}
            <PortalFooter />
        </div>
    );
}

