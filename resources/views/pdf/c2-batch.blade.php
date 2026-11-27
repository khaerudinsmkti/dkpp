<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan C2 Perincian Pengeluaran - {{ $batchCode }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1.2cm 1.5cm 1.4cm 1.5cm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9pt;
            color: #000000;
            line-height: 1.2;
            margin: 0;
            padding: 0;
        }
        .title {
            text-align: center;
            font-size: 10pt;
            font-weight: bold;
            margin: 0 0 8px 0;
            text-transform: uppercase;
        }
        /* Tabel Metadata Atas */
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }
        .meta-table td {
            vertical-align: top;
            padding: 1px 0;
            font-size: 8.8pt;
            line-height: 1.18;
        }
        .m-label {
            width: 125px;
        }
        .m-colon {
            width: 8px;
            text-align: center;
        }
        .m-val {
            text-align: left;
        }

        /* Tabel Rincian C2 (7 Kolom) */
        .c2-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
        }
        .c2-table th,
        .c2-table td {
            border: 1px solid #000000;
            padding: 4px 5px;
            font-size: 8.2pt;
            line-height: 1.22;
        }
        .c2-table thead th {
            font-weight: bold;
            text-align: center;
            vertical-align: middle;
        }
        .col-idx-row th {
            padding: 1.5px 4px;
            font-size: 7.8pt;
            font-weight: bold;
            text-align: center;
        }
        .c-no {
            width: 22px;
            text-align: center;
            vertical-align: top;
        }
        .c-nama {
            width: 162px;
            vertical-align: top;
        }
        .c-tanggal {
            width: 72px;
            text-align: center;
            vertical-align: top;
        }
        .c-tujuan {
            vertical-align: top;
        }
        .c-uang {
            width: 55px;
            text-align: right;
            vertical-align: middle;
        }
        .c-transpot {
            width: 52px;
            text-align: right;
            vertical-align: middle;
        }
        .c-pengajuan {
            width: 58px;
            text-align: right;
            vertical-align: middle;
        }
        .nama-bold {
            font-weight: bold;
            margin-bottom: 2px;
        }
        .nip-nowrap {
            white-space: nowrap;
            margin-bottom: 2px;
        }
        .sub-line {
            margin-bottom: 2px;
        }
        .tujuan-line {
            margin-bottom: 2px;
        }
        .total-row td {
            font-weight: bold;
            padding: 4px 5px;
        }

        /* Tanda Tangan PPTK */
        .ttd-wrapper {
            width: 100%;
            margin-top: 18px;
            page-break-inside: avoid;
        }
        .ttd-box {
            width: 280px;
            margin: 0 auto;
            text-align: center;
            font-size: 9pt;
            line-height: 1.25;
        }
        .ttd-space {
            height: 66px;
        }
        .ttd-nama {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="title">PERINCIAN PENGELUARAN MENURUT TANDA BUKTI TERLAMPIR</div>

    <table class="meta-table">
        <tr>
            <td class="m-label">Tanggal Pembukuan</td>
            <td class="m-colon">:</td>
            <td class="m-val"></td>
        </tr>
        <tr>
            <td class="m-label">Nomor Bukti Kas</td>
            <td class="m-colon">:</td>
            <td class="m-val"></td>
        </tr>
        <tr>
            <td class="m-label">Kegiatan</td>
            <td class="m-colon">:</td>
            <td class="m-val">{{ $namaKegiatan }}</td>
        </tr>
        <tr>
            <td class="m-label">Sub Kegiatan</td>
            <td class="m-colon">:</td>
            <td class="m-val">{{ $namaSubKegiatan }}</td>
        </tr>
        <tr>
            <td class="m-label">Tahun Anggaran</td>
            <td class="m-colon">:</td>
            <td class="m-val">{{ $tahunAnggaran }}</td>
        </tr>
        <tr>
            <td class="m-label">Kode Rekening</td>
            <td class="m-colon">:</td>
            <td class="m-val">{{ $noRekening }}</td>
        </tr>
        <tr>
            <td class="m-label">No.DPA</td>
            <td class="m-colon">:</td>
            <td class="m-val">{{ $nomorDpaDisplay }}</td>
        </tr>
        <tr>
            <td class="m-label">Jenis Pengeluaran</td>
            <td class="m-colon">:</td>
            <td class="m-val">Perjalanan Dinas Dalam Kota</td>
        </tr>
        <tr>
            <td class="m-label">Jumlah Uang</td>
            <td class="m-colon">:</td>
            <td class="m-val"><strong>Rp. {{ $totalFormatted }}</strong></td>
        </tr>
        <tr>
            <td class="m-label"></td>
            <td class="m-colon"></td>
            <td class="m-val"><strong><em>{{ $terbilangText }}</em></strong></td>
        </tr>
        <tr>
            <td class="m-label" style="padding-top: 4px;">Jumlah Tanda Bukti</td>
            <td class="m-colon" style="padding-top: 4px;">:</td>
            <td class="m-val" style="padding-top: 4px;">{{ $jumlahTandaBuktiDisplay }}</td>
        </tr>
    </table>

    <table class="c2-table">
        <thead>
            <tr>
                <th class="c-no">NO</th>
                <th class="c-nama">NAMA</th>
                <th class="c-tanggal">TANGGAL</th>
                <th class="c-tujuan">TUJUAN</th>
                <th class="c-uang">UANG<br>HARIAN<br>(Rp.)</th>
                <th class="c-transpot">TRANSPOT<br>(Rp.)</th>
                <th class="c-pengajuan">PENGAJUAN<br>(RP.)</th>
            </tr>
            <tr class="col-idx-row">
                <th>1</th>
                <th>2</th>
                <th>3</th>
                <th>4</th>
                <th>5</th>
                <th>6</th>
                <th>7</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($rows as $idx => $row)
                <tr>
                    <td class="c-no">{{ $idx + 1 }}</td>
                    <td class="c-nama">
                        <div class="nama-bold">{{ $row['nama'] }}</div>
                        <div class="nip-nowrap">NIP. {{ $row['nip'] }}</div>
                        <div>{{ $row['pangkat_gol'] }}</div>
                    </td>
                    <td class="c-tanggal">{{ $row['tanggal_berangkat_indo'] }}</td>
                    <td class="c-tujuan">
                        <div class="tujuan-line">Uang Harian Belanja Perjalanan Dinas Dalam Kota Dibayar (1 Hari x Rp. {{ $row['uang_saku_formatted'] }},- = Rp. {{ $row['uang_saku_formatted'] }},-)</div>
                        <div>{{ $row['tujuan_kalimat'] }}</div>
                    </td>
                    <td class="c-uang">{{ $row['uang_saku_formatted'] }}</td>
                    <td class="c-transpot"></td>
                    <td class="c-pengajuan">{{ $row['uang_saku_formatted'] }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="4" style="text-align: center;">JUMLAH TOTAL</td>
                <td></td>
                <td></td>
                <td style="text-align: right;">{{ $totalFormatted }}</td>
            </tr>
        </tbody>
    </table>

    <div class="ttd-wrapper">
        <div class="ttd-box">
            <div>Indramayu,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ $tahunAnggaran }}</div>
            <div>Pejabat Pelaksana Teknis Kegiatan</div>
            <div class="ttd-space"></div>
            <div class="ttd-nama">{{ $pptkNama }}</div>
            <div>NIP. {{ $pptkNip }}</div>
        </div>
    </div>
</body>
</html>
