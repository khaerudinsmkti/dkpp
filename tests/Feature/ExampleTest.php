<?php

test('returns a successful response', function () {
    $response = $this->get(route('harga-konsumen'));

    $response->assertOk();
});
