import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card, SectionLabel, V5NamedIcon } from '../primitives';
import { api } from '../../api/client';

export function StandorteV5() {
    const { t } = useTranslation();
    const { data: lots = [], isLoading } = useQuery({
        queryKey: ['lots'],
        queryFn: async () => {
            const res = await api.getLots();
            return res.data ?? [];
        },
    });

    if (isLoading) return <div style={{ padding: 16 }}>Loading...</div>;

    return (<div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="v5-ani" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionLabel>{t('lots.title', 'Parking Locations')}</SectionLabel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {lots.map((lot) => (<Card key={lot.id} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--v5-txt)' }}>{lot.name}</div>
                <div style={{ fontSize: 11, color: 'var(--v5-mut)', marginTop: 2 }}>{lot.address}</div>
              </div>
              <Badge variant="primary">{lot.total_slots} {t('lots.slots', 'Slots')}</Badge>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
              <Badge variant="gray" style={{ fontSize: 9 }}>{lot.city}</Badge>
              {lot.ev_chargers > 0 && <Badge variant="ev">EV</Badge>}
            </div>
          </Card>))}
      </div>
    </div>);
}
