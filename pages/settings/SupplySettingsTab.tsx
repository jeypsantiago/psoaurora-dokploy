import React from "react";
import { FileCheck, Scale, AlertTriangle, Plus, Trash2, Info } from "lucide-react";
import { Badge, Button, Card } from "../../components/ui";

type AnySupplySettingsProps = Record<string, any>;

export const SupplySettingsTab: React.FC<AnySupplySettingsProps> = (props) => {
  const {
    supplySubTab,
    setSupplySubTab,
    risConfig,
    setRisConfig,
    unitMaster,
    removeUnitMaster,
    addUnitMaster,
    handlePurgeInventory,
  } = props;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl w-fit">
        <button
          onClick={() => setSupplySubTab("ris")}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${supplySubTab === "ris" ? "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-white shadow-sm" : "text-zinc-500"}`}
        >
          <FileCheck size={14} /> RIS Config
        </button>
        <button
          onClick={() => setSupplySubTab("units")}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${supplySubTab === "units" ? "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-white shadow-sm" : "text-zinc-500"}`}
        >
          <Scale size={14} /> Unit Master
        </button>
        <button
          onClick={() => setSupplySubTab("danger")}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${supplySubTab === "danger" ? "bg-red-500 text-white" : "text-zinc-500 hover:text-red-500"}`}
        >
          <AlertTriangle size={14} /> Danger Zone
        </button>
      </div>

      {supplySubTab === "ris" && (
        <Card
          title="Requisition & Issue Slip (RIS) Settings"
          description="Configure automatic numbering for provincial stock releases"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    RIS Prefix
                  </label>
                  <input
                    type="text"
                    value={risConfig.prefix}
                    onChange={(e) =>
                      setRisConfig({
                        ...risConfig,
                        prefix: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Separator
                  </label>
                  <input
                    type="text"
                    value={risConfig.separator}
                    onChange={(e) =>
                      setRisConfig({
                        ...risConfig,
                        separator: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none text-center font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Padding
                  </label>
                  <input
                    type="number"
                    value={risConfig.padding}
                    onChange={(e) =>
                      setRisConfig({
                        ...risConfig,
                        padding: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Increment
                  </label>
                  <input
                    type="number"
                    value={risConfig.increment}
                    onChange={(e) =>
                      setRisConfig({
                        ...risConfig,
                        increment: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Start #
                  </label>
                  <input
                    type="number"
                    value={risConfig.startNumber}
                    onChange={(e) =>
                      setRisConfig({
                        ...risConfig,
                        startNumber: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 rounded-3xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 flex flex-col justify-center">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">
                Example Output
              </span>
              <p className="text-4xl font-mono font-black text-zinc-900 dark:text-white tracking-tighter">
                {risConfig.prefix}
                {risConfig.separator}
                {String(risConfig.startNumber).padStart(risConfig.padding, "0")}
              </p>
              <p className="text-[10px] text-blue-600/60 font-medium mt-4 leading-relaxed">
                Generated RIS numbers are unique across the provincial database and recorded in the audit logs.
              </p>
            </div>
          </div>
        </Card>
      )}

      {supplySubTab === "units" && (
        <Card
          title="Unit Master Directory"
          description="Manage valid units of measurement for inventory items"
        >
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {unitMaster.map((unit: string) => (
                <Badge
                  key={unit}
                  variant="info"
                  className="!py-2 !px-4 flex items-center gap-2 group"
                >
                  {unit}
                  <button
                    onClick={() => removeUnitMaster(unit)}
                    className="text-blue-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </Badge>
              ))}
              <button
                onClick={addUnitMaster}
                className="px-4 py-2 rounded-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Add New Unit
              </button>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 flex gap-3">
              <Info size={18} className="text-zinc-400 shrink-0" />
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                Units defined here will appear as options when registering or editing items in the Supply Inventory tab.
              </p>
            </div>
          </div>
        </Card>
      )}

      {supplySubTab === "danger" && (
        <Card
          title="Danger Zone"
          description="Irreversible system-wide actions for provincial data management"
          className="!border-red-200 dark:!border-red-900/30"
        >
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-3xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 gap-6">
              <div>
                <h4 className="text-sm font-black text-red-700 dark:text-red-400 uppercase tracking-tight">
                  Purge All Inventory Data
                </h4>
                <p className="text-xs text-red-600/70 mt-1 leading-relaxed">
                  Removes all stock items, quantity records, and pending requisition requests. Use only after testing phase or for full system reset.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={handlePurgeInventory}
                className="bg-red-600 text-white hover:bg-red-700 !px-8 h-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]"
              >
                Wipe Inventory
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default React.memo(SupplySettingsTab);
