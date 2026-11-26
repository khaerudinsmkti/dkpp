<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $docTitle }}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 12mm 10mm 12mm 10mm;
        }
        * {
            box-sizing: border-box;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 8.5pt;
            color: #000000;
            margin: 0;
            padding: 0;
        }
        .doc-title {
            text-align: center;
            font-size: 11.5pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 12px;
            letter-spacing: 0.2px;
        }
        table.rekap-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000000;
            table-layout: fixed;
        }
        table.rekap-table thead {
            display: table-header-group;
        }
        table.rekap-table tr {
            page-break-inside: avoid;
        }
        table.rekap-table thead th {
            background-color: #FCE4D6;
            color: #000000;
            font-weight: bold;
            font-size: 9pt;
            text-align: center;
            vertical-align: middle;
            padding: 8px 6px;
            border: 1px solid #000000;
        }
        table.rekap-table tbody td {
            vertical-align: top;
            padding: 6px 6px;
            line-height: 1.35;
            word-wrap: break-word;
            font-size: 8pt;
            border-left: 1px solid #000000;
            border-right: 1px solid #000000;
            border-top: 1px solid #000000;
            border-bottom: 1px solid #000000;
        }
        table.rekap-table tbody td.group-cont-top {
            border-top: none;
        }
        table.rekap-table tbody td.group-cont-bottom {
            border-bottom: none;
        }
        table.rekap-table tbody td.col-program {
            text-align: left;
            font-weight: bold;
        }
        table.rekap-table tbody td.col-kegiatan,
        table.rekap-table tbody td.col-sub-kegiatan,
        table.rekap-table tbody td.col-keterangan {
            text-align: left;
        }
        table.rekap-table tbody td.col-num {
            text-align: right;
            white-space: nowrap;
        }
        table.rekap-table tbody td.col-persen {
            text-align: center;
            white-space: nowrap;
        }
        table.rekap-table tr.total-row td {
            font-weight: bold;
            font-size: 8.5pt;
            padding: 7px 6px;
            border: 1px solid #000000;
            background-color: #F7F7F7;
            vertical-align: middle;
        }
        table.rekap-table tr.total-row td.total-label {
            text-align: right;
            padding-right: 10px;
        }
        table.rekap-table tr.total-row td.total-num {
            text-align: right;
            white-space: nowrap;
        }
        table.rekap-table tr.total-row td.total-persen {
            text-align: center;
            white-space: nowrap;
        }
        .empty-row {
            text-align: center;
            padding: 20px;
            color: #555555;
            font-style: italic;
        }
    </style>
</head>
<body>
    @php
        $colLabels = [
            'program' => 'Program',
            'kegiatan' => 'Kegiatan',
            'sub_kegiatan' => 'Sub Kegiatan',
            'pagu' => 'Pagu',
            'realisasi' => 'Realisasi',
            'sisa' => 'Sisa Pagu',
            'persen' => 'Serapan (%)',
            'keterangan' => 'Keterangan',
        ];
        $numericCols = ['pagu', 'realisasi', 'sisa', 'persen'];
        $hasNumeric = count(array_intersect($selectedCols, $numericCols)) > 0;
        $firstNumericIdx = null;
        foreach ($selectedCols as $idx => $colKey) {
            if (in_array($colKey, $numericCols, true)) {
                $firstNumericIdx = $idx;
                break;
            }
        }
    @endphp

    <div class="doc-title">
        {{ $docTitle }}
    </div>

    <table class="rekap-table">
        <thead>
            <tr>
                @foreach ($selectedCols as $col)
                    <th style="width: {{ $colWidths[$col] }}%;">{{ $colLabels[$col] ?? $col }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>
                    @foreach ($selectedCols as $col)
                        @if ($col === 'program')
                            <td class="col-program {{ ! $row['program_first'] ? 'group-cont-top' : '' }} {{ ! $row['program_last'] ? 'group-cont-bottom' : '' }}">
                                {{ $row['program_first'] ? $row['program'] : '' }}
                            </td>
                        @elseif ($col === 'kegiatan')
                            <td class="col-kegiatan {{ ! $row['kegiatan_first'] ? 'group-cont-top' : '' }} {{ ! $row['kegiatan_last'] ? 'group-cont-bottom' : '' }}">
                                {{ $row['kegiatan_first'] ? $row['kegiatan'] : '' }}
                            </td>
                        @elseif ($col === 'sub_kegiatan')
                            <td class="col-sub-kegiatan">{{ $row['sub_kegiatan'] }}</td>
                        @elseif ($col === 'pagu')
                            <td class="col-num">{{ number_format($row['pagu'], 0, ',', '.') }}</td>
                        @elseif ($col === 'realisasi')
                            <td class="col-num">{{ number_format($row['realisasi'], 0, ',', '.') }}</td>
                        @elseif ($col === 'sisa')
                            <td class="col-num">{{ number_format($row['sisa'], 0, ',', '.') }}</td>
                        @elseif ($col === 'persen')
                            <td class="col-persen">{{ number_format($row['persen'], 2, ',', '.') }}%</td>
                        @elseif ($col === 'keterangan')
                            <td class="col-keterangan">{!! nl2br(e($row['keterangan'] ?: '')) !!}</td>
                        @endif
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="{{ count($selectedCols) }}" class="empty-row">
                        Belum ada data Sub Kegiatan untuk Tahun Anggaran {{ $tahun }}.
                    </td>
                </tr>
            @endforelse

            @if ($hasNumeric)
                <tr class="total-row">
                    @if ($firstNumericIdx > 0)
                        <td colspan="{{ $firstNumericIdx }}" class="total-label">TOTAL</td>
                    @endif
                    @foreach ($selectedCols as $idx => $col)
                        @if ($idx < $firstNumericIdx)
                            @continue
                        @endif
                        @if ($col === 'pagu')
                            <td class="total-num">{{ number_format($grandTotalPagu, 0, ',', '.') }}</td>
                        @elseif ($col === 'realisasi')
                            <td class="total-num">{{ number_format($grandTotalRealisasi, 0, ',', '.') }}</td>
                        @elseif ($col === 'sisa')
                            <td class="total-num">{{ number_format($grandTotalSisa, 0, ',', '.') }}</td>
                        @elseif ($col === 'persen')
                            <td class="total-persen">{{ number_format($grandPersen, 2, ',', '.') }}%</td>
                        @else
                            <td></td>
                        @endif
                    @endforeach
                </tr>
            @endif
        </tbody>
    </table>
</body>
</html>
