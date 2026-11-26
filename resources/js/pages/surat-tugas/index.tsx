import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Award,
    Calendar,
    CheckCircle2,
    ChevronUp,
    Download,
    Edit3,
    Eye,
    FileCheck2,
    FileText,
    Image as ImageIcon,
    MapPin,
    Move,
    PenTool,
    Plus,
    RotateCcw,
    Save,
    Search,
    Trash2,
    Upload,
    UserPlus,
    Users,
    X,
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
import type { BreadcrumbItem } from '@/types';

const DEFAULT_DASAR_TANPA_SURAT =
    '1. Undang-Undang Nomor 18 Tahun 2012 tentang Pangan; 2. PP No.17 Tahun 2015 tentang Ketahanan Pangan dan Gizi.';

interface PegawaiItem {
    id: number;
    nama: string;
    nip: string | null;
    pangkat: string | null;
    golongan: string | null;
    golongan_rank?: number;
    jabatan: string | null;
    is_active: boolean;
}

interface KepalaDinasItem {
    id: number;
    nama: string;
    nip: string | null;
    pangkat: string | null;
    golongan: string | null;
    jabatan: string | null;
    is_active: boolean;
}

interface KecamatanOption {
    nama_kecamatan: string;
    zona: string;
}

interface ParticipantRecord {
    id: number;
    pegawai_id: number | null;
    urutan: number;
    nama: string;
    nip: string | null;
    pangkat: string | null;
    golongan: string | null;
    jabatan: string | null;
}

interface SuratTugasRecord {
    id: number;
    nomor_spt: string | null;
    tanpa_surat: boolean;
    pengirim_surat: string;
    nomor_surat: string | null;
    tanggal_surat: string | null;
    tanggal_surat_formatted: string;
    tanggal_spt: string;
    tanggal_spt_formatted: string;
    tanggal_berangkat: string;
    tanggal_berangkat_formatted: string;
    tanggal_kembali: string;
    tanggal_kembali_formatted: string;
    lama_hari: number;
    tujuan: string;
    nama_tempat: string | null;
    nama_kecamatan: string | null;
    alamat_lengkap: string | null;
    penandatangan_mode: 'database' | 'manual';
    kepala_dinas_id: number | null;
    ttd_jabatan: string;
    ttd_nama: string;
    ttd_pangkat_gol: string | null;
    ttd_nip: string | null;
    ttd_image_url: string | null;
    ttd_offset_x: number;
    ttd_offset_y: number;
    ttd_scale: number;
    participants: ParticipantRecord[];
}

interface PageProps {
    suratTugasList: SuratTugasRecord[];
    pegawais: PegawaiItem[];
    kepalaDinasList: KepalaDinasItem[];
    kecamatanOptions: KecamatanOption[];
    todayStr: string;
    defaultTtdImageUrl?: string;
}

interface ParticipantSlot {
    uid: string;
    pegawai_id: string;
}

function calcLamaHari(start: string, end: string): number {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 1;
    const diff = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
}

function formatPangkatGol(pangkat?: string | null, golongan?: string | null): string {
    const p = (pangkat || '').trim();
    const g = (golongan || '').trim();
    if (p && g) return `${p} - ${g}`;
    return p || g || '';
}

function getGolonganRank(golongan?: string | null, pangkat?: string | null): number {
    const raw = (golongan || '').trim().toUpperCase();
    const pangkatUp = (pangkat || '').trim().toUpperCase();
    if (!raw && !pangkatUp) return 0;

    if (
        raw.includes('PPPK') ||
        raw.includes('P3K') ||
        pangkatUp.includes('PPPK') ||
        pangkatUp.includes('P3K') ||
        /^(XII|XI|X|IX|VIII|VII|VI|V)$/.test(raw)
    ) {
        if (/\bXII\b/.test(raw)) return 10;
        if (/\bXI\b/.test(raw)) return 9;
        if (/\bX\b/.test(raw)) return 8;
        if (/\bIX\b/.test(raw)) return 7;
        if (/\bVIII\b/.test(raw)) return 6;
        if (/\bVII\b/.test(raw)) return 5;
        if (/\bVI\b/.test(raw)) return 4;
        if (/\bV\b/.test(raw)) return 3;
        return 1;
    }

    const compact = raw.replace(/\s+/g, '').replace(/\./g, '/');
    const rankMap: Record<string, number> = {
        'IV/E': 27,
        'IV/D': 26,
        'IV/C': 25,
        'IV/B': 24,
        'IV/A': 23,
        'III/D': 22,
        'III/C': 21,
        'III/B': 20,
        'III/A': 19,
        'II/D': 18,
        'II/C': 17,
        'II/B': 16,
        'II/A': 15,
        'I/D': 14,
        'I/C': 13,
        'I/B': 12,
        'I/A': 11,
    };

    if (rankMap[compact] !== undefined) return rankMap[compact];
    for (const [key, score] of Object.entries(rankMap)) {
        if (compact.includes(key)) return score;
    }
    if (compact.includes('IV')) return 23;
    if (compact.includes('III')) return 19;
    if (compact.includes('II')) return 15;
    if (compact.includes('I')) return 11;
    return 0;
}

interface SignaturePositionEditorProps {
    imageUrl: string;
    offsetX: number;
    offsetY: number;
    scale: number;
    onChange: (next: { offsetX: number; offsetY: number; scale: number }) => void;
    onRemove: () => void;
    jabatan: string;
    nama: string;
    pangkatGol: string;
    nip: string;
    tanggalSpt?: string;
}

function SignaturePositionEditor({
    imageUrl,
    offsetX,
    offsetY,
    scale,
    onChange,
    onRemove,
    jabatan,
    nama,
    pangkatGol,
    nip,
}: SignaturePositionEditorProps) {
    const [dragging, setDragging] = useState(false);
    const dragStartRef = React.useRef<{
        clientX: number;
        clientY: number;
        startX: number;
        startY: number;
    } | null>(null);

    const clamp = (val: number, min: number, max: number) =>
        Math.max(min, Math.min(max, Math.round(val)));

    const handlePointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        dragStartRef.current = {
            clientX: e.clientX,
            clientY: e.clientY,
            startX: offsetX,
            startY: offsetY,
        };
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
        if (!dragging || !dragStartRef.current) return;
        const dx = e.clientX - dragStartRef.current.clientX;
        const dy = e.clientY - dragStartRef.current.clientY;
        onChange({
            offsetX: clamp(dragStartRef.current.startX + dx, -200, 250),
            offsetY: clamp(dragStartRef.current.startY + dy, -120, 120),
            scale,
        });
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLImageElement>) => {
        if (dragging) {
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
                // ignore
            }
            setDragging(false);
            dragStartRef.current = null;
        }
    };

    const heightPx = Math.max(20, Math.round(64 * (scale / 100)));

    return (
        <div className="mt-3 space-y-3 rounded-xl border border-teal-200 bg-teal-50/30 p-3.5 dark:border-teal-800 dark:bg-teal-950/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#006565] dark:text-teal-300">
                    <Move className="size-3.5" />
                    Atur Posisi & Ukuran Tanda Tangan (Geser Langsung pada Preview)
                </div>
                <div className="flex items-center gap-1.5">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onChange({ offsetX: 0, offsetY: 0, scale: 100 })}
                        className="h-7 gap-1 px-2 text-[11px] font-bold"
                    >
                        <RotateCcw className="size-3" />
                        Reset
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onRemove}
                        className="h-7 gap-1 border-rose-200 px-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                    >
                        <X className="size-3" />
                        Hapus TTD
                    </Button>
                </div>
            </div>

            {/* KONTROL SLIDER UKURAN & POSISI */}
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-teal-100 bg-white p-2.5 text-[11px] sm:grid-cols-3 dark:border-teal-900 dark:bg-neutral-900">
                <div className="space-y-1">
                    <div className="flex items-center justify-between font-bold text-neutral-700 dark:text-neutral-300">
                        <span>Ukuran TTD</span>
                        <span className="font-mono text-[#006565]">{scale}%</span>
                    </div>
                    <input
                        type="range"
                        min={30}
                        max={220}
                        step={5}
                        value={scale}
                        onChange={(e) =>
                            onChange({
                                offsetX,
                                offsetY,
                                scale: Number(e.target.value),
                            })
                        }
                        className="w-full accent-[#006565]"
                    />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center justify-between font-bold text-neutral-700 dark:text-neutral-300">
                        <span>Geser Kiri / Kanan (X)</span>
                        <span className="font-mono text-[#006565]">{offsetX}px</span>
                    </div>
                    <input
                        type="range"
                        min={-120}
                        max={180}
                        step={1}
                        value={offsetX}
                        onChange={(e) =>
                            onChange({
                                offsetX: Number(e.target.value),
                                offsetY,
                                scale,
                            })
                        }
                        className="w-full accent-[#006565]"
                    />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center justify-between font-bold text-neutral-700 dark:text-neutral-300">
                        <span>Geser Atas / Bawah (Y)</span>
                        <span className="font-mono text-[#006565]">{offsetY}px</span>
                    </div>
                    <input
                        type="range"
                        min={-80}
                        max={80}
                        step={1}
                        value={offsetY}
                        onChange={(e) =>
                            onChange({
                                offsetX,
                                offsetY: Number(e.target.value),
                                scale,
                            })
                        }
                        className="w-full accent-[#006565]"
                    />
                </div>
            </div>

            {/* SIMULASI BLOK TANDA TANGAN PDF (WYSIWYG) */}
            <div className="overflow-x-auto rounded-lg border border-neutral-300 bg-white p-4 shadow-inner">
                <div
                    className="mx-auto w-[340px] select-none text-left text-black"
                    style={{
                        fontFamily: 'Arial, Helvetica, sans-serif',
                        fontSize: '11pt',
                        lineHeight: 1.2,
                    }}
                >
                    <div className="mb-1">Indramayu, ...</div>
                    <div className="uppercase">
                        {(() => {
                            const cleaned = (
                                jabatan ||
                                'KEPALA DINAS KETAHANAN PANGAN DAN PERTANIAN'
                            )
                                .replace(/,?\s*kabupaten\s+indramayu\.?,?$/i, '')
                                .trim()
                                .toUpperCase();
                            const match = cleaned.match(
                                /^(.*KETAHANAN\s+PANGAN)\s+(DAN\s+PERTANIAN.*)$/i
                            );
                            if (match) {
                                return (
                                    <>
                                        {match[1]}
                                        <br />
                                        {match[2]}
                                        <br />
                                        KABUPATEN INDRAMAYU,
                                    </>
                                );
                            }
                            return (
                                <>
                                    {cleaned}
                                    <br />
                                    KABUPATEN INDRAMAYU,
                                </>
                            );
                        })()}
                    </div>

                    {/* AREA TANDA TANGAN (86px persis seperti di PDF) */}
                    <div
                        className="relative my-0.5 rounded border border-dashed border-teal-400/70 bg-teal-50/20"
                        style={{ height: '86px', overflow: 'visible' }}
                    >
                        <img
                            src={imageUrl}
                            alt="Drag untuk geser tanda tangan"
                            draggable={false}
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={handlePointerUp}
                            style={{
                                position: 'absolute',
                                left: `${offsetX}px`,
                                top: `${offsetY}px`,
                                height: `${heightPx}px`,
                                width: 'auto',
                                maxWidth: 'none',
                                zIndex: 10,
                                touchAction: 'none',
                            }}
                            className={`rounded transition-shadow ${
                                dragging
                                    ? 'cursor-grabbing ring-2 ring-[#006565]'
                                    : 'cursor-grab hover:ring-2 hover:ring-[#006565]/60'
                            }`}
                        />
                    </div>

                    <div className="font-bold uppercase underline">
                        {(nama || 'NAMA PENANDATANGAN').toUpperCase()}
                    </div>
                    {pangkatGol && <div>{pangkatGol}</div>}
                    {nip && <div>NIP. {nip}</div>}
                </div>
            </div>

            <p className="text-[10px] text-neutral-500">
                Tips: Klik dan tahan gambar tanda tangan di kotak putih di atas lalu geser ke posisi
                yang pas. Posisi & ukuran yang tampil di sini akan sama persis pada hasil PDF.
            </p>
        </div>
    );
}

export default function SuratTugasIndex({
    suratTugasList,
    pegawais,
    kepalaDinasList,
    kecamatanOptions,
    todayStr,
    defaultTtdImageUrl = '/images/ttd-default-kadin.png',
}: PageProps) {
    const defaultKadin =
        kepalaDinasList.find((k) => k.is_active) || kepalaDinasList[0] || null;
    const defaultKadinId = defaultKadin ? String(defaultKadin.id) : '';

    // =========================================================================
    // FORM BUAT SURAT TUGAS BARU (WIZARD 4 LANGKAH)
    // =========================================================================
    const [isFormExpanded, setIsFormExpanded] = useState(false);
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
    const [nomorSpt, setNomorSpt] = useState('');
    const [tanpaSurat, setTanpaSurat] = useState(false);
    const [pengirimSurat, setPengirimSurat] = useState('');
    const [nomorSurat, setNomorSurat] = useState('');
    const [tanggalSurat, setTanggalSurat] = useState(todayStr);
    const [tanggalSpt, setTanggalSpt] = useState(todayStr);
    const [tanggalBerangkat, setTanggalBerangkat] = useState(todayStr);
    const [tanggalKembali, setTanggalKembali] = useState(todayStr);

    const [tujuan, setTujuan] = useState('');
    const [namaTempat, setNamaTempat] = useState('');
    const [namaKecamatan, setNamaKecamatan] = useState('');
    const [alamatLengkap, setAlamatLengkap] = useState('');

    const [participantSlots, setParticipantSlots] = useState<ParticipantSlot[]>([
        { uid: `st-pt-${Date.now()}-1`, pegawai_id: '' },
    ]);

    // Penandatangan (Database Kepala Dinas vs Manual) + Upload Tanda Tangan
    const [penandatanganMode, setPenandatanganMode] = useState<'database' | 'manual'>('database');
    const [kepalaDinasId, setKepalaDinasId] = useState(defaultKadinId);
    const [ttdJabatan, setTtdJabatan] = useState(
        defaultKadin?.jabatan ||
            'KEPALA DINAS KETAHANAN PANGAN DAN PERTANIAN KABUPATEN INDRAMAYU'
    );
    const [ttdNama, setTtdNama] = useState(defaultKadin?.nama || '');
    const [ttdPangkatGol, setTtdPangkatGol] = useState(
        formatPangkatGol(defaultKadin?.pangkat, defaultKadin?.golongan)
    );
    const [ttdNip, setTtdNip] = useState(defaultKadin?.nip || '');
    const [ttdSource, setTtdSource] = useState<'default' | 'upload' | 'none'>('default');
    const [ttdImageFile, setTtdImageFile] = useState<File | null>(null);
    const [ttdImagePreview, setTtdImagePreview] = useState<string | null>(defaultTtdImageUrl);
    const [ttdOffsetX, setTtdOffsetX] = useState<number>(0);
    const [ttdOffsetY, setTtdOffsetY] = useState<number>(0);
    const [ttdScale, setTtdScale] = useState<number>(100);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // =========================================================================
    // MODAL EDIT SURAT TUGAS
    // =========================================================================
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<SuratTugasRecord | null>(null);
    const [eNomorSpt, setENomorSpt] = useState('');
    const [eTanpaSurat, setETanpaSurat] = useState(false);
    const [ePengirimSurat, setEPengirimSurat] = useState('');
    const [eNomorSurat, setENomorSurat] = useState('');
    const [eTanggalSurat, setETanggalSurat] = useState('');
    const [eTanggalSpt, setETanggalSpt] = useState('');
    const [eTanggalBerangkat, setETanggalBerangkat] = useState('');
    const [eTanggalKembali, setETanggalKembali] = useState('');
    const [eTujuan, setETujuan] = useState('');
    const [eNamaTempat, setENamaTempat] = useState('');
    const [eNamaKecamatan, setENamaKecamatan] = useState('');
    const [eAlamatLengkap, setEAlamatLengkap] = useState('');
    const [eParticipantSlots, setEParticipantSlots] = useState<ParticipantSlot[]>([]);
    const [ePenandatanganMode, setEPenandatanganMode] = useState<'database' | 'manual'>('database');
    const [eKepalaDinasId, setEKepalaDinasId] = useState('');
    const [eTtdJabatan, setETtdJabatan] = useState('');
    const [eTtdNama, setETtdNama] = useState('');
    const [eTtdPangkatGol, setETtdPangkatGol] = useState('');
    const [eTtdNip, setETtdNip] = useState('');
    const [eTtdSource, setETtdSource] = useState<'default' | 'upload' | 'none'>('none');
    const [eTtdImageFile, setETtdImageFile] = useState<File | null>(null);
    const [eTtdImagePreview, setETtdImagePreview] = useState<string | null>(null);
    const [eRemoveTtdImage, setERemoveTtdImage] = useState(false);
    const [eTtdOffsetX, setETtdOffsetX] = useState<number>(0);
    const [eTtdOffsetY, setETtdOffsetY] = useState<number>(0);
    const [eTtdScale, setETtdScale] = useState<number>(100);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const sortedPegawais = useMemo(() => {
        return [...pegawais].sort((a, b) => {
            const rankA = a.golongan_rank ?? getGolonganRank(a.golongan, a.pangkat);
            const rankB = b.golongan_rank ?? getGolonganRank(b.golongan, b.pangkat);
            if (rankA !== rankB) {
                return rankB - rankA;
            }
            return a.nama.localeCompare(b.nama, 'id');
        });
    }, [pegawais]);

    const lamaHari = useMemo(
        () => calcLamaHari(tanggalBerangkat, tanggalKembali),
        [tanggalBerangkat, tanggalKembali]
    );

    const selectedDbKadin = useMemo(
        () => kepalaDinasList.find((k) => String(k.id) === String(kepalaDinasId)) || null,
        [kepalaDinasList, kepalaDinasId]
    );

    const selectedEditDbKadin = useMemo(
        () => kepalaDinasList.find((k) => String(k.id) === String(eKepalaDinasId)) || null,
        [kepalaDinasList, eKepalaDinasId]
    );

    const filteredList = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return suratTugasList;
        return suratTugasList.filter(
            (st) =>
                (st.nomor_spt || '').toLowerCase().includes(q) ||
                st.tujuan.toLowerCase().includes(q) ||
                (st.nama_tempat || '').toLowerCase().includes(q) ||
                (st.nama_kecamatan || '').toLowerCase().includes(q) ||
                st.pengirim_surat.toLowerCase().includes(q) ||
                st.ttd_nama.toLowerCase().includes(q) ||
                st.participants.some((p) => p.nama.toLowerCase().includes(q))
        );
    }, [suratTugasList, searchQuery]);

    const handleSelectTtdFile = (file: File | null, isEdit = false) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('File tanda tangan harus berupa gambar (PNG/JPG/WEBP).');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Ukuran file tanda tangan maksimal 2 MB.');
            return;
        }
        const previewUrl = URL.createObjectURL(file);
        if (isEdit) {
            setETtdSource('upload');
            setETtdImageFile(file);
            setETtdImagePreview(previewUrl);
            setERemoveTtdImage(false);
        } else {
            setTtdSource('upload');
            setTtdImageFile(file);
            setTtdImagePreview(previewUrl);
        }
    };

    const handleToggleTanpaSurat = (checked: boolean) => {
        setTanpaSurat(checked);
        if (checked) {
            if (!pengirimSurat.trim() || !pengirimSurat.includes('Undang-Undang')) {
                setPengirimSurat(DEFAULT_DASAR_TANPA_SURAT);
            }
            setNomorSurat('');
        } else if (pengirimSurat.trim() === DEFAULT_DASAR_TANPA_SURAT) {
            setPengirimSurat('');
        }
    };

    const handleToggleEditTanpaSurat = (checked: boolean) => {
        setETanpaSurat(checked);
        if (checked) {
            if (!ePengirimSurat.trim() || !ePengirimSurat.includes('Undang-Undang')) {
                setEPengirimSurat(DEFAULT_DASAR_TANPA_SURAT);
            }
            setENomorSurat('');
        } else if (ePengirimSurat.trim() === DEFAULT_DASAR_TANPA_SURAT) {
            setEPengirimSurat('');
        }
    };

    const handleSelectKadinChange = (idStr: string) => {
        setKepalaDinasId(idStr);
        const found = kepalaDinasList.find((k) => String(k.id) === idStr);
        if (found) {
            setTtdJabatan(
                found.jabatan ||
                    'KEPALA DINAS KETAHANAN PANGAN DAN PERTANIAN KABUPATEN INDRAMAYU'
            );
            setTtdNama(found.nama);
            setTtdPangkatGol(formatPangkatGol(found.pangkat, found.golongan));
            setTtdNip(found.nip || '');
        }
    };

    const handleSelectEditKadinChange = (idStr: string) => {
        setEKepalaDinasId(idStr);
        const found = kepalaDinasList.find((k) => String(k.id) === idStr);
        if (found) {
            setETtdJabatan(
                found.jabatan ||
                    'KEPALA DINAS KETAHANAN PANGAN DAN PERTANIAN KABUPATEN INDRAMAYU'
            );
            setETtdNama(found.nama);
            setETtdPangkatGol(formatPangkatGol(found.pangkat, found.golongan));
            setETtdNip(found.nip || '');
        }
    };

    const handleResetForm = () => {
        setCurrentStep(1);
        setNomorSpt('');
        setTanpaSurat(false);
        setPengirimSurat('');
        setNomorSurat('');
        setTanggalSurat(todayStr);
        setTanggalSpt(todayStr);
        setTanggalBerangkat(todayStr);
        setTanggalKembali(todayStr);
        setTujuan('');
        setNamaTempat('');
        setNamaKecamatan('');
        setAlamatLengkap('');
        setParticipantSlots([{ uid: `st-pt-${Date.now()}-1`, pegawai_id: '' }]);
        setPenandatanganMode('database');
        setKepalaDinasId(defaultKadinId);
        setTtdJabatan(
            defaultKadin?.jabatan ||
                'KEPALA DINAS KETAHANAN PANGAN DAN PERTANIAN KABUPATEN INDRAMAYU'
        );
        setTtdNama(defaultKadin?.nama || '');
        setTtdPangkatGol(formatPangkatGol(defaultKadin?.pangkat, defaultKadin?.golongan));
        setTtdNip(defaultKadin?.nip || '');
        setTtdSource('default');
        setTtdImageFile(null);
        setTtdImagePreview(defaultTtdImageUrl);
        setTtdOffsetX(0);
        setTtdOffsetY(0);
        setTtdScale(100);
    };

    const handleNextStep = () => {
        if (currentStep === 1) {
            if (!pengirimSurat.trim()) {
                toast.error(
                    tanpaSurat
                        ? 'Dasar regulasi Surat Tugas wajib diisi.'
                        : 'Pengirim surat wajib diisi.'
                );
                return;
            }
            if ((!tanpaSurat && !tanggalSurat) || !tanggalSpt || !tanggalBerangkat || !tanggalKembali) {
                toast.error('Tanggal surat, tanggal SPT, berangkat, dan kembali wajib diisi.');
                return;
            }
            if (tanggalKembali < tanggalBerangkat) {
                toast.error('Tanggal kembali tidak boleh lebih awal dari tanggal berangkat.');
                return;
            }
            setCurrentStep(2);
            return;
        }

        if (currentStep === 2) {
            if (!tujuan.trim()) {
                toast.error('Maksud / tujuan penugasan wajib diisi.');
                return;
            }
            setCurrentStep(3);
            return;
        }

        if (currentStep === 3) {
            const validPegawaiIds = participantSlots
                .map((s) => s.pegawai_id)
                .filter((id) => id !== '');
            if (validPegawaiIds.length === 0) {
                toast.error('Minimal 1 pegawai yang ditugaskan wajib dipilih.');
                return;
            }
            setCurrentStep(4);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const validPegawaiIds = participantSlots
            .map((s) => s.pegawai_id)
            .filter((id) => id !== '');

        if (!pengirimSurat.trim()) {
            toast.error(
                tanpaSurat
                    ? 'Dasar regulasi Surat Tugas wajib diisi.'
                    : 'Pengirim surat wajib diisi.'
            );
            return;
        }
        if (!tujuan.trim()) {
            toast.error('Maksud / tujuan penugasan wajib diisi.');
            return;
        }
        if (validPegawaiIds.length === 0) {
            toast.error('Minimal 1 pegawai yang ditugaskan wajib dipilih.');
            return;
        }
        if (penandatanganMode === 'manual') {
            if (!ttdJabatan.trim() || !ttdNama.trim()) {
                toast.error('Jabatan dan Nama penandatangan manual wajib diisi.');
                return;
            }
        } else if (!kepalaDinasId) {
            toast.error('Silakan pilih Kepala Dinas dari database atau beralih ke mode manual.');
            return;
        }

        const formData = new FormData();
        formData.append('nomor_spt', nomorSpt.trim());
        formData.append('tanpa_surat', tanpaSurat ? '1' : '0');
        formData.append('pengirim_surat', pengirimSurat.trim());
        formData.append('nomor_surat', tanpaSurat ? '' : nomorSurat.trim());
        if (!tanpaSurat && tanggalSurat) {
            formData.append('tanggal_surat', tanggalSurat);
        }
        formData.append('tanggal_spt', tanggalSpt);
        formData.append('tanggal_berangkat', tanggalBerangkat);
        formData.append('tanggal_kembali', tanggalKembali);
        formData.append('tujuan', tujuan.trim());
        formData.append('nama_tempat', namaTempat.trim());
        formData.append('nama_kecamatan', namaKecamatan.trim());
        formData.append('alamat_lengkap', alamatLengkap.trim());
        formData.append('penandatangan_mode', penandatanganMode);
        if (penandatanganMode === 'database' && kepalaDinasId) {
            formData.append('kepala_dinas_id', kepalaDinasId);
        }
        formData.append('ttd_jabatan', ttdJabatan.trim());
        formData.append('ttd_nama', ttdNama.trim());
        formData.append('ttd_pangkat_gol', ttdPangkatGol.trim());
        formData.append('ttd_nip', ttdNip.trim());
        formData.append('ttd_source', ttdSource);
        if (ttdSource === 'upload' && ttdImageFile) {
            formData.append('ttd_image', ttdImageFile);
        }
        formData.append('ttd_offset_x', String(ttdOffsetX));
        formData.append('ttd_offset_y', String(ttdOffsetY));
        formData.append('ttd_scale', String(ttdScale));
        validPegawaiIds.forEach((pid) => {
            formData.append('pegawai_ids[]', pid);
        });

        setIsSubmitting(true);
        router.post('/surat-tugas', formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Surat Tugas berhasil disimpan.');
                handleResetForm();
            },
            onError: (errors) => {
                const firstErr = Object.values(errors)[0];
                toast.error(firstErr ? String(firstErr) : 'Gagal menyimpan Surat Tugas.');
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleOpenEdit = (item: SuratTugasRecord) => {
        setEditingItem(item);
        setENomorSpt(item.nomor_spt || '');
        setETanpaSurat(item.tanpa_surat);
        setEPengirimSurat(item.pengirim_surat);
        setENomorSurat(item.nomor_surat || '');
        setETanggalSurat(item.tanggal_surat || todayStr);
        setETanggalSpt(item.tanggal_spt);
        setETanggalBerangkat(item.tanggal_berangkat);
        setETanggalKembali(item.tanggal_kembali);
        setETujuan(item.tujuan);
        setENamaTempat(item.nama_tempat || '');
        setENamaKecamatan(item.nama_kecamatan || '');
        setEAlamatLengkap(item.alamat_lengkap || '');
        setEParticipantSlots(
            item.participants.length > 0
                ? item.participants.map((p, idx) => ({
                      uid: `est-pt-${item.id}-${idx}`,
                      pegawai_id: p.pegawai_id ? String(p.pegawai_id) : '',
                  }))
                : [{ uid: `est-pt-${item.id}-0`, pegawai_id: '' }]
        );
        setEPenandatanganMode(item.penandatangan_mode || 'database');
        setEKepalaDinasId(item.kepala_dinas_id ? String(item.kepala_dinas_id) : defaultKadinId);
        setETtdJabatan(item.ttd_jabatan || '');
        setETtdNama(item.ttd_nama || '');
        setETtdPangkatGol(item.ttd_pangkat_gol || '');
        setETtdNip(item.ttd_nip || '');
        setETtdSource(
            !item.ttd_image_url
                ? 'none'
                : item.ttd_image_url === defaultTtdImageUrl
                  ? 'default'
                  : 'upload'
        );
        setETtdImageFile(null);
        setETtdImagePreview(item.ttd_image_url);
        setERemoveTtdImage(false);
        setETtdOffsetX(item.ttd_offset_x ?? 0);
        setETtdOffsetY(item.ttd_offset_y ?? 0);
        setETtdScale(item.ttd_scale ?? 100);
        setEditModalOpen(true);
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;

        const validPegawaiIds = eParticipantSlots
            .map((s) => s.pegawai_id)
            .filter((id) => id !== '');

        if (validPegawaiIds.length === 0) {
            toast.error('Minimal 1 pegawai yang ditugaskan wajib dipilih.');
            return;
        }
        if (ePenandatanganMode === 'manual' && (!eTtdJabatan.trim() || !eTtdNama.trim())) {
            toast.error('Jabatan dan Nama penandatangan manual wajib diisi.');
            return;
        }

        const formData = new FormData();
        formData.append('nomor_spt', eNomorSpt.trim());
        formData.append('tanpa_surat', eTanpaSurat ? '1' : '0');
        formData.append('pengirim_surat', ePengirimSurat.trim());
        formData.append('nomor_surat', eTanpaSurat ? '' : eNomorSurat.trim());
        if (!eTanpaSurat && eTanggalSurat) {
            formData.append('tanggal_surat', eTanggalSurat);
        }
        formData.append('tanggal_spt', eTanggalSpt);
        formData.append('tanggal_berangkat', eTanggalBerangkat);
        formData.append('tanggal_kembali', eTanggalKembali);
        formData.append('tujuan', eTujuan.trim());
        formData.append('nama_tempat', eNamaTempat.trim());
        formData.append('nama_kecamatan', eNamaKecamatan.trim());
        formData.append('alamat_lengkap', eAlamatLengkap.trim());
        formData.append('penandatangan_mode', ePenandatanganMode);
        if (ePenandatanganMode === 'database' && eKepalaDinasId) {
            formData.append('kepala_dinas_id', eKepalaDinasId);
        }
        formData.append('ttd_jabatan', eTtdJabatan.trim());
        formData.append('ttd_nama', eTtdNama.trim());
        formData.append('ttd_pangkat_gol', eTtdPangkatGol.trim());
        formData.append('ttd_nip', eTtdNip.trim());
        formData.append('ttd_source', eTtdSource);
        formData.append('remove_ttd_image', eTtdSource === 'none' || eRemoveTtdImage ? '1' : '0');
        formData.append('ttd_offset_x', String(eTtdOffsetX));
        formData.append('ttd_offset_y', String(eTtdOffsetY));
        formData.append('ttd_scale', String(eTtdScale));
        if (eTtdSource === 'upload' && eTtdImageFile) {
            formData.append('ttd_image', eTtdImageFile);
        }
        validPegawaiIds.forEach((pid) => {
            formData.append('pegawai_ids[]', pid);
        });

        setIsSavingEdit(true);
        router.post(`/surat-tugas/${editingItem.id}`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Surat Tugas berhasil diperbarui.');
                setEditModalOpen(false);
            },
            onError: (errors) => {
                const firstErr = Object.values(errors)[0];
                toast.error(firstErr ? String(firstErr) : 'Gagal memperbarui Surat Tugas.');
            },
            onFinish: () => setIsSavingEdit(false),
        });
    };

    const handleDelete = (item: SuratTugasRecord) => {
        if (!window.confirm(`Hapus Surat Tugas "${item.tujuan}"?`)) {
            return;
        }
        router.delete(`/surat-tugas/${item.id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Surat Tugas berhasil dihapus.'),
        });
    };

    return (
        <>
            <Head title="Surat Tugas - DKPP Kabupaten Indramayu" />

            <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 p-4 md:p-6">
                {/* HEADER BANNER */}
                <div className="relative overflow-hidden rounded-2xl border border-teal-200/80 bg-gradient-to-r from-[#005555] via-[#006565] to-[#007a7a] p-5 text-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-xs">
                                <FileText className="size-6 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-extrabold tracking-tight md:text-xl">
                                        Surat Tugas (SPT)
                                    </h1>
                                    <Badge className="bg-white/20 text-[10px] font-bold text-white hover:bg-white/25">
                                        DKPP Indramayu
                                    </Badge>
                                </div>
                                <p className="mt-0.5 text-xs text-teal-100 md:text-sm">
                                    Pembuatan Surat Perintah Tugas dengan pilihan dasar surat,
                                    penandatangan dari database Kepala Dinas atau input manual,
                                    serta upload tanda tangan.
                                </p>
                            </div>
                        </div>

                        <Button
                            type="button"
                            onClick={() => setIsFormExpanded((v) => !v)}
                            className="gap-1.5 bg-white font-bold text-[#006565] shadow-xs hover:bg-teal-50"
                        >
                            {isFormExpanded ? (
                                <>
                                    <ChevronUp className="size-4" />
                                    Sembunyikan Form
                                </>
                            ) : (
                                <>
                                    <Plus className="size-4" />
                                    Buat Surat Tugas Baru
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* FORM BUAT SURAT TUGAS */}
                {isFormExpanded && (
                    <Card className="border-teal-200/80 shadow-xs dark:border-teal-900">
                        <CardHeader className="border-b border-teal-100 bg-teal-50/50 py-3.5 dark:border-teal-900/60 dark:bg-teal-950/30">
                            <CardTitle className="flex items-center gap-2 text-sm font-extrabold text-[#006565] dark:text-teal-300">
                                <FileCheck2 className="size-4" />
                                Form Pembuatan Surat Tugas Baru
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            {/* STEP PROGRESS INDICATOR */}
                            <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4">
                                {(
                                    [
                                        {
                                            step: 1 as const,
                                            title: 'Langkah 1',
                                            desc: 'Dasar Surat & Jadwal',
                                        },
                                        {
                                            step: 2 as const,
                                            title: 'Langkah 2',
                                            desc: 'Tujuan & Lokasi',
                                        },
                                        {
                                            step: 3 as const,
                                            title: 'Langkah 3',
                                            desc: 'Pegawai Ditugaskan',
                                        },
                                        {
                                            step: 4 as const,
                                            title: 'Langkah 4',
                                            desc: 'Penandatangan & TTD',
                                        },
                                    ]
                                ).map((item) => {
                                    const isActive = currentStep === item.step;
                                    const isDone = currentStep > item.step;
                                    return (
                                        <button
                                            key={item.step}
                                            type="button"
                                            onClick={() => {
                                                if (item.step < currentStep) {
                                                    setCurrentStep(item.step);
                                                }
                                            }}
                                            className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                                                isActive
                                                    ? 'border-[#006565] bg-[#006565] text-white shadow-xs'
                                                    : isDone
                                                      ? 'cursor-pointer border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
                                                      : 'cursor-default border-neutral-200 bg-neutral-50 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900'
                                            }`}
                                        >
                                            <div
                                                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                                                    isActive
                                                        ? 'bg-white text-[#006565]'
                                                        : isDone
                                                          ? 'bg-emerald-600 text-white'
                                                          : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800'
                                                }`}
                                            >
                                                {isDone ? (
                                                    <CheckCircle2 className="size-4" />
                                                ) : (
                                                    item.step
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[11px] font-extrabold tracking-wide uppercase">
                                                    {item.title}
                                                </div>
                                                <div
                                                    className={`truncate text-[11px] ${
                                                        isActive
                                                            ? 'text-teal-100'
                                                            : isDone
                                                              ? 'text-emerald-700 dark:text-emerald-400'
                                                              : 'text-neutral-400'
                                                    }`}
                                                >
                                                    {item.desc}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* LANGKAH 1: DASAR SURAT & JADWAL */}
                                {currentStep === 1 && (
                                <div className="space-y-4 rounded-xl border border-teal-100 bg-teal-50/20 p-4 dark:border-teal-900/50 dark:bg-teal-950/10">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-100 pb-2.5 dark:border-teal-900/50">
                                        <div className="flex items-center gap-2 text-xs font-extrabold text-[#006565] dark:text-teal-300">
                                            <Calendar className="size-4" />
                                            Langkah 1 — Dasar Surat & Jadwal Pelaksanaan
                                        </div>
                                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs font-bold text-[#006565] shadow-2xs dark:border-teal-800 dark:bg-neutral-900 dark:text-teal-300">
                                            <input
                                                type="checkbox"
                                                checked={tanpaSurat}
                                                onChange={(e) =>
                                                    handleToggleTanpaSurat(e.target.checked)
                                                }
                                                className="size-3.5 accent-[#006565]"
                                            />
                                            <span>Tanpa Surat (Dasar Regulasi Default)</span>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="space-y-1.5 md:col-span-2">
                                            <Label className="text-xs font-bold">
                                                {tanpaSurat
                                                    ? 'Dasar Surat Tugas (Regulasi) *'
                                                    : 'Pengirim Surat *'}
                                            </Label>
                                            {tanpaSurat ? (
                                                <textarea
                                                    value={pengirimSurat}
                                                    onChange={(e) =>
                                                        setPengirimSurat(e.target.value)
                                                    }
                                                    rows={2}
                                                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs shadow-2xs focus-visible:ring-1 focus-visible:ring-[#006565] focus-visible:outline-none dark:bg-neutral-900"
                                                    placeholder="1. Undang-Undang Nomor 18 Tahun 2012 tentang Pangan; 2. PP No.17 Tahun 2015..."
                                                    required
                                                />
                                            ) : (
                                                <Input
                                                    value={pengirimSurat}
                                                    onChange={(e) =>
                                                        setPengirimSurat(e.target.value)
                                                    }
                                                    placeholder="Contoh: Dinas Ketahanan Pangan dan Peternakan Provinsi Jawa Barat"
                                                    className="h-9 bg-white text-xs dark:bg-neutral-900"
                                                    required
                                                />
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold">
                                                Nomor SPT (Opsional)
                                            </Label>
                                            <Input
                                                value={nomorSpt}
                                                onChange={(e) => setNomorSpt(e.target.value)}
                                                placeholder="Kosongkan untuk 800.1.11.1/    /KDP"
                                                className="h-9 bg-white font-mono text-xs dark:bg-neutral-900"
                                            />
                                        </div>
                                    </div>

                                    {!tanpaSurat && (
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold">
                                                    Nomor Surat Masuk
                                                </Label>
                                                <Input
                                                    value={nomorSurat}
                                                    onChange={(e) => setNomorSurat(e.target.value)}
                                                    placeholder="Contoh: 005/1234/DKPP"
                                                    className="h-9 bg-white text-xs dark:bg-neutral-900"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold">
                                                    Tanggal Surat Masuk *
                                                </Label>
                                                <Input
                                                    type="date"
                                                    value={tanggalSurat}
                                                    onChange={(e) =>
                                                        setTanggalSurat(e.target.value)
                                                    }
                                                    className="h-9 bg-white text-xs dark:bg-neutral-900"
                                                    required={!tanpaSurat}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold">
                                                Tanggal SPT *
                                            </Label>
                                            <Input
                                                type="date"
                                                value={tanggalSpt}
                                                onChange={(e) => setTanggalSpt(e.target.value)}
                                                className="h-9 bg-white text-xs dark:bg-neutral-900"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold">
                                                Tanggal Berangkat *
                                            </Label>
                                            <Input
                                                type="date"
                                                value={tanggalBerangkat}
                                                onChange={(e) => {
                                                    setTanggalBerangkat(e.target.value);
                                                    if (tanggalKembali < e.target.value) {
                                                        setTanggalKembali(e.target.value);
                                                    }
                                                }}
                                                className="h-9 bg-white text-xs dark:bg-neutral-900"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold">
                                                Tanggal Kembali *
                                            </Label>
                                            <Input
                                                type="date"
                                                value={tanggalKembali}
                                                min={tanggalBerangkat}
                                                onChange={(e) => setTanggalKembali(e.target.value)}
                                                className="h-9 bg-white text-xs dark:bg-neutral-900"
                                                required
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <div className="flex h-9 w-full items-center justify-between rounded-md border border-teal-200 bg-teal-50 px-3 text-xs font-bold text-[#006565] dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300">
                                                <span>Lama Tugas</span>
                                                <span className="font-mono text-sm">
                                                    {lamaHari} Hari
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                )}

                                {/* LANGKAH 2: TUJUAN & LOKASI */}
                                {currentStep === 2 && (
                                <div className="space-y-4 rounded-xl border border-teal-100 bg-teal-50/20 p-4 dark:border-teal-900/50 dark:bg-teal-950/10">
                                    <div className="flex items-center gap-2 border-b border-teal-100 pb-2 text-xs font-extrabold text-[#006565] dark:border-teal-900/50 dark:text-teal-300">
                                        <MapPin className="size-4" />
                                        Langkah 2 — Maksud Penugasan & Lokasi Tujuan
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold">
                                            Maksud / Tujuan Penugasan (Untuk Poin 1) *
                                        </Label>
                                        <textarea
                                            value={tujuan}
                                            onChange={(e) => setTujuan(e.target.value)}
                                            rows={2}
                                            className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs shadow-2xs focus-visible:ring-1 focus-visible:ring-[#006565] focus-visible:outline-none dark:bg-neutral-900"
                                            placeholder="Contoh: Monitoring dan Evaluasi Ketahanan Pangan / Undangan Rapat Koordinasi..."
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold">
                                                Tempat / Desa / Instansi Tujuan
                                            </Label>
                                            <Input
                                                value={namaTempat}
                                                onChange={(e) => setNamaTempat(e.target.value)}
                                                placeholder="Contoh: Desa Karangsong / Aula Hotel..."
                                                className="h-9 bg-white text-xs dark:bg-neutral-900"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold">
                                                Kecamatan / Kab-Kota
                                            </Label>
                                            <Input
                                                list="kecamatan-options-list"
                                                value={namaKecamatan}
                                                onChange={(e) => setNamaKecamatan(e.target.value)}
                                                placeholder="Pilih Kecamatan atau ketik Kab/Kota"
                                                className="h-9 bg-white text-xs dark:bg-neutral-900"
                                            />
                                            <datalist id="kecamatan-options-list">
                                                {kecamatanOptions.map((kec) => (
                                                    <option
                                                        key={kec.nama_kecamatan}
                                                        value={`Kec. ${kec.nama_kecamatan}, Kab. Indramayu`}
                                                    />
                                                ))}
                                            </datalist>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold">
                                                Alamat Lengkap (Opsional)
                                            </Label>
                                            <Input
                                                value={alamatLengkap}
                                                onChange={(e) => setAlamatLengkap(e.target.value)}
                                                placeholder="Contoh: Jl. Merdeka No. 2..."
                                                className="h-9 bg-white text-xs dark:bg-neutral-900"
                                            />
                                        </div>
                                    </div>
                                </div>
                                )}

                                {/* LANGKAH 3: PEGAWAI YANG DITUGASKAN */}
                                {currentStep === 3 && (
                                <div className="space-y-3 rounded-xl border border-teal-100 bg-teal-50/20 p-4 dark:border-teal-900/50 dark:bg-teal-950/10">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-100 pb-2 dark:border-teal-900/50">
                                        <div className="flex items-center gap-2 text-xs font-extrabold text-[#006565] dark:text-teal-300">
                                            <Users className="size-4" />
                                            Langkah 3 — Pegawai yang Ditugaskan ({participantSlots.length}{' '}
                                            orang)
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                setParticipantSlots((prev) => [
                                                    ...prev,
                                                    {
                                                        uid: `st-pt-${Date.now()}-${prev.length + 1}`,
                                                        pegawai_id: '',
                                                    },
                                                ])
                                            }
                                            className="h-8 gap-1.5 border-[#006565] bg-white text-xs font-bold text-[#006565] hover:bg-teal-50"
                                        >
                                            <UserPlus className="size-3.5" />+ Tambah Pegawai
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {participantSlots.map((slot, idx) => (
                                            <div
                                                key={slot.uid}
                                                className="flex items-center gap-2.5 rounded-lg border border-teal-200/70 bg-white p-2.5 dark:border-teal-900 dark:bg-neutral-950"
                                            >
                                                <Badge className="shrink-0 bg-[#006565] text-[11px] font-extrabold text-white">
                                                    #{idx + 1}
                                                </Badge>
                                                <div className="min-w-0 flex-1">
                                                    <Select
                                                        value={slot.pegawai_id}
                                                        onValueChange={(v) =>
                                                            setParticipantSlots((prev) =>
                                                                prev.map((row, i) =>
                                                                    i === idx
                                                                        ? { ...row, pegawai_id: v }
                                                                        : row
                                                                )
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="h-9 w-full bg-white text-xs dark:bg-neutral-900">
                                                            <SelectValue placeholder="-- Pilih Pegawai --" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {sortedPegawais.map((p) => (
                                                                <SelectItem
                                                                    key={p.id}
                                                                    value={String(p.id)}
                                                                >
                                                                    {p.nama}{' '}
                                                                    {p.golongan
                                                                        ? `(${p.golongan})`
                                                                        : ''}
                                                                    {p.jabatan
                                                                        ? ` — ${p.jabatan}`
                                                                        : ''}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {participantSlots.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            setParticipantSlots((prev) =>
                                                                prev.filter((_, i) => i !== idx)
                                                            )
                                                        }
                                                        className="h-8 w-8 shrink-0 p-0 text-rose-600 hover:bg-rose-50"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                )}

                                {/* LANGKAH 4: PENANDATANGAN & UPLOAD TANDA TANGAN */}
                                {currentStep === 4 && (
                                <div className="space-y-4 rounded-xl border border-teal-100 bg-teal-50/20 p-4 dark:border-teal-900/50 dark:bg-teal-950/10">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-100 pb-2.5 dark:border-teal-900/50">
                                        <div className="flex items-center gap-2 text-xs font-extrabold text-[#006565] dark:text-teal-300">
                                            <PenTool className="size-4" />
                                            Langkah 4 — Pejabat Penandatangan & Upload Tanda Tangan
                                        </div>

                                        <div className="inline-flex rounded-lg border border-teal-200 bg-white p-0.5 dark:border-teal-800 dark:bg-neutral-900">
                                            <button
                                                type="button"
                                                onClick={() => setPenandatanganMode('database')}
                                                className={`rounded-md px-3 py-1 text-xs font-bold transition-colors ${
                                                    penandatanganMode === 'database'
                                                        ? 'bg-[#006565] text-white'
                                                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                                                }`}
                                            >
                                                Ambil dari Database Kepala Dinas
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPenandatanganMode('manual')}
                                                className={`rounded-md px-3 py-1 text-xs font-bold transition-colors ${
                                                    penandatanganMode === 'manual'
                                                        ? 'bg-[#006565] text-white'
                                                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                                                }`}
                                            >
                                                Isi Manual
                                            </button>
                                        </div>
                                    </div>

                                    {penandatanganMode === 'database' ? (
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold">
                                                    Pilih Kepala Dinas *
                                                </Label>
                                                <Select
                                                    value={kepalaDinasId}
                                                    onValueChange={handleSelectKadinChange}
                                                >
                                                    <SelectTrigger className="h-9 bg-white text-xs dark:bg-neutral-900">
                                                        <SelectValue placeholder="-- Pilih Pejabat Kepala Dinas --" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {kepalaDinasList.map((k) => (
                                                            <SelectItem
                                                                key={k.id}
                                                                value={String(k.id)}
                                                            >
                                                                {k.nama}{' '}
                                                                {k.jabatan ? `(${k.jabatan})` : ''}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {selectedDbKadin && (
                                                <div className="rounded-lg border border-teal-200 bg-white p-3 text-xs dark:border-teal-900 dark:bg-neutral-950">
                                                    <div className="font-bold text-[#006565]">
                                                        {selectedDbKadin.jabatan ||
                                                            'KEPALA DINAS KETAHANAN PANGAN DAN PERTANIAN KABUPATEN INDRAMAYU'}
                                                    </div>
                                                    <div className="mt-1 font-extrabold text-neutral-900 dark:text-neutral-100">
                                                        {selectedDbKadin.nama}
                                                    </div>
                                                    <div className="text-[11px] text-neutral-600 dark:text-neutral-400">
                                                        {formatPangkatGol(
                                                            selectedDbKadin.pangkat,
                                                            selectedDbKadin.golongan
                                                        )}{' '}
                                                        {selectedDbKadin.nip
                                                            ? `| NIP. ${selectedDbKadin.nip}`
                                                            : ''}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold">
                                                    Jabatan Penandatangan *
                                                </Label>
                                                <Input
                                                    value={ttdJabatan}
                                                    onChange={(e) => setTtdJabatan(e.target.value)}
                                                    placeholder="Contoh: KEPALA BIDANG KETERSEDIAAN DAN DISTRIBUSI PANGAN"
                                                    className="h-9 bg-white text-xs dark:bg-neutral-900"
                                                    required={penandatanganMode === 'manual'}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold">
                                                    Nama Lengkap & Gelar *
                                                </Label>
                                                <Input
                                                    value={ttdNama}
                                                    onChange={(e) => setTtdNama(e.target.value)}
                                                    placeholder="Contoh: H. AHMAD SYARIF, S.P., M.Si"
                                                    className="h-9 bg-white text-xs dark:bg-neutral-900"
                                                    required={penandatanganMode === 'manual'}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold">
                                                    Pangkat / Golongan
                                                </Label>
                                                <Input
                                                    value={ttdPangkatGol}
                                                    onChange={(e) =>
                                                        setTtdPangkatGol(e.target.value)
                                                    }
                                                    placeholder="Contoh: Pembina Tk. I - IV/b"
                                                    className="h-9 bg-white text-xs dark:bg-neutral-900"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold">
                                                    NIP (Opsional)
                                                </Label>
                                                <Input
                                                    value={ttdNip}
                                                    onChange={(e) => setTtdNip(e.target.value)}
                                                    placeholder="Contoh: 19780101 199703 1 003"
                                                    className="h-9 bg-white font-mono text-xs dark:bg-neutral-900"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* PILIHAN GAMBAR TANDA TANGAN: DEFAULT / UPLOAD MANUAL / TANPA TTD */}
                                    <div className="rounded-xl border border-dashed border-teal-300 bg-white p-3.5 dark:border-teal-800 dark:bg-neutral-950">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <Label className="flex items-center gap-1.5 text-xs font-bold text-[#006565] dark:text-teal-300">
                                                <Upload className="size-3.5" />
                                                Gambar Tanda Tangan
                                            </Label>
                                            <div className="inline-flex rounded-lg border border-teal-200 bg-neutral-50 p-0.5 dark:border-teal-800 dark:bg-neutral-900">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setTtdSource('default');
                                                        setTtdImageFile(null);
                                                        setTtdImagePreview(defaultTtdImageUrl);
                                                    }}
                                                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                                                        ttdSource === 'default'
                                                            ? 'bg-[#006565] text-white'
                                                            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                                                    }`}
                                                >
                                                    Tanda Tangan Default
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setTtdSource('upload');
                                                        if (ttdImagePreview === defaultTtdImageUrl) {
                                                            setTtdImagePreview(null);
                                                        }
                                                    }}
                                                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                                                        ttdSource === 'upload'
                                                            ? 'bg-[#006565] text-white'
                                                            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                                                    }`}
                                                >
                                                    Upload Manual
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setTtdSource('none');
                                                        setTtdImageFile(null);
                                                        setTtdImagePreview(null);
                                                    }}
                                                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                                                        ttdSource === 'none'
                                                            ? 'bg-neutral-700 text-white'
                                                            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                                                    }`}
                                                >
                                                    Tanpa TTD
                                                </button>
                                            </div>
                                        </div>

                                        {ttdSource === 'upload' && (
                                            <div className="mt-2.5 space-y-1">
                                                <p className="text-[11px] text-neutral-500">
                                                    Format PNG transparan / JPG / WEBP (maks. 2 MB).
                                                    Setelah diupload, Anda dapat menggeser posisi dan
                                                    mengatur ukuran tanda tangan langsung di bawah ini.
                                                </p>
                                                <Input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/webp"
                                                    onChange={(e) =>
                                                        handleSelectTtdFile(
                                                            e.target.files?.[0] || null,
                                                            false
                                                        )
                                                    }
                                                    className="mt-1.5 h-9 max-w-sm cursor-pointer bg-white text-xs dark:bg-neutral-900"
                                                />
                                            </div>
                                        )}

                                        {ttdSource !== 'none' && ttdImagePreview && (
                                            <SignaturePositionEditor
                                                imageUrl={ttdImagePreview}
                                                offsetX={ttdOffsetX}
                                                offsetY={ttdOffsetY}
                                                scale={ttdScale}
                                                onChange={({ offsetX, offsetY, scale }) => {
                                                    setTtdOffsetX(offsetX);
                                                    setTtdOffsetY(offsetY);
                                                    setTtdScale(scale);
                                                }}
                                                onRemove={() => {
                                                    setTtdSource('none');
                                                    setTtdImageFile(null);
                                                    setTtdImagePreview(null);
                                                    setTtdOffsetX(0);
                                                    setTtdOffsetY(0);
                                                    setTtdScale(100);
                                                }}
                                                jabatan={
                                                    penandatanganMode === 'database'
                                                        ? selectedDbKadin?.jabatan ||
                                                          'KEPALA DINAS KETAHANAN PANGAN DAN PERTANIAN KABUPATEN INDRAMAYU'
                                                        : ttdJabatan
                                                }
                                                nama={
                                                    penandatanganMode === 'database'
                                                        ? selectedDbKadin?.nama || ''
                                                        : ttdNama
                                                }
                                                pangkatGol={
                                                    penandatanganMode === 'database'
                                                        ? formatPangkatGol(
                                                              selectedDbKadin?.pangkat,
                                                              selectedDbKadin?.golongan
                                                          )
                                                        : ttdPangkatGol
                                                }
                                                nip={
                                                    penandatanganMode === 'database'
                                                        ? selectedDbKadin?.nip || ''
                                                        : ttdNip
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                                )}

                                {/* WIZARD NAVIGATION FOOTER */}
                                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-teal-100 pt-4 dark:border-teal-900/50">
                                    <div>
                                        {currentStep > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    setCurrentStep(
                                                        (s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4
                                                    )
                                                }
                                                className="gap-1.5 text-xs font-bold"
                                            >
                                                <ArrowLeft className="size-3.5" />
                                                Langkah Sebelumnya
                                            </Button>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleResetForm}
                                            className="text-xs font-bold"
                                        >
                                            Reset Form
                                        </Button>
                                        {currentStep < 4 ? (
                                            <Button
                                                type="button"
                                                onClick={handleNextStep}
                                                className="gap-1.5 bg-[#006565] text-xs font-bold text-white hover:bg-[#005252]"
                                            >
                                                Lanjut ke Langkah {currentStep + 1}
                                                <ArrowRight className="size-3.5" />
                                            </Button>
                                        ) : (
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="gap-1.5 bg-[#006565] text-xs font-bold text-white hover:bg-[#005252]"
                                            >
                                                <Save className="size-4" />
                                                {isSubmitting
                                                    ? 'Menyimpan...'
                                                    : 'Simpan Surat Tugas'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* DAFTAR SURAT TUGAS TERSIMPAN */}
                <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                    <CardHeader className="flex flex-col gap-3 border-b border-neutral-100 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
                                <FileText className="size-4 text-[#006565]" />
                                Daftar Surat Tugas Tersimpan
                                <Badge className="bg-teal-50 text-xs font-bold text-[#006565]">
                                    {filteredList.length} Dokumen
                                </Badge>
                            </CardTitle>
                        </div>

                        <div className="relative w-full sm:w-72">
                            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari tujuan, pegawai, penandatangan..."
                                className="h-8 pl-8 text-xs"
                            />
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs">
                                <thead>
                                    <tr className="border-b border-teal-200/80 bg-teal-50/80 text-[11px] font-extrabold text-[#005555] uppercase dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200">
                                        <th className="px-4 py-3">Tanggal & Nomor</th>
                                        <th className="px-4 py-3">Maksud & Lokasi</th>
                                        <th className="px-4 py-3">Pegawai Ditugaskan</th>
                                        <th className="px-4 py-3">Penandatangan</th>
                                        <th className="px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {filteredList.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-10 text-center text-neutral-400"
                                            >
                                                Belum ada data Surat Tugas tersimpan.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredList.map((st) => (
                                            <tr
                                                key={st.id}
                                                className="align-top transition-colors hover:bg-teal-50/30 dark:hover:bg-teal-950/20"
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="font-bold text-neutral-900 dark:text-neutral-100">
                                                        SPT: {st.tanggal_spt_formatted}
                                                    </div>
                                                    <div className="mt-0.5 font-mono text-[11px] text-neutral-500">
                                                        {st.nomor_spt || '800.1.11.1/.../KDP'}
                                                    </div>
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        <Badge
                                                            variant="outline"
                                                            className="border-teal-200 bg-teal-50 text-[10px] text-[#006565]"
                                                        >
                                                            {st.lama_hari} Hari
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px]"
                                                        >
                                                            {st.tanpa_surat
                                                                ? 'Tanpa Surat'
                                                                : 'Dengan Surat'}
                                                        </Badge>
                                                    </div>
                                                </td>

                                                <td className="min-w-[240px] max-w-[360px] px-4 py-3">
                                                    <div className="leading-snug font-semibold whitespace-normal break-words text-neutral-900 dark:text-neutral-100">
                                                        {st.tujuan}
                                                    </div>
                                                    <div className="mt-1 text-[11px] text-neutral-500">
                                                        {[
                                                            st.nama_tempat,
                                                            st.alamat_lengkap,
                                                            st.nama_kecamatan,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(', ') || '-'}
                                                    </div>
                                                    <div className="mt-0.5 text-[10px] text-neutral-400">
                                                        Jadwal: {st.tanggal_berangkat_formatted}
                                                        {st.tanggal_kembali !==
                                                        st.tanggal_berangkat
                                                            ? ` s.d. ${st.tanggal_kembali_formatted}`
                                                            : ''}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="flex max-w-[240px] flex-wrap gap-1">
                                                        {st.participants.map((pt) => (
                                                            <span
                                                                key={pt.id}
                                                                className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-semibold dark:border-neutral-800 dark:bg-neutral-900"
                                                            >
                                                                <span className="max-w-[145px] truncate">
                                                                    {pt.nama}
                                                                </span>
                                                                {pt.golongan && (
                                                                    <span className="rounded bg-teal-50 px-1 text-[9px] font-extrabold text-[#006565]">
                                                                        {pt.golongan}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>

                                                <td className="min-w-[200px] px-4 py-3">
                                                    <div className="font-bold text-neutral-900 dark:text-neutral-100">
                                                        {st.ttd_nama}
                                                    </div>
                                                    <div className="line-clamp-2 text-[11px] text-neutral-500">
                                                        {st.ttd_jabatan}
                                                    </div>
                                                    <div className="mt-1 flex flex-wrap items-center gap-1">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px]"
                                                        >
                                                            {st.penandatangan_mode === 'manual'
                                                                ? 'Manual'
                                                                : 'Database Kadin'}
                                                        </Badge>
                                                        {st.ttd_image_url && (
                                                            <Badge className="gap-1 bg-emerald-50 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100">
                                                                <ImageIcon className="size-2.5" />
                                                                TTD Upload
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <a
                                                            href={`/surat-tugas/${st.id}/pdf`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            title="Preview PDF sebelum download"
                                                        >
                                                            <Button
                                                                size="sm"
                                                                className="h-8 gap-1.5 bg-[#006565] px-2.5 text-xs font-bold text-white hover:bg-[#005252]"
                                                            >
                                                                <Eye className="size-3.5" />
                                                                Preview PDF
                                                            </Button>
                                                        </a>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleOpenEdit(st)}
                                                            className="h-8 px-2 text-amber-700 hover:bg-amber-50"
                                                            title="Edit Surat Tugas"
                                                        >
                                                            <Edit3 className="size-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(st)}
                                                            className="h-8 px-2 text-rose-600 hover:bg-rose-50"
                                                            title="Hapus Surat Tugas"
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
                    </CardContent>
                </Card>

                {/* MODAL EDIT SURAT TUGAS */}
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-[#006565]">
                                <Award className="size-4" />
                                Edit Surat Tugas
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Perbarui dasar surat, jadwal, tujuan, pegawai, penandatangan, atau
                                file tanda tangan.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50/40 px-3 py-2">
                                <span className="text-xs font-bold text-[#006565]">
                                    Opsi Dasar Surat
                                </span>
                                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold">
                                    <input
                                        type="checkbox"
                                        checked={eTanpaSurat}
                                        onChange={(e) =>
                                            handleToggleEditTanpaSurat(e.target.checked)
                                        }
                                        className="size-3.5 accent-[#006565]"
                                    />
                                    Tanpa Surat (Dasar Regulasi)
                                </label>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold">
                                        {eTanpaSurat ? 'Dasar Regulasi *' : 'Pengirim Surat *'}
                                    </Label>
                                    <Input
                                        value={ePengirimSurat}
                                        onChange={(e) => setEPengirimSurat(e.target.value)}
                                        className="h-9 text-xs"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold">Nomor SPT</Label>
                                    <Input
                                        value={eNomorSpt}
                                        onChange={(e) => setENomorSpt(e.target.value)}
                                        className="h-9 font-mono text-xs"
                                    />
                                </div>
                            </div>

                            {!eTanpaSurat && (
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold">Nomor Surat</Label>
                                        <Input
                                            value={eNomorSurat}
                                            onChange={(e) => setENomorSurat(e.target.value)}
                                            className="h-9 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold">Tanggal Surat *</Label>
                                        <Input
                                            type="date"
                                            value={eTanggalSurat}
                                            onChange={(e) => setETanggalSurat(e.target.value)}
                                            className="h-9 text-xs"
                                            required={!eTanpaSurat}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold">Tanggal SPT *</Label>
                                    <Input
                                        type="date"
                                        value={eTanggalSpt}
                                        onChange={(e) => setETanggalSpt(e.target.value)}
                                        className="h-9 text-xs"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold">Tanggal Berangkat *</Label>
                                    <Input
                                        type="date"
                                        value={eTanggalBerangkat}
                                        onChange={(e) => setETanggalBerangkat(e.target.value)}
                                        className="h-9 text-xs"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold">Tanggal Kembali *</Label>
                                    <Input
                                        type="date"
                                        value={eTanggalKembali}
                                        min={eTanggalBerangkat}
                                        onChange={(e) => setETanggalKembali(e.target.value)}
                                        className="h-9 text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Maksud / Tujuan *</Label>
                                <textarea
                                    value={eTujuan}
                                    onChange={(e) => setETujuan(e.target.value)}
                                    rows={2}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold">Tempat / Instansi</Label>
                                    <Input
                                        value={eNamaTempat}
                                        onChange={(e) => setENamaTempat(e.target.value)}
                                        className="h-9 text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold">Kecamatan / Kab-Kota</Label>
                                    <Input
                                        list="kecamatan-options-list"
                                        value={eNamaKecamatan}
                                        onChange={(e) => setENamaKecamatan(e.target.value)}
                                        className="h-9 text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold">Alamat Lengkap</Label>
                                    <Input
                                        value={eAlamatLengkap}
                                        onChange={(e) => setEAlamatLengkap(e.target.value)}
                                        className="h-9 text-xs"
                                    />
                                </div>
                            </div>

                            {/* PEGAWAI EDIT */}
                            <div className="space-y-2 rounded-lg border p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#006565]">
                                        Pegawai yang Ditugaskan
                                    </span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            setEParticipantSlots((prev) => [
                                                ...prev,
                                                {
                                                    uid: `est-add-${Date.now()}-${prev.length}`,
                                                    pegawai_id: '',
                                                },
                                            ])
                                        }
                                        className="h-7 text-[11px]"
                                    >
                                        + Pegawai
                                    </Button>
                                </div>
                                {eParticipantSlots.map((slot, idx) => (
                                    <div key={slot.uid} className="flex items-center gap-2">
                                        <span className="w-6 text-center text-xs font-bold text-neutral-500">
                                            {idx + 1}.
                                        </span>
                                        <Select
                                            value={slot.pegawai_id}
                                            onValueChange={(v) =>
                                                setEParticipantSlots((prev) =>
                                                    prev.map((row, i) =>
                                                        i === idx ? { ...row, pegawai_id: v } : row
                                                    )
                                                )
                                            }
                                        >
                                            <SelectTrigger className="h-8 flex-1 text-xs">
                                                <SelectValue placeholder="-- Pilih Pegawai --" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sortedPegawais.map((p) => (
                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                        {p.nama}{' '}
                                                        {p.golongan ? `(${p.golongan})` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {eParticipantSlots.length > 1 && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    setEParticipantSlots((prev) =>
                                                        prev.filter((_, i) => i !== idx)
                                                    )
                                                }
                                                className="h-8 w-8 p-0 text-rose-600"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* PENANDATANGAN EDIT */}
                            <div className="space-y-3 rounded-lg border p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-[#006565]">
                                        Pejabat Penandatangan
                                    </span>
                                    <div className="inline-flex rounded-md border p-0.5">
                                        <button
                                            type="button"
                                            onClick={() => setEPenandatanganMode('database')}
                                            className={`rounded px-2.5 py-1 text-[11px] font-bold ${
                                                ePenandatanganMode === 'database'
                                                    ? 'bg-[#006565] text-white'
                                                    : 'text-neutral-600'
                                            }`}
                                        >
                                            Database Kepala Dinas
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEPenandatanganMode('manual')}
                                            className={`rounded px-2.5 py-1 text-[11px] font-bold ${
                                                ePenandatanganMode === 'manual'
                                                    ? 'bg-[#006565] text-white'
                                                    : 'text-neutral-600'
                                            }`}
                                        >
                                            Isi Manual
                                        </button>
                                    </div>
                                </div>

                                {ePenandatanganMode === 'database' ? (
                                    <div className="space-y-2">
                                        <Select
                                            value={eKepalaDinasId}
                                            onValueChange={handleSelectEditKadinChange}
                                        >
                                            <SelectTrigger className="h-9 text-xs">
                                                <SelectValue placeholder="-- Pilih Kepala Dinas --" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {kepalaDinasList.map((k) => (
                                                    <SelectItem key={k.id} value={String(k.id)}>
                                                        {k.nama} {k.jabatan ? `(${k.jabatan})` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {selectedEditDbKadin && (
                                            <div className="text-[11px] text-neutral-500">
                                                {selectedEditDbKadin.jabatan} —{' '}
                                                <strong>{selectedEditDbKadin.nama}</strong>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold">Jabatan *</Label>
                                            <Input
                                                value={eTtdJabatan}
                                                onChange={(e) => setETtdJabatan(e.target.value)}
                                                className="h-9 text-xs"
                                                required={ePenandatanganMode === 'manual'}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold">Nama *</Label>
                                            <Input
                                                value={eTtdNama}
                                                onChange={(e) => setETtdNama(e.target.value)}
                                                className="h-9 text-xs"
                                                required={ePenandatanganMode === 'manual'}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold">
                                                Pangkat / Golongan
                                            </Label>
                                            <Input
                                                value={eTtdPangkatGol}
                                                onChange={(e) => setETtdPangkatGol(e.target.value)}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold">NIP</Label>
                                            <Input
                                                value={eTtdNip}
                                                onChange={(e) => setETtdNip(e.target.value)}
                                                className="h-9 font-mono text-xs"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 border-t pt-2.5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <Label className="text-xs font-bold">
                                            Gambar Tanda Tangan
                                        </Label>
                                        <div className="inline-flex rounded-md border p-0.5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setETtdSource('default');
                                                    setETtdImageFile(null);
                                                    setETtdImagePreview(defaultTtdImageUrl);
                                                    setERemoveTtdImage(false);
                                                }}
                                                className={`rounded px-2 py-1 text-[11px] font-bold ${
                                                    eTtdSource === 'default'
                                                        ? 'bg-[#006565] text-white'
                                                        : 'text-neutral-600'
                                                }`}
                                            >
                                                TTD Default
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setETtdSource('upload');
                                                    setERemoveTtdImage(false);
                                                    if (eTtdImagePreview === defaultTtdImageUrl) {
                                                        setETtdImagePreview(null);
                                                    }
                                                }}
                                                className={`rounded px-2 py-1 text-[11px] font-bold ${
                                                    eTtdSource === 'upload'
                                                        ? 'bg-[#006565] text-white'
                                                        : 'text-neutral-600'
                                                }`}
                                            >
                                                Upload Manual
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setETtdSource('none');
                                                    setETtdImageFile(null);
                                                    setETtdImagePreview(null);
                                                    setERemoveTtdImage(true);
                                                }}
                                                className={`rounded px-2 py-1 text-[11px] font-bold ${
                                                    eTtdSource === 'none'
                                                        ? 'bg-neutral-700 text-white'
                                                        : 'text-neutral-600'
                                                }`}
                                            >
                                                Tanpa TTD
                                            </button>
                                        </div>
                                    </div>

                                    {eTtdSource === 'upload' && (
                                        <Input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={(e) =>
                                                handleSelectTtdFile(
                                                    e.target.files?.[0] || null,
                                                    true
                                                )
                                            }
                                            className="h-9 max-w-xs text-xs"
                                        />
                                    )}
                                    {eTtdSource !== 'none' && eTtdImagePreview && !eRemoveTtdImage && (
                                        <SignaturePositionEditor
                                            imageUrl={eTtdImagePreview}
                                            offsetX={eTtdOffsetX}
                                            offsetY={eTtdOffsetY}
                                            scale={eTtdScale}
                                            onChange={({ offsetX, offsetY, scale }) => {
                                                setETtdOffsetX(offsetX);
                                                setETtdOffsetY(offsetY);
                                                setETtdScale(scale);
                                            }}
                                            onRemove={() => {
                                                setETtdSource('none');
                                                setETtdImageFile(null);
                                                setETtdImagePreview(null);
                                                setERemoveTtdImage(true);
                                                setETtdOffsetX(0);
                                                setETtdOffsetY(0);
                                                setETtdScale(100);
                                            }}
                                            jabatan={
                                                ePenandatanganMode === 'database'
                                                    ? selectedEditDbKadin?.jabatan ||
                                                      'KEPALA DINAS KETAHANAN PANGAN DAN PERTANIAN KABUPATEN INDRAMAYU'
                                                    : eTtdJabatan
                                            }
                                            nama={
                                                ePenandatanganMode === 'database'
                                                    ? selectedEditDbKadin?.nama || ''
                                                    : eTtdNama
                                            }
                                            pangkatGol={
                                                ePenandatanganMode === 'database'
                                                    ? formatPangkatGol(
                                                          selectedEditDbKadin?.pangkat,
                                                          selectedEditDbKadin?.golongan
                                                      )
                                                    : eTtdPangkatGol
                                            }
                                            nip={
                                                ePenandatanganMode === 'database'
                                                    ? selectedEditDbKadin?.nip || ''
                                                    : eTtdNip
                                            }
                                        />
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSavingEdit}
                                    className="bg-[#006565] text-white hover:bg-[#005252]"
                                >
                                    {isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

SuratTugasIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Surat Tugas',
            href: '/surat-tugas',
        },
    ] satisfies BreadcrumbItem[],
};
