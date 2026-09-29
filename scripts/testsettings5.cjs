const http = require('http');

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3000, path, method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const r = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  const login = await req('POST', '/api/v1/auth/login', { email: 'verify-admin@shivinfra.com', password: 'VerifyAdmin_2026!' });
  const token = JSON.parse(login.body).token;

  const g0 = await req('GET', '/api/v1/settings', null, token);
  console.log('GET0', g0.status, JSON.parse(g0.body).data?.alert_email);

  const p1 = await req('PUT', '/api/v1/settings', { alert_email: 'audit1@shivinfra.com' }, token);
  console.log('PUT alert_email=audit1', p1.status, JSON.parse(p1.body).data?.alert_email);

  const g1 = await req('GET', '/api/v1/settings', null, token);
  console.log('GET1', g1.status, JSON.parse(g1.body).data?.alert_email);

  const p2 = await req('PUT', '/api/v1/settings', { whatsapp_enabled: false }, token);
  console.log('PUT whatsapp_enabled=false', p2.status, JSON.parse(p2.body).data?.whatsapp_enabled);

  const g2 = await req('GET', '/api/v1/settings', null, token);
  console.log('GET2', g2.status, JSON.parse(g2.body).data?.whatsapp_enabled);

  const p3 = await req('PUT', '/api/v1/settings', { meta_phone_id: '+910000000171' }, token);
  console.log('PUT meta_phone_id', p3.status, JSON.parse(p3.body).data?.meta_phone_id);

  const g3 = await req('GET', '/api/v1/settings', null, token);
  console.log('GET3', g3.status, JSON.parse(g3.body).data?.meta_phone_id);

  // Company isolation: use a different user if available, else test unauthorized
  const unauth = await req('GET', '/api/v1/settings', null, null);
  console.log('UNAUTH', unauth.status, unauth.body.slice(0, 100));

  // Restore original
  const restore = await req('PUT', '/api/v1/settings', { alert_email: 'shivinfra55@gmail.com', whatsapp_enabled: true, meta_phone_id: null }, token);
  console.log('RESTORE', restore.status, restore.body.slice(0, 120));
})();