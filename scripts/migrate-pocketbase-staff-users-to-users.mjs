#!/usr/bin/env node

import PocketBase from 'pocketbase';

const fail = (message) => {
  console.error(`[migrate:pb-staff-users-to-users] ${message}`);
  process.exit(1);
};

const pocketbaseUrl = process.env.POCKETBASE_URL || process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
const pocketbaseSuperuserEmail = process.env.POCKETBASE_SUPERUSER_EMAIL || '';
const pocketbaseSuperuserPassword = process.env.POCKETBASE_SUPERUSER_PASSWORD || '';
const tempPassword = process.env.POCKETBASE_TEMP_PASSWORD || 'ChangeMe123!';

if (!pocketbaseSuperuserEmail || !pocketbaseSuperuserPassword) {
  fail('Missing POCKETBASE_SUPERUSER_EMAIL or POCKETBASE_SUPERUSER_PASSWORD.');
}

const pb = new PocketBase(pocketbaseUrl);

const firstFileName = (value) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return '';
};

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

const downloadCollectionFile = async (record, fieldName, fallbackName) => {
  const fileName = firstFileName(record?.[fieldName]);
  if (!fileName) return null;

  const url = pb.files.getURL(record, fileName);
  const response = await fetch(url, {
    headers: {
      Authorization: pb.authStore.token,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${fieldName} for ${record.email || record.id} (HTTP ${response.status}).`);
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const extension = contentType.split('/')[1]?.split(';')[0] || 'bin';
  const buffer = await response.arrayBuffer();
  return new File([buffer], safeFileName(fallbackName, `${fieldName}.${extension}`), {
    type: contentType,
  });
};

const getUserByEmail = async (email) => {
  try {
    return await pb.collection('users').getFirstListItem(pb.filter('email = {:email}', { email }));
  } catch (error) {
    if (Number(error?.status || error?.response?.status || 0) === 404) {
      return null;
    }
    throw error;
  }
};

const getUserByLegacyId = async (legacySupabaseId) => {
  if (!legacySupabaseId) return null;
  try {
    return await pb.collection('users').getFirstListItem(pb.filter('legacySupabaseId = {:id}', { id: legacySupabaseId }));
  } catch (error) {
    if (Number(error?.status || error?.response?.status || 0) === 404) {
      return null;
    }
    throw error;
  }
};

await pb.collection('_superusers').authWithPassword(pocketbaseSuperuserEmail, pocketbaseSuperuserPassword);

const legacyUsers = await pb.collection('staff_users').getFullList();
const idMap = new Map();

for (const legacyUser of legacyUsers) {
  const email = String(legacyUser.email || '').trim().toLowerCase();
  if (!email) continue;

  const formData = new FormData();
  formData.append('email', email);
  formData.append('emailVisibility', 'true');
  formData.append('verified', String(!!legacyUser.verified));
  formData.append('password', tempPassword);
  formData.append('passwordConfirm', tempPassword);
  formData.append('name', String(legacyUser.name || email));
  formData.append('roles', JSON.stringify(asArray(legacyUser.roles)));
  formData.append('isSuperAdmin', String(!!legacyUser.isSuperAdmin));
  formData.append('gender', String(legacyUser.gender || 'Prefer not to say'));
  formData.append('position', String(legacyUser.position || ''));
  formData.append('prefsBundle', JSON.stringify(asObject(legacyUser.prefsBundle)));
  formData.append('lastAccess', legacyUser.lastAccess ? String(legacyUser.lastAccess) : '');
  formData.append('mustResetPassword', String(!!legacyUser.mustResetPassword));
  formData.append('legacySupabaseId', String(legacyUser.legacySupabaseId || ''));

  try {
    const avatar = await downloadCollectionFile(legacyUser, 'avatar', `${email}-avatar`);
    if (avatar) formData.append('avatar', avatar);
  } catch (error) {
    console.warn(`[migrate:pb-staff-users-to-users] skipped avatar for ${email}: ${error.message}`);
  }

  try {
    const signature = await downloadCollectionFile(legacyUser, 'signature', `${email}-signature`);
    if (signature) formData.append('signature', signature);
  } catch (error) {
    console.warn(`[migrate:pb-staff-users-to-users] skipped signature for ${email}: ${error.message}`);
  }

  const existing = await getUserByLegacyId(String(legacyUser.legacySupabaseId || '')) || await getUserByEmail(email);
  let userRecord;
  if (existing) {
    userRecord = await pb.collection('users').update(existing.id, formData);
    console.log(`[migrate:pb-staff-users-to-users] updated ${email}`);
  } else {
    userRecord = await pb.collection('users').create(formData);
    console.log(`[migrate:pb-staff-users-to-users] created ${email}`);
  }

  userRecord = await pb.collection('users').update(userRecord.id, {
    password: tempPassword,
    passwordConfirm: tempPassword,
    mustResetPassword: true,
  });

  idMap.set(String(legacyUser.id), String(userRecord.id));
}

const appStateRecords = await pb.collection('app_state').getFullList();
for (const record of appStateRecords) {
  const oldOwnerId = String(record.ownerId || '');
  const newOwnerId = idMap.get(oldOwnerId);
  if (!oldOwnerId || !newOwnerId || oldOwnerId === newOwnerId) continue;
  await pb.collection('app_state').update(record.id, { ownerId: newOwnerId });
}

const landingAssets = await pb.collection('landing_assets').getFullList();
for (const record of landingAssets) {
  const oldOwnerId = String(record.ownerId || '');
  const newOwnerId = idMap.get(oldOwnerId);
  if (!oldOwnerId || !newOwnerId || oldOwnerId === newOwnerId) continue;
  await pb.collection('landing_assets').update(record.id, { ownerId: newOwnerId });
}

console.log(`[migrate:pb-staff-users-to-users] migrated ${idMap.size} account(s) into users.`);
