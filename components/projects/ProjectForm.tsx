'use client';

import { useState, useEffect } from 'react';
import TagSelector from './TagSelector';
import TechStackSelector from './TechStackSelector';
import FileUploader from './FileUploader';

interface Category {
  id: number;
  name: string;
  color: string;
}

interface TechItem {
  tech_name: string;
  tech_icon_url?: string;
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'other';
}

interface TeamMember {
  member_name: string;
  role?: string;
  avatar_url?: string;
}

interface UploadedFile {
  id?: number;
  file_name: string;
  file_url: string;
  file_key: string;
  file_type?: string;
  file_size?: number;
  file_category: 'screenshot' | 'document' | 'video' | 'other';
}

interface ProjectFormData {
  title: string;
  description: string;
  client_name: string;
  client_logo_url: string;
  category_id?: number;
  status: 'completed' | 'ongoing' | 'archived';
  start_date: string;
  end_date: string;
  budget: string;
  currency: string;
  live_url: string;
  github_url: string;
  documentation_url: string;
  featured: boolean;
  tag_ids: number[];
  tech_stack: TechItem[];
  team_members: TeamMember[];
}

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData> & { id?: number; files?: UploadedFile[] };
  onSubmit: (data: ProjectFormData) => Promise<void>;
  isEdit?: boolean;
}

export default function ProjectForm({ initialData, onSubmit, isEdit }: ProjectFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');
  const [files, setFiles] = useState<UploadedFile[]>(initialData?.files || []);

  const [formData, setFormData] = useState<ProjectFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    client_name: initialData?.client_name || '',
    client_logo_url: initialData?.client_logo_url || '',
    category_id: initialData?.category_id,
    status: initialData?.status || 'completed',
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    budget: initialData?.budget?.toString() || '',
    currency: initialData?.currency || 'PKR',
    live_url: initialData?.live_url || '',
    github_url: initialData?.github_url || '',
    documentation_url: initialData?.documentation_url || '',
    featured: initialData?.featured || false,
    tag_ids: initialData?.tag_ids || [],
    tech_stack: initialData?.tech_stack || [],
    team_members: initialData?.team_members || [],
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, color: newCategoryColor }),
      });

      const data = await response.json();
      if (data.success) {
        setCategories([...categories, data.category]);
        setFormData(prev => ({ ...prev, category_id: data.category.id }));
        setNewCategoryName('');
        setShowAddCategory(false);
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const addTeamMember = () => {
    setFormData(prev => ({
      ...prev,
      team_members: [...prev.team_members, { member_name: '', role: '' }],
    }));
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    setFormData(prev => ({
      ...prev,
      team_members: prev.team_members.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      ),
    }));
  };

  const removeTeamMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      team_members: prev.team_members.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Filter out empty team members
      const cleanedData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        team_members: formData.team_members.filter(m => m.member_name.trim()),
      };
      
      await onSubmit(cleanedData as any);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const predefinedColors = [
    '#6366f1', '#3b82f6', '#10b981', '#f59e0b', 
    '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
              placeholder="e.g., E-Commerce Platform"
            />
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client Name
            </label>
            <input
              type="text"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
              placeholder="e.g., ABC Corporation"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <div className="flex gap-2">
              <select
                name="category_id"
                value={formData.category_id || ''}
                onChange={handleChange}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                title="Add Category"
              >
                +
              </button>
            </div>
            
            {showAddCategory && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex gap-2 items-center">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <div className="flex gap-1">
                  {predefinedColors.slice(0, 4).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategoryColor(color)}
                      className={`w-6 h-6 rounded-full ${newCategoryColor === color ? 'ring-2 ring-offset-1' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addCategory}
                  className="px-3 py-1.5 bg-moonsys-aqua text-white rounded text-sm"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
            >
              <option value="completed">Completed</option>
              <option value="ongoing">Ongoing</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Featured */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="featured"
              id="featured"
              checked={formData.featured}
              onChange={handleChange}
              className="w-4 h-4 text-moonsys-aqua rounded focus:ring-moonsys-aqua"
            />
            <label htmlFor="featured" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Featured Project (Show on homepage)
            </label>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
              placeholder="Describe the project, its goals, and key features..."
            />
          </div>
        </div>
      </div>

      {/* Timeline & Budget */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
          Timeline & Budget
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Budget
            </label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
              placeholder="e.g., 500000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Currency
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
            >
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="AED">AED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
          Links
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Live URL
            </label>
            <input
              type="url"
              name="live_url"
              value={formData.live_url}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              GitHub URL
            </label>
            <input
              type="url"
              name="github_url"
              value={formData.github_url}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
              placeholder="https://github.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Documentation URL
            </label>
            <input
              type="url"
              name="documentation_url"
              value={formData.documentation_url}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
              placeholder="https://docs.example.com"
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
          Tags
        </h3>
        <TagSelector
          selectedTagIds={formData.tag_ids}
          onChange={(tag_ids) => setFormData(prev => ({ ...prev, tag_ids }))}
        />
      </div>

      {/* Tech Stack */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
          Tech Stack
        </h3>
        <TechStackSelector
          techStack={formData.tech_stack}
          onChange={(tech_stack) => setFormData(prev => ({ ...prev, tech_stack }))}
        />
      </div>

      {/* Team Members */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Team Members
          </h3>
          <button
            type="button"
            onClick={addTeamMember}
            className="px-3 py-1 bg-moonsys-aqua text-white rounded text-sm font-medium hover:bg-moonsys-aqua-dark"
          >
            + Add Member
          </button>
        </div>

        {formData.team_members.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No team members added yet
          </p>
        ) : (
          <div className="space-y-3">
            {formData.team_members.map((member, index) => (
              <div key={index} className="flex gap-3 items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <input
                  type="text"
                  value={member.member_name}
                  onChange={(e) => updateTeamMember(index, 'member_name', e.target.value)}
                  placeholder="Name"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  value={member.role || ''}
                  onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                  placeholder="Role (e.g., Lead Developer)"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => removeTeamMember(index)}
                  className="text-red-500 hover:text-red-600 p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Files */}
      {isEdit && initialData?.id && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            Files & Screenshots
          </h3>
          <FileUploader
            projectId={initialData.id}
            files={files}
            onFilesChange={setFiles}
          />
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-moonsys-aqua to-moonsys-lavender text-white rounded-lg font-medium hover:from-moonsys-aqua-dark hover:to-moonsys-lavender-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}
