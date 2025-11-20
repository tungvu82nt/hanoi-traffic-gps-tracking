// Test tracking system
const http = require('http');

const scenarios = [
    {
        label: 'consent-granted',
        payload: {
            registration_id: null,
            latitude: 10.762622,
            longitude: 106.660172,
            accuracy: 10,
            consent_given: true
        }
    },
    {
        label: 'consent-denied',
        payload: {
            registration_id: null,
            latitude: 21.028511, // dữ liệu sẽ bị server loại bỏ
            longitude: 105.804817,
            accuracy: 50,
            consent_given: false
        }
    }
];

const baseOptions = {
    hostname: process.env.TEST_TRACK_HOST || 'localhost',
    port: process.env.TEST_TRACK_PORT || 3000,
    path: '/track-click',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 Test Client'
    }
};

function sendTrackingRequest({ label, payload }) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(payload);
        const options = {
            ...baseOptions,
            headers: {
                ...baseOptions.headers,
                'Content-Length': Buffer.byteLength(body)
            }
        };

        console.log(`\n🚀 Gửi request ${label} với consent=${payload.consent_given}`);

        const req = http.request(options, (res) => {
            console.log(`Status: ${res.statusCode}`);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('Response:', data);
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            reject(e);
        });

        req.write(body);
        req.end();
    });
}

async function run() {
    for (const scenario of scenarios) {
        try {
            await sendTrackingRequest(scenario);
        } catch (err) {
            console.error(`❌ Lỗi scenario ${scenario.label}:`, err.message);
        }
    }
}

run();