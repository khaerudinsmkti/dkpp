import { Head, router } from '@inertiajs/react';
import {
    Award,
    Briefcase,
    Building2,
    Calendar,
    CalendarPlus,
    CheckCircle2,
    Coins,
    Copy,
    Edit3,
    FileCheck2,
    FileText,
    MapPin,
    Plus,
    Printer,
    Save,
    Search,
    Sparkles,
    Trash2,
    UserCheck,
    UserPlus,
    Users,
    Wallet,
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
import type { BreadcrumbItem } from '@/types';

interface PegawaiItem {
    id: number;
    nama: string;
    nip: string | null;
    pangkat: string | null;
    golongan: string | null;
    golongan_group: string;
    jabatan: string | null;
    tanggal_lahir: string | null;
    tanggal_lahir_formatted: string;
    is_active: boolean;
}

interface PejabatItem {
    id: number;
    tipe: 'kepala_dinas' | 'pptk' | 'bendahara';
    nama: string;
    nip: string | null;
    pangkat: string | null;
    golongan: string | null;
    jabatan: string | null;
    is_active: boolean;
}

interface ZonasiItem {
    id: number;
    nama_kecamatan: string;
    zona: string;
    golongan: string;
    uang_saku: number;
}

interface KecamatanOption {
    nama_kecamatan: string;
    zona: string;
}

interface SppdParticipantItem {
    id: number;
    pegawai_id: number | null;
    urutan: number;
    nama: string;
    nip: string | null;
    pangkat: string | null;
    golongan: string | null;
    jabatan: string | null;
    tanggal_berangkat: string;
    tanggal_spt: string;
    tujuan: string;
    nama_kecamatan: string;
    zona: string | null;
    uang_saku: number;
}

interface SppdRecordItem {
    id: number;
    nomor_spt: string;
    tanggal_spt: string;
    tanggal_spt_formatted: string;
    tanggal_berangkat: string;
    tanggal_berangkat_formatted: string;
    tujuan: string;
    nama_kecamatan: string;
    zona: string | null;
    kepala_dinas_id: number | null;
    kepala_dinas: {
        id: number;
        nama: string;
        nip: string | null;
        pangkat: string | null;
        golongan: string | null;
        jabatan: string | null;
    } | null;
    pptk_id: number | null;
    pptk: {
        id: number;
        nama: string;
        nip: string | null;
        pangkat: string | null;
        golongan: string | null;
        jabatan: string | null;
    } | null;
    bendahara_id: number | null;
    bendahara: {
        id: number;
        nama: string;
        nip: string | null;
        pangkat: string | null;
        golongan: string | null;
        jabatan: string | null;
    } | null;
    total_uang_saku: number;
    participants: SppdParticipantItem[];
}

interface PageProps {
    sppdRecords: SppdRecordItem[];
    pegawais: PegawaiItem[];
    kepalaDinasList: PejabatItem[];
    pptkList: PejabatItem[];
    bendaharaList: PejabatItem[];
    zonasis: ZonasiItem[];
    kecamatanOptions: KecamatanOption[];
    statistics: {
        total_sppd: number;
        total_personil_berangkat: number;
        total_anggaran_uang_saku: number;
        total_pegawai: number;
        total_kecamatan_zonasi: number;
    };
}

interface ParticipantDraft {
    uid: string;
    pegawai_id: string;
    tanggal_berangkat: string;
    tanggal_spt: string;
    tujuan: string;
    nama_kecamatan: string;
}

interface SppdBatchDraft {
    uid: string;
    nomor_spt: string;
    tanggal_berangkat: string;
    tanggal_spt: string;
    tujuan: string;
    nama_kecamatan: string;
    kepala_dinas_id: string;
    pptk_id: string;
    bendahara_id: string;
    participants: ParticipantDraft[];
}

const GOLONGAN_OPTIONS = [
    { golongan: 'IV/e', pangkat: 'Pembina Utama' },
    { golongan: 'IV/d', pangkat: 'Pembina Utama Madya' },
    { golongan: 'IV/c', pangkat: 'Pembina Utama Muda' },
    { golongan: 'IV/b', pangkat: 'Pembina Tingkat I' },
    { golongan: 'IV/a', pangkat: 'Pembina' },
    { golongan: 'III/d', pangkat: 'Penata Tingkat I' },
    { golongan: 'III/c', pangkat: 'Penata' },
    { golongan: 'III/b', pangkat: 'Penata Muda Tingkat I' },
    { golongan: 'III/a', pangkat: 'Penata Muda' },
    { golongan: 'II/d', pangkat: 'Pengatur Tingkat I' },
    { golongan: 'II/c', pangkat: 'Pengatur' },
    { golongan: 'II/b', pangkat: 'Pengatur Muda Tingkat I' },
    { golongan: 'II/a', pangkat: 'Pengatur Muda' },
    { golongan: 'I/d', pangkat: 'Juru Tingkat I' },
    { golongan: 'I/c', pangkat: 'Juru' },
    { golongan: 'I/b', pangkat: 'Juru Muda Tingkat I' },
    { golongan: 'I/a', pangkat: 'Juru Muda' },
];

const ZONA_OPTIONS = ['Zona I', 'Zona II', 'Zona III'];
const ZONASI_GOLONGAN_OPTIONS = [
    'Golongan IV',
    'Golongan III',
    'Golongan II',
    'Golongan I',
];

/**
 * Otomatis ekstrak Tanggal Lahir (YYYY-MM-DD) dari 8 digit awal NIP.
 */
function extractBirthDateFromNip(nip: string): string | null {
    const digits = nip.replace(/\D/g, '');
    if (digits.length < 8) return null;

    const year = parseInt(digits.substring(0, 4), 10);
    const month = parseInt(digits.substring(4, 6), 10);
    const day = parseInt(digits.substring(6, 8), 10);

    if (
        year >= 1930 &&
        year <= 2025 &&
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31
    ) {
        const mm = String(month).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
    }

    return null;
}

function normalizeGolonganToZonasiGroup(golongan?: string | null): string {
    if (!golongan) return 'Golongan III';
    const up = golongan.toUpperCase();
    if (up.includes('IV')) return 'Golongan IV';
    if (up.includes('III')) return 'Golongan III';
    if (up.includes('II')) return 'Golongan II';
    if (up.includes('I')) return 'Golongan I';
    return golongan;
}

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount || 0);
}

function addDaysToDateStr(dateStr: string, days: number): string {
    if (!dateStr) return new Date().toISOString().slice(0, 10);
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

export default function SppdDalamKotaIndex({
    sppdRecords,
    pegawais,
    kepalaDinasList,
    pptkList,
    bendaharaList,
    zonasis,
    kecamatanOptions,
    statistics,
}: PageProps) {
    // 6 Tab utama sesuai urutan alur permintaan user
    const [activeTab, setActiveTab] = useState<
        'sppd' | 'pegawai' | 'kepala_dinas' | 'pptk' | 'bendahara' | 'zonasi'
    >('sppd');

    const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const defaultKecamatan = kecamatanOptions[0]?.nama_kecamatan || 'Indramayu';
    const defaultKadinId = String(
        kepalaDinasList.find((k) => k.is_active)?.id || kepalaDinasList[0]?.id || ''
    );
    const defaultPptkId = String(
        pptkList.find((p) => p.is_active)?.id || pptkList[0]?.id || ''
    );
    const defaultBendaharaId = String(
        bendaharaList.find((b) => b.is_active)?.id || bendaharaList[0]?.id || ''
    );

    // =========================================================================
    // 6. STATE FORM INPUT SPPD DALAM KOTA (MULTI-ORANG & MULTI-TANGGAL)
    // =========================================================================
    const createInitialBatch = (
        dateBerangkat = todayStr,
        dateSpt = todayStr,
        tujuanInitial = '',
        kecInitial = defaultKecamatan
    ): SppdBatchDraft => ({
        uid: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nomor_spt: '',
        tanggal_berangkat: dateBerangkat,
        tanggal_spt: dateSpt,
        tujuan: tujuanInitial,
        nama_kecamatan: kecInitial,
        kepala_dinas_id: defaultKadinId,
        pptk_id: defaultPptkId,
        bendahara_id: defaultBendaharaId,
        participants: [
            {
                uid: `pt-${Date.now()}-1`,
                pegawai_id: String(pegawais[0]?.id || ''),
                tanggal_berangkat: dateBerangkat,
                tanggal_spt: dateSpt,
                tujuan: tujuanInitial,
                nama_kecamatan: kecInitial,
            },
        ],
    });

    const [batches, setBatches] = useState<SppdBatchDraft[]>(() => [
        createInitialBatch(),
    ]);
    const [isSubmittingSppd, setIsSubmittingSppd] = useState(false);
    const [afterSavePromptOpen, setAfterSavePromptOpen] = useState(false);
    const [lastSavedReference, setLastSavedReference] = useState<{
        tanggal_berangkat: string;
        tanggal_spt: string;
        tujuan: string;
        nama_kecamatan: string;
        participantIds: string[];
    } | null>(null);

    const [sppdSearch, setSppdSearch] = useState('');

    // Helper lookup uang saku & zona berdasarkan kecamatan & pegawai_id
    const getTarifInfo = (pegawaiIdStr: string, namaKecamatan: string) => {
        const peg = pegawais.find((p) => String(p.id) === String(pegawaiIdStr));
        const kecObj = kecamatanOptions.find(
            (k) => k.nama_kecamatan.toLowerCase() === namaKecamatan.toLowerCase()
        );
        const zona = kecObj?.zona || 'Zona I';

        if (!peg) {
            return { pegawai: null, zona, uang_saku: 0 };
        }

        const golGroup = normalizeGolonganToZonasiGroup(peg.golongan);
        const matchedZonasi = zonasis.find(
            (z) =>
                z.nama_kecamatan.toLowerCase() === namaKecamatan.toLowerCase() &&
                (z.golongan.toLowerCase() === (peg.golongan || '').toLowerCase() ||
                    z.golongan.toLowerCase() === golGroup.toLowerCase())
        );

        return {
            pegawai: peg,
            zona: matchedZonasi?.zona || zona,
            uang_saku: matchedZonasi ? matchedZonasi.uang_saku : 0,
        };
    };

    // Update field pada Orang Pertama (sekaligus sinkronkan ke orang ke-2 dst. pada batch yang sama)
    const handleUpdatePrimaryTripField = (
        batchIdx: number,
        field: 'tanggal_berangkat' | 'tanggal_spt' | 'tujuan' | 'nama_kecamatan' | 'nomor_spt' | 'kepala_dinas_id' | 'pptk_id' | 'bendahara_id',
        value: string
    ) => {
        setBatches((prev) =>
            prev.map((batch, idx) => {
                if (idx !== batchIdx) return batch;
                const updatedBatch = { ...batch, [field]: value };

                if (
                    field === 'tanggal_berangkat' ||
                    field === 'tanggal_spt' ||
                    field === 'tujuan' ||
                    field === 'nama_kecamatan'
                ) {
                    updatedBatch.participants = batch.participants.map((pt) => ({
                        ...pt,
                        [field]: value,
                    }));
                }

                return updatedBatch;
            })
        );
    };

    // Update field pada salah satu baris orang/pegawai
    const handleUpdateParticipantField = (
        batchIdx: number,
        ptIdx: number,
        field: keyof ParticipantDraft,
        value: string
    ) => {
        setBatches((prev) =>
            prev.map((batch, bIdx) => {
                if (bIdx !== batchIdx) return batch;

                const nextParticipants = batch.participants.map((pt, pIdx) => {
                    if (pIdx !== ptIdx) return pt;
                    return { ...pt, [field]: value };
                });

                // Jika orang ke-1 mengubah tanggal_berangkat / tanggal_spt / tujuan / nama_kecamatan,
                // sinkronkan ke header batch & orang ke-2 yang belum diubah terpisah
                const updatedBatch = { ...batch, participants: nextParticipants };
                if (
                    ptIdx === 0 &&
                    (field === 'tanggal_berangkat' ||
                        field === 'tanggal_spt' ||
                        field === 'tujuan' ||
                        field === 'nama_kecamatan')
                ) {
                    updatedBatch[field] = value;
                    updatedBatch.participants = nextParticipants.map((pt, i) =>
                        i === 0 ? pt : { ...pt, [field]: value }
                    );
                }

                return updatedBatch;
            })
        );
    };

    // Tombol "+ Tambah Orang Kedua (dengan Isian yang Sama)"
    const handleAddSameTripPerson = (batchIdx: number) => {
        setBatches((prev) =>
            prev.map((batch, idx) => {
                if (idx !== batchIdx) return batch;

                const firstPerson = batch.participants[0];
                const usedIds = new Set(batch.participants.map((p) => p.pegawai_id));
                const nextAvailablePegawai =
                    pegawais.find((p) => !usedIds.has(String(p.id))) || pegawais[0];

                const newPerson: ParticipantDraft = {
                    uid: `pt-${Date.now()}-${batch.participants.length + 1}`,
                    pegawai_id: String(nextAvailablePegawai?.id || ''),
                    tanggal_berangkat:
                        firstPerson?.tanggal_berangkat || batch.tanggal_berangkat,
                    tanggal_spt: firstPerson?.tanggal_spt || batch.tanggal_spt,
                    tujuan: firstPerson?.tujuan || batch.tujuan,
                    nama_kecamatan:
                        firstPerson?.nama_kecamatan || batch.nama_kecamatan,
                };

                return {
                    ...batch,
                    participants: [...batch.participants, newPerson],
                };
            })
        );
        toast.success(
            'Baris pegawai berikutnya ditambahkan dengan Tanggal, Tujuan & Kecamatan yang sama.'
        );
    };

    const handleRemoveParticipant = (batchIdx: number, ptIdx: number) => {
        setBatches((prev) =>
            prev.map((batch, idx) => {
                if (idx !== batchIdx || batch.participants.length <= 1) return batch;
                return {
                    ...batch,
                    participants: batch.participants.filter((_, i) => i !== ptIdx),
                };
            })
        );
    };

    // Tombol "+ Tambah SPPD Lagi di Tanggal yang Berbeda"
    const handleAddDifferentDateBatch = () => {
        const lastBatch = batches[batches.length - 1];
        const nextDate = addDaysToDateStr(
            lastBatch?.tanggal_berangkat || todayStr,
            1
        );
        const copiedParticipants: ParticipantDraft[] = (
            lastBatch?.participants || []
        ).map((pt, i) => ({
            uid: `pt-${Date.now()}-${i + 1}`,
            pegawai_id: pt.pegawai_id,
            tanggal_berangkat: nextDate,
            tanggal_spt: lastBatch?.tanggal_spt || todayStr,
            tujuan: lastBatch?.tujuan || '',
            nama_kecamatan: lastBatch?.nama_kecamatan || defaultKecamatan,
        }));

        const newBatch: SppdBatchDraft = {
            uid: `batch-${Date.now()}-${batches.length + 1}`,
            nomor_spt: '',
            tanggal_berangkat: nextDate,
            tanggal_spt: lastBatch?.tanggal_spt || todayStr,
            tujuan: lastBatch?.tujuan || '',
            nama_kecamatan: lastBatch?.nama_kecamatan || defaultKecamatan,
            kepala_dinas_id: lastBatch?.kepala_dinas_id || defaultKadinId,
            pptk_id: lastBatch?.pptk_id || defaultPptkId,
            bendahara_id: lastBatch?.bendahara_id || defaultBendaharaId,
            participants:
                copiedParticipants.length > 0
                    ? copiedParticipants
                    : [
                          {
                              uid: `pt-${Date.now()}-1`,
                              pegawai_id: String(pegawais[0]?.id || ''),
                              tanggal_berangkat: nextDate,
                              tanggal_spt: todayStr,
                              tujuan: lastBatch?.tujuan || '',
                              nama_kecamatan:
                                  lastBatch?.nama_kecamatan || defaultKecamatan,
                          },
                      ],
        };

        setBatches((prev) => [...prev, newBatch]);
        toast.info(
            `Form SPPD baru untuk tanggal berbeda (${nextDate}) berhasil ditambahkan.`
        );
    };

    const handleRemoveBatch = (batchIdx: number) => {
        if (batches.length <= 1) return;
        setBatches((prev) => prev.filter((_, idx) => idx !== batchIdx));
    };

    // Simpan semua batch SPPD
    const handleSubmitSppd = (e: React.FormEvent) => {
        e.preventDefault();

        for (let i = 0; i < batches.length; i++) {
            const b = batches[i];
            if (!b.tujuan.trim()) {
                toast.error(`Mohon isi Tujuan perjalanan dinas pada SPPD #${i + 1}.`);
                return;
            }
            if (!b.nama_kecamatan) {
                toast.error(`Mohon pilih Kecamatan tujuan pada SPPD #${i + 1}.`);
                return;
            }
            for (let j = 0; j < b.participants.length; j++) {
                if (!b.participants[j].pegawai_id) {
                    toast.error(
                        `Mohon pilih Nama Pegawai ke-${j + 1} pada SPPD #${i + 1}.`
                    );
                    return;
                }
            }
        }

        const lastB = batches[batches.length - 1];
        const savedRef = {
            tanggal_berangkat: lastB.tanggal_berangkat,
            tanggal_spt: lastB.tanggal_spt,
            tujuan: lastB.tujuan,
            nama_kecamatan: lastB.nama_kecamatan,
            participantIds: lastB.participants.map((p) => p.pegawai_id),
        };

        setIsSubmittingSppd(true);
        router.post(
            '/sppd-dalam-kota/sppd',
            {
                batches: batches.map((b) => ({
                    nomor_spt: b.nomor_spt || null,
                    tanggal_berangkat: b.tanggal_berangkat,
                    tanggal_spt: b.tanggal_spt,
                    tujuan: b.tujuan,
                    nama_kecamatan: b.nama_kecamatan,
                    kepala_dinas_id: b.kepala_dinas_id
                        ? Number(b.kepala_dinas_id)
                        : null,
                    pptk_id: b.pptk_id ? Number(b.pptk_id) : null,
                    bendahara_id: b.bendahara_id ? Number(b.bendahara_id) : null,
                    participants: b.participants.map((pt) => ({
                        pegawai_id: Number(pt.pegawai_id),
                        tanggal_berangkat: pt.tanggal_berangkat,
                        tanggal_spt: pt.tanggal_spt,
                        tujuan: pt.tujuan,
                        nama_kecamatan: pt.nama_kecamatan,
                    })),
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmittingSppd(false);
                    setLastSavedReference(savedRef);
                    setAfterSavePromptOpen(true);
                },
                onError: (errors) => {
                    toast.error(
                        Object.values(errors)[0] ||
                            'Gagal menyimpan data SPPD Dalam Kota.'
                    );
                    setIsSubmittingSppd(false);
                },
            }
        );
    };

    const handleContinueDifferentDateAfterSave = () => {
        const nextDate = addDaysToDateStr(
            lastSavedReference?.tanggal_berangkat || todayStr,
            1
        );
        const nextBatch = createInitialBatch(
            nextDate,
            lastSavedReference?.tanggal_spt || todayStr,
            lastSavedReference?.tujuan || '',
            lastSavedReference?.nama_kecamatan || defaultKecamatan
        );

        if (
            lastSavedReference &&
            lastSavedReference.participantIds.length > 0
        ) {
            nextBatch.participants = lastSavedReference.participantIds.map(
                (pid, idx) => ({
                    uid: `pt-${Date.now()}-${idx + 1}`,
                    pegawai_id: pid,
                    tanggal_berangkat: nextDate,
                    tanggal_spt: lastSavedReference.tanggal_spt,
                    tujuan: lastSavedReference.tujuan,
                    nama_kecamatan: lastSavedReference.nama_kecamatan,
                })
            );
        }

        setBatches([nextBatch]);
        setAfterSavePromptOpen(false);
        toast.info(
            `Silakan sesuaikan Tanggal Berangkat baru (${nextDate}) untuk SPPD berikutnya.`
        );
    };

    const handleResetFreshFormAfterSave = () => {
        setBatches([createInitialBatch()]);
        setAfterSavePromptOpen(false);
    };

    const handleDeleteSppd = (sppd: SppdRecordItem) => {
        if (
            !window.confirm(
                `Hapus data SPPD tujuan Kecamatan ${sppd.nama_kecamatan} (${sppd.tanggal_berangkat_formatted})?`
            )
        ) {
            return;
        }

        router.delete(`/sppd-dalam-kota/sppd/${sppd.id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Data SPPD berhasil dihapus.'),
        });
    };

    // Cetak Dokumen SPT & Kwitansi SPPD Dalam Kota
    const handlePrintSppd = (sppd: SppdRecordItem) => {
        const win = window.open('', '_blank');
        if (!win) {
            toast.error('Mohon izinkan pop-up browser untuk mencetak SPT / SPPD.');
            return;
        }

        const kadin = sppd.kepala_dinas || kepalaDinasList[0];
        const pptk = sppd.pptk || pptkList[0];
        const bendahara = sppd.bendahara || bendaharaList[0];

        const participantRowsHtml = sppd.participants
            .map(
                (pt, idx) => `
            <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td>
                    <strong>${pt.nama}</strong><br/>
                    <span style="font-size:11px;color:#475569;">NIP. ${pt.nip || '-'}</span>
                </td>
                <td>${pt.pangkat || '-'} (${pt.golongan || '-'})</td>
                <td>${pt.jabatan || '-'}</td>
                <td style="text-align:center;">${pt.nama_kecamatan} (${pt.zona || '-'})</td>
                <td style="text-align:right;font-weight:bold;">${formatRupiah(pt.uang_saku)}</td>
                <td style="height:40px;">${idx + 1}. .................</td>
            </tr>
        `
            )
            .join('');

        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>SPT & Daftar Uang Saku SPPD Dalam Kota - ${sppd.nomor_spt}</title>
                <style>
                    body { font-family: Arial, sans-serif; color: #0f172a; margin: 28px; font-size: 12px; line-height: 1.5; }
                    .kop { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 10px; margin-bottom: 18px; }
                    .kop h2 { margin: 0; font-size: 15px; text-transform: uppercase; }
                    .kop h1 { margin: 2px 0; font-size: 18px; text-transform: uppercase; }
                    .kop p { margin: 0; font-size: 11px; }
                    .title { text-align: center; margin-bottom: 16px; }
                    .title h3 { margin: 0; text-decoration: underline; font-size: 14px; }
                    .title p { margin: 2px 0; font-size: 12px; }
                    table.meta { width: 100%; margin-bottom: 14px; }
                    table.meta td { padding: 3px 4px; vertical-align: top; }
                    table.grid { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    table.grid th, table.grid td { border: 1px solid #334155; padding: 6px 8px; font-size: 11.5px; }
                    table.grid th { background: #f1f5f9; text-align: center; }
                    .signs { width: 100%; margin-top: 28px; }
                    .signs td { width: 33.3%; text-align: center; vertical-align: top; }
                    @media print {
                        button.no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div style="text-align:right;margin-bottom:10px;">
                    <button class="no-print" onclick="window.print()" style="padding:6px 14px;background:#006565;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">
                        Cetak Dokumen
                    </button>
                </div>
                <div class="kop">
                    <h2>Pemerintah Kabupaten Indramayu</h2>
                    <h1>Dinas Ketahanan Pangan dan Pertanian</h1>
                    <p>Jl. Raya Pabean Udik No. 1 Indramayu - Jawa Barat</p>
                </div>

                <div class="title">
                    <h3>SURAT PERINTAH TUGAS &amp; DAFTAR PENERIMAAN UANG SAKU SPPD DALAM KOTA</h3>
                    <p>Nomor SPT: <strong>${sppd.nomor_spt}</strong></p>
                </div>

                <table class="meta">
                    <tr>
                        <td style="width:160px;font-weight:bold;">Tanggal SPT</td>
                        <td style="width:15px;">:</td>
                        <td>${sppd.tanggal_spt_formatted}</td>
                        <td style="width:160px;font-weight:bold;">Kecamatan Tujuan</td>
                        <td style="width:15px;">:</td>
                        <td><strong>Kecamatan ${sppd.nama_kecamatan}</strong> (${sppd.zona || '-'})</td>
                    </tr>
                    <tr>
                        <td style="font-weight:bold;">Tanggal Berangkat</td>
                        <td>:</td>
                        <td><strong>${sppd.tanggal_berangkat_formatted}</strong></td>
                        <td style="font-weight:bold;">Total Personil</td>
                        <td>:</td>
                        <td>${sppd.participants.length} Orang</td>
                    </tr>
                    <tr>
                        <td style="font-weight:bold;">Maksud / Tujuan</td>
                        <td>:</td>
                        <td colspan="4">${sppd.tujuan}</td>
                    </tr>
                </table>

                <table class="grid">
                    <thead>
                        <tr>
                            <th style="width:32px;">No</th>
                            <th>Nama Pegawai / NIP</th>
                            <th>Pangkat / Golongan</th>
                            <th>Jabatan</th>
                            <th>Kecamatan (Zona)</th>
                            <th>Uang Saku</th>
                            <th style="width:120px;">Tanda Tangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${participantRowsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colspan="5" style="text-align:right;">TOTAL UANG SAKU PERJALANAN DINAS</th>
                            <th style="text-align:right;font-size:12.5px;">${formatRupiah(sppd.total_uang_saku)}</th>
                            <th></th>
                        </tr>
                    </tfoot>
                </table>

                <table class="signs">
                    <tr>
                        <td>
                            Mengetahui / Menyetujui,<br/>
                            <strong>${kadin?.jabatan || 'Kepala Dinas'}</strong>
                            <br/><br/><br/><br/>
                            <strong><u>${kadin?.nama || '-'}</u></strong><br/>
                            ${kadin?.pangkat ? `${kadin.pangkat} (${kadin.golongan || '-'})<br/>` : ''}
                            NIP. ${kadin?.nip || '-'}
                        </td>
                        <td>
                            Pejabat Pelaksana Teknis Kegiatan,<br/>
                            <strong>${pptk?.jabatan || 'PPTK'}</strong>
                            <br/><br/><br/><br/>
                            <strong><u>${pptk?.nama || '-'}</u></strong><br/>
                            ${pptk?.pangkat ? `${pptk.pangkat} (${pptk.golongan || '-'})<br/>` : ''}
                            NIP. ${pptk?.nip || '-'}
                        </td>
                        <td>
                            Indramayu, ${sppd.tanggal_spt_formatted}<br/>
                            Lunas Dibayar,<br/>
                            <strong>${bendahara?.jabatan || 'Bendahara Pengeluaran'}</strong>
                            <br/><br/><br/>
                            <strong><u>${bendahara?.nama || '-'}</u></strong><br/>
                            ${bendahara?.pangkat ? `${bendahara.pangkat} (${bendahara.golongan || '-'})<br/>` : ''}
                            NIP. ${bendahara?.nip || '-'}
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `);
        win.document.close();
    };

    // =========================================================================
    // 1. STATE MASTER DATA PEGAWAI
    // =========================================================================
    const [pegawaiSearch, setPegawaiSearch] = useState('');
    const [pegawaiModalOpen, setPegawaiModalOpen] = useState(false);
    const [editingPegawai, setEditingPegawai] = useState<PegawaiItem | null>(null);
    const [pNama, setPNama] = useState('');
    const [pNip, setPNip] = useState('');
    const [pPangkat, setPPangkat] = useState('Penata Muda');
    const [pGolongan, setPGolongan] = useState('III/a');
    const [pJabatan, setPJabatan] = useState('');
    const [pTanggalLahir, setPTanggalLahir] = useState('');
    const [isSavingPegawai, setIsSavingPegawai] = useState(false);

    const handleNipChangeWithAutoBirthDate = (val: string) => {
        setPNip(val);
        const extracted = extractBirthDateFromNip(val);
        if (extracted) {
            setPTanggalLahir(extracted);
        }
    };

    const handleGolonganChangeWithAutoPangkat = (gol: string) => {
        setPGolongan(gol);
        const found = GOLONGAN_OPTIONS.find((g) => g.golongan === gol);
        if (found) {
            setPPangkat(found.pangkat);
        }
    };

    const handleOpenCreatePegawai = () => {
        setEditingPegawai(null);
        setPNama('');
        setPNip('');
        setPGolongan('III/a');
        setPPangkat('Penata Muda');
        setPJabatan('');
        setPTanggalLahir('');
        setPegawaiModalOpen(true);
    };

    const handleOpenEditPegawai = (p: PegawaiItem) => {
        setEditingPegawai(p);
        setPNama(p.nama);
        setPNip(p.nip || '');
        setPGolongan(p.golongan || 'III/a');
        setPPangkat(p.pangkat || '');
        setPJabatan(p.jabatan || '');
        setPTanggalLahir(p.tanggal_lahir || '');
        setPegawaiModalOpen(true);
    };

    const handleSavePegawai = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingPegawai(true);

        const payload = {
            nama: pNama.trim(),
            nip: pNip.trim() || null,
            pangkat: pPangkat.trim() || null,
            golongan: pGolongan,
            jabatan: pJabatan.trim(),
            tanggal_lahir: pTanggalLahir || null,
            is_active: true,
        };

        if (editingPegawai) {
            router.put(`/sppd-dalam-kota/pegawai/${editingPegawai.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Data Master Pegawai berhasil diperbarui.');
                    setPegawaiModalOpen(false);
                    setIsSavingPegawai(false);
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] || 'Gagal memperbarui pegawai.');
                    setIsSavingPegawai(false);
                },
            });
        } else {
            router.post('/sppd-dalam-kota/pegawai', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Master Pegawai baru berhasil ditambahkan.');
                    setPegawaiModalOpen(false);
                    setIsSavingPegawai(false);
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] || 'Gagal menambahkan pegawai.');
                    setIsSavingPegawai(false);
                },
            });
        }
    };

    // =========================================================================
    // 2, 3, 4. STATE MASTER DATA PEJABAT (KEPALA DINAS, PPTK, BENDAHARA)
    // =========================================================================
    const [pejabatModalOpen, setPejabatModalOpen] = useState(false);
    const [editingPejabat, setEditingPejabat] = useState<PejabatItem | null>(null);
    const [pjTipe, setPjTipe] = useState<'kepala_dinas' | 'pptk' | 'bendahara'>(
        'kepala_dinas'
    );
    const [pjNama, setPjNama] = useState('');
    const [pjNip, setPjNip] = useState('');
    const [pjPangkat, setPjPangkat] = useState('');
    const [pjGolongan, setPjGolongan] = useState('IV/b');
    const [pjJabatan, setPjJabatan] = useState('');
    const [pjIsActive, setPjIsActive] = useState(true);
    const [isSavingPejabat, setIsSavingPejabat] = useState(false);

    const handleOpenCreatePejabat = (
        tipe: 'kepala_dinas' | 'pptk' | 'bendahara'
    ) => {
        setEditingPejabat(null);
        setPjTipe(tipe);
        setPjNama('');
        setPjNip('');
        setPjGolongan(tipe === 'kepala_dinas' ? 'IV/c' : 'III/d');
        setPjPangkat(
            tipe === 'kepala_dinas' ? 'Pembina Utama Muda' : 'Penata Tingkat I'
        );
        setPjJabatan(
            tipe === 'kepala_dinas'
                ? 'Kepala Dinas Ketahanan Pangan dan Pertanian'
                : tipe === 'pptk'
                  ? 'Pejabat Pelaksana Teknis Kegiatan (PPTK)'
                  : 'Bendahara Pengeluaran DKPP'
        );
        setPjIsActive(true);
        setPejabatModalOpen(true);
    };

    const handleOpenEditPejabat = (pj: PejabatItem) => {
        setEditingPejabat(pj);
        setPjTipe(pj.tipe);
        setPjNama(pj.nama);
        setPjNip(pj.nip || '');
        setPjPangkat(pj.pangkat || '');
        setPjGolongan(pj.golongan || 'III/d');
        setPjJabatan(pj.jabatan || '');
        setPjIsActive(pj.is_active);
        setPejabatModalOpen(true);
    };

    const handleFillPejabatFromPegawai = (pegawaiIdStr: string) => {
        const peg = pegawais.find((p) => String(p.id) === pegawaiIdStr);
        if (!peg) return;
        setPjNama(peg.nama);
        setPjNip(peg.nip || '');
        setPjPangkat(peg.pangkat || '');
        setPjGolongan(peg.golongan || 'III/d');
        if (peg.jabatan) {
            setPjJabatan(peg.jabatan);
        }
    };

    const handleSavePejabat = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingPejabat(true);

        const payload = {
            tipe: pjTipe,
            nama: pjNama.trim(),
            nip: pjNip.trim() || null,
            pangkat: pjPangkat.trim() || null,
            golongan: pjGolongan,
            jabatan: pjJabatan.trim(),
            is_active: pjIsActive,
        };

        if (editingPejabat) {
            router.put(`/sppd-dalam-kota/pejabat/${editingPejabat.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Data Master Pejabat berhasil diperbarui.');
                    setPejabatModalOpen(false);
                    setIsSavingPejabat(false);
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] || 'Gagal memperbarui pejabat.');
                    setIsSavingPejabat(false);
                },
            });
        } else {
            router.post('/sppd-dalam-kota/pejabat', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Master Pejabat baru berhasil ditambahkan.');
                    setPejabatModalOpen(false);
                    setIsSavingPejabat(false);
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] || 'Gagal menambahkan pejabat.');
                    setIsSavingPejabat(false);
                },
            });
        }
    };

    // =========================================================================
    // 5. STATE MASTER DATA ZONASI
    // =========================================================================
    const [zonasiSearch, setZonasiSearch] = useState('');
    const [zonasiZonaFilter, setZonasiZonaFilter] = useState('all');
    const [zonasiGolFilter, setZonasiGolFilter] = useState('all');
    const [zonasiModalOpen, setZonasiModalOpen] = useState(false);
    const [editingZonasi, setEditingZonasi] = useState<ZonasiItem | null>(null);
    const [zKecamatan, setZKecamatan] = useState('');
    const [zZona, setZZona] = useState('Zona I');
    const [zGolongan, setZGolongan] = useState('Golongan III');
    const [zUangSaku, setZUangSaku] = useState('150000');
    const [isSavingZonasi, setIsSavingZonasi] = useState(false);

    const filteredZonasis = useMemo(() => {
        return zonasis.filter((z) => {
            const q = zonasiSearch.trim().toLowerCase();
            const matchQ =
                q === '' ||
                z.nama_kecamatan.toLowerCase().includes(q) ||
                z.zona.toLowerCase().includes(q) ||
                z.golongan.toLowerCase().includes(q);
            const matchZona =
                zonasiZonaFilter === 'all' || z.zona === zonasiZonaFilter;
            const matchGol =
                zonasiGolFilter === 'all' || z.golongan === zonasiGolFilter;
            return matchQ && matchZona && matchGol;
        });
    }, [zonasis, zonasiSearch, zonasiZonaFilter, zonasiGolFilter]);

    const handleOpenCreateZonasi = () => {
        setEditingZonasi(null);
        setZKecamatan('');
        setZZona('Zona I');
        setZGolongan('Golongan III');
        setZUangSaku('150000');
        setZonasiModalOpen(true);
    };

    const handleOpenEditZonasi = (z: ZonasiItem) => {
        setEditingZonasi(z);
        setZKecamatan(z.nama_kecamatan);
        setZZona(z.zona);
        setZGolongan(z.golongan);
        setZUangSaku(String(z.uang_saku));
        setZonasiModalOpen(true);
    };

    const handleSaveZonasi = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingZonasi(true);

        const payload = {
            nama_kecamatan: zKecamatan.trim(),
            zona: zZona,
            golongan: zGolongan,
            uang_saku: Number(zUangSaku) || 0,
        };

        if (editingZonasi) {
            router.put(`/sppd-dalam-kota/zonasi/${editingZonasi.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Master Zonasi berhasil diperbarui.');
                    setZonasiModalOpen(false);
                    setIsSavingZonasi(false);
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] || 'Gagal memperbarui zonasi.');
                    setIsSavingZonasi(false);
                },
            });
        } else {
            router.post('/sppd-dalam-kota/zonasi', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Master Zonasi berhasil disimpan.');
                    setZonasiModalOpen(false);
                    setIsSavingZonasi(false);
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] || 'Gagal menyimpan zonasi.');
                    setIsSavingZonasi(false);
                },
            });
        }
    };

    const filteredPegawais = useMemo(() => {
        const q = pegawaiSearch.trim().toLowerCase();
        if (!q) return pegawais;
        return pegawais.filter(
            (p) =>
                p.nama.toLowerCase().includes(q) ||
                (p.nip && p.nip.toLowerCase().includes(q)) ||
                (p.jabatan && p.jabatan.toLowerCase().includes(q)) ||
                (p.golongan && p.golongan.toLowerCase().includes(q))
        );
    }, [pegawais, pegawaiSearch]);

    const filteredSppdRecords = useMemo(() => {
        const q = sppdSearch.trim().toLowerCase();
        if (!q) return sppdRecords;
        return sppdRecords.filter(
            (s) =>
                s.tujuan.toLowerCase().includes(q) ||
                s.nama_kecamatan.toLowerCase().includes(q) ||
                s.nomor_spt.toLowerCase().includes(q) ||
                s.participants.some((pt) => pt.nama.toLowerCase().includes(q))
        );
    }, [sppdRecords, sppdSearch]);

    // Render Reusable Pejabat Master Card (Kepala Dinas / PPTK / Bendahara)
    const renderPejabatSection = (
        tipe: 'kepala_dinas' | 'pptk' | 'bendahara',
        title: string,
        subtitle: string,
        list: PejabatItem[]
    ) => (
        <Card className="border-sidebar-border/70 shadow-xs">
            <CardHeader className="border-b border-neutral-100 pb-4 dark:border-neutral-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-base font-extrabold">
                            {title}
                        </CardTitle>
                        <p className="text-xs text-neutral-500">{subtitle}</p>
                    </div>
                    <Button
                        onClick={() => handleOpenCreatePejabat(tipe)}
                        className="gap-1.5 bg-[#006565] text-xs text-white hover:bg-[#005252]"
                    >
                        <Plus className="size-4" />
                        Tambah {title.replace('Master Data ', '')}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[11px] font-bold tracking-wider text-neutral-500 uppercase dark:border-neutral-800 dark:bg-neutral-900/50">
                                <th className="px-4 py-3 text-center w-12">No</th>
                                <th className="px-4 py-3">Nama Lengkap</th>
                                <th className="px-4 py-3">NIP</th>
                                <th className="px-4 py-3">Pangkat &amp; Golongan</th>
                                <th className="px-4 py-3">Jabatan</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {list.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-8 text-center text-neutral-400"
                                    >
                                        Belum ada data {title}.
                                    </td>
                                </tr>
                            ) : (
                                list.map((pj, idx) => (
                                    <tr
                                        key={pj.id}
                                        className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40"
                                    >
                                        <td className="px-4 py-3 text-center font-semibold text-neutral-400">
                                            {idx + 1}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-neutral-900 dark:text-neutral-100">
                                            {pj.nama}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400">
                                            {pj.nip || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                                {pj.pangkat || '-'}
                                            </span>{' '}
                                            <Badge
                                                variant="outline"
                                                className="ml-1 border-teal-300 bg-teal-50 text-teal-800 font-bold"
                                            >
                                                {pj.golongan || '-'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                                            {pj.jabatan || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {pj.is_active ? (
                                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                                    Aktif
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">
                                                    Non-aktif
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleOpenEditPejabat(pj)
                                                    }
                                                    className="h-7 px-2 text-xs"
                                                >
                                                    <Edit3 className="size-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                `Hapus ${pj.nama}?`
                                                            )
                                                        ) {
                                                            router.delete(
                                                                `/sppd-dalam-kota/pejabat/${pj.id}`,
                                                                {
                                                                    preserveScroll: true,
                                                                }
                                                            );
                                                        }
                                                    }}
                                                    className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
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
    );

    return (
        <>
            <Head title="SPPD Dalam Kota & Master Perjalanan Dinas - DKPP Indramayu" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* ========================================================= */}
                {/* HEADER SECTION                                            */}
                {/* ========================================================= */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-xl bg-[#006565] text-white shadow-sm">
                            <Briefcase className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                Modul SPPD Dalam Kota &amp; Master Perjalanan Dinas
                            </h1>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Pengelolaan SPT/SPPD Dalam Daerah, Master Pegawai (Tanggal Lahir otomatis dari NIP), Kepala Dinas, PPTK, Bendahara, dan Zonasi Uang Saku.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handleOpenCreatePegawai}
                            className="gap-1.5 border-teal-300 text-teal-800 hover:bg-teal-50"
                        >
                            <UserPlus className="size-4" />
                            Tambah Pegawai
                        </Button>
                        <Button
                            onClick={() => {
                                setActiveTab('sppd');
                                handleAddDifferentDateBatch();
                            }}
                            className="gap-1.5 bg-[#006565] text-white hover:bg-[#005252]"
                        >
                            <CalendarPlus className="size-4" />
                            Tambah SPPD Tanggal Berbeda
                        </Button>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* KPI SUMMARY CARDS                                         */}
                {/* ========================================================= */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-neutral-500">
                                Total Dokumen SPPD
                            </CardTitle>
                            <FileCheck2 className="size-4 text-[#006565]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {statistics.total_sppd} SPT/SPPD
                            </div>
                            <p className="mt-1 text-xs text-neutral-500">
                                {statistics.total_personil_berangkat} total keberangkatan personil
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-teal-200 bg-teal-50/40 dark:border-teal-950/60 dark:bg-teal-950/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-teal-700">
                                Master Data Pegawai
                            </CardTitle>
                            <Users className="size-4 text-teal-700" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-teal-800 dark:text-teal-300">
                                {statistics.total_pegawai} Pegawai
                            </div>
                            <p className="mt-1 text-xs text-teal-700/80">
                                Tanggal lahir otomatis terdeteksi dari NIP
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50/40 dark:border-blue-950/60 dark:bg-blue-950/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-blue-600">
                                Cakupan Master Zonasi
                            </CardTitle>
                            <MapPin className="size-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                {statistics.total_kecamatan_zonasi} Kecamatan
                            </div>
                            <p className="mt-1 text-xs text-blue-600/80">
                                {zonasis.length} tarif uang saku per Zona &amp; Golongan
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-amber-200 bg-amber-50/40 dark:border-amber-950/60 dark:bg-amber-950/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-amber-700">
                                Total Uang Saku Tercatat
                            </CardTitle>
                            <Wallet className="size-4 text-amber-700" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-800 dark:text-amber-300">
                                {formatRupiah(statistics.total_anggaran_uang_saku)}
                            </div>
                            <p className="mt-1 text-xs text-amber-700/80">
                                Otomatis dihitung sesuai Zonasi &amp; Golongan
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ========================================================= */}
                {/* 6 TAB NAVIGATION BAR                                      */}
                {/* ========================================================= */}
                <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-neutral-100 p-1.5 dark:bg-neutral-900">
                    <button
                        type="button"
                        onClick={() => setActiveTab('sppd')}
                        className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                            activeTab === 'sppd'
                                ? 'bg-[#006565] text-white shadow-xs'
                                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                        }`}
                    >
                        <FileText className="size-4" />
                        <span>Form Input &amp; Data SPPD Dalam Kota</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('pegawai')}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'pegawai'
                                ? 'bg-white text-[#006565] shadow-xs ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-teal-300'
                                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                        }`}
                    >
                        <Users className="size-3.5" />
                        <span>1. Master Pegawai ({pegawais.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('kepala_dinas')}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'kepala_dinas'
                                ? 'bg-white text-[#006565] shadow-xs ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-teal-300'
                                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                        }`}
                    >
                        <Award className="size-3.5" />
                        <span>2. Master Kepala Dinas ({kepalaDinasList.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('pptk')}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'pptk'
                                ? 'bg-white text-[#006565] shadow-xs ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-teal-300'
                                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                        }`}
                    >
                        <UserCheck className="size-3.5" />
                        <span>3. Master PPTK ({pptkList.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('bendahara')}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'bendahara'
                                ? 'bg-white text-[#006565] shadow-xs ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-teal-300'
                                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                        }`}
                    >
                        <Coins className="size-3.5" />
                        <span>4. Master Bendahara ({bendaharaList.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('zonasi')}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'zonasi'
                                ? 'bg-white text-[#006565] shadow-xs ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-teal-300'
                                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                        }`}
                    >
                        <MapPin className="size-3.5" />
                        <span>5. Master Zonasi ({zonasis.length})</span>
                    </button>
                </div>

                {/* ========================================================= */}
                {/* TAB UTAMA: FORM INPUT SPPD & DAFTAR SPPD DALAM KOTA       */}
                {/* ========================================================= */}
                {activeTab === 'sppd' && (
                    <div className="space-y-6">
                        <form onSubmit={handleSubmitSppd} className="space-y-4">
                            {batches.map((batch, batchIdx) => {
                                const batchTotalUangSaku = batch.participants.reduce(
                                    (acc, pt) =>
                                        acc +
                                        getTarifInfo(
                                            pt.pegawai_id,
                                            pt.nama_kecamatan
                                        ).uang_saku,
                                    0
                                );

                                return (
                                    <Card
                                        key={batch.uid}
                                        className="border-2 border-teal-200/90 shadow-xs dark:border-teal-900/70"
                                    >
                                        <CardHeader className="border-b border-teal-100 bg-gradient-to-r from-teal-50/80 via-white to-emerald-50/40 pb-3.5 dark:border-teal-900/50 dark:from-teal-950/30 dark:via-neutral-900">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="inline-flex items-center justify-center rounded-lg bg-[#006565] px-2.5 py-1 text-xs font-extrabold text-white">
                                                        Form SPPD #{batchIdx + 1}
                                                    </span>
                                                    <div>
                                                        <CardTitle className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
                                                            Input Perjalanan Dinas Dalam Kota (
                                                            {batch.participants.length} Orang)
                                                        </CardTitle>
                                                        <p className="text-[11px] text-neutral-500">
                                                            Isi data keberangkatan. Klik{' '}
                                                            <strong>
                                                                &ldquo;+ Tambah Orang Kedua&rdquo;
                                                            </strong>{' '}
                                                            untuk menambah personil dengan tanggal, SPT, tujuan &amp; kecamatan yang sama.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-xs font-extrabold">
                                                        Estimasi Total Uang Saku:{' '}
                                                        {formatRupiah(batchTotalUangSaku)}
                                                    </Badge>
                                                    {batches.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleRemoveBatch(batchIdx)
                                                            }
                                                            className="h-8 gap-1 text-xs text-rose-600 hover:bg-rose-50"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                            Hapus SPPD #{batchIdx + 1}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-4 pt-4">
                                            {/* Daftar Orang (Orang ke-1, Orang ke-2 dengan isian yang sama, dst.) */}
                                            <div className="space-y-3">
                                                {batch.participants.map((pt, ptIdx) => {
                                                    const tarifInfo = getTarifInfo(
                                                        pt.pegawai_id,
                                                        pt.nama_kecamatan
                                                    );
                                                    const peg = tarifInfo.pegawai;

                                                    return (
                                                        <div
                                                            key={pt.uid}
                                                            className={`rounded-xl border p-3.5 transition-all ${
                                                                ptIdx === 0
                                                                    ? 'border-teal-300/90 bg-white dark:border-teal-800 dark:bg-neutral-900'
                                                                    : 'border-amber-300/90 bg-amber-50/30 dark:border-amber-800/70 dark:bg-amber-950/10'
                                                            }`}
                                                        >
                                                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-2 dark:border-neutral-800">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span
                                                                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-extrabold ${
                                                                            ptIdx === 0
                                                                                ? 'bg-teal-100 text-[#006565]'
                                                                                : 'bg-amber-100 text-amber-900'
                                                                        }`}
                                                                    >
                                                                        Orang ke-{ptIdx + 1}
                                                                        {ptIdx > 0 &&
                                                                            ' (Isian Mengikuti Orang ke-1)'}
                                                                    </span>

                                                                    {peg && (
                                                                        <span className="text-[11px] text-neutral-500">
                                                                            NIP:{' '}
                                                                            <strong className="font-mono text-neutral-700 dark:text-neutral-300">
                                                                                {peg.nip || '-'}
                                                                            </strong>{' '}
                                                                            &bull; Golongan:{' '}
                                                                            <strong className="text-[#006565]">
                                                                                {peg.golongan} (
                                                                                {peg.pangkat})
                                                                            </strong>{' '}
                                                                            &bull; Jabatan:{' '}
                                                                            <strong>
                                                                                {peg.jabatan}
                                                                            </strong>
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800">
                                                                        <span>
                                                                            {tarifInfo.zona}
                                                                        </span>
                                                                        <span>&bull;</span>
                                                                        <span>
                                                                            Uang Saku:{' '}
                                                                            {formatRupiah(
                                                                                tarifInfo.uang_saku
                                                                            )}
                                                                        </span>
                                                                    </span>

                                                                    {batch.participants.length >
                                                                        1 && (
                                                                        <Button
                                                                            type="button"
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() =>
                                                                                handleRemoveParticipant(
                                                                                    batchIdx,
                                                                                    ptIdx
                                                                                )
                                                                            }
                                                                            className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
                                                                            title="Hapus baris orang ini"
                                                                        >
                                                                            <Trash2 className="size-3.5" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* 5 Kolom Input Sesuai Permintaan: Nama Pegawai, Tanggal Berangkat, Tanggal SPT, Tujuan, Kecamatan */}
                                                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
                                                                {/* 1. Nama Pegawai */}
                                                                <div className="space-y-1 lg:col-span-3">
                                                                    <Label className="text-xs font-bold">
                                                                        1. Nama Pegawai *
                                                                    </Label>
                                                                    <Select
                                                                        value={pt.pegawai_id}
                                                                        onValueChange={(v) =>
                                                                            handleUpdateParticipantField(
                                                                                batchIdx,
                                                                                ptIdx,
                                                                                'pegawai_id',
                                                                                v
                                                                            )
                                                                        }
                                                                    >
                                                                        <SelectTrigger className="h-9 text-xs">
                                                                            <SelectValue placeholder="Pilih Pegawai" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {pegawais.map((p) => (
                                                                                <SelectItem
                                                                                    key={p.id}
                                                                                    value={String(
                                                                                        p.id
                                                                                    )}
                                                                                >
                                                                                    {p.nama} (
                                                                                    {p.golongan})
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>

                                                                {/* 2. Tanggal Berangkat */}
                                                                <div className="space-y-1 lg:col-span-2">
                                                                    <Label className="text-xs font-bold">
                                                                        2. Tanggal Berangkat *
                                                                    </Label>
                                                                    <Input
                                                                        type="date"
                                                                        value={
                                                                            pt.tanggal_berangkat
                                                                        }
                                                                        onChange={(e) =>
                                                                            handleUpdateParticipantField(
                                                                                batchIdx,
                                                                                ptIdx,
                                                                                'tanggal_berangkat',
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        className="h-9 text-xs"
                                                                        required
                                                                    />
                                                                </div>

                                                                {/* 3. Tanggal SPT */}
                                                                <div className="space-y-1 lg:col-span-2">
                                                                    <Label className="text-xs font-bold">
                                                                        3. Tanggal SPT *
                                                                    </Label>
                                                                    <Input
                                                                        type="date"
                                                                        value={pt.tanggal_spt}
                                                                        onChange={(e) =>
                                                                            handleUpdateParticipantField(
                                                                                batchIdx,
                                                                                ptIdx,
                                                                                'tanggal_spt',
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        className="h-9 text-xs"
                                                                        required
                                                                    />
                                                                </div>

                                                                {/* 4. Tujuan */}
                                                                <div className="space-y-1 lg:col-span-3">
                                                                    <Label className="text-xs font-bold">
                                                                        4. Tujuan Perjalanan Dinas *
                                                                    </Label>
                                                                    <Input
                                                                        value={pt.tujuan}
                                                                        onChange={(e) =>
                                                                            handleUpdateParticipantField(
                                                                                batchIdx,
                                                                                ptIdx,
                                                                                'tujuan',
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        placeholder="Contoh: Monitoring Harga & Stok Pangan"
                                                                        className="h-9 text-xs"
                                                                        required
                                                                    />
                                                                </div>

                                                                {/* 5. Kecamatan */}
                                                                <div className="space-y-1 lg:col-span-2">
                                                                    <Label className="text-xs font-bold">
                                                                        5. Kecamatan *
                                                                    </Label>
                                                                    <Select
                                                                        value={pt.nama_kecamatan}
                                                                        onValueChange={(v) =>
                                                                            handleUpdateParticipantField(
                                                                                batchIdx,
                                                                                ptIdx,
                                                                                'nama_kecamatan',
                                                                                v
                                                                            )
                                                                        }
                                                                    >
                                                                        <SelectTrigger className="h-9 text-xs">
                                                                            <SelectValue placeholder="Pilih Kecamatan" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {kecamatanOptions.map(
                                                                                (k) => (
                                                                                    <SelectItem
                                                                                        key={
                                                                                            k.nama_kecamatan
                                                                                        }
                                                                                        value={
                                                                                            k.nama_kecamatan
                                                                                        }
                                                                                    >
                                                                                        {
                                                                                            k.nama_kecamatan
                                                                                        }{' '}
                                                                                        ({k.zona})
                                                                                    </SelectItem>
                                                                                )
                                                                            )}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Baris Tombol "+ Tambah Orang yang Kedua dengan Isian yang Sama" & Pilihan Pejabat */}
                                            <div className="flex flex-col gap-3 rounded-xl bg-neutral-50 p-3 sm:flex-row sm:items-center sm:justify-between dark:bg-neutral-900">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleAddSameTripPerson(batchIdx)
                                                    }
                                                    className="gap-2 border-[#006565] bg-teal-50/70 font-extrabold text-[#006565] hover:bg-teal-100/80"
                                                >
                                                    <UserPlus className="size-4" />
                                                    + Tambah Orang ke-
                                                    {batch.participants.length + 1} dengan Isian yang Sama
                                                </Button>

                                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                                    <Input
                                                        value={batch.nomor_spt}
                                                        onChange={(e) =>
                                                            handleUpdatePrimaryTripField(
                                                                batchIdx,
                                                                'nomor_spt',
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="No. SPT (Kosongkan = Otomatis)"
                                                        className="h-8 w-52 text-xs bg-white"
                                                    />

                                                    <Select
                                                        value={batch.kepala_dinas_id}
                                                        onValueChange={(v) =>
                                                            handleUpdatePrimaryTripField(
                                                                batchIdx,
                                                                'kepala_dinas_id',
                                                                v
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 w-48 text-xs bg-white">
                                                            <SelectValue placeholder="Kepala Dinas" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {kepalaDinasList.map((k) => (
                                                                <SelectItem
                                                                    key={k.id}
                                                                    value={String(k.id)}
                                                                >
                                                                    Kadin: {k.nama}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    <Select
                                                        value={batch.pptk_id}
                                                        onValueChange={(v) =>
                                                            handleUpdatePrimaryTripField(
                                                                batchIdx,
                                                                'pptk_id',
                                                                v
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 w-44 text-xs bg-white">
                                                            <SelectValue placeholder="PPTK" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {pptkList.map((p) => (
                                                                <SelectItem
                                                                    key={p.id}
                                                                    value={String(p.id)}
                                                                >
                                                                    PPTK: {p.nama}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    <Select
                                                        value={batch.bendahara_id}
                                                        onValueChange={(v) =>
                                                            handleUpdatePrimaryTripField(
                                                                batchIdx,
                                                                'bendahara_id',
                                                                v
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 w-44 text-xs bg-white">
                                                            <SelectValue placeholder="Bendahara" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {bendaharaList.map((b) => (
                                                                <SelectItem
                                                                    key={b.id}
                                                                    value={String(b.id)}
                                                                >
                                                                    Bendahara: {b.nama}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}

                            {/* Action Footer: Tambah SPPD Lagi di Tanggal Berbeda & Simpan */}
                            <div className="flex flex-col gap-3 rounded-2xl border border-teal-200 bg-teal-50/50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-teal-900 dark:bg-teal-950/20">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAddDifferentDateBatch}
                                        className="gap-2 border-amber-400 bg-amber-50 font-extrabold text-amber-900 hover:bg-amber-100"
                                    >
                                        <CalendarPlus className="size-4" />
                                        + Tambah SPPD Lagi di Tanggal yang Berbeda
                                    </Button>
                                    <span className="text-xs text-neutral-500">
                                        Anda dapat menginput beberapa tanggal keberangkatan sekaligus atau menambahkannya setelah menyimpan.
                                    </span>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmittingSppd}
                                    className="gap-2 bg-[#006565] px-6 font-extrabold text-white shadow-sm hover:bg-[#005252]"
                                >
                                    <Save className="size-4" />
                                    {isSubmittingSppd
                                        ? 'Menyimpan SPPD...'
                                        : `Simpan ${batches.length} Dokumen SPPD`}
                                </Button>
                            </div>
                        </form>

                        {/* Tabel Daftar Riwayat SPPD Dalam Kota */}
                        <Card className="border-sidebar-border/70 shadow-xs">
                            <CardHeader className="border-b border-neutral-100 pb-4 dark:border-neutral-800">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <CardTitle className="text-base font-extrabold">
                                            Daftar SPPD Dalam Kota Tersimpan ({filteredSppdRecords.length})
                                        </CardTitle>
                                        <p className="text-xs text-neutral-500">
                                            Klik tombol Cetak untuk mencetak Surat Perintah Tugas (SPT) &amp; Daftar Penerimaan Uang Saku.
                                        </p>
                                    </div>
                                    <div className="relative w-full sm:w-72">
                                        <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-neutral-400" />
                                        <Input
                                            placeholder="Cari pegawai, kecamatan, tujuan..."
                                            value={sppdSearch}
                                            onChange={(e) => setSppdSearch(e.target.value)}
                                            className="h-9 pl-9 text-xs"
                                        />
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[11px] font-bold tracking-wider text-neutral-500 uppercase dark:border-neutral-800 dark:bg-neutral-900/50">
                                                <th className="px-4 py-3 text-center w-12">No</th>
                                                <th className="px-4 py-3">Tanggal &amp; No. SPT</th>
                                                <th className="px-4 py-3">Kecamatan &amp; Tujuan</th>
                                                <th className="px-4 py-3">Daftar Pegawai Berangkat</th>
                                                <th className="px-4 py-3 text-right">Total Uang Saku</th>
                                                <th className="px-4 py-3 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                            {filteredSppdRecords.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="px-4 py-10 text-center text-neutral-400"
                                                    >
                                                        Belum ada data SPPD Dalam Kota yang tersimpan. Silakan input melalui form di atas.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredSppdRecords.map((sppd, idx) => (
                                                    <tr
                                                        key={sppd.id}
                                                        className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40"
                                                    >
                                                        <td className="px-4 py-3 text-center font-semibold text-neutral-400">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="font-extrabold text-[#006565] dark:text-teal-400">
                                                                Berangkat: {sppd.tanggal_berangkat_formatted}
                                                            </div>
                                                            <div className="text-[11px] text-neutral-500">
                                                                Tgl SPT: {sppd.tanggal_spt_formatted}
                                                            </div>
                                                            <div className="font-mono text-[10px] text-neutral-400">
                                                                {sppd.nomor_spt}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                                                                    Kec. {sppd.nama_kecamatan}
                                                                </span>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-blue-300 bg-blue-50 text-blue-800 text-[10px] font-bold"
                                                                >
                                                                    {sppd.zona}
                                                                </Badge>
                                                            </div>
                                                            <div className="mt-0.5 text-neutral-600 dark:text-neutral-300">
                                                                {sppd.tujuan}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="space-y-1">
                                                                {sppd.participants.map((pt) => (
                                                                    <div
                                                                        key={pt.id}
                                                                        className="flex items-center justify-between gap-2 rounded-lg bg-neutral-50 px-2.5 py-1 dark:bg-neutral-900"
                                                                    >
                                                                        <div>
                                                                            <span className="font-bold text-neutral-800 dark:text-neutral-200">
                                                                                {pt.urutan}. {pt.nama}
                                                                            </span>{' '}
                                                                            <span className="text-[10px] text-neutral-500">
                                                                                ({pt.golongan})
                                                                            </span>
                                                                        </div>
                                                                        <span className="font-mono text-[11px] font-bold text-emerald-700">
                                                                            {formatRupiah(pt.uang_saku)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-extrabold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                                                            {formatRupiah(sppd.total_uang_saku)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                                            <div className="inline-flex items-center gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handlePrintSppd(sppd)}
                                                                    className="h-7 gap-1 px-2.5 text-xs border-teal-300 text-[#006565] hover:bg-teal-50"
                                                                >
                                                                    <Printer className="size-3.5" />
                                                                    Cetak SPT
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleDeleteSppd(sppd)}
                                                                    className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
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
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 1: MASTER DATA PEGAWAI (TANGGAL LAHIR OTOMATIS NIP)   */}
                {/* ========================================================= */}
                {activeTab === 'pegawai' && (
                    <Card className="border-sidebar-border/70 shadow-xs">
                        <CardHeader className="border-b border-neutral-100 pb-4 dark:border-neutral-800">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-base font-extrabold">
                                        1. Master Data Pegawai ({filteredPegawais.length})
                                    </CardTitle>
                                    <p className="text-xs text-neutral-500">
                                        Nama, NIP, Pangkat, Golongan, Jabatan, dan Tanggal Lahir yang terisi otomatis dari 8 digit pertama NIP.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative w-64">
                                        <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-neutral-400" />
                                        <Input
                                            placeholder="Cari nama, NIP, jabatan..."
                                            value={pegawaiSearch}
                                            onChange={(e) =>
                                                setPegawaiSearch(e.target.value)
                                            }
                                            className="h-9 pl-9 text-xs"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleOpenCreatePegawai}
                                        className="gap-1.5 bg-[#006565] text-xs text-white hover:bg-[#005252]"
                                    >
                                        <Plus className="size-4" />
                                        Tambah Master Pegawai
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[11px] font-bold tracking-wider text-neutral-500 uppercase dark:border-neutral-800 dark:bg-neutral-900/50">
                                            <th className="px-4 py-3 text-center w-12">No</th>
                                            <th className="px-4 py-3">Nama Pegawai</th>
                                            <th className="px-4 py-3">NIP</th>
                                            <th className="px-4 py-3">Pangkat &amp; Golongan</th>
                                            <th className="px-4 py-3">Jabatan</th>
                                            <th className="px-4 py-3">
                                                Tanggal Lahir (Otomatis NIP)
                                            </th>
                                            <th className="px-4 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {filteredPegawais.map((p, idx) => (
                                            <tr
                                                key={p.id}
                                                className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40"
                                            >
                                                <td className="px-4 py-3 text-center font-semibold text-neutral-400">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-4 py-3 font-bold text-neutral-900 dark:text-neutral-100">
                                                    {p.nama}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400">
                                                    {p.nip || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-semibold">
                                                        {p.pangkat || '-'}
                                                    </span>{' '}
                                                    <Badge
                                                        variant="outline"
                                                        className="ml-1 border-teal-300 bg-teal-50 text-teal-800 font-bold"
                                                    >
                                                        {p.golongan}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                                                    {p.jabatan}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                                                        <Calendar className="size-3" />
                                                        {p.tanggal_lahir_formatted}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="inline-flex items-center gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleOpenEditPegawai(p)
                                                            }
                                                            className="h-7 px-2 text-xs"
                                                        >
                                                            <Edit3 className="size-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                if (
                                                                    window.confirm(
                                                                        `Hapus pegawai ${p.nama}?`
                                                                    )
                                                                ) {
                                                                    router.delete(
                                                                        `/sppd-dalam-kota/pegawai/${p.id}`,
                                                                        {
                                                                            preserveScroll: true,
                                                                        }
                                                                    );
                                                                }
                                                            }}
                                                            className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ========================================================= */}
                {/* TAB 2: MASTER DATA KEPALA DINAS                           */}
                {/* ========================================================= */}
                {activeTab === 'kepala_dinas' &&
                    renderPejabatSection(
                        'kepala_dinas',
                        '2. Master Data Kepala Dinas',
                        'Pejabat penandatangan Surat Perintah Tugas (SPT) dan persetujuan SPPD Dalam Kota.',
                        kepalaDinasList
                    )}

                {/* ========================================================= */}
                {/* TAB 3: MASTER DATA PPTK                                   */}
                {/* ========================================================= */}
                {activeTab === 'pptk' &&
                    renderPejabatSection(
                        'pptk',
                        '3. Master Data PPTK',
                        'Pejabat Pelaksana Teknis Kegiatan (PPTK) penanggung jawab kegiatan perjalanan dinas.',
                        pptkList
                    )}

                {/* ========================================================= */}
                {/* TAB 4: MASTER DATA BENDAHARA                              */}
                {/* ========================================================= */}
                {activeTab === 'bendahara' &&
                    renderPejabatSection(
                        'bendahara',
                        '4. Master Data Bendahara',
                        'Bendahara Pengeluaran penandatangan pencairan uang saku perjalanan dinas.',
                        bendaharaList
                    )}

                {/* ========================================================= */}
                {/* TAB 5: MASTER DATA ZONASI                                 */}
                {/* ========================================================= */}
                {activeTab === 'zonasi' && (
                    <Card className="border-sidebar-border/70 shadow-xs">
                        <CardHeader className="border-b border-neutral-100 pb-4 dark:border-neutral-800">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <CardTitle className="text-base font-extrabold">
                                        5. Master Data Zonasi &amp; Tarif Uang Saku ({filteredZonasis.length})
                                    </CardTitle>
                                    <p className="text-xs text-neutral-500">
                                        Pengaturan Nama Kecamatan, Zona Wilayah, Golongan, dan Besaran Uang Saku Harian SPPD Dalam Kota.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative w-56">
                                        <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-neutral-400" />
                                        <Input
                                            placeholder="Cari kecamatan..."
                                            value={zonasiSearch}
                                            onChange={(e) =>
                                                setZonasiSearch(e.target.value)
                                            }
                                            className="h-9 pl-9 text-xs"
                                        />
                                    </div>

                                    <Select
                                        value={zonasiZonaFilter}
                                        onValueChange={setZonasiZonaFilter}
                                    >
                                        <SelectTrigger className="h-9 w-36 text-xs">
                                            <SelectValue placeholder="Semua Zona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Zona</SelectItem>
                                            {ZONA_OPTIONS.map((zn) => (
                                                <SelectItem key={zn} value={zn}>
                                                    {zn}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={zonasiGolFilter}
                                        onValueChange={setZonasiGolFilter}
                                    >
                                        <SelectTrigger className="h-9 w-40 text-xs">
                                            <SelectValue placeholder="Semua Golongan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Semua Golongan
                                            </SelectItem>
                                            {ZONASI_GOLONGAN_OPTIONS.map((g) => (
                                                <SelectItem key={g} value={g}>
                                                    {g}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Button
                                        onClick={handleOpenCreateZonasi}
                                        className="gap-1.5 bg-[#006565] text-xs text-white hover:bg-[#005252]"
                                    >
                                        <Plus className="size-4" />
                                        Tambah Tarif Zonasi
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto max-h-[540px]">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead className="sticky top-0 z-10 bg-neutral-100 dark:bg-neutral-900">
                                        <tr className="border-b border-neutral-200 text-[11px] font-bold tracking-wider text-neutral-500 uppercase">
                                            <th className="px-4 py-3 text-center w-12">No</th>
                                            <th className="px-4 py-3">Nama Kecamatan</th>
                                            <th className="px-4 py-3">Zona</th>
                                            <th className="px-4 py-3">Golongan</th>
                                            <th className="px-4 py-3 text-right">
                                                Uang Saku (Rp)
                                            </th>
                                            <th className="px-4 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {filteredZonasis.map((z, idx) => (
                                            <tr
                                                key={z.id}
                                                className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40"
                                            >
                                                <td className="px-4 py-2.5 text-center font-semibold text-neutral-400">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-4 py-2.5 font-bold text-neutral-900 dark:text-neutral-100">
                                                    Kecamatan {z.nama_kecamatan}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            z.zona === 'Zona I'
                                                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                                                : z.zona === 'Zona II'
                                                                  ? 'border-blue-300 bg-blue-50 text-blue-800'
                                                                  : 'border-amber-300 bg-amber-50 text-amber-800'
                                                        }
                                                    >
                                                        {z.zona}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-2.5 font-semibold">
                                                    {z.golongan}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                                                    {formatRupiah(z.uang_saku)}
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <div className="inline-flex items-center gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleOpenEditZonasi(z)
                                                            }
                                                            className="h-7 px-2 text-xs"
                                                        >
                                                            <Edit3 className="size-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                if (
                                                                    window.confirm(
                                                                        `Hapus tarif zonasi ${z.nama_kecamatan} (${z.golongan})?`
                                                                    )
                                                                ) {
                                                                    router.delete(
                                                                        `/sppd-dalam-kota/zonasi/${z.id}`,
                                                                        {
                                                                            preserveScroll: true,
                                                                        }
                                                                    );
                                                                }
                                                            }}
                                                            className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ========================================================= */}
                {/* DIALOG KONFIRMASI SETELAH SIMPAN: TAMBAH TANGGAL BERBEDA? */}
                {/* ========================================================= */}
                <Dialog
                    open={afterSavePromptOpen}
                    onOpenChange={setAfterSavePromptOpen}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-emerald-700">
                                <CheckCircle2 className="size-5" />
                                SPPD Dalam Kota Berhasil Disimpan!
                            </DialogTitle>
                            <DialogDescription>
                                Apakah Anda ingin menambah SPPD lagi di{' '}
                                <strong>tanggal yang berbeda</strong>?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="rounded-xl bg-teal-50/70 border border-teal-200 p-3 text-xs text-teal-900">
                            Jika Anda memilih <strong>&ldquo;Ya, Tambah SPPD Tanggal Berbeda&rdquo;</strong>, sistem akan menyiapkan form baru dengan daftar pegawai dan tujuan sebelumnya untuk tanggal berikutnya sehingga Anda tidak perlu menginput ulang dari awal.
                        </div>
                        <DialogFooter className="flex-col gap-2 sm:flex-row">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleResetFreshFormAfterSave}
                            >
                                Selesai / Form Kosong Baru
                            </Button>
                            <Button
                                type="button"
                                onClick={handleContinueDifferentDateAfterSave}
                                className="gap-1.5 bg-[#006565] text-white hover:bg-[#005252]"
                            >
                                <CalendarPlus className="size-4" />
                                Ya, Tambah SPPD Tanggal Berbeda
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ========================================================= */}
                {/* DIALOG: CREATE / EDIT MASTER PEGAWAI                      */}
                {/* ========================================================= */}
                <Dialog open={pegawaiModalOpen} onOpenChange={setPegawaiModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {editingPegawai
                                    ? 'Edit Master Data Pegawai'
                                    : 'Tambah Master Data Pegawai'}
                            </DialogTitle>
                            <DialogDescription>
                                Masukkan NIP 18 digit maka <strong>Tanggal Lahir</strong> akan terisi secara otomatis dari 8 digit awal NIP.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSavePegawai} className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Nama Lengkap &amp; Gelar *</Label>
                                    <Input
                                        value={pNama}
                                        onChange={(e) => setPNama(e.target.value)}
                                        placeholder="Contoh: Dedi Kurniawan, S.P."
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>NIP (18 Digit)</Label>
                                    <Input
                                        value={pNip}
                                        onChange={(e) =>
                                            handleNipChangeWithAutoBirthDate(
                                                e.target.value
                                            )
                                        }
                                        placeholder="198402152009021004"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="flex items-center justify-between">
                                        <span>Tanggal Lahir (Otomatis NIP)</span>
                                        <span className="text-[10px] font-bold text-emerald-700">
                                            Auto
                                        </span>
                                    </Label>
                                    <Input
                                        type="date"
                                        value={pTanggalLahir}
                                        onChange={(e) =>
                                            setPTanggalLahir(e.target.value)
                                        }
                                        className="bg-emerald-50/50 border-emerald-300 font-bold"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Golongan *</Label>
                                    <Select
                                        value={pGolongan}
                                        onValueChange={
                                            handleGolonganChangeWithAutoPangkat
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {GOLONGAN_OPTIONS.map((g) => (
                                                <SelectItem
                                                    key={g.golongan}
                                                    value={g.golongan}
                                                >
                                                    {g.golongan} - {g.pangkat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Pangkat *</Label>
                                    <Input
                                        value={pPangkat}
                                        onChange={(e) => setPPangkat(e.target.value)}
                                        placeholder="Penata Tingkat I"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Jabatan *</Label>
                                    <Input
                                        value={pJabatan}
                                        onChange={(e) => setPJabatan(e.target.value)}
                                        placeholder="Analis Ketahanan Pangan Ahli Muda"
                                        required
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPegawaiModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSavingPegawai}
                                    className="bg-[#006565] text-white hover:bg-[#005252]"
                                >
                                    {isSavingPegawai ? 'Menyimpan...' : 'Simpan Pegawai'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ========================================================= */}
                {/* DIALOG: CREATE / EDIT MASTER PEJABAT                      */}
                {/* ========================================================= */}
                <Dialog open={pejabatModalOpen} onOpenChange={setPejabatModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {editingPejabat ? 'Edit' : 'Tambah'} Master{' '}
                                {pjTipe === 'kepala_dinas'
                                    ? 'Kepala Dinas'
                                    : pjTipe === 'pptk'
                                      ? 'PPTK'
                                      : 'Bendahara'}
                            </DialogTitle>
                            <DialogDescription>
                                Anda dapat mengambil data otomatis dari Master Pegawai atau mengetik secara manual.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSavePejabat} className="space-y-4">
                            {!editingPejabat && pegawais.length > 0 && (
                                <div className="space-y-1.5 rounded-xl bg-teal-50/60 border border-teal-200 p-3">
                                    <Label className="text-xs font-bold text-[#006565]">
                                        Ambil Cepat dari Master Pegawai (Opsional):
                                    </Label>
                                    <Select
                                        onValueChange={handleFillPejabatFromPegawai}
                                    >
                                        <SelectTrigger className="h-8 bg-white text-xs">
                                            <SelectValue placeholder="-- Pilih pegawai untuk mengisi otomatis --" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pegawais.map((p) => (
                                                <SelectItem
                                                    key={p.id}
                                                    value={String(p.id)}
                                                >
                                                    {p.nama} ({p.golongan})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Nama Lengkap *</Label>
                                    <Input
                                        value={pjNama}
                                        onChange={(e) => setPjNama(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>NIP</Label>
                                    <Input
                                        value={pjNip}
                                        onChange={(e) => setPjNip(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Golongan</Label>
                                    <Select
                                        value={pjGolongan}
                                        onValueChange={(gol) => {
                                            setPjGolongan(gol);
                                            const found = GOLONGAN_OPTIONS.find(
                                                (g) => g.golongan === gol
                                            );
                                            if (found) setPjPangkat(found.pangkat);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {GOLONGAN_OPTIONS.map((g) => (
                                                <SelectItem
                                                    key={g.golongan}
                                                    value={g.golongan}
                                                >
                                                    {g.golongan} - {g.pangkat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Pangkat</Label>
                                    <Input
                                        value={pjPangkat}
                                        onChange={(e) => setPjPangkat(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Jabatan *</Label>
                                    <Input
                                        value={pjJabatan}
                                        onChange={(e) => setPjJabatan(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1 sm:col-span-2">
                                    <Checkbox
                                        id="pj-active"
                                        checked={pjIsActive}
                                        onCheckedChange={(v) =>
                                            setPjIsActive(Boolean(v))
                                        }
                                    />
                                    <Label htmlFor="pj-active" className="text-xs">
                                        Berstatus Aktif sebagai pejabat penandatangan
                                    </Label>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPejabatModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSavingPejabat}
                                    className="bg-[#006565] text-white hover:bg-[#005252]"
                                >
                                    {isSavingPejabat ? 'Menyimpan...' : 'Simpan Data'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ========================================================= */}
                {/* DIALOG: CREATE / EDIT MASTER ZONASI                       */}
                {/* ========================================================= */}
                <Dialog open={zonasiModalOpen} onOpenChange={setZonasiModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingZonasi
                                    ? 'Edit Tarif Master Zonasi'
                                    : 'Tambah Tarif Master Zonasi'}
                            </DialogTitle>
                            <DialogDescription>
                                Atur kecamatan, klasifikasi zona, golongan pegawai, dan nominal uang saku.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSaveZonasi} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>Nama Kecamatan *</Label>
                                <Input
                                    value={zKecamatan}
                                    onChange={(e) => setZKecamatan(e.target.value)}
                                    placeholder="Contoh: Jatibarang"
                                    required
                                />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label>Zona *</Label>
                                    <Select value={zZona} onValueChange={setZZona}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ZONA_OPTIONS.map((zn) => (
                                                <SelectItem key={zn} value={zn}>
                                                    {zn}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Golongan *</Label>
                                    <Select
                                        value={zGolongan}
                                        onValueChange={setZGolongan}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ZONASI_GOLONGAN_OPTIONS.map((g) => (
                                                <SelectItem key={g} value={g}>
                                                    {g}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Besaran Uang Saku (Rp) *</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    step={5000}
                                    value={zUangSaku}
                                    onChange={(e) => setZUangSaku(e.target.value)}
                                    required
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setZonasiModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSavingZonasi}
                                    className="bg-[#006565] text-white hover:bg-[#005252]"
                                >
                                    {isSavingZonasi ? 'Menyimpan...' : 'Simpan Zonasi'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

SppdDalamKotaIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'SPPD Dalam Kota',
            href: '/sppd-dalam-kota',
        },
    ] satisfies BreadcrumbItem[],
};
