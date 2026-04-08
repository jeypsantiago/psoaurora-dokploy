import React, { useEffect, useRef, useState } from "react";

type MeasuredChartContainerProps = {
  children: (size: { width: number; height: number }) => React.ReactNode;
  className?: string;
  minWidth?: number;
  minHeight?: number;
};

export const MeasuredChartContainer: React.FC<MeasuredChartContainerProps> = ({
  children,
  className = "",
  minWidth = 1,
  minHeight = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const nextSize = {
        width: element.clientWidth,
        height: element.clientHeight,
      };

      setSize((previous) =>
        previous.width === nextSize.width && previous.height === nextSize.height
          ? previous
          : nextSize,
      );
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      const timeoutId = window.setTimeout(updateSize, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const isReady = size.width >= minWidth && size.height >= minHeight;

  return (
    <div ref={containerRef} className={className}>
      {isReady ? children(size) : null}
    </div>
  );
};
