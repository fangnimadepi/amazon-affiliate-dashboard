export const fmtInt = (x) => Number(x || 0).toLocaleString('en-US');
export const fmtMoney = (x) => `$${Number(x || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
export const fmtMoney2 = (x) => `$${Number(x || 0).toFixed(2)}`;
export const fmtPct = (x) => `${(Number(x || 0) * 100).toFixed(2)}%`;
export const fmtRatio = (x) => Number(x || 0).toFixed(2);
