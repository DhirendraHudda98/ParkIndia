<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVehicleRequest;
use App\Http\Requests\UpdateVehicleRequest;
use App\Http\Requests\UploadVehiclePhotoRequest;
use App\Http\Resources\VehicleResource;
use App\Models\Vehicle;
use App\Services\Vehicle\VehicleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class VehicleController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return VehicleResource::collection(Vehicle::where('user_id', $request->user()->id)->get());
    }

    public function store(StoreVehicleRequest $request, VehicleService $service)
    {
        $data = $request->only(['plate', 'make', 'model', 'color', 'is_default']);
        
        if ($request->hasFile('image')) {
            $data['image'] = $this->handleImageUpload($request->file('image'));
        }

        $vehicle = $service->create($data, $request->user());

        return VehicleResource::make($vehicle)->response()->setStatusCode(201);
    }

    public function update(UpdateVehicleRequest $request, VehicleService $service, string $id)
    {
        $vehicle = Vehicle::where('user_id', $request->user()->id)->findOrFail($id);
        $data = $request->only(['plate', 'make', 'model', 'color', 'is_default']);

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($vehicle->image) {
                Storage::disk('public')->delete('vehicles/' . $vehicle->image);
            }
            $data['image'] = $this->handleImageUpload($request->file('image'));
        }

        $service->update($vehicle, $data);

        return VehicleResource::make($vehicle);
    }

    private function handleImageUpload($file): string
    {
        $filename = uniqid() . '.' . $file->getClientOriginalExtension();
        $imageData = file_get_contents($file->getRealPath());
        
        // Resize to 800px max only if GD is available
        if (function_exists('imagecreatefromstring')) {
            $imageData = $this->resizeImage($imageData, 800);
        }
        
        Storage::disk('public')->put('vehicles/' . $filename, $imageData);
        
        return $filename;
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $vehicle = Vehicle::where('user_id', $request->user()->id)->findOrFail($id);

        // Remove photo if present
        if ($vehicle->photo_url) {
            Storage::disk('local')->delete("vehicles/{$vehicle->id}.jpg");
        }

        $vehicle->delete();

        return response()->json(['message' => 'Deleted']);
    }

    public function uploadPhoto(UploadVehiclePhotoRequest $request, string $id): JsonResponse
    {
        $vehicle = Vehicle::where('user_id', $request->user()->id)->findOrFail($id);

        if ($request->hasFile('photo')) {
            $imageData = file_get_contents($request->file('photo')->getRealPath());
        } else {
            $base64 = $request->photo_base64;
            // Strip data URL prefix if present (e.g. "data:image/jpeg;base64,...")
            if (str_contains($base64, ',')) {
                $base64 = explode(',', $base64, 2)[1];
            }
            $imageData = base64_decode($base64);
            if ($imageData === false) {
                return response()->json(['error' => 'INVALID_IMAGE', 'message' => 'Invalid base64 data'], 422);
            }
        }

        // Validate image content via GD if available
        if (function_exists('imagecreatefromstring')) {
            $src = @imagecreatefromstring($imageData);
            if ($src === false) {
                return response()->json(['error' => 'INVALID_IMAGE', 'message' => 'File is not a valid image'], 422);
            }
            imagedestroy($src);
        }

        // Resize using GD to max 800px if available
        if (function_exists('imagecreatefromstring')) {
            $imageData = $this->resizeImage($imageData, 800);
        }

        $dir = storage_path('app/vehicles');
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        file_put_contents("{$dir}/{$vehicle->id}.jpg", $imageData);

        $photoUrl = "/api/v1/vehicles/{$vehicle->id}/photo";
        $vehicle->update(['photo_url' => $photoUrl]);

        return response()->json(['success' => true, 'data' => ['photo_url' => $photoUrl]]);
    }

    public function servePhoto(Request $request, string $id)
    {
        // Verify ownership before serving — prevents IDOR where any authenticated
        // user could enumerate and download other users' vehicle photos by UUID.
        $vehicle = Vehicle::where('user_id', $request->user()->id)->find($id);
        if (! $vehicle) {
            return response()->json(['error' => 'Photo not found'], 404);
        }

        $path = storage_path("app/vehicles/{$id}.jpg");

        if (! file_exists($path)) {
            return response()->json(['error' => 'Photo not found'], 404);
        }

        return response()->file($path, ['Content-Type' => 'image/jpeg']);
    }

    private function resizeImage(string $data, int $maxPx): string
    {
        if (!function_exists('imagecreatefromstring')) {
            return $data;
        }

        $src = @imagecreatefromstring($data);
        if (! $src) {
            return $data; // can't decode — return as-is
        }

        $w = imagesx($src);
        $h = imagesy($src);

        if ($w <= $maxPx && $h <= $maxPx) {
            // Already small enough — just re-encode as JPEG
            ob_start();
            imagejpeg($src, null, 85);
            $out = ob_get_clean();
            imagedestroy($src);

            return $out;
        }

        if ($w >= $h) {
            $newW = $maxPx;
            $newH = (int) round($h * ($maxPx / $w));
        } else {
            $newH = $maxPx;
            $newW = (int) round($w * ($maxPx / $h));
        }

        $dst = imagecreatetruecolor($newW, $newH);
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $w, $h);

        ob_start();
        imagejpeg($dst, null, 85);
        $out = ob_get_clean();

        imagedestroy($src);
        imagedestroy($dst);

        return $out;
    }

}
