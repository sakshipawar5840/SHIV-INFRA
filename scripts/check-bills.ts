import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const serviceRoleKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim().replace(/^["']|["']$/g, '');
const supabaseUrl = envContent.match(/SUPABASE_URL=(.+)/)?.[1]?.trim().replace(/^["']|["']$/g, '');

if (!serviceRoleKey || !supabaseUrl) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

async function checkBills() {
    const headers = {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
    };

    console.log('Fetching bills...');
    
    // Simple query first
    const url = `${supabaseUrl}/rest/v1/bills?select=*&limit=10&order=created_at.desc`;
    
    console.log('URL:', url);
    
    const response = await fetch(url, { headers, method: 'GET' });
    const data = await response.json();
    
    console.log('Recent bills:');
    console.log(JSON.stringify(data, null, 2));
}

checkBills().catch(console.error);
