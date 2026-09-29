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

function fetchBills() {
    const url = new URL('/rest/v1/bills', supabaseUrl);
    url.searchParams.set('select', '*');
    url.searchParams.set('limit', '10');
    url.searchParams.set('order', 'created_at.desc');
    
    const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
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
            console.log('Recent bills:');
            try {
                const json = JSON.parse(data);
                console.log(JSON.stringify(json, null, 2));
            } catch (e) {
                console.log('Raw response:', data);
            }
        });
    });
    
    req.on('error', (e) => {
        console.error('Request error:', e);
    });
    
    req.end();
}

fetchBills();
