import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    Apple,
    CheckCircle2,
    Edit3,
    FileSpreadsheet,
    Layers,
    Plus,
    Search,
    Trash2,
    Wheat,
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
import {
    destroy as destroyGroupAction,
    index as pphFoodGroupsIndex,
    store as storeGroupAction,
    toggle as toggleGroupAction,
    update as updateGroupAction,
} from '@/routes/pph-food-groups';
import { index as pphScoreDetailsIndex } from '@/routes/pph-score-details';
import type { BreadcrumbItem } from '@/types';

export interface FoodGroupRow {
    id: number;
    name: string;
    slug: string;
    bobot: number;
    skor_maksimal: number;
    order: number;
    is_active: boolean;
    description: string | null;
    details_count: number;
    created_at?: string | null;
    updated_at?: string | null;
}

interface PageProps {
    groups: FoodGroupRow[];
    filters: {
        search: string;
        status: string;
    };
    statistics: {
        total_groups: number;
        active_count: number;
        inactive_count: number;
        total_bobot: number;
        total_skor_maksimal: number;
    };
}

export default function PphFoodGroupsIndex({ groups, filters, statistics }: PageProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<FoodGroupRow | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form fields
    const [formName, setFormName] = useState('');
    const [formBobot, setFormBobot] = useState('0.5');
    const [formSkorMaksimal, setFormSkorMaksimal] = useState('10');
    const [formOrder, setFormOrder] = useState('1');
    const [formIsActive, setFormIsActive] = useState(true);
    const [formDescription, setFormDescription] = useState('');

    // Filtered groups
    const filteredGroups = useMemo(() => {
        return groups.filter((g) => {
            const matchesSearch =
                searchTerm === '' ||
                g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (g.description && g.description.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && g.is_active) ||
                (statusFilter === 'inactive' && !g.is_active);

            return matchesSearch && matchesStatus;
        });
    }, [groups, searchTerm, statusFilter]);

    // Open Create Modal
    const handleOpenCreate = () => {
        const nextOrder = groups.length > 0 ? Math.max(...groups.map((g) => g.order)) + 1 : 1;
        setFormName('');
        setFormBobot('0.5');
        setFormSkorMaksimal('10');
        setFormOrder(nextOrder.toString());
        setFormIsActive(true);
        setFormDescription('');
        setIsCreateModalOpen(true);
    };

    // Open Edit Modal
    const handleOpenEdit = (group: FoodGroupRow) => {
        setSelectedGroup(group);
        setFormName(group.name);
        setFormBobot(group.bobot.toString());
        setFormSkorMaksimal(group.skor_maksimal.toString());
        setFormOrder(group.order.toString());
        setFormIsActive(group.is_active);
        setFormDescription(group.description || '');
        setIsEditModalOpen(true);
    };

    // Open Delete Modal
    const handleOpenDelete = (group: FoodGroupRow) => {
        setSelectedGroup(group);
        setIsDeleteModalOpen(true);
    };

    // Submit Create
    const handleSubmitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) {
            toast.error('Nama kelompok bahan pangan wajib diisi.');
            return;
        }

        setIsSubmitting(true);
        router.post(
            storeGroupAction.url(),
            {
                name: formName.trim(),
                bobot: parseFloat(formBobot) || 0,
                skor_maksimal: parseFloat(formSkorMaksimal) || 0,
                order: parseInt(formOrder, 10) || 1,
                is_active: formIsActive,
                description: formDescription.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Kelompok pangan '${formName}' berhasil ditambahkan.`);
                    setIsCreateModalOpen(false);
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0] as string;
                    toast.error(firstError || 'Gagal menambahkan kelompok pangan.');
                    setIsSubmitting(false);
                },
            }
        );
    };

    // Submit Edit
    const handleSubmitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroup) return;

        setIsSubmitting(true);
        router.put(
            updateGroupAction.url({ pphFoodGroup: selectedGroup.id }),
            {
                name: formName.trim(),
                bobot: parseFloat(formBobot) || 0,
                skor_maksimal: parseFloat(formSkorMaksimal) || 0,
                order: parseInt(formOrder, 10) || 1,
                is_active: formIsActive,
                description: formDescription.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Kelompok pangan '${formName}' berhasil diperbarui.`);
                    setIsEditModalOpen(false);
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0] as string;
                    toast.error(firstError || 'Gagal memperbarui kelompok pangan.');
                    setIsSubmitting(false);
                },
            }
        );
    };

    // Toggle Active Status
    const handleToggleStatus = (group: FoodGroupRow) => {
        router.post(
            toggleGroupAction.url({ pphFoodGroup: group.id }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Status kelompok '${group.name}' berhasil diubah.`);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0] as string;
                    toast.error(firstError || 'Gagal mengubah status.');
                },
            }
        );
    };

    // Submit Delete
    const handleSubmitDelete = () => {
        if (!selectedGroup) return;

        setIsSubmitting(true);
        router.delete(destroyGroupAction.url({ pphFoodGroup: selectedGroup.id }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Kelompok pangan '${selectedGroup.name}' berhasil dihapus.`);
                setIsDeleteModalOpen(false);
                setIsSubmitting(false);
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0] as string;
                toast.error(firstError || 'Gagal menghapus kelompok pangan.');
                setIsSubmitting(false);
            },
        });
    };

    return (
        <>
            <Head title="Kelola Kelompok Bahan Pangan PPH - DKPP Indramayu" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                                <Apple className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    Kelola Kelompok Bahan Pangan PPH
                                </h1>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Master Data Kelompok Bahan Pangan Dinamis, Bobot Standar, dan Skor Maksimal Pola Pangan Harapan
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons Toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Detail Skor PPH Shortcut */}
                        <Button
                            variant="outline"
                            asChild
                            className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                        >
                            <Link href={pphScoreDetailsIndex.url()}>
                                <FileSpreadsheet className="size-4 text-emerald-600" />
                                Buka Detail Skor PPH
                            </Link>
                        </Button>

                        {/* Tambah Kelompok Pangan */}
                        <Button
                            onClick={handleOpenCreate}
                            className="gap-2 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                        >
                            <Plus className="size-4" />
                            Tambah Kelompok Pangan
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-slate-200/80 shadow-xs dark:border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Total Kelompok Pangan
                            </CardTitle>
                            <Wheat className="size-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {statistics.total_groups} Kelompok
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Standar Nasional: 9 Kelompok Bahan Pangan
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/80 shadow-xs dark:border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Kelompok Aktif
                            </CardTitle>
                            <CheckCircle2 className="size-4 text-teal-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                                {statistics.active_count} Aktif
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {statistics.inactive_count} kelompok dinonaktifkan
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/80 shadow-xs dark:border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Total Bobot Standar
                            </CardTitle>
                            <Layers className="size-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {statistics.total_bobot.toFixed(2)}
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Akumulasi pengali bobot aktif
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/80 shadow-xs dark:border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Total Skor Maksimal
                            </CardTitle>
                            <Apple className="size-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {statistics.total_skor_maksimal.toFixed(2)}
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Standar total skor PPH: 100.00
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Cari kelompok pangan atau deskripsi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Label htmlFor="statusFilter" className="text-xs text-slate-500">
                            Status:
                        </Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger id="statusFilter" className="w-[130px] text-xs">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="active">Hanya Aktif</SelectItem>
                                <SelectItem value="inactive">Non-aktif</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <Card className="overflow-hidden border-slate-200/80 shadow-xs dark:border-slate-800">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                <tr>
                                    <th className="px-3 py-3.5 text-center w-14">Urutan</th>
                                    <th className="px-4 py-3.5">Nama Kelompok Bahan Pangan</th>
                                    <th className="px-4 py-3.5 text-right w-28">Bobot Standar</th>
                                    <th className="px-4 py-3.5 text-right w-28">Skor Maksimal</th>
                                    <th className="px-4 py-3.5 text-center w-28">Status</th>
                                    <th className="px-4 py-3.5">Deskripsi / Contoh</th>
                                    <th className="px-4 py-3.5 text-center w-28">Riwayat PPH</th>
                                    <th className="px-4 py-3.5 text-right w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                                {filteredGroups.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <AlertCircle className="size-8 text-slate-400" />
                                                <p className="font-medium">Tidak ada kelompok bahan pangan ditemukan.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredGroups.map((row) => (
                                        <tr
                                            key={row.id}
                                            className={`transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                                                !row.is_active ? 'opacity-60 bg-slate-50/40' : ''
                                            }`}
                                        >
                                            <td className="px-3 py-3.5 text-center text-xs font-bold text-slate-600 dark:text-slate-400">
                                                <span className="inline-flex size-6 items-center justify-center rounded-full bg-slate-100 text-xs dark:bg-slate-800">
                                                    {row.order}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                                                        {row.name}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 font-mono">
                                                        {row.slug}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-medium text-slate-800 dark:text-slate-200">
                                                {row.bobot.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                                                {row.skor_maksimal.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleToggleStatus(row)}
                                                    className="h-7 px-2"
                                                    title={row.is_active ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'}
                                                >
                                                    {row.is_active ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 cursor-pointer"
                                                        >
                                                            <CheckCircle2 className="size-3" /> Aktif
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="gap-1 bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 cursor-pointer"
                                                        >
                                                            <XCircle className="size-3" /> Nonaktif
                                                        </Badge>
                                                    )}
                                                </Button>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400 max-w-sm">
                                                {row.description || <span className="text-slate-400 italic">-</span>}
                                            </td>
                                            <td className="px-4 py-3.5 text-center text-xs text-slate-500">
                                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium dark:bg-slate-800">
                                                    {row.details_count} record
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleOpenEdit(row)}
                                                        className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                                        title="Edit kelompok bahan pangan"
                                                    >
                                                        <Edit3 className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleOpenDelete(row)}
                                                        className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50"
                                                        title="Hapus kelompok bahan pangan"
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

                {/* Create Modal */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Tambah Kelompok Bahan Pangan</DialogTitle>
                            <DialogDescription>
                                Tambahkan kelompok bahan pangan baru untuk perhitungan Pola Pangan Harapan.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitCreate} className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="formName">Nama Kelompok Bahan Pangan *</Label>
                                <Input
                                    id="formName"
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="Contoh: Sayuran dan Buah"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="formBobot">Bobot Standar *</Label>
                                    <Input
                                        id="formBobot"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={formBobot}
                                        onChange={(e) => setFormBobot(e.target.value)}
                                        placeholder="Contoh: 0.5 atau 2.0"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="formSkorMaksimal">Skor Maksimal Standar *</Label>
                                    <Input
                                        id="formSkorMaksimal"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={formSkorMaksimal}
                                        onChange={(e) => setFormSkorMaksimal(e.target.value)}
                                        placeholder="Contoh: 25.0 atau 30.0"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 items-center">
                                <div className="space-y-1.5">
                                    <Label htmlFor="formOrder">Urutan Tampilan</Label>
                                    <Input
                                        id="formOrder"
                                        type="number"
                                        min={1}
                                        value={formOrder}
                                        onChange={(e) => setFormOrder(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center space-x-2 pt-6">
                                    <Checkbox
                                        id="formIsActive"
                                        checked={formIsActive}
                                        onCheckedChange={(checked) => setFormIsActive(Boolean(checked))}
                                    />
                                    <Label htmlFor="formIsActive" className="text-sm font-medium cursor-pointer">
                                        Aktifkan Kelompok Ini
                                    </Label>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="formDescription">Deskripsi / Contoh Bahan Pangan</Label>
                                <Input
                                    id="formDescription"
                                    type="text"
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    placeholder="Contoh: Beras, jagung, gandum, tepung"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Kelompok Pangan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Kelompok Bahan Pangan</DialogTitle>
                            <DialogDescription>
                                Perbarui informasi nama kelompok, bobot, atau skor maksimal.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitEdit} className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="editName">Nama Kelompok Bahan Pangan *</Label>
                                <Input
                                    id="editName"
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="editBobot">Bobot Standar *</Label>
                                    <Input
                                        id="editBobot"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={formBobot}
                                        onChange={(e) => setFormBobot(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="editSkorMaksimal">Skor Maksimal Standar *</Label>
                                    <Input
                                        id="editSkorMaksimal"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={formSkorMaksimal}
                                        onChange={(e) => setFormSkorMaksimal(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 items-center">
                                <div className="space-y-1.5">
                                    <Label htmlFor="editOrder">Urutan Tampilan</Label>
                                    <Input
                                        id="editOrder"
                                        type="number"
                                        min={1}
                                        value={formOrder}
                                        onChange={(e) => setFormOrder(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center space-x-2 pt-6">
                                    <Checkbox
                                        id="editIsActive"
                                        checked={formIsActive}
                                        onCheckedChange={(checked) => setFormIsActive(Boolean(checked))}
                                    />
                                    <Label htmlFor="editIsActive" className="text-sm font-medium cursor-pointer">
                                        Aktifkan Kelompok Ini
                                    </Label>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="editDescription">Deskripsi / Contoh Bahan Pangan</Label>
                                <Input
                                    id="editDescription"
                                    type="text"
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Modal */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-rose-600">Hapus Kelompok Bahan Pangan</DialogTitle>
                            <DialogDescription>
                                {selectedGroup && selectedGroup.details_count > 0 ? (
                                    <span>
                                        Kelompok pangan{' '}
                                        <strong className="text-slate-900 dark:text-slate-100">
                                            {selectedGroup.name}
                                        </strong>{' '}
                                        tidak dapat dihapus karena sudah memiliki{' '}
                                        <strong>{selectedGroup.details_count} data rincian detail PPH</strong> yang tercatat. Anda dapat memilih untuk menonaktifkannya saja.
                                    </span>
                                ) : (
                                    <span>
                                        Apakah Anda yakin ingin menghapus kelompok bahan pangan{' '}
                                        <strong className="text-slate-900 dark:text-slate-100">
                                            {selectedGroup?.name}
                                        </strong>
                                        ? Tindakan ini tidak dapat dibatalkan.
                                    </span>
                                )}
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isSubmitting}
                            >
                                {selectedGroup && selectedGroup.details_count > 0 ? 'Tutup' : 'Batal'}
                            </Button>
                            {selectedGroup && selectedGroup.details_count === 0 && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleSubmitDelete}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Kelompok'}
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

PphFoodGroupsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Kelompok Pangan PPH',
            href: pphFoodGroupsIndex(),
        },
    ] satisfies BreadcrumbItem[],
};

