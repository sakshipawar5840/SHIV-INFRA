const http = require('http');
function get(path, token) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 3000, path, headers: {} };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    http.get(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d.slice(0, 150) }));
    }).on('error', reject);
  });
}
(async () => {
  const r = await get('/');
  console.log('ROOT', r.status, r.body.slice(0, 80));
  const r2 = await get('/projects');
  console.log('PROJECTS', r2.status, r2.body.slice(0, 80));
})();