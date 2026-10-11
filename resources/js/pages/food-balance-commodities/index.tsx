import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Edit3,
    Image as ImageIcon,
    Layers,
    Plus,
    Search,
    Trash2,
    Upload,
    Wheat,
    X,
    XCircle,
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
import {
    destroy as destroyCommodityAction,
    index as foodBalanceCommoditiesIndex,
    store as storeCommodityAction,
    toggle as toggleCommodityAction,
    update as updateCommodityAction,
} from '@/routes/food-balance-commodities';
import { index as foodBalancesIndex } from '@/routes/food-balances';
import type { BreadcrumbItem } from '@/types';

interface CommodityItem {
    id: number;
    name: string;
    slug: string;
    unit: string;
    order: number;
    is_active: boolean;
    description: string | null;
    image?: string | null;
    image_url?: string | null;
    balances_count: number;
}

interface PageProps {
    commodities: CommodityItem[];
    filters: {
        search: string;
        status: string;
    };
    statistics: {
        total_commodities: number;
        active_count: number;
        inactive_count: number;
    };
}

export default function FoodBalanceCommoditiesIndex({
    commodities,
    filters,
    statistics,
}: PageProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');

    // Create Modal state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createUnit, setCreateUnit] = useState('Ton');
    const [createOrder, setCreateOrder] = useState('');
    const [createDescription, setCreateDescription] = useState('');
    const [createImage, setCreateImage] = useState<File | null>(null);
    const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);
    const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

    // Edit Modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CommodityItem | null>(null);
    const [editName, setEditName] = useState('');
    const [editUnit, setEditUnit] = useState('Ton');
    const [editOrder, setEditOrder] = useState('');
    const [editIsActive, setEditIsActive] = useState(true);
    const [editDescription, setEditDescription] = useState('');
    const [editImage, setEditImage] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
    const [editRemoveImage, setEditRemoveImage] = useState(false);
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

    // Delete Modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<CommodityItem | null>(null);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

    const filteredCommodities = useMemo(() => {
        return commodities.filter((item) => {
            const matchesSearch =
                searchTerm === '' ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.unit.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus =
                selectedStatus === 'all' ||
                (selectedStatus === 'active' && item.is_active) ||
                (selectedStatus === 'inactive' && !item.is_active);

            return matchesSearch && matchesStatus;
        });
    }, [commodities, searchTerm, selectedStatus]);

    // Handle Image Selection for Create
    const handleCreateImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 3 * 1024 * 1024) {
            toast.error('Ukuran gambar maksimal 3MB.');
            return;
        }
        setCreateImage(file);
        setCreateImagePreview(URL.createObjectURL(file));
    };

    const handleRemoveCreateImage = () => {
        setCreateImage(null);
        setCreateImagePreview(null);
    };

    // Handle Image Selection for Edit
    const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 3 * 1024 * 1024) {
            toast.error('Ukuran gambar maksimal 3MB.');
            return;
        }
        setEditImage(file);
        setEditImagePreview(URL.createObjectURL(file));
        setEditRemoveImage(false);
    };

    const handleRemoveEditImage = () => {
        setEditImage(null);
        setEditImagePreview(null);
        setEditRemoveImage(true);
    };

    const handleCancelRemoveEditImage = () => {
        setEditRemoveImage(false);
        setEditImagePreview(editingItem?.image_url || null);
    };

    // Handle Create
    const handleOpenCreate = () => {
        setCreateName('');
        setCreateUnit('Ton');
        setCreateOrder(String(commodities.length + 1));
        setCreateDescription('');
        setCreateImage(null);
        setCreateImagePreview(null);
        setCreateModalOpen(true);
    };

    const handleSubmitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!createName.trim()) {
            toast.error('Nama komoditas wajib diisi.');
            return;
        }

        setIsSubmittingCreate(true);
        const formData = new FormData();
        formData.append('name', createName.trim());
        formData.append('unit', createUnit.trim() || 'Ton');
        if (createOrder) formData.append('order', createOrder);
        if (createDescription.trim()) formData.append('description', createDescription.trim());
        formData.append('is_active', '1');
        if (createImage) formData.append('image', createImage);

        router.post(
            storeCommodityAction.url(),
            formData,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Komoditas '${createName}' berhasil ditambahkan.`);
                    setCreateModalOpen(false);
                    setIsSubmittingCreate(false);
                },
                onError: (err) => {
                    toast.error('Gagal menambahkan komoditas: ' + Object.values(err)[0]);
                    setIsSubmittingCreate(false);
                },
            }
        );
    };

    // Handle Edit
    const handleOpenEdit = (item: CommodityItem) => {
        setEditingItem(item);
        setEditName(item.name);
        setEditUnit(item.unit);
        setEditOrder(String(item.order));
        setEditIsActive(item.is_active);
        setEditDescription(item.description || '');
        setEditImage(null);
        setEditImagePreview(item.image_url || null);
        setEditRemoveImage(false);
        setEditModalOpen(true);
    };

    const handleSubmitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || !editName.trim()) {
            toast.error('Nama komoditas wajib diisi.');
            return;
        }

        setIsSubmittingEdit(true);
        const formData = new FormData();
        formData.append('_method', 'put');
        formData.append('name', editName.trim());
        formData.append('unit', editUnit.trim() || 'Ton');
        formData.append('order', editOrder ? editOrder : String(editingItem.order));
        formData.append('is_active', editIsActive ? '1' : '0');
        if (editDescription.trim()) formData.append('description', editDescription.trim());
        if (editImage) {
            formData.append('image', editImage);
        } else if (editRemoveImage) {
            formData.append('remove_image', '1');
        }

        router.post(
            updateCommodityAction.url(editingItem.id),
            formData,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Komoditas '${editName}' berhasil diperbarui.`);
                    setEditModalOpen(false);
                    setIsSubmittingEdit(false);
                },
                onError: (err) => {
                    toast.error('Gagal memperbarui komoditas: ' + Object.values(err)[0]);
                    setIsSubmittingEdit(false);
                },
            }
        );
    };

    // Toggle Status
    const handleToggleStatus = (item: CommodityItem) => {
        router.post(
            toggleCommodityAction.url(item.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Status komoditas '${item.name}' berhasil diubah.`);
                },
                onError: (err) => {
                    toast.error('Gagal mengubah status: ' + Object.values(err)[0]);
                },
            }
        );
    };

    // Handle Delete
    const handleOpenDelete = (item: CommodityItem) => {
        setDeletingItem(item);
        setDeleteModalOpen(true);
    };

    const handleSubmitDelete = () => {
        if (!deletingItem) return;

        setIsSubmittingDelete(true);
        router.delete(destroyCommodityAction.url(deletingItem.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Komoditas '${deletingItem.name}' berhasil dihapus.`);
                setDeleteModalOpen(false);
                setIsSubmittingDelete(false);
            },
            onError: (err) => {
                toast.error('Gagal menghapus komoditas: ' + Object.values(err)[0]);
                setIsSubmittingDelete(false);
            },
        });
    };

    return (
        <>
            <Head title="Kelola Komoditas Neraca Pangan - DKPP Indramayu" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                                <Wheat className="size-5" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                Komoditas Neraca Pangan
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Kelola daftar komoditas pangan yang dipantau dalam Neraca Pangan Bulanan (tambah, ubah, hapus).
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            variant="outline"
                            asChild
                            className="gap-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300"
                        >
                            <Link href={foodBalancesIndex.url()}>
                                <Layers className="size-4" />
                                Neraca Pangan Bulanan
                            </Link>
                        </Button>

                        <Button
                            onClick={handleOpenCreate}
                            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-sm"
                        >
                            <Plus className="size-4" />
                            Tambah Komoditas
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Total Komoditas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                                {statistics.total_commodities}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Komoditas terdaftar dalam sistem
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                Komoditas Aktif
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                {statistics.active_count}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Tampil dalam form input &amp; neraca bulanan
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400 dark:text-slate-500">
                                Komoditas Non-Aktif
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-500 dark:text-slate-400">
                                {statistics.inactive_count}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Disembunyikan dari penginputan
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Cari nama komoditas atau satuan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9 border-slate-200 dark:border-slate-700"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="w-36 h-9 border-slate-200 dark:border-slate-700">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="active">Aktif</SelectItem>
                                <SelectItem value="inactive">Non-Aktif</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Main Table */}
                <Card className="border-slate-200/80 shadow-sm overflow-hidden dark:border-slate-800">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-50 border-b border-slate-200/80 text-xs uppercase text-slate-500 font-semibold dark:bg-slate-800/50 dark:border-slate-700">
                                <tr>
                                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                                    <th className="py-3.5 px-3 w-16 text-center">Foto</th>
                                    <th className="py-3.5 px-4">Nama Komoditas</th>
                                    <th className="py-3.5 px-4 w-28 text-center">Satuan</th>
                                    <th className="py-3.5 px-4 w-24 text-center">Urutan</th>
                                    <th className="py-3.5 px-4 w-28 text-center">Status</th>
                                    <th className="py-3.5 px-4 w-32 text-center">Data Terinput</th>
                                    <th className="py-3.5 px-4">Deskripsi / Keterangan</th>
                                    <th className="py-3.5 px-4 w-32 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredCommodities.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-8 text-center text-slate-400">
                                            Tidak ada komoditas ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCommodities.map((item, idx) => (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            <td className="py-3 px-4 text-center text-slate-400 font-medium text-xs">
                                                {idx + 1}
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                {item.image_url ? (
                                                    <div className="relative mx-auto size-11 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-2xs hover:scale-105 transition-transform dark:border-slate-700 dark:bg-slate-800">
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.name}
                                                            className="h-full w-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="mx-auto flex size-11 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 text-slate-400 dark:border-slate-800 dark:bg-slate-900/40"
                                                        title="Belum ada foto komoditas"
                                                    >
                                                        <ImageIcon className="size-4 opacity-40" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">
                                                {item.name}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                >
                                                    {item.unit}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-center text-slate-500 text-xs">
                                                #{item.order}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    onClick={() => handleToggleStatus(item)}
                                                    className="inline-flex cursor-pointer focus:outline-none"
                                                    title="Klik untuk mengubah status"
                                                >
                                                    {item.is_active ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200">
                                                            <CheckCircle2 className="size-3" />
                                                            Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200">
                                                            <XCircle className="size-3" />
                                                            Non-Aktif
                                                        </span>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 text-center text-xs text-slate-500">
                                                {item.balances_count} bulan
                                            </td>
                                            <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                                                {item.description || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenEdit(item)}
                                                        className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800"
                                                        title="Ubah Komoditas"
                                                    >
                                                        <Edit3 className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenDelete(item)}
                                                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800"
                                                        title="Hapus Komoditas"
                                                    >
                                                        <Trash2 className="size-4" />
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

                {/* Create Modal */}
                <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Tambah Komoditas Neraca</DialogTitle>
                            <DialogDescription>
                                Tambahkan komoditas baru ke dalam daftar Neraca Pangan Bulanan.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitCreate} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="create-name">Nama Komoditas *</Label>
                                <Input
                                    id="create-name"
                                    placeholder="Contoh: Beras, Gula Pasir"
                                    value={createName}
                                    onChange={(e) => setCreateName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="create-unit">Satuan *</Label>
                                    <Input
                                        id="create-unit"
                                        placeholder="Ton, Kg, Liter"
                                        value={createUnit}
                                        onChange={(e) => setCreateUnit(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="create-order">Nomor Urut</Label>
                                    <Input
                                        id="create-order"
                                        type="number"
                                        min="0"
                                        placeholder="1, 2, 3..."
                                        value={createOrder}
                                        onChange={(e) => setCreateOrder(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create-desc">Keterangan / Deskripsi</Label>
                                <Input
                                    id="create-desc"
                                    placeholder="Catatan tambahan (opsional)"
                                    value={createDescription}
                                    onChange={(e) => setCreateDescription(e.target.value)}
                                />
                            </div>

                            {/* Foto Komoditas */}
                            <div className="space-y-1.5">
                                <Label>Foto Komoditas (Opsional)</Label>
                                {createImagePreview ? (
                                    <div className="relative flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-900/50">
                                        <img
                                            src={createImagePreview}
                                            alt="Preview"
                                            className="size-16 rounded-md object-cover border border-slate-200 shadow-2xs dark:border-slate-700"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                {createImage?.name || 'Gambar terpilih'}
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                {createImage ? `${(createImage.size / 1024).toFixed(0)} KB` : 'Siap diunggah'}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleRemoveCreateImage}
                                            className="h-8 px-2 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                                        >
                                            <X className="size-4 mr-1" />
                                            Hapus
                                        </Button>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="create-image-upload"
                                        className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-200 p-4 text-center cursor-pointer transition-colors hover:border-emerald-500 hover:bg-emerald-50/20 dark:border-slate-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/20"
                                    >
                                        <div className="flex size-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                                            <Upload className="size-4" />
                                        </div>
                                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                            <span className="text-emerald-600 font-semibold dark:text-emerald-400">Klik untuk upload foto</span> atau seret file ke sini
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                            PNG, JPG, JPEG, WEBP, SVG (Maks. 3MB)
                                        </p>
                                        <input
                                            id="create-image-upload"
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={handleCreateImageChange}
                                        />
                                    </label>
                                )}
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCreateModalOpen(false)}
                                    disabled={isSubmittingCreate}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={isSubmittingCreate}
                                >
                                    {isSubmittingCreate ? 'Menyimpan...' : 'Simpan Komoditas'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Ubah Komoditas Neraca</DialogTitle>
                            <DialogDescription>
                                Perbarui data komoditas '{editingItem?.name}'.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitEdit} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-name">Nama Komoditas *</Label>
                                <Input
                                    id="edit-name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-unit">Satuan *</Label>
                                    <Input
                                        id="edit-unit"
                                        value={editUnit}
                                        onChange={(e) => setEditUnit(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-order">Nomor Urut</Label>
                                    <Input
                                        id="edit-order"
                                        type="number"
                                        min="0"
                                        value={editOrder}
                                        onChange={(e) => setEditOrder(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-status">Status Komoditas</Label>
                                <Select
                                    value={editIsActive ? 'active' : 'inactive'}
                                    onValueChange={(val) => setEditIsActive(val === 'active')}
                                >
                                    <SelectTrigger id="edit-status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Aktif (Tampil di Neraca)</SelectItem>
                                        <SelectItem value="inactive">Non-Aktif (Disembunyikan)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-desc">Keterangan / Deskripsi</Label>
                                <Input
                                    id="edit-desc"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                />
                            </div>

                            {/* Foto / Gambar Komoditas */}
                            <div className="space-y-1.5">
                                <Label>Foto Komoditas</Label>
                                {editRemoveImage ? (
                                    <div className="flex items-center justify-between rounded-lg border border-dashed border-red-200 bg-red-50/50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                                        <span>Foto komoditas akan dihapus saat disimpan.</span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancelRemoveEditImage}
                                            className="h-7 text-xs"
                                        >
                                            Batalkan
                                        </Button>
                                    </div>
                                ) : editImagePreview ? (
                                    <div className="relative flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-900/50">
                                        <img
                                            src={editImagePreview}
                                            alt="Preview"
                                            className="size-16 rounded-md object-cover border border-slate-200 shadow-2xs dark:border-slate-700"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                {editImage ? editImage.name : 'Foto komoditas saat ini'}
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                {editImage
                                                    ? `${(editImage.size / 1024).toFixed(0)} KB (Baru)`
                                                    : 'Tersimpan di sistem'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <label
                                                htmlFor="edit-image-replace"
                                                className="cursor-pointer inline-flex items-center justify-center rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium shadow-2xs hover:bg-accent hover:text-accent-foreground"
                                            >
                                                Ganti
                                                <input
                                                    id="edit-image-replace"
                                                    type="file"
                                                    accept="image/*"
                                                    className="sr-only"
                                                    onChange={handleEditImageChange}
                                                />
                                            </label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleRemoveEditImage}
                                                className="h-7 px-2 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                                                title="Hapus Foto"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="edit-image-upload"
                                        className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-200 p-4 text-center cursor-pointer transition-colors hover:border-emerald-500 hover:bg-emerald-50/20 dark:border-slate-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/20"
                                    >
                                        <div className="flex size-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                                            <Upload className="size-4" />
                                        </div>
                                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                            <span className="text-emerald-600 font-semibold dark:text-emerald-400">Klik untuk upload foto</span> atau seret file ke sini
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                            PNG, JPG, JPEG, WEBP, SVG (Maks. 3MB)
                                        </p>
                                        <input
                                            id="edit-image-upload"
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={handleEditImageChange}
                                        />
                                    </label>
                                )}
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditModalOpen(false)}
                                    disabled={isSubmittingEdit}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={isSubmittingEdit}
                                >
                                    {isSubmittingEdit ? 'Menyimpan...' : 'Perbarui Komoditas'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-red-600">Hapus Komoditas</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus komoditas{' '}
                                <strong className="text-slate-900 dark:text-slate-100">
                                    {deletingItem?.name}
                                </strong>
                                ?
                            </DialogDescription>
                        </DialogHeader>

                        {deletingItem && deletingItem.balances_count > 0 && (
                            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">
                                <strong>Peringatan:</strong> Komoditas ini memiliki{' '}
                                <strong>{deletingItem.balances_count} data neraca</strong> tercatat. Menghapus komoditas ini akan menghapus riwayat data neraca terkait.
                            </div>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDeleteModalOpen(false)}
                                disabled={isSubmittingDelete}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleSubmitDelete}
                                disabled={isSubmittingDelete}
                            >
                                {isSubmittingDelete ? 'Menghapus...' : 'Ya, Hapus'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

FoodBalanceCommoditiesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Komoditas Neraca',
            href: foodBalanceCommoditiesIndex(),
        },
    ] satisfies BreadcrumbItem[],
};

