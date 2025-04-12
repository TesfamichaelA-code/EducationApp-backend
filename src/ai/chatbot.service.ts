import { Injectable } from '@nestjs/common';
import { AiService } from './ai.service';

@Injectable()
export class ChatbotService {
  constructor(private aiService: AiService) {}

  async handleQuery(query: string, role: string): Promise<string> {
    const prompt = `As a hospitality training assistant, help with: ${query}. Context: User role is ${role}`;
    return this.aiService.generateResponse(prompt);
  }

  async getTrainingTips(moduleType: string): Promise<string> {
    const prompt = `Provide specific tips and best practices for ${moduleType} in hospitality training.`;
    return this.aiService.generateResponse(prompt);
  }
}