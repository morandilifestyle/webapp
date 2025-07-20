import { Request } from 'express';
import { Session } from 'express-session';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
      session: Session & {
        csrfToken?: string;
        userId?: string;
      };
      sessionID?: string;
    }
  }
}

export {}; 