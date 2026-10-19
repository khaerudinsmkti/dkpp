import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    Check,
    CheckCircle2,
    ClipboardPaste,
    Compass,
    Download,
    Edit3,
    ExternalLink,
    FileSpreadsheet,
    FileText,
    Filter,
    HelpCircle,
    Layers,
    MapPin,
    Plus,
    RotateCcw,
    Search,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    Upload,
    Wheat,
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
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

export interface FsvaAdminRecord {
    id: number;
    tahun: number;
    kecamatan: string;
    desa: string;
    ncpr: number | null;
    energy: number | null;
    protein: number | null;
    food_reserves: number | null;
    poverty: number | null;
    price_cv: number | null;
    pou: number | null;
    female_school: number | null;
    no_water: number | null;
    pph: number | null;
    stunting: number | null;
    ikp: number | null;
    rank: number | null;
    komposit: number;
    keterangan?: string | null;
    creator?: { id: number; name: string } | null;
    created_at?: string;
    updated_at?: string;
}

interface PageProps {
    records: FsvaAdminRecord[];
    statistics: {
        total_desa: number;
        target_total: number;
        count_rentan: number;
        count_aman: number;
        avg_ikp: number;
        priority_breakdown: Record<number, number>;
    };
    availableYears: number[];
    kecamatanList: string[];
    villageData: Record<string, string[]>;
    indicators: Record<string, { label: string; short: string; unit: string; description: string }>;
    priorities: Record<
        number,
        { label: string; short: string; color: string; bg_class: string; category: string; desc: string }
    >;
    filters: {
        year: number;
        search: string;
        kecamatan: string;
        komposit: number | null;
    };
}

export default function FsvaAdminIndex({
    records,
    statistics,
    availableYears,
    kecamatanList,
    villageData,
    indicators,
    priorities,
    filters,
}: PageProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedKecFilter, setSelectedKecFilter] = useState(filters.kecamatan || 'ALL');
    const [selectedKompositFilter, setSelectedKompositFilter] = useState<string>(
        filters.komposit ? String(filters.komposit) : 'ALL'
    );
    const [selectedYear, setSelectedYear] = useState<number>(filters.year);

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Selected item for Edit / Delete
    const [selectedItem, setSelectedItem] = useState<FsvaAdminRecord | null>(null);

    // Form fields for Create / Edit
    const [formTahun, setFormTahun] = useState<string>(String(filters.year));
    const [formKecamatan, setFormKecamatan] = useState<string>(kecamatanList[0] || 'HAURGEULIS');
    const [formDesa, setFormDesa] = useState<string>('');
    const [formKomposit, setFormKomposit] = useState<string>('4');
    const [formIkp, setFormIkp] = useState<string>('');
    const [formRank, setFormRank] = useState<string>('');
    const [formNcpr, setFormNcpr] = useState<string>('');
    const [formEnergy, setFormEnergy] = useState<string>('');
    const [formProtein, setFormProtein] = useState<string>('');
    const [formFoodReserves, setFormFoodReserves] = useState<string>('');
    const [formPoverty, setFormPoverty] = useState<string>('');
    const [formPriceCv, setFormPriceCv] = useState<string>('');
    const [formPou, setFormPou] = useState<string>('');
    const [formFemaleSchool, setFormFemaleSchool] = useState<string>('');
    const [formNoWater, setFormNoWater] = useState<string>('');
    const [formPph, setFormPph] = useState<string>('');
    const [formStunting, setFormStunting] = useState<string>('');
    const [formKeterangan, setFormKeterangan] = useState<string>('');

    // Import file state
    const [importFile, setImportFile] = useState<File | null>(null);

    // Copy-Paste state
    const [pasteRawText, setPasteRawText] = useState<string>('');
    const [parsedPasteRows, setParsedPasteRows] = useState<any[]>([]);

    // Breadcrumbs
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Pemantauan Pangan', href: '#' },
        { title: 'FSVA (Ketahanan Desa)', href: '/fsva-admin' },
    ];

    // Filter villages for form dropdown
    const availableDesas = useMemo(() => {
        return villageData[formKecamatan] || [];
    }, [formKecamatan, villageData]);

    // Handle Year/Search/Filter URL changes
    const applyFilter = (key: string, value: any) => {
        const nextFilters: any = {
            year: selectedYear,
            search: searchTerm,
            kecamatan: selectedKecFilter === 'ALL' ? '' : selectedKecFilter,
            komposit: selectedKompositFilter === 'ALL' ? '' : selectedKompositFilter,
            [key]: value === 'ALL' ? '' : value,
        };

        router.get('/fsva-admin', nextFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Open Create Modal
    const openCreateModal = () => {
        setFormTahun(String(selectedYear));
        const defaultKec = kecamatanList[0] || 'HAURGEULIS';
        setFormKecamatan(defaultKec);
        setFormDesa((villageData[defaultKec] && villageData[defaultKec][0]) || '');
        setFormKomposit('4');
        setFormIkp('');
        setFormRank('');
        setFormNcpr('');
        setFormEnergy('');
        setFormProtein('');
        setFormFoodReserves('');
        setFormPoverty('');
        setFormPriceCv('');
        setFormPou('');
        setFormFemaleSchool('');
        setFormNoWater('');
        setFormPph('');
        setFormStunting('');
        setFormKeterangan('');
        setIsCreateModalOpen(true);
    };

    // Open Edit Modal
    const openEditModal = (item: FsvaAdminRecord) => {
        setSelectedItem(item);
        setFormTahun(String(item.tahun));
        setFormKecamatan(item.kecamatan);
        setFormDesa(item.desa);
        setFormKomposit(String(item.komposit));
        setFormIkp(item.ikp !== null ? String(item.ikp) : '');
        setFormRank(item.rank !== null ? String(item.rank) : '');
        setFormNcpr(item.ncpr !== null ? String(item.ncpr) : '');
        setFormEnergy(item.energy !== null ? String(item.energy) : '');
        setFormProtein(item.protein !== null ? String(item.protein) : '');
        setFormFoodReserves(item.food_reserves !== null ? String(item.food_reserves) : '');
        setFormPoverty(item.poverty !== null ? String(item.poverty) : '');
        setFormPriceCv(item.price_cv !== null ? String(item.price_cv) : '');
        setFormPou(item.pou !== null ? String(item.pou) : '');
        setFormFemaleSchool(item.female_school !== null ? String(item.female_school) : '');
        setFormNoWater(item.no_water !== null ? String(item.no_water) : '');
        setFormPph(item.pph !== null ? String(item.pph) : '');
        setFormStunting(item.stunting !== null ? String(item.stunting) : '');
        setFormKeterangan(item.keterangan || '');
        setIsEditModalOpen(true);
    };

    // Open Delete Modal
    const openDeleteModal = (item: FsvaAdminRecord) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    // Submit Create
    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            '/fsva-admin',
            {
                tahun: parseInt(formTahun, 10),
                kecamatan: formKecamatan,
                desa: formDesa,
                komposit: parseInt(formKomposit, 10),
                ikp: formIkp ? parseFloat(formIkp) : null,
                rank: formRank ? parseInt(formRank, 10) : null,
                ncpr: formNcpr ? parseFloat(formNcpr) : null,
                energy: formEnergy ? parseFloat(formEnergy) : null,
                protein: formProtein ? parseFloat(formProtein) : null,
                food_reserves: formFoodReserves ? parseFloat(formFoodReserves) : null,
                poverty: formPoverty ? parseFloat(formPoverty) : null,
                price_cv: formPriceCv ? parseFloat(formPriceCv) : null,
                pou: formPou ? parseFloat(formPou) : null,
                female_school: formFemaleSchool ? parseFloat(formFemaleSchool) : null,
                no_water: formNoWater ? parseFloat(formNoWater) : null,
                pph: formPph ? parseFloat(formPph) : null,
                stunting: formStunting ? parseFloat(formStunting) : null,
                keterangan: formKeterangan,
            },
            {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    toast.success('Data FSVA berhasil ditambahkan');
                },
                onError: (err) => {
                    const first = Object.values(err)[0];
                    toast.error(typeof first === 'string' ? first : 'Gagal menyimpan data FSVA');
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    // Submit Edit
    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;
        setIsSubmitting(true);

        router.put(
            `/fsva-admin/${selectedItem.id}`,
            {
                komposit: parseInt(formKomposit, 10),
                ikp: formIkp ? parseFloat(formIkp) : null,
                rank: formRank ? parseInt(formRank, 10) : null,
                ncpr: formNcpr ? parseFloat(formNcpr) : null,
                energy: formEnergy ? parseFloat(formEnergy) : null,
                protein: formProtein ? parseFloat(formProtein) : null,
                food_reserves: formFoodReserves ? parseFloat(formFoodReserves) : null,
                poverty: formPoverty ? parseFloat(formPoverty) : null,
                price_cv: formPriceCv ? parseFloat(formPriceCv) : null,
                pou: formPou ? parseFloat(formPou) : null,
                female_school: formFemaleSchool ? parseFloat(formFemaleSchool) : null,
                no_water: formNoWater ? parseFloat(formNoWater) : null,
                pph: formPph ? parseFloat(formPph) : null,
                stunting: formStunting ? parseFloat(formStunting) : null,
                keterangan: formKeterangan,
            },
            {
                onSuccess: () => {
                    setIsEditModalOpen(false);
                    toast.success('Data FSVA berhasil diperbarui');
                },
                onError: (err) => {
                    const first = Object.values(err)[0];
                    toast.error(typeof first === 'string' ? first : 'Gagal memperbarui data FSVA');
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    // Submit Delete
    const handleDeleteSubmit = () => {
        if (!selectedItem) return;
        setIsSubmitting(true);

        router.delete(`/fsva-admin/${selectedItem.id}`, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.success('Data FSVA berhasil dihapus');
            },
            onError: () => toast.error('Gagal menghapus data FSVA'),
            onFinish: () => setIsSubmitting(false),
        });
    };

    // Submit Import Excel
    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) {
            toast.error('Pilih berkas Excel terlebih dahulu');
            return;
        }

        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('year', String(selectedYear));

        setIsSubmitting(true);
        router.post('/fsva-admin/import', formData, {
            forceFormData: true,
            onSuccess: () => {
                setIsImportModalOpen(false);
                setImportFile(null);
                toast.success('Impor data FSVA berhasil');
            },
            onError: (err) => {
                const first = Object.values(err)[0];
                toast.error(typeof first === 'string' ? first : 'Gagal mengimpor berkas Excel');
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    // Parse pasted table text (handles tab \t or comma , or semicolon ;)
    const handlePasteChange = (text: string) => {
        setPasteRawText(text);
        if (!text.trim()) {
            setParsedPasteRows([]);
            return;
        }

        const lines = text.trim().split(/\r?\n/);
        const rows: any[] = [];

        // Lookup maps for fast matching
        const cleanStr = (s: string) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const kecMap = new Map<string, string>();
        for (const k of kecamatanList) {
            kecMap.set(cleanStr(k), k);
        }

        const parseNum = (val: string) => {
            if (!val) return 0;
            const clean = val.replace(/%/g, '').trim().replace(',', '.');
            return isNaN(Number(clean)) ? 0 : Number(clean);
        };

        for (const line of lines) {
            if (!line.trim()) continue;
            // Split by tab, semicolon, or comma
            const delimiter = line.includes('\t') ? '\t' : (line.includes(';') ? ';' : ',');
            const cells = line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));

            // Check if header line
            const lower = line.toLowerCase();
            if (lower.includes('kecamatan') && lower.includes('desa')) {
                continue;
            }

            if (cells.length < 3) continue;

            // Find kecamatan & desa
            let foundKec: string | null = null;
            let foundDesa: string | null = null;
            let kecIdx = -1;
            let desaIdx = -1;

            // Match kecamatan
            cells.forEach((cell, idx) => {
                const c = cleanStr(cell);
                if (kecMap.has(c)) {
                    foundKec = kecMap.get(c)!;
                    kecIdx = idx;
                }
            });

            // Match desa
            if (foundKec) {
                const desas = villageData[foundKec] || [];
                cells.forEach((cell, idx) => {
                    if (idx === kecIdx) return;
                    const c = cleanStr(cell);
                    const match = desas.find((d) => cleanStr(d) === c);
                    if (match) {
                        foundDesa = match;
                        desaIdx = idx;
                    }
                });
            }

            // Fallback: take column 2 as kec, column 3 as desa if standard format
            if (!foundDesa && cells.length >= 4) {
                foundKec = cells[2]?.toUpperCase();
                foundDesa = cells[3]?.toUpperCase();
                kecIdx = 2;
                desaIdx = 3;
            } else if (!foundDesa && cells.length >= 2) {
                foundKec = cells[0]?.toUpperCase();
                foundDesa = cells[1]?.toUpperCase();
                kecIdx = 0;
                desaIdx = 1;
            }

            if (!foundKec || !foundDesa) continue;

            // If standard template layout (19 cols)
            let ncpr = 0, energy = 0, protein = 0, foodRes = 0, poverty = 0, priceCv = 0;
            let pou = 0, femaleSchool = 0, noWater = 0, pph = 0, stunting = 0, ikp = 0;
            let rank: number | null = null;
            let komposit = 1;

            if (cells.length >= 17 && kecIdx <= 3) {
                ncpr = parseNum(cells[4]);
                energy = parseNum(cells[5]);
                protein = parseNum(cells[6]);
                foodRes = parseNum(cells[7]);
                poverty = parseNum(cells[8]);
                priceCv = parseNum(cells[9]);
                pou = parseNum(cells[10]);
                femaleSchool = parseNum(cells[11]);
                noWater = parseNum(cells[12]);
                pph = parseNum(cells[13]);
                stunting = parseNum(cells[14]);
                ikp = parseNum(cells[15]);
                rank = cells[16] ? Number(cells[16]) : null;
                komposit = cells[17] ? Math.max(1, Math.min(6, Number(cells[17]))) : 1;
            } else {
                // Collect remaining numbers
                const nums: number[] = [];
                cells.forEach((c, idx) => {
                    if (idx !== kecIdx && idx !== desaIdx) {
                        const n = parseNum(c);
                        if (!isNaN(n)) nums.push(n);
                    }
                });
                ncpr = nums[0] ?? 0;
                energy = nums[1] ?? 0;
                protein = nums[2] ?? 0;
                foodRes = nums[3] ?? 0;
                poverty = nums[4] ?? 0;
                priceCv = nums[5] ?? 0;
                pou = nums[6] ?? 0;
                femaleSchool = nums[7] ?? 0;
                noWater = nums[8] ?? 0;
                pph = nums[9] ?? 0;
                stunting = nums[10] ?? 0;
                ikp = nums[11] ?? 0;
                rank = nums[12] ? Math.round(nums[12]) : null;
                komposit = nums[13] ? Math.max(1, Math.min(6, Math.round(nums[13]))) : 1;
            }

            rows.push({
                kecamatan: foundKec,
                desa: foundDesa,
                komposit,
                ikp,
                rank,
                ncpr,
                energy,
                protein,
                food_reserves: foodRes,
                poverty,
                price_cv: priceCv,
                pou,
                female_school: femaleSchool,
                no_water: noWater,
                pph,
                stunting,
            });
        }

        setParsedPasteRows(rows);
    };

    // Submit Copy-Paste
    const handlePasteSubmit = () => {
        if (parsedPasteRows.length === 0) {
            toast.error('Tidak ada data yang valid untuk disimpan.');
            return;
        }

        setIsSubmitting(true);
        router.post(
            '/fsva-admin/bulk',
            {
                year: selectedYear,
                items: parsedPasteRows,
            },
            {
                onSuccess: () => {
                    setIsPasteModalOpen(false);
                    setPasteRawText('');
                    setParsedPasteRows([]);
                    toast.success(`Berhasil menyimpan ${parsedPasteRows.length} data desa dari copy-paste.`);
                },
                onError: (err) => {
                    const first = Object.values(err)[0];
                    toast.error(typeof first === 'string' ? first : 'Gagal menyimpan data bulk copy-paste.');
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <Head title="Kelola FSVA (Food Security and Vulnerability Atlas)" />

            {/* Header Section */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-[#006565] dark:bg-emerald-950/50 dark:text-emerald-400">
                            <Compass className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                                Kelola Data FSVA (Peta Ketahanan Desa)
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                                Manajemen 13 Indikator &amp; Prioritas Komposit FSVA 317 Desa/Kelurahan se-Kabupaten Indramayu
                            </p>
                        </div>
                    </div>
                </div>

                {/* Top Action Buttons Island */}
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/fsva"
                        target="_blank"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:border-[#006565] hover:text-[#006565] transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                        <ExternalLink className="h-4 w-4" />
                        <span>Portal Publik</span>
                    </Link>

                    <a
                        href={`/fsva-admin/template?year=${selectedYear}&format=xlsx`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        title="Unduh Template Excel"
                    >
                        <Download className="h-4 w-4 text-emerald-600" />
                        <span>Template</span>
                    </a>

                    <a
                        href={`/fsva-admin/export?year=${selectedYear}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        title="Ekspor Data Excel"
                    >
                        <FileSpreadsheet className="h-4 w-4 text-teal-600" />
                        <span>Ekspor</span>
                    </a>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsImportModalOpen(true)}
                        className="gap-1.5 rounded-xl text-xs font-bold cursor-pointer"
                    >
                        <Upload className="h-4 w-4 text-cyan-600" />
                        <span>Import Excel</span>
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsPasteModalOpen(true)}
                        className="gap-1.5 rounded-xl text-xs font-bold cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800"
                    >
                        <ClipboardPaste className="h-4 w-4 text-amber-600" />
                        <span>Copy-Paste Excel</span>
                    </Button>

                    <Button
                        onClick={openCreateModal}
                        className="gap-2 rounded-xl bg-gradient-to-r from-[#006565] to-emerald-700 text-xs font-bold text-white shadow-md shadow-[#006565]/20 hover:shadow-lg hover:shadow-[#006565]/30 cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        <span>+ Tambah Data FSVA</span>
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase">
                            Total Desa Terdata
                        </CardTitle>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-[#006565] dark:bg-emerald-950/60 dark:text-emerald-400">
                            <MapPin className="h-4 w-4" />
                        </span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">
                            {statistics.total_desa} / {statistics.target_total}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                            {Math.round((statistics.total_desa / statistics.target_total) * 100)}% Kelengkapan Desa ({selectedYear})
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-emerald-600 uppercase">
                            Desa Tahan / Aman
                        </CardTitle>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <ShieldCheck className="h-4 w-4" />
                        </span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                            {statistics.count_aman} Desa
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                            Prioritas 4, 5, dan 6 ({statistics.total_desa > 0 ? Math.round((statistics.count_aman / statistics.total_desa) * 100) : 0}%)
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-rose-600 uppercase">
                            Desa Rentan
                        </CardTitle>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                            <ShieldAlert className="h-4 w-4" />
                        </span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-rose-700 dark:text-rose-400">
                            {statistics.count_rentan} Desa
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                            Prioritas 1, 2, dan 3 ({statistics.total_desa > 0 ? Math.round((statistics.count_rentan / statistics.total_desa) * 100) : 0}%)
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase">
                            Rata-Rata IKP
                        </CardTitle>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-[#006565] dark:bg-teal-950/60 dark:text-teal-400">
                            <Activity className="h-4 w-4" />
                        </span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-[#006565] dark:text-emerald-400">
                            {statistics.avg_ikp}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                            Skor Indeks Ketahanan Pangan Desa
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Toolbar */}
            <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Year Selector */}
                            <div className="flex items-center gap-1.5">
                                <Label className="text-xs font-bold text-slate-500">Tahun:</Label>
                                <Select
                                    value={String(selectedYear)}
                                    onValueChange={(val) => {
                                        setSelectedYear(Number(val));
                                        applyFilter('year', val);
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-24 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableYears.map((y) => (
                                            <SelectItem key={y} value={String(y)} className="text-xs font-bold">
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Kecamatan Filter */}
                            <div className="flex items-center gap-1.5">
                                <Label className="text-xs font-bold text-slate-500">Kecamatan:</Label>
                                <Select
                                    value={selectedKecFilter}
                                    onValueChange={(val) => {
                                        setSelectedKecFilter(val);
                                        applyFilter('kecamatan', val);
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-40 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800">
                                        <SelectValue placeholder="Semua Kecamatan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Kecamatan</SelectItem>
                                        {kecamatanList.map((k) => (
                                            <SelectItem key={k} value={k} className="text-xs">
                                                {k}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Priority Filter */}
                            <div className="flex items-center gap-1.5">
                                <Label className="text-xs font-bold text-slate-500">Prioritas:</Label>
                                <Select
                                    value={selectedKompositFilter}
                                    onValueChange={(val) => {
                                        setSelectedKompositFilter(val);
                                        applyFilter('komposit', val);
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-36 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800">
                                        <SelectValue placeholder="Semua Prioritas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Prioritas</SelectItem>
                                        {[1, 2, 3, 4, 5, 6].map((p) => (
                                            <SelectItem key={p} value={String(p)} className="text-xs">
                                                Prioritas {p} ({priorities[p]?.short})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="Cari desa / kecamatan..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    applyFilter('search', e.target.value);
                                }}
                                className="h-8 w-56 sm:w-64 rounded-xl text-xs pl-8 bg-slate-50 dark:bg-slate-800"
                            />
                            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Data Table */}
            <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                            Data FSVA ({records.length} Desa Ditemukan)
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px]">
                            Tahun {selectedYear}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700">
                                <tr>
                                    <th className="px-3 py-3 w-12 text-center">Rank</th>
                                    <th className="px-3 py-3">Desa</th>
                                    <th className="px-3 py-3">Kecamatan</th>
                                    <th className="px-3 py-3">Komposit (1-6)</th>
                                    <th className="px-3 py-3 text-right">IKP</th>
                                    <th className="px-3 py-3 text-right">NCPR</th>
                                    <th className="px-3 py-3 text-right">Energi</th>
                                    <th className="px-3 py-3 text-right">Protein</th>
                                    <th className="px-3 py-3 text-right">Cadangan</th>
                                    <th className="px-3 py-3 text-right">Kemiskinan</th>
                                    <th className="px-3 py-3 text-right">Stunting</th>
                                    <th className="px-3 py-3 text-right">Tanpa Air</th>
                                    <th className="px-3 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {records.length === 0 ? (
                                    <tr>
                                        <td colSpan={13} className="px-4 py-8 text-center text-slate-500">
                                            Tidak ada data FSVA yang sesuai. Klik "+ Tambah Data FSVA" atau "Import Excel".
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((r, idx) => {
                                        const pInfo = priorities[r.komposit] || priorities[1];
                                        return (
                                            <tr
                                                key={r.id}
                                                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                                            >
                                                <td className="px-3 py-2 text-center font-bold text-slate-400">
                                                    #{r.rank ?? idx + 1}
                                                </td>
                                                <td className="px-3 py-2 font-black text-slate-900 dark:text-white">
                                                    {r.desa}
                                                </td>
                                                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                                    {r.kecamatan}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span
                                                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-black"
                                                        style={{
                                                            backgroundColor: `${pInfo.color}15`,
                                                            color: pInfo.color,
                                                            border: `1px solid ${pInfo.color}40`,
                                                        }}
                                                    >
                                                        <span
                                                            className="h-1.5 w-1.5 rounded-full"
                                                            style={{ backgroundColor: pInfo.color }}
                                                        />
                                                        <span>P{r.komposit} - {pInfo.short}</span>
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right font-black text-[#006565] dark:text-emerald-400">
                                                    {r.ikp ?? '-'}
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                                                    {r.ncpr ?? '-'}
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                                                    {r.energy ? `${r.energy}` : '-'}
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                                                    {r.protein ? `${r.protein}` : '-'}
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                                                    {r.food_reserves ? `${r.food_reserves}` : '-'}
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                                                    {r.poverty ?? '-'}
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                                                    {r.stunting ?? '-'}
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                                                    {r.no_water ?? '-'}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditModal(r)}
                                                            className="h-7 w-7 p-0 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800"
                                                            title="Edit"
                                                        >
                                                            <Edit3 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openDeleteModal(r)}
                                                            className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* MODAL 1: Create Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                            Tambah Data FSVA Desa
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Lengkapi seluruh 13 indikator dan tingkat prioritas komposit FSVA
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
                        {/* Row 1: Tahun, Kecamatan, Desa */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Tahun *</Label>
                                <Input
                                    type="number"
                                    value={formTahun}
                                    onChange={(e) => setFormTahun(e.target.value)}
                                    required
                                    className="h-9 rounded-xl text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Kecamatan *</Label>
                                <Select
                                    value={formKecamatan}
                                    onValueChange={(val) => {
                                        setFormKecamatan(val);
                                        const desas = villageData[val] || [];
                                        if (desas.length > 0) setFormDesa(desas[0]);
                                    }}
                                >
                                    <SelectTrigger className="h-9 rounded-xl text-xs font-semibold">
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

                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Desa / Kelurahan *</Label>
                                <Select value={formDesa} onValueChange={setFormDesa}>
                                    <SelectTrigger className="h-9 rounded-xl text-xs font-semibold">
                                        <SelectValue placeholder="Pilih Desa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableDesas.map((d) => (
                                            <SelectItem key={d} value={d} className="text-xs font-semibold">
                                                {d}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Row 2: Komposit, IKP, Rank */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Komposit (Prioritas 1-6) *</Label>
                                <Select value={formKomposit} onValueChange={setFormKomposit}>
                                    <SelectTrigger className="h-9 rounded-xl text-xs font-semibold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5, 6].map((p) => (
                                            <SelectItem key={p} value={String(p)} className="text-xs">
                                                Prioritas {p} ({priorities[p]?.short})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Nilai IKP (0-100)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="contoh: 82.50"
                                    value={formIkp}
                                    onChange={(e) => setFormIkp(e.target.value)}
                                    className="h-9 rounded-xl text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Rank / Peringkat (1-317)</Label>
                                <Input
                                    type="number"
                                    placeholder="contoh: 1"
                                    value={formRank}
                                    onChange={(e) => setFormRank(e.target.value)}
                                    className="h-9 rounded-xl text-xs"
                                />
                            </div>
                        </div>

                        {/* Indikator Input Grid */}
                        <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50 space-y-3">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                                Rincian 12 Indikator Teknis FSVA
                            </span>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                                <div>
                                    <Label className="text-[11px] font-semibold">NCPR</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="contoh: 1.25"
                                        value={formNcpr}
                                        onChange={(e) => setFormNcpr(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">Energi (kkal)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="contoh: 2150"
                                        value={formEnergy}
                                        onChange={(e) => setFormEnergy(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">Protein (g)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="contoh: 68.5"
                                        value={formProtein}
                                        onChange={(e) => setFormProtein(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">Cadangan Pangan</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max="6"
                                        placeholder="1-6"
                                        value={formFoodReserves}
                                        onChange={(e) => setFormFoodReserves(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">Kemiskinan</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max="6"
                                        placeholder="1-6"
                                        value={formPoverty}
                                        onChange={(e) => setFormPoverty(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">Price CV</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max="6"
                                        placeholder="1-6"
                                        value={formPriceCv}
                                        onChange={(e) => setFormPriceCv(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">PoU</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max="6"
                                        placeholder="1-6"
                                        value={formPou}
                                        onChange={(e) => setFormPou(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">Sekolah Perempuan</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max="6"
                                        placeholder="1-6"
                                        value={formFemaleSchool}
                                        onChange={(e) => setFormFemaleSchool(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">Tanpa Air</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max="6"
                                        placeholder="1-6"
                                        value={formNoWater}
                                        onChange={(e) => setFormNoWater(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">PPH</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max="6"
                                        placeholder="1-6"
                                        value={formPph}
                                        onChange={(e) => setFormPph(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">Stunting</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max="6"
                                        placeholder="1-6"
                                        value={formStunting}
                                        onChange={(e) => setFormStunting(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Keterangan */}
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Keterangan / Catatan Tambahan</Label>
                            <Textarea
                                placeholder="Catatan situasi ketahanan pangan desa..."
                                value={formKeterangan}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormKeterangan(e.target.value)}
                                rows={2}
                                className="rounded-xl text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-2">
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
                                className="rounded-xl bg-[#006565] text-white hover:bg-[#005555]"
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Data FSVA'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 2: Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                            Edit Data FSVA Desa {selectedItem?.desa} ({selectedItem?.kecamatan})
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Perbarui indikator dan prioritas komposit tahun {selectedItem?.tahun}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
                        {/* Readonly info header */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                            <div className="text-xs">
                                <span className="text-slate-400">Wilayah:</span>{' '}
                                <b className="text-slate-900 dark:text-white">{selectedItem?.desa}</b>, Kec. {selectedItem?.kecamatan}
                            </div>
                            <div className="text-xs ml-auto">
                                <span className="text-slate-400">Tahun:</span>{' '}
                                <b className="text-[#006565] dark:text-emerald-400">{selectedItem?.tahun}</b>
                            </div>
                        </div>

                        {/* Komposit, IKP, Rank */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Komposit (Prioritas 1-6) *</Label>
                                <Select value={formKomposit} onValueChange={setFormKomposit}>
                                    <SelectTrigger className="h-9 rounded-xl text-xs font-semibold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5, 6].map((p) => (
                                            <SelectItem key={p} value={String(p)} className="text-xs">
                                                Prioritas {p} ({priorities[p]?.short})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Nilai IKP (0-100)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formIkp}
                                    onChange={(e) => setFormIkp(e.target.value)}
                                    className="h-9 rounded-xl text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Rank / Peringkat (1-317)</Label>
                                <Input
                                    type="number"
                                    value={formRank}
                                    onChange={(e) => setFormRank(e.target.value)}
                                    className="h-9 rounded-xl text-xs"
                                />
                            </div>
                        </div>

                        {/* Indikator Input Grid */}
                        <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50 space-y-3">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                                Rincian 12 Indikator Teknis FSVA
                            </span>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                                <div>
                                    <Label className="text-[11px] font-semibold">NCPR</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formNcpr}
                                        onChange={(e) => setFormNcpr(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">Energi (kkal)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={formEnergy}
                                        onChange={(e) => setFormEnergy(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">Protein (g)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={formProtein}
                                        onChange={(e) => setFormProtein(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">Cadangan Pangan</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max="6"
                                        value={formFoodReserves}
                                        onChange={(e) => setFormFoodReserves(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">Kemiskinan</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max="6"
                                        value={formPoverty}
                                        onChange={(e) => setFormPoverty(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">Price CV</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max="6"
                                        value={formPriceCv}
                                        onChange={(e) => setFormPriceCv(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">PoU</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max="6"
                                        value={formPou}
                                        onChange={(e) => setFormPou(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">Sekolah Perempuan</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max="6"
                                        value={formFemaleSchool}
                                        onChange={(e) => setFormFemaleSchool(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">Tanpa Air</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max="6"
                                        value={formNoWater}
                                        onChange={(e) => setFormNoWater(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">PPH</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max="6"
                                        value={formPph}
                                        onChange={(e) => setFormPph(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] font-semibold">Stunting</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max="6"
                                        value={formStunting}
                                        onChange={(e) => setFormStunting(e.target.value)}
                                        className="h-8 rounded-lg text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Keterangan */}
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Keterangan / Catatan Tambahan</Label>
                            <Textarea
                                value={formKeterangan}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormKeterangan(e.target.value)}
                                rows={2}
                                className="rounded-xl text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-2">
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
                                className="rounded-xl bg-[#006565] text-white hover:bg-[#005555]"
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Perbarui Data FSVA'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 3: Delete Confirmation */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black text-rose-600 flex items-center gap-2">
                            <Trash2 className="h-4.5 w-4.5" />
                            <span>Hapus Data FSVA?</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Apakah Anda yakin ingin menghapus data FSVA untuk <b>Desa {selectedItem?.desa}</b> (Kec. {selectedItem?.kecamatan}) tahun {selectedItem?.tahun}? Tindakan ini tidak dapat dibatalkan.
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
                            variant="destructive"
                            onClick={handleDeleteSubmit}
                            disabled={isSubmitting}
                            className="rounded-xl bg-rose-600 hover:bg-rose-700"
                        >
                            {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Data'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL 4: Import Excel Modal */}
            <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Upload className="h-5 w-5 text-cyan-600" />
                            <span>Import Data FSVA dari Excel</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Unggah berkas Excel (.xlsx, .csv) yang berisi data indikator FSVA sesuai format template resmi
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleImportSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold">Tahun Target</Label>
                            <Select
                                value={String(selectedYear)}
                                onValueChange={(val) => setSelectedYear(Number(val))}
                            >
                                <SelectTrigger className="h-9 rounded-xl text-xs font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.map((y) => (
                                        <SelectItem key={y} value={String(y)} className="text-xs font-bold">
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold">Pilih Berkas Excel (.xlsx, .csv)</Label>
                            <Input
                                type="file"
                                accept=".xlsx,.csv,.xls,.tsv"
                                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                className="rounded-xl text-xs cursor-pointer"
                                required
                            />
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs text-slate-500 dark:bg-slate-800 dark:border-slate-700 space-y-1">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">
                                Petunjuk Impor:
                            </p>
                            <p>
                                Pastikan berkas memiliki kolom nama kecamatan dan desa yang sesuai dengan daftar 317 desa Kabupaten Indramayu.
                            </p>
                            <a
                                href={`/fsva-admin/template?year=${selectedYear}&format=xlsx`}
                                className="inline-flex items-center gap-1 text-[#006565] font-bold underline hover:text-emerald-700 dark:text-emerald-400"
                            >
                                <Download className="h-3 w-3" />
                                <span>Unduh Template Kosong (.xlsx)</span>
                            </a>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsImportModalOpen(false)}
                                className="rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={!importFile || isSubmitting}
                                className="rounded-xl bg-[#006565] text-white hover:bg-[#005555]"
                            >
                                {isSubmitting ? 'Mengimpor...' : 'Mulai Impor'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 5: Copy-Paste dari Excel Modal */}
            <Dialog open={isPasteModalOpen} onOpenChange={setIsPasteModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <ClipboardPaste className="h-5 w-5 text-amber-600" />
                            <span>Copy-Paste Data Langsung dari Excel</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Salin (Ctrl+C) baris data dari Microsoft Excel atau Google Spreadsheet, lalu tempelkan (Ctrl+V) pada kotak di bawah.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold">
                                    Kotak Tempel Data Excel (Tahun {selectedYear})
                                </Label>
                                <span className="text-[11px] font-bold text-slate-500">
                                    {parsedPasteRows.length} baris terdeteksi
                                </span>
                            </div>
                            <Textarea
                                rows={6}
                                placeholder="Tempelkan baris data di sini (misal: No, Tahun, Kecamatan, Desa, NCPR, Energi, Protein, ..., Komposit)..."
                                value={pasteRawText}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handlePasteChange(e.target.value)}
                                className="font-mono text-xs rounded-xl"
                            />
                        </div>

                        {/* Live Preview Table */}
                        {parsedPasteRows.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                                    Pratinjau Data yang Terdeteksi ({parsedPasteRows.length} Desa):
                                </span>
                                <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider dark:bg-slate-800">
                                            <tr>
                                                <th className="px-3 py-2">No</th>
                                                <th className="px-3 py-2">Desa</th>
                                                <th className="px-3 py-2">Kecamatan</th>
                                                <th className="px-3 py-2">Prioritas</th>
                                                <th className="px-3 py-2 text-right">IKP</th>
                                                <th className="px-3 py-2 text-right">NCPR</th>
                                                <th className="px-3 py-2 text-right">Energi</th>
                                                <th className="px-3 py-2 text-right">Kemiskinan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {parsedPasteRows.slice(0, 20).map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                    <td className="px-3 py-1.5 text-slate-400">{idx + 1}</td>
                                                    <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-white">
                                                        {row.desa}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300">
                                                        {row.kecamatan}
                                                    </td>
                                                    <td className="px-3 py-1.5">
                                                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                                            Prioritas {row.komposit}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right font-bold text-[#006565]">
                                                        {row.ikp}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right text-slate-600">
                                                        {row.ncpr}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right text-slate-600">
                                                        {row.energy}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right text-slate-600">
                                                        {row.poverty ?? '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {parsedPasteRows.length > 20 && (
                                    <p className="text-[10px] text-slate-400 text-right">
                                        ...dan {parsedPasteRows.length - 20} desa lainnya
                                    </p>
                                )}
                            </div>
                        )}

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsPasteModalOpen(false)}
                                className="rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                onClick={handlePasteSubmit}
                                disabled={parsedPasteRows.length === 0 || isSubmitting}
                                className="rounded-xl bg-[#006565] text-white hover:bg-[#005555]"
                            >
                                {isSubmitting
                                    ? 'Menyimpan...'
                                    : `Simpan ${parsedPasteRows.length} Data Desa`}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
