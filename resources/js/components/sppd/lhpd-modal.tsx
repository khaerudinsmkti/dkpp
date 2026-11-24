import { router } from '@inertiajs/react';
import {
    ClipboardPaste,
    Copy,
    FileText,
    Plus,
    Save,
    Sparkles,
    Table2,
    Trash2,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export type LhpdType = 'paragraf' | 'tabel_harga' | 'tabel_custom';

export interface LhpdHargaRow {
    komoditas: string;
    p1: string;
    p2: string;
    het: string;
    ket: string;
    pasokan: string;
}

export interface LhpdCustomTableData {
    headers: string[];
    rows: string[][];
}

export interface LhpdTargetItem {
    id: number;
    batch_code: string;
    tanggal_berangkat_formatted: string;
    tujuan: string;
    nama_desa: string | null;
    nama_kecamatan: string;
    lhpd_type?: LhpdType | null;
    lhpd_content?: string | null;
    lhpd_table_data?: unknown;
    lhpd_keterangan?: string | null;
    has_lhpd?: boolean;
}

const DEFAULT_HARGA_ROWS: LhpdHargaRow[] = [
    { komoditas: 'Beras Premium', p1: '', p2: '', het: '14900', ket: '', pasokan: 'Aman' },
    { komoditas: 'Beras Medium', p1: '', p2: '', het: '12500', ket: '', pasokan: 'Aman' },
    { komoditas: 'Kedelai Biji Kering (impor)', p1: '', p2: '', het: '12000', ket: '', pasokan: 'Aman' },
    { komoditas: 'Bawang Merah', p1: '', p2: '', het: '41500', ket: '', pasokan: 'Aman' },
    { komoditas: 'Bawang Putih (Bonggol)', p1: '', p2: '', het: '32000', ket: '', pasokan: 'Aman' },
    { komoditas: 'Cabai Merah Keriting', p1: '', p2: '', het: '55000', ket: '', pasokan: 'Aman' },
    { komoditas: 'Cabai Rawit Merah', p1: '', p2: '', het: '57000', ket: '', pasokan: 'Aman' },
    { komoditas: 'Daging Sapi Murni', p1: '', p2: '', het: '140000', ket: '', pasokan: 'Aman' },
    { komoditas: 'Daging Ayam Ras', p1: '', p2: '', het: '40000', ket: '', pasokan: 'Aman' },
    { komoditas: 'Telur Ayam Ras', p1: '', p2: '', het: '30000', ket: '', pasokan: 'Aman' },
    { komoditas: 'Gula Konsumsi', p1: '', p2: '', het: '17500', ket: '', pasokan: 'Aman' },
    { komoditas: 'Minyak Goreng Kemasan', p1: '', p2: '', het: '11000', ket: '', pasokan: 'Aman' },
    { komoditas: 'Tepung Terigu Curah', p1: '', p2: '', het: '8000', ket: '', pasokan: 'Aman' },
    { komoditas: 'Minyak Goreng Curah', p1: '', p2: '', het: '14000', ket: '', pasokan: 'Aman' },
    { komoditas: 'Jagung Pipilan', p1: '', p2: '', het: '5000', ket: '', pasokan: 'Aman' },
    { komoditas: 'Ikan Kembung', p1: '', p2: '', het: '', ket: '', pasokan: 'Aman' },
    { komoditas: 'Ikan Tongkol', p1: '', p2: '', het: '', ket: '', pasokan: 'Aman' },
    { komoditas: 'Ikan Bandeng', p1: '', p2: '', het: '', ket: '', pasokan: 'Aman' },
    { komoditas: 'Garam Halus Beryodium', p1: '', p2: '', het: '', ket: '', pasokan: 'Aman' },
    { komoditas: 'Tepung Terigu Kemasan (Non Curah)', p1: '', p2: '', het: '', ket: '', pasokan: 'Aman' },
];

const DEFAULT_HARGA_KETERANGAN =
    'P1 = Pedagang Ke-1, P2 = Pedagang Ke-2, A = Nilai Rata-Rata';

function parseNum(v: string | number | null | undefined): number | null {
    if (v === null || v === undefined) return null;
    const cleaned = String(v).replace(/[^\d.-]/g, '');
    if (cleaned === '' || cleaned === '-') return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
}

function fmtIdNumber(n: number | null): string {
    if (n === null) return '-';
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
}

function normalizeHargaRows(raw: unknown): LhpdHargaRow[] {
    if (!Array.isArray(raw) || raw.length === 0) {
        return DEFAULT_HARGA_ROWS.map((r) => ({ ...r }));
    }
    return raw.map((item) => {
        const obj = (item || {}) as Record<string, unknown>;
        return {
            komoditas: String(obj.komoditas ?? ''),
            p1: obj.p1 !== null && obj.p1 !== undefined ? String(obj.p1) : '',
            p2: obj.p2 !== null && obj.p2 !== undefined ? String(obj.p2) : '',
            het: obj.het !== null && obj.het !== undefined ? String(obj.het) : '',
            ket: obj.ket !== null && obj.ket !== undefined ? String(obj.ket) : '',
            pasokan:
                obj.pasokan !== null && obj.pasokan !== undefined
                    ? String(obj.pasokan)
                    : 'Aman',
        };
    });
}

function normalizeCustomTable(raw: unknown): LhpdCustomTableData {
    if (
        raw &&
        typeof raw === 'object' &&
        Array.isArray((raw as LhpdCustomTableData).headers) &&
        Array.isArray((raw as LhpdCustomTableData).rows)
    ) {
        const d = raw as LhpdCustomTableData;
        return {
            headers: d.headers.map(String),
            rows: d.rows.map((r) => (Array.isArray(r) ? r.map(String) : [])),
        };
    }
    return {
        headers: ['No', 'Uraian', 'Hasil', 'Keterangan'],
        rows: [['1', '', '', '']],
    };
}

interface LhpdModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: LhpdTargetItem | null;
    copyableItems: LhpdTargetItem[];
}

export function LhpdModal({
    open,
    onOpenChange,
    item,
    copyableItems,
}: LhpdModalProps) {
    const [lhpdType, setLhpdType] = useState<LhpdType>('paragraf');
    const [content, setContent] = useState('');
    const [hargaRows, setHargaRows] = useState<LhpdHargaRow[]>(() =>
        DEFAULT_HARGA_ROWS.map((r) => ({ ...r }))
    );
    const [customTable, setCustomTable] = useState<LhpdCustomTableData>(() => ({
        headers: ['No', 'Uraian', 'Hasil', 'Keterangan'],
        rows: [['1', '', '', '']],
    }));
    const [keterangan, setKeterangan] = useState('');
    const [pasteBuffer, setPasteBuffer] = useState('');
    const [showPasteBox, setShowPasteBox] = useState(false);
    const [selectedCopyId, setSelectedCopyId] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!open || !item) return;

        const initialType: LhpdType =
            item.lhpd_type === 'tabel_harga' ||
            item.lhpd_type === 'tabel_custom' ||
            item.lhpd_type === 'paragraf'
                ? item.lhpd_type
                : 'paragraf';

        setLhpdType(initialType);
        setContent(item.lhpd_content || '');
        setHargaRows(
            initialType === 'tabel_harga'
                ? normalizeHargaRows(item.lhpd_table_data)
                : DEFAULT_HARGA_ROWS.map((r) => ({ ...r }))
        );
        setCustomTable(
            initialType === 'tabel_custom'
                ? normalizeCustomTable(item.lhpd_table_data)
                : {
                      headers: ['No', 'Uraian', 'Hasil', 'Keterangan'],
                      rows: [['1', '', '', '']],
                  }
        );
        setKeterangan(
            item.lhpd_keterangan ||
                (initialType === 'tabel_harga' ? DEFAULT_HARGA_KETERANGAN : '')
        );
        setPasteBuffer('');
        setShowPasteBox(false);
        setSelectedCopyId('');
    }, [open, item]);

    const availableCopySources = useMemo(() => {
        if (!item) return [];
        const filled = copyableItems.filter(
            (c) => c.id !== item.id && c.has_lhpd
        );
        // Prioritaskan perjalanan dari batch yang sama di paling atas
        return [...filled].sort((a, b) => {
            const aSame = a.batch_code === item.batch_code ? 0 : 1;
            const bSame = b.batch_code === item.batch_code ? 0 : 1;
            return aSame - bSame;
        });
    }, [copyableItems, item]);

    const handleCopyFromPrevious = (sourceIdStr: string) => {
        setSelectedCopyId(sourceIdStr);
        const src = availableCopySources.find(
            (s) => String(s.id) === sourceIdStr
        );
        if (!src || !src.lhpd_type) return;

        setLhpdType(src.lhpd_type);
        if (src.lhpd_type === 'paragraf') {
            setContent(src.lhpd_content || '');
        } else if (src.lhpd_type === 'tabel_harga') {
            setHargaRows(normalizeHargaRows(src.lhpd_table_data));
        } else {
            setCustomTable(normalizeCustomTable(src.lhpd_table_data));
        }
        setKeterangan(src.lhpd_keterangan || '');
        toast.success(
            `Isi LHPD berhasil disalin dari ${src.tanggal_berangkat_formatted} (${src.nama_desa || src.nama_kecamatan}).`
        );
    };

    const handleSwitchType = (nextType: LhpdType) => {
        setLhpdType(nextType);
        if (nextType === 'tabel_harga' && !keterangan.trim()) {
            setKeterangan(DEFAULT_HARGA_KETERANGAN);
        }
    };

    const handleApplyFsvaTemplate = () => {
        const desa = item?.nama_desa || 'Desa ...';
        const kec = item?.nama_kecamatan || '...';
        setContent(
            `1. Koordinasi dengan perangkat desa terkait data profil ${desa} Kecamatan ${kec}.\n` +
                `2. Untuk data sarana dan prasarana penyedia pangan dan jumlah tenaga kesehatan sebagai berikut:\n` +
                `a. Jumlah penduduk ... jiwa;\n` +
                `b. Luas wilayah ... Ha;\n` +
                `c. Jumlah sarana dan prasarana penyedia pangan (pasar, minimarket, toko, warung, restoran, dll) kurang lebih sebanyak ... unit;\n` +
                `d. Jumlah tenaga kesehatan sebanyak ... orang.`
        );
    };

    const handleApplyKerawananPanganTemplate = () => {
        const kec = item?.nama_kecamatan || '...';
        const prevYear = new Date().getFullYear() - 1;
        setContent(
            `1. Koordinasi dengan pihak Kecamatan ${kec} terkait desa-desa yang masuk kategori rentan rawan pangan;\n` +
                `2. Hasil analisis Peta Food Security and Vulnerability Atlas (FSVA) Tahun ${prevYear} Kecamatan ${kec} sebagai berikut :\n` +
                `a. Desa yang masuk prioritas 3 yaitu Desa ...\n` +
                `b. Desa yang masuk prioritas 4 yaitu Desa ...\n` +
                `c. Desa yang masuk prioritas 5 yaitu Desa ...\n` +
                `d. Desa yang masuk prioritas 6 yaitu Desa ...\n` +
                `e. Rata-rata penyebab masuk prioritas 3 dan 4 yaitu dikarenakan kurangnya jumlah sarana dan prasarana penyedia pangan di desa tersebut, serta masih banyaknya penduduk dengan tingkat kesejahteraan terendah.`
        );
    };

    const handleApplyGpmTemplate = () => {
        const desa = item?.nama_desa || 'Desa ...';
        const kec = item?.nama_kecamatan || '...';
        setContent(
            `1. Kegiatan Gerakan Pangan Murah (GPM) di ${desa} Kecamatan ${kec} di buka oleh Kabid Ketersediaan dan Distribusi Pangan dan dihadiri oleh staf Bidang Ketersediaan dan Distribusi Pangan, Camat, Sekretaris Kecamatan beserta Karyawan Kecamatan dan Kuwu ${desa} dan Perangkat Desa setempat.\n` +
                `2. Kegiatan Gerakan Pangan Murah (GPM) di ${desa} Kecamatan ${kec} dalam rangka menjaga stabilisasi pasokan dan harga pangan dan upaya pengendalian laju inflasi di daerah.\n` +
                `3. Kegiatan Gerakan Pangan Murah (GPM) di ${desa} Kecamatan ${kec} menyediakan bahan pangan pokok strategis berkualitas dengan harga terjangkau.\n` +
                `4. Komoditi yang dijual di acara GPM yaitu beras premium, beras SPHP, beras setra ramos, minyak goreng kita, minyak goreng rosebrand, gula pasir, tepung terigu, telor ayam ras, daging ayam ras, daging sapi, bawang merah, bawang putih, cabai merah keriting, cabai rawit merah, dan aneka sayuran.`
        );
    };

    const handleApplyExcelPasteHarga = () => {
        const lines = pasteBuffer
            .split(/\r?\n/)
            .map((l) => l.trimEnd())
            .filter((l) => l.trim() !== '');
        if (lines.length === 0) {
            toast.error('Tempel data dari Excel terlebih dahulu.');
            return;
        }

        const parsedCols = lines.map((l) => l.split('\t').map((c) => c.trim()));
        const maxCols = Math.max(...parsedCols.map((c) => c.length));

        if (maxCols <= 2) {
            // Hanya P1 dan P2 -> isi ke baris komoditas yang sudah ada
            setHargaRows((prev) =>
                prev.map((row, idx) => {
                    const cols = parsedCols[idx];
                    if (!cols) return row;
                    const p1Num = parseNum(cols[0]);
                    const p2Num = cols[1] !== undefined ? parseNum(cols[1]) : null;
                    return {
                        ...row,
                        p1: p1Num !== null ? String(p1Num) : row.p1,
                        p2: p2Num !== null ? String(p2Num) : row.p2,
                    };
                })
            );
            toast.success(
                `Berhasil mengisi P1 & P2 untuk ${Math.min(lines.length, hargaRows.length)} komoditas.`
            );
        } else {
            // Format penuh: Komoditas | P1 | P2 | (opsional HET) | (opsional Pasokan)
            const newRows: LhpdHargaRow[] = parsedCols.map((cols) => ({
                komoditas: cols[0] || '',
                p1: parseNum(cols[1]) !== null ? String(parseNum(cols[1])) : '',
                p2: parseNum(cols[2]) !== null ? String(parseNum(cols[2])) : '',
                het: parseNum(cols[3]) !== null ? String(parseNum(cols[3])) : '',
                ket: '',
                pasokan: cols[4] || 'Aman',
            }));
            setHargaRows(newRows);
            toast.success(
                `Berhasil memuat ${newRows.length} baris komoditas dari Excel.`
            );
        }

        setPasteBuffer('');
        setShowPasteBox(false);
    };

    const handleApplyExcelPasteCustom = () => {
        const lines = pasteBuffer
            .split(/\r?\n/)
            .map((l) => l.trimEnd())
            .filter((l) => l.trim() !== '');
        if (lines.length < 2) {
            toast.error(
                'Tempel minimal 2 baris dari Excel (baris pertama sebagai Header kolom, baris berikutnya data).'
            );
            return;
        }
        const matrix = lines.map((l) => l.split('\t').map((c) => c.trim()));
        const colCount = Math.max(...matrix.map((r) => r.length));
        const headers = Array.from(
            { length: colCount },
            (_, i) => matrix[0][i] || `Kolom ${i + 1}`
        );
        const rows = matrix.slice(1).map((r) =>
            Array.from({ length: colCount }, (_, i) => r[i] || '')
        );
        setCustomTable({ headers, rows });
        setPasteBuffer('');
        toast.success(
            `Tabel custom terbentuk (${headers.length} kolom, ${rows.length} baris).`
        );
    };

    const handleUpdateHargaRow = (
        idx: number,
        field: keyof LhpdHargaRow,
        value: string
    ) => {
        setHargaRows((prev) =>
            prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
        );
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!item) return;

        if (lhpdType === 'paragraf' && !content.trim()) {
            toast.error('Uraian hasil perjalanan dinas wajib diisi.');
            return;
        }

        let tablePayload: unknown = null;
        if (lhpdType === 'tabel_harga') {
            tablePayload = hargaRows
                .filter((r) => r.komoditas.trim() !== '')
                .map((r) => ({
                    komoditas: r.komoditas.trim(),
                    p1: parseNum(r.p1),
                    p2: parseNum(r.p2),
                    het: parseNum(r.het),
                    ket: r.ket.trim(),
                    pasokan: r.pasokan.trim() || 'Aman',
                }));
        } else if (lhpdType === 'tabel_custom') {
            tablePayload = customTable;
        }

        setIsSaving(true);
        router.put(
            `/sppd-dalam-kota/sppd/${item.id}/lhpd`,
            {
                lhpd_type: lhpdType,
                lhpd_content: lhpdType === 'paragraf' ? content.trim() : null,
                lhpd_table_data: tablePayload as never,
                lhpd_keterangan: keterangan.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Laporan Hasil Perjalanan Dinas (LHPD) berhasil disimpan.');
                    onOpenChange(false);
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    toast.error(
                        typeof first === 'string'
                            ? first
                            : 'Gagal menyimpan LHPD.'
                    );
                },
                onFinish: () => setIsSaving(false),
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[#006565]">
                        <FileText className="size-4.5" />
                        Isi Laporan Hasil Perjalanan Dinas (LHPD)
                    </DialogTitle>
                    {item && (
                        <DialogDescription className="text-xs">
                            <strong>{item.tujuan}</strong> &bull;{' '}
                            {item.nama_desa ? `${item.nama_desa}, ` : ''}
                            Kec. {item.nama_kecamatan} &bull;{' '}
                            {item.tanggal_berangkat_formatted}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <form onSubmit={handleSave} className="space-y-4">
                    {/* BARIS SALIN DARI PERJALANAN SEBELUMNYA */}
                    {availableCopySources.length > 0 && (
                        <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/60 dark:bg-amber-950/20">
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                                <Copy className="size-4 shrink-0 text-amber-600" />
                                <span>Salin dari LHP Perjalanan Sebelumnya:</span>
                            </div>
                            <div className="w-full sm:w-96">
                                <Select
                                    value={selectedCopyId}
                                    onValueChange={handleCopyFromPrevious}
                                >
                                    <SelectTrigger className="h-8 w-full min-w-0 overflow-hidden border-amber-300 bg-white text-xs [&>span]:truncate dark:bg-neutral-900">
                                        <SelectValue placeholder="-- Pilih perjalanan untuk disalin --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableCopySources.map((src) => (
                                            <SelectItem
                                                key={src.id}
                                                value={String(src.id)}
                                            >
                                                [{src.batch_code}]{' '}
                                                {src.tanggal_berangkat_formatted}{' '}
                                                — {src.nama_desa || src.nama_kecamatan}{' '}
                                                (
                                                {src.lhpd_type === 'paragraf'
                                                    ? 'Paragraf'
                                                    : 'Tabel'}
                                                )
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* PILIH FORMAT LHPD: PARAGRAF VS TABEL */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-extrabold text-[#006565]">
                            Pilih Format Laporan LHPD
                        </Label>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <button
                                type="button"
                                onClick={() => handleSwitchType('paragraf')}
                                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                                    lhpdType === 'paragraf'
                                        ? 'border-[#006565] bg-[#006565] text-white shadow-xs'
                                        : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900'
                                }`}
                            >
                                <FileText className="size-4 shrink-0" />
                                <div>
                                    <div className="text-xs font-extrabold">
                                        Paragraf / Poin
                                    </div>
                                    <div
                                        className={`text-[10px] ${
                                            lhpdType === 'paragraf'
                                                ? 'text-teal-100'
                                                : 'text-neutral-500'
                                        }`}
                                    >
                                        Uraian narasi &amp; poin (1., 2., a., b.)
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSwitchType('tabel_harga')}
                                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                                    lhpdType === 'tabel_harga'
                                        ? 'border-[#006565] bg-[#006565] text-white shadow-xs'
                                        : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900'
                                }`}
                            >
                                <Table2 className="size-4 shrink-0" />
                                <div>
                                    <div className="text-xs font-extrabold">
                                        Tabel Harga Pangan
                                    </div>
                                    <div
                                        className={`text-[10px] ${
                                            lhpdType === 'tabel_harga'
                                                ? 'text-teal-100'
                                                : 'text-neutral-500'
                                        }`}
                                    >
                                        20 komoditas (P1, P2, Rata2, HET otomatis)
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSwitchType('tabel_custom')}
                                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                                    lhpdType === 'tabel_custom'
                                        ? 'border-[#006565] bg-[#006565] text-white shadow-xs'
                                        : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900'
                                }`}
                            >
                                <ClipboardPaste className="size-4 shrink-0" />
                                <div>
                                    <div className="text-xs font-extrabold">
                                        Tabel Bebas (Paste Excel)
                                    </div>
                                    <div
                                        className={`text-[10px] ${
                                            lhpdType === 'tabel_custom'
                                                ? 'text-teal-100'
                                                : 'text-neutral-500'
                                        }`}
                                    >
                                        Copy–paste tabel bebas dari Excel
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* ================================================= */}
                    {/* MODE 1: PARAGRAF / POIN                           */}
                    {/* ================================================= */}
                    {lhpdType === 'paragraf' && (
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <Label className="text-xs font-bold">
                                    Isi Hasil Perjalanan Dinas *
                                </Label>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={handleApplyFsvaTemplate}
                                        className="h-7 gap-1.5 border-teal-300 text-[11px] font-bold text-[#006565] hover:bg-teal-50"
                                    >
                                        <Sparkles className="size-3" />
                                        Template Profil Desa
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={
                                            handleApplyKerawananPanganTemplate
                                        }
                                        className="h-7 gap-1.5 border-indigo-300 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50"
                                    >
                                        <Sparkles className="size-3" />
                                        Template Kerawanan Pangan (FSVA Kec)
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={handleApplyGpmTemplate}
                                        className="h-7 gap-1.5 border-emerald-300 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50"
                                    >
                                        <Sparkles className="size-3" />
                                        Template GPM
                                    </Button>
                                </div>
                            </div>
                            <textarea
                                rows={8}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={
                                    'Contoh:\n1. Koordinasi dengan perangkat desa terkait data profil Desa ...\n2. Untuk data sarana dan prasarana penyedia pangan:\na. Jumlah penduduk ... jiwa;\nb. Luas wilayah ... Ha;'
                                }
                                className="w-full rounded-xl border border-neutral-300 bg-white p-3 text-xs leading-relaxed focus:border-[#006565] focus:ring-1 focus:ring-[#006565] focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                            />
                            <p className="text-[11px] text-neutral-500">
                                Tips: Awali baris dengan <code>1.</code>,{' '}
                                <code>2.</code> untuk poin utama dan{' '}
                                <code>a.</code>, <code>b.</code> untuk sub-poin
                                agar otomatis menjorok rapi di PDF/Word.
                            </p>
                        </div>
                    )}

                    {/* ================================================= */}
                    {/* MODE 2: TABEL HARGA PANGAN (20 KOMODITAS)         */}
                    {/* ================================================= */}
                    {lhpdType === 'tabel_harga' && (
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="text-xs text-neutral-600 dark:text-neutral-400">
                                    Cukup isi <strong>P1</strong> &amp;{' '}
                                    <strong>P2</strong>, kolom{' '}
                                    <strong>Rata-Rata</strong>,{' '}
                                    <strong>Naik/Turun</strong>, &amp;{' '}
                                    <strong>Ket</strong> dihitung otomatis.
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            setShowPasteBox((v) => !v)
                                        }
                                        className="h-7 gap-1 border-emerald-300 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50"
                                    >
                                        <ClipboardPaste className="size-3" />
                                        Paste dari Excel
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            setHargaRows((prev) => [
                                                ...prev,
                                                {
                                                    komoditas: '',
                                                    p1: '',
                                                    p2: '',
                                                    het: '',
                                                    ket: '',
                                                    pasokan: 'Aman',
                                                },
                                            ])
                                        }
                                        className="h-7 gap-1 border-teal-300 text-[11px] font-bold text-[#006565]"
                                    >
                                        <Plus className="size-3" />
                                        Tambah Baris
                                    </Button>
                                </div>
                            </div>

                            {showPasteBox && (
                                <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                                    <Label className="text-xs font-bold text-emerald-800">
                                        Tempel (Ctrl+V) dari Excel — 2 kolom
                                        (P1 &amp; P2) atau 4–5 kolom (Komoditas,
                                        P1, P2, HET, Pasokan)
                                    </Label>
                                    <textarea
                                        rows={4}
                                        value={pasteBuffer}
                                        onChange={(e) =>
                                            setPasteBuffer(e.target.value)
                                        }
                                        placeholder={
                                            '15000\t14500\n13500\t13000\n...'
                                        }
                                        className="w-full rounded-lg border border-emerald-300 bg-white p-2 font-mono text-xs"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                setShowPasteBox(false)
                                            }
                                            className="h-7 text-xs"
                                        >
                                            Tutup
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleApplyExcelPasteHarga}
                                            className="h-7 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                                        >
                                            Terapkan ke Tabel
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="max-h-[360px] overflow-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                                <table className="w-full border-collapse text-left text-[11px]">
                                    <thead className="sticky top-0 z-10 bg-teal-50 text-[10px] font-extrabold text-[#005757] uppercase">
                                        <tr>
                                            <th className="w-8 border-b px-2 py-2 text-center">
                                                No
                                            </th>
                                            <th className="min-w-[160px] border-b px-2 py-2">
                                                Komoditas
                                            </th>
                                            <th className="w-24 border-b px-1.5 py-2 text-right">
                                                P1 (Rp)
                                            </th>
                                            <th className="w-24 border-b px-1.5 py-2 text-right">
                                                P2 (Rp)
                                            </th>
                                            <th className="w-20 border-b px-1.5 py-2 text-right">
                                                Rata2
                                            </th>
                                            <th className="w-24 border-b px-1.5 py-2 text-right">
                                                HET/HAP
                                            </th>
                                            <th className="w-20 border-b px-1.5 py-2 text-right">
                                                Selisih
                                            </th>
                                            <th className="w-18 border-b px-1.5 py-2 text-center">
                                                Ket
                                            </th>
                                            <th className="w-20 border-b px-1.5 py-2 text-center">
                                                Pasokan
                                            </th>
                                            <th className="w-8 border-b px-1 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {hargaRows.map((row, idx) => {
                                            const p1 = parseNum(row.p1);
                                            const p2 = parseNum(row.p2);
                                            const het = parseNum(row.het);
                                            const avg =
                                                p1 !== null && p2 !== null
                                                    ? (p1 + p2) / 2
                                                    : (p1 ?? p2);
                                            const diff =
                                                avg !== null
                                                    ? het !== null && het > 0
                                                        ? avg - het
                                                        : avg
                                                    : null;
                                            const autoKet =
                                                avg !== null &&
                                                het !== null &&
                                                het > 0
                                                    ? diff! > 0
                                                        ? 'Diatas'
                                                        : diff! < 0
                                                          ? 'Dibawah'
                                                          : 'Sesuai'
                                                    : '';

                                            return (
                                                <tr
                                                    key={idx}
                                                    className="hover:bg-neutral-50/70"
                                                >
                                                    <td className="px-2 py-1 text-center font-bold text-neutral-400">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-1.5 py-1">
                                                        <Input
                                                            value={row.komoditas}
                                                            onChange={(e) =>
                                                                handleUpdateHargaRow(
                                                                    idx,
                                                                    'komoditas',
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="h-7 text-[11px]"
                                                        />
                                                    </td>
                                                    <td className="px-1 py-1">
                                                        <Input
                                                            type="number"
                                                            value={row.p1}
                                                            onChange={(e) =>
                                                                handleUpdateHargaRow(
                                                                    idx,
                                                                    'p1',
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="h-7 px-1.5 text-right font-mono text-[11px]"
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="px-1 py-1">
                                                        <Input
                                                            type="number"
                                                            value={row.p2}
                                                            onChange={(e) =>
                                                                handleUpdateHargaRow(
                                                                    idx,
                                                                    'p2',
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="h-7 px-1.5 text-right font-mono text-[11px]"
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="px-1.5 py-1 text-right font-mono font-bold text-neutral-700">
                                                        {fmtIdNumber(avg)}
                                                    </td>
                                                    <td className="px-1 py-1">
                                                        <Input
                                                            type="number"
                                                            value={row.het}
                                                            onChange={(e) =>
                                                                handleUpdateHargaRow(
                                                                    idx,
                                                                    'het',
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="h-7 px-1.5 text-right font-mono text-[11px]"
                                                            placeholder="-"
                                                        />
                                                    </td>
                                                    <td
                                                        className={`px-1.5 py-1 text-right font-mono font-semibold ${
                                                            diff !== null &&
                                                            diff > 0
                                                                ? 'text-rose-600'
                                                                : diff !==
                                                                        null &&
                                                                    diff < 0
                                                                  ? 'text-emerald-700'
                                                                  : 'text-neutral-500'
                                                        }`}
                                                    >
                                                        {fmtIdNumber(diff)}
                                                    </td>
                                                    <td className="px-1 py-1 text-center">
                                                        {autoKet && (
                                                            <Badge
                                                                variant="outline"
                                                                className={`px-1.5 py-0 text-[9px] font-bold ${
                                                                    autoKet ===
                                                                    'Diatas'
                                                                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                                                                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                }`}
                                                            >
                                                                {autoKet}
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-1 py-1">
                                                        <Input
                                                            value={row.pasokan}
                                                            onChange={(e) =>
                                                                handleUpdateHargaRow(
                                                                    idx,
                                                                    'pasokan',
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="h-7 px-1.5 text-center text-[11px]"
                                                        />
                                                    </td>
                                                    <td className="px-1 py-1 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setHargaRows(
                                                                    (prev) =>
                                                                        prev.filter(
                                                                            (
                                                                                _,
                                                                                i
                                                                            ) =>
                                                                                i !==
                                                                                idx
                                                                        )
                                                                )
                                                            }
                                                            className="text-neutral-400 hover:text-rose-600"
                                                            title="Hapus baris"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ================================================= */}
                    {/* MODE 3: TABEL BEBAS (PASTE EXCEL)                 */}
                    {/* ================================================= */}
                    {lhpdType === 'tabel_custom' && (
                        <div className="space-y-3">
                            <div className="space-y-2 rounded-xl border border-teal-200 bg-teal-50/40 p-3">
                                <Label className="text-xs font-bold text-[#006565]">
                                    Copy–Paste Tabel Langsung dari Excel (Baris
                                    1 = Judul Kolom)
                                </Label>
                                <textarea
                                    rows={4}
                                    value={pasteBuffer}
                                    onChange={(e) =>
                                        setPasteBuffer(e.target.value)
                                    }
                                    placeholder={
                                        'No\tUraian\tHasil\tKeterangan\n1\tStok Beras\t12 Ton\tAman'
                                    }
                                    className="w-full rounded-lg border border-teal-300 bg-white p-2 font-mono text-xs"
                                />
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleApplyExcelPasteCustom}
                                        className="h-7 bg-[#006565] text-xs font-bold text-white hover:bg-[#005252]"
                                    >
                                        Bentuk Tabel dari Paste
                                    </Button>
                                </div>
                            </div>

                            <div className="max-h-[260px] overflow-auto rounded-xl border border-neutral-200">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead className="bg-teal-50 text-[11px] font-bold text-[#005757]">
                                        <tr>
                                            {customTable.headers.map(
                                                (h, cIdx) => (
                                                    <th
                                                        key={cIdx}
                                                        className="border-b px-2 py-1.5"
                                                    >
                                                        {h}
                                                    </th>
                                                )
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {customTable.rows.map((row, rIdx) => (
                                            <tr key={rIdx}>
                                                {row.map((cell, cIdx) => (
                                                    <td
                                                        key={cIdx}
                                                        className="px-2 py-1 text-[11px]"
                                                    >
                                                        {cell}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* KETERANGAN OPSIONAL */}
                    <div className="space-y-1">
                        <Label className="text-xs font-bold">
                            Keterangan Bawah (Opsional)
                        </Label>
                        <Input
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                            placeholder="Contoh: P1 = Pedagang Ke-1, P2 = Pedagang Ke-2, A = Nilai Rata-Rata"
                            className="h-9 text-xs"
                        />
                    </div>

                    <DialogFooter className="border-t pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="gap-1.5 bg-[#006565] text-xs font-extrabold text-white hover:bg-[#005252]"
                        >
                            <Save className="size-3.5" />
                            {isSaving ? 'Menyimpan...' : 'Simpan LHPD'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
