import React from 'react';
import { useRbac } from '../RbacContext';
import { Permission } from '../types';

interface PermissionGateProps {
    children: React.ReactNode;
    requires: Permission;
    fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({ children, requires, fallback = null }) => {
    const { can } = useRbac();

    if (!can(requires)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
