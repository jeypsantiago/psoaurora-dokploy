import React from "react";
import { Button } from "../ui";
import {
  InventoryCountLine,
  InventoryEvent,
  DiscrepancyType,
} from "../../pages/property/propertyTypes";
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  FileSpreadsheet,
} from "lucide-react";

interface DiscrepancyReportProps {
  event: InventoryEvent;
  countLines: InventoryCountLine[];
  onExport?: () => void;
  canExport?: boolean;
}

const discrepancyLabels: Record<
  DiscrepancyType,
  { label: string; color: string; bgColor: string }
> = {
  missing: {
    label: "Missing / Not Found",
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  },
  found: {
    label: "Found but Unrecorded",
    color: "text-emerald-600",
    bgColor:
      "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
  },
  "wrong-location": {
    label: "Wrong Location",
    color: "text-amber-600",
    bgColor:
      "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
  },
  damaged: {
    label: "Damaged / Unserviceable",
    color: "text-orange-600",
    bgColor:
      "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
  },
  untagged: {
    label: "Untagged / No Property Sticker",
    color: "text-purple-600",
    bgColor:
      "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
  },
};

export const DiscrepancyReport: React.FC<DiscrepancyReportProps> = ({
  countLines,
  onExport,
  canExport,
}) => {
  const discrepancies = countLines.filter((l) => l.discrepancyType);
  const clean = countLines.filter((l) => l.scanned && !l.discrepancyType);

  const groupedByType = discrepancies.reduce(
    (acc: Partial<Record<DiscrepancyType, InventoryCountLine[]>>, line) => {
      const key = line.discrepancyType;
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(line);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
            Total Expected
          </p>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1">
            {countLines.length}
          </p>
        </div>
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
            Verified OK
          </p>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
            {clean.length}
          </p>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
          <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">
            Discrepancies
          </p>
          <p className="text-2xl font-black text-red-700 dark:text-red-400 mt-1">
            {discrepancies.length}
          </p>
        </div>
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
            Not Scanned
          </p>
          <p className="text-2xl font-black text-zinc-700 dark:text-zinc-400 mt-1">
            {countLines.length - countLines.filter((l) => l.scanned).length}
          </p>
        </div>
      </div>

      {/* Export Button */}
      {canExport && onExport && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            onClick={onExport}
            className="text-[9px] font-black uppercase tracking-widest"
          >
            <FileSpreadsheet size={12} className="mr-1.5" /> Export Report
          </Button>
        </div>
      )}

      {/* Discrepancy Details by Type */}
      {(
        Object.entries(groupedByType) as Array<
          [DiscrepancyType, InventoryCountLine[] | undefined]
        >
      ).map(([type, lines]) => {
        const config = discrepancyLabels[type as DiscrepancyType];
        if (!config) return null;
        if (!lines) return null;

        return (
          <div key={type}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={12} className={config.color} />
              <h4
                className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}
              >
                {config.label} ({lines.length})
              </h4>
            </div>

            <div className="space-y-2">
              {lines.map((line) => (
                <div
                  key={line.id}
                  className={`p-3 rounded-xl border ${config.bgColor}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">
                        {line.assetDescription}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-blue-600">
                          {line.propertyNo}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300" />
                        <span className="text-[9px] text-zinc-400 font-medium">
                          <MapPin size={9} className="inline mr-0.5" />
                          Expected: {line.expectedLocation}
                          {line.foundLocation &&
                            line.foundLocation !== line.expectedLocation && (
                              <span className="text-amber-600 ml-1">
                                {"->"} Found: {line.foundLocation}
                              </span>
                            )}
                        </span>
                      </div>
                      {line.discrepancyNotes && (
                        <p className="text-[9px] text-zinc-500 mt-1 italic">
                          {line.discrepancyNotes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Clean section */}
      {discrepancies.length === 0 && (
        <div className="py-12 flex flex-col items-center opacity-50">
          <CheckCircle2 size={48} className="mb-4 text-emerald-400" />
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
            No discrepancies found
          </p>
          <p className="text-[10px] text-zinc-400 mt-1">
            All counted items match expected records
          </p>
        </div>
      )}
    </div>
  );
};
