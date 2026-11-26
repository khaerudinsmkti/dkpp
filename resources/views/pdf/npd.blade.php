<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Nota Pencairan Dana - {{ $npd->nomor_npd ?: 'NPD #'.$npd->id }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1.0cm 1.1cm 1.0cm 1.1cm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 8.5pt;
            color: #000000;
            line-height: 1.25;
            margin: 0;
            padding: 0;
        }
        .outer-box {
            border: 1.5px solid #000000;
            width: 100%;
        }
        .header-title {
            text-align: center;
            font-size: 11pt;
            font-weight: bold;
            padding: 5px 8px;
            border-bottom: 1.5px solid #000000;
            letter-spacing: 0.3px;
        }
        .intro-line {
            padding: 6px 8px 4px 8px;
            font-size: 8.5pt;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin: 2px 0 4px 0;
        }
        .meta-table td {
            vertical-align: top;
            padding: 2px 4px;
            font-size: 8.5pt;
            line-height: 1.25;
        }
        .m-label {
            width: 220px;
            padding-left: 8px !important;
            white-space: nowrap;
        }
        .m-colon {
            width: 12px;
            text-align: center;
        }
        .m-val {
            padding-right: 8px !important;
        }
        .section-bar {
            border-top: 1px solid #000000;
            padding: 4px 8px;
            font-size: 8.5pt;
        }
        .rincian-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
        }
        .rincian-table th,
        .rincian-table td {
            border: 1px solid #000000;
            padding: 3.5px 5px;
            line-height: 1.2;
            vertical-align: middle;
        }
        .rincian-table th:first-child,
        .rincian-table td:first-child {
            border-left: none;
        }
        .rincian-table th:last-child,
        .rincian-table td:last-child {
            border-right: none;
        }
        .rincian-table th {
            text-align: center;
            font-weight: bold;
            font-size: 7.8pt;
        }
        .num {
            text-align: right;
            white-space: nowrap;
        }
        .ctr {
            text-align: center;
            white-space: nowrap;
        }
        .jumlah-row td {
            font-weight: bold;
            padding: 4px 5px;
        }
        .potongan-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.2pt;
            margin-top: 2px;
        }
        .potongan-table td {
            padding: 1.8px 8px;
            line-height: 1.22;
        }
        .p-italic {
            font-style: italic;
        }
        .summary-section {
            border-top: 1.5px solid #000000;
            padding: 4px 0;
        }
        .summary-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
        }
        .summary-table td {
            padding: 1.8px 8px;
        }
        .terbilang-bar {
            border-top: 1px solid #000000;
            border-bottom: 1.5px solid #000000;
            padding: 4px 8px;
            font-size: 8.2pt;
            font-weight: bold;
        }
        .ttd-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 14px;
            margin-bottom: 14px;
            font-size: 8.5pt;
        }
        .ttd-table td {
            width: 50%;
            vertical-align: top;
            text-align: center;
            padding: 0 12px;
        }
        .ttd-space {
            height: 54px;
        }
        .ttd-nama {
            font-weight: bold;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    @php
        $fmt = fn ($val) => (float) $val == 0 ? '0' : number_format((float) $val, 0, ',', '.');
        $fmtDash = fn ($val) => (float) $val == 0 ? '-' : number_format((float) $val, 0, ',', '.');
    @endphp

    <div class="outer-box">
        <div class="header-title">NOTA PENCAIRAN DANA</div>

        <div class="intro-line">
            Bendahara Pengeluaran Dinas Ketahanan Pangan dan Pertanian Kabupaten Indramayu , supaya mencairkan dana kepada:
        </div>

        <table class="meta-table">
            <tr>
                <td class="m-label">1. Pejabat Pelaksana Teknis Kegiatan</td>
                <td class="m-colon">:</td>
                <td class="m-val"><strong>{{ $pptkNama }}</strong></td>
            </tr>
            <tr>
                <td class="m-label">2. Program</td>
                <td class="m-colon">:</td>
                <td class="m-val">{{ strtoupper($npd->nama_program ?: '-') }}</td>
            </tr>
            <tr>
                <td class="m-label">3. Kegiatan</td>
                <td class="m-colon">:</td>
                <td class="m-val">{{ $npd->subKegiatan?->nama_kegiatan ?: '-' }}</td>
            </tr>
            <tr>
                <td class="m-label">4. Sub Kegiatan</td>
                <td class="m-colon">:</td>
                <td class="m-val">{{ $npd->subKegiatan?->sub_kegiatan ?: '-' }}</td>
            </tr>
            <tr>
                <td class="m-label">4. No. Sub Kegiatan/DPAL/DPPA-SKPD</td>
                <td class="m-colon">:</td>
                <td class="m-val">{{ $npd->subKegiatan?->kode_sub_kegiatan ?: '-' }}</td>
            </tr>
            <tr>
                <td class="m-label">5. Tahun anggaran</td>
                <td class="m-colon">:</td>
                <td class="m-val">{{ $npd->tahun_anggaran }}</td>
            </tr>
            <tr>
                <td class="m-label">6. Jumlah Dana Yang Diminta</td>
                <td class="m-colon">:</td>
                <td class="m-val"><strong><em>{{ $fmt($npd->total_pencairan_saat_ini) }}</em></strong></td>
            </tr>
            <tr>
                <td class="m-label">Terbilang</td>
                <td class="m-colon">:</td>
                <td class="m-val"><em>{{ ucwords(strtolower($terbilangDiminta)) }}</em></td>
            </tr>
        </table>

        <div class="section-bar">
            Pembebanan pada kode rekening belanja Langsung, dengan rincian :
        </div>

        <table class="rincian-table">
            <thead>
                <tr>
                    <th style="width: 24px;">No.</th>
                    <th style="width: 108px;">KODE REKENING</th>
                    <th>URAIAN</th>
                    <th style="width: 74px;">ANGGARAN</th>
                    <th style="width: 78px;">AKUMULASI<br>PENCAIRAN<br>SEBELUMNYA</th>
                    <th style="width: 74px;">PENCAIRAN<br>SAAT INI</th>
                    <th style="width: 68px;">SISA</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($npd->items as $idx => $item)
                    <tr>
                        <td class="ctr">{{ $idx + 1 }}</td>
                        <td style="white-space: nowrap;">{{ $item->kode_rekening }}</td>
                        <td>{{ $item->uraian }}</td>
                        <td class="num">{{ $fmt($item->anggaran) }}</td>
                        <td class="num">{{ $fmt($item->akumulasi_sebelumnya) }}</td>
                        <td class="num">{{ $fmt($item->pencairan_saat_ini) }}</td>
                        <td class="num">{{ $fmt($item->sisa) }}</td>
                    </tr>
                @endforeach
                <tr class="jumlah-row">
                    <td colspan="3" class="ctr">JUMLAH</td>
                    <td class="num">{{ $fmt($npd->total_anggaran) }}</td>
                    <td class="num">{{ $fmt($npd->total_akumulasi_sebelumnya) }}</td>
                    <td class="num">{{ $fmt($npd->total_pencairan_saat_ini) }}</td>
                    <td class="num">{{ $fmt($npd->total_sisa) }}</td>
                </tr>
            </tbody>
        </table>

        <table class="potongan-table">
            <tr>
                <td colspan="3" style="padding-top: 4px;">Potongan-potongan :</td>
            </tr>
            <tr class="p-italic">
                <td style="width: 62%;">PPN</td>
                <td style="width: 8%; text-align: right;">Rp.</td>
                <td style="width: 16%; text-align: right;">{{ $fmtDash($npd->potongan_ppn) }}</td>
                <td style="width: 14%;"></td>
            </tr>
            <tr class="p-italic">
                <td>PPh Pasal 21</td>
                <td style="text-align: right;">Rp.</td>
                <td style="text-align: right;">{{ $fmtDash($npd->potongan_pph21) }}</td>
                <td></td>
            </tr>
            <tr class="p-italic">
                <td>PPh Pasal 22</td>
                <td style="text-align: right;">Rp.</td>
                <td style="text-align: right;">{{ $fmtDash($npd->potongan_pph22) }}</td>
                <td></td>
            </tr>
            <tr class="p-italic">
                <td>PPh Pasal 23</td>
                <td style="text-align: right;">Rp.</td>
                <td style="text-align: right;">{{ $fmtDash($npd->potongan_pph23) }}</td>
                <td></td>
            </tr>
            <tr class="p-italic">
                <td style="padding-bottom: 4px;">PPh Pasal 2 Ayat 4</td>
                <td style="text-align: right; padding-bottom: 4px;">Rp.</td>
                <td style="text-align: right; padding-bottom: 4px;">{{ $fmtDash($npd->potongan_pph4_2) }}</td>
                <td></td>
            </tr>
        </table>

        <div class="summary-section">
            <table class="summary-table">
                <tr>
                    <td style="width: 56%; font-weight: bold;">Jumlah yang diminta</td>
                    <td style="width: 6%; text-align: center;">:</td>
                    <td style="width: 8%; text-align: right;"><em>Rp.</em></td>
                    <td style="width: 16%; text-align: right;">{{ $fmt($npd->total_pencairan_saat_ini) }}</td>
                    <td style="width: 14%;"></td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">Potongan</td>
                    <td style="text-align: center;">:</td>
                    <td style="text-align: right;"><em>Rp.</em></td>
                    <td style="text-align: right;">{{ $fmtDash($npd->total_potongan) }}</td>
                    <td></td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">Jumlah yang dibayarkan</td>
                    <td style="text-align: center;">:</td>
                    <td style="text-align: right;"><em>Rp.</em></td>
                    <td style="text-align: right; font-weight: bold;">{{ $fmt($npd->jumlah_dibayarkan) }}</td>
                    <td></td>
                </tr>
            </table>
        </div>

        <div class="terbilang-bar">
            TERBILANG : <em>{{ $terbilangDibayarkan }}</em>
        </div>

        <table class="ttd-table">
            <tr>
                <td>
                    <div style="margin-bottom: 14px;">&nbsp;</div>
                    <div>Pengguna Anggaran</div>
                    <div class="ttd-space"></div>
                    <div class="ttd-nama">{{ $paNama }}</div>
                    <div>NIP. {{ $paNip }}</div>
                </td>
                <td>
                    <div style="margin-bottom: 14px;">{!! $tanggalIndramayuHtml !!}</div>
                    <div>Pejabat Pelaksana Teknis Kegiatan<br>(PPTK)</div>
                    <div class="ttd-space"></div>
                    <div class="ttd-nama">{{ $pptkNama }}</div>
                    <div>NIP. {{ $pptkNip }}</div>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
