'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import ProjectForm from '@/components/projects/ProjectForm';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ProjectData {
  id: number;
  title: string;
  description?: string;
  client_name?: string;
  client_logo_url?: string;
  category_id?: number;
  status: 'completed' | 'ongoing' | 'archived';
  start_date?: string;
  end_date?: string;
  budget?: number;
  currency: string;
  live_url?: string;
  github_url?: string;
  documentation_url?: string;
  featured: boolean;
  tags?: { id: number }[];
  tech_stack?: { tech_name: string; tech_icon_url?: string; category: string }[];
  team_members?: { member_name: string; role?: string; avatar_url?: string }[];
  files?: { id: number; file_name: string; file_url: string; file_key: string; file_type?: string; file_size?: number; file_category: string }[];
}

export default function EditProjectPage() {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push('/login');
    } else {
      setUser(session);
    }
  }, [router]);

  useEffect(() => {
    if (user && params.id) {
      fetchProject();
    }
  }, [user, params.id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      const data = await response.json();

      if (data.success) {
        // Transform data for form
        const projectData: ProjectData = {
          ...data.project,
          tag_ids: data.project.tags?.map((t: any) => t.id) || [],
          tech_stack: data.project.tech_stack?.map((t: any) => ({
            tech_name: t.tech_name,
            tech_icon_url: t.tech_icon_url,
            category: t.category,
          })) || [],
          team_members: data.project.team_members?.map((m: any) => ({
            member_name: m.member_name,
            role: m.role,
            avatar_url: m.avatar_url,
          })) || [],
          files: data.project.files || [],
        };
        setProject(projectData);
      } else {
        setError(data.error || 'Project not found');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/projects/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update project');
    }

    router.push(`/projects/${params.id}`);
  };

  if (!user || loading) {
    return <LoadingSpinner progress={0} message="Loading project..." detail="" />;
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error || 'Project Not Found'}
          </h1>
          <Link href="/projects" className="text-moonsys-aqua hover:underline">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  // Format dates for input fields
  const formattedProject = {
    ...project,
    start_date: project.start_date ? project.start_date.split('T')[0] : '',
    end_date: project.end_date ? project.end_date.split('T')[0] : '',
    tag_ids: project.tags?.map(t => t.id) || [],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-moonsys-aqua/5 to-moonsys-lavender/5 dark:bg-gradient-to-br dark:from-gray-900 dark:via-moonsys-aqua-dark/10 dark:to-moonsys-lavender-dark/10">
      {/* Header */}
      <header className="bg-gradient-to-r from-moonsys-aqua via-moonsys-lavender to-moonsys-peach shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/projects/${params.id}`}
              className="text-white hover:text-white/80 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Project
              </h1>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {project.title}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProjectForm
          initialData={formattedProject as any}
          onSubmit={handleSubmit}
          isEdit
        />
      </div>
    </div>
  );
}
