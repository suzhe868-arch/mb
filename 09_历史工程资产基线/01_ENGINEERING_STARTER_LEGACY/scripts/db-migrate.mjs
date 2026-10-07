import pg from "pg";
import { readdir, readFile } from "node:fs/promises";
const { Client } = pg;
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required");
const client = new Client({ connectionString: url });
await client.connect();
await client.query("CREATE TABLE IF NOT EXISTS schema_migrations(filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
const dir = new URL("../database/migrations/", import.meta.url);
const files = (await readdir(dir)).filter(x => /^\d+.*\.sql$/.test(x)).sort();
for (const file of files) {
  const exists = await client.query("select 1 from schema_migrations where filename=$1", [file]);
  if (exists.rowCount) continue;
  const sql = await readFile(new URL(file, dir), "utf8");
  await client.query(sql);
  await client.query("insert into schema_migrations(filename) values($1)", [file]);
  console.log(`applied ${file}`);
}
await client.end();
