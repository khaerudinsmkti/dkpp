import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    Apple,
    Award,
    Edit3,
    FileSpreadsheet,
    PieChart,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    TrendingUp,
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
import { dashboard } from '@/routes';
import { index as pphFoodGroupsIndex } from '@/routes/pph-food-groups';
import { index as pphScoreDetailsIndex } from '@/routes/pph-score-details';
import {
    destroy as destroyScoreAction,
    index as pphScoresIndex,
    recalculate as recalculateScoreAction,
    store as storeScoreAction,
    update as updateScoreAction,
} from '@/routes/pph-scores';
import type { BreadcrumbItem } from '@/types';

export interface PphScoreRow {
    id: number;
    tahun: number;
    skor_pph: number;
    target_renstra: number;
    keterangan: string | null;
    details_count: number;
    creator_name?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

interface PageProps {
    scores: PphScoreRow[];
    filters: {
        search: string;
    };
    statistics: {
        total_years: number;
        avg_score: number;
        max_score: number;
        min_score: number;
        latest_year: number;
        latest_target_renstra?: number;
        total_food_groups: number;
    };
}

function getScoreCategory(score: number): { label: string; badgeClass: string } {
    if (score >= 90) {
        return {
            label: 'Sangat Baik',
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
        };
    }
    if (score >= 80) {
        return {
            label: 'Baik',
            badgeClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800',
        };
    }
    if (score >= 70) {
        return {
            label: 'Cukup',
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
        };
    }
    return {
        label: 'Kurang',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
    };
}

export default function PphScoresIndex({ scores, filters, statistics }: PageProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    // Form Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRecalculatingId, setIsRecalculatingId] = useState<number | null>(null);

    // Selected item for edit/delete
    const [selectedScore, setSelectedScore] = useState<PphScoreRow | null>(null);

    // Form fields
    const [formYear, setFormYear] = useState<string>(new Date().getFullYear().toString());
    const [formScore, setFormScore] = useState<string>('0');
    const [formTargetRenstra, setFormTargetRenstra] = useState<string>('94.00');
    const [formKeterangan, setFormKeterangan] = useState<string>('');

    // Filtered scores list
    const filteredScores = useMemo(() => {
        if (!searchTerm.trim()) return scores;
        const q = searchTerm.toLowerCase();
        return scores.filter(
            (item) =>
                item.tahun.toString().includes(q) ||
                (item.keterangan && item.keterangan.toLowerCase().includes(q))
        );
    }, [scores, searchTerm]);

    // Handle Open Create Modal
    const handleOpenCreate = () => {
        const nextYear = scores.length > 0 ? Math.max(...scores.map((s) => s.tahun)) + 1 : new Date().getFullYear();
        setFormYear(nextYear.toString());
        setFormScore('0');
        setFormTargetRenstra('94.00');
        setFormKeterangan('');
        setIsCreateModalOpen(true);
    };

    // Handle Open Edit Modal
    const handleOpenEdit = (item: PphScoreRow) => {
        setSelectedScore(item);
        setFormYear(item.tahun.toString());
        setFormScore(item.skor_pph.toString());
        setFormTargetRenstra((item.target_renstra ?? 94.0).toString());
        setFormKeterangan(item.keterangan || '');
        setIsEditModalOpen(true);
    };

    // Handle Open Delete Modal
    const handleOpenDelete = (item: PphScoreRow) => {
        setSelectedScore(item);
        setIsDeleteModalOpen(true);
    };

    // Submit Create
    const handleSubmitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const parsedYear = parseInt(formYear, 10);
        const parsedScore = parseFloat(formScore);
        const parsedRenstra = parseFloat(formTargetRenstra);

        if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
            toast.error('Masukkan tahun yang valid (2000 - 2100).');
            return;
        }

        if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
            toast.error('Skor PPH harus di antara 0 dan 100.');
            return;
        }

        if (isNaN(parsedRenstra) || parsedRenstra < 0 || parsedRenstra > 100) {
            toast.error('Target RENSTRA harus di antara 0 dan 100.');
            return;
        }

        setIsSubmitting(true);
        router.post(
            storeScoreAction.url(),
            {
                tahun: parsedYear,
                skor_pph: parsedScore,
                target_renstra: parsedRenstra,
                keterangan: formKeterangan.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Skor PPH Tahun ${parsedYear} berhasil ditambahkan.`);
                    setIsCreateModalOpen(false);
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0] as string;
                    toast.error(firstError || 'Gagal menambahkan Skor PPH.');
                    setIsSubmitting(false);
                },
            }
        );
    };

    // Submit Edit
    const handleSubmitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedScore) return;

        const parsedYear = parseInt(formYear, 10);
        const parsedScore = parseFloat(formScore);
        const parsedRenstra = parseFloat(formTargetRenstra);

        if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
            toast.error('Masukkan tahun yang valid (2000 - 2100).');
            return;
        }

        if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
            toast.error('Skor PPH harus di antara 0 dan 100.');
            return;
        }

        if (isNaN(parsedRenstra) || parsedRenstra < 0 || parsedRenstra > 100) {
            toast.error('Target RENSTRA harus di antara 0 dan 100.');
            return;
        }

        setIsSubmitting(true);
        router.put(
            updateScoreAction.url({ pphScore: selectedScore.id }),
            {
                tahun: parsedYear,
                skor_pph: parsedScore,
                target_renstra: parsedRenstra,
                keterangan: formKeterangan.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Skor PPH Tahun ${parsedYear} berhasil diperbarui.`);
                    setIsEditModalOpen(false);
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0] as string;
                    toast.error(firstError || 'Gagal memperbarui Skor PPH.');
                    setIsSubmitting(false);
                },
            }
        );
    };

    // Submit Delete
    const handleSubmitDelete = () => {
        if (!selectedScore) return;

        setIsSubmitting(true);
        router.delete(destroyScoreAction.url({ pphScore: selectedScore.id }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Skor PPH Tahun ${selectedScore.tahun} berhasil dihapus.`);
                setIsDeleteModalOpen(false);
                setIsSubmitting(false);
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0] as string;
                toast.error(firstError || 'Gagal menghapus Skor PPH.');
                setIsSubmitting(false);
            },
        });
    };

    // Recalculate score from details
    const handleRecalculate = (item: PphScoreRow) => {
        setIsRecalculatingId(item.id);
        router.post(
            recalculateScoreAction.url({ pphScore: item.id }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Skor PPH Tahun ${item.tahun} berhasil dihitung ulang dari data detail.`);
                    setIsRecalculatingId(null);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0] as string;
                    toast.error(firstError || 'Gagal menghitung ulang skor.');
                    setIsRecalculatingId(null);
                },
            }
        );
    };

    return (
        <>
            <Head title="Skor Pola Pangan Harapan (PPH) - DKPP Indramayu" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                                <PieChart className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    Skor Pola Pangan Harapan (PPH)
                                </h1>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Data Capaian Mutu dan Diversifikasi Konsumsi Pangan Kabupaten Indramayu
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
                                Detail Skor PPH
                            </Link>
                        </Button>

                        {/* Kelola Kelompok Pangan Master */}
                        <Button
                            variant="outline"
                            asChild
                            className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                        >
                            <Link href={pphFoodGroupsIndex.url()}>
                                <Apple className="size-4 text-emerald-600" />
                                Kelola Kelompok Pangan
                            </Link>
                        </Button>

                        {/* Tambah Skor PPH */}
                        <Button
                            onClick={handleOpenCreate}
                            className="gap-2 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                        >
                            <Plus className="size-4" />
                            Tambah Skor PPH
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-slate-200/80 shadow-xs dark:border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Total Tahun Tercatat
                            </CardTitle>
                            <Award className="size-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {statistics.total_years} Tahun
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Terakhir: Tahun {statistics.latest_year}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/80 shadow-xs dark:border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Rata-rata Skor PPH
                            </CardTitle>
                            <TrendingUp className="size-4 text-teal-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                                {statistics.avg_score.toFixed(2)}
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Target RENSTRA {statistics.latest_year}: {statistics.latest_target_renstra?.toFixed(2) ?? '94.00'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/80 shadow-xs dark:border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Skor Tertinggi
                            </CardTitle>
                            <PieChart className="size-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {statistics.max_score.toFixed(2)}
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Capaian skor tertinggi
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/80 shadow-xs dark:border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Master Kelompok Pangan
                            </CardTitle>
                            <Apple className="size-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {statistics.total_food_groups} Kelompok
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Dinamis & dapat disesuaikan
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Cari berdasarkan tahun atau keterangan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Main Data Table */}
                <Card className="overflow-hidden border-slate-200/80 shadow-xs dark:border-slate-800">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-3.5 text-center">Tahun</th>
                                    <th className="px-4 py-3.5">Skor PPH</th>
                                    <th className="px-4 py-3.5">Target RENSTRA</th>
                                    <th className="px-4 py-3.5">Status Kategori</th>
                                    <th className="px-4 py-3.5">Kelompok Terisi</th>
                                    <th className="px-4 py-3.5">Keterangan</th>
                                    <th className="px-4 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                                {filteredScores.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <AlertCircle className="size-8 text-slate-400" />
                                                <p className="font-medium">Tidak ada data Skor PPH ditemukan.</p>
                                                <p className="text-xs text-slate-400">
                                                    Silakan klik tombol &quot;Tambah Skor PPH&quot; untuk mencatat data baru.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredScores.map((row) => {
                                        const cat = getScoreCategory(row.skor_pph);
                                        const percentageOfMax = Math.min(100, Math.max(0, (row.skor_pph / 100) * 100));
                                        const targetRenstra = row.target_renstra ?? 94.0;
                                        const isAchieved = row.skor_pph >= targetRenstra;

                                        return (
                                            <tr
                                                key={row.id}
                                                className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                                            >
                                                <td className="px-4 py-4 text-center font-bold text-slate-900 dark:text-slate-100">
                                                    <span className="inline-flex items-center rounded-lg bg-emerald-50 px-3 py-1 text-base font-bold text-emerald-800 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                                                        {row.tahun}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                                                {row.skor_pph.toFixed(2)}
                                                            </span>
                                                            <span className="text-xs text-slate-400">/ 100.00</span>
                                                        </div>
                                                        {/* Visual Progress Bar */}
                                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                            <div
                                                                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                                                style={{ width: `${percentageOfMax}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col gap-1 min-w-[120px]">
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-base font-bold tracking-tight text-amber-600 dark:text-amber-400">
                                                                {targetRenstra.toFixed(2)}
                                                            </span>
                                                            <span className="text-xs text-slate-400">/ 100.00</span>
                                                        </div>
                                                        {isAchieved ? (
                                                            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                ✓ Melampaui (+{(row.skor_pph - targetRenstra).toFixed(2)})
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                                                Selisih {(row.skor_pph - targetRenstra).toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge variant="outline" className={`font-semibold ${cat.badgeClass}`}>
                                                        {cat.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                            {row.details_count} / {statistics.total_food_groups} kelompok
                                                        </span>
                                                        {row.details_count > 0 && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleRecalculate(row)}
                                                                disabled={isRecalculatingId === row.id}
                                                                className="h-7 px-2 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50"
                                                                title="Hitung ulang total dari rincian detail"
                                                            >
                                                                <RefreshCw
                                                                    className={`size-3 mr-1 ${
                                                                        isRecalculatingId === row.id ? 'animate-spin' : ''
                                                                    }`}
                                                                />
                                                                Sync
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                                    {row.keterangan || <span className="text-slate-400 italic">-</span>}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* Lihat Detail PPH */}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            asChild
                                                            className="h-8 gap-1 border-slate-200 text-xs text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-800 dark:text-emerald-400"
                                                        >
                                                            <Link href={`${pphScoreDetailsIndex.url()}?year=${row.tahun}`}>
                                                                <FileSpreadsheet className="size-3.5" />
                                                                Detail
                                                            </Link>
                                                        </Button>

                                                        {/* Edit Skor */}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleOpenEdit(row)}
                                                            className="h-8 px-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                                            title="Edit Skor PPH"
                                                        >
                                                            <Edit3 className="size-3.5" />
                                                        </Button>

                                                        {/* Hapus Skor */}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleOpenDelete(row)}
                                                            className="h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                                            title="Hapus Skor PPH"
                                                        >
                                                            <Trash2 className="size-3.5" />
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
                </Card>

                {/* Create Modal */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Tambah Data Skor PPH</DialogTitle>
                            <DialogDescription>
                                Masukkan tahun, nilai capaian skor PPH, dan target RENSTRA tahunan.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitCreate} className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="formYear">Tahun *</Label>
                                <Input
                                    id="formYear"
                                    type="number"
                                    min={2000}
                                    max={2100}
                                    value={formYear}
                                    onChange={(e) => setFormYear(e.target.value)}
                                    placeholder="Contoh: 2026"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="formScore">Skor PPH (0 - 100) *</Label>
                                <Input
                                    id="formScore"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    max={100}
                                    value={formScore}
                                    onChange={(e) => setFormScore(e.target.value)}
                                    placeholder="Contoh: 88.50"
                                    required
                                />
                                <p className="text-[11px] text-slate-500">
                                    Tips: Anda juga dapat mengisi rincian di menu <strong>Detail Skor PPH</strong>, yang akan otomatis menghitung skor ini.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="formTargetRenstra">Target RENSTRA (0 - 100) *</Label>
                                <Input
                                    id="formTargetRenstra"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    max={100}
                                    value={formTargetRenstra}
                                    onChange={(e) => setFormTargetRenstra(e.target.value)}
                                    placeholder="Contoh: 94.00"
                                    required
                                />
                                <p className="text-[11px] text-slate-500">
                                    Target indikator sasaran mutu konsumsi pangan RENSTRA DKPP untuk tahun ini (default: 94.00).
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="formKeterangan">Keterangan (Opsional)</Label>
                                <Input
                                    id="formKeterangan"
                                    type="text"
                                    value={formKeterangan}
                                    onChange={(e) => setFormKeterangan(e.target.value)}
                                    placeholder="Contoh: Capaian Skor PPH Indramayu 2026"
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
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Skor PPH'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Skor PPH</DialogTitle>
                            <DialogDescription>
                                Perbarui informasi tahun, capaian skor PPH, dan target RENSTRA.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitEdit} className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="editYear">Tahun *</Label>
                                <Input
                                    id="editYear"
                                    type="number"
                                    min={2000}
                                    max={2100}
                                    value={formYear}
                                    onChange={(e) => setFormYear(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="editScore">Skor PPH *</Label>
                                <Input
                                    id="editScore"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    max={100}
                                    value={formScore}
                                    onChange={(e) => setFormScore(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="editTargetRenstra">Target RENSTRA *</Label>
                                <Input
                                    id="editTargetRenstra"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    max={100}
                                    value={formTargetRenstra}
                                    onChange={(e) => setFormTargetRenstra(e.target.value)}
                                    required
                                />
                                <p className="text-[11px] text-slate-500">
                                    Target indikator sasaran RENSTRA untuk tahun ini.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="editKeterangan">Keterangan</Label>
                                <Input
                                    id="editKeterangan"
                                    type="text"
                                    value={formKeterangan}
                                    onChange={(e) => setFormKeterangan(e.target.value)}
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

                {/* Delete Confirmation Modal */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-rose-600">Hapus Skor PPH</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus data Skor PPH Tahun{' '}
                                <strong className="text-slate-900 dark:text-slate-100">
                                    {selectedScore?.tahun}
                                </strong>
                                ? Semua data rincian detail PPH pada tahun tersebut juga akan terhapus. Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleSubmitDelete}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Data'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

PphScoresIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Skor PPH',
            href: pphScoresIndex(),
        },
    ] satisfies BreadcrumbItem[],
};

