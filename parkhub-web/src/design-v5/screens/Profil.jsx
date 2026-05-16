import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, SectionLabel, V5NamedIcon } from '../primitives';
import { useV5Toast } from '../Toast';
import { api } from '../../api/client';

export function ProfilV5() {
    const { t } = useTranslation();
    const toast = useV5Toast();
    const [exporting, setExporting] = useState(false);

    const { data: user } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const res = await api.me();
            return res.data;
        },
    });

    async function handleExportData() {
        setExporting(true);
        try {
            const blob = await api.exportMyData();
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = 'parkindia-data.json';
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
            toast(t('gdpr.exported', 'Data exported successfully'), 'success');
        } catch (err) {
            toast(t('gdpr.exportFailed', 'Export failed'), 'error');
        } finally {
            setExporting(false);
        }
    }

    return (<div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionLabel>{t('profile.title')}</SectionLabel>

      <div className="v5-ani" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card style={{ padding: 18 }}>
            <SectionLabel>{t('profile.account_info')}</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginTop: 15 }}>
              <ProfileField label={t('profile.name')} value={user?.name ?? '—'}/>
              <ProfileField label={t('profile.email')} value={user?.email ?? '—'}/>
              <ProfileField label={t('profile.username')} value={user?.username ?? '—'}/>
              <ProfileField label={t('profile.department')} value={user?.department ?? 'Engineering'}/>
            </div>
          </Card>

          <Card style={{ padding: 18 }}>
            <SectionLabel>{t('profile.security')}</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 15 }}>
              <button type="button" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: 10,
            background: 'var(--v5-sur2)',
            border: '1px solid var(--v5-bor)',
            cursor: 'pointer',
        }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <V5NamedIcon name="password" size={14} color="var(--v5-mut)"/>
                  <span style={{ fontSize: 12, color: 'var(--v5-txt)' }}>{t('profile.change_password')}</span>
                </div>
                <V5NamedIcon name="arrow-right" size={12} color="var(--v5-mut)"/>
              </button>
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card style={{ padding: 18, textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 99, background: 'var(--v5-acc-muted)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--v5-acc)' }}>{user?.name?.charAt(0) ?? 'U'}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--v5-txt)' }}>{user?.name ?? 'User'}</div>
            <div style={{ fontSize: 12, color: 'var(--v5-mut)', marginTop: 2 }}>{user?.role ?? 'Member'}</div>
          </Card>

          <Card style={{ padding: 18 }}>
            <SectionLabel>{t('gdpr.title')}</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <button 
                type="button" 
                onClick={handleExportData}
                disabled={exporting}
                style={{ padding: '8px', borderRadius: 8, background: 'transparent', border: '1px solid var(--v5-bor)', color: 'var(--v5-txt)', fontSize: 11, cursor: exporting ? 'not-allowed' : 'pointer', opacity: exporting ? 0.6 : 1 }}>
                {exporting ? 'Exporting...' : t('gdpr.export_data')}
              </button>
              <button type="button" style={{ padding: '8px', borderRadius: 8, background: 'transparent', border: '1px solid var(--v5-err)', color: 'var(--v5-err)', fontSize: 11, cursor: 'pointer' }}>
                {t('gdpr.delete_account')}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>);
}
function ProfileField({ label, value }) {
    return (<div>
      <div style={{ fontSize: 10, color: 'var(--v5-mut)', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--v5-txt)', marginTop: 3 }}>{value}</div>
    </div>);
}
