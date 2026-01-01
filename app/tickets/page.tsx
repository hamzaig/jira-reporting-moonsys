'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth';
import { DetailedTicket } from '@/lib/jira';
import LoadingSpinner from '@/components/LoadingSpinner';

interface FilterOptions {
  assignees: string[];
  statuses: string[];
  projects: Array<{ key: string; name: string }>;
  priorities: string[];
  issuetypes: string[];
}

interface TicketFilters {
  assignee: string;
  status: string;
  statusInclude: string[];
  statusExclude: string[];
  project: string;
  priority: string;
  issuetype: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<DetailedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    assignees: [],
    statuses: [],
    projects: [],
    priorities: [],
    issuetypes: []
  });
  const [filters, setFilters] = useState<TicketFilters>({
    assignee: '',
    status: '',
    statusInclude: [],
    statusExclude: [],
    project: '',
    priority: '',
    issuetype: ''
  });
  const [statusFilterMode, setStatusFilterMode] = useState<'include' | 'exclude'>('include');
  const [total, setTotal] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Loading tickets...');
  const [showFilters, setShowFilters] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push('/login');
    } else {
      setUser(session);
      fetchFilterOptions();
      fetchTickets();
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/tickets?getFilters=true');
      if (response.ok) {
        const options = await response.json();
        setFilterOptions(options);
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    setLoadingProgress(0);
    setLoadingMessage('Fetching all tickets...');

    try {
      const params = new URLSearchParams();
      if (filters.assignee) params.append('assignee', filters.assignee);
      if (filters.status) params.append('status', filters.status);
      if (filters.statusInclude.length > 0) {
        filters.statusInclude.forEach(status => params.append('statusInclude', status));
      }
      if (filters.statusExclude.length > 0) {
        filters.statusExclude.forEach(status => params.append('statusExclude', status));
      }
      if (filters.project) params.append('project', filters.project);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.issuetype) params.append('issuetype', filters.issuetype);
      params.append('fetchAll', 'true');
      
      console.log('Frontend: Sending request with fetchAll=true, URL:', `/api/tickets?${params.toString()}`);

      // Simulate progress updates during fetch
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev < 90) return prev + 5;
          return prev;
        });
      }, 200);

      const response = await fetch(`/api/tickets?${params.toString()}`);

      clearInterval(progressInterval);
      setLoadingProgress(95);
      setLoadingMessage('Processing tickets...');

      const result = await response.json();

      console.log('API Response:', { status: response.status, result });

      if (!response.ok || result.error) {
        const errorMessage = result.error || result.details || 'Failed to fetch tickets';
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      if (!result.issues) {
        console.warn('No issues in response:', result);
        setTickets([]);
        setTotal(0);
      } else {
        console.log(`✅ Fetched ${result.issues.length} tickets (total from API: ${result.total})`);
        setTickets(result.issues);
        setTotal(result.total || result.issues.length);
      }

      setLoadingProgress(100);
      setTimeout(() => {
        setLoadingProgress(0);
      }, 500);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoadingProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof TicketFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      assignee: '',
      status: '',
      statusInclude: [],
      statusExclude: [],
      project: '',
      priority: '',
      issuetype: ''
    });
  };

  const handleStatusToggle = (status: string) => {
    if (statusFilterMode === 'include') {
      setFilters(prev => ({
        ...prev,
        statusInclude: prev.statusInclude.includes(status)
          ? prev.statusInclude.filter(s => s !== status)
          : [...prev.statusInclude, status],
        statusExclude: prev.statusExclude.filter(s => s !== status)
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        statusExclude: prev.statusExclude.includes(status)
          ? prev.statusExclude.filter(s => s !== status)
          : [...prev.statusExclude, status],
        statusInclude: prev.statusInclude.filter(s => s !== status)
      }));
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('done') || statusLower.includes('closed') || statusLower.includes('resolved')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    if (statusLower.includes('progress') || statusLower.includes('in progress')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
    if (statusLower.includes('todo') || statusLower.includes('to do') || statusLower.includes('open')) {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
    if (statusLower.includes('blocked') || statusLower.includes('block')) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  };

  const hasActiveFilters = Object.values(filters).some(v => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== '';
  });

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
                All Tickets
              </h1>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                View and filter all Jira tickets
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
        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Filters
            </h2>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 text-sm bg-moonsys-aqua hover:bg-moonsys-aqua-dark text-white rounded-lg transition-colors"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Assignee Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assignee
                </label>
                <select
                  value={filters.assignee}
                  onChange={(e) => handleFilterChange('assignee', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
                >
                  <option value="">All Assignees</option>
                  <option value="__UNASSIGNED__">Unassigned</option>
                  {filterOptions.assignees.map((assignee) => (
                    <option key={assignee} value={assignee}>
                      {assignee}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status (Multiple Select)
                </label>
                <div className="space-y-2">
                  {/* Mode Toggle */}
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setStatusFilterMode('include')}
                      className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        statusFilterMode === 'include'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Include
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilterMode('exclude')}
                      className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        statusFilterMode === 'exclude'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Exclude
                    </button>
                  </div>
                  
                  {/* Status Checkboxes */}
                  <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700">
                    {filterOptions.statuses.map((status) => {
                      const isIncluded = filters.statusInclude.includes(status);
                      const isExcluded = filters.statusExclude.includes(status);
                      const isSelected = isIncluded || isExcluded;
                      
                      return (
                        <label
                          key={status}
                          className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleStatusToggle(status)}
                            className="w-4 h-4 text-moonsys-aqua focus:ring-moonsys-aqua border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {status}
                            {isIncluded && (
                              <span className="ml-2 text-xs text-green-600 dark:text-green-400">(Include)</span>
                            )}
                            {isExcluded && (
                              <span className="ml-2 text-xs text-red-600 dark:text-red-400">(Exclude)</span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  
                  {/* Selected Statuses Summary */}
                  {(filters.statusInclude.length > 0 || filters.statusExclude.length > 0) && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {filters.statusInclude.length > 0 && (
                        <div>Including: {filters.statusInclude.join(', ')}</div>
                      )}
                      {filters.statusExclude.length > 0 && (
                        <div>Excluding: {filters.statusExclude.join(', ')}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Project Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project
                </label>
                <select
                  value={filters.project}
                  onChange={(e) => handleFilterChange('project', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
                >
                  <option value="">All Projects</option>
                  {filterOptions.projects.map((project) => (
                    <option key={project.key} value={project.key}>
                      {project.name} ({project.key})
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
                >
                  <option value="">All Priorities</option>
                  {filterOptions.priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              {/* Issue Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Issue Type
                </label>
                <select
                  value={filters.issuetype}
                  onChange={(e) => handleFilterChange('issuetype', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {filterOptions.issuetypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-700 dark:text-gray-300">
              Showing all <span className="font-bold">{total || tickets.length}</span> tickets
            </p>
            {hasActiveFilters && (
              <div className="flex gap-2 flex-wrap">
                {filters.assignee && (
                  <span className="px-3 py-1 bg-moonsys-aqua/20 text-moonsys-aqua-dark dark:text-moonsys-aqua rounded-full text-sm">
                    Assignee: {filters.assignee === '__UNASSIGNED__' ? 'Unassigned' : filters.assignee}
                  </span>
                )}
                {filters.status && (
                  <span className="px-3 py-1 bg-moonsys-lavender/20 text-moonsys-lavender-dark dark:text-moonsys-lavender rounded-full text-sm">
                    Status: {filters.status}
                  </span>
                )}
                {filters.statusInclude.length > 0 && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm">
                    Status Include: {filters.statusInclude.join(', ')}
                  </span>
                )}
                {filters.statusExclude.length > 0 && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-sm">
                    Status Exclude: {filters.statusExclude.join(', ')}
                  </span>
                )}
                {filters.project && (
                  <span className="px-3 py-1 bg-moonsys-peach/20 text-moonsys-peach-dark dark:text-moonsys-peach rounded-full text-sm">
                    Project: {filters.project}
                  </span>
                )}
                {filters.priority && (
                  <span className="px-3 py-1 bg-moonsys-yellow/20 text-moonsys-yellow-dark dark:text-moonsys-yellow rounded-full text-sm">
                    Priority: {filters.priority}
                  </span>
                )}
                {filters.issuetype && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm">
                    Type: {filters.issuetype}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tickets Table */}
        {loading ? (
          <LoadingSpinner progress={loadingProgress} message={loadingMessage} detail={loadingProgress > 0 ? `Please wait while we fetch all tickets...` : ''} />
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Error</h2>
            <p className="text-red-600 dark:text-red-300">{error}</p>
            <button
              onClick={fetchTickets}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-moonsys-aqua-dark to-moonsys-lavender-dark text-white rounded-lg hover:from-moonsys-aqua hover:to-moonsys-lavender"
            >
              Retry
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Tickets Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {hasActiveFilters 
                ? 'No tickets match the current filters. Try adjusting your filters.'
                : 'No tickets found in the system.'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Summary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Assignee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-moonsys-aqua-dark dark:text-moonsys-aqua">
                          {ticket.key}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-md truncate">
                          {ticket.fields.summary}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.fields.status.name)}`}>
                          {ticket.fields.status.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ticket.fields.assignee ? (
                          <div className="flex items-center">
                            {ticket.fields.assignee.avatarUrls && (
                              <img
                                className="h-6 w-6 rounded-full mr-2"
                                src={ticket.fields.assignee.avatarUrls['48x48']}
                                alt={ticket.fields.assignee.displayName}
                              />
                            )}
                            <span className="text-sm text-gray-900 dark:text-white">
                              {ticket.fields.assignee.displayName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {ticket.fields.project.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {ticket.fields.priority.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {ticket.fields.issuetype.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(ticket.fields.updated)}
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

