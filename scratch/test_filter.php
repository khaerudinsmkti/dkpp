<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$markets = App\Models\Market::where('is_active', true)->orderBy('order')->get();
$marketId = 1;
$selectedDate = '2026-10-09';

$prevDate = App\Models\ConsumerPrice::where('market_id', $marketId)
    ->where('recorded_date', '<', $selectedDate)
    ->max('recorded_date');

$currentPrices = App\Models\ConsumerPrice::where('market_id', $marketId)
    ->where('recorded_date', $selectedDate)
    ->get()
    ->keyBy('commodity_id');

$prevPrices = App\Models\ConsumerPrice::where('market_id', $marketId)
    ->where('recorded_date', $prevDate)
    ->get()
    ->keyBy('commodity_id');

$commodities = App\Models\Commodity::with(['hets'])->where('is_active', true)->orderBy('order')->get();

$consumerCommodities = $commodities->map(function ($c) use ($currentPrices, $prevPrices, $selectedDate) {
    $priceRecord = $currentPrices->get($c->id);
    $prevPriceRecord = $prevPrices->get($c->id);
    $applicableHet = $c->hetAt($selectedDate);

    return [
        'id' => $c->id,
        'name' => $c->name,
        'today_price' => $priceRecord ? (float) $priceRecord->price : null,
        'yesterday_price' => $prevPriceRecord ? (float) $prevPriceRecord->price : null,
        'het_price' => $applicableHet ? (float) $applicableHet->price : null,
    ];
});

echo "Selected Date: $selectedDate, Prev Date: $prevDate\n";
echo "Commodities count: " . $consumerCommodities->count() . "\n";
echo "Sample first 3: " . json_encode($consumerCommodities->take(3), JSON_PRETTY_PRINT) . "\n";

