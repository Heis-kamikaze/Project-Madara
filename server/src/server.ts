import { env } from './config/env';
import { logger } from './lib/logger';
import { createApp } from './lication';
import * as jobs from './modules/jobs/jobs.service';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Aradam API listening on :${env.PORT} (${env.NODE_ENV}) — base path ${env.API_PREFIX}`);
});

// Optional in-process scheduler. In production on several instances, prefer Cloud Scheduler
// calling POST /internal/jobs/run instead (jobs are idempotent, so both is also safe).
let timer: NodeJS.Timeout | undefined;
if (env.ENABLE_INTERNAL_SCHEDULER) {
  timer = setInterval(() => {
    jobs.run('all').catch((err) => logger.error('Scheduled jobs failed', err));
  }, env.JOB_INTERVAL_MINUTES * 60_000);
  timer.unref();
  logger.info(`Internal scheduler enabled (every ${env.JOB_INTERVAL_MINUTES} min)`);
}

function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  if (timer) clearInterval(timer);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => logger.error('Unhandled promise rejection', reason));
