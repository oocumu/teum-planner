const DAY_MS = 86400000;
const OFFSET_MS = 9 * 3600000;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function toKst(ms) {
  const d = new Date(ms + OFFSET_MS);
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth(),
    d: d.getUTCDate(),
    w: d.getUTCDay(),
    h: d.getUTCHours(),
    min: d.getUTCMinutes(),
  };
}

export function fromKst(y, m, d, h = 0, min = 0) {
  return Date.UTC(y, m, d, h, min) - OFFSET_MS;
}

const DAY_RE = /(오늘|내일|모레|(다음\s*주\s*)?([일월화수목금토])요일)/;
const TIME_RE = /(오전|오후|아침|저녁|밤)?\s*(\d{1,2})\s*시(?!간)(?:\s*(\d{1,2})\s*분|\s*(반))?/;
const DURATION_RE = /(\d+(?:\.\d+)?)\s*시간(?:\s*동안)?|(\d+)\s*분\s*동안/;
const DEADLINE_RE = /까지/;
const HIGH_RE = /급함|급하게|중요|꼭|반드시/;
const LOW_RE = /여유|천천히|좀|시간\s*나면/;
const FILLER_RE = /(해야\s*(함|됨|해|한다)|하기|할\s*것|에|는|은)$/;

function resolveDay(text, now) {
  const match = text.match(DAY_RE);
  if (!match) return null;
  const k = toKst(now);
  let offset;
  if (match[1] === '오늘') offset = 0;
  else if (match[1] === '내일') offset = 1;
  else if (match[1] === '모레') offset = 2;
  else {
    offset = (WEEKDAYS.indexOf(match[3]) - k.w + 7) % 7;
    if (match[2]) offset += 7;
  }
  return toKst(fromKst(k.y, k.m, k.d) + offset * DAY_MS);
}

function resolveTime(text) {
  const match = text.match(TIME_RE);
  if (!match) return null;
  let h = Number(match[2]);
  const min = match[4] ? 30 : Number(match[3] ?? 0);
  const pm = ['오후', '저녁', '밤'].includes(match[1]);
  if ((pm && h < 12) || (!match[1] && h >= 1 && h <= 7)) h += 12;
  if (h > 23 || min > 59) return null;
  return { h, min };
}

function resolveDuration(text) {
  const match = text.match(DURATION_RE);
  if (!match) return null;
  return match[1] ? Math.round(Number(match[1]) * 60) : Number(match[2]);
}

function cleanTitle(text) {
  let title = text
    .replace(DAY_RE, ' ')
    .replace(TIME_RE, ' ')
    .replace(DURATION_RE, ' ')
    .replace(DEADLINE_RE, ' ')
    .replace(HIGH_RE, ' ')
    .replace(LOW_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  let prev;
  do {
    prev = title;
    title = title.replace(FILLER_RE, '').trim();
  } while (title !== prev);
  return title || text.trim();
}

export function parseItem(text, now = Date.now()) {
  const day = resolveDay(text, now);
  const time = resolveTime(text);
  const duration = resolveDuration(text);
  const priority = HIGH_RE.test(text) ? 1 : LOW_RE.test(text) ? 3 : 2;
  const task = {
    title: cleanTitle(text),
    type: 'todo',
    start: null,
    deadline: null,
    durationMin: duration ?? 60,
    priority,
  };

  if (DEADLINE_RE.test(text)) {
    const base = day ?? toKst(now);
    const at = time
      ? fromKst(base.y, base.m, base.d, time.h, time.min)
      : fromKst(base.y, base.m, base.d, 23, 59);
    task.deadline = new Date(at).toISOString();
  } else if (time) {
    const base = day ?? toKst(now);
    task.type = 'event';
    task.start = new Date(fromKst(base.y, base.m, base.d, time.h, time.min)).toISOString();
  } else if (day) {
    task.deadline = new Date(fromKst(day.y, day.m, day.d, 23, 59)).toISOString();
  }
  return task;
}

export function parse(text, now = Date.now()) {
  return String(text)
    .split(/[,\n;]|그리고/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => parseItem(s, now));
}
