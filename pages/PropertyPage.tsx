import React, {
  Suspense,
  lazy,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  Database,
  UserCheck,
  ClipboardList,
  Shield,
  FileSpreadsheet,
  Truck,
} from "lucide-react";
import { Card, Button, Modal } from "../components/ui";
import { PermissionGate } from "../components/PermissionGate";
import { useRbac } from "../RbacContext";
import { useUsers } from "../UserContext";
import { useDialog } from "../DialogContext";
import { useToast } from "../ToastContext";
import { STORAGE_KEYS } from "../constants/storageKeys";
import {
  readStorageJson,
  readStorageString,
  setStorageItem,
  writeStorageJson,
} from "../services/storage";

import {
  Asset,
  AssetCategory,
  CustodyRecord,
  AssetTransaction,
  InventoryEvent,
  InventoryCountLine,
  AuditLogEntry,
  AssetClass,
  AssetCondition,
  AssetStatus,
  DiscrepancyType,
  PropertyStats,
} from "./property/propertyTypes";

import {
  DEFAULT_CATEGORIES,
  DEFAULT_ASSETS,
  DEFAULT_CUSTODY_RECORDS,
  DEFAULT_TRANSACTIONS,
  DEFAULT_EVENTS,
  DEFAULT_AUDIT_LOG,
} from "../services/propertyData";

import { generateQRDataUrl } from "../components/property/QRCodeLabel";
import { PropertyPageHeader } from "../components/property/PropertyPageHeader";
import { PropertyStatsRow } from "../components/property/PropertyStatsRow";
import { PropertyRegistryToolbar } from "../components/property/PropertyRegistryToolbar";

const loadAssetFormModal = () =>
  import("../components/property/AssetFormModal").then((module) => ({
    default: module.AssetFormModal,
  }));
const loadAssetDetailModal = () =>
  import("../components/property/AssetDetailModal").then((module) => ({
    default: module.AssetDetailModal,
  }));
const loadInventoryCountPanel = () =>
  import("../components/property/InventoryCountPanel").then((module) => ({
    default: module.InventoryCountPanel,
  }));
const loadDiscrepancyReport = () =>
  import("../components/property/DiscrepancyReport").then((module) => ({
    default: module.DiscrepancyReport,
  }));
const loadPropertyCustodySection = () =>
  import("../components/property/PropertyCustodySection").then((module) => ({
    default: module.PropertyCustodySection,
  }));
const loadPropertyRegistrySection = () =>
  import("../components/property/PropertyRegistrySection").then((module) => ({
    default: module.PropertyRegistrySection,
  }));

const AssetFormModal = lazy(loadAssetFormModal);
const AssetDetailModal = lazy(loadAssetDetailModal);
const InventoryCountPanel = lazy(loadInventoryCountPanel);
const DiscrepancyReport = lazy(loadDiscrepancyReport);
const PropertyCustodySection = lazy(loadPropertyCustodySection);
const PropertyRegistrySection = lazy(loadPropertyRegistrySection);

const PROPERTY_TAB_PREFETCHERS: Record<string, () => void> = {
  registry: () => void loadPropertyRegistrySection(),
  custody: () => void loadPropertyCustodySection(),
  inventory: () => void loadInventoryCountPanel(),
  audit: () => void loadDiscrepancyReport(),
  modals: () => {
    void loadAssetFormModal();
    void loadAssetDetailModal();
  },
};

const PropertySectionFallback: React.FC<{ label: string }> = ({ label }) => (
  <Card>
    <div className="min-h-[240px] flex items-center justify-center">
      <div className="inline-flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-[12px] font-semibold text-zinc-500 dark:text-zinc-300 shadow-sm">
        <span className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        Loading {label}...
      </div>
    </div>
  </Card>
);

// ============================================================
// Property Page - PSA Property & Asset Monitoring System
// ============================================================

export const PropertyPage: React.FC = () => {
  const { currentUser, users } = useUsers();
  const { confirm } = useDialog();
  const { toast } = useToast();
  const { can } = useRbac();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsSnapshot = searchParams.toString();
  const tabParam = searchParams.get("tab") || "";
  const actionParam = searchParams.get("action") || "";

  // -- Tab State --
  const [activeTab, setActiveTab] = useState("registry");
  const propertyPrefetchStartedRef = useRef(false);
  const [registryViewMode, setRegistryViewMode] = useState<"list" | "grid">(
    () =>
      (readStorageString(STORAGE_KEYS.propertyRegistryView) as
        | "list"
        | "grid") || "grid",
  );

  // -- Data State (localStorage backed) --
  const [categories, _setCategories] = useState<AssetCategory[]>(() => {
    return readStorageJson<AssetCategory[]>(
      STORAGE_KEYS.propertyCategories,
      DEFAULT_CATEGORIES,
    );
  });

  const [assets, setAssets] = useState<Asset[]>(() => {
    return readStorageJson<Asset[]>(
      STORAGE_KEYS.propertyAssets,
      DEFAULT_ASSETS,
    );
  });

  const [custodyRecords, setCustodyRecords] = useState<CustodyRecord[]>(() => {
    return readStorageJson<CustodyRecord[]>(
      STORAGE_KEYS.propertyCustody,
      DEFAULT_CUSTODY_RECORDS,
    );
  });

  const [transactions, setTransactions] = useState<AssetTransaction[]>(() => {
    return readStorageJson<AssetTransaction[]>(
      STORAGE_KEYS.propertyTransactions,
      DEFAULT_TRANSACTIONS,
    );
  });

  const [inventoryEvents, setInventoryEvents] = useState<InventoryEvent[]>(
    () => {
      return readStorageJson<InventoryEvent[]>(
        STORAGE_KEYS.propertyEvents,
        DEFAULT_EVENTS,
      );
    },
  );

  const [countLines, setCountLines] = useState<InventoryCountLine[]>(() => {
    return readStorageJson<InventoryCountLine[]>(
      STORAGE_KEYS.propertyCountLines,
      [],
    );
  });

  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(() => {
    return readStorageJson<AuditLogEntry[]>(
      STORAGE_KEYS.propertyAuditLog,
      DEFAULT_AUDIT_LOG,
    );
  });

  // -- Persist to localStorage --
  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.propertyCategories, categories);
  }, [categories]);
  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.propertyAssets, assets);
  }, [assets]);
  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.propertyCustody, custodyRecords);
  }, [custodyRecords]);
  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.propertyTransactions, transactions);
  }, [transactions]);
  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.propertyEvents, inventoryEvents);
  }, [inventoryEvents]);
  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.propertyCountLines, countLines);
  }, [countLines]);
  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.propertyAuditLog, auditLog);
  }, [auditLog]);
  useEffect(() => {
    setStorageItem(STORAGE_KEYS.propertyRegistryView, registryViewMode);
  }, [registryViewMode]);

  // -- Search & Filter State --
  const [registrySearch, setRegistrySearch] = useState("");
  const [classFilter, setClassFilter] = useState<AssetClass | "All">("All");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "All">("All");

  // -- Modal State --
  const [isAssetFormOpen, setIsAssetFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [issueTargetUserId, setIssueTargetUserId] = useState("");
  const [transferTargetUserId, setTransferTargetUserId] = useState("");

  // -- Property Config from Settings --
  const propertyConfig = useMemo(() => {
    return readStorageJson(STORAGE_KEYS.propertyConfig, {
      ppePrefix: "PSA-PPE",
      sePrefix: "PSA-SE",
      icsPrefix: "ICS",
      parPrefix: "PAR",
      separator: "-",
      padding: 4,
      increment: 1,
      startNumber: 1,
      includeYear: true,
      entityName: "Philippine Statistics Authority",
      custodySeparator: "-",
      custodyPadding: 3,
      custodyStartNumber: 1,
      custodyIncludeYear: true,
      locations: [],
      auditSchedule: "Semi-Annual (Every 6 months)",
    });
  }, []);

  // -- Audit Log Helper --
  const addAuditEntry = (
    action: string,
    entityType: AuditLogEntry["entityType"],
    entityId: string,
    details: string,
  ) => {
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || "system",
      userName: currentUser?.name || "System",
      action,
      entityType,
      entityId,
      details,
    };
    setAuditLog((prev) => [entry, ...prev]);
  };

  // -- Property Number Generator (reads config) --
  const generatePropertyNo = (assetClass: AssetClass): string => {
    const prefix =
      assetClass === "PPE" ? propertyConfig.ppePrefix : propertyConfig.sePrefix;
    const sep = propertyConfig.separator;
    const year = new Date().getFullYear();
    const yearPart = propertyConfig.includeYear ? `${year}${sep}` : "";
    const existing = assets.filter((a) =>
      a.propertyNo.startsWith(`${prefix}${sep}${yearPart}`),
    );
    const nextNum = existing.length + propertyConfig.startNumber;
    return `${prefix}${sep}${yearPart}${String(nextNum).padStart(propertyConfig.padding, "0")}`;
  };

  // -- CRUD Handlers --
  const handleSaveAsset = async (
    data: Omit<
      Asset,
      "id" | "propertyNo" | "qrCode" | "qrData" | "createdAt" | "updatedAt"
    >,
  ) => {
    const now = new Date().toISOString();
    if (editingAsset) {
      const updated = { ...editingAsset, ...data, updatedAt: now };
      setAssets((prev) =>
        prev.map((a) => (a.id === editingAsset.id ? updated : a)),
      );
      addAuditEntry(
        "Asset Updated",
        "asset",
        editingAsset.id,
        `Updated ${updated.description} (${updated.propertyNo})`,
      );
      toast("success", "Asset updated successfully");
    } else {
      const propertyNo = generatePropertyNo(data.assetClass);
      const qrCode = await generateQRDataUrl(propertyNo);
      const newAsset: Asset = {
        ...data,
        id: `asset-${Date.now()}`,
        propertyNo,
        qrCode,
        qrData: propertyNo,
        createdAt: now,
        updatedAt: now,
      };
      setAssets((prev) => [...prev, newAsset]);
      addAuditEntry(
        "Asset Registered",
        "asset",
        newAsset.id,
        `Registered ${newAsset.description} (${propertyNo})`,
      );

      // Auto-create acquisition transaction
      const txn: AssetTransaction = {
        id: `txn-${Date.now()}`,
        assetId: newAsset.id,
        type: "acquisition",
        performedBy: currentUser?.id || "",
        performedByName: currentUser?.name || "",
        date: data.acquisitionDate,
        remarks: `Registered via Property Module`,
      };
      setTransactions((prev) => [...prev, txn]);
      toast("success", `Asset registered: ${propertyNo}`);
    }
    setEditingAsset(null);
    setIsAssetFormOpen(false);
  };

  // -- Issuance Handler (reads config for doc prefix) --
  const handleIssueAsset = async () => {
    if (!selectedAsset || !issueTargetUserId) return;
    const targetUser = users.find((u) => u.id === issueTargetUserId);
    if (!targetUser) return;

    const docType =
      selectedAsset.assetClass === "Semi-Expendable" ? "ICS" : "PAR";
    const docPrefix =
      selectedAsset.assetClass === "Semi-Expendable"
        ? propertyConfig.icsPrefix
        : propertyConfig.parPrefix;
    const cSep = propertyConfig.custodySeparator || "-";
    const cPad = propertyConfig.custodyPadding || 3;
    const cStart = propertyConfig.custodyStartNumber || 1;
    const cYear = propertyConfig.custodyIncludeYear !== false;
    const existingDocs = custodyRecords.filter((c) => c.type === docType);
    const nextDocNum = existingDocs.length + cStart;
    const docNo = `${docPrefix}${cSep}${cYear ? `${new Date().getFullYear()}${cSep}` : ""}${String(nextDocNum).padStart(cPad, "0")}`;

    // Update asset
    const updatedAsset = {
      ...selectedAsset,
      status: "Issued" as AssetStatus,
      custodianId: issueTargetUserId,
      updatedAt: new Date().toISOString(),
    };
    setAssets((prev) =>
      prev.map((a) => (a.id === selectedAsset.id ? updatedAsset : a)),
    );

    // Create custody record
    const custody: CustodyRecord = {
      id: `cust-${Date.now()}`,
      assetId: selectedAsset.id,
      custodianId: issueTargetUserId,
      custodianName: targetUser.name,
      type: docType as any,
      documentNo: docNo,
      dateIssued: new Date().toISOString().split("T")[0],
      acknowledgedAt: new Date().toISOString(),
    };
    setCustodyRecords((prev) => [...prev, custody]);

    // Transaction
    const txn: AssetTransaction = {
      id: `txn-${Date.now()}`,
      assetId: selectedAsset.id,
      type: "issuance",
      performedBy: currentUser?.id || "",
      performedByName: currentUser?.name || "",
      toId: issueTargetUserId,
      toName: targetUser.name,
      date: new Date().toISOString().split("T")[0],
      remarks: `${docNo} issued`,
    };
    setTransactions((prev) => [...prev, txn]);
    addAuditEntry(
      `${docType} Issued`,
      "custody",
      custody.id,
      `Issued ${selectedAsset.propertyNo} to ${targetUser.name} via ${docNo}`,
    );

    toast("success", `Asset issued to ${targetUser.name} (${docNo})`);
    setIsIssueModalOpen(false);
    setIsDetailOpen(false);
    setSelectedAsset(null);
    setIssueTargetUserId("");
  };

  // -- Transfer Handler --
  const handleTransferAsset = async () => {
    if (!selectedAsset || !transferTargetUserId) return;
    const targetUser = users.find((u) => u.id === transferTargetUserId);
    if (!targetUser) return;

    const oldCustodian = custodyRecords.find(
      (c) => c.assetId === selectedAsset.id && !c.dateReturned,
    );

    // Close old custody
    if (oldCustodian) {
      setCustodyRecords((prev) =>
        prev.map((c) =>
          c.id === oldCustodian.id
            ? { ...c, dateReturned: new Date().toISOString().split("T")[0] }
            : c,
        ),
      );
    }

    // Update asset
    setAssets((prev) =>
      prev.map((a) =>
        a.id === selectedAsset.id
          ? {
              ...a,
              custodianId: transferTargetUserId,
              status: "Issued" as AssetStatus,
              updatedAt: new Date().toISOString(),
            }
          : a,
      ),
    );

    // New custody
    const docType =
      selectedAsset.assetClass === "Semi-Expendable" ? "ICS" : "PAR";
    const docPrefix =
      selectedAsset.assetClass === "Semi-Expendable"
        ? propertyConfig.icsPrefix
        : propertyConfig.parPrefix;
    const cSep = propertyConfig.custodySeparator || "-";
    const cPad = propertyConfig.custodyPadding || 3;
    const cStart = propertyConfig.custodyStartNumber || 1;
    const cYear = propertyConfig.custodyIncludeYear !== false;
    const existingDocs = custodyRecords.filter((c) => c.type === docType);
    const nextDocNum = existingDocs.length + cStart;
    const docNo = `${docPrefix}${cSep}${cYear ? `${new Date().getFullYear()}${cSep}` : ""}${String(nextDocNum).padStart(cPad, "0")}`;

    const newCustody: CustodyRecord = {
      id: `cust-${Date.now()}`,
      assetId: selectedAsset.id,
      custodianId: transferTargetUserId,
      custodianName: targetUser.name,
      type: docType as any,
      documentNo: docNo,
      dateIssued: new Date().toISOString().split("T")[0],
      acknowledgedAt: new Date().toISOString(),
    };
    setCustodyRecords((prev) => [...prev, newCustody]);

    // Transaction
    const txn: AssetTransaction = {
      id: `txn-${Date.now()}`,
      assetId: selectedAsset.id,
      type: "transfer",
      performedBy: currentUser?.id || "",
      performedByName: currentUser?.name || "",
      fromId: oldCustodian?.custodianId,
      fromName: oldCustodian?.custodianName,
      toId: transferTargetUserId,
      toName: targetUser.name,
      date: new Date().toISOString().split("T")[0],
      remarks: `Transferred via ${docNo}`,
    };
    setTransactions((prev) => [...prev, txn]);
    addAuditEntry(
      "Asset Transferred",
      "transaction",
      txn.id,
      `Transferred ${selectedAsset.propertyNo} from ${oldCustodian?.custodianName || "N/A"} to ${targetUser.name}`,
    );

    toast("success", `Asset transferred to ${targetUser.name}`);
    setIsTransferModalOpen(false);
    setIsDetailOpen(false);
    setSelectedAsset(null);
    setTransferTargetUserId("");
  };

  // -- Return Handler --
  const handleReturnAsset = async (asset?: Asset) => {
    const targetAsset = asset ?? selectedAsset;
    if (!targetAsset) return;
    const ok = await confirm(`Return ${targetAsset.propertyNo} to stock?`);
    if (!ok) return;

    const oldCustody = custodyRecords.find(
      (c) => c.assetId === targetAsset.id && !c.dateReturned,
    );
    if (oldCustody) {
      setCustodyRecords((prev) =>
        prev.map((c) =>
          c.id === oldCustody.id
            ? { ...c, dateReturned: new Date().toISOString().split("T")[0] }
            : c,
        ),
      );
    }

    setAssets((prev) =>
      prev.map((a) =>
        a.id === targetAsset.id
          ? {
              ...a,
              status: "In Stock" as AssetStatus,
              custodianId: undefined,
              updatedAt: new Date().toISOString(),
            }
          : a,
      ),
    );

    const txn: AssetTransaction = {
      id: `txn-${Date.now()}`,
      assetId: targetAsset.id,
      type: "return",
      performedBy: currentUser?.id || "",
      performedByName: currentUser?.name || "",
      fromId: oldCustody?.custodianId,
      fromName: oldCustody?.custodianName,
      date: new Date().toISOString().split("T")[0],
      remarks: "Returned to stock",
    };
    setTransactions((prev) => [...prev, txn]);
    addAuditEntry(
      "Asset Returned",
      "transaction",
      txn.id,
      `${targetAsset.propertyNo} returned by ${oldCustody?.custodianName || "N/A"}`,
    );

    toast("success", "Asset returned to stock");
    setIsDetailOpen(false);
    if (!asset) {
      setSelectedAsset(null);
    }
  };

  // -- Inventory Event Handlers --
  const handleCreateEvent = (title: string, asOfDate: string) => {
    const newEvent: InventoryEvent = {
      id: `evt-${Date.now()}`,
      title,
      asOfDate,
      status: "draft",
      createdBy: currentUser?.id || "",
      createdByName: currentUser?.name || "",
      createdAt: new Date().toISOString(),
      totalExpected: assets.length,
      totalScanned: 0,
      totalDiscrepancies: 0,
    };
    setInventoryEvents((prev) => [...prev, newEvent]);

    // Generate count lines from current assets
    const lines: InventoryCountLine[] = assets.map((asset) => ({
      id: `cl-${Date.now()}-${asset.id}`,
      eventId: newEvent.id,
      assetId: asset.id,
      propertyNo: asset.propertyNo,
      assetDescription: asset.description,
      expectedLocation: asset.location,
      expectedCustodian: asset.custodianId,
      scanned: false,
    }));
    setCountLines((prev) => [...prev, ...lines]);
    addAuditEntry(
      "Inventory Event Created",
      "inventory",
      newEvent.id,
      `Created "${title}" (as of ${asOfDate}) with ${assets.length} items`,
    );
    toast("success", `Inventory event created: ${title}`);
  };

  const handleStartEvent = (eventId: string) => {
    setInventoryEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, status: "in-progress" } : e)),
    );
    addAuditEntry(
      "Inventory Started",
      "inventory",
      eventId,
      "Physical count started",
    );
    toast("info", "Inventory count started");
  };

  const handleCompleteEvent = (eventId: string) => {
    const eventCountLines = countLines.filter((l) => l.eventId === eventId);
    const discrepancies = eventCountLines.filter(
      (l) => l.discrepancyType,
    ).length;
    setInventoryEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              status: "completed",
              completedAt: new Date().toISOString(),
              totalScanned: eventCountLines.filter((l) => l.scanned).length,
              totalDiscrepancies: discrepancies,
            }
          : e,
      ),
    );
    addAuditEntry(
      "Inventory Completed",
      "inventory",
      eventId,
      `Count completed. ${discrepancies} discrepancies found.`,
    );
    toast("success", "Inventory count completed");
  };

  const handleScanItem = (
    eventId: string,
    assetId: string,
    foundLoc: string,
    condition: string,
    discType?: DiscrepancyType,
    notes?: string,
  ) => {
    setCountLines((prev) =>
      prev.map((l) =>
        l.eventId === eventId && l.assetId === assetId
          ? {
              ...l,
              scanned: true,
              foundLocation: foundLoc,
              foundCondition: condition as AssetCondition,
              discrepancyType: discType,
              discrepancyNotes: notes,
              scannedAt: new Date().toISOString(),
              scannedBy: currentUser?.name,
            }
          : l,
      ),
    );
    // Update event stats
    const updated = countLines.map((l) =>
      l.eventId === eventId && l.assetId === assetId
        ? { ...l, scanned: true }
        : l,
    );
    const eventLines = updated.filter((l) => l.eventId === eventId);
    setInventoryEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, totalScanned: eventLines.filter((l) => l.scanned).length }
          : e,
      ),
    );
  };

  const handleMarkMissing = (eventId: string, assetId: string) => {
    handleScanItem(
      eventId,
      assetId,
      "",
      "",
      "missing",
      "Item not found during physical count",
    );
    const asset = assets.find((a) => a.id === assetId);
    if (asset) {
      addAuditEntry(
        "Item Marked Missing",
        "inventory",
        eventId,
        `${asset.propertyNo} marked as missing during count`,
      );
    }
  };

  // -- Filtered/Computed Data --
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchSearch =
        a.description.toLowerCase().includes(registrySearch.toLowerCase()) ||
        a.propertyNo.toLowerCase().includes(registrySearch.toLowerCase()) ||
        (a.serialNo || "").toLowerCase().includes(registrySearch.toLowerCase());
      const matchClass = classFilter === "All" || a.assetClass === classFilter;
      const matchStatus = statusFilter === "All" || a.status === statusFilter;
      return matchSearch && matchClass && matchStatus;
    });
  }, [assets, registrySearch, classFilter, statusFilter]);

  const stats: PropertyStats = useMemo(
    () => ({
      totalAssets: assets.length,
      totalPPE: assets.filter((a) => a.assetClass === "PPE").length,
      totalSemiExpendable: assets.filter(
        (a) => a.assetClass === "Semi-Expendable",
      ).length,
      issuedAssets: assets.filter((a) => a.status === "Issued").length,
      inStockAssets: assets.filter((a) => a.status === "In Stock").length,
      missingAssets: assets.filter((a) => a.status === "Missing").length,
      totalValue: assets.reduce((sum, a) => sum + a.cost, 0),
      activeEvents: inventoryEvents.filter((e) => e.status === "in-progress")
        .length,
    }),
    [assets, inventoryEvents],
  );

  // -- Tab definitions --
  const tabs = useMemo(() => {
    const allTabs = [
      {
        id: "registry",
        label: "Asset Registry",
        icon: Database,
        permission: "property.view" as const,
      },
      {
        id: "custody",
        label: "Issuance & Custody",
        icon: UserCheck,
        permission: "property.issue" as const,
      },
      {
        id: "inventory",
        label: "Inventory Count",
        icon: ClipboardList,
        permission: "property.count" as const,
      },
      {
        id: "audit",
        label: "Audit Trail",
        icon: Shield,
        permission: "property.audit" as const,
      },
    ];
    return allTabs.filter((tab) => can(tab.permission));
  }, [can]);

  useEffect(() => {
    if (!tabs.find((t) => t.id === activeTab) && tabs.length > 0)
      setActiveTab(tabs[0].id);
  }, [tabs, activeTab]);

  useEffect(() => {
    if (!tabParam) return;
    if (tabParam === activeTab) return;
    if (!tabs.find((tab) => tab.id === tabParam)) return;
    setActiveTab(tabParam);
  }, [tabParam, tabs, activeTab]);

  useEffect(() => {
    if (propertyPrefetchStartedRef.current) return;
    propertyPrefetchStartedRef.current = true;

    const prefetchAllTabs = () => {
      PROPERTY_TAB_PREFETCHERS.registry();
      PROPERTY_TAB_PREFETCHERS.custody();
      PROPERTY_TAB_PREFETCHERS.inventory();
      PROPERTY_TAB_PREFETCHERS.audit();
      PROPERTY_TAB_PREFETCHERS.modals();
    };

    const browserWindow = window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout?: number },
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof browserWindow.requestIdleCallback === "function") {
      const idleId = browserWindow.requestIdleCallback(prefetchAllTabs, {
        timeout: 2000,
      });

      return () => {
        browserWindow.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = window.setTimeout(prefetchAllTabs, 1800);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleTabChange = useCallback(
    (nextTab: string) => {
      setActiveTab(nextTab);

      const next = new URLSearchParams(searchParamsSnapshot);
      next.set("tab", nextTab);
      if (next.toString() === searchParamsSnapshot) return;

      setSearchParams(next, { replace: true });
    },
    [searchParamsSnapshot, setSearchParams],
  );

  const prefetchPropertyTab = useCallback((tabId: string) => {
    if (tabId === "modals") {
      PROPERTY_TAB_PREFETCHERS.modals();
      return;
    }

    PROPERTY_TAB_PREFETCHERS[tabId]?.();
  }, []);

  useEffect(() => {
    if (actionParam !== "register-asset") return;
    if (!can("property.register")) return;

    const next = new URLSearchParams(searchParamsSnapshot);
    next.delete("action");
    setSearchParams(next, { replace: true });

    setEditingAsset(null);
    setIsAssetFormOpen(true);
  }, [actionParam, searchParamsSnapshot, setSearchParams, can]);

  // -- Issuance tab data --
  const issuedAssets = useMemo(
    () => assets.filter((a) => a.status === "Issued"),
    [assets],
  );
  const inStockAssets = useMemo(
    () => assets.filter((a) => a.status === "In Stock"),
    [assets],
  );

  const handleExportAssetRegistry = useCallback(async () => {
    const { exportAssetRegistryPdf } =
      await import("../services/propertyExportService");
    exportAssetRegistryPdf(assets, categories);
  }, [assets, categories]);

  const handleGenerateIcsPdf = useCallback(
    async (asset: Asset, custody: CustodyRecord, category?: AssetCategory) => {
      const { generateICSPdf } =
        await import("../components/property/ICSDocument");
      generateICSPdf(asset, custody, category);
    },
    [],
  );

  const handleExportInventoryCount = useCallback(
    async (event: InventoryEvent) => {
      const { exportInventoryCountPdf } =
        await import("../services/propertyExportService");
      exportInventoryCountPdf(
        event,
        countLines.filter((line) => line.eventId === event.id),
      );
    },
    [countLines],
  );

  const handleExportAuditTrail = useCallback(async () => {
    const { exportAuditTrailPdf } =
      await import("../services/propertyExportService");
    exportAuditTrailPdf(auditLog);
  }, [auditLog]);

  return (
    <div className="space-y-8 pb-10">
      <PropertyPageHeader
        activeTab={activeTab}
        tabs={tabs}
        onTabChange={handleTabChange}
        onTabHover={prefetchPropertyTab}
        onTabFocus={prefetchPropertyTab}
      />

      {/* ===================== ASSET REGISTRY TAB ===================== */}
      {activeTab === "registry" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
          <PropertyStatsRow stats={stats} />
          <PropertyRegistryToolbar
            registrySearch={registrySearch}
            setRegistrySearch={setRegistrySearch}
            classFilter={classFilter}
            setClassFilter={setClassFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            registryViewMode={registryViewMode}
            setRegistryViewMode={setRegistryViewMode}
            onRegisterAsset={() => {
              setEditingAsset(null);
              setIsAssetFormOpen(true);
            }}
            onExportAssetRegistry={() => void handleExportAssetRegistry()}
          />

          <Suspense fallback={<PropertySectionFallback label="asset registry" />}>
            <PropertyRegistrySection
              filteredAssets={filteredAssets}
              categories={categories}
              custodyRecords={custodyRecords}
              registryViewMode={registryViewMode}
              onOpenAsset={(asset) => {
                setSelectedAsset(asset);
                setIsDetailOpen(true);
              }}
            />
          </Suspense>
        </div>
      )}

      {/* ===================== ISSUANCE & CUSTODY TAB ===================== */}
      {activeTab === "custody" && (
        <Suspense fallback={<PropertySectionFallback label="custody management" />}>
          <PropertyCustodySection
            inStockAssets={inStockAssets}
            issuedAssets={issuedAssets}
            categories={categories}
            custodyRecords={custodyRecords}
            onOpenIssueModal={(asset) => {
              setSelectedAsset(asset);
              setIsIssueModalOpen(true);
            }}
            onOpenTransferModal={(asset) => {
              setSelectedAsset(asset);
              setIsTransferModalOpen(true);
            }}
            onReturnAsset={handleReturnAsset}
            onGenerateIcsPdf={(asset, custody, category) => {
              void handleGenerateIcsPdf(asset, custody, category);
            }}
          />
        </Suspense>
      )}

      {/* ===================== INVENTORY COUNT TAB ===================== */}
      {activeTab === "inventory" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Suspense fallback={<PropertySectionFallback label="inventory count" />}>
            <InventoryCountPanel
              events={inventoryEvents}
              countLines={countLines}
              assets={assets}
              onCreateEvent={handleCreateEvent}
              onStartEvent={handleStartEvent}
              onCompleteEvent={handleCompleteEvent}
              onScanItem={handleScanItem}
              onMarkMissing={handleMarkMissing}
              canCount={can("property.count")}
            />
          </Suspense>
          {/* Discrepancy Report for completed events */}
          {inventoryEvents
            .filter((e) => e.status === "completed")
            .map((event) => (
              <div key={event.id} className="mt-8">
                <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-4">
                  Report: {event.title}
                </h3>
                <Suspense
                  fallback={<PropertySectionFallback label="discrepancy report" />}
                >
                  <DiscrepancyReport
                    event={event}
                    countLines={countLines.filter((l) => l.eventId === event.id)}
                    onExport={() => void handleExportInventoryCount(event)}
                    canExport={can("property.export")}
                  />
                </Suspense>
              </div>
            ))}
        </div>
      )}

      {/* ===================== AUDIT TRAIL TAB ===================== */}
      {activeTab === "audit" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                Audit Trail
              </h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                Immutable log of all property transactions
              </p>
            </div>
            <PermissionGate requires="property.export">
              <Button
                variant="ghost"
                onClick={() => void handleExportAuditTrail()}
                className="text-[9px] font-black uppercase tracking-widest"
              >
                <FileSpreadsheet size={12} className="mr-1.5" /> Export
              </Button>
            </PermissionGate>
          </div>
          <Card>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {auditLog.length > 0 ? (
                auditLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-800/50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                      <Shield size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                          {entry.action}
                        </span>
                        <span className="text-[8px] font-bold text-zinc-400 uppercase bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                          {entry.entityType}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                        {entry.details}
                      </p>
                      <p className="text-[8px] text-zinc-400 mt-1">
                        {new Date(entry.timestamp).toLocaleString()} - by{" "}
                        {entry.userName}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 flex flex-col items-center opacity-40">
                  <Shield size={48} className="mb-4 text-zinc-300" />
                  <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
                    No audit entries
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ===================== MODALS ===================== */}
      {/* Asset Form Modal */}
      <Suspense fallback={null}>
        <AssetFormModal
          isOpen={isAssetFormOpen}
          onClose={() => {
            setIsAssetFormOpen(false);
            setEditingAsset(null);
          }}
          onSave={handleSaveAsset}
          editingAsset={editingAsset}
          categories={categories}
        />
      </Suspense>

      {/* Asset Detail Modal */}
      <Suspense fallback={null}>
        <AssetDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedAsset(null);
          }}
          asset={selectedAsset}
          category={
            selectedAsset
              ? categories.find((c) => c.id === selectedAsset.categoryId)
              : undefined
          }
          custodyRecords={custodyRecords}
          transactions={transactions}
          onIssue={() => {
            setIsDetailOpen(false);
            setIsIssueModalOpen(true);
          }}
          onTransfer={() => {
            setIsDetailOpen(false);
            setIsTransferModalOpen(true);
          }}
          onReturn={handleReturnAsset}
          onEdit={() => {
            setIsDetailOpen(false);
            setEditingAsset(selectedAsset);
            setIsAssetFormOpen(true);
          }}
          canIssue={can("property.issue")}
          canTransfer={can("property.transfer")}
          canEdit={can("property.edit")}
          canExport={can("property.export")}
        />
      </Suspense>

      {/* Issue Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => {
          setIsIssueModalOpen(false);
          setIssueTargetUserId("");
        }}
        title="Issue Asset to Employee"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsIssueModalOpen(false)}
              className="text-[10px] font-black uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button
              variant="blue"
              onClick={handleIssueAsset}
              disabled={!issueTargetUserId}
              className="text-[10px] font-black uppercase tracking-widest rounded-xl px-6 shadow-lg shadow-blue-500/20"
            >
              <UserCheck size={12} className="mr-2" /> Confirm Issuance
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {selectedAsset && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <p className="text-sm font-bold text-zinc-900 dark:text-white">
                {selectedAsset.description}
              </p>
              <p className="text-[10px] text-blue-600 font-bold">
                {selectedAsset.propertyNo}
              </p>
              <p className="text-[9px] text-zinc-400 mt-1">
                {selectedAsset.assetClass === "Semi-Expendable"
                  ? "Will generate ICS (Inventory Custodian Slip)"
                  : "Will generate PAR (Property Acknowledgement Receipt)"}
              </p>
            </div>
          )}
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
              Select Recipient *
            </label>
            <select
              value={issueTargetUserId}
              onChange={(e) => setIssueTargetUserId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">- Choose employee -</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.position})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setTransferTargetUserId("");
        }}
        title="Transfer Asset"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsTransferModalOpen(false)}
              className="text-[10px] font-black uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button
              variant="blue"
              onClick={handleTransferAsset}
              disabled={!transferTargetUserId}
              className="text-[10px] font-black uppercase tracking-widest rounded-xl px-6"
            >
              <Truck size={12} className="mr-2" /> Confirm Transfer
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {selectedAsset && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <p className="text-sm font-bold text-zinc-900 dark:text-white">
                {selectedAsset.description}
              </p>
              <p className="text-[10px] text-blue-600 font-bold">
                {selectedAsset.propertyNo}
              </p>
            </div>
          )}
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
              Transfer to *
            </label>
            <select
              value={transferTargetUserId}
              onChange={(e) => setTransferTargetUserId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">- Choose employee -</option>
              {users
                .filter((u) => u.id !== selectedAsset?.custodianId)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.position})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
