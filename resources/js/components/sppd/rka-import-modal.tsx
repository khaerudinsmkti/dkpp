import { router } from '@inertiajs/react';
import {
    CheckCircle2,
    FileUp,
    FolderKanban,
    Loader2,
    MapPin,
    RefreshCw,
    Sparkles,
    UserCheck,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface ParsedSubKegiatan {
    uid: string;
    selected: boolean;
    kode_sub_kegiatan: string;
    sub_kegiatan: string;
    nama_kegiatan: string;
    no_rekening: string;
    source_file?: string;
    exists_in_master?: boolean;
}

interface ParsedZonasiRate {
    uid: string;
    selected: boolean;
    zona: string;
    golongan: string;
    uang_saku: string;
    uang_saku_lama: number | null;
    is_changed: boolean;
}

interface ParsedPejabatKadin {
    nama: string;
    nip: string;
    jabatan: string;
}

interface RkaImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultYear?: number;
}

function getXsrfToken(): string {
    const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='));
    return match ? decodeURIComponent(match.split('=')[1] || '') : '';
}

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount || 0);
}

export function RkaImportModal({
    open,
    onOpenChange,
    defaultYear = new Date().getFullYear(),
}: RkaImportModalProps) {
    const [mode, setMode] = useState<'pdf' | 'realisasi'>('pdf');

    // Mode 1: Upload PDF RKA SIPD-RI (single atau multi-file)
    const [isParsing, setIsParsing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [detectedYear, setDetectedYear] = useState<number | null>(null);
    const [subKegiatans, setSubKegiatans] = useState<ParsedSubKegiatan[]>([]);
    const [zonasiRates, setZonasiRates] = useState<ParsedZonasiRate[]>([]);
    const [pejabatKadin, setPejabatKadin] = useState<ParsedPejabatKadin | null>(
        null
    );
    const [includePejabat, setIncludePejabat] = useState(false);

    // Mode 2: Sinkron dari Realisasi Anggaran (Murni / Perubahan)
    const [syncTahun, setSyncTahun] = useState(String(defaultYear));
    const [syncJenis, setSyncJenis] = useState<'murni' | 'perubahan'>('murni');
    const [isSyncing, setIsSyncing] = useState(false);

    const resetParsed = () => {
        setDetectedYear(null);
        setSubKegiatans([]);
        setZonasiRates([]);
        setPejabatKadin(null);
        setIncludePejabat(false);
    };

    const handleUploadPdfs = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const formData = new FormData();
        let validCount = 0;
        Array.from(files).forEach((file) => {
            if (file.name.toLowerCase().endsWith('.pdf')) {
                formData.append('pdfs[]', file);
                validCount++;
            }
        });

        if (validCount === 0) {
            toast.error('Mohon pilih minimal 1 file berformat PDF dari SIPD-RI.');
            return;
        }

        setIsParsing(true);
        try {
            const res = await fetch('/sppd-dalam-kota/parse-rka-pdf', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.message || 'Gagal membaca PDF RKA SIPD-RI.');
                return;
            }

            setDetectedYear(data.tahun_anggaran ?? null);
            const parsedSubs: ParsedSubKegiatan[] = (data.sub_kegiatans || []).map(
                (
                    sk: {
                        kode_sub_kegiatan: string;
                        sub_kegiatan: string;
                        nama_kegiatan: string;
                        no_rekening: string;
                        source_file?: string;
                        exists_in_master?: boolean;
                    },
                    idx: number
                ) => ({
                    uid: `sk-${idx}-${Date.now()}`,
                    selected: true,
                    kode_sub_kegiatan: sk.kode_sub_kegiatan,
                    sub_kegiatan: sk.sub_kegiatan,
                    nama_kegiatan: sk.nama_kegiatan,
                    no_rekening: sk.no_rekening,
                    source_file: sk.source_file,
                    exists_in_master: sk.exists_in_master,
                })
            );

            const parsedRates: ParsedZonasiRate[] = (data.zonasi_rates || []).map(
                (
                    zr: {
                        zona: string;
                        golongan: string;
                        uang_saku: number;
                        uang_saku_lama: number | null;
                        is_changed: boolean;
                    },
                    idx: number
                ) => ({
                    uid: `zr-${idx}-${Date.now()}`,
                    selected: true,
                    zona: zr.zona,
                    golongan: zr.golongan,
                    uang_saku: String(Math.round(Number(zr.uang_saku || 0))),
                    uang_saku_lama: zr.uang_saku_lama,
                    is_changed: Boolean(zr.is_changed),
                })
            );

            setSubKegiatans(parsedSubs);
            setZonasiRates(parsedRates);
            setPejabatKadin(data.pejabat_kadin || null);
            setIncludePejabat(false);

            toast.success(
                `Berhasil mengekstrak ${parsedSubs.length} Sub Kegiatan dan ${parsedRates.length} tarif zonasi dari ${validCount} file PDF.`
            );
        } catch {
            toast.error('Terjadi kesalahan jaringan saat membaca PDF RKA.');
        } finally {
            setIsParsing(false);
        }
    };

    const handleApplyImport = () => {
        const selectedSubs = subKegiatans.filter(
            (s) => s.selected && s.kode_sub_kegiatan.trim() && s.sub_kegiatan.trim()
        );
        const selectedRates = zonasiRates.filter(
            (z) => z.selected && Number(z.uang_saku) > 0
        );

        if (
            selectedSubs.length === 0 &&
            selectedRates.length === 0 &&
            !(includePejabat && pejabatKadin)
        ) {
            toast.error('Centang minimal 1 data untuk diimpor ke Master SPPD.');
            return;
        }

        setIsSaving(true);
        router.post(
            '/sppd-dalam-kota/import-rka',
            {
                sub_kegiatans: selectedSubs.map((s) => ({
                    kode_sub_kegiatan: s.kode_sub_kegiatan.trim(),
                    sub_kegiatan: s.sub_kegiatan.trim(),
                    nama_kegiatan: s.nama_kegiatan.trim(),
                    no_rekening: s.no_rekening.trim() || '5.1.02.04.01.0003',
                })),
                zonasi_rates: selectedRates.map((z) => ({
                    zona: z.zona,
                    golongan: z.golongan,
                    uang_saku: Number(z.uang_saku) || 0,
                })),
                pejabat_kadin:
                    includePejabat && pejabatKadin ? pejabatKadin : null,
            } as never,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Master Data SPPD berhasil diimpor dari PDF RKA.');
                    resetParsed();
                    onOpenChange(false);
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(
                        first ? String(first) : 'Gagal menyimpan hasil impor RKA.'
                    );
                },
                onFinish: () => setIsSaving(false),
            }
        );
    };

    const handleSyncFromRealisasi = () => {
        setIsSyncing(true);
        router.post(
            '/sppd-dalam-kota/sync-sub-kegiatan-realisasi',
            {
                tahun_anggaran: Number(syncTahun) || defaultYear,
                jenis_anggaran: syncJenis,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `Sub Kegiatan berhasil ditarik dari ${syncJenis === 'perubahan' ? 'Anggaran Perubahan' : 'Anggaran Murni'} TA ${syncTahun}.`
                    );
                    onOpenChange(false);
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(
                        first
                            ? String(first)
                            : 'Gagal menarik data dari Realisasi Anggaran.'
                    );
                },
                onFinish: () => setIsSyncing(false),
            }
        );
    };

    const selectedSubCount = subKegiatans.filter((s) => s.selected).length;
    const selectedRateCount = zonasiRates.filter((z) => z.selected).length;
    const hasParsedData =
        subKegiatans.length > 0 || zonasiRates.length > 0 || Boolean(pejabatKadin);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[#006565]">
                        <FileUp className="size-5" />
                        Impor Master Data SPPD dari PDF RKA SIPD-RI
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Tarik otomatis Sub Kegiatan, No. Rekening, Update Tarif Zonasi I–III per Golongan, hingga Pejabat Kepala Dinas tanpa ketik manual.
                    </DialogDescription>
                </DialogHeader>

                {/* MODE SWITCHER */}
                <div className="inline-flex w-fit rounded-lg border bg-neutral-100 p-0.5">
                    <button
                        type="button"
                        onClick={() => setMode('pdf')}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                            mode === 'pdf'
                                ? 'bg-[#006565] text-white shadow-2xs'
                                : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                    >
                        <FileUp className="size-3.5" />
                        Upload PDF RKA SIPD-RI
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('realisasi')}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                            mode === 'realisasi'
                                ? 'bg-indigo-700 text-white shadow-2xs'
                                : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                    >
                        <RefreshCw className="size-3.5" />
                        Tarik dari Realisasi Anggaran
                    </button>
                </div>

                {mode === 'pdf' ? (
                    <div className="space-y-4">
                        <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/40 px-4 py-5 text-center transition-colors hover:bg-teal-50">
                            {isParsing ? (
                                <>
                                    <Loader2 className="size-6 animate-spin text-[#006565]" />
                                    <span className="text-xs font-bold text-[#006565]">
                                        Membaca &amp; mengekstrak file PDF RKA SIPD-RI...
                                    </span>
                                </>
                            ) : (
                                <>
                                    <FileUp className="size-6 text-[#006565]" />
                                    <span className="text-xs font-bold text-neutral-800">
                                        Klik untuk memilih 1 atau beberapa file PDF RKA-BELANJA SKPD (SIPD-RI)
                                    </span>
                                    <span className="text-[11px] text-neutral-500">
                                        Otomatis mengekstrak Sub Kegiatan, No. Rekening Perjalanan Dinas, Tarif Zonasi I/II/III, dan Pejabat Kepala Dinas
                                    </span>
                                </>
                            )}
                            <input
                                type="file"
                                multiple
                                accept="application/pdf,.pdf"
                                disabled={isParsing}
                                className="hidden"
                                onChange={(e) => {
                                    void handleUploadPdfs(e.target.files);
                                    e.target.value = '';
                                }}
                            />
                        </label>

                        {hasParsedData && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50/70 px-3 py-2 text-xs">
                                    <div className="flex flex-wrap items-center gap-2 font-bold text-[#006565]">
                                        <Sparkles className="size-4" />
                                        <span>Hasil Ekstraksi PDF RKA SIPD-RI</span>
                                        {detectedYear && (
                                            <Badge className="bg-[#006565] text-[10px] text-white">
                                                TA {detectedYear}
                                            </Badge>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={resetParsed}
                                        className="rounded p-1 text-neutral-500 hover:bg-white hover:text-neutral-800"
                                        title="Reset hasil ekstraksi"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </div>

                                {/* 1. PREVIEW SUB KEGIATAN */}
                                {subKegiatans.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-xs font-extrabold text-neutral-800">
                                                <FolderKanban className="size-4 text-[#006565]" />
                                                Master Sub Kegiatan ({selectedSubCount}/
                                                {subKegiatans.length} dipilih)
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {subKegiatans.map((sk) => (
                                                <div
                                                    key={sk.uid}
                                                    className={`rounded-xl border p-3 text-xs transition-opacity ${
                                                        sk.selected
                                                            ? 'border-teal-200 bg-white'
                                                            : 'border-neutral-200 bg-neutral-50 opacity-55'
                                                    }`}
                                                >
                                                    <div className="mb-2 flex items-center justify-between gap-2">
                                                        <label className="flex cursor-pointer items-center gap-2 font-bold text-[#006565]">
                                                            <Checkbox
                                                                checked={sk.selected}
                                                                onCheckedChange={(v) =>
                                                                    setSubKegiatans((prev) =>
                                                                        prev.map((row) =>
                                                                            row.uid === sk.uid
                                                                                ? {
                                                                                      ...row,
                                                                                      selected: Boolean(v),
                                                                                  }
                                                                                : row
                                                                        )
                                                                    )
                                                                }
                                                            />
                                                            <span className="font-mono">
                                                                {sk.kode_sub_kegiatan}
                                                            </span>
                                                        </label>
                                                        <div className="flex items-center gap-1.5">
                                                            {sk.source_file && (
                                                                <span className="max-w-[180px] truncate text-[10px] text-neutral-400">
                                                                    {sk.source_file}
                                                                </span>
                                                            )}
                                                            {sk.exists_in_master ? (
                                                                <Badge className="bg-amber-100 text-[10px] text-amber-800 hover:bg-amber-100">
                                                                    Update
                                                                </Badge>
                                                            ) : (
                                                                <Badge className="bg-emerald-100 text-[10px] text-emerald-800 hover:bg-emerald-100">
                                                                    Baru
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                                                        <div className="space-y-1 sm:col-span-4">
                                                            <Label className="text-[10px] font-bold text-neutral-500">
                                                                No. Rekening Perjalanan Dinas
                                                            </Label>
                                                            <Input
                                                                value={sk.no_rekening}
                                                                onChange={(e) =>
                                                                    setSubKegiatans((prev) =>
                                                                        prev.map((row) =>
                                                                            row.uid === sk.uid
                                                                                ? {
                                                                                      ...row,
                                                                                      no_rekening:
                                                                                          e.target.value,
                                                                                  }
                                                                                : row
                                                                        )
                                                                    )
                                                                }
                                                                className="h-8 font-mono text-xs"
                                                            />
                                                        </div>
                                                        <div className="space-y-1 sm:col-span-8">
                                                            <Label className="text-[10px] font-bold text-neutral-500">
                                                                Nama Sub Kegiatan
                                                            </Label>
                                                            <Input
                                                                value={sk.sub_kegiatan}
                                                                onChange={(e) =>
                                                                    setSubKegiatans((prev) =>
                                                                        prev.map((row) =>
                                                                            row.uid === sk.uid
                                                                                ? {
                                                                                      ...row,
                                                                                      sub_kegiatan:
                                                                                          e.target.value,
                                                                                  }
                                                                                : row
                                                                        )
                                                                    )
                                                                }
                                                                className="h-8 text-xs"
                                                            />
                                                        </div>
                                                        <div className="space-y-1 sm:col-span-12">
                                                            <Label className="text-[10px] font-bold text-neutral-500">
                                                                Nama Kegiatan
                                                            </Label>
                                                            <Input
                                                                value={sk.nama_kegiatan}
                                                                onChange={(e) =>
                                                                    setSubKegiatans((prev) =>
                                                                        prev.map((row) =>
                                                                            row.uid === sk.uid
                                                                                ? {
                                                                                      ...row,
                                                                                      nama_kegiatan:
                                                                                          e.target.value,
                                                                                  }
                                                                                : row
                                                                        )
                                                                    )
                                                                }
                                                                className="h-8 text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 2. PREVIEW UPDATE TARIF ZONASI */}
                                {zonasiRates.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-xs font-extrabold text-neutral-800">
                                                <MapPin className="size-4 text-[#006565]" />
                                                Update Massal Tarif Uang Saku Zonasi ({selectedRateCount}/
                                                {zonasiRates.length} dipilih)
                                            </div>
                                            <span className="text-[10px] text-neutral-500">
                                                Memperbarui tarif seluruh kecamatan sesuai Zona &amp; Golongan
                                            </span>
                                        </div>
                                        <div className="max-h-[220px] overflow-auto rounded-xl border">
                                            <table className="w-full border-collapse text-left text-xs">
                                                <thead className="sticky top-0 bg-neutral-100 text-[10px] font-bold uppercase text-neutral-600">
                                                    <tr>
                                                        <th className="w-9 px-2 py-1.5 text-center">
                                                            <Checkbox
                                                                checked={
                                                                    zonasiRates.length > 0 &&
                                                                    zonasiRates.every((z) => z.selected)
                                                                }
                                                                onCheckedChange={(val) =>
                                                                    setZonasiRates((prev) =>
                                                                        prev.map((z) => ({
                                                                            ...z,
                                                                            selected: Boolean(val),
                                                                        }))
                                                                    )
                                                                }
                                                            />
                                                        </th>
                                                        <th className="px-2 py-1.5">Zona</th>
                                                        <th className="px-2 py-1.5">Golongan</th>
                                                        <th className="px-2 py-1.5 text-right">
                                                            Tarif Lama
                                                        </th>
                                                        <th className="w-36 px-2 py-1.5 text-right">
                                                            Tarif Baru (Rp)
                                                        </th>
                                                        <th className="w-20 px-2 py-1.5 text-center">
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-neutral-100">
                                                    {zonasiRates.map((zr) => (
                                                        <tr
                                                            key={zr.uid}
                                                            className={
                                                                zr.selected
                                                                    ? 'bg-white'
                                                                    : 'bg-neutral-50 opacity-50'
                                                            }
                                                        >
                                                            <td className="px-2 py-1.5 text-center">
                                                                <Checkbox
                                                                    checked={zr.selected}
                                                                    onCheckedChange={(val) =>
                                                                        setZonasiRates((prev) =>
                                                                            prev.map((row) =>
                                                                                row.uid === zr.uid
                                                                                    ? {
                                                                                          ...row,
                                                                                          selected:
                                                                                              Boolean(val),
                                                                                      }
                                                                                    : row
                                                                            )
                                                                        )
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="px-2 py-1.5 font-bold text-[#006565]">
                                                                {zr.zona}
                                                            </td>
                                                            <td className="px-2 py-1.5">
                                                                {zr.golongan}
                                                            </td>
                                                            <td className="px-2 py-1.5 text-right font-mono text-neutral-500">
                                                                {zr.uang_saku_lama !== null
                                                                    ? formatRupiah(zr.uang_saku_lama)
                                                                    : '-'}
                                                            </td>
                                                            <td className="px-2 py-1">
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    value={zr.uang_saku}
                                                                    onChange={(e) =>
                                                                        setZonasiRates((prev) =>
                                                                            prev.map((row) =>
                                                                                row.uid === zr.uid
                                                                                    ? {
                                                                                          ...row,
                                                                                          uang_saku:
                                                                                              e.target.value,
                                                                                      }
                                                                                    : row
                                                                            )
                                                                        )
                                                                    }
                                                                    className="h-7 text-right font-mono text-xs"
                                                                />
                                                            </td>
                                                            <td className="px-2 py-1.5 text-center">
                                                                {zr.is_changed ? (
                                                                    <Badge className="bg-amber-100 text-[10px] text-amber-800 hover:bg-amber-100">
                                                                        Berubah
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="bg-neutral-100 text-[10px] text-neutral-600 hover:bg-neutral-100">
                                                                        Sama
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* 3. OPSIONAL: PEJABAT KEPALA DINAS */}
                                {pejabatKadin && (
                                    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-neutral-200 bg-neutral-50/80 p-3 text-xs">
                                        <Checkbox
                                            checked={includePejabat}
                                            onCheckedChange={(v) =>
                                                setIncludePejabat(Boolean(v))
                                            }
                                            className="mt-0.5"
                                        />
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1.5 font-bold text-neutral-800">
                                                <UserCheck className="size-3.5 text-[#006565]" />
                                                Ikut simpan / perbarui Pejabat Kepala Dinas (Opsional)
                                            </div>
                                            <div className="text-[11px] text-neutral-600">
                                                <strong>{pejabatKadin.nama}</strong> &bull; NIP.{' '}
                                                <span className="font-mono">{pejabatKadin.nip}</span>{' '}
                                                &bull; {pejabatKadin.jabatan}
                                            </div>
                                        </div>
                                    </label>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* MODE 2: TARIK DARI MODUL REALISASI ANGGARAN */
                    <div className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
                        <div className="space-y-1">
                            <div className="text-sm font-extrabold text-indigo-950">
                                Tarik Master Sub Kegiatan dari Modul Realisasi Anggaran
                            </div>
                            <p className="text-xs text-neutral-600">
                                Jika PDF RKA SIPD-RI sudah pernah diupload di menu <strong>Anggaran Murni</strong> atau <strong>Anggaran Perubahan</strong>, Anda tidak perlu mengupload PDF lagi — tarik langsung seluruh Sub Kegiatan ke Master SPPD dengan 1 klik.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">
                                    Sumber Anggaran
                                </Label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setSyncJenis('murni')}
                                        className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                                            syncJenis === 'murni'
                                                ? 'border-[#006565] bg-[#006565] text-white'
                                                : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                                        }`}
                                    >
                                        Anggaran Murni
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSyncJenis('perubahan')}
                                        className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                                            syncJenis === 'perubahan'
                                                ? 'border-indigo-700 bg-indigo-700 text-white'
                                                : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                                        }`}
                                    >
                                        Anggaran Perubahan
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold">
                                    Tahun Anggaran
                                </Label>
                                <Input
                                    type="number"
                                    value={syncTahun}
                                    onChange={(e) => setSyncTahun(e.target.value)}
                                    className="h-9 bg-white font-mono text-xs"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="button"
                                disabled={isSyncing}
                                onClick={handleSyncFromRealisasi}
                                className="gap-1.5 bg-indigo-700 text-xs font-bold text-white hover:bg-indigo-800"
                            >
                                <RefreshCw
                                    className={`size-3.5 ${isSyncing ? 'animate-spin' : ''}`}
                                />
                                Tarik Semua Sub Kegiatan dari{' '}
                                {syncJenis === 'perubahan'
                                    ? 'Anggaran Perubahan'
                                    : 'Anggaran Murni'}{' '}
                                TA {syncTahun}
                            </Button>
                        </div>
                    </div>
                )}

                <DialogFooter className="border-t pt-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="text-xs"
                    >
                        Tutup
                    </Button>
                    {mode === 'pdf' && hasParsedData && (
                        <Button
                            type="button"
                            disabled={isSaving}
                            onClick={handleApplyImport}
                            className="gap-1.5 bg-[#006565] text-xs font-extrabold text-white hover:bg-[#005252]"
                        >
                            {isSaving ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <CheckCircle2 className="size-3.5" />
                            )}
                            Terapkan &amp; Simpan ke Master SPPD
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
