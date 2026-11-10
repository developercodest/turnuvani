import { execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = readFileSync(path.join(root, 'supabase/config.toml'), 'utf8');
if (!/^project_id\s*=\s*"turnuvani-isolated"\s*$/m.test(config)) {
  throw new Error('Unexpected local project ID');
}

const status = execFileSync(
  'npx',
  ['--yes', 'supabase@2.75.0', 'status', '--workdir', root, '-o', 'env'],
  { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
);
const env = Object.fromEntries(
  status
    .split(/\r?\n/)
    .map((line) => line.match(/^([A-Z_]+)="(.*)"$/))
    .filter(Boolean)
    .map((match) => [match[1], match[2]]),
);
const url = new URL(env.API_URL || '');
if (
  url.protocol !== 'http:' ||
  !['127.0.0.1', 'localhost'].includes(url.hostname) ||
  url.port !== '54321' ||
  !(env.PUBLISHABLE_KEY || env.ANON_KEY)
) {
  throw new Error('Refusing non-local Supabase target');
}

const child = spawn('npx', ['next', 'dev'], {
  cwd: root,
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: url.href.replace(/\/$/, ''),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: env.PUBLISHABLE_KEY || env.ANON_KEY,
  },
  stdio: 'inherit',
});
child.on('exit', (code) => process.exit(code ?? 1));
