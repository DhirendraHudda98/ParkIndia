import { useTranslation } from 'react-i18next';
import { Card, SectionLabel, V5NamedIcon } from '../primitives';

export function KarteV5() {
    const { t } = useTranslation();
    return (<div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionLabel>{t('map.title', 'Parking Map')}</SectionLabel>
      
      <Card className="v5-ani" style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 400, background: 'var(--v5-sur2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <V5NamedIcon name="map" size={40} color="var(--v5-mut)"/>
          <div style={{ marginTop: 15, fontWeight: 600, color: 'var(--v5-txt)' }}>{t('map.loading', 'Loading map...')}</div>
          <div style={{ fontSize: 12, color: 'var(--v5-mut)', marginTop: 5 }}>{t('map.hint', 'Interactive map view for lot selection')}</div>
        </div>
        
        <div style={{ position: 'absolute', inset: 0, opacity: 0.1, background: 'radial-gradient(circle at 50% 50%, var(--v5-acc) 0%, transparent 70%)' }}/>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <Card style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <V5NamedIcon name="check" size={14} color="var(--v5-success)"/>
          <span style={{ fontSize: 11, color: 'var(--v5-txt)' }}>{t('map.available', 'Available Slots')}</span>
        </Card>
        <Card style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <V5NamedIcon name="warning" size={14} color="var(--v5-warning)"/>
          <span style={{ fontSize: 11, color: 'var(--v5-txt)' }}>{t('map.limited', 'Limited Space')}</span>
        </Card>
        <Card style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <V5NamedIcon name="x" size={14} color="var(--v5-error)"/>
          <span style={{ fontSize: 11, color: 'var(--v5-txt)' }}>{t('map.full', 'Full')}</span>
        </Card>
      </div>
    </div>);
}
