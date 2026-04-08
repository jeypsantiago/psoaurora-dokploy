#!/usr/bin/env node

import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';

const RUNNER_VERSION = '1.0.0';
const RUNNER_HOST = process.env.AURORA_RUNNER_HOST || '127.0.0.1';
const RUNNER_PORT = Number(process.env.AURORA_RUNNER_PORT || 4310);
const RUNNER_TOKEN = (process.env.AURORA_RUNNER_TOKEN || '').trim();

const projectRoot = path.resolve(process.cwd());
const allowedOrigins = (process.env.AURORA_RUNNER_ALLOWED_ORIGINS
  || 'https://www.pso-aurora.com,https://pso-aurora.com,http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const allowedCommandIds = [
  'health-public',
  'start-prod',
];

const getNpmInvocation = (args) => {
  const displayCommand = `npm ${args.join(' ')}`;

  if (process.platform === 'win32') {
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', displayCommand],
      displayCommand,
    };
  }

  return {
    command: 'npm',
    args,
    displayCommand,
  };
};

const appendCorsHeaders = (req, res) => {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-aurora-runner-token');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
};

const sendJson = (req, res, statusCode, payload) => {
  appendCorsHeaders(req, res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

const validateOrigin = (req) => {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin.trim() : '';
  if (!origin) return true;
  return allowedOrigins.includes(origin);
};

const validateToken = (req) => {
  if (!RUNNER_TOKEN) return true;
  const providedToken = typeof req.headers['x-aurora-runner-token'] === 'string'
    ? req.headers['x-aurora-runner-token'].trim()
    : '';
  return providedToken === RUNNER_TOKEN;
};

const readJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const bodyText = Buffer.concat(chunks).toString('utf8').trim();
  if (!bodyText) return {};

  try {
    return JSON.parse(bodyText);
  } catch {
    throw new Error('INVALID_JSON');
  }
};

const redactSensitive = (text, values = []) => {
  if (!text) return text;
  let output = String(text);
  for (const value of values) {
    if (!value) continue;
    output = output.split(value).join('[REDACTED]');
  }
  return output;
};

const runCommandCapture = ({ command, args, env = {}, timeoutMs = 20 * 60 * 1000, redact = [] }) => {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(command, args, {
        cwd: projectRoot,
        env: {
          ...process.env,
          ...env,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });
    } catch (error) {
      resolve({
        ok: false,
        exitCode: -1,
        stdout: '',
        stderr: redactSensitive(error?.message || 'Unable to execute command.', redact),
        timedOut: false,
      });
      return;
    }

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        exitCode: -1,
        stdout: '',
        stderr: redactSensitive(error.message || 'Unable to execute command.', redact),
        timedOut,
      });
    });

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      resolve({
        ok: !timedOut && exitCode === 0,
        exitCode: typeof exitCode === 'number' ? exitCode : -1,
        stdout: redactSensitive(stdout, redact),
        stderr: redactSensitive(stderr, redact),
        timedOut,
      });
    });
  });
};

const runDetachedStartProd = () => {
  const invocation = getNpmInvocation(['run', 'start:prod']);
  let child;
  try {
    child = spawn(invocation.command, invocation.args, {
      cwd: projectRoot,
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
  } catch (error) {
    return {
      ok: false,
      exitCode: -1,
      stdout: '',
      stderr: error?.message || 'Unable to start detached production server.',
      timedOut: false,
    };
  }

  child.unref();
  return {
    ok: true,
    exitCode: 0,
    stdout: `Detached process started (pid: ${child.pid || 'n/a'}).`,
    stderr: '',
    timedOut: false,
    command: invocation.displayCommand,
  };
};

const handleCommandExecution = async (commandId, payload = {}) => {
  if (!allowedCommandIds.includes(commandId)) {
    return {
      ok: false,
      exitCode: -1,
      stdout: '',
      stderr: `Command not allowed: ${commandId}`,
      command: commandId,
    };
  }

  if (commandId === 'start-prod') {
    const result = runDetachedStartProd();
    return {
      ...result,
      command: `${result.command || 'npm run start:prod'} (detached)`,
      message: 'Production preview server started in detached mode.',
    };
  }

  const commandMap = {
    'health-public': ['run', 'health:public'],
  };

  const args = commandMap[commandId];
  const invocation = getNpmInvocation(args);
  const result = await runCommandCapture({
    command: invocation.command,
    args: invocation.args,
  });

  return {
    ...result,
    command: invocation.displayCommand,
    message: `${commandId} completed.`,
  };
};

const server = http.createServer(async (req, res) => {
  appendCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (!validateOrigin(req)) {
    sendJson(req, res, 403, { ok: false, message: 'Origin not allowed.' });
    return;
  }

  if (!validateToken(req)) {
    sendJson(req, res, 401, { ok: false, message: 'Invalid runner token.' });
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(req, res, 200, {
      ok: true,
      version: RUNNER_VERSION,
      message: 'Aurora ops runner is online.',
      commands: allowedCommandIds,
      projectRoot,
      requiresToken: !!RUNNER_TOKEN,
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/run') {
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      sendJson(req, res, 400, { ok: false, message: 'Invalid JSON payload.' });
      return;
    }

    const commandId = typeof body.commandId === 'string' ? body.commandId.trim() : '';
    const payload = body && typeof body.payload === 'object' && body.payload !== null ? body.payload : {};
    if (!commandId) {
      sendJson(req, res, 400, { ok: false, message: 'commandId is required.' });
      return;
    }

    const result = await handleCommandExecution(commandId, payload);
    sendJson(req, res, result.ok ? 200 : 500, {
      ok: result.ok,
      command: result.command,
      message: result.message,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      timedOut: result.timedOut,
    });
    return;
  }

  sendJson(req, res, 404, {
    ok: false,
    message: 'Not found.',
  });
});

server.listen(RUNNER_PORT, RUNNER_HOST, () => {
  const tokenLabel = RUNNER_TOKEN ? 'enabled' : 'disabled';
  console.log(`Aurora ops runner v${RUNNER_VERSION}`);
  console.log(`Listening at http://${RUNNER_HOST}:${RUNNER_PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`Token auth: ${tokenLabel}`);
});
