'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth';
import LoadingSpinner from '@/components/LoadingSpinner';
import MainDashboard from '@/components/dashboards/MainDashboard';

export default function MainDashboardPage() {
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push('/login');
    } else {
      setUser(session);
    }
  }, [router]);

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  if (!user) {
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
                MoonSys Business Platform
              </h1>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                Welcome, {user?.email}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/projects')}
                className="px-4 py-2 bg-white text-moonsys-aqua-dark hover:bg-gray-50 rounded-lg transition-colors font-medium shadow-md"
              >
                Projects
              </button>
              <button
                onClick={() => router.push('/dashboard/analytics')}
                className="px-4 py-2 bg-white/80 hover:bg-white text-gray-900 rounded-lg transition-colors font-medium shadow-md"
              >
                Analytics
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
        <MainDashboard />
      </div>
    </div>
  );
}
