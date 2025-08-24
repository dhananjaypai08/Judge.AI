import Groq from 'groq-sdk';
import { Project, AIScore } from '@/app/types';

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!,
  dangerouslyAllowBrowser: true
});

export const SCORING_CRITERIA = {
  technicalImplementation: 25, // %
  innovation: 20,
  valueProposition: 20,
  completeness: 15,
  marketPotential: 10,
  codeQuality: 10,
};

export async function judgeProject(project: Project): Promise<AIScore> {
  try {
    const systemPrompt = `You are an expert hackathon judge with deep experience in evaluating technical projects, startup viability, and innovation. Your role is to provide comprehensive, objective scoring of hackathon projects.

SCORING CRITERIA (weights in parentheses):
1. Technical Implementation (25%): Code quality, architecture, technical difficulty, execution
2. Innovation & Uniqueness (20%): Originality, creative problem-solving, novel approaches
3. Value Proposition (20%): Problem importance, solution fit, user benefit, market need
4. Project Completeness (15%): Feature completeness, polish, demonstration quality
5. Market/Consumer Potential (10%): Scalability, adoption potential, business viability
6. Code Quality & Documentation (10%): GitHub presence, documentation, code standards

IMPORTANT: Always respond with valid JSON only. No additional text or formatting.

Scoring Scale:
- 90-100: Exceptional, production-ready, highly innovative
- 80-89: Excellent, well-executed, strong potential
- 70-79: Good, solid implementation, clear value
- 60-69: Fair, basic functionality, some issues
- 50-59: Poor, significant problems, incomplete
- 0-49: Very poor, non-functional, major flaws`;

    const projectData = {
      name: project.name,
      tagline: project.tagline,
      description: project.description,
      hasGithubLink: project.has_github_link,
      links: project.links,
      prizeTracks: project.prize_tracks,
      hashtags: project.hashtags,
      members: project.members,
      views: project.views,
      likes: project.likes,
      category: project.category
    };

    const userPrompt = `Evaluate this hackathon project and provide a comprehensive score:

PROJECT DATA:
${JSON.stringify(projectData, null, 2)}

Respond with this exact JSON structure:
{
  "overallScore": number (0-100),
  "breakdown": {
    "technicalImplementation": number (0-100),
    "innovation": number (0-100),
    "valueProposition": number (0-100),
    "completeness": number (0-100),
    "marketPotential": number (0-100),
    "codeQuality": number (0-100)
  },
  "reasoning": "Detailed explanation of scoring rationale",
  "flags": ["array of concern flags like 'No GitHub link', 'Incomplete description', etc."],
  "confidence": number (0.0-1.0)
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_completion_tokens: 1500,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from AI');
    }

    const result = JSON.parse(responseContent);
    
    // Calculate normalized overall score using weights
    const weightedScore = (
      result.breakdown.technicalImplementation * 0.25 +
      result.breakdown.innovation * 0.20 +
      result.breakdown.valueProposition * 0.20 +
      result.breakdown.completeness * 0.15 +
      result.breakdown.marketPotential * 0.10 +
      result.breakdown.codeQuality * 0.10
    );

    // Add automatic flags
    const flags = Array.isArray(result.flags) ? [...result.flags] : [];
    if (!project.has_github_link) {
      flags.push('No GitHub link');
    }
    if (!project.description || project.description.length === 0) {
      flags.push('Missing description');
    }
    if (!project.links) {
      flags.push('No demo links');
    }

    const aiScore: AIScore = {
      projectId: project.uuid,
      overallScore: Math.round(weightedScore),
      breakdown: {
        technicalImplementation: Math.round(result.breakdown.technicalImplementation),
        innovation: Math.round(result.breakdown.innovation),
        valueProposition: Math.round(result.breakdown.valueProposition),
        completeness: Math.round(result.breakdown.completeness),
        marketPotential: Math.round(result.breakdown.marketPotential),
        codeQuality: Math.round(result.breakdown.codeQuality),
      },
      reasoning: result.reasoning,
      flags,
      confidence: result.confidence || 0.7,
      timestamp: new Date().toISOString(),
    };

    return aiScore;

  } catch (error) {
    console.error('AI judging error:', error);
    throw new Error(`Failed to judge project: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'score-excellent';
  if (score >= 70) return 'score-good';
  if (score >= 60) return 'score-fair';
  return 'score-poor';
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Exceptional';
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Poor';
  return 'Very Poor';
}