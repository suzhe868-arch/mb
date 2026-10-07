export interface AppConfig {
  host: string;
  port: number;
  databaseUrl: string;
  logLevel: string;
}
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  return {
    host: env.API_HOST ?? "0.0.0.0",
    port: Number(env.API_PORT ?? 3000),
    databaseUrl,
    logLevel: env.LOG_LEVEL ?? "info"
  };
}
