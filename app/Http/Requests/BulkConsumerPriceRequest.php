<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BulkConsumerPriceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'market_id' => ['required', 'exists:markets,id'],
            'recorded_date' => ['nullable', 'date'],
            'items' => ['required', 'array'],
            'items.*.commodity_id' => ['required', 'exists:commodities,id'],
            'items.*.recorded_date' => ['nullable', 'date'],
            'items.*.price' => ['nullable', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $items = $this->input('items', []);
            $topDate = $this->input('recorded_date');
            $dates = [];

            foreach ($items as $idx => $item) {
                $d = $item['recorded_date'] ?? $topDate;
                if (! $d) {
                    $validator->errors()->add("items.{$idx}.recorded_date", 'Tanggal pencatatan harus diisi.');
                } else {
                    $dates[$d] = true;
                }
            }

            if (count($dates) > 31) {
                $validator->errors()->add('items', 'Pencatatan data harga maksimal 31 hari (1 bulan).');
            }
        });
    }
}
