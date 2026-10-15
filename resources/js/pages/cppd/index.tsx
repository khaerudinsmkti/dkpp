import { Head, Link, router } from '@inertiajs/react';
import {
    Archive,
    ArrowDownRight,
    ArrowUpRight,
    Calendar,
    Check,
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
    Package,
    Pencil,
    Plus,
    PlusCircle,
    RefreshCw,
    Search,
    ShieldCheck,
    Trash2,
    Truck,
    Wheat,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { formatKg } from '@/components/cppd-map';
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
import { index as cppdIndex } from '@/routes/cppd';
import type { BreadcrumbItem } from '@/types';

export interface CppdRecordItem {
    id: number;
    tanggal: string;
    status: 'pengadaan' | 'penyaluran' | 'addendum';
    status_label: string;
    kecamatan: string;
    desa: string;
    jumlah: number;
    keterangan: string | null;
    created_by_name?: string | null;
    created_at?: string | null;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedRecords {
    data: CppdRecordItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

export interface InitialStockData {
    id: number;
    year: number;
    amount: number;
    keterangan: string | null;
}

export interface CppdAdminPageProps {
    records: PaginatedRecords;
    selectedYear: number;
    availableYears: number[];
    filters: {
        status?: string | null;
        kecamatan?: string | null;
        search?: string | null;
    };
    summary: {
        stok_awal: number;
        total_pengadaan: number;
        total_penyaluran: number;
        total_addendum: number;
        stok_akhir: number;
    };
    initialStock?: InitialStockData | null;
    territory: {
        kecamatanList: string[];
        desaByKecamatan: Record<string, string[]>;
    };
    statuses: Record<string, string>;
}

export default function CppdAdminIndex({
    records,
    selectedYear,
    availableYears,
    filters,
    summary,
    initialStock,
    territory,
    statuses,
}: CppdAdminPageProps) {
    // Filter controls state
    const [searchQuery, setSearchQuery] = useState<string>(filters.search || '');
    const [statusFilter, setStatusFilter] = useState<string>(filters.status || 'all');
    const [kecamatanFilter, setKecamatanFilter] = useState<string>(filters.kecamatan || 'all');

    // Create / Edit Modal State
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [editingRecord, setEditingRecord] = useState<CppdRecordItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Form inputs
    const [formTanggal, setFormTanggal] = useState<string>(new Date().toISOString().slice(0, 10));
    const [formStatus, setFormStatus] = useState<string>('penyaluran');
    const [formKecamatan, setFormKecamatan] = useState<string>('');
    const [formDesa, setFormDesa] = useState<string>('');
    const [formJumlah, setFormJumlah] = useState<string>('');
    const [formKeterangan, setFormKeterangan] = useState<string>('');
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Initial Stock Modal State
    const [initialStockModalOpen, setInitialStockModalOpen] = useState<boolean>(false);
    const [stockAmount, setStockAmount] = useState<string>(initialStock ? String(initialStock.amount) : '0');
    const [stockNote, setStockNote] = useState<string>(initialStock?.keterangan || '');
    const [isSubmittingStock, setIsSubmittingStock] = useState<boolean>(false);

    // Delete Confirmation Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [deletingRecord, setDeletingRecord] = useState<CppdRecordItem | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    // Available desas automatically derived from selected form kecamatan (Requirement 5)
    const availableDesasForForm = useMemo(() => {
        if (!formKecamatan) return [];
        return territory.desaByKecamatan[formKecamatan.toUpperCase()] || [];
    }, [formKecamatan, territory.desaByKecamatan]);

    // Handle Year Change
    const handleYearChange = (year: number) => {
        router.get(
            '/cppd-admin',
            {
                year,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                kecamatan: kecamatanFilter !== 'all' ? kecamatanFilter : undefined,
                search: searchQuery || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Apply Filter Search
    const handleApplyFilters = (newStatus?: string, newKecamatan?: string, newSearch?: string) => {
        const s = newStatus !== undefined ? newStatus : statusFilter;
        const k = newKecamatan !== undefined ? newKecamatan : kecamatanFilter;
        const q = newSearch !== undefined ? newSearch : searchQuery;

        router.get(
            '/cppd-admin',
            {
                year: selectedYear,
                status: s !== 'all' ? s : undefined,
                kecamatan: k !== 'all' ? k : undefined,
                search: q || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Open Create Modal
    const handleOpenCreateModal = () => {
        setEditingRecord(null);
        setFormTanggal(new Date().toISOString().slice(0, 10));
        setFormStatus('penyaluran');
        setFormKecamatan(territory.kecamatanList[0] || '');
        const defaultDesas = territory.desaByKecamatan[territory.kecamatanList[0]] || [];
        setFormDesa(defaultDesas[0] || '');
        setFormJumlah('');
        setFormKeterangan('');
        setFormErrors({});
        setModalOpen(true);
    };

    // Open Edit Modal
    const handleOpenEditModal = (record: CppdRecordItem) => {
        setEditingRecord(record);
        setFormTanggal(record.tanggal);
        setFormStatus(record.status);
        setFormKecamatan(record.kecamatan.toUpperCase());
        setFormDesa(record.desa.toUpperCase());
        setFormJumlah(String(record.jumlah));
        setFormKeterangan(record.keterangan || '');
        setFormErrors({});
        setModalOpen(true);
    };

    // Handle Kecamatan Change in Form -> Automatically update Desa (Requirement 5)
    const handleFormKecamatanChange = (kec: string) => {
        setFormKecamatan(kec);
        const desas = territory.desaByKecamatan[kec.toUpperCase()] || [];
        // If current desa is not in the new kecamatan's desa list, auto select the first available desa
        if (!desas.includes(formDesa)) {
            setFormDesa(desas[0] || '');
        }
    };

    // Submit Create or Update
    const handleSubmitForm = (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});

        if (!formTanggal) {
            setFormErrors((prev) => ({ ...prev, tanggal: 'Tanggal wajib diisi' }));
            return;
        }
        if (!formKecamatan) {
            setFormErrors((prev) => ({ ...prev, kecamatan: 'Kecamatan wajib dipilih' }));
            return;
        }
        if (!formDesa) {
            setFormErrors((prev) => ({ ...prev, desa: 'Desa wajib dipilih' }));
            return;
        }
        const parsedJumlah = parseFloat(formJumlah);
        if (isNaN(parsedJumlah) || parsedJumlah <= 0) {
            setFormErrors((prev) => ({ ...prev, jumlah: 'Jumlah (kg) harus lebih besar dari 0' }));
            return;
        }

        setIsSubmitting(true);

        const payload = {
            tanggal: formTanggal,
            status: formStatus,
            kecamatan: formKecamatan,
            desa: formDesa,
            jumlah: parsedJumlah,
            keterangan: formKeterangan || null,
        };

        if (editingRecord) {
            router.put(`/cppd-admin/${editingRecord.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Data transaksi CPPD berhasil diperbarui.');
                    setModalOpen(false);
                    setIsSubmitting(false);
                },
                onError: (err) => {
                    toast.error('Gagal memperbarui: ' + (Object.values(err)[0] || 'Periksa kembali isian'));
                    setFormErrors(err as Record<string, string>);
                    setIsSubmitting(false);
                },
            });
        } else {
            router.post('/cppd-admin', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Data transaksi CPPD baru berhasil ditambahkan.');
                    setModalOpen(false);
                    setIsSubmitting(false);
                },
                onError: (err) => {
                    toast.error('Gagal menambahkan: ' + (Object.values(err)[0] || 'Periksa kembali isian'));
                    setFormErrors(err as Record<string, string>);
                    setIsSubmitting(false);
                },
            });
        }
    };

    // Open Delete Modal
    const handleOpenDeleteModal = (record: CppdRecordItem) => {
        setDeletingRecord(record);
        setDeleteModalOpen(true);
    };

    // Confirm Delete
    const handleConfirmDelete = () => {
        if (!deletingRecord) return;
        setIsDeleting(true);

        router.delete(`/cppd-admin/${deletingRecord.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Data transaksi CPPD berhasil dihapus.');
                setDeleteModalOpen(false);
                setIsDeleting(false);
            },
            onError: (err) => {
                toast.error('Gagal menghapus: ' + (Object.values(err)[0] || 'Terjadi kesalahan'));
                setIsDeleting(false);
            },
        });
    };

    // Save Initial Stock
    const handleSaveInitialStock = (e: React.FormEvent) => {
        e.preventDefault();
        const parsedStock = parseFloat(stockAmount);
        if (isNaN(parsedStock) || parsedStock < 0) {
            toast.error('Jumlah stok awal harus berupa angka non-negatif');
            return;
        }

        setIsSubmittingStock(true);
        router.post(
            '/cppd-admin/initial-stock',
            {
                year: selectedYear,
                amount: parsedStock,
                keterangan: stockNote || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Stok awal tahun ${selectedYear} berhasil disimpan.`);
                    setInitialStockModalOpen(false);
                    setIsSubmittingStock(false);
                },
                onError: (err) => {
                    toast.error('Gagal menyimpan stok awal: ' + (Object.values(err)[0] || 'Terjadi kesalahan'));
                    setIsSubmittingStock(false);
                },
            }
        );
    };

    return (
        <>
            <Head title={`Kelola Cadangan Pangan (CPPD) - Tahun ${selectedYear}`} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#006565] to-emerald-700 text-white shadow-md shadow-[#006565]/25">
                            <Package className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                Kelola Cadangan Pangan Pemerintah Daerah (CPPD)
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                CRUD data pengadaan, penyaluran, addendum, serta penetapan stok awal beras Kabupaten Indramayu.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Public Link */}
                        <Button variant="outline" asChild size="sm" className="gap-2 text-xs font-semibold rounded-xl">
                            <Link href="/cppd" target="_blank">
                                <ExternalLink className="h-3.5 w-3.5 text-[#006565] dark:text-emerald-400" />
                                <span>Lihat Dashboard Publik</span>
                            </Link>
                        </Button>

                        {/* Button Input Stok Awal */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setStockAmount(initialStock ? String(initialStock.amount) : '0');
                                setStockNote(initialStock?.keterangan || '');
                                setInitialStockModalOpen(true);
                            }}
                            className="gap-2 text-xs font-semibold rounded-xl border-emerald-300 bg-emerald-50/50 text-[#006565] hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        >
                            <Archive className="h-3.5 w-3.5" />
                            <span>Atur Stok Awal Tahun</span>
                        </Button>

                        {/* Button Tambah Data CPPD */}
                        <Button
                            size="sm"
                            onClick={handleOpenCreateModal}
                            className="gap-2 bg-gradient-to-r from-[#006565] to-emerald-700 text-white shadow-md shadow-[#006565]/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-bold rounded-xl"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Tambah Transaksi CPPD</span>
                        </Button>
                    </div>
                </div>

                {/* Year Selector & Summary Cards */}
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <Calendar className="h-4 w-4 text-[#006565] dark:text-emerald-400" />
                            <span>Pilih Tahun Rekapitulasi:</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {availableYears.map((y) => (
                                <button
                                    key={y}
                                    type="button"
                                    onClick={() => handleYearChange(y)}
                                    className={`rounded-xl px-3 py-1 text-xs font-extrabold transition-all cursor-pointer ${
                                        selectedYear === y
                                            ? 'bg-[#006565] text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 5 Summary Cards */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {/* 1. Stok Awal */}
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between text-slate-500 mb-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider">1. Stok Awal Tahun</span>
                                <Archive className="h-4 w-4 text-slate-400" />
                            </div>
                            <div className="text-xl font-black text-slate-900 dark:text-white">
                                {formatKg(summary.stok_awal)}
                            </div>
                            <p className="mt-1 text-[10px] text-slate-400 truncate">
                                {initialStock?.keterangan || `Stok dasar tahun ${selectedYear}`}
                            </p>
                        </div>

                        {/* 2. Total Pengadaan */}
                        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3.5 shadow-2xs dark:border-emerald-900/60 dark:bg-emerald-950/20">
                            <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 mb-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider">2. Pengadaan</span>
                                <ArrowUpRight className="h-4 w-4 text-[#006565] dark:text-emerald-400" />
                            </div>
                            <div className="text-xl font-black text-[#006565] dark:text-emerald-400">
                                + {formatKg(summary.total_pengadaan)}
                            </div>
                            <p className="mt-1 text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
                                Masuk ke cadangan pangan
                            </p>
                        </div>

                        {/* 3. Total Penyaluran */}
                        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-3.5 shadow-2xs dark:border-rose-900/60 dark:bg-rose-950/20">
                            <div className="flex items-center justify-between text-rose-800 dark:text-rose-300 mb-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider">3. Penyaluran</span>
                                <Truck className="h-4 w-4 text-rose-600" />
                            </div>
                            <div className="text-xl font-black text-rose-600 dark:text-rose-400">
                                − {formatKg(summary.total_penyaluran)}
                            </div>
                            <p className="mt-1 text-[10px] text-rose-700/80 dark:text-rose-400/80">
                                Didistribusikan ke desa
                            </p>
                        </div>

                        {/* 4. Total Addendum */}
                        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-3.5 shadow-2xs dark:border-amber-900/60 dark:bg-amber-950/20">
                            <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 mb-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider">4. Addendum</span>
                                <PlusCircle className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                                + {formatKg(summary.total_addendum)}
                            </div>
                            <p className="mt-1 text-[10px] text-amber-700/80 dark:text-amber-400/80">
                                Penyesuaian kontrak
                            </p>
                        </div>

                        {/* 5. Stok Akhir */}
                        <div className="rounded-2xl border-2 border-emerald-500 bg-[#006565] p-3.5 text-white shadow-sm">
                            <div className="flex items-center justify-between text-emerald-200 mb-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider">5. Stok Akhir CPPD</span>
                                <ShieldCheck className="h-4 w-4 text-emerald-200" />
                            </div>
                            <div className="text-xl font-black text-white">
                                {formatKg(summary.stok_akhir)}
                            </div>
                            <p className="mt-1 text-[10px] text-emerald-200 font-medium">
                                Saldo riil siap pakai
                            </p>
                        </div>
                    </div>
                </div>

                {/* Table Data Section */}
                <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                    {/* Filter and Search Bar */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-850">
                        {/* Search input */}
                        <div className="relative flex-1 min-w-[220px]">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Cari desa, kecamatan, keterangan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleApplyFilters();
                                }}
                                className="pl-9 h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                        </div>

                        {/* Filter Status */}
                        <div className="flex items-center gap-2">
                            <Select
                                value={statusFilter}
                                onValueChange={(val) => {
                                    setStatusFilter(val);
                                    handleApplyFilters(val, undefined, undefined);
                                }}
                            >
                                <SelectTrigger className="w-[150px] h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="pengadaan">Pengadaan</SelectItem>
                                    <SelectItem value="penyaluran">Penyaluran</SelectItem>
                                    <SelectItem value="addendum">Addendum</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filter Kecamatan */}
                        <div className="flex items-center gap-2">
                            <Select
                                value={kecamatanFilter}
                                onValueChange={(val) => {
                                    setKecamatanFilter(val);
                                    handleApplyFilters(undefined, val, undefined);
                                }}
                            >
                                <SelectTrigger className="w-[170px] h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
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

                        {/* Apply / Reset Filter buttons */}
                        <div className="flex items-center gap-1.5">
                            <Button
                                size="sm"
                                onClick={() => handleApplyFilters()}
                                className="h-9 text-xs font-bold rounded-xl bg-[#006565] hover:bg-[#004e4e] text-white"
                            >
                                Filter
                            </Button>
                            {(searchQuery || statusFilter !== 'all' || kecamatanFilter !== 'all') && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setStatusFilter('all');
                                        setKecamatanFilter('all');
                                        handleApplyFilters('all', 'all', '');
                                    }}
                                    className="h-9 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                >
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100/70 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="py-3 px-3.5 w-12 text-center">No</th>
                                    <th className="py-3 px-3.5">Tanggal</th>
                                    <th className="py-3 px-3.5">Status</th>
                                    <th className="py-3 px-3.5">Kecamatan</th>
                                    <th className="py-3 px-3.5">Desa</th>
                                    <th className="py-3 px-3.5 text-right">Jumlah (kg)</th>
                                    <th className="py-3 px-3.5">Keterangan</th>
                                    <th className="py-3 px-3.5">Petugas</th>
                                    <th className="py-3 px-3.5 text-center w-28">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {records.data.map((item, idx) => {
                                    let badgeColor = 'bg-slate-100 text-slate-700';
                                    if (item.status === 'pengadaan') {
                                        badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300';
                                    } else if (item.status === 'penyaluran') {
                                        badgeColor = 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300';
                                    } else if (item.status === 'addendum') {
                                        badgeColor = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300';
                                    }

                                    const rowNumber = (records.current_page - 1) * records.per_page + idx + 1;

                                    return (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                                                {rowNumber}
                                            </td>
                                            <td className="py-3 px-3.5 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                {item.tanggal}
                                            </td>
                                            <td className="py-3 px-3.5 whitespace-nowrap">
                                                <Badge className={`rounded-lg px-2 py-0.5 text-[10px] font-black border ${badgeColor}`}>
                                                    {item.status_label}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-slate-200">
                                                {item.kecamatan}
                                            </td>
                                            <td className="py-3 px-3.5 font-black text-slate-900 dark:text-white">
                                                {item.desa}
                                            </td>
                                            <td className="py-3 px-3.5 text-right font-black text-sm text-slate-900 dark:text-white">
                                                {formatKg(item.jumlah)}
                                            </td>
                                            <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 max-w-xs italic truncate">
                                                {item.keterangan || '-'}
                                            </td>
                                            <td className="py-3 px-3.5 text-[11px] text-slate-400 whitespace-nowrap">
                                                {item.created_by_name || '-'}
                                            </td>
                                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenEditModal(item)}
                                                        className="h-7 w-7 p-0 rounded-lg text-slate-600 hover:text-[#006565] hover:bg-emerald-50"
                                                        title="Edit Data"
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenDeleteModal(item)}
                                                        className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                        title="Hapus Data"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {records.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="py-12 text-center text-slate-400 font-medium"
                                        >
                                            Belum ada data transaksi CPPD yang tercatat untuk filter ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {records.last_page > 1 && (
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                            <div>
                                Menampilkan {records.from ?? 0} sampai {records.to ?? 0} dari {records.total} data
                            </div>
                            <div className="flex items-center gap-1">
                                {records.links.map((link, i) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={i}
                                                className="px-2.5 py-1 text-slate-300 dark:text-slate-600 rounded-lg"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }
                                    return (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            preserveScroll
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                                link.active
                                                    ? 'bg-[#006565] text-white'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL 1: TAMBAH / EDIT TRANSAKSI CPPD */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-lg rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Package className="h-5 w-5 text-[#006565] dark:text-emerald-400" />
                            <span>{editingRecord ? 'Edit Transaksi CPPD' : 'Tambah Transaksi CPPD Baru'}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Masukkan rincian transaksi cadangan pangan pemerintah daerah. Data desa akan otomatis menyesuaikan dengan kecamatan yang dipilih.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitForm} className="space-y-4 py-2 text-xs">
                        {/* Tanggal & Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="tanggal" className="text-xs font-bold">
                                    Tanggal Transaksi <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="tanggal"
                                    type="date"
                                    value={formTanggal}
                                    onChange={(e) => setFormTanggal(e.target.value)}
                                    className="h-9 text-xs rounded-xl"
                                    required
                                />
                                {formErrors.tanggal && (
                                    <p className="text-[11px] text-rose-500">{formErrors.tanggal}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="status" className="text-xs font-bold">
                                    Status Transaksi <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={formStatus} onValueChange={setFormStatus}>
                                    <SelectTrigger className="h-9 text-xs rounded-xl">
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pengadaan">Pengadaan</SelectItem>
                                        <SelectItem value="penyaluran">Penyaluran</SelectItem>
                                        <SelectItem value="addendum">Addendum</SelectItem>
                                    </SelectContent>
                                </Select>
                                {formErrors.status && (
                                    <p className="text-[11px] text-rose-500">{formErrors.status}</p>
                                )}
                            </div>
                        </div>

                        {/* Kecamatan & Desa (Requirement 4 & 5) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="kecamatan" className="text-xs font-bold">
                                    Kecamatan <span className="text-rose-500">*</span>
                                </Label>
                                <Select
                                    value={formKecamatan}
                                    onValueChange={handleFormKecamatanChange}
                                >
                                    <SelectTrigger className="h-9 text-xs rounded-xl">
                                        <SelectValue placeholder="Pilih Kecamatan" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-56">
                                        {territory.kecamatanList.map((kec) => (
                                            <SelectItem key={kec} value={kec}>
                                                {kec}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formErrors.kecamatan && (
                                    <p className="text-[11px] text-rose-500">{formErrors.kecamatan}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="desa" className="text-xs font-bold flex items-center justify-between">
                                    <span>Desa <span className="text-rose-500">*</span></span>
                                    <span className="text-[10px] text-emerald-600 font-semibold">
                                        {availableDesasForForm.length} Desa tersedia
                                    </span>
                                </Label>
                                <Select
                                    value={formDesa}
                                    onValueChange={setFormDesa}
                                    disabled={!formKecamatan || availableDesasForForm.length === 0}
                                >
                                    <SelectTrigger className="h-9 text-xs rounded-xl">
                                        <SelectValue placeholder={formKecamatan ? 'Pilih Desa' : 'Pilih Kecamatan dulu'} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-56">
                                        {availableDesasForForm.map((desa) => (
                                            <SelectItem key={desa} value={desa}>
                                                {desa}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formErrors.desa && (
                                    <p className="text-[11px] text-rose-500">{formErrors.desa}</p>
                                )}
                            </div>
                        </div>

                        {/* Jumlah (kg) */}
                        <div className="space-y-1.5">
                            <Label htmlFor="jumlah" className="text-xs font-bold">
                                Jumlah (kg) <span className="text-rose-500">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="jumlah"
                                    type="number"
                                    step="any"
                                    placeholder="Contoh: 5000"
                                    value={formJumlah}
                                    onChange={(e) => setFormJumlah(e.target.value)}
                                    className="h-9 text-xs rounded-xl pr-12 font-bold"
                                    required
                                />
                                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                                    kg
                                </span>
                            </div>
                            {formErrors.jumlah && (
                                <p className="text-[11px] text-rose-500">{formErrors.jumlah}</p>
                            )}
                        </div>

                        {/* Keterangan */}
                        <div className="space-y-1.5">
                            <Label htmlFor="keterangan" className="text-xs font-bold">
                                Keterangan / Catatan Transaksi
                            </Label>
                            <textarea
                                id="keterangan"
                                rows={2}
                                placeholder="Contoh: Bantuan pasca bencana banjir rob untuk 400 KK, pengadaan beras mitra Bulog, dll."
                                value={formKeterangan}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormKeterangan(e.target.value)}
                                className="flex min-h-[60px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 resize-none"
                            />
                            {formErrors.keterangan && (
                                <p className="text-[11px] text-rose-500">{formErrors.keterangan}</p>
                            )}
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setModalOpen(false)}
                                disabled={isSubmitting}
                                className="h-9 text-xs rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-9 text-xs rounded-xl font-bold bg-[#006565] hover:bg-[#004e4e] text-white"
                            >
                                {isSubmitting ? 'Menyimpan...' : editingRecord ? 'Simpan Perubahan' : 'Tambah Transaksi'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 2: INPUT STOK AWAL TAHUN (Requirement 3) */}
            <Dialog open={initialStockModalOpen} onOpenChange={setInitialStockModalOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Archive className="h-5 w-5 text-[#006565] dark:text-emerald-400" />
                            <span>Input Stok Awal Tahun {selectedYear}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Stok awal tahun menjadi dasar perhitungan saldo akhir cadangan pangan (CPPD) pada tahun anggaran {selectedYear}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveInitialStock} className="space-y-4 py-2 text-xs">
                        <div className="space-y-1.5">
                            <Label htmlFor="stockAmount" className="text-xs font-bold">
                                Jumlah Stok Awal (kg) <span className="text-rose-500">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="stockAmount"
                                    type="number"
                                    step="any"
                                    value={stockAmount}
                                    onChange={(e) => setStockAmount(e.target.value)}
                                    placeholder="Contoh: 120000"
                                    className="h-9 text-xs rounded-xl pr-12 font-bold"
                                    required
                                />
                                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                                    kg
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="stockNote" className="text-xs font-bold">
                                Keterangan / Sumber Saldo
                            </Label>
                            <textarea
                                id="stockNote"
                                rows={2}
                                value={stockNote}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStockNote(e.target.value)}
                                placeholder="Contoh: Penetapan stok beras awal tahun APBD 2026 atau sisa saldo tahun sebelumnya."
                                className="flex min-h-[60px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 resize-none"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setInitialStockModalOpen(false)}
                                disabled={isSubmittingStock}
                                className="h-9 text-xs rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmittingStock}
                                className="h-9 text-xs rounded-xl font-bold bg-[#006565] hover:bg-[#004e4e] text-white"
                            >
                                {isSubmittingStock ? 'Menyimpan...' : 'Simpan Stok Awal'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 3: KONFIRMASI HAPUS */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-rose-600 flex items-center gap-2">
                            <Trash2 className="h-5 w-5" />
                            <span>Hapus Transaksi CPPD?</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Tindakan ini tidak dapat dibatalkan. Catatan transaksi berikut akan dihapus secara permanen dari basis data:
                        </DialogDescription>
                    </DialogHeader>

                    {deletingRecord && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1 dark:border-slate-800 dark:bg-slate-900">
                            <div>
                                <span className="text-slate-400">Tanggal:</span>{' '}
                                <span className="font-bold">{deletingRecord.tanggal}</span>
                            </div>
                            <div>
                                <span className="text-slate-400">Status:</span>{' '}
                                <span className="font-bold uppercase text-[#006565]">{deletingRecord.status}</span>
                            </div>
                            <div>
                                <span className="text-slate-400">Lokasi:</span>{' '}
                                <span className="font-bold">Desa {deletingRecord.desa}, Kec. {deletingRecord.kecamatan}</span>
                            </div>
                            <div>
                                <span className="text-slate-400">Volume:</span>{' '}
                                <span className="font-black text-rose-600">{formatKg(deletingRecord.jumlah)}</span>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={isDeleting}
                            className="h-9 text-xs rounded-xl"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="h-9 text-xs rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

CppdAdminIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Cadangan Pangan (CPPD)',
            href: cppdIndex(),
        },
    ] satisfies BreadcrumbItem[],
};


