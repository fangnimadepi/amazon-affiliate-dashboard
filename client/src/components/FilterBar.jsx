import { Card, Col, DatePicker, Row, Select } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function FilterBar({ meta, role, range, filters, onRange, onFilters }) {
  const dataEnd = dayjs(meta.dateRange.end);
  const dataStart = dayjs(meta.dateRange.start);

  const presets = [
    { label: 'Last 7 Days', value: [dataEnd.subtract(6, 'day'), dataEnd] },
    { label: 'Last 30 Days', value: [dataEnd.subtract(29, 'day'), dataEnd] },
    { label: 'Last 90 Days', value: [dataStart, dataEnd] },
  ];

  const brandLocked = role.type === 'merchant';
  const mediaLocked = role.type === 'partner';

  const visibleBrands = brandLocked ? meta.brands.filter((b) => b.brand === role.brand) : meta.brands;
  const offerOptions = visibleBrands
    .flatMap((b) => b.offers.map((o) => ({ value: o, label: `${o} · ${b.brand}` })));

  const set = (patch) => onFilters({ ...filters, ...patch });

  return (
    <Card size="small">
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} md={12} lg={7}>
          <RangePicker
            style={{ width: '100%' }}
            value={range}
            presets={presets}
            allowClear={false}
            disabledDate={(d) => d.isBefore(dataStart, 'day') || d.isAfter(dataEnd, 'day')}
            onChange={(v) => v && onRange(v)}
          />
        </Col>
        <Col xs={24} md={12} lg={4}>
          <Select
            mode="multiple"
            allowClear
            maxTagCount={1}
            style={{ width: '100%' }}
            placeholder={brandLocked ? role.brand : 'All Brands'}
            disabled={brandLocked}
            value={brandLocked ? [] : filters.brands}
            options={meta.brands.map((b) => ({ value: b.brand, label: b.brand }))}
            onChange={(brands) => set({ brands, offers: [] })}
          />
        </Col>
        <Col xs={24} md={12} lg={5}>
          <Select
            mode="multiple"
            allowClear
            maxTagCount={1}
            style={{ width: '100%' }}
            placeholder="All Offers"
            value={filters.offers}
            options={offerOptions}
            onChange={(offers) => set({ offers })}
          />
        </Col>
        <Col xs={24} md={12} lg={4}>
          <Select
            mode="multiple"
            allowClear
            maxTagCount={1}
            style={{ width: '100%' }}
            placeholder={mediaLocked ? role.media : 'All Media'}
            disabled={mediaLocked}
            value={mediaLocked ? [] : filters.media}
            options={meta.media.map((m) => ({ value: m, label: m }))}
            onChange={(media) => set({ media })}
          />
        </Col>
        <Col xs={24} md={12} lg={4}>
          <Select
            mode="multiple"
            allowClear
            maxTagCount={2}
            style={{ width: '100%' }}
            placeholder="All Countries"
            value={filters.countries}
            options={meta.countries.map((c) => ({ value: c, label: c }))}
            onChange={(countries) => set({ countries })}
          />
        </Col>
      </Row>
    </Card>
  );
}
