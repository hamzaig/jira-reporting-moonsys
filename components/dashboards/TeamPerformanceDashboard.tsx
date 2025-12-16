'use client';

import { AggregatedStats } from '@/lib/jira';
import { formatSeconds } from '@/lib/jira';

interface TeamPerformanceDashboardProps {
  userStats: AggregatedStats;
}

export default function TeamPerformanceDashboard({ userStats }: TeamPerformanceDashboardProps) {
  const users = Object.entries(userStats).map(([name, stats]) => ({
    name,
    totalTime: stats.totalTime,
    ticketCount: Object.keys(stats.tickets).length,
    avgTimePerTicket: stats.totalTime / Object.keys(stats.tickets).length,
  }));

  const sortedByTime = [...users].sort((a, b) => b.totalTime - a.totalTime);
  const sortedByTickets = [...users].sort((a, b) => b.ticketCount - a.ticketCount);

  const topPerformer = sortedByTime[0];
  const mostTickets = sortedByTickets[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Top Performer (Time)</h3>
          {topPerformer && (
            <>
              <div className="text-3xl font-bold mb-2">{topPerformer.name}</div>
              <div className="text-2xl opacity-90">{formatSeconds(topPerformer.totalTime)}</div>
              <p className="text-sm opacity-80 mt-2">{topPerformer.ticketCount} tickets completed</p>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Most Tickets Completed</h3>
          {mostTickets && (
            <>
              <div className="text-3xl font-bold mb-2">{mostTickets.name}</div>
              <div className="text-2xl opacity-90">{mostTickets.ticketCount} tickets</div>
              <p className="text-sm opacity-80 mt-2">{formatSeconds(mostTickets.totalTime)} logged</p>
            </>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Team Performance Ranking
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Rank</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Time Logged</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Tickets</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Avg/Ticket</th>
              </tr>
            </thead>
            <tbody>
              {sortedByTime.map((user, index) => (
                <tr
                  key={user.name}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{user.name}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{formatSeconds(user.totalTime)}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{user.ticketCount}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {formatSeconds(user.avgTimePerTicket)}
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
