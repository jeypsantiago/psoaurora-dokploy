import PocketBase from 'pocketbase';
import { getPocketBaseUrl, runReportReminders } from './report-reminder-core.mjs';

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

const getBearerToken = (req) => {
  const header = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
};

const verifySuperAdmin = async (token) => {
  if (!token) {
    return { ok: false, status: 401, message: 'Missing authorization token.' };
  }

  const pb = new PocketBase(getPocketBaseUrl());
  pb.autoCancellation(false);
  pb.authStore.save(token, null);

  try {
    const auth = await pb.collection('users').authRefresh();
    const record = auth.record || {};
    const roles = Array.isArray(record.roles) ? record.roles : [];
    const isSuperAdmin = Boolean(record.isSuperAdmin || roles.includes('Super Admin'));
    if (!isSuperAdmin) {
      return { ok: false, status: 403, message: 'Only Super Admin users can send test reminders.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 401, message: 'Invalid or expired authorization token.' };
  }
};

export const handleReportReminderTestRequest = async (req, res) => {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { ok: false, message: 'Invalid JSON payload.' });
    return;
  }

  const reportId = typeof body.reportId === 'string' ? body.reportId.trim() : '';
  if (!reportId) {
    sendJson(res, 400, { ok: false, message: 'reportId is required.' });
    return;
  }

  const auth = await verifySuperAdmin(getBearerToken(req));
  if (!auth.ok) {
    sendJson(res, auth.status, { ok: false, message: auth.message });
    return;
  }

  try {
    const result = await runReportReminders({
      testMode: true,
      targetReportId: reportId,
      authenticate: true,
      requireEnabled: false,
    });

    if (result.sent < 1) {
      sendJson(res, 500, {
        ok: false,
        message: result.failed > 0
          ? 'Test reminder failed. Check reminder log for details.'
          : 'No reminder was sent for the selected report.',
        result,
      });
      return;
    }

    sendJson(res, 200, { ok: true, message: 'Test reminder sent.', result });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: error?.message || 'Unable to send test reminder.',
    });
  }
};

