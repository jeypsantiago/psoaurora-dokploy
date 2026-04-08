import React from "react";
import { Fingerprint, Database as DatabaseIcon, AlertTriangle, Plus, Trash2, Info } from "lucide-react";
import { Badge, Button, Card } from "../../components/ui";

type AnyPropertySettingsProps = Record<string, any>;

export const PropertySettingsTab: React.FC<AnyPropertySettingsProps> = (props) => {
  const {
    propertySubTab,
    setPropertySubTab,
    propertyConfig,
    setPropertyConfig,
    propertyCategories,
    setPropertyCategories,
    addPropertyCategory,
    removePropertyCategory,
    addPropertyLocation,
    removePropertyLocation,
    handlePurgeProperty,
  } = props;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl w-fit">
        <button
          onClick={() => setPropertySubTab("numbering")}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${propertySubTab === "numbering" ? "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-white shadow-sm" : "text-zinc-500"}`}
        >
          <Fingerprint size={14} /> Numbering Config
        </button>
        <button
          onClick={() => setPropertySubTab("master")}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${propertySubTab === "master" ? "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-white shadow-sm" : "text-zinc-500"}`}
        >
          <DatabaseIcon size={14} /> Categories & Locations
        </button>
        <button
          onClick={() => setPropertySubTab("danger")}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${propertySubTab === "danger" ? "bg-red-500 text-white" : "text-zinc-500 hover:text-red-500"}`}
        >
          <AlertTriangle size={14} /> Danger Zone
        </button>
      </div>

      {propertySubTab === "numbering" && (
        <div className="space-y-6">
          <Card
            title="Property Number Format"
            description="Customize the auto-generated property number prefixes for PPE and Semi-Expendable assets"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      PPE Prefix
                    </label>
                    <input
                      type="text"
                      value={propertyConfig.ppePrefix}
                      onChange={(e) =>
                        setPropertyConfig({
                          ...propertyConfig,
                          ppePrefix: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      Semi-Expendable Prefix
                    </label>
                    <input
                      type="text"
                      value={propertyConfig.sePrefix}
                      onChange={(e) =>
                        setPropertyConfig({
                          ...propertyConfig,
                          sePrefix: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      Separator
                    </label>
                    <input
                      type="text"
                      value={propertyConfig.separator}
                      onChange={(e) =>
                        setPropertyConfig({
                          ...propertyConfig,
                          separator: e.target.value,
                        })
                      }
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none text-center font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      Padding
                    </label>
                    <input
                      type="number"
                      value={propertyConfig.padding}
                      onChange={(e) =>
                        setPropertyConfig({
                          ...propertyConfig,
                          padding: parseInt(e.target.value) || 0,
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
                      value={propertyConfig.startNumber}
                      onChange={(e) =>
                        setPropertyConfig({
                          ...propertyConfig,
                          startNumber: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() =>
                      setPropertyConfig({
                        ...propertyConfig,
                        includeYear: !propertyConfig.includeYear,
                      })
                    }
                    className={`w-8 h-4 rounded-full flex items-center px-1 transition-colors ${propertyConfig.includeYear ? "bg-blue-600 justify-end" : "bg-zinc-300 dark:bg-zinc-700 justify-start"}`}
                  >
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  </button>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Include Year in Number
                  </span>
                </div>
              </div>
              <div className="p-6 rounded-3xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 flex flex-col justify-center space-y-4">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  Preview - PPE
                </span>
                <p className="text-3xl font-mono font-black text-zinc-900 dark:text-white tracking-tighter">
                  {propertyConfig.ppePrefix}
                  {propertyConfig.separator}
                  {propertyConfig.includeYear
                    ? `${new Date().getFullYear()}${propertyConfig.separator}`
                    : ""}
                  {String(propertyConfig.startNumber).padStart(propertyConfig.padding, "0")}
                </p>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  Preview - Semi-Expendable
                </span>
                <p className="text-3xl font-mono font-black text-zinc-900 dark:text-white tracking-tighter">
                  {propertyConfig.sePrefix}
                  {propertyConfig.separator}
                  {propertyConfig.includeYear
                    ? `${new Date().getFullYear()}${propertyConfig.separator}`
                    : ""}
                  {String(propertyConfig.startNumber).padStart(propertyConfig.padding, "0")}
                </p>
              </div>
            </div>
          </Card>

          <Card
            title="Custody Document Number Format"
            description="Configure ICS (Inventory Custodian Slip) and PAR (Property Acknowledgement Receipt) numbering"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      ICS Prefix
                    </label>
                    <input
                      type="text"
                      value={propertyConfig.icsPrefix}
                      onChange={(e) =>
                        setPropertyConfig({
                          ...propertyConfig,
                          icsPrefix: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      PAR Prefix
                    </label>
                    <input
                      type="text"
                      value={propertyConfig.parPrefix}
                      onChange={(e) =>
                        setPropertyConfig({
                          ...propertyConfig,
                          parPrefix: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      Separator
                    </label>
                    <input
                      type="text"
                      value={propertyConfig.custodySeparator}
                      onChange={(e) =>
                        setPropertyConfig({
                          ...propertyConfig,
                          custodySeparator: e.target.value,
                        })
                      }
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none text-center font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      Padding
                    </label>
                    <input
                      type="number"
                      value={propertyConfig.custodyPadding}
                      onChange={(e) =>
                        setPropertyConfig({
                          ...propertyConfig,
                          custodyPadding: parseInt(e.target.value) || 0,
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
                      value={propertyConfig.custodyStartNumber}
                      onChange={(e) =>
                        setPropertyConfig({
                          ...propertyConfig,
                          custodyStartNumber: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() =>
                      setPropertyConfig({
                        ...propertyConfig,
                        custodyIncludeYear: !propertyConfig.custodyIncludeYear,
                      })
                    }
                    className={`w-8 h-4 rounded-full flex items-center px-1 transition-colors ${propertyConfig.custodyIncludeYear ? "bg-blue-600 justify-end" : "bg-zinc-300 dark:bg-zinc-700 justify-start"}`}
                  >
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  </button>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Include Year in Number
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 flex gap-3">
                  <Info size={18} className="text-zinc-400 shrink-0" />
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                    ICS is used for semi-expendable property, PAR for PPE. These prefixes will appear on custody documents when issuing assets.
                  </p>
                </div>
              </div>
              <div className="p-6 rounded-3xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 flex flex-col justify-center space-y-4">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  Preview - ICS
                </span>
                <p className="text-3xl font-mono font-black text-zinc-900 dark:text-white tracking-tighter">
                  {propertyConfig.icsPrefix}
                  {propertyConfig.custodySeparator}
                  {propertyConfig.custodyIncludeYear
                    ? `${new Date().getFullYear()}${propertyConfig.custodySeparator}`
                    : ""}
                  {String(propertyConfig.custodyStartNumber).padStart(propertyConfig.custodyPadding, "0")}
                </p>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  Preview - PAR
                </span>
                <p className="text-3xl font-mono font-black text-zinc-900 dark:text-white tracking-tighter">
                  {propertyConfig.parPrefix}
                  {propertyConfig.custodySeparator}
                  {propertyConfig.custodyIncludeYear
                    ? `${new Date().getFullYear()}${propertyConfig.custodySeparator}`
                    : ""}
                  {String(propertyConfig.custodyStartNumber).padStart(propertyConfig.custodyPadding, "0")}
                </p>
              </div>
            </div>
          </Card>

          <Card
            title="Entity Configuration"
            description="Organization name used on printed documents (ICS, PAR, reports)"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Entity Name
                  </label>
                  <input
                    type="text"
                    value={propertyConfig.entityName}
                    onChange={(e) =>
                      setPropertyConfig({
                        ...propertyConfig,
                        entityName: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Audit Schedule
                  </label>
                  <select
                    value={propertyConfig.auditSchedule}
                    onChange={(e) =>
                      setPropertyConfig({
                        ...propertyConfig,
                        auditSchedule: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none font-bold"
                  >
                    <option>Quarterly (Every 3 months)</option>
                    <option>Semi-Annual (Every 6 months)</option>
                    <option>Annual (Every 12 months)</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {propertySubTab === "master" && (
        <div className="space-y-6">
          <Card
            title="Asset Categories"
            description="Define categories for PPE and Semi-Expendable property classification"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest">
                  Active Categories
                </h4>
                <button
                  onClick={addPropertyCategory}
                  className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1"
                >
                  <Plus size={12} /> Add Category
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {propertyCategories.map((cat: any) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-[8px] font-black uppercase ${cat.assetClass === "PPE" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "bg-amber-50 dark:bg-amber-900/20 text-amber-600"}`}
                      >
                        {cat.assetClass === "PPE" ? "PPE" : "SE"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">
                          {cat.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                            {cat.assetClass}
                          </span>
                          <span className="text-zinc-300">•</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={cat.usefulLife || ""}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || undefined;
                                setPropertyCategories((prev: any[]) =>
                                  prev.map((c) =>
                                    c.id === cat.id ? { ...c, usefulLife: val } : c,
                                  ),
                                );
                              }}
                              className="w-12 bg-transparent border-b border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 text-center outline-none focus:border-blue-500 transition-colors py-0.5"
                              placeholder="—"
                            />
                            <span className="text-[8px] font-bold text-zinc-400 uppercase">
                              yrs
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removePropertyCategory(cat.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card
            title="Office Locations"
            description="Manage valid locations for asset assignment and tracking"
          >
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {propertyConfig.locations.map((loc: string) => (
                  <Badge
                    key={loc}
                    variant="info"
                    className="!py-2 !px-4 flex items-center gap-2 group"
                  >
                    {loc}
                    <button
                      onClick={() => removePropertyLocation(loc)}
                      className="text-blue-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </Badge>
                ))}
                <button
                  onClick={addPropertyLocation}
                  className="px-4 py-2 rounded-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all flex items-center gap-2"
                >
                  <Plus size={14} /> Add Location
                </button>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 flex gap-3">
                <Info size={18} className="text-zinc-400 shrink-0" />
                <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                  Locations defined here will appear as options when registering or editing assets in the Property module.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {propertySubTab === "danger" && (
        <Card
          title="Danger Zone"
          description="Irreversible system-wide actions for property data management"
          className="!border-red-200 dark:!border-red-900/30"
        >
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-3xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 gap-6">
              <div>
                <h4 className="text-sm font-black text-red-700 dark:text-red-400 uppercase tracking-tight">
                  Purge All Property Data
                </h4>
                <p className="text-xs text-red-600/70 mt-1 leading-relaxed">
                  Removes all registered assets, custody records, transactions, inventory events, and audit logs. Categories and configuration will be preserved.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={handlePurgeProperty}
                className="bg-red-600 text-white hover:bg-red-700 !px-8 h-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]"
              >
                Wipe Property Data
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default React.memo(PropertySettingsTab);
