import React from "react";
import { Input } from "../../components/ui";
import type { LandingConfig } from "../../LandingConfigContext";

interface PortalHighlightsSectionProps {
  landingConfigForm: LandingConfig;
  setLandingConfigForm: React.Dispatch<React.SetStateAction<LandingConfig>>;
}

export const PortalHighlightsSection: React.FC<PortalHighlightsSectionProps> = ({
  landingConfigForm,
  setLandingConfigForm,
}) => {
  return (
    <div id="portal-highlights-section" className="order-3">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4">
        <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest">
          Census Snapshot Section
        </h4>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
        The landing highlights now pull per-activity live data from the Census
        &amp; Surveys module. It shows current activity details (for example,
        CPI under Surveys), status, progress, and latest updates.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Input
          label="Highlights Section Title"
          value={landingConfigForm.highlights.title || "Census & Surveys Highlights"}
          onChange={(e) =>
            setLandingConfigForm({
              ...landingConfigForm,
              highlights: {
                ...landingConfigForm.highlights,
                title: e.target.value,
              },
            })
          }
        />
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
          <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            Data Source
          </p>
          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Census &amp; Surveys Activity Tracker
          </p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
            Uses live activity status, cycle progress, target counts, and
            completion totals.
          </p>
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-4">
        <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
          Auto-generated Landing Metrics
        </p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2">
            Featured live activity per group (Census and Surveys)
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2">
            Current status badge and real-time progress
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2">
            Cycle code, phase, completed/target, and last updated
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2">
            Current activity list for each group
          </div>
        </div>
        <p className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">
          To change these values, update data in the Census &amp; Surveys
          module (activities and active cycles).
        </p>
      </div>
    </div>
  );
};
