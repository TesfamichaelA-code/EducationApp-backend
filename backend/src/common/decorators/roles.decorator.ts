/**
 * Route-level metadata declaring which roles may invoke a handler.
 *
 *   @Roles(UserRole.ADMIN)
 *   @Get('admin-only')
 *   handler() { ... }
 *
 * Enforced by {@link RolesGuard}.
 */

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/schemas/user.schema';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
