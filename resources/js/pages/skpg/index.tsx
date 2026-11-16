import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    Calendar,
    Check,
    CheckCheck,
    CheckCircle2,
    ClipboardPaste,
    Clock,
    Copy,
    Download,
    Edit3,
    ExternalLink,
    FileSpreadsheet,
    FileText,
    Filter,
    HelpCircle,
    Info,
    Layers,
    MapPin,
    Plus,
    RefreshCw,
    RotateCcw,
    Save,
    Search,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    Upload,
    Wheat,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export interface SkpgRecord {
    id: number;
    kecamatan: string;
    kode_kecamatan: string;
    year: number;
    month: number;
    ik: string;
    ia: string;
    ip: string;
    ikb: string;
    potensi_kering: string;
    potensi_basah: string;
    kondisi_iklim: string;
    keterangan?: string | null;
    creator?: { id: number; name: string } | null;
    created_at?: string;
    updated_at?: string;
}

export interface BulkItem {
    id?: number | null;
    kecamatan: string;
    kode_kecamatan: string;
    year: number;
    month: number;
    ik: string;
    ia: string;
    ip: string;
    ikb: string;
    potensi_kering: string;
    potensi_basah: string;
    kondisi_iklim: string;
    keterangan?: string | null;
    is_recorded?: boolean;
}

interface PageProps {
    records: SkpgRecord[];
    bulkItems: BulkItem[];
    kecamatanList: string[];
    indicators: Record<string, string>;
    statuses: string[];
    statistics: {
        total_kecamatan: number;
        recorded_count: number;
        missing_count: number;
        count_aman: number;
        count_waspada: number;
        count_rentan: number;
    };
    availableYears: number[];
    filters: {
        search: string;
        year: number;
        month: number;
        status: string;
        indicator: string;
    };
}

const MONTH_NAMES = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

export function getStatusBadge(status: string) {
    switch (status) {
        case 'AWAS':
            return {
                label: 'AWAS',
                badgeClass:
                    'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
                dotClass: 'bg-rose-600',
            };
        case 'SIAGA':
            return {
                label: 'SIAGA',
                badgeClass:
                    'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
                dotClass: 'bg-orange-500',
            };
        case 'RENTAN':
            return {
                label: 'RENTAN',
                badgeClass:
                    'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
                dotClass: 'bg-rose-500',
            };
        case 'WASPADA':
            return {
                label: 'WASPADA',
                badgeClass:
                    'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
                dotClass: 'bg-amber-500',
            };
        case 'AMAN':
        default:
            return {
                label: 'AMAN',
                badgeClass:
                    'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
                dotClass: 'bg-emerald-500',
            };
    }
}

export interface ParsedSkpgPasteRow {
    kecamatan: string;
    kode_kecamatan: string;
    ik: string;
    ia: string;
    ip: string;
    ikb: string;
    potensi_kering: string;
    potensi_basah: string;
    kondisi_iklim: string;
    keterangan?: string;
    matched: boolean;
}

const KECAMATAN_CODES_MAP: Record<string, string> = {
    HAURGEULIS: '3212010',
    GANTAR: '3212011',
    KROYA: '3212020',
    GABUSWETAN: '3212030',
    CIKEDUNG: '3212040',
    TRISI: '3212041',
    TERISI: '3212041',
    LELEA: '3212050',
    BANGODUA: '3212060',
    TUKDANA: '3212061',
    WIDASARI: '3212070',
    KERTASEMAYA: '3212080',
    SUKAGUMIWANG: '3212081',
    KRANGKENG: '3212090',
    KARANGAMPEL: '3212100',
    'KEDOKAN BUNDER': '3212101',
    JUNTINYUAT: '3212110',
    SLIYEG: '3212120',
    JATIBARANG: '3212130',
    BALONGAN: '3212140',
    INDRAMAYU: '3212150',
    SINDANG: '3212160',
    CANTIGI: '3212161',
    PASEKAN: '3212162',
    LOHBENER: '3212170',
    ARAHAN: '3212171',
    LOSARANG: '3212180',
    KANDANGHAUR: '3212190',
    BONGAS: '3212200',
    ANJATAN: '3212210',
    SUKRA: '3212220',
    PATROL: '3212221',
};

function normalizeFoodStatus(val: string | undefined): 'AMAN' | 'WASPADA' | 'RENTAN' {
    if (!val) return 'AMAN';
    const up = val.trim().toUpperCase();
    if (up === 'RENTAN' || up.includes('RENTAN') || up === 'MERAH' || up === '3') return 'RENTAN';
    if (up === 'WASPADA' || up.includes('WASPADA') || up === 'KUNING' || up === '2') return 'WASPADA';
    if (up === 'AMAN' || up.includes('AMAN') || up === 'HIJAU' || up === 'NORMAL' || up === '1') return 'AMAN';
    return 'AMAN';
}

function normalizeClimateStatus(val: string | undefined): 'AMAN' | 'WASPADA' | 'SIAGA' | 'AWAS' {
    if (!val) return 'AMAN';
    const up = val.trim().toUpperCase();
    if (up === 'AWAS' || up.includes('AWAS') || up === '4') return 'AWAS';
    if (up === 'SIAGA' || up.includes('SIAGA') || up === 'ORANGE' || up === 'JINGGA' || up === '3') return 'SIAGA';
    if (up === 'WASPADA' || up.includes('WASPADA') || up === 'KUNING' || up === '2') return 'WASPADA';
    if (up === 'AMAN' || up.includes('AMAN') || up === 'HIJAU' || up === 'NORMAL' || up === '1') return 'AMAN';
    return 'AMAN';
}

export default function SkpgAdminIndex({
    records,
    bulkItems: initialBulkItems,
    kecamatanList,
    indicators,
    statuses,
    statistics,
    availableYears,
    filters,
}: PageProps) {
    const [activeTab, setActiveTab] = useState<'bulk' | 'table'>('bulk');
    const [selectedYear, setSelectedYear] = useState<number>(filters.year);
    const [selectedMonth, setSelectedMonth] = useState<number>(filters.month);
    const [searchTerm, setSearchTerm] = useState<string>(filters.search || '');

    // Bulk edit state
    const [bulkData, setBulkData] = useState<BulkItem[]>(initialBulkItems);
    const [isSavingBulk, setIsSavingBulk] = useState<boolean>(false);
    const [bulkFilterKec, setBulkFilterKec] = useState<string>('');

    // Copy-Paste Modal State
    const [isPasteModalOpen, setIsPasteModalOpen] = useState<boolean>(false);
    const [pasteRawText, setPasteRawText] = useState<string>('');
    const [parsedPasteRows, setParsedPasteRows] = useState<ParsedSkpgPasteRow[]>([]);
    const [pasteSampleTab, setPasteSampleTab] = useState<'full' | 'statusOnly'>('full');
    const [isSubmittingPaste, setIsSubmittingPaste] = useState<boolean>(false);

    // Import Excel Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isSubmittingImport, setIsSubmittingImport] = useState<boolean>(false);

    // Single modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [selectedRecord, setSelectedRecord] = useState<SkpgRecord | null>(null);

    // Single form fields
    const [formKecamatan, setFormKecamatan] = useState<string>(kecamatanList[0] || 'HAURGEULIS');
    const [formYear, setFormYear] = useState<number>(filters.year);
    const [formMonth, setFormMonth] = useState<number>(filters.month);
    const [formIk, setFormIk] = useState<string>('AMAN');
    const [formIa, setFormIa] = useState<string>('AMAN');
    const [formIp, setFormIp] = useState<string>('AMAN');
    const [formIkb, setFormIkb] = useState<string>('AMAN');
    const [formPotensiKering, setFormPotensiKering] = useState<string>('AMAN');
    const [formPotensiBasah, setFormPotensiBasah] = useState<string>('AMAN');
    const [formKondisiIklim, setFormKondisiIklim] = useState<string>('AMAN');
    const [formKeterangan, setFormKeterangan] = useState<string>('');

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
            title: 'SKPG',
            href: '/skpg-admin',
        },
    ];

    // Synchronize bulkData when initialBulkItems changes (e.g. when changing month/year)
    React.useEffect(() => {
        setBulkData(initialBulkItems);
    }, [initialBulkItems]);

    // Keep year and month filter in sync with server-resolved period
    React.useEffect(() => {
        if (filters.year) setSelectedYear(filters.year);
        if (filters.month) setSelectedMonth(filters.month);
    }, [filters.year, filters.month]);

    // Apply period filter in table or bulk view
    const handlePeriodFilter = (newYear: number, newMonth: number) => {
        setSelectedYear(newYear);
        setSelectedMonth(newMonth);
        router.get(
            '/skpg-admin',
            {
                year: newYear,
                month: newMonth,
                search: searchTerm,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Quick bulk update: Set All to AMAN
    const handleSetAllAman = () => {
        setBulkData((prev) =>
            prev.map((item) => ({
                ...item,
                ik: 'AMAN',
                ia: 'AMAN',
                ip: 'AMAN',
                ikb: 'AMAN',
                potensi_kering: 'AMAN',
                potensi_basah: 'AMAN',
                kondisi_iklim: 'AMAN',
            }))
        );
        toast.info('Seluruh 31 kecamatan diatur ke status AMAN. Klik "Simpan Data Bulanan" untuk menyimpan perubahan.');
    };

    // Update single cell in bulk grid
    const handleBulkCellChange = (
        index: number,
        field: keyof BulkItem,
        value: string
    ) => {
        setBulkData((prev) => {
            const next = [...prev];
            next[index] = {
                ...next[index],
                [field]: value,
            };
            return next;
        });
    };

    // Save Bulk Changes to server
    const handleSaveBulk = () => {
        setIsSavingBulk(true);
        router.post(
            '/skpg-admin/bulk',
            {
                year: selectedYear,
                month: selectedMonth,
                items: bulkData.map((b) => ({
                    kecamatan: b.kecamatan,
                    ik: b.ik,
                    ia: b.ia,
                    ip: b.ip,
                    ikb: b.ikb,
                    potensi_kering: b.potensi_kering,
                    potensi_basah: b.potensi_basah,
                    kondisi_iklim: b.kondisi_iklim,
                    keterangan: b.keterangan || null,
                })),
            },
            {
                onSuccess: () => {
                    toast.success(
                        `Berhasil menyimpan data SKPG 31 kecamatan periode ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}!`
                    );
                },
                onError: (errors) => {
                    const firstMsg = Object.values(errors)[0] as string;
                    toast.error(firstMsg || 'Gagal menyimpan bulk data SKPG.');
                },
                onFinish: () => {
                    setIsSavingBulk(false);
                },
            }
        );
    };

    // Generate Sample TSV format for user to copy / try
    const generateSampleTsv = (type: 'full' | 'statusOnly') => {
        const list = kecamatanList && kecamatanList.length > 0 ? kecamatanList : Object.keys(KECAMATAN_CODES_MAP);
        if (type === 'statusOnly') {
            let text = 'IK\tIA\tIP\tIKB\tPotensi Kering\tPotensi Basah\tKondisi Iklim\n';
            list.forEach((k, idx) => {
                const isWaspada = idx === 1 || idx === 7;
                const isSiaga = idx === 1;
                text += `${isWaspada ? 'WASPADA' : 'AMAN'}\tAMAN\tAMAN\t${isWaspada ? 'WASPADA' : 'AMAN'}\t${isSiaga ? 'SIAGA' : 'AMAN'}\tAMAN\t${isWaspada ? 'WASPADA' : 'AMAN'}\n`;
            });
            return text;
        }

        let text = 'No\tKecamatan\tKode BPS\tIK\tIA\tIP\tIKB\tPotensi Kering\tPotensi Basah\tKondisi Iklim\tKeterangan\n';
        list.forEach((k, idx) => {
            const code = KECAMATAN_CODES_MAP[k] || `3212${String(idx + 10).padStart(3, '0')}`;
            const isWaspada = idx === 1 || idx === 5;
            const isSiaga = idx === 1;
            const ket = isWaspada ? 'Perlu pemantauan berkala' : 'Kondisi stabil';
            text += `${idx + 1}\t${k}\t${code}\t${isWaspada ? 'WASPADA' : 'AMAN'}\tAMAN\tAMAN\t${isWaspada ? 'WASPADA' : 'AMAN'}\t${isSiaga ? 'SIAGA' : 'AMAN'}\tAMAN\t${isWaspada ? 'WASPADA' : 'AMAN'}\t${ket}\n`;
        });
        return text;
    };

    const handleCopySampleToClipboard = (type: 'full' | 'statusOnly') => {
        const text = generateSampleTsv(type);
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text);
            toast.success(
                `Format contoh 31 kecamatan (${type === 'full' ? '11 Kolom Lengkap' : '7 Kolom Status Saja'}) berhasil disalin ke clipboard! Tekan Ctrl+V di kotak bawah untuk mencoba.`
            );
        } else {
            setPasteRawText(text);
            handlePasteRawChange(text);
            toast.info('Format contoh langsung dimasukkan ke kotak teks input.');
        }
    };

    // Live Parser for Excel / Clipboard Text
    const handlePasteRawChange = (text: string) => {
        setPasteRawText(text);
        if (!text.trim()) {
            setParsedPasteRows([]);
            return;
        }

        const lines = text
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter((l) => l.length > 0);

        if (lines.length === 0) {
            setParsedPasteRows([]);
            return;
        }

        // Determine delimiter: tab, semicolon, comma
        const sample = lines.slice(0, 5).join('\n');
        const tabs = (sample.match(/\t/g) || []).length;
        const semis = (sample.match(/;/g) || []).length;
        const commas = (sample.match(/,/g) || []).length;

        let delimiter = '\t';
        if (semis > tabs && semis > commas) delimiter = ';';
        else if (commas > tabs && commas > semis) delimiter = ',';

        const list = kecamatanList && kecamatanList.length > 0 ? kecamatanList : Object.keys(KECAMATAN_CODES_MAP);

        // Normalized map
        const lookup: Record<string, string> = {};
        list.forEach((k) => {
            const clean = k.toUpperCase().replace(/[^A-Z0-9]/g, '');
            lookup[clean] = k;
        });
        lookup['TERISI'] = 'TRISI';
        lookup['KECTERISI'] = 'TRISI';
        lookup['KECTRISI'] = 'TRISI';

        const results: ParsedSkpgPasteRow[] = [];
        let validLineIndex = 0;

        lines.forEach((line) => {
            const lower = line.toLowerCase();
            // Skip header line
            if (
                lower.includes('kecamatan') ||
                lower.includes('indikator') ||
                lower.includes('ketersediaan') ||
                lower.includes('komposit') ||
                lower.includes('ikb') ||
                lower.includes('potensi')
            ) {
                return;
            }

            const rawParts = line.split(delimiter).map((p) => p.trim());
            if (rawParts.length === 0 || rawParts.every((p) => p === '')) return;

            // 1. Identify subdistrict
            let foundKec: string | null = null;
            let foundCode = '';

            for (const part of rawParts) {
                const cleanPart = part.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (lookup[cleanPart]) {
                    foundKec = lookup[cleanPart];
                    break;
                }
                if (/^3212\d{3}$/.test(part)) {
                    for (const [kName, kCode] of Object.entries(KECAMATAN_CODES_MAP)) {
                        if (kCode === part) {
                            foundKec = kName;
                            foundCode = kCode;
                            break;
                        }
                    }
                }
            }

            // Check if first column is sequence number (1..31)
            if (!foundKec && rawParts.length > 0 && /^\d+$/.test(rawParts[0])) {
                const num = parseInt(rawParts[0], 10);
                if (num >= 1 && num <= list.length) {
                    foundKec = list[num - 1];
                }
            }

            // Fallback by line sequence
            if (!foundKec && validLineIndex < list.length) {
                foundKec = list[validLineIndex];
            }

            if (!foundKec) return;

            validLineIndex++;

            // Extract candidate status values
            const statusCandidates: string[] = [];
            let noteCandidate = '';

            rawParts.forEach((part, colIdx) => {
                const cleanPart = part.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (lookup[cleanPart] === foundKec || part.toUpperCase() === foundKec) return;
                if (/^3212\d{3}$/.test(part)) return;
                if (colIdx === 0 && /^\d+$/.test(part) && parseInt(part, 10) <= 31) return;

                const up = part.toUpperCase();
                const isStatus =
                    ['AMAN', 'WASPADA', 'RENTAN', 'SIAGA', 'AWAS', 'HIJAU', 'KUNING', 'MERAH', 'ORANGE', 'JINGGA', 'NORMAL', '1', '2', '3', '4'].includes(up) ||
                    up.includes('AMAN') ||
                    up.includes('WASPADA') ||
                    up.includes('RENTAN') ||
                    up.includes('SIAGA') ||
                    up.includes('AWAS');

                if (isStatus) {
                    statusCandidates.push(part);
                } else if (part.length > 2 && !noteCandidate) {
                    noteCandidate = part;
                }
            });

            const ik = normalizeFoodStatus(statusCandidates[0]);
            const ia = normalizeFoodStatus(statusCandidates[1]);
            const ip = normalizeFoodStatus(statusCandidates[2]);
            const ikb = normalizeFoodStatus(statusCandidates[3]);
            const potensi_kering = normalizeClimateStatus(statusCandidates[4]);
            const potensi_basah = normalizeClimateStatus(statusCandidates[5]);
            const kondisi_iklim = normalizeClimateStatus(statusCandidates[6]);

            results.push({
                kecamatan: foundKec,
                kode_kecamatan: foundCode || KECAMATAN_CODES_MAP[foundKec] || '',
                ik,
                ia,
                ip,
                ikb,
                potensi_kering,
                potensi_basah,
                kondisi_iklim,
                keterangan: noteCandidate || undefined,
                matched: true,
            });
        });

        setParsedPasteRows(results);
    };

    // Apply parsed rows to bulkData in memory
    const handleApplyPasteToBulk = () => {
        if (parsedPasteRows.length === 0) {
            toast.error('Tidak ada data hasil parsing yang dapat diterapkan.');
            return;
        }

        setBulkData((prev) => {
            const next = [...prev];
            parsedPasteRows.forEach((pRow) => {
                const idx = next.findIndex(
                    (b) => b.kecamatan.toUpperCase() === pRow.kecamatan.toUpperCase()
                );
                if (idx !== -1) {
                    next[idx] = {
                        ...next[idx],
                        ik: pRow.ik,
                        ia: pRow.ia,
                        ip: pRow.ip,
                        ikb: pRow.ikb,
                        potensi_kering: pRow.potensi_kering,
                        potensi_basah: pRow.potensi_basah,
                        kondisi_iklim: pRow.kondisi_iklim,
                        keterangan: pRow.keterangan || next[idx].keterangan,
                    };
                }
            });
            return next;
        });

        setIsPasteModalOpen(false);
        toast.success(
            `${parsedPasteRows.length} kecamatan berhasil diterapkan ke tabel form bulk! Klik "Simpan Data Bulanan" setelah selesai memeriksa.`
        );
    };

    // Save parsed rows directly to server
    const handleSavePasteDirectly = () => {
        if (parsedPasteRows.length === 0) {
            toast.error('Tidak ada data hasil parsing yang dapat disimpan.');
            return;
        }

        setIsSubmittingPaste(true);
        router.post(
            '/skpg-admin/bulk',
            {
                year: selectedYear,
                month: selectedMonth,
                items: parsedPasteRows.map((p) => ({
                    kecamatan: p.kecamatan,
                    ik: p.ik,
                    ia: p.ia,
                    ip: p.ip,
                    ikb: p.ikb,
                    potensi_kering: p.potensi_kering,
                    potensi_basah: p.potensi_basah,
                    kondisi_iklim: p.kondisi_iklim,
                    keterangan: p.keterangan || null,
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsPasteModalOpen(false);
                    setPasteRawText('');
                    setParsedPasteRows([]);
                    setIsSubmittingPaste(false);
                    toast.success(
                        `Berhasil menyimpan ${parsedPasteRows.length} kecamatan dari data copy-paste!`
                    );
                },
                onError: (err) => {
                    setIsSubmittingPaste(false);
                    const firstMsg = Object.values(err)[0] as string;
                    toast.error(firstMsg || 'Gagal menyimpan data copy-paste.');
                },
            }
        );
    };

    // Download official template
    const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
        window.location.href = `/skpg-admin/template?year=${selectedYear}&month=${selectedMonth}&format=${format}`;
    };

    // Export current month to Excel
    const handleExportExcel = () => {
        window.location.href = `/skpg-admin/export?year=${selectedYear}&month=${selectedMonth}`;
    };

    // Submit Excel Import Form
    const handleSubmitImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) {
            toast.error('Harap pilih berkas spreadsheet (.xlsx, .csv, .tsv) terlebih dahulu.');
            return;
        }

        setIsSubmittingImport(true);
        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('year', String(selectedYear));
        formData.append('month', String(selectedMonth));

        router.post('/skpg-admin/import', formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsImportModalOpen(false);
                setImportFile(null);
                setIsSubmittingImport(false);
                toast.success(
                    `Berhasil mengimpor data SKPG dari file ${importFile.name} periode ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}!`
                );
            },
            onError: (err) => {
                setIsSubmittingImport(false);
                const firstMsg = Object.values(err)[0] as string;
                toast.error(firstMsg || 'Gagal mengimpor file Excel.');
            },
        });
    };

    // Open single create modal
    const openCreateModal = () => {
        setFormKecamatan(kecamatanList[0] || 'HAURGEULIS');
        setFormYear(selectedYear);
        setFormMonth(selectedMonth);
        setFormIk('AMAN');
        setFormIa('AMAN');
        setFormIp('AMAN');
        setFormIkb('AMAN');
        setFormPotensiKering('AMAN');
        setFormPotensiBasah('AMAN');
        setFormKondisiIklim('AMAN');
        setFormKeterangan('');
        setIsCreateModalOpen(true);
    };

    // Open single edit modal
    const openEditModal = (rec: SkpgRecord) => {
        setSelectedRecord(rec);
        setFormKecamatan(rec.kecamatan);
        setFormYear(rec.year);
        setFormMonth(rec.month);
        setFormIk(rec.ik);
        setFormIa(rec.ia);
        setFormIp(rec.ip);
        setFormIkb(rec.ikb);
        setFormPotensiKering(rec.potensi_kering);
        setFormPotensiBasah(rec.potensi_basah);
        setFormKondisiIklim(rec.kondisi_iklim);
        setFormKeterangan(rec.keterangan || '');
        setIsEditModalOpen(true);
    };

    // Open delete confirmation
    const openDeleteModal = (rec: SkpgRecord) => {
        setSelectedRecord(rec);
        setIsDeleteModalOpen(true);
    };

    // Single create submit
    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            '/skpg-admin',
            {
                kecamatan: formKecamatan,
                year: formYear,
                month: formMonth,
                ik: formIk,
                ia: formIa,
                ip: formIp,
                ikb: formIkb,
                potensi_kering: formPotensiKering,
                potensi_basah: formPotensiBasah,
                kondisi_iklim: formKondisiIklim,
                keterangan: formKeterangan || null,
            },
            {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    toast.success(`Data SKPG ${formKecamatan} berhasil disimpan.`);
                },
                onError: (errors) => {
                    const firstMsg = Object.values(errors)[0] as string;
                    toast.error(firstMsg || 'Gagal menyimpan data.');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    // Single edit submit
    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRecord) return;
        setIsSubmitting(true);

        router.put(
            `/skpg-admin/${selectedRecord.id}`,
            {
                ik: formIk,
                ia: formIa,
                ip: formIp,
                ikb: formIkb,
                potensi_kering: formPotensiKering,
                potensi_basah: formPotensiBasah,
                kondisi_iklim: formKondisiIklim,
                keterangan: formKeterangan || null,
            },
            {
                onSuccess: () => {
                    setIsEditModalOpen(false);
                    toast.success(`Data SKPG ${selectedRecord.kecamatan} berhasil diperbarui.`);
                },
                onError: (errors) => {
                    const firstMsg = Object.values(errors)[0] as string;
                    toast.error(firstMsg || 'Gagal memperbarui data.');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    // Delete record submit
    const handleDeleteSubmit = () => {
        if (!selectedRecord) return;
        setIsSubmitting(true);

        router.delete(`/skpg-admin/${selectedRecord.id}`, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.success(`Data SKPG ${selectedRecord.kecamatan} berhasil dihapus.`);
            },
            onError: () => {
                toast.error('Gagal menghapus data SKPG.');
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    // Filter bulk rows by search
    const visibleBulkData = useMemo(() => {
        if (!bulkFilterKec.trim()) return bulkData;
        const q = bulkFilterKec.toLowerCase();
        return bulkData.filter(
            (b) =>
                b.kecamatan.toLowerCase().includes(q) ||
                b.kode_kecamatan.toLowerCase().includes(q) ||
                (b.keterangan || '').toLowerCase().includes(q)
        );
    }, [bulkData, bulkFilterKec]);

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <Head title="Kelola SKPG (Sistem Peringatan Dini Kerawanan Pangan)" />

            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#006565] to-teal-700 text-white shadow-md shadow-[#006565]/20">
                            <MapPin className="h-6 w-6 stroke-[2.2]" />
                        </span>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                                Sistem Peringatan Dini Kerawanan Pangan &amp; Gizi (SKPG)
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                                Manajemen evaluasi bulanan 31 kecamatan di Kabupaten Indramayu (IK, IA, IP, IKB, Iklim &amp; Bencana)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/skpg"
                        target="_blank"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:border-[#006565] hover:text-[#006565] transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                        <ExternalLink className="h-4 w-4" />
                        <span>Lihat Peta Publik</span>
                    </Link>
                    <Button
                        type="button"
                        onClick={handleExportExcel}
                        variant="outline"
                        className="gap-2 rounded-xl text-xs font-bold border-slate-200 hover:border-[#006565] hover:text-[#006565] dark:border-slate-700 cursor-pointer"
                    >
                        <Download className="h-4 w-4 text-slate-600" />
                        <span>Export Excel</span>
                    </Button>
                    <Button
                        type="button"
                        onClick={() => setIsImportModalOpen(true)}
                        variant="outline"
                        className="gap-2 rounded-xl text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800/60 dark:hover:bg-emerald-950/40 cursor-pointer"
                    >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        <span>Import Excel</span>
                    </Button>
                    <Button
                        type="button"
                        onClick={() => {
                            setPasteRawText('');
                            setParsedPasteRows([]);
                            setIsPasteModalOpen(true);
                        }}
                        variant="outline"
                        className="gap-2 rounded-xl text-xs font-bold text-purple-700 border-purple-200 hover:bg-purple-50 dark:border-purple-800/60 dark:hover:bg-purple-950/40 cursor-pointer"
                    >
                        <ClipboardPaste className="h-4 w-4 text-purple-600" />
                        <span>Copy-Paste Excel</span>
                    </Button>
                    <Button
                        onClick={openCreateModal}
                        className="gap-2 rounded-xl bg-gradient-to-r from-[#006565] to-emerald-700 text-xs font-bold text-white shadow-md shadow-[#006565]/20 hover:shadow-lg hover:shadow-[#006565]/30 cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Tambah Data Tunggal</span>
                    </Button>
                </div>
            </div>

            {/* Statistics KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Terdata Periode Ini
                        </CardTitle>
                        <Layers className="h-4 w-4 text-[#006565] dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                                {statistics.recorded_count} / {statistics.total_kecamatan}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">Kecamatan</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">
                            {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Status AMAN (Hijau)
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {statistics.count_aman}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">Kecamatan</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">Komposit pangan stabil</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Status WASPADA (Kuning)
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                                {statistics.count_waspada}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">Kecamatan</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">Perlu pengawasan berkala</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                            Status RENTAN (Merah)
                        </CardTitle>
                        <ShieldAlert className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                                {statistics.count_rentan}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">Kecamatan</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">Prioritas intervensi pangan &amp; gizi</p>
                    </CardContent>
                </Card>
            </div>

            {/* Mode Tabs & Period Selector Bar */}
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
                {/* Tab Switcher */}
                <div className="inline-flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                    <button
                        type="button"
                        onClick={() => setActiveTab('bulk')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                            activeTab === 'bulk'
                                ? 'bg-gradient-to-r from-[#006565] to-teal-700 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                        }`}
                    >
                        <CheckCheck className="h-4 w-4" />
                        <span>Bulk Input / Edit Bulanan (31 Kecamatan)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('table')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                            activeTab === 'table'
                                ? 'bg-gradient-to-r from-[#006565] to-teal-700 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                        }`}
                    >
                        <Layers className="h-4 w-4" />
                        <span>Tabel Data &amp; Log</span>
                    </button>
                </div>

                {/* Period Selector Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Bulan:</span>
                        <Select
                            value={String(selectedMonth)}
                            onValueChange={(val) => handlePeriodFilter(selectedYear, Number(val))}
                        >
                            <SelectTrigger className="h-9 w-36 rounded-xl font-bold text-xs">
                                <SelectValue placeholder="Pilih Bulan" />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTH_NAMES.map((m, idx) => (
                                    <SelectItem key={idx + 1} value={String(idx + 1)} className="text-xs font-semibold">
                                        {m}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Tahun:</span>
                        <Select
                            value={String(selectedYear)}
                            onValueChange={(val) => handlePeriodFilter(Number(val), selectedMonth)}
                        >
                            <SelectTrigger className="h-9 w-28 rounded-xl font-bold text-xs">
                                <SelectValue placeholder="Pilih Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableYears.map((y) => (
                                    <SelectItem key={y} value={String(y)} className="text-xs font-semibold">
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* TAB 1: BULK INPUT / EDIT 31 KECAMATAN */}
            {activeTab === 'bulk' && (
                <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    {/* Action Bar for Bulk Editor */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-black text-slate-900 dark:text-white sm:text-lg">
                                    Input / Edit Serentak 31 Kecamatan
                                </h3>
                                <Badge className="rounded-lg bg-emerald-100 text-emerald-800 border-emerald-200">
                                    {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                                </Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Ubah status IK, IA, IP, IKB, Potensi Kering, Potensi Basah, &amp; Kondisi Iklim langsung di tabel ini.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Search filter for subdistricts */}
                            <div className="relative w-44">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Cari kecamatan..."
                                    value={bulkFilterKec}
                                    onChange={(e) => setBulkFilterKec(e.target.value)}
                                    className="h-8 pl-8 rounded-xl text-xs"
                                />
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleExportExcel}
                                className="h-8 gap-1.5 rounded-xl text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 dark:border-slate-700 cursor-pointer"
                                title="Unduh data SKPG bulan ini ke Excel"
                            >
                                <Download className="h-3.5 w-3.5 text-slate-600" />
                                <span>Export</span>
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsImportModalOpen(true)}
                                className="h-8 gap-1.5 rounded-xl text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800/70 dark:hover:bg-emerald-950/30 cursor-pointer"
                                title="Import file Excel (.xlsx / .csv)"
                            >
                                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Import Excel</span>
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setPasteRawText('');
                                    setParsedPasteRows([]);
                                    setIsPasteModalOpen(true);
                                }}
                                className="h-8 gap-1.5 rounded-xl text-xs font-bold text-purple-700 border-purple-200 hover:bg-purple-50 dark:border-purple-800/70 dark:hover:bg-purple-950/30 cursor-pointer"
                                title="Salin dan tempel langsung tabel dari Excel"
                            >
                                <ClipboardPaste className="h-3.5 w-3.5 text-purple-600" />
                                <span>Copy-Paste</span>
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleSetAllAman}
                                className="h-8 gap-1.5 rounded-xl text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 cursor-pointer"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Set Semua AMAN</span>
                            </Button>

                            <Button
                                type="button"
                                onClick={handleSaveBulk}
                                disabled={isSavingBulk}
                                className="h-8 gap-2 rounded-xl bg-gradient-to-r from-[#006565] to-emerald-700 text-xs font-bold text-white shadow-md shadow-[#006565]/20 hover:shadow-lg cursor-pointer"
                            >
                                <Save className="h-3.5 w-3.5" />
                                <span>{isSavingBulk ? 'Menyimpan...' : 'Simpan Data Bulanan'}</span>
                            </Button>
                        </div>
                    </div>

                    {/* Bulk Spreadsheet Table */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-100/90 text-[11px] font-black uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                <tr>
                                    <th className="px-3 py-3 w-12 text-center">No</th>
                                    <th className="px-4 py-3 min-w-[150px]">Kecamatan</th>
                                    <th className="px-3 py-3 min-w-[110px] text-center">IK (Ketersediaan)</th>
                                    <th className="px-3 py-3 min-w-[110px] text-center">IA (Akses)</th>
                                    <th className="px-3 py-3 min-w-[110px] text-center">IP (Pemanfaatan)</th>
                                    <th className="px-3 py-3 min-w-[125px] text-center bg-emerald-50/60 dark:bg-emerald-950/30">
                                        IKB (Komposit)
                                    </th>
                                    <th className="px-3 py-3 min-w-[110px] text-center">Potensi Kering</th>
                                    <th className="px-3 py-3 min-w-[110px] text-center">Potensi Basah</th>
                                    <th className="px-3 py-3 min-w-[110px] text-center">Kondisi Iklim</th>
                                    <th className="px-4 py-3 min-w-[200px]">Catatan / Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {visibleBulkData.map((item, idx) => {
                                    // Original index in bulkData
                                    const originalIdx = bulkData.findIndex((b) => b.kecamatan === item.kecamatan);

                                    return (
                                        <tr
                                            key={item.kecamatan}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <td className="px-3 py-2.5 text-center font-bold text-slate-400">
                                                {originalIdx + 1}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="font-extrabold text-slate-900 dark:text-white">
                                                    {item.kecamatan}
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-semibold">
                                                    BPS: {item.kode_kecamatan}
                                                </span>
                                            </td>

                                            {/* IK (Ketersediaan) */}
                                            <td className="px-2 py-2 text-center">
                                                <select
                                                    value={item.ik}
                                                    onChange={(e) =>
                                                        handleBulkCellChange(originalIdx, 'ik', e.target.value)
                                                    }
                                                    className={`w-full rounded-lg px-2 py-1 text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006565] ${
                                                        item.ik === 'RENTAN'
                                                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                                                            : item.ik === 'WASPADA'
                                                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                    }`}
                                                >
                                                    <option value="AMAN">AMAN</option>
                                                    <option value="WASPADA">WASPADA</option>
                                                    <option value="RENTAN">RENTAN</option>
                                                </select>
                                            </td>

                                            {/* IA (Akses / Keterjangkauan) */}
                                            <td className="px-2 py-2 text-center">
                                                <select
                                                    value={item.ia}
                                                    onChange={(e) =>
                                                        handleBulkCellChange(originalIdx, 'ia', e.target.value)
                                                    }
                                                    className={`w-full rounded-lg px-2 py-1 text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006565] ${
                                                        item.ia === 'RENTAN'
                                                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                                                            : item.ia === 'WASPADA'
                                                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                    }`}
                                                >
                                                    <option value="AMAN">AMAN</option>
                                                    <option value="WASPADA">WASPADA</option>
                                                    <option value="RENTAN">RENTAN</option>
                                                </select>
                                            </td>

                                            {/* IP (Pemanfaatan) */}
                                            <td className="px-2 py-2 text-center">
                                                <select
                                                    value={item.ip}
                                                    onChange={(e) =>
                                                        handleBulkCellChange(originalIdx, 'ip', e.target.value)
                                                    }
                                                    className={`w-full rounded-lg px-2 py-1 text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006565] ${
                                                        item.ip === 'RENTAN'
                                                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                                                            : item.ip === 'WASPADA'
                                                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                    }`}
                                                >
                                                    <option value="AMAN">AMAN</option>
                                                    <option value="WASPADA">WASPADA</option>
                                                    <option value="RENTAN">RENTAN</option>
                                                </select>
                                            </td>

                                            {/* IKB (Komposit Bulanan) */}
                                            <td className="px-2 py-2 text-center bg-emerald-50/40 dark:bg-emerald-950/20">
                                                <select
                                                    value={item.ikb}
                                                    onChange={(e) =>
                                                        handleBulkCellChange(originalIdx, 'ikb', e.target.value)
                                                    }
                                                    className={`w-full rounded-lg px-2 py-1 text-xs font-extrabold border shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006565] ${
                                                        item.ikb === 'RENTAN'
                                                            ? 'bg-rose-100 text-rose-900 border-rose-400'
                                                            : item.ikb === 'WASPADA'
                                                              ? 'bg-amber-100 text-amber-900 border-amber-400'
                                                              : 'bg-emerald-100 text-emerald-900 border-emerald-400'
                                                    }`}
                                                >
                                                    <option value="AMAN">AMAN</option>
                                                    <option value="WASPADA">WASPADA</option>
                                                    <option value="RENTAN">RENTAN</option>
                                                </select>
                                            </td>

                                            {/* Potensi Kering */}
                                            <td className="px-2 py-2 text-center">
                                                <select
                                                    value={item.potensi_kering}
                                                    onChange={(e) =>
                                                        handleBulkCellChange(originalIdx, 'potensi_kering', e.target.value)
                                                    }
                                                    className={`w-full rounded-lg px-2 py-1 text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006565] ${
                                                        item.potensi_kering === 'AWAS' || item.potensi_kering === 'RENTAN'
                                                            ? 'bg-rose-50 text-rose-800 border-rose-300 font-extrabold'
                                                            : item.potensi_kering === 'SIAGA'
                                                              ? 'bg-orange-50 text-orange-800 border-orange-300 font-extrabold'
                                                              : item.potensi_kering === 'WASPADA'
                                                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                    }`}
                                                >
                                                    <option value="AMAN">AMAN</option>
                                                    <option value="WASPADA">WASPADA</option>
                                                    <option value="SIAGA">SIAGA</option>
                                                    <option value="AWAS">AWAS</option>
                                                </select>
                                            </td>

                                            {/* Potensi Basah */}
                                            <td className="px-2 py-2 text-center">
                                                <select
                                                    value={item.potensi_basah}
                                                    onChange={(e) =>
                                                        handleBulkCellChange(originalIdx, 'potensi_basah', e.target.value)
                                                    }
                                                    className={`w-full rounded-lg px-2 py-1 text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006565] ${
                                                        item.potensi_basah === 'AWAS' || item.potensi_basah === 'RENTAN'
                                                            ? 'bg-rose-50 text-rose-800 border-rose-300 font-extrabold'
                                                            : item.potensi_basah === 'SIAGA'
                                                              ? 'bg-orange-50 text-orange-800 border-orange-300 font-extrabold'
                                                              : item.potensi_basah === 'WASPADA'
                                                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                    }`}
                                                >
                                                    <option value="AMAN">AMAN</option>
                                                    <option value="WASPADA">WASPADA</option>
                                                    <option value="SIAGA">SIAGA</option>
                                                    <option value="AWAS">AWAS</option>
                                                </select>
                                            </td>

                                            {/* Kondisi Iklim */}
                                            <td className="px-2 py-2 text-center">
                                                <select
                                                    value={item.kondisi_iklim}
                                                    onChange={(e) =>
                                                        handleBulkCellChange(originalIdx, 'kondisi_iklim', e.target.value)
                                                    }
                                                    className={`w-full rounded-lg px-2 py-1 text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006565] ${
                                                        item.kondisi_iklim === 'AWAS' || item.kondisi_iklim === 'RENTAN'
                                                            ? 'bg-rose-50 text-rose-800 border-rose-300 font-extrabold'
                                                            : item.kondisi_iklim === 'SIAGA'
                                                              ? 'bg-orange-50 text-orange-800 border-orange-300 font-extrabold'
                                                              : item.kondisi_iklim === 'WASPADA'
                                                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                    }`}
                                                >
                                                    <option value="AMAN">AMAN</option>
                                                    <option value="WASPADA">WASPADA</option>
                                                    <option value="SIAGA">SIAGA</option>
                                                    <option value="AWAS">AWAS</option>
                                                </select>
                                            </td>

                                            {/* Keterangan */}
                                            <td className="px-4 py-2">
                                                <input
                                                    type="text"
                                                    value={item.keterangan || ''}
                                                    onChange={(e) =>
                                                        handleBulkCellChange(originalIdx, 'keterangan', e.target.value)
                                                    }
                                                    placeholder="Catatan pangan atau iklim..."
                                                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:border-[#006565]"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Bottom Save Bar */}
                    <div className="flex items-center justify-between pt-3">
                        <span className="text-xs text-slate-500">
                            Menampilkan 31 kecamatan di Kabupaten Indramayu
                        </span>
                        <Button
                            type="button"
                            onClick={handleSaveBulk}
                            disabled={isSavingBulk}
                            className="gap-2 rounded-xl bg-gradient-to-r from-[#006565] to-emerald-700 font-bold text-xs text-white shadow-md shadow-[#006565]/20 hover:shadow-lg cursor-pointer"
                        >
                            <Save className="h-4 w-4" />
                            <span>{isSavingBulk ? 'Menyimpan Semua Data...' : 'Simpan Data Bulanan 31 Kecamatan'}</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* TAB 2: TABLE LIST & SINGLE CRUD */}
            {activeTab === 'table' && (
                <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white sm:text-lg">
                                Log &amp; Daftar Data SKPG Terdata
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Menampilkan {records.length} data kecamatan yang telah tersimpan di periode ini.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative w-56">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Filter nama/keterangan..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-9 pl-9 rounded-xl text-xs"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-100/90 text-[11px] font-black uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Kecamatan</th>
                                    <th className="px-3 py-3 text-center">Periode</th>
                                    <th className="px-3 py-3 text-center">IKB (Komposit)</th>
                                    <th className="px-3 py-3 text-center">IK (Ketersediaan)</th>
                                    <th className="px-3 py-3 text-center">IA (Akses)</th>
                                    <th className="px-3 py-3 text-center">IP (Gizi)</th>
                                    <th className="px-3 py-3 text-center">Kering</th>
                                    <th className="px-3 py-3 text-center">Basah</th>
                                    <th className="px-3 py-3 text-center">Iklim</th>
                                    <th className="px-4 py-3">Keterangan</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {records.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="py-8 text-center text-slate-400">
                                            Belum ada data SKPG tersimpan untuk periode ini. Gunakan tab "Bulk Input"
                                            untuk mengisi serentak.
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((rec) => {
                                        const badgeIkb = getStatusBadge(rec.ikb);

                                        return (
                                            <tr
                                                key={rec.id}
                                                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="font-extrabold text-slate-900 dark:text-white">
                                                        {rec.kecamatan}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400">
                                                        BPS: {rec.kode_kecamatan}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center font-bold">
                                                    {MONTH_NAMES[rec.month - 1]} {rec.year}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <Badge
                                                        className={`rounded-lg px-2 py-0.5 text-[11px] font-black border ${badgeIkb.badgeClass}`}
                                                    >
                                                        {rec.ikb}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`font-bold ${getStatusBadge(rec.ik).badgeClass} px-2 py-0.5 rounded-md`}>
                                                        {rec.ik}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`font-bold ${getStatusBadge(rec.ia).badgeClass} px-2 py-0.5 rounded-md`}>
                                                        {rec.ia}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`font-bold ${getStatusBadge(rec.ip).badgeClass} px-2 py-0.5 rounded-md`}>
                                                        {rec.ip}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`font-bold ${getStatusBadge(rec.potensi_kering).badgeClass} px-2 py-0.5 rounded-md`}>
                                                        {rec.potensi_kering}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`font-bold ${getStatusBadge(rec.potensi_basah).badgeClass} px-2 py-0.5 rounded-md`}>
                                                        {rec.potensi_basah}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`font-bold ${getStatusBadge(rec.kondisi_iklim).badgeClass} px-2 py-0.5 rounded-md`}>
                                                        {rec.kondisi_iklim}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 max-w-xs truncate text-slate-600">
                                                    {rec.keterangan || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(rec)}
                                                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                                                            title="Edit data"
                                                        >
                                                            <Edit3 className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openDeleteModal(rec)}
                                                            className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                                            title="Hapus data"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CREATE MODAL */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-xl rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                            Tambah Data SKPG Kecamatan
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Masukkan hasil evaluasi indikator peringatan dini kerawanan pangan kecamatan.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Kecamatan</Label>
                                <Select value={formKecamatan} onValueChange={setFormKecamatan}>
                                    <SelectTrigger className="mt-1 h-9 rounded-xl text-xs font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {kecamatanList.map((k) => (
                                            <SelectItem key={k} value={k} className="text-xs font-semibold">
                                                {k}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Bulan</Label>
                                <Select
                                    value={String(formMonth)}
                                    onValueChange={(val) => setFormMonth(Number(val))}
                                >
                                    <SelectTrigger className="mt-1 h-9 rounded-xl text-xs font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTH_NAMES.map((m, idx) => (
                                            <SelectItem key={idx + 1} value={String(idx + 1)} className="text-xs font-semibold">
                                                {m}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Tahun</Label>
                                <Input
                                    type="number"
                                    value={formYear}
                                    onChange={(e) => setFormYear(Number(e.target.value))}
                                    className="mt-1 h-9 rounded-xl text-xs font-bold"
                                />
                            </div>
                        </div>

                        {/* Indicators Grid */}
                        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800 space-y-3">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                                Status Indikator
                            </span>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div>
                                    <Label className="text-[11px] font-bold">IK (Ketersediaan)</Label>
                                    <select
                                        value={formIk}
                                        onChange={(e) => setFormIk(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="RENTAN">RENTAN</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold">IA (Akses)</Label>
                                    <select
                                        value={formIa}
                                        onChange={(e) => setFormIa(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="RENTAN">RENTAN</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold">IP (Gizi)</Label>
                                    <select
                                        value={formIp}
                                        onChange={(e) => setFormIp(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="RENTAN">RENTAN</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold text-emerald-700">IKB (Komposit)</Label>
                                    <select
                                        value={formIkb}
                                        onChange={(e) => setFormIkb(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-emerald-300 bg-emerald-50 p-2 text-xs font-extrabold text-emerald-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="RENTAN">RENTAN</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold">Potensi Kering</Label>
                                    <select
                                        value={formPotensiKering}
                                        onChange={(e) => setFormPotensiKering(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="SIAGA">SIAGA</option>
                                        <option value="AWAS">AWAS</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold">Potensi Basah</Label>
                                    <select
                                        value={formPotensiBasah}
                                        onChange={(e) => setFormPotensiBasah(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="SIAGA">SIAGA</option>
                                        <option value="AWAS">AWAS</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-[11px] font-bold">Kondisi Iklim</Label>
                                    <select
                                        value={formKondisiIklim}
                                        onChange={(e) => setFormKondisiIklim(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="SIAGA">SIAGA</option>
                                        <option value="AWAS">AWAS</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700">Catatan / Keterangan</Label>
                            <Input
                                type="text"
                                placeholder="Misal: Wilayah terpantau stabil, tidak ada anomali..."
                                value={formKeterangan}
                                onChange={(e) => setFormKeterangan(e.target.value)}
                                className="mt-1 rounded-xl text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-xl bg-[#006565] text-white hover:bg-[#004e4e]"
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* EDIT MODAL */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-xl rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                            Edit Data SKPG: Kecamatan {formKecamatan}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Periode {MONTH_NAMES[formMonth - 1]} {formYear}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
                        {/* Indicators Grid */}
                        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800 space-y-3">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                                Ubah Status Indikator
                            </span>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div>
                                    <Label className="text-[11px] font-bold">IK (Ketersediaan)</Label>
                                    <select
                                        value={formIk}
                                        onChange={(e) => setFormIk(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="RENTAN">RENTAN</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold">IA (Akses)</Label>
                                    <select
                                        value={formIa}
                                        onChange={(e) => setFormIa(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="RENTAN">RENTAN</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold">IP (Gizi)</Label>
                                    <select
                                        value={formIp}
                                        onChange={(e) => setFormIp(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="RENTAN">RENTAN</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold text-emerald-700">IKB (Komposit)</Label>
                                    <select
                                        value={formIkb}
                                        onChange={(e) => setFormIkb(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-emerald-300 bg-emerald-50 p-2 text-xs font-extrabold text-emerald-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="RENTAN">RENTAN</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold">Potensi Kering</Label>
                                    <select
                                        value={formPotensiKering}
                                        onChange={(e) => setFormPotensiKering(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="SIAGA">SIAGA</option>
                                        <option value="AWAS">AWAS</option>
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold">Potensi Basah</Label>
                                    <select
                                        value={formPotensiBasah}
                                        onChange={(e) => setFormPotensiBasah(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="SIAGA">SIAGA</option>
                                        <option value="AWAS">AWAS</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-[11px] font-bold">Kondisi Iklim</Label>
                                    <select
                                        value={formKondisiIklim}
                                        onChange={(e) => setFormKondisiIklim(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold dark:bg-slate-900"
                                    >
                                        <option value="AMAN">AMAN</option>
                                        <option value="WASPADA">WASPADA</option>
                                        <option value="SIAGA">SIAGA</option>
                                        <option value="AWAS">AWAS</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700">Catatan / Keterangan</Label>
                            <Input
                                type="text"
                                placeholder="Catatan evaluasi..."
                                value={formKeterangan}
                                onChange={(e) => setFormKeterangan(e.target.value)}
                                className="mt-1 rounded-xl text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                                className="rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-xl bg-[#006565] text-white hover:bg-[#004e4e]"
                            >
                                {isSubmitting ? 'Memperbarui...' : 'Simpan Perubahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE MODAL */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-md rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-rose-600 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            <span>Hapus Data SKPG?</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Apakah Anda yakin ingin menghapus data SKPG Kecamatan{' '}
                            <span className="font-bold text-slate-900 dark:text-white">
                                {selectedRecord?.kecamatan}
                            </span>{' '}
                            periode {selectedRecord && MONTH_NAMES[selectedRecord.month - 1]}{' '}
                            {selectedRecord?.year}? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="rounded-xl"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleDeleteSubmit}
                            disabled={isSubmitting}
                            className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                        >
                            {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL: INPUT COPY-PASTE DARI EXCEL (LANDSCAPE LAYOUT) */}
            <Dialog open={isPasteModalOpen} onOpenChange={setIsPasteModalOpen}>
                <DialogContent className="w-[96vw] max-w-[1440px] sm:max-w-[96vw] lg:max-w-7xl max-h-[92vh] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border border-purple-200/80 dark:border-purple-900/40 bg-white dark:bg-slate-950 shadow-2xl">
                    {/* MODAL HEADER */}
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pr-8">
                            <div>
                                <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                                        <ClipboardPaste className="h-4 w-4" />
                                    </span>
                                    <span>Input SKPG via Copy-Paste dari Excel / Spreadsheet</span>
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Salin tabel dari Excel/Google Sheets lalu tempel di kotak input. Sistem secara otomatis mendeteksi nama kecamatan, kode BPS, dan 7 indikator SKPG tanpa ada bagian form yang terpotong.
                                </DialogDescription>
                            </div>

                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="gap-1.5 px-3 py-1 bg-white/80 dark:bg-slate-800 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs font-bold">
                                    <Calendar className="h-3.5 w-3.5 text-purple-600" />
                                    <span>Periode: {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* MODAL BODY (LANDSCAPE 2-COLUMN GRID) */}
                    <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* LEFT COLUMN: Input Paste Area & Format Options */}
                        <div className="lg:col-span-5 flex flex-col gap-4 min-h-0 lg:overflow-y-auto pr-1">
                            {/* Card 1: Textarea Kotak Penempelan */}
                            <div className="rounded-2xl border border-purple-200/80 bg-purple-50/30 dark:border-purple-900/50 dark:bg-purple-950/20 p-4 flex flex-col gap-2.5 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="skpg-paste-area" className="text-xs font-bold text-slate-900 dark:text-white">
                                            Kotak Penempelan Data
                                        </Label>
                                        {pasteRawText && (
                                            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full">
                                                {pasteRawText.split(/\r?\n/).filter((l) => l.trim().length > 0).length} Baris
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={async () => {
                                                try {
                                                    if (navigator.clipboard && navigator.clipboard.readText) {
                                                        const text = await navigator.clipboard.readText();
                                                        if (text && text.trim()) {
                                                            handlePasteRawChange(text);
                                                            toast.success('Data dari clipboard berhasil ditempelkan!');
                                                            return;
                                                        }
                                                    }
                                                    toast.info('Gunakan Ctrl+V pada kotak teks untuk menempel data.');
                                                } catch {
                                                    toast.info('Gunakan Ctrl+V pada kotak teks untuk menempel data.');
                                                }
                                            }}
                                            className="h-7 px-2 text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg cursor-pointer"
                                            title="Tempel teks langsung dari clipboard"
                                        >
                                            <ClipboardPaste className="h-3 w-3 mr-1" />
                                            <span>Tempel Clipboard</span>
                                        </Button>

                                        {pasteRawText && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setPasteRawText('');
                                                    setParsedPasteRows([]);
                                                }}
                                                className="h-7 px-2 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                                            >
                                                <RotateCcw className="h-3 w-3 mr-1" />
                                                <span>Reset</span>
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <textarea
                                    id="skpg-paste-area"
                                    rows={7}
                                    value={pasteRawText}
                                    onChange={(e) => handlePasteRawChange(e.target.value)}
                                    placeholder="Klik di sini, lalu tekan Ctrl+V untuk menempelkan data tabel yang disalin dari Excel/Spreadsheet..."
                                    className="w-full min-h-[140px] rounded-xl border border-purple-200 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-purple-900/60 dark:bg-slate-900 dark:text-white"
                                />

                                <div className="text-[11px] text-purple-800/80 dark:text-purple-300/80 flex items-center justify-between">
                                    <span>Pemisah kolom otomatis terdeteksi (Tab / Titik-Koma / Koma)</span>
                                    {parsedPasteRows.length > 0 && (
                                        <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                                            ✓ {parsedPasteRows.length} kecamatan cocok
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Card 2: Petunjuk Format & Contoh */}
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4 space-y-3 shadow-xs">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                                            <Info className="h-3.5 w-3.5 text-purple-600" />
                                            <span>Pilihan Format Excel</span>
                                        </h4>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <div className="inline-flex rounded-xl bg-white p-0.5 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                            <button
                                                type="button"
                                                onClick={() => setPasteSampleTab('full')}
                                                className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                                                    pasteSampleTab === 'full'
                                                        ? 'bg-purple-600 text-white shadow-xs'
                                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                                                }`}
                                            >
                                                Lengkap (11 Kolom)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPasteSampleTab('statusOnly')}
                                                className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                                                    pasteSampleTab === 'statusOnly'
                                                        ? 'bg-purple-600 text-white shadow-xs'
                                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                                                }`}
                                            >
                                                Cepat (7 Status)
                                            </button>
                                        </div>

                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleCopySampleToClipboard(pasteSampleTab)}
                                            className="h-7 gap-1 rounded-xl text-[11px] font-bold border-purple-300 text-purple-800 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 cursor-pointer"
                                            title="Salin data contoh format ini ke clipboard Anda"
                                        >
                                            <Copy className="h-3 w-3 text-purple-600" />
                                            <span>Salin Contoh</span>
                                        </Button>
                                    </div>
                                </div>

                                {/* Status Legend Notes */}
                                <div className="space-y-1.5 text-[11px]">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-slate-700 dark:text-slate-300 min-w-[110px]">Ketahanan:</span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">AMAN</span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">WASPADA</span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">RENTAN</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-slate-700 dark:text-slate-300 min-w-[110px]">Iklim &amp; Bencana:</span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">AMAN</span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">WASPADA</span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">SIAGA</span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">AWAS</span>
                                    </div>
                                </div>

                                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 bg-purple-50/60 dark:bg-purple-950/20 p-2 rounded-xl border border-purple-100 dark:border-purple-900/40">
                                    💡 <strong>Tips:</strong> Header tabel tidak perlu dihapus, sistem otomatis mengabaikan baris judul dan mencocokkan nama kecamatan 31 wilayah Kab. Indramayu secara cerdas.
                                </p>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Live Parsing Preview OR Sample Format Guide */}
                        <div className="lg:col-span-7 flex flex-col min-h-0 h-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 overflow-hidden shadow-xs">
                            {parsedPasteRows.length > 0 ? (
                                <div className="flex flex-col h-full min-h-0 space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0 pb-2 border-b border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-slate-900 dark:text-white">
                                                Pratinjau Hasil Parsing Data
                                            </span>
                                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                                                {parsedPasteRows.length} Kecamatan Terdeteksi
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                            <span>Periode: <strong>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</strong></span>
                                        </div>
                                    </div>

                                    {/* Table container with full landscape breadth */}
                                    <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                                        <table className="w-full text-left text-xs whitespace-nowrap">
                                            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 z-10 shadow-xs">
                                                <tr>
                                                    <th className="px-3 py-2 w-10 text-center">No</th>
                                                    <th className="px-3 py-2 min-w-[130px]">Kecamatan</th>
                                                    <th className="px-2 py-2 text-center min-w-[70px]">IK</th>
                                                    <th className="px-2 py-2 text-center min-w-[70px]">IA</th>
                                                    <th className="px-2 py-2 text-center min-w-[70px]">IP</th>
                                                    <th className="px-2 py-2 text-center min-w-[70px]">IKB</th>
                                                    <th className="px-2 py-2 text-center min-w-[80px]">Pot. Kering</th>
                                                    <th className="px-2 py-2 text-center min-w-[80px]">Pot. Basah</th>
                                                    <th className="px-2 py-2 text-center min-w-[80px]">Kondisi Iklim</th>
                                                    <th className="px-3 py-2 min-w-[140px]">Catatan / Keterangan</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-[11px] dark:divide-slate-800">
                                                {parsedPasteRows.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                        <td className="px-3 py-1.5 text-center font-bold text-slate-400">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="px-3 py-1.5 font-extrabold text-slate-900 dark:text-white">
                                                            {row.kecamatan}
                                                        </td>
                                                        <td className="px-2 py-1.5 text-center">
                                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(row.ik).badgeClass}`}>
                                                                {row.ik}
                                                            </span>
                                                        </td>
                                                        <td className="px-2 py-1.5 text-center">
                                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(row.ia).badgeClass}`}>
                                                                {row.ia}
                                                            </span>
                                                        </td>
                                                        <td className="px-2 py-1.5 text-center">
                                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(row.ip).badgeClass}`}>
                                                                {row.ip}
                                                            </span>
                                                        </td>
                                                        <td className="px-2 py-1.5 text-center">
                                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(row.ikb).badgeClass}`}>
                                                                {row.ikb}
                                                            </span>
                                                        </td>
                                                        <td className="px-2 py-1.5 text-center">
                                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(row.potensi_kering).badgeClass}`}>
                                                                {row.potensi_kering}
                                                            </span>
                                                        </td>
                                                        <td className="px-2 py-1.5 text-center">
                                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(row.potensi_basah).badgeClass}`}>
                                                                {row.potensi_basah}
                                                            </span>
                                                        </td>
                                                        <td className="px-2 py-1.5 text-center">
                                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(row.kondisi_iklim).badgeClass}`}>
                                                                {row.kondisi_iklim}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-1.5 text-slate-500 text-[10.5px]">
                                                            {row.keterangan || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full min-h-0 space-y-3">
                                    <div className="flex items-center justify-between shrink-0 pb-2 border-b border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-slate-900 dark:text-white">
                                                Contoh Susunan Kolom Excel ({pasteSampleTab === 'full' ? 'Format Lengkap 11 Kolom' : 'Format Cepat 7 Status'})
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-slate-400">
                                            Belum ada data yang ditempelkan
                                        </span>
                                    </div>

                                    {/* Format Preview Table */}
                                    <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-purple-200/70 bg-slate-50/50 dark:border-purple-900/50 dark:bg-slate-900/90">
                                        {pasteSampleTab === 'full' ? (
                                            <table className="w-full text-left text-[11px] whitespace-nowrap">
                                                <thead className="sticky top-0 bg-purple-100/80 dark:bg-purple-950/60 text-[10px] font-black uppercase text-purple-900 dark:text-purple-200 z-10 shadow-xs">
                                                    <tr>
                                                        <th className="px-2.5 py-2 text-center">No</th>
                                                        <th className="px-3 py-2 min-w-[120px]">Kecamatan</th>
                                                        <th className="px-2.5 py-2">Kode BPS</th>
                                                        <th className="px-2 py-2 text-center min-w-[65px]">IK</th>
                                                        <th className="px-2 py-2 text-center min-w-[65px]">IA</th>
                                                        <th className="px-2 py-2 text-center min-w-[65px]">IP</th>
                                                        <th className="px-2 py-2 text-center min-w-[65px]">IKB</th>
                                                        <th className="px-2 py-2 text-center min-w-[75px]">Kering</th>
                                                        <th className="px-2 py-2 text-center min-w-[75px]">Basah</th>
                                                        <th className="px-2 py-2 text-center min-w-[75px]">Iklim</th>
                                                        <th className="px-3 py-2 min-w-[130px]">Keterangan</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-purple-100 dark:divide-slate-800 font-mono text-[10.5px]">
                                                    <tr>
                                                        <td className="px-2.5 py-1.5 text-center text-slate-400">1</td>
                                                        <td className="px-3 py-1.5 font-bold text-slate-800 dark:text-slate-200">HAURGEULIS</td>
                                                        <td className="px-2.5 py-1.5 text-slate-400">3212010</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-3 py-1.5 text-slate-500 font-sans">Kondisi stabil</td>
                                                    </tr>
                                                    <tr className="bg-purple-50/40 dark:bg-purple-950/20">
                                                        <td className="px-2.5 py-1.5 text-center text-slate-400">2</td>
                                                        <td className="px-3 py-1.5 font-bold text-slate-800 dark:text-slate-200">KROYA</td>
                                                        <td className="px-2.5 py-1.5 text-slate-400">3212020</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-amber-600">WASPADA</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-amber-600">WASPADA</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-orange-600">SIAGA</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-amber-600">WASPADA</td>
                                                        <td className="px-3 py-1.5 text-slate-500 font-sans">Waspada air irigasi</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-2.5 py-1.5 text-center text-slate-400">3</td>
                                                        <td className="px-3 py-1.5 font-bold text-slate-800 dark:text-slate-200">GABUSWETAN</td>
                                                        <td className="px-2.5 py-1.5 text-slate-400">3212030</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-3 py-1.5 text-slate-500 font-sans">Kondisi stabil</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        ) : (
                                            <table className="w-full text-left text-[11px] whitespace-nowrap">
                                                <thead className="sticky top-0 bg-purple-100/80 dark:bg-purple-950/60 text-[10px] font-black uppercase text-purple-900 dark:text-purple-200 z-10 shadow-xs">
                                                    <tr>
                                                        <th className="px-3 py-2 text-center min-w-[140px]">Urutan Baris</th>
                                                        <th className="px-2 py-2 text-center min-w-[85px]">IK (Ketersediaan)</th>
                                                        <th className="px-2 py-2 text-center min-w-[85px]">IA (Akses)</th>
                                                        <th className="px-2 py-2 text-center min-w-[85px]">IP (Pemanfaatan)</th>
                                                        <th className="px-2 py-2 text-center min-w-[85px]">IKB (Komposit)</th>
                                                        <th className="px-2 py-2 text-center min-w-[85px]">Potensi Kering</th>
                                                        <th className="px-2 py-2 text-center min-w-[85px]">Potensi Basah</th>
                                                        <th className="px-2 py-2 text-center min-w-[85px]">Kondisi Iklim</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-purple-100 dark:divide-slate-800 font-mono text-[10.5px]">
                                                    <tr>
                                                        <td className="px-3 py-1.5 text-center font-sans font-bold text-slate-700 dark:text-slate-300">Baris 1 (Haurgeulis)</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                    </tr>
                                                    <tr className="bg-purple-50/40 dark:bg-purple-950/20">
                                                        <td className="px-3 py-1.5 text-center font-sans font-bold text-slate-700 dark:text-slate-300">Baris 2 (Kroya)</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-amber-600">WASPADA</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-amber-600">WASPADA</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-orange-600">SIAGA</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                        <td className="px-2 py-1.5 text-center font-bold text-amber-600">WASPADA</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        )}
                                    </div>

                                    {/* Workflow hint */}
                                    <div className="rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40 p-3 text-[11px] text-purple-900 dark:text-purple-200 space-y-1 shrink-0">
                                        <div className="font-extrabold flex items-center gap-1.5">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
                                            <span>Cara Cepat Menggunakan:</span>
                                        </div>
                                        <ol className="list-decimal list-inside space-y-0.5 text-[10.5px] text-purple-800/90 dark:text-purple-300/90 pl-1">
                                            <li>Buka berkas Excel / Spreadsheet Anda dan pilih blok baris data kecamatan.</li>
                                            <li>Tekan <strong>Ctrl+C</strong> untuk menyalin data dari Excel.</li>
                                            <li>Klik pada <strong>Kotak Penempelan</strong> di sebelah kiri dan tekan <strong>Ctrl+V</strong> (atau klik &ldquo;Tempel Clipboard&rdquo;).</li>
                                            <li>Tabel hasil parsing akan otomatis tampil di sini secara rapi tanpa terpotong.</li>
                                        </ol>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* MODAL FOOTER - PINNED AT BOTTOM */}
                    <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0 flex flex-col sm:flex-row gap-3 sm:justify-between items-center">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsPasteModalOpen(false)}
                                className="w-full sm:w-auto rounded-xl"
                            >
                                Batal
                            </Button>
                            {parsedPasteRows.length > 0 && (
                                <span className="text-xs text-slate-500 hidden md:inline">
                                    <strong>{parsedPasteRows.length}</strong> kecamatan terdeteksi untuk periode <strong>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</strong>
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleApplyPasteToBulk}
                                disabled={parsedPasteRows.length === 0 || isSubmittingPaste}
                                className="w-full sm:w-auto rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 font-bold text-xs cursor-pointer disabled:opacity-50"
                            >
                                Terapkan ke Form Input Cepat ({parsedPasteRows.length})
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSavePasteDirectly}
                                disabled={parsedPasteRows.length === 0 || isSubmittingPaste}
                                className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold text-xs hover:from-purple-800 hover:to-indigo-800 cursor-pointer disabled:opacity-50 shadow-sm"
                            >
                                {isSubmittingPaste ? 'Menyimpan...' : `Simpan Langsung ke Database (${parsedPasteRows.length})`}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* MODAL: IMPORT EXCEL (LANDSCAPE LAYOUT) */}
            <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                <DialogContent className="w-[96vw] max-w-[1400px] sm:max-w-[96vw] lg:max-w-7xl max-h-[92vh] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border border-emerald-200/80 dark:border-emerald-900/40 bg-white dark:bg-slate-950 shadow-2xl">
                    <form onSubmit={handleSubmitImport} className="flex flex-col h-full min-h-0">
                        {/* MODAL HEADER */}
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pr-8">
                                <div>
                                    <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                            <FileSpreadsheet className="h-4 w-4" />
                                        </span>
                                        <span>Import Data SKPG dari File Excel</span>
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Unggah berkas spreadsheet (.xlsx, .csv, .tsv) untuk memperbarui data 31 kecamatan Kabupaten Indramayu tanpa ada bagian form yang terpotong.
                                    </DialogDescription>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="gap-1.5 px-3 py-1 bg-white/80 dark:bg-slate-800 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold">
                                        <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                                        <span>Periode: {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* MODAL BODY (LANDSCAPE 2-COLUMN GRID) */}
                        <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
                            {/* LEFT COLUMN: Upload File & Template Actions */}
                            <div className="lg:col-span-5 flex flex-col gap-4 min-h-0 lg:overflow-y-auto pr-1">
                                {/* Card 1: File Upload Box */}
                                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/20 p-4 space-y-3 shadow-xs">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="skpg-import-file" className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                            <Upload className="h-3.5 w-3.5 text-emerald-600" />
                                            <span>Pilih Berkas Spreadsheet *</span>
                                        </Label>
                                        {importFile && (
                                            <button
                                                type="button"
                                                onClick={() => setImportFile(null)}
                                                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                                            >
                                                Hapus Berkas
                                            </button>
                                        )}
                                    </div>

                                    <div className="relative rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-white/80 dark:bg-slate-900/80 p-5 text-center transition-all hover:bg-emerald-50/50 dark:hover:bg-slate-800/80">
                                        <input
                                            id="skpg-import-file"
                                            type="file"
                                            accept=".xlsx,.xls,.csv,.tsv,.txt"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setImportFile(e.target.files[0]);
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                <FileSpreadsheet className="h-6 w-6" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                                                    {importFile ? importFile.name : 'Klik untuk memilih berkas atau seret ke sini'}
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    Format yang didukung: <strong>.xlsx, .xls, .csv, .tsv</strong>
                                                </p>
                                            </div>
                                            {importFile && (
                                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                                                    Ukuran: {(importFile.size / 1024).toFixed(1)} KB — Siap Diimpor
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Card 2: Unduh Format Template Resmi DKPP */}
                                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-3 shadow-xs">
                                    <div className="flex flex-col gap-1">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                                            <Download className="h-3.5 w-3.5 text-emerald-600" />
                                            <span>Unduh Template Resmi</span>
                                        </h4>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Gunakan template resmi DKPP yang sudah siap pakai dengan daftar 31 kecamatan dan kode BPS Kabupaten Indramayu.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDownloadTemplate('xlsx')}
                                            className="flex-1 h-8 rounded-xl text-xs font-bold text-emerald-800 border-emerald-300 bg-white hover:bg-emerald-50 dark:bg-slate-800 dark:border-emerald-700 dark:text-emerald-300 cursor-pointer"
                                        >
                                            <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                                            <span>Format XLSX</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDownloadTemplate('csv')}
                                            className="flex-1 h-8 rounded-xl text-xs font-bold text-emerald-800 border-emerald-300 bg-white hover:bg-emerald-50 dark:bg-slate-800 dark:border-emerald-700 dark:text-emerald-300 cursor-pointer"
                                        >
                                            <FileText className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                                            <span>Format CSV</span>
                                        </Button>
                                    </div>
                                </div>

                                {/* Card 3: Ketentuan & Catatan */}
                                <div className="rounded-2xl border border-emerald-100 dark:border-emerald-950/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 text-[11px] text-emerald-900 dark:text-emerald-200 space-y-1.5 shadow-xs">
                                    <div className="font-extrabold flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                        <span>Ketentuan Pengisian Berkas:</span>
                                    </div>
                                    <ul className="list-disc list-inside space-y-0.5 text-[10.5px] text-emerald-800/90 dark:text-emerald-300/90 pl-1">
                                        <li>Baris pertama <strong>wajib berupa judul header kolom</strong> (A sampai K).</li>
                                        <li>Status indikator dapat ditulis huruf besar maupun kecil (contoh: <em>AMAN</em>, <em>WASPADA</em>, <em>RENTAN</em>, <em>SIAGA</em>, <em>AWAS</em>).</li>
                                        <li>Kolom kode BPS opsional, sistem otomatis mencocokkan nama kecamatan.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Full Landscape Column Structure Guide */}
                            <div className="lg:col-span-7 flex flex-col min-h-0 h-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 overflow-hidden shadow-xs space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-slate-900 dark:text-white">
                                            Panduan Susunan 11 Kolom Berkas Spreadsheet
                                        </span>
                                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                                            Kolom A — K
                                        </Badge>
                                    </div>
                                    <span className="text-[11px] text-slate-400">
                                        Header baris pertama wajib ada
                                    </span>
                                </div>

                                {/* Spacious Landscape Table Guide */}
                                <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                                    <table className="w-full text-left text-xs whitespace-nowrap">
                                        <thead className="sticky top-0 z-10 shadow-xs">
                                            <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">
                                                <th className="px-2.5 py-1.5 text-center">A</th>
                                                <th className="px-3 py-1.5 min-w-[120px]">B</th>
                                                <th className="px-2.5 py-1.5">C</th>
                                                <th className="px-2 py-1.5 text-center min-w-[65px]">D</th>
                                                <th className="px-2 py-1.5 text-center min-w-[65px]">E</th>
                                                <th className="px-2 py-1.5 text-center min-w-[65px]">F</th>
                                                <th className="px-2 py-1.5 text-center min-w-[65px]">G</th>
                                                <th className="px-2 py-1.5 text-center min-w-[75px]">H</th>
                                                <th className="px-2 py-1.5 text-center min-w-[75px]">I</th>
                                                <th className="px-2 py-1.5 text-center min-w-[75px]">J</th>
                                                <th className="px-3 py-1.5 min-w-[140px]">K</th>
                                            </tr>
                                            <tr className="bg-emerald-100/80 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-200 text-[10.5px] font-extrabold">
                                                <th className="px-2.5 py-2 text-center">No</th>
                                                <th className="px-3 py-2">Kecamatan</th>
                                                <th className="px-2.5 py-2">Kode BPS</th>
                                                <th className="px-2 py-2 text-center">IK</th>
                                                <th className="px-2 py-2 text-center">IA</th>
                                                <th className="px-2 py-2 text-center">IP</th>
                                                <th className="px-2 py-2 text-center">IKB</th>
                                                <th className="px-2 py-2 text-center">Kering</th>
                                                <th className="px-2 py-2 text-center">Basah</th>
                                                <th className="px-2 py-2 text-center">Iklim</th>
                                                <th className="px-3 py-2">Keterangan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-[11px] font-mono dark:divide-slate-800">
                                            <tr>
                                                <td className="px-2.5 py-1.5 text-center text-slate-400">1</td>
                                                <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-white">HAURGEULIS</td>
                                                <td className="px-2.5 py-1.5 text-slate-400">3212010</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                <td className="px-3 py-1.5 text-slate-500 font-sans">Panen lancar</td>
                                            </tr>
                                            <tr className="bg-slate-50/60 dark:bg-slate-800/40">
                                                <td className="px-2.5 py-1.5 text-center text-slate-400">2</td>
                                                <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-white">KROYA</td>
                                                <td className="px-2.5 py-1.5 text-slate-400">3212020</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-amber-600">WASPADA</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-amber-600">WASPADA</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-orange-600">SIAGA</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-amber-600">WASPADA</td>
                                                <td className="px-3 py-1.5 text-slate-500 font-sans">Debit air menurun</td>
                                            </tr>
                                            <tr>
                                                <td className="px-2.5 py-1.5 text-center text-slate-400">3</td>
                                                <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-white">GABUSWETAN</td>
                                                <td className="px-2.5 py-1.5 text-slate-400">3212030</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                <td className="px-2 py-1.5 text-center font-bold text-emerald-600">AMAN</td>
                                                <td className="px-3 py-1.5 text-slate-500 font-sans">Kondisi stabil</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Status Legend Notes */}
                                <div className="space-y-1.5 text-[11px] pt-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-slate-700 dark:text-slate-300 min-w-[110px]">Ketahanan:</span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">AMAN</span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">WASPADA</span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">RENTAN</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-slate-700 dark:text-slate-300 min-w-[110px]">Iklim &amp; Bencana:</span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">AMAN</span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">WASPADA</span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">SIAGA</span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">AWAS</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MODAL FOOTER - PINNED AT BOTTOM */}
                        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0 flex flex-col sm:flex-row gap-3 sm:justify-between items-center">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsImportModalOpen(false);
                                        setImportFile(null);
                                    }}
                                    disabled={isSubmittingImport}
                                    className="w-full sm:w-auto rounded-xl"
                                >
                                    Batal
                                </Button>
                                {importFile && (
                                    <span className="text-xs text-slate-500 hidden md:inline">
                                        Berkas terpilih: <strong>{importFile.name}</strong> ({(importFile.size / 1024).toFixed(1)} KB)
                                    </span>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={!importFile || isSubmittingImport}
                                className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#006565] to-emerald-700 text-white font-bold text-xs hover:from-[#005252] hover:to-emerald-800 cursor-pointer disabled:opacity-50 shadow-sm"
                            >
                                {isSubmittingImport ? 'Mengimpor Data...' : 'Mulai Impor Data'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

