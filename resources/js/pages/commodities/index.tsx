import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Edit3,
    FileText,
    History,
    Image as ImageIcon,
    Layers,
    Plus,
    Scale,
    Search,
    ShoppingBag,
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
    index as commoditiesIndex,
    store as storeCommodityAction,
    update as updateCommodityAction,
} from '@/routes/commodities';
import { index as consumerPricesIndex } from '@/routes/consumer-prices';
import { index as hetsIndex } from '@/routes/hets';
import type { BreadcrumbItem } from '@/types';

interface CommodityItem {
    id: number;
    name: string;
    slug: string;
    category: string;
    unit: string;
    description: string | null;
    image: string | null;
    image_url: string | null;
    is_active: boolean;
    order: number;
    current_het: {
        id: number;
        price: number;
        effective_date: string;
        source_regulation: string | null;
    } | null;
    hets_count: number;
    consumer_prices_count: number;
}

interface PageProps {
    commodities: CommodityItem[];
    categories: string[];
    filters: {
        search: string;
        category: string;
        status: string;
    };
    statistics: {
        total_commodities: number;
        active_count: number;
        inactive_count: number;
        total_categories: number;
    };
}

export default function CommoditiesIndex({
    commodities,
    categories,
    filters,
    statistics,
}: PageProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');

    // Create Modal state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createCategory, setCreateCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [createUnit, setCreateUnit] = useState('Kg');
    const [createOrder, setCreateOrder] = useState('');
    const [createIsActive, setCreateIsActive] = useState(true);
    const [createDescription, setCreateDescription] = useState('');
    const [createInitialHet, setCreateInitialHet] = useState('');
    const [createInitialRegulation, setCreateInitialRegulation] = useState('');
    const [createImage, setCreateImage] = useState<File | null>(null);
    const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);
    const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

    // Edit Modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CommodityItem | null>(null);
    const [editName, setEditName] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editCustomCategory, setEditCustomCategory] = useState('');
    const [editUnit, setEditUnit] = useState('');
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

    // Filter commodities client-side
    const filteredCommodities = useMemo(() => {
        return commodities.filter((item) => {
            const matchesSearch =
                searchTerm === '' ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.slug.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory =
                selectedCategory === 'all' || item.category === selectedCategory;
            const matchesStatus =
                selectedStatus === 'all' ||
                (selectedStatus === 'active' && item.is_active) ||
                (selectedStatus === 'inactive' && !item.is_active);

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [commodities, searchTerm, selectedCategory, selectedStatus]);

    const formatCurrency = (amount: number | null) => {
        if (amount === null || amount === undefined) return '-';
        return 'Rp ' + Number(amount).toLocaleString('id-ID');
    };

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

    // Open Create Modal
    const handleOpenCreate = () => {
        setCreateName('');
        setCreateCategory(categories[0] || 'Beras');
        setCustomCategory('');
        setCreateUnit('Kg');
        setCreateOrder(String(commodities.length + 1));
        setCreateIsActive(true);
        setCreateDescription('');
        setCreateInitialHet('');
        setCreateInitialRegulation('');
        setCreateImage(null);
        setCreateImagePreview(null);
        setCreateModalOpen(true);
    };

    // Submit Create
    const handleSubmitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const finalCategory = createCategory === 'custom' ? customCategory : createCategory;

        if (!createName || !finalCategory || !createUnit) {
            toast.error('Mohon lengkapi nama komoditas, kategori, dan satuan.');
            return;
        }

        setIsSubmittingCreate(true);
        const formData = new FormData();
        formData.append('name', createName);
        formData.append('category', finalCategory);
        formData.append('unit', createUnit);
        if (createOrder) formData.append('order', createOrder);
        formData.append('is_active', createIsActive ? '1' : '0');
        if (createDescription) formData.append('description', createDescription);
        if (createInitialHet) formData.append('initial_het_price', createInitialHet);
        if (createInitialRegulation) formData.append('initial_het_regulation', createInitialRegulation);
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

    // Open Edit Modal
    const handleOpenEdit = (item: CommodityItem) => {
        setEditingItem(item);
        setEditName(item.name);
        setEditCategory(item.category);
        setEditCustomCategory('');
        setEditUnit(item.unit);
        setEditOrder(String(item.order));
        setEditIsActive(item.is_active);
        setEditDescription(item.description || '');
        setEditImage(null);
        setEditImagePreview(item.image_url || null);
        setEditRemoveImage(false);
        setEditModalOpen(true);
    };

    // Submit Edit
    const handleSubmitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;

        const finalCategory = editCategory === 'custom' ? editCustomCategory : editCategory;

        if (!editName || !finalCategory || !editUnit) {
            toast.error('Mohon lengkapi nama komoditas, kategori, dan satuan.');
            return;
        }

        setIsSubmittingEdit(true);
        const formData = new FormData();
        formData.append('_method', 'put');
        formData.append('name', editName);
        formData.append('category', finalCategory);
        formData.append('unit', editUnit);
        formData.append('order', editOrder ? editOrder : String(editingItem.order));
        formData.append('is_active', editIsActive ? '1' : '0');
        if (editDescription) formData.append('description', editDescription);
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
                    toast.success(`Data komoditas '${editName}' berhasil diperbarui.`);
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

    // Open Delete Modal
    const handleOpenDelete = (item: CommodityItem) => {
        setDeletingItem(item);
        setDeleteModalOpen(true);
    };

    // Submit Delete
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
            <Head title="Kelola Komoditas Pangan - DKPP Indramayu" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-600 text-white shadow-sm">
                                <Wheat className="size-5" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                Kelola Komoditas Pangan
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Manajemen master data komoditas pangan yang dipantau (tambah, ubah, dan hapus komoditas).
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
                                Harga Konsumen
                            </Link>
                        </Button>

                        <Button
                            variant="outline"
                            asChild
                            className="gap-2 border-blue-300 text-blue-800 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950/50"
                        >
                            <Link href={hetsIndex.url()}>
                                <Scale className="size-4" />
                                Kelola HET
                            </Link>
                        </Button>

                        <Button
                            onClick={handleOpenCreate}
                            className="gap-2 bg-amber-600 text-white shadow-sm hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
                        >
                            <Plus className="size-4" />
                            Tambah Komoditas Baru
                        </Button>
                    </div>
                </div>

                {/* Statistics Overview */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-neutral-500">Total Komoditas</CardTitle>
                            <Wheat className="size-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_commodities}</div>
                            <p className="mt-1 text-xs text-neutral-500">Komoditas dalam sistem</p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-neutral-500">Komoditas Aktif</CardTitle>
                            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {statistics.active_count}
                            </div>
                            <p className="mt-1 text-xs text-neutral-500">Tampil di form input harga</p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-neutral-500">Komoditas Nonaktif</CardTitle>
                            <XCircle className="size-4 text-neutral-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-600 dark:text-neutral-400">
                                {statistics.inactive_count}
                            </div>
                            <p className="mt-1 text-xs text-neutral-500">Diarsipkan / tidak dipantau</p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-neutral-500">Kategori Terdaftar</CardTitle>
                            <Layers className="size-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {statistics.total_categories}
                            </div>
                            <p className="mt-1 text-xs text-neutral-500">Kelompok komoditas pangan</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-neutral-400" />
                            <Input
                                placeholder="Cari nama komoditas / slug..."
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

                        <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val)}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="active">🟢 Aktif</SelectItem>
                                <SelectItem value="inactive">⚪ Nonaktif</SelectItem>
                            </SelectContent>
                        </Select>

                        {(searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('all');
                                    setSelectedStatus('all');
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

                {/* Commodities Table */}
                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card shadow-xs dark:border-sidebar-border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-sidebar-border/70 bg-neutral-50/80 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:border-sidebar-border dark:bg-neutral-900/60">
                                <tr>
                                    <th className="w-12 px-4 py-3 text-center">Urutan</th>
                                    <th className="w-16 px-3 py-3 text-center">Foto</th>
                                    <th className="px-4 py-3">Nama Komoditas</th>
                                    <th className="px-4 py-3">Kategori</th>
                                    <th className="px-4 py-3">Satuan</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">HET Aktif</th>
                                    <th className="px-4 py-3 text-center">Riwayat HET</th>
                                    <th className="px-4 py-3 text-center">Data Harga</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/50 dark:divide-sidebar-border/60">
                                {filteredCommodities.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-neutral-400">
                                            Tidak ada komoditas yang cocok dengan kriteria filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCommodities.map((item) => (
                                        <tr key={item.id} className="transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                                            <td className="px-4 py-3.5 text-center font-mono text-xs text-neutral-400">
                                                {item.order}
                                            </td>

                                            <td className="px-3 py-3.5 text-center">
                                                {item.image_url ? (
                                                    <div className="relative mx-auto size-11 overflow-hidden rounded-lg border border-sidebar-border bg-neutral-100 shadow-2xs hover:scale-105 transition-transform">
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.name}
                                                            className="h-full w-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="mx-auto flex size-11 items-center justify-center rounded-lg border border-dashed border-sidebar-border bg-neutral-50/60 text-neutral-400 dark:bg-neutral-900/40"
                                                        title="Belum ada foto komoditas"
                                                    >
                                                        <ImageIcon className="size-4 opacity-40" />
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {item.name}
                                                </div>
                                                <div className="font-mono text-xs text-neutral-400">
                                                    {item.slug}
                                                </div>
                                                {item.description && (
                                                    <div className="mt-0.5 text-xs text-neutral-500">
                                                        {item.description}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <Badge variant="outline" className="text-xs font-medium">
                                                    {item.category}
                                                </Badge>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <span className="font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                                    {item.unit}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5 text-center">
                                                {item.is_active ? (
                                                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
                                                        Aktif
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-neutral-400">
                                                        Nonaktif
                                                    </Badge>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5 text-right font-mono font-medium">
                                                {item.current_het ? (
                                                    <div>
                                                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                                                            {formatCurrency(item.current_het.price)}
                                                        </span>
                                                        <div className="text-[11px] text-neutral-400">
                                                            {item.current_het.source_regulation || item.current_het.effective_date}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="italic text-neutral-400">-</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5 text-center">
                                                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                                    {item.hets_count} versi
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5 text-center">
                                                <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                                    {item.consumer_prices_count} catatan
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenEdit(item)}
                                                        className="h-8 gap-1 px-2.5 text-xs"
                                                    >
                                                        <Edit3 className="size-3.5 text-neutral-600 dark:text-neutral-300" />
                                                        Edit
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenDelete(item)}
                                                        className="size-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                                                        title="Hapus Komoditas"
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
                </div>

                {/* Create Commodity Modal */}
                <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Wheat className="size-5 text-amber-600" />
                                Tambah Komoditas Baru
                            </DialogTitle>
                            <DialogDescription>
                                Daftarkan komoditas pangan baru ke dalam pemantauan dinas.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitCreate} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="create-name">Nama Komoditas <span className="text-red-500">*</span></Label>
                                <Input
                                    id="create-name"
                                    required
                                    placeholder="Contoh: Beras Rojo Lele / Jagung Manis"
                                    value={createName}
                                    onChange={(e) => setCreateName(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="create-category">Kategori <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={createCategory}
                                        onValueChange={(val) => setCreateCategory(val)}
                                    >
                                        <SelectTrigger id="create-category">
                                            <SelectValue placeholder="Pilih Kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c} value={c}>
                                                    {c}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="custom">+ Kategori Baru...</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="create-unit">Satuan Ukuran <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="create-unit"
                                        required
                                        placeholder="Contoh: Kg, Liter, Ikat"
                                        value={createUnit}
                                        onChange={(e) => setCreateUnit(e.target.value)}
                                    />
                                </div>
                            </div>

                            {createCategory === 'custom' && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="create-custom-category">Nama Kategori Baru</Label>
                                    <Input
                                        id="create-custom-category"
                                        required
                                        placeholder="Contoh: Sayuran Segar"
                                        value={customCategory}
                                        onChange={(e) => setCustomCategory(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="create-order">Nomor Urutan Tampilan</Label>
                                    <Input
                                        id="create-order"
                                        type="number"
                                        min="0"
                                        placeholder="1"
                                        value={createOrder}
                                        onChange={(e) => setCreateOrder(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="create-status">Status Pemantauan</Label>
                                    <Select
                                        value={createIsActive ? '1' : '0'}
                                        onValueChange={(val) => setCreateIsActive(val === '1')}
                                    >
                                        <SelectTrigger id="create-status">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">🟢 Aktif (Dipantau)</SelectItem>
                                            <SelectItem value="0">⚪ Nonaktif (Diarsipkan)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create-desc">Keterangan / Spesifikasi (Opsional)</Label>
                                <Input
                                    id="create-desc"
                                    placeholder="Contoh: Kualitas medium derajat sosoh 95%"
                                    value={createDescription}
                                    onChange={(e) => setCreateDescription(e.target.value)}
                                />
                            </div>

                            {/* Foto / Gambar Komoditas */}
                            <div className="space-y-1.5">
                                <Label>Foto / Gambar Komoditas (Opsional)</Label>
                                {createImagePreview ? (
                                    <div className="relative flex items-center gap-3 rounded-lg border border-sidebar-border bg-neutral-50/60 p-2.5 dark:bg-neutral-900/40">
                                        <img
                                            src={createImagePreview}
                                            alt="Preview"
                                            className="size-16 rounded-md object-cover border border-sidebar-border shadow-2xs"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                                {createImage?.name || 'Gambar terpilih'}
                                            </p>
                                            <p className="text-[11px] text-neutral-500">
                                                {createImage ? `${(createImage.size / 1024).toFixed(0)} KB` : 'Siap diunggah'}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleRemoveCreateImage}
                                            className="h-8 px-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                                        >
                                            <X className="size-4" />
                                            Hapus
                                        </Button>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="create-image-upload"
                                        className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-sidebar-border p-4 text-center cursor-pointer transition-colors hover:border-amber-500 hover:bg-amber-50/20 dark:hover:bg-amber-950/20"
                                    >
                                        <div className="flex size-9 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                                            <Upload className="size-4" />
                                        </div>
                                        <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                            <span className="text-amber-600 font-semibold">Klik untuk upload foto</span> atau seret file ke sini
                                        </div>
                                        <p className="text-[11px] text-neutral-400">
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

                            {/* Optional Initial HET */}
                            <div className="rounded-lg border border-sidebar-border bg-neutral-50/70 p-3 space-y-3 dark:bg-neutral-900/50">
                                <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                    <Scale className="size-3.5 text-blue-500" />
                                    Penetapan HET Awal (Opsional)
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="create-het" className="text-xs">Nilai HET Awal (Rp)</Label>
                                        <Input
                                            id="create-het"
                                            type="number"
                                            min="0"
                                            step="100"
                                            placeholder="Contoh: 15000"
                                            value={createInitialHet}
                                            onChange={(e) => setCreateInitialHet(e.target.value)}
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="create-het-reg" className="text-xs">Dasar Regulasi</Label>
                                        <Input
                                            id="create-het-reg"
                                            placeholder="Contoh: Perbadan No. 05/2024"
                                            value={createInitialRegulation}
                                            onChange={(e) => setCreateInitialRegulation(e.target.value)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSubmittingCreate} className="bg-amber-600 hover:bg-amber-700">
                                    {isSubmittingCreate ? 'Menyimpan...' : 'Simpan Komoditas'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Commodity Modal */}
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Edit3 className="size-5 text-amber-600" />
                                Edit Data Komoditas
                            </DialogTitle>
                            <DialogDescription>
                                Perbarui informasi master data untuk komoditas{' '}
                                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{editingItem?.name}</span>.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitEdit} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-name">Nama Komoditas <span className="text-red-500">*</span></Label>
                                <Input
                                    id="edit-name"
                                    required
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-category">Kategori <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={editCategory}
                                        onValueChange={(val) => setEditCategory(val)}
                                    >
                                        <SelectTrigger id="edit-category">
                                            <SelectValue placeholder="Pilih Kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c} value={c}>
                                                    {c}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="custom">+ Kategori Baru...</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-unit">Satuan Ukuran <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="edit-unit"
                                        required
                                        value={editUnit}
                                        onChange={(e) => setEditUnit(e.target.value)}
                                    />
                                </div>
                            </div>

                            {editCategory === 'custom' && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-custom-category">Nama Kategori Baru</Label>
                                    <Input
                                        id="edit-custom-category"
                                        required
                                        placeholder="Contoh: Sayuran Segar"
                                        value={editCustomCategory}
                                        onChange={(e) => setEditCustomCategory(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-order">Nomor Urutan Tampilan</Label>
                                    <Input
                                        id="edit-order"
                                        type="number"
                                        min="0"
                                        value={editOrder}
                                        onChange={(e) => setEditOrder(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-status">Status Pemantauan</Label>
                                    <Select
                                        value={editIsActive ? '1' : '0'}
                                        onValueChange={(val) => setEditIsActive(val === '1')}
                                    >
                                        <SelectTrigger id="edit-status">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">🟢 Aktif (Dipantau)</SelectItem>
                                            <SelectItem value="0">⚪ Nonaktif (Diarsipkan)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-desc">Keterangan / Spesifikasi</Label>
                                <Input
                                    id="edit-desc"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                />
                            </div>

                            {/* Foto / Gambar Komoditas */}
                            <div className="space-y-1.5">
                                <Label>Foto / Gambar Komoditas</Label>
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
                                    <div className="relative flex items-center gap-3 rounded-lg border border-sidebar-border bg-neutral-50/60 p-2.5 dark:bg-neutral-900/40">
                                        <img
                                            src={editImagePreview}
                                            alt="Preview"
                                            className="size-16 rounded-md object-cover border border-sidebar-border shadow-2xs"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                                {editImage ? editImage.name : 'Foto komoditas saat ini'}
                                            </p>
                                            <p className="text-[11px] text-neutral-500">
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
                                        className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-sidebar-border p-4 text-center cursor-pointer transition-colors hover:border-amber-500 hover:bg-amber-50/20 dark:hover:bg-amber-950/20"
                                    >
                                        <div className="flex size-9 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                                            <Upload className="size-4" />
                                        </div>
                                        <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                            <span className="text-amber-600 font-semibold">Klik untuk upload foto</span> atau seret file ke sini
                                        </div>
                                        <p className="text-[11px] text-neutral-400">
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

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSubmittingEdit} className="bg-amber-600 hover:bg-amber-700">
                                    {isSubmittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="size-5" />
                                Hapus Komoditas
                            </DialogTitle>
                            <DialogDescription>
                                Konfirmasi penghapusan komoditas pangan dari basis data.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2 text-sm">
                            <p>
                                Anda akan menghapus komoditas{' '}
                                <strong className="text-neutral-900 dark:text-neutral-100">{deletingItem?.name}</strong>{' '}
                                ({deletingItem?.category}).
                            </p>

                            {(deletingItem?.consumer_prices_count || 0) > 0 && (
                                <div className="rounded-lg border border-red-200 bg-red-50/80 p-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                                    <span className="font-semibold">Peringatan:</span> Komoditas ini memiliki{' '}
                                    <strong>{deletingItem?.consumer_prices_count} catatan harga konsumen</strong> dan{' '}
                                    <strong>{deletingItem?.hets_count} catatan HET</strong>. Menghapus komoditas ini akan turut menghapus seluruh riwayat data terkait.
                                </div>
                            )}

                            <p className="text-xs text-neutral-500">
                                Tindakan ini tidak dapat dibatalkan. Pastikan data komoditas ini benar-benar tidak lagi diperlukan.
                            </p>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
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
                                {isSubmittingDelete ? 'Menghapus...' : 'Ya, Hapus Komoditas'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

CommoditiesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Kelola Komoditas',
            href: commoditiesIndex(),
        },
    ] satisfies BreadcrumbItem[],
};
