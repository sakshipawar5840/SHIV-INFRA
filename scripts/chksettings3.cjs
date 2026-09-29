const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const c = fs.readFileSync('.env', 'utf8');
const m = c.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
const key = m ? m[1].replace(/"/g,'') : '';
const supabase = createClient('https://wiyakkkuvcwikukmvwol.supabase.co', key);
(async () => {
  const cid = '3e9e9ae1-8593-473f-9aa3-9bcee469d795';
  const { data, error } = await supabase.from('settings').select('*').eq('company_id', cid).single();
  console.log('ERR', error);
  console.log('COLUMNS', data ? Object.keys(data).join(', ') : 'NONE');
  console.log('ROW', JSON.stringify(data));
})();