import React, { useCallback, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Briefcase,
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Card, Badge, Button, Modal, CreatableSelect } from "../components/ui";
import { useDialog } from "../DialogContext";
import { useRbac } from "../RbacContext";
import { useUsers } from "../UserContext";
import { PermissionGate } from "../components/PermissionGate";
import { useToast } from "../ToastContext";
import { EmploymentRecord, EmploymentConfig } from "../types";
import {
  buildInitialRegistryDetailValues,
  createOutgoingRegistryRecord,
  getRegistryInputTypeByField,
  normalizeRegistryDetailValue,
  readRegistryDataCollectionsFromStorage,
  readRegistryDocFieldsFromStorage,
  readRegistryDocTypesFromStorage,
  resolveOutgoingDocTypeConfig,
  type RegistrySchemaField,
  updateRegistryRecordStatus,
} from "../services/registryRecords";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { upsertAppStateFromStorageValue } from "../services/appState";
import { readStorageJson, writeStorageJson } from "../services/storage";

export const EmploymentPage: React.FC = () => {
  const { confirm } = useDialog();
  const { toast } = useToast();
  const { can } = useRbac();
  const { currentUser } = useUsers();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsSnapshot = searchParams.toString();
  const actionParam = searchParams.get("action") || "";

  const [records, setRecords] = useState<EmploymentRecord[]>(() => {
    return readStorageJson<EmploymentRecord[]>(
      STORAGE_KEYS.employmentRecords,
      [],
    );
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [generatingRecordId, setGeneratingRecordId] = useState<string | null>(
    null,
  );
  const [isOutgoingModalOpen, setIsOutgoingModalOpen] = useState(false);
  const [pendingGenerateRecord, setPendingGenerateRecord] =
    useState<EmploymentRecord | null>(null);
  const [outgoingDocumentName, setOutgoingDocumentName] =
    useState("Outgoing Document");
  const [outgoingSchemaFields, setOutgoingSchemaFields] = useState<
    RegistrySchemaField[]
  >([]);
  const [outgoingDetailValues, setOutgoingDetailValues] = useState<
    Record<string, string>
  >({});
  const [outgoingDataCollections, setOutgoingDataCollections] = useState<
    Record<string, string[]>
  >({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<EmploymentRecord | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    sex: "Female" as "Male" | "Female",
    surveyProject: "",
    designation: "",
    dateExecution: "",
    durationFrom: "",
    durationTo: "",
    focalPerson: "",
    issuanceMonth: new Date().toLocaleString("en-US", { month: "long" }),
  });

  const [configs, _setConfigs] = useState<EmploymentConfig>(() => {
    return readStorageJson<EmploymentConfig>(STORAGE_KEYS.employmentConfig, {
      prefix: "EMP",
      separator: "-",
      padding: 4,
      increment: 1,
      startNumber: 1,
    });
  });
  const [surveyProjects, setSurveyProjects] = useState<string[]>(() => {
    return readStorageJson<string[]>(STORAGE_KEYS.employmentSurveyProjects, [
      "CBMS 2024",
      "PhilSys Registration",
      "Labor Force Survey",
    ]);
  });
  const [focalPersons, setFocalPersons] = useState<string[]>(() => {
    return readStorageJson<string[]>(STORAGE_KEYS.employmentFocalPersons, [
      "Juan Dela Cruz",
      "Maria Santos",
    ]);
  });
  const [designations, setDesignations] = useState<string[]>(() => {
    return readStorageJson<string[]>(STORAGE_KEYS.employmentDesignations, [
      "Admin Clerk",
      "Statistician",
      "Field Officer",
      "Provincial Lead",
    ]);
  });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch (_e) {
      return dateStr;
    }
  };

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.employmentRecords, records);
  }, [records]);

  const persistEmploymentRecords = async (nextRecords: EmploymentRecord[]) => {
    const serialized = JSON.stringify(nextRecords);
    writeStorageJson(STORAGE_KEYS.employmentRecords, nextRecords);

    try {
      await upsertAppStateFromStorageValue(
        STORAGE_KEYS.employmentRecords,
        serialized,
      );
    } catch (error) {
      console.error("Failed to sync employment records to the backend.", error);
    }
  };

  const generateSerialNumber = () => {
    let maxNum = configs.startNumber - 1;
    records.forEach((r) => {
      const parts = r.serialNumber.split(configs.separator);
      const numPart = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    });

    const nextNumber = maxNum + configs.increment;
    return `${configs.prefix}${configs.separator}${String(nextNumber).padStart(configs.padding, "0")}`;
  };

  const buildOutgoingPrefillValues = (
    fields: RegistrySchemaField[],
    record: EmploymentRecord,
  ) => {
    const defaults = buildInitialRegistryDetailValues(fields);
    const today = new Date().toISOString().split("T")[0];

    fields.forEach((field) => {
      if (field.type === "section") return;

      const label = field.label.trim().toLowerCase();

      if (field.type === "checkbox" && !defaults[field.id]) {
        defaults[field.id] = "No";
      }

      if (defaults[field.id]) {
        return;
      }

      if (label.includes("subject")) {
        defaults[field.id] = `COE-${record.name}`;
        return;
      }

      if (/^to\b/.test(label) || label.includes("recipient")) {
        defaults[field.id] = record.name;
        return;
      }

      if (
        label.includes("employee") ||
        label.includes("personnel") ||
        label.includes("contract owner") ||
        label.includes("full name")
      ) {
        defaults[field.id] = record.name;
        return;
      }

      if (
        label.includes("serial") ||
        (label.includes("reference") && label.includes("employment"))
      ) {
        defaults[field.id] = record.serialNumber;
        return;
      }

      if (label.includes("survey") || label.includes("project")) {
        defaults[field.id] = record.surveyProject;
        return;
      }

      if (label.includes("designation") || label.includes("position")) {
        defaults[field.id] = record.designation;
        return;
      }

      if (field.type === "date" || field.type === "datetime") {
        defaults[field.id] = today;
      }
    });

    return defaults;
  };

  const deriveOutgoingRecordName = (
    record: EmploymentRecord,
    details: Record<string, string>,
  ) => {
    const subjectEntry = Object.entries(details).find(
      ([label, value]) => /subject/i.test(label) && value.trim(),
    );
    if (subjectEntry) {
      return subjectEntry[1].trim();
    }

    const toEntry = Object.entries(details).find(
      ([label, value]) =>
        /(^to$|recipient|contract owner|employee|personnel)/i.test(label) &&
        value.trim(),
    );
    if (toEntry) {
      return `COE-${toEntry[1].trim()}`;
    }

    return `COE-${record.name}`;
  };

  const closeOutgoingModal = () => {
    setIsOutgoingModalOpen(false);
    setPendingGenerateRecord(null);
    setOutgoingSchemaFields([]);
    setOutgoingDetailValues({});
    setOutgoingDataCollections({});
    setOutgoingDocumentName("Outgoing Document");
  };

  const filteredRecords = records.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.surveyProject.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openAddModal = useCallback(() => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      name: "",
      sex: "Female",
      surveyProject: surveyProjects.length > 0 ? surveyProjects[0] : "",
      designation: "",
      dateExecution: new Date().toISOString().split("T")[0],
      durationFrom: new Date().toISOString().split("T")[0],
      durationTo: new Date().toISOString().split("T")[0],
      focalPerson: focalPersons.length > 0 ? focalPersons[0] : "",
      issuanceMonth: new Date().toLocaleString("en-US", { month: "long" }),
    });
    setIsModalOpen(true);
  }, [focalPersons, surveyProjects]);

  useEffect(() => {
    if (actionParam !== "record-contract") return;
    if (!can("employment.edit")) return;

    const next = new URLSearchParams(searchParamsSnapshot);
    next.delete("action");
    setSearchParams(next, { replace: true });

    openAddModal();
  }, [actionParam, searchParamsSnapshot, setSearchParams, can, openAddModal]);

  const openEditModal = (record: EmploymentRecord) => {
    setIsEditMode(true);
    setEditingId(record.id);
    setFormData({
      name: record.name,
      sex: record.sex,
      surveyProject: record.surveyProject,
      designation: record.designation,
      dateExecution: record.dateExecution,
      durationFrom: record.durationFrom,
      durationTo: record.durationTo,
      focalPerson: record.focalPerson,
      issuanceMonth:
        record.issuanceMonth ||
        new Date().toLocaleString("en-US", { month: "long" }),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.name || !formData.surveyProject || !formData.focalPerson) {
        toast(
          "error",
          "Please fill in required fields (Name, Project, Focal Person)",
        );
        return;
      }

      // Note: CreatableSelect now handles auto-save to localStorage internally
      // but we still update the local state here so the UI reflects it immediately
      if (
        formData.designation &&
        !designations.includes(formData.designation)
      ) {
        setDesignations((prev) => [...prev, formData.designation]);
      }
      if (
        formData.surveyProject &&
        !surveyProjects.includes(formData.surveyProject)
      ) {
        setSurveyProjects((prev) => [...prev, formData.surveyProject]);
      }
      if (
        formData.focalPerson &&
        !focalPersons.includes(formData.focalPerson)
      ) {
        setFocalPersons((prev) => [...prev, formData.focalPerson]);
      }

      if (isEditMode && editingId) {
        const nextRecords = records.map((r) => {
          if (r.id === editingId) {
            return { ...r, ...formData };
          }
          return r;
        });

        setRecords(nextRecords);
        await persistEmploymentRecords(nextRecords);

        setIsModalOpen(false);
        toast("success", "Record updated successfully");
        return;
      }

      const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `emp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      const newRecord: EmploymentRecord = {
        id,
        serialNumber: generateSerialNumber(),
        createdAt: new Date().toISOString(),
        ...formData,
      };

      const nextRecords = [newRecord, ...records];

      setRecords(nextRecords);
      await persistEmploymentRecords(nextRecords);
      setLastCreated(newRecord);
      setIsModalOpen(false);
      setIsSuccessModalOpen(true);
      toast("success", `Record ${newRecord.serialNumber} created successfully`);
    } catch (error: any) {
      toast("error", error?.message || "Unable to save contract record");
    }
  };

  const deleteRecord = async (id: string, serial: string) => {
    if (
      await confirm(
        `Are you sure you want to delete employment record ${serial}?`,
      )
    ) {
      const nextRecords = records.filter((r) => r.id !== id);
      setRecords(nextRecords);
      await persistEmploymentRecords(nextRecords);
      toast("success", `Record ${serial} deleted`);
    }
  };

  const openGenerateCOEModal = (record: EmploymentRecord) => {
    if (generatingRecordId === record.id) {
      return;
    }

    const docTypes = readRegistryDocTypesFromStorage();
    const outgoingDocType = resolveOutgoingDocTypeConfig(docTypes);

    if (!outgoingDocType) {
      toast(
        "error",
        "Outgoing Document is not configured in Records settings.",
      );
      return;
    }

    const docFields = readRegistryDocFieldsFromStorage();
    const nextFields = Array.isArray(docFields[outgoingDocType.id])
      ? docFields[outgoingDocType.id]
      : [];

    setPendingGenerateRecord(record);
    setOutgoingDocumentName(outgoingDocType.name);
    setOutgoingSchemaFields(nextFields);
    setOutgoingDetailValues(buildOutgoingPrefillValues(nextFields, record));
    setOutgoingDataCollections(readRegistryDataCollectionsFromStorage());
    setIsOutgoingModalOpen(true);
  };

  const handleGeneratePDF = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pendingGenerateRecord) {
      toast("error", "No employment record selected for COE generation.");
      return;
    }

    const actorName = currentUser?.name?.trim() || "System";

    try {
      const normalizedDetails = outgoingSchemaFields
        .filter((field) => field.type !== "section")
        .reduce<Record<string, string>>((acc, field) => {
          const nextValue = normalizeRegistryDetailValue(
            field.type,
            outgoingDetailValues[field.id] || "",
          );
          if (field.required && !nextValue) {
            throw new Error(`${field.label} is required.`);
          }
          if (nextValue) {
            acc[field.label] = nextValue;
          }
          return acc;
        }, {});

      setGeneratingRecordId(pendingGenerateRecord.id);

      const outgoingRecord = await createOutgoingRegistryRecord({
        name: deriveOutgoingRecordName(
          pendingGenerateRecord,
          normalizedDetails,
        ),
        date: new Date().toISOString().split("T")[0],
        actorName,
        details: normalizedDetails,
      });

      toast(
        "info",
        `Outgoing reference ${outgoingRecord.reg} created. Generating COE...`,
      );

      const { generateCOE } = await import("../services/coeGenerator");
      await generateCOE(pendingGenerateRecord, records, outgoingRecord.reg);

      try {
        await updateRegistryRecordStatus(
          outgoingRecord.reg,
          "Completed",
          actorName,
          "COE generated and download triggered.",
        );
      } catch (statusError) {
        console.error(
          "Unable to mark outgoing registry record as completed.",
          statusError,
        );
        toast(
          "warning",
          `COE downloaded, but record ${outgoingRecord.reg} needs manual status update.`,
        );
      }

      closeOutgoingModal();
      toast(
        "success",
        `Download triggered for ${pendingGenerateRecord.name}. Reference: ${outgoingRecord.reg}`,
      );
    } catch (error: any) {
      toast("error", `Generation failed: ${error.message}`);
    } finally {
      setGeneratingRecordId(null);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Employment Records
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-[13px] font-medium mt-1 uppercase tracking-wider">
            Provincial Personnel Management
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <PermissionGate requires="employment.edit">
            <Button
              variant="blue"
              className="w-full sm:w-auto shadow-lg shadow-blue-500/20"
              onClick={openAddModal}
            >
              <Plus size={16} className="mr-2" /> Record Contract
            </Button>
          </PermissionGate>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Card
          title="Contract History"
          description="Complete records of registered personnel contracts"
          action={
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search by name, ID or project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none w-full sm:w-64 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          }
        >
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="pb-4 px-3 sm:px-0 text-[13px] font-black text-zinc-400 uppercase tracking-widest">
                    Serial No. / Date
                  </th>
                  <th className="pb-4 px-3 sm:px-0 text-[13px] font-black text-zinc-400 uppercase tracking-widest">
                    Personnel / Sex
                  </th>
                  <th className="pb-4 px-3 sm:px-0 text-[13px] font-black text-zinc-400 uppercase tracking-widest">
                    Designation
                  </th>
                  <th className="pb-4 px-3 sm:px-0 text-[13px] font-black text-zinc-400 uppercase tracking-widest">
                    Focal Person
                  </th>
                  <th className="pb-4 px-3 sm:px-0 text-[13px] font-black text-zinc-400 uppercase tracking-widest">
                    Survey / Project
                  </th>
                  <th className="pb-4 px-3 sm:px-0 text-[13px] font-black text-zinc-400 uppercase tracking-widest">
                    Duration
                  </th>
                  <th className="pb-4 px-3 sm:px-0 text-[13px] font-black text-zinc-400 uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((row) => (
                    <tr
                      key={row.id}
                      className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/40 border-b border-zinc-50 dark:border-zinc-800/50"
                    >
                      <td
                        className="py-4 px-3 sm:px-0 cursor-pointer group/reg"
                        onClick={() => openEditModal(row)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-black text-zinc-900 dark:text-white tracking-tight group-hover/reg:text-blue-600 transition-colors">
                            {row.serialNumber}
                          </span>
                          <div className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover/reg:bg-blue-50 group-hover/reg:text-blue-600 transition-all">
                            <ArrowRight size={10} />
                          </div>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight mt-1">
                          Exec: {formatDate(row.dateExecution)}
                        </div>
                      </td>
                      <td className="py-4 px-3 sm:px-0">
                        <div className="text-[13px] font-bold tracking-tight text-zinc-900 dark:text-white uppercase">
                          {row.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-medium">
                          {row.sex}
                        </div>
                      </td>
                      <td className="py-4 px-3 sm:px-0">
                        <div className="text-[12px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight">
                          {row.designation}
                        </div>
                      </td>
                      <td className="py-4 px-3 sm:px-0">
                        <div className="text-[12px] font-bold text-zinc-900 dark:text-white uppercase tracking-tight">
                          {row.focalPerson}
                        </div>
                      </td>
                      <td className="py-4 px-3 sm:px-0">
                        <Badge
                          variant="info"
                          className="!py-1 !px-2 !text-[9px] font-black uppercase tracking-tight"
                        >
                          {row.surveyProject}
                        </Badge>
                      </td>
                      <td className="py-4 px-3 sm:px-0">
                        <div className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                          {formatDate(row.durationFrom)}
                        </div>
                        <div className="text-[11px] font-bold text-zinc-400">
                          to {formatDate(row.durationTo)}
                        </div>
                      </td>
                      <td className="py-4 px-3 sm:px-0 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <PermissionGate requires="employment.export">
                            <button
                              onClick={() => openGenerateCOEModal(row)}
                              disabled={generatingRecordId === row.id}
                              className="p-2 text-zinc-400 hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Generate COE PDF"
                            >
                              {generatingRecordId === row.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Download size={14} />
                              )}
                            </button>
                          </PermissionGate>
                          <PermissionGate requires="employment.edit">
                            <button
                              onClick={() => openEditModal(row)}
                              className="p-2 text-zinc-400 hover:text-blue-500"
                              title="Edit Record"
                            >
                              <Edit2 size={14} />
                            </button>
                          </PermissionGate>
                          <PermissionGate requires="employment.delete">
                            <button
                              onClick={() =>
                                deleteRecord(row.id, row.serialNumber)
                              }
                              className="p-2 text-zinc-400 hover:text-red-500"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-zinc-500 text-xs"
                    >
                      No records found. Create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          isEditMode
            ? `Edit Contract: ${formData.serialNumber || "Record"}`
            : "Record Contract"
        }
        maxWidth="max-w-xl"
        footer={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="rounded-xl px-6"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="blue"
              type="submit"
              form="employment-contract-form"
              className="rounded-xl px-8 shadow-lg shadow-blue-500/20"
            >
              {isEditMode ? "Update Contract" : "Save Contract"}
            </Button>
          </div>
        }
      >
        <form
          id="employment-contract-form"
          className="space-y-5"
          onSubmit={handleSubmit}
        >
          {!isEditMode && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Serial Number Preview
                </label>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-black text-zinc-500 flex items-center">
                  {generateSerialNumber()}
                </div>
              </div>
              <CreatableSelect
                label="Month Selector"
                value={formData.issuanceMonth}
                onChange={(val) =>
                  setFormData({ ...formData, issuanceMonth: val })
                }
                options={months}
                placeholder="Select Month..."
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Personnel Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="e.g. John Doe"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-blue-500 font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Sex
              </label>
              <select
                value={formData.sex}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sex: e.target.value as "Male" | "Female",
                  })
                }
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-blue-500 font-bold"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CreatableSelect
              label="Survey / Project"
              value={formData.surveyProject}
              onChange={(val) =>
                setFormData({ ...formData, surveyProject: val })
              }
              options={surveyProjects}
              storageKey={STORAGE_KEYS.employmentSurveyProjects}
              placeholder="Select or type project..."
            />
            <CreatableSelect
              label="Designation"
              value={formData.designation}
              onChange={(val) => setFormData({ ...formData, designation: val })}
              options={designations}
              storageKey={STORAGE_KEYS.employmentDesignations}
              placeholder="Select or type designation..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Contract Duration From
              </label>
              <input
                type="date"
                value={formData.durationFrom}
                onChange={(e) =>
                  setFormData({ ...formData, durationFrom: e.target.value })
                }
                required
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none font-bold focus:ring-1 focus:ring-blue-500"
              />
              {formData.durationFrom && (
                <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest px-1 mt-1 animate-in fade-in slide-in-from-top-1">
                  {formatDate(formData.durationFrom)}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Contract Duration To
              </label>
              <input
                type="date"
                value={formData.durationTo}
                onChange={(e) =>
                  setFormData({ ...formData, durationTo: e.target.value })
                }
                required
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none font-bold focus:ring-1 focus:ring-blue-500"
              />
              {formData.durationTo && (
                <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest px-1 mt-1 animate-in fade-in slide-in-from-top-1">
                  {formatDate(formData.durationTo)}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Date of Execution
              </label>
              <input
                type="date"
                value={formData.dateExecution}
                onChange={(e) =>
                  setFormData({ ...formData, dateExecution: e.target.value })
                }
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none font-bold focus:ring-1 focus:ring-blue-500"
              />
              {formData.dateExecution && (
                <div className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1 mt-1">
                  {formatDate(formData.dateExecution)}
                </div>
              )}
            </div>
            <CreatableSelect
              label="Focal Person"
              value={formData.focalPerson}
              onChange={(val) => setFormData({ ...formData, focalPerson: val })}
              options={focalPersons}
              storageKey={STORAGE_KEYS.employmentFocalPersons}
              placeholder="Select or type person..."
            />
          </div>

          {!isEditMode && (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 flex gap-3 mt-4">
              <ShieldCheck size={18} className="text-blue-600 shrink-0" />
              <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
                Recording this contract will auto-generate a unique Serial
                Number based on the Employment Config in Settings.
              </p>
            </div>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={isOutgoingModalOpen}
        onClose={closeOutgoingModal}
        title={`Generate COE via ${outgoingDocumentName}`}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="rounded-xl px-6"
              onClick={closeOutgoingModal}
              disabled={generatingRecordId === pendingGenerateRecord?.id}
            >
              Cancel
            </Button>
            <Button
              variant="blue"
              type="submit"
              form="employment-outgoing-form"
              className="rounded-xl px-8 shadow-lg shadow-blue-500/20"
              disabled={generatingRecordId === pendingGenerateRecord?.id}
            >
              {generatingRecordId === pendingGenerateRecord?.id ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />{" "}
                  Generating...
                </>
              ) : (
                "Create Outgoing & Generate COE"
              )}
            </Button>
          </div>
        }
      >
        <form
          id="employment-outgoing-form"
          className="space-y-5"
          onSubmit={handleGeneratePDF}
        >
          <div className="rounded-2xl border border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 p-4 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
              Outgoing Record Details
            </p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {pendingGenerateRecord?.name || "No employee selected"}
            </p>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
              Fill the current outgoing fields from Records. This form updates
              whenever the Outgoing schema changes in Records settings.
            </p>
          </div>

          {outgoingSchemaFields.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 px-4 py-5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              No outgoing metadata fields are configured yet. The COE will still
              create an outgoing record and use the generated reference number.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {outgoingSchemaFields.map((field) => {
                if (field.type === "section") {
                  return (
                    <div key={field.id} className="sm:col-span-2 pt-1">
                      <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-300 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                        {field.label}
                      </p>
                    </div>
                  );
                }

                const value = outgoingDetailValues[field.id] || "";
                const label = `${field.label}${field.required ? " *" : ""}`;
                const placeholder =
                  field.type === "multiselect"
                    ? "Comma-separated values"
                    : `Enter ${field.label.toLowerCase()}`;
                const availableOptions = field.collectionSource
                  ? outgoingDataCollections[field.collectionSource] ||
                    field.options ||
                    []
                  : field.options || [];

                if (field.type === "textarea") {
                  return (
                    <div key={field.id} className="space-y-1.5 sm:col-span-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        {label}
                      </label>
                      <textarea
                        value={value}
                        onChange={(event) =>
                          setOutgoingDetailValues((prev) => ({
                            ...prev,
                            [field.id]: event.target.value,
                          }))
                        }
                        required={field.required}
                        placeholder={placeholder}
                        className="w-full min-h-[88px] resize-y bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  );
                }

                if (field.type === "checkbox") {
                  return (
                    <div key={field.id} className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        {label}
                      </label>
                      <select
                        value={value || "No"}
                        onChange={(event) =>
                          setOutgoingDetailValues((prev) => ({
                            ...prev,
                            [field.id]: event.target.value,
                          }))
                        }
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                      >
                        <option>Yes</option>
                        <option>No</option>
                      </select>
                    </div>
                  );
                }

                if (
                  (field.type === "select" || field.type === "prefix") &&
                  availableOptions.length > 0
                ) {
                  return (
                    <div key={field.id} className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        {label}
                      </label>
                      <select
                        value={value}
                        onChange={(event) =>
                          setOutgoingDetailValues((prev) => ({
                            ...prev,
                            [field.id]: event.target.value,
                          }))
                        }
                        required={field.required}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                      >
                        <option value="">Select {field.label}</option>
                        {availableOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                return (
                  <div
                    key={field.id}
                    className={
                      field.type === "multiselect"
                        ? "space-y-1.5 sm:col-span-2"
                        : "space-y-1.5"
                    }
                  >
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      {label}
                    </label>
                    <input
                      type={getRegistryInputTypeByField(field)}
                      value={value}
                      onChange={(event) =>
                        setOutgoingDetailValues((prev) => ({
                          ...prev,
                          [field.id]: event.target.value,
                        }))
                      }
                      required={field.required}
                      min={field.type === "rating" ? 1 : undefined}
                      max={field.type === "rating" ? 5 : undefined}
                      step={
                        field.type === "number" || field.type === "rating"
                          ? "1"
                          : undefined
                      }
                      placeholder={placeholder}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Official Contract Recorded"
        footer={
          <Button
            variant="blue"
            className="w-full rounded-2xl h-14 text-[11px] font-black uppercase tracking-[0.3em] shadow-lg shadow-blue-500/20"
            onClick={() => setIsSuccessModalOpen(false)}
          >
            Acknowledge & Complete
          </Button>
        }
      >
        <div className="flex flex-col items-center py-1">
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-emerald-500 blur-[25px] opacity-10 animate-pulse"></div>
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 relative z-10 border border-emerald-100/50 dark:border-emerald-500/20 shadow-lg">
              <Briefcase size={24} strokeWidth={2.5} />
            </div>
          </div>

          <h4 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-tighter mb-0.5">
            Contract Recorded
          </h4>
          <p className="text-[7px] text-zinc-400 font-black uppercase tracking-[0.4em] mb-4">
            Aurora Provincial Hub
          </p>

          <div className="w-full bg-white dark:bg-[#0c0c0e] border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[28px] p-4 sm:p-5 shadow-inner relative overflow-hidden group">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-2 border-dashed border-zinc-200 dark:border-zinc-800 pb-4 mb-4 gap-3">
              <div className="space-y-0.5">
                <span className="text-[7px] font-black text-zinc-400 uppercase tracking-[0.2em] block">
                  Employment Serial No.
                </span>
                <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter leading-none">
                  {lastCreated?.serialNumber}
                </span>
              </div>
            </div>

            <div className="space-y-0.5 pt-4 mb-4">
              <span className="text-[7px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                Personnel
              </span>
              <p className="text-base sm:text-lg font-black text-zinc-900 dark:text-white tracking-tight leading-tight uppercase">
                {lastCreated?.name}
              </p>
            </div>

            <div className="pt-3.5 border-t border-zinc-100 dark:border-zinc-800">
              <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                <div className="space-y-1">
                  <span className="text-[9.5px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-tight block leading-none">
                    Survey/Project
                  </span>
                  <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100 truncate leading-none">
                    {lastCreated?.surveyProject}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9.5px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-tight block leading-none">
                    Focal Person
                  </span>
                  <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100 truncate leading-none">
                    {lastCreated?.focalPerson}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 relative">
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-2 bg-white dark:bg-[#0c0c0e]">
                <CheckCircle2 size={12} className="text-emerald-500" />
              </div>
              <p className="text-[7px] italic text-zinc-400 dark:text-zinc-500 font-medium leading-relaxed text-center px-4">
                Saved in Aurora Provincial Employment database.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
