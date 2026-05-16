<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice {{ $invoiceNo }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #333;
            line-height: 1.5;
            padding: 30px;
        }
        .invoice-header {
            border-bottom: 2px solid #f3f4f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .invoice-header h1 {
            margin: 0;
            color: #1f2937;
            font-size: 24px;
        }
        .invoice-header .meta {
            text-align: right;
            float: right;
        }
        .invoice-header .company {
            float: left;
        }
        .clearfix {
            clear: both;
        }
        .parties {
            margin-bottom: 40px;
        }
        .party {
            width: 48%;
            float: left;
        }
        .party h3 {
            font-size: 12px;
            text-transform: uppercase;
            color: #9ca3af;
            margin-bottom: 10px;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .details-table th {
            background: #f9fafb;
            text-align: left;
            padding: 12px;
            font-size: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        .details-table td {
            padding: 12px;
            border-bottom: 1px solid #f3f4f6;
        }
        .totals {
            float: right;
            width: 250px;
        }
        .totals table {
            width: 100%;
        }
        .totals td {
            padding: 8px 0;
        }
        .totals .grand-total {
            font-weight: bold;
            font-size: 18px;
            border-top: 2px solid #e5e7eb;
            padding-top: 10px;
        }
        .footer {
            margin-top: 100px;
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            background: #d1fae5;
            color: #065f46;
        }
    </style>
</head>
<body>
    <div class="invoice-header">
        <div class="company">
            <h1>{{ $company }}</h1>
            <p>{{ $street }}<br>{{ $zipCity }}<br>{{ $email }}</p>
        </div>
        <div class="meta">
            <p><strong>Invoice #:</strong> {{ $invoiceNo }}<br>
            <strong>Date:</strong> {{ $dateNow }}<br>
            <span class="badge">PAID</span></p>
        </div>
        <div class="clearfix"></div>
    </div>

    <div class="parties">
        <div class="party">
            <h3>Billed From</h3>
            <p><strong>{{ $company }}</strong><br>
            VAT ID: {{ $vatId ?: 'N/A' }}</p>
        </div>
        <div class="party" style="text-align: right;">
            <h3>Billed To</h3>
            <p><strong>{{ $user->name }}</strong><br>
            {{ $user->email }}<br>
            {{ $user->username }}</p>
        </div>
        <div class="clearfix"></div>
    </div>

    <table class="details-table">
        <thead>
            <tr>
                <th>Description</th>
                <th>Slot</th>
                <th>Duration</th>
                <th style="text-align: right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <strong>Parking Booking</strong><br>
                    <span style="color: #6b7280; font-size: 11px;">
                        {{ $booking->lot_name }}<br>
                        {{ $startFmt }} to {{ $endFmt }}
                    </span>
                </td>
                <td>{{ $booking->slot_number }}</td>
                <td>{{ number_format($hours, 1) }} hrs</td>
                <td>{{ number_format((float) $booking->base_price, 2) }} {{ $currency }}</td>
            </tr>
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td>Subtotal</td>
                <td style="text-align: right;">{{ number_format((float) $booking->base_price, 2) }} {{ $currency }}</td>
            </tr>
            <tr>
                <td>{{ $vatLabel }}</td>
                <td style="text-align: right;">{{ number_format((float) $booking->tax_amount, 2) }} {{ $currency }}</td>
            </tr>
            <tr class="grand-total">
                <td>Total</td>
                <td style="text-align: right;">{{ number_format((float) $booking->total_price, 2) }} {{ $currency }}</td>
            </tr>
        </table>
    </div>
    <div class="clearfix"></div>

    <div class="footer">
        <p>Thank you for choosing {{ $company }}.<br>
        This is a computer generated invoice and does not require a physical signature.</p>
    </div>
</body>
</html>
