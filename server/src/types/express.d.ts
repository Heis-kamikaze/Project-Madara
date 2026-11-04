import type { Role } from '../config/permissions';

export interface AuthUser {
  uid: string;
  email: string | null;
  name: string | null;
  emailVerified: boolean;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      /** Raw request bytes, kept for webhook signature verification. */
      rawBody?: Buffer;
    }
  }
}
