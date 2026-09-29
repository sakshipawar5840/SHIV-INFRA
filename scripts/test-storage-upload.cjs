const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const serviceRoleKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim().replace(/^["']|["']$/g, '');
const supabaseUrl = envContent.match(/SUPABASE_URL=(.+)/)?.[1]?.trim().replace(/^["']|["']$/g, '');

if (!serviceRoleKey || !supabaseUrl) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

async function testUpload() {
    // Create a small test file
    const testContent = 'This is a test bill file for SHIVINFRA OCR verification';
    const tempFilePath = path.join(os.tmpdir(), `shivinfra-test-${Date.now()}.txt`);
    fs.writeFileSync(tempFilePath, testContent);
    
    console.log('Test file created:', tempFilePath);
    
    const storagePath = `test-uploads/${Date.now()}-test-bill.txt`;
    
    // Upload using the same pattern as the WhatsApp webhook code
    const uploadUrl = new URL('/storage/v1/object/bills', supabaseUrl);
    
    // For Supabase storage upload, we need to use multipart/form-data
    // But Node.js https doesn't easily support multipart, so let's use a different approach
    // Actually, let's just check if we can get the public URL for a path
    
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/bills/${storagePath}`;
    console.log('Public URL would be:', publicUrl);
    
    // Now let's try the actual upload using fetch with FormData-like approach
    // We'll use the REST API directly
    
    const Boundary = `----FormBoundary${Date.now()}`;
    const body = [];
    
    // Add the file field
    body.push(`--${Boundary}\r\n`);
    body.push(`Content-Disposition: form-data; name="file"; filename="test-bill.txt"\r\n`);
    body.push(`Content-Type: text/plain\r\n\r\n`);
    body.push(testContent);
    body.push(`\r\n--${Boundary}--\r\n`);
    
    const bodyBuffer = Buffer.from(body.join(''));
    
    const options = {
        hostname: uploadUrl.hostname,
        path: uploadUrl.pathname + '?path=' + encodeURIComponent(storagePath),
        method: 'POST',
        headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': `multipart/form-data; boundary=${Boundary}`,
            'Content-Length': bodyBuffer.length
        }
    };
    
    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log('Upload response status:', res.statusCode);
            console.log('Upload response:', data);
            
            // Clean up temp file
            fs.unlinkSync(tempFilePath);
        });
    });
    
    req.on('error', (e) => {
        console.error('Upload error:', e);
        fs.unlinkSync(tempFilePath);
    });
    
    req.write(bodyBuffer);
    req.end();
}

testUpload().catch(console.error);
