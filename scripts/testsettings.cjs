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

  const get = await req('GET', '/api/v1/settings', null, token);
  console.log('GET', get.status, get.body.slice(0, 400));

  const put = await req('PUT', '/api/v1/settings', { companyName: 'SHIV INFRA SEC-AUDIT-1717', phone: '+910000000000', email: 'audit@shivinfra.com', address: 'Pune', gstNumber: 'TEST' }, token);
  console.log('PUT', put.status, put.body.slice(0, 500));

  const get2 = await req('GET', '/api/v1/settings', null, token);
  console.log('GET2', get2.status, get2.body.slice(0, 500));
})();