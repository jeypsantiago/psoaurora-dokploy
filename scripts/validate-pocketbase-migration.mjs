#!/usr/bin/env node

import PocketBase from 'pocketbase';
import { createClient } from '@supabase/supabase-js';

const fail = (message) => {
  console.error(`[validate:pocketbase-migration] ${message}`);
  process.exit(1);
};

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const pocketbaseUrl = process.env.POCKETBASE_URL || process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
const pocketbaseSuperuserEmail = process.env.POCKETBASE_SUPERUSER_EMAIL || '';
const pocketbaseSuperuserPassword = process.env.POCKETBASE_SUPERUSER_PASSWORD || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  fail('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
}

if (!pocketbaseSuperuserEmail || !pocketbaseSuperuserPassword) {
  fail('Missing POCKETBASE_SUPERUSER_EMAIL or POCKETBASE_SUPERUSER_PASSWORD.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const pb = new PocketBase(pocketbaseUrl);

await pb.collection('_superusers').authWithPassword(pocketbaseSuperuserEmail, pocketbaseSuperuserPassword);

const [{ count: supabaseUsers, error: usersError }, { count: supabaseAppState, error: appStateError }, { count: supabaseAppFiles, error: appFilesError }] = await Promise.all([
  supabase.from('staff_users').select('*', { count: 'exact', head: true }),
  supabase.from('app_state').select('*', { count: 'exact', head: true }),
  supabase.from('app_files').select('*', { count: 'exact', head: true }),
]);

if (usersError) fail(`Failed to count Supabase staff_users: ${usersError.message}`);
if (appStateError) fail(`Failed to count Supabase app_state: ${appStateError.message}`);
if (appFilesError) fail(`Failed to count Supabase app_files: ${appFilesError.message}`);

const [pocketbaseUsers, pocketbaseAppState, pocketbaseLandingAssets] = await Promise.all([
  pb.collection('staff_users').getFullList({ fields: 'id' }),
  pb.collection('app_state').getFullList({ fields: 'id' }),
  pb.collection('landing_assets').getFullList({ fields: 'id' }),
]);

console.log('[validate:pocketbase-migration] Migration count summary');
console.log(`- Supabase staff_users: ${supabaseUsers || 0}`);
console.log(`- PocketBase staff_users: ${pocketbaseUsers.length}`);
console.log(`- Supabase app_state: ${supabaseAppState || 0}`);
console.log(`- PocketBase app_state: ${pocketbaseAppState.length}`);
console.log(`- Supabase app_files: ${supabaseAppFiles || 0}`);
console.log(`- PocketBase landing_assets: ${pocketbaseLandingAssets.length}`);

if ((pocketbaseUsers.length || 0) < (supabaseUsers || 0)) {
  process.exitCode = 1;
}

if ((pocketbaseAppState.length || 0) < (supabaseAppState || 0)) {
  process.exitCode = 1;
}

if (process.exitCode) {
  console.error('[validate:pocketbase-migration] Validation failed: PocketBase counts are lower than Supabase counts.');
} else {
  console.log('[validate:pocketbase-migration] Validation passed.');
}
