import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    History,
    Info,
    Pencil,
    Plus,
    Scale,
    Search,
    ShieldAlert,
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
import { index as producerCommoditiesIndex } from '@/routes/producer-commodities';
import {
    destroy as destroyProducerHapAction,
    index as producerHapsIndex,
    store as storeProducerHapAction,
    update as updateProducerHapAction,
} from '@/routes/producer-haps';
import { index as producerPricesIndex } from '@/routes/producer-prices';
import type { BreadcrumbItem } from '@/types';

export interface HapHistory {
    id: number;
    price: number;
    effective_date: string;
    source_regulation: string | null;
    notes: string | null;
    creator: string | null;
    is_current: boolean;
    created_at: string | null;
}

export interface ProducerCommodityHapItem {
    id: number;
    name: string;
    slug: string;
    key: string;
    category: string;
    unit: string;
    order: number;
    current_hap: {
        id: number;
        price: number;
        effective_date: string;
        source_regulation: string | null;
        notes: string | null;
    } | null;
    revisions_count: number;
    histories: HapHistory[];
}

export interface PageProps {
    commodities: ProducerCommodityHapItem[];
    allCommodities: {
        id: number;
        name: string;
        category: string;
        unit: string;
    }[];
    categories: string[];
    filters: {
        search: string;
        category: string;
    };
    statistics: {
        total_commodities: number;
        configured_count: number;
        total_revisions: number;
    };
}

export default function ProducerHapsIndex({
    commodities,
    allCommodities,
    categories,
    filters,
    statistics,
}: PageProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || 'all');

    // Add / Edit HAP Modal state
    const [hapModalOpen, setHetModalOpen] = useState(false);
    const [editingHapId, setEditingHapId] = useState<number | null>(null);
    const [targetCommodityId, setTargetCommodityId] = useState<string>('');
    const [hapPrice, setHetPrice] = useState<string>('');
    const [effectiveDate, setEffectiveDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [sourceRegulation, setSourceRegulation] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // History Dialog state
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedCommodityForHistory, setSelectedCommodityForHistory] =
        useState<ProducerCommodityHapItem | null>(null);

    // Delete Modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingHapId, setDeletingHapId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Format currency
    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined) return '-';
        return 'Rp ' + Number(amount).toLocaleString('id-ID');
    };

    // Filter commodities client-side
    const filteredCommodities = useMemo(() => {
        return commodities.filter((item) => {
            const matchesSearch =
                searchTerm === '' ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.key.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory =
                selectedCategory === 'all' || item.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [commodities, searchTerm, selectedCategory]);

    // Open Add Modal
    const handleOpenAddHap = (commodityId?: number) => {
        setEditingHapId(null);
        setTargetCommodityId(commodityId ? String(commodityId) : (allCommodities[0]?.id ? String(allCommodities[0].id) : ''));
        setHetPrice('');
        setEffectiveDate(new Date().toISOString().split('T')[0]);
        setSourceRegulation('Perbadan No. 6/2023');
        setNotes('');
        setHetModalOpen(true);
    };

    // Open Edit Modal from history or row
    const handleOpenEditHap = (commId: number, hap: HapHistory | { id: number; price: number; effective_date: string; source_regulation: string | null; notes: string | null }) => {
        setEditingHapId(hap.id);
        setTargetCommodityId(String(commId));
        setHetPrice(String(hap.price));
        setEffectiveDate(hap.effective_date);
        setSourceRegulation(hap.source_regulation || '');
        setNotes(hap.notes || '');
        setHetModalOpen(true);
    };

    // Submit Add or Edit
    const handleSubmitHap = (e: React.FormEvent) => {
        e.preventDefault();
        const priceNum = parseFloat(hapPrice);

        if (isNaN(priceNum) || priceNum <= 0) {
            toast.error('Nilai HAP harus berupa angka positif.');
            return;
        }

        if (!effectiveDate) {
            toast.error('Tanggal berlaku wajib diisi.');
            return;
        }

        setIsSubmitting(true);

        if (editingHapId) {
            router.put(
                updateProducerHapAction.url(editingHapId),
                {
                    price: priceNum,
                    effective_date: effectiveDate,
                    source_regulation: sourceRegulation || null,
                    notes: notes || null,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Perubahan HAP produsen berhasil disimpan.');
                        setHetModalOpen(false);
                        setIsSubmitting(false);
                    },
                    onError: (err) => {
                        toast.error('Gagal menyimpan HAP: ' + Object.values(err)[0]);
                        setIsSubmitting(false);
                    },
                }
            );
        } else {
            router.post(
                storeProducerHapAction.url(),
                {
                    producer_commodity_id: Number(targetCommodityId),
                    price: priceNum,
                    effective_date: effectiveDate,
                    source_regulation: sourceRegulation || null,
                    notes: notes || null,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('HAP acuan produsen baru berhasil ditetapkan.');
                        setHetModalOpen(false);
                        setIsSubmitting(false);
                    },
                    onError: (err) => {
                        toast.error('Gagal menambahkan HAP: ' + Object.values(err)[0]);
                        setIsSubmitting(false);
                    },
                }
            );
        }
    };

    // Open Delete confirmation
    const handleOpenDelete = (hapId: number) => {
        setDeletingHapId(hapId);
        setDeleteModalOpen(true);
    };

    // Confirm Delete
    const handleConfirmDelete = () => {
        if (!deletingHapId) return;

        setIsDeleting(true);
        router.delete(destroyProducerHapAction.url(deletingHapId), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Riwayat HAP produsen berhasil dihapus.');
                setDeleteModalOpen(false);
                setIsDeleting(false);
            },
            onError: (err) => {
                toast.error('Gagal menghapus HAP: ' + Object.values(err)[0]);
                setIsDeleting(false);
            },
        });
    };

    // Open History Dialog
    const handleOpenHistory = (item: ProducerCommodityHapItem) => {
        setSelectedCommodityForHistory(item);
        setHistoryModalOpen(true);
    };

    return (
        <>
            <Head title="Pengelolaan HAP Produsen - DKPP Indramayu" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-md shadow-amber-600/20">
                                <Scale className="size-5" />
                            </div>
                            <div>
                                <h1 className="font-headline text-2xl sm:text-[30px] font-extrabold tracking-tight text-foreground">
                                    Pengelolaan HAP Produsen Dinamis
                                </h1>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    Penetapan dan riwayat revisi Harga Acuan Pembelian Pemerintah (HAP) Bapanas untuk produsen pangan Indramayu.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" asChild className="gap-2 text-xs font-semibold">
                            <Link href={producerCommoditiesIndex.url()}>
                                <Wheat className="size-4 text-amber-600" />
                                <span>Master Komoditas Produsen</span>
                            </Link>
                        </Button>

                        <Button variant="outline" asChild className="gap-2 text-xs font-semibold">
                            <Link href={producerPricesIndex.url()}>
                                <Wheat className="size-4 text-emerald-600" />
                                <span>Input Harga Produsen</span>
                            </Link>
                        </Button>

                        <Button
                            onClick={() => handleOpenAddHap()}
                            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 text-xs font-bold"
                        >
                            <Plus className="size-4" />
                            <span>Tambah Revisi HAP</span>
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                        <CardHeader className="p-4 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Total Komoditas Produsen
                            </span>
                            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">
                                {statistics.total_commodities} Komoditas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <span className="text-[11px] text-slate-500">
                                Gabah, Beras Giling, &amp; Sapi Hidup
                            </span>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                        <CardHeader className="p-4 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                                Terkonfigurasi HAP Aktif
                            </span>
                            <CardTitle className="text-2xl font-black text-emerald-700">
                                {statistics.configured_count} / {statistics.total_commodities}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <span className="text-[11px] text-slate-500">
                                {statistics.configured_count === statistics.total_commodities
                                    ? 'Seluruh komoditas memiliki acuan HAP'
                                    : `${statistics.total_commodities - statistics.configured_count} belum memiliki HAP`}
                            </span>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                        <CardHeader className="p-4 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                                Total Riwayat Revisi HAP
                            </span>
                            <CardTitle className="text-2xl font-black text-amber-700">
                                {statistics.total_revisions} Riwayat
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <span className="text-[11px] text-slate-500">
                                Rekam jejak perubahan acuan dari Bapanas
                            </span>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input
                            placeholder="Cari komoditas produsen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 text-xs h-9 bg-slate-50 dark:bg-slate-800/80"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-40 text-xs h-9 bg-slate-50 dark:bg-slate-800/80">
                                <SelectValue placeholder="Semua Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kategori</SelectItem>
                                {categories.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table of Producer Commodities HAP */}
                <Card className="rounded-2xl border-slate-200/80 shadow-xs overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
                                    <tr>
                                        <th className="px-4 py-3.5 text-center w-12">No</th>
                                        <th className="px-4 py-3.5">Nama Komoditas Produsen</th>
                                        <th className="px-4 py-3.5">Kategori / Satuan</th>
                                        <th className="px-4 py-3.5 text-right">HAP Berlaku Saat Ini</th>
                                        <th className="px-4 py-3.5">Dasar Regulasi</th>
                                        <th className="px-4 py-3.5">Mulai Berlaku</th>
                                        <th className="px-4 py-3.5 text-center">Riwayat</th>
                                        <th className="px-4 py-3.5 text-center w-36">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {filteredCommodities.length > 0 ? (
                                        filteredCommodities.map((item, idx) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                                            >
                                                <td className="px-4 py-3.5 text-center font-bold text-slate-400">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="font-bold text-slate-900 dark:text-white">
                                                        {item.name}
                                                    </div>
                                                    <code className="text-[10px] text-slate-400">
                                                        {item.key}
                                                    </code>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                                                        {item.category}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400">
                                                        Per {item.unit}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    {item.current_hap ? (
                                                        <div className="text-base font-black text-slate-900 dark:text-white">
                                                            {formatCurrency(item.current_hap.price)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">
                                                            Belum diatur
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {item.current_hap?.source_regulation ? (
                                                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                                                            <FileText className="size-3 text-amber-600" />
                                                            <span>{item.current_hap.source_regulation}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {item.current_hap?.effective_date ? (
                                                        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                                                            <Clock className="size-3 text-slate-400" />
                                                            <span>{item.current_hap.effective_date}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenHistory(item)}
                                                        className="h-7 text-xs font-bold gap-1 text-slate-600 hover:text-amber-700"
                                                    >
                                                        <History className="size-3.5" />
                                                        <span>{item.revisions_count} Versi</span>
                                                    </Button>
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleOpenAddHap(item.id)}
                                                            className="h-8 px-2 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 font-bold"
                                                            title="Tetapkan Revisi HAP Baru"
                                                        >
                                                            <Plus className="size-3.5" />
                                                            <span>Revisi</span>
                                                        </Button>
                                                        {item.current_hap && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleOpenEditHap(item.id, item.current_hap!)}
                                                                className="h-8 px-2 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                                                                title="Edit HAP Saat Ini"
                                                            >
                                                                <Pencil className="size-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                                                Tidak ditemukan komoditas produsen yang sesuai.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* ============================================================== */}
                {/* MODAL 1: ADD / EDIT HAP DIALOG                                 */}
                {/* ============================================================== */}
                <Dialog open={hapModalOpen} onOpenChange={setHetModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                                <Scale className="size-5 text-amber-600" />
                                <span>{editingHapId ? 'Edit Konfigurasi HAP' : 'Penetapan HAP Produsen Baru'}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                {editingHapId
                                    ? 'Perbarui nilai atau dasar hukum penetapan HAP produsen.'
                                    : 'Tetapkan nilai batas bawah acuan pembelian pemerintah untuk komoditas produsen.'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitHap} className="space-y-4 pt-2">
                            <div>
                                <Label className="text-xs font-bold text-slate-700">
                                    Pilih Komoditas Produsen *
                                </Label>
                                <Select
                                    value={targetCommodityId}
                                    onValueChange={setTargetCommodityId}
                                    disabled={editingHapId !== null}
                                >
                                    <SelectTrigger className="mt-1 text-xs h-9">
                                        <SelectValue placeholder="Pilih Komoditas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allCommodities.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name} ({c.unit})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="hap-price" className="text-xs font-bold text-slate-700">
                                        Harga HAP (Rp) *
                                    </Label>
                                    <div className="relative mt-1">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            Rp
                                        </span>
                                        <Input
                                            id="hap-price"
                                            type="number"
                                            min="0"
                                            placeholder="Contoh: 6000"
                                            value={hapPrice}
                                            onChange={(e) => setHetPrice(e.target.value)}
                                            className="pl-8 text-xs font-bold h-9"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="hap-date" className="text-xs font-bold text-slate-700">
                                        Mulai Berlaku *
                                    </Label>
                                    <Input
                                        id="hap-date"
                                        type="date"
                                        value={effectiveDate}
                                        onChange={(e) => setEffectiveDate(e.target.value)}
                                        className="mt-1 text-xs font-bold h-9"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="hap-reg" className="text-xs font-bold text-slate-700">
                                    Dasar Regulasi / Keputusan Bapanas
                                </Label>
                                <Input
                                    id="hap-reg"
                                    placeholder="Contoh: Perbadan No. 6/2023 atau SE Bapanas"
                                    value={sourceRegulation}
                                    onChange={(e) => setSourceRegulation(e.target.value)}
                                    className="mt-1 text-xs h-9"
                                />
                            </div>

                            <div>
                                <Label htmlFor="hap-notes" className="text-xs font-bold text-slate-700">
                                    Catatan / Keterangan (Opsional)
                                </Label>
                                <Input
                                    id="hap-notes"
                                    placeholder="Keterangan mutu acuan..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setHetModalOpen(false)}
                                    className="text-xs"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan HAP'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ============================================================== */}
                {/* MODAL 2: RIWAYAT REVISI HAP DIALOG                             */}
                {/* ============================================================== */}
                <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
                    <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                                <History className="size-5 text-amber-600" />
                                <span>Riwayat HAP: {selectedCommodityForHistory?.name}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Rekam jejak seluruh penetapan Harga Acuan Pembelian Pemerintah dari waktu ke waktu.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 pt-2">
                            {selectedCommodityForHistory?.histories && selectedCommodityForHistory.histories.length > 0 ? (
                                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-xs">
                                    {selectedCommodityForHistory.histories.map((h, i) => (
                                        <div
                                            key={h.id}
                                            className={`p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                                                h.is_current ? 'bg-amber-50/50' : 'hover:bg-slate-50/60'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base font-black text-slate-900">
                                                        {formatCurrency(h.price)} / {selectedCommodityForHistory.unit}
                                                    </span>
                                                    {h.is_current && (
                                                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                                                            Berlaku Saat Ini
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                                    <span>Mulai: <strong className="text-slate-700">{h.effective_date}</strong></span>
                                                    {h.source_regulation && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="font-semibold text-slate-700">{h.source_regulation}</span>
                                                        </>
                                                    )}
                                                    {h.creator && (
                                                        <>
                                                            <span>•</span>
                                                            <span>Oleh: {h.creator}</span>
                                                        </>
                                                    )}
                                                </div>
                                                {h.notes && (
                                                    <p className="mt-1 text-[11px] text-slate-500 italic">
                                                        &quot;{h.notes}&quot;
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 self-end sm:self-auto">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setHistoryModalOpen(false);
                                                        handleOpenEditHap(selectedCommodityForHistory.id, h);
                                                    }}
                                                    className="h-7 px-2 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 font-bold"
                                                >
                                                    <Pencil className="size-3 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenDelete(h.id)}
                                                    className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                                >
                                                    <Trash2 className="size-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-xs text-slate-400">
                                    Belum ada riwayat HAP untuk komoditas ini.
                                </div>
                            )}

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setHistoryModalOpen(false)}
                                    className="text-xs"
                                >
                                    Tutup
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setHistoryModalOpen(false);
                                        if (selectedCommodityForHistory) {
                                            handleOpenAddHap(selectedCommodityForHistory.id);
                                        }
                                    }}
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Tambah Revisi Baru</span>
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* ============================================================== */}
                {/* MODAL 3: DELETE HAP CONFIRMATION DIALOG                        */}
                {/* ============================================================== */}
                <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-rose-600">
                                <ShieldAlert className="size-5" />
                                <span>Hapus Riwayat HAP</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-600">
                                Apakah Anda yakin ingin menghapus entri riwayat HAP ini? Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDeleteModalOpen(false)}
                                className="text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                            >
                                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

ProducerHapsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Kelola HAP Produsen',
            href: producerHapsIndex(),
        },
    ] satisfies BreadcrumbItem[],
};

