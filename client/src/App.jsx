import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Spin } from 'antd';
import dayjs from 'dayjs';
import { fetchMeta, fetchRecords } from './api';
import { agg, buildAiStats, dailySeries } from './aggregate';
import RoleSwitch from './components/RoleSwitch';
import FilterBar from './components/FilterBar';
import KpiCards from './components/KpiCards';
import TrendChart from './components/TrendChart';
import BreakdownCharts from './components/BreakdownCharts';
import OffersTable from './components/OffersTable';
import AiSummaryCard from './components/AiSummaryCard';
import DetailTable from './components/DetailTable';

const EMPTY_FILTERS = { brands: [], offers: [], media: [], countries: [] };

export default function App() {
  const [meta, setMeta] = useState(null);
  const [metaError, setMetaError] = useState(null);
  const [role, setRole] = useState({ type: 'admin', brand: null, media: null });
  const [range, setRange] = useState(null); // [dayjs, dayjs]
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [rows, setRows] = useState([]); // extended: previous period + current period
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeta()
      .then((m) => {
        setMeta(m);
        const end = dayjs(m.dateRange.end);
        setRange([end.subtract(29, 'day'), end]); // default: Last 30 Days
      })
      .catch((e) => setMetaError(e.message));
  }, []);

  // Role change resets manual filters (scope is applied automatically below).
  const changeRole = (r) => {
    setRole(r);
    setFilters(EMPTY_FILTERS);
  };

  // Effective query = manual filters + role scope.
  // NOTE: demo-only — production enforces this scope server-side from auth.
  const query = useMemo(() => {
    if (!range) return null;
    const q = { ...filters };
    if (role.type === 'merchant') q.brands = [role.brand];
    if (role.type === 'partner') q.media = [role.media];
    const days = range[1].diff(range[0], 'day') + 1;
    return {
      ...q,
      // fetch the preceding equal-length window too, for period-over-period comparison
      start: range[0].subtract(days, 'day').format('YYYY-MM-DD'),
      end: range[1].format('YYYY-MM-DD'),
    };
  }, [range, filters, role]);

  useEffect(() => {
    if (!query) return;
    let alive = true;
    setLoading(true);
    fetchRecords(query)
      .then((data) => alive && setRows(data))
      .catch((e) => alive && setMetaError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [query]);

  const startStr = range ? range[0].format('YYYY-MM-DD') : '';
  const endStr = range ? range[1].format('YYYY-MM-DD') : '';

  const { curRows, prevRows } = useMemo(() => {
    const cur = [];
    const prev = [];
    for (const r of rows) (r.date >= startStr ? cur : prev).push(r);
    return { curRows: cur, prevRows: prev };
  }, [rows, startStr]);

  const curAgg = useMemo(() => agg(curRows), [curRows]);
  const prevAgg = useMemo(() => agg(prevRows), [prevRows]);
  const series = useMemo(() => dailySeries(curRows), [curRows]);

  const roleLabel =
    role.type === 'admin' ? 'Admin (all data)'
      : role.type === 'merchant' ? `Merchant: ${role.brand}`
      : `Partner: ${role.media}`;

  const buildStats = useCallback(
    () => buildAiStats(curRows, prevRows, { start: startStr, end: endStr }, roleLabel),
    [curRows, prevRows, startStr, endStr, roleLabel]
  );

  const pendingInView = useMemo(
    () => (meta ? meta.pendingDates.filter((d) => d >= startStr && d <= endStr) : []),
    [meta, startStr, endStr]
  );

  if (metaError) {
    return (
      <div style={{ padding: 48 }}>
        <Alert
          type="error"
          showIcon
          message="Cannot reach the mock API server"
          description={`${metaError} — make sure the server is running: cd server && npm start (port 3001).`}
        />
      </div>
    );
  }
  if (!meta || !range) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <header className="app-header">
        <div className="app-logo">
          Yeah<span className="accent">Promos</span>
          <span className="sub">Amazon Affiliate Insights · Daily</span>
        </div>
        <div>
          <RoleSwitch meta={meta} role={role} onChange={changeRole} />
          <div className="role-hint" style={{ textAlign: 'right', marginTop: 2 }}>{roleLabel}</div>
        </div>
      </header>

      <main className="app-content">
        {pendingInView.length > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message={`Data Pending: ${pendingInView.join(', ')} — API sync runs on a T+1 ~ T+2 delay; recent figures are incomplete and historical data may be restated (e.g. returns adjusting orders & commission).`}
          />
        )}

        <FilterBar meta={meta} role={role} range={range} filters={filters} onRange={setRange} onFilters={setFilters} />

        <Spin spinning={loading}>
          <KpiCards cur={curAgg} prev={prevAgg} />
          <AiSummaryCard buildStats={buildStats} />
          <TrendChart series={series} pendingDates={meta.pendingDates} />
          <BreakdownCharts rows={curRows} role={role} />
          <OffersTable curRows={curRows} prevRows={prevRows} />
          <DetailTable rows={curRows} />
        </Spin>
      </main>
    </div>
  );
}
