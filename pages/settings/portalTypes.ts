import type { FileUploadState } from "../../hooks/useFileUpload";
import type { LandingConfig } from "../../LandingConfigContext";

export type UploadState = FileUploadState;
export type PortalDragSection =
  | "metrics"
  | "relatedLinks"
  | "aboutLinks"
  | "contactInfo"
  | "teamMembers";
export type FooterEditSection = "relatedLinks" | "aboutLinks" | "contactInfo";
export type TeamMember = LandingConfig["team"]["members"][number];
export type FooterRelatedLink = LandingConfig["footer"]["relatedLinks"][number];
export type FooterAboutLink = LandingConfig["footer"]["aboutLinks"][number];
export type FooterContactInfo = LandingConfig["footer"]["contactInfo"][number];
export type EditingFooterData =
  | { section: "relatedLinks"; index: number; item: FooterRelatedLink }
  | { section: "aboutLinks"; index: number; item: FooterAboutLink }
  | { section: "contactInfo"; index: number; item: FooterContactInfo };
