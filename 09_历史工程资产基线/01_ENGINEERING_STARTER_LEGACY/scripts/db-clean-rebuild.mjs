import pg from 'pg';
import { assertCleanRebuildEnvironment } from './clean-rebuild-policy.mjs';

assertCleanRebuildEnvironment(process.env.APP_ENV);
if (process.env.CLEAN_REBUILD_CONFIRM !== 'DROP_DEVELOPMENT_DATA') {
  throw new Error('CLEAN_REBUILD_REFUSED: set CLEAN_REBUILD_CONFIRM=DROP_DEVELOPMENT_DATA');
}
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required');

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query('DROP SCHEMA public CASCADE');
  await client.query('CREATE SCHEMA public');
} finally {
  await client.end();
}

await import('./db-migrate.mjs');
