import React from "react";
import { Package, Printer, RotateCcw, Truck, UserCheck } from "lucide-react";
import { Button, Card } from "../ui";
import { PermissionGate } from "../PermissionGate";
import type {
  Asset,
  AssetCategory,
  CustodyRecord,
} from "../../pages/property/propertyTypes";

interface PropertyCustodySectionProps {
  inStockAssets: Asset[];
  issuedAssets: Asset[];
  categories: AssetCategory[];
  custodyRecords: CustodyRecord[];
  onOpenIssueModal: (asset: Asset) => void;
  onOpenTransferModal: (asset: Asset) => void;
  onReturnAsset: (asset: Asset) => void;
  onGenerateIcsPdf: (
    asset: Asset,
    custody: CustodyRecord,
    category?: AssetCategory,
  ) => void;
}

export const PropertyCustodySection: React.FC<PropertyCustodySectionProps> = ({
  inStockAssets,
  issuedAssets,
  categories,
  custodyRecords,
  onOpenIssueModal,
  onOpenTransferModal,
  onReturnAsset,
  onGenerateIcsPdf,
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
      <Card
        title="Available for Issuance"
        description="Assets currently in stock and ready for issuance"
      >
        {inStockAssets.length > 0 ? (
          <div className="space-y-3">
            {inStockAssets.map((asset) => {
              const cat = categories.find((c) => c.id === asset.categoryId);
              return (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                      <Package size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">
                        {asset.description}
                      </p>
                      <p className="text-[9px] text-zinc-400 font-medium">
                        {asset.propertyNo} • {cat?.name} • ₱
                        {asset.cost.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <PermissionGate requires="property.issue">
                    <Button
                      variant="blue"
                      className="text-[9px] font-black uppercase tracking-widest rounded-xl px-4 shadow-lg shadow-blue-500/20"
                      onClick={() => onOpenIssueModal(asset)}
                    >
                      <UserCheck size={12} className="mr-1.5" /> Issue
                    </Button>
                  </PermissionGate>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center opacity-40">
            <Package size={48} className="mb-4 text-zinc-300" />
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
              No items in stock
            </p>
          </div>
        )}
      </Card>

      <Card
        title="Currently Issued Assets"
        description="Assets under custodian accountability"
      >
        {issuedAssets.length > 0 ? (
          <div className="space-y-3">
            {issuedAssets.map((asset) => {
              const custody = custodyRecords.find(
                (c) => c.assetId === asset.id && !c.dateReturned,
              );
              return (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">
                        {asset.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-blue-600 font-bold">
                          {asset.propertyNo}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300" />
                        <span className="text-[9px] text-zinc-400 font-bold">
                          <UserCheck size={8} className="inline mr-0.5" />
                          {custody?.custodianName || "—"}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300" />
                        <span className="text-[9px] text-zinc-400 font-bold">
                          {custody?.documentNo}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {custody && asset.assetClass === "Semi-Expendable" && (
                      <PermissionGate requires="property.export">
                        <Button
                          variant="ghost"
                          className="text-[8px] font-black uppercase tracking-widest"
                          onClick={() => {
                            const cat = categories.find(
                              (c) => c.id === asset.categoryId,
                            );
                            onGenerateIcsPdf(asset, custody, cat);
                          }}
                        >
                          <Printer size={10} className="mr-1" /> ICS
                        </Button>
                      </PermissionGate>
                    )}
                    <PermissionGate requires="property.transfer">
                      <Button
                        variant="ghost"
                        className="text-[8px] font-black uppercase tracking-widest text-amber-600"
                        onClick={() => onOpenTransferModal(asset)}
                      >
                        <Truck size={10} className="mr-1" /> Transfer
                      </Button>
                    </PermissionGate>
                    <PermissionGate requires="property.transfer">
                      <Button
                        variant="ghost"
                        className="text-[8px] font-black uppercase tracking-widest text-indigo-600"
                        onClick={() => onReturnAsset(asset)}
                      >
                        <RotateCcw size={10} className="mr-1" /> Return
                      </Button>
                    </PermissionGate>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center opacity-40">
            <UserCheck size={48} className="mb-4 text-zinc-300" />
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
              No issued assets
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};
