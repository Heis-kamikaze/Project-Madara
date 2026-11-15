import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { AppError } from '../lib/errors';
import { describeFirebaseError } from '../lib/firebaseErrors';
import { logger } from '../lib/logger';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: `No route for ${req.method} ${req.path}` } });
};

// A broken database makes EVERY request fail; log the explanation once a minute per cause instead of a stack per request.
const lastLogged = new Map<string, number>();
function logInfrastructureFailure(code: string, hint: string) {
  const now = Date.now();
  if (now - (lastLogged.get(code) ?? 0) > 60_000) {
    lastLogged.set(code, now);
    logger.error(`[${code}] ${hint} (further occurrences are logged at debug level for 60s)`);
  } else {
    logger.debug(`[${code}] repeated`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request contains invalid data',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }

  if (err instanceof multer.MulterError) {
    const tooBig = err.code === 'LIMIT_FILE_SIZE';
    return res.status(tooBig ? 413 : 400).json({
      error: { code: tooBig ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR', message: tooBig ? `File exceeds ${env.MAX_UPLOAD_MB} MB` : err.message },
    });
  }

  if (err && typeof err === 'object' && (err as { type?: string }).type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } });
  }

  const firebase = describeFirebaseError(err);
  if (firebase) {
    logInfrastructureFailure(firebase.code, firebase.hint);
    return res.status(firebase.status).json({
      error: { code: firebase.code, message: env.IS_PRODUCTION ? 'The service is temporarily unavailable. Please try again shortly.' : firebase.hint },
    });
  }

  logger.error('Unhandled error', err);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: env.IS_PRODUCTION ? 'Something went wrong' : String((err as Error)?.message ?? err) },
  });
};
