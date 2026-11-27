<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('realisasi_sub_kegiatans')) {
            Schema::table('realisasi_sub_kegiatans', function (Blueprint $table) {
                if (! Schema::hasColumn('realisasi_sub_kegiatans', 'jenis_anggaran')) {
                    $table->string('jenis_anggaran', 20)->default('murni')->after('tahun_anggaran')->index();
                }
            });

            Schema::table('realisasi_sub_kegiatans', function (Blueprint $table) {
                try {
                    $table->dropUnique('realisasi_sk_tahun_kode_unique');
                } catch (\Throwable) {
                    // Index sudah tidak ada
                }

                try {
                    $table->unique(
                        ['tahun_anggaran', 'jenis_anggaran', 'kode_sub_kegiatan'],
                        'realisasi_sk_tahun_jenis_kode_unique'
                    );
                } catch (\Throwable) {
                    // Index sudah ada
                }
            });
        }

        if (Schema::hasTable('realisasi_pergeserans')) {
            Schema::table('realisasi_pergeserans', function (Blueprint $table) {
                if (! Schema::hasColumn('realisasi_pergeserans', 'jenis_anggaran')) {
                    $table->string('jenis_anggaran', 20)->default('murni')->after('tahun_anggaran')->index();
                }
            });
        }

        if (! Schema::hasTable('realisasi_anggaran_locks')) {
            Schema::create('realisasi_anggaran_locks', function (Blueprint $table) {
                $table->id();
                $table->unsignedSmallInteger('tahun_anggaran')->unique();
                $table->boolean('is_murni_locked')->default(false);
                $table->timestamp('locked_at')->nullable();
                $table->string('locked_by', 120)->nullable();
                $table->timestamps();
            });
        }

        if (Schema::hasTable('npd_rekenings')) {
            Schema::table('npd_rekenings', function (Blueprint $table) {
                if (! Schema::hasColumn('npd_rekenings', 'jenis_anggaran')) {
                    $table->string('jenis_anggaran', 20)->default('murni')->after('tahun_anggaran')->index();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('npd_rekenings') && Schema::hasColumn('npd_rekenings', 'jenis_anggaran')) {
            Schema::table('npd_rekenings', function (Blueprint $table) {
                $table->dropColumn('jenis_anggaran');
            });
        }

        Schema::dropIfExists('realisasi_anggaran_locks');

        if (Schema::hasTable('realisasi_pergeserans') && Schema::hasColumn('realisasi_pergeserans', 'jenis_anggaran')) {
            Schema::table('realisasi_pergeserans', function (Blueprint $table) {
                $table->dropColumn('jenis_anggaran');
            });
        }

        if (Schema::hasTable('realisasi_sub_kegiatans') && Schema::hasColumn('realisasi_sub_kegiatans', 'jenis_anggaran')) {
            Schema::table('realisasi_sub_kegiatans', function (Blueprint $table) {
                try {
                    $table->dropUnique('realisasi_sk_tahun_jenis_kode_unique');
                } catch (\Throwable) {
                }
                $table->dropColumn('jenis_anggaran');
                try {
                    $table->unique(['tahun_anggaran', 'kode_sub_kegiatan'], 'realisasi_sk_tahun_kode_unique');
                } catch (\Throwable) {
                }
            });
        }
    }
};
