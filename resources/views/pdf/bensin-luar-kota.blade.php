<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Lembar Bensin SPPD Luar Kota - {{ $batchCode }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1.5cm 1.8cm 1.4cm 1.8cm;
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
        .bensin-page {
            position: relative;
            height: 26.6cm;
        }
        .ttd-bottom {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
        }
        .ttd-top-table {
            width: 100%;
            border-collapse: collapse;
        }
        .ttd-top-table td {
            width: 50%;
            vertical-align: top;
            text-align: center;
            padding: 0 10px;
        }
        .date-line {
            margin-bottom: 6px;
        }
        .date-spacer {
            margin-bottom: 6px;
            visibility: hidden;
        }
        .jabatan-line {
            margin-top: 6px;
        }
        .sig-space {
            height: 62px;
        }
        .nama-bold {
            font-weight: bold;
        }
        .ttd-center-box {
            margin-top: 18px;
            text-align: center;
        }
        .sig-space-center {
            height: 62px;
        }
    </style>
</head>
<body>
@foreach ($sppdList as $sppd)
    <div class="bensin-page">
        {{-- AREA KOSONG ATAS UNTUK MENEMPEL STRUK BENSIN / BBM --}}

        {{-- BLOK TANDA TANGAN DI BAGIAN BAWAH HALAMAN --}}
        <div class="ttd-bottom">
            <table class="ttd-top-table">
                <tr>
                    <td>
                        <div class="date-spacer">&nbsp;</div>
                        <div>Mengetahui</div>
                        <div class="jabatan-line">PPTK</div>
                        <div class="sig-space"></div>
                        <div class="nama-bold">{{ $sppd['pptk_nama'] }}</div>
                        <div>NIP. {{ $sppd['pptk_nip'] }}</div>
                    </td>
                    <td>
                        <div class="date-line">Indramayu, {{ $sppd['tanggal_indo'] }}</div>
                        <div>Mengetahui;</div>
                        <div class="jabatan-line">Bendahara Pengeluaran</div>
                        <div class="sig-space"></div>
                        <div class="nama-bold">{{ $sppd['bendahara_nama'] }}</div>
                        <div>NIP. {{ $sppd['bendahara_nip'] }}</div>
                    </td>
                </tr>
            </table>

            <div class="ttd-center-box">
                <div>Mengetahui;</div>
                <div>Pengguna Anggaran</div>
                <div class="sig-space-center"></div>
                <div class="nama-bold">{{ $sppd['kadin_nama'] }}</div>
                <div>NIP. {{ $sppd['kadin_nip'] }}</div>
            </div>
        </div>
    </div>

    @if (!$loop->last)
        <div class="page-break"></div>
    @endif
@endforeach
</body>
</html>
