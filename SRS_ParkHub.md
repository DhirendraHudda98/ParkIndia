ParkHub – Smart Parking Management System
Software Requirements Specification (SRS)

Internal Project Document

Note: This SRS is prepared for an internal project and documentation purpose. It is not a client-delivered specification.

1. Introduction

1.1 Purpose
This Software Requirements Specification (SRS) documents the implemented functionality, interfaces, constraints, and non-functional requirements for ParkHub – Smart Parking Management System. It is based on the actual Laravel backend repository (controllers, models, routes, migrations, jobs, resources, and views) and is intended for developers, testers, maintainers, reviewers, and other stakeholders involved in the internal project.

1.2 Scope
ParkHub is a self-hosted parking management backend implemented in Laravel (Laravel 11, PHP ^8.2) with a relational database. The system exposes RESTful APIs to support the complete parking workflow, including:
- Booking lifecycle (create, list, show, update, cancel, quick-book, recurring bookings)
- Parking lot and slot management (create lots, auto-generate slots, slot features, occupancy)
- Check-in / check-out and extensions
- Waitlist flows (subscribe, accept/decline offers, leave)
- Wallet / credits (balance, transactions, add credits, refunds on cancel)
- Vehicle management and photos
- Notifications, webhooks, email jobs and realtime broadcasts (SSE / broadcast events)
- Admin analytics, reports, settings and audit logs
- Public availability and city listing endpoints
The primary consumer is an external frontend (parkhub-web). A few server-side Blade views exist for check-in and invoice PDF generation.
This document describes the internal system behavior rather than a client-specific deliverable.

1.3 Definitions, Acronyms, Abbreviations
- API: Application Programming Interface
- SSE: Server-Sent Events
- CRUD: Create, Read, Update, Delete
- DFD: Data Flow Diagram
- GDPR: General Data Protection Regulation
- CO2: Carbon Dioxide

1.4 References
- `composer.json` (framework & package requirements)
- `routes/api.php` (API surface)
- `app/Models/*` (domain models: Booking, ParkingLot, ParkingSlot, User, WaitlistEntry, CreditTransaction, etc.)
- `app/Http/Controllers/Api/*` (BookingController, LotController, SlotController, WalletController, WaitlistController, BookingCheckInController, etc.)
- `database/migrations/*` (schema and feature migrations)
- `resources/views/*` (invoice, checkin, privacy)

1.5 Overview
This SRS documents system context, implemented features, external interfaces, functional requirements per feature, non-functional requirements, design constraints and a textual DFD describing the data and event flows.

2. General Description

2.1 Product Perspective
ParkHub is the backend API layer of a parking management platform. It is multi-tenant aware, exposes a REST API for frontends and third-party clients, and relies on background workers for email/webhook delivery and scheduled jobs.

2.2 Product Functions (implemented)
- Booking CRUD + quick-book + recurring bookings
- Check-in / check-out / extend
- Parking lot CRUD, slot CRUD, auto-slot generation, occupancy reporting
- Waitlist (join, leave, subscribe, accept, decline, position estimation)
- Wallet / credits: balance, transactions, manual top-up, refunds on cancellation
- Vehicle CRUD and vehicle photo upload/serve
- Notifications (DB rows), email jobs (confirmation, reminders), webhook dispatch
- SSE / broadcast events for real-time updates (BookingCreated, BookingCancelled, BookingCheckedIn)
- Admin analytics, reports, audit logs, announcements and settings management
- Public endpoints: availability, city lists, health checks

2.3 User Characteristics
- Admin: Role `admin` or `superadmin`. Manages lots, slots, users, settings, exports, and admin-only booking operations. Uses authenticated admin endpoints.
- User: Authenticated application user. Can manage bookings, vehicles, wallet, waitlist entries, and perform check-in/check-out.

2.4 General Constraints
- Framework: Laravel 11, PHP >= 8.2 (see `composer.json`)
- Database: MySQL/Postgres/SQLite supported via Laravel migrations
- Auth: Laravel Sanctum sessions and token-based auth required for protected endpoints
- Background jobs: Required for email/webhook delivery and scheduled maintenance
- Broadcasting: Requires configured broadcast driver (SSE or WebSocket) for real-time channels

2.5 Assumptions and Dependencies
- The frontend (parkhub-web) consumes the API and implements the UI
- A queue worker (Redis/Database) and scheduler (cron) are running in production
- Mail driver and optional payment gateway configured via environment
- Third-party broadcast driver (Pusher, Redis, etc.) or SSE is available for realtime delivery

3. Specific Requirements

3.1 External Interface Requirements

3.1.1 User Interfaces
- Primary UI: external frontend `parkhub-web` that consumes the JSON API.
- Server-rendered pages (minimal): `resources/views/checkin.blade.php` (kiosk check-in), `resources/views/pdf/invoice.blade.php` (PDF invoice), `resources/views/privacy.blade.php`.
- API responses: JSON envelopes (success/data/error/meta) for most endpoints; some legacy endpoints return `{error, message}` on 409 conflicts.

3.1.2 Hardware Interfaces
- Incoming webhooks: `POST /api/webhooks/hardware/anpr` (ANPR cameras / barrier hardware)
- QR codes: server generates QR code SVGs to be scanned by kiosks or mobile devices.

3.1.3 Software Interfaces
- Database: relational DB (tables created via `database/migrations`) with models: users, bookings, parking_lots, parking_slots, waitlist_entries, credit_transactions, notifications, webhooks, stripe_events, etc.
- Broadcast/events: Laravel broadcasting (private channels) and SSE push cache used by `SseController` and event classes like `BookingCreated`.
- Queue jobs: `SendWebhookJob`, `SendBookingConfirmationJob`, `SendBookingReminderJob`, and scheduled purge jobs.
- Libraries: `chillerlan/php-qrcode`, `barryvdh/laravel-dompdf`, `minishlink/web-push`, `pragmarx/google2fa-laravel`.

3.1.4 Communications Interfaces
- API transport: HTTPS recommended (TLS)
- Auth: Laravel Sanctum (`auth:sanctum`) and StartSession middleware for protected routes
- Rate limiting: throttle middleware applied for public and auth routes (configured in routes)
- Outgoing webhooks: queued HTTP POSTs to subscriber URLs

3.2 Functional Requirements

3.2.1 Booking System (Core CRUD)
- Introduction: Full booking lifecycle implemented using `app/Models/Booking` and `app/Http/Controllers/Api/BookingController` with `BookingCreationService` handling creation logic.
- Inputs:
  - Create: authenticated user + `lot_id` and `slot_id` or auto-pick, `start_time`, `end_time`, `vehicle_plate`, `booking_type`, recurrence optionally.
  - List: `status`, `from_date`, `to_date`, `per_page`.
  - Update: `notes`, `vehicle_plate`, `start_time`, `end_time`, `slot_id`.
  - Cancel: booking id in route (DELETE /api/bookings/{id}).
- Processing:
  - Creation locks slot rows, checks availability, computes pricing, deducts credits when configured, creates booking record, dispatches events and notifications.
  - Listing returns paginated BookingResource collection.
  - Update validates allowed statuses and times, checks operating hours, checks slot conflicts, updates booking and logs audit entries.
  - Cancel sets `status` to `cancelled`, refunds credits conditionally, notifies waitlist, dispatches webhook jobs and events.
- Outputs: JSON BookingResource (201 on create), paginated lists, 200/204 messages on successful cancel/update.
- Error Handling:
  - 409 for slot unavailable / conflicts with legacy `{error, message}` shape.
  - 422 validation errors with `VALIDATION_ERROR` payload.
  - 404 when booking not found.
  - 400 for invalid time/status operations.

3.2.2 Quick Book
- Introduction: `POST /api/bookings/quick` allows immediate booking via `slot_id` or `lot_id` with auto-pick.
- Inputs: `slot_id` or `lot_id`, optional `date`, optional `license_plate`.
- Processing: lock target slot, check conflicts within date, create booking from now until end-of-day (or date end) with `confirmed` status.
- Outputs: BookingResource on success.
- Error Handling: 409 with `SLOT_UNAVAILABLE` or `NO_SLOTS` if conflicts or not found; 422 when request invalid.

3.2.3 Recurring Bookings
- Introduction: CRUD endpoints for recurring bookings (stored with recurrence JSON).
- Inputs: recurrence rules and linked lot/slot info.
- Processing: persist RecurringBooking; creation service may expand recurrence into bookings when scheduled.
- Outputs: RecurringBooking resources.
- Error Handling: 422 validation, 404 not found.

3.2.4 Check-in / Check-out / Extend
- Introduction: `BookingCheckInController` supports check-in, direct check-in, checkout, and extend.
- Inputs: booking id (or no id for direct checkin), `new_end_time` (extend).
- Processing:
  - Check-in: enforce status and time window rules (15 minutes early allowed), set `checked_in_at` and status `active`.
  - Checkout: set status `completed`.
  - Extend: check conflicts via lockForUpdate and update `end_time`.
- Outputs: BookingResource on success.
- Error Handling: 400 for too early / expired / already checked-in; 409 for conflict on extend.

3.2.5 Waitlist Management
- Introduction: Waitlist features allow users to join per-lot queues and accept temporary offers.
- Inputs: `lot_id`, `priority` (optional), `entryId` for accept/decline.
- Processing: create firstOrCreate waitlist entries, notify top N users on availability, accept creates a booking and marks slot occupied, decline moves offer to next user.
- Outputs: WaitlistEntry resources, position and estimated wait for requesting user.
- Error Handling: 403 when waitlist disabled; 409 already on waitlist; 410 offer expired; 409 no slots at accept.

3.2.6 Wallet / Credits
- Introduction: `WalletController` exposes balance, paginated transaction history, and manual add credits.
- Inputs: `amount` for add (integer, 1..10000).
- Processing: DB transaction with row lock to increment `credits_balance` and create `CreditTransaction`; cancellations may refund credits when `credits_enabled` setting is true.
- Outputs: JSON with `balance` / `new_balance` and transaction list pages.
- Error Handling: 422 for invalid amount.

3.2.7 Parking Lot & Slot Management
- Introduction: Lot and Slot controllers manage lots and slots; lot creation auto-generates slots when `total_slots` provided.
- Inputs: lot fields (`name`, `address`, `total_slots`, `layout`, `rates`, `operating_hours`), slot fields (`slot_number`, `status`, `slot_type`, `features`, `zone_id`).
- Processing: auto-insert slots on lot creation; occupancy and available slot calculations use single aggregated queries for efficiency; generate QR codes locally.
- Outputs: ParkingLotResource, ParkingSlotResource, occupancy JSON.
- Error Handling: 403 for admin-restricted actions; 404 not found.

3.2.8 Vehicles Management
- Introduction: CRUD endpoints for vehicles, uploading and serving vehicle photos.
- Inputs: vehicle attributes and photo uploads.
- Processing: store vehicle records linked to user; store file assets and provide serve endpoints.
- Outputs: vehicle resources and photo endpoints.
- Error Handling: 422 validation errors.

3.2.9 Notifications, Emails, and Jobs
- Introduction: asynchronous jobs send confirmation and reminder emails, and dispatch webhooks.
- Inputs: booking events, scheduler triggers.
- Processing: queued jobs send messages, log success/failure, and create Notification DB rows.
- Outputs: emails to users, webhook POSTs, stored notification records.
- Error Handling: job retries and logging; persistent failures are logged.

3.2.10 Admin Analytics, Reports & Settings
- Introduction: Admin endpoints provide analytics, exports (CSV) and settings management.
- Inputs: admin-authenticated requests, filter params.
- Processing: aggregation queries for occupancy/revenue/popular lots and CSV export endpoints.
- Outputs: JSON analytics, CSV files for download.
- Error Handling: 403 unauthorized for non-admins.

3.2.11 Pricing & Dynamic Pricing
- Introduction: Pricing engine applies dynamic pricing rules during lot listing and show.
- Inputs: lot data and occupancy counts.
- Processing: `PricingEngine::applyDynamicPricing()` adjusts price fields.
- Outputs: adjusted pricing fields in lot resource.
- Error Handling: internal errors logged.

3.2.12 CO2 Summary
- Introduction: Endpoint calculates CO2 emissions and savings per user over a date range.
- Inputs: optional `from`, `to`, `lot_id` query params.
- Processing: counts bookings, applies per-booking km assumption and emission factors, aggregates saved emissions and carpool estimates.
- Outputs: JSON with counts and emission metrics.
- Error Handling: 422 for invalid date ranges.

3.2.13 Webhooks (Incoming & Outgoing)
- Introduction: Incoming hardware webhooks are accepted; outgoing webhook subscriptions receive booking events.
- Inputs: incoming POSTs from hardware; stored webhook subscription records for outgoing events.
- Processing: incoming events mapped to internal state; outgoing events queued as `SendWebhookJob`.
- Outputs: HTTP POSTs to subscriber endpoints, updated system state.
- Error Handling: retries via queue and logging.

3.2.14 SSE / Realtime Broadcast
- Introduction: Events broadcast via Laravel broadcasting and SSE; private channels used for user-specific events.
- Inputs: event dispatches from controllers (BookingCreated, BookingCancelled, etc.).
- Processing: broadcast to private channels and SseController push.
- Outputs: realtime JSON payloads to subscribers.
- Error Handling: requires broadcast driver configuration; clients handle reconnects.

3.5 Non-Functional Requirements
- Performance:
  - Typical GET endpoints median response <150ms under normal load.
  - Booking creation under contention aims <500ms using DB locking and transactions.
  - Pagination default 50, max 200 to bound response sizes.
- Reliability:
  - ACID transactions for booking-critical operations; queue-backed jobs for eventual delivery.
  - Scheduled purge job to remove expired bookings and keep DB healthy.
- Availability:
  - Deploy with multiple web workers and queue workers; target 99.5% uptime.
- Security:
  - Auth via Laravel Sanctum; admin-only middleware for privileged routes; form request input validation; two-factor auth available (pragmarx/google2fa).
  - Sensitive fields hidden (passwords, two_factor_secret) and multi-tenant scoping via `BelongsToTenant`.
- Maintainability:
  - Laravel best-practices: controllers, resources, services, tests (unit and integration present).
- Portability:
  - Run on PHP >= 8.2 and Laravel 11; DB drivers supported by Laravel; queue drivers interchangeable.

3.7 Design Constraints
- Must run under PHP >=8.2 and Laravel 11.
- Requires queue worker for jobs and configured mail driver for emails.
- Broadcasting requires configured driver for realtime features.
- Pricing rules rely on lot-stored dynamic rules and a PricingEngine service.

3.9 Other Requirements
- Audit logging used across booking and admin actions via `AuditLog::log()`.
- CSV exports may require background processing for large datasets to avoid timeouts.
- GDPR: repo contains documentation and privacy view; deployment must ensure data protection.

4. Analysis Models

4.1 Data Flow Diagram (textual)
Actors: End Users (Web/Mobile), Admins, IoT devices (ANPR), External webhook subscribers, Scheduler/Queue workers.

Flows (high level):
- User requests (create booking, list lots, check-in) → API routes → Controllers → Services/Models → Database actions → Events/Notifications/Responses.
- Booking creation → BookingCreationService → DB transaction → Booking record created → dispatch BookingCreated event → broadcast & queue SendBookingConfirmationJob → client receives realtime update and email when delivered.
- Booking cancellation → status updated → refund credits if enabled → notify waitlist entries → dispatch webhook jobs and BookingCancelled event → update occupancy and frontend views.
- Scheduler → runs SendBookingReminderJob & PurgeExpiredBookingsJob → sends emails and deletes old bookings.

5. Repository Link
- Placeholder: <GITHUB_REPOSITORY_URL>

6. Deployment Link
- Placeholder: <DEPLOYED_APPLICATION_URL>

7. Project Approval Note
- Placeholder: <PROJECT_APPROVAL_NOTE_OR_INTERNAL_SIGNOFF>

8. Project Location Reference
- Placeholder: <PROJECT_LOCATION_REFERENCE_OR_NOTE>

9. Transaction ID Proof
- Placeholder: <TRANSACTION_ID_PROOF_OR_NOTE>

10. Email Acknowledgement
- Placeholder: <EMAIL_ACKNOWLEDGEMENT_OR_NOTE>

11. GST No
- Placeholder: <GST_NUMBER_OR_NOTE>

Known Limitations & Missing Features (explicit)
- Stripe/payment charge flows are not present in controllers — stripe_events table exists but full payment integration is not implemented in this repo. Do not assume on-repo direct payment processing.
- Frontend UI is expected in `parkhub-web` (separate folder); the Laravel repository is primarily an API service with a small set of server-side views.
- Real-time delivery requires broadcast driver configuration; SSE implementation is present but production topology must be configured.

Next steps (optional):
- Convert this Markdown file to Word using `pandoc` or paste into Word and save as `.docx`.
- Generate a data dictionary (ERD) by parsing `database/migrations`.
- Produce example request/response payloads for top endpoints (bookings, lots, check-in).

---
Generated from repository analysis of `app/`, `routes/`, and `database/migrations` on May 15, 2026.
