import React from "react";
import { FileCheck, Database as DatabaseIcon, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Card, Button, Badge } from "../../components/ui";

type AnyEmploymentSettingsProps = Record<string, any>;

export const EmploymentSettingsTab: React.FC<AnyEmploymentSettingsProps> = (props) => {
  const {
    employmentSubTab,
    setEmploymentSubTab,
    employmentConfig,
    setEmploymentConfig,
    surveyProjects,
    removeSurveyProject,
    addSurveyProject,
    focalPersons,
    removeFocalPerson,
    addFocalPerson,
    designations,
    removeDesignation,
    addDesignation,
    handlePurgeEmployment,
  } = props;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl w-fit">
        <button
          onClick={() => setEmploymentSubTab("config")}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${employmentSubTab === "config" ? "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-white shadow-sm" : "text-zinc-500"}`}
        >
          <FileCheck size={14} /> Serial Config
        </button>
        <button
          onClick={() => setEmploymentSubTab("master")}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${employmentSubTab === "master" ? "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-white shadow-sm" : "text-zinc-500"}`}
        >
          <DatabaseIcon size={14} /> Master Data
        </button>
        <button
          onClick={() => setEmploymentSubTab("danger")}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${employmentSubTab === "danger" ? "bg-red-500 text-white" : "text-zinc-500 hover:text-red-500"}`}
        >
          <AlertTriangle size={14} /> Danger Zone
        </button>
      </div>

      {employmentSubTab === "config" && (
        <Card
          title="Employment Records Config"
          description="Configure automatic numbering for contracts/COE"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Serial Prefix
                  </label>
                  <input
                    type="text"
                    value={employmentConfig.prefix}
                    onChange={(e) =>
                      setEmploymentConfig({
                        ...employmentConfig,
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
                    value={employmentConfig.separator}
                    onChange={(e) =>
                      setEmploymentConfig({
                        ...employmentConfig,
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
                    value={employmentConfig.padding}
                    onChange={(e) =>
                      setEmploymentConfig({
                        ...employmentConfig,
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
                    value={employmentConfig.increment}
                    onChange={(e) =>
                      setEmploymentConfig({
                        ...employmentConfig,
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
                    value={employmentConfig.startNumber}
                    onChange={(e) =>
                      setEmploymentConfig({
                        ...employmentConfig,
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
                {employmentConfig.prefix}
                {employmentConfig.separator}
                {String(employmentConfig.startNumber).padStart(employmentConfig.padding, "0")}
              </p>
              <p className="text-[10px] text-blue-600/60 font-medium mt-4 leading-relaxed">
                Generated Serial Numbers are unique to personnel employment records.
              </p>
            </div>
          </div>
        </Card>
      )}

      {employmentSubTab === "master" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            title="Survey / Project Master"
            description="Manage projects for assignments"
          >
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {surveyProjects.map((proj: string) => (
                  <Badge
                    key={proj}
                    variant="info"
                    className="!py-2 !px-4 flex items-center gap-2 group"
                  >
                    {proj}
                    <button
                      onClick={() => removeSurveyProject(proj)}
                      className="text-blue-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </Badge>
                ))}
                <button
                  onClick={addSurveyProject}
                  className="px-4 py-2 rounded-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all flex items-center gap-2"
                >
                  <Plus size={14} /> Add Project
                </button>
              </div>
            </div>
          </Card>
          <Card
            title="Focal Person Master"
            description="Manage signers for contracts"
          >
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {focalPersons.map((person: string) => (
                  <Badge
                    key={person}
                    variant="default"
                    className="!py-2 !px-4 flex items-center gap-2 group"
                  >
                    {person}
                    <button
                      onClick={() => removeFocalPerson(person)}
                      className="text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </Badge>
                ))}
                <button
                  onClick={addFocalPerson}
                  className="px-4 py-2 rounded-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all flex items-center gap-2"
                >
                  <Plus size={14} /> Add Person
                </button>
              </div>
            </div>
          </Card>
          <Card
            title="Designation Master"
            description="Manage job titles for employment records"
          >
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {designations.map((title: string) => (
                  <Badge
                    key={title}
                    variant="info"
                    className="!py-2 !px-4 flex items-center gap-2 group"
                  >
                    {title}
                    <button
                      onClick={() => removeDesignation(title)}
                      className="text-blue-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </Badge>
                ))}
                <button
                  onClick={addDesignation}
                  className="px-4 py-2 rounded-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all flex items-center gap-2"
                >
                  <Plus size={14} /> Add Designation
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {employmentSubTab === "danger" && (
        <Card
          title="Danger Zone"
          description="Irreversible system-wide actions for employment records"
          className="!border-red-200 dark:!border-red-900/30"
        >
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-3xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 gap-6">
              <div>
                <h4 className="text-sm font-black text-red-700 dark:text-red-400 uppercase tracking-tight">
                  Purge All Employment Records
                </h4>
                <p className="text-xs text-red-600/70 mt-1 leading-relaxed">
                  Removes all created contracts permanently. Use cautiously.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={handlePurgeEmployment}
                className="bg-red-600 text-white hover:bg-red-700 !px-8 h-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]"
              >
                Wipe Records
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default React.memo(EmploymentSettingsTab);
