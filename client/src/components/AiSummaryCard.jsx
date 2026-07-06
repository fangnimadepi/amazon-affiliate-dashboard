import { useState } from 'react';
import { Alert, Button, Card, Space, Tag, Typography } from 'antd';
import { fetchAiSummary } from '../api';

/**
 * AI data interpretation: the frontend pre-aggregates the currently filtered
 * dataset into a compact stats payload; the backend feeds it to DeepSeek
 * (or a built-in analyzer when no API key is configured).
 */
export default function AiSummaryCard({ buildStats }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await fetchAiSummary(buildStats()));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      size="small"
      className="section-gap"
      title={
        <Space>
          AI Insights
          {result && <Tag color="blue">{result.engine}</Tag>}
        </Space>
      }
      extra={
        <Button type="primary" size="small" loading={loading} onClick={generate}>
          {result ? 'Regenerate' : 'Generate AI Insights'}
        </Button>
      }
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 8 }} />}
      {result ? (
        <Typography.Paragraph style={{ marginBottom: 0, lineHeight: 1.8 }}>
          {result.summary}
        </Typography.Paragraph>
      ) : (
        <Typography.Text type="secondary">
          Generates a natural-language analysis of the currently filtered data: overall trend, brand growth,
          marketplace contribution, offer performance, anomaly alerts and growth opportunities.
        </Typography.Text>
      )}
    </Card>
  );
}
