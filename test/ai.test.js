import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractTasks, normalize } from '../src/ai.js';

const fakeFetch = (payload, ok = true) => async () => ({
  ok,
  status: ok ? 200 : 429,
  json: async () => ({ candidates: [{ content: { parts: [{ text: payload }] } }] }),
});

test('키가 없으면 규칙 파서를 쓴다', async () => {
  const { source, tasks } = await extractTasks('내일 3시 회의', { apiKey: '' });
  assert.equal(source, 'rule');
  assert.equal(tasks.length, 1);
});

test('AI 응답을 정규화한다', async () => {
  const body = '```json\n{"tasks":[{"title":"회의","type":"event","start":"2026-11-16T06:00:00Z","durationMin":30,"priority":1}]}\n```';
  const { source, tasks } = await extractTasks('회의', { apiKey: 'test', fetchImpl: fakeFetch(body) });
  assert.equal(source, 'ai');
  assert.equal(tasks[0].durationMin, 30);
});

test('AI 오류 시 규칙 파서로 대체한다', async () => {
  const { source } = await extractTasks('과제', { apiKey: 'test', fetchImpl: fakeFetch('', false) });
  assert.equal(source, 'rule');
});

test('잘못된 필드를 기본값으로 바꾼다', () => {
  const [task] = normalize([{ title: ' 운동 ', type: 'event', start: 'x', priority: 9 }]);
  assert.deepEqual(task, { title: '운동', type: 'todo', start: null, deadline: null, durationMin: 60, priority: 2 });
});

test('실제 Gemini API 호출', { skip: !process.env.GEMINI_API_KEY }, async () => {
  const { tasks } = await extractTasks('내일 오후 3시 팀 회의');
  assert.ok(tasks.length >= 1);
});
