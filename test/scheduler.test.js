import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, fromKst } from '../src/parser.js';
import { buildSchedule } from '../src/scheduler.js';

const NOW = fromKst(2026, 10, 15, 10, 0);
const iso = (...args) => new Date(fromKst(...args)).toISOString();

test('고정 일정을 피해서 할 일을 배치한다', () => {
  const tasks = parse('오늘 10시 회의 2시간, 과제', NOW);
  const { placed, unplaced } = buildSchedule(tasks, { now: NOW });
  assert.equal(unplaced.length, 0);
  const todo = placed.find((t) => t.title === '과제');
  assert.equal(todo.start, iso(2026, 10, 15, 12, 0));
});

test('우선순위가 높은 일을 먼저 배치한다', () => {
  const tasks = parse('운동 좀, 꼭 은행 가기', NOW);
  const { placed } = buildSchedule(tasks, { now: NOW });
  assert.equal(placed[0].title, '은행 가기');
});

test('마감 전에 자리가 없으면 배치하지 않는다', () => {
  const tasks = parse('오늘 10시 회의 12시간, 오늘까지 보고서', NOW);
  const { unplaced } = buildSchedule(tasks, { now: NOW });
  assert.equal(unplaced[0].title, '보고서');
});

test('결과는 시작 시각 순으로 정렬된다', () => {
  const { placed } = buildSchedule(parse('내일 4시 약속, 오늘 6시 저녁, 빨래', NOW), { now: NOW });
  const starts = placed.map((t) => Date.parse(t.start));
  assert.deepEqual(starts, [...starts].sort((a, b) => a - b));
});
