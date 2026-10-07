import pg from "pg";
const { Pool } = pg;
export function createDbPool(databaseUrl: string) {
  return new Pool({ connectionString: databaseUrl, max: 10, application_name: "mingbang-v1-api" });
}
