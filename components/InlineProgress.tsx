'use client';

interface InlineProgressProps {
  progress: number;
  message?: string;
}

export default function InlineProgress({ progress, message = 'Loading...' }: InlineProgressProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Progress bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className="h-1 bg-gradient-to-r from-moonsys-aqua-dark to-moonsys-lavender-dark transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Message banner */}
      {progress > 0 && progress < 100 && (
        <div className="bg-moonsys-aqua/20 dark:bg-moonsys-aqua/10 border-b border-moonsys-aqua-dark dark:border-moonsys-lavender-dark px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Spinner */}
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-moonsys-aqua-dark border-t-transparent"></div>

              {/* Message */}
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {message}
              </span>
            </div>

            {/* Percentage */}
            <span className="text-sm font-bold text-moonsys-aqua-dark dark:text-moonsys-lavender">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
