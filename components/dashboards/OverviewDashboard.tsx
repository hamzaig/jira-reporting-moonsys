'use client';

import { AggregatedStats } from '@/lib/jira';
import { formatSeconds } from '@/lib/jira';
import { getCardStyle } from '@/lib/brandConstants';

interface OverviewDashboardProps {
  userStats: AggregatedStats;
  totalIssues: number;
}

export default function OverviewDashboard({ userStats, totalIssues }: OverviewDashboardProps) {
  const totalUsers = Object.keys(userStats).length;
  const totalTime = Object.values(userStats).reduce((sum, stat) => sum + stat.totalTime, 0);
  const totalTickets = new Set();
  Object.values(userStats).forEach(stat => {
    Object.keys(stat.tickets).forEach(ticket => totalTickets.add(ticket));
  });

  const avgTimePerUser = totalUsers > 0 ? totalTime / totalUsers : 0;
  const avgTimePerTicket = totalTickets.size > 0 ? totalTime / totalTickets.size : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className={getCardStyle('aqua')}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Total Users</h3>
          <svg className="w-8 h-8 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <div className="text-4xl font-bold drop-shadow-sm">{totalUsers}</div>
        <p className="text-sm opacity-90 mt-2">Active team members</p>
      </div>

      <div className={getCardStyle('lavender')}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Total Tickets</h3>
          <svg className="w-8 h-8 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div className="text-4xl font-bold drop-shadow-sm">{totalTickets.size}</div>
        <p className="text-sm opacity-90 mt-2">Worked on</p>
      </div>

      <div className="bg-gradient-to-br from-moonsys-peach-dark to-moonsys-peach rounded-xl shadow-lg p-6 text-white border border-moonsys-peach-dark/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Total Time</h3>
          <svg className="w-8 h-8 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-3xl font-bold drop-shadow-sm">{formatSeconds(totalTime)}</div>
        <p className="text-sm opacity-90 mt-2">Total logged</p>
      </div>

      <div className="bg-gradient-to-br from-moonsys-yellow-dark to-moonsys-yellow rounded-xl shadow-lg p-6 text-gray-900 border border-moonsys-yellow-dark/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Avg per User</h3>
          <svg className="w-8 h-8 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div className="text-3xl font-bold drop-shadow-sm">{formatSeconds(avgTimePerUser)}</div>
        <p className="text-sm opacity-90 mt-2">Average time per user</p>
      </div>

      <div className="bg-gradient-to-br from-moonsys-aqua-dark via-moonsys-lavender-dark to-moonsys-lavender rounded-xl shadow-lg p-6 text-white border border-moonsys-aqua-dark/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Issues Found</h3>
          <svg className="w-8 h-8 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="text-4xl font-bold drop-shadow-sm">{totalIssues}</div>
        <p className="text-sm opacity-90 mt-2">Total issues</p>
      </div>

      <div className="bg-gradient-to-br from-moonsys-lavender-dark via-moonsys-peach-dark to-moonsys-peach rounded-xl shadow-lg p-6 text-white border border-moonsys-lavender-dark/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Avg per Ticket</h3>
          <svg className="w-8 h-8 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <div className="text-3xl font-bold drop-shadow-sm">{formatSeconds(avgTimePerTicket)}</div>
        <p className="text-sm opacity-90 mt-2">Average time per ticket</p>
      </div>

      <div className="bg-gradient-to-br from-moonsys-peach-dark via-moonsys-yellow-dark to-moonsys-yellow rounded-xl shadow-lg p-6 text-gray-900 border border-moonsys-peach-dark/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Tickets/User</h3>
          <svg className="w-8 h-8 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="text-4xl font-bold drop-shadow-sm">
          {totalUsers > 0 ? (totalTickets.size / totalUsers).toFixed(1) : 0}
        </div>
        <p className="text-sm opacity-90 mt-2">Tickets per user</p>
      </div>

      <div className="bg-gradient-to-br from-moonsys-yellow-dark via-moonsys-aqua-dark to-moonsys-aqua rounded-xl shadow-lg p-6 text-gray-900 border border-moonsys-yellow-dark/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Productivity</h3>
          <svg className="w-8 h-8 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div className="text-4xl font-bold drop-shadow-sm">
          {totalTime > 0 ? ((totalTickets.size / (totalTime / 3600)) * 10).toFixed(1) : 0}
        </div>
        <p className="text-sm opacity-90 mt-2">Tickets per 10 hours</p>
      </div>
    </div>
  );
}
