'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth';
import LoadingSpinner from '@/components/LoadingSpinner';

interface SlackMessage {
  id: number;
  message_id: string;
  channel_id: string;
  channel_name?: string;
  user_id: string;
  user_name?: string;
  message_text: string;
  message_type: 'checkin' | 'checkout' | 'other';
  timestamp: string;
  created_at?: string;
}

export default function CheckInCheckOutPage() {
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'checkin' | 'checkout'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push('/login');
    } else {
      setUser(session);
      fetchMessages();
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [filterType, selectedDate, user]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing messages...');
      fetchMessages();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [user, filterType, selectedDate]);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/slack/messages`;
      const params = new URLSearchParams();
      
      if (filterType !== 'all') {
        params.append('type', filterType);
      }
      if (selectedDate) {
        params.append('startDate', selectedDate);
        params.append('endDate', selectedDate);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('📡 Fetching messages from:', url);
      
      // Add cache-busting to prevent stale data
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      const result = await response.json();

      console.log('📥 Received response:', {
        success: result.success,
        count: result.count,
        messagesCount: result.messages?.length || 0
      });

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to fetch messages');
      }

      // Sort by timestamp (newest first)
      const sortedMessages = (result.messages || []).sort((a: SlackMessage, b: SlackMessage) => 
        parseFloat(b.timestamp) - parseFloat(a.timestamp)
      );
      
      console.log('✅ Setting', sortedMessages.length, 'messages');
      setMessages(sortedMessages);
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

  const formatDate = (timestamp: string) => {
    const date = new Date(parseFloat(timestamp) * 1000);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'checkin':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'checkout':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'checkin':
        return 'Check-In';
      case 'checkout':
        return 'Check-Out';
      default:
        return 'Other';
    }
  };

  const today = new Date().toISOString().split('T')[0];

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
                Check-In / Check-Out
              </h1>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                View team check-in and check-out messages from Slack
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
                onClick={() => router.push('/tickets')}
                className="px-4 py-2 bg-white/80 hover:bg-white text-gray-900 rounded-lg transition-colors font-medium shadow-md"
              >
                All Tickets
              </button>
              <button
                onClick={() => router.push('/attendance')}
                className="px-4 py-2 bg-white/80 hover:bg-white text-gray-900 rounded-lg transition-colors font-medium shadow-md"
              >
                Attendance
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
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                    filterType === 'all'
                      ? 'bg-moonsys-aqua text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('checkin')}
                  className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                    filterType === 'checkin'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Check-In
                </button>
                <button
                  onClick={() => setFilterType('checkout')}
                  className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                    filterType === 'checkout'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Check-Out
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={today}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchMessages}
                className="px-4 py-2 bg-moonsys-aqua hover:bg-moonsys-aqua-dark text-white rounded-lg transition-colors font-medium"
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => {
                  setSelectedDate('');
                  setFilterType('all');
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Messages</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {messages.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Check-Ins</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {messages.filter(m => m.message_type === 'checkin').length}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Check-Outs</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                  {messages.filter(m => m.message_type === 'checkout').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Messages List */}
        {loading ? (
          <LoadingSpinner progress={0} message="Loading messages..." detail="" />
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Error</h2>
            <p className="text-red-600 dark:text-red-300">{error}</p>
            <button
              onClick={fetchMessages}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-moonsys-aqua-dark to-moonsys-lavender-dark text-white rounded-lg hover:from-moonsys-aqua hover:to-moonsys-lavender"
            >
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Messages Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedDate 
                ? `No messages found for ${selectedDate}. Try selecting a different date.`
                : 'No check-in/check-out messages found. Messages will appear here once users start checking in/out in Slack.'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Channel
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {messages.map((message) => (
                    <tr key={message.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(message.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold mr-2">
                            {message.user_name
                              ? message.user_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                              : 'U'}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {message.user_name || message.user_id}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getMessageTypeColor(message.message_type)}`}>
                          {getMessageTypeLabel(message.message_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {message.message_text}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          #{message.channel_name || 'general'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

