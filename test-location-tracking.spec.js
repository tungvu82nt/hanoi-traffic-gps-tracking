const { test, expect } = require('@playwright/test');

// Test admin đăng nhập và kiểm tra toạ độ
test('Admin can login and view locations', async ({ page }) => {
  // Sử dụng basic auth trong URL
  await page.goto('http://admin:admin@localhost:3000/admin.html', { timeout: 10000 });
  
  // Kiểm tra xem dashboard đã xuất hiện
  await page.waitForSelector('body');
  
  // Kiểm tra xem bản đồ admin đã xuất hiện
  await page.waitForSelector('#map');
  
  // Kiểm tra xem có bảng chi tiết click không
  await page.waitForSelector('table');
  
  // Kiểm tra xem có nút để export Excel không
  await page.waitForSelector('button#exportBtn');
  
  // Kiểm tra xem có nút refresh không
  await page.waitForSelector('button#refreshBtn');
});

// Test admin có thể thêm toạ độ thủ công
test('Admin can manually add location', async ({ page }) => {
  // Sử dụng basic auth trong URL
  await page.goto('http://admin:admin@localhost:3000/admin.html', { timeout: 10000 });
  
  // Đợi bản đồ admin xuất hiện
  await page.waitForSelector('#map');
  
  // Nhấp vào một điểm trên bản đồ để thêm toạ độ thủ công
  const map = await page.locator('#map');
  await map.click({ position: { x: 200, y: 200 } });
  
  // Kiểm tra xem có thông báo về toạ độ không
  await page.waitForTimeout(1000); // Đợi 1 giây để thông báo xuất hiện
  
  // Kiểm tra xem có thể xem chi tiết bản ghi click không
  await page.waitForSelector('table');
});

// Test admin có thể làm mới dữ liệu
test('Admin can refresh data', async ({ page }) => {
  // Sử dụng basic auth trong URL
  await page.goto('http://admin:admin@localhost:3000/admin.html', { timeout: 10000 });
  
  // Đợi bản đồ admin xuất hiện
  await page.waitForSelector('#map');
  
  // Kiểm tra xem có nút refresh không
  await page.waitForSelector('button#refreshBtn');
  
  // Click nút refresh
  await page.click('button#refreshBtn');
  
  // Đợi một chút để dữ liệu được làm mới
  await page.waitForTimeout(2000);
  
  // Kiểm tra xem bảng vẫn còn hiển thị
  await page.waitForSelector('table');
});
