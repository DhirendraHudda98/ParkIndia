<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Rules\IndianVehicleNumber;
use Illuminate\Foundation\Http\FormRequest;

class StoreVehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** Normalise plate to uppercase before validation runs. */
    protected function prepareForValidation(): void
    {
        if ($this->has('plate')) {
            $this->merge([
                'plate' => IndianVehicleNumber::normalise((string) $this->plate),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'plate'      => ['required', 'string', 'max:20', new IndianVehicleNumber()],
            'make'       => 'nullable|string|max:100',
            'model'      => 'nullable|string|max:100',
            'color'      => 'nullable|string|max:50',
            'is_default' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'plate.required' => 'Vehicle registration number is required.',
        ];
    }
}

