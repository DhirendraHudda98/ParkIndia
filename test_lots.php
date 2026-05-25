<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$request = Illuminate\Http\Request::create('/api/v1/lots', 'GET');
$response = $app->handle($request);

echo "STATUS: " . $response->getStatusCode() . "\n";
echo "CONTENT LENGTH: " . strlen($response->getContent()) . "\n";
$content = json_decode($response->getContent(), true);
echo "KEYS: " . implode(', ', array_keys($content)) . "\n";
if (isset($content['data'])) {
    echo "DATA COUNT: " . count($content['data']) . "\n";
    if (count($content['data']) > 0) {
        echo "SAMPLE DATA ITEM:\n";
        print_r($content['data'][0]);
    }
} else {
    echo "DATA FIELD NOT PRESENT IN RESPONSE!\n";
    print_r($content);
}
