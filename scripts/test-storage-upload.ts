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

async function testStorageUpload() {
    // Create a minimal valid JPEG file (1x1 pixel black JPEG)
    // JPEG magic bytes: FF D8 FF E0 00 10 JFIF... then minimal image data
    const minimalJpeg = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x03, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
        0x7D, 0x2C, 0x0F, 0xFF, 0xD9
    ]);
    
    const tempFilePath = path.join(__dirname, '..', 'test-bill-upload.jpg');
    fs.writeFileSync(tempFilePath, minimalJpeg);
    
    console.log('Test JPEG created:', tempFilePath);
    
    const storagePath = `test-uploads/${Date.now()}-test-bill.jpg`;
    
    // Import supabase client
    const { supabaseAdmin } = await import('../backend/config/supabase.ts');
    
    console.log('Uploading to Supabase Storage...');
    console.log('Bucket: bills');
    console.log('Path:', storagePath);
    
    const { data, error } = await supabaseAdmin.storage
        .from('bills')
        .upload(storagePath, fs.createReadStream(tempFilePath), {
            contentType: 'image/jpeg',
            upsert: true,
        });
    
    if (error) {
        console.error('Upload FAILED:', error);
        fs.unlinkSync(tempFilePath);
        process.exit(1);
    }
    
    console.log('Upload SUCCESS');
    console.log('Uploaded path:', data?.path);
    
    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
        .from('bills')
        .getPublicUrl(storagePath);
    
    console.log('Public URL:', urlData?.publicUrl);
    
    // Verify file exists by trying to get its info
    const { data: fileInfo, error: listError } = supabaseAdmin.storage
        .from('bills')
        .list('test-uploads');
    
    if (listError) {
        console.error('List FAILED:', listError);
    } else {
        console.log('Files in test-uploads:', JSON.stringify(fileInfo, null, 2));
    }
    
    // Clean up
    fs.unlinkSync(tempFilePath);
    
    // Delete the test file from storage
    const { error: deleteError } = await supabaseAdmin.storage
        .from('bills')
        .remove([storagePath]);
    
    if (deleteError) {
        console.error('Delete FAILED:', deleteError);
    } else {
        console.log('Test file cleaned up from storage');
    }
}

testStorageUpload().catch(console.error);
