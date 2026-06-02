/**
 * Param decorator that pulls the authenticated user off the request.
 *
 *   @Get('me')
 *   me(@CurrentUser() user: UserDocument) { return user; }
 *
 * Relies on JwtStrategy.validate() having attached the user to req.user.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
