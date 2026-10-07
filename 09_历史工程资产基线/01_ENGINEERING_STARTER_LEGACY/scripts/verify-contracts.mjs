import { readFile } from "node:fs/promises";

const registry = await readFile(new URL("../spec/FINAL_DEV_READY/09_STATE_PERMISSION_CONFIG/09_PERMISSION_CODE_REGISTRY.md", import.meta.url), "utf8");
const map = await readFile(new URL("../spec/FINAL_DEV_READY/09_STATE_PERMISSION_CONFIG/09_ENDPOINT_AUTHORIZATION_MAP.md", import.meta.url), "utf8");
const operationIndex = JSON.parse(await readFile(new URL("../packages/contracts/generated/operation-index.json", import.meta.url), "utf8"));

const registered = new Set([...registry.matchAll(/\| `([^`]+)` \|/g)].map(x => x[1]).filter(x => x.includes(".")));
const nonRbac = new Set(["auth.staff.session", "auth.system_admin.session", "customer.session", "customer.self", "jyt.integration.ingest", "service credential + source allowlist"]);
const methods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "TRACE"]);
const used = new Set();
const authRoutes = new Set();

for (const line of map.split(/\r?\n/)) {
  if (!line.startsWith("|")) continue;
  const cols = line.replace(/^\||\|$/g, "").split("|").map(x => x.trim().replaceAll("`", ""));
  if (cols.length < 4 || !methods.has(cols[0].toUpperCase()) || !cols[1].startsWith("/")) continue;
  const route = `${cols[0].toUpperCase()} ${cols[1]}`;
  if (authRoutes.has(route)) throw new Error(`duplicate endpoint authorization row: ${route}`);
  authRoutes.add(route);
  const permission = cols[3];
  if (permission && permission !== "—") used.add(permission);
}

const operationRoutes = new Set(operationIndex.map(op => `${String(op.method).toUpperCase()} ${op.path}`));
if (operationRoutes.size !== operationIndex.length) throw new Error("generated operation index contains duplicate method/path entries");

const missingRoutes = [...operationRoutes].filter(route => !authRoutes.has(route));
const extraRoutes = [...authRoutes].filter(route => !operationRoutes.has(route));
if (missingRoutes.length || extraRoutes.length) {
  throw new Error(`endpoint authorization coverage mismatch: missing=[${missingRoutes.join(", ")}] extra=[${extraRoutes.join(", ")}]`);
}

const declaredTotal = map.match(/\*\*TOTAL_ENDPOINTS = (\d+)\*\*/)?.[1];
if (!declaredTotal) throw new Error("TOTAL_ENDPOINTS declaration missing from authorization map");
if (Number(declaredTotal) !== operationRoutes.size) {
  throw new Error(`TOTAL_ENDPOINTS stale: declared=${declaredTotal} actual=${operationRoutes.size}`);
}

const missing = [...used].filter(x => !registered.has(x) && !nonRbac.has(x));
if (missing.length) throw new Error(`unclassified permission/capability: ${missing.join(", ")}`);

console.log(`authorization contract OK: ${authRoutes.size}/${operationRoutes.size} endpoints, ${used.size} used markers, ${registered.size} RBAC, ${nonRbac.size} non-RBAC markers`);
