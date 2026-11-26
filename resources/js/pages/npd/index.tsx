import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    ClipboardPaste,
    Coins,
    FileCheck2,
    FileText,
    FileUp,
    Link2,
    Loader2,
    Plus,
    Printer,
    Receipt,
    Save,
    Search,
    Settings2,
    Sparkles,
    Trash2,
    Wallet,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
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

interface SubKegiatanItem {
    id: number;
    no_rekening: string;
    nama_kegiatan: string;
    sub_kegiatan: string;
    kode_sub_kegiatan: string;
    is_active: boolean;
}

interface PejabatItem {
    id: number;
    tipe: string;
    nama: string;
    nip: string | null;
    pangkat: string | null;
    golongan: string | null;
    jabatan: string | null;
    is_active: boolean;
}

interface NpdRekeningItem {
    id: number;
    sub_kegiatan_id: number;
    tahun_anggaran: number;
    nama_program: string | null;
    kode_rekening: string;
    uraian: string;
    anggaran: number;
    urutan: number;
    akumulasi_tercairkan: number;
    sisa_anggaran: number;
}

interface NpdRowItem {
    id: number;
    npd_rekening_id: number | null;
    urutan: number;
    kode_rekening: string;
    uraian: string;
    anggaran: number;
    akumulasi_sebelumnya: number;
    pencairan_saat_ini: number;
    sisa: number;
}

interface NpdRecord {
    id: number;
    nomor_npd: string | null;
    tanggal_npd: string | null;
    tanggal_npd_formatted: string;
    sub_kegiatan_id: number;
    sub_kegiatan: {
        id: number;
        kode_sub_kegiatan: string;
        nama_kegiatan: string;
        sub_kegiatan: string;
    } | null;
    tahun_anggaran: number;
    nama_program: string | null;
    pptk_id: number | null;
    pptk_nama: string;
    pengguna_anggaran_id: number | null;
    pengguna_anggaran_nama: string;
    total_anggaran: number;
    total_akumulasi_sebelumnya: number;
    total_pencairan_saat_ini: number;
    total_sisa: number;
    potongan_ppn: number;
    potongan_pph21: number;
    potongan_pph22: number;
    potongan_pph23: number;
    potongan_pph4_2: number;
    total_potongan: number;
    jumlah_dibayarkan: number;
    terbilang: string;
    linked_sppd_dalam_kota_batches: string[];
    linked_sppd_luar_kota_batches: string[];
    catatan: string | null;
    items: NpdRowItem[];
}

interface SppdBatchRef {
    batch_code: string;
    sub_kegiatan_id: number | null;
    spt_count: number;
    total_biaya: number;
    tanggal_label: string;
    already_linked_npd: string | null;
}

interface PageProps {
    subKegiatans: SubKegiatanItem[];
    pptkList: PejabatItem[];
    kepalaDinasList: PejabatItem[];
    activeTahunAnggaran: number;
    rekenings: NpdRekeningItem[];
    npds: NpdRecord[];
    sppdDalamKotaBatches: SppdBatchRef[];
    sppdLuarKotaBatches: SppdBatchRef[];
    statistics: {
        tahun_anggaran: number;
        total_pagu: number;
        total_realisasi: number;
        total_sisa: number;
        persen_serapan: number;
        total_npd: number;
    };
}

interface DraftNpdRow {
    uid: string;
    npd_rekening_id: number | null;
    kode_rekening: string;
    uraian: string;
    anggaran: string;
    akumulasi_sebelumnya: string;
    pencairan_saat_ini: string;
}

interface ParsedSipdItem {
    uid: string;
    selected: boolean;
    kode_rekening: string;
    uraian: string;
    anggaran: string;
}

interface ParsedSipdMeta {
    filename: string;
    tahun_anggaran: number | null;
    nama_program: string | null;
    kode_sub_kegiatan: string | null;
    nama_sub_kegiatan: string | null;
    matched_sub_kegiatan_id: number | null;
}

function getXsrfToken(): string {
    const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='));
    return match ? decodeURIComponent(match.split('=')[1] || '') : '';
}

const MONTH_OPTIONS = [
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

const WIZARD_STEPS = [
    { step: 1 as const, title: 'Sub Kegiatan & Pejabat', desc: 'Program, PPTK & PA' },
    { step: 2 as const, title: 'Rincian Pencairan', desc: 'Pagu, akumulasi & tarik SPPD' },
    { step: 3 as const, title: 'Pajak & Simpan', desc: 'Potongan pajak & ringkasan' },
];

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount || 0);
}

function formatNum(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 0,
    }).format(amount || 0);
}

function parseMoney(v: string): number {
    const cleaned = String(v || '').replace(/[^\d.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
}

export default function NpdIndex({
    subKegiatans = [],
    pptkList = [],
    kepalaDinasList = [],
    activeTahunAnggaran,
    rekenings = [],
    npds = [],
    sppdDalamKotaBatches = [],
    sppdLuarKotaBatches = [],
    statistics,
}: PageProps) {
    const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const defaultPptkId = String(
        pptkList.find((p) => p.is_active)?.id || pptkList[0]?.id || ''
    );
    const defaultPaId = String(
        kepalaDinasList.find((k) => k.is_active)?.id || kepalaDinasList[0]?.id || ''
    );

    // =========================================================================
    // WIZARD STATE (COLLAPSIBLE 3 STEPS)
    // =========================================================================
    const [isFormExpanded, setIsFormExpanded] = useState(false);
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

    // Step 1
    const [selectedSubKegiatanId, setSelectedSubKegiatanId] = useState('');
    const [tahunAnggaran, setTahunAnggaran] = useState(
        String(activeTahunAnggaran || new Date().getFullYear())
    );
    const [namaProgram, setNamaProgram] = useState(
        'PROGRAM PENANGANAN KERAWANAN PANGAN'
    );
    const [nomorNpd, setNomorNpd] = useState('');
    const [tanggalNpd, setTanggalNpd] = useState(todayStr);
    const [pptkId, setPptkId] = useState(defaultPptkId);
    const [penggunaAnggaranId, setPenggunaAnggaranId] = useState(defaultPaId);

    // Step 2: Rincian Rekening
    const [draftRows, setDraftRows] = useState<DraftNpdRow[]>([]);
    const [linkedDkBatches, setLinkedDkBatches] = useState<string[]>([]);
    const [linkedLkBatches, setLinkedLkBatches] = useState<string[]>([]);

    // Step 3: Potongan Pajak
    const [potPpn, setPotPpn] = useState('0');
    const [potPph21, setPotPph21] = useState('0');
    const [potPph22, setPotPph22] = useState('0');
    const [potPph23, setPotPph23] = useState('0');
    const [potPph42, setPotPph42] = useState('0');
    const [catatan, setCatatan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // =========================================================================
    // MODAL MASTER PAGU REKENING
    // =========================================================================
    const [paguModalOpen, setPaguModalOpen] = useState(false);
    const [paguSubId, setPaguSubId] = useState(
        String(subKegiatans[0]?.id || '')
    );
    const [paguTahun, setPaguTahun] = useState(
        String(activeTahunAnggaran || new Date().getFullYear())
    );
    const [paguProgram, setPaguProgram] = useState(
        'PROGRAM PENANGANAN KERAWANAN PANGAN'
    );
    const [newKodeRek, setNewKodeRek] = useState('');
    const [newUraian, setNewUraian] = useState('');
    const [newAnggaran, setNewAnggaran] = useState('');
    const [pasteExcelPagu, setPasteExcelPagu] = useState('');
    const [showPastePagu, setShowPastePagu] = useState(false);
    const [showImportSipdPdf, setShowImportSipdPdf] = useState(false);
    const [isParsingSipdPdf, setIsParsingSipdPdf] = useState(false);
    const [sipdParsedMeta, setSipdParsedMeta] = useState<ParsedSipdMeta | null>(
        null
    );
    const [sipdParsedItems, setSipdParsedItems] = useState<ParsedSipdItem[]>(
        []
    );
    const [isSavingPagu, setIsSavingPagu] = useState(false);

    // =========================================================================
    // MODAL TARIK BATCH SPPD
    // =========================================================================
    const [sppdPickerOpen, setSppdPickerOpen] = useState(false);
    const [sppdPickerMode, setSppdPickerMode] = useState<'dk' | 'lk'>('dk');
    const [tempSelectedBatches, setTempSelectedBatches] = useState<string[]>([]);

    // =========================================================================
    // TABLE FILTER & EXPAND STATE
    // =========================================================================
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSubId, setFilterSubId] = useState('ALL');
    const [filterMonth, setFilterMonth] = useState('ALL');
    const [expandedNpds, setExpandedNpds] = useState<Record<number, boolean>>(
        {}
    );

    const matchingMasterRekenings = useMemo(() => {
        if (!selectedSubKegiatanId) return [];
        return rekenings.filter(
            (r) =>
                String(r.sub_kegiatan_id) === String(selectedSubKegiatanId) &&
                String(r.tahun_anggaran) === String(tahunAnggaran)
        );
    }, [rekenings, selectedSubKegiatanId, tahunAnggaran]);

    const paguModalRekenings = useMemo(() => {
        return rekenings.filter(
            (r) =>
                String(r.sub_kegiatan_id) === String(paguSubId) &&
                String(r.tahun_anggaran) === String(paguTahun)
        );
    }, [rekenings, paguSubId, paguTahun]);

    const loadMasterRekeningsToDraft = (subId: string, thn: string) => {
        const list = rekenings.filter(
            (r) =>
                String(r.sub_kegiatan_id) === String(subId) &&
                String(r.tahun_anggaran) === String(thn)
        );
        if (list.length > 0) {
            if (list[0].nama_program) {
                setNamaProgram(list[0].nama_program);
            }
            setDraftRows(
                list.map((r, idx) => ({
                    uid: `npd-row-${r.id}-${idx}`,
                    npd_rekening_id: r.id,
                    kode_rekening: r.kode_rekening,
                    uraian: r.uraian,
                    anggaran: String(r.anggaran),
                    akumulasi_sebelumnya: String(r.akumulasi_tercairkan),
                    pencairan_saat_ini: '0',
                }))
            );
        } else {
            setDraftRows([
                {
                    uid: `npd-row-manual-${Date.now()}`,
                    npd_rekening_id: null,
                    kode_rekening: '5.1.02.04.01.0003',
                    uraian: 'Belanja Perjalanan Dinas Dalam Kota',
                    anggaran: '0',
                    akumulasi_sebelumnya: '0',
                    pencairan_saat_ini: '0',
                },
            ]);
        }
        setLinkedDkBatches([]);
        setLinkedLkBatches([]);
    };

    const handleSelectSubKegiatan = (subId: string) => {
        setSelectedSubKegiatanId(subId);
        loadMasterRekeningsToDraft(subId, tahunAnggaran);
    };

    const draftSummary = useMemo(() => {
        let totalAnggaran = 0;
        let totalAkum = 0;
        let totalCair = 0;
        let totalSisa = 0;
        let hasOverBudget = false;

        draftRows.forEach((r) => {
            const a = parseMoney(r.anggaran);
            const ak = parseMoney(r.akumulasi_sebelumnya);
            const c = parseMoney(r.pencairan_saat_ini);
            const s = a - ak - c;
            totalAnggaran += a;
            totalAkum += ak;
            totalCair += c;
            totalSisa += s;
            if (s < -0.01) hasOverBudget = true;
        });

        const totalPot =
            parseMoney(potPpn) +
            parseMoney(potPph21) +
            parseMoney(potPph22) +
            parseMoney(potPph23) +
            parseMoney(potPph42);
        const dibayarkan = Math.max(0, totalCair - totalPot);

        return {
            totalAnggaran,
            totalAkum,
            totalCair,
            totalSisa,
            hasOverBudget,
            totalPot,
            dibayarkan,
        };
    }, [draftRows, potPpn, potPph21, potPph22, potPph23, potPph42]);

    const handleNextStep = () => {
        if (currentStep === 1) {
            if (!selectedSubKegiatanId) {
                toast.error('Silakan pilih Sub Kegiatan terlebih dahulu.');
                return;
            }
            if (!namaProgram.trim()) {
                toast.error('Nama Program wajib diisi.');
                return;
            }
            if (draftRows.length === 0) {
                loadMasterRekeningsToDraft(selectedSubKegiatanId, tahunAnggaran);
            }
            setCurrentStep(2);
            return;
        }
        if (currentStep === 2) {
            if (draftSummary.hasOverBudget) {
                toast.error(
                    'Ada rekening yang melebihi sisa pagu anggaran (Sisa negatif). Mohon perbaiki nominalnya.'
                );
                return;
            }
            if (draftSummary.totalCair <= 0) {
                toast.error(
                    'Isi minimal satu rekening dengan Pencairan Saat Ini lebih dari Rp 0.'
                );
                return;
            }
            setCurrentStep(3);
        }
    };

    const handleOpenSppdPicker = (mode: 'dk' | 'lk') => {
        setSppdPickerMode(mode);
        setTempSelectedBatches(mode === 'dk' ? linkedDkBatches : linkedLkBatches);
        setSppdPickerOpen(true);
    };

    const availableSppdBatches = useMemo(() => {
        const source =
            sppdPickerMode === 'dk' ? sppdDalamKotaBatches : sppdLuarKotaBatches;
        if (!selectedSubKegiatanId) return source;
        // Prioritaskan batch dari Sub Kegiatan yang sama di atas
        return [...source].sort((a, b) => {
            const aMatch =
                String(a.sub_kegiatan_id) === String(selectedSubKegiatanId)
                    ? 0
                    : 1;
            const bMatch =
                String(b.sub_kegiatan_id) === String(selectedSubKegiatanId)
                    ? 0
                    : 1;
            return aMatch - bMatch;
        });
    }, [
        sppdPickerMode,
        sppdDalamKotaBatches,
        sppdLuarKotaBatches,
        selectedSubKegiatanId,
    ]);

    const handleApplySppdBatches = () => {
        const source =
            sppdPickerMode === 'dk' ? sppdDalamKotaBatches : sppdLuarKotaBatches;
        const selectedObjs = source.filter((b) =>
            tempSelectedBatches.includes(b.batch_code)
        );
        const totalSelected = selectedObjs.reduce(
            (sum, b) => sum + b.total_biaya,
            0
        );

        const targetKode =
            sppdPickerMode === 'dk'
                ? '5.1.02.04.01.0003'
                : '5.1.02.04.01.0001';
        const targetUraian =
            sppdPickerMode === 'dk'
                ? 'Belanja Perjalanan Dinas Dalam Kota'
                : 'Belanja Perjalanan Dinas Biasa';

        if (sppdPickerMode === 'dk') {
            setLinkedDkBatches(tempSelectedBatches);
        } else {
            setLinkedLkBatches(tempSelectedBatches);
        }

        setDraftRows((prev) => {
            const idx = prev.findIndex(
                (r) =>
                    r.kode_rekening.replace(/\s+/g, '') === targetKode ||
                    (sppdPickerMode === 'dk' &&
                        r.uraian.toLowerCase().includes('dalam kota')) ||
                    (sppdPickerMode === 'lk' &&
                        r.uraian.toLowerCase().includes('dinas biasa'))
            );
            if (idx >= 0) {
                return prev.map((r, i) =>
                    i === idx
                        ? { ...r, pencairan_saat_ini: String(totalSelected) }
                        : r
                );
            }
            return [
                ...prev,
                {
                    uid: `npd-sppd-${Date.now()}`,
                    npd_rekening_id: null,
                    kode_rekening: targetKode,
                    uraian: targetUraian,
                    anggaran: String(totalSelected),
                    akumulasi_sebelumnya: '0',
                    pencairan_saat_ini: String(totalSelected),
                },
            ];
        });

        setSppdPickerOpen(false);
        toast.success(
            `Berhasil menarik ${selectedObjs.length} Batch (${formatRupiah(totalSelected)}) ke rekening ${targetKode}.`
        );
    };

    const handleSubmitNpd = (e: React.FormEvent) => {
        e.preventDefault();
        if (draftSummary.hasOverBudget) {
            toast.error('Tidak dapat menyimpan karena ada rekening over-budget.');
            return;
        }
        setIsSubmitting(true);
        router.post(
            '/npd',
            {
                nomor_npd: nomorNpd.trim() || null,
                tanggal_npd: tanggalNpd || null,
                sub_kegiatan_id: Number(selectedSubKegiatanId),
                tahun_anggaran: Number(tahunAnggaran),
                nama_program: namaProgram.trim(),
                pptk_id: pptkId ? Number(pptkId) : null,
                pengguna_anggaran_id: penggunaAnggaranId
                    ? Number(penggunaAnggaranId)
                    : null,
                potongan_ppn: parseMoney(potPpn),
                potongan_pph21: parseMoney(potPph21),
                potongan_pph22: parseMoney(potPph22),
                potongan_pph23: parseMoney(potPph23),
                potongan_pph4_2: parseMoney(potPph42),
                linked_sppd_dalam_kota_batches: linkedDkBatches,
                linked_sppd_luar_kota_batches: linkedLkBatches,
                catatan: catatan.trim() || null,
                items: draftRows
                    .filter((r) => r.kode_rekening.trim() !== '')
                    .map((r) => ({
                        npd_rekening_id: r.npd_rekening_id,
                        kode_rekening: r.kode_rekening.trim(),
                        uraian: r.uraian.trim(),
                        anggaran: parseMoney(r.anggaran),
                        akumulasi_sebelumnya: parseMoney(r.akumulasi_sebelumnya),
                        pencairan_saat_ini: parseMoney(r.pencairan_saat_ini),
                    })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Nota Pencairan Dana (NPD) berhasil disimpan.');
                    setCurrentStep(1);
                    setIsFormExpanded(false);
                    setNomorNpd('');
                    setDraftRows([]);
                    setLinkedDkBatches([]);
                    setLinkedLkBatches([]);
                    setPotPpn('0');
                    setPotPph21('0');
                    setPotPph22('0');
                    setPotPph23('0');
                    setPotPph42('0');
                    setCatatan('');
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(
                        typeof first === 'string'
                            ? first
                            : 'Gagal menyimpan NPD.'
                    );
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    // =========================================================================
    // MASTER PAGU REKENING HANDLERS
    // =========================================================================
    const handleAddSingleRekening = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paguSubId || !newKodeRek.trim() || !newUraian.trim()) {
            toast.error('Sub Kegiatan, Kode Rekening, dan Uraian wajib diisi.');
            return;
        }
        setIsSavingPagu(true);
        router.post(
            '/npd/rekening',
            {
                sub_kegiatan_id: Number(paguSubId),
                tahun_anggaran: Number(paguTahun),
                nama_program: paguProgram.trim() || null,
                kode_rekening: newKodeRek.trim(),
                uraian: newUraian.trim(),
                anggaran: parseMoney(newAnggaran),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Rekening pagu berhasil ditambahkan.');
                    setNewKodeRek('');
                    setNewUraian('');
                    setNewAnggaran('');
                },
                onFinish: () => setIsSavingPagu(false),
            }
        );
    };

    const handleBulkPasteRekening = () => {
        const lines = pasteExcelPagu
            .split(/\r?\n/)
            .map((l) => l.trimEnd())
            .filter((l) => l.trim() !== '');
        if (lines.length === 0) {
            toast.error('Tempel data rekening dari Excel terlebih dahulu.');
            return;
        }
        const items = lines
            .map((line) => {
                const cols = line.split('\t').map((c) => c.trim());
                if (cols.length >= 3) {
                    return {
                        kode_rekening: cols[0],
                        uraian: cols[1],
                        anggaran: parseMoney(cols[2]),
                    };
                }
                return null;
            })
            .filter(Boolean);

        if (items.length === 0) {
            toast.error(
                'Format tidak dikenali. Gunakan 3 kolom dari Excel: Kode Rekening [Tab] Uraian [Tab] Anggaran.'
            );
            return;
        }

        setIsSavingPagu(true);
        router.post(
            '/npd/rekening',
            {
                sub_kegiatan_id: Number(paguSubId),
                tahun_anggaran: Number(paguTahun),
                nama_program: paguProgram.trim() || null,
                items: items as never,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `${items.length} rekening pagu berhasil diimpor dari Excel.`
                    );
                    setPasteExcelPagu('');
                    setShowPastePagu(false);
                },
                onFinish: () => setIsSavingPagu(false),
            }
        );
    };

    const handleSipdPdfUpload = async (file: File | null) => {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            toast.error('Mohon unggah file berformat PDF dari SIPD-RI.');
            return;
        }

        setIsParsingSipdPdf(true);
        try {
            const formData = new FormData();
            formData.append('pdf', file);

            const res = await fetch('/npd/rekening/parse-sipd-pdf', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(
                    data?.message || 'Gagal membaca file PDF SIPD-RI.'
                );
                return;
            }

            const items: ParsedSipdItem[] = (data.items || []).map(
                (
                    it: {
                        kode_rekening: string;
                        uraian: string;
                        anggaran: number;
                    },
                    idx: number
                ) => ({
                    uid: `sipd-${idx}-${Date.now()}`,
                    selected: true,
                    kode_rekening: it.kode_rekening,
                    uraian: it.uraian,
                    anggaran: String(Math.round(Number(it.anggaran || 0))),
                })
            );

            setSipdParsedMeta({
                filename: file.name,
                tahun_anggaran: data.tahun_anggaran ?? null,
                nama_program: data.nama_program ?? null,
                kode_sub_kegiatan: data.kode_sub_kegiatan ?? null,
                nama_sub_kegiatan: data.nama_sub_kegiatan ?? null,
                matched_sub_kegiatan_id: data.matched_sub_kegiatan_id ?? null,
            });
            setSipdParsedItems(items);

            if (data.tahun_anggaran) {
                setPaguTahun(String(data.tahun_anggaran));
            }
            if (data.nama_program) {
                setPaguProgram(String(data.nama_program));
            }
            if (data.matched_sub_kegiatan_id) {
                setPaguSubId(String(data.matched_sub_kegiatan_id));
            }

            toast.success(
                `Berhasil menarik ${items.length} rekening belanja dari PDF SIPD-RI.`
            );
        } catch {
            toast.error('Terjadi kesalahan saat mengunggah PDF SIPD-RI.');
        } finally {
            setIsParsingSipdPdf(false);
        }
    };

    const handleSaveSipdParsedItems = () => {
        if (!paguSubId) {
            toast.error('Silakan pilih Sub Kegiatan terlebih dahulu.');
            return;
        }
        const selected = sipdParsedItems.filter(
            (it) => it.selected && it.kode_rekening.trim() && it.uraian.trim()
        );
        if (selected.length === 0) {
            toast.error('Pilih minimal 1 rekening hasil ekstraksi PDF.');
            return;
        }

        setIsSavingPagu(true);
        router.post(
            '/npd/rekening',
            {
                sub_kegiatan_id: Number(paguSubId),
                tahun_anggaran: Number(paguTahun),
                nama_program: paguProgram.trim() || null,
                items: selected.map((it) => ({
                    kode_rekening: it.kode_rekening.trim(),
                    uraian: it.uraian.trim(),
                    anggaran: parseMoney(it.anggaran),
                })) as never,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `${selected.length} rekening pagu dari PDF SIPD-RI berhasil disimpan.`
                    );
                    setSipdParsedMeta(null);
                    setSipdParsedItems([]);
                    setShowImportSipdPdf(false);
                },
                onFinish: () => setIsSavingPagu(false),
            }
        );
    };

    const filteredNpds = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return npds.filter((n) => {
            const matchSub =
                filterSubId === 'ALL' ||
                String(n.sub_kegiatan_id) === filterSubId;
            if (!matchSub) return false;
            const matchMonth =
                filterMonth === 'ALL' ||
                String(n.tanggal_npd || '').slice(5, 7) === filterMonth;
            if (!matchMonth) return false;
            if (!q) return true;
            return (
                (n.nomor_npd || '').toLowerCase().includes(q) ||
                (n.nama_program || '').toLowerCase().includes(q) ||
                n.pptk_nama.toLowerCase().includes(q) ||
                (n.sub_kegiatan?.sub_kegiatan || '').toLowerCase().includes(q) ||
                n.items.some(
                    (it) =>
                        it.kode_rekening.toLowerCase().includes(q) ||
                        it.uraian.toLowerCase().includes(q)
                )
            );
        });
    }, [npds, searchQuery, filterSubId, filterMonth]);

    return (
        <>
            <Head title="Nota Pencairan Dana (NPD) - DKPP Indramayu" />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                {/* HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-xl bg-[#006565] text-white shadow-sm">
                            <Receipt className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                Nota Pencairan Dana (NPD)
                            </h1>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Pengajuan pencairan anggaran otomatis dengan akumulasi pagu, integrasi Batch SPPD, dan cetak PDF presisi.
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            if (selectedSubKegiatanId) {
                                setPaguSubId(selectedSubKegiatanId);
                            }
                            setPaguModalOpen(true);
                        }}
                        className="h-9 gap-1.5 border-teal-300 text-xs font-extrabold text-[#006565] hover:bg-teal-50"
                    >
                        <Settings2 className="size-4" />
                        Kelola Master Pagu Rekening
                    </Button>
                </div>

                {/* KPI SUMMARY CARDS (SERAPAN ANGGARAN) */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-white via-teal-50/30 to-emerald-50/40 px-4 py-3 shadow-2xs dark:border-teal-900/60 dark:from-neutral-900">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#006565] to-teal-600 text-white shadow-xs">
                                <Wallet className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[10.5px] font-bold tracking-wider text-teal-700/80 uppercase">
                                    Total Pagu TA {statistics.tahun_anggaran}
                                </div>
                                <div className="mt-0.5 truncate font-mono text-lg font-extrabold text-neutral-900 dark:text-neutral-100">
                                    {formatRupiah(statistics.total_pagu)}
                                </div>
                                <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                                    {rekenings.length} kode rekening terdaftar
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 px-4 py-3 shadow-2xs dark:border-emerald-900/60 dark:from-neutral-900">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-xs">
                                <Coins className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                    <span className="text-[10.5px] font-bold tracking-wider text-emerald-700/80 uppercase">
                                        Total Realisasi
                                    </span>
                                    <Badge className="bg-emerald-100 px-1.5 py-0 text-[10px] font-extrabold text-emerald-800">
                                        {statistics.persen_serapan}%
                                    </Badge>
                                </div>
                                <div className="mt-0.5 truncate font-mono text-lg font-extrabold text-emerald-800 dark:text-emerald-300">
                                    {formatRupiah(statistics.total_realisasi)}
                                </div>
                                <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                                    Akumulasi seluruh NPD
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-white via-sky-50/30 to-blue-50/30 px-4 py-3 shadow-2xs dark:border-sky-900/60 dark:from-neutral-900">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-blue-600 text-white shadow-xs">
                                <FileCheck2 className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[10.5px] font-bold tracking-wider text-sky-700/80 uppercase">
                                    Sisa Anggaran
                                </div>
                                <div className="mt-0.5 truncate font-mono text-lg font-extrabold text-sky-800 dark:text-sky-300">
                                    {formatRupiah(statistics.total_sisa)}
                                </div>
                                <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                                    Sisa pagu siap dicairkan
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-white via-amber-50/30 to-orange-50/30 px-4 py-3 shadow-2xs dark:border-amber-900/60 dark:from-neutral-900">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-xs">
                                <Receipt className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[10.5px] font-bold tracking-wider text-amber-700/80 uppercase">
                                    Total Dokumen NPD
                                </div>
                                <div className="mt-0.5 text-lg font-extrabold text-amber-800 dark:text-amber-300">
                                    {statistics.total_npd} NPD
                                </div>
                                <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                                    Siap preview &amp; cetak PDF A4
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* COLLAPSIBLE 3-STEP WIZARD BUAT NPD BARU                   */}
                {/* ========================================================= */}
                <Card className="border-2 border-[#006565]/70 bg-gradient-to-br from-teal-50/50 via-white to-emerald-50/30 shadow-sm dark:border-teal-800 dark:from-teal-950/30 dark:via-neutral-900">
                    <CardHeader
                        className={
                            isFormExpanded
                                ? 'border-b border-teal-100 pb-4 dark:border-teal-900/60'
                                : 'py-3.5'
                        }
                    >
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => setIsFormExpanded((v) => !v)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
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
                                            Form Buat Nota Pencairan Dana (NPD)
                                        </CardTitle>
                                        <Badge className="bg-teal-100 text-[10px] font-bold text-[#006565]">
                                            Langkah {currentStep} / 3
                                        </Badge>
                                    </div>
                                    <p className="text-[11px] text-neutral-500">
                                        {isFormExpanded
                                            ? 'Lengkapi Sub Kegiatan, nominal pencairan (manual atau tarik Batch SPPD), dan potongan pajak.'
                                            : 'Form sedang disembunyikan agar tampilan rapi. Klik untuk membuat NPD baru.'}
                                    </p>
                                </div>
                            </div>

                            <Button
                                type="button"
                                size="sm"
                                variant={isFormExpanded ? 'outline' : 'default'}
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
                                        <span>Buat NPD Baru</span>
                                    </>
                                )}
                            </Button>
                        </div>

                        {isFormExpanded && (
                            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                {WIZARD_STEPS.map((st) => {
                                    const isActive = currentStep === st.step;
                                    const isDone = currentStep > st.step;
                                    return (
                                        <button
                                            key={st.step}
                                            type="button"
                                            onClick={() => {
                                                if (st.step < currentStep) {
                                                    setCurrentStep(st.step);
                                                }
                                            }}
                                            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all ${
                                                isActive
                                                    ? 'border-[#006565] bg-[#006565] text-white shadow-xs'
                                                    : isDone
                                                      ? 'cursor-pointer border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                                                      : 'border-neutral-200 bg-white/80 text-neutral-400'
                                            }`}
                                        >
                                            <span
                                                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                                                    isActive
                                                        ? 'bg-white text-[#006565]'
                                                        : isDone
                                                          ? 'bg-emerald-600 text-white'
                                                          : 'bg-neutral-200 text-neutral-500'
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
                                                    Langkah {st.step}: {st.title}
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
                                onSubmit={handleSubmitNpd}
                                className="space-y-5"
                            >
                                {/* LANGKAH 1 */}
                                {currentStep === 1 && (
                                    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-12">
                                        <div className="min-w-0 space-y-1.5 md:col-span-9">
                                            <Label className="text-xs font-extrabold text-[#006565]">
                                                1. Pilih Sub Kegiatan *
                                            </Label>
                                            <Select
                                                value={selectedSubKegiatanId}
                                                onValueChange={
                                                    handleSelectSubKegiatan
                                                }
                                            >
                                                <SelectTrigger className="h-10 w-full min-w-0 overflow-hidden border-teal-300 bg-white text-xs font-semibold [&>span]:truncate">
                                                    <SelectValue placeholder="-- Pilih Sub Kegiatan --" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {subKegiatans.map((sk) => (
                                                        <SelectItem
                                                            key={sk.id}
                                                            value={String(sk.id)}
                                                        >
                                                            [{sk.kode_sub_kegiatan}]{' '}
                                                            {sk.sub_kegiatan}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="min-w-0 space-y-1.5 md:col-span-3">
                                            <Label className="text-xs font-extrabold text-[#006565]">
                                                2. Tahun Anggaran *
                                            </Label>
                                            <Input
                                                type="number"
                                                value={tahunAnggaran}
                                                onChange={(e) => {
                                                    setTahunAnggaran(
                                                        e.target.value
                                                    );
                                                    if (selectedSubKegiatanId) {
                                                        loadMasterRekeningsToDraft(
                                                            selectedSubKegiatanId,
                                                            e.target.value
                                                        );
                                                    }
                                                }}
                                                className="h-10 border-teal-300 bg-white font-mono text-xs font-bold"
                                                required
                                            />
                                        </div>

                                        <div className="min-w-0 space-y-1.5 md:col-span-6">
                                            <Label className="text-xs font-bold">
                                                3. Nama Program *
                                            </Label>
                                            <Input
                                                value={namaProgram}
                                                onChange={(e) =>
                                                    setNamaProgram(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="PROGRAM PENANGANAN KERAWANAN PANGAN"
                                                className="h-10 bg-white text-xs"
                                                required
                                            />
                                        </div>

                                        <div className="min-w-0 space-y-1.5 md:col-span-3">
                                            <Label className="text-xs font-bold">
                                                4. Nomor NPD (Opsional)
                                            </Label>
                                            <Input
                                                value={nomorNpd}
                                                onChange={(e) =>
                                                    setNomorNpd(e.target.value)
                                                }
                                                placeholder="Otomatis: NPD-001/2026"
                                                className="h-10 bg-white text-xs"
                                            />
                                        </div>

                                        <div className="min-w-0 space-y-1.5 md:col-span-3">
                                            <Label className="text-xs font-bold">
                                                5. Tanggal NPD (Opsional)
                                            </Label>
                                            <Input
                                                type="date"
                                                value={tanggalNpd}
                                                onChange={(e) =>
                                                    setTanggalNpd(
                                                        e.target.value
                                                    )
                                                }
                                                className="h-10 bg-white text-xs"
                                            />
                                        </div>

                                        <div className="min-w-0 space-y-1.5 md:col-span-6">
                                            <Label className="text-xs font-bold">
                                                6. Pejabat Pelaksana Teknis
                                                Kegiatan (PPTK)
                                            </Label>
                                            <Select
                                                value={pptkId}
                                                onValueChange={setPptkId}
                                            >
                                                <SelectTrigger className="h-10 bg-white text-xs">
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

                                        <div className="min-w-0 space-y-1.5 md:col-span-6">
                                            <Label className="text-xs font-bold">
                                                7. Pengguna Anggaran (Kepala
                                                Dinas)
                                            </Label>
                                            <Select
                                                value={penggunaAnggaranId}
                                                onValueChange={
                                                    setPenggunaAnggaranId
                                                }
                                            >
                                                <SelectTrigger className="h-10 bg-white text-xs">
                                                    <SelectValue placeholder="Pilih Pengguna Anggaran" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {kepalaDinasList.map(
                                                        (k) => (
                                                            <SelectItem
                                                                key={k.id}
                                                                value={String(
                                                                    k.id
                                                                )}
                                                            >
                                                                {k.nama}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                {/* LANGKAH 2: RINCIAN REKENING & TARIK SPPD */}
                                {currentStep === 2 && (
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleOpenSppdPicker(
                                                            'dk'
                                                        )
                                                    }
                                                    className="h-8 gap-1.5 border-teal-300 bg-teal-50/70 text-xs font-bold text-[#006565] hover:bg-teal-100"
                                                >
                                                    <Link2 className="size-3.5" />
                                                    Tarik Batch SPPD Dalam Kota
                                                    {linkedDkBatches.length >
                                                        0 && (
                                                        <Badge className="bg-[#006565] px-1.5 py-0 text-[10px] text-white">
                                                            {
                                                                linkedDkBatches.length
                                                            }
                                                        </Badge>
                                                    )}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleOpenSppdPicker(
                                                            'lk'
                                                        )
                                                    }
                                                    className="h-8 gap-1.5 border-indigo-300 bg-indigo-50/70 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                                                >
                                                    <Link2 className="size-3.5" />
                                                    Tarik Batch SPPD Luar Kota
                                                    {linkedLkBatches.length >
                                                        0 && (
                                                        <Badge className="bg-indigo-600 px-1.5 py-0 text-[10px] text-white">
                                                            {
                                                                linkedLkBatches.length
                                                            }
                                                        </Badge>
                                                    )}
                                                </Button>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                {matchingMasterRekenings.length ===
                                                    0 && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setPaguSubId(
                                                                selectedSubKegiatanId
                                                            );
                                                            setPaguTahun(
                                                                tahunAnggaran
                                                            );
                                                            setPaguModalOpen(
                                                                true
                                                            );
                                                        }}
                                                        className="h-8 gap-1 border-amber-300 bg-amber-50 text-xs font-bold text-amber-800"
                                                    >
                                                        <Settings2 className="size-3.5" />
                                                        Setup Master Pagu
                                                    </Button>
                                                )}
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setDraftRows((prev) => [
                                                            ...prev,
                                                            {
                                                                uid: `npd-m-${Date.now()}`,
                                                                npd_rekening_id:
                                                                    null,
                                                                kode_rekening:
                                                                    '',
                                                                uraian: '',
                                                                anggaran: '0',
                                                                akumulasi_sebelumnya:
                                                                    '0',
                                                                pencairan_saat_ini:
                                                                    '0',
                                                            },
                                                        ])
                                                    }
                                                    className="h-8 gap-1 border-teal-300 text-xs font-bold text-[#006565]"
                                                >
                                                    <Plus className="size-3.5" />
                                                    Tambah Baris
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                                            <table className="w-full border-collapse text-left text-xs">
                                                <thead>
                                                    <tr className="border-b border-teal-200/80 bg-gradient-to-r from-teal-50/95 via-emerald-50/70 to-teal-50/95 text-[10.5px] font-extrabold text-[#005757] uppercase">
                                                        <th className="w-8 px-2 py-2.5 text-center">
                                                            No
                                                        </th>
                                                        <th className="w-40 px-2 py-2.5">
                                                            Kode Rekening
                                                        </th>
                                                        <th className="min-w-[180px] px-2 py-2.5">
                                                            Uraian Belanja
                                                        </th>
                                                        <th className="w-32 px-2 py-2.5 text-right">
                                                            Anggaran (Rp)
                                                        </th>
                                                        <th className="w-32 px-2 py-2.5 text-right">
                                                            Akumulasi Sblm
                                                        </th>
                                                        <th className="w-36 px-2 py-2.5 text-right">
                                                            Pencairan Saat Ini
                                                        </th>
                                                        <th className="w-32 px-2 py-2.5 text-right">
                                                            Sisa Pagu
                                                        </th>
                                                        <th className="w-9 px-1 py-2.5"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                    {draftRows.map(
                                                        (row, idx) => {
                                                            const ang =
                                                                parseMoney(
                                                                    row.anggaran
                                                                );
                                                            const akum =
                                                                parseMoney(
                                                                    row.akumulasi_sebelumnya
                                                                );
                                                            const cair =
                                                                parseMoney(
                                                                    row.pencairan_saat_ini
                                                                );
                                                            const sisa =
                                                                ang -
                                                                akum -
                                                                cair;
                                                            const isOver =
                                                                sisa < -0.01;

                                                            return (
                                                                <tr
                                                                    key={row.uid}
                                                                    className={
                                                                        isOver
                                                                            ? 'bg-rose-50/80'
                                                                            : 'hover:bg-neutral-50/70'
                                                                    }
                                                                >
                                                                    <td className="px-2 py-1.5 text-center font-bold text-neutral-400">
                                                                        {idx + 1}
                                                                    </td>
                                                                    <td className="px-1.5 py-1.5">
                                                                        <Input
                                                                            value={
                                                                                row.kode_rekening
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                setDraftRows(
                                                                                    (
                                                                                        prev
                                                                                    ) =>
                                                                                        prev.map(
                                                                                            (
                                                                                                r,
                                                                                                i
                                                                                            ) =>
                                                                                                i ===
                                                                                                idx
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
                                                                            className="h-8 font-mono text-[11px]"
                                                                            placeholder="5.1.02..."
                                                                        />
                                                                    </td>
                                                                    <td className="px-1.5 py-1.5">
                                                                        <Input
                                                                            value={
                                                                                row.uraian
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                setDraftRows(
                                                                                    (
                                                                                        prev
                                                                                    ) =>
                                                                                        prev.map(
                                                                                            (
                                                                                                r,
                                                                                                i
                                                                                            ) =>
                                                                                                i ===
                                                                                                idx
                                                                                                    ? {
                                                                                                          ...r,
                                                                                                          uraian:
                                                                                                              e
                                                                                                                  .target
                                                                                                                  .value,
                                                                                                      }
                                                                                                    : r
                                                                                        )
                                                                                )
                                                                            }
                                                                            className="h-8 text-[11px]"
                                                                            placeholder="Uraian belanja..."
                                                                        />
                                                                    </td>
                                                                    <td className="px-1.5 py-1.5">
                                                                        <Input
                                                                            type="number"
                                                                            min={0}
                                                                            value={
                                                                                row.anggaran
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                setDraftRows(
                                                                                    (
                                                                                        prev
                                                                                    ) =>
                                                                                        prev.map(
                                                                                            (
                                                                                                r,
                                                                                                i
                                                                                            ) =>
                                                                                                i ===
                                                                                                idx
                                                                                                    ? {
                                                                                                          ...r,
                                                                                                          anggaran:
                                                                                                              e
                                                                                                                  .target
                                                                                                                  .value,
                                                                                                      }
                                                                                                    : r
                                                                                        )
                                                                                )
                                                                            }
                                                                            className="h-8 px-2 text-right font-mono text-[11px]"
                                                                        />
                                                                    </td>
                                                                    <td className="px-1.5 py-1.5">
                                                                        <Input
                                                                            type="number"
                                                                            min={0}
                                                                            value={
                                                                                row.akumulasi_sebelumnya
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                setDraftRows(
                                                                                    (
                                                                                        prev
                                                                                    ) =>
                                                                                        prev.map(
                                                                                            (
                                                                                                r,
                                                                                                i
                                                                                            ) =>
                                                                                                i ===
                                                                                                idx
                                                                                                    ? {
                                                                                                          ...r,
                                                                                                          akumulasi_sebelumnya:
                                                                                                              e
                                                                                                                  .target
                                                                                                                  .value,
                                                                                                      }
                                                                                                    : r
                                                                                        )
                                                                                )
                                                                            }
                                                                            className="h-8 bg-neutral-50 px-2 text-right font-mono text-[11px]"
                                                                        />
                                                                    </td>
                                                                    <td className="px-1.5 py-1.5">
                                                                        <Input
                                                                            type="number"
                                                                            min={0}
                                                                            value={
                                                                                row.pencairan_saat_ini
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                setDraftRows(
                                                                                    (
                                                                                        prev
                                                                                    ) =>
                                                                                        prev.map(
                                                                                            (
                                                                                                r,
                                                                                                i
                                                                                            ) =>
                                                                                                i ===
                                                                                                idx
                                                                                                    ? {
                                                                                                          ...r,
                                                                                                          pencairan_saat_ini:
                                                                                                              e
                                                                                                                  .target
                                                                                                                  .value,
                                                                                                      }
                                                                                                    : r
                                                                                        )
                                                                                )
                                                                            }
                                                                            className={`h-8 px-2 text-right font-mono text-[11px] font-bold ${
                                                                                isOver
                                                                                    ? 'border-rose-500 bg-rose-50 text-rose-700'
                                                                                    : 'border-teal-300 bg-teal-50/40 text-[#006565]'
                                                                            }`}
                                                                        />
                                                                    </td>
                                                                    <td
                                                                        className={`px-2 py-1.5 text-right font-mono font-extrabold whitespace-nowrap ${
                                                                            isOver
                                                                                ? 'text-rose-600'
                                                                                : 'text-emerald-700'
                                                                        }`}
                                                                    >
                                                                        {formatNum(
                                                                            sisa
                                                                        )}
                                                                    </td>
                                                                    <td className="px-1 py-1.5 text-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setDraftRows(
                                                                                    (
                                                                                        prev
                                                                                    ) =>
                                                                                        prev.filter(
                                                                                            (
                                                                                                _,
                                                                                                i
                                                                                            ) =>
                                                                                                i !==
                                                                                                idx
                                                                                        )
                                                                                )
                                                                            }
                                                                            className="text-neutral-400 hover:text-rose-600"
                                                                        >
                                                                            <Trash2 className="size-3.5" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }
                                                    )}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="border-t-2 border-teal-200 bg-teal-50/60 font-mono text-xs font-extrabold">
                                                        <td
                                                            colSpan={3}
                                                            className="px-3 py-2.5 text-center font-sans text-[#006565]"
                                                        >
                                                            JUMLAH TOTAL
                                                        </td>
                                                        <td className="px-2 py-2.5 text-right">
                                                            {formatNum(
                                                                draftSummary.totalAnggaran
                                                            )}
                                                        </td>
                                                        <td className="px-2 py-2.5 text-right">
                                                            {formatNum(
                                                                draftSummary.totalAkum
                                                            )}
                                                        </td>
                                                        <td className="px-2 py-2.5 text-right text-[#006565]">
                                                            {formatNum(
                                                                draftSummary.totalCair
                                                            )}
                                                        </td>
                                                        <td
                                                            className={`px-2 py-2.5 text-right ${
                                                                draftSummary.hasOverBudget
                                                                    ? 'text-rose-600'
                                                                    : 'text-emerald-700'
                                                            }`}
                                                        >
                                                            {formatNum(
                                                                draftSummary.totalSisa
                                                            )}
                                                        </td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        {draftSummary.hasOverBudget && (
                                            <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                                                <AlertTriangle className="size-4 shrink-0" />
                                                <span>
                                                    Terdapat rekening yang melebihi sisa pagu anggaran! Kurangi nominal Pencairan Saat Ini sebelum melanjutkan.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* LANGKAH 3: POTONGAN PAJAK & SIMPAN */}
                                {currentStep === 3 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                                            {[
                                                {
                                                    label: 'PPN (Rp)',
                                                    val: potPpn,
                                                    set: setPotPpn,
                                                },
                                                {
                                                    label: 'PPh Pasal 21 (Rp)',
                                                    val: potPph21,
                                                    set: setPotPph21,
                                                },
                                                {
                                                    label: 'PPh Pasal 22 (Rp)',
                                                    val: potPph22,
                                                    set: setPotPph22,
                                                },
                                                {
                                                    label: 'PPh Pasal 23 (Rp)',
                                                    val: potPph23,
                                                    set: setPotPph23,
                                                },
                                                {
                                                    label: 'PPh Pasal 4(2) (Rp)',
                                                    val: potPph42,
                                                    set: setPotPph42,
                                                },
                                            ].map((p) => (
                                                <div
                                                    key={p.label}
                                                    className="space-y-1"
                                                >
                                                    <Label className="text-xs font-bold">
                                                        {p.label}
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={p.val}
                                                        onChange={(e) =>
                                                            p.set(
                                                                e.target.value
                                                            )
                                                        }
                                                        className="h-9 bg-white font-mono text-xs"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid gap-3 rounded-xl border border-teal-200 bg-teal-50/50 p-4 sm:grid-cols-3">
                                            <div>
                                                <div className="text-[11px] font-bold text-neutral-500 uppercase">
                                                    Jumlah Yang Diminta
                                                </div>
                                                <div className="font-mono text-base font-extrabold text-neutral-900">
                                                    {formatRupiah(
                                                        draftSummary.totalCair
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-bold text-neutral-500 uppercase">
                                                    Total Potongan Pajak
                                                </div>
                                                <div className="font-mono text-base font-extrabold text-rose-600">
                                                    {formatRupiah(
                                                        draftSummary.totalPot
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-bold text-[#006565] uppercase">
                                                    Jumlah Yang Dibayarkan
                                                </div>
                                                <div className="font-mono text-lg font-extrabold text-[#006565]">
                                                    {formatRupiah(
                                                        draftSummary.dibayarkan
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold">
                                                Catatan Internal (Opsional)
                                            </Label>
                                            <Input
                                                value={catatan}
                                                onChange={(e) =>
                                                    setCatatan(e.target.value)
                                                }
                                                placeholder="Contoh: Pencairan tahap 3 untuk kegiatan GPM & SPPD November..."
                                                className="h-9 bg-white text-xs"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* FOOTER NAVIGASI WIZARD */}
                                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-teal-100 pt-4">
                                    <div>
                                        {currentStep > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    setCurrentStep(
                                                        (s) =>
                                                            (s - 1) as 1 | 2 | 3
                                                    )
                                                }
                                                className="gap-1.5 text-xs font-bold"
                                            >
                                                <ArrowLeft className="size-3.5" />
                                                Langkah Sebelumnya
                                            </Button>
                                        )}
                                    </div>

                                    <div>
                                        {currentStep < 3 ? (
                                            <Button
                                                type="button"
                                                onClick={handleNextStep}
                                                className="gap-1.5 bg-[#006565] px-5 text-xs font-extrabold text-white hover:bg-[#005252]"
                                            >
                                                Lanjut ke Langkah{' '}
                                                {currentStep + 1}
                                                <ArrowRight className="size-3.5" />
                                            </Button>
                                        ) : (
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="gap-2 bg-[#006565] px-6 text-xs font-extrabold text-white hover:bg-[#005252]"
                                            >
                                                <Save className="size-4" />
                                                {isSubmitting
                                                    ? 'Menyimpan...'
                                                    : 'Simpan NPD'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    )}
                </Card>

                {/* ========================================================= */}
                {/* TABEL DAFTAR NPD TERSIMPAN                                */}
                {/* ========================================================= */}
                <Card className="border-sidebar-border/70 shadow-xs">
                    <CardHeader className="border-b border-neutral-100 pb-4 dark:border-neutral-800">
                        <div className="flex flex-col gap-3">
                            <div>
                                <CardTitle className="text-base font-extrabold">
                                    Daftar Nota Pencairan Dana (NPD) Tersimpan (
                                    {filteredNpds.length} Dokumen)
                                </CardTitle>
                                <p className="text-xs text-neutral-500">
                                    Klik baris NPD untuk melihat rincian kode rekening, akumulasi, dan potongan pajak, atau klik <strong>Preview / Cetak PDF</strong>.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="w-full sm:w-40">
                                    <Select
                                        value={filterMonth}
                                        onValueChange={setFilterMonth}
                                    >
                                        <SelectTrigger className="h-9 bg-white text-xs">
                                            <SelectValue placeholder="Filter Bulan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">
                                                Semua Bulan
                                            </SelectItem>
                                            {MONTH_OPTIONS.map((m) => (
                                                <SelectItem
                                                    key={m.value}
                                                    value={m.value}
                                                >
                                                    {m.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-full sm:w-64">
                                    <Select
                                        value={filterSubId}
                                        onValueChange={setFilterSubId}
                                    >
                                        <SelectTrigger className="h-9 w-full min-w-0 overflow-hidden bg-white text-xs [&>span]:truncate">
                                            <SelectValue placeholder="Filter Sub Kegiatan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">
                                                Semua Sub Kegiatan
                                            </SelectItem>
                                            {subKegiatans.map((sk) => (
                                                <SelectItem
                                                    key={sk.id}
                                                    value={String(sk.id)}
                                                >
                                                    [{sk.kode_sub_kegiatan}]{' '}
                                                    {sk.sub_kegiatan}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="relative w-full sm:w-72">
                                    <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-neutral-400" />
                                    <Input
                                        placeholder="Cari nomor NPD, PPTK, uraian..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
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
                                    <tr className="border-b border-teal-200/80 bg-gradient-to-r from-teal-50/95 via-emerald-50/70 to-teal-50/95 text-[11px] font-extrabold tracking-wider text-[#005757] uppercase">
                                        <th className="w-10 px-3 py-3 text-center">
                                            #
                                        </th>
                                        <th className="px-4 py-3">
                                            Nomor &amp; Tanggal NPD
                                        </th>
                                        <th className="px-4 py-3">
                                            Sub Kegiatan
                                        </th>
                                        <th className="px-4 py-3">PPTK</th>
                                        <th className="px-4 py-3 text-right">
                                            Diminta
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Dibayarkan
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Preview PDF &amp; Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {filteredNpds.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-10 text-center text-neutral-400"
                                            >
                                                Belum ada Nota Pencairan Dana (NPD) tersimpan. Klik <strong>Buat NPD Baru</strong> di atas untuk memulai.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredNpds.map((npd, idx) => {
                                            const isExpanded = Boolean(
                                                expandedNpds[npd.id]
                                            );
                                            return (
                                                <React.Fragment key={npd.id}>
                                                    <tr
                                                        onClick={() =>
                                                            setExpandedNpds(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [npd.id]:
                                                                        !prev[
                                                                            npd
                                                                                .id
                                                                        ],
                                                                })
                                                            )
                                                        }
                                                        className={`cursor-pointer transition-colors ${
                                                            isExpanded
                                                                ? 'bg-teal-50/70'
                                                                : 'hover:bg-neutral-50/90'
                                                        }`}
                                                    >
                                                        <td className="px-3 py-3 text-center font-bold text-neutral-500">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className={`flex size-6 items-center justify-center rounded-md border ${
                                                                        isExpanded
                                                                            ? 'border-[#006565] bg-[#006565] text-white'
                                                                            : 'border-teal-200 bg-teal-50 text-[#006565]'
                                                                    }`}
                                                                >
                                                                    {isExpanded ? (
                                                                        <ChevronDown className="size-3.5" />
                                                                    ) : (
                                                                        <ChevronRight className="size-3.5" />
                                                                    )}
                                                                </span>
                                                                <div>
                                                                    <div className="font-mono font-extrabold text-neutral-900">
                                                                        {npd.nomor_npd ||
                                                                            `NPD #${npd.id}`}
                                                                    </div>
                                                                    <div className="text-[10px] text-neutral-500">
                                                                        {
                                                                            npd.tanggal_npd_formatted
                                                                        }{' '}
                                                                        &bull; TA{' '}
                                                                        {
                                                                            npd.tahun_anggaran
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="min-w-[220px] max-w-[320px] px-4 py-3">
                                                            <div className="font-bold leading-snug text-neutral-900 whitespace-normal">
                                                                {npd.sub_kegiatan
                                                                    ?.sub_kegiatan ||
                                                                    '-'}
                                                            </div>
                                                            <div className="text-[10px] text-neutral-500">
                                                                {npd.items.length}{' '}
                                                                rekening belanja
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-neutral-700">
                                                            {npd.pptk_nama}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                                                            {formatRupiah(
                                                                npd.total_pencairan_saat_ini
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                                            <div className="font-mono font-extrabold text-emerald-700">
                                                                {formatRupiah(
                                                                    npd.jumlah_dibayarkan
                                                                )}
                                                            </div>
                                                            {npd.total_potongan >
                                                                0 && (
                                                                <div className="text-[10px] text-rose-600">
                                                                    Pot:{' '}
                                                                    {formatRupiah(
                                                                        npd.total_potongan
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td
                                                            className="px-4 py-3 text-right whitespace-nowrap"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            <div className="inline-flex items-center gap-1.5">
                                                                <Button
                                                                    size="sm"
                                                                    asChild
                                                                    className="h-8 gap-1.5 bg-[#006565] px-2.5 text-xs font-bold text-white hover:bg-[#005252]"
                                                                >
                                                                    <a
                                                                        href={`/npd/${npd.id}/pdf`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                    >
                                                                        <Printer className="size-3.5" />
                                                                        <span>
                                                                            Preview / Cetak PDF
                                                                        </span>
                                                                    </a>
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        if (
                                                                            window.confirm(
                                                                                `Hapus ${npd.nomor_npd || `NPD #${npd.id}`}?`
                                                                            )
                                                                        ) {
                                                                            router.delete(
                                                                                `/npd/${npd.id}`,
                                                                                {
                                                                                    preserveScroll:
                                                                                        true,
                                                                                }
                                                                            );
                                                                        }
                                                                    }}
                                                                    className="h-8 px-2 text-rose-600 hover:bg-rose-50"
                                                                    title="Hapus NPD"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {isExpanded && (
                                                        <tr className="bg-neutral-50/90">
                                                            <td
                                                                colSpan={7}
                                                                className="border-b-2 border-teal-200 p-4"
                                                            >
                                                                <div className="rounded-xl border border-teal-200 bg-white p-3.5 shadow-2xs">
                                                                    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                                                                        <div className="text-xs font-extrabold text-[#006565]">
                                                                            Rincian Rekening —{' '}
                                                                            {
                                                                                npd.nomor_npd
                                                                            }
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                                                                            {npd.linked_sppd_dalam_kota_batches.map(
                                                                                (
                                                                                    b
                                                                                ) => (
                                                                                    <Badge
                                                                                        key={
                                                                                            b
                                                                                        }
                                                                                        variant="outline"
                                                                                        className="border-teal-300 bg-teal-50 text-[#006565]"
                                                                                    >
                                                                                        SPPD DK:{' '}
                                                                                        {
                                                                                            b
                                                                                        }
                                                                                    </Badge>
                                                                                )
                                                                            )}
                                                                            {npd.linked_sppd_luar_kota_batches.map(
                                                                                (
                                                                                    b
                                                                                ) => (
                                                                                    <Badge
                                                                                        key={
                                                                                            b
                                                                                        }
                                                                                        variant="outline"
                                                                                        className="border-indigo-300 bg-indigo-50 text-indigo-700"
                                                                                    >
                                                                                        SPPD LK:{' '}
                                                                                        {
                                                                                            b
                                                                                        }
                                                                                    </Badge>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <table className="w-full border-collapse text-left text-[11px]">
                                                                        <thead>
                                                                            <tr className="border-b bg-neutral-100 text-[10px] font-bold uppercase text-neutral-600">
                                                                                <th className="px-2 py-1.5 text-center w-8">
                                                                                    No
                                                                                </th>
                                                                                <th className="px-2 py-1.5">
                                                                                    Kode Rekening
                                                                                </th>
                                                                                <th className="px-2 py-1.5">
                                                                                    Uraian
                                                                                </th>
                                                                                <th className="px-2 py-1.5 text-right">
                                                                                    Anggaran
                                                                                </th>
                                                                                <th className="px-2 py-1.5 text-right">
                                                                                    Akumulasi Sblm
                                                                                </th>
                                                                                <th className="px-2 py-1.5 text-right">
                                                                                    Saat Ini
                                                                                </th>
                                                                                <th className="px-2 py-1.5 text-right">
                                                                                    Sisa
                                                                                </th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-neutral-100">
                                                                            {npd.items.map(
                                                                                (
                                                                                    it,
                                                                                    i
                                                                                ) => (
                                                                                    <tr
                                                                                        key={
                                                                                            it.id
                                                                                        }
                                                                                    >
                                                                                        <td className="px-2 py-1.5 text-center">
                                                                                            {i +
                                                                                                1}
                                                                                        </td>
                                                                                        <td className="px-2 py-1.5 font-mono">
                                                                                            {
                                                                                                it.kode_rekening
                                                                                            }
                                                                                        </td>
                                                                                        <td className="px-2 py-1.5">
                                                                                            {
                                                                                                it.uraian
                                                                                            }
                                                                                        </td>
                                                                                        <td className="px-2 py-1.5 text-right font-mono">
                                                                                            {formatNum(
                                                                                                it.anggaran
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="px-2 py-1.5 text-right font-mono">
                                                                                            {formatNum(
                                                                                                it.akumulasi_sebelumnya
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="px-2 py-1.5 text-right font-mono font-bold text-[#006565]">
                                                                                            {formatNum(
                                                                                                it.pencairan_saat_ini
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="px-2 py-1.5 text-right font-mono text-emerald-700">
                                                                                            {formatNum(
                                                                                                it.sisa
                                                                                            )}
                                                                                        </td>
                                                                                    </tr>
                                                                                )
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* ========================================================= */}
                {/* MODAL KELOLA MASTER PAGU REKENING                         */}
                {/* ========================================================= */}
                <Dialog open={paguModalOpen} onOpenChange={setPaguModalOpen}>
                    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-[#006565]">
                                <Settings2 className="size-4.5" />
                                Kelola Master Pagu Rekening per Sub Kegiatan
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Atur daftar kode rekening &amp; pagu anggaran 1x di awal tahun (atau paste langsung dari Excel/SIPD).
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                                <div className="space-y-1 sm:col-span-6">
                                    <Label className="text-xs font-bold">
                                        Sub Kegiatan
                                    </Label>
                                    <Select
                                        value={paguSubId}
                                        onValueChange={setPaguSubId}
                                    >
                                        <SelectTrigger className="h-9 w-full min-w-0 overflow-hidden text-xs [&>span]:truncate">
                                            <SelectValue placeholder="Pilih Sub Kegiatan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subKegiatans.map((sk) => (
                                                <SelectItem
                                                    key={sk.id}
                                                    value={String(sk.id)}
                                                >
                                                    [{sk.kode_sub_kegiatan}]{' '}
                                                    {sk.sub_kegiatan}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs font-bold">
                                        Tahun
                                    </Label>
                                    <Input
                                        type="number"
                                        value={paguTahun}
                                        onChange={(e) =>
                                            setPaguTahun(e.target.value)
                                        }
                                        className="h-9 font-mono text-xs"
                                    />
                                </div>
                                <div className="space-y-1 sm:col-span-4">
                                    <Label className="text-xs font-bold">
                                        Nama Program
                                    </Label>
                                    <Input
                                        value={paguProgram}
                                        onChange={(e) =>
                                            setPaguProgram(e.target.value)
                                        }
                                        className="h-9 text-xs"
                                    />
                                </div>
                            </div>

                            {/* FORM TAMBAH SATUAN + IMPOR PDF SIPD-RI + PASTE EXCEL */}
                            <form
                                onSubmit={handleAddSingleRekening}
                                className="rounded-xl border border-teal-200 bg-teal-50/40 p-3 space-y-2.5"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-xs font-extrabold text-[#006565]">
                                        Tambah Rekening Baru
                                    </span>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={
                                                showImportSipdPdf
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            onClick={() => {
                                                setShowImportSipdPdf((v) => !v);
                                                setShowPastePagu(false);
                                            }}
                                            className={
                                                showImportSipdPdf
                                                    ? 'h-7 gap-1 bg-[#006565] text-[11px] font-bold text-white hover:bg-[#005252]'
                                                    : 'h-7 gap-1 border-teal-300 bg-white text-[11px] font-bold text-[#006565] hover:bg-teal-50'
                                            }
                                        >
                                            <FileUp className="size-3" />
                                            Impor PDF SIPD-RI
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={
                                                showPastePagu
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            onClick={() => {
                                                setShowPastePagu((v) => !v);
                                                setShowImportSipdPdf(false);
                                            }}
                                            className={
                                                showPastePagu
                                                    ? 'h-7 gap-1 bg-emerald-600 text-[11px] font-bold text-white hover:bg-emerald-700'
                                                    : 'h-7 gap-1 border-emerald-300 bg-white text-[11px] font-bold text-emerald-700 hover:bg-emerald-50'
                                            }
                                        >
                                            <ClipboardPaste className="size-3" />
                                            Paste Massal dari Excel
                                        </Button>
                                    </div>
                                </div>

                                {showImportSipdPdf ? (
                                    <div className="space-y-3 rounded-lg border border-teal-200 bg-white p-3">
                                        <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-teal-300 bg-teal-50/40 px-4 py-4 text-center transition-colors hover:bg-teal-50">
                                            {isParsingSipdPdf ? (
                                                <>
                                                    <Loader2 className="size-5 animate-spin text-[#006565]" />
                                                    <span className="text-xs font-bold text-[#006565]">
                                                        Membaca &amp; mengekstrak rekening dari PDF SIPD-RI...
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <FileUp className="size-5 text-[#006565]" />
                                                    <span className="text-xs font-bold text-neutral-800">
                                                        Pilih File PDF RKA-BELANJA / DPA-BELANJA SKPD (SIPD-RI)
                                                    </span>
                                                    <span className="text-[11px] text-neutral-500">
                                                        Otomatis menarik Kode Rekening (6 segmen), Uraian, Jumlah Pagu, Tahun &amp; Program
                                                    </span>
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                accept="application/pdf,.pdf"
                                                disabled={isParsingSipdPdf}
                                                className="hidden"
                                                onChange={(e) => {
                                                    const f =
                                                        e.target.files?.[0] ||
                                                        null;
                                                    void handleSipdPdfUpload(f);
                                                    e.target.value = '';
                                                }}
                                            />
                                        </label>

                                        {sipdParsedMeta &&
                                            sipdParsedItems.length > 0 && (
                                                <div className="space-y-2.5">
                                                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-2 text-[11px]">
                                                        <div className="space-y-0.5">
                                                            <div className="flex flex-wrap items-center gap-1.5 font-bold text-[#006565]">
                                                                <Sparkles className="size-3.5" />
                                                                <span>
                                                                    {
                                                                        sipdParsedMeta.filename
                                                                    }
                                                                </span>
                                                                {sipdParsedMeta.tahun_anggaran && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="border-teal-300 bg-white text-[10px] text-[#006565]"
                                                                    >
                                                                        TA{' '}
                                                                        {
                                                                            sipdParsedMeta.tahun_anggaran
                                                                        }
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {sipdParsedMeta.kode_sub_kegiatan && (
                                                                <div className="text-[10px] text-neutral-600">
                                                                    Sub Kegiatan PDF:{' '}
                                                                    <span className="font-mono font-semibold">
                                                                        {
                                                                            sipdParsedMeta.kode_sub_kegiatan
                                                                        }
                                                                    </span>{' '}
                                                                    {
                                                                        sipdParsedMeta.nama_sub_kegiatan
                                                                    }
                                                                    {sipdParsedMeta.matched_sub_kegiatan_id ? (
                                                                        <span className="ml-1.5 font-bold text-emerald-700">
                                                                            (Cocok otomatis)
                                                                        </span>
                                                                    ) : (
                                                                        <span className="ml-1.5 font-bold text-amber-700">
                                                                            (Pastikan pilihan Sub Kegiatan di atas sesuai)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSipdParsedMeta(
                                                                    null
                                                                );
                                                                setSipdParsedItems(
                                                                    []
                                                                );
                                                            }}
                                                            className="rounded p-1 text-neutral-500 hover:bg-white hover:text-neutral-800"
                                                            title="Bersihkan hasil ekstraksi"
                                                        >
                                                            <X className="size-3.5" />
                                                        </button>
                                                    </div>

                                                    <div className="max-h-[220px] overflow-auto rounded-lg border">
                                                        <table className="w-full border-collapse text-left text-[11px]">
                                                            <thead className="sticky top-0 bg-neutral-100 text-[10px] font-bold uppercase text-neutral-600">
                                                                <tr>
                                                                    <th className="w-8 px-2 py-1.5 text-center">
                                                                        <Checkbox
                                                                            checked={
                                                                                sipdParsedItems.length >
                                                                                    0 &&
                                                                                sipdParsedItems.every(
                                                                                    (
                                                                                        it
                                                                                    ) =>
                                                                                        it.selected
                                                                                )
                                                                            }
                                                                            onCheckedChange={(
                                                                                val
                                                                            ) =>
                                                                                setSipdParsedItems(
                                                                                    (
                                                                                        prev
                                                                                    ) =>
                                                                                        prev.map(
                                                                                            (
                                                                                                it
                                                                                            ) => ({
                                                                                                ...it,
                                                                                                selected:
                                                                                                    Boolean(
                                                                                                        val
                                                                                                    ),
                                                                                            })
                                                                                        )
                                                                                )
                                                                            }
                                                                        />
                                                                    </th>
                                                                    <th className="w-40 px-2 py-1.5">
                                                                        Kode Rekening
                                                                    </th>
                                                                    <th className="px-2 py-1.5">
                                                                        Uraian
                                                                    </th>
                                                                    <th className="w-32 px-2 py-1.5 text-right">
                                                                        Jumlah Pagu (Rp)
                                                                    </th>
                                                                    <th className="w-16 px-2 py-1.5 text-center">
                                                                        Status
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-neutral-100">
                                                                {sipdParsedItems.map(
                                                                    (it) => {
                                                                        const existsInMaster =
                                                                            paguModalRekenings.some(
                                                                                (
                                                                                    r
                                                                                ) =>
                                                                                    r.kode_rekening.trim() ===
                                                                                    it.kode_rekening.trim()
                                                                            );
                                                                        return (
                                                                            <tr
                                                                                key={
                                                                                    it.uid
                                                                                }
                                                                                className={
                                                                                    it.selected
                                                                                        ? 'bg-white'
                                                                                        : 'bg-neutral-50 opacity-55'
                                                                                }
                                                                            >
                                                                                <td className="px-2 py-1.5 text-center">
                                                                                    <Checkbox
                                                                                        checked={
                                                                                            it.selected
                                                                                        }
                                                                                        onCheckedChange={(
                                                                                            val
                                                                                        ) =>
                                                                                            setSipdParsedItems(
                                                                                                (
                                                                                                    prev
                                                                                                ) =>
                                                                                                    prev.map(
                                                                                                        (
                                                                                                            row
                                                                                                        ) =>
                                                                                                            row.uid ===
                                                                                                            it.uid
                                                                                                                ? {
                                                                                                                      ...row,
                                                                                                                      selected:
                                                                                                                          Boolean(
                                                                                                                              val
                                                                                                                          ),
                                                                                                                  }
                                                                                                                : row
                                                                                                    )
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                </td>
                                                                                <td className="px-2 py-1">
                                                                                    <Input
                                                                                        value={
                                                                                            it.kode_rekening
                                                                                        }
                                                                                        onChange={(
                                                                                            e
                                                                                        ) =>
                                                                                            setSipdParsedItems(
                                                                                                (
                                                                                                    prev
                                                                                                ) =>
                                                                                                    prev.map(
                                                                                                        (
                                                                                                            row
                                                                                                        ) =>
                                                                                                            row.uid ===
                                                                                                            it.uid
                                                                                                                ? {
                                                                                                                      ...row,
                                                                                                                      kode_rekening:
                                                                                                                          e
                                                                                                                              .target
                                                                                                                              .value,
                                                                                                                  }
                                                                                                                : row
                                                                                                    )
                                                                                            )
                                                                                        }
                                                                                        className="h-7 font-mono text-[11px]"
                                                                                    />
                                                                                </td>
                                                                                <td className="px-2 py-1">
                                                                                    <Input
                                                                                        value={
                                                                                            it.uraian
                                                                                        }
                                                                                        onChange={(
                                                                                            e
                                                                                        ) =>
                                                                                            setSipdParsedItems(
                                                                                                (
                                                                                                    prev
                                                                                                ) =>
                                                                                                    prev.map(
                                                                                                        (
                                                                                                            row
                                                                                                        ) =>
                                                                                                            row.uid ===
                                                                                                            it.uid
                                                                                                                ? {
                                                                                                                      ...row,
                                                                                                                      uraian: e
                                                                                                                          .target
                                                                                                                          .value,
                                                                                                                  }
                                                                                                                : row
                                                                                                    )
                                                                                            )
                                                                                        }
                                                                                        className="h-7 text-[11px]"
                                                                                    />
                                                                                </td>
                                                                                <td className="px-2 py-1">
                                                                                    <Input
                                                                                        type="number"
                                                                                        min={
                                                                                            0
                                                                                        }
                                                                                        value={
                                                                                            it.anggaran
                                                                                        }
                                                                                        onChange={(
                                                                                            e
                                                                                        ) =>
                                                                                            setSipdParsedItems(
                                                                                                (
                                                                                                    prev
                                                                                                ) =>
                                                                                                    prev.map(
                                                                                                        (
                                                                                                            row
                                                                                                        ) =>
                                                                                                            row.uid ===
                                                                                                            it.uid
                                                                                                                ? {
                                                                                                                      ...row,
                                                                                                                      anggaran:
                                                                                                                          e
                                                                                                                              .target
                                                                                                                              .value,
                                                                                                                  }
                                                                                                                : row
                                                                                                    )
                                                                                            )
                                                                                        }
                                                                                        className="h-7 text-right font-mono text-[11px]"
                                                                                    />
                                                                                </td>
                                                                                <td className="px-2 py-1 text-center">
                                                                                    {existsInMaster ? (
                                                                                        <Badge className="bg-amber-100 text-[9px] text-amber-800 hover:bg-amber-100">
                                                                                            Update
                                                                                        </Badge>
                                                                                    ) : (
                                                                                        <Badge className="bg-emerald-100 text-[9px] text-emerald-800 hover:bg-emerald-100">
                                                                                            Baru
                                                                                        </Badge>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    }
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                                        <div className="text-xs font-bold text-neutral-700">
                                                            Total Terpilih:{' '}
                                                            <span className="font-mono text-[#006565]">
                                                                {formatRupiah(
                                                                    sipdParsedItems
                                                                        .filter(
                                                                            (
                                                                                it
                                                                            ) =>
                                                                                it.selected
                                                                        )
                                                                        .reduce(
                                                                            (
                                                                                acc,
                                                                                it
                                                                            ) =>
                                                                                acc +
                                                                                parseMoney(
                                                                                    it.anggaran
                                                                                ),
                                                                            0
                                                                        )
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setShowImportSipdPdf(
                                                                        false
                                                                    );
                                                                    setSipdParsedMeta(
                                                                        null
                                                                    );
                                                                    setSipdParsedItems(
                                                                        []
                                                                    );
                                                                }}
                                                                className="h-7 text-xs"
                                                            >
                                                                Batal
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                disabled={
                                                                    isSavingPagu ||
                                                                    sipdParsedItems.filter(
                                                                        (it) =>
                                                                            it.selected
                                                                    ).length ===
                                                                        0
                                                                }
                                                                onClick={
                                                                    handleSaveSipdParsedItems
                                                                }
                                                                className="h-7 bg-[#006565] text-xs font-bold text-white hover:bg-[#005252]"
                                                            >
                                                                Simpan{' '}
                                                                {
                                                                    sipdParsedItems.filter(
                                                                        (it) =>
                                                                            it.selected
                                                                    ).length
                                                                }{' '}
                                                                Rekening Terpilih
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                ) : showPastePagu ? (
                                    <div className="space-y-2">
                                        <textarea
                                            rows={4}
                                            value={pasteExcelPagu}
                                            onChange={(e) =>
                                                setPasteExcelPagu(
                                                    e.target.value
                                                )
                                            }
                                            placeholder={
                                                '5.1.02.04.01.0001\tBelanja Perjalanan Dinas Biasa\t8460000\n5.1.02.04.01.0003\tBelanja Perjalanan Dinas Dalam Kota\t8420000'
                                            }
                                            className="w-full rounded-lg border border-emerald-300 bg-white p-2 font-mono text-xs"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setShowPastePagu(false)
                                                }
                                                className="h-7 text-xs"
                                            >
                                                Batal
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                disabled={isSavingPagu}
                                                onClick={
                                                    handleBulkPasteRekening
                                                }
                                                className="h-7 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                                            >
                                                Impor Rekening
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                                        <Input
                                            value={newKodeRek}
                                            onChange={(e) =>
                                                setNewKodeRek(e.target.value)
                                            }
                                            placeholder="Kode Rekening (5.1.02...)"
                                            className="h-8 bg-white font-mono text-xs sm:col-span-3"
                                        />
                                        <Input
                                            value={newUraian}
                                            onChange={(e) =>
                                                setNewUraian(e.target.value)
                                            }
                                            placeholder="Uraian Belanja"
                                            className="h-8 bg-white text-xs sm:col-span-5"
                                        />
                                        <Input
                                            type="number"
                                            min={0}
                                            value={newAnggaran}
                                            onChange={(e) =>
                                                setNewAnggaran(e.target.value)
                                            }
                                            placeholder="Pagu (Rp)"
                                            className="h-8 bg-white font-mono text-xs sm:col-span-2"
                                        />
                                        <Button
                                            type="submit"
                                            size="sm"
                                            disabled={isSavingPagu}
                                            className="h-8 bg-[#006565] text-xs font-bold text-white hover:bg-[#005252] sm:col-span-2"
                                        >
                                            <Plus className="mr-1 size-3.5" />
                                            Tambah
                                        </Button>
                                    </div>
                                )}
                            </form>

                            {/* DAFTAR PAGU REKENING TERSIMPAN */}
                            <div className="max-h-[300px] overflow-auto rounded-xl border">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead className="sticky top-0 bg-teal-50 text-[10px] font-extrabold text-[#005757] uppercase">
                                        <tr>
                                            <th className="w-8 px-2 py-2 text-center">
                                                No
                                            </th>
                                            <th className="px-2 py-2">
                                                Kode Rekening
                                            </th>
                                            <th className="px-2 py-2">Uraian</th>
                                            <th className="px-2 py-2 text-right">
                                                Pagu Anggaran
                                            </th>
                                            <th className="px-2 py-2 text-right">
                                                Tercairkan
                                            </th>
                                            <th className="px-2 py-2 text-right">
                                                Sisa
                                            </th>
                                            <th className="w-10 px-2 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {paguModalRekenings.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="px-3 py-6 text-center text-neutral-400"
                                                >
                                                    Belum ada rekening pagu untuk Sub Kegiatan &amp; Tahun ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            paguModalRekenings.map((r, i) => (
                                                <tr key={r.id}>
                                                    <td className="px-2 py-1.5 text-center font-bold text-neutral-400">
                                                        {i + 1}
                                                    </td>
                                                    <td className="px-2 py-1.5 font-mono">
                                                        {r.kode_rekening}
                                                    </td>
                                                    <td className="px-2 py-1.5">
                                                        {r.uraian}
                                                    </td>
                                                    <td className="px-2 py-1.5 text-right font-mono font-bold">
                                                        {formatNum(r.anggaran)}
                                                    </td>
                                                    <td className="px-2 py-1.5 text-right font-mono text-neutral-600">
                                                        {formatNum(
                                                            r.akumulasi_tercairkan
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-1.5 text-right font-mono font-bold text-emerald-700">
                                                        {formatNum(
                                                            r.sisa_anggaran
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-1.5 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (
                                                                    window.confirm(
                                                                        `Hapus rekening ${r.kode_rekening}?`
                                                                    )
                                                                ) {
                                                                    router.delete(
                                                                        `/npd/rekening/${r.id}`,
                                                                        {
                                                                            preserveScroll:
                                                                                true,
                                                                        }
                                                                    );
                                                                }
                                                            }}
                                                            className="text-rose-500 hover:text-rose-700"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* ========================================================= */}
                {/* MODAL PILIH BATCH SPPD UNTUK DITARIK KE NPD               */}
                {/* ========================================================= */}
                <Dialog open={sppdPickerOpen} onOpenChange={setSppdPickerOpen}>
                    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-[#006565]">
                                <Link2 className="size-4" />
                                Tarik Nominal dari Batch{' '}
                                {sppdPickerMode === 'dk'
                                    ? 'SPPD Dalam Kota (5.1.02.04.01.0003)'
                                    : 'SPPD Luar Kota (5.1.02.04.01.0001)'}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Centang satu atau beberapa batch SPPD. Nominal total akan otomatis mengisi kolom Pencairan Saat Ini.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[340px] space-y-2 overflow-y-auto py-1">
                            {availableSppdBatches.length === 0 ? (
                                <div className="py-8 text-center text-xs text-neutral-400">
                                    Belum ada Batch SPPD tersedia.
                                </div>
                            ) : (
                                availableSppdBatches.map((b) => {
                                    const checked = tempSelectedBatches.includes(
                                        b.batch_code
                                    );
                                    const alreadyUsed = Boolean(
                                        b.already_linked_npd
                                    );
                                    return (
                                        <label
                                            key={b.batch_code}
                                            className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-xs transition-colors ${
                                                checked
                                                    ? 'border-[#006565] bg-teal-50/70'
                                                    : alreadyUsed
                                                      ? 'border-neutral-200 bg-neutral-50 opacity-65'
                                                      : 'border-neutral-200 bg-white hover:bg-neutral-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Checkbox
                                                    checked={checked}
                                                    disabled={alreadyUsed}
                                                    onCheckedChange={(val) => {
                                                        setTempSelectedBatches(
                                                            (prev) =>
                                                                val
                                                                    ? [
                                                                          ...prev,
                                                                          b.batch_code,
                                                                      ]
                                                                    : prev.filter(
                                                                          (c) =>
                                                                              c !==
                                                                              b.batch_code
                                                                      )
                                                        );
                                                    }}
                                                />
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono font-extrabold">
                                                            {b.batch_code}
                                                        </span>
                                                        <Badge variant="outline">
                                                            {b.spt_count} SPPD
                                                        </Badge>
                                                        {alreadyUsed && (
                                                            <Badge className="bg-amber-100 text-[10px] text-amber-800">
                                                                Sudah di{' '}
                                                                {
                                                                    b.already_linked_npd
                                                                }
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-neutral-500">
                                                        {b.tanggal_label}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="font-mono font-extrabold text-emerald-700">
                                                {formatRupiah(b.total_biaya)}
                                            </div>
                                        </label>
                                    );
                                })
                            )}
                        </div>

                        <DialogFooter className="border-t pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSppdPickerOpen(false)}
                                className="text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                onClick={handleApplySppdBatches}
                                className="bg-[#006565] text-xs font-extrabold text-white hover:bg-[#005252]"
                            >
                                Terapkan ke NPD ({tempSelectedBatches.length}{' '}
                                Batch)
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

NpdIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Nota Pencairan Dana (NPD)',
            href: '/npd',
        },
    ] satisfies BreadcrumbItem[],
};
