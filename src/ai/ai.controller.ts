import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatbotService } from './chatbot.service';
import { LearningPathService } from './learning-path.service';
import { AssessmentService } from './assessment.service';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(
    private chatbotService: ChatbotService,
    private learningPathService: LearningPathService,
    private assessmentService: AssessmentService,
  ) {}

  @Post('chat')
  async chat(@Body() body: { query: string; role: string }) {
    return this.chatbotService.handleQuery(body.query, body.role);
  }

  @Get('training-tips')
  async getTrainingTips(@Query('moduleType') moduleType: string) {
    return this.chatbotService.getTrainingTips(moduleType);
  }

  @Post('learning-path')
  async generateLearningPath(
    @Body() body: { skills: string[]; goals: string[]; role: string },
  ) {
    return this.learningPathService.generatePersonalizedPath(
      body.skills,
      body.goals,
      body.role,
    );
  }

  @Post('assessment/generate')
  async generateAssessment(
    @Body() body: { moduleType: string; level: string },
  ) {
    return this.assessmentService.generateAssessment(body.moduleType, body.level);
  }

  @Post('assessment/evaluate')
  async evaluateResponse(
    @Body()
    body: {
      question: string;
      response: string;
      criteria: string[];
    },
  ) {
    return this.assessmentService.evaluateResponse(
      body.question,
      body.response,
      body.criteria,
    );
  }
}