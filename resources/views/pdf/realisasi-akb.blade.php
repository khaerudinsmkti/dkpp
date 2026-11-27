<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>AKB ({{ $jenisLabel }}) - {{ $subKegiatan->kode_sub_kegiatan }}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 1cm 0.9cm 1cm 0.9cm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 7.5pt;
            color: #000000;
            line-height: 1.25;
            margin: 0;
            padding: 0;
        }
        .judul-box {
            text-align: center;
            margin-bottom: 10px;
        }
        .judul-main {
            font-size: 10.5pt;
            font-weight: bold;
            margin: 0 0 2px 0;
            text-transform: uppercase;
        }
        .judul-sub {
            font-size: 8.5pt;
            margin: 0;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 7.5pt;
        }
        .meta-table td {
            padding: 1.5px 2px;
            vertical-align: top;
        }
        .m-label {
            width: 120px;
        }
        .m-colon {
            width: 10px;
            text-align: center;
        }
        .terbilang-italic {
            font-style: italic;
        }

        .matrix-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 6.8pt;
        }
        .matrix-table th,
        .matrix-table td {
            border: 1px solid #000000;
            padding: 3px 3px;
            vertical-align: middle;
        }
        .matrix-table th {
            text-align: center;
            font-weight: bold;
            background-color: #e0f2fe;
        }
        .col-no {
            width: 2.2%;
            text-align: center;
        }
        .col-kode {
            width: 9.5%;
            text-align: left;
            white-space: nowrap;
        }
        .col-uraian {
            width: 17.5%;
            text-align: left;
        }
        .col-anggaran {
            width: 6.8%;
            text-align: right;
            white-space: nowrap;
        }
        .col-bulan {
            width: 4.3%;
            text-align: right;
            white-space: nowrap;
        }
        .col-total {
            width: 6.2%;
            text-align: right;
            white-space: nowrap;
            font-weight: bold;
            background-color: #f0f9ff;
        }
        .col-sisa {
            width: 6.2%;
            text-align: right;
            white-space: nowrap;
            background-color: #fef3c7;
            font-weight: bold;
        }
        .total-row td {
            font-weight: bold;
            background-color: #f3f4f6;
            padding: 4px 3px;
        }
        .total-row td.col-total {
            background-color: #e0f2fe;
        }
        .total-row td.col-sisa {
            background-color: #fde68a;
        }
    </style>
</head>
<body>
    <div class="judul-box">
        <p class="judul-main">ANGGARAN KAS BELANJA (AKB) — ANGGARAN {{ $jenisLabel }}</p>
        <p class="judul-sub">Pemerintah Kab. Indramayu Tahun Anggaran {{ $subKegiatan->tahun_anggaran }}</p>
    </div>

    <table class="meta-table">
        <tr>
            <td class="m-label">Urusan</td>
            <td class="m-colon">:</td>
            <td>{{ $subKegiatan->urusan ?: '-' }}</td>
        </tr>
        <tr>
            <td class="m-label">Bidang</td>
            <td class="m-colon">:</td>
            <td>{{ $subKegiatan->bidang ?: '-' }}</td>
        </tr>
        <tr>
            <td class="m-label">Unit Organisasi</td>
            <td class="m-colon">:</td>
            <td>{{ $subKegiatan->unit_organisasi ?: '-' }}</td>
        </tr>
        <tr>
            <td class="m-label">Sub Unit Organisasi</td>
            <td class="m-colon">:</td>
            <td>{{ $subKegiatan->sub_unit_organisasi ?: ($subKegiatan->unit_organisasi ?: '-') }}</td>
        </tr>
        <tr>
            <td class="m-label">Program</td>
            <td class="m-colon">:</td>
            <td>{{ $subKegiatan->program ?: '-' }}</td>
        </tr>
        <tr>
            <td class="m-label">Kegiatan</td>
            <td class="m-colon">:</td>
            <td>{{ $subKegiatan->kegiatan ?: '-' }}</td>
        </tr>
        <tr>
            <td class="m-label">Sub Kegiatan</td>
            <td class="m-colon">:</td>
            <td><strong>{{ $subKegiatan->kode_sub_kegiatan }} {{ $subKegiatan->nama_sub_kegiatan }}</strong></td>
        </tr>
        <tr>
            <td class="m-label">Nilai Anggaran</td>
            <td class="m-colon">:</td>
            <td>
                <strong>Rp {{ number_format($totalAnggaran, 0, ',', '.') }}</strong><br>
                <span class="terbilang-italic">( {{ $terbilangAnggaran }} )</span>
            </td>
        </tr>
    </table>

    <table class="matrix-table">
        <thead>
            <tr>
                <th rowspan="2" class="col-no">No</th>
                <th rowspan="2" class="col-kode" style="text-align: center;">Kode Rekening</th>
                <th rowspan="2" class="col-uraian" style="text-align: center;">Uraian</th>
                <th rowspan="2" class="col-anggaran" style="text-align: center;">Pagu Anggaran</th>
                <th colspan="12">RENCANA ANGGARAN KAS BELANJA (AKB) PER BULAN</th>
                <th rowspan="2" class="col-total" style="text-align: center;">Total AKB</th>
                <th rowspan="2" class="col-sisa" style="text-align: center; background-color: #e0f2fe;">Sisa Pagu</th>
            </tr>
            <tr>
                <th>Jan</th>
                <th>Feb</th>
                <th>Mar</th>
                <th>Apr</th>
                <th>Mei</th>
                <th>Jun</th>
                <th>Jul</th>
                <th>Ags</th>
                <th>Sep</th>
                <th>Okt</th>
                <th>Nov</th>
                <th>Des</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($rows as $row)
                <tr>
                    <td class="col-no">{{ $row['no'] }}</td>
                    <td class="col-kode">{{ $row['kode_rekening'] }}</td>
                    <td class="col-uraian">{{ $row['uraian'] }}</td>
                    <td class="col-anggaran">{{ number_format($row['pagu'], 0, ',', '.') }}</td>
                    @for ($m = 1; $m <= 12; $m++)
                        <td class="col-bulan">
                            {{ ($row['akb_bulanan'][$m] ?? 0) > 0 ? number_format($row['akb_bulanan'][$m], 0, ',', '.') : '' }}
                        </td>
                    @endfor
                    <td class="col-total">{{ number_format($row['total_akb'], 0, ',', '.') }}</td>
                    <td class="col-sisa">{{ number_format($row['sisa_pagu'], 0, ',', '.') }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="3" style="text-align: center;">JUMLAH</td>
                <td class="col-anggaran">{{ number_format($totalAnggaran, 0, ',', '.') }}</td>
                @for ($m = 1; $m <= 12; $m++)
                    <td class="col-bulan">{{ number_format($monthlyAkbTotals[$m] ?? 0, 0, ',', '.') }}</td>
                @endfor
                <td class="col-total">{{ number_format($totalAkb, 0, ',', '.') }}</td>
                <td class="col-sisa">{{ number_format($totalSisaPagu, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>
</body>
</html>
