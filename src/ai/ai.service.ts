import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo',
      });

      return completion.choices[0].message.content;
    } catch (error) {
      this.logger.error(`Failed to generate AI response: ${error.message}`);
      
      // Handle quota exceeded error
      if (error.status === 429) {
        return 'I apologize, but I am currently unable to process your request due to service limitations. Please try again later or contact support.';
      }
      
      // Handle other errors
      return 'I apologize, but I encountered an error processing your request. Please try again later.';
    }
  }
}