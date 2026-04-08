import { Role } from '../UserContext';
import { Permission } from '../types';

/**
 * Checks if a set of effective permissions contains a specific permission.
 * Includes 'all' bypass.
 */
export function hasPermission(effectivePerms: Permission[], required: Permission): boolean {
    if (effectivePerms.includes('all')) return true;
    return effectivePerms.includes(required);
}

/**
 * Checks if a set of effective permissions contains ANY of the required permissions.
 */
export function hasAnyPermission(effectivePerms: Permission[], required: Permission[]): boolean {
    if (effectivePerms.includes('all')) return true;
    return required.some(p => effectivePerms.includes(p));
}

/**
 * Merges permissions from multiple roles into a unique set.
 */
export function getEffectivePermissions(availableRoles: Role[], userRoleNames: string[]): Permission[] {
    const permissions = new Set<Permission>();

    userRoleNames.forEach(roleName => {
        const role = availableRoles.find(r => r.name === roleName);
        if (role) {
            role.permissions.forEach(p => permissions.add(p));
        }
    });

    return Array.from(permissions);
}
