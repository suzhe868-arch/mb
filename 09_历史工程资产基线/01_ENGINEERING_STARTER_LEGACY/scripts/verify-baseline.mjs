import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../spec/FINAL_DEV_READY/", import.meta.url);
const manifest = await readFile(new URL("PHYSICAL_CHECKSUMS.sha256", root), "utf8");
let checked = 0;
for (const line of manifest.trim().split(/\r?\n/)) {
  const m = line.match(/^([0-9a-f]{64})  (.+)$/);
  if (!m) throw new Error(`bad checksum line: ${line}`);
  const [, expected, rel] = m;
  const bytes = await readFile(new URL(rel, root));
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== expected) throw new Error(`baseline checksum mismatch: ${rel}`);
  checked++;
}
console.log(`baseline checksums OK: ${checked}`);
