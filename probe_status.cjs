const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const COMPANY = process.env.DEFAULT_COMPANY_ID;

(async () => {
  const statuses = ['New','Follow Up','Hot','Closed','Lost','Contacted','Qualified','Visited','Pending'];
  for (const s of statuses) {
    const { data, error } = await supabase.from('leads').insert({ company_id: COMPANY, status: s, remarks: '__ct_probe__' }).select('id').maybeSingle();
    if (error) {
      console.log(s, '-> REJECTED');
    } else {
      console.log(s, '-> ALLOWED (id ' + data.id + ')');
      await supabase.from('leads').delete().eq('id', data.id);
    }
  }
})().catch(e => console.log('ERR', e.message));
