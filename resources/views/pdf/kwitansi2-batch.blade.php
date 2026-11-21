<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Kwitansi 2 - {{ $batchCode }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1.2cm 1.6cm 1.5cm 1.6cm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9.5pt;
            color: #000000;
            line-height: 1.35;
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
            margin-bottom: 14px;
        }

        /* BARIS NO KUITANSI & TAHUN ANGGARAN */
        .header-row-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 34px;
            font-size: 9.5pt;
        }
        .header-row-table td {
            vertical-align: top;
            padding: 0;
        }
        .hr-right {
            text-align: right;
            padding-right: 18px;
        }

        /* ISI KUITANSI */
        .content-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5pt;
        }
        .content-table td {
            vertical-align: top;
            padding: 1.5px 0;
            line-height: 1.38;
        }
        .c-label {
            width: 112px;
            white-space: nowrap;
        }
        .c-colon {
            width: 12px;
            text-align: center;
        }
        .rincian-inner-table {
            border-collapse: collapse;
            margin-top: 2px;
            font-size: 9.5pt;
        }
        .rincian-inner-table td {
            padding: 1.5px 0;
            vertical-align: top;
            line-height: 1.38;
        }
        .ri-label {
            width: 225px;
            white-space: nowrap;
        }
        .ri-colon {
            width: 14px;
            text-align: center;
        }

        /* TANDA TANGAN */
        .ttd-section {
            width: 100%;
            margin-top: 24px;
            page-break-inside: avoid;
        }
        .ttd-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5pt;
        }
        .ttd-table td {
            vertical-align: top;
            text-align: center;
            line-height: 1.35;
            padding: 0;
        }
        .ttd-left {
            width: 42%;
        }
        .ttd-mid {
            width: 14%;
        }
        .ttd-right {
            width: 44%;
        }
        .ttd-space {
            height: 76px;
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

        {{-- NO KUITANSI & TAHUN ANGGARAN --}}
        <table class="header-row-table">
            <tr>
                <td>No. Kuitansi</td>
                <td class="hr-right">Tahun Anggaran : {{ $tahunAnggaran }}</td>
            </tr>
        </table>

        {{-- DETAIL KUITANSI --}}
        <table class="content-table">
            <tr>
                <td class="c-label">Sudah terima dari</td>
                <td class="c-colon">:</td>
                <td>
                    Bendahara Pengeluaran<br>
                    Dinas Ketahanan Pangan dan Pertanian Kabupaten Indramayu
                </td>
            </tr>
            <tr>
                <td class="c-label">Sebesar</td>
                <td class="c-colon">:</td>
                <td>Rp. {{ $sppd['total_formatted'] }}</td>
            </tr>
            <tr>
                <td class="c-label">Terbilang</td>
                <td class="c-colon">:</td>
                <td>{{ $sppd['terbilang_title'] }}</td>
            </tr>
            <tr>
                <td class="c-label" style="padding-top: 14px;">Untuk</td>
                <td class="c-colon" style="padding-top: 14px;">:</td>
                <td style="padding-top: 14px;">
                    Biaya perjalanan dinas dalam rangka melaksanakan {{ $sppd['tujuan'] }} di {{ $sppd['lokasi_desa_kecamatan'] }}
                </td>
            </tr>
            <tr>
                <td class="c-label" style="padding-top: 4px;">Pengeluaran</td>
                <td class="c-colon" style="padding-top: 4px;"></td>
                <td style="padding-top: 4px;">
                    <div>Dengan rincian :</div>
                    <table class="rincian-inner-table">
                        <tr>
                            <td class="ri-label">1. Uang Harian</td>
                            <td class="ri-colon">:</td>
                            <td>Rp. {{ $sppd['total_formatted'] }}</td>
                        </tr>
                        <tr>
                            <td class="ri-label">2. Biaya Transportasi</td>
                            <td class="ri-colon">:</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td class="ri-label">3. Biaya Penginapan</td>
                            <td class="ri-colon">:</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td class="ri-label">4. Uang Representasi Perjalanan Dinas</td>
                            <td class="ri-colon">:</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td class="ri-label">5. Biaya Taksi</td>
                            <td class="ri-colon">:</td>
                            <td>-</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        {{-- TANDA TANGAN PENERIMA, PENGGUNA ANGGARAN & BENDAHARA --}}
        <div class="ttd-section">
            {{-- BARIS 1: PENERIMA (KANAN) --}}
            <table class="ttd-table">
                <tr>
                    <td class="ttd-left"></td>
                    <td class="ttd-mid"></td>
                    <td class="ttd-right">
                        <div>Indramayu, {{ $sppd['tanggal_berangkat_indo'] }}</div>
                        <div>Penerima</div>
                        <div class="ttd-space"></div>
                        <div class="ttd-nama">{{ $sppd['penerima_nama'] }}</div>
                        <div class="ttd-nip">NIP. {{ $sppd['penerima_nip'] }}</div>
                    </td>
                </tr>
            </table>

            {{-- BARIS 2: PENGGUNA ANGGARAN (KIRI) & BENDAHARA PENGELUARAN (KANAN) --}}
            <table class="ttd-table" style="margin-top: 10px;">
                <tr>
                    <td class="ttd-left">
                        <div>Menyetujui :</div>
                        <div>Pengguna Anggaran</div>
                        <div class="ttd-space"></div>
                        <div class="ttd-nama">{{ $sppd['kadin_nama'] }}</div>
                        <div class="ttd-nip">NIP. {{ $sppd['kadin_nip'] }}</div>
                    </td>
                    <td class="ttd-mid"></td>
                    <td class="ttd-right">
                        <div>&nbsp;</div>
                        <div>Bendahara Pengeluaran</div>
                        <div class="ttd-space"></div>
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
