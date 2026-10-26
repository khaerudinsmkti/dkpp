import {
    INDRAMAYU_KECAMATAN_FEATURES,
    INDRAMAYU_MAINLAND_VIEWBOX,
} from '@/data/indramayu-map';
import type { SkpgKecamatanItem } from '@/components/skpg-map';
import { BAPANAS_LOGO_BASE64 } from '@/lib/bapanas-logo-data';

const MONTH_NAMES_ID = [
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

export interface GenerateSkpgPdfOptions {
    items: SkpgKecamatanItem[];
    selectedIndicator: string;
    indicatorLabel: string;
    month: number;
    year: number;
    monthName?: string;
}

export function isClimateIndicator(selectedIndicator: string): boolean {
    const norm = (selectedIndicator || '').toLowerCase().trim();
    return (
        norm === 'potensi_kering' ||
        norm === 'potensi_basah' ||
        norm === 'kondisi_iklim' ||
        norm.includes('kering') ||
        norm.includes('basah') ||
        norm.includes('iklim')
    );
}

// Generate dynamic 2-line title strictly following DKPP / Bapanas guidelines
export function getPdfTitleLines(
    selectedIndicator: string,
    monthStr: string,
    year: number
): { line1: string; line2: string } {
    const norm = (selectedIndicator || '').toLowerCase().trim();
    const monthYear = `BULAN ${monthStr.toUpperCase()} TAHUN ${year}`;

    // 1. Ketersediaan (IK)
    if (norm === 'ik' || norm.includes('ketersediaan')) {
        return {
            line1: 'PETA ASPEK KETERSEDIAAN PANGAN KABUPATEN INDRAMAYU',
            line2: monthYear,
        };
    }

    // 2. Keterjangkauan (IA)
    if (norm === 'ia' || norm.includes('keterjangkauan')) {
        return {
            line1: 'PETA ASPEK KETERJANGKAUAN PANGAN KABUPATEN INDRAMAYU',
            line2: monthYear,
        };
    }

    // 3. Pemanfaatan (IP)
    if (norm === 'ip' || norm.includes('pemanfaatan')) {
        return {
            line1: 'PETA ASPEK PEMANFAATAN PANGAN KABUPATEN INDRAMAYU',
            line2: monthYear,
        };
    }

    // 4. Potensi Kering (Tanpa kata ASPEK)
    if (norm === 'potensi_kering' || norm.includes('kering')) {
        return {
            line1: 'PETA POTENSI KERING KABUPATEN INDRAMAYU',
            line2: monthYear,
        };
    }

    // 5. Potensi Basah (Tanpa kata ASPEK)
    if (norm === 'potensi_basah' || norm.includes('basah')) {
        return {
            line1: 'PETA POTENSI BASAH KABUPATEN INDRAMAYU',
            line2: monthYear,
        };
    }

    // 6. Kondisi Iklim (Tanpa kata ASPEK)
    if (norm === 'kondisi_iklim' || norm.includes('iklim')) {
        return {
            line1: 'PETA KONDISI IKLIM KABUPATEN INDRAMAYU',
            line2: monthYear,
        };
    }

    // 7. Komposit (IKB) / Default
    return {
        line1: 'PETA SISTEM PERINGATAN DINI KERAWANAN PANGAN DAN GIZI',
        line2: `KABUPATEN INDRAMAYU ${monthYear}`,
    };
}

// Convert JPEG Uint8Array buffer into a standard A4 Landscape PDF Blob
function createPdfFromJpeg(jpegBytes: Uint8Array, width: number, height: number): Blob {
    const pageWidth = 841.89; // A4 Landscape width in pt (297mm)
    const pageHeight = 595.28; // A4 Landscape height in pt (210mm)

    const contentStream = `q\n${pageWidth.toFixed(2)} 0 0 ${pageHeight.toFixed(2)} 0 0 cm\n/Im1 Do\nQ\n`;
    const encoder = new TextEncoder();
    const contentStreamBytes = encoder.encode(contentStream);

    const parts: (Uint8Array | string)[] = [];
    const offsets: number[] = [];
    let currentOffset = 0;

    function addString(str: string) {
        const bytes = encoder.encode(str);
        parts.push(bytes);
        currentOffset += bytes.length;
    }

    function addBytes(bytes: Uint8Array) {
        parts.push(bytes);
        currentOffset += bytes.length;
    }

    // PDF Header
    addString('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

    // Object 1: Catalog
    offsets.push(currentOffset);
    addString('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    // Object 2: Pages
    offsets.push(currentOffset);
    addString('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

    // Object 3: Page (A4 Landscape)
    offsets.push(currentOffset);
    addString(
        `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Resources << /XObject << /Im1 4 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 5 0 R >>\nendobj\n`
    );

    // Object 4: Image XObject (JPEG DCTDecode)
    offsets.push(currentOffset);
    addString(
        `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
    );
    addBytes(jpegBytes);
    addString('\nendstream\nendobj\n');

    // Object 5: Contents stream
    offsets.push(currentOffset);
    addString(`5 0 obj\n<< /Length ${contentStreamBytes.length} >>\nstream\n`);
    addBytes(contentStreamBytes);
    addString('endstream\nendobj\n');

    // XRef Table
    const startXref = currentOffset;
    addString('xref\n0 6\n0000000000 65535 f \n');
    for (let i = 0; i < offsets.length; i++) {
        const offsetStr = String(offsets[i]).padStart(10, '0');
        addString(`${offsetStr} 00000 n \n`);
    }

    // Trailer
    addString(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`);

    return new Blob(parts as BlobPart[], { type: 'application/pdf' });
}

// Helper to safely load an image from URL
function loadImage(src: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

// Draw GIS North Arrow
function drawNorthArrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, size = 46) {
    ctx.save();
    // Label "N"
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('N', cx, cy - size - 4);

    // Compass Needle
    const halfWidth = size * 0.28;
    const tailLength = size * 0.38;

    // Top left half (black)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx - halfWidth, cy);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();

    // Top right half (white with black border)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + halfWidth, cy);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bottom left half (white with black border)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy + tailLength);
    ctx.lineTo(cx - halfWidth, cy);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bottom right half (black)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(cx, cy + tailLength);
    ctx.lineTo(cx + halfWidth, cy);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// Draw GIS Scale Bar: "7.5  0  7.5  15  22.5  30 km"
function drawScaleBar(ctx: CanvasRenderingContext2D, startX: number, startY: number) {
    ctx.save();
    const segWidth = 62;
    const barHeight = 12;
    const segments = 5; // -7.5 to 0, 0 to 7.5, 7.5 to 15, 15 to 22.5, 22.5 to 30

    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // Numbers above
    const tickLabels = ['7.5', '0', '7.5', '15', '22.5', '30 km'];
    for (let i = 0; i <= segments; i++) {
        const tx = startX + i * segWidth;
        ctx.fillText(tickLabels[i], tx, startY - 4);
    }

    // Alternating black and white bars
    for (let i = 0; i < segments; i++) {
        const bx = startX + i * segWidth;
        const isBlack = i % 2 === 0;

        ctx.fillStyle = isBlack ? '#000000' : '#ffffff';
        ctx.fillRect(bx, startY, segWidth, barHeight);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, startY, segWidth, barHeight);
    }

    ctx.restore();
}

async function renderSkpgReportCanvas(
    options: GenerateSkpgPdfOptions
): Promise<{ canvas: HTMLCanvasElement; canvasWidth: number; canvasHeight: number; slug: string; monthStr: string; year: number }> {
    const { items, selectedIndicator, month, year, monthName } = options;

    const monthStr = monthName || MONTH_NAMES_ID[month - 1] || `Bulan ${month}`;
    const isClimate = isClimateIndicator(selectedIndicator);

    // Compute dynamic status counts matching the attachment format across all 31 kecamatan
    const itemMap = new Map<string, SkpgKecamatanItem>();
    for (const item of items) {
        itemMap.set(item.kecamatan.toUpperCase(), item);
        if (item.kecamatan.toUpperCase() === 'TRISI') {
            itemMap.set('TERISI', item);
        } else if (item.kecamatan.toUpperCase() === 'TERISI') {
            itemMap.set('TRISI', item);
        }
    }

    let countAman = 0;
    let countWaspada = 0;
    let countRentan = 0;
    let countSiaga = 0;
    let countAwas = 0;

    for (const feature of INDRAMAYU_KECAMATAN_FEATURES) {
        const kecItem = itemMap.get(feature.name.toUpperCase()) || itemMap.get(feature.rawName.toUpperCase());
        const status = (
            (kecItem?.[selectedIndicator as keyof SkpgKecamatanItem] as string) ||
            kecItem?.ikb ||
            'AMAN'
        ).toUpperCase();

        if (status === 'AWAS') countAwas++;
        else if (status === 'SIAGA') countSiaga++;
        else if (status === 'RENTAN') {
            if (isClimate) countAwas++;
            else countRentan++;
        }
        else if (status === 'WASPADA') countWaspada++;
        else countAman++;
    }

    // High resolution canvas for A4 Landscape (2376 x 1680, aspect ratio ~1.414 : 1)
    const canvasWidth = 2376;
    const canvasHeight = 1680;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');

    // 1. Clean White Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Outer Border of Entire Document
    const outerX = 40;
    const outerY = 35;
    const outerW = canvasWidth - 80; // 2296
    const outerH = canvasHeight - 70; // 1610
    const outerRight = outerX + outerW; // 2336
    const outerBottom = outerY + outerH; // 1645
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(outerX, outerY, outerW, outerH);

    // Symmetrical outer margins: Atas, Bawah, Kiri, Kanan presisi 80px
    const marginOuter = 80;

    // Header Box (Top)
    const headerX = outerX + marginOuter; // 120 (Sejajar presisi dengan garis kiri peta)
    const headerY = outerY + marginOuter; // 115 (Margin atas simetris 80px)
    const layoutRight = outerRight - marginOuter; // 2256 (Margin kanan simetris 80px)
    const headerW = layoutRight - headerX; // 2136
    const headerH = 180;

    // Map Box (Bottom-Left) & Right Sidebar Box (Bottom-Right) definitions
    const gapHeaderToBoxes = 45;
    const mapBoxY = headerY + headerH + gapHeaderToBoxes; // 340
    const sidebarY = mapBoxY; // 340
    const contentBoxH = 1200; // Garis bawah Map Box & Sidebar Box 100% sejajar di y = 1540 (margin bawah 80px ke label koordinat)

    const mapBoxX = headerX; // 120 (Sejajar persis garis kiri header)
    const gapBetweenBoxes = 45;
    const sidebarW = 535;
    const mapBoxW = headerW - sidebarW - gapBetweenBoxes; // 1556
    const mapBoxH = contentBoxH;

    const sidebarX = mapBoxX + mapBoxW + gapBetweenBoxes; // 1721
    const sidebarH = contentBoxH; // Sama persis dengan tinggi mapBoxH agar garis bawah sejajar

    // Draw Top Header Box
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(headerX, headerY, headerW, headerH);

    // Load logos in parallel (prioritize /storage/bapanas_logo.png with cache buster, fallback to clean base64 data)
    const [bapanasLogo, indramayuLogo] = await Promise.all([
        loadImage('/storage/bapanas_logo.png?v=' + Date.now())
            .then((img) => img || loadImage('/bapanas_logo.png?v=' + Date.now()))
            .then((img) => img || loadImage(BAPANAS_LOGO_BASE64)),
        loadImage('/storage/indramayu_logo.png?v=2').then(
            (img) => img || loadImage('/indramayu_logo.png?v=2')
        ),
    ]);

    // Draw Bapanas logo on left of Header Box (balanced padding from the aligned left border)
    const finalBapanasLogo = bapanasLogo || (await loadImage(BAPANAS_LOGO_BASE64));
    let logoEndRight = headerX + 50;
    if (finalBapanasLogo) {
        const logoTargetHeight = 115;
        const logoAspect = finalBapanasLogo.width / finalBapanasLogo.height;
        const logoTargetWidth = logoTargetHeight * logoAspect;
        const logoX = headerX + 45; // Jarak dari garis kiri header yang sejajar peta
        const logoY = headerY + (headerH - logoTargetHeight) / 2;
        ctx.drawImage(finalBapanasLogo, logoX, logoY, logoTargetWidth, logoTargetHeight);
        logoEndRight = logoX + logoTargetWidth;
    }

    // Dynamic Title in Header Box (perfectly centered between logo and right edge)
    const { line1, line2 } = getPdfTitleLines(selectedIndicator, monthStr, year);

    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';

    const titleCenterX = logoEndRight + (layoutRight - logoEndRight) / 2;
    ctx.font = 'bold 35px Arial, sans-serif'; // Font judul baris 1
    ctx.fillText(line1, titleCenterX, headerY + 75);

    ctx.font = 'bold 30px Arial, sans-serif'; // Font judul baris 2
    ctx.fillText(line2, titleCenterX, headerY + 125);
    ctx.restore();

    // Draw Map Frame
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(mapBoxX, mapBoxY, mapBoxW, mapBoxH);

    // Coordinate Graticule Ticks along borders of Map Box
    ctx.save();
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillStyle = '#000000';

    // Top edge ticks & labels: 0.0, 5.0, 10.0, 15.0, 20.0
    const topTicks = [
        { pct: 0, label: '0.0' },
        { pct: 0.25, label: '5.0' },
        { pct: 0.5, label: '10.0' },
        { pct: 0.75, label: '15.0' },
        { pct: 1.0, label: '20.0' },
    ];
    topTicks.forEach((t) => {
        const tx = mapBoxX + t.pct * mapBoxW;
        ctx.beginPath();
        ctx.moveTo(tx, mapBoxY - 7);
        ctx.lineTo(tx, mapBoxY + 7);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(t.label, tx, mapBoxY - 10);
    });

    // Bottom edge ticks & labels: 0.0, 10.0, 15.0, 20.0
    const bottomTicks = [
        { pct: 0, label: '0.0' },
        { pct: 0.5, label: '10.0' },
        { pct: 0.75, label: '15.0' },
        { pct: 1.0, label: '20.0' },
    ];
    bottomTicks.forEach((t) => {
        const tx = mapBoxX + t.pct * mapBoxW;
        ctx.beginPath();
        ctx.moveTo(tx, mapBoxY + mapBoxH - 7);
        ctx.lineTo(tx, mapBoxY + mapBoxH + 7);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(t.label, tx, mapBoxY + mapBoxH + 11);
    });

    // Left edge ticks & labels: 0.0, 5.0, 10.0
    const leftTicks = [
        { pct: 0, label: '0.0' },
        { pct: 0.5, label: '5.0' },
        { pct: 1.0, label: '10.0' },
    ];
    leftTicks.forEach((t) => {
        const ty = mapBoxY + t.pct * mapBoxH;
        ctx.beginPath();
        ctx.moveTo(mapBoxX - 7, ty);
        ctx.lineTo(mapBoxX + 7, ty);
        ctx.stroke();
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.label, mapBoxX - 12, ty);
    });

    // Right edge ticks & labels: 10.0
    const tyRight = mapBoxY + 0.5 * mapBoxH;
    ctx.beginPath();
    ctx.moveTo(mapBoxX + mapBoxW - 7, tyRight);
    ctx.lineTo(mapBoxX + mapBoxW + 7, tyRight);
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('10.0', mapBoxX + mapBoxW + 12, tyRight);
    ctx.restore();

    // 5. Draw Dynamic SVG Map Polygons & Centroid Labels
    // Parse mainland viewBox: "-60 360 1120 800"
    const vbParts = INDRAMAYU_MAINLAND_VIEWBOX.split(' ').map(Number);
    const vbMinX = vbParts[0] ?? -60;
    const vbMinY = vbParts[1] ?? 360;
    const vbWidth = vbParts[2] ?? 1120;
    const vbHeight = vbParts[3] ?? 800;

    const mapPadding = 25;
    const innerW = mapBoxW - mapPadding * 2;
    const innerH = mapBoxH - mapPadding * 2;
    const scale = Math.min(innerW / vbWidth, innerH / vbHeight) * 0.98;

    const renderedW = vbWidth * scale;
    const renderedH = vbHeight * scale;
    const mapOffsetX = mapBoxX + mapPadding + (innerW - renderedW) / 2;
    const mapOffsetY = mapBoxY + mapPadding + (innerH - renderedH) / 2 - 10;

    // Status colors: matching official GIS Bapanas standard
    // AMAN = Vivid Green (#00D020), WASPADA = Yellow (#FFFF00), RENTAN = Vivid Red (#E31A1C)
    function getPolygonFillColor(status: string): string {
        switch (status) {
            case 'AWAS':
            case 'RENTAN':
                return '#E31A1C'; // Pure GIS Red
            case 'SIAGA':
                return '#FF7F00'; // Orange
            case 'WASPADA':
                return '#FFFF00'; // Pure GIS Yellow
            case 'AMAN':
            default:
                return '#00D020'; // Pure GIS Vivid Green
        }
    }

    ctx.save();
    // Clip inside map box
    ctx.beginPath();
    ctx.rect(mapBoxX + 1, mapBoxY + 1, mapBoxW - 2, mapBoxH - 2);
    ctx.clip();

    // Transform into SVG mainland coordinate space
    ctx.save();
    ctx.translate(mapOffsetX, mapOffsetY);
    ctx.scale(scale, scale);
    ctx.translate(-vbMinX, -vbMinY);

    // Draw polygons
    for (const feature of INDRAMAYU_KECAMATAN_FEATURES) {
        if (feature.centroid[1] < 360) continue;

        const kecItem = itemMap.get(feature.name.toUpperCase()) || itemMap.get(feature.rawName.toUpperCase());
        const status = (
            (kecItem?.[selectedIndicator as keyof SkpgKecamatanItem] as string) ||
            kecItem?.ikb ||
            'AMAN'
        ).toUpperCase();

        const fillColor = getPolygonFillColor(status);

        const path2d = new Path2D(feature.path);
        ctx.fillStyle = fillColor;
        ctx.fill(path2d);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.4 / scale;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke(path2d);
    }
    ctx.restore();

    // Draw Kecamatan text labels at centroids with crisp white halo outline
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const feature of INDRAMAYU_KECAMATAN_FEATURES) {
        if (feature.centroid[1] < 360) continue;

        const screenX = mapOffsetX + (feature.centroid[0] - vbMinX) * scale;
        const screenY = mapOffsetY + (feature.centroid[1] - vbMinY) * scale;

        let labelText = feature.name.toUpperCase();
        if (labelText === 'TRISI') labelText = 'TERISI';

        // Adjust font size for dense/small subdistricts
        if (['KEDOKAN BUNDER', 'SUKAGUMIWANG', 'GABUSWETAN', 'KANDANGHAUR'].includes(labelText)) {
            ctx.font = 'bold 10.5px Arial, sans-serif';
        } else if (['PATROL', 'SUKRA', 'SINDANG', 'ARAHAN', 'LELEA', 'SLIYEG'].includes(labelText)) {
            ctx.font = 'bold 11px Arial, sans-serif';
        } else {
            ctx.font = 'bold 12px Arial, sans-serif';
        }

        // White halo stroke
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.strokeText(labelText, screenX, screenY);

        // Black text
        ctx.fillStyle = '#000000';
        ctx.fillText(labelText, screenX, screenY);
    }

    // North Compass Arrow inside Map (Top Right)
    drawNorthArrow(ctx, mapBoxX + mapBoxW - 90, mapBoxY + 110, 48);

    // Scale Bar inside Map (Bottom Center-Right)
    drawScaleBar(ctx, mapBoxX + 460, mapBoxY + mapBoxH - 65);

    // Mini Legend Box inside Map (Bottom Left)
    const miniLegendX = mapBoxX + 45;
    ctx.save();

    if (isClimate) {
        // 4 Keterangan untuk Iklim / Bencana (Potensi Kering, Potensi Basah, Kondisi Iklim):
        // AMAN, WASPADA, SIAGA, AWAS
        const miniLegendY = mapBoxY + mapBoxH - 165;
        const legendItems = [
            { label: 'AMAN', color: '#00D020' },
            { label: 'WASPADA', color: '#FFFF00' },
            { label: 'SIAGA', color: '#FF7F00' },
            { label: 'AWAS', color: '#E31A1C' },
        ];

        legendItems.forEach((item, idx) => {
            const itemY = miniLegendY + idx * 30;
            ctx.fillStyle = item.color;
            ctx.fillRect(miniLegendX, itemY, 36, 20);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(miniLegendX, itemY, 36, 20);

            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.label, miniLegendX + 48, itemY + 10);
        });
    } else {
        // 3 Keterangan untuk Komposit & Aspek Pangan (Ketersediaan, Keterjangkauan, Pemanfaatan):
        // RENTAN, WASPADA, AMAN
        const miniLegendY = mapBoxY + mapBoxH - 145;
        const legendItems = [
            { label: 'RENTAN', color: '#E31A1C' },
            { label: 'WASPADA', color: '#FFFF00' },
            { label: 'AMAN', color: '#00D020' },
        ];

        legendItems.forEach((item, idx) => {
            const itemY = miniLegendY + idx * 36;
            ctx.fillStyle = item.color;
            ctx.fillRect(miniLegendX, itemY, 36, 24);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(miniLegendX, itemY, 36, 24);

            ctx.fillStyle = '#000000';
            ctx.font = 'bold 18px Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.label, miniLegendX + 48, itemY + 12);
        });
    }
    ctx.restore();

    ctx.restore(); // End map box clip

    // 6. Right Sidebar Panel (KETERANGAN & DINAS LOGO)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(sidebarX, sidebarY, sidebarW, sidebarH);

    // Top of Sidebar: Indramayu official logo (enlarged & centered)
    if (indramayuLogo) {
        const logoTargetHeight = 195;
        const logoAspect = indramayuLogo.width / indramayuLogo.height;
        const logoTargetWidth = logoTargetHeight * logoAspect;
        const logoCenterX = sidebarX + sidebarW / 2;
        const logoX = logoCenterX - logoTargetWidth / 2;
        const logoY = sidebarY + 45;
        ctx.drawImage(indramayuLogo, logoX, logoY, logoTargetWidth, logoTargetHeight);
    }

    // Sidebar: KETERANGAN Header & Dynamic Status breakdown (symmetric & well-spaced)
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const sideContentX = sidebarX + 95; // Symmetrical horizontal padding

    // Heading: KETERANGAN & Total Kecamatan
    const headingY = sidebarY + 295;
    ctx.font = 'bold 34px Arial, sans-serif';
    ctx.fillText('KETERANGAN :', sideContentX, headingY);

    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText(`Total Kecamatan : 31`, sideContentX, headingY + 54);

    if (isClimate) {
        // Filter Potensi Kering, Potensi Basah, Kondisi Iklim:
        // HANYA 4 STATUS (AMAN, WASPADA, SIAGA, AWAS) - Tanpa RENTAN
        const climateItems = [
            { label: 'AMAN', count: countAman, color: '#00D020' },
            { label: 'WASPADA', count: countWaspada, color: '#FFFF00' },
            { label: 'SIAGA', count: countSiaga, color: '#FF7F00' },
            { label: 'AWAS', count: countAwas, color: '#E31A1C' },
        ];

        const statusStartY = sidebarY + 415;
        const statusStepY = 125;

        climateItems.forEach((item, idx) => {
            const itemY = statusStartY + idx * statusStepY;
            ctx.fillStyle = item.color;
            ctx.fillRect(sideContentX, itemY, 52, 40);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(sideContentX, itemY, 52, 40);

            ctx.fillStyle = '#000000';
            ctx.font = 'bold 27px Arial, sans-serif';
            ctx.fillText(item.label, sideContentX + 68, itemY + 4);

            ctx.font = '23px Arial, sans-serif';
            ctx.fillText(`${item.count} Kecamatan`, sideContentX + 68, itemY + 44);
        });
    } else {
        // Filter Komposit, Ketersediaan, Keterjangkauan, Pemanfaatan:
        // TETAP 3 STATUS (RENTAN, WASPADA, AMAN)
        const standardItems = [
            { label: 'RENTAN', count: countRentan, color: '#E31A1C' },
            { label: 'WASPADA', count: countWaspada, color: '#FFFF00' },
            { label: 'AMAN', count: countAman, color: '#00D020' },
        ];

        const statusStartY = sidebarY + 440;
        const statusStepY = 155;

        standardItems.forEach((item, idx) => {
            const itemY = statusStartY + idx * statusStepY;
            ctx.fillStyle = item.color;
            ctx.fillRect(sideContentX, itemY, 52, 40);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(sideContentX, itemY, 52, 40);

            ctx.fillStyle = '#000000';
            ctx.font = 'bold 27px Arial, sans-serif';
            ctx.fillText(item.label, sideContentX + 68, itemY + 4);

            ctx.font = '23px Arial, sans-serif';
            ctx.fillText(`${item.count} Kecamatan`, sideContentX + 68, itemY + 44);
        });
    }

    // Bottom attribution in Sidebar: symmetrically balanced
    const footerY = sidebarY + 980;
    ctx.font = '20px Arial, sans-serif';
    ctx.fillText('Disusun oleh :', sideContentX, footerY);

    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText('DINAS KETAHANAN PANGAN', sideContentX, footerY + 32);
    ctx.fillText('DAN PERTANIAN', sideContentX, footerY + 62);
    ctx.fillText('KABUPATEN INDRAMAYU', sideContentX, footerY + 92);

    ctx.restore();

    const slug =
        selectedIndicator === 'ikb'
            ? 'SKPG_Komposit'
            : isClimate
            ? selectedIndicator.toUpperCase()
            : `Aspek_${selectedIndicator.toUpperCase()}`;

    return { canvas, canvasWidth, canvasHeight, slug, monthStr, year };
}

export async function generateSkpgPdfReport(options: GenerateSkpgPdfOptions): Promise<void> {
    const { canvas, canvasWidth, canvasHeight, slug, monthStr, year } = await renderSkpgReportCanvas(options);

    // Convert Canvas to JPEG and Build A4 Landscape PDF
    const jpegBlob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
            (b) => {
                if (b) resolve(b);
                else reject(new Error('Canvas toBlob failed'));
            },
            'image/jpeg',
            0.96
        );
    });

    const arrayBuffer = await jpegBlob.arrayBuffer();
    const jpegBytes = new Uint8Array(arrayBuffer);

    // Package into compliant A4 Landscape PDF
    const pdfBlob = createPdfFromJpeg(jpegBytes, canvasWidth, canvasHeight);

    // Trigger File Download
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `Peta_${slug}_Indramayu_${monthStr}_${year}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
    }, 10000);
}

export async function generateSkpgPngReport(options: GenerateSkpgPdfOptions): Promise<void> {
    const { canvas, slug, monthStr, year } = await renderSkpgReportCanvas(options);

    const pngBlob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
            (b) => {
                if (b) resolve(b);
                else reject(new Error('Canvas toBlob failed'));
            },
            'image/png'
        );
    });

    // Trigger File Download
    const downloadUrl = URL.createObjectURL(pngBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `Peta_${slug}_Indramayu_${monthStr}_${year}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
    }, 10000);
}

