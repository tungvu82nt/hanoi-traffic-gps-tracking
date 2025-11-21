/**
 * Test IPInfo.io Integration
 * Kiểm tra xem API key có hoạt động không
 */

require('dotenv').config();
const { getGeoFromIP } = require('./utils/ipinfo');

const testIPs = [
  '8.8.8.8',           // Google DNS (US)
  '1.1.1.1',           // Cloudflare (AU)
  '113.161.0.1',       // Vietnam
  '103.245.236.1',     // Vietnam ISP
  '127.0.0.1',         // Localhost (should skip)
  '::1'                // IPv6 localhost (should skip)
];

async function testIPInfo() {
  console.log('🧪 Testing IPInfo.io Integration\n');
  console.log(`API Key: ${process.env.IPINFO_API_KEY ? '✅ Configured' : '❌ Missing'}\n`);

  for (const ip of testIPs) {
    console.log(`\n🔍 Testing IP: ${ip}`);
    console.log('─'.repeat(50));
    
    try {
      const result = await getGeoFromIP(ip);
      
      if (result) {
        console.log('✅ Geo Data Retrieved:');
        console.log(`   Country: ${result.country || 'N/A'}`);
        console.log(`   City: ${result.city || 'N/A'}`);
        console.log(`   Region: ${result.region || 'N/A'}`);
        console.log(`   Timezone: ${result.timezone || 'N/A'}`);
        console.log(`   ISP: ${result.isp || 'N/A'}`);
        console.log(`   Location: ${result.loc || 'N/A'}`);
      } else {
        console.log('⚠️  No data returned (localhost/private IP or API error)');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Test completed!');
  console.log('📊 Check if geo data was retrieved correctly');
  console.log('💡 If all tests show "No data", check your API key\n');
}

// Run test
testIPInfo().catch(console.error);
