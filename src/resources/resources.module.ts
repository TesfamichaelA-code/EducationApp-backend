import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { Resource, ResourceSchema } from './schemas/resource.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Resource.name, schema: ResourceSchema }])
  ],
  controllers: [ResourcesController],
  providers: [ResourcesService]
})
export class ResourcesModule {}
