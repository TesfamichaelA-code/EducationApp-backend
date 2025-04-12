import { Injectable } from '@nestjs/common';
import { AiService } from './ai.service';

@Injectable()
export class AssessmentService {
  constructor(private aiService: AiService) {}

  async generateAssessment(moduleType: string = 'general', level: string = 'beginner'): Promise<string> {
    const prompt = `Create a comprehensive assessment for ${moduleType} training at ${level} level.
    Include practical scenarios, multiple-choice questions, and situation-based problems.`;
    
    return this.aiService.generateResponse(prompt);
  }

  async evaluateResponse(
    question: string = '',
    userResponse: string = '',
    criteria: string[] = [],
  ): Promise<{ score: number; feedback: string }> {
    const evaluationCriteria = criteria?.join(', ') || 'general knowledge and understanding';
    
    const prompt = `Evaluate this hospitality training response.
    Question: ${question || 'No question provided'}
    Response: ${userResponse || 'No response provided'}
    Evaluation criteria: ${evaluationCriteria}
    Provide a score (0-100) and detailed feedback.`;
    
    try {
      const evaluation = await this.aiService.generateResponse(prompt);
      
      // More robust parsing of the evaluation response
      const scoreMatch = evaluation.match(/Score: (\d+)/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
      const feedback = evaluation.replace(/Score: \d+/, '').trim() || 'No feedback available';
      
      return { score, feedback };
    } catch (error) {
      return {
        score: 0,
        feedback: 'Unable to evaluate response at this time. Please try again later.'
      };
    }
  }
}