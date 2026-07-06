import express from 'express';
import cors from 'cors';
import { generateDataset } from './mockData.js';
import { generateAiSummary } from './aiSummary.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Generated once at startup; deterministic (seeded).
// Real implementation: replace with the T+1/T+2 Amazon Affiliate API sync store.
const { records, meta } = generateDataset();
console.log(`[mock] ${records.length} detail records generated (${meta.dateRange.start} ~ ${meta.dateRange.end})`);

app.get('/api/meta', (_req, res) => res.json(meta));

/**
 * GET /api/records?start&end&brands&offers&media&countries  (csv values)
 * Returns detail rows; all aggregation happens on the frontend per spec.
 * NOTE: in production, role scoping MUST be enforced here from the auth
 * context — the demo's role switch is a frontend simulation only.
 */
app.get('/api/records', (req, res) => {
  const { start, end, brands, offers, media, countries } = req.query;
  const inCsv = (v, csv) => !csv || csv.split(',').includes(v);
  const out = records.filter(
    (r) =>
      (!start || r.date >= start) &&
      (!end || r.date <= end) &&
      inCsv(r.brand, brands) &&
      inCsv(r.offer, offers) &&
      inCsv(r.media, media) &&
      inCsv(r.country, countries)
  );
  res.json(out);
});

/** POST /api/ai/summary — body: pre-aggregated stats built by the frontend. */
app.post('/api/ai/summary', async (req, res) => {
  try {
    const result = await generateAiSummary(req.body || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[server] Mock API listening on http://localhost:${PORT}`));
