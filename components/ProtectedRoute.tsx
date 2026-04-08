import React, { useEffect, useRef } from 'react';
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
    const deniedRouteKeyRef = useRef<string | null>(null);

    const isSuperAdmin = !!currentUser?.isSuperAdmin || !!currentUser?.roles?.includes('Super Admin');
    const hasAccess = !requires || isSuperAdmin || can(requires);
    const deniedRouteKey = currentUser?.id && requires
        ? `${currentUser.id}:${location.pathname}:${requires}`
        : null;

    useEffect(() => {
        if (!isReady || !currentUser || hasAccess || !deniedRouteKey) {
            deniedRouteKeyRef.current = null;
            return;
        }

        if (deniedRouteKeyRef.current === deniedRouteKey) {
            return;
        }

        deniedRouteKeyRef.current = deniedRouteKey;
        void alert("Access Denied: You do not have the required permissions to view this page.");
    }, [alert, currentUser, deniedRouteKey, hasAccess, isReady, location.pathname, requires]);

    if (!isReady) {
        return <SecureWorkspaceBootstrap />;
    }

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!hasAccess) {
        return <Navigate to="/profile" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
