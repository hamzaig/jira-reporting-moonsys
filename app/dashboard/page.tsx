'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push('/login');
    } else {
      // Redirect to main dashboard
      router.push('/dashboard/main');
    }
  }, [router]);

  return <LoadingSpinner progress={0} message="Redirecting..." detail="Loading dashboard" />;
}
