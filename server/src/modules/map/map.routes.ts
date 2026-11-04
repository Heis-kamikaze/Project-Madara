import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { ok } from '../../lib/response';
import * as map from './map.service';

const router = Router();

/** Public data for the interactive global map on the team/brand page. */
router.get(
  '/regions',
  asyncHandler(async (_req, res) => {
    res.set('Cache-Control', 'public, max-age=60');
    const { regions, total } = await map.getRegions();
    ok(res, regions, { total });
  }),
);

export default router;
