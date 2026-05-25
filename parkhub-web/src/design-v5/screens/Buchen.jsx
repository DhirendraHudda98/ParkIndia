import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from 'react';
import NumberFlow from '@number-flow/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Card, SectionLabel, V5NamedIcon } from '../primitives';
import { useV5Toast } from '../Toast';
import { api, } from '../../api/client';
import { Star } from '@phosphor-icons/react';
import { readLastUsed, writeLastUsed } from '../lastUsed';
import ParkingMap from '../../components/ParkingMap';
const DURATIONS = [
    { label: '1h', hours: 1 },
    { label: '2h', hours: 2 },
    { label: '4h', hours: 4 },
    { label: '8h', hours: 8 },
];
const inputStyle = {
    padding: '8px 11px',
    borderRadius: 9,
    background: 'var(--v5-sur2)',
    border: '1px solid var(--v5-bor)',
    color: 'var(--v5-txt)',
    fontSize: 12,
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
};
function Field({ label, children }) {
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--v5-mut)' }}>{label}</label>
      {children}
    </div>);
}
function defaultStart() {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    // datetime-local expects local-zone ISO (no TZ suffix). Build manually.
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
/**
 * A `datetime-local` input can be cleared to an empty string, and
 * `new Date("").toISOString()` throws `RangeError: Invalid time value`.
 * Guard the confirm path so the mutation is never called with an
 * unparseable value (silent-fail bug surfaced by Codex on parkhub-rust PR #373).
 */
function isValidDt(s) {
    if (!s)
        return false;
    return Number.isFinite(new Date(s).valueOf());
}
function formatDateTime(d) {
    return d.toLocaleString('en-IN', {
        weekday: 'short', day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit',
    });
}
function formatTime(d) {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
export function BuchenV5({ navigate }) {
    const { t } = useTranslation();
    const toast = useV5Toast();
    const qc = useQueryClient();
    const [step, setStep] = useState(1);
    const [selectedLot, setSelectedLot] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    // Smart default: pre-fill the vehicle the user last booked with. The
    // lot pre-select happens further down once the lots query resolves
    // (we can't construct the ParkingLot object from an id alone).
    const [selectedVehicle, setSelectedVehicle] = useState(() => readLastUsed('buchen:vehicle') ?? '');
    const [startDate, setStartDate] = useState(defaultStart);
    const [duration, setDuration] = useState(2);
    const [favoritesSet, setFavoritesSet] = useState(new Set());
    const [favPending, setFavPending] = useState(new Set());
    const { data: lotsResp, isLoading: lotsLoading, isError: lotsError, } = useQuery({
        queryKey: ['buchen-lots'],
        queryFn: async () => {
            const res = await api.getLots();
            if (!res.success)
                throw new Error(res.error?.message ?? 'Lots could not be loaded');
            return res.data ?? [];
        },
        staleTime: 30_000,
        refetchOnWindowFocus: true,
    });
    const { data: vehiclesResp } = useQuery({
        queryKey: ['buchen-vehicles'],
        queryFn: async () => {
            const res = await api.getVehicles();
            if (!res.success)
                throw new Error(res.error?.message ?? 'Vehicles could not be loaded');
            return res.data ?? [];
        },
        staleTime: 30_000,
        refetchOnWindowFocus: true,
    });
    const lots = useMemo(() => (lotsResp ?? []).filter((l) => l.status === 'open'), [lotsResp]);
    const vehicles = vehiclesResp ?? [];
    // Smart default: auto-advance to Step 2 if the user's last-used lot is
    // still open. Silent no-op when the lot has been removed / closed /
    // no prior selection exists. Only fires once (step === 1 guard) so
    // hitting "← Back" doesn't bounce the user forward again.
    useEffect(() => {
        if (step !== 1)
            return;
        if (selectedLot)
            return;
        if (lots.length === 0)
            return;
        const lastLotId = readLastUsed('buchen:lot');
        if (!lastLotId)
            return;
        const match = lots.find((l) => l.id === lastLotId);
        if (!match)
            return;
        setSelectedLot(match);
        setStep(2);
    }, [lots, step, selectedLot]);
    const { data: slotsResp, isLoading: slotsLoading } = useQuery({
        queryKey: ['buchen-slots', selectedLot?.id],
        enabled: !!selectedLot,
        queryFn: async () => {
            const res = await api.getLotSlots(selectedLot.id);
            if (!res.success)
                throw new Error(res.error?.message ?? 'Slots could not be loaded');
            return res.data ?? [];
        },
        staleTime: 15_000,
    });
    const slots = slotsResp ?? [];

    useEffect(() => {
      let mounted = true;
      if (!selectedLot) return undefined;
      api.getFavorites().then((res) => {
        if (!mounted) return;
        if (res.success && res.data) setFavoritesSet(new Set(res.data.map(f => f.slot_id)));
      }).catch(() => {});
      return () => { mounted = false; };
    }, [selectedLot?.id]);

    async function toggleFavorite(slot) {
      const slotId = slot.id;
      if (favPending.has(slotId)) return;
      setFavPending(p => new Set(p).add(slotId));
      if (favoritesSet.has(slotId)) {
        const res = await api.removeFavorite(slotId);
        if (res.success) setFavoritesSet(p => { const n = new Set(p); n.delete(slotId); return n; });
        else toast('Remove failed', 'error');
      } else {
        const res = await api.addFavorite(slotId, selectedLot?.id || slot.lot_id);
        if (res.success) setFavoritesSet(p => new Set(p).add(slotId));
        else toast('Add failed', 'error');
      }
      setFavPending(p => { const n = new Set(p); n.delete(slotId); return n; });
    }
    
    // Subscribe to real-time slot updates
    useEffect(() => {
        if (!selectedLot) return;

        let channel;
        const channelName = `lot.${selectedLot.id}`;
        
        import('../../lib/echo').then(({ echo }) => {
            channel = echo.channel(channelName);
            channel.listen('.slot.availability.changed', (e) => {
                console.log('Real-time slot update (V5):', e);
                qc.setQueryData(['buchen-slots', selectedLot.id], (old) => {
                    if (!old) return old;
                    const slot = old.find(s => s.id === e.slot_id);
                    if (slot && slot.status !== e.status) {
                        if (e.status === 'unavailable') {
                            toast(`Spot ${slot.slot_number} was just reserved!`, 'error');
                        } else {
                            toast(`Spot ${slot.slot_number} is available again!`, 'success');
                        }
                    }
                    return old.map(s => s.id === e.slot_id ? { ...s, status: e.status } : s);
                });
            });
        });

        return () => {
            if (channel) channel.stopListening('.slot.availability.changed');
            import('../../lib/echo').then(({ echo }) => echo.leaveChannel(channelName));
        };
    }, [selectedLot, qc]);

    // Optimistic create: insert a pending placeholder into the bookings
    // cache as soon as the user taps "Confirm Booking" so the list on
    // /buchungen already shows the new row when we navigate there. The
    // server response replaces the placeholder on invalidation; onError
    // rolls back.
    const createMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.createBooking(payload);
            if (!res.success) {
                const msg = res.error?.code === 'INSUFFICIENT_CREDITS'
                    ? 'Insufficient credits'
                    : res.error?.message || 'Booking failed';
                throw new Error(msg);
            }
            return res.data;
        },
        onMutate: async (payload) => {
            await qc.cancelQueries({ queryKey: ['buchungen'] });
            const previous = qc.getQueryData(['buchungen']);
            const optimistic = {
                id: `optimistic-${Date.now()}`,
                user_id: '',
                lot_id: payload.lot_id,
                slot_id: payload.slot_id,
                lot_name: selectedLot?.name ?? '',
                slot_number: selectedSlot?.slot_number ?? '',
                start_time: payload.start_time,
                end_time: payload.end_time,
                status: 'confirmed',
            };
            qc.setQueryData(['buchungen'], [optimistic, ...(previous ?? [])]);
            return { previous };
        },
        onSuccess: (_data, payload) => {
            // Persist smart defaults only on confirmed success — we don't
            // want to pre-select a lot the server rejected.
            writeLastUsed('buchen:lot', payload.lot_id);
            if (payload.vehicle_id)
                writeLastUsed('buchen:vehicle', payload.vehicle_id);
            toast(t('buchen.booking_confirmed'), 'success');
            navigate('buchungen');
        },
        onError: (err, _payload, ctx) => {
            if (ctx?.previous)
                qc.setQueryData(['buchungen'], ctx.previous);
            toast(err.message || 'Booking failed', 'error');
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['buchungen'] });
        },
    });
    if (lotsLoading) {
        return (<div style={{ padding: 16, flex: 1, overflow: 'auto' }}>
        <div style={{ height: 32, width: 220, borderRadius: 8, background: 'var(--v5-sur2)', marginBottom: 14, animation: 'ph-v5-pulse 1.6s ease infinite' }}/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
          {[0, 1, 2].map((i) => (<div key={i} style={{ height: 120, borderRadius: 14, background: 'var(--v5-sur2)', animation: 'ph-v5-pulse 1.6s ease infinite', animationDelay: `${i * 0.1}s` }}/>))}
        </div>
      </div>);
    }
    if (lotsError) {
        return (<div style={{ padding: 16, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card className="v5-ani" style={{ padding: 28, textAlign: 'center', maxWidth: 360 }}>
          <V5NamedIcon name="x" size={26} color="var(--v5-err)"/>
          <div style={{ marginTop: 10, fontWeight: 600, color: 'var(--v5-txt)' }}>Error loading</div>
          <div style={{ fontSize: 12, color: 'var(--v5-mut)', marginTop: 4 }}>Lots could not be loaded.</div>
        </Card>
      </div>);
    }
    const start = new Date(startDate);
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
    const rate = selectedLot?.hourly_rate;
    const rateNum = rate != null ? Number(rate) : null;
    const currency = selectedLot?.currency || '₹';
    const estimated = rateNum != null ? (rateNum * duration).toFixed(2) : null;
    function handleSelectLot(lot) {
        setSelectedLot(lot);
        setSelectedSlot(null);
        setStep(2);
    }
    function handleConfirm() {
        if (!selectedLot || !selectedSlot)
            return;
        // Empty / unparseable datetime-local values produce Invalid Date, and
        // `toISOString()` on those throws — the mutation would never fire and
        // the user would see nothing happen. Surface a toast instead.
        if (!isValidDt(startDate) || !Number.isFinite(end.valueOf())) {
            toast('Please enter valid times', 'error');
            return;
        }
        createMutation.mutate({
            lot_id: selectedLot.id,
            slot_id: selectedSlot.id,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            vehicle_id: selectedVehicle || undefined,
        });
    }
    return (<div style={{ padding: 16, flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="v5-ani" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--v5-txt)' }}>{t('buchen.title')}</span>
          <Badge variant="gray">{t('buchen.step')} {step}/3</Badge>
        </div>
        {step > 1 && (<button type="button" onClick={() => setStep((s) => (s === 3 ? 2 : 1))} style={{ padding: '6px 12px', borderRadius: 9, background: 'transparent', border: '1px solid var(--v5-bor)', color: 'var(--v5-mut)', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
            ← {t('buchen.back')}
          </button>)}
      </div>

      <div className="v5-ani" role="list" aria-label="Progress" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, animationDelay: '0.06s' }}>
        {[1, 2, 3].map((s) => {
            const active = s === step;
            const done = s < step;
            return (<div key={s} role="listitem" aria-current={active ? 'step' : undefined} style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: `1.5px solid ${active || done ? 'var(--v5-acc)' : 'var(--v5-bor)'}`,
                    background: active ? 'var(--v5-acc-muted)' : done ? 'color-mix(in oklch, var(--v5-acc) 6%, transparent)' : 'transparent',
                    color: active || done ? 'var(--v5-acc)' : 'var(--v5-mut)',
                    fontSize: 11,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                }}>
              <span className="v5-mono" style={{ fontSize: 10 }}>0{s}</span>
              <span>
                {s === 1 ? t('buchen.lot') : s === 2 ? t('buchen.time_slot') : t('buchen.confirm')}
              </span>
            </div>);
        })}
      </div>

      {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             <div style={{ minHeight: 400 }}>
                 <ParkingMap onSelectLot={handleSelectLot} />
             </div>
             <StepLot lots={lots} onSelect={handleSelectLot} t={t}/>
          </div>
      )}
      {step === 2 && selectedLot && (<StepSlot lot={selectedLot} slots={slots} loading={slotsLoading} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} startDate={startDate} onStartDateChange={setStartDate} duration={duration} onDurationChange={setDuration} vehicles={vehicles} selectedVehicle={selectedVehicle} onVehicleChange={setSelectedVehicle} onContinue={() => selectedSlot && setStep(3)} currency={currency} estimated={estimated} t={t} favoritesSet={favoritesSet} favPending={favPending} toggleFavorite={toggleFavorite}/>)}
      {step === 3 && selectedLot && selectedSlot && (<StepConfirm lot={selectedLot} slot={selectedSlot} start={start} end={end} duration={duration} estimated={estimated} currency={currency} vehicle={vehicles.find((v) => v.id === selectedVehicle)} submitting={createMutation.isPending} onConfirm={handleConfirm} t={t}/>)}
    </div>);
}
function StepLot({ lots, onSelect, t }) {
    if (lots.length === 0) {
        return (<Card className="v5-ani" style={{ padding: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, animationDelay: '0.12s' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--v5-acc-muted)', border: '1.5px dashed color-mix(in oklch, var(--v5-acc) 50%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <V5NamedIcon name="map" size={20} color="var(--v5-acc)"/>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, color: 'var(--v5-txt)', fontSize: 13 }}>{t('buchen.no_lots')}</div>
          <div style={{ fontSize: 11, color: 'var(--v5-mut)', marginTop: 3 }}>Currently no parking areas are available.</div>
        </div>
      </Card>);
    }
    return (<div className="v5-ani" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 10,
            animationDelay: '0.12s',
        }}>
      {lots.map((lot, i) => {
            const occupancy = lot.total_slots > 0 ? Math.round(((lot.total_slots - lot.available_slots) / lot.total_slots) * 100) : 0;
            const full = lot.available_slots === 0;
            return (<button key={lot.id} type="button" data-testid="buchen-lot-card" disabled={full} onClick={() => !full && onSelect(lot)} className="v5-lift v5-ani" style={{
                    background: 'var(--v5-sur)',
                    border: '1px solid var(--v5-bor)',
                    borderRadius: 14,
                    boxShadow: 'var(--v5-shadow-card)',
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    textAlign: 'left',
                    cursor: full ? 'not-allowed' : 'pointer',
                    opacity: full ? 0.55 : 1,
                    animationDelay: `${i * 0.05}s`,
                    fontFamily: 'inherit',
                    color: 'inherit',
                }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--v5-txt)' }}>{lot.name}</div>
                {lot.address && (<div style={{ fontSize: 11, color: 'var(--v5-mut)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <V5NamedIcon name="map" size={10}/>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lot.address}</span>
                  </div>)}
              </div>
              {full ? <Badge variant="error">Full</Badge> : <Badge variant="success" dot>Open</Badge>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div className="v5-mono" style={{ fontSize: 9, letterSpacing: 1.2, color: 'var(--v5-mut)', textTransform: 'uppercase' }}>{t('buchen.available')}</div>
                <div className="v5-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--v5-acc)' }}>
                  <NumberFlow value={lot.available_slots}/> / {lot.total_slots}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="v5-mono" style={{ fontSize: 9, letterSpacing: 1.2, color: 'var(--v5-mut)', textTransform: 'uppercase' }}>{t('buchen.occupancy')}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--v5-txt)' }}>{occupancy}%</div>
              </div>
            </div>
            <div style={{ height: 4, background: 'var(--v5-sur2)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max(4, 100 - occupancy)}%`, background: 'var(--v5-acc)', borderRadius: 4, transition: 'width 0.4s ease' }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--v5-mut)' }}>
              <span>
                {lot.hourly_rate != null ? `${lot.currency || '₹'}${Number(lot.hourly_rate).toFixed(2)}/h` : 'Price on request'}
              </span>
              <span style={{ color: 'var(--v5-acc)', fontWeight: 500 }}>{t('buchen.select')} →</span>
            </div>
          </button>);
        })}
    </div>);
}
function StepSlot({ lot, slots, loading, selectedSlot, onSelectSlot, startDate, onStartDateChange, duration, onDurationChange, vehicles, selectedVehicle, onVehicleChange, onContinue, currency, estimated, t, favoritesSet, favPending, toggleFavorite }) {
    const available = slots.filter((s) => s.status === 'available');
    return (<div className="v5-ani" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 12, animationDelay: '0.12s' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionLabel>{lot.name}</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label={t('buchen.start_time')}>
              <input id="buchen-start" type="datetime-local" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} style={inputStyle}/>
            </Field>
            <Field label={t('buchen.duration')}>
              <div role="group" aria-label="Duration" style={{ display: 'flex', gap: 5 }}>
                {DURATIONS.map((d) => {
            const active = duration === d.hours;
            return (<button key={d.hours} type="button" aria-pressed={active} onClick={() => onDurationChange(d.hours)} style={{
                    flex: 1,
                    padding: '7px 0',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: `1.5px solid ${active ? 'var(--v5-acc)' : 'var(--v5-bor)'}`,
                    background: active ? 'var(--v5-acc-muted)' : 'transparent',
                    color: active ? 'var(--v5-acc)' : 'var(--v5-mut)',
                    transition: 'all 0.15s',
                }}>
                      {d.label}
                    </button>);
        })}
              </div>
            </Field>
          </div>
          {vehicles.length > 0 && (<Field label={t('buchen.vehicle')}>
              <select id="buchen-vehicle" value={selectedVehicle} onChange={(e) => onVehicleChange(e.target.value)} style={inputStyle}>
                <option value="">— {t('buchen.no_vehicle')} —</option>
                {vehicles.map((v) => (<option key={v.id} value={v.id}>
                    {v.plate}{v.make ? ` · ${v.make}${v.model ? ` ${v.model}` : ''}` : ''}
                  </option>))}
              </select>
            </Field>)}
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <SectionLabel>{t('buchen.select_slot')}</SectionLabel>
            <span style={{ fontSize: 11, color: 'var(--v5-mut)' }}>
              {available.length} of {slots.length} available
            </span>
          </div>
          {loading ? (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 6 }}>
              {Array.from({ length: 12 }, (_, i) => (<div key={i} style={{ height: 44, borderRadius: 8, background: 'var(--v5-sur2)', animation: 'ph-v5-pulse 1.6s ease infinite', animationDelay: `${i * 0.03}s` }}/>))}
            </div>) : available.length === 0 ? (<div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--v5-mut)' }}>
              No available spots in this time window.
            </div>) : (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 6 }}>
              {slots.map((s) => {
                const isAvail = s.status === 'available';
                const isSelected = selectedSlot?.id === s.id;
              return (<button key={s.id} type="button" disabled={!isAvail} aria-pressed={isSelected} aria-label={`Spot ${s.slot_number}${isAvail ? '' : ' (taken)'}`} onClick={() => isAvail && onSelectSlot(s)} data-testid="buchen-slot" style={{
                        padding: '10px 0',
                position: 'relative',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: isAvail ? 'pointer' : 'not-allowed',
                        border: `1.5px solid ${isSelected ? 'var(--v5-acc)' : 'var(--v5-bor)'}`,
                        background: isSelected ? 'var(--v5-acc)' : isAvail ? 'var(--v5-sur)' : 'var(--v5-sur2)',
                        color: isSelected ? 'var(--v5-accent-fg)' : isAvail ? 'var(--v5-txt)' : 'var(--v5-mut)',
                        opacity: isAvail ? 1 : 0.55,
                        transition: 'all 0.12s',
                    }}>
                      {s.slot_number}
                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleFavorite(s); }} disabled={favPending.has(s.id)} style={{ position: 'absolute', left: 6, top: 6, padding: 6, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer' }} aria-label={favoritesSet.has(s.id) ? `Remove ${s.slot_number} from favorites` : `Add ${s.slot_number} to favorites`}>
                        <Star weight={favoritesSet.has(s.id) ? 'fill' : 'regular'} size={14} color={favoritesSet.has(s.id) ? '#f59e0b' : 'currentColor'} />
                      </button>
                  </button>);
            })}
            </div>)}
        </Card>
      </div>

      <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, alignSelf: 'start' }}>
        <SectionLabel>{t('buchen.summary')}</SectionLabel>
        <SummaryRow label={t('buchen.lot')} value={lot.name}/>
        <SummaryRow label={t('buchen.spot')} value={selectedSlot?.slot_number ?? '—'}/>
        <SummaryRow label={t('buchen.from')} value={formatDateTime(new Date(startDate))}/>
        <SummaryRow label={t('buchen.duration')} value={`${duration}h`}/>
        <SummaryRow label={t('buchen.rate')} value={lot.hourly_rate != null ? `${currency}${Number(lot.hourly_rate).toFixed(2)}/h` : '—'}/>
        <SummaryRow label={t('buchen.cost')} value={estimated ? `${currency}${estimated}` : '—'} bold/>
        <button type="button" disabled={!selectedSlot} onClick={onContinue} style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: 'var(--v5-acc)',
            color: 'var(--v5-accent-fg)',
            border: 'none',
            fontSize: 12,
            fontWeight: 600,
            cursor: selectedSlot ? 'pointer' : 'not-allowed',
            opacity: selectedSlot ? 1 : 0.5,
            marginTop: 4,
        }}>
          {t('buchen.continue')} →
        </button>
      </Card>
    </div>);
}
function StepConfirm({ lot, slot, start, end, duration, estimated, currency, vehicle, submitting, onConfirm, t }) {
    return (<Card className="v5-ani" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14, animationDelay: '0.12s' }}>
      <div>
        <SectionLabel>{t('buchen.confirm')}</SectionLabel>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--v5-txt)', marginTop: 4 }}>
          {t('buchen.ready_to_book')}
        </div>
        <div style={{ fontSize: 12, color: 'var(--v5-mut)', marginTop: 4 }}>
          {t('buchen.review_details')}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <SummaryTile label={t('buchen.lot')} value={lot.name}/>
        <SummaryTile label={t('buchen.spot')} value={slot.slot_number}/>
        <SummaryTile label={t('buchen.from')} value={formatDateTime(start)}/>
        <SummaryTile label={t('buchen.to')} value={formatTime(end)}/>
        <SummaryTile label={t('buchen.duration')} value={`${duration}h`}/>
        <SummaryTile label={t('buchen.vehicle')} value={vehicle ? vehicle.plate : '—'}/>
        <SummaryTile label={t('buchen.rate')} value={lot.hourly_rate != null ? `${currency}${Number(lot.hourly_rate).toFixed(2)}/h` : '—'}/>
        <SummaryTile label={t('buchen.cost')} value={estimated ? `${currency}${estimated}` : '—'} emphasis/>
      </div>
      <button type="button" disabled={submitting} onClick={onConfirm} data-testid="buchen-confirm" style={{
            padding: '11px 16px',
            borderRadius: 10,
            background: 'var(--v5-acc)',
            color: 'var(--v5-accent-fg)',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: submitting ? 'default' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            marginTop: 4,
        }}>
        {submitting ? 'Confirming …' : t('buchen.confirm_booking')}
      </button>
    </Card>);
}
function SummaryRow({ label, value, bold = false }) {
    return (<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
      <span style={{ color: 'var(--v5-mut)' }}>{label}</span>
      <span style={{ color: 'var(--v5-txt)', fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>);
}
function SummaryTile({ label, value, emphasis = false }) {
    return (<div style={{
            padding: '10px 12px',
            borderRadius: 10,
            background: emphasis ? 'var(--v5-acc-muted)' : 'var(--v5-sur2)',
            border: `1px solid ${emphasis ? 'color-mix(in oklch, var(--v5-acc) 30%, transparent)' : 'var(--v5-bor)'}`,
        }}>
      <div className="v5-mono" style={{ fontSize: 9, letterSpacing: 1.2, color: 'var(--v5-mut)', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: emphasis ? 'var(--v5-acc)' : 'var(--v5-txt)', marginTop: 3 }}>
        {value}
      </div>
    </div>);
}
