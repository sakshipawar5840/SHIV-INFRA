import { supabaseAdmin as supabase } from '../backend/config/supabase.ts';

async function verifyTable() {
  console.log('Verifying pending_confirmations table...');
  const { data, error } = await supabase
    .from('pending_confirmations')
    .select('id')
    .limit(1);
  
  if (error) {
    console.log('TABLE STATUS: MISSING or ERROR');
    console.log('Error:', error.message);
  } else {
    console.log('TABLE STATUS: EXISTS and OPERATIONAL');
    console.log('Sample data:', data);
  }
}

verifyTable().catch(console.error);
