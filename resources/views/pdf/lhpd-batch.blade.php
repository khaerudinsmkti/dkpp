<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Hasil Perjalanan Dinas (LHPD) - {{ $batchCode }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1.6cm 1.8cm 1.6cm 1.8cm;
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
            height: 26.2cm;
        }

        /* JUDUL */
        .judul-box {
            text-align: center;
            margin-bottom: 20px;
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
        }
        .meta-table td {
            vertical-align: top;
            padding: 2px 0;
            line-height: 1.4;
        }
        .m-label {
            width: 145px;
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

        /* TANDA TANGAN (MEPET BAWAH HALAMAN) */
        .ttd-wrapper {
            position: absolute;
            bottom: 0;
            left: 42px;
            right: 0;
            font-size: 9.5pt;
        }
        .ttd-date {
            margin-bottom: 12px;
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
            padding-bottom: 20px;
        }
        .pelaksana-row td {
            padding-bottom: 20px;
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
    <div class="lhpd-page">
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

        {{-- TANDA TANGAN PELAKSANA --}}
        <div class="ttd-wrapper">
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
