// Test script to verify auto-start tracking functionality
const { test, expect } = require('@playwright/test');

test('Tracking should auto-start after registration', async ({ page }) => {
  // Go to home page
  await page.goto('http://localhost:3000');
  
  // Fill registration form
  await page.fill('input[name="email"]', 'test-auto@example.com');
  await page.fill('input[name="phone"]', '0123456789');
  await page.fill('input[name="fullName"]', 'Test Auto');
  await page.fill('input[name="dob"]', '1990-01-01');
  await page.fill('input[name="plate"]', '29A-123.45');
  await page.selectOption('select[name="vehicleType"]', 'Xe máy');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for tracking card to appear
  await page.waitForSelector('#tracking-control-card', { timeout: 10000 });
  
  // Check if tracking is automatically started
  const statusText = await page.textContent('#tracking-status-text');
  expect(statusText).toBe('Đang theo dõi');
  
  // Check if indicator is active (green and pulsing)
  const indicator = await page.locator('#tracking-indicator');
  await expect(indicator).toHaveClass(/tracking-active/);
  
  // Check if toggle button says "TẮT THEO DÕI" (meaning it's currently active)
  const toggleBtnText = await page.textContent('#tracking-toggle-btn');
  expect(toggleBtnText).toBe('TẮT THEO DÕI');
});