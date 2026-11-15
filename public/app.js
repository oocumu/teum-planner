import { parse } from './lib/parser.js';
import { buildSchedule } from './lib/scheduler.js';

const form = document.getElementById('form');
const input = document.getElementById('input');
const status = document.getElementById('status');
const result = document.getElementById('result');

const dayFmt = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'short' });
const timeFmt = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false });
const PRIORITY = { 1: '높음', 2: '보통', 3: '낮음' };

async function plan(text) {
  try {
    const res = await fetch('api/plan', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch {
    return { source: 'local', ...buildSchedule(parse(text)) };
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function render({ placed, unplaced, source }) {
  result.replaceChildren();
  const groups = new Map();
  for (const task of placed) {
    const key = dayFmt.format(new Date(task.start));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(task);
  }
  for (const [day, tasks] of groups) {
    const section = el('div', 'day');
    section.append(el('h2', '', day));
    for (const task of tasks) {
      const card = el('article', `card ${task.type} p${task.priority}`);
      card.append(
        el('span', 'time', `${timeFmt.format(new Date(task.start))} – ${timeFmt.format(new Date(task.end))}`),
        el('strong', '', task.title),
        el('span', 'tag', task.type === 'event' ? '약속' : `할 일 · ${PRIORITY[task.priority]}`),
      );
      section.append(card);
    }
    result.append(section);
  }
  if (unplaced.length) {
    const section = el('div', 'day unplaced');
    section.append(el('h2', '', '배치하지 못한 일'));
    for (const task of unplaced) section.append(el('article', 'card', task.title));
    result.append(section);
  }
  status.textContent = `${placed.length}개 배치 · ${source === 'ai' ? 'AI 분석' : '규칙 분석'}`;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  status.textContent = '정리하는 중…';
  render(await plan(text));
});
