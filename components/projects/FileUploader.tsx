'use client';

import { useState, useCallback } from 'react';

interface UploadedFile {
  id?: number;
  file_name: string;
  file_url: string;
  file_key: string;
  file_type?: string;
  file_size?: number;
  file_category: 'screenshot' | 'document' | 'video' | 'other';
}

interface FileUploaderProps {
  projectId?: number;
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
}

export default function FileUploader({ projectId, files, onFilesChange, disabled }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFileCategory = (fileType: string): 'screenshot' | 'document' | 'video' | 'other' => {
    if (fileType.startsWith('image/')) return 'screenshot';
    if (fileType.startsWith('video/')) return 'video';
    if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('word') || fileType.includes('excel') || fileType.includes('spreadsheet')) return 'document';
    return 'other';
  };

  const uploadFile = async (file: File) => {
    if (!projectId) {
      // If no projectId yet, create a temporary file entry
      const tempFile: UploadedFile = {
        file_name: file.name,
        file_url: URL.createObjectURL(file),
        file_key: `temp-${Date.now()}-${file.name}`,
        file_type: file.type,
        file_size: file.size,
        file_category: getFileCategory(file.type),
      };
      return tempFile;
    }

    // Get presigned URL
    const response = await fetch('/api/projects/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_upload_url',
        project_id: projectId,
        file_name: file.name,
        file_type: file.type,
        file_category: getFileCategory(file.type),
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to get upload URL');
    }

    const { upload_url, file_url, file_key } = await response.json();

    // Upload to S3
    const uploadResponse = await fetch(upload_url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to S3');
    }

    // Save file metadata
    const saveResponse = await fetch('/api/projects/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_file',
        project_id: projectId,
        file_name: file.name,
        file_url,
        file_key,
        file_type: file.type,
        file_size: file.size,
        file_category: getFileCategory(file.type),
      }),
    });

    if (!saveResponse.ok) {
      throw new Error('Failed to save file metadata');
    }

    const { file: savedFile } = await saveResponse.json();
    return savedFile;
  };

  const handleFiles = useCallback(async (fileList: FileList) => {
    setError(null);
    setUploading(true);

    try {
      const newFiles: UploadedFile[] = [];
      
      for (const file of Array.from(fileList)) {
        // Max 50MB
        if (file.size > 50 * 1024 * 1024) {
          setError(`File "${file.name}" exceeds 50MB limit`);
          continue;
        }

        const uploadedFile = await uploadFile(file);
        newFiles.push(uploadedFile);
      }

      onFilesChange([...files, ...newFiles]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }, [files, onFilesChange, projectId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = async (index: number) => {
    const file = files[index];
    
    if (file.id && projectId) {
      try {
        await fetch(`/api/projects/files?id=${file.id}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }
    
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'screenshot':
        return '🖼️';
      case 'video':
        return '🎬';
      case 'document':
        return '📄';
      default:
        return '📁';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${dragActive 
            ? 'border-moonsys-aqua bg-moonsys-aqua/10' 
            : 'border-gray-300 dark:border-gray-600 hover:border-moonsys-aqua'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          multiple
          onChange={handleInputChange}
          className="hidden"
          id="file-upload"
          disabled={disabled || uploading}
        />
        <label 
          htmlFor="file-upload" 
          className={`cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`}
        >
          <div className="text-4xl mb-2">📤</div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            {uploading ? 'Uploading...' : 'Drag & drop files here or click to browse'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Supports images, documents, videos (max 50MB each)
          </p>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Uploaded Files ({files.length})
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {files.map((file, index) => (
              <div
                key={file.file_key}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <span className="text-2xl">{getCategoryIcon(file.file_category)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.file_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.file_size)} • {file.file_category}
                  </p>
                </div>
                <div className="flex gap-2">
                  {file.file_url && !file.file_url.startsWith('blob:') && (
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-moonsys-aqua hover:text-moonsys-aqua-dark"
                      title="View"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </a>
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-600"
                    title="Remove"
                    disabled={disabled}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
