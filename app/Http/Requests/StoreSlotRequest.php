<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSlotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slot_number' => [
                'required',
                'string',
                'max:20',
                \Illuminate\Validation\Rule::unique('parking_slots', 'slot_number')->where(function ($query) {
                    return $query->where('lot_id', $this->route('lotId'));
                }),
            ],
            'slot_type' => 'nullable|string|in:standard,ev,ev_charger,premium,accessible',
            'status' => 'nullable|string|in:available,occupied,maintenance',
            'is_accessible' => 'nullable|boolean',
            'reserved_for_department' => 'nullable|string|max:100',
            'zone_id' => 'nullable|uuid|exists:zones,id',
            'features' => 'nullable|array',
        ];
    }
}
