const fs = require('fs');
const path = require('path');
const https = require('https');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const serviceRoleKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim().replace(/^["']|["']$/g, '');
const supabaseUrl = envContent.match(/SUPABASE_URL=(.+)/)?.[1]?.trim().replace(/^["']|["']$/g, '');

if (!serviceRoleKey || !supabaseUrl) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

function checkBucket() {
    // List buckets
    const url = new URL('/storage/v1/bucket', supabaseUrl);
    
    const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'GET',
        headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json'
        }
    };
    
    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log('Buckets response:');
            console.log(data);
        });
    });
    
    req.on('error', (e) => {
        console.error('Request error:', e);
    });
    
    req.end();
}

checkBucket();
