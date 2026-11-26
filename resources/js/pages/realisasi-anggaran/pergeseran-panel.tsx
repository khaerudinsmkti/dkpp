import { router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeftRight,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    FileUp,
    History,
    Loader2,
    Plus,
    Save,
    Trash2,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface PergeseranRekeningRef {
    id: number;
    kode_rekening: string;
    uraian: string;
    jenis_pencairan: 'GU' | 'LS';
    pagu_anggaran: number;
    pagu_murni: number;
    selisih_perubahan: number;
    total_realisasi: number;
}

export interface PergeseranSubKegiatanRef {
    id: number;
    tahun_anggaran: number;
    kode_sub_kegiatan: string;
    nama_sub_kegiatan: string;
    total_anggaran: number;
    total_pagu_murni: number;
    selisih_perubahan: number;
    rekenings: PergeseranRekeningRef[];
}

export interface PergeseranItemLog {
    id: number;
    realisasi_sub_kegiatan_id: number;
    kode_sub_kegiatan: string;
    nama_sub_kegiatan: string;
    kode_rekening: string;
    uraian: string;
    pagu_sebelum: number;
    pagu_sesudah: number;
    selisih: number;
}

export interface PergeseranLog {
    id: number;
    tahun_anggaran: number;
    nama_tahap: string;
    jenis: string;
    tanggal: string;
    nomor_dokumen: string | null;
    keterangan: string | null;
    total_sebelum: number;
    total_sesudah: number;
    total_selisih: number;
    items: PergeseranItemLog[];
}

interface ManualRow {
    uid: string;
    sub_kegiatan_id: string;
    rekening_id: string;
    pagu_sesudah: string;
}

interface PdfDiffRow {
    uid: string;
    kode_rekening: string;
    uraian: string;
    jenis_pencairan: 'GU' | 'LS';
    pagu_sebelum: number;
    pagu_sesudah: string;
    sudah_cair: number;
    status: 'baru' | 'existing' | 'hilang';
}

interface Props {
    selectedYear: number;
    subKegiatans: PergeseranSubKegiatanRef[];
    pergeserans: PergeseranLog[];
}

function formatRupiah(val: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val || 0);
}

function formatSignedRupiah(val: number): string {
    if (val > 0) return `+${formatRupiah(val)}`;
    if (val < 0) return `-${formatRupiah(Math.abs(val))}`;
    return formatRupiah(0);
}

function getXsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export function PergeseranPanel({ selectedYear, subKegiatans, pergeserans }: Props) {
    const [mode, setMode] = useState<'manual' | 'pdf'>('manual');
    const todayStr = new Date().toISOString().slice(0, 10);

    // Metadata bersama
    const [namaTahap, setNamaTahap] = useState('Pergeseran 1');
    const [tanggal, setTanggal] = useState(todayStr);
    const [nomorDokumen, setNomorDokumen] = useState('');
    const [keterangan, setKeterangan] = useState('');

    // =========================================================================
    // MODE 1: PERGESERAN MANUAL (DALAM / ANTAR SUB KEGIATAN)
    // =========================================================================
    const [manualRows, setManualRows] = useState<ManualRow[]>(() => [
        {
            uid: `m-${Date.now()}-1`,
            sub_kegiatan_id: subKegiatans[0] ? String(subKegiatans[0].id) : '',
            rekening_id: '',
            pagu_sesudah: '',
        },
        {
            uid: `m-${Date.now()}-2`,
            sub_kegiatan_id: subKegiatans[0] ? String(subKegiatans[0].id) : '',
            rekening_id: '',
            pagu_sesudah: '',
        },
    ]);
    const [isSavingManual, setIsSavingManual] = useState(false);

    const rekeningLookup = useMemo(() => {
        const map = new Map<
            number,
            { sk: PergeseranSubKegiatanRef; rek: PergeseranRekeningRef }
        >();
        subKegiatans.forEach((sk) => {
            sk.rekenings.forEach((rek) => {
                map.set(rek.id, { sk, rek });
            });
        });
        return map;
    }, [subKegiatans]);

    const manualSummary = useMemo(() => {
        let totalSebelum = 0;
        let totalSesudah = 0;
        let hasError: string | null = null;
        let changedCount = 0;

        manualRows.forEach((row) => {
            const rekId = Number(row.rekening_id);
            if (!rekId) return;
            const found = rekeningLookup.get(rekId);
            if (!found) return;
            const sebelum = found.rek.pagu_anggaran;
            const sesudah =
                row.pagu_sesudah === '' ? sebelum : Math.max(0, Number(row.pagu_sesudah) || 0);
            totalSebelum += sebelum;
            totalSesudah += sesudah;

            if (sesudah + 0.01 < found.rek.total_realisasi && !hasError) {
                hasError = `Pagu baru rekening ${found.rek.kode_rekening} (${formatRupiah(sesudah)}) lebih kecil dari realisasi yang sudah cair (${formatRupiah(found.rek.total_realisasi)}).`;
            }
            if (Math.abs(sesudah - sebelum) >= 0.01) {
                changedCount += 1;
            }
        });

        return {
            totalSebelum,
            totalSesudah,
            netto: totalSesudah - totalSebelum,
            changedCount,
            hasError,
        };
    }, [manualRows, rekeningLookup]);

    const handleSubmitManual = (e: React.FormEvent) => {
        e.preventDefault();
        if (!namaTahap.trim()) {
            toast.error('Nama tahap pergeseran wajib diisi.');
            return;
        }
        if (manualSummary.hasError) {
            toast.error(manualSummary.hasError);
            return;
        }

        const validItems = manualRows
            .filter((r) => Number(r.rekening_id) > 0 && r.pagu_sesudah !== '')
            .map((r) => ({
                rekening_id: Number(r.rekening_id),
                pagu_sesudah: Math.max(0, Number(r.pagu_sesudah) || 0),
            }));

        if (validItems.length === 0 || manualSummary.changedCount === 0) {
            toast.error(
                'Pilih minimal 1 kode rekening dan masukkan Pagu Baru yang berbeda dari Pagu Saat Ini.'
            );
            return;
        }

        setIsSavingManual(true);
        router.post(
            '/realisasi-anggaran/pergeseran/manual',
            {
                tahun_anggaran: selectedYear,
                nama_tahap: namaTahap.trim(),
                tanggal,
                nomor_dokumen: nomorDokumen.trim() || null,
                keterangan: keterangan.trim() || null,
                items: validItems,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Pergeseran anggaran berhasil diterapkan & dicatat.');
                    setManualRows([
                        {
                            uid: `m-${Date.now()}-1`,
                            sub_kegiatan_id: subKegiatans[0] ? String(subKegiatans[0].id) : '',
                            rekening_id: '',
                            pagu_sesudah: '',
                        },
                    ]);
                    setNomorDokumen('');
                    setKeterangan('');
                },
                onError: (errors) => {
                    const firstErr = Object.values(errors)[0];
                    toast.error(
                        firstErr ? String(firstErr) : 'Gagal menyimpan pergeseran anggaran.'
                    );
                },
                onFinish: () => setIsSavingManual(false),
            }
        );
    };

    // =========================================================================
    // MODE 2: UPLOAD PDF RKA PERUBAHAN (PREVIEW DIFF OTOMATIS)
    // =========================================================================
    const [targetPdfSkId, setTargetPdfSkId] = useState<string>(
        subKegiatans[0] ? String(subKegiatans[0].id) : ''
    );
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isParsingPdf, setIsParsingPdf] = useState(false);
    const [isSavingPdf, setIsSavingPdf] = useState(false);
    const [pdfDiffRows, setPdfDiffRows] = useState<PdfDiffRow[]>([]);

    const targetPdfSk = useMemo(
        () => subKegiatans.find((sk) => String(sk.id) === String(targetPdfSkId)) || null,
        [subKegiatans, targetPdfSkId]
    );

    const handleParseRkaPerubahan = async () => {
        if (!targetPdfSk) {
            toast.error('Pilih Sub Kegiatan tujuan terlebih dahulu.');
            return;
        }
        if (!pdfFile) {
            toast.error('Pilih file PDF RKA Perubahan terlebih dahulu.');
            return;
        }

        const fd = new FormData();
        fd.append('rka_pdf', pdfFile);

        setIsParsingPdf(true);
        try {
            const res = await fetch('/realisasi-anggaran/parse-rka', {
                method: 'POST',
                headers: {
                    'X-XSRF-TOKEN': getXsrfToken(),
                    Accept: 'application/json',
                },
                body: fd,
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                toast.error(json.message || 'Gagal membaca file PDF RKA Perubahan.');
                return;
            }

            const parsedReks: Array<{
                kode_rekening: string;
                uraian: string;
                pagu_anggaran: number;
            }> = Array.isArray(json.data?.rekenings) ? json.data.rekenings : [];

            if (parsedReks.length === 0) {
                toast.warning(
                    'Tidak ditemukan daftar kode rekening belanja pada PDF tersebut.'
                );
                return;
            }

            const existingByCode = new Map<string, PergeseranRekeningRef>();
            targetPdfSk.rekenings.forEach((r) => {
                existingByCode.set(r.kode_rekening.trim(), r);
            });

            const seenCodes = new Set<string>();
            const diffList: PdfDiffRow[] = [];

            parsedReks.forEach((pr, idx) => {
                const code = (pr.kode_rekening || '').trim();
                if (!code) return;
                seenCodes.add(code);
                const ex = existingByCode.get(code);
                diffList.push({
                    uid: `diff-${Date.now()}-${idx}`,
                    kode_rekening: code,
                    uraian: pr.uraian || ex?.uraian || '',
                    jenis_pencairan: ex?.jenis_pencairan || 'GU',
                    pagu_sebelum: ex ? ex.pagu_anggaran : 0,
                    pagu_sesudah: String(Math.round(pr.pagu_anggaran || 0)),
                    sudah_cair: ex ? ex.total_realisasi : 0,
                    status: ex ? 'existing' : 'baru',
                });
            });

            // Rekening lama yang tidak muncul di PDF baru
            targetPdfSk.rekenings.forEach((ex, idx) => {
                const code = ex.kode_rekening.trim();
                if (!seenCodes.has(code)) {
                    diffList.push({
                        uid: `diff-missing-${Date.now()}-${idx}`,
                        kode_rekening: code,
                        uraian: ex.uraian,
                        jenis_pencairan: ex.jenis_pencairan,
                        pagu_sebelum: ex.pagu_anggaran,
                        pagu_sesudah: String(Math.round(ex.total_realisasi > 0 ? ex.total_realisasi : 0)),
                        sudah_cair: ex.total_realisasi,
                        status: 'hilang',
                    });
                }
            });

            setPdfDiffRows(diffList);
            if (namaTahap === 'Pergeseran 1') {
                setNamaTahap('RKA Perubahan (DPPA)');
            }
            toast.success(
                `Berhasil membaca ${parsedReks.length} kode rekening dari PDF RKA Perubahan. Silakan cek perbandingan di bawah.`
            );
        } catch {
            toast.error('Terjadi kesalahan jaringan saat membaca PDF RKA Perubahan.');
        } finally {
            setIsParsingPdf(false);
        }
    };

    const pdfDiffSummary = useMemo(() => {
        let totalSebelum = 0;
        let totalSesudah = 0;
        let changedCount = 0;
        let hasError: string | null = null;

        pdfDiffRows.forEach((r) => {
            const sesudah = Math.max(0, Number(r.pagu_sesudah) || 0);
            totalSebelum += r.pagu_sebelum;
            totalSesudah += sesudah;
            if (Math.abs(sesudah - r.pagu_sebelum) >= 0.01 || r.status === 'baru') {
                changedCount += 1;
            }
            if (sesudah + 0.01 < r.sudah_cair && !hasError) {
                hasError = `Pagu baru rekening ${r.kode_rekening} (${formatRupiah(sesudah)}) lebih kecil dari realisasi yang sudah cair (${formatRupiah(r.sudah_cair)}).`;
            }
        });

        return {
            totalSebelum,
            totalSesudah,
            netto: totalSesudah - totalSebelum,
            changedCount,
            hasError,
        };
    }, [pdfDiffRows]);

    const handleSubmitPdfPerubahan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetPdfSk) return;
        if (!namaTahap.trim()) {
            toast.error('Nama tahap perubahan wajib diisi.');
            return;
        }
        if (pdfDiffRows.length === 0 || pdfDiffSummary.changedCount === 0) {
            toast.error('Belum ada perubahan pagu untuk diterapkan.');
            return;
        }
        if (pdfDiffSummary.hasError) {
            toast.error(pdfDiffSummary.hasError);
            return;
        }

        const fd = new FormData();
        fd.append('realisasi_sub_kegiatan_id', String(targetPdfSk.id));
        fd.append('nama_tahap', namaTahap.trim());
        fd.append('tanggal', tanggal);
        fd.append('nomor_dokumen', nomorDokumen.trim());
        fd.append('keterangan', keterangan.trim());
        if (pdfFile) {
            fd.append('rka_pdf', pdfFile);
        }
        pdfDiffRows.forEach((r, idx) => {
            fd.append(`rekenings[${idx}][kode_rekening]`, r.kode_rekening.trim());
            fd.append(`rekenings[${idx}][uraian]`, r.uraian.trim());
            fd.append(`rekenings[${idx}][jenis_pencairan]`, r.jenis_pencairan);
            fd.append(
                `rekenings[${idx}][pagu_anggaran]`,
                String(Math.max(0, Number(r.pagu_sesudah) || 0))
            );
        });

        setIsSavingPdf(true);
        router.post('/realisasi-anggaran/pergeseran/pdf', fd, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('RKA Perubahan berhasil diterapkan & dicatat dalam riwayat.');
                setPdfFile(null);
                setPdfDiffRows([]);
                setNomorDokumen('');
                setKeterangan('');
            },
            onError: (errors) => {
                const firstErr = Object.values(errors)[0];
                toast.error(firstErr ? String(firstErr) : 'Gagal menerapkan RKA Perubahan.');
            },
            onFinish: () => setIsSavingPdf(false),
        });
    };

    // =========================================================================
    // RIWAYAT PERGESERAN
    // =========================================================================
    const [expandedLogIds, setExpandedLogIds] = useState<Record<number, boolean>>({});

    const handleDeleteLog = (log: PergeseranLog) => {
        if (
            !window.confirm(
                `Hapus catatan riwayat "${log.nama_tahap}"? (Catatan: ini hanya menghapus log riwayat, tidak mengembalikan nilai pagu aktif.)`
            )
        ) {
            return;
        }
        router.delete(`/realisasi-anggaran/pergeseran/${log.id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Catatan riwayat pergeseran dihapus.'),
        });
    };

    return (
        <div className="space-y-5">
            {/* PANEL INPUT PERGESERAN / RKA PERUBAHAN */}
            <Card className="overflow-hidden border-teal-200/80 shadow-xs">
                <CardHeader className="flex flex-col gap-3 border-b bg-neutral-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:bg-neutral-900/40">
                    <div className="inline-flex items-center gap-1 rounded-lg border bg-white p-1 dark:bg-neutral-950">
                        <button
                            type="button"
                            onClick={() => setMode('manual')}
                            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                                mode === 'manual'
                                    ? 'bg-[#006565] text-white shadow-xs'
                                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400'
                            }`}
                        >
                            <ArrowLeftRight className="size-3.5" />
                            Pergeseran Manual (Dalam / Antar Sub Kegiatan)
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('pdf')}
                            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                                mode === 'pdf'
                                    ? 'bg-[#006565] text-white shadow-xs'
                                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400'
                            }`}
                        >
                            <FileUp className="size-3.5" />
                            Upload PDF RKA Perubahan (SIPD-RI)
                        </button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-5 p-5">
                    {subKegiatans.length === 0 ? (
                        <div className="py-8 text-center text-xs text-neutral-500">
                            Belum ada Sub Kegiatan pada Tahun Anggaran {selectedYear}. Upload RKA
                            Murni terlebih dahulu sebelum melakukan pergeseran / RKA Perubahan.
                        </div>
                    ) : (
                        <>
                            {/* METADATA DOKUMEN PERGESERAN */}
                            <div className="grid grid-cols-1 gap-3.5 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 md:grid-cols-4 dark:border-neutral-800 dark:bg-neutral-900/40">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold">
                                        Nama Tahap / Perubahan *
                                    </Label>
                                    <Input
                                        value={namaTahap}
                                        onChange={(e) => setNamaTahap(e.target.value)}
                                        placeholder="Pergeseran 1 / RKA Perubahan"
                                        className="h-9 bg-white text-xs"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold">Tanggal *</Label>
                                    <Input
                                        type="date"
                                        value={tanggal}
                                        onChange={(e) => setTanggal(e.target.value)}
                                        className="h-9 bg-white text-xs"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold">
                                        Nomor SK / DPPA (Opsional)
                                    </Label>
                                    <Input
                                        value={nomorDokumen}
                                        onChange={(e) => setNomorDokumen(e.target.value)}
                                        placeholder="DPPA/A.1/..."
                                        className="h-9 bg-white text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold">
                                        Keterangan / Alasan Pergeseran
                                    </Label>
                                    <Input
                                        value={keterangan}
                                        onChange={(e) => setKeterangan(e.target.value)}
                                        placeholder="Efisiensi perjalanan dinas untuk GPM..."
                                        className="h-9 bg-white text-xs"
                                    />
                                </div>
                            </div>

                            {/* ========================================================= */}
                            {/* MODE 1: PERGESERAN MANUAL                                 */}
                            {/* ========================================================= */}
                            {mode === 'manual' && (
                                <form onSubmit={handleSubmitManual} className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="text-xs font-extrabold text-[#006565]">
                                            Daftar Kode Rekening yang Digeser (Bisa Lintas Sub
                                            Kegiatan)
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                setManualRows((prev) => [
                                                    ...prev,
                                                    {
                                                        uid: `m-${Date.now()}-${prev.length + 1}`,
                                                        sub_kegiatan_id: subKegiatans[0]
                                                            ? String(subKegiatans[0].id)
                                                            : '',
                                                        rekening_id: '',
                                                        pagu_sesudah: '',
                                                    },
                                                ])
                                            }
                                            className="h-8 gap-1 border-[#006565] text-xs font-bold text-[#006565]"
                                        >
                                            <Plus className="size-3.5" />
                                            Tambah Baris Rekening
                                        </Button>
                                    </div>

                                    {manualSummary.hasError && (
                                        <div className="flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                                            <AlertCircle className="size-4 shrink-0" />
                                            <span>{manualSummary.hasError}</span>
                                        </div>
                                    )}

                                    <div className="overflow-x-auto rounded-lg border">
                                        <table className="w-full border-collapse text-xs">
                                            <thead>
                                                <tr className="border-b bg-teal-50/80 text-[11px] font-extrabold text-[#005555]">
                                                    <th className="w-56 px-2.5 py-2 text-left">
                                                        Sub Kegiatan
                                                    </th>
                                                    <th className="min-w-[240px] px-2.5 py-2 text-left">
                                                        Kode Rekening &amp; Uraian
                                                    </th>
                                                    <th className="w-32 px-2.5 py-2 text-right">
                                                        Pagu Saat Ini
                                                    </th>
                                                    <th className="w-40 px-2.5 py-2 text-right">
                                                        Pagu Baru (Rp)
                                                    </th>
                                                    <th className="w-32 px-2.5 py-2 text-right">
                                                        Selisih (+/-)
                                                    </th>
                                                    <th className="w-10 px-2 py-2 text-center">
                                                        Hapus
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {manualRows.map((row, idx) => {
                                                    const selectedSk = subKegiatans.find(
                                                        (sk) =>
                                                            String(sk.id) ===
                                                            String(row.sub_kegiatan_id)
                                                    );
                                                    const selectedRek = selectedSk?.rekenings.find(
                                                        (r) =>
                                                            String(r.id) ===
                                                            String(row.rekening_id)
                                                    );
                                                    const sebelum = selectedRek
                                                        ? selectedRek.pagu_anggaran
                                                        : 0;
                                                    const sesudah =
                                                        row.pagu_sesudah === ''
                                                            ? sebelum
                                                            : Math.max(
                                                                  0,
                                                                  Number(row.pagu_sesudah) || 0
                                                              );
                                                    const selisih = selectedRek
                                                        ? sesudah - sebelum
                                                        : 0;

                                                    return (
                                                        <tr key={row.uid}>
                                                            <td className="p-1.5 align-top">
                                                                <Select
                                                                    value={row.sub_kegiatan_id}
                                                                    onValueChange={(v) =>
                                                                        setManualRows((prev) =>
                                                                            prev.map((r, i) =>
                                                                                i === idx
                                                                                    ? {
                                                                                          ...r,
                                                                                          sub_kegiatan_id:
                                                                                              v,
                                                                                          rekening_id:
                                                                                              '',
                                                                                          pagu_sesudah:
                                                                                              '',
                                                                                      }
                                                                                    : r
                                                                            )
                                                                        )
                                                                    }
                                                                >
                                                                    <SelectTrigger className="h-8 w-full min-w-0 text-left text-[11px] [&>span]:truncate">
                                                                        <SelectValue placeholder="Pilih Sub Kegiatan" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="max-w-[85vw]">
                                                                        {subKegiatans.map((sk) => (
                                                                            <SelectItem
                                                                                key={sk.id}
                                                                                value={String(
                                                                                    sk.id
                                                                                )}
                                                                            >
                                                                                {
                                                                                    sk.kode_sub_kegiatan
                                                                                }{' '}
                                                                                —{' '}
                                                                                {
                                                                                    sk.nama_sub_kegiatan
                                                                                }
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                            <td className="p-1.5 align-top">
                                                                <Select
                                                                    value={row.rekening_id}
                                                                    onValueChange={(v) => {
                                                                        const rk =
                                                                            selectedSk?.rekenings.find(
                                                                                (x) =>
                                                                                    String(x.id) ===
                                                                                    v
                                                                            );
                                                                        setManualRows((prev) =>
                                                                            prev.map((r, i) =>
                                                                                i === idx
                                                                                    ? {
                                                                                          ...r,
                                                                                          rekening_id:
                                                                                              v,
                                                                                          pagu_sesudah:
                                                                                              rk
                                                                                                  ? String(
                                                                                                        Math.round(
                                                                                                            rk.pagu_anggaran
                                                                                                        )
                                                                                                    )
                                                                                                  : '',
                                                                                      }
                                                                                    : r
                                                                            )
                                                                        );
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="h-8 w-full min-w-0 text-left text-[11px] [&>span]:truncate">
                                                                        <SelectValue placeholder="Pilih Kode Rekening" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="max-w-[85vw]">
                                                                        {(
                                                                            selectedSk?.rekenings ||
                                                                            []
                                                                        ).map((rk) => (
                                                                            <SelectItem
                                                                                key={rk.id}
                                                                                value={String(
                                                                                    rk.id
                                                                                )}
                                                                            >
                                                                                {rk.kode_rekening} —{' '}
                                                                                {rk.uraian}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                {selectedRek &&
                                                                    selectedRek.total_realisasi >
                                                                        0 && (
                                                                        <div className="mt-0.5 text-[10px] text-amber-700">
                                                                            Sudah cair:{' '}
                                                                            <strong>
                                                                                {formatRupiah(
                                                                                    selectedRek.total_realisasi
                                                                                )}
                                                                            </strong>
                                                                        </div>
                                                                    )}
                                                            </td>
                                                            <td className="px-2.5 py-2 text-right align-top font-mono font-bold whitespace-nowrap text-neutral-600">
                                                                {selectedRek
                                                                    ? formatRupiah(sebelum)
                                                                    : '-'}
                                                            </td>
                                                            <td className="p-1.5 align-top">
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    step={1000}
                                                                    disabled={!selectedRek}
                                                                    value={row.pagu_sesudah}
                                                                    onChange={(e) =>
                                                                        setManualRows((prev) =>
                                                                            prev.map((r, i) =>
                                                                                i === idx
                                                                                    ? {
                                                                                          ...r,
                                                                                          pagu_sesudah:
                                                                                              e
                                                                                                  .target
                                                                                                  .value,
                                                                                      }
                                                                                    : r
                                                                            )
                                                                        )
                                                                    }
                                                                    className="h-8 text-right font-mono text-xs"
                                                                />
                                                            </td>
                                                            <td
                                                                className={`px-2.5 py-2 text-right align-top font-mono font-extrabold whitespace-nowrap ${
                                                                    selisih > 0
                                                                        ? 'text-emerald-700'
                                                                        : selisih < 0
                                                                          ? 'text-rose-600'
                                                                          : 'text-neutral-400'
                                                                }`}
                                                            >
                                                                {selectedRek
                                                                    ? formatSignedRupiah(selisih)
                                                                    : '-'}
                                                            </td>
                                                            <td className="p-1.5 text-center align-top">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    disabled={
                                                                        manualRows.length <= 1
                                                                    }
                                                                    onClick={() =>
                                                                        setManualRows((prev) =>
                                                                            prev.filter(
                                                                                (_, i) => i !== idx
                                                                            )
                                                                        )
                                                                    }
                                                                    className="h-7 w-7 p-0 text-rose-600"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* RINGKASAN NETTO PERGESERAN */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50/40 px-4 py-3 text-xs">
                                        <div className="flex flex-wrap items-center gap-4 font-mono">
                                            <span>
                                                Total Sebelum:{' '}
                                                <strong>
                                                    {formatRupiah(manualSummary.totalSebelum)}
                                                </strong>
                                            </span>
                                            <span>
                                                Total Sesudah:{' '}
                                                <strong>
                                                    {formatRupiah(manualSummary.totalSesudah)}
                                                </strong>
                                            </span>
                                            <span>
                                                Netto Pergeseran:{' '}
                                                <Badge
                                                    className={`ml-1 font-mono text-[11px] font-extrabold ${
                                                        manualSummary.netto === 0
                                                            ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                                                            : manualSummary.netto > 0
                                                              ? 'bg-sky-600 text-white hover:bg-sky-600'
                                                              : 'bg-rose-600 text-white hover:bg-rose-600'
                                                    }`}
                                                >
                                                    {manualSummary.netto === 0
                                                        ? 'Seimbang (Rp 0)'
                                                        : formatSignedRupiah(manualSummary.netto)}
                                                </Badge>
                                            </span>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={
                                                isSavingManual || manualSummary.changedCount === 0
                                            }
                                            className="gap-1.5 bg-[#006565] text-xs font-bold text-white hover:bg-[#005252]"
                                        >
                                            <Save className="size-4" />
                                            {isSavingManual
                                                ? 'Menerapkan...'
                                                : 'Terapkan & Simpan Pergeseran'}
                                        </Button>
                                    </div>
                                </form>
                            )}

                            {/* ========================================================= */}
                            {/* MODE 2: UPLOAD PDF RKA PERUBAHAN                          */}
                            {/* ========================================================= */}
                            {mode === 'pdf' && (
                                <form onSubmit={handleSubmitPdfPerubahan} className="space-y-4">
                                    <div className="grid grid-cols-1 gap-3.5 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/20 p-4 md:grid-cols-12 md:items-end">
                                        <div className="space-y-1 md:col-span-5">
                                            <Label className="text-xs font-bold text-[#006565]">
                                                1. Pilih Sub Kegiatan yang Mengalami RKA Perubahan *
                                            </Label>
                                            <Select
                                                value={targetPdfSkId}
                                                onValueChange={(v) => {
                                                    setTargetPdfSkId(v);
                                                    setPdfDiffRows([]);
                                                }}
                                            >
                                                <SelectTrigger className="h-9 w-full min-w-0 bg-white text-left text-xs font-bold [&>span]:truncate">
                                                    <SelectValue placeholder="Pilih Sub Kegiatan" />
                                                </SelectTrigger>
                                                <SelectContent className="max-w-[90vw]">
                                                    {subKegiatans.map((sk) => (
                                                        <SelectItem
                                                            key={sk.id}
                                                            value={String(sk.id)}
                                                        >
                                                            {sk.kode_sub_kegiatan} —{' '}
                                                            {sk.nama_sub_kegiatan}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1 md:col-span-4">
                                            <Label className="text-xs font-bold text-[#006565]">
                                                2. Upload PDF RKA Perubahan (SIPD-RI) *
                                            </Label>
                                            <Input
                                                type="file"
                                                accept="application/pdf"
                                                onChange={(e) =>
                                                    setPdfFile(e.target.files?.[0] || null)
                                                }
                                                className="h-9 cursor-pointer bg-white text-xs"
                                            />
                                        </div>

                                        <div className="md:col-span-3">
                                            <Button
                                                type="button"
                                                disabled={!pdfFile || isParsingPdf || !targetPdfSk}
                                                onClick={handleParseRkaPerubahan}
                                                className="h-9 w-full gap-1.5 bg-[#006565] text-xs font-bold text-white hover:bg-[#005252]"
                                            >
                                                {isParsingPdf ? (
                                                    <>
                                                        <Loader2 className="size-3.5 animate-spin" />
                                                        Membaca PDF...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="size-3.5" />
                                                        Baca &amp; Bandingkan PDF
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {pdfDiffSummary.hasError && (
                                        <div className="flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                                            <AlertCircle className="size-4 shrink-0" />
                                            <span>{pdfDiffSummary.hasError}</span>
                                        </div>
                                    )}

                                    {pdfDiffRows.length > 0 && (
                                        <>
                                            <div className="overflow-x-auto rounded-lg border">
                                                <table className="w-full border-collapse text-xs">
                                                    <thead>
                                                        <tr className="border-b bg-teal-50/80 text-[11px] font-extrabold text-[#005555]">
                                                            <th className="px-3 py-2 text-left">
                                                                Kode Rekening
                                                            </th>
                                                            <th className="px-3 py-2 text-left">
                                                                Uraian
                                                            </th>
                                                            <th className="px-3 py-2 text-center">
                                                                Status
                                                            </th>
                                                            <th className="px-3 py-2 text-right">
                                                                Pagu Sebelum
                                                            </th>
                                                            <th className="w-40 px-3 py-2 text-right">
                                                                Pagu Perubahan (Rp)
                                                            </th>
                                                            <th className="px-3 py-2 text-right">
                                                                Selisih (+/-)
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {pdfDiffRows.map((row, idx) => {
                                                            const sesudah = Math.max(
                                                                0,
                                                                Number(row.pagu_sesudah) || 0
                                                            );
                                                            const selisih =
                                                                sesudah - row.pagu_sebelum;
                                                            return (
                                                                <tr key={row.uid}>
                                                                    <td className="px-3 py-2 font-mono font-bold whitespace-nowrap text-[#006565]">
                                                                        {row.kode_rekening}
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <div className="font-medium">
                                                                            {row.uraian}
                                                                        </div>
                                                                        {row.sudah_cair > 0 && (
                                                                            <div className="text-[10px] text-amber-700">
                                                                                Sudah cair:{' '}
                                                                                {formatRupiah(
                                                                                    row.sudah_cair
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center whitespace-nowrap">
                                                                        {row.status === 'baru' ? (
                                                                            <Badge className="bg-sky-100 text-[10px] font-bold text-sky-700 hover:bg-sky-100">
                                                                                Rekening Baru
                                                                            </Badge>
                                                                        ) : selisih > 0 ? (
                                                                            <Badge className="bg-emerald-100 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100">
                                                                                Bertambah
                                                                            </Badge>
                                                                        ) : selisih < 0 ? (
                                                                            <Badge className="bg-rose-100 text-[10px] font-bold text-rose-700 hover:bg-rose-100">
                                                                                Berkurang
                                                                            </Badge>
                                                                        ) : (
                                                                            <Badge className="bg-neutral-100 text-[10px] font-bold text-neutral-600 hover:bg-neutral-100">
                                                                                Tetap
                                                                            </Badge>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right font-mono whitespace-nowrap text-neutral-600">
                                                                        {formatRupiah(
                                                                            row.pagu_sebelum
                                                                        )}
                                                                    </td>
                                                                    <td className="p-1.5">
                                                                        <Input
                                                                            type="number"
                                                                            min={0}
                                                                            step={1000}
                                                                            value={row.pagu_sesudah}
                                                                            onChange={(e) =>
                                                                                setPdfDiffRows(
                                                                                    (prev) =>
                                                                                        prev.map(
                                                                                            (
                                                                                                r,
                                                                                                i
                                                                                            ) =>
                                                                                                i ===
                                                                                                idx
                                                                                                    ? {
                                                                                                          ...r,
                                                                                                          pagu_sesudah:
                                                                                                              e
                                                                                                                  .target
                                                                                                                  .value,
                                                                                                      }
                                                                                                    : r
                                                                                        )
                                                                                )
                                                                            }
                                                                            className="h-8 text-right font-mono text-xs"
                                                                        />
                                                                    </td>
                                                                    <td
                                                                        className={`px-3 py-2 text-right font-mono font-extrabold whitespace-nowrap ${
                                                                            selisih > 0
                                                                                ? 'text-emerald-700'
                                                                                : selisih < 0
                                                                                  ? 'text-rose-600'
                                                                                  : 'text-neutral-400'
                                                                        }`}
                                                                    >
                                                                        {formatSignedRupiah(
                                                                            selisih
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50/40 px-4 py-3 text-xs">
                                                <div className="flex flex-wrap items-center gap-4 font-mono">
                                                    <span>
                                                        Total Sebelum:{' '}
                                                        <strong>
                                                            {formatRupiah(
                                                                pdfDiffSummary.totalSebelum
                                                            )}
                                                        </strong>
                                                    </span>
                                                    <span>
                                                        Total Perubahan:{' '}
                                                        <strong>
                                                            {formatRupiah(
                                                                pdfDiffSummary.totalSesudah
                                                            )}
                                                        </strong>
                                                    </span>
                                                    <span>
                                                        Selisih:{' '}
                                                        <strong
                                                            className={
                                                                pdfDiffSummary.netto > 0
                                                                    ? 'text-emerald-700'
                                                                    : pdfDiffSummary.netto < 0
                                                                      ? 'text-rose-600'
                                                                      : ''
                                                            }
                                                        >
                                                            {formatSignedRupiah(
                                                                pdfDiffSummary.netto
                                                            )}
                                                        </strong>
                                                    </span>
                                                </div>

                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        isSavingPdf ||
                                                        pdfDiffSummary.changedCount === 0
                                                    }
                                                    className="gap-1.5 bg-[#006565] text-xs font-bold text-white hover:bg-[#005252]"
                                                >
                                                    <Save className="size-4" />
                                                    {isSavingPdf
                                                        ? 'Menerapkan...'
                                                        : 'Terapkan RKA Perubahan'}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </form>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* RIWAYAT PERGESERAN & RKA PERUBAHAN */}
            <Card>
                <CardHeader className="border-b py-3.5">
                    <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                        <History className="size-4 text-[#006565]" />
                        Riwayat Pergeseran &amp; RKA Perubahan (TA {selectedYear})
                        <Badge variant="outline" className="ml-1 text-[10px] font-bold">
                            {pergeserans.length} Catatan
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {pergeserans.length === 0 ? (
                        <div className="px-4 py-10 text-center text-xs text-neutral-400">
                            Belum ada riwayat pergeseran atau RKA Perubahan pada Tahun Anggaran{' '}
                            {selectedYear}.
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {pergeserans.map((log) => {
                                const isOpen = !!expandedLogIds[log.id];
                                return (
                                    <div key={log.id} className="p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setExpandedLogIds((prev) => ({
                                                        ...prev,
                                                        [log.id]: !prev[log.id],
                                                    }))
                                                }
                                                className="flex items-start gap-2 text-left"
                                            >
                                                <span className="mt-0.5 text-neutral-400">
                                                    {isOpen ? (
                                                        <ChevronDown className="size-4" />
                                                    ) : (
                                                        <ChevronRight className="size-4" />
                                                    )}
                                                </span>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-extrabold text-neutral-900 dark:text-neutral-100">
                                                            {log.nama_tahap}
                                                        </span>
                                                        <Badge
                                                            className={`text-[10px] font-bold ${
                                                                log.jenis === 'rka_perubahan_pdf'
                                                                    ? 'bg-sky-100 text-sky-700 hover:bg-sky-100'
                                                                    : 'bg-teal-100 text-teal-800 hover:bg-teal-100'
                                                            }`}
                                                        >
                                                            {log.jenis === 'rka_perubahan_pdf'
                                                                ? 'PDF RKA Perubahan'
                                                                : 'Pergeseran Manual'}
                                                        </Badge>
                                                        <span className="font-mono text-[11px] text-neutral-500">
                                                            {log.tanggal}
                                                        </span>
                                                        {log.nomor_dokumen && (
                                                            <span className="text-[11px] text-neutral-500">
                                                                • No: {log.nomor_dokumen}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {log.keterangan && (
                                                        <p className="mt-0.5 text-[11px] text-neutral-500">
                                                            {log.keterangan}
                                                        </p>
                                                    )}
                                                </div>
                                            </button>

                                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                                <div className="text-right font-mono">
                                                    <div className="text-[10px] text-neutral-500">
                                                        {log.items.length} rekening berubah
                                                    </div>
                                                    <div
                                                        className={`font-extrabold ${
                                                            log.total_selisih > 0
                                                                ? 'text-emerald-700'
                                                                : log.total_selisih < 0
                                                                  ? 'text-rose-600'
                                                                  : 'text-neutral-700'
                                                        }`}
                                                    >
                                                        Netto:{' '}
                                                        {formatSignedRupiah(log.total_selisih)}
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteLog(log)}
                                                    className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50"
                                                    title="Hapus catatan riwayat"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        {isOpen && (
                                            <div className="mt-3 ml-6 overflow-x-auto rounded-lg border">
                                                <table className="w-full border-collapse text-xs">
                                                    <thead>
                                                        <tr className="border-b bg-neutral-50 text-[10px] font-extrabold text-neutral-600 uppercase dark:bg-neutral-900">
                                                            <th className="px-3 py-2 text-left">
                                                                Sub Kegiatan
                                                            </th>
                                                            <th className="px-3 py-2 text-left">
                                                                Kode Rekening &amp; Uraian
                                                            </th>
                                                            <th className="px-3 py-2 text-right">
                                                                Pagu Sebelum
                                                            </th>
                                                            <th className="px-3 py-2 text-right">
                                                                Pagu Sesudah
                                                            </th>
                                                            <th className="px-3 py-2 text-right">
                                                                Selisih
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {log.items.map((it) => (
                                                            <tr key={it.id}>
                                                                <td className="px-3 py-2 text-[11px]">
                                                                    <div className="font-mono text-[10px] font-bold text-[#006565]">
                                                                        {it.kode_sub_kegiatan}
                                                                    </div>
                                                                    <div className="text-neutral-700 dark:text-neutral-300">
                                                                        {it.nama_sub_kegiatan}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2 text-[11px]">
                                                                    <div className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                                                                        {it.kode_rekening}
                                                                    </div>
                                                                    <div className="text-neutral-600 dark:text-neutral-400">
                                                                        {it.uraian}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2 text-right font-mono whitespace-nowrap">
                                                                    {formatRupiah(it.pagu_sebelum)}
                                                                </td>
                                                                <td className="px-3 py-2 text-right font-mono font-bold whitespace-nowrap">
                                                                    {formatRupiah(it.pagu_sesudah)}
                                                                </td>
                                                                <td
                                                                    className={`px-3 py-2 text-right font-mono font-extrabold whitespace-nowrap ${
                                                                        it.selisih > 0
                                                                            ? 'text-emerald-700'
                                                                            : 'text-rose-600'
                                                                    }`}
                                                                >
                                                                    {formatSignedRupiah(it.selisih)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
