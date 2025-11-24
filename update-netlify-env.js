const fs = require('fs');
const path = require('path');
const https = require('https');

const NETLIFY_TOKEN = 'nfp_hprh3898YGrujv8yQkbchosLMKuBEEq97ec6';
const SITE_NAME = 'zippy-bonbon-11e222';

// 1. Read .env file
const envPath = path.join(__dirname, '.env');
console.log('Reading .env from:', envPath);

let envVars = {};
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;

        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            // Remove quotes if wrapping the value
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            envVars[key] = value;
        }
    });
} catch (e) {
    console.error('Error reading .env:', e.message);
}

const keys = Object.keys(envVars);
console.log('Found environment variables:', keys);

if (keys.length === 0) {
    console.error('No environment variables found to upload!');
    process.exit(1);
}

// Helper for API requests
function netlifyRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.netlify.com',
            path: `/api/v1${path}`,
            method: method,
            headers: {
                'Authorization': `Bearer ${NETLIFY_TOKEN}`,
                'Content-Type': 'application/json',
                'User-Agent': 'MyApp/1.0.0'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data); // Handle non-JSON response if any
                    }
                } else {
                    reject(new Error(`API Error ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function main() {
    try {
        // 2. Find Site ID
        console.log('Fetching sites...');
        const sites = await netlifyRequest('GET', '/sites');
        const site = sites.find(s => s.name === SITE_NAME || s.custom_domain === SITE_NAME);

        if (!site) {
            console.error(`Site '${SITE_NAME}' not found.`);
            return;
        }

        console.log(`Found site: ${site.name} (${site.id})`);

        // 3. Update Env Vars (New API)
        // Endpoint: POST /api/v1/sites/{site_id}/env
        // Body: Array of objects
        
        const envPayload = keys.map(key => ({
            key: key,
            values: [{
                value: envVars[key],
                context: 'all'
            }]
        }));

        console.log('Updating environment variables via new API...');
        
        // We need to do this one by one or bulk? 
        // The docs say POST /sites/{site_id}/env creates multiple variables.
        // But if they exist, does it update? 
        // "Create a list of environment variables"
        // If they exist, it might fail or update. Let's try bulk first.
        
        try {
            await netlifyRequest('POST', `/sites/${site.id}/env`, envPayload);
            console.log('✅ Successfully updated environment variables!');
        } catch (err) {
            console.log('Bulk update failed, trying individual updates (PUT)...');
            // If bulk fails (e.g. some exist), try updating individually
            for (const item of envPayload) {
                try {
                    // PUT /sites/{site_id}/env/{key}
                    // Body: { key, values: [...] } (Check docs, usually just the object)
                    await netlifyRequest('PUT', `/sites/${site.id}/env/${item.key}`, item);
                    console.log(`Updated ${item.key}`);
                } catch (innerErr) {
                    console.error(`Failed to update ${item.key}: ${innerErr.message}`);
                }
            }
        }

        console.log('Please trigger a new deploy for changes to take effect.');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();
