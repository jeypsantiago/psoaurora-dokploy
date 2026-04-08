#!/usr/bin/env node

import PocketBase from 'pocketbase';
import { createClient } from '@supabase/supabase-js';

const fail = (message) => {
  console.error(`[migrate:to-pocketbase] ${message}`);
  process.exit(1);
};

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const pocketbaseUrl = process.env.POCKETBASE_URL || process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
const pocketbaseSuperuserEmail = process.env.POCKETBASE_SUPERUSER_EMAIL || '';
const pocketbaseSuperuserPassword = process.env.POCKETBASE_SUPERUSER_PASSWORD || '';
const tempPassword = process.env.POCKETBASE_TEMP_PASSWORD || 'ChangeMe123!';

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

const asArray = (value) => {
  if (Array.isArray(value)) return value.map((entry) => String(entry)).filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((entry) => String(entry)).filter(Boolean);
    } catch {
      return [value.trim()];
    }
  }
  return [];
};

const asObject = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
  }
  return {};
};

const safeFileName = (value, fallback) => {
  const candidate = String(value || '').trim();
  return (candidate || fallback).replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-');
};

const downloadAsFile = async (url, fallbackName) => {
  const target = String(url || '').trim();
  if (!target) return null;

  const response = await fetch(target, {
    method: 'GET',
    headers: { Accept: '*/*' },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${target} (HTTP ${response.status}).`);
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const extension = contentType.split('/')[1]?.split(';')[0] || 'bin';
  const buffer = await response.arrayBuffer();
  return new File([buffer], safeFileName(fallbackName, `asset.${extension}`), {
    type: contentType,
  });
};

const getByLegacyId = async (collectionName, legacySupabaseId) => {
  if (!legacySupabaseId) return null;
  try {
    return await pb.collection(collectionName).getFirstListItem(pb.filter('legacySupabaseId = {:id}', { id: legacySupabaseId }));
  } catch (error) {
    if (Number(error?.status || error?.response?.status || 0) === 404) {
      return null;
    }
    throw error;
  }
};

const getUserByEmail = async (email) => {
  if (!email) return null;
  try {
    return await pb.collection('staff_users').getFirstListItem(pb.filter('email = {:email}', { email }));
  } catch (error) {
    if (Number(error?.status || error?.response?.status || 0) === 404) {
      return null;
    }
    throw error;
  }
};

const upsertStaffUser = async (row) => {
  const email = String(row.email || '').trim().toLowerCase();
  if (!email) return null;

  const formData = new FormData();
  const roles = asArray(row.roles);

  formData.append('email', email);
  formData.append('emailVisibility', 'true');
  formData.append('verified', 'true');
  formData.append('password', tempPassword);
  formData.append('passwordConfirm', tempPassword);
  formData.append('name', String(row.name || email));
  formData.append('roles', JSON.stringify(roles));
  formData.append('isSuperAdmin', String(roles.includes('Super Admin')));
  formData.append('gender', String(row.gender || 'Prefer not to say'));
  formData.append('position', String(row.position || ''));
  formData.append('prefsBundle', JSON.stringify(asObject(row.prefs_bundle)));
  formData.append('lastAccess', row.last_access ? String(row.last_access) : '');
  formData.append('mustResetPassword', 'true');
  formData.append('legacySupabaseId', String(row.id || ''));

  if (row.avatar_url) {
    try {
      const avatarFile = await downloadAsFile(row.avatar_url, `${email}-avatar`);
      if (avatarFile) formData.append('avatar', avatarFile);
    } catch (error) {
      console.warn(`[migrate:to-pocketbase] avatar download skipped for ${email}: ${error.message}`);
    }
  }

  if (row.signature_url) {
    try {
      const signatureFile = await downloadAsFile(row.signature_url, `${email}-signature`);
      if (signatureFile) formData.append('signature', signatureFile);
    } catch (error) {
      console.warn(`[migrate:to-pocketbase] signature download skipped for ${email}: ${error.message}`);
    }
  }

  const existing = await getByLegacyId('staff_users', String(row.id || '')) || await getUserByEmail(email);
  if (existing) {
    const updated = await pb.collection('staff_users').update(existing.id, formData);
    console.log(`[migrate:to-pocketbase] updated user ${email}`);
    return updated;
  }

  const created = await pb.collection('staff_users').create(formData);
  console.log(`[migrate:to-pocketbase] created user ${email}`);
  return created;
};

const findAppStateRecord = async (scope, ownerId, key) => {
  try {
    return await pb.collection('app_state').getFirstListItem(
      pb.filter('scope = {:scope} && ownerId = {:ownerId} && key = {:key}', {
        scope,
        ownerId: ownerId || '',
        key,
      }),
    );
  } catch (error) {
    if (Number(error?.status || error?.response?.status || 0) === 404) {
      return null;
    }
    throw error;
  }
};

const uploadLandingAsset = async (sourceUrl, kind, label, ownerId) => {
  const file = await downloadAsFile(sourceUrl, label);
  if (!file) return sourceUrl;

  const formData = new FormData();
  formData.append('label', label);
  formData.append('kind', kind);
  formData.append('ownerId', ownerId || '');
  formData.append('slotId', '');
  formData.append('legacySourceUrl', sourceUrl);
  formData.append('file', file);

  const record = await pb.collection('landing_assets').create(formData);
  const fileName = Array.isArray(record.file) ? record.file[0] : record.file;
  const nextUrl = pb.files.getURL(record, fileName);
  return nextUrl;
};

const migrateLandingConfig = async (config, fallbackOwnerId) => {
  const nextConfig = structuredClone(config);

  const heroImage = String(nextConfig?.hero?.backgroundImage || '').trim();
  if (heroImage && /^https?:\/\//i.test(heroImage) && !heroImage.includes('/api/files/')) {
    nextConfig.hero.backgroundImage = await uploadLandingAsset(heroImage, 'landing-hero', 'hero-background', fallbackOwnerId);
  }

  if (Array.isArray(nextConfig?.team?.members)) {
    for (let index = 0; index < nextConfig.team.members.length; index += 1) {
      const member = nextConfig.team.members[index];
      const memberImage = String(member?.image || '').trim();
      if (!memberImage || !/^https?:\/\//i.test(memberImage) || memberImage.includes('/api/files/')) {
        continue;
      }

      nextConfig.team.members[index] = {
        ...member,
        image: await uploadLandingAsset(
          memberImage,
          'landing-team-member',
          `${safeFileName(member?.name || `team-${index + 1}`, `team-${index + 1}`)}-image`,
          fallbackOwnerId,
        ),
      };
    }
  }

  return nextConfig;
};

await pb.collection('_superusers').authWithPassword(pocketbaseSuperuserEmail, pocketbaseSuperuserPassword);

const [{ data: staffUsers, error: staffUsersError }, { data: appState, error: appStateError }, { data: appFiles, error: appFilesError }] = await Promise.all([
  supabase.from('staff_users').select('*').order('created_at', { ascending: true }),
  supabase.from('app_state').select('*').order('created_at', { ascending: true }),
  supabase.from('app_files').select('*').order('created_at', { ascending: true }),
]);

if (staffUsersError) fail(`Failed to read public.staff_users: ${staffUsersError.message}`);
if (appStateError) fail(`Failed to read public.app_state: ${appStateError.message}`);
if (appFilesError) fail(`Failed to read public.app_files: ${appFilesError.message}`);

const userIdMap = new Map();
const createdUsers = [];

for (const row of staffUsers || []) {
  const migrated = await upsertStaffUser(row);
  if (!migrated) continue;
  userIdMap.set(String(row.id), String(migrated.id));
  createdUsers.push(migrated);
}

let migratedLandingAssets = 0;

for (const row of appState || []) {
  const scope = String(row.scope || 'global');
  const ownerId = row.owner ? (userIdMap.get(String(row.owner)) || '') : '';
  let nextValue = row.value;

  if (String(row.key || '') === 'aurora_landing_config' && row.value && typeof row.value === 'object') {
    nextValue = await migrateLandingConfig(row.value, createdUsers[0]?.id || '');
    const originalConfig = JSON.stringify(row.value);
    const migratedConfig = JSON.stringify(nextValue);
    if (originalConfig !== migratedConfig) {
      migratedLandingAssets += 1;
    }
  }

  const existing = await findAppStateRecord(scope, ownerId, String(row.key || ''));
  const payload = {
    key: String(row.key || ''),
    scope,
    ownerId,
    value: nextValue,
  };

  if (existing) {
    await pb.collection('app_state').update(existing.id, payload);
  } else {
    await pb.collection('app_state').create(payload);
  }
}

console.log('[migrate:to-pocketbase] Migration completed.');
console.log(`[migrate:to-pocketbase] Users migrated: ${createdUsers.length}`);
console.log(`[migrate:to-pocketbase] App state records migrated: ${(appState || []).length}`);
console.log(`[migrate:to-pocketbase] Supabase app_files rows inspected: ${(appFiles || []).length}`);
console.log(`[migrate:to-pocketbase] Landing config media sets remapped: ${migratedLandingAssets}`);
