import { useMemo } from 'react';
import { Card, Table, Tag, Tooltip } from 'antd';
import { groupAgg } from '../aggregate';
import { fmtInt, fmtMoney, fmtMoney2, fmtPct, fmtRatio } from '../format';

/** Offer-level performance with conversion-rate change vs the previous period. */
export default function OffersTable({ curRows, prevRows }) {
  const data = useMemo(() => {
    const prev = new Map(groupAgg(prevRows, 'offer').map((o) => [o.key, o]));
    return groupAgg(curRows, 'offer').map((o) => {
      const p = prev.get(o.key);
      const crChange = p && p.cr > 0 ? (o.cr - p.cr) / p.cr : null;
      return { ...o, crChange };
    });
  }, [curRows, prevRows]);

  const columns = [
    { title: 'Offer', dataIndex: 'key', fixed: 'left', width: 110 },
    { title: 'Brand', dataIndex: 'brand', width: 100 },
    { title: 'Clicks', dataIndex: 'clicks', align: 'right', render: fmtInt, sorter: (a, b) => a.clicks - b.clicks },
    { title: 'Orders', dataIndex: 'orders', align: 'right', render: fmtInt, sorter: (a, b) => a.orders - b.orders },
    { title: 'Sale', dataIndex: 'sale', align: 'right', render: fmtMoney, sorter: (a, b) => a.sale - b.sale },
    {
      title: 'Commission', dataIndex: 'commission', align: 'right', render: fmtMoney,
      sorter: (a, b) => a.commission - b.commission, defaultSortOrder: 'descend',
    },
    {
      title: 'CR',
      dataIndex: 'cr',
      align: 'right',
      sorter: (a, b) => a.cr - b.cr,
      render: (v, r) => (
        <span>
          {fmtPct(v)}{' '}
          {r.crChange != null && (
            <Tooltip title="CR change vs previous period">
              <Tag color={r.crChange < -0.25 ? 'red' : r.crChange < 0 ? 'orange' : 'green'} style={{ marginInlineEnd: 0 }}>
                {r.crChange >= 0 ? '+' : ''}{(r.crChange * 100).toFixed(0)}%
              </Tag>
            </Tooltip>
          )}
        </span>
      ),
    },
    { title: 'EPC', dataIndex: 'epc', align: 'right', render: fmtMoney2, sorter: (a, b) => a.epc - b.epc },
    {
      title: 'ROI', dataIndex: 'roi', align: 'right',
      render: (v, r) => (r.adsCost > 0 ? fmtRatio(v) : '—'),
      sorter: (a, b) => a.roi - b.roi,
    },
  ];

  return (
    <Card size="small" title="Offer Performance" className="section-gap">
      <Table
        rowKey="key"
        size="small"
        columns={columns}
        dataSource={data}
        scroll={{ x: 860 }}
        pagination={{ pageSize: 8, showSizeChanger: false }}
      />
    </Card>
  );
}
