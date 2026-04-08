import React from "react";
import { Building, Users } from "lucide-react";
import { RevealSection } from "./RevealSection";

export interface CensusActivitySummary {
  id: string;
  acronym?: string;
  name: string;
  frequency: string;
  hasActiveCycle: boolean;
  currentPhase?: string;
  status: string;
  progress: number;
  completedCount: number;
  targetCount: number;
}

export interface CensusGroupSummary {
  key: "census" | "surveys";
  title: string;
  subtitle: string;
  totalActivities: number;
  activeCycles: number;
  delayedActivities: number;
  totalCompleted: number;
  totalTarget: number;
  activities: CensusActivitySummary[];
}

export interface LivePublicActivity {
  activity: CensusActivitySummary;
  groupTitle: string;
  groupKey: "census" | "surveys";
}

interface LandingCensusSectionProps {
  highlightsTitle: string;
  isCensusSnapshotLoading: boolean;
  isCensusSnapshotRefreshing: boolean;
  lastCensusSnapshotSyncAt: number | null;
  censusSnapshot: { groups: CensusGroupSummary[] };
  livePublicActivities: LivePublicActivity[];
  activeCensusActivityId: string | null;
  toggleCensusModal: (id: string) => void;
  formatCount: (value: number) => string;
  formatPercent: (value: number) => string;
  formatTimeOrFallback: (value: number | null) => string;
  clampPercent: (value: number) => number;
}

export const LandingCensusSection: React.FC<LandingCensusSectionProps> = ({
  highlightsTitle,
  isCensusSnapshotLoading,
  isCensusSnapshotRefreshing,
  lastCensusSnapshotSyncAt,
  censusSnapshot,
  livePublicActivities,
  activeCensusActivityId,
  toggleCensusModal,
  formatCount,
  formatPercent,
  formatTimeOrFallback,
  clampPercent,
}) => {
  return (
    <section id="highlights" className="public-container public-section-y">
      <RevealSection>
        <div className="relative overflow-hidden rounded-[30px] border border-psa-line dark:border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(0,86,179,0.13),transparent_44%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.11),transparent_48%),linear-gradient(145deg,#ffffff_0%,#f4f8ff_48%,#edf9f6_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.24),transparent_48%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.16),transparent_54%),linear-gradient(145deg,#0b1020_0%,#071019_52%,#06110f_100%)] shadow-[0_24px_60px_rgba(0,51,102,0.08)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -left-12 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl" />
          </div>

          <div className="relative px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-psa-blue font-semibold">
                  Census &amp; Surveys Live Board
                </p>
                <h2 className="mt-2 font-serif text-3xl sm:text-5xl text-psa-navy">
                  {highlightsTitle}
                </h2>
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-200 max-w-2xl">
                  Browse a compact live list of every census and survey below,
                  then click any activity to open its floating live board with
                  the Aurora map and watchlist.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isCensusSnapshotLoading || isCensusSnapshotRefreshing ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-zinc-300/80 dark:border-zinc-700 bg-white/85 dark:bg-black/70 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-psa-blue animate-pulse" />
                    {isCensusSnapshotLoading
                      ? "Syncing live data..."
                      : "Refreshing live activity..."}
                  </span>
                ) : null}

                <span className="inline-flex items-center gap-2 rounded-full border border-zinc-300/80 dark:border-zinc-700 bg-white/85 dark:bg-black/70 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Auto-refresh every 60s
                </span>

                {!isCensusSnapshotLoading && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-zinc-300/80 dark:border-zinc-700 bg-white/85 dark:bg-black/70 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
                    Last sync {formatTimeOrFallback(lastCensusSnapshotSyncAt)}
                  </span>
                )}

                {!isCensusSnapshotLoading &&
                  censusSnapshot.groups.map((group) => {
                    const isCensus = group.key === "census";
                    return (
                      <span
                        key={`${group.key}-chip`}
                        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm ${
                          isCensus
                            ? "border-blue-300/80 dark:border-blue-400/35 bg-blue-50/90 dark:bg-blue-500/10 text-blue-700 dark:text-blue-200"
                            : "border-teal-300/80 dark:border-teal-400/35 bg-teal-50/90 dark:bg-teal-500/10 text-teal-700 dark:text-teal-200"
                        }`}
                      >
                        {group.title}: {formatCount(group.totalActivities)}
                      </span>
                    );
                  })}
              </div>
            </div>

            <div className="mt-7 grid xl:grid-cols-2 gap-4 sm:gap-5">
              {livePublicActivities.length > 0 ? (
                <div className="xl:col-span-2 rounded-[24px] border border-white/60 dark:border-white/10 bg-white/72 dark:bg-black/18 px-4 py-4 shadow-[0_16px_38px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-psa-blue dark:text-sky-200">
                        Currently Reporting
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100 max-w-2xl">
                        Active cycles are already public. Monitoring activities
                        like CPI appear under the Surveys board.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 dark:border-emerald-400/30 bg-emerald-50/90 dark:bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-200 whitespace-nowrap">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      {formatCount(livePublicActivities.length)} live cycle
                      {livePublicActivities.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {livePublicActivities.map(({ activity, groupTitle, groupKey }) => (
                      <button
                        key={`live-public-${activity.id}`}
                        type="button"
                        onClick={() => toggleCensusModal(activity.id)}
                        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-left text-xs font-semibold transition-all ${
                          groupKey === "census"
                            ? "border-blue-200/90 bg-blue-50/95 text-blue-800 hover:border-blue-300 hover:bg-blue-100/90 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-100"
                            : "border-teal-200/90 bg-teal-50/95 text-teal-800 hover:border-teal-300 hover:bg-teal-100/90 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-100"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${groupKey === "census" ? "bg-blue-500" : "bg-emerald-500"} animate-pulse`}
                        />
                        <span>{groupTitle}</span>
                        <span className="text-slate-400 dark:text-slate-500">
                          -
                        </span>
                        <span>{activity.acronym || activity.name}</span>
                        <span className="text-slate-400 dark:text-slate-500">
                          -
                        </span>
                        <span>{formatPercent(activity.progress)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {censusSnapshot.groups.map((group, idx) => {
                const isCensus = group.key === "census";
                const Icon = isCensus ? Building : Users;
                const topAccent = isCensus
                  ? "bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500"
                  : "bg-gradient-to-r from-teal-500 via-emerald-500 to-lime-500";
                const iconTone = isCensus
                  ? "text-blue-700 dark:text-blue-200 bg-blue-100/85 dark:bg-blue-500/20 border-blue-200/80 dark:border-blue-400/35"
                  : "text-teal-700 dark:text-teal-200 bg-teal-100/85 dark:bg-teal-500/20 border-teal-200/80 dark:border-teal-400/35";
                const badgeTone = isCensus
                  ? "text-blue-700 dark:text-blue-50 border-blue-200/80 dark:border-blue-300/34 bg-blue-50/90 dark:bg-[linear-gradient(145deg,rgba(18,40,77,0.92),rgba(12,28,55,0.88))] dark:shadow-[0_10px_22px_rgba(37,99,235,0.24)]"
                  : "text-teal-700 dark:text-teal-50 border-teal-200/80 dark:border-teal-300/34 bg-teal-50/90 dark:bg-[linear-gradient(145deg,rgba(10,53,49,0.92),rgba(8,38,35,0.88))] dark:shadow-[0_10px_22px_rgba(20,184,166,0.22)]";
                const shellTone = isCensus
                  ? "bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_42%),linear-gradient(160deg,rgba(255,255,255,0.96),rgba(244,248,255,0.96))] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_42%),linear-gradient(160deg,rgba(10,18,32,0.96),rgba(7,14,25,0.95))]"
                  : "bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(132,204,22,0.12),transparent_42%),linear-gradient(160deg,rgba(255,255,255,0.96),rgba(241,253,249,0.96))] dark:bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(132,204,22,0.12),transparent_42%),linear-gradient(160deg,rgba(8,20,19,0.96),rgba(7,18,15,0.95))]";
                const glowTone = isCensus ? "bg-blue-400/20" : "bg-teal-400/20";
                const summaryTone = isCensus
                  ? "border-blue-200/70 dark:border-blue-400/25 bg-white/68 dark:bg-blue-500/7"
                  : "border-teal-200/70 dark:border-teal-400/25 bg-white/68 dark:bg-teal-500/7";
                const metricSurfaceTone = isCensus
                  ? "border-blue-100/80 dark:border-blue-400/20 bg-white/82 dark:bg-zinc-900/72"
                  : "border-teal-100/80 dark:border-teal-400/20 bg-white/82 dark:bg-zinc-900/72";
                const listTone = isCensus
                  ? "border-blue-100/75 dark:border-blue-400/22 bg-white/70 dark:bg-blue-500/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  : "border-teal-100/75 dark:border-teal-400/22 bg-white/70 dark:bg-teal-500/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";
                const signalTone = isCensus ? "bg-blue-500" : "bg-emerald-500";
                const barTone = isCensus
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                  : "bg-gradient-to-r from-teal-500 to-emerald-500";
                const activeCardTone = isCensus
                  ? "border-blue-300/80 dark:border-blue-400/40 bg-blue-50/80 dark:bg-blue-500/[0.11] ring-2 ring-blue-500/15 shadow-[0_14px_30px_rgba(37,99,235,0.14)] dark:shadow-[0_12px_22px_rgba(2,8,23,0.24)]"
                  : "border-teal-300/80 dark:border-teal-400/40 bg-teal-50/80 dark:bg-teal-500/[0.11] ring-2 ring-teal-500/15 shadow-[0_14px_30px_rgba(20,184,166,0.14)] dark:shadow-[0_12px_22px_rgba(2,8,23,0.24)]";
                const idleCardTone = isCensus
                  ? "border-zinc-200/80 dark:border-blue-400/16 bg-white/92 dark:bg-white/[0.03] hover:border-blue-200/80 dark:hover:border-blue-400/35 hover:bg-blue-50/45 dark:hover:bg-blue-500/[0.08] dark:shadow-[0_10px_18px_rgba(2,6,23,0.14)]"
                  : "border-zinc-200/80 dark:border-teal-400/16 bg-white/92 dark:bg-white/[0.03] hover:border-teal-200/80 dark:hover:border-teal-400/35 hover:bg-teal-50/45 dark:hover:bg-teal-500/[0.08] dark:shadow-[0_10px_18px_rgba(2,6,23,0.14)]";

                return (
                  <RevealSection key={group.key} delay={idx * 140}>
                    <article
                      className={`group relative overflow-hidden rounded-[26px] border border-zinc-200/85 dark:border-zinc-700/70 shadow-[0_20px_44px_rgba(2,23,55,0.10)] backdrop-blur-sm ${shellTone}`}
                    >
                      <div className={`absolute inset-x-0 top-0 h-1.5 ${topAccent}`} />
                      <div className="pointer-events-none absolute inset-0">
                        <div
                          className={`absolute -top-14 right-0 h-40 w-40 rounded-full blur-3xl ${glowTone}`}
                        />
                        <div
                          className={`absolute bottom-0 left-0 h-32 w-32 rounded-full blur-3xl ${glowTone}`}
                        />
                        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(148,163,184,0.28)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:20px_20px]" />
                      </div>

                      <div className="relative p-5 sm:p-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div
                              className={`relative h-12 w-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] ${iconTone}`}
                            >
                              <div className="absolute inset-1 rounded-[14px] bg-white/35 dark:bg-white/5" />
                              <Icon className="relative w-5 h-5" strokeWidth={1.8} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-zinc-200">
                                  {isCensus ? "Enumeration Board" : "Collection Board"}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${badgeTone}`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${signalTone} ${group.activeCycles > 0 ? "animate-pulse" : ""}`}
                                  />
                                  {formatCount(group.totalActivities)} activities
                                </span>
                              </div>
                              <h3 className="font-serif text-2xl text-psa-navy dark:text-white leading-tight">
                                {group.title}
                              </h3>
                              <p className="mt-1 text-sm text-slate-600 dark:text-zinc-100 max-w-xl">
                                {group.subtitle}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                            <span className="inline-flex items-center rounded-full border border-zinc-200/80 dark:border-white/12 bg-white/80 dark:bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-zinc-100">
                              {group.activeCycles > 0
                                ? "Live public feed"
                                : "Read-only standby"}
                            </span>
                            {group.delayedActivities > 0 ? (
                              <span className="inline-flex items-center rounded-full border border-amber-200/80 dark:border-amber-400/30 bg-amber-50/90 dark:bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                {formatCount(group.delayedActivities)} delayed
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className={`mt-5 rounded-[22px] border p-4 sm:p-5 ${summaryTone}`}>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                                Aurora Snapshot
                              </p>
                              <p className="mt-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100 max-w-md leading-relaxed">
                                {group.activeCycles > 0
                                  ? `${formatCount(group.activeCycles)} live cycle${group.activeCycles === 1 ? "" : "s"} currently reporting across Aurora municipalities.`
                                  : "No active cycles yet, but this public board is ready for live monitoring as soon as fieldwork starts."}
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 dark:border-zinc-700/70 bg-white/85 dark:bg-zinc-950/60 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                              <span
                                className={`h-2 w-2 rounded-full ${signalTone} ${group.activeCycles > 0 ? "animate-pulse" : ""}`}
                              />
                              Click a row to open details
                            </span>
                          </div>

                          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                            <div className={`rounded-2xl border px-3.5 py-3 ${metricSurfaceTone}`}>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                                Live Cycles
                              </p>
                              <p className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white">
                                {formatCount(group.activeCycles)}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                                Currently running activity cycles
                              </p>
                            </div>
                            <div className={`rounded-2xl border px-3.5 py-3 ${metricSurfaceTone}`}>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                                Delayed
                              </p>
                              <p className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white">
                                {formatCount(group.delayedActivities)}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                                Activities needing attention
                              </p>
                            </div>
                            <div className={`rounded-2xl border px-3.5 py-3 ${metricSurfaceTone}`}>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                                Completed / Target
                              </p>
                              <p className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white">
                                {formatCount(group.totalCompleted)}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                                of {formatCount(group.totalTarget)} total target
                                outputs
                              </p>
                            </div>
                          </div>
                        </div>

                        {group.activities.length > 0 ? (
                          <div className={`mt-4 rounded-[22px] border p-2.5 sm:p-3 ${listTone}`}>
                            <div className="flex items-center justify-between gap-3 px-1 pb-2">
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-300">
                                Activity Queue
                              </p>
                              <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-100">
                                Compact rows, one-click live board
                              </span>
                            </div>

                            <div className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1 sm:max-h-[500px]">
                              {group.activities.map((activity) => {
                                const isActivePreview =
                                  activeCensusActivityId === activity.id;
                                return (
                                  <article
                                    key={activity.id}
                                    className={`rounded-xl border transition-all duration-200 ${isActivePreview ? activeCardTone : idleCardTone}`}
                                  >
                                    <button
                                      type="button"
                                      className="w-full text-left px-3.5 py-3 sm:px-4 sm:py-3.5"
                                      onClick={() => {
                                        toggleCensusModal(activity.id);
                                      }}
                                      aria-expanded={isActivePreview}
                                      aria-pressed={isActivePreview}
                                      aria-haspopup="dialog"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            {activity.acronym && (
                                              <span
                                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeTone}`}
                                              >
                                                {activity.acronym}
                                              </span>
                                            )}
                                            <span className="inline-flex items-center rounded-full border border-zinc-200/80 dark:border-zinc-200/12 bg-white/85 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.76),rgba(30,41,59,0.62))] px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-white shadow-sm dark:shadow-[0_8px_16px_rgba(2,6,23,0.22)]">
                                              {activity.frequency}
                                            </span>
                                          </div>
                                          <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                            {activity.name}
                                          </p>
                                          <p className="mt-1 text-[11px] text-slate-600 dark:text-zinc-300 truncate">
                                            {activity.hasActiveCycle
                                              ? activity.currentPhase
                                              : "No active cycle yet"}
                                          </p>
                                        </div>
                                        <span
                                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${ACTIVITY_STATUS_STYLES[activity.status]}`}
                                        >
                                          {activity.status}
                                        </span>
                                      </div>

                                      <div className="mt-2.5 flex items-center justify-between gap-3 text-[11px] text-slate-600 dark:text-zinc-200">
                                        <span>
                                          {activity.hasActiveCycle
                                            ? `${formatPercent(activity.progress)} progress`
                                            : "Pending setup"}
                                        </span>
                                        <span>
                                          {activity.targetCount > 0
                                            ? `${formatCount(activity.completedCount)} / ${formatCount(activity.targetCount)}`
                                            : "No target yet"}
                                        </span>
                                      </div>
                                      <div className="mt-1.5 h-1 rounded-full bg-slate-200/85 dark:bg-zinc-800 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${barTone} transition-[width] duration-700 ease-out`}
                                          style={{
                                            width: `${Math.max(clampPercent(activity.progress), activity.hasActiveCycle && activity.progress > 0 ? 6 : 0)}%`,
                                          }}
                                        />
                                      </div>
                                    </button>
                                  </article>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <p className="mt-4 text-xs text-slate-600 dark:text-slate-300">
                            No records yet. Add {group.key === "census" ? "Census" : "Survey"} activities in the tracker to populate this panel.
                          </p>
                        )}
                      </div>
                    </article>
                  </RevealSection>
                );
              })}
            </div>

            <div className="mt-6">
              <RevealSection>
                <div className="rounded-[24px] border border-dashed border-zinc-300/80 dark:border-zinc-700/80 bg-white/70 dark:bg-zinc-900/45 px-5 py-5 sm:px-6 sm:py-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-slate-500 dark:text-slate-400">
                        Floating live board
                      </p>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                        Click any census or survey row above to open a floating public activity board with the Aurora map and municipality watchlist.
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-zinc-200/80 dark:border-zinc-700/70 bg-white/90 dark:bg-zinc-950/60 px-3 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      Read-only public preview
                    </span>
                  </div>
                </div>
              </RevealSection>
            </div>
          </div>
        </div>
      </RevealSection>
    </section>
  );
};

const ACTIVITY_STATUS_STYLES: Record<string, string> = {
  "In Progress":
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  "For Validation":
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  Completed:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
  Draft: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400",
};
