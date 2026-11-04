import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { forbidden } from './lib/errors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { maintenance } from './middleware/maintenance';
import { globalLimiter } from './middleware/rateLimit';
import routes from './routes';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // running behind a proxy/load balancer (Cloud Run, Render, Nginx…)

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => {
        // No Origin header = server-to-server call (Paystack webhook, cron, curl).
        if (!origin || env.CORS_ORIGIN_LIST.includes(origin)) return cb(null, true);
        return cb(forbidden(`Origin ${origin} is not allowed`, 'CORS_ORIGIN_DENIED'));
      },
      credentials: true,
    }),
  );
  if (env.NODE_ENV !== 'test') app.use(morgan(env.IS_PRODUCTION ? 'combined' : 'dev'));

  // Keep the raw bytes: Paystack signs the exact body, so we must verify against it.
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, _res, buf) => {
        (req as express.Request).rawBody = buf;
      },
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'aradam-backend', time: new Date().toISOString() });
  });

  app.use(maintenance);
  app.use(globalLimiter);
  app.use(env.API_PREFIX, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
