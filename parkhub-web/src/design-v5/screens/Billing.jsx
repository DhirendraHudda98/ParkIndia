import { useTranslation } from 'react-i18next';
import NumberFlow from '@number-flow/react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card, V5NamedIcon } from '../primitives';
import { api } from '../../api/client';
/**
 * Billing — admin view of tenant-wide finance.
 *
 * v5 mirrors the legacy `views/AdminBilling.tsx` workflow: cost-center +
 * department aggregates from `/api/v1/admin/billing/*`, NOT the personal
 * `/payments/history` feed (that lives on the user-facing Kredits screen).
 *
 * Codex #376: the v5 draft originally wired this admin-nav entry to
 * `api.getPaymentHistory()`, which broke the tenant finance workflow
 * (cost-center rollups + CSV export) for operators.
 */
function formatMoney(amount, currency) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(amount);
}
export function BillingV5({ navigate: _navigate }) {
    const { t } = useTranslation();
    const costCenterQuery = useQuery({
        queryKey: ['admin-billing-cost-center'],
        queryFn: async () => {
            const res = await api.adminBillingByCostCenter();
            if (!res.success)
                throw new Error(res.error?.message ?? t('common.error'));
            return res.data ?? [];
        },
        staleTime: 30_000,
    });
    const departmentQuery = useQuery({
        queryKey: ['admin-billing-department'],
        queryFn: async () => {
            const res = await api.adminBillingByDepartment();
            if (!res.success)
                throw new Error(res.error?.message ?? t('common.error'));
            return res.data ?? [];
        },
        staleTime: 30_000,
    });
    const { data: config } = useQuery({
        queryKey: ['billing-config'],
        queryFn: async () => {
            const res = await api.getStripeConfig();
            if (!res.success)
                throw new Error(res.error?.message ?? t('common.error'));
            return res.data;
        },
        staleTime: 60_000,
    });
    const isLoading = costCenterQuery.isLoading || departmentQuery.isLoading;
    const isError = costCenterQuery.isError || departmentQuery.isError;
    const ccRows = costCenterQuery.data ?? [];
    const totalAmount = ccRows.reduce((sum, r) => sum + r.total_amount, 0);
    const totalBookings = ccRows.reduce((sum, r) => sum + r.total_bookings, 0);
    const totalUsers = ccRows.reduce((sum, r) => sum + r.user_count, 0);
    const currency = ccRows[0]?.currency ?? 'INR';
    async function handleExport() {
        try {
            const blob = await api.adminBillingExport();
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `parkindia-billing-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
        }
    }
    if (isLoading) {
        return (<div style={{ padding: 16, flex: 1, overflow: 'auto' }}>
        {[0, 1, 2].map((i) => (<div key={i} style={{ height: 60, borderRadius: 12, background: 'var(--v5-sur2)', marginBottom: 8, animation: 'ph-v5-pulse 1.6s ease infinite', animationDelay: `${i * 0.1}s` }}/>))}
      </div>);
    }
    if (isError) {
        return (<div style={{ padding: 16, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card className="v5-ani" style={{ padding: 28, textAlign: 'center', maxWidth: 360 }}>
          <V5NamedIcon name="x" size={26} color="var(--v5-err)"/>
          <div style={{ marginTop: 10, fontWeight: 600, color: 'var(--v5-txt)' }}>{t('common.error')}</div>
        </Card>
      </div>);
    }
    return (<div style={{ padding: 16, flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="v5-ani" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--v5-txt)' }}>{t('billing.title', 'Billing')}</span>
        <button type="button" onClick={handleExport} data-testid="billing-export" style={{
            padding: '7px 14px', borderRadius: 9, background: 'var(--v5-acc)', color: 'var(--v5-accent-fg)',
            border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
        }}>{t('billing.csvExport', 'CSV Export')}</button>
      </div>

      <div className="v5-ani" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, animationDelay: '0.06s' }}>
        <Card style={{ padding: 14 }}>
          <div className="v5-mono" style={{ fontSize: 9, letterSpacing: 1.3, color: 'var(--v5-mut)', textTransform: 'uppercase' }}>{t('billing.total', 'Total')}</div>
          <div className="v5-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--v5-txt)', marginTop: 4 }}>{formatMoney(totalAmount, currency)}</div>
        </Card>
        <Card style={{ padding: 14 }}>
          <div className="v5-mono" style={{ fontSize: 9, letterSpacing: 1.3, color: 'var(--v5-mut)', textTransform: 'uppercase' }}>{t('billing.bookings', 'Bookings')}</div>
          <div className="v5-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--v5-txt)', marginTop: 4 }}><NumberFlow value={totalBookings}/></div>
        </Card>
        <Card style={{ padding: 14 }}>
          <div className="v5-mono" style={{ fontSize: 9, letterSpacing: 1.3, color: 'var(--v5-mut)', textTransform: 'uppercase' }}>{t('billing.users', 'Users')}</div>
          <div className="v5-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--v5-txt)', marginTop: 4 }}><NumberFlow value={totalUsers}/></div>
        </Card>
        <Card style={{ padding: 14 }}>
          <div className="v5-mono" style={{ fontSize: 9, letterSpacing: 1.3, color: 'var(--v5-mut)', textTransform: 'uppercase' }}>{t('billing.stripe', 'Stripe')}</div>
          <div style={{ marginTop: 8 }}>
            <Badge variant={config?.configured ? 'success' : 'gray'} dot>
              {config?.configured ? t('billing.configured', 'Configured') : t('billing.notConfigured', 'Not configured')}
            </Badge>
          </div>
        </Card>
      </div>

      <Card className="v5-ani" style={{ padding: 16, animationDelay: '0.12s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--v5-txt)' }}>{t('billing.costCenters', 'Cost Centers')}</span>
          <Badge variant="gray">{ccRows.length}</Badge>
        </div>
        {ccRows.length === 0 ? (<div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--v5-mut)' }}>
            {t('billing.noCostCenters', 'No cost centers configured yet')}
          </div>) : (<div>
            <div className="v5-mono" style={{
                display: 'grid', gridTemplateColumns: '120px 1fr 80px 90px 120px',
                padding: '6px 4px', fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase',
                color: 'var(--v5-mut)', borderBottom: '1px solid var(--v5-bor)',
            }}>
              <span>{t('billing.costCenter', 'Cost Center')}</span><span>{t('billing.department', 'Department')}</span><span>{t('billing.users', 'Users')}</span><span>{t('billing.bookings', 'Bookings')}</span><span>{t('billing.amount', 'Amount')}</span>
            </div>
            {ccRows.map((r, i) => (<div key={r.cost_center} data-testid="billing-row" style={{
                    display: 'grid', gridTemplateColumns: '120px 1fr 80px 90px 120px',
                    padding: '10px 4px', alignItems: 'center',
                    borderBottom: i < ccRows.length - 1 ? '1px solid var(--v5-bor)' : 'none',
                    fontSize: 11, color: 'var(--v5-txt)',
                }}>
                <span className="v5-mono">{r.cost_center}</span>
                <span>{r.department}</span>
                <span className="v5-mono"><NumberFlow value={r.user_count}/></span>
                <span className="v5-mono"><NumberFlow value={r.total_bookings}/></span>
                <span className="v5-mono" style={{ fontWeight: 500 }}>{formatMoney(r.total_amount, r.currency)}</span>
              </div>))}
          </div>)}
      </Card>
    </div>);
}
