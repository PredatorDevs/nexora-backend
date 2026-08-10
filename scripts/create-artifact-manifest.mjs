import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [input = 'dist', output = path.join(input, 'artifact-manifest.json')] =
  process.argv.slice(2);
const root = path.resolve(input);
const outputPath = path.resolve(output);
const files = [];

async function visit(directory) {
  const entries = await readdir(directory);
  entries.sort((left, right) => left.localeCompare(right));
  for (const name of entries) {
    const absolute = path.join(directory, name);
    if (absolute === outputPath) continue;
    const metadata = await stat(absolute);
    if (metadata.isDirectory()) await visit(absolute);
    if (metadata.isFile()) {
      const contents = await readFile(absolute);
      files.push({
        path: path.relative(root, absolute).split(path.sep).join('/'),
        bytes: contents.byteLength,
        sha256: createHash('sha256').update(contents).digest('hex'),
      });
    }
  }
}

await visit(root);
const manifest = {
  schemaVersion: 1,
  sourceDateEpoch: process.env.SOURCE_DATE_EPOCH ?? null,
  files,
};
await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(
  `Manifest written for ${files.length} files: ${outputPath}\n`,
);
