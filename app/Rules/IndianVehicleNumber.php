<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * IndianVehicleNumber
 *
 * Validates Indian motor vehicle registration numbers in two formats:
 *
 *  NEW FORMAT (post-1989 BH series included):
 *    ┌─────────────────────────────────────────────────────────────────────────┐
 *    │  State Code (2 letters)  District (2 digits)  Series (1-2 letters)     │
 *    │  Running Number (1-4 digits)                                            │
 *    │  Examples: MH12AB1234, KA01CD5678, DL3CAB1234, TN09X1234               │
 *    └─────────────────────────────────────────────────────────────────────────┘
 *
 *  BH (Bharat) SERIES (central govt employees, 2021 onwards):
 *    ┌─────────────────────────────────────────────────────────────────────────┐
 *    │  YY BH #### [A-Z]{1,2}                                                  │
 *    │  Example: 22BH0001AA, 23BH1234A                                         │
 *    └─────────────────────────────────────────────────────────────────────────┘
 *
 *  COMMERCIAL (old format, still valid):
 *    State + District + C/T/V + number:  HR26C5678
 */
class IndianVehicleNumber implements ValidationRule
{
    /**
     * Standard Indian state/UT codes (as per MoRTH).
     *
     * @var array<int, string>
     */
    private const STATE_CODES = [
        'AN', 'AP', 'AR', 'AS', 'BR', 'CG', 'CH', 'DD', 'DL',
        'DN', 'GA', 'GJ', 'HP', 'HR', 'JH', 'JK', 'KA', 'KL',
        'LA', 'LD', 'MH', 'ML', 'MN', 'MP', 'MZ', 'NL', 'OD',
        'PB', 'PY', 'RJ', 'SK', 'TG', 'TN', 'TR', 'TS', 'UK',
        'UP', 'WB',
    ];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $plate = strtoupper(trim((string) $value));

        // Strip all spaces/hyphens for normalised comparison
        $normalised = preg_replace('/[\s\-]+/', '', $plate) ?? '';

        if (! $this->isValid($normalised)) {
            $fail('The :attribute must be a valid Indian vehicle number (e.g. MH12AB1234 or 22BH0001AA).');
        }
    }

    private function isValid(string $plate): bool
    {
        // BH series: 22BH1234A or 22BH1234AB
        if (preg_match('/^\d{2}BH\d{4}[A-Z]{1,2}$/', $plate)) {
            return true;
        }

        // Standard format: STATE(2) + DISTRICT(2) + SERIES(1-3) + NUMBER(1-4)
        // e.g. MH12AB1234, KA01C5678, DL3CAB1234
        if (preg_match('/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$/', $plate, $m)) {
            $stateCode = $m[1];
            return in_array($stateCode, self::STATE_CODES, true);
        }

        return false;
    }

    /**
     * Normalise a plate string: uppercase + remove spaces/hyphens.
     * Useful for storing canonical form before validation.
     */
    public static function normalise(string $plate): string
    {
        return strtoupper(preg_replace('/[\s\-]+/', '', $plate) ?? '');
    }
}
