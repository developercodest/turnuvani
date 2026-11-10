import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = 'supabase_db_turnuvani-isolated';
const config = readFileSync(path.join(root, 'supabase/config.toml'), 'utf8');
if (!/^project_id\s*=\s*"turnuvani-isolated"\s*$/m.test(config)) throw new Error('Unexpected local project ID');
const status = execFileSync('npx', ['--yes', 'supabase@2.75.0', 'status', '--workdir', root, '-o', 'env'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const env = Object.fromEntries(status.split(/\r?\n/).map((line) => line.match(/^([A-Z_]+)="(.*)"$/)).filter(Boolean).map((match) => [match[1], match[2]]));
const url = new URL(env.API_URL || '');
if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname) || url.port !== '54321' || !env.SERVICE_ROLE_KEY) throw new Error('Refusing non-local Supabase target');
const sql = (query) => execFileSync('docker', ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-v', 'ON_ERROR_STOP=1', '-qAt'], { input: query, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
const files = readdirSync(path.join(root, 'supabase/migrations')).filter((name) => /^\d{14}_.+\.sql$/.test(name)).map((name) => name.slice(0, 14)).sort();
const applied = sql('select version from supabase_migrations.schema_migrations order by version;').trim().split('\n').filter(Boolean);
if (JSON.stringify(files) !== JSON.stringify(applied)) throw new Error('Local migration history differs from the workspace; update the local environment first');
const admin = createClient(url.href, env.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const addresses = ['qa-owner@turnuvani.test', 'qa-other@turnuvani.test'];
const created = [];
let failed = false;
try {
  // Do not adopt or delete pre-existing users, even if they use reserved addresses.
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error('Could not inspect local test users');
    if (data.users.some((user) => addresses.includes(user.email ?? ''))) throw new Error('Reserved local test user already exists; resolve it manually');
    if (data.users.length < 100) break;
  }
  for (const email of addresses) {
    const { data, error } = await admin.auth.admin.createUser({ email, password: randomBytes(24).toString('hex'), email_confirm: true });
    if (error || !data.user) throw new Error('Could not create local test user');
    created.push(data.user.id);
  }
  const scenarios = JSON.stringify(JSON.parse(readFileSync(path.join(root, 'src/lib/league/standings-parity-cases.json'), 'utf8'))).replaceAll("'", "''");
  for (const name of ['rls_access.sql', 'tournament_security.sql', 'multi_team_security.sql', 'standings_parity.sql']) {
    let query = readFileSync(path.join(root, 'supabase/tests', name), 'utf8');
    query = query.replace("'__CASES_JSON__'", `'${scenarios}'`);
    sql(query);
    console.log(`${name}: passed`);
  }
} catch (error) {
  failed = true;
  console.error(`Local database tests failed: ${error.message}`);
} finally {
  for (const id of created.reverse()) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) { failed = true; console.error('Failed to clean up a generated local test user'); }
  }
}
if (failed) process.exitCode = 1;
