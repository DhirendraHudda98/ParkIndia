<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'message' => 'sometimes|string|max:10000',
            'severity' => 'sometimes|in:info,warning,success',
            'active' => 'sometimes|boolean',
            'starts_at' => 'sometimes|nullable|date',
            'priority' => 'sometimes|nullable|in:high,medium,low',
            'expires_at' => 'sometimes|nullable|date|after_or_equal:starts_at',
        ];
    }
}
