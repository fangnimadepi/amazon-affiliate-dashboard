import { Card, Col, Row, Statistic, Tooltip } from 'antd';
import { fmtInt, fmtMoney, fmtMoney2, fmtPct, fmtRatio } from '../format';

function deltaOf(cur, prev) {
  if (!prev) return null;
  return (cur - prev) / prev;
}

function Kpi({ title, value, delta, note, tip }) {
  const deltaEl =
    delta == null ? null : (
      <span style={{ fontSize: 12, marginLeft: 8, color: delta >= 0 ? '#16a34a' : '#dc2626' }}>
        {delta >= 0 ? '▲' : '▼'} {(Math.abs(delta) * 100).toFixed(1)}%
      </span>
    );
  const card = (
    <Card size="small" className="kpi-card">
      <Statistic title={title} valueRender={() => <span>{value}{deltaEl}</span>} />
      {note && <div className="kpi-note">{note}</div>}
    </Card>
  );
  return tip ? <Tooltip title={tip}>{card}</Tooltip> : card;
}

/** cur / prev are derived aggregates from aggregate.js (prev = preceding equal-length period). */
export default function KpiCards({ cur, prev }) {
  const affiliate = [
    { title: 'Clicks', value: fmtInt(cur.clicks), delta: deltaOf(cur.clicks, prev.clicks) },
    { title: 'Orders', value: fmtInt(cur.orders), delta: deltaOf(cur.orders, prev.orders) },
    { title: 'Sale (GMV)', value: fmtMoney(cur.sale), delta: deltaOf(cur.sale, prev.sale) },
    { title: 'Commission', value: fmtMoney(cur.commission), delta: deltaOf(cur.commission, prev.commission), note: 'Confirmed, may be revised' },
    { title: 'Conversion Rate', value: fmtPct(cur.cr), delta: deltaOf(cur.cr, prev.cr), tip: 'Orders ÷ Clicks' },
    { title: 'EPC', value: fmtMoney2(cur.epc), delta: deltaOf(cur.epc, prev.epc), tip: 'Commission ÷ Clicks' },
  ];
  const ads = [
    { title: 'Ads Cost', value: fmtMoney(cur.adsCost), delta: deltaOf(cur.adsCost, prev.adsCost) },
    { title: 'ROI', value: fmtRatio(cur.roi), delta: deltaOf(cur.roi, prev.roi), tip: 'Commission ÷ Ads Cost' },
    { title: 'CPC', value: fmtMoney2(cur.cpc), delta: deltaOf(cur.cpc, prev.cpc), tip: 'Ads Cost ÷ Paid Clicks' },
    { title: 'CTR', value: fmtPct(cur.ctr), delta: deltaOf(cur.ctr, prev.ctr), tip: 'Paid Clicks ÷ Impressions' },
  ];

  return (
    <>
      <Row gutter={[12, 12]} className="section-gap">
        {affiliate.map((k) => (
          <Col xs={12} sm={8} lg={4} key={k.title}><Kpi {...k} /></Col>
        ))}
      </Row>
      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        {ads.map((k) => (
          <Col xs={12} sm={6} key={k.title}><Kpi {...k} note={k.note || 'Paid channels (YouTube / TikTok)'} /></Col>
        ))}
      </Row>
    </>
  );
}
