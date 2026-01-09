'use client';

import { formatSeconds } from '@/lib/jira';
import { UserStats } from '@/lib/jira';

interface UserStatsCardProps {
  userName: string;
  stats: UserStats;
}

export default function UserStatsCard({ userName, stats }: UserStatsCardProps) {
  const sortedTickets = Object.entries(stats.tickets).sort((a, b) => b[1].time - a[1].time);
  const sortedDates = Object.keys(stats.dailyTime).sort();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{userName}</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
          Total Time: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatSeconds(stats.totalTime)}</span>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tickets worked on: {Object.keys(stats.tickets).length}
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tickets</h3>
        <div className="space-y-3">
          {sortedTickets.map(([key, ticket]) => (
            <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-blue-600 dark:text-blue-400">{key}</span>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {formatSeconds(ticket.time)}
                  </span>
                  {ticket.estimatedTime && ticket.estimatedTime > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Est: {formatSeconds(ticket.estimatedTime)}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.summary}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Daily Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {sortedDates.map(date => (
            <div key={date} className="flex justify-between bg-gray-50 dark:bg-gray-700 rounded-md p-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{date}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatSeconds(stats.dailyTime[date])}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
