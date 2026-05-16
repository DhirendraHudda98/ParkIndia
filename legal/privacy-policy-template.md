# Privacy Policy Template — ParkHub

> **Instructions for Operators:** Adapt this template to your installation and
> provide the URL of your privacy policy in the app configuration.
>
> **Legal Basis:** Art. 13/14 GDPR, local data protection laws.

---

## Privacy Policy

**Status:** [Date]

**Controller:**
[Name/Company, Address, Email — same details as in the imprint]

---

## 1. Collected Data and Purposes of Processing

### 1.1 Registration and User Account

**Data:** Name, email address, username, encrypted password
**Purpose:** Account creation, authentication, access control
**Legal Basis:** Art. 6 Para. 1 lit. b GDPR (performance of contract)
**Storage Period:** Until the user account is deleted

### 1.2 Booking Data

**Data:** Parking lot, spot, period, license plate, booking ID
**Purpose:** Execution of the parking space booking, billing
**Legal Basis:** Art. 6 Para. 1 lit. b GDPR (performance of contract)
**Storage Period:** 10 years (statutory retention obligation for accounting)

> **Note:** Booking entries are anonymized after a user account is deleted
> (License plate → [DELETED]), but not completely deleted, as tax law
> retention obligations exist.

### 1.3 Vehicle Data

**Data:** License plate, vehicle make, model, color
**Purpose:** Simplified booking, license plate recognition
**Legal Basis:** Art. 6 Para. 1 lit. b GDPR
**Storage Period:** Until the vehicle or user account is deleted

### 1.4 Log Data (Server Logs)

**Data:** IP address, timestamp, requested URL, HTTP status code
**Purpose:** Operational security, error analysis
**Legal Basis:** Art. 6 Para. 1 lit. f GDPR (legitimate interest)
**Storage Period:** 30 days (rolling)

---

## 2. No Disclosure to Third Parties

**ParkHub is operated on-premise.** All data remains on the operator's servers.
There is no transfer to external service providers, cloud services, or third
parties, unless the operator has configured external email services (SMTP).

If email notifications are enabled:
- **SMTP Provider:** [Your SMTP provider and privacy notice]
- **Transmitted Data:** Name, email, booking details

---

## 3. Your Rights (Art. 15–22 GDPR)

| Right | Description |
|-------|-------------|
| **Access** (Art. 15) | You can export all data stored about you at any time (Profile → Privacy → Export Data) |
| **Rectification** (Art. 16) | Corrections of profile data under Settings |
| **Erasure** (Art. 17) | Account closure under Profile → Delete Account (anonymizes bookings, deletes PII) |
| **Restriction** (Art. 18) | Upon request to [Email] |
| **Data Portability** (Art. 20) | Export available as a JSON file |
| **Objection** (Art. 21) | For processing based on legitimate interest |
| **Complaint** | Competent supervisory authority: [Your local data protection officer] |
| **Withdrawal of Consent** (Art. 7 Para. 3) | If processing is based on consent, it can be withdrawn at any time with effect for the future. Contact: [Email] |

---

## 4. Technical Security

- **Transport:** TLS 1.3 (HTTPS)
- **Password Hashing:** Argon2id / bcrypt
- **Data Encryption:** Optional AES-256-GCM at rest for the database
- **Authentication:** JWT Token / Laravel Sanctum
- **No Tracking Cookies:** Only technically necessary session tokens

---

## 5. Cookies and Local Storage

ParkHub does **not use HTTP cookies**. Instead, the browser's local storage
(localStorage) is used for the following technically necessary purposes:

| Key | Purpose | Content | Legal Basis |
|-----------|-------|--------|-----------------|
| `parkhub_token` | Authentication | Session Token (Bearer) | Necessary for operation |
| `parkhub_theme` | Appearance Setting | `light`, `dark` or `system` | User preference |
| `parkhub_features` | Enabled Feature Modules | List of module names | Functional |
| `parkhub_usecase` | Usage Scenario | `business`, `residential` or `personal` | Functional |
| `parkhub_hint_*` | Onboarding Hint Status | `1` (hint closed) | UX state |
| `i18nextLng` | Language Setting | Language code (e.g., `en`) | User preference |

All entries are **technically necessary** for the proper operation of the application
and contain no personal data (with the exception of the authentication token,
which is deleted after logging out).

**No analysis cookies, no advertising cookies, no Google Analytics.**

---

## 6. Data Protection Contact

For questions regarding data processing, contact:

**Data Protection Officer (DPO) / Contact:**
[Name]
[Email for data protection inquiries]
[Phone]

---

*Template for ParkHub operators — not legal advice. This template covers common
scenarios but does not replace individual legal advice.*
