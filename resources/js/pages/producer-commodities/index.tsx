import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Edit3,
    Image as ImageIcon,
    Plus,
    Scale,
    Search,
    Trash2,
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
    destroy as destroyProducerCommodityAction,
    index as producerCommoditiesIndex,
    store as storeProducerCommodityAction,
    update as updateProducerCommodityAction,
} from '@/routes/producer-commodities';
import { index as producerHapsIndex } from '@/routes/producer-haps';
import { index as producerPricesIndex } from '@/routes/producer-prices';
import type { BreadcrumbItem } from '@/types';

export interface ProducerCommodityItem {
    id: number;
    name: string;
    slug: string;
    key: string;
    category: string;
    unit: string;
    description: string | null;
    image: string | null;
    image_url: string | null;
    is_active: boolean;
    order: number;
    current_hap: {
        id: number;
        price: number;
        effective_date: string;
        source_regulation: string | null;
    } | null;
    haps_count: number;
}

export interface PageProps {
    commodities: ProducerCommodityItem[];
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

export default function ProducerCommoditiesIndex({
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
    const [createKey, setCreateKey] = useState('');
    const [createCategory, setCreateCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [createUnit, setCreateUnit] = useState('Kg');
    const [createOrder, setCreateOrder] = useState('');
    const [createIsActive, setCreateIsActive] = useState(true);
    const [createDescription, setCreateDescription] = useState('');
    const [createInitialHap, setCreateInitialHap] = useState('');
    const [createInitialRegulation, setCreateInitialRegulation] = useState('');
    const [createImage, setCreateImage] = useState<File | null>(null);
    const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);
    const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

    // Edit Modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ProducerCommodityItem | null>(null);
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
    const [deletingItem, setDeletingItem] = useState<ProducerCommodityItem | null>(null);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

    // Filter commodities client-side
    const filteredCommodities = useMemo(() => {
        return commodities.filter((item) => {
            const matchesSearch =
                searchTerm === '' ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

    // Format currency
    const formatCurrency = (amount: number | null | undefined) => {
        if (!amount) return '-';
        return 'Rp ' + Number(amount).toLocaleString('id-ID');
    };

    // Open Create Modal
    const handleOpenCreate = () => {
        setCreateName('');
        setCreateKey('');
        setCreateCategory(categories[0] || 'Gabah');
        setCustomCategory('');
        setCreateUnit('Kg');
        setCreateOrder(String(commodities.length + 1));
        setCreateIsActive(true);
        setCreateDescription('');
        setCreateInitialHap('');
        setCreateInitialRegulation('Perbadan No. 6/2023');
        setCreateImage(null);
        setCreateImagePreview(null);
        setCreateModalOpen(true);
    };

    // Submit Create
    const handleSubmitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const finalCategory = createCategory === 'custom' ? customCategory.trim() : createCategory;

        if (!createName.trim()) {
            toast.error('Nama komoditas wajib diisi.');
            return;
        }
        if (!finalCategory) {
            toast.error('Kategori komoditas wajib diisi.');
            return;
        }

        setIsSubmittingCreate(true);
        const formData = new FormData();
        formData.append('name', createName);
        if (createKey) formData.append('key', createKey);
        formData.append('category', finalCategory);
        formData.append('unit', createUnit);
        if (createOrder) formData.append('order', createOrder);
        formData.append('is_active', createIsActive ? '1' : '0');
        if (createDescription) formData.append('description', createDescription);
        if (createInitialHap) formData.append('initial_hap_price', createInitialHap);
        if (createInitialRegulation) formData.append('initial_hap_regulation', createInitialRegulation);
        if (createImage) formData.append('image', createImage);

        router.post(storeProducerCommodityAction.url(), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Komoditas produsen "${createName}" berhasil ditambahkan.`);
                setCreateModalOpen(false);
                setIsSubmittingCreate(false);
            },
            onError: (err) => {
                toast.error('Gagal menambahkan komoditas: ' + Object.values(err)[0]);
                setIsSubmittingCreate(false);
            },
        });
    };

    // Open Edit Modal
    const handleOpenEdit = (item: ProducerCommodityItem) => {
        setEditingItem(item);
        setEditName(item.name);
        setEditCategory(categories.includes(item.category) ? item.category : 'custom');
        setEditCustomCategory(categories.includes(item.category) ? '' : item.category);
        setEditUnit(item.unit);
        setEditOrder(String(item.order));
        setEditIsActive(item.is_active);
        setEditDescription(item.description || '');
        setEditImage(null);
        setEditImagePreview(item.image_url);
        setEditRemoveImage(false);
        setEditModalOpen(true);
    };

    // Submit Edit
    const handleSubmitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;

        const finalCategory = editCategory === 'custom' ? editCustomCategory.trim() : editCategory;
        if (!editName.trim()) {
            toast.error('Nama komoditas wajib diisi.');
            return;
        }

        setIsSubmittingEdit(true);
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', editName);
        formData.append('category', finalCategory);
        formData.append('unit', editUnit);
        if (editOrder) formData.append('order', editOrder);
        formData.append('is_active', editIsActive ? '1' : '0');
        if (editDescription) formData.append('description', editDescription);
        if (editRemoveImage) formData.append('remove_image', '1');
        if (editImage) formData.append('image', editImage);

        router.post(updateProducerCommodityAction.url(editingItem.id), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Komoditas "${editName}" berhasil diperbarui.`);
                setEditModalOpen(false);
                setIsSubmittingEdit(false);
            },
            onError: (err) => {
                toast.error('Gagal memperbarui komoditas: ' + Object.values(err)[0]);
                setIsSubmittingEdit(false);
            },
        });
    };

    // Open Delete Modal
    const handleOpenDelete = (item: ProducerCommodityItem) => {
        setDeletingItem(item);
        setDeleteModalOpen(true);
    };

    // Confirm Delete
    const handleConfirmDelete = () => {
        if (!deletingItem) return;

        setIsSubmittingDelete(true);
        router.delete(destroyProducerCommodityAction.url(deletingItem.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Komoditas "${deletingItem.name}" berhasil dihapus.`);
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
            <Head title="Kelola Komoditas Produsen - DKPP Indramayu" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-md shadow-amber-600/20">
                                <Wheat className="size-5" />
                            </div>
                            <div>
                                <h1 className="font-headline text-2xl sm:text-[30px] font-extrabold tracking-tight text-foreground">
                                    Kelola Komoditas Produsen
                                </h1>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    Master data komoditas pangan di tingkat produsen (petani, sentra penggilingan, &amp; peternak).
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" asChild className="gap-2 text-xs font-semibold">
                            <Link href={producerHapsIndex.url()}>
                                <Scale className="size-4 text-emerald-600" />
                                <span>Kelola HAP Produsen</span>
                            </Link>
                        </Button>

                        <Button variant="outline" asChild className="gap-2 text-xs font-semibold">
                            <Link href={producerPricesIndex.url()}>
                                <Wheat className="size-4 text-amber-600" />
                                <span>Input Harga Produsen</span>
                            </Link>
                        </Button>

                        <Button
                            onClick={handleOpenCreate}
                            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 text-xs font-bold"
                        >
                            <Plus className="size-4" />
                            <span>Tambah Komoditas</span>
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                        <CardHeader className="p-4 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Total Komoditas
                            </span>
                            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">
                                {statistics.total_commodities}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <span className="text-[11px] text-slate-500">
                                Terdaftar di tingkat produsen
                            </span>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                        <CardHeader className="p-4 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                                Status Aktif
                            </span>
                            <CardTitle className="text-2xl font-black text-emerald-700">
                                {statistics.active_count}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <span className="text-[11px] text-slate-500">
                                Ditampilkan di form pencatatan
                            </span>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                        <CardHeader className="p-4 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Nonaktif
                            </span>
                            <CardTitle className="text-2xl font-black text-slate-700 dark:text-slate-200">
                                {statistics.inactive_count}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <span className="text-[11px] text-slate-500">
                                Disembunyikan sementara
                            </span>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                        <CardHeader className="p-4 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                                Kategori
                            </span>
                            <CardTitle className="text-2xl font-black text-amber-700">
                                {statistics.total_categories}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <span className="text-[11px] text-slate-500">
                                Gabah, Beras, Peternakan, dll.
                            </span>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input
                            placeholder="Cari nama komoditas atau key identifier..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 text-xs h-9 bg-slate-50 dark:bg-slate-800/80"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-36 text-xs h-9 bg-slate-50 dark:bg-slate-800/80">
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

                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="w-32 text-xs h-9 bg-slate-50 dark:bg-slate-800/80">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="active">Aktif Saja</SelectItem>
                                <SelectItem value="inactive">Nonaktif</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Main Table */}
                <Card className="rounded-2xl border-slate-200/80 shadow-xs overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
                                    <tr>
                                        <th className="px-4 py-3.5 text-center w-12">No</th>
                                        <th className="px-4 py-3.5">Nama Komoditas</th>
                                        <th className="px-4 py-3.5">Key Field</th>
                                        <th className="px-4 py-3.5">Kategori</th>
                                        <th className="px-4 py-3.5">Satuan</th>
                                        <th className="px-4 py-3.5 text-right">HAP Terkini</th>
                                        <th className="px-4 py-3.5 text-center">Status</th>
                                        <th className="px-4 py-3.5 text-center">Urutan</th>
                                        <th className="px-4 py-3.5 text-center w-28">Aksi</th>
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
                                                    {item.description && (
                                                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                                                            {item.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <code className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                        {item.key}
                                                    </code>
                                                </td>
                                                <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                                                    {item.category}
                                                </td>
                                                <td className="px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-400">
                                                    {item.unit}
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    {item.current_hap ? (
                                                        <div>
                                                            <div className="font-extrabold text-slate-900 dark:text-white">
                                                                {formatCurrency(item.current_hap.price)}
                                                            </div>
                                                            <div className="text-[10px] text-emerald-700 font-semibold">
                                                                {item.current_hap.source_regulation || 'HAP Bapanas'}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-400 italic">
                                                            Belum diatur
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    {item.is_active ? (
                                                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 text-[10px] font-extrabold">
                                                            Aktif
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-slate-400 text-[10px]">
                                                            Nonaktif
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-center font-bold text-slate-600">
                                                    {item.order}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleOpenEdit(item)}
                                                            className="h-8 px-2 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                                                            title="Edit Komoditas"
                                                        >
                                                            <Edit3 className="size-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleOpenDelete(item)}
                                                            className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                                            title="Hapus Komoditas"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                                                Tidak ditemukan komoditas produsen yang sesuai kriteria pencarian.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* ============================================================== */}
                {/* MODAL TAMBAH KOMODITAS PRODUSEN                                */}
                {/* ============================================================== */}
                <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                                <Wheat className="size-5 text-amber-600" />
                                <span>Tambah Komoditas Produsen</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Daftarkan komoditas tingkat produsen baru (petani, penggilingan, peternak).
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitCreate} className="space-y-3.5 pt-2">
                            <div>
                                <Label htmlFor="c-name" className="text-xs font-bold">
                                    Nama Komoditas Produsen *
                                </Label>
                                <Input
                                    id="c-name"
                                    placeholder="Contoh: Gabah Kering Giling (GKG)"
                                    value={createName}
                                    onChange={(e) => setCreateName(e.target.value)}
                                    className="mt-1 text-xs"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="c-key" className="text-xs font-bold">
                                        Key Identifier (Opsional)
                                    </Label>
                                    <Input
                                        id="c-key"
                                        placeholder="Contoh: gkg_penggilingan"
                                        value={createKey}
                                        onChange={(e) => setCreateKey(e.target.value)}
                                        className="mt-1 text-xs font-mono"
                                    />
                                    <span className="text-[10px] text-slate-400">
                                        Otomatis jika dikosongkan
                                    </span>
                                </div>
                                <div>
                                    <Label htmlFor="c-unit" className="text-xs font-bold">
                                        Satuan *
                                    </Label>
                                    <Input
                                        id="c-unit"
                                        placeholder="Contoh: Kg"
                                        value={createUnit}
                                        onChange={(e) => setCreateUnit(e.target.value)}
                                        className="mt-1 text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Kategori *</Label>
                                    <Select
                                        value={createCategory}
                                        onValueChange={(val) => setCreateCategory(val)}
                                    >
                                        <SelectTrigger className="mt-1 text-xs h-9">
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
                                    {createCategory === 'custom' && (
                                        <Input
                                            placeholder="Nama kategori baru..."
                                            value={customCategory}
                                            onChange={(e) => setCustomCategory(e.target.value)}
                                            className="mt-1.5 text-xs"
                                            required
                                        />
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="c-order" className="text-xs font-bold">
                                        Nomor Urutan
                                    </Label>
                                    <Input
                                        id="c-order"
                                        type="number"
                                        placeholder="1"
                                        value={createOrder}
                                        onChange={(e) => setCreateOrder(e.target.value)}
                                        className="mt-1 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 space-y-2">
                                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                    <Scale className="size-3.5 text-amber-700" />
                                    <span>HAP Acuan Awal (Opsional)</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-[11px] text-slate-600">
                                            Harga HAP (Rp)
                                        </Label>
                                        <Input
                                            type="number"
                                            placeholder="Contoh: 7400"
                                            value={createInitialHap}
                                            onChange={(e) => setCreateInitialHap(e.target.value)}
                                            className="mt-0.5 text-xs h-8 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[11px] text-slate-600">
                                            Dasar Regulasi
                                        </Label>
                                        <Input
                                            placeholder="Perbadan No. 6/2023"
                                            value={createInitialRegulation}
                                            onChange={(e) => setCreateInitialRegulation(e.target.value)}
                                            className="mt-0.5 text-xs h-8 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="c-desc" className="text-xs font-bold">
                                    Deskripsi Tambahan (Opsional)
                                </Label>
                                <textarea
                                    id="c-desc"
                                    rows={2}
                                    placeholder="Keterangan tahapan atau mutu gabah/beras..."
                                    value={createDescription}
                                    onChange={(e) => setCreateDescription(e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="text-xs"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmittingCreate}
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                                >
                                    {isSubmittingCreate ? 'Menyimpan...' : 'Simpan Komoditas'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ============================================================== */}
                {/* MODAL EDIT KOMODITAS PRODUSEN                                  */}
                {/* ============================================================== */}
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                                <Edit3 className="size-5 text-amber-600" />
                                <span>Edit Komoditas: {editingItem?.name}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Perbarui data konfigurasi komoditas produsen.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitEdit} className="space-y-3.5 pt-2">
                            <div>
                                <Label htmlFor="e-name" className="text-xs font-bold">
                                    Nama Komoditas *
                                </Label>
                                <Input
                                    id="e-name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="mt-1 text-xs"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Kategori *</Label>
                                    <Select
                                        value={editCategory}
                                        onValueChange={(val) => setEditCategory(val)}
                                    >
                                        <SelectTrigger className="mt-1 text-xs h-9">
                                            <SelectValue placeholder="Pilih Kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c} value={c}>
                                                    {c}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="custom">+ Kategori Lain...</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {editCategory === 'custom' && (
                                        <Input
                                            placeholder="Nama kategori..."
                                            value={editCustomCategory}
                                            onChange={(e) => setEditCustomCategory(e.target.value)}
                                            className="mt-1.5 text-xs"
                                            required
                                        />
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="e-unit" className="text-xs font-bold">
                                        Satuan *
                                    </Label>
                                    <Input
                                        id="e-unit"
                                        value={editUnit}
                                        onChange={(e) => setEditUnit(e.target.value)}
                                        className="mt-1 text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="e-order" className="text-xs font-bold">
                                        Nomor Urutan
                                    </Label>
                                    <Input
                                        id="e-order"
                                        type="number"
                                        value={editOrder}
                                        onChange={(e) => setEditOrder(e.target.value)}
                                        className="mt-1 text-xs"
                                    />
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <input
                                        id="e-active"
                                        type="checkbox"
                                        checked={editIsActive}
                                        onChange={(e) => setEditIsActive(e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <Label htmlFor="e-active" className="text-xs font-bold text-slate-800">
                                        Status Aktif
                                    </Label>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="e-desc" className="text-xs font-bold">
                                    Deskripsi Tambahan
                                </Label>
                                <textarea
                                    id="e-desc"
                                    rows={2}
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditModalOpen(false)}
                                    className="text-xs"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmittingEdit}
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                                >
                                    {isSubmittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ============================================================== */}
                {/* MODAL HAPUS KOMODITAS PRODUSEN                                 */}
                {/* ============================================================== */}
                <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-rose-600">
                                <AlertTriangle className="size-5" />
                                <span>Hapus Komoditas Produsen</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-600">
                                Apakah Anda yakin ingin menghapus komoditas <strong>&quot;{deletingItem?.name}&quot;</strong>? Seluruh data riwayat HAP yang terhubung dengan komoditas ini akan ikut terhapus.
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
                                disabled={isSubmittingDelete}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
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

ProducerCommoditiesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Komoditas Produsen',
            href: producerCommoditiesIndex(),
        },
    ] satisfies BreadcrumbItem[],
};

