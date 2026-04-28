import type {
  ReportFrequency,
  ReportProject,
  ReportReminderSettings,
  ReportSubmission,
} from "../types";

export type ReportStatus = "submitted" | "pending" | "due-soon" | "overdue";

export const REPORT_FREQUENCY_OPTIONS: ReportFrequency[] = [
  "monthly",
  "quarterly",
  "annually",
];

export const DEFAULT_REPORT_REMINDER_SETTINGS: ReportReminderSettings = {
  enabled: true,
  dailyReminderEnabled: true,
  defaultLeadDays: 5,
  overdueReminderDays: 5,
  dailyCheckTime: "08:00",
  subjectTemplate: "Report reminder: {{reportTitle}} - {{deadlineHeadline}}",
  bodyTemplate:
    `<div style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f4f6f8;padding:24px 0;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;border-collapse:collapse;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px;border-bottom:1px solid #e4e4e7;background:#ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                <tr>
                  <td width="82" style="vertical-align:middle;">{{psaLogo}}</td>
                  <td style="vertical-align:middle;padding-left:14px;">
                    <div style="font-size:16px;font-weight:700;color:#111827;line-height:1.4;">Philippine Statistics Authority</div>
                    <div style="font-size:13px;color:#52525b;line-height:1.5;">Aurora Provincial Statistical Office</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;color:#2563eb;text-transform:uppercase;margin-bottom:8px;">Report Monitoring Reminder</div>
              <h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.3;color:#111827;"><span style="color:#dc2626;">{{deadlineHeadline}}</span></h1>
              <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#3f3f46;">Hello <strong style="color:#111827;">{{focalPersonName}}</strong>,</p>
              <p style="margin:0 0 22px 0;font-size:15px;line-height:1.7;color:#3f3f46;">{{deadlineDescription}}</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px 0;border:1px solid #e4e4e7;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:14px 18px;background:#f8fafc;font-size:13px;color:#71717a;width:34%;border-bottom:1px solid #e4e4e7;">Project / Activity</td>
                  <td style="padding:14px 18px;background:#ffffff;font-size:14px;font-weight:700;color:#111827;border-bottom:1px solid #e4e4e7;">{{projectName}}</td>
                </tr>
                <tr>
                  <td style="padding:14px 18px;background:#f8fafc;font-size:13px;color:#71717a;border-bottom:1px solid #e4e4e7;">Report</td>
                  <td style="padding:14px 18px;background:#ffffff;font-size:14px;font-weight:700;color:#111827;border-bottom:1px solid #e4e4e7;">{{reportTitle}}</td>
                </tr>
                <tr>
                  <td style="padding:14px 18px;background:#f8fafc;font-size:13px;color:#71717a;border-bottom:1px solid #e4e4e7;">Reporting Period</td>
                  <td style="padding:14px 18px;background:#ffffff;font-size:14px;font-weight:700;color:#111827;border-bottom:1px solid #e4e4e7;">{{period}}</td>
                </tr>
                <tr>
                  <td style="padding:14px 18px;background:#f8fafc;font-size:13px;color:#71717a;">Deadline</td>
                  <td style="padding:14px 18px;background:#ffffff;font-size:15px;font-weight:700;color:#dc2626;">{{deadline}}</td>
                </tr>
              </table>
              <div style="padding:16px 18px;margin:0 0 24px 0;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">
                <div style="font-size:14px;font-weight:700;color:#9a3412;margin-bottom:4px;">Submission Countdown</div>
                <div style="font-size:14px;line-height:1.6;color:#7c2d12;">{{countdownSentence}}</div>
              </div>
              <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#3f3f46;">If the report has already been submitted, kindly disregard this reminder.</p>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#3f3f46;">Thank you.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e4e4e7;">
              <div style="font-size:12px;line-height:1.6;color:#71717a;">This is an automated message from the PSO-Aurora Report Monitoring System.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`,
};

const OLD_DEADLINE_DESCRIPTION =
  "This is an official reminder that the report below is approaching its submission deadline. Please ensure that it is completed, reviewed, and submitted on or before the due date.";

const upgradeReportReminderTemplate = (template: string): string =>
  String(template || "")
    .replace(
      /Report Submission Due\s+in\s*(<span\b[^>]*>)?\s*\{\{daysRemaining\}\}\s+day\(s\)\s*(<\/span>)?/gi,
      (_match, open = "", close = "") => `${open}{{deadlineHeadline}}${close}`,
    )
    .replace(
      /This report is due\s+in\s*(<strong\b[^>]*>)?\s*\{\{daysRemaining\}\}\s+day\(s\)\s*(<\/strong>)?\.\s*Timely submission helps maintain accurate monitoring and compliance records\./gi,
      "{{countdownSentence}}",
    )
    .replace(
      /This report is due\s+in\s*(<strong\b[^>]*>)?\s*\{\{daysRemaining\}\}\s+day\(s\)\s*(<\/strong>)?\s*\./gi,
      "{{countdownSentence}}",
    )
    .replace(new RegExp(OLD_DEADLINE_DESCRIPTION.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "{{deadlineDescription}}")
    .replace(/Report Submission Due\s+in\s+\{\{daysRemaining\}\}\s+day\(s\)/gi, "{{deadlineHeadline}}")
    .replace(/in\s+\{\{daysRemaining\}\}\s+day\(s\)/gi, "{{daysRemaining}}")
    .replace(/\{\{daysRemaining\}\}\s+day\(s\)/gi, "{{daysRemaining}}");

const normalizeReminderNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.round(parsed));
};

export const normalizeReportReminderSettings = (
  value: Partial<ReportReminderSettings> | null | undefined,
): ReportReminderSettings => {
  const settings = value && typeof value === "object" ? value : {};
  return {
    ...DEFAULT_REPORT_REMINDER_SETTINGS,
    ...settings,
    enabled:
      typeof settings.enabled === "boolean"
        ? settings.enabled
        : DEFAULT_REPORT_REMINDER_SETTINGS.enabled,
    dailyReminderEnabled:
      typeof settings.dailyReminderEnabled === "boolean"
        ? settings.dailyReminderEnabled
        : DEFAULT_REPORT_REMINDER_SETTINGS.dailyReminderEnabled,
    defaultLeadDays: normalizeReminderNumber(
      settings.defaultLeadDays,
      DEFAULT_REPORT_REMINDER_SETTINGS.defaultLeadDays,
    ),
    overdueReminderDays: normalizeReminderNumber(
      settings.overdueReminderDays,
      DEFAULT_REPORT_REMINDER_SETTINGS.overdueReminderDays,
    ),
    subjectTemplate: upgradeReportReminderTemplate(
      settings.subjectTemplate || DEFAULT_REPORT_REMINDER_SETTINGS.subjectTemplate,
    ),
    bodyTemplate: upgradeReportReminderTemplate(
      settings.bodyTemplate || DEFAULT_REPORT_REMINDER_SETTINGS.bodyTemplate,
    ),
  };
};

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const normalizeLeadDays = (value: unknown, fallback = 5): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.round(parsed));
};

export const formatReportFrequency = (frequency: ReportFrequency): string => {
  if (frequency === "monthly") return "Monthly";
  if (frequency === "quarterly") return "Quarterly";
  return "Annually";
};

export const isReportHistoryRecord = (
  report: Pick<ReportSubmission, "submittedDate" | "archived">,
): boolean => Boolean(report.submittedDate || report.archived);

const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

const parseDateOnly = (value?: string): Date | null => {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const daysInMonth = (year: number, monthIndex: number): number =>
  new Date(year, monthIndex + 1, 0).getDate();

export const addReportFrequencyToDate = (
  value: string,
  frequency: ReportFrequency,
): string => {
  const source = parseDateOnly(value) || startOfToday();
  const monthsToAdd = frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12;
  const targetMonthIndex = source.getMonth() + monthsToAdd;
  const targetYear = source.getFullYear() + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const targetDay = Math.min(source.getDate(), daysInMonth(targetYear, normalizedMonth));
  return toDateOnly(new Date(targetYear, normalizedMonth, targetDay));
};

export const getGeneratedPeriodLabel = (
  deadline: string,
  frequency: ReportFrequency,
): string => {
  const date = parseDateOnly(deadline) || startOfToday();
  const year = date.getFullYear();
  if (frequency === "monthly") {
    return date.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
  }
  if (frequency === "quarterly") {
    return `Q${Math.floor(date.getMonth() / 3) + 1} ${year}`;
  }
  return String(year);
};

export const normalizeReportSeries = (
  reports: ReportSubmission[],
): { reports: ReportSubmission[]; changed: boolean } => {
  let changed = false;
  const normalized = reports.map((report, index) => {
    const next: ReportSubmission = {
      ...report,
      seriesId: report.seriesId || report.id || crypto.randomUUID(),
      sequence: Number.isFinite(Number(report.sequence))
        ? Number(report.sequence)
        : index + 1,
      archived: Boolean(report.archived || report.submittedDate),
    };
    if (
      next.seriesId !== report.seriesId ||
      next.sequence !== report.sequence ||
      next.archived !== report.archived
    ) {
      changed = true;
    }
    return next;
  });
  return { reports: normalized, changed };
};

export const createNextReportInstance = (
  report: ReportSubmission,
  existingReports: ReportSubmission[],
): ReportSubmission | null => {
  const seriesId = report.seriesId || report.id;
  const hasCurrentNext = existingReports.some(
    (entry) =>
      entry.id !== report.id &&
      (entry.seriesId || entry.id) === seriesId &&
      !isReportHistoryRecord(entry),
  );
  if (hasCurrentNext) return null;

  const nextDeadline = addReportFrequencyToDate(report.deadline, report.frequency);
  const now = new Date().toISOString();
  return {
    ...report,
    id: crypto.randomUUID(),
    seriesId,
    period: getGeneratedPeriodLabel(nextDeadline, report.frequency),
    deadline: nextDeadline,
    submittedDate: undefined,
    periodStart: report.periodStart
      ? addReportFrequencyToDate(report.periodStart, report.frequency)
      : undefined,
    periodEnd: report.periodEnd
      ? addReportFrequencyToDate(report.periodEnd, report.frequency)
      : undefined,
    sequence: (Number(report.sequence) || 1) + 1,
    archived: false,
    generatedFromReportId: report.id,
    createdAt: now,
    updatedAt: now,
  };
};

export const getReportLeadDays = (
  report: Pick<ReportSubmission, "reminderLeadDays">,
  project: Pick<ReportProject, "reminderLeadDays"> | undefined,
  settings: Pick<ReportReminderSettings, "defaultLeadDays">,
): number => {
  if (report.reminderLeadDays !== null && report.reminderLeadDays !== undefined) {
    return normalizeLeadDays(report.reminderLeadDays, settings.defaultLeadDays);
  }
  if (project?.reminderLeadDays !== null && project?.reminderLeadDays !== undefined) {
    return normalizeLeadDays(project.reminderLeadDays, settings.defaultLeadDays);
  }
  return normalizeLeadDays(settings.defaultLeadDays, 5);
};

export const getReportStatus = (
  report: Pick<ReportSubmission, "deadline" | "submittedDate" | "reminderLeadDays">,
  project: Pick<ReportProject, "reminderLeadDays"> | undefined,
  settings: Pick<ReportReminderSettings, "defaultLeadDays">,
): ReportStatus => {
  if (report.submittedDate) return "submitted";

  const deadline = new Date(`${report.deadline}T00:00:00`);
  if (Number.isNaN(deadline.getTime())) return "pending";

  const today = startOfToday();
  if (deadline < today) return "overdue";

  const leadDays = getReportLeadDays(report, project, settings);
  const dueSoonStart = new Date(deadline);
  dueSoonStart.setDate(deadline.getDate() - leadDays);
  return today >= dueSoonStart ? "due-soon" : "pending";
};

export const formatReportDate = (value?: string): string => {
  if (!value) return "Not submitted";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
