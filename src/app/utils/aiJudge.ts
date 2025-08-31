import Groq from 'groq-sdk';
import { Project, AIScore } from '@/app/types';

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!,
  dangerouslyAllowBrowser: true
});

export const SCORING_CRITERIA = {
  technicalImplementation: 25,
  innovation: 20,
  valueProposition: 20,
  completeness: 15,
  marketPotential: 10,
  codeQuality: 10,
};

// Base network detection patterns
const BASE_INDICATORS = {
  mainnet: [
    'base.org', 'basescan.org', 'base mainnet', 'base network',
    'chain id 8453', 'chainid: 8453', 'base-mainnet', '8453'
  ],
  testnet: [
    'base sepolia', 'base testnet', 'base goerli', 'sepolia.basescan.org',
    'chain id 84532', 'chainid: 84532', 'base-sepolia', '84532'
  ],
  general: [
    'base', 'coinbase', 'smart wallet', 'onchainkit', 'basename'
  ]
};

// Enhanced GitHub analysis with commit quality assessment
async function analyzeGitHubRepository(project: Project): Promise<any> {
  if (!process.env.NEXT_PUBLIC_GITHUB_TOKEN) {
    console.log('GitHub token not available');
    return null;
  }

  const githubUrls = extractGitHubUrls(project);
  if (githubUrls.length === 0) {
    console.log('No GitHub URLs found for project:', project.name);
    return null;
  }

  try {
    const githubUrl = githubUrls[0];
    console.log('Analyzing GitHub URL:', githubUrl);
    
    const match = githubUrl.match(/github\.com\/([^\/\s]+)\/([^\/\s\?#]+)/);
    if (!match) {
      console.log('Could not parse GitHub URL:', githubUrl);
      return null;
    }

    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, '').replace(/\/$/, '');
    
    console.log('Extracted GitHub info:', { owner, repo: cleanRepo });

    const headers = {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'HackathonJudge/1.0'
    };

    // Fetch repository data
    const repoUrl = `https://api.github.com/repos/${owner}/${cleanRepo}`;
    console.log('Fetching repo data from:', repoUrl);
    
    const repoResponse = await fetch(repoUrl, { headers });
    if (!repoResponse.ok) {
      console.log('Repo fetch failed:', repoResponse.status, repoResponse.statusText);
      return null;
    }
    
    const repoData = await repoResponse.json();
    console.log('Repo data fetched successfully:', repoData.name);

    // Fetch commits with detailed stats
    const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/commits?per_page=100`, { headers });
    const commits = commitsResponse.ok ? await commitsResponse.json() : [];

    // Fetch README
    let readmeData = null;
    try {
      const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/readme`, { headers });
      if (readmeResponse.ok) {
        const readmeJson = await readmeResponse.json();
        readmeData = {
          content: Buffer.from(readmeJson.content, 'base64').toString('utf-8'),
          size: readmeJson.size
        };
      }
    } catch (error) {
      console.log('README fetch failed, continuing without it');
    }

    // Analyze commit quality
    const commitAnalysis = analyzeCommitQuality(commits);
    
    // Calculate repository health score
    const healthScore = calculateRepoHealthScore(repoData, commits, readmeData);

    return {
      repository: {
        name: repoData.name,
        description: repoData.description,
        created_at: repoData.created_at,
        updated_at: repoData.updated_at,
        pushed_at: repoData.pushed_at,
        stargazers_count: repoData.stargazers_count,
        forks_count: repoData.forks_count,
        size: repoData.size,
        language: repoData.language,
        default_branch: repoData.default_branch,
      },
      commits: {
        total_count: commits.length,
        analysis: commitAnalysis,
        recent_commits: commits.slice(0, 10).map((commit: any) => ({
          message: commit.commit.message,
          date: commit.commit.author.date,
          author: commit.commit.author.name
        }))
      },
      readme: readmeData,
      health_score: healthScore,
      analysis_success: true
    };
  } catch (error) {
    console.error('GitHub API error for project', project.name, ':', error);
    return null;
  }
}

function analyzeCommitQuality(commits: any[]): any {
  if (!commits || commits.length === 0) {
    return {
      quality_score: 0,
      issues: ['No commits found'],
      commit_frequency: 'none',
      recent_activity: false
    };
  }

  const analysis = {
    quality_score: 50, // Start with baseline
    issues: [] as string[],
    commit_frequency: 'unknown',
    recent_activity: false,
    meaningful_commits: 0,
    template_indicators: 0
  };

  // Check for very few commits (major red flag)
  if (commits.length <= 2) {
    analysis.issues.push(`Only ${commits.length} commit${commits.length === 1 ? '' : 's'} - likely template usage`);
    analysis.quality_score = 10;
  } else if (commits.length <= 5) {
    analysis.issues.push(`Very few commits (${commits.length}) - limited development activity`);
    analysis.quality_score = 30;
  } else if (commits.length >= 20) {
    analysis.quality_score += 20; // Bonus for active development
  }

  // Analyze commit messages for quality
  const commitMessages = commits.map(c => c.commit.message.toLowerCase());
  let meaningfulCommits = 0;
  let templateIndicators = 0;

  commitMessages.forEach(message => {
    // Check for meaningful commit messages
    if (message.length > 10 && !message.includes('initial commit') && !message.includes('first commit')) {
      meaningfulCommits++;
    }
    
    // Check for template/lazy commits
    if (message.includes('initial commit') || 
        message.includes('first commit') ||
        message.includes('add files') ||
        message.includes('update readme') ||
        message === 'update' ||
        message === 'fix' ||
        message.length < 5) {
      templateIndicators++;
    }
  });

  analysis.meaningful_commits = meaningfulCommits;
  analysis.template_indicators = templateIndicators;

  // Penalize for too many template-style commits
  if (templateIndicators > commits.length * 0.5) {
    analysis.issues.push('Many low-quality commit messages detected');
    analysis.quality_score -= 15;
  }

  // Check recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentCommits = commits.filter(commit => 
    new Date(commit.commit.author.date) > thirtyDaysAgo
  );

  if (recentCommits.length > 0) {
    analysis.recent_activity = true;
    analysis.quality_score += 10;
  } else {
    analysis.issues.push('No recent commits in the last 30 days');
    analysis.quality_score -= 10;
  }

  // Check for commit frequency patterns
  if (commits.length > 10) {
    const firstCommit = new Date(commits[commits.length - 1].commit.author.date);
    const lastCommit = new Date(commits[0].commit.author.date);
    const daysBetween = Math.ceil((lastCommit.getTime() - firstCommit.getTime()) / (1000 * 3600 * 24));
    
    if (daysBetween > 0) {
      const commitsPerDay = commits.length / daysBetween;
      if (commitsPerDay > 2) {
        analysis.commit_frequency = 'very_active';
      } else if (commitsPerDay > 0.5) {
        analysis.commit_frequency = 'active';
      } else {
        analysis.commit_frequency = 'sparse';
      }
    }
  }

  analysis.quality_score = Math.max(0, Math.min(100, analysis.quality_score));
  return analysis;
}

function calculateRepoHealthScore(repoData: any, commits: any[], readmeData: any): number {
  let score = 50; // Base score

  // Repository age and activity
  const created = new Date(repoData.created_at);
  const updated = new Date(repoData.updated_at);
  const daysSinceCreation = Math.ceil((Date.now() - created.getTime()) / (1000 * 3600 * 24));
  
  if (daysSinceCreation < 7) {
    score += 10; // Bonus for recent creation (hackathon context)
  }

  // README quality
  if (readmeData) {
    if (readmeData.content.length > 500) {
      score += 15; // Good documentation
    } else if (readmeData.content.length > 100) {
      score += 5; // Basic documentation
    }
  } else {
    score -= 10; // No README
  }

  // Repository size (indicates real development)
  if (repoData.size > 1000) { // More than 1MB
    score += 10;
  } else if (repoData.size < 100) { // Less than 100KB might be just config files
    score -= 5;
  }

  // Stars and forks (community validation)
  score += Math.min(10, repoData.stargazers_count * 2);
  score += Math.min(5, repoData.forks_count * 3);

  return Math.max(0, Math.min(100, score));
}

function extractGitHubUrls(project: Project): string[] {
  const urls: string[] = [];
  
  if (project.links) {
    const linkUrls = project.links.split(/[,\s\n]+/).map(link => link.trim()).filter(link => link.length > 0);
    linkUrls.forEach(url => {
      if (url.includes('github.com')) {
        const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
        urls.push(cleanUrl);
      }
    });
  }

  if (project.description) {
    project.description.forEach(desc => {
      const githubMatches = desc.content.match(/(?:https?:\/\/)?github\.com\/[^\s\)]+/g);
      if (githubMatches) {
        githubMatches.forEach(match => {
          const cleanUrl = match.startsWith('http') ? match : `https://${match}`;
          urls.push(cleanUrl);
        });
      }
    });
  }

  return [...new Set(urls)];
}

function analyzeBaseIntegration(project: Project): any {
  const description = project.description?.map(d => d.content).join(' ').toLowerCase() || '';
  const tagline = project.tagline.toLowerCase();
  const links = project.links?.toLowerCase() || '';
  const allText = `${description} ${tagline} ${links}`;
  
  const analysis = {
    has_base_indicators: false,
    network_type: 'none',
    base_features: [],
    bonus_score: 0
  };

  const hasMainnet = BASE_INDICATORS.mainnet.some(indicator => allText.includes(indicator));
  const hasTestnet = BASE_INDICATORS.testnet.some(indicator => allText.includes(indicator));
  const hasGeneral = BASE_INDICATORS.general.some(indicator => allText.includes(indicator));

  if (hasMainnet) {
    analysis.network_type = 'base_mainnet';
    analysis.bonus_score = 8;
    analysis.has_base_indicators = true;
  } else if (hasTestnet) {
    analysis.network_type = 'base_testnet';
    analysis.bonus_score = 5;
    analysis.has_base_indicators = true;
  } else if (hasGeneral) {
    analysis.network_type = 'base_general';
    analysis.bonus_score = 3;
    analysis.has_base_indicators = true;
  }

  return analysis;
}

export async function judgeProject(project: Project): Promise<AIScore> {
  try {
    // Analyze GitHub repository
    let githubAnalysis = null;
    if (project.has_github_link || extractGitHubUrls(project).length > 0) {
      githubAnalysis = await analyzeGitHubRepository(project);
    }

    // Analyze Base integration
    const baseAnalysis = analyzeBaseIntegration(project);

    const systemPrompt = `You are an elite hackathon judge with 15+ years of experience evaluating top-tier technical projects. Your standards are exceptionally high.

CRITICAL EVALUATION PRINCIPLES:
1. EXCELLENCE IS RARE: Only 5-10% of projects should score above 85. Most projects are good but not exceptional.
2. INNOVATION MUST BE PROVEN: Claims of "AI-powered" or "blockchain-based" mean nothing without technical depth.
3. EXECUTION OVER IDEAS: A well-executed simple idea beats a poorly executed complex one.
4. MARKET VALIDATION REQUIRED: Grand claims about market size need evidence or validation.
5. CODE QUALITY MATTERS: GitHub presence, documentation, and architecture are crucial.
6. COMMIT HISTORY IS CRITICAL: Few commits indicate template usage or lack of real development.

STRICT SCORING GUIDELINES:

Technical Implementation (25%):
- 90-100: Demonstrates advanced algorithms, complex system architecture, cutting-edge technology. Senior-level engineering.
- 80-89: Solid technical implementation with complexity. Good engineering practices evident.
- 70-79: Functional implementation meeting basic requirements. Standard approaches used competently.
- 60-69: Basic functionality working but with technical limitations or shortcuts.
- 0-59: Significant technical issues, incomplete implementation, or broken functionality.

Innovation & Uniqueness (20%):
- 90-100: Breakthrough concept or truly novel approach that could change the industry. Never seen before.
- 80-89: Creative solution combining existing technologies in innovative ways. Clear originality.
- 70-79: Some innovative elements but builds heavily on existing solutions.
- 60-69: Minor improvements to existing approaches. Limited novelty.
- 0-59: Standard solution with no innovative elements.

Value Proposition (20%):
- 90-100: Solves a major problem with clear, validated demand. Strong evidence of market need and solution fit.
- 80-89: Addresses important problem with good solution fit. Some market validation present.
- 70-79: Decent problem-solution fit but limited evidence of demand.
- 60-69: Problem exists but solution may not be optimal or market unclear.
- 0-59: Weak problem definition or solution doesn't adequately address the need.

Project Completeness (15%):
- 85-100: Production-ready quality with polish, error handling, and user experience considerations.
- 70-84: Most planned features implemented and working well. Good demo quality.
- 60-69: Core functionality complete but lacking polish or some planned features.
- 45-59: Basic functionality present but significant gaps or rough implementation.
- 0-44: Incomplete project with major missing pieces.

Market/Consumer Potential (10%):
- 90-100: Large addressable market with clear monetization path and competitive advantages.
- 80-89: Good market opportunity with reasonable path to adoption and growth.
- 70-79: Decent market potential but some uncertainty about adoption or competition.
- 60-69: Limited market or unclear path to significant adoption.
- 0-59: Very niche market or no clear commercialization path.

Code Quality & Documentation (10%):
- 85-100: Exemplary code structure, comprehensive documentation, best practices throughout.
- 70-84: Good code organization with decent documentation. Follows most best practices.
- 60-69: Functional code with basic documentation. Some best practices followed.
- 45-59: Working code but poor structure or minimal documentation.
- 0-44: Poor code quality, no documentation, or code not accessible.

AUTOMATIC PENALTIES:
- No GitHub link: -15 points
- ≤2 commits: -20 points (major red flag - template usage)
- 3-5 commits: -15 points (very limited development)
- No demo links: -10 points
- Incomplete/poor description: -8 points
- Solo project (less collaboration): -3 points
- Only basic tech stack with no complexity: -5 points
- No recent commits (30+ days): -10 points

BONUSES (for exceptional projects):
- Base mainnet integration: +8 points
- Base testnet integration: +5 points  
- 20+ meaningful commits: +5 points
- Excellent documentation: +5 points

BE HARSH BUT FAIR. Most projects should score 60-80. Only truly exceptional projects deserve 85+.`;

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
      githubAnalysis: githubAnalysis ? {
        totalCommits: githubAnalysis.commits.total_count,
        commitQuality: githubAnalysis.commits.analysis.quality_score,
        recentActivity: githubAnalysis.commits.analysis.recent_activity,
        healthScore: githubAnalysis.health_score,
        issues: githubAnalysis.commits.analysis.issues
      } : null,
      baseAnalysis: baseAnalysis
    };

    const userPrompt = `Evaluate this hackathon project with STRICT STANDARDS. Be harsh but fair. Focus on execution quality and genuine development activity.

PROJECT DATA:
${JSON.stringify(projectData, null, 2)}

GITHUB ANALYSIS:
${githubAnalysis ? `
Repository: ${githubAnalysis.repository.name}
Total Commits: ${githubAnalysis.commits.total_count}
Commit Quality Score: ${githubAnalysis.commits.analysis.quality_score}/100
Recent Activity: ${githubAnalysis.commits.analysis.recent_activity}
Repository Health: ${githubAnalysis.health_score}/100
Issues Found: ${githubAnalysis.commits.analysis.issues.join(', ')}
Meaningful Commits: ${githubAnalysis.commits.analysis.meaningful_commits}
Template Indicators: ${githubAnalysis.commits.analysis.template_indicators}
` : 'No GitHub repository found or analysis failed'}

BASE INTEGRATION:
Network Type: ${baseAnalysis.network_type}
Base Integration: ${baseAnalysis.has_base_indicators}

CRITICAL EVALUATION POINTS:
1. If commits ≤ 2: This is likely template usage - score harshly
2. If commits 3-5: Very limited development - significant penalty
3. If no recent activity: Project may be abandoned - penalty
4. Innovation claims must be backed by technical depth
5. Base integration is bonus, not requirement

Be strict with top scores (85+). Only award them for truly exceptional projects with:
- Advanced technical implementation
- Genuine innovation (not just claims)
- Strong execution and polish
- Active development history
- Real market validation

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
  "reasoning": "Detailed explanation focusing on commit analysis and execution quality",
  "flags": ["array of specific issues found"],
  "confidence": number (0.7-1.0)
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_completion_tokens: 2500,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from AI');
    }

    const result = JSON.parse(responseContent);
    
    // Calculate enhanced score with strict penalties
    const enhancedScore = calculateStrictEnhancedScore(project, result.breakdown, githubAnalysis, baseAnalysis);
    
    // Generate comprehensive flags
    const flags = Array.isArray(result.flags) ? [...result.flags] : [];
    const autoFlags = generateStrictFlags(project, result.breakdown, githubAnalysis, baseAnalysis);
    flags.push(...autoFlags);

    const aiScore: AIScore = {
      projectId: project.uuid,
      overallScore: enhancedScore.finalScore,
      breakdown: {
        technicalImplementation: parseFloat(result.breakdown.technicalImplementation.toFixed(1)),
        innovation: parseFloat(result.breakdown.innovation.toFixed(1)),
        valueProposition: parseFloat(result.breakdown.valueProposition.toFixed(1)),
        completeness: parseFloat(result.breakdown.completeness.toFixed(1)),
        marketPotential: parseFloat(result.breakdown.marketPotential.toFixed(1)),
        codeQuality: parseFloat(result.breakdown.codeQuality.toFixed(1)),
      },
      reasoning: result.reasoning + `\n\nScore Analysis:\n${enhancedScore.analysisDetails}`,
      flags: [...new Set(flags)],
      confidence: result.confidence || 0.8,
      timestamp: new Date().toISOString(),
      // Add GitHub analysis data for frontend display
      githubData: githubAnalysis ? {
        totalCommits: githubAnalysis.commits.total_count,
        recentActivity: githubAnalysis.commits.analysis.recent_activity,
        commitQuality: githubAnalysis.commits.analysis.quality_score,
        healthScore: githubAnalysis.health_score
      } : undefined
    };

    return aiScore;

  } catch (error) {
    console.error('AI judging error:', error);
    throw new Error(`Failed to judge project: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function calculateStrictEnhancedScore(
  project: Project, 
  breakdown: any, 
  githubAnalysis: any, 
  baseAnalysis: any
) {
  // Calculate base weighted score
  const baseScore = (
    breakdown.technicalImplementation * 0.25 +
    breakdown.innovation * 0.20 +
    breakdown.valueProposition * 0.20 +
    breakdown.completeness * 0.15 +
    breakdown.marketPotential * 0.10 +
    breakdown.codeQuality * 0.10
  );

  let totalPenalty = 0;
  let bonusPoints = 0;
  let analysisDetails = '';

  // Strict GitHub-based penalties
  if (githubAnalysis) {
    const commitCount = githubAnalysis.commits.total_count;
    
    if (commitCount <= 2) {
      totalPenalty += 20;
      analysisDetails += `• MAJOR PENALTY: Only ${commitCount} commit(s) - likely template usage (-20 points)\n`;
    } else if (commitCount <= 5) {
      totalPenalty += 15;
      analysisDetails += `• PENALTY: Very few commits (${commitCount}) - limited development (-15 points)\n`;
    } else if (commitCount >= 20) {
      bonusPoints += 5;
      analysisDetails += `• BONUS: Active development with ${commitCount} commits (+5 points)\n`;
    }

    if (!githubAnalysis.commits.analysis.recent_activity) {
      totalPenalty += 10;
      analysisDetails += `• PENALTY: No recent commits in last 30 days (-10 points)\n`;
    }

    if (githubAnalysis.commits.analysis.quality_score < 30) {
      totalPenalty += 8;
      analysisDetails += `• PENALTY: Poor commit quality (${githubAnalysis.commits.analysis.quality_score}/100) (-8 points)\n`;
    }

    if (githubAnalysis.health_score > 80) {
      bonusPoints += 5;
      analysisDetails += `• BONUS: Excellent repository health (${githubAnalysis.health_score}/100) (+5 points)\n`;
    }
  } else if (project.has_github_link || extractGitHubUrls(project).length > 0) {
    totalPenalty += 10;
    analysisDetails += `• PENALTY: GitHub repository inaccessible (-10 points)\n`;
  } else {
    totalPenalty += 15;
    analysisDetails += `• PENALTY: No GitHub repository provided (-15 points)\n`;
  }

  // Base integration bonuses
  if (baseAnalysis.bonus_score > 0) {
    bonusPoints += baseAnalysis.bonus_score;
    analysisDetails += `• BONUS: Base integration (${baseAnalysis.network_type}) (+${baseAnalysis.bonus_score} points)\n`;
  }

  // Standard penalties
  if (!project.links || project.links.trim().length === 0) {
    totalPenalty += 10;
    analysisDetails += `• PENALTY: No demo links provided (-10 points)\n`;
  }

  if (!project.description || project.description.every(desc => desc.content.length < 100)) {
    totalPenalty += 8;
    analysisDetails += `• PENALTY: Poor project description (-8 points)\n`;
  }

  if (project.members && project.members.length === 1) {
    totalPenalty += 3;
    analysisDetails += `• PENALTY: Solo project - limited collaboration (-3 points)\n`;
  }

  // Apply all adjustments
  let adjustedScore = Math.max(0, baseScore - totalPenalty + bonusPoints);
  
  // Apply logarithmic curve for scores above 80 to make top scores harder
  if (adjustedScore > 80) {
    const excess = adjustedScore - 80;
    const curvedExcess = Math.log10(excess + 1) * 8.5; // Max ~8.5 points above 80
    adjustedScore = 80 + curvedExcess;
  }

  // Additional strictness: scores above 90 are extremely rare
  if (adjustedScore > 90) {
    const ultraExcess = adjustedScore - 90;
    adjustedScore = 90 + (ultraExcess * 0.3); // Only 30% of excess above 90 counts
  }

  // Micro-variation to prevent clustering
  const microVariation = (Math.random() - 0.5) * 0.8;
  adjustedScore += microVariation;

  const finalScore = parseFloat(Math.max(1, Math.min(100, adjustedScore)).toFixed(1));

  return {
    baseScore: parseFloat(baseScore.toFixed(1)),
    totalPenalty: parseFloat(totalPenalty.toFixed(1)),
    bonusPoints: parseFloat(bonusPoints.toFixed(1)),
    finalScore,
    analysisDetails
  };
}

function generateStrictFlags(
  project: Project, 
  breakdown: any, 
  githubAnalysis: any, 
  baseAnalysis: any
): string[] {
  const flags: string[] = [];

  // GitHub-specific flags
  if (githubAnalysis) {
    const commitCount = githubAnalysis.commits.total_count;
    
    if (commitCount <= 2) {
      flags.push(`CRITICAL: Only ${commitCount} commit(s) - possible template usage`);
    } else if (commitCount <= 5) {
      flags.push(`WARNING: Very few commits (${commitCount}) - limited development activity`);
    }

    if (!githubAnalysis.commits.analysis.recent_activity) {
      flags.push('No recent commits in the last 30 days');
    }

    if (githubAnalysis.commits.analysis.template_indicators > commitCount * 0.5) {
      flags.push('Many low-quality/template-style commit messages');
    }

    if (!githubAnalysis.readme || githubAnalysis.readme.size < 200) {
      flags.push('Missing or very brief README documentation');
    }
  } else if (project.has_github_link || extractGitHubUrls(project).length > 0) {
    flags.push('GitHub repository inaccessible or private');
  } else {
    flags.push('No GitHub repository provided');
  }

  // Standard flags
  if (!project.links || project.links.trim().length === 0) {
    flags.push('No demo or live links provided');
  }

  if (!project.description || project.description.every(desc => desc.content.length < 100)) {
    flags.push('Very brief or missing project description');
  }

  if (breakdown.technicalImplementation < 50) {
    flags.push('Significant technical implementation issues');
  }

  if (breakdown.innovation < 40) {
    flags.push('Limited innovation or uniqueness');
  }

  if (breakdown.completeness < 45) {
    flags.push('Project appears incomplete');
  }

  return flags;
}

export function getScoreColor(score: number): string {
  if (score >= 85) return 'score-excellent';
  if (score >= 75) return 'score-good';
  if (score >= 60) return 'score-fair';
  return 'score-poor';
}

export function getScoreLabel(score: number): string {
  if (score >= 95) return 'Outstanding';
  if (score >= 90) return 'Exceptional';
  if (score >= 85) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 45) return 'Poor';
  return 'Very Poor';
}