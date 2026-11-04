import { logger } from '../../lib/logger';
import * as collections from '../collections/collections.service';
import * as orders from '../orders/orders.service';

export const JOB_NAMES = ['archive-collections', 'cancel-stale-orders'] as const;
export type JobName = (typeof JOB_NAMES)[number];

const JOBS: Record<JobName, () => Promise<unknown>> = {
  /** Collections whose availability window has closed move to the archive. */
  'archive-collections': async () => ({ archived: await collections.archiveExpired() }),
  /** Orders never paid within STALE_ORDER_HOURS are cancelled. */
  'cancel-stale-orders': async () => ({ cancelled: await orders.cancelStale() }),
};

/** Every job is idempotent, so running them twice (or on two instances) is harmless. */
export async function run(which: JobName | 'all'): Promise<Record<string, unknown>> {
  const names = which === 'all' ? [...JOB_NAMES] : [which];
  const result: Record<string, unknown> = {};
  for (const name of names) {
    try {
      result[name] = await JOBS[name]();
    } catch (err) {
      logger.error(`Job ${name} failed`, err);
      result[name] = { error: (err as Error).message };
    }
  }
  return result;
}
