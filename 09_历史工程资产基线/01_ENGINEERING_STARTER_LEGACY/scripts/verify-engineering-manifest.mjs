import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../", import.meta.url);
const manifest = await readFile(new URL("ENGINEERING_MANIFEST.sha256", root), "utf8");
let checked = 0;
for (const line of manifest.trim().split(/\r?\n/)) {
  const m = line.match(/^([0-9a-f]{64})  (.+)$/);
  if (!m) throw new Error(`bad engineering checksum line: ${line}`);
  const [, expected, rel] = m;
  const actual = createHash("sha256").update(await readFile(new URL(rel, root))).digest("hex");
  if (actual !== expected) throw new Error(`engineering checksum mismatch: ${rel}`);
  checked++;
}
console.log(`engineering manifest OK: ${checked}`);
