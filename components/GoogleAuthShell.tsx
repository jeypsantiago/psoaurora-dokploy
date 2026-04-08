import React from "react";
import { GoogleAuthProvider } from "./GoogleAuthProvider";

interface GoogleAuthShellProps {
  children: React.ReactNode;
}

export const GoogleAuthShell: React.FC<GoogleAuthShellProps> = ({
  children,
}) => {
  return <GoogleAuthProvider>{children}</GoogleAuthProvider>;
};

export default GoogleAuthShell;
