import { Injectable } from '@nestjs/common';
import { AiService } from './ai.service';

@Injectable()
export class LearningPathService {
  constructor(private aiService: AiService) {}

  async generatePersonalizedPath(
    userSkills: string[] = [],
    goals: string[] = [],
    role: string = 'student',
  ): Promise<string> {
    const skills = userSkills?.join(', ') || 'No specific skills';
    const userGoals = goals?.join(', ') || 'No specific goals';
    
    const prompt = `Create a personalized learning path for a ${role} in hospitality.
    Current skills: ${skills}
    Goals: ${userGoals}
    Provide a structured training plan with recommended modules and timeline.`;
    
    return this.aiService.generateResponse(prompt);
  }

  async recommendNextModules(
    completedModules: string[] = [],
    performance: number = 0,
  ): Promise<string> {
    const modules = completedModules?.join(', ') || 'No completed modules';
    
    const prompt = `Based on completed modules: ${modules}
    and performance score: ${performance},
    recommend the next most suitable training modules.`;
    
    return this.aiService.generateResponse(prompt);
  }
}