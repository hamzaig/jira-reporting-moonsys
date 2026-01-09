import { NextRequest, NextResponse } from 'next/server';
import {
  getDateRange,
  getJiraIssues,
  getWorklogsForIssue,
  filterWorklogsByDate,
  aggregateWorklogs,
  mergeUserStats,
  AggregatedStats
} from '@/lib/jira';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') || 'daily') as 'daily' | 'yesterday' | 'weekly' | 'monthly' | 'custom';
    const customStartDate = searchParams.get('startDate');
    const customEndDate = searchParams.get('endDate');

    const jiraHost = process.env.JIRA_HOST;
    const jiraEmail = process.env.JIRA_EMAIL;
    const jiraToken = process.env.JIRA_API_TOKEN;
    const projectKey = process.env.PROJECT_KEY;

    if (!jiraHost || !jiraEmail || !jiraToken) {
      return NextResponse.json(
        { error: 'Missing Jira configuration' },
        { status: 500 }
      );
    }

    let startDate: string;
    let endDate: string;

    if (period === 'custom' && customStartDate && customEndDate) {
      startDate = customStartDate;
      endDate = customEndDate;
    } else {
      const dateRange = getDateRange(period as 'daily' | 'yesterday' | 'weekly' | 'monthly');
      startDate = dateRange.startDate;
      endDate = dateRange.endDate;
    }

    const issues = await getJiraIssues(startDate, jiraHost, jiraEmail, jiraToken, projectKey, endDate);

    const allUserStats: AggregatedStats = {};

    for (const issue of issues) {
      const issueKey = issue.key;
      const issueSummary = issue.fields.summary;
      const estimatedTime = issue.fields.timeoriginalestimate || null;

      const worklogs = await getWorklogsForIssue(issueKey, jiraHost, jiraEmail, jiraToken);
      const filteredWorklogs = filterWorklogsByDate(worklogs, startDate, endDate);

      if (filteredWorklogs.length > 0) {
        const issueStats = aggregateWorklogs(filteredWorklogs, issueKey, issueSummary, estimatedTime);
        mergeUserStats(allUserStats, issueStats);
      }
    }

    return NextResponse.json({
      period,
      startDate,
      endDate,
      userStats: allUserStats,
      totalIssues: issues.length
    });

  } catch (error) {
    console.error('Error in worklog API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work logs' },
      { status: 500 }
    );
  }
}
