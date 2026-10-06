import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Edit3,
    Layers,
    MapPin,
    Plus,
    Power,
    Search,
    ShoppingBag,
    Store,
    Trash2,
    TrendingUp,
    XCircle,
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
import { index as consumerPricesIndex } from '@/routes/consumer-prices';
import {
    destroy as destroyMarketAction,
    index as marketsIndex,
    store as storeMarketAction,
    toggle as toggleMarketAction,
    update as updateMarketAction,
} from '@/routes/markets';
import type { BreadcrumbItem } from '@/types';

interface MarketItem {
    id: number;
    name: string;
    location: string | null;
    is_active: boolean;
    order: number;
    consumer_prices_count: number;
    created_at: string | null;
}

interface PageProps {
    markets: MarketItem[];
    filters: {
        search: string;
        status: string;
    };
    statistics: {
        total_markets: number;
        active_count: number;
        inactive_count: number;
        total_recorded_prices: number;
    };
}

export default function MarketsIndex({
    markets,
    filters,
    statistics,
}: PageProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');

    // Create Modal state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createLocation, setCreateLocation] = useState('');
    const [createOrder, setCreateOrder] = useState<string>('');
    const [createIsActive, setCreateIsActive] = useState(true);
    const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

    // Edit Modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingMarket, setEditingMarket] = useState<MarketItem | null>(null);
    const [editName, setEditName] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editOrder, setEditOrder] = useState<string>('');
    const [editIsActive, setEditIsActive] = useState(true);
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

    // Delete Modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [marketToDelete, setMarketToDelete] = useState<MarketItem | null>(null);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

    // Filtered items (client-side dynamic fast filter)
    const displayedMarkets = useMemo(() => {
        return markets.filter((m) => {
            const matchesSearch =
                searchTerm === '' ||
                m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (m.location !== null && m.location.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus =
                selectedStatus === 'all' ||
                (selectedStatus === 'active' && m.is_active) ||
                (selectedStatus === 'inactive' && !m.is_active);

            return matchesSearch && matchesStatus;
        });
    }, [markets, searchTerm, selectedStatus]);

    // Handle Create Market
    const handleCreateMarket = (e: React.FormEvent) => {
        e.preventDefault();
        if (!createName.trim()) {
            toast.error('Nama pasar wajib diisi.');
            return;
        }

        setIsSubmittingCreate(true);
        router.post(
            storeMarketAction.url(),
            {
                name: createName.trim(),
                location: createLocation.trim() || null,
                order: createOrder ? parseInt(createOrder, 10) : null,
                is_active: createIsActive,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Pasar '${createName.trim()}' berhasil ditambahkan.`);
                    setCreateModalOpen(false);
                    setCreateName('');
                    setCreateLocation('');
                    setCreateOrder('');
                    setCreateIsActive(true);
                    setIsSubmittingCreate(false);
                },
                onError: (err) => {
                    const msg = Object.values(err)[0] || 'Gagal menambahkan pasar.';
                    toast.error(msg);
                    setIsSubmittingCreate(false);
                },
            }
        );
    };

    // Open Edit Modal
    const handleOpenEdit = (m: MarketItem) => {
        setEditingMarket(m);
        setEditName(m.name);
        setEditLocation(m.location || '');
        setEditOrder(String(m.order));
        setEditIsActive(m.is_active);
        setEditModalOpen(true);
    };

    // Handle Update Market
    const handleUpdateMarket = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMarket || !editName.trim()) {
            toast.error('Nama pasar wajib diisi.');
            return;
        }

        setIsSubmittingEdit(true);
        router.put(
            updateMarketAction.url(editingMarket.id),
            {
                name: editName.trim(),
                location: editLocation.trim() || null,
                order: editOrder ? parseInt(editOrder, 10) : editingMarket.order,
                is_active: editIsActive,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Data pasar '${editName.trim()}' berhasil diperbarui.`);
                    setEditModalOpen(false);
                    setIsSubmittingEdit(false);
                },
                onError: (err) => {
                    const msg = Object.values(err)[0] || 'Gagal memperbarui pasar.';
                    toast.error(msg);
                    setIsSubmittingEdit(false);
                },
            }
        );
    };

    // Quick toggle active status
    const handleToggleStatus = (m: MarketItem) => {
        router.post(
            toggleMarketAction.url(m.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Status pasar '${m.name}' berhasil diubah.`);
                },
                onError: (err) => {
                    toast.error('Gagal mengubah status: ' + Object.values(err)[0]);
                },
            }
        );
    };

    // Open Delete Modal
    const handleOpenDelete = (m: MarketItem) => {
        setMarketToDelete(m);
        setDeleteModalOpen(true);
    };

    // Confirm Delete Market
    const handleConfirmDelete = () => {
        if (!marketToDelete) return;

        setIsSubmittingDelete(true);
        router.delete(destroyMarketAction.url(marketToDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Pasar '${marketToDelete.name}' berhasil dihapus.`);
                setDeleteModalOpen(false);
                setMarketToDelete(null);
                setIsSubmittingDelete(false);
            },
            onError: (err) => {
                const msg = Object.values(err)[0] || 'Gagal menghapus pasar.';
                toast.error(msg);
                setIsSubmittingDelete(false);
            },
        });
    };

    return (
        <>
            <Head title="Kelola Data Pasar - DKPP Indramayu" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                                <Store className="size-5" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                Modul Kelola Pasar
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Pengelolaan data master pasar pantauan di Kabupaten Indramayu sebagai lokasi pencatatan harga konsumen harian.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            variant="outline"
                            asChild
                            className="gap-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                        >
                            <Link href={consumerPricesIndex.url()}>
                                <TrendingUp className="size-4" />
                                Lihat Harga Konsumen
                            </Link>
                        </Button>

                        <Button
                            onClick={() => {
                                setCreateName('');
                                setCreateLocation('');
                                setCreateOrder(String(markets.length + 1));
                                setCreateIsActive(true);
                                setCreateModalOpen(true);
                            }}
                            className="gap-2 bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                        >
                            <Plus className="size-4" />
                            Tambah Pasar Baru
                        </Button>
                    </div>
                </div>

                {/* KPI Overview Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-neutral-500">Total Pasar</CardTitle>
                            <Store className="size-4 text-neutral-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_markets}</div>
                            <p className="mt-1 text-xs text-neutral-500">
                                Lokasi pasar terdaftar di sistem
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-200 bg-emerald-50/40 dark:border-emerald-950/60 dark:bg-emerald-950/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Pasar Aktif</CardTitle>
                            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                                {statistics.active_count}
                            </div>
                            <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/80">
                                Aktif dalam pencatatan harian
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-neutral-500">Pasar Non-aktif</CardTitle>
                            <XCircle className="size-4 text-neutral-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-700 dark:text-neutral-300">
                                {statistics.inactive_count}
                            </div>
                            <p className="mt-1 text-xs text-neutral-500">
                                Disembunyikan dari pilihan pencatatan
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50/40 dark:border-blue-950/60 dark:bg-blue-950/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-blue-600 dark:text-blue-400">Total Data Harga</CardTitle>
                            <Layers className="size-4 text-blue-600 dark:text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                {statistics.total_recorded_prices.toLocaleString('id-ID')}
                            </div>
                            <p className="mt-1 text-xs text-blue-600/80 dark:text-blue-400/80">
                                Total entri harga konsumen tercatat
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter & Search Bar */}
                <Card className="border-sidebar-border/70 shadow-2xs dark:border-sidebar-border">
                    <CardContent className="p-4 sm:p-5">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:items-end">
                            <div className="sm:col-span-2 lg:col-span-1">
                                <Label htmlFor="search-market" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                    Cari Pasar
                                </Label>
                                <div className="relative mt-1.5">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                                    <Input
                                        id="search-market"
                                        placeholder="Ketik nama pasar atau lokasi..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="filter-status" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                    Status Operasional
                                </Label>
                                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                    <SelectTrigger id="filter-status" className="mt-1.5 w-full">
                                        <SelectValue placeholder="Semua Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Status</SelectItem>
                                        <SelectItem value="active">Hanya Aktif</SelectItem>
                                        <SelectItem value="inactive">Hanya Non-aktif</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedStatus('all');
                                    }}
                                    className="mt-auto w-full"
                                >
                                    Reset Filter
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Markets Data Table */}
                <Card className="border-sidebar-border/70 overflow-hidden shadow-2xs dark:border-sidebar-border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-sidebar-border bg-neutral-50/70 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:bg-neutral-900/50 dark:text-neutral-400">
                                <tr>
                                    <th className="py-3 pl-4 pr-2 w-16 text-center">Urutan</th>
                                    <th className="py-3 px-3">Nama Pasar</th>
                                    <th className="py-3 px-3">Wilayah / Lokasi</th>
                                    <th className="py-3 px-3 text-center">Data Terdata</th>
                                    <th className="py-3 px-3 text-center">Status</th>
                                    <th className="py-3 pl-3 pr-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/50 text-neutral-700 dark:text-neutral-300">
                                {displayedMarkets.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-neutral-400">
                                            <Store className="mx-auto size-9 text-neutral-300 mb-2 dark:text-neutral-600" />
                                            <p className="font-medium text-neutral-600 dark:text-neutral-300">Tidak ada data pasar ditemukan</p>
                                            <p className="text-xs text-neutral-400 mt-0.5">Silakan sesuaikan filter pencarian atau tambahkan pasar baru.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    displayedMarkets.map((m) => (
                                        <tr key={m.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40 transition-colors">
                                            <td className="py-3.5 pl-4 pr-2 text-center font-mono text-xs font-semibold text-neutral-500">
                                                #{m.order}
                                            </td>
                                            <td className="py-3.5 px-3">
                                                <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                                    <Store className="size-4 text-emerald-600 shrink-0" />
                                                    {m.name}
                                                </div>
                                                <div className="text-[11px] text-neutral-400 mt-0.5">
                                                    Terdaftar sejak {m.created_at || '-'}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-3">
                                                {m.location ? (
                                                    <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                                                        <MapPin className="size-3.5 text-rose-500 shrink-0" />
                                                        <span>{m.location}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-neutral-400 italic">Belum diisi</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-3 text-center">
                                                <Badge variant="outline" className="text-xs font-mono font-medium">
                                                    {m.consumer_prices_count} entri
                                                </Badge>
                                            </td>
                                            <td className="py-3.5 px-3 text-center">
                                                {m.is_active ? (
                                                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-medium">
                                                        Aktif
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-neutral-500 font-medium">
                                                        Non-aktif
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-3.5 pl-3 pr-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                        className="h-8 px-2 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                                                        title="Lihat data harga konsumen pasar ini"
                                                    >
                                                        <Link href={consumerPricesIndex.url({ query: { market_id: m.id } })}>
                                                            <ShoppingBag className="size-3.5 mr-1" />
                                                            Harga
                                                        </Link>
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggleStatus(m)}
                                                        className={`h-8 px-2 text-xs ${
                                                            m.is_active
                                                                ? 'text-neutral-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                                                : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                                        }`}
                                                        title={m.is_active ? 'Nonaktifkan pasar' : 'Aktifkan pasar'}
                                                    >
                                                        <Power className="size-3.5" />
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenEdit(m)}
                                                        className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                                                        title="Edit data pasar"
                                                    >
                                                        <Edit3 className="size-3.5" />
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenDelete(m)}
                                                        className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                                        title="Hapus pasar"
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
                </Card>

                {/* Create Market Modal */}
                <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Store className="size-5 text-emerald-600" />
                                Tambah Pasar Baru
                            </DialogTitle>
                            <DialogDescription>
                                Daftarkan pasar pantauan baru untuk pencatatan harga pangan strategis di Kabupaten Indramayu.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateMarket} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="create-name">Nama Pasar <span className="text-red-500">*</span></Label>
                                <Input
                                    id="create-name"
                                    placeholder="Contoh: Pasar Anjatan"
                                    value={createName}
                                    onChange={(e) => setCreateName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create-location">Wilayah / Lokasi (Kecamatan)</Label>
                                <Input
                                    id="create-location"
                                    placeholder="Contoh: Kecamatan Anjatan"
                                    value={createLocation}
                                    onChange={(e) => setCreateLocation(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create-order">Nomor Urutan Tampilan</Label>
                                <Input
                                    id="create-order"
                                    type="number"
                                    min="1"
                                    placeholder="Urutan tampilan di dropdown & tabel"
                                    value={createOrder}
                                    onChange={(e) => setCreateOrder(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center space-x-2 pt-1">
                                <Checkbox
                                    id="create-is-active"
                                    checked={createIsActive}
                                    onCheckedChange={(checked) => setCreateIsActive(Boolean(checked))}
                                />
                                <Label htmlFor="create-is-active" className="text-xs font-normal cursor-pointer">
                                    Pasar aktif (ditampilkan dalam pilihan pencatatan harga harian)
                                </Label>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSubmittingCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {isSubmittingCreate ? 'Menyimpan...' : 'Simpan Pasar'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Market Modal */}
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Edit3 className="size-5 text-blue-600" />
                                Edit Data Pasar
                            </DialogTitle>
                            <DialogDescription>
                                Perbarui informasi nama, lokasi, nomor urutan, atau status keaktifan pasar.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleUpdateMarket} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-name">Nama Pasar <span className="text-red-500">*</span></Label>
                                <Input
                                    id="edit-name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-location">Wilayah / Lokasi (Kecamatan)</Label>
                                <Input
                                    id="edit-location"
                                    value={editLocation}
                                    onChange={(e) => setEditLocation(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-order">Nomor Urutan Tampilan</Label>
                                <Input
                                    id="edit-order"
                                    type="number"
                                    min="1"
                                    value={editOrder}
                                    onChange={(e) => setEditOrder(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center space-x-2 pt-1">
                                <Checkbox
                                    id="edit-is-active"
                                    checked={editIsActive}
                                    onCheckedChange={(checked) => setEditIsActive(Boolean(checked))}
                                />
                                <Label htmlFor="edit-is-active" className="text-xs font-normal cursor-pointer">
                                    Pasar aktif (ditampilkan dalam pilihan pencatatan harga harian)
                                </Label>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSubmittingEdit} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {isSubmittingEdit ? 'Menyimpan...' : 'Perbarui Pasar'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-rose-600">
                                <AlertTriangle className="size-5" />
                                Konfirmasi Hapus Pasar
                            </DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus data pasar{' '}
                                <strong className="text-neutral-900 dark:text-neutral-100">{marketToDelete?.name}</strong>?
                            </DialogDescription>
                        </DialogHeader>

                        {marketToDelete && marketToDelete.consumer_prices_count > 0 ? (
                            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                                <p className="font-semibold mb-1">Peringatan Integritas Data:</p>
                                <p>
                                    Pasar ini telah memiliki <strong>{marketToDelete.consumer_prices_count} entri data harga konsumen</strong>.
                                    Untuk menjaga kelengkapan rekaman historis harga pangan, penghapusan langsung dilarang.
                                    Sebagai alternatif, Anda dapat menonaktifkan pasar ini agar tidak lagi muncul di form pencatatan harian.
                                </p>
                            </div>
                        ) : (
                            <p className="text-xs text-neutral-500">
                                Tindakan ini tidak dapat dibatalkan. Data pasar yang belum memiliki riwayat pencatatan harga akan dihapus secara permanen dari sistem.
                            </p>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" onClick={() => setDeleteModalOpen(false)}>
                                Batal
                            </Button>
                            {marketToDelete && marketToDelete.consumer_prices_count > 0 ? (
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setDeleteModalOpen(false);
                                        handleToggleStatus(marketToDelete);
                                    }}
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                    Nonaktifkan Pasar Saja
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    disabled={isSubmittingDelete}
                                    onClick={handleConfirmDelete}
                                    className="bg-rose-600 hover:bg-rose-700 text-white"
                                >
                                    {isSubmittingDelete ? 'Menghapus...' : 'Ya, Hapus Pasar'}
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

MarketsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Kelola Pasar',
            href: marketsIndex(),
        },
    ] satisfies BreadcrumbItem[],
};

