import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, parseItem, fromKst } from '../src/parser.js';

const NOW = fromKst(2026, 10, 15, 10, 0);
const iso = (...args) => new Date(fromKst(...args)).toISOString();

test('쉼표로 여러 항목을 나눈다', () => {
  assert.equal(parse('내일 3시 팀플 회의, 금요일까지 OSS 과제, 운동 좀 해야 함', NOW).length, 3);
});

test('시각이 있으면 event로 만든다', () => {
  const task = parseItem('내일 3시 팀플 회의', NOW);
  assert.equal(task.type, 'event');
  assert.equal(task.title, '팀플 회의');
  assert.equal(task.start, iso(2026, 10, 16, 15, 0));
});

test('오전/오후와 반을 해석한다', () => {
  assert.equal(parseItem('오전 9시 반 수업', NOW).start, iso(2026, 10, 15, 9, 30));
  assert.equal(parseItem('오후 11시 통화', NOW).start, iso(2026, 10, 15, 23, 0));
});

test('까지는 마감 todo가 된다', () => {
  const task = parseItem('금요일까지 OSS 과제 2시간', NOW);
  assert.equal(task.type, 'todo');
  assert.equal(task.title, 'OSS 과제');
  assert.equal(task.durationMin, 120);
  assert.equal(task.deadline, iso(2026, 10, 20, 23, 59));
});

test('다음 주 요일을 계산한다', () => {
  assert.equal(parseItem('다음주 월요일까지 보고서', NOW).deadline, iso(2026, 10, 23, 23, 59));
});

test('우선순위 키워드를 반영한다', () => {
  assert.equal(parseItem('운동 좀 해야 함', NOW).priority, 3);
  assert.equal(parseItem('꼭 은행 가기', NOW).priority, 1);
  assert.equal(parseItem('장보기', NOW).priority, 2);
});

test('제목에서 군더더기를 지운다', () => {
  assert.equal(parseItem('운동 좀 해야 함', NOW).title, '운동');
});
