import { spawn } from 'node:child_process';

process.env.VITE_HTTPS = '0';
const child = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});
child.on('exit', (code) => process.exit(code ?? 0));
