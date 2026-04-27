#!/usr/bin/env node

import { runReportReminders } from './report-reminder-core.mjs';

const dryRun = process.env.REPORT_REMINDERS_DRY_RUN === '1';
const testMode = process.env.REPORT_REMINDER_TEST_MODE === '1';
const targetReportId = String(process.env.REPORT_REMINDER_REPORT_ID || '').trim();

try {
  const result = await runReportReminders({
    dryRun,
    testMode,
    targetReportId,
    authenticate: true,
  });

  if (result.disabled) {
    console.log('[report-reminders] Reminder automation is disabled.');
    process.exit(0);
  }

  console.log(
    `[report-reminders] complete sent=${result.sent} failed=${result.failed} skipped=${result.skipped}`,
  );
} catch (error) {
  console.error(`[report-reminders] ${error?.message || 'Something went wrong.'}`);
  process.exit(1);
}
