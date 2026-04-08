import React from "react";
import { Tabs } from "../ui";

interface PropertyPageHeaderProps {
  activeTab: string;
  tabs: Array<{ id: string; label: string; icon: React.ReactNode }>;
  onTabChange: (tabId: string) => void;
  onTabHover?: (tabId: string) => void;
  onTabFocus?: (tabId: string) => void;
}

export const PropertyPageHeader: React.FC<PropertyPageHeaderProps> = ({
  activeTab,
  tabs,
  onTabChange,
  onTabHover,
  onTabFocus,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight uppercase">
          Property & Assets
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-[13px] font-medium mt-1 uppercase tracking-widest">
          PSA Property Monitoring System
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onTabHover={onTabHover}
          onTabFocus={onTabFocus}
          className="border-b-0 mb-0"
        />
        <div className="hidden sm:block h-8 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" />
      </div>
    </div>
  );
};
