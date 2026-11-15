import { parse } from './parser.js';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const TYPES = new Set(['event', 'todo']);

function buildPrompt(text, now) {
  return [
    '다음 입력을 일정 목록으로 정리해 JSON으로만 답하라.',
    `현재 시각(UTC): ${new Date(now).toISOString()}, 사용자 시간대: Asia/Seoul`,
    '형식: {"tasks":[{"title":string,"type":"event"|"todo","start":ISO8601|null,"deadline":ISO8601|null,"durationMin":number,"priority":1|2|3}]}',
    'event는 시작 시각이 정해진 일, todo는 시각이 없는 할 일이다. priority는 1이 가장 급하다.',
    `입력: ${text}`,
  ].join('\n');
}

function isoOrNull(value) {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

export function normalize(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t) => t && typeof t.title === 'string' && t.title.trim())
    .map((t) => {
      const start = isoOrNull(t.start);
      const type = TYPES.has(t.type) && !(t.type === 'event' && !start) ? t.type : 'todo';
      return {
        title: t.title.trim(),
        type,
        start: type === 'event' ? start : null,
        deadline: isoOrNull(t.deadline),
        durationMin: Number.isFinite(t.durationMin) && t.durationMin > 0 ? Math.round(t.durationMin) : 60,
        priority: [1, 2, 3].includes(t.priority) ? t.priority : 2,
      };
    });
}

export async function extractTasks(text, options = {}) {
  const {
    now = Date.now(),
    apiKey = process.env.GEMINI_API_KEY,
    model = process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    fetchImpl = globalThis.fetch,
  } = options;

  if (!apiKey) return { source: 'rule', tasks: parse(text, now) };

  try {
    const res = await fetchImpl(`${ENDPOINT}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(text, now) }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const tasks = normalize(JSON.parse(raw.replace(/```(json)?/g, '')).tasks);
    if (tasks.length) return { source: 'ai', tasks };
  } catch (err) {
    return { source: 'rule', tasks: parse(text, now), error: err.message };
  }
  return { source: 'rule', tasks: parse(text, now) };
}
