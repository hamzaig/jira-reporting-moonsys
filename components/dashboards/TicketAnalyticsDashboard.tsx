'use client';

import { AggregatedStats } from '@/lib/jira';
import { formatSeconds } from '@/lib/jira';

interface TicketAnalyticsDashboardProps {
  userStats: AggregatedStats;
}

export default function TicketAnalyticsDashboard({ userStats }: TicketAnalyticsDashboardProps) {
  // Aggregate all tickets
  const allTickets: { [key: string]: { summary: string; totalTime: number; users: string[] } } = {};

  Object.entries(userStats).forEach(([userName, stats]) => {
    Object.entries(stats.tickets).forEach(([ticketKey, ticketData]) => {
      if (!allTickets[ticketKey]) {
        allTickets[ticketKey] = {
          summary: ticketData.summary,
          totalTime: 0,
          users: [],
        };
      }
      allTickets[ticketKey].totalTime += ticketData.time;
      allTickets[ticketKey].users.push(userName);
    });
  });

  const sortedTickets = Object.entries(allTickets).sort((a, b) => b[1].totalTime - a[1].totalTime);

  const totalTickets = sortedTickets.length;
  const avgTimePerTicket = totalTickets > 0
    ? sortedTickets.reduce((sum, [, data]) => sum + data.totalTime, 0) / totalTickets
    : 0;

  const longestTicket = sortedTickets[0];
  const mostCollaborative = sortedTickets.reduce((max, curr) =>
    curr[1].users.length > max[1].users.length ? curr : max,
    sortedTickets[0]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Longest Task</h3>
          {longestTicket && (
            <>
              <div className="text-2xl font-bold mb-2">{longestTicket[0]}</div>
              <div className="text-xl opacity-90">{formatSeconds(longestTicket[1].totalTime)}</div>
              <p className="text-sm opacity-80 mt-2 truncate">{longestTicket[1].summary}</p>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Most Collaborative</h3>
          {mostCollaborative && (
            <>
              <div className="text-2xl font-bold mb-2">{mostCollaborative[0]}</div>
              <div className="text-xl opacity-90">{mostCollaborative[1].users.length} team members</div>
              <p className="text-sm opacity-80 mt-2">{formatSeconds(mostCollaborative[1].totalTime)} total</p>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Average per Ticket</h3>
          <div className="text-3xl font-bold mb-2">{formatSeconds(avgTimePerTicket)}</div>
          <p className="text-sm opacity-80 mt-2">Across {totalTickets} tickets</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Ticket Time Analysis
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Ticket</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Summary</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Time Spent</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Contributors</th>
              </tr>
            </thead>
            <tbody>
              {sortedTickets.slice(0, 10).map(([key, data]) => (
                <tr
                  key={key}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      {key}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300 max-w-md truncate">
                    {data.summary}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                    {formatSeconds(data.totalTime)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex -space-x-2">
                      {data.users.slice(0, 3).map((user, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-gray-800"
                          title={user}
                        >
                          {user.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                      ))}
                      {data.users.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 text-xs font-bold border-2 border-white dark:border-gray-800">
                          +{data.users.length - 3}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
