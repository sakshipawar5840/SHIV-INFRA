const fs = require('fs');
const cp = require('child_process');
const files = cp.execSync('grep -rl "bg-gradient-to-r from-primary to-primary-hover" src', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
console.log(files.join('\n'));