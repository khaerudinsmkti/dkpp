<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $docTitle }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1.3cm 2cm 1.5cm 2cm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11pt;
            color: #000000;
            line-height: 1.15;
            margin: 0;
            padding: 0;
        }

        /* Kop Surat */
        .kop-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2px;
        }
        .kop-logo-cell {
            width: 82px;
            vertical-align: middle;
            text-align: left;
            padding-bottom: 4px;
        }
        .kop-logo {
            width: 70px;
            height: auto;
        }
        .kop-text-cell {
            text-align: center;
            vertical-align: middle;
            padding-right: 30px;
            padding-bottom: 4px;
        }
        .kop-pemkab {
            font-size: 13pt;
            font-weight: normal;
            margin: 0;
            line-height: 1.15;
            letter-spacing: 0.2px;
        }
        .kop-dinas {
            font-size: 15pt;
            font-weight: bold;
            margin: 1px 0 2px 0;
            line-height: 1.15;
            letter-spacing: 0.3px;
        }
        .kop-alamat {
            font-size: 9.5pt;
            margin: 0;
            line-height: 1.18;
        }
        .kop-line-thick {
            border-top: 2.5px solid #000000;
            border-bottom: 1px solid #000000;
            height: 1.5px;
            margin-bottom: 14px;
        }

        /* Judul Surat Tugas */
        .judul-box {
            text-align: center;
            margin-bottom: 18px;
            line-height: 1.18;
        }
        .judul-text {
            font-size: 11.5pt;
            font-weight: bold;
            margin: 0;
        }
        .nomor-text {
            font-size: 11pt;
            margin: 1px 0 0 0;
        }

        /* Tabel Konten Utama (Dasar, Kepada, Untuk) */
        .section-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
        }
        .section-table td {
            vertical-align: top;
            padding: 0;
            line-height: 1.18;
        }
        .col-label {
            width: 85px;
        }
        .col-colon {
            width: 16px;
            text-align: center;
        }
        .dasar-text {
            text-align: justify;
        }
        .memerintahkan {
            text-align: center;
            font-weight: bold;
            font-size: 11pt;
            margin: 16px 0 14px 0;
            line-height: 1.15;
        }

        /* Daftar Pegawai (Kepada) */
        .pegawai-item-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }
        .pegawai-item-table td {
            vertical-align: top;
            padding: 0;
            line-height: 1.18;
        }
        .p-no {
            width: 22px;
        }
        .p-field {
            width: 112px;
        }
        .p-colon {
            width: 14px;
            text-align: center;
        }

        /* Daftar Untuk */
        .untuk-item-table {
            width: 100%;
            border-collapse: collapse;
        }
        .untuk-item-table td {
            vertical-align: top;
            padding: 1.5px 0;
            text-align: justify;
            line-height: 1.18;
        }
        .u-no {
            width: 22px;
        }

        /* Tanda Tangan */
        .ttd-wrapper {
            width: 100%;
            margin-top: 22px;
            page-break-inside: avoid;
        }
        .ttd-table {
            width: 100%;
            border-collapse: collapse;
        }
        .ttd-spacer {
            width: 52%;
        }
        .ttd-box {
            width: 48%;
            vertical-align: top;
            text-align: left;
            line-height: 1.2;
        }
        .ttd-inner-table {
            width: 100%;
            border-collapse: collapse;
        }
        .ttd-inner-table td {
            vertical-align: top;
            padding: 0;
            line-height: 1.2;
        }
        .ttd-plt-col {
            width: 26px;
            text-align: left;
        }
        .ttd-space-row td {
            height: 86px;
            vertical-align: top;
        }
        .ttd-space-cell {
            position: relative;
            height: 86px;
            overflow: visible;
        }
        .ttd-signature-img {
            position: absolute;
            width: auto;
            display: block;
            z-index: 2;
        }
        .ttd-nama {
            font-weight: bold;
            text-decoration: underline;
            text-transform: uppercase;
        }
        /* Blok Paraf (kiri tanda tangan Kepala Dinas) */
        .paraf-table {
            width: 98%;
            border-collapse: collapse;
            margin-top: 18px;
        }
        .paraf-table td {
            border: 1px solid #3b638c;
            color: #274c77;
            font-size: 7.3pt;
            line-height: 1.22;
            text-align: center;
            vertical-align: middle;
            padding: 5px 5px;
            height: 38px;
        }
        .paraf-label {
            width: 68%;
        }
        .paraf-col {
            width: 16%;
        }
    </style>
</head>
<body>
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

        {{-- JUDUL SURAT TUGAS --}}
        <div class="judul-box">
            <p class="judul-text">SURAT TUGAS</p>
            <p class="nomor-text">Nomor : {!! $nomorSptHtml !!}</p>
        </div>

        {{-- DASAR --}}
        <table class="section-table">
            <tr>
                <td class="col-label">Dasar</td>
                <td class="col-colon">:</td>
                <td class="dasar-text">
                    @if (!empty($dasarItems) && count($dasarItems) > 1)
                        <table class="untuk-item-table">
                            @foreach ($dasarItems as $dIdx => $dItem)
                                <tr>
                                    <td class="u-no">{{ $dIdx + 1 }}.</td>
                                    <td>{{ $dItem }}</td>
                                </tr>
                            @endforeach
                        </table>
                    @else
                        {{ $dasarText }}
                    @endif
                </td>
            </tr>
        </table>

        {{-- MEMERINTAHKAN --}}
        <div class="memerintahkan">MEMERINTAHKAN:</div>

        {{-- KEPADA --}}
        <table class="section-table">
            <tr>
                <td class="col-label">Kepada</td>
                <td class="col-colon">:</td>
                <td>
                    @foreach ($participants as $idx => $pt)
                        <table class="pegawai-item-table">
                            <tr>
                                <td class="p-no">{{ $idx + 1 }}.</td>
                                <td class="p-field">Nama</td>
                                <td class="p-colon">:</td>
                                <td>{{ $pt['nama'] }}</td>
                            </tr>
                            <tr>
                                <td class="p-no"></td>
                                <td class="p-field">Pangkat/Gol</td>
                                <td class="p-colon">:</td>
                                <td>{{ $pt['pangkat_gol'] }}</td>
                            </tr>
                            <tr>
                                <td class="p-no"></td>
                                <td class="p-field">NIP</td>
                                <td class="p-colon">:</td>
                                <td>{{ $pt['nip'] }}</td>
                            </tr>
                            <tr>
                                <td class="p-no"></td>
                                <td class="p-field">Jabatan</td>
                                <td class="p-colon">:</td>
                                <td>{{ $pt['jabatan'] }}</td>
                            </tr>
                        </table>
                    @endforeach
                </td>
            </tr>
        </table>

        {{-- UNTUK --}}
        <table class="section-table" style="margin-top: 4px;">
            <tr>
                <td class="col-label">Untuk</td>
                <td class="col-colon">:</td>
                <td>
                    <table class="untuk-item-table">
                        <tr>
                            <td class="u-no">1.</td>
                            <td>{{ $untukPoin1 }}</td>
                        </tr>
                        <tr>
                            <td class="u-no">2.</td>
                            <td>{{ $untukPoin2 }}</td>
                        </tr>
                        <tr>
                            <td class="u-no">3.</td>
                            <td>Surat Perintah Tugas ini agar dilaksanakan dengan sebaik-baiknya.</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        {{-- TANDA TANGAN PEJABAT PENANDATANGAN --}}
        <div class="ttd-wrapper">
            <table class="ttd-table">
                <tr>
                    <td class="ttd-spacer" style="vertical-align: bottom; padding-right: 10px;">
                        @if (!empty($withBlokParaf))
                            <table class="paraf-table">
                                <tr>
                                    <td class="paraf-label">SEKRETARIS DINAS KETAHANAN PANGAN DAN PERTANIAN KABUPATEN INDRAMAYU</td>
                                    <td class="paraf-col">&nbsp;</td>
                                    <td class="paraf-col">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="paraf-label">KEPALA BIDANG KETERSEDIAAN DAN DISTRIBUSI PANGAN</td>
                                    <td class="paraf-col">&nbsp;</td>
                                    <td class="paraf-col">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="paraf-label">ANALIS KETAHANAN PANGAN</td>
                                    <td class="paraf-col">&nbsp;</td>
                                    <td class="paraf-col">&nbsp;</td>
                                </tr>
                            </table>
                        @endif
                    </td>
                    <td class="ttd-box">
                        <table class="ttd-inner-table">
                            <tr>
                                <td class="ttd-plt-col"></td>
                                <td style="padding-bottom: 5px;">Indramayu, {{ $tanggalSptIndo }}</td>
                            </tr>
                            <tr>
                                <td class="ttd-plt-col">{{ $ttdPrefix }}</td>
                                <td>
                                    @foreach ($ttdJabatanLines as $jLine)
                                        {{ $jLine }}@if (!$loop->last)<br>@endif
                                    @endforeach
                                </td>
                            </tr>
                            <tr class="ttd-space-row">
                                <td>&nbsp;</td>
                                <td class="ttd-space-cell">
                                    @if (!empty($ttdImageBase64))
                                        <img
                                            src="{{ $ttdImageBase64 }}"
                                            class="ttd-signature-img"
                                            style="left: {{ $ttdOffsetX ?? 0 }}px; top: {{ $ttdOffsetY ?? 0 }}px; height: {{ $ttdHeightPx ?? 64 }}px;"
                                            alt="Tanda Tangan"
                                        >
                                    @else
                                        &nbsp;
                                    @endif
                                </td>
                            </tr>
                            <tr>
                                <td class="ttd-plt-col"></td>
                                <td>
                                    <div class="ttd-nama">{{ $ttdNama }}</div>
                                    @if (!empty($ttdPangkatGol))
                                        <div>{{ $ttdPangkatGol }}</div>
                                    @endif
                                    @if (!empty($ttdNip))
                                        <div>NIP. {{ $ttdNip }}</div>
                                    @endif
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>
