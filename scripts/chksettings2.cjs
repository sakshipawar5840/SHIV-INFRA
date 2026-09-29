const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const c = fs.readFileSync('.env', 'utf8');
const m = c.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
const key = m ? m[1].replace(/"/g,'') : '';
const supabase = createClient('https://wiyakkkuvcwikukmvwol.supabase.co', key);
(async () => {
  const cid = '3e9e9ae1-8593-473f-9aa3-9bcee469d795';
  // Test update with .select().single()
  const { data, error } = await supabase.from('settings').update({ alert_email: 'audit@shivinfra.com' }).eq('company_id', cid).select().single();
  console.log('UPDATE SINGLE', error, JSON.stringify(data));

  // Test update without select
  const { data: d2, error: e2 } = await supabase.from('settings').update({ alert_email: 'audit2@shivinfra.com' }).eq('company_id', cid).select();
  console.log('UPDATE SELECT', e2, JSON.stringify(d2));

  // Test update with settings_data merge path
  const { data: existing } = await supabase.from('settings').select('settings_data').eq('company_id', cid).single();
  console.log('EXISTING', JSON.stringify(existing));
  const merged = { ...(existing?.settings_data || {}), companyName: 'SHIV INFRA SEC-AUDIT-1717', phone: '+910000000000' };
  const { data: d3, error: e3 } = await supabase.from('settings').update({ settings_data: merged }).eq('company_id', cid).select().single();
  console.log('UPDATE SD', e3, JSON.stringify(d3));
})();