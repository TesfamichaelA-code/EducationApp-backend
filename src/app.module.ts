import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { NotesModule } from './notes/notes.module';
import { CoursesModule } from './courses/courses.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { ResourcesModule } from './resources/resources.module';
import { TrainingModule } from './training/training.module';
import { ProgressModule } from './progress/progress.module';
import { GamificationModule } from './gamification/gamification.module';
import { SkillsModule } from './skills/skills.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    NotesModule,
    CoursesModule,
    FlashcardsModule,
    ResourcesModule,
    TrainingModule,
    ProgressModule,
    GamificationModule,
    SkillsModule,
    AnalyticsModule,
    AiModule,
  ],
})
export class AppModule {}