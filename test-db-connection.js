require('dotenv').config();
const { testConnection, close } = require('./utils/neon-db');

async function runTest() {
  console.log('Testing database connection...');
  console.log('URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Hide password
  
  const success = await testConnection();
  
  if (success) {
    console.log('✅ Test passed!');
  } else {
    console.error('❌ Test failed!');
  }
  
  await close();
}

runTest();
