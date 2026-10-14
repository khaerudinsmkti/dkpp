<?php

use App\Http\Controllers\ConsumerPriceController;
use Illuminate\Http\Request;

test('returns a successful response', function () {
    $response = $this->get(route('harga-konsumen'));

    $response->assertOk();
});

test('chart data endpoint inspection', function () {
    config(['database.connections.mysql.database' => 'dkpp']);
    config(['database.default' => 'mysql']);

    $controller = new ConsumerPriceController;
    $req = Request::create('/api/public-chart-data', 'GET', [
        'type' => 'daily',
        'commodity_id' => 6,
        'market_id' => 1,
        'start_date' => '2026-10-01',
        'end_date' => '2026-10-09',
    ]);
    $res = $controller->chartData($req);
    dump($res->getData(true));
});
