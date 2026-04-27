#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(distDir, 'index.html');

const fail = (message) => {
  console.error(`[smoke:build] FAIL ${message}`);
  process.exit(1);
};

if (!fs.existsSync(indexPath)) {
  fail('dist/index.html was not found. Run `npm run build` first.');
}

const html = fs.readFileSync(indexPath, 'utf8');

if (html.includes('/@vite/client') || html.includes('/index.tsx')) {
  fail('dist/index.html still references Vite dev assets.');
}

const bundleMatch = html.match(/<script[^>]+type=["']module["'][^>]+src=["']([^"']*\/assets\/index-[^"']+\.js)["']/i);
if (!bundleMatch?.[1]) {
  fail('Could not find the hashed production entry bundle in dist/index.html.');
}

const bundlePath = path.join(distDir, bundleMatch[1].replace(/^\//, '').replaceAll('/', path.sep));
if (!fs.existsSync(bundlePath)) {
  fail(`Referenced entry bundle does not exist: ${bundleMatch[1]}`);
}

const assetDir = path.join(distDir, 'assets');
const assets = fs.existsSync(assetDir) ? fs.readdirSync(assetDir) : [];
const requiredLazyChunks = [
  /^ReportMonitoringPage-.+\.js$/,
  /^ReportMonitoringSettingsTab-.+\.js$/,
  /^reportMonitoring-.+\.js$/,
];

for (const matcher of requiredLazyChunks) {
  if (!assets.some((asset) => matcher.test(asset))) {
    fail(`Missing expected report monitoring production chunk: ${matcher}`);
  }
}

console.log(`[smoke:build] PASS Found production bundle ${bundleMatch[1]}`);
