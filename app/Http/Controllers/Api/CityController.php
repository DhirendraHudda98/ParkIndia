<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IndianCity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CityController — public API for Indian city/state data.
 *
 * GET /api/cities           → all cities (sorted, with optional ?metro=1 filter)
 * GET /api/cities/states    → distinct state list for dropdown
 * GET /api/cities?state=MH  → cities filtered by state code
 */
class CityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = IndianCity::orderBy('sort_order')->orderBy('name');

        if ($request->boolean('metro')) {
            $query->metro();
        }

        if ($request->filled('state')) {
            $query->byState(strtoupper($request->query('state')));
        }

        $cities = $query->get(['id','name','state','state_code','latitude','longitude','is_metro']);

        return response()->json([
            'success' => true,
            'data'    => $cities,
            'count'   => $cities->count(),
        ]);
    }

    public function states(): JsonResponse
    {
        $states = IndianCity::select('state', 'state_code')
            ->distinct()
            ->orderBy('state')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $states,
        ]);
    }
}
