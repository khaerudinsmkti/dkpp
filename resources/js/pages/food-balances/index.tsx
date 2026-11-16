import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    ClipboardPaste,
    Download,
    Edit3,
    FileSpreadsheet,
    HelpCircle,
    Layers,
    Plus,
    Search,
    Trash2,
    TrendingDown,
    TrendingUp,
    Upload,
    Wheat,
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
import { index as foodBalanceCommoditiesIndex } from '@/routes/food-balance-commodities';
import {
    bulkStore as bulkStoreBalanceAction,
    destroy as destroyBalanceAction,
    exportMethod as exportBalanceAction,
    importMethod as importBalanceAction,
    index as foodBalancesIndex,
    store as storeBalanceAction,
    template as templateBalanceAction,
} from '@/routes/food-balances';
import type { BreadcrumbItem } from '@/types';

export interface FoodBalanceRow {
    food_balance_commodity_id: number;
    commodity_name: string;
    commodity_slug: string;
    commodity_image_url?: string | null;
    unit: string;
    order: number;
    food_balance_id: number | null;
    year: number;
    month: number;
    produksi: number | null;
    ketersediaan: number | null;
    kebutuhan: number | null;
    selisih: number | null;
    keterangan: string;
    notes: string | null;
    is_recorded: boolean;
}

export interface CommodityOption {
    id: number;
    name: string;
    slug: string;
    unit: string;
    order: number;
    is_active: boolean;
}

interface PageProps {
    items: FoodBalanceRow[];
    allItems: FoodBalanceRow[];
    commodities: CommodityOption[];
    selectedYear: number;
    selectedMonth: number;
    availableYears: number[];
    filters: {
        search: string;
        status: string;
        year: number;
        month: number;
    };
    statistics: {
        total_commodities: number;
        recorded_count: number;
        surplus_count: number;
        defisit_count: number;
        total_produksi: number;
        total_ketersediaan: number;
        total_kebutuhan: number;
        total_selisih: number;
    };
}

const MONTH_NAMES = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
];

function getMonthLabel(m: number): string {
    return MONTH_NAMES.find((item) => item.value === m)?.label ?? `Bulan ${m}`;
}

function formatNumber(num: number | null): string {
    if (num === null || num === undefined) return '-';
    return Number(num).toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

export default function FoodBalancesIndex({
    items,
    allItems,
    commodities,
    selectedYear,
    selectedMonth,
    availableYears,
    filters,
    statistics,
}: PageProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [currentYear, setCurrentYear] = useState(selectedYear);
    const [currentMonth, setCurrentMonth] = useState(selectedMonth);

    // Apply period filter
    const handlePeriodChange = (newYear: number, newMonth: number) => {
        setCurrentYear(newYear);
        setCurrentMonth(newMonth);
        router.get(
            foodBalancesIndex.url(),
            {
                year: newYear,
                month: newMonth,
                search: searchTerm || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    // Client-side filtering of rows
    const filteredRows = useMemo(() => {
        return items.filter((row) => {
            const matchesSearch =
                searchTerm === '' ||
                row.commodity_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'surplus' && row.keterangan === 'Surplus') ||
                (statusFilter === 'defisit' && row.keterangan === 'Defisit') ||
                (statusFilter === 'unrecorded' && !row.is_recorded);

            return matchesSearch && matchesStatus;
        });
    }, [items, searchTerm, statusFilter]);

    // ==========================================
    // 1. Single Input / Edit Modal State
    // ==========================================
    const [singleModalOpen, setSingleModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<FoodBalanceRow | null>(null);
    const [singleCommodityId, setSingleCommodityId] = useState<number>(commodities[0]?.id || 0);
    const [singleProduksi, setSingleProduksi] = useState<string>('');
    const [singleKetersediaan, setSingleKetersediaan] = useState<string>('');
    const [singleKebutuhan, setSingleKebutuhan] = useState<string>('');
    const [singleNotes, setSingleNotes] = useState<string>('');
    const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);

    // Live automatic calculation for Single Modal
    const singleKetersediaanNum = parseFloat(singleKetersediaan) || 0;
    const singleKebutuhanNum = parseFloat(singleKebutuhan) || 0;
    const singleSelisih = roundToTwo(singleKetersediaanNum - singleKebutuhanNum);
    const singleKeterangan = singleSelisih < 0 ? 'Defisit' : 'Surplus';

    function roundToTwo(num: number): number {
        return Math.round((num + Number.EPSILON) * 100) / 100;
    }

    const handleOpenCreateSingle = () => {
        setEditingRow(null);
        // Find first commodity not recorded or default to first
        const unrecorded = allItems.find((r) => !r.is_recorded);
        setSingleCommodityId(unrecorded?.food_balance_commodity_id || commodities[0]?.id || 0);
        setSingleProduksi('');
        setSingleKetersediaan('');
        setSingleKebutuhan('');
        setSingleNotes('');
        setSingleModalOpen(true);
    };

    const handleOpenEditSingle = (row: FoodBalanceRow) => {
        setEditingRow(row);
        setSingleCommodityId(row.food_balance_commodity_id);
        setSingleProduksi(row.produksi !== null ? String(row.produksi) : '');
        setSingleKetersediaan(row.ketersediaan !== null ? String(row.ketersediaan) : '');
        setSingleKebutuhan(row.kebutuhan !== null ? String(row.kebutuhan) : '');
        setSingleNotes(row.notes || '');
        setSingleModalOpen(true);
    };

    const handleSubmitSingle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!singleCommodityId) {
            toast.error('Pilih komoditas terlebih dahulu.');
            return;
        }

        setIsSubmittingSingle(true);
        router.post(
            storeBalanceAction.url(),
            {
                food_balance_commodity_id: singleCommodityId,
                year: currentYear,
                month: currentMonth,
                produksi: singleProduksi !== '' ? parseFloat(singleProduksi) : 0,
                ketersediaan: singleKetersediaan !== '' ? parseFloat(singleKetersediaan) : 0,
                kebutuhan: singleKebutuhan !== '' ? parseFloat(singleKebutuhan) : 0,
                notes: singleNotes.trim() || undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Data neraca pangan berhasil disimpan.');
                    setSingleModalOpen(false);
                    setIsSubmittingSingle(false);
                },
                onError: (err) => {
                    toast.error('Gagal menyimpan data: ' + Object.values(err)[0]);
                    setIsSubmittingSingle(false);
                },
            }
        );
    };

    // ==========================================
    // 2. Bulk Input Modal State
    // ==========================================
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [bulkSearch, setBulkSearch] = useState('');
    interface BulkRowState {
        commodity_id: number;
        commodity_name: string;
        commodity_image_url?: string | null;
        unit: string;
        produksi: string;
        ketersediaan: string;
        kebutuhan: string;
        notes: string;
    }
    const [bulkRows, setBulkRows] = useState<BulkRowState[]>([]);
    const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

    const handleOpenBulkModal = () => {
        const rows: BulkRowState[] = allItems.map((item) => ({
            commodity_id: item.food_balance_commodity_id,
            commodity_name: item.commodity_name,
            commodity_image_url: item.commodity_image_url,
            unit: item.unit,
            produksi: item.produksi !== null ? String(item.produksi) : '',
            ketersediaan: item.ketersediaan !== null ? String(item.ketersediaan) : '',
            kebutuhan: item.kebutuhan !== null ? String(item.kebutuhan) : '',
            notes: item.notes || '',
        }));
        setBulkRows(rows);
        setBulkSearch('');
        setBulkModalOpen(true);
    };

    const handleBulkFieldChange = (
        commodityId: number,
        field: 'produksi' | 'ketersediaan' | 'kebutuhan' | 'notes',
        value: string
    ) => {
        setBulkRows((prev) =>
            prev.map((r) => (r.commodity_id === commodityId ? { ...r, [field]: value } : r))
        );
    };

    const filteredBulkRows = useMemo(() => {
        if (!bulkSearch.trim()) return bulkRows;
        const q = bulkSearch.toLowerCase();
        return bulkRows.filter((r) => r.commodity_name.toLowerCase().includes(q));
    }, [bulkRows, bulkSearch]);

    const bulkStats = useMemo(() => {
        let filledCount = 0;
        let surplusCount = 0;
        let defisitCount = 0;

        bulkRows.forEach((r) => {
            const hasData = r.produksi !== '' || r.ketersediaan !== '' || r.kebutuhan !== '';
            if (hasData) filledCount++;
            const ket = parseFloat(r.ketersediaan) || 0;
            const keb = parseFloat(r.kebutuhan) || 0;
            if (r.ketersediaan !== '' || r.kebutuhan !== '') {
                if (ket - keb >= 0) surplusCount++;
                else defisitCount++;
            }
        });

        return { filledCount, surplusCount, defisitCount };
    }, [bulkRows]);

    const handleBulkFillZero = () => {
        setBulkRows((prev) =>
            prev.map((r) => ({
                ...r,
                produksi: r.produksi === '' ? '0' : r.produksi,
                ketersediaan: r.ketersediaan === '' ? '0' : r.ketersediaan,
                kebutuhan: r.kebutuhan === '' ? '0' : r.kebutuhan,
            }))
        );
        toast.info('Nilai kosong telah diisi dengan angka 0.');
    };

    const handleBulkClearAll = () => {
        setBulkRows((prev) =>
            prev.map((r) => ({
                ...r,
                produksi: '',
                ketersediaan: '',
                kebutuhan: '',
                notes: '',
            }))
        );
    };

    const handleSubmitBulk = () => {
        setIsSubmittingBulk(true);
        const payload = {
            year: currentYear,
            month: currentMonth,
            items: bulkRows.map((r) => ({
                food_balance_commodity_id: r.commodity_id,
                produksi: r.produksi !== '' ? parseFloat(r.produksi) : null,
                ketersediaan: r.ketersediaan !== '' ? parseFloat(r.ketersediaan) : null,
                kebutuhan: r.kebutuhan !== '' ? parseFloat(r.kebutuhan) : null,
                notes: r.notes.trim() || null,
            })),
        };

        router.post(bulkStoreBalanceAction.url(), payload, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Semua data neraca pangan berhasil disimpan.');
                setBulkModalOpen(false);
                setIsSubmittingBulk(false);
            },
            onError: (err) => {
                toast.error('Gagal menyimpan bulk data: ' + Object.values(err)[0]);
                setIsSubmittingBulk(false);
            },
        });
    };

    // ==========================================
    // 3. Copy-Paste Modal State
    // ==========================================
    const [pasteModalOpen, setPasteModalOpen] = useState(false);
    const [pasteText, setPasteText] = useState('');
    interface ParsedPasteItem {
        commodity_id: number;
        commodity_name: string;
        unit: string;
        produksi: number;
        ketersediaan: number;
        kebutuhan: number;
        selisih: number;
        keterangan: string;
        notes: string | null;
    }
    const [parsedPasteList, setParsedPasteList] = useState<ParsedPasteItem[]>([]);
    const [isSubmittingPaste, setIsSubmittingPaste] = useState(false);

    const handlePasteTextChange = (text: string) => {
        setPasteText(text);
        if (!text.trim()) {
            setParsedPasteList([]);
            return;
        }

        // Parse lines (tab, semicolon, or comma separated)
        const lines = text
            .trim()
            .split(/\r\n|\r|\n/)
            .filter((l) => l.trim().length > 0);

        if (lines.length === 0) {
            setParsedPasteList([]);
            return;
        }

        // Clean commodities map for fuzzy match
        const normCommodities = commodities.map((c) => ({
            ...c,
            clean: c.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        }));

        // Detect if line 0 is header
        const firstLineLower = lines[0].toLowerCase();
        const hasHeader =
            firstLineLower.includes('komoditas') ||
            firstLineLower.includes('produksi') ||
            firstLineLower.includes('ketersediaan') ||
            firstLineLower.includes('kebutuhan') ||
            firstLineLower.includes('nama');

        const dataLines = hasHeader ? lines.slice(1) : lines;

        const results: ParsedPasteItem[] = [];

        dataLines.forEach((line, lineIdx) => {
            // Determine delimiter: tab, semicolon, comma
            const tabs = (line.match(/\t/g) || []).length;
            const semis = (line.match(/;/g) || []).length;
            const commas = (line.match(/,/g) || []).length;

            let delimiter = '\t';
            if (semis > tabs && semis > commas) delimiter = ';';
            else if (commas > tabs && commas > semis) delimiter = ',';

            const parts = line.split(delimiter).map((p) => p.trim());
            if (parts.length === 0) return;

            // Check if parts match a commodity name
            let matchedCommodity: CommodityOption | null = null;
            let numberParts: number[] = [];
            let notePart: string | null = null;

            parts.forEach((part, colIdx) => {
                const cleanPart = part.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (!matchedCommodity && cleanPart.length > 2) {
                    const found = normCommodities.find(
                        (nc) => nc.clean === cleanPart || nc.clean.includes(cleanPart) || cleanPart.includes(nc.clean)
                    );
                    if (found) matchedCommodity = found;
                }

                // Check numeric
                const cleanedNumStr = part
                    .replace(/rp\.?/i, '')
                    .replace(/\s+/g, '')
                    .replace(/\./g, '')
                    .replace(',', '.');
                const num = parseFloat(cleanedNumStr);
                if (!isNaN(num) && isFinite(num)) {
                    numberParts.push(num);
                } else if (part.length > 1 && colIdx >= 4 && !matchedCommodity) {
                    notePart = part;
                }
            });

            // If no commodity matched by name, map by line order
            if (!matchedCommodity) {
                // Check if part 0 is a number index e.g. 1, 2, 3
                const possibleIdx = parseInt(parts[0], 10);
                if (!isNaN(possibleIdx) && possibleIdx >= 1 && possibleIdx <= commodities.length) {
                    matchedCommodity = commodities.find((c) => c.order === possibleIdx) || commodities[possibleIdx - 1] || null;
                    // Remove first number which was the index
                    if (numberParts.length > 0 && numberParts[0] === possibleIdx) {
                        numberParts = numberParts.slice(1);
                    }
                } else {
                    matchedCommodity = commodities[lineIdx] || null;
                }
            }

            if (!matchedCommodity) return;

            const prod = numberParts[0] !== undefined ? numberParts[0] : 0;
            const ket = numberParts[1] !== undefined ? numberParts[1] : 0;
            const keb = numberParts[2] !== undefined ? numberParts[2] : 0;
            const sel = roundToTwo(ket - keb);
            const status = sel < 0 ? 'Defisit' : 'Surplus';

            results.push({
                commodity_id: matchedCommodity.id,
                commodity_name: matchedCommodity.name,
                unit: matchedCommodity.unit,
                produksi: prod,
                ketersediaan: ket,
                kebutuhan: keb,
                selisih: sel,
                keterangan: status,
                notes: notePart,
            });
        });

        setParsedPasteList(results);
    };

    const handleSubmitPaste = () => {
        if (parsedPasteList.length === 0) {
            toast.error('Tidak ada data yang valid untuk disimpan.');
            return;
        }

        setIsSubmittingPaste(true);
        const payload = {
            year: currentYear,
            month: currentMonth,
            items: parsedPasteList.map((item) => ({
                food_balance_commodity_id: item.commodity_id,
                produksi: item.produksi,
                ketersediaan: item.ketersediaan,
                kebutuhan: item.kebutuhan,
                notes: item.notes || null,
            })),
        };

        router.post(bulkStoreBalanceAction.url(), payload, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Berhasil menyimpan ${parsedPasteList.length} data dari copy-paste.`);
                setPasteModalOpen(false);
                setPasteText('');
                setParsedPasteList([]);
                setIsSubmittingPaste(false);
            },
            onError: (err) => {
                toast.error('Gagal menyimpan data copy-paste: ' + Object.values(err)[0]);
                setIsSubmittingPaste(false);
            },
        });
    };

    // ==========================================
    // 4. Import Excel Modal State
    // ==========================================
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isSubmittingImport, setIsSubmittingImport] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImportFile(file);
        }
    };

    const handleSubmitImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) {
            toast.error('Silakan pilih berkas Excel atau CSV terlebih dahulu.');
            return;
        }

        setIsSubmittingImport(true);
        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('year', String(currentYear));
        formData.append('month', String(currentMonth));

        router.post(importBalanceAction.url(), formData, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Impor data neraca pangan berhasil.');
                setImportModalOpen(false);
                setImportFile(null);
                setIsSubmittingImport(false);
            },
            onError: (err) => {
                toast.error('Gagal mengimpor data: ' + Object.values(err)[0]);
                setIsSubmittingImport(false);
            },
        });
    };

    // Download Template
    const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
        window.location.href = `${templateBalanceAction.url()}?year=${currentYear}&month=${currentMonth}&format=${format}`;
    };

    // Export Excel
    const handleExportExcel = () => {
        window.location.href = `${exportBalanceAction.url()}?year=${currentYear}&month=${currentMonth}`;
    };

    // ==========================================
    // 5. Delete Modal State
    // ==========================================
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingRow, setDeletingRow] = useState<FoodBalanceRow | null>(null);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

    const handleOpenDelete = (row: FoodBalanceRow) => {
        setDeletingRow(row);
        setDeleteModalOpen(true);
    };

    const handleSubmitDelete = () => {
        if (!deletingRow || !deletingRow.food_balance_id) return;

        setIsSubmittingDelete(true);
        router.delete(destroyBalanceAction.url(deletingRow.food_balance_id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Data neraca ${deletingRow.commodity_name} berhasil dihapus.`);
                setDeleteModalOpen(false);
                setIsSubmittingDelete(false);
            },
            onError: (err) => {
                toast.error('Gagal menghapus data: ' + Object.values(err)[0]);
                setIsSubmittingDelete(false);
            },
        });
    };

    return (
        <>
            <Head title={`Neraca Pangan Bulanan (${getMonthLabel(currentMonth)} ${currentYear}) - DKPP Indramayu`} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                                <Layers className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    Neraca Pangan Bulanan
                                </h1>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Kabupaten Indramayu &bull; Periode {getMonthLabel(currentMonth)} {currentYear}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons Toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Kelola Komoditas Link */}
                        <Button
                            variant="outline"
                            asChild
                            className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                        >
                            <Link href={foodBalanceCommoditiesIndex.url()}>
                                <Wheat className="size-4 text-emerald-600" />
                                Kelola Komoditas
                            </Link>
                        </Button>

                        {/* Export Excel */}
                        <Button
                            variant="outline"
                            onClick={handleExportExcel}
                            className="gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                            title="Unduh data bulan ini ke Excel"
                        >
                            <Download className="size-4 text-blue-600" />
                            Export Excel
                        </Button>

                        {/* Import Excel */}
                        <Button
                            variant="outline"
                            onClick={() => setImportModalOpen(true)}
                            className="gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
                        >
                            <Upload className="size-4 text-emerald-600" />
                            Import Excel
                        </Button>

                        {/* Copy Paste Input */}
                        <Button
                            variant="outline"
                            onClick={() => {
                                setPasteText('');
                                setParsedPasteList([]);
                                setPasteModalOpen(true);
                            }}
                            className="gap-1.5 border-purple-300 text-purple-800 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300"
                        >
                            <ClipboardPaste className="size-4 text-purple-600" />
                            Input Copy-Paste
                        </Button>

                        {/* Bulk Input */}
                        <Button
                            variant="outline"
                            onClick={handleOpenBulkModal}
                            className="gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300"
                        >
                            <FileSpreadsheet className="size-4 text-amber-600" />
                            Bulk Input
                        </Button>

                        {/* Add Single Data */}
                        <Button
                            onClick={handleOpenCreateSingle}
                            className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                        >
                            <Plus className="size-4" />
                            Tambah Data
                        </Button>
                    </div>
                </div>

                {/* Period Selector & Quick Filters */}
                <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
                    {/* Period (Month & Year) Picker */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <Calendar className="size-4 text-emerald-600" />
                            Periode:
                        </div>

                        <Select
                            value={String(currentMonth)}
                            onValueChange={(val) => handlePeriodChange(currentYear, parseInt(val, 10))}
                        >
                            <SelectTrigger className="w-36 h-9 border-slate-200 dark:border-slate-700 font-medium">
                                <SelectValue placeholder="Pilih Bulan" />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTH_NAMES.map((m) => (
                                    <SelectItem key={m.value} value={String(m.value)}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={String(currentYear)}
                            onValueChange={(val) => handlePeriodChange(parseInt(val, 10), currentMonth)}
                        >
                            <SelectTrigger className="w-28 h-9 border-slate-200 dark:border-slate-700 font-medium">
                                <SelectValue placeholder="Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableYears.map((yr) => (
                                    <SelectItem key={yr} value={String(yr)}>
                                        {yr}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search & Status Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative min-w-[200px] flex-1 sm:w-60">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Cari nama komoditas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9 border-slate-200 dark:border-slate-700"
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-36 h-9 border-slate-200 dark:border-slate-700">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="surplus">Surplus</SelectItem>
                                <SelectItem value="defisit">Defisit</SelectItem>
                                <SelectItem value="unrecorded">Belum Diinput</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Summary Statistics Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Commodities */}
                    <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Total Komoditas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between">
                                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {statistics.total_commodities} Komoditas
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    {statistics.recorded_count}/{statistics.total_commodities} terisi
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                {statistics.recorded_count === statistics.total_commodities
                                    ? 'Semua data telah terinput'
                                    : `${statistics.total_commodities - statistics.recorded_count} komoditas belum diinput`}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Surplus Count */}
                    <Card className="border-emerald-200/70 bg-emerald-50/30 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-emerald-700 uppercase tracking-wider dark:text-emerald-400">
                                Status Surplus
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="size-5 text-emerald-600" />
                                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                                    {statistics.surplus_count} Komoditas
                                </div>
                            </div>
                            <p className="text-xs text-emerald-600/80 mt-1 dark:text-emerald-400/70">
                                Ketersediaan mencukupi / melebihi kebutuhan
                            </p>
                        </CardContent>
                    </Card>

                    {/* Defisit Count */}
                    <Card className="border-rose-200/70 bg-rose-50/30 shadow-sm dark:border-rose-900 dark:bg-rose-950/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-rose-700 uppercase tracking-wider dark:text-rose-400">
                                Status Defisit
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <TrendingDown className="size-5 text-rose-600" />
                                <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                                    {statistics.defisit_count} Komoditas
                                </div>
                            </div>
                            <p className="text-xs text-rose-600/80 mt-1 dark:text-rose-400/70">
                                Kebutuhan melebihi ketersediaan pangan
                            </p>
                        </CardContent>
                    </Card>

                    {/* Net Balance (Total Selisih) */}
                    <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Total Neraca (Ketersediaan - Kebutuhan)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <div
                                    className={`text-2xl font-bold ${
                                        statistics.total_selisih < 0
                                            ? 'text-rose-600 dark:text-rose-400'
                                            : 'text-emerald-600 dark:text-emerald-400'
                                    }`}
                                >
                                    {statistics.total_selisih >= 0 ? '+' : ''}
                                    {formatNumber(statistics.total_selisih)} Ton
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Ket: {formatNumber(statistics.total_ketersediaan)} &bull; Keb: {formatNumber(statistics.total_kebutuhan)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Table Card */}
                <Card className="border-slate-200/80 shadow-sm overflow-hidden dark:border-slate-800">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-50 border-b border-slate-200/80 text-xs uppercase text-slate-500 font-semibold dark:bg-slate-800/50 dark:border-slate-700">
                                <tr>
                                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                                    <th className="py-3.5 px-4">Nama Komoditas</th>
                                    <th className="py-3.5 px-4 w-24 text-center">Satuan</th>
                                    <th className="py-3.5 px-4 text-right">Produksi</th>
                                    <th className="py-3.5 px-4 text-right">Ketersediaan</th>
                                    <th className="py-3.5 px-4 text-right">Kebutuhan</th>
                                    <th className="py-3.5 px-4 text-right">Selisih</th>
                                    <th className="py-3.5 px-4 w-32 text-center">Keterangan</th>
                                    <th className="py-3.5 px-4">Catatan</th>
                                    <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Layers className="size-8 text-slate-300" />
                                                <p className="text-sm">Tidak ada komoditas yang sesuai filter.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((row, idx) => {
                                        const isSurplus = row.keterangan === 'Surplus';
                                        const isDefisit = row.keterangan === 'Defisit';

                                        return (
                                            <tr
                                                key={row.food_balance_commodity_id}
                                                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                            >
                                                <td className="py-3.5 px-4 text-center text-slate-400 font-medium text-xs">
                                                    {idx + 1}
                                                </td>
                                                <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                                                    <div className="flex items-center gap-2.5">
                                                        {row.commodity_image_url ? (
                                                            <div className="size-8 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100 shadow-2xs dark:border-slate-700 dark:bg-slate-800">
                                                                <img
                                                                    src={row.commodity_image_url}
                                                                    alt={row.commodity_name}
                                                                    className="h-full w-full object-cover"
                                                                    loading="lazy"
                                                                />
                                                            </div>
                                                        ) : null}
                                                        <span>{row.commodity_name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-slate-100 text-slate-700 text-xs dark:bg-slate-800 dark:text-slate-300 font-normal"
                                                    >
                                                        {row.unit}
                                                    </Badge>
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                                                    {row.is_recorded ? formatNumber(row.produksi) : '-'}
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                                                    {row.is_recorded ? formatNumber(row.ketersediaan) : '-'}
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                                                    {row.is_recorded ? formatNumber(row.kebutuhan) : '-'}
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold">
                                                    {row.is_recorded ? (
                                                        <span
                                                            className={
                                                                row.selisih !== null && row.selisih < 0
                                                                    ? 'text-rose-600 dark:text-rose-400'
                                                                    : 'text-emerald-600 dark:text-emerald-400'
                                                            }
                                                        >
                                                            {row.selisih !== null && row.selisih >= 0 ? '+' : ''}
                                                            {formatNumber(row.selisih)}
                                                        </span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    {!row.is_recorded ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                            Belum Diisi
                                                        </span>
                                                    ) : isSurplus ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                            <CheckCircle2 className="size-3" />
                                                            Surplus
                                                        </span>
                                                    ) : isDefisit ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                                            <AlertCircle className="size-3" />
                                                            Defisit
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                            {row.keterangan}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                                                    {row.notes || '-'}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleOpenEditSingle(row)}
                                                            className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800"
                                                            title="Edit Data Komoditas"
                                                        >
                                                            <Edit3 className="size-4" />
                                                        </Button>

                                                        {row.is_recorded && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleOpenDelete(row)}
                                                                className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                                                                title="Hapus Data"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        )}
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

                {/* ======================================================== */}
                {/* MODAL 1: Single Input / Edit Data                        */}
                {/* ======================================================== */}
                <Dialog open={singleModalOpen} onOpenChange={setSingleModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {editingRow ? `Ubah Data Neraca: ${editingRow.commodity_name}` : 'Tambah Data Neraca'}
                            </DialogTitle>
                            <DialogDescription>
                                Periode {getMonthLabel(currentMonth)} {currentYear} &bull; Nilai selisih dan keterangan akan dihitung otomatis.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitSingle} className="space-y-4">
                            {/* Commodity Selection (disabled if editing) */}
                            <div className="space-y-1.5">
                                <Label htmlFor="single-comm">Komoditas *</Label>
                                {editingRow ? (
                                    <Input
                                        id="single-comm"
                                        value={`${editingRow.commodity_name} (${editingRow.unit})`}
                                        disabled
                                        className="bg-slate-50 dark:bg-slate-800"
                                    />
                                ) : (
                                    <Select
                                        value={String(singleCommodityId)}
                                        onValueChange={(val) => setSingleCommodityId(parseInt(val, 10))}
                                    >
                                        <SelectTrigger id="single-comm">
                                            <SelectValue placeholder="Pilih Komoditas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {commodities.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.name} ({c.unit})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            {/* Inputs: Produksi, Ketersediaan, Kebutuhan */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="single-prod">Produksi *</Label>
                                    <Input
                                        id="single-prod"
                                        type="number"
                                        step="any"
                                        min="0"
                                        placeholder="0"
                                        value={singleProduksi}
                                        onChange={(e) => setSingleProduksi(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="single-ket">Ketersediaan *</Label>
                                    <Input
                                        id="single-ket"
                                        type="number"
                                        step="any"
                                        min="0"
                                        placeholder="0"
                                        value={singleKetersediaan}
                                        onChange={(e) => setSingleKetersediaan(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="single-keb">Kebutuhan *</Label>
                                    <Input
                                        id="single-keb"
                                        type="number"
                                        step="any"
                                        min="0"
                                        placeholder="0"
                                        value={singleKebutuhan}
                                        onChange={(e) => setSingleKebutuhan(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Live Calculated Display (Selisih & Keterangan) */}
                            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-800/40">
                                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Perhitungan Otomatis
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-slate-500">Selisih (Ketersediaan - Kebutuhan)</div>
                                        <div
                                            className={`text-lg font-bold ${
                                                singleSelisih < 0
                                                    ? 'text-rose-600 dark:text-rose-400'
                                                    : 'text-emerald-600 dark:text-emerald-400'
                                            }`}
                                        >
                                            {singleSelisih >= 0 ? '+' : ''}
                                            {formatNumber(singleSelisih)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500">Status Neraca</div>
                                        <div className="mt-0.5">
                                            {singleSelisih >= 0 ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                    Surplus
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                                    <AlertCircle className="size-3.5 text-rose-600" />
                                                    Defisit
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1.5">
                                <Label htmlFor="single-notes">Catatan (Opsional)</Label>
                                <Input
                                    id="single-notes"
                                    placeholder="Keterangan tambahan..."
                                    value={singleNotes}
                                    onChange={(e) => setSingleNotes(e.target.value)}
                                />
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSingleModalOpen(false)}
                                    disabled={isSubmittingSingle}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={isSubmittingSingle}
                                >
                                    {isSubmittingSingle ? 'Menyimpan...' : 'Simpan Data'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ======================================================== */}
                {/* MODAL 2: Bulk Input Modal (LANDSCAPE LAYOUT)              */}
                {/* ======================================================== */}
                <Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
                    <DialogContent className="w-[96vw] max-w-[1440px] sm:max-w-[96vw] lg:max-w-7xl max-h-[92vh] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border border-emerald-200/80 dark:border-emerald-900/40 bg-white dark:bg-slate-950 shadow-2xl">
                        {/* MODAL HEADER */}
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pr-8">
                                <div>
                                    <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                            <Layers className="h-4 w-4" />
                                        </span>
                                        <span>Bulk Input Neraca Pangan Bulanan</span>
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Input serentak produksi, ketersediaan, dan kebutuhan untuk semua komoditas periode {getMonthLabel(currentMonth)} {currentYear} tanpa ada kolom yang terpotong.
                                    </DialogDescription>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="gap-1.5 px-3 py-1 bg-white/80 dark:bg-slate-800 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold">
                                        <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                                        <span>Periode: {getMonthLabel(currentMonth)} {currentYear}</span>
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Quick Helper Tools & Search Bar */}
                        <div className="px-6 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative w-64">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <Input
                                        type="text"
                                        placeholder="Cari komoditas..."
                                        value={bulkSearch}
                                        onChange={(e) => setBulkSearch(e.target.value)}
                                        className="h-8 pl-8 pr-7 text-xs rounded-xl border-slate-200 dark:border-slate-800"
                                    />
                                    {bulkSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setBulkSearch('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer font-bold"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <Badge variant="outline" className="text-[11px] bg-slate-50 dark:bg-slate-800/80 font-bold">
                                        {bulkStats.filledCount} / {bulkRows.length} Terisi
                                    </Badge>
                                    <Badge className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border-emerald-200">
                                        {bulkStats.surplusCount} Surplus
                                    </Badge>
                                    <Badge className="text-[10px] font-bold bg-rose-100 text-rose-800 border-rose-200">
                                        {bulkStats.defisitCount} Defisit
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBulkFillZero}
                                    className="h-8 text-xs font-bold rounded-xl border-emerald-200 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 cursor-pointer"
                                >
                                    Isi 0 yang Kosong
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleBulkClearAll}
                                    className="h-8 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl cursor-pointer"
                                >
                                    Kosongkan Semua
                                </Button>
                            </div>
                        </div>

                        {/* Bulk Grid Table with Full Landscape Width */}
                        <div className="flex-1 min-h-0 overflow-auto px-6 py-3">
                            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                                <table className="w-full text-left text-xs whitespace-nowrap">
                                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-[10.5px] font-black uppercase text-slate-700 dark:text-slate-300 z-10 shadow-xs">
                                        <tr>
                                            <th className="py-2.5 px-3 w-12 text-center">No</th>
                                            <th className="py-2.5 px-3 min-w-[220px]">Komoditas</th>
                                            <th className="py-2.5 px-3 min-w-[130px] text-center">Produksi</th>
                                            <th className="py-2.5 px-3 min-w-[130px] text-center">Ketersediaan</th>
                                            <th className="py-2.5 px-3 min-w-[130px] text-center">Kebutuhan</th>
                                            <th className="py-2.5 px-3 min-w-[120px] text-right">Selisih</th>
                                            <th className="py-2.5 px-3 min-w-[100px] text-center">Status</th>
                                            <th className="py-2.5 px-3 min-w-[220px]">Catatan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredBulkRows.map((r, idx) => {
                                            const ketNum = parseFloat(r.ketersediaan) || 0;
                                            const kebNum = parseFloat(r.kebutuhan) || 0;
                                            const hasData = r.ketersediaan !== '' || r.kebutuhan !== '';
                                            const diff = roundToTwo(ketNum - kebNum);
                                            const isSurplus = diff >= 0;

                                            return (
                                                <tr key={r.commodity_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                                    <td className="py-2 px-3 text-center text-slate-400 font-mono">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <div className="flex items-center gap-2.5">
                                                            {r.commodity_image_url ? (
                                                                <img
                                                                    src={r.commodity_image_url}
                                                                    alt={r.commodity_name}
                                                                    className="h-7 w-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                                                                />
                                                            ) : (
                                                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50 shrink-0">
                                                                    <Wheat className="h-3.5 w-3.5" />
                                                                </span>
                                                            )}
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <span className="font-extrabold text-slate-900 dark:text-white truncate">
                                                                    {r.commodity_name}
                                                                </span>
                                                                <span className="text-[10px] text-slate-500 font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shrink-0">
                                                                    ({r.unit})
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            min="0"
                                                            value={r.produksi}
                                                            onChange={(e) => handleBulkFieldChange(r.commodity_id, 'produksi', e.target.value)}
                                                            className="h-8 text-right font-mono text-xs font-semibold rounded-lg focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            min="0"
                                                            value={r.ketersediaan}
                                                            onChange={(e) => handleBulkFieldChange(r.commodity_id, 'ketersediaan', e.target.value)}
                                                            className="h-8 text-right font-mono text-xs font-semibold rounded-lg focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            min="0"
                                                            value={r.kebutuhan}
                                                            onChange={(e) => handleBulkFieldChange(r.commodity_id, 'kebutuhan', e.target.value)}
                                                            className="h-8 text-right font-mono text-xs font-semibold rounded-lg focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-mono font-bold">
                                                        {hasData ? (
                                                            <span className={diff < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                                                                {diff >= 0 ? '+' : ''}
                                                                {formatNumber(diff)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        {hasData ? (
                                                            isSurplus ? (
                                                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                                                                    Surplus
                                                                </Badge>
                                                            ) : (
                                                                <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] font-bold">
                                                                    Defisit
                                                                </Badge>
                                                            )
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <Input
                                                            type="text"
                                                            value={r.notes}
                                                            onChange={(e) => handleBulkFieldChange(r.commodity_id, 'notes', e.target.value)}
                                                            className="h-8 text-xs rounded-lg"
                                                            placeholder="Catatan..."
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* MODAL FOOTER - PINNED AT BOTTOM */}
                        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0 flex flex-col sm:flex-row gap-3 sm:justify-between items-center">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setBulkModalOpen(false)}
                                    disabled={isSubmittingBulk}
                                    className="w-full sm:w-auto rounded-xl"
                                >
                                    Batal
                                </Button>
                                <span className="text-xs text-slate-500 hidden md:inline">
                                    Total <strong>{bulkRows.length} komoditas</strong> untuk periode <strong>{getMonthLabel(currentMonth)} {currentYear}</strong>
                                </span>
                            </div>

                            <Button
                                type="button"
                                onClick={handleSubmitBulk}
                                disabled={isSubmittingBulk}
                                className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#006565] to-emerald-700 text-white font-bold text-xs hover:from-[#005252] hover:to-emerald-800 cursor-pointer disabled:opacity-50 shadow-sm"
                            >
                                {isSubmittingBulk ? 'Menyimpan...' : `Simpan Semua Data (${bulkRows.length} Komoditas)`}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* ======================================================== */}
                {/* MODAL 3: Input Copy-Paste Modal                          */}
                {/* ======================================================== */}
                <Dialog open={pasteModalOpen} onOpenChange={setPasteModalOpen}>
                    <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl">
                                Input Neraca via Copy-Paste
                            </DialogTitle>
                            <DialogDescription>
                                Salin (Copy) tabel angka atau data dari Excel / Spreadsheet, lalu tempel (Paste) di kotak berikut.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 flex-1 overflow-y-auto">
                            <div className="rounded-lg bg-blue-50/70 p-3 text-xs text-blue-800 border border-blue-200/60 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-300">
                                <div className="font-semibold flex items-center gap-1.5 mb-1">
                                    <HelpCircle className="size-3.5" />
                                    Format yang didukung:
                                </div>
                                <ul className="list-disc pl-4 space-y-0.5">
                                    <li>
                                        <strong>3 Kolom Angka:</strong> Kolom Produksi, Ketersediaan, Kebutuhan (akan dipetakan urut sesuai 11 komoditas).
                                    </li>
                                    <li>
                                        <strong>Dengan Nama Komoditas:</strong> Kolom Nama Komoditas, Produksi, Ketersediaan, Kebutuhan.
                                    </li>
                                    <li>
                                        <strong>Salinan Tabel Lengkap:</strong> Termasuk kolom No, Nama, Satuan, Produksi, Ketersediaan, Kebutuhan.
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="paste-textarea" className="text-xs font-semibold">
                                    Tempelkan Data Disini (Ctrl + V):
                                </Label>
                                <textarea
                                    id="paste-textarea"
                                    rows={6}
                                    value={pasteText}
                                    onChange={(e) => handlePasteTextChange(e.target.value)}
                                    placeholder="Contoh:&#10;Beras	12000	14500	11000&#10;Gula Pasir	200	350	400&#10;Minyak Goreng	500	650	600"
                                    className="w-full rounded-md border border-slate-300 p-2.5 font-mono text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                                />
                            </div>

                            {/* Live Parsed Preview Table */}
                            {parsedPasteList.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Pratinjau Hasil Parsing ({parsedPasteList.length} komoditas terdeteksi):
                                        </div>
                                    </div>

                                    <div className="max-h-48 overflow-y-auto border rounded-lg border-slate-200 dark:border-slate-800">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700">
                                                <tr>
                                                    <th className="py-2 px-3">Komoditas</th>
                                                    <th className="py-2 px-3 text-right">Produksi</th>
                                                    <th className="py-2 px-3 text-right">Ketersediaan</th>
                                                    <th className="py-2 px-3 text-right">Kebutuhan</th>
                                                    <th className="py-2 px-3 text-right">Selisih</th>
                                                    <th className="py-2 px-3 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {parsedPasteList.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50">
                                                        <td className="py-1.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                                            {item.commodity_name}
                                                        </td>
                                                        <td className="py-1.5 px-3 text-right font-mono">
                                                            {formatNumber(item.produksi)}
                                                        </td>
                                                        <td className="py-1.5 px-3 text-right font-mono font-medium">
                                                            {formatNumber(item.ketersediaan)}
                                                        </td>
                                                        <td className="py-1.5 px-3 text-right font-mono font-medium">
                                                            {formatNumber(item.kebutuhan)}
                                                        </td>
                                                        <td className="py-1.5 px-3 text-right font-mono font-bold">
                                                            <span className={item.selisih < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                                                                {item.selisih >= 0 ? '+' : ''}
                                                                {formatNumber(item.selisih)}
                                                            </span>
                                                        </td>
                                                        <td className="py-1.5 px-3 text-center">
                                                            <span
                                                                className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                    item.keterangan === 'Surplus'
                                                                        ? 'bg-emerald-100 text-emerald-800'
                                                                        : 'bg-rose-100 text-rose-800'
                                                                }`}
                                                            >
                                                                {item.keterangan}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setPasteModalOpen(false)}
                                disabled={isSubmittingPaste}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmitPaste}
                                disabled={parsedPasteList.length === 0 || isSubmittingPaste}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                {isSubmittingPaste
                                    ? 'Menyimpan...'
                                    : `Terapkan & Simpan (${parsedPasteList.length} Baris)`}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ======================================================== */}
                {/* MODAL 4: Import Excel Modal                              */}
                {/* ======================================================== */}
                <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Import Data dari Excel</DialogTitle>
                            <DialogDescription>
                                Unggah berkas spreadsheet (.xlsx, .csv) untuk periode {getMonthLabel(currentMonth)} {currentYear}.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitImport} className="space-y-4">
                            {/* Template Download Prompt */}
                            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-800/40">
                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Unduh Format Template Resmi:
                                </div>
                                <p className="text-xs text-slate-500">
                                    Gunakan template resmi DKPP agar format nama komoditas dan kolom terdeteksi otomatis dengan akurat.
                                </p>
                                <div className="flex items-center gap-2 pt-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownloadTemplate('xlsx')}
                                        className="h-8 gap-1.5 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100/60"
                                    >
                                        <Download className="size-3.5" />
                                        Template XLSX
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownloadTemplate('csv')}
                                        className="h-8 gap-1.5 text-xs"
                                    >
                                        <Download className="size-3.5" />
                                        Template CSV
                                    </Button>
                                </div>
                            </div>

                            {/* File Upload Field */}
                            <div className="space-y-1.5">
                                <Label htmlFor="import-file">Pilih Berkas (.xlsx, .csv, .tsv) *</Label>
                                <Input
                                    id="import-file"
                                    type="file"
                                    accept=".xlsx,.csv,.xls,.tsv,.txt"
                                    onChange={handleFileChange}
                                    required
                                />
                                {importFile && (
                                    <p className="text-xs text-emerald-600 font-medium">
                                        Berkas terpilih: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                                    </p>
                                )}
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setImportModalOpen(false)}
                                    disabled={isSubmittingImport}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={!importFile || isSubmittingImport}
                                >
                                    {isSubmittingImport ? 'Mengimpor...' : 'Mulai Impor Data'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ======================================================== */}
                {/* MODAL 5: Delete Confirmation Modal                       */}
                {/* ======================================================== */}
                <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-rose-600">Hapus Data Neraca</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus data neraca pangan komoditas{' '}
                                <strong className="text-slate-900 dark:text-slate-100">
                                    {deletingRow?.commodity_name}
                                </strong>{' '}
                                periode {getMonthLabel(currentMonth)} {currentYear}?
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDeleteModalOpen(false)}
                                disabled={isSubmittingDelete}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleSubmitDelete}
                                disabled={isSubmittingDelete}
                            >
                                {isSubmittingDelete ? 'Menghapus...' : 'Ya, Hapus Data'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

FoodBalancesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Neraca Pangan Bulanan',
            href: foodBalancesIndex(),
        },
    ] satisfies BreadcrumbItem[],
};
