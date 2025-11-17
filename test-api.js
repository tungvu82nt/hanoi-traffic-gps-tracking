// Test API endpoint /register trực tiếp
const http = require('http');
const querystring = require('querystring');

const postData = querystring.stringify({
  email: 'testapi@example.com',
  phone: '0900111222',
  fullName: 'Test API User',
  dob: '1992-08-20',
  plate: '31A-999.99',
  vehicleType: 'Xe máy'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    console.log('Redirect:', res.headers.location);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();