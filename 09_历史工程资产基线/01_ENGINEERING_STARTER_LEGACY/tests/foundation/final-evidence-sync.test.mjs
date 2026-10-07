import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const spec = new URL("../../spec/FINAL_DEV_READY/", import.meta.url);
const starter = new URL("../../", import.meta.url);

async function text(rel) {
  return readFile(new URL(rel, spec), "utf8");
}

test("current migration contract includes CR007 patch 000008", async () => {
  const migration = await text("08_DATABASE/08_MIGRATION_CONTRACT.md");
  assert.match(migration, /000008_price_visibility_closure\.sql/);
  assert.match(migration, /migrations `000003` through `000008`/);
});

test("current CR007 external gate register includes strict TypeScript gate", async () => {
  const register = await text("15_CHANGE_CONTROL/CR-007/CR-007_MASTER_REGISTER.md");
  assert.match(register, /\| EXT-TSC-01 \|/);
});

test("authorization evidence exactly covers generated operation index", async () => {
  const map = await text("09_STATE_PERMISSION_CONFIG/09_ENDPOINT_AUTHORIZATION_MAP.md");
  const index = JSON.parse(await readFile(new URL("packages/contracts/generated/operation-index.json", starter), "utf8"));
  const methods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "TRACE"]);
  const routes = new Set();
  for (const line of map.split(/\r?\n/)) {
    if (!line.startsWith("|")) continue;
    const cols = line.replace(/^\||\|$/g, "").split("|").map(x => x.trim().replaceAll("`", ""));
    if (cols.length >= 2 && methods.has(cols[0].toUpperCase()) && cols[1].startsWith("/")) routes.add(`${cols[0].toUpperCase()} ${cols[1]}`);
  }
  const operationRoutes = new Set(index.map(x => `${String(x.method).toUpperCase()} ${x.path}`));
  assert.equal(routes.size, 218);
  assert.deepEqual([...routes].sort(), [...operationRoutes].sort());
  assert.match(map, /\*\*TOTAL_ENDPOINTS = 218\*\*/);
});

test("independent review declares current baseline metrics instead of historical counts", async () => {
  const review = await text("13_TRACEABILITY/12_INDEPENDENT_REVIEW.md");
  assert.match(review, /OpenAPI operations checked: 218/);
  assert.match(review, /OpenAPI schemas checked: 180/);
  assert.match(review, /Physical tables checked: 96/);
  assert.match(review, /Permission rows checked: 43 RBAC codes/);
  assert.match(review, /CURRENT_BASELINE_METRICS = 218_OPERATIONS \/ 180_SCHEMAS \/ 96_TABLES \/ 43_RBAC/);
  assert.match(review, /Historical CR addenda below are retained as dated evidence only/);
});


test("full traceability reverse endpoint coverage exactly matches generated operation index", async () => {
  const matrix = await text("13_TRACEABILITY/12_FULL_TRACEABILITY_MATRIX.md");
  const index = JSON.parse(await readFile(new URL("packages/contracts/generated/operation-index.json", starter), "utf8"));
  const methods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "TRACE"]);
  const routes = new Set();
  for (const line of matrix.split(/\r?\n/)) {
    if (!line.startsWith("|")) continue;
    const cols = line.replace(/^\||\|$/g, "").split("|").map(x => x.trim().replaceAll("`", ""));
    if (!cols.length) continue;
    const first = cols[0];
    const firstSpace = first.indexOf(" ");
    if (firstSpace < 0) continue;
    const method = first.slice(0, firstSpace).toUpperCase();
    const path = first.slice(firstSpace + 1);
    if (methods.has(method) && path.startsWith("/")) routes.add(`${method} ${path}`);
  }
  const operationRoutes = new Set(index.map(x => `${String(x.method).toUpperCase()} ${x.path}`));
  assert.equal(routes.size, 218);
  assert.deepEqual([...routes].sort(), [...operationRoutes].sort());
  assert.match(matrix, /CURRENT_REVERSE_ENDPOINT_COVERAGE = 218\/218/);
});
