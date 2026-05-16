<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulkExportInvoicesRequest;
use App\Models\Booking;
use App\Models\Setting;
use App\Services\Compliance\InvoiceNumberService;
use App\Services\Tax\ResolvedRate;
use App\Services\Tax\TaxProfileRegistry;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Generates PDF invoices for bookings.
 */
class BookingInvoiceController extends Controller
{
    private InvoiceNumberService $invoiceNumbers;

    public function __construct(InvoiceNumberService $invoiceNumbers)
    {
        $this->invoiceNumbers = $invoiceNumbers;
    }

    public function show(Request $request, string $id)
    {
        try {
            $user = $request->user();
            $booking = Booking::where('id', $id)
                ->where('user_id', $user->id)
                ->firstOrFail();

            $data = $this->buildInvoiceData($booking, $user);

            // If format=pdf is requested
            if ($request->input('format') === 'pdf' || str_contains($request->header('Accept', ''), 'application/pdf')) {
                return $this->renderPdf($data);
            }

            // Return HTML view for preview
            return view('pdf.invoice', $data);
        } catch (\Exception $e) {
            Log::error('Invoice generation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => ['code' => 'INVOICE_FAILED', 'message' => 'Failed to generate invoice. ' . $e->getMessage()]
            ], 500);
        }
    }

    public function pdf(Request $request, string $id)
    {
        try {
            $user = $request->user();
            $booking = Booking::where('id', $id)
                ->where('user_id', $user->id)
                ->firstOrFail();

            return $this->renderPdf($this->buildInvoiceData($booking, $user));
        } catch (\Exception $e) {
            Log::error('PDF generation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => ['code' => 'PDF_FAILED', 'message' => 'Failed to generate PDF.']
            ], 500);
        }
    }

    public function bulkExport(BulkExportInvoicesRequest $request)
    {
        $bookings = Booking::whereIn('id', $request->booking_ids)->get();

        if ($bookings->isEmpty()) {
            return response()->json(['error' => 'NO_BOOKINGS_FOUND', 'message' => 'No bookings found for given IDs'], 404);
        }

        try {
            $htmlPages = [];
            foreach ($bookings as $booking) {
                $user = $booking->user;
                if (!$user) continue;
                $data = $this->buildInvoiceData($booking, $user);
                $htmlPages[] = view('pdf.invoice', $data)->render();
            }

            $combinedHtml = implode('<div style="page-break-after: always;"></div>', $htmlPages);
            $pdf = Pdf::loadHTML($combinedHtml)->setPaper('a4');

            return $pdf->download('invoices-bulk-' . date('Y-m-d') . '.pdf');
        } catch (\Exception $e) {
            return response()->json(['error' => 'BULK_EXPORT_FAILED', 'message' => $e->getMessage()], 500);
        }
    }

    private function buildInvoiceData(Booking $booking, $user): array
    {
        $company = Setting::get('company_name', 'ParkHub');
        $vatId = Setting::get('impressum_vat_id', '');
        $street = Setting::get('impressum_street', '');
        $zipCity = Setting::get('impressum_zip_city', '');
        $email = Setting::get('impressum_email', '');

        $start = $booking->start_time?->timestamp ?? 0;
        $end = $booking->end_time?->timestamp ?? ($start + 3600);
        $hours = max(0.5, round(($end - $start) / 3600, 2));

        $startFmt = $booking->start_time?->format('d.m.Y H:i') ?? '-';
        $endFmt = $booking->end_time?->format('d.m.Y H:i') ?? '-';
        $dateNow = date('d.m.Y');

        $year = $booking->created_at ? (int)$booking->created_at->format('Y') : (int)date('Y');
        $invoiceNo = $this->invoiceNumbers->getOrAssign((string)$booking->id, $year);
        $shortId = str_replace('-', '', $invoiceNo);

        $sellerCountry = TaxProfileRegistry::resolveSellerCountryFromSettings();
        $buyerVatId = trim((string)Setting::get('user_vat_id_' . $user->id, ''));
        $buyerCountry = trim((string)Setting::get(
            'user_country_' . $user->id,
            (string)Setting::get('tax_default_country', $sellerCountry)
        ));
        
        $resolvedRate = TaxProfileRegistry::resolveRate(
            $sellerCountry,
            $buyerCountry,
            $buyerVatId !== '' ? $buyerVatId : null
        );
        
        $vatLabel = $this->formatVatLabel($resolvedRate);
        $reverseChargeNote = $resolvedRate->isReverseCharge() ? TaxProfileRegistry::REVERSE_CHARGE_NOTE : null;
        $currency = config('parkindia.currency', 'INR');

        return compact(
            'company', 'vatId', 'street', 'zipCity', 'email',
            'booking', 'user', 'hours', 'startFmt', 'endFmt',
            'dateNow', 'invoiceNo', 'shortId',
            'vatLabel', 'reverseChargeNote', 'currency'
        );
    }

    private function formatVatLabel(ResolvedRate $rate): string
    {
        if ($rate->isReverseCharge()) {
            return 'VAT 0% (Reverse Charge)';
        }

        $pct = $rate->asRate() * 100.0;
        return sprintf('VAT %g%%', $pct);
    }

    private function renderPdf(array $d)
    {
        $pdf = Pdf::loadView('pdf.invoice', $d)->setPaper('a4');
        return $pdf->download("invoice-{$d['shortId']}.pdf");
    }
}
