import React, { useState, useEffect } from "react";
import { Modal, Button } from "../ui";
import {
  Asset,
  AssetClass,
  AssetCondition,
  AssetStatus,
  AssetCategory,
} from "../../pages/property/propertyTypes";
import {
  Save,
  X,
  Tag,
  MapPin,
  DollarSign,
  Calendar,
  Hash,
  FileText,
  Layers,
} from "lucide-react";

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    asset: Omit<
      Asset,
      "id" | "propertyNo" | "qrCode" | "qrData" | "createdAt" | "updatedAt"
    >,
  ) => void;
  editingAsset?: Asset | null;
  categories: AssetCategory[];
}

const ASSET_CLASSES: AssetClass[] = ["PPE", "Semi-Expendable"];
const CONDITIONS: AssetCondition[] = [
  "Serviceable",
  "Unserviceable",
  "For Repair",
  "For Disposal",
];
const STATUSES: AssetStatus[] = [
  "In Stock",
  "Issued",
  "Transferred",
  "Returned",
  "Disposed",
  "Missing",
];

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAsset,
  categories,
}) => {
  const [form, setForm] = useState({
    description: "",
    specifications: "",
    serialNo: "",
    modelNo: "",
    assetClass: "PPE" as AssetClass,
    categoryId: "",
    acquisitionDate: "",
    cost: 0,
    bookValue: 0,
    location: "",
    officeId: "",
    condition: "Serviceable" as AssetCondition,
    status: "In Stock" as AssetStatus,
    custodianId: "",
    attachmentNotes: "",
  });

  useEffect(() => {
    if (editingAsset) {
      setForm({
        description: editingAsset.description,
        specifications: editingAsset.specifications || "",
        serialNo: editingAsset.serialNo || "",
        modelNo: editingAsset.modelNo || "",
        assetClass: editingAsset.assetClass,
        categoryId: editingAsset.categoryId,
        acquisitionDate: editingAsset.acquisitionDate,
        cost: editingAsset.cost,
        bookValue: editingAsset.bookValue || 0,
        location: editingAsset.location,
        officeId: editingAsset.officeId || "",
        condition: editingAsset.condition,
        status: editingAsset.status,
        custodianId: editingAsset.custodianId || "",
        attachmentNotes: editingAsset.attachmentNotes || "",
      });
    } else {
      setForm({
        description: "",
        specifications: "",
        serialNo: "",
        modelNo: "",
        assetClass: "PPE",
        categoryId: categories[0]?.id || "",
        acquisitionDate: "",
        cost: 0,
        bookValue: 0,
        location: "",
        officeId: "",
        condition: "Serviceable",
        status: "In Stock",
        custodianId: "",
        attachmentNotes: "",
      });
    }
  }, [editingAsset, isOpen, categories]);

  const filteredCategories = categories.filter(
    (c) => c.assetClass === form.assetClass,
  );

  const handleSubmit = () => {
    if (
      !form.description.trim() ||
      !form.categoryId ||
      !form.acquisitionDate ||
      !form.location.trim()
    )
      return;
    onSave(form);
    onClose();
  };

  const updateField = (field: string, value: any) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Reset category when class changes
      if (field === "assetClass") {
        const filtered = categories.filter((c) => c.assetClass === value);
        updated.categoryId = filtered[0]?.id || "";
      }
      return updated;
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingAsset ? "Edit Asset" : "Register New Asset"}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-[10px] font-black uppercase tracking-widest"
          >
            <X size={12} className="mr-2" /> Cancel
          </Button>
          <Button
            variant="blue"
            onClick={handleSubmit}
            className="text-[10px] font-black uppercase tracking-widest rounded-xl px-6 shadow-lg shadow-blue-500/20"
          >
            <Save size={12} className="mr-2" />{" "}
            {editingAsset ? "Update Asset" : "Register Asset"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Asset Class & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
              <Layers size={10} className="inline mr-1" /> Asset Class *
            </label>
            <select
              value={form.assetClass}
              onChange={(e) => updateField("assetClass", e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ASSET_CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
              <Tag size={10} className="inline mr-1" /> Category *
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => updateField("categoryId", e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
            <FileText size={10} className="inline mr-1" /> Description / Item
            Name *
          </label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="e.g., Desktop Computer (Core i5, 16GB RAM)"
            className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Specifications */}
        <div>
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
            Specifications
          </label>
          <textarea
            value={form.specifications}
            onChange={(e) => updateField("specifications", e.target.value)}
            placeholder="Detailed specs..."
            rows={2}
            className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Serial / Model */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
              <Hash size={10} className="inline mr-1" /> Serial Number
            </label>
            <input
              type="text"
              value={form.serialNo}
              onChange={(e) => updateField("serialNo", e.target.value)}
              placeholder="e.g., DC-2025-4891"
              className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
              Model Number
            </label>
            <input
              type="text"
              value={form.modelNo}
              onChange={(e) => updateField("modelNo", e.target.value)}
              placeholder="e.g., Dell OptiPlex 7010"
              className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Date / Cost / Book Value */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
              <Calendar size={10} className="inline mr-1" /> Acquisition Date *
            </label>
            <input
              type="date"
              value={form.acquisitionDate}
              onChange={(e) => updateField("acquisitionDate", e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
              <DollarSign size={10} className="inline mr-1" /> Cost (₱) *
            </label>
            <input
              type="number"
              value={form.cost || ""}
              onChange={(e) =>
                updateField("cost", parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
              min={0}
              step={0.01}
              className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
              Book Value (₱)
            </label>
            <input
              type="number"
              value={form.bookValue || ""}
              onChange={(e) =>
                updateField("bookValue", parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
              min={0}
              step={0.01}
              className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
            <MapPin size={10} className="inline mr-1" /> Location *
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
            placeholder="e.g., RSSO V — Admin Office"
            className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Condition & Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
              Condition
            </label>
            <select
              value={form.condition}
              onChange={(e) => updateField("condition", e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
            Attachment / IAR Notes
          </label>
          <input
            type="text"
            value={form.attachmentNotes}
            onChange={(e) => updateField("attachmentNotes", e.target.value)}
            placeholder="e.g., IAR No. 2025-0045"
            className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </Modal>
  );
};
