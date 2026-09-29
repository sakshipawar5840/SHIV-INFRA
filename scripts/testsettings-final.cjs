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

  // Empty payload should now return 200 instead of 500
  const p1 = await req('PUT', '/api/v1/settings', {}, token);
  console.log('PUT {} (empty)', p1.status, p1.body.slice(0, 120));

  // settings_data should be silently ignored, not crash
  const p2 = await req('PUT', '/api/v1/settings', { settings_data: { companyName: 'X' } }, token);
  console.log('PUT settings_data', p2.status, p2.body.slice(0, 120));

  // Supported field persists
  const p3 = await req('PUT', '/api/v1/settings', { alert_email: 'final@shivinfra.com' }, token);
  console.log('PUT alert_email', p3.status, p3.body.slice(0, 120));

  const g = await req('GET', '/api/v1/settings', null, token);
  console.log('GET', g.status, JSON.parse(g.body).data?.alert_email);

  // Restore
  await req('PUT', '/api/v1/settings', { alert_email: 'shivinfra55@gmail.com' }, token);
})();