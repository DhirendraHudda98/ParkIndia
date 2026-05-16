import { StatCard } from './index';
const meta = {
    title: 'v5/Primitives/StatCard',
    component: StatCard,
    tags: ['autodocs'],
    argTypes: {
        label: { control: 'text' },
        value: { control: 'text' },
        sub: { control: 'text' },
        accent: { control: 'boolean' },
        icon: {
            control: 'select',
            options: ['credit', 'bolt', 'trend', 'car', 'predict', 'rank', 'analytics'],
        },
    },
    args: {
        label: 'Revenue',
        value: '$4,280',
        sub: '+12.4% vs last week',
        accent: false,
        icon: 'trend',
    },
};
export default meta;
export const Default = {};
export const Accent = {
    args: { accent: true, label: 'Credits', value: '240', icon: 'credit' },
};
export const WithoutIcon = {
    args: { icon: undefined },
};
export const WithoutSub = {
    args: { sub: undefined },
};
export const Grid = {
    render: () => (<div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(180px, 220px))',
            gap: 12,
        }}>
      <StatCard label="Revenue" value="$4,280" sub="+12.4%" icon="trend"/>
      <StatCard label="Bookings" value="128" sub="Today" icon="cal"/>
      <StatCard label="Credits" value="240" sub="Available" icon="credit" accent/>
      <StatCard label="EV Sessions" value="32" sub="Active" icon="bolt"/>
    </div>),
};
