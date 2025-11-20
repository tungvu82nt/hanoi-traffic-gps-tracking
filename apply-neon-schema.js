/**
 * Script tự động apply schema lên Neon PostgreSQL
 * Chạy: node apply-neon-schema.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function applySchema() {
  console.log('🚀 Bắt đầu apply schema lên Neon PostgreSQL...\n');

  // Tạo connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test connection
    console.log('📡 Đang kết nối database...');
    const testResult = await pool.query('SELECT version()');
    console.log('✅ Kết nối thành công!');
    console.log(`   ${testResult.rows[0].version}\n`);

    // Đọc file migration SQL
    const sqlFilePath = path.join(__dirname, 'neon-migration.sql');
    console.log(`📄 Đọc file: ${sqlFilePath}`);
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error('Không tìm thấy file neon-migration.sql');
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    console.log('✅ Đọc file SQL thành công\n');

    // Execute SQL
    console.log('⚙️  Đang apply schema...');
    await pool.query(sqlContent);
    console.log('✅ Apply schema thành công!\n');

    // Verify tables
    console.log('🔍 Kiểm tra các bảng đã tạo...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    if (tablesResult.rows.length > 0) {
      console.log('✅ Các bảng đã được tạo:');
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  Không tìm thấy bảng nào');
    }

    // Verify columns for each table
    console.log('\n📋 Chi tiết cấu trúc bảng:');
    for (const table of tablesResult.rows) {
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table.table_name]);

      console.log(`\n   📊 ${table.table_name}:`);
      columnsResult.rows.forEach(col => {
        console.log(`      - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    }

    console.log('\n✅ Hoàn thành! Database đã sẵn sàng sử dụng.');
    console.log('🚀 Bạn có thể chạy: npm run dev\n');

  } catch (error) {
    console.error('\n❌ Lỗi khi apply schema:');
    console.error(`   ${error.message}`);
    if (error.detail) {
      console.error(`   Chi tiết: ${error.detail}`);
    }
    process.exit(1);
  } finally {
    await pool.end();
    console.log('🔌 Đã đóng connection pool');
  }
}

// Run script
applySchema();
