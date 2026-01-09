import axios from 'axios';

export interface Worklog {
  author: {
    displayName: string;
    accountId: string;
  };
  started: string;
  timeSpentSeconds: number;
}

export interface Issue {
  key: string;
  fields: {
    summary: string;
    timeoriginalestimate?: number | null;
  };
}

export interface DetailedTicket {
  key: string;
  id: string;
  fields: {
    summary: string;
    status: {
      name: string;
      statusCategory: {
        key: string;
        name: string;
      };
    };
    assignee: {
      displayName: string;
      emailAddress: string;
      avatarUrls: {
        '48x48': string;
      };
    } | null;
    project: {
      key: string;
      name: string;
    };
    priority: {
      name: string;
      iconUrl: string;
    };
    issuetype: {
      name: string;
      iconUrl: string;
    };
    created: string;
    updated: string;
    resolutiondate: string | null;
    timeoriginalestimate?: number | null;
    timeestimate?: number | null;
    timespent?: number | null;
  };
}

export interface UserStats {
  totalTime: number;
  tickets: {
    [key: string]: {
      summary: string;
      time: number;
      estimatedTime?: number | null;
    };
  };
  dailyTime: {
    [date: string]: number;
  };
}

export interface AggregatedStats {
  [user: string]: UserStats;
}

// Use a fixed reporting timezone so "today" and other ranges don't drift based on server location
const REPORT_TIME_ZONE = process.env.REPORT_TIME_ZONE || 'Asia/Karachi';

function formatDateInTimeZone(date: Date, timeZone: string = REPORT_TIME_ZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

// Returns a Date anchored to midnight UTC for the calendar day in the reporting timezone
function getZonedDateBase(timeZone: string = REPORT_TIME_ZONE): Date {
  const formatted = formatDateInTimeZone(new Date(), timeZone);
  const [year, month, day] = formatted.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function getDateRange(period: 'daily' | 'yesterday' | 'weekly' | 'monthly') {
  const startDate = getZonedDateBase();
  const endDate = getZonedDateBase();

  switch(period) {
    case 'daily':
      break;
    case 'yesterday':
      startDate.setUTCDate(startDate.getUTCDate() - 1);
      endDate.setUTCDate(endDate.getUTCDate() - 1);
      break;
    case 'weekly':
      const day = startDate.getUTCDay();
      const diff = startDate.getUTCDate() - day + (day === 0 ? -6 : 1);
      startDate.setUTCDate(diff);
      break;
    case 'monthly':
      startDate.setUTCDate(1);
      break;
  }

  return {
    startDate: formatDateInTimeZone(startDate),
    endDate: formatDateInTimeZone(endDate)
  };
}

export function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export async function getJiraIssues(
  startDate: string,
  jiraHost: string,
  jiraEmail: string,
  jiraToken: string,
  projectKey?: string,
  endDate?: string
): Promise<Issue[]> {
  const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');

  let jql = endDate
    ? `worklogDate >= "${startDate}" AND worklogDate <= "${endDate}" ORDER BY updated DESC`
    : `worklogDate >= "${startDate}" ORDER BY updated DESC`;
  if (projectKey) {
    jql = `project = ${projectKey} AND ${jql}`;
  }

  const fields = 'summary,worklog,assignee,timeoriginalestimate';
  
  try {
    // Use the new /rest/api/3/search/jql endpoint (required as of May 2025)
    // Try POST method first (as per Jira API v3 documentation)
    let response;
    try {
      response = await axios({
        method: 'post',
        url: `https://${jiraHost}/rest/api/3/search/jql`,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        data: {
          jql: jql,
          fields: fields.split(','),
          maxResults: 100
        }
      });
    } catch (postError: any) {
      // If POST fails, try GET method
      console.log('POST to /rest/api/3/search/jql failed, trying GET...');
      console.log('POST Error Status:', postError.response?.status);
      console.log('POST Error Data:', JSON.stringify(postError.response?.data, null, 2));
      try {
        response = await axios({
          method: 'get',
          url: `https://${jiraHost}/rest/api/3/search/jql`,
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          },
          params: {
            jql: jql,
            fields: fields,
            maxResults: 100
          }
        });
      } catch (getError: any) {
        // If GET also fails, try API v2 as fallback
        console.log('GET to /rest/api/3/search/jql failed, trying API v2...');
        console.log('GET Error Status:', getError.response?.status);
        console.log('GET Error Data:', JSON.stringify(getError.response?.data, null, 2));
        response = await axios({
          method: 'get',
          url: `https://${jiraHost}/rest/api/2/search`,
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          },
          params: {
            jql: jql,
            fields: fields,
            maxResults: 100
          }
        });
      }
    }

    return response.data.issues || [];
  } catch (error) {
    console.error('Error fetching issues:', error);
    throw error;
  }
}

export async function getWorklogsForIssue(
  issueKey: string,
  jiraHost: string,
  jiraEmail: string,
  jiraToken: string
): Promise<Worklog[]> {
  const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');

  try {
    const response = await axios({
      method: 'get',
      url: `https://${jiraHost}/rest/api/3/issue/${issueKey}/worklog`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    return response.data.worklogs || [];
  } catch (error) {
    console.error(`Error fetching worklogs for ${issueKey}:`, error);
    return [];
  }
}

export function filterWorklogsByDate(
  worklogs: Worklog[],
  startDate: string,
  endDate: string
): Worklog[] {
  return worklogs.filter(worklog => {
    const worklogDate = formatDateInTimeZone(new Date(worklog.started));
    return worklogDate >= startDate && worklogDate <= endDate;
  });
}

export function aggregateWorklogs(
  worklogs: Worklog[],
  issueKey: string,
  issueSummary: string,
  estimatedTime?: number | null
): AggregatedStats {
  const userStats: AggregatedStats = {};

  worklogs.forEach(worklog => {
    const author = worklog.author.displayName;
    const timeSpent = worklog.timeSpentSeconds;
    const date = formatDateInTimeZone(new Date(worklog.started));

    if (!userStats[author]) {
      userStats[author] = {
        totalTime: 0,
        tickets: {},
        dailyTime: {}
      };
    }

    userStats[author].totalTime += timeSpent;

    if (!userStats[author].tickets[issueKey]) {
      userStats[author].tickets[issueKey] = {
        summary: issueSummary,
        time: 0,
        estimatedTime: estimatedTime || null
      };
    }
    userStats[author].tickets[issueKey].time += timeSpent;

    if (!userStats[author].dailyTime[date]) {
      userStats[author].dailyTime[date] = 0;
    }
    userStats[author].dailyTime[date] += timeSpent;
  });

  return userStats;
}

export function mergeUserStats(target: AggregatedStats, source: AggregatedStats): void {
  Object.keys(source).forEach(user => {
    if (!target[user]) {
      target[user] = {
        totalTime: 0,
        tickets: {},
        dailyTime: {}
      };
    }

    target[user].totalTime += source[user].totalTime;

    Object.keys(source[user].tickets).forEach(ticket => {
      if (!target[user].tickets[ticket]) {
        target[user].tickets[ticket] = source[user].tickets[ticket];
      } else {
        target[user].tickets[ticket].time += source[user].tickets[ticket].time;
        // Preserve estimated time if not already set
        if (!target[user].tickets[ticket].estimatedTime && source[user].tickets[ticket].estimatedTime) {
          target[user].tickets[ticket].estimatedTime = source[user].tickets[ticket].estimatedTime;
        }
      }
    });

    Object.keys(source[user].dailyTime).forEach(date => {
      if (!target[user].dailyTime[date]) {
        target[user].dailyTime[date] = 0;
      }
      target[user].dailyTime[date] += source[user].dailyTime[date];
    });
  });
}

export interface TicketFilters {
  assignee?: string;
  status?: string;
  statusInclude?: string[];
  statusExclude?: string[];
  project?: string;
  priority?: string;
  issuetype?: string;
}

async function fetchJiraTicketsBatch(
  jiraHost: string,
  auth: string,
  jql: string,
  fields: string[],
  startAt: number,
  maxResults: number,
  nextPageToken?: string
): Promise<{ issues: DetailedTicket[]; total: number; startAt: number; maxResults: number; nextPageToken?: string; isLast?: boolean }> {
  // Use the new /rest/api/3/search/jql endpoint (required as of May 2025)
  // Try POST method first (as per Jira API v3 documentation)
  let response;
  try {
    const postData: any = {
      jql: jql,
      fields: fields,
      maxResults: maxResults
    };
    
    // Use nextPageToken if available (new API v3 format), otherwise use startAt
    if (nextPageToken) {
      postData.nextPageToken = nextPageToken;
    } else {
      postData.startAt = startAt;
    }
    
    response = await axios({
      method: 'post',
      url: `https://${jiraHost}/rest/api/3/search/jql`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      data: postData
    });
  } catch (postError: any) {
    // If POST fails, try GET method
    console.log('POST to /rest/api/3/search/jql failed, trying GET...');
    console.log('POST Error Status:', postError.response?.status);
    console.log('POST Error Data:', JSON.stringify(postError.response?.data, null, 2));
    try {
      const getParams: any = {
        jql: jql,
        fields: fields.join(','),
        maxResults: maxResults
      };
      
      // Use nextPageToken if available (new API v3 format), otherwise use startAt
      if (nextPageToken) {
        getParams.nextPageToken = nextPageToken;
      } else {
        getParams.startAt = startAt;
      }
      
      response = await axios({
        method: 'get',
        url: `https://${jiraHost}/rest/api/3/search/jql`,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        },
        params: getParams
      });
    } catch (getError: any) {
      // If GET also fails, try API v2 as fallback
      console.log('GET to /rest/api/3/search/jql failed, trying API v2...');
      console.log('GET Error Status:', getError.response?.status);
      console.log('GET Error Data:', JSON.stringify(getError.response?.data, null, 2));
      response = await axios({
        method: 'get',
        url: `https://${jiraHost}/rest/api/2/search`,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        },
        params: {
          jql: jql,
          fields: fields.join(','),
          startAt: startAt,
          maxResults: maxResults
        }
      });
    }
  }

  const responseData = response.data;
  console.log('Jira API Response structure:', {
    hasIssues: !!responseData.issues,
    issuesCount: responseData.issues?.length || 0,
    total: responseData.total,
    startAt: responseData.startAt,
    maxResults: responseData.maxResults,
    nextPageToken: responseData.nextPageToken,
    isLast: responseData.isLast,
    keys: Object.keys(responseData)
  });

  // Handle new API v3 format with nextPageToken
  const hasNextPageToken = !!responseData.nextPageToken;
  const isLast = responseData.isLast === true;

  return {
    issues: responseData.issues || [],
    total: responseData.total ?? responseData.totalCount ?? (isLast ? (responseData.issues?.length || 0) : Infinity),
    startAt: responseData.startAt ?? startAt,
    maxResults: responseData.maxResults ?? maxResults,
    nextPageToken: responseData.nextPageToken,
    isLast: isLast
  };
}

export async function getAllJiraTickets(
  jiraHost: string,
  jiraEmail: string,
  jiraToken: string,
  filters?: TicketFilters,
  startAt: number = 0,
  maxResults: number = 100,
  fetchAll: boolean = false
): Promise<{ issues: DetailedTicket[]; total: number; startAt: number; maxResults: number }> {
  console.log(`getAllJiraTickets called with fetchAll=${fetchAll}, startAt=${startAt}, maxResults=${maxResults}`);
  const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');

  // Build JQL query with filters
  let jqlParts: string[] = [];
  
  if (filters?.assignee) {
    // Handle unassigned tickets
    if (filters.assignee === '__UNASSIGNED__') {
      jqlParts.push('assignee IS EMPTY');
    } else {
      jqlParts.push(`assignee = "${filters.assignee}"`);
    }
  }
  
  // Handle status filters - priority: statusInclude > statusExclude > status (single)
  if (filters?.statusInclude && filters.statusInclude.length > 0) {
    // Multiple statuses to include: status IN ("Status1", "Status2", ...)
    const statusList = filters.statusInclude.map(s => `"${s}"`).join(', ');
    jqlParts.push(`status IN (${statusList})`);
  } else if (filters?.statusExclude && filters.statusExclude.length > 0) {
    // Multiple statuses to exclude: status NOT IN ("Status1", "Status2", ...)
    const statusList = filters.statusExclude.map(s => `"${s}"`).join(', ');
    jqlParts.push(`status NOT IN (${statusList})`);
  } else if (filters?.status) {
    // Single status filter (backward compatibility)
    jqlParts.push(`status = "${filters.status}"`);
  }
  
  if (filters?.project) {
    jqlParts.push(`project = "${filters.project}"`);
  }
  
  if (filters?.priority) {
    jqlParts.push(`priority = "${filters.priority}"`);
  }
  
  if (filters?.issuetype) {
    jqlParts.push(`issuetype = "${filters.issuetype}"`);
  }

  // Build JQL query
  let jql: string;
  if (jqlParts.length > 0) {
    jql = jqlParts.join(' AND ') + ' ORDER BY updated DESC';
  } else {
    // Use a query that matches all issues - using a date from year 2000 (practically all issues)
    jql = 'updated >= "2000-01-01" ORDER BY updated DESC';
  }

  console.log('JQL Query:', jql);
  console.log('Request URL:', `https://${jiraHost}/rest/api/3/search/jql`);

  const fields = ['summary', 'status', 'assignee', 'project', 'priority', 'issuetype', 'created', 'updated', 'resolutiondate', 'timeoriginalestimate', 'timeestimate', 'timespent'];
  
  try {
    if (fetchAll) {
      // Fetch all tickets by paginating through all results
      const allIssues: DetailedTicket[] = [];
      let currentStartAt = 0;
      let nextPageToken: string | undefined = undefined;
      const batchSize = 100; // Jira API max is typically 100 per request
      let total = 0;
      let hasMore = true;
      let isUsingNewApiFormat = false;

      console.log('Fetching all tickets with fetchAll=true');

      while (hasMore) {
        if (nextPageToken) {
          console.log(`Fetching batch with nextPageToken (new API v3 format)`);
        } else {
          console.log(`Fetching batch: startAt=${currentStartAt}, batchSize=${batchSize}`);
        }
        
        const batch = await fetchJiraTicketsBatch(
          jiraHost,
          auth,
          jql,
          fields,
          currentStartAt,
          batchSize,
          nextPageToken
        );

        console.log(`Batch received: ${batch.issues.length} issues, isLast=${batch.isLast}, hasNextPageToken=${!!batch.nextPageToken}`);

        allIssues.push(...batch.issues);
        
        // Check if using new API v3 format with nextPageToken
        if (batch.nextPageToken !== undefined) {
          isUsingNewApiFormat = true;
          nextPageToken = batch.nextPageToken;
          hasMore = !batch.isLast;
          
          if (batch.isLast) {
            console.log('Reached last page (isLast=true)');
            total = allIssues.length;
          } else {
            console.log(`More pages available, nextPageToken exists`);
          }
        } else {
          // Using old API format with startAt
          // Get total from first batch
          if (total === 0) {
            total = batch.total;
            console.log(`Total tickets reported by Jira: ${total}`);
            
            // If total is 0 or unreliable, we'll continue fetching until we get fewer results
            if (total === 0 || total < batch.issues.length) {
              console.log('Total is 0 or unreliable, will continue fetching until we get fewer results than batch size');
              total = Infinity; // Set to Infinity so we don't stop early
            }
          }

          // If we got fewer results than requested, we've reached the end
          if (batch.issues.length < batchSize) {
            console.log(`Reached end: got ${batch.issues.length} results (less than batch size ${batchSize})`);
            hasMore = false;
            break;
          }

          currentStartAt += batchSize;

          // If total is valid and we've fetched all tickets, stop
          if (total !== Infinity && currentStartAt >= total) {
            console.log(`Reached reported total: currentStartAt=${currentStartAt}, total=${total}`);
            hasMore = false;
            break;
          }
        }

        // Safety check to prevent infinite loops (very high limit to support large ticket counts)
        if (allIssues.length >= 100000) {
          console.warn('Reached 100000 tickets limit, stopping pagination');
          hasMore = false;
          break;
        }
      }

      console.log(`Finished fetching all tickets: ${allIssues.length} total`);

      return {
        issues: allIssues,
        total: allIssues.length,
        startAt: 0,
        maxResults: allIssues.length
      };
    } else {
      // Fetch only the requested page
      const batch = await fetchJiraTicketsBatch(
        jiraHost,
        auth,
        jql,
        fields,
        startAt,
        maxResults
      );

      return batch;
    }
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Request URL:', error.config?.url);
      console.error('Request method:', error.config?.method);
      console.error('Request data:', error.config?.data);
      console.error('Request params:', error.config?.params);
    } else {
      console.error('No response object:', error.message);
    }
    throw error;
  }
}

export async function getTicketFilterOptions(
  jiraHost: string,
  jiraEmail: string,
  jiraToken: string
): Promise<{
  assignees: string[];
  statuses: string[];
  projects: Array<{ key: string; name: string }>;
  priorities: string[];
  issuetypes: string[];
}> {
  const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');

  try {
    // Fetch a sample of tickets to extract filter options
    // Use the new /rest/api/3/search/jql endpoint (required as of May 2025)
    const jql = 'updated >= "2000-01-01" ORDER BY updated DESC';
    const fields = ['assignee', 'status', 'project', 'priority', 'issuetype'];
    
    // Try POST method first (as per Jira API v3 documentation)
    let response;
    try {
      response = await axios({
        method: 'post',
        url: `https://${jiraHost}/rest/api/3/search/jql`,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        data: {
          jql: jql,
          fields: fields,
          maxResults: 1000
        }
      });
    } catch (postError: any) {
      // If POST fails, try GET method
      console.log('POST to /rest/api/3/search/jql failed, trying GET...');
      console.log('POST Error Status:', postError.response?.status);
      console.log('POST Error Data:', JSON.stringify(postError.response?.data, null, 2));
      try {
        response = await axios({
          method: 'get',
          url: `https://${jiraHost}/rest/api/3/search/jql`,
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          },
          params: {
            jql: jql,
            fields: fields.join(','),
            maxResults: 1000
          }
        });
      } catch (getError: any) {
        // If GET also fails, try API v2 as fallback
        console.log('GET to /rest/api/3/search/jql failed, trying API v2...');
        console.log('GET Error Status:', getError.response?.status);
        console.log('GET Error Data:', JSON.stringify(getError.response?.data, null, 2));
        response = await axios({
          method: 'get',
          url: `https://${jiraHost}/rest/api/2/search`,
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          },
          params: {
            jql: jql,
            fields: fields.join(','),
            maxResults: 1000
          }
        });
      }
    }

    const issues = response.data.issues || [];
    const assignees = new Set<string>();
    const statuses = new Set<string>();
    const projects = new Map<string, { key: string; name: string }>();
    const priorities = new Set<string>();
    const issuetypes = new Set<string>();

    issues.forEach((issue: DetailedTicket) => {
      if (issue.fields.assignee) {
        assignees.add(issue.fields.assignee.displayName);
      }
      if (issue.fields.status) {
        statuses.add(issue.fields.status.name);
      }
      if (issue.fields.project) {
        projects.set(issue.fields.project.key, {
          key: issue.fields.project.key,
          name: issue.fields.project.name
        });
      }
      if (issue.fields.priority) {
        priorities.add(issue.fields.priority.name);
      }
      if (issue.fields.issuetype) {
        issuetypes.add(issue.fields.issuetype.name);
      }
    });

    return {
      assignees: Array.from(assignees).sort(),
      statuses: Array.from(statuses).sort(),
      projects: Array.from(projects.values()).sort((a, b) => a.name.localeCompare(b.name)),
      priorities: Array.from(priorities).sort(),
      issuetypes: Array.from(issuetypes).sort()
    };
  } catch (error: any) {
    console.error('Error fetching filter options:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response headers:', error.response.headers);
      console.error('Request URL:', error.config?.url);
      console.error('Request method:', error.config?.method);
      console.error('Request data:', error.config?.data);
      console.error('Request params:', error.config?.params);
    } else {
      console.error('No response object:', error.message);
    }
    return {
      assignees: [],
      statuses: [],
      projects: [],
      priorities: [],
      issuetypes: []
    };
  }
}
