import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card, SectionLabel, V5NamedIcon } from '../primitives';
import { api } from '../../api/client';

export function NutzerV5() {
    const { t } = useTranslation();
    const { data: users = [], isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const res = await api.adminUsers();
            return res.data ?? [];
        },
    });

    if (isLoading) return <div style={{ padding: 16 }}>Loading...</div>;

    return (<div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionLabel>{t('users.title', 'User Management')}</SectionLabel>

      <Card className="v5-ani" style={{ overflow: 'hidden' }}>
        <div className="v5-mono" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 100px 100px',
            padding: '8px 16px',
            fontSize: 9,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: 'var(--v5-mut)',
            borderBottom: '1px solid var(--v5-bor)',
        }}>
          <span>{t('users.name', 'Name')}</span>
          <span>{t('users.email', 'Email')}</span>
          <span>{t('users.role', 'Role')}</span>
          <span>{t('users.actions', 'Actions')}</span>
        </div>
        {users.map((u, i) => (<div key={u.id} className="v5-row" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 100px 100px',
                padding: '10px 16px',
                borderBottom: i < users.length - 1 ? '1px solid var(--v5-bor)' : 'none',
                alignItems: 'center',
            }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--v5-txt)' }}>{u.name}</span>
            <span style={{ fontSize: 12, color: 'var(--v5-mut)' }}>{u.email}</span>
            <Badge variant={u.role === 'admin' ? 'primary' : 'gray'}>{u.role}</Badge>
            <button type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <V5NamedIcon name="arrow-right" size={12} color="var(--v5-mut)"/>
            </button>
          </div>))}
      </Card>
    </div>);
}
