import { env } from '../config/env';

const levels = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof levels;

function log(level: Level, message: string, meta?: unknown) {
  if (levels[level] < levels[env.LOG_LEVEL]) return;
  const line = `${new Date().toISOString()} ${level.toUpperCase()} ${message}`;
  const out = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (meta === undefined) out(line);
  else out(line, meta instanceof Error ? meta.stack ?? meta.message : meta);
}

export const logger = {
  debug: (m: string, meta?: unknown) => log('debug', m, meta),
  info: (m: string, meta?: unknown) => log('info', m, meta),
  warn: (m: string, meta?: unknown) => log('warn', m, meta),
  error: (m: string, meta?: unknown) => log('error', m, meta),
};
