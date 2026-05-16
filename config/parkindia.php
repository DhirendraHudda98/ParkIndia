<?php
return [
    'mappls_api_key' => env('MAPPLS_API_KEY', ''),
    'default_city' => env('DEFAULT_CITY', 'Mumbai'),
    'default_lat'  => (float) env('DEFAULT_LAT', 19.0760),
    'default_lng'  => (float) env('DEFAULT_LNG', 72.8777),
    'availability_cache_minutes' => (int) env('PARKING_AVAILABILITY_CACHE_MINUTES', 10),
    'data_residency' => env('DATA_RESIDENCY', 'india'),
    'currency'        => 'INR',
    'currency_symbol' => '₹',
    'availability_refresh_seconds' => 30,
];
