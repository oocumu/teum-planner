import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));

await rm(dist, { recursive: true, force: true });
await cp(join(root, 'public'), dist, { recursive: true });
await mkdir(join(dist, 'lib'), { recursive: true });
for (const file of ['parser.js', 'scheduler.js']) {
  await cp(join(root, 'src', file), join(dist, 'lib', file));
}
for (const dir of ['dashboard', 'metrics']) {
  if (existsSync(join(root, dir))) await cp(join(root, dir), join(dist, dir), { recursive: true });
}
await writeFile(
  join(dist, 'build.json'),
  JSON.stringify(
    {
      version: pkg.version,
      commit: process.env.GITHUB_SHA ?? 'local',
      builtAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
console.log(`built ${pkg.name}@${pkg.version} -> dist/`);
