'use client';

import { useState } from 'react';

const REPORT_TIME_ZONE = process.env.NEXT_PUBLIC_REPORT_TIME_ZONE || 'Asia/Karachi';

const formatDateInTimeZone = (date: Date, timeZone: string = REPORT_TIME_ZONE) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);

const getZonedDateBase = (offsetDays = 0, timeZone: string = REPORT_TIME_ZONE) => {
  const formatted = formatDateInTimeZone(new Date(), timeZone);
  const [year, month, day] = formatted.split('-').map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + offsetDays);
  return base;
};

interface DateRangeSelectorProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onPeriodChange?: (period: 'daily' | 'yesterday' | 'weekly' | 'monthly' | 'custom') => void;
}

export default function DateRangeSelector({ onDateRangeChange, onPeriodChange }: DateRangeSelectorProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'yesterday' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handlePeriodClick = (period: 'daily' | 'yesterday' | 'weekly' | 'monthly' | 'custom') => {
    setSelectedPeriod(period);

    if (period === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onPeriodChange?.(period);

      const start = getZonedDateBase();
      const end = getZonedDateBase();

      switch(period) {
        case 'daily': {
          const todayStr = formatDateInTimeZone(start);
          onDateRangeChange(todayStr, todayStr);
          return;
        }
        case 'yesterday': {
          const yesterday = getZonedDateBase(-1);
          const yesterdayStr = formatDateInTimeZone(yesterday);
          onDateRangeChange(yesterdayStr, yesterdayStr);
          return;
        }
        case 'weekly': {
          const day = start.getUTCDay();
          const diff = start.getUTCDate() - day + (day === 0 ? -6 : 1);
          start.setUTCDate(diff);
          break;
        }
        case 'monthly':
          start.setUTCDate(1);
          break;
      }

      onDateRangeChange(
        formatDateInTimeZone(start),
        formatDateInTimeZone(end)
      );
    }
  };

  const handleCustomApply = () => {
    if (startDate && endDate) {
      onDateRangeChange(startDate, endDate);
      onPeriodChange?.('custom');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Time Period:
        </span>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handlePeriodClick('daily')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'daily'
                ? 'bg-moonsys-aqua-dark text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-moonsys-aqua/30'
            }`}
          >
            Today
          </button>

          <button
            onClick={() => handlePeriodClick('yesterday')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'yesterday'
                ? 'bg-moonsys-lavender-dark text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-moonsys-lavender/30'
            }`}
          >
            Yesterday
          </button>

          <button
            onClick={() => handlePeriodClick('weekly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'weekly'
                ? 'bg-moonsys-peach-dark text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-moonsys-peach/30'
            }`}
          >
            Weekly
          </button>

          <button
            onClick={() => handlePeriodClick('monthly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'monthly'
                ? 'bg-moonsys-yellow-dark text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-moonsys-yellow/30'
            }`}
          >
            Monthly
          </button>

          <button
            onClick={() => handlePeriodClick('custom')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'custom'
                ? 'bg-gradient-to-r from-moonsys-aqua-dark to-moonsys-lavender-dark text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-moonsys-aqua/20 hover:to-moonsys-lavender/20'
            }`}
          >
            Custom Range
          </button>
        </div>
      </div>

      {showCustom && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-moonsys-aqua-dark focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-moonsys-aqua-dark focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <button
              onClick={handleCustomApply}
              disabled={!startDate || !endDate}
              className="px-6 py-2 bg-gradient-to-r from-moonsys-aqua-dark to-moonsys-peach-dark hover:from-moonsys-aqua hover:to-moonsys-peach text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
