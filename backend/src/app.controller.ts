/**
 * System endpoints — unauthenticated, used by the platform and external
 * monitors. Keep these handlers cheap; never touch the database here.
 */

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from './common/decorators/public.decorator';

@ApiTags('system')
@Controller()
export class AppController {
  /** Service descriptor — handy when poking the API root. */
  @Public()
  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'API metadata' })
  root() {
    return {
      name: 'LearnDeck API',
      version: '1.0.0',
      docs: '/api/docs',
    };
  }

  /** Liveness probe. Returns 200 as long as the event loop is responsive. */
  @Public()
  @Get('health')
  @SkipThrottle()
  @ApiOperation({ summary: 'Liveness probe' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
