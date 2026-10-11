<?php

namespace App\Services;

use App\Models\Commodity;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use ZipArchive;

class SimpleExcelService
{
    /**
     * Convert 1-based column index to Excel column letter (e.g. 1 -> A, 27 -> AA).
     */
    public function getColumnLetter(int $colNumber): string
    {
        $letter = '';
        while ($colNumber > 0) {
            $remainder = ($colNumber - 1) % 26;
            $letter = chr(65 + $remainder).$letter;
            $colNumber = intdiv($colNumber - 1, 26);
        }

        return $letter;
    }

    /**
     * Resolve an array of dates from start date and days count (up to 31 days).
     *
     * @param  int|array<int, string>  $days
     * @return array<int, string>
     */
    public function resolveDateRange(?string $selectedDate = null, int|array $days = 1): array
    {
        if (is_array($days)) {
            $dates = array_values(array_unique(array_filter($days)));

            return array_slice($dates, 0, 31);
        }

        $base = $selectedDate ? Carbon::parse($selectedDate) : now();
        $daysCount = max(1, min(31, $days));
        $dates = [];
        for ($i = 0; $i < $daysCount; $i++) {
            $dates[] = $base->copy()->addDays($i)->format('Y-m-d');
        }

        return $dates;
    }

    /**
     * Generate an Excel .xlsx binary string for consumer prices template.
     * Supports 1 day, 1 week (7 days), or up to 31 days (1 month).
     *
     * @param  Collection<int, Commodity>  $commodities
     * @param  array<int|string, mixed>  $prices
     * @param  int|array<int, string>  $days
     */
    public function generateXlsxTemplate(Collection $commodities, ?string $selectedDate = null, array $prices = [], int|array $days = 1): string
    {
        $dates = $this->resolveDateRange($selectedDate, $days);
        $isMultiDay = count($dates) > 1;

        $tempFile = tempnam(sys_get_temp_dir(), 'dkpp_tmpl_');
        if ($tempFile === false) {
            throw new \RuntimeException('Gagal membuat temporary file untuk template Excel.');
        }

        // Ensure temp file can be created as a zip
        @unlink($tempFile);
        $zipPath = $tempFile.'.xlsx';

        $zip = new ZipArchive;
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
            .'<col min="4" max="4" width="18" customWidth="1"/>';

        for ($c = 5; $c < 5 + count($dates); $c++) {
            $sheetXml .= '<col min="'.$c.'" max="'.$c.'" width="16" customWidth="1"/>';
        }
        $notesColIdx = 5 + count($dates);
        $sheetXml .= '<col min="'.$notesColIdx.'" max="'.$notesColIdx.'" width="25" customWidth="1"/>'
            .'</cols>'
            .'<sheetData>';

        // Header Row
        $sheetXml .= '<row r="1" ht="26" customHeight="1">'
            .'<c r="A1" s="1" t="inlineStr"><is><t>No</t></is></c>'
            .'<c r="B1" s="1" t="inlineStr"><is><t>Nama Komoditas</t></is></c>'
            .'<c r="C1" s="1" t="inlineStr"><is><t>Satuan</t></is></c>'
            .'<c r="D1" s="1" t="inlineStr"><is><t>HET Acuan (Rp)</t></is></c>';

        if (! $isMultiDay) {
            $sheetXml .= '<c r="E1" s="1" t="inlineStr"><is><t>Harga Konsumen (Rp)</t></is></c>';
        } else {
            foreach ($dates as $idx => $dateStr) {
                $colLetter = $this->getColumnLetter(5 + $idx);
                $sheetXml .= '<c r="'.$colLetter.'1" s="1" t="inlineStr"><is><t>Tgl '.$dateStr.'</t></is></c>';
            }
        }
        $notesLetter = $this->getColumnLetter($notesColIdx);
        $sheetXml .= '<c r="'.$notesLetter.'1" s="1" t="inlineStr"><is><t>Catatan</t></is></c></row>';

        $rowIdx = 2;
        foreach ($commodities as $idx => $commodity) {
            $orderNo = $commodity->order ?? ($idx + 1);
            $nameEsc = htmlspecialchars($commodity->name, ENT_XML1, 'UTF-8');
            $unitEsc = htmlspecialchars($commodity->unit, ENT_XML1, 'UTF-8');

            $hetPrice = null;
            $refDate = $dates[0] ?? $selectedDate;
            if ($refDate) {
                $het = $commodity->hetAt($refDate);
                $hetPrice = $het ? (float) $het->price : null;
            }

            $hetCellXml = $hetPrice !== null
                ? '<c r="D'.$rowIdx.'" s="2"><v>'.$hetPrice.'</v></c>'
                : '<c r="D'.$rowIdx.'" s="2" t="inlineStr"><is><t>-</t></is></c>';

            $sheetXml .= '<row r="'.$rowIdx.'">'
                .'<c r="A'.$rowIdx.'" s="2"><v>'.$orderNo.'</v></c>'
                .'<c r="B'.$rowIdx.'" s="2" t="inlineStr"><is><t>'.$nameEsc.'</t></is></c>'
                .'<c r="C'.$rowIdx.'" s="2" t="inlineStr"><is><t>'.$unitEsc.'</t></is></c>'
                .$hetCellXml;

            if (! $isMultiDay) {
                $customPrice = $prices[$commodity->id] ?? null;
                $priceCellXml = ($customPrice !== null && $customPrice !== '')
                    ? '<c r="E'.$rowIdx.'" s="2"><v>'.((float) $customPrice).'</v></c>'
                    : '<c r="E'.$rowIdx.'" s="2"/>';
                $sheetXml .= $priceCellXml;
            } else {
                foreach ($dates as $dIdx => $dateStr) {
                    $colLetter = $this->getColumnLetter(5 + $dIdx);
                    $customPrice = null;
                    if (isset($prices[$dateStr][$commodity->id])) {
                        $customPrice = $prices[$dateStr][$commodity->id];
                    } elseif (isset($prices[$commodity->id]) && ! is_array($prices[$commodity->id])) {
                        $customPrice = $prices[$commodity->id];
                    }
                    $priceCellXml = ($customPrice !== null && $customPrice !== '')
                        ? '<c r="'.$colLetter.$rowIdx.'" s="2"><v>'.((float) $customPrice).'</v></c>'
                        : '<c r="'.$colLetter.$rowIdx.'" s="2"/>';
                    $sheetXml .= $priceCellXml;
                }
            }

            $notesLetter = $this->getColumnLetter($notesColIdx);
            $sheetXml .= '<c r="'.$notesLetter.$rowIdx.'" s="2"/>'
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
     * Supports 1 day, 1 week (7 days), or up to 31 days (1 month).
     *
     * @param  Collection<int, Commodity>  $commodities
     * @param  array<int|string, mixed>  $prices
     * @param  int|array<int, string>  $days
     */
    public function generateCsvTemplate(Collection $commodities, ?string $selectedDate = null, array $prices = [], int|array $days = 1): string
    {
        $dates = $this->resolveDateRange($selectedDate, $days);
        $isMultiDay = count($dates) > 1;

        // UTF-8 BOM so Excel opens it with proper encoding
        $output = "\xEF\xBB\xBF";

        // Header
        if (! $isMultiDay) {
            $output .= "No;Nama Komoditas;Satuan;HET Acuan (Rp);Harga Konsumen (Rp);Catatan\r\n";
        } else {
            $dateHeaders = array_map(fn ($d) => "Tgl {$d}", $dates);
            $output .= 'No;Nama Komoditas;Satuan;HET Acuan (Rp);'.implode(';', $dateHeaders).";Catatan\r\n";
        }

        foreach ($commodities as $idx => $commodity) {
            $orderNo = $commodity->order ?? ($idx + 1);
            $refDate = $dates[0] ?? $selectedDate;
            $hetPrice = '';
            if ($refDate) {
                $het = $commodity->hetAt($refDate);
                if ($het) {
                    $hetPrice = (string) (float) $het->price;
                }
            }

            $line = [
                $orderNo,
                '"'.str_replace('"', '""', $commodity->name).'"',
                $commodity->unit,
                $hetPrice,
            ];

            if (! $isMultiDay) {
                $userPrice = $prices[$commodity->id] ?? '';
                $line[] = $userPrice;
            } else {
                foreach ($dates as $dateStr) {
                    $customPrice = '';
                    if (isset($prices[$dateStr][$commodity->id])) {
                        $customPrice = (string) $prices[$dateStr][$commodity->id];
                    } elseif (isset($prices[$commodity->id]) && ! is_array($prices[$commodity->id])) {
                        $customPrice = (string) $prices[$commodity->id];
                    }
                    $line[] = $customPrice;
                }
            }

            $line[] = ''; // Catatan
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
     * Supports single-day and multi-day (1 week / 7 days up to 31 days / 1 month).
     *
     * @param  array<int, array<int, string>>  $rawRows
     * @param  Collection<int, Commodity>  $commodities
     * @return array{
     *     matched: array<int, array{commodity_id: int, commodity_name: string, recorded_date: string, price: float, notes: ?string}>,
     *     dates: array<int, string>,
     *     skipped_count: int,
     *     total_detected: int
     * }
     */
    public function matchCommodityPrices(
        array $rawRows,
        Collection $commodities,
        ?string $defaultDate = null,
        int $maxDays = 31
    ): array {
        $defaultDate = $defaultDate ?: now()->format('Y-m-d');

        if (empty($rawRows)) {
            return [
                'matched' => [],
                'dates' => [],
                'skipped_count' => 0,
                'total_detected' => 0,
            ];
        }

        // Check if first row is a header
        $firstRowText = strtolower(implode(' ', $rawRows[0] ?? []));
        $hasHeader = str_contains($firstRowText, 'komoditas')
            || str_contains($firstRowText, 'harga')
            || str_contains($firstRowText, 'nama')
            || str_contains($firstRowText, 'satuan')
            || str_contains($firstRowText, 'tgl')
            || str_contains($firstRowText, 'tanggal')
            || str_contains($firstRowText, 'price');

        // Extract any date headers from row 0
        $headerDates = [];
        if ($hasHeader && isset($rawRows[0])) {
            foreach ($rawRows[0] as $colIdx => $colVal) {
                $parsedDate = $this->extractDateFromText($colVal, $defaultDate);
                if ($parsedDate !== null) {
                    $headerDates[$colIdx] = $parsedDate;
                }
            }
        }

        $dataRows = $hasHeader ? array_slice($rawRows, 1) : $rawRows;
        // Filter empty rows
        $dataRows = array_values(array_filter($dataRows, function ($r) {
            foreach ($r as $val) {
                if (trim((string) $val) !== '') {
                    return true;
                }
            }

            return false;
        }));

        if (empty($dataRows)) {
            return [
                'matched' => [],
                'dates' => [],
                'skipped_count' => 0,
                'total_detected' => 0,
            ];
        }

        // Check if the data rows are a pure number grid (e.g. copied directly without commodity text)
        $hasAlphaText = false;
        foreach ($dataRows as $r) {
            foreach ($r as $cVal) {
                $stripped = preg_replace('/^(rp|idr)\.?\s*/i', '', trim((string) $cVal));
                if (preg_match('/[a-zA-Z]/', (string) $stripped)) {
                    $hasAlphaText = true;
                    break 2;
                }
            }
        }

        $matched = [];
        $skippedCount = 0;

        if (! $hasAlphaText) {
            // Pure numbers matrix: row 0..24 mapped to commodity 1..25
            $maxCols = 0;
            foreach ($dataRows as $r) {
                $maxCols = max($maxCols, count($r));
            }
            $colsToRead = max(1, min($maxCols, $maxDays));

            $colDates = [];
            for ($c = 0; $c < $colsToRead; $c++) {
                $colDates[$c] = $headerDates[$c] ?? Carbon::parse($defaultDate)->addDays($c)->format('Y-m-d');
            }

            foreach ($dataRows as $idx => $row) {
                $commodity = $commodities->values()->get($idx);
                if (! $commodity) {
                    $skippedCount++;

                    continue;
                }

                for ($c = 0; $c < $colsToRead; $c++) {
                    $rawPrice = $row[$c] ?? '';
                    $parsedPrice = $this->parsePriceValue($rawPrice);
                    if ($parsedPrice !== null && $parsedPrice > 0) {
                        $matched[] = [
                            'commodity_id' => $commodity->id,
                            'commodity_name' => $commodity->name,
                            'recorded_date' => $colDates[$c],
                            'price' => $parsedPrice,
                            'notes' => null,
                        ];
                    } else {
                        $skippedCount++;
                    }
                }
            }

            $uniqueDates = array_values(array_unique(array_column($matched, 'recorded_date')));
            sort($uniqueDates);

            return [
                'matched' => $matched,
                'dates' => $uniqueDates,
                'skipped_count' => $skippedCount,
                'total_detected' => count($matched),
            ];
        }

        // Multi-column matching with commodity names & text
        $byOrder = $commodities->keyBy('order');
        $byNormalizedName = [];
        foreach ($commodities as $commodity) {
            $cleanName = $this->normalizeName($commodity->name);
            $byNormalizedName[$cleanName] = $commodity;
        }

        foreach ($dataRows as $idx => $row) {
            $rowCommodity = null;

            // Try matching commodity name across columns (usually col 1 or col 0)
            foreach ($row as $colVal) {
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

            // Fallback to row position index
            if (! $rowCommodity) {
                $rowCommodity = $commodities->values()->get($idx);
            }

            if (! $rowCommodity) {
                $skippedCount++;

                continue;
            }

            // If header had dates for specific columns, extract prices for those dates
            if (! empty($headerDates)) {
                $recordedInThisRow = 0;
                foreach ($headerDates as $colIdx => $dateStr) {
                    $rawPrice = $row[$colIdx] ?? '';
                    $parsedPrice = $this->parsePriceValue($rawPrice);
                    if ($parsedPrice !== null && $parsedPrice > 0) {
                        $matched[] = [
                            'commodity_id' => $rowCommodity->id,
                            'commodity_name' => $rowCommodity->name,
                            'recorded_date' => $dateStr,
                            'price' => $parsedPrice,
                            'notes' => null,
                        ];
                        $recordedInThisRow++;
                    }
                }
                if ($recordedInThisRow === 0) {
                    $skippedCount++;
                }

                continue;
            }

            // If no explicit header dates, check if there are multiple price columns
            // Standard template: Col 0: No | Col 1: Nama | Col 2: Satuan | Col 3: HET | Col 4..: Prices
            // Check if columns starting at index 4 are numeric prices
            $multiDayPriceCols = [];
            for ($c = 4; $c < count($row); $c++) {
                if ($this->parsePriceValue($row[$c]) !== null) {
                    $multiDayPriceCols[] = $c;
                }
            }

            if (count($multiDayPriceCols) > 1) {
                // Multi-day without header dates: map col 4 -> defaultDate, col 5 -> defaultDate + 1, etc.
                $pIdx = 0;
                foreach ($multiDayPriceCols as $colIndex) {
                    if ($pIdx >= $maxDays) {
                        break;
                    }
                    $dateStr = Carbon::parse($defaultDate)->addDays($pIdx)->format('Y-m-d');
                    $parsedPrice = $this->parsePriceValue($row[$colIndex]);
                    if ($parsedPrice !== null && $parsedPrice > 0) {
                        $matched[] = [
                            'commodity_id' => $rowCommodity->id,
                            'commodity_name' => $rowCommodity->name,
                            'recorded_date' => $dateStr,
                            'price' => $parsedPrice,
                            'notes' => null,
                        ];
                    }
                    $pIdx++;
                }

                continue;
            }

            // Single price column extraction
            $rawPrice = '';
            $notes = null;

            if (isset($row[4]) && $this->parsePriceValue($row[4]) !== null) {
                $rawPrice = $row[4];
                $notes = $row[5] ?? null;
            } elseif (isset($row[3]) && $this->parsePriceValue($row[3]) !== null && ! isset($row[4])) {
                $rawPrice = $row[3];
                $notes = $row[4] ?? null;
            } elseif (isset($row[2]) && $this->parsePriceValue($row[2]) !== null && ! isset($row[3])) {
                $rawPrice = $row[2];
                $notes = $row[3] ?? null;
            } elseif (isset($row[1]) && $this->parsePriceValue($row[1]) !== null && ! isset($row[2])) {
                $rawPrice = $row[1];
                $notes = $row[2] ?? null;
            } else {
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
                    'recorded_date' => $defaultDate,
                    'price' => $parsedPrice,
                    'notes' => $notes !== '' ? $notes : null,
                ];
            } else {
                $skippedCount++;
            }
        }

        $uniqueDates = array_values(array_unique(array_column($matched, 'recorded_date')));
        sort($uniqueDates);

        return [
            'matched' => $matched,
            'dates' => $uniqueDates,
            'skipped_count' => $skippedCount,
            'total_detected' => count($matched),
        ];
    }

    /**
     * Attempt to extract a Y-m-d date string from text/header.
     */
    public function extractDateFromText(string $text, ?string $baseDate = null): ?string
    {
        $clean = trim($text);

        // Matches 2026-10-01, 2026/10/01, 2026_10_01
        if (preg_match('/\b(20\d{2})[-_\/](\d{1,2})[-_\/](\d{1,2})\b/', $clean, $m)) {
            $year = (int) $m[1];
            $month = (int) $m[2];
            $day = (int) $m[3];
            if (checkdate($month, $day, $year)) {
                return sprintf('%04d-%02d-%02d', $year, $month, $day);
            }
        }

        // Matches 01/10/2026, 1-10-2026, 01_10_2026
        if (preg_match('/\b(\d{1,2})[-_\/](\d{1,2})[-_\/](20\d{2})\b/', $clean, $m)) {
            $day = (int) $m[1];
            $month = (int) $m[2];
            $year = (int) $m[3];
            if (checkdate($month, $day, $year)) {
                return sprintf('%04d-%02d-%02d', $year, $month, $day);
            }
        }

        // Matches "Tgl 1", "Tgl 01", "Hari 1", "Tanggal 1" or standalone day number "1".."31"
        if (preg_match('/^(?:tgl|hari|tanggal)?\s*(\d{1,2})$/i', $clean, $m)) {
            $dayNum = (int) $m[1];
            if ($dayNum >= 1 && $dayNum <= 31 && $baseDate) {
                try {
                    $base = Carbon::parse($baseDate);
                    if (checkdate($base->month, $dayNum, $base->year)) {
                        return sprintf('%04d-%02d-%02d', $base->year, $base->month, $dayNum);
                    }
                } catch (\Throwable) {
                    return null;
                }
            }
        }

        return null;
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

    /**
     * Generate an Excel .xlsx binary string for historical commodity prices table.
     * Columns: No, Tanggal, Commodity 1..25
     * Rows: Date 1..N
     *
     * @param  string  $marketName
     * @param  string  $startDate
     * @param  string  $endDate
     * @param  Collection<int, Commodity>  $commodities
     * @param  array<int, array{date: string, formatted_date?: string, prices: array<int|string, float|int|null>}>  $rows
     */
    public function generateHistoricalXlsx(string $marketName, string $startDate, string $endDate, Collection $commodities, array $rows): string
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'dkpp_hist_');
        if ($tempFile === false) {
            throw new \RuntimeException('Gagal membuat temporary file untuk Excel historis.');
        }

        @unlink($tempFile);
        $zipPath = $tempFile.'.xlsx';

        $zip = new ZipArchive;
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
            .'<sheets><sheet name="Historis Harga Konsumen" sheetId="1" r:id="rId1"/></sheets>'
            .'</workbook>';
        $zip->addFromString('xl/workbook.xml', $workbook);

        // 5. xl/styles.xml
        $styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<fonts count="4">'
            .'<font><sz val="10"/><name val="Calibri"/></font>'
            .'<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>'
            .'<font><b/><sz val="13"/><color rgb="FF006565"/><name val="Calibri"/></font>'
            .'<font><b/><sz val="10"/><color rgb="FF991B1B"/><name val="Calibri"/></font>'
            .'</fonts>'
            .'<fills count="4">'
            .'<fill><patternFill patternType="none"/></fill>'
            .'<fill><patternFill patternType="gray125"/></fill>'
            .'<fill><patternFill patternType="solid"><fgColor rgb="FF006565"/></patternFill></fill>'
            .'<fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/></patternFill></fill>'
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
            .'<cellXfs count="5">'
            .'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
            .'<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>'
            .'<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>'
            .'<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
            .'<xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>'
            .'</cellXfs>'
            .'</styleSheet>';
        $zip->addFromString('xl/styles.xml', $styles);

        // 6. xl/worksheets/sheet1.xml
        $totalCommodities = $commodities->count();
        $sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<cols>'
            .'<col min="1" max="1" width="6" customWidth="1"/>'
            .'<col min="2" max="2" width="16" customWidth="1"/>';

        for ($c = 3; $c <= 2 + $totalCommodities; $c++) {
            $sheetXml .= '<col min="'.$c.'" max="'.$c.'" width="20" customWidth="1"/>';
        }
        $sheetXml .= '</cols><sheetData>';

        // Row 1: Title
        $sheetXml .= '<row r="1" ht="24" customHeight="1">'
            .'<c r="A1" s="3" t="inlineStr"><is><t>TABEL HISTORIS PERKEMBANGAN HARGA PANGAN TINGKAT KONSUMEN - '.htmlspecialchars($marketName, ENT_XML1).'</t></is></c>'
            .'</row>';

        // Row 2: Subtitle
        $periodLabel = 'Periode: '.$startDate.' s/d '.$endDate.' | Total Komoditas: '.$totalCommodities.' Komoditas';
        $sheetXml .= '<row r="2" ht="18" customHeight="1">'
            .'<c r="A2" s="0" t="inlineStr"><is><t>'.htmlspecialchars($periodLabel, ENT_XML1).'</t></is></c>'
            .'</row>';

        // Row 3: Empty spacer
        $sheetXml .= '<row r="3" ht="10" customHeight="1"/>';

        // Row 4: Column Headers
        $sheetXml .= '<row r="4" ht="28" customHeight="1">'
            .'<c r="A4" s="1" t="inlineStr"><is><t>No</t></is></c>'
            .'<c r="B4" s="1" t="inlineStr"><is><t>Tanggal</t></is></c>';

        foreach ($commodities as $idx => $comm) {
            $colLetter = $this->getColumnLetter(3 + $idx);
            $hdrText = $comm->name.' ('.$comm->unit.')';
            $sheetXml .= '<c r="'.$colLetter.'4" s="1" t="inlineStr"><is><t>'.htmlspecialchars($hdrText, ENT_XML1).'</t></is></c>';
        }
        $sheetXml .= '</row>';

        // Data Rows starting at row 5
        $rowNum = 5;
        foreach ($rows as $rIdx => $rowItem) {
            $dateStr = $rowItem['formatted_date'] ?? $rowItem['date'];
            $sheetXml .= '<row r="'.$rowNum.'" ht="20" customHeight="1">'
                .'<c r="A'.$rowNum.'" s="2"><v>'.($rIdx + 1).'</v></c>'
                .'<c r="B'.$rowNum.'" s="2" t="inlineStr"><is><t>'.htmlspecialchars($dateStr, ENT_XML1).'</t></is></c>';

            foreach ($commodities as $cIdx => $comm) {
                $colLetter = $this->getColumnLetter(3 + $cIdx);
                $price = $rowItem['prices'][$comm->id] ?? null;
                $isAbove = $rowItem['is_above_het'][$comm->id] ?? false;
                $cellStyle = $isAbove ? 4 : 2;

                if ($price !== null && is_numeric($price) && $price > 0) {
                    $sheetXml .= '<c r="'.$colLetter.$rowNum.'" s="'.$cellStyle.'"><v>'.$price.'</v></c>';
                } else {
                    $sheetXml .= '<c r="'.$colLetter.$rowNum.'" s="2" t="inlineStr"><is><t>-</t></is></c>';
                }
            }

            $sheetXml .= '</row>';
            $rowNum++;
        }

        $sheetXml .= '</sheetData></worksheet>';
        $zip->addFromString('xl/worksheets/sheet1.xml', $sheetXml);
        $zip->close();

        $content = (string) file_get_contents($zipPath);
        @unlink($zipPath);

        return $content;
    }

    /**
     * Generate an Excel .xlsx binary string for historical producer commodity prices table.
     * Columns: No, Tanggal, 6 Producer Commodities
     * Rows: Date 1..N
     *
     * @param  string  $startDate
     * @param  string  $endDate
     * @param  Collection<int, mixed>  $commodities
     * @param  array<int, array{date: string, formatted_date?: string, prices: array<int|string, float|int|null>, is_above_hap?: array<int|string, bool>}>  $rows
     */
    public function generateProducerHistoricalXlsx(string $startDate, string $endDate, Collection $commodities, array $rows): string
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'dkpp_prod_hist_');
        if ($tempFile === false) {
            throw new \RuntimeException('Gagal membuat temporary file untuk Excel historis produsen.');
        }

        @unlink($tempFile);
        $zipPath = $tempFile.'.xlsx';

        $zip = new ZipArchive;
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
            .'<sheets><sheet name="Historis Harga Produsen" sheetId="1" r:id="rId1"/></sheets>'
            .'</workbook>';
        $zip->addFromString('xl/workbook.xml', $workbook);

        // 5. xl/styles.xml
        $styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<fonts count="4">'
            .'<font><sz val="10"/><name val="Calibri"/></font>'
            .'<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>'
            .'<font><b/><sz val="13"/><color rgb="FFB45309"/><name val="Calibri"/></font>'
            .'<font><b/><sz val="10"/><color rgb="FF991B1B"/><name val="Calibri"/></font>'
            .'</fonts>'
            .'<fills count="4">'
            .'<fill><patternFill patternType="none"/></fill>'
            .'<fill><patternFill patternType="gray125"/></fill>'
            .'<fill><patternFill patternType="solid"><fgColor rgb="FFB45309"/></patternFill></fill>'
            .'<fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/></patternFill></fill>'
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
            .'<cellXfs count="5">'
            .'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
            .'<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>'
            .'<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>'
            .'<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
            .'<xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>'
            .'</cellXfs>'
            .'</styleSheet>';
        $zip->addFromString('xl/styles.xml', $styles);

        // 6. xl/worksheets/sheet1.xml
        $totalCommodities = $commodities->count();
        $sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<cols>'
            .'<col min="1" max="1" width="6" customWidth="1"/>'
            .'<col min="2" max="2" width="16" customWidth="1"/>';

        for ($c = 3; $c <= 2 + $totalCommodities; $c++) {
            $sheetXml .= '<col min="'.$c.'" max="'.$c.'" width="22" customWidth="1"/>';
        }
        $sheetXml .= '</cols><sheetData>';

        // Row 1: Title
        $sheetXml .= '<row r="1" ht="24" customHeight="1">'
            .'<c r="A1" s="3" t="inlineStr"><is><t>TABEL HISTORIS PERKEMBANGAN HARGA PANGAN TINGKAT PRODUSEN - KABUPATEN INDRAMAYU</t></is></c>'
            .'</row>';

        // Row 2: Subtitle
        $periodLabel = 'Periode: '.$startDate.' s/d '.$endDate.' | Total Komoditas: '.$totalCommodities.' Komoditas (Gabah, Beras Giling, & Sapi Hidup)';
        $sheetXml .= '<row r="2" ht="18" customHeight="1">'
            .'<c r="A2" s="0" t="inlineStr"><is><t>'.htmlspecialchars($periodLabel, ENT_XML1).'</t></is></c>'
            .'</row>';

        // Row 3: Empty spacer
        $sheetXml .= '<row r="3" ht="10" customHeight="1"/>';

        // Row 4: Column Headers
        $sheetXml .= '<row r="4" ht="28" customHeight="1">'
            .'<c r="A4" s="1" t="inlineStr"><is><t>No</t></is></c>'
            .'<c r="B4" s="1" t="inlineStr"><is><t>Tanggal</t></is></c>';

        foreach ($commodities as $idx => $comm) {
            $colLetter = $this->getColumnLetter(3 + $idx);
            $hdrText = $comm->name.' ('.$comm->unit.')';
            $sheetXml .= '<c r="'.$colLetter.'4" s="1" t="inlineStr"><is><t>'.htmlspecialchars($hdrText, ENT_XML1).'</t></is></c>';
        }
        $sheetXml .= '</row>';

        // Data Rows starting at row 5
        $rowNum = 5;
        foreach ($rows as $rIdx => $rowItem) {
            $dateStr = $rowItem['formatted_date'] ?? $rowItem['date'];
            $sheetXml .= '<row r="'.$rowNum.'" ht="20" customHeight="1">'
                .'<c r="A'.$rowNum.'" s="2"><v>'.($rIdx + 1).'</v></c>'
                .'<c r="B'.$rowNum.'" s="2" t="inlineStr"><is><t>'.htmlspecialchars($dateStr, ENT_XML1).'</t></is></c>';

            foreach ($commodities as $cIdx => $comm) {
                $colLetter = $this->getColumnLetter(3 + $cIdx);
                $price = $rowItem['prices'][$comm->id] ?? null;
                $isAbove = $rowItem['is_above_hap'][$comm->id] ?? ($rowItem['is_above_het'][$comm->id] ?? false);
                $cellStyle = $isAbove ? 4 : 2;

                if ($price !== null && is_numeric($price) && $price > 0) {
                    $sheetXml .= '<c r="'.$colLetter.$rowNum.'" s="'.$cellStyle.'"><v>'.$price.'</v></c>';
                } else {
                    $sheetXml .= '<c r="'.$colLetter.$rowNum.'" s="2" t="inlineStr"><is><t>-</t></is></c>';
                }
            }

            $sheetXml .= '</row>';
            $rowNum++;
        }

        $sheetXml .= '</sheetData></worksheet>';
        $zip->addFromString('xl/worksheets/sheet1.xml', $sheetXml);
        $zip->close();

        $content = (string) file_get_contents($zipPath);
        @unlink($zipPath);

        return $content;
    }

    /**
     * Generate an Excel .xlsx binary string for producer prices template (6 commodities).
     *
     * @param  array<int|string, mixed>  $prices
     * @param  int|array<int, string>  $days
     */
    public function generateProducerXlsxTemplate(?string $selectedDate = null, array $prices = [], int|array $days = 1): string
    {
        $dates = $this->resolveDateRange($selectedDate, $days);
        $isMultiDay = count($dates) > 1;

        $tempFile = tempnam(sys_get_temp_dir(), 'dkpp_prod_tmpl_');
        if ($tempFile === false) {
            throw new \RuntimeException('Gagal membuat temporary file untuk template Excel.');
        }

        @unlink($tempFile);
        $zipPath = $tempFile.'.xlsx';

        $zip = new ZipArchive;
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException('Gagal menginisialisasi file XLSX.');
        }

        $contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            .'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            .'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            .'</Types>';
        $zip->addFromString('[Content_Types].xml', $contentTypes);

        $rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            .'</Relationships>';
        $zip->addFromString('_rels/.rels', $rootRels);

        $wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            .'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            .'</Relationships>';
        $zip->addFromString('xl/_rels/workbook.xml.rels', $wbRels);

        $workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            .'<sheets><sheet name="Template Harga Produsen" sheetId="1" r:id="rId1"/></sheets>'
            .'</workbook>';
        $zip->addFromString('xl/workbook.xml', $workbook);

        $styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<fonts count="2">'
            .'<font><sz val="10"/><name val="Calibri"/></font>'
            .'<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>'
            .'</fonts>'
            .'<fills count="3">'
            .'<fill><patternFill patternType="none"/></fill>'
            .'<fill><patternFill patternType="gray125"/></fill>'
            .'<fill><patternFill patternType="solid"><fgColor rgb="FFB45309"/></patternFill></fill>'
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

        $commodities = \App\Models\ProducerPrice::COMMODITIES;

        $sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<cols>'
            .'<col min="1" max="1" width="6" customWidth="1"/>'
            .'<col min="2" max="2" width="36" customWidth="1"/>'
            .'<col min="3" max="3" width="10" customWidth="1"/>'
            .'<col min="4" max="4" width="18" customWidth="1"/>';

        for ($c = 5; $c < 5 + count($dates); $c++) {
            $sheetXml .= '<col min="'.$c.'" max="'.$c.'" width="18" customWidth="1"/>';
        }
        $notesColIdx = 5 + count($dates);
        $sheetXml .= '<col min="'.$notesColIdx.'" max="'.$notesColIdx.'" width="25" customWidth="1"/>'
            .'</cols>'
            .'<sheetData>';

        // Header Row
        $sheetXml .= '<row r="1" ht="26" customHeight="1">'
            .'<c r="A1" s="1" t="inlineStr"><is><t>No</t></is></c>'
            .'<c r="B1" s="1" t="inlineStr"><is><t>Nama Komoditas Produsen</t></is></c>'
            .'<c r="C1" s="1" t="inlineStr"><is><t>Satuan</t></is></c>'
            .'<c r="D1" s="1" t="inlineStr"><is><t>HAP Acuan (Rp)</t></is></c>';

        if (! $isMultiDay) {
            $sheetXml .= '<c r="E1" s="1" t="inlineStr"><is><t>Harga Produsen (Rp)</t></is></c>';
        } else {
            foreach ($dates as $idx => $dateStr) {
                $colLetter = $this->getColumnLetter(5 + $idx);
                $sheetXml .= '<c r="'.$colLetter.'1" s="1" t="inlineStr"><is><t>Tgl '.$dateStr.'</t></is></c>';
            }
        }
        $notesLetter = $this->getColumnLetter($notesColIdx);
        $sheetXml .= '<c r="'.$notesLetter.'1" s="1" t="inlineStr"><is><t>Catatan</t></is></c></row>';

        $rowIdx = 2;
        foreach ($commodities as $comm) {
            $orderNo = $comm['order'];
            $nameEsc = htmlspecialchars($comm['name'], ENT_XML1, 'UTF-8');
            $unitEsc = htmlspecialchars($comm['unit'], ENT_XML1, 'UTF-8');
            $hapVal = (float) $comm['hap'];

            $sheetXml .= '<row r="'.$rowIdx.'">'
                .'<c r="A'.$rowIdx.'" s="2"><v>'.$orderNo.'</v></c>'
                .'<c r="B'.$rowIdx.'" s="2" t="inlineStr"><is><t>'.$nameEsc.'</t></is></c>'
                .'<c r="C'.$rowIdx.'" s="2" t="inlineStr"><is><t>'.$unitEsc.'</t></is></c>'
                .'<c r="D'.$rowIdx.'" s="2"><v>'.$hapVal.'</v></c>';

            if (! $isMultiDay) {
                $val = $prices[$comm['key']] ?? null;
                $cellXml = ($val !== null && $val !== '')
                    ? '<c r="E'.$rowIdx.'" s="2"><v>'.((float) $val).'</v></c>'
                    : '<c r="E'.$rowIdx.'" s="2"/>';
                $sheetXml .= $cellXml;
            } else {
                foreach ($dates as $dIdx => $dateStr) {
                    $colLetter = $this->getColumnLetter(5 + $dIdx);
                    $val = $prices[$dateStr][$comm['key']] ?? null;
                    $cellXml = ($val !== null && $val !== '')
                        ? '<c r="'.$colLetter.$rowIdx.'" s="2"><v>'.((float) $val).'</v></c>'
                        : '<c r="'.$colLetter.$rowIdx.'" s="2"/>';
                    $sheetXml .= $cellXml;
                }
            }

            $sheetXml .= '<c r="'.$notesLetter.$rowIdx.'" s="2"/>'
                .'</row>';
            $rowIdx++;
        }

        $sheetXml .= '</sheetData></worksheet>';
        $zip->addFromString('xl/worksheets/sheet1.xml', $sheetXml);
        $zip->close();

        $content = file_get_contents($zipPath);
        @unlink($zipPath);

        if ($content === false) {
            throw new \RuntimeException('Gagal membaca file template XLSX produsen yang dibuat.');
        }

        return $content;
    }

    /**
     * Generate a CSV string for producer prices template.
     */
    public function generateProducerCsvTemplate(?string $selectedDate = null, array $prices = [], int|array $days = 1): string
    {
        $dates = $this->resolveDateRange($selectedDate, $days);
        $isMultiDay = count($dates) > 1;

        $output = "\xEF\xBB\xBF";

        if (! $isMultiDay) {
            $output .= "No;Nama Komoditas Produsen;Satuan;HAP Acuan (Rp);Harga Produsen (Rp);Catatan\r\n";
        } else {
            $dateHeaders = array_map(fn ($d) => "Tgl {$d}", $dates);
            $output .= 'No;Nama Komoditas Produsen;Satuan;HAP Acuan (Rp);'.implode(';', $dateHeaders).";Catatan\r\n";
        }

        $commodities = \App\Models\ProducerPrice::COMMODITIES;

        foreach ($commodities as $comm) {
            $line = [
                $comm['order'],
                '"'.str_replace('"', '""', $comm['name']).'"',
                $comm['unit'],
                $comm['hap'],
            ];

            if (! $isMultiDay) {
                $line[] = $prices[$comm['key']] ?? '';
            } else {
                foreach ($dates as $dateStr) {
                    $line[] = $prices[$dateStr][$comm['key']] ?? '';
                }
            }

            $line[] = '';
            $output .= implode(';', $line)."\r\n";
        }

        return $output;
    }

    /**
     * Match raw imported Excel/CSV rows to producer price fields.
     *
     * @param  array<int, array<int, string>>  $rawRows
     * @return array{matched: array<string, array<string, mixed>>, dates: array<int, string>, total_detected: int}
     */
    public function matchProducerPrices(array $rawRows, string $defaultDate, int $maxDays = 31): array
    {
        $commodities = \App\Models\ProducerPrice::COMMODITIES;
        $fieldKeyByOrder = [];
        foreach ($commodities as $c) {
            $fieldKeyByOrder[$c['order']] = $c['key'];
        }

        $resolveKey = function (string $text): ?string {
            $t = strtolower(preg_replace('/[^a-z0-9]/', '', $text));
            if (str_contains($t, 'gkp') && (str_contains($t, 'petani') || str_contains($t, 'tani'))) {
                return 'gkp_petani';
            }
            if (str_contains($t, 'gkp') && (str_contains($t, 'giling') || str_contains($t, 'penggilingan'))) {
                return 'gkp_penggilingan';
            }
            if (str_contains($t, 'gkg')) {
                return 'gkg_penggilingan';
            }
            if (str_contains($t, 'medium')) {
                return 'beras_medium_penggilingan';
            }
            if (str_contains($t, 'premium')) {
                return 'beras_premium_penggilingan';
            }
            if (str_contains($t, 'sapi')) {
                return 'sapi_hidup';
            }
            return null;
        };

        if (empty($rawRows)) {
            return ['matched' => [], 'dates' => [], 'total_detected' => 0];
        }

        // Check header row for dates
        $firstRow = $rawRows[0] ?? [];
        $headerDates = [];
        $isFirstRowHeader = false;

        foreach ($firstRow as $idx => $cell) {
            $extracted = $this->extractDateFromText($cell, $defaultDate);
            if ($extracted) {
                $headerDates[$idx] = $extracted;
                $isFirstRowHeader = true;
            } elseif (preg_match('/(nama|komoditas|harga|satuan|hap|gkp|gkg|beras|sapi)/i', $cell)) {
                $isFirstRowHeader = true;
            }
        }

        $dataRows = $isFirstRowHeader ? array_slice($rawRows, 1) : $rawRows;
        $matchedByDate = [];
        $totalDetected = 0;

        foreach ($dataRows as $rIdx => $row) {
            if (empty(array_filter($row, fn ($v) => trim($v) !== ''))) {
                continue;
            }

            // Determine which commodity this row corresponds to
            $matchedKey = null;
            foreach ($row as $cell) {
                $found = $resolveKey($cell);
                if ($found) {
                    $matchedKey = $found;
                    break;
                }
            }

            // Fallback by order number in column 0 or row index
            if (! $matchedKey && isset($row[0]) && is_numeric(trim($row[0]))) {
                $orderNum = (int) trim($row[0]);
                $matchedKey = $fieldKeyByOrder[$orderNum] ?? null;
            }

            if (! $matchedKey && isset($fieldKeyByOrder[$rIdx + 1])) {
                $matchedKey = $fieldKeyByOrder[$rIdx + 1];
            }

            if (! $matchedKey) {
                continue;
            }

            // Extract price for each date
            if (! empty($headerDates)) {
                foreach ($headerDates as $colIdx => $dateStr) {
                    $rawPrice = $row[$colIdx] ?? '';
                    $parsed = $this->parsePriceValue($rawPrice);
                    if ($parsed !== null && $parsed > 0) {
                        if (! isset($matchedByDate[$dateStr])) {
                            $matchedByDate[$dateStr] = ['recorded_date' => $dateStr];
                        }
                        $matchedByDate[$dateStr][$matchedKey] = $parsed;
                        $totalDetected++;
                    }
                }
                continue;
            }

            // Single price column fallback: col 4 or last numeric col
            $rawPrice = null;
            $notes = null;

            if (isset($row[4]) && $this->parsePriceValue($row[4]) !== null) {
                $rawPrice = $row[4];
                $notes = $row[5] ?? null;
            } elseif (isset($row[3]) && $this->parsePriceValue($row[3]) !== null) {
                $rawPrice = $row[3];
                $notes = $row[4] ?? null;
            } else {
                for ($c = count($row) - 1; $c >= 0; $c--) {
                    if ($this->parsePriceValue($row[$c]) !== null) {
                        $rawPrice = $row[$c];
                        break;
                    }
                }
            }

            $parsed = $this->parsePriceValue($rawPrice);
            if ($parsed !== null && $parsed > 0) {
                if (! isset($matchedByDate[$defaultDate])) {
                    $matchedByDate[$defaultDate] = ['recorded_date' => $defaultDate];
                }
                $matchedByDate[$defaultDate][$matchedKey] = $parsed;
                if ($notes && ! isset($matchedByDate[$defaultDate]['notes'])) {
                    $matchedByDate[$defaultDate]['notes'] = $notes;
                }
                $totalDetected++;
            }
        }

        $dates = array_keys($matchedByDate);
        sort($dates);

        return [
            'matched' => $matchedByDate,
            'dates' => $dates,
            'total_detected' => $totalDetected,
        ];
    }
}

