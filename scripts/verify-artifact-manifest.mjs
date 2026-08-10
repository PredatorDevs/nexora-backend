import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const [input = 'dist', manifestName = 'artifact-manifest.json'] =
  process.argv.slice(2);
const root = path.resolve(input);
const manifest = JSON.parse(
  await readFile(path.join(root, manifestName), 'utf8'),
);

for (const entry of manifest.files) {
  const absolute = path.join(root, entry.path);
  const metadata = await stat(absolute);
  const digest = createHash('sha256')
    .update(await readFile(absolute))
    .digest('hex');
  if (metadata.size !== entry.bytes || digest !== entry.sha256) {
    throw new Error(`Artifact integrity check failed: ${entry.path}`);
  }
}

process.stdout.write(`Verified ${manifest.files.length} artifact files.\n`);
