<?php

namespace App\Services;

use App\Models\Commodity;
use Illuminate\Support\Collection;
use ZipArchive;

class SimpleExcelService
{
    /**
     * Generate an Excel .xlsx binary string for consumer prices template.
     *
     * @param  Collection<int, Commodity>  $commodities
     * @param  array<int, float|int|string>  $prices
     */
    public function generateXlsxTemplate(Collection $commodities, ?string $selectedDate = null, array $prices = []): string
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'dkpp_tmpl_');
        if ($tempFile === false) {
            throw new \RuntimeException('Gagal membuat temporary file untuk template Excel.');
        }

        // Ensure temp file can be created as a zip
        @unlink($tempFile);
        $zipPath = $tempFile.'.xlsx';

        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException('Gagal menginisialisasi file XLSX.');
        }

        // 1. [Content_Types].xml
        $contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            .'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            .'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            .'</Types>';
        $zip->addFromString('[Content_Types].xml', $contentTypes);

        // 2. _rels/.rels
        $rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            .'</Relationships>';
        $zip->addFromString('_rels/.rels', $rootRels);

        // 3. xl/_rels/workbook.xml.rels
        $wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            .'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            .'</Relationships>';
        $zip->addFromString('xl/_rels/workbook.xml.rels', $wbRels);

        // 4. xl/workbook.xml
        $workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            .'<sheets><sheet name="Format Harga Konsumen" sheetId="1" r:id="rId1"/></sheets>'
            .'</workbook>';
        $zip->addFromString('xl/workbook.xml', $workbook);

        // 5. xl/styles.xml
        $styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<fonts count="2">'
            .'<font><sz val="11"/><name val="Calibri"/></font>'
            .'<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>'
            .'</fonts>'
            .'<fills count="3">'
            .'<fill><patternFill patternType="none"/></fill>'
            .'<fill><patternFill patternType="gray125"/></fill>'
            .'<fill><patternFill patternType="solid"><fgColor rgb="FF059669"/></patternFill></fill>'
            .'</fills>'
            .'<borders count="2">'
            .'<border><left/><right/><top/><bottom/><diagonal/></border>'
            .'<border>'
            .'<left style="thin"><color rgb="FFD1D5DB"/></left>'
            .'<right style="thin"><color rgb="FFD1D5DB"/></right>'
            .'<top style="thin"><color rgb="FFD1D5DB"/></top>'
            .'<bottom style="thin"><color rgb="FFD1D5DB"/></bottom>'
            .'</border>'
            .'</borders>'
            .'<cellStyleXfs count="1">'
            .'<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>'
            .'</cellStyleXfs>'
            .'<cellXfs count="3">'
            .'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
            .'<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>'
            .'<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>'
            .'</cellXfs>'
            .'</styleSheet>';
        $zip->addFromString('xl/styles.xml', $styles);

        // 6. xl/worksheets/sheet1.xml
        $sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<cols>'
            .'<col min="1" max="1" width="6" customWidth="1"/>'
            .'<col min="2" max="2" width="38" customWidth="1"/>'
            .'<col min="3" max="3" width="10" customWidth="1"/>'
            .'<col min="4" max="4" width="18" customWidth="1"/>'
            .'<col min="5" max="5" width="22" customWidth="1"/>'
            .'<col min="6" max="6" width="30" customWidth="1"/>'
            .'</cols>'
            .'<sheetData>';

        // Header Row
        $sheetXml .= '<row r="1" ht="26" customHeight="1">'
            .'<c r="A1" s="1" t="inlineStr"><is><t>No</t></is></c>'
            .'<c r="B1" s="1" t="inlineStr"><is><t>Nama Komoditas</t></is></c>'
            .'<c r="C1" s="1" t="inlineStr"><is><t>Satuan</t></is></c>'
            .'<c r="D1" s="1" t="inlineStr"><is><t>HET Acuan (Rp)</t></is></c>'
            .'<c r="E1" s="1" t="inlineStr"><is><t>Harga Konsumen (Rp)</t></is></c>'
            .'<c r="F1" s="1" t="inlineStr"><is><t>Catatan</t></is></c>'
            .'</row>';

        $rowIdx = 2;
        foreach ($commodities as $idx => $commodity) {
            $orderNo = $commodity->order ?? ($idx + 1);
            $nameEsc = htmlspecialchars($commodity->name, ENT_XML1, 'UTF-8');
            $unitEsc = htmlspecialchars($commodity->unit, ENT_XML1, 'UTF-8');

            $hetPrice = null;
            if ($selectedDate) {
                $het = $commodity->hetAt($selectedDate);
                $hetPrice = $het ? (float) $het->price : null;
            }

            $hetCellXml = $hetPrice !== null
                ? '<c r="D'.$rowIdx.'" s="2"><v>'.$hetPrice.'</v></c>'
                : '<c r="D'.$rowIdx.'" s="2" t="inlineStr"><is><t>-</t></is></c>';

            $customPrice = $prices[$commodity->id] ?? null;
            $priceCellXml = ($customPrice !== null && $customPrice !== '')
                ? '<c r="E'.$rowIdx.'" s="2"><v>'.((float) $customPrice).'</v></c>'
                : '<c r="E'.$rowIdx.'" s="2"/>';

            $sheetXml .= '<row r="'.$rowIdx.'">'
                .'<c r="A'.$rowIdx.'" s="2"><v>'.$orderNo.'</v></c>'
                .'<c r="B'.$rowIdx.'" s="2" t="inlineStr"><is><t>'.$nameEsc.'</t></is></c>'
                .'<c r="C'.$rowIdx.'" s="2" t="inlineStr"><is><t>'.$unitEsc.'</t></is></c>'
                .$hetCellXml
                .$priceCellXml
                .'<c r="F'.$rowIdx.'" s="2"/>'
                .'</row>';

            $rowIdx++;
        }

        $sheetXml .= '</sheetData></worksheet>';
        $zip->addFromString('xl/worksheets/sheet1.xml', $sheetXml);

        $zip->close();

        $content = file_get_contents($zipPath);
        @unlink($zipPath);

        if ($content === false) {
            throw new \RuntimeException('Gagal membaca file template XLSX yang dibuat.');
        }

        return $content;
    }

    /**
     * Generate a CSV string with UTF-8 BOM for consumer prices template.
     *
     * @param  Collection<int, Commodity>  $commodities
     * @param  array<int, float|int|string>  $prices
     */
    public function generateCsvTemplate(Collection $commodities, ?string $selectedDate = null, array $prices = []): string
    {
        // UTF-8 BOM so Excel opens it with proper encoding
        $output = "\xEF\xBB\xBF";

        // Header
        $output .= "No;Nama Komoditas;Satuan;HET Acuan (Rp);Harga Konsumen (Rp);Catatan\r\n";

        foreach ($commodities as $idx => $commodity) {
            $orderNo = $commodity->order ?? ($idx + 1);
            $hetPrice = '';
            if ($selectedDate) {
                $het = $commodity->hetAt($selectedDate);
                if ($het) {
                    $hetPrice = (string) (float) $het->price;
                }
            }

            $userPrice = $prices[$commodity->id] ?? '';

            $line = [
                $orderNo,
                '"'.str_replace('"', '""', $commodity->name).'"',
                $commodity->unit,
                $hetPrice,
                $userPrice,
                '', // Catatan
            ];

            $output .= implode(';', $line)."\r\n";
        }

        return $output;
    }

    /**
     * Parse an uploaded file (.xlsx, .csv, .txt, .tsv) into raw tabular rows.
     *
     * @return array<int, array<int, string>>
     */
    public function parseFile(string $filePath, string $extension): array
    {
        $ext = strtolower($extension);

        if ($ext === 'xlsx') {
            return $this->parseXlsxFile($filePath);
        }

        // CSV, TSV, TXT
        return $this->parseDelimitedFile($filePath);
    }

    /**
     * Parse an OpenXML .xlsx file.
     *
     * @return array<int, array<int, string>>
     */
    protected function parseXlsxFile(string $filePath): array
    {
        $zip = new ZipArchive;
        if ($zip->open($filePath) !== true) {
            throw new \RuntimeException('Format berkas Excel .xlsx tidak valid atau rusak.');
        }

        // Read shared strings if present
        $sharedStrings = [];
        $sharedXmlContent = $zip->getFromName('xl/sharedStrings.xml');
        if ($sharedXmlContent) {
            $sharedXml = @simplexml_load_string($sharedXmlContent);
            if ($sharedXml && isset($sharedXml->si)) {
                foreach ($sharedXml->si as $si) {
                    if (isset($si->t)) {
                        $sharedStrings[] = (string) $si->t;
                    } elseif (isset($si->r)) {
                        $text = '';
                        foreach ($si->r as $r) {
                            $text .= (string) $r->t;
                        }
                        $sharedStrings[] = $text;
                    } else {
                        $sharedStrings[] = '';
                    }
                }
            }
        }

        // Locate first worksheet
        $sheetXmlContent = $zip->getFromName('xl/worksheets/sheet1.xml');
        if (! $sheetXmlContent) {
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $name = $zip->getNameIndex($i);
                if ($name !== false && str_starts_with($name, 'xl/worksheets/sheet') && str_ends_with($name, '.xml')) {
                    $sheetXmlContent = $zip->getFromName($name);
                    break;
                }
            }
        }

        if (! $sheetXmlContent) {
            $zip->close();
            throw new \RuntimeException('Lembar kerja (worksheet) tidak ditemukan dalam berkas Excel.');
        }

        $sheetXml = @simplexml_load_string($sheetXmlContent);
        $zip->close();

        if (! $sheetXml || ! isset($sheetXml->sheetData)) {
            throw new \RuntimeException('Struktur lembar kerja Excel tidak dapat dibaca.');
        }

        $rows = [];
        foreach ($sheetXml->sheetData->row as $row) {
            $rowData = [];
            foreach ($row->c as $cell) {
                $cellType = (string) ($cell['t'] ?? '');
                $val = '';
                if ($cellType === 's') {
                    $idx = (int) $cell->v;
                    $val = $sharedStrings[$idx] ?? '';
                } elseif ($cellType === 'inlineStr') {
                    $val = (string) ($cell->is->t ?? '');
                } else {
                    $val = (string) ($cell->v ?? '');
                }

                $cellRef = (string) ($cell['r'] ?? '');
                if (preg_match('/^([A-Z]+)(\d+)$/', $cellRef, $matches)) {
                    $colLetter = $matches[1];
                    $colIndex = 0;
                    for ($k = 0; $k < strlen($colLetter); $k++) {
                        $colIndex = $colIndex * 26 + (ord($colLetter[$k]) - ord('A') + 1);
                    }
                    $rowData[$colIndex - 1] = trim($val);
                } else {
                    $rowData[] = trim($val);
                }
            }

            if (! empty($rowData)) {
                $maxKey = max(array_keys($rowData));
                $denseRow = [];
                for ($c = 0; $c <= $maxKey; $c++) {
                    $denseRow[] = $rowData[$c] ?? '';
                }
                $rows[] = $denseRow;
            }
        }

        return $rows;
    }

    /**
     * Parse CSV, TSV, or TXT file with auto delimiter detection.
     *
     * @return array<int, array<int, string>>
     */
    protected function parseDelimitedFile(string $filePath): array
    {
        $content = file_get_contents($filePath);
        if ($content === false) {
            throw new \RuntimeException('Gagal membaca berkas CSV.');
        }

        // Remove UTF-8 BOM if present
        if (str_starts_with($content, "\xEF\xBB\xBF")) {
            $content = substr($content, 3);
        }

        $lines = preg_split('/\r\n|\r|\n/', trim($content));
        if (empty($lines)) {
            return [];
        }

        // Detect delimiter: semicolon, comma, or tab
        $sample = $lines[0];
        $semicolonCount = substr_count($sample, ';');
        $commaCount = substr_count($sample, ',');
        $tabCount = substr_count($sample, "\t");

        $delimiter = ';';
        if ($tabCount > $semicolonCount && $tabCount > $commaCount) {
            $delimiter = "\t";
        } elseif ($commaCount > $semicolonCount) {
            $delimiter = ',';
        }

        $rows = [];
        foreach ($lines as $line) {
            if (trim($line) === '') {
                continue;
            }
            $parsed = str_getcsv($line, $delimiter);
            $rows[] = array_map('trim', $parsed);
        }

        return $rows;
    }

    /**
     * Match parsed tabular rows against the 25 master commodities.
     *
     * @param  array<int, array<int, string>>  $rawRows
     * @param  Collection<int, Commodity>  $commodities
     * @return array{
     *     matched: array<int, array{commodity_id: int, commodity_name: string, price: float, notes: ?string}>,
     *     skipped_count: int,
     *     total_detected: int
     * }
     */
    public function matchCommodityPrices(array $rawRows, Collection $commodities): array
    {
        if (empty($rawRows)) {
            return [
                'matched' => [],
                'skipped_count' => 0,
                'total_detected' => 0,
            ];
        }

        // Index commodities by slug, normalized name, and order
        $byOrder = $commodities->keyBy('order');
        $byNormalizedName = [];
        foreach ($commodities as $commodity) {
            $cleanName = $this->normalizeName($commodity->name);
            $byNormalizedName[$cleanName] = $commodity;
        }

        $matched = [];
        $skippedCount = 0;

        // Check if first row is a header
        $firstRowText = strtolower(implode(' ', $rawRows[0]));
        $hasHeader = str_contains($firstRowText, 'komoditas')
            || str_contains($firstRowText, 'harga')
            || str_contains($firstRowText, 'nama')
            || str_contains($firstRowText, 'satuan');

        $dataRows = $hasHeader ? array_slice($rawRows, 1) : $rawRows;

        // If user pastes or provides a single column of pure numbers (exactly matching the 25 commodities in order)
        $isSingleColumn = true;
        foreach ($dataRows as $r) {
            if (count($r) > 1 && $r[1] !== '') {
                $isSingleColumn = false;
                break;
            }
        }

        if ($isSingleColumn) {
            // Sequential mapping row 0..24 -> commodity 1..25
            foreach ($dataRows as $idx => $row) {
                $commodity = $commodities->values()->get($idx);
                if (! $commodity) {
                    continue;
                }

                $rawPrice = $row[0] ?? '';
                $parsedPrice = $this->parsePriceValue($rawPrice);
                if ($parsedPrice !== null && $parsedPrice > 0) {
                    $matched[] = [
                        'commodity_id' => $commodity->id,
                        'commodity_name' => $commodity->name,
                        'price' => $parsedPrice,
                        'notes' => null,
                    ];
                } else {
                    $skippedCount++;
                }
            }

            return [
                'matched' => $matched,
                'skipped_count' => $skippedCount,
                'total_detected' => count($matched),
            ];
        }

        // Multi-column matching
        foreach ($dataRows as $idx => $row) {
            $rowCommodity = null;
            $rawPrice = '';
            $notes = null;

            // Try matching commodity name across columns (usually col 1 or col 0)
            foreach ($row as $colIdx => $colVal) {
                $normVal = $this->normalizeName($colVal);
                if (isset($byNormalizedName[$normVal])) {
                    $rowCommodity = $byNormalizedName[$normVal];
                    break;
                }
            }

            // If not found by name, check if column 0 is a number 1..25 matching commodity order
            if (! $rowCommodity && isset($row[0]) && is_numeric($row[0])) {
                $orderNum = (int) $row[0];
                if (isset($byOrder[$orderNum])) {
                    $rowCommodity = $byOrder[$orderNum];
                }
            }

            // If still not matched, fallback to row position index
            if (! $rowCommodity) {
                $rowCommodity = $commodities->values()->get($idx);
            }

            if (! $rowCommodity) {
                $skippedCount++;

                continue;
            }

            // Extract price:
            // Standard template columns:
            // Col 0: No | Col 1: Nama | Col 2: Satuan | Col 3: HET | Col 4: Harga Konsumen | Col 5: Catatan
            if (isset($row[4]) && $this->parsePriceValue($row[4]) !== null) {
                $rawPrice = $row[4];
                $notes = $row[5] ?? null;
            } elseif (isset($row[3]) && $this->parsePriceValue($row[3]) !== null && ! isset($row[4])) {
                // Formats with 4 columns: No, Name, Unit, Price
                $rawPrice = $row[3];
            } elseif (isset($row[2]) && $this->parsePriceValue($row[2]) !== null && ! isset($row[3])) {
                // Formats with 3 columns: No, Name, Price
                $rawPrice = $row[2];
            } elseif (isset($row[1]) && $this->parsePriceValue($row[1]) !== null) {
                // Formats with 2 columns: Name, Price
                $rawPrice = $row[1];
                $notes = $row[2] ?? null;
            } else {
                // Scan columns from right to left for a valid price number
                for ($c = count($row) - 1; $c >= 0; $c--) {
                    if ($this->parsePriceValue($row[$c]) !== null) {
                        $rawPrice = $row[$c];
                        break;
                    }
                }
            }

            $parsedPrice = $this->parsePriceValue($rawPrice);
            if ($parsedPrice !== null && $parsedPrice > 0) {
                $matched[] = [
                    'commodity_id' => $rowCommodity->id,
                    'commodity_name' => $rowCommodity->name,
                    'price' => $parsedPrice,
                    'notes' => $notes !== '' ? $notes : null,
                ];
            } else {
                $skippedCount++;
            }
        }

        return [
            'matched' => $matched,
            'skipped_count' => $skippedCount,
            'total_detected' => count($matched),
        ];
    }

    /**
     * Clean and parse Indonesian currency/number strings to float.
     * E.g. "Rp 14.500", "14500", "14.500,00", "14,500".
     */
    public function parsePriceValue(?string $val): ?float
    {
        if ($val === null || trim($val) === '') {
            return null;
        }

        $cleaned = trim($val);
        // Remove currency prefixes
        $cleaned = preg_replace('/^(rp|idr)\.?\s*/i', '', $cleaned);
        $cleaned = trim((string) $cleaned);

        // If formatted as Indonesian dot thousand separator: 14.500 or 14.500,00
        if (preg_match('/^\d{1,3}(\.\d{3})+(,\d+)?$/', $cleaned)) {
            $cleaned = str_replace('.', '', $cleaned);
            $cleaned = str_replace(',', '.', $cleaned);
        } elseif (preg_match('/^\d{1,3}(,\d{3})+(\.\d+)?$/', $cleaned)) {
            // US format: 14,500.00
            $cleaned = str_replace(',', '', $cleaned);
        } else {
            // Simple comma decimal: 14500,50
            $cleaned = str_replace(',', '.', $cleaned);
        }

        // Remove any other unwanted characters except digits and decimal dot
        $cleaned = preg_replace('/[^\d.]/', '', (string) $cleaned);

        if (! is_numeric($cleaned)) {
            return null;
        }

        $result = (float) $cleaned;

        return $result > 0 ? round($result, 2) : null;
    }

    /**
     * Normalize a commodity name for fuzzy comparison.
     */
    protected function normalizeName(string $name): string
    {
        $name = strtolower($name);
        $name = preg_replace('/[^a-z0-9]/', '', $name);

        return (string) $name;
    }
}
