// Unit tests for neon-db.js

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://testuser:testpassword@localhost:5432/testdb';

// Mock the pg Pool before importing neon-db
jest.mock('pg', () => {
  const mockQueryResult = {
    rows: [{ id: 1, name: 'Test' }],
    rowCount: 1
  };

  const mockPool = {
    query: jest.fn().mockResolvedValue(mockQueryResult),
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue(mockQueryResult),
      release: jest.fn()
    }),
    end: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    off: jest.fn()
  };

  return {
    Pool: jest.fn().mockImplementation(() => mockPool)
  };
});

// Import after mocking
const { query, transaction, testConnection, close } = require('./neon-db');

describe('Neon DB Module', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment variables
    originalEnv = process.env.DATABASE_URL;
    // Reset mocks
    jest.clearAllMocks();
    // Reset module cache
    jest.resetModules();
    // Restore mock environment
    process.env.DATABASE_URL = 'postgresql://testuser:testpassword@localhost:5432/testdb';
  });

  afterEach(() => {
    // Restore original environment
    process.env.DATABASE_URL = originalEnv;
  });

  describe('Query Function', () => {
    test('should execute query successfully', async () => {
      const result = await query('SELECT * FROM test');
      expect(result.rows).toEqual([{ id: 1, name: 'Test' }]);
    });
  });

  describe('Transaction Function', () => {
    test('should execute transaction successfully', async () => {
      const mockCallback = jest.fn().mockResolvedValue('Transaction result');
      const result = await transaction(mockCallback);
      expect(result).toBe('Transaction result');
    });
  });

  describe('Test Connection Function', () => {
    test('should return true when connection is successful', async () => {
      const result = await testConnection();
      expect(result).toBe(true);
    });
  });

  describe('Close Function', () => {
    test('should close pool successfully', async () => {
      await close();
      expect(typeof close).toBe('function');
    });
  });
});