<?php
/**
 * ParkHub (ParkIndia) - Developer PDF Documentation Compiler
 * This script bootstraps Laravel and uses Dompdf to generate a beautiful, 
 * high-fidelity technical specification PDF from the HTML source.
 */

// 1. Bootstrap the Laravel Application
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Barryvdh\DomPDF\Facade\Pdf;

echo "====================================================\n";
echo "    PARKHUB TECHNICAL SPECIFICATION PDF COMPILER   \n";
echo "====================================================\n\n";

$htmlPath = __DIR__.'/parkhub_technical_documentation.html';
$pdfPath = __DIR__.'/ParkHub_Technical_Documentation.pdf';

if (!file_exists($htmlPath)) {
    die("[-] Error: HTML source file '{$htmlPath}' not found. Make sure to generate it first.\n");
}

echo "[+] Loading HTML source content...\n";
$html = file_get_contents($htmlPath);

echo "[+] Initializing Dompdf engine...\n";
try {
    // Generate PDF style
    $pdf = Pdf::loadHTML($html);
    $pdf->setPaper('a4', 'portrait');
    
    echo "[+] Rendering page canvases and saving PDF...\n";
    $pdf->save($pdfPath);
    echo "[+] SUCCESS! Professional PDF generated successfully at:\n";
    echo "    {$pdfPath}\n\n";
    echo "====================================================\n";
} catch (\Exception $e) {
    echo "[-] Critical Exception: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}
