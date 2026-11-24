<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan C2 Perincian Pengeluaran SPPD Luar Kota - {{ $batchCode }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1.5cm 1.6cm 1.5cm 1.6cm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9.5pt;
            color: #000000;
            line-height: 1.25;
            margin: 0;
            padding: 0;
        }
        .title {
            text-align: center;
            font-size: 10.5pt;
            font-weight: bold;
            margin: 0 0 14px 0;
            text-transform: uppercase;
        }
        /* Tabel Metadata Atas */
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        .meta-table td {
            vertical-align: top;
            padding: 1.5px 0;
            font-size: 9.5pt;
            line-height: 1.22;
        }
        .m-label {
            width: 145px;
        }
        .m-colon {
            width: 10px;
            text-align: center;
        }
        .m-val {
            text-align: left;
        }
        .uang-inline-table {
            border-collapse: collapse;
        }
        .uang-inline-table td {
            padding: 0;
            font-weight: bold;
        }
        .terbilang-meta {
            font-style: italic;
            text-transform: uppercase;
        }

        /* Tabel Rincian C2 (7 Kolom) */
        .c2-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
        }
        .c2-table thead th {
            border: 1px solid #000000;
            padding: 5px 4px;
            font-family: "Times New Roman", Times, serif;
            font-size: 8.5pt;
            font-weight: bold;
            text-align: center;
            vertical-align: middle;
            line-height: 1.15;
        }
        .col-idx-row th {
            padding: 2px 4px !important;
            font-size: 8.5pt !important;
            font-weight: bold;
            text-align: center;
        }
        .c2-table tbody td {
            border-left: 1px solid #000000;
            border-right: 1px solid #000000;
            border-top: none;
            border-bottom: none;
            padding: 6px 6px;
            font-size: 9.2pt;
            line-height: 1.28;
            vertical-align: top;
        }
        .c-no {
            width: 24px;
            text-align: center;
        }
        .c-nama {
            width: 158px;
        }
        .c-tanggal {
            width: 112px;
            text-align: center;
        }
        .c-tujuan {
            width: 96px;
        }
        .c-harian {
            width: 68px;
            text-align: right;
        }
        .c-transport {
            width: 64px;
            text-align: right;
        }
        .c-jumlah {
            width: 68px;
            text-align: right;
        }
        .nama-line {
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        .nip-line {
            white-space: nowrap;
            margin-bottom: 2px;
        }
        .pangkat-line {
            margin-bottom: 2px;
        }
        .harian-amount-offset {
            margin-top: 16px;
        }
        .c2-table tfoot td {
            border: 1px solid #000000;
            padding: 4px 6px;
            font-size: 9.2pt;
        }
        .jumlah-label-cell {
            text-align: center;
            font-weight: bold;
        }
        .jumlah-num-cell {
            text-align: right;
        }
        .jumlah-grand-cell {
            text-align: right;
            font-weight: bold;
        }
        .terbilang-footer-cell {
            font-weight: bold;
            font-style: italic;
            text-transform: uppercase;
            padding: 5px 14px !important;
        }

        /* Tanda Tangan PPTK */
        .ttd-wrapper {
            width: 100%;
            margin-top: 32px;
            page-break-inside: avoid;
        }
        .ttd-box {
            width: 290px;
            margin: 0 auto;
            text-align: center;
            font-size: 9.5pt;
            line-height: 1.28;
        }
        .ttd-space {
            height: 70px;
        }
        .ttd-nama {
            font-weight: bold;
            text-transform: uppercase;
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
            <td class="m-val">Perjalanan Dinas Biasa</td>
        </tr>
        <tr>
            <td class="m-label">Jumlah Uang</td>
            <td class="m-colon">:</td>
            <td class="m-val">
                <table class="uang-inline-table">
                    <tr>
                        <td style="width: 65px;">Rp</td>
                        <td style="text-align: right;">{{ $totalBiayaFormatted }}</td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td class="m-label"></td>
            <td class="m-colon"></td>
            <td class="m-val terbilang-meta">{{ $terbilangText }}</td>
        </tr>
    </table>

    <table class="c2-table">
        <thead>
            <tr>
                <th class="c-no">NO</th>
                <th class="c-nama">NAMA</th>
                <th class="c-tanggal">TANGGAL</th>
                <th class="c-tujuan">TUJUAN</th>
                <th class="c-harian">UANG<br>HARIAN (Rp.)</th>
                <th class="c-transport">UANG (Rp)</th>
                <th class="c-jumlah">JUMLAH</th>
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
            @foreach ($rows as $row)
                @if ($row['type'] === 'participant')
                    <tr>
                        <td class="c-no">{{ $row['no'] }}</td>
                        <td class="c-nama">
                            <div class="nama-line">{{ $row['nama'] }}</div>
                            <div class="nip-line">NIP.{{ $row['nip'] }}</div>
                            <div class="pangkat-line">{{ $row['pangkat_gol'] }}</div>
                        </td>
                        <td class="c-tanggal">{{ $row['tanggal'] }}</td>
                        <td class="c-tujuan">{{ $row['tujuan'] }}</td>
                        <td class="c-harian">
                            <div class="{{ $row['is_first'] ? 'harian-amount-offset' : '' }}">
                                {{ $row['uang_harian_formatted'] }}
                            </div>
                        </td>
                        <td class="c-transport"></td>
                        <td class="c-jumlah"></td>
                    </tr>
                @else
                    <tr>
                        <td class="c-no">{{ $row['no'] }}</td>
                        <td class="c-nama">Transport (PP)</td>
                        <td class="c-tanggal">{{ $row['tanggal'] }}</td>
                        <td class="c-tujuan">{{ $row['tujuan'] }}</td>
                        <td class="c-harian"></td>
                        <td class="c-transport">{{ $row['uang_transport_formatted'] }}</td>
                        <td class="c-jumlah"></td>
                    </tr>
                @endif
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="4" class="jumlah-label-cell">JUMLAH</td>
                <td class="jumlah-num-cell">{{ $totalHarianFormatted }}</td>
                <td class="jumlah-num-cell">{{ $totalTransportFormatted }}</td>
                <td class="jumlah-grand-cell">{{ $totalBiayaFormatted }}</td>
            </tr>
            <tr>
                <td colspan="7" class="terbilang-footer-cell">
                    TERBILANG : {{ $terbilangText }}
                </td>
            </tr>
        </tfoot>
    </table>

    <div class="ttd-wrapper">
        <div class="ttd-box">
            <div>Indramayu,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ $tahunAnggaran }}</div>
            <div>Pejabat Pelaksana Teknis Kegiatan</div>
            <div class="ttd-space"></div>
            <div class="ttd-nama">{{ $pptkNama }}</div>
            <div>NIP. {{ $pptkNip }}</div>
        </div>
    </div>
</body>
</html>
