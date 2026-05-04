import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PocketBase from 'pocketbase';
import { createPocketBaseClient, getPocketBaseUrl } from './report-reminder-core.mjs';

const REGISTERED_ROLE = 'Report Contributor';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const loadLocalEnvFallback = () => {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex < 1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] ??= value;
  }
};

loadLocalEnvFallback();

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
};

const readJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
    if (Buffer.concat(chunks).length > 1024 * 1024) {
      throw new Error('Request body is too large.');
    }
  }
  const text = Buffer.concat(chunks).toString('utf8').trim();
  return text ? JSON.parse(text) : {};
};

const authenticateSuperuserClient = async (pb) => {
  const superuserEmail = process.env.POCKETBASE_SUPERUSER_EMAIL || '';
  const superuserPassword = process.env.POCKETBASE_SUPERUSER_PASSWORD || '';
  if (!superuserEmail || !superuserPassword) {
    throw new Error('Registration is not configured on this deployment.');
  }
  await pb.collection('_superusers').authWithPassword(superuserEmail, superuserPassword);
};

const toPublicMessage = (error) => {
  const status = Number(error?.status || error?.response?.status || 500);
  const data = error?.response?.data || {};
  if (status === 400 && data.email) return 'An account with this email may already exist.';
  if (status === 400) return 'Check the registration form and try again.';
  return error?.message || 'Unable to create account.';
};

export const handleRegisterRequest = async (req, res) => {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { ok: false, message: 'Invalid registration request.' });
    return;
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const position = typeof body.position === 'string' ? body.position.trim() : '';
  const gender = typeof body.gender === 'string' ? body.gender.trim() : 'Prefer not to say';
  const password = typeof body.password === 'string' ? body.password.trim() : '';

  if (!name || !email || !password) {
    sendJson(res, 400, { ok: false, message: 'Name, email, and password are required.' });
    return;
  }
  if (!isValidEmail(email)) {
    sendJson(res, 400, { ok: false, message: 'Enter a valid email address.' });
    return;
  }
  if (password.length < 8) {
    sendJson(res, 400, { ok: false, message: 'Password must be at least 8 characters.' });
    return;
  }

  const adminPb = createPocketBaseClient();
  try {
    await authenticateSuperuserClient(adminPb);
    await adminPb.collection('users').create({
      email,
      emailVisibility: true,
      verified: true,
      password,
      passwordConfirm: password,
      name,
      roles: [REGISTERED_ROLE],
      isSuperAdmin: false,
      gender,
      position,
      prefsBundle: {},
      mustResetPassword: false,
      lastAccess: null,
    });

    const userPb = new PocketBase(getPocketBaseUrl());
    userPb.autoCancellation(false);
    const authData = await userPb.collection('users').authWithPassword(email, password);
    await userPb.collection('users').update(authData.record.id, {
      lastAccess: new Date().toISOString(),
    }).catch(() => undefined);

    sendJson(res, 201, {
      ok: true,
      token: authData.token,
      record: authData.record,
    });
  } catch (error) {
    sendJson(res, Number(error?.status || error?.response?.status || 500), {
      ok: false,
      message: toPublicMessage(error),
    });
  }
};
