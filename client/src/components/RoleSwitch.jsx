import { Select, Space, Tag } from 'antd';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'merchant', label: 'Merchant (Brand)' },
  { value: 'partner', label: 'Partner (Media)' },
];

/**
 * Demo-only role simulation. In production the scope comes from the login
 * session and is enforced server-side.
 */
export default function RoleSwitch({ meta, role, onChange }) {
  const brands = meta.brands.map((b) => ({ value: b.brand, label: b.brand }));
  const media = meta.media.map((m) => ({ value: m, label: m }));

  const setType = (type) => {
    if (type === 'merchant') onChange({ type, brand: meta.brands[0].brand, media: null });
    else if (type === 'partner') onChange({ type, brand: null, media: meta.media[0] });
    else onChange({ type: 'admin', brand: null, media: null });
  };

  return (
    <Space wrap>
      <Tag color="geekblue" style={{ marginRight: 0 }}>Role Switch</Tag>
      <Select size="middle" style={{ width: 160 }} value={role.type} options={ROLE_OPTIONS} onChange={setType} />
      {role.type === 'merchant' && (
        <Select
          style={{ width: 140 }}
          value={role.brand}
          options={brands}
          onChange={(brand) => onChange({ ...role, brand })}
        />
      )}
      {role.type === 'partner' && (
        <Select
          style={{ width: 140 }}
          value={role.media}
          options={media}
          onChange={(m) => onChange({ ...role, media: m })}
        />
      )}
    </Space>
  );
}
