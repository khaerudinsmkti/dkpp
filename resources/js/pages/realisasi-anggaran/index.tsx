import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    BarChart3,
    CalendarClock,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Coins,
    Copy,
    Download,
    Eye,
    FileSpreadsheet,
    FileText,
    FileUp,
    Loader2,
    Lock,
    Pencil,
    Plus,
    Save,
    Search,
    Table2,
    Trash2,
    TrendingUp,
    Unlock,
    Upload,
    Wallet,
    X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { PergeseranPanel, type PergeseranLog } from './pergeseran-panel';

const MONTHS = [
    { num: 1, short: 'Jan', label: 'Januari' },
    { num: 2, short: 'Feb', label: 'Februari' },
    { num: 3, short: 'Mar', label: 'Maret' },
    { num: 4, short: 'Apr', label: 'April' },
    { num: 5, short: 'Mei', label: 'Mei' },
    { num: 6, short: 'Jun', label: 'Juni' },
    { num: 7, short: 'Jul', label: 'Juli' },
    { num: 8, short: 'Ags', label: 'Agustus' },
    { num: 9, short: 'Sep', label: 'September' },
    { num: 10, short: 'Okt', label: 'Oktober' },
    { num: 11, short: 'Nov', label: 'November' },
    { num: 12, short: 'Des', label: 'Desember' },
] as const;

interface RekeningItem {
    id: number;
    kode_rekening: string;
    uraian: string;
    jenis_pencairan: 'GU' | 'LS';
    pagu_anggaran: number;
    pagu_murni: number;
    selisih_perubahan: number;
    urutan: number;
    bulanan: Record<number, number>;
    akb_bulanan: Record<number, number>;
    total_akb: number;
    total_realisasi: number;
    sisa: number;
    persen: number;
}

interface SubKegiatanItem {
    id: number;
    tahun_anggaran: number;
    urusan: string | null;
    bidang: string | null;
    unit_organisasi: string | null;
    sub_unit_organisasi: string | null;
    program: string | null;
    kegiatan: string | null;
    kode_sub_kegiatan: string;
    nama_sub_kegiatan: string;
    sumber_pendanaan: string | null;
    lokasi: string | null;
    waktu_pelaksanaan: string | null;
    keterangan: string | null;
    total_anggaran: number;
    total_pagu_murni: number;
    selisih_perubahan: number;
    total_akb: number;
    total_realisasi: number;
    total_sisa: number;
    persen_realisasi: number;
    monthly_totals: Record<number, number>;
    monthly_akb_totals: Record<number, number>;
    rka_file_url: string | null;
    rekenings: RekeningItem[];
}

interface PageProps {
    jenisAnggaran: 'murni' | 'perubahan';
    selectedYear: number;
    availableYears: number[];
    subKegiatans: SubKegiatanItem[];
    pergeserans: PergeseranLog[];
    isMurniLocked: boolean;
    murniLockedInfo: {
        locked_at: string | null;
        locked_by: string | null;
    } | null;
    murniCount: number;
    perubahanCount: number;
}

interface DraftRekeningRow {
    uid: string;
    id?: number;
    kode_rekening: string;
    uraian: string;
    jenis_pencairan: 'GU' | 'LS';
    pagu_anggaran: string;
    total_realisasi?: number;
}

function formatRupiah(val: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val || 0);
}

function formatNumber(val: number): string {
    return new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 0,
    }).format(val || 0);
}

function getXsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

function parseRealisasiTab(
    urlStr: string
): 'dashboard' | 'akb' | 'matrix' | 'pergeseran' | 'upload' {
    try {
        const parsed = new URL(urlStr, 'http://localhost');
        const t = parsed.searchParams.get('tab');
        if (
            t === 'akb' ||
            t === 'matrix' ||
            t === 'pergeseran' ||
            t === 'upload' ||
            t === 'dashboard'
        ) {
            return t;
        }
    } catch {
        // fallback
    }
    return 'dashboard';
}

export default function RealisasiAnggaranIndex({
    jenisAnggaran = 'murni',
    selectedYear,
    availableYears,
    subKegiatans,
    pergeserans,
    isMurniLocked = false,
    murniLockedInfo = null,
    murniCount = 0,
    perubahanCount = 0,
}: PageProps) {
    const page = usePage();
    const isPerubahan = jenisAnggaran === 'perubahan';
    const basePath = isPerubahan
        ? '/realisasi-anggaran/perubahan'
        : '/realisasi-anggaran/murni';
    const isReadOnlyLocked = !isPerubahan && isMurniLocked;
    const [isTogglingLock, setIsTogglingLock] = useState(false);
    const [isCopyingMurni, setIsCopyingMurni] = useState(false);
    const [lockMurniOnCopy, setLockMurniOnCopy] = useState(true);

    const [activeTab, setActiveTab] = useState<
        'dashboard' | 'akb' | 'matrix' | 'pergeseran' | 'upload'
    >(() => parseRealisasiTab(page.url));

    useEffect(() => {
        setActiveTab(parseRealisasiTab(page.url));
    }, [page.url]);

    const navigateTab = (
        tab: 'dashboard' | 'akb' | 'matrix' | 'pergeseran' | 'upload'
    ) => {
        setActiveTab(tab);
        router.get(
            basePath,
            { tahun: selectedYear, tab },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const [chartTab, setChartTab] = useState<'sub_kegiatan' | 'bulanan'>('sub_kegiatan');
    const [tableTab, setTableTab] = useState<'sub_kegiatan' | 'kode_rekening'>('sub_kegiatan');

    // =========================================================================
    // PENGATURAN KOLOM DINAMIS PDF PROGRAM & KEGIATAN
    // =========================================================================
    const PDF_COLUMN_OPTIONS = [
        { key: 'program', label: 'Program' },
        { key: 'kegiatan', label: 'Kegiatan' },
        { key: 'sub_kegiatan', label: 'Sub Kegiatan' },
        { key: 'pagu', label: 'Pagu' },
        { key: 'realisasi', label: 'Realisasi' },
        { key: 'sisa', label: 'Sisa Pagu' },
        { key: 'persen', label: 'Persentase Serapan (%)' },
        { key: 'keterangan', label: 'Keterangan' },
    ] as const;

    const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
    const [pdfSelectedCols, setPdfSelectedCols] = useState<string[]>([
        'program',
        'kegiatan',
        'sub_kegiatan',
        'pagu',
        'realisasi',
        'sisa',
        'persen',
        'keterangan',
    ]);
    const [pdfCustomTitle, setPdfCustomTitle] = useState('');

    const togglePdfCol = (colKey: string) => {
        setPdfSelectedCols((prev) => {
            if (prev.includes(colKey)) {
                if (prev.length <= 1) {
                    toast.error('Minimal 1 kolom harus dipilih untuk dicetak.');
                    return prev;
                }
                return prev.filter((k) => k !== colKey);
            }
            return [...prev, colKey];
        });
    };

    const buildProgramKegiatanPdfUrl = (download: boolean) => {
        const params = new URLSearchParams();
        params.set('tahun', String(selectedYear));
        params.set('jenis', jenisAnggaran);
        params.set('cols', pdfSelectedCols.join(','));
        if (pdfCustomTitle.trim() !== '') {
            params.set('judul', pdfCustomTitle.trim());
        }
        if (download) {
            params.set('download', '1');
        }
        return `/realisasi-anggaran/program-kegiatan/pdf?${params.toString()}`;
    };

    // =========================================================================
    // DASHBOARD FILTER STATE
    // =========================================================================
    const [rekStatusFilter, setRekStatusFilter] = useState<
        'all' | 'zero' | 'partial' | 'full'
    >('all');
    const [rekJenisFilter, setRekJenisFilter] = useState<'all' | 'GU' | 'LS'>('all');
    const [rekSearch, setRekSearch] = useState('');
    const [expandedRekeningCodes, setExpandedRekeningCodes] = useState<
        Record<string, boolean>
    >({});

    const toggleRekeningDetail = (kodeRekening: string) => {
        setExpandedRekeningCodes((prev) => ({
            ...prev,
            [kodeRekening]: !prev[kodeRekening],
        }));
    };

    // =========================================================================
    // TAB 2: MATRIKS INPUT REALISASI BULANAN (JAN - DES)
    // =========================================================================
    const [selectedSkId, setSelectedSkId] = useState<string>(
        subKegiatans[0] ? String(subKegiatans[0].id) : ''
    );
    const [matrixValues, setMatrixValues] = useState<
        Record<number, Record<number, string>>
    >({});
    const [akbValues, setAkbValues] = useState<
        Record<number, Record<number, string>>
    >({});
    const [matrixJenisValues, setMatrixJenisValues] = useState<
        Record<number, 'GU' | 'LS'>
    >({});
    const [isSavingMatrix, setIsSavingMatrix] = useState(false);
    const [isSavingAkb, setIsSavingAkb] = useState(false);

    const activeSubKegiatan = useMemo(() => {
        if (!subKegiatans.length) return null;
        return (
            subKegiatans.find((sk) => String(sk.id) === String(selectedSkId)) ||
            subKegiatans[0]
        );
    }, [subKegiatans, selectedSkId]);

    useEffect(() => {
        if (!activeSubKegiatan) {
            setMatrixValues({});
            setAkbValues({});
            setMatrixJenisValues({});
            return;
        }
        if (String(activeSubKegiatan.id) !== String(selectedSkId)) {
            setSelectedSkId(String(activeSubKegiatan.id));
        }
        const initial: Record<number, Record<number, string>> = {};
        const initialAkb: Record<number, Record<number, string>> = {};
        const initialJenis: Record<number, 'GU' | 'LS'> = {};
        activeSubKegiatan.rekenings.forEach((rek) => {
            initial[rek.id] = {};
            initialAkb[rek.id] = {};
            initialJenis[rek.id] = rek.jenis_pencairan === 'LS' ? 'LS' : 'GU';
            MONTHS.forEach((m) => {
                const v = rek.bulanan[m.num] || 0;
                initial[rek.id][m.num] = v > 0 ? String(Math.round(v)) : '';
                const a = rek.akb_bulanan?.[m.num] || 0;
                initialAkb[rek.id][m.num] = a > 0 ? String(Math.round(a)) : '';
            });
        });
        setMatrixValues(initial);
        setAkbValues(initialAkb);
        setMatrixJenisValues(initialJenis);
    }, [activeSubKegiatan]);

    // =========================================================================
    // TAB 3: UPLOAD PDF RKA & EDIT / VERIFIKASI SEBELUM SIMPAN
    // =========================================================================
    const [editingSubKegiatanId, setEditingSubKegiatanId] = useState<number | null>(null);
    const [rkaFile, setRkaFile] = useState<File | null>(null);
    const [isParsingRka, setIsParsingRka] = useState(false);
    const [isSavingRka, setIsSavingRka] = useState(false);

    const [draftTahun, setDraftTahun] = useState<string>(String(selectedYear));
    const [draftUrusan, setDraftUrusan] = useState('');
    const [draftBidang, setDraftBidang] = useState('');
    const [draftUnit, setDraftUnit] = useState('');
    const [draftSubUnit, setDraftSubUnit] = useState('');
    const [draftProgram, setDraftProgram] = useState('');
    const [draftKegiatan, setDraftKegiatan] = useState('');
    const [draftKodeSk, setDraftKodeSk] = useState('');
    const [draftNamaSk, setDraftNamaSk] = useState('');
    const [draftSumberDana, setDraftSumberDana] = useState('');
    const [draftLokasi, setDraftLokasi] = useState('');
    const [draftWaktu, setDraftWaktu] = useState('');
    const [draftKeterangan, setDraftKeterangan] = useState('');
    const [draftRekenings, setDraftRekenings] = useState<DraftRekeningRow[]>([
        {
            uid: `rk-${Date.now()}-1`,
            kode_rekening: '',
            uraian: '',
            jenis_pencairan: 'GU',
            pagu_anggaran: '',
        },
    ]);

    const editingSubKegiatan = useMemo(
        () => subKegiatans.find((sk) => sk.id === editingSubKegiatanId) || null,
        [subKegiatans, editingSubKegiatanId]
    );

    const resetDraftForm = () => {
        setEditingSubKegiatanId(null);
        setRkaFile(null);
        setDraftTahun(String(selectedYear));
        setDraftUrusan('');
        setDraftBidang('');
        setDraftUnit('');
        setDraftSubUnit('');
        setDraftProgram('');
        setDraftKegiatan('');
        setDraftKodeSk('');
        setDraftNamaSk('');
        setDraftSumberDana('');
        setDraftLokasi('');
        setDraftWaktu('');
        setDraftKeterangan('');
        setDraftRekenings([
            {
                uid: `rk-${Date.now()}-1`,
                kode_rekening: '',
                uraian: '',
                jenis_pencairan: 'GU',
                pagu_anggaran: '',
            },
        ]);
    };

    const handleStartEditSubKegiatan = (sk: SubKegiatanItem) => {
        setEditingSubKegiatanId(sk.id);
        setRkaFile(null);
        setDraftTahun(String(sk.tahun_anggaran));
        setDraftUrusan(sk.urusan || '');
        setDraftBidang(sk.bidang || '');
        setDraftUnit(sk.unit_organisasi || '');
        setDraftSubUnit(sk.sub_unit_organisasi || '');
        setDraftProgram(sk.program || '');
        setDraftKegiatan(sk.kegiatan || '');
        setDraftKodeSk(sk.kode_sub_kegiatan || '');
        setDraftNamaSk(sk.nama_sub_kegiatan || '');
        setDraftSumberDana(sk.sumber_pendanaan || '');
        setDraftLokasi(sk.lokasi || '');
        setDraftWaktu(sk.waktu_pelaksanaan || '');
        setDraftKeterangan(sk.keterangan || '');
        setDraftRekenings(
            sk.rekenings.length > 0
                ? sk.rekenings.map((rek) => ({
                      uid: `edit-${rek.id}`,
                      id: rek.id,
                      kode_rekening: rek.kode_rekening,
                      uraian: rek.uraian,
                      jenis_pencairan: rek.jenis_pencairan === 'LS' ? 'LS' : 'GU',
                      pagu_anggaran: String(Math.round(rek.pagu_anggaran || 0)),
                      total_realisasi: rek.total_realisasi,
                  }))
                : [
                      {
                          uid: `rk-${Date.now()}-1`,
                          kode_rekening: '',
                          uraian: '',
                          jenis_pencairan: 'GU',
                          pagu_anggaran: '',
                      },
                  ]
        );
        navigateTab('upload');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // =========================================================================
    // AGREGASI DASHBOARD ATASAN
    // =========================================================================
    const dashboardStats = useMemo(() => {
        let totalPagu = 0;
        let totalRealisasi = 0;
        let guPagu = 0;
        let guRealisasi = 0;
        let guCount = 0;
        let lsPagu = 0;
        let lsRealisasi = 0;
        let lsCount = 0;

        const subKegiatanGuLs: Record<
            number,
            { guPagu: number; guRealisasi: number; lsPagu: number; lsRealisasi: number }
        > = {};

        const monthlyAgg: Record<number, number> = {};
        const monthlyAkbAgg: Record<number, number> = {};
        MONTHS.forEach((m) => {
            monthlyAgg[m.num] = 0;
            monthlyAkbAgg[m.num] = 0;
        });

        const groupedMap = new Map<
            string,
            {
                kode_rekening: string;
                uraian: string;
                pagu_anggaran: number;
                total_realisasi: number;
                sisa: number;
                persen: number;
                sources: Array<{
                    sub_kegiatan_id: number;
                    kode_sub_kegiatan: string;
                    nama_sub_kegiatan: string;
                    jenis_pencairan: 'GU' | 'LS';
                    pagu: number;
                    realisasi: number;
                }>;
            }
        >();

        subKegiatans.forEach((sk) => {
            totalPagu += sk.total_anggaran;
            totalRealisasi += sk.total_realisasi;
            subKegiatanGuLs[sk.id] = { guPagu: 0, guRealisasi: 0, lsPagu: 0, lsRealisasi: 0 };

            MONTHS.forEach((m) => {
                monthlyAgg[m.num] += sk.monthly_totals[m.num] || 0;
                monthlyAkbAgg[m.num] += sk.monthly_akb_totals?.[m.num] || 0;
            });
            sk.rekenings.forEach((rek) => {
                const jenis: 'GU' | 'LS' = rek.jenis_pencairan === 'LS' ? 'LS' : 'GU';
                if (jenis === 'LS') {
                    lsPagu += rek.pagu_anggaran;
                    lsRealisasi += rek.total_realisasi;
                    lsCount += 1;
                    subKegiatanGuLs[sk.id].lsPagu += rek.pagu_anggaran;
                    subKegiatanGuLs[sk.id].lsRealisasi += rek.total_realisasi;
                } else {
                    guPagu += rek.pagu_anggaran;
                    guRealisasi += rek.total_realisasi;
                    guCount += 1;
                    subKegiatanGuLs[sk.id].guPagu += rek.pagu_anggaran;
                    subKegiatanGuLs[sk.id].guRealisasi += rek.total_realisasi;
                }

                const key = rek.kode_rekening.trim();
                const existing = groupedMap.get(key);
                if (existing) {
                    existing.pagu_anggaran += rek.pagu_anggaran;
                    existing.total_realisasi += rek.total_realisasi;
                    existing.sisa = existing.pagu_anggaran - existing.total_realisasi;
                    existing.persen =
                        existing.pagu_anggaran > 0
                            ? (existing.total_realisasi / existing.pagu_anggaran) * 100
                            : 0;
                    existing.sources.push({
                        sub_kegiatan_id: sk.id,
                        kode_sub_kegiatan: sk.kode_sub_kegiatan,
                        nama_sub_kegiatan: sk.nama_sub_kegiatan,
                        jenis_pencairan: jenis,
                        pagu: rek.pagu_anggaran,
                        realisasi: rek.total_realisasi,
                    });
                } else {
                    const sisa = rek.pagu_anggaran - rek.total_realisasi;
                    const persen =
                        rek.pagu_anggaran > 0
                            ? (rek.total_realisasi / rek.pagu_anggaran) * 100
                            : 0;
                    groupedMap.set(key, {
                        kode_rekening: key,
                        uraian: rek.uraian,
                        pagu_anggaran: rek.pagu_anggaran,
                        total_realisasi: rek.total_realisasi,
                        sisa,
                        persen,
                        sources: [
                            {
                                sub_kegiatan_id: sk.id,
                                kode_sub_kegiatan: sk.kode_sub_kegiatan,
                                nama_sub_kegiatan: sk.nama_sub_kegiatan,
                                jenis_pencairan: jenis,
                                pagu: rek.pagu_anggaran,
                                realisasi: rek.total_realisasi,
                            },
                        ],
                    });
                }
            });
        });

        const groupedRekenings = Array.from(groupedMap.values()).sort((a, b) =>
            a.kode_rekening.localeCompare(b.kode_rekening, 'id')
        );

        const totalSisa = totalPagu - totalRealisasi;
        const persenTotal = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;
        const guSisa = guPagu - guRealisasi;
        const guPersen = guPagu > 0 ? (guRealisasi / guPagu) * 100 : 0;
        const lsSisa = lsPagu - lsRealisasi;
        const lsPersen = lsPagu > 0 ? (lsRealisasi / lsPagu) * 100 : 0;
        const zeroRekenings = groupedRekenings.filter((r) => r.total_realisasi <= 0);
        const zeroPaguSum = zeroRekenings.reduce((acc, r) => acc + r.pagu_anggaran, 0);

        const subKegiatanChartData = subKegiatans.map((sk) => ({
            name:
                sk.nama_sub_kegiatan.length > 48
                    ? `${sk.nama_sub_kegiatan.slice(0, 48)}...`
                    : sk.nama_sub_kegiatan,
            fullName: `${sk.kode_sub_kegiatan} - ${sk.nama_sub_kegiatan}`,
            Pagu: Math.round(sk.total_anggaran),
            Realisasi: Math.round(sk.total_realisasi),
            Sisa: Math.round(sk.total_sisa),
        }));

        const monthlyChartData = MONTHS.map((m) => ({
            bulan: m.short,
            AKB: Math.round(monthlyAkbAgg[m.num] || 0),
            Realisasi: Math.round(monthlyAgg[m.num] || 0),
        }));

        return {
            totalPagu,
            totalRealisasi,
            totalSisa,
            persenTotal,
            guPagu,
            guRealisasi,
            guSisa,
            guPersen,
            guCount,
            lsPagu,
            lsRealisasi,
            lsSisa,
            lsPersen,
            lsCount,
            subKegiatanGuLs,
            groupedRekenings,
            zeroCount: zeroRekenings.length,
            zeroPaguSum,
            subKegiatanChartData,
            monthlyChartData,
        };
    }, [subKegiatans]);

    const filteredGroupedRekenings = useMemo(() => {
        const q = rekSearch.trim().toLowerCase();
        return dashboardStats.groupedRekenings
            .map((r) => {
                if (rekJenisFilter === 'all') return r;
                const filteredSources = r.sources.filter(
                    (s) => s.jenis_pencairan === rekJenisFilter
                );
                if (filteredSources.length === 0) return null;
                const pagu = filteredSources.reduce((acc, s) => acc + s.pagu, 0);
                const realisasi = filteredSources.reduce((acc, s) => acc + s.realisasi, 0);
                const sisa = pagu - realisasi;
                const persen = pagu > 0 ? (realisasi / pagu) * 100 : 0;
                return {
                    ...r,
                    pagu_anggaran: pagu,
                    total_realisasi: realisasi,
                    sisa,
                    persen,
                    sources: filteredSources,
                };
            })
            .filter((r): r is NonNullable<typeof r> => {
                if (!r) return false;
                if (rekStatusFilter === 'zero' && r.total_realisasi > 0) return false;
                if (
                    rekStatusFilter === 'partial' &&
                    (r.total_realisasi <= 0 || r.sisa <= 0)
                )
                    return false;
                if (rekStatusFilter === 'full' && r.sisa > 0) return false;

                if (!q) return true;
                return (
                    r.kode_rekening.toLowerCase().includes(q) ||
                    r.uraian.toLowerCase().includes(q) ||
                    r.sources.some(
                        (s) =>
                            s.nama_sub_kegiatan.toLowerCase().includes(q) ||
                            s.kode_sub_kegiatan.toLowerCase().includes(q)
                    )
                );
            });
    }, [dashboardStats.groupedRekenings, rekStatusFilter, rekJenisFilter, rekSearch]);

    // Hitung total real-time pada Form Matriks Tab 2 (termasuk validasi AKB Kumulatif s.d. Bulan Berjalan)
    const liveMatrixSummary = useMemo(() => {
        if (!activeSubKegiatan) {
            return {
                rowTotals: {} as Record<number, { total: number; sisa: number }>,
                monthTotals: {} as Record<number, number>,
                cellAkbStatus: {} as Record<
                    number,
                    Record<
                        number,
                        { cumAkb: number; avail: number; isOverAkb: boolean }
                    >
                >,
                firstAkbViolation: null as string | null,
                grandPagu: 0,
                grandRealisasi: 0,
                grandSisa: 0,
                guPagu: 0,
                guRealisasi: 0,
                lsPagu: 0,
                lsRealisasi: 0,
            };
        }

        const rowTotals: Record<number, { total: number; sisa: number }> = {};
        const monthTotals: Record<number, number> = {};
        const cellAkbStatus: Record<
            number,
            Record<number, { cumAkb: number; avail: number; isOverAkb: boolean }>
        > = {};
        let firstAkbViolation: string | null = null;

        MONTHS.forEach((m) => {
            monthTotals[m.num] = 0;
        });

        let grandPagu = 0;
        let grandRealisasi = 0;
        let guPagu = 0;
        let guRealisasi = 0;
        let lsPagu = 0;
        let lsRealisasi = 0;

        activeSubKegiatan.rekenings.forEach((rek) => {
            let rowSum = 0;
            let cumAkb = 0;
            let cumRealBefore = 0;
            cellAkbStatus[rek.id] = {};

            MONTHS.forEach((m) => {
                const rawStr = matrixValues[rek.id]?.[m.num] ?? '';
                const val = Math.max(0, Number(rawStr) || 0);
                const akbM = rek.akb_bulanan?.[m.num] || 0;
                cumAkb += akbM;
                const avail = Math.max(0, cumAkb - cumRealBefore);
                const isOverAkb = val > 0 && cumRealBefore + val > cumAkb + 0.01;

                cellAkbStatus[rek.id][m.num] = { cumAkb, avail, isOverAkb };
                if (isOverAkb && !firstAkbViolation) {
                    firstAkbViolation = `Pencairan ${m.label} pada rekening ${rek.kode_rekening} melebihi batas AKB kumulatif (Maks: ${formatRupiah(avail)}).`;
                }

                cumRealBefore += val;
                rowSum += val;
                monthTotals[m.num] += val;
            });
            const sisa = rek.pagu_anggaran - rowSum;
            rowTotals[rek.id] = { total: rowSum, sisa };
            grandPagu += rek.pagu_anggaran;
            grandRealisasi += rowSum;

            const jenis = matrixJenisValues[rek.id] ?? rek.jenis_pencairan ?? 'GU';
            if (jenis === 'LS') {
                lsPagu += rek.pagu_anggaran;
                lsRealisasi += rowSum;
            } else {
                guPagu += rek.pagu_anggaran;
                guRealisasi += rowSum;
            }
        });

        return {
            rowTotals,
            monthTotals,
            cellAkbStatus,
            firstAkbViolation,
            grandPagu,
            grandRealisasi,
            grandSisa: grandPagu - grandRealisasi,
            guPagu,
            guRealisasi,
            lsPagu,
            lsRealisasi,
        };
    }, [activeSubKegiatan, matrixValues, matrixJenisValues]);

    // Hitung total real-time pada Form Input AKB (Anggaran Kas Belanja)
    const liveAkbSummary = useMemo(() => {
        if (!activeSubKegiatan) {
            return {
                rowTotals: {} as Record<
                    number,
                    { totalAkb: number; sisaPagu: number; isOverPagu: boolean }
                >,
                monthTotals: {} as Record<number, number>,
                grandPagu: 0,
                grandAkb: 0,
                grandSisaPagu: 0,
                firstAkbError: null as string | null,
            };
        }

        const rowTotals: Record<
            number,
            { totalAkb: number; sisaPagu: number; isOverPagu: boolean }
        > = {};
        const monthTotals: Record<number, number> = {};
        MONTHS.forEach((m) => {
            monthTotals[m.num] = 0;
        });

        let grandPagu = 0;
        let grandAkb = 0;
        let firstAkbError: string | null = null;

        activeSubKegiatan.rekenings.forEach((rek) => {
            let rowAkb = 0;
            let cumAkb = 0;
            let cumReal = 0;

            MONTHS.forEach((m) => {
                const rawStr = akbValues[rek.id]?.[m.num] ?? '';
                const val = Math.max(0, Number(rawStr) || 0);
                const existingReal = rek.bulanan?.[m.num] || 0;
                rowAkb += val;
                cumAkb += val;
                cumReal += existingReal;
                monthTotals[m.num] += val;

                if (cumReal > cumAkb + 0.01 && !firstAkbError) {
                    firstAkbError = `AKB kumulatif s.d. ${m.label} pada rekening ${rek.kode_rekening} lebih kecil dari realisasi yang sudah terinput (${formatRupiah(cumReal)}).`;
                }
            });

            const sisaPagu = rek.pagu_anggaran - rowAkb;
            const isOverPagu = rowAkb > rek.pagu_anggaran + 0.01;
            if (isOverPagu && !firstAkbError) {
                firstAkbError = `Total AKB rekening ${rek.kode_rekening} (${formatRupiah(rowAkb)}) melebihi Pagu Anggaran (${formatRupiah(rek.pagu_anggaran)}).`;
            }

            rowTotals[rek.id] = { totalAkb: rowAkb, sisaPagu, isOverPagu };
            grandPagu += rek.pagu_anggaran;
            grandAkb += rowAkb;
        });

        return {
            rowTotals,
            monthTotals,
            grandPagu,
            grandAkb,
            grandSisaPagu: grandPagu - grandAkb,
            firstAkbError,
        };
    }, [activeSubKegiatan, akbValues]);

    const draftTotalAnggaran = useMemo(() => {
        return draftRekenings.reduce(
            (sum, r) => sum + (Number(r.pagu_anggaran) || 0),
            0
        );
    }, [draftRekenings]);

    // =========================================================================
    // HANDLERS
    // =========================================================================
    const handleYearChange = (yr: string) => {
        router.get(
            basePath,
            { tahun: yr, tab: activeTab },
            { preserveState: false }
        );
    };

    const handleToggleMurniLock = (nextLocked: boolean) => {
        const msg = nextLocked
            ? `Kunci Anggaran Murni TA ${selectedYear}? Data Murni akan menjadi read-only agar tidak tidak sengaja diubah saat Anggaran Perubahan aktif.`
            : `Buka kunci Anggaran Murni TA ${selectedYear}? Data Murni akan dapat diedit kembali.`;
        if (!window.confirm(msg)) return;

        setIsTogglingLock(true);
        router.post(
            '/realisasi-anggaran/toggle-lock',
            { tahun_anggaran: selectedYear, locked: nextLocked },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        nextLocked
                            ? `Anggaran Murni TA ${selectedYear} berhasil dikunci.`
                            : `Kunci Anggaran Murni TA ${selectedYear} dibuka.`
                    );
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(first ? String(first) : 'Gagal mengubah status kunci.');
                },
                onFinish: () => setIsTogglingLock(false),
            }
        );
    };

    const handleCopyMurniToPerubahan = (shouldLockMurni: boolean) => {
        const msg = shouldLockMurni
            ? `Salin ${murniCount} Sub Kegiatan (beserta AKB & Realisasi Bulanan) dari Anggaran Murni TA ${selectedYear} ke Anggaran Perubahan, sekaligus KUNCI Anggaran Murni?`
            : `Salin ${murniCount} Sub Kegiatan (beserta AKB & Realisasi Bulanan) dari Anggaran Murni TA ${selectedYear} ke Anggaran Perubahan?`;
        if (!window.confirm(msg)) return;

        setIsCopyingMurni(true);
        router.post(
            '/realisasi-anggaran/copy-murni-to-perubahan',
            {
                tahun_anggaran: selectedYear,
                lock_murni: shouldLockMurni,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `Data Anggaran Murni TA ${selectedYear} berhasil disalin ke Anggaran Perubahan.`
                    );
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(first ? String(first) : 'Gagal menyalin data dari Murni.');
                },
                onFinish: () => setIsCopyingMurni(false),
            }
        );
    };

    const handleParseRkaPdf = async () => {
        if (!rkaFile) {
            toast.error('Silakan pilih file PDF RKA-Belanja terlebih dahulu.');
            return;
        }

        const formData = new FormData();
        formData.append('rka_pdf', rkaFile);

        setIsParsingRka(true);
        try {
            const res = await fetch('/realisasi-anggaran/parse-rka', {
                method: 'POST',
                headers: {
                    'X-XSRF-TOKEN': getXsrfToken(),
                    Accept: 'application/json',
                },
                body: formData,
            });
            const json = await res.json();

            if (!res.ok || !json.success) {
                toast.error(json.message || 'Gagal membaca file PDF RKA.');
                return;
            }

            const d = json.data;
            setDraftTahun(String(d.tahun_anggaran || selectedYear));
            setDraftUrusan(d.urusan || '');
            setDraftBidang(d.bidang || '');
            setDraftUnit(d.unit_organisasi || '');
            setDraftSubUnit(d.sub_unit_organisasi || d.unit_organisasi || '');
            setDraftProgram(d.program || '');
            setDraftKegiatan(d.kegiatan || '');
            setDraftKodeSk(d.kode_sub_kegiatan || '');
            setDraftNamaSk(d.nama_sub_kegiatan || '');
            setDraftSumberDana(d.sumber_pendanaan || '');
            setDraftLokasi(d.lokasi || '');
            setDraftWaktu(d.waktu_pelaksanaan || '');

            if (Array.isArray(d.rekenings) && d.rekenings.length > 0) {
                setDraftRekenings(
                    d.rekenings.map(
                        (
                            r: {
                                kode_rekening: string;
                                uraian: string;
                                pagu_anggaran: number;
                            },
                            idx: number
                        ) => ({
                            uid: `parsed-${Date.now()}-${idx}`,
                            kode_rekening: r.kode_rekening || '',
                            uraian: r.uraian || '',
                            jenis_pencairan: 'GU' as const,
                            pagu_anggaran: String(Math.round(r.pagu_anggaran || 0)),
                        })
                    )
                );
                toast.success(
                    `PDF RKA berhasil dibaca! Ditemukan ${d.rekenings.length} kode rekening belanja.`
                );
            } else {
                toast.warning(
                    'Header RKA berhasil dibaca, namun belum ditemukan baris kode rekening 6 segmen. Anda dapat menambahkannya secara manual di bawah.'
                );
            }
        } catch {
            toast.error('Terjadi kesalahan jaringan saat membaca PDF RKA.');
        } finally {
            setIsParsingRka(false);
        }
    };

    const handleSaveRkaToDatabase = (e: React.FormEvent) => {
        e.preventDefault();

        const validRekenings = draftRekenings.filter(
            (r) => r.kode_rekening.trim() !== '' && r.uraian.trim() !== ''
        );

        if (!draftKodeSk.trim() || !draftNamaSk.trim()) {
            toast.error('Kode Sub Kegiatan dan Nama Sub Kegiatan wajib diisi.');
            return;
        }
        if (validRekenings.length === 0) {
            toast.error('Minimal 1 Kode Rekening Belanja wajib diisi.');
            return;
        }

        const formData = new FormData();
        formData.append('tahun_anggaran', draftTahun);
        formData.append('jenis_anggaran', jenisAnggaran);
        formData.append('urusan', draftUrusan.trim());
        formData.append('bidang', draftBidang.trim());
        formData.append('unit_organisasi', draftUnit.trim());
        formData.append('sub_unit_organisasi', draftSubUnit.trim());
        formData.append('program', draftProgram.trim());
        formData.append('kegiatan', draftKegiatan.trim());
        formData.append('kode_sub_kegiatan', draftKodeSk.trim());
        formData.append('nama_sub_kegiatan', draftNamaSk.trim());
        formData.append('sumber_pendanaan', draftSumberDana.trim());
        formData.append('lokasi', draftLokasi.trim());
        formData.append('waktu_pelaksanaan', draftWaktu.trim());
        formData.append('keterangan', draftKeterangan.trim());
        if (rkaFile) {
            formData.append('rka_pdf', rkaFile);
        }

        validRekenings.forEach((r, idx) => {
            if (r.id) {
                formData.append(`rekenings[${idx}][id]`, String(r.id));
            }
            formData.append(`rekenings[${idx}][kode_rekening]`, r.kode_rekening.trim());
            formData.append(`rekenings[${idx}][uraian]`, r.uraian.trim());
            formData.append(`rekenings[${idx}][jenis_pencairan]`, r.jenis_pencairan || 'GU');
            formData.append(
                `rekenings[${idx}][pagu_anggaran]`,
                String(Math.max(0, Number(r.pagu_anggaran) || 0))
            );
        });

        const isEditing = editingSubKegiatanId !== null;
        const targetUrl = isEditing
            ? `/realisasi-anggaran/sub-kegiatan/${editingSubKegiatanId}`
            : '/realisasi-anggaran/sub-kegiatan';

        setIsSavingRka(true);
        router.post(targetUrl, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    isEditing
                        ? 'Perubahan data RKA Sub Kegiatan & Kode Rekening berhasil disimpan.'
                        : 'Sub Kegiatan & Kode Rekening RKA berhasil disimpan ke database.'
                );
                if (isEditing && editingSubKegiatanId) {
                    setSelectedSkId(String(editingSubKegiatanId));
                }
                resetDraftForm();
                navigateTab('matrix');
            },
            onError: (errors) => {
                const firstErr = Object.values(errors)[0];
                toast.error(firstErr ? String(firstErr) : 'Gagal menyimpan data RKA.');
            },
            onFinish: () => setIsSavingRka(false),
        });
    };

    const handleSaveAkb = () => {
        if (!activeSubKegiatan) return;

        if (liveAkbSummary.firstAkbError) {
            toast.error(liveAkbSummary.firstAkbError);
            return;
        }

        const items = activeSubKegiatan.rekenings.map((rek) => {
            const akb: Record<number, number> = {};
            MONTHS.forEach((m) => {
                const val = Number(akbValues[rek.id]?.[m.num] ?? 0) || 0;
                akb[m.num] = Math.max(0, val);
            });
            return {
                rekening_id: rek.id,
                akb,
            };
        });

        setIsSavingAkb(true);
        router.post(
            `/realisasi-anggaran/sub-kegiatan/${activeSubKegiatan.id}/akb`,
            { items },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('AKB (Anggaran Kas Belanja) berhasil disimpan.');
                },
                onError: (errors) => {
                    const firstErr = Object.values(errors)[0];
                    toast.error(
                        firstErr ? String(firstErr) : 'Gagal menyimpan AKB.'
                    );
                },
                onFinish: () => setIsSavingAkb(false),
            }
        );
    };

    const handleSaveMatrix = () => {
        if (!activeSubKegiatan) return;

        if (liveMatrixSummary.firstAkbViolation) {
            toast.error(liveMatrixSummary.firstAkbViolation);
            return;
        }

        const items = activeSubKegiatan.rekenings.map((rek) => {
            const bulanan: Record<number, number> = {};
            MONTHS.forEach((m) => {
                const val = Number(matrixValues[rek.id]?.[m.num] ?? 0) || 0;
                bulanan[m.num] = Math.max(0, val);
            });
            return {
                rekening_id: rek.id,
                jenis_pencairan: matrixJenisValues[rek.id] ?? rek.jenis_pencairan ?? 'GU',
                bulanan,
            };
        });

        setIsSavingMatrix(true);
        router.post(
            `/realisasi-anggaran/sub-kegiatan/${activeSubKegiatan.id}/matrix`,
            { items },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Realisasi bulanan berhasil disimpan.');
                },
                onError: (errors) => {
                    const firstErr = Object.values(errors)[0];
                    toast.error(
                        firstErr
                            ? String(firstErr)
                            : 'Gagal menyimpan realisasi bulanan.'
                    );
                },
                onFinish: () => setIsSavingMatrix(false),
            }
        );
    };

    const handleDeleteSubKegiatan = (sk: SubKegiatanItem) => {
        if (
            !window.confirm(
                `Hapus Sub Kegiatan "${sk.kode_sub_kegiatan} - ${sk.nama_sub_kegiatan}" beserta seluruh data realisasinya?`
            )
        ) {
            return;
        }
        router.delete(`/realisasi-anggaran/sub-kegiatan/${sk.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                if (editingSubKegiatanId === sk.id) {
                    resetDraftForm();
                }
                toast.success('Sub Kegiatan berhasil dihapus.');
            },
        });
    };

    return (
        <>
            <Head
                title={`${isPerubahan ? 'Anggaran Perubahan' : 'Anggaran Murni'} TA ${selectedYear} - DKPP Indramayu`}
            />

            <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-5 p-4 md:p-6">
                {/* HEADER BANNER */}
                <div
                    className={`relative overflow-hidden rounded-2xl border p-5 text-white shadow-sm ${
                        isPerubahan
                            ? 'border-indigo-300/80 bg-gradient-to-r from-indigo-900 via-indigo-700 to-violet-700'
                            : 'border-teal-200/80 bg-gradient-to-r from-[#005555] via-[#006565] to-[#007a7a]'
                    }`}
                >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-xs">
                                <Coins className="size-6 text-white" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                        className={`text-[10px] font-extrabold tracking-wider uppercase ${
                                            isPerubahan
                                                ? 'bg-amber-400 text-indigo-950 hover:bg-amber-400'
                                                : 'bg-emerald-300 text-teal-950 hover:bg-emerald-300'
                                        }`}
                                    >
                                        {isPerubahan
                                            ? 'ANGGARAN PERUBAHAN'
                                            : 'ANGGARAN MURNI'}
                                    </Badge>
                                    <Badge className="bg-white/20 text-[10px] font-bold text-white hover:bg-white/25">
                                        TA {selectedYear}
                                    </Badge>
                                    {isReadOnlyLocked && (
                                        <Badge className="gap-1 bg-amber-500 text-[10px] font-extrabold text-white hover:bg-amber-500">
                                            <Lock className="size-3" />
                                            TERKUNCI (READ-ONLY)
                                        </Badge>
                                    )}
                                </div>
                                <h1 className="mt-1 text-lg font-extrabold tracking-tight md:text-xl">
                                    {activeTab === 'akb'
                                        ? `Input AKB ${isPerubahan ? 'Perubahan' : 'Murni'} (Anggaran Kas Belanja)`
                                        : activeTab === 'matrix'
                                          ? `Input Realisasi Bulanan ${isPerubahan ? 'Perubahan' : 'Murni'} (Jan–Des)`
                                          : activeTab === 'pergeseran'
                                            ? `Pergeseran Anggaran ${isPerubahan ? 'Perubahan' : 'Murni'}`
                                            : activeTab === 'upload'
                                              ? editingSubKegiatan
                                                  ? `Edit Data RKA ${isPerubahan ? 'Perubahan' : 'Murni'}`
                                                  : `Upload & Kelola RKA ${isPerubahan ? 'Perubahan' : 'Murni'}`
                                              : `Dashboard Monitoring ${isPerubahan ? 'Anggaran Perubahan' : 'Anggaran Murni'}`}
                                </h1>
                                <p
                                    className={`mt-0.5 text-xs md:text-sm ${
                                        isPerubahan ? 'text-indigo-100' : 'text-teal-100'
                                    }`}
                                >
                                    {isPerubahan
                                        ? 'Ruang kerja khusus APBD Perubahan — data terpisah dari arsip Murni dengan perbandingan pagu otomatis.'
                                        : 'Ruang kerja khusus APBD Murni — upload PDF RKA SIPD-RI, input AKB, realisasi bulanan, dan monitoring serapan.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-1.5 ring-1 ring-white/25">
                                <span className="text-xs font-bold text-white/90">Tahun:</span>
                                <Select
                                    value={String(selectedYear)}
                                    onValueChange={handleYearChange}
                                >
                                    <SelectTrigger
                                        className={`h-8 w-[96px] border-0 bg-white text-xs font-extrabold ${
                                            isPerubahan ? 'text-indigo-800' : 'text-[#006565]'
                                        }`}
                                    >
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

                            {!isPerubahan && (
                                <Button
                                    type="button"
                                    disabled={isTogglingLock}
                                    onClick={() => handleToggleMurniLock(!isMurniLocked)}
                                    className={`gap-1.5 font-bold shadow-xs ${
                                        isMurniLocked
                                            ? 'bg-amber-400 text-amber-950 hover:bg-amber-300'
                                            : 'bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25'
                                    }`}
                                >
                                    {isMurniLocked ? (
                                        <>
                                            <Unlock className="size-4" />
                                            Buka Kunci Murni
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="size-4" />
                                            Kunci Murni
                                        </>
                                    )}
                                </Button>
                            )}

                            {isPerubahan && murniCount > 0 && (
                                <Button
                                    type="button"
                                    disabled={isCopyingMurni}
                                    onClick={() => handleCopyMurniToPerubahan(true)}
                                    className="gap-1.5 bg-amber-400 font-bold text-indigo-950 shadow-xs hover:bg-amber-300"
                                >
                                    {isCopyingMurni ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Copy className="size-4" />
                                    )}
                                    Salin dari Murni
                                </Button>
                            )}

                            {activeTab !== 'upload' && !isReadOnlyLocked && (
                                <Button
                                    type="button"
                                    onClick={() => {
                                        resetDraftForm();
                                        navigateTab('upload');
                                    }}
                                    className={`gap-1.5 bg-white font-bold shadow-xs ${
                                        isPerubahan
                                            ? 'text-indigo-800 hover:bg-indigo-50'
                                            : 'text-[#006565] hover:bg-teal-50'
                                    }`}
                                >
                                    <FileUp className="size-4" />
                                    Upload PDF RKA
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* BANNER LOCK ANGGARAN MURNI */}
                {isReadOnlyLocked && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-950 shadow-2xs">
                        <div className="flex items-start gap-2.5">
                            <Lock className="mt-0.5 size-4 shrink-0 text-amber-600" />
                            <div>
                                <div className="font-extrabold">
                                    Anggaran Murni TA {selectedYear} sedang dikunci (Mode Arsip / Read-Only)
                                </div>
                                <div className="mt-0.5 text-[11px] text-amber-800">
                                    {perubahanCount > 0
                                        ? `Anggaran Perubahan TA ${selectedYear} sudah aktif (${perubahanCount} Sub Kegiatan). `
                                        : ''}
                                    Perubahan data RKA, AKB, dan Realisasi di menu Murni dinonaktifkan agar arsip tetap utuh.
                                    {murniLockedInfo?.locked_at && (
                                        <span>
                                            {' '}
                                            Dikunci pada {murniLockedInfo.locked_at}
                                            {murniLockedInfo.locked_by
                                                ? ` oleh ${murniLockedInfo.locked_by}`
                                                : ''}
                                            .
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    router.get('/realisasi-anggaran/perubahan', {
                                        tahun: selectedYear,
                                    })
                                }
                                className="h-8 border-indigo-300 bg-white text-xs font-bold text-indigo-700 hover:bg-indigo-50"
                            >
                                Buka Anggaran Perubahan
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                disabled={isTogglingLock}
                                onClick={() => handleToggleMurniLock(false)}
                                className="h-8 gap-1 bg-amber-600 text-xs font-bold text-white hover:bg-amber-700"
                            >
                                <Unlock className="size-3.5" />
                                Buka Kunci
                            </Button>
                        </div>
                    </div>
                )}

                {/* BANNER 1-KLIK SALIN DATA MURNI KE PERUBAHAN SAAT PERUBAHAN MASIH KOSONG */}
                {isPerubahan && subKegiatans.length === 0 && murniCount > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-4 shadow-2xs">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-extrabold text-indigo-950">
                                <Copy className="size-4 text-indigo-600" />
                                Mulai Anggaran Perubahan TA {selectedYear} dari Data Murni
                            </div>
                            <p className="text-xs text-neutral-600">
                                Ditemukan <strong>{murniCount} Sub Kegiatan</strong> di Anggaran Murni TA {selectedYear}. Salin seluruh Sub Kegiatan, Rekening, AKB, dan Realisasi Jan–Sep dengan 1 klik tanpa input ulang, lalu unggah PDF RKA Perubahan SIPD-RI untuk memperbarui pagu.
                            </p>
                            <label className="mt-1 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-indigo-900">
                                <input
                                    type="checkbox"
                                    checked={lockMurniOnCopy}
                                    onChange={(e) => setLockMurniOnCopy(e.target.checked)}
                                    className="size-3.5 rounded border-indigo-300 accent-indigo-600"
                                />
                                Sekaligus kunci (Lock) Anggaran Murni TA {selectedYear} agar tidak tidak sengaja diubah
                            </label>
                        </div>
                        <Button
                            type="button"
                            disabled={isCopyingMurni}
                            onClick={() => handleCopyMurniToPerubahan(lockMurniOnCopy)}
                            className="gap-2 bg-indigo-700 font-extrabold text-white hover:bg-indigo-800"
                        >
                            {isCopyingMurni ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Copy className="size-4" />
                            )}
                            Salin {murniCount} Sub Kegiatan dari Murni
                        </Button>
                    </div>
                )}

                {/* ================================================================= */}
                {/* TAB 1: DASHBOARD MONITORING ATASAN                                */}
                {/* ================================================================= */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-5">
                        {/* 4 KPI CARDS */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Card className="border-teal-200/70 bg-gradient-to-br from-white to-teal-50/40 dark:border-teal-900 dark:from-neutral-950 dark:to-teal-950/20">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-neutral-500">
                                            Total Pagu Anggaran
                                        </span>
                                        <Wallet className="size-4 text-[#006565]" />
                                    </div>
                                    <div className="mt-2 font-mono text-lg font-extrabold text-neutral-900 dark:text-neutral-100">
                                        {formatRupiah(dashboardStats.totalPagu)}
                                    </div>
                                    <div className="mt-1 text-[11px] text-neutral-500">
                                        {subKegiatans.length} Sub Kegiatan •{' '}
                                        {dashboardStats.groupedRekenings.length} Kode Rekening
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-emerald-200/70 bg-gradient-to-br from-white to-emerald-50/40 dark:border-emerald-900 dark:from-neutral-950 dark:to-emerald-950/20">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-neutral-500">
                                            Total Realisasi Anggaran
                                        </span>
                                        <TrendingUp className="size-4 text-emerald-600" />
                                    </div>
                                    <div className="mt-2 font-mono text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                                        {formatRupiah(dashboardStats.totalRealisasi)}
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Badge className="bg-emerald-600 text-[10px] font-bold text-white">
                                            {dashboardStats.persenTotal.toFixed(2)}% Terserap
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-amber-200/70 bg-gradient-to-br from-white to-amber-50/40 dark:border-amber-900 dark:from-neutral-950 dark:to-amber-950/20">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-neutral-500">
                                            Total Sisa Anggaran
                                        </span>
                                        <Coins className="size-4 text-amber-600" />
                                    </div>
                                    <div className="mt-2 font-mono text-lg font-extrabold text-amber-700 dark:text-amber-400">
                                        {formatRupiah(dashboardStats.totalSisa)}
                                    </div>
                                    <div className="mt-1 text-[11px] text-neutral-500">
                                        {(100 - dashboardStats.persenTotal).toFixed(2)}% belum
                                        dicairkan
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-rose-200/70 bg-gradient-to-br from-white to-rose-50/40 dark:border-rose-900 dark:from-neutral-950 dark:to-rose-950/20">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-neutral-500">
                                            Rekening Belum Terserap (0%)
                                        </span>
                                        <AlertCircle className="size-4 text-rose-600" />
                                    </div>
                                    <div className="mt-2 font-mono text-lg font-extrabold text-rose-700 dark:text-rose-400">
                                        {dashboardStats.zeroCount} Rekening
                                    </div>
                                    <div className="mt-1 text-[11px] text-neutral-500">
                                        Nilai pagu: {formatRupiah(dashboardStats.zeroPaguSum)}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RINGKASAN ANGGARAN & PENCAIRAN GU vs LS */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Card className="border-sky-200/80 bg-gradient-to-br from-white to-sky-50/40 dark:border-sky-900 dark:from-neutral-950 dark:to-sky-950/20">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-sky-600 text-[10px] font-extrabold text-white hover:bg-sky-600">
                                                GU
                                            </Badge>
                                            <span className="text-xs font-extrabold text-sky-900 dark:text-sky-200">
                                                Ganti Uang (GU)
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-semibold text-neutral-500">
                                            {dashboardStats.guCount} Rekening
                                        </span>
                                    </div>
                                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                            <div className="text-[10px] font-bold text-neutral-500 uppercase">
                                                Total Anggaran
                                            </div>
                                            <div className="mt-0.5 font-mono text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
                                                {formatRupiah(dashboardStats.guPagu)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-neutral-500 uppercase">
                                                Pencairan GU
                                            </div>
                                            <div className="mt-0.5 font-mono text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                                                {formatRupiah(dashboardStats.guRealisasi)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-neutral-500 uppercase">
                                                Sisa GU
                                            </div>
                                            <div className="mt-0.5 font-mono text-sm font-extrabold text-amber-700 dark:text-amber-400">
                                                {formatRupiah(dashboardStats.guSisa)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2.5 flex items-center gap-2">
                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sky-100 dark:bg-sky-950">
                                            <div
                                                className="h-full rounded-full bg-sky-600"
                                                style={{
                                                    width: `${Math.min(100, Math.max(0, dashboardStats.guPersen))}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="font-mono text-[11px] font-extrabold text-sky-700 dark:text-sky-300">
                                            {dashboardStats.guPersen.toFixed(1)}%
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-violet-200/80 bg-gradient-to-br from-white to-violet-50/40 dark:border-violet-900 dark:from-neutral-950 dark:to-violet-950/20">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-violet-600 text-[10px] font-extrabold text-white hover:bg-violet-600">
                                                LS
                                            </Badge>
                                            <span className="text-xs font-extrabold text-violet-900 dark:text-violet-200">
                                                Langsung (LS)
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-semibold text-neutral-500">
                                            {dashboardStats.lsCount} Rekening
                                        </span>
                                    </div>
                                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                            <div className="text-[10px] font-bold text-neutral-500 uppercase">
                                                Total Anggaran
                                            </div>
                                            <div className="mt-0.5 font-mono text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
                                                {formatRupiah(dashboardStats.lsPagu)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-neutral-500 uppercase">
                                                Pencairan LS
                                            </div>
                                            <div className="mt-0.5 font-mono text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                                                {formatRupiah(dashboardStats.lsRealisasi)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-neutral-500 uppercase">
                                                Sisa LS
                                            </div>
                                            <div className="mt-0.5 font-mono text-sm font-extrabold text-amber-700 dark:text-amber-400">
                                                {formatRupiah(dashboardStats.lsSisa)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2.5 flex items-center gap-2">
                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-950">
                                            <div
                                                className="h-full rounded-full bg-violet-600"
                                                style={{
                                                    width: `${Math.min(100, Math.max(0, dashboardStats.lsPersen))}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="font-mono text-[11px] font-extrabold text-violet-700 dark:text-violet-300">
                                            {dashboardStats.lsPersen.toFixed(1)}%
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* GRAFIK PERBANDINGAN (2 TABULASI FULL LAYAR) */}
                        {subKegiatans.length > 0 && (
                            <Card className="overflow-hidden">
                                <CardHeader className="flex flex-col gap-2.5 border-b bg-neutral-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:bg-neutral-900/40">
                                    <div className="inline-flex flex-wrap items-center gap-1.5 rounded-lg border bg-white p-1 dark:bg-neutral-950">
                                        <button
                                            type="button"
                                            onClick={() => setChartTab('sub_kegiatan')}
                                            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                                                chartTab === 'sub_kegiatan'
                                                    ? 'bg-[#006565] text-white shadow-xs'
                                                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800'
                                            }`}
                                        >
                                            <BarChart3 className="size-3.5" />
                                            Pagu vs Realisasi per Sub Kegiatan (Rp)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setChartTab('bulanan')}
                                            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                                                chartTab === 'bulanan'
                                                    ? 'bg-[#006565] text-white shadow-xs'
                                                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800'
                                            }`}
                                        >
                                            <TrendingUp className="size-3.5" />
                                            Tren Realisasi Pencairan Bulanan TA {selectedYear}
                                        </button>
                                    </div>
                                </CardHeader>

                                <CardContent className="h-[340px] p-4">
                                    {chartTab === 'sub_kegiatan' ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={dashboardStats.subKegiatanChartData}
                                                margin={{ top: 10, right: 16, left: 10, bottom: 20 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                                <XAxis
                                                    dataKey="name"
                                                    tick={{ fontSize: 10 }}
                                                    interval={0}
                                                    angle={-10}
                                                    textAnchor="end"
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 10 }}
                                                    tickFormatter={(v) =>
                                                        v >= 1_000_000
                                                            ? `${(v / 1_000_000).toFixed(0)}Jt`
                                                            : formatNumber(v)
                                                    }
                                                />
                                                <Tooltip
                                                    formatter={(value: unknown) =>
                                                        formatRupiah(Number(value) || 0)
                                                    }
                                                />
                                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                                <Bar
                                                    dataKey="Pagu"
                                                    fill="#0d9488"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                                <Bar
                                                    dataKey="Realisasi"
                                                    fill="#16a34a"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={dashboardStats.monthlyChartData}
                                                margin={{ top: 10, right: 16, left: 10, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                                <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                                                <YAxis
                                                    tick={{ fontSize: 10 }}
                                                    tickFormatter={(v) =>
                                                        v >= 1_000_000
                                                            ? `${(v / 1_000_000).toFixed(0)}Jt`
                                                            : formatNumber(v)
                                                    }
                                                />
                                                <Tooltip
                                                    formatter={(value: unknown) =>
                                                        formatRupiah(Number(value) || 0)
                                                    }
                                                />
                                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                                <Bar
                                                    dataKey="AKB"
                                                    fill="#0284c7"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                                <Bar
                                                    dataKey="Realisasi"
                                                    fill="#006565"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* TABEL REALISASI (2 TABULASI: PER SUB KEGIATAN & PER KODE REKENING) */}
                        <Card className="overflow-hidden">
                            <CardHeader className="flex flex-col gap-3 border-b bg-neutral-50/60 px-4 py-3 dark:bg-neutral-900/40">
                                {/* BARIS 1: TABULASI */}
                                <div className="w-full overflow-x-auto">
                                    <div className="inline-flex items-center gap-1 rounded-lg border bg-white p-1 dark:bg-neutral-950">
                                        <button
                                            type="button"
                                            onClick={() => setTableTab('sub_kegiatan')}
                                            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                                                tableTab === 'sub_kegiatan'
                                                    ? 'bg-[#006565] text-white shadow-xs'
                                                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800'
                                            }`}
                                        >
                                            <FileSpreadsheet className="size-3.5 shrink-0" />
                                            Realisasi Anggaran per Sub Kegiatan (TA {selectedYear})
                                            <span
                                                className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                                                    tableTab === 'sub_kegiatan'
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                                                }`}
                                            >
                                                {subKegiatans.length}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTableTab('kode_rekening')}
                                            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                                                tableTab === 'kode_rekening'
                                                    ? 'bg-[#006565] text-white shadow-xs'
                                                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800'
                                            }`}
                                        >
                                            <FileText className="size-3.5 shrink-0" />
                                            Realisasi per Kode Rekening (Lintas Sub Kegiatan)
                                            <span
                                                className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                                                    tableTab === 'kode_rekening'
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                                                }`}
                                            >
                                                {dashboardStats.groupedRekenings.length}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* BARIS 2: TOOLBAR AKSI / FILTER */}
                                {tableTab === 'sub_kegiatan' ? (
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200/70 pt-2.5 dark:border-neutral-800">
                                        <span className="text-[11px] font-medium text-neutral-500">
                                            Menampilkan <strong>{subKegiatans.length}</strong> Sub
                                            Kegiatan pada Tahun Anggaran {selectedYear}
                                        </span>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                disabled={subKegiatans.length === 0}
                                                onClick={() => setIsPdfDialogOpen(true)}
                                                className="h-8 gap-1.5 border-teal-300 bg-white text-xs font-bold whitespace-nowrap text-[#006565] hover:bg-teal-50"
                                            >
                                                <Eye className="size-3.5 shrink-0" />
                                                Preview / Download PDF ({pdfSelectedCols.length}{' '}
                                                Kolom)
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200/70 pt-2.5 dark:border-neutral-800">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="inline-flex items-center rounded-lg border bg-white p-0.5 dark:bg-neutral-950">
                                                {(
                                                    [
                                                        { key: 'all', label: 'Semua Jenis' },
                                                        { key: 'GU', label: 'GU' },
                                                        { key: 'LS', label: 'LS' },
                                                    ] as const
                                                ).map((opt) => (
                                                    <button
                                                        key={opt.key}
                                                        type="button"
                                                        onClick={() => setRekJenisFilter(opt.key)}
                                                        className={`rounded-md px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition-colors ${
                                                            rekJenisFilter === opt.key
                                                                ? opt.key === 'GU'
                                                                    ? 'bg-sky-600 text-white'
                                                                    : opt.key === 'LS'
                                                                      ? 'bg-violet-600 text-white'
                                                                      : 'bg-[#006565] text-white'
                                                                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                                                        }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="inline-flex flex-wrap items-center rounded-lg border bg-white p-0.5 dark:bg-neutral-950">
                                                {(
                                                    [
                                                        { key: 'all', label: 'Semua' },
                                                        {
                                                            key: 'zero',
                                                            label: 'Belum Terserap (0%)',
                                                        },
                                                        {
                                                            key: 'partial',
                                                            label: 'Masih Ada Sisa',
                                                        },
                                                        { key: 'full', label: 'Terserap Penuh' },
                                                    ] as const
                                                ).map((opt) => (
                                                    <button
                                                        key={opt.key}
                                                        type="button"
                                                        onClick={() => setRekStatusFilter(opt.key)}
                                                        className={`rounded-md px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition-colors ${
                                                            rekStatusFilter === opt.key
                                                                ? 'bg-[#006565] text-white'
                                                                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                                                        }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="relative w-full sm:w-64">
                                            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-400" />
                                            <Input
                                                value={rekSearch}
                                                onChange={(e) => setRekSearch(e.target.value)}
                                                placeholder="Cari kode rekening / uraian..."
                                                className="h-8 bg-white pl-8 text-xs"
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardHeader>

                            <CardContent className="p-0">
                                {tableTab === 'sub_kegiatan' ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-teal-200/80 bg-teal-50/80 text-[11px] font-extrabold text-[#005555] uppercase dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200">
                                                    <th className="px-4 py-3">
                                                        Kode &amp; Sub Kegiatan
                                                    </th>
                                                    <th className="px-4 py-3 text-right">
                                                        Pagu Anggaran
                                                    </th>
                                                    <th className="px-4 py-3 text-right">
                                                        Realisasi
                                                    </th>
                                                    <th className="px-4 py-3 text-right">Sisa</th>
                                                    <th className="px-4 py-3">Serapan (%)</th>
                                                    <th className="px-4 py-3 text-right">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                {subKegiatans.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={6}
                                                            className="px-4 py-10 text-center text-neutral-400"
                                                        >
                                                            Belum ada data Sub Kegiatan untuk Tahun{' '}
                                                            {selectedYear}. Klik tombol{' '}
                                                            <strong>Upload PDF RKA</strong> untuk
                                                            menambahkan.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    subKegiatans.map((sk) => (
                                                        <tr
                                                            key={sk.id}
                                                            className="hover:bg-teal-50/30 dark:hover:bg-teal-950/20"
                                                        >
                                                            <td className="min-w-[260px] max-w-[420px] px-4 py-3">
                                                                <div className="font-mono text-[11px] font-bold text-[#006565]">
                                                                    {sk.kode_sub_kegiatan}
                                                                </div>
                                                                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                                    {sk.nama_sub_kegiatan}
                                                                </div>
                                                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-neutral-500">
                                                                    <span>
                                                                        {sk.rekenings.length} Kode
                                                                        Rekening
                                                                    </span>
                                                                    {(dashboardStats
                                                                        .subKegiatanGuLs[sk.id]
                                                                        ?.guPagu ?? 0) > 0 && (
                                                                        <span className="rounded bg-sky-50 px-1.5 py-0.5 font-mono font-bold text-sky-700 ring-1 ring-sky-200/80">
                                                                            GU:{' '}
                                                                            {formatRupiah(
                                                                                dashboardStats
                                                                                    .subKegiatanGuLs[
                                                                                    sk.id
                                                                                ].guPagu
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                    {(dashboardStats
                                                                        .subKegiatanGuLs[sk.id]
                                                                        ?.lsPagu ?? 0) > 0 && (
                                                                        <span className="rounded bg-violet-50 px-1.5 py-0.5 font-mono font-bold text-violet-700 ring-1 ring-violet-200/80">
                                                                            LS:{' '}
                                                                            {formatRupiah(
                                                                                dashboardStats
                                                                                    .subKegiatanGuLs[
                                                                                    sk.id
                                                                                ].lsPagu
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                                                                <div>
                                                                    {formatRupiah(
                                                                        sk.total_anggaran
                                                                    )}
                                                                </div>
                                                                {Math.abs(
                                                                    sk.selisih_perubahan || 0
                                                                ) >= 1 && (
                                                                    <div
                                                                        className={`text-[10px] font-semibold ${
                                                                            sk.selisih_perubahan > 0
                                                                                ? 'text-emerald-600'
                                                                                : 'text-rose-600'
                                                                        }`}
                                                                        title={`Pagu Murni: ${formatRupiah(sk.total_pagu_murni)}`}
                                                                    >
                                                                        {sk.selisih_perubahan > 0
                                                                            ? `+${formatRupiah(sk.selisih_perubahan)}`
                                                                            : `-${formatRupiah(Math.abs(sk.selisih_perubahan))}`}{' '}
                                                                        dr Murni
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap text-emerald-700">
                                                                {formatRupiah(sk.total_realisasi)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap text-amber-700">
                                                                {formatRupiah(sk.total_sisa)}
                                                            </td>
                                                            <td className="min-w-[140px] px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                                                                        <div
                                                                            className={`h-full rounded-full ${
                                                                                sk.persen_realisasi >=
                                                                                80
                                                                                    ? 'bg-emerald-600'
                                                                                    : sk.persen_realisasi >=
                                                                                        40
                                                                                      ? 'bg-amber-500'
                                                                                      : 'bg-rose-500'
                                                                            }`}
                                                                            style={{
                                                                                width: `${Math.min(
                                                                                    100,
                                                                                    Math.max(
                                                                                        0,
                                                                                        sk.persen_realisasi
                                                                                    )
                                                                                )}%`,
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <span className="w-12 text-right font-mono text-[11px] font-extrabold">
                                                                        {sk.persen_realisasi.toFixed(
                                                                            1
                                                                        )}
                                                                        %
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                                <div className="inline-flex items-center gap-1.5">
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setSelectedSkId(
                                                                                String(sk.id)
                                                                            );
                                                                            navigateTab('matrix');
                                                                        }}
                                                                        className="h-8 gap-1 bg-[#006565] px-2.5 text-xs font-bold text-white hover:bg-[#005252]"
                                                                    >
                                                                        <Table2 className="size-3.5" />
                                                                        Input Bulanan
                                                                    </Button>
                                                                    <a
                                                                        href={`/realisasi-anggaran/sub-kegiatan/${sk.id}/pdf`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                    >
                                                                        <Button
                                                                            type="button"
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="h-8 gap-1 px-2 text-xs font-bold"
                                                                        >
                                                                            <Eye className="size-3.5" />
                                                                            PDF
                                                                        </Button>
                                                                    </a>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-teal-200/80 bg-teal-50/80 text-[11px] font-extrabold text-[#005555] uppercase dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200">
                                                    <th className="px-4 py-2.5">Kode Rekening</th>
                                                    <th className="px-4 py-2.5">
                                                        Uraian &amp; Sub Kegiatan
                                                    </th>
                                                    <th className="px-4 py-2.5 text-right">
                                                        Anggaran
                                                    </th>
                                                    <th className="px-4 py-2.5 text-right">
                                                        Realisasi
                                                    </th>
                                                    <th className="px-4 py-2.5 text-right">Sisa</th>
                                                    <th className="px-4 py-2.5 text-center">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                {filteredGroupedRekenings.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={6}
                                                            className="px-4 py-8 text-center text-neutral-400"
                                                        >
                                                            Tidak ada kode rekening yang sesuai
                                                            filter.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredGroupedRekenings.map((r) => {
                                                        const isExpanded =
                                                            !!expandedRekeningCodes[
                                                                r.kode_rekening
                                                            ];
                                                        return (
                                                            <tr
                                                                key={r.kode_rekening}
                                                                className="hover:bg-teal-50/20"
                                                            >
                                                                <td className="px-4 py-2.5 align-top font-mono font-bold whitespace-nowrap text-[#006565]">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span>
                                                                            {r.kode_rekening}
                                                                        </span>
                                                                        {Array.from(
                                                                            new Set(
                                                                                r.sources.map(
                                                                                    (s) =>
                                                                                        s.jenis_pencairan
                                                                                )
                                                                            )
                                                                        ).map((j) => (
                                                                            <span
                                                                                key={j}
                                                                                className={`rounded px-1.5 py-0.5 font-sans text-[9px] font-extrabold ${
                                                                                    j === 'LS'
                                                                                        ? 'bg-violet-100 text-violet-700'
                                                                                        : 'bg-sky-100 text-sky-700'
                                                                                }`}
                                                                            >
                                                                                {j}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                                <td className="min-w-[260px] px-4 py-2.5 align-top">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            toggleRekeningDetail(
                                                                                r.kode_rekening
                                                                            )
                                                                        }
                                                                        className="group flex w-full items-start gap-1.5 text-left"
                                                                        title={
                                                                            isExpanded
                                                                                ? 'Sembunyikan detail sub kegiatan'
                                                                                : `Lihat detail ${r.sources.length} sub kegiatan`
                                                                        }
                                                                    >
                                                                        <span className="mt-0.5 shrink-0 text-neutral-400 transition-colors group-hover:text-[#006565]">
                                                                            {isExpanded ? (
                                                                                <ChevronDown className="size-3.5" />
                                                                            ) : (
                                                                                <ChevronRight className="size-3.5" />
                                                                            )}
                                                                        </span>
                                                                        <span className="font-semibold text-neutral-900 transition-colors group-hover:text-[#006565] dark:text-neutral-100">
                                                                            {r.uraian}
                                                                        </span>
                                                                    </button>

                                                                    {isExpanded && (
                                                                        <div className="mt-2 ml-5 space-y-1.5 rounded-lg border border-teal-100 bg-teal-50/40 p-2 dark:border-teal-900/60 dark:bg-teal-950/20">
                                                                            <div className="text-[10px] font-bold tracking-wide text-[#006565] uppercase">
                                                                                Rincian Sub Kegiatan
                                                                                ({r.sources.length})
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                {r.sources.map(
                                                                                    (src) => (
                                                                                        <div
                                                                                            key={
                                                                                                src.sub_kegiatan_id
                                                                                            }
                                                                                            className="flex flex-wrap items-center justify-between gap-2 rounded bg-white/80 px-2 py-1 text-[11px] dark:bg-neutral-900/70"
                                                                                        >
                                                                                            <span className="text-neutral-700 dark:text-neutral-300">
                                                                                                <span
                                                                                                    className={`mr-1.5 inline-block rounded px-1 py-0.5 text-[9px] font-extrabold ${
                                                                                                        src.jenis_pencairan ===
                                                                                                        'LS'
                                                                                                            ? 'bg-violet-100 text-violet-700'
                                                                                                            : 'bg-sky-100 text-sky-700'
                                                                                                    }`}
                                                                                                >
                                                                                                    {
                                                                                                        src.jenis_pencairan
                                                                                                    }
                                                                                                </span>
                                                                                                <span className="font-mono text-[10px] text-neutral-500">
                                                                                                    {
                                                                                                        src.kode_sub_kegiatan
                                                                                                    }
                                                                                                </span>{' '}
                                                                                                —{' '}
                                                                                                {
                                                                                                    src.nama_sub_kegiatan
                                                                                                }
                                                                                            </span>
                                                                                            <span className="font-mono text-[10px] whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                                                                                                Pagu:{' '}
                                                                                                <strong className="text-neutral-900 dark:text-neutral-100">
                                                                                                    {formatRupiah(
                                                                                                        src.pagu
                                                                                                    )}
                                                                                                </strong>
                                                                                                {
                                                                                                    ' • '
                                                                                                }
                                                                                                Realisasi:{' '}
                                                                                                <strong className="text-emerald-700 dark:text-emerald-400">
                                                                                                    {formatRupiah(
                                                                                                        src.realisasi
                                                                                                    )}
                                                                                                </strong>
                                                                                            </span>
                                                                                        </div>
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-2.5 text-right align-top font-mono font-bold whitespace-nowrap">
                                                                    {formatRupiah(r.pagu_anggaran)}
                                                                </td>
                                                                <td className="px-4 py-2.5 text-right align-top font-mono font-bold whitespace-nowrap text-emerald-700">
                                                                    {formatRupiah(
                                                                        r.total_realisasi
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-2.5 text-right align-top font-mono font-bold whitespace-nowrap text-amber-700">
                                                                    {formatRupiah(r.sisa)}
                                                                </td>
                                                                <td className="px-4 py-2.5 text-center align-top whitespace-nowrap">
                                                                    {r.total_realisasi <= 0 ? (
                                                                        <Badge className="bg-rose-100 text-[10px] font-bold text-rose-700 hover:bg-rose-100">
                                                                            Belum Terserap (0%)
                                                                        </Badge>
                                                                    ) : r.sisa <= 0 ? (
                                                                        <Badge className="bg-emerald-100 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100">
                                                                            Terserap Penuh (100%)
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge className="bg-amber-100 text-[10px] font-bold text-amber-800 hover:bg-amber-100">
                                                                            {r.persen.toFixed(1)}%
                                                                            Terserap
                                                                        </Badge>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ================================================================= */}
                {/* SUB-MENU: INPUT AKB (ANGGARAN KAS BELANJA) JAN - DES              */}
                {/* ================================================================= */}
                {activeTab === 'akb' && (
                    <div className="space-y-4">
                        {subKegiatans.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                                    <CalendarClock className="size-10 text-teal-600/60" />
                                    <div className="text-sm font-bold text-neutral-700">
                                        Belum ada Sub Kegiatan untuk Tahun Anggaran {selectedYear}
                                    </div>
                                    <p className="max-w-md text-xs text-neutral-500">
                                        Upload file PDF RKA-Belanja SIPD-RI terlebih dahulu sebelum
                                        menetapkan Anggaran Kas Belanja (AKB) per bulan.
                                    </p>
                                    <Button
                                        type="button"
                                        onClick={() => navigateTab('upload')}
                                        className="gap-1.5 bg-[#006565] text-xs font-bold text-white hover:bg-[#005252]"
                                    >
                                        <Upload className="size-4" />
                                        Upload PDF RKA Sekarang
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            activeSubKegiatan && (
                                <Card className="overflow-hidden border-sky-200/80 shadow-xs">
                                    <CardHeader className="flex flex-col gap-3 border-b border-sky-100 bg-sky-50/40 px-4 py-4 lg:flex-row lg:items-end lg:justify-between">
                                        <div className="w-full min-w-0 flex-1 space-y-1.5">
                                            <Label className="block text-[11px] font-extrabold text-sky-800 uppercase">
                                                Pilih Sub Kegiatan (Input AKB)
                                            </Label>
                                            <Select
                                                value={String(activeSubKegiatan.id)}
                                                onValueChange={(v) => setSelectedSkId(v)}
                                            >
                                                <SelectTrigger className="h-9 w-full min-w-0 bg-white text-left text-xs font-bold [&>span]:truncate">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="max-w-[90vw]">
                                                    {subKegiatans.map((sk) => (
                                                        <SelectItem
                                                            key={sk.id}
                                                            value={String(sk.id)}
                                                        >
                                                            {sk.kode_sub_kegiatan} —{' '}
                                                            {sk.nama_sub_kegiatan}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                asChild
                                                className="h-9 gap-1.5 border-sky-300 bg-white text-xs font-bold text-sky-700 hover:bg-sky-50"
                                            >
                                                <a
                                                    href={`/realisasi-anggaran/sub-kegiatan/${activeSubKegiatan.id}/akb-pdf`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <Eye className="size-3.5" />
                                                    Preview PDF AKB
                                                </a>
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                asChild
                                                className="h-9 gap-1.5 border-neutral-300 bg-white text-xs font-bold text-neutral-700 hover:bg-neutral-50"
                                                title="Download PDF AKB"
                                            >
                                                <a
                                                    href={`/realisasi-anggaran/sub-kegiatan/${activeSubKegiatan.id}/akb-pdf?download=1`}
                                                >
                                                    <Download className="size-3.5" />
                                                    Download PDF
                                                </a>
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => navigateTab('matrix')}
                                                className="h-9 gap-1.5 border-teal-300 bg-white text-xs font-bold text-[#006565] hover:bg-teal-50"
                                            >
                                                <Table2 className="size-3.5" />
                                                Ke Input Realisasi Bulanan
                                            </Button>
                                            <Button
                                                type="button"
                                                disabled={isSavingAkb || isReadOnlyLocked}
                                                onClick={handleSaveAkb}
                                                className="h-9 gap-1.5 bg-sky-700 text-xs font-bold text-white hover:bg-sky-800"
                                            >
                                                <Save className="size-3.5" />
                                                {isSavingAkb ? 'Menyimpan...' : 'Simpan AKB'}
                                            </Button>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4 p-4">
                                        {/* RINGKASAN ALOKASI AKB */}
                                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                            <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 px-3 py-2 text-xs">
                                                <div className="text-[10px] font-bold text-neutral-500 uppercase">
                                                    Total Pagu Sub Kegiatan
                                                </div>
                                                <div className="mt-0.5 font-mono text-sm font-extrabold text-neutral-900">
                                                    {formatRupiah(liveAkbSummary.grandPagu)}
                                                </div>
                                            </div>
                                            <div className="rounded-lg border border-sky-200 bg-sky-50/60 px-3 py-2 text-xs">
                                                <div className="text-[10px] font-bold text-sky-700 uppercase">
                                                    Total AKB Dialokasikan (Jan–Des)
                                                </div>
                                                <div className="mt-0.5 font-mono text-sm font-extrabold text-sky-800">
                                                    {formatRupiah(liveAkbSummary.grandAkb)}
                                                </div>
                                            </div>
                                            <div
                                                className={`rounded-lg border px-3 py-2 text-xs ${
                                                    liveAkbSummary.grandSisaPagu < 0
                                                        ? 'border-rose-300 bg-rose-50'
                                                        : liveAkbSummary.grandSisaPagu === 0
                                                          ? 'border-emerald-200 bg-emerald-50/70'
                                                          : 'border-amber-200 bg-amber-50/70'
                                                }`}
                                            >
                                                <div className="text-[10px] font-bold text-neutral-600 uppercase">
                                                    Sisa Pagu Belum Masuk AKB
                                                </div>
                                                <div
                                                    className={`mt-0.5 font-mono text-sm font-extrabold ${
                                                        liveAkbSummary.grandSisaPagu < 0
                                                            ? 'text-rose-700'
                                                            : liveAkbSummary.grandSisaPagu === 0
                                                              ? 'text-emerald-700'
                                                              : 'text-amber-800'
                                                    }`}
                                                >
                                                    {formatRupiah(liveAkbSummary.grandSisaPagu)}
                                                </div>
                                            </div>
                                        </div>

                                        {liveAkbSummary.firstAkbError && (
                                            <div className="flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                                                <AlertCircle className="size-4 shrink-0" />
                                                <span>{liveAkbSummary.firstAkbError}</span>
                                            </div>
                                        )}

                                        {/* TABEL MATRIKS INPUT AKB (JAN - DES) */}
                                        <div className="overflow-x-auto rounded-xl border border-neutral-300 dark:border-neutral-700">
                                            <table className="w-full border-collapse text-xs">
                                                <thead>
                                                    <tr className="border-b border-sky-200 bg-sky-50/90 text-[11px] font-extrabold text-sky-900 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-200">
                                                        <th
                                                            rowSpan={2}
                                                            className="w-9 border-r border-sky-200 px-2 py-2 text-center"
                                                        >
                                                            No
                                                        </th>
                                                        <th
                                                            rowSpan={2}
                                                            className="min-w-[140px] border-r border-sky-200 px-2.5 py-2 text-left"
                                                        >
                                                            Kode Rekening
                                                        </th>
                                                        <th
                                                            rowSpan={2}
                                                            className="min-w-[220px] border-r border-sky-200 px-2.5 py-2 text-left"
                                                        >
                                                            Uraian
                                                        </th>
                                                        <th
                                                            rowSpan={2}
                                                            className="min-w-[115px] border-r border-sky-200 px-2.5 py-2 text-right"
                                                        >
                                                            Pagu Anggaran
                                                        </th>
                                                        <th
                                                            colSpan={12}
                                                            className="border-b border-r border-sky-200 px-2 py-1.5 text-center uppercase"
                                                        >
                                                            Anggaran Kas Belanja / AKB per Bulan
                                                            (Rp)
                                                        </th>
                                                        <th
                                                            rowSpan={2}
                                                            className="min-w-[115px] border-r border-sky-200 px-2.5 py-2 text-right"
                                                        >
                                                            Total AKB
                                                        </th>
                                                        <th
                                                            rowSpan={2}
                                                            className="min-w-[115px] px-2.5 py-2 text-right"
                                                        >
                                                            Sisa Pagu
                                                        </th>
                                                    </tr>
                                                    <tr className="border-b border-sky-200 bg-sky-50/60 text-[10px] font-bold text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
                                                        {MONTHS.map((m) => (
                                                            <th
                                                                key={m.num}
                                                                className="min-w-[96px] border-r border-sky-200 px-1.5 py-1.5 text-center"
                                                            >
                                                                {m.short}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                                    {activeSubKegiatan.rekenings.map(
                                                        (rek, idx) => {
                                                            const akbStat = liveAkbSummary
                                                                .rowTotals[rek.id] || {
                                                                totalAkb: 0,
                                                                sisaPagu: rek.pagu_anggaran,
                                                                isOverPagu: false,
                                                            };
                                                            return (
                                                                <tr
                                                                    key={rek.id}
                                                                    className="hover:bg-sky-50/20"
                                                                >
                                                                    <td className="border-r px-2 py-1.5 text-center text-neutral-500">
                                                                        {idx + 1}
                                                                    </td>
                                                                    <td className="border-r px-2.5 py-1.5 font-mono text-[11px] font-bold whitespace-nowrap text-[#006565]">
                                                                        {rek.kode_rekening}
                                                                    </td>
                                                                    <td className="border-r px-2.5 py-1.5 leading-snug font-medium">
                                                                        {rek.uraian}
                                                                    </td>
                                                                    <td className="border-r px-2.5 py-1.5 text-right font-mono font-bold whitespace-nowrap">
                                                                        {formatNumber(
                                                                            rek.pagu_anggaran
                                                                        )}
                                                                    </td>
                                                                    {MONTHS.map((m) => (
                                                                        <td
                                                                            key={m.num}
                                                                            className="border-r p-1"
                                                                        >
                                                                            <Input
                                                                                type="number"
                                                                                min={0}
                                                                                step={1000}
                                                                                placeholder="0"
                                                                                value={
                                                                                    akbValues[
                                                                                        rek.id
                                                                                    ]?.[m.num] ?? ''
                                                                                }
                                                                                onChange={(e) => {
                                                                                    const val =
                                                                                        e.target
                                                                                            .value;
                                                                                    setAkbValues(
                                                                                        (prev) => ({
                                                                                            ...prev,
                                                                                            [rek.id]:
                                                                                                {
                                                                                                    ...(prev[
                                                                                                        rek
                                                                                                            .id
                                                                                                    ] ||
                                                                                                        {}),
                                                                                                    [m.num]:
                                                                                                        val,
                                                                                                },
                                                                                        })
                                                                                    );
                                                                                }}
                                                                                className="h-7 min-w-[84px] px-1.5 text-right font-mono text-[11px]"
                                                                            />
                                                                        </td>
                                                                    ))}
                                                                    <td
                                                                        className={`border-r px-2.5 py-1.5 text-right font-mono font-extrabold whitespace-nowrap ${
                                                                            akbStat.isOverPagu
                                                                                ? 'bg-rose-100 text-rose-700'
                                                                                : 'bg-sky-50/50 text-sky-800'
                                                                        }`}
                                                                    >
                                                                        {formatNumber(
                                                                            akbStat.totalAkb
                                                                        )}
                                                                    </td>
                                                                    <td
                                                                        className={`px-2.5 py-1.5 text-right font-mono font-extrabold whitespace-nowrap ${
                                                                            akbStat.isOverPagu
                                                                                ? 'bg-rose-100 text-rose-700'
                                                                                : akbStat.sisaPagu ===
                                                                                    0
                                                                                  ? 'bg-emerald-100/70 text-emerald-700'
                                                                                  : 'bg-amber-100/80 text-amber-900'
                                                                        }`}
                                                                    >
                                                                        {formatNumber(
                                                                            akbStat.sisaPagu
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }
                                                    )}

                                                    <tr className="border-t-2 border-sky-300 bg-neutral-100 font-extrabold dark:bg-neutral-900">
                                                        <td
                                                            colSpan={3}
                                                            className="border-r px-3 py-2.5 text-center uppercase"
                                                        >
                                                            JUMLAH
                                                        </td>
                                                        <td className="border-r px-2.5 py-2.5 text-right font-mono whitespace-nowrap">
                                                            {formatNumber(liveAkbSummary.grandPagu)}
                                                        </td>
                                                        {MONTHS.map((m) => (
                                                            <td
                                                                key={m.num}
                                                                className="border-r px-2 py-2.5 text-right font-mono text-[11px] whitespace-nowrap"
                                                            >
                                                                {formatNumber(
                                                                    liveAkbSummary.monthTotals[
                                                                        m.num
                                                                    ] || 0
                                                                )}
                                                            </td>
                                                        ))}
                                                        <td className="border-r bg-sky-100/70 px-2.5 py-2.5 text-right font-mono whitespace-nowrap text-sky-900">
                                                            {formatNumber(liveAkbSummary.grandAkb)}
                                                        </td>
                                                        <td className="bg-amber-200/80 px-2.5 py-2.5 text-right font-mono whitespace-nowrap text-amber-950">
                                                            {formatNumber(
                                                                liveAkbSummary.grandSisaPagu
                                                            )}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500">
                                            <span>
                                                Aturan SIPD-RI: Pencairan bulanan tidak boleh
                                                melebihi <strong>AKB kumulatif</strong> sampai
                                                dengan bulan berjalan. Tetapkan AKB di sini sebelum
                                                menginput pencairan bulanan.
                                            </span>
                                            <Button
                                                type="button"
                                                disabled={isSavingAkb}
                                                onClick={handleSaveAkb}
                                                className="h-8 gap-1.5 bg-sky-700 text-xs font-bold text-white hover:bg-sky-800"
                                            >
                                                <Save className="size-3.5" />
                                                {isSavingAkb ? 'Menyimpan...' : 'Simpan AKB'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        )}
                    </div>
                )}

                {/* ================================================================= */}
                {/* TAB 2: FORM INPUT REALISASI BULANAN (MATRIKS JAN - DES)           */}
                {/* ================================================================= */}
                {activeTab === 'matrix' && (
                    <div className="space-y-4">
                        {subKegiatans.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                                    <FileUp className="size-10 text-teal-600/60" />
                                    <div className="text-sm font-bold text-neutral-700">
                                        Belum ada Sub Kegiatan untuk Tahun Anggaran {selectedYear}
                                    </div>
                                    <p className="max-w-md text-xs text-neutral-500">
                                        Upload file PDF RKA-Belanja SIPD-RI terlebih dahulu agar
                                        daftar kode rekening dan pagu anggaran otomatis masuk ke
                                        form realisasi bulanan ini.
                                    </p>
                                    <Button
                                        type="button"
                                        onClick={() => navigateTab('upload')}
                                        className="gap-1.5 bg-[#006565] text-xs font-bold text-white hover:bg-[#005252]"
                                    >
                                        <Upload className="size-4" />
                                        Upload PDF RKA Sekarang
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            activeSubKegiatan && (
                                <Card className="overflow-hidden border-teal-200/80 shadow-xs">
                                    <CardHeader className="flex flex-col gap-3 border-b border-teal-100 bg-teal-50/40 px-4 py-4 lg:flex-row lg:items-end lg:justify-between">
                                        <div className="w-full min-w-0 flex-1 space-y-1.5">
                                            <Label className="block text-[11px] font-extrabold text-[#006565] uppercase">
                                                Pilih Sub Kegiatan
                                            </Label>
                                            <Select
                                                value={String(activeSubKegiatan.id)}
                                                onValueChange={(v) => setSelectedSkId(v)}
                                            >
                                                <SelectTrigger className="h-9 w-full min-w-0 bg-white text-left text-xs font-bold [&>span]:truncate">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="max-w-[90vw]">
                                                    {subKegiatans.map((sk) => (
                                                        <SelectItem
                                                            key={sk.id}
                                                            value={String(sk.id)}
                                                        >
                                                            {sk.kode_sub_kegiatan} —{' '}
                                                            {sk.nama_sub_kegiatan}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => navigateTab('akb')}
                                                className="h-9 gap-1.5 border-sky-300 bg-white text-xs font-bold text-sky-700 hover:bg-sky-50"
                                            >
                                                <CalendarClock className="size-3.5" />
                                                Atur AKB
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    handleStartEditSubKegiatan(activeSubKegiatan)
                                                }
                                                className="h-9 gap-1.5 border-amber-300 bg-white text-xs font-bold text-amber-700 hover:bg-amber-50"
                                            >
                                                <Pencil className="size-3.5" />
                                                Edit RKA
                                            </Button>
                                            <a
                                                href={`/realisasi-anggaran/sub-kegiatan/${activeSubKegiatan.id}/pdf`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-9 gap-1.5 border-teal-300 bg-white text-xs font-bold text-[#006565]"
                                                >
                                                    <Eye className="size-3.5" />
                                                    Preview PDF (Landscape)
                                                </Button>
                                            </a>
                                            <Button
                                                type="button"
                                                disabled={isSavingMatrix}
                                                onClick={handleSaveMatrix}
                                                className="h-9 gap-1.5 bg-[#006565] text-xs font-bold text-white hover:bg-[#005252]"
                                            >
                                                <Save className="size-3.5" />
                                                {isSavingMatrix
                                                    ? 'Menyimpan...'
                                                    : 'Simpan Realisasi Bulanan'}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    handleDeleteSubKegiatan(activeSubKegiatan)
                                                }
                                                className="h-9 px-2.5 text-rose-600 hover:bg-rose-50"
                                                title="Hapus Sub Kegiatan"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4 p-4">
                                        {/* INFO HEADER SUB KEGIATAN (SEPERTI LAMPIRAN 2) */}
                                        <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5 text-xs leading-relaxed md:grid-cols-2 dark:border-neutral-800 dark:bg-neutral-900/50">
                                            <div>
                                                <span className="font-bold text-neutral-500">
                                                    Program:
                                                </span>{' '}
                                                <span className="font-semibold">
                                                    {activeSubKegiatan.program || '-'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-neutral-500">
                                                    Sumber Dana:
                                                </span>{' '}
                                                <span className="font-semibold">
                                                    {activeSubKegiatan.sumber_pendanaan || '-'}
                                                </span>
                                            </div>
                                            <div className="md:col-span-2">
                                                <span className="font-bold text-neutral-500">
                                                    Kegiatan:
                                                </span>{' '}
                                                <span>{activeSubKegiatan.kegiatan || '-'}</span>
                                            </div>
                                            <div className="md:col-span-2">
                                                <span className="font-bold text-neutral-500">
                                                    Sub Kegiatan:
                                                </span>{' '}
                                                <strong className="text-[#006565]">
                                                    {activeSubKegiatan.kode_sub_kegiatan}{' '}
                                                    {activeSubKegiatan.nama_sub_kegiatan}
                                                </strong>
                                            </div>
                                        </div>

                                        {/* RINGKASAN LIVE GU vs LS SUB KEGIATAN AKTIF */}
                                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-200/80 bg-sky-50/50 px-3 py-2 text-xs dark:border-sky-900 dark:bg-sky-950/20">
                                                <div className="flex items-center gap-1.5 font-extrabold text-sky-800 dark:text-sky-300">
                                                    <span className="rounded bg-sky-600 px-1.5 py-0.5 text-[10px] text-white">
                                                        GU
                                                    </span>
                                                    <span>Ganti Uang</span>
                                                </div>
                                                <div className="font-mono text-[11px]">
                                                    Pagu:{' '}
                                                    <strong>
                                                        {formatRupiah(liveMatrixSummary.guPagu)}
                                                    </strong>
                                                    {' • '}
                                                    Cair:{' '}
                                                    <strong className="text-emerald-700 dark:text-emerald-400">
                                                        {formatRupiah(
                                                            liveMatrixSummary.guRealisasi
                                                        )}
                                                    </strong>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-violet-200/80 bg-violet-50/50 px-3 py-2 text-xs dark:border-violet-900 dark:bg-violet-950/20">
                                                <div className="flex items-center gap-1.5 font-extrabold text-violet-800 dark:text-violet-300">
                                                    <span className="rounded bg-violet-600 px-1.5 py-0.5 text-[10px] text-white">
                                                        LS
                                                    </span>
                                                    <span>Langsung</span>
                                                </div>
                                                <div className="font-mono text-[11px]">
                                                    Pagu:{' '}
                                                    <strong>
                                                        {formatRupiah(liveMatrixSummary.lsPagu)}
                                                    </strong>
                                                    {' • '}
                                                    Cair:{' '}
                                                    <strong className="text-emerald-700 dark:text-emerald-400">
                                                        {formatRupiah(
                                                            liveMatrixSummary.lsRealisasi
                                                        )}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>

                                        {/* PERINGATAN JIKA AKB BELUM DIINPUT ATAU ADA PELANGGARAN AKB */}
                                        {activeSubKegiatan.total_akb <= 0 && (
                                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="size-4 shrink-0 text-amber-600" />
                                                    <span>
                                                        <strong>
                                                            AKB (Anggaran Kas Belanja) belum
                                                            diinput
                                                        </strong>{' '}
                                                        untuk Sub Kegiatan ini. Input pencairan
                                                        bulanan diblokir sampai AKB ditetapkan.
                                                    </span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => navigateTab('akb')}
                                                    className="h-7 gap-1 bg-sky-700 px-2.5 text-[11px] font-bold text-white hover:bg-sky-800"
                                                >
                                                    <CalendarClock className="size-3.5" />
                                                    Input AKB Sekarang
                                                </Button>
                                            </div>
                                        )}

                                        {liveMatrixSummary.firstAkbViolation && (
                                            <div className="flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700">
                                                <AlertCircle className="size-4 shrink-0" />
                                                <span>{liveMatrixSummary.firstAkbViolation}</span>
                                            </div>
                                        )}

                                        {/* TABEL MATRIKS EDITABLE (JAN - DES) */}
                                        <div className="overflow-x-auto rounded-xl border border-neutral-300 dark:border-neutral-700">
                                            <table className="w-full border-collapse text-xs">
                                                <thead>
                                                    <tr className="border-b border-teal-200 bg-teal-50/90 text-[11px] font-extrabold text-[#005555] dark:border-teal-900 dark:bg-teal-950/60 dark:text-teal-200">
                                                        <th
                                                            rowSpan={2}
                                                            className="w-9 border-r border-teal-200 px-2 py-2 text-center"
                                                        >
                                                            No
                                                        </th>
                                                        <th
                                                            rowSpan={2}
                                                            className="min-w-[140px] border-r border-teal-200 px-2.5 py-2 text-left"
                                                        >
                                                            Kode Rekening
                                                        </th>
                                                        <th
                                                            rowSpan={2}
                                                            className="w-24 border-r border-teal-200 px-2 py-2 text-center"
                                                        >
                                                            Jenis
                                                        </th>
                                                        <th
                                                            rowSpan={2}
                                                            className="min-w-[220px] border-r border-teal-200 px-2.5 py-2 text-left"
                                                        >
                                                            Uraian
                                                        </th>
                                                        <th
                                                            rowSpan={2}
                                                            className="min-w-[115px] border-r border-teal-200 px-2.5 py-2 text-right"
                                                        >
                                                            Anggaran
                                                        </th>
                                                        <th
                                                            colSpan={12}
                                                            className="border-b border-r border-teal-200 px-2 py-1.5 text-center uppercase"
                                                        >
                                                            Realisasi Pencairan (Rp)
                                                        </th>
                                                        <th
                                                            rowSpan={2}
                                                            className="min-w-[115px] border-r border-teal-200 px-2.5 py-2 text-right"
                                                        >
                                                            Total
                                                        </th>
                                                        <th
                                                            rowSpan={2}
                                                            className="min-w-[115px] px-2.5 py-2 text-right"
                                                        >
                                                            Sisa
                                                        </th>
                                                    </tr>
                                                    <tr className="border-b border-teal-200 bg-teal-50/60 text-[10px] font-bold text-[#005555] dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200">
                                                        {MONTHS.map((m) => (
                                                            <th
                                                                key={m.num}
                                                                className="min-w-[96px] border-r border-teal-200 px-1.5 py-1.5 text-center"
                                                            >
                                                                {m.short}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                                    {activeSubKegiatan.rekenings.map(
                                                        (rek, idx) => {
                                                            const rowStat = liveMatrixSummary
                                                                .rowTotals[rek.id] || {
                                                                total: 0,
                                                                sisa: rek.pagu_anggaran,
                                                            };
                                                            const isOver = rowStat.sisa < 0;
                                                            const isFull = rowStat.sisa === 0;
                                                            return (
                                                                <tr
                                                                    key={rek.id}
                                                                    className="hover:bg-teal-50/20"
                                                                >
                                                                    <td className="border-r px-2 py-1.5 text-center text-neutral-500">
                                                                        {idx + 1}
                                                                    </td>
                                                                    <td className="border-r px-2.5 py-1.5 font-mono text-[11px] font-bold whitespace-nowrap text-[#006565]">
                                                                        {rek.kode_rekening}
                                                                    </td>
                                                                    <td className="border-r px-1.5 py-1.5 text-center whitespace-nowrap">
                                                                        <div className="inline-flex rounded-md border bg-neutral-50 p-0.5 dark:bg-neutral-900">
                                                                            {(['GU', 'LS'] as const).map(
                                                                                (j) => {
                                                                                    const activeJenis =
                                                                                        matrixJenisValues[
                                                                                            rek.id
                                                                                        ] ??
                                                                                        rek.jenis_pencairan ??
                                                                                        'GU';
                                                                                    return (
                                                                                        <button
                                                                                            key={j}
                                                                                            type="button"
                                                                                            onClick={() =>
                                                                                                setMatrixJenisValues(
                                                                                                    (
                                                                                                        prev
                                                                                                    ) => ({
                                                                                                        ...prev,
                                                                                                        [rek.id]:
                                                                                                            j,
                                                                                                    })
                                                                                                )
                                                                                            }
                                                                                            className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold transition-colors ${
                                                                                                activeJenis ===
                                                                                                j
                                                                                                    ? j ===
                                                                                                      'LS'
                                                                                                        ? 'bg-violet-600 text-white'
                                                                                                        : 'bg-sky-600 text-white'
                                                                                                    : 'text-neutral-500 hover:text-neutral-900'
                                                                                            }`}
                                                                                        >
                                                                                            {j}
                                                                                        </button>
                                                                                    );
                                                                                }
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="border-r px-2.5 py-1.5 leading-snug font-medium">
                                                                        {rek.uraian}
                                                                    </td>
                                                                    <td className="border-r px-2.5 py-1.5 text-right font-mono font-bold whitespace-nowrap">
                                                                        {formatNumber(
                                                                            rek.pagu_anggaran
                                                                        )}
                                                                    </td>
                                                                    {MONTHS.map((m) => {
                                                                        const akbCell =
                                                                            liveMatrixSummary
                                                                                .cellAkbStatus[
                                                                                rek.id
                                                                            ]?.[m.num] || {
                                                                                cumAkb: 0,
                                                                                avail: 0,
                                                                                isOverAkb: false,
                                                                            };
                                                                        const rawVal =
                                                                            matrixValues[rek.id]?.[
                                                                                m.num
                                                                            ] ?? '';
                                                                        const numVal =
                                                                            Number(rawVal) || 0;
                                                                        const isLocked =
                                                                            akbCell.cumAkb <= 0 &&
                                                                            numVal <= 0;
                                                                        return (
                                                                            <td
                                                                                key={m.num}
                                                                                className={`border-r p-1 align-top ${
                                                                                    akbCell.isOverAkb
                                                                                        ? 'bg-rose-50'
                                                                                        : ''
                                                                                }`}
                                                                            >
                                                                                <Input
                                                                                    type="number"
                                                                                    min={0}
                                                                                    step={1000}
                                                                                    placeholder="0"
                                                                                    disabled={
                                                                                        isLocked
                                                                                    }
                                                                                    title={
                                                                                        isLocked
                                                                                            ? 'AKB kumulatif s.d. bulan ini masih 0. Input AKB terlebih dahulu.'
                                                                                            : `Maksimal pencairan bulan ${m.label}: ${formatRupiah(akbCell.avail)}`
                                                                                    }
                                                                                    value={rawVal}
                                                                                    onChange={(
                                                                                        e
                                                                                    ) => {
                                                                                        const val =
                                                                                            e.target
                                                                                                .value;
                                                                                        setMatrixValues(
                                                                                            (
                                                                                                prev
                                                                                            ) => ({
                                                                                                ...prev,
                                                                                                [rek.id]:
                                                                                                    {
                                                                                                        ...(prev[
                                                                                                            rek
                                                                                                                .id
                                                                                                        ] ||
                                                                                                            {}),
                                                                                                        [m.num]:
                                                                                                            val,
                                                                                                    },
                                                                                            })
                                                                                        );
                                                                                    }}
                                                                                    className={`h-7 min-w-[88px] px-1.5 text-right font-mono text-[11px] ${
                                                                                        akbCell.isOverAkb
                                                                                            ? 'border-rose-500 bg-rose-50 text-rose-700 focus-visible:ring-rose-500'
                                                                                            : isLocked
                                                                                              ? 'cursor-not-allowed bg-neutral-100 text-neutral-400'
                                                                                              : ''
                                                                                    }`}
                                                                                />
                                                                                <div
                                                                                    className={`mt-0.5 text-right font-mono text-[9px] leading-tight whitespace-nowrap ${
                                                                                        akbCell.isOverAkb
                                                                                            ? 'font-bold text-rose-600'
                                                                                            : akbCell.cumAkb <=
                                                                                                0
                                                                                              ? 'text-neutral-400'
                                                                                              : 'text-sky-700/80'
                                                                                    }`}
                                                                                >
                                                                                    {akbCell.cumAkb <=
                                                                                    0
                                                                                        ? 'AKB: 0'
                                                                                        : `Maks: ${formatNumber(akbCell.avail)}`}
                                                                                </div>
                                                                            </td>
                                                                        );
                                                                    })}
                                                                    <td className="border-r bg-emerald-50/40 px-2.5 py-1.5 text-right font-mono font-extrabold whitespace-nowrap text-emerald-700">
                                                                        {formatNumber(
                                                                            rowStat.total
                                                                        )}
                                                                    </td>
                                                                    <td
                                                                        className={`px-2.5 py-1.5 text-right font-mono font-extrabold whitespace-nowrap ${
                                                                            isOver
                                                                                ? 'bg-rose-100 text-rose-700'
                                                                                : isFull
                                                                                  ? 'bg-emerald-100/70 text-emerald-700'
                                                                                  : 'bg-amber-100/80 text-amber-900'
                                                                        }`}
                                                                    >
                                                                        {formatNumber(rowStat.sisa)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }
                                                    )}

                                                    {/* BARIS TOTAL BAWAH */}
                                                    <tr className="border-t-2 border-teal-300 bg-neutral-100 font-extrabold dark:bg-neutral-900">
                                                        <td
                                                            colSpan={4}
                                                            className="border-r px-3 py-2.5 text-center uppercase"
                                                        >
                                                            JUMLAH
                                                        </td>
                                                        <td className="border-r px-2.5 py-2.5 text-right font-mono whitespace-nowrap">
                                                            {formatNumber(
                                                                liveMatrixSummary.grandPagu
                                                            )}
                                                        </td>
                                                        {MONTHS.map((m) => (
                                                            <td
                                                                key={m.num}
                                                                className="border-r px-2 py-2.5 text-right font-mono text-[11px] whitespace-nowrap"
                                                            >
                                                                {formatNumber(
                                                                    liveMatrixSummary.monthTotals[
                                                                        m.num
                                                                    ] || 0
                                                                )}
                                                            </td>
                                                        ))}
                                                        <td className="border-r bg-emerald-100/70 px-2.5 py-2.5 text-right font-mono whitespace-nowrap text-emerald-800">
                                                            {formatNumber(
                                                                liveMatrixSummary.grandRealisasi
                                                            )}
                                                        </td>
                                                        <td className="bg-amber-200/80 px-2.5 py-2.5 text-right font-mono whitespace-nowrap text-amber-950">
                                                            {formatNumber(
                                                                liveMatrixSummary.grandSisa
                                                            )}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500">
                                            <span>
                                                Tip: Ketik nominal pencairan pada bulan yang
                                                berjalan, kolom <strong>Total</strong> dan{' '}
                                                <strong>Sisa</strong> akan terhitung otomatis.
                                                Jangan lupa klik{' '}
                                                <strong>Simpan Realisasi Bulanan</strong>.
                                            </span>
                                            <Button
                                                type="button"
                                                disabled={isSavingMatrix}
                                                onClick={handleSaveMatrix}
                                                className="h-8 gap-1.5 bg-[#006565] text-xs font-bold text-white hover:bg-[#005252]"
                                            >
                                                <Save className="size-3.5" />
                                                {isSavingMatrix
                                                    ? 'Menyimpan...'
                                                    : 'Simpan Realisasi'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        )}
                    </div>
                )}

                {/* ================================================================= */}
                {/* SUB-MENU: PERGESERAN ANGGARAN & RKA PERUBAHAN                     */}
                {/* ================================================================= */}
                {activeTab === 'pergeseran' && (
                    <PergeseranPanel
                        selectedYear={selectedYear}
                        subKegiatans={subKegiatans}
                        pergeserans={pergeserans}
                    />
                )}

                {/* ================================================================= */}
                {/* TAB 3: UPLOAD PDF RKA SIPD-RI & EDIT / VERIFIKASI SEBELUM SIMPAN  */}
                {/* ================================================================= */}
                {activeTab === 'upload' && (
                    <div className="space-y-5">
                        {/* BANNER MODE EDIT JIKA SEDANG MENGEDIT RKA */}
                        {editingSubKegiatan && (
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/90 px-4 py-3 text-xs dark:border-amber-800 dark:bg-amber-950/30">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 font-extrabold text-amber-900 dark:text-amber-200">
                                        <Pencil className="size-3.5" />
                                        Mode Edit Data RKA
                                    </div>
                                    <div className="text-amber-800 dark:text-amber-300">
                                        Sedang mengedit:{' '}
                                        <strong className="font-mono">
                                            {editingSubKegiatan.kode_sub_kegiatan}
                                        </strong>{' '}
                                        — <strong>{editingSubKegiatan.nama_sub_kegiatan}</strong>.
                                        Anda dapat mengubah Program, Kegiatan, Sub Kegiatan, serta
                                        menambah/mengubah/menghapus Kode Rekening, Uraian, &amp;
                                        Pagu Anggaran.
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => resetDraftForm()}
                                        className="h-8 gap-1 bg-white text-xs font-bold"
                                    >
                                        <X className="size-3.5" />
                                        Batal Edit / Tambah Baru
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            handleDeleteSubKegiatan(editingSubKegiatan)
                                        }
                                        className="h-8 gap-1 border-rose-300 bg-white text-xs font-bold text-rose-600 hover:bg-rose-50"
                                    >
                                        <Trash2 className="size-3.5" />
                                        Hapus Sub Kegiatan
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* KOTAK UPLOAD PDF RKA */}
                        <Card className="border-teal-200/80">
                            <CardHeader className="border-b border-teal-100 bg-teal-50/40 py-3.5">
                                <CardTitle className="flex items-center gap-2 text-sm font-extrabold text-[#006565]">
                                    <FileUp className="size-4" />
                                    {editingSubKegiatan
                                        ? 'Langkah 1 (Opsional) — Ganti / Baca Ulang File PDF RKA-Belanja'
                                        : 'Langkah 1 — Upload PDF RKA-Belanja SKPD (Cetakan SIPD-RI)'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="flex flex-col gap-3 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/20 p-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="space-y-1">
                                        <div className="text-xs font-extrabold text-neutral-800 dark:text-neutral-100">
                                            Pilih file PDF RKA-Belanja per Sub Kegiatan
                                        </div>
                                        <p className="text-[11px] text-neutral-500">
                                            Sistem akan otomatis membaca Tahun Anggaran, Program,
                                            Kegiatan, Sub Kegiatan, serta seluruh Kode Rekening
                                            Belanja dan Pagunya.
                                        </p>
                                        <Input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={(e) =>
                                                setRkaFile(e.target.files?.[0] || null)
                                            }
                                            className="mt-2 h-9 max-w-md cursor-pointer bg-white text-xs"
                                        />
                                    </div>

                                    <Button
                                        type="button"
                                        disabled={!rkaFile || isParsingRka}
                                        onClick={handleParseRkaPdf}
                                        className="h-10 gap-2 bg-[#006565] px-4 text-xs font-bold text-white hover:bg-[#005252]"
                                    >
                                        {isParsingRka ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                Membaca PDF RKA...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="size-4" />
                                                Baca PDF RKA Otomatis
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* FORM PREVIEW & VERIFIKASI HASIL PARSING RKA */}
                        <Card className="border-neutral-200/80">
                            <CardHeader className="border-b py-3.5">
                                <CardTitle className="flex items-center justify-between text-sm font-extrabold">
                                    <span>
                                        {editingSubKegiatan
                                            ? 'Langkah 2 — Edit Program, Kegiatan, Sub Kegiatan & Kode Rekening'
                                            : 'Langkah 2 — Verifikasi Data Sub Kegiatan & Kode Rekening'}
                                    </span>
                                    <Badge className="bg-teal-50 font-mono text-xs font-extrabold text-[#006565]">
                                        Total Pagu: {formatRupiah(draftTotalAnggaran)}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                <form onSubmit={handleSaveRkaToDatabase} className="space-y-5">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold">
                                                Tahun Anggaran *
                                            </Label>
                                            <Input
                                                type="number"
                                                value={draftTahun}
                                                onChange={(e) => setDraftTahun(e.target.value)}
                                                className="h-9 font-mono text-xs"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold">
                                                Kode Sub Kegiatan *
                                            </Label>
                                            <Input
                                                value={draftKodeSk}
                                                onChange={(e) => setDraftKodeSk(e.target.value)}
                                                placeholder="2.09.03.2.01.0008"
                                                className="h-9 font-mono text-xs"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1 md:col-span-2">
                                            <Label className="text-xs font-bold">
                                                Nama Sub Kegiatan *
                                            </Label>
                                            <Input
                                                value={draftNamaSk}
                                                onChange={(e) => setDraftNamaSk(e.target.value)}
                                                placeholder="Stabilisasi Pasokan dan Harga Pangan..."
                                                className="h-9 text-xs"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold">Program</Label>
                                            <Input
                                                value={draftProgram}
                                                onChange={(e) => setDraftProgram(e.target.value)}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold">Kegiatan</Label>
                                            <Input
                                                value={draftKegiatan}
                                                onChange={(e) => setDraftKegiatan(e.target.value)}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold">
                                                Unit Organisasi
                                            </Label>
                                            <Input
                                                value={draftUnit}
                                                onChange={(e) => setDraftUnit(e.target.value)}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold">
                                                Sumber Pendanaan
                                            </Label>
                                            <Input
                                                value={draftSumberDana}
                                                onChange={(e) =>
                                                    setDraftSumberDana(e.target.value)
                                                }
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1 md:col-span-2">
                                            <Label className="text-xs font-bold">
                                                Keterangan Sub Kegiatan (Tampil di PDF Program &amp;
                                                Kegiatan)
                                            </Label>
                                            <textarea
                                                rows={3}
                                                value={draftKeterangan}
                                                onChange={(e) => setDraftKeterangan(e.target.value)}
                                                placeholder="Contoh: Kegiatan Gerakan Pangan Murah (GPM)&#10;1. Anggaran APBD Kabupaten 8 kali&#10;2. Anggaran APBD Provinsi 6 kali"
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs leading-relaxed shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* TABEL KODE REKENING HASIL BACAAN */}
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-extrabold text-[#006565]">
                                                Daftar Kode Rekening Belanja ({draftRekenings.length}{' '}
                                                rekening)
                                            </Label>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setDraftRekenings((prev) => [
                                                        ...prev,
                                                        {
                                                            uid: `rk-${Date.now()}-${prev.length + 1}`,
                                                            kode_rekening: '',
                                                            uraian: '',
                                                            jenis_pencairan: 'GU',
                                                            pagu_anggaran: '',
                                                        },
                                                    ])
                                                }
                                                className="h-8 gap-1 border-[#006565] text-xs font-bold text-[#006565]"
                                            >
                                                <Plus className="size-3.5" />
                                                Tambah Rekening
                                            </Button>
                                        </div>

                                        <div className="overflow-x-auto rounded-lg border">
                                            <table className="w-full border-collapse text-xs">
                                                <thead>
                                                    <tr className="border-b bg-teal-50/80 text-[11px] font-extrabold text-[#005555]">
                                                        <th className="w-10 px-2 py-2 text-center">
                                                            No
                                                        </th>
                                                        <th className="w-48 px-2 py-2 text-left">
                                                            Kode Rekening
                                                        </th>
                                                        <th className="w-24 px-2 py-2 text-center">
                                                            Jenis
                                                        </th>
                                                        <th className="px-2 py-2 text-left">
                                                            Uraian Belanja
                                                        </th>
                                                        <th className="w-44 px-2 py-2 text-right">
                                                            Pagu Anggaran (Rp)
                                                        </th>
                                                        <th className="w-12 px-2 py-2 text-center">
                                                            Hapus
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {draftRekenings.map((row, idx) => (
                                                        <tr key={row.uid}>
                                                            <td className="px-2 py-1.5 text-center font-bold text-neutral-500">
                                                                {idx + 1}
                                                            </td>
                                                            <td className="p-1.5">
                                                                <Input
                                                                    value={row.kode_rekening}
                                                                    onChange={(e) =>
                                                                        setDraftRekenings((prev) =>
                                                                            prev.map((r, i) =>
                                                                                i === idx
                                                                                    ? {
                                                                                          ...r,
                                                                                          kode_rekening:
                                                                                              e
                                                                                                  .target
                                                                                                  .value,
                                                                                      }
                                                                                    : r
                                                                            )
                                                                        )
                                                                    }
                                                                    placeholder="5.1.02.01.001.00026"
                                                                    className="h-8 font-mono text-xs"
                                                                    required
                                                                />
                                                            </td>
                                                            <td className="p-1.5 text-center">
                                                                <div className="inline-flex rounded-md border bg-neutral-50 p-0.5 dark:bg-neutral-900">
                                                                    {(['GU', 'LS'] as const).map(
                                                                        (j) => (
                                                                            <button
                                                                                key={j}
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    setDraftRekenings(
                                                                                        (prev) =>
                                                                                            prev.map(
                                                                                                (
                                                                                                    r,
                                                                                                    i
                                                                                                ) =>
                                                                                                    i ===
                                                                                                    idx
                                                                                                        ? {
                                                                                                              ...r,
                                                                                                              jenis_pencairan:
                                                                                                                  j,
                                                                                                          }
                                                                                                        : r
                                                                                            )
                                                                                    )
                                                                                }
                                                                                className={`rounded px-2 py-1 text-[10px] font-extrabold transition-colors ${
                                                                                    (row.jenis_pencairan ||
                                                                                        'GU') === j
                                                                                        ? j === 'LS'
                                                                                            ? 'bg-violet-600 text-white'
                                                                                            : 'bg-sky-600 text-white'
                                                                                        : 'text-neutral-500 hover:text-neutral-900'
                                                                                }`}
                                                                            >
                                                                                {j}
                                                                            </button>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-1.5">
                                                                <Input
                                                                    value={row.uraian}
                                                                    onChange={(e) =>
                                                                        setDraftRekenings((prev) =>
                                                                            prev.map((r, i) =>
                                                                                i === idx
                                                                                    ? {
                                                                                          ...r,
                                                                                          uraian: e
                                                                                              .target
                                                                                              .value,
                                                                                      }
                                                                                    : r
                                                                            )
                                                                        )
                                                                    }
                                                                    placeholder="Belanja Alat/Bahan..."
                                                                    className="h-8 text-xs"
                                                                    required
                                                                />
                                                            </td>
                                                            <td className="p-1.5">
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    value={row.pagu_anggaran}
                                                                    onChange={(e) =>
                                                                        setDraftRekenings((prev) =>
                                                                            prev.map((r, i) =>
                                                                                i === idx
                                                                                    ? {
                                                                                          ...r,
                                                                                          pagu_anggaran:
                                                                                              e
                                                                                                  .target
                                                                                                  .value,
                                                                                      }
                                                                                    : r
                                                                            )
                                                                        )
                                                                    }
                                                                    placeholder="0"
                                                                    className="h-8 text-right font-mono text-xs"
                                                                    required
                                                                />
                                                            </td>
                                                            <td className="p-1.5 text-center">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    disabled={
                                                                        draftRekenings.length <= 1
                                                                    }
                                                                    onClick={() => {
                                                                        if (
                                                                            row.total_realisasi &&
                                                                            row.total_realisasi >
                                                                                0 &&
                                                                            !window.confirm(
                                                                                `Rekening "${row.kode_rekening}" sudah memiliki realisasi sebesar ${formatRupiah(row.total_realisasi)}. Hapus rekening beserta data realisasinya?`
                                                                            )
                                                                        ) {
                                                                            return;
                                                                        }
                                                                        setDraftRekenings((prev) =>
                                                                            prev.filter(
                                                                                (_, i) => i !== idx
                                                                            )
                                                                        );
                                                                    }}
                                                                    className="h-7 w-7 p-0 text-rose-600"
                                                                    title={
                                                                        row.total_realisasi &&
                                                                        row.total_realisasi > 0
                                                                            ? `Sudah ada realisasi ${formatRupiah(row.total_realisasi)}`
                                                                            : 'Hapus baris rekening'
                                                                    }
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 border-t pt-3">
                                        {editingSubKegiatan && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => resetDraftForm()}
                                                className="gap-1.5 text-xs font-bold"
                                            >
                                                <X className="size-4" />
                                                Batal Edit
                                            </Button>
                                        )}
                                        <Button
                                            type="submit"
                                            disabled={isSavingRka}
                                            className="gap-1.5 bg-[#006565] text-xs font-bold text-white hover:bg-[#005252]"
                                        >
                                            <Save className="size-4" />
                                            {isSavingRka
                                                ? 'Menyimpan...'
                                                : editingSubKegiatan
                                                  ? 'Simpan Perubahan RKA'
                                                  : 'Simpan ke Database'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}
                {/* MODAL PILIH KOLOM DINAMIS PDF PROGRAM & KEGIATAN */}
                {isPdfDialogOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]">
                        <div className="w-full max-w-lg rounded-2xl border border-teal-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
                            <div className="flex items-center justify-between border-b px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                    <FileSpreadsheet className="size-4 text-[#006565]" />
                                    <h3 className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
                                        Pilih Kolom Laporan PDF (TA {selectedYear})
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsPdfDialogOpen(false)}
                                    className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <div className="space-y-4 p-5">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold">
                                        Judul Laporan PDF (Opsional)
                                    </Label>
                                    <Input
                                        value={pdfCustomTitle}
                                        onChange={(e) => setPdfCustomTitle(e.target.value)}
                                        placeholder={`PROGRAM DAN KEGIATAN BIDANG KDP TAHUN ${selectedYear}`}
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <Label className="text-xs font-extrabold text-[#006565]">
                                            Kolom yang Ditampilkan ({pdfSelectedCols.length}/
                                            {PDF_COLUMN_OPTIONS.length})
                                        </Label>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPdfSelectedCols([
                                                        'program',
                                                        'kegiatan',
                                                        'sub_kegiatan',
                                                        'pagu',
                                                        'keterangan',
                                                    ])
                                                }
                                                className="rounded border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-600 hover:bg-neutral-100"
                                            >
                                                Standar (5 Kolom)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPdfSelectedCols(
                                                        PDF_COLUMN_OPTIONS.map((c) => c.key)
                                                    )
                                                }
                                                className="rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-[#006565] hover:bg-teal-100"
                                            >
                                                Pilih Semua (8 Kolom)
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        {PDF_COLUMN_OPTIONS.map((col) => {
                                            const checked = pdfSelectedCols.includes(col.key);
                                            return (
                                                <label
                                                    key={col.key}
                                                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                                                        checked
                                                            ? 'border-teal-400 bg-teal-50/70 text-[#005555] dark:border-teal-700 dark:bg-teal-950/40 dark:text-teal-200'
                                                            : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => togglePdfCol(col.key)}
                                                        className="size-3.5 accent-[#006565]"
                                                    />
                                                    <span>{col.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-2 border-t bg-neutral-50/60 px-5 py-3 dark:bg-neutral-900/40">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsPdfDialogOpen(false)}
                                    className="h-8 text-xs font-bold"
                                >
                                    Tutup
                                </Button>
                                <a
                                    href={buildProgramKegiatanPdfUrl(false)}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-8 gap-1.5 border-teal-300 bg-white text-xs font-bold text-[#006565] hover:bg-teal-50"
                                    >
                                        <Eye className="size-3.5" />
                                        Preview PDF
                                    </Button>
                                </a>
                                <a
                                    href={buildProgramKegiatanPdfUrl(true)}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="h-8 gap-1.5 bg-[#006565] text-xs font-bold text-white hover:bg-[#005252]"
                                    >
                                        <Download className="size-3.5" />
                                        Download PDF
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

RealisasiAnggaranIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Realisasi Anggaran',
            href: '/realisasi-anggaran',
        },
    ] satisfies BreadcrumbItem[],
};
