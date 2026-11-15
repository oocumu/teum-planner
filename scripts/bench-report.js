import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const [dir = 'bench', out = 'docs/ci-optimization-report.md'] = process.argv.slice(2);

async function collect(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const full = join(path, entry.name);
    if (entry.isDirectory()) results.push(...(await collect(full)));
    else if (entry.name === 'bench.json') results.push(JSON.parse(await readFile(full, 'utf8')));
  }
  return results;
}

const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const fmt = (n) => n.toFixed(2);
const pct = (before, after) => (((before - after) / before) * 100).toFixed(1);

const results = (await collect(dir)).sort((a, b) => a.mode.localeCompare(b.mode) || a.run - b.run);
const pick = (mode) => results.filter((r) => r.mode === mode);
const before = pick('no-cache');
const after = pick('cache');
if (!before.length || !after.length) throw new Error('측정 결과가 부족합니다');

const b = { install: avg(before.map((r) => r.install)), total: avg(before.map((r) => r.total)) };
const a = { install: avg(after.map((r) => r.install)), total: avg(after.map((r) => r.total)) };
const hits = after.filter((r) => r.hit).length;
const date = new Date().toISOString().slice(0, 10);

const lines = [
  '# CI 최적화 리포트',
  '',
  `측정일: ${date} · 러너: ubuntu-latest · 반복: 모드별 ${before.length}회${process.env.RUN_URL ? ` · [실행 기록](${process.env.RUN_URL})` : ''}`,
  '',
  '## 캐시 적용 전후',
  '',
  '| 항목 | 캐시 없음 (평균) | 캐시 적용 (평균) | 개선률 |',
  '|---|---|---|---|',
  `| npm install | ${fmt(b.install)}s | ${fmt(a.install)}s | **${pct(b.install, a.install)}%** |`,
  `| 설치 + Lint + Test | ${fmt(b.total)}s | ${fmt(a.total)}s | **${pct(b.total, a.total)}%** |`,
  '',
  `캐시 적중: ${hits}/${after.length}회`,
  '',
  '개선률 = (캐시 없음 − 캐시 적용) / 캐시 없음 × 100',
  '',
  '## 회차별 결과',
  '',
  '| 모드 | 회차 | 캐시 적중 | npm install | 설치 + Lint + Test |',
  '|---|---|---|---|---|',
  ...results.map((r) => `| ${r.mode} | ${r.run} | ${r.hit ? 'O' : '-'} | ${fmt(r.install)}s | ${fmt(r.total)}s |`),
  '',
  '## 적용한 최적화',
  '',
  '| 항목 | 7주차 | 8주차 |',
  '|---|---|---|',
  '| 의존성 설치 | 잡마다 setup-node + npm install 반복 | Composite Action `setup-deps`로 통합, `~/.npm` 캐시 |',
  '| Matrix 테스트 | ci.yml에 직접 정의 (2 OS × 2 Node) | Reusable Workflow `reusable-test.yml` (3 OS × 2 Node, macOS·Node 20 제외, Node 24 커버리지 추가) |',
  '| PR 실행 범위 | 전체 Matrix | ubuntu만 실행 |',
  '| 문서만 변경 | 전체 파이프라인 + 배포 | 변경 감지로 Lint·Build·Test·Deploy 생략 |',
  '| 배포 조건 | main push | main push + 앱 코드 변경 |',
  '| 중복 실행 | 없음 | `concurrency`로 이전 실행 취소 |',
  '',
];

await mkdir(dirname(out), { recursive: true });
await writeFile(out, lines.join('\n'));
console.log(lines.join('\n'));
