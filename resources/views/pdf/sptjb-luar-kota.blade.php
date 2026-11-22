<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>SPTJB SPPD Luar Kota - {{ $batchCode }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1.3cm 2cm 1.5cm 2cm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10pt;
            color: #000000;
            line-height: 1.25;
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
            margin-bottom: 12px;
        }

        /* Judul SPTJB */
        .judul-box {
            text-align: center;
            margin-bottom: 14px;
            line-height: 1.25;
        }
        .judul-text {
            font-size: 11pt;
            font-weight: bold;
            text-decoration: underline;
            margin: 0;
        }
        .nomor-text {
            font-size: 9.5pt;
            margin: 3px 0 0 0;
            text-align: left;
            padding-left: 135px;
        }

        /* Metadata 1-7 */
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }
        .meta-table td {
            vertical-align: top;
            padding: 1.5px 0;
            line-height: 1.25;
        }
        .m-no {
            width: 22px;
        }
        .m-label {
            width: 142px;
        }
        .m-colon {
            width: 16px;
            text-align: center;
        }
        .m-val {
            text-align: justify;
        }

        .paragraph {
            text-align: justify;
            margin: 10px 0;
            line-height: 1.32;
        }

        /* Tabel Rincian Belanja */
        .belanja-table {
            width: 100%;
            border-collapse: collapse;
            margin: 14px 0;
        }
        .belanja-table th,
        .belanja-table td {
            border: 1.2px solid #000000;
            padding: 6px 8px;
            font-size: 10pt;
            line-height: 1.22;
        }
        .belanja-table th {
            font-weight: normal;
            text-align: center;
            vertical-align: middle;
        }
        .col-no {
            width: 28px;
            text-align: center;
        }
        .col-rek {
            width: 145px;
            text-align: left;
        }
        .col-uraian {
            text-align: left;
        }
        .col-jumlah {
            width: 105px;
            text-align: right;
        }
        .data-row td {
            padding-top: 10px;
            padding-bottom: 10px;
        }
        .total-row td {
            font-weight: bold;
        }
        .total-label {
            text-align: center;
            font-weight: normal;
        }
        .terbilang-label {
            text-align: left;
            font-weight: normal;
            padding-top: 8px;
            padding-bottom: 8px;
        }
        .terbilang-val {
            font-weight: bold;
            font-style: italic;
            text-align: left;
            padding-top: 8px;
            padding-bottom: 8px;
        }

        /* Tanda Tangan */
        .ttd-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 26px;
        }
        .ttd-spacer {
            width: 54%;
        }
        .ttd-box {
            width: 46%;
            vertical-align: top;
            text-align: center;
            line-height: 1.3;
        }
        .ttd-date {
            margin-bottom: 2px;
        }
        .ttd-pa {
            margin-bottom: 72px;
        }
        .ttd-nama {
            font-weight: bold;
            text-decoration: underline;
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
        <p class="nomor-text">NOMOR :</p>
    </div>

    {{-- METADATA 1 S/D 7 --}}
    <table class="meta-table">
        <tr>
            <td class="m-no">1</td>
            <td class="m-label">Nama SKPD</td>
            <td class="m-colon">:</td>
            <td class="m-val">DINAS KETAHANAN PANGAN DAN PERTANIAN</td>
        </tr>
        <tr>
            <td class="m-no">2</td>
            <td class="m-label">KODE SKPD</td>
            <td class="m-colon">:</td>
            <td class="m-val">2.09.3.27.0.00.10.0000</td>
        </tr>
        <tr>
            <td class="m-no">3</td>
            <td class="m-label">Tanggal/No. DPA</td>
            <td class="m-colon">:</td>
            <td class="m-val">{{ $tanggalDanNomorDpa }}</td>
        </tr>
        <tr>
            <td class="m-no">4</td>
            <td class="m-label">Nama Kegiatan</td>
            <td class="m-colon">:</td>
            <td class="m-val">{{ $namaKegiatan }}</td>
        </tr>
        <tr>
            <td class="m-no">5</td>
            <td class="m-label">Nama Sub Kegiatan</td>
            <td class="m-colon">:</td>
            <td class="m-val">{{ $namaSubKegiatan }}</td>
        </tr>
        <tr>
            <td class="m-no">6</td>
            <td class="m-label">Kode Kegiatan</td>
            <td class="m-colon">:</td>
            <td class="m-val">{{ $kodeKegiatan }}</td>
        </tr>
        <tr>
            <td class="m-no">7</td>
            <td class="m-label">Sumber Dana</td>
            <td class="m-colon">:</td>
            <td class="m-val">APBD</td>
        </tr>
    </table>

    {{-- PARAGRAF PERNYATAAN --}}
    <p class="paragraph">
        Yang bertanda tangan dibawah ini Pengguna Anggaran Dinas Ketahanan Pangan dan Pertanian Kabupaten Indramayu Tahun Anggaran {{ $tahunAnggaran }} menyatakan bahwa saya bertanggung jawab penuh atas kebenaran formal dan material serta kebenaran perhitungan pemungutan/pemotongan pajak maupun segala akibat yang timbul dari pengeluaran yang dibayar lunas oleh Bendahara Umum Daerah kepada yang berhak menerima dengan rincian sebagai berikut :
    </p>

    {{-- TABEL RINCIAN BELANJA --}}
    <table class="belanja-table">
        <thead>
            <tr>
                <th class="col-no">No</th>
                <th class="col-rek" style="text-align: center;">Kode Sub Kegiatan<br>/Kode Rekening</th>
                <th class="col-uraian" style="text-align: center;">Uraian</th>
                <th class="col-jumlah" style="text-align: center;">Jumlah (Rp)</th>
            </tr>
        </thead>
        <tbody>
            <tr class="data-row">
                <td class="col-no">1</td>
                <td class="col-rek">{{ $noRekening }}</td>
                <td class="col-uraian">Belanja Perjalanan Dinas Biasa</td>
                <td class="col-jumlah">{{ $totalFormatted }}</td>
            </tr>
            <tr class="total-row">
                <td colspan="3" class="total-label">TOTAL</td>
                <td class="col-jumlah">{{ $totalFormatted }}</td>
            </tr>
            <tr>
                <td colspan="2" class="terbilang-label">TERBILANG</td>
                <td colspan="2" class="terbilang-val">{{ $terbilangText }}</td>
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
                    Indramayu,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ $bulanTahun }}
                </div>
                <div class="ttd-pa">Pengguna Anggaran</div>
                <div class="ttd-nama">{{ $kpaNama }}</div>
                <div>NIP.{{ $kpaNip }}</div>
            </td>
        </tr>
    </table>
</body>
</html>
