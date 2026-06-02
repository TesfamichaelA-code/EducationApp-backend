/**
 * Marks a route or controller as publicly accessible — bypasses the global
 * {@link JwtAuthGuard}. Use sparingly: login, register, refresh, health.
 *
 *   @Public()
 *   @Post('login')
 *   login() { ... }
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
