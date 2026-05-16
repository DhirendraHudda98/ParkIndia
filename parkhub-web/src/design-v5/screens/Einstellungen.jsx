import { useTranslation } from 'react-i18next';
import { Badge, Card, SectionLabel, V5NamedIcon } from '../primitives';

export function EinstellungenV5() {
    const { t } = useTranslation();
    const sections = [
        { id: 'app', label: t('settings.appearance'), icon: 'sun' },
        { id: 'feat', label: t('settings.features'), icon: 'assistant' },
        { id: 'a11y', label: t('settings.a11y'), icon: 'check' },
        { id: 'notif', label: t('settings.notifications'), icon: 'analytics' },
    ];
    return (<div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionLabel>{t('settings.system')}</SectionLabel>

      <div className="v5-ani" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 12 }}>
        <Card style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {sections.map((s) => (<button key={s.id} type="button" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 8,
                background: s.id === 'app' ? 'var(--v5-acc-muted)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
            }}>
              <V5NamedIcon name={s.icon} size={14} color={s.id === 'app' ? 'var(--v5-acc)' : 'var(--v5-mut)'}/>
              <span style={{ fontSize: 12, fontWeight: 500, color: s.id === 'app' ? 'var(--v5-acc)' : 'var(--v5-txt)' }}>{s.label}</span>
            </button>))}
        </Card>

        <Card style={{ padding: 20 }}>
          <SectionLabel>{t('settings.appearance')}</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
            <SettingRow label={t('settings.mode')} sub="Switch between dark and light themes">
              <div style={{ display: 'flex', gap: 4, background: 'var(--v5-sur2)', padding: 4, borderRadius: 8 }}>
                <Badge variant="primary">Auto</Badge>
                <span style={{ fontSize: 11, padding: '2px 8px', color: 'var(--v5-mut)' }}>Dark</span>
                <span style={{ fontSize: 11, padding: '2px 8px', color: 'var(--v5-mut)' }}>Light</span>
              </div>
            </SettingRow>
            
            <SettingRow label={t('settings.language')} sub="Select your preferred language">
              <select style={{ padding: '4px 8px', borderRadius: 6, background: 'var(--v5-sur2)', border: '1px solid var(--v5-bor)', fontSize: 12, color: 'var(--v5-txt)' }}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </SettingRow>

            <SettingRow label={t('settings.sidebar')} sub="Toggle sidebar label visibility">
              <div style={{ width: 34, height: 20, background: 'var(--v5-acc)', borderRadius: 20, position: 'relative' }}>
                <div style={{ width: 14, height: 14, background: 'white', borderRadius: 99, position: 'absolute', right: 3, top: 3 }}/>
              </div>
            </SettingRow>
          </div>

          <div style={{ marginTop: 30, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
             <button type="button" style={{ padding: '8px 16px', borderRadius: 9, background: 'transparent', border: '1px solid var(--v5-bor)', fontSize: 12, color: 'var(--v5-mut)', cursor: 'pointer' }}>
               {t('settings.reset')}
             </button>
             <button type="button" style={{ padding: '8px 16px', borderRadius: 9, background: 'var(--v5-acc)', border: 'none', fontSize: 12, color: 'var(--v5-accent-fg)', fontWeight: 600, cursor: 'pointer' }}>
               {t('settings.save')}
             </button>
          </div>
        </Card>
      </div>
    </div>);
}
function SettingRow({ label, sub, children }) {
    return (<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--v5-txt)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--v5-mut)', marginTop: 2 }}>{sub}</div>
      </div>
      {children}
    </div>);
}
