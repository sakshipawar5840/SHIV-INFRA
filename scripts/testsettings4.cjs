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

  const tests = [
    ['meta_fb_page_id', { meta_fb_page_id: '123' }],
    ['meta_ig_account_id', { meta_ig_account_id: '456' }],
    ['sms_enabled', { sms_enabled: true }],
    ['google_drive', { google_drive_folder_id: 'gdrive123' }],
    ['google_calendar', { google_calendar_id: 'cal123' }],
    ['openai', { openai_key_override: 'sk-test' }],
  ];
  for (const [name, body] of tests) {
    const r = await req('PUT', '/api/v1/settings', body, token);
    console.log(name, r.status, r.body.slice(0, 150));
  }
})();