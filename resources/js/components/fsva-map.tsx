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
    active_priority?: number;
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
    const mapCardRef = useRef<HTMLDivElement>(null);
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
            zoomSnap: 0.25,
            zoomDelta: 0.5,
            wheelPxPerZoomLevel: 200,
            wheelDebounceTime: 60,
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

    // Helper to determine active priority (1-6) for an item based on selectedIndicator
    const getVillagePriority = (item: FsvaVillageItem | undefined | null): number => {
        if (!item) return 1;
        if (selectedIndicator === 'komposit' || !selectedIndicator) {
            return item.komposit || 1;
        }
        const val = item.current_indicator_value ?? (item as any)[selectedIndicator];
        if (val !== null && val !== undefined && !isNaN(Number(val))) {
            return Math.max(1, Math.min(6, Math.round(Number(val))));
        }
        return item.active_priority ?? item.komposit ?? 1;
    };

    // Render / update GeoJSON layer whenever geoJsonData, itemsMap, activePriorityFilter, or selectedIndicator changes
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

                const priority = getVillagePriority(item);
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

                const priority = getVillagePriority(item);
                const pInfo = PRIORITY_COLORS[priority] || PRIORITY_COLORS[1];
                const isKomposit = selectedIndicator === 'komposit' || !selectedIndicator;
                const indVal = item?.current_indicator_value ?? (item ? (item as any)[selectedIndicator] : null);

                // Tooltip on hover
                const tooltipHtml = `
                    <div class="px-2 py-1 text-xs">
                        <div class="font-bold text-slate-900">${desa || 'Desa'}</div>
                        <div class="text-[10px] text-slate-500">Kec. ${kec || '-'}</div>
                        <div class="mt-1 flex items-center gap-1.5">
                            <span class="inline-block w-2.5 h-2.5 rounded-full" style="background-color: ${pInfo.color}"></span>
                            <span class="font-semibold text-slate-700">
                                ${isKomposit ? pInfo.label : `${indicatorLabel}: Prioritas ${priority} (${pInfo.short})`}
                            </span>
                        </div>
                        <div class="text-[10px] text-slate-600 mt-0.5">
                            ${!isKomposit ? `Nilai: <b>${indVal ?? '-'}</b> • Komposit: <b>P${item?.komposit ?? '-'}</b> • ` : ''}IKP: <b>${item?.ikp ?? '-'}</b> (Rank #${item?.rank || '-'})
                        </div>
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
    }, [geoJsonData, itemsMap, activePriorityFilter, selectedIndicator, indicatorLabel]);

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

    // Toggle Fullscreen (Native Fullscreen API with CSS fallback)
    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement && !isFullscreen) {
                if (mapCardRef.current?.requestFullscreen) {
                    await mapCardRef.current.requestFullscreen();
                } else if ((mapCardRef.current as any)?.webkitRequestFullscreen) {
                    await (mapCardRef.current as any).webkitRequestFullscreen();
                } else {
                    setIsFullscreen(true);
                }
            } else {
                if (document.fullscreenElement) {
                    if (document.exitFullscreen) {
                        await document.exitFullscreen();
                    } else if ((document as any).webkitExitFullscreen) {
                        await (document as any).webkitExitFullscreen();
                    }
                }
                setIsFullscreen(false);
            }
        } catch {
            setIsFullscreen((prev) => !prev);
        }

        setTimeout(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
            }
        }, 150);
        setTimeout(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
            }
        }, 350);
    };

    // Listen for fullscreen change events, Escape key, and map invalidation
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFs = Boolean(document.fullscreenElement);
            setIsFullscreen(isFs);
            setTimeout(() => {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.invalidateSize();
                }
            }, 150);
            setTimeout(() => {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.invalidateSize();
                }
            }, 350);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                }
                setIsFullscreen(false);
                setTimeout(() => {
                    if (mapInstanceRef.current) {
                        mapInstanceRef.current.invalidateSize();
                    }
                }, 150);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFullscreen]);

    // Lock body scroll during CSS fullscreen
    useEffect(() => {
        if (isFullscreen) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [isFullscreen]);

    // Count per priority based on selected indicator
    const priorityCounts = useMemo(() => {
        const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        for (const it of items) {
            const p = getVillagePriority(it);
            counts[p] = (counts[p] || 0) + 1;
        }
        return counts;
    }, [items, selectedIndicator]);

    return (
        <div
            ref={mapCardRef}
            className={`flex flex-col bg-white dark:bg-slate-900 transition-colors duration-200 ${
                isFullscreen
                    ? 'fixed inset-0 z-[99999] h-screen w-screen m-0 p-0 rounded-none border-0 overflow-hidden'
                    : 'relative w-full rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden'
            }`}
        >
            {/* Map Top Toolbar - Displays title, subtitle, search, and fullscreen actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-4 py-2.5 shrink-0 transition-colors dark:border-slate-800 dark:bg-slate-900">
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
                            className="h-8 w-44 sm:w-56 rounded-xl pr-8 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        />
                        <button
                            type="submit"
                            className="absolute right-2.5 text-slate-400 hover:text-[#006565] transition-colors cursor-pointer"
                        >
                            <Search className="h-3.5 w-3.5" />
                        </button>
                    </form>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetView}
                        className="h-8 rounded-xl px-2.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:border-slate-700 cursor-pointer"
                        title="Reset Tampilan Peta"
                    >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden sm:inline">Reset</span>
                    </Button>

                    <Button
                        type="button"
                        size="sm"
                        onClick={toggleFullscreen}
                        className={`h-8 rounded-xl px-2.5 text-xs font-bold transition-all cursor-pointer ${
                            isFullscreen
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                        }`}
                        title={isFullscreen ? 'Keluar Layar Penuh (ESC)' : 'Layar Penuh'}
                    >
                        {isFullscreen ? (
                            <>
                                <Minimize2 className="h-3.5 w-3.5 mr-1.5" />
                                <span>Keluar Layar Penuh</span>
                                <kbd className="ml-1.5 hidden sm:inline-block rounded bg-black/25 px-1 py-0.2 text-[10px] font-mono text-white">
                                    ESC
                                </kbd>
                            </>
                        ) : (
                            <>
                                <Maximize2 className="h-3.5 w-3.5 sm:mr-1" />
                                <span className="hidden sm:inline">Layar Penuh</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Quick Priority Filter Pills - Always shown in clean light theme */}
            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200/80 bg-slate-50/90 px-4 py-2 text-xs scrollbar-none shrink-0 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                    Filter Prioritas:
                </span>
                <button
                    type="button"
                    onClick={() => setActivePriorityFilter(null)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                        activePriorityFilter === null
                            ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
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
                                    : 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
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
            <div className={`relative ${isFullscreen ? 'flex-1 min-h-0 w-full' : 'h-[540px] sm:h-[600px] w-full'}`}>
                <div
                    ref={mapContainerRef}
                    className="w-full h-full bg-slate-100 dark:bg-slate-950"
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

                {/* Floating Map Legend (Bottom Left - Portrait Layout) */}
                <div className="absolute bottom-4 left-4 z-[1000] w-56 sm:w-60 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 pointer-events-auto">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col min-w-0 pr-1">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 truncate">
                                {selectedIndicator === 'komposit' || !selectedIndicator
                                    ? 'Legenda Prioritas'
                                    : `Legenda: ${indicatorLabel}`}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                                6 Tingkat Kerentanan
                            </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            {activePriorityFilter !== null && (
                                <button
                                    type="button"
                                    onClick={() => setActivePriorityFilter(null)}
                                    className="text-[10px] font-extrabold text-[#006565] dark:text-emerald-400 hover:underline px-1 py-0.5 cursor-pointer"
                                    title="Tampilkan semua prioritas"
                                >
                                    Reset
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsLegendOpen((prev) => !prev)}
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title={isLegendOpen ? 'Sembunyikan Legenda' : 'Tampilkan Legenda'}
                            >
                                {isLegendOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                            </button>
                        </div>
                    </div>
                    {isLegendOpen && (
                        <div className="flex flex-col space-y-1 text-xs animate-in fade-in duration-150">
                            {([1, 2, 3, 4, 5, 6] as const).map((p) => {
                                const cfg = PRIORITY_COLORS[p];
                                const count = priorityCounts[p] || 0;
                                const isActive = activePriorityFilter === p;
                                const isDimmed = activePriorityFilter !== null && !isActive;

                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setActivePriorityFilter(isActive ? null : p)}
                                        className={`group flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left transition-all cursor-pointer ${
                                            isActive
                                                ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900 ring-2 ring-slate-900/20 dark:ring-white/20'
                                                : isDimmed
                                                  ? 'opacity-40 hover:opacity-85 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                                                  : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
                                        }`}
                                        title={`Prioritas ${p} (${cfg.short}): ${count} desa. Klik untuk memfilter.`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span
                                                className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/80 shadow-xs dark:ring-slate-900/80"
                                                style={{ backgroundColor: cfg.color }}
                                            />
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[11px] font-bold leading-tight">
                                                        Prioritas {p}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`block text-[10px] leading-tight truncate ${
                                                        isActive
                                                            ? 'text-slate-200 dark:text-slate-700 font-semibold'
                                                            : 'text-slate-400 dark:text-slate-400'
                                                    }`}
                                                >
                                                    {cfg.short}
                                                </span>
                                            </div>
                                        </div>
                                        <span
                                            className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black ${
                                                isActive
                                                    ? 'bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-900'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                            }`}
                                        >
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Village Detail Modal / Card Floating (Top/Bottom Right) */}
                {selectedVillage && (
                    <div
                        className="absolute top-4 right-4 z-[1000] w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-right-3 duration-200 dark:border-slate-700 dark:bg-slate-900/95 pointer-events-auto"
                    >
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
                                            PRIORITY_COLORS[getVillagePriority(selectedVillage)]?.color || '#94a3b8',
                                    }}
                                />
                                <div>
                                    <div className="text-xs font-black text-slate-900 dark:text-white">
                                        Prioritas {getVillagePriority(selectedVillage)}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-semibold">
                                        {PRIORITY_COLORS[getVillagePriority(selectedVillage)]?.short || ''}
                                        {selectedIndicator !== 'komposit' && selectedIndicator ? ` (${indicatorLabel})` : ' (Komposit)'}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-black text-[#006565] dark:text-emerald-400">
                                    IKP: {selectedVillage.ikp ?? '-'}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                    Peringkat #{selectedVillage.rank ?? '-'}
                                    {selectedIndicator !== 'komposit' && (
                                        <span className="block text-[9px] text-slate-400">Komposit: P{selectedVillage.komposit}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Indicator Grid (Scores 1-6 with no percentages) */}
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className={`rounded-lg p-2 ${selectedIndicator === 'ncpr' ? 'bg-emerald-100/70 border border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-700' : 'bg-slate-50 dark:bg-slate-800/40'}`}>
                                <span className="text-[10px] text-slate-400 font-semibold">NCPR</span>
                                <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {selectedVillage.ncpr ?? '-'}
                                </p>
                            </div>
                            <div className={`rounded-lg p-2 ${selectedIndicator === 'energy' ? 'bg-emerald-100/70 border border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-700' : 'bg-slate-50 dark:bg-slate-800/40'}`}>
                                <span className="text-[10px] text-slate-400 font-semibold">Energi</span>
                                <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {selectedVillage.energy ?? '-'}
                                </p>
                            </div>
                            <div className={`rounded-lg p-2 ${selectedIndicator === 'protein' ? 'bg-emerald-100/70 border border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-700' : 'bg-slate-50 dark:bg-slate-800/40'}`}>
                                <span className="text-[10px] text-slate-400 font-semibold">Protein</span>
                                <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {selectedVillage.protein ?? '-'}
                                </p>
                            </div>
                            <div className={`rounded-lg p-2 ${selectedIndicator === 'food_reserves' ? 'bg-emerald-100/70 border border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-700' : 'bg-slate-50 dark:bg-slate-800/40'}`}>
                                <span className="text-[10px] text-slate-400 font-semibold">Cadangan Pangan</span>
                                <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {selectedVillage.food_reserves ?? '-'}
                                </p>
                            </div>
                            <div className={`rounded-lg p-2 ${selectedIndicator === 'poverty' ? 'bg-emerald-100/70 border border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-700' : 'bg-slate-50 dark:bg-slate-800/40'}`}>
                                <span className="text-[10px] text-slate-400 font-semibold">Kemiskinan</span>
                                <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {selectedVillage.poverty ?? '-'}
                                </p>
                            </div>
                            <div className={`rounded-lg p-2 ${selectedIndicator === 'price_cv' ? 'bg-emerald-100/70 border border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-700' : 'bg-slate-50 dark:bg-slate-800/40'}`}>
                                <span className="text-[10px] text-slate-400 font-semibold">Price CV</span>
                                <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {selectedVillage.price_cv ?? '-'}
                                </p>
                            </div>
                            <div className={`rounded-lg p-2 ${selectedIndicator === 'pou' ? 'bg-emerald-100/70 border border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-700' : 'bg-slate-50 dark:bg-slate-800/40'}`}>
                                <span className="text-[10px] text-slate-400 font-semibold">PoU</span>
                                <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {selectedVillage.pou ?? '-'}
                                </p>
                            </div>
                            <div className={`rounded-lg p-2 ${selectedIndicator === 'female_school' ? 'bg-emerald-100/70 border border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-700' : 'bg-slate-50 dark:bg-slate-800/40'}`}>
                                <span className="text-[10px] text-slate-400 font-semibold">Sekolah Perempuan</span>
                                <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {selectedVillage.female_school ?? '-'}
                                </p>
                            </div>
                            <div className={`rounded-lg p-2 ${selectedIndicator === 'no_water' ? 'bg-emerald-100/70 border border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-700' : 'bg-slate-50 dark:bg-slate-800/40'}`}>
                                <span className="text-[10px] text-slate-400 font-semibold">Tanpa Air</span>
                                <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {selectedVillage.no_water ?? '-'}
                                </p>
                            </div>
                            <div className={`rounded-lg p-2 ${selectedIndicator === 'pph' ? 'bg-emerald-100/70 border border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-700' : 'bg-slate-50 dark:bg-slate-800/40'}`}>
                                <span className="text-[10px] text-slate-400 font-semibold">PPH</span>
                                <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {selectedVillage.pph ?? '-'}
                                </p>
                            </div>
                            <div className={`rounded-lg p-2 ${selectedIndicator === 'stunting' ? 'bg-emerald-100/70 border border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-700' : 'bg-slate-50 dark:bg-slate-800/40'}`}>
                                <span className="text-[10px] text-slate-400 font-semibold">Stunting</span>
                                <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {selectedVillage.stunting ?? '-'}
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

