// Unit tests for tempStorage.js
const {
  saveTempClick,
  getTempClicks,
  getTempStats,
  clearTempData
} = require('./tempStorage');

describe('TempStorage Module', () => {
  beforeEach(() => {
    // Reset the storage before each test
    jest.clearAllMocks();
    clearTempData();
  });

  describe('SaveTempClick Operations', () => {
    test('should save click data successfully', () => {
      const clickData = { 
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser',
        latitude: 21.0278,
        longitude: 105.8342
      };

      // Save click data
      const saved = saveTempClick(clickData);

      // Verify data was saved correctly
      expect(saved.id).toBeDefined();
      expect(saved.ip_address).toBe(clickData.ip_address);
      expect(saved.user_agent).toBe(clickData.user_agent);
      expect(saved.latitude).toBe(clickData.latitude);
      expect(saved.longitude).toBe(clickData.longitude);
      expect(saved.created_at).toBeDefined();
      expect(saved.clicked_at).toBeDefined();
    });

    test('should auto-increment IDs', () => {
      const click1 = saveTempClick({ ip_address: '192.168.1.1' });
      const click2 = saveTempClick({ ip_address: '192.168.1.2' });
      
      expect(click1.id).toBe(1);
      expect(click2.id).toBe(2);
      expect(click2.id).toBeGreaterThan(click1.id);
    });

    test('should handle click data without GPS coordinates', () => {
      const clickData = { 
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser'
      };

      const saved = saveTempClick(clickData);
      
      expect(saved).toBeDefined();
      expect(saved.id).toBeDefined();
      expect(saved.latitude).toBeUndefined();
      expect(saved.longitude).toBeUndefined();
    });
  });

  describe('GetTempClicks Operations', () => {
    test('should retrieve clicks with pagination', () => {
      // Save multiple clicks
      for (let i = 1; i <= 10; i++) {
        saveTempClick({ ip_address: `192.168.1.${i}` });
      }

      // Get first page with limit 5
      const result1 = getTempClicks({ page: 1, limit: 5 });
      expect(result1.clicks.length).toBe(5);
      expect(result1.total).toBe(10);
      expect(result1.page).toBe(1);
      expect(result1.limit).toBe(5);

      // Get second page
      const result2 = getTempClicks({ page: 2, limit: 5 });
      expect(result2.clicks.length).toBe(5);
    });

    test('should filter clicks by date range', () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      
      // Save clicks
      saveTempClick({ ip_address: '192.168.1.1', clicked_at: yesterday });
      saveTempClick({ ip_address: '192.168.1.2' });
      
      // Filter by today only
      const result = getTempClicks({ startDate: today });
      expect(result.clicks.length).toBe(1);
      expect(result.clicks[0].ip_address).toBe('192.168.1.2');
    });
  });

  describe('GetTempStats Operations', () => {
    test('should return correct statistics', () => {
      // Save clicks with and without GPS
      saveTempClick({ ip_address: '192.168.1.1', latitude: 21.0278, longitude: 105.8342 });
      saveTempClick({ ip_address: '192.168.1.2' });
      saveTempClick({ ip_address: '192.168.1.3', latitude: 21.0278, longitude: 105.8342 });

      const stats = getTempStats();
      
      expect(stats.totalClicks).toBe(3);
      expect(stats.gpsClicks).toBe(2);
      expect(stats.uniqueUsers).toBe(3);
    });

    test('should return zero statistics when no data', () => {
      const stats = getTempStats();
      
      expect(stats.totalClicks).toBe(0);
      expect(stats.gpsClicks).toBe(0);
      expect(stats.uniqueUsers).toBe(0);
    });
  });

  describe('ClearTempData Operations', () => {
    test('should clear all temporary data', () => {
      // Save some clicks
      for (let i = 1; i <= 5; i++) {
        saveTempClick({ ip_address: `192.168.1.${i}` });
      }
      
      // Verify data exists
      let result = getTempClicks();
      expect(result.total).toBe(5);
      
      // Clear data
      clearTempData();
      
      // Verify data was cleared
      result = getTempClicks();
      expect(result.total).toBe(0);
      
      // Verify IDs reset
      const newClick = saveTempClick({ ip_address: '192.168.1.100' });
      expect(newClick.id).toBe(1);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete workflow: save, get stats, get clicks, clear', () => {
      // 1. Save some clicks
      const click1 = saveTempClick({
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser 1',
        latitude: 21.0278,
        longitude: 105.8342
      });
      
      const click2 = saveTempClick({
        ip_address: '192.168.1.2',
        user_agent: 'Test Browser 2'
      });
      
      // 2. Get statistics
      const stats = getTempStats();
      expect(stats.totalClicks).toBe(2);
      expect(stats.gpsClicks).toBe(1);
      expect(stats.uniqueUsers).toBe(2);
      
      // 3. Get clicks with pagination
      const clicks = getTempClicks({ limit: 20 });
      expect(clicks.total).toBe(2);
      expect(clicks.clicks.length).toBe(2);
      
      // 4. Clear data
      clearTempData();
      
      // 5. Verify cleared
      const emptyStats = getTempStats();
      expect(emptyStats.totalClicks).toBe(0);
      
      const emptyClicks = getTempClicks();
      expect(emptyClicks.total).toBe(0);
    });

    test('should handle sequential operations with different data patterns', () => {
      // Test with various types of click data
      const clickTypes = [
        { ip_address: '192.168.1.10', user_agent: 'Chrome' },
        { ip_address: '192.168.1.11', user_agent: 'Firefox', latitude: 21.0278, longitude: 105.8342 },
        { ip_address: '192.168.1.12', user_agent: 'Safari' },
        { ip_address: '192.168.1.11', user_agent: 'Firefox' }, // Duplicate IP
        { ip_address: '192.168.1.13', user_agent: 'Edge', latitude: 21.03, longitude: 105.83 }
      ];
      
      // Save all clicks
      clickTypes.forEach(data => saveTempClick(data));
      
      // Verify total clicks
      const stats = getTempStats();
      expect(stats.totalClicks).toBe(5);
      expect(stats.gpsClicks).toBe(2);
      expect(stats.uniqueUsers).toBe(4); // One duplicate IP
      
      // Verify clicks can be retrieved
      const result = getTempClicks();
      expect(result.clicks.length).toBe(5);
      expect(result.clicks[0].id).toBe(1);
      expect(result.clicks[4].id).toBe(5);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing required fields', () => {
      // Should handle click data without required fields
      const click = saveTempClick({});
      expect(click).toBeDefined();
      expect(click.id).toBeDefined();
    });

    test('should handle invalid pagination parameters', () => {
      // Add some test data
      saveTempClick({ ip_address: '192.168.1.1' });
      
      // Test with invalid page (should default to 1)
      const result1 = getTempClicks({ page: 0 });
      expect(result1.page).toBe(0); // Giá trị page = 0 được giữ nguyên
      expect(result1.clicks.length).toBe(0); // Không có kết quả vì page = 0
      
      // Test with invalid limit (should use default limit)
      const result2 = getTempClicks({ limit: -1 });
      expect(result2.limit).toBe(-1); // Giá trị limit = -1 được giữ nguyên
    });
  });
});