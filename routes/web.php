<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response('OK', 200)->header('Content-Type', 'text/plain');
});

// ── ParkIndia: Privacy Policy (served as a Blade view) ─────────────────────
Route::get('/privacy', function () {
    return view('privacy');
})->name('privacy');

// SPA fallback - serve index.html for all non-API, non-file routes
Route::get('/{any}', function () {
    $indexPath = public_path('index.html');
    if (file_exists($indexPath)) {
        return response()->file($indexPath);
    }
    return response('ParkIndia — Frontend not built yet. Run: cd parkhub-web && npm install && npm run dev', 200);
})->where('any', '^(?!api|health|sanctum|storage|privacy).*$');

