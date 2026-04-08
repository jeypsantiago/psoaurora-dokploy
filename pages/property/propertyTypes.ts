// ============================================================
// PSA Property & Asset Monitoring System — Data Model
// Aligned with COA Circular 2020-006 & 2022-004
// ============================================================

// --- Enums & Literals ---

export type AssetClass = 'PPE' | 'Semi-Expendable';

export type AssetCondition = 'Serviceable' | 'Unserviceable' | 'For Repair' | 'For Disposal';

export type AssetStatus = 'In Stock' | 'Issued' | 'Transferred' | 'Returned' | 'Disposed' | 'Missing';

export type CustodyType = 'ICS' | 'PAR';

export type TransactionType =
    | 'acquisition'
    | 'issuance'
    | 'transfer'
    | 'return'
    | 'disposal'
    | 'repair'
    | 'reclassification'
    | 'found'
    | 'missing';

export type InventoryEventStatus = 'draft' | 'in-progress' | 'completed' | 'cancelled';

export type DiscrepancyType = 'missing' | 'found' | 'wrong-location' | 'damaged' | 'untagged';

// --- Core Interfaces ---

export interface AssetCategory {
    id: string;
    name: string;
    assetClass: AssetClass;
    /** Default useful life in years (for semi-expendable, agency-determined per COA 2022-004) */
    usefulLife?: number;
    description?: string;
}

export interface Asset {
    id: string;
    /** Unique property number (e.g., PSA-PPE-2026-0001) */
    propertyNo: string;
    description: string;
    specifications?: string;
    serialNo?: string;
    modelNo?: string;
    assetClass: AssetClass;
    categoryId: string;
    acquisitionDate: string;
    /** Acquisition cost in PHP */
    cost: number;
    /** Current book value (for PPE with depreciation) */
    bookValue?: number;
    location: string;
    /** Organization unit / office */
    officeId?: string;
    condition: AssetCondition;
    status: AssetStatus;
    /** Current custodian user ID */
    custodianId?: string;
    /** QR code data URL (base64 PNG) */
    qrCode?: string;
    /** Encoded data for QR (e.g., property number) */
    qrData?: string;
    /** Supporting document references (IAR, etc.) */
    attachmentNotes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CustodyRecord {
    id: string;
    assetId: string;
    custodianId: string;
    custodianName: string;
    /** ICS for semi-expendable, PAR for PPE */
    type: CustodyType;
    /** ICS/PAR document number */
    documentNo: string;
    dateIssued: string;
    dateReturned?: string;
    /** Acknowledgement timestamp */
    acknowledgedAt?: string;
    remarks?: string;
}

export interface AssetTransaction {
    id: string;
    assetId: string;
    type: TransactionType;
    /** User ID who performed the action */
    performedBy: string;
    performedByName: string;
    /** Source user/location */
    fromId?: string;
    fromName?: string;
    /** Destination user/location */
    toId?: string;
    toName?: string;
    date: string;
    remarks?: string;
}

export interface InventoryEvent {
    id: string;
    title: string;
    /** Count as-of date (e.g., Dec 31 for annual) */
    asOfDate: string;
    status: InventoryEventStatus;
    createdBy: string;
    createdByName: string;
    createdAt: string;
    completedAt?: string;
    /** Summary stats */
    totalExpected: number;
    totalScanned: number;
    totalDiscrepancies: number;
}

export interface InventoryCountLine {
    id: string;
    eventId: string;
    assetId: string;
    propertyNo: string;
    assetDescription: string;
    expectedLocation: string;
    expectedCustodian?: string;
    /** Where item was actually found */
    foundLocation?: string;
    foundCondition?: AssetCondition;
    /** Whether item was scanned/counted */
    scanned: boolean;
    /** Discrepancy type if any */
    discrepancyType?: DiscrepancyType;
    discrepancyNotes?: string;
    scannedAt?: string;
    scannedBy?: string;
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: string;
    entityType: 'asset' | 'custody' | 'transaction' | 'inventory' | 'category';
    entityId: string;
    /** Human-readable description of what changed */
    details: string;
}

// --- Helper Types ---

export interface PropertyStats {
    totalAssets: number;
    totalPPE: number;
    totalSemiExpendable: number;
    issuedAssets: number;
    inStockAssets: number;
    missingAssets: number;
    totalValue: number;
    activeEvents: number;
}
