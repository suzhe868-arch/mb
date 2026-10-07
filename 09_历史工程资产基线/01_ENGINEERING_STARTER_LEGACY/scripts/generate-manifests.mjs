import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function filesUnder(root, exclude) {
  const result = [];
  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      const relative = path.relative(root, absolute).replaceAll('\\', '/');
      if (exclude(relative, entry)) continue;
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile()) result.push(relative);
    }
  }
  await visit(root);
  return result.sort((a, b) => a.localeCompare(b, 'en'));
}

async function hashes(root, files) {
  return Promise.all(files.map(async relative => {
    const digest = createHash('sha256').update(await readFile(path.join(root, relative))).digest('hex');
    return `${digest}  ${relative}`;
  }));
}

async function writeFinalManifest(finalRoot) {
  const excluded = new Set(['PHYSICAL_CHECKSUMS.sha256', 'FINAL_DEV_READY_MANIFEST.md']);
  const files = await filesUnder(finalRoot, relative => excluded.has(relative));
  const lines = await hashes(finalRoot, files);
  await writeFile(path.join(finalRoot, 'PHYSICAL_CHECKSUMS.sha256'), `${lines.join('\n')}\n`, 'utf8');
  await writeFile(
    path.join(finalRoot, 'FINAL_DEV_READY_MANIFEST.md'),
    `# FINAL DEV READY MANIFEST\n\nBaseline: \`MB-V1-PREDEV-FINAL-2026-09-10.10\`\n\n\`\`\`text\n${lines.join('\n')}\n\`\`\`\n`,
    'utf8',
  );
}

const starterRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const finalRoot = path.resolve(starterRoot, '..', '名邦汽车_V1_FINAL_DEV_READY_2026-09-10_v10_CR007');
const mirroredFinal = path.join(starterRoot, 'spec', 'FINAL_DEV_READY');

await writeFinalManifest(finalRoot);
await writeFinalManifest(mirroredFinal);

const engineeringFiles = await filesUnder(starterRoot, (relative, entry) =>
  relative === 'ENGINEERING_MANIFEST.sha256' ||
  (entry.isDirectory() && (entry.name === 'node_modules' || entry.name === 'dist'))
);
const engineeringLines = await hashes(starterRoot, engineeringFiles);
await writeFile(path.join(starterRoot, 'ENGINEERING_MANIFEST.sha256'), `${engineeringLines.join('\n')}\n`, 'utf8');
console.log(`final=${(await filesUnder(finalRoot, relative => relative === 'PHYSICAL_CHECKSUMS.sha256' || relative === 'FINAL_DEV_READY_MANIFEST.md')).length} engineering=${engineeringFiles.length}`);
