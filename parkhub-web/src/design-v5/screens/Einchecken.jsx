import { useTranslation } from 'react-i18next';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Card, LiveDot, SectionLabel, V5NamedIcon } from '../primitives';
import { useV5Toast } from '../Toast';
import { api } from '../../api/client';

function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
export function EincheckenV5() {
    const { t } = useTranslation();
    const toast = useV5Toast();
    const qc = useQueryClient();
    const [manualCheckin, setManualCheckin] = useState(false);
    const { data: bookings = [], isLoading } = useQuery({
        queryKey: ['buchungen'],
        queryFn: async () => {
            const res = await api.getBookings();
            return res.data ?? [];
        },
    });
    const active = useMemo(() => bookings.find((b) => b.status === 'active' || b.status === 'confirmed'), [bookings]);
    const checkinMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.checkIn(id);
            if (!res.success)
                throw new Error(res.error?.message ?? 'Check-in failed');
            return res.data;
        },
        onSuccess: () => {
            toast(t('check_in.checkin_success'), 'success');
            qc.invalidateQueries({ queryKey: ['buchungen'] });
        },
        onError: (err) => toast(err.message, 'error'),
    });
    const checkoutMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.checkOut(id);
            if (!res.success)
                throw new Error(res.error?.message ?? 'Check-out failed');
            return res.data;
        },
        onSuccess: () => {
            toast(t('check_in.checkout_success'), 'success');
            qc.invalidateQueries({ queryKey: ['buchungen'] });
        },
        onError: (err) => toast(err.message, 'error'),
    });
    if (isLoading)
        return <div style={{ padding: 16 }}>Loading…</div>;
    return (<div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="v5-ani" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--v5-txt)' }}>{t('check_in.title')}</span>
        <Badge variant={active ? 'success' : 'gray'}>{active ? t('check_in.ready') : 'None'}</Badge>
      </div>

      {!active ? (<Card className="v5-ani" style={{ padding: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--v5-sur2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <V5NamedIcon name="scan" size={20} color="var(--v5-mut)"/>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--v5-txt)', fontSize: 13 }}>{t('check_in.none_active')}</div>
            <div style={{ fontSize: 11, color: 'var(--v5-mut)', marginTop: 3 }}>
              {t('bookings.reserve_now')}
            </div>
          </div>
        </Card>) : (<div className="v5-ani" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Card style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <SectionLabel>{t('check_in.active_booking')}</SectionLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--v5-acc)' }}>
                  <LiveDot color="var(--v5-acc)"/>
                  {t('dashboard.live')}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--v5-mut)' }}>{t('bookings.lot')}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--v5-txt)', marginTop: 2 }}>{active.lot_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--v5-mut)' }}>Spot {active.slot_number}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--v5-mut)' }}>{t('bookings.plate')}</div>
                  <div className="v5-mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--v5-txt)', marginTop: 2 }}>{active.vehicle_plate}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--v5-mut)' }}>{t('check_in.duration')}</div>
                  <div style={{ fontSize: 12, color: 'var(--v5-txt)', marginTop: 2 }}>{formatTime(active.start_time)} – {formatTime(active.end_time)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--v5-mut)' }}>{t('check_in.since')}</div>
                  <div style={{ fontSize: 12, color: 'var(--v5-acc)', fontWeight: 600 }}>14 min</div>
                </div>
              </div>
              <button type="button" onClick={() => checkoutMutation.mutate(active.id)} style={{ padding: '10px', borderRadius: 9, background: 'color-mix(in oklch, var(--v5-err) 10%, transparent)', border: '1px solid var(--v5-err)', color: 'var(--v5-err)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {t('check_in.check_out')}
              </button>
            </Card>

            <Card style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionLabel>{t('check_in.manual_checkin')}</SectionLabel>
              <div style={{ fontSize: 12, color: 'var(--v5-mut)' }}>
                If the terminal scan fails, you can check-in manually here.
              </div>
              <button type="button" onClick={() => checkinMutation.mutate(active.id)} style={{ padding: '9px', borderRadius: 9, background: 'var(--v5-sur2)', border: '1px solid var(--v5-bor)', color: 'var(--v5-txt)', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
                {t('check_in.manual_checkin')}
              </button>
            </Card>
          </div>

          <Card style={{ padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15, justifyContent: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--v5-txt)' }}>{t('check_in.qr_ready')}</div>
            <div style={{ padding: 12, background: 'white', borderRadius: 12, border: '4px solid var(--v5-acc-muted)' }}>
              <div style={{ width: 140, height: 140, background: '#111', borderRadius: 4 }}/>
            </div>
            <div style={{ fontSize: 11, color: 'var(--v5-mut)', textAlign: 'center', lineHeight: 1.5 }}>
              {t('check_in.scan_hint')}
            </div>
          </Card>
        </div>)}
    </div>);
}
