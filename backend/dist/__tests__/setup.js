"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
dotenv_1.default.config({ path: '../env.test' });
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.SUPABASE_URL = 'http://127.0.0.1:54321';
process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
beforeAll(() => {
});
afterAll(async () => {
    if (index_1.server) {
        await new Promise((resolve) => {
            index_1.server.close(() => resolve());
        });
    }
});
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
jest.mock('@supabase/supabase-js', () => {
    const buildQuery = () => {
        const chain = {
            select: jest.fn(() => chain),
            insert: jest.fn(() => chain),
            update: jest.fn(() => chain),
            delete: jest.fn(() => chain),
            eq: jest.fn(() => chain),
            single: jest.fn(() => ({ data: null, error: null })),
        };
        return chain;
    };
    const mockStorage = {
        upload: jest.fn(() => ({ data: { Key: 'path/to/file' }, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'http://localhost/file.jpg' }, error: null })),
    };
    return {
        createClient: jest.fn(() => ({
            from: jest.fn(() => buildQuery()),
            rpc: jest.fn(() => ({ data: true, error: null })),
            storage: { from: jest.fn(() => mockStorage) },
        })),
    };
});
global.testUtils = {
    createTestUser: () => ({
        email: `user${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
    }),
    fakeJwt: (id = 'test-user-id') => jsonwebtoken_1.default.sign({ userId: id, email: `user${id}@example.com` }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    }),
};
global.mockDB = {
    users: new Map(),
    carts: new Map(),
    wishlists: new Map(),
};
jest.mock('pg', () => {
    const queryMock = jest.fn();
    const singletonPool = { query: queryMock, connect: jest.fn(), end: jest.fn() };
    return { Pool: jest.fn(() => singletonPool) };
});
//# sourceMappingURL=setup.js.map