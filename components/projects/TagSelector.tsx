'use client';

import { useState, useEffect } from 'react';

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface TagSelectorProps {
  selectedTagIds: number[];
  onChange: (tagIds: number[]) => void;
  disabled?: boolean;
}

export default function TagSelector({ selectedTagIds, onChange, disabled }: TagSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#10b981');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      const data = await response.json();
      if (data.success) {
        setTags(data.tags);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: number) => {
    if (disabled) return;
    
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const addNewTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName, color: newTagColor }),
      });

      const data = await response.json();
      if (data.success) {
        setTags([...tags, data.tag]);
        onChange([...selectedTagIds, data.tag.id]);
        setNewTagName('');
        setShowAddNew(false);
      }
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const predefinedColors = [
    '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', 
    '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'
  ];

  if (loading) {
    return <div className="text-gray-500">Loading tags...</div>;
  }

  return (
    <div className="space-y-3">
      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggleTag(tag.id)}
            disabled={disabled}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${selectedTagIds.includes(tag.id)
                ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
                : 'opacity-60 hover:opacity-100'
              }
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
            style={{
              backgroundColor: tag.color + '20',
              color: tag.color,
              borderColor: tag.color,
              ...(selectedTagIds.includes(tag.id) ? { ringColor: tag.color } : {}),
            }}
          >
            {selectedTagIds.includes(tag.id) && (
              <span className="mr-1">✓</span>
            )}
            {tag.name}
          </button>
        ))}
        
        {/* Add New Tag Button */}
        {!showAddNew && !disabled && (
          <button
            type="button"
            onClick={() => setShowAddNew(true)}
            className="px-3 py-1.5 rounded-full text-sm font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 hover:border-moonsys-aqua hover:text-moonsys-aqua transition-colors"
          >
            + Add Tag
          </button>
        )}
      </div>

      {/* Add New Tag Form */}
      {showAddNew && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Tag name"
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-moonsys-aqua focus:border-transparent"
            autoFocus
          />
          
          {/* Color Picker */}
          <div className="flex gap-1">
            {predefinedColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewTagColor(color)}
                className={`w-6 h-6 rounded-full transition-transform ${newTagColor === color ? 'ring-2 ring-offset-1 scale-110' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          
          <button
            type="button"
            onClick={addNewTag}
            disabled={!newTagName.trim()}
            className="px-3 py-1.5 bg-moonsys-aqua text-white rounded text-sm font-medium hover:bg-moonsys-aqua-dark disabled:opacity-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAddNew(false);
              setNewTagName('');
            }}
            className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
