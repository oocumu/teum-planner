import { access, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dist = resolve(process.argv[2] ?? 'dist');
const required = ['index.html', 'app.js', 'style.css', 'lib/parser.js', 'lib/scheduler.js', 'build.json'];

for (const file of required) {
  await access(join(dist, file));
}
const info = JSON.parse(await readFile(join(dist, 'build.json'), 'utf8'));
const { parse } = await import(pathToFileURL(join(dist, 'lib', 'parser.js')).href);
if (parse('내일 3시 회의').length !== 1) throw new Error('dist parser broken');
console.log(`dist ok (${info.version}, ${info.commit.slice(0, 7)})`);
