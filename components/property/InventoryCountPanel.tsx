import React, { useState } from "react";
import { Button, Modal } from "../ui";
import {
  InventoryEvent,
  InventoryCountLine,
  Asset,
  InventoryEventStatus,
  DiscrepancyType,
} from "../../pages/property/propertyTypes";
import {
  ClipboardList,
  Plus,
  Search,
  Check,
  X,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Scan,
  Eye,
  Play,
} from "lucide-react";

interface InventoryCountPanelProps {
  events: InventoryEvent[];
  countLines: InventoryCountLine[];
  assets: Asset[];
  onCreateEvent: (title: string, asOfDate: string) => void;
  onStartEvent: (eventId: string) => void;
  onCompleteEvent: (eventId: string) => void;
  onScanItem: (
    eventId: string,
    assetId: string,
    foundLocation: string,
    condition: string,
    discrepancyType?: DiscrepancyType,
    notes?: string,
  ) => void;
  onMarkMissing: (eventId: string, assetId: string) => void;
  canCount: boolean;
}

const eventStatusColors: Record<InventoryEventStatus, string> = {
  draft:
    "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
  "in-progress":
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  completed:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  cancelled:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

export const InventoryCountPanel: React.FC<InventoryCountPanelProps> = ({
  events,
  countLines,
  assets: _assets,
  onCreateEvent,
  onStartEvent,
  onCompleteEvent,
  onScanItem,
  onMarkMissing,
  canCount,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [scanSearch, setScanSearch] = useState("");
  const [_scanLocation, _setScanLocation] = useState("");
  const [_scanCondition, _setScanCondition] = useState("Serviceable");

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const eventLines = countLines.filter((l) => l.eventId === selectedEventId);
  const scannedCount = eventLines.filter((l) => l.scanned).length;
  const discrepancyCount = eventLines.filter((l) => l.discrepancyType).length;

  const handleCreateEvent = () => {
    if (!newEventTitle.trim() || !newEventDate) return;
    onCreateEvent(newEventTitle.trim(), newEventDate);
    setIsCreateModalOpen(false);
    setNewEventTitle("");
    setNewEventDate("");
  };

  const filteredLines = eventLines.filter(
    (l) =>
      l.propertyNo.toLowerCase().includes(scanSearch.toLowerCase()) ||
      l.assetDescription.toLowerCase().includes(scanSearch.toLowerCase()),
  );

  const unscannedLines = filteredLines.filter((l) => !l.scanned);
  const scannedLines = filteredLines.filter((l) => l.scanned);

  return (
    <div className="space-y-6">
      {/* Event List (no selected event) */}
      {!selectedEvent && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                Inventory Events
              </h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                Physical count sessions aligned to COA requirements
              </p>
            </div>
            {canCount && (
              <Button
                variant="blue"
                onClick={() => setIsCreateModalOpen(true)}
                className="text-[9px] font-black uppercase tracking-widest rounded-xl px-4 shadow-lg shadow-blue-500/20"
              >
                <Plus size={12} className="mr-1.5" /> New Event
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {events.length > 0 ? (
              events.map((event) => (
                <div
                  key={event.id}
                  className="p-4 bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between hover:border-blue-500/30 transition-all cursor-pointer"
                  onClick={() => setSelectedEventId(event.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                      <ClipboardList size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-zinc-900 dark:text-white">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-zinc-400 font-bold">
                          <Calendar size={9} className="inline mr-0.5" /> As of{" "}
                          {event.asOfDate}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300" />
                        <span className="text-[9px] text-zinc-400 font-bold">
                          {event.totalScanned}/{event.totalExpected} scanned
                        </span>
                        {event.totalDiscrepancies > 0 && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-zinc-300" />
                            <span className="text-[9px] text-red-500 font-bold">
                              <AlertTriangle
                                size={9}
                                className="inline mr-0.5"
                              />{" "}
                              {event.totalDiscrepancies} issues
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${eventStatusColors[event.status]}`}
                    >
                      {event.status}
                    </span>
                    <Button
                      variant="ghost"
                      className="text-[9px] font-black uppercase tracking-widest"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setSelectedEventId(event.id);
                      }}
                    >
                      <Eye size={12} className="mr-1" /> Open
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 flex flex-col items-center opacity-40">
                <ClipboardList size={48} className="mb-4 text-zinc-300" />
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
                  No inventory events yet
                </p>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Create your first annual physical count event
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Active Event Detail */}
      {selectedEvent && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedEventId(null)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X size={16} />
              </button>
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                  {selectedEvent.title}
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold">
                  As of {selectedEvent.asOfDate} • {scannedCount}/
                  {eventLines.length} scanned
                </p>
              </div>
              <span
                className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${eventStatusColors[selectedEvent.status]}`}
              >
                {selectedEvent.status}
              </span>
            </div>
            <div className="flex gap-2">
              {canCount && selectedEvent.status === "draft" && (
                <Button
                  variant="blue"
                  onClick={() => onStartEvent(selectedEvent.id)}
                  className="text-[9px] font-black uppercase tracking-widest rounded-xl px-4"
                >
                  <Play size={12} className="mr-1.5" /> Start Count
                </Button>
              )}
              {canCount && selectedEvent.status === "in-progress" && (
                <Button
                  variant="primary"
                  onClick={() => onCompleteEvent(selectedEvent.id)}
                  className="text-[9px] font-black uppercase tracking-widest rounded-xl px-4"
                >
                  <CheckCircle2 size={12} className="mr-1.5" /> Complete
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${eventLines.length > 0 ? (scannedCount / eventLines.length) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold">
            <span className="text-blue-600">{scannedCount} Scanned</span>
            <span className="text-zinc-400">
              {eventLines.length - scannedCount} Remaining
            </span>
            {discrepancyCount > 0 && (
              <span className="text-red-500">
                <AlertTriangle size={10} className="inline mr-0.5" />{" "}
                {discrepancyCount} Discrepancies
              </span>
            )}
          </div>

          {/* Search */}
          {selectedEvent.status === "in-progress" && (
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search by property no. or description to scan..."
                value={scanSearch}
                onChange={(e) => setScanSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Count Lines */}
          <div className="space-y-2">
            {/* Unscanned items first */}
            {unscannedLines.length > 0 &&
              selectedEvent.status === "in-progress" && (
                <div>
                  <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                    Pending ({unscannedLines.length})
                  </h4>
                  {unscannedLines.map((line) => (
                    <div
                      key={line.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                          <Scan size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-white">
                            {line.assetDescription}
                          </p>
                          <p className="text-[9px] text-zinc-400 font-medium">
                            {line.propertyNo} • Expected at{" "}
                            {line.expectedLocation}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="blue"
                          className="text-[8px] font-black uppercase tracking-widest rounded-lg px-3 h-7"
                          onClick={() =>
                            onScanItem(
                              selectedEvent.id,
                              line.assetId,
                              line.expectedLocation,
                              "Serviceable",
                            )
                          }
                        >
                          <Check size={10} className="mr-1" /> Found
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-[8px] font-black uppercase tracking-widest rounded-lg px-3 h-7 text-red-500"
                          onClick={() =>
                            onMarkMissing(selectedEvent.id, line.assetId)
                          }
                        >
                          <X size={10} className="mr-1" /> Missing
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            {/* Scanned items */}
            {scannedLines.length > 0 && (
              <div>
                <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                  Counted ({scannedLines.length})
                </h4>
                {scannedLines.map((line) => (
                  <div
                    key={line.id}
                    className={`flex items-center justify-between p-3 rounded-xl border mb-2 ${line.discrepancyType ? "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800" : "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${line.discrepancyType ? "bg-red-100 dark:bg-red-900/20 text-red-500" : "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500"}`}
                      >
                        {line.discrepancyType ? (
                          <AlertTriangle size={14} />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white">
                          {line.assetDescription}
                        </p>
                        <p className="text-[9px] text-zinc-400 font-medium">
                          {line.propertyNo}
                          {line.discrepancyType && (
                            <span className="text-red-500 ml-2 font-black uppercase">
                              • {line.discrepancyType}
                            </span>
                          )}
                          {line.discrepancyNotes && (
                            <span className="ml-1">
                              — {line.discrepancyNotes}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Event Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Inventory Event"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
              className="text-[10px] font-black uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button
              variant="blue"
              onClick={handleCreateEvent}
              className="text-[10px] font-black uppercase tracking-widest rounded-xl px-6 shadow-lg shadow-blue-500/20"
            >
              Create Event
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
              Event Title *
            </label>
            <input
              type="text"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="e.g., Annual Physical Count FY 2026"
              className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
              As-of Date *
            </label>
            <input
              type="date"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
