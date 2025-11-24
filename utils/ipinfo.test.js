// Unit tests for ipinfo.js
const https = require('https');

describe('IPInfo Module', () => {
  let originalEnv;
  let mockHttpsGet;
  let ipinfoModule;

  beforeEach(() => {
    // Save original environment variables
    originalEnv = process.env.IPINFO_API_KEY;
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Set mock environment
    process.env.IPINFO_API_KEY = 'test-token';
    
    // Create a fresh mock for https.get
    mockHttpsGet = jest.fn().mockImplementation((url, options, callback) => {
      // Simulate successful response
      const mockRes = {
        statusCode: 200,
        on: jest.fn().mockImplementation((event, cb) => {
          if (event === 'data') {
            cb('{"country":"VN","city":"Ha Noi","region":"Hanoi","timezone":"Asia/Ho_Chi_Minh","org":"AS1234 ISP","loc":"21.0278,105.8342"}');
          } else if (event === 'end') {
            cb();
          }
        })
      };
      
      const mockReq = {
        on: jest.fn().mockImplementation((event, cb) => {
          if (event === 'error') {
            // Don't call error callback by default
          } else if (event === 'timeout') {
            // Don't call timeout callback by default
          }
        }),
        destroy: jest.fn()
      };
      
      // Call callback with mock response
      callback(mockRes);
      
      return mockReq;
    });
    
    // Override https.get
    https.get = mockHttpsGet;
    
    // Import the module after setting up mocks
    ipinfoModule = require('./ipinfo');
  });

  afterEach(() => {
    // Restore original environment
    process.env.IPINFO_API_KEY = originalEnv;
    
    // Reset module cache
    delete require.cache[require.resolve('./ipinfo')];
  });

  describe('getGeoFromIP()', () => {
    test('should fetch geo information successfully', async () => {
      const result = await ipinfoModule.getGeoFromIP('8.8.8.8');
      
      // Verify result structure
      expect(result).toHaveProperty('country', 'VN');
      expect(result).toHaveProperty('city', 'Ha Noi');
      expect(result).toHaveProperty('region', 'Hanoi');
      expect(result).toHaveProperty('timezone', 'Asia/Ho_Chi_Minh');
      expect(result).toHaveProperty('isp', 'AS1234 ISP');
      expect(result).toHaveProperty('loc', '21.0278,105.8342');
    });

    test('should return null when no API key is configured', async () => {
      // Create a new test that directly checks the behavior
      // by creating a separate instance of the module
      
      // Save original environment
      const originalEnv = process.env.IPINFO_API_KEY;
      
      // Remove API token
      delete process.env.IPINFO_API_KEY;
      
      // Mock console.log to avoid cluttering test output
      const originalLog = console.log;
      console.log = jest.fn();
      
      // Create a fresh instance of the module
      delete require.cache[require.resolve('./ipinfo')];
      const testModule = require('./ipinfo');
      
      const result = await testModule.getGeoFromIP('8.8.8.8');
      
      // Restore console.log and environment
      console.log = originalLog;
      process.env.IPINFO_API_KEY = originalEnv;
      
      expect(result).toBeNull();
    });

    test('should return null for localhost/private IPs', async () => {
      // Test various private IPs
      expect(await ipinfoModule.getGeoFromIP('::1')).toBeNull();
      expect(await ipinfoModule.getGeoFromIP('127.0.0.1')).toBeNull();
      expect(await ipinfoModule.getGeoFromIP('192.168.1.1')).toBeNull();
      expect(await ipinfoModule.getGeoFromIP('10.0.0.1')).toBeNull();
    });

    test('should return null for invalid IP', async () => {
      const result = await ipinfoModule.getGeoFromIP(null);
      expect(result).toBeNull();
    });

    test('should handle API errors gracefully', async () => {
      // Mock https to simulate error
      mockHttpsGet.mockImplementation((url, options, callback) => {
        const mockReq = {
          on: jest.fn().mockImplementation((event, cb) => {
            if (event === 'error') {
              cb(new Error('Network error'));
            }
          })
        };
        
        // Call callback with a proper mock response
        const mockRes = {
          on: jest.fn()
        };
        
        callback(mockRes);
        return mockReq;
      });
      
      const result = await ipinfoModule.getGeoFromIP('8.8.8.8');
      expect(result).toBeNull();
    });

    test('should handle API timeout gracefully', async () => {
      // Mock https to simulate timeout
      mockHttpsGet.mockImplementation((url, options, callback) => {
        const mockReq = {
          on: jest.fn().mockImplementation((event, cb) => {
            if (event === 'timeout') {
              cb();
            }
          }),
          destroy: jest.fn()
        };
        
        // Call callback with a proper mock response
        const mockRes = {
          on: jest.fn()
        };
        
        callback(mockRes);
        return mockReq;
      });
      
      const result = await ipinfoModule.getGeoFromIP('8.8.8.8');
      expect(result).toBeNull();
    });

    test('should handle non-200 status code', async () => {
      // Mock https to simulate non-200 response
      mockHttpsGet.mockImplementation((url, options, callback) => {
        const mockRes = {
          statusCode: 429,
          on: jest.fn().mockImplementation((event, cb) => {
            if (event === 'data') {
              cb('{"error":"Too many requests"}');
            } else if (event === 'end') {
              cb();
            }
          })
        };
        
        const mockReq = {
          on: jest.fn(),
          destroy: jest.fn()
        };
        
        callback(mockRes);
        return mockReq;
      });
      
      const result = await ipinfoModule.getGeoFromIP('8.8.8.8');
      expect(result).toBeNull();
    });
  });

  describe('batchGeoLookup()', () => {
    test('should process multiple IPs', async () => {
      const ips = ['8.8.8.8', '1.1.1.1'];
      const results = await ipinfoModule.batchGeoLookup(ips);
      
      // Should return an array with results for each IP
      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('country', 'VN');
      expect(results[1]).toHaveProperty('country', 'VN');
    });

    test('should handle empty array', async () => {
      const results = await ipinfoModule.batchGeoLookup([]);
      expect(results).toHaveLength(0);
    });

    test('should handle mixed valid and invalid IPs', async () => {
      const ips = ['8.8.8.8', '127.0.0.1'];
      const results = await ipinfoModule.batchGeoLookup(ips);
      
      // Should return an array with one result and one null
      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('country', 'VN');
      expect(results[1]).toBeNull();
    });
  });
});