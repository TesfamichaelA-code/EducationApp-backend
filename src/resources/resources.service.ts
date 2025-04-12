import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resource } from './schemas/resource.schema';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(Resource.name) private resourceModel: Model<Resource>,
  ) {}

  async create(createResourceDto: CreateResourceDto, userId: string): Promise<Resource> {
    const createdResource = new this.resourceModel({
      ...createResourceDto,
      uploader: userId,
    });
    return createdResource.save();
  }

  async findAll(user: any): Promise<Resource[]> {
    return this.resourceModel
      .find()
      .populate('uploader', 'name email')
      .populate('course', 'title')
      .exec();
  }

  async findByCourse(courseId: string): Promise<Resource[]> {
    return this.resourceModel
      .find({ course: courseId })
      .populate('uploader', 'name email')
      .populate('course', 'title')
      .exec();
  }

  async findOne(id: string): Promise<Resource> {
    const resource = await this.resourceModel
      .findById(id)
      .populate('uploader', 'name email')
      .populate('course', 'title')
      .exec();

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return resource;
  }

  async update(id: string, updateResourceDto: any, user: any): Promise<Resource> {
    const resource = await this.resourceModel.findById(id);
    
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    if (resource.uploader.toString() !== user._id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    return this.resourceModel
      .findByIdAndUpdate(id, updateResourceDto, { new: true })
      .exec();
  }

  async remove(id: string, user: any): Promise<void> {
    const resource = await this.resourceModel.findById(id);
    
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    if (resource.uploader.toString() !== user._id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    await this.resourceModel.findByIdAndDelete(id).exec();
  }
}