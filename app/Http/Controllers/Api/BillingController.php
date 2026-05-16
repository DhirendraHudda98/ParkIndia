<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AllocateBillingRequest;
use App\Models\Booking;
use App\Models\User;
use App\Support\TenantScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BillingController extends Controller
{
    /**
     * GET /api/v1/admin/billing/by-cost-center
     */
    public function byCostCenter(): JsonResponse
    {
        $tenantId = TenantScope::currentId();

        $rows = Booking::query()
            ->when($tenantId !== null, fn ($q) => $q->where('bookings.tenant_id', $tenantId))
            ->join('users', 'bookings.user_id', '=', 'users.id')
            ->selectRaw('
                users.cost_center,
                users.department,
                COUNT(bookings.id) as total_bookings,
                COALESCE(SUM(bookings.total_price), 0) as total_amount,
                COUNT(DISTINCT users.id) as user_count,
                bookings.currency
            ')
            ->groupBy('users.cost_center', 'users.department', 'bookings.currency')
            ->orderBy('users.cost_center')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rows
        ]);
    }

    /**
     * GET /api/v1/admin/billing/by-department
     */
    public function byDepartment(): JsonResponse
    {
        $tenantId = TenantScope::currentId();

        $rows = Booking::query()
            ->when($tenantId !== null, fn ($q) => $q->where('bookings.tenant_id', $tenantId))
            ->join('users', 'bookings.user_id', '=', 'users.id')
            ->selectRaw('
                users.department,
                COUNT(bookings.id) as total_bookings,
                COALESCE(SUM(bookings.total_price), 0) as total_amount,
                COUNT(DISTINCT users.id) as user_count,
                bookings.currency
            ')
            ->groupBy('users.department', 'bookings.currency')
            ->orderBy('users.department')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rows
        ]);
    }

    /**
     * GET /api/v1/admin/billing/export
     */
    public function export(): StreamedResponse
    {
        $tenantId = TenantScope::currentId();

        $query = Booking::query()
            ->when($tenantId !== null, fn ($q) => $q->where('bookings.tenant_id', $tenantId))
            ->join('users', 'bookings.user_id', '=', 'users.id')
            ->selectRaw('
                users.cost_center,
                users.department,
                users.name as user_name,
                bookings.lot_name,
                bookings.slot_number,
                bookings.start_time,
                bookings.end_time,
                bookings.total_price,
                bookings.currency,
                bookings.status
            ')
            ->orderBy('bookings.start_time', 'desc');

        return response()->streamDownload(function () use ($query) {
            $output = fopen('php://output', 'w');
            fputcsv($output, ['Cost Center', 'Department', 'User', 'Lot', 'Slot', 'Start', 'End', 'Amount', 'Currency', 'Status']);

            foreach ($query->cursor() as $row) {
                fputcsv($output, [
                    $row->cost_center ?? 'N/A',
                    $row->department ?? 'N/A',
                    $row->user_name,
                    $row->lot_name,
                    $row->slot_number,
                    $row->start_time,
                    $row->end_time,
                    $row->total_price,
                    $row->currency,
                    $row->status
                ]);
            }

            fclose($output);
        }, 'billing-export.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * POST /api/v1/admin/billing/allocate
     */
    public function allocate(AllocateBillingRequest $request): JsonResponse
    {
        $updated = User::whereIn('id', $request->user_ids)
            ->update([
                'cost_center' => $request->cost_center,
                'department' => $request->department,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'updated' => $updated
            ]
        ]);
    }
}
