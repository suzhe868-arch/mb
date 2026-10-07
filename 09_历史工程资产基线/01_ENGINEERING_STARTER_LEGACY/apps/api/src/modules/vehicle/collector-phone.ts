export interface CollectorTargetInput {
  baseUrl: string;
  phonePath: string;
  allowedOrigins: readonly string[];
}

export function validateCollectorTarget(input: CollectorTargetInput) {
  if (!input.phonePath.startsWith("/") || input.phonePath.startsWith("//")) {
    throw new Error("COLLECTOR_PHONE_PATH_MUST_BE_RELATIVE");
  }
  const base = new URL(input.baseUrl);
  if (base.username || base.password || base.search || base.hash || base.pathname !== "/") {
    throw new Error("COLLECTOR_BASE_URL_INVALID");
  }
  if (!input.allowedOrigins.includes(base.origin)) throw new Error("COLLECTOR_ORIGIN_NOT_ALLOWED");
  return { origin: base.origin, phonePath: input.phonePath };
}
