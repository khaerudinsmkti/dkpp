<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Rekap Realisasi per Kode Rekening ({{ $jenisLabel }}) TA {{ $tahun }}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 1cm 0.9cm 1cm 0.9cm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 7.5pt;
            color: #111827;
            line-height: 1.3;
            margin: 0;
            padding: 0;
        }
        .judul-box {
            text-align: center;
            margin-bottom: 10px;
        }
        .judul-main {
            font-size: 11pt;
            font-weight: bold;
            margin: 0 0 2px 0;
            text-transform: uppercase;
            color: #005555;
        }
        .judul-sub {
            font-size: 8.5pt;
            margin: 0;
            color: #374151;
        }
        .filter-bar {
            margin-bottom: 8px;
            padding: 4px 8px;
            background-color: #f3f4f6;
            border: 1px solid #d1d5db;
            font-size: 7pt;
            color: #374151;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7.2pt;
        }
        .data-table th,
        .data-table td {
            border: 1px solid #1f2937;
            padding: 4px 5px;
            vertical-align: top;
        }
        .data-table th {
            text-align: center;
            font-weight: bold;
            background-color: #e6f4f4;
            color: #004d4d;
            vertical-align: middle;
        }
        .ctr {
            text-align: center;
        }
        .num {
            text-align: right;
            white-space: nowrap;
        }
        .kode {
            font-family: 'Courier New', Courier, monospace;
            font-weight: bold;
            white-space: nowrap;
            color: #005555;
        }
        .sub-list {
            margin-top: 2px;
            font-size: 6.5pt;
            color: #4b5563;
        }
        .badge-gu {
            display: inline-block;
            padding: 1px 4px;
            font-size: 6.2pt;
            font-weight: bold;
            background-color: #e0f2fe;
            color: #0369a1;
            border-radius: 2px;
        }
        .badge-ls {
            display: inline-block;
            padding: 1px 4px;
            font-size: 6.2pt;
            font-weight: bold;
            background-color: #ede9fe;
            color: #6d28d9;
            border-radius: 2px;
        }
        .total-row td {
            font-weight: bold;
            background-color: #e6f4f4;
            padding: 5px 5px;
        }
    </style>
</head>
<body>
    <div class="judul-box">
        <p class="judul-main">REKAPITULASI REALISASI ANGGARAN PER KODE REKENING — ANGGARAN {{ $jenisLabel }}</p>
        <p class="judul-sub">Dinas Ketahanan Pangan dan Pertanian Kabupaten Indramayu &bull; Tahun Anggaran {{ $tahun }}</p>
    </div>

    <div class="filter-bar">
        <strong>Filter Aktif:</strong>
        Jenis Pencairan: <strong>{{ $filterJenisLabel }}</strong> &nbsp;|&nbsp;
        Status Serapan: <strong>{{ $filterStatusLabel }}</strong>
        @if ($searchQuery !== '')
            &nbsp;|&nbsp; Pencarian: <strong>"{{ $searchQuery }}"</strong>
        @endif
        &nbsp;|&nbsp; Total Rekening: <strong>{{ count($rows) }}</strong>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 3%;">No</th>
                <th style="width: 13%;">Kode Rekening</th>
                <th style="width: 6%;">Jenis</th>
                <th style="width: 32%;">Uraian &amp; Sub Kegiatan</th>
                <th style="width: 12%;">Pagu Anggaran (Rp)</th>
                <th style="width: 12%;">Realisasi (Rp)</th>
                <th style="width: 11%;">Sisa Pagu (Rp)</th>
                <th style="width: 5.5%;">Serapan</th>
                <th style="width: 5.5%;">Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $idx => $row)
                <tr>
                    <td class="ctr">{{ $idx + 1 }}</td>
                    <td class="kode">{{ $row['kode_rekening'] }}</td>
                    <td class="ctr">
                        @foreach ($row['jenis_list'] as $j)
                            <span class="{{ $j === 'LS' ? 'badge-ls' : 'badge-gu' }}">{{ $j }}</span>
                        @endforeach
                    </td>
                    <td>
                        <strong>{{ $row['uraian'] }}</strong>
                        @if (count($row['sources']) > 0)
                            <div class="sub-list">
                                @foreach ($row['sources'] as $src)
                                    &bull; {{ $src['nama_sub_kegiatan'] }} (Pagu: {{ number_format($src['pagu'], 0, ',', '.') }}, Real: {{ number_format($src['realisasi'], 0, ',', '.') }})<br>
                                @endforeach
                            </div>
                        @endif
                    </td>
                    <td class="num">{{ number_format($row['pagu'], 0, ',', '.') }}</td>
                    <td class="num">{{ number_format($row['realisasi'], 0, ',', '.') }}</td>
                    <td class="num">{{ number_format($row['sisa'], 0, ',', '.') }}</td>
                    <td class="num">{{ number_format($row['persen'], 2, ',', '.') }}%</td>
                    <td class="ctr">{{ $row['status_label'] }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="9" class="ctr" style="padding: 14px; color: #6b7280;">
                        Tidak ada data kode rekening yang sesuai filter.
                    </td>
                </tr>
            @endforelse
            @if (count($rows) > 0)
                <tr class="total-row">
                    <td colspan="4" class="ctr">TOTAL KESELURUHAN</td>
                    <td class="num">{{ number_format($grandPagu, 0, ',', '.') }}</td>
                    <td class="num">{{ number_format($grandRealisasi, 0, ',', '.') }}</td>
                    <td class="num">{{ number_format($grandSisa, 0, ',', '.') }}</td>
                    <td class="num">{{ number_format($grandPersen, 2, ',', '.') }}%</td>
                    <td class="ctr">-</td>
                </tr>
            @endif
        </tbody>
    </table>
</body>
</html>
