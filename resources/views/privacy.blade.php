<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy — ParkIndia</title>
    <meta name="description" content="ParkIndia Privacy Policy — how we collect, store, and protect your data in compliance with Indian law.">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
            background: #f8fafc;
            color: #1e293b;
            line-height: 1.7;
        }
        .banner {
            background: linear-gradient(135deg, #16a34a, #059669);
            color: white;
            padding: 3rem 1.5rem 2rem;
            text-align: center;
        }
        .banner h1 { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.03em; }
        .banner p  { margin-top: .5rem; opacity: .85; font-size: 1rem; }
        .badge {
            display: inline-block; margin-top: 1rem;
            background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.3);
            border-radius: 20px; padding: .3rem 1rem; font-size: .8rem; font-weight: 600;
        }
        main {
            max-width: 820px;
            margin: 2.5rem auto 4rem;
            padding: 0 1.5rem;
        }
        section { margin-bottom: 2.5rem; }
        h2 {
            font-size: 1.2rem; font-weight: 700; color: #0f172a;
            border-left: 4px solid #16a34a;
            padding-left: .75rem; margin-bottom: 1rem;
        }
        p, li { font-size: .95rem; color: #334155; }
        ul { padding-left: 1.5rem; margin-top: .5rem; }
        li { margin-bottom: .4rem; }
        .highlight-box {
            background: #ecfdf5; border: 1px solid #bbf7d0;
            border-radius: 12px; padding: 1.2rem 1.5rem; margin-bottom: 1.5rem;
        }
        .highlight-box p { color: #065f46; font-weight: 500; font-size: .9rem; }
        .chip {
            display: inline-flex; align-items: center; gap: .4rem;
            background: #f1f5f9; border-radius: 20px;
            padding: .3rem .8rem; font-size: .8rem; font-weight: 600; color: #475569;
            margin: .2rem;
        }
        table { width: 100%; border-collapse: collapse; margin-top: .75rem; font-size: .9rem; }
        th { background: #f1f5f9; padding: .6rem 1rem; text-align: left; font-weight: 600; }
        td { padding: .6rem 1rem; border-top: 1px solid #e2e8f0; }
        .footer-note {
            background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
            padding: 1.2rem 1.5rem; text-align: center; color: #64748b; font-size: .85rem;
        }
        a { color: #16a34a; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>

<div class="banner">
    <h1>🔒 Privacy Policy</h1>
    <p>How ParkIndia collects, stores, and protects your data.</p>
    <div class="badge">🇮🇳 Data stored in India &nbsp;·&nbsp; Last updated: May 2026</div>
</div>

<main>

    <div class="highlight-box">
        <p>✅ All data collected by ParkIndia is stored exclusively on servers located in India. We do not transfer your personal data outside India except as described in Section 7 (Third-Party Services) below.</p>
    </div>

    <section>
        <h2>1. Who We Are</h2>
        <p>ParkIndia ("we", "us", "our") operates the ParkIndia mobile and web application, an online platform for discovering and booking parking spaces across India. We are incorporated under the laws of India.</p>
        <p style="margin-top:.75rem">
            <strong>Data Protection Officer (DPO):</strong><br>
            Email: <a href="mailto:privacy@parkindia.in">privacy@parkindia.in</a><br>
            Address: [Your registered office address], India
        </p>
    </section>

    <section>
        <h2>2. Applicable Law</h2>
        <p>This policy is governed by the following Indian legislation and guidelines:</p>
        <ul>
            <li><strong>Information Technology Act, 2000</strong> (IT Act) and the IT (Amendment) Act, 2008</li>
            <li><strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong> (SPDI Rules)</li>
            <li><strong>Digital Personal Data Protection Act, 2023</strong> (DPDP Act) — we are actively implementing compliance measures as subordinate rules are notified by the Ministry of Electronics and Information Technology (MeitY)</li>
            <li>Reserve Bank of India (RBI) guidelines on payment data localisation</li>
        </ul>
    </section>

    <section>
        <h2>3. Data We Collect</h2>
        <table>
            <thead>
                <tr><th>Category</th><th>Data Points</th><th>Purpose</th></tr>
            </thead>
            <tbody>
                <tr><td>Account</td><td>Name, email, phone number, password (hashed)</td><td>Authentication &amp; communication</td></tr>
                <tr><td>Vehicle</td><td>Vehicle registration number, make, model, colour</td><td>Booking &amp; QR check-in</td></tr>
                <tr><td>Location</td><td>City, GPS coordinates (when you use "Locate Me")</td><td>Show nearby parking lots</td></tr>
                <tr><td>Booking</td><td>Parking lot, slot, start/end time, payment reference</td><td>Booking fulfilment &amp; history</td></tr>
                <tr><td>Payment</td><td>Transaction ID, amount, payment status (no card data stored)</td><td>Payment processing</td></tr>
                <tr><td>Technical</td><td>IP address, device type, browser, session token</td><td>Security &amp; fraud prevention</td></tr>
            </tbody>
        </table>
        <p style="margin-top:.75rem; font-size:.85rem; color:#64748b">We do not store raw payment card numbers or CVV. All payment processing is handled by our PCI-DSS compliant payment partner.</p>
    </section>

    <section>
        <h2>4. How We Store Data</h2>
        <p>All personal data is stored on servers physically located in India.</p>
        <ul>
            <li>Databases are encrypted at rest (AES-256).</li>
            <li>All API communications use TLS 1.3.</li>
            <li>Session tokens are encrypted and expire after 24 hours of inactivity.</li>
            <li>Audit logs are retained for 90 days, then automatically purged.</li>
            <li>Backups are stored in the same Indian region as the primary data.</li>
        </ul>
        <div style="margin-top:1rem">
            <span class="chip">🇮🇳 Data Residency: India</span>
            <span class="chip">🔐 Encrypted at Rest</span>
            <span class="chip">🔒 TLS 1.3 in Transit</span>
            <span class="chip">⏱ 90-day Audit Retention</span>
        </div>
    </section>

    <section>
        <h2>5. How We Use Your Data</h2>
        <ul>
            <li>To create and manage your account</li>
            <li>To process parking bookings and payments</li>
            <li>To send booking confirmations and reminders (email/SMS)</li>
            <li>To display nearby parking availability on the map</li>
            <li>To improve the platform and resolve technical issues</li>
            <li>To comply with legal obligations under Indian law</li>
        </ul>
        <p style="margin-top:.75rem">We do <strong>not</strong> use your data for advertising profiling, sell it to third parties, or share it with foreign government agencies unless required by a valid Indian court order.</p>
    </section>

    <section>
        <h2>6. Legal Basis for Processing (DPDP Act 2023)</h2>
        <ul>
            <li><strong>Consent:</strong> Location access, marketing communications — you may withdraw at any time from your profile settings.</li>
            <li><strong>Contract:</strong> Data processed to fulfil your parking booking.</li>
            <li><strong>Legitimate interest:</strong> Security monitoring, fraud prevention, audit logging.</li>
            <li><strong>Legal obligation:</strong> Complying with RBI payment data rules, court orders.</li>
        </ul>
    </section>

    <section>
        <h2>7. Third-Party Services</h2>
        <p>We share limited data with the following third parties <strong>only for the specific purposes listed</strong>:</p>
        <table>
            <thead>
                <tr><th>Service</th><th>Purpose</th><th>Data Shared</th></tr>
            </thead>
            <tbody>
                <tr><td><strong>Mappls (MapmyIndia)</strong></td><td>Mapping &amp; location search</td><td>Search queries, GPS coordinates</td></tr>
                <tr><td><strong>Payment Gateway</strong> (Razorpay / Stripe)</td><td>Payment processing</td><td>Amount, booking ID, user email</td></tr>
                <tr><td><strong>SMTP Provider</strong></td><td>Transactional email (booking confirmations)</td><td>Name, email address</td></tr>
            </tbody>
        </table>
        <p style="margin-top:.75rem">We do not integrate any third-party analytics, advertising, or tracking scripts (Google Analytics, Facebook Pixel, etc.) that would send your data outside India.</p>
    </section>

    <section>
        <h2>8. Your Rights (DPDP Act 2023)</h2>
        <p>As a Data Principal under the DPDP Act, 2023, you have the right to:</p>
        <ul>
            <li><strong>Access</strong> the personal data we hold about you</li>
            <li><strong>Correct</strong> inaccurate or incomplete data</li>
            <li><strong>Erase</strong> your personal data (subject to legal obligations)</li>
            <li><strong>Withdraw consent</strong> for optional processing at any time</li>
            <li><strong>Nominate</strong> a person to exercise rights on your behalf</li>
            <li><strong>Grievance redressal</strong> via our DPO (see below)</li>
        </ul>
        <p style="margin-top:.75rem">To exercise any right, email <a href="mailto:privacy@parkindia.in">privacy@parkindia.in</a>. We will respond within 30 days.</p>
    </section>

    <section>
        <h2>9. Cookies &amp; Local Storage</h2>
        <ul>
            <li><strong>Strictly necessary:</strong> Session cookie (encrypted), CSRF token — cannot be disabled.</li>
            <li><strong>Functional:</strong> Dark mode preference, language setting — stored in browser localStorage.</li>
            <li><strong>No tracking cookies</strong> are set by ParkIndia or any third party on our platform.</li>
        </ul>
    </section>

    <section>
        <h2>10. Data Retention</h2>
        <ul>
            <li>Active accounts: data retained while account is active.</li>
            <li>Deleted accounts: personal data erased within 30 days of deletion request.</li>
            <li>Booking records: retained for 3 years (GST compliance requirement under Indian law).</li>
            <li>Audit logs: 90 days, then automatically purged.</li>
        </ul>
    </section>

    <section>
        <h2>11. Security</h2>
        <p>We implement industry-standard security measures including:</p>
        <ul>
            <li>Bcrypt password hashing (cost factor 12)</li>
            <li>Rate limiting on all authentication endpoints</li>
            <li>OWASP Top-10 mitigation (SQL injection, XSS, CSRF prevention)</li>
            <li>HTTP Strict Transport Security (HSTS)</li>
            <li>Two-Factor Authentication (2FA) available for all accounts</li>
        </ul>
    </section>

    <section>
        <h2>12. MeitY Compliance Statement</h2>
        <p>ParkIndia is committed to compliance with the Ministry of Electronics and Information Technology (MeitY) framework including:</p>
        <ul>
            <li>Data localisation: All personal data of Indian users stored in India.</li>
            <li>Grievance Officer: Appointed as required under IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.</li>
            <li>DPDP Act readiness: We are actively implementing technical and organisational measures as the Digital Personal Data Protection Board begins operations.</li>
        </ul>
    </section>

    <section>
        <h2>13. Changes to This Policy</h2>
        <p>We will notify registered users via email of any material changes at least 14 days before they take effect. Continued use of the platform after the effective date constitutes acceptance.</p>
    </section>

    <section>
        <h2>14. Contact Us</h2>
        <p>
            <strong>Data Protection Officer</strong><br>
            ParkIndia<br>
            Email: <a href="mailto:privacy@parkindia.in">privacy@parkindia.in</a><br>
            [Your office address], India
        </p>
    </section>

    <div class="footer-note">
        <p>This privacy policy was last updated in <strong>May 2026</strong>. &nbsp;|&nbsp; Governed by the laws of India &nbsp;|&nbsp; 🇮🇳 Data stored in India</p>
    </div>

</main>
</body>
</html>
