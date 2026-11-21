<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Surat Tugas SPPD Dalam Kota - {{ $batchCode }}</title>
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
        .page-break {
            page-break-after: always;
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
            margin-bottom: 12px;
        }

        /* Judul Surat Tugas */
        .judul-box {
            text-align: center;
            margin-bottom: 20px;
            line-height: 1.15;
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
            line-height: 1.15;
        }
        .col-label {
            width: 85px;
        }
        .col-colon {
            width: 16px;
            text-align: center;
        }
        .memerintahkan {
            text-align: center;
            font-weight: bold;
            font-size: 11pt;
            margin: 18px 0 14px 0;
            line-height: 1.15;
        }

        /* Daftar Pegawai (Kepada) */
        .pegawai-item-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
        }
        .pegawai-item-table td {
            vertical-align: top;
            padding: 0;
            line-height: 1.14;
        }
        .p-no {
            width: 22px;
        }
        .p-field {
            width: 105px;
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
            padding: 1px 0;
            text-align: justify;
            line-height: 1.16;
        }
        .u-no {
            width: 22px;
        }

        /* Tanda Tangan */
        .ttd-wrapper {
            width: 100%;
            margin-top: 18px;
        }
        .ttd-table {
            width: 100%;
            border-collapse: collapse;
        }
        .ttd-spacer {
            width: 46%;
        }
        .ttd-box {
            width: 54%;
            vertical-align: top;
            text-align: left;
            line-height: 1.18;
        }
        .ttd-inner-table {
            width: 100%;
            border-collapse: collapse;
        }
        .ttd-inner-table td {
            vertical-align: top;
            padding: 0;
            line-height: 1.18;
        }
        .ttd-plt-col {
            width: 26px;
            text-align: left;
        }
        .ttd-space-row td {
            height: 54px;
        }
        .ttd-nama {
            font-weight: bold;
            text-decoration: underline;
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

        {{-- JUDUL SURAT TUGAS --}}
        <div class="judul-box">
            <p class="judul-text">SURAT TUGAS</p>
            <p class="nomor-text">Nomor : {!! $sppd['nomor_spt_html'] !!}</p>
        </div>

        {{-- DASAR --}}
        <table class="section-table">
            <tr>
                <td class="col-label">Dasar</td>
                <td class="col-colon">:</td>
                <td>Undang-Undang Nomor 18 Tahun 2012 tentang Pangan.</td>
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
                    @foreach ($sppd['participants'] as $idx => $pt)
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
                            <td>
                                Melaksanakan Kegiatan {{ $sppd['kegiatan_untuk'] }} Tahun Anggaran {{ $sppd['tahun_anggaran'] }}.
                            </td>
                        </tr>
                        <tr>
                            <td class="u-no">2.</td>
                            <td>
                                Kegiatan dilaksanakan pada hari {{ $sppd['hari_berangkat'] }}, tanggal {{ $sppd['tanggal_berangkat_indo'] }}, bertempat di {{ $sppd['tujuan'] }}, Kecamatan {{ $sppd['nama_kecamatan'] }}.
                            </td>
                        </tr>
                        <tr>
                            <td class="u-no">3.</td>
                            <td>
                                Surat Perintah Tugas ini agar dilaksanakan dengan sebaik-baiknya.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        {{-- TANDA TANGAN KEPALA DINAS --}}
        <div class="ttd-wrapper">
            <table class="ttd-table">
                <tr>
                    <td class="ttd-spacer"></td>
                    <td class="ttd-box">
                        <table class="ttd-inner-table">
                            <tr>
                                <td class="ttd-plt-col"></td>
                                <td style="padding-bottom: 4px;">Indramayu, {{ $sppd['tanggal_spt_indo'] }}</td>
                            </tr>
                            <tr>
                                <td class="ttd-plt-col">{{ $sppd['kadin_prefix'] }}</td>
                                <td>
                                    KEPALA DINAS KETAHANAN PANGAN<br>
                                    DAN PERTANIAN<br>
                                    KABUPATEN INDRAMAYU,
                                </td>
                            </tr>
                            <tr class="ttd-space-row">
                                <td></td>
                                <td></td>
                            </tr>
                            <tr>
                                <td class="ttd-plt-col"></td>
                                <td>
                                    <div class="ttd-nama">{{ $sppd['kadin_nama'] }}</div>
                                    <div>{{ $sppd['kadin_pangkat_gol'] }}</div>
                                    <div>NIP. {{ $sppd['kadin_nip'] }}</div>
                                </td>
                            </tr>
                        </table>
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
