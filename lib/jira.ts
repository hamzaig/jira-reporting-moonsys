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
  };
}

export interface UserStats {
  totalTime: number;
  tickets: {
    [key: string]: {
      summary: string;
      time: number;
    };
  };
  dailyTime: {
    [date: string]: number;
  };
}

export interface AggregatedStats {
  [user: string]: UserStats;
}

export function getDateRange(period: 'daily' | 'yesterday' | 'weekly' | 'monthly') {
  const now = new Date();
  const startDate = new Date();
  let endDate = new Date();

  switch(period) {
    case 'daily':
      // Today only - same start and end date
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'yesterday':
      // Yesterday only
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
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

  try {
    const response = await axios({
      method: 'post',
      url: `https://${jiraHost}/rest/api/3/search/jql`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      data: {
        jql: jql,
        fields: ['summary', 'worklog', 'assignee'],
        maxResults: 100
      }
    });

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
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return worklogs.filter(worklog => {
    const worklogDate = new Date(worklog.started);
    return worklogDate >= start && worklogDate <= end;
  });
}

export function aggregateWorklogs(
  worklogs: Worklog[],
  issueKey: string,
  issueSummary: string
): AggregatedStats {
  const userStats: AggregatedStats = {};

  worklogs.forEach(worklog => {
    const author = worklog.author.displayName;
    const timeSpent = worklog.timeSpentSeconds;
    const date = worklog.started.split('T')[0];

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
        time: 0
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
