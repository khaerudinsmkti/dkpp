<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Kwitansi Tanda Terima Uang Harian - {{ $batchCode }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1.2cm 1.4cm 1.4cm 1.4cm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9pt;
            color: #000000;
            line-height: 1.28;
            margin: 0;
            padding: 0;
        }
        .page-break {
            page-break-after: always;
        }

        /* HEADER METADATA TOP LEFT */
        .top-meta-table {
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 8.8pt;
        }
        .top-meta-table td {
            padding: 1px 0;
            vertical-align: top;
        }
        .tm-label {
            width: 115px;
        }
        .tm-colon {
            width: 10px;
            text-align: center;
        }

        /* JUDUL */
        .judul-box {
            text-align: center;
            margin-bottom: 14px;
            font-weight: bold;
            font-size: 9.5pt;
            line-height: 1.3;
        }

        /* INFO KWITANSI */
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
            font-size: 8.8pt;
        }
        .info-table td {
            vertical-align: top;
            padding: 3px 0;
        }
        .i-label {
            width: 122px;
            white-space: nowrap;
        }
        .i-colon {
            width: 12px;
            text-align: center;
        }
        .terbilang-box {
            border: 1px solid #000000;
            padding: 7px 10px;
            text-align: center;
            font-weight: bold;
            font-style: italic;
            font-size: 9pt;
        }
        .sub-detail-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 3px;
            font-size: 8.8pt;
        }
        .sub-detail-table td {
            vertical-align: top;
            padding: 2px 0;
        }
        .sd-left {
            width: 55%;
        }
        .sd-label {
            width: 34px;
            white-space: nowrap;
        }
        .sd-val {
            font-weight: bold;
        }
        .kegiatan-line {
            margin: 6px 0 10px 0;
            font-size: 8.8pt;
            line-height: 1.3;
        }
        .jumlah-row-table {
            border-collapse: collapse;
            margin-bottom: 12px;
            font-size: 8.8pt;
        }
        .jumlah-row-table td {
            vertical-align: middle;
            padding: 0;
        }
        .jumlah-box {
            border: 1px solid #000000;
            width: 240px;
            padding: 6px 12px;
            font-weight: bold;
            font-size: 9.5pt;
            text-align: center;
        }

        /* TABEL PENERIMA */
        .kwitansi-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.6pt;
            margin-bottom: 10px;
        }
        .kwitansi-table th,
        .kwitansi-table td {
            border: 1px solid #000000;
            padding: 5px 6px;
            vertical-align: top;
        }
        .kwitansi-table th {
            text-align: center;
            font-weight: bold;
            vertical-align: middle;
        }
        .col-idx-row th {
            padding: 2px 4px;
            font-size: 8.2pt;
        }
        .c-no {
            width: 5%;
            text-align: center;
        }
        .c-nama {
            width: 31%;
            text-align: left;
            line-height: 1.28;
        }
        .c-jabatan {
            width: 27%;
            text-align: center;
            vertical-align: middle;
            line-height: 1.25;
        }
        .c-uang {
            width: 17%;
            text-align: right;
            vertical-align: middle;
            white-space: nowrap;
        }
        .c-ttd {
            width: 20%;
            vertical-align: middle;
            padding: 8px 8px;
        }
        .nama-bold {
            font-weight: bold;
            margin-bottom: 2px;
        }
        .nip-nowrap {
            white-space: nowrap;
            margin-bottom: 2px;
        }
        .ttd-left-item {
            text-align: left;
        }
        .total-row td {
            font-weight: bold;
            padding: 6px 6px;
        }

        /* TANDA TANGAN 3 KOLOM */
        .ttd-wrapper {
            width: 100%;
            margin-top: 4px;
            page-break-inside: avoid;
        }
        .lunas-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.6pt;
            margin-bottom: 2px;
        }
        .lunas-spacer {
            width: 67%;
        }
        .lunas-box {
            width: 33%;
            font-weight: bold;
            line-height: 1.3;
        }
        .lunas-inner {
            border-collapse: collapse;
            width: 100%;
        }
        .lunas-inner td {
            padding: 0;
            vertical-align: top;
        }
        .ttd-3col {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.6pt;
        }
        .ttd-3col td {
            width: 33.33%;
            text-align: center;
            vertical-align: bottom;
            padding: 0 4px;
            line-height: 1.25;
        }
        .ttd-role-row td {
            font-weight: bold;
        }
        .ttd-space-row td {
            height: 76px;
        }
        .ttd-nama {
            font-weight: bold;
            text-decoration: underline;
        }
        .ttd-nip {
            font-weight: normal;
            white-space: nowrap;
        }
    </style>
</head>
<body>
@foreach ($sppdList as $sppd)
    <div>
        {{-- TOP LEFT METADATA --}}
        <table class="top-meta-table">
            <tr>
                <td class="tm-label">No Sub Kegiatan</td>
                <td class="tm-colon">:</td>
                <td>{{ $kodeSubKegiatan }}</td>
            </tr>
            <tr>
                <td class="tm-label">No Rekening</td>
                <td class="tm-colon">:</td>
                <td>{{ $noRekening }}</td>
            </tr>
        </table>

        {{-- JUDUL --}}
        <div class="judul-box">
            <div>TANDA TERIMA UANG HARIAN</div>
            <div>PERJALANAN DINAS DALAM KOTA</div>
            <div>SUB KEGIATAN {{ strtoupper($namaSubKegiatan) }}</div>
        </div>

        {{-- INFORMASI KWITANSI --}}
        <table class="info-table">
            <tr>
                <td class="i-label">SUDAH TERIMA DARI</td>
                <td class="i-colon">:</td>
                <td>BENDAHARA PENGELUARAN DINAS KETAHANAN PANGAN DAN PERTANIAN KABUPATEN INDRAMAYU</td>
            </tr>
            <tr>
                <td class="i-label" style="vertical-align: middle; padding-top: 8px; padding-bottom: 8px;">TERBILANG</td>
                <td class="i-colon" style="vertical-align: middle; padding-top: 8px; padding-bottom: 8px;">:</td>
                <td style="padding-top: 6px; padding-bottom: 6px;">
                    <div class="terbilang-box">
                        === &nbsp; {{ $sppd['terbilang_text'] }} &nbsp; ===
                    </div>
                </td>
            </tr>
            <tr>
                <td class="i-label">UNTUK PEMBAYARAN</td>
                <td class="i-colon">:</td>
                <td>
                    <div>Uang Harian Perjalanan Dinas Dalam Kota Selama 1 (satu) hari</div>
                    <table class="sub-detail-table">
                        <tr>
                            <td class="sd-left"></td>
                            <td class="sd-label">Ke :</td>
                            <td class="sd-val">
                                <div>{{ $sppd['tempat_tujuan'] }}</div>
                                <div>Kec. {{ $sppd['nama_kecamatan'] }}</div>
                            </td>
                        </tr>
                        <tr>
                            <td class="sd-left" style="padding-top: 4px;">
                                Sesuai dengan SPPD No: {{ $sppd['nomor_spt'] }}
                            </td>
                            <td class="sd-label" style="padding-top: 4px;">Tgl :</td>
                            <td style="padding-top: 4px;">{{ $sppd['tanggal_berangkat_indo'] }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <div class="kegiatan-line">
            Melaksanakan Kegiatan {{ $namaSubKegiatan }} Tahun Anggaran {{ $tahunAnggaran }}.
        </div>

        {{-- JUMLAH --}}
        <table class="jumlah-row-table">
            <tr>
                <td class="i-label">JUMLAH</td>
                <td class="i-colon">:</td>
                <td>
                    <div class="jumlah-box">
                        Rp. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {{ $sppd['total_formatted'] }} ,-
                    </div>
                </td>
            </tr>
        </table>

        {{-- TABEL PENERIMA --}}
        <table class="kwitansi-table">
            <thead>
                <tr>
                    <th class="c-no">No.</th>
                    <th class="c-nama" style="text-align: center;">NAMA/PANGKAT/GOL/NIP</th>
                    <th class="c-jabatan">JABATAN</th>
                    <th class="c-uang" style="text-align: center;">UANG HARIAN<br>(RP.)</th>
                    <th class="c-ttd" style="text-align: center;">TANDA TANGAN</th>
                </tr>
                <tr class="col-idx-row">
                    <th>1</th>
                    <th>2</th>
                    <th>3</th>
                    <th>4</th>
                    <th>5</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($sppd['participants'] as $idx => $pt)
                    <tr>
                        <td class="c-no">{{ $idx + 1 }}.</td>
                        <td class="c-nama">
                            <div class="nama-bold">{{ $pt['nama'] }}</div>
                            <div class="nip-nowrap">NIP.{{ $pt['nip'] }}</div>
                            <div>{{ $pt['pangkat_gol'] }}</div>
                        </td>
                        <td class="c-jabatan">{{ $pt['jabatan'] }}</td>
                        <td class="c-uang">{{ $pt['uang_saku_formatted'] }}</td>
                        <td class="c-ttd">
                            <div class="ttd-left-item">{{ $idx + 1 }}. .................</div>
                        </td>
                    </tr>
                @endforeach
                <tr class="total-row">
                    <td colspan="3" style="text-align: center;">JUMLAH</td>
                    <td class="c-uang">{{ $sppd['total_formatted'] }}</td>
                    <td></td>
                </tr>
            </tbody>
        </table>

        {{-- TANDA TANGAN 3 KOLOM --}}
        <div class="ttd-wrapper">
            <table class="lunas-table">
                <tr>
                    <td class="lunas-spacer"></td>
                    <td class="lunas-box">
                        <table class="lunas-inner">
                            <tr>
                                <td colspan="2">Indramayu,</td>
                            </tr>
                            <tr>
                                <td style="width: 90px;">Lunas Dibayar</td>
                                <td>:</td>
                            </tr>
                            <tr>
                                <td>Tanggal</td>
                                <td>:</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <table class="ttd-3col">
                <tr class="ttd-role-row">
                    <td>
                        Mengetahui/Menyetujui :<br>
                        Pengguna Anggaran
                    </td>
                    <td>PPTK,</td>
                    <td>Bendahara Pengeluaran</td>
                </tr>
                <tr class="ttd-space-row">
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                </tr>
                <tr>
                    <td>
                        <div class="ttd-nama">{{ $sppd['kadin_nama'] }}</div>
                        <div class="ttd-nip">NIP. {{ $sppd['kadin_nip'] }}</div>
                    </td>
                    <td>
                        <div class="ttd-nama">{{ $sppd['pptk_nama'] }}</div>
                        <div class="ttd-nip">NIP. {{ $sppd['pptk_nip'] }}</div>
                    </td>
                    <td>
                        <div class="ttd-nama">{{ $sppd['bendahara_nama'] }}</div>
                        <div class="ttd-nip">NIP. {{ $sppd['bendahara_nip'] }}</div>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    @if (!$loop->last)
        <div class="page-break"></div>
    @endif
@endforeach
</body>
</html>
