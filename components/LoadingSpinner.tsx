'use client';

interface LoadingSpinnerProps {
  progress?: number;
  message?: string;
  detail?: string;
}

export default function LoadingSpinner({ progress = 0, message = 'Loading work logs...', detail }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md w-full px-6">
        {/* Circular Progress */}
        <div className="relative inline-flex items-center justify-center mb-6">
          {/* Background circle */}
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
              className="transition-all duration-300 ease-out"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#7DBCC9', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#9B98C5', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
          </svg>

          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                {Math.round(progress)}%
              </div>
            </div>
          </div>
        </div>

        {/* Loading message */}
        <div className="space-y-2">
          <p className="text-xl font-semibold text-gray-900 dark:text-white">
            {message}
          </p>

          {detail && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {detail}
            </p>
          )}

          {/* Progress bar */}
          <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-moonsys-aqua-dark to-moonsys-lavender-dark h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Animated dots */}
        <div className="flex justify-center items-center space-x-2 mt-6">
          <div className="w-2 h-2 bg-moonsys-aqua-dark rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-moonsys-lavender-dark rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-moonsys-peach-dark rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
