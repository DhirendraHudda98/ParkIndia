import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Card, SectionLabel, V5NamedIcon } from '../primitives';
import { useV5Toast } from '../Toast';
import { api } from '../../api/client';

export function GaestepassV5() {
    const { t } = useTranslation();
    const toast = useV5Toast();
    const qc = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);

    const { data: guestBookings = [], isLoading } = useQuery({
        queryKey: ['guest-bookings'],
        queryFn: async () => {
            const res = await api.getGuestBookings();
            return res.data ?? [];
        },
    });

    return (<div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="v5-ani" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionLabel>{t('guest_pass.title', 'Guest Passes')}</SectionLabel>
        <button type="button" className="v5-btn" onClick={() => setShowCreate(true)} style={{ padding: '7px 14px', borderRadius: 9, background: 'var(--v5-acc)', color: 'var(--v5-accent-fg)', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          + {t('guest_pass.new', 'New Guest Pass')}
        </button>
      </div>

      {guestBookings.length === 0 ? (<Card className="v5-ani" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: 'var(--v5-acc-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <V5NamedIcon name="scan" size={24} color="var(--v5-acc)"/>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--v5-txt)', fontSize: 14 }}>{t('guest_pass.none', 'No guest passes yet')}</div>
            <div style={{ fontSize: 12, color: 'var(--v5-mut)', marginTop: 4, maxWidth: 240, lineHeight: 1.5 }}>
              {t('guest_pass.hint', 'Generate a guest pass for your visitors or clients.')}
            </div>
          </div>
        </Card>) : (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {guestBookings.map((gb) => (<Card key={gb.id} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--v5-txt)' }}>{gb.guest_name}</span>
                <Badge variant="success">Active</Badge>
              </div>
              <div style={{ fontSize: 12, color: 'var(--v5-mut)' }}>{gb.vehicle_plate} • {gb.lot_name}</div>
            </Card>))}
        </div>)}
    </div>);
}
