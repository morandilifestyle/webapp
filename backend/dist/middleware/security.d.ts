import { Request, Response, NextFunction } from 'express';
declare module 'express-session' {
    interface SessionData {
        csrfToken?: string;
        userId?: string;
    }
}
export declare const generateCSRFToken: () => string;
export declare const validateCSRFToken: (token: string, sessionToken: string) => boolean;
export declare const csrfProtection: (req: Request, res: Response, next: NextFunction) => void;
export declare const sessionConfig: {
    secret: string;
    name: string;
    resave: boolean;
    saveUninitialized: boolean;
    cookie: {
        secure: boolean;
        httpOnly: boolean;
        maxAge: number;
        sameSite: "strict";
    };
    rolling: boolean;
};
export declare const rateLimitConfig: {
    general: import("express-rate-limit").RateLimitRequestHandler;
    payment: import("express-rate-limit").RateLimitRequestHandler;
    auth: import("express-rate-limit").RateLimitRequestHandler;
    checkout: import("express-rate-limit").RateLimitRequestHandler;
};
export declare const sessionManagement: (req: Request, res: Response, next: NextFunction) => void;
export declare const paymentSecurity: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateRequest: (req: Request, res: Response, next: NextFunction) => void;
export declare const ipBlocking: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityLogging: (req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    csrfProtection: (req: Request, res: Response, next: NextFunction) => void;
    sessionManagement: (req: Request, res: Response, next: NextFunction) => void;
    paymentSecurity: (req: Request, res: Response, next: NextFunction) => void;
    validateRequest: (req: Request, res: Response, next: NextFunction) => void;
    ipBlocking: (req: Request, res: Response, next: NextFunction) => void;
    securityLogging: (req: Request, res: Response, next: NextFunction) => void;
    rateLimitConfig: {
        general: import("express-rate-limit").RateLimitRequestHandler;
        payment: import("express-rate-limit").RateLimitRequestHandler;
        auth: import("express-rate-limit").RateLimitRequestHandler;
        checkout: import("express-rate-limit").RateLimitRequestHandler;
    };
    sessionConfig: {
        secret: string;
        name: string;
        resave: boolean;
        saveUninitialized: boolean;
        cookie: {
            secure: boolean;
            httpOnly: boolean;
            maxAge: number;
            sameSite: "strict";
        };
        rolling: boolean;
    };
    generateCSRFToken: () => string;
    validateCSRFToken: (token: string, sessionToken: string) => boolean;
};
export default _default;
//# sourceMappingURL=security.d.ts.map