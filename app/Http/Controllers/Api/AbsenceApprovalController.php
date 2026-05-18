<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absence;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AbsenceApprovalController extends Controller
{
    /**
     * Submit an absence request.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user instanceof User) {
            abort(401);
        }

        $validated = $request->validate([
            'absence_type' => ['required', 'string', Rule::in([
                'homeoffice',
                'vacation',
                'sick',
                'training',
                'business_trip',
                'personal',
                'other',
            ])],
            'start_date' => ['required', 'date', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'reason' => ['required', 'string', 'min:1', 'max:2000'],
        ], [
            'reason.required' => 'reason is required',
        ]);

        $absence = Absence::create([
            'user_id' => $user->id,
            'absence_type' => $validated['absence_type'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'note' => $validated['reason'],
            'source' => 'approval_request',
            'status' => Absence::STATUS_PENDING,
        ]);

        return response()->json([
            'status' => $absence->status,
            'id' => $absence->id,
        ], 201);
    }

    /**
     * Get the authenticated user's requests.
     */
    public function myRequests(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user instanceof User) {
            abort(401);
        }

        $absences = Absence::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $absences,
        ]);
    }

    /**
     * List pending absences (admin only).
     */
    public function pending(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $absences = Absence::query()
            ->where('status', Absence::STATUS_PENDING)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $absences,
        ]);
    }

    /**
     * Approve an absence request (admin only).
     */
    public function approve(Request $request, string|int $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $absence = Absence::query()->findOrFail($id);

        $validated = $request->validate([
            'comment' => ['required', 'string', 'min:1', 'max:2000'],
        ]);

        $admin = $request->user();

        $absence->update([
            'status' => Absence::STATUS_APPROVED,
            'reviewed_by' => $admin?->id,
            'reviewed_at' => now(),
            'reviewer_comment' => $validated['comment'],
        ]);

        return response()->json([
            'status' => $absence->status,
        ]);
    }

    /**
     * Reject an absence request (admin only).
     */
    public function reject(Request $request, string|int $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $absence = Absence::query()->findOrFail($id);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:1', 'max:2000'],
        ]);

        $admin = $request->user();

        $absence->update([
            'status' => Absence::STATUS_REJECTED,
            'reviewed_by' => $admin?->id,
            'reviewed_at' => now(),
            'reviewer_comment' => $validated['reason'],
        ]);

        return response()->json([
            'status' => $absence->status,
        ]);
    }

    private function ensureAdmin(Request $request): void
    {
        $user = $request->user();
        if (!$user instanceof User || !in_array((string) $user->role, ['admin', 'superadmin'], true)) {
            abort(403);
        }
    }
}

