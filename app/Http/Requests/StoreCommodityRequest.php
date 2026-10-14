<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreCommodityRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255', 'unique:commodities,name'],
            'category' => ['required', 'string', 'max:100'],
            'unit' => ['required', 'string', 'max:50'],
            'order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,svg', 'max:5120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'initial_het_price' => ['nullable', 'numeric', 'min:1'],
            'initial_het_regulation' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama komoditas wajib diisi.',
            'name.unique' => 'Nama komoditas sudah terdaftar.',
            'category.required' => 'Kategori komoditas wajib diisi.',
            'unit.required' => 'Satuan ukuran komoditas wajib diisi.',
            'image.image' => 'File yang dipilih harus berupa gambar valid.',
            'image.mimes' => 'Format file gambar harus berupa JPEG, PNG, JPG, WEBP, atau SVG.',
            'image.max' => 'Ukuran file gambar maksimal 5MB.',
            'image.uploaded' => 'Gambar gagal diunggah. Ukuran file kemungkinan melebihi batas upload server (upload_max_filesize). Silakan gunakan gambar yang lebih kecil.',
        ];
    }
}
