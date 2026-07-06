import { useMemo } from 'react';
import { Card, Table, Tag } from 'antd';
import { fmtInt, fmtMoney, fmtMoney2, fmtPct } from '../format';

/** Raw detail records: Date × Brand × Offer × Media × Country. */
export default function DetailTable({ rows }) {
  const data = useMemo(
    () => [...rows].sort((a, b) => (a.date > b.date ? -1 : 1)).map((r, i) => ({ ...r, _k: i })),
    [rows]
  );

  const columns = [
    {
      title: 'Date', dataIndex: 'date', width: 130,
      render: (v, r) => (
        <span>
          {v} {r.pending && <Tag color="warning" style={{ marginInlineEnd: 0 }}>Pending</Tag>}
        </span>
      ),
    },
    { title: 'Brand', dataIndex: 'brand' },
    { title: 'Offer', dataIndex: 'offer' },
    { title: 'Media', dataIndex: 'media' },
    { title: 'Country', dataIndex: 'country', width: 80 },
    { title: 'Clicks', dataIndex: 'clicks', align: 'right', render: fmtInt },
    { title: 'Orders', dataIndex: 'orders', align: 'right', render: fmtInt },
    { title: 'Sale', dataIndex: 'sale', align: 'right', render: fmtMoney },
    { title: 'Commission', dataIndex: 'commission', align: 'right', render: fmtMoney2 },
    {
      title: 'CR', align: 'right',
      render: (_, r) => (r.clicks > 0 ? fmtPct(r.orders / r.clicks) : '—'),
    },
    {
      title: 'Ads Cost', dataIndex: 'adsCost', align: 'right',
      render: (v) => (v > 0 ? fmtMoney2(v) : '—'),
    },
  ];

  return (
    <Card size="small" title={`Detail Records (${data.length.toLocaleString()} rows)`} className="section-gap">
      <Table
        rowKey="_k"
        size="small"
        columns={columns}
        dataSource={data}
        scroll={{ x: 980 }}
        rowClassName={(r) => (r.pending ? 'pending-row' : '')}
        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t) => `${t.toLocaleString()} records` }}
      />
    </Card>
  );
}
