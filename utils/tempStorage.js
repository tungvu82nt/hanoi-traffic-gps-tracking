const crypto = require('crypto');

// Bộ nhớ tạm thời để test trong development
let tempClicks = [];
let clickId = 1;

/**
 * Lưu tracking data tạm thời vào memory
 */
function saveTempClick(data) {
  const clickData = {
    id: clickId++,
    ...data,
    created_at: new Date().toISOString(),
    clicked_at: data.clicked_at || new Date().toISOString()
  };
  tempClicks.push(clickData);
  return clickData;
}

/**
 * Lấy danh sách clicks từ memory
 */
function getTempClicks(options = {}) {
  const { page = 1, limit = 20, startDate, endDate } = options;
  
  let filtered = [...tempClicks];
  
  // Filter by date
  if (startDate) {
    filtered = filtered.filter(click => click.clicked_at >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(click => click.clicked_at <= endDate);
  }
  
  // Pagination
  const total = filtered.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginated = filtered.slice(start, end);
  
  return {
    clicks: paginated,
    total,
    page,
    limit
  };
}

/**
 * Lấy thống kê từ memory
 */
function getTempStats() {
  const totalClicks = tempClicks.length;
  const gpsClicks = tempClicks.filter(click => click.latitude && click.longitude).length;
  const uniqueUsers = new Set(tempClicks.map(click => click.ip_address)).size;
  
  const today = new Date().toISOString().split('T')[0];
  const todayClicks = tempClicks.filter(click => 
    click.clicked_at.startsWith(today)
  ).length;
  
  return {
    totalClicks,
    gpsClicks,
    uniqueUsers,
    todayClicks
  };
}

/**
 * Xóa toàn bộ data test
 */
function clearTempData() {
  tempClicks = [];
  clickId = 1;
}

module.exports = {
  saveTempClick,
  getTempClicks,
  getTempStats,
  clearTempData
};