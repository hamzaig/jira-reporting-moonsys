'use client';

import { useState } from 'react';

interface TechItem {
  tech_name: string;
  tech_icon_url?: string;
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'other';
}

interface TechStackSelectorProps {
  techStack: TechItem[];
  onChange: (techStack: TechItem[]) => void;
  disabled?: boolean;
}

const COMMON_TECHNOLOGIES: Record<string, TechItem[]> = {
  frontend: [
    { tech_name: 'React', category: 'frontend' },
    { tech_name: 'Next.js', category: 'frontend' },
    { tech_name: 'Vue.js', category: 'frontend' },
    { tech_name: 'Angular', category: 'frontend' },
    { tech_name: 'TypeScript', category: 'frontend' },
    { tech_name: 'Tailwind CSS', category: 'frontend' },
    { tech_name: 'React Native', category: 'frontend' },
    { tech_name: 'Flutter', category: 'frontend' },
  ],
  backend: [
    { tech_name: 'Node.js', category: 'backend' },
    { tech_name: 'Express.js', category: 'backend' },
    { tech_name: 'Python', category: 'backend' },
    { tech_name: 'Django', category: 'backend' },
    { tech_name: 'FastAPI', category: 'backend' },
    { tech_name: 'PHP', category: 'backend' },
    { tech_name: 'Laravel', category: 'backend' },
    { tech_name: 'Java', category: 'backend' },
    { tech_name: 'Spring Boot', category: 'backend' },
    { tech_name: '.NET', category: 'backend' },
    { tech_name: 'Go', category: 'backend' },
  ],
  database: [
    { tech_name: 'MySQL', category: 'database' },
    { tech_name: 'PostgreSQL', category: 'database' },
    { tech_name: 'MongoDB', category: 'database' },
    { tech_name: 'Redis', category: 'database' },
    { tech_name: 'Firebase', category: 'database' },
    { tech_name: 'SQLite', category: 'database' },
    { tech_name: 'Supabase', category: 'database' },
  ],
  devops: [
    { tech_name: 'Docker', category: 'devops' },
    { tech_name: 'Kubernetes', category: 'devops' },
    { tech_name: 'AWS', category: 'devops' },
    { tech_name: 'Google Cloud', category: 'devops' },
    { tech_name: 'Azure', category: 'devops' },
    { tech_name: 'Vercel', category: 'devops' },
    { tech_name: 'Nginx', category: 'devops' },
    { tech_name: 'GitHub Actions', category: 'devops' },
  ],
};

const CATEGORY_COLORS: Record<string, string> = {
  frontend: '#3b82f6',
  backend: '#10b981',
  database: '#f59e0b',
  devops: '#8b5cf6',
  other: '#6b7280',
};

export default function TechStackSelector({ techStack, onChange, disabled }: TechStackSelectorProps) {
  const [customTech, setCustomTech] = useState('');
  const [customCategory, setCustomCategory] = useState<TechItem['category']>('other');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('frontend');

  const isSelected = (techName: string) => {
    return techStack.some(t => t.tech_name.toLowerCase() === techName.toLowerCase());
  };

  const toggleTech = (tech: TechItem) => {
    if (disabled) return;
    
    if (isSelected(tech.tech_name)) {
      onChange(techStack.filter(t => t.tech_name.toLowerCase() !== tech.tech_name.toLowerCase()));
    } else {
      onChange([...techStack, tech]);
    }
  };

  const addCustomTech = () => {
    if (!customTech.trim() || disabled) return;
    
    const newTech: TechItem = {
      tech_name: customTech.trim(),
      category: customCategory,
    };
    
    if (!isSelected(newTech.tech_name)) {
      onChange([...techStack, newTech]);
    }
    
    setCustomTech('');
  };

  const removeTech = (techName: string) => {
    if (disabled) return;
    onChange(techStack.filter(t => t.tech_name !== techName));
  };

  return (
    <div className="space-y-4">
      {/* Selected Tech Stack */}
      {techStack.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Selected Technologies ({techStack.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <span
                key={tech.tech_name}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: CATEGORY_COLORS[tech.category] }}
              >
                {tech.tech_name}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeTech(tech.tech_name)}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Add Sections */}
      <div className="space-y-2">
        {Object.entries(COMMON_TECHNOLOGIES).map(([category, techs]) => (
          <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              className="w-full px-4 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[category] }}
                />
                <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {category}
                </span>
                <span className="text-xs text-gray-500">
                  ({techStack.filter(t => t.category === category).length} selected)
                </span>
              </span>
              <svg 
                className={`w-5 h-5 text-gray-500 transition-transform ${expandedCategory === category ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {expandedCategory === category && (
              <div className="p-3 flex flex-wrap gap-2 bg-white dark:bg-gray-800">
                {techs.map((tech) => (
                  <button
                    key={tech.tech_name}
                    type="button"
                    onClick={() => toggleTech(tech)}
                    disabled={disabled}
                    className={`
                      px-3 py-1 rounded-full text-sm font-medium transition-all
                      ${isSelected(tech.tech_name)
                        ? 'text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }
                      ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                    `}
                    style={isSelected(tech.tech_name) ? { backgroundColor: CATEGORY_COLORS[category] } : {}}
                  >
                    {isSelected(tech.tech_name) && <span className="mr-1">✓</span>}
                    {tech.tech_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Custom Tech */}
      {!disabled && (
        <div className="flex gap-2">
          <input
            type="text"
            value={customTech}
            onChange={(e) => setCustomTech(e.target.value)}
            placeholder="Add custom technology..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTech())}
          />
          <select
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value as TechItem['category'])}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
            <option value="database">Database</option>
            <option value="devops">DevOps</option>
            <option value="other">Other</option>
          </select>
          <button
            type="button"
            onClick={addCustomTech}
            disabled={!customTech.trim()}
            className="px-4 py-2 bg-moonsys-aqua text-white rounded-lg text-sm font-medium hover:bg-moonsys-aqua-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
