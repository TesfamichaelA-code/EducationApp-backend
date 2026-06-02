/**
 * Users controller — admin-only management surface.
 *
 *   GET   /api/users         List all users (admin)
 *   PATCH /api/users/:id/role     Change a user's role (admin)
 *   PATCH /api/users/:id/active   Enable/disable a user (admin)
 *
 * Self-service endpoints (profile update, change password) belong on
 * /api/auth/me PATCH in a future block. For Block B, admins drive role
 * promotion (e.g. turning a student into a teacher).
 */

import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsEnum } from 'class-validator';

import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from './schemas/user.schema';
import { UsersService } from './users.service';

class SetRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}

class SetActiveDto {
  @IsBoolean()
  isActive!: boolean;
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all users (admin)' })
  list() {
    return this.users.findAll();
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Change a user role (admin)' })
  setRole(@Param('id') id: string, @Body() body: SetRoleDto) {
    return this.users.setRole(id, body.role);
  }

  @Patch(':id/active')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Enable or disable a user (admin)' })
  setActive(@Param('id') id: string, @Body() body: SetActiveDto) {
    return this.users.setActive(id, body.isActive);
  }
}
