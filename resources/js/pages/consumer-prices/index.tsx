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

function addDaysToDateString(dateStr: string, days: number): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatShortDate(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const [, m, d] = parts;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthName = months[parseInt(m, 10) - 1] || m;
    return `${parseInt(d, 10)} ${monthName}`;
}

function getDayName(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return days[date.getDay()];
}

function extractDateFromText(text: string, baseDate?: string): string | null {
    const clean = text.trim();
    // YYYY-MM-DD
    const isoMatch = clean.match(/\b(20\d{2})[-_\/](\d{1,2})[-_\/](\d{1,2})\b/);
    if (isoMatch) {
        const y = parseInt(isoMatch[1], 10);
        const m = parseInt(isoMatch[2], 10);
        const d = parseInt(isoMatch[3], 10);
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = clean.match(/\b(\d{1,2})[-_\/](\d{1,2})[-_\/](20\d{2})\b/);
    if (dmyMatch) {
        const d = parseInt(dmyMatch[1], 10);
        const m = parseInt(dmyMatch[2], 10);
        const y = parseInt(dmyMatch[3], 10);
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    // "Tgl 1", "Tgl 01", "Hari 1", or standalone day number "1".."31"
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

interface MultiDayParsedResult {
    pricesByDate: Record<string, Record<number, string>>;
    detectedDates: string[];
    prices: Record<number, string>;
    notes: Record<number, string>;
    totalPricesCount: number;
    detectedCount: number;
}

function parseExcelClipboard(
    rawText: string,
    commodities: ConsumerPriceItem[],
    defaultStartDate: string
): MultiDayParsedResult {
    const lines = rawText
        .split(/\r\n|\r|\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    const pricesByDate: Record<string, Record<number, string>> = {};
    const notes: Record<number, string> = {};

    if (lines.length === 0) {
        return {
            pricesByDate,
            detectedDates: [defaultStartDate],
            prices: {},
            notes,
            totalPricesCount: 0,
            detectedCount: 0,
        };
    }

    const firstLine = lines[0];
    const firstLineLower = firstLine.toLowerCase();
    const hasHeader =
        firstLineLower.includes('nama') ||
        firstLineLower.includes('komoditas') ||
        firstLineLower.includes('harga') ||
        firstLineLower.includes('satuan') ||
        firstLineLower.includes('price') ||
        firstLineLower.includes('no') ||
        firstLineLower.includes('tgl') ||
        firstLineLower.includes('tanggal');

    const headerDates: Record<number, string> = {};
    if (hasHeader) {
        const headerCols = firstLine.split(/\t|;/).map((c) => c.trim().replace(/^"|"$/g, ''));
        headerCols.forEach((col, idx) => {
            const extracted = extractDateFromText(col, defaultStartDate);
            if (extracted) {
                headerDates[idx] = extracted;
            }
        });
    }

    const dataLines = hasHeader ? lines.slice(1) : lines;
    if (dataLines.length === 0) {
        return {
            pricesByDate,
            detectedDates: [defaultStartDate],
            prices: {},
            notes,
            totalPricesCount: 0,
            detectedCount: 0,
        };
    }

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

    // Check if data rows are a pure number grid
    const hasAlphabet = dataLines.some((l) => {
        const cells = l.split(/\t|;/);
        return cells.some((c) => {
            const stripped = c.replace(/^(rp|idr)\.?\s*/i, '').trim();
            return /[a-zA-Z]/.test(stripped);
        });
    });

    const isPureNumberMatrix = !hasAlphabet;

    if (isPureNumberMatrix) {
        let maxCols = 1;
        dataLines.forEach((l) => {
            const cCount = l.split(/\t|;/).length;
            if (cCount > maxCols) maxCols = cCount;
        });
        const colsToRead = Math.max(1, Math.min(31, maxCols));

        const colDates: string[] = [];
        for (let c = 0; c < colsToRead; c++) {
            colDates[c] = headerDates[c] || addDaysToDateString(defaultStartDate, c);
        }

        dataLines.forEach((line, rIdx) => {
            const targetCommodity = commodities[rIdx];
            if (!targetCommodity) return;

            const cols = line.split(/\t|;/).map((c) => c.trim().replace(/^"|"$/g, ''));
            for (let c = 0; c < colsToRead; c++) {
                const dateKey = colDates[c];
                const p = parsePrice(cols[c] || '');
                if (p !== null) {
                    if (!pricesByDate[dateKey]) {
                        pricesByDate[dateKey] = {};
                    }
                    pricesByDate[dateKey][targetCommodity.commodity_id] = String(p);
                }
            }
        });
    } else {
        dataLines.forEach((line, idx) => {
            const cols = line.split(/\t|;/).map((c) => c.trim().replace(/^"|"$/g, ''));
            let matchedCommodity: ConsumerPriceItem | undefined;

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

            if (Object.keys(headerDates).length > 0) {
                Object.entries(headerDates).forEach(([colIdxStr, dateStr]) => {
                    const colIdx = parseInt(colIdxStr, 10);
                    const p = parsePrice(cols[colIdx] || '');
                    if (p !== null) {
                        if (!pricesByDate[dateStr]) {
                            pricesByDate[dateStr] = {};
                        }
                        pricesByDate[dateStr][matchedCommodity!.commodity_id] = String(p);
                    }
                });
                return;
            }

            // Check if multiple price columns exist starting at index 4
            const candidatePriceCols: number[] = [];
            for (let c = 4; c < cols.length; c++) {
                if (parsePrice(cols[c]) !== null) {
                    candidatePriceCols.push(c);
                }
            }

            if (candidatePriceCols.length > 1) {
                candidatePriceCols.forEach((colIdx, pIdx) => {
                    if (pIdx >= 31) return;
                    const dateStr = addDaysToDateString(defaultStartDate, pIdx);
                    const p = parsePrice(cols[colIdx]);
                    if (p !== null) {
                        if (!pricesByDate[dateStr]) {
                            pricesByDate[dateStr] = {};
                        }
                        pricesByDate[dateStr][matchedCommodity!.commodity_id] = String(p);
                    }
                });
                return;
            }

            // Single price column fallback
            let foundPrice: number | null = null;
            let rowNote: string | undefined;

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
                if (!pricesByDate[defaultStartDate]) {
                    pricesByDate[defaultStartDate] = {};
                }
                pricesByDate[defaultStartDate][matchedCommodity.commodity_id] = String(foundPrice);
                if (rowNote) {
                    notes[matchedCommodity.commodity_id] = rowNote;
                }
            }
        });
    }

    const detectedDates = Object.keys(pricesByDate).sort();
    if (detectedDates.length === 0) {
        detectedDates.push(defaultStartDate);
    }

    let totalPricesCount = 0;
    detectedDates.forEach((d) => {
        totalPricesCount += Object.keys(pricesByDate[d] || {}).length;
    });

    const prices = pricesByDate[detectedDates[0]] || {};

    return {
        pricesByDate,
        detectedDates,
        prices,
        notes,
        totalPricesCount,
        detectedCount: totalPricesCount,
    };
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
    const [importPeriod, setImportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
    const [isSubmittingImport, setIsSubmittingImport] = useState(false);

    // Copy-Paste from Excel Modal state (supports 1 day, 1 week, up to 1 month / 31 days)
    const [pasteModalOpen, setPasteModalOpen] = useState(false);
    const [pasteMarketId, setPasteMarketId] = useState<string>(
        selectedMarket ? String(selectedMarket.id) : markets[0] ? String(markets[0].id) : ''
    );
    const [pasteStartDate, setPasteStartDate] = useState<string>(selectedDate);
    const [pastePeriod, setPastePeriod] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('weekly');
    const [pasteRawText, setPasteRawText] = useState<string>('');
    const [pasteMultiDayPrices, setPasteMultiDayPrices] = useState<Record<string, Record<number, string>>>({});
    const [pasteDetectedDates, setPasteDetectedDates] = useState<string[]>([selectedDate]);
    const [pastePrices, setPastePrices] = useState<Record<number, string>>({});
    const [pasteNotes, setPasteNotes] = useState<Record<number, string>>({});
    const [pasteViewMode, setPasteViewMode] = useState<'matrix' | 'daily'>('matrix');
    const [pasteSelectedDay, setPasteSelectedDay] = useState<string>(selectedDate);
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

    // Open copy-paste modal and initialize dates
    const handleOpenPasteModal = () => {
        setPasteRawText('');
        setPasteMultiDayPrices({});
        const days = pastePeriod === 'daily' ? 1 : pastePeriod === 'weekly' ? 7 : 31;
        const initDates: string[] = [];
        for (let i = 0; i < days; i++) {
            initDates.push(addDaysToDateString(currentDate, i));
        }
        setPasteDetectedDates(initDates);
        setPastePrices({});
        setPasteNotes({});
        setPasteStartDate(currentDate);
        setPasteMarketId(currentMarketId);
        setPasteSelectedDay(currentDate);
        setPasteModalOpen(true);
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
    const handlePasteRawChange = (text: string, startDate?: string) => {
        setPasteRawText(text);
        const anchor = startDate || pasteStartDate;
        const parsed = parseExcelClipboard(text, allItemsForBulk, anchor);
        setPasteMultiDayPrices(parsed.pricesByDate);
        setPasteDetectedDates(parsed.detectedDates);
        setPastePrices(parsed.prices);
        setPasteNotes(parsed.notes);
        if (parsed.detectedDates.length > 0 && !parsed.detectedDates.includes(pasteSelectedDay)) {
            setPasteSelectedDay(parsed.detectedDates[0]);
        }
    };

    // Update single cell in matrix table
    const handleMatrixPriceChange = (dateStr: string, commodityId: number, val: string) => {
        setPasteMultiDayPrices((prev) => ({
            ...prev,
            [dateStr]: {
                ...(prev[dateStr] || {}),
                [commodityId]: val,
            },
        }));
    };

    // Apply pasted prices into bulk modal
    const handleApplyPasteToBulk = () => {
        const targetDay = pasteSelectedDay || pasteStartDate;
        const dayPrices = pasteMultiDayPrices[targetDay] || pastePrices;
        setBulkPrices((prev) => ({
            ...prev,
            ...dayPrices,
        }));
        setBulkNotes((prev) => ({
            ...prev,
            ...pasteNotes,
        }));
        setPasteModalOpen(false);
        setBulkModalOpen(true);
        const count = Object.keys(dayPrices).length;
        toast.info(`${count} harga untuk tanggal ${targetDay} berhasil dipindahkan ke form input cepat.`);
    };

    // Save pasted prices directly (multi-day up to 31 days)
    const handleSavePasteDirectly = () => {
        const targetMarket = pasteMarketId || currentMarketId;
        if (!targetMarket) return;

        const payloadItems: Array<{
            commodity_id: number;
            recorded_date: string;
            price: number;
            notes: string | null;
        }> = [];

        pasteDetectedDates.forEach((dateStr) => {
            const dayPrices = pasteMultiDayPrices[dateStr] || {};
            allItemsForBulk.forEach((item) => {
                const rawVal = dayPrices[item.commodity_id];
                if (rawVal !== undefined && rawVal !== '' && !isNaN(parseFloat(rawVal))) {
                    payloadItems.push({
                        commodity_id: item.commodity_id,
                        recorded_date: dateStr,
                        price: parseFloat(rawVal),
                        notes: pasteNotes[item.commodity_id] || null,
                    });
                }
            });
        });

        if (payloadItems.length === 0) {
            toast.error('Tidak ada data harga yang valid untuk disimpan.');
            return;
        }

        setIsSubmittingPaste(true);

        router.post(
            bulkStorePriceAction.url(),
            {
                market_id: Number(targetMarket),
                items: payloadItems,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    const daysCount = pasteDetectedDates.length;
                    toast.success(
                        daysCount > 1
                            ? `Berhasil menyimpan ${payloadItems.length} harga komoditas untuk ${daysCount} hari.`
                            : `Berhasil menyimpan ${payloadItems.length} harga komoditas dari Excel.`
                    );
                    setPasteModalOpen(false);
                    setPasteRawText('');
                    setPasteMultiDayPrices({});
                    setPastePrices({});
                    setIsSubmittingPaste(false);
                    if (pasteDetectedDates.includes(currentDate) && targetMarket === currentMarketId) {
                        router.reload({ only: ['items', 'statistics'] });
                    }
                },
                onError: (err) => {
                    toast.error('Gagal menyimpan harga: ' + Object.values(err)[0]);
                    setIsSubmittingPaste(false);
                },
            }
        );
    };

    // Handle excel import form submit (up to 31 days)
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
        formData.append('start_date', importDate);
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
        const parsed = parseExcelClipboard(text, allItemsForBulk.slice(startIdx), currentDate);
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

    const totalPastedPrices = useMemo(() => {
        return Object.values(pasteMultiDayPrices).reduce(
            (acc, curr) => acc + Object.keys(curr).length,
            0
        );
    }, [pasteMultiDayPrices]);

    return (
        <>
            <Head title="Modul Harga Konsumen - DKPP Indramayu" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-[#7C3AED] text-white shadow-xs">
                                <ShoppingBag className="size-5" />
                            </div>
                            <h1 className="font-headline text-2xl sm:text-[32px] sm:leading-[40px] font-bold tracking-tight text-foreground">
                                Modul Harga Konsumen
                            </h1>
                        </div>
                        <p className="mt-1.5 text-sm text-muted-foreground leading-[22px]">
                            Pencatatan harian 25 komoditas pangan strategis per pasar dengan perbandingan otomatis terhadap HET dinamis yang berlaku.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            variant="secondary"
                            asChild
                            className="gap-2"
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
                            className="gap-2"
                        >
                            <Upload className="size-4 text-[#7C3AED]" />
                            Import Excel
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleOpenPasteModal}
                            className="gap-2"
                        >
                            <ClipboardPaste className="size-4 text-[#0D9488]" />
                            Copy-Paste Excel
                        </Button>

                        <Button
                            onClick={handleOpenBulk}
                            className="gap-2 shadow-xs"
                        >
                            <FileSpreadsheet className="size-4" />
                            Input Cepat (25 Komoditas)
                        </Button>
                    </div>
                </div>

                {/* HET Dynamic Information Alert */}
                <div className="flex items-start gap-3.5 rounded-xl border border-blue-200 bg-[#EFF6FF] p-4 text-blue-900 shadow-xs dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
                    <ShieldAlert className="mt-0.5 size-5 shrink-0 text-[#2563EB] dark:text-blue-400" />
                    <div className="text-sm leading-[22px]">
                        <span className="font-semibold text-blue-950 dark:text-blue-100">Mekanisme HET Dinamis:</span> Perbandingan harga pangan di halaman ini secara otomatis disesuaikan dengan regulasi HET yang aktif pada tanggal pantauan (
                        <span className="font-mono font-bold text-[#2563EB] dark:text-blue-300">{currentDate}</span>
                        ). Apabila terjadi pembaruan HET di kemudian hari, data historis tetap merujuk pada HET di periodenya masing-masing.
                    </div>
                </div>

                {/* Date & Market Selection Bar */}
                <Card className="border-border bg-card shadow-xs">
                    <CardContent className="p-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
                            <div>
                                <Label htmlFor="market-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                                    Lokasi Pasar
                                </Label>
                                <Select
                                    value={currentMarketId}
                                    onValueChange={(val) => {
                                        setCurrentMarketId(val);
                                        applyDateAndMarket(currentDate, val);
                                    }}
                                >
                                    <SelectTrigger id="market-select" className="w-full">
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
                                <Label htmlFor="date-input" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                                    Tanggal Pantauan
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="date-input"
                                        type="date"
                                        value={currentDate}
                                        onChange={(e) => {
                                            setCurrentDate(e.target.value);
                                            applyDateAndMarket(e.target.value, currentMarketId);
                                        }}
                                        className="w-full font-mono"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="w-full gap-2 text-foreground"
                                    onClick={() => {
                                        const today = new Date().toISOString().split('T')[0];
                                        setCurrentDate(today);
                                        applyDateAndMarket(today, currentMarketId);
                                    }}
                                >
                                    <Calendar className="size-4 text-[#7C3AED]" />
                                    Hari Ini
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="w-full gap-2 text-foreground"
                                    onClick={() => applyDateAndMarket(currentDate, currentMarketId)}
                                >
                                    <RefreshCw className="size-4 text-muted-foreground" />
                                    Muat Ulang
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* KPI Statistics Overview */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-border bg-card shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Total Komoditas
                            </CardTitle>
                            <div className="flex size-7 items-center justify-center rounded-md bg-[#F5F3FF] text-[#7C3AED] dark:bg-purple-950/60 dark:text-purple-300">
                                <Layers className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="font-mono text-2xl font-bold text-foreground">
                                {statistics.total_commodities}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Terdata: <span className="font-mono font-semibold text-[#0D9488]">{statistics.recorded_count}</span> dari 25 komoditas
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-[#FECACA] bg-[#FEF2F2]/60 dark:border-rose-950/60 dark:bg-rose-950/15 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#EF4444] dark:text-rose-400">
                                Melebihi HET
                            </CardTitle>
                            <div className="flex size-7 items-center justify-center rounded-md bg-[#FEE2E2] text-[#EF4444] dark:bg-rose-900/40 dark:text-rose-300">
                                <ArrowUpRight className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="font-mono text-2xl font-bold text-[#DC2626] dark:text-rose-300">
                                {statistics.above_het_count}
                            </div>
                            <p className="mt-1 text-xs text-[#DC2626]/80 dark:text-rose-400/80">
                                Perlu intervensi / operasi pasar
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-[#A7F3D0] bg-[#ECFDF5]/60 dark:border-emerald-950/60 dark:bg-emerald-950/15 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#059669] dark:text-emerald-400">
                                Di Bawah HET
                            </CardTitle>
                            <div className="flex size-7 items-center justify-center rounded-md bg-[#D1FAE5] text-[#059669] dark:bg-emerald-900/40 dark:text-emerald-300">
                                <ArrowDownRight className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="font-mono text-2xl font-bold text-[#059669] dark:text-emerald-300">
                                {statistics.below_het_count}
                            </div>
                            <p className="mt-1 text-xs text-[#059669]/80 dark:text-emerald-400/80">
                                Harga stabil & terjangkau
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-[#99F6E4] bg-[#F0FDFA]/70 dark:border-teal-950/60 dark:bg-teal-950/15 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#0D9488] dark:text-teal-400">
                                Sesuai HET
                            </CardTitle>
                            <div className="flex size-7 items-center justify-center rounded-md bg-[#CCFBF1] text-[#0D9488] dark:bg-teal-900/40 dark:text-teal-300">
                                <CheckCircle2 className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="font-mono text-2xl font-bold text-[#0D9488] dark:text-teal-300">
                                {statistics.equal_het_count}
                            </div>
                            <p className="mt-1 text-xs text-[#0D9488]/80 dark:text-teal-400/80">
                                Sesuai batas acuan regulasi
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Search Toolbar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
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
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Reset Filter
                            </Button>
                        )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Menampilkan <span className="font-mono font-semibold text-foreground">{displayedItems.length}</span> dari {items.length} komoditas
                    </div>
                </div>

                {/* Consumer Price Table */}
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-border bg-[#FAFAFA] text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:bg-slate-900/60">
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
                            <tbody className="divide-y divide-border">
                                {displayedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-muted-foreground">
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
                                                className={`transition-colors hover:bg-[#F5F3FF]/60 dark:hover:bg-purple-950/20 ${
                                                    isAbove
                                                        ? 'bg-[#FEF2F2]/30 dark:bg-rose-950/10'
                                                        : isBelow
                                                          ? 'bg-[#ECFDF5]/30 dark:bg-emerald-950/10'
                                                          : ''
                                                }`}
                                            >
                                                <td className="px-4 py-3.5 text-center font-mono text-xs text-muted-foreground">
                                                    {item.order || idx + 1}
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    <div className="font-semibold text-foreground">
                                                        {item.commodity_name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {item.category}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    <Badge variant="outline" className="text-xs font-normal rounded-md">
                                                        {item.unit}
                                                    </Badge>
                                                </td>

                                                <td className="px-4 py-3.5 text-right">
                                                    {isRecorded ? (
                                                        <span className="font-mono font-bold text-foreground">
                                                            {formatCurrency(item.price)}
                                                        </span>
                                                    ) : (
                                                        <span className="italic text-muted-foreground">Belum diinput</span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5 text-right">
                                                    {item.applicable_het ? (
                                                        <div>
                                                            <span className="font-mono font-medium text-foreground">
                                                                {formatCurrency(item.applicable_het.price)}
                                                            </span>
                                                            <div className="text-[11px] text-muted-foreground font-mono">
                                                                Efektif: {item.applicable_het.effective_date}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5 text-right font-mono text-xs">
                                                    {isRecorded && item.diff !== null ? (
                                                        <div
                                                            className={
                                                                isAbove
                                                                    ? 'font-bold text-[#EF4444]'
                                                                    : isBelow
                                                                      ? 'font-bold text-[#059669]'
                                                                      : 'text-[#0D9488]'
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
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5 text-center">
                                                    {isRecorded ? (
                                                        isAbove ? (
                                                            <Badge variant="inactive" className="gap-1 font-semibold">
                                                                <ArrowUpRight className="size-3" /> Di Atas HET
                                                            </Badge>
                                                        ) : isBelow ? (
                                                            <Badge variant="active" className="gap-1 font-semibold">
                                                                <ArrowDownRight className="size-3" /> Di Bawah HET
                                                            </Badge>
                                                        ) : isEqual ? (
                                                            <Badge variant="secondary" className="gap-1 font-semibold">
                                                                <CheckCircle2 className="size-3" /> Sesuai HET
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline">Tanpa HET</Badge>
                                                        )
                                                    ) : (
                                                        <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                            Belum Ada Data
                                                        </Badge>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    <div className="text-xs text-muted-foreground">
                                                        {item.applicable_het?.source_regulation || item.notes || '-'}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3.5 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => handleOpenEdit(item)}
                                                            className="h-8 gap-1 px-2.5 text-xs"
                                                        >
                                                            <Edit3 className="size-3.5 text-[#7C3AED]" />
                                                            {isRecorded ? 'Edit' : 'Input'}
                                                        </Button>

                                                        {isRecorded && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeletePrice(item)}
                                                                className="size-8 p-0 text-[#EF4444] hover:bg-[#FEF2F2] hover:text-[#DC2626] dark:hover:bg-rose-950/50"
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
                            <DialogTitle className="flex items-center gap-2.5">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-[#F5F3FF] text-[#7C3AED] dark:bg-purple-950/60 dark:text-purple-300">
                                    <ShoppingBag className="size-4.5" />
                                </div>
                                <span>{editingItem?.price !== null ? 'Perbarui Harga Konsumen' : 'Input Harga Konsumen'}</span>
                            </DialogTitle>
                            <DialogDescription>
                                Komoditas: <span className="font-semibold text-foreground">{editingItem?.commodity_name}</span> ({editingItem?.unit})
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveSingle} className="space-y-4">
                            <div className="rounded-lg border border-purple-100 bg-[#F5F3FF]/50 p-3.5 text-xs dark:border-purple-950/40 dark:bg-purple-950/20">
                                <div className="flex justify-between py-1">
                                    <span className="text-muted-foreground">Pasar:</span>
                                    <span className="font-medium text-foreground">{selectedMarket?.name}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-muted-foreground">Tanggal:</span>
                                    <span className="font-mono font-medium text-foreground">{currentDate}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-muted-foreground">HET Berlaku:</span>
                                    <span className="font-mono font-bold text-foreground">
                                        {formatCurrency(editingItem?.applicable_het?.price ?? null)} / {editingItem?.unit}
                                    </span>
                                </div>
                                {editingItem?.applicable_het?.source_regulation && (
                                    <div className="flex justify-between py-1">
                                        <span className="text-muted-foreground">Regulasi HET:</span>
                                        <span className="text-foreground">
                                            {editingItem.applicable_het.source_regulation}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="single-price">Harga Konsumen (Rp / {editingItem?.unit})</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground">Rp</span>
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
                                            <span className="font-semibold text-[#EF4444]">
                                                Melebihi HET sebesar +Rp {(parseFloat(singlePrice) - editingItem.applicable_het.price).toLocaleString('id-ID')}
                                            </span>
                                        ) : parseFloat(singlePrice) < editingItem.applicable_het.price ? (
                                            <span className="font-semibold text-[#059669]">
                                                Di bawah HET sebesar -Rp {(editingItem.applicable_het.price - parseFloat(singlePrice)).toLocaleString('id-ID')}
                                            </span>
                                        ) : (
                                            <span className="font-semibold text-[#0D9488]">
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
                                <Button type="submit" disabled={isSubmittingSingle}>
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
                                    <DialogTitle className="flex items-center gap-2.5">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-[#F5F3FF] text-[#7C3AED] dark:bg-purple-950/60 dark:text-purple-300">
                                            <FileSpreadsheet className="size-4.5" />
                                        </div>
                                        <span>Form Input Cepat 25 Komoditas Pangan</span>
                                    </DialogTitle>
                                    <DialogDescription className="mt-1">
                                        Masukkan harga konsumen harian secara terpadu untuk pasar{' '}
                                        <span className="font-semibold text-foreground">{selectedMarket?.name}</span>{' '}
                                        pada tanggal <span className="font-mono font-semibold text-foreground">{currentDate}</span>.
                                    </DialogDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setBulkModalOpen(false);
                                        handleOpenPasteModal();
                                    }}
                                    className="gap-1.5 text-xs shrink-0 self-start sm:self-center"
                                >
                                    <ClipboardPaste className="size-3.5" />
                                    Tempel dari Excel (Ctrl+V)
                                </Button>
                            </div>
                            <div className="rounded-lg border border-purple-200/60 bg-[#F5F3FF]/70 px-3 py-2 text-xs text-purple-950 dark:border-purple-900/40 dark:bg-purple-950/30 dark:text-purple-300">
                                💡 <strong>Tip Cepat:</strong> Anda juga bisa langsung menekan <kbd className="rounded border bg-white px-1 py-0.5 font-mono text-[10px] text-foreground dark:bg-slate-800">Ctrl+V</kbd> pada kolom input harga baris pertama untuk mengisi seluruh 25 komoditas ke bawah secara otomatis.
                            </div>
                        </DialogHeader>

                        <form onSubmit={handleSaveBulk} className="flex flex-1 flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto pr-1">
                                <table className="w-full text-left text-xs">
                                    <thead className="sticky top-0 border-b border-border bg-[#FAFAFA] font-semibold text-muted-foreground dark:bg-slate-900/80">
                                        <tr>
                                            <th className="py-2.5 pl-2 pr-2">No</th>
                                            <th className="py-2.5 px-2">Komoditas</th>
                                            <th className="py-2.5 px-2">Satuan</th>
                                            <th className="py-2.5 px-2 text-right">HET Aktif</th>
                                            <th className="py-2.5 px-2 w-44">Harga Konsumen (Rp)</th>
                                            <th className="py-2.5 px-2">Status / Selisih</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {allItemsForBulk.map((item, idx) => {
                                            const enteredVal = bulkPrices[item.commodity_id];
                                            const numVal = enteredVal ? parseFloat(enteredVal) : null;
                                            const hetVal = item.applicable_het?.price ?? null;

                                            let diffBadge = null;
                                            if (numVal !== null && hetVal !== null) {
                                                const diff = numVal - hetVal;
                                                if (diff > 0) {
                                                    diffBadge = (
                                                        <span className="font-semibold text-[#EF4444]">
                                                            +Rp {diff.toLocaleString('id-ID')} (Di Atas HET)
                                                        </span>
                                                    );
                                                } else if (diff < 0) {
                                                    diffBadge = (
                                                        <span className="font-semibold text-[#059669]">
                                                            -Rp {Math.abs(diff).toLocaleString('id-ID')} (Di Bawah HET)
                                                        </span>
                                                    );
                                                } else {
                                                    diffBadge = (
                                                        <span className="font-semibold text-[#0D9488]">
                                                            Sesuai HET
                                                        </span>
                                                    );
                                                }
                                            }

                                            return (
                                                <tr key={item.commodity_id} className="hover:bg-[#F5F3FF]/60 dark:hover:bg-purple-950/20">
                                                    <td className="py-2 pl-2 pr-2 text-muted-foreground font-mono">
                                                        {item.order || idx + 1}
                                                    </td>
                                                    <td className="py-2 px-2">
                                                        <div className="font-medium text-foreground">
                                                            {item.commodity_name}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground">{item.category}</div>
                                                    </td>
                                                    <td className="py-2 px-2">
                                                        <Badge variant="outline" className="text-[10px] font-normal rounded-md">
                                                            {item.unit}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2 px-2 text-right font-mono font-medium text-foreground">
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
                                                        {diffBadge || <span className="text-muted-foreground">-</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <DialogFooter className="mt-4 border-t border-border pt-3">
                                <Button type="button" variant="outline" onClick={() => setBulkModalOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSubmittingBulk}>
                                    {isSubmittingBulk ? 'Menyimpan Semua Data...' : 'Simpan Semua Data (25 Komoditas)'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Import Excel Modal */}
                {/* Import Excel Modal (Landscape Layout) */}
                <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
                    <DialogContent className="w-[94vw] max-w-[94vw] sm:max-w-none md:max-w-4xl lg:max-w-5xl xl:max-w-[1180px] 2xl:max-w-[1280px] max-h-[92vh] p-4 sm:p-6 flex flex-col overflow-hidden">
                        <DialogHeader className="pb-3 border-b border-border shrink-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pr-6">
                                <div>
                                    <DialogTitle className="flex items-center gap-2.5 text-base sm:text-lg">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-[#F5F3FF] text-[#7C3AED] dark:bg-purple-950/60 dark:text-purple-300">
                                            <Upload className="size-4.5" />
                                        </div>
                                        <span>Import Data Harga dari File Excel (1 Hari, 1 Minggu s/d 1 Bulan)</span>
                                    </DialogTitle>
                                    <DialogDescription className="text-xs mt-0.5">
                                        Unggah berkas spreadsheet (.xlsx atau .csv) untuk mencatat harga 25 komoditas pangan secara otomatis ke sistem database.
                                    </DialogDescription>
                                </div>
                                <Badge variant="filter" className="text-xs font-semibold py-1 px-3 shrink-0 self-start sm:self-auto">
                                    Maks. 31 Hari / Transaksi
                                </Badge>
                            </div>
                        </DialogHeader>

                        {/* Import Form in Landscape 2-Column Grid */}
                        <form onSubmit={handleImportSubmit} className="flex flex-1 min-h-0 flex-col overflow-hidden">
                            <div className="flex-1 min-h-0 overflow-y-auto py-3 pr-1">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                                    {/* Left Column: Langkah 1 - Format & Unduh Template Resmi */}
                                    <div className="lg:col-span-5 flex flex-col gap-3.5">
                                        <div className="rounded-xl border border-purple-200/80 bg-[#F5F3FF]/40 p-4 dark:border-purple-900/60 dark:bg-purple-950/20 flex flex-col justify-between flex-1">
                                            <div>
                                                <div className="flex items-start gap-3">
                                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#7C3AED] text-white shadow-xs">
                                                        <FileSpreadsheet className="size-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-foreground">
                                                            1. Format Template Resmi
                                                        </h4>
                                                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                                                            Unduh berkas acuan sesuai urutan baku 25 komoditas pangan beserta nilai HET aktif.
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Period Selector Tabs */}
                                                <div className="mt-3.5 space-y-1.5">
                                                    <div className="text-[11px] font-semibold text-foreground">
                                                        Pilih Periode Template:
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-white p-1 dark:bg-slate-900">
                                                        <button
                                                            type="button"
                                                            onClick={() => setImportPeriod('daily')}
                                                            className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                                                                importPeriod === 'daily'
                                                                    ? 'bg-[#7C3AED] text-white shadow-xs'
                                                                    : 'text-muted-foreground hover:text-[#7C3AED]'
                                                            }`}
                                                        >
                                                            1 Hari
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setImportPeriod('weekly')}
                                                            className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                                                                importPeriod === 'weekly'
                                                                    ? 'bg-[#7C3AED] text-white shadow-xs'
                                                                    : 'text-muted-foreground hover:text-[#7C3AED]'
                                                            }`}
                                                        >
                                                            7 Hari (1 Mgg)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setImportPeriod('monthly')}
                                                            className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                                                                importPeriod === 'monthly'
                                                                    ? 'bg-[#7C3AED] text-white shadow-xs'
                                                                    : 'text-muted-foreground hover:text-[#7C3AED]'
                                                            }`}
                                                        >
                                                            31 Hari (1 Bln)
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex flex-col gap-2">
                                                    <a
                                                        href={templatePriceAction.url({
                                                            query: {
                                                                format: 'xlsx',
                                                                date: importDate,
                                                                period: importPeriod,
                                                                days: importPeriod === 'weekly' ? 7 : importPeriod === 'monthly' ? 31 : 1,
                                                            },
                                                        })}
                                                        download={
                                                            importPeriod === 'weekly'
                                                                ? 'format_harga_konsumen_mingguan_7_hari.xlsx'
                                                                : importPeriod === 'monthly'
                                                                ? 'format_harga_konsumen_bulanan_31_hari.xlsx'
                                                                : 'format_harga_konsumen_25_komoditas.xlsx'
                                                        }
                                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#7C3AED] bg-white px-3 py-2 text-xs font-semibold text-[#7C3AED] shadow-2xs hover:bg-[#F5F3FF] transition-colors dark:bg-purple-950/40 dark:text-purple-300"
                                                    >
                                                        <Download className="size-4 text-[#7C3AED]" />
                                                        Download Template Excel (.xlsx)
                                                    </a>
                                                    <a
                                                        href={templatePriceAction.url({
                                                            query: {
                                                                format: 'csv',
                                                                date: importDate,
                                                                period: importPeriod,
                                                                days: importPeriod === 'weekly' ? 7 : importPeriod === 'monthly' ? 31 : 1,
                                                            },
                                                        })}
                                                        download={
                                                            importPeriod === 'weekly'
                                                                ? 'format_harga_konsumen_mingguan_7_hari.csv'
                                                                : importPeriod === 'monthly'
                                                                ? 'format_harga_konsumen_bulanan_31_hari.csv'
                                                                : 'format_harga_konsumen_25_komoditas.csv'
                                                        }
                                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground shadow-2xs hover:bg-[#F3F4F6] transition-colors dark:bg-slate-800 dark:text-slate-200"
                                                    >
                                                        <Download className="size-4 text-muted-foreground" />
                                                        Download Template CSV (.csv)
                                                    </a>
                                                </div>
                                            </div>

                                            <div className="mt-4 rounded-lg border border-purple-200/60 bg-white/80 p-2.5 text-[11px] text-foreground dark:border-purple-900 dark:bg-purple-950/40">
                                                <strong>Tip:</strong> Tanggal kolom pada template otomatis disesuaikan mulai dari <strong>{formatShortDate(importDate)}</strong>.
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Langkah 2 - Konfigurasi Target & Unggah Berkas */}
                                    <div className="lg:col-span-7 flex flex-col gap-3.5">
                                        {/* Market & Date Configuration */}
                                        <div className="grid gap-3 sm:grid-cols-2 rounded-xl border border-border bg-[#FAFAFA] p-3.5 dark:bg-slate-900/60">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="import-market" className="text-xs font-semibold text-foreground">
                                                    2. Lokasi Pasar Target
                                                </Label>
                                                <Select value={importMarketId} onValueChange={setImportMarketId}>
                                                    <SelectTrigger id="import-market" className="w-full h-9 text-xs bg-white dark:bg-slate-900">
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
                                                <Label htmlFor="import-date" className="text-xs font-semibold text-foreground">
                                                    Tanggal Mulai / Acuan
                                                </Label>
                                                <Input
                                                    id="import-date"
                                                    type="date"
                                                    value={importDate}
                                                    onChange={(e) => setImportDate(e.target.value)}
                                                    required
                                                    className="h-9 text-xs bg-white dark:bg-slate-900 font-mono"
                                                />
                                            </div>
                                        </div>

                                        {/* Upload Dropzone */}
                                        <div className="space-y-1.5 flex flex-col flex-1">
                                            <Label htmlFor="import-file" className="text-xs font-semibold text-foreground">
                                                3. Pilih atau Seret Berkas Spreadsheet
                                            </Label>
                                            <div className="relative flex flex-1 min-h-[140px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-4 text-center hover:border-[#7C3AED] transition-colors bg-white dark:border-slate-700 dark:bg-slate-900/50">
                                                <input
                                                    id="import-file"
                                                    type="file"
                                                    accept=".xlsx,.csv,.txt,.xls"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0] || null;
                                                        setImportFile(f);
                                                    }}
                                                    className="absolute inset-0 cursor-pointer opacity-0 z-10"
                                                />
                                                {importFile ? (
                                                    <div className="flex flex-col items-center gap-2 p-2 text-center">
                                                        <div className="flex size-10 items-center justify-center rounded-full bg-[#F5F3FF] text-[#7C3AED] dark:bg-purple-950 dark:text-purple-300">
                                                            <CheckCircle2 className="size-6" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-sm text-foreground truncate max-w-xs sm:max-w-md">
                                                                {importFile.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                Ukuran: {(importFile.size / 1024).toFixed(1)} KB • Siap diimpor
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setImportFile(null);
                                                            }}
                                                            className="relative z-20 text-xs text-[#EF4444] hover:text-[#DC2626] font-medium underline mt-1"
                                                        >
                                                            Ganti atau Hapus Berkas
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                                                        <div className="flex size-10 items-center justify-center rounded-full bg-[#F5F3FF] text-[#7C3AED] dark:bg-slate-800 dark:text-purple-300">
                                                            <Upload className="size-5" />
                                                        </div>
                                                        <p className="text-xs font-semibold text-foreground">
                                                            Klik untuk memilih atau seret berkas ke sini
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            Mendukung format .xlsx, .csv, atau .xls (Maksimal 10MB)
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Notice Callout */}
                                        <div className="rounded-lg border border-blue-200 bg-[#EFF6FF] p-3 text-xs text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
                                            <span className="font-semibold text-[#2563EB] dark:text-blue-300">💡 Deteksi Tanggal Otomatis:</span> Berkas dapat berisi 1 hari, 1 minggu (7 hari), atau hingga 31 hari (1 bulan). Sistem otomatis membaca kolom tanggal dan mencatat seluruh data dalam satu transaksi database yang aman.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Section */}
                            <DialogFooter className="mt-2 border-t border-border pt-3 flex flex-col sm:flex-row gap-2 sm:justify-between items-center shrink-0">
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
                                    className="gap-2"
                                >
                                    {isSubmittingImport ? (
                                        <>
                                            <RefreshCw className="size-4 animate-spin" />
                                            Mengimpor Data...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="size-4" />
                                            Mulai Impor Data (Hingga 31 Hari)
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Copy-Paste dari Excel Modal */}
                <Dialog open={pasteModalOpen} onOpenChange={setPasteModalOpen}>
                    <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-none xl:max-w-[1550px] 2xl:max-w-[1720px] h-[94vh] max-h-[94vh] p-4 sm:p-5 flex flex-col overflow-hidden">
                        <DialogHeader className="pb-2.5 border-b border-border shrink-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pr-6">
                                <div>
                                    <DialogTitle className="flex items-center gap-2.5 text-base sm:text-lg">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-[#F5F3FF] text-[#7C3AED] dark:bg-purple-950/60 dark:text-purple-300">
                                            <ClipboardPaste className="size-4.5" />
                                        </div>
                                        <span>Salin & Tempel (Copy-Paste) Data Excel (1 Hari, 1 Minggu s/d 1 Bulan)</span>
                                    </DialogTitle>
                                    <DialogDescription className="text-xs mt-0.5">
                                        Salin kolom harga dari spreadsheet Excel (<kbd className="rounded border bg-muted px-1 font-mono text-[10px]">Ctrl+C</kbd>), lalu tempelkan (<kbd className="rounded border bg-muted px-1 font-mono text-[10px]">Ctrl+V</kbd>) di area tempel. Sistem otomatis memetakan ke 25 komoditas pangan.
                                    </DialogDescription>
                                </div>
                                {pasteDetectedDates.length > 0 && totalPastedPrices > 0 && (
                                    <Badge variant="filter" className="text-xs font-semibold py-1 px-3 shrink-0 self-start sm:self-auto gap-1">
                                        <CheckCheck className="size-3.5 text-[#7C3AED]" />
                                        {pasteDetectedDates.length} Hari Terdeteksi ({totalPastedPrices} Nilai Harga)
                                    </Badge>
                                )}
                            </div>
                        </DialogHeader>

                        {/* Landscape Body Split Pane: Left (Input & Settings) / Right (Matrix & Detail Preview) */}
                        <div className="flex flex-1 min-h-0 flex-col lg:flex-row gap-3.5 overflow-hidden py-1">
                            {/* Left Panel: Sidebar Kontrol & Tempel Data */}
                            <div className="w-full lg:w-[330px] xl:w-[370px] shrink-0 flex flex-col gap-2.5 overflow-y-auto pr-1">
                                {/* Box 1: Pengaturan Data */}
                                <div className="space-y-2.5 rounded-lg border border-border bg-[#FAFAFA] p-3 dark:bg-slate-900/60">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold text-foreground">
                                            Lokasi Pasar Target
                                        </Label>
                                        <Select value={pasteMarketId} onValueChange={setPasteMarketId}>
                                            <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900">
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

                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold text-foreground">
                                            Pilihan Periode
                                        </Label>
                                        <div className="grid grid-cols-3 gap-1 rounded-md border border-border bg-white p-1 dark:bg-slate-900">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPastePeriod('daily');
                                                    const newDates = [pasteStartDate];
                                                    setPasteDetectedDates(newDates);
                                                    setPasteSelectedDay(pasteStartDate);
                                                    if (pasteRawText) handlePasteRawChange(pasteRawText, pasteStartDate);
                                                }}
                                                className={`rounded py-1 text-xs font-semibold transition-all ${
                                                    pastePeriod === 'daily'
                                                        ? 'bg-[#7C3AED] text-white shadow-2xs'
                                                        : 'text-muted-foreground hover:text-[#7C3AED]'
                                                }`}
                                            >
                                                1 Hari
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPastePeriod('weekly');
                                                    const newDates = [];
                                                    for (let i = 0; i < 7; i++) {
                                                        newDates.push(addDaysToDateString(pasteStartDate, i));
                                                    }
                                                    setPasteDetectedDates(newDates);
                                                    setPasteSelectedDay(pasteStartDate);
                                                    if (pasteRawText) handlePasteRawChange(pasteRawText, pasteStartDate);
                                                }}
                                                className={`rounded py-1 text-xs font-semibold transition-all ${
                                                    pastePeriod === 'weekly'
                                                        ? 'bg-[#7C3AED] text-white shadow-2xs'
                                                        : 'text-muted-foreground hover:text-[#7C3AED]'
                                                }`}
                                            >
                                                7 Hari (1 Mgg)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPastePeriod('monthly');
                                                    const newDates = [];
                                                    for (let i = 0; i < 31; i++) {
                                                        newDates.push(addDaysToDateString(pasteStartDate, i));
                                                    }
                                                    setPasteDetectedDates(newDates);
                                                    setPasteSelectedDay(pasteStartDate);
                                                    if (pasteRawText) handlePasteRawChange(pasteRawText, pasteStartDate);
                                                }}
                                                className={`rounded py-1 text-xs font-semibold transition-all ${
                                                    pastePeriod === 'monthly'
                                                        ? 'bg-[#7C3AED] text-white shadow-2xs'
                                                        : 'text-muted-foreground hover:text-[#7C3AED]'
                                                }`}
                                            >
                                                31 Hari (1 Bln)
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold text-foreground">
                                            Tanggal Mulai
                                        </Label>
                                        <Input
                                            type="date"
                                            value={pasteStartDate}
                                            onChange={(e) => {
                                                const newD = e.target.value;
                                                setPasteStartDate(newD);
                                                const days = pastePeriod === 'daily' ? 1 : pastePeriod === 'weekly' ? 7 : 31;
                                                const newDates: string[] = [];
                                                for (let i = 0; i < days; i++) {
                                                    newDates.push(addDaysToDateString(newD, i));
                                                }
                                                setPasteDetectedDates(newDates);
                                                setPasteSelectedDay(newD);
                                                if (pasteRawText) {
                                                    handlePasteRawChange(pasteRawText, newD);
                                                }
                                            }}
                                            className="h-8 text-xs bg-white dark:bg-slate-900 font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Box 2: Area Tempel (Ctrl + V) */}
                                <div className="space-y-1.5 flex flex-col flex-1">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="paste-textarea" className="text-xs font-semibold text-foreground">
                                            Area Tempel Clipboard (Ctrl+V)
                                        </Label>
                                        {pasteRawText && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPasteRawText('');
                                                    setPasteMultiDayPrices({});
                                                    setPastePrices({});
                                                    setPasteNotes({});
                                                    const days = pastePeriod === 'daily' ? 1 : pastePeriod === 'weekly' ? 7 : 31;
                                                    const newDates: string[] = [];
                                                    for (let i = 0; i < days; i++) {
                                                        newDates.push(addDaysToDateString(pasteStartDate, i));
                                                    }
                                                    setPasteDetectedDates(newDates);
                                                }}
                                                className="text-[11px] font-medium text-[#EF4444] hover:text-[#DC2626]"
                                            >
                                                Bersihkan
                                            </button>
                                        )}
                                    </div>
                                    <textarea
                                        id="paste-textarea"
                                        value={pasteRawText}
                                        onChange={(e) => handlePasteRawChange(e.target.value)}
                                        placeholder={'Klik di sini lalu tekan Ctrl+V...\nContoh:\n14500\t14500\t14600\t...\n13000\t13000\t13000\t...'}
                                        className="h-32 sm:h-36 w-full rounded-md border border-border bg-white p-2.5 font-mono text-xs focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[#7C3AED]/25 focus:outline-none dark:bg-slate-900 leading-relaxed"
                                    />
                                </div>

                                {/* Box 3: Panduan Format Ringkas */}
                                <div className="rounded-lg border border-blue-200 bg-[#EFF6FF] p-3 text-xs text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
                                    <div className="font-semibold mb-1 text-[11px] uppercase tracking-wider text-[#2563EB] dark:text-blue-300">Format yang Didukung:</div>
                                    <ul className="space-y-1 text-[11px] text-blue-800 dark:text-blue-300 list-disc pl-3.5">
                                        <li><strong>1 Hari:</strong> 25 baris &times; 1 kolom harga di Excel.</li>
                                        <li><strong>1 Minggu:</strong> 25 baris &times; 7 kolom harga (atau tabel dengan kolom tanggal).</li>
                                        <li><strong>1 Bulan:</strong> 25 baris &times; s/d 31 kolom harga (atau tabel bulanan).</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Right Panel: Workspace Editor Tabel Matriks & Detail HET */}
                            <div className="flex-1 min-w-0 flex flex-col rounded-lg border border-border overflow-hidden bg-card">
                                {/* Toolbar Bar */}
                                <div className="bg-[#FAFAFA] px-3.5 py-2 text-xs font-semibold border-b border-border dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-[11px]">Mode Tampilan:</span>
                                        <div className="inline-flex rounded-md border border-border bg-white p-0.5 dark:bg-slate-900">
                                            <button
                                                type="button"
                                                onClick={() => setPasteViewMode('matrix')}
                                                className={`rounded px-3 py-1 text-xs font-semibold transition-all ${
                                                    pasteViewMode === 'matrix'
                                                        ? 'bg-[#7C3AED] text-white shadow-2xs'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                Tabel Matriks ({pasteDetectedDates.length} Hari)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPasteViewMode('daily')}
                                                className={`rounded px-3 py-1 text-xs font-semibold transition-all ${
                                                    pasteViewMode === 'daily'
                                                        ? 'bg-[#7C3AED] text-white shadow-2xs'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                Detail Per Hari & HET
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                        {pasteViewMode === 'daily' && (
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-medium text-foreground">Pilih Tanggal:</span>
                                                <Select value={pasteSelectedDay} onValueChange={setPasteSelectedDay}>
                                                    <SelectTrigger className="h-7 w-40 text-xs bg-white dark:bg-slate-900">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {pasteDetectedDates.map((d) => (
                                                            <SelectItem key={d} value={d}>
                                                                {formatShortDate(d)} ({getDayName(d)})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        <span className="hidden sm:inline">
                                            Pasar: <strong className="text-foreground">{markets.find((m) => String(m.id) === String(pasteMarketId))?.name || selectedMarket?.name}</strong>
                                        </span>
                                    </div>
                                </div>

                                {/* Table Area */}
                                <div className="flex-1 min-h-0 overflow-auto">
                                    {pasteViewMode === 'matrix' ? (
                                        /* Horizontal Scrolling Matrix View */
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead className="sticky top-0 border-b border-border bg-[#FAFAFA] font-semibold text-muted-foreground dark:bg-slate-900/80 z-10 shadow-xs">
                                                <tr>
                                                    <th className="py-2.5 pl-3 pr-2 w-10 sticky left-0 bg-[#FAFAFA] dark:bg-slate-900 z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.08)]">No</th>
                                                    <th className="py-2.5 px-3 min-w-[200px] sticky left-10 bg-[#FAFAFA] dark:bg-slate-900 z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.08)]">Nama Komoditas</th>
                                                    <th className="py-2.5 px-2.5 w-16 sticky left-[240px] bg-[#FAFAFA] dark:bg-slate-900 z-20 shadow-[2px_0_0_0_rgba(0,0,0,0.08)]">Satuan</th>
                                                    {pasteDetectedDates.map((d) => {
                                                        const filledForDay = allItemsForBulk.filter((it) => pasteMultiDayPrices[d]?.[it.commodity_id]).length;
                                                        return (
                                                            <th key={d} className="py-2.5 px-2 min-w-[130px] text-center border-l border-border/60">
                                                                <div className="font-semibold text-foreground">
                                                                    {formatShortDate(d)}
                                                                </div>
                                                                <div className="text-[10px] text-muted-foreground font-normal">
                                                                    {getDayName(d)} • {filledForDay}/25
                                                                </div>
                                                            </th>
                                                        );
                                                    })}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {allItemsForBulk.map((item, idx) => (
                                                    <tr key={item.commodity_id} className="hover:bg-[#F5F3FF]/60 dark:hover:bg-purple-950/20">
                                                        <td className="py-1.5 pl-3 pr-2 text-muted-foreground font-mono sticky left-0 bg-card z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.08)]">
                                                            {item.order || idx + 1}
                                                        </td>
                                                        <td className="py-1.5 px-3 sticky left-10 bg-card z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.08)]">
                                                            <div className="font-medium text-foreground truncate max-w-[190px]">
                                                                {item.commodity_name}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground truncate max-w-[190px]">{item.category}</div>
                                                        </td>
                                                        <td className="py-1.5 px-2.5 sticky left-[240px] bg-card z-10 shadow-[2px_0_0_0_rgba(0,0,0,0.08)]">
                                                            <Badge variant="outline" className="text-[10px] font-normal px-1 py-0 rounded-md">
                                                                {item.unit}
                                                            </Badge>
                                                        </td>
                                                        {pasteDetectedDates.map((d) => {
                                                            const val = pasteMultiDayPrices[d]?.[item.commodity_id] ?? '';
                                                            return (
                                                                <td key={d} className="p-1 min-w-[130px] border-l border-border/60">
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        step="100"
                                                                        placeholder="-"
                                                                        value={val}
                                                                        onChange={(e) => handleMatrixPriceChange(d, item.commodity_id, e.target.value)}
                                                                        className={`h-7 font-mono text-xs text-right ${
                                                                            val
                                                                                ? 'border-[#7C3AED]/50 bg-[#F5F3FF] font-semibold text-[#7C3AED] dark:bg-purple-950/30 dark:text-purple-300'
                                                                                : 'text-muted-foreground'
                                                                        }`}
                                                                    />
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        /* Single Day Detailed HET View */
                                        <table className="w-full text-left text-xs">
                                            <thead className="sticky top-0 border-b border-border bg-[#FAFAFA] font-semibold text-muted-foreground dark:bg-slate-900/80 shadow-xs">
                                                <tr>
                                                    <th className="py-2.5 pl-3 pr-2 w-10">No</th>
                                                    <th className="py-2.5 px-3">Nama Komoditas</th>
                                                    <th className="py-2.5 px-2">Satuan</th>
                                                    <th className="py-2.5 px-2 text-right">HET Aktif</th>
                                                    <th className="py-2.5 px-2 w-44">Harga Terdeteksi ({formatShortDate(pasteSelectedDay)})</th>
                                                    <th className="py-2.5 px-2">Status / Selisih</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/60">
                                                {allItemsForBulk.map((item, idx) => {
                                                    const enteredVal = pasteMultiDayPrices[pasteSelectedDay]?.[item.commodity_id] ?? '';
                                                    const numVal = enteredVal ? parseFloat(enteredVal) : null;
                                                    const hetVal = item.applicable_het?.price ?? null;

                                                    let diffBadge = null;
                                                    if (numVal !== null && hetVal !== null) {
                                                        const diff = numVal - hetVal;
                                                        if (diff > 0) {
                                                            diffBadge = (
                                                                <span className="font-semibold text-[#EF4444]">
                                                                    +Rp {diff.toLocaleString('id-ID')} (Di Atas HET)
                                                                </span>
                                                            );
                                                        } else if (diff < 0) {
                                                            diffBadge = (
                                                                <span className="font-semibold text-[#059669]">
                                                                    -Rp {Math.abs(diff).toLocaleString('id-ID')} (Di Bawah HET)
                                                                </span>
                                                            );
                                                        } else {
                                                            diffBadge = (
                                                                <span className="font-semibold text-[#0D9488]">
                                                                    Sesuai HET
                                                                </span>
                                                            );
                                                        }
                                                    }

                                                    return (
                                                        <tr key={item.commodity_id} className="hover:bg-[#F5F3FF]/60 dark:hover:bg-purple-950/20">
                                                            <td className="py-2 pl-3 pr-2 text-muted-foreground font-mono">
                                                                {item.order || idx + 1}
                                                            </td>
                                                            <td className="py-2 px-3">
                                                                <div className="font-medium text-foreground">
                                                                    {item.commodity_name}
                                                                </div>
                                                                <div className="text-[11px] text-muted-foreground">{item.category}</div>
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                <Badge variant="outline" className="text-[10px] font-normal rounded-md">
                                                                    {item.unit}
                                                                </Badge>
                                                            </td>
                                                            <td className="py-2 px-2 text-right font-mono font-medium text-foreground">
                                                                {hetVal !== null ? formatCurrency(hetVal) : '-'}
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    step="100"
                                                                    placeholder="Belum ada data"
                                                                    value={enteredVal}
                                                                    onChange={(e) =>
                                                                        handleMatrixPriceChange(pasteSelectedDay, item.commodity_id, e.target.value)
                                                                    }
                                                                    className={`h-8 font-mono text-xs ${
                                                                        enteredVal
                                                                            ? 'border-[#7C3AED]/50 bg-[#F5F3FF]/50 font-semibold dark:bg-purple-950/20'
                                                                            : ''
                                                                    }`}
                                                                />
                                                            </td>
                                                            <td className="py-2 px-2 text-[11px]">
                                                                {diffBadge || (
                                                                    <span className="italic text-muted-foreground">
                                                                        {item.price ? `Tercatat: Rp ${item.price.toLocaleString('id-ID')}` : 'Kosong'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Section */}
                        <DialogFooter className="mt-2 border-t border-border pt-2.5 flex flex-col sm:flex-row gap-2 sm:justify-between items-center shrink-0">
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
                                    disabled={totalPastedPrices === 0}
                                    className="gap-1.5 text-xs"
                                >
                                    <Edit3 className="size-3.5" />
                                    Terapkan ke Form Input Cepat ({formatShortDate(pasteSelectedDay)})
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSavePasteDirectly}
                                    disabled={totalPastedPrices === 0 || isSubmittingPaste}
                                    className="gap-1.5 text-xs"
                                >
                                    {isSubmittingPaste
                                        ? 'Menyimpan...'
                                        : `Simpan Langsung ke Sistem (${totalPastedPrices} Nilai / ${pasteDetectedDates.length} Hari)`}
                                </Button>
                            </div>
                        </DialogFooter>
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
