<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'message' => 'required|string|max:10000',
            'severity' => 'required|in:info,warning,success',
            'starts_at' => 'nullable|date',
            'priority' => 'nullable|in:high,medium,low',
            'expires_at' => 'nullable|date|after_or_equal:starts_at',
        ];
    }
}
