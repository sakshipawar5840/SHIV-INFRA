import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const apiKey = envContent.match(/GOOGLE_MAPS_API_KEY=(.+)/)?.[1]?.trim().replace(/^["']|["']$/g, '');

if (!apiKey) {
    console.error('Missing GOOGLE_MAPS_API_KEY');
    process.exit(1);
}

async function testGooglePlaces() {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=18.5204,73.8567&radius=5000&type=store&keyword=cement&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Google Places API response:');
    console.log(JSON.stringify(data, null, 2));
}

testGooglePlaces().catch(console.error);
