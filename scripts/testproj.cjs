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
      res.on('end', () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  const login = await req('POST', '/api/v1/auth/login', { email: 'verify-admin@shivinfra.com', password: 'VerifyAdmin_2026!' });
  const token = JSON.parse(login.body).token;

  const bad = await req('POST', '/api/v1/projects', { project_name: 'BadField', location: 'X', flat_type: '1', sqft: '1', price: 1, status: 'Ongoing', description: 'd', progress: 0, completion_status: 'c', possession_date: '2027-01-01', thumbnail_url: 'x' }, token);
  console.log('OLD FIELD (thumbnail_url)', bad.status, bad.body.slice(0, 200));

  const good = await req('POST', '/api/v1/projects', { project_name: 'SEC-AUDIT-PROJ-1717', location: 'Baner, Pune', flat_type: '2 BHK', sqft: '1100', price: 6500000, status: 'Ongoing', description: 'Sec audit test project', progress: 5, completion_status: 'Foundation', possession_date: '2027-06-01', brochure_pdf_url: 'https://example.com/cover.jpg' }, token);
  console.log('CREATE', good.status, good.body.slice(0, 300));

  const list = await req('GET', '/api/v1/projects?q=SEC-AUDIT-PROJ-1717', null, token);
  console.log('SEARCH', list.status, list.body.slice(0, 300));
})();