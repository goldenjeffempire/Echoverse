import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Upload, Image as ImageIcon, File, Video, Music, FileText,
  Trash2, Download, Search, Grid3x3, List, Filter,
  FolderOpen, Check, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistance } from 'date-fns';

interface MediaFile {
  id: number;
  name: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  size: number;
  mimeType: string;
  uploadedAt: Date;
  tags?: string[];
  selected?: boolean;
}

interface MediaLibraryManagerProps {
  onSelectFile?: (file: MediaFile) => void;
  onSelectMultiple?: (files: MediaFile[]) => void;
  allowMultiple?: boolean;
  acceptedTypes?: string[];
  className?: string;
}

export function MediaLibraryManager({
  onSelectFile,
  onSelectMultiple,
  allowMultiple = false,
  acceptedTypes,
  className
}: MediaLibraryManagerProps) {
  const [files, setFiles] = useState<MediaFile[]>([
    {
      id: 1,
      name: 'hero-image.jpg',
      url: '/uploads/hero-image.jpg',
      type: 'image',
      size: 2048576,
      mimeType: 'image/jpeg',
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      tags: ['hero', 'homepage'],
    },
    {
      id: 2,
      name: 'product-demo.mp4',
      url: '/uploads/product-demo.mp4',
      type: 'video',
      size: 15728640,
      mimeType: 'video/mp4',
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      tags: ['product', 'demo'],
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadingFiles(acceptedFiles);
    setShowUploadDialog(true);
    
    // Simulate upload
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newFile: MediaFile = {
          id: Date.now() + Math.random(),
          name: file.name,
          url: URL.createObjectURL(file),
          type: getFileType(file.type),
          size: file.size,
          mimeType: file.type,
          uploadedAt: new Date(),
        };
        setFiles(prev => [newFile, ...prev]);
      };
      reader.readAsDataURL(file);
    });
    
    setTimeout(() => {
      setShowUploadDialog(false);
      setUploadingFiles([]);
    }, 2000);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes ? { [acceptedTypes[0]]: acceptedTypes } : undefined,
  });

  const getFileType = (mimeType: string): MediaFile['type'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    return 'other';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: MediaFile['type']) => {
    switch (type) {
      case 'image': return ImageIcon;
      case 'video': return Video;
      case 'audio': return Music;
      case 'document': return FileText;
      default: return File;
    }
  };

  const handleSelect = (fileId: number) => {
    if (allowMultiple) {
      setSelectedFiles(prev => {
        const next = new Set(prev);
        if (next.has(fileId)) {
          next.delete(fileId);
        } else {
          next.add(fileId);
        }
        return next;
      });
    } else {
      const file = files.find(f => f.id === fileId);
      if (file && onSelectFile) {
        onSelectFile(file);
      }
    }
  };

  const handleConfirmSelection = () => {
    if (onSelectMultiple) {
      const selected = files.filter(f => selectedFiles.has(f.id));
      onSelectMultiple(selected);
    }
  };

  const handleDelete = (fileId: number) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setSelectedFiles(prev => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || file.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Media Library</h2>
          <p className="text-muted-foreground">
            Manage your uploaded files and media assets
          </p>
        </div>
        <Button {...getRootProps()}>
          <input {...getInputProps()} />
          <Upload className="mr-2 h-4 w-4" />
          Upload Files
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-semibold mb-2">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-muted-foreground">
          or click to browse from your computer
        </p>
      </div>

      {/* Selection Bar */}
      {allowMultiple && selectedFiles.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Badge>{selectedFiles.size} selected</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFiles(new Set())}
            >
              <X className="mr-2 h-4 w-4" />
              Clear Selection
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button size="sm" onClick={handleConfirmSelection}>
              <Check className="mr-2 h-4 w-4" />
              Use Selected
            </Button>
          </div>
        </div>
      )}

      {/* Files Grid/List */}
      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No files found</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredFiles.map((file) => {
            const Icon = getFileIcon(file.type);
            const isSelected = selectedFiles.has(file.id);

            return (
              <Card
                key={file.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-lg',
                  isSelected && 'ring-2 ring-primary'
                )}
                onClick={() => handleSelect(file.id)}
              >
                <CardContent className="p-4">
                  <div className="relative">
                    {allowMultiple && (
                      <Checkbox
                        checked={isSelected}
                        className="absolute top-2 left-2 z-10"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <div className="aspect-square rounded-lg bg-muted flex items-center justify-center mb-3">
                      {file.type === 'image' ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Icon className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((file) => {
            const Icon = getFileIcon(file.type);
            const isSelected = selectedFiles.has(file.id);

            return (
              <Card
                key={file.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  isSelected && 'ring-2 ring-primary'
                )}
                onClick={() => handleSelect(file.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {allowMultiple && (
                      <Checkbox
                        checked={isSelected}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      {file.type === 'image' ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Icon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)} • {file.mimeType}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {formatDistance(file.uploadedAt, new Date(), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.url, '_blank');
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Progress Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uploading Files</DialogTitle>
            <DialogDescription>
              Please wait while your files are being uploaded...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {uploadingFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2">
                <File className="h-4 w-4" />
                <span className="flex-1 truncate text-sm">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
