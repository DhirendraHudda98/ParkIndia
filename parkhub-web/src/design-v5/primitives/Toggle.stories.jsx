import { useState } from 'react';
import { Toggle } from './index';
const meta = {
    title: 'v5/Primitives/Toggle',
    component: Toggle,
    tags: ['autodocs'],
    argTypes: {
        checked: { control: 'boolean' },
        ariaLabel: { control: 'text' },
    },
    args: {
        checked: true,
        ariaLabel: 'Feature switch',
    },
};
export default meta;
export const On = {
    args: { checked: true },
    render: (args) => {
        const [on, setOn] = useState(args.checked);
        return <Toggle {...args} checked={on} onChange={setOn}/>;
    },
};
export const Off = {
    args: { checked: false },
    render: (args) => {
        const [on, setOn] = useState(args.checked);
        return <Toggle {...args} checked={on} onChange={setOn}/>;
    },
};
export const Disabled = {
    args: { checked: true },
    // `onChange` omitted → disabled styling
    render: (args) => <Toggle checked={args.checked} ariaLabel={args.ariaLabel}/>,
};
