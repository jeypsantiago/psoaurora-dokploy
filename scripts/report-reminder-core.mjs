import net from 'node:net';
import tls from 'node:tls';
import crypto from 'node:crypto';
import PocketBase from 'pocketbase';

export const REPORT_REMINDER_KEYS = {
  projects: 'aurora_report_projects',
  submissions: 'aurora_report_submissions',
  settings: 'aurora_report_settings',
  log: 'aurora_report_reminder_log',
};

export const DEFAULT_REPORT_REMINDER_SETTINGS = {
  enabled: true,
  defaultLeadDays: 5,
  dailyCheckTime: '08:00',
  subjectTemplate: 'Report reminder: {{reportTitle}} due on {{deadline}}',
  bodyTemplate:
    `<div style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:640px;max-width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:24px 28px;border-bottom:1px solid #e4e4e7;background:#ffffff;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            <tr>
              <td width="80" style="vertical-align:middle;">{{psaLogo}}</td>
              <td style="vertical-align:middle;">
                <div style="font-size:15px;font-weight:800;text-transform:uppercase;color:#18181b;">Philippine Statistics Authority</div>
                <div style="font-size:13px;font-weight:700;color:#3f3f46;margin-top:3px;">Aurora Provincial Statistical Office</div>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:28px;">
          <div style="font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#2563eb;margin-bottom:10px;">Report Submission Reminder</div>
          <h1 style="margin:0 0 18px;font-size:24px;line-height:1.25;color:#18181b;">Report due on <strong>{{deadline}}</strong></h1>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#3f3f46;">Hello <strong>{{focalPersonName}}</strong>,</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3f3f46;">This is an official reminder regarding the report below. Please complete, review, and submit it <strong>on or before the deadline</strong>.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e4e4e7;border-radius:12px;margin:20px 0;">
            <tr><td style="padding:14px 16px;font-size:13px;color:#71717a;border-bottom:1px solid #e4e4e7;">Project</td><td style="padding:14px 16px;font-size:14px;font-weight:800;color:#18181b;border-bottom:1px solid #e4e4e7;">{{projectName}}</td></tr>
            <tr><td style="padding:14px 16px;font-size:13px;color:#71717a;border-bottom:1px solid #e4e4e7;">Report</td><td style="padding:14px 16px;font-size:14px;font-weight:800;color:#18181b;border-bottom:1px solid #e4e4e7;">{{reportTitle}}</td></tr>
            <tr><td style="padding:14px 16px;font-size:13px;color:#71717a;border-bottom:1px solid #e4e4e7;">Reporting Period</td><td style="padding:14px 16px;font-size:14px;font-weight:800;color:#18181b;border-bottom:1px solid #e4e4e7;">{{period}}</td></tr>
            <tr><td style="padding:14px 16px;font-size:13px;color:#71717a;">Deadline</td><td style="padding:14px 16px;font-size:14px;font-weight:900;color:#b91c1c;">{{deadline}}</td></tr>
          </table>
          <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:#52525b;">If the report has already been submitted, kindly disregard this reminder.</p>
          <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:#52525b;">Thank you.</p>
        </td></tr>
        <tr><td style="padding:18px 28px;background:#18181b;color:#d4d4d8;font-size:12px;line-height:1.5;">Philippine Statistics Authority - Aurora Provincial Statistical Office</td></tr>
      </table>
    </td></tr>
  </table>
</div>`,
};

export const getPocketBaseUrl = () =>
  process.env.POCKETBASE_URL || process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

export const createPocketBaseClient = () => {
  const pb = new PocketBase(getPocketBaseUrl());
  pb.autoCancellation(false);
  return pb;
};

const quoted = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const findAppState = async (pb, key, fallback) => {
  try {
    const record = await pb.collection('app_state').getFirstListItem(`key = ${quoted(key)} && scope = 'global'`);
    return { record, value: record.value ?? fallback };
  } catch (error) {
    if (Number(error?.status || 0) === 404) return { record: null, value: fallback };
    throw error;
  }
};

const upsertAppState = async (pb, key, value) => {
  const existing = await findAppState(pb, key, null);
  const payload = { key, scope: 'global', ownerId: '', value };
  if (existing.record?.id) {
    await pb.collection('app_state').update(existing.record.id, payload);
    return;
  }
  await pb.collection('app_state').create(payload);
};

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getLeadDays = (report, project, settings) => {
  const raw = report.reminderLeadDays ?? project?.reminderLeadDays ?? settings.defaultLeadDays ?? 5;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 5;
};

const fillTemplate = (template, values) =>
  String(template || '').replace(/\{\{(\w+)\}\}/g, (_match, key) => String(values[key] ?? ''));

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildPsaLogoHtml = () => {
  const logoUrl = String(process.env.PSA_LOGO_URL || '').trim();
  if (!logoUrl) {
    return '<div style="width:58px;height:58px;border-radius:12px;border:1px solid #e4e4e7;display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#2563eb;background:#eff6ff;text-align:center;line-height:58px;">PSA</div>';
  }

  return `<img src="${escapeHtml(logoUrl)}" alt="PSA Logo" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:contain;border:0;" />`;
};

const stripHtmlToText = (html) =>
  String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/(p|div|h1|h2|h3|tr|table)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const encodeHeader = (value) =>
  /[^\x20-\x7e]/.test(String(value))
    ? `=?UTF-8?B?${Buffer.from(String(value), 'utf8').toString('base64')}?=`
    : String(value).replace(/[\r\n]+/g, ' ');

const escapeMimeLine = (value) => String(value).replace(/^\./gm, '..');

const encodeAddress = (name, email) => {
  const cleanEmail = String(email || '').replace(/[\r\n<>]+/g, '').trim();
  const cleanName = String(name || '').replace(/[\r\n"]+/g, ' ').trim();
  return cleanName ? `${encodeHeader(cleanName)} <${cleanEmail}>` : cleanEmail;
};

const readResponse = (socket) =>
  new Promise((resolve, reject) => {
    let buffer = '';
    const onData = (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const last = lines[lines.length - 1] || '';
      if (/^\d{3} /.test(last)) {
        socket.off('data', onData);
        resolve(buffer);
      }
    };
    socket.on('data', onData);
    socket.once('error', reject);
  });

const sendCommand = async (socket, command, expected) => {
  socket.write(`${command}\r\n`);
  const response = await readResponse(socket);
  const code = Number(response.slice(0, 3));
  const expectedCodes = Array.isArray(expected) ? expected : [expected];
  if (!expectedCodes.includes(code)) {
    const safeCommand = /^(AUTH LOGIN|[A-Za-z0-9+/=]{8,})$/i.test(command.trim())
      ? '[redacted-auth-command]'
      : command;
    throw new Error(`SMTP command failed (${safeCommand}): ${response.trim()}`);
  }
  return response;
};

const connectSmtp = () =>
  new Promise((resolve, reject) => {
    const host = process.env.SMTP_HOST || '';
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === '1' || port === 465;
    if (!host) reject(new Error('SMTP_HOST is required.'));

    const socket = secure
      ? tls.connect({ host, port, servername: host }, () => resolve(socket))
      : net.connect({ host, port }, () => resolve(socket));
    socket.once('error', reject);
  });

export const sendReportReminderEmail = async ({ to, subject, htmlBody, textBody }) => {
  const host = process.env.SMTP_HOST || '';
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const from = process.env.SMTP_FROM || user;
  const fromName = process.env.SMTP_FROM_NAME || process.env.SMTP_SENDER_NAME || 'PSO-Aurora';
  const port = Number(process.env.SMTP_PORT || 587);
  if (!host || !from) throw new Error('SMTP_HOST and SMTP_FROM or SMTP_USER are required.');

  const socket = await connectSmtp();
  await readResponse(socket);
  await sendCommand(socket, `EHLO ${process.env.SMTP_HELO || 'pso-aurora.local'}`, 250);

  if (process.env.SMTP_SECURE !== '1' && port !== 465 && process.env.SMTP_STARTTLS !== '0') {
    await sendCommand(socket, 'STARTTLS', 220);
    const secureSocket = tls.connect({ socket, servername: host });
    await sendCommand(secureSocket, `EHLO ${process.env.SMTP_HELO || 'pso-aurora.local'}`, 250);
    return sendEmailOverSocket(secureSocket, { user, pass, from, fromName, to, subject, htmlBody, textBody });
  }

  return sendEmailOverSocket(socket, { user, pass, from, fromName, to, subject, htmlBody, textBody });
};

const sendEmailOverSocket = async (socket, { user, pass, from, fromName, to, subject, htmlBody, textBody }) => {
  if (user && pass) {
    await sendCommand(socket, 'AUTH LOGIN', 334);
    await sendCommand(socket, Buffer.from(user).toString('base64'), 334);
    await sendCommand(socket, Buffer.from(pass).toString('base64'), 235);
  }

  await sendCommand(socket, `MAIL FROM:<${from}>`, 250);
  await sendCommand(socket, `RCPT TO:<${to}>`, [250, 251]);
  await sendCommand(socket, 'DATA', 354);
  const boundary = `report-reminder-${crypto.randomUUID()}`;
  const message = [
    `From: ${encodeAddress(fromName, from)}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    escapeMimeLine(textBody),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    escapeMimeLine(htmlBody),
    '',
    `--${boundary}--`,
    '.',
  ].join('\r\n');
  await sendCommand(socket, message, 250);
  await sendCommand(socket, 'QUIT', 221).catch(() => undefined);
  socket.end();
};

export const authenticateSuperuserClient = async (pb) => {
  const superuserEmail = process.env.POCKETBASE_SUPERUSER_EMAIL || '';
  const superuserPassword = process.env.POCKETBASE_SUPERUSER_PASSWORD || '';
  if (!superuserEmail || !superuserPassword) {
    throw new Error('Missing POCKETBASE_SUPERUSER_EMAIL or POCKETBASE_SUPERUSER_PASSWORD.');
  }
  await pb.collection('_superusers').authWithPassword(superuserEmail, superuserPassword);
};

export const runReportReminders = async ({
  pb = createPocketBaseClient(),
  dryRun = false,
  testMode = false,
  targetReportId = '',
  requireEnabled = true,
  authenticate = true,
} = {}) => {
  const normalizedTargetReportId = String(targetReportId || '').trim();
  if (testMode && !normalizedTargetReportId) {
    throw new Error('REPORT_REMINDER_REPORT_ID is required when testMode is enabled.');
  }

  if (authenticate) {
    await authenticateSuperuserClient(pb);
  }

  const [{ value: projects }, { value: submissions }, { value: rawSettings }, { value: rawLog }] = await Promise.all([
    findAppState(pb, REPORT_REMINDER_KEYS.projects, []),
    findAppState(pb, REPORT_REMINDER_KEYS.submissions, []),
    findAppState(pb, REPORT_REMINDER_KEYS.settings, DEFAULT_REPORT_REMINDER_SETTINGS),
    findAppState(pb, REPORT_REMINDER_KEYS.log, []),
  ]);

  const settings = { ...DEFAULT_REPORT_REMINDER_SETTINGS, ...(rawSettings && typeof rawSettings === 'object' ? rawSettings : {}) };
  const reminderLog = Array.isArray(rawLog) ? rawLog : [];
  const projectList = Array.isArray(projects) ? projects : [];
  const reportList = Array.isArray(submissions) ? submissions : [];

  if (!settings.enabled && !testMode && requireEnabled) {
    return { sent: 0, failed: 0, skipped: 0, disabled: true };
  }

  const userRecords = await pb.collection('users').getFullList({ sort: 'name' });
  const usersById = new Map(userRecords.map((user) => [String(user.id), user]));
  const projectsById = new Map(projectList.map((project) => [String(project.id), project]));
  const sentReportIds = new Set(
    reminderLog
      .filter((entry) => entry.status === 'sent')
      .map((entry) => String(entry.reportId)),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextLog = [...reminderLog];
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const report of reportList) {
    if (!report) {
      skipped += 1;
      continue;
    }

    if (normalizedTargetReportId && String(report.id) !== normalizedTargetReportId) {
      skipped += 1;
      continue;
    }

    if (!testMode && (report.submittedDate || report.archived || sentReportIds.has(String(report.id)))) {
      skipped += 1;
      continue;
    }

    const project = projectsById.get(String(report.projectId));
    if (!project || (!testMode && project.active === false)) {
      skipped += 1;
      continue;
    }

    const deadline = normalizeDate(report.deadline);
    if (!deadline) {
      skipped += 1;
      continue;
    }

    const leadDays = getLeadDays(report, project, settings);
    const reminderStart = new Date(deadline);
    reminderStart.setDate(deadline.getDate() - leadDays);
    if (!testMode && (today < reminderStart || today > deadline)) {
      skipped += 1;
      continue;
    }

    const focal = usersById.get(String(project.focalUserId));
    const focalEmail = String(focal?.email || '').trim();
    const logBase = {
      id: crypto.randomUUID(),
      reportId: String(report.id),
      projectId: String(project.id),
      focalUserId: String(project.focalUserId || ''),
      focalEmail,
      sentAt: new Date().toISOString(),
    };

    if (!focalEmail) {
      failed += 1;
      nextLog.push({ ...logBase, status: 'failed', errorMessage: 'Focal person has no email address.' });
      continue;
    }

    const values = {
      projectName: project.name || 'Unnamed project',
      reportTitle: report.title || 'Untitled report',
      period: report.period || '',
      deadline: String(report.deadline || ''),
      focalPersonName: focal?.name || focalEmail,
      focalPersonEmail: focalEmail,
      psaLogo: buildPsaLogoHtml(),
    };

    const subject = fillTemplate(settings.subjectTemplate, values);
    const htmlBody = fillTemplate(settings.bodyTemplate, values);
    const textBody = stripHtmlToText(htmlBody) || [
      'PHILIPPINE STATISTICS AUTHORITY',
      'Aurora Provincial Statistical Office',
      '',
      `Hello ${values.focalPersonName},`,
      '',
      `Project: ${values.projectName}`,
      `Report: ${values.reportTitle}`,
      `Reporting Period: ${values.period}`,
      `Deadline: ${values.deadline}`,
    ].join('\n');

    try {
      if (dryRun) {
        console.log(`[report-reminders] DRY RUN${testMode ? ' TEST' : ''} ${encodeAddress(values.focalPersonName, focalEmail)} | ${subject}`);
      } else {
        await sendReportReminderEmail({ to: focalEmail, subject, htmlBody, textBody });
      }
      sent += 1;
      if (!dryRun) {
        nextLog.push({ ...logBase, status: testMode ? 'manual-test' : 'sent' });
      }
    } catch (error) {
      failed += 1;
      nextLog.push({ ...logBase, status: 'failed', errorMessage: error?.message || 'Unable to send reminder.' });
    }
  }

  if (nextLog.length !== reminderLog.length) {
    await upsertAppState(pb, REPORT_REMINDER_KEYS.log, nextLog);
  }

  return { sent, failed, skipped, disabled: false };
};
