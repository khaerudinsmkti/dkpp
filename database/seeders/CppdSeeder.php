<?php

namespace Database\Seeders;

use App\Models\Cppd;
use App\Models\CppdInitialStock;
use App\Models\User;
use Illuminate\Database\Seeder;

class CppdSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first() ?? User::factory()->create();

        // 1. Initial Stocks for 2025 and 2026
        CppdInitialStock::updateOrCreate(
            ['year' => 2025],
            [
                'amount' => 85000.00,
                'keterangan' => 'Stok awal tahun 2025 berdasarkan saldo sisa APBD 2024',
                'created_by' => $user->id,
            ]
        );

        CppdInitialStock::updateOrCreate(
            ['year' => 2026],
            [
                'amount' => 120000.00,
                'keterangan' => 'Stok awal tahun 2026 penetapan cadangan pangan pokok daerah (Beras)',
                'created_by' => $user->id,
            ]
        );

        // 2. Clear existing sample cppd records to avoid duplicates
        Cppd::truncate();

        $samples = [
            // Pengadaan 2026
            [
                'tanggal' => '2026-01-20',
                'status' => Cppd::STATUS_PENGADAAN,
                'kecamatan' => 'INDRAMAYU',
                'desa' => 'MARGADAWANG',
                'jumlah' => 45000.00,
                'keterangan' => 'Pengadaan beras CPPD Tahap I melalui mitra Bulog Cabang Indramayu',
            ],
            [
                'tanggal' => '2026-03-10',
                'status' => Cppd::STATUS_PENGADAAN,
                'kecamatan' => 'JATIBARANG',
                'desa' => 'JATIBARANG',
                'jumlah' => 30000.00,
                'keterangan' => 'Pengadaan beras CPPD Tahap II dari Gabungan Kelompok Tani (Gapoktan)',
            ],

            // Addendum 2026
            [
                'tanggal' => '2026-04-05',
                'status' => Cppd::STATUS_ADDENDUM,
                'kecamatan' => 'INDRAMAYU',
                'desa' => 'KARANGANYAR',
                'jumlah' => 5000.00,
                'keterangan' => 'Addendum penyesuaian volume kontrak pengadaan beras cadangan pangan',
            ],

            // Penyaluran 2026 to villages in various kecamatans
            [
                'tanggal' => '2026-02-12',
                'status' => Cppd::STATUS_PENYALURAN,
                'kecamatan' => 'HAURGEULIS',
                'desa' => 'WANAKAYA',
                'jumlah' => 4250.00,
                'keterangan' => 'Bantuan pasca bencana banjir luapan sungai bagi 425 KK terdampak',
            ],
            [
                'tanggal' => '2026-02-15',
                'status' => Cppd::STATUS_PENYALURAN,
                'kecamatan' => 'HAURGEULIS',
                'desa' => 'HAURKOLOT',
                'jumlah' => 3800.00,
                'keterangan' => 'Penyaluran cadangan pangan daerah penanganan kerawanan pangan transisi',
            ],
            [
                'tanggal' => '2026-02-28',
                'status' => Cppd::STATUS_PENYALURAN,
                'kecamatan' => 'KANDANGHAUR',
                'desa' => 'ERETAN KULON',
                'jumlah' => 6500.00,
                'keterangan' => 'Bantuan pangan tanggap darurat rob pesisir pantai Eretan Kulon',
            ],
            [
                'tanggal' => '2026-03-05',
                'status' => Cppd::STATUS_PENYALURAN,
                'kecamatan' => 'KANDANGHAUR',
                'desa' => 'ERETAN WETAN',
                'jumlah' => 5200.00,
                'keterangan' => 'Penyaluran beras bantuan bagi nelayan terdampak cuaca ekstrem',
            ],
            [
                'tanggal' => '2026-03-18',
                'status' => Cppd::STATUS_PENYALURAN,
                'kecamatan' => 'LOSARANG',
                'desa' => 'JUMBLENG',
                'jumlah' => 4100.00,
                'keterangan' => 'Bantuan pangan intervensi kerawanan pangan kronis',
            ],
            [
                'tanggal' => '2026-03-25',
                'status' => Cppd::STATUS_PENYALURAN,
                'kecamatan' => 'CANTIGI',
                'desa' => 'CANTIGI KULON',
                'jumlah' => 3500.00,
                'keterangan' => 'Penyaluran CPPD untuk keluarga rawan pangan wilayah pesisir',
            ],
            [
                'tanggal' => '2026-04-02',
                'status' => Cppd::STATUS_PENYALURAN,
                'kecamatan' => 'KRANGKENG',
                'desa' => 'KRANGKENG',
                'jumlah' => 4800.00,
                'keterangan' => 'Bantuan penanggulangan dampak kekeringan musim tanam',
            ],
            [
                'tanggal' => '2026-04-14',
                'status' => Cppd::STATUS_PENYALURAN,
                'kecamatan' => 'GANTAR',
                'desa' => 'MEKARMULYA',
                'jumlah' => 3600.00,
                'keterangan' => 'Intervensi penanganan daerah rentan SKPG di wilayah perbukitan',
            ],
            [
                'tanggal' => '2026-05-02',
                'status' => Cppd::STATUS_PENYALURAN,
                'kecamatan' => 'TERISI',
                'desa' => 'CIKEDUNG LOR',
                'jumlah' => 3900.00,
                'keterangan' => 'Penyaluran beras CPPD masyarakat prasejahtera',
            ],
            [
                'tanggal' => '2026-05-18',
                'status' => Cppd::STATUS_PENYALURAN,
                'kecamatan' => 'SUKRA',
                'desa' => 'SUMURADEM',
                'jumlah' => 4400.00,
                'keterangan' => 'Penyaluran darurat dampak gelombang pasang',
            ],

            // 2025 records for multi-year filter support
            [
                'tanggal' => '2025-02-10',
                'status' => Cppd::STATUS_PENGADAAN,
                'kecamatan' => 'INDRAMAYU',
                'desa' => 'LEMAHMEKAR',
                'jumlah' => 50000.00,
                'keterangan' => 'Pengadaan stok beras CPPD APBD Murni 2025',
            ],
            [
                'tanggal' => '2025-06-20',
                'status' => Cppd::STATUS_PENYALURAN,
                'kecamatan' => 'ANJATAN',
                'desa' => 'ANJATAN UTARA',
                'jumlah' => 5000.00,
                'keterangan' => 'Bantuan banjir luapan kali Cipunagara tahun 2025',
            ],
            [
                'tanggal' => '2025-08-15',
                'status' => Cppd::STATUS_PENYALURAN,
                'kecamatan' => 'BALONGAN',
                'desa' => 'BALONGAN',
                'jumlah' => 4500.00,
                'keterangan' => 'Bantuan pangan pesisir pantai Balongan tahun 2025',
            ],
        ];

        foreach ($samples as $data) {
            $data['created_by'] = $user->id;
            Cppd::create($data);
        }
    }
}
