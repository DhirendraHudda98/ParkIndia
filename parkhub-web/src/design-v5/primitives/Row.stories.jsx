import { Badge, Card, Row, Toggle } from './index';
import { useState } from 'react';
const meta = {
    title: 'v5/Primitives/Row',
    component: Row,
    tags: ['autodocs'],
    argTypes: {
        label: { control: 'text' },
        sub: { control: 'text' },
        last: { control: 'boolean' },
    },
    args: {
        label: 'Notifications',
        sub: 'Email me when a booking arrives',
        last: false,
    },
};
export default meta;
export const Plain = {
    render: (args) => (<Card style={{ minWidth: 320 }}>
      <Row {...args}/>
      <Row label="Receipts" sub="Automatic monthly email" last/>
    </Card>),
};
export const WithToggle = {
    render: (args) => {
        const [on, setOn] = useState(true);
        return (<Card style={{ minWidth: 320 }}>
        <Row {...args}>
          <Toggle checked={on} onChange={setOn} ariaLabel="Notifications"/>
        </Row>
      </Card>);
    },
};
export const WithBadge = {
    render: () => (<Card style={{ minWidth: 320 }}>
      <Row label="Subscription" sub="Pro tier">
        <Badge variant="success">Active</Badge>
      </Row>
      <Row label="Seats" sub="5 of 10 used" last>
        <Badge variant="info">5/10</Badge>
      </Row>
    </Card>),
};
export const LastRow = {
    args: { last: true },
    render: (args) => (<Card style={{ minWidth: 320 }}>
      <Row {...args}/>
    </Card>),
};
