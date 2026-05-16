<p align="center">
  <img src="public/favicon.svg" alt="ParkIndia" width="96">
</p>

<h1 align="center">ParkIndia — Smart Parking Finder for India</h1>

<p align="center">
  <a href="https://github.com/nash87/parkhub-php/actions/workflows/ci.yml"><img src="https://github.com/nash87/parkhub-php/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="MIT License"></a>
  <a href="https://www.php.net/"><img src="https://img.shields.io/badge/PHP-8.4-777BB4.svg?style=flat-square&logo=php&logoColor=white" alt="PHP 8.4"></a>
  <a href="https://laravel.com/"><img src="https://img.shields.io/badge/Laravel-13-FF2D20.svg?style=flat-square&logo=laravel&logoColor=white" alt="Laravel 13"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB.svg?style=flat-square&logo=react&logoColor=black" alt="React 19"></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4.svg?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4"></a>
  <a href="docs/DPDP.md"><img src="https://img.shields.io/badge/DPDP-Compliant-green.svg?style=flat-square" alt="DPDP Compliant"></a>
</p>

<p align="center">
  <strong>Your Parking. Your Time. Your Convenience.</strong><br>
  The consumer-facing parking finder app customized for the Indian market.<br>
  Built with Laravel 13, React 19, Tailwind CSS 4, and Mappls (MapmyIndia). DPDP compliant by design.
</p>

---

## What is ParkIndia?

ParkIndia is a streamlined, B2C online parking space finder and booking system. We've transformed the enterprise-focused ParkHub into a public-facing platform designed specifically for Indian cities.

### Key Features
- **Mappls (MapmyIndia) Integration**: Hyper-local, highly accurate maps for India with automatic geolocation and address autosuggest.
- **Real-Time Availability**: Live color-coded parking lot markers (Green/Yellow/Red) showing exact spot counts.
- **Indian Localization**: Timezone configured for `Asia/Kolkata` (IST), pricing in INR (₹), and support for Indian address formats.
- **Indian Vehicle Validation**: Custom validation rules for all standard, commercial, and BH-series Indian license plates.
- **City-Based Search**: Instantly filter parking lots across 100+ major Indian cities and states.
- **DPDP Compliant**: Built to comply with India's Digital Personal Data Protection Act, 2023. Data residency kept locally.

---

## Quick Start

### Docker (recommended)

```bash
git clone https://github.com/nash87/parkhub-php.git parkindia && cd parkindia
cp .env.example .env                  
# Ensure VITE_MAPPLS_API_KEY is set in parkhub-web/.env
docker compose up -d
```

### Laravel Sail

```bash
git clone https://github.com/nash87/parkhub-php.git parkindia && cd parkindia
cp .env.example .env
composer install
./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate --seed --force
# Seeds 100 Indian cities and 15 live demo parking lots across Mumbai, Delhi, and Bengaluru
```

---

## Configuration

Key environment variables:

| Variable | Purpose |
|----------|---------|
| `DB_CONNECTION` | `mysql`, `sqlite`, or `pgsql` |
| `APP_TIMEZONE` | `Asia/Kolkata` |
| `VITE_MAPPLS_API_KEY` | Your Mappls Web Maps SDK API Key (required for frontend map) |

---

## Legal Compliance (DPDP)

ParkIndia is designed to align with the **Digital Personal Data Protection Act, 2023 (DPDPA)** of India.

- **Data Residency**: All data stored locally; no unauthorized cross-border data transfer.
- **Data Minimization**: Only essential data (vehicle plate, booking time) is collected.
- **User Rights**: Built-in support for users to view, correct, and erase their personal data upon request.
- **Consent**: Clear privacy policies and consent mechanisms during booking.

See [`legal/dpdp-privacy-policy-template.md`](legal/dpdp-privacy-policy-template.md) for a ready-to-use DPDP compliant privacy policy template.

---

## License

MIT -- see [LICENSE](LICENSE).

All third-party dependencies are MIT, Apache-2.0, or BSD licensed.
