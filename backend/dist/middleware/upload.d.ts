import { Request } from 'express';
export declare const uploadSingle: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadMultiple: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const handleUploadError: (err: any, req: Request, res: any, next: any) => any;
export declare const validateUploadedFiles: (req: Request, res: any, next: any) => any;
export declare const generateFileUrl: (filename: string) => string;
export declare const deleteFile: (filename: string) => Promise<void>;
declare const _default: {
    uploadSingle: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    uploadMultiple: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    handleUploadError: (err: any, req: Request, res: any, next: any) => any;
    validateUploadedFiles: (req: Request, res: any, next: any) => any;
    generateFileUrl: (filename: string) => string;
    deleteFile: (filename: string) => Promise<void>;
};
export default _default;
//# sourceMappingURL=upload.d.ts.map