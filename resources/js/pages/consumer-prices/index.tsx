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
    HelpCircle,
    Layers,
    Plus,
    RefreshCw,
    Scale,
    Search,
    ShieldAlert,
    ShoppingBag,
    Store,
    Trash2,
    TrendingDown,
    TrendingUp,
    Upload,
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
import {
    bulkStore as bulkStorePriceAction,
    destroy as destroyPriceAction,
    importMethod as importPriceAction,
    index as consumerPricesIndex,
    store as storePriceAction,
    template as templatePriceAction,
} from '@/routes/consumer-prices';
import { index as hetsIndex } from '@/routes/hets';
import type { BreadcrumbItem } from '@/types';

interface Market {
    id: number;
    name: string;
    location: string | null;
    is_active: boolean;
    order: number;
}

interface ApplicableHet {
    id: number;
    price: number;
    effective_date: string;
    source_regulation: string | null;
    notes: string | null;
}

interface ConsumerPriceItem {
    commodity_id: number;
    commodity_name: string;
    commodity_slug: string;
    category: string;
    unit: string;
    order: number;
    consumer_price_id: number | null;
    price: number | null;
    notes: string | null;
    applicable_het: ApplicableHet | null;
    diff: number | null;
    diff_percentage: number | null;
    status: 'above' | 'equal' | 'below' | 'no_het' | 'not_recorded';
}

interface PageProps {
    items: ConsumerPriceItem[];
    allItemsForBulk: ConsumerPriceItem[];
    markets: Market[];
    selectedMarket: Market | null;
    selectedDate: string;
    categories: string[];
    filters: {
        search: string;
        category: string;
        status: string;
        date: string;
        market_id: number;
    };
    statistics: {
        total_commodities: number;
        recorded_count: number;
        above_het_count: number;
        below_het_count: number;
        equal_het_count: number;
    };
}

function parseExcelClipboard(
    rawText: string,
    commodities: ConsumerPriceItem[]
): {
    prices: Record<number, string>;
    notes: Record<number, string>;
    detectedCount: number;
} {
    const lines = rawText
        .split(/\r\n|\r|\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    const prices: Record<number, string> = {};
    const notes: Record<number, string> = {};

    if (lines.length === 0) {
        return { prices, notes, detectedCount: 0 };
    }

    const firstLineLower = lines[0].toLowerCase();
    const hasHeader =
        firstLineLower.includes('nama') ||
        firstLineLower.includes('komoditas') ||
        firstLineLower.includes('harga') ||
        firstLineLower.includes('satuan') ||
        firstLineLower.includes('price') ||
        firstLineLower.includes('no');

    const dataLines = hasHeader ? lines.slice(1) : lines;

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const commodityByName = new Map<string, ConsumerPriceItem>();
    const commodityByOrder = new Map<number, ConsumerPriceItem>();

    commodities.forEach((c) => {
        commodityByName.set(normalize(c.commodity_name), c);
        commodityByOrder.set(c.order, c);
    });

    const parsePrice = (val: string): number | null => {
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
    };

    const isSingleColumn = dataLines.every(
        (l) => !l.includes('\t') && !l.includes(';') && !l.includes(',')
    );

    if (isSingleColumn) {
        dataLines.forEach((line, idx) => {
            const targetCommodity = commodities[idx];
            if (!targetCommodity) return;
            const p = parsePrice(line);
            if (p !== null) {
                prices[targetCommodity.commodity_id] = String(p);
            }
        });
    } else {
        dataLines.forEach((line, idx) => {
            const cols = line.split(/\t|;/).map((c) => c.trim().replace(/^"|"$/g, ''));
            let matchedCommodity: ConsumerPriceItem | undefined;
            let foundPrice: number | null = null;
            let rowNote: string | undefined;

            for (const col of cols) {
                const norm = normalize(col);
                if (commodityByName.has(norm)) {
                    matchedCommodity = commodityByName.get(norm);
                    break;
                }
            }

            if (!matchedCommodity && cols[0] && !isNaN(Number(cols[0]))) {
                const orderNum = parseInt(cols[0], 10);
                if (commodityByOrder.has(orderNum)) {
                    matchedCommodity = commodityByOrder.get(orderNum);
                }
            }

            if (!matchedCommodity) {
                matchedCommodity = commodities[idx];
            }

            if (!matchedCommodity) return;

            if (cols.length >= 5 && parsePrice(cols[4]) !== null) {
                foundPrice = parsePrice(cols[4]);
                rowNote = cols[5] || undefined;
            } else if (cols.length >= 4 && parsePrice(cols[3]) !== null) {
                foundPrice = parsePrice(cols[3]);
                rowNote = cols[4] || undefined;
            } else if (cols.length >= 3 && parsePrice(cols[2]) !== null) {
                foundPrice = parsePrice(cols[2]);
                rowNote = cols[3] || undefined;
            } else if (cols.length >= 2 && parsePrice(cols[1]) !== null) {
                foundPrice = parsePrice(cols[1]);
                rowNote = cols[2] || undefined;
            } else {
                for (let c = cols.length - 1; c >= 0; c--) {
                    const candidate = parsePrice(cols[c]);
                    if (candidate !== null) {
                        foundPrice = candidate;
                        break;
                    }
                }
            }

            if (foundPrice !== null) {
                prices[matchedCommodity.commodity_id] = String(foundPrice);
                if (rowNote) {
                    notes[matchedCommodity.commodity_id] = rowNote;
                }
            }
        });
    }

    const detectedCount = Object.keys(prices).length;
    return { prices, notes, detectedCount };
}

export default function ConsumerPricesIndex({
    items,
    allItemsForBulk,
    markets,
    selectedMarket,
    selectedDate,
    categories,
    filters,
    statistics,
}: PageProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [currentDate, setCurrentDate] = useState(selectedDate);
    const [currentMarketId, setCurrentMarketId] = useState<string>(
        selectedMarket ? String(selectedMarket.id) : markets[0] ? String(markets[0].id) : ''
    );

    // Single Edit Modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ConsumerPriceItem | null>(null);
    const [singlePrice, setSinglePrice] = useState<string>('');
    const [singleNotes, setSingleNotes] = useState<string>('');
    const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);

    // Bulk Modal state
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [bulkPrices, setBulkPrices] = useState<Record<number, string>>({});
    const [bulkNotes, setBulkNotes] = useState<Record<number, string>>({});
    const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

    // Import Excel Modal state
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importMarketId, setImportMarketId] = useState<string>(
        selectedMarket ? String(selectedMarket.id) : markets[0] ? String(markets[0].id) : ''
    );
    const [importDate, setImportDate] = useState<string>(selectedDate);
    const [isSubmittingImport, setIsSubmittingImport] = useState(false);

    // Copy-Paste from Excel Modal state
    const [pasteModalOpen, setPasteModalOpen] = useState(false);
    const [pasteRawText, setPasteRawText] = useState<string>('');
    const [pastePrices, setPastePrices] = useState<Record<number, string>>({});
    const [pasteNotes, setPasteNotes] = useState<Record<number, string>>({});
    const [isSubmittingPaste, setIsSubmittingPaste] = useState(false);

    // Handle date / market filter navigation
    const applyDateAndMarket = (newDate: string, newMarketId: string) => {
        router.get(
            consumerPricesIndex.url(),
            {
                date: newDate,
                market_id: newMarketId,
                search: searchTerm,
                category: selectedCategory === 'all' ? '' : selectedCategory,
                status: selectedStatus,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Client-side quick filter
    const displayedItems = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch =
                searchTerm === '' ||
                item.commodity_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory =
                selectedCategory === 'all' || item.category === selectedCategory;
            const matchesStatus =
                selectedStatus === 'all' ||
                (selectedStatus === 'above' && item.status === 'above') ||
                (selectedStatus === 'below' && item.status === 'below') ||
                (selectedStatus === 'equal' && item.status === 'equal') ||
                (selectedStatus === 'not_recorded' && item.status === 'not_recorded');

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [items, searchTerm, selectedCategory, selectedStatus]);

    // Open single edit modal
    const handleOpenEdit = (item: ConsumerPriceItem) => {
        setEditingItem(item);
        setSinglePrice(item.price !== null ? String(item.price) : '');
        setSingleNotes(item.notes || '');
        setEditModalOpen(true);
    };

    // Save single edit
    const handleSaveSingle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || !currentMarketId) return;

        setIsSubmittingSingle(true);
        router.post(
            storePriceAction.url(),
            {
                commodity_id: editingItem.commodity_id,
                market_id: Number(currentMarketId),
                recorded_date: currentDate,
                price: parseFloat(singlePrice) || 0,
                notes: singleNotes,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Harga ${editingItem.commodity_name} berhasil diperbarui.`);
                    setEditModalOpen(false);
                    setIsSubmittingSingle(false);
                },
                onError: (err) => {
                    toast.error('Gagal menyimpan harga: ' + Object.values(err)[0]);
                    setIsSubmittingSingle(false);
                },
            }
        );
    };

    // Open bulk modal and initialize prices
    const handleOpenBulk = () => {
        const initialPrices: Record<number, string> = {};
        const initialNotes: Record<number, string> = {};
        allItemsForBulk.forEach((item) => {
            initialPrices[item.commodity_id] = item.price !== null ? String(item.price) : '';
            initialNotes[item.commodity_id] = item.notes || '';
        });
        setBulkPrices(initialPrices);
        setBulkNotes(initialNotes);
        setBulkModalOpen(true);
    };

    // Save bulk prices
    const handleSaveBulk = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentMarketId) return;

        setIsSubmittingBulk(true);
        const payloadItems = allItemsForBulk.map((item) => ({
            commodity_id: item.commodity_id,
            price: bulkPrices[item.commodity_id] ? parseFloat(bulkPrices[item.commodity_id]) : null,
            notes: bulkNotes[item.commodity_id] || null,
        }));

        router.post(
            bulkStorePriceAction.url(),
            {
                market_id: Number(currentMarketId),
                recorded_date: currentDate,
                items: payloadItems,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Pembaruan harga 25 komoditas berhasil disimpan.');
                    setBulkModalOpen(false);
                    setIsSubmittingBulk(false);
                },
                onError: (err) => {
                    toast.error('Gagal menyimpan harga bulk: ' + Object.values(err)[0]);
                    setIsSubmittingBulk(false);
                },
            }
        );
    };

    // Delete single price
    const handleDeletePrice = (item: ConsumerPriceItem) => {
        if (!item.consumer_price_id) return;
        if (!confirm(`Hapus pencatatan harga untuk ${item.commodity_name} pada tanggal ${currentDate}?`)) {
            return;
        }

        router.delete(destroyPriceAction.url(item.consumer_price_id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Data harga ${item.commodity_name} berhasil dihapus.`);
            },
        });
    };

    // Handle changes in raw pasted text
    const handlePasteRawChange = (text: string) => {
        setPasteRawText(text);
        const parsed = parseExcelClipboard(text, allItemsForBulk);
        setPastePrices(parsed.prices);
        setPasteNotes(parsed.notes);
    };

    // Apply pasted prices into bulk modal
    const handleApplyPasteToBulk = () => {
        setBulkPrices((prev) => ({
            ...prev,
            ...pastePrices,
        }));
        setBulkNotes((prev) => ({
            ...prev,
            ...pasteNotes,
        }));
        setPasteModalOpen(false);
        setBulkModalOpen(true);
        const count = Object.keys(pastePrices).length;
        toast.info(`${count} harga berhasil dipindahkan ke form input cepat.`);
    };

    // Save pasted prices directly
    const handleSavePasteDirectly = () => {
        if (!currentMarketId) return;
        const validPriceCount = Object.keys(pastePrices).length;
        if (validPriceCount === 0) {
            toast.error('Tidak ada data harga yang valid untuk disimpan.');
            return;
        }

        setIsSubmittingPaste(true);
        const payloadItems = allItemsForBulk.map((item) => ({
            commodity_id: item.commodity_id,
            price: pastePrices[item.commodity_id] ? parseFloat(pastePrices[item.commodity_id]) : null,
            notes: pasteNotes[item.commodity_id] || null,
        }));

        router.post(
            bulkStorePriceAction.url(),
            {
                market_id: Number(currentMarketId),
                recorded_date: currentDate,
                items: payloadItems,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Berhasil menyimpan ${validPriceCount} harga komoditas dari Excel.`);
                    setPasteModalOpen(false);
                    setPasteRawText('');
                    setPastePrices({});
                    setIsSubmittingPaste(false);
                },
                onError: (err) => {
                    toast.error('Gagal menyimpan harga: ' + Object.values(err)[0]);
                    setIsSubmittingPaste(false);
                },
            }
        );
    };

    // Handle excel import form submit
    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) {
            toast.error('Silakan pilih berkas Excel atau CSV terlebih dahulu.');
            return;
        }

        setIsSubmittingImport(true);
        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('market_id', importMarketId);
        formData.append('recorded_date', importDate);

        router.post(importPriceAction.url(), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Data harga konsumen berhasil diimpor.');
                setImportModalOpen(false);
                setImportFile(null);
                setIsSubmittingImport(false);
                if (importDate !== currentDate || importMarketId !== currentMarketId) {
                    applyDateAndMarket(importDate, importMarketId);
                }
            },
            onError: (err) => {
                const msg = Object.values(err)[0] || 'Gagal mengimpor berkas Excel.';
                toast.error(msg);
                setIsSubmittingImport(false);
            },
        });
    };

    // Cell paste event listener for quick inline pasting
    const handleCellPaste = (
        e: React.ClipboardEvent<HTMLInputElement>,
        startIdx: number
    ) => {
        const text = e.clipboardData.getData('text');
        if (!text || (!text.includes('\n') && !text.includes('\r'))) {
            return; // single value paste, let default behavior work
        }

        e.preventDefault();
        const parsed = parseExcelClipboard(text, allItemsForBulk.slice(startIdx));
        if (parsed.detectedCount > 0) {
            setBulkPrices((prev) => ({
                ...prev,
                ...parsed.prices,
            }));
            if (Object.keys(parsed.notes).length > 0) {
                setBulkNotes((prev) => ({
                    ...prev,
                    ...parsed.notes,
                }));
            }
            toast.success(`${parsed.detectedCount} harga berhasil ditempelkan ke baris.`);
        }
    };

    const formatCurrency = (amount: number | null) => {
        if (amount === null || amount === undefined) return '-';
        return 'Rp ' + Number(amount).toLocaleString('id-ID');
    };

    return (
        <>
            <Head title="Modul Harga Konsumen - DKPP Indramayu" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                                <ShoppingBag className="size-5" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                Modul Harga Konsumen
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Pencatatan harian 25 komoditas pangan strategis per pasar dengan perbandingan otomatis terhadap HET dinamis yang berlaku.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            variant="outline"
                            asChild
                            className="gap-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                        >
                            <Link href={hetsIndex.url()}>
                                <Scale className="size-4" />
                                Kelola HET Komoditas
                            </Link>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                setImportDate(currentDate);
                                setImportMarketId(currentMarketId);
                                setImportModalOpen(true);
                            }}
                            className="gap-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
                        >
                            <Upload className="size-4 text-emerald-600" />
                            Import Excel
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                setPasteRawText('');
                                setPastePrices({});
                                setPasteNotes({});
                                setPasteModalOpen(true);
                            }}
                            className="gap-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
                        >
                            <ClipboardPaste className="size-4 text-blue-600" />
                            Copy-Paste Excel
                        </Button>

                        <Button
                            onClick={handleOpenBulk}
                            className="gap-2 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                        >
                            <FileSpreadsheet className="size-4" />
                            Input Cepat (25 Komoditas)
                        </Button>
                    </div>
                </div>

                {/* HET Dynamic Information Alert */}
                <div className="flex items-start gap-3 rounded-xl border border-blue-200/80 bg-blue-50/70 p-4 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
                    <ShieldAlert className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
                    <div className="text-sm">
                        <span className="font-semibold">Mekanisme HET Dinamis:</span> Perbandingan harga pangan di halaman ini secara otomatis disesuaikan dengan regulasi HET yang aktif pada tanggal pantauan (
                        <span className="font-mono font-bold text-blue-700 dark:text-blue-300">{currentDate}</span>
                        ). Apabila terjadi pembaruan HET di kemudian hari, data historis tetap merujuk pada HET di periodenya masing-masing.
                    </div>
                </div>

                {/* Date & Market Selection Bar */}
                <Card className="border-sidebar-border/70 shadow-xs dark:border-sidebar-border">
                    <CardContent className="p-4 sm:p-5">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
                            <div>
                                <Label htmlFor="market-select" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                    Lokasi Pasar
                                </Label>
                                <Select
                                    value={currentMarketId}
                                    onValueChange={(val) => {
                                        setCurrentMarketId(val);
                                        applyDateAndMarket(currentDate, val);
                                    }}
                                >
                                    <SelectTrigger id="market-select" className="mt-1.5 w-full">
                                        <SelectValue placeholder="Pilih Pasar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {markets.map((m) => (
                                            <SelectItem key={m.id} value={String(m.id)}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="date-input" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                    Tanggal Pantauan
                                </Label>
                                <div className="relative mt-1.5">
                                    <Input
                                        id="date-input"
                                        type="date"
                                        value={currentDate}
                                        onChange={(e) => {
                                            setCurrentDate(e.target.value);
                                            applyDateAndMarket(e.target.value, currentMarketId);
                                        }}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="secondary"
                                    className="mt-auto w-full gap-2"
                                    onClick={() => {
                                        const today = new Date().toISOString().split('T')[0];
                                        setCurrentDate(today);
                                        applyDateAndMarket(today, currentMarketId);
                                    }}
                                >
                                    <Calendar className="size-4" />
                                    Hari Ini
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="mt-auto w-full gap-2"
                                    onClick={() => applyDateAndMarket(currentDate, currentMarketId)}
                                >
                                    <RefreshCw className="size-4" />
                                    Muat Ulang
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* KPI Statistics Overview */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-neutral-500">Total Komoditas</CardTitle>
                            <Layers className="size-4 text-neutral-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_commodities}</div>
                            <p className="mt-1 text-xs text-neutral-500">
                                Terdata: <span className="font-semibold text-emerald-600">{statistics.recorded_count}</span> dari 25 komoditas
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50/40 dark:border-red-950/60 dark:bg-red-950/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-red-600 dark:text-red-400">Melebihi HET</CardTitle>
                            <ArrowUpRight className="size-4 text-red-600 dark:text-red-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                                {statistics.above_het_count}
                            </div>
                            <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">
                                Perlu intervensi / operasi pasar
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-200 bg-emerald-50/40 dark:border-emerald-950/60 dark:bg-emerald-950/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Di Bawah HET</CardTitle>
                            <ArrowDownRight className="size-4 text-emerald-600 dark:text-emerald-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                                {statistics.below_het_count}
                            </div>
                            <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/80">
                                Harga stabil & terjangkau
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50/40 dark:border-blue-950/60 dark:bg-blue-950/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-blue-600 dark:text-blue-400">Sesuai HET</CardTitle>
                            <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                {statistics.equal_het_count}
                            </div>
                            <p className="mt-1 text-xs text-blue-600/80 dark:text-blue-400/80">
                                Sesuai batas acuan regulasi
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Search Toolbar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-neutral-400" />
                            <Input
                                placeholder="Cari komoditas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Semua Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kategori</SelectItem>
                                {categories.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val)}>
                            <SelectTrigger className="w-[170px]">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="above">🔴 Melebihi HET</SelectItem>
                                <SelectItem value="below">🟢 Di Bawah HET</SelectItem>
                                <SelectItem value="equal">🔵 Sesuai HET</SelectItem>
                                <SelectItem value="not_recorded">⚪ Belum Diinput</SelectItem>
                            </SelectContent>
                        </Select>

                        {(searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('all');
                                    setSelectedStatus('all');
                                }}
                                className="text-neutral-500"
                            >
                                Reset Filter
                            </Button>
                        )}
                    </div>

                    <div className="text-xs text-neutral-500">
                        Menampilkan <span className="font-semibold text-neutral-800 dark:text-neutral-200">{displayedItems.length}</span> dari {items.length} komoditas
                    </div>
                </div>

                {/* Consumer Price Table */}
                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card shadow-xs dark:border-sidebar-border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-sidebar-border/70 bg-neutral-50/80 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:border-sidebar-border dark:bg-neutral-900/60">
                                <tr>
                                    <th className="px-4 py-3 text-center">No</th>
                                    <th className="px-4 py-3">Komoditas & Kategori</th>
                                    <th className="px-4 py-3">Satuan</th>
                                    <th className="px-4 py-3 text-right">Harga Konsumen</th>
                                    <th className="px-4 py-3 text-right">HET Berlaku</th>
                                    <th className="px-4 py-3 text-right">Selisih vs HET</th>
                                    <th className="px-4 py-3 text-center">Status HET</th>
                                    <th className="px-4 py-3">Dasar Hukum / Catatan</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/50 dark:divide-sidebar-border/60">
                                {displayedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-neutral-400">
                                            Tidak ada komoditas yang cocok dengan filter yang dipilih.
                                        </td>
                                    </tr>
                                ) : (
                                    displayedItems.map((item, idx) => {
                                        const isRecorded = item.price !== null;
                                        const isAbove = item.status === 'above';
                                        const isBelow = item.status === 'below';
                                        const isEqual = item.status === 'equal';

                                        return (
                                            <tr
                                                key={item.commodity_id}
                                                className={`transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 ${
                                                    isAbove
                                                        ? 'bg-red-50/20 dark:bg-red-950/5'
                                                        : isBelow
                                                          ? 'bg-emerald-50/15 dark:bg-emerald-950/5'
                                                          : ''
                                                }`}
                                            >
                                                <td className="px-4 py-3.5 text-center font-mono text-xs text-neutral-400">
                                                    {item.order || idx + 1}
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                        {item.commodity_name}
                                                    </div>
                                                    <div className="text-xs text-neutral-500">
                                                        {item.category}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    <Badge variant="outline" className="text-xs font-normal">
                                                        {item.unit}
                                                    </Badge>
                                                </td>

                                                <td className="px-4 py-3.5 text-right">
                                                    {isRecorded ? (
                                                        <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                            {formatCurrency(item.price)}
                                                        </span>
                                                    ) : (
                                                        <span className="italic text-neutral-400">Belum diinput</span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5 text-right">
                                                    {item.applicable_het ? (
                                                        <div>
                                                            <span className="font-mono font-medium text-neutral-700 dark:text-neutral-300">
                                                                {formatCurrency(item.applicable_het.price)}
                                                            </span>
                                                            <div className="text-[11px] text-neutral-400">
                                                                Efektif: {item.applicable_het.effective_date}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-neutral-400">-</span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5 text-right font-mono text-xs">
                                                    {isRecorded && item.diff !== null ? (
                                                        <div
                                                            className={
                                                                isAbove
                                                                    ? 'font-bold text-red-600 dark:text-red-400'
                                                                    : isBelow
                                                                      ? 'font-bold text-emerald-600 dark:text-emerald-400'
                                                                      : 'text-neutral-500'
                                                            }
                                                        >
                                                            {item.diff > 0 ? `+${formatCurrency(item.diff)}` : formatCurrency(item.diff)}
                                                            {item.diff_percentage !== null && (
                                                                <span className="ml-1 text-[11px]">
                                                                    ({item.diff_percentage > 0 ? `+${item.diff_percentage}%` : `${item.diff_percentage}%`})
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-neutral-400">-</span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5 text-center">
                                                    {isRecorded ? (
                                                        isAbove ? (
                                                            <Badge variant="destructive" className="gap-1 font-semibold">
                                                                <ArrowUpRight className="size-3" /> Di Atas HET
                                                            </Badge>
                                                        ) : isBelow ? (
                                                            <Badge className="gap-1 bg-emerald-600 font-semibold text-white hover:bg-emerald-700">
                                                                <ArrowDownRight className="size-3" /> Di Bawah HET
                                                            </Badge>
                                                        ) : isEqual ? (
                                                            <Badge variant="secondary" className="gap-1 font-semibold">
                                                                <CheckCircle2 className="size-3 text-blue-500" /> Sesuai HET
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline">Tanpa HET</Badge>
                                                        )
                                                    ) : (
                                                        <Badge variant="outline" className="border-dashed text-neutral-400">
                                                            Belum Ada Data
                                                        </Badge>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    <div className="text-xs text-neutral-600 dark:text-neutral-300">
                                                        {item.applicable_het?.source_regulation || item.notes || '-'}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3.5 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleOpenEdit(item)}
                                                            className="h-8 gap-1 px-2.5 text-xs"
                                                        >
                                                            <Edit3 className="size-3.5 text-neutral-600 dark:text-neutral-300" />
                                                            {isRecorded ? 'Edit' : 'Input'}
                                                        </Button>

                                                        {isRecorded && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeletePrice(item)}
                                                                className="size-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                                                                title="Hapus data harga"
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
                        </table>
                    </div>
                </div>

                {/* Single Edit Modal */}
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ShoppingBag className="size-5 text-emerald-600" />
                                {editingItem?.price !== null ? 'Perbarui Harga Konsumen' : 'Input Harga Konsumen'}
                            </DialogTitle>
                            <DialogDescription>
                                Komoditas: <span className="font-semibold text-neutral-900 dark:text-neutral-100">{editingItem?.commodity_name}</span> ({editingItem?.unit})
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveSingle} className="space-y-4">
                            <div className="rounded-lg bg-neutral-50 p-3 text-xs dark:bg-neutral-900">
                                <div className="flex justify-between py-0.5">
                                    <span className="text-neutral-500">Pasar:</span>
                                    <span className="font-medium">{selectedMarket?.name}</span>
                                </div>
                                <div className="flex justify-between py-0.5">
                                    <span className="text-neutral-500">Tanggal:</span>
                                    <span className="font-mono font-medium">{currentDate}</span>
                                </div>
                                <div className="flex justify-between py-0.5">
                                    <span className="text-neutral-500">HET Berlaku:</span>
                                    <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                                        {formatCurrency(editingItem?.applicable_het?.price ?? null)} / {editingItem?.unit}
                                    </span>
                                </div>
                                {editingItem?.applicable_het?.source_regulation && (
                                    <div className="flex justify-between py-0.5">
                                        <span className="text-neutral-500">Regulasi HET:</span>
                                        <span className="text-neutral-700 dark:text-neutral-300">
                                            {editingItem.applicable_het.source_regulation}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="single-price">Harga Konsumen (Rp / {editingItem?.unit})</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-xs font-semibold text-neutral-400">Rp</span>
                                    <Input
                                        id="single-price"
                                        type="number"
                                        min="0"
                                        step="100"
                                        required
                                        placeholder="Contoh: 14500"
                                        value={singlePrice}
                                        onChange={(e) => setSinglePrice(e.target.value)}
                                        className="pl-9 font-mono font-medium"
                                    />
                                </div>
                                {singlePrice && editingItem?.applicable_het && (
                                    <div className="text-xs">
                                        {parseFloat(singlePrice) > editingItem.applicable_het.price ? (
                                            <span className="font-semibold text-red-600 dark:text-red-400">
                                                Melebihi HET sebesar +Rp {(parseFloat(singlePrice) - editingItem.applicable_het.price).toLocaleString('id-ID')}
                                            </span>
                                        ) : parseFloat(singlePrice) < editingItem.applicable_het.price ? (
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                Di bawah HET sebesar -Rp {(editingItem.applicable_het.price - parseFloat(singlePrice)).toLocaleString('id-ID')}
                                            </span>
                                        ) : (
                                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                Tepat sesuai HET
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="single-notes">Catatan Tambahan (Opsional)</Label>
                                <Input
                                    id="single-notes"
                                    placeholder="Contoh: Stok melimpah, kualitas super"
                                    value={singleNotes}
                                    onChange={(e) => setSingleNotes(e.target.value)}
                                />
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSubmittingSingle} className="bg-emerald-600 hover:bg-emerald-700">
                                    {isSubmittingSingle ? 'Menyimpan...' : 'Simpan Harga'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Bulk Entry Modal (25 Komoditas Matrix) */}
                <Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
                    <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden flex flex-col">
                        <DialogHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <DialogTitle className="flex items-center gap-2">
                                        <FileSpreadsheet className="size-5 text-emerald-600" />
                                        Form Input Cepat 25 Komoditas Pangan
                                    </DialogTitle>
                                    <DialogDescription className="mt-1">
                                        Masukkan harga konsumen harian secara terpadu untuk pasar{' '}
                                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedMarket?.name}</span>{' '}
                                        pada tanggal <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">{currentDate}</span>.
                                    </DialogDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setBulkModalOpen(false);
                                        setPasteRawText('');
                                        setPastePrices({});
                                        setPasteNotes({});
                                        setPasteModalOpen(true);
                                    }}
                                    className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/40 text-xs shrink-0 self-start sm:self-center"
                                >
                                    <ClipboardPaste className="size-3.5" />
                                    Tempel dari Excel (Ctrl+V)
                                </Button>
                            </div>
                            <div className="rounded-md bg-neutral-100/80 px-2.5 py-1 text-[11px] text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
                                💡 <strong>Tip Cepat:</strong> Anda juga bisa langsung menekan <kbd className="rounded border bg-white px-1 py-0.5 font-mono text-[10px] text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">Ctrl+V</kbd> pada kolom input harga baris pertama untuk mengisi seluruh 25 komoditas ke bawah secara otomatis.
                            </div>
                        </DialogHeader>

                        <form onSubmit={handleSaveBulk} className="flex flex-1 flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto pr-1">
                                <table className="w-full text-left text-xs">
                                    <thead className="sticky top-0 border-b border-sidebar-border bg-card font-semibold text-neutral-600 dark:text-neutral-300">
                                        <tr>
                                            <th className="py-2.5 pl-2 pr-2">No</th>
                                            <th className="py-2.5 px-2">Komoditas</th>
                                            <th className="py-2.5 px-2">Satuan</th>
                                            <th className="py-2.5 px-2 text-right">HET Aktif</th>
                                            <th className="py-2.5 px-2 w-44">Harga Konsumen (Rp)</th>
                                            <th className="py-2.5 px-2">Status / Selisih</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/40">
                                        {allItemsForBulk.map((item, idx) => {
                                            const enteredVal = bulkPrices[item.commodity_id];
                                            const numVal = enteredVal ? parseFloat(enteredVal) : null;
                                            const hetVal = item.applicable_het?.price ?? null;

                                            let diffBadge = null;
                                            if (numVal !== null && hetVal !== null) {
                                                const diff = numVal - hetVal;
                                                if (diff > 0) {
                                                    diffBadge = (
                                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                                            +Rp {diff.toLocaleString('id-ID')} (Di Atas HET)
                                                        </span>
                                                    );
                                                } else if (diff < 0) {
                                                    diffBadge = (
                                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                            -Rp {Math.abs(diff).toLocaleString('id-ID')} (Di Bawah HET)
                                                        </span>
                                                    );
                                                } else {
                                                    diffBadge = (
                                                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                            Sesuai HET
                                                        </span>
                                                    );
                                                }
                                            }

                                            return (
                                                <tr key={item.commodity_id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                                                    <td className="py-2 pl-2 pr-2 text-neutral-400 font-mono">
                                                        {item.order || idx + 1}
                                                    </td>
                                                    <td className="py-2 px-2">
                                                        <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                            {item.commodity_name}
                                                        </div>
                                                        <div className="text-[11px] text-neutral-400">{item.category}</div>
                                                    </td>
                                                    <td className="py-2 px-2">
                                                        <Badge variant="outline" className="text-[10px] font-normal">
                                                            {item.unit}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2 px-2 text-right font-mono font-medium text-neutral-700 dark:text-neutral-300">
                                                        {hetVal !== null ? formatCurrency(hetVal) : '-'}
                                                    </td>
                                                    <td className="py-2 px-2">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="100"
                                                            placeholder="0"
                                                            value={bulkPrices[item.commodity_id] ?? ''}
                                                            onChange={(e) =>
                                                                setBulkPrices((prev) => ({
                                                                    ...prev,
                                                                    [item.commodity_id]: e.target.value,
                                                                }))
                                                            }
                                                            onPaste={(e) => handleCellPaste(e, idx)}
                                                            className="h-8 font-mono text-xs"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-[11px]">
                                                        {diffBadge || <span className="text-neutral-400">-</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <DialogFooter className="mt-4 border-t pt-3">
                                <Button type="button" variant="outline" onClick={() => setBulkModalOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSubmittingBulk} className="bg-emerald-600 hover:bg-emerald-700">
                                    {isSubmittingBulk ? 'Menyimpan Semua Data...' : 'Simpan Semua Data (25 Komoditas)'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Import Excel Modal */}
                <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Upload className="size-5 text-emerald-600" />
                                Import Data Harga dari File Excel
                            </DialogTitle>
                            <DialogDescription>
                                Unggah berkas spreadsheet (.xlsx atau .csv) untuk mengimpor harga 25 komoditas pangan secara massal.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Download Format Section */}
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                            <div className="flex items-start gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                                    <FileSpreadsheet className="size-5" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">
                                        Unduh Format Template Resmi
                                    </h4>
                                    <p className="mt-0.5 text-xs text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                                        Gunakan format template resmi yang telah disusun sesuai urutan baku 25 komoditas (Beras Premium s/d Daging Kerbau Beku) beserta data HET acuan aktif.
                                    </p>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <a
                                            href={templatePriceAction.url({ query: { format: 'xlsx', date: importDate } })}
                                            download="format_harga_konsumen_25_komoditas.xlsx"
                                            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                                        >
                                            <Download className="size-3.5" />
                                            Download Format Excel (.xlsx)
                                        </a>
                                        <a
                                            href={templatePriceAction.url({ query: { format: 'csv', date: importDate } })}
                                            download="format_harga_konsumen_25_komoditas.csv"
                                            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                                        >
                                            <Download className="size-3.5" />
                                            Download Format CSV (.csv)
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Import Form */}
                        <form onSubmit={handleImportSubmit} className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="import-market" className="text-xs font-medium">
                                        Lokasi Pasar Target
                                    </Label>
                                    <Select value={importMarketId} onValueChange={setImportMarketId}>
                                        <SelectTrigger id="import-market" className="w-full">
                                            <SelectValue placeholder="Pilih Pasar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {markets.map((m) => (
                                                <SelectItem key={m.id} value={String(m.id)}>
                                                    {m.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="import-date" className="text-xs font-medium">
                                        Tanggal Pantauan
                                    </Label>
                                    <Input
                                        id="import-date"
                                        type="date"
                                        value={importDate}
                                        onChange={(e) => setImportDate(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="import-file" className="text-xs font-medium">
                                    Berkas Excel / CSV
                                </Label>
                                <div className="relative rounded-lg border-2 border-dashed border-neutral-300 p-4 text-center hover:border-emerald-500 dark:border-neutral-700 dark:hover:border-emerald-500">
                                    <input
                                        id="import-file"
                                        type="file"
                                        accept=".xlsx,.csv,.txt,.xls"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0] || null;
                                            setImportFile(f);
                                        }}
                                        className="absolute inset-0 cursor-pointer opacity-0"
                                    />
                                    {importFile ? (
                                        <div className="flex items-center justify-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                                            <CheckCircle2 className="size-5" />
                                            <span className="font-medium truncate max-w-xs">{importFile.name}</span>
                                            <span className="text-xs text-neutral-400">
                                                ({(importFile.size / 1024).toFixed(1)} KB)
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-1 text-neutral-500">
                                            <Upload className="size-6 text-neutral-400" />
                                            <span className="text-xs font-medium">
                                                Klik untuk memilih atau seret berkas ke sini
                                            </span>
                                            <span className="text-[11px] text-neutral-400">
                                                Mendukung format berkas .xlsx atau .csv (Maksimal 10MB)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setImportModalOpen(false);
                                        setImportFile(null);
                                    }}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!importFile || isSubmittingImport}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {isSubmittingImport ? 'Mengimpor Data...' : 'Mulai Impor Data'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Copy-Paste dari Excel Modal */}
                <Dialog open={pasteModalOpen} onOpenChange={setPasteModalOpen}>
                    <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ClipboardPaste className="size-5 text-blue-600" />
                                Salin & Tempel (Copy-Paste) Data dari Excel
                            </DialogTitle>
                            <DialogDescription>
                                Salin sel harga dari Microsoft Excel (Ctrl+C), lalu tempel (Ctrl+V) ke dalam kotak teks di bawah. Sistem otomatis mendeteksi dan memetakan harga 25 komoditas pangan secara berurutan.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
                            {/* Guidance notice */}
                            <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
                                <div className="font-semibold mb-1">Panduan Format Salin dari Excel:</div>
                                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-blue-800 dark:text-blue-300">
                                    <li>
                                        <strong>Opsi 1 (Paling Cepat):</strong> Cukup blok & salin 1 kolom angka harga (25 baris) dari lembar Excel Anda. Sistem otomatis memetakan baris 1 s/d 25 ke urutan resmi komoditas (Beras Premium s/d Daging Kerbau Beku).
                                    </li>
                                    <li>
                                        <strong>Opsi 2:</strong> Salin tabel dengan kolom Nama Komoditas dan Harga secara bersamaan. Sistem otomatis mencocokkan nama komoditas.
                                    </li>
                                </ul>
                            </div>

                            {/* Raw Paste Textarea */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <Label htmlFor="paste-textarea" className="text-xs font-semibold">
                                        Area Tempel Data (Ctrl + V)
                                    </Label>
                                    {Object.keys(pastePrices).length > 0 && (
                                        <Badge variant="outline" className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40">
                                            <CheckCheck className="size-3.5 mr-1" />
                                            {Object.keys(pastePrices).length} dari 25 Komoditas Terdeteksi
                                        </Badge>
                                    )}
                                </div>
                                <textarea
                                    id="paste-textarea"
                                    rows={3}
                                    value={pasteRawText}
                                    onChange={(e) => handlePasteRawChange(e.target.value)}
                                    placeholder={'Tempelkan data harga dari Excel di sini...\nContoh (25 baris harga):\n14500\n13000\n12500\n...'}
                                    className="w-full rounded-md border border-neutral-300 bg-white p-2.5 font-mono text-xs focus:border-blue-500 focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-900"
                                />
                            </div>

                            {/* Live Preview Table */}
                            <div className="flex-1 overflow-hidden flex flex-col rounded-md border border-sidebar-border">
                                <div className="bg-neutral-50 px-3 py-2 text-xs font-semibold border-b dark:bg-neutral-900/50 flex items-center justify-between">
                                    <span>Pratinjau Hasil Pembacaan 25 Komoditas:</span>
                                    <span className="text-[11px] text-neutral-500 font-normal">
                                        Pasar: <strong className="text-neutral-900 dark:text-neutral-100">{selectedMarket?.name}</strong> | Tanggal: <strong className="font-mono text-neutral-900 dark:text-neutral-100">{currentDate}</strong>
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="sticky top-0 border-b border-sidebar-border bg-card font-semibold text-neutral-600 dark:text-neutral-300">
                                            <tr>
                                                <th className="py-2 pl-3 pr-2 w-10">No</th>
                                                <th className="py-2 px-2">Nama Komoditas</th>
                                                <th className="py-2 px-2">Satuan</th>
                                                <th className="py-2 px-2 text-right">HET Aktif</th>
                                                <th className="py-2 px-2 w-40">Harga Terdeteksi (Rp)</th>
                                                <th className="py-2 px-2">Status / Selisih</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-sidebar-border/40">
                                            {allItemsForBulk.map((item, idx) => {
                                                const enteredVal = pastePrices[item.commodity_id];
                                                const numVal = enteredVal ? parseFloat(enteredVal) : null;
                                                const hetVal = item.applicable_het?.price ?? null;

                                                let diffBadge = null;
                                                if (numVal !== null && hetVal !== null) {
                                                    const diff = numVal - hetVal;
                                                    if (diff > 0) {
                                                        diffBadge = (
                                                            <span className="font-semibold text-red-600 dark:text-red-400">
                                                                +Rp {diff.toLocaleString('id-ID')} (Di Atas HET)
                                                            </span>
                                                        );
                                                    } else if (diff < 0) {
                                                        diffBadge = (
                                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                                -Rp {Math.abs(diff).toLocaleString('id-ID')} (Di Bawah HET)
                                                            </span>
                                                        );
                                                    } else {
                                                        diffBadge = (
                                                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                                Sesuai HET
                                                            </span>
                                                        );
                                                    }
                                                }

                                                return (
                                                    <tr key={item.commodity_id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                                                        <td className="py-2 pl-3 pr-2 text-neutral-400 font-mono">
                                                            {item.order || idx + 1}
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                                {item.commodity_name}
                                                            </div>
                                                            <div className="text-[11px] text-neutral-400">{item.category}</div>
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <Badge variant="outline" className="text-[10px] font-normal">
                                                                {item.unit}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-2 px-2 text-right font-mono font-medium text-neutral-700 dark:text-neutral-300">
                                                            {hetVal !== null ? formatCurrency(hetVal) : '-'}
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="100"
                                                                placeholder="Belum ada data"
                                                                value={pastePrices[item.commodity_id] ?? ''}
                                                                onChange={(e) =>
                                                                    setPastePrices((prev) => ({
                                                                        ...prev,
                                                                        [item.commodity_id]: e.target.value,
                                                                    }))
                                                                }
                                                                className={`h-8 font-mono text-xs ${
                                                                    pastePrices[item.commodity_id]
                                                                        ? 'border-emerald-400 bg-emerald-50/30 font-semibold dark:bg-emerald-950/20'
                                                                        : ''
                                                                }`}
                                                            />
                                                        </td>
                                                        <td className="py-2 px-2 text-[11px]">
                                                            {diffBadge || (
                                                                <span className="italic text-neutral-400">
                                                                    {item.price ? `Tercatat: Rp ${item.price.toLocaleString('id-ID')}` : 'Kosong'}
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

                            <DialogFooter className="mt-2 border-t pt-3 flex flex-col sm:flex-row gap-2 sm:justify-between items-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPasteModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleApplyPasteToBulk}
                                        disabled={Object.keys(pastePrices).length === 0}
                                        className="gap-1.5 text-xs"
                                    >
                                        <Edit3 className="size-3.5" />
                                        Terapkan ke Form Input Cepat
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleSavePasteDirectly}
                                        disabled={Object.keys(pastePrices).length === 0 || isSubmittingPaste}
                                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                    >
                                        {isSubmittingPaste ? 'Menyimpan...' : 'Simpan Langsung ke Sistem'}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

ConsumerPricesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Harga Konsumen',
            href: consumerPricesIndex(),
        },
    ] satisfies BreadcrumbItem[],
};
