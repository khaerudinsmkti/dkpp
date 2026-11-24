<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Rincian Biaya Perjalanan Dinas Luar Kota - {{ $batchCode }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1.2cm 1.5cm 1.5cm 1.5cm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9.5pt;
            color: #000000;
            line-height: 1.3;
            margin: 0;
            padding: 0;
        }
        .page-break {
            page-break-after: always;
        }

        /* KOP SURAT */
        .kop-table {
            width: 100%;
            border-collapse: collapse;
        }
        .kop-logo-cell {
            width: 82px;
            vertical-align: middle;
            text-align: center;
            padding-right: 8px;
        }
        .kop-logo {
            width: 72px;
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
            font-size: 8.8pt;
            font-weight: normal;
            margin: 0;
            line-height: 1.22;
        }
        .kop-line-thick {
            border-top: 2.5px solid #000000;
            margin-top: 6px;
            margin-bottom: 18px;
        }

        /* JUDUL */
        .judul-box {
            text-align: center;
            margin-bottom: 14px;
        }
        .judul-text {
            font-size: 10.5pt;
            font-weight: bold;
            text-decoration: underline;
            margin: 0;
            letter-spacing: 0.2px;
        }

        /* METADATA */
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            font-size: 9pt;
        }
        .meta-table td {
            vertical-align: top;
            padding: 2px 0;
        }
        .m-label {
            width: 175px;
        }
        .m-colon {
            width: 10px;
            text-align: center;
        }

        /* TABEL RINCIAN */
        .rincian-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            margin-bottom: 16px;
        }
        .rincian-table th,
        .rincian-table td {
            border: 1px solid #000000;
            padding: 5px 6px;
            vertical-align: top;
        }
        .rincian-table th {
            text-align: center;
            font-weight: bold;
            vertical-align: middle;
        }
        .header-main th {
            padding: 7px 6px;
            border-bottom: 1px solid #000000;
        }
        .header-num th {
            padding: 2px 6px;
            font-size: 8.8pt;
            border-top: 3px double #000000;
        }
        .col-no {
            width: 5%;
            text-align: center;
        }
        .col-rincian {
            width: 24%;
            text-align: left;
        }
        .col-jumlah {
            width: 13%;
            text-align: right;
            white-space: nowrap;
        }
        .col-ket {
            width: 58%;
            text-align: left;
        }
        .body-cell {
            padding-top: 6px;
            padding-bottom: 12px;
        }
        .transport-cell {
            padding-top: 6px;
            padding-bottom: 6px;
        }

        /* Inner breakdown table inside JUMLAH & KETERANGAN */
        .ket-inner-table {
            width: 100%;
            border-collapse: collapse;
        }
        .ket-inner-table td {
            border: none;
            padding: 0 0 10px 0;
            vertical-align: top;
            line-height: 1.3;
        }
        .ket-inner-table tr:last-child td {
            padding-bottom: 0;
        }
        .ket-label {
            width: 90px;
            white-space: nowrap;
        }
        .ket-colon {
            width: 12px;
            text-align: center;
        }
        .ket-formula {
            white-space: nowrap;
        }
        .jumlah-item {
            padding-bottom: 10px;
            line-height: 1.3;
        }
        .jumlah-item:last-child {
            padding-bottom: 0;
        }

        .total-row td {
            font-weight: bold;
            padding: 4px 6px;
            border-top: 1px solid #000000;
            border-bottom: 1px solid #000000;
        }
        .terbilang-row td {
            font-weight: bold;
            font-style: italic;
            text-align: left;
            padding: 5px 6px;
        }

        /* TANDA TANGAN */
        .ttd-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 9pt;
            page-break-inside: avoid;
        }
        .ttd-table td {
            vertical-align: top;
            padding: 0;
        }
        .ttd-left {
            width: 48%;
        }
        .ttd-gap {
            width: 8%;
        }
        .ttd-right {
            width: 44%;
        }
        .ttd-line {
            margin-bottom: 6px;
            line-height: 1.3;
        }
        .ttd-amount-left {
            font-weight: bold;
            text-align: center;
            padding-right: 40px;
            margin: 8px 0 8px 0;
        }
        .ttd-amount-right {
            font-weight: bold;
            text-align: right;
            padding-right: 16px;
            margin: 8px 0 8px 0;
        }
        .ttd-role-left {
            text-align: center;
            padding-right: 60px;
        }
        .ttd-role-right {
            text-align: center;
            padding-left: 10px;
        }
        .ttd-space {
            height: 70px;
        }
        .ttd-sig-left {
            text-align: center;
            padding-right: 60px;
        }
        .ttd-sig-right {
            text-align: center;
            padding-left: 10px;
        }
        .ttd-nama {
            font-weight: bold;
            text-decoration: underline;
        }
        .ttd-nip {
            font-weight: bold;
        }
    </style>
</head>
<body>
@foreach ($sppdList as $sppd)
    <div>
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
            <p class="judul-text">RINCIAN BIAYA PERJALANAN DINAS</p>
        </div>

        {{-- METADATA --}}
        <table class="meta-table">
            <tr>
                <td class="m-label">LAMPIRAN SPD NOMOR</td>
                <td class="m-colon">:</td>
                <td>{{ $sppd['nomor_spd'] }}</td>
            </tr>
            <tr>
                <td class="m-label">TANGGAL</td>
                <td class="m-colon">:</td>
                <td>{{ $sppd['tanggal_kembali_indo'] }}</td>
            </tr>
        </table>

        {{-- TABEL RINCIAN BIAYA --}}
        <table class="rincian-table">
            <thead>
                <tr class="header-main">
                    <th class="col-no">NO</th>
                    <th class="col-rincian">RINCIAN BIAYA</th>
                    <th class="col-jumlah">JUMLAH</th>
                    <th class="col-ket">KETERANGAN</th>
                </tr>
                <tr class="header-num">
                    <th>1</th>
                    <th>2</th>
                    <th>3</th>
                    <th>4</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="col-no body-cell">1</td>
                    <td class="col-rincian body-cell">
                        Uang Harian ke {{ $sppd['tujuan_kab_kota'] }}
                    </td>
                    <td class="col-jumlah body-cell">
                        @foreach ($sppd['groups'] as $grp)
                            <div class="jumlah-item">{{ $grp['subtotal_formatted'] }}</div>
                        @endforeach
                    </td>
                    <td class="col-ket body-cell">
                        <table class="ket-inner-table">
                            @foreach ($sppd['groups'] as $grp)
                                <tr>
                                    <td class="ket-label">{{ $grp['label'] }}</td>
                                    <td class="ket-colon">:</td>
                                    <td class="ket-formula">
                                        {{ $sppd['lama_hari'] }} Hari x {{ $grp['count'] }} Org x Rp. {{ $grp['rate_formatted'] }},- = Rp. {{ $grp['subtotal_formatted'] }},-
                                    </td>
                                </tr>
                            @endforeach
                        </table>
                    </td>
                </tr>
                <tr>
                    <td class="col-no transport-cell">2</td>
                    <td class="col-rincian transport-cell">Transport (PP)</td>
                    <td class="col-jumlah transport-cell">{{ $sppd['total_transport_formatted'] }}</td>
                    <td class="col-ket transport-cell"></td>
                </tr>
                <tr class="total-row">
                    <td colspan="2" style="text-align: center;">JUMLAH</td>
                    <td class="col-jumlah">{{ $sppd['total_biaya_formatted'] }}</td>
                    <td></td>
                </tr>
                <tr class="terbilang-row">
                    <td colspan="4">TERBILANG : {{ $sppd['terbilang_text'] }}</td>
                </tr>
            </tbody>
        </table>

        {{-- TANDA TANGAN BENDAHARA & YANG MENERIMA --}}
        <table class="ttd-table">
            <tr>
                <td class="ttd-left">
                    <div class="ttd-line">&nbsp;</div>
                    <div class="ttd-line">Telah dibayar sejumlah</div>
                    <div class="ttd-amount-left">Rp{{ $sppd['total_biaya_formatted'] }}</div>
                    <div class="ttd-role-left">Bendahara Pengeluaran</div>
                    <div class="ttd-space"></div>
                    <div class="ttd-sig-left">
                        <div class="ttd-nama">{{ $sppd['bendahara_nama'] }}</div>
                        <div class="ttd-nip">NIP. {{ $sppd['bendahara_nip'] }}</div>
                    </div>
                </td>
                <td class="ttd-gap"></td>
                <td class="ttd-right">
                    <div class="ttd-line">Indramayu,</div>
                    <div class="ttd-line">Telah menerima jumlah uang sebesar</div>
                    <div class="ttd-amount-right">Rp{{ $sppd['total_biaya_formatted'] }}</div>
                    <div class="ttd-role-right">Yang menerima</div>
                    <div class="ttd-space"></div>
                    <div class="ttd-sig-right">
                        <div class="ttd-nama">{{ $sppd['penerima_nama'] }}</div>
                        <div class="ttd-nip">NIP. {{ $sppd['penerima_nip'] }}</div>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    @if (!$loop->last)
        <div class="page-break"></div>
    @endif
@endforeach
</body>
</html>
