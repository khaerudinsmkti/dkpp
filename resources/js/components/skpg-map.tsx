import React, { useMemo, useState } from 'react';
import {
    Activity,
    CheckCircle2,
    Eye,
    EyeOff,
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
        case 'RENTAN':
            return {
                fill: '#ef4444', // Red / Rose 500
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

export default function SkpgMap({
    items,
    selectedIndicator,
    indicatorLabel,
    selectedKecamatan,
    onSelectKecamatan,
}: SkpgMapProps) {
    const [hoveredKecamatan, setHoveredKecamatan] = useState<string | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
    const [showLabels, setShowLabels] = useState(true);
    const [viewMode, setViewMode] = useState<'mainland' | 'full'>('mainland');
    const [zoomLevel, setZoomLevel] = useState<number>(1);

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

    // Active hovered or selected item details
    const activeItem = useMemo(() => {
        const target = hoveredKecamatan || selectedKecamatan;
        if (!target) return null;
        return itemMap.get(target.toUpperCase()) || null;
    }, [hoveredKecamatan, selectedKecamatan, itemMap]);

    // Counts for legend
    const legendCounts = useMemo(() => {
        let aman = 0;
        let waspada = 0;
        let rentan = 0;

        for (const item of items) {
            const val = (item[selectedIndicator as keyof SkpgKecamatanItem] as string) || item.ikb || 'AMAN';
            if (val === 'RENTAN') rentan++;
            else if (val === 'WASPADA') waspada++;
            else aman++;
        }

        return { aman, waspada, rentan, total: items.length };
    }, [items, selectedIndicator]);

    // Base viewBox for map SVG
    const currentViewBox = viewMode === 'mainland' ? INDRAMAYU_MAINLAND_VIEWBOX : INDRAMAYU_MAP_VIEWBOX;

    const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 2.5));
    const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.75));
    const handleResetZoom = () => setZoomLevel(1);

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
                        Arahkan kursor atau klik wilayah kecamatan untuk melihat detail peringatan dini.
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
                </div>
            </div>

            {/* SVG Map Container */}
            <div className="relative flex min-h-[460px] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-sky-50/50 via-slate-50/60 to-emerald-50/30 p-2 border border-slate-200/60 dark:from-slate-950/70 dark:via-slate-900/60 dark:to-slate-950/80 dark:border-slate-800/80">
                {/* Compass & North Arrow Indicator */}
                <div className="absolute top-3 left-3 z-10 flex flex-col items-center rounded-xl bg-white/85 p-2 shadow-sm backdrop-blur-md border border-slate-200/80 dark:bg-slate-900/80 dark:border-slate-700">
                    <span className="text-[10px] font-black text-rose-500">U</span>
                    <div className="my-0.5 h-4 w-0.5 bg-rose-500" />
                    <span className="text-[9px] font-bold text-slate-400">N</span>
                </div>

                {/* Floating Interactive Legend */}
                <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-2 rounded-2xl bg-white/90 p-2.5 shadow-md backdrop-blur-md border border-slate-200/80 dark:bg-slate-900/90 dark:border-slate-700">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 mr-1 dark:text-slate-400">
                        Status:
                    </span>
                    <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800">
                        <span className="h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-700" />
                        <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                            AMAN ({legendCounts.aman})
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800">
                        <span className="h-3 w-3 rounded-full bg-amber-500 ring-2 ring-amber-300 dark:ring-amber-700" />
                        <span className="text-xs font-black text-amber-800 dark:text-amber-300">
                            WASPADA ({legendCounts.waspada})
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-2 py-1 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800">
                        <span className="h-3 w-3 rounded-full bg-rose-500 ring-2 ring-rose-300 dark:ring-rose-700" />
                        <span className="text-xs font-black text-rose-800 dark:text-rose-300">
                            RENTAN ({legendCounts.rentan})
                        </span>
                    </div>
                </div>

                {/* SVG Render */}
                <div
                    className="w-full flex justify-center items-center transition-transform duration-300 ease-out"
                    style={{ transform: `scale(${zoomLevel})` }}
                >
                    <svg
                        viewBox={currentViewBox}
                        className="h-auto max-h-[640px] w-full max-w-[850px] drop-shadow-md select-none transition-all duration-300"
                        onMouseLeave={() => setHoveredKecamatan(null)}
                    >
                        <defs>
                            <filter id="map-glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.3" />
                            </filter>
                        </defs>

                        {/* Polygons for each of the 31 subdistricts */}
                        {INDRAMAYU_KECAMATAN_FEATURES.map((feature: KecamatanMapFeature) => {
                            const kecItem = itemMap.get(feature.name.toUpperCase()) || itemMap.get(feature.rawName.toUpperCase());
                            const status = (kecItem?.[selectedIndicator as keyof SkpgKecamatanItem] as string) || kecItem?.ikb || 'AMAN';
                            const colors = getStatusColor(status);

                            const isSelected = selectedKecamatan?.toUpperCase() === feature.name.toUpperCase();
                            const isHovered = hoveredKecamatan?.toUpperCase() === feature.name.toUpperCase();

                            return (
                                <g
                                    key={feature.code}
                                    className="cursor-pointer transition-all duration-200"
                                    onClick={() => onSelectKecamatan(isSelected ? null : feature.name)}
                                    onMouseEnter={(e) => {
                                        setHoveredKecamatan(feature.name);
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                                    }}
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
                                                fontSize: isSelected ? '14px' : '10.5px',
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

            {/* Selected or Hovered Kecamatan Quick Detail Card */}
            {activeItem && (
                <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-200 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-800/80">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#006565] text-white shadow-sm font-black">
                                {activeItem.kecamatan.slice(0, 2)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                                        Kecamatan {activeItem.kecamatan}
                                    </h4>
                                    <span className="text-xs font-semibold text-slate-500">
                                        (BPS: {activeItem.kode_kecamatan})
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                    {activeItem.keterangan || 'Terpantau dalam kondisi stabil dan aman.'}
                                </p>
                            </div>
                        </div>

                        {/* Status Pills Grid */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <div className="flex flex-col items-center rounded-xl bg-white px-2.5 py-1 shadow-xs border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Komposit (IKB)</span>
                                <span className={`text-xs font-black ${getStatusColor(activeItem.ikb).textClass}`}>
                                    {activeItem.ikb}
                                </span>
                            </div>
                            <div className="flex flex-col items-center rounded-xl bg-white px-2.5 py-1 shadow-xs border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Ketersediaan (IK)</span>
                                <span className={`text-xs font-black ${getStatusColor(activeItem.ik).textClass}`}>
                                    {activeItem.ik}
                                </span>
                            </div>
                            <div className="flex flex-col items-center rounded-xl bg-white px-2.5 py-1 shadow-xs border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Akses (IA)</span>
                                <span className={`text-xs font-black ${getStatusColor(activeItem.ia).textClass}`}>
                                    {activeItem.ia}
                                </span>
                            </div>
                            <div className="flex flex-col items-center rounded-xl bg-white px-2.5 py-1 shadow-xs border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Pemanfaatan (IP)</span>
                                <span className={`text-xs font-black ${getStatusColor(activeItem.ip).textClass}`}>
                                    {activeItem.ip}
                                </span>
                            </div>
                            <div className="flex flex-col items-center rounded-xl bg-white px-2.5 py-1 shadow-xs border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Kering</span>
                                <span className={`text-xs font-black ${getStatusColor(activeItem.potensi_kering).textClass}`}>
                                    {activeItem.potensi_kering}
                                </span>
                            </div>
                            <div className="flex flex-col items-center rounded-xl bg-white px-2.5 py-1 shadow-xs border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Basah</span>
                                <span className={`text-xs font-black ${getStatusColor(activeItem.potensi_basah).textClass}`}>
                                    {activeItem.potensi_basah}
                                </span>
                            </div>
                            <div className="flex flex-col items-center rounded-xl bg-white px-2.5 py-1 shadow-xs border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Iklim</span>
                                <span className={`text-xs font-black ${getStatusColor(activeItem.kondisi_iklim).textClass}`}>
                                    {activeItem.kondisi_iklim}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

