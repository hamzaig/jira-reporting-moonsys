'use client';

import { useState, useEffect } from 'react';

interface Category {
  id: number;
  name: string;
  color: string;
}

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface FiltersState {
  category_id?: number;
  tag_ids?: number[];
  status?: string;
  search?: string;
  year?: number;
  sort_by?: string;
  sort_order?: string;
}

interface ProjectFiltersProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
}

export default function ProjectFilters({ filters, onFiltersChange }: ProjectFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    // Fetch categories and tags
    Promise.all([
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/tags').then(res => res.json()),
    ]).then(([catData, tagData]) => {
      if (catData.success) setCategories(catData.categories);
      if (tagData.success) setTags(tagData.tags);
    });
  }, []);

  const updateFilter = (key: keyof FiltersState, value: any) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  const toggleTagFilter = (tagId: number) => {
    const currentTags = filters.tag_ids || [];
    if (currentTags.includes(tagId)) {
      updateFilter('tag_ids', currentTags.filter(id => id !== tagId));
    } else {
      updateFilter('tag_ids', [...currentTags, tagId]);
    }
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = filters.category_id || (filters.tag_ids && filters.tag_ids.length > 0) || filters.status || filters.search || filters.year;

  // Generate year options (last 10 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <svg 
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
          placeholder="Search projects..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Status Filter */}
        <select
          value={filters.status || ''}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="ongoing">Ongoing</option>
          <option value="archived">Archived</option>
        </select>

        {/* Category Filter */}
        <select
          value={filters.category_id || ''}
          onChange={(e) => updateFilter('category_id', e.target.value ? parseInt(e.target.value) : undefined)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Year Filter */}
        <select
          value={filters.year || ''}
          onChange={(e) => updateFilter('year', e.target.value ? parseInt(e.target.value) : undefined)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Years</option>
          {years.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        {/* Sort By */}
        <select
          value={`${filters.sort_by || 'created_at'}-${filters.sort_order || 'desc'}`}
          onChange={(e) => {
            const [sort_by, sort_order] = e.target.value.split('-');
            onFiltersChange({ ...filters, sort_by, sort_order });
          }}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="created_at-desc">Newest First</option>
          <option value="created_at-asc">Oldest First</option>
          <option value="title-asc">Title A-Z</option>
          <option value="title-desc">Title Z-A</option>
          <option value="start_date-desc">Start Date (Latest)</option>
          <option value="budget-desc">Budget (High to Low)</option>
        </select>

        {/* Toggle Advanced */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-3 py-2 text-sm text-moonsys-aqua hover:text-moonsys-aqua-dark font-medium"
        >
          {showAdvanced ? 'Less Filters' : 'More Filters'}
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-red-500 hover:text-red-600 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Advanced Filters - Tags */}
      {showAdvanced && tags.length > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Tags</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTagFilter(tag.id)}
                className={`
                  px-3 py-1 rounded-full text-sm font-medium transition-all
                  ${filters.tag_ids?.includes(tag.id)
                    ? 'ring-2 ring-offset-2'
                    : 'opacity-60 hover:opacity-100'
                  }
                `}
                style={{
                  backgroundColor: tag.color + '20',
                  color: tag.color,
                }}
              >
                {filters.tag_ids?.includes(tag.id) && <span className="mr-1">✓</span>}
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2">
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              Search: {filters.search}
              <button onClick={() => updateFilter('search', '')} className="hover:text-red-500">×</button>
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              Status: {filters.status}
              <button onClick={() => updateFilter('status', '')} className="hover:text-red-500">×</button>
            </span>
          )}
          {filters.category_id && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              Category: {categories.find(c => c.id === filters.category_id)?.name}
              <button onClick={() => updateFilter('category_id', undefined)} className="hover:text-red-500">×</button>
            </span>
          )}
          {filters.year && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              Year: {filters.year}
              <button onClick={() => updateFilter('year', undefined)} className="hover:text-red-500">×</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
