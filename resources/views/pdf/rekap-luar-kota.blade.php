<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Rekapitulasi Perjalanan Dinas Luar Kota - {{ $batchCode }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1.1cm 1.2cm 1.3cm 1.2cm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 8.5pt;
            color: #000000;
            line-height: 1.25;
            margin: 0;
            padding: 0;
        }

        /* KOP SURAT */
        .kop-table {
            width: 100%;
            border-collapse: collapse;
        }
        .kop-logo-cell {
            width: 80px;
            vertical-align: middle;
            text-align: center;
            padding-right: 8px;
        }
        .kop-logo {
            width: 70px;
            height: auto;
        }
        .kop-text-cell {
            vertical-align: middle;
            text-align: center;
        }
        .kop-pemkab {
            font-size: 13pt;
            font-weight: normal;
            letter-spacing: 0.3px;
            margin: 0;
            line-height: 1.15;
        }
        .kop-dinas {
            font-size: 15.5pt;
            font-weight: bold;
            letter-spacing: 0.2px;
            margin: 1px 0 2px 0;
            line-height: 1.15;
        }
        .kop-alamat {
            font-size: 8.6pt;
            font-weight: normal;
            margin: 0;
            line-height: 1.2;
        }
        .kop-line-thick {
            border-top: 2.5px solid #000000;
            margin-top: 5px;
            margin-bottom: 12px;
        }

        /* JUDUL */
        .judul-box {
            text-align: center;
            margin-bottom: 14px;
        }
        .judul-text {
            font-size: 10pt;
            font-weight: bold;
            text-decoration: underline;
            margin: 0 0 4px 0;
            letter-spacing: 0.2px;
        }
        .nomor-text {
            font-size: 8.5pt;
            margin: 0;
        }

        /* TABEL REKAP */
        .rekap-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
            margin-bottom: 14px;
        }
        .rekap-table th,
        .rekap-table td {
            border: 1px solid #000000;
            padding: 4px 4px;
            vertical-align: middle;
        }
        .rekap-table th {
            text-align: center;
            font-weight: bold;
            line-height: 1.2;
            background-color: #f3f3f3;
        }
        .header-main th {
            border: 1px solid #000000;
            padding-top: 6px;
            padding-bottom: 5px;
        }
        .col-idx-row th {
            border: 1px solid #000000;
            padding: 2px 4px 4px 4px;
            font-size: 7.8pt;
            background-color: #ffffff;
        }
        .c-no {
            width: 4%;
            text-align: center;
        }
        .c-nama {
            width: 21%;
            text-align: left;
        }
        .c-gol {
            width: 6.5%;
            text-align: center;
            white-space: nowrap;
        }
        .c-tujuan {
            width: 11.5%;
            text-align: center;
        }
        .c-tgl {
            width: 15%;
            text-align: center;
        }
        .c-uraian {
            width: 11%;
            text-align: left;
            white-space: nowrap;
        }
        .c-uang {
            width: 10%;
            text-align: right;
            white-space: nowrap;
        }
        .c-lama {
            width: 10%;
            text-align: center;
            white-space: nowrap;
        }
        .c-jumlah {
            width: 11%;
            text-align: right;
            white-space: nowrap;
        }
        .rek-banner td {
            text-align: left;
            padding: 8px 14px;
            font-size: 8pt;
            border: 1px solid #000000;
        }
        .total-row td {
            font-weight: bold;
            padding: 5px 5px;
            border: 1px solid #000000;
        }
        .terbilang-row td {
            font-weight: bold;
            font-style: italic;
            text-align: left;
            padding: 8px 14px;
            border: 1px solid #000000;
        }

        /* TANDA TANGAN */
        .ttd-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 8.5pt;
            page-break-inside: avoid;
        }
        .ttd-spacer {
            width: 52%;
        }
        .ttd-box {
            width: 48%;
            vertical-align: top;
            text-align: center;
            line-height: 1.3;
        }
        .ttd-date {
            text-align: left;
            padding-left: 16px;
            margin-bottom: 3px;
        }
        .ttd-role {
            margin-bottom: 66px;
        }
        .ttd-nama {
            font-weight: bold;
        }
        .ttd-nip {
            font-weight: normal;
            white-space: nowrap;
        }
    </style>
</head>
<body>
    {{-- KOP SURAT --}}
    <table class="kop-table">
        <tr>
            <td class="kop-logo-cell">
                @if (!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" class="kop-logo" alt="Logo Indramayu">
                @endif
            </td>
            <td class="kop-text-cell">
                <p class="kop-pemkab">PEMERINTAH KABUPATEN INDRAMAYU</p>
                <p class="kop-dinas">DINAS KETAHANAN PANGAN DAN PERTANIAN</p>
                <p class="kop-alamat">
                    Jl. Pasar Baru No. 445, Karangmalang, Indramayu 45213, Jawa Barat<br>
                    Telepon (0234) 272082, Faksimile (0234) 275413, Laman www.dkpp.indramayukab.go.id,<br>
                    Pos-el dkppindramayu@gmail.com
                </p>
            </td>
        </tr>
    </table>
    <div class="kop-line-thick"></div>

    {{-- JUDUL --}}
    <div class="judul-box">
        <p class="judul-text">REKAPITULASI PERJALANAN DINAS</p>
        <p class="nomor-text">Nomor :&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>
    </div>

    {{-- TABEL REKAP --}}
    <table class="rekap-table">
        <thead>
            <tr class="header-main">
                <th class="c-no">NO</th>
                <th class="c-nama" style="text-align: center;">NAMA NIP</th>
                <th class="c-gol">GOL</th>
                <th class="c-tujuan" style="text-align: center;">TUJUAN</th>
                <th class="c-tgl">TANGGAL</th>
                <th class="c-uraian" style="text-align: center;">URAIAN</th>
                <th class="c-uang" style="text-align: center;">UANG<br>PERJALANAN<br>(Rp.)</th>
                <th class="c-lama">LAMA<br>PERJALANAN</th>
                <th class="c-jumlah" style="text-align: center;">JUMLAH (Rp.)</th>
            </tr>
            <tr class="col-idx-row">
                <th>1</th>
                <th>2</th>
                <th>3</th>
                <th>4</th>
                <th>5</th>
                <th>6</th>
                <th>7</th>
                <th>8</th>
                <th>9</th>
            </tr>
        </thead>
        <tbody>
            <tr class="rek-banner">
                <td colspan="9">
                    5.1.02.04.01.0001&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;BELANJA PERJALANAN DINAS BIASA
                </td>
            </tr>
            @foreach ($rows as $row)
                @if ($row['type'] === 'participant')
                    <tr>
                        <td class="c-no">{{ $row['no'] }}</td>
                        <td class="c-nama">{{ $row['nama'] }}</td>
                        <td class="c-gol">{{ $row['golongan'] }}</td>
                        <td class="c-tujuan">{{ $row['tujuan'] }}</td>
                        <td class="c-tgl">{{ $row['tanggal'] }}</td>
                        <td class="c-uraian">Uang Harian</td>
                        <td class="c-uang">{{ $row['uang_perjalanan_formatted'] }}</td>
                        <td class="c-lama">{{ $row['lama_hari'] }} Hari</td>
                        <td class="c-jumlah">{{ $row['jumlah_formatted'] }}</td>
                    </tr>
                @else
                    <tr>
                        <td class="c-no"></td>
                        <td class="c-nama"></td>
                        <td class="c-gol"></td>
                        <td class="c-tujuan"></td>
                        <td class="c-tgl"></td>
                        <td class="c-uraian">Transport (PP)</td>
                        <td class="c-uang">{{ $row['uang_perjalanan_formatted'] }}</td>
                        <td class="c-lama"></td>
                        <td class="c-jumlah">{{ $row['jumlah_formatted'] }}</td>
                    </tr>
                @endif
            @endforeach
            <tr class="total-row">
                <td colspan="8" style="text-align: center;">TOTAL</td>
                <td class="c-jumlah">Rp&nbsp;&nbsp;{{ $totalFormatted }}</td>
            </tr>
            <tr class="terbilang-row">
                <td colspan="9">TERBILANG : {{ $terbilangText }}</td>
            </tr>
        </tbody>
    </table>

    {{-- TANDA TANGAN PENGGUNA ANGGARAN --}}
    <table class="ttd-table">
        <tr>
            <td class="ttd-spacer"></td>
            <td class="ttd-box">
                <div class="ttd-date">Indramayu,</div>
                <div class="ttd-role">PENGGUNA ANGGARAN</div>
                <div class="ttd-nama">{{ $kadinNama }}</div>
                <div class="ttd-nip">NIP. {{ $kadinNip }}</div>
            </td>
        </tr>
    </table>
</body>
</html>
