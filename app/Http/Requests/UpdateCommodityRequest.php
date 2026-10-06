<?php

namespace App\Http\Requests;

use App\Models\Commodity;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCommodityRequest extends FormRequest
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
        $commodityId = $this->route('commodity') instanceof Commodity
            ? $this->route('commodity')->id
            : $this->route('commodity');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('commodities', 'name')->ignore($commodityId),
            ],
            'category' => ['required', 'string', 'max:100'],
            'unit' => ['required', 'string', 'max:50'],
            'order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
