import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Edit3,
    ExternalLink,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    TrendingDown,
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
import type { BreadcrumbItem } from '@/types';

export interface IkpScoreRow {
    id: number;
    tahun: number;
    nilai_ikp: number;
    target_renstra: number;
    diff_renstra: number;
    capaian_percentage: number;
    status: string;
    is_achieved: boolean;
    keterangan: string | null;
    indeks_ketersediaan?: number | null;
    indeks_keterjangkauan?: number | null;
    indeks_pemanfaatan?: number | null;
    kelompok_ikp?: string | null;
    status_kerentanan?: string | null;
    creator_name?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

interface PageProps {
    scores: IkpScoreRow[];
    filters: {
        search: string;
    };
    statistics: {
        total_years: number;
        avg_score: number;
        avg_target: number;
        max_score: number;
        min_score: number;
        latest_year: number;
        latest_nilai_ikp: number;
        latest_target_renstra: number;
        achieved_count: number;
    };
}

function getKelompokBadge(kelompok?: string | null) {
    if (!kelompok) {
        return {
            label: '-',
            className:
                'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        };
    }
    switch (kelompok) {
        case 'Kelompok 6':
            return {
                label: kelompok,
                className:
                    'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
            };
        case 'Kelompok 5':
            return {
                label: kelompok,
                className:
                    'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
            };
        case 'Kelompok 4':
            return {
                label: kelompok,
                className:
                    'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
            };
        case 'Kelompok 3':
            return {
                label: kelompok,
                className:
                    'bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
            };
        case 'Kelompok 2':
        case 'Kelompok 1':
            return {
                label: kelompok,
                className:
                    'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
            };
        default:
            return {
                label: kelompok,
                className:
                    'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
            };
    }
}

function getCategoryBadge(status: string) {
    switch (status) {
        case 'Sangat Tahan':
            return {
                label: 'Sangat Tahan',
                className:
                    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
            };
        case 'Tahan':
            return {
                label: 'Tahan',
                className:
                    'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800',
            };
        case 'Agak Tahan':
            return {
                label: 'Agak Tahan',
                className:
                    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
            };
        case 'Agak Rentan':
            return {
                label: 'Agak Rentan',
                className:
                    'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800',
            };
        case 'Rentan':
        case 'Sangat Rentan':
            return {
                label: status,
                className:
                    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
            };
        default:
            return {
                label: status,
                className:
                    'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
            };
    }
}

export default function IkpScoresIndex({ scores, filters, statistics }: PageProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    // Form Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Selected item for edit/delete
    const [selectedScore, setSelectedScore] = useState<IkpScoreRow | null>(null);

    // Form fields
    const [formYear, setFormYear] = useState<string>(new Date().getFullYear().toString());
    const [formNilaiIkp, setFormNilaiIkp] = useState<string>('85.00');
    const [formTargetRenstra, setFormTargetRenstra] = useState<string>('84.00');
    const [formIndeksKetersediaan, setFormIndeksKetersediaan] = useState<string>('');
    const [formIndeksKeterjangkauan, setFormIndeksKeterjangkauan] = useState<string>('');
    const [formIndeksPemanfaatan, setFormIndeksPemanfaatan] = useState<string>('');
    const [formKelompokIkp, setFormKelompokIkp] = useState<string>('Kelompok 6');
    const [formStatusKerentanan, setFormStatusKerentanan] = useState<string>('Sangat Tahan');
    const [formKeterangan, setFormKeterangan] = useState<string>('');

    const updateKelompokAndStatusFromNilai = (val: string) => {
        setFormNilaiIkp(val);
        const num = parseFloat(val);
        if (!isNaN(num)) {
            if (num >= 80) {
                setFormKelompokIkp('Kelompok 6');
                setFormStatusKerentanan('Sangat Tahan');
            } else if (num >= 70) {
                setFormKelompokIkp('Kelompok 5');
                setFormStatusKerentanan('Tahan');
            } else if (num >= 60) {
                setFormKelompokIkp('Kelompok 4');
                setFormStatusKerentanan('Agak Tahan');
            } else if (num >= 50) {
                setFormKelompokIkp('Kelompok 3');
                setFormStatusKerentanan('Agak Rentan');
            } else if (num >= 40) {
                setFormKelompokIkp('Kelompok 2');
                setFormStatusKerentanan('Rentan');
            } else {
                setFormKelompokIkp('Kelompok 1');
                setFormStatusKerentanan('Sangat Rentan');
            }
        }
    };

    // Filtered scores list
    const filteredScores = useMemo(() => {
        if (!searchTerm.trim()) return scores;
        const q = searchTerm.toLowerCase();
        return scores.filter(
            (item) =>
                item.tahun.toString().includes(q) ||
                (item.keterangan && item.keterangan.toLowerCase().includes(q)) ||
                item.status.toLowerCase().includes(q) ||
                (item.kelompok_ikp && item.kelompok_ikp.toLowerCase().includes(q)) ||
                (item.status_kerentanan && item.status_kerentanan.toLowerCase().includes(q)),
        );
    }, [scores, searchTerm]);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Pemantauan Pangan',
            href: '#',
        },
        {
            title: 'Indeks Ketahanan Pangan (IKP)',
            href: '/ikp-scores',
        },
    ];

    const openCreateModal = () => {
        const nextYear =
            scores.length > 0
                ? Math.max(...scores.map((s) => s.tahun)) + 1
                : new Date().getFullYear();
        setFormYear(nextYear.toString());
        setFormNilaiIkp('');
        setFormTargetRenstra(
            statistics.latest_target_renstra > 0
                ? (statistics.latest_target_renstra + 1).toFixed(2)
                : '85.00',
        );
        setFormIndeksKetersediaan('');
        setFormIndeksKeterjangkauan('');
        setFormIndeksPemanfaatan('');
        setFormKelompokIkp('Kelompok 6');
        setFormStatusKerentanan('Sangat Tahan');
        setFormKeterangan('');
        setIsCreateModalOpen(true);
    };

    const openEditModal = (item: IkpScoreRow) => {
        setSelectedScore(item);
        setFormYear(item.tahun.toString());
        setFormNilaiIkp(item.nilai_ikp.toString());
        setFormTargetRenstra(item.target_renstra.toString());
        setFormIndeksKetersediaan(
            item.indeks_ketersediaan !== null && item.indeks_ketersediaan !== undefined
                ? item.indeks_ketersediaan.toString()
                : '',
        );
        setFormIndeksKeterjangkauan(
            item.indeks_keterjangkauan !== null && item.indeks_keterjangkauan !== undefined
                ? item.indeks_keterjangkauan.toString()
                : '',
        );
        setFormIndeksPemanfaatan(
            item.indeks_pemanfaatan !== null && item.indeks_pemanfaatan !== undefined
                ? item.indeks_pemanfaatan.toString()
                : '',
        );
        setFormKelompokIkp(item.kelompok_ikp || 'Kelompok 6');
        setFormStatusKerentanan(item.status_kerentanan || item.status || 'Sangat Tahan');
        setFormKeterangan(item.keterangan || '');
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (item: IkpScoreRow) => {
        setSelectedScore(item);
        setIsDeleteModalOpen(true);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            '/ikp-scores',
            {
                tahun: parseInt(formYear, 10),
                nilai_ikp: parseFloat(formNilaiIkp),
                target_renstra: parseFloat(formTargetRenstra),
                indeks_ketersediaan:
                    formIndeksKetersediaan.trim() !== ''
                        ? parseFloat(formIndeksKetersediaan)
                        : null,
                indeks_keterjangkauan:
                    formIndeksKeterjangkauan.trim() !== ''
                        ? parseFloat(formIndeksKeterjangkauan)
                        : null,
                indeks_pemanfaatan:
                    formIndeksPemanfaatan.trim() !== ''
                        ? parseFloat(formIndeksPemanfaatan)
                        : null,
                kelompok_ikp: formKelompokIkp || null,
                status_kerentanan: formStatusKerentanan || null,
                keterangan: formKeterangan,
            },
            {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    toast.success('Data IKP berhasil ditambahkan');
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(
                        typeof firstError === 'string'
                            ? firstError
                            : 'Gagal menambahkan data IKP',
                    );
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedScore) return;

        setIsSubmitting(true);

        router.put(
            `/ikp-scores/${selectedScore.id}`,
            {
                tahun: parseInt(formYear, 10),
                nilai_ikp: parseFloat(formNilaiIkp),
                target_renstra: parseFloat(formTargetRenstra),
                indeks_ketersediaan:
                    formIndeksKetersediaan.trim() !== ''
                        ? parseFloat(formIndeksKetersediaan)
                        : null,
                indeks_keterjangkauan:
                    formIndeksKeterjangkauan.trim() !== ''
                        ? parseFloat(formIndeksKeterjangkauan)
                        : null,
                indeks_pemanfaatan:
                    formIndeksPemanfaatan.trim() !== ''
                        ? parseFloat(formIndeksPemanfaatan)
                        : null,
                kelompok_ikp: formKelompokIkp || null,
                status_kerentanan: formStatusKerentanan || null,
                keterangan: formKeterangan,
            },
            {
                onSuccess: () => {
                    setIsEditModalOpen(false);
                    toast.success('Data IKP berhasil diperbarui');
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(
                        typeof firstError === 'string'
                            ? firstError
                            : 'Gagal memperbarui data IKP',
                    );
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleDeleteSubmit = () => {
        if (!selectedScore) return;

        setIsSubmitting(true);

        router.delete(`/ikp-scores/${selectedScore.id}`, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.success('Data IKP berhasil dihapus');
            },
            onError: () => {
                toast.error('Gagal menghapus data IKP');
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <Head title="Kelola Indeks Ketahanan Pangan (IKP)" />

            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-[#006565] dark:bg-emerald-950/50 dark:text-emerald-400">
                            <ShieldCheck className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                                Kelola Indeks Ketahanan Pangan (IKP)
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                                Manajemen capaian tahunan Nilai IKP dan Target Renstra Kabupaten Indramayu
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/ikp"
                        target="_blank"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:border-[#006565] hover:text-[#006565] transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                        <ExternalLink className="h-4 w-4" />
                        <span>Halaman Publik IKP</span>
                    </Link>
                    <Button
                        onClick={openCreateModal}
                        className="gap-2 rounded-xl bg-gradient-to-r from-[#006565] to-emerald-700 text-xs font-bold text-white shadow-md shadow-[#006565]/20 hover:shadow-lg hover:shadow-[#006565]/30 cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Tambah Data IKP</span>
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            IKP Terkini ({statistics.latest_year})
                        </CardTitle>
                        <ShieldCheck className="h-4 w-4 text-[#006565] dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                                {statistics.latest_nilai_ikp.toFixed(2)}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                                Target: {statistics.latest_target_renstra.toFixed(2)}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                            {statistics.latest_nilai_ikp >= statistics.latest_target_renstra ? (
                                <Badge className="gap-1 bg-emerald-50 text-[10px] font-bold text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>
                                        +{(statistics.latest_nilai_ikp - statistics.latest_target_renstra).toFixed(2)} vs Renstra
                                    </span>
                                </Badge>
                            ) : (
                                <Badge className="gap-1 bg-rose-50 text-[10px] font-bold text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                                    <TrendingDown className="h-3 w-3" />
                                    <span>
                                        {(statistics.latest_nilai_ikp - statistics.latest_target_renstra).toFixed(2)} vs Renstra
                                    </span>
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Rata-Rata IKP
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">
                            {statistics.avg_score.toFixed(2)}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Target Renstra Rata-rata: {statistics.avg_target.toFixed(2)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Capaian Target Renstra
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-[#006565] dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">
                            {statistics.achieved_count} / {statistics.total_years} Tahun
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {statistics.total_years > 0
                                ? `${Math.round((statistics.achieved_count / statistics.total_years) * 100)}% tahun melampaui target`
                                : 'Belum ada data'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Rentang Nilai
                        </CardTitle>
                        <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                                {statistics.max_score.toFixed(2)}
                            </span>
                            <span className="text-xs text-slate-500">
                                Tertinggi (Min: {statistics.min_score.toFixed(2)})
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Dari total {statistics.total_years} tahun data terekam
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Cari tahun, status, atau keterangan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="rounded-xl pl-9 text-xs sm:text-sm"
                    />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                    Menampilkan <span className="font-bold text-slate-900 dark:text-white">{filteredScores.length}</span> dari {scores.length} data
                </div>
            </div>

            {/* Data Table */}
            <Card className="overflow-hidden rounded-2xl border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300">
                            <tr>
                                <th className="px-3.5 py-3.5 text-center">No</th>
                                <th className="px-3.5 py-3.5">Tahun</th>
                                <th className="px-3.5 py-3.5 text-right">Nilai IKP</th>
                                <th className="px-3.5 py-3.5 text-right">Target Renstra</th>
                                <th className="px-3.5 py-3.5 text-right">Selisih</th>
                                <th className="px-3.5 py-3.5 text-center">Capaian (%)</th>
                                <th className="px-3.5 py-3.5 text-right" title="Pilar 1: Ketersediaan Pangan">Indeks Ketersediaan</th>
                                <th className="px-3.5 py-3.5 text-right" title="Pilar 2: Keterjangkauan Pangan">Indeks Keterjangkauan</th>
                                <th className="px-3.5 py-3.5 text-right" title="Pilar 3: Pemanfaatan Pangan">Indeks Pemanfaatan</th>
                                <th className="px-3.5 py-3.5 text-center">Kelompok IKP</th>
                                <th className="px-3.5 py-3.5">Status Kerentanan</th>
                                <th className="px-3.5 py-3.5">Keterangan</th>
                                <th className="px-3.5 py-3.5 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredScores.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={13}
                                        className="py-12 text-center text-xs text-slate-500 dark:text-slate-400"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <AlertCircle className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                            <p className="font-semibold text-slate-700 dark:text-slate-300">
                                                Tidak ada data IKP yang ditemukan
                                            </p>
                                            <p className="text-slate-400">
                                                Coba gunakan kata kunci pencarian lain atau tambahkan data baru.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredScores.map((item, idx) => {
                                    const badge = getCategoryBadge(item.status_kerentanan || item.status);
                                    const kelompokBadge = getKelompokBadge(item.kelompok_ikp);
                                    return (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-slate-50/70 transition-colors dark:hover:bg-slate-850/50"
                                        >
                                            <td className="px-3.5 py-3 text-center font-medium text-slate-400">
                                                {idx + 1}
                                            </td>
                                            <td className="px-3.5 py-3">
                                                <span className="font-extrabold text-slate-900 dark:text-white">
                                                    {item.tahun}
                                                </span>
                                            </td>
                                            <td className="px-3.5 py-3 text-right">
                                                <span className="font-black text-emerald-700 dark:text-emerald-400">
                                                    {item.nilai_ikp.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-3.5 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                                                {item.target_renstra.toFixed(2)}
                                            </td>
                                            <td className="px-3.5 py-3 text-right">
                                                <span
                                                    className={`inline-flex items-center gap-1 font-bold ${
                                                        item.diff_renstra >= 0
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-rose-600 dark:text-rose-400'
                                                    }`}
                                                >
                                                    {item.diff_renstra >= 0 ? '+' : ''}
                                                    {item.diff_renstra.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-3.5 py-3 text-center">
                                                <Badge
                                                    className={`font-mono text-[10px] font-bold ${
                                                        item.is_achieved
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                    }`}
                                                >
                                                    {item.capaian_percentage.toFixed(1)}%
                                                </Badge>
                                            </td>
                                            <td className="px-3.5 py-3 text-right font-mono font-semibold text-emerald-800 dark:text-emerald-300">
                                                {item.indeks_ketersediaan !== null && item.indeks_ketersediaan !== undefined
                                                    ? item.indeks_ketersediaan.toFixed(2)
                                                    : '-'}
                                            </td>
                                            <td className="px-3.5 py-3 text-right font-mono font-semibold text-sky-800 dark:text-sky-300">
                                                {item.indeks_keterjangkauan !== null && item.indeks_keterjangkauan !== undefined
                                                    ? item.indeks_keterjangkauan.toFixed(2)
                                                    : '-'}
                                            </td>
                                            <td className="px-3.5 py-3 text-right font-mono font-semibold text-amber-800 dark:text-amber-300">
                                                {item.indeks_pemanfaatan !== null && item.indeks_pemanfaatan !== undefined
                                                    ? item.indeks_pemanfaatan.toFixed(2)
                                                    : '-'}
                                            </td>
                                            <td className="px-3.5 py-3 text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={`font-mono text-[10px] font-bold whitespace-nowrap ${kelompokBadge.className}`}
                                                >
                                                    {kelompokBadge.label}
                                                </Badge>
                                            </td>
                                            <td className="px-3.5 py-3">
                                                <Badge
                                                    variant="outline"
                                                    className={`font-semibold text-[11px] whitespace-nowrap ${badge.className}`}
                                                >
                                                    {badge.label}
                                                </Badge>
                                            </td>
                                            <td className="px-3.5 py-3 text-slate-600 max-w-xs truncate dark:text-slate-400">
                                                {item.keterangan || '-'}
                                            </td>
                                            <td className="px-3.5 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditModal(item)}
                                                        className="h-8 w-8 p-0 text-slate-600 hover:bg-emerald-50 hover:text-[#006565] cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800"
                                                        title="Ubah Data"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openDeleteModal(item)}
                                                        className="h-8 w-8 p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                                                        title="Hapus Data"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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

            {/* Modal Dialog: Tambah Data IKP */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                            <Plus className="h-5 w-5 text-[#006565] dark:text-emerald-400" />
                            <span>Tambah Data IKP</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Masukkan data Nilai Indeks Ketahanan Pangan (IKP), Target Renstra, dan 3 Pilar Ketahanan Pangan.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="create-tahun" className="text-xs font-bold">
                                Tahun Evaluasi <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="create-tahun"
                                type="number"
                                min="2000"
                                max="2100"
                                value={formYear}
                                onChange={(e) => setFormYear(e.target.value)}
                                placeholder="Contoh: 2026"
                                required
                                className="rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="create-nilai" className="text-xs font-bold">
                                    Nilai IKP Komposit (0-100) <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="create-nilai"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={formNilaiIkp}
                                    onChange={(e) => updateKelompokAndStatusFromNilai(e.target.value)}
                                    placeholder="85.50"
                                    required
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create-target" className="text-xs font-bold">
                                    Target Renstra <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="create-target"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={formTargetRenstra}
                                    onChange={(e) => setFormTargetRenstra(e.target.value)}
                                    placeholder="84.00"
                                    required
                                    className="rounded-xl"
                                />
                            </div>
                        </div>

                        {/* 3 Pilar Indeks */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2 dark:border-slate-800 dark:bg-slate-850/50">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                3 Pilar Indeks Pangan
                            </div>
                            <div className="grid grid-cols-3 gap-2.5">
                                <div className="space-y-1">
                                    <Label htmlFor="create-ketersediaan" className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400">
                                        Ketersediaan
                                    </Label>
                                    <Input
                                        id="create-ketersediaan"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={formIndeksKetersediaan}
                                        onChange={(e) => setFormIndeksKetersediaan(e.target.value)}
                                        placeholder="88.50"
                                        className="rounded-xl h-8 text-xs bg-white dark:bg-slate-900"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="create-keterjangkauan" className="text-[11px] font-bold text-sky-800 dark:text-sky-400">
                                        Keterjangkauan
                                    </Label>
                                    <Input
                                        id="create-keterjangkauan"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={formIndeksKeterjangkauan}
                                        onChange={(e) => setFormIndeksKeterjangkauan(e.target.value)}
                                        placeholder="82.40"
                                        className="rounded-xl h-8 text-xs bg-white dark:bg-slate-900"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="create-pemanfaatan" className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
                                        Pemanfaatan
                                    </Label>
                                    <Input
                                        id="create-pemanfaatan"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={formIndeksPemanfaatan}
                                        onChange={(e) => setFormIndeksPemanfaatan(e.target.value)}
                                        placeholder="83.20"
                                        className="rounded-xl h-8 text-xs bg-white dark:bg-slate-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Kelompok IKP & Status Kerentanan */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="create-kelompok" className="text-xs font-bold">
                                    Kelompok IKP
                                </Label>
                                <select
                                    id="create-kelompok"
                                    value={formKelompokIkp}
                                    onChange={(e) => setFormKelompokIkp(e.target.value)}
                                    className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-slate-900"
                                >
                                    <option value="Kelompok 6">Kelompok 6 (Sangat Tahan)</option>
                                    <option value="Kelompok 5">Kelompok 5 (Tahan)</option>
                                    <option value="Kelompok 4">Kelompok 4 (Agak Tahan)</option>
                                    <option value="Kelompok 3">Kelompok 3 (Agak Rentan)</option>
                                    <option value="Kelompok 2">Kelompok 2 (Rentan)</option>
                                    <option value="Kelompok 1">Kelompok 1 (Sangat Rentan)</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create-status-kerentanan" className="text-xs font-bold">
                                    Status Kerentanan
                                </Label>
                                <select
                                    id="create-status-kerentanan"
                                    value={formStatusKerentanan}
                                    onChange={(e) => setFormStatusKerentanan(e.target.value)}
                                    className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-slate-900"
                                >
                                    <option value="Sangat Tahan">Sangat Tahan</option>
                                    <option value="Tahan">Tahan</option>
                                    <option value="Agak Tahan">Agak Tahan</option>
                                    <option value="Agak Rentan">Agak Rentan</option>
                                    <option value="Rentan">Rentan</option>
                                    <option value="Sangat Rentan">Sangat Rentan</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="create-keterangan" className="text-xs font-bold">
                                Keterangan / Catatan Evaluasi
                            </Label>
                            <Input
                                id="create-keterangan"
                                type="text"
                                value={formKeterangan}
                                onChange={(e) => setFormKeterangan(e.target.value)}
                                placeholder="Contoh: Evaluasi Bapanas - Kategori Sangat Tahan"
                                className="rounded-xl"
                            />
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateModalOpen(false)}
                                disabled={isSubmitting}
                                className="rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-xl bg-[#006565] text-white hover:bg-[#005555] cursor-pointer"
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Dialog: Edit Data IKP */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                            <Edit3 className="h-5 w-5 text-[#006565] dark:text-emerald-400" />
                            <span>Ubah Data IKP Tahun {selectedScore?.tahun}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Perbarui nilai capaian IKP, target Renstra, dan rincian indikator pilar.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-tahun" className="text-xs font-bold">
                                Tahun Evaluasi <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="edit-tahun"
                                type="number"
                                min="2000"
                                max="2100"
                                value={formYear}
                                onChange={(e) => setFormYear(e.target.value)}
                                required
                                className="rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-nilai" className="text-xs font-bold">
                                    Nilai IKP Komposit (0-100) <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="edit-nilai"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={formNilaiIkp}
                                    onChange={(e) => updateKelompokAndStatusFromNilai(e.target.value)}
                                    required
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-target" className="text-xs font-bold">
                                    Target Renstra <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="edit-target"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={formTargetRenstra}
                                    onChange={(e) => setFormTargetRenstra(e.target.value)}
                                    required
                                    className="rounded-xl"
                                />
                            </div>
                        </div>

                        {/* 3 Pilar Indeks */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2 dark:border-slate-800 dark:bg-slate-850/50">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                3 Pilar Indeks Pangan
                            </div>
                            <div className="grid grid-cols-3 gap-2.5">
                                <div className="space-y-1">
                                    <Label htmlFor="edit-ketersediaan" className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400">
                                        Ketersediaan
                                    </Label>
                                    <Input
                                        id="edit-ketersediaan"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={formIndeksKetersediaan}
                                        onChange={(e) => setFormIndeksKetersediaan(e.target.value)}
                                        placeholder="88.50"
                                        className="rounded-xl h-8 text-xs bg-white dark:bg-slate-900"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="edit-keterjangkauan" className="text-[11px] font-bold text-sky-800 dark:text-sky-400">
                                        Keterjangkauan
                                    </Label>
                                    <Input
                                        id="edit-keterjangkauan"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={formIndeksKeterjangkauan}
                                        onChange={(e) => setFormIndeksKeterjangkauan(e.target.value)}
                                        placeholder="82.40"
                                        className="rounded-xl h-8 text-xs bg-white dark:bg-slate-900"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="edit-pemanfaatan" className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
                                        Pemanfaatan
                                    </Label>
                                    <Input
                                        id="edit-pemanfaatan"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={formIndeksPemanfaatan}
                                        onChange={(e) => setFormIndeksPemanfaatan(e.target.value)}
                                        placeholder="83.20"
                                        className="rounded-xl h-8 text-xs bg-white dark:bg-slate-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Kelompok IKP & Status Kerentanan */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-kelompok" className="text-xs font-bold">
                                    Kelompok IKP
                                </Label>
                                <select
                                    id="edit-kelompok"
                                    value={formKelompokIkp}
                                    onChange={(e) => setFormKelompokIkp(e.target.value)}
                                    className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-slate-900"
                                >
                                    <option value="Kelompok 6">Kelompok 6 (Sangat Tahan)</option>
                                    <option value="Kelompok 5">Kelompok 5 (Tahan)</option>
                                    <option value="Kelompok 4">Kelompok 4 (Agak Tahan)</option>
                                    <option value="Kelompok 3">Kelompok 3 (Agak Rentan)</option>
                                    <option value="Kelompok 2">Kelompok 2 (Rentan)</option>
                                    <option value="Kelompok 1">Kelompok 1 (Sangat Rentan)</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-status-kerentanan" className="text-xs font-bold">
                                    Status Kerentanan
                                </Label>
                                <select
                                    id="edit-status-kerentanan"
                                    value={formStatusKerentanan}
                                    onChange={(e) => setFormStatusKerentanan(e.target.value)}
                                    className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-slate-900"
                                >
                                    <option value="Sangat Tahan">Sangat Tahan</option>
                                    <option value="Tahan">Tahan</option>
                                    <option value="Agak Tahan">Agak Tahan</option>
                                    <option value="Agak Rentan">Agak Rentan</option>
                                    <option value="Rentan">Rentan</option>
                                    <option value="Sangat Rentan">Sangat Rentan</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-keterangan" className="text-xs font-bold">
                                Keterangan / Catatan Evaluasi
                            </Label>
                            <Input
                                id="edit-keterangan"
                                type="text"
                                value={formKeterangan}
                                onChange={(e) => setFormKeterangan(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                                disabled={isSubmitting}
                                className="rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-xl bg-[#006565] text-white hover:bg-[#005555] cursor-pointer"
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Perbarui Data'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Dialog: Konfirmasi Hapus */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                            <Trash2 className="h-5 w-5" />
                            <span>Hapus Data IKP</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Apakah Anda yakin ingin menghapus data IKP Tahun{' '}
                            <span className="font-bold text-slate-900 dark:text-white">
                                {selectedScore?.tahun}
                            </span>
                            ? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-xl bg-rose-50/70 p-3 text-xs text-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                        <p>
                            Nilai IKP: <span className="font-bold">{selectedScore?.nilai_ikp}</span> | Target Renstra:{' '}
                            <span className="font-bold">{selectedScore?.target_renstra}</span>
                        </p>
                    </div>

                    <DialogFooter className="gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isSubmitting}
                            className="rounded-xl"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteSubmit}
                            disabled={isSubmitting}
                            className="rounded-xl bg-rose-600 hover:bg-rose-700 cursor-pointer"
                        >
                            {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Data'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

