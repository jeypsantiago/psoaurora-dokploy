import React, { useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  GripVertical,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { Button, Input, Modal } from "../../components/ui";
import type { LandingConfig } from "../../LandingConfigContext";
import type {
  EditingFooterData,
  FooterAboutLink,
  FooterContactInfo,
  FooterEditSection,
  FooterRelatedLink,
  PortalDragSection,
} from "./portalTypes";

interface PortalFooterSectionProps {
  landingConfigForm: LandingConfig;
  setLandingConfigForm: React.Dispatch<React.SetStateAction<LandingConfig>>;
  portalDrag: { section: PortalDragSection; index: number } | null;
  setPortalDrag: React.Dispatch<
    React.SetStateAction<{ section: PortalDragSection; index: number } | null>
  >;
  editingFooterItem: { section: FooterEditSection; index: number } | null;
  setEditingFooterItem: React.Dispatch<
    React.SetStateAction<{ section: FooterEditSection; index: number } | null>
  >;
  isSavingSettings: boolean;
  movePortalItem: (section: PortalDragSection, from: number, to: number) => void;
  updateFooterRelatedLink: (
    linkIndex: number,
    updates: Partial<FooterRelatedLink>,
  ) => void;
  updateFooterAboutLink: (
    linkIndex: number,
    updates: Partial<FooterAboutLink>,
  ) => void;
  updateFooterContact: (
    contactIndex: number,
    updates: Partial<FooterContactInfo>,
  ) => void;
  removeFooterItem: (section: FooterEditSection, itemIndex: number) => void;
  handleSave: () => Promise<boolean>;
}

export const PortalFooterSection: React.FC<PortalFooterSectionProps> = ({
  landingConfigForm,
  setLandingConfigForm,
  portalDrag,
  setPortalDrag,
  editingFooterItem,
  setEditingFooterItem,
  isSavingSettings,
  movePortalItem,
  updateFooterRelatedLink,
  updateFooterAboutLink,
  updateFooterContact,
  removeFooterItem,
  handleSave,
}) => {
  const editingFooterData = useMemo<EditingFooterData | null>(() => {
    if (!editingFooterItem) return null;

    if (editingFooterItem.section === "relatedLinks") {
      return {
        section: "relatedLinks",
        index: editingFooterItem.index,
        item: landingConfigForm.footer.relatedLinks[editingFooterItem.index],
      };
    }

    if (editingFooterItem.section === "aboutLinks") {
      return {
        section: "aboutLinks",
        index: editingFooterItem.index,
        item: landingConfigForm.footer.aboutLinks[editingFooterItem.index],
      };
    }

    return {
      section: "contactInfo",
      index: editingFooterItem.index,
      item: landingConfigForm.footer.contactInfo[editingFooterItem.index],
    };
  }, [
    editingFooterItem,
    landingConfigForm.footer.aboutLinks,
    landingConfigForm.footer.contactInfo,
    landingConfigForm.footer.relatedLinks,
  ]);

  return (
    <div id="portal-footer-section" className="order-4">
      <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4">
        Footer Section
      </h4>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
        Maintain official links and contact details for public reference.
      </p>

      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Related Links
            </p>
            <Button
              variant="outline"
              className="!py-1.5 !px-3 h-auto text-[10px]"
              onClick={() => {
                const relatedLinks = [
                  ...landingConfigForm.footer.relatedLinks,
                  { label: "New Link", url: "#" },
                ];
                setLandingConfigForm({
                  ...landingConfigForm,
                  footer: {
                    ...landingConfigForm.footer,
                    relatedLinks,
                  },
                });
              }}
            >
              <Plus size={14} className="mr-1" /> Add Link
            </Button>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {landingConfigForm.footer.relatedLinks.map((link, idx) => (
              <div
                key={`related-${idx}`}
                draggable
                onDragStart={() =>
                  setPortalDrag({
                    section: "relatedLinks",
                    index: idx,
                  })
                }
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!portalDrag || portalDrag.section !== "relatedLinks")
                    return;
                  movePortalItem("relatedLinks", portalDrag.index, idx);
                  setPortalDrag(null);
                }}
                onDragEnd={() => setPortalDrag(null)}
                className={`p-3 rounded-xl border bg-zinc-50 dark:bg-zinc-900 transition-all ${portalDrag?.section === "relatedLinks" && portalDrag.index === idx ? "border-blue-400 opacity-70" : "border-zinc-200 dark:border-zinc-800"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {link.label || `Related Link ${idx + 1}`}
                    </p>
                    <p className="text-[11px] text-blue-700 dark:text-blue-300 break-all mt-1">
                      {link.url || "#"}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 inline-flex items-center gap-1 shrink-0">
                    <GripVertical size={11} /> #{idx + 1}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-200/70 dark:border-zinc-800/70">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      className="!p-1.5 h-auto"
                      onClick={() => movePortalItem("relatedLinks", idx, idx - 1)}
                      disabled={idx === 0}
                      aria-label={`Move related link ${idx + 1} up`}
                    >
                      <ChevronUp size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      className="!p-1.5 h-auto"
                      onClick={() => movePortalItem("relatedLinks", idx, idx + 1)}
                      disabled={idx === landingConfigForm.footer.relatedLinks.length - 1}
                      aria-label={`Move related link ${idx + 1} down`}
                    >
                      <ChevronDown size={14} />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      className="!py-1.5 !px-3 h-auto text-[10px]"
                      onClick={() =>
                        setEditingFooterItem({ section: "relatedLinks", index: idx })
                      }
                    >
                      <Edit2 size={12} className="mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      className="!py-1.5 !px-2.5 h-auto text-[10px] text-red-600 hover:text-red-700"
                      onClick={() => removeFooterItem("relatedLinks", idx)}
                      disabled={landingConfigForm.footer.relatedLinks.length <= 1}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              About Links
            </p>
            <Button
              variant="outline"
              className="!py-1.5 !px-3 h-auto text-[10px]"
              onClick={() => {
                const aboutLinks = [
                  ...landingConfigForm.footer.aboutLinks,
                  { label: "New Link", url: "#" },
                ];
                setLandingConfigForm({
                  ...landingConfigForm,
                  footer: {
                    ...landingConfigForm.footer,
                    aboutLinks,
                  },
                });
              }}
            >
              <Plus size={14} className="mr-1" /> Add Link
            </Button>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {landingConfigForm.footer.aboutLinks.map((link, idx) => (
              <div
                key={`about-${idx}`}
                draggable
                onDragStart={() =>
                  setPortalDrag({
                    section: "aboutLinks",
                    index: idx,
                  })
                }
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!portalDrag || portalDrag.section !== "aboutLinks")
                    return;
                  movePortalItem("aboutLinks", portalDrag.index, idx);
                  setPortalDrag(null);
                }}
                onDragEnd={() => setPortalDrag(null)}
                className={`p-3 rounded-xl border bg-zinc-50 dark:bg-zinc-900 transition-all ${portalDrag?.section === "aboutLinks" && portalDrag.index === idx ? "border-blue-400 opacity-70" : "border-zinc-200 dark:border-zinc-800"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {link.label || `About Link ${idx + 1}`}
                    </p>
                    <p className="text-[11px] text-blue-700 dark:text-blue-300 break-all mt-1">
                      {link.url || "#"}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 inline-flex items-center gap-1 shrink-0">
                    <GripVertical size={11} /> #{idx + 1}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-200/70 dark:border-zinc-800/70">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      className="!p-1.5 h-auto"
                      onClick={() => movePortalItem("aboutLinks", idx, idx - 1)}
                      disabled={idx === 0}
                      aria-label={`Move about link ${idx + 1} up`}
                    >
                      <ChevronUp size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      className="!p-1.5 h-auto"
                      onClick={() => movePortalItem("aboutLinks", idx, idx + 1)}
                      disabled={idx === landingConfigForm.footer.aboutLinks.length - 1}
                      aria-label={`Move about link ${idx + 1} down`}
                    >
                      <ChevronDown size={14} />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      className="!py-1.5 !px-3 h-auto text-[10px]"
                      onClick={() =>
                        setEditingFooterItem({ section: "aboutLinks", index: idx })
                      }
                    >
                      <Edit2 size={12} className="mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      className="!py-1.5 !px-2.5 h-auto text-[10px] text-red-600 hover:text-red-700"
                      onClick={() => removeFooterItem("aboutLinks", idx)}
                      disabled={landingConfigForm.footer.aboutLinks.length <= 1}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Contact Info
            </p>
            <Button
              variant="outline"
              className="!py-1.5 !px-3 h-auto text-[10px]"
              onClick={() => {
                const contactInfo = [
                  ...landingConfigForm.footer.contactInfo,
                  { label: "New Contact", value: "" },
                ];
                setLandingConfigForm({
                  ...landingConfigForm,
                  footer: {
                    ...landingConfigForm.footer,
                    contactInfo,
                  },
                });
              }}
            >
              <Plus size={14} className="mr-1" /> Add Contact
            </Button>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            {landingConfigForm.footer.contactInfo.map((info, idx) => (
              <div
                key={`contact-${idx}`}
                draggable
                onDragStart={() =>
                  setPortalDrag({
                    section: "contactInfo",
                    index: idx,
                  })
                }
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!portalDrag || portalDrag.section !== "contactInfo")
                    return;
                  movePortalItem("contactInfo", portalDrag.index, idx);
                  setPortalDrag(null);
                }}
                onDragEnd={() => setPortalDrag(null)}
                className={`p-3 rounded-xl border bg-zinc-50 dark:bg-zinc-900 transition-all ${portalDrag?.section === "contactInfo" && portalDrag.index === idx ? "border-blue-400 opacity-70" : "border-zinc-200 dark:border-zinc-800"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {info.label || `Contact ${idx + 1}`}
                    </p>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300 break-words mt-1">
                      {info.value || "No value set"}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 inline-flex items-center gap-1 shrink-0">
                    <GripVertical size={11} /> #{idx + 1}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-200/70 dark:border-zinc-800/70">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      className="!p-1.5 h-auto"
                      onClick={() => movePortalItem("contactInfo", idx, idx - 1)}
                      disabled={idx === 0}
                      aria-label={`Move contact ${idx + 1} up`}
                    >
                      <ChevronUp size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      className="!p-1.5 h-auto"
                      onClick={() => movePortalItem("contactInfo", idx, idx + 1)}
                      disabled={idx === landingConfigForm.footer.contactInfo.length - 1}
                      aria-label={`Move contact ${idx + 1} down`}
                    >
                      <ChevronDown size={14} />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      className="!py-1.5 !px-3 h-auto text-[10px]"
                      onClick={() =>
                        setEditingFooterItem({ section: "contactInfo", index: idx })
                      }
                    >
                      <Edit2 size={12} className="mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      className="!py-1.5 !px-2.5 h-auto text-[10px] text-red-600 hover:text-red-700"
                      onClick={() => removeFooterItem("contactInfo", idx)}
                      disabled={landingConfigForm.footer.contactInfo.length <= 1}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Modal
          isOpen={!!editingFooterData}
          onClose={() => setEditingFooterItem(null)}
          title={
            editingFooterData?.section === "relatedLinks"
              ? `Edit Related Link #${(editingFooterItem?.index ?? 0) + 1}`
              : editingFooterData?.section === "aboutLinks"
                ? `Edit About Link #${(editingFooterItem?.index ?? 0) + 1}`
                : `Edit Contact #${(editingFooterItem?.index ?? 0) + 1}`
          }
          maxWidth="max-w-2xl"
          footer={
            <Button
              variant="blue"
              className="rounded-xl px-6"
              onClick={async () => {
                const saved = await handleSave();
                if (saved) setEditingFooterItem(null);
              }}
              disabled={isSavingSettings}
            >
              {isSavingSettings ? (
                <RefreshCw size={14} className="mr-1.5 animate-spin" />
              ) : (
                <Save size={14} className="mr-1.5" />
              )}
              Save
            </Button>
          }
        >
          {editingFooterData && editingFooterItem && (
            <div className="grid grid-cols-1 gap-4">
              {editingFooterData.section === "contactInfo" ? (
                <>
                  <Input
                    label="Contact Label"
                    value={(editingFooterData.item as FooterContactInfo).label}
                    onChange={(e) =>
                      updateFooterContact(editingFooterItem.index, {
                        label: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Contact Value"
                    value={(editingFooterData.item as FooterContactInfo).value}
                    onChange={(e) =>
                      updateFooterContact(editingFooterItem.index, {
                        value: e.target.value,
                      })
                    }
                  />
                </>
              ) : (
                <>
                  <Input
                    label="Link Label"
                    value={
                      (
                        editingFooterData.item as
                          | FooterRelatedLink
                          | FooterAboutLink
                      ).label
                    }
                    onChange={(e) => {
                      if (editingFooterData.section === "relatedLinks") {
                        updateFooterRelatedLink(editingFooterItem.index, {
                          label: e.target.value,
                        });
                      } else {
                        updateFooterAboutLink(editingFooterItem.index, {
                          label: e.target.value,
                        });
                      }
                    }}
                  />
                  <Input
                    label="Link URL"
                    value={
                      (
                        editingFooterData.item as
                          | FooterRelatedLink
                          | FooterAboutLink
                      ).url
                    }
                    onChange={(e) => {
                      if (editingFooterData.section === "relatedLinks") {
                        updateFooterRelatedLink(editingFooterItem.index, {
                          url: e.target.value,
                        });
                      } else {
                        updateFooterAboutLink(editingFooterItem.index, {
                          url: e.target.value,
                        });
                      }
                    }}
                  />
                </>
              )}
            </div>
          )}
        </Modal>

        <Input
          label="Footer Copyright"
          value={landingConfigForm.footer.copyright}
          onChange={(e) =>
            setLandingConfigForm({
              ...landingConfigForm,
              footer: {
                ...landingConfigForm.footer,
                copyright: e.target.value,
              },
            })
          }
        />
      </div>

      <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300">
        Tip: Hero, team, highlights, and footer fields here map directly to the
        current landing page components.
      </div>
    </div>
  );
};
