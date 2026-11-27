import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Award,
    Briefcase,
    Calendar,
    CalendarPlus,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Coins,
    Download,
    Edit3,
    FileCheck2,
    FileSpreadsheet,
    FileText,
    FileUp,
    FolderKanban,
    Layers,
    MapPin,
    Merge,
    Plus,
    Save,
    Search,
    Trash2,
    UserCheck,
    UserPlus,
    Users,
    Wallet,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import {
    LhpdModal,
    type LhpdTargetItem,
    type LhpdType,
} from '@/components/sppd/lhpd-modal';
import { RkaImportModal } from '@/components/sppd/rka-import-modal';
import { TablePagination } from '@/components/sppd/table-pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface PegawaiItem {
    id: number;
    nama: string;
    nip: string | null;
    pangkat: string | null;
    golongan: string | null;
    golongan_group: string;
    jabatan: string | null;
    tanggal_lahir: string | null;
    tanggal_lahir_formatted: string;
    is_active: boolean;
}

interface PejabatItem {
    id: number;
    tipe: 'kepala_dinas' | 'pptk' | 'bendahara';
    nama: string;
    nip: string | null;
    pangkat: string | null;
    golongan: string | null;
    jabatan: string | null;
    is_active: boolean;
}

interface ZonasiItem {
    id: number;
    nama_kecamatan: string;
    zona: string;
    golongan: string;
    uang_saku: number;
}

interface KecamatanOption {
    nama_kecamatan: string;
    zona: string;
}

interface SubKegiatanItem {
    id: number;
    no_rekening: string;
    nama_kegiatan: string;
    sub_kegiatan: string;
    kode_sub_kegiatan: string;
    is_active: boolean;
}

interface DpaItem {
    id: number;
    nomor_dpa: string;
    tanggal_dpa: string | null;
    tanggal_dpa_formatted: string;
    tahun_anggaran: number;
    keterangan: string | null;
    is_active: boolean;
}

interface SppdBatchEmployeeSummary {
    pegawai_id: number | null;
    nama: string;
    nip: string | null;
    pangkat: string | null;
    golongan: string | null;
    jabatan: string | null;
}

interface SppdBatchChildItem {
    id: number;
    nomor_spt: string;
    raw_nomor_spt?: string | null;
    tanggal_spt: string;
    tanggal_spt_formatted: string;
    tanggal_berangkat: string;
    tanggal_berangkat_formatted: string;
    tujuan: string;
    nama_desa: string | null;
    nama_kecamatan: string;
    zona: string | null;
    kepala_dinas_id?: number | null;
    pptk_id?: number | null;
    bendahara_id?: number | null;
    total_uang_saku: number;
    lhpd_type?: LhpdType | null;
    lhpd_content?: string | null;
    lhpd_table_data?: unknown;
    lhpd_keterangan?: string | null;
    has_lhpd?: boolean;
    participants: {
        id: number;
        pegawai_id: number | null;
        urutan: number;
        nama: string;
        nip: string | null;
        pangkat: string | null;
        golongan: string | null;
        jabatan: string | null;
        uang_saku: number;
    }[];
}

interface SppdBatchGroupItem {
    batch_code: string;
    spt_count: number;
    sub_kegiatan_id: number | null;
    sub_kegiatan: {
        id: number;
        no_rekening: string;
        nama_kegiatan: string;
        sub_kegiatan: string;
        kode_sub_kegiatan: string;
    } | null;
    dpa_id: number | null;
    dpa: {
        id: number;
        nomor_dpa: string;
        tahun_anggaran: number;
        keterangan: string | null;
    } | null;
    kepala_dinas_id: number | null;
    pptk_id: number | null;
    bendahara_id: number | null;
    kecamatan_list: string[];
    tujuan_list: string[];
    primary_tujuan: string;
    primary_desa?: string | null;
    primary_kecamatan: string;
    first_tanggal_berangkat_formatted?: string;
    last_tanggal_berangkat_formatted?: string;
    last_tanggal_berangkat: string;
    last_tanggal_spt: string;
    employees: SppdBatchEmployeeSummary[];
    total_uang_saku: number;
    terbilang_uang_saku?: string;
    created_at_formatted: string;
    items: SppdBatchChildItem[];
}

interface PageProps {
    sppdBatches: SppdBatchGroupItem[];
    lastBatchCode?: string | null;
    pegawais: PegawaiItem[];
    kepalaDinasList: PejabatItem[];
    pptkList: PejabatItem[];
    bendaharaList: PejabatItem[];
    zonasis: ZonasiItem[];
    kecamatanOptions: KecamatanOption[];
    subKegiatans: SubKegiatanItem[];
    dpas: DpaItem[];
    statistics: {
        total_batches: number;
        total_sppd: number;
        total_personil_berangkat: number;
        total_anggaran_uang_saku: number;
        total_pegawai: number;
        total_kecamatan_zonasi: number;
    };
}

interface ParticipantDraft {
    uid: string;
    pegawai_id: string;
    tanggal_berangkat: string;
    tanggal_spt: string;
    tujuan: string;
    nama_desa: string;
    nama_kecamatan: string;
}

interface SppdBatchDraft {
    uid: string;
    nomor_spt: string;
    tanggal_berangkat: string;
    tanggal_spt: string;
    tujuan: string;
    nama_desa: string;
    nama_kecamatan: string;
    kepala_dinas_id: string;
    pptk_id: string;
    bendahara_id: string;
    participants: ParticipantDraft[];
}

const GOLONGAN_OPTIONS = [
    { golongan: 'IV/e', pangkat: 'Pembina Utama' },
    { golongan: 'IV/d', pangkat: 'Pembina Utama Madya' },
    { golongan: 'IV/c', pangkat: 'Pembina Utama Muda' },
    { golongan: 'IV/b', pangkat: 'Pembina Tingkat I' },
    { golongan: 'IV/a', pangkat: 'Pembina' },
    { golongan: 'III/d', pangkat: 'Penata Tingkat I' },
    { golongan: 'III/c', pangkat: 'Penata' },
    { golongan: 'III/b', pangkat: 'Penata Muda Tingkat I' },
    { golongan: 'III/a', pangkat: 'Penata Muda' },
    { golongan: 'II/d', pangkat: 'Pengatur Tingkat I' },
    { golongan: 'II/c', pangkat: 'Pengatur' },
    { golongan: 'II/b', pangkat: 'Pengatur Muda Tingkat I' },
    { golongan: 'II/a', pangkat: 'Pengatur Muda' },
    { golongan: 'I/d', pangkat: 'Juru Tingkat I' },
    { golongan: 'I/c', pangkat: 'Juru' },
    { golongan: 'I/b', pangkat: 'Juru Muda Tingkat I' },
    { golongan: 'I/a', pangkat: 'Juru Muda' },
    { golongan: 'PPPK', pangkat: 'PPPK (Setara Gol. I & II)' },
    { golongan: 'PPPK Gol. IX', pangkat: 'PPPK Ahli Pertama' },
    { golongan: 'PPPK Gol. VII', pangkat: 'PPPK Terampil' },
    { golongan: 'PPPK Gol. V', pangkat: 'PPPK Pemula' },
];

const ZONA_OPTIONS = ['Zona I', 'Zona II', 'Zona III'];
const ZONASI_GOLONGAN_OPTIONS = [
    'Golongan IV',
    'Golongan III',
    'Golongan II',
    'Golongan I',
];

function extractBirthDateFromNip(nip: string): string | null {
    const digits = nip.replace(/\D/g, '');
    if (digits.length < 8) return null;

    const year = parseInt(digits.substring(0, 4), 10);
    const month = parseInt(digits.substring(4, 6), 10);
    const day = parseInt(digits.substring(6, 8), 10);

    if (
        year >= 1930 &&
        year <= 2025 &&
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31
    ) {
        const mm = String(month).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
    }

    return null;
}

function normalizeGolonganToZonasiGroup(golongan?: string | null): string {
    if (!golongan) return 'Golongan III';
    const up = golongan.toUpperCase();
    if (up.includes('PPPK') || up.includes('P3K')) return 'Golongan II';
    if (up.includes('IV')) return 'Golongan IV';
    if (up.includes('III')) return 'Golongan III';
    if (up.includes('II')) return 'Golongan II';
    if (up.includes('I')) return 'Golongan I';
    return golongan;
}

function getGolonganRank(
    golongan?: string | null,
    pangkat?: string | null
): number {
    const raw = (golongan || '').trim().toUpperCase();
    const pangkatUp = (pangkat || '').trim().toUpperCase();
    if (!raw && !pangkatUp) return 0;

    if (
        raw.includes('PPPK') ||
        raw.includes('P3K') ||
        pangkatUp.includes('PPPK') ||
        pangkatUp.includes('P3K') ||
        /^(IX|VIII|VII|VI|V|X|XI|XII)$/.test(raw)
    ) {
        if (/\bXI\b/.test(raw)) return 9;
        if (/\bX\b/.test(raw)) return 8;
        if (/\bIX\b/.test(raw)) return 7;
        if (/\bVII\b/.test(raw)) return 5;
        if (/\bV\b/.test(raw)) return 3;
        return 1;
    }

    const compact = raw.replace(/\s+/g, '').replace(/\./g, '/');
    const rankMap: Record<string, number> = {
        'IV/E': 27,
        'IV/D': 26,
        'IV/C': 25,
        'IV/B': 24,
        'IV/A': 23,
        'III/D': 22,
        'III/C': 21,
        'III/B': 20,
        'III/A': 19,
        'II/D': 18,
        'II/C': 17,
        'II/B': 16,
        'II/A': 15,
        'I/D': 14,
        'I/C': 13,
        'I/B': 12,
        'I/A': 11,
    };

    if (rankMap[compact] !== undefined) return rankMap[compact];
    for (const [k, v] of Object.entries(rankMap)) {
        if (compact.includes(k)) return v;
    }
    if (compact.includes('IV')) return 23;
    if (compact.includes('III')) return 19;
    if (compact.includes('II')) return 15;
    if (compact.includes('I')) return 11;
    return 0;
}

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount || 0);
}

function addDaysToDateStr(dateStr: string, days: number): string {
    if (!dateStr) return new Date().toISOString().slice(0, 10);
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

export default function SppdDalamKotaIndex({
    sppdBatches = [],
    lastBatchCode = null,
    pegawais,
    kepalaDinasList,
    pptkList,
    bendaharaList,
    zonasis,
    kecamatanOptions,
    subKegiatans = [],
    dpas = [],
    statistics,
}: PageProps) {
    const page = usePage();
    type SppdTabKey =
        | 'sppd'
        | 'sub_kegiatan'
        | 'dpa'
        | 'pegawai'
        | 'kepala_dinas'
        | 'pptk'
        | 'bendahara'
        | 'zonasi';

    const VALID_TABS: SppdTabKey[] = [
        'sppd',
        'sub_kegiatan',
        'dpa',
        'pegawai',
        'kepala_dinas',
        'pptk',
        'bendahara',
        'zonasi',
    ];

    const resolveTabFromUrl = (urlStr: string): SppdTabKey => {
        try {
            const parsed = new URL(urlStr, 'http://localhost');
            const tabParam = parsed.searchParams.get('tab') as SppdTabKey | null;
            if (tabParam && VALID_TABS.includes(tabParam)) {
                return tabParam;
            }
        } catch {
            // fallback
        }
        return 'sppd';
    };

    const [activeTab, setActiveTabState] = useState<SppdTabKey>(() =>
        resolveTabFromUrl(page.url)
    );

    useEffect(() => {
        setActiveTabState(resolveTabFromUrl(page.url));
    }, [page.url]);

    const setActiveTab = (tab: SppdTabKey) => {
        setActiveTabState(tab);
        router.get(
            '/sppd-dalam-kota',
            tab === 'sppd' ? {} : { tab },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const defaultKecamatan = kecamatanOptions[0]?.nama_kecamatan || 'Indramayu';
    const defaultKadinId = String(
        kepalaDinasList.find((k) => k.is_active)?.id || kepalaDinasList[0]?.id || ''
    );
    const defaultPptkId = String(
        pptkList.find((p) => p.is_active)?.id || pptkList[0]?.id || ''
    );
    const defaultBendaharaId = String(
        bendaharaList.find((b) => b.is_active)?.id || bendaharaList[0]?.id || ''
    );
    const defaultSubKegiatanId = String(
        subKegiatans.find((s) => s.is_active)?.id || subKegiatans[0]?.id || ''
    );
    const defaultDpaId = String(
        dpas.find((d) => d.is_active)?.id || dpas[0]?.id || ''
    );

    // =========================================================================
    // STEP-BY-STEP WIZARD SPPD DALAM KOTA (LANGKAH 1 -> 2 -> 3) & MINIMIZE
    // =========================================================================
    const WIZARD_STEPS = [
        {
            step: 1 as const,
            title: 'Sub Kegiatan & Batch',
            desc: 'Sub kegiatan, DPA & batch',
        },
        {
            step: 2 as const,
            title: 'Pegawai & Tujuan',
            desc: 'Personil, jadwal & lokasi',
        },
        {
            step: 3 as const,
            title: 'Pejabat & Simpan',
            desc: 'No. SPT, Kadin & ringkasan',
        },
    ];

    const [isFormExpanded, setIsFormExpanded] = useState(false);
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

    const [selectedSubKegiatanId, setSelectedSubKegiatanId] =
        useState<string>('');
    const [selectedDpaId, setSelectedDpaId] = useState<string>('');
    const [targetBatchSelection, setTargetBatchSelection] =
        useState<string>('NEW');

    // State baris Batch yang sedang diklik/dibuka (expand) di tabel — default tersembunyi
    const [expandedBatches, setExpandedBatches] = useState<
        Record<string, boolean>
    >({});

    // State checkbox untuk menggabungkan beberapa batch menjadi 1 batch
    const [selectedBatchCodesToMerge, setSelectedBatchCodesToMerge] = useState<
        string[]
    >([]);

    const toggleExpandBatch = (batchCode: string) => {
        setExpandedBatches((prev) => ({
            ...prev,
            [batchCode]: !prev[batchCode],
        }));
    };

    const activeSubKegiatanObj = useMemo(() => {
        return (
            subKegiatans.find(
                (s) => String(s.id) === String(selectedSubKegiatanId)
            ) || null
        );
    }, [subKegiatans, selectedSubKegiatanId]);

    const activeDpaObj = useMemo(() => {
        return dpas.find((d) => String(d.id) === String(selectedDpaId)) || null;
    }, [dpas, selectedDpaId]);

    const handleSubKegiatanChange = (newSubId: string) => {
        setSelectedSubKegiatanId(newSubId);
    };

    // =========================================================================
    // STEP 2 FORM SPPD: DATA KEBERANGKATAN (MULTI-ORANG & MULTI-TANGGAL)
    // =========================================================================
    const createInitialBatch = (
        dateBerangkat = todayStr,
        dateSpt = todayStr,
        tujuanInitial = '',
        desaInitial = '',
        kecInitial = defaultKecamatan
    ): SppdBatchDraft => ({
        uid: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nomor_spt: '',
        tanggal_berangkat: dateBerangkat,
        tanggal_spt: dateSpt,
        tujuan: tujuanInitial,
        nama_desa: desaInitial,
        nama_kecamatan: kecInitial,
        kepala_dinas_id: defaultKadinId,
        pptk_id: defaultPptkId,
        bendahara_id: defaultBendaharaId,
        participants: [
            {
                uid: `pt-${Date.now()}-1`,
                pegawai_id: String(pegawais[0]?.id || ''),
                tanggal_berangkat: dateBerangkat,
                tanggal_spt: dateSpt,
                tujuan: tujuanInitial,
                nama_desa: desaInitial,
                nama_kecamatan: kecInitial,
            },
        ],
    });

    const [batches, setBatches] = useState<SppdBatchDraft[]>(() => [
        createInitialBatch(),
    ]);
    const [isSubmittingSppd, setIsSubmittingSppd] = useState(false);
    const [afterSavePromptOpen, setAfterSavePromptOpen] = useState(false);
    const [lastSavedReference, setLastSavedReference] = useState<{
        tanggal_berangkat: string;
        tanggal_spt: string;
        tujuan: string;
        nama_desa: string;
        nama_kecamatan: string;
        participantIds: string[];
    } | null>(null);

    const [sppdSearch, setSppdSearch] = useState('');
    const [sppdSubKegiatanFilter, setSppdSubKegiatanFilter] =
        useState<string>('ALL');
    const [sppdMonthFilter, setSppdMonthFilter] = useState<string>('ALL');

    const MONTH_FILTER_OPTIONS = [
        { value: '01', label: 'Januari' },
        { value: '02', label: 'Februari' },
        { value: '03', label: 'Maret' },
        { value: '04', label: 'April' },
        { value: '05', label: 'Mei' },
        { value: '06', label: 'Juni' },
        { value: '07', label: 'Juli' },
        { value: '08', label: 'Agustus' },
        { value: '09', label: 'September' },
        { value: '10', label: 'Oktober' },
        { value: '11', label: 'November' },
        { value: '12', label: 'Desember' },
    ];

    // =========================================================================
    // STATE MODAL EDIT KEBERANGKATAN SPPD DALAM BATCH
    // =========================================================================
    const [editSppdModalOpen, setEditSppdModalOpen] = useState(false);
    const [editingSppdItem, setEditingSppdItem] =
        useState<SppdBatchChildItem | null>(null);
    const [editingSppdBatchCode, setEditingSppdBatchCode] = useState('');
    const [esNomorSpt, setEsNomorSpt] = useState('');
    const [esTanggalBerangkat, setEsTanggalBerangkat] = useState('');
    const [esTanggalSpt, setEsTanggalSpt] = useState('');
    const [esTujuan, setEsTujuan] = useState('');
    const [esNamaDesa, setEsNamaDesa] = useState('');
    const [esNamaKecamatan, setEsNamaKecamatan] = useState('');
    const [esKepalaDinasId, setEsKepalaDinasId] = useState('');
    const [esPptkId, setEsPptkId] = useState('');
    const [esBendaharaId, setEsBendaharaId] = useState('');
    const [esParticipantIds, setEsParticipantIds] = useState<string[]>([]);
    const [isSavingEditSppd, setIsSavingEditSppd] = useState(false);

    // State Modal Isi LHPD per perjalanan
    const [lhpdModalOpen, setLhpdModalOpen] = useState(false);
    const [rkaImportModalOpen, setRkaImportModalOpen] = useState(false);
    const [lhpdTargetItem, setLhpdTargetItem] = useState<LhpdTargetItem | null>(
        null
    );

    const allLhpdItems = useMemo<LhpdTargetItem[]>(() => {
        return sppdBatches.flatMap((grp) =>
            grp.items.map((it) => ({
                id: it.id,
                batch_code: grp.batch_code,
                tanggal_berangkat_formatted: it.tanggal_berangkat_formatted,
                tujuan: it.tujuan,
                nama_desa: it.nama_desa,
                nama_kecamatan: it.nama_kecamatan,
                lhpd_type: it.lhpd_type,
                lhpd_content: it.lhpd_content,
                lhpd_table_data: it.lhpd_table_data,
                lhpd_keterangan: it.lhpd_keterangan,
                has_lhpd: it.has_lhpd,
            }))
        );
    }, [sppdBatches]);

    const handleOpenLhpdModal = (
        item: SppdBatchChildItem,
        batchCode: string
    ) => {
        setLhpdTargetItem({
            id: item.id,
            batch_code: batchCode,
            tanggal_berangkat_formatted: item.tanggal_berangkat_formatted,
            tujuan: item.tujuan,
            nama_desa: item.nama_desa,
            nama_kecamatan: item.nama_kecamatan,
            lhpd_type: item.lhpd_type,
            lhpd_content: item.lhpd_content,
            lhpd_table_data: item.lhpd_table_data,
            lhpd_keterangan: item.lhpd_keterangan,
            has_lhpd: item.has_lhpd,
        });
        setLhpdModalOpen(true);
    };

    const handleOpenEditSppd = (
        item: SppdBatchChildItem,
        batchCode: string
    ) => {
        setEditingSppdItem(item);
        setEditingSppdBatchCode(batchCode);
        setEsNomorSpt(item.raw_nomor_spt || '');
        setEsTanggalBerangkat(item.tanggal_berangkat || todayStr);
        setEsTanggalSpt(item.tanggal_spt || todayStr);
        setEsTujuan(item.tujuan || '');
        setEsNamaDesa(item.nama_desa || '');
        setEsNamaKecamatan(item.nama_kecamatan || defaultKecamatan);
        setEsKepalaDinasId(
            item.kepala_dinas_id ? String(item.kepala_dinas_id) : defaultKadinId
        );
        setEsPptkId(item.pptk_id ? String(item.pptk_id) : defaultPptkId);
        setEsBendaharaId(
            item.bendahara_id ? String(item.bendahara_id) : defaultBendaharaId
        );
        const existingIds = item.participants
            .map((pt) => (pt.pegawai_id ? String(pt.pegawai_id) : ''))
            .filter(Boolean);
        setEsParticipantIds(
            existingIds.length > 0
                ? existingIds
                : [String(pegawais[0]?.id || '')]
        );
        setEditSppdModalOpen(true);
    };

    const handleAddEditParticipant = () => {
        const usedIds = new Set(esParticipantIds);
        const nextAvailable =
            pegawais.find((p) => !usedIds.has(String(p.id))) || pegawais[0];
        setEsParticipantIds((prev) => [
            ...prev,
            String(nextAvailable?.id || ''),
        ]);
    };

    const handleRemoveEditParticipant = (idx: number) => {
        setEsParticipantIds((prev) =>
            prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)
        );
    };

    const handleChangeEditParticipant = (idx: number, pegawaiId: string) => {
        setEsParticipantIds((prev) =>
            prev.map((id, i) => (i === idx ? pegawaiId : id))
        );
    };

    const handleSaveEditSppd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSppdItem) return;

        if (!esTujuan.trim()) {
            toast.error('Tujuan perjalanan wajib diisi.');
            return;
        }
        if (!esNamaKecamatan) {
            toast.error('Kecamatan tujuan wajib dipilih.');
            return;
        }
        if (
            esParticipantIds.length === 0 ||
            esParticipantIds.some((id) => !id)
        ) {
            toast.error('Semua baris pegawai wajib dipilih.');
            return;
        }

        setIsSavingEditSppd(true);
        router.put(
            `/sppd-dalam-kota/sppd/${editingSppdItem.id}`,
            {
                nomor_spt: esNomorSpt.trim() || null,
                tanggal_berangkat: esTanggalBerangkat,
                tanggal_spt: esTanggalSpt,
                tujuan: esTujuan.trim(),
                nama_desa: esNamaDesa.trim() || null,
                nama_kecamatan: esNamaKecamatan,
                kepala_dinas_id: esKepalaDinasId
                    ? Number(esKepalaDinasId)
                    : null,
                pptk_id: esPptkId ? Number(esPptkId) : null,
                bendahara_id: esBendaharaId ? Number(esBendaharaId) : null,
                participant_pegawai_ids: esParticipantIds.map((id) =>
                    Number(id)
                ),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        'Data keberangkatan SPPD dalam batch berhasil diperbarui.'
                    );
                    setEditSppdModalOpen(false);
                    setEditingSppdItem(null);
                },
                onError: (errors) => {
                    const firstErr = Object.values(errors)[0];
                    toast.error(
                        typeof firstErr === 'string'
                            ? firstErr
                            : 'Gagal memperbarui data SPPD.'
                    );
                },
                onFinish: () => setIsSavingEditSppd(false),
            }
        );
    };

    useEffect(() => {
        if (
            targetBatchSelection !== '' &&
            targetBatchSelection !== 'NEW' &&
            sppdBatches.length > 0 &&
            !sppdBatches.some((b) => b.batch_code === targetBatchSelection)
        ) {
            setTargetBatchSelection(sppdBatches[0].batch_code);
        }
    }, [sppdBatches, targetBatchSelection]);

    const getTarifInfo = (pegawaiIdStr: string, namaKecamatan: string) => {
        const peg = pegawais.find((p) => String(p.id) === String(pegawaiIdStr));
        const kecObj = kecamatanOptions.find(
            (k) => k.nama_kecamatan.toLowerCase() === namaKecamatan.toLowerCase()
        );
        const zona = kecObj?.zona || 'Zona I';

        if (!peg) {
            return { pegawai: null, zona, uang_saku: 0 };
        }

        const golGroup = normalizeGolonganToZonasiGroup(peg.golongan);
        const matchedZonasi = zonasis.find(
            (z) =>
                z.nama_kecamatan.toLowerCase() === namaKecamatan.toLowerCase() &&
                (z.golongan.toLowerCase() === (peg.golongan || '').toLowerCase() ||
                    z.golongan.toLowerCase() === golGroup.toLowerCase())
        );

        return {
            pegawai: peg,
            zona: matchedZonasi?.zona || zona,
            uang_saku: matchedZonasi ? matchedZonasi.uang_saku : 0,
        };
    };

    const handleUpdatePrimaryTripField = (
        batchIdx: number,
        field:
            | 'tanggal_berangkat'
            | 'tanggal_spt'
            | 'tujuan'
            | 'nama_desa'
            | 'nama_kecamatan'
            | 'nomor_spt'
            | 'kepala_dinas_id'
            | 'pptk_id'
            | 'bendahara_id',
        value: string
    ) => {
        setBatches((prev) =>
            prev.map((batch, idx) => {
                if (idx !== batchIdx) return batch;
                const updatedBatch = { ...batch, [field]: value };

                if (
                    field === 'tanggal_berangkat' ||
                    field === 'tanggal_spt' ||
                    field === 'tujuan' ||
                    field === 'nama_desa' ||
                    field === 'nama_kecamatan'
                ) {
                    updatedBatch.participants = batch.participants.map((pt) => ({
                        ...pt,
                        [field]: value,
                    }));
                }

                return updatedBatch;
            })
        );
    };

    const handleUpdateParticipantField = (
        batchIdx: number,
        ptIdx: number,
        field: keyof ParticipantDraft,
        value: string
    ) => {
        setBatches((prev) =>
            prev.map((batch, bIdx) => {
                if (bIdx !== batchIdx) return batch;

                const nextParticipants = batch.participants.map((pt, pIdx) => {
                    if (pIdx !== ptIdx) return pt;
                    return { ...pt, [field]: value };
                });

                const updatedBatch = { ...batch, participants: nextParticipants };
                if (
                    ptIdx === 0 &&
                    (field === 'tanggal_berangkat' ||
                        field === 'tanggal_spt' ||
                        field === 'tujuan' ||
                        field === 'nama_desa' ||
                        field === 'nama_kecamatan')
                ) {
                    updatedBatch[field] = value;
                    updatedBatch.participants = nextParticipants.map((pt, i) =>
                        i === 0 ? pt : { ...pt, [field]: value }
                    );
                }

                return updatedBatch;
            })
        );
    };

    const handleAddSameTripPerson = (batchIdx: number) => {
        setBatches((prev) =>
            prev.map((batch, idx) => {
                if (idx !== batchIdx) return batch;

                const firstPerson = batch.participants[0];
                const usedIds = new Set(batch.participants.map((p) => p.pegawai_id));
                const nextAvailablePegawai =
                    pegawais.find((p) => !usedIds.has(String(p.id))) || pegawais[0];

                const newPerson: ParticipantDraft = {
                    uid: `pt-${Date.now()}-${batch.participants.length + 1}`,
                    pegawai_id: String(nextAvailablePegawai?.id || ''),
                    tanggal_berangkat:
                        firstPerson?.tanggal_berangkat || batch.tanggal_berangkat,
                    tanggal_spt: firstPerson?.tanggal_spt || batch.tanggal_spt,
                    tujuan: firstPerson?.tujuan || batch.tujuan,
                    nama_desa: firstPerson?.nama_desa || batch.nama_desa,
                    nama_kecamatan:
                        firstPerson?.nama_kecamatan || batch.nama_kecamatan,
                };

                return {
                    ...batch,
                    participants: [...batch.participants, newPerson],
                };
            })
        );
        toast.success(
            'Baris pegawai berikutnya ditambahkan dengan Tanggal, SPT, Tujuan, Desa & Kecamatan yang sama.'
        );
    };

    const handleRemoveParticipant = (batchIdx: number, ptIdx: number) => {
        setBatches((prev) =>
            prev.map((batch, idx) => {
                if (idx !== batchIdx || batch.participants.length <= 1) return batch;
                return {
                    ...batch,
                    participants: batch.participants.filter((_, i) => i !== ptIdx),
                };
            })
        );
    };

    const handleAddDifferentDateBatch = () => {
        const lastBatch = batches[batches.length - 1];
        const nextDate = addDaysToDateStr(
            lastBatch?.tanggal_berangkat || todayStr,
            1
        );
        const copiedParticipants: ParticipantDraft[] = (
            lastBatch?.participants || []
        ).map((pt, i) => ({
            uid: `pt-${Date.now()}-${i + 1}`,
            pegawai_id: pt.pegawai_id,
            tanggal_berangkat: nextDate,
            tanggal_spt: lastBatch?.tanggal_spt || todayStr,
            tujuan: lastBatch?.tujuan || '',
            nama_desa: lastBatch?.nama_desa || '',
            nama_kecamatan: lastBatch?.nama_kecamatan || defaultKecamatan,
        }));

        const newBatch: SppdBatchDraft = {
            uid: `batch-${Date.now()}-${batches.length + 1}`,
            nomor_spt: '',
            tanggal_berangkat: nextDate,
            tanggal_spt: lastBatch?.tanggal_spt || todayStr,
            tujuan: lastBatch?.tujuan || '',
            nama_desa: lastBatch?.nama_desa || '',
            nama_kecamatan: lastBatch?.nama_kecamatan || defaultKecamatan,
            kepala_dinas_id: lastBatch?.kepala_dinas_id || defaultKadinId,
            pptk_id: lastBatch?.pptk_id || defaultPptkId,
            bendahara_id: lastBatch?.bendahara_id || defaultBendaharaId,
            participants:
                copiedParticipants.length > 0
                    ? copiedParticipants
                    : [
                          {
                              uid: `pt-${Date.now()}-1`,
                              pegawai_id: String(pegawais[0]?.id || ''),
                              tanggal_berangkat: nextDate,
                              tanggal_spt: todayStr,
                              tujuan: lastBatch?.tujuan || '',
                              nama_desa: lastBatch?.nama_desa || '',
                              nama_kecamatan:
                                  lastBatch?.nama_kecamatan || defaultKecamatan,
                          },
                      ],
        };

        setBatches((prev) => [...prev, newBatch]);
        toast.info(
            `Form tanggal keberangkatan baru (${nextDate}) ditambahkan ke dalam Batch ini.`
        );
    };

    const handleRemoveBatch = (batchIdx: number) => {
        if (batches.length <= 1) return;
        setBatches((prev) => prev.filter((_, idx) => idx !== batchIdx));
    };

    // Simpan semua tanggal SPPD ke dalam Batch yang dipilih
    const handleSubmitSppd = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedSubKegiatanId) {
            toast.error(
                'Silakan pilih Sub Kegiatan terlebih dahulu pada Langkah 1.'
            );
            return;
        }

        for (let i = 0; i < batches.length; i++) {
            const b = batches[i];
            if (!b.tujuan.trim()) {
                toast.error(`Mohon isi Tujuan perjalanan dinas pada Tanggal #${i + 1}.`);
                return;
            }
            if (!b.nama_kecamatan) {
                toast.error(`Mohon pilih Kecamatan tujuan pada Tanggal #${i + 1}.`);
                return;
            }
            for (let j = 0; j < b.participants.length; j++) {
                if (!b.participants[j].pegawai_id) {
                    toast.error(
                        `Mohon pilih Nama Pegawai ke-${j + 1} pada Tanggal #${i + 1}.`
                    );
                    return;
                }
            }
        }

        const lastB = batches[batches.length - 1];
        const savedRef = {
            tanggal_berangkat: lastB.tanggal_berangkat,
            tanggal_spt: lastB.tanggal_spt,
            tujuan: lastB.tujuan,
            nama_desa: lastB.nama_desa,
            nama_kecamatan: lastB.nama_kecamatan,
            participantIds: lastB.participants.map((p) => p.pegawai_id),
        };

        setIsSubmittingSppd(true);
        router.post(
            '/sppd-dalam-kota/sppd',
            {
                batch_code:
                    targetBatchSelection === 'NEW' ? null : targetBatchSelection,
                sub_kegiatan_id: Number(selectedSubKegiatanId),
                dpa_id: selectedDpaId ? Number(selectedDpaId) : null,
                batches: batches.map((b) => ({
                    sub_kegiatan_id: Number(selectedSubKegiatanId),
                    dpa_id: selectedDpaId ? Number(selectedDpaId) : null,
                    nomor_spt: b.nomor_spt || null,
                    tanggal_berangkat: b.tanggal_berangkat,
                    tanggal_spt: b.tanggal_spt,
                    tujuan: b.tujuan,
                    nama_desa: b.nama_desa || null,
                    nama_kecamatan: b.nama_kecamatan,
                    kepala_dinas_id: b.kepala_dinas_id
                        ? Number(b.kepala_dinas_id)
                        : null,
                    pptk_id: b.pptk_id ? Number(b.pptk_id) : null,
                    bendahara_id: b.bendahara_id ? Number(b.bendahara_id) : null,
                    participants: b.participants.map((pt) => ({
                        pegawai_id: Number(pt.pegawai_id),
                        tanggal_berangkat: pt.tanggal_berangkat,
                        tanggal_spt: pt.tanggal_spt,
                        tujuan: pt.tujuan,
                        nama_desa: pt.nama_desa || null,
                        nama_kecamatan: pt.nama_kecamatan,
                    })),
                })),
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setIsSubmittingSppd(false);
                    setLastSavedReference(savedRef);
                    const flashBatch =
                        (page.props as unknown as PageProps)?.lastBatchCode ||
                        (page.props as unknown as PageProps)?.sppdBatches?.[0]
                            ?.batch_code;
                    if (flashBatch) {
                        setTargetBatchSelection(flashBatch);
                        setExpandedBatches((prev) => ({
                            ...prev,
                            [flashBatch]: true,
                        }));
                    }
                    setAfterSavePromptOpen(true);
                },
                onError: (errors) => {
                    toast.error(
                        Object.values(errors)[0] ||
                            'Gagal menyimpan data SPPD Dalam Kota.'
                    );
                    setIsSubmittingSppd(false);
                },
            }
        );
    };

    const handleContinueDifferentDateAfterSave = () => {
        const nextDate = addDaysToDateStr(
            lastSavedReference?.tanggal_berangkat || todayStr,
            1
        );
        const nextBatch = createInitialBatch(
            nextDate,
            lastSavedReference?.tanggal_spt || todayStr,
            lastSavedReference?.tujuan || '',
            lastSavedReference?.nama_desa || '',
            lastSavedReference?.nama_kecamatan || defaultKecamatan
        );

        if (
            lastSavedReference &&
            lastSavedReference.participantIds.length > 0
        ) {
            nextBatch.participants = lastSavedReference.participantIds.map(
                (pid, idx) => ({
                    uid: `pt-${Date.now()}-${idx + 1}`,
                    pegawai_id: pid,
                    tanggal_berangkat: nextDate,
                    tanggal_spt: lastSavedReference.tanggal_spt,
                    tujuan: lastSavedReference.tujuan,
                    nama_desa: lastSavedReference.nama_desa,
                    nama_kecamatan: lastSavedReference.nama_kecamatan,
                })
            );
        }

        const targetBatchCode =
            lastBatchCode ||
            (targetBatchSelection !== 'NEW'
                ? targetBatchSelection
                : sppdBatches[0]?.batch_code || 'NEW');
        setTargetBatchSelection(targetBatchCode);
        setBatches([nextBatch]);
        setIsFormExpanded(true);
        setCurrentStep(2);
        setAfterSavePromptOpen(false);
        toast.info(
            `Menambahkan tanggal baru (${nextDate}) ke dalam Batch ${targetBatchCode}.`
        );
    };

    const handleResetFreshFormAfterSave = () => {
        setBatches([createInitialBatch()]);
        setSelectedSubKegiatanId('');
        setSelectedDpaId('');
        setTargetBatchSelection('NEW');
        setCurrentStep(1);
        setIsFormExpanded(false);
        setAfterSavePromptOpen(false);
    };

    const handleNextWizardStep = () => {
        if (currentStep === 1) {
            if (!selectedSubKegiatanId) {
                toast.error('Silakan pilih Sub Kegiatan terlebih dahulu.');
                return;
            }
            if (!selectedDpaId) {
                toast.error('Silakan pilih Nomor DPA terlebih dahulu.');
                return;
            }
            if (!targetBatchSelection) {
                toast.error('Silakan pilih Kelompok Batch terlebih dahulu.');
                return;
            }
            setCurrentStep(2);
            return;
        }

        if (currentStep === 2) {
            for (let bIdx = 0; bIdx < batches.length; bIdx++) {
                const b = batches[bIdx];
                if (b.participants.length === 0) {
                    toast.error(
                        `SPT Tanggal #${bIdx + 1} minimal harus memiliki 1 pegawai.`
                    );
                    return;
                }
                for (let pIdx = 0; pIdx < b.participants.length; pIdx++) {
                    const pt = b.participants[pIdx];
                    if (!pt.pegawai_id) {
                        toast.error(
                            `Pegawai ke-${pIdx + 1} pada SPT Tanggal #${bIdx + 1} wajib dipilih.`
                        );
                        return;
                    }
                    if (!pt.tanggal_berangkat || !pt.tanggal_spt) {
                        toast.error(
                            `Tanggal berangkat & tanggal SPT pada SPT Tanggal #${bIdx + 1} wajib diisi.`
                        );
                        return;
                    }
                    if (!pt.tujuan.trim()) {
                        toast.error(
                            `Tujuan perjalanan pada SPT Tanggal #${bIdx + 1} wajib diisi.`
                        );
                        return;
                    }
                    if (!pt.nama_desa.trim()) {
                        toast.error(
                            `Desa / Tempat tujuan pada SPT Tanggal #${bIdx + 1} wajib diisi.`
                        );
                        return;
                    }
                    if (!pt.nama_kecamatan) {
                        toast.error(
                            `Kecamatan tujuan pada SPT Tanggal #${bIdx + 1} wajib dipilih.`
                        );
                        return;
                    }
                }
            }
            setCurrentStep(3);
        }
    };

    const handleAppendDateToExistingBatch = (
        grp: SppdBatchGroupItem,
        e?: React.MouseEvent
    ) => {
        if (e) e.stopPropagation();
        setTargetBatchSelection(grp.batch_code);
        setSelectedSubKegiatanId(
            grp.sub_kegiatan_id
                ? String(grp.sub_kegiatan_id)
                : defaultSubKegiatanId
        );
        setSelectedDpaId(
            grp.dpa_id ? String(grp.dpa_id) : defaultDpaId
        );

        const freshDraft = createInitialBatch(
            todayStr,
            todayStr,
            '',
            '',
            defaultKecamatan
        );
        freshDraft.participants[0].pegawai_id = '';

        setBatches([freshDraft]);
        setIsFormExpanded(true);
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast.info(
            `Langkah 1 terisi data Batch ${grp.batch_code}. Silakan input pegawai & tujuan baru pada Langkah 2.`
        );
    };

    const openPdfPreview = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleDownloadBatchPdf = (
        batchCode: string,
        e?: React.MouseEvent
    ) => {
        if (e) e.stopPropagation();
        openPdfPreview(`/sppd-dalam-kota/batch/${encodeURIComponent(batchCode)}/pdf`);
    };

    const handleDownloadBatchSptParafPdf = (
        batchCode: string,
        e?: React.MouseEvent
    ) => {
        if (e) e.stopPropagation();
        openPdfPreview(`/sppd-dalam-kota/batch/${encodeURIComponent(batchCode)}/pdf?paraf=1`);
    };

    const handleDownloadBatchSptjbPdf = (
        batchCode: string,
        e?: React.MouseEvent
    ) => {
        if (e) e.stopPropagation();
        openPdfPreview(`/sppd-dalam-kota/batch/${encodeURIComponent(batchCode)}/sptjb-pdf`);
    };

    const handleDownloadBatchC2Pdf = (
        batchCode: string,
        e?: React.MouseEvent
    ) => {
        if (e) e.stopPropagation();
        openPdfPreview(`/sppd-dalam-kota/batch/${encodeURIComponent(batchCode)}/c2-pdf`);
    };

    const handleDownloadBatchRincianPdf = (
        batchCode: string,
        e?: React.MouseEvent
    ) => {
        if (e) e.stopPropagation();
        openPdfPreview(`/sppd-dalam-kota/batch/${encodeURIComponent(batchCode)}/rincian-pdf`);
    };

    const handleDownloadBatchKwitansiPdf = (
        batchCode: string,
        e?: React.MouseEvent
    ) => {
        if (e) e.stopPropagation();
        openPdfPreview(`/sppd-dalam-kota/batch/${encodeURIComponent(batchCode)}/kwitansi-pdf`);
    };

    const handleDownloadBatchKwitansi2Pdf = (
        batchCode: string,
        e?: React.MouseEvent
    ) => {
        if (e) e.stopPropagation();
        openPdfPreview(`/sppd-dalam-kota/batch/${encodeURIComponent(batchCode)}/kwitansi-2-pdf`);
    };

    const handleDownloadBatchSppdPdf = (
        batchCode: string,
        e?: React.MouseEvent
    ) => {
        if (e) e.stopPropagation();
        openPdfPreview(`/sppd-dalam-kota/batch/${encodeURIComponent(batchCode)}/sppd-pdf`);
    };

    const handleDownloadBatchRekapPdf = (
        batchCode: string,
        e?: React.MouseEvent
    ) => {
        if (e) e.stopPropagation();
        openPdfPreview(`/sppd-dalam-kota/batch/${encodeURIComponent(batchCode)}/rekap-pdf`);
    };

    const handleDownloadBatchLhpdPdf = (
        batchCode: string,
        e?: React.MouseEvent
    ) => {
        if (e) e.stopPropagation();
        openPdfPreview(`/sppd-dalam-kota/batch/${encodeURIComponent(batchCode)}/lhpd-pdf`);
    };

    const handleDownloadBatchWord = (
        batchCode: string,
        slug:
            | 'pdf'
            | 'sptjb-pdf'
            | 'c2-pdf'
            | 'rincian-pdf'
            | 'kwitansi-pdf'
            | 'kwitansi-2-pdf'
            | 'sppd-pdf'
            | 'rekap-pdf'
            | 'lhpd-pdf',
        e?: React.MouseEvent
    ) => {
        if (e) e.stopPropagation();
        window.location.href = `/sppd-dalam-kota/batch/${encodeURIComponent(batchCode)}/${slug}?format=word`;
    };

    const handleDeleteBatch = (
        grp: SppdBatchGroupItem,
        e?: React.MouseEvent
    ) => {
        if (e) e.stopPropagation();
        if (
            !window.confirm(
                `Hapus seluruh Batch ${grp.batch_code} (${grp.spt_count} data SPPD)?`
            )
        ) {
            return;
        }

        router.delete(
            `/sppd-dalam-kota/batch/${encodeURIComponent(grp.batch_code)}`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Batch ${grp.batch_code} berhasil dihapus.`);
                },
            }
        );
    };

    const handleMergeSelectedBatches = () => {
        if (selectedBatchCodesToMerge.length < 2) {
            toast.error('Pilih minimal 2 Batch yang ingin digabungkan.');
            return;
        }

        router.post(
            '/sppd-dalam-kota/batches/merge',
            {
                batch_codes: selectedBatchCodesToMerge,
                target_batch_code: selectedBatchCodesToMerge[0],
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        'Batch yang dipilih berhasil digabungkan menjadi 1 Batch!'
                    );
                    setExpandedBatches((prev) => ({
                        ...prev,
                        [selectedBatchCodesToMerge[0]]: true,
                    }));
                    setSelectedBatchCodesToMerge([]);
                },
            }
        );
    };

    // =========================================================================
    // STATE MASTER SUB KEGIATAN
    // =========================================================================
    const [subKegiatanSearch, setSubKegiatanSearch] = useState('');
    const [subKegiatanModalOpen, setSubKegiatanModalOpen] = useState(false);
    const [editingSubKegiatan, setEditingSubKegiatan] =
        useState<SubKegiatanItem | null>(null);
    const [skNoRekening, setSkNoRekening] = useState('5.1.02.04.01.0003');
    const [skNamaKegiatan, setSkNamaKegiatan] = useState('');
    const [skSubKegiatan, setSkSubKegiatan] = useState('');
    const [skKodeSubKegiatan, setSkKodeSubKegiatan] = useState('');
    const [skIsActive, setSkIsActive] = useState(true);
    const [isSavingSubKegiatan, setIsSavingSubKegiatan] = useState(false);

    const filteredSubKegiatans = useMemo(() => {
        const q = subKegiatanSearch.trim().toLowerCase();
        if (!q) return subKegiatans;
        return subKegiatans.filter(
            (s) =>
                s.sub_kegiatan.toLowerCase().includes(q) ||
                s.nama_kegiatan.toLowerCase().includes(q) ||
                s.kode_sub_kegiatan.toLowerCase().includes(q) ||
                s.no_rekening.toLowerCase().includes(q)
        );
    }, [subKegiatans, subKegiatanSearch]);

    const handleOpenCreateSubKegiatan = () => {
        setEditingSubKegiatan(null);
        setSkNoRekening('5.1.02.04.01.0003');
        setSkNamaKegiatan('');
        setSkSubKegiatan('');
        setSkKodeSubKegiatan('');
        setSkIsActive(true);
        setSubKegiatanModalOpen(true);
    };

    const handleOpenEditSubKegiatan = (sk: SubKegiatanItem) => {
        setEditingSubKegiatan(sk);
        setSkNoRekening(sk.no_rekening);
        setSkNamaKegiatan(sk.nama_kegiatan);
        setSkSubKegiatan(sk.sub_kegiatan);
        setSkKodeSubKegiatan(sk.kode_sub_kegiatan);
        setSkIsActive(sk.is_active);
        setSubKegiatanModalOpen(true);
    };

    const handleSaveSubKegiatan = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSubKegiatan(true);

        const payload = {
            no_rekening: skNoRekening.trim(),
            nama_kegiatan: skNamaKegiatan.trim(),
            sub_kegiatan: skSubKegiatan.trim(),
            kode_sub_kegiatan: skKodeSubKegiatan.trim(),
            is_active: skIsActive,
        };

        if (editingSubKegiatan) {
            router.put(
                `/sppd-dalam-kota/sub-kegiatan/${editingSubKegiatan.id}`,
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Master Sub Kegiatan berhasil diperbarui.');
                        setSubKegiatanModalOpen(false);
                        setIsSavingSubKegiatan(false);
                    },
                    onError: (err) => {
                        toast.error(
                            Object.values(err)[0] ||
                                'Gagal memperbarui sub kegiatan.'
                        );
                        setIsSavingSubKegiatan(false);
                    },
                }
            );
        } else {
            router.post('/sppd-dalam-kota/sub-kegiatan', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Master Sub Kegiatan baru berhasil ditambahkan.');
                    setSubKegiatanModalOpen(false);
                    setIsSavingSubKegiatan(false);
                },
                onError: (err) => {
                    toast.error(
                        Object.values(err)[0] || 'Gagal menambahkan sub kegiatan.'
                    );
                    setIsSavingSubKegiatan(false);
                },
            });
        }
    };

    // =========================================================================
    // STATE MASTER NOMOR DPA
    // =========================================================================
    const [dpaModalOpen, setDpaModalOpen] = useState(false);
    const [editingDpa, setEditingDpa] = useState<DpaItem | null>(null);
    const [dNomorDpa, setDNomorDpa] = useState('');
    const [dTanggalDpa, setDTanggalDpa] = useState(todayStr);
    const [dTahunAnggaran, setDTahunAnggaran] = useState(
        String(new Date().getFullYear())
    );
    const [dKeterangan, setDKeterangan] = useState('');
    const [dIsActive, setDIsActive] = useState(true);
    const [isSavingDpa, setIsSavingDpa] = useState(false);

    const handleOpenCreateDpa = () => {
        setEditingDpa(null);
        setDNomorDpa('DPA/A.1/2.09.3.27.0.00.10.0000/001/2026');
        setDTanggalDpa(todayStr);
        setDTahunAnggaran(String(new Date().getFullYear()));
        setDKeterangan('');
        setDIsActive(true);
        setDpaModalOpen(true);
    };

    const handleOpenEditDpa = (dpa: DpaItem) => {
        setEditingDpa(dpa);
        setDNomorDpa(dpa.nomor_dpa);
        setDTanggalDpa(dpa.tanggal_dpa || '');
        setDTahunAnggaran(String(dpa.tahun_anggaran));
        setDKeterangan(dpa.keterangan || '');
        setDIsActive(dpa.is_active);
        setDpaModalOpen(true);
    };

    const handleSaveDpa = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingDpa(true);

        const payload = {
            nomor_dpa: dNomorDpa.trim(),
            tanggal_dpa: dTanggalDpa || null,
            tahun_anggaran: Number(dTahunAnggaran) || new Date().getFullYear(),
            keterangan: dKeterangan.trim() || null,
            is_active: dIsActive,
        };

        if (editingDpa) {
            router.put(`/sppd-dalam-kota/dpa/${editingDpa.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Master Nomor DPA berhasil diperbarui.');
                    setDpaModalOpen(false);
                    setIsSavingDpa(false);
                },
                onError: (err) => {
                    toast.error(
                        Object.values(err)[0] || 'Gagal memperbarui Nomor DPA.'
                    );
                    setIsSavingDpa(false);
                },
            });
        } else {
            router.post('/sppd-dalam-kota/dpa', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Master Nomor DPA baru berhasil ditambahkan.');
                    setDpaModalOpen(false);
                    setIsSavingDpa(false);
                },
                onError: (err) => {
                    toast.error(
                        Object.values(err)[0] || 'Gagal menambahkan Nomor DPA.'
                    );
                    setIsSavingDpa(false);
                },
            });
        }
    };

    // =========================================================================
    // 1. STATE MASTER DATA PEGAWAI
    // =========================================================================
    const [pegawaiSearch, setPegawaiSearch] = useState('');
    const [pegawaiModalOpen, setPegawaiModalOpen] = useState(false);
    const [editingPegawai, setEditingPegawai] = useState<PegawaiItem | null>(null);
    const [pNama, setPNama] = useState('');
    const [pNip, setPNip] = useState('');
    const [pPangkat, setPPangkat] = useState('Penata Muda');
    const [pGolongan, setPGolongan] = useState('III/a');
    const [pJabatan, setPJabatan] = useState('');
    const [pTanggalLahir, setPTanggalLahir] = useState('');
    const [isSavingPegawai, setIsSavingPegawai] = useState(false);

    const handleNipChangeWithAutoBirthDate = (val: string) => {
        setPNip(val);
        const extracted = extractBirthDateFromNip(val);
        if (extracted) {
            setPTanggalLahir(extracted);
        }
    };

    const handleGolonganChangeWithAutoPangkat = (gol: string) => {
        setPGolongan(gol);
        const found = GOLONGAN_OPTIONS.find((g) => g.golongan === gol);
        if (found) {
            setPPangkat(found.pangkat);
        }
    };

    const handleOpenCreatePegawai = () => {
        setEditingPegawai(null);
        setPNama('');
        setPNip('');
        setPGolongan('III/a');
        setPPangkat('Penata Muda');
        setPJabatan('');
        setPTanggalLahir('');
        setPegawaiModalOpen(true);
    };

    const handleOpenEditPegawai = (p: PegawaiItem) => {
        setEditingPegawai(p);
        setPNama(p.nama);
        setPNip(p.nip || '');
        setPGolongan(p.golongan || 'III/a');
        setPPangkat(p.pangkat || '');
        setPJabatan(p.jabatan || '');
        setPTanggalLahir(p.tanggal_lahir || '');
        setPegawaiModalOpen(true);
    };

    const handleSavePegawai = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingPegawai(true);

        const payload = {
            nama: pNama.trim(),
            nip: pNip.trim() || null,
            pangkat: pPangkat.trim() || null,
            golongan: pGolongan,
            jabatan: pJabatan.trim(),
            tanggal_lahir: pTanggalLahir || null,
            is_active: true,
        };

        if (editingPegawai) {
            router.put(`/sppd-dalam-kota/pegawai/${editingPegawai.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Data Master Pegawai berhasil diperbarui.');
                    setPegawaiModalOpen(false);
                    setIsSavingPegawai(false);
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] || 'Gagal memperbarui pegawai.');
                    setIsSavingPegawai(false);
                },
            });
        } else {
            router.post('/sppd-dalam-kota/pegawai', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Master Pegawai baru berhasil ditambahkan.');
                    setPegawaiModalOpen(false);
                    setIsSavingPegawai(false);
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] || 'Gagal menambahkan pegawai.');
                    setIsSavingPegawai(false);
                },
            });
        }
    };

    // =========================================================================
    // 2, 3, 4. STATE MASTER DATA PEJABAT (KEPALA DINAS, PPTK, BENDAHARA)
    // =========================================================================
    const [pejabatModalOpen, setPejabatModalOpen] = useState(false);
    const [editingPejabat, setEditingPejabat] = useState<PejabatItem | null>(null);
    const [pjTipe, setPjTipe] = useState<'kepala_dinas' | 'pptk' | 'bendahara'>(
        'kepala_dinas'
    );
    const [pjNama, setPjNama] = useState('');
    const [pjNip, setPjNip] = useState('');
    const [pjPangkat, setPjPangkat] = useState('');
    const [pjGolongan, setPjGolongan] = useState('IV/b');
    const [pjJabatan, setPjJabatan] = useState('');
    const [pjIsActive, setPjIsActive] = useState(true);
    const [isSavingPejabat, setIsSavingPejabat] = useState(false);

    const handleOpenCreatePejabat = (
        tipe: 'kepala_dinas' | 'pptk' | 'bendahara'
    ) => {
        setEditingPejabat(null);
        setPjTipe(tipe);
        setPjNama('');
        setPjNip('');
        setPjGolongan(tipe === 'kepala_dinas' ? 'IV/c' : 'III/d');
        setPjPangkat(
            tipe === 'kepala_dinas' ? 'Pembina Utama Muda' : 'Penata Tingkat I'
        );
        setPjJabatan(
            tipe === 'kepala_dinas'
                ? 'Kepala Dinas Ketahanan Pangan dan Pertanian'
                : tipe === 'pptk'
                  ? 'Pejabat Pelaksana Teknis Kegiatan (PPTK)'
                  : 'Bendahara Pengeluaran DKPP'
        );
        setPjIsActive(true);
        setPejabatModalOpen(true);
    };

    const handleOpenEditPejabat = (pj: PejabatItem) => {
        setEditingPejabat(pj);
        setPjTipe(pj.tipe);
        setPjNama(pj.nama);
        setPjNip(pj.nip || '');
        setPjPangkat(pj.pangkat || '');
        setPjGolongan(pj.golongan || 'III/d');
        setPjJabatan(pj.jabatan || '');
        setPjIsActive(pj.is_active);
        setPejabatModalOpen(true);
    };

    const handleFillPejabatFromPegawai = (pegawaiIdStr: string) => {
        const peg = pegawais.find((p) => String(p.id) === pegawaiIdStr);
        if (!peg) return;
        setPjNama(peg.nama);
        setPjNip(peg.nip || '');
        setPjPangkat(peg.pangkat || '');
        setPjGolongan(peg.golongan || 'III/d');
        if (peg.jabatan) {
            setPjJabatan(peg.jabatan);
        }
    };

    const handleSavePejabat = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingPejabat(true);

        const payload = {
            tipe: pjTipe,
            nama: pjNama.trim(),
            nip: pjNip.trim() || null,
            pangkat: pjPangkat.trim() || null,
            golongan: pjGolongan,
            jabatan: pjJabatan.trim(),
            is_active: pjIsActive,
        };

        if (editingPejabat) {
            router.put(`/sppd-dalam-kota/pejabat/${editingPejabat.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Data Master Pejabat berhasil diperbarui.');
                    setPejabatModalOpen(false);
                    setIsSavingPejabat(false);
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] || 'Gagal memperbarui pejabat.');
                    setIsSavingPejabat(false);
                },
            });
        } else {
            router.post('/sppd-dalam-kota/pejabat', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Master Pejabat baru berhasil ditambahkan.');
                    setPejabatModalOpen(false);
                    setIsSavingPejabat(false);
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] || 'Gagal menambahkan pejabat.');
                    setIsSavingPejabat(false);
                },
            });
        }
    };

    // =========================================================================
    // 5. STATE MASTER DATA ZONASI
    // =========================================================================
    const [zonasiSearch, setZonasiSearch] = useState('');
    const [zonasiZonaFilter, setZonasiZonaFilter] = useState('all');
    const [zonasiGolFilter, setZonasiGolFilter] = useState('all');
    const [zonasiPage, setZonasiPage] = useState(1);
    const [zonasiPerPage, setZonasiPerPage] = useState(16);
    const [zonasiModalOpen, setZonasiModalOpen] = useState(false);
    const [editingZonasi, setEditingZonasi] = useState<ZonasiItem | null>(null);
    const [zKecamatan, setZKecamatan] = useState('');
    const [zZona, setZZona] = useState('Zona I');
    const [zGolongan, setZGolongan] = useState('Golongan III');
    const [zUangSaku, setZUangSaku] = useState('150000');
    const [isSavingZonasi, setIsSavingZonasi] = useState(false);

    const filteredZonasis = useMemo(() => {
        return zonasis.filter((z) => {
            const q = zonasiSearch.trim().toLowerCase();
            const matchQ =
                q === '' ||
                z.nama_kecamatan.toLowerCase().includes(q) ||
                z.zona.toLowerCase().includes(q) ||
                z.golongan.toLowerCase().includes(q);
            const matchZona =
                zonasiZonaFilter === 'all' || z.zona === zonasiZonaFilter;
            const matchGol =
                zonasiGolFilter === 'all' || z.golongan === zonasiGolFilter;
            return matchQ && matchZona && matchGol;
        });
    }, [zonasis, zonasiSearch, zonasiZonaFilter, zonasiGolFilter]);

    useEffect(() => {
        setZonasiPage(1);
    }, [zonasiSearch, zonasiZonaFilter, zonasiGolFilter, zonasiPerPage]);

    const zonasiTotalPages = Math.max(
        1,
        Math.ceil(filteredZonasis.length / zonasiPerPage)
    );
    const safeZonasiPage = Math.min(zonasiPage, zonasiTotalPages);
    const zonasiStartIdx = (safeZonasiPage - 1) * zonasiPerPage;
    const paginatedZonasis = useMemo(() => {
        return filteredZonasis.slice(
            zonasiStartIdx,
            zonasiStartIdx + zonasiPerPage
        );
    }, [filteredZonasis, zonasiStartIdx, zonasiPerPage]);

    const handleOpenCreateZonasi = () => {
        setEditingZonasi(null);
        setZKecamatan('');
        setZZona('Zona I');
        setZGolongan('Golongan III');
        setZUangSaku('150000');
        setZonasiModalOpen(true);
    };

    const handleOpenEditZonasi = (z: ZonasiItem) => {
        setEditingZonasi(z);
        setZKecamatan(z.nama_kecamatan);
        setZZona(z.zona);
        setZGolongan(z.golongan);
        setZUangSaku(String(z.uang_saku));
        setZonasiModalOpen(true);
    };

    const handleSaveZonasi = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingZonasi(true);

        const payload = {
            nama_kecamatan: zKecamatan.trim(),
            zona: zZona,
            golongan: zGolongan,
            uang_saku: Number(zUangSaku) || 0,
        };

        if (editingZonasi) {
            router.put(`/sppd-dalam-kota/zonasi/${editingZonasi.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Master Zonasi berhasil diperbarui.');
                    setZonasiModalOpen(false);
                    setIsSavingZonasi(false);
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] || 'Gagal memperbarui zonasi.');
                    setIsSavingZonasi(false);
                },
            });
        } else {
            router.post('/sppd-dalam-kota/zonasi', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Master Zonasi berhasil disimpan.');
                    setZonasiModalOpen(false);
                    setIsSavingZonasi(false);
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] || 'Gagal menyimpan zonasi.');
                    setIsSavingZonasi(false);
                },
            });
        }
    };

    const sortedPegawais = useMemo(() => {
        return [...pegawais].sort((a, b) => {
            const rankDiff =
                getGolonganRank(b.golongan, b.pangkat) -
                getGolonganRank(a.golongan, a.pangkat);
            if (rankDiff !== 0) return rankDiff;
            return a.nama.localeCompare(b.nama, 'id');
        });
    }, [pegawais]);

    const filteredPegawais = useMemo(() => {
        const q = pegawaiSearch.trim().toLowerCase();
        if (!q) return sortedPegawais;
        return sortedPegawais.filter(
            (p) =>
                p.nama.toLowerCase().includes(q) ||
                (p.nip && p.nip.toLowerCase().includes(q)) ||
                (p.jabatan && p.jabatan.toLowerCase().includes(q)) ||
                (p.golongan && p.golongan.toLowerCase().includes(q))
        );
    }, [sortedPegawais, pegawaiSearch]);

    const filteredSppdBatches = useMemo(() => {
        const q = sppdSearch.trim().toLowerCase();
        return sppdBatches.filter((b) => {
            const matchSub =
                sppdSubKegiatanFilter === 'ALL' ||
                String(b.sub_kegiatan_id ?? b.sub_kegiatan?.id ?? '') ===
                    sppdSubKegiatanFilter;
            if (!matchSub) return false;
            const matchMonth =
                sppdMonthFilter === 'ALL' ||
                b.items.some(
                    (it) =>
                        String(it.tanggal_berangkat || '').slice(5, 7) ===
                        sppdMonthFilter
                );
            if (!matchMonth) return false;
            if (!q) return true;
            return (
                b.batch_code.toLowerCase().includes(q) ||
                b.tujuan_list.some((t) => t.toLowerCase().includes(q)) ||
                b.kecamatan_list.some((k) => k.toLowerCase().includes(q)) ||
                (b.sub_kegiatan &&
                    b.sub_kegiatan.sub_kegiatan.toLowerCase().includes(q)) ||
                (b.dpa && b.dpa.nomor_dpa.toLowerCase().includes(q)) ||
                b.employees.some((emp) => emp.nama.toLowerCase().includes(q))
            );
        });
    }, [sppdBatches, sppdSearch, sppdSubKegiatanFilter, sppdMonthFilter]);

    const [sppdBatchPage, setSppdBatchPage] = useState(1);
    const [sppdBatchPerPage, setSppdBatchPerPage] = useState(10);

    useEffect(() => {
        setSppdBatchPage(1);
    }, [sppdSearch, sppdSubKegiatanFilter, sppdMonthFilter]);

    const safeSppdBatchPage = Math.min(
        sppdBatchPage,
        Math.max(1, Math.ceil(filteredSppdBatches.length / sppdBatchPerPage))
    );

    const paginatedSppdBatches = useMemo(() => {
        const start = (safeSppdBatchPage - 1) * sppdBatchPerPage;
        return filteredSppdBatches.slice(start, start + sppdBatchPerPage);
    }, [filteredSppdBatches, safeSppdBatchPage, sppdBatchPerPage]);

    const renderPejabatSection = (
        tipe: 'kepala_dinas' | 'pptk' | 'bendahara',
        title: string,
        subtitle: string,
        list: PejabatItem[]
    ) => (
        <Card className="border-sidebar-border/70 shadow-xs">
            <CardHeader className="border-b border-neutral-100 pb-4 dark:border-neutral-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-base font-extrabold">
                            {title}
                        </CardTitle>
                        <p className="text-xs text-neutral-500">{subtitle}</p>
                    </div>
                    <Button
                        onClick={() => handleOpenCreatePejabat(tipe)}
                        className="gap-1.5 bg-[#006565] text-xs text-white hover:bg-[#005252]"
                    >
                        <Plus className="size-4" />
                        Tambah Data
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[11px] font-bold tracking-wider text-neutral-500 uppercase dark:border-neutral-800 dark:bg-neutral-900/50">
                                <th className="px-4 py-3 text-center w-12">No</th>
                                <th className="px-4 py-3">Nama Lengkap</th>
                                <th className="px-4 py-3">NIP</th>
                                <th className="px-4 py-3">Pangkat &amp; Golongan</th>
                                <th className="px-4 py-3">Jabatan</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {list.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-8 text-center text-neutral-400"
                                    >
                                        Belum ada data {title}.
                                    </td>
                                </tr>
                            ) : (
                                list.map((pj, idx) => (
                                    <tr
                                        key={pj.id}
                                        className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40"
                                    >
                                        <td className="px-4 py-3 text-center font-semibold text-neutral-400">
                                            {idx + 1}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-neutral-900 dark:text-neutral-100">
                                            {pj.nama}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400">
                                            {pj.nip || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                                {pj.pangkat || '-'}
                                            </span>{' '}
                                            <Badge
                                                variant="outline"
                                                className="ml-1 border-teal-300 bg-teal-50 text-teal-800 font-bold"
                                            >
                                                {pj.golongan || '-'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                                            {pj.jabatan || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {pj.is_active ? (
                                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                                    Aktif
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">
                                                    Non-aktif
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleOpenEditPejabat(pj)
                                                    }
                                                    className="h-7 px-2 text-xs"
                                                >
                                                    <Edit3 className="size-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                `Hapus ${pj.nama}?`
                                                            )
                                                        ) {
                                                            router.delete(
                                                                `/sppd-dalam-kota/pejabat/${pj.id}`,
                                                                {
                                                                    preserveScroll: true,
                                                                }
                                                            );
                                                        }
                                                    }}
                                                    className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <>
            <Head title="SPPD Dalam Kota & Master Perjalanan Dinas - DKPP Indramayu" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* ========================================================= */}
                {/* HEADER SECTION                                            */}
                {/* ========================================================= */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-xl bg-[#006565] text-white shadow-sm">
                            <Briefcase className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                Modul SPPD Dalam Kota &amp; Master Perjalanan Dinas
                            </h1>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Data SPPD dikelompokkan per Batch. Klik baris Batch pada tabel untuk melihat daftar rincian SPPD, serta unduh PDF <strong>SPT</strong> &amp; <strong>SPTJB</strong>.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* KPI SUMMARY CARDS (COMPACT & MODERN)                      */}
                {/* ========================================================= */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="group relative overflow-hidden rounded-2xl border border-teal-200/70 bg-gradient-to-br from-white via-teal-50/30 to-emerald-50/40 px-4 py-3 shadow-2xs transition-all hover:border-teal-300 hover:shadow-sm dark:border-teal-900/60 dark:from-neutral-900 dark:via-teal-950/20 dark:to-neutral-900">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#006565] to-teal-600 text-white shadow-xs">
                                <FileCheck2 className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[10.5px] font-bold tracking-wider text-teal-700/80 uppercase dark:text-teal-400">
                                    Total Batch &amp; SPPD
                                </div>
                                <div className="mt-0.5 flex items-baseline gap-1.5">
                                    <span className="text-lg font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
                                        {statistics.total_batches} Batch
                                    </span>
                                    <span className="rounded-md bg-teal-100/80 px-1.5 py-0.5 text-[10px] font-bold text-[#006565] dark:bg-teal-900/50 dark:text-teal-300">
                                        {statistics.total_sppd} SPPD
                                    </span>
                                </div>
                                <p className="mt-0.5 truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                                    {statistics.total_personil_berangkat} keberangkatan personil
                                </p>
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => setActiveTab('sub_kegiatan')}
                        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 px-4 py-3 shadow-2xs transition-all hover:border-emerald-300 hover:shadow-sm dark:border-emerald-900/60 dark:from-neutral-900 dark:via-emerald-950/20 dark:to-neutral-900"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-xs">
                                <FolderKanban className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[10.5px] font-bold tracking-wider text-emerald-700/80 uppercase dark:text-emerald-400">
                                    Sub Kegiatan &amp; DPA
                                </div>
                                <div className="mt-0.5 flex items-baseline gap-1.5">
                                    <span className="text-lg font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
                                        {subKegiatans.length} Sub Keg
                                    </span>
                                    <span className="rounded-md bg-emerald-100/80 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                                        {dpas.length} DPA
                                    </span>
                                </div>
                                <p className="mt-0.5 truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                                    Master anggaran terdaftar
                                </p>
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => setActiveTab('pegawai')}
                        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-sky-200/70 bg-gradient-to-br from-white via-sky-50/30 to-blue-50/30 px-4 py-3 shadow-2xs transition-all hover:border-sky-300 hover:shadow-sm dark:border-sky-900/60 dark:from-neutral-900 dark:via-sky-950/20 dark:to-neutral-900"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-blue-600 text-white shadow-xs">
                                <Users className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[10.5px] font-bold tracking-wider text-sky-700/80 uppercase dark:text-sky-400">
                                    Pegawai &amp; Zonasi
                                </div>
                                <div className="mt-0.5 flex items-baseline gap-1.5">
                                    <span className="text-lg font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
                                        {statistics.total_pegawai} Pegawai
                                    </span>
                                    <span className="rounded-md bg-sky-100/80 px-1.5 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">
                                        {statistics.total_kecamatan_zonasi} Kec
                                    </span>
                                </div>
                                <p className="mt-0.5 truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                                    Master personil &amp; tarif zonasi
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-white via-amber-50/30 to-orange-50/30 px-4 py-3 shadow-2xs transition-all hover:border-amber-300 hover:shadow-sm dark:border-amber-900/60 dark:from-neutral-900 dark:via-amber-950/20 dark:to-neutral-900">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-xs">
                                <Wallet className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[10.5px] font-bold tracking-wider text-amber-700/80 uppercase dark:text-amber-400">
                                    Total Uang Saku
                                </div>
                                <div className="mt-0.5 truncate font-mono text-lg font-extrabold tracking-tight text-amber-800 dark:text-amber-300">
                                    {formatRupiah(statistics.total_anggaran_uang_saku)}
                                </div>
                                <p className="mt-0.5 truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                                    Siap cetak 9 format PDF batch
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* TAB UTAMA: FORM INPUT SPPD & DAFTAR BATCH SPPD            */}
                {/* ========================================================= */}
                {activeTab === 'sppd' && (
                    <div className="space-y-6">
                        {/* ================================================= */}
                        {/* FORM INPUT STEP-BY-STEP WIZARD (COLLAPSIBLE)      */}
                        {/* ================================================= */}
                        <Card className="border-2 border-[#006565]/70 bg-gradient-to-br from-teal-50/50 via-white to-emerald-50/30 shadow-sm dark:border-teal-800 dark:from-teal-950/30 dark:via-neutral-900">
                            <CardHeader
                                className={`${
                                    isFormExpanded
                                        ? 'border-b border-teal-100 pb-4 dark:border-teal-900/60'
                                        : 'py-3.5'
                                }`}
                            >
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() =>
                                        setIsFormExpanded((v) => !v)
                                    }
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === 'Enter' ||
                                            e.key === ' '
                                        ) {
                                            e.preventDefault();
                                            setIsFormExpanded((v) => !v);
                                        }
                                    }}
                                    className="flex cursor-pointer flex-wrap items-center justify-between gap-3 select-none"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#006565] text-white shadow-xs">
                                            {isFormExpanded ? (
                                                <FileText className="size-4" />
                                            ) : (
                                                <Plus className="size-4" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-sm font-extrabold text-[#006565] dark:text-teal-300">
                                                    Form Input SPPD Dalam Kota
                                                </CardTitle>
                                                <Badge className="bg-teal-100 text-[10px] font-bold text-[#006565] dark:bg-teal-900/60 dark:text-teal-200">
                                                    Langkah {currentStep} / 3
                                                </Badge>
                                            </div>
                                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                                {isFormExpanded
                                                    ? 'Lengkapi data perjalanan dinas dalam kota secara bertahap (Langkah 1 s/d 3).'
                                                    : 'Form sedang disembunyikan agar tampilan rapi. Klik untuk membuka form input SPPD Dalam Kota.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={
                                                isFormExpanded
                                                    ? 'outline'
                                                    : 'default'
                                            }
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsFormExpanded((v) => !v);
                                            }}
                                            className={
                                                isFormExpanded
                                                    ? 'h-8 gap-1.5 border-teal-300 text-xs font-bold text-[#006565] hover:bg-teal-50'
                                                    : 'h-8 gap-1.5 bg-[#006565] text-xs font-bold text-white hover:bg-[#005252]'
                                            }
                                        >
                                            {isFormExpanded ? (
                                                <>
                                                    <ChevronUp className="size-3.5" />
                                                    <span>Minimize Form</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="size-3.5" />
                                                    <span>Buka Form Input</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* STEPPER INDICATOR (HANYA TAMPIL SAAT EXPANDED) */}
                                {isFormExpanded && (
                                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                        {WIZARD_STEPS.map((st) => {
                                            const isActive =
                                                currentStep === st.step;
                                            const isDone =
                                                currentStep > st.step;
                                            return (
                                                <button
                                                    key={st.step}
                                                    type="button"
                                                    onClick={() => {
                                                        if (
                                                            st.step <
                                                            currentStep
                                                        ) {
                                                            setCurrentStep(
                                                                st.step
                                                            );
                                                        }
                                                    }}
                                                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all ${
                                                        isActive
                                                            ? 'border-[#006565] bg-[#006565] text-white shadow-xs'
                                                            : isDone
                                                              ? 'cursor-pointer border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                                                              : 'border-neutral-200 bg-white/80 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900'
                                                    }`}
                                                >
                                                    <span
                                                        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                                                            isActive
                                                                ? 'bg-white text-[#006565]'
                                                                : isDone
                                                                  ? 'bg-emerald-600 text-white'
                                                                  : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800'
                                                        }`}
                                                    >
                                                        {isDone ? (
                                                            <CheckCircle2 className="size-3.5" />
                                                        ) : (
                                                            st.step
                                                        )}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="truncate text-xs font-extrabold">
                                                            Langkah {st.step}:{' '}
                                                            {st.title}
                                                        </div>
                                                        <div
                                                            className={`truncate text-[10px] ${
                                                                isActive
                                                                    ? 'text-teal-100'
                                                                    : 'opacity-75'
                                                            }`}
                                                        >
                                                            {st.desc}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardHeader>

                            {isFormExpanded && (
                                <CardContent className="pt-5">
                                    <form
                                        onSubmit={handleSubmitSppd}
                                        className="space-y-5"
                                    >
                                        {/* ======================================= */}
                                        {/* LANGKAH 1: SUB KEGIATAN, DPA & BATCH    */}
                                        {/* ======================================= */}
                                        {currentStep === 1 && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-12">
                                                    <div className="min-w-0 space-y-1.5 md:col-span-12">
                                                        <Label className="text-xs font-extrabold text-[#006565] dark:text-teal-300">
                                                            1. Pilih Sub Kegiatan *
                                                        </Label>
                                                        <Select
                                                            value={
                                                                selectedSubKegiatanId
                                                            }
                                                            onValueChange={
                                                                handleSubKegiatanChange
                                                            }
                                                        >
                                                            <SelectTrigger className="h-10 w-full min-w-0 overflow-hidden border-teal-300 bg-white text-xs font-semibold [&>span]:truncate dark:bg-neutral-900">
                                                                <SelectValue placeholder="-- Pilih Sub Kegiatan --" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {subKegiatans.map(
                                                                    (sk) => (
                                                                        <SelectItem
                                                                            key={
                                                                                sk.id
                                                                            }
                                                                            value={String(
                                                                                sk.id
                                                                            )}
                                                                        >
                                                                            [
                                                                            {
                                                                                sk.kode_sub_kegiatan
                                                                            }
                                                                            ]{' '}
                                                                            {
                                                                                sk.sub_kegiatan
                                                                            }
                                                                        </SelectItem>
                                                                    )
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="min-w-0 space-y-1.5 md:col-span-6">
                                                        <Label className="text-xs font-extrabold text-[#006565] dark:text-teal-300">
                                                            2. Pilih Nomor DPA *
                                                        </Label>
                                                        <Select
                                                            value={
                                                                selectedDpaId
                                                            }
                                                            onValueChange={
                                                                setSelectedDpaId
                                                            }
                                                        >
                                                            <SelectTrigger className="h-10 w-full min-w-0 overflow-hidden border-teal-300 bg-white text-xs font-semibold [&>span]:truncate dark:bg-neutral-900">
                                                                <SelectValue placeholder="-- Pilih Nomor DPA --" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {dpas
                                                                    .filter(
                                                                        (d) =>
                                                                            d.is_active
                                                                    )
                                                                    .map(
                                                                        (d) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    d.id
                                                                                }
                                                                                value={String(
                                                                                    d.id
                                                                                )}
                                                                            >
                                                                                {
                                                                                    d.nomor_dpa
                                                                                }{' '}
                                                                                (TA{' '}
                                                                                {
                                                                                    d.tahun_anggaran
                                                                                }
                                                                                )
                                                                            </SelectItem>
                                                                        )
                                                                    )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="min-w-0 space-y-1.5 md:col-span-6">
                                                        <Label className="text-xs font-extrabold text-[#006565] dark:text-teal-300">
                                                            3. Masukkan ke Batch *
                                                        </Label>
                                                        <Select
                                                            value={
                                                                targetBatchSelection
                                                            }
                                                            onValueChange={
                                                                setTargetBatchSelection
                                                            }
                                                        >
                                                            <SelectTrigger className="h-10 w-full min-w-0 overflow-hidden border-teal-300 bg-white text-xs font-bold [&>span]:truncate dark:bg-neutral-900">
                                                                <SelectValue placeholder="-- Pilih Kelompok Batch --" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="NEW">
                                                                    + Buat Batch
                                                                    Baru
                                                                    Terpisah
                                                                </SelectItem>
                                                                {sppdBatches.map(
                                                                    (b) => (
                                                                        <SelectItem
                                                                            key={
                                                                                b.batch_code
                                                                            }
                                                                            value={
                                                                                b.batch_code
                                                                            }
                                                                        >
                                                                            Gabung
                                                                            ke:{' '}
                                                                            {
                                                                                b.batch_code
                                                                            }{' '}
                                                                            (
                                                                            {
                                                                                b.spt_count
                                                                            }{' '}
                                                                            SPPD)
                                                                        </SelectItem>
                                                                    )
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {activeSubKegiatanObj && (
                                                    <div className="grid gap-2.5 rounded-xl border border-teal-200/90 bg-white/90 p-3 text-xs sm:grid-cols-2 lg:grid-cols-4 dark:border-teal-900 dark:bg-neutral-900">
                                                        <div>
                                                            <span className="text-[10px] font-bold uppercase text-neutral-400">
                                                                Kode Sub Kegiatan
                                                            </span>
                                                            <div className="font-mono font-extrabold text-[#006565] dark:text-teal-300">
                                                                {
                                                                    activeSubKegiatanObj.kode_sub_kegiatan
                                                                }
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] font-bold uppercase text-neutral-400">
                                                                Nomor Rekening
                                                            </span>
                                                            <div className="font-mono font-extrabold text-neutral-900 dark:text-neutral-100">
                                                                {
                                                                    activeSubKegiatanObj.no_rekening
                                                                }
                                                            </div>
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <span className="text-[10px] font-bold uppercase text-neutral-400">
                                                                Nama Kegiatan
                                                                &amp; Sub
                                                                Kegiatan
                                                            </span>
                                                            <div className="font-bold text-neutral-800 dark:text-neutral-200">
                                                                {
                                                                    activeSubKegiatanObj.sub_kegiatan
                                                                }
                                                            </div>
                                                            <div className="text-[11px] text-neutral-500">
                                                                Kegiatan:{' '}
                                                                {
                                                                    activeSubKegiatanObj.nama_kegiatan
                                                                }
                                                                {activeDpaObj && (
                                                                    <>
                                                                        {' '}
                                                                        &bull;
                                                                        DPA:{' '}
                                                                        <strong className="font-mono">
                                                                            {
                                                                                activeDpaObj.nomor_dpa
                                                                            }
                                                                        </strong>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ======================================= */}
                                        {/* LANGKAH 2: PEGAWAI & TUJUAN SPPD        */}
                                        {/* ======================================= */}
                                        {currentStep === 2 && (
                                            <div className="space-y-4">
                                                {batches.map(
                                                    (batch, batchIdx) => {
                                                        const batchTotalUangSaku =
                                                            batch.participants.reduce(
                                                                (acc, pt) =>
                                                                    acc +
                                                                    getTarifInfo(
                                                                        pt.pegawai_id,
                                                                        pt.nama_kecamatan
                                                                    ).uang_saku,
                                                                0
                                                            );

                                                        return (
                                                            <div
                                                                key={batch.uid}
                                                                className="rounded-xl border border-teal-200 bg-white p-3.5 shadow-2xs dark:border-teal-900/70 dark:bg-neutral-950"
                                                            >
                                                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-teal-100 pb-2.5 dark:border-teal-900/50">
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge className="bg-[#006565] text-white text-[11px]">
                                                                            SPT
                                                                            Tanggal
                                                                            #
                                                                            {batchIdx +
                                                                                1}
                                                                        </Badge>
                                                                        <span className="text-xs font-extrabold text-neutral-900 dark:text-neutral-100">
                                                                            Input
                                                                            Pegawai
                                                                            &amp;
                                                                            Tujuan
                                                                            (
                                                                            {
                                                                                batch
                                                                                    .participants
                                                                                    .length
                                                                            }{' '}
                                                                            Orang)
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <Badge className="border-emerald-300 bg-emerald-100 text-xs font-extrabold text-emerald-900">
                                                                            Uang
                                                                            Saku:{' '}
                                                                            {formatRupiah(
                                                                                batchTotalUangSaku
                                                                            )}
                                                                        </Badge>
                                                                        {batches.length >
                                                                            1 && (
                                                                            <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() =>
                                                                                    handleRemoveBatch(
                                                                                        batchIdx
                                                                                    )
                                                                                }
                                                                                className="h-7 gap-1 text-xs text-rose-600 hover:bg-rose-50"
                                                                            >
                                                                                <Trash2 className="size-3.5" />
                                                                                Hapus
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-3">
                                                                    {batch.participants.map(
                                                                        (
                                                                            pt,
                                                                            ptIdx
                                                                        ) => {
                                                                            const tarifInfo =
                                                                                getTarifInfo(
                                                                                    pt.pegawai_id,
                                                                                    pt.nama_kecamatan
                                                                                );
                                                                            const peg =
                                                                                tarifInfo.pegawai;

                                                                            return (
                                                                                <div
                                                                                    key={
                                                                                        pt.uid
                                                                                    }
                                                                                    className={`rounded-xl border p-3 transition-all ${
                                                                                        ptIdx ===
                                                                                        0
                                                                                            ? 'border-teal-300/90 bg-white dark:border-teal-800 dark:bg-neutral-900'
                                                                                            : 'border-amber-300/90 bg-amber-50/30 dark:border-amber-800/70 dark:bg-amber-950/10'
                                                                                    }`}
                                                                                >
                                                                                    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-2 dark:border-neutral-800">
                                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                                            <span
                                                                                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-extrabold ${
                                                                                                    ptIdx ===
                                                                                                    0
                                                                                                        ? 'bg-teal-100 text-[#006565]'
                                                                                                        : 'bg-amber-100 text-amber-900'
                                                                                                }`}
                                                                                            >
                                                                                                Orang
                                                                                                ke-
                                                                                                {ptIdx +
                                                                                                    1}
                                                                                                {ptIdx >
                                                                                                    0 &&
                                                                                                    ' (Isian Mengikuti Orang ke-1)'}
                                                                                            </span>

                                                                                            {peg && (
                                                                                                <span className="text-[11px] text-neutral-500">
                                                                                                    NIP:{' '}
                                                                                                    <strong className="font-mono text-neutral-700 dark:text-neutral-300">
                                                                                                        {peg.nip ||
                                                                                                            '-'}
                                                                                                    </strong>{' '}
                                                                                                    &bull;
                                                                                                    Gol:{' '}
                                                                                                    <strong className="text-[#006565]">
                                                                                                        {
                                                                                                            peg.golongan
                                                                                                        }
                                                                                                    </strong>
                                                                                                </span>
                                                                                            )}
                                                                                        </div>

                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800">
                                                                                                <span>
                                                                                                    {
                                                                                                        tarifInfo.zona
                                                                                                    }
                                                                                                </span>
                                                                                                <span>
                                                                                                    &bull;
                                                                                                </span>
                                                                                                <span>
                                                                                                    {formatRupiah(
                                                                                                        tarifInfo.uang_saku
                                                                                                    )}
                                                                                                </span>
                                                                                            </span>

                                                                                            {batch
                                                                                                .participants
                                                                                                .length >
                                                                                                1 && (
                                                                                                <Button
                                                                                                    type="button"
                                                                                                    size="sm"
                                                                                                    variant="outline"
                                                                                                    onClick={() =>
                                                                                                        handleRemoveParticipant(
                                                                                                            batchIdx,
                                                                                                            ptIdx
                                                                                                        )
                                                                                                    }
                                                                                                    className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
                                                                                                    title="Hapus baris orang ini"
                                                                                                >
                                                                                                    <Trash2 className="size-3.5" />
                                                                                                </Button>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-[2.2fr_1.45fr_1.45fr_2fr_1.7fr_1.7fr]">
                                                                                        <div className="min-w-0 space-y-1">
                                                                                            <Label className="block truncate text-[11px] font-bold text-neutral-700 dark:text-neutral-200">
                                                                                                1.
                                                                                                Nama
                                                                                                Pegawai
                                                                                                *
                                                                                            </Label>
                                                                                            <Select
                                                                                                value={
                                                                                                    pt.pegawai_id
                                                                                                }
                                                                                                onValueChange={(
                                                                                                    v
                                                                                                ) =>
                                                                                                    handleUpdateParticipantField(
                                                                                                        batchIdx,
                                                                                                        ptIdx,
                                                                                                        'pegawai_id',
                                                                                                        v
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                <SelectTrigger className="h-9 w-full min-w-0 overflow-hidden bg-white text-xs font-medium [&>span]:truncate dark:bg-neutral-900">
                                                                                                    <SelectValue placeholder="Pilih Pegawai" />
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                    {sortedPegawais.map(
                                                                                                        (
                                                                                                            p
                                                                                                        ) => (
                                                                                                            <SelectItem
                                                                                                                key={
                                                                                                                    p.id
                                                                                                                }
                                                                                                                value={String(
                                                                                                                    p.id
                                                                                                                )}
                                                                                                            >
                                                                                                                {
                                                                                                                    p.nama
                                                                                                                }{' '}
                                                                                                                (
                                                                                                                {
                                                                                                                    p.golongan
                                                                                                                }
                                                                                                                )
                                                                                                            </SelectItem>
                                                                                                        )
                                                                                                    )}
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                        </div>

                                                                                        <div className="min-w-0 space-y-1">
                                                                                            <Label className="block truncate text-[11px] font-bold text-neutral-700 dark:text-neutral-200">
                                                                                                2.
                                                                                                Tgl
                                                                                                Berangkat
                                                                                                *
                                                                                            </Label>
                                                                                            <Input
                                                                                                type="date"
                                                                                                value={
                                                                                                    pt.tanggal_berangkat
                                                                                                }
                                                                                                onChange={(
                                                                                                    e
                                                                                                ) =>
                                                                                                    handleUpdateParticipantField(
                                                                                                        batchIdx,
                                                                                                        ptIdx,
                                                                                                        'tanggal_berangkat',
                                                                                                        e
                                                                                                            .target
                                                                                                            .value
                                                                                                    )
                                                                                                }
                                                                                                className="h-9 w-full min-w-0 bg-white px-2 text-xs dark:bg-neutral-900"
                                                                                                required
                                                                                            />
                                                                                        </div>

                                                                                        <div className="min-w-0 space-y-1">
                                                                                            <Label className="block truncate text-[11px] font-bold text-neutral-700 dark:text-neutral-200">
                                                                                                3.
                                                                                                Tanggal
                                                                                                SPT
                                                                                                *
                                                                                            </Label>
                                                                                            <Input
                                                                                                type="date"
                                                                                                value={
                                                                                                    pt.tanggal_spt
                                                                                                }
                                                                                                onChange={(
                                                                                                    e
                                                                                                ) =>
                                                                                                    handleUpdateParticipantField(
                                                                                                        batchIdx,
                                                                                                        ptIdx,
                                                                                                        'tanggal_spt',
                                                                                                        e
                                                                                                            .target
                                                                                                            .value
                                                                                                    )
                                                                                                }
                                                                                                className="h-9 w-full min-w-0 bg-white px-2 text-xs dark:bg-neutral-900"
                                                                                                required
                                                                                            />
                                                                                        </div>

                                                                                        <div className="min-w-0 space-y-1">
                                                                                            <Label className="block truncate text-[11px] font-bold text-neutral-700 dark:text-neutral-200">
                                                                                                4.
                                                                                                Tujuan
                                                                                                *
                                                                                            </Label>
                                                                                            <Input
                                                                                                value={
                                                                                                    pt.tujuan
                                                                                                }
                                                                                                onChange={(
                                                                                                    e
                                                                                                ) =>
                                                                                                    handleUpdateParticipantField(
                                                                                                        batchIdx,
                                                                                                        ptIdx,
                                                                                                        'tujuan',
                                                                                                        e
                                                                                                            .target
                                                                                                            .value
                                                                                                    )
                                                                                                }
                                                                                                placeholder="Monitoring Harga Pangan"
                                                                                                className="h-9 w-full min-w-0 bg-white text-xs dark:bg-neutral-900"
                                                                                                required
                                                                                            />
                                                                                        </div>

                                                                                        <div className="min-w-0 space-y-1">
                                                                                            <Label className="block truncate text-[11px] font-bold text-neutral-700 dark:text-neutral-200">
                                                                                                5.
                                                                                                Desa
                                                                                                /
                                                                                                Tempat
                                                                                                *
                                                                                            </Label>
                                                                                            <Input
                                                                                                value={
                                                                                                    pt.nama_desa
                                                                                                }
                                                                                                onChange={(
                                                                                                    e
                                                                                                ) =>
                                                                                                    handleUpdateParticipantField(
                                                                                                        batchIdx,
                                                                                                        ptIdx,
                                                                                                        'nama_desa',
                                                                                                        e
                                                                                                            .target
                                                                                                            .value
                                                                                                    )
                                                                                                }
                                                                                                placeholder="Pasar / Desa..."
                                                                                                className="h-9 w-full min-w-0 bg-white text-xs dark:bg-neutral-900"
                                                                                                required
                                                                                            />
                                                                                        </div>

                                                                                        <div className="min-w-0 space-y-1">
                                                                                            <Label className="block truncate text-[11px] font-bold text-neutral-700 dark:text-neutral-200">
                                                                                                6.
                                                                                                Kecamatan
                                                                                                *
                                                                                            </Label>
                                                                                            <Select
                                                                                                value={
                                                                                                    pt.nama_kecamatan
                                                                                                }
                                                                                                onValueChange={(
                                                                                                    v
                                                                                                ) =>
                                                                                                    handleUpdateParticipantField(
                                                                                                        batchIdx,
                                                                                                        ptIdx,
                                                                                                        'nama_kecamatan',
                                                                                                        v
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                <SelectTrigger className="h-9 w-full min-w-0 overflow-hidden bg-white text-xs font-medium [&>span]:truncate dark:bg-neutral-900">
                                                                                                    <SelectValue placeholder="Pilih Kecamatan" />
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                    {kecamatanOptions.map(
                                                                                                        (
                                                                                                            k
                                                                                                        ) => (
                                                                                                            <SelectItem
                                                                                                                key={
                                                                                                                    k.nama_kecamatan
                                                                                                                }
                                                                                                                value={
                                                                                                                    k.nama_kecamatan
                                                                                                                }
                                                                                                            >
                                                                                                                {
                                                                                                                    k.nama_kecamatan
                                                                                                                }{' '}
                                                                                                                (
                                                                                                                {
                                                                                                                    k.zona
                                                                                                                }
                                                                                                                )
                                                                                                            </SelectItem>
                                                                                                        )
                                                                                                    )}
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        }
                                                                    )}
                                                                </div>

                                                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() =>
                                                                            handleAddSameTripPerson(
                                                                                batchIdx
                                                                            )
                                                                        }
                                                                        className="h-8 gap-1.5 border-[#006565] bg-teal-50/70 text-xs font-extrabold text-[#006565] hover:bg-teal-100/80"
                                                                    >
                                                                        <UserPlus className="size-3.5" />
                                                                        + Tambah
                                                                        Orang
                                                                        ke-
                                                                        {batch
                                                                            .participants
                                                                            .length +
                                                                            1}{' '}
                                                                        dengan
                                                                        Isian
                                                                        yang
                                                                        Sama
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                )}

                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={
                                                            handleAddDifferentDateBatch
                                                        }
                                                        className="h-8 gap-1.5 border-amber-400 bg-amber-50 text-xs font-extrabold text-amber-900 hover:bg-amber-100"
                                                    >
                                                        <CalendarPlus className="size-3.5" />
                                                        + Tambah SPPD Lagi di
                                                        Tanggal yang Berbeda
                                                    </Button>
                                                    <span className="text-xs text-neutral-500">
                                                        Total:{' '}
                                                        <strong>
                                                            {batches.length} SPT
                                                        </strong>{' '}
                                                        siap dikonfirmasi di
                                                        Langkah 3.
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* ======================================= */}
                                        {/* LANGKAH 3: NO. SPT, PEJABAT & SIMPAN    */}
                                        {/* ======================================= */}
                                        {currentStep === 3 && (
                                            <div className="space-y-4">
                                                {batches.map(
                                                    (batch, batchIdx) => {
                                                        const batchTotalUangSaku =
                                                            batch.participants.reduce(
                                                                (acc, pt) =>
                                                                    acc +
                                                                    getTarifInfo(
                                                                        pt.pegawai_id,
                                                                        pt.nama_kecamatan
                                                                    ).uang_saku,
                                                                0
                                                            );
                                                        const primary =
                                                            batch
                                                                .participants[0];

                                                        return (
                                                            <div
                                                                key={batch.uid}
                                                                className="rounded-xl border border-teal-200 bg-white p-3.5 shadow-2xs dark:border-teal-900 dark:bg-neutral-950"
                                                            >
                                                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-2 dark:border-neutral-800">
                                                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                                                        <Badge className="bg-[#006565] text-white">
                                                                            SPT
                                                                            #
                                                                            {batchIdx +
                                                                                1}
                                                                        </Badge>
                                                                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                                                                            {primary?.tujuan ||
                                                                                '-'}
                                                                        </span>
                                                                        <span className="text-neutral-500">
                                                                            &bull;{' '}
                                                                            {
                                                                                primary?.nama_desa
                                                                            }
                                                                            ,
                                                                            Kec.{' '}
                                                                            {
                                                                                primary?.nama_kecamatan
                                                                            }{' '}
                                                                            (
                                                                            {
                                                                                primary?.tanggal_berangkat
                                                                            }
                                                                            )
                                                                        </span>
                                                                    </div>
                                                                    <Badge className="border-emerald-300 bg-emerald-100 font-mono text-xs font-extrabold text-emerald-900">
                                                                        {formatRupiah(
                                                                            batchTotalUangSaku
                                                                        )}
                                                                    </Badge>
                                                                </div>

                                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs font-bold">
                                                                            Nomor
                                                                            SPT
                                                                            (Opsional)
                                                                        </Label>
                                                                        <Input
                                                                            value={
                                                                                batch.nomor_spt
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                handleUpdatePrimaryTripField(
                                                                                    batchIdx,
                                                                                    'nomor_spt',
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            placeholder="Kosongkan untuk default: 800.1.11.1/      /KDP"
                                                                            className="h-9 bg-white text-xs dark:bg-neutral-900"
                                                                        />
                                                                    </div>

                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs font-bold">
                                                                            Penandatangan
                                                                            (Kepala
                                                                            Dinas)
                                                                        </Label>
                                                                        <Select
                                                                            value={
                                                                                batch.kepala_dinas_id
                                                                            }
                                                                            onValueChange={(
                                                                                v
                                                                            ) =>
                                                                                handleUpdatePrimaryTripField(
                                                                                    batchIdx,
                                                                                    'kepala_dinas_id',
                                                                                    v
                                                                                )
                                                                            }
                                                                        >
                                                                            <SelectTrigger className="h-9 bg-white text-xs dark:bg-neutral-900">
                                                                                <SelectValue placeholder="Pilih Kepala Dinas" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {kepalaDinasList.map(
                                                                                    (
                                                                                        k
                                                                                    ) => (
                                                                                        <SelectItem
                                                                                            key={
                                                                                                k.id
                                                                                            }
                                                                                            value={String(
                                                                                                k.id
                                                                                            )}
                                                                                        >
                                                                                            {
                                                                                                k.nama
                                                                                            }
                                                                                        </SelectItem>
                                                                                    )
                                                                                )}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-2.5 flex flex-wrap gap-1.5">
                                                                    {batch.participants.map(
                                                                        (
                                                                            pt,
                                                                            i
                                                                        ) => {
                                                                            const info =
                                                                                getTarifInfo(
                                                                                    pt.pegawai_id,
                                                                                    pt.nama_kecamatan
                                                                                );
                                                                            return (
                                                                                <span
                                                                                    key={
                                                                                        pt.uid
                                                                                    }
                                                                                    className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-semibold dark:border-neutral-800 dark:bg-neutral-900"
                                                                                >
                                                                                    {i +
                                                                                        1}
                                                                                    .{' '}
                                                                                    {info
                                                                                        .pegawai
                                                                                        ?.nama ||
                                                                                        '-'}{' '}
                                                                                    <span className="font-mono text-emerald-700">
                                                                                        (
                                                                                        {formatRupiah(
                                                                                            info.uang_saku
                                                                                        )}
                                                                                        )
                                                                                    </span>
                                                                                </span>
                                                                            );
                                                                        }
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                )}

                                                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-3 text-xs dark:border-teal-900 dark:bg-teal-950/30">
                                                    <span>
                                                        Akan disimpan ke dalam{' '}
                                                        <strong className="text-[#006565]">
                                                            {targetBatchSelection ===
                                                            'NEW'
                                                                ? 'Batch Baru'
                                                                : `Batch ${targetBatchSelection}`}
                                                        </strong>{' '}
                                                        ({batches.length} data
                                                        SPPD).
                                                    </span>
                                                    <span className="font-mono text-sm font-extrabold text-[#006565]">
                                                        Total:{' '}
                                                        {formatRupiah(
                                                            batches.reduce(
                                                                (sum, b) =>
                                                                    sum +
                                                                    b.participants.reduce(
                                                                        (
                                                                            acc,
                                                                            pt
                                                                        ) =>
                                                                            acc +
                                                                            getTarifInfo(
                                                                                pt.pegawai_id,
                                                                                pt.nama_kecamatan
                                                                            )
                                                                                .uang_saku,
                                                                        0
                                                                    ),
                                                                0
                                                            )
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* WIZARD NAVIGATION FOOTER */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-teal-100 pt-4 dark:border-teal-900/50">
                                            <div>
                                                {currentStep > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() =>
                                                            setCurrentStep(
                                                                (s) =>
                                                                    (s - 1) as
                                                                        | 1
                                                                        | 2
                                                                        | 3
                                                            )
                                                        }
                                                        className="gap-1.5 text-xs font-bold"
                                                    >
                                                        <ArrowLeft className="size-3.5" />
                                                        Langkah Sebelumnya
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {currentStep < 3 ? (
                                                    <Button
                                                        type="button"
                                                        onClick={
                                                            handleNextWizardStep
                                                        }
                                                        className="gap-1.5 bg-[#006565] px-5 text-xs font-extrabold text-white hover:bg-[#005252]"
                                                    >
                                                        Lanjut ke Langkah{' '}
                                                        {currentStep + 1}
                                                        <ArrowRight className="size-3.5" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="submit"
                                                        disabled={
                                                            isSubmittingSppd
                                                        }
                                                        className="gap-2 bg-[#006565] px-6 text-xs font-extrabold text-white shadow-sm hover:bg-[#005252]"
                                                    >
                                                        <Save className="size-4" />
                                                        {isSubmittingSppd
                                                            ? 'Menyimpan SPPD...'
                                                            : `Simpan ke Batch (${batches.length} SPPD)`}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </form>
                                </CardContent>
                            )}
                        </Card>

                        {/* ================================================= */}
                        {/* TABEL DAFTAR SPPD DALAM KOTA TERSIMPAN (PER BATCH)*/}
                        {/* KLIK BARIS BATCH UNTUK MELIHAT RINCIAN SPPD-NYA    */}
                        {/* ================================================= */}
                        <Card className="border-sidebar-border/70 shadow-xs">
                            <CardHeader className="border-b border-neutral-100 pb-4 dark:border-neutral-800">
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <CardTitle className="text-base font-extrabold">
                                            Daftar SPPD Dalam Kota Tersimpan ({filteredSppdBatches.length} Batch &bull; {statistics.total_sppd} Data SPPD)
                                        </CardTitle>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {selectedBatchCodesToMerge.length >= 2 && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={
                                                    handleMergeSelectedBatches
                                                }
                                                className="h-9 gap-1.5 bg-amber-600 text-xs font-extrabold text-white hover:bg-amber-700"
                                            >
                                                <Merge className="size-4" />
                                                Gabungkan{' '}
                                                {selectedBatchCodesToMerge.length}{' '}
                                                Batch Menjadi 1 Batch
                                            </Button>
                                        )}
                                        <div className="w-full sm:w-40">
                                            <Select
                                                value={sppdMonthFilter}
                                                onValueChange={
                                                    setSppdMonthFilter
                                                }
                                            >
                                                <SelectTrigger className="h-9 w-full min-w-0 overflow-hidden bg-white text-xs [&>span]:truncate dark:bg-neutral-900">
                                                    <SelectValue placeholder="Filter Bulan" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">
                                                        Semua Bulan
                                                    </SelectItem>
                                                    {MONTH_FILTER_OPTIONS.map(
                                                        (m) => (
                                                            <SelectItem
                                                                key={m.value}
                                                                value={m.value}
                                                            >
                                                                {m.label}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-full sm:w-64">
                                            <Select
                                                value={sppdSubKegiatanFilter}
                                                onValueChange={
                                                    setSppdSubKegiatanFilter
                                                }
                                            >
                                                <SelectTrigger className="h-9 w-full min-w-0 overflow-hidden bg-white text-xs [&>span]:truncate dark:bg-neutral-900">
                                                    <SelectValue placeholder="Filter Sub Kegiatan" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">
                                                        Semua Sub Kegiatan
                                                    </SelectItem>
                                                    {subKegiatans.map((sk) => (
                                                        <SelectItem
                                                            key={sk.id}
                                                            value={String(
                                                                sk.id
                                                            )}
                                                        >
                                                            [
                                                            {
                                                                sk.kode_sub_kegiatan
                                                            }
                                                            ]{' '}
                                                            {sk.sub_kegiatan}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="relative w-full sm:w-72">
                                            <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-neutral-400" />
                                            <Input
                                                placeholder="Cari kode batch, pegawai, sub kegiatan..."
                                                value={sppdSearch}
                                                onChange={(e) =>
                                                    setSppdSearch(e.target.value)
                                                }
                                                className="h-9 pl-9 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-teal-200/80 bg-gradient-to-r from-teal-50/95 via-emerald-50/70 to-teal-50/95 text-[11px] font-extrabold tracking-wider text-[#005757] uppercase dark:border-teal-900/70 dark:from-teal-950/60 dark:via-emerald-950/40 dark:to-teal-950/60 dark:text-teal-200">
                                                <th className="px-3 py-3 text-center w-10">
                                                    #
                                                </th>
                                                <th className="px-4 py-3">
                                                    Batch &amp; Jumlah SPPD
                                                </th>
                                                <th className="px-4 py-3">
                                                    Sub Kegiatan
                                                </th>
                                                <th className="px-4 py-3">
                                                    Tujuan &amp; Kecamatan
                                                </th>
                                                <th className="px-4 py-3">
                                                    Personil Pegawai
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    Total Uang Saku
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    Download PDF &amp; Aksi
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                            {filteredSppdBatches.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="px-4 py-10 text-center text-neutral-400"
                                                    >
                                                        Belum ada Batch SPPD Dalam Kota yang tersimpan. Silakan pilih Sub Kegiatan &amp; input melalui form di atas.
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedSppdBatches.map(
                                                    (grp, idx) => {
                                                        const isExpanded =
                                                            Boolean(
                                                                expandedBatches[
                                                                    grp
                                                                        .batch_code
                                                                ]
                                                            );
                                                        const isCheckedForMerge =
                                                            selectedBatchCodesToMerge.includes(
                                                                grp.batch_code
                                                            );

                                                        return (
                                                            <React.Fragment
                                                                key={
                                                                    grp.batch_code
                                                                }
                                                            >
                                                                {/* BARIS UTAMA BATCH (KLIK UNTUK EXPAND MUNCULKAN DAFTAR SPPD) */}
                                                                <tr
                                                                    onClick={() =>
                                                                        toggleExpandBatch(
                                                                            grp.batch_code
                                                                        )
                                                                    }
                                                                    className={`cursor-pointer transition-colors ${
                                                                        isExpanded
                                                                            ? 'bg-teal-50/70 dark:bg-teal-950/30'
                                                                            : 'hover:bg-neutral-50/90 dark:hover:bg-neutral-900/40'
                                                                    }`}
                                                                >
                                                                    <td
                                                                        className="px-3 py-3.5 text-center"
                                                                        onClick={(
                                                                            e
                                                                        ) =>
                                                                            e.stopPropagation()
                                                                        }
                                                                    >
                                                                        <div className="flex items-center justify-center gap-1.5">
                                                                            {filteredSppdBatches.length >
                                                                                1 && (
                                                                                <Checkbox
                                                                                    checked={
                                                                                        isCheckedForMerge
                                                                                    }
                                                                                    onCheckedChange={(
                                                                                        checked
                                                                                    ) => {
                                                                                        setSelectedBatchCodesToMerge(
                                                                                            (
                                                                                                prev
                                                                                            ) =>
                                                                                                checked
                                                                                                    ? [
                                                                                                          ...prev,
                                                                                                          grp.batch_code,
                                                                                                      ]
                                                                                                    : prev.filter(
                                                                                                          (
                                                                                                              c
                                                                                                          ) =>
                                                                                                              c !==
                                                                                                              grp.batch_code
                                                                                                      )
                                                                                        );
                                                                                    }}
                                                                                    title="Centang untuk menggabungkan Batch"
                                                                                />
                                                                            )}
                                                                            <span className="font-bold text-neutral-500">
                                                                                {(safeSppdBatchPage -
                                                                                    1) *
                                                                                    sppdBatchPerPage +
                                                                                    idx +
                                                                                    1}
                                                                            </span>
                                                                        </div>
                                                                    </td>

                                                                    <td className="px-4 py-3 whitespace-nowrap align-middle">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <span
                                                                                className={`flex size-7 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                                                                                    isExpanded
                                                                                        ? 'border-[#006565] bg-[#006565] text-white'
                                                                                        : 'border-teal-200 bg-teal-50 text-[#006565]'
                                                                                }`}
                                                                            >
                                                                                {isExpanded ? (
                                                                                    <ChevronDown className="size-4 stroke-[2.5]" />
                                                                                ) : (
                                                                                    <ChevronRight className="size-4 stroke-[2.5]" />
                                                                                )}
                                                                            </span>
                                                                            <div>
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className="font-mono text-xs font-extrabold text-neutral-900 dark:text-neutral-100">
                                                                                        {grp.batch_code}
                                                                                    </span>
                                                                                    <Badge className="bg-[#006565] text-white hover:bg-[#006565] px-1.5 py-0 text-[10px] font-extrabold">
                                                                                        {grp.spt_count} SPPD
                                                                                    </Badge>
                                                                                </div>
                                                                                <div className="mt-0.5 text-[10px] font-medium text-neutral-500">
                                                                                    {grp.first_tanggal_berangkat_formatted &&
                                                                                    grp.last_tanggal_berangkat_formatted &&
                                                                                    grp.first_tanggal_berangkat_formatted !==
                                                                                        grp.last_tanggal_berangkat_formatted
                                                                                        ? `${grp.first_tanggal_berangkat_formatted} – ${grp.last_tanggal_berangkat_formatted}`
                                                                                        : grp.first_tanggal_berangkat_formatted ||
                                                                                          'Klik untuk rincian'}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>

                                                                    <td className="px-4 py-3 min-w-[240px] max-w-[320px] align-middle">
                                                                        {grp.sub_kegiatan ? (
                                                                            <div className="font-bold leading-snug text-neutral-900 whitespace-normal dark:text-neutral-100">
                                                                                {grp.sub_kegiatan.sub_kegiatan}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-neutral-400">-</span>
                                                                        )}
                                                                    </td>

                                                                    <td className="px-4 py-3 max-w-[210px] align-middle">
                                                                        <div className="truncate font-semibold text-neutral-800 dark:text-neutral-200" title={grp.tujuan_list.join(', ')}>
                                                                            {grp.primary_tujuan}
                                                                            {grp.tujuan_list.length > 1 && (
                                                                                <span className="ml-1 text-[10px] font-bold text-[#006565]">
                                                                                    (+{grp.tujuan_list.length - 1} tujuan)
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="mt-1 flex items-center gap-1 whitespace-nowrap">
                                                                            {grp.kecamatan_list.slice(0, 1).map((kec) => (
                                                                                <span
                                                                                    key={kec}
                                                                                    className="inline-flex items-center truncate max-w-[140px] rounded-md border border-blue-200 bg-blue-50/80 px-1.5 py-0 text-[10px] font-semibold text-blue-800"
                                                                                >
                                                                                    Kec. {kec}
                                                                                </span>
                                                                            ))}
                                                                            {grp.kecamatan_list.length > 1 && (
                                                                                <span className="shrink-0 rounded-md bg-neutral-100 px-1.5 py-0 text-[10px] font-bold text-neutral-600">
                                                                                    +{grp.kecamatan_list.length - 1} kec
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>

                                                                    <td className="px-4 py-3 align-middle">
                                                                        <div className="flex flex-wrap gap-1 max-w-[230px]">
                                                                            {grp.employees.slice(0, 2).map((emp, eIdx) => (
                                                                                <span
                                                                                    key={`${emp.nama}-${eIdx}`}
                                                                                    className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-neutral-800 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
                                                                                >
                                                                                    <span className="text-[10px] font-bold text-neutral-400">
                                                                                        {eIdx + 1}.
                                                                                    </span>
                                                                                    <span className="truncate max-w-[135px]">
                                                                                        {emp.nama}
                                                                                    </span>
                                                                                    <span className="rounded bg-teal-50 px-1 text-[9px] font-extrabold text-[#006565]">
                                                                                        {emp.golongan}
                                                                                    </span>
                                                                                </span>
                                                                            ))}
                                                                            {grp.employees.length > 2 && (
                                                                                <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                                                                    +{grp.employees.length - 2} lainnya
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>

                                                                    <td className="px-4 py-3 text-right whitespace-nowrap align-middle">
                                                                        <div className="font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                                                                            {formatRupiah(grp.total_uang_saku)}
                                                                        </div>
                                                                        <div className="text-[10px] text-neutral-400">
                                                                            {grp.items.reduce(
                                                                                (acc, it) => acc + it.participants.length,
                                                                                0
                                                                            )}{' '}
                                                                            Tanda Bukti
                                                                        </div>
                                                                    </td>

                                                                    <td
                                                                        className="px-4 py-3 text-right whitespace-nowrap align-middle"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <div className="inline-flex items-center justify-end gap-1.5">
                                                                            {/* DROPDOWN MENU DOWNLOAD PDF */}
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        className="h-8 gap-1.5 px-3 text-xs font-bold bg-[#006565] text-white hover:bg-[#005252] shadow-2xs"
                                                                                    >
                                                                                        <Download className="size-3.5" />
                                                                                        <span>Preview / Cetak PDF</span>
                                                                                        <ChevronDown className="size-3.5 opacity-80" />
                                                                                    </Button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent
                                                                                    align="end"
                                                                                    collisionPadding={12}
                                                                                    className="max-h-[min(70vh,var(--radix-dropdown-menu-content-available-height))] w-64 overflow-y-auto rounded-xl p-1.5 shadow-lg"
                                                                                >
                                                                                    <DropdownMenuLabel className="px-2 py-1 text-[10px] font-extrabold tracking-wider text-neutral-400 uppercase">
                                                                                        Dokumen PDF ({grp.batch_code})
                                                                                    </DropdownMenuLabel>
                                                                                    <DropdownMenuSeparator />
                                                                                    <DropdownMenuItem
                                                                                        onClick={() =>
                                                                                            handleDownloadBatchPdf(
                                                                                                grp.batch_code
                                                                                            )
                                                                                        }
                                                                                        className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
                                                                                    >
                                                                                        <FileText className="mt-0.5 size-4 shrink-0 text-[#006565]" />
                                                                                        <div>
                                                                                            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                                                1. Cetak SPT (PDF)
                                                                                            </div>
                                                                                            <div className="text-[10px] text-neutral-500">
                                                                                                Surat Tugas ({grp.spt_count} lembar dalam 1 file)
                                                                                            </div>
                                                                                        </div>
                                                                                    </DropdownMenuItem>

                                                                                    <DropdownMenuItem
                                                                                        onClick={() =>
                                                                                            handleDownloadBatchSptParafPdf(
                                                                                                grp.batch_code
                                                                                            )
                                                                                        }
                                                                                        className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
                                                                                    >
                                                                                        <FileText className="mt-0.5 size-4 shrink-0 text-sky-600" />
                                                                                        <div>
                                                                                            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                                                1b. SPT Blok Paraf (PDF)
                                                                                            </div>
                                                                                            <div className="text-[10px] text-neutral-500">
                                                                                                Surat Tugas dengan kolom paraf ({grp.spt_count} lembar)
                                                                                            </div>
                                                                                        </div>
                                                                                    </DropdownMenuItem>

                                                                                    <DropdownMenuItem
                                                                                        onClick={() =>
                                                                                            handleDownloadBatchSptjbPdf(
                                                                                                grp.batch_code
                                                                                            )
                                                                                        }
                                                                                        className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
                                                                                    >
                                                                                        <FileCheck2 className="mt-0.5 size-4 shrink-0 text-indigo-600" />
                                                                                        <div>
                                                                                            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                                                2. Laporan SPTJB (PDF)
                                                                                            </div>
                                                                                            <div className="text-[10px] text-neutral-500">
                                                                                                Surat Pernyataan Tanggung Jawab Belanja
                                                                                            </div>
                                                                                        </div>
                                                                                    </DropdownMenuItem>

                                                                                    <DropdownMenuItem
                                                                                        onClick={() =>
                                                                                            handleDownloadBatchC2Pdf(
                                                                                                grp.batch_code
                                                                                            )
                                                                                        }
                                                                                        className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
                                                                                    >
                                                                                        <FileSpreadsheet className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                                                                                        <div>
                                                                                            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                                                3. Laporan C2 (PDF)
                                                                                            </div>
                                                                                            <div className="text-[10px] text-neutral-500">
                                                                                                Perincian Pengeluaran Tanda Bukti
                                                                                            </div>
                                                                                        </div>
                                                                                    </DropdownMenuItem>

                                                                                    <DropdownMenuItem
                                                                                        onClick={() =>
                                                                                            handleDownloadBatchRincianPdf(
                                                                                                grp.batch_code
                                                                                            )
                                                                                        }
                                                                                        className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
                                                                                    >
                                                                                        <FileText className="mt-0.5 size-4 shrink-0 text-amber-600" />
                                                                                        <div>
                                                                                            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                                                4. Laporan Rincian (PDF)
                                                                                            </div>
                                                                                            <div className="text-[10px] text-neutral-500">
                                                                                                Rincian Biaya Perjalanan Dinas ({grp.spt_count} lembar)
                                                                                            </div>
                                                                                        </div>
                                                                                    </DropdownMenuItem>

                                                                                    <DropdownMenuItem
                                                                                        onClick={() =>
                                                                                            handleDownloadBatchKwitansiPdf(
                                                                                                grp.batch_code
                                                                                            )
                                                                                        }
                                                                                        className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
                                                                                    >
                                                                                        <FileCheck2 className="mt-0.5 size-4 shrink-0 text-purple-600" />
                                                                                        <div>
                                                                                            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                                                5. Laporan Kwitansi (PDF)
                                                                                            </div>
                                                                                            <div className="text-[10px] text-neutral-500">
                                                                                                Tanda Terima Uang Harian ({grp.spt_count} lembar)
                                                                                            </div>
                                                                                        </div>
                                                                                    </DropdownMenuItem>

                                                                                    <DropdownMenuItem
                                                                                        onClick={() =>
                                                                                            handleDownloadBatchKwitansi2Pdf(
                                                                                                grp.batch_code
                                                                                            )
                                                                                        }
                                                                                        className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
                                                                                    >
                                                                                        <FileCheck2 className="mt-0.5 size-4 shrink-0 text-rose-600" />
                                                                                        <div>
                                                                                            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                                                6. Kwitansi 2 (PDF)
                                                                                            </div>
                                                                                            <div className="text-[10px] text-neutral-500">
                                                                                                Kuitansi Perjalanan Dinas ({grp.spt_count} lembar)
                                                                                            </div>
                                                                                        </div>
                                                                                    </DropdownMenuItem>

                                                                                    <DropdownMenuItem
                                                                                        onClick={() =>
                                                                                            handleDownloadBatchSppdPdf(
                                                                                                grp.batch_code
                                                                                            )
                                                                                        }
                                                                                        className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
                                                                                    >
                                                                                        <FileText className="mt-0.5 size-4 shrink-0 text-sky-600" />
                                                                                        <div>
                                                                                            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                                                7. SPPD (PDF)
                                                                                            </div>
                                                                                            <div className="text-[10px] text-neutral-500">
                                                                                                Surat Perjalanan Dinas / SPD ({grp.spt_count} lembar)
                                                                                            </div>
                                                                                        </div>
                                                                                    </DropdownMenuItem>

                                                                                    <DropdownMenuItem
                                                                                        onClick={() =>
                                                                                            handleDownloadBatchRekapPdf(
                                                                                                grp.batch_code
                                                                                            )
                                                                                        }
                                                                                        className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
                                                                                    >
                                                                                        <FileSpreadsheet className="mt-0.5 size-4 shrink-0 text-teal-600" />
                                                                                        <div>
                                                                                            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                                                8. Rekap (PDF)
                                                                                            </div>
                                                                                            <div className="text-[10px] text-neutral-500">
                                                                                                Rekapitulasi Perjalanan Dinas Batch
                                                                                            </div>
                                                                                        </div>
                                                                                    </DropdownMenuItem>

                                                                                    <DropdownMenuItem
                                                                                        onClick={() =>
                                                                                            handleDownloadBatchLhpdPdf(
                                                                                                grp.batch_code
                                                                                            )
                                                                                        }
                                                                                        className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
                                                                                    >
                                                                                        <FileText className="mt-0.5 size-4 shrink-0 text-orange-600" />
                                                                                        <div>
                                                                                            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                                                9. LHPD (PDF)
                                                                                            </div>
                                                                                            <div className="text-[10px] text-neutral-500">
                                                                                                Laporan Hasil Perjalanan Dinas ({grp.spt_count} lembar)
                                                                                            </div>
                                                                                        </div>
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>

                                                                            {/* DROPDOWN MENU DOWNLOAD WORD (.DOC) */}
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        className="h-8 gap-1 px-2.5 text-xs font-bold border-blue-300 bg-blue-50/70 text-blue-800 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                                                                                        title="Download dokumen Microsoft Word (.doc) agar bisa diedit"
                                                                                    >
                                                                                        <FileText className="size-3.5" />
                                                                                        <span>Word</span>
                                                                                        <ChevronDown className="size-3.5 opacity-80" />
                                                                                    </Button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent
                                                                                    align="end"
                                                                                    collisionPadding={12}
                                                                                    className="max-h-[min(70vh,var(--radix-dropdown-menu-content-available-height))] w-64 overflow-y-auto rounded-xl p-1.5 shadow-lg"
                                                                                >
                                                                                    <DropdownMenuLabel className="px-2 py-1 text-[10px] font-extrabold tracking-wider text-blue-600 uppercase">
                                                                                        Download Word (.doc) — Bisa Diedit
                                                                                    </DropdownMenuLabel>
                                                                                    <DropdownMenuSeparator />
                                                                                    {[
                                                                                        { slug: 'pdf' as const, label: '1. SPT (Word)', sub: `Surat Tugas (${grp.spt_count} lembar)` },
                                                                                        { slug: 'sptjb-pdf' as const, label: '2. Laporan SPTJB (Word)', sub: 'Surat Pernyataan Tanggung Jawab Belanja' },
                                                                                        { slug: 'c2-pdf' as const, label: '3. Laporan C2 (Word)', sub: 'Perincian Pengeluaran Tanda Bukti' },
                                                                                        { slug: 'rincian-pdf' as const, label: '4. Laporan Rincian (Word)', sub: `Rincian Biaya Perjalanan (${grp.spt_count} lembar)` },
                                                                                        { slug: 'kwitansi-pdf' as const, label: '5. Laporan Kwitansi (Word)', sub: `Tanda Terima Uang Harian (${grp.spt_count} lembar)` },
                                                                                        { slug: 'kwitansi-2-pdf' as const, label: '6. Kwitansi 2 (Word)', sub: `Kuitansi Perjalanan Dinas (${grp.spt_count} lembar)` },
                                                                                        { slug: 'sppd-pdf' as const, label: '7. SPPD (Word)', sub: `Surat Perjalanan Dinas / SPD (${grp.spt_count} lembar)` },
                                                                                        { slug: 'rekap-pdf' as const, label: '8. Rekap (Word)', sub: 'Rekapitulasi Perjalanan Dinas Batch' },
                                                                                        { slug: 'lhpd-pdf' as const, label: '9. LHPD (Word)', sub: `Laporan Hasil Perjalanan Dinas (${grp.spt_count} lembar)` },
                                                                                    ].map((docItem) => (
                                                                                        <DropdownMenuItem
                                                                                            key={docItem.slug}
                                                                                            onClick={() =>
                                                                                                handleDownloadBatchWord(
                                                                                                    grp.batch_code,
                                                                                                    docItem.slug
                                                                                                )
                                                                                            }
                                                                                            className="flex items-start gap-2.5 rounded-lg px-2.5 py-1.5 cursor-pointer"
                                                                                        >
                                                                                            <FileText className="mt-0.5 size-3.5 shrink-0 text-blue-700" />
                                                                                            <div>
                                                                                                <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                                                    {docItem.label}
                                                                                                </div>
                                                                                                <div className="text-[10px] text-neutral-500">
                                                                                                    {docItem.sub}
                                                                                                </div>
                                                                                            </div>
                                                                                        </DropdownMenuItem>
                                                                                    ))}
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>

                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={(e) =>
                                                                                    handleAppendDateToExistingBatch(
                                                                                        grp,
                                                                                        e
                                                                                    )
                                                                                }
                                                                                className="h-8 gap-1 px-2.5 text-xs font-bold border-amber-300 text-amber-800 hover:bg-amber-50"
                                                                                title="Tambah data SPPD tanggal baru ke dalam Batch ini"
                                                                            >
                                                                                <CalendarPlus className="size-3.5" />
                                                                                <span>+ SPPD</span>
                                                                            </Button>

                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={(e) =>
                                                                                    handleDeleteBatch(
                                                                                        grp,
                                                                                        e
                                                                                    )
                                                                                }
                                                                                className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50"
                                                                                title="Hapus seluruh Batch ini"
                                                                            >
                                                                                <Trash2 className="size-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    </td>
                                                                </tr>

                                                                {/* BARIS ACCORDION RINCIAN DATA SPPD DI DALAM BATCH (MUNCUL SAAT DIKLIK) */}
                                                                {isExpanded && (
                                                                    <tr className="bg-neutral-50/90 dark:bg-neutral-900/60">
                                                                        <td
                                                                            colSpan={
                                                                                7
                                                                            }
                                                                            className="p-4 border-b-2 border-teal-200 dark:border-teal-900"
                                                                        >
                                                                            <div className="rounded-xl border border-teal-200 bg-white p-3.5 shadow-2xs dark:border-teal-900 dark:bg-neutral-950">
                                                                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-2.5 dark:border-neutral-800">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Badge className="bg-[#006565] text-white">
                                                                                            Rincian{' '}
                                                                                            {
                                                                                                grp.spt_count
                                                                                            }{' '}
                                                                                            Data SPPD
                                                                                        </Badge>
                                                                                        <span className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200">
                                                                                            Daftar Keberangkatan SPPD dalam Batch{' '}
                                                                                            <span className="font-mono text-[#006565]">
                                                                                                {
                                                                                                    grp.batch_code
                                                                                                }
                                                                                            </span>
                                                                                        </span>
                                                                                    </div>

                                                                                    <div className="flex items-center gap-2">
                                                                                        <DropdownMenu>
                                                                                            <DropdownMenuTrigger asChild>
                                                                                                <Button
                                                                                                    size="sm"
                                                                                                    variant="outline"
                                                                                                    className="h-7 gap-1.5 text-[11px] font-bold border-teal-300 text-[#006565] hover:bg-teal-50"
                                                                                                >
                                                                                                    <Download className="size-3" />
                                                                                                    <span>Pilih Download PDF</span>
                                                                                                    <ChevronDown className="size-3" />
                                                                                                </Button>
                                                                                            </DropdownMenuTrigger>
                                                                                            <DropdownMenuContent
                                                                                                align="end"
                                                                                                collisionPadding={12}
                                                                                                className="max-h-[min(70vh,var(--radix-dropdown-menu-content-available-height))] w-56 overflow-y-auto rounded-xl p-1"
                                                                                            >
                                                                                                <DropdownMenuItem
                                                                                                    onClick={() =>
                                                                                                        handleDownloadBatchPdf(
                                                                                                            grp.batch_code
                                                                                                        )
                                                                                                    }
                                                                                                    className="gap-2 text-xs font-semibold cursor-pointer"
                                                                                                >
                                                                                                    <FileText className="size-3.5 text-[#006565]" />
                                                                                                    <span>1. Cetak SPT ({grp.spt_count} Lembar PDF)</span>
                                                                                                </DropdownMenuItem>
                                                                                                <DropdownMenuItem
                                                                                                    onClick={() =>
                                                                                                        handleDownloadBatchSptParafPdf(
                                                                                                            grp.batch_code
                                                                                                        )
                                                                                                    }
                                                                                                    className="gap-2 text-xs font-semibold cursor-pointer"
                                                                                                >
                                                                                                    <FileText className="size-3.5 text-sky-600" />
                                                                                                    <span>1b. SPT Blok Paraf ({grp.spt_count} Lembar PDF)</span>
                                                                                                </DropdownMenuItem>
                                                                                                <DropdownMenuItem
                                                                                                    onClick={() =>
                                                                                                        handleDownloadBatchSptjbPdf(
                                                                                                            grp.batch_code
                                                                                                        )
                                                                                                    }
                                                                                                    className="gap-2 text-xs font-semibold cursor-pointer"
                                                                                                >
                                                                                                    <FileCheck2 className="size-3.5 text-indigo-600" />
                                                                                                    <span>2. Laporan SPTJB (PDF)</span>
                                                                                                </DropdownMenuItem>
                                                                                                <DropdownMenuItem
                                                                                                    onClick={() =>
                                                                                                        handleDownloadBatchC2Pdf(
                                                                                                            grp.batch_code
                                                                                                        )
                                                                                                    }
                                                                                                    className="gap-2 text-xs font-semibold cursor-pointer"
                                                                                                >
                                                                                                    <FileSpreadsheet className="size-3.5 text-emerald-600" />
                                                                                                    <span>3. Laporan C2 (PDF)</span>
                                                                                                </DropdownMenuItem>
                                                                                                <DropdownMenuItem
                                                                                                    onClick={() =>
                                                                                                        handleDownloadBatchRincianPdf(
                                                                                                            grp.batch_code
                                                                                                        )
                                                                                                    }
                                                                                                    className="gap-2 text-xs font-semibold cursor-pointer"
                                                                                                >
                                                                                                    <FileText className="size-3.5 text-amber-600" />
                                                                                                    <span>4. Laporan Rincian (PDF)</span>
                                                                                                </DropdownMenuItem>
                                                                                                <DropdownMenuItem
                                                                                                    onClick={() =>
                                                                                                        handleDownloadBatchKwitansiPdf(
                                                                                                            grp.batch_code
                                                                                                        )
                                                                                                    }
                                                                                                    className="gap-2 text-xs font-semibold cursor-pointer"
                                                                                                >
                                                                                                    <FileCheck2 className="size-3.5 text-purple-600" />
                                                                                                    <span>5. Laporan Kwitansi (PDF)</span>
                                                                                                </DropdownMenuItem>
                                                                                                <DropdownMenuItem
                                                                                                    onClick={() =>
                                                                                                        handleDownloadBatchKwitansi2Pdf(
                                                                                                            grp.batch_code
                                                                                                        )
                                                                                                    }
                                                                                                    className="gap-2 text-xs font-semibold cursor-pointer"
                                                                                                >
                                                                                                    <FileCheck2 className="size-3.5 text-rose-600" />
                                                                                                    <span>6. Kwitansi 2 (PDF)</span>
                                                                                                </DropdownMenuItem>
                                                                                                <DropdownMenuItem
                                                                                                    onClick={() =>
                                                                                                        handleDownloadBatchSppdPdf(
                                                                                                            grp.batch_code
                                                                                                        )
                                                                                                    }
                                                                                                    className="gap-2 text-xs font-semibold cursor-pointer"
                                                                                                >
                                                                                                    <FileText className="size-3.5 text-sky-600" />
                                                                                                    <span>7. SPPD (PDF)</span>
                                                                                                </DropdownMenuItem>
                                                                                                <DropdownMenuItem
                                                                                                    onClick={() =>
                                                                                                        handleDownloadBatchRekapPdf(
                                                                                                            grp.batch_code
                                                                                                        )
                                                                                                    }
                                                                                                    className="gap-2 text-xs font-semibold cursor-pointer"
                                                                                                >
                                                                                                    <FileSpreadsheet className="size-3.5 text-teal-600" />
                                                                                                    <span>8. Rekap (PDF)</span>
                                                                                                </DropdownMenuItem>
                                                                                                <DropdownMenuItem
                                                                                                    onClick={() =>
                                                                                                        handleDownloadBatchLhpdPdf(
                                                                                                            grp.batch_code
                                                                                                        )
                                                                                                    }
                                                                                                    className="gap-2 text-xs font-semibold cursor-pointer"
                                                                                                >
                                                                                                    <FileText className="size-3.5 text-orange-600" />
                                                                                                    <span>9. LHPD (PDF)</span>
                                                                                                </DropdownMenuItem>
                                                                                            </DropdownMenuContent>
                                                                                        </DropdownMenu>

                                                                                        <DropdownMenu>
                                                                                            <DropdownMenuTrigger asChild>
                                                                                                <Button
                                                                                                    size="sm"
                                                                                                    variant="outline"
                                                                                                    className="h-7 gap-1.5 text-[11px] font-bold border-blue-300 text-blue-700 hover:bg-blue-50"
                                                                                                >
                                                                                                    <FileText className="size-3" />
                                                                                                    <span>Download Word</span>
                                                                                                    <ChevronDown className="size-3" />
                                                                                                </Button>
                                                                                            </DropdownMenuTrigger>
                                                                                            <DropdownMenuContent
                                                                                                align="end"
                                                                                                collisionPadding={12}
                                                                                                className="max-h-[min(70vh,var(--radix-dropdown-menu-content-available-height))] w-56 overflow-y-auto rounded-xl p-1"
                                                                                            >
                                                                                                {[
                                                                                                    { slug: 'pdf' as const, label: '1. SPT (Word)' },
                                                                                                    { slug: 'sptjb-pdf' as const, label: '2. Laporan SPTJB (Word)' },
                                                                                                    { slug: 'c2-pdf' as const, label: '3. Laporan C2 (Word)' },
                                                                                                    { slug: 'rincian-pdf' as const, label: '4. Laporan Rincian (Word)' },
                                                                                                    { slug: 'kwitansi-pdf' as const, label: '5. Laporan Kwitansi (Word)' },
                                                                                                    { slug: 'kwitansi-2-pdf' as const, label: '6. Kwitansi 2 (Word)' },
                                                                                                    { slug: 'sppd-pdf' as const, label: '7. SPPD (Word)' },
                                                                                                    { slug: 'rekap-pdf' as const, label: '8. Rekap (Word)' },
                                                                                                    { slug: 'lhpd-pdf' as const, label: '9. LHPD (Word)' },
                                                                                                ].map((docItem) => (
                                                                                                    <DropdownMenuItem
                                                                                                        key={docItem.slug}
                                                                                                        onClick={() =>
                                                                                                            handleDownloadBatchWord(
                                                                                                                grp.batch_code,
                                                                                                                docItem.slug
                                                                                                            )
                                                                                                        }
                                                                                                        className="gap-2 text-xs font-semibold cursor-pointer"
                                                                                                    >
                                                                                                        <FileText className="size-3.5 text-blue-700" />
                                                                                                        <span>{docItem.label}</span>
                                                                                                    </DropdownMenuItem>
                                                                                                ))}
                                                                                            </DropdownMenuContent>
                                                                                        </DropdownMenu>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="overflow-x-auto">
                                                                                    <table className="w-full border-collapse text-left text-xs">
                                                                                        <thead>
                                                                                            <tr className="border-b border-neutral-200 bg-neutral-100/80 text-[10px] font-extrabold text-neutral-600 uppercase dark:border-neutral-800 dark:bg-neutral-900">
                                                                                                <th className="px-3 py-2 w-24">
                                                                                                    Urutan SPPD
                                                                                                </th>
                                                                                                <th className="px-3 py-2">
                                                                                                    Hari &amp; Tanggal Berangkat
                                                                                                </th>
                                                                                                <th className="px-3 py-2">
                                                                                                    Tanggal &amp; Nomor SPT
                                                                                                </th>
                                                                                                <th className="px-3 py-2">
                                                                                                    Tempat Tujuan &amp; Kecamatan
                                                                                                </th>
                                                                                                <th className="px-3 py-2">
                                                                                                    Pegawai &amp; Rincian Uang Saku
                                                                                                </th>
                                                                                                <th className="px-3 py-2 text-right">
                                                                                                    Subtotal
                                                                                                </th>
                                                                                                <th className="px-3 py-2 text-right w-20">
                                                                                                    Aksi
                                                                                                </th>
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                                                            {grp.items.map(
                                                                                                (
                                                                                                    item,
                                                                                                    itemIdx
                                                                                                ) => (
                                                                                                    <tr
                                                                                                        key={
                                                                                                            item.id
                                                                                                        }
                                                                                                        className="hover:bg-teal-50/30"
                                                                                                    >
                                                                                                        <td className="px-3 py-2.5 font-extrabold text-[#006565]">
                                                                                                            SPPD #
                                                                                                            {itemIdx +
                                                                                                                1}
                                                                                                        </td>
                                                                                                        <td className="px-3 py-2.5 font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                                                                                                            {
                                                                                                                item.tanggal_berangkat_formatted
                                                                                                            }
                                                                                                        </td>
                                                                                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                                                                                            <div className="font-semibold text-neutral-700 dark:text-neutral-300">
                                                                                                                {
                                                                                                                    item.tanggal_spt_formatted
                                                                                                                }
                                                                                                            </div>
                                                                                                            <div className="font-mono text-[10px] text-neutral-400">
                                                                                                                {
                                                                                                                    item.nomor_spt
                                                                                                                }
                                                                                                            </div>
                                                                                                        </td>
                                                                                                        <td className="px-3 py-2.5">
                                                                                                            <div className="font-bold text-neutral-800 dark:text-neutral-200">
                                                                                                                {item.tujuan}
                                                                                                            </div>
                                                                                                            <div className="text-[11px] text-neutral-500">
                                                                                                                {item.nama_desa && (
                                                                                                                    <>
                                                                                                                        <strong>{item.nama_desa}</strong>,{' '}
                                                                                                                    </>
                                                                                                                )}
                                                                                                                Kecamatan{' '}
                                                                                                                <strong>{item.nama_kecamatan}</strong>{' '}
                                                                                                                ({item.zona})
                                                                                                            </div>
                                                                                                        </td>
                                                                                                        <td className="px-3 py-2.5">
                                                                                                            <div className="space-y-1">
                                                                                                                {item.participants.map(
                                                                                                                    (
                                                                                                                        pt
                                                                                                                    ) => (
                                                                                                                        <div
                                                                                                                            key={
                                                                                                                                pt.id
                                                                                                                            }
                                                                                                                            className="flex items-center justify-between gap-3 rounded bg-neutral-50 px-2 py-0.5 text-[11px] dark:bg-neutral-900"
                                                                                                                        >
                                                                                                                            <span>
                                                                                                                                {
                                                                                                                                    pt.urutan
                                                                                                                                }

                                                                                                                                .{' '}
                                                                                                                                <strong>
                                                                                                                                    {
                                                                                                                                        pt.nama
                                                                                                                                    }
                                                                                                                                </strong>{' '}
                                                                                                                                (
                                                                                                                                {
                                                                                                                                    pt.golongan
                                                                                                                                }

                                                                                                                                )
                                                                                                                            </span>
                                                                                                                            <span className="font-mono font-bold text-emerald-700">
                                                                                                                                {formatRupiah(
                                                                                                                                    pt.uang_saku
                                                                                                                                )}
                                                                                                                            </span>
                                                                                                                        </div>
                                                                                                                    )
                                                                                                                )}
                                                                                                            </div>
                                                                                                        </td>
                                                                                                        <td className="px-3 py-2.5 text-right font-mono font-extrabold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                                                                                                            {formatRupiah(
                                                                                                                item.total_uang_saku
                                                                                                            )}
                                                                                                        </td>
                                                                                                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                                                                                            <div className="inline-flex items-center gap-1">
                                                                                                                <Button
                                                                                                                    size="sm"
                                                                                                                    variant="outline"
                                                                                                                    onClick={() =>
                                                                                                                        handleOpenLhpdModal(
                                                                                                                            item,
                                                                                                                            grp.batch_code
                                                                                                                        )
                                                                                                                    }
                                                                                                                    className={
                                                                                                                        item.has_lhpd
                                                                                                                            ? 'h-7 gap-1 border-emerald-300 bg-emerald-50 px-2 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100'
                                                                                                                            : 'h-7 gap-1 border-amber-300 bg-amber-50/70 px-2 text-[11px] font-bold text-amber-800 hover:bg-amber-100'
                                                                                                                    }
                                                                                                                    title="Isi / Edit Laporan Hasil Perjalanan Dinas (LHPD)"
                                                                                                                >
                                                                                                                    <FileText className="size-3" />
                                                                                                                    <span>
                                                                                                                        {item.has_lhpd
                                                                                                                            ? 'LHPD ✓'
                                                                                                                            : 'Isi LHPD'}
                                                                                                                    </span>
                                                                                                                </Button>
                                                                                                                <Button
                                                                                                                    size="sm"
                                                                                                                    variant="outline"
                                                                                                                    onClick={() =>
                                                                                                                        handleOpenEditSppd(
                                                                                                                            item,
                                                                                                                            grp.batch_code
                                                                                                                        )
                                                                                                                    }
                                                                                                                    className="h-7 px-2 text-[11px] text-[#006565] hover:bg-teal-50"
                                                                                                                    title="Edit data SPPD ini"
                                                                                                                >
                                                                                                                    <Edit3 className="size-3" />
                                                                                                                </Button>
                                                                                                                <Button
                                                                                                                    size="sm"
                                                                                                                    variant="outline"
                                                                                                                    onClick={() => {
                                                                                                                        if (
                                                                                                                            window.confirm(
                                                                                                                                `Hapus SPPD #${itemIdx + 1} (${item.tanggal_berangkat_formatted}) dari Batch ini?`
                                                                                                                            )
                                                                                                                        ) {
                                                                                                                            router.delete(
                                                                                                                                `/sppd-dalam-kota/sppd/${item.id}`,
                                                                                                                                {
                                                                                                                                    preserveScroll:
                                                                                                                                        true,
                                                                                                                                }
                                                                                                                            );
                                                                                                                        }
                                                                                                                    }}
                                                                                                                    className="h-7 px-2 text-[11px] text-rose-600 hover:bg-rose-50"
                                                                                                                    title="Hapus SPPD tanggal ini dari Batch"
                                                                                                                >
                                                                                                                    <Trash2 className="size-3" />
                                                                                                                </Button>
                                                                                                            </div>
                                                                                                        </td>
                                                                                                    </tr>
                                                                                                )
                                                                                            )}
                                                                                        </tbody>
                                                                                    </table>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    }
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <TablePagination
                                    totalItems={filteredSppdBatches.length}
                                    currentPage={safeSppdBatchPage}
                                    perPage={sppdBatchPerPage}
                                    onPageChange={setSppdBatchPage}
                                    onPerPageChange={setSppdBatchPerPage}
                                    itemLabel="Batch"
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB: MASTER DATA SUB KEGIATAN                             */}
                {/* ========================================================= */}
                {activeTab === 'sub_kegiatan' && (
                    <Card className="border-sidebar-border/70 shadow-xs">
                        <CardHeader className="border-b border-neutral-100 pb-4 dark:border-neutral-800">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-base font-extrabold">
                                        Master Data Sub Kegiatan ({filteredSubKegiatans.length})
                                    </CardTitle>
                                    <p className="text-xs text-neutral-500">
                                        Pengelolaan No. Rekening, Nama Kegiatan, Sub Kegiatan, dan Kode Sub Kegiatan untuk pembebanan SPPD &amp; SPTJB.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative w-64">
                                        <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-neutral-400" />
                                        <Input
                                            placeholder="Cari sub kegiatan, kode, rekening..."
                                            value={subKegiatanSearch}
                                            onChange={(e) =>
                                                setSubKegiatanSearch(e.target.value)
                                            }
                                            className="h-9 pl-9 text-xs"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setRkaImportModalOpen(true)}
                                        className="gap-1.5 border-teal-300 bg-teal-50/70 text-xs font-bold text-[#006565] hover:bg-teal-100"
                                    >
                                        <FileUp className="size-4" />
                                        Impor PDF RKA SIPD-RI
                                    </Button>
                                    <Button
                                        onClick={handleOpenCreateSubKegiatan}
                                        className="gap-1.5 bg-[#006565] text-xs text-white hover:bg-[#005252]"
                                    >
                                        <Plus className="size-4" />
                                        Tambah Sub Kegiatan
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[11px] font-bold tracking-wider text-neutral-500 uppercase dark:border-neutral-800 dark:bg-neutral-900/50">
                                            <th className="px-4 py-3 text-center w-12">No</th>
                                            <th className="px-4 py-3">Kode Sub Kegiatan</th>
                                            <th className="px-4 py-3">No. Rekening</th>
                                            <th className="px-4 py-3">Nama Kegiatan</th>
                                            <th className="px-4 py-3">Sub Kegiatan</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                            <th className="px-4 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {filteredSubKegiatans.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="px-4 py-8 text-center text-neutral-400"
                                                >
                                                    Belum ada data Master Sub Kegiatan.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredSubKegiatans.map((sk, idx) => (
                                                <tr
                                                    key={sk.id}
                                                    className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40"
                                                >
                                                    <td className="px-4 py-3 text-center font-semibold text-neutral-400">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono font-extrabold text-[#006565] dark:text-teal-300">
                                                        {sk.kode_sub_kegiatan}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                                                        {sk.no_rekening}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                                                        {sk.nama_kegiatan}
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-neutral-900 dark:text-neutral-100">
                                                        {sk.sub_kegiatan}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {sk.is_active ? (
                                                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                                                Aktif
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline">
                                                                Non-aktif
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="inline-flex items-center gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    handleOpenEditSubKegiatan(
                                                                        sk
                                                                    )
                                                                }
                                                                className="h-7 px-2 text-xs"
                                                            >
                                                                <Edit3 className="size-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    if (
                                                                        window.confirm(
                                                                            `Hapus sub kegiatan ${sk.sub_kegiatan}?`
                                                                        )
                                                                    ) {
                                                                        router.delete(
                                                                            `/sppd-dalam-kota/sub-kegiatan/${sk.id}`,
                                                                            {
                                                                                preserveScroll:
                                                                                    true,
                                                                            }
                                                                        );
                                                                    }
                                                                }}
                                                                className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ========================================================= */}
                {/* TAB: MASTER DATA NOMOR DPA                                */}
                {/* ========================================================= */}
                {activeTab === 'dpa' && (
                    <Card className="border-sidebar-border/70 shadow-xs">
                        <CardHeader className="border-b border-neutral-100 pb-4 dark:border-neutral-800">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-base font-extrabold">
                                        Master Data Nomor DPA ({dpas.length})
                                    </CardTitle>
                                    <p className="text-xs text-neutral-500">
                                        Pengelolaan Nomor Dokumen Pelaksanaan Anggaran (DPA / DPPA) Tahun Anggaran berjalan.
                                    </p>
                                </div>

                                <Button
                                    onClick={handleOpenCreateDpa}
                                    className="gap-1.5 bg-[#006565] text-xs text-white hover:bg-[#005252]"
                                >
                                    <Plus className="size-4" />
                                    Tambah Nomor DPA
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[11px] font-bold tracking-wider text-neutral-500 uppercase dark:border-neutral-800 dark:bg-neutral-900/50">
                                            <th className="px-4 py-3 text-center w-12">No</th>
                                            <th className="px-4 py-3">Nomor DPA</th>
                                            <th className="px-4 py-3">Tanggal DPA</th>
                                            <th className="px-4 py-3 text-center">Tahun Anggaran</th>
                                            <th className="px-4 py-3">Keterangan</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                            <th className="px-4 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {dpas.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="px-4 py-8 text-center text-neutral-400"
                                                >
                                                    Belum ada data Master Nomor DPA.
                                                </td>
                                            </tr>
                                        ) : (
                                            dpas.map((d, idx) => (
                                                <tr
                                                    key={d.id}
                                                    className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40"
                                                >
                                                    <td className="px-4 py-3 text-center font-semibold text-neutral-400">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono font-extrabold text-[#006565] dark:text-teal-300">
                                                        {d.nomor_dpa}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-600">
                                                        {d.tanggal_dpa_formatted}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold">
                                                        {d.tahun_anggaran}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                                                        {d.keterangan || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {d.is_active ? (
                                                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                                                Aktif
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline">
                                                                Non-aktif
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="inline-flex items-center gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    handleOpenEditDpa(d)
                                                                }
                                                                className="h-7 px-2 text-xs"
                                                            >
                                                                <Edit3 className="size-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    if (
                                                                        window.confirm(
                                                                            `Hapus Nomor DPA ${d.nomor_dpa}?`
                                                                        )
                                                                    ) {
                                                                        router.delete(
                                                                            `/sppd-dalam-kota/dpa/${d.id}`,
                                                                            {
                                                                                preserveScroll:
                                                                                    true,
                                                                            }
                                                                        );
                                                                    }
                                                                }}
                                                                className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ========================================================= */}
                {/* TAB: MASTER DATA PEGAWAI (TANGGAL LAHIR OTOMATIS NIP)     */}
                {/* ========================================================= */}
                {activeTab === 'pegawai' && (
                    <Card className="border-sidebar-border/70 shadow-xs">
                        <CardHeader className="border-b border-neutral-100 pb-4 dark:border-neutral-800">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-base font-extrabold">
                                        Master Data Pegawai ({filteredPegawais.length})
                                    </CardTitle>
                                    <p className="text-xs text-neutral-500">
                                        Nama, NIP, Pangkat, Golongan, Jabatan, dan Tanggal Lahir yang terisi otomatis dari 8 digit pertama NIP.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative w-64">
                                        <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-neutral-400" />
                                        <Input
                                            placeholder="Cari nama, NIP, jabatan..."
                                            value={pegawaiSearch}
                                            onChange={(e) =>
                                                setPegawaiSearch(e.target.value)
                                            }
                                            className="h-9 pl-9 text-xs"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleOpenCreatePegawai}
                                        className="gap-1.5 bg-[#006565] text-xs text-white hover:bg-[#005252]"
                                    >
                                        <Plus className="size-4" />
                                        Tambah Master Pegawai
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[11px] font-bold tracking-wider text-neutral-500 uppercase dark:border-neutral-800 dark:bg-neutral-900/50">
                                            <th className="px-4 py-3 text-center w-12">No</th>
                                            <th className="px-4 py-3">Nama Pegawai</th>
                                            <th className="px-4 py-3">NIP</th>
                                            <th className="px-4 py-3">Pangkat &amp; Golongan</th>
                                            <th className="px-4 py-3">Jabatan</th>
                                            <th className="px-4 py-3">
                                                Tanggal Lahir (Otomatis NIP)
                                            </th>
                                            <th className="px-4 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {filteredPegawais.map((p, idx) => (
                                            <tr
                                                key={p.id}
                                                className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40"
                                            >
                                                <td className="px-4 py-3 text-center font-semibold text-neutral-400">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-4 py-3 font-bold text-neutral-900 dark:text-neutral-100">
                                                    {p.nama}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400">
                                                    {p.nip || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-semibold">
                                                        {p.pangkat || '-'}
                                                    </span>{' '}
                                                    <Badge
                                                        variant="outline"
                                                        className="ml-1 border-teal-300 bg-teal-50 text-teal-800 font-bold"
                                                    >
                                                        {p.golongan}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                                                    {p.jabatan}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                                                        <Calendar className="size-3" />
                                                        {p.tanggal_lahir_formatted}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="inline-flex items-center gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleOpenEditPegawai(p)
                                                            }
                                                            className="h-7 px-2 text-xs"
                                                        >
                                                            <Edit3 className="size-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                if (
                                                                    window.confirm(
                                                                        `Hapus pegawai ${p.nama}?`
                                                                    )
                                                                ) {
                                                                    router.delete(
                                                                        `/sppd-dalam-kota/pegawai/${p.id}`,
                                                                        {
                                                                            preserveScroll: true,
                                                                        }
                                                                    );
                                                                }
                                                            }}
                                                            className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ========================================================= */}
                {/* TAB: MASTER DATA KEPALA DINAS                             */}
                {/* ========================================================= */}
                {activeTab === 'kepala_dinas' &&
                    renderPejabatSection(
                        'kepala_dinas',
                        'Master Data Kepala Dinas',
                        'Pejabat penandatangan Surat Tugas (SPT) dan Pengguna Anggaran pada SPTJB.',
                        kepalaDinasList
                    )}

                {/* ========================================================= */}
                {/* TAB: MASTER DATA PPTK                                     */}
                {/* ========================================================= */}
                {activeTab === 'pptk' &&
                    renderPejabatSection(
                        'pptk',
                        'Master Data PPTK',
                        'Pejabat Pelaksana Teknis Kegiatan (PPTK) penanggung jawab kegiatan perjalanan dinas.',
                        pptkList
                    )}

                {/* ========================================================= */}
                {/* TAB: MASTER DATA BENDAHARA                                */}
                {/* ========================================================= */}
                {activeTab === 'bendahara' &&
                    renderPejabatSection(
                        'bendahara',
                        'Master Data Bendahara',
                        'Bendahara Pengeluaran penandatangan pencairan uang saku perjalanan dinas.',
                        bendaharaList
                    )}

                {/* ========================================================= */}
                {/* TAB: MASTER DATA ZONASI                                   */}
                {/* ========================================================= */}
                {activeTab === 'zonasi' && (
                    <Card className="border-sidebar-border/70 shadow-xs">
                        <CardHeader className="border-b border-neutral-100 pb-4 dark:border-neutral-800">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <CardTitle className="text-base font-extrabold">
                                        Master Data Zonasi &amp; Tarif Uang Saku ({filteredZonasis.length})
                                    </CardTitle>
                                    <p className="text-xs text-neutral-500">
                                        Pengaturan Nama Kecamatan, Zona Wilayah, Golongan, dan Besaran Uang Saku Harian SPPD Dalam Kota.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative w-56">
                                        <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-neutral-400" />
                                        <Input
                                            placeholder="Cari kecamatan..."
                                            value={zonasiSearch}
                                            onChange={(e) =>
                                                setZonasiSearch(e.target.value)
                                            }
                                            className="h-9 pl-9 text-xs"
                                        />
                                    </div>

                                    <Select
                                        value={zonasiZonaFilter}
                                        onValueChange={setZonasiZonaFilter}
                                    >
                                        <SelectTrigger className="h-9 w-36 text-xs">
                                            <SelectValue placeholder="Semua Zona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Zona</SelectItem>
                                            {ZONA_OPTIONS.map((zn) => (
                                                <SelectItem key={zn} value={zn}>
                                                    {zn}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={zonasiGolFilter}
                                        onValueChange={setZonasiGolFilter}
                                    >
                                        <SelectTrigger className="h-9 w-40 text-xs">
                                            <SelectValue placeholder="Semua Golongan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Semua Golongan
                                            </SelectItem>
                                            {ZONASI_GOLONGAN_OPTIONS.map((g) => (
                                                <SelectItem key={g} value={g}>
                                                    {g}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setRkaImportModalOpen(true)}
                                        className="gap-1.5 border-teal-300 bg-teal-50/70 text-xs font-bold text-[#006565] hover:bg-teal-100"
                                    >
                                        <FileUp className="size-4" />
                                        Impor Tarif dari RKA PDF
                                    </Button>
                                    <Button
                                        onClick={handleOpenCreateZonasi}
                                        className="gap-1.5 bg-[#006565] text-xs text-white hover:bg-[#005252]"
                                    >
                                        <Plus className="size-4" />
                                        Tambah Tarif Zonasi
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead className="bg-neutral-100 dark:bg-neutral-900">
                                        <tr className="border-b border-neutral-200 text-[11px] font-bold tracking-wider text-neutral-500 uppercase">
                                            <th className="px-4 py-3 text-center w-12">No</th>
                                            <th className="px-4 py-3">Nama Kecamatan</th>
                                            <th className="px-4 py-3">Zona</th>
                                            <th className="px-4 py-3">Golongan</th>
                                            <th className="px-4 py-3 text-right">
                                                Uang Saku (Rp)
                                            </th>
                                            <th className="px-4 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {paginatedZonasis.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-4 py-8 text-center text-neutral-400"
                                                >
                                                    Tidak ada data zonasi yang sesuai filter.
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedZonasis.map((z, idx) => (
                                            <tr
                                                key={z.id}
                                                className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40"
                                            >
                                                <td className="px-4 py-2.5 text-center font-semibold text-neutral-400">
                                                    {zonasiStartIdx + idx + 1}
                                                </td>
                                                <td className="px-4 py-2.5 font-bold text-neutral-900 dark:text-neutral-100">
                                                    Kecamatan {z.nama_kecamatan}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            z.zona === 'Zona I'
                                                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                                                : z.zona === 'Zona II'
                                                                  ? 'border-blue-300 bg-blue-50 text-blue-800'
                                                                  : 'border-amber-300 bg-amber-50 text-amber-800'
                                                        }
                                                    >
                                                        {z.zona}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-2.5 font-semibold">
                                                    {z.golongan}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                                                    {formatRupiah(z.uang_saku)}
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <div className="inline-flex items-center gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleOpenEditZonasi(z)
                                                            }
                                                            className="h-7 px-2 text-xs"
                                                        >
                                                            <Edit3 className="size-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                if (
                                                                    window.confirm(
                                                                        `Hapus tarif zonasi ${z.nama_kecamatan} (${z.golongan})?`
                                                                    )
                                                                ) {
                                                                    router.delete(
                                                                        `/sppd-dalam-kota/zonasi/${z.id}`,
                                                                        {
                                                                            preserveScroll: true,
                                                                        }
                                                                    );
                                                                }
                                                            }}
                                                            className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {filteredZonasis.length > 0 && (
                                <div className="flex flex-col gap-3 border-t border-neutral-200 bg-neutral-50/60 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:bg-neutral-900/40">
                                    <div className="flex flex-wrap items-center gap-3 text-neutral-600 dark:text-neutral-400">
                                        <span>
                                            Menampilkan{' '}
                                            <strong className="text-neutral-900 dark:text-neutral-100">
                                                {zonasiStartIdx + 1}–
                                                {Math.min(
                                                    zonasiStartIdx + zonasiPerPage,
                                                    filteredZonasis.length
                                                )}
                                            </strong>{' '}
                                            dari{' '}
                                            <strong className="text-neutral-900 dark:text-neutral-100">
                                                {filteredZonasis.length}
                                            </strong>{' '}
                                            data zonasi
                                        </span>
                                        <Select
                                            value={String(zonasiPerPage)}
                                            onValueChange={(v) =>
                                                setZonasiPerPage(Number(v))
                                            }
                                        >
                                            <SelectTrigger className="h-7 w-28 bg-white text-xs dark:bg-neutral-900">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="16">
                                                    16 / halaman
                                                </SelectItem>
                                                <SelectItem value="32">
                                                    32 / halaman
                                                </SelectItem>
                                                <SelectItem value="64">
                                                    64 / halaman
                                                </SelectItem>
                                                <SelectItem value="200">
                                                    Semua
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={safeZonasiPage <= 1}
                                            onClick={() =>
                                                setZonasiPage((p) =>
                                                    Math.max(1, p - 1)
                                                )
                                            }
                                            className="h-7 px-2.5 text-xs"
                                        >
                                            Sebelumnya
                                        </Button>

                                        {Array.from(
                                            { length: zonasiTotalPages },
                                            (_, i) => i + 1
                                        ).map((pageNum) => (
                                            <Button
                                                key={pageNum}
                                                type="button"
                                                size="sm"
                                                variant={
                                                    pageNum === safeZonasiPage
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                onClick={() =>
                                                    setZonasiPage(pageNum)
                                                }
                                                className={
                                                    pageNum === safeZonasiPage
                                                        ? 'h-7 w-7 bg-[#006565] p-0 text-xs font-bold text-white hover:bg-[#005252]'
                                                        : 'h-7 w-7 p-0 text-xs'
                                                }
                                            >
                                                {pageNum}
                                            </Button>
                                        ))}

                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={
                                                safeZonasiPage >=
                                                zonasiTotalPages
                                            }
                                            onClick={() =>
                                                setZonasiPage((p) =>
                                                    Math.min(
                                                        zonasiTotalPages,
                                                        p + 1
                                                    )
                                                )
                                            }
                                            className="h-7 px-2.5 text-xs"
                                        >
                                            Berikutnya
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* ========================================================= */}
                {/* DIALOG KONFIRMASI SETELAH SIMPAN: TAMBAH TANGGAL BERBEDA? */}
                {/* ========================================================= */}
                <Dialog
                    open={afterSavePromptOpen}
                    onOpenChange={setAfterSavePromptOpen}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-emerald-700">
                                <CheckCircle2 className="size-5" />
                                SPPD Berhasil Disimpan ke Batch!
                            </DialogTitle>
                            <DialogDescription>
                                Apakah Anda ingin menambah SPPD lagi di{' '}
                                <strong>tanggal yang berbeda</strong> ke dalam{' '}
                                <strong>Batch yang sama</strong>?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="rounded-xl bg-teal-50/70 border border-teal-200 p-3 text-xs text-teal-900">
                            Seluruh SPPD dalam Batch ini akan ditampilkan sebagai <strong>1 baris Batch</strong> pada tabel di bawah (ketika diklik akan muncul daftar SPPD-nya) dan siap diunduh ke dalam PDF <strong>SPT</strong> maupun <strong>SPTJB</strong>.
                        </div>
                        <DialogFooter className="flex-col gap-2 sm:flex-row">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleResetFreshFormAfterSave}
                            >
                                Selesai
                            </Button>
                            <Button
                                type="button"
                                onClick={handleContinueDifferentDateAfterSave}
                                className="gap-1.5 bg-[#006565] text-white hover:bg-[#005252]"
                            >
                                <CalendarPlus className="size-4" />
                                Ya, Tambah Tanggal ke Batch Ini
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ========================================================= */}
                {/* DIALOG: CREATE / EDIT MASTER SUB KEGIATAN                 */}
                {/* ========================================================= */}
                <Dialog
                    open={subKegiatanModalOpen}
                    onOpenChange={setSubKegiatanModalOpen}
                >
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {editingSubKegiatan
                                    ? 'Edit Master Sub Kegiatan'
                                    : 'Tambah Master Sub Kegiatan'}
                            </DialogTitle>
                            <DialogDescription>
                                Masukkan No. Rekening, Nama Kegiatan, Sub Kegiatan, dan Kode Sub Kegiatan.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSaveSubKegiatan} className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label>Kode Sub Kegiatan *</Label>
                                    <Input
                                        value={skKodeSubKegiatan}
                                        onChange={(e) =>
                                            setSkKodeSubKegiatan(e.target.value)
                                        }
                                        placeholder="Contoh: 2.09.03.2.01.0014"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Nomor Rekening *</Label>
                                    <Input
                                        value={skNoRekening}
                                        onChange={(e) =>
                                            setSkNoRekening(e.target.value)
                                        }
                                        placeholder="Contoh: 5.1.02.04.01.0003"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Nama Kegiatan *</Label>
                                    <Input
                                        value={skNamaKegiatan}
                                        onChange={(e) =>
                                            setSkNamaKegiatan(e.target.value)
                                        }
                                        placeholder="Contoh: Penyediaan dan Penyaluran Pangan Pokok atau Pangan Lainnya..."
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Nama Sub Kegiatan *</Label>
                                    <Input
                                        value={skSubKegiatan}
                                        onChange={(e) =>
                                            setSkSubKegiatan(e.target.value)
                                        }
                                        placeholder="Contoh: Koordinasi dan Sinkronisasi Pemantauan Stok, Pasokan dan Harga Pangan Pokok Strategis"
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1 sm:col-span-2">
                                    <Checkbox
                                        id="sk-active"
                                        checked={skIsActive}
                                        onCheckedChange={(v) =>
                                            setSkIsActive(Boolean(v))
                                        }
                                    />
                                    <Label htmlFor="sk-active" className="text-xs">
                                        Sub Kegiatan berstatus Aktif
                                    </Label>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSubKegiatanModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSavingSubKegiatan}
                                    className="bg-[#006565] text-white hover:bg-[#005252]"
                                >
                                    {isSavingSubKegiatan
                                        ? 'Menyimpan...'
                                        : 'Simpan Sub Kegiatan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ========================================================= */}
                {/* DIALOG: CREATE / EDIT MASTER NOMOR DPA                    */}
                {/* ========================================================= */}
                <Dialog open={dpaModalOpen} onOpenChange={setDpaModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {editingDpa
                                    ? 'Edit Master Nomor DPA'
                                    : 'Tambah Master Nomor DPA'}
                            </DialogTitle>
                            <DialogDescription>
                                Masukkan Nomor DPA/DPPA beserta Tanggal DPA dan Tahun Anggaran.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSaveDpa} className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Nomor DPA / DPPA *</Label>
                                    <Input
                                        value={dNomorDpa}
                                        onChange={(e) =>
                                            setDNomorDpa(e.target.value)
                                        }
                                        placeholder="DPA/A.1/2.09.3.27.0.00.10.0000/001/2026"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Tanggal DPA</Label>
                                    <Input
                                        type="date"
                                        value={dTanggalDpa}
                                        onChange={(e) =>
                                            setDTanggalDpa(e.target.value)
                                        }
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Tahun Anggaran *</Label>
                                    <Input
                                        type="number"
                                        min={2020}
                                        max={2099}
                                        value={dTahunAnggaran}
                                        onChange={(e) =>
                                            setDTahunAnggaran(e.target.value)
                                        }
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Keterangan</Label>
                                    <Input
                                        value={dKeterangan}
                                        onChange={(e) =>
                                            setDKeterangan(e.target.value)
                                        }
                                        placeholder="DPA Induk DKPP Kabupaten Indramayu"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1 sm:col-span-2">
                                    <Checkbox
                                        id="dpa-active"
                                        checked={dIsActive}
                                        onCheckedChange={(v) =>
                                            setDIsActive(Boolean(v))
                                        }
                                    />
                                    <Label htmlFor="dpa-active" className="text-xs">
                                        Nomor DPA berstatus Aktif
                                    </Label>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDpaModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSavingDpa}
                                    className="bg-[#006565] text-white hover:bg-[#005252]"
                                >
                                    {isSavingDpa
                                        ? 'Menyimpan...'
                                        : 'Simpan Nomor DPA'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ========================================================= */}
                {/* DIALOG: CREATE / EDIT MASTER PEGAWAI                      */}
                {/* ========================================================= */}
                <Dialog open={pegawaiModalOpen} onOpenChange={setPegawaiModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {editingPegawai
                                    ? 'Edit Master Data Pegawai'
                                    : 'Tambah Master Data Pegawai'}
                            </DialogTitle>
                            <DialogDescription>
                                Masukkan NIP 18 digit maka <strong>Tanggal Lahir</strong> akan terisi secara otomatis dari 8 digit awal NIP.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSavePegawai} className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Nama Lengkap &amp; Gelar *</Label>
                                    <Input
                                        value={pNama}
                                        onChange={(e) => setPNama(e.target.value)}
                                        placeholder="Contoh: DEDEH SUMIATI, S.IP"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>NIP (18 Digit)</Label>
                                    <Input
                                        value={pNip}
                                        onChange={(e) =>
                                            handleNipChangeWithAutoBirthDate(
                                                e.target.value
                                            )
                                        }
                                        placeholder="197009192007012009"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="flex items-center justify-between">
                                        <span>Tanggal Lahir (Otomatis NIP)</span>
                                        <span className="text-[10px] font-bold text-emerald-700">
                                            Auto
                                        </span>
                                    </Label>
                                    <Input
                                        type="date"
                                        value={pTanggalLahir}
                                        onChange={(e) =>
                                            setPTanggalLahir(e.target.value)
                                        }
                                        className="bg-emerald-50/50 border-emerald-300 font-bold"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Golongan *</Label>
                                    <Select
                                        value={pGolongan}
                                        onValueChange={
                                            handleGolonganChangeWithAutoPangkat
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {GOLONGAN_OPTIONS.map((g) => (
                                                <SelectItem
                                                    key={g.golongan}
                                                    value={g.golongan}
                                                >
                                                    {g.golongan} - {g.pangkat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Pangkat *</Label>
                                    <Input
                                        value={pPangkat}
                                        onChange={(e) => setPPangkat(e.target.value)}
                                        placeholder="Penata Tk. I"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Jabatan *</Label>
                                    <Input
                                        value={pJabatan}
                                        onChange={(e) => setPJabatan(e.target.value)}
                                        placeholder="Analis Ketahanan Pangan Ahli Muda pada DKPP Kab. Indramayu"
                                        required
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPegawaiModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSavingPegawai}
                                    className="bg-[#006565] text-white hover:bg-[#005252]"
                                >
                                    {isSavingPegawai ? 'Menyimpan...' : 'Simpan Pegawai'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ========================================================= */}
                {/* DIALOG: CREATE / EDIT MASTER PEJABAT                      */}
                {/* ========================================================= */}
                <Dialog open={pejabatModalOpen} onOpenChange={setPejabatModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {editingPejabat ? 'Edit' : 'Tambah'} Master{' '}
                                {pjTipe === 'kepala_dinas'
                                    ? 'Kepala Dinas'
                                    : pjTipe === 'pptk'
                                      ? 'PPTK'
                                      : 'Bendahara'}
                            </DialogTitle>
                            <DialogDescription>
                                Anda dapat mengambil data otomatis dari Master Pegawai atau mengetik secara manual.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSavePejabat} className="space-y-4">
                            {!editingPejabat && pegawais.length > 0 && (
                                <div className="space-y-1.5 rounded-xl bg-teal-50/60 border border-teal-200 p-3">
                                    <Label className="text-xs font-bold text-[#006565]">
                                        Ambil Cepat dari Master Pegawai (Opsional):
                                    </Label>
                                    <Select
                                        onValueChange={handleFillPejabatFromPegawai}
                                    >
                                        <SelectTrigger className="h-8 bg-white text-xs">
                                            <SelectValue placeholder="-- Pilih pegawai untuk mengisi otomatis --" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pegawais.map((p) => (
                                                <SelectItem
                                                    key={p.id}
                                                    value={String(p.id)}
                                                >
                                                    {p.nama} ({p.golongan})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Nama Lengkap *</Label>
                                    <Input
                                        value={pjNama}
                                        onChange={(e) => setPjNama(e.target.value)}
                                        placeholder="RORY FIRMANSYAH.S.STP.M.Si"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>NIP</Label>
                                    <Input
                                        value={pjNip}
                                        onChange={(e) => setPjNip(e.target.value)}
                                        placeholder="197801011997031003"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Golongan</Label>
                                    <Select
                                        value={pjGolongan}
                                        onValueChange={(gol) => {
                                            setPjGolongan(gol);
                                            const found = GOLONGAN_OPTIONS.find(
                                                (g) => g.golongan === gol
                                            );
                                            if (found) setPjPangkat(found.pangkat);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {GOLONGAN_OPTIONS.map((g) => (
                                                <SelectItem
                                                    key={g.golongan}
                                                    value={g.golongan}
                                                >
                                                    {g.golongan} - {g.pangkat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Pangkat</Label>
                                    <Input
                                        value={pjPangkat}
                                        onChange={(e) => setPjPangkat(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Jabatan * (Awali &ldquo;Plt.&rdquo; jika Pelaksana Tugas)</Label>
                                    <Input
                                        value={pjJabatan}
                                        onChange={(e) => setPjJabatan(e.target.value)}
                                        placeholder="Plt. Kepala Dinas Ketahanan Pangan dan Pertanian"
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1 sm:col-span-2">
                                    <Checkbox
                                        id="pj-active"
                                        checked={pjIsActive}
                                        onCheckedChange={(v) =>
                                            setPjIsActive(Boolean(v))
                                        }
                                    />
                                    <Label htmlFor="pj-active" className="text-xs">
                                        Berstatus Aktif sebagai pejabat penandatangan
                                    </Label>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPejabatModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSavingPejabat}
                                    className="bg-[#006565] text-white hover:bg-[#005252]"
                                >
                                    {isSavingPejabat ? 'Menyimpan...' : 'Simpan Data'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ========================================================= */}
                {/* DIALOG: EDIT KEBERANGKATAN SPPD DALAM BATCH               */}
                {/* ========================================================= */}
                <Dialog
                    open={editSppdModalOpen}
                    onOpenChange={setEditSppdModalOpen}
                >
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-[#006565]">
                                <Edit3 className="size-4" />
                                Edit Keberangkatan SPPD dalam Batch
                            </DialogTitle>
                            <DialogDescription>
                                Batch:{' '}
                                <span className="font-mono font-bold text-neutral-700 dark:text-neutral-200">
                                    {editingSppdBatchCode}
                                </span>
                                . Perubahan kecamatan atau pegawai akan otomatis menghitung ulang zona dan uang saku.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveEditSppd} className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">
                                        Nomor SPT (Opsional)
                                    </Label>
                                    <Input
                                        value={esNomorSpt}
                                        onChange={(e) =>
                                            setEsNomorSpt(e.target.value)
                                        }
                                        placeholder="Kosongkan untuk format default"
                                        className="h-9 text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">
                                        Tanggal Berangkat *
                                    </Label>
                                    <Input
                                        type="date"
                                        value={esTanggalBerangkat}
                                        onChange={(e) =>
                                            setEsTanggalBerangkat(
                                                e.target.value
                                            )
                                        }
                                        className="h-9 text-xs"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">
                                        Tanggal SPT *
                                    </Label>
                                    <Input
                                        type="date"
                                        value={esTanggalSpt}
                                        onChange={(e) =>
                                            setEsTanggalSpt(e.target.value)
                                        }
                                        className="h-9 text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs">
                                    Tujuan Perjalanan *
                                </Label>
                                <Input
                                    value={esTujuan}
                                    onChange={(e) =>
                                        setEsTujuan(e.target.value)
                                    }
                                    placeholder="Contoh: Monitoring Harga Pangan di Pasar Daerah"
                                    className="h-9 text-xs"
                                    required
                                />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">
                                        Desa / Tempat
                                    </Label>
                                    <Input
                                        value={esNamaDesa}
                                        onChange={(e) =>
                                            setEsNamaDesa(e.target.value)
                                        }
                                        placeholder="Contoh: Desa Bondan / Pasar Daerah"
                                        className="h-9 text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">
                                        Kecamatan Tujuan *
                                    </Label>
                                    <Select
                                        value={esNamaKecamatan}
                                        onValueChange={setEsNamaKecamatan}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Pilih kecamatan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {kecamatanOptions.map((k) => (
                                                <SelectItem
                                                    key={k.nama_kecamatan}
                                                    value={k.nama_kecamatan}
                                                >
                                                    {k.nama_kecamatan} ({k.zona}
                                                    )
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                            Daftar Pegawai yang Berangkat (
                                            {esParticipantIds.length} Orang)
                                        </Label>
                                        <p className="text-[11px] text-neutral-500">
                                            Uang saku otomatis mengikuti Master Zonasi kecamatan &amp; golongan pegawai.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={handleAddEditParticipant}
                                        className="h-7 gap-1 border-[#006565]/30 text-[11px] font-semibold text-[#006565] hover:bg-teal-50"
                                    >
                                        <Plus className="size-3" />
                                        Tambah Pegawai
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {esParticipantIds.map((pegId, idx) => {
                                        const info = getTarifInfo(
                                            pegId,
                                            esNamaKecamatan
                                        );
                                        return (
                                            <div
                                                key={`edit-pt-${idx}`}
                                                className="flex flex-wrap items-center gap-2 rounded-md border border-neutral-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-950"
                                            >
                                                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-extrabold text-[#006565]">
                                                    {idx + 1}
                                                </span>
                                                <div className="min-w-[220px] flex-1">
                                                    <Select
                                                        value={pegId}
                                                        onValueChange={(val) =>
                                                            handleChangeEditParticipant(
                                                                idx,
                                                                val
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue placeholder="Pilih pegawai" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {sortedPegawais.map(
                                                                (p) => (
                                                                    <SelectItem
                                                                        key={
                                                                            p.id
                                                                        }
                                                                        value={String(
                                                                            p.id
                                                                        )}
                                                                    >
                                                                        {p.nama}{' '}
                                                                        (
                                                                        {
                                                                            p.golongan
                                                                        }
                                                                        )
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className="border-amber-200 bg-amber-50 text-[10px] text-amber-800"
                                                >
                                                    {info.zona}
                                                </Badge>
                                                <span className="min-w-[92px] text-right font-mono text-xs font-bold text-emerald-700">
                                                    {formatRupiah(
                                                        info.uang_saku
                                                    )}
                                                </span>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={
                                                        esParticipantIds.length <=
                                                        1
                                                    }
                                                    onClick={() =>
                                                        handleRemoveEditParticipant(
                                                            idx
                                                        )
                                                    }
                                                    className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30"
                                                    title="Hapus baris pegawai"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center justify-between border-t border-neutral-200 pt-2 text-xs dark:border-neutral-800">
                                    <span className="font-semibold text-neutral-600 dark:text-neutral-400">
                                        Estimasi Total Uang Saku SPPD ini:
                                    </span>
                                    <span className="font-mono text-sm font-extrabold text-[#006565]">
                                        {formatRupiah(
                                            esParticipantIds.reduce(
                                                (sum, id) =>
                                                    sum +
                                                    getTarifInfo(
                                                        id,
                                                        esNamaKecamatan
                                                    ).uang_saku,
                                                0
                                            )
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">
                                        Kepala Dinas
                                    </Label>
                                    <Select
                                        value={esKepalaDinasId}
                                        onValueChange={setEsKepalaDinasId}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Pilih Kepala Dinas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {kepalaDinasList.map((k) => (
                                                <SelectItem
                                                    key={k.id}
                                                    value={String(k.id)}
                                                >
                                                    {k.nama}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">PPTK</Label>
                                    <Select
                                        value={esPptkId}
                                        onValueChange={setEsPptkId}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Pilih PPTK" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pptkList.map((p) => (
                                                <SelectItem
                                                    key={p.id}
                                                    value={String(p.id)}
                                                >
                                                    {p.nama}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Bendahara</Label>
                                    <Select
                                        value={esBendaharaId}
                                        onValueChange={setEsBendaharaId}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Pilih Bendahara" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bendaharaList.map((b) => (
                                                <SelectItem
                                                    key={b.id}
                                                    value={String(b.id)}
                                                >
                                                    {b.nama}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditSppdModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSavingEditSppd}
                                    className="bg-[#006565] text-white hover:bg-[#005252]"
                                >
                                    {isSavingEditSppd
                                        ? 'Menyimpan...'
                                        : 'Simpan Perubahan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ========================================================= */}
                {/* DIALOG: CREATE / EDIT MASTER ZONASI                       */}
                {/* ========================================================= */}
                <Dialog open={zonasiModalOpen} onOpenChange={setZonasiModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingZonasi
                                    ? 'Edit Tarif Master Zonasi'
                                    : 'Tambah Tarif Master Zonasi'}
                            </DialogTitle>
                            <DialogDescription>
                                Atur kecamatan, klasifikasi zona, golongan pegawai, dan nominal uang saku.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSaveZonasi} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>Nama Kecamatan *</Label>
                                <Input
                                    value={zKecamatan}
                                    onChange={(e) => setZKecamatan(e.target.value)}
                                    placeholder="Contoh: Sukagumiwang"
                                    required
                                />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label>Zona *</Label>
                                    <Select value={zZona} onValueChange={setZZona}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ZONA_OPTIONS.map((zn) => (
                                                <SelectItem key={zn} value={zn}>
                                                    {zn}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Golongan *</Label>
                                    <Select
                                        value={zGolongan}
                                        onValueChange={setZGolongan}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ZONASI_GOLONGAN_OPTIONS.map((g) => (
                                                <SelectItem key={g} value={g}>
                                                    {g}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Besaran Uang Saku (Rp) *</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    step={5000}
                                    value={zUangSaku}
                                    onChange={(e) => setZUangSaku(e.target.value)}
                                    required
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setZonasiModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSavingZonasi}
                                    className="bg-[#006565] text-white hover:bg-[#005252]"
                                >
                                    {isSavingZonasi ? 'Menyimpan...' : 'Simpan Zonasi'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <LhpdModal
                    open={lhpdModalOpen}
                    onOpenChange={setLhpdModalOpen}
                    item={lhpdTargetItem}
                    copyableItems={allLhpdItems}
                />

                <RkaImportModal
                    open={rkaImportModalOpen}
                    onOpenChange={setRkaImportModalOpen}
                />
            </div>
        </>
    );
}

SppdDalamKotaIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'SPPD Dalam Kota',
            href: '/sppd-dalam-kota',
        },
    ] satisfies BreadcrumbItem[],
};
