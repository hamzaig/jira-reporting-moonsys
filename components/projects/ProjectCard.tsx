'use client';

import Link from 'next/link';

interface ProjectTag {
  id: number;
  name: string;
  color: string;
}

interface ProjectCategory {
  id: number;
  name: string;
  color: string;
}

interface Project {
  id: number;
  title: string;
  slug: string;
  description?: string;
  client_name?: string;
  category?: ProjectCategory;
  status: 'completed' | 'ongoing' | 'archived';
  start_date?: string;
  end_date?: string;
  featured: boolean;
  tags?: ProjectTag[];
  live_url?: string;
  github_url?: string;
}

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: number) => void;
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700">
      {/* Header with category color */}
      <div 
        className="h-2"
        style={{ backgroundColor: project.category?.color || '#6366f1' }}
      />
      
      <div className="p-6">
        {/* Title & Status */}
        <div className="flex justify-between items-start mb-3">
          <Link href={`/projects/${project.id}`}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white hover:text-moonsys-aqua transition-colors line-clamp-2">
              {project.title}
            </h3>
          </Link>
          {project.featured && (
            <span className="text-yellow-500 text-lg" title="Featured">
              ★
            </span>
          )}
        </div>

        {/* Client & Category */}
        <div className="flex flex-wrap gap-2 mb-3">
          {project.client_name && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {project.client_name}
            </span>
          )}
          {project.category && (
            <span 
              className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: project.category.color }}
            >
              {project.category.name}
            </span>
          )}
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
            {project.description.replace(/<[^>]*>/g, '')}
          </p>
        )}

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {project.tags.slice(0, 4).map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ 
                  backgroundColor: tag.color + '20',
                  color: tag.color,
                }}
              >
                {tag.name}
              </span>
            ))}
            {project.tags.length > 4 && (
              <span className="text-xs text-gray-500">+{project.tags.length - 4}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
            {project.start_date && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(project.start_date)}
                {project.end_date && ` - ${formatDate(project.end_date)}`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {project.live_url && (
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-moonsys-aqua transition-colors"
                title="Live Site"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-moonsys-aqua transition-colors"
                title="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            )}
            <Link
              href={`/projects/${project.id}/edit`}
              className="text-gray-400 hover:text-moonsys-aqua transition-colors"
              title="Edit"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
            {onDelete && (
              <button
                onClick={() => onDelete(project.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Delete"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
