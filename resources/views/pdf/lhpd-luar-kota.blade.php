<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Hasil Perjalanan Dinas (LHPD) Luar Kota - {{ $batchCode }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1.4cm 1.8cm 1.4cm 1.8cm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9.5pt;
            color: #000000;
            line-height: 1.38;
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
            height: 26.4cm;
        }

        /* JUDUL */
        .judul-box {
            text-align: center;
            margin-bottom: 16px;
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
            font-size: 9.5pt;
            margin-bottom: 12px;
        }
        .meta-table td {
            vertical-align: top;
            padding: 2px 0;
            line-height: 1.38;
        }
        .m-label {
            width: 140px;
            white-space: nowrap;
        }
        .m-colon {
            width: 16px;
            text-align: center;
        }
        .nama-line {
            margin-bottom: 2px;
        }
        .nama-line:last-child {
            margin-bottom: 0;
        }

        /* HASIL PERJALANAN DINAS */
        .hasil-heading {
            font-weight: bold;
            font-size: 9.5pt;
            margin: 10px 0 6px 0;
        }
        .paragraf-box {
            font-size: 9.5pt;
            line-height: 1.42;
            margin-bottom: 10px;
        }
        .p-line {
            margin: 3px 0;
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
            line-height: 1.4;
            text-align: justify;
        }
        .p-num-col {
            width: 22px;
            white-space: nowrap;
        }

        .penutup-line {
            font-size: 9.5pt;
            margin: 8px 0 16px 42px;
        }

        /* TANDA TANGAN */
        .ttd-wrapper-flow {
            margin-top: 10px;
            margin-left: 42px;
            font-size: 9.5pt;
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
            margin-bottom: 6px;
        }
        .ttd-table {
            width: 100%;
            border-collapse: collapse;
        }
        .ttd-table td {
            vertical-align: top;
            padding: 0;
            line-height: 1.35;
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
            padding-bottom: 18px;
        }
        .pelaksana-row td {
            padding-bottom: 18px;
        }
        .pelaksana-inner {
            border-collapse: collapse;
        }
        .pelaksana-inner td {
            padding: 0;
            vertical-align: top;
            line-height: 1.35;
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
        $lhpdContent = trim((string) ($sppd['lhpd_content'] ?? ''));
        $hasContent = $lhpdContent !== '';
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
                <td>{{ $sppd['tempat_tujuan'] }}</td>
            </tr>
            <tr>
                <td class="m-label">Tanggal Berangkat</td>
                <td class="m-colon">:</td>
                <td>{{ $sppd['tanggal_berangkat_indo'] }}</td>
            </tr>
            <tr>
                <td class="m-label">Tanggal Kembali</td>
                <td class="m-colon">:</td>
                <td>{{ $sppd['tanggal_kembali_indo'] }}</td>
            </tr>
            <tr>
                <td class="m-label">Maksud Tujuan</td>
                <td class="m-colon">:</td>
                <td>{{ $sppd['maksud_tujuan'] }}</td>
            </tr>
        </table>

        {{-- HASIL PERJALANAN DINAS (PARAGRAF) --}}
        @if ($hasContent)
            <div class="hasil-heading">Hasil Perjalanan Dinas :</div>

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
                        <table class="p-table-row" style="margin-left: 22px; width: 95%;">
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

            <div class="penutup-line">Demikian Laporan Hasil Perjalanan ini, agar menjadi maklum.</div>
        @endif

        {{-- TANDA TANGAN PELAKSANA --}}
        <div class="{{ $hasContent ? 'ttd-wrapper-flow' : 'ttd-wrapper-bottom' }}">
            <div class="ttd-date">Indramayu, {{ $sppd['tanggal_kembali_indo'] }}</div>

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
