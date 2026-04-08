import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { DialogProvider } from "../DialogContext";
import { ToastProvider } from "../ToastContext";
import { RbacProvider } from "../RbacContext";
import { Layout } from "./Layout";

export const ProtectedShell: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname === "/dashboard" || pathname === "/census") {
      return;
    }

    let cancelled = false;
    const browserWindow = window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout?: number },
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const prefetchCharts = () => {
      if (cancelled) return;
      void import("recharts");
    };

    if (typeof browserWindow.requestIdleCallback === "function") {
      const idleId = browserWindow.requestIdleCallback(prefetchCharts, {
        timeout: 2500,
      });

      return () => {
        cancelled = true;
        browserWindow.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = setTimeout(prefetchCharts, 2500);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  return (
    <RbacProvider>
      <DialogProvider>
        <ToastProvider>
          <Layout>
            <Outlet />
          </Layout>
        </ToastProvider>
      </DialogProvider>
    </RbacProvider>
  );
};

export default ProtectedShell;
