import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    Calendar,
    CheckCheck,
    CheckCircle2,
    ClipboardPaste,
    DollarSign,
    Download,
    Edit3,
    FileSpreadsheet,
    FileText,
    History,
    Layers,
    Plus,
    RefreshCw,
    Scale,
    Search,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';
import {
    bulkStore as bulkStoreProducerAction,
    destroy as destroyProducerAction,
    importMethod as importProducerAction,
    index as producerPricesIndex,
    store as storeProducerAction,
    template as templateProducerAction,
} from '@/routes/producer-prices';
import type { BreadcrumbItem } from '@/types';

export interface ProducerCommodityItem {
    key: 'gkp_petani' | 'gkp_penggilingan' | 'gkg_penggilingan' | 'beras_medium_penggilingan' | 'beras_premium_penggilingan' | 'sapi_hidup';
    name: string;
    short_name: string;
    category: string;
    unit: string;
    order: number;
    hap: number;
    hap_label: string;
    description: string;
    price: number | null;
    yesterday_price: number | null;
    diff_hap: number | null;
    diff_hap_percentage: number | null;
    status: 'above' | 'equal' | 'below' | 'not_recorded';
    diff_yesterday: number | null;
    diff_yesterday_percentage: number | null;
    change_type: 'up' | 'down' | 'stable';
}

export interface HistoryRecord {
    id: number;
    recorded_date: string;
    formatted_date: string;
    day_name: string;
    gkp_petani: number | null;
    gkp_penggilingan: number | null;
    gkg_penggilingan: number | null;
    beras_medium_penggilingan: number | null;
    beras_premium_penggilingan: number | null;
    sapi_hidup: number | null;
    notes: string | null;
    creator_name: string;
    updated_at: string | null;
}

export interface PageProps {
    selectedDate: string;
    prevDate: string | null;
    minDate: string;
    maxDate: string;
    currentRecord: {
        id: number;
        recorded_date: string;
        notes: string | null;
        creator_name: string | null;
        updated_at: string | null;
    } | null;
    items: ProducerCommodityItem[];
    commoditiesConfig: {
        key: string;
        name: string;
        short_name: string;
        category: string;
        unit: string;
        order: number;
        hap: number;
        hap_label: string;
        description: string;
    }[];
    historyRecords: HistoryRecord[];
    statistics: {
        total_commodities: number;
        recorded_count: number;
        above_hap_count: number;
        below_hap_count: number;
        equal_hap_count: number;
        latest_date: string;
    };
}

function parsePrice(val: string): number | null {
    if (!val) return null;
    let clean = val.replace(/^(rp|idr)\.?\s*/i, '').trim();
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(clean)) {
        clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(clean)) {
        clean = clean.replace(/,/g, '');
    } else {
        clean = clean.replace(',', '.');
    }
    clean = clean.replace(/[^\d.]/g, '');
    const num = parseFloat(clean);
    return !isNaN(num) && num > 0 ? num : null;
}

function addDaysToDateString(dateStr: string, days: number): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function extractDateFromText(text: string, baseDate?: string): string | null {
    const clean = text.trim();
    const isoMatch = clean.match(/\b(20\d{2})[-_\/](\d{1,2})[-_\/](\d{1,2})\b/);
    if (isoMatch) {
        const y = parseInt(isoMatch[1], 10);
        const m = parseInt(isoMatch[2], 10);
        const d = parseInt(isoMatch[3], 10);
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    const dmyMatch = clean.match(/\b(\d{1,2})[-_\/](\d{1,2})[-_\/](20\d{2})\b/);
    if (dmyMatch) {
        const d = parseInt(dmyMatch[1], 10);
        const m = parseInt(dmyMatch[2], 10);
        const y = parseInt(dmyMatch[3], 10);
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    const dayMatch = clean.match(/^(?:tgl|hari|tanggal)?\s*(\d{1,2})$/i);
    if (dayMatch && baseDate) {
        const dayNum = parseInt(dayMatch[1], 10);
        if (dayNum >= 1 && dayNum <= 31) {
            const [by, bm] = baseDate.split('-').map(Number);
            return `${by}-${String(bm).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        }
    }

    return null;
}

interface ParsedClipboard {
    pricesByDate: Record<string, Record<string, string>>;
    detectedDates: string[];
    detectedCount: number;
}

function parseProducerClipboard(
    rawText: string,
    defaultStartDate: string
): ParsedClipboard {
    const lines = rawText
        .split(/\r\n|\r|\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    const pricesByDate: Record<string, Record<string, string>> = {};

    if (lines.length === 0) {
        return { pricesByDate, detectedDates: [defaultStartDate], detectedCount: 0 };
    }

    const resolveKey = (text: string): string | null => {
        const t = text.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (t.includes('gkp') && (t.includes('petani') || t.includes('tani'))) return 'gkp_petani';
        if (t.includes('gkp') && (t.includes('giling') || t.includes('penggilingan'))) return 'gkp_penggilingan';
        if (t.includes('gkg')) return 'gkg_penggilingan';
        if (t.includes('medium')) return 'beras_medium_penggilingan';
        if (t.includes('premium')) return 'beras_premium_penggilingan';
        if (t.includes('sapi')) return 'sapi_hidup';
        return null;
    };

    const orderedKeys = [
        'gkp_petani',
        'gkp_penggilingan',
        'gkg_penggilingan',
        'beras_medium_penggilingan',
        'beras_premium_penggilingan',
        'sapi_hidup',
    ];

    const firstLine = lines[0];
    const headerCols = firstLine.split(/\t|;/).map((c) => c.trim().replace(/^"|"$/g, ''));
    const headerDates: Record<number, string> = {};
    let hasHeader = false;

    headerCols.forEach((col, idx) => {
        const extracted = extractDateFromText(col, defaultStartDate);
        if (extracted) {
            headerDates[idx] = extracted;
            hasHeader = true;
        } else if (/(nama|komoditas|harga|satuan|hap|gkp|gkg|beras|sapi)/i.test(col)) {
            hasHeader = true;
        }
    });

    const dataLines = hasHeader ? lines.slice(1) : lines;

    // Check if pure numbers (e.g. 6 rows of numbers copied from excel)
    const hasAlphabet = dataLines.some((l) => {
        const cells = l.split(/\t|;/);
        return cells.some((c) => /[a-zA-Z]/.test(c.replace(/^(rp|idr)\.?\s*/i, '').trim()));
    });

    if (!hasAlphabet) {
        dataLines.forEach((line, rIdx) => {
            if (rIdx >= orderedKeys.length) return;
            const key = orderedKeys[rIdx];
            const cols = line.split(/\t|;/).map((c) => c.trim().replace(/^"|"$/g, ''));

            cols.forEach((col, cIdx) => {
                if (cIdx >= 31) return;
                const dateKey = headerDates[cIdx] || addDaysToDateString(defaultStartDate, cIdx);
                const p = parsePrice(col);
                if (p !== null) {
                    if (!pricesByDate[dateKey]) pricesByDate[dateKey] = {};
                    pricesByDate[dateKey][key] = String(p);
                }
            });
        });
    } else {
        dataLines.forEach((line, idx) => {
            const cols = line.split(/\t|;/).map((c) => c.trim().replace(/^"|"$/g, ''));
            let matchedKey: string | null = null;

            for (const col of cols) {
                const found = resolveKey(col);
                if (found) {
                    matchedKey = found;
                    break;
                }
            }

            if (!matchedKey && cols[0] && !isNaN(Number(cols[0]))) {
                const orderNum = parseInt(cols[0], 10);
                if (orderNum >= 1 && orderNum <= orderedKeys.length) {
                    matchedKey = orderedKeys[orderNum - 1];
                }
            }

            if (!matchedKey && idx < orderedKeys.length) {
                matchedKey = orderedKeys[idx];
            }

            if (!matchedKey) return;

            if (Object.keys(headerDates).length > 0) {
                Object.entries(headerDates).forEach(([colIdxStr, dateStr]) => {
                    const colIdx = parseInt(colIdxStr, 10);
                    const p = parsePrice(cols[colIdx] || '');
                    if (p !== null) {
                        if (!pricesByDate[dateStr]) pricesByDate[dateStr] = {};
                        pricesByDate[dateStr][matchedKey!] = String(p);
                    }
                });
                return;
            }

            // Single price column detection
            let foundPrice: number | null = null;
            if (cols.length >= 5 && parsePrice(cols[4]) !== null) {
                foundPrice = parsePrice(cols[4]);
            } else if (cols.length >= 4 && parsePrice(cols[3]) !== null) {
                foundPrice = parsePrice(cols[3]);
            } else {
                for (let c = cols.length - 1; c >= 0; c--) {
                    const p = parsePrice(cols[c]);
                    if (p !== null) {
                        foundPrice = p;
                        break;
                    }
                }
            }

            if (foundPrice !== null) {
                if (!pricesByDate[defaultStartDate]) pricesByDate[defaultStartDate] = {};
                pricesByDate[defaultStartDate][matchedKey] = String(foundPrice);
            }
        });
    }

    const detectedDates = Object.keys(pricesByDate).sort();
    if (detectedDates.length === 0) detectedDates.push(defaultStartDate);

    let count = 0;
    detectedDates.forEach((d) => {
        count += Object.keys(pricesByDate[d] || {}).length;
    });

    return {
        pricesByDate,
        detectedDates,
        detectedCount: count,
    };
}

export default function ProducerPricesIndex({
    selectedDate,
    prevDate,
    minDate,
    maxDate,
    currentRecord,
    items,
    commoditiesConfig,
    historyRecords,
    statistics,
}: PageProps) {
    const [currentDate, setCurrentDate] = useState(selectedDate);
    const [historySearch, setHistorySearch] = useState('');

    // Modal states
    const [editFormModalOpen, setEditFormModalOpen] = useState(false);
    const [editSingleModalOpen, setEditSingleModalOpen] = useState(false);
    const [pasteModalOpen, setPasteModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [templateModalOpen, setTemplateModalOpen] = useState(false);

    // Single Edit State
    const [editingItem, setEditingItem] = useState<ProducerCommodityItem | null>(null);
    const [singlePrice, setSinglePrice] = useState('');
    const [singleNotes, setSingleNotes] = useState('');
    const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);

    // Full Form / Quick Input State
    const [fullFormData, setFullFormData] = useState<Record<string, string>>({
        gkp_petani: items.find((i) => i.key === 'gkp_petani')?.price ? String(items.find((i) => i.key === 'gkp_petani')?.price) : '',
        gkp_penggilingan: items.find((i) => i.key === 'gkp_penggilingan')?.price ? String(items.find((i) => i.key === 'gkp_penggilingan')?.price) : '',
        gkg_penggilingan: items.find((i) => i.key === 'gkg_penggilingan')?.price ? String(items.find((i) => i.key === 'gkg_penggilingan')?.price) : '',
        beras_medium_penggilingan: items.find((i) => i.key === 'beras_medium_penggilingan')?.price ? String(items.find((i) => i.key === 'beras_medium_penggilingan')?.price) : '',
        beras_premium_penggilingan: items.find((i) => i.key === 'beras_premium_penggilingan')?.price ? String(items.find((i) => i.key === 'beras_premium_penggilingan')?.price) : '',
        sapi_hidup: items.find((i) => i.key === 'sapi_hidup')?.price ? String(items.find((i) => i.key === 'sapi_hidup')?.price) : '',
        notes: currentRecord?.notes || '',
    });
    const [isSubmittingFullForm, setIsSubmittingFullForm] = useState(false);

    // Paste Modal State
    const [pasteRawText, setPasteRawText] = useState('');
    const [pasteStartDate, setPasteStartDate] = useState(selectedDate);
    const [pasteMultiDayPrices, setPasteMultiDayPrices] = useState<Record<string, Record<string, string>>>({});
    const [pasteDetectedDates, setPasteDetectedDates] = useState<string[]>([selectedDate]);
    const [pasteSelectedDay, setPasteSelectedDay] = useState(selectedDate);
    const [isSubmittingPaste, setIsSubmittingPaste] = useState(false);

    // Import Modal State
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importDate, setImportDate] = useState(selectedDate);
    const [isSubmittingImport, setIsSubmittingImport] = useState(false);

    // Change date handler
    const handleDateChange = (newDate: string) => {
        setCurrentDate(newDate);
        router.get(
            producerPricesIndex.url(),
            { date: newDate },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Open Single Edit
    const handleOpenSingleEdit = (item: ProducerCommodityItem) => {
        setEditingItem(item);
        setSinglePrice(item.price !== null ? String(item.price) : '');
        setSingleNotes(currentRecord?.notes || '');
        setEditSingleModalOpen(true);
    };

    // Save Single Edit
    const handleSaveSingleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;

        setIsSubmittingSingle(true);
        const payload: Record<string, any> = {
            recorded_date: currentDate,
            [editingItem.key]: singlePrice ? parseFloat(singlePrice) : null,
            notes: singleNotes || null,
        };

        // Preserve other current prices
        items.forEach((item) => {
            if (item.key !== editingItem.key && item.price !== null) {
                payload[item.key] = item.price;
            }
        });

        router.post(storeProducerAction.url(), payload, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Harga ${editingItem.name} berhasil diperbarui.`);
                setEditSingleModalOpen(false);
                setIsSubmittingSingle(false);
            },
            onError: (err) => {
                toast.error('Gagal menyimpan harga: ' + Object.values(err)[0]);
                setIsSubmittingSingle(false);
            },
        });
    };

    // Open Quick Full Form Modal
    const handleOpenFullForm = () => {
        setFullFormData({
            gkp_petani: items.find((i) => i.key === 'gkp_petani')?.price ? String(items.find((i) => i.key === 'gkp_petani')?.price) : '',
            gkp_penggilingan: items.find((i) => i.key === 'gkp_penggilingan')?.price ? String(items.find((i) => i.key === 'gkp_penggilingan')?.price) : '',
            gkg_penggilingan: items.find((i) => i.key === 'gkg_penggilingan')?.price ? String(items.find((i) => i.key === 'gkg_penggilingan')?.price) : '',
            beras_medium_penggilingan: items.find((i) => i.key === 'beras_medium_penggilingan')?.price ? String(items.find((i) => i.key === 'beras_medium_penggilingan')?.price) : '',
            beras_premium_penggilingan: items.find((i) => i.key === 'beras_premium_penggilingan')?.price ? String(items.find((i) => i.key === 'beras_premium_penggilingan')?.price) : '',
            sapi_hidup: items.find((i) => i.key === 'sapi_hidup')?.price ? String(items.find((i) => i.key === 'sapi_hidup')?.price) : '',
            notes: currentRecord?.notes || '',
        });
        setEditFormModalOpen(true);
    };

    // Save Full Form
    const handleSaveFullForm = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingFullForm(true);

        const payload = {
            recorded_date: currentDate,
            gkp_petani: fullFormData.gkp_petani ? parseFloat(fullFormData.gkp_petani) : null,
            gkp_penggilingan: fullFormData.gkp_penggilingan ? parseFloat(fullFormData.gkp_penggilingan) : null,
            gkg_penggilingan: fullFormData.gkg_penggilingan ? parseFloat(fullFormData.gkg_penggilingan) : null,
            beras_medium_penggilingan: fullFormData.beras_medium_penggilingan ? parseFloat(fullFormData.beras_medium_penggilingan) : null,
            beras_premium_penggilingan: fullFormData.beras_premium_penggilingan ? parseFloat(fullFormData.beras_premium_penggilingan) : null,
            sapi_hidup: fullFormData.sapi_hidup ? parseFloat(fullFormData.sapi_hidup) : null,
            notes: fullFormData.notes || null,
        };

        router.post(storeProducerAction.url(), payload, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Data harga produsen tanggal ${currentDate} berhasil disimpan.`);
                setEditFormModalOpen(false);
                setIsSubmittingFullForm(false);
            },
            onError: (err) => {
                toast.error('Gagal menyimpan harga: ' + Object.values(err)[0]);
                setIsSubmittingFullForm(false);
            },
        });
    };

    // Delete Record for Selected Date
    const handleDeleteCurrentRecord = () => {
        if (!currentRecord) return;
        if (!confirm(`Hapus seluruh data pencatatan harga produsen tanggal ${currentDate}?`)) {
            return;
        }

        router.delete(destroyProducerAction.url(currentRecord.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Data harga produsen tanggal ${currentDate} berhasil dihapus.`);
            },
        });
    };

    // Handle Paste Raw Text Changes
    const handlePasteRawChange = (text: string, anchorDate?: string) => {
        setPasteRawText(text);
        const anchor = anchorDate || pasteStartDate;
        const parsed = parseProducerClipboard(text, anchor);
        setPasteMultiDayPrices(parsed.pricesByDate);
        setPasteDetectedDates(parsed.detectedDates);
        setPasteSelectedDay(parsed.detectedDates[0] || anchor);
    };

    // Save Paste Directly to System
    const handleSavePasteDirectly = () => {
        const payloadItems: any[] = [];

        Object.entries(pasteMultiDayPrices).forEach(([dateStr, fieldValues]) => {
            const row: Record<string, any> = { recorded_date: dateStr };
            let hasPrice = false;

            Object.entries(fieldValues).forEach(([fKey, priceStr]) => {
                if (priceStr && !isNaN(Number(priceStr))) {
                    row[fKey] = parseFloat(priceStr);
                    hasPrice = true;
                }
            });

            if (hasPrice) {
                payloadItems.push(row);
            }
        });

        if (payloadItems.length === 0) {
            toast.error('Tidak ada data harga yang valid untuk disimpan.');
            return;
        }

        setIsSubmittingPaste(true);
        router.post(
            bulkStoreProducerAction.url(),
            { items: payloadItems },
            {
                preserveScroll: true,
                onSuccess: () => {
                    const daysCount = pasteDetectedDates.length;
                    toast.success(
                        daysCount > 1
                            ? `Berhasil menyimpan data harga produsen untuk ${daysCount} hari.`
                            : 'Berhasil menyimpan data harga produsen dari Excel.'
                    );
                    setPasteModalOpen(false);
                    setPasteRawText('');
                    setPasteMultiDayPrices({});
                    setIsSubmittingPaste(false);
                },
                onError: (err) => {
                    toast.error('Gagal menyimpan harga: ' + Object.values(err)[0]);
                    setIsSubmittingPaste(false);
                },
            }
        );
    };

    // Apply Paste to Full Form Modal
    const handleApplyPasteToForm = () => {
        const selectedDayValues = pasteMultiDayPrices[pasteSelectedDay] || {};
        setFullFormData((prev) => ({
            ...prev,
            ...selectedDayValues,
        }));
        setCurrentDate(pasteSelectedDay);
        setPasteModalOpen(false);
        setEditFormModalOpen(true);
        toast.success(`Data tanggal ${pasteSelectedDay} diterapkan ke form input.`);
    };

    // Handle File Import Form Submit
    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) {
            toast.error('Silakan pilih berkas Excel atau CSV terlebih dahulu.');
            return;
        }

        setIsSubmittingImport(true);
        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('recorded_date', importDate);

        router.post(importProducerAction.url(), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Data harga produsen berhasil diimpor.');
                setImportModalOpen(false);
                setImportFile(null);
                setIsSubmittingImport(false);
            },
            onError: (err) => {
                toast.error('Gagal mengimpor berkas: ' + Object.values(err)[0]);
                setIsSubmittingImport(false);
            },
        });
    };

    // Format currency helper
    const formatCurrency = (val: number | null) => {
        if (val === null || val === undefined) return '-';
        return 'Rp ' + Number(val).toLocaleString('id-ID');
    };

    // Filtered history records
    const filteredHistory = useMemo(() => {
        if (!historySearch) return historyRecords;
        const q = historySearch.toLowerCase();
        return historyRecords.filter((h) =>
            h.recorded_date.includes(q) ||
            h.formatted_date.toLowerCase().includes(q) ||
            h.day_name.toLowerCase().includes(q) ||
            (h.notes && h.notes.toLowerCase().includes(q))
        );
    }, [historyRecords, historySearch]);

    const totalPastedCount = useMemo(() => {
        return Object.values(pasteMultiDayPrices).reduce(
            (acc, curr) => acc + Object.keys(curr).length,
            0
        );
    }, [pasteMultiDayPrices]);

    return (
        <>
            <Head title="Modul Harga Produsen - DKPP Indramayu" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* ============================================================== */}
                {/* 1. HEADER SECTION                                              */}
                {/* ============================================================== */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-md shadow-amber-600/20">
                                <Wheat className="size-5" />
                            </div>
                            <div>
                                <h1 className="font-headline text-2xl sm:text-[30px] font-extrabold tracking-tight text-foreground">
                                    Modul Harga Produsen
                                </h1>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    Pencatatan 6 komoditas pangan strategis di tingkat produsen (petani, penggilingan &amp; peternak) Kabupaten Indramayu.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Download Template Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2 text-xs font-semibold">
                                    <Download className="size-4" />
                                    <span>Unduh Template</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="text-xs font-bold text-slate-500">
                                    Pilih Format Template
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <a
                                        href={templateProducerAction.url({ query: { format: 'xlsx', days: 1, date: currentDate } })}
                                        className="flex items-center gap-2 text-xs cursor-pointer"
                                    >
                                        <FileSpreadsheet className="size-4 text-emerald-600" />
                                        <span>Template Harian (.xlsx)</span>
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a
                                        href={templateProducerAction.url({ query: { format: 'xlsx', days: 7, period: 'weekly', date: currentDate } })}
                                        className="flex items-center gap-2 text-xs cursor-pointer"
                                    >
                                        <FileSpreadsheet className="size-4 text-emerald-600" />
                                        <span>Template Mingguan 7 Hari (.xlsx)</span>
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a
                                        href={templateProducerAction.url({ query: { format: 'xlsx', days: 30, period: 'monthly', date: currentDate } })}
                                        className="flex items-center gap-2 text-xs cursor-pointer"
                                    >
                                        <FileSpreadsheet className="size-4 text-emerald-600" />
                                        <span>Template Bulanan 30 Hari (.xlsx)</span>
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <a
                                        href={templateProducerAction.url({ query: { format: 'csv', days: 1, date: currentDate } })}
                                        className="flex items-center gap-2 text-xs cursor-pointer"
                                    >
                                        <FileText className="size-4 text-blue-600" />
                                        <span>Template Format CSV (.csv)</span>
                                    </a>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Copy Paste Button */}
                        <Button
                            variant="outline"
                            onClick={() => {
                                setPasteStartDate(currentDate);
                                setPasteModalOpen(true);
                            }}
                            className="gap-2 text-xs font-semibold"
                        >
                            <ClipboardPaste className="size-4 text-amber-600" />
                            <span>Salin dari Excel</span>
                        </Button>

                        {/* Import File Button */}
                        <Button
                            variant="outline"
                            onClick={() => {
                                setImportDate(currentDate);
                                setImportModalOpen(true);
                            }}
                            className="gap-2 text-xs font-semibold"
                        >
                            <Upload className="size-4 text-emerald-600" />
                            <span>Import Data</span>
                        </Button>

                        {/* Quick Full Input Form Button */}
                        <Button
                            onClick={handleOpenFullForm}
                            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 text-xs font-bold"
                        >
                            <Plus className="size-4" />
                            <span>Input / Edit Cepat</span>
                        </Button>
                    </div>
                </div>

                {/* ============================================================== */}
                {/* 2. DATE FILTER & STATUS BAR                                    */}
                {/* ============================================================== */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="size-4 text-amber-600" />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Tanggal Pencatatan:
                            </span>
                        </div>
                        <Input
                            type="date"
                            value={currentDate}
                            min={minDate}
                            max={maxDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="w-44 text-xs font-bold bg-slate-50 dark:bg-slate-800/80 h-9"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
                            className="text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 h-9"
                        >
                            Hari Ini
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        {currentRecord ? (
                            <>
                                <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full font-bold text-[11px]">
                                    <CheckCircle2 className="size-3.5" />
                                    Data Terdata ({currentRecord.creator_name || 'Petugas'})
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDeleteCurrentRecord}
                                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2 text-xs"
                                    title="Hapus data tanggal ini"
                                >
                                    <Trash2 className="size-3.5" />
                                    <span className="hidden sm:inline">Hapus Tanggal Ini</span>
                                </Button>
                            </>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full font-bold text-[11px]">
                                <AlertCircle className="size-3.5" />
                                Belum Terdata di Sistem
                            </span>
                        )}
                    </div>
                </div>

                {/* ============================================================== */}
                {/* 3. STATISTIC SUMMARY CARDS                                     */}
                {/* ============================================================== */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                        <CardHeader className="p-4 pb-2">
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Total Komoditas
                            </CardDescription>
                            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">
                                {statistics.total_commodities} Komoditas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <span className="text-[11px] text-slate-500">
                                Gabah, Beras Giling, &amp; Sapi Hidup
                            </span>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                        <CardHeader className="p-4 pb-2">
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Tercatat Hari Ini
                            </CardDescription>
                            <CardTitle className="text-2xl font-black text-emerald-700">
                                {statistics.recorded_count} / {statistics.total_commodities}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span>
                                    {statistics.recorded_count === statistics.total_commodities
                                        ? 'Lengkap tercatat'
                                        : `${statistics.total_commodities - statistics.recorded_count} belum terdata`}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                        <CardHeader className="p-4 pb-2">
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-amber-700">
                                Di Atas HAP Bapanas
                            </CardDescription>
                            <CardTitle className="text-2xl font-black text-amber-700">
                                {statistics.above_hap_count}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <span className="text-[11px] text-slate-500">
                                Nilai transaksi di atas batas acuan bawah
                            </span>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                        <CardHeader className="p-4 pb-2">
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Sesuai / Di Bawah HAP
                            </CardDescription>
                            <CardTitle className="text-2xl font-black text-slate-700 dark:text-slate-200">
                                {statistics.equal_hap_count + statistics.below_hap_count}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <span className="text-[11px] text-slate-500">
                                {statistics.equal_hap_count} sesuai, {statistics.below_hap_count} di bawah acuan
                            </span>
                        </CardContent>
                    </Card>
                </div>

                {/* ============================================================== */}
                {/* 4. MAIN PRODUCER COMMODITIES TABLE FOR SELECTED DATE           */}
                {/* ============================================================== */}
                <Card className="rounded-2xl border-slate-200/80 shadow-xs overflow-hidden">
                    <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                                <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Wheat className="size-5 text-amber-600" />
                                    <span>Tabel Harga 6 Komoditas Produsen</span>
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500 mt-1">
                                    Harga transaksi produsen pangan pada tanggal <strong className="text-slate-800 dark:text-slate-200">{currentDate}</strong> di wilayah Kabupaten Indramayu.
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleOpenFullForm}
                                className="text-xs font-bold gap-1.5 self-start sm:self-auto"
                            >
                                <Edit3 className="size-3.5" />
                                <span>Edit Semua Nilai</span>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
                                    <tr>
                                        <th className="px-4 py-3.5 text-center w-12">No</th>
                                        <th className="px-4 py-3.5">Nama Komoditas Produsen</th>
                                        <th className="px-4 py-3.5">Kategori / Satuan</th>
                                        <th className="px-4 py-3.5 text-right">HAP Acuan (Bapanas)</th>
                                        <th className="px-4 py-3.5 text-right">Harga Terdata</th>
                                        <th className="px-4 py-3.5 text-center">vs Kemarin</th>
                                        <th className="px-4 py-3.5 text-center">Status HAP</th>
                                        <th className="px-4 py-3.5 text-center w-28">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {items.map((item, idx) => {
                                        return (
                                            <tr
                                                key={item.key}
                                                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                                            >
                                                <td className="px-4 py-3.5 text-center font-bold text-slate-400">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="font-bold text-slate-900 dark:text-white">
                                                        {item.name}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        {item.description}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                                                        {item.category}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Per {item.unit}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <div className="font-bold text-slate-900 dark:text-slate-100">
                                                        {formatCurrency(item.hap)}
                                                    </div>
                                                    <div className="text-[10px] text-emerald-700 font-semibold">
                                                        {item.hap_label}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    {item.price !== null ? (
                                                        <div>
                                                            <div className="text-base font-black text-slate-900 dark:text-white">
                                                                {formatCurrency(item.price)}
                                                            </div>
                                                            {item.diff_hap !== null && (
                                                                <div
                                                                    className={`text-[11px] font-bold ${
                                                                        item.diff_hap > 0
                                                                            ? 'text-amber-700'
                                                                            : item.diff_hap < 0
                                                                            ? 'text-rose-600'
                                                                            : 'text-emerald-700'
                                                                    }`}
                                                                >
                                                                    {item.diff_hap > 0 ? '+' : ''}
                                                                    {formatCurrency(item.diff_hap)} ({item.diff_hap_percentage}%)
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs font-semibold text-slate-400 italic">
                                                            Belum dicatat
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    {item.change_type === 'up' && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                                                            <ArrowUpRight className="size-3.5" />
                                                            <span>+{formatCurrency(item.diff_yesterday)}</span>
                                                        </span>
                                                    )}
                                                    {item.change_type === 'down' && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                            <ArrowDownRight className="size-3.5" />
                                                            <span>{formatCurrency(item.diff_yesterday)}</span>
                                                        </span>
                                                    )}
                                                    {item.change_type === 'stable' && item.price !== null && (
                                                        <span className="text-[11px] font-semibold text-slate-400">
                                                            Tetap
                                                        </span>
                                                    )}
                                                    {item.price === null && (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    {item.status === 'above' && (
                                                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-300 text-[10px] font-extrabold">
                                                            Di Atas HAP
                                                        </Badge>
                                                    )}
                                                    {item.status === 'equal' && (
                                                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 text-[10px] font-extrabold">
                                                            Sesuai HAP
                                                        </Badge>
                                                    )}
                                                    {item.status === 'below' && (
                                                        <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border border-rose-300 text-[10px] font-extrabold">
                                                            Di Bawah HAP
                                                        </Badge>
                                                    )}
                                                    {item.status === 'not_recorded' && (
                                                        <Badge variant="outline" className="text-slate-400 text-[10px]">
                                                            Belum Dicatat
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenSingleEdit(item)}
                                                        className="h-8 gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                                                    >
                                                        <Edit3 className="size-3.5" />
                                                        <span>Edit</span>
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* ============================================================== */}
                {/* 5. HISTORY TABLE (RIWAYAT PENCATATAN HARGA PRODUSEN)           */}
                {/* ============================================================== */}
                <Card className="rounded-2xl border-slate-200/80 shadow-xs overflow-hidden">
                    <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <History className="size-5 text-amber-600" />
                                <div>
                                    <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white">
                                        Riwayat Pencatatan Harian Harga Produsen
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500">
                                        Daftar tanggal pencatatan sebelumnya beserta rincian 6 komoditas produsen.
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                                <Input
                                    placeholder="Cari tanggal..."
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    className="pl-8 text-xs h-8.5 bg-white dark:bg-slate-800"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
                                    <tr>
                                        <th className="px-3.5 py-3">Tanggal</th>
                                        <th className="px-3.5 py-3 text-right">GKP Petani</th>
                                        <th className="px-3.5 py-3 text-right">GKP Penggilingan</th>
                                        <th className="px-3.5 py-3 text-right">GKG Penggilingan</th>
                                        <th className="px-3.5 py-3 text-right">Beras Medium</th>
                                        <th className="px-3.5 py-3 text-right">Beras Premium</th>
                                        <th className="px-3.5 py-3 text-right">Sapi Hidup</th>
                                        <th className="px-3.5 py-3">Petugas / Update</th>
                                        <th className="px-3.5 py-3 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {filteredHistory.length > 0 ? (
                                        filteredHistory.map((rec) => (
                                            <tr
                                                key={rec.id}
                                                className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                                                    rec.recorded_date === currentDate ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                                                }`}
                                            >
                                                <td className="px-3.5 py-3">
                                                    <div className="font-bold text-slate-900 dark:text-white">
                                                        {rec.day_name}, {rec.formatted_date}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono">
                                                        {rec.recorded_date}
                                                    </div>
                                                </td>
                                                <td className="px-3.5 py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                                                    {formatCurrency(rec.gkp_petani)}
                                                </td>
                                                <td className="px-3.5 py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                                                    {formatCurrency(rec.gkp_penggilingan)}
                                                </td>
                                                <td className="px-3.5 py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                                                    {formatCurrency(rec.gkg_penggilingan)}
                                                </td>
                                                <td className="px-3.5 py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                                                    {formatCurrency(rec.beras_medium_penggilingan)}
                                                </td>
                                                <td className="px-3.5 py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                                                    {formatCurrency(rec.beras_premium_penggilingan)}
                                                </td>
                                                <td className="px-3.5 py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                                                    {formatCurrency(rec.sapi_hidup)}
                                                </td>
                                                <td className="px-3.5 py-3">
                                                    <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                                        {rec.creator_name}
                                                    </div>
                                                    {rec.notes && (
                                                        <div className="text-[10px] text-slate-500 italic truncate max-w-xs">
                                                            &quot;{rec.notes}&quot;
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3.5 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDateChange(rec.recorded_date)}
                                                            className="h-7 px-2 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                                                            title="Buka tanggal ini"
                                                        >
                                                            Lihat
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                if (confirm(`Hapus seluruh data harga tanggal ${rec.recorded_date}?`)) {
                                                                    router.delete(destroyProducerAction.url(rec.id), {
                                                                        preserveScroll: true,
                                                                        onSuccess: () => {
                                                                            toast.success(`Data tanggal ${rec.recorded_date} berhasil dihapus.`);
                                                                        },
                                                                    });
                                                                }
                                                            }}
                                                            className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                                            title="Hapus data tanggal ini"
                                                        >
                                                            <Trash2 className="size-3" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                                                Belum ada riwayat pencatatan harga produsen.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* ============================================================== */}
                {/* MODAL 1: SINGLE COMMODITY EDIT DIALOG                          */}
                {/* ============================================================== */}
                <Dialog open={editSingleModalOpen} onOpenChange={setEditSingleModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base">
                                <Wheat className="size-5 text-amber-600" />
                                <span>Edit Harga: {editingItem?.name}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Tanggal: <strong>{currentDate}</strong> | Acuan HAP: <strong>{formatCurrency(editingItem?.hap ?? 0)} / {editingItem?.unit}</strong>
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveSingleEdit} className="space-y-4 pt-2">
                            <div>
                                <Label htmlFor="single-price" className="text-xs font-bold">
                                    Harga Transaksi (Rp / {editingItem?.unit})
                                </Label>
                                <div className="relative mt-1.5">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                        Rp
                                    </span>
                                    <Input
                                        id="single-price"
                                        type="number"
                                        min="0"
                                        step="1"
                                        placeholder="Contoh: 6800"
                                        value={singlePrice}
                                        onChange={(e) => setSinglePrice(e.target.value)}
                                        className="pl-9 text-sm font-bold"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="single-notes" className="text-xs font-bold">
                                    Catatan Tambahan (Opsional)
                                </Label>
                                <Input
                                    id="single-notes"
                                    type="text"
                                    placeholder="Contoh: Panen sawah wilayah barat Indramayu..."
                                    value={singleNotes}
                                    onChange={(e) => setSingleNotes(e.target.value)}
                                    className="mt-1.5 text-xs"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditSingleModalOpen(false)}
                                    className="text-xs"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmittingSingle}
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                                >
                                    {isSubmittingSingle ? 'Menyimpan...' : 'Simpan Harga'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ============================================================== */}
                {/* MODAL 2: FULL / QUICK FORM (INPUT 6 FIELD SEKALIGUS)          */}
                {/* ============================================================== */}
                <Dialog open={editFormModalOpen} onOpenChange={setEditFormModalOpen}>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-lg font-black text-slate-900">
                                <Wheat className="size-5 text-amber-600" />
                                <span>Input &amp; Pembaruan Harga Produsen</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Isi harga transaksi untuk 6 komoditas produsen pangan Kabupaten Indramayu pada tanggal pencatatan.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveFullForm} className="space-y-4 pt-2">
                            <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 flex items-center justify-between">
                                <div className="text-xs font-bold text-amber-900">
                                    Tanggal Pencatatan:
                                </div>
                                <Input
                                    type="date"
                                    value={currentDate}
                                    min={minDate}
                                    max={maxDate}
                                    onChange={(e) => setCurrentDate(e.target.value)}
                                    className="w-44 text-xs font-bold bg-white h-8"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {/* 1. GKP Petani */}
                                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                                    <div className="flex justify-between items-center mb-1">
                                        <Label className="text-xs font-extrabold text-slate-900">
                                            1. GKP Tingkat Petani
                                        </Label>
                                        <span className="text-[10px] text-emerald-700 font-bold">
                                            HAP: Rp 6.000 /Kg
                                        </span>
                                    </div>
                                    <div className="relative mt-1">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            Rp
                                        </span>
                                        <Input
                                            type="number"
                                            placeholder="Contoh: 6800"
                                            value={fullFormData.gkp_petani}
                                            onChange={(e) => setFullFormData({ ...fullFormData, gkp_petani: e.target.value })}
                                            className="pl-8 text-xs font-bold h-8.5"
                                        />
                                    </div>
                                </div>

                                {/* 2. GKP Penggilingan */}
                                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                                    <div className="flex justify-between items-center mb-1">
                                        <Label className="text-xs font-extrabold text-slate-900">
                                            2. GKP Tingkat Penggilingan
                                        </Label>
                                        <span className="text-[10px] text-emerald-700 font-bold">
                                            HAP: Rp 6.200 /Kg
                                        </span>
                                    </div>
                                    <div className="relative mt-1">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            Rp
                                        </span>
                                        <Input
                                            type="number"
                                            placeholder="Contoh: 7000"
                                            value={fullFormData.gkp_penggilingan}
                                            onChange={(e) => setFullFormData({ ...fullFormData, gkp_penggilingan: e.target.value })}
                                            className="pl-8 text-xs font-bold h-8.5"
                                        />
                                    </div>
                                </div>

                                {/* 3. GKG Penggilingan */}
                                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                                    <div className="flex justify-between items-center mb-1">
                                        <Label className="text-xs font-extrabold text-slate-900">
                                            3. GKG Tingkat Penggilingan
                                        </Label>
                                        <span className="text-[10px] text-emerald-700 font-bold">
                                            HAP: Rp 7.400 /Kg
                                        </span>
                                    </div>
                                    <div className="relative mt-1">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            Rp
                                        </span>
                                        <Input
                                            type="number"
                                            placeholder="Contoh: 7900"
                                            value={fullFormData.gkg_penggilingan}
                                            onChange={(e) => setFullFormData({ ...fullFormData, gkg_penggilingan: e.target.value })}
                                            className="pl-8 text-xs font-bold h-8.5"
                                        />
                                    </div>
                                </div>

                                {/* 4. Beras Medium Penggilingan */}
                                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                                    <div className="flex justify-between items-center mb-1">
                                        <Label className="text-xs font-extrabold text-slate-900">
                                            4. Beras Medium Penggilingan
                                        </Label>
                                        <span className="text-[10px] text-emerald-700 font-bold">
                                            HAP: Rp 12.000 /Kg
                                        </span>
                                    </div>
                                    <div className="relative mt-1">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            Rp
                                        </span>
                                        <Input
                                            type="number"
                                            placeholder="Contoh: 12200"
                                            value={fullFormData.beras_medium_penggilingan}
                                            onChange={(e) => setFullFormData({ ...fullFormData, beras_medium_penggilingan: e.target.value })}
                                            className="pl-8 text-xs font-bold h-8.5"
                                        />
                                    </div>
                                </div>

                                {/* 5. Beras Premium Penggilingan */}
                                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                                    <div className="flex justify-between items-center mb-1">
                                        <Label className="text-xs font-extrabold text-slate-900">
                                            5. Beras Premium Penggilingan
                                        </Label>
                                        <span className="text-[10px] text-emerald-700 font-bold">
                                            HAP: Rp 13.900 /Kg
                                        </span>
                                    </div>
                                    <div className="relative mt-1">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            Rp
                                        </span>
                                        <Input
                                            type="number"
                                            placeholder="Contoh: 14200"
                                            value={fullFormData.beras_premium_penggilingan}
                                            onChange={(e) => setFullFormData({ ...fullFormData, beras_premium_penggilingan: e.target.value })}
                                            className="pl-8 text-xs font-bold h-8.5"
                                        />
                                    </div>
                                </div>

                                {/* 6. Sapi Hidup */}
                                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                                    <div className="flex justify-between items-center mb-1">
                                        <Label className="text-xs font-extrabold text-slate-900">
                                            6. Sapi Hidup
                                        </Label>
                                        <span className="text-[10px] text-emerald-700 font-bold">
                                            HAP: Rp 56.000 /Kg
                                        </span>
                                    </div>
                                    <div className="relative mt-1">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            Rp
                                        </span>
                                        <Input
                                            type="number"
                                            placeholder="Contoh: 58000"
                                            value={fullFormData.sapi_hidup}
                                            onChange={(e) => setFullFormData({ ...fullFormData, sapi_hidup: e.target.value })}
                                            className="pl-8 text-xs font-bold h-8.5"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="full-notes" className="text-xs font-bold">
                                    Catatan / Keterangan Kondisi Lapangan (Opsional)
                                </Label>
                                <Input
                                    id="full-notes"
                                    type="text"
                                    placeholder="Contoh: Transaksi sentra penggilingan berjalan stabil..."
                                    value={fullFormData.notes}
                                    onChange={(e) => setFullFormData({ ...fullFormData, notes: e.target.value })}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditFormModalOpen(false)}
                                    className="text-xs"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmittingFullForm}
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                                >
                                    {isSubmittingFullForm ? 'Menyimpan...' : 'Simpan Semua Data'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ============================================================== */}
                {/* MODAL 3: COPY PASTE DARI EXCEL MODAL                           */}
                {/* ============================================================== */}
                <Dialog open={pasteModalOpen} onOpenChange={setPasteModalOpen}>
                    <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-lg font-black text-slate-900">
                                <ClipboardPaste className="size-5 text-amber-600" />
                                <span>Salin &amp; Tempel dari Excel (Copy-Paste)</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Salin tabel atau baris harga dari Microsoft Excel / Google Sheets lalu tempelkan (Ctrl+V) ke kotak teks di bawah. Sistem mendukung format 1 hari maupun multi-hari sekaligus!
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 pt-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-amber-50/80 p-3 border border-amber-200/80 text-xs text-amber-900">
                                <div>
                                    <span className="font-bold">Tanggal Awal Acuan:</span> Jika format spreadsheet tidak memiliki header tanggal.
                                </div>
                                <Input
                                    type="date"
                                    value={pasteStartDate}
                                    onChange={(e) => {
                                        setPasteStartDate(e.target.value);
                                        if (pasteRawText) handlePasteRawChange(pasteRawText, e.target.value);
                                    }}
                                    className="w-40 text-xs font-bold bg-white h-8 shrink-0"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-slate-700">
                                    Kotak Tempel Spreadsheet (Ctrl + V):
                                </Label>
                                <textarea
                                    rows={5}
                                    placeholder="Contoh salinan Excel:&#10;GKP Tingkat Petani&#9;6800&#10;GKP Tingkat Penggilingan&#9;7000&#10;GKG Tingkat Penggilingan&#9;7900&#10;Beras Medium Penggilingan&#9;12200&#10;Beras Premium Penggilingan&#9;14200&#10;Sapi Hidup&#9;58000"
                                    value={pasteRawText}
                                    onChange={(e) => handlePasteRawChange(e.target.value)}
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 font-mono text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                />
                            </div>

                            {/* Detected Multi-day Tabs */}
                            {pasteDetectedDates.length > 1 && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700">
                                        Tanggal Terdeteksi ({pasteDetectedDates.length} Hari):
                                    </Label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {pasteDetectedDates.map((d) => (
                                            <Button
                                                key={d}
                                                type="button"
                                                size="sm"
                                                variant={pasteSelectedDay === d ? 'default' : 'outline'}
                                                onClick={() => setPasteSelectedDay(d)}
                                                className={`h-7 text-xs ${
                                                    pasteSelectedDay === d
                                                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                                        : ''
                                                }`}
                                            >
                                                {d}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Live Preview Table */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-bold text-slate-700">
                                        Pratinjau Nilai Terdeteksi ({pasteSelectedDay}):
                                    </span>
                                    <span className="text-[11px] font-semibold text-emerald-700">
                                        {Object.keys(pasteMultiDayPrices[pasteSelectedDay] || {}).length} dari 6 Terdeteksi
                                    </span>
                                </div>

                                <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                                            <tr>
                                                <th className="px-3 py-2">Komoditas Produsen</th>
                                                <th className="px-3 py-2 text-right">HAP Acuan</th>
                                                <th className="px-3 py-2 text-right">Nilai Terdeteksi</th>
                                                <th className="px-3 py-2 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {commoditiesConfig.map((comm) => {
                                                const pVal = pasteMultiDayPrices[pasteSelectedDay]?.[comm.key];
                                                const numP = pVal ? parseFloat(pVal) : null;
                                                return (
                                                    <tr key={comm.key} className="hover:bg-slate-50/50">
                                                        <td className="px-3 py-2 font-bold text-slate-800">
                                                            {comm.name}
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-slate-500">
                                                            {formatCurrency(comm.hap)}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-extrabold text-slate-900">
                                                            {numP ? formatCurrency(numP) : '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            {numP ? (
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                                    <CheckCheck className="size-3" />
                                                                    Cocok
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-400 italic">
                                                                    Kosong
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPasteModalOpen(false)}
                                    className="text-xs"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleApplyPasteToForm}
                                    disabled={totalPastedCount === 0}
                                    className="text-xs gap-1.5"
                                >
                                    <Edit3 className="size-3.5" />
                                    <span>Terapkan ke Form Input</span>
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSavePasteDirectly}
                                    disabled={totalPastedCount === 0 || isSubmittingPaste}
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                                >
                                    {isSubmittingPaste
                                        ? 'Menyimpan...'
                                        : `Simpan Langsung ke Sistem (${totalPastedCount} Nilai / ${pasteDetectedDates.length} Hari)`}
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* ============================================================== */}
                {/* MODAL 4: IMPORT FILE EXCEL / CSV DIALOG                        */}
                {/* ============================================================== */}
                <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                                <Upload className="size-5 text-emerald-600" />
                                <span>Import Berkas Excel / CSV</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Unggah berkas spreadsheet (.xlsx, .csv) harga produsen sesuai format resmi template DKPP.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleImportSubmit} className="space-y-4 pt-2">
                            <div>
                                <Label htmlFor="import-date" className="text-xs font-bold text-slate-700">
                                    Tanggal Acuan:
                                </Label>
                                <Input
                                    id="import-date"
                                    type="date"
                                    value={importDate}
                                    onChange={(e) => setImportDate(e.target.value)}
                                    className="mt-1 text-xs font-bold bg-slate-50 h-8.5"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="import-file" className="text-xs font-bold text-slate-700">
                                    Pilih Berkas Spreadsheet (.xlsx, .csv):
                                </Label>
                                <Input
                                    id="import-file"
                                    type="file"
                                    accept=".xlsx,.csv,.xls"
                                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                    className="mt-1 text-xs"
                                    required
                                />
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                                <div className="font-bold text-slate-800 mb-1">
                                    Belum punya format berkas?
                                </div>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <a
                                        href={templateProducerAction.url({ query: { format: 'xlsx', days: 1, date: importDate } })}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline"
                                    >
                                        <Download className="size-3" />
                                        Template Harian (.xlsx)
                                    </a>
                                    <span>•</span>
                                    <a
                                        href={templateProducerAction.url({ query: { format: 'xlsx', days: 30, period: 'monthly', date: importDate } })}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline"
                                    >
                                        <Download className="size-3" />
                                        Template Bulanan (.xlsx)
                                    </a>
                                </div>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setImportModalOpen(false)}
                                    className="text-xs"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!importFile || isSubmittingImport}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                >
                                    {isSubmittingImport ? 'Mengimpor...' : 'Mulai Import Berkas'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

ProducerPricesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Harga Produsen',
            href: producerPricesIndex(),
        },
    ] satisfies BreadcrumbItem[],
};

