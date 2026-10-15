import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    Calendar,
    Check,
    CheckCheck,
    CheckCircle2,
    Clock,
    Download,
    Edit3,
    ExternalLink,
    Filter,
    HelpCircle,
    Info,
    Layers,
    MapPin,
    Plus,
    RefreshCw,
    RotateCcw,
    Save,
    Search,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    Wheat,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export interface SkpgRecord {
    id: number;
    kecamatan: string;
    kode_kecamatan: string;
    year: number;
    month: number;
    ik: string;
    ia: string;
    ip: string;
    ikb: string;
    potensi_kering: string;
    potensi_basah: string;
    kondisi_iklim: string;
    keterangan?: string | null;
    creator?: { id: number; name: string } | null;
    created_at?: string;
    updated_at?: string;
}

export interface BulkItem {
    id?: number | null;
    kecamatan: string;
    kode_kecamatan: string;
    year: number;
    month: number;
    ik: string;
    ia: string;
    ip: string;
    ikb: string;
    potensi_kering: string;
    potensi_basah: string;
    kondisi_iklim: string;
    keterangan?: string | null;
    is_recorded?: boolean;
}

interface PageProps {
    records: SkpgRecord[];
    bulkItems: BulkItem[];
    kecamatanList: string[];
    indicators: Record<string, string>;
    statuses: string[];
    statistics: {
        total_kecamatan: number;
        recorded_count: number;
        missing_count: number;
        count_aman: number;
        count_waspada: number;
        count_rentan: number;
    };
    availableYears: number[];
    filters: {
        search: string;
        year: number;
        month: number;
        status: string;
        indicator: string;
    };
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

export function getStatusBadge(status: string) {
    switch (status) {
        case 'AWAS':
            return {
                label: 'AWAS',
                badgeClass:
                    'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
                dotClass: 'bg-rose-600',
            };
        case 'SIAGA':
            return {
                label: 'SIAGA',
                badgeClass:
                    'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
                dotClass: 'bg-orange-500',
            };
        case 'RENTAN':
            return {
                label: 'RENTAN',
                badgeClass:
                    'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
                dotClass: 'bg-rose-500',
            };
        case 'WASPADA':
            return {
                label: 'WASPADA',
                badgeClass:
                    'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
                dotClass: 'bg-amber-500',
            };
        case 'AMAN':
        default:
            return {
                label: 'AMAN',
                badgeClass:
                    'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
                dotClass: 'bg-emerald-500',
            };
    }
}

export default function SkpgAdminIndex({
    records,
    bulkItems: initialBulkItems,
    kecamatanList,
    indicators,
    statuses,
    statistics,
    availableYears,
    filters,
}: PageProps) {
    const [activeTab, setActiveTab] = useState<'bulk' | 'table'>('bulk');
    const [selectedYear, setSelectedYear] = useState<number>(filters.year);
    const [selectedMonth, setSelectedMonth] = useState<number>(filters.month);
    const [searchTerm, setSearchTerm] = useState<string>(filters.search || '');

    // Bulk edit state
    const [bulkData, setBulkData] = useState<BulkItem[]>(initialBulkItems);
    const [isSavingBulk, setIsSavingBulk] = useState<boolean>(false);
    const [bulkFilterKec, setBulkFilterKec] = useState<string>('');

    // Single modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [selectedRecord, setSelectedRecord] = useState<SkpgRecord | null>(null);

    // Single form fields
    const [formKecamatan, setFormKecamatan] = useState<string>(kecamatanList[0] || 'HAURGEULIS');
    const [formYear, setFormYear] = useState<number>(filters.year);
    const [formMonth, setFormMonth] = useState<number>(filters.month);
    const [formIk, setFormIk] = useState<string>('AMAN');
    const [formIa, setFormIa] = useState<string>('AMAN');
    const [formIp, setFormIp] = useState<string>('AMAN');
    const [formIkb, setFormIkb] = useState<string>('AMAN');
    const [formPotensiKering, setFormPotensiKering] = useState<string>('AMAN');
    const [formPotensiBasah, setFormPotensiBasah] = useState<string>('AMAN');
    const [formKondisiIklim, setFormKondisiIklim] = useState<string>('AMAN');
    const [formKeterangan, setFormKeterangan] = useState<string>('');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Pemantauan Pangan',
            href: '#',
        },
        {
            title: 'Kerawanan Pangan (SKPG)',
            href: '/skpg-admin',
        },
    ];

    // Synchronize bulkData when initialBulkItems changes (e.g. when changing month/year)
    React.useEffect(() => {
        setBulkData(initialBulkItems);
    }, [initialBulkItems]);

    // Apply period filter in table or bulk view
    const handlePeriodFilter = (newYear: number, newMonth: number) => {
        setSelectedYear(newYear);
        setSelectedMonth(newMonth);
        router.get(
            '/skpg-admin',
            {
                year: newYear,
                month: newMonth,
                search: searchTerm,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Quick bulk update: Set All to AMAN
    const handleSetAllAman = () => {
        setBulkData((prev) =>
            prev.map((item) => ({
                ...item,
                ik: 'AMAN',
                ia: 'AMAN',
                ip: 'AMAN',
                ikb: 'AMAN',
                potensi_kering: 'AMAN',
                potensi_basah: 'AMAN',
                kondisi_iklim: 'AMAN',
            }))
        );
        toast.info('Seluruh 31 kecamatan diatur ke status AMAN. Klik "Simpan Data Bulanan" untuk menyimpan perubahan.');
    };

    // Update single cell in bulk grid
    const handleBulkCellChange = (
        index: number,
        field: keyof BulkItem,
        value: string
    ) => {
        setBulkData((prev) => {
            const next = [...prev];
            next[index] = {
                ...next[index],
                [field]: value,
            };
            return next;
        });
    };

    // Save Bulk Changes to server
    const handleSaveBulk = () => {
        setIsSavingBulk(true);
        router.post(
            '/skpg-admin/bulk',
            {
                year: selectedYear,
                month: selectedMonth,
                items: bulkData.map((b) => ({
                    kecamatan: b.kecamatan,
                    ik: b.ik,
                    ia: b.ia,
                    ip: b.ip,
                    ikb: b.ikb,
                    potensi_kering: b.potensi_kering,
                    potensi_basah: b.potensi_basah,
                    kondisi_iklim: b.kondisi_iklim,
                    keterangan: b.keterangan || null,
                })),
            },
            {
                onSuccess: () => {
                    toast.success(
                        `Berhasil menyimpan data SKPG 31 kecamatan periode ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}!`
                    );
                },
                onError: (errors) => {
                    const firstMsg = Object.values(errors)[0] as string;
                    toast.error(firstMsg || 'Gagal menyimpan bulk data SKPG.');
                },
                onFinish: () => {
                    setIsSavingBulk(false);
                },
            }
        );
    };

    // Open single create modal
    const openCreateModal = () => {
        setFormKecamatan(kecamatanList[0] || 'HAURGEULIS');
        setFormYear(selectedYear);
        setFormMonth(selectedMonth);
        setFormIk('AMAN');
        setFormIa('AMAN');
        setFormIp('AMAN');
        setFormIkb('AMAN');
        setFormPotensiKering('AMAN');
        setFormPotensiBasah('AMAN');
        setFormKondisiIklim('AMAN');
        setFormKeterangan('');
        setIsCreateModalOpen(true);
    };

    // Open single edit modal
    const openEditModal = (rec: SkpgRecord) => {
        setSelectedRecord(rec);
        setFormKecamatan(rec.kecamatan);
        setFormYear(rec.year);
        setFormMonth(rec.month);
        setFormIk(rec.ik);
        setFormIa(rec.ia);
        setFormIp(rec.ip);
        setFormIkb(rec.ikb);
        setFormPotensiKering(rec.potensi_kering);
        setFormPotensiBasah(rec.potensi_basah);
        setFormKondisiIklim(rec.kondisi_iklim);
        setFormKeterangan(rec.keterangan || '');
        setIsEditModalOpen(true);
    };

    // Open delete confirmation
    const openDeleteModal = (rec: SkpgRecord) => {
        setSelectedRecord(rec);
        setIsDeleteModalOpen(true);
    };

    // Single create submit
    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            '/skpg-admin',
            {
                kecamatan: formKecamatan,
                year: formYear,
                month: formMonth,
                ik: formIk,
                ia: formIa,
                ip: formIp,
                ikb: formIkb,
                potensi_kering: formPotensiKering,
                potensi_basah: formPotensiBasah,
                kondisi_iklim: formKondisiIklim,
                keterangan: formKeterangan || null,
            },
            {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    toast.success(`Data SKPG ${formKecamatan} berhasil disimpan.`);
                },
                onError: (errors) => {
                    const firstMsg = Object.values(errors)[0] as string;
                    toast.error(firstMsg || 'Gagal menyimpan data.');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    // Single edit submit
    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRecord) return;
        setIsSubmitting(true);

        router.put(
            `/skpg-admin/${selectedRecord.id}`,
            {
                ik: formIk,
                ia: formIa,
                ip: formIp,
                ikb: formIkb,
                potensi_kering: formPotensiKering,
                potensi_basah: formPotensiBasah,
                kondisi_iklim: formKondisiIklim,
                keterangan: formKeterangan || null,
            },
            {
                onSuccess: () => {
                    setIsEditModalOpen(false);
                    toast.success(`Data SKPG ${selectedRecord.kecamatan} berhasil diperbarui.`);
                },
                onError: (errors) => {
                    const firstMsg = Object.values(errors)[0] as string;
                    toast.error(firstMsg || 'Gagal memperbarui data.');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    // Delete record submit
    const handleDeleteSubmit = () => {
        if (!selectedRecord) return;
        setIsSubmitting(true);

        router.delete(`/skpg-admin/${selectedRecord.id}`, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.success(`Data SKPG ${selectedRecord.kecamatan} berhasil dihapus.`);
            },
            onError: () => {
                toast.error('Gagal menghapus data SKPG.');
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    // Filter bulk rows by search
    const visibleBulkData = useMemo(() => {
        if (!bulkFilterKec.trim()) return bulkData;
        const q = bulkFilterKec.toLowerCase();
        return bulkData.filter(
            (b) =>
                b.kecamatan.toLowerCase().includes(q) ||
                b.kode_kecamatan.toLowerCase().includes(q) ||
                (b.keterangan || '').toLowerCase().includes(q)
        );
    }, [bulkData, bulkFilterKec]);

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <Head title="Kelola SKPG (Sistem Peringatan Dini Kerawanan Pangan)" />

            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#006565] to-teal-700 text-white shadow-md shadow-[#006565]/20">
                            <MapPin className="h-6 w-6 stroke-[2.2]" />
                        </span>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                                Sistem Peringatan Dini Kerawanan Pangan &amp; Gizi (SKPG)
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                                Manajemen evaluasi bulanan 31 kecamatan di Kabupaten Indramayu (IK, IA, IP, IKB, Iklim &amp; Bencana)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/skpg"
                        target="_blank"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:border-[#006565] hover:text-[#006565] transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                        <ExternalLink className="h-4 w-4" />
                        <span>Lihat Peta Publik</span>
                    </Link>
                    <Button
                        onClick={openCreateModal}
                        className="gap-2 rounded-xl bg-gradient-to-r from-[#006565] to-emerald-700 text-xs font-bold text-white shadow-md shadow-[#006565]/20 hover:shadow-lg hover:shadow-[#006565]/30 cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Tambah Data Tunggal</span>
                    </Button>
                </div>
            </div>

            {/* Statistics KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Terdata Periode Ini
                        </CardTitle>
                        <Layers className="h-4 w-4 text-[#006565] dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                                {statistics.recorded_count} / {statistics.total_kecamatan}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">Kecamatan</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">
                            {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Status AMAN (Hijau)
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {statistics.count_aman}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">Kecamatan</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">Komposit pangan stabil</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Status WASPADA (Kuning)
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                                {statistics.count_waspada}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">Kecamatan</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">Perlu pengawasan berkala</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                            Status RENTAN (Merah)
                        </CardTitle>
                        <ShieldAlert className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                                {statistics.count_rentan}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">Kecamatan</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">Prioritas intervensi pangan &amp; gizi</p>
                    </CardContent>
                </Card>
            </div>

            {/* Mode Tabs & Period Selector Bar */}
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
                {/* Tab Switcher */}
                <div className="inline-flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                    <button
                        type="button"
                        onClick={() => setActiveTab('bulk')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                            activeTab === 'bulk'
                                ? 'bg-gradient-to-r from-[#006565] to-teal-700 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                        }`}
                    >
                        <CheckCheck className="h-4 w-4" />
                        <span>Bulk Input / Edit Bulanan (31 Kecamatan)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('table')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                            activeTab === 'table'
                                ? 'bg-gradient-to-r from-[#006565] to-teal-700 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                        }`}
                    >
                        <Layers className="h-4 w-4" />
                        <span>Tabel Data &amp; Log</span>
                    </button>
                </div>

                {/* Period Selector Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Bulan:</span>
                        <Select
                            value={String(selectedMonth)}
                            onValueChange={(val) => handlePeriodFilter(selectedYear, Number(val))}
                        >
                            <SelectTrigger className="h-9 w-36 rounded-xl font-bold text-xs">
                                <SelectValue placeholder="Pilih Bulan" />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTH_NAMES.map((m, idx) => (
                                    <SelectItem key={idx + 1} value={String(idx + 1)} className="text-xs font-semibold">
                                        {m}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Tahun:</span>
                        <Select
                            value={String(selectedYear)}
                            onValueChange={(val) => handlePeriodFilter(Number(val), selectedMonth)}
                        >
                            <SelectTrigger className="h-9 w-28 rounded-xl font-bold text-xs">
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

            {/* TAB 1: BULK INPUT / EDIT 31 KECAMATAN */}
            {activeTab === 'bulk' && (
                <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    {/* Action Bar for Bulk Editor */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-black text-slate-900 dark:text-white sm:text-lg">
                                    Input / Edit Serentak 31 Kecamatan
                                </h3>
                                <Badge className="rounded-lg bg-emerald-100 text-emerald-800 border-emerald-200">
                                    {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                                </Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Ubah status IK, IA, IP, IKB, Potensi Kering, Potensi Basah, &amp; Kondisi Iklim langsung di tabel ini.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Search filter for subdistricts */}
                            <div className="relative w-48">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Cari kecamatan..."
                                    value={bulkFilterKec}
                                    onChange={(e) => setBulkFilterKec(e.target.value)}
                                    className="h-8 pl-8 rounded-xl text-xs"
                                />
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleSetAllAman}
                                className="h-8 gap-1.5 rounded-xl text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Set Semua AMAN</span>
                            </Button>

                            <Button
                                type="button"
                                onClick={handleSaveBulk}
                                disabled={isSavingBulk}
                                className="h-8 gap-2 rounded-xl bg-gradient-to-r from-[#006565] to-emerald-700 text-xs font-bold text-white shadow-md shadow-[#006565]/20 hover:shadow-lg cursor-pointer"
                            >
                                <Save className="h-3.5 w-3.5" />
                                <span>{isSavingBulk ? 'Menyimpan...' : 'Simpan Data Bulanan'}</span>
                            </Button>
                        </div>
                    </div>

                    {/* Bulk Spreadsheet Table */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-100/90 text-[11px] font-black uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                <tr>
                                    <th className="px-3 py-3 w-12 text-center">No</th>
                                    <th className="px-4 py-3 min-w-[150px]">Kecamatan</th>
                                    <th className="px-3 py-3 min-w-[110px] text-center">IK (Ketersediaan)</th>
                                    <th className="px-3 py-3 min-w-[110px] text-center">IA (Akses)</th>
                                    <th className="px-3 py-3 min-w-[110px] text-center">IP (Pemanfaatan)</th>
                                    <th className="px-3 py-3 min-w-[125px] text-center bg-emerald-50/60 dark:bg-emerald-950/30">
                                        IKB (Komposit)
                                    </th>
                                    <th className="px-3 py-3 min-w-[110px] text-center">Potensi Kering</th>
                                    <th className="px-3 py-3 min-w-[110px] text-center">Potensi Basah</th>
                                    <th className="px-3 py-3 min-w-[110px] text-center">Kondisi Iklim</th>
                                    <th className="px-4 py-3 min-w-[200px]">Catatan / Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {visibleBulkData.map((item, idx) => {
                                    // Original index in bulkData
                                    const originalIdx = bulkData.findIndex((b) => b.kecamatan === item.kecamatan);

                                    return (
                                        <tr
                                            key={item.kecamatan}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <td className="px-3 py-2.5 text-center font-bold text-slate-400">
                                                {originalIdx + 1}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="font-extrabold text-slate-900 dark:text-white">
                                                    {item.kecamatan}
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-semibold">
                                                    BPS: {item.kode_kecamatan}
                                                </span>
                                            </td>

                                            {/* IK (Ketersediaan) */}
                                            <td className="px-2 py-2 text-center">
                                                <select
                                                    value={item.ik}
                                                    onChange={(e) =>
                                                        handleBulkCellChange(originalIdx, 'ik', e.target.value)
                                                    }
                                                    className={`w-full rounded-lg px-2 py-1 text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006565] ${
                                                        item.ik === 'RENTAN'
                                                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                                                            : item.ik === 'WASPADA'
                                                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                    }`}
                                                >
                                                    <option value="AMAN">AMAN</option>
                                                    <option value="WASPADA">WASPADA</option>
                                                    <option value="RENTAN">RENTAN</option>
                                                </select>
                                            </td>

                                            {/* IA (Akses / Keterjangkauan) */}
                                            <td className="px-2 py-2 text-center">
                                                <select
                                                    value={item.ia}
                                                    onChange={(e) =>
                                                        handleBulkCellChange(originalIdx, 'ia', e.target.value)
                                                    }
                                                    className={`w-full rounded-lg px-2 py-1 text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006565] ${
                                                        item.ia === 'RENTAN'
                                                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                                                            : item.ia === 'WASPADA'
                                                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                    }`}
                                                >
                                                    <option value="AMAN">AMAN</option>
                                                    <option value="WASPADA">WASPADA</option>
                                                    <option value="RENTAN">RENTAN</option>
                                                </select>
                                            </td>

                                            {/* IP (Pemanfaatan) */}
                                            <td className="px-2 py-2 text-center">
                                                <select
                                                    value={item.ip}
                                                    onChange={(e) =>
                                                        handleBulkCellChange(originalIdx, 'ip', e.target.value)
                                                    }
                                                    className={`w-full rounded-lg px-2 py-1 text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006565] ${
                                                        item.ip === 'RENTAN'
                                                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                                                            : item.ip === 'WASPADA'
                                                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                    }`}
                                                >
                                                    <option value="AMAN">AMAN</option>
                                                    <option value="WASPADA">WASPADA</option>
                                                    <option value="RENTAN">RENTAN</option>
                                                </select>
                                            </td>

                                            {/* IKB (Komposit Bulanan) */}
                                            <td className="px-2 py-2 text-center bg-emerald-50/40 dark:bg-emerald-950/20">
                                                <select
                                                    value={item.ikb}
                                                    onChange={(e) =>
                                                        handleBulkCellChange(originalIdx, 'ikb', e.target.value)
                                                    }
                                                    className={`w-full rounded-lg px-2 py-1 text-xs font-extrabold border shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006565] ${
                                                        item.ikb === 'RENTAN'
                                                            ? 'bg-rose-100 text-rose-900 border-rose-400'
                                                            : item.ikb === 'WASPADA'
                                                              ? 'bg-amber-100 text-amber-900 border-amber-400'
                                                              : 'bg-emerald-100 text-emerald-900 border-emerald-400'
                                                    }`}
                                                >
                                                    <option value="AMAN">AMAN</option>
                                                    <option value="WASPADA">WASPADA</option>
                                                    <option value="RENTAN">RENTAN</option>
                                                </select>
                                            </td>

                                            {/* Potensi Kering */}
                                            <td className="px-2 py-2 text-center">
                                                <select
                                                    value={item.potensi_kering}
                                                    onChange={(e) =>
                                                        handleBulkCellChange(originalIdx, 'potensi_kering', e.target.value)
                                                    }
                                                    className={`w-full rounded-lg px-2 py-1 text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006565] ${
                                                        item.potensi_kering === 'AWAS' || item.potensi_kering === 'RENTAN'
                                                            ? 'bg-rose-50 text-rose-800 border-rose-300 font-extrabold'
                                                            : item.potensi_kering === 'SIAGA'
                                                              ? 'bg-orange-50 text-orange-800 border-orange-300 font-extrabold'
                                                              : item.potensi_kering === 'WASPADA'
                                                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                    }`}
                                                >
                                                    <option value="AMAN">AMAN</option>
                                                    <option value="WASPADA">WASPADA</option>
                                                    <option value="SIAGA">SIAGA</option>
                                                    <option value="AWAS">AWAS</option>
                                                </select>
                                            </td>

                                            {/* Potensi Basah */}
                                            <td className="px-2 py-2 text-center">
                                                <select
                                                    value={item.potensi_basah}
                                                    onChange={(e) =>
                                                        handleBulkCellChange(originalIdx, 'potensi_basah', e.target.value)
                                                    }
                                                    className={`w-full rounded-lg px-2 py-1 text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006565] ${
                                                        item.potensi_basah === 'AWAS' || item.potensi_basah === 'RENTAN'
                                                            ? 'bg-rose-50 text-rose-800 border-rose-300 font-extrabold'
                                                            : item.potensi_basah === 'SIAGA'
                                                              ? 'bg-orange-50 text-orange-800 border-orange-300 font-extrabold'
                                                              : item.potensi_basah === 'WASPADA'
                                                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                    }`}
                                                >
                                                    <option value="AMAN">AMAN</option>
                                                    <option value="WASPADA">WASPADA</option>
                                                    <option value="SIAGA">SIAGA</option>
                                                    <option value="AWAS">AWAS</option>
                                                </select>
                                            </td>

                                            {/* Kondisi Iklim */}
                                            <td className="px-2 py-2 text-center">
                                                <select
                                                    value={item.kondisi_iklim}
                                                    onChange={(e) =>
                                                        handleBulkCellChange(originalIdx, 'kondisi_iklim', e.target.value)
                                                    }
                                                    className={`w-full rounded-lg px-2 py-1 text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006565] ${
                                                        item.kondisi_iklim === 'AWAS' || item.kondisi_iklim === 'RENTAN'
                                                            ? 'bg-rose-50 text-rose-800 border-rose-300 font-extrabold'
                                                            : item.kondisi_iklim === 'SIAGA'
                                                              ? 'bg-orange-50 text-orange-800 border-orange-300 font-extrabold'
                                                              : item.kondisi_iklim === 'WASPADA'
                                                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                    }`}
                                                >
                                                    <option value="AMAN">AMAN</option>
                                                    <option value="WASPADA">WASPADA</option>
                                                    <option value="SIAGA">SIAGA</option>
                                                    <option value="AWAS">AWAS</option>
                                                </select>
                                            </td>

                                            {/* Keterangan */}
                                            <td className="px-4 py-2">
                                                <input
                                                    type="text"
                                                    value={item.keterangan || ''}
                                                    onChange={(e) =>
                                                        handleBulkCellChange(originalIdx, 'keterangan', e.target.value)
                                                    }
                                                    placeholder="Catatan pangan atau iklim..."
                                                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:border-[#006565]"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Bottom Save Bar */}
                    <div className="flex items-center justify-between pt-3">
                        <span className="text-xs text-slate-500">
                            Menampilkan 31 kecamatan di Kabupaten Indramayu
                        </span>
                        <Button
                            type="button"
                            onClick={handleSaveBulk}
                            disabled={isSavingBulk}
                            className="gap-2 rounded-xl bg-gradient-to-r from-[#006565] to-emerald-700 font-bold text-xs text-white shadow-md shadow-[#006565]/20 hover:shadow-lg cursor-pointer"
                        >
                            <Save className="h-4 w-4" />
                            <span>{isSavingBulk ? 'Menyimpan Semua Data...' : 'Simpan Data Bulanan 31 Kecamatan'}</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* TAB 2: TABLE LIST & SINGLE CRUD */}
            {activeTab === 'table' && (
                <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white sm:text-lg">
                                Log &amp; Daftar Data SKPG Terdata
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Menampilkan {records.length} data kecamatan yang telah tersimpan di periode ini.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative w-56">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Filter nama/keterangan..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-9 pl-9 rounded-xl text-xs"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-100/90 text-[11px] font-black uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Kecamatan</th>
                                    <th className="px-3 py-3 text-center">Periode</th>
                                    <th className="px-3 py-3 text-center">IKB (Komposit)</th>
                                    <th className="px-3 py-3 text-center">IK (Ketersediaan)</th>
                                    <th className="px-3 py-3 text-center">IA (Akses)</th>
                                    <th className="px-3 py-3 text-center">IP (Gizi)</th>
                                    <th className="px-3 py-3 text-center">Kering</th>
                                    <th className="px-3 py-3 text-center">Basah</th>
                                    <th className="px-3 py-3 text-center">Iklim</th>
                                    <th className="px-4 py-3">Keterangan</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {records.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="py-8 text-center text-slate-400">
                                            Belum ada data SKPG tersimpan untuk periode ini. Gunakan tab "Bulk Input"
                                            untuk mengisi serentak.
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((rec) => {
                                        const badgeIkb = getStatusBadge(rec.ikb);

                                        return (
                                            <tr
                                                key={rec.id}
                                                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="font-extrabold text-slate-900 dark:text-white">
                                                        {rec.kecamatan}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400">
                                                        BPS: {rec.kode_kecamatan}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center font-bold">
                                                    {MONTH_NAMES[rec.month - 1]} {rec.year}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <Badge
                                                        className={`rounded-lg px-2 py-0.5 text-[11px] font-black border ${badgeIkb.badgeClass}`}
                                                    >
                                                        {rec.ikb}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`font-bold ${getStatusBadge(rec.ik).badgeClass} px-2 py-0.5 rounded-md`}>
                                                        {rec.ik}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`font-bold ${getStatusBadge(rec.ia).badgeClass} px-2 py-0.5 rounded-md`}>
                                                        {rec.ia}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`font-bold ${getStatusBadge(rec.ip).badgeClass} px-2 py-0.5 rounded-md`}>
                                                        {rec.ip}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`font-bold ${getStatusBadge(rec.potensi_kering).badgeClass} px-2 py-0.5 rounded-md`}>
                                                        {rec.potensi_kering}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`font-bold ${getStatusBadge(rec.potensi_basah).badgeClass} px-2 py-0.5 rounded-md`}>
                                                        {rec.potensi_basah}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`font-bold ${getStatusBadge(rec.kondisi_iklim).badgeClass} px-2 py-0.5 rounded-md`}>
                                                        {rec.kondisi_iklim}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 max-w-xs truncate text-slate-600">
                                                    {rec.keterangan || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(rec)}
                                                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                                                            title="Edit data"
                                                        >
                                                            <Edit3 className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openDeleteModal(rec)}
                                                            className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                                            title="Hapus data"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CREATE MODAL */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-xl rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                            Tambah Data SKPG Kecamatan
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Masukkan hasil evaluasi indikator peringatan dini kerawanan pangan kecamatan.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Kecamatan</Label>
                                <Select value={formKecamatan} onValueChange={setFormKecamatan}>
                                    <SelectTrigger className="mt-1 h-9 rounded-xl text-xs font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {kecamatanList.map((k) => (
                                            <SelectItem key={k} value={k} className="text-xs font-semibold">
                                                {k}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Bulan</Label>
                                <Select
                                    value={String(formMonth)}
                                    onValueChange={(val) => setFormMonth(Number(val))}
                                >
                                    <SelectTrigger className="mt-1 h-9 rounded-xl text-xs font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTH_NAMES.map((m, idx) => (
                                            <SelectItem key={idx + 1} value={String(idx + 1)} className="text-xs font-semibold">
                                                {m}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Tahun</Label>
                                <Input
                                    type="number"
                                    value={formYear}
                                    onChange={(e) => setFormYear(Number(e.target.value))}
                                    className="mt-1 h-9 rounded-xl text-xs font-bold"
                                />
                            </div>
                        </div>

                        {/* Indicators Grid */}
                        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800 space-y-3">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                                Status Indikator
                            </span>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div>
                                    <Label className="text-[11px] font-bold">IK (Ketersediaan)</Label>
                                    <select
                                        value={formIk}
                                        onChange={(e) => setFormIk(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="RENTAN">RENTAN</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold">IA (Akses)</Label>
                                    <select
                                        value={formIa}
                                        onChange={(e) => setFormIa(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="RENTAN">RENTAN</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold">IP (Gizi)</Label>
                                    <select
                                        value={formIp}
                                        onChange={(e) => setFormIp(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="RENTAN">RENTAN</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold text-emerald-700">IKB (Komposit)</Label>
                                    <select
                                        value={formIkb}
                                        onChange={(e) => setFormIkb(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-emerald-300 bg-emerald-50 p-2 text-xs font-extrabold text-emerald-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="RENTAN">RENTAN</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold">Potensi Kering</Label>
                                    <select
                                        value={formPotensiKering}
                                        onChange={(e) => setFormPotensiKering(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="SIAGA">SIAGA</option>
                                        <option value="AWAS">AWAS</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold">Potensi Basah</Label>
                                    <select
                                        value={formPotensiBasah}
                                        onChange={(e) => setFormPotensiBasah(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="SIAGA">SIAGA</option>
                                        <option value="AWAS">AWAS</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-[11px] font-bold">Kondisi Iklim</Label>
                                    <select
                                        value={formKondisiIklim}
                                        onChange={(e) => setFormKondisiIklim(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="SIAGA">SIAGA</option>
                                        <option value="AWAS">AWAS</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700">Catatan / Keterangan</Label>
                            <Input
                                type="text"
                                placeholder="Misal: Wilayah terpantau stabil, tidak ada anomali..."
                                value={formKeterangan}
                                onChange={(e) => setFormKeterangan(e.target.value)}
                                className="mt-1 rounded-xl text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-xl bg-[#006565] text-white hover:bg-[#004e4e]"
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* EDIT MODAL */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-xl rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                            Edit Data SKPG: Kecamatan {formKecamatan}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Periode {MONTH_NAMES[formMonth - 1]} {formYear}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
                        {/* Indicators Grid */}
                        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800 space-y-3">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                                Ubah Status Indikator
                            </span>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div>
                                    <Label className="text-[11px] font-bold">IK (Ketersediaan)</Label>
                                    <select
                                        value={formIk}
                                        onChange={(e) => setFormIk(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="RENTAN">RENTAN</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold">IA (Akses)</Label>
                                    <select
                                        value={formIa}
                                        onChange={(e) => setFormIa(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="RENTAN">RENTAN</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold">IP (Gizi)</Label>
                                    <select
                                        value={formIp}
                                        onChange={(e) => setFormIp(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="RENTAN">RENTAN</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold text-emerald-700">IKB (Komposit)</Label>
                                    <select
                                        value={formIkb}
                                        onChange={(e) => setFormIkb(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-emerald-300 bg-emerald-50 p-2 text-xs font-extrabold text-emerald-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="RENTAN">RENTAN</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold">Potensi Kering</Label>
                                    <select
                                        value={formPotensiKering}
                                        onChange={(e) => setFormPotensiKering(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="SIAGA">SIAGA</option>
                                        <option value="AWAS">AWAS</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold">Potensi Basah</Label>
                                    <select
                                        value={formPotensiBasah}
                                        onChange={(e) => setFormPotensiBasah(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="SIAGA">SIAGA</option>
                                        <option value="AWAS">AWAS</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-[11px] font-bold">Kondisi Iklim</Label>
                                    <select
                                        value={formKondisiIklim}
                                        onChange={(e) => setFormKondisiIklim(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="SIAGA">SIAGA</option>
                                        <option value="AWAS">AWAS</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700">Catatan / Keterangan</Label>
                            <Input
                                type="text"
                                placeholder="Catatan evaluasi..."
                                value={formKeterangan}
                                onChange={(e) => setFormKeterangan(e.target.value)}
                                className="mt-1 rounded-xl text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                                className="rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-xl bg-[#006565] text-white hover:bg-[#004e4e]"
                            >
                                {isSubmitting ? 'Memperbarui...' : 'Simpan Perubahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE MODAL */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-md rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-rose-600 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            <span>Hapus Data SKPG?</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Apakah Anda yakin ingin menghapus data SKPG Kecamatan{' '}
                            <span className="font-bold text-slate-900 dark:text-white">
                                {selectedRecord?.kecamatan}
                            </span>{' '}
                            periode {selectedRecord && MONTH_NAMES[selectedRecord.month - 1]}{' '}
                            {selectedRecord?.year}? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="rounded-xl"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleDeleteSubmit}
                            disabled={isSubmitting}
                            className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                        >
                            {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

