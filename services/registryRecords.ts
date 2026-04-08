import { STORAGE_KEYS } from '../constants/storageKeys';
import { upsertAppStateFromStorageValue } from './appState';
import { getStorageItem, readStorageJsonSafe, writeStorageJson } from './storage';

export interface RegistryAuditLog {
  action: string;
  timestamp: string;
  user: string;
  comment?: string;
}

export interface RegistryRecord {
  date: string;
  type: string;
  name: string;
  reg: string;
  status: string;
  details: Record<string, string>;
  logs: RegistryAuditLog[];
}

export interface RegistryDocTypeConfig {
  id: string;
  name: string;
  enabled: boolean;
  refPrefix: string;
  refSeparator: string;
  refPadding: number;
  refIncrement: number;
  refStart: number;
}

export interface RegistrySchemaField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'prefix' | 'checkbox' | 'email' | 'tel' | 'textarea' | 'multiselect' | 'url' | 'datetime' | 'time' | 'section' | 'rating' | 'color';
  required: boolean;
  options?: string[];
  collectionSource?: string;
}

export const OUTGOING_DOCUMENT_TYPE_NAME = 'Outgoing Document';

export const DEFAULT_RECORD_DOC_TYPES: RegistryDocTypeConfig[] = [
  { id: 'birth', name: 'Birth Certificate', enabled: true, refPrefix: 'BC', refSeparator: '-', refPadding: 6, refIncrement: 1, refStart: 1000 },
  { id: 'marriage', name: 'Marriage Certificate', enabled: true, refPrefix: 'MC', refSeparator: '-', refPadding: 6, refIncrement: 1, refStart: 500 },
  { id: 'death', name: 'Death Certificate', enabled: true, refPrefix: 'DC', refSeparator: '-', refPadding: 6, refIncrement: 1, refStart: 100 },
  { id: 'cenomar', name: 'CENOMAR', enabled: false, refPrefix: 'CN', refSeparator: '-', refPadding: 6, refIncrement: 1, refStart: 1 },
  { id: 'outgoing', name: OUTGOING_DOCUMENT_TYPE_NAME, enabled: true, refPrefix: 'OUT', refSeparator: '-', refPadding: 6, refIncrement: 1, refStart: 1 },
];

const DEFAULT_RECORDS: RegistryRecord[] = [];

const formatAuditTimestamp = (date = new Date()) => {
  const dateLabel = date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
  const timeLabel = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${dateLabel} ${timeLabel}`;
};

const cloneDefaultRegistryDocTypes = () => DEFAULT_RECORD_DOC_TYPES.map((docType) => ({ ...docType }));

export const readRegistryDocTypesFromStorage = (): RegistryDocTypeConfig[] => {
  if (getStorageItem(STORAGE_KEYS.recordDocTypes) === null) {
    return cloneDefaultRegistryDocTypes();
  }

  const parsed = readStorageJsonSafe<unknown>(STORAGE_KEYS.recordDocTypes, null);
  return Array.isArray(parsed)
    ? (parsed as RegistryDocTypeConfig[])
    : cloneDefaultRegistryDocTypes();
};

export const readRegistryRecordsFromStorage = (): RegistryRecord[] => {
  return readStorageJsonSafe<RegistryRecord[]>(STORAGE_KEYS.registryRecords, DEFAULT_RECORDS);
};

export const readRegistryDocFieldsFromStorage = (): Record<string, RegistrySchemaField[]> => {
  const parsed = readStorageJsonSafe<unknown>(STORAGE_KEYS.recordDocFields, {});
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? (parsed as Record<string, RegistrySchemaField[]>)
    : {};
};

export const readRegistryDataCollectionsFromStorage = (): Record<string, string[]> => {
  const parsed = readStorageJsonSafe<unknown>(STORAGE_KEYS.dataCollections, {});
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? (parsed as Record<string, string[]>)
    : {};
};

const persistRegistryRecords = async (records: RegistryRecord[]) => {
  const serialized = JSON.stringify(records);
  writeStorageJson(STORAGE_KEYS.registryRecords, records);
  await upsertAppStateFromStorageValue(STORAGE_KEYS.registryRecords, serialized);
};

const resolveDocTypeConfig = (typeName: string, docTypes: RegistryDocTypeConfig[]) => {
  const normalizedTypeName = typeName.trim().toLowerCase();
  return docTypes.find((doc) => doc.name.trim().toLowerCase() === normalizedTypeName) || null;
};

export const resolveOutgoingDocTypeConfig = (docTypes: RegistryDocTypeConfig[]) => {
  const exactMatch = docTypes.find((doc) => {
    return doc.enabled && doc.name.trim().toLowerCase() === OUTGOING_DOCUMENT_TYPE_NAME.toLowerCase();
  }) || null;
  if (exactMatch) return exactMatch;

  return docTypes.find((doc) => doc.enabled && doc.name.trim().toLowerCase().includes('outgoing')) || null;
};

export const buildInitialRegistryDetailValues = (
  fields: RegistrySchemaField[],
  sourceDetails?: Record<string, string>,
) => {
  const nextValues: Record<string, string> = {};
  fields.forEach((field) => {
    if (field.type === 'section') return;
    const sourceValue = sourceDetails?.[field.label];
    nextValues[field.id] = typeof sourceValue === 'string' ? sourceValue : '';
  });
  return nextValues;
};

export const normalizeRegistryDetailValue = (
  fieldType: RegistrySchemaField['type'],
  value: string,
): string => {
  if (fieldType === 'multiselect') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .join(', ');
  }

  if (fieldType === 'checkbox') {
    if (!value) return 'No';
    const lowered = value.toLowerCase();
    if (lowered === 'true' || lowered === 'yes') return 'Yes';
    if (lowered === 'false' || lowered === 'no') return 'No';
    return value;
  }

  return value.trim();
};

export const getRegistryInputTypeByField = (field: RegistrySchemaField): string => {
  if (field.type === 'datetime') return 'datetime-local';
  if (field.type === 'rating') return 'number';
  if (field.type === 'multiselect' || field.type === 'prefix') return 'text';
  return field.type;
};

export const generateRegistryNumber = (
  records: RegistryRecord[],
  type: string,
  docTypes: RegistryDocTypeConfig[],
  prefixOverride?: string,
) => {
  const config = resolveDocTypeConfig(type, docTypes);

  if (!config) {
    throw new Error(`Document type "${type}" is not configured in Registry & Records settings.`);
  }

  const base = Math.max(1, Number(config.refStart) || 1);
  const increment = Math.max(1, Number(config.refIncrement) || 1);
  const separator = config.refSeparator ?? '-';
  const padding = Math.max(1, Number(config.refPadding) || 1);
  const resolvedPrefix = (prefixOverride || config.refPrefix || 'REG').trim() || 'REG';
  const marker = `${resolvedPrefix}${separator}`;

  const highest = records
    .filter((record) => record.type === type && record.reg.startsWith(marker))
    .reduce((max, record) => {
      const numericPart = Number(record.reg.slice(marker.length));
      return Number.isFinite(numericPart) ? Math.max(max, numericPart) : max;
    }, base - increment);

  const nextNumber = highest + increment;
  return `${resolvedPrefix}${separator}${String(nextNumber).padStart(padding, '0')}`;
};

interface CreateRegistryRecordInput {
  type: string;
  name: string;
  date?: string;
  status?: string;
  details?: Record<string, string>;
  actorName?: string;
  prefixOverride?: string;
  initialLogAction?: string;
  initialLogComment?: string;
}

export const createRegistryRecord = async ({
  type,
  name,
  date,
  status = 'Pending',
  details = {},
  actorName = 'System',
  prefixOverride,
  initialLogAction = 'Record Created',
  initialLogComment,
}: CreateRegistryRecordInput) => {
  const docTypes = readRegistryDocTypesFromStorage();
  const records = readRegistryRecordsFromStorage();
  const trimmedType = type.trim();
  const trimmedName = name.trim();

  if (!trimmedType) {
    throw new Error('Registry document type is required.');
  }

  if (!trimmedName) {
    throw new Error('Registry record name is required.');
  }

  const reg = generateRegistryNumber(records, trimmedType, docTypes, prefixOverride);
  const timestamp = formatAuditTimestamp();
  const newRecord: RegistryRecord = {
    date: date || new Date().toISOString().split('T')[0],
    type: trimmedType,
    name: trimmedName,
    reg,
    status,
    details,
    logs: [
      {
        action: initialLogAction,
        timestamp,
        user: actorName,
        comment: initialLogComment,
      },
    ],
  };

  const nextRecords = [newRecord, ...records];
  await persistRegistryRecords(nextRecords);
  return newRecord;
};

interface CreateOutgoingRegistryRecordInput {
  name: string;
  date?: string;
  details?: Record<string, string>;
  actorName?: string;
}

export const createOutgoingRegistryRecord = async ({
  name,
  date,
  details = {},
  actorName = 'System',
}: CreateOutgoingRegistryRecordInput) => {
  const docTypes = readRegistryDocTypesFromStorage();
  const outgoingDocType = resolveOutgoingDocTypeConfig(docTypes);

  if (!outgoingDocType) {
    throw new Error(`Add or enable "${OUTGOING_DOCUMENT_TYPE_NAME}" in Settings > Registry & Records first.`);
  }

  return createRegistryRecord({
    type: outgoingDocType.name,
    name,
    date,
    status: 'Pending',
    details,
    actorName,
    initialLogComment: 'Auto-created before COE generation.',
  });
};

export const updateRegistryRecordStatus = async (
  reg: string,
  status: string,
  actorName = 'System',
  comment?: string,
) => {
  const records = readRegistryRecordsFromStorage();
  let updatedRecord: RegistryRecord | null = null;

  const nextRecords = records.map((record) => {
    if (record.reg !== reg) {
      return record;
    }

    updatedRecord = {
      ...record,
      status,
      logs: [
        ...(record.logs || []),
        {
          action: 'Status Updated',
          timestamp: formatAuditTimestamp(),
          user: actorName,
          comment: comment || `Status changed to ${status}.`,
        },
      ],
    };

    return updatedRecord;
  });

  if (!updatedRecord) {
    throw new Error(`Registry record "${reg}" was not found.`);
  }

  await persistRegistryRecords(nextRecords);
  return updatedRecord;
};
