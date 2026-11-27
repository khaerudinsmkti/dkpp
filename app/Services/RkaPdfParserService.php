<?php

namespace App\Services;

use RuntimeException;
use Smalot\PdfParser\Parser;

class RkaPdfParserService
{
    /**
     * Parse PDF RKA-Belanja SKPD (cetakan SIPD-RI) dan ekstrak metadata Sub Kegiatan
     * beserta daftar Kode Rekening Belanja (level 6 segmen / sub rincian objek).
     *
     * @return array{
     *     tahun_anggaran: int,
     *     urusan: string,
     *     bidang: string,
     *     unit_organisasi: string,
     *     sub_unit_organisasi: string,
     *     program: string,
     *     kegiatan: string,
     *     kode_sub_kegiatan: string,
     *     nama_sub_kegiatan: string,
     *     sumber_pendanaan: string,
     *     lokasi: string,
     *     waktu_pelaksanaan: string,
     *     total_anggaran: float,
     *     rekenings: array<int, array{kode_rekening: string, uraian: string, pagu_anggaran: float}>
     * }
     */
    public function parse(string $filePath): array
    {
        if (! file_exists($filePath)) {
            throw new RuntimeException('File PDF RKA tidak ditemukan.');
        }

        $parser = new Parser();
        $pdf = $parser->parseFile($filePath);
        $rawText = (string) $pdf->getText();

        if (trim($rawText) === '') {
            throw new RuntimeException('Teks PDF tidak dapat dibaca. Pastikan file adalah PDF RKA cetakan SIPD-RI (bukan hasil scan gambar).');
        }

        // Normalisasi line endings & whitespace
        $normalized = str_replace(["\r\n", "\r"], "\n", $rawText);
        $lines = array_values(array_map(
            fn (string $l) => trim(preg_replace('/[ \t]+/', ' ', $l) ?? ''),
            explode("\n", $normalized)
        ));

        // 1. Tahun Anggaran
        $tahunAnggaran = (int) date('Y');
        if (preg_match('/Tahun\s+Anggaran\s+(\d{4})/i', $normalized, $m)) {
            $tahunAnggaran = (int) $m[1];
        }

        // 2. Ekstrak field header utama
        $urusan = $this->extractHeaderField($lines, 'Urusan Pemerintahan', ['Bidang Urusan', 'Unit Organisasi']);
        $bidang = $this->extractHeaderField($lines, 'Bidang Urusan', ['Unit Organisasi', 'Sub Unit Organisasi']);
        $unitOrganisasi = $this->extractHeaderField($lines, 'Unit Organisasi', ['Sub Unit Organisasi', 'Program']);
        $subUnit = $this->extractHeaderField($lines, 'Sub Unit Organisasi', ['Program', 'Kegiatan']);
        if ($subUnit === '-' || $subUnit === '') {
            $subUnit = $unitOrganisasi;
        }
        $program = $this->extractHeaderField($lines, 'Program', ['Kegiatan', 'Sub Kegiatan']);
        $kegiatan = $this->extractHeaderField($lines, 'Kegiatan', ['Sub Kegiatan', 'SPM']);
        if ($kegiatan === '' && preg_match('/^(.*?)\s+Kegiatan\s*:\s*(.+)$/iu', $program, $pm)) {
            $program = trim($pm[1]);
            $kegiatan = trim($pm[2]);
        }
        $subKegiatanFull = $this->extractHeaderField($lines, 'Sub Kegiatan', ['SPM', 'Jenis Layanan', 'Sumber Pendanaan']);
        $sumberPendanaan = $this->extractHeaderField($lines, 'Sumber Pendanaan', ['Lokasi', 'Waktu Pelaksanaan']);
        $lokasi = $this->extractHeaderField($lines, 'Lokasi', ['Waktu Pelaksanaan', 'Keluaran Sub Kegiatan']);
        $waktuPelaksanaan = $this->extractHeaderField($lines, 'Waktu Pelaksanaan', ['Kelompok Sasaran', 'Keterangan', 'Alokasi']);

        // Pisahkan kode_sub_kegiatan & nama_sub_kegiatan
        // Contoh: "2.09.03.2.01.0008 Stabilisasi Pasokan dan Harga Pangan Tingkat Produsen dan Konsumen di Kabupaten/Kota"
        $kodeSubKegiatan = '';
        $namaSubKegiatan = $subKegiatanFull;
        if (preg_match('/^(\d+(?:\.\d+){3,})\s+(.+)$/u', $subKegiatanFull, $m)) {
            $kodeSubKegiatan = trim($m[1]);
            $namaSubKegiatan = trim($m[2]);
        }

        // 3. Ekstrak Kode Rekening Belanja level 6 segmen (Sub Rincian Objek)
        // Contoh: "5.1.02.01.001.00026 Belanja Alat/Bahan untuk Kegiatan Kantor- Bahan Cetak Rp. 536.230,00"
        // atau di SIPD lain: "5.1.02.01.01.0026 ..."
        $rekenings = $this->extractRekenings($lines);

        // 4. Total Anggaran: ambil dari jumlah seluruh rekening, atau fallback ke "Alokasi {tahun}" / "Jumlah :"
        $totalFromRekenings = array_reduce(
            $rekenings,
            fn (float $carry, array $item) => $carry + (float) $item['pagu_anggaran'],
            0.0
        );

        $totalAnggaran = $totalFromRekenings;
        if ($totalAnggaran <= 0) {
            if (preg_match('/Alokasi\s+'.$tahunAnggaran.'\s*:\s*Rp\.?\s*([\d\.,]+)/i', $normalized, $m)) {
                $totalAnggaran = self::parseIndoMoney($m[1]);
            } elseif (preg_match('/5\s+BELANJA\s+DAERAH\s+Rp\.?\s*([\d\.,]+)/i', $normalized, $m)) {
                $totalAnggaran = self::parseIndoMoney($m[1]);
            }
        }

        return [
            'tahun_anggaran' => $tahunAnggaran,
            'urusan' => $urusan,
            'bidang' => $bidang,
            'unit_organisasi' => $unitOrganisasi,
            'sub_unit_organisasi' => $subUnit,
            'program' => $program,
            'kegiatan' => $kegiatan,
            'kode_sub_kegiatan' => $kodeSubKegiatan,
            'nama_sub_kegiatan' => $namaSubKegiatan,
            'sumber_pendanaan' => $sumberPendanaan,
            'lokasi' => $lokasi,
            'waktu_pelaksanaan' => $waktuPelaksanaan,
            'total_anggaran' => $totalAnggaran,
            'rekenings' => $rekenings,
        ];
    }

    /**
     * Ekstrak nilai field header multi-baris dari daftar baris teks PDF.
     *
     * @param  array<int, string>  $lines
     * @param  array<int, string>  $stopLabels
     */
    private function extractHeaderField(array $lines, string $label, array $stopLabels): string
    {
        $pattern = '/^'.preg_quote($label, '/').'\s*:\s*(.*)$/i';
        $stopPattern = '/^(?:'.implode('|', array_map(fn (string $s) => preg_quote($s, '/'), $stopLabels)).')\s*:/i';

        $count = count($lines);
        for ($i = 0; $i < $count; $i++) {
            if (preg_match($pattern, $lines[$i], $m)) {
                $value = trim($m[1]);
                // Gabungkan baris lanjutan jika teks terbungkus ke baris berikutnya
                for ($j = $i + 1; $j < min($count, $i + 4); $j++) {
                    $next = $lines[$j];
                    if ($next === '' || preg_match($stopPattern, $next) || preg_match('/^[A-Za-z0-9\s\/]+\s*:/', $next)) {
                        break;
                    }
                    $value = trim($value.' '.$next);
                }

                return $value;
            }
        }

        return '';
    }

    /**
     * Ekstrak daftar Kode Rekening level 6 segmen (Sub Rincian Objek) dari baris teks PDF.
     *
     * @param  array<int, string>  $lines
     * @return array<int, array{kode_rekening: string, uraian: string, pagu_anggaran: float}>
     */
    private function extractRekenings(array $lines): array
    {
        $results = [];
        $seen = [];
        $count = count($lines);

        // Pola kode rekening belanja 6 segmen (misal 5.1.02.01.001.00026 atau 5.1.02.01.01.0026)
        // Mendukung kondisi teks menempel tanpa spasi pada cetakan 2-kolom SIPD-RI (misal 5.1.02.01.001.00026Belanja...)
        $kodePattern = '/^(5\.\d+\.\d{2}\.\d{2}\.\d{2,3}\.\d{4,5})(?=\s|[A-Za-z]|$)\s*(.*)$/';

        // Helper untuk mengekstrak (uraian, nominal) dari akhir baris pada format 1-kolom (Rp.) maupun 2-kolom (Sebelum, Sesudah, Selisih)
        $extractTrailingAmount = static function (string $segment): ?array {
            // 1. Format 2-kolom SIPD-RI (Sebelum | Sesudah | Bertambah/(Berkurang)) -> ambil kolom Sesudah
            if (preg_match('/^(.*?)\s+([\d\.]+,\d{2})\s+([\d\.]+,\d{2})\s+\(?-?[\d\.]+,\d{2}\)?\s*$/', $segment, $m)) {
                return [trim($m[1]), self::parseIndoMoney($m[3])];
            }
            // 2. Format 1-kolom SIPD-RI dengan prefix Rp.
            if (preg_match('/^(.*?)\s*Rp\.?\s*([\d\.]+(?:,\d{2})?)\s*$/i', $segment, $m)) {
                return [trim($m[1]), self::parseIndoMoney($m[2])];
            }
            // 3. Fallback 1-kolom angka desimal Indonesia tanpa Rp.
            if (preg_match('/^(.*?)\s+([\d\.]+,\d{2})\s*$/', $segment, $m)) {
                return [trim($m[1]), self::parseIndoMoney($m[2])];
            }

            return null;
        };

        for ($i = 0; $i < $count; $i++) {
            $line = $lines[$i];
            if (! preg_match($kodePattern, $line, $m)) {
                continue;
            }

            $kode = trim($m[1]);
            $rest = trim($m[2]);
            $uraianParts = [];
            $amount = null;

            // Cek apakah nominal sudah ada di baris yang sama
            $matchedSameLine = $extractTrailingAmount($rest);
            if ($matchedSameLine !== null) {
                if ($matchedSameLine[0] !== '') {
                    $uraianParts[] = $matchedSameLine[0];
                }
                $amount = $matchedSameLine[1];
            } else {
                if ($rest !== '') {
                    $uraianParts[] = $rest;
                }
                // Cari lanjutan uraian dan nominal di baris-baris berikutnya (maks 4 baris)
                for ($j = $i + 1; $j < min($count, $i + 5); $j++) {
                    $next = $lines[$j];
                    if ($next === '') {
                        continue;
                    }
                    // Berhenti jika bertemu kode rekening baru atau blok [#] / [-]
                    if (preg_match('/^5(?:\.\d+)+(?=\s|[A-Za-z]|$)/', $next) || str_starts_with($next, '[ # ]') || str_starts_with($next, '[ - ]') || str_starts_with($next, '[#]') || str_starts_with($next, '[-]')) {
                        break;
                    }
                    $matchedNextLine = $extractTrailingAmount($next);
                    if ($matchedNextLine !== null) {
                        if ($matchedNextLine[0] !== '') {
                            $uraianParts[] = $matchedNextLine[0];
                        }
                        $amount = $matchedNextLine[1];
                        break;
                    }
                    $uraianParts[] = $next;
                }
            }

            $uraian = trim(preg_replace('/\s+/', ' ', implode(' ', $uraianParts)) ?? '');
            if ($uraian === '') {
                $uraian = 'Belanja Rekening '.$kode;
            }

            if (! isset($seen[$kode])) {
                $seen[$kode] = count($results);
                $results[] = [
                    'kode_rekening' => $kode,
                    'uraian' => $uraian,
                    'pagu_anggaran' => (float) ($amount ?? 0.0),
                ];
            } elseif (($amount ?? 0.0) > 0 && $results[$seen[$kode]]['pagu_anggaran'] <= 0) {
                $results[$seen[$kode]]['pagu_anggaran'] = (float) $amount;
            }
        }

        return $results;
    }

    public static function parseIndoMoney(string $raw): float
    {
        $clean = trim(str_replace(['Rp.', 'Rp', ' '], '', $raw));
        // Format Indonesia: 14.336.230,00 -> hapus titik ribuan, ubah koma desimal jadi titik
        if (str_contains($clean, ',')) {
            $clean = str_replace('.', '', $clean);
            $clean = str_replace(',', '.', $clean);
        } else {
            $clean = str_replace('.', '', $clean);
        }

        return (float) $clean;
    }
}
