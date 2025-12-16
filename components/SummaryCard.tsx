'use client';

import { formatSeconds } from '@/lib/jira';
import { AggregatedStats } from '@/lib/jira';

interface SummaryCardProps {
  userStats: AggregatedStats;
  period: string;
  startDate: string;
  endDate: string;
  totalIssues: number;
}

export default function SummaryCard({ userStats, period, startDate, endDate, totalIssues }: SummaryCardProps) {
  const totalUsers = Object.keys(userStats).length;
  const totalTime = Object.values(userStats).reduce((sum, stat) => sum + stat.totalTime, 0);
  const totalTickets = new Set();
  Object.values(userStats).forEach(stat => {
    Object.keys(stat.tickets).forEach(ticket => totalTickets.add(ticket));
  });

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-8 text-white">
      <h1 className="text-3xl font-bold mb-2">Jira Time Tracking Report</h1>
      <p className="text-lg mb-6 opacity-90">{period.toUpperCase()} - {startDate} to {endDate}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white bg-opacity-20 rounded-lg p-4">
          <div className="text-3xl font-bold">{totalUsers}</div>
          <div className="text-sm opacity-90">Users</div>
        </div>
        <div className="bg-white bg-opacity-20 rounded-lg p-4">
          <div className="text-3xl font-bold">{totalTickets.size}</div>
          <div className="text-sm opacity-90">Tickets</div>
        </div>
        <div className="bg-white bg-opacity-20 rounded-lg p-4">
          <div className="text-3xl font-bold">{totalIssues}</div>
          <div className="text-sm opacity-90">Issues Found</div>
        </div>
        <div className="bg-white bg-opacity-20 rounded-lg p-4">
          <div className="text-2xl font-bold">{formatSeconds(totalTime)}</div>
          <div className="text-sm opacity-90">Total Time</div>
        </div>
      </div>
    </div>
  );
}
