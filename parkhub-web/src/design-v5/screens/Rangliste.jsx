import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import NumberFlow from '@number-flow/react';
import { Badge, Card, SectionLabel, V5NamedIcon } from '../primitives';
import { api } from '../../api/client';

export function RanglisteV5() {
    const { t } = useTranslation();
    const { data: leaderboard = [], isLoading } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: async () => {
            const res = await api.getLeaderboard();
            return res.data ?? [];
        },
    });
    const categories = [
        { id: 'active', label: t('leaderboard.most_active'), icon: 'analytics', color: 'var(--v5-acc)' },
        { id: 'green', label: t('leaderboard.greenest'), icon: 'ev', color: 'var(--v5-ev)' },
        { id: 'reliable', label: t('leaderboard.most_reliable'), icon: 'check', color: 'var(--v5-success)' },
    ];
    if (isLoading)
        return <div style={{ padding: 16 }}>Loading…</div>;
    return (<div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionLabel>{t('leaderboard.title')}</SectionLabel>

      <div className="v5-ani" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {categories.map((cat) => (<Card key={cat.id} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <V5NamedIcon name={cat.icon} size={14} color={cat.color}/>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--v5-txt)' }}>{cat.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 99, background: 'var(--v5-sur2)' }}/>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--v5-txt)' }}>User #1</div>
                <div style={{ fontSize: 10, color: 'var(--v5-mut)' }}>Top Performance</div>
              </div>
            </div>
          </Card>))}
      </div>

      <Card className="v5-ani" style={{ overflow: 'hidden', animationDelay: '0.1s' }}>
        <div className="v5-mono" style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 100px 100px 100px',
            padding: '8px 16px',
            fontSize: 9,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: 'var(--v5-mut)',
            borderBottom: '1px solid var(--v5-bor)',
        }}>
          <span>{t('leaderboard.rank')}</span>
          <span>{t('leaderboard.name')}</span>
          <span>{t('leaderboard.badges')}</span>
          <span>{t('leaderboard.score')}</span>
          <span>{t('leaderboard.bookings')}</span>
        </div>
        {leaderboard.map((u, i) => (<div key={u.id} className="v5-row" style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 100px 100px 100px',
                padding: '10px 16px',
                borderBottom: i < leaderboard.length - 1 ? '1px solid var(--v5-bor)' : 'none',
                alignItems: 'center',
            }}>
            <span className="v5-mono" style={{ fontSize: 12, fontWeight: 700, color: i < 3 ? 'var(--v5-acc)' : 'var(--v5-mut)' }}>
              #{i + 1}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: 99, background: 'var(--v5-sur2)', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--v5-mut)' }}>
                {u.name.charAt(0)}
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--v5-txt)' }}>{u.name}</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <Badge variant="primary" dot={false} style={{ fontSize: 8, padding: '1px 4px' }}>PRO</Badge>
            </div>
            <span className="v5-mono" style={{ fontSize: 11, color: 'var(--v5-txt)' }}>
              <NumberFlow value={u.score ?? 0}/>
            </span>
            <span className="v5-mono" style={{ fontSize: 11, color: 'var(--v5-mut)' }}>{u.bookings_count}</span>
          </div>))}
      </Card>
    </div>);
}
