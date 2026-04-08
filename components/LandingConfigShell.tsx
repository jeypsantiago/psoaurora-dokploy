import React from "react";
import { Outlet } from "react-router-dom";
import { LandingConfigProvider } from "../LandingConfigContext";

interface LandingConfigShellProps {
  children?: React.ReactNode;
}

export const LandingConfigShell: React.FC<LandingConfigShellProps> = ({
  children,
}) => {
  return <LandingConfigProvider>{children ?? <Outlet />}</LandingConfigProvider>;
};

export default LandingConfigShell;
