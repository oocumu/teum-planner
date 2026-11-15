import { toKst, fromKst } from './parser.js';

const MIN_MS = 60000;
const SLOT_MS = 30 * MIN_MS;

function byUrgency(a, b) {
  if (a.priority !== b.priority) return a.priority - b.priority;
  const da = a.deadline ? Date.parse(a.deadline) : Infinity;
  const db = b.deadline ? Date.parse(b.deadline) : Infinity;
  return da - db;
}

function overlaps(busy, start, end) {
  return busy.some(([a, b]) => start < b && end > a);
}

function findSlot(busy, durMs, limit, opts) {
  const { now, days, dayStart, dayEnd } = opts;
  const k = toKst(now);
  const earliest = Math.ceil(now / SLOT_MS) * SLOT_MS;
  for (let i = 0; i < days; i++) {
    const open = fromKst(k.y, k.m, k.d + i, dayStart);
    const close = fromKst(k.y, k.m, k.d + i, dayEnd);
    for (let s = Math.max(open, earliest); s + durMs <= close; s += SLOT_MS) {
      if (s + durMs > limit) return null;
      if (!overlaps(busy, s, s + durMs)) return s;
    }
  }
  return null;
}

export function buildSchedule(tasks, options = {}) {
  const opts = { now: Date.now(), days: 7, dayStart: 9, dayEnd: 22, ...options };
  const busy = [];
  const placed = [];
  const unplaced = [];

  for (const task of tasks.filter((t) => t.type === 'event')) {
    const start = Date.parse(task.start);
    const end = start + task.durationMin * MIN_MS;
    busy.push([start, end]);
    placed.push({ ...task, end: new Date(end).toISOString() });
  }

  for (const task of tasks.filter((t) => t.type !== 'event').sort(byUrgency)) {
    const durMs = task.durationMin * MIN_MS;
    const limit = task.deadline ? Date.parse(task.deadline) : Infinity;
    const start = findSlot(busy, durMs, limit, opts);
    if (start === null) {
      unplaced.push(task);
      continue;
    }
    busy.push([start, start + durMs]);
    placed.push({
      ...task,
      start: new Date(start).toISOString(),
      end: new Date(start + durMs).toISOString(),
    });
  }

  placed.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  return { placed, unplaced };
}
