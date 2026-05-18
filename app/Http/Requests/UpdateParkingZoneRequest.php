<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateParkingZoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()?->is_admin === true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'pricing_multiplier' => ['sometimes', 'required', 'numeric', 'min:0.1', 'max:10'],
            'occupancy_limit' => ['nullable', 'integer', 'min:1'],
            'status' => ['sometimes', 'required', 'string', 'in:active,inactive'],
            'parking_lot_ids' => ['nullable', 'array'],
            'parking_lot_ids.*' => ['uuid', 'exists:parking_lots,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'pricing_multiplier.min' => 'Pricing multiplier must be at least 0.1.',
            'status.in' => 'Status must be either active or inactive.',
            'parking_lot_ids.*.exists' => 'One or more parking lots do not exist.',
        ];
    }
}
