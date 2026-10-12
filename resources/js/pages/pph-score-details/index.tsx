import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    Apple,
    ArrowLeft,
    CheckCircle2,
    Edit3,
    FileSpreadsheet,
    Layers,
    Plus,
    Search,
    Sparkles,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import { index as pphFoodGroupsIndex } from '@/routes/pph-food-groups';
import {
    bulkStore as bulkStoreDetailAction,
    destroy as destroyDetailAction,
    index as pphScoreDetailsIndex,
    store as storeDetailAction,
    update as updateDetailAction,
} from '@/routes/pph-score-details';
import { index as pphScoresIndex } from '@/routes/pph-scores';
import type { BreadcrumbItem } from '@/types';

export interface DetailItemRow {
    id: number | null;
    pph_food_group_id: number;
    tahun: number;
    food_group_name: string;
    food_group_slug: string;
    food_group_order: number;
    food_group_is_active: boolean;
    food_group_description: string | null;
    energi: number;
    ake_percentage: number;
    bobot: number;
    skor_riil: number;
    skor_pph: number;
    skor_maksimal: number;
    keterangan: string | null;
    is_recorded: boolean;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface FoodGroupOption {
    id: number;
    name: string;
    slug: string;
    bobot: number;
    skor_maksimal: number;
    is_active: boolean;
}

interface PageProps {
    items: DetailItemRow[];
    foodGroups: FoodGroupOption[];
    selectedYear: number;
    availableYears: number[];
    totals: {
        total_energi: number;
        total_ake: number;
        total_bobot: number;
        total_skor_riil: number;
        total_skor_pph: number;
        total_skor_maksimal: number;
        recorded_count: number;
        total_groups: number;
    };
    parentScore: {
        id: number;
        tahun: number;
        skor_pph: number;
        keterangan: string | null;
    } | null;
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

export default function PphScoreDetailsIndex({
    items,
    foodGroups,
    selectedYear,
    availableYears,
    totals,
    parentScore,
}: PageProps) {
    const [currentYear, setCurrentYear] = useState<number>(selectedYear);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isNewYearModalOpen, setIsNewYearModalOpen] = useState(false);
    const [newYearInput, setNewYearInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Single Form state
    const [editingItem, setEditingItem] = useState<DetailItemRow | null>(null);
    const [formGroupId, setFormGroupId] = useState<number>(foodGroups[0]?.id || 0);
    const [formEnergi, setFormEnergi] = useState<string>('0');
    const [formAke, setFormAke] = useState<string>('0');
    const [formBobot, setFormBobot] = useState<string>('0.5');
    const [formSkorRiil, setFormSkorRiil] = useState<string>('0');
    const [formSkorPph, setFormSkorPph] = useState<string>('0');
    const [formSkorMaksimal, setFormSkorMaksimal] = useState<string>('25');
    const [formKeterangan, setFormKeterangan] = useState<string>('');

    // Bulk Entry Form state (one row per active food group)
    interface BulkRowState {
        pph_food_group_id: number;
        name: string;
        energi: string;
        ake_percentage: string;
        bobot: number;
        skor_riil: number;
        skor_pph: number;
        skor_maksimal: number;
        keterangan: string;
    }
    const [bulkRows, setBulkRows] = useState<BulkRowState[]>([]);

    // Change year filter
    const handleYearChange = (year: number) => {
        setCurrentYear(year);
        router.get(
            pphScoreDetailsIndex.url(),
            { year },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    // Filter items by search
    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) return items;
        const q = searchTerm.toLowerCase();
        return items.filter(
            (i) =>
                i.food_group_name.toLowerCase().includes(q) ||
                (i.keterangan && i.keterangan.toLowerCase().includes(q))
        );
    }, [items, searchTerm]);

    // Handle Open Single Add/Edit Modal
    const handleOpenSingle = (item?: DetailItemRow) => {
        if (item) {
            setEditingItem(item);
            setFormGroupId(item.pph_food_group_id);
            setFormEnergi(item.energi.toString());
            setFormAke(item.ake_percentage.toString());
            setFormBobot(item.bobot.toString());
            setFormSkorRiil(item.skor_riil.toString());
            setFormSkorPph(item.skor_pph.toString());
            setFormSkorMaksimal(item.skor_maksimal.toString());
            setFormKeterangan(item.keterangan || '');
        } else {
            setEditingItem(null);
            const firstGroup = foodGroups[0];
            setFormGroupId(firstGroup ? firstGroup.id : 0);
            setFormEnergi('0');
            setFormAke('0');
            setFormBobot(firstGroup ? firstGroup.bobot.toString() : '0.5');
            setFormSkorRiil('0');
            setFormSkorPph('0');
            setFormSkorMaksimal(firstGroup ? firstGroup.skor_maksimal.toString() : '25');
            setFormKeterangan('');
        }
        setIsSingleModalOpen(true);
    };

    // Auto-calculate single modal scores when % AKE or bobot or energi changes
    const handleAkeChange = (newAkeVal: string) => {
        setFormAke(newAkeVal);
        const parsedAke = parseFloat(newAkeVal) || 0;
        const parsedBobot = parseFloat(formBobot) || 0;
        const parsedMax = parseFloat(formSkorMaksimal) || 0;
        const calcRiil = Math.round(parsedAke * parsedBobot * 100) / 100;
        const calcPph = Math.min(calcRiil, parsedMax);
        setFormSkorRiil(calcRiil.toString());
        setFormSkorPph(calcPph.toString());
    };

    // Auto update bobot & max when group changes
    const handleGroupSelect = (groupIdStr: string) => {
        const id = parseInt(groupIdStr, 10);
        setFormGroupId(id);
        const group = foodGroups.find((g) => g.id === id);
        if (group) {
            setFormBobot(group.bobot.toString());
            setFormSkorMaksimal(group.skor_maksimal.toString());
            const parsedAke = parseFloat(formAke) || 0;
            const calcRiil = Math.round(parsedAke * group.bobot * 100) / 100;
            const calcPph = Math.min(calcRiil, group.skor_maksimal);
            setFormSkorRiil(calcRiil.toString());
            setFormSkorPph(calcPph.toString());
        }
    };

    // Submit Single Form
    const handleSubmitSingle = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            tahun: currentYear,
            pph_food_group_id: formGroupId,
            energi: parseFloat(formEnergi) || 0,
            ake_percentage: parseFloat(formAke) || 0,
            bobot: parseFloat(formBobot) || 0,
            skor_riil: parseFloat(formSkorRiil) || 0,
            skor_pph: parseFloat(formSkorPph) || 0,
            skor_maksimal: parseFloat(formSkorMaksimal) || 0,
            keterangan: formKeterangan.trim() || null,
        };

        setIsSubmitting(true);
        if (editingItem && editingItem.id) {
            router.put(updateDetailAction.url({ pphScoreDetail: editingItem.id }), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Rincian detail PPH berhasil diperbarui.');
                    setIsSingleModalOpen(false);
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0] as string;
                    toast.error(firstError || 'Gagal menyimpan detail.');
                    setIsSubmitting(false);
                },
            });
        } else {
            router.post(storeDetailAction.url(), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Rincian detail PPH berhasil disimpan.');
                    setIsSingleModalOpen(false);
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0] as string;
                    toast.error(firstError || 'Gagal menyimpan detail.');
                    setIsSubmitting(false);
                },
            });
        }
    };

    // Open Bulk Modal
    const handleOpenBulk = () => {
        const rows: BulkRowState[] = foodGroups.map((g) => {
            const existing = items.find((i) => i.pph_food_group_id === g.id && i.is_recorded);
            const energi = existing ? existing.energi.toString() : '0';
            const ake = existing ? existing.ake_percentage.toString() : '0';
            const bobot = existing ? existing.bobot : g.bobot;
            const skorMaksimal = existing ? existing.skor_maksimal : g.skor_maksimal;
            const skorRiil = existing ? existing.skor_riil : Math.round((parseFloat(ake) || 0) * bobot * 100) / 100;
            const skorPph = existing ? existing.skor_pph : Math.min(skorRiil, skorMaksimal);

            return {
                pph_food_group_id: g.id,
                name: g.name,
                energi,
                ake_percentage: ake,
                bobot,
                skor_riil: skorRiil,
                skor_pph: skorPph,
                skor_maksimal: skorMaksimal,
                keterangan: existing?.keterangan || '',
            };
        });

        setBulkRows(rows);
        setIsBulkModalOpen(true);
    };

    // Update bulk row cell with auto-calculation
    const handleBulkCellChange = (index: number, field: 'energi' | 'ake_percentage' | 'keterangan', value: string) => {
        setBulkRows((prev) => {
            const next = [...prev];
            const row = { ...next[index], [field]: value };

            if (field === 'ake_percentage') {
                const akeVal = parseFloat(value) || 0;
                const calcRiil = Math.round(akeVal * row.bobot * 100) / 100;
                const calcPph = Math.min(calcRiil, row.skor_maksimal);
                row.skor_riil = calcRiil;
                row.skor_pph = calcPph;
            }

            next[index] = row;
            return next;
        });
    };

    // Calculate total skor PPH live in bulk modal
    const bulkTotalScore = useMemo(() => {
        return Math.round(bulkRows.reduce((acc, r) => acc + (r.skor_pph || 0), 0) * 100) / 100;
    }, [bulkRows]);

    // Submit Bulk Form
    const handleSubmitBulk = () => {
        setIsSubmitting(true);
        const payload = {
            tahun: currentYear,
            items: bulkRows.map((r) => ({
                pph_food_group_id: r.pph_food_group_id,
                energi: parseFloat(r.energi) || 0,
                ake_percentage: parseFloat(r.ake_percentage) || 0,
                bobot: r.bobot,
                skor_riil: r.skor_riil,
                skor_pph: r.skor_pph,
                skor_maksimal: r.skor_maksimal,
                keterangan: r.keterangan.trim() || null,
            })),
        };

        router.post(bulkStoreDetailAction.url(), payload, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Semua rincian PPH Tahun ${currentYear} berhasil disimpan.`);
                setIsBulkModalOpen(false);
                setIsSubmitting(false);
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0] as string;
                toast.error(firstError || 'Gagal menyimpan rincian bulk.');
                setIsSubmitting(false);
            },
        });
    };

    // Delete single item
    const [deletingItem, setDeletingItem] = useState<DetailItemRow | null>(null);
    const handleOpenDelete = (item: DetailItemRow) => {
        setDeletingItem(item);
        setIsDeleteModalOpen(true);
    };

    const handleSubmitDelete = () => {
        if (!deletingItem || !deletingItem.id) return;
        setIsSubmitting(true);
        router.delete(destroyDetailAction.url({ pphScoreDetail: deletingItem.id }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Data detail ${deletingItem.food_group_name} berhasil dihapus.`);
                setIsDeleteModalOpen(false);
                setIsSubmitting(false);
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0] as string;
                toast.error(firstError || 'Gagal menghapus data.');
                setIsSubmitting(false);
            },
        });
    };

    // Handle add new year
    const handleAddNewYear = (e: React.FormEvent) => {
        e.preventDefault();
        const year = parseInt(newYearInput, 10);
        if (isNaN(year) || year < 2000 || year > 2100) {
            toast.error('Masukkan tahun valid (2000 - 2100).');
            return;
        }
        setIsNewYearModalOpen(false);
        setNewYearInput('');
        handleYearChange(year);
    };

    const finalScoreCat = getScoreCategory(totals.total_skor_pph);

    return (
        <>
            <Head title={`Detail Skor PPH Tahun ${currentYear} - DKPP Indramayu`} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                                <FileSpreadsheet className="size-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                        Detail Skor PPH
                                    </h1>
                                    <Badge
                                        variant="outline"
                                        className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold dark:bg-emerald-950 dark:text-emerald-300"
                                    >
                                        Tahun {currentYear}
                                    </Badge>
                                </div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Rincian 9 Kelompok Bahan Pangan, Energi Kalori, % AKE, Bobot, Skor Riil, dan Skor Maksimal
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons Toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Kembali ke Skor PPH */}
                        <Button
                            variant="outline"
                            asChild
                            className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                        >
                            <Link href={pphScoresIndex.url()}>
                                <ArrowLeft className="size-4" />
                                Ringkasan Skor PPH
                            </Link>
                        </Button>

                        {/* Kelola Kelompok Pangan */}
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

                        {/* Input Bulk Cepat */}
                        <Button
                            onClick={handleOpenBulk}
                            className="gap-2 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                        >
                            <Sparkles className="size-4" />
                            Input Cepat Tahun Ini
                        </Button>

                        {/* Tambah Baris Satuan */}
                        <Button
                            variant="outline"
                            onClick={() => handleOpenSingle()}
                            className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
                        >
                            <Plus className="size-4" />
                            Tambah / Edit Baris
                        </Button>
                    </div>
                </div>

                {/* Year Selector & Overview Ribbon */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center gap-3">
                        <Label htmlFor="yearSelect" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Pilih Tahun:
                        </Label>
                        <Select
                            value={currentYear.toString()}
                            onValueChange={(val) => {
                                if (val === 'new') {
                                    setIsNewYearModalOpen(true);
                                } else {
                                    handleYearChange(parseInt(val, 10));
                                }
                            }}
                        >
                            <SelectTrigger className="w-[140px] font-bold text-slate-900 dark:text-slate-100">
                                <SelectValue placeholder="Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableYears.map((yr) => (
                                    <SelectItem key={yr} value={yr.toString()} className="font-medium">
                                        Tahun {yr}
                                    </SelectItem>
                                ))}
                                <SelectItem value="new" className="text-emerald-600 font-semibold">
                                    + Tambah Tahun Baru...
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            Terisi: <strong>{totals.recorded_count}</strong> dari {totals.total_groups} kelompok bahan pangan
                        </span>
                    </div>

                    {/* Status Sinkronisasi Skor PPH */}
                    <div className="flex items-center gap-2">
                        {parentScore ? (
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-slate-500">Tersimpan di Skor PPH:</span>
                                <Badge variant="secondary" className="font-bold">
                                    {parentScore.skor_pph.toFixed(2)}
                                </Badge>
                                {Math.abs(parentScore.skor_pph - totals.total_skor_pph) < 0.01 ? (
                                    <span className="flex items-center text-emerald-600 gap-1 font-medium">
                                        <CheckCircle2 className="size-3.5" /> Sinkron
                                    </span>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleOpenBulk}
                                        className="h-6 text-[11px] text-amber-700 border-amber-300"
                                    >
                                        Perbarui Total
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <span className="text-xs text-slate-400 italic">
                                Belum ada record induk di Skor PPH (akan dibuat otomatis saat disimpan)
                            </span>
                        )}
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-slate-200/80 shadow-xs dark:border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Total Energi (Kalori)
                            </CardTitle>
                            <TrendingUp className="size-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {totals.total_energi.toLocaleString('id-ID')} <span className="text-sm font-normal text-slate-400">kkal</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Standar Nasional: 2.100 kkal/kap/hari
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/80 shadow-xs dark:border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Total % AKE
                            </CardTitle>
                            <Layers className="size-4 text-teal-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                                {totals.total_ake.toFixed(2)}%
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Angka Kecukupan Energi total
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/80 shadow-xs dark:border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Total Skor Riil
                            </CardTitle>
                            <TrendingUp className="size-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {totals.total_skor_riil.toFixed(2)}
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Hasil kalkulasi % AKE &times; Bobot
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-200 bg-emerald-50/40 shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                TOTAL SKOR PPH
                            </CardTitle>
                            <Badge variant="outline" className={`text-xs ${finalScoreCat.badgeClass}`}>
                                {finalScoreCat.label}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400">
                                    {totals.total_skor_pph.toFixed(2)}
                                </span>
                                <span className="text-xs text-slate-500">/ 100.00</span>
                            </div>
                            <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-400/80">
                                Capaian Mutu Gizi Pangan {currentYear}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search Bar */}
                <div className="flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Cari kelompok bahan pangan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Detail Table */}
                <Card className="overflow-hidden border-slate-200/80 shadow-xs dark:border-slate-800">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                <tr>
                                    <th className="px-3 py-3.5 text-center w-12">No</th>
                                    <th className="px-4 py-3.5">Kelompok Bahan Pangan</th>
                                    <th className="px-4 py-3.5 text-right">Energi (Kalori)</th>
                                    <th className="px-4 py-3.5 text-right">% AKE</th>
                                    <th className="px-4 py-3.5 text-right">Bobot</th>
                                    <th className="px-4 py-3.5 text-right">Skor Riil</th>
                                    <th className="px-4 py-3.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                                        Skor PPH
                                    </th>
                                    <th className="px-4 py-3.5 text-right">Skor Maks</th>
                                    <th className="px-4 py-3.5">Keterangan</th>
                                    <th className="px-4 py-3.5 text-right w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <AlertCircle className="size-8 text-slate-400" />
                                                <p className="font-medium">Tidak ada kelompok bahan pangan ditemukan.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((row, idx) => {
                                        return (
                                            <tr
                                                key={row.pph_food_group_id}
                                                className={`transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                                                    !row.is_recorded ? 'opacity-70 bg-slate-50/30' : ''
                                                }`}
                                            >
                                                <td className="px-3 py-3.5 text-center text-xs text-slate-500 font-medium">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                                                            {row.food_group_name}
                                                        </span>
                                                        {row.food_group_description && (
                                                            <span className="text-[11px] text-slate-500 line-clamp-1">
                                                                {row.food_group_description}
                                                            </span>
                                                        )}
                                                        {!row.is_recorded && (
                                                            <span className="text-[10px] text-amber-600 font-medium mt-0.5">
                                                                (Belum diisi)
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-medium text-slate-800 dark:text-slate-200">
                                                    {row.is_recorded ? row.energi.toLocaleString('id-ID') : '-'}
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-medium text-slate-800 dark:text-slate-200">
                                                    {row.is_recorded ? `${row.ake_percentage.toFixed(2)}%` : '-'}
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-slate-600 dark:text-slate-300">
                                                    {row.bobot.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-medium text-slate-800 dark:text-slate-200">
                                                    {row.is_recorded ? row.skor_riil.toFixed(2) : '-'}
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                                                    {row.is_recorded ? (
                                                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 border border-emerald-200/60 dark:bg-emerald-950/60 dark:border-emerald-800">
                                                            {row.skor_pph.toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-slate-500">
                                                    {row.skor_maksimal.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                                    {row.keterangan || <span className="text-slate-400 italic">-</span>}
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleOpenSingle(row)}
                                                            className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800"
                                                            title={row.is_recorded ? 'Edit data baris ini' : 'Isi data baris ini'}
                                                        >
                                                            <Edit3 className="size-3.5" />
                                                        </Button>
                                                        {row.is_recorded && row.id && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleOpenDelete(row)}
                                                                className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50"
                                                                title="Hapus data baris ini"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                            {/* Summary / Total Footer */}
                            <tfoot className="border-t-2 border-slate-300 bg-slate-100/90 font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-100">
                                <tr>
                                    <td colSpan={2} className="px-4 py-3.5 text-left text-xs uppercase tracking-wider font-extrabold text-slate-700 dark:text-slate-300">
                                        TOTAL / JUMLAH
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-bold">
                                        {totals.total_energi.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-bold text-teal-700 dark:text-teal-400">
                                        {totals.total_ake.toFixed(2)}%
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        {totals.total_bobot.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-bold text-blue-700 dark:text-blue-400">
                                        {totals.total_skor_riil.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3.5 text-right text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                                        <span className="rounded-md bg-emerald-100 px-2.5 py-1 border border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700">
                                            {totals.total_skor_pph.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-bold text-slate-600 dark:text-slate-400">
                                        {totals.total_skor_maksimal.toFixed(2)}
                                    </td>
                                    <td colSpan={2} className="px-4 py-3.5 text-xs text-slate-500 font-normal">
                                        Skor Mutu PPH: {totals.total_skor_pph.toFixed(2)} / 100.00
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Card>

                {/* Single Row Modal */}
                <Dialog open={isSingleModalOpen} onOpenChange={setIsSingleModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem && editingItem.id ? 'Edit Rincian PPH' : 'Tambah Rincian PPH'} ({currentYear})
                            </DialogTitle>
                            <DialogDescription>
                                Masukkan rincian konsumsi bahan pangan, energi, % AKE, dan kalkulasi skor.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitSingle} className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="selectGroup">Kelompok Bahan Pangan *</Label>
                                <Select
                                    value={formGroupId.toString()}
                                    onValueChange={handleGroupSelect}
                                    disabled={editingItem !== null && editingItem.is_recorded}
                                >
                                    <SelectTrigger id="selectGroup">
                                        <SelectValue placeholder="Pilih Kelompok Bahan Pangan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {foodGroups.map((g) => (
                                            <SelectItem key={g.id} value={g.id.toString()}>
                                                {g.name} (Bobot: {g.bobot}, Skor Maks: {g.skor_maksimal})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="formEnergi">Energi (Kalori) *</Label>
                                    <Input
                                        id="formEnergi"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={formEnergi}
                                        onChange={(e) => setFormEnergi(e.target.value)}
                                        placeholder="Contoh: 1250"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="formAke">% AKE *</Label>
                                    <Input
                                        id="formAke"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={formAke}
                                        onChange={(e) => handleAkeChange(e.target.value)}
                                        placeholder="Contoh: 59.52"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="formBobot">Bobot</Label>
                                    <Input
                                        id="formBobot"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={formBobot}
                                        onChange={(e) => {
                                            setFormBobot(e.target.value);
                                            const b = parseFloat(e.target.value) || 0;
                                            const a = parseFloat(formAke) || 0;
                                            const r = Math.round(a * b * 100) / 100;
                                            setFormSkorRiil(r.toString());
                                            setFormSkorPph(Math.min(r, parseFloat(formSkorMaksimal) || 0).toString());
                                        }}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="formSkorMaksimal">Skor Maksimal</Label>
                                    <Input
                                        id="formSkorMaksimal"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={formSkorMaksimal}
                                        onChange={(e) => {
                                            setFormSkorMaksimal(e.target.value);
                                            const m = parseFloat(e.target.value) || 0;
                                            const r = parseFloat(formSkorRiil) || 0;
                                            setFormSkorPph(Math.min(r, m).toString());
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                <div className="space-y-1.5">
                                    <Label htmlFor="formSkorRiil" className="text-xs text-slate-600 dark:text-slate-400">
                                        Skor Riil (% AKE &times; Bobot)
                                    </Label>
                                    <Input
                                        id="formSkorRiil"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={formSkorRiil}
                                        onChange={(e) => setFormSkorRiil(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="formSkorPph" className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                        Skor PPH min(Riil, Maks) *
                                    </Label>
                                    <Input
                                        id="formSkorPph"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={formSkorPph}
                                        onChange={(e) => setFormSkorPph(e.target.value)}
                                        className="font-bold border-emerald-300 text-emerald-800"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="formKeterangan">Keterangan (Opsional)</Label>
                                <Input
                                    id="formKeterangan"
                                    type="text"
                                    value={formKeterangan}
                                    onChange={(e) => setFormKeterangan(e.target.value)}
                                    placeholder="Contoh: Konsumsi beras melebihi batas anjuran"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsSingleModalOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Bulk Entry Modal */}
                <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <DialogTitle>Input Cepat Semua Kelompok PPH ({currentYear})</DialogTitle>
                                    <DialogDescription>
                                        Isi nilai Energi dan % AKE untuk semua kelompok. Skor Riil dan Skor PPH akan otomatis dihitung.
                                    </DialogDescription>
                                </div>
                                <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-right dark:border-emerald-800 dark:bg-emerald-950/60">
                                    <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                                        Total Skor PPH
                                    </div>
                                    <div className="text-xl font-extrabold text-emerald-800 dark:text-emerald-300">
                                        {bulkTotalScore.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="mt-2 space-y-4">
                            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800">
                                        <tr>
                                            <th className="p-2.5">Kelompok Pangan</th>
                                            <th className="p-2.5 w-28">Energi (kkal)</th>
                                            <th className="p-2.5 w-24">% AKE</th>
                                            <th className="p-2.5 text-right w-16">Bobot</th>
                                            <th className="p-2.5 text-right w-20">Skor Riil</th>
                                            <th className="p-2.5 text-right w-20 text-emerald-700">Skor PPH</th>
                                            <th className="p-2.5 text-right w-16">Maks</th>
                                            <th className="p-2.5">Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {bulkRows.map((row, idx) => (
                                            <tr key={row.pph_food_group_id} className="hover:bg-slate-50/50">
                                                <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">
                                                    {row.name}
                                                </td>
                                                <td className="p-2">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min={0}
                                                        value={row.energi}
                                                        onChange={(e) => handleBulkCellChange(idx, 'energi', e.target.value)}
                                                        className="h-8 text-xs text-right"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min={0}
                                                        value={row.ake_percentage}
                                                        onChange={(e) => handleBulkCellChange(idx, 'ake_percentage', e.target.value)}
                                                        className="h-8 text-xs text-right font-medium"
                                                    />
                                                </td>
                                                <td className="p-2.5 text-right text-slate-500">
                                                    {row.bobot.toFixed(2)}
                                                </td>
                                                <td className="p-2.5 text-right font-medium text-slate-700 dark:text-slate-300">
                                                    {row.skor_riil.toFixed(2)}
                                                </td>
                                                <td className="p-2.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                                                    {row.skor_pph.toFixed(2)}
                                                </td>
                                                <td className="p-2.5 text-right text-slate-400">
                                                    {row.skor_maksimal.toFixed(2)}
                                                </td>
                                                <td className="p-2">
                                                    <Input
                                                        type="text"
                                                        value={row.keterangan}
                                                        onChange={(e) => handleBulkCellChange(idx, 'keterangan', e.target.value)}
                                                        placeholder="Catatan..."
                                                        className="h-8 text-xs"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <DialogFooter className="pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsBulkModalOpen(false)}
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmitBulk}
                                className="bg-emerald-600 text-white hover:bg-emerald-700 gap-2"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Menyimpan Semua...' : `Simpan Semua (Skor Total: ${bulkTotalScore.toFixed(2)})`}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add New Year Modal */}
                <Dialog open={isNewYearModalOpen} onOpenChange={setIsNewYearModalOpen}>
                    <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Buka Periode Tahun Baru</DialogTitle>
                            <DialogDescription>
                                Masukkan tahun yang ingin dibuka untuk pencatatan rincian PPH.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleAddNewYear} className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="newYearInput">Tahun Baru *</Label>
                                <Input
                                    id="newYearInput"
                                    type="number"
                                    min={2000}
                                    max={2100}
                                    value={newYearInput}
                                    onChange={(e) => setNewYearInput(e.target.value)}
                                    placeholder="Contoh: 2027"
                                    required
                                    autoFocus
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsNewYearModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-700">
                                    Buka Tahun
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-rose-600">Hapus Rincian Detail PPH</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus data rincian untuk kelompok pangan{' '}
                                <strong className="text-slate-900 dark:text-slate-100">
                                    {deletingItem?.food_group_name}
                                </strong>{' '}
                                pada tahun {currentYear}? Skor total PPH akan otomatis disesuaikan.
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
                                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

PphScoreDetailsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Detail Skor PPH',
            href: pphScoreDetailsIndex(),
        },
    ] satisfies BreadcrumbItem[],
};

