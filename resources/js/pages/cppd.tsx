import { Head, router } from '@inertiajs/react';
import {
    Archive,
    ArrowDownRight,
    ArrowUpRight,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    FileSpreadsheet,
    FileText,
    Filter,
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
    Truck,
    Wheat,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
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
    territory: {
        kecamatanList: string[];
        desaByKecamatan: Record<string, string[]>;
    };
}

export default function CppdPublicPage({
    selectedYear,
    availableYears,
    summary,
    recipientVillages,
    recentTransactions,
    territory,
}: CppdPublicPageProps) {
    // Layout selection: 'map' (Layout 1) | 'list' (Layout 2) | 'both'
    const [activeLayout, setActiveLayout] = useState<'map' | 'list' | 'both'>('map');

    // Filters for list and map
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedKecamatan, setSelectedKecamatan] = useState<string>('all');
    const [selectedVillageKey, setSelectedVillageKey] = useState<string | null>(null);

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

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans">
            <Head title={`Cadangan Pangan Pemerintah Daerah (CPPD) Tahun ${selectedYear} - DKPP Indramayu`} />

            {/* Navbar */}
            <PortalNavbar activePage="cppd" />

            {/* HERO BANNER */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#004e4e] via-[#006565] to-emerald-800 text-white shadow-xl">
                {/* Background patterns */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
                <div className="absolute left-1/4 -top-20 w-80 h-80 rounded-full bg-teal-300/15 blur-2xl pointer-events-none" />

                <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        {/* Title & Description */}
                        <div className="max-w-3xl space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-emerald-100 backdrop-blur-md border border-white/20">
                                <Wheat className="h-3.5 w-3.5 text-emerald-300" />
                                <span>Cadangan Pangan Pemerintah Daerah (CPPD)</span>
                                <span className="text-white/40">•</span>
                                <span className="text-emerald-200">Kabupaten Indramayu</span>
                            </div>

                            <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                                Transparansi Stok &amp; Penyaluran Cadangan Beras Daerah
                            </h1>

                            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal">
                                Pemantauan saldo stok awal, pengadaan beras APBD, addendum volume, serta peta persebaran distribusi bantuan cadangan pangan pokok ke desa-desa di seluruh wilayah Kabupaten Indramayu.
                            </p>
                        </div>

                        {/* Year Filter Dropdown */}
                        <div className="flex flex-col gap-2 rounded-2xl bg-white/10 p-3 sm:p-4 backdrop-blur-md border border-white/20 shadow-lg shrink-0 w-full sm:w-64">
                            <div className="flex items-center justify-between gap-2 text-xs font-bold text-emerald-100">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4 text-emerald-300" />
                                    <span>Pilih Tahun Anggaran</span>
                                </span>
                                <Badge className="bg-emerald-400 text-slate-900 font-extrabold text-[10px] px-2">
                                    Tahun {selectedYear}
                                </Badge>
                            </div>

                            <Select
                                value={String(selectedYear)}
                                onValueChange={(val) => handleYearChange(Number(val))}
                            >
                                <SelectTrigger className="h-10 w-full rounded-xl bg-white/95 text-slate-900 border-white/30 font-bold text-xs sm:text-sm shadow-md hover:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none dark:bg-slate-900 dark:text-white dark:border-slate-700 cursor-pointer">
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
                <section className="space-y-4">
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
                <section className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/95 sm:p-6">
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

