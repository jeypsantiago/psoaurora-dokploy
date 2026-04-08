import React from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { Button, Card } from "../../components/ui";
import type { LandingConfig } from "../../LandingConfigContext";
import {
  type FooterEditSection,
  type PortalDragSection,
  type TeamMember,
  type FooterRelatedLink,
  type FooterAboutLink,
  type FooterContactInfo,
  type UploadState,
} from "./portalTypes";
import { PortalFooterSection } from "./PortalFooterSection";
import { PortalHighlightsSection } from "./PortalHighlightsSection";
import { PortalHeroSection } from "./PortalHeroSection";
import { PortalTeamSection } from "./PortalTeamSection";

interface PortalConfigurationTabProps {
  landingConfigForm: LandingConfig;
  setLandingConfigForm: React.Dispatch<React.SetStateAction<LandingConfig>>;
  landingConfig: LandingConfig;
  hasUnsavedLandingChanges: boolean;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  heroPreviewFailedSrc: string | null;
  setHeroPreviewFailedSrc: React.Dispatch<React.SetStateAction<string | null>>;
  portalDrag: { section: PortalDragSection; index: number } | null;
  setPortalDrag: React.Dispatch<
    React.SetStateAction<{ section: PortalDragSection; index: number } | null>
  >;
  editingTeamMemberId: string | null;
  setEditingTeamMemberId: React.Dispatch<React.SetStateAction<string | null>>;
  editingFooterItem: { section: FooterEditSection; index: number } | null;
  setEditingFooterItem: React.Dispatch<
    React.SetStateAction<{ section: FooterEditSection; index: number } | null>
  >;
  heroUpload: UploadState;
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
  updateHeroBackgroundImage: (
    file?: File,
    fileInput?: HTMLInputElement | null,
  ) => void;
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
  getGenderBasedStyle: (
    gender: "male" | "female" | "neutral",
    index: number,
  ) => "psa" | "amber" | "mint" | "ocean" | "rose";
}

export const PortalConfigurationTab: React.FC<PortalConfigurationTabProps> = ({
  landingConfigForm,
  setLandingConfigForm,
  landingConfig,
  hasUnsavedLandingChanges,
  setActiveTab,
  heroPreviewFailedSrc,
  setHeroPreviewFailedSrc,
  portalDrag,
  setPortalDrag,
  editingTeamMemberId,
  setEditingTeamMemberId,
  editingFooterItem,
  setEditingFooterItem,
  heroUpload,
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
  updateHeroBackgroundImage,
  updateFooterRelatedLink,
  updateFooterAboutLink,
  updateFooterContact,
  removeFooterItem,
  handleSave,
  getGenderBasedStyle,
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
      <Card
        title="Portal Configuration (Landing Page)"
        description="Edit live content used by the PSA-themed landing page. Save changes to publish updates instantly."
      >
        <div className="flex flex-col gap-8">
          <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/20 p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">
                  Quick Setup Guide
                </p>
                <p className="mt-2 text-sm text-blue-900/85 dark:text-blue-200/90">
                  1) Update Hero text, 2) Add or edit Team members, 3) Update
                  Highlights and Footer links, 4) Click Save Changes.
                </p>
                {hasUnsavedLandingChanges && (
                  <p className="mt-3 text-[11px] font-semibold text-blue-900/90 dark:text-blue-100/90">
                    You have unsaved landing edits.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="!py-1.5 !px-3 h-auto text-[11px]"
                  onClick={() => setActiveTab("connectivity")}
                >
                  <ShieldCheck size={13} className="mr-1" /> Open Connectivity
                  Tab
                </Button>
                <Button
                  variant="ghost"
                  className="!py-1.5 !px-3 h-auto text-[11px]"
                  onClick={() => setLandingConfigForm(landingConfig)}
                >
                  <RefreshCw size={13} className="mr-1" /> Discard Unsaved
                </Button>
                <Button
                  variant="ghost"
                  className="!py-1.5 !px-3 h-auto text-[11px]"
                  onClick={resetTeamVisualStyle}
                >
                  <RefreshCw size={13} className="mr-1" /> Reset Team Visuals
                </Button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="!py-1.5 !px-3 h-auto text-[10px]"
                onClick={() =>
                  document.getElementById("portal-hero-section")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
              >
                Hero
              </Button>
              <Button
                variant="outline"
                className="!py-1.5 !px-3 h-auto text-[10px]"
                onClick={() =>
                  document.getElementById("portal-team-section")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
              >
                Team
              </Button>
              <Button
                variant="outline"
                className="!py-1.5 !px-3 h-auto text-[10px]"
                onClick={() =>
                  document
                    .getElementById("portal-highlights-section")
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                }
              >
                Highlights
              </Button>
              <Button
                variant="outline"
                className="!py-1.5 !px-3 h-auto text-[10px]"
                onClick={() =>
                  document.getElementById("portal-footer-section")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
              >
                Footer
              </Button>
            </div>
          </div>

          <PortalHeroSection
            landingConfigForm={landingConfigForm}
            setLandingConfigForm={setLandingConfigForm}
            heroPreviewFailedSrc={heroPreviewFailedSrc}
            setHeroPreviewFailedSrc={setHeroPreviewFailedSrc}
            heroUpload={heroUpload}
            updateHeroBackgroundImage={updateHeroBackgroundImage}
          />
          <PortalTeamSection
            landingConfigForm={landingConfigForm}
            setLandingConfigForm={setLandingConfigForm}
            portalDrag={portalDrag}
            setPortalDrag={setPortalDrag}
            editingTeamMemberId={editingTeamMemberId}
            setEditingTeamMemberId={setEditingTeamMemberId}
            teamImageUpload={teamImageUpload}
            isSavingSettings={isSavingSettings}
            resetTeamVisualStyle={resetTeamVisualStyle}
            movePortalItem={movePortalItem}
            updateTeamMemberProjectsFromText={updateTeamMemberProjectsFromText}
            updateTeamMember={updateTeamMember}
            addTeamMember={addTeamMember}
            removeTeamMember={removeTeamMember}
            updateTeamMemberImage={updateTeamMemberImage}
            applyTeamSampleImage={applyTeamSampleImage}
            handleSave={handleSave}
            getGenderBasedStyle={getGenderBasedStyle}
          />
          <PortalHighlightsSection
            landingConfigForm={landingConfigForm}
            setLandingConfigForm={setLandingConfigForm}
          />
          <PortalFooterSection
            landingConfigForm={landingConfigForm}
            setLandingConfigForm={setLandingConfigForm}
            portalDrag={portalDrag}
            setPortalDrag={setPortalDrag}
            editingFooterItem={editingFooterItem}
            setEditingFooterItem={setEditingFooterItem}
            isSavingSettings={isSavingSettings}
            movePortalItem={movePortalItem}
            updateFooterRelatedLink={updateFooterRelatedLink}
            updateFooterAboutLink={updateFooterAboutLink}
            updateFooterContact={updateFooterContact}
            removeFooterItem={removeFooterItem}
            handleSave={handleSave}
          />
        </div>
      </Card>
    </div>
  );
};
