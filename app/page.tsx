'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Home() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 100);

    // Check authentication
    const timer = setTimeout(() => {
      if (isAuthenticated()) {
        router.push('/dashboard/main');
      } else {
        router.push('/login');
      }
    }, 600);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [router]);

  return <LoadingSpinner progress={progress} message="Loading..." detail="Checking authentication" />;
}
