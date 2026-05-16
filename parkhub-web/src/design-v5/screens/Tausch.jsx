import { useTranslation } from 'react-i18next';
import { Card, SectionLabel, V5NamedIcon } from '../primitives';

export function TauschV5() {
    const { t } = useTranslation();
    return (<div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="v5-ani" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionLabel>{t('swap.title')}</SectionLabel>
        <button type="button" className="v5-btn" style={{ padding: '7px 14px', borderRadius: 9, background: 'var(--v5-acc)', color: 'var(--v5-accent-fg)', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          + {t('swap.new_request')}
        </button>
      </div>

      <Card className="v5-ani" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 54, height: 54, borderRadius: 16, background: 'var(--v5-acc-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <V5NamedIcon name="swap" size={24} color="var(--v5-acc)"/>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, color: 'var(--v5-txt)', fontSize: 14 }}>{t('swap.none_found')}</div>
          <div style={{ fontSize: 12, color: 'var(--v5-mut)', marginTop: 4, maxWidth: 240, lineHeight: 1.5 }}>
            {t('swap.swap_hint')}
          </div>
        </div>
      </Card>

      <div className="v5-ani" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, animationDelay: '0.1s' }}>
        <Card style={{ padding: 16 }}>
          <SectionLabel>Your History</SectionLabel>
          <div style={{ fontSize: 11, color: 'var(--v5-mut)', marginTop: 20, textAlign: 'center' }}>
            No recent swaps.
          </div>
        </Card>
        <Card style={{ padding: 16 }}>
          <SectionLabel>Active Market</SectionLabel>
          <div style={{ fontSize: 11, color: 'var(--v5-mut)', marginTop: 20, textAlign: 'center' }}>
            No public requests available.
          </div>
        </Card>
      </div>
    </div>);
}
