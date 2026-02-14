export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function formatPercent(n: number): string {
  return `${Math.round(n)}%`;
}

export function formatBsr(bsr: number, total?: number): string {
  const formatted = formatNumber(bsr);
  if (total) {
    const pct = ((bsr / total) * 100).toFixed(1);
    return `${formatted} (Top ${pct}%)`;
  }
  return formatted;
}
