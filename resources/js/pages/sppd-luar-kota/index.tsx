import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    CalendarPlus,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Compass,
    Download,
    Edit3,
    FileCheck2,
    FileText,
    MapPin,
    Plus,
    Save,
    Search,
    Trash2,
    UserPlus,
    Users,
    Wallet,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    jabatan: string | null;
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
    tahun_anggaran: number;
    keterangan: string | null;
    is_active: boolean;
}

interface SppdLuarKotaParticipantItem {
    id: number;
    pegawai_id: number | null;
    urutan: number;
    nama: string;
    nip: string | null;
    pangkat: string | null;
    golongan: string | null;
    jabatan: string | null;
    uang_harian: number;
    uang_transport: number;
    total_biaya: number;
}

interface SppdLuarKotaChildItem {
    id: number;
    tanpa_surat?: boolean;
    pengirim_surat: string;
    nomor_surat: string | null;
    tanggal_surat: string;
    tanggal_surat_formatted: string;
    tanggal_spt: string;
    tanggal_spt_formatted: string;
    tanggal_berangkat: string;
    tanggal_berangkat_formatted: string;
    tanggal_kembali: string;
    tanggal_kembali_formatted: string;
    lama_hari: number;
    tujuan: string;
    alamat_lengkap: string;
    kab_kota?: string | null;
    perihal: string;
    kepala_dinas_id: number | null;
    pptk_id: number | null;
    bendahara_id: number | null;
    total_uang_harian: number;
    total_uang_transport: number;
    total_biaya: number;
    participants: SppdLuarKotaParticipantItem[];
}

interface SppdLuarKotaBatchGroup {
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
    } | null;
    first_tanggal_berangkat_formatted: string;
    last_tanggal_berangkat_formatted: string;
    tujuan_list: string[];
    employees: {
        pegawai_id: number | null;
        nama: string;
        golongan: string | null;
    }[];
    total_uang_harian: number;
    total_uang_transport: number;
    total_biaya: number;
    items: SppdLuarKotaChildItem[];
}

interface PageProps {
    sppdBatches: SppdLuarKotaBatchGroup[];
    pegawais: PegawaiItem[];
    kepalaDinasList: PejabatItem[];
    pptkList: PejabatItem[];
    bendaharaList: PejabatItem[];
    subKegiatans: SubKegiatanItem[];
    dpas: DpaItem[];
    statistics: {
        total_batches: number;
        total_sppd: number;
        total_personil: number;
        total_uang_harian: number;
        total_uang_transport: number;
        total_biaya: number;
    };
}

interface ParticipantFormRow {
    uid: string;
    pegawai_id: string;
    uang_harian: string;
    uang_transport: string;
}

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount || 0);
}

function calcLamaHari(berangkat: string, kembali: string): number {
    if (!berangkat || !kembali) return 1;
    const d1 = new Date(berangkat + 'T00:00:00');
    const d2 = new Date(kembali + 'T00:00:00');
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 1;
    const diff = Math.floor((d2.getTime() - d1.getTime()) / 86400000) + 1;
    return diff > 0 ? diff : 1;
}

const DEFAULT_DASAR_TANPA_SURAT =
    '1. Undang-Undang Nomor 18 Tahun 2012 tentang Pangan; 2. PP No.17 Tahun 2015 tentang Ketahanan Pangan dan Gizi.';

function isTanpaSuratValue(text?: string | null): boolean {
    const clean = (text || '').trim();
    if (!clean) return false;
    return (
        /^1\.\s+/.test(clean) ||
        clean.toLowerCase().includes('undang-undang') ||
        clean.toLowerCase().includes('pp no')
    );
}

const WIZARD_STEPS = [
    { step: 1, title: 'Sub Kegiatan & Batch', desc: 'Anggaran & kelompok batch' },
    { step: 2, title: 'Surat Dasar & Jadwal', desc: 'Pengirim, nomor & tanggal' },
    { step: 3, title: 'Tujuan & Perihal', desc: 'Lokasi, alamat & maksud' },
    { step: 4, title: 'Petugas & Biaya', desc: 'Personil, harian & transport' },
] as const;

export default function SppdLuarKotaIndex({
    sppdBatches = [],
    pegawais = [],
    kepalaDinasList = [],
    pptkList = [],
    bendaharaList = [],
    subKegiatans = [],
    dpas = [],
    statistics,
}: PageProps) {
    const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const activeDpas = useMemo(() => dpas.filter((d) => d.is_active), [dpas]);

    const defaultKadinId = String(
        kepalaDinasList.find((k) => k.is_active)?.id || kepalaDinasList[0]?.id || ''
    );
    const defaultPptkId = String(
        pptkList.find((p) => p.is_active)?.id || pptkList[0]?.id || ''
    );
    const defaultBendaharaId = String(
        bendaharaList.find((b) => b.is_active)?.id || bendaharaList[0]?.id || ''
    );

    // =========================================================================
    // STEP-BY-STEP WIZARD STATE (1 -> 2 -> 3 -> 4)
    // =========================================================================
    const [isFormExpanded, setIsFormExpanded] = useState(false);
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

    // Langkah 1 (sama persis dengan SPPD Dalam Kota)
    const [selectedSubKegiatanId, setSelectedSubKegiatanId] = useState('');
    const [selectedDpaId, setSelectedDpaId] = useState('');
    const [targetBatchSelection, setTargetBatchSelection] = useState('NEW');

    // Langkah 2: Surat Dasar & Jadwal
    const [tanpaSurat, setTanpaSurat] = useState(false);
    const [pengirimSurat, setPengirimSurat] = useState('');
    const [nomorSurat, setNomorSurat] = useState('');
    const [tanggalSurat, setTanggalSurat] = useState(todayStr);
    const [tanggalSpt, setTanggalSpt] = useState(todayStr);
    const [tanggalBerangkat, setTanggalBerangkat] = useState(todayStr);
    const [tanggalKembali, setTanggalKembali] = useState(todayStr);

    // Langkah 3: Tujuan, Alamat Lengkap, Kab/Kota, Perihal & Pejabat
    const [tujuan, setTujuan] = useState('');
    const [alamatLengkap, setAlamatLengkap] = useState('');
    const [kabKota, setKabKota] = useState('');
    const [perihal, setPerihal] = useState('');
    const [kepalaDinasId, setKepalaDinasId] = useState(defaultKadinId);
    const [pptkId, setPptkId] = useState(defaultPptkId);
    const [bendaharaId, setBendaharaId] = useState(defaultBendaharaId);

    // Langkah 4: Petugas Berangkat (1, 2, 3...) & Biaya
    const [participants, setParticipants] = useState<ParticipantFormRow[]>([
        {
            uid: `lk-pt-${Date.now()}-1`,
            pegawai_id: '',
            uang_harian: '430000',
            uang_transport: '0',
        },
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Table state (default rincian tersembunyi)
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedBatches, setExpandedBatches] = useState<
        Record<string, boolean>
    >({});

    // Edit Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] =
        useState<SppdLuarKotaChildItem | null>(null);
    const [editingBatchCode, setEditingBatchCode] = useState('');
    const [eTanpaSurat, setETanpaSurat] = useState(false);
    const [ePengirim, setEPengirim] = useState('');
    const [eNomorSurat, setENomorSurat] = useState('');
    const [eTanggalSurat, setETanggalSurat] = useState('');
    const [eTanggalSpt, setETanggalSpt] = useState('');
    const [eTanggalBerangkat, setETanggalBerangkat] = useState('');
    const [eTanggalKembali, setETanggalKembali] = useState('');
    const [eTujuan, setETujuan] = useState('');
    const [eAlamat, setEAlamat] = useState('');
    const [eKabKota, setEKabKota] = useState('');
    const [ePerihal, setEPerihal] = useState('');
    const [eKadinId, setEKadinId] = useState('');
    const [ePptkId, setEPptkId] = useState('');
    const [eBendaharaId, setEBendaharaId] = useState('');
    const [eParticipants, setEParticipants] = useState<ParticipantFormRow[]>(
        []
    );
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Modal pilih jenis kendaraan untuk Download PDF SPPD
    const [sppdVehicleModalOpen, setSppdVehicleModalOpen] = useState(false);
    const [sppdVehicleBatchCode, setSppdVehicleBatchCode] = useState('');
    const [selectedVehicleType, setSelectedVehicleType] = useState<string>(
        'Kendaraan Umum'
    );

    const handleOpenSppdVehicleModal = (batchCode: string) => {
        setSppdVehicleBatchCode(batchCode);
        setSelectedVehicleType('Kendaraan Umum');
        setSppdVehicleModalOpen(true);
    };

    const handleConfirmDownloadSppdPdf = () => {
        if (!sppdVehicleBatchCode) return;
        const url = `/sppd-luar-kota/batch/${encodeURIComponent(sppdVehicleBatchCode)}/sppd-pdf?alat_angkut=${encodeURIComponent(selectedVehicleType)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        setSppdVehicleModalOpen(false);
    };

    const activeSubKegiatanObj = useMemo(
        () =>
            subKegiatans.find(
                (s) => String(s.id) === String(selectedSubKegiatanId)
            ) || null,
        [subKegiatans, selectedSubKegiatanId]
    );

    const activeDpaObj = useMemo(
        () => dpas.find((d) => String(d.id) === String(selectedDpaId)) || null,
        [dpas, selectedDpaId]
    );

    const lamaHari = useMemo(
        () => calcLamaHari(tanggalBerangkat, tanggalKembali),
        [tanggalBerangkat, tanggalKembali]
    );

    const formTotals = useMemo(() => {
        return participants.reduce(
            (acc, pt) => {
                const uh = Number(pt.uang_harian) || 0;
                const ut = Number(pt.uang_transport) || 0;
                acc.harian += uh;
                acc.transport += ut;
                acc.total += uh + ut;
                return acc;
            },
            { harian: 0, transport: 0, total: 0 }
        );
    }, [participants]);

    const filteredBatches = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return sppdBatches;
        return sppdBatches.filter(
            (b) =>
                b.batch_code.toLowerCase().includes(q) ||
                b.tujuan_list.some((t) => t.toLowerCase().includes(q)) ||
                b.employees.some((e) => e.nama.toLowerCase().includes(q)) ||
                (b.sub_kegiatan &&
                    b.sub_kegiatan.sub_kegiatan.toLowerCase().includes(q)) ||
                b.items.some(
                    (it) =>
                        it.pengirim_surat.toLowerCase().includes(q) ||
                        it.perihal.toLowerCase().includes(q)
                )
        );
    }, [sppdBatches, searchQuery]);

    const handleNextStep = () => {
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
            if (!pengirimSurat.trim()) {
                toast.error(
                    tanpaSurat
                        ? 'Dasar surat SPT wajib diisi.'
                        : 'Pengirim surat wajib diisi.'
                );
                return;
            }
            if (
                (!tanpaSurat && !tanggalSurat) ||
                !tanggalSpt ||
                !tanggalBerangkat ||
                !tanggalKembali
            ) {
                toast.error(
                    'Tanggal surat, tanggal SPT, berangkat, dan kembali wajib diisi.'
                );
                return;
            }
            if (tanggalKembali < tanggalBerangkat) {
                toast.error(
                    'Tanggal kembali tidak boleh lebih awal dari tanggal berangkat.'
                );
                return;
            }
            setCurrentStep(3);
            return;
        }

        if (currentStep === 3) {
            if (!tujuan.trim()) {
                toast.error('Tujuan perjalanan wajib diisi.');
                return;
            }
            if (!alamatLengkap.trim()) {
                toast.error('Alamat lengkap wajib diisi.');
                return;
            }
            if (!kabKota.trim()) {
                toast.error('Kab/Kota wajib diisi.');
                return;
            }
            if (!perihal.trim()) {
                toast.error('Perihal surat wajib diisi.');
                return;
            }
            setCurrentStep(4);
        }
    };

    const handleAddParticipant = () => {
        const last = participants[participants.length - 1];
        setParticipants((prev) => [
            ...prev,
            {
                uid: `lk-pt-${Date.now()}-${prev.length + 1}`,
                pegawai_id: '',
                uang_harian: last?.uang_harian || '430000',
                uang_transport: last?.uang_transport || '0',
            },
        ]);
    };

    const handleRemoveParticipant = (idx: number) => {
        setParticipants((prev) =>
            prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)
        );
    };

    const handleUpdateParticipant = (
        idx: number,
        field: keyof ParticipantFormRow,
        value: string
    ) => {
        setParticipants((prev) =>
            prev.map((pt, i) => (i === idx ? { ...pt, [field]: value } : pt))
        );
    };

    const handleToggleTanpaSurat = (checked: boolean) => {
        setTanpaSurat(checked);
        if (checked) {
            setPengirimSurat(DEFAULT_DASAR_TANPA_SURAT);
            setNomorSurat('');
        } else if (pengirimSurat.trim() === DEFAULT_DASAR_TANPA_SURAT) {
            setPengirimSurat('');
        }
    };

    const handleToggleEditTanpaSurat = (checked: boolean) => {
        setETanpaSurat(checked);
        if (checked) {
            setEPengirim(DEFAULT_DASAR_TANPA_SURAT);
            setENomorSurat('');
        } else if (ePengirim.trim() === DEFAULT_DASAR_TANPA_SURAT) {
            setEPengirim('');
        }
    };

    const resetWizardForm = () => {
        setCurrentStep(1);
        setSelectedSubKegiatanId('');
        setSelectedDpaId('');
        setTargetBatchSelection('NEW');
        setTanpaSurat(false);
        setPengirimSurat('');
        setNomorSurat('');
        setTanggalSurat(todayStr);
        setTanggalSpt(todayStr);
        setTanggalBerangkat(todayStr);
        setTanggalKembali(todayStr);
        setTujuan('');
        setAlamatLengkap('');
        setKabKota('');
        setPerihal('');
        setParticipants([
            {
                uid: `lk-pt-${Date.now()}-1`,
                pegawai_id: '',
                uang_harian: '430000',
                uang_transport: '0',
            },
        ]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (participants.some((p) => !p.pegawai_id)) {
            toast.error('Semua baris petugas wajib dipilih namanya.');
            return;
        }

        setIsSubmitting(true);
        router.post(
            '/sppd-luar-kota/sppd',
            {
                batch_code: targetBatchSelection,
                sub_kegiatan_id: Number(selectedSubKegiatanId),
                dpa_id: Number(selectedDpaId),
                tanpa_surat: tanpaSurat,
                pengirim_surat:
                    tanpaSurat && !pengirimSurat.trim()
                        ? DEFAULT_DASAR_TANPA_SURAT
                        : pengirimSurat.trim(),
                nomor_surat: tanpaSurat ? null : nomorSurat.trim() || null,
                tanggal_surat: tanpaSurat
                    ? tanggalSpt || todayStr
                    : tanggalSurat,
                tanggal_spt: tanggalSpt,
                tanggal_berangkat: tanggalBerangkat,
                tanggal_kembali: tanggalKembali,
                tujuan: tujuan.trim(),
                alamat_lengkap: alamatLengkap.trim(),
                kab_kota: kabKota.trim(),
                perihal: perihal.trim(),
                kepala_dinas_id: kepalaDinasId ? Number(kepalaDinasId) : null,
                pptk_id: pptkId ? Number(pptkId) : null,
                bendahara_id: bendaharaId ? Number(bendaharaId) : null,
                participants: participants.map((p) => ({
                    pegawai_id: Number(p.pegawai_id),
                    uang_harian: Number(p.uang_harian) || 0,
                    uang_transport: Number(p.uang_transport) || 0,
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Data SPPD Luar Kota berhasil disimpan.');
                    resetWizardForm();
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(
                        typeof first === 'string'
                            ? first
                            : 'Gagal menyimpan SPPD Luar Kota.'
                    );
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const handleAppendToBatch = (
        grp: SppdLuarKotaBatchGroup,
        e: React.MouseEvent
    ) => {
        e.stopPropagation();
        setSelectedSubKegiatanId(
            grp.sub_kegiatan_id ? String(grp.sub_kegiatan_id) : ''
        );
        setSelectedDpaId(grp.dpa_id ? String(grp.dpa_id) : '');
        setTargetBatchSelection(grp.batch_code);
        setTanpaSurat(false);
        setPengirimSurat('');
        setNomorSurat('');
        setTanggalSurat(todayStr);
        setTanggalSpt(todayStr);
        setTanggalBerangkat(todayStr);
        setTanggalKembali(todayStr);
        setTujuan('');
        setAlamatLengkap('');
        setKabKota('');
        setPerihal('');
        setParticipants([
            {
                uid: `lk-pt-${Date.now()}-1`,
                pegawai_id: '',
                uang_harian: '430000',
                uang_transport: '0',
            },
        ]);
        setCurrentStep(2);
        setIsFormExpanded(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast.info(
            `Langkah 1 terisi data Batch ${grp.batch_code}. Silakan lanjutkan input di Langkah 2.`
        );
    };

    const handleOpenEdit = (
        item: SppdLuarKotaChildItem,
        batchCode: string
    ) => {
        const isNoLetter =
            Boolean(item.tanpa_surat) || isTanpaSuratValue(item.pengirim_surat);
        setEditingItem(item);
        setEditingBatchCode(batchCode);
        setETanpaSurat(isNoLetter);
        setEPengirim(item.pengirim_surat);
        setENomorSurat(isNoLetter ? '' : item.nomor_surat || '');
        setETanggalSurat(item.tanggal_surat);
        setETanggalSpt(item.tanggal_spt || item.tanggal_berangkat);
        setETanggalBerangkat(item.tanggal_berangkat);
        setETanggalKembali(item.tanggal_kembali);
        setETujuan(item.tujuan);
        setEAlamat(item.alamat_lengkap);
        setEKabKota(item.kab_kota || '');
        setEPerihal(item.perihal);
        setEKadinId(
            item.kepala_dinas_id ? String(item.kepala_dinas_id) : defaultKadinId
        );
        setEPptkId(item.pptk_id ? String(item.pptk_id) : defaultPptkId);
        setEBendaharaId(
            item.bendahara_id ? String(item.bendahara_id) : defaultBendaharaId
        );
        setEParticipants(
            item.participants.map((pt, idx) => ({
                uid: `edit-lk-${pt.id}-${idx}`,
                pegawai_id: pt.pegawai_id ? String(pt.pegawai_id) : '',
                uang_harian: String(pt.uang_harian || 0),
                uang_transport: String(pt.uang_transport || 0),
            }))
        );
        setEditModalOpen(true);
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        if (eParticipants.some((p) => !p.pegawai_id)) {
            toast.error('Semua baris petugas wajib dipilih.');
            return;
        }

        setIsSavingEdit(true);
        router.put(
            `/sppd-luar-kota/sppd/${editingItem.id}`,
            {
                tanpa_surat: eTanpaSurat,
                pengirim_surat:
                    eTanpaSurat && !ePengirim.trim()
                        ? DEFAULT_DASAR_TANPA_SURAT
                        : ePengirim.trim(),
                nomor_surat: eTanpaSurat ? null : eNomorSurat.trim() || null,
                tanggal_surat: eTanpaSurat
                    ? eTanggalSpt || todayStr
                    : eTanggalSurat,
                tanggal_spt: eTanggalSpt,
                tanggal_berangkat: eTanggalBerangkat,
                tanggal_kembali: eTanggalKembali,
                tujuan: eTujuan.trim(),
                alamat_lengkap: eAlamat.trim(),
                kab_kota: eKabKota.trim(),
                perihal: ePerihal.trim(),
                kepala_dinas_id: eKadinId ? Number(eKadinId) : null,
                pptk_id: ePptkId ? Number(ePptkId) : null,
                bendahara_id: eBendaharaId ? Number(eBendaharaId) : null,
                participants: eParticipants.map((p) => ({
                    pegawai_id: Number(p.pegawai_id),
                    uang_harian: Number(p.uang_harian) || 0,
                    uang_transport: Number(p.uang_transport) || 0,
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Data SPPD Luar Kota berhasil diperbarui.');
                    setEditModalOpen(false);
                    setEditingItem(null);
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(
                        typeof first === 'string'
                            ? first
                            : 'Gagal memperbarui SPPD Luar Kota.'
                    );
                },
                onFinish: () => setIsSavingEdit(false),
            }
        );
    };

    const toggleExpandBatch = (batchCode: string) => {
        setExpandedBatches((prev) => ({
            ...prev,
            [batchCode]: !prev[batchCode],
        }));
    };

    return (
        <>
            <Head title="SPPD Luar Kota - DKPP Indramayu" />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                {/* HEADER */}
                <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#006565] text-white shadow-sm">
                        <Compass className="size-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            Modul SPPD Luar Kota
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Input perjalanan dinas luar kota secara bertahap (Step-by-Step) dan terkelompok rapi per Batch.
                        </p>
                    </div>
                </div>

                {/* KPI SUMMARY CARDS (COMPACT & MODERN) */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-white via-teal-50/30 to-emerald-50/40 px-4 py-3 shadow-2xs dark:border-teal-900/60 dark:from-neutral-900">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#006565] to-teal-600 text-white shadow-xs">
                                <FileCheck2 className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[10.5px] font-bold tracking-wider text-teal-700/80 uppercase">
                                    Batch &amp; SPPD Luar Kota
                                </div>
                                <div className="mt-0.5 flex items-baseline gap-1.5">
                                    <span className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100">
                                        {statistics.total_batches} Batch
                                    </span>
                                    <span className="rounded-md bg-teal-100/80 px-1.5 py-0.5 text-[10px] font-bold text-[#006565]">
                                        {statistics.total_sppd} SPPD
                                    </span>
                                </div>
                                <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                                    {statistics.total_personil} total petugas berangkat
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-white via-sky-50/30 to-blue-50/30 px-4 py-3 shadow-2xs dark:border-sky-900/60 dark:from-neutral-900">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-blue-600 text-white shadow-xs">
                                <Users className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[10.5px] font-bold tracking-wider text-sky-700/80 uppercase">
                                    Total Uang Harian
                                </div>
                                <div className="mt-0.5 truncate font-mono text-lg font-extrabold text-sky-800 dark:text-sky-300">
                                    {formatRupiah(statistics.total_uang_harian)}
                                </div>
                                <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                                    Akumulasi uang harian luar kota
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 px-4 py-3 shadow-2xs dark:border-emerald-900/60 dark:from-neutral-900">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-xs">
                                <MapPin className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[10.5px] font-bold tracking-wider text-emerald-700/80 uppercase">
                                    Total Uang Transport
                                </div>
                                <div className="mt-0.5 truncate font-mono text-lg font-extrabold text-emerald-800 dark:text-emerald-300">
                                    {formatRupiah(
                                        statistics.total_uang_transport
                                    )}
                                </div>
                                <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                                    Akumulasi biaya transportasi
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-white via-amber-50/30 to-orange-50/30 px-4 py-3 shadow-2xs dark:border-amber-900/60 dark:from-neutral-900">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-xs">
                                <Wallet className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[10.5px] font-bold tracking-wider text-amber-700/80 uppercase">
                                    Total Biaya SPPD
                                </div>
                                <div className="mt-0.5 truncate font-mono text-lg font-extrabold text-amber-800 dark:text-amber-300">
                                    {formatRupiah(statistics.total_biaya)}
                                </div>
                                <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                                    Uang harian + uang transport
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* FORM INPUT STEP-BY-STEP WIZARD (COLLAPSIBLE / MINIMIZE)   */}
                {/* ========================================================= */}
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
                                            Form Input SPPD Luar Kota
                                        </CardTitle>
                                        <Badge className="bg-teal-100 text-[10px] font-bold text-[#006565] dark:bg-teal-900/60 dark:text-teal-200">
                                            Langkah {currentStep} / 4
                                        </Badge>
                                    </div>
                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                        {isFormExpanded
                                            ? 'Lengkapi data perjalanan dinas luar kota secara bertahap (Langkah 1 s/d 4).'
                                            : 'Form sedang disembunyikan agar tampilan rapi. Klik untuk membuka form input SPPD Luar Kota.'}
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
                                        <span>Buka Form Input</span>
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* STEPPER INDICATOR (HANYA TAMPIL SAAT EXPANDED) */}
                        {isFormExpanded && (
                            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                            <form onSubmit={handleSubmit} className="space-y-5">
                            {/* LANGKAH 1: SUB KEGIATAN, NOMOR DPA & BATCH (SAMA DENGAN SPPD DALAM KOTA) */}
                            {currentStep === 1 && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-12">
                                        <div className="min-w-0 space-y-1.5 md:col-span-12">
                                            <Label className="text-xs font-extrabold text-[#006565] dark:text-teal-300">
                                                1. Pilih Sub Kegiatan *
                                            </Label>
                                            <Select
                                                value={selectedSubKegiatanId}
                                                onValueChange={
                                                    setSelectedSubKegiatanId
                                                }
                                            >
                                                <SelectTrigger className="h-10 w-full min-w-0 overflow-hidden border-teal-300 bg-white text-xs font-semibold [&>span]:truncate dark:bg-neutral-900">
                                                    <SelectValue placeholder="-- Pilih Sub Kegiatan --" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {subKegiatans.map((sk) => (
                                                        <SelectItem
                                                            key={sk.id}
                                                            value={String(sk.id)}
                                                        >
                                                            [
                                                            {
                                                                sk.kode_sub_kegiatan
                                                            }
                                                            ] {sk.sub_kegiatan}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="min-w-0 space-y-1.5 md:col-span-6">
                                            <Label className="text-xs font-extrabold text-[#006565] dark:text-teal-300">
                                                2. Pilih Nomor DPA (Aktif) *
                                            </Label>
                                            <Select
                                                value={selectedDpaId}
                                                onValueChange={setSelectedDpaId}
                                            >
                                                <SelectTrigger className="h-10 w-full min-w-0 overflow-hidden border-teal-300 bg-white text-xs font-semibold [&>span]:truncate dark:bg-neutral-900">
                                                    <SelectValue placeholder="-- Pilih Nomor DPA --" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {activeDpas.map((d) => (
                                                        <SelectItem
                                                            key={d.id}
                                                            value={String(d.id)}
                                                        >
                                                            {d.nomor_dpa} (TA{' '}
                                                            {d.tahun_anggaran})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="min-w-0 space-y-1.5 md:col-span-6">
                                            <Label className="text-xs font-extrabold text-[#006565] dark:text-teal-300">
                                                3. Masukkan ke Batch *
                                            </Label>
                                            <Select
                                                value={targetBatchSelection}
                                                onValueChange={
                                                    setTargetBatchSelection
                                                }
                                            >
                                                <SelectTrigger className="h-10 w-full min-w-0 overflow-hidden border-teal-300 bg-white text-xs font-bold [&>span]:truncate dark:bg-neutral-900">
                                                    <SelectValue placeholder="-- Pilih Kelompok Batch --" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="NEW">
                                                        + Buat Batch Baru Terpisah
                                                    </SelectItem>
                                                    {sppdBatches.map((b) => (
                                                        <SelectItem
                                                            key={b.batch_code}
                                                            value={b.batch_code}
                                                        >
                                                            Gabung ke:{' '}
                                                            {b.batch_code} (
                                                            {b.spt_count} SPPD)
                                                        </SelectItem>
                                                    ))}
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
                                                <div className="font-mono font-extrabold text-[#006565]">
                                                    {
                                                        activeSubKegiatanObj.kode_sub_kegiatan
                                                    }
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold uppercase text-neutral-400">
                                                    Nomor Rekening
                                                </span>
                                                <div className="font-mono font-extrabold">
                                                    {
                                                        activeSubKegiatanObj.no_rekening
                                                    }
                                                </div>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <span className="text-[10px] font-bold uppercase text-neutral-400">
                                                    Sub Kegiatan &amp; DPA
                                                </span>
                                                <div className="font-bold text-neutral-800 dark:text-neutral-200">
                                                    {
                                                        activeSubKegiatanObj.sub_kegiatan
                                                    }
                                                </div>
                                                {activeDpaObj && (
                                                    <div className="font-mono text-[11px] text-neutral-500">
                                                        DPA:{' '}
                                                        {activeDpaObj.nomor_dpa}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* LANGKAH 2: SURAT DASAR & JADWAL */}
                            {currentStep === 2 && (
                                <div className="space-y-4">
                                    {/* OPTION TANPA SURAT SEBELUM FIELD PENGIRIM SURAT */}
                                    <div className="rounded-xl border border-teal-200/80 bg-white/90 p-3.5 shadow-2xs dark:border-teal-900/60 dark:bg-neutral-900">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <label className="flex cursor-pointer items-start gap-2.5 select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={tanpaSurat}
                                                    onChange={(e) =>
                                                        handleToggleTanpaSurat(
                                                            e.target.checked
                                                        )
                                                    }
                                                    className="mt-0.5 size-4 rounded border-teal-300 text-[#006565] focus:ring-[#006565]"
                                                />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-extrabold text-[#006565] dark:text-teal-300">
                                                            Tanpa Surat (Gunakan Dasar Regulasi Default di SPT)
                                                        </span>
                                                        {tanpaSurat && (
                                                            <Badge className="bg-teal-100 text-[10px] font-bold text-[#006565]">
                                                                Aktif
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                                                        Jika dicentang, Dasar Surat di SPT otomatis terisi:{' '}
                                                        <strong className="text-neutral-700 dark:text-neutral-200">
                                                            {
                                                                DEFAULT_DASAR_TANPA_SURAT
                                                            }
                                                        </strong>
                                                    </p>
                                                </div>
                                            </label>

                                            <div className="inline-flex shrink-0 rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 dark:border-neutral-800 dark:bg-neutral-800">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleTanpaSurat(
                                                            false
                                                        )
                                                    }
                                                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
                                                        !tanpaSurat
                                                            ? 'bg-white text-[#006565] shadow-2xs dark:bg-neutral-900 dark:text-teal-300'
                                                            : 'text-neutral-500 hover:text-neutral-800'
                                                    }`}
                                                >
                                                    Dengan Surat
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleTanpaSurat(
                                                            true
                                                        )
                                                    }
                                                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
                                                        tanpaSurat
                                                            ? 'bg-[#006565] text-white shadow-2xs'
                                                            : 'text-neutral-500 hover:text-neutral-800'
                                                    }`}
                                                >
                                                    Tanpa Surat
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-12">
                                        <div className="min-w-0 space-y-1.5 md:col-span-7">
                                            <Label className="text-xs font-bold">
                                                {tanpaSurat
                                                    ? 'Dasar Surat di SPT (Tanpa Surat) *'
                                                    : 'Pengirim Surat *'}
                                            </Label>
                                            <Input
                                                value={pengirimSurat}
                                                onChange={(e) =>
                                                    setPengirimSurat(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={
                                                    tanpaSurat
                                                        ? DEFAULT_DASAR_TANPA_SURAT
                                                        : 'Contoh: Dinas Ketahanan Pangan dan Peternakan Provinsi Jawa Barat'
                                                }
                                                className="h-10 bg-white text-xs dark:bg-neutral-900"
                                                required
                                            />
                                        </div>

                                        <div className="min-w-0 space-y-1.5 md:col-span-5">
                                            <Label className="text-xs font-bold">
                                                Nomor Surat
                                            </Label>
                                            <Input
                                                value={nomorSurat}
                                                onChange={(e) =>
                                                    setNomorSurat(
                                                        e.target.value
                                                    )
                                                }
                                                disabled={tanpaSurat}
                                                placeholder={
                                                    tanpaSurat
                                                        ? '- (Tanpa Nomor Surat)'
                                                        : 'Contoh: 005/1234/DKPP-Jabar'
                                                }
                                                className="h-10 bg-white text-xs disabled:bg-neutral-100 disabled:text-neutral-400 dark:bg-neutral-900"
                                            />
                                        </div>

                                        <div className="min-w-0 space-y-1.5 md:col-span-3">
                                            <Label className="text-xs font-bold">
                                                Tanggal Surat {!tanpaSurat && '*'}
                                            </Label>
                                            <Input
                                                type="date"
                                                value={tanggalSurat}
                                                onChange={(e) =>
                                                    setTanggalSurat(
                                                        e.target.value
                                                    )
                                                }
                                                disabled={tanpaSurat}
                                                className="h-10 bg-white text-xs disabled:bg-neutral-100 disabled:text-neutral-400 dark:bg-neutral-900"
                                                required={!tanpaSurat}
                                            />
                                        </div>

                                        <div className="min-w-0 space-y-1.5 md:col-span-3">
                                            <Label className="text-xs font-bold text-[#006565] dark:text-teal-300">
                                                Tanggal SPT *
                                            </Label>
                                            <Input
                                                type="date"
                                                value={tanggalSpt}
                                                onChange={(e) =>
                                                    setTanggalSpt(
                                                        e.target.value
                                                    )
                                                }
                                                className="h-10 border-teal-300 bg-white text-xs dark:bg-neutral-900"
                                                required
                                            />
                                        </div>

                                        <div className="min-w-0 space-y-1.5 md:col-span-3">
                                            <Label className="text-xs font-bold">
                                                Tanggal Berangkat *
                                            </Label>
                                            <Input
                                                type="date"
                                                value={tanggalBerangkat}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setTanggalBerangkat(val);
                                                    if (
                                                        tanggalKembali &&
                                                        tanggalKembali < val
                                                    ) {
                                                        setTanggalKembali(val);
                                                    }
                                                }}
                                                className="h-10 bg-white text-xs dark:bg-neutral-900"
                                                required
                                            />
                                        </div>

                                        <div className="min-w-0 space-y-1.5 md:col-span-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-bold">
                                                    Tanggal Kembali *
                                                </Label>
                                                <Badge className="bg-teal-100 text-[#006565] text-[10px] font-extrabold">
                                                    {lamaHari} Hari
                                                </Badge>
                                            </div>
                                            <Input
                                                type="date"
                                                value={tanggalKembali}
                                                min={tanggalBerangkat}
                                                onChange={(e) =>
                                                    setTanggalKembali(
                                                        e.target.value
                                                    )
                                                }
                                                className="h-10 bg-white text-xs dark:bg-neutral-900"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* LANGKAH 3: TUJUAN, ALAMAT LENGKAP, KAB/KOTA, PERIHAL & PEJABAT */}
                            {currentStep === 3 && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-12">
                                        <div className="min-w-0 space-y-1.5 md:col-span-4">
                                            <Label className="text-xs font-bold">
                                                Tujuan (Instansi / Tempat) *
                                            </Label>
                                            <Input
                                                value={tujuan}
                                                onChange={(e) =>
                                                    setTujuan(e.target.value)
                                                }
                                                placeholder="Contoh: Dinas Ketahanan Pangan Prov. Jabar / Hotel Horison"
                                                className="h-10 bg-white text-xs dark:bg-neutral-900"
                                                required
                                            />
                                        </div>

                                        <div className="min-w-0 space-y-1.5 md:col-span-5">
                                            <Label className="text-xs font-bold">
                                                Alamat Lengkap *
                                            </Label>
                                            <Input
                                                value={alamatLengkap}
                                                onChange={(e) =>
                                                    setAlamatLengkap(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Contoh: Jl. Ir. H. Juanda No. 358, Dago, Kec. Coblong"
                                                className="h-10 bg-white text-xs dark:bg-neutral-900"
                                                required
                                            />
                                        </div>

                                        <div className="min-w-0 space-y-1.5 md:col-span-3">
                                            <Label className="text-xs font-bold text-[#006565] dark:text-teal-300">
                                                Kab/Kota *
                                            </Label>
                                            <Input
                                                value={kabKota}
                                                onChange={(e) =>
                                                    setKabKota(e.target.value)
                                                }
                                                placeholder="Contoh: Kota Bandung"
                                                className="h-10 border-teal-300 bg-white text-xs dark:bg-neutral-900"
                                                required
                                            />
                                        </div>

                                        <div className="min-w-0 space-y-1.5 md:col-span-12">
                                            <Label className="text-xs font-bold">
                                                Perihal *
                                            </Label>
                                            <textarea
                                                value={perihal}
                                                onChange={(e) =>
                                                    setPerihal(e.target.value)
                                                }
                                                rows={2}
                                                placeholder="Contoh: Undangan Rapat Koordinasi Stabilisasi Pasokan dan Harga Pangan Tingkat Provinsi Jawa Barat Tahun 2026"
                                                className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-neutral-900"
                                                required
                                            />
                                        </div>

                                        <div className="min-w-0 space-y-1.5 md:col-span-4">
                                            <Label className="text-xs font-bold text-neutral-600">
                                                Kepala Dinas / Pengguna Anggaran
                                            </Label>
                                            <Select
                                                value={kepalaDinasId}
                                                onValueChange={setKepalaDinasId}
                                            >
                                                <SelectTrigger className="h-9.5 w-full min-w-0 overflow-hidden bg-white text-xs [&>span]:truncate dark:bg-neutral-900">
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

                                        <div className="min-w-0 space-y-1.5 md:col-span-4">
                                            <Label className="text-xs font-bold text-neutral-600">
                                                PPTK
                                            </Label>
                                            <Select
                                                value={pptkId}
                                                onValueChange={setPptkId}
                                            >
                                                <SelectTrigger className="h-9.5 w-full min-w-0 overflow-hidden bg-white text-xs [&>span]:truncate dark:bg-neutral-900">
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

                                        <div className="min-w-0 space-y-1.5 md:col-span-4">
                                            <Label className="text-xs font-bold text-neutral-600">
                                                Bendahara Pengeluaran
                                            </Label>
                                            <Select
                                                value={bendaharaId}
                                                onValueChange={setBendaharaId}
                                            >
                                                <SelectTrigger className="h-9.5 w-full min-w-0 overflow-hidden bg-white text-xs [&>span]:truncate dark:bg-neutral-900">
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
                                </div>
                            )}

                            {/* LANGKAH 4: PETUGAS BERANGKAT (1, 2, 3...) & BIAYA */}
                            {currentStep === 4 && (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <div className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
                                                Daftar Petugas Berangkat (
                                                {participants.length} Orang)
                                            </div>
                                            <p className="text-xs text-neutral-500">
                                                Pilih petugas ke-1, ke-2, ke-3 dst. beserta rincian Uang Harian &amp; Uang Transport.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={handleAddParticipant}
                                            className="gap-1.5 border-[#006565] bg-teal-50/70 text-xs font-extrabold text-[#006565] hover:bg-teal-100"
                                        >
                                            <UserPlus className="size-3.5" />+
                                            Tambah Petugas ke-
                                            {participants.length + 1}
                                        </Button>
                                    </div>

                                    <div className="space-y-2.5">
                                        {participants.map((pt, idx) => {
                                            const sub =
                                                (Number(pt.uang_harian) || 0) +
                                                (Number(pt.uang_transport) || 0);
                                            return (
                                                <div
                                                    key={pt.uid}
                                                    className="rounded-xl border border-teal-200/80 bg-white p-3 shadow-2xs dark:border-teal-900 dark:bg-neutral-950"
                                                >
                                                    <div className="grid grid-cols-1 items-end gap-2.5 md:grid-cols-[auto_2.4fr_1.3fr_1.3fr_auto]">
                                                        <div className="flex items-center pb-1.5">
                                                            <Badge className="bg-[#006565] text-white text-[11px] font-extrabold">
                                                                Petugas #{idx + 1}
                                                            </Badge>
                                                        </div>

                                                        <div className="min-w-0 space-y-1">
                                                            <Label className="text-[11px] font-bold">
                                                                Nama Pegawai *
                                                            </Label>
                                                            <Select
                                                                value={
                                                                    pt.pegawai_id
                                                                }
                                                                onValueChange={(
                                                                    v
                                                                ) =>
                                                                    handleUpdateParticipant(
                                                                        idx,
                                                                        'pegawai_id',
                                                                        v
                                                                    )
                                                                }
                                                            >
                                                                <SelectTrigger className="h-9 w-full min-w-0 overflow-hidden bg-white text-xs [&>span]:truncate dark:bg-neutral-900">
                                                                    <SelectValue placeholder="-- Pilih Pegawai --" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {pegawais.map(
                                                                        (p) => (
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
                                                            <Label className="text-[11px] font-bold">
                                                                Uang Harian (Rp) *
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                step={10000}
                                                                value={
                                                                    pt.uang_harian
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateParticipant(
                                                                        idx,
                                                                        'uang_harian',
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="h-9 bg-white font-mono text-xs dark:bg-neutral-900"
                                                                required
                                                            />
                                                        </div>

                                                        <div className="min-w-0 space-y-1">
                                                            <Label className="text-[11px] font-bold">
                                                                Uang Transport (Rp) *
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                step={10000}
                                                                value={
                                                                    pt.uang_transport
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateParticipant(
                                                                        idx,
                                                                        'uang_transport',
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="h-9 bg-white font-mono text-xs dark:bg-neutral-900"
                                                                required
                                                            />
                                                        </div>

                                                        <div className="flex items-center justify-end gap-2 pb-0.5">
                                                            <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 font-mono text-xs font-extrabold text-emerald-700 border border-emerald-200">
                                                                {formatRupiah(
                                                                    sub
                                                                )}
                                                            </span>
                                                            {participants.length >
                                                                1 && (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        handleRemoveParticipant(
                                                                            idx
                                                                        )
                                                                    }
                                                                    className="h-8 px-2 text-rose-600 hover:bg-rose-50"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* RINGKASAN BIAYA */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-3 text-xs dark:border-teal-900 dark:bg-teal-950/30">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <span>
                                                Total Uang Harian:{' '}
                                                <strong className="font-mono text-sky-800 dark:text-sky-300">
                                                    {formatRupiah(
                                                        formTotals.harian
                                                    )}
                                                </strong>
                                            </span>
                                            <span>
                                                Total Transport:{' '}
                                                <strong className="font-mono text-emerald-800 dark:text-emerald-300">
                                                    {formatRupiah(
                                                        formTotals.transport
                                                    )}
                                                </strong>
                                            </span>
                                        </div>
                                        <div className="text-sm font-extrabold text-[#006565] dark:text-teal-300">
                                            Total Biaya:{' '}
                                            <span className="font-mono">
                                                {formatRupiah(formTotals.total)}
                                            </span>
                                        </div>
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
                                                        (s - 1) as 1 | 2 | 3 | 4
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
                                    {currentStep < 4 ? (
                                        <Button
                                            type="button"
                                            onClick={handleNextStep}
                                            className="gap-1.5 bg-[#006565] px-5 text-xs font-extrabold text-white hover:bg-[#005252]"
                                        >
                                            Lanjut ke Langkah {currentStep + 1}
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
                                                : 'Simpan SPPD Luar Kota'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </CardContent>
                    )}
                </Card>

                {/* ========================================================= */}
                {/* TABEL DAFTAR SPPD LUAR KOTA TERSIMPAN (PER BATCH)         */}
                {/* ========================================================= */}
                <Card className="border-sidebar-border/70 shadow-xs">
                    <CardHeader className="border-b border-neutral-100 pb-4 dark:border-neutral-800">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-base font-extrabold">
                                    Daftar SPPD Luar Kota Tersimpan (
                                    {filteredBatches.length} Batch &bull;{' '}
                                    {statistics.total_sppd} Data SPPD)
                                </CardTitle>
                                <p className="text-xs text-neutral-500">
                                    Klik baris Batch untuk melihat atau mengedit rincian keberangkatan SPPD Luar Kota di dalamnya.
                                </p>
                            </div>
                            <div className="relative w-full sm:w-72">
                                <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-neutral-400" />
                                <Input
                                    placeholder="Cari kode batch, tujuan, petugas..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="h-9 pl-9 text-xs"
                                />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs">
                                <thead>
                                    <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[11px] font-bold tracking-wider text-neutral-500 uppercase dark:border-neutral-800 dark:bg-neutral-900/50">
                                        <th className="w-10 px-3 py-3 text-center">
                                            #
                                        </th>
                                        <th className="px-4 py-3">
                                            Batch &amp; Jumlah SPPD
                                        </th>
                                        <th className="px-4 py-3">
                                            Sub Kegiatan
                                        </th>
                                        <th className="px-4 py-3">
                                            Tujuan Luar Kota
                                        </th>
                                        <th className="px-4 py-3">
                                            Petugas Berangkat
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Total Biaya
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Download PDF &amp; Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {filteredBatches.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-10 text-center text-neutral-400"
                                            >
                                                Belum ada data SPPD Luar Kota tersimpan. Silakan lengkapi form di atas.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredBatches.map((grp, idx) => {
                                            const isExpanded = Boolean(
                                                expandedBatches[grp.batch_code]
                                            );
                                            return (
                                                <React.Fragment
                                                    key={grp.batch_code}
                                                >
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
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="font-mono font-extrabold text-neutral-900 dark:text-neutral-100">
                                                                            {
                                                                                grp.batch_code
                                                                            }
                                                                        </span>
                                                                        <Badge className="bg-[#006565] px-1.5 py-0 text-[10px] text-white">
                                                                            {
                                                                                grp.spt_count
                                                                            }{' '}
                                                                            SPPD
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="text-[10px] text-neutral-500">
                                                                        {
                                                                            grp.first_tanggal_berangkat_formatted
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="min-w-[220px] max-w-[360px] px-4 py-3">
                                                            <div className="leading-snug font-semibold whitespace-normal break-words text-neutral-800 dark:text-neutral-200">
                                                                {grp
                                                                    .sub_kegiatan
                                                                    ?.sub_kegiatan ||
                                                                    '-'}
                                                            </div>
                                                        </td>
                                                        <td className="min-w-[180px] max-w-[280px] px-4 py-3">
                                                            <div className="space-y-1 leading-snug font-semibold whitespace-normal break-words text-neutral-800 dark:text-neutral-200">
                                                                {grp.tujuan_list.length > 0 ? (
                                                                    grp.tujuan_list.map(
                                                                        (
                                                                            tuj,
                                                                            tIdx
                                                                        ) => (
                                                                            <div
                                                                                key={`${tuj}-${tIdx}`}
                                                                            >
                                                                                {
                                                                                    tuj
                                                                                }
                                                                            </div>
                                                                        )
                                                                    )
                                                                ) : (
                                                                    <span>-</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex max-w-[220px] flex-wrap gap-1">
                                                                {grp.employees.map(
                                                                    (
                                                                        emp,
                                                                        eIdx
                                                                    ) => (
                                                                        <span
                                                                            key={`${emp.nama}-${eIdx}`}
                                                                            className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-semibold dark:border-neutral-800 dark:bg-neutral-900"
                                                                        >
                                                                            <span className="max-w-[130px] truncate">
                                                                                {
                                                                                    emp.nama
                                                                                }
                                                                            </span>
                                                                            <span className="rounded bg-teal-50 px-1 text-[9px] font-extrabold text-[#006565]">
                                                                                {
                                                                                    emp.golongan
                                                                                }
                                                                            </span>
                                                                        </span>
                                                                    )
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                                            <div className="font-mono font-extrabold text-emerald-700">
                                                                {formatRupiah(
                                                                    grp.total_biaya
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-neutral-400">
                                                                UH:{' '}
                                                                {formatRupiah(
                                                                    grp.total_uang_harian
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td
                                                            className="px-4 py-3 text-right whitespace-nowrap"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            <div className="inline-flex items-center gap-1.5">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            size="sm"
                                                                            className="h-8 gap-1.5 bg-[#006565] px-2.5 text-xs font-bold text-white hover:bg-[#005252]"
                                                                            title="Download Laporan PDF Batch"
                                                                        >
                                                                            <Download className="size-3.5" />
                                                                            <span>
                                                                                Download PDF
                                                                            </span>
                                                                            <ChevronDown className="size-3 opacity-80" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent
                                                                        align="end"
                                                                        className="w-64"
                                                                    >
                                                                        <DropdownMenuLabel className="text-[11px] font-extrabold text-[#006565]">
                                                                            Download Dokumen PDF
                                                                        </DropdownMenuLabel>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            asChild
                                                                        >
                                                                            <a
                                                                                href={`/sppd-luar-kota/batch/${encodeURIComponent(grp.batch_code)}/spt-pdf`}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="flex cursor-pointer items-start gap-2.5 py-2"
                                                                            >
                                                                                <FileText className="mt-0.5 size-4 shrink-0 text-[#006565]" />
                                                                                <div className="min-w-0">
                                                                                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                                        1. SPT (PDF)
                                                                                    </div>
                                                                                    <div className="text-[10px] text-neutral-500">
                                                                                        Surat Tugas Luar Kota (
                                                                                        {
                                                                                            grp.spt_count
                                                                                        }{' '}
                                                                                        lembar)
                                                                                    </div>
                                                                                </div>
                                                                            </a>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            asChild
                                                                        >
                                                                            <a
                                                                                href={`/sppd-luar-kota/batch/${encodeURIComponent(grp.batch_code)}/sptjb-pdf`}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="flex cursor-pointer items-start gap-2.5 py-2"
                                                                            >
                                                                                <FileCheck2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                                                                                <div className="min-w-0">
                                                                                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                                        2. SPTJB (PDF)
                                                                                    </div>
                                                                                    <div className="text-[10px] text-neutral-500">
                                                                                        Surat Pernyataan Tanggung Jawab Belanja
                                                                                    </div>
                                                                                </div>
                                                                            </a>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            asChild
                                                                        >
                                                                            <a
                                                                                href={`/sppd-luar-kota/batch/${encodeURIComponent(grp.batch_code)}/c2-pdf`}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="flex cursor-pointer items-start gap-2.5 py-2"
                                                                            >
                                                                                <Wallet className="mt-0.5 size-4 shrink-0 text-amber-600" />
                                                                                <div className="min-w-0">
                                                                                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                                        3. C2 (PDF)
                                                                                    </div>
                                                                                    <div className="text-[10px] text-neutral-500">
                                                                                        Perincian Pengeluaran Tanda Bukti
                                                                                    </div>
                                                                                </div>
                                                                            </a>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            asChild
                                                                        >
                                                                            <a
                                                                                href={`/sppd-luar-kota/batch/${encodeURIComponent(grp.batch_code)}/rincian-pdf`}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="flex cursor-pointer items-start gap-2.5 py-2"
                                                                            >
                                                                                <FileText className="mt-0.5 size-4 shrink-0 text-sky-600" />
                                                                                <div className="min-w-0">
                                                                                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                                        4. Rincian (PDF)
                                                                                    </div>
                                                                                    <div className="text-[10px] text-neutral-500">
                                                                                        Rincian Biaya Perjalanan Dinas (
                                                                                        {
                                                                                            grp.spt_count
                                                                                        }{' '}
                                                                                        lembar)
                                                                                    </div>
                                                                                </div>
                                                                            </a>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            asChild
                                                                        >
                                                                            <a
                                                                                href={`/sppd-luar-kota/batch/${encodeURIComponent(grp.batch_code)}/kwitansi-pdf`}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="flex cursor-pointer items-start gap-2.5 py-2"
                                                                            >
                                                                                <Wallet className="mt-0.5 size-4 shrink-0 text-purple-600" />
                                                                                <div className="min-w-0">
                                                                                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                                        5. Kwitansi (PDF)
                                                                                    </div>
                                                                                    <div className="text-[10px] text-neutral-500">
                                                                                        Tanda Terima Uang Harian (
                                                                                        {
                                                                                            grp.spt_count
                                                                                        }{' '}
                                                                                        lembar)
                                                                                    </div>
                                                                                </div>
                                                                            </a>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            asChild
                                                                        >
                                                                            <a
                                                                                href={`/sppd-luar-kota/batch/${encodeURIComponent(grp.batch_code)}/kwitansi-2-pdf`}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="flex cursor-pointer items-start gap-2.5 py-2"
                                                                            >
                                                                                <Wallet className="mt-0.5 size-4 shrink-0 text-rose-600" />
                                                                                <div className="min-w-0">
                                                                                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                                        6. Kwitansi 2 (PDF)
                                                                                    </div>
                                                                                    <div className="text-[10px] text-neutral-500">
                                                                                        Kuitansi Biaya Perjalanan Dinas (
                                                                                        {
                                                                                            grp.spt_count
                                                                                        }{' '}
                                                                                        lembar)
                                                                                    </div>
                                                                                </div>
                                                                            </a>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onSelect={(
                                                                                e
                                                                            ) => {
                                                                                e.preventDefault();
                                                                                handleOpenSppdVehicleModal(
                                                                                    grp.batch_code
                                                                                );
                                                                            }}
                                                                            className="flex cursor-pointer items-start gap-2.5 py-2"
                                                                        >
                                                                            <FileText className="mt-0.5 size-4 shrink-0 text-indigo-600" />
                                                                            <div className="min-w-0">
                                                                                <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                                    7. SPPD (PDF)
                                                                                </div>
                                                                                <div className="text-[10px] text-neutral-500">
                                                                                    Surat Perjalanan Dinas / SPD (
                                                                                    {
                                                                                        grp.spt_count
                                                                                    }{' '}
                                                                                    lembar)
                                                                                </div>
                                                                            </div>
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={(
                                                                        e
                                                                    ) =>
                                                                        handleAppendToBatch(
                                                                            grp,
                                                                            e
                                                                        )
                                                                    }
                                                                    className="h-8 gap-1 border-amber-300 px-2.5 text-xs font-bold text-amber-800 hover:bg-amber-50"
                                                                    title="Tambah SPPD Luar Kota baru ke Batch ini"
                                                                >
                                                                    <CalendarPlus className="size-3.5" />
                                                                    <span>
                                                                        + SPPD
                                                                    </span>
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        if (
                                                                            window.confirm(
                                                                                `Hapus seluruh Batch ${grp.batch_code}?`
                                                                            )
                                                                        ) {
                                                                            router.delete(
                                                                                `/sppd-luar-kota/batch/${encodeURIComponent(grp.batch_code)}`,
                                                                                {
                                                                                    preserveScroll:
                                                                                        true,
                                                                                }
                                                                            );
                                                                        }
                                                                    }}
                                                                    className="h-8 px-2 text-rose-600 hover:bg-rose-50"
                                                                    title="Hapus Batch"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {isExpanded && (
                                                        <tr className="bg-neutral-50/90 dark:bg-neutral-900/60">
                                                            <td
                                                                colSpan={7}
                                                                className="border-b-2 border-teal-200 p-4 dark:border-teal-900"
                                                            >
                                                                <div className="rounded-xl border border-teal-200 bg-white p-3.5 shadow-2xs dark:border-teal-900 dark:bg-neutral-950">
                                                                    <div className="mb-3 flex items-center gap-2 border-b border-neutral-100 pb-2 dark:border-neutral-800">
                                                                        <Badge className="bg-[#006565] text-white">
                                                                            Rincian{' '}
                                                                            {
                                                                                grp.spt_count
                                                                            }{' '}
                                                                            SPPD
                                                                        </Badge>
                                                                        <span className="text-xs font-extrabold">
                                                                            Daftar Keberangkatan SPPD Luar Kota dalam Batch{' '}
                                                                            <span className="font-mono text-[#006565]">
                                                                                {
                                                                                    grp.batch_code
                                                                                }
                                                                            </span>
                                                                        </span>
                                                                    </div>

                                                                    <div className="overflow-x-auto">
                                                                        <table className="w-full border-collapse text-left text-xs">
                                                                            <thead>
                                                                                <tr className="border-b border-neutral-200 bg-neutral-100/80 text-[10px] font-extrabold text-neutral-600 uppercase dark:border-neutral-800 dark:bg-neutral-900">
                                                                                    <th className="px-3 py-2">
                                                                                        Surat Dasar
                                                                                    </th>
                                                                                    <th className="px-3 py-2">
                                                                                        Jadwal
                                                                                    </th>
                                                                                    <th className="px-3 py-2">
                                                                                        Tujuan, Alamat &amp; Perihal
                                                                                    </th>
                                                                                    <th className="px-3 py-2">
                                                                                        Petugas &amp; Rincian Biaya
                                                                                    </th>
                                                                                    <th className="px-3 py-2 text-right">
                                                                                        Total
                                                                                    </th>
                                                                                    <th className="px-3 py-2 text-right">
                                                                                        Aksi
                                                                                    </th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                                                {grp.items.map(
                                                                                    (
                                                                                        item
                                                                                    ) => (
                                                                                        <tr
                                                                                            key={
                                                                                                item.id
                                                                                            }
                                                                                            className="hover:bg-teal-50/30"
                                                                                        >
                                                                                            <td className="px-3 py-2.5 align-top">
                                                                                                {(item.tanpa_surat ||
                                                                                                    isTanpaSuratValue(
                                                                                                        item.pengirim_surat
                                                                                                    )) && (
                                                                                                    <Badge className="mb-1 bg-amber-100 text-[10px] font-bold text-amber-800">
                                                                                                        Tanpa Surat
                                                                                                    </Badge>
                                                                                                )}
                                                                                                <div className="font-bold text-neutral-900 dark:text-neutral-100">
                                                                                                    {
                                                                                                        item.pengirim_surat
                                                                                                    }
                                                                                                </div>
                                                                                                {!(
                                                                                                    item.tanpa_surat ||
                                                                                                    isTanpaSuratValue(
                                                                                                        item.pengirim_surat
                                                                                                    )
                                                                                                ) && (
                                                                                                    <>
                                                                                                        <div className="font-mono text-[10px] text-neutral-500">
                                                                                                            No:{' '}
                                                                                                            {item.nomor_surat ||
                                                                                                                '-'}
                                                                                                        </div>
                                                                                                        <div className="text-[10px] text-neutral-500">
                                                                                                            Tgl Surat:{' '}
                                                                                                            {
                                                                                                                item.tanggal_surat_formatted
                                                                                                            }
                                                                                                        </div>
                                                                                                    </>
                                                                                                )}
                                                                                                <div className="text-[10px] font-semibold text-[#006565]">
                                                                                                    Tgl SPT:{' '}
                                                                                                    {
                                                                                                        item.tanggal_spt_formatted
                                                                                                    }
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="px-3 py-2.5 align-top whitespace-nowrap">
                                                                                                <div className="flex items-center gap-1 font-bold text-[#006565]">
                                                                                                    <Calendar className="size-3" />
                                                                                                    {
                                                                                                        item.tanggal_berangkat_formatted
                                                                                                    }
                                                                                                </div>
                                                                                                <div className="text-[10px] text-neutral-500">
                                                                                                    s/d{' '}
                                                                                                    {
                                                                                                        item.tanggal_kembali_formatted
                                                                                                    }
                                                                                                </div>
                                                                                                <Badge
                                                                                                    variant="outline"
                                                                                                    className="mt-1 border-teal-200 bg-teal-50 text-[10px] text-[#006565]"
                                                                                                >
                                                                                                    {
                                                                                                        item.lama_hari
                                                                                                    }{' '}
                                                                                                    Hari
                                                                                                </Badge>
                                                                                            </td>
                                                                                            <td className="max-w-[260px] px-3 py-2.5 align-top">
                                                                                                <div className="font-bold text-neutral-900 dark:text-neutral-100">
                                                                                                    {
                                                                                                        item.tujuan
                                                                                                    }
                                                                                                </div>
                                                                                                <div className="text-[11px] text-neutral-500">
                                                                                                    {
                                                                                                        item.alamat_lengkap
                                                                                                    }
                                                                                                    {item.kab_kota
                                                                                                        ? `, ${item.kab_kota}`
                                                                                                        : ''}
                                                                                                </div>
                                                                                                <div className="mt-1 flex items-start gap-1 text-[11px] text-neutral-700 dark:text-neutral-300">
                                                                                                    <FileText className="mt-0.5 size-3 shrink-0 text-neutral-400" />
                                                                                                    <span>
                                                                                                        {
                                                                                                            item.perihal
                                                                                                        }
                                                                                                    </span>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="px-3 py-2.5 align-top">
                                                                                                <div className="space-y-1">
                                                                                                    {item.participants.map(
                                                                                                        (
                                                                                                            pt
                                                                                                        ) => (
                                                                                                            <div
                                                                                                                key={
                                                                                                                    pt.id
                                                                                                                }
                                                                                                                className="rounded bg-neutral-50 px-2 py-1 text-[11px] dark:bg-neutral-900"
                                                                                                            >
                                                                                                                <div className="font-bold">
                                                                                                                    {
                                                                                                                        pt.urutan
                                                                                                                    }
                                                                                                                    .{' '}
                                                                                                                    {
                                                                                                                        pt.nama
                                                                                                                    }{' '}
                                                                                                                    (
                                                                                                                    {
                                                                                                                        pt.golongan
                                                                                                                    }
                                                                                                                    )
                                                                                                                </div>
                                                                                                                <div className="flex flex-wrap gap-2 font-mono text-[10px] text-neutral-600">
                                                                                                                    <span>
                                                                                                                        Harian:{' '}
                                                                                                                        {formatRupiah(
                                                                                                                            pt.uang_harian
                                                                                                                        )}
                                                                                                                    </span>
                                                                                                                    <span>
                                                                                                                        Transport:{' '}
                                                                                                                        {formatRupiah(
                                                                                                                            pt.uang_transport
                                                                                                                        )}
                                                                                                                    </span>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        )
                                                                                                    )}
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="px-3 py-2.5 text-right align-top font-mono font-extrabold whitespace-nowrap">
                                                                                                {formatRupiah(
                                                                                                    item.total_biaya
                                                                                                )}
                                                                                            </td>
                                                                                            <td className="px-3 py-2.5 text-right align-top whitespace-nowrap">
                                                                                                <div className="inline-flex items-center gap-1">
                                                                                                    <Button
                                                                                                        size="sm"
                                                                                                        variant="outline"
                                                                                                        asChild
                                                                                                        className="h-7 gap-1 border-teal-300 px-2 text-[11px] font-bold text-[#006565] hover:bg-teal-50"
                                                                                                        title="Download SPT (PDF)"
                                                                                                    >
                                                                                                        <a
                                                                                                            href={`/sppd-luar-kota/sppd/${item.id}/spt-pdf`}
                                                                                                            target="_blank"
                                                                                                            rel="noreferrer"
                                                                                                        >
                                                                                                            <Download className="size-3" />
                                                                                                            <span>
                                                                                                                SPT
                                                                                                            </span>
                                                                                                        </a>
                                                                                                    </Button>
                                                                                                    <Button
                                                                                                        size="sm"
                                                                                                        variant="outline"
                                                                                                        onClick={() =>
                                                                                                            handleOpenEdit(
                                                                                                                item,
                                                                                                                grp.batch_code
                                                                                                            )
                                                                                                        }
                                                                                                        className="h-7 px-2 text-[#006565] hover:bg-teal-50"
                                                                                                        title="Edit SPPD Luar Kota"
                                                                                                    >
                                                                                                        <Edit3 className="size-3" />
                                                                                                    </Button>
                                                                                                    <Button
                                                                                                        size="sm"
                                                                                                        variant="outline"
                                                                                                        onClick={() => {
                                                                                                            if (
                                                                                                                window.confirm(
                                                                                                                    `Hapus SPPD Luar Kota ke ${item.tujuan}?`
                                                                                                                )
                                                                                                            ) {
                                                                                                                router.delete(
                                                                                                                    `/sppd-luar-kota/sppd/${item.id}`,
                                                                                                                    {
                                                                                                                        preserveScroll:
                                                                                                                            true,
                                                                                                                    }
                                                                                                                );
                                                                                                            }
                                                                                                        }}
                                                                                                        className="h-7 px-2 text-rose-600 hover:bg-rose-50"
                                                                                                        title="Hapus SPPD"
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
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* DIALOG EDIT SPPD LUAR KOTA */}
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-[#006565]">
                                <Edit3 className="size-4" />
                                Edit SPPD Luar Kota ({editingBatchCode})
                            </DialogTitle>
                            <DialogDescription>
                                Perbarui data surat dasar, jadwal, tujuan, petugas, atau rincian biaya perjalanan dinas luar kota.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div className="rounded-lg border border-teal-200 bg-teal-50/40 p-2.5 dark:border-teal-900 dark:bg-teal-950/20">
                                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-[#006565] dark:text-teal-300">
                                    <input
                                        type="checkbox"
                                        checked={eTanpaSurat}
                                        onChange={(e) =>
                                            handleToggleEditTanpaSurat(
                                                e.target.checked
                                            )
                                        }
                                        className="size-4 rounded border-teal-300 text-[#006565] focus:ring-[#006565]"
                                    />
                                    <span>
                                        Tanpa Surat (Dasar Default: 1. UU No. 18 Tahun 2012; 2. PP No.17 Tahun 2015)
                                    </span>
                                </label>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label className="text-xs">
                                        {eTanpaSurat
                                            ? 'Dasar Surat di SPT (Tanpa Surat) *'
                                            : 'Pengirim Surat *'}
                                    </Label>
                                    <Input
                                        value={ePengirim}
                                        onChange={(e) =>
                                            setEPengirim(e.target.value)
                                        }
                                        className="h-9 text-xs"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">
                                        Nomor Surat
                                    </Label>
                                    <Input
                                        value={eNomorSurat}
                                        onChange={(e) =>
                                            setENomorSurat(e.target.value)
                                        }
                                        disabled={eTanpaSurat}
                                        placeholder={
                                            eTanpaSurat
                                                ? '- (Tanpa Nomor Surat)'
                                                : ''
                                        }
                                        className="h-9 text-xs disabled:bg-neutral-100"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-1">
                                    <Label className="text-xs">
                                        Tanggal Surat {!eTanpaSurat && '*'}
                                    </Label>
                                    <Input
                                        type="date"
                                        value={eTanggalSurat}
                                        onChange={(e) =>
                                            setETanggalSurat(e.target.value)
                                        }
                                        disabled={eTanpaSurat}
                                        className="h-9 text-xs disabled:bg-neutral-100"
                                        required={!eTanpaSurat}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-[#006565]">
                                        Tanggal SPT *
                                    </Label>
                                    <Input
                                        type="date"
                                        value={eTanggalSpt}
                                        onChange={(e) =>
                                            setETanggalSpt(e.target.value)
                                        }
                                        className="h-9 border-teal-300 text-xs"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">
                                        Tanggal Berangkat *
                                    </Label>
                                    <Input
                                        type="date"
                                        value={eTanggalBerangkat}
                                        onChange={(e) =>
                                            setETanggalBerangkat(e.target.value)
                                        }
                                        className="h-9 text-xs"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">
                                        Tanggal Kembali *
                                    </Label>
                                    <Input
                                        type="date"
                                        value={eTanggalKembali}
                                        min={eTanggalBerangkat}
                                        onChange={(e) =>
                                            setETanggalKembali(e.target.value)
                                        }
                                        className="h-9 text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Tujuan *</Label>
                                    <Input
                                        value={eTujuan}
                                        onChange={(e) =>
                                            setETujuan(e.target.value)
                                        }
                                        className="h-9 text-xs"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">
                                        Alamat Lengkap *
                                    </Label>
                                    <Input
                                        value={eAlamat}
                                        onChange={(e) =>
                                            setEAlamat(e.target.value)
                                        }
                                        className="h-9 text-xs"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-[#006565]">
                                        Kab/Kota *
                                    </Label>
                                    <Input
                                        value={eKabKota}
                                        onChange={(e) =>
                                            setEKabKota(e.target.value)
                                        }
                                        placeholder="Contoh: Kota Bandung"
                                        className="h-9 border-teal-300 text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs">Perihal *</Label>
                                <textarea
                                    value={ePerihal}
                                    onChange={(e) =>
                                        setEPerihal(e.target.value)
                                    }
                                    rows={2}
                                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs dark:bg-neutral-900"
                                    required
                                />
                            </div>

                            <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold">
                                        Petugas Berangkat ({eParticipants.length}{' '}
                                        Orang)
                                    </Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            setEParticipants((prev) => [
                                                ...prev,
                                                {
                                                    uid: `edit-lk-new-${Date.now()}`,
                                                    pegawai_id: '',
                                                    uang_harian: '430000',
                                                    uang_transport: '0',
                                                },
                                            ])
                                        }
                                        className="h-7 text-[11px] font-bold text-[#006565]"
                                    >
                                        + Tambah Petugas
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {eParticipants.map((pt, idx) => (
                                        <div
                                            key={pt.uid}
                                            className="grid grid-cols-1 gap-2 rounded-md border border-neutral-200 bg-white p-2 sm:grid-cols-12 dark:border-neutral-800 dark:bg-neutral-950"
                                        >
                                            <div className="min-w-0 sm:col-span-5">
                                                <Select
                                                    value={pt.pegawai_id}
                                                    onValueChange={(v) =>
                                                        setEParticipants(
                                                            (prev) =>
                                                                prev.map(
                                                                    (row, i) =>
                                                                        i ===
                                                                        idx
                                                                            ? {
                                                                                  ...row,
                                                                                  pegawai_id:
                                                                                      v,
                                                                              }
                                                                            : row
                                                                )
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="h-8 w-full min-w-0 overflow-hidden text-xs [&>span]:truncate">
                                                        <SelectValue placeholder="Pilih Pegawai" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {pegawais.map((p) => (
                                                            <SelectItem
                                                                key={p.id}
                                                                value={String(
                                                                    p.id
                                                                )}
                                                            >
                                                                {p.nama} (
                                                                {p.golongan})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="sm:col-span-3">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={pt.uang_harian}
                                                    onChange={(e) =>
                                                        setEParticipants(
                                                            (prev) =>
                                                                prev.map(
                                                                    (row, i) =>
                                                                        i ===
                                                                        idx
                                                                            ? {
                                                                                  ...row,
                                                                                  uang_harian:
                                                                                      e
                                                                                          .target
                                                                                          .value,
                                                                              }
                                                                            : row
                                                                )
                                                        )
                                                    }
                                                    placeholder="Uang Harian"
                                                    className="h-8 font-mono text-xs"
                                                    required
                                                />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={pt.uang_transport}
                                                    onChange={(e) =>
                                                        setEParticipants(
                                                            (prev) =>
                                                                prev.map(
                                                                    (row, i) =>
                                                                        i ===
                                                                        idx
                                                                            ? {
                                                                                  ...row,
                                                                                  uang_transport:
                                                                                      e
                                                                                          .target
                                                                                          .value,
                                                                              }
                                                                            : row
                                                                )
                                                        )
                                                    }
                                                    placeholder="Transport"
                                                    className="h-8 font-mono text-xs"
                                                    required
                                                />
                                            </div>
                                            <div className="flex justify-end sm:col-span-1">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={
                                                        eParticipants.length <= 1
                                                    }
                                                    onClick={() =>
                                                        setEParticipants(
                                                            (prev) =>
                                                                prev.filter(
                                                                    (_, i) =>
                                                                        i !==
                                                                        idx
                                                                )
                                                        )
                                                    }
                                                    className="h-8 w-8 p-0 text-rose-600"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSavingEdit}
                                    className="bg-[#006565] text-white hover:bg-[#005252]"
                                >
                                    {isSavingEdit
                                        ? 'Menyimpan...'
                                        : 'Simpan Perubahan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL PILIH JENIS KENDARAAN UNTUK DOWNLOAD PDF SPPD */}
                <Dialog
                    open={sppdVehicleModalOpen}
                    onOpenChange={setSppdVehicleModalOpen}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-extrabold text-[#006565]">
                                Pilih Jenis Kendaraan (SPPD)
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Pilih alat angkut yang digunakan untuk Batch{' '}
                                <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                                    {sppdVehicleBatchCode}
                                </span>{' '}
                                sebelum mengunduh PDF SPPD.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-2.5 py-2">
                            {[
                                'Kendaraan Umum',
                                'Kendaraan Dinas Ketahanan Pangan dan Pertanian',
                            ].map((option) => {
                                const isSelected =
                                    selectedVehicleType === option;
                                return (
                                    <label
                                        key={option}
                                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs font-semibold transition-colors ${
                                            isSelected
                                                ? 'border-[#006565] bg-teal-50/70 text-[#006565] dark:bg-teal-950/40 dark:text-teal-300'
                                                : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="sppd_vehicle_type"
                                            value={option}
                                            checked={isSelected}
                                            onChange={() =>
                                                setSelectedVehicleType(option)
                                            }
                                            className="size-4 accent-[#006565]"
                                        />
                                        <span>{option}</span>
                                    </label>
                                );
                            })}
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSppdVehicleModalOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                onClick={handleConfirmDownloadSppdPdf}
                                className="gap-1.5 bg-[#006565] text-white hover:bg-[#005252]"
                            >
                                <Download className="size-3.5" />
                                Download PDF SPPD
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

SppdLuarKotaIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'SPPD Luar Kota',
            href: '/sppd-luar-kota',
        },
    ] satisfies BreadcrumbItem[],
};
