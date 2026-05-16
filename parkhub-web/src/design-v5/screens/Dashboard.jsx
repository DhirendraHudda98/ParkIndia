import { useTranslation } from 'react-i18next';
import NumberFlow from '@number-flow/react';
import { Badge, Card, LiveDot, SectionLabel, StatCard, V5NamedIcon } from '../primitives';
import { useV5Toast } from '../Toast';
/**
 * v5 Dashboard — bento grid reference implementation.
 * All numbers animate via @number-flow/react (the 2026 counter-animation
 * standard). Colors and borders read from --v5-* tokens so the entire
 * card set re-skins on mode change without a remount.
 */
export function DashboardV5({ navigate }) {
    const { t } = useTranslation();
    const toast = useV5Toast();
    // Stable pseudo-random pattern — deterministic so the SSR/CSR output matches.
    const slots = [0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0];
    const credits = 40;
    const creditsMax = 40;
    const stats = [
        { label: t('dashboard.active_bookings'), value: 0, sub: t('dashboard.none_active'), icon: 'analytics' },
        { label: t('dashboard.credits'), value: credits, sub: 'no expiry', accent: true, icon: 'credit' },
        { label: t('dashboard.occupancy'), value: '8%', sub: '1/12 spots', icon: 'map' },
        { label: t('dashboard.rate'), value: '₹2.50', sub: t('dashboard.per_hour'), icon: 'trend' },
    ];
    const zones = [
        { name: 'Zone A', free: 6, total: 8, ev: false },
        { name: 'Zone B', free: 4, total: 8, ev: false },
        { name: 'EV', free: 3, total: 4, ev: true },
    ];
    const quickActions = [
        { label: t('dashboard.book_now'), shortcut: '⌘N', primary: true, screen: 'buchen' },
        { label: t('check_in.title'), shortcut: '⌘E', screen: 'einchecken' },
        { label: t('dashboard.guest_pass'), shortcut: '⌘G', screen: 'gaestepass' },
        { label: 'EV Charging', shortcut: '⌘L', screen: 'ev' },
        { label: t('swap.title'), shortcut: '⌘T', screen: 'tausch' },
        { label: 'Analytics', shortcut: '⌘A', screen: 'analytics' },
    ];
    return (<div style={{
            padding: 16,
            flex: 1,
            overflow: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridTemplateRows: '76px 1fr 1fr',
            gap: 10,
        }}>
      {stats.map((s, i) => (<StatCard key={s.label} label={s.label} value={typeof s.value === 'number' ? (<NumberFlow value={s.value}/>) : (s.value)} sub={s.sub} accent={s.accent} icon={s.icon} delay={i * 0.06}/>))}

      {/* Active bookings empty-state — matches Vercel's "teaches you" pattern */}
      <Card style={{ gridColumn: 'span 2', padding: 18, display: 'flex', flexDirection: 'column' }} className="v5-ani">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, color: 'var(--v5-txt)', fontSize: 13 }}>{t('dashboard.active_bookings')}</div>
          <Badge variant="gray">0 {t('bookings.active').toLowerCase()}</Badge>
        </div>
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'var(--v5-acc-muted)',
            border: '1.5px dashed color-mix(in oklch, var(--v5-acc) 50%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <V5NamedIcon name="cal" size={20} color="var(--v5-acc)"/>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--v5-txt)', fontSize: 13 }}>{t('dashboard.none_active')}</div>
            <div style={{ fontSize: 11, color: 'var(--v5-mut)', marginTop: 3 }}>
              {t('bookings.reserve_now')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            <button type="button" className="v5-btn" onClick={() => {
            navigate('buchen');
            toast('Booking flow opened', 'info');
        }} style={{
            padding: '8px 16px',
            borderRadius: 9,
            background: 'var(--v5-acc)',
            color: 'var(--v5-accent-fg)',
            border: 'none',
            fontSize: 11,
            fontWeight: 600,
        }}>
              + {t('dashboard.book_now')}
            </button>
            <button type="button" onClick={() => {
            navigate('gaestepass');
            toast('Guest Pass creation', 'info');
        }} style={{
            padding: '8px 12px',
            borderRadius: 9,
            background: 'transparent',
            color: 'var(--v5-mut)',
            border: '1px solid var(--v5-bor)',
            fontSize: 11,
            cursor: 'pointer',
        }}>
              {t('dashboard.guest_pass')}
            </button>
          </div>
        </div>
      </Card>

      {/* Smart recommendation card (pattern-based) */}
      <Card style={{
            padding: 16,
            background: 'linear-gradient(135deg, var(--v5-acc-muted), transparent)',
            border: '1px solid color-mix(in oklch, var(--v5-acc) 30%, transparent)',
        }} className="v5-ani">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <V5NamedIcon name="assistant" size={13} color="var(--v5-acc)"/>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--v5-acc)' }}>{t('dashboard.recommendation')}</span>
          <Badge variant="primary">NEW</Badge>
        </div>
        <p style={{
            fontSize: 12,
            color: 'var(--v5-txt)',
            lineHeight: 1.6,
            marginBottom: 10,
            margin: '0 0 10px',
        }}>
          Based on your patterns: <strong>Thu, 09:00–17:00</strong> is the best time for Zone A.
        </p>
        <div style={{ fontSize: 11, color: 'var(--v5-mut)', display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => navigate('buchen')} style={{
            color: 'var(--v5-acc)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            font: 'inherit',
        }}>
            → {t('dashboard.book_now')}
          </button>
          <span>· Dismiss</span>
        </div>
      </Card>

      {/* Parking zone heatmap */}
      <Card style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }} className="v5-ani">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--v5-txt)' }}>{t('bookings.lot')}</span>
          <div className="v5-mono" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--v5-acc)' }}>
            <LiveDot color="var(--v5-acc)"/>
            {t('dashboard.live')}
          </div>
        </div>
        <div aria-hidden="true" style={{
            borderRadius: 7,
            background: 'var(--v5-sur2)',
            padding: 5,
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: 2,
        }}>
          {slots.map((taken, i) => (<div key={i} style={{
                height: 13,
                borderRadius: 3,
                background: taken ? 'var(--v5-acc)' : 'var(--v5-bor)',
            }}/>))}
        </div>
        {zones.map((z) => (<div key={z.name}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: 'var(--v5-mut)',
                marginBottom: 2,
            }}>
              <span style={{ color: 'var(--v5-txt)' }}>{z.name}</span>
              <span className="v5-mono" style={{ color: z.ev ? 'var(--v5-ev)' : 'var(--v5-acc)' }}>
                {z.free}/{z.total}
              </span>
            </div>
            <div style={{
                height: 3,
                background: 'var(--v5-sur2)',
                borderRadius: 3,
                overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(z.free / z.total) * 100}%`,
                background: z.ev ? 'var(--v5-ev)' : 'var(--v5-acc)',
            }}/>
            </div>
          </div>))}
      </Card>

      {/* Credits hero */}
      <Card style={{
            padding: 16,
            background: 'linear-gradient(145deg, var(--v5-acc-muted), transparent)',
            border: '1px solid color-mix(in oklch, var(--v5-acc) 30%, transparent)',
        }} className="v5-ani">
        <SectionLabel>{t('dashboard.credits')}</SectionLabel>
        <div className="v5-mono" style={{
            fontSize: 44,
            fontWeight: 800,
            color: 'var(--v5-acc)',
            letterSpacing: -2,
            lineHeight: 1,
        }}>
          <NumberFlow value={credits}/>
        </div>
        <div style={{ fontSize: 10, color: 'var(--v5-mut)', margin: '4px 0 10px' }}>
          from {creditsMax} · no expiry
        </div>
        <div role="progressbar" aria-label={`${credits} of ${creditsMax} credits`} aria-valuenow={credits} aria-valuemin={0} aria-valuemax={creditsMax} style={{ height: 3, background: 'var(--v5-bor)', borderRadius: 3 }}>
          <div style={{
            height: '100%',
            width: `${(credits / creditsMax) * 100}%`,
            background: 'var(--v5-acc)',
            transition: 'width 0.8s ease',
        }}/>
        </div>
      </Card>

      {/* Quick actions */}
      <Card style={{ gridColumn: 'span 2', padding: 16 }} className="v5-ani">
        <SectionLabel>{t('dashboard.quick_actions')}</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          {quickActions.map((a) => (<button key={a.label} type="button" onClick={() => navigate(a.screen)} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 11px',
                borderRadius: 9,
                background: a.primary ? 'var(--v5-acc)' : 'var(--v5-sur2)',
                border: `1px solid ${a.primary ? 'transparent' : 'var(--v5-bor)'}`,
                cursor: 'pointer',
            }}>
              <span style={{
                fontSize: 11,
                fontWeight: a.primary ? 600 : 400,
                color: a.primary ? 'var(--v5-accent-fg)' : 'var(--v5-txt)',
            }}>
                {a.label}
              </span>
              <span className="v5-mono" style={{
                fontSize: 9,
                color: a.primary
                    ? 'color-mix(in oklch, var(--v5-accent-fg) 50%, transparent)'
                    : 'var(--v5-mut)',
            }}>
                {a.shortcut}
              </span>
            </button>))}
        </div>
      </Card>
    </div>);
}
