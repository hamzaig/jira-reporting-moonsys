'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ModuleStats {
  projects?: { total: number; completed: number; ongoing: number };
  attendance?: { total_users: number; total_days: number; incomplete: number };
  analytics?: { total_issues: number; total_time: number };
}

interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  route: string;
  stats?: any;
  enabled: boolean;
  comingSoon?: boolean;
}

export default function MainDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<ModuleStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch projects stats
      const projectsRes = await fetch('/api/projects?stats=true');
      const projectsData = await projectsRes.json();
      
      // Fetch attendance stats
      const attendanceRes = await fetch('/api/attendance');
      const attendanceData = await attendanceRes.json();

      setStats({
        projects: projectsData.success ? {
          total: projectsData.total_projects || 0,
          completed: projectsData.completed || 0,
          ongoing: projectsData.ongoing || 0,
        } : undefined,
        attendance: attendanceData.success ? {
          total_users: attendanceData.total_users || 0,
          total_days: attendanceData.total_days_tracked || 0,
          incomplete: attendanceData.total_incomplete_days || 0,
        } : undefined,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const modules: Module[] = [
    {
      id: 'projects',
      name: 'Projects Portfolio',
      description: 'Manage completed projects, track tech stack, team members, and showcase your work',
      icon: '📁',
      color: 'from-blue-500 to-cyan-500',
      gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      route: '/projects',
      stats: stats.projects ? `${stats.projects.total} Projects` : undefined,
      enabled: true,
    },
    {
      id: 'analytics',
      name: 'Jira Analytics',
      description: 'Track work logs, time spent on tickets, team performance, and detailed analytics',
      icon: '📊',
      color: 'from-purple-500 to-pink-500',
      gradient: 'bg-gradient-to-br from-purple-500 to-pink-500',
      route: '/dashboard/analytics',
      enabled: true,
    },
    {
      id: 'attendance',
      name: 'Attendance Tracking',
      description: 'Monitor team check-ins, check-outs, and attendance records',
      icon: '⏰',
      color: 'from-green-500 to-emerald-500',
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-500',
      route: '/attendance',
      stats: stats.attendance ? `${stats.attendance.total_users} Users` : undefined,
      enabled: true,
    },
    {
      id: 'tickets',
      name: 'All Tickets',
      description: 'View and manage all Jira tickets in one place',
      icon: '🎫',
      color: 'from-orange-500 to-red-500',
      gradient: 'bg-gradient-to-br from-orange-500 to-red-500',
      route: '/tickets',
      enabled: true,
    },
    {
      id: 'hr',
      name: 'HR & Hiring',
      description: 'Manage job postings, candidates, interviews, and hiring pipeline',
      icon: '👥',
      color: 'from-indigo-500 to-blue-500',
      gradient: 'bg-gradient-to-br from-indigo-500 to-blue-500',
      route: '/hr',
      enabled: false,
      comingSoon: true,
    },
    {
      id: 'finance',
      name: 'Finance & Salaries',
      description: 'Track salaries, billing, costing, expenses, and financial reports',
      icon: '💰',
      color: 'from-yellow-500 to-amber-500',
      gradient: 'bg-gradient-to-br from-yellow-500 to-amber-500',
      route: '/finance',
      enabled: false,
      comingSoon: true,
    },
    {
      id: 'knowledge',
      name: 'Knowledge Base',
      description: 'Store notes, bookmarks, credentials, and important information',
      icon: '📚',
      color: 'from-teal-500 to-cyan-500',
      gradient: 'bg-gradient-to-br from-teal-500 to-cyan-500',
      route: '/knowledge',
      enabled: false,
      comingSoon: true,
    },
    {
      id: 'api',
      name: 'API Management',
      description: 'Monitor API usage, billing, costs, and manage integrations',
      icon: '🔌',
      color: 'from-violet-500 to-purple-500',
      gradient: 'bg-gradient-to-br from-violet-500 to-purple-500',
      route: '/api',
      enabled: false,
      comingSoon: true,
    },
  ];

  const handleModuleClick = (module: Module) => {
    if (module.enabled) {
      router.push(module.route);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-moonsys-aqua via-moonsys-lavender to-moonsys-peach rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome to MoonSys Business Platform</h2>
            <p className="text-white/90 text-lg">
              Your all-in-one solution for managing projects, analytics, HR, finance, and operations
            </p>
          </div>
          <div className="hidden md:block text-6xl opacity-20">🚀</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {loading ? '...' : stats.projects?.total || 0}
              </p>
            </div>
            <div className="text-4xl opacity-20">📁</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {loading ? '...' : stats.attendance?.total_users || 0}
              </p>
            </div>
            <div className="text-4xl opacity-20">👥</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Days Tracked</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {loading ? '...' : stats.attendance?.total_days || 0}
              </p>
            </div>
            <div className="text-4xl opacity-20">📅</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Modules Active</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {modules.filter(m => m.enabled).length}
              </p>
            </div>
            <div className="text-4xl opacity-20">⚡</div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Modules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module) => (
            <div
              key={module.id}
              onClick={() => handleModuleClick(module)}
              className={`
                relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer
                ${module.enabled ? 'hover:scale-105' : 'opacity-75 cursor-not-allowed'}
                ${module.comingSoon ? 'ring-2 ring-dashed ring-gray-300 dark:ring-gray-600' : ''}
              `}
            >
              {/* Gradient Header */}
              <div className={`h-2 ${module.gradient}`} />
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-5xl">{module.icon}</div>
                  {module.comingSoon && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
                      Soon
                    </span>
                  )}
                  {module.enabled && (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>

                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {module.name}
                </h4>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {module.description}
                </p>

                {module.stats && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>{module.stats}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/projects/new"
            className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <span className="text-2xl">➕</span>
            <span className="font-medium text-gray-900 dark:text-white">New Project</span>
          </Link>
          <Link
            href="/checkin-checkout"
            className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <span className="text-2xl">⏰</span>
            <span className="font-medium text-gray-900 dark:text-white">Check In/Out</span>
          </Link>
          <Link
            href="/tickets"
            className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <span className="text-2xl">🎫</span>
            <span className="font-medium text-gray-900 dark:text-white">View Tickets</span>
          </Link>
          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          >
            <span className="text-2xl">📊</span>
            <span className="font-medium text-gray-900 dark:text-white">Analytics</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
