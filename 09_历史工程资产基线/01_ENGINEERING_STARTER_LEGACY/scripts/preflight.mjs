import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
for (const script of ["verify-baseline.mjs", "verify-contracts.mjs", "verify-engineering-manifest.mjs"]) {
  const r = spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url))], { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log("DEV-00 preflight PASS");
