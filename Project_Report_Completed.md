# ParkIndia – Smart Parking Management System
## Software Requirements Specification

**Student Name:** Dhirendra
**Enrollment No.:** _______________
**Branch:** Computer Science / Information Technology
**Institute:** _______________
**Academic Year:** 2024–2025
**Submitted For:** Final Year Major Project – Spring 2025

---

## Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | April 2025 | First draft prepared |
| 1.1 | May 2025 | Modules finalized, DFD added |
| 1.2 | May 15, 2025 | Final version submitted |

---

## 1. Introduction

### 1.1 Purpose

The purpose of this document is to describe the requirements and design of ParkIndia, a smart parking management system developed as a final year academic project. This SRS covers what the system does, how it works internally, what technologies were used, and how different modules interact with each other. It is written for the project guide, evaluators, and anyone who may need to understand or extend this project in the future.

### 1.2 Scope

ParkIndia is a web-based parking management platform designed for Indian users. The idea came from the everyday problem of finding parking in crowded Indian cities. Instead of driving around looking for an open spot, users can open ParkIndia, see which lots near them have availability, and book a spot in advance.

The project has two main parts. The backend is built using Laravel, which is a PHP framework. It handles all the business logic like creating bookings, managing parking lots, handling payments through a wallet system, and sending notifications. The frontend is a single-page application built with React. It gives users a clean interface to browse parking lots on a map, make bookings, manage their vehicles, and check in when they arrive.

Some of the things this system can do include searching for parking across more than 100 Indian cities, booking spots with real-time availability checks, checking in using QR codes, managing a digital wallet for payments, and providing an admin dashboard for lot operators to track revenue and occupancy. The system also supports features like waitlists, recurring bookings, and dynamic pricing that adjusts rates based on how full a lot is.

One thing worth noting is that while the database has tables for Stripe payment integration, the actual payment gateway is not activated in this version. The wallet system works on its own with manual credit top-ups.

### 1.3 Definitions and Abbreviations

SRS stands for Software Requirements Specification. API means Application Programming Interface, which is how the frontend communicates with the backend. SSE refers to Server-Sent Events, a technique used for pushing real-time updates to the browser. CRUD is shorthand for Create, Read, Update, and Delete operations. DPDP refers to India's Digital Personal Data Protection Act of 2023, which this project tries to follow. IST is Indian Standard Time. ANPR means Automatic Number Plate Recognition, used by parking cameras.

### 1.4 References

The main references for this project are the Laravel documentation, the React documentation, and the Mappls (MapmyIndia) SDK guide. Internally, the project structure follows standard Laravel conventions. The API routes are defined in the routes folder, business logic is in the Controllers and Services directories, and the database schema is defined through migration files. The frontend code lives in the parkhub-web directory.

### 1.5 Overview

The rest of this document is organized as follows. Section 2 gives a general overview of the product, its architecture, and the types of users it serves. Section 3 goes into the specific functional and non-functional requirements, describing each module in detail. Section 4 presents the data flow diagrams showing how information moves through the system. The appendices at the end contain the API route list and database table summary.

---

## 2. General Description

### 2.1 Product Perspective

ParkIndia started as a fork of ParkHub, which was an enterprise parking management tool aimed at businesses. The goal of this project was to transform it into something regular people in India could use — a consumer-facing parking finder. Think of it like how BookMyShow works for movie tickets, but for parking spots.

The system follows a client-server architecture. The React frontend runs in the user's browser and communicates with the Laravel backend through REST API calls. When a user books a spot, the frontend sends a request to the backend, which validates everything, locks the parking slot in the database to prevent double-booking, creates the record, and then pushes a real-time update back to the browser using Server-Sent Events. Background workers handle things that don't need to happen immediately, like sending confirmation emails and dispatching webhook notifications.

The database stores everything from user accounts and bookings to parking lot details, wallet transactions, and audit logs. Laravel's Eloquent ORM handles all database interactions, which means the system works with MySQL, PostgreSQL, or even SQLite without changing any code.

For maps, the project uses Mappls, which is the MapmyIndia SDK. This was chosen over Google Maps because Mappls provides more accurate data for Indian locations and supports Indian address formats natively.

### 2.2 Product Functions

At its core, ParkIndia lets users find and book parking. But there is a lot more going on under the hood. The booking system supports regular bookings where you pick a time slot, quick bookings for when you just need a spot right now, and recurring bookings for people who park at the same place every day.

Once a booking is made, users can check in when they arrive. This can happen through a QR code scan, or automatically if the lot has ANPR cameras installed. Users can also extend their parking session if they need more time, and the system checks for conflicts before allowing the extension.

The wallet module gives each user a credit balance. When they book a spot, credits are deducted. If they cancel, credits are refunded automatically. Admins or the users themselves can add credits to their account.

For parking lot operators, there is an admin panel with analytics showing occupancy rates, revenue summaries, peak hours, and booking trends. Admins can export reports as CSV files and view a complete audit trail of every action taken in the system.

Other features include a waitlist system where users can queue up for full lots, vehicle management with Indian license plate validation, push notifications, email reminders, EV charging slot tracking, guest booking without requiring an account, and an occupancy prediction module.

### 2.3 User Roles

The system has a few different types of users. A guest is someone who has not logged in. They can browse available lots and see availability, and there is even a guest booking option for one-time use. A registered user has a full account and can manage bookings, vehicles, wallet balance, and waitlist entries. An admin is a parking lot operator who manages lots, slots, and can view analytics and reports. The superadmin has access to everything including system-wide settings and module configuration. Finally, IoT devices like ANPR cameras interact with the system through a dedicated hardware webhook endpoint.

### 2.4 Constraints

The backend requires PHP 8.2 or newer and runs on Laravel 11. A queue worker process needs to be running for email and webhook delivery to work. The map on the frontend needs a valid Mappls API key to render. All times in the system use Indian Standard Time and all prices are in Indian Rupees.

### 2.5 Assumptions

This project assumes that the React frontend is the primary way users interact with the system. It assumes a queue worker and cron scheduler are set up in any production deployment. Email delivery depends on having an SMTP server configured. The Stripe payment tables exist in the database, but no live payment processing is implemented in this version of the project.


---

## 3. Specific Requirements

### 3.1 External Interfaces

#### 3.1.1 User Interface

The frontend is a React single-page application styled with Tailwind CSS. It has separate screen modules for each major feature. The main screens that a regular user sees are the Dashboard, Book a Spot, My Bookings, Calendar view, Vehicles, Wallet Credits, Check-in, and Profile. Admin users get additional screens for Analytics, Billing, Audit Logs, Team Management, API Keys, and Occupancy Predictions.

There are also a few server-rendered pages built with Laravel Blade templates. These include a kiosk-style check-in page that parking lots can display on a tablet, a PDF invoice template for generating downloadable receipts, and a privacy policy page for DPDP compliance.

#### 3.1.2 Hardware Interface

The system accepts incoming data from ANPR (Automatic Number Plate Recognition) cameras through a webhook endpoint. When a camera reads a license plate, it posts the data to the system, which then matches it to an existing booking and automatically checks the user in or out. The system also generates QR codes for each booking, which can be scanned at kiosks or by parking attendants.

#### 3.1.3 Software Interfaces

The backend uses several third-party packages. DomPDF is used for generating invoice PDFs. The QR code library from chillerlan generates booking QR codes as SVG images. Web push notifications use the minishlink package. Two-factor authentication is handled by the Google 2FA library from pragmarx. On the frontend side, the Mappls Web SDK handles all map rendering, geolocation, and address search functionality.

#### 3.1.4 Communication

All communication between the frontend and backend happens over HTTPS using JSON. Authentication is handled through Laravel Sanctum, which provides both session-based and token-based authentication. The API has rate limiting applied to prevent abuse. For real-time updates, the system uses Server-Sent Events, which means the server can push updates to the browser without the browser having to keep asking for them.

---

### 3.2 Functional Requirements

#### 3.2.1 Authentication Module

Users can register with their name, email, and password. On logging in, the system returns a Sanctum authentication token that the frontend stores and sends with every subsequent request. There is also support for two-factor authentication using Google Authenticator. OAuth and SSO login flows are available for social login. Users can manage their active sessions and reset their password through a token-based flow.

#### 3.2.2 Booking Module

This is the central module of the entire system. When a user wants to book a parking spot, they select a lot and optionally a specific slot, then choose their start and end times. The backend validates the request, locks the selected slot row in the database using a transaction to prevent two people from booking the same spot simultaneously, calculates the price using the pricing engine, deducts credits from the user's wallet if the credit system is enabled, and creates the booking record.

After a booking is created, several things happen automatically. A BookingCreated event is dispatched, which triggers a real-time notification to the user's browser through SSE. A background job is queued to send a confirmation email. If there are any webhook subscribers registered for that lot, another background job sends them an HTTP notification.

When a booking is cancelled, the system reverses the process. Credits are refunded if they were deducted. The waitlist is checked, and if anyone is waiting for a spot at that lot, they get notified that a slot has opened up. A cancellation event and webhook are dispatched.

Users can also update their bookings to change the time window, vehicle, or notes, as long as the booking has not already started. The system checks for scheduling conflicts before allowing any update.

There is also a Quick Book feature for users who just want a spot immediately without browsing. They provide a lot ID and the system automatically picks an available slot and creates a booking from the current time until the end of the day. For users who park at the same location regularly, the recurring booking feature lets them set up daily, weekly, or monthly schedules that the system automatically expands into individual bookings.

#### 3.2.3 Check-in and Check-out

When a user arrives at the parking lot, they need to check in. The system allows check-in up to 15 minutes before the booking start time. On check-in, the booking status changes to active and the timestamp is recorded. There is also a direct check-in option for walk-in users who did not book in advance.

Check-out marks the booking as completed and records the departure time. If a user needs to stay longer, they can extend their booking. The system locks the slot, checks that nobody else has booked it for the extended period, and updates the end time if everything is clear.

#### 3.2.4 Waitlist System

When a parking lot is completely full, users can join a waitlist instead of giving up. The waitlist maintains a queue per lot with optional priority levels. When a spot opens up because someone cancels or checks out, the system automatically notifies the users at the top of the queue. They get an offer that they can accept or decline. If they accept, a booking is created for them immediately. If they decline or the offer expires, it moves to the next person in the queue. Users can check their position and estimated wait time at any point.

#### 3.2.5 Wallet and Credits

Each user has a credit balance stored in their account. The wallet module lets users view their balance, see a paginated history of all transactions (debits for bookings, credits for refunds and top-ups), and add credits to their account. The amount allowed is between 1 and 10,000 INR per top-up.

The wallet operations use database transactions with row-level locking to prevent race conditions. For example, if two requests try to deduct credits at the same time, the lock ensures only one goes through and the balance stays consistent. When a booking is cancelled and the credits system is enabled, the refund is applied automatically without the user having to do anything.

#### 3.2.6 Parking Lot and Slot Management

Admins can create, update, and delete parking lots. When creating a lot, they specify details like the name, address, city, total number of slots, hourly rates, and operating hours. If a total slot count is provided, the system automatically generates all the individual slot records, which saves a lot of manual work for large lots.

Each slot can have features like EV charging capability, wheelchair accessibility, covered parking, or reserved status. Slots can be organized into zones within a lot. The system generates a unique QR code for each slot.

The pricing engine supports dynamic pricing, which means the rate can change based on how full the lot is. The admin configures pricing rules as thresholds. For instance, when a lot is more than 75 percent full, the price might go up by 50 percent. When it is more than 90 percent full, it might double. This encourages users to book at less busy lots.

#### 3.2.7 Vehicle Management

Users can add their vehicles to the system with details like make, model, license plate number, and colour. They can also upload a photo of their vehicle. The license plate validation is customized for Indian formats, supporting standard plates like MH12AB1234, commercial plates, and the newer Bharat Series format like 22BH1234AA.

#### 3.2.8 Notifications and Background Jobs

The system has several types of notifications. In-app notifications appear in the notification centre and can be marked as read or deleted. Email notifications include booking confirmations sent immediately after booking and reminders sent before the booking starts. Web push notifications are supported through the Web Push API.

All email and webhook deliveries happen through queued background jobs. This means the user does not have to wait for the email to be sent before seeing their booking confirmation. A scheduled job runs daily to clean up expired bookings from the database.

#### 3.2.9 Admin Analytics and Reports

The admin dashboard provides analytics on occupancy rates per lot over time, total revenue earned, which lots are most popular, what times of day are busiest, and how many bookings are in each status. Admins can generate CSV reports with date range and lot filters. There is also a scheduled report feature that can automatically generate and email reports on a regular basis.

Every action taken in the system is logged in the audit trail. This includes who did what, when they did it, and what the data looked like before and after the change. This is useful for accountability and debugging.

#### 3.2.10 Indian Market Features

The system is localized for India in several ways. There are more than 100 Indian cities pre-loaded in the database, and users can filter parking lots by city and state. All timestamps use Indian Standard Time. All monetary values are in Indian Rupees. The map integration uses Mappls (MapmyIndia) which provides better coverage and accuracy for Indian locations compared to international alternatives. The system also follows the Digital Personal Data Protection Act of 2023, implementing data minimization, supporting user data rights, and keeping all data stored locally.

#### 3.2.11 Other Features

The CO2 summary module tracks the environmental impact by estimating carbon emissions saved through shared parking use. The EV charging module tracks which slots have charging stations. The booking swap feature lets users exchange slots with each other. The occupancy prediction module uses historical data to forecast how full a lot will be in the coming hours.

---

### 3.3 Non-Functional Requirements

#### Performance
The system is designed to respond to most GET requests in under 150 milliseconds. Booking creation, which involves database locking and multiple checks, targets under 500 milliseconds even under load. Pagination limits are set at 50 items by default with a maximum of 200 to keep response sizes manageable. The database has compound indexes on the bookings table for the columns used in conflict checking, which significantly speeds up availability queries.

#### Reliability
All booking operations use ACID database transactions. This means if anything goes wrong during the booking process, the entire operation is rolled back and the slot is released. Email and webhook deliveries are handled through a queue with automatic retry, so temporary failures do not result in lost notifications.

#### Security
Authentication uses Laravel Sanctum with support for both token and session modes. Two-factor authentication adds an extra layer of security. Admin routes are protected by middleware that checks the user's role before allowing access. All user inputs go through typed validation classes before reaching the business logic. Sensitive fields like passwords and 2FA secrets are never included in API responses.

#### Maintainability
The codebase follows Laravel's MVC architecture with an additional service layer for complex business logic. There are 69 API controllers, each handling a specific domain. The project includes static analysis through PHPStan and pre-commit hooks through Lefthook to catch issues before they get committed.

#### Portability
The system runs on PHP 8.2 or newer and works with MySQL, PostgreSQL, or SQLite. The queue system can use either Redis or the database as its driver. There is a Docker Compose configuration for containerized deployment, and a shell script for deploying on shared hosting.


---

## 4. Analysis Models

### 4.1 Data Flow Diagrams

#### 4.1.1 Level 0 – Context Diagram

At the highest level, ParkIndia is a single system that interacts with several external entities. End users interact with it through the React frontend to search for parking, make bookings, and manage their accounts. Admin users access the system to manage parking lots and view analytics. IoT devices like ANPR cameras send plate scan data to the system through a webhook. On the output side, the system sends confirmation emails, push notifications, real-time browser updates, PDF invoices, and webhook payloads to external subscribers.

```
  [End User] --------->                              ---------> [Email Service]
                        +------------------------+
  [Admin User] ------->|                        |---------> [Push Notifications]
                        |       PARKINDIA        |
  [Guest User] ------->|   PARKING MANAGEMENT   |---------> [PDF Invoice]
                        |       SYSTEM           |
  [IoT / ANPR] ------->|                        |---------> [Webhook Subscribers]
                        +------------------------+
```

#### 4.1.2 Level 1 – Main Processes

Breaking the system down, there are eight major processes that handle different parts of the workflow.

Process 1 is User Authentication and Profile Management. It handles registration, login, logout, two-factor authentication, and profile updates. It reads from and writes to the Users data store.

Process 2 is Lot and Slot Management. Admins create and manage parking lots and their individual slots through this process. It interacts with the Parking Lots and Parking Slots data stores. When a lot is created with a slot count, this process auto-generates all the slot records.

Process 3 is Booking Management. This is the most complex process. It receives booking requests from users, validates them, checks slot availability by querying the Bookings and Slots data stores, applies pricing, creates the booking record, and triggers events. It connects to the Wallet data store for credit deduction and to the Notification Engine for dispatching alerts.

Process 4 is the Event and Notification Engine. It receives events from the Booking process and other modules, and routes them to the appropriate delivery channels — in-app notifications stored in the database, email jobs sent through the queue, push notifications, SSE broadcasts to the browser, and outgoing webhooks.

Process 5 is Check-in and Check-out. It receives check-in requests (either manual or from ANPR cameras), looks up the corresponding booking, validates the time window, and updates the booking status.

Process 6 is the Wallet and Credits module. It manages the credit balance for each user, processing additions, deductions for bookings, and refunds on cancellations.

Process 7 is Admin Analytics and Reports. It runs aggregation queries across the Bookings, Lots, and Users data stores to generate occupancy rates, revenue summaries, and other metrics. It can output the results as JSON for the dashboard or as CSV files for download.

Process 8 is the Hardware Webhook handler. It receives incoming data from ANPR cameras, matches the license plate to a booking, and triggers the check-in or check-out process automatically.

```
  [User] ----> [1.0 Auth] <----> [D1: Users]
                   |
  [User] ----> [3.0 Booking Mgmt] <----> [D3: Bookings]
                   |                           |
                   +----> [PricingEngine] <--- [D2: Lots]
                   |
                   +----> [6.0 Wallet] <----> [D5: Credit Transactions]
                   |
                   +----> [4.0 Notifications] ----> [Email / Push / SSE]
                   
  [Admin] ---> [2.0 Lot Mgmt] <----> [D2: Lots & Slots]
  [Admin] ---> [7.0 Analytics] <----> [D3 + D2: Aggregation]
  
  [ANPR] ----> [8.0 Hardware Webhook] ----> [5.0 Check-in/out] <-> [D3: Bookings]
```

#### 4.1.3 Level 2 – Booking Creation (Process 3.0 Expanded)

When a user submits a booking request, it first goes through the validation sub-process. The StoreBookingRequest class checks that all required fields are present and valid. If validation fails, a 422 error is returned immediately.

If the request is valid, the next step is slot locking. The system queries the parking_slots table with a database lock (SELECT FOR UPDATE) to ensure no other transaction can modify the same slot simultaneously. It then checks whether that slot is already booked for the requested time window by querying the bookings table.

If the slot is unavailable, a 409 conflict error is returned. If it is available, the pricing engine calculates the final price based on the lot's base rate and any dynamic pricing rules that apply given the current occupancy level.

If the credits system is enabled, the next sub-process deducts the calculated amount from the user's credit balance. This also uses a row lock on the users table to prevent balance inconsistencies.

Finally, the booking record is inserted into the database with a status of confirmed. The transaction is committed, and the system dispatches a BookingCreated event. This event triggers the notification engine, which queues a confirmation email, sends a real-time SSE update to the user's browser, and dispatches webhook notifications to any subscribers.

```
  [User Request]
       |
       v
  [3.1 Validate] ---- invalid ----> [422 Error]
       |
       v (valid)
  [3.2 Lock Slot + Check Availability] ---- conflict ----> [409 Error]
       |                       |
       |              [D2: Slots Table]
       v (available)
  [3.3 Calculate Price via PricingEngine]
       |                       |
       |              [D2: Lot Pricing Rules]
       v
  [3.4 Deduct Credits] (if enabled)
       |                       |
       |              [D5: Users Balance]
       v
  [3.5 Create Booking Record]
       |                       |
       |              [D3: Bookings Table]
       v
  [3.6 Dispatch Events]
       |
       +----> BookingCreated Event ----> SSE Broadcast
       +----> Confirmation Email Job ----> Email
       +----> Webhook Job ----> HTTP POST to Subscribers
```

#### 4.1.4 Level 2 – Check-in Process (Process 5.0 Expanded)

The check-in flow starts when the system receives a request, either from a user scanning a QR code or from an ANPR camera posting a license plate. The first step is to look up the booking in the database. For QR-based check-in, the booking ID is used directly. For ANPR, the system searches by license plate and finds the booking that is confirmed for the current time window.

If no matching booking is found, a 404 error is returned. If one is found, the system validates the check-in window. Check-in is allowed starting 15 minutes before the booking start time. If the user tries to check in too early, too late, or has already checked in, an appropriate error is returned.

If the window is valid, the booking status is updated to active and the checked_in_at timestamp is set to the current time. A BookingCheckedIn event is dispatched, triggering a real-time update to the user's browser.

---

### 4.2 Key Data Stores

The system uses the following main database tables. The users table stores account information along with a credits_balance field for the wallet. The parking_lots table holds lot details including location, city, rates, operating hours, and dynamic pricing rules stored as JSON. The parking_slots table tracks individual slots with their features, zone assignment, and status. The bookings table is the largest, storing every booking with its lot, slot, user, time window, status, and price. The credit_transactions table logs every wallet debit and credit. The vehicles table stores user vehicles with plate numbers and optional photos. The waitlist_entries table maintains per-lot queues. The audit_logs table records every significant action for accountability. The indian_cities table is pre-populated with more than 100 Indian cities for location filtering.

---

## 5. GitHub Repository

Repository URL: _______________________________________________

(Fill in your actual GitHub repository link)

---

## 6. Deployed Application

Deployed URL: _______________________________________________

(Fill in your actual hosted application URL)

---

## Project Screenshots

(Paste 4-5 screenshots of the running application below. Include the Dashboard, Booking page, Map view, and Admin Analytics.)

Screenshot 1 – Dashboard:


Screenshot 2 – Book a Spot:


Screenshot 3 – Admin Analytics:


Screenshot 4 – Map View:


---

## Appendix A – Technology Stack

The backend uses Laravel 11 running on PHP 8.2+. The frontend uses React 19 with Vite as the build tool and Tailwind CSS 4 for styling. The map integration uses Mappls (MapmyIndia) Web SDK. The database is MySQL or PostgreSQL accessed through Laravel's Eloquent ORM. Authentication is handled by Laravel Sanctum. Background job processing uses either Redis or a database queue. PDF generation uses DomPDF. QR codes are generated using the chillerlan/php-qrcode package. Two-factor authentication uses the pragmarx/google2fa-laravel package. The project can be deployed using Docker, Laravel Sail, or traditional shared hosting.

## Appendix B – Key API Endpoints

The system exposes its functionality through RESTful API endpoints. User registration and login are at POST /api/register and POST /api/login respectively. Parking lots can be listed at GET /api/lots and individual lots viewed at GET /api/lots/{id}. Bookings are managed through GET, POST, PATCH, and DELETE operations on /api/bookings. Quick booking is available at POST /api/bookings/quick. Check-in and check-out happen at POST /api/bookings/{id}/checkin and /checkout. The wallet balance is at GET /api/wallet/balance with top-up at POST /api/wallet/add. The waitlist can be joined at POST /api/waitlist/join. Vehicles are managed at /api/vehicles. Admin analytics are at GET /api/admin/analytics. City listing is at GET /api/cities. The hardware webhook endpoint for ANPR cameras is at POST /api/webhooks/hardware/anpr. The health check is at GET /api/health.

---

*Submitted: May 2025*
