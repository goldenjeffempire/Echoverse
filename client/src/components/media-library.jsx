import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, Upload, Search, Trash2, Download, Eye, Grid3x3, List, Filter, File, Video, FileText, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
export function MediaLibrary() {
    const [mediaFiles, setMediaFiles] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFolder, setSelectedFolder] = useState("all");
    const [selectedType, setSelectedType] = useState("all");
    const [selectedFiles, setSelectedFiles] = useState(new Set());
    const [viewMode, setViewMode] = useState("grid");
    const [previewFile, setPreviewFile] = useState(null);
    const fileInputRef = useRef(null);
    const { toast } = useToast();
    const folders = ["all", "images", "videos", "documents", "uploads"];
    const fileTypes = [
        { value: "all", label: "All Types" },
        { value: "image", label: "Images" },
        { value: "video", label: "Videos" },
        { value: "document", label: "Documents" }
    ];
    useEffect(() => {
        loadMediaFiles();
    }, []);
    useEffect(() => {
        filterFiles();
    }, [mediaFiles, searchQuery, selectedFolder, selectedType]);
    const loadMediaFiles = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/media');
            setMediaFiles(response.files || []);
        }
        catch (error) {
            toast({
                title: "Error loading media",
                description: error.message || "Failed to load media files",
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    };
    const filterFiles = () => {
        let filtered = [...mediaFiles];
        if (searchQuery) {
            filtered = filtered.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
        }
        if (selectedFolder !== "all") {
            filtered = filtered.filter(f => f.folder === selectedFolder);
        }
        if (selectedType !== "all") {
            filtered = filtered.filter(f => f.type.startsWith(selectedType));
        }
        setFilteredFiles(filtered);
    };
    const handleFileUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0)
            return;
        setUploading(true);
        const formData = new FormData();
        Array.from(files).forEach((file) => {
            formData.append('files', file);
        });
        formData.append('folder', selectedFolder === 'all' ? 'uploads' : selectedFolder);
        try {
            const response = await apiClient.post('/api/upload-multiple', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMediaFiles([...response.files, ...mediaFiles]);
            toast({
                title: "Upload successful",
                description: `${files.length} file(s) uploaded successfully`,
            });
        }
        catch (error) {
            toast({
                title: "Upload failed",
                description: error.message || "Failed to upload files",
                variant: "destructive"
            });
        }
        finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    const handleDelete = async (fileIds) => {
        try {
            await apiClient.delete('/api/media', { data: { fileIds } });
            setMediaFiles(mediaFiles.filter(f => !fileIds.includes(f.id)));
            setSelectedFiles(new Set());
            toast({
                title: "Files deleted",
                description: `${fileIds.length} file(s) deleted successfully`,
            });
        }
        catch (error) {
            toast({
                title: "Delete failed",
                description: error.message || "Failed to delete files",
                variant: "destructive"
            });
        }
    };
    const toggleFileSelection = (fileId) => {
        const newSelected = new Set(selectedFiles);
        if (newSelected.has(fileId)) {
            newSelected.delete(fileId);
        }
        else {
            newSelected.add(fileId);
        }
        setSelectedFiles(newSelected);
    };
    const getFileIcon = (type) => {
        if (type.startsWith('image'))
            return <ImageIcon className="h-4 w-4"/>;
        if (type.startsWith('video'))
            return <Video className="h-4 w-4"/>;
        if (type.startsWith('application'))
            return <FileText className="h-4 w-4"/>;
        return <File className="h-4 w-4"/>;
    };
    const formatFileSize = (bytes) => {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };
    if (loading) {
        return (<div className="space-y-6">
        <Skeleton className="h-10 w-64"/>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32"/>)}
        </div>
      </div>);
    }
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <ImageIcon className="h-8 w-8 text-primary"/>
            Media Library
          </h1>
          <p className="text-muted-foreground">Manage your media assets</p>
        </div>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" accept="image/*,video/*,.pdf,.doc,.docx"/>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4 mr-2"/>
            {uploading ? "Uploading..." : "Upload Files"}
          </Button>
          <Button variant="outline" size="icon" onClick={() => setViewMode("grid")} className={viewMode === "grid" ? "bg-accent" : ""}>
            <Grid3x3 className="h-4 w-4"/>
          </Button>
          <Button variant="outline" size="icon" onClick={() => setViewMode("list")} className={viewMode === "list" ? "bg-accent" : ""}>
            <List className="h-4 w-4"/>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaFiles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mediaFiles.filter(f => f.type.startsWith('image')).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mediaFiles.filter(f => f.type.startsWith('video')).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mediaFiles.filter(f => f.type.startsWith('application')).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
          <Input placeholder="Search media files..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9"/>
        </div>
        <Select value={selectedFolder} onValueChange={setSelectedFolder}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Folder"/>
          </SelectTrigger>
          <SelectContent>
            {folders.map(folder => (<SelectItem key={folder} value={folder}>
                {folder.charAt(0).toUpperCase() + folder.slice(1)}
              </SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2"/>
            <SelectValue placeholder="File Type"/>
          </SelectTrigger>
          <SelectContent>
            {fileTypes.map(type => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {selectedFiles.size > 0 && (<Card className="bg-accent/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary"/>
                <span>{selectedFiles.size} file(s) selected</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedFiles(new Set())}>
                  Deselect All
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(Array.from(selectedFiles))}>
                  <Trash2 className="h-4 w-4 mr-2"/>
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>)}

      <Card>
        <CardContent className="pt-6">
          <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-3 lg:grid-cols-4" : "space-y-2"}>
            {filteredFiles.map(file => (<div key={file.id} className={`relative group border rounded-lg p-3 hover-elevate cursor-pointer ${selectedFiles.has(file.id) ? 'ring-2 ring-primary' : ''} ${viewMode === "list" ? "flex items-center gap-3" : ""}`} onClick={() => toggleFileSelection(file.id)}>
                <Checkbox checked={selectedFiles.has(file.id)} onCheckedChange={() => toggleFileSelection(file.id)} className="absolute top-2 right-2 z-10"/>
                
                {viewMode === "grid" ? (<>
                    <div className="aspect-square bg-muted rounded-md flex items-center justify-center mb-2">
                      {file.thumbnailUrl ? (<img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover rounded-md"/>) : (getFileIcon(file.type))}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </>) : (<>
                    <div className="flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setPreviewFile(file)}>
                            <Eye className="h-4 w-4"/>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{file.name}</DialogTitle>
                            <DialogDescription>File preview</DialogDescription>
                          </DialogHeader>
                          {file.type.startsWith('image') && (<img src={file.url} alt={file.name} className="max-h-96 w-full object-contain"/>)}
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={file.url} download>
                          <Download className="h-4 w-4"/>
                        </a>
                      </Button>
                    </div>
                  </>)}
              </div>))}
          </div>
        </CardContent>
      </Card>
    </div>);
}
