export interface ParsedJytPriceLabel {
  rawLabel: string;
  amountCents: number | null;
}

export function parseJytPriceLabel(input: string): ParsedJytPriceLabel {
  const rawLabel = input.trim();
  if (rawLabel === "价格咨询") return { rawLabel, amountCents: null };

  const match = /^(\d+(?:\.\d+)?)\s*(万|元)$/.exec(rawLabel);
  if (!match) throw new Error("PRICE_PARSE_FAILED");

  const yuan = Number(match[1]) * (match[2] === "万" ? 10_000 : 1);
  if (!Number.isFinite(yuan) || yuan <= 0 || !Number.isInteger(yuan * 100)) {
    throw new Error("PRICE_PARSE_FAILED");
  }
  return { rawLabel, amountCents: Math.round(yuan * 100) };
}


export function resolveBaseWholesalePriceCents(
  upstreamWholesalePriceCents: number | null,
  upstreamListPriceCents: number | null,
): number | null {
  return upstreamWholesalePriceCents ?? upstreamListPriceCents;
}
