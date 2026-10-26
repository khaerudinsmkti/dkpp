import React, { useMemo, useRef, useState } from 'react';
import {
    Activity,
    CheckCircle2,
    Download,
    Eye,
    EyeOff,
    FileText,
    HelpCircle,
    Info,
    Maximize2,
    Minimize2,
    RotateCcw,
    ShieldAlert,
    ShieldCheck,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    INDRAMAYU_KECAMATAN_FEATURES,
    INDRAMAYU_MAINLAND_VIEWBOX,
    INDRAMAYU_MAP_VIEWBOX,
    type KecamatanMapFeature,
} from '@/data/indramayu-map';
import { generateSkpgPdfReport, generateSkpgPngReport } from '@/lib/skpg-pdf';

export interface SkpgKecamatanItem {
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
    current_indicator_status?: string;
}

interface SkpgMapProps {
    items: SkpgKecamatanItem[];
    selectedIndicator: string;
    indicatorLabel: string;
    selectedKecamatan: string | null;
    onSelectKecamatan: (name: string | null) => void;
    month?: number;
    year?: number;
}

export function getStatusColor(status: string | undefined): {
    fill: string;
    hoverFill: string;
    border: string;
    bgClass: string;
    textClass: string;
    badgeLabel: string;
} {
    switch (status) {
        case 'AWAS':
            return {
                fill: '#ef4444', // Red 500
                hoverFill: '#dc2626',
                border: '#991b1b',
                bgClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800',
                textClass: 'text-rose-600 dark:text-rose-400',
                badgeLabel: 'AWAS',
            };
        case 'SIAGA':
            return {
                fill: '#f97316', // Orange 500
                hoverFill: '#ea580c',
                border: '#c2410c',
                bgClass: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-800',
                textClass: 'text-orange-600 dark:text-orange-400',
                badgeLabel: 'SIAGA',
            };
        case 'RENTAN':
            return {
                fill: '#ef4444', // Rose/Red 500
                hoverFill: '#dc2626',
                border: '#991b1b',
                bgClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800',
                textClass: 'text-rose-600 dark:text-rose-400',
                badgeLabel: 'RENTAN',
            };
        case 'WASPADA':
            return {
                fill: '#f59e0b', // Amber 500
                hoverFill: '#d97706',
                border: '#92400e',
                bgClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
                textClass: 'text-amber-600 dark:text-amber-400',
                badgeLabel: 'WASPADA',
            };
        case 'AMAN':
        default:
            return {
                fill: '#10b981', // Emerald 500
                hoverFill: '#059669',
                border: '#065f46',
                bgClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
                textClass: 'text-emerald-600 dark:text-emerald-400',
                badgeLabel: 'AMAN',
            };
    }
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

export default function SkpgMap({
    items,
    selectedIndicator,
    indicatorLabel,
    selectedKecamatan,
    onSelectKecamatan,
    month,
    year,
}: SkpgMapProps) {
    const [hoveredKecamatan, setHoveredKecamatan] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
    const [showLabels, setShowLabels] = useState(true);
    const [viewMode, setViewMode] = useState<'mainland' | 'full'>('mainland');
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Map items dictionary by normalized name
    const itemMap = useMemo(() => {
        const map = new Map<string, SkpgKecamatanItem>();
        for (const item of items) {
            const key = item.kecamatan.toUpperCase();
            map.set(key, item);
            if (key === 'TRISI') {
                map.set('TERISI', item);
            } else if (key === 'TERISI') {
                map.set('TRISI', item);
            }
        }
        return map;
    }, [items]);

    // Active hovered item for floating tooltip
    const hoveredItem = useMemo(() => {
        if (!hoveredKecamatan) return null;
        return itemMap.get(hoveredKecamatan.toUpperCase()) || null;
    }, [hoveredKecamatan, itemMap]);

    // Active selected item details
    const selectedItem = useMemo(() => {
        if (!selectedKecamatan) return null;
        return itemMap.get(selectedKecamatan.toUpperCase()) || null;
    }, [selectedKecamatan, itemMap]);

    // Indicator category
    const isClimateIndicator = useMemo(() => {
        return ['potensi_kering', 'potensi_basah', 'kondisi_iklim'].includes(selectedIndicator);
    }, [selectedIndicator]);

    // Counts for legend
    const legendCounts = useMemo(() => {
        let aman = 0;
        let waspada = 0;
        let siaga = 0;
        let awas = 0;
        let rentan = 0;

        for (const item of items) {
            const val = (item[selectedIndicator as keyof SkpgKecamatanItem] as string) || item.ikb || 'AMAN';
            if (val === 'AWAS') awas++;
            else if (val === 'SIAGA') siaga++;
            else if (val === 'RENTAN') rentan++;
            else if (val === 'WASPADA') waspada++;
            else aman++;
        }

        return { aman, waspada, siaga, awas, rentan, total: items.length };
    }, [items, selectedIndicator]);

    // Base viewBox for map SVG (with padding to prevent clipping)
    const currentViewBox = viewMode === 'mainland' ? INDRAMAYU_MAINLAND_VIEWBOX : INDRAMAYU_MAP_VIEWBOX;

    const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 2.25));
    const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.75));
    const handleResetZoom = () => setZoomLevel(1);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!mapContainerRef.current) return;
        const rect = mapContainerRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    // Download Map Report as Official A4 Landscape PDF (matching Bapanas cartography format)
    const handleDownloadPdf = async () => {
        if (isExportingPdf) return;
        setIsExportingPdf(true);
        try {
            const effectiveMonth = month || items[0]?.month || new Date().getMonth() + 1;
            const effectiveYear = year || items[0]?.year || new Date().getFullYear();
            await generateSkpgPdfReport({
                items,
                selectedIndicator,
                indicatorLabel,
                month: effectiveMonth,
                year: effectiveYear,
            });
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            alert('Terjadi kesalahan saat memproses laporan PDF. Silakan coba kembali.');
        } finally {
            setIsExportingPdf(false);
        }
    };

    // Download Map as High-Resolution PNG Image (matching Official Bapanas PDF layout)
    const handleDownloadMapImage = async () => {
        if (isExporting) return;
        setIsExporting(true);

        try {
            const effectiveMonth = month || items[0]?.month || new Date().getMonth() + 1;
            const effectiveYear = year || items[0]?.year || new Date().getFullYear();
            await generateSkpgPngReport({
                items,
                selectedIndicator,
                indicatorLabel,
                month: effectiveMonth,
                year: effectiveYear,
            });
        } catch (err) {
            console.error('Failed to export map PNG:', err);
            alert('Gagal mengekspor gambar peta. Silakan coba kembali.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="relative flex flex-col rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 sm:p-6">
            {/* Map Header & Controls Bar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                            Peta Sebaran SKPG: {indicatorLabel}
                        </h3>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Arahkan kursor untuk melihat tooltip indikator lengkap, atau klik kecamatan untuk menyorot.
                    </p>
                </div>

                {/* Toolbar buttons */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {/* View Mode Toggle: Mainland vs Full */}
                    <div className="inline-flex rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800">
                        <button
                            type="button"
                            onClick={() => setViewMode('mainland')}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                                viewMode === 'mainland'
                                    ? 'bg-white text-[#006565] shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                            }`}
                        >
                            Fokus Daratan
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('full')}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                                viewMode === 'full'
                                    ? 'bg-white text-[#006565] shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                            }`}
                        >
                            Semua (Kepulauan)
                        </button>
                    </div>

                    {/* Toggle Labels */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowLabels(!showLabels)}
                        className="h-8 gap-1.5 rounded-xl text-xs font-semibold"
                        title={showLabels ? 'Sembunyikan label nama kecamatan' : 'Tampilkan label nama kecamatan'}
                    >
                        {showLabels ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">Label</span>
                    </Button>

                    {/* Zoom in / out / reset */}
                    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <button
                            type="button"
                            onClick={handleZoomIn}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                            title="Zoom In"
                        >
                            <ZoomIn className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={handleZoomOut}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                            title="Zoom Out"
                        >
                            <ZoomOut className="h-3.5 w-3.5" />
                        </button>
                        {zoomLevel !== 1 && (
                            <button
                                type="button"
                                onClick={handleResetZoom}
                                className="flex h-7 px-2 items-center justify-center rounded-lg text-[11px] font-bold text-[#006565] hover:bg-slate-100 dark:text-emerald-400 dark:hover:bg-slate-800"
                                title="Reset Zoom"
                            >
                                <RotateCcw className="h-3 w-3 mr-1" /> Reset
                            </button>
                        )}
                    </div>

                    {/* Download Map as PNG */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isExporting}
                        onClick={handleDownloadMapImage}
                        className="h-8 gap-1.5 rounded-xl border-emerald-300 bg-emerald-50/70 text-xs font-bold text-[#006565] hover:bg-emerald-100 hover:text-[#004e4e] dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 shadow-xs"
                        title="Download gambar peta dalam format PNG resolusi tinggi"
                    >
                        <Download className={`h-3.5 w-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
                        <span>{isExporting ? 'Memproses...' : 'Unduh Peta (PNG)'}</span>
                    </Button>

                    {/* Download Map as Official PDF (A4 Landscape) */}
                    <Button
                        id="btn-download-skpg-pdf"
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isExportingPdf}
                        onClick={handleDownloadPdf}
                        className="h-8 gap-1.5 rounded-xl border-rose-300 bg-rose-50/80 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 shadow-xs"
                        title="Download laporan peta resmi format PDF A4 Landscape standar Bapanas"
                    >
                        <FileText className={`h-3.5 w-3.5 ${isExportingPdf ? 'animate-spin' : 'text-rose-600 dark:text-rose-400'}`} />
                        <span>{isExportingPdf ? 'Membuat PDF...' : 'Unduh Peta (PDF)'}</span>
                    </Button>
                </div>
            </div>

            {/* SVG Map Container */}
            <div
                ref={mapContainerRef}
                onMouseMove={handleMouseMove}
                className="relative flex min-h-[360px] sm:min-h-[400px] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-sky-50/40 via-slate-50/50 to-emerald-50/30 p-2 sm:p-4 border border-slate-200/60 dark:from-slate-950/70 dark:via-slate-900/60 dark:to-slate-950/80 dark:border-slate-800/80"
            >
                {/* Compass & North Arrow Indicator */}
                <div className="absolute top-3 left-3 z-10 flex flex-col items-center rounded-xl bg-white/90 p-2 shadow-xs backdrop-blur-md border border-slate-200/80 dark:bg-slate-900/90 dark:border-slate-700">
                    <span className="text-[10px] font-black text-rose-500">U</span>
                    <div className="my-0.5 h-3.5 w-0.5 bg-rose-500" />
                    <span className="text-[9px] font-bold text-slate-400">N</span>
                </div>


                {/* DEDICATED MAP TOOLTIP ON HOVER */}
                {hoveredItem && mousePos && (
                    <div
                        className="pointer-events-none absolute z-30 w-72 rounded-2xl border border-slate-200/95 bg-white/95 p-3.5 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 animate-in fade-in zoom-in-95 duration-150 transition-transform"
                        style={{
                            left: Math.min(
                                Math.max(12, mousePos.x + 14),
                                (mapContainerRef.current?.clientWidth || 700) - 300
                            ),
                            top: Math.min(
                                Math.max(12, mousePos.y - 130),
                                (mapContainerRef.current?.clientHeight || 420) - 260
                            ),
                        }}
                    >
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                    Kecamatan Indramayu
                                </span>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                                    {hoveredItem.kecamatan}
                                </h4>
                                <span className="text-[10px] text-slate-500 font-medium">
                                    Kode BPS: {hoveredItem.kode_kecamatan}
                                </span>
                            </div>
                            <Badge
                                className={`rounded-lg px-2 py-0.5 text-[10px] font-black border shadow-xs ${
                                    getStatusColor(
                                        (hoveredItem[selectedIndicator as keyof SkpgKecamatanItem] as string) ||
                                            hoveredItem.ikb
                                    ).bgClass
                                }`}
                            >
                                {(hoveredItem[selectedIndicator as keyof SkpgKecamatanItem] as string) ||
                                    hoveredItem.ikb}
                            </Badge>
                        </div>

                        {/* All 7 Indicators in Tooltip */}
                        <div className="mt-2.5 grid grid-cols-2 gap-1 text-[11px]">
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1 dark:bg-slate-800/60">
                                <span className="text-slate-500 text-[10px]">Ketersediaan (IK):</span>
                                <span className={`font-black text-[10px] ${getStatusColor(hoveredItem.ik).textClass}`}>
                                    {hoveredItem.ik}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1 dark:bg-slate-800/60">
                                <span className="text-slate-500 text-[10px]">Keterjangkauan (IA):</span>
                                <span className={`font-black text-[10px] ${getStatusColor(hoveredItem.ia).textClass}`}>
                                    {hoveredItem.ia}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1 dark:bg-slate-800/60">
                                <span className="text-slate-500 text-[10px]">Pemanfaatan (IP):</span>
                                <span className={`font-black text-[10px] ${getStatusColor(hoveredItem.ip).textClass}`}>
                                    {hoveredItem.ip}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-emerald-50/80 px-2 py-1 border border-emerald-200/60 dark:bg-emerald-950/40 dark:border-emerald-800/50">
                                <span className="text-emerald-800 font-bold text-[10px] dark:text-emerald-300">
                                    Komposit (IKB):
                                </span>
                                <span className={`font-black text-[10px] ${getStatusColor(hoveredItem.ikb).textClass}`}>
                                    {hoveredItem.ikb}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1 dark:bg-slate-800/60">
                                <span className="text-slate-500 text-[10px]">Potensi Kering:</span>
                                <span
                                    className={`font-black text-[10px] ${
                                        getStatusColor(hoveredItem.potensi_kering).textClass
                                    }`}
                                >
                                    {hoveredItem.potensi_kering}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1 dark:bg-slate-800/60">
                                <span className="text-slate-500 text-[10px]">Potensi Basah:</span>
                                <span
                                    className={`font-black text-[10px] ${
                                        getStatusColor(hoveredItem.potensi_basah).textClass
                                    }`}
                                >
                                    {hoveredItem.potensi_basah}
                                </span>
                            </div>
                            <div className="col-span-2 flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1 dark:bg-slate-800/60">
                                <span className="text-slate-500 text-[10px]">Kondisi Iklim:</span>
                                <span
                                    className={`font-black text-[10px] ${
                                        getStatusColor(hoveredItem.kondisi_iklim).textClass
                                    }`}
                                >
                                    {hoveredItem.kondisi_iklim}
                                </span>
                            </div>
                        </div>

                        {hoveredItem.keterangan && (
                            <p className="mt-2 text-[10px] text-slate-500 italic line-clamp-2 border-t border-slate-100 pt-1.5 dark:border-slate-800">
                                "{hoveredItem.keterangan}"
                            </p>
                        )}
                    </div>
                )}

                {/* SVG Render (slightly reduced max-height & max-width so nothing is cut off) */}
                <div
                    className="w-full flex justify-center items-center transition-transform duration-300 ease-out"
                    style={{ transform: `scale(${zoomLevel})` }}
                >
                    <svg
                        ref={svgRef}
                        viewBox={currentViewBox}
                        className="h-auto max-h-[400px] w-full max-w-[650px] drop-shadow-sm select-none transition-all duration-300"
                        onMouseLeave={() => setHoveredKecamatan(null)}
                    >
                        <defs>
                            <filter id="map-glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.3" />
                            </filter>
                        </defs>

                        {/* Polygons for each of the 31 subdistricts */}
                        {INDRAMAYU_KECAMATAN_FEATURES.map((feature: KecamatanMapFeature) => {
                            const kecItem =
                                itemMap.get(feature.name.toUpperCase()) || itemMap.get(feature.rawName.toUpperCase());
                            const status =
                                (kecItem?.[selectedIndicator as keyof SkpgKecamatanItem] as string) ||
                                kecItem?.ikb ||
                                'AMAN';
                            const colors = getStatusColor(status);

                            const isSelected = selectedKecamatan?.toUpperCase() === feature.name.toUpperCase();
                            const isHovered = hoveredKecamatan?.toUpperCase() === feature.name.toUpperCase();

                            return (
                                <g
                                    key={feature.code}
                                    className="cursor-pointer transition-all duration-200"
                                    onClick={() => onSelectKecamatan(isSelected ? null : feature.name)}
                                    onMouseEnter={() => setHoveredKecamatan(feature.name)}
                                >
                                    <path
                                        d={feature.path}
                                        fill={isHovered ? colors.hoverFill : colors.fill}
                                        stroke={isSelected ? '#ffffff' : colors.border}
                                        strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.2}
                                        strokeLinejoin="round"
                                        strokeLinecap="round"
                                        className="transition-all duration-150"
                                        style={{
                                            filter: isSelected ? 'url(#map-glow)' : undefined,
                                            transformOrigin: `${feature.centroid[0]}px ${feature.centroid[1]}px`,
                                        }}
                                    />

                                    {/* Sub-district Name Label on Map */}
                                    {showLabels && (
                                        <text
                                            x={feature.centroid[0]}
                                            y={feature.centroid[1]}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            className="pointer-events-none fill-slate-900 font-extrabold transition-all"
                                            style={{
                                                fontSize: isSelected ? '13px' : '10px',
                                                paintOrder: 'stroke',
                                                stroke: '#ffffff',
                                                strokeWidth: isSelected ? '4px' : '3px',
                                                strokeLinejoin: 'round',
                                            }}
                                        >
                                            {feature.name}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            {/* DEDICATED MAP LEGEND SECTION */}
            <div className="mt-4 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                Legenda Peta SKPG
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-xs font-semibold text-slate-500">
                                Indikator Aktif: <strong className="text-slate-800 dark:text-white">{indicatorLabel}</strong>
                            </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                            Klasifikasi tingkat kerawanan pangan &amp; gizi berdasarkan standar Badan Pangan Nasional (Bapanas).
                        </p>
                    </div>

                    {/* Status Chips in Legend (4 for climate, 3 for food security) */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 shadow-xs border border-emerald-200 dark:bg-slate-900 dark:border-emerald-800">
                            <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-800" />
                            <div>
                                <span className="block text-xs font-black text-emerald-800 dark:text-emerald-300 leading-none">
                                    AMAN ({legendCounts.aman})
                                </span>
                                <span className="text-[10px] text-slate-400">Normal / Stabil</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 shadow-xs border border-amber-200 dark:bg-slate-900 dark:border-amber-800">
                            <span className="h-3.5 w-3.5 rounded-full bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-800" />
                            <div>
                                <span className="block text-xs font-black text-amber-800 dark:text-amber-300 leading-none">
                                    WASPADA ({legendCounts.waspada})
                                </span>
                                <span className="text-[10px] text-slate-400">Perlu Pemantauan</span>
                            </div>
                        </div>

                        {isClimateIndicator ? (
                            <>
                                <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 shadow-xs border border-orange-200 dark:bg-slate-900 dark:border-orange-800">
                                    <span className="h-3.5 w-3.5 rounded-full bg-orange-500 ring-2 ring-orange-200 dark:ring-orange-800" />
                                    <div>
                                        <span className="block text-xs font-black text-orange-800 dark:text-orange-300 leading-none">
                                            SIAGA ({legendCounts.siaga})
                                        </span>
                                        <span className="text-[10px] text-slate-400">Kesiapsiagaan Tinggi</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 shadow-xs border border-rose-200 dark:bg-slate-900 dark:border-rose-800">
                                    <span className="h-3.5 w-3.5 rounded-full bg-rose-500 ring-2 ring-rose-200 dark:ring-rose-800" />
                                    <div>
                                        <span className="block text-xs font-black text-rose-800 dark:text-rose-300 leading-none">
                                            AWAS ({legendCounts.awas})
                                        </span>
                                        <span className="text-[10px] text-slate-400">Kondisi Kritis / Darurat</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 shadow-xs border border-rose-200 dark:bg-slate-900 dark:border-rose-800">
                                <span className="h-3.5 w-3.5 rounded-full bg-rose-500 ring-2 ring-rose-200 dark:ring-rose-800" />
                                <div>
                                    <span className="block text-xs font-black text-rose-800 dark:text-rose-300 leading-none">
                                        RENTAN ({legendCounts.rentan})
                                    </span>
                                    <span className="text-[10px] text-slate-400">Prioritas Tindakan</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Selected Kecamatan Details Bar */}
            {selectedItem && (
                <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-200 rounded-2xl border border-emerald-500/40 bg-emerald-50/70 p-4 backdrop-blur-md dark:border-emerald-800 dark:bg-emerald-950/30">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#006565] text-white shadow-sm font-black">
                                {selectedItem.kecamatan.slice(0, 2)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                                        Kecamatan {selectedItem.kecamatan}
                                    </h4>
                                    <span className="text-xs font-semibold text-slate-500">
                                        (Kode BPS: {selectedItem.kode_kecamatan})
                                    </span>
                                    <Badge
                                        className={`rounded-lg px-2 py-0.5 text-[10px] font-black border ${
                                            getStatusColor(
                                                (selectedItem[selectedIndicator as keyof SkpgKecamatanItem] as string) ||
                                                    selectedItem.ikb
                                            ).bgClass
                                        }`}
                                    >
                                        Status {indicatorLabel}:{' '}
                                        {(selectedItem[selectedIndicator as keyof SkpgKecamatanItem] as string) ||
                                            selectedItem.ikb}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                    {selectedItem.keterangan || 'Terpantau dalam kondisi stabil dan aman.'}
                                </p>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onSelectKecamatan(null)}
                            className="rounded-xl text-xs font-bold"
                        >
                            Tutup Sorotan
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
