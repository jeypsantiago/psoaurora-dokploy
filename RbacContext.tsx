import React, { createContext, useContext, useMemo } from "react";
import {
  LayoutDashboard,
  FileText,
  Package,
  Building2,
  Mail,
  Settings,
  Briefcase,
  ClipboardList,
  ClipboardCheck,
} from "lucide-react";
import { useUsers } from "./UserContext";
import { Permission } from "./types";
import {
  getEffectivePermissions,
  hasPermission,
  hasAnyPermission,
} from "./services/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  requiredPermission?: Permission;
}

interface RbacContextType {
  permissions: Permission[];
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  visibleNavItems: NavItem[];
}

const RbacContext = createContext<RbacContextType | undefined>(undefined);

export const ALL_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    requiredPermission: "dashboard.view",
  },
  {
    label: "Records",
    href: "/records",
    icon: FileText,
    requiredPermission: "records.view",
  },
  {
    label: "Supplies",
    href: "/supplies",
    icon: Package,
    requiredPermission: "supply.view",
  },
  {
    label: "Employment",
    href: "/employment",
    icon: Briefcase,
    requiredPermission: "employment.view",
  },
  {
    label: "Report Monitoring",
    href: "/reports",
    icon: ClipboardCheck,
    requiredPermission: "reports.view",
  },
  {
    label: "Property",
    href: "/property",
    icon: Building2,
    requiredPermission: "property.view",
  },
  {
    label: "Census & Surveys",
    href: "/census",
    icon: ClipboardList,
    requiredPermission: "census.view",
  },
  {
    label: "Gmail Hub",
    href: "/gmail",
    icon: Mail,
    requiredPermission: "gmail.view",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    requiredPermission: "settings.view",
  },
];

export const RbacProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser, roles } = useUsers();

  const userPermissions = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.isSuperAdmin || currentUser.roles.includes("Super Admin")) {
      return ["all"];
    }
    return getEffectivePermissions(roles, currentUser.roles);
  }, [currentUser, roles]);

  const can = (permission: Permission) =>
    hasPermission(userPermissions, permission);
  const canAny = (permissions: Permission[]) =>
    hasAnyPermission(userPermissions, permissions);

  const visibleNavItems = useMemo(() => {
    return ALL_NAV_ITEMS.filter((item) => {
      if (!item.requiredPermission) return true;
      return hasPermission(userPermissions, item.requiredPermission);
    });
  }, [userPermissions]);

  return (
    <RbacContext.Provider
      value={{ permissions: userPermissions, can, canAny, visibleNavItems }}
    >
      {children}
    </RbacContext.Provider>
  );
};

export const useRbac = () => {
  const context = useContext(RbacContext);
  if (!context) throw new Error("useRbac must be used within an RbacProvider");
  return context;
};
