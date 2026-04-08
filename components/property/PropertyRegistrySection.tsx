import React from "react";
import { Building2, Eye, MapPin, UserCheck } from "lucide-react";
import { Button, Card } from "../ui";
import type {
  Asset,
  AssetCategory,
  CustodyRecord,
} from "../../pages/property/propertyTypes";

interface PropertyRegistrySectionProps {
  filteredAssets: Asset[];
  categories: AssetCategory[];
  custodyRecords: CustodyRecord[];
  registryViewMode: "list" | "grid";
  onOpenAsset: (asset: Asset) => void;
}

const statusColors: Record<string, string> = {
  "In Stock":
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
  Issued:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  Transferred:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  Returned:
    "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400",
  Disposed:
    "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  Missing:
    "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300",
};

const conditionColors: Record<string, string> = {
  Serviceable: "text-emerald-600",
  Unserviceable: "text-red-600",
  "For Repair": "text-amber-600",
  "For Disposal": "text-red-500",
};

export const PropertyRegistrySection: React.FC<
  PropertyRegistrySectionProps
> = ({
  filteredAssets,
  categories,
  custodyRecords,
  registryViewMode,
  onOpenAsset,
}) => {
  return (
    <>
      {registryViewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 animate-in fade-in duration-300">
          {filteredAssets.map((asset) => {
            const cat = categories.find((c) => c.id === asset.categoryId);
            const custodian = custodyRecords.find(
              (c) => c.assetId === asset.id && !c.dateReturned,
            );
            return (
              <Card
                key={asset.id}
                className="!p-2.5 border-zinc-100 dark:border-zinc-800/80 hover:border-blue-500/30 group flex flex-col h-full bg-white dark:bg-zinc-900/40 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer"
                onClick={() => onOpenAsset(asset)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 dark:border-blue-500/20 transition-transform group-hover:scale-110">
                    <Building2 size={14} />
                  </div>
                  <span
                    className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${statusColors[asset.status] || ""}`}
                  >
                    {asset.status}
                  </span>
                </div>
                <div className="flex-1 mb-2">
                  <h4 className="text-[12px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight leading-[1.3] line-clamp-2 min-h-[32px] group-hover:text-blue-600 transition-colors">
                    {asset.description}
                  </h4>
                  <p className="text-[8px] font-bold text-blue-600 mt-1">
                    {asset.propertyNo}
                  </p>
                  <p className="text-[7px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                    {cat?.name || ""} • {asset.assetClass}
                  </p>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <div className="flex-1 flex flex-col items-center bg-zinc-50 dark:bg-zinc-800/40 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
                    <span className="text-[6px] text-zinc-400 font-bold uppercase leading-none">
                      Cost
                    </span>
                    <span className="text-[9px] font-black text-zinc-900 dark:text-white mt-0.5">
                      ₱{asset.cost.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col items-center bg-zinc-50 dark:bg-zinc-800/40 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
                    <span
                      className={`text-[6px] font-bold uppercase leading-none ${conditionColors[asset.condition] || "text-zinc-400"}`}
                    >
                      Cond
                    </span>
                    <span
                      className={`text-[9px] font-black mt-0.5 ${conditionColors[asset.condition] || ""}`}
                    >
                      {asset.condition.split(" ")[0]}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-50 dark:border-zinc-800/40">
                  <p className="text-[8px] font-bold text-zinc-400 truncate">
                    <MapPin size={8} className="inline mr-0.5" />
                    {asset.location}
                  </p>
                  {custodian && (
                    <p className="text-[8px] font-bold text-blue-500 truncate mt-0.5">
                      <UserCheck size={8} className="inline mr-0.5" />
                      {custodian.custodianName}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800/50">
                  <th className="pb-4 px-3 sm:px-0">Property No.</th>
                  <th className="pb-4">Description</th>
                  <th className="pb-4">Class</th>
                  <th className="pb-4">Location</th>
                  <th className="pb-4">Cost</th>
                  <th className="pb-4">Condition</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4 text-right px-3 sm:px-0">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/30">
                {filteredAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/40 cursor-pointer"
                    onClick={() => onOpenAsset(asset)}
                  >
                    <td className="py-3 px-3 sm:px-0 text-xs font-bold text-blue-600">
                      {asset.propertyNo}
                    </td>
                    <td className="py-3">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">
                        {asset.description}
                      </span>
                    </td>
                    <td className="py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      {asset.assetClass}
                    </td>
                    <td className="py-3 text-xs text-zinc-500">
                      {asset.location}
                    </td>
                    <td className="py-3 text-xs font-bold">
                      ₱{asset.cost.toLocaleString()}
                    </td>
                    <td
                      className={`py-3 text-xs font-bold ${conditionColors[asset.condition] || ""}`}
                    >
                      {asset.condition}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${statusColors[asset.status] || ""}`}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td className="py-3 text-right px-3 sm:px-0">
                      <Button
                        variant="ghost"
                        className="!px-2 !py-1 text-[9px] uppercase font-black"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          onOpenAsset(asset);
                        }}
                      >
                        <Eye size={12} className="mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {filteredAssets.length === 0 && (
        <div className="py-20 flex flex-col items-center opacity-40">
          <Building2 size={48} className="mb-4 text-zinc-300" />
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
            No assets found
          </p>
        </div>
      )}
    </>
  );
};
