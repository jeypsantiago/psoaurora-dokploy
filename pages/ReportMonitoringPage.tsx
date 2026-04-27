import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Edit3,
  FilePlus2,
  FolderKanban,
  MailCheck,
  MailWarning,
  Plus,
  Search,
  Send,
  Settings2,
  Trash2,
} from "lucide-react";
import { Badge, Button, Card, Input, Modal } from "../components/ui";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { useDialog } from "../DialogContext";
import { useRbac } from "../RbacContext";
import { getAuthToken } from "../services/pocketbase";
import {
  DEFAULT_REPORT_REMINDER_SETTINGS,
  createNextReportInstance,
  formatReportDate,
  formatReportFrequency,
  getGeneratedPeriodLabel,
  getReportLeadDays,
  getReportStatus,
  isReportHistoryRecord,
  normalizeReportSeries,
  REPORT_FREQUENCY_OPTIONS,
  type ReportStatus,
} from "../services/reportMonitoring";
import { readStorageJsonSafe, writeStorageJson } from "../services/storage";
import { useToast } from "../ToastContext";
import type {
  ReportFrequency,
  ReportProject,
  ReportReminderLog,
  ReportReminderSettings,
  ReportSubmission,
} from "../types";
import { useUsers, type User } from "../UserContext";

type ViewTab = "projects" | "all" | "due-soon";
type RecordScope = "current" | "history" | "all";

interface ReportRow {
  report: ReportSubmission;
  project?: ReportProject;
  focal?: User;
  status: ReportStatus;
  leadDays: number;
  lastReminder?: ReportReminderLog;
  isHistory: boolean;
  hasCurrentNext: boolean;
}

interface ProjectFormState {
  id?: string;
  name: string;
  focalUserId: string;
  defaultFrequency: ReportFrequency;
  active: boolean;
  reminderLeadDays: string;
  notes: string;
}

interface ReportFormState {
  id?: string;
  projectId: string;
  title: string;
  period: string;
  frequency: ReportFrequency;
  deadline: string;
  submittedDate: string;
  reminderLeadDays: string;
  remarks: string;
}

const emptyProjectForm = (users: User[]): ProjectFormState => ({
  name: "",
  focalUserId: users[0]?.id || "",
  defaultFrequency: "monthly",
  active: true,
  reminderLeadDays: "",
  notes: "",
});

const emptyReportForm = (projects: ReportProject[]): ReportFormState => ({
  projectId: projects[0]?.id || "",
  title: "",
  period: "",
  frequency: projects[0]?.defaultFrequency || "monthly",
  deadline: new Date().toISOString().slice(0, 10),
  submittedDate: "",
  reminderLeadDays: "",
  remarks: "",
});

const statusLabel: Record<ReportStatus, string> = {
  submitted: "Submitted",
  pending: "Pending",
  "due-soon": "Due Soon",
  overdue: "Overdue",
};

const statusBadge: Record<ReportStatus, "default" | "success" | "warning" | "info"> = {
  submitted: "success",
  pending: "default",
  "due-soon": "warning",
  overdue: "warning",
};

const byUpdatedDesc = <T extends { updatedAt: string; createdAt: string }>(a: T, b: T) =>
  (Date.parse(b.updatedAt || b.createdAt) || 0) -
  (Date.parse(a.updatedAt || a.createdAt) || 0);

export const ReportMonitoringPage: React.FC = () => {
  const { users, currentUser } = useUsers();
  const { can } = useRbac();
  const { toast } = useToast();
  const { confirm } = useDialog();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [projects, setProjects] = useState<ReportProject[]>(() =>
    readStorageJsonSafe<ReportProject[]>(STORAGE_KEYS.reportProjects, []),
  );
  const [reports, setReports] = useState<ReportSubmission[]>(() =>
    normalizeReportSeries(
      readStorageJsonSafe<ReportSubmission[]>(STORAGE_KEYS.reportSubmissions, []),
    ).reports,
  );
  const [settings] = useState<ReportReminderSettings>(() =>
    readStorageJsonSafe<ReportReminderSettings>(
      STORAGE_KEYS.reportSettings,
      DEFAULT_REPORT_REMINDER_SETTINGS,
    ),
  );
  const [reminderLog, setReminderLog] = useState<ReportReminderLog[]>(() =>
    readStorageJsonSafe<ReportReminderLog[]>(STORAGE_KEYS.reportReminderLog, []),
  );

  const [activeTab, setActiveTab] = useState<ViewTab>("projects");
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ReportStatus>("all");
  const [recordScope, setRecordScope] = useState<RecordScope>("current");
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [manualSendingReportId, setManualSendingReportId] = useState<string | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [submittedDateReport, setSubmittedDateReport] =
    useState<ReportSubmission | null>(null);
  const [submittedDateValue, setSubmittedDateValue] = useState("");
  const [projectForm, setProjectForm] = useState<ProjectFormState>(() =>
    emptyProjectForm(users),
  );
  const [reportForm, setReportForm] = useState<ReportFormState>(() =>
    emptyReportForm(projects),
  );

  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );
  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );
  const isSuperAdmin = Boolean(
    currentUser?.isSuperAdmin || currentUser?.roles?.includes("Super Admin"),
  );

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "projects" || tabParam === "all" || tabParam === "due-soon") {
      setActiveTab(tabParam);
    }
    if (tabParam === "reports") {
      setActiveTab("all");
    }
    if (searchParams.get("action") === "new-report" && can("reports.edit")) {
      openNewReport();
    }
    if (searchParams.get("action") === "settings") {
      navigate("/settings?tab=reports");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.reportProjects, projects);
  }, [projects]);

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.reportSubmissions, reports);
  }, [reports]);

  const allReportRows = useMemo<ReportRow[]>(() =>
    reports.map((report) => {
      const project = projectsById.get(report.projectId);
      const focal = project ? usersById.get(project.focalUserId) : undefined;
      const status = getReportStatus(report, project, settings);
      const leadDays = getReportLeadDays(report, project, settings);
      const seriesId = report.seriesId || report.id;
      const isHistory = isReportHistoryRecord(report);
      const hasCurrentNext = reports.some(
        (entry) =>
          entry.id !== report.id &&
          (entry.seriesId || entry.id) === seriesId &&
          !isReportHistoryRecord(entry),
      );
      const lastReminder = reminderLog
        .filter((entry) => entry.reportId === report.id)
        .sort((a, b) => Date.parse(b.sentAt) - Date.parse(a.sentAt))[0];
      return { report, project, focal, status, leadDays, lastReminder, isHistory, hasCurrentNext };
    }),
  [projectsById, reminderLog, reports, settings, usersById]);

  const reportRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    return allReportRows
      .filter((row) => {
        if (activeTab === "due-soon" && row.status !== "due-soon" && row.status !== "overdue") {
          return false;
        }
        if (activeTab === "due-soon" && row.isHistory) return false;
        if (activeTab === "all") {
          if (recordScope === "current" && row.isHistory) return false;
          if (recordScope === "history" && !row.isHistory) return false;
        }
        if (projectFilter !== "all" && row.report.projectId !== projectFilter) return false;
        if (statusFilter !== "all" && row.status !== statusFilter) return false;
        if (!search) return true;
        return [
          row.report.title,
          row.report.period,
          row.project?.name,
          row.focal?.name,
          row.focal?.email,
          row.report.remarks,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search);
      })
      .sort((a, b) => {
        const dateDiff =
          (Date.parse(`${a.report.deadline}T00:00:00`) || 0) -
          (Date.parse(`${b.report.deadline}T00:00:00`) || 0);
        return activeTab === "due-soon" ? dateDiff : byUpdatedDesc(a.report, b.report);
      });
  }, [activeTab, allReportRows, projectFilter, query, recordScope, statusFilter]);

  const projectGroups = useMemo(() => {
    const search = query.trim().toLowerCase();
    const rowsByProject = new Map<string, ReportRow[]>();
    for (const row of allReportRows) {
      if (activeTab === "due-soon" && row.status !== "due-soon" && row.status !== "overdue") {
        continue;
      }
      if (activeTab === "due-soon" && row.isHistory) continue;
      if (projectFilter !== "all" && row.report.projectId !== projectFilter) continue;
      if (statusFilter !== "all" && row.status !== statusFilter) continue;
      if (search) {
        const rowText = [
          row.report.title,
          row.report.period,
          row.project?.name,
          row.focal?.name,
          row.focal?.email,
          row.report.remarks,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!rowText.includes(search)) continue;
      }
      const nextRows = rowsByProject.get(row.report.projectId) || [];
      nextRows.push(row);
      rowsByProject.set(row.report.projectId, nextRows);
    }

    return projects
      .filter((project) => projectFilter === "all" || project.id === projectFilter)
      .map((project) => {
        const focal = usersById.get(project.focalUserId);
        const rows = [...(rowsByProject.get(project.id) || [])].sort((a, b) => {
          const dateDiff =
            (Date.parse(`${a.report.deadline}T00:00:00`) || 0) -
            (Date.parse(`${b.report.deadline}T00:00:00`) || 0);
          return dateDiff || a.report.title.localeCompare(b.report.title);
        });
        const projectText = [project.name, focal?.name, focal?.email, project.notes]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const searchMatchesProject = !search || projectText.includes(search);
        if (!searchMatchesProject && rows.length === 0) return null;
        if ((activeTab === "due-soon" || statusFilter !== "all") && rows.length === 0) {
          return null;
        }
        const currentRows = rows.filter((row) => !row.isHistory);
        const historyRows = rows
          .filter((row) => row.isHistory)
          .sort(
            (a, b) =>
              (Date.parse(`${b.report.deadline}T00:00:00`) || 0) -
              (Date.parse(`${a.report.deadline}T00:00:00`) || 0),
          );
        const dueSoon = currentRows.filter((row) => row.status === "due-soon").length;
        const overdue = currentRows.filter((row) => row.status === "overdue").length;
        const submitted = historyRows.length;
        const nextDeadlineRow = currentRows
          .sort(
            (a, b) =>
              (Date.parse(`${a.report.deadline}T00:00:00`) || 0) -
              (Date.parse(`${b.report.deadline}T00:00:00`) || 0),
          )[0];
        const hasRecentFailure = rows.some((row) => row.lastReminder?.status === "failed");
        return {
          project,
          focal,
          rows,
          currentRows,
          historyRows,
          counts: {
            total: currentRows.length,
            dueSoon,
            overdue,
            submitted,
          },
          nextDeadline: nextDeadlineRow?.report.deadline,
          hasAttention:
            !focal ||
            !String(focal.email || "").trim() ||
            hasRecentFailure,
          hasRecentFailure,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (!a || !b) return 0;
        if (a.project.active !== b.project.active) return a.project.active ? -1 : 1;
        if (a.counts.overdue !== b.counts.overdue) return b.counts.overdue - a.counts.overdue;
        if (a.counts.dueSoon !== b.counts.dueSoon) return b.counts.dueSoon - a.counts.dueSoon;
        const aDate = Date.parse(`${a.nextDeadline || "9999-12-31"}T00:00:00`) || Number.MAX_SAFE_INTEGER;
        const bDate = Date.parse(`${b.nextDeadline || "9999-12-31"}T00:00:00`) || Number.MAX_SAFE_INTEGER;
        return aDate - bDate || a.project.name.localeCompare(b.project.name);
      });
  }, [activeTab, allReportRows, projectFilter, projects, query, statusFilter, usersById]);

  const stats = useMemo(() => {
    const currentReports = reports.filter((report) => !isReportHistoryRecord(report));
    const rows = currentReports.map((report) => {
      const project = projectsById.get(report.projectId);
      return getReportStatus(report, project, settings);
    });
    const now = new Date();
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter((project) => project.active).length,
      dueSoon: rows.filter((status) => status === "due-soon").length,
      overdue: rows.filter((status) => status === "overdue").length,
      submittedThisMonth: reports.filter((report) => {
        if (!report.submittedDate) return false;
        const submitted = new Date(`${report.submittedDate}T00:00:00`);
        return (
          submitted.getFullYear() === now.getFullYear() &&
          submitted.getMonth() === now.getMonth()
        );
      }).length,
    };
  }, [projects, projectsById, reports, settings]);

  function openNewProject() {
    setProjectForm(emptyProjectForm(users));
    setIsProjectModalOpen(true);
  }

  const openEditProject = (project: ReportProject) => {
    setProjectForm({
      id: project.id,
      name: project.name,
      focalUserId: project.focalUserId,
      defaultFrequency: project.defaultFrequency,
      active: project.active,
      reminderLeadDays:
        project.reminderLeadDays === null || project.reminderLeadDays === undefined
          ? ""
          : String(project.reminderLeadDays),
      notes: project.notes || "",
    });
    setIsProjectModalOpen(true);
  };

  function openNewReport() {
    setReportForm(emptyReportForm(projects));
    setIsReportModalOpen(true);
  }

  const openNewReportForProject = (project: ReportProject) => {
    setReportForm({
      ...emptyReportForm(projects),
      projectId: project.id,
      frequency: project.defaultFrequency,
    });
    setExpandedProjectId(project.id);
    setIsReportModalOpen(true);
  };

  const openEditReport = (report: ReportSubmission) => {
    setReportForm({
      id: report.id,
      projectId: report.projectId,
      title: report.title,
      period: report.period,
      frequency: report.frequency,
      deadline: report.deadline,
      submittedDate: report.submittedDate || "",
      reminderLeadDays:
        report.reminderLeadDays === null || report.reminderLeadDays === undefined
          ? ""
          : String(report.reminderLeadDays),
      remarks: report.remarks || "",
    });
    setIsReportModalOpen(true);
  };

  const openSubmittedDateEditor = (report: ReportSubmission) => {
    if (!can("reports.edit")) return;
    setSubmittedDateReport(report);
    setSubmittedDateValue(report.submittedDate || new Date().toISOString().slice(0, 10));
  };

  const saveProject = () => {
    if (!can("reports.edit")) return;
    const name = projectForm.name.trim();
    if (!name || !projectForm.focalUserId) {
      toast("error", "Project name and focal person are required.");
      return;
    }
    const now = new Date().toISOString();
    const nextProject: ReportProject = {
      id: projectForm.id || crypto.randomUUID(),
      name,
      focalUserId: projectForm.focalUserId,
      defaultFrequency: projectForm.defaultFrequency,
      active: projectForm.active,
      reminderLeadDays:
        projectForm.reminderLeadDays.trim() === ""
          ? null
          : Math.max(0, Number(projectForm.reminderLeadDays) || 0),
      notes: projectForm.notes.trim(),
      createdAt:
        projects.find((project) => project.id === projectForm.id)?.createdAt || now,
      updatedAt: now,
    };
    setProjects((prev) =>
      prev.some((project) => project.id === nextProject.id)
        ? prev.map((project) => (project.id === nextProject.id ? nextProject : project))
        : [nextProject, ...prev],
    );
    setIsProjectModalOpen(false);
    toast("success", "Report project saved.");
  };

  const saveReport = () => {
    if (!can("reports.edit")) return;
    const title = reportForm.title.trim();
    if (!title || !reportForm.projectId || !reportForm.deadline) {
      toast("error", "Report title, project, and deadline are required.");
      return;
    }
    const now = new Date().toISOString();
    const existingReport = reports.find((report) => report.id === reportForm.id);
    const nextReport: ReportSubmission = {
      id: reportForm.id || crypto.randomUUID(),
      projectId: reportForm.projectId,
      title,
      period:
        reportForm.period.trim() ||
        getGeneratedPeriodLabel(reportForm.deadline, reportForm.frequency),
      frequency: reportForm.frequency,
      deadline: reportForm.deadline,
      submittedDate: reportForm.submittedDate || undefined,
      reminderLeadDays:
        reportForm.reminderLeadDays.trim() === ""
          ? null
          : Math.max(0, Number(reportForm.reminderLeadDays) || 0),
      remarks: reportForm.remarks.trim(),
      seriesId: existingReport?.seriesId || reportForm.id || crypto.randomUUID(),
      periodStart: existingReport?.periodStart,
      periodEnd: existingReport?.periodEnd,
      sequence: existingReport?.sequence || 1,
      archived: Boolean(reportForm.submittedDate || existingReport?.archived),
      generatedFromReportId: existingReport?.generatedFromReportId,
      createdAt: existingReport?.createdAt || now,
      updatedAt: now,
    };
    setReports((prev) => {
      const savedReports = prev.some((report) => report.id === nextReport.id)
        ? prev.map((report) => (report.id === nextReport.id ? nextReport : report))
        : [nextReport, ...prev];
      const generated = nextReport.submittedDate
        ? createNextReportInstance(nextReport, savedReports)
        : null;
      return generated ? [generated, ...savedReports] : savedReports;
    });
    setIsReportModalOpen(false);
    toast(
      "success",
      nextReport.submittedDate
        ? "Report saved and next period checked."
        : "Report schedule saved.",
    );
  };

  const deleteProject = async (project: ReportProject) => {
    if (!can("reports.delete")) return;
    const ok = await confirm(
      `Delete "${project.name}" and all report schedules under it? This cannot be undone.`,
      { title: "Delete Report Project", confirmLabel: "Delete" },
    );
    if (!ok) return;
    setProjects((prev) => prev.filter((entry) => entry.id !== project.id));
    setReports((prev) => prev.filter((entry) => entry.projectId !== project.id));
    toast("success", "Report project deleted.");
  };

  const deleteReport = async (report: ReportSubmission) => {
    if (!can("reports.delete")) return;
    const ok = await confirm(
      `Delete "${report.title}"? This cannot be undone.`,
      { title: "Delete Report Schedule", confirmLabel: "Delete" },
    );
    if (!ok) return;
    setReports((prev) => prev.filter((entry) => entry.id !== report.id));
    toast("success", "Report schedule deleted.");
  };

  const refreshReminderLog = () => {
    setReminderLog(
      readStorageJsonSafe<ReportReminderLog[]>(STORAGE_KEYS.reportReminderLog, []),
    );
  };

  const sendManualTestReminder = async (row: ReportRow) => {
    if (!isSuperAdmin) return;
    if (!row.project) {
      toast("error", "Cannot send a test reminder because the project is missing.");
      return;
    }
    if (!row.focal?.email) {
      toast("error", "Cannot send a test reminder because the focal person has no email.");
      return;
    }
    const ok = await confirm(
      `Send a test reminder for "${row.report.title}" to ${row.focal.email}?`,
      { title: "Send Test Reminder", confirmLabel: "Send Test" },
    );
    if (!ok) return;

    setManualSendingReportId(row.report.id);
    try {
      const token = await getAuthToken();
      const response = await fetch("/api/report-reminders/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reportId: row.report.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok === false) {
        const message =
          result.message ||
          result.error ||
          "The test reminder request did not complete successfully.";
        throw new Error(String(message).slice(0, 240));
      }
      refreshReminderLog();
      toast("success", "Test reminder sent.");
    } catch (error) {
      toast(
        "error",
        error instanceof TypeError
          ? "Cannot reach the report reminder API. Confirm the deployed app is running the production Node server."
          : error instanceof Error
            ? error.message
            : "Unable to send the test reminder.",
      );
    } finally {
      setManualSendingReportId(null);
    }
  };

  const generateNextReport = (report: ReportSubmission) => {
    if (!can("reports.edit")) return;
    const generated = createNextReportInstance(report, reports);
    if (!generated) {
      toast("info", "A current next period already exists for this report.");
      return;
    }
    setReports((prev) => [generated, ...prev]);
    toast("success", `Generated next period: ${generated.period || generated.deadline}.`);
  };

  const updateSubmittedDate = async (nextDate?: string) => {
    if (!submittedDateReport || !can("reports.edit")) return;
    const normalizedDate = nextDate || undefined;
    const now = new Date().toISOString();
    const targetSeriesId = submittedDateReport.seriesId || submittedDateReport.id;
    if (!normalizedDate && isReportHistoryRecord(submittedDateReport)) {
      const ok = await confirm(
        `Reactivate "${submittedDateReport.title}" for ${submittedDateReport.period || "this period"}? This clears the submitted date and removes any unsubmitted generated next period for the same recurring report.`,
        { title: "Reactivate Report Period", confirmLabel: "Reactivate" },
      );
      if (!ok) return;
    }
    setReports((prev) => {
      const updatedReport: ReportSubmission = {
        ...submittedDateReport,
        submittedDate: normalizedDate,
        archived: Boolean(normalizedDate),
        updatedAt: now,
      };
      let nextReports = prev.map((report) =>
        report.id === submittedDateReport.id ? updatedReport : report,
      );
      if (!normalizedDate) {
        nextReports = nextReports.filter(
          (report) =>
            !(
              report.id !== submittedDateReport.id &&
              (report.seriesId || report.id) === targetSeriesId &&
              !isReportHistoryRecord(report) &&
              report.generatedFromReportId === submittedDateReport.id
            ),
        );
        return nextReports;
      }
      const generated = createNextReportInstance(updatedReport, nextReports);
      return generated ? [generated, ...nextReports] : nextReports;
    });
    setSubmittedDateReport(null);
    setSubmittedDateValue("");
    toast(
      "success",
      normalizedDate ? "Submitted date updated." : "Submitted date cleared.",
    );
  };

  const exportCsv = () => {
    const rows = reportRows.map((row) => ({
      Project: row.project?.name || "Missing project",
      Report: row.report.title,
      Period: row.report.period,
      Frequency: formatReportFrequency(row.report.frequency),
      FocalPerson: row.focal?.name || "Needs attention",
      FocalEmail: row.focal?.email || "",
      Deadline: row.report.deadline,
      SubmittedDate: row.report.submittedDate || "",
      Status: statusLabel[row.status],
      ReminderLeadDays: row.leadDays,
      RecordType: row.isHistory ? "History" : "Current",
    }));
    const csv = [
      Object.keys(rows[0] || { Project: "" }).join(","),
      ...rows.map((row) =>
        Object.values(row)
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `report-monitoring-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderSubmittedCell = (report: ReportSubmission) =>
    can("reports.edit") ? (
      <button
        type="button"
        onClick={() => openSubmittedDateEditor(report)}
        className="inline-flex min-w-[132px] flex-col items-start rounded-xl border border-transparent px-2.5 py-2 text-left text-sm text-zinc-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:text-zinc-300 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
        title="Edit submitted date"
      >
        <span className="font-bold">{formatReportDate(report.submittedDate)}</span>
        <span className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Edit Date
        </span>
      </button>
    ) : (
      <span className="text-sm text-zinc-600 dark:text-zinc-300">
        {formatReportDate(report.submittedDate)}
      </span>
    );

  const renderReportRows = (rows: ReportRow[], options: { showProject: boolean }) => (
    <div className="overflow-x-auto -mx-5 sm:mx-0">
      <table className="w-full min-w-[1080px] text-left">
        <thead>
          <tr className="border-b border-zinc-100 dark:border-zinc-800">
            {[
              ...(options.showProject ? ["Project"] : []),
              "Report",
              "Frequency",
              "Deadline",
              "Submitted",
              "Focal Person",
              "Reminder",
              "Status",
              "",
            ].map((heading) => (
              <th
                key={heading}
                className="pb-4 px-5 sm:px-0 text-[11px] font-bold text-zinc-400 uppercase tracking-wider"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((row) => (
            <tr key={row.report.id} className="group">
              {options.showProject && (
                <td className="py-4 px-5 sm:px-0">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">
                    {row.project?.name || "Missing project"}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {row.project?.active === false ? "Inactive" : "Active"}
                  </p>
                </td>
              )}
              <td className="py-4 px-5 sm:px-0">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  {row.report.title}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge variant={row.isHistory ? "default" : "info"}>
                    {row.isHistory ? "History" : "Recurring"}
                  </Badge>
                  {row.report.generatedFromReportId && !row.isHistory && (
                    <Badge variant="success">Next generated</Badge>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500">{row.report.period || "No period"}</p>
                {row.report.remarks && (
                  <p className="text-[11px] text-zinc-500 max-w-[260px] truncate">
                    {row.report.remarks}
                  </p>
                )}
              </td>
              <td className="py-4 px-5 sm:px-0">
                <Badge variant="info">{formatReportFrequency(row.report.frequency)}</Badge>
              </td>
              <td className="py-4 px-5 sm:px-0 text-sm font-bold text-zinc-900 dark:text-white">
                {formatReportDate(row.report.deadline)}
              </td>
              <td className="py-4 px-5 sm:px-0">{renderSubmittedCell(row.report)}</td>
              <td className="py-4 px-5 sm:px-0">
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  {row.focal?.name || "Needs attention"}
                </p>
                <p className="text-[11px] text-zinc-500">{row.focal?.email || "No email available"}</p>
              </td>
              <td className="py-4 px-5 sm:px-0">
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  {row.leadDays} days before
                </p>
                <p className="text-[11px] text-zinc-500">
                  {row.lastReminder
                    ? `${row.lastReminder.status}: ${formatReportDate(row.lastReminder.sentAt.slice(0, 10))}`
                    : "Not sent"}
                </p>
              </td>
              <td className="py-4 px-5 sm:px-0">
                <Badge variant={statusBadge[row.status]}>{statusLabel[row.status]}</Badge>
              </td>
              <td className="py-4 px-5 sm:px-0">
                <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {isSuperAdmin && (
                    <button
                      onClick={() => sendManualTestReminder(row)}
                      disabled={manualSendingReportId === row.report.id}
                      className="p-2 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-zinc-50 disabled:opacity-50 dark:hover:bg-zinc-900"
                      title="Send test reminder"
                    >
                      {manualSendingReportId === row.report.id ? (
                        <MailCheck size={15} />
                      ) : (
                        <Send size={15} />
                      )}
                    </button>
                  )}
                  {can("reports.edit") && row.isHistory && !row.hasCurrentNext && (
                    <button
                      onClick={() => generateNextReport(row.report)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      title="Generate next period"
                    >
                      <FilePlus2 size={15} />
                    </button>
                  )}
                  {can("reports.edit") && (
                    <button
                      onClick={() => openEditReport(row.report)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      title="Edit report"
                    >
                      <Edit3 size={15} />
                    </button>
                  )}
                  {can("reports.delete") && (
                    <button
                      onClick={() => deleteReport(row.report)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      title="Delete report"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="py-12 text-center">
          <MailWarning size={30} className="mx-auto text-zinc-400 mb-3" />
          <p className="text-sm font-bold text-zinc-900 dark:text-white">
            No reports match the current view.
          </p>
          <p className="text-xs text-zinc-500 mt-1">Adjust filters or add a report schedule.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Report Monitoring
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Track project report schedules, focal persons, submissions, deadlines, and reminder readiness.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/settings?tab=reports")}>
            <Settings2 size={14} className="mr-2" /> Settings
          </Button>
          {can("reports.export") && (
            <Button variant="outline" onClick={exportCsv}>
              <Download size={14} className="mr-2" /> Export
            </Button>
          )}
          {can("reports.edit") && (
            <Button variant="blue" onClick={openNewReport} disabled={projects.length === 0}>
              <FilePlus2 size={14} className="mr-2" /> New Report
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Projects", value: stats.totalProjects, hint: `${stats.activeProjects} active`, icon: FolderKanban },
          { label: "Due Soon", value: stats.dueSoon, hint: `${settings.defaultLeadDays}-day default reminder`, icon: CalendarClock },
          { label: "Overdue", value: stats.overdue, hint: "Past deadline", icon: AlertTriangle },
          { label: "Submitted", value: stats.submittedThisMonth, hint: "This month", icon: CheckCircle2 },
        ].map((card) => (
          <div key={card.label} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {card.label}
              </p>
              <div className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                <card.icon size={16} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-zinc-900 dark:text-white">
              {card.value.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl w-fit overflow-x-auto">
          {[
            { id: "projects", label: "Projects", icon: FolderKanban },
            { id: "all", label: "All Reports", icon: ClipboardCheck },
            { id: "due-soon", label: "Due Soon", icon: Bell },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ViewTab)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-white shadow-sm" : "text-zinc-500"}`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {activeTab === "all" && (
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl w-fit">
              {[
                { id: "current", label: "Current" },
                { id: "history", label: "History" },
                { id: "all", label: "All" },
              ].map((scope) => (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => setRecordScope(scope.id as RecordScope)}
                  className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${recordScope === scope.id ? "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-white shadow-sm" : "text-zinc-500"}`}
                >
                  {scope.label}
                </button>
              ))}
            </div>
          )}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reports..."
              className="w-full sm:w-64 pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            className="px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm outline-none"
          >
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | ReportStatus)}
            className="px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm outline-none"
          >
            <option value="all">All Status</option>
            {Object.entries(statusLabel).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {activeTab === "projects" || activeTab === "due-soon" ? (
        <Card
          title={activeTab === "due-soon" ? "Due Soon by Project" : "Project Board"}
          description="Open a project tile to manage its reports without losing focal person, deadline, and reminder context"
          action={can("reports.edit") && <Button variant="blue" onClick={openNewProject}><Plus size={14} className="mr-2" /> New Activity/Project</Button>}
        >
          {projectGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center">
              <FolderKanban size={30} className="mx-auto text-zinc-400 mb-3" />
              <p className="text-sm font-bold text-zinc-900 dark:text-white">No project groups match this view.</p>
              <p className="text-xs text-zinc-500 mt-1">Adjust filters or create a project and report schedule.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projectGroups.map((group) => {
                if (!group) return null;
                const { project, focal, counts } = group;
                const expanded = expandedProjectId === project.id;
                const health =
                  !project.active ? "gray" : counts.overdue > 0 ? "red" : counts.dueSoon > 0 ? "amber" : "green";
                const healthClasses: Record<string, string> = {
                  green: "bg-emerald-500",
                  amber: "bg-amber-500",
                  red: "bg-red-500",
                  gray: "bg-zinc-400",
                };
                return (
                  <div key={project.id} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/40 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedProjectId(expanded ? null : project.id)}
                      className="w-full p-4 text-left hover:bg-white/70 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="mt-1 flex items-center gap-2">
                            {expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                            <span className={`h-3 w-3 rounded-full ${healthClasses[health]}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-black text-zinc-900 dark:text-white truncate">{project.name}</h3>
                              <Badge variant={project.active ? "success" : "default"}>{project.active ? "Active" : "Inactive"}</Badge>
                              <Badge variant="info">{formatReportFrequency(project.defaultFrequency)}</Badge>
                              {group.hasAttention && <Badge variant="warning">Attention Required</Badge>}
                            </div>
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                              {focal ? `${focal.name} - ${focal.email || "No email available"}` : "Focal user missing"}
                            </p>
                            <p className="mt-1 text-[11px] text-zinc-500">
                              Next deadline: {formatReportDate(group.nextDeadline)} - Reminder: {project.reminderLeadDays ?? settings.defaultLeadDays} days
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 xl:w-[420px]">
                          {[
                            {
                              label: "Reports",
                              value: counts.total,
                              className:
                                "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
                            },
                            {
                              label: "Due Soon",
                              value: counts.dueSoon,
                              className:
                                "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
                            },
                            {
                              label: "Overdue",
                              value: counts.overdue,
                              className:
                                "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
                            },
                            {
                              label: "Submitted",
                              value: counts.submitted,
                              className:
                                "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
                            },
                          ].map((counter) => (
                            <div
                              key={counter.label}
                              className={`rounded-xl border px-3 py-2 ${counter.className}`}
                            >
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-90">{counter.label}</p>
                              <p className="text-lg font-black">{counter.value.toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </button>
                    {expanded && (
                      <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-2">
                            {can("reports.edit") && (
                              <>
                                <Button variant="blue" onClick={() => openNewReportForProject(project)}>
                                  <Plus size={14} className="mr-2" /> Add Report to Project
                                </Button>
                                <Button variant="outline" onClick={() => openEditProject(project)}>
                                  <Edit3 size={14} className="mr-2" /> Edit Project
                                </Button>
                              </>
                            )}
                            {can("reports.delete") && (
                              <Button variant="outline" onClick={() => deleteProject(project)}>
                                <Trash2 size={14} className="mr-2" /> Delete Project
                              </Button>
                            )}
                          </div>
                          <Button variant="ghost" onClick={() => setExpandedProjectId(null)}>Collapse</Button>
                        </div>
                        {project.notes && (
                          <p className="rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-xs text-zinc-600 dark:text-zinc-400">
                            {project.notes}
                          </p>
                        )}
                        <div className="space-y-3">
                          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-500/30 dark:bg-blue-500/10">
                            <div className="mb-3 flex items-center justify-between border-b border-blue-200 pb-2 dark:border-blue-500/30">
                              <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                                Current Reports
                              </p>
                              <Badge variant="info">{group.currentRows.length} active</Badge>
                            </div>
                            {renderReportRows(group.currentRows, { showProject: false })}
                          </div>
                          {activeTab !== "due-soon" && (
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
                              <div className="mb-3 flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
                                <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                                  Submission History
                                </p>
                                <Badge variant="default">{group.historyRows.length} records</Badge>
                              </div>
                              {renderReportRows(group.historyRows, { showProject: false })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ) : (
        <Card
          title="All Report Schedules"
          description="Submission dates, deadlines, reminder windows, and focal person readiness"
          action={can("reports.edit") && <Button variant="blue" onClick={openNewReport} disabled={projects.length === 0}><Plus size={14} className="mr-2" /> Add Report</Button>}
        >
          {renderReportRows(reportRows, { showProject: true })}
        </Card>
      )}

      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title={projectForm.id ? "Edit Activity/Project" : "New Activity/Project"}
        footer={<><Button variant="ghost" onClick={() => setIsProjectModalOpen(false)}>Cancel</Button><Button variant="blue" onClick={saveProject}>Save Activity/Project</Button></>}
      >
        <div className="space-y-4">
          <Input label="Activity/Project Name" value={projectForm.name} onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Focal Person</label>
              <select value={projectForm.focalUserId} onChange={(event) => setProjectForm({ ...projectForm, focalUserId: event.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none">
                <option value="">Select user</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.name} - {user.email}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Default Frequency</label>
              <select value={projectForm.defaultFrequency} onChange={(event) => setProjectForm({ ...projectForm, defaultFrequency: event.target.value as ReportFrequency })} className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none">
                {REPORT_FREQUENCY_OPTIONS.map((frequency) => <option key={frequency} value={frequency}>{formatReportFrequency(frequency)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Reminder Override Days" type="number" min={0} placeholder={`${settings.defaultLeadDays} default`} value={projectForm.reminderLeadDays} onChange={(event) => setProjectForm({ ...projectForm, reminderLeadDays: event.target.value })} />
            <label className="flex items-center gap-3 mt-6 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 cursor-pointer">
              <input type="checkbox" checked={projectForm.active} onChange={(event) => setProjectForm({ ...projectForm, active: event.target.checked })} className="w-4 h-4 rounded text-blue-600" />
              <span className="text-sm font-bold text-zinc-900 dark:text-white">Active project</span>
            </label>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Notes</label>
            <textarea value={projectForm.notes} onChange={(event) => setProjectForm({ ...projectForm, notes: event.target.value })} rows={3} className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none resize-none" />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={reportForm.id ? "Edit Report Schedule" : "New Report Schedule"}
        footer={
          <>
            {isSuperAdmin && reportForm.id && (
              <Button
                variant="outline"
                onClick={() => {
                  const row = allReportRows.find((entry) => entry.report.id === reportForm.id);
                  if (row) void sendManualTestReminder(row);
                }}
                disabled={manualSendingReportId === reportForm.id}
                className="mr-auto"
              >
                <Send size={14} className="mr-2" /> Send Test Reminder
              </Button>
            )}
            <Button variant="ghost" onClick={() => setIsReportModalOpen(false)}>Cancel</Button>
            <Button variant="blue" onClick={saveReport}>Save Report</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Project</label>
            <select value={reportForm.projectId} onChange={(event) => {
              const project = projectsById.get(event.target.value);
              setReportForm({ ...reportForm, projectId: event.target.value, frequency: project?.defaultFrequency || reportForm.frequency });
            }} className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none">
              <option value="">Select project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </div>
          <Input label="Report Title" value={reportForm.title} onChange={(event) => setReportForm({ ...reportForm, title: event.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Report Period" placeholder="e.g. January 2026, Q1 2026" value={reportForm.period} onChange={(event) => setReportForm({ ...reportForm, period: event.target.value })} />
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Frequency</label>
              <select value={reportForm.frequency} onChange={(event) => setReportForm({ ...reportForm, frequency: event.target.value as ReportFrequency })} className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none">
                {REPORT_FREQUENCY_OPTIONS.map((frequency) => <option key={frequency} value={frequency}>{formatReportFrequency(frequency)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Deadline" type="date" value={reportForm.deadline} onChange={(event) => setReportForm({ ...reportForm, deadline: event.target.value })} />
            <Input label="Submitted Date" type="date" value={reportForm.submittedDate} onChange={(event) => setReportForm({ ...reportForm, submittedDate: event.target.value })} />
            <Input label="Reminder Override" type="number" min={0} placeholder={`${settings.defaultLeadDays} default`} value={reportForm.reminderLeadDays} onChange={(event) => setReportForm({ ...reportForm, reminderLeadDays: event.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Remarks</label>
            <textarea value={reportForm.remarks} onChange={(event) => setReportForm({ ...reportForm, remarks: event.target.value })} rows={3} className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none resize-none" />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(submittedDateReport)}
        onClose={() => {
          setSubmittedDateReport(null);
          setSubmittedDateValue("");
        }}
        title="Edit Submitted Date"
        maxWidth="max-w-sm"
        footer={
          <>
            {submittedDateReport?.submittedDate && (
              <Button
                variant="ghost"
                onClick={() => updateSubmittedDate(undefined)}
                className="mr-auto text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Clear Date
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                setSubmittedDateReport(null);
                setSubmittedDateValue("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="blue"
              onClick={() => updateSubmittedDate(submittedDateValue)}
              disabled={!submittedDateValue}
            >
              Save Date
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Report
            </p>
            <p className="mt-1 text-sm font-black text-zinc-900 dark:text-white">
              {submittedDateReport?.title || "Report schedule"}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Deadline: {formatReportDate(submittedDateReport?.deadline)}
            </p>
          </div>
          <Input
            label="Submitted Date"
            type="date"
            value={submittedDateValue}
            onChange={(event) => setSubmittedDateValue(event.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};
