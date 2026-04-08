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
import { Badge, Button, Input, Modal, UploadProgressInline } from "../../components/ui";
import { resolveMediaSource } from "../../services/mediaAssets";
import type { LandingConfig } from "../../LandingConfigContext";
import type { TeamMember, PortalDragSection, UploadState } from "./portalTypes";

interface PortalTeamSectionProps {
  landingConfigForm: LandingConfig;
  setLandingConfigForm: React.Dispatch<React.SetStateAction<LandingConfig>>;
  portalDrag: { section: PortalDragSection; index: number } | null;
  setPortalDrag: React.Dispatch<
    React.SetStateAction<{ section: PortalDragSection; index: number } | null>
  >;
  editingTeamMemberId: string | null;
  setEditingTeamMemberId: React.Dispatch<React.SetStateAction<string | null>>;
  teamImageUpload: UploadState;
  isSavingSettings: boolean;
  resetTeamVisualStyle: () => void;
  movePortalItem: (section: PortalDragSection, from: number, to: number) => void;
  updateTeamMemberProjectsFromText: (
    memberIndex: number,
    rawValue: string,
  ) => void;
  updateTeamMember: (memberIndex: number, updates: Partial<TeamMember>) => void;
  addTeamMember: () => void;
  removeTeamMember: (index: number) => void;
  updateTeamMemberImage: (
    index: number,
    file?: File,
    fileInput?: HTMLInputElement | null,
  ) => void;
  applyTeamSampleImage: (index: number) => void;
  handleSave: () => Promise<boolean>;
  getGenderBasedStyle: (
    gender: "male" | "female" | "neutral",
    index: number,
  ) => "psa" | "amber" | "mint" | "ocean" | "rose";
}

export const PortalTeamSection: React.FC<PortalTeamSectionProps> = ({
  landingConfigForm,
  setLandingConfigForm,
  portalDrag,
  setPortalDrag,
  editingTeamMemberId,
  setEditingTeamMemberId,
  teamImageUpload,
  isSavingSettings,
  resetTeamVisualStyle,
  movePortalItem,
  updateTeamMemberProjectsFromText,
  updateTeamMember,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberImage,
  applyTeamSampleImage,
  handleSave,
  getGenderBasedStyle,
}) => {
  const editingTeamMemberIndex = useMemo(
    () =>
      landingConfigForm.team.members.findIndex(
        (member) => member.id === editingTeamMemberId,
      ),
    [landingConfigForm.team.members, editingTeamMemberId],
  );
  const editingTeamMember =
    editingTeamMemberIndex >= 0
      ? landingConfigForm.team.members[editingTeamMemberIndex]
      : null;

  return (
    <div id="portal-team-section" className="order-2">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4">
        <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest">
          Team Section
        </h4>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="!py-1.5 !px-3 h-auto text-[10px]"
            onClick={resetTeamVisualStyle}
          >
            <RefreshCw size={14} className="mr-1" /> Reset Visual Style
          </Button>
          <Button
            variant="outline"
            className="!py-1.5 !px-3 h-auto text-[10px]"
            onClick={addTeamMember}
          >
            <Plus size={14} className="mr-1" /> Add Member
          </Button>
        </div>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
        Compact member cards for quick management. Click{" "}
        <span className="font-semibold">Edit</span> to open full details.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Input
          label="Team Section Title"
          value={landingConfigForm.team.title}
          onChange={(e) =>
            setLandingConfigForm({
              ...landingConfigForm,
              team: {
                ...landingConfigForm.team,
                title: e.target.value,
              },
            })
          }
        />
        <Input
          label="Team Section Subtitle"
          value={landingConfigForm.team.subtitle}
          onChange={(e) =>
            setLandingConfigForm({
              ...landingConfigForm,
              team: {
                ...landingConfigForm.team,
                subtitle: e.target.value,
              },
            })
          }
        />
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
            First Card Background
          </label>
          <select
            value={landingConfigForm.team.firstCardBackgroundMode || "psa"}
            onChange={(e) => {
              const mode = e.target.value as "psa" | "color";
              setLandingConfigForm({
                ...landingConfigForm,
                team: {
                  ...landingConfigForm.team,
                  firstCardBackgroundMode: mode,
                },
              });
            }}
            className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="psa">PSA Logo</option>
            <option value="color">Color Background</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {landingConfigForm.team.members.map((member, idx) => (
          <div
            key={member.id}
            draggable
            onDragStart={() =>
              setPortalDrag({
                section: "teamMembers",
                index: idx,
              })
            }
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (!portalDrag || portalDrag.section !== "teamMembers") return;
              movePortalItem("teamMembers", portalDrag.index, idx);
              setPortalDrag(null);
            }}
            onDragEnd={() => setPortalDrag(null)}
            className={`p-3 bg-zinc-50 dark:bg-zinc-900 border rounded-xl transition-all ${portalDrag?.section === "teamMembers" && portalDrag.index === idx ? "border-blue-400 opacity-70" : "border-zinc-200 dark:border-zinc-800"}`}
          >
            <div className="flex items-start gap-3">
              {member.image ? (
                <img
                  src={resolveMediaSource(member.image)}
                  alt={member.name || "Team member preview"}
                  className="w-12 h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 object-contain object-center bg-white dark:bg-zinc-950 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400 shrink-0">
                  No Photo
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {member.name || `Team Member ${idx + 1}`}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {member.designation || "Designation"}
                </p>
                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                  <Badge variant="default" className="!text-[9px] !px-1.5 !py-0">
                    {member.gender || "neutral"}
                  </Badge>
                  <Badge variant="info" className="!text-[9px] !px-1.5 !py-0">
                    {member.visualStyle || "amber"}
                  </Badge>
                  <Badge
                    variant="success"
                    className="!text-[9px] !px-1.5 !py-0"
                  >
                    {member.projects.length} project
                    {member.projects.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-1">
                  {member.projects.length > 0
                    ? member.projects.join(", ")
                    : "No projects set"}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-200/70 dark:border-zinc-800/70">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  className="!p-1.5 h-auto"
                  onClick={() => movePortalItem("teamMembers", idx, idx - 1)}
                  disabled={idx === 0}
                  aria-label={`Move team member ${idx + 1} up`}
                >
                  <ChevronUp size={14} />
                </Button>
                <Button
                  variant="ghost"
                  className="!p-1.5 h-auto"
                  onClick={() => movePortalItem("teamMembers", idx, idx + 1)}
                  disabled={idx === landingConfigForm.team.members.length - 1}
                  aria-label={`Move team member ${idx + 1} down`}
                >
                  <ChevronDown size={14} />
                </Button>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 inline-flex items-center gap-1">
                  <GripVertical size={11} /> Drag
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  className="!py-1.5 !px-3 h-auto text-[10px]"
                  onClick={() => setEditingTeamMemberId(member.id)}
                >
                  <Edit2 size={12} className="mr-1" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  className="!py-1.5 !px-2.5 h-auto text-[10px] text-red-600 hover:text-red-700"
                  onClick={() => removeTeamMember(idx)}
                  disabled={landingConfigForm.team.members.length <= 1}
                  title="Remove member"
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={!!editingTeamMember}
        onClose={() => setEditingTeamMemberId(null)}
        title={
          editingTeamMember
            ? `Edit Team Member: ${editingTeamMember.name || "Unnamed"}`
            : "Edit Team Member"
        }
        maxWidth="max-w-4xl"
        footer={
          <Button
            variant="blue"
            className="rounded-xl px-6"
            onClick={async () => {
              const saved = await handleSave();
              if (saved) setEditingTeamMemberId(null);
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
        {editingTeamMember && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Member Name"
              value={editingTeamMember.name}
              onChange={(e) =>
                updateTeamMember(editingTeamMemberIndex, {
                  name: e.target.value,
                })
              }
            />

            <Input
              label="Designation"
              value={editingTeamMember.designation}
              onChange={(e) =>
                updateTeamMember(editingTeamMemberIndex, {
                  designation: e.target.value,
                })
              }
            />

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                Gender
              </label>
              <select
                value={editingTeamMember.gender || "neutral"}
                onChange={(e) => {
                  const nextGender = e.target.value as
                    | "male"
                    | "female"
                    | "neutral";
                  updateTeamMember(editingTeamMemberIndex, {
                    gender: nextGender,
                    visualStyle: getGenderBasedStyle(
                      nextGender,
                      editingTeamMemberIndex,
                    ),
                  });
                }}
                className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                Card Background Mode
              </label>
              <select
                value={
                  editingTeamMember.backgroundMode ||
                  (editingTeamMemberIndex === 0 &&
                  landingConfigForm.team.firstCardBackgroundMode === "psa"
                    ? "logo"
                    : "color")
                }
                onChange={(e) => {
                  const mode = e.target.value as "logo" | "color";
                  const nextGender = editingTeamMember.gender || "neutral";
                  updateTeamMember(editingTeamMemberIndex, {
                    backgroundMode: mode,
                    visualStyle:
                      mode === "logo"
                        ? "psa"
                        : getGenderBasedStyle(nextGender, editingTeamMemberIndex),
                  });
                }}
                className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="logo">PSA Logo</option>
                <option value="color">Color Background</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                Background Style
              </label>
              <select
                value={editingTeamMember.visualStyle || "amber"}
                onChange={(e) => {
                  const nextStyle = e.target.value as
                    | "psa"
                    | "amber"
                    | "mint"
                    | "ocean"
                    | "rose";
                  updateTeamMember(editingTeamMemberIndex, {
                    backgroundMode: nextStyle === "psa" ? "logo" : "color",
                    visualStyle: nextStyle,
                  });
                }}
                className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="psa">PSA Signature</option>
                <option value="amber">Amber Studio</option>
                <option value="mint">Mint Studio</option>
                <option value="ocean">Ocean Studio</option>
                <option value="rose">Rose Studio</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                Projects (comma-separated)
              </label>
              <textarea
                value={editingTeamMember.projects.join(", ")}
                onChange={(e) =>
                  updateTeamMemberProjectsFromText(
                    editingTeamMemberIndex,
                    e.target.value,
                  )
                }
                rows={2}
                className="w-full mt-1 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="CBMS Field Validation, Civil Registration Audit, Data Quality Review"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                Member Image
              </label>
              <input
                type="file"
                accept="image/*"
                onPointerDown={() => {
                  void teamImageUpload.prepare();
                }}
                onFocus={() => {
                  void teamImageUpload.prepare();
                }}
                onChange={(e) =>
                  updateTeamMemberImage(
                    editingTeamMemberIndex,
                    e.target.files?.[0],
                    e.currentTarget,
                  )
                }
                className="w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white hover:file:bg-blue-700"
              />
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Up to 10MB. Images upload to backend files when available;
                otherwise they stay local preview only.
              </p>
              <UploadProgressInline
                visible={teamImageUpload.status !== "idle" && !!teamImageUpload.message}
                message={teamImageUpload.message}
                progressPercent={teamImageUpload.progressPercent}
                tone={teamImageUpload.tone}
                showProgress={teamImageUpload.isUploading}
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="!py-1.5 !px-3 h-auto text-[10px]"
                  onClick={() => applyTeamSampleImage(editingTeamMemberIndex)}
                >
                  Use Sample Photo
                </Button>
                <Button
                  variant="ghost"
                  className="!py-1.5 !px-3 h-auto text-[10px]"
                  onClick={() =>
                    updateTeamMember(editingTeamMemberIndex, { image: "" })
                  }
                  disabled={!editingTeamMember.image}
                >
                  Clear Image
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                Preview
              </label>
              {editingTeamMember.image ? (
                <img
                  src={resolveMediaSource(editingTeamMember.image)}
                  alt={editingTeamMember.name || "Team member preview"}
                  className="w-24 h-24 rounded-xl border border-zinc-200 dark:border-zinc-800 object-contain object-center bg-white dark:bg-zinc-950"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  No image
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                Image Scale
              </label>
              <input
                type="range"
                min="0.9"
                max="1.2"
                step="0.01"
                value={editingTeamMember.imageScale ?? 1.03}
                onChange={(e) =>
                  updateTeamMember(editingTeamMemberIndex, {
                    imageScale: Number(e.target.value),
                  })
                }
                className="w-full"
              />
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {(editingTeamMember.imageScale ?? 1.03).toFixed(2)}x
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                Vertical Offset
              </label>
              <input
                type="range"
                min="-24"
                max="24"
                step="1"
                value={editingTeamMember.imageOffsetY ?? 0}
                onChange={(e) =>
                  updateTeamMember(editingTeamMemberIndex, {
                    imageOffsetY: Number(e.target.value),
                  })
                }
                className="w-full"
              />
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {editingTeamMember.imageOffsetY ?? 0}px
              </p>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button
                variant="ghost"
                className="!py-1.5 !px-3 h-auto text-[10px] text-red-600 hover:text-red-700"
                onClick={() => removeTeamMember(editingTeamMemberIndex)}
                disabled={landingConfigForm.team.members.length <= 1}
              >
                <Trash2 size={14} className="mr-1" /> Remove Member
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
