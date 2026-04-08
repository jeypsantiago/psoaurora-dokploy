import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AURORA_MUNICIPALITY_GEOMETRIES } from '../../constants/auroraMunicipalityMap';
import {
  AURORA_MUNICIPALITIES,
  type AuroraMunicipality,
  type MunicipalityCycleStat,
} from '../../services/censusData';
import { useTheme } from '../../theme-context';
import { Theme } from '../../types';

interface AuroraMunicipalityHeatMapProps {
  stats?: MunicipalityCycleStat[];
  className?: string;
  compact?: boolean;
  showLegend?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
  showStatusAnimation?: boolean;
}

type MunicipalityStatusKey = 'no-target' | 'low' | 'steady' | 'strong' | 'complete';

interface MunicipalityRow {
  municipality: AuroraMunicipality;
  targetCount: number;
  completedCount: number;
  progress: number;
  statusKey: MunicipalityStatusKey;
}

interface MapTooltipState {
  row: MunicipalityRow;
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  direction: 'right' | 'left' | 'top' | 'bottom';
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const LABEL_HEIGHT = 8.8;
const MAP_VIEWBOX = {
  minX: -22,
  minY: -12,
  width: 148,
  height: 126,
};
const MAP_VIEWBOX_WITH_LABELS = `${MAP_VIEWBOX.minX} ${MAP_VIEWBOX.minY} ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`;

const labelPlacements: Record<AuroraMunicipality, { x: number; y: number; width: number }> = {
  Baler: { x: 45, y: 50, width: 23 },
  Casiguran: { x: 77, y: 16, width: 28 },
  Dilasag: { x: 76, y: -6, width: 27 },
  Dinalungan: { x: 50, y: 8, width: 31 },
  Dingalan: { x: -20, y: 85, width: 28 },
  Dipaculao: { x: 10, y: 26, width: 31 },
  'Maria Aurora': { x: -22, y: 40, width: 35 },
  'San Luis': { x: -20, y: 62, width: 27 },
};

const getMunicipalityFill = (targetCount: number, progress: number): string => {
  if (targetCount <= 0) return 'hsl(220 12% 90%)';
  const ratio = clamp(progress / 100, 0, 1);
  const hue = 204 - ratio * 34;
  const saturation = 55 + ratio * 26;
  const lightness = 86 - ratio * 44;
  return `hsl(${hue.toFixed(1)} ${saturation.toFixed(1)}% ${lightness.toFixed(1)}%)`;
};

const getMunicipalityStatusKey = (targetCount: number, progress: number): MunicipalityStatusKey => {
  if (targetCount <= 0) return 'no-target';
  if (progress >= 100) return 'complete';
  if (progress >= 85) return 'strong';
  if (progress >= 50) return 'steady';
  return 'low';
};

const getStatusMeta = (statusKey: MunicipalityStatusKey) => {
  switch (statusKey) {
    case 'low':
        return {
          label: 'Needs attention',
          color: '#d97706',
          percentClass: 'text-amber-600 dark:text-amber-200',
          labelClass: 'text-amber-700 dark:text-amber-200',
        boxFill: 'rgba(255, 244, 214, 0.98)',
        boxStroke: 'rgba(217, 119, 6, 0.50)',
      };
    case 'steady':
        return {
          label: 'In progress',
          color: '#2563eb',
          percentClass: 'text-blue-600 dark:text-blue-200',
          labelClass: 'text-blue-700 dark:text-blue-200',
        boxFill: 'rgba(219, 234, 254, 0.98)',
        boxStroke: 'rgba(37, 99, 235, 0.42)',
      };
    case 'strong':
        return {
          label: 'On track',
          color: '#059669',
          percentClass: 'text-emerald-600 dark:text-emerald-200',
          labelClass: 'text-emerald-700 dark:text-emerald-200',
        boxFill: 'rgba(209, 250, 229, 0.98)',
        boxStroke: 'rgba(5, 150, 105, 0.42)',
      };
    case 'complete':
        return {
          label: 'Completed',
          color: '#4f46e5',
          percentClass: 'text-indigo-600 dark:text-indigo-200',
          labelClass: 'text-indigo-700 dark:text-indigo-200',
        boxFill: 'rgba(224, 231, 255, 0.98)',
        boxStroke: 'rgba(79, 70, 229, 0.40)',
      };
    case 'no-target':
    default:
      return {
        label: 'No target',
        color: '#94a3b8',
        percentClass: 'text-slate-500 dark:text-slate-400',
        labelClass: 'text-slate-500 dark:text-slate-400',
        boxFill: 'rgba(241, 245, 249, 0.98)',
        boxStroke: 'rgba(148, 163, 184, 0.40)',
      };
  }
};

const getPercentLabel = (row: MunicipalityRow): string => {
  if (row.targetCount <= 0) return 'No target';
  return `${Math.round(row.progress)}%`;
};

const getCompletedLabel = (row: MunicipalityRow): string => `${row.completedCount}/${row.targetCount}`;

const getAnimationValues = (statusKey: MunicipalityStatusKey, compact: boolean) => {
  const baseRadius = compact ? 1.3 : 1.55;

  switch (statusKey) {
    case 'low':
      return {
        startRadius: baseRadius,
        endRadius: compact ? 4 : 4.8,
        duration: '1.5s',
        opacity: '0.7;0.08;0.7',
      };
    case 'steady':
      return {
        startRadius: baseRadius,
        endRadius: compact ? 3.6 : 4.4,
        duration: '1.8s',
        opacity: '0.62;0.08;0.62',
      };
    case 'strong':
      return {
        startRadius: baseRadius,
        endRadius: compact ? 3.3 : 4,
        duration: '2.1s',
        opacity: '0.55;0.08;0.55',
      };
    case 'complete':
      return {
        startRadius: baseRadius,
        endRadius: compact ? 2.9 : 3.4,
        duration: '2.6s',
        opacity: '0.4;0.08;0.4',
      };
    case 'no-target':
    default:
      return {
        startRadius: baseRadius,
        endRadius: compact ? 2.3 : 2.8,
        duration: '2.8s',
        opacity: '0.18;0.04;0.18',
      };
  }
};

export const AuroraMunicipalityHeatMap = React.memo(function AuroraMunicipalityHeatMap({
  stats = [],
  className = '',
  compact = false,
  showLegend = true,
  showLabels = true,
  showValues = false,
  showStatusAnimation = true,
}: AuroraMunicipalityHeatMapProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === Theme.DARK;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapCanvasRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [mapCanvasSize, setMapCanvasSize] = useState({ width: 0, height: 0 });
  const [hoverTooltip, setHoverTooltip] = useState<MapTooltipState | null>(null);
  const [pinnedTooltip, setPinnedTooltip] = useState<MapTooltipState | null>(null);

  const municipalityRows = useMemo<MunicipalityRow[]>(() => {
    const seeded = new Map(
      AURORA_MUNICIPALITIES.map((municipality) => [municipality, { municipality, targetCount: 0, completedCount: 0 }])
    );

    stats.forEach((stat) => {
      const existing = seeded.get(stat.municipality);
      if (!existing) return;
      const targetCount = Math.max(0, Math.round(Number(stat.targetCount) || 0));
      const completedCount = Math.min(Math.max(0, Math.round(Number(stat.completedCount) || 0)), targetCount);
      seeded.set(stat.municipality, {
        municipality: stat.municipality,
        targetCount,
        completedCount,
      });
    });

    return AURORA_MUNICIPALITIES.map((municipality) => {
      const row = seeded.get(municipality)!;
      const progress = row.targetCount > 0 ? clamp((row.completedCount / row.targetCount) * 100, 0, 100) : 0;
      return {
        ...row,
        progress,
        statusKey: getMunicipalityStatusKey(row.targetCount, progress),
      };
    });
  }, [stats]);

  const byMunicipality = useMemo(() => {
    return new Map(municipalityRows.map((row) => [row.municipality, row]));
  }, [municipalityRows]);

  const municipalityLabelChips = useMemo(() => {
    if (!showLabels || mapCanvasSize.width <= 0 || mapCanvasSize.height <= 0) return [];

    const scaleX = mapCanvasSize.width / MAP_VIEWBOX.width;
    const scaleY = mapCanvasSize.height / MAP_VIEWBOX.height;

    return AURORA_MUNICIPALITY_GEOMETRIES.map((geometry) => {
      const placement = labelPlacements[geometry.municipality];
      const row = byMunicipality.get(geometry.municipality);
      const interactiveRow = row ?? {
        municipality: geometry.municipality,
        targetCount: 0,
        completedCount: 0,
        progress: 0,
        statusKey: 'no-target' as const,
      };
      const tone = getStatusMeta(interactiveRow.statusKey);
      const isPinnedMunicipality = pinnedTooltip?.row.municipality === geometry.municipality;
      const left = (placement.x - MAP_VIEWBOX.minX) * scaleX;
      const top = (placement.y - MAP_VIEWBOX.minY) * scaleY;
      const width = placement.width * scaleX;
      const height = LABEL_HEIGHT * scaleY;

      return {
        municipality: geometry.municipality,
        geometry,
        placement,
        interactiveRow,
        percentLabel: getPercentLabel(interactiveRow),
        percentColor: isDarkTheme && interactiveRow.statusKey === 'low' ? '#fcd34d' : tone.color,
        isPinnedMunicipality,
        tone,
        style: {
          left,
          top,
          width,
          height,
          borderRadius: Math.max(8, height * 0.34),
          borderWidth: isPinnedMunicipality ? 1.5 : 1,
        },
        nameStyle: {
          fontSize: Math.max(compact ? 9 : 10, Math.min(compact ? 11 : 12, height * 0.31)),
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '0.01em',
        },
        percentStyle: {
          fontSize: Math.max(compact ? 10 : 11, Math.min(compact ? 12 : 13, height * 0.34)),
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: '0.01em',
        },
      };
    });
  }, [byMunicipality, compact, isDarkTheme, mapCanvasSize.height, mapCanvasSize.width, pinnedTooltip, showLabels]);

  const buildTooltipFromAnchor = (
    row: MunicipalityRow,
    anchorX: number,
    anchorY: number,
    bounds: DOMRect
  ): MapTooltipState => {
    const tooltipWidth = compact ? 188 : 224;
    const tooltipHeight = compact ? 84 : 92;
    const padding = 8;
    const gap = compact ? 10 : 12;
    const candidates = [
      { direction: 'right' as const, x: anchorX + gap, y: anchorY - tooltipHeight / 2 },
      { direction: 'left' as const, x: anchorX - gap - tooltipWidth, y: anchorY - tooltipHeight / 2 },
      { direction: 'top' as const, x: anchorX - tooltipWidth / 2, y: anchorY - gap - tooltipHeight },
      { direction: 'bottom' as const, x: anchorX - tooltipWidth / 2, y: anchorY + gap },
    ].map((candidate) => {
      const clampedX = clamp(candidate.x, padding, bounds.width - tooltipWidth - padding);
      const clampedY = clamp(candidate.y, padding, bounds.height - tooltipHeight - padding);
      const overflow = Math.abs(clampedX - candidate.x) + Math.abs(clampedY - candidate.y);
      return { ...candidate, x: clampedX, y: clampedY, overflow };
    });

    const bestCandidate = candidates.reduce((best, current) => (current.overflow < best.overflow ? current : best));
    return {
      row,
      x: bestCandidate.x,
      y: bestCandidate.y,
      width: tooltipWidth,
      height: tooltipHeight,
      anchorX,
      anchorY,
      direction: bestCandidate.direction,
    };
  };

  const buildTooltipFromPointer = (
    row: MunicipalityRow,
    geometry: (typeof AURORA_MUNICIPALITY_GEOMETRIES)[number]
  ): MapTooltipState | null => {
    const bounds = mapContainerRef.current?.getBoundingClientRect();
    if (!bounds) return null;

    const sourcePoint = svgRef.current?.createSVGPoint();
    if (!sourcePoint || !svgRef.current) return null;

    sourcePoint.x = geometry.centroid.x;
    sourcePoint.y = geometry.centroid.y;
    const screenPoint = sourcePoint.matrixTransform(svgRef.current.getScreenCTM() || undefined);
    const anchorX = screenPoint.x - bounds.left;
    const anchorY = screenPoint.y - bounds.top;

    return buildTooltipFromAnchor(row, anchorX, anchorY, bounds);
  };

  const activeTooltip = pinnedTooltip ?? hoverTooltip;
  const isPinnedTooltip = !!pinnedTooltip && activeTooltip?.row.municipality === pinnedTooltip.row.municipality;

  const connectorGeometry = useMemo(() => {
    if (!activeTooltip || !isPinnedTooltip) return null;

    let startX = activeTooltip.x;
    let startY = activeTooltip.y + activeTooltip.height / 2;

    switch (activeTooltip.direction) {
      case 'left':
        startX = activeTooltip.x + activeTooltip.width;
        startY = clamp(activeTooltip.anchorY, activeTooltip.y + 14, activeTooltip.y + activeTooltip.height - 14);
        break;
      case 'top':
        startX = clamp(activeTooltip.anchorX, activeTooltip.x + 16, activeTooltip.x + activeTooltip.width - 16);
        startY = activeTooltip.y + activeTooltip.height;
        break;
      case 'bottom':
        startX = clamp(activeTooltip.anchorX, activeTooltip.x + 16, activeTooltip.x + activeTooltip.width - 16);
        startY = activeTooltip.y;
        break;
      case 'right':
      default:
        startX = activeTooltip.x;
        startY = clamp(activeTooltip.anchorY, activeTooltip.y + 14, activeTooltip.y + activeTooltip.height - 14);
        break;
    }

    const endX = activeTooltip.anchorX;
    const endY = activeTooltip.anchorY;
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.max(Math.hypot(dx, dy), 1);
    const ux = dx / length;
    const uy = dy / length;
    const arrowLength = 8;
    const arrowWidth = 4.5;
    const lineEndX = endX - ux * arrowLength;
    const lineEndY = endY - uy * arrowLength;
    const arrowBaseX = endX - ux * arrowLength;
    const arrowBaseY = endY - uy * arrowLength;

    return {
      startX,
      startY,
      lineEndX,
      lineEndY,
      arrowPoints: [
        `${endX},${endY}`,
        `${arrowBaseX - uy * arrowWidth},${arrowBaseY + ux * arrowWidth}`,
        `${arrowBaseX + uy * arrowWidth},${arrowBaseY - ux * arrowWidth}`,
      ].join(' '),
    };
  }, [activeTooltip, isPinnedTooltip]);

  useEffect(() => {
    if (!pinnedTooltip) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!svgRef.current?.contains(event.target as Node)) {
        setPinnedTooltip(null);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPinnedTooltip(null);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [pinnedTooltip]);

  useEffect(() => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const next = {
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      };

      setMapCanvasSize((previous) => (
        previous.width === next.width && previous.height === next.height ? previous : next
      ));
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const updateTooltipFromFocus = (
    row: MunicipalityRow,
    geometry: (typeof AURORA_MUNICIPALITY_GEOMETRIES)[number],
    placement: { x: number; y: number; width: number }
  ) => {
    const bounds = mapContainerRef.current?.getBoundingClientRect();
    if (!bounds) return null;

    const sourcePoint = svgRef.current?.createSVGPoint();
    if (sourcePoint && svgRef.current) {
      sourcePoint.x = geometry.centroid.x;
      sourcePoint.y = geometry.centroid.y;
      const screenPoint = sourcePoint.matrixTransform(svgRef.current.getScreenCTM() || undefined);
      return buildTooltipFromAnchor(row, screenPoint.x - bounds.left, screenPoint.y - bounds.top, bounds);
    }

    const fallbackX = ((placement.x + placement.width / 2 - MAP_VIEWBOX.minX) / MAP_VIEWBOX.width) * bounds.width;
    const fallbackY = ((placement.y + LABEL_HEIGHT / 2 + 10 - MAP_VIEWBOX.minY) / MAP_VIEWBOX.height) * bounds.height;
    return buildTooltipFromAnchor(row, fallbackX, fallbackY, bounds);
  };

  const handleMunicipalityEnter = (
    row: MunicipalityRow,
    geometry: (typeof AURORA_MUNICIPALITY_GEOMETRIES)[number]
  ) => {
    if (pinnedTooltip) return;
    const nextTooltip = buildTooltipFromPointer(row, geometry);
    if (nextTooltip) setHoverTooltip(nextTooltip);
  };

  const handleMunicipalityLeave = () => {
    if (pinnedTooltip) return;
    setHoverTooltip(null);
  };

  const handleMunicipalityClick = (
    event: React.MouseEvent<SVGGElement>,
    row: MunicipalityRow,
    geometry: (typeof AURORA_MUNICIPALITY_GEOMETRIES)[number],
    placement: { x: number; y: number; width: number }
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setHoverTooltip(null);
    setPinnedTooltip((previous) => {
      if (previous?.row.municipality === row.municipality) {
        return null;
      }

      return buildTooltipFromPointer(row, geometry) ?? updateTooltipFromFocus(row, geometry, placement) ?? previous;
    });
  };

  const handleMunicipalityLabelClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    row: MunicipalityRow,
    geometry: (typeof AURORA_MUNICIPALITY_GEOMETRIES)[number],
    placement: { x: number; y: number; width: number }
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setHoverTooltip(null);
    setPinnedTooltip((previous) => {
      if (previous?.row.municipality === row.municipality) {
        return null;
      }

      return buildTooltipFromPointer(row, geometry) ?? updateTooltipFromFocus(row, geometry, placement) ?? previous;
    });
  };

  const handleMapBackgroundClick = (event: React.MouseEvent<SVGRectElement>) => {
    if (!pinnedTooltip) return;
    event.preventDefault();
    event.stopPropagation();
    setPinnedTooltip(null);
    setHoverTooltip(null);
  };

  return (
    <div className={`relative rounded-xl border border-zinc-200/80 dark:border-zinc-700/70 bg-white/90 dark:bg-zinc-900/60 p-2.5 sm:p-3 ${className}`}>
      <div
        ref={mapContainerRef}
        className="relative rounded-lg border border-zinc-200/80 dark:border-zinc-700/70 bg-[linear-gradient(145deg,#f8fafc_0%,#f1f5f9_55%,#eef2ff_100%)] dark:bg-none dark:bg-[linear-gradient(90deg,#151b18_0%,#232c28_52%,#37403c_100%)] p-2"
      >
        <div ref={mapCanvasRef} className="relative">
          <svg ref={svgRef} viewBox={MAP_VIEWBOX_WITH_LABELS} className="relative z-[1] w-full h-auto" role="img" aria-label="Aurora municipality completion heat map">
            <g>
              <rect
                x={MAP_VIEWBOX.minX}
                y={MAP_VIEWBOX.minY}
                width={MAP_VIEWBOX.width}
                height={MAP_VIEWBOX.height}
                fill="transparent"
                onClick={handleMapBackgroundClick}
              />
              {AURORA_MUNICIPALITY_GEOMETRIES.map((geometry) => {
              const row = byMunicipality.get(geometry.municipality);
              const targetCount = row?.targetCount ?? 0;
              const progress = row?.progress ?? 0;
              const statusKey = row?.statusKey ?? 'no-target';
              const isPinnedMunicipality = pinnedTooltip?.row.municipality === geometry.municipality;
              const tone = getStatusMeta(statusKey);
              const fill = getMunicipalityFill(targetCount, progress);
              const placement = labelPlacements[geometry.municipality];
              const labelCenterX = Math.round(placement.x + placement.width / 2);
              const labelCenterY = placement.y + LABEL_HEIGHT / 2;
              const lineTargetX = geometry.centroid.x <= labelCenterX ? placement.x : placement.x + placement.width;
              const animation = getAnimationValues(statusKey, compact);
              const interactiveRow = row ?? {
                municipality: geometry.municipality,
                targetCount: 0,
                completedCount: 0,
                progress: 0,
                statusKey: 'no-target' as const,
              };

              return (
                <g
                  key={geometry.municipality}
                  onMouseEnter={() => handleMunicipalityEnter(interactiveRow, geometry)}
                  onMouseLeave={handleMunicipalityLeave}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => handleMunicipalityClick(event, interactiveRow, geometry, placement)}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  <title>
                    {`${geometry.municipality}: ${targetCount > 0 ? `${row?.completedCount ?? 0}/${targetCount} (${Math.round(progress)}%)` : 'No target set yet'} • ${tone.label}`}
                  </title>

                  {isPinnedMunicipality && (
                    <path
                      d={geometry.path}
                      fill="none"
                      stroke={tone.color}
                      strokeWidth={2.6}
                      strokeOpacity={0.2}
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}

                  <path
                    d={geometry.path}
                    fill={fill}
                    stroke={isPinnedMunicipality ? tone.color : (isDarkTheme ? 'rgba(226,232,240,0.42)' : 'rgba(15,23,42,0.58)')}
                    strokeWidth={isPinnedMunicipality ? 1.15 : 0.72}
                    strokeOpacity={isPinnedMunicipality ? 0.9 : 1}
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />

                  <circle
                    cx={geometry.centroid.x}
                    cy={geometry.centroid.y}
                    r={isPinnedMunicipality ? (compact ? 1.2 : 1.45) : (compact ? 0.9 : 1.1)}
                    fill={tone.color}
                    opacity={isPinnedMunicipality ? 1 : (targetCount > 0 ? 0.92 : 0.46)}
                  />

                  {showStatusAnimation && (
                    <circle
                      cx={geometry.centroid.x}
                      cy={geometry.centroid.y}
                      r={animation.startRadius}
                      fill="none"
                      stroke={tone.color}
                      strokeWidth={0.55}
                      opacity={targetCount > 0 ? 0.64 : 0.18}
                    >
                      <animate
                        attributeName="r"
                        values={`${animation.startRadius};${animation.endRadius};${animation.startRadius}`}
                        dur={animation.duration}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values={animation.opacity}
                        dur={animation.duration}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {showLabels && (
                    <line
                      x1={geometry.centroid.x}
                      y1={geometry.centroid.y}
                      x2={lineTargetX}
                      y2={labelCenterY}
                      stroke={tone.color}
                      strokeWidth={0.45}
                      strokeOpacity={0.72}
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </g>
              );
            })}
            </g>
          </svg>

          {showLabels && municipalityLabelChips.length > 0 && (
            <div className="pointer-events-none absolute inset-0 z-[2]" aria-hidden="true">
              {municipalityLabelChips.map((chip) => (
                <button
                  key={chip.municipality}
                  type="button"
                  onMouseEnter={() => handleMunicipalityEnter(chip.interactiveRow, chip.geometry)}
                  onMouseLeave={handleMunicipalityLeave}
                  onFocus={() => handleMunicipalityEnter(chip.interactiveRow, chip.geometry)}
                  onBlur={handleMunicipalityLeave}
                  onClick={(event) => handleMunicipalityLabelClick(event, chip.interactiveRow, chip.geometry, chip.placement)}
                  className="pointer-events-auto absolute flex flex-col items-center justify-center select-none p-0 text-left cursor-pointer bg-transparent transition-[filter] duration-200 ease-out"
                  style={{
                    left: `${chip.style.left}px`,
                    top: `${chip.style.top}px`,
                    width: `${chip.style.width}px`,
                    height: `${chip.style.height}px`,
                  }}
                  aria-label={`${chip.municipality} ${chip.percentLabel}`}
                >
                  <span
                    className="pointer-events-none absolute inset-0 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out"
                    style={{
                      borderRadius: `${chip.style.borderRadius}px`,
                      borderWidth: `${chip.style.borderWidth}px`,
                      borderStyle: 'solid',
                      background: isDarkTheme
                        ? (chip.isPinnedMunicipality ? 'rgba(17,24,39,0.99)' : 'rgba(37,49,68,0.96)')
                        : chip.tone.boxFill,
                      borderColor: chip.isPinnedMunicipality
                        ? chip.tone.color
                        : (isDarkTheme ? 'rgba(255,255,255,0.34)' : chip.tone.boxStroke),
                      boxShadow: chip.isPinnedMunicipality
                        ? (isDarkTheme
                          ? `0 0 0 1px ${chip.tone.color}55, 0 0 0 3px ${chip.tone.color}22, 0 14px 28px rgba(2,6,23,0.28)`
                          : `0 0 0 1px ${chip.tone.color}33, 0 0 0 3px ${chip.tone.color}18, 0 12px 24px rgba(15,23,42,0.12)`)
                        : (isDarkTheme
                          ? '0 1px 0 rgba(255,255,255,0.06) inset, 0 10px 20px rgba(2,6,23,0.18)'
                          : '0 1px 0 rgba(255,255,255,0.18) inset'),
                      transform: chip.isPinnedMunicipality ? 'scale(1.035)' : 'scale(1)',
                    }}
                  />
                  <span
                    className="relative z-[1] whitespace-nowrap font-semibold"
                    style={{
                      fontFamily: 'Segoe UI, Verdana, Geneva, sans-serif',
                      fontSize: `${chip.nameStyle.fontSize}px`,
                      fontWeight: chip.nameStyle.fontWeight,
                      lineHeight: chip.nameStyle.lineHeight,
                      letterSpacing: chip.nameStyle.letterSpacing,
                      color: isDarkTheme ? 'rgba(255,255,255,0.99)' : 'rgba(15,23,42,0.88)',
                      WebkitFontSmoothing: 'antialiased',
                    }}
                  >
                    {chip.municipality}
                  </span>
                  <span
                    className="relative z-[1] mt-[1px] whitespace-nowrap"
                    style={{
                      fontFamily: 'Segoe UI, Verdana, Geneva, sans-serif',
                      fontSize: `${chip.percentStyle.fontSize}px`,
                      fontWeight: chip.percentStyle.fontWeight,
                      lineHeight: chip.percentStyle.lineHeight,
                      letterSpacing: chip.percentStyle.letterSpacing,
                      color: chip.percentColor,
                      WebkitFontSmoothing: 'antialiased',
                    }}
                  >
                    {chip.percentLabel}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {connectorGeometry && activeTooltip && (
          <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible" aria-hidden="true">
            <line
              x1={connectorGeometry.startX}
              y1={connectorGeometry.startY}
              x2={connectorGeometry.lineEndX}
              y2={connectorGeometry.lineEndY}
              stroke={getStatusMeta(activeTooltip.row.statusKey).color}
              strokeWidth={1.6}
              strokeLinecap="round"
              opacity={0.85}
            />
            <polygon
              points={connectorGeometry.arrowPoints}
              fill={getStatusMeta(activeTooltip.row.statusKey).color}
              opacity={0.9}
            />
          </svg>
        )}

        {activeTooltip && (() => {
          const tone = getStatusMeta(activeTooltip.row.statusKey);
          return (
            <div
              className="pointer-events-none absolute z-20 overflow-hidden rounded-xl border border-zinc-200/90 dark:border-white/14 bg-white/96 dark:bg-[linear-gradient(145deg,rgba(12,24,40,0.98),rgba(12,28,48,0.96))] px-3 py-2.5 shadow-[0_14px_32px_rgba(15,23,42,0.22)] dark:shadow-[0_18px_34px_rgba(2,8,23,0.48)] backdrop-blur-sm dark:backdrop-blur-none"
              style={{ left: `${activeTooltip.x}px`, top: `${activeTooltip.y}px`, width: `${activeTooltip.width}px` }}
            >
              <div className="pointer-events-none absolute inset-0 dark:bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.16),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.14),transparent_40%)]" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="relative text-xs font-bold text-slate-900 dark:text-slate-50 leading-tight">{activeTooltip.row.municipality}</p>
                  <p className={`mt-0.5 text-[10px] font-semibold ${tone.labelClass}`}>{tone.label}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs font-black whitespace-nowrap ${tone.percentClass}`}>{getPercentLabel(activeTooltip.row)}</span>
                  {isPinnedTooltip && (
                    <span className="inline-flex items-center rounded-full border border-blue-200/90 dark:border-blue-300/35 bg-blue-50/90 dark:bg-blue-500/18 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-100">
                      Pinned
                    </span>
                  )}
                </div>
              </div>
              <div className="relative mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-100/92">
                <span>Completed / Target</span>
                <span className="font-semibold text-slate-800 dark:text-slate-50">{getCompletedLabel(activeTooltip.row)}</span>
              </div>
              <div className="relative mt-1.5 h-1.5 rounded-full bg-slate-200/85 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{
                    width: `${Math.max(activeTooltip.row.targetCount > 0 ? activeTooltip.row.progress : 0, activeTooltip.row.progress > 0 ? 6 : 0)}%`,
                    backgroundColor: tone.color,
                  }}
                />
              </div>
              <p className="relative mt-1.5 text-[10px] text-slate-500 dark:text-slate-200/80">
                {isPinnedTooltip ? 'Click the same municipality again or click outside the map to unpin.' : 'Click a municipality to pin this tooltip.'}
              </p>
            </div>
          );
        })()}
      </div>

      {showLegend && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border border-slate-300 dark:border-slate-600" style={{ backgroundColor: getMunicipalityFill(0, 0) }} />No target</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border border-slate-300 dark:border-slate-600" style={{ backgroundColor: getMunicipalityFill(1, 25) }} />1-49%</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border border-slate-300 dark:border-slate-600" style={{ backgroundColor: getMunicipalityFill(1, 70) }} />50-84%</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border border-slate-300 dark:border-slate-600" style={{ backgroundColor: getMunicipalityFill(1, 92) }} />85-99%</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border border-slate-300 dark:border-slate-600" style={{ backgroundColor: getMunicipalityFill(1, 100) }} />100%</span>
          {showStatusAnimation && (
            <span className="inline-flex items-center gap-1">
              <span className="relative inline-flex h-2.5 w-2.5 items-center justify-center">
                <span className="absolute inline-flex h-2.5 w-2.5 rounded-full border border-blue-400/70 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
              </span>
              Animated status beacon
            </span>
          )}
        </div>
      )}

      {showValues && (
        <div className={`mt-2.5 grid gap-1.5 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'}`}>
          {municipalityRows.map((row) => {
            const tone = getStatusMeta(row.statusKey);
            return (
              <div key={row.municipality} className="rounded-md border border-zinc-200/80 dark:border-zinc-700/70 bg-white/85 dark:bg-zinc-900/70 px-2.5 py-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-bold leading-tight text-slate-700 dark:text-slate-100">{row.municipality}</p>
                  <span className={`text-[11px] font-black whitespace-nowrap ${tone.percentClass}`}>{getPercentLabel(row)}</span>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-slate-800 dark:text-slate-100">{row.completedCount}/{row.targetCount}</p>
                <p className={`text-[10px] font-semibold ${tone.labelClass}`}>{tone.label}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
