import React from "react";
import { FileSpreadsheet, LayoutGrid, List, Plus, Search } from "lucide-react";
import { Button } from "../ui";
import { PermissionGate } from "../PermissionGate";
import type { AssetClass, AssetStatus } from "../../pages/property/propertyTypes";

interface PropertyRegistryToolbarProps {
  registrySearch: string;
  setRegistrySearch: React.Dispatch<React.SetStateAction<string>>;
  classFilter: AssetClass | "All";
  setClassFilter: React.Dispatch<React.SetStateAction<AssetClass | "All">>;
  statusFilter: AssetStatus | "All";
  setStatusFilter: React.Dispatch<React.SetStateAction<AssetStatus | "All">>;
  registryViewMode: "list" | "grid";
  setRegistryViewMode: React.Dispatch<React.SetStateAction<"list" | "grid">>;
  onRegisterAsset: () => void;
  onExportAssetRegistry: () => void;
}

export const PropertyRegistryToolbar: React.FC<PropertyRegistryToolbarProps> = ({
  registrySearch,
  setRegistrySearch,
  classFilter,
  setClassFilter,
  statusFilter,
  setStatusFilter,
  registryViewMode,
  setRegistryViewMode,
  onRegisterAsset,
  onExportAssetRegistry,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="relative group w-full md:flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors"
          size={14}
        />
        <input
          type="text"
          placeholder="Search by description, property no., serial..."
          value={registrySearch}
          onChange={(e) => setRegistrySearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-xs shadow-sm"
        />
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value as AssetClass | "All")}
          className="px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Classes</option>
          <option value="PPE">PPE</option>
          <option value="Semi-Expendable">Semi-Expendable</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AssetStatus | "All")}
          className="px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Status</option>
          {(
            [
              "In Stock",
              "Issued",
              "Transferred",
              "Returned",
              "Disposed",
              "Missing",
            ] as AssetStatus[]
          ).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setRegistryViewMode("list")}
            className={`p-1.5 rounded-lg transition-all ${registryViewMode === "list" ? "bg-white dark:bg-zinc-800 text-blue-600 shadow-sm" : "text-zinc-400"}`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setRegistryViewMode("grid")}
            className={`p-1.5 rounded-lg transition-all ${registryViewMode === "grid" ? "bg-white dark:bg-zinc-800 text-blue-600 shadow-sm" : "text-zinc-400"}`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
        <PermissionGate requires="property.register">
          <Button
            variant="blue"
            onClick={onRegisterAsset}
            className="px-4 h-[38px] rounded-xl shadow-lg shadow-blue-500/20 text-[10px] font-black uppercase flex-1 md:flex-initial"
          >
            <Plus size={14} className="mr-2" /> Register Asset
          </Button>
        </PermissionGate>
        <PermissionGate requires="property.export">
          <Button
            variant="ghost"
            onClick={onExportAssetRegistry}
            className="text-[9px] font-black uppercase tracking-widest"
          >
            <FileSpreadsheet size={12} className="mr-1.5" /> Export
          </Button>
        </PermissionGate>
      </div>
    </div>
  );
};
