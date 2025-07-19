declare global {
    namespace Express {
        interface Request {
            uploadedImages?: string[];
        }
    }
}
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=reviews.d.ts.map