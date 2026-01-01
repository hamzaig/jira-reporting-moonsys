import { NextRequest, NextResponse } from 'next/server';
import {
  getAllJiraTickets,
  getTicketFilterOptions,
  TicketFilters
} from '@/lib/jira';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Get filter parameters
    const assignee = searchParams.get('assignee') || undefined;
    const status = searchParams.get('status') || undefined;
    const statusInclude = searchParams.getAll('statusInclude');
    const statusExclude = searchParams.getAll('statusExclude');
    const project = searchParams.get('project') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const issuetype = searchParams.get('issuetype') || undefined;
    const startAt = parseInt(searchParams.get('startAt') || '0', 10);
    const maxResults = parseInt(searchParams.get('maxResults') || '100', 10);
    const fetchAll = searchParams.get('fetchAll') === 'true';
    const getFilters = searchParams.get('getFilters') === 'true';

    console.log('API Route - fetchAll:', fetchAll, 'maxResults:', maxResults);

    const jiraHost = process.env.JIRA_HOST;
    const jiraEmail = process.env.JIRA_EMAIL;
    const jiraToken = process.env.JIRA_API_TOKEN;

    if (!jiraHost || !jiraEmail || !jiraToken) {
      return NextResponse.json(
        { error: 'Missing Jira configuration' },
        { status: 500 }
      );
    }

    // If requesting filter options
    if (getFilters) {
      const filterOptions = await getTicketFilterOptions(jiraHost, jiraEmail, jiraToken);
      return NextResponse.json(filterOptions);
    }

    // Build filters object
    const filters: TicketFilters = {};
    if (assignee) filters.assignee = assignee;
    if (status) filters.status = status;
    if (statusInclude.length > 0) filters.statusInclude = statusInclude;
    if (statusExclude.length > 0) filters.statusExclude = statusExclude;
    if (project) filters.project = project;
    if (priority) filters.priority = priority;
    if (issuetype) filters.issuetype = issuetype;

    console.log('About to call getAllJiraTickets with fetchAll:', fetchAll);
    
    const result = await getAllJiraTickets(
      jiraHost,
      jiraEmail,
      jiraToken,
      Object.keys(filters).length > 0 ? filters : undefined,
      startAt,
      maxResults,
      fetchAll
    );

    console.log('getAllJiraTickets returned:', {
      issuesCount: result.issues.length,
      total: result.total,
      maxResults: result.maxResults
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in tickets API:', error);
    if (error.response) {
      console.error('Jira API Response Status:', error.response.status);
      console.error('Jira API Response Data:', JSON.stringify(error.response.data, null, 2));
      return NextResponse.json(
        { 
          error: 'Failed to fetch tickets',
          details: error.response.data?.errorMessages || error.response.data?.message || 'Unknown error',
          status: error.response.status
        },
        { status: error.response.status || 500 }
      );
    }
    return NextResponse.json(
      { 
        error: 'Failed to fetch tickets',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

