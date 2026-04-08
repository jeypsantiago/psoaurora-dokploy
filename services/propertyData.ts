import { AssetCategory, Asset, CustodyRecord, AssetTransaction, InventoryEvent, AuditLogEntry } from '../pages/property/propertyTypes';

// ============================================================
// Seed Data for Property & Asset Module
// ============================================================

export const DEFAULT_CATEGORIES: AssetCategory[] = [
    { id: 'cat-1', name: 'IT Equipment', assetClass: 'PPE', usefulLife: 5, description: 'Computers, printers, servers, networking' },
    { id: 'cat-2', name: 'Furniture & Fixtures', assetClass: 'PPE', usefulLife: 10, description: 'Desks, chairs, shelves, cabinets' },
    { id: 'cat-3', name: 'Motor Vehicles', assetClass: 'PPE', usefulLife: 7, description: 'Service vehicles and motorcycles' },
    { id: 'cat-4', name: 'Office Equipment', assetClass: 'Semi-Expendable', usefulLife: 2, description: 'Calculators, staplers, trimmers' },
    { id: 'cat-5', name: 'Communication Equipment', assetClass: 'Semi-Expendable', usefulLife: 3, description: 'Radios, phones, modems' },
    { id: 'cat-6', name: 'Books & Periodicals', assetClass: 'PPE', usefulLife: 10, description: 'Reference materials' },
    { id: 'cat-7', name: 'Building & Structures', assetClass: 'PPE', usefulLife: 30, description: 'Office buildings, warehouses' },
];

export const DEFAULT_ASSETS: Asset[] = [
    {
        id: 'asset-001', propertyNo: 'PSA-PPE-2025-0001', description: 'Desktop Computer (Core i5, 16GB RAM)',
        specifications: 'Intel Core i5-13400, 16GB DDR5, 512GB SSD', serialNo: 'DC-2025-4891', modelNo: 'Dell OptiPlex 7010',
        assetClass: 'PPE', categoryId: 'cat-1', acquisitionDate: '2025-03-15', cost: 45000, bookValue: 36000,
        location: 'RSSO V — Admin Office', condition: 'Serviceable', status: 'Issued', custodianId: '1',
        createdAt: '2025-03-15T08:00:00', updatedAt: '2025-03-15T08:00:00',
    },
    {
        id: 'asset-002', propertyNo: 'PSA-PPE-2025-0002', description: 'Laptop Computer (Core i7, 32GB RAM)',
        specifications: 'Intel Core i7-13700H, 32GB DDR5, 1TB SSD', serialNo: 'LP-2025-7723', modelNo: 'Lenovo ThinkPad T14s',
        assetClass: 'PPE', categoryId: 'cat-1', acquisitionDate: '2025-01-10', cost: 78000, bookValue: 62400,
        location: 'RSSO V — ICT Unit', condition: 'Serviceable', status: 'Issued', custodianId: '2',
        createdAt: '2025-01-10T08:00:00', updatedAt: '2025-01-10T08:00:00',
    },
    {
        id: 'asset-003', propertyNo: 'PSA-PPE-2025-0003', description: 'Multifunction Printer',
        specifications: 'A3 color print/scan/copy/fax', serialNo: 'PR-2025-1102', modelNo: 'Epson L15150',
        assetClass: 'PPE', categoryId: 'cat-1', acquisitionDate: '2025-02-20', cost: 32000, bookValue: 25600,
        location: 'RSSO V — Admin Office', condition: 'Serviceable', status: 'In Stock',
        createdAt: '2025-02-20T08:00:00', updatedAt: '2025-02-20T08:00:00',
    },
    {
        id: 'asset-004', propertyNo: 'PSA-PPE-2025-0004', description: 'Executive Office Desk',
        specifications: 'L-shaped, 160x140cm, walnut finish', serialNo: 'FN-2025-0044',
        assetClass: 'PPE', categoryId: 'cat-2', acquisitionDate: '2024-06-01', cost: 18500, bookValue: 16650,
        location: 'RSSO V — Chief Office', condition: 'Serviceable', status: 'Issued', custodianId: '1',
        createdAt: '2024-06-01T08:00:00', updatedAt: '2024-06-01T08:00:00',
    },
    {
        id: 'asset-005', propertyNo: 'PSA-PPE-2025-0005', description: 'Steel Filing Cabinet (4-Drawer)',
        specifications: 'Heavy-duty, with lock, gray', serialNo: 'FN-2025-0099',
        assetClass: 'PPE', categoryId: 'cat-2', acquisitionDate: '2024-08-15', cost: 12000, bookValue: 10800,
        location: 'RSSO V — Records Section', condition: 'Serviceable', status: 'In Stock',
        createdAt: '2024-08-15T08:00:00', updatedAt: '2024-08-15T08:00:00',
    },
    {
        id: 'asset-006', propertyNo: 'PSA-PPE-2025-0006', description: 'Toyota Hi-Ace Commuter (Service Vehicle)',
        specifications: '2024 model, 15-seater, manual', serialNo: 'MV-2024-PSA-005', modelNo: 'Toyota Hi-Ace',
        assetClass: 'PPE', categoryId: 'cat-3', acquisitionDate: '2024-01-20', cost: 1750000, bookValue: 1500000,
        location: 'RSSO V — Motor Pool', condition: 'Serviceable', status: 'Issued', custodianId: '3',
        createdAt: '2024-01-20T08:00:00', updatedAt: '2024-01-20T08:00:00',
    },
    {
        id: 'asset-007', propertyNo: 'PSA-SE-2025-0001', description: 'Scientific Calculator',
        specifications: 'Casio FX-991EX, multi-function', serialNo: 'SE-2025-0201',
        assetClass: 'Semi-Expendable', categoryId: 'cat-4', acquisitionDate: '2025-05-01', cost: 1800,
        location: 'RSSO V — Statistics Division', condition: 'Serviceable', status: 'Issued', custodianId: '2',
        createdAt: '2025-05-01T08:00:00', updatedAt: '2025-05-01T08:00:00',
    },
    {
        id: 'asset-008', propertyNo: 'PSA-SE-2025-0002', description: 'Heavy-Duty Stapler',
        specifications: 'Kangaro HD-23S17, 140-sheet capacity', serialNo: 'SE-2025-0305',
        assetClass: 'Semi-Expendable', categoryId: 'cat-4', acquisitionDate: '2025-04-10', cost: 2500,
        location: 'RSSO V — Admin Office', condition: 'Serviceable', status: 'In Stock',
        createdAt: '2025-04-10T08:00:00', updatedAt: '2025-04-10T08:00:00',
    },
    {
        id: 'asset-009', propertyNo: 'PSA-SE-2025-0003', description: 'Two-Way Radio (Walkie-Talkie)',
        specifications: 'Baofeng UV-5R, dual band, 5W', serialNo: 'CE-2025-0110',
        assetClass: 'Semi-Expendable', categoryId: 'cat-5', acquisitionDate: '2025-06-15', cost: 3200,
        location: 'RSSO V — Field Operations', condition: 'Serviceable', status: 'Issued', custodianId: '3',
        createdAt: '2025-06-15T08:00:00', updatedAt: '2025-06-15T08:00:00',
    },
    {
        id: 'asset-010', propertyNo: 'PSA-SE-2025-0004', description: 'USB WiFi Router/Modem',
        specifications: 'TP-Link Archer C6, AC1200', serialNo: 'CE-2025-0221', modelNo: 'TP-Link Archer C6',
        assetClass: 'Semi-Expendable', categoryId: 'cat-5', acquisitionDate: '2025-07-01', cost: 2800,
        location: 'RSSO V — ICT Unit', condition: 'Serviceable', status: 'In Stock',
        createdAt: '2025-07-01T08:00:00', updatedAt: '2025-07-01T08:00:00',
    },
    {
        id: 'asset-011', propertyNo: 'PSA-PPE-2025-0007', description: 'Ergonomic Office Chair',
        specifications: 'Mesh back, adjustable armrests, lumbar support', serialNo: 'FN-2025-0150',
        assetClass: 'PPE', categoryId: 'cat-2', acquisitionDate: '2025-02-01', cost: 8500, bookValue: 7650,
        location: 'RSSO V — Admin Office', condition: 'Serviceable', status: 'Issued', custodianId: '1',
        createdAt: '2025-02-01T08:00:00', updatedAt: '2025-02-01T08:00:00',
    },
    {
        id: 'asset-012', propertyNo: 'PSA-PPE-2025-0008', description: 'UPS (Uninterruptible Power Supply)',
        specifications: 'APC Back-UPS 1100VA, 230V', serialNo: 'IT-2025-0890', modelNo: 'APC BX1100LI-MS',
        assetClass: 'PPE', categoryId: 'cat-1', acquisitionDate: '2025-03-01', cost: 6500, bookValue: 5200,
        location: 'RSSO V — Server Room', condition: 'Serviceable', status: 'In Stock',
        createdAt: '2025-03-01T08:00:00', updatedAt: '2025-03-01T08:00:00',
    },
    {
        id: 'asset-013', propertyNo: 'PSA-SE-2025-0005', description: 'Paper Trimmer/Cutter',
        specifications: 'A3 size, 400-sheet capacity, guillotine type', serialNo: 'SE-2025-0412',
        assetClass: 'Semi-Expendable', categoryId: 'cat-4', acquisitionDate: '2025-08-01', cost: 4500,
        location: 'RSSO V — Printing Section', condition: 'Serviceable', status: 'In Stock',
        createdAt: '2025-08-01T08:00:00', updatedAt: '2025-08-01T08:00:00',
    },
    {
        id: 'asset-014', propertyNo: 'PSA-PPE-2025-0009', description: 'Air Conditioning Unit (2HP Split Type)',
        specifications: 'Carrier 2HP inverter split type', serialNo: 'BL-2025-0033', modelNo: 'Carrier 42TVCA024',
        assetClass: 'PPE', categoryId: 'cat-7', acquisitionDate: '2024-11-15', cost: 55000, bookValue: 53167,
        location: 'RSSO V — Conference Room', condition: 'Serviceable', status: 'In Stock',
        createdAt: '2024-11-15T08:00:00', updatedAt: '2024-11-15T08:00:00',
    },
    {
        id: 'asset-015', propertyNo: 'PSA-PPE-2025-0010', description: 'External Hard Drive 2TB',
        specifications: 'Seagate Backup Plus Slim, USB 3.0', serialNo: 'IT-2025-1050', modelNo: 'Seagate STHN2000400',
        assetClass: 'PPE', categoryId: 'cat-1', acquisitionDate: '2025-04-20', cost: 4200, bookValue: 3360,
        location: 'RSSO V — ICT Unit', condition: 'Serviceable', status: 'Issued', custodianId: '2',
        createdAt: '2025-04-20T08:00:00', updatedAt: '2025-04-20T08:00:00',
    },
];

export const DEFAULT_CUSTODY_RECORDS: CustodyRecord[] = [
    { id: 'cust-001', assetId: 'asset-001', custodianId: '1', custodianName: 'Admin One', type: 'PAR', documentNo: 'PAR-2025-001', dateIssued: '2025-03-15', acknowledgedAt: '2025-03-15T10:00:00' },
    { id: 'cust-002', assetId: 'asset-002', custodianId: '2', custodianName: 'Reg Clerk', type: 'PAR', documentNo: 'PAR-2025-002', dateIssued: '2025-01-10', acknowledgedAt: '2025-01-10T14:00:00' },
    { id: 'cust-003', assetId: 'asset-007', custodianId: '2', custodianName: 'Reg Clerk', type: 'ICS', documentNo: 'ICS-2025-001', dateIssued: '2025-05-01', acknowledgedAt: '2025-05-01T09:00:00' },
    { id: 'cust-004', assetId: 'asset-006', custodianId: '3', custodianName: 'Supply Mgr', type: 'PAR', documentNo: 'PAR-2025-003', dateIssued: '2024-01-20', acknowledgedAt: '2024-01-20T11:00:00' },
    { id: 'cust-005', assetId: 'asset-009', custodianId: '3', custodianName: 'Supply Mgr', type: 'ICS', documentNo: 'ICS-2025-002', dateIssued: '2025-06-15', acknowledgedAt: '2025-06-15T08:30:00' },
];

export const DEFAULT_TRANSACTIONS: AssetTransaction[] = [
    { id: 'txn-001', assetId: 'asset-001', type: 'acquisition', performedBy: '1', performedByName: 'Admin One', date: '2025-03-15', remarks: 'Received from Dell Philippines (IAR No. 2025-0045)' },
    { id: 'txn-002', assetId: 'asset-001', type: 'issuance', performedBy: '1', performedByName: 'Admin One', toId: '1', toName: 'Admin One', date: '2025-03-15', remarks: 'PAR-2025-001 issued' },
    { id: 'txn-003', assetId: 'asset-002', type: 'acquisition', performedBy: '1', performedByName: 'Admin One', date: '2025-01-10', remarks: 'Received from Lenovo Philippines (IAR No. 2025-0012)' },
    { id: 'txn-004', assetId: 'asset-002', type: 'issuance', performedBy: '1', performedByName: 'Admin One', toId: '2', toName: 'Reg Clerk', date: '2025-01-10', remarks: 'PAR-2025-002 issued' },
    { id: 'txn-005', assetId: 'asset-007', type: 'issuance', performedBy: '1', performedByName: 'Admin One', toId: '2', toName: 'Reg Clerk', date: '2025-05-01', remarks: 'ICS-2025-001 issued (semi-expendable)' },
];

export const DEFAULT_EVENTS: InventoryEvent[] = [
    {
        id: 'evt-001', title: 'Annual Physical Count FY 2025', asOfDate: '2025-12-31',
        status: 'draft', createdBy: '1', createdByName: 'Admin One', createdAt: '2025-11-01T08:00:00',
        totalExpected: 15, totalScanned: 0, totalDiscrepancies: 0,
    },
];

export const DEFAULT_AUDIT_LOG: AuditLogEntry[] = [
    { id: 'log-001', timestamp: '2025-03-15T08:00:00', userId: '1', userName: 'Admin One', action: 'Asset Registered', entityType: 'asset', entityId: 'asset-001', details: 'Registered Desktop Computer (PSA-PPE-2025-0001)' },
    { id: 'log-002', timestamp: '2025-03-15T10:00:00', userId: '1', userName: 'Admin One', action: 'Asset Issued', entityType: 'custody', entityId: 'cust-001', details: 'Issued PSA-PPE-2025-0001 to Admin One via PAR-2025-001' },
    { id: 'log-003', timestamp: '2025-01-10T08:00:00', userId: '1', userName: 'Admin One', action: 'Asset Registered', entityType: 'asset', entityId: 'asset-002', details: 'Registered Laptop Computer (PSA-PPE-2025-0002)' },
    { id: 'log-004', timestamp: '2025-05-01T09:00:00', userId: '1', userName: 'Admin One', action: 'ICS Issued', entityType: 'custody', entityId: 'cust-003', details: 'Issued PSA-SE-2025-0001 to Reg Clerk via ICS-2025-001' },
];
