'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AttendanceRecord {
  date: string;
  user_id: string;
  user_name: string;
  check_in_time: string | null;
  check_out_time: string | null;
  checkout_next_day: boolean; // Indicates if checkout was on the next day (overnight shift)
  work_duration_hours: number;
  status: 'full_day' | 'half_day' | 'day_off' | 'incomplete' | 'missing_checkout' | 'missing_checkin';
  notes: string[];
}

interface UserAttendance {
  user_id: string;
  user_name: string;
  records: AttendanceRecord[];
  total_days: number;
  full_days: number;
  half_days: number;
  days_off: number;
  incomplete_days: number;
}

interface AttendanceData {
  total_users: number;
  total_days_tracked: number;
  total_full_days: number;
  total_half_days: number;
  total_days_off: number;
  total_incomplete_days: number;
  users: UserAttendance[];
}

export default function AttendancePage() {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push('/login');
    } else {
      setUser(session);
      fetchAttendance();
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchAttendance();
    }
  }, [startDate, endDate, user]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing attendance...');
      fetchAttendance();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [user, startDate, endDate]);

  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = '/api/attendance';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log('📡 Fetching attendance from:', url);

      // Add cache-busting to prevent stale data
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      const result = await response.json();

      console.log('📥 Received attendance response:', {
        success: result.success,
        total_users: result.total_users,
        total_days_tracked: result.total_days_tracked
      });

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to fetch attendance');
      }

      console.log('✅ Setting attendance data');
      setData(result);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full_day':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'half_day':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'day_off':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'missing_checkout':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'missing_checkin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'full_day':
        return 'Full Day';
      case 'half_day':
        return 'Half Day';
      case 'day_off':
        return 'Day Off';
      case 'missing_checkout':
        return 'Missing Check-Out';
      case 'missing_checkin':
        return 'Missing Check-In';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  // Set default dates
  useEffect(() => {
    if (!startDate) {
      setStartDate(firstDayOfMonth);
    }
    if (!endDate) {
      setEndDate(today);
    }
  }, []);

  const filteredUsers = selectedUser === 'all' 
    ? data?.users || []
    : data?.users.filter(u => u.user_id === selectedUser) || [];

  if (loading && !user) {
    return <LoadingSpinner progress={0} message="Loading..." detail="" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-moonsys-aqua/5 to-moonsys-lavender/5 dark:bg-gradient-to-br dark:from-gray-900 dark:via-moonsys-aqua-dark/10 dark:to-moonsys-lavender-dark/10">
      {/* Header */}
      <header className="bg-gradient-to-r from-moonsys-aqua via-moonsys-lavender to-moonsys-peach shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Attendance Board
              </h1>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                Track team attendance based on check-in/check-out (Karachi Time)
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-white/80 hover:bg-white text-gray-900 rounded-lg transition-colors font-medium shadow-md"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/checkin-checkout')}
                className="px-4 py-2 bg-white/80 hover:bg-white text-gray-900 rounded-lg transition-colors font-medium shadow-md"
              >
                Check-In/Out
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white/80 hover:bg-white text-gray-900 rounded-lg transition-colors font-medium shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={today}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={today}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by User
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
              >
                <option value="all">All Users</option>
                {data?.users.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.user_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={fetchAttendance}
                className="flex-1 px-4 py-2 bg-moonsys-aqua hover:bg-moonsys-aqua-dark text-white rounded-lg transition-colors font-medium"
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => {
                  setStartDate(firstDayOfMonth);
                  setEndDate(today);
                  setSelectedUser('all');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {data.total_users}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Full Days</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {data.total_full_days}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Half Days</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                    {data.total_half_days}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Days Off</p>
                  <p className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-2">
                    {data.total_days_off}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Incomplete</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                    {data.total_incomplete_days}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Table */}
        {loading ? (
          <LoadingSpinner progress={0} message="Loading attendance..." detail="" />
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Error</h2>
            <p className="text-red-600 dark:text-red-300">{error}</p>
            <button
              onClick={fetchAttendance}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-moonsys-aqua-dark to-moonsys-lavender-dark text-white rounded-lg hover:from-moonsys-aqua hover:to-moonsys-lavender"
            >
              Retry
            </button>
          </div>
        ) : !data || filteredUsers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Attendance Data
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              No attendance records found for the selected date range.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredUsers.map((userAttendance) => (
              <div key={userAttendance.user_id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-moonsys-aqua to-moonsys-lavender px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-white">{userAttendance.user_name}</h3>
                      <p className="text-sm text-white/80 mt-1">
                        {userAttendance.total_days} days tracked
                      </p>
                    </div>
                    <div className="flex gap-4 text-white">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{userAttendance.full_days}</div>
                        <div className="text-xs">Full Days</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{userAttendance.half_days}</div>
                        <div className="text-xs">Half Days</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{userAttendance.days_off}</div>
                        <div className="text-xs">Days Off</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{userAttendance.incomplete_days}</div>
                        <div className="text-xs">Incomplete</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Check-In
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Check-Out
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {userAttendance.records.map((record) => (
                        <tr key={record.date} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {record.check_in_time || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {record.check_out_time ? (
                              <span>
                                {record.check_out_time}
                                {record.checkout_next_day && (
                                  <span className="ml-1 text-xs text-purple-600 dark:text-purple-400 font-medium">
                                    (+1 day)
                                  </span>
                                )}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {record.work_duration_hours > 0 ? `${record.work_duration_hours}h` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                              {getStatusLabel(record.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {record.notes.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {record.notes.map((note, idx) => (
                                  <span key={idx} className="text-xs">{note}</span>
                                ))}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

