import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Card, SectionLabel, Toggle, V5NamedIcon } from './primitives';
import { HelpTip } from './primitives/HelpTip';
import { V5ThemeProvider } from './ThemeProvider';
import { V5ToastProvider, useV5Toast } from './Toast';
import './fonts';
import './tokens.css';
const STORAGE_SEEN = 'parkhub_onboarding_v5_seen';
const STORAGE_PREFS = 'parkhub_onboarding_v5_prefs';
/**
 * Has the user finished the v5 onboarding tour? Callers can use this to
 * decide whether to redirect freshly-logged-in users through the tour.
 */
export function hasSeenOnboardingTour() {
    if (typeof window === 'undefined')
        return true;
    return window.localStorage.getItem(STORAGE_SEEN) === '1';
}
export function markOnboardingTourSeen() {
    window.localStorage.setItem(STORAGE_SEEN, '1');
}
const FEATURES = [
    {
        id: 'bookings',
        label: 'Bookings',
        description: 'Reserve spots for employees — the core module.',
        defaultOn: true,
        required: true,
    },
    {
        id: 'credits',
        label: 'Credits System',
        description: 'Monthly quota per user, fair access for limited spots.',
        defaultOn: true,
    },
    {
        id: 'ev',
        label: 'EV Charging',
        description: 'Track stations + sessions, live charging status.',
        defaultOn: true,
    },
    {
        id: 'swap',
        label: 'Swap Requests',
        description: 'Users can swap spots with each other.',
        defaultOn: true,
    },
    {
        id: 'waitlist',
        label: 'Waitlist',
        description: 'Auto-notify when a desired spot becomes free.',
        defaultOn: true,
    },
    {
        id: 'guest_pass',
        label: 'Guest Passes',
        description: 'Time-limited visitor passes via shareable link.',
        defaultOn: false,
    },
    {
        id: 'analytics',
        label: 'Analytics',
        description: 'Occupancy, trends, peak times — admin only.',
        defaultOn: true,
    },
    {
        id: 'smart_suggestions',
        label: 'Recommendations',
        description: 'Smart booking & EV plans. Runs locally in browser.',
        defaultOn: false,
    },
];
const STEPS = ['privacy', 'features', 'trust'];
function StepIndicator({ current }) {
    const idx = STEPS.indexOf(current);
    return (<div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '0 4px' }}>
      {STEPS.map((s, i) => {
            const done = i < idx;
            const here = i === idx;
            return (<div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: done || here ? 'var(--v5-acc)' : 'var(--v5-bor)',
                    color: done || here ? 'var(--v5-accent-fg)' : 'var(--v5-mut)',
                    fontSize: 12,
                    fontWeight: 700,
                }}>
              {done ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (<div style={{
                        flex: 1,
                        height: 2,
                        background: done ? 'var(--v5-acc)' : 'var(--v5-bor)',
                        margin: '0 10px',
                    }}/>)}
          </div>);
        })}
    </div>);
}
function PrivacyStep() {
    const { t } = useTranslation();
    const items = [
        {
            icon: 'shield',
            title: t('tour.privacy.self.title', 'Self-hosted — Your data stays with you'),
            body: t('tour.privacy.self.body', 'ParkIndia runs on your own infrastructure. We have no access to your bookings, vehicles, or user data.'),
        },
        {
            icon: 'key',
            title: t('tour.privacy.encryption.title', 'Encryption by default'),
            body: t('tour.privacy.encryption.body', 'All connections use TLS 1.3. Passwords stored as Argon2 hashes. Session tokens with family rotation.'),
        },
        {
            icon: 'info',
            title: t('tour.privacy.gdpr.title', 'Compliance-ready'),
            body: t('tour.privacy.gdpr.body', 'Right to information, deletion, and portability via self-service. Full audit logs for all data access.'),
        },
        {
            icon: 'check',
            title: t('tour.privacy.minimization.title', 'Data Minimization'),
            body: t('tour.privacy.minimization.body', 'Only essential data: Name, plate, booking time. No tracking cookies or third-party analytics.'),
        },
    ];
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <SectionLabel>Step 1 of 3 · Your Data</SectionLabel>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--v5-txt)', letterSpacing: '-0.5px', margin: '2px 0 6px' }}>
          {t('tour.privacy.title', 'Full transparency regarding your data')}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--v5-mut)', lineHeight: 1.6, margin: 0 }}>
          {t('tour.privacy.intro', 'Before you start — here is how we handle your data. No hidden clauses, no opt-outs in fine print.')}
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {items.map((it) => (<Card key={it.title} style={{ padding: 14 }}>
            <div style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'var(--v5-acc-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
            }}>
              <V5NamedIcon name={it.icon} size={15} color="var(--v5-acc)"/>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--v5-txt)', marginBottom: 4 }}>
              {it.title}
            </div>
            <p style={{ fontSize: 11, color: 'var(--v5-mut)', lineHeight: 1.55, margin: 0 }}>{it.body}</p>
          </Card>))}
      </div>
    </div>);
}
function FeaturesStep({ selection, onChange, }) {
    const { t } = useTranslation();
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <SectionLabel>Step 2 of 3 · Modules</SectionLabel>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--v5-txt)', letterSpacing: '-0.5px', margin: '2px 0 6px' }}>
          {t('tour.features.title', 'Choose the features you need')}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--v5-mut)', lineHeight: 1.6, margin: 0 }}>
          {t('tour.features.intro', 'Every module can be turned off. Deactivated features disappear from navigation and consume no resources.')}
        </p>
      </div>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {FEATURES.map((f, i) => {
            const checked = selection[f.id] ?? f.defaultOn;
            return (<div key={f.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 18px',
                    borderBottom: i < FEATURES.length - 1 ? '1px solid var(--v5-bor)' : 'none',
                }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--v5-txt)' }}>{f.label}</span>
                  {f.required && <Badge variant="primary">Required</Badge>}
                  <HelpTip label={`Explanation for ${f.label}`}>{f.description}</HelpTip>
                </div>
                <p style={{ fontSize: 11, color: 'var(--v5-mut)', lineHeight: 1.5, margin: '2px 0 0' }}>
                  {f.description}
                </p>
              </div>
              <Toggle checked={f.required ? true : checked} onChange={f.required ? undefined : (next) => onChange(f.id, next)} ariaLabel={`${f.label} ${checked ? 'deactivate' : 'activate'}`}/>
            </div>);
        })}
      </Card>
    </div>);
}
function TrustStep() {
    const { t } = useTranslation();
    const badges = [
        {
            icon: 'check',
            label: '2147+ Tests',
            sub: 'Unit + Integration + E2E auf jedem PR',
        },
        {
            icon: 'shield',
            label: 'Compliance',
            sub: 'Self-service data rights',
        },
        {
            icon: 'key',
            label: 'TLS 1.3 + Argon2',
            sub: 'No plaintext passwords',
        },
        {
            icon: 'analytics',
            label: 'Lighthouse CI',
            sub: 'Core Web Vitals gated auf jedem Build',
        },
        {
            icon: 'info',
            label: 'OpenAPI',
            sub: '99% Coverage, Drift-Gate im CI',
        },
        {
            icon: 'users',
            label: 'Audit Log',
            sub: 'Traceable data access',
        },
    ];
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <SectionLabel>Step 3 of 3 · Trust</SectionLabel>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--v5-txt)', letterSpacing: '-0.5px', margin: '2px 0 6px' }}>
          {t('tour.trust.title', 'Why you can trust ParkIndia')}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--v5-mut)', lineHeight: 1.6, margin: 0 }}>
          {t('tour.trust.intro', 'ParkIndia is developed transparently. Every line of code and audit is visible.')}
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {badges.map((b) => (<Card key={b.label} style={{ padding: 14, textAlign: 'center' }}>
            <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'var(--v5-acc-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
            }}>
              <V5NamedIcon name={b.icon} size={18} color="var(--v5-acc)"/>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--v5-txt)', marginBottom: 2 }}>
              {b.label}
            </div>
            <div style={{ fontSize: 10, color: 'var(--v5-mut)', lineHeight: 1.5 }}>{b.sub}</div>
          </Card>))}
      </div>
      <Card style={{
            padding: 14,
            background: 'linear-gradient(135deg, var(--v5-acc-muted), transparent)',
            border: '1px solid color-mix(in oklch, var(--v5-acc) 30%, transparent)',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <V5NamedIcon name="shield" size={14} color="var(--v5-acc)"/>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--v5-acc)', letterSpacing: 0.3, textTransform: 'uppercase' }}>
            {t('tour.trust.openBadge', 'Open by default')}
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--v5-txt)', lineHeight: 1.6, margin: 0 }}>
          {t('tour.trust.openBody', 'Open source, public security audits, and active vulnerability disclosure policy.')}
        </p>
      </Card>
    </div>);
}
function TourInner() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const toast = useV5Toast();
    const [step, setStep] = useState('privacy');
    const [selection, setSelection] = useState(() => {
        if (typeof window === 'undefined')
            return {};
        try {
            const stored = window.localStorage.getItem(STORAGE_PREFS);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Back-compat: the old toggle id was `ai_suggestions`; PR #355
                // renamed it to `smart_suggestions` to drop the AI/KI branding.
                // Migrate the persisted value forward so users who opted-in
                // before don't silently fall back to the new default.
                if (parsed.ai_suggestions !== undefined && parsed.smart_suggestions === undefined) {
                    parsed.smart_suggestions = parsed.ai_suggestions;
                }
                return parsed;
            }
        }
        catch {
            /* ignore corrupted prefs */
        }
        return Object.fromEntries(FEATURES.map((f) => [f.id, f.defaultOn]));
    });
    useEffect(() => {
        window.localStorage.setItem(STORAGE_PREFS, JSON.stringify(selection));
    }, [selection]);
    const idx = STEPS.indexOf(step);
    const isLast = idx === STEPS.length - 1;
    const next = () => {
        if (isLast) {
            markOnboardingTourSeen();
            toast(t('tour.complete', 'Welcome! Your ParkIndia is ready.'), 'success');
            // Small delay so the toast is visible before we navigate away
            setTimeout(() => navigate('/', { replace: true }), 600);
            return;
        }
        setStep(STEPS[idx + 1]);
    };
    const skip = () => {
        markOnboardingTourSeen();
        navigate('/', { replace: true });
    };
    const stepContent = useMemo(() => {
        switch (step) {
            case 'privacy':
                return <PrivacyStep />;
            case 'features':
                return (<FeaturesStep selection={selection} onChange={(id, val) => setSelection((s) => ({ ...s, [id]: val }))}/>);
            case 'trust':
                return <TrustStep />;
        }
    }, [step, selection]);
    return (<div style={{
            minHeight: '100dvh',
            background: 'var(--v5-bg)',
            color: 'var(--v5-txt)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '48px 20px',
            fontFamily: "'Inter Variable', 'Inter', system-ui, sans-serif",
        }} data-testid="onboarding-tour">
      <div style={{ width: '100%', maxWidth: 720 }}>
        <StepIndicator current={step}/>
        <div key={step} className="v5-ani" style={{ marginTop: 28 }}>
          {stepContent}
        </div>
        <div style={{
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
        }}>
          <button type="button" onClick={skip} style={{
            padding: '9px 16px',
            borderRadius: 10,
            background: 'transparent',
            color: 'var(--v5-mut)',
            border: 0,
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
        }}>
            {t('tour.skip', 'Skip')}
          </button>
          <div style={{ flex: 1 }}/>
          {idx > 0 && (<button type="button" onClick={() => setStep(STEPS[idx - 1])} style={{
                padding: '9px 16px',
                borderRadius: 10,
                background: 'var(--v5-sur2)',
                color: 'var(--v5-txt)',
                border: '1px solid var(--v5-bor)',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
            }}>
              {t('tour.back', 'Back')}
            </button>)}
          <button type="button" onClick={next} className="v5-btn" style={{
            padding: '10px 22px',
            borderRadius: 10,
            background: 'var(--v5-acc)',
            color: 'var(--v5-accent-fg)',
            border: 0,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
        }}>
            {isLast ? t('tour.finish', 'Get Started') : t('tour.next', 'Next')}
          </button>
        </div>
      </div>
    </div>);
}
/**
 * Stand-alone mount for the onboarding tour. Wraps its own V5ThemeProvider
 * and toast provider so it works even before the main app context tree is
 * mounted (e.g. rendered from a dedicated /welcome page).
 */
export function OnboardingTour() {
    return (<V5ThemeProvider>
      <V5ToastProvider>
        <TourInner />
      </V5ToastProvider>
    </V5ThemeProvider>);
}
