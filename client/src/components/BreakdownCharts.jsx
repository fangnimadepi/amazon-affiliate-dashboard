import { useMemo } from 'react';
import { Card, Col, Row } from 'antd';
import EChart, { PALETTE } from './EChart';
import { groupAgg } from '../aggregate';

function barOption(data, name) {
  return {
    grid: { left: 60, right: 16, top: 30, bottom: 50 },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
    },
    xAxis: { type: 'category', data: data.map((d) => d.key), axisLabel: { rotate: 25, fontSize: 11 } },
    yAxis: { type: 'value' },
    series: [
      {
        name,
        type: 'bar',
        barMaxWidth: 34,
        data: data.map((d, i) => ({
          value: Math.round(d.commission),
          itemStyle: { color: PALETTE[i % PALETTE.length], borderRadius: [4, 4, 0, 0] },
        })),
      },
    ],
  };
}

function donutOption(data) {
  return {
    tooltip: { trigger: 'item', valueFormatter: (v) => `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
    legend: { bottom: 0, itemWidth: 12, itemHeight: 12, textStyle: { fontSize: 11 } },
    color: PALETTE,
    series: [
      {
        name: 'Sale',
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '44%'],
        label: { formatter: '{b}: {d}%', fontSize: 11 },
        data: data.map((d) => ({ name: d.key, value: Math.round(d.sale) })),
      },
    ],
  };
}

/**
 * Dimension breakdowns adapt to role:
 *  - Merchant sees own offers instead of a single-brand chart
 *  - Partner sees own offers instead of a single-media chart
 */
export default function BreakdownCharts({ rows, role }) {
  const byBrand = useMemo(() => groupAgg(rows, 'brand').slice(0, 8), [rows]);
  const byOffer = useMemo(() => groupAgg(rows, 'offer').slice(0, 8), [rows]);
  const byMedia = useMemo(() => groupAgg(rows, 'media'), [rows]);
  const byCountry = useMemo(() => groupAgg(rows, 'country'), [rows]);

  const left =
    role.type === 'merchant'
      ? { title: 'Commission by Offer', data: byOffer }
      : { title: 'Commission by Brand', data: byBrand };
  const right =
    role.type === 'partner'
      ? { title: 'Commission by Offer', data: byOffer }
      : { title: 'Commission by Media', data: byMedia };

  return (
    <Row gutter={[12, 12]} className="section-gap">
      <Col xs={24} lg={9}>
        <Card size="small" title={left.title}>
          <EChart option={barOption(left.data, 'Commission')} height={280} />
        </Card>
      </Col>
      <Col xs={24} lg={6}>
        <Card size="small" title="Country Contribution (Sale)">
          <EChart option={donutOption(byCountry)} height={280} />
        </Card>
      </Col>
      <Col xs={24} lg={9}>
        <Card size="small" title={right.title}>
          <EChart option={barOption(right.data, 'Commission')} height={280} />
        </Card>
      </Col>
    </Row>
  );
}
