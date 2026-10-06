import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    History,
    Info,
    Layers,
    Pencil,
    Plus,
    Scale,
    Search,
    ShieldAlert,
    ShoppingBag,
    Trash2,
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
import { index as consumerPricesIndex } from '@/routes/consumer-prices';
import {
    destroy as destroyHetAction,
    index as hetsIndex,
    store as storeHetAction,
    update as updateHetAction,
} from '@/routes/hets';
import type { BreadcrumbItem } from '@/types';

interface HetHistory {
    id: number;
    price: number;
    effective_date: string;
    source_regulation: string | null;
    notes: string | null;
    creator: string | null;
    is_current: boolean;
    created_at: string | null;
}

interface CommodityHetItem {
    id: number;
    name: string;
    slug: string;
    category: string;
    unit: string;
    order: number;
    current_het: {
        id: number;
        price: number;
        effective_date: string;
        source_regulation: string | null;
        notes: string | null;
    } | null;
    revisions_count: number;
    histories: HetHistory[];
}

interface PageProps {
    commodities: CommodityHetItem[];
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

export default function HetsIndex({
    commodities,
    allCommodities,
    categories,
    filters,
    statistics,
}: PageProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || 'all');

    // Add / Edit HET Modal state
    const [hetModalOpen, setHetModalOpen] = useState(false);
    const [editingHetId, setEditingHetId] = useState<number | null>(null);
    const [targetCommodityId, setTargetCommodityId] = useState<string>('');
    const [hetPrice, setHetPrice] = useState<string>('');
    const [effectiveDate, setEffectiveDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [sourceRegulation, setSourceRegulation] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // History Modal state
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [activeCommodityForHistory, setActiveCommodityForHistory] =
        useState<CommodityHetItem | null>(null);

    // Filter commodities client-side
    const filteredCommodities = useMemo(() => {
        return commodities.filter((item) => {
            const matchesSearch =
                searchTerm === '' ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory =
                selectedCategory === 'all' || item.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [commodities, searchTerm, selectedCategory]);

    const formatCurrency = (amount: number | null) => {
        if (amount === null || amount === undefined) return '-';
        return 'Rp ' + Number(amount).toLocaleString('id-ID');
    };

    // Open Add Modal
    const handleOpenAdd = (commodityId?: number) => {
        setEditingHetId(null);
        setTargetCommodityId(commodityId ? String(commodityId) : allCommodities[0] ? String(allCommodities[0].id) : '');
        setHetPrice('');
        setEffectiveDate(new Date().toISOString().split('T')[0]);
        setSourceRegulation('');
        setNotes('');
        setHetModalOpen(true);
    };

    // Open Edit Existing HET Record Modal
    const handleOpenEdit = (historyItem: HetHistory, commodityId: number) => {
        setEditingHetId(historyItem.id);
        setTargetCommodityId(String(commodityId));
        setHetPrice(String(historyItem.price));
        setEffectiveDate(historyItem.effective_date);
        setSourceRegulation(historyItem.source_regulation || '');
        setNotes(historyItem.notes || '');
        setHetModalOpen(true);
    };

    // Open History View
    const handleOpenHistory = (commodity: CommodityHetItem) => {
        setActiveCommodityForHistory(commodity);
        setHistoryModalOpen(true);
    };

    // Save HET (Create or Update)
    const handleSubmitHet = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetCommodityId || !hetPrice || !effectiveDate) {
            toast.error('Mohon lengkapi data yang wajib diisi.');
            return;
        }

        setIsSubmitting(true);

        if (editingHetId) {
            router.put(
                updateHetAction.url(editingHetId),
                {
                    price: parseFloat(hetPrice),
                    effective_date: effectiveDate,
                    source_regulation: sourceRegulation || null,
                    notes: notes || null,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Data HET berhasil diperbarui.');
                        setHetModalOpen(false);
                        setIsSubmitting(false);
                        // Refresh active commodity for history if open
                        if (activeCommodityForHistory) {
                            const updated = commodities.find((c) => c.id === activeCommodityForHistory.id);
                            if (updated) setActiveCommodityForHistory(updated);
                        }
                    },
                    onError: (err) => {
                        toast.error('Gagal memperbarui HET: ' + Object.values(err)[0]);
                        setIsSubmitting(false);
                    },
                }
            );
        } else {
            router.post(
                storeHetAction.url(),
                {
                    commodity_id: Number(targetCommodityId),
                    price: parseFloat(hetPrice),
                    effective_date: effectiveDate,
                    source_regulation: sourceRegulation || null,
                    notes: notes || null,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('HET baru berhasil ditambahkan.');
                        setHetModalOpen(false);
                        setIsSubmitting(false);
                    },
                    onError: (err) => {
                        toast.error('Gagal menambahkan HET: ' + Object.values(err)[0]);
                        setIsSubmitting(false);
                    },
                }
            );
        }
    };

    // Delete HET
    const handleDeleteHet = (hetId: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus catatan riwayat HET ini?')) {
            return;
        }

        router.delete(destroyHetAction.url(hetId), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Riwayat HET berhasil dihapus.');
                if (activeCommodityForHistory) {
                    const updated = commodities.find((c) => c.id === activeCommodityForHistory.id);
                    if (updated) setActiveCommodityForHistory(updated);
                }
            },
        });
    };

    return (
        <>
            <Head title="Kelola HET Komoditas - DKPP Indramayu" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                                <Scale className="size-5" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                Kelola Harga Eceran Tertinggi (HET)
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Pengaturan HET dinamis per komoditas pangan. Setiap penetapan memiliki tanggal berlaku resmi untuk menjaga integritas data harga historis.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            variant="outline"
                            asChild
                            className="gap-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                        >
                            <Link href={consumerPricesIndex.url()}>
                                <ShoppingBag className="size-4" />
                                Ke Modul Harga Konsumen
                            </Link>
                        </Button>

                        <Button
                            onClick={() => handleOpenAdd()}
                            className="gap-2 bg-blue-600 text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                            <Plus className="size-4" />
                            Tambah / Update HET Baru
                        </Button>
                    </div>
                </div>

                {/* Explanatory Rule Banner */}
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-4 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                    <Info className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div className="text-sm">
                        <span className="font-semibold">Ketentuan HET Dinamis:</span> Setiap perubahan HET tidak menimpa data masa lalu. Apabila ada regulasi HET baru (misal Perbadan Bapanas terbaru), cukup tambahkan HET baru dengan mengisi <span className="font-semibold">Tanggal Mulai Berlaku</span>. Harga komoditas di masa lalu tetap dinilai terhadap HET lama pada masa tersebut, sedangkan harga yang diinput pada atau setelah tanggal baru otomatis dinilai terhadap HET terbaru.
                    </div>
                </div>

                {/* Statistics Overview */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-neutral-500">Total Komoditas</CardTitle>
                            <Layers className="size-4 text-neutral-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_commodities}</div>
                            <p className="mt-1 text-xs text-neutral-500">Komoditas pangan yang dipantau</p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-neutral-500">HET Aktif Terdefinisi</CardTitle>
                            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {statistics.configured_count} / {statistics.total_commodities}
                            </div>
                            <p className="mt-1 text-xs text-neutral-500">Memiliki dasar acuan harga per hari ini</p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-neutral-500">Total Riwayat Versi Regulasi</CardTitle>
                            <History className="size-4 text-blue-600 dark:text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {statistics.total_revisions}
                            </div>
                            <p className="mt-1 text-xs text-neutral-500">Catatan perubahan & relaksasi HET</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-neutral-400" />
                            <Input
                                placeholder="Cari komoditas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val)}>
                            <SelectTrigger className="w-[180px]">
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

                        {(searchTerm || selectedCategory !== 'all') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('all');
                                }}
                                className="text-neutral-500"
                            >
                                Reset Filter
                            </Button>
                        )}
                    </div>

                    <div className="text-xs text-neutral-500">
                        Menampilkan <span className="font-semibold text-neutral-800 dark:text-neutral-200">{filteredCommodities.length}</span> dari {commodities.length} komoditas
                    </div>
                </div>

                {/* Commodities HET Table */}
                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card shadow-xs dark:border-sidebar-border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-sidebar-border/70 bg-neutral-50/80 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:border-sidebar-border dark:bg-neutral-900/60">
                                <tr>
                                    <th className="px-4 py-3 text-center">No</th>
                                    <th className="px-4 py-3">Komoditas & Kategori</th>
                                    <th className="px-4 py-3">Satuan</th>
                                    <th className="px-4 py-3 text-right">HET Aktif Hari Ini</th>
                                    <th className="px-4 py-3">Berlaku Sejak</th>
                                    <th className="px-4 py-3">Dasar Hukum / Regulasi</th>
                                    <th className="px-4 py-3 text-center">Versi HET</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/50 dark:divide-sidebar-border/60">
                                {filteredCommodities.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-neutral-400">
                                            Tidak ada komoditas yang cocok dengan kriteria pencarian.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCommodities.map((item, idx) => {
                                        const current = item.current_het;

                                        return (
                                            <tr key={item.id} className="transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                                                <td className="px-4 py-3.5 text-center font-mono text-xs text-neutral-400">
                                                    {item.order || idx + 1}
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                        {item.name}
                                                    </div>
                                                    <div className="text-xs text-neutral-500">{item.category}</div>
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    <Badge variant="outline" className="text-xs font-normal">
                                                        {item.unit}
                                                    </Badge>
                                                </td>

                                                <td className="px-4 py-3.5 text-right">
                                                    {current ? (
                                                        <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                            {formatCurrency(current.price)}
                                                        </span>
                                                    ) : (
                                                        <span className="italic text-neutral-400">Belum diatur</span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    {current ? (
                                                        <div className="flex items-center gap-1.5 font-mono text-xs text-neutral-600 dark:text-neutral-300">
                                                            <Calendar className="size-3.5 text-neutral-400" />
                                                            {current.effective_date}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-neutral-400">-</span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    <div className="text-xs text-neutral-700 dark:text-neutral-300">
                                                        {current?.source_regulation || '-'}
                                                    </div>
                                                    {current?.notes && (
                                                        <div className="text-[11px] text-neutral-400">{current.notes}</div>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenHistory(item)}
                                                        className="h-7 gap-1 px-2 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/50"
                                                    >
                                                        <History className="size-3" />
                                                        {item.revisions_count} Versi
                                                    </Button>
                                                </td>

                                                <td className="px-4 py-3.5 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleOpenAdd(item.id)}
                                                            className="h-8 gap-1.5 text-xs"
                                                        >
                                                            <Plus className="size-3 text-blue-600" />
                                                            Revisi HET
                                                        </Button>

                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => handleOpenHistory(item)}
                                                            className="h-8 gap-1 text-xs"
                                                            title="Buka riwayat versi HET"
                                                        >
                                                            <History className="size-3 text-neutral-600 dark:text-neutral-300" />
                                                            Riwayat
                                                        </Button>
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

                {/* Add / Edit HET Modal */}
                <Dialog open={hetModalOpen} onOpenChange={setHetModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Scale className="size-5 text-blue-600" />
                                {editingHetId ? 'Ubah Catatan Regulasi HET' : 'Tambah / Perbarui HET Komoditas'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingHetId
                                    ? 'Perbarui informasi nilai atau dasar hukum HET ini.'
                                    : 'Tambahkan nilai HET baru. Penetapan ini akan otomatis berlaku sejak tanggal efektif yang dipilih.'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitHet} className="space-y-4">
                            {!editingHetId ? (
                                <div className="space-y-1.5">
                                    <Label htmlFor="target-commodity">Pilih Komoditas</Label>
                                    <Select
                                        value={targetCommodityId}
                                        onValueChange={(val) => setTargetCommodityId(val)}
                                    >
                                        <SelectTrigger id="target-commodity">
                                            <SelectValue placeholder="Pilih komoditas..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allCommodities.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.name} ({c.category} - {c.unit})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : null}

                            <div className="space-y-1.5">
                                <Label htmlFor="het-price">Nilai HET (Rp)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-xs font-semibold text-neutral-400">Rp</span>
                                    <Input
                                        id="het-price"
                                        type="number"
                                        min="1"
                                        step="100"
                                        required
                                        placeholder="Contoh: 14900"
                                        value={hetPrice}
                                        onChange={(e) => setHetPrice(e.target.value)}
                                        className="pl-9 font-mono font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="het-effective-date">Tanggal Mulai Berlaku (Effective Date)</Label>
                                <Input
                                    id="het-effective-date"
                                    type="date"
                                    required
                                    value={effectiveDate}
                                    onChange={(e) => setEffectiveDate(e.target.value)}
                                />
                                <p className="text-[11px] text-neutral-500">
                                    Harga pangan yang tercatat pada atau setelah tanggal ini akan mengacu ke HET ini.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="het-regulation">Dasar Hukum / Regulasi Resmi</Label>
                                <Input
                                    id="het-regulation"
                                    placeholder="Contoh: Perbadan No. 05/2024 atau Permendag No. 18/2024"
                                    value={sourceRegulation}
                                    onChange={(e) => setSourceRegulation(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="het-notes">Catatan / Keterangan Wilayah</Label>
                                <Input
                                    id="het-notes"
                                    placeholder="Contoh: Zona 1 Jawa Barat & Banten"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button type="button" variant="outline" onClick={() => setHetModalOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                                    {isSubmitting ? 'Menyimpan...' : editingHetId ? 'Simpan Perubahan' : 'Tetapkan HET'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* History Timeline Modal */}
                <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
                    <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <History className="size-5 text-blue-600" />
                                Riwayat Perubahan HET: {activeCommodityForHistory?.name}
                            </DialogTitle>
                            <DialogDescription>
                                Linimasa seluruh regulasi dan versi HET untuk komoditas ini ({activeCommodityForHistory?.unit}).
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto pr-1">
                            {activeCommodityForHistory?.histories.length === 0 ? (
                                <div className="py-8 text-center text-sm text-neutral-400">
                                    Belum ada catatan riwayat HET untuk komoditas ini.
                                </div>
                            ) : (
                                <div className="space-y-4 py-2">
                                    {activeCommodityForHistory?.histories.map((h, i) => (
                                        <div
                                            key={h.id}
                                            className={`relative rounded-xl border p-4 transition-all ${
                                                h.is_current
                                                    ? 'border-emerald-300 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/20'
                                                    : 'border-sidebar-border bg-card'
                                            }`}
                                        >
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-lg font-bold text-neutral-900 dark:text-neutral-100">
                                                            {formatCurrency(h.price)} / {activeCommodityForHistory.unit}
                                                        </span>
                                                        {h.is_current ? (
                                                            <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
                                                                Aktif Saat Ini
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-neutral-500">
                                                                Riwayat Lama
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                                                        <Calendar className="size-3.5 text-neutral-400" />
                                                        Mulai Berlaku:{' '}
                                                        <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
                                                            {h.effective_date}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (activeCommodityForHistory) {
                                                                handleOpenEdit(h, activeCommodityForHistory.id);
                                                            }
                                                        }}
                                                        className="h-7 px-2 text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
                                                    >
                                                        <Pencil className="size-3 mr-1" />
                                                        Edit
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteHet(h.id)}
                                                        className="size-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                                                        title="Hapus riwayat HET"
                                                    >
                                                        <Trash2 className="size-3" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="mt-3 grid gap-2 border-t border-sidebar-border/60 pt-2.5 text-xs text-neutral-600 dark:text-neutral-300">
                                                {h.source_regulation && (
                                                    <div className="flex items-center gap-1.5">
                                                        <FileText className="size-3.5 text-neutral-400 shrink-0" />
                                                        <span>
                                                            Dasar Regulasi: <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{h.source_regulation}</strong>
                                                        </span>
                                                    </div>
                                                )}
                                                {h.notes && (
                                                    <div className="text-neutral-500 italic">
                                                        Catatan: {h.notes}
                                                    </div>
                                                )}
                                                {h.creator && (
                                                    <div className="text-[11px] text-neutral-400">
                                                        Dibuat oleh: {h.creator} pada {h.created_at}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="border-t pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setHistoryModalOpen(false)}
                            >
                                Tutup
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    setHistoryModalOpen(false);
                                    if (activeCommodityForHistory) {
                                        handleOpenAdd(activeCommodityForHistory.id);
                                    }
                                }}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                <Plus className="size-4 mr-1" />
                                Tambah Revisi HET Baru
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

HetsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Kelola HET Komoditas',
            href: hetsIndex(),
        },
    ] satisfies BreadcrumbItem[],
};
