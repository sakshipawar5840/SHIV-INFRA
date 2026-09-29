$env:TEST_ADMIN_EMAIL = 'browser-test-admin@shivinfra.local';
$env:TEST_ADMIN_PASSWORD = 'BrowserTest123!';
npx tsx tests/browser-verification.spec.ts
