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
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualFormData, setManualFormData] = useState({
    user_name: '',
    message_type: 'checkin' as 'checkin' | 'checkout',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5), // HH:MM format
    message_text: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [availableUsers, setAvailableUsers] = useState<Array<{ user_id: string; user_name: string | null }>>([]);
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push('/login');
    } else {
      setUser(session);
      fetchMessages();
      fetchAvailableUsers();
    }
  }, [router]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/slack/manual-entry');
      const result = await response.json();
      if (result.success && result.users) {
        setAvailableUsers(result.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

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

  const handleManualEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Combine date and time into a timestamp
      // Treat the input as Asia/Karachi timezone
      const dateTimeString = `${manualFormData.date}T${manualFormData.time}:00+05:00`; // PKT is UTC+5
      const date = new Date(dateTimeString);
      const timestamp = (date.getTime() / 1000).toString(); // Convert to Unix timestamp in seconds

      const response = await fetch('/api/slack/manual-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: manualFormData.user_name,
          message_type: manualFormData.message_type,
          timestamp: timestamp,
          message_text: manualFormData.message_text || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to save manual entry');
      }

      // Reset form
      setManualFormData({
        user_name: '',
        message_type: 'checkin',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        message_text: '',
      });
      setShowManualForm(false);

      // Refresh messages
      await fetchMessages();
      
      // Show success message (you can add a toast notification here)
      alert('✅ Manual entry saved successfully!');
    } catch (err) {
      console.error('Error saving manual entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to save manual entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (id: number, userName: string, messageType: string) => {
    if (!confirm(`Are you sure you want to delete this ${messageType} entry for ${userName}?`)) {
      return;
    }

    setDeleting(id);
    setError(null);

    try {
      const response = await fetch('/api/slack/manual-entry', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to delete entry');
      }

      // Refresh messages
      await fetchMessages();
      
      // Show success message
      alert('✅ Entry deleted successfully!');
    } catch (err) {
      console.error('Error deleting entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    } finally {
      setDeleting(null);
    }
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
        {/* Manual Entry Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="px-6 py-3 bg-gradient-to-r from-moonsys-aqua to-moonsys-lavender hover:from-moonsys-aqua-dark hover:to-moonsys-lavender-dark text-white rounded-lg transition-colors font-medium shadow-md flex items-center gap-2"
          >
            {showManualForm ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Manual Entry
              </>
            )}
          </button>
        </div>

        {/* Manual Entry Form */}
        {showManualForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Add Manual Check-In/Check-Out
            </h2>
            <form onSubmit={handleManualEntrySubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    User Name *
                  </label>
                  <select
                    required
                    value={manualFormData.user_name}
                    onChange={(e) => setManualFormData({ ...manualFormData, user_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
                  >
                    <option value="">Select a user...</option>
                    {availableUsers.length > 0 ? (
                      availableUsers
                        .filter(u => u.user_name) // Only show users with names
                        .sort((a, b) => (a.user_name || '').localeCompare(b.user_name || '')) // Sort alphabetically
                        .map((u) => (
                          <option key={u.user_id} value={u.user_name || ''}>
                            {u.user_name}
                          </option>
                        ))
                    ) : (
                      <option value="" disabled>Loading users...</option>
                    )}
                  </select>
                  {availableUsers.length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      No users found. Please add an entry first or check your connection.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type *
                  </label>
                  <select
                    required
                    value={manualFormData.message_type}
                    onChange={(e) => setManualFormData({ ...manualFormData, message_type: e.target.value as 'checkin' | 'checkout' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
                  >
                    <option value="checkin">Check-In</option>
                    <option value="checkout">Check-Out</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={manualFormData.date}
                    onChange={(e) => setManualFormData({ ...manualFormData, date: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time * <span className="text-xs text-gray-500">(Asia/Karachi)</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={manualFormData.time}
                    onChange={(e) => setManualFormData({ ...manualFormData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter time in Asia/Karachi timezone (PKT, UTC+5)
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={manualFormData.message_text}
                    onChange={(e) => setManualFormData({ ...manualFormData, message_text: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
                    placeholder="Optional message or notes"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3">
                  <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-moonsys-aqua to-moonsys-lavender hover:from-moonsys-aqua-dark hover:to-moonsys-lavender-dark text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Entry'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowManualForm(false);
                    setError(null);
                  }}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
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
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            #{message.channel_name || 'general'}
                          </span>
                          {message.channel_id === 'manual' && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                              Manual
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteEntry(
                            message.id!,
                            message.user_name || message.user_id,
                            message.message_type
                          )}
                          disabled={deleting === message.id}
                          className="px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-200 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          title="Delete entry"
                        >
                          {deleting === message.id ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </>
                          )}
                        </button>
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

