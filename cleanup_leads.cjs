const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const COMPANY = process.env.DEFAULT_COMPANY_ID;
const REMARKS = process.env.REMARKS || "SHIVINFRA_LEAD_VERIFY_20260824";

(async () => {
  const { data, error } = await supabase.from('leads').delete().eq('company_id', COMPANY).eq('remarks', REMARKS).select('id');
  if (error) { console.log('CLEANUP ERROR:', error.message); process.exit(1); }
  console.log('Cleaned up test leads:', data ? data.length : 0);
  const { data: remain } = await supabase.from('leads').select('id').eq('company_id', COMPANY).eq('remarks', REMARKS);
  console.log('Remaining with remarks:', remain ? remain.length : 0);
})().catch(e => console.log('ERR', e.message));
