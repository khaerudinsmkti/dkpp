<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>SPTJB SPPD Dalam Kota - {{ $batchCode }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1.3cm 2cm 1.5cm 2cm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10.5pt;
            color: #000000;
            line-height: 1.22;
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

        /* Judul SPTJB */
        .judul-box {
            text-align: center;
            margin-bottom: 12px;
            line-height: 1.2;
        }
        .judul-text {
            font-size: 11pt;
            font-weight: bold;
            text-decoration: underline;
            margin: 0;
        }
        .nomor-text {
            font-size: 10.5pt;
            margin: 2px 0 0 0;
        }

        /* Metadata 1-6 */
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        .meta-table td {
            vertical-align: top;
            padding: 1.5px 0;
            line-height: 1.22;
        }
        .m-no {
            width: 24px;
        }
        .m-label {
            width: 140px;
        }
        .m-colon {
            width: 14px;
            text-align: center;
        }
        .m-val {
            text-align: justify;
        }

        .paragraph {
            text-align: justify;
            margin: 10px 0;
            line-height: 1.28;
        }

        /* Tabel Rincian Belanja */
        .belanja-table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
        }
        .belanja-table th,
        .belanja-table td {
            border: 1.2px solid #000000;
            padding: 5px 8px;
            font-size: 10.5pt;
            line-height: 1.2;
        }
        .belanja-table th {
            font-weight: bold;
            text-align: center;
            vertical-align: middle;
        }
        .col-no {
            width: 34px;
            text-align: center;
        }
        .col-rek {
            width: 175px;
            text-align: center;
        }
        .col-uraian {
            text-align: center;
        }
        .col-jumlah {
            width: 130px;
            text-align: center;
        }
        .empty-row td {
            height: 14px;
        }
        .total-row td {
            font-weight: bold;
            text-align: center;
        }
        .terbilang-row td {
            font-weight: bold;
            font-style: italic;
            text-align: left;
            padding: 6px 10px;
        }

        /* Tanda Tangan */
        .ttd-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 22px;
        }
        .ttd-spacer {
            width: 52%;
        }
        .ttd-box {
            width: 48%;
            vertical-align: top;
            text-align: center;
            line-height: 1.25;
        }
        .ttd-date {
            margin-bottom: 10px;
        }
        .ttd-pa {
            margin-bottom: 62px;
        }
        .ttd-nama {
            font-weight: bold;
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

    {{-- JUDUL SPTJB --}}
    <div class="judul-box">
        <p class="judul-text">SURAT PERNYATAAN TANGGUNG JAWAB BELANJA (SPTJB)</p>
        <p class="nomor-text">Nomor :&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>
    </div>

    {{-- METADATA 1 S/D 6 --}}
    <table class="meta-table">
        <tr>
            <td class="m-no">1.</td>
            <td class="m-label">Nama SKPD</td>
            <td class="m-colon">:</td>
            <td class="m-val">DINAS KETAHANAN PANGAN DAN PERTANIAN KAB. INDRAMAYU</td>
        </tr>
        <tr>
            <td class="m-no">2.</td>
            <td class="m-label">Kode SKPD</td>
            <td class="m-colon">:</td>
            <td class="m-val">02.09.01</td>
        </tr>
        <tr>
            <td class="m-no">3.</td>
            <td class="m-label">Tanggal/No. DPA</td>
            <td class="m-colon">:</td>
            <td class="m-val">{{ $tanggalDanNomorDpa }}</td>
        </tr>
        <tr>
            <td class="m-no">4.</td>
            <td class="m-label">Nama Kegiatan</td>
            <td class="m-colon">:</td>
            <td class="m-val">{{ $namaKegiatan }}</td>
        </tr>
        <tr>
            <td class="m-no">5.</td>
            <td class="m-label">Nama Sub Kegiatan</td>
            <td class="m-colon">:</td>
            <td class="m-val">{{ $namaSubKegiatan }}</td>
        </tr>
        <tr>
            <td class="m-no">6.</td>
            <td class="m-label">Kode Kegiatan</td>
            <td class="m-colon">:</td>
            <td class="m-val">{{ $kodeSubKegiatan }}</td>
        </tr>
    </table>

    {{-- PARAGRAF PERNYATAAN --}}
    <p class="paragraph">
        Yang bertanda tangan dibawah ini Pengguna Anggaran Dinas Ketahanan Pangan dan Pertanian Kabupaten Indramayu, menyatakan bahwa saya bertanggungjawab penuh atas kebenaran formal dan material serta kebenaran perhitungan pemungutan / pemotongan pajak, maupun segala akibat yang timbul dari pengeluaran yang dibayar lunas oleh Bendahara Umum Daerah Kepada yang berhak menerima dengan rincian sebagai berikut :
    </p>

    {{-- TABEL RINCIAN BELANJA --}}
    <table class="belanja-table">
        <thead>
            <tr>
                <th class="col-no">No</th>
                <th class="col-rek">Kode Sub<br>Kegiatan/Rekening</th>
                <th class="col-uraian">URAIAN</th>
                <th class="col-jumlah">JUMLAH (Rp)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="col-no">1</td>
                <td class="col-rek">{{ $noRekening }}</td>
                <td class="col-uraian">Belanja Perjalanan Dinas Dalam Kota</td>
                <td class="col-jumlah">{{ $totalFormatted }}</td>
            </tr>
            <tr class="empty-row">
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
            </tr>
            <tr class="total-row">
                <td colspan="3">TOTAL</td>
                <td>{{ $totalFormatted }}</td>
            </tr>
            <tr class="terbilang-row">
                <td colspan="4">TERBILANG : {{ $terbilangText }}</td>
            </tr>
        </tbody>
    </table>

    {{-- PARAGRAF PENUTUP --}}
    <p class="paragraph">
        Asli bukti-bukti pengeluaran anggaran dan surat setoran pajak tersebut diatas disimpan pada Dinas Ketahanan Pangan dan Pertanian Kabupaten Indramayu sesuai ketentuan yang berlaku, untuk kelengkapan adminitrasi dan keperluan pemeriksaan aparat pengawasan fungsional (post audit).
    </p>
    <p class="paragraph" style="margin-top: 8px;">
        Demikian Surat Pernyataan ini dibuat dengan sebenarnya.
    </p>

    {{-- TANDA TANGAN PENGGUNA ANGGARAN --}}
    <table class="ttd-table">
        <tr>
            <td class="ttd-spacer"></td>
            <td class="ttd-box">
                <div class="ttd-date">
                    Indramayu,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ $tahunAnggaran }}
                </div>
                <div class="ttd-pa">Pengguna Anggaran</div>
                <div class="ttd-nama">{{ $kadinNama }}</div>
                <div>NIP. {{ $kadinNip }}</div>
            </td>
        </tr>
    </table>
</body>
</html>
