import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { server } from '../index';

// Load environment variables for testing
dotenv.config({ path: '../env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.SUPABASE_URL = 'http://127.0.0.1:54321';
process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Global test setup
beforeAll(() => {
  // Setup any global test configuration
});

afterAll(async () => {
  // Close server after all tests
  if (server) {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// ------------------------------------------------------------------
// Additional global helpers and enhanced Supabase mock for unit tests
// ------------------------------------------------------------------

// 1. Robust Supabase mock (includes .rpc, .storage and chainable query builders)
jest.mock('@supabase/supabase-js', () => {
  const buildQuery = () => {
    const chain: any = {
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

// 2. Simple test utilities accessible via global.testUtils
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  var testUtils: {
    createTestUser: () => {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    };
    fakeJwt: (id?: string) => string;
  };
}

global.testUtils = {
  createTestUser: () => ({
    email: `user${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  }),
  fakeJwt: (id = 'test-user-id') =>
    jwt.sign({ userId: id, email: `user${id}@example.com` }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    }),
};

// 3. Global in-memory store for routes under test
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  var mockDB: {
    users: Map<string, any>;
    carts: Map<string, any[]>;
    wishlists: Map<string, any[]>;
  };
}

global.mockDB = {
  users: new Map(),
  carts: new Map(),
  wishlists: new Map(),
};

// 4. Provide singleton PG pool mock so route & tests share same instance
jest.mock('pg', () => {
  const queryMock = jest.fn();
  const singletonPool = { query: queryMock, connect: jest.fn(), end: jest.fn() };
  return { Pool: jest.fn(() => singletonPool) };
}); 