import http from 'http';

function checkHealth() {
  return new Promise((resolve) => {
    http.get('http://127.0.0.1:3000/health', (res) => {
      let body = '';
      res.on('data', (d) => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', () => resolve(null));
  });
}

async function waitForServer(maxRetries = 60) {
  for (let i = 0; i < maxRetries; i++) {
    const result = await checkHealth();
    if (result && result.status === 200) {
      console.log('SERVER READY:', result.status, result.body);
      return true;
    }
    console.log('Waiting... ' + (i + 1) + '/' + maxRetries);
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('SERVER NOT READY');
  return false;
}

waitForServer();
