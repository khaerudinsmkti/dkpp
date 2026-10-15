import React, { useMemo, useRef, useState } from 'react';
import {
    Download,
    Eye,
    EyeOff,
    Filter,
    Info,
    MapPin,
    Package,
    RotateCcw,
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

export interface RecipientVillageItem {
    key: string;
    kecamatan: string;
    desa: string;
    total_penyaluran: number;
    transaksi_count: number;
    latest_tanggal: string;
    keterangan_list?: Array<{
        tanggal: string;
        jumlah: number;
        keterangan: string;
    }>;
    coordinates?: {
        lon: number;
        lat: number;
        svgX: number;
        svgY: number;
    } | null;
}

interface CppdMapProps {
    recipientVillages: RecipientVillageItem[];
    selectedVillageKey?: string | null;
    onSelectVillage?: (village: RecipientVillageItem | null) => void;
    year?: number;
    selectedKecamatanFilter?: string | null;
    onSelectKecamatanFilter?: (kecamatan: string | null) => void;
}

export function formatKg(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 2,
    }).format(amount) + ' kg';
}

export default function CppdMap({
    recipientVillages,
    selectedVillageKey = null,
    onSelectVillage,
    year,
    selectedKecamatanFilter = null,
    onSelectKecamatanFilter,
}: CppdMapProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    const [viewMode, setViewMode] = useState<'mainland' | 'full'>('mainland');
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [showLabels, setShowLabels] = useState<boolean>(true);
    const [hoveredVillage, setHoveredVillage] = useState<RecipientVillageItem | null>(null);
    const [hoveredKecamatan, setHoveredKecamatan] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
    const [isExporting, setIsExporting] = useState<boolean>(false);

    // Filter recipient villages by kecamatan if filter selected
    const filteredVillages = useMemo(() => {
        if (!selectedKecamatanFilter) {
            return recipientVillages;
        }
        return recipientVillages.filter(
            (v) => v.kecamatan.toUpperCase() === selectedKecamatanFilter.toUpperCase()
        );
    }, [recipientVillages, selectedKecamatanFilter]);

    // Map recipient villages by kecamatan for area tinting
    const villagesByKecamatan = useMemo(() => {
        const map = new Map<string, RecipientVillageItem[]>();
        for (const v of recipientVillages) {
            const kec = v.kecamatan.toUpperCase();
            if (!map.has(kec)) {
                map.set(kec, []);
            }
            map.get(kec)!.push(v);
        }
        return map;
    }, [recipientVillages]);

    // Min and max volume for marker sizing
    const maxPenyaluran = useMemo(() => {
        if (recipientVillages.length === 0) return 1000;
        return Math.max(...recipientVillages.map((v) => v.total_penyaluran), 1000);
    }, [recipientVillages]);

    const currentViewBox = viewMode === 'mainland' ? INDRAMAYU_MAINLAND_VIEWBOX : INDRAMAYU_MAP_VIEWBOX;

    const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 2.5));
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

    // Download map image as high resolution PNG
    const handleDownloadMapImage = () => {
        if (!svgRef.current || isExporting) return;
        setIsExporting(true);

        try {
            const svgEl = svgRef.current;
            const clonedSvg = svgEl.cloneNode(true) as SVGSVGElement;

            clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

            const isMainland = viewMode === 'mainland';
            const svgWidth = 1400;
            const svgHeight = isMainland ? 850 : 1000;
            clonedSvg.setAttribute('width', String(svgWidth));
            clonedSvg.setAttribute('height', String(svgHeight));

            const svgXml = new XMLSerializer().serializeToString(clonedSvg);
            const svgBlob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
            const blobUrl = URL.createObjectURL(svgBlob);

            const img = new Image();
            img.onload = () => {
                try {
                    const canvasWidth = 1600;
                    const canvasHeight = 1100;
                    const canvas = document.createElement('canvas');
                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        URL.revokeObjectURL(blobUrl);
                        setIsExporting(false);
                        return;
                    }

                    // Background
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

                    // Top emerald decorative stripe
                    ctx.fillStyle = '#006565';
                    ctx.fillRect(0, 0, canvasWidth, 10);

                    // Card background
                    ctx.fillStyle = '#f8fafc';
                    ctx.fillRect(40, 130, 1520, 810);
                    ctx.strokeStyle = '#e2e8f0';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(40, 130, 1520, 810);

                    // Title
                    ctx.fillStyle = '#006565';
                    ctx.font = 'bold 16px system-ui, sans-serif';
                    ctx.fillText('DINAS KETAHANAN PANGAN DAN PERTANIAN KABUPATEN INDRAMAYU', 50, 48);

                    ctx.fillStyle = '#0f172a';
                    ctx.font = 'bold 24px system-ui, sans-serif';
                    ctx.fillText(`PETA SEBARAN PENYALURAN CPPD TAHUN ${year || new Date().getFullYear()}`, 50, 82);

                    ctx.fillStyle = '#64748b';
                    ctx.font = 'normal 13px system-ui, sans-serif';
                    ctx.fillText(`Total Desa Penerima: ${recipientVillages.length} Desa • Diunduh: ${new Date().toLocaleDateString('id-ID')}`, 50, 106);

                    // Draw the map SVG image onto canvas
                    ctx.drawImage(img, 60, 150, 1480, 770);

                    // Footer
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '11px system-ui, sans-serif';
                    ctx.fillText('Portal Satu Data Pangan Kabupaten Indramayu — Cadangan Pangan Pemerintah Daerah (CPPD)', 50, 970);

                    const pngUrl = canvas.toDataURL('image/png');
                    const downloadLink = document.createElement('a');
                    downloadLink.href = pngUrl;
                    downloadLink.download = `Peta_Sebaran_Penyaluran_CPPD_${year || new Date().getFullYear()}_Indramayu.png`;
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);

                    URL.revokeObjectURL(blobUrl);
                    setIsExporting(false);
                } catch (err) {
                    console.error('Canvas render error:', err);
                    URL.revokeObjectURL(blobUrl);
                    setIsExporting(false);
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(blobUrl);
                setIsExporting(false);
                alert('Gagal membuat gambar peta.');
            };

            img.src = blobUrl;
        } catch (err) {
            console.error('Failed to export map:', err);
            setIsExporting(false);
            alert('Gagal mengekspor gambar peta.');
        }
    };

    return (
        <div className="relative flex flex-col rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 sm:p-6">
            {/* Header & Controls Bar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                            Peta Sebaran Penyaluran CPPD {year ? `Tahun ${year}` : ''}
                        </h3>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Menampilkan titik marker desa penerima bantuan cadangan pangan daerah. Arahkan kursor atau klik marker untuk melihat detail.
                    </p>
                </div>

                {/* Toolbar */}
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
                        title={showLabels ? 'Sembunyikan label kecamatan' : 'Tampilkan label kecamatan'}
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

                    {/* Download Button */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isExporting}
                        onClick={handleDownloadMapImage}
                        className="h-8 gap-1.5 rounded-xl border-emerald-300 bg-emerald-50/70 text-xs font-bold text-[#006565] hover:bg-emerald-100 hover:text-[#004e4e] dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-xs"
                        title="Unduh gambar peta dalam format PNG"
                    >
                        <Download className={`h-3.5 w-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
                        <span>{isExporting ? 'Memproses...' : 'Unduh Peta'}</span>
                    </Button>
                </div>
            </div>

            {/* Map Canvas Container */}
            <div
                ref={mapContainerRef}
                onMouseMove={handleMouseMove}
                className="relative flex min-h-[420px] sm:min-h-[500px] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-teal-50/30 via-slate-50/50 to-emerald-50/30 p-2 sm:p-4 border border-slate-200/60 dark:from-slate-950/70 dark:via-slate-900/60 dark:to-slate-950/80 dark:border-slate-800/80"
            >
                {/* Compass */}
                <div className="absolute top-3 left-3 z-10 flex flex-col items-center rounded-xl bg-white/90 p-2 shadow-xs backdrop-blur-md border border-slate-200/80 dark:bg-slate-900/90 dark:border-slate-700">
                    <span className="text-[10px] font-black text-rose-500">U</span>
                    <div className="my-0.5 h-3.5 w-0.5 bg-rose-500" />
                    <span className="text-[9px] font-bold text-slate-400">N</span>
                </div>

                {/* Legend Pill */}
                <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 rounded-2xl bg-white/90 p-3 shadow-md backdrop-blur-md border border-slate-200/80 text-[11px] dark:bg-slate-900/90 dark:border-slate-700 max-w-xs">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-[#006565] dark:text-emerald-400" />
                        <span>Keterangan Peta</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600 ring-2 ring-white" />
                        </span>
                        <span className="text-slate-600 dark:text-slate-300">
                            Titik Desa Penerima Bantuan
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-5 rounded bg-emerald-100 border border-emerald-400 dark:bg-emerald-950/60" />
                        <span className="text-slate-600 dark:text-slate-300">
                            Kecamatan Terdampak Penyaluran
                        </span>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        {recipientVillages.length} Desa terdata di {villagesByKecamatan.size} Kecamatan
                    </div>
                </div>

                {/* Floating Tooltip */}
                {hoveredVillage && mousePos && (
                    <div
                        className="pointer-events-none absolute z-30 w-80 rounded-2xl border border-slate-200/95 bg-white/95 p-3.5 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 animate-in fade-in zoom-in-95 duration-150 transition-transform"
                        style={{
                            left: Math.min(
                                Math.max(12, mousePos.x + 14),
                                (mapContainerRef.current?.clientWidth || 700) - 330
                            ),
                            top: Math.min(
                                Math.max(12, mousePos.y - 120),
                                (mapContainerRef.current?.clientHeight || 450) - 220
                            ),
                        }}
                    >
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                    Desa Penerima CPPD
                                </span>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                                    Desa {hoveredVillage.desa}
                                </h4>
                                <span className="text-[11px] text-[#006565] font-bold dark:text-emerald-400">
                                    Kecamatan {hoveredVillage.kecamatan}
                                </span>
                            </div>
                            <Badge className="rounded-xl px-2.5 py-1 text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 shadow-xs">
                                {formatKg(hoveredVillage.total_penyaluran)}
                            </Badge>
                        </div>

                        <div className="mt-2.5 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                                <span className="text-slate-400">Frekuensi Penyaluran:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-100">
                                    {hoveredVillage.transaksi_count} Kali
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                                <span className="text-slate-400">Penyaluran Terakhir:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-100">
                                    {hoveredVillage.latest_tanggal}
                                </span>
                            </div>

                            {hoveredVillage.keterangan_list && hoveredVillage.keterangan_list.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] font-bold text-slate-400 block mb-1">
                                        Catatan Penyaluran:
                                    </span>
                                    <p className="text-[11px] text-slate-600 italic dark:text-slate-300 line-clamp-3">
                                        "{hoveredVillage.keterangan_list[0].keterangan}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* SVG Render */}
                <div
                    className="w-full flex justify-center items-center transition-transform duration-300 ease-out"
                    style={{ transform: `scale(${zoomLevel})` }}
                >
                    <svg
                        ref={svgRef}
                        viewBox={currentViewBox}
                        className="h-auto max-h-[500px] w-full max-w-[750px] drop-shadow-sm select-none transition-all duration-300"
                        onMouseLeave={() => {
                            setHoveredVillage(null);
                            setHoveredKecamatan(null);
                        }}
                    >
                        <defs>
                            <filter id="marker-shadow" x="-50%" y="-50%" width="200%" height="200%">
                                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#006565" floodOpacity="0.4" />
                            </filter>
                            <linearGradient id="marker-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#059669" />
                                <stop offset="100%" stopColor="#006565" />
                            </linearGradient>
                            <linearGradient id="marker-selected-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#f59e0b" />
                                <stop offset="100%" stopColor="#d97706" />
                            </linearGradient>
                        </defs>

                        {/* 1. Base Kecamatan Polygons */}
                        {INDRAMAYU_KECAMATAN_FEATURES.map((feature: KecamatanMapFeature) => {
                            const kecName = feature.name.toUpperCase();
                            const hasVillages = villagesByKecamatan.has(kecName);
                            const isFiltered = selectedKecamatanFilter && selectedKecamatanFilter.toUpperCase() === kecName;
                            const isHovered = hoveredKecamatan === kecName;

                            let fill = '#f8fafc';
                            let stroke = '#cbd5e1';
                            let strokeWidth = 0.8;

                            if (hasVillages) {
                                fill = isFiltered ? '#bbf7d0' : isHovered ? '#dcfce7' : '#ecfdf5';
                                stroke = isFiltered ? '#15803d' : '#059669';
                                strokeWidth = isFiltered ? 2 : 1.2;
                            } else if (isHovered) {
                                fill = '#f1f5f9';
                                stroke = '#94a3b8';
                            }

                            return (
                                <g key={feature.name}>
                                    <path
                                        d={feature.path}
                                        fill={fill}
                                        stroke={stroke}
                                        strokeWidth={strokeWidth}
                                        strokeLinejoin="round"
                                        className="transition-colors duration-200 cursor-pointer"
                                        onMouseEnter={() => setHoveredKecamatan(kecName)}
                                        onClick={() => {
                                            if (onSelectKecamatanFilter) {
                                                onSelectKecamatanFilter(selectedKecamatanFilter === kecName ? null : kecName);
                                            }
                                        }}
                                    />
                                    {showLabels && (
                                        <text
                                            x={feature.centroid[0]}
                                            y={feature.centroid[1]}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            className="pointer-events-none select-none text-[8px] font-bold tracking-tight fill-slate-500/80"
                                            style={{
                                                fontSize: '8.5px',
                                                fontWeight: 700,
                                                fill: hasVillages ? '#065f46' : '#64748b',
                                            }}
                                        >
                                            {feature.name}
                                        </text>
                                    )}
                                </g>
                            );
                        })}

                        {/* 2. Markers for Recipient Villages */}
                        {filteredVillages.map((village) => {
                            if (!village.coordinates) return null;

                            const isSelected = selectedVillageKey === village.key;
                            const isHovered = hoveredVillage?.key === village.key;

                            // Calculate radius based on volume
                            const ratio = Math.min(village.total_penyaluran / maxPenyaluran, 1);
                            const markerRadius = 9 + ratio * 8; // Between 9 and 17 px
                            const cx = village.coordinates.svgX;
                            const cy = village.coordinates.svgY;

                            return (
                                <g
                                    key={village.key}
                                    className="cursor-pointer transition-transform duration-200"
                                    onMouseEnter={() => {
                                        setHoveredVillage(village);
                                        setHoveredKecamatan(village.kecamatan.toUpperCase());
                                    }}
                                    onClick={() => {
                                        if (onSelectVillage) {
                                            onSelectVillage(isSelected ? null : village);
                                        }
                                    }}
                                >
                                    {/* Pulsing Outer Halo */}
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={markerRadius + (isHovered || isSelected ? 12 : 6)}
                                        fill={isSelected ? '#f59e0b' : '#10b981'}
                                        fillOpacity={isHovered || isSelected ? 0.35 : 0.2}
                                        className="animate-pulse"
                                    />

                                    {/* Main Marker Circle */}
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={markerRadius}
                                        fill={isSelected ? 'url(#marker-selected-gradient)' : 'url(#marker-gradient)'}
                                        stroke="#ffffff"
                                        strokeWidth={isHovered || isSelected ? 3 : 2}
                                        filter="url(#marker-shadow)"
                                    />

                                    {/* Pin icon or center dot */}
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={markerRadius > 12 ? 3.5 : 2.5}
                                        fill="#ffffff"
                                    />

                                    {/* Village label next to marker if hovered or selected */}
                                    {(isHovered || isSelected) && (
                                        <g className="pointer-events-none">
                                            <rect
                                                x={cx + markerRadius + 4}
                                                y={cy - 12}
                                                width={Math.max(village.desa.length * 6 + 16, 70)}
                                                height={22}
                                                rx={6}
                                                fill="#0f172a"
                                                fillOpacity={0.92}
                                            />
                                            <text
                                                x={cx + markerRadius + 10}
                                                y={cy + 3}
                                                className="fill-white text-[9px] font-black"
                                            >
                                                {village.desa}
                                            </text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>
        </div>
    );
}

