import React from "react";
import { FileText, Database as DatabaseIcon, Fingerprint, Plus, Settings, Edit2, Trash2, Link as LinkIcon } from "lucide-react";
import { Card, Button } from "../../components/ui";

type AnyRecordSettingsProps = Record<string, any>;

export const RecordSettingsTab: React.FC<AnyRecordSettingsProps> = (props) => {
  const {
    recordSubTab,
    setRecordSubTab,
    docTypes,
    docFields,
    dataCollections,
    selectedCollection,
    setSelectedCollection,
    addNewDocType,
    toggleDocType,
    openBuilder,
    openRefModal,
    openRenameModal,
    deleteDocType,
    handlePurgeRecords,
    addCollection,
    deleteCollection,
    addCollectionItem,
    removeCollectionItem,
  } = props;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
      <Card
        title="Registry & Records"
        description="Manage document schemas, reference formats and data collections"
        action={
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl min-w-max overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setRecordSubTab("docs")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${recordSubTab === "docs" ? "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-white shadow-sm" : "text-zinc-500"}`}
            >
              <FileText size={12} /> Document Types
            </button>
            <button
              onClick={() => setRecordSubTab("collections")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${recordSubTab === "collections" ? "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-white shadow-sm" : "text-zinc-500"}`}
            >
              <DatabaseIcon size={12} /> Data Collections
            </button>
          </div>
        }
      >
        {recordSubTab === "docs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest">
                  Available Schemas
                </h4>
                <button
                  onClick={addNewDocType}
                  className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1"
                >
                  <Plus size={12} /> New Type
                </button>
              </div>
              <div className="space-y-3">
                {docTypes.map((doc, i) => (
                  <div
                    key={doc.id}
                    className="flex flex-col p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText
                          size={16}
                          className={doc.enabled ? "text-blue-500" : "text-zinc-400"}
                        />
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-bold truncate ${doc.enabled ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`}
                          >
                            {doc.name}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tight">
                            {docFields[doc.id]?.length || 0} Fields
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleDocType(i)}
                          className={`w-8 h-4 rounded-full flex items-center px-1 transition-colors ${doc.enabled ? "bg-blue-600 justify-end" : "bg-zinc-300 dark:bg-zinc-700 justify-start"}`}
                        >
                          <div className="w-2.5 h-2.5 bg-white rounded-full" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                      <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        <div className="flex items-center gap-1">
                          <Fingerprint size={12} className="text-zinc-300" />{" "}
                          {doc.refPrefix}
                          {doc.refSeparator}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {doc.enabled && (
                          <button
                            onClick={() => openBuilder(doc.id)}
                            title="Schema Builder"
                            className="p-1.5 text-zinc-400 hover:text-blue-600 transition-colors"
                          >
                            <Settings size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => openRefModal(doc)}
                          title="ID Generator Settings"
                          className="p-1.5 text-zinc-400 hover:text-amber-500 transition-colors"
                        >
                          <Fingerprint size={14} />
                        </button>
                        <button
                          onClick={() => openRenameModal(doc)}
                          title="Rename"
                          className="p-1.5 text-zinc-400 hover:text-emerald-600 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteDocType(doc.id)}
                          title="Delete"
                          className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-2">
                Reference Code Format
              </h4>
              <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/10 border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 font-medium mb-4 leading-relaxed">
                  Reference IDs are automatically generated for every new record based on the provincial format. You can customize the prefix, separator and starting sequence for each document category.
                </p>
                <div className="space-y-3">
                  {docTypes.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between text-[11px] font-bold"
                    >
                      <span className="text-zinc-400 uppercase tracking-tight">
                        {doc.name}
                      </span>
                      <code className="px-2 py-0.5 bg-white dark:bg-black rounded border border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-white">
                        {doc.refPrefix}
                        {doc.refSeparator}
                        {String(doc.refStart).padStart(doc.refPadding, "0")}
                      </code>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    onClick={handlePurgeRecords}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-dashed border-red-200 dark:border-red-500/30 transition-all"
                  >
                    <Trash2 size={14} /> Purge All Registry Records
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {recordSubTab === "collections" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in duration-300">
            <div className="md:col-span-4 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest">
                  Global Collections
                </h4>
                <button
                  onClick={addCollection}
                  className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-1">
                {Object.keys(dataCollections).map((key) => (
                  <div
                    key={key}
                    onClick={() => setSelectedCollection(key)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${selectedCollection === key ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400" : "bg-transparent border-transparent text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900"}`}
                  >
                    <div className="flex items-center gap-3">
                      <DatabaseIcon size={14} />
                      <span className="text-sm font-bold">{key}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold opacity-60">
                        {dataCollections[key].length}
                      </span>
                      {selectedCollection === key && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCollection(key);
                          }}
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-1 rounded-lg"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-8">
              {selectedCollection ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest">
                      Manage Items: {selectedCollection}
                    </h4>
                    <Button
                      variant="ghost"
                      className="!py-1.5 !px-3 h-auto text-[10px]"
                      onClick={() => addCollectionItem(selectedCollection)}
                    >
                      <Plus size={12} className="mr-2" /> Add Item
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {dataCollections[selectedCollection].map((item: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 group"
                      >
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                          {item}
                        </span>
                        <button
                          onClick={() => removeCollectionItem(selectedCollection, idx)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-10 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl bg-zinc-50/30 dark:bg-zinc-900/10">
                  <LinkIcon
                    size={32}
                    className="text-zinc-200 dark:text-zinc-800 mb-4"
                  />
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.1em]">
                    Select a collection to manage its data
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default React.memo(RecordSettingsTab);
