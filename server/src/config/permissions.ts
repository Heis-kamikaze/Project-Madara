/**
 * Role-based access control.
 *
 * A user's role lives in a Firebase Auth custom claim (`role`) and is mirrored
 * to `users/{uid}.role`. Permissions are derived from the role here, in code,
 * so the matrix is reviewable and versioned with the rest of the project.
 */

export const ROLES = ['owner', 'admin', 'manager', 'editor', 'support', 'customer'] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  'site:write',
  'media:upload',
  'collections:write',
  'products:write',
  'orders:read',
  'orders:write',
  'consultations:read',
  'consultations:write',
  'closet:manage',
  'authenticity:manage',
  'inbox:send',
  'museum:write',
  'community:write',
  'community:moderate',
  'team:write',
  'support:read',
  'support:reply',
  'users:read',
  'users:manage-roles',
  'analytics:read',
  'audit:read',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ALL: readonly Permission[] = PERMISSIONS;

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: ALL,
  admin: ALL,
  manager: [
    'media:upload',
    'collections:write',
    'products:write',
    'orders:read',
    'orders:write',
    'consultations:read',
    'consultations:write',
    'closet:manage',
    'authenticity:manage',
    'inbox:send',
    'support:read',
    'analytics:read',
  ],
  editor: [
    'site:write',
    'media:upload',
    'collections:write',
    'products:write',
    'museum:write',
    'community:write',
    'community:moderate',
    'team:write',
  ],
  support: [
    'orders:read',
    'consultations:read',
    'consultations:write',
    'inbox:send',
    'support:read',
    'support:reply',
  ],
  customer: [],
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function isStaff(role: Role): boolean {
  return role !== 'customer';
}
