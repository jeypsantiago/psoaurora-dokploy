import React from "react";
import { Outlet } from "react-router-dom";
import { UserProvider } from "../UserContext";

interface UserShellProps {
  children?: React.ReactNode;
}

export const UserShell: React.FC<UserShellProps> = ({ children }) => {
  return <UserProvider>{children ?? <Outlet />}</UserProvider>;
};

export default UserShell;
