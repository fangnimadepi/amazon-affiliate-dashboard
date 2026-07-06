/**
 * AI data interpretation.
 *
 * If DEEPSEEK_API_KEY is set, the pre-aggregated stats are sent to DeepSeek
 * (OpenAI-compatible chat API) to produce a natural-language analysis.
 * Without a key, a built-in rule-based composer produces a comparable summary
 * from the same stats object, so the demo always works offline.
 */

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

const SYSTEM_PROMPT = `You are a senior affiliate-marketing data analyst for an Amazon Affiliate platform.
You will receive pre-aggregated daily performance stats as JSON (currency: USD).
Write a concise English analysis (5-8 sentences, plain prose, no markdown headers) covering:
1) overall trend vs the previous period, 2) brand growth highlights, 3) country/marketplace contribution,
4) notable offer performance, 5) anomaly alerts (e.g. conversion-rate drops), 6) one growth opportunity.
Quote concrete numbers and percentages. Note that the most recent 1-2 days are still syncing (T+1/T+2) and incomplete.`;

export async function generateAiSummary(stats) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (apiKey) {
    try {
      const resp = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: JSON.stringify(stats) },
          ],
          temperature: 0.4,
          max_tokens: 500,
        }),
      });
      if (!resp.ok) throw new Error(`DeepSeek HTTP ${resp.status}`);
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) return { summary: text, engine: 'deepseek-chat' };
    } catch (err) {
      console.warn('[aiSummary] DeepSeek call failed, falling back:', err.message);
    }
  }
  return { summary: buildFallbackSummary(stats), engine: 'built-in analyzer (no LLM key configured)' };
}

/* ---------- rule-based fallback ---------- */

const pct = (x) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`;
const money = (x) => `$${Number(x || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

function buildFallbackSummary(stats) {
  const s = [];
  const t = stats.totals || {};
  const p = stats.prevTotals || {};

  // 1. Overall trend
  if (p.commission > 0) {
    const chg = (t.commission - p.commission) / p.commission;
    s.push(
      `Commission for ${stats.range.start} ~ ${stats.range.end} reached ${money(t.commission)} on ${money(t.sale)} in sales, ` +
      `${chg >= 0 ? 'up' : 'down'} ${pct(Math.abs(chg)).replace('+', '')} versus the previous period.`
    );
  } else {
    s.push(`Commission for ${stats.range.start} ~ ${stats.range.end} reached ${money(t.commission)} on ${money(t.sale)} in sales.`);
  }
  s.push(`Overall conversion rate was ${(t.cr * 100).toFixed(2)}% with an EPC of $${(t.epc || 0).toFixed(2)}.`);

  // 2. Brand growth
  const brands = (stats.byBrand || []).filter((b) => b.prevCommission > 0);
  if (brands.length) {
    const best = [...brands].sort((a, b) => b.growth - a.growth)[0];
    s.push(`${best.brand} achieved the highest growth rate at ${pct(best.growth)} commission versus the previous period.`);
    const worst = [...brands].sort((a, b) => a.growth - b.growth)[0];
    if (worst.brand !== best.brand && worst.growth < -0.05) {
      s.push(`${worst.brand} declined ${pct(Math.abs(worst.growth)).replace('+', '')} and is worth monitoring.`);
    }
  }

  // 3. Country contribution
  const top = (stats.byCountry || [])[0];
  if (top) {
    s.push(`The ${top.country} marketplace contributed ${(top.saleShare * 100).toFixed(1)}% of total sales${
      (stats.byCountry || [])[1] ? `, followed by ${stats.byCountry[1].country} at ${(stats.byCountry[1].saleShare * 100).toFixed(1)}%` : ''
    }.`);
  }

  // 4/5. Offers & anomalies
  const topOffer = (stats.topOffers || [])[0];
  if (topOffer) {
    s.push(`${topOffer.offer} (${topOffer.brand}) was the top earner with ${money(topOffer.commission)} in commission.`);
  }
  const bad = (stats.decliningOffers || [])[0];
  if (bad) {
    s.push(
      `Alert: ${bad.offer} (${bad.brand}) experienced a noticeable conversion-rate decline ` +
      `(${(bad.prevCr * 100).toFixed(2)}% → ${(bad.cr * 100).toFixed(2)}%, ${pct(bad.crChange)}) and should be reviewed.`
    );
  }

  // 6. Opportunity + data caveat
  const opp = (stats.opportunities || [])[0];
  if (opp) {
    s.push(
      `Growth opportunity: ${opp.offer} (${opp.brand}) shows a high EPC of $${opp.epc.toFixed(2)} on relatively low traffic ` +
      `(${opp.clicks.toLocaleString()} clicks) — scaling exposure could lift commission.`
    );
  }
  s.push('Note: the most recent 1-2 days are still syncing (T+1/T+2) and figures may be revised upward.');

  return s.join(' ');
}
