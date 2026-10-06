<?php

namespace App\Http\Controllers;

use App\Http\Requests\BulkConsumerPriceRequest;
use App\Http\Requests\StoreConsumerPriceRequest;
use App\Models\Commodity;
use App\Models\ConsumerPrice;
use App\Models\Market;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ConsumerPriceController extends Controller
{
    /**
     * Display a listing of consumer prices with HET comparison for the selected date and market.
     */
    public function index(Request $request): Response
    {
        $selectedDate = $request->query('date', now()->format('Y-m-d'));
        if (! is_string($selectedDate) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $selectedDate)) {
            $selectedDate = now()->format('Y-m-d');
        }

        $markets = Market::where('is_active', true)->orderBy('order')->get();
        $defaultMarketId = $markets->first()?->id;
        $selectedMarketId = (int) $request->query('market_id', $defaultMarketId ?? 0);

        $selectedMarket = $markets->firstWhere('id', $selectedMarketId) ?? $markets->first();

        // Eager-load HETs effective up to the selected date
        $commodities = Commodity::where('is_active', true)
            ->with(['hets' => fn ($query) => $query->where('effective_date', '<=', $selectedDate)->orderByDesc('effective_date')->orderByDesc('id')])
            ->orderBy('order')
            ->get();

        $existingPrices = ConsumerPrice::where('recorded_date', $selectedDate)
            ->where('market_id', $selectedMarket?->id)
            ->get()
            ->keyBy('commodity_id');

        $rows = $commodities->map(function (Commodity $commodity) use ($existingPrices, $selectedDate): array {
            $priceRecord = $existingPrices->get($commodity->id);
            $applicableHet = $commodity->hetAt($selectedDate);

            $currentPrice = $priceRecord ? (float) $priceRecord->price : null;
            $hetPrice = $applicableHet ? (float) $applicableHet->price : null;

            $diff = null;
            $diffPercentage = null;
            $status = 'not_recorded';

            if ($currentPrice !== null && $hetPrice !== null) {
                $diff = round($currentPrice - $hetPrice, 2);
                $diffPercentage = $hetPrice > 0 ? round(($diff / $hetPrice) * 100, 2) : 0;
                if ($diff > 0) {
                    $status = 'above';
                } elseif ($diff < 0) {
                    $status = 'below';
                } else {
                    $status = 'equal';
                }
            } elseif ($currentPrice !== null && $hetPrice === null) {
                $status = 'no_het';
            }

            return [
                'commodity_id' => $commodity->id,
                'commodity_name' => $commodity->name,
                'commodity_slug' => $commodity->slug,
                'category' => $commodity->category,
                'unit' => $commodity->unit,
                'order' => $commodity->order,
                'consumer_price_id' => $priceRecord?->id,
                'price' => $currentPrice,
                'notes' => $priceRecord?->notes,
                'applicable_het' => $applicableHet ? [
                    'id' => $applicableHet->id,
                    'price' => (float) $applicableHet->price,
                    'effective_date' => $applicableHet->effective_date->format('Y-m-d'),
                    'source_regulation' => $applicableHet->source_regulation,
                    'notes' => $applicableHet->notes,
                ] : null,
                'diff' => $diff,
                'diff_percentage' => $diffPercentage,
                'status' => $status,
            ];
        });

        // Summary statistics across all commodities
        $recordedCount = $rows->whereNotNull('price')->count();
        $aboveHetCount = $rows->where('status', 'above')->count();
        $belowHetCount = $rows->where('status', 'below')->count();
        $equalHetCount = $rows->where('status', 'equal')->count();

        // Unique categories for filtering
        $categories = $commodities->pluck('category')->unique()->values();

        // Optional filter application for displayed items
        $search = (string) $request->query('search', '');
        $categoryFilter = (string) $request->query('category', '');
        $statusFilter = (string) $request->query('status', 'all');

        $filteredRows = $rows->filter(function (array $item) use ($search, $categoryFilter, $statusFilter): bool {
            if ($search !== '' && ! str_contains(strtolower($item['commodity_name']), strtolower($search))) {
                return false;
            }
            if ($categoryFilter !== '' && $item['category'] !== $categoryFilter) {
                return false;
            }
            if ($statusFilter === 'above' && $item['status'] !== 'above') {
                return false;
            }
            if ($statusFilter === 'below' && $item['status'] !== 'below') {
                return false;
            }
            if ($statusFilter === 'equal' && $item['status'] !== 'equal') {
                return false;
            }
            if ($statusFilter === 'not_recorded' && $item['status'] !== 'not_recorded') {
                return false;
            }

            return true;
        })->values();

        return Inertia::render('consumer-prices/index', [
            'items' => $filteredRows,
            'allItemsForBulk' => $rows,
            'markets' => $markets,
            'selectedMarket' => $selectedMarket,
            'selectedDate' => $selectedDate,
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'category' => $categoryFilter,
                'status' => $statusFilter,
                'date' => $selectedDate,
                'market_id' => $selectedMarket?->id,
            ],
            'statistics' => [
                'total_commodities' => $commodities->count(),
                'recorded_count' => $recordedCount,
                'above_het_count' => $aboveHetCount,
                'below_het_count' => $belowHetCount,
                'equal_het_count' => $equalHetCount,
            ],
        ]);
    }

    /**
     * Store or update a single commodity price record.
     */
    public function store(StoreConsumerPriceRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        ConsumerPrice::updateOrCreate(
            [
                'commodity_id' => $validated['commodity_id'],
                'market_id' => $validated['market_id'],
                'recorded_date' => $validated['recorded_date'],
            ],
            [
                'price' => $validated['price'],
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()?->id,
            ]
        );

        return back()->with('success', 'Harga konsumen berhasil disimpan.');
    }

    /**
     * Bulk store or update consumer prices for a given date and market.
     */
    public function bulkStore(BulkConsumerPriceRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $marketId = $validated['market_id'];
        $recordedDate = $validated['recorded_date'];
        $userId = $request->user()?->id;

        DB::transaction(function () use ($validated, $marketId, $recordedDate, $userId): void {
            foreach ($validated['items'] as $item) {
                if (isset($item['price']) && $item['price'] !== null && $item['price'] !== '') {
                    ConsumerPrice::updateOrCreate(
                        [
                            'commodity_id' => $item['commodity_id'],
                            'market_id' => $marketId,
                            'recorded_date' => $recordedDate,
                        ],
                        [
                            'price' => $item['price'],
                            'notes' => $item['notes'] ?? null,
                            'created_by' => $userId,
                        ]
                    );
                }
            }
        });

        return back()->with('success', 'Semua data harga konsumen berhasil diperbarui.');
    }

    /**
     * Remove the specified consumer price record.
     */
    public function destroy(ConsumerPrice $consumerPrice): RedirectResponse
    {
        $consumerPrice->delete();

        return back()->with('success', 'Data harga konsumen berhasil dihapus.');
    }
}
