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
    FileSpreadsheet,
    Filter,
    HelpCircle,
    Info,
    Layers,
    MapPin,
    Printer,
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
        is_climate?: boolean;
        total_kecamatan: number;
        count_aman: number;
        count_waspada: number;
        count_rentan: number;
        count_siaga?: number;
        count_awas?: number;
        overall_status: string;
        indicator_counts: Record<
            string,
            { AMAN: number; WASPADA: number; RENTAN?: number; SIAGA?: number; AWAS?: number }
        >;
    };
    calendarData?: CalendarSubdistrictRow[];
    indicators: Record<string, string>;
    availableYears: number[];
    availableMonths: number[];
    filters: {
        year: number;
        month: number;
        indicator: string;
    };
}

export interface CalendarMonthData {
    ik: string;
    ia: string;
    ip: string;
    ikb: string;
    potensi_kering: string;
    potensi_basah: string;
    kondisi_iklim: string;
    keterangan?: string | null;
}

export interface CalendarSubdistrictRow {
    kecamatan: string;
    kode_kecamatan: string;
    months: Record<number, CalendarMonthData | null>;
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
    { label: string; short: string; description: string; focus: string; icon: React.ComponentType<{ className?: string }> }
> = {
    ikb: {
        label: 'Komposit (IKB)',
        short: 'IKB',
        description: 'Indeks gabungan akumulasi dari seluruh pilar ketahanan pangan (ketersediaan, keterjangkauan, pemanfaatan, dan iklim) untuk menentukan tingkat kerentanan pangan makro suatu kecamatan.',
        focus: 'Penilaian agregat kerawanan pangan wilayah untuk penentuan prioritas intervensi daerah.',
        icon: Activity,
    },
    ik: {
        label: 'Ketersediaan (IK)',
        short: 'IK',
        description: 'Mengukur kecukupan pasokan dan cadangan pangan pokok (beras, jagung, dll) dari hasil produksi pertanian lokal, luas tanam produktif, serta rasio cadangan pangan terhadap kebutuhan penduduk.',
        focus: 'Produksi panen padi/palawija, luas areal tanam, cadangan pangan pemerintah daerah, dan pasokan beras.',
        icon: Wheat,
    },
    ia: {
        label: 'Keterjangkauan (IA)',
        short: 'IA',
        description: 'Memantau aksesibilitas fisik dan ekonomi masyarakat terhadap pangan, stabilitas harga komoditas pangan pokok, disparitas harga antar pasar, serta daya beli rumah tangga.',
        focus: 'Stabilitas harga pangan konsumen, kelancaran distribusi logistik, dan daya beli masyarakat.',
        icon: Compass,
    },
    ip: {
        label: 'Pemanfaatan (IP)',
        short: 'IP',
        description: 'Menilai pemanfaatan pangan untuk kualitas gizi, keragaman konsumsi (PPH), akses terhadap sumber air minum layak, sanitasi lingkungan, serta pencegahan risiko stunting/gizi buruk.',
        focus: 'Skor Pola Pangan Harapan (PPH), sanitasi air bersih, dan pemantauan balita stunting.',
        icon: ShieldCheck,
    },
    potensi_kering: {
        label: 'Potensi Kering',
        short: 'Kering',
        description: 'Peringatan dini ancaman kekeringan lahan pertanian, defisit debit air irigasi teknis, curah hujan di bawah normal, dan potensi gagal panen (puso) akibat musim kemarau atau El Nino.',
        focus: 'Debit saluran irigasi Rentang/Cimanuk, luasan sawah terdampak kekeringan, dan mitigasi pompa air.',
        icon: Sun,
    },
    potensi_basah: {
        label: 'Potensi Basah',
        short: 'Basah',
        description: 'Peringatan dini curah hujan tinggi ekstrem, luapan debit sungai Cimanuk/Cipanas, banjir genangan areal persawahan, serta potensi banjir pasang air laut (rob) di pesisir utara Indramayu.',
        focus: 'Titik rawan banjir persawahan, pasang rob pesisir pantai utara, dan normalisasi tanggul.',
        icon: CloudRain,
    },
    kondisi_iklim: {
        label: 'Kondisi Iklim',
        short: 'Iklim',
        description: 'Pemantauan anomali cuaca makro berdasarkan data BMKG (El Nino-Southern Oscillation, IOD) dan dampaknya terhadap pola tanam, kalender tanam, dan produktivitas pertanian pangan daerah.',
        focus: 'Prakiraan anomali cuaca BMKG, pergeseran musim hujan/kemarau, dan kalender tanam (Katam).',
        icon: Droplets,
    },
};

export default function SkpgPublicPage({
    kecamatanItems,
    calendarData = [],
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

    // Keep state in sync with server-resolved period props
    React.useEffect(() => {
        if (summary.year) setSelectedYear(summary.year);
        if (summary.month) setSelectedMonth(summary.month);
        if (filters.indicator) setSelectedIndicator(filters.indicator);
    }, [summary.year, summary.month, filters.indicator]);

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

    const isClimate = useMemo(() => {
        return ['potensi_kering', 'potensi_basah', 'kondisi_iklim'].includes(selectedIndicator);
    }, [selectedIndicator]);

    // Split into status buckets based on the currently active indicator:
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

    const siagaItems = useMemo(() => {
        return searchFilteredItems.filter((item) => {
            const currentStatus =
                (item[selectedIndicator as keyof SkpgKecamatanItem] as string) || item.ikb || 'AMAN';
            return currentStatus === 'SIAGA';
        });
    }, [searchFilteredItems, selectedIndicator]);

    const awasItems = useMemo(() => {
        return searchFilteredItems.filter((item) => {
            const currentStatus =
                (item[selectedIndicator as keyof SkpgKecamatanItem] as string) || item.ikb || 'AMAN';
            return currentStatus === 'AWAS';
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

    const [calendarSearch, setCalendarSearch] = useState<string>('');

    // Filter calendar rows
    const filteredCalendarData = useMemo(() => {
        if (!calendarSearch.trim()) return calendarData;
        const q = calendarSearch.toLowerCase().trim();
        return calendarData.filter(
            (row) =>
                row.kecamatan.toLowerCase().includes(q) ||
                row.kode_kecamatan.toLowerCase().includes(q)
        );
    }, [calendarData, calendarSearch]);

    // Download Calendar as Excel (.csv with UTF-8 BOM for Microsoft Excel)
    const handleDownloadCalendarExcel = () => {
        const activeLabel = activeIndMeta.label;
        let csvContent = '\uFEFF';
        csvContent += `LAPORAN KALENDER POTENSI KERAWANAN PANGAN DAN GIZI (SKPG)\r\n`;
        csvContent += `KABUPATEN INDRAMAYU TAHUN ${selectedYear}\r\n`;
        csvContent += `Filter Indikator: ${activeLabel} (${activeIndMeta.short})\r\n`;
        csvContent += `Tanggal Unduh: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}\r\n\r\n`;

        const headers = [
            'No',
            'Kecamatan',
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
        csvContent += headers.map((h) => `"${h}"`).join(',') + '\r\n';

        calendarData.forEach((row, index) => {
            const line: (string | number)[] = [
                index + 1,
                row.kecamatan,
            ];

            for (let m = 1; m <= 12; m++) {
                const mData = row.months[m];
                if (!mData) {
                    line.push('-');
                } else {
                    const status = (mData[selectedIndicator as keyof typeof mData] as string) || mData.ikb || 'AMAN';
                    line.push(status);
                }
            }

            csvContent += line.map((cell) => `"${cell}"`).join(',') + '\r\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Kalender_SKPG_Indramayu_${selectedYear}_${selectedIndicator}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Download Calendar as formatted PDF report with DKPP Kop Surat
    const handleDownloadCalendarPdf = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Mohon izinkan pop-up browser untuk mencetak / mendownload PDF.');
            return;
        }

        const todayStr = new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        const monthHeaders = [
            'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
            'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
        ];

        let rowsHtml = '';
        calendarData.forEach((row, idx) => {
            let cellsHtml = '';
            for (let m = 1; m <= 12; m++) {
                const mData = row.months[m];
                if (!mData) {
                    cellsHtml += `<td class="cell-empty">-</td>`;
                } else {
                    const status = (mData[selectedIndicator as keyof typeof mData] as string) || mData.ikb || 'AMAN';
                    let cls = 'badge-aman';
                    let letter = 'A';
                    if (status === 'AWAS') {
                        cls = 'badge-awas';
                        letter = 'AW';
                    } else if (status === 'SIAGA') {
                        cls = 'badge-siaga';
                        letter = 'S';
                    } else if (status === 'RENTAN') {
                        cls = 'badge-rentan';
                        letter = 'R';
                    } else if (status === 'WASPADA') {
                        cls = 'badge-waspada';
                        letter = 'W';
                    }
                    cellsHtml += `<td class="cell-status"><span class="badge ${cls}">${letter}</span></td>`;
                }
            }

            rowsHtml += `
                <tr>
                    <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                    <td style="font-weight: 700;">${row.kecamatan}</td>
                    ${cellsHtml}
                </tr>
            `;
        });

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <title>Kalender SKPG Indramayu ${selectedYear} - ${activeIndMeta.label}</title>
                <style>
                    @page { size: landscape; margin: 8mm; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0f172a; margin: 0; padding: 12px; font-size: 8.5pt; }
                    .kop { display: flex; align-items: center; border-bottom: 2.5px solid #006565; padding-bottom: 6px; margin-bottom: 10px; }
                    .kop-text { flex: 1; text-align: center; }
                    .kop-text h2 { margin: 0; font-size: 13pt; text-transform: uppercase; color: #004e4e; font-weight: 900; letter-spacing: 0.5px; }
                    .kop-text h3 { margin: 2px 0; font-size: 11pt; font-weight: 800; color: #0f172a; }
                    .kop-text p { margin: 0; font-size: 7.5pt; color: #475569; }
                    .meta-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; background: #f8fafc; padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
                    .meta-bar div { font-size: 8.5pt; }
                    .legend-inline { display: flex; gap: 12px; font-size: 8pt; }
                    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 7.5pt; text-align: center; min-width: 16px; }
                    .badge-aman { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
                    .badge-waspada { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
                    .badge-siaga { background: #ffedd5; color: #9a3412; border: 1px solid #fdba74; }
                    .badge-awas { background: #ffe4e6; color: #9f1239; border: 1px solid #fda4af; }
                    .badge-rentan { background: #ffe4e6; color: #9f1239; border: 1px solid #fda4af; }
                    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
                    th { background: #006565; color: #ffffff; font-weight: 800; text-align: center; font-size: 8pt; padding: 5px 3px; border: 1px solid #004e4e; }
                    td { padding: 3.5px 3px; border: 1px solid #cbd5e1; font-size: 8pt; }
                    tr:nth-child(even) { background-color: #f8fafc; }
                    .cell-status { text-align: center; }
                    .cell-empty { text-align: center; color: #94a3b8; font-size: 7.5pt; }
                    .signature-area { margin-top: 14px; display: flex; justify-content: flex-end; }
                    .signature-box { text-align: center; width: 220px; font-size: 8.5pt; }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="margin-bottom: 10px; background: #e0f2fe; padding: 8px 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 8.5pt; color: #0369a1; font-weight: 600;">Tips: Pada dialog cetak browser, pilih tujuan <strong>Save as PDF (Simpan sebagai PDF)</strong> dengan orientasi Landscape.</span>
                    <button onclick="window.print()" style="background: #006565; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; cursor: pointer;">Cetak / Simpan PDF</button>
                </div>

                <div class="kop">
                    <div class="kop-text">
                        <h2>Pemerintah Kabupaten Indramayu</h2>
                        <h3>Dinas Ketahanan Pangan dan Pertanian</h3>
                        <p>Jl. Olahraga No. 1, Karanganyar, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat 45213</p>
                    </div>
                </div>

                <div class="meta-bar">
                    <div>
                        <strong>Laporan:</strong> Kalender Potensi Kerawanan Pangan dan Gizi (SKPG) Tahun ${selectedYear}<br>
                        <strong>Filter Indikator:</strong> ${activeIndMeta.label} (${activeIndMeta.short})
                    </div>
                    <div class="legend-inline">
                        <span><strong>Keterangan:</strong></span>
                        <span><span class="badge badge-aman">A</span> Aman</span>
                        <span><span class="badge badge-waspada">W</span> Waspada</span>
                        ${
                            isClimate
                                ? `<span><span class="badge badge-siaga">S</span> Siaga</span>
                                   <span><span class="badge badge-awas">AW</span> Awas</span>`
                                : `<span><span class="badge badge-rentan">R</span> Rentan</span>`
                        }
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 25px;">No</th>
                            <th style="width: 140px; text-align: left; padding-left: 6px;">Kecamatan</th>
                            ${monthHeaders.map((m) => `<th>${m}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>

                <div class="signature-area">
                    <div class="signature-box">
                        <p style="margin: 0;">Indramayu, ${todayStr}</p>
                        <p style="margin: 2px 0 45px 0; font-weight: 600;">Kepala Dinas Ketahanan Pangan dan Pertanian<br>Kabupaten Indramayu</p>
                        <p style="margin: 0; font-weight: 900; text-decoration: underline;">Ir. H. DEDI SUGIYONO, M.Si.</p>
                        <p style="margin: 0; font-size: 7.5pt; color: #475569;">NIP. 19710412 199803 1 004</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 400);
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
                                <button
                                    type="button"
                                    onClick={() => {
                                        const btn = document.getElementById('btn-download-skpg-pdf');
                                        if (btn) {
                                            btn.click();
                                        } else {
                                            const mapEl = document.getElementById('peta-sebaran-skpg');
                                            if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/25 hover:bg-rose-500/35 px-3 py-1.5 backdrop-blur-md border border-rose-400/40 text-xs font-bold text-rose-100 transition-colors cursor-pointer shadow-xs"
                                    title="Download Laporan Peta SKPG Resmi A4 Landscape (PDF)"
                                >
                                    <Download className="h-3.5 w-3.5 text-rose-300" />
                                    <span>Unduh Peta (PDF)</span>
                                </button>
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
                                                    summary.overall_status === 'AWAS' || summary.overall_status === 'RENTAN'
                                                        ? 'bg-rose-500 text-white'
                                                        : summary.overall_status === 'SIAGA'
                                                          ? 'bg-orange-500 text-white'
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

                                {/* Status Breakdown Metric Bars */}
                                {isClimate ? (
                                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                                        <div className="rounded-2xl bg-emerald-500/20 border border-emerald-400/30 p-2">
                                            <span className="block text-2xl font-black text-emerald-300">
                                                {summary.count_aman}
                                            </span>
                                            <span className="text-[10px] font-extrabold text-emerald-100 uppercase">
                                                AMAN
                                            </span>
                                        </div>
                                        <div className="rounded-2xl bg-amber-500/20 border border-amber-400/30 p-2">
                                            <span className="block text-2xl font-black text-amber-300">
                                                {summary.count_waspada}
                                            </span>
                                            <span className="text-[10px] font-extrabold text-amber-100 uppercase">
                                                WASPADA
                                            </span>
                                        </div>
                                        <div className="rounded-2xl bg-orange-500/20 border border-orange-400/30 p-2">
                                            <span className="block text-2xl font-black text-orange-300">
                                                {summary.count_siaga ?? 0}
                                            </span>
                                            <span className="text-[10px] font-extrabold text-orange-100 uppercase">
                                                SIAGA
                                            </span>
                                        </div>
                                        <div className="rounded-2xl bg-rose-500/20 border border-rose-400/30 p-2">
                                            <span className="block text-2xl font-black text-rose-300">
                                                {summary.count_awas ?? 0}
                                            </span>
                                            <span className="text-[10px] font-extrabold text-rose-100 uppercase">
                                                AWAS
                                            </span>
                                        </div>
                                    </div>
                                ) : (
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
                                )}

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
                            const counts = summary.indicator_counts[key] || { AMAN: 0, WASPADA: 0 };
                            const isKeyClimate = ['potensi_kering', 'potensi_basah', 'kondisi_iklim'].includes(key);

                            let alertBadge = null;
                            if (isKeyClimate) {
                                if ((counts.AWAS ?? 0) > 0) {
                                    alertBadge = <span className="text-rose-400 font-black">! {counts.AWAS}</span>;
                                } else if ((counts.SIAGA ?? 0) > 0) {
                                    alertBadge = <span className="text-orange-400 font-black">! {counts.SIAGA}</span>;
                                } else if (counts.WASPADA > 0) {
                                    alertBadge = <span className="text-amber-400 font-black">! {counts.WASPADA}</span>;
                                } else {
                                    alertBadge = <span>✓ {counts.AMAN}</span>;
                                }
                            } else {
                                if ((counts.RENTAN ?? 0) > 0) {
                                    alertBadge = <span className="text-rose-400 font-black">! {counts.RENTAN}</span>;
                                } else if (counts.WASPADA > 0) {
                                    alertBadge = <span className="text-amber-400 font-black">! {counts.WASPADA}</span>;
                                } else {
                                    alertBadge = <span>✓ {counts.AMAN}</span>;
                                }
                            }

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
                                        {alertBadge}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* CARD DESKRIPSI SINGKAT DARI INDIKATOR TERPILIH */}
                    <div className="mt-5 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white p-4.5 dark:border-emerald-800/50 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-slate-900 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100/90 pb-3 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#006565] to-teal-600 text-white shadow-sm shadow-[#006565]/20">
                                    <ActiveIndIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-[#006565] dark:text-emerald-400">
                                            Deskripsi Indikator Terpilih
                                        </span>
                                        <Badge className="rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300">
                                            {activeIndMeta.short}
                                        </Badge>
                                    </div>
                                    <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                                        {activeIndMeta.label}
                                    </h4>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                                <span className="text-slate-500 text-[11px] font-semibold">Distribusi Status:</span>
                                <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                                    Aman: {summary.indicator_counts[selectedIndicator]?.AMAN ?? 0}
                                </Badge>
                                <Badge className="bg-amber-500 text-white font-bold text-[10px]">
                                    Waspada: {summary.indicator_counts[selectedIndicator]?.WASPADA ?? 0}
                                </Badge>
                                {isClimate ? (
                                    <>
                                        <Badge className="bg-orange-500 text-white font-bold text-[10px]">
                                            Siaga: {summary.indicator_counts[selectedIndicator]?.SIAGA ?? 0}
                                        </Badge>
                                        <Badge className="bg-rose-600 text-white font-bold text-[10px]">
                                            Awas: {summary.indicator_counts[selectedIndicator]?.AWAS ?? 0}
                                        </Badge>
                                    </>
                                ) : (
                                    <Badge className="bg-rose-600 text-white font-bold text-[10px]">
                                        Rentan: {summary.indicator_counts[selectedIndicator]?.RENTAN ?? 0}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="mt-3.5 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                            <div className="md:col-span-2">
                                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                    Definisi &amp; Cakupan Pemantauan
                                </span>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                    {activeIndMeta.description}
                                </p>
                            </div>
                            <div className="rounded-xl bg-white/90 p-3 border border-emerald-100 dark:bg-slate-800/70 dark:border-slate-700/70">
                                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                    Fokus Penilaian DKPP
                                </span>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-normal">
                                    {activeIndMeta.focus}
                                </p>
                            </div>
                        </div>
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
                        month={selectedMonth}
                        year={selectedYear}
                    />
                </section>

                {/* CARD STATUS DENGAN LIST DAFTAR KECAMATAN (4 CARDS for Climate, 3 CARDS for Food Security) */}
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
                                {isClimate
                                    ? 'Dikelompokkan ke dalam 4 kartu status (Aman, Waspada, Siaga, Awas) untuk 31 kecamatan di Kabupaten Indramayu.'
                                    : 'Dikelompokkan ke dalam 3 kartu status (Aman, Waspada, Rentan) untuk 31 kecamatan di Kabupaten Indramayu.'}
                            </p>
                        </div>

                        {/* Search box across all cards */}
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

                    {/* Status Cards Grid */}
                    <div className={`grid grid-cols-1 gap-6 items-start ${isClimate ? 'md:grid-cols-2 lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
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
                                            Kondisi Normal &amp; Stabil
                                        </p>
                                    </div>
                                </div>
                                <Badge className="rounded-xl border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800 shadow-xs dark:border-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                    {amanItems.length} Kecamatan
                                </Badge>
                            </div>

                            {/* Card 1 Subdistrict List */}
                            <div className="mt-4 max-h-[460px] space-y-1.5 overflow-y-auto pr-1">
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
                                    amanItems.map((item, idx) => {
                                        const isSelected = selectedKecamatan?.toUpperCase() === item.kecamatan.toUpperCase();
                                        return (
                                            <button
                                                key={item.kecamatan}
                                                type="button"
                                                onClick={() => handleFocusKecamatan(item.kecamatan)}
                                                className={`group flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-all duration-150 cursor-pointer ${
                                                    isSelected
                                                        ? 'border-[#006565] bg-emerald-50 text-[#006565] ring-2 ring-[#006565]/40 shadow-xs dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                        : 'border-white/90 bg-white/90 text-slate-800 shadow-xs hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-[#006565] dark:border-slate-800/80 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-[10px] font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-xs font-bold sm:text-sm text-slate-800 group-hover:text-[#006565] dark:text-slate-200 dark:group-hover:text-emerald-300">
                                                        {item.kecamatan}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {isSelected && (
                                                        <Badge className="bg-[#006565] text-white text-[9px] px-1.5 py-0 font-bold dark:bg-emerald-600">
                                                            Aktif
                                                        </Badge>
                                                    )}
                                                    <MapPin
                                                        className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                                                            isSelected
                                                                ? 'text-[#006565] dark:text-emerald-400'
                                                                : 'text-slate-300 group-hover:text-[#006565] dark:text-slate-600 dark:group-hover:text-emerald-400'
                                                        }`}
                                                    />
                                                </div>
                                            </button>
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
                            <div className="mt-4 max-h-[460px] space-y-1.5 overflow-y-auto pr-1">
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
                                    waspadaItems.map((item, idx) => {
                                        const isSelected = selectedKecamatan?.toUpperCase() === item.kecamatan.toUpperCase();
                                        return (
                                            <button
                                                key={item.kecamatan}
                                                type="button"
                                                onClick={() => handleFocusKecamatan(item.kecamatan)}
                                                className={`group flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-all duration-150 cursor-pointer ${
                                                    isSelected
                                                        ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/40 shadow-xs dark:border-amber-500 dark:bg-amber-950/60 dark:text-amber-200'
                                                        : 'border-white/90 bg-white/90 text-slate-800 shadow-xs hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-900 dark:border-slate-800/80 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-100 text-[10px] font-black text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-xs font-bold sm:text-sm text-slate-800 group-hover:text-amber-700 dark:text-slate-200 dark:group-hover:text-amber-300">
                                                        {item.kecamatan}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {isSelected && (
                                                        <Badge className="bg-amber-600 text-white text-[9px] px-1.5 py-0 font-bold">
                                                            Aktif
                                                        </Badge>
                                                    )}
                                                    <MapPin
                                                        className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                                                            isSelected
                                                                ? 'text-amber-600 dark:text-amber-400'
                                                                : 'text-slate-300 group-hover:text-amber-600 dark:text-slate-600 dark:group-hover:text-amber-400'
                                                        }`}
                                                    />
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* CLIMATE MODE: CARD 3 (SIAGA) & CARD 4 (AWAS) */}
                        {isClimate ? (
                            <>
                                {/* CARD 3: KECAMATAN SIAGA */}
                                <div className="flex flex-col rounded-3xl border border-orange-200/90 bg-orange-50/40 p-5 shadow-sm backdrop-blur-sm dark:border-orange-800/60 dark:bg-orange-950/20">
                                    {/* Card 3 Header */}
                                    <div className="flex items-center justify-between border-b border-orange-200/80 pb-4 dark:border-orange-800/60">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-md shadow-orange-500/20">
                                                <ShieldAlert className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-black tracking-tight text-orange-950 dark:text-orange-100">
                                                    KECAMATAN SIAGA
                                                </h4>
                                                <p className="text-[11px] font-medium text-orange-700 dark:text-orange-300/90">
                                                    Kesiapsiagaan Menghadapi Ancaman
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className="rounded-xl border border-orange-300 bg-orange-100 px-2.5 py-1 text-xs font-black text-orange-800 shadow-xs dark:border-orange-800 dark:bg-orange-900/60 dark:text-orange-200">
                                            {siagaItems.length} Kecamatan
                                        </Badge>
                                    </div>

                                    {/* Card 3 Subdistrict List */}
                                    <div className="mt-4 max-h-[460px] space-y-1.5 overflow-y-auto pr-1">
                                        {siagaItems.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-white/70 p-8 text-center dark:border-orange-900 dark:bg-slate-900/60">
                                                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                                                <p className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                                                    Nol Kecamatan Siaga
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-slate-500">
                                                    {searchQuery
                                                        ? 'Tidak ada hasil untuk pencarian ini.'
                                                        : 'Tidak ada kecamatan berstatus siaga pada periode ini.'}
                                                </p>
                                            </div>
                                        ) : (
                                            siagaItems.map((item, idx) => {
                                                const isSelected = selectedKecamatan?.toUpperCase() === item.kecamatan.toUpperCase();
                                                return (
                                                    <button
                                                        key={item.kecamatan}
                                                        type="button"
                                                        onClick={() => handleFocusKecamatan(item.kecamatan)}
                                                        className={`group flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-all duration-150 cursor-pointer ${
                                                            isSelected
                                                                ? 'border-orange-500 bg-orange-50 text-orange-900 ring-2 ring-orange-500/40 shadow-xs dark:border-orange-500 dark:bg-orange-950/60 dark:text-orange-200'
                                                                : 'border-white/90 bg-white/90 text-slate-800 shadow-xs hover:border-orange-300 hover:bg-orange-50/50 hover:text-orange-900 dark:border-slate-800/80 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-orange-100 text-[10px] font-black text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                                                                {idx + 1}
                                                            </span>
                                                            <span className="text-xs font-bold sm:text-sm text-slate-800 group-hover:text-orange-700 dark:text-slate-200 dark:group-hover:text-orange-300">
                                                                {item.kecamatan}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            {isSelected && (
                                                                <Badge className="bg-orange-600 text-white text-[9px] px-1.5 py-0 font-bold">
                                                                    Aktif
                                                                </Badge>
                                                            )}
                                                            <MapPin
                                                                className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                                                                    isSelected
                                                                        ? 'text-orange-600 dark:text-orange-400'
                                                                        : 'text-slate-300 group-hover:text-orange-600 dark:text-slate-600 dark:group-hover:text-orange-400'
                                                                }`}
                                                            />
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* CARD 4: KECAMATAN AWAS */}
                                <div className="flex flex-col rounded-3xl border border-rose-200/90 bg-rose-50/40 p-5 shadow-sm backdrop-blur-sm dark:border-rose-800/60 dark:bg-rose-950/20">
                                    {/* Card 4 Header */}
                                    <div className="flex items-center justify-between border-b border-rose-200/80 pb-4 dark:border-rose-800/60">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-600/20">
                                                <AlertTriangle className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-black tracking-tight text-rose-950 dark:text-rose-100">
                                                    KECAMATAN AWAS
                                                </h4>
                                                <p className="text-[11px] font-medium text-rose-700 dark:text-rose-300/90">
                                                    Kondisi Kritis / Darurat Bencana
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className="rounded-xl border border-rose-300 bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-800 shadow-xs dark:border-rose-800 dark:bg-rose-900/60 dark:text-rose-200">
                                            {awasItems.length} Kecamatan
                                        </Badge>
                                    </div>

                                    {/* Card 4 Subdistrict List */}
                                    <div className="mt-4 max-h-[460px] space-y-1.5 overflow-y-auto pr-1">
                                        {awasItems.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-rose-200 bg-white/70 p-8 text-center dark:border-rose-900 dark:bg-slate-900/60">
                                                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                                                <p className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                                                    Nol Kecamatan Awas
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-slate-500">
                                                    {searchQuery
                                                        ? 'Tidak ada hasil untuk pencarian ini.'
                                                        : 'Alhamdulillah tidak ada kecamatan dalam level bahaya awas.'}
                                                </p>
                                            </div>
                                        ) : (
                                            awasItems.map((item, idx) => {
                                                const isSelected = selectedKecamatan?.toUpperCase() === item.kecamatan.toUpperCase();
                                                return (
                                                    <button
                                                        key={item.kecamatan}
                                                        type="button"
                                                        onClick={() => handleFocusKecamatan(item.kecamatan)}
                                                        className={`group flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-all duration-150 cursor-pointer ${
                                                            isSelected
                                                                ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500/40 shadow-xs dark:border-rose-500 dark:bg-rose-950/60 dark:text-rose-200'
                                                                : 'border-white/90 bg-white/90 text-slate-800 shadow-xs hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-900 dark:border-slate-800/80 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-rose-100 text-[10px] font-black text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                                                {idx + 1}
                                                            </span>
                                                            <span className="text-xs font-bold sm:text-sm text-slate-800 group-hover:text-rose-700 dark:text-slate-200 dark:group-hover:text-rose-300">
                                                                {item.kecamatan}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            {isSelected && (
                                                                <Badge className="bg-rose-600 text-white text-[9px] px-1.5 py-0 font-bold">
                                                                    Aktif
                                                                </Badge>
                                                            )}
                                                            <MapPin
                                                                className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                                                                    isSelected
                                                                        ? 'text-rose-600 dark:text-rose-400'
                                                                        : 'text-slate-300 group-hover:text-rose-600 dark:text-slate-600 dark:group-hover:text-rose-400'
                                                                }`}
                                                            />
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* FOOD SECURITY MODE: CARD 3 (RENTAN) */
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
                                <div className="mt-4 max-h-[460px] space-y-1.5 overflow-y-auto pr-1">
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
                                        rentanItems.map((item, idx) => {
                                            const isSelected = selectedKecamatan?.toUpperCase() === item.kecamatan.toUpperCase();
                                            return (
                                                <button
                                                    key={item.kecamatan}
                                                    type="button"
                                                    onClick={() => handleFocusKecamatan(item.kecamatan)}
                                                    className={`group flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-all duration-150 cursor-pointer ${
                                                        isSelected
                                                            ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500/40 shadow-xs dark:border-rose-500 dark:bg-rose-950/60 dark:text-rose-200'
                                                            : 'border-white/90 bg-white/90 text-slate-800 shadow-xs hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-900 dark:border-slate-800/80 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-rose-100 text-[10px] font-black text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="text-xs font-bold sm:text-sm text-slate-800 group-hover:text-rose-700 dark:text-slate-200 dark:group-hover:text-rose-300">
                                                            {item.kecamatan}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        {isSelected && (
                                                            <Badge className="bg-rose-600 text-white text-[9px] px-1.5 py-0 font-bold">
                                                                Aktif
                                                            </Badge>
                                                        )}
                                                        <MapPin
                                                            className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                                                                isSelected
                                                                    ? 'text-rose-600 dark:text-rose-400'
                                                                    : 'text-slate-300 group-hover:text-rose-600 dark:text-slate-600 dark:group-hover:text-rose-400'
                                                            }`}
                                                        />
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* TABEL KALENDER POTENSI KERAWANAN PANGAN DAN GIZI (JANUARI - DESEMBER) */}
                <section className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-[#006565] dark:text-emerald-400" />
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                    Kalender Potensi Kerawanan Pangan dan Gizi (Tahun {selectedYear})
                                </h3>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Matriks pemantauan bulanan (Januari - Desember) di 31 kecamatan berdasarkan filter indikator:{' '}
                                <strong className="text-slate-800 dark:text-slate-200">{activeIndMeta.label}</strong>.
                                <span className="block mt-0.5 text-[11px] text-[#006565] dark:text-emerald-400 font-medium">
                                    Tampil default 10 kecamatan, gulir (scroll) ke bawah untuk melihat seluruh 31 kecamatan.
                                </span>
                            </p>
                        </div>

                        {/* Search & Export Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Search box for calendar */}
                            <div className="relative w-full sm:w-56">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Cari kecamatan di tabel..."
                                    value={calendarSearch}
                                    onChange={(e) => setCalendarSearch(e.target.value)}
                                    className="h-9 pl-9 rounded-xl text-xs bg-white dark:bg-slate-900 shadow-xs"
                                />
                            </div>

                            {/* Download Excel Button */}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadCalendarExcel}
                                className="h-9 gap-1.5 rounded-xl text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/80 shadow-xs cursor-pointer"
                                title="Download Kalender SKPG format Excel / CSV"
                            >
                                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                <span>Download Excel</span>
                            </Button>

                            {/* Download PDF Button */}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadCalendarPdf}
                                className="h-9 gap-1.5 rounded-xl text-xs font-bold border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/80 shadow-xs cursor-pointer"
                                title="Cetak / Simpan Kalender SKPG format PDF"
                            >
                                <Download className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                <span>Download PDF</span>
                            </Button>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                        <div className="max-h-[465px] overflow-y-auto overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs">
                                <thead className="sticky top-0 z-20 shadow-xs">
                                    <tr className="border-b border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                                        <th className="py-3 px-3 text-center font-black text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800 w-12">
                                            No
                                        </th>
                                        <th className="py-3 px-4 font-black text-slate-800 bg-slate-100 dark:text-slate-200 dark:bg-slate-800 min-w-[170px]">
                                            Kecamatan
                                        </th>
                                        {MONTH_NAMES.map((mName, mIdx) => (
                                            <th
                                                key={mName}
                                                className={`py-3 px-1.5 text-center font-black min-w-[62px] ${
                                                    selectedMonth === mIdx + 1
                                                        ? 'bg-emerald-100 text-[#006565] dark:bg-emerald-950 dark:text-emerald-300'
                                                        : 'text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800'
                                                }`}
                                            >
                                                {mName.slice(0, 3)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredCalendarData.length === 0 ? (
                                        <tr>
                                            <td colSpan={14} className="py-10 text-center text-slate-500">
                                                Tidak ada kecamatan yang cocok dengan pencarian "{calendarSearch}".
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCalendarData.map((row, index) => {
                                            const isSelected = selectedKecamatan?.toUpperCase() === row.kecamatan.toUpperCase();
                                            return (
                                                <tr
                                                    key={row.kecamatan}
                                                    onClick={() => handleFocusKecamatan(row.kecamatan)}
                                                    className={`transition-colors cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 font-bold'
                                                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                                                    }`}
                                                >
                                                    <td className="py-2.5 px-3 text-center font-bold text-slate-400 text-[11px]">
                                                        {index + 1}
                                                    </td>
                                                    <td className="py-2.5 px-4 font-black text-slate-900 dark:text-white">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-slate-800 dark:text-slate-200 group-hover:text-[#006565]">
                                                                {row.kecamatan}
                                                            </span>
                                                            {isSelected && (
                                                                <span className="h-1.5 w-1.5 rounded-full bg-[#006565] dark:bg-emerald-400" />
                                                            )}
                                                        </div>
                                                    </td>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
                                                        const mData = row.months[m];
                                                        if (!mData) {
                                                            return (
                                                                <td key={m} className="py-2 px-1 text-center">
                                                                    <span
                                                                        className="inline-block px-1.5 py-0.5 rounded text-[10px] text-slate-300 dark:text-slate-600 font-bold"
                                                                        title={`Bulan ${MONTH_NAMES[m - 1]}: Belum ada data`}
                                                                    >
                                                                        -
                                                                    </span>
                                                                </td>
                                                            );
                                                        }

                                                        const status =
                                                            (mData[selectedIndicator as keyof typeof mData] as string) ||
                                                            mData.ikb ||
                                                            'AMAN';

                                                        let badgeBg = 'bg-emerald-500 text-white border-emerald-600 font-black shadow-xs';
                                                        if (status === 'AWAS') {
                                                            badgeBg = 'bg-rose-500 text-white border-rose-600 font-black shadow-xs';
                                                        } else if (status === 'SIAGA') {
                                                            badgeBg = 'bg-orange-500 text-white border-orange-600 font-black shadow-xs';
                                                        } else if (status === 'RENTAN') {
                                                            badgeBg = 'bg-rose-500 text-white border-rose-600 font-black shadow-xs';
                                                        } else if (status === 'WASPADA') {
                                                            badgeBg = 'bg-amber-400 text-amber-950 border-amber-500 font-black shadow-xs';
                                                        }

                                                        return (
                                                            <td key={m} className="py-2 px-1 text-center">
                                                                <span
                                                                    className={`inline-flex items-center justify-center min-w-[38px] py-1 px-1 rounded-md text-[9px] border transition-transform hover:scale-110 select-none ${badgeBg}`}
                                                                    title={`${row.kecamatan} - ${MONTH_NAMES[m - 1]}: ${status}`}
                                                                >
                                                                    {status}
                                                                </span>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Calendar Table Footer & Legend */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 p-4 text-xs dark:border-slate-800 dark:bg-slate-800/40">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                    Legenda Sel Bulan:
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <span className="inline-block h-3.5 w-3.5 rounded-md bg-emerald-500 border border-emerald-600 shadow-xs" />
                                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                                        HIJAU: AMAN
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="inline-block h-3.5 w-3.5 rounded-md bg-amber-400 border border-amber-500 shadow-xs" />
                                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                                        KUNING: WASPADA
                                    </span>
                                </div>
                                {isClimate ? (
                                    <>
                                        <div className="flex items-center gap-1.5">
                                            <span className="inline-block h-3.5 w-3.5 rounded-md bg-orange-500 border border-orange-600 shadow-xs" />
                                            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                                                ORANYE: SIAGA
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="inline-block h-3.5 w-3.5 rounded-md bg-rose-500 border border-rose-600 shadow-xs" />
                                            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                                                MERAH: AWAS
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        <span className="inline-block h-3.5 w-3.5 rounded-md bg-rose-500 border border-rose-600 shadow-xs" />
                                        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                                            MERAH: RENTAN
                                        </span>
                                    </div>
                                )}
                            </div>

                            <p className="text-[11px] text-slate-500 font-medium">
                                *Warna tiap sel bulan otomatis menyesuaikan filter indikator aktif:{' '}
                                <strong className="text-slate-800 dark:text-white">{activeIndMeta.label}</strong>
                            </p>
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

