import { useMemo, useState } from 'react';
import { Card, Segmented } from 'antd';
import EChart from './EChart';

const METRICS = [
  { key: 'commission', label: 'Commission', fmt: (v) => `$${v.toFixed(0)}` },
  { key: 'sale', label: 'Sale', fmt: (v) => `$${v.toFixed(0)}` },
  { key: 'clicks', label: 'Clicks', fmt: (v) => v.toLocaleString() },
  { key: 'orders', label: 'Orders', fmt: (v) => v.toLocaleString() },
  { key: 'cr', label: 'CR %', fmt: (v) => `${(v * 100).toFixed(2)}%` },
  { key: 'epc', label: 'EPC', fmt: (v) => `$${v.toFixed(2)}` },
  { key: 'roi', label: 'ROI', fmt: (v) => v.toFixed(2) },
];

/** Daily trend with the T+1/T+2 pending window shaded. */
export default function TrendChart({ series, pendingDates }) {
  const [metric, setMetric] = useState('commission');
  const m = METRICS.find((x) => x.key === metric);

  const option = useMemo(() => {
    const isPct = metric === 'cr';
    const pendingInRange = series.filter((d) => d.pending).map((d) => d.date);
    return {
      grid: { left: 56, right: 20, top: 36, bottom: 40 },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (v) => m.fmt(Number(v) || 0),
      },
      xAxis: { type: 'category', data: series.map((d) => d.date), axisLabel: { rotate: 30, fontSize: 11 } },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: isPct ? (v) => `${(v * 100).toFixed(1)}%` : undefined },
      },
      series: [
        {
          name: m.label,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          data: series.map((d) => Math.round(d[metric] * 10000) / 10000),
          lineStyle: { width: 2.5, color: '#1e3a8a' },
          itemStyle: { color: '#1e3a8a' },
          areaStyle: { color: 'rgba(30,58,138,0.08)' },
          markArea: pendingInRange.length
            ? {
                silent: true,
                itemStyle: { color: 'rgba(250,173,20,0.12)' },
                label: { show: true, position: 'insideTop', color: '#b45309', fontSize: 11, formatter: 'Data Pending (T+1/T+2)' },
                data: [[{ xAxis: pendingInRange[0] }, { xAxis: pendingInRange[pendingInRange.length - 1] }]],
              }
            : undefined,
        },
      ],
    };
  }, [series, metric, m, pendingDates]);

  return (
    <Card
      size="small"
      title="Daily Trend"
      extra={<Segmented size="small" value={metric} onChange={setMetric} options={METRICS.map((x) => ({ value: x.key, label: x.label }))} />}
      className="section-gap"
    >
      <EChart option={option} height={320} />
    </Card>
  );
}
