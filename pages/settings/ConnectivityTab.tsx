import React from "react";
import {
  Database,
  Globe2,
  Monitor,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { Badge, Button, Card, Input } from "../../components/ui";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

interface StatusPanelProps {
  icon: LucideIcon;
  title: string;
  badgeLabel: string;
  badgeVariant: BadgeVariant;
  message: string;
  metaLines?: string[];
  notice?: React.ReactNode;
  actionLabel: string;
  actionPending?: boolean;
  onAction: () => void;
  wide?: boolean;
}

interface ConnectivityTabProps {
  backendUrl: string;
  backendConnectionMessage: string;
  backendConnectionLabel: string;
  backendConnectionBadgeVariant: BadgeVariant;
  backendConnectionCheckedAtLabel: string;
  backendConnectionLatencyMs: number | null;
  hasBackendOverride: boolean;
  backendOverrideValue: string;
  backendUrlDraft: string;
  onBackendUrlDraftChange: (value: string) => void;
  onApplyBackendOverride: () => void;
  onClearBackendOverride: () => void;
  onRecheckBackend: () => void;
  isBackendChecking: boolean;
  publicLandingSyncMessage: string;
  publicSyncLabel: string;
  publicSyncBadgeVariant: BadgeVariant;
  publicSyncCheckedAtLabel: string;
  publicLandingSyncRecordId: string | null;
  hasUnsavedLandingChanges: boolean;
  onRecheckPublicSync: () => void;
  isPublicSyncChecking: boolean;
  publicCensusSyncMessage: string;
  publicCensusSyncLabel: string;
  publicCensusSyncBadgeVariant: BadgeVariant;
  publicCensusSyncCheckedAtLabel: string;
  publicCensusActiveCycleCount: number;
  publicCensusMastersRecordId: string | null;
  publicCensusCyclesRecordId: string | null;
  onRecheckPublicCensusSync: () => void;
  isPublicCensusSyncChecking: boolean;
  opsRunnerUrl: string;
  onOpsRunnerUrlChange: (value: string) => void;
  opsRunnerToken: string;
  onOpsRunnerTokenChange: (value: string) => void;
  onRecheckRunner: () => void;
  isOpsRunnerChecking: boolean;
  onCopyOpsRunnerCommand: () => void;
  startOpsRunnerCommand: string;
  opsRunnerBaseUrl: string;
  opsRunnerLabel: string;
  opsRunnerBadgeVariant: BadgeVariant;
  opsRunnerMessage: string;
  opsRunnerCheckedAtLabel: string;
  opsRunnerVersion: string | null;
  opsCommandState: "idle" | "running" | "success" | "error";
  opsCommandBadgeVariant: BadgeVariant;
  opsCommandStateLabel: string;
  opsCommandLabel: string;
  opsCommandOutput: string;
  onRunOpsCommand: (
    commandName: "health-public" | "start-prod",
    displayName: string,
  ) => void;
}

const StatusPanel: React.FC<StatusPanelProps> = ({
  icon: Icon,
  title,
  badgeLabel,
  badgeVariant,
  message,
  metaLines = [],
  notice,
  actionLabel,
  actionPending = false,
  onAction,
  wide = false,
}) => (
  <div
    className={`p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/30 space-y-2.5 ${wide ? "xl:col-span-2" : ""}`}
  >
    <div className="flex items-center justify-between gap-2">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-700 dark:text-zinc-200 inline-flex items-center gap-1.5">
        <Icon size={13} /> {title}
      </p>
      <Badge variant={badgeVariant} className="!text-[10px]">
        {badgeLabel}
      </Badge>
    </div>
    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
      {message}
    </p>
    {metaLines.length > 0 ? (
      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-0.5">
        {metaLines.map((line) => (
          <p key={line} className={line.includes(": ") ? "break-all" : ""}>
            {line}
          </p>
        ))}
      </div>
    ) : null}
    {notice}
    <Button
      variant="outline"
      className="!h-9 !text-[11px] font-bold"
      onClick={onAction}
      disabled={actionPending}
    >
      <RefreshCw
        size={13}
        className={`mr-1.5 ${actionPending ? "animate-spin" : ""}`}
      />
      {actionLabel}
    </Button>
  </div>
);

export const ConnectivityTab: React.FC<ConnectivityTabProps> = ({
  backendUrl,
  backendConnectionMessage,
  backendConnectionLabel,
  backendConnectionBadgeVariant,
  backendConnectionCheckedAtLabel,
  backendConnectionLatencyMs,
  hasBackendOverride,
  backendOverrideValue,
  backendUrlDraft,
  onBackendUrlDraftChange,
  onApplyBackendOverride,
  onClearBackendOverride,
  onRecheckBackend,
  isBackendChecking,
  publicLandingSyncMessage,
  publicSyncLabel,
  publicSyncBadgeVariant,
  publicSyncCheckedAtLabel,
  publicLandingSyncRecordId,
  hasUnsavedLandingChanges,
  onRecheckPublicSync,
  isPublicSyncChecking,
  publicCensusSyncMessage,
  publicCensusSyncLabel,
  publicCensusSyncBadgeVariant,
  publicCensusSyncCheckedAtLabel,
  publicCensusActiveCycleCount,
  publicCensusMastersRecordId,
  publicCensusCyclesRecordId,
  onRecheckPublicCensusSync,
  isPublicCensusSyncChecking,
  opsRunnerUrl,
  onOpsRunnerUrlChange,
  opsRunnerToken,
  onOpsRunnerTokenChange,
  onRecheckRunner,
  isOpsRunnerChecking,
  onCopyOpsRunnerCommand,
  startOpsRunnerCommand,
  opsRunnerBaseUrl,
  opsRunnerLabel,
  opsRunnerBadgeVariant,
  opsRunnerMessage,
  opsRunnerCheckedAtLabel,
  opsRunnerVersion,
  opsCommandState,
  opsCommandBadgeVariant,
  opsCommandStateLabel,
  opsCommandLabel,
  opsCommandOutput,
  onRunOpsCommand,
}) => {
  const backendMeta = [
    `Last check: ${backendConnectionCheckedAtLabel}${backendConnectionLatencyMs != null ? ` - ${backendConnectionLatencyMs}ms` : ""}`,
    `Endpoint: ${backendUrl}`,
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
      <Card
        title="Connectivity & Operations"
        description="Monitor backend availability, public landing publish status, and run host-only operations commands."
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/30 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-700 dark:text-zinc-200 inline-flex items-center gap-1.5">
                <Database size={13} /> Backend Connection
              </p>
              <Badge
                variant={backendConnectionBadgeVariant}
                className="!text-[10px]"
              >
                {backendConnectionLabel}
              </Badge>
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {backendConnectionMessage}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {backendMeta[0]}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 break-all">
              {backendMeta[1]}
            </p>
            {hasBackendOverride ? (
              <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
                Browser-only backend override is active: {backendOverrideValue}.
                Other devices and incognito windows will not use this backend
                unless you configure the same override there too.
              </div>
            ) : null}
            <Input
              label="Backend URL Override (optional)"
              value={backendUrlDraft}
              onChange={(e) => onBackendUrlDraftChange(e.target.value)}
              placeholder="https://pocketbase.example.com"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="!h-9 !text-[11px]"
                onClick={onApplyBackendOverride}
              >
                Apply Backend URL
              </Button>
              <Button
                variant="ghost"
                className="!h-9 !text-[11px]"
                onClick={onClearBackendOverride}
              >
                Clear Override
              </Button>
            </div>
            <Button
              variant="outline"
              className="!h-9 !text-[11px] font-bold"
              onClick={onRecheckBackend}
              disabled={isBackendChecking}
            >
              <RefreshCw
                size={13}
                className={`mr-1.5 ${isBackendChecking ? "animate-spin" : ""}`}
              />
              Recheck Backend
            </Button>
          </div>

          <StatusPanel
            icon={Globe2}
            title="Public Landing Sync"
            badgeLabel={publicSyncLabel}
            badgeVariant={publicSyncBadgeVariant}
            message={publicLandingSyncMessage}
            metaLines={[
              `Last check: ${publicSyncCheckedAtLabel}`,
              `Record: ${publicLandingSyncRecordId || "none"}`,
            ]}
            notice={
              hasUnsavedLandingChanges ? (
                <p className="text-[11px] text-amber-600 dark:text-amber-300 font-semibold">
                  Unsaved landing edits detected in Portal Config.
                </p>
              ) : undefined
            }
            actionLabel="Recheck Public Sync"
            actionPending={isPublicSyncChecking}
            onAction={onRecheckPublicSync}
          />

          <StatusPanel
            icon={Monitor}
            title="Public Census & Surveys Sync"
            badgeLabel={publicCensusSyncLabel}
            badgeVariant={publicCensusSyncBadgeVariant}
            message={publicCensusSyncMessage}
            metaLines={[
              `Last check: ${publicCensusSyncCheckedAtLabel}`,
              `Landing-visible active cycles: ${publicCensusActiveCycleCount}`,
              `Masters record: ${publicCensusMastersRecordId || "none"}`,
              `Cycles record: ${publicCensusCyclesRecordId || "none"}`,
            ]}
            notice={
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                If this browser shows an active CPI cycle but this check says
                missing/private, you are likely pointed at a different backend
                endpoint than the new device.
              </p>
            }
            actionLabel="Recheck Census Sync"
            actionPending={isPublicCensusSyncChecking}
            onAction={onRecheckPublicCensusSync}
            wide
          />
        </div>
      </Card>

      <Card
        title="Host Command Runner"
        description="Run operations directly from this page on the host PC. This runner only works on the machine where Aurora is hosted."
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="space-y-3">
            <Input
              label="Runner URL"
              value={opsRunnerUrl}
              onChange={(e) => onOpsRunnerUrlChange(e.target.value)}
              placeholder="http://127.0.0.1:4310"
            />
            <Input
              label="Runner Token (optional)"
              value={opsRunnerToken}
              onChange={(e) => onOpsRunnerTokenChange(e.target.value)}
              placeholder="x-aurora-runner-token"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="!h-9 !text-[11px]"
                onClick={onRecheckRunner}
                disabled={isOpsRunnerChecking}
              >
                <RefreshCw
                  size={13}
                  className={`mr-1 ${isOpsRunnerChecking ? "animate-spin" : ""}`}
                />{" "}
                Recheck Runner
              </Button>
              <Button
                variant="ghost"
                className="!h-9 !text-[11px]"
                onClick={onCopyOpsRunnerCommand}
              >
                <Database size={13} className="mr-1" /> Copy Start Runner
                Command
              </Button>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Runner start shortcut:{" "}
              <span className="font-semibold">{startOpsRunnerCommand}</span>
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 break-all">
              Runner endpoint:{" "}
              <span className="font-semibold">{opsRunnerBaseUrl}</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/30 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-700 dark:text-zinc-200">
                Runner Status
              </p>
              <Badge variant={opsRunnerBadgeVariant} className="!text-[10px]">
                {opsRunnerLabel}
              </Badge>
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {opsRunnerMessage}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Last check: {opsRunnerCheckedAtLabel}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Version: {opsRunnerVersion || "n/a"}
            </p>
          </div>
        </div>
      </Card>

      <Card
        title="Operations Commands"
        description="One-click commands that run on the host PC through the local runner."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="!h-9 !text-[11px]"
              onClick={() => onRunOpsCommand("health-public", "Public Health Check")}
              disabled={opsCommandState === "running"}
            >
              Run Health Check
            </Button>
            <Button
              variant="outline"
              className="!h-9 !text-[11px]"
              onClick={() =>
                onRunOpsCommand("start-prod", "Start Production Server")
              }
              disabled={opsCommandState === "running"}
            >
              Start Prod Server
            </Button>
          </div>

          <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/30">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-700 dark:text-zinc-200">
                Command Output
              </p>
              <Badge variant={opsCommandBadgeVariant} className="!text-[10px]">
                {opsCommandStateLabel}
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">
              Command: {opsCommandLabel || "none"}
            </p>
            <pre className="text-[11px] leading-5 whitespace-pre-wrap break-words font-mono bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 max-h-64 overflow-auto">
              {opsCommandOutput || "No command output yet."}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  );
};
