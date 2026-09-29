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

  const create = await req('POST', '/api/v1/inquiries', {
    name: 'SEC-AUDIT-CLIENT-1717',
    phone: '+910000000171',
    project: 'SEC-AUDIT-PROJ-1717',
    location: 'Baner, Pune',
    budget: 6500000,
    requirement: '2 BHK',
    interest_level: 'High',
    status: 'New',
    replied: false,
    notes: 'sec audit test'
  }, token);
  console.log('CREATE', create.status, create.body.slice(0, 300));
  const id = JSON.parse(create.body).data?.id;
  if (!id) return;

  const put1 = await req('PUT', `/api/v1/inquiries/${id}`, { replied: true }, token);
  console.log('PUT replied=true', put1.status, put1.body.slice(0, 300));

  const get = await req('GET', `/api/v1/inquiries/${id}`, null, token);
  console.log('GET after', get.status, JSON.parse(get.body).data?.replied);

  const put2 = await req('PUT', `/api/v1/inquiries/${id}`, { replied: false }, token);
  console.log('PUT replied=false', put2.status, put2.body.slice(0, 200));

  const get2 = await req('GET', `/api/v1/inquiries/${id}`, null, token);
  console.log('GET after2', get2.status, JSON.parse(get2.body).data?.replied);

  const del = await req('DELETE', `/api/v1/inquiries/${id}`, null, token);
  console.log('DELETE', del.status, del.body.slice(0, 200));
})();