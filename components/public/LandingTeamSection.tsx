import React, { useCallback, useEffect } from "react";
import { User, X } from "lucide-react";
import { RevealSection } from "./RevealSection";
import { resolveMediaSource } from "../../services/mediaAssets";
import type { LandingConfig } from "../../LandingConfigContext";

type TeamMember = LandingConfig["team"]["members"][number];

type TeamEntry = { member: TeamMember; index: number };
type TeamPanelLayout = {
  memberId: string;
  placement: "left" | "right";
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

interface LandingTeamSectionProps {
  teamTitle: string;
  teamSubtitle: string;
  teamEntries: TeamEntry[];
  pinnedTeamMemberId: string | null;
  setPinnedTeamMemberId: React.Dispatch<React.SetStateAction<string | null>>;
  hoveredTeamMemberId: string | null;
  setHoveredTeamMemberId: React.Dispatch<React.SetStateAction<string | null>>;
  teamPanelLayout: TeamPanelLayout | null;
  setTeamPanelLayout: React.Dispatch<React.SetStateAction<TeamPanelLayout | null>>;
  teamCardRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  teamCardButtonRefs: React.MutableRefObject<Record<string, HTMLButtonElement | null>>;
  teamPanelRef: React.MutableRefObject<HTMLDivElement | null>;
  failedTeamImages: Record<string, boolean>;
  setFailedTeamImages: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  resetTeamCardStyle: (memberId: string) => void;
}

const TEAM_CARD_BASE_SHADOW = "0 12px 28px rgba(0,51,102,0.07)";
const TEAM_CARD_ACTIVE_SHADOW =
  "0 18px 34px rgba(0,51,102,0.15), 0 8px 16px rgba(2,6,23,0.10)";

export const LandingTeamSection: React.FC<LandingTeamSectionProps> = ({
  teamTitle,
  teamSubtitle,
  teamEntries,
  pinnedTeamMemberId,
  setPinnedTeamMemberId,
  hoveredTeamMemberId,
  setHoveredTeamMemberId,
  teamPanelLayout,
  setTeamPanelLayout,
  teamCardRefs,
  teamCardButtonRefs,
  teamPanelRef,
  failedTeamImages,
  setFailedTeamImages,
  resetTeamCardStyle,
}) => {
  const leadEntry = teamEntries[0];
  const staffEntries = teamEntries.slice(1);
  const activeTeamMemberId = pinnedTeamMemberId ?? hoveredTeamMemberId;
  const activeTeamMember =
    teamEntries.find((entry) => entry.member.id === activeTeamMemberId)?.member ??
    null;

  const localTeamSamples = [
    "/team-sample-1.svg",
    "/team-sample-2.svg",
    "/team-sample-3.svg",
    "/team-sample-4.svg",
  ];

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "PS";
    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  const updatePopoverPlacement = useCallback((memberId: string) => {
    const card = teamCardRefs.current[memberId];
    if (!card) return;

    const bounds = card.getBoundingClientRect();
    const viewportPadding = 12;
    const gap = 12;
    const panelWidth = Math.min(372, window.innerWidth - viewportPadding * 2);
    const maxHeight = Math.max(240, window.innerHeight - viewportPadding * 2);
    const estimatedPanelHeight = Math.min(320, maxHeight);
    const canUseSidePlacement = window.innerWidth >= 768;
    const canOpenRight =
      bounds.right + gap + panelWidth <= window.innerWidth - viewportPadding;
    const placement: "left" | "right" = canUseSidePlacement
      ? canOpenRight
        ? "right"
        : "left"
      : "right";

    const left = canUseSidePlacement
      ? placement === "right"
        ? bounds.right + gap
        : bounds.left - gap - panelWidth
      : Math.min(
          Math.max(
            bounds.left + bounds.width / 2 - panelWidth / 2,
            viewportPadding,
          ),
          window.innerWidth - panelWidth - viewportPadding,
        );

    const preferredTop = canUseSidePlacement
      ? bounds.top + bounds.height / 2 - estimatedPanelHeight / 2
      : bounds.bottom + 10;
    const maxTop = Math.max(
      viewportPadding,
      window.innerHeight - estimatedPanelHeight - viewportPadding,
    );
    const top = Math.min(Math.max(preferredTop, viewportPadding), maxTop);

    setTeamPanelLayout({
      memberId,
      placement,
      top,
      left,
      width: panelWidth,
      maxHeight,
    });
  }, [setTeamPanelLayout, teamCardRefs]);

  useEffect(() => {
    if (!activeTeamMemberId) {
      setTeamPanelLayout(null);
      return;
    }

    const handleResize = () => updatePopoverPlacement(activeTeamMemberId);
    const handleScroll = () => updatePopoverPlacement(activeTeamMemberId);
    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [activeTeamMemberId, updatePopoverPlacement, setTeamPanelLayout]);

  useEffect(() => {
    if (!pinnedTeamMemberId) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const panelContainsTarget = teamPanelRef.current?.contains(target);
      const cardContainsTarget =
        teamCardRefs.current[pinnedTeamMemberId]?.contains(target);
      if (!panelContainsTarget && !cardContainsTarget) {
        setPinnedTeamMemberId(null);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPinnedTeamMemberId(null);
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [pinnedTeamMemberId, setPinnedTeamMemberId, teamCardRefs, teamPanelRef]);

  useEffect(() => {
    if (
      !teamPanelLayout ||
      !activeTeamMember ||
      teamPanelLayout.memberId !== activeTeamMember.id ||
      !teamPanelRef.current
    )
      return;

    const fromRotation = teamPanelLayout.placement === "right" ? -14 : 14;
    teamPanelRef.current.animate(
      [
        {
          transform: `perspective(1200px) rotateY(${fromRotation}deg) translateY(8px) scale(0.98)`,
        },
        {
          transform: "perspective(1200px) rotateY(0deg) translateY(0) scale(1)",
        },
      ],
      {
        duration: 280,
        easing: "cubic-bezier(0.22,1,0.36,1)",
      },
    );
  }, [activeTeamMember, teamPanelLayout, teamPanelRef]);

  const renderTeamCard = (
    member: TeamMember,
    idx: number,
    delay: number,
    featured = false,
  ) => {
    const isPinned = pinnedTeamMemberId === member.id;
    const isHovered = hoveredTeamMemberId === member.id;
    const isPreviewOpen = isPinned || isHovered;
    const gender = member.gender || "neutral";
    const fallbackStyle: Array<"psa" | "amber" | "mint" | "ocean" | "rose"> = [
      "psa",
      "amber",
      "mint",
      "ocean",
      "rose",
    ];
    const genderDefaultStyle =
      gender === "male"
        ? idx % 2 === 0
          ? "ocean"
          : "mint"
        : gender === "female"
          ? idx % 2 === 0
            ? "amber"
            : "rose"
          : fallbackStyle[idx % fallbackStyle.length];
    const useLogoBackground = member.backgroundMode
      ? member.backgroundMode === "logo"
      : idx === 0
        ? false
        : false;
    const visualStyle = useLogoBackground
      ? "psa"
      : member.visualStyle && member.visualStyle !== "psa"
        ? member.visualStyle
        : genderDefaultStyle;
    const imageScale =
      typeof member.imageScale === "number" ? member.imageScale : 1.03;
    const imageOffsetY =
      (typeof member.imageOffsetY === "number" ? member.imageOffsetY : 0) + 8;
    const fallbackImage = localTeamSamples[idx % localTeamSamples.length];
    const resolvedImage = failedTeamImages[member.id]
      ? fallbackImage
      : resolveMediaSource(member.image || fallbackImage);

    return (
      <RevealSection key={member.id} delay={delay}>
        <article
          ref={(element) => {
            teamCardRefs.current[member.id] = element;
          }}
          className={`group relative rounded-2xl border bg-gradient-to-b from-white to-psa-surface dark:from-[#121212] dark:to-[#0a0a0a] border-psa-line dark:border-zinc-800 overflow-visible transition-all duration-300 ${featured ? "max-w-[520px] mx-auto" : ""} ${isPreviewOpen ? "ring-2 ring-psa-blue/25 border-psa-blue/35 z-20 -translate-y-0.5" : "hover:border-psa-blue/30 hover:-translate-y-0.5"}`}
          style={
            {
              boxShadow: TEAM_CARD_BASE_SHADOW,
            } as React.CSSProperties
          }
          onMouseEnter={() => {
            updatePopoverPlacement(member.id);
            setHoveredTeamMemberId(member.id);
            const card = teamCardRefs.current[member.id];
            if (card) {
              card.style.boxShadow = TEAM_CARD_ACTIVE_SHADOW;
            }
          }}
          onMouseLeave={(event) => {
            const nextTarget = event.relatedTarget as Node | null;
            if (nextTarget && teamPanelRef.current?.contains(nextTarget)) {
              return;
            }
            setHoveredTeamMemberId(null);
            resetTeamCardStyle(member.id);
          }}
        >
          <button
            ref={(element) => {
              teamCardButtonRefs.current[member.id] = element;
            }}
            type="button"
            className="w-full text-left transition-transform duration-200 ease-out will-change-transform"
            style={{
              transform:
                "perspective(1400px) rotateX(0deg) rotateY(0deg) scale(1)",
              backfaceVisibility: "hidden",
            }}
            onClick={() => {
              updatePopoverPlacement(member.id);
              setPinnedTeamMemberId((prev) =>
                prev === member.id ? null : member.id,
              );
            }}
            onFocus={() => {
              updatePopoverPlacement(member.id);
              setHoveredTeamMemberId(member.id);
              const card = teamCardRefs.current[member.id];
              if (card) {
                card.style.boxShadow = TEAM_CARD_ACTIVE_SHADOW;
              }
            }}
            onBlur={() => {
              setHoveredTeamMemberId((prev) =>
                prev === member.id ? null : prev,
              );
              if (pinnedTeamMemberId !== member.id) {
                resetTeamCardStyle(member.id);
              }
            }}
            aria-expanded={isPreviewOpen}
          >
            <div
              className={`pointer-events-none absolute inset-x-4 top-0 h-12 bg-gradient-to-r from-transparent via-white/80 dark:via-slate-300/35 to-transparent transition-opacity duration-500 ${isPreviewOpen ? "opacity-100" : "opacity-0 group-hover:opacity-70"}`}
            />
            {featured ? (
              <div
                className={`relative h-[12.9rem] overflow-visible rounded-t-2xl bg-white dark:bg-[#0a0a0a] transition-all duration-300 ${isPreviewOpen ? "ring-2 ring-inset ring-psa-blue/35" : ""}`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(0,86,179,0.10),transparent_42%),radial-gradient(circle_at_86%_20%,rgba(206,17,38,0.08),transparent_34%)]" />
                <img
                  src="/PSA.png"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 m-auto h-[98%] w-[98%] object-contain opacity-[0.16] saturate-0 contrast-75"
                />
                <div className="absolute left-1/2 bottom-2 -translate-x-1/2 w-[44%] h-10 bg-[radial-gradient(ellipse_at_center,rgba(0,51,102,0.20),transparent_70%)]" />

                {resolvedImage ? (
                  <img
                    src={resolvedImage}
                    alt={member.name}
                    className={`absolute z-10 left-1/2 -translate-x-1/2 bottom-0 h-[130%] w-auto max-w-none object-contain object-bottom drop-shadow-[0_28px_36px_rgba(2,6,23,0.36)] transition-all duration-500 ${isPreviewOpen ? "scale-[1.1] saturate-115 brightness-105 contrast-110" : "scale-[1.02]"}`}
                    style={{
                      transform: `translateX(-50%) translateY(${imageOffsetY}px) scale(${isPreviewOpen ? imageScale + 0.04 : imageScale})`,
                      backfaceVisibility: "hidden",
                    }}
                    onError={() => {
                      setFailedTeamImages((prev) => ({
                        ...prev,
                        [member.id]: true,
                      }));
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="w-20 h-20 rounded-3xl bg-white dark:bg-[#121212] border border-psa-line dark:border-zinc-700 text-2xl font-bold text-psa-navy flex items-center justify-center shadow-md">
                      {getInitials(member.name)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`relative h-[12.7rem] overflow-visible rounded-t-2xl border-b border-psa-line dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] transition-all duration-300 ${isPreviewOpen ? "ring-2 ring-inset ring-psa-blue/35" : ""}`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(0,86,179,0.10),transparent_42%),radial-gradient(circle_at_86%_20%,rgba(206,17,38,0.08),transparent_34%)]" />
                <img
                  src="/PSA.png"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 m-auto h-[98%] w-[98%] object-contain opacity-[0.16] saturate-0 contrast-75"
                />
                <div className="absolute left-1/2 bottom-2 -translate-x-1/2 w-[44%] h-10 bg-[radial-gradient(ellipse_at_center,rgba(0,51,102,0.20),transparent_70%)]" />

                {resolvedImage ? (
                  <img
                    src={resolvedImage}
                    alt={member.name}
                    className={`absolute left-1/2 bottom-0 ${visualStyle === "psa" ? "h-[126%] drop-shadow-[0_22px_26px_rgba(2,6,23,0.28)]" : "h-[121%] drop-shadow-[0_16px_20px_rgba(2,6,23,0.20)]"} w-auto max-w-none -translate-x-1/2 object-contain object-bottom transition-all duration-500 ${isPreviewOpen ? "scale-[1.06] saturate-110 brightness-105 contrast-110" : "scale-100"}`}
                    style={{
                      transform: `translateX(-50%) translateY(${imageOffsetY}px) scale(${isPreviewOpen ? imageScale + 0.03 : imageScale})`,
                      backfaceVisibility: "hidden",
                    }}
                    onError={() => {
                      setFailedTeamImages((prev) => ({
                        ...prev,
                        [member.id]: true,
                      }));
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="w-20 h-20 rounded-3xl bg-white dark:bg-[#121212] border border-psa-line dark:border-zinc-700 text-2xl font-bold text-psa-navy flex items-center justify-center shadow-md">
                      {getInitials(member.name)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className={`px-4 py-3.5 ${featured ? "text-center" : ""}`}>
              <p
                className={`font-semibold text-[clamp(0.88rem,1.05vw,1.03rem)] text-psa-navy leading-snug hover:text-psa-blue whitespace-nowrap ${featured ? "mx-auto" : ""}`}
                title={member.name}
              >
                {member.name}
              </p>
              <p
                className={`mt-1 text-[clamp(0.72rem,0.82vw,0.86rem)] text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap ${featured ? "mx-auto" : ""}`}
                title={member.designation || "PSA Team Member"}
              >
                {member.designation || "PSA Team Member"}
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.12em] text-slate-700 dark:text-slate-300 font-bold">
                {member.projects.length} project
                {member.projects.length === 1 ? "" : "s"} assigned
              </p>
            </div>
          </button>
        </article>
      </RevealSection>
    );
  };

  return (
    <section
      id="team"
      className="public-container -mt-1 public-section-y-compact relative z-[2]"
    >
      <RevealSection>
        <div className="rounded-3xl border border-psa-line bg-white dark:bg-[#0b0b0b] dark:border-zinc-800 p-6 sm:p-8 lg:p-10 public-shadow-medium">
          <div className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-psa-blue font-semibold">
                  Employee Directory
                </p>
                <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-psa-navy">
                  {teamTitle}
                </h2>
                <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                  {teamSubtitle}
                </p>
              </div>
            </div>
          </div>

          {leadEntry && (
            <div className="mb-7 sm:mb-8">
              {renderTeamCard(leadEntry.member, leadEntry.index, 0, true)}
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 sm:gap-6">
            {staffEntries.map((entry, position) =>
              renderTeamCard(entry.member, entry.index, 70 + position * 90),
            )}
          </div>
        </div>
      </RevealSection>

      {typeof document !== "undefined" &&
        activeTeamMember &&
        teamPanelLayout &&
        teamPanelLayout.memberId === activeTeamMember.id &&
        activeTeamMember && (
          <>
            {pinnedTeamMemberId && (
              <button
                type="button"
                onClick={() => setPinnedTeamMemberId(null)}
                className="fixed inset-0 z-[2190] bg-psa-navy/24 dark:bg-black/60"
                aria-label="Close project panel backdrop"
              />
            )}
            <div
              ref={teamPanelRef}
              className="fixed z-[2200] will-change-transform"
              style={{
                top: `${teamPanelLayout.top}px`,
                left: `${teamPanelLayout.left}px`,
                width: `${teamPanelLayout.width}px`,
                maxHeight: `${teamPanelLayout.maxHeight}px`,
                transformOrigin:
                  teamPanelLayout.placement === "right"
                    ? "left center"
                    : "right center",
              }}
            >
              <div
                className="relative h-full overflow-y-auto rounded-[28px] border border-blue-200/70 dark:border-blue-400/30 bg-white dark:bg-[#07111f] shadow-[0_28px_70px_rgba(0,51,102,0.28)] p-4 sm:p-5"
                onMouseEnter={() => setHoveredTeamMemberId(activeTeamMember.id)}
                onMouseLeave={(event) => {
                  const nextTarget = event.relatedTarget as Node | null;
                  if (
                    nextTarget &&
                    teamCardRefs.current[activeTeamMember.id]?.contains(
                      nextTarget,
                    )
                  ) {
                    return;
                  }
                  if (pinnedTeamMemberId !== activeTeamMember.id) {
                    setHoveredTeamMemberId(null);
                    resetTeamCardStyle(activeTeamMember.id);
                  }
                }}
              >
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500" />
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
                  <div className="absolute -top-16 right-4 h-32 w-32 rounded-full bg-blue-500/8 blur-3xl" />
                  <div className="absolute -bottom-14 left-2 h-28 w-28 rounded-full bg-cyan-500/10 blur-3xl" />
                </div>

                <div className="relative">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-psa-blue via-blue-600 to-cyan-500 text-white shadow-[0_12px_24px_rgba(0,86,179,0.28)]">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-psa-blue">
                          Active Projects
                        </p>
                        <h3 className="mt-1 truncate text-base font-semibold text-slate-900 dark:text-white">
                          {activeTeamMember.name}
                        </h3>
                        <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">
                          {activeTeamMember.designation || "PSA Team Member"}
                        </p>
                      </div>
                    </div>
                    {pinnedTeamMemberId && (
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200/80 dark:border-zinc-700 bg-white/95 dark:bg-black/80 text-slate-500 dark:text-slate-300 hover:text-psa-blue transition-colors"
                        onClick={() => setPinnedTeamMemberId(null)}
                        aria-label={`Close project panel for ${activeTeamMember.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${pinnedTeamMemberId ? "border-blue-200/80 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-100" : "border-slate-200 bg-slate-50 text-slate-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-300"}`}
                    >
                      {pinnedTeamMemberId ? "Pinned" : "Preview"}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:border-zinc-700 dark:bg-zinc-950/70 dark:text-slate-300">
                      {activeTeamMember.projects.length} project
                      {activeTeamMember.projects.length === 1 ? "" : "s"}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-cyan-200/80 bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-100">
                      Hover card or pin
                    </span>
                  </div>

                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-slate-500 dark:text-slate-400">
                      Assigned work
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {pinnedTeamMemberId
                        ? "Click outside to dismiss"
                        : "Move away to dismiss"}
                    </p>
                  </div>

                  <div className="max-h-48 overflow-y-auto pr-1 space-y-2.5">
                    {activeTeamMember.projects.length > 0 ? (
                      activeTeamMember.projects.map((project, projectIdx) => (
                        <div
                          key={`${activeTeamMember.id}-${project}`}
                          className="group flex items-start gap-3 rounded-2xl border border-slate-200/85 bg-slate-50/90 dark:border-zinc-700/80 dark:bg-zinc-900/70 px-3 py-3 transition-all duration-300 hover:border-blue-300/70 hover:bg-white dark:hover:border-blue-400/35 dark:hover:bg-zinc-900"
                          style={{
                            transitionDelay: `${projectIdx * 40}ms`,
                          }}
                        >
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-blue-200/70 bg-white text-[11px] font-black text-psa-blue dark:border-blue-400/30 dark:bg-zinc-950 dark:text-blue-100">
                            {String(projectIdx + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                              {project}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              Active assignment linked to this employee profile
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/85 dark:border-zinc-700/80 dark:bg-zinc-900/50 px-4 py-5 text-center">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          No projects listed yet.
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Assign a project in the landing config to show it here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
    </section>
  );
};
