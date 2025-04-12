import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ChatbotService } from './chatbot.service';
import { LearningPathService } from './learning-path.service';
import { AssessmentService } from './assessment.service';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [AiService, ChatbotService, LearningPathService, AssessmentService],
  exports: [AiService, ChatbotService, LearningPathService, AssessmentService],
})
export class AiModule {}