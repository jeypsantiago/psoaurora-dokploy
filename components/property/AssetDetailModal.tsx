import React from "react";
import { Modal, Button } from "../ui";
import {
  Asset,
  CustodyRecord,
  AssetTransaction,
  AssetCategory,
} from "../../pages/property/propertyTypes";
import { QRCodeLabel } from "./QRCodeLabel";
import {
  X,
  MapPin,
  Calendar,
  Hash,
  DollarSign,
  Clock,
  ArrowRight,
  UserCheck,
  Truck,
  RotateCcw,
  Trash2,
  Package,
  Shield,
  FileText,
  Tag,
  Layers,
  Printer,
  Edit2,
} from "lucide-react";

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  category?: AssetCategory;
  custodyRecords: CustodyRecord[];
  transactions: AssetTransaction[];
  onIssue?: () => void;
  onTransfer?: () => void;
  onReturn?: () => void;
  onEdit?: () => void;
  onPrintQR?: () => void;
  canIssue?: boolean;
  canTransfer?: boolean;
  canEdit?: boolean;
  canExport?: boolean;
}

const statusColors: Record<string, string> = {
  "In Stock":
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  Issued:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  Transferred:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  Returned:
    "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
  Disposed:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  Missing:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

const conditionColors: Record<string, string> = {
  Serviceable: "text-emerald-600",
  Unserviceable: "text-red-600",
  "For Repair": "text-amber-600",
  "For Disposal": "text-red-500",
};

const txnIcons: Record<string, any> = {
  acquisition: Package,
  issuance: UserCheck,
  transfer: Truck,
  return: RotateCcw,
  disposal: Trash2,
  repair: Shield,
  found: Package,
  missing: X,
  reclassification: Layers,
};

const txnColors: Record<string, string> = {
  acquisition: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
  issuance: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  transfer: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
  return: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20",
  disposal: "text-red-500 bg-red-50 dark:bg-red-900/20",
  repair: "text-orange-500 bg-orange-50 dark:bg-orange-900/20",
  found: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
  missing: "text-red-500 bg-red-50 dark:bg-red-900/20",
  reclassification: "text-purple-500 bg-purple-50 dark:bg-purple-900/20",
};

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  isOpen,
  onClose,
  asset,
  category,
  custodyRecords,
  transactions,
  onIssue,
  onTransfer,
  onReturn,
  onEdit,
  onPrintQR,
  canIssue,
  canTransfer,
  canEdit,
  canExport,
}) => {
  if (!asset) return null;

  const activeCustody = custodyRecords.find(
    (c) => c.assetId === asset.id && !c.dateReturned,
  );
  const assetTransactions = transactions
    .filter((t) => t.assetId === asset.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const assetCustody = custodyRecords
    .filter((c) => c.assetId === asset.id)
    .sort(
      (a, b) =>
        new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime(),
    );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asset Details"
      maxWidth="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex gap-2">
            {canExport && onPrintQR && (
              <Button
                variant="ghost"
                onClick={onPrintQR}
                className="text-[9px] font-black uppercase tracking-widest"
              >
                <Printer size={12} className="mr-1.5" /> Print QR
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {canEdit && onEdit && (
              <Button
                variant="ghost"
                onClick={onEdit}
                className="text-[9px] font-black uppercase tracking-widest"
              >
                <Edit2 size={12} className="mr-1.5" /> Edit
              </Button>
            )}
            {canIssue && asset.status === "In Stock" && onIssue && (
              <Button
                variant="blue"
                onClick={onIssue}
                className="text-[9px] font-black uppercase tracking-widest rounded-xl px-5 shadow-lg shadow-blue-500/20"
              >
                <UserCheck size={12} className="mr-1.5" /> Issue to Employee
              </Button>
            )}
            {canTransfer && asset.status === "Issued" && onTransfer && (
              <Button
                variant="ghost"
                onClick={onTransfer}
                className="text-[9px] font-black uppercase tracking-widest text-amber-600"
              >
                <Truck size={12} className="mr-1.5" /> Transfer
              </Button>
            )}
            {canTransfer && asset.status === "Issued" && onReturn && (
              <Button
                variant="ghost"
                onClick={onReturn}
                className="text-[9px] font-black uppercase tracking-widest text-indigo-600"
              >
                <RotateCcw size={12} className="mr-1.5" /> Return
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${statusColors[asset.status] || ""}`}
              >
                {asset.status}
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                {asset.assetClass}
              </span>
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white mt-2">
              {asset.description}
            </h3>
            <p className="text-[11px] font-bold text-blue-600 mt-1">
              {asset.propertyNo}
            </p>
            {asset.specifications && (
              <p className="text-xs text-zinc-500 mt-1">
                {asset.specifications}
              </p>
            )}
          </div>
          <QRCodeLabel
            data={asset.propertyNo}
            label={asset.propertyNo}
            size={80}
          />
        </div>

        {/* Detail Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { icon: Tag, label: "Category", value: category?.name || "—" },
            { icon: Hash, label: "Serial No.", value: asset.serialNo || "—" },
            { icon: Package, label: "Model", value: asset.modelNo || "—" },
            { icon: Calendar, label: "Acquired", value: asset.acquisitionDate },
            {
              icon: DollarSign,
              label: "Cost",
              value: `₱${asset.cost.toLocaleString()}`,
            },
            {
              icon: DollarSign,
              label: "Book Value",
              value: asset.bookValue
                ? `₱${asset.bookValue.toLocaleString()}`
                : "—",
            },
            { icon: MapPin, label: "Location", value: asset.location },
            { icon: Shield, label: "Condition", value: asset.condition },
            {
              icon: UserCheck,
              label: "Custodian",
              value: activeCustody?.custodianName || "Unassigned",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-800/50"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <item.icon size={10} className="text-zinc-400" />
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                  {item.label}
                </span>
              </div>
              <p
                className={`text-xs font-bold text-zinc-900 dark:text-white ${item.label === "Condition" ? conditionColors[item.value] || "" : ""}`}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Custody History */}
        {assetCustody.length > 0 && (
          <div>
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">
              <FileText size={10} className="inline mr-1" /> Custody History
            </h4>
            <div className="space-y-2">
              {assetCustody.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${rec.type === "ICS" ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600"}`}
                    >
                      {rec.type}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">
                        {rec.custodianName}
                      </p>
                      <p className="text-[9px] text-zinc-400 font-medium">
                        {rec.documentNo} • Issued {rec.dateIssued}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${rec.dateReturned ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"}`}
                  >
                    {rec.dateReturned
                      ? `Returned ${rec.dateReturned}`
                      : "Active"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction Timeline */}
        {assetTransactions.length > 0 && (
          <div>
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">
              <Clock size={10} className="inline mr-1" /> Transaction History
            </h4>
            <div className="space-y-2">
              {assetTransactions.map((txn) => {
                const TxnIcon = txnIcons[txn.type] || Package;
                return (
                  <div
                    key={txn.id}
                    className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-800/50"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${txnColors[txn.type] || ""}`}
                    >
                      <TxnIcon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                          {txn.type}
                        </span>
                        {txn.toName && (
                          <>
                            <ArrowRight size={10} className="text-zinc-400" />
                            <span className="text-[10px] font-bold text-blue-600">
                              {txn.toName}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-[9px] text-zinc-400 font-medium mt-0.5">
                        {txn.remarks}
                      </p>
                      <p className="text-[8px] text-zinc-400 mt-1">
                        {txn.date} • by {txn.performedByName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
