<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Prediction\OccupancyPredictionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PredictionController extends Controller
{
    public function __construct(
        private readonly OccupancyPredictionService $predictionService
    ) {}

    /**
     * GET /api/v1/predictions
     * Returns occupancy trends and forecast for a specific lot or all lots.
     */
    public function index(Request $request): JsonResponse
    {
        $lotId = $request->query('lot_id');
        $report = $this->predictionService->getPredictionReport($lotId);

        return response()->json([
            'success' => true,
            'data' => $report,
            'error' => null,
        ]);
    }
}
