import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image as ImageIcon, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ModernFileUploadProps {
  value?: File[];
  onChange?: (files: File[]) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
  maxSize?: number; // En MB
  maxFiles?: number;
  showPreview?: boolean;
  variant?: 'default' | 'gradient-crou';
  className?: string;
}

interface FileWithPreview extends File {
  preview?: string;
  progress?: number;
  error?: string;
}

export function ModernFileUpload({
  value = [],
  onChange,
  label,
  error,
  disabled = false,
  multiple = true,
  accept,
  maxSize = 10, // 10 MB par défaut
  maxFiles = 5,
  showPreview = true,
  variant = 'default',
  className,
}: ModernFileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>(value);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Vérifier la taille
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSize) {
      return `Fichier trop volumineux (max ${maxSize}MB)`;
    }

    // Vérifier le type si accept est défini
    if (accept) {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const fileType = file.type;
      const fileExt = `.${file.name.split('.').pop()}`;
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExt === type;
        }
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.replace('/*', ''));
        }
        return fileType === type;
      });

      if (!isAccepted) {
        return 'Type de fichier non autorisé';
      }
    }

    return null;
  };

  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve('');
      }
    });
  };

  const handleFiles = async (newFiles: FileList | File[]) => {
    if (disabled) return;

    const filesArray = Array.from(newFiles);
    const totalFiles = files.length + filesArray.length;

    if (!multiple && filesArray.length > 1) {
      return;
    }

    if (totalFiles > maxFiles) {
      return;
    }

    const processedFiles: FileWithPreview[] = await Promise.all(
      filesArray.map(async (file) => {
        const validationError = validateFile(file);
        const fileWithPreview = file as FileWithPreview;
        
        if (!validationError && showPreview) {
          fileWithPreview.preview = await createPreview(file);
        }
        
        fileWithPreview.error = validationError || undefined;
        fileWithPreview.progress = validationError ? 0 : 100;
        
        return fileWithPreview;
      })
    );

    const updatedFiles = multiple ? [...files, ...processedFiles] : processedFiles;
    setFiles(updatedFiles);
    onChange?.(updatedFiles.filter(f => !f.error));
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onChange?.(updatedFiles.filter(f => !f.error));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-6 h-6" strokeWidth={2} />;
    }
    if (file.type === 'application/pdf') {
      return <FileText className="w-6 h-6" strokeWidth={2} />;
    }
    return <File className="w-6 h-6" strokeWidth={2} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Zone de drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all',
          'flex flex-col items-center justify-center cursor-pointer',
          variant === 'default' && [
            'border-gray-300 bg-gray-50',
            isDragging && 'border-primary-500 bg-primary-50',
            !disabled && !isDragging && 'hover:border-gray-400 hover:bg-gray-100'
          ],
          variant === 'gradient-crou' && [
            'border-transparent bg-gradient-to-br from-primary-50 to-accent-50',
            isDragging && 'from-primary-100 to-accent-100'
          ],
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          disabled={disabled}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center mb-4',
          variant === 'default' ? 'bg-primary-100' : 'bg-white/80'
        )}>
          <Upload className={cn(
            'w-8 h-8',
            variant === 'default' ? 'text-primary-600' : 'text-primary-500'
          )} strokeWidth={2} />
        </div>

        <p className="text-sm font-medium text-gray-900 mb-1">
          {isDragging ? 'Déposez les fichiers ici' : 'Glissez-déposez vos fichiers'}
        </p>
        <p className="text-sm text-gray-600 mb-3">
          ou cliquez pour parcourir
        </p>

        <div className="flex flex-wrap gap-2 justify-center text-xs text-gray-500">
          {accept && (
            <span className="px-2 py-1 bg-white rounded-md border border-gray-200">
              {accept.split(',').join(', ')}
            </span>
          )}
          <span className="px-2 py-1 bg-white rounded-md border border-gray-200">
            Max {maxSize}MB
          </span>
          {multiple && (
            <span className="px-2 py-1 bg-white rounded-md border border-gray-200">
              Max {maxFiles} fichiers
            </span>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" strokeWidth={2} />
          {error}
        </p>
      )}

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-all',
                file.error 
                  ? 'border-red-200 bg-red-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              {/* Preview ou icône */}
              {showPreview && file.preview ? (
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className={cn(
                  'w-12 h-12 rounded flex items-center justify-center',
                  file.error ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                )}>
                  {getFileIcon(file)}
                </div>
              )}

              {/* Infos fichier */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{formatFileSize(file.size)}</span>
                  {file.error && (
                    <span className="text-red-600">• {file.error}</span>
                  )}
                </div>

                {/* Progress bar */}
                {!file.error && file.progress !== undefined && file.progress < 100 && (
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-gradient-crou h-1 rounded-full transition-all"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Status icône */}
              {!file.error && file.progress === 100 && (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" strokeWidth={2} />
              )}

              {/* Bouton supprimer */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className={cn(
                  'p-1 rounded-lg transition-colors flex-shrink-0',
                  'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                )}
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info nombre de fichiers */}
      {files.length > 0 && (
        <p className="text-xs text-gray-500">
          {files.length} fichier{files.length > 1 ? 's' : ''} sélectionné{files.length > 1 ? 's' : ''}
          {maxFiles && ` (max ${maxFiles})`}
        </p>
      )}
    </div>
  );
}

export default ModernFileUpload;
