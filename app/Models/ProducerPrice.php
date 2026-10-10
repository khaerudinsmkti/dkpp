<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProducerPrice extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'producer_prices';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'recorded_date',
        'gkp_petani',
        'gkp_penggilingan',
        'gkg_penggilingan',
        'beras_medium_penggilingan',
        'beras_premium_penggilingan',
        'sapi_hidup',
        'notes',
        'created_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'recorded_date' => 'date:Y-m-d',
        'gkp_petani' => 'float',
        'gkp_penggilingan' => 'float',
        'gkg_penggilingan' => 'float',
        'beras_medium_penggilingan' => 'float',
        'beras_premium_penggilingan' => 'float',
        'sapi_hidup' => 'float',
    ];

    /**
     * Configuration of the 6 producer commodities.
     */
    public const COMMODITIES = [
        [
            'key' => 'gkp_petani',
            'name' => 'GKP Tingkat Petani',
            'short_name' => 'GKP Petani',
            'category' => 'Gabah',
            'unit' => 'Kg',
            'order' => 1,
            'hap' => 6000,
            'hap_label' => 'HAP Bapanas',
            'description' => 'Gabah Kering Panen di tingkat petani sawah',
        ],
        [
            'key' => 'gkp_penggilingan',
            'name' => 'GKP Tingkat Penggilingan',
            'short_name' => 'GKP Penggilingan',
            'category' => 'Gabah',
            'unit' => 'Kg',
            'order' => 2,
            'hap' => 6200,
            'hap_label' => 'HAP Bapanas',
            'description' => 'Gabah Kering Panen di tingkat usaha penggilingan padi',
        ],
        [
            'key' => 'gkg_penggilingan',
            'name' => 'GKG Tingkat Penggilingan',
            'short_name' => 'GKG Penggilingan',
            'category' => 'Gabah',
            'unit' => 'Kg',
            'order' => 3,
            'hap' => 7400,
            'hap_label' => 'HAP Bapanas',
            'description' => 'Gabah Kering Giling di tingkat usaha penggilingan padi',
        ],
        [
            'key' => 'beras_medium_penggilingan',
            'name' => 'Beras Medium Penggilingan',
            'short_name' => 'Beras Medium Giling',
            'category' => 'Beras',
            'unit' => 'Kg',
            'order' => 4,
            'hap' => 12000,
            'hap_label' => 'HAP Bapanas',
            'description' => 'Beras Medium hasil produksi di tingkat penggilingan',
        ],
        [
            'key' => 'beras_premium_penggilingan',
            'name' => 'Beras Premium Penggilingan',
            'short_name' => 'Beras Premium Giling',
            'category' => 'Beras',
            'unit' => 'Kg',
            'order' => 5,
            'hap' => 13900,
            'hap_label' => 'HAP Bapanas',
            'description' => 'Beras Premium hasil produksi di tingkat penggilingan',
        ],
        [
            'key' => 'sapi_hidup',
            'name' => 'Sapi Hidup',
            'short_name' => 'Sapi Hidup Farm Gate',
            'category' => 'Peternakan',
            'unit' => 'Kg',
            'order' => 6,
            'hap' => 56000,
            'hap_label' => 'HAP Farm Gate',
            'description' => 'Sapi potong hidup di tingkat peternak / produsen',
        ],
    ];

    /**
     * User who created/updated this record.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

