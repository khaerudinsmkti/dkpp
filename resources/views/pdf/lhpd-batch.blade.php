<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Hasil Perjalanan Dinas (LHPD) - {{ $batchCode }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1.2cm 1.6cm 1.2cm 1.6cm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9.5pt;
            color: #000000;
            line-height: 1.32;
            margin: 0;
            padding: 0;
        }
        .page-break {
            page-break-after: always;
        }
        .lhpd-page {
            position: relative;
        }
        .lhpd-page-empty {
            position: relative;
            height: 26.8cm;
        }

        /* JUDUL */
        .judul-box {
            text-align: center;
            margin-bottom: 14px;
        }
        .judul-text {
            font-size: 11pt;
            font-weight: bold;
            text-decoration: underline;
            margin: 0;
            letter-spacing: 0.3px;
        }

        /* METADATA */
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            margin-bottom: 12px;
        }
        .meta-table td {
            vertical-align: top;
            padding: 1.5px 0;
            line-height: 1.32;
        }
        .m-label {
            width: 135px;
            white-space: nowrap;
        }
        .m-colon {
            width: 14px;
            text-align: center;
        }
        .nama-line {
            margin-bottom: 1.5px;
        }
        .nama-line:last-child {
            margin-bottom: 0;
        }

        /* HASIL PERJALANAN DINAS */
        .hasil-heading {
            font-weight: bold;
            font-size: 9.2pt;
            margin: 8px 0 6px 0;
        }

        /* PARAGRAF / POIN (LAMPIRAN 2) */
        .paragraf-box {
            font-size: 9.2pt;
            line-height: 1.38;
            margin-bottom: 8px;
        }
        .p-line {
            margin: 2px 0;
            text-align: justify;
        }
        .p-line-sub {
            margin: 2px 0 2px 24px;
            text-align: justify;
        }
        .p-table-row {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2px;
        }
        .p-table-row td {
            vertical-align: top;
            padding: 1px 0;
            line-height: 1.36;
            text-align: justify;
        }
        .p-num-col {
            width: 20px;
            white-space: nowrap;
        }

        /* TABEL HARGA PANGAN (LAMPIRAN 1) */
        .harga-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
            margin-bottom: 6px;
        }
        .harga-table th,
        .harga-table td {
            border: 1px solid #000000;
            padding: 2px 4px;
            line-height: 1.18;
            vertical-align: middle;
        }
        .harga-table th {
            text-align: center;
            font-weight: normal;
        }
        .harga-table td.num {
            text-align: right;
            white-space: nowrap;
        }
        .harga-table td.ctr {
            text-align: center;
            white-space: nowrap;
        }

        /* TABEL CUSTOM */
        .custom-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
            margin-bottom: 6px;
        }
        .custom-table th,
        .custom-table td {
            border: 1px solid #000000;
            padding: 3px 5px;
            line-height: 1.25;
            vertical-align: top;
        }
        .custom-table th {
            font-weight: bold;
            text-align: center;
            background-color: #f3f4f6;
        }

        .keterangan-line {
            font-size: 8.5pt;
            margin: 4px 0 2px 28px;
        }
        .penutup-line {
            font-size: 9pt;
            margin: 4px 0 12px 42px;
        }

        /* TANDA TANGAN */
        .ttd-wrapper-flow {
            margin-top: 8px;
            margin-left: 42px;
            font-size: 9pt;
            page-break-inside: avoid;
        }
        .ttd-wrapper-bottom {
            position: absolute;
            bottom: 0;
            left: 42px;
            right: 0;
            font-size: 9.5pt;
        }
        .ttd-date {
            margin-bottom: 4px;
        }
        .ttd-table {
            width: 100%;
            border-collapse: collapse;
        }
        .ttd-table td {
            vertical-align: top;
            padding: 0;
            line-height: 1.3;
        }
        .col-pelaksana {
            width: 48%;
        }
        .col-sign-left {
            width: 24%;
        }
        .col-sign-right {
            width: 28%;
        }
        .ttd-header-row td {
            padding-bottom: 14px;
        }
        .pelaksana-row td {
            padding-bottom: 14px;
        }
        .pelaksana-inner {
            border-collapse: collapse;
        }
        .pelaksana-inner td {
            padding: 0;
            vertical-align: top;
            line-height: 1.3;
        }
        .p-no {
            width: 18px;
        }
        .nip-line {
            white-space: nowrap;
        }
    </style>
</head>
<body>
@foreach ($sppdList as $sppd)
    @php
        $lhpdType = $sppd['lhpd_type'] ?? null;
        $lhpdContent = trim((string) ($sppd['lhpd_content'] ?? ''));
        $lhpdTableData = $sppd['lhpd_table_data'] ?? null;
        $lhpdKeterangan = trim((string) ($sppd['lhpd_keterangan'] ?? ''));
        $hasContent = ($lhpdType === 'paragraf' && $lhpdContent !== '')
            || ($lhpdType === 'tabel_harga' && is_array($lhpdTableData) && count($lhpdTableData) > 0)
            || ($lhpdType === 'tabel_custom' && is_array($lhpdTableData) && !empty($lhpdTableData['rows']));
    @endphp

    <div class="{{ $hasContent ? 'lhpd-page' : 'lhpd-page-empty' }}">
        {{-- JUDUL --}}
        <div class="judul-box">
            <p class="judul-text">LAPORAN HASIL PERJALANAN DINAS</p>
        </div>

        {{-- METADATA --}}
        <table class="meta-table">
            <tr>
                <td class="m-label">Nama / NIP</td>
                <td class="m-colon">:</td>
                <td>
                    @foreach ($sppd['participants'] as $pt)
                        <div class="nama-line">{{ $pt['nama'] }} / {{ $pt['nip'] }}</div>
                    @endforeach
                </td>
            </tr>
            <tr>
                <td class="m-label">Tempat Tujuan</td>
                <td class="m-colon">:</td>
                <td>{{ $sppd['lokasi_desa_kecamatan'] }}</td>
            </tr>
            <tr>
                <td class="m-label">Tanggal Berangkat</td>
                <td class="m-colon">:</td>
                <td>{{ $sppd['tanggal_berangkat_indo'] }}</td>
            </tr>
            <tr>
                <td class="m-label">Tanggal Kembali</td>
                <td class="m-colon">:</td>
                <td>{{ $sppd['tanggal_berangkat_indo'] }}</td>
            </tr>
            <tr>
                <td class="m-label">Maksud Tujuan</td>
                <td class="m-colon">:</td>
                <td>Melaksanakan {{ $sppd['maksud_tujuan'] }} Tahun Anggaran {{ $tahunAnggaran }}</td>
            </tr>
        </table>

        {{-- ISI HASIL PERJALANAN DINAS --}}
        @if ($hasContent)
            <div class="hasil-heading">Hasil Perjalanan Dinas :</div>

            @if ($lhpdType === 'paragraf')
                @php
                    $lines = preg_split('/\r\n|\r|\n/', $lhpdContent) ?: [];
                @endphp
                <div class="paragraf-box">
                    @foreach ($lines as $rawLine)
                        @php
                            $trimmed = trim($rawLine);
                        @endphp
                        @if ($trimmed === '')
                            @continue
                        @endif
                        @if (preg_match('/^(\d+\.)\s*(.*)$/', $trimmed, $m))
                            <table class="p-table-row">
                                <tr>
                                    <td class="p-num-col">{{ $m[1] }}</td>
                                    <td>{{ $m[2] }}</td>
                                </tr>
                            </table>
                        @elseif (preg_match('/^([a-z]\.)\s*(.*)$/i', $trimmed, $m))
                            <table class="p-table-row" style="margin-left: 20px; width: 96%;">
                                <tr>
                                    <td class="p-num-col">{{ $m[1] }}</td>
                                    <td>{{ $m[2] }}</td>
                                </tr>
                            </table>
                        @else
                            <div class="p-line">{{ $trimmed }}</div>
                        @endif
                    @endforeach
                </div>
            @elseif ($lhpdType === 'tabel_harga')
                <table class="harga-table">
                    <thead>
                        <tr>
                            <th rowspan="2" style="width: 22px;">No</th>
                            <th rowspan="2">Komoditas</th>
                            <th colspan="7">Harga (Rp)</th>
                        </tr>
                        <tr>
                            <th style="width: 50px;">P1</th>
                            <th style="width: 50px;">P2</th>
                            <th style="width: 54px;">Rata-Rata</th>
                            <th style="width: 54px;">HET/HAP</th>
                            <th style="width: 56px;">Naik/Turun</th>
                            <th style="width: 48px;">Ket</th>
                            <th style="width: 48px;">Pasokan</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($lhpdTableData as $rIdx => $row)
                            @php
                                $p1 = is_numeric($row['p1'] ?? null) ? (float) $row['p1'] : null;
                                $p2 = is_numeric($row['p2'] ?? null) ? (float) $row['p2'] : null;
                                $het = is_numeric($row['het'] ?? null) && (float) $row['het'] > 0 ? (float) $row['het'] : null;

                                $avg = null;
                                if ($p1 !== null && $p2 !== null) {
                                    $avg = ($p1 + $p2) / 2;
                                } elseif ($p1 !== null) {
                                    $avg = $p1;
                                } elseif ($p2 !== null) {
                                    $avg = $p2;
                                }

                                $diff = null;
                                if ($avg !== null) {
                                    $diff = $het !== null ? ($avg - $het) : $avg;
                                }

                                $ket = trim((string) ($row['ket'] ?? ''));
                                if ($ket === '' && $avg !== null && $het !== null) {
                                    if ($diff > 0) {
                                        $ket = 'Diatas';
                                    } elseif ($diff < 0) {
                                        $ket = 'Dibawah';
                                    } else {
                                        $ket = 'Sesuai';
                                    }
                                }

                                $pasokan = trim((string) ($row['pasokan'] ?? 'Aman')) ?: 'Aman';
                            @endphp
                            <tr>
                                <td class="ctr">{{ $rIdx + 1 }}</td>
                                <td>{{ $row['komoditas'] ?? '-' }}</td>
                                <td class="num">{{ $p1 !== null ? number_format($p1, 0, ',', '.') : '' }}</td>
                                <td class="num">{{ $p2 !== null ? number_format($p2, 0, ',', '.') : '' }}</td>
                                <td class="num">{{ $avg !== null ? number_format($avg, 0, ',', '.') : '' }}</td>
                                <td class="num">{{ $het !== null ? number_format($het, 0, ',', '.') : '' }}</td>
                                <td class="num">{{ $diff !== null ? number_format($diff, 0, ',', '.') : '' }}</td>
                                <td class="ctr">{{ $ket }}</td>
                                <td class="ctr">{{ $pasokan }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @elseif ($lhpdType === 'tabel_custom')
                @php
                    $headers = is_array($lhpdTableData['headers'] ?? null) ? $lhpdTableData['headers'] : [];
                    $rows = is_array($lhpdTableData['rows'] ?? null) ? $lhpdTableData['rows'] : [];
                @endphp
                <table class="custom-table">
                    @if (count($headers) > 0)
                        <thead>
                            <tr>
                                @foreach ($headers as $h)
                                    <th>{{ $h }}</th>
                                @endforeach
                            </tr>
                        </thead>
                    @endif
                    <tbody>
                        @foreach ($rows as $row)
                            <tr>
                                @foreach ($row as $cell)
                                    <td>{{ $cell }}</td>
                                @endforeach
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif

            @if ($lhpdKeterangan !== '')
                <div class="keterangan-line"><strong>Keterangan :</strong> {{ $lhpdKeterangan }}</div>
            @endif

            <div class="penutup-line">Demikian Laporan Hasil Perjalanan ini, agar menjadi maklum.</div>
        @endif

        {{-- TANDA TANGAN PELAKSANA --}}
        <div class="{{ $hasContent ? 'ttd-wrapper-flow' : 'ttd-wrapper-bottom' }}">
            <div class="ttd-date">Indramayu, {{ $sppd['tanggal_berangkat_indo'] }}</div>

            <table class="ttd-table">
                <tr class="ttd-header-row">
                    <td class="col-pelaksana">Yang Melaksanakan Tugas,</td>
                    <td colspan="2" style="padding-left: 28px;">Tanda Tangan</td>
                </tr>
                @foreach ($sppd['participants'] as $idx => $pt)
                    <tr class="pelaksana-row">
                        <td class="col-pelaksana">
                            <table class="pelaksana-inner">
                                <tr>
                                    <td class="p-no">{{ $idx + 1 }}.</td>
                                    <td>
                                        <div>{{ $pt['nama'] }}</div>
                                        <div class="nip-line">NIP.{{ $pt['nip'] }}</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                        @if (($idx + 1) % 2 === 1)
                            <td class="col-sign-left">{{ $idx + 1 }}.</td>
                            <td class="col-sign-right"></td>
                        @else
                            <td class="col-sign-left"></td>
                            <td class="col-sign-right">{{ $idx + 1 }}.</td>
                        @endif
                    </tr>
                @endforeach
            </table>
        </div>
    </div>

    @if (!$loop->last)
        <div class="page-break"></div>
    @endif
@endforeach
</body>
</html>
