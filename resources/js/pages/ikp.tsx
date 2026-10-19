import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    Award,
    BarChart2,
    Beef,
    CheckCircle2,
    ChevronRight,
    Download,
    Droplets,
    ExternalLink,
    FileSpreadsheet,
    Flame,
    GraduationCap,
    HeartPulse,
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
    Wallet,
    Warehouse,
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
    indeks_ketersediaan?: number | null;
    indeks_keterjangkauan?: number | null;
    indeks_pemanfaatan?: number | null;
    kelompok_ikp?: string | null;
    status_kerentanan?: string | null;
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

function getKelompokBadge(kelompok?: string | null) {
    if (!kelompok) {
        return {
            label: '-',
            className:
                'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        };
    }
    switch (kelompok) {
        case 'Kelompok 6':
            return {
                label: kelompok,
                className:
                    'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
            };
        case 'Kelompok 5':
            return {
                label: kelompok,
                className:
                    'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
            };
        case 'Kelompok 4':
            return {
                label: kelompok,
                className:
                    'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
            };
        case 'Kelompok 3':
            return {
                label: kelompok,
                className:
                    'bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
            };
        case 'Kelompok 2':
        case 'Kelompok 1':
            return {
                label: kelompok,
                className:
                    'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
            };
        default:
            return {
                label: kelompok,
                className:
                    'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
            };
    }
}

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

    const handleDownloadExcel = () => {
        const headers = [
            'No',
            'Tahun Evaluasi',
            'Nilai IKP',
            'Target RENSTRA',
            'Deviasi (Poin)',
            'Capaian (%)',
            'Indeks Ketersediaan',
            'Indeks Keterjangkauan',
            'Indeks Pemanfaatan',
            'Kelompok IKP',
            'Status Kerentanan',
            'Keterangan',
        ];

        const rows = yearlyScores.map((row, idx) => [
            idx + 1,
            row.tahun,
            row.nilai_ikp.toFixed(2),
            row.target_renstra.toFixed(2),
            `${row.diff_renstra >= 0 ? '+' : ''}${row.diff_renstra.toFixed(2)}`,
            `${row.capaian_percentage.toFixed(1)}%`,
            row.indeks_ketersediaan !== null && row.indeks_ketersediaan !== undefined
                ? row.indeks_ketersediaan.toFixed(2)
                : '-',
            row.indeks_keterjangkauan !== null && row.indeks_keterjangkauan !== undefined
                ? row.indeks_keterjangkauan.toFixed(2)
                : '-',
            row.indeks_pemanfaatan !== null && row.indeks_pemanfaatan !== undefined
                ? row.indeks_pemanfaatan.toFixed(2)
                : '-',
            `"${row.kelompok_ikp || '-'}"`,
            `"${row.status_kerentanan || row.status}"`,
            `"${(row.keterangan || '-').replace(/"/g, '""')}"`,
        ]);

        const avgDeviasi = summary.avg_nilai_ikp - summary.avg_target_renstra;
        const avgCapaian =
            summary.avg_target_renstra > 0
                ? (summary.avg_nilai_ikp / summary.avg_target_renstra) * 100
                : 100;

        const summaryRow = [
            '',
            '"RATA-RATA"',
            summary.avg_nilai_ikp.toFixed(2),
            summary.avg_target_renstra.toFixed(2),
            `${avgDeviasi >= 0 ? '+' : ''}${avgDeviasi.toFixed(2)}`,
            `${avgCapaian.toFixed(1)}%`,
            '-',
            '-',
            '-',
            '-',
            `"${summary.latest_status}"`,
            '""',
        ];

        const csvContent =
            '\uFEFF' +
            [
                '"LAPORAN CAPAIAN INDEKS KETAHANAN PANGAN (IKP) DAN TARGET RENSTRA"',
                '"DINAS KETAHANAN PANGAN DAN PERTANIAN KABUPATEN INDRAMAYU"',
                `"Tahun Terkini: ${summary.latest_year} | Rata-rata IKP: ${summary.avg_nilai_ikp.toFixed(2)} | Target Renstra: ${summary.avg_target_renstra.toFixed(2)}"`,
                '',
                headers.join(','),
                ...rows.map((r) => r.join(',')),
                summaryRow.join(','),
            ].join('\r\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute(
            'download',
            `Capaian_IKP_dan_Target_Renstra_Indramayu_${summary.latest_year}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDownloadPdf = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Mohon izinkan pop-up browser untuk mencetak / mendownload PDF.');
            return;
        }

        const formattedToday = new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        const avgDeviasi = summary.avg_nilai_ikp - summary.avg_target_renstra;
        const avgCapaian =
            summary.avg_target_renstra > 0
                ? (summary.avg_nilai_ikp / summary.avg_target_renstra) * 100
                : 100;

        let tableRowsHtml = '';
        yearlyScores.forEach((row, idx) => {
            const isAchieved = row.diff_renstra >= 0;
            const diffColor = isAchieved ? '#059669' : '#dc2626';
            const diffSign = isAchieved ? '+' : '';
            const statusBadgeColor = isAchieved
                ? 'background:#d1fae5;color:#065f46;border:1px solid #a7f3d0;'
                : 'background:#fee2e2;color:#991b1b;border:1px solid #fecaca;';

            const ketersediaan =
                row.indeks_ketersediaan !== null && row.indeks_ketersediaan !== undefined
                    ? row.indeks_ketersediaan.toFixed(2)
                    : '-';
            const keterjangkauan =
                row.indeks_keterjangkauan !== null && row.indeks_keterjangkauan !== undefined
                    ? row.indeks_keterjangkauan.toFixed(2)
                    : '-';
            const pemanfaatan =
                row.indeks_pemanfaatan !== null && row.indeks_pemanfaatan !== undefined
                    ? row.indeks_pemanfaatan.toFixed(2)
                    : '-';
            const kelompok = row.kelompok_ikp || '-';
            const status = row.status_kerentanan || row.status;

            tableRowsHtml += `
                <tr>
                    <td style="text-align:center;color:#64748b;">${idx + 1}</td>
                    <td style="text-align:center;font-weight:bold;color:#0f172a;">${row.tahun}</td>
                    <td style="text-align:right;font-weight:bold;color:#047857;font-family:monospace;">${row.nilai_ikp.toFixed(2)}</td>
                    <td style="text-align:right;font-weight:600;color:#334155;font-family:monospace;">${row.target_renstra.toFixed(2)}</td>
                    <td style="text-align:right;font-weight:bold;color:${diffColor};font-family:monospace;">
                        ${diffSign}${row.diff_renstra.toFixed(2)}
                    </td>
                    <td style="text-align:center;">
                        <span style="padding:2px 6px;border-radius:10px;font-size:6.5pt;font-weight:bold;${statusBadgeColor}">
                            ${row.capaian_percentage.toFixed(1)}%
                        </span>
                    </td>
                    <td style="text-align:right;font-family:monospace;color:#065f46;">${ketersediaan}</td>
                    <td style="text-align:right;font-family:monospace;color:#0369a1;">${keterjangkauan}</td>
                    <td style="text-align:right;font-family:monospace;color:#b45309;">${pemanfaatan}</td>
                    <td style="text-align:center;font-weight:600;">${kelompok}</td>
                    <td style="text-align:center;font-weight:600;color:#0f172a;">${status}</td>
                    <td style="color:#64748b;font-size:7pt;">${row.keterangan || '-'}</td>
                </tr>
            `;
        });

        const printHtml = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8"/>
            <title>Laporan_Capaian_IKP_dan_Target_Renstra_${summary.latest_year}</title>
            <style>
                @page {
                    size: A4 landscape;
                    margin: 10mm 12mm;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    margin: 0;
                    padding: 16px;
                    color: #0f172a;
                    font-size: 8pt;
                    background: #fff;
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
                    background: #006565;
                    color: white;
                    border: none;
                    padding: 7px 16px;
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
                .kop-container {
                    text-align: center;
                    margin-bottom: 12px;
                    border-bottom: 3px double #006565;
                    padding-bottom: 8px;
                }
                .kop-sub {
                    font-size: 9pt;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: #334155;
                    margin: 0;
                    letter-spacing: 0.5px;
                }
                .kop-main {
                    font-size: 14pt;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: #006565;
                    margin: 2px 0;
                    letter-spacing: 0.5px;
                }
                .kop-address {
                    font-size: 7.5pt;
                    color: #64748b;
                    margin: 0;
                }
                .title-section {
                    text-align: center;
                    margin: 12px 0;
                }
                .title-section h1 {
                    margin: 0;
                    font-size: 11.5pt;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: #0f172a;
                }
                .title-section p {
                    margin: 3px 0 0 0;
                    font-size: 8pt;
                    color: #475569;
                }
                .summary-box {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 8px;
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    padding: 10px 14px;
                    border-radius: 8px;
                    margin-bottom: 14px;
                }
                .summary-item {
                    text-align: center;
                }
                .summary-item .label {
                    font-size: 7pt;
                    color: #166534;
                    text-transform: uppercase;
                    font-weight: bold;
                }
                .summary-item .val {
                    font-size: 11pt;
                    font-weight: 800;
                    color: #14532d;
                    font-family: monospace;
                    margin-top: 2px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 8px;
                    font-size: 7.5pt;
                }
                th {
                    background-color: #006565;
                    color: white;
                    border: 1px solid #004d4d;
                    padding: 6px 6px;
                    font-weight: bold;
                    text-align: center;
                    font-size: 7pt;
                    text-transform: uppercase;
                }
                td {
                    border: 1px solid #cbd5e1;
                    padding: 5px 6px;
                }
                tr:nth-child(even) td {
                    background-color: #f8fafc;
                }
                tfoot tr td {
                    background-color: #ecfdf5;
                    font-weight: bold;
                    border-top: 2px solid #006565;
                }
                .footer-sign {
                    margin-top: 24px;
                    display: flex;
                    justify-content: flex-end;
                }
                .sign-box {
                    text-align: center;
                    width: 250px;
                    font-size: 7.5pt;
                }
                .footer-meta {
                    margin-top: 20px;
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
                    Tips: Pada dialog print browser, pilih printer <strong>Save as PDF (Simpan sebagai PDF)</strong>.
                </span>
            </div>

            <div class="kop-container">
                <p class="kop-sub">Pemerintah Kabupaten Indramayu</p>
                <h2 class="kop-main">Dinas Ketahanan Pangan dan Pertanian</h2>
                <p class="kop-address">Jl. MT Haryono No. 1, Sindang, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat 45222 | Laman: dkpp.indramayukab.go.id</p>
            </div>

            <div class="title-section">
                <h1>Laporan Capaian Indeks Ketahanan Pangan (IKP) dan Target Renstra</h1>
                <p>Kabupaten Indramayu - Tahun Evaluasi ${summary.latest_year}</p>
            </div>

            <div class="summary-box">
                <div class="summary-item">
                    <div class="label">Skor IKP Terkini (${summary.latest_year})</div>
                    <div class="val">${summary.latest_nilai_ikp.toFixed(2)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">Target RENSTRA</div>
                    <div class="val">${summary.latest_target_renstra.toFixed(2)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">Deviasi Capaian</div>
                    <div class="val" style="color:${summary.latest_diff_renstra >= 0 ? '#047857' : '#e11d48'};">
                        ${summary.latest_diff_renstra >= 0 ? '+' : ''}${summary.latest_diff_renstra.toFixed(2)}
                    </div>
                </div>
                <div class="summary-item">
                    <div class="label">Status Ketahanan</div>
                    <div class="val" style="font-size:9.5pt;padding-top:2px;">${summary.latest_status}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 24px;">No</th>
                        <th style="width: 60px;">Tahun</th>
                        <th>Nilai IKP</th>
                        <th>Target RENSTRA</th>
                        <th>Deviasi</th>
                        <th>Capaian</th>
                        <th>Ketersediaan</th>
                        <th>Keterjangkauan</th>
                        <th>Pemanfaatan</th>
                        <th>Kelompok IKP</th>
                        <th>Status Kerentanan</th>
                        <th>Keterangan</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2" style="text-align:center;font-weight:bold;">RATA-RATA</td>
                        <td style="text-align:right;font-family:monospace;color:#047857;">${summary.avg_nilai_ikp.toFixed(2)}</td>
                        <td style="text-align:right;font-family:monospace;">${summary.avg_target_renstra.toFixed(2)}</td>
                        <td style="text-align:right;font-family:monospace;color:${avgDeviasi >= 0 ? '#047857' : '#e11d48'};">
                            ${avgDeviasi >= 0 ? '+' : ''}${avgDeviasi.toFixed(2)}
                        </td>
                        <td style="text-align:center;">${avgCapaian.toFixed(1)}%</td>
                        <td colspan="3" style="text-align:center;color:#64748b;font-size:7pt;">Integrasi 3 Pilar Komposit</td>
                        <td style="text-align:center;">-</td>
                        <td style="text-align:center;">${summary.latest_status}</td>
                        <td style="color:#64748b;font-size:7pt;">Rata-rata Historis ${summary.total_years} Tahun</td>
                    </tr>
                </tfoot>
            </table>

            <div class="footer-meta">
                <span>Dokumen resmi hasil pemantauan Indeks Ketahanan Pangan (IKP) Kabupaten Indramayu</span>
                <span>Dicetak pada: ${formattedToday}</span>
            </div>
        </body>
        </html>
        `;

        printWindow.document.open();
        printWindow.document.write(printHtml);
        printWindow.document.close();
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
                        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadExcel}
                                className="gap-2 rounded-xl text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/80 shadow-xs cursor-pointer"
                                title="Download data capaian IKP format Excel (.csv)"
                            >
                                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                <span>Download Excel</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadPdf}
                                className="gap-2 rounded-xl text-xs font-bold border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/80 shadow-xs cursor-pointer"
                                title="Download dokumen laporan format PDF"
                            >
                                <Download className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                <span>Download PDF</span>
                            </Button>
                        </div>
                    </div>

                    <Card className="overflow-hidden rounded-3xl border-slate-200/90 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300">
                                    <tr>
                                        <th className="px-3.5 py-4 text-center">No</th>
                                        <th className="px-3.5 py-4">Tahun Evaluasi</th>
                                        <th className="px-3.5 py-4 text-right">Nilai IKP</th>
                                        <th className="px-3.5 py-4 text-right">Target RENSTRA</th>
                                        <th className="px-3.5 py-4 text-right">Deviasi</th>
                                        <th className="px-3.5 py-4 text-center">Capaian (%)</th>
                                        <th className="px-3.5 py-4 text-right">Indeks Ketersediaan</th>
                                        <th className="px-3.5 py-4 text-right">Indeks Keterjangkauan</th>
                                        <th className="px-3.5 py-4 text-right">Indeks Pemanfaatan</th>
                                        <th className="px-3.5 py-4 text-center">Kelompok IKP</th>
                                        <th className="px-3.5 py-4">Status Kerentanan</th>
                                        <th className="px-3.5 py-4">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {yearlyScores.map((row, idx) => {
                                        const badge = getCategoryBadge(row.status_kerentanan || row.status);
                                        const kelompokBadge = getKelompokBadge(row.kelompok_ikp);
                                        return (
                                            <tr
                                                key={row.id}
                                                className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-850/50"
                                            >
                                                <td className="px-3.5 py-3.5 text-center text-slate-400 font-medium">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-3.5 py-3.5 font-extrabold text-slate-900 dark:text-white">
                                                    {row.tahun}
                                                </td>
                                                <td className="px-3.5 py-3.5 text-right font-black text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                                                    {row.nilai_ikp.toFixed(2)}
                                                </td>
                                                <td className="px-3.5 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-300 font-mono text-sm">
                                                    {row.target_renstra.toFixed(2)}
                                                </td>
                                                <td className="px-3.5 py-3.5 text-right font-bold font-mono">
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
                                                <td className="px-3.5 py-3.5 text-center">
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
                                                <td className="px-3.5 py-3.5 text-right font-mono font-semibold text-emerald-800 dark:text-emerald-300">
                                                    {row.indeks_ketersediaan !== null && row.indeks_ketersediaan !== undefined
                                                        ? row.indeks_ketersediaan.toFixed(2)
                                                        : '-'}
                                                </td>
                                                <td className="px-3.5 py-3.5 text-right font-mono font-semibold text-sky-800 dark:text-sky-300">
                                                    {row.indeks_keterjangkauan !== null && row.indeks_keterjangkauan !== undefined
                                                        ? row.indeks_keterjangkauan.toFixed(2)
                                                        : '-'}
                                                </td>
                                                <td className="px-3.5 py-3.5 text-right font-mono font-semibold text-amber-800 dark:text-amber-300">
                                                    {row.indeks_pemanfaatan !== null && row.indeks_pemanfaatan !== undefined
                                                        ? row.indeks_pemanfaatan.toFixed(2)
                                                        : '-'}
                                                </td>
                                                <td className="px-3.5 py-3.5 text-center">
                                                    <Badge
                                                        variant="outline"
                                                        className={`font-mono text-[10px] font-bold whitespace-nowrap ${kelompokBadge.className}`}
                                                    >
                                                        {kelompokBadge.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-3.5 py-3.5">
                                                    <Badge
                                                        variant="outline"
                                                        className={`font-bold text-[11px] whitespace-nowrap ${badge.badgeClass}`}
                                                    >
                                                        {badge.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-3.5 py-3.5 text-slate-500 max-w-xs truncate dark:text-slate-400">
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

                {/* 3. Edukasi: 3 Pilar Utama & 11 Indikator Penilaian IKP (Bapanas 2026) */}
                <section className="space-y-8">
                    {/* Header Section with Context Badges */}
                    <div className="text-center max-w-3xl mx-auto space-y-3">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <Badge className="bg-emerald-100 text-[#006565] border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400">
                                <Sparkles className="h-3 w-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                                Pemutakhiran Metodologi Bapanas 2026
                            </Badge>
                            <Badge variant="outline" className="border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                                Penyusunan FSVA Kab/Kota
                            </Badge>
                            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                11 Indikator Komposit Nasional
                            </Badge>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            3 Pilar Utama &amp; 11 Indikator Penilaian IKP
                        </h2>

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            Berdasarkan Peraturan dan Pedoman Teknis <strong>Badan Pangan Nasional (Bapanas) tahun 2026</strong> untuk penyusunan <em>Food Security and Vulnerability Atlas</em> (FSVA) tingkat Kabupaten/Kota, evaluasi IKP kini menggunakan <strong>11 indikator komposit</strong> yang mengintegrasikan tiga subsistem pangan utama secara holistik dan terukur.
                        </p>

                        {/* Quick Distribution Chips */}
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                                <Wheat className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Pilar 1: Ketersediaan (4 Indikator)</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold text-sky-800 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800">
                                <Store className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                                <span>Pilar 2: Keterjangkauan (3 Indikator)</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                                <Utensils className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                <span>Pilar 3: Pemanfaatan (4 Indikator)</span>
                            </span>
                        </div>
                    </div>

                    {/* 3 Pillar Cards Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch">
                        {/* PILAR 1: KETERSEDIAAN PANGAN (4 INDIKATOR) */}
                        <Card className="rounded-3xl border-emerald-200/90 bg-gradient-to-b from-emerald-500/[0.04] via-white to-white shadow-xl shadow-emerald-500/[0.05] hover:shadow-2xl hover:border-emerald-300 transition-all duration-300 dark:border-emerald-800/60 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 flex flex-col overflow-hidden">
                            {/* Card Top Accent & Header */}
                            <div className="p-6 border-b border-emerald-100 dark:border-emerald-900/40 relative">
                                <div className="flex items-center justify-between gap-2 mb-4">
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100/90 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200">
                                        Pilar 01
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                                        4 Indikator
                                    </span>
                                </div>

                                <div className="flex items-center gap-3.5">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-[#006565] text-white shadow-lg shadow-emerald-600/25">
                                        <Wheat className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                            Ketersediaan Pangan
                                        </h3>
                                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 italic">
                                            Food Availability
                                        </p>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-3">
                                    Mengukur kecukupan pasokan fisik pangan dari produksi wilayah, neraca pasokan makro, kecukupan energi dan protein, serta cadangan pangan pemerintah daerah.
                                </p>
                            </div>

                            {/* Indicators List */}
                            <div className="p-5 space-y-3 flex-1">
                                <div className="text-[11px] font-black uppercase tracking-wider text-emerald-800/80 dark:text-emerald-400">
                                    Daftar Indikator Komposit:
                                </div>

                                {/* Indikator 1 */}
                                <div className="group rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition-all dark:border-slate-800 dark:bg-slate-850/60 dark:hover:bg-slate-800 dark:hover:border-emerald-700">
                                    <div className="flex items-start gap-2.5">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[11px] font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                            01
                                        </span>
                                        <div className="space-y-1 flex-1">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#006565] dark:group-hover:text-emerald-300 transition-colors">
                                                Rasio Konsumsi Normatif vs Ketersediaan Bersih
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Perbandingan antara penyediaan bersih serealia (terutama beras) terhadap kebutuhan konsumsi normatif tahunan penduduk.
                                            </p>
                                            <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800">
                                                Target Rasio ≥ 1.0 (Surplus)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Indikator 2 */}
                                <div className="group rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition-all dark:border-slate-800 dark:bg-slate-850/60 dark:hover:bg-slate-800 dark:hover:border-emerald-700">
                                    <div className="flex items-start gap-2.5">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[11px] font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                            02
                                        </span>
                                        <div className="space-y-1 flex-1">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#006565] dark:group-hover:text-emerald-300 transition-colors">
                                                Rasio Ketersediaan Energi terhadap Standar AKE
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Pemenuhan pasokan kalori energi pangan harian per kapita disandingkan terhadap Angka Kecukupan Energi (AKE) nasional.
                                            </p>
                                            <span className="inline-block rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200/60 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800">
                                                Standar AKE: 2.100 kkal/kap/hari
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Indikator 3 */}
                                <div className="group rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition-all dark:border-slate-800 dark:bg-slate-850/60 dark:hover:bg-slate-800 dark:hover:border-emerald-700">
                                    <div className="flex items-start gap-2.5">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[11px] font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                            03
                                        </span>
                                        <div className="space-y-1 flex-1">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#006565] dark:group-hover:text-emerald-300 transition-colors">
                                                Rasio Ketersediaan Protein Hewani per Kapita
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Kecukupan asam amino esensial dan protein bersumber hewani (daging, telur, ikan, susu) untuk daya tahan tubuh &amp; cegah stunting.
                                            </p>
                                            <span className="inline-block rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-200/60 dark:bg-teal-950/80 dark:text-teal-300 dark:border-teal-800">
                                                Mutu Protein &amp; Asam Amino Esensial
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Indikator 4 */}
                                <div className="group rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition-all dark:border-slate-800 dark:bg-slate-850/60 dark:hover:bg-slate-800 dark:hover:border-emerald-700">
                                    <div className="flex items-start gap-2.5">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[11px] font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                            04
                                        </span>
                                        <div className="space-y-1 flex-1">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#006565] dark:group-hover:text-emerald-300 transition-colors">
                                                Rasio Cadangan Pangan Pemerintah Daerah (CPPD)
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Stok beras penyangga milik pemerintah daerah terhadap target ketentuan regulasi untuk kesiapsiagaan darurat paceklik dan bencana.
                                            </p>
                                            <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800">
                                                Buffer Stock Kesiapsiagaan Darurat
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer: Regional Context Indramayu */}
                            <div className="p-4 mx-4 mb-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 dark:bg-emerald-950/40 dark:border-emerald-800/60 text-xs">
                                <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                                    <Wheat className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                                    <span>Kekuatan Utama Indramayu</span>
                                </div>
                                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                                    Sebagai sentra lumbung padi nasional dengan produksi &gt; 1,3 juta ton GKG/tahun, Indramayu memiliki pilar ketersediaan sangat kokoh dengan rasio swasembada beras tertinggi di Jawa Barat.
                                </p>
                            </div>
                        </Card>

                        {/* PILAR 2: KETERJANGKAUAN PANGAN (3 INDIKATOR) */}
                        <Card className="rounded-3xl border-sky-200/90 bg-gradient-to-b from-sky-500/[0.04] via-white to-white shadow-xl shadow-sky-500/[0.05] hover:shadow-2xl hover:border-sky-300 transition-all duration-300 dark:border-sky-800/60 dark:from-sky-950/30 dark:via-slate-900 dark:to-slate-900 flex flex-col overflow-hidden">
                            {/* Card Top Accent & Header */}
                            <div className="p-6 border-b border-sky-100 dark:border-sky-900/40 relative">
                                <div className="flex items-center justify-between gap-2 mb-4">
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-100/90 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-sky-900 dark:bg-sky-900/60 dark:text-sky-200">
                                        Pilar 02
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 border border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800">
                                        3 Indikator
                                    </span>
                                </div>

                                <div className="flex items-center gap-3.5">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-teal-600 text-white shadow-lg shadow-sky-600/25">
                                        <Store className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                            Keterjangkauan Pangan
                                        </h3>
                                        <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 italic">
                                            Food Access
                                        </p>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-3">
                                    Mengukur akses fisik dan daya beli ekonomi masyarakat untuk memperoleh pangan yang cukup, aman, dan bergizi di tengah dinamika harga dan kondisi sosial-ekonomi.
                                </p>
                            </div>

                            {/* Indicators List */}
                            <div className="p-5 space-y-3 flex-1">
                                <div className="text-[11px] font-black uppercase tracking-wider text-sky-800/80 dark:text-sky-400">
                                    Daftar Indikator Komposit:
                                </div>

                                {/* Indikator 5 */}
                                <div className="group rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 hover:bg-white hover:border-sky-300 hover:shadow-xs transition-all dark:border-slate-800 dark:bg-slate-850/60 dark:hover:bg-slate-800 dark:hover:border-sky-700">
                                    <div className="flex items-start gap-2.5">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-[11px] font-black text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                                            05
                                        </span>
                                        <div className="space-y-1 flex-1">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                                                Persentase Penduduk Kesejahteraan Rendah
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Proporsi penduduk berpendapatan rendah / di bawah garis kemiskinan dengan alokasi pengeluaran makanan dominan yang rentan fluktuasi ekonomi.
                                            </p>
                                            <span className="inline-block rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800 border border-sky-200/60 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800">
                                                BPS &amp; Data Kemiskinan / Desil 1-4 P3KE
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Indikator 6 */}
                                <div className="group rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 hover:bg-white hover:border-sky-300 hover:shadow-xs transition-all dark:border-slate-800 dark:bg-slate-850/60 dark:hover:bg-slate-800 dark:hover:border-sky-700">
                                    <div className="flex items-start gap-2.5">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-[11px] font-black text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                                            06
                                        </span>
                                        <div className="space-y-1 flex-1">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                                                Koefisien Variasi (CV) Harga Pangan Pokok
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Mengukur tingkat volatilitas dan stabilitas disparitas harga pangan pokok penting (beras, minyak goreng, telur ayam ras) antarwaktu dan antarwilayah.
                                            </p>
                                            <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-800 border border-indigo-200/60 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800">
                                                Stabilitas &amp; Disparitas Harga Pasar
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Indikator 7 */}
                                <div className="group rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 hover:bg-white hover:border-sky-300 hover:shadow-xs transition-all dark:border-slate-800 dark:bg-slate-850/60 dark:hover:bg-slate-800 dark:hover:border-sky-700">
                                    <div className="flex items-start gap-2.5">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-[11px] font-black text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                                            07
                                        </span>
                                        <div className="space-y-1 flex-1">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                                                Prevalence of Undernourishment (PoU)
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Proporsi populasi yang konsumsi energi hariannya di bawah batas kebutuhan energi minimum (MDER / Minimum Dietary Energy Requirement).
                                            </p>
                                            <span className="inline-block rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-200/60 dark:bg-teal-950/80 dark:text-teal-300 dark:border-teal-800">
                                                Standar Global FAO &amp; Bapanas
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer: Regional Context Indramayu */}
                            <div className="p-4 mx-4 mb-4 rounded-2xl bg-sky-50/70 border border-sky-200/70 dark:bg-sky-950/40 dark:border-sky-800/60 text-xs">
                                <div className="flex items-center gap-2 font-bold text-sky-900 dark:text-sky-200 mb-1">
                                    <Store className="h-4 w-4 text-sky-700 dark:text-sky-400" />
                                    <span>Fokus Stabilisasi Pasar</span>
                                </div>
                                <p className="text-[11px] text-sky-800/80 dark:text-sky-300/80 leading-relaxed">
                                    Pelaksanaan Gerakan Pangan Murah (GPM) berkala, pemantauan harga harian di Pasar Indramayu, serta penguatan penyaluran beras SPHP untuk menjaga daya beli keluarga.
                                </p>
                            </div>
                        </Card>

                        {/* PILAR 3: PEMANFAATAN PANGAN (4 INDIKATOR) */}
                        <Card className="rounded-3xl border-amber-200/90 bg-gradient-to-b from-amber-500/[0.04] via-white to-white shadow-xl shadow-amber-500/[0.05] hover:shadow-2xl hover:border-amber-300 transition-all duration-300 dark:border-amber-800/60 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 flex flex-col overflow-hidden">
                            {/* Card Top Accent & Header */}
                            <div className="p-6 border-b border-amber-100 dark:border-amber-900/40 relative">
                                <div className="flex items-center justify-between gap-2 mb-4">
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100/90 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                                        Pilar 03
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                                        4 Indikator
                                    </span>
                                </div>

                                <div className="flex items-center gap-3.5">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-lg shadow-amber-600/25">
                                        <Utensils className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                            Pemanfaatan Pangan
                                        </h3>
                                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 italic">
                                            Food Utilization
                                        </p>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-3">
                                    Mengukur mutu biologis dan penyerapan gizi pangan melalui keanekaragaman konsumsi, kesehatan balita, kapasitas literasi ibu, serta sanitasi air minum layak.
                                </p>
                            </div>

                            {/* Indicators List */}
                            <div className="p-5 space-y-3 flex-1">
                                <div className="text-[11px] font-black uppercase tracking-wider text-amber-800/80 dark:text-amber-400">
                                    Daftar Indikator Komposit:
                                </div>

                                {/* Indikator 8 */}
                                <div className="group rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 hover:bg-white hover:border-amber-300 hover:shadow-xs transition-all dark:border-slate-800 dark:bg-slate-850/60 dark:hover:bg-slate-800 dark:hover:border-amber-700">
                                    <div className="flex items-start gap-2.5">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-[11px] font-black text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                            08
                                        </span>
                                        <div className="space-y-1 flex-1">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                                                Skor Pola Pangan Harapan (PPH) Konsumsi
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Tingkat keragaman dan keseimbangan gizi konsumsi pangan masyarakat dari 9 kelompok pangan utama menuju skor ideal 100.
                                            </p>
                                            <span className="inline-block rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200/60 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800">
                                                Mutu Konsumsi B2SA (Target Skor: 100)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Indikator 9 */}
                                <div className="group rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 hover:bg-white hover:border-amber-300 hover:shadow-xs transition-all dark:border-slate-800 dark:bg-slate-850/60 dark:hover:bg-slate-800 dark:hover:border-amber-700">
                                    <div className="flex items-start gap-2.5">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-[11px] font-black text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                            09
                                        </span>
                                        <div className="space-y-1 flex-1">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors">
                                                Prevalensi Balita Pendek &amp; Sangat Pendek (Stunting)
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Persentase balita dengan tinggi badan menurut umur di bawah standar (&lt;-2 SD), cerminan kegagalan gizi kronis dan infeksi berulang.
                                            </p>
                                            <span className="inline-block rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200/60 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800">
                                                Akselerasi Penurunan Stunting Anak
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Indikator 10 */}
                                <div className="group rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 hover:bg-white hover:border-amber-300 hover:shadow-xs transition-all dark:border-slate-800 dark:bg-slate-850/60 dark:hover:bg-slate-800 dark:hover:border-amber-700">
                                    <div className="flex items-start gap-2.5">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-[11px] font-black text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                            10
                                        </span>
                                        <div className="space-y-1 flex-1">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                                                Rata-rata Lama Sekolah (RLS) Perempuan &gt; 15 Th
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Tingkat pendidikan wanita/ibu yang berperan sentral menentukan kapasitas literasi gizi, higienitas dapur, dan pola pengasuhan makanan anak.
                                            </p>
                                            <span className="inline-block rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-800 border border-purple-200/60 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800">
                                                Edukasi &amp; Literasi Gizi Ibu Asuh
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Indikator 11 */}
                                <div className="group rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 hover:bg-white hover:border-amber-300 hover:shadow-xs transition-all dark:border-slate-800 dark:bg-slate-850/60 dark:hover:bg-slate-800 dark:hover:border-amber-700">
                                    <div className="flex items-start gap-2.5">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-[11px] font-black text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                            11
                                        </span>
                                        <div className="space-y-1 flex-1">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                                                Persentase Rumah Tangga Tanpa Akses Air Layak
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Akses air minum terlindungi dan layak sanitasi untuk mencegah penyakit infeksi pencernaan yang menggugurkan penyerapan zat gizi.
                                            </p>
                                            <span className="inline-block rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800 border border-sky-200/60 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800">
                                                Sanitasi Lingkungan &amp; Air Bersih
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer: Regional Context Indramayu */}
                            <div className="p-4 mx-4 mb-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 dark:bg-amber-950/40 dark:border-amber-800/60 text-xs">
                                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 mb-1">
                                    <Utensils className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                                    <span>Akselerasi Gizi &amp; B2SA</span>
                                </div>
                                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                                    Kolaborasi terpadu DKPP bersama Dinas Kesehatan dan TP-PKK dalam gerakan konsumsi pangan B2SA berbahan pangan lokal Indramayu dan intervensi gizi terintegrasi untuk eliminasi stunting.
                                </p>
                            </div>
                        </Card>
                    </div>

                    {/* Informational Callout: Harmonisasi Metodologi FSVA Bapanas 2026 */}
                    <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-6 sm:p-7 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            <div className="space-y-2 max-w-xl">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-[#006565] dark:bg-emerald-950 dark:text-emerald-400">
                                        <Info className="h-4 w-4" />
                                    </div>
                                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                                        Harmonisasi Metodologi FSVA &amp; IKP Bapanas (11 Indikator)
                                    </h4>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                    Pemutakhiran dari 9 indikator klasik menjadi 11 indikator komposit pada tingkat Kabupaten/Kota ini menyelaraskan metodologi Indonesia dengan standar internasional <em>Global Food Security Index</em> (GFSI) dan FAO.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 text-xs">
                                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-850">
                                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                                        <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                                        <span>Standarisasi Data</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Normalisasi nilai indikator menggunakan metode Min-Max / Z-Score untuk menghasilkan indeks komposit berskala 0–100.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-850">
                                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                                        <span className="flex h-2 w-2 rounded-full bg-sky-500" />
                                        <span>Kolaborasi Multi-Sektor</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-400 leading-relaxed">
                                        Integrasi data terpadu lintas BPS (Susenas/Sakernas), DKPP (Cadangan &amp; Pasar), Dinkes (Stunting), dan DPUPR (Sanitasi).
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-850">
                                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                                        <span className="flex h-2 w-2 rounded-full bg-amber-500" />
                                        <span>Targeting Lokus Kebijakan</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-400 leading-relaxed">
                                        Peta FSVA 11 indikator menentukan lokus desa rentan pangan dan acuan indikator sasaran Renstra/RPJMD Indramayu.
                                    </p>
                                </div>
                            </div>
                        </div>
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

