import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRbac } from '../RbacContext';
import { Permission } from '../types';
import { useDialog } from '../DialogContext';
import { useUsers } from '../UserContext';
import { SecureWorkspaceBootstrap } from './SecureWorkspaceBootstrap';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requires?: Permission;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requires }) => {
    const { currentUser, isReady } = useUsers();
    const { can } = useRbac();
    const { alert } = useDialog();
    const location = useLocation();

    const isSuperAdmin = !!currentUser?.isSuperAdmin || !!currentUser?.roles?.includes('Super Admin');
    const hasAccess = !requires || isSuperAdmin || can(requires);

    useEffect(() => {
        if (isReady && currentUser && !hasAccess) {
            alert("Access Denied: You do not have the required permissions to view this page.");
        }
    }, [isReady, currentUser, hasAccess, alert]);

    if (!isReady) {
        return <SecureWorkspaceBootstrap />;
    }

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!hasAccess) {
        return <Navigate to="/dashboard" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
