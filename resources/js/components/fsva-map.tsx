import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Activity,
    ChevronDown,
    ChevronUp,
    Compass,
    Eye,
    EyeOff,
    Filter,
    Layers,
    Maximize2,
    Minimize2,
    RotateCcw,
    Search,
    ShieldAlert,
    ShieldCheck,
    X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface FsvaVillageItem {
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
    current_indicator_value?: number | null;
    priority_info?: {
        label: string;
        short: string;
        color: string;
        bg_class: string;
        category: string;
        desc: string;
    };
}

interface FsvaMapProps {
    items: FsvaVillageItem[];
    selectedIndicator: string;
    indicatorLabel: string;
    selectedYear: number;
    onSelectVillage?: (village: FsvaVillageItem | null) => void;
}

const PRIORITY_COLORS: Record<number, { color: string; label: string; short: string; category: string }> = {
    1: { color: '#dc2626', label: 'Prioritas 1 (Sangat Rentan)', short: 'Sangat Rentan', category: 'rentan' },
    2: { color: '#ea580c', label: 'Prioritas 2 (Rentan)', short: 'Rentan', category: 'rentan' },
    3: { color: '#f59e0b', label: 'Prioritas 3 (Agak Rentan)', short: 'Agak Rentan', category: 'rentan' },
    4: { color: '#84cc16', label: 'Prioritas 4 (Agak Tahan)', short: 'Agak Tahan', category: 'aman' },
    5: { color: '#10b981', label: 'Prioritas 5 (Tahan)', short: 'Tahan', category: 'aman' },
    6: { color: '#047857', label: 'Prioritas 6 (Sangat Tahan)', short: 'Sangat Tahan', category: 'aman' },
};

const CARTO_API_KEY = 'cb1_4ll5_1_61de510a671abb089469524f';

function normalizeKey(str: string): string {
    return (str || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export default function FsvaMap({
    items,
    selectedIndicator,
    indicatorLabel,
    selectedYear,
    onSelectVillage,
}: FsvaMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);

    const [isLoadingGeoJson, setIsLoadingGeoJson] = useState(true);
    const [geoJsonData, setGeoJsonData] = useState<any>(null);
    const [selectedVillage, setSelectedVillage] = useState<FsvaVillageItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activePriorityFilter, setActivePriorityFilter] = useState<number | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showLabels, setShowLabels] = useState(false);
    const [layerStyle, setLayerStyle] = useState<'carto' | 'osm'>('carto');
    const [isLegendOpen, setIsLegendOpen] = useState(true);

    // Item dictionary by normalized key "KECAMATAN_DESA"
    const itemsMap = useMemo(() => {
        const map = new Map<string, FsvaVillageItem>();
        for (const item of items) {
            const key = `${normalizeKey(item.kecamatan)}_${normalizeKey(item.desa)}`;
            map.set(key, item);
        }
        return map;
    }, [items]);

    // Fetch GeoJSON on mount
    useEffect(() => {
        let isMounted = true;
        setIsLoadingGeoJson(true);

        fetch('/api/fsva/geojson')
            .then((res) => {
                if (!res.ok) throw new Error('Gagal memuat peta desa');
                return res.json();
            })
            .then((data) => {
                if (isMounted) {
                    setGeoJsonData(data);
                    setIsLoadingGeoJson(false);
                }
            })
            .catch((err) => {
                console.error('GeoJSON loading error:', err);
                if (isMounted) {
                    setIsLoadingGeoJson(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    // Initialize Leaflet Map
    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return;

        // Coordinates center for Kabupaten Indramayu
        const map = L.map(mapContainerRef.current, {
            center: [-6.45, 108.28],
            zoom: 10,
            zoomControl: true,
            minZoom: 9,
            maxZoom: 16,
        });

        // CartoDB Voyager tile layer with API Key to prevent "API KEY REQUIRED" watermark
        // Note: CARTO raster basemaps require 'key' parameter (not just 'api_key')
        const tileUrl =
            layerStyle === 'carto'
                ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_API_KEY}&api_key=${CARTO_API_KEY}&v=2`
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        const attribution =
            layerStyle === 'carto'
                ? '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

        const tiles = L.tileLayer(tileUrl, { attribution, subdomains: 'abcd', maxZoom: 19 });
        tiles.addTo(map);
        tileLayerRef.current = tiles;

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // Update tile layer if style toggled
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        if (tileLayerRef.current) {
            map.removeLayer(tileLayerRef.current);
        }
        const tileUrl =
            layerStyle === 'carto'
                ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_API_KEY}&api_key=${CARTO_API_KEY}&v=2`
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        const attribution =
            layerStyle === 'carto'
                ? '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

        const tiles = L.tileLayer(tileUrl, { attribution, subdomains: 'abcd', maxZoom: 19 });
        tiles.addTo(map);
        tileLayerRef.current = tiles;
    }, [layerStyle]);

    // Render / update GeoJSON layer whenever geoJsonData, itemsMap, or activePriorityFilter changes
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !geoJsonData) return;

        // Remove old geojson layer
        if (geoJsonLayerRef.current) {
            map.removeLayer(geoJsonLayerRef.current);
            geoJsonLayerRef.current = null;
        }

        const geoJsonLayer = L.geoJSON(geoJsonData, {
            style: (feature) => {
                const kec = feature?.properties?.KECAMATAN || '';
                const desa = feature?.properties?.DESA || '';
                const key = `${normalizeKey(kec)}_${normalizeKey(desa)}`;
                const item = itemsMap.get(key);

                const priority = item ? item.komposit : 1;
                const pColor = PRIORITY_COLORS[priority]?.color || '#94a3b8';

                // Check if priority filter is active
                const matchesFilter = activePriorityFilter === null || priority === activePriorityFilter;
                const fillOpacity = matchesFilter ? 0.78 : 0.15;
                const strokeColor = matchesFilter ? '#ffffff' : '#64748b';
                const weight = matchesFilter ? 1 : 0.5;

                return {
                    fillColor: pColor,
                    fillOpacity,
                    color: strokeColor,
                    weight,
                    opacity: matchesFilter ? 0.9 : 0.3,
                };
            },
            onEachFeature: (feature, layer) => {
                const kec = feature?.properties?.KECAMATAN || '';
                const desa = feature?.properties?.DESA || '';
                const key = `${normalizeKey(kec)}_${normalizeKey(desa)}`;
                const item = itemsMap.get(key);

                const priority = item ? item.komposit : 1;
                const pInfo = PRIORITY_COLORS[priority] || PRIORITY_COLORS[1];

                // Tooltip on hover
                const tooltipHtml = `
                    <div class="px-2 py-1 text-xs">
                        <div class="font-bold text-slate-900">${desa || 'Desa'}</div>
                        <div class="text-[10px] text-slate-500">Kec. ${kec || '-'}</div>
                        <div class="mt-1 flex items-center gap-1.5">
                            <span class="inline-block w-2.5 h-2.5 rounded-full" style="background-color: ${pInfo.color}"></span>
                            <span class="font-semibold text-slate-700">${pInfo.label}</span>
                        </div>
                        ${item && item.ikp ? `<div class="text-[10px] text-slate-600 mt-0.5">IKP: <b>${item.ikp}</b> (Peringkat #${item.rank || '-'})</div>` : ''}
                    </div>
                `;

                layer.bindTooltip(tooltipHtml, {
                    sticky: true,
                    direction: 'top',
                    className: 'leaflet-custom-tooltip bg-white/95 rounded-lg shadow-lg border border-slate-200',
                });

                // Events
                layer.on({
                    mouseover: (e) => {
                        const target = e.target;
                        target.setStyle({
                            weight: 2.5,
                            color: '#ffffff',
                            fillOpacity: 0.95,
                        });
                        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                            target.bringToFront();
                        }
                    },
                    mouseout: (e) => {
                        geoJsonLayer.resetStyle(e.target);
                    },
                    click: () => {
                        if (item) {
                            setSelectedVillage(item);
                            if (onSelectVillage) onSelectVillage(item);
                        }
                    },
                });
            },
        });

        geoJsonLayer.addTo(map);
        geoJsonLayerRef.current = geoJsonLayer;

        // Auto fit bounds on initial load
        if (geoJsonLayer.getBounds().isValid()) {
            map.fitBounds(geoJsonLayer.getBounds(), { padding: [15, 15] });
        }
    }, [geoJsonData, itemsMap, activePriorityFilter]);

    // Handle search village or subdistrict
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim() || !geoJsonLayerRef.current || !mapInstanceRef.current) return;

        const cleanSearch = normalizeKey(searchQuery);
        let matchedLayer: L.Layer | null = null;
        let matchedItem: FsvaVillageItem | null = null;

        geoJsonLayerRef.current.eachLayer((layer: any) => {
            if (matchedLayer) return;
            const props = layer.feature?.properties;
            const kec = normalizeKey(props?.KECAMATAN || '');
            const desa = normalizeKey(props?.DESA || '');

            if (desa.includes(cleanSearch) || kec.includes(cleanSearch)) {
                matchedLayer = layer;
                const key = `${kec}_${desa}`;
                matchedItem = itemsMap.get(key) || null;
            }
        });

        if (matchedLayer && (matchedLayer as any).getBounds) {
            const bounds = (matchedLayer as any).getBounds();
            mapInstanceRef.current.fitBounds(bounds, { maxZoom: 14 });
            (matchedLayer as any).setStyle({
                weight: 3.5,
                color: '#facc15',
                fillOpacity: 1,
            });
            if (matchedItem) {
                setSelectedVillage(matchedItem);
                if (onSelectVillage) onSelectVillage(matchedItem);
            }
        }
    };

    // Reset Map View
    const handleResetView = () => {
        if (!mapInstanceRef.current || !geoJsonLayerRef.current) return;
        const bounds = geoJsonLayerRef.current.getBounds();
        if (bounds.isValid()) {
            mapInstanceRef.current.fitBounds(bounds, { padding: [15, 15] });
        }
        setSelectedVillage(null);
        setActivePriorityFilter(null);
        setSearchQuery('');
    };

    // Toggle Fullscreen
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
        setTimeout(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
            }
        }, 200);
    };

    // Count per priority
    const priorityCounts = useMemo(() => {
        const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        for (const it of items) {
            counts[it.komposit] = (counts[it.komposit] || 0) + 1;
        }
        return counts;
    }, [items]);

    return (
        <div
            className={`rounded-2xl border border-slate-200/90 bg-white shadow-xl overflow-hidden transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 ${
                isFullscreen ? 'fixed inset-0 z-[9999] rounded-none' : 'relative w-full z-0 isolate'
            }`}
        >
            {/* Map Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-[#006565] dark:bg-emerald-950/60 dark:text-emerald-400">
                        <Compass className="h-4 w-4" />
                    </span>
                    <div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            Peta Sebaran Status FSVA Desa ({selectedYear})
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Indikator: <span className="font-bold text-[#006565] dark:text-emerald-400">{indicatorLabel}</span> • {items.length} Desa Terdata
                        </p>
                    </div>
                </div>

                {/* Search & Actions */}
                <div className="flex flex-wrap items-center gap-2">
                    <form onSubmit={handleSearch} className="relative flex items-center">
                        <Input
                            type="text"
                            placeholder="Cari desa / kecamatan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 w-44 sm:w-56 rounded-xl pr-8 text-xs bg-white dark:bg-slate-800"
                        />
                        <button
                            type="submit"
                            className="absolute right-2.5 text-slate-400 hover:text-[#006565] transition-colors"
                        >
                            <Search className="h-3.5 w-3.5" />
                        </button>
                    </form>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetView}
                        className="h-8 rounded-xl px-2.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        title="Reset Tampilan Peta"
                    >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden sm:inline">Reset</span>
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleFullscreen}
                        className="h-8 rounded-xl px-2.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}
                    >
                        {isFullscreen ? (
                            <Minimize2 className="h-3.5 w-3.5" />
                        ) : (
                            <Maximize2 className="h-3.5 w-3.5" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Quick Priority Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 bg-white px-4 py-2 text-xs scrollbar-none dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                    Filter Prioritas:
                </span>
                <button
                    type="button"
                    onClick={() => setActivePriorityFilter(null)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                        activePriorityFilter === null
                            ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                >
                    Semua ({items.length})
                </button>
                {([1, 2, 3, 4, 5, 6] as const).map((p) => {
                    const cfg = PRIORITY_COLORS[p];
                    const count = priorityCounts[p] || 0;
                    const isActive = activePriorityFilter === p;
                    return (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setActivePriorityFilter(isActive ? null : p)}
                            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer shrink-0 border ${
                                isActive
                                    ? 'ring-2 ring-slate-900 text-white shadow-xs'
                                    : 'hover:bg-slate-50 border-slate-200/80 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                            }`}
                            style={{
                                backgroundColor: isActive ? cfg.color : undefined,
                                borderColor: isActive ? cfg.color : undefined,
                            }}
                        >
                            <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: cfg.color }}
                            />
                            <span>{cfg.short}</span>
                            <span
                                className={`rounded-full px-1.5 py-0.2 text-[9px] font-black ${
                                    isActive
                                        ? 'bg-white/30 text-white'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Map Canvas Container */}
            <div className="relative z-0">
                <div
                    ref={mapContainerRef}
                    className={`w-full bg-slate-100 dark:bg-slate-950 transition-all ${
                        isFullscreen ? 'h-[calc(100vh-110px)]' : 'h-[540px] sm:h-[600px]'
                    }`}
                />

                {/* Loading State Overlay */}
                {isLoadingGeoJson && (
                    <div className="absolute inset-0 z-[1050] flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs dark:bg-slate-900/80">
                        <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#006565] border-t-transparent" />
                        <span className="mt-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                            Memuat batas wilayah 317 desa Indramayu...
                        </span>
                    </div>
                )}

                {/* Floating Map Legend (Bottom Left) */}
                <div className="absolute bottom-4 left-4 z-[1000] max-w-xs rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 pointer-events-auto">
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                Tingkat Prioritas FSVA
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">6 Tingkat</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsLegendOpen((prev) => !prev)}
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition-colors ml-2 cursor-pointer"
                            title={isLegendOpen ? 'Sembunyikan Legenda' : 'Tampilkan Legenda'}
                        >
                            {isLegendOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                        </button>
                    </div>
                    {isLegendOpen && (
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs animate-in fade-in duration-150">
                            {([1, 2, 3, 4, 5, 6] as const).map((p) => {
                                const cfg = PRIORITY_COLORS[p];
                                const count = priorityCounts[p] || 0;
                                return (
                                    <div key={p} className="flex items-center gap-1.5">
                                        <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/60 shadow-xs"
                                            style={{ backgroundColor: cfg.color }}
                                        />
                                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
                                            P{p}: {cfg.short}
                                        </span>
                                        <span className="ml-auto text-[10px] font-bold text-slate-400">
                                            {count}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Village Detail Modal / Card Floating (Top/Bottom Right) */}
                {selectedVillage && (
                    <div className="absolute top-4 right-4 z-[1000] w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-right-3 duration-200 dark:border-slate-700 dark:bg-slate-900/95 pointer-events-auto">
                        <div className="flex items-start justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                    Detail Ketahanan Desa
                                </span>
                                <h4 className="text-base font-black text-slate-900 leading-tight dark:text-white">
                                    DESA {selectedVillage.desa}
                                </h4>
                                <p className="text-xs font-semibold text-[#006565] dark:text-emerald-400">
                                    Kecamatan {selectedVillage.kecamatan}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedVillage(null)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Priority Badge */}
                        <div className="mt-2 flex items-center justify-between rounded-xl p-2.5 bg-slate-50 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <span
                                    className="h-3 w-3 rounded-full shrink-0"
                                    style={{
                                        backgroundColor:
                                            PRIORITY_COLORS[selectedVillage.komposit]?.color || '#94a3b8',
                                    }}
                                />
                                <div>
                                    <div className="text-xs font-black text-slate-900 dark:text-white">
                                        Prioritas {selectedVillage.komposit}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-semibold">
                                        {PRIORITY_COLORS[selectedVillage.komposit]?.short || ''}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-black text-[#006565] dark:text-emerald-400">
                                    IKP: {selectedVillage.ikp ?? '-'}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                    Peringkat #{selectedVillage.rank ?? '-'}
                                </div>
                            </div>
                        </div>

                        {/* Indicator Grid */}
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/40">
                                <span className="text-[10px] text-slate-400 font-semibold">NCPR</span>
                                <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {selectedVillage.ncpr ?? '-'}
                                </p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/40">
                                <span className="text-[10px] text-slate-400 font-semibold">Energi</span>
                                <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {selectedVillage.energy ? `${selectedVillage.energy} kkal` : '-'}
                                </p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/40">
                                <span className="text-[10px] text-slate-400 font-semibold">Protein</span>
                                <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {selectedVillage.protein ? `${selectedVillage.protein} g` : '-'}
                                </p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/40">
                                <span className="text-[10px] text-slate-400 font-semibold">Kemiskinan</span>
                                <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {selectedVillage.poverty ? `${selectedVillage.poverty}%` : '-'}
                                </p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/40">
                                <span className="text-[10px] text-slate-400 font-semibold">Stunting</span>
                                <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {selectedVillage.stunting ? `${selectedVillage.stunting}%` : '-'}
                                </p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/40">
                                <span className="text-[10px] text-slate-400 font-semibold">Tanpa Air Bersih</span>
                                <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {selectedVillage.no_water ? `${selectedVillage.no_water}%` : '-'}
                                </p>
                            </div>
                        </div>

                        {selectedVillage.keterangan && (
                            <p className="mt-2.5 text-[11px] text-slate-500 italic border-t border-slate-100 pt-2 dark:border-slate-800">
                                {selectedVillage.keterangan}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

