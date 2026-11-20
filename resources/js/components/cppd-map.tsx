import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Download,
    Eye,
    EyeOff,
    Globe,
    Layers,
    Map as MapIcon,
    MapPin,
    Maximize2,
    Minimize2,
    Package,
    RotateCcw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    INDRAMAYU_KECAMATAN_FEATURES,
    INDRAMAYU_MAINLAND_VIEWBOX,
    type KecamatanMapFeature,
} from '@/data/indramayu-map';

export interface RecipientVillageItem {
    key: string;
    kecamatan: string;
    desa: string;
    total_penyaluran: number;
    monthly_penyaluran?: Record<number, number>;
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
    return (
        new Intl.NumberFormat('id-ID', {
            maximumFractionDigits: 2,
        }).format(amount) + ' kg'
    );
}

const CARTO_API_KEY = 'cb1_4ll5_1_61de510a671abb089469524f';
const INDRAMAYU_CENTER: [number, number] = [-6.45, 108.28];
const DEFAULT_ZOOM = 10.25;

function normalizeKey(str: string): string {
    return (str || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export default function CppdMap({
    recipientVillages,
    selectedVillageKey = null,
    onSelectVillage,
    year,
    selectedKecamatanFilter = null,
    onSelectKecamatanFilter,
}: CppdMapProps) {
    const mapCardRef = useRef<HTMLDivElement>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const baseTileLayerRef = useRef<L.TileLayer | null>(null);
    const labelTileLayerRef = useRef<L.TileLayer | null>(null);
    const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const hiddenSvgRef = useRef<SVGSVGElement>(null);

    const [baseMapMode, setBaseMapMode] = useState<'street' | 'satellite' | 'osm'>('street');
    const [showBoundaries, setShowBoundaries] = useState<boolean>(true);
    const [showLabels, setShowLabels] = useState<boolean>(true);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [isLoadingGeoJson, setIsLoadingGeoJson] = useState<boolean>(true);
    const [geoJsonData, setGeoJsonData] = useState<any>(null);
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

    // Map recipient villages by normalized "KECAMATAN_DESA" key
    const villageByNormKey = useMemo(() => {
        const map = new Map<string, RecipientVillageItem>();
        for (const v of recipientVillages) {
            map.set(`${normalizeKey(v.kecamatan)}_${normalizeKey(v.desa)}`, v);
        }
        return map;
    }, [recipientVillages]);

    // Map recipient villages by kecamatan
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

    // Max volume for marker sizing
    const maxPenyaluran = useMemo(() => {
        if (recipientVillages.length === 0) return 1000;
        return Math.max(...recipientVillages.map((v) => v.total_penyaluran), 1000);
    }, [recipientVillages]);

    // Load Indramayu GeoJSON boundaries
    useEffect(() => {
        let isMounted = true;
        setIsLoadingGeoJson(true);

        fetch('/api/fsva/geojson')
            .then((res) => {
                if (!res.ok) throw new Error('Gagal memuat GeoJSON');
                return res.json();
            })
            .then((data) => {
                if (isMounted) {
                    setGeoJsonData(data);
                    setIsLoadingGeoJson(false);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setIsLoadingGeoJson(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    // Initialize Leaflet Map instance
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: INDRAMAYU_CENTER,
            zoom: DEFAULT_ZOOM,
            zoomControl: true,
            minZoom: 9,
            maxZoom: 18,
            zoomSnap: 0.25,
            zoomDelta: 0.5,
        });

        const markersGroup = L.layerGroup().addTo(map);
        markersLayerRef.current = markersGroup;
        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
            markersLayerRef.current = null;
        };
    }, []);

    // Switch Base Tile Layer (Street / Satellite / OSM)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (baseTileLayerRef.current) {
            map.removeLayer(baseTileLayerRef.current);
            baseTileLayerRef.current = null;
        }
        if (labelTileLayerRef.current) {
            map.removeLayer(labelTileLayerRef.current);
            labelTileLayerRef.current = null;
        }

        if (baseMapMode === 'satellite') {
            // Esri World Imagery Satellite Layer
            const satTiles = L.tileLayer(
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                {
                    attribution:
                        'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
                    maxZoom: 18,
                }
            );
            satTiles.addTo(map);
            satTiles.bringToBack();
            baseTileLayerRef.current = satTiles;

            // Reference place labels overlay on satellite
            const labelTiles = L.tileLayer(
                'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
                {
                    maxZoom: 18,
                    opacity: 0.85,
                }
            );
            labelTiles.addTo(map);
            labelTileLayerRef.current = labelTiles;
        } else if (baseMapMode === 'osm') {
            const osmTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
            });
            osmTiles.addTo(map);
            osmTiles.bringToBack();
            baseTileLayerRef.current = osmTiles;
        } else {
            // Default: CARTO Voyager
            const cartoTiles = L.tileLayer(
                `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_API_KEY}&api_key=${CARTO_API_KEY}&v=2`,
                {
                    attribution:
                        '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    subdomains: 'abcd',
                    maxZoom: 19,
                }
            );
            cartoTiles.addTo(map);
            cartoTiles.bringToBack();
            baseTileLayerRef.current = cartoTiles;
        }
    }, [baseMapMode]);

    // Render GeoJSON Administrative Boundaries Layer
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (geoJsonLayerRef.current) {
            map.removeLayer(geoJsonLayerRef.current);
            geoJsonLayerRef.current = null;
        }

        if (!geoJsonData || !showBoundaries) return;

        const isSatellite = baseMapMode === 'satellite';

        const layer = L.geoJSON(geoJsonData, {
            style: (feature) => {
                const kec = (feature?.properties?.KECAMATAN || '').toUpperCase();
                const desa = (feature?.properties?.DESA || '').toUpperCase();
                const normKey = `${normalizeKey(kec)}_${normalizeKey(desa)}`;
                const recipient = villageByNormKey.get(normKey);
                const isSelected = Boolean(recipient && recipient.key === selectedVillageKey);
                const matchesKecFilter =
                    !selectedKecamatanFilter ||
                    kec === selectedKecamatanFilter.toUpperCase();

                if (recipient && matchesKecFilter) {
                    return {
                        fillColor: isSelected ? '#f59e0b' : '#10b981',
                        fillOpacity: isSatellite ? 0.38 : 0.32,
                        color: isSelected ? '#fbbf24' : isSatellite ? '#34d399' : '#059669',
                        weight: isSelected ? 2.5 : 1.5,
                        opacity: 0.95,
                    };
                }

                return {
                    fillColor: isSatellite ? '#0f172a' : '#64748b',
                    fillOpacity: isSatellite ? 0.08 : 0.05,
                    color: isSatellite ? 'rgba(255,255,255,0.35)' : '#94a3b8',
                    weight: 0.7,
                    opacity: isSatellite ? 0.65 : 0.45,
                };
            },
            onEachFeature: (feature, featLayer) => {
                const kec = (feature?.properties?.KECAMATAN || '').toUpperCase();
                const desa = (feature?.properties?.DESA || '').toUpperCase();
                const normKey = `${normalizeKey(kec)}_${normalizeKey(desa)}`;
                const recipient = villageByNormKey.get(normKey);

                if (recipient) {
                    featLayer.on({
                        click: () => {
                            if (onSelectVillage) {
                                onSelectVillage(
                                    selectedVillageKey === recipient.key ? null : recipient
                                );
                            }
                        },
                    });
                }
            },
        });

        layer.addTo(map);
        geoJsonLayerRef.current = layer;
    }, [
        geoJsonData,
        showBoundaries,
        baseMapMode,
        villageByNormKey,
        selectedVillageKey,
        selectedKecamatanFilter,
    ]);

    // Render Village Markers on Leaflet Map
    useEffect(() => {
        const map = mapInstanceRef.current;
        const markersGroup = markersLayerRef.current;
        if (!map || !markersGroup) return;

        markersGroup.clearLayers();

        const boundsPoints: Array<[number, number]> = [];

        filteredVillages.forEach((village) => {
            const lat = village.coordinates?.lat;
            const lon = village.coordinates?.lon;
            if (typeof lat !== 'number' || typeof lon !== 'number') return;

            boundsPoints.push([lat, lon]);

            const isSelected = selectedVillageKey === village.key;
            const ratio = Math.min(village.total_penyaluran / maxPenyaluran, 1);
            const size = Math.round(24 + ratio * 14); // 24px - 38px

            const bgGradient = isSelected
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'linear-gradient(135deg, #10b981, #006565)';
            const pulseColor = isSelected ? 'rgba(245, 158, 11, 0.45)' : 'rgba(16, 185, 129, 0.45)';

            const labelBadgeHtml = showLabels
                ? `<div style="margin-top:2px;padding:1px 6px;border-radius:6px;background:rgba(15,23,42,0.88);color:#fff;font-size:10px;font-weight:800;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.2);">
                    ${village.desa}
                   </div>`
                : '';

            const iconHtml = `
                <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%, -50%);">
                    <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
                        <span style="position:absolute;inset:-5px;border-radius:9999px;background:${pulseColor};"></span>
                        <div style="position:relative;width:${size}px;height:${size}px;border-radius:9999px;background:${bgGradient};border:2.5px solid #ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:10px;font-weight:900;">
                            <span style="width:7px;height:7px;border-radius:9999px;background:#ffffff;display:inline-block;"></span>
                        </div>
                    </div>
                    ${labelBadgeHtml}
                </div>
            `;

            const customIcon = L.divIcon({
                className: 'cppd-leaflet-marker',
                html: iconHtml,
                iconSize: [0, 0],
                iconAnchor: [0, 0],
            });

            const marker = L.marker([lat, lon], { icon: customIcon });

            const noteText =
                village.keterangan_list && village.keterangan_list.length > 0
                    ? `<div style="margin-top:6px;padding-top:6px;border-top:1px solid #e2e8f0;font-size:10px;color:#475569;font-style:italic;">"${village.keterangan_list[0].keterangan}"</div>`
                    : '';

            const tooltipHtml = `
                <div style="min-width:210px;padding:4px 6px;font-family:system-ui,sans-serif;">
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:6px;">
                        <div>
                            <div style="font-size:9px;font-weight:800;text-transform:uppercase;color:#64748b;letter-spacing:0.04em;">Desa Penerima CPPD</div>
                            <div style="font-size:13px;font-weight:900;color:#0f172a;line-height:1.2;">Desa ${village.desa}</div>
                            <div style="font-size:11px;font-weight:700;color:#006565;">Kec. ${village.kecamatan}</div>
                        </div>
                        <span style="background:#d1fae5;color:#065f46;border:1px solid #6ee7b7;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:800;white-space:nowrap;">
                            ${formatKg(village.total_penyaluran)}
                        </span>
                    </div>
                    <div style="font-size:11px;color:#334155;display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="color:#64748b;">Frekuensi Penyaluran:</span>
                        <strong style="color:#0f172a;">${village.transaksi_count} Kali</strong>
                    </div>
                    <div style="font-size:11px;color:#334155;display:flex;justify-content:space-between;">
                        <span style="color:#64748b;">Penyaluran Terakhir:</span>
                        <strong style="color:#0f172a;">${village.latest_tanggal}</strong>
                    </div>
                    ${noteText}
                </div>
            `;

            marker.bindTooltip(tooltipHtml, {
                direction: 'top',
                offset: [0, -14],
                opacity: 0.98,
                className: 'rounded-xl shadow-xl border border-slate-200',
            });

            marker.on('click', () => {
                if (onSelectVillage) {
                    onSelectVillage(isSelected ? null : village);
                }
            });

            marker.addTo(markersGroup);
        });

        if (selectedKecamatanFilter && boundsPoints.length > 0) {
            const bounds = L.latLngBounds(boundsPoints);
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [45, 45], maxZoom: 13 });
            }
        }
    }, [
        filteredVillages,
        selectedVillageKey,
        maxPenyaluran,
        showLabels,
        selectedKecamatanFilter,
    ]);

    // Pan to selected village when selectedVillageKey changes
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !selectedVillageKey) return;
        const found = recipientVillages.find((v) => v.key === selectedVillageKey);
        if (found?.coordinates?.lat && found?.coordinates?.lon) {
            map.flyTo([found.coordinates.lat, found.coordinates.lon], Math.max(map.getZoom(), 12.5), {
                duration: 0.6,
            });
        }
    }, [selectedVillageKey, recipientVillages]);

    // Reset Map View
    const handleResetView = () => {
        const map = mapInstanceRef.current;
        if (!map) return;
        if (geoJsonLayerRef.current && geoJsonLayerRef.current.getBounds().isValid()) {
            map.fitBounds(geoJsonLayerRef.current.getBounds(), { padding: [15, 15] });
        } else {
            map.setView(INDRAMAYU_CENTER, DEFAULT_ZOOM);
        }
        if (onSelectVillage) onSelectVillage(null);
        if (onSelectKecamatanFilter) onSelectKecamatanFilter(null);
    };

    // Toggle Fullscreen
    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement && !isFullscreen) {
                if (mapCardRef.current?.requestFullscreen) {
                    await mapCardRef.current.requestFullscreen();
                } else {
                    setIsFullscreen(true);
                }
            } else {
                if (document.fullscreenElement && document.exitFullscreen) {
                    await document.exitFullscreen();
                }
                setIsFullscreen(false);
            }
        } catch {
            setIsFullscreen((prev) => !prev);
        }

        setTimeout(() => {
            mapInstanceRef.current?.invalidateSize();
        }, 200);
    };

    useEffect(() => {
        const onFsChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
            setTimeout(() => {
                mapInstanceRef.current?.invalidateSize();
            }, 200);
        };
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    // Download map image as high resolution PNG
    const handleDownloadMapImage = () => {
        if (!hiddenSvgRef.current || isExporting) return;
        setIsExporting(true);

        try {
            const svgEl = hiddenSvgRef.current;
            const clonedSvg = svgEl.cloneNode(true) as SVGSVGElement;

            clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
            clonedSvg.setAttribute('width', '1400');
            clonedSvg.setAttribute('height', '850');

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

                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

                    ctx.fillStyle = '#006565';
                    ctx.fillRect(0, 0, canvasWidth, 10);

                    ctx.fillStyle = '#f8fafc';
                    ctx.fillRect(40, 130, 1520, 810);
                    ctx.strokeStyle = '#e2e8f0';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(40, 130, 1520, 810);

                    ctx.fillStyle = '#006565';
                    ctx.font = 'bold 16px system-ui, sans-serif';
                    ctx.fillText('DINAS KETAHANAN PANGAN DAN PERTANIAN KABUPATEN INDRAMAYU', 50, 48);

                    ctx.fillStyle = '#0f172a';
                    ctx.font = 'bold 24px system-ui, sans-serif';
                    ctx.fillText(
                        `PETA SEBARAN PENYALURAN CPPD TAHUN ${year || new Date().getFullYear()}`,
                        50,
                        82
                    );

                    ctx.fillStyle = '#64748b';
                    ctx.font = 'normal 13px system-ui, sans-serif';
                    ctx.fillText(
                        `Total Desa Penerima: ${recipientVillages.length} Desa • Diunduh: ${new Date().toLocaleDateString('id-ID')}`,
                        50,
                        106
                    );

                    ctx.drawImage(img, 60, 150, 1480, 770);

                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '11px system-ui, sans-serif';
                    ctx.fillText(
                        'Portal Satu Data Pangan Kabupaten Indramayu — Cadangan Pangan Pemerintah Daerah (CPPD)',
                        50,
                        970
                    );

                    const pngUrl = canvas.toDataURL('image/png');
                    const downloadLink = document.createElement('a');
                    downloadLink.href = pngUrl;
                    downloadLink.download = `Peta_Sebaran_Penyaluran_CPPD_${year || new Date().getFullYear()}_Indramayu.png`;
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);

                    URL.revokeObjectURL(blobUrl);
                    setIsExporting(false);
                } catch {
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
        } catch {
            setIsExporting(false);
            alert('Gagal mengekspor gambar peta.');
        }
    };

    return (
        <div
            ref={mapCardRef}
            className={`relative flex flex-col bg-white/95 shadow-xl backdrop-blur-xl dark:bg-slate-900/95 transition-all ${
                isFullscreen
                    ? 'fixed inset-0 z-[99999] h-screen w-screen rounded-none border-0 p-4'
                    : 'rounded-3xl border border-slate-200/90 p-4 sm:p-6 dark:border-slate-800'
            }`}
        >
            {/* Header & Controls Bar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                            Peta Sebaran Penyaluran CPPD {year ? `Tahun ${year}` : ''}
                        </h3>
                        <Badge className="bg-emerald-50 text-[#006565] border-emerald-200 text-[10px] font-bold dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                            Leaflet GIS
                        </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Peta interaktif Leaflet JS dengan pilihan tampilan Peta Jalan, Citra Satelit, dan OpenStreetMap. Klik titik desa untuk detail.
                    </p>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {/* Base Map Mode Switcher: Peta Jalan vs Satelit vs OSM */}
                    <div className="inline-flex items-center rounded-xl border border-slate-200/90 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800">
                        <button
                            type="button"
                            onClick={() => setBaseMapMode('street')}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                                baseMapMode === 'street'
                                    ? 'bg-white text-[#006565] shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            }`}
                            title="Tampilan Peta Jalan Standar"
                        >
                            <MapIcon className="h-3.5 w-3.5" />
                            <span>Peta Jalan</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setBaseMapMode('satellite')}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                                baseMapMode === 'satellite'
                                    ? 'bg-[#006565] text-white shadow-xs dark:bg-emerald-600'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            }`}
                            title="Tampilan Citra Satelit Resolusi Tinggi"
                        >
                            <Globe className="h-3.5 w-3.5" />
                            <span>Satelit</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setBaseMapMode('osm')}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                                baseMapMode === 'osm'
                                    ? 'bg-white text-[#006565] shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            }`}
                            title="Tampilan OpenStreetMap"
                        >
                            <Layers className="h-3.5 w-3.5" />
                            <span>OSM</span>
                        </button>
                    </div>

                    {/* Toggle Boundaries */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBoundaries(!showBoundaries)}
                        className={`h-8 gap-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                            showBoundaries
                                ? 'border-emerald-300 bg-emerald-50/60 text-[#006565] dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : ''
                        }`}
                        title={showBoundaries ? 'Sembunyikan batas wilayah desa' : 'Tampilkan batas wilayah desa'}
                    >
                        <Layers className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Batas Desa</span>
                    </Button>

                    {/* Toggle Labels */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowLabels(!showLabels)}
                        className="h-8 gap-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                        title={showLabels ? 'Sembunyikan label nama desa' : 'Tampilkan label nama desa'}
                    >
                        {showLabels ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">Label</span>
                    </Button>

                    {/* Reset View */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetView}
                        className="h-8 gap-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                        title="Reset posisi peta ke tampilan awal"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Reset</span>
                    </Button>

                    {/* Fullscreen */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleFullscreen}
                        className="h-8 gap-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                        title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                    >
                        {isFullscreen ? (
                            <Minimize2 className="h-3.5 w-3.5" />
                        ) : (
                            <Maximize2 className="h-3.5 w-3.5" />
                        )}
                    </Button>

                    {/* Download Button */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isExporting}
                        onClick={handleDownloadMapImage}
                        className="h-8 gap-1.5 rounded-xl border-emerald-300 bg-emerald-50/70 text-xs font-bold text-[#006565] hover:bg-emerald-100 hover:text-[#004e4e] dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-xs cursor-pointer"
                        title="Unduh gambar peta dalam format PNG"
                    >
                        <Download className={`h-3.5 w-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
                        <span>{isExporting ? 'Memproses...' : 'Unduh Peta'}</span>
                    </Button>
                </div>
            </div>

            {/* Leaflet Map Canvas Container */}
            <div
                className={`relative w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 ${
                    isFullscreen ? 'flex-1 min-h-0' : 'h-[460px] sm:h-[530px]'
                }`}
            >
                <div ref={mapContainerRef} className="h-full w-full z-0" />

                {isLoadingGeoJson && (
                    <div className="pointer-events-none absolute top-3 right-3 z-[1000] inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#006565] border-t-transparent" />
                        <span>Memuat batas wilayah...</span>
                    </div>
                )}

                {/* Legend Pill */}
                <div className="pointer-events-auto absolute bottom-3 left-3 z-[1000] flex flex-col gap-1.5 rounded-2xl bg-white/95 p-3 shadow-xl backdrop-blur-md border border-slate-200/80 text-[11px] dark:bg-slate-900/95 dark:border-slate-700 max-w-xs">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5 text-[#006565] dark:text-emerald-400" />
                            <span>Keterangan Peta</span>
                        </span>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {baseMapMode === 'satellite' ? 'Mode Satelit' : baseMapMode === 'osm' ? 'Mode OSM' : 'Mode Peta'}
                        </span>
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
                        <span className="h-3 w-5 rounded bg-emerald-500/30 border border-emerald-500" />
                        <span className="text-slate-600 dark:text-slate-300">
                            Wilayah Desa Penerima CPPD
                        </span>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        {filteredVillages.length} Desa ditampilkan dari {villagesByKecamatan.size} Kecamatan
                    </div>
                </div>
            </div>

            {/* Hidden SVG used exclusively for crisp high-resolution PNG cartographic export */}
            <div className="sr-only pointer-events-none h-0 w-0 overflow-hidden" aria-hidden="true">
                <svg ref={hiddenSvgRef} viewBox={INDRAMAYU_MAINLAND_VIEWBOX}>
                    {INDRAMAYU_KECAMATAN_FEATURES.map((feature: KecamatanMapFeature) => {
                        const kecName = feature.name.toUpperCase();
                        const hasVillages = villagesByKecamatan.has(kecName);
                        return (
                            <g key={feature.name}>
                                <path
                                    d={feature.path}
                                    fill={hasVillages ? '#ecfdf5' : '#f8fafc'}
                                    stroke={hasVillages ? '#059669' : '#cbd5e1'}
                                    strokeWidth={hasVillages ? 1.2 : 0.8}
                                    strokeLinejoin="round"
                                />
                                <text
                                    x={feature.centroid[0]}
                                    y={feature.centroid[1]}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    style={{
                                        fontSize: '8.5px',
                                        fontWeight: 700,
                                        fill: hasVillages ? '#065f46' : '#64748b',
                                    }}
                                >
                                    {feature.name}
                                </text>
                            </g>
                        );
                    })}
                    {filteredVillages.map((village) => {
                        if (!village.coordinates) return null;
                        const ratio = Math.min(village.total_penyaluran / maxPenyaluran, 1);
                        const markerRadius = 9 + ratio * 8;
                        const cx = village.coordinates.svgX;
                        const cy = village.coordinates.svgY;
                        return (
                            <g key={village.key}>
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={markerRadius + 5}
                                    fill="#10b981"
                                    fillOpacity={0.25}
                                />
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={markerRadius}
                                    fill="#006565"
                                    stroke="#ffffff"
                                    strokeWidth={2}
                                />
                                <circle cx={cx} cy={cy} r={3} fill="#ffffff" />
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}

