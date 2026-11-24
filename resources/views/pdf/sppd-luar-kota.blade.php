<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>SPPD Luar Kota - {{ $batchCode }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1.0cm 1.4cm 1.2cm 1.4cm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10pt;
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
            border-bottom: 1px solid #000000;
            height: 2px;
            margin-top: 5px;
            margin-bottom: 8px;
        }

        /* LEMBAR KE / KODE NO / NOMOR */
        .meta-right-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 9.8pt;
        }
        .meta-right-table td {
            padding: 1px 0;
            vertical-align: top;
        }
        .mr-spacer {
            width: 64%;
        }
        .mr-label {
            width: 15%;
            white-space: nowrap;
        }
        .mr-colon {
            width: 2%;
            text-align: center;
        }
        .mr-val {
            width: 19%;
        }

        /* JUDUL */
        .judul-box {
            text-align: center;
            margin-bottom: 10px;
        }
        .judul-text {
            font-size: 11pt;
            font-weight: bold;
            text-decoration: underline;
            margin: 0;
            letter-spacing: 0.2px;
        }

        /* TABEL SPD */
        .spd-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.8pt;
            margin-bottom: 12px;
        }
        .spd-table td {
            border: 1px solid #000000;
            padding: 4px 7px;
            vertical-align: top;
            line-height: 1.32;
        }
        .subrow-top td {
            border-bottom: none;
            padding-bottom: 1.5px;
        }
        .subrow-mid td {
            border-top: none;
            border-bottom: none;
            padding-top: 1.5px;
            padding-bottom: 1.5px;
        }
        .subrow-bot td {
            border-top: none;
            padding-top: 1.5px;
        }
        .col-no {
            width: 5%;
            text-align: center;
        }
        .col-label {
            width: 39%;
        }
        .col-tgl-lahir {
            width: 24%;
        }
        .col-ket {
            width: 32%;
        }
        .inner-list-table {
            width: 100%;
            border-collapse: collapse;
        }
        .inner-list-table td {
            border: none;
            padding: 1px 0;
            vertical-align: top;
            line-height: 1.28;
        }
        .il-code {
            width: 16px;
            white-space: nowrap;
        }
        .pengikut-row td {
            border-top: none;
            border-bottom: none;
            padding-top: 4px;
            padding-bottom: 4px;
        }
        .pengikut-row-first td {
            padding-top: 6px;
        }
        .pengikut-row-last td {
            border-bottom: 1px solid #000000;
            padding-bottom: 10px;
        }
        .center-text {
            text-align: center;
        }

        /* FOOTER & TANDA TANGAN */
        .footer-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 9.8pt;
            page-break-inside: avoid;
        }
        .footer-table td {
            vertical-align: top;
            padding: 0;
            line-height: 1.3;
        }
        .f-left {
            width: 60%;
        }
        .f-right {
            width: 40%;
        }
        .ttd-space {
            height: 70px;
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

        {{-- LEMBAR KE / KODE NO / NOMOR --}}
        <table class="meta-right-table">
            <tr>
                <td class="mr-spacer"></td>
                <td class="mr-label">Lembar ke</td>
                <td class="mr-colon">:</td>
                <td class="mr-val">I</td>
            </tr>
            <tr>
                <td class="mr-spacer"></td>
                <td class="mr-label">Kode No</td>
                <td class="mr-colon">:</td>
                <td class="mr-val">090</td>
            </tr>
            <tr>
                <td class="mr-spacer"></td>
                <td class="mr-label">Nomor</td>
                <td class="mr-colon">:</td>
                <td class="mr-val"></td>
            </tr>
        </table>

        {{-- JUDUL --}}
        <div class="judul-box">
            <p class="judul-text">SURAT PERJALANAN DINAS (SPD)</p>
        </div>

        {{-- TABEL SPD 10 POIN --}}
        <table class="spd-table">
            {{-- 1 --}}
            <tr>
                <td class="col-no">1.</td>
                <td class="col-label">
                    Pengguna Anggaran/Kuasa<br>
                    Pengguna Anggaran
                </td>
                <td colspan="2">
                    Kepala Dinas Ketahanan Pangan dan Pertanian Kabupaten<br>
                    Indramayu
                </td>
            </tr>

            {{-- 2 --}}
            <tr>
                <td class="col-no">2.</td>
                <td class="col-label">
                    Nama/NIP Pegawai yang melaksanakan<br>
                    perjalanan dinas
                </td>
                <td colspan="2">
                    <div style="margin-bottom: 3px;">{{ $sppd['leader_nama'] }}</div>
                    <div>{{ $sppd['leader_nip'] }}</div>
                </td>
            </tr>

            {{-- 3 --}}
            <tr class="subrow-top">
                <td class="col-no" rowspan="3" style="border-bottom: 1px solid #000000;">3.</td>
                <td class="col-label">
                    <table class="inner-list-table">
                        <tr>
                            <td class="il-code">a.</td>
                            <td>Pangkat dan Golongan</td>
                        </tr>
                    </table>
                </td>
                <td colspan="2">
                    <table class="inner-list-table">
                        <tr>
                            <td class="il-code">a.</td>
                            <td>{{ $sppd['leader_pangkat_gol'] }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr class="subrow-mid">
                <td class="col-label">
                    <table class="inner-list-table">
                        <tr>
                            <td class="il-code">b.</td>
                            <td>Jabatan/Instansi</td>
                        </tr>
                    </table>
                </td>
                <td colspan="2">
                    <table class="inner-list-table">
                        <tr>
                            <td class="il-code">b.</td>
                            <td>{{ $sppd['leader_jabatan'] }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr class="subrow-bot">
                <td class="col-label" style="padding-top: 8px;">
                    <table class="inner-list-table">
                        <tr>
                            <td class="il-code">c.</td>
                            <td>Tingkat Biaya Perjalanan Dinas</td>
                        </tr>
                    </table>
                </td>
                <td colspan="2" style="padding-top: 8px;">
                    <table class="inner-list-table">
                        <tr>
                            <td class="il-code">c.</td>
                            <td>{{ $sppd['tingkat_biaya'] }}</td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- 4 --}}
            <tr>
                <td class="col-no">4.</td>
                <td class="col-label">Maksud Perjalanan Dinas</td>
                <td colspan="2">
                    {{ $sppd['maksud_perjalanan'] }}
                </td>
            </tr>

            {{-- 5 --}}
            <tr>
                <td class="col-no">5.</td>
                <td class="col-label">Alat angkut yang dipergunakan</td>
                <td colspan="2">{{ $alatAngkut ?? 'Kendaraan Umum' }}</td>
            </tr>

            {{-- 6 --}}
            <tr>
                <td class="col-no">6.</td>
                <td class="col-label">
                    <table class="inner-list-table">
                        <tr>
                            <td class="il-code">a.</td>
                            <td>Tempat berangkat</td>
                        </tr>
                        <tr>
                            <td class="il-code">b.</td>
                            <td>Tempat tujuan</td>
                        </tr>
                    </table>
                </td>
                <td colspan="2">
                    <table class="inner-list-table">
                        <tr>
                            <td class="il-code">a.</td>
                            <td>DKPP Kabupaten Indramayu</td>
                        </tr>
                        <tr>
                            <td class="il-code">b.</td>
                            <td><strong>{{ $sppd['tempat_tujuan_display'] }}</strong></td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- 7 --}}
            <tr>
                <td class="col-no">7.</td>
                <td class="col-label">
                    <table class="inner-list-table">
                        <tr>
                            <td class="il-code">a.</td>
                            <td>Lamanya Perjalanan Dinas</td>
                        </tr>
                        <tr>
                            <td class="il-code">b.</td>
                            <td>Tanggal berangkat</td>
                        </tr>
                        <tr>
                            <td class="il-code">c.</td>
                            <td>Tanggal harus kembali/tiba di tempat baru *)</td>
                        </tr>
                    </table>
                </td>
                <td colspan="2">
                    <table class="inner-list-table">
                        <tr>
                            <td class="il-code">a.</td>
                            <td>Selama {{ $sppd['lama_hari'] }} ({{ $sppd['lama_hari_terbilang'] }}) Hari</td>
                        </tr>
                        <tr>
                            <td class="il-code">b.</td>
                            <td>{{ $sppd['tanggal_berangkat_indo'] }}</td>
                        </tr>
                        <tr>
                            <td class="il-code">c.</td>
                            <td>{{ $sppd['tanggal_kembali_indo'] }}</td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- 8 HEADER PENGIKUT --}}
            <tr>
                <td class="col-no">8.</td>
                <td class="col-label">
                    Pengikut : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Nama
                </td>
                <td class="col-tgl-lahir center-text">Tanggal Lahir</td>
                <td class="col-ket center-text">Keterangan</td>
            </tr>

            {{-- 8 DAFTAR PENGIKUT --}}
            @if (count($sppd['followers']) > 0)
                @foreach ($sppd['followers'] as $fIdx => $flw)
                    <tr class="pengikut-row {{ $loop->first ? 'pengikut-row-first' : '' }} {{ $loop->last ? 'pengikut-row-last' : '' }}">
                        <td class="col-no"></td>
                        <td class="col-label">{{ $fIdx + 1 }}. {{ $flw['nama'] }}</td>
                        <td class="col-tgl-lahir center-text">{{ $flw['tanggal_lahir_indo'] }}</td>
                        <td class="col-ket"></td>
                    </tr>
                @endforeach
            @else
                <tr class="pengikut-row pengikut-row-first pengikut-row-last">
                    <td class="col-no"></td>
                    <td class="col-label">-</td>
                    <td class="col-tgl-lahir center-text">-</td>
                    <td class="col-ket"></td>
                </tr>
            @endif

            {{-- 9 --}}
            <tr>
                <td class="col-no">9.</td>
                <td class="col-label">
                    <div>Pembebanan Anggaran</div>
                    <table class="inner-list-table">
                        <tr>
                            <td class="il-code">a.</td>
                            <td>Perangkat Daerah</td>
                        </tr>
                        <tr>
                            <td class="il-code">b.</td>
                            <td>Kode Rekening</td>
                        </tr>
                    </table>
                </td>
                <td colspan="2">
                    <div>&nbsp;</div>
                    <table class="inner-list-table">
                        <tr>
                            <td class="il-code">a.</td>
                            <td>DKPP Kabupaten Indramayu</td>
                        </tr>
                        <tr>
                            <td class="il-code">b.</td>
                            <td>5.1.02.04.01.0001</td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- 10 --}}
            <tr>
                <td class="col-no">10.</td>
                <td class="col-label">Keterangan lain-lainnya</td>
                <td colspan="2"></td>
            </tr>
        </table>

        {{-- FOOTER & TANDA TANGAN PENGGUNA ANGGARAN --}}
        <table class="footer-table">
            <tr>
                <td class="f-left">* coret yang tidak perlu</td>
                <td class="f-right">
                    <div>Dikeluarkan di Indramayu</div>
                    <div>Tanggal {{ $sppd['tanggal_kembali_indo'] }}</div>
                    <div>PENGGUNA ANGGARAN</div>
                    <div class="ttd-space"></div>
                    <div class="ttd-nama">{{ $sppd['kadin_nama'] }}</div>
                    <div>{{ $sppd['kadin_pangkat_gol'] }}</div>
                    <div class="ttd-nip">NIP. {{ $sppd['kadin_nip'] }}</div>
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
