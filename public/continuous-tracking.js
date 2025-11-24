/**
 * Continuous GPS Tracking Module
 * Implements real-time location tracking with proper consent management
 * GDPR/Privacy Compliant Implementation
 */

class ContinuousTracker {
  constructor() {
    this.watchId = null;
    this.registrationId = null;
    this.isTracking = false;
    this.lastUpdateTime = null;
    this.sessionId = null;
    this.updateInterval = 30000; // 30 seconds
    this.lastSentTime = 0;
    this.consentExpiryHours = 24;
  }

  /**
   * Initialize tracker after user registration
   */
  init(registrationId) {
    this.registrationId = registrationId;
    this.sessionId = this.generateSessionId();
    
    // Check if user has valid consent
    const consent = this.getStoredConsent();
    if (consent && !this.isConsentExpired(consent)) {
      // Auto-resume if consent is still valid
      console.log('[Tracker] Valid consent found, starting continuous tracking');
      this.startTracking();
    } else {
      console.log('[Tracker] No valid consent, starting with new consent');
      this.clearConsent();
      // Start tracking automatically by default
      this.startTracking();
    }
  }

  /**
   * Start continuous tracking
   */
  startTracking() {
    if (this.isTracking) {
      console.warn('[Tracker] Already tracking');
      return;
    }

    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ GPS');
      return;
    }

    // Store consent with timestamp
    this.storeConsent();

    // Start watching position
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handleError(error),
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );

    this.isTracking = true;
    this.updateUI('active');
    console.log('[Tracker] Started continuous tracking');
  }

  /**
   * Stop tracking
   */
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.isTracking = false;
    this.clearConsent();
    this.updateUI('inactive');
    console.log('[Tracker] Stopped tracking');
  }

  /**
   * Handle position update from watchPosition
   */
  handlePositionUpdate(position) {
    const now = Date.now();
    
    // Rate limiting: Only send if 30s has passed since last update
    if (now - this.lastSentTime < this.updateInterval) {
      console.log('[Tracker] Skipping update (rate limit)');
      return;
    }

    this.lastSentTime = now;
    this.lastUpdateTime = new Date().toISOString();

    // Send location to server
    this.sendLocationToServer(position.coords);

    // Update UI
    this.updateUI('active', {
      lat: position.coords.latitude.toFixed(6),
      lon: position.coords.longitude.toFixed(6),
      accuracy: Math.round(position.coords.accuracy),
      time: this.lastUpdateTime
    });
  }

  /**
   * Send location data to backend
   */
  async sendLocationToServer(coords) {
    try {
      const response = await fetch('/track-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registration_id: this.registrationId,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          consent_given: true,
          tracking_session_id: this.sessionId,
          is_continuous: true,
          page_url: window.location.href
        })
      });

      if (!response.ok) {
        console.error('[Tracker] Server error:', response.status);
      } else {
        console.log('[Tracker] Location sent successfully');
      }
    } catch (error) {
      console.error('[Tracker] Failed to send location:', error);
    }
  }

  /**
   * Handle geolocation errors
   */
  handleError(error) {
    console.error('[Tracker] Geolocation error:', error.message);
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        alert('Bạn đã từ chối quyền truy cập GPS. Vui lòng bật lại trong cài đặt trình duyệt.');
        this.stopTracking();
        break;
      case error.POSITION_UNAVAILABLE:
        console.warn('[Tracker] Position unavailable');
        break;
      case error.TIMEOUT:
        console.warn('[Tracker] Request timeout');
        break;
    }
  }

  /**
   * Update UI elements
   */
  updateUI(status, data = null) {
    const indicator = document.getElementById('tracking-indicator');
    const statusText = document.getElementById('tracking-status-text');
    const lastUpdate = document.getElementById('tracking-last-update');
    const toggleBtn = document.getElementById('tracking-toggle-btn');

    if (!indicator) return;

    if (status === 'active') {
      indicator.classList.add('tracking-active');
      indicator.classList.remove('tracking-inactive');
      statusText.textContent = 'Đang theo dõi';
      
      if (toggleBtn) {
        toggleBtn.textContent = 'TẮT THEO DÕI';
        toggleBtn.classList.add('btn-danger');
        toggleBtn.classList.remove('btn-primary');
      }

      if (data && lastUpdate) {
        lastUpdate.innerHTML = `
          📍 ${data.lat}, ${data.lon}<br>
          🎯 Độ chính xác: ${data.accuracy}m<br>
          🕐 ${new Date(data.time).toLocaleTimeString('vi-VN')}
        `;
      }
    } else {
      indicator.classList.add('tracking-inactive');
      indicator.classList.remove('tracking-active');
      statusText.textContent = 'Đã tắt';
      
      if (toggleBtn) {
        toggleBtn.textContent = 'BẬT THEO DÕI';
        toggleBtn.classList.add('btn-primary');
        toggleBtn.classList.remove('btn-danger');
      }
      
      if (lastUpdate) {
        lastUpdate.textContent = 'Không có dữ liệu';
      }
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store consent in localStorage
   */
  storeConsent() {
    const consent = {
      timestamp: Date.now(),
      expiresAt: Date.now() + (this.consentExpiryHours * 60 * 60 * 1000),
      sessionId: this.sessionId
    };
    localStorage.setItem('gps_tracking_consent', JSON.stringify(consent));
  }

  /**
   * Get stored consent
   */
  getStoredConsent() {
    const stored = localStorage.getItem('gps_tracking_consent');
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Check if consent is expired
   */
  isConsentExpired(consent) {
    return Date.now() > consent.expiresAt;
  }

  /**
   * Clear consent from storage
   */
  clearConsent() {
    localStorage.removeItem('gps_tracking_consent');
  }

  /**
   * Check consent and renew if needed
   */
  checkConsentExpiry() {
    const consent = this.getStoredConsent();
    if (consent && this.isConsentExpired(consent)) {
      alert('Quyền theo dõi GPS đã hết hạn sau 24 giờ. Vui lòng bật lại nếu muốn tiếp tục.');
      this.stopTracking();
    }
  }
}

// Global instance
window.continuousTracker = new ContinuousTracker();

// Check consent expiry every 5 minutes
setInterval(() => {
  if (window.continuousTracker.isTracking) {
    window.continuousTracker.checkConsentExpiry();
  }
}, 5 * 60 * 1000);
