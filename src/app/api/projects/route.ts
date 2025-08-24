import { NextResponse } from 'next/server';
import { Project, ProjectsResponse } from '@/app/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = parseInt(searchParams.get('from') || '0');
    const size = parseInt(searchParams.get('size') || '20');

    const headers = {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "Origin": "https://onchain-summer-awards.devfolio.co",
      "Referer": "https://onchain-summer-awards.devfolio.co/",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
      "Cookie": process.env.NEXT_PUBLIC_DEVFOLIO_COOKIE || ""
    };

    const payload = {
      hackathon_slugs: ["onchain-summer-awards"],
      q: "",
      filter: "all",
      prizes: [],
      prize_tracks: [],
      category: [],
      hashtags: [],
      tracks: [],
      from,
      size
    };

    const response = await fetch("https://api.devfolio.co/api/search/projects", {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: ProjectsResponse = await response.json();
    
    const projects: Project[] = data.hits.hits.map(hit => hit._source);
    
    return NextResponse.json({
      success: true,
      projects,
      total: data.hits.total.value,
      from,
      size
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch projects',
        projects: [],
        total: 0
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hackathon_slugs, from = 0, size = 100 } = body;

    const headers = {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "Origin": "https://onchain-summer-awards.devfolio.co",
      "Referer": "https://onchain-summer-awards.devfolio.co/",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
      "Cookie": process.env.NEXT_PUBLIC_DEVFOLIO_COOKIE || ""
    };

    const payload = {
      hackathon_slugs: hackathon_slugs || ["onchain-summer-awards"],
      q: "",
      filter: "all",
      prizes: [],
      prize_tracks: [],
      category: [],
      hashtags: [],
      tracks: [],
      from,
      size
    };

    const response = await fetch("https://api.devfolio.co/api/search/projects", {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: ProjectsResponse = await response.json();
    const projects: Project[] = data.hits.hits.map(hit => hit._source);
    
    return NextResponse.json({
      success: true,
      projects,
      total: data.hits.total.value,
      from,
      size
    });

  } catch (error) {
    console.error('Error in POST /api/projects:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process request' 
      },
      { status: 500 }
    );
  }
}