import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { ResourcesService } from './resources.service';

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB — generous for PDFs, blocks runaway uploads

@ApiTags('resources')
@ApiBearerAuth()
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resources: ResourcesService) {}

  @Post('course/:courseId/upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_BYTES } }))
  @ApiOperation({ summary: 'Upload a file (PDF, image, etc.) to a course' })
  upload(
    @Param('courseId') courseId: string,
    @CurrentUser() user: UserDocument,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.resources.upload(courseId, user.id, user.role, file);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'List resources attached to a course' })
  list(@Param('courseId') courseId: string) {
    return this.resources.listByCourse(courseId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Stream a resource (owner / enrolled student / admin)' })
  download(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Res({ passthrough: false }) res: Response,
  ) {
    return this.resources.streamDownload(id, user.id, user.role, res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resource (uploader / admin)' })
  async remove(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    await this.resources.delete(id, user.id, user.role);
    return { deleted: true };
  }
}
