'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth';
import DateRangeSelector from '@/components/DateRangeSelector';
import OverviewDashboard from '@/components/dashboards/OverviewDashboard';
import TeamPerformanceDashboard from '@/components/dashboards/TeamPerformanceDashboard';
import TicketAnalyticsDashboard from '@/components/dashboards/TicketAnalyticsDashboard';
import UserStatsCard from '@/components/UserStatsCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import InlineProgress from '@/components/InlineProgress';
import { AggregatedStats } from '@/lib/jira';

interface WorklogData {
  period: string;
  startDate: string;
  endDate: string;
  userStats: AggregatedStats;
  totalIssues: number;
}

type DashboardView = 'overview' | 'team' | 'tickets' | 'detailed';

export default function DashboardPage() {
  const [data, setData] = useState<WorklogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [loadingDetail, setLoadingDetail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push('/login');
    } else {
      setUser(session);
      fetchData('daily');
    }
  }, [router]);

  const fetchData = async (period: string, customStart?: string, customEnd?: string) => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setLoadingMessage('Initializing...');
    setLoadingDetail('Preparing to fetch work logs');

    try {
      // Simulate progress stages
      const progressStages = [
        { progress: 10, message: 'Connecting to Jira...', detail: 'Establishing secure connection' },
        { progress: 25, message: 'Fetching issues...', detail: 'Retrieving tickets from Jira' },
        { progress: 50, message: 'Processing work logs...', detail: 'Analyzing time entries' },
        { progress: 75, message: 'Aggregating data...', detail: 'Calculating statistics' },
        { progress: 90, message: 'Finalizing...', detail: 'Preparing dashboard' },
      ];

      let currentStage = 0;
      const progressInterval = setInterval(() => {
        if (currentStage < progressStages.length) {
          const stage = progressStages[currentStage];
          setProgress(stage.progress);
          setLoadingMessage(stage.message);
          setLoadingDetail(stage.detail);
          currentStage++;
        }
      }, 600);

      let url = `/api/worklog?period=${period}`;
      if (customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      const response = await fetch(url);

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Failed to fetch work logs');
      }

      setProgress(95);
      setLoadingMessage('Processing results...');
      setLoadingDetail('Almost done');

      const result = await response.json();

      setProgress(100);
      setLoadingMessage('Complete!');
      setLoadingDetail('Loading dashboard');

      // Small delay to show 100%
      setTimeout(() => {
        setData(result);
        setLoading(false);
      }, 300);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
      setProgress(0);
    }
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    fetchData('custom', startDate, endDate);
  };

  const handlePeriodChange = (period: 'daily' | 'yesterday' | 'weekly' | 'monthly' | 'custom') => {
    if (period !== 'custom') {
      fetchData(period);
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  if (loading && !user) {
    return <LoadingSpinner progress={progress} message={loadingMessage} detail={loadingDetail} />;
  }

  const sortedUsers = data ? Object.entries(data.userStats).sort(
    ([, a], [, b]) => b.totalTime - a.totalTime
  ) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-moonsys-aqua/5 to-moonsys-lavender/5 dark:bg-gradient-to-br dark:from-gray-900 dark:via-moonsys-aqua-dark/10 dark:to-moonsys-lavender-dark/10">
      {/* Inline Progress Indicator */}
      {loading && data && (
        <InlineProgress progress={progress} message={loadingMessage} />
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-moonsys-aqua via-moonsys-lavender to-moonsys-peach shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                MoonSys Jira Reporting
              </h1>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                Welcome, {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white/80 hover:bg-white text-gray-900 rounded-lg transition-colors font-medium shadow-md"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Selector */}
        <DateRangeSelector
          onDateRangeChange={handleDateRangeChange}
          onPeriodChange={handlePeriodChange}
        />

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCurrentView('overview')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentView === 'overview'
                  ? 'bg-gradient-to-r from-moonsys-aqua-dark to-moonsys-lavender-dark text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-moonsys-aqua/20'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setCurrentView('team')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentView === 'team'
                  ? 'bg-gradient-to-r from-moonsys-lavender-dark to-moonsys-peach-dark text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-moonsys-lavender/20'
              }`}
            >
              Team Performance
            </button>
            <button
              onClick={() => setCurrentView('tickets')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentView === 'tickets'
                  ? 'bg-gradient-to-r from-moonsys-peach-dark to-moonsys-yellow-dark text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-moonsys-peach/20'
              }`}
            >
              Ticket Analytics
            </button>
            <button
              onClick={() => setCurrentView('detailed')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentView === 'detailed'
                  ? 'bg-gradient-to-r from-moonsys-yellow-dark to-moonsys-aqua-dark text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-moonsys-yellow/20'
              }`}
            >
              Detailed View
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSpinner progress={progress} message={loadingMessage} detail={loadingDetail} />
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Error</h2>
            <p className="text-red-600 dark:text-red-300">{error}</p>
            <button
              onClick={() => fetchData('weekly')}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-moonsys-aqua-dark to-moonsys-lavender-dark text-white rounded-lg hover:from-moonsys-aqua hover:to-moonsys-lavender"
            >
              Retry
            </button>
          </div>
        ) : !data || Object.keys(data.userStats).length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Work Logs Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              No issues found with work logs in this period.
            </p>
          </div>
        ) : (
          <>
            {currentView === 'overview' && (
              <OverviewDashboard
                userStats={data.userStats}
                totalIssues={data.totalIssues}
              />
            )}

            {currentView === 'team' && (
              <TeamPerformanceDashboard userStats={data.userStats} />
            )}

            {currentView === 'tickets' && (
              <TicketAnalyticsDashboard userStats={data.userStats} />
            )}

            {currentView === 'detailed' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-6">
                  <h2 className="text-2xl font-bold mb-2">Detailed User Breakdown</h2>
                  <p className="text-lg opacity-90">
                    {data.period.toUpperCase()} - {data.startDate} to {data.endDate}
                  </p>
                </div>

                {sortedUsers.map(([userName, stats]) => (
                  <UserStatsCard key={userName} userName={userName} stats={stats} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
