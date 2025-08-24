import { NextResponse } from 'next/server';
import { judgeProject } from '@/app/utils/aiJudge';
import { Project, JudgeResponse } from '@/app/types';

export async function POST(request: Request) {
  try {
    const { project }: { project: Project } = await request.json();

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project data is required' },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_GROQ_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Groq API key not configured' },
        { status: 500 }
      );
    }

    // Judge the project using AI
    const score = await judgeProject(project);

    const response: JudgeResponse = {
      success: true,
      score
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error judging project:', error);
    
    const response: JudgeResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to judge project'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// Batch judging endpoint
export async function PUT(request: Request) {
  try {
    const { projects }: { projects: Project[] } = await request.json();

    if (!projects || !Array.isArray(projects)) {
      return NextResponse.json(
        { success: false, error: 'Projects array is required' },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_GROQ_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Groq API key not configured' },
        { status: 500 }
      );
    }

    const results = [];
    const errors = [];

    // Process projects with rate limiting
    for (let i = 0; i < projects.length; i++) {
      try {
        const score = await judgeProject(projects[i]);
        results.push({
          projectId: projects[i].uuid,
          score,
          success: true
        });

        // Rate limiting: wait 1 second between requests
        if (i < projects.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        errors.push({
          projectId: projects[i].uuid,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      errors,
      total: projects.length,
      successful: results.length,
      failed: errors.length
    });

  } catch (error) {
    console.error('Error in batch judging:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Batch judging failed' 
      },
      { status: 500 }
    );
  }
}