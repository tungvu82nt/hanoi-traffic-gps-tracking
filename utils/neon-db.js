require('dotenv').config();
const { Pool } = require('pg');

/**
 * Neon PostgreSQL Database Connection
 * Sử dụng connection pooling để tối ưu performance
 */

// Tạo connection pool
// Tạo connection pool
let pool;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing! Database connection will fail.");
  // Dummy pool to prevent crash on require, but fail on usage
  pool = {
    query: async () => { throw new Error("Database not configured (missing DATABASE_URL)"); },
    connect: async () => { throw new Error("Database not configured (missing DATABASE_URL)"); },
    on: () => {},
    end: async () => {}
  };
} else {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Neon yêu cầu SSL
    },
    // Connection pool config
    max: 20,                    // Tối đa 20 connections
    idleTimeoutMillis: 30000,   // Close idle connections sau 30s
    connectionTimeoutMillis: 2000, // Timeout khi tạo connection mới
  });

  // Event listeners để debug
  pool.on('connect', () => {
    console.log('✅ Đã kết nối Neon PostgreSQL');
  });

  pool.on('error', (err) => {
    console.error('❌ Lỗi PostgreSQL pool:', err);
  });
}

/**
 * Query wrapper với error handling
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query result
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`[SQL] Executed query in ${duration}ms`);
    return res;
  } catch (error) {
    console.error('[SQL Error]:', error.message);
    console.error('[SQL Query]:', text);
    throw error;
  }
}

/**
 * Transaction wrapper
 * @param {Function} callback - Async function nhận client
 * @returns {Promise<any>} - Kết quả transaction
 */
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test connection
 */
async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Kết nối Neon thành công!');
    console.log('   Time:', result.rows[0].current_time);
    console.log('   Version:', result.rows[0].pg_version);
    return true;
  } catch (error) {
    console.error('❌ Không thể kết nối Neon:', error.message);
    return false;
  }
}

/**
 * Graceful shutdown
 */
async function close() {
  await pool.end();
  console.log('🔌 Đã đóng connection pool');
}

// Handle app termination
process.on('SIGTERM', close);
process.on('SIGINT', close);

module.exports = {
  query,
  transaction,
  pool,
  testConnection,
  close
};
