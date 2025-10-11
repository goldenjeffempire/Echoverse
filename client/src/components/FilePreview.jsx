/**
 * LOW-012: File Preview Component
 */
import { useState } from 'react';
import { FileIcon, Download, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
export function FilePreview({ file, onClose }) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const formatFileSize = (bytes) => {
        if (!bytes)
            return 'Unknown size';
        const kb = bytes / 1024;
        const mb = kb / 1024;
        if (mb > 1)
            return `${mb.toFixed(2)} MB`;
        return `${kb.toFixed(2)} KB`;
    };
    const renderPreview = () => {
        const type = file.type.toLowerCase();
        if (type.startsWith('image/')) {
            return (<img src={file.url} alt={file.name} className="max-w-full max-h-[70vh] object-contain mx-auto"/>);
        }
        if (type.startsWith('video/')) {
            return (<video src={file.url} controls className="max-w-full max-h-[70vh] mx-auto">
          Your browser does not support the video tag.
        </video>);
        }
        if (type.startsWith('audio/')) {
            return (<div className="flex flex-col items-center gap-4 p-8">
          <div className="text-6xl">🎵</div>
          <audio src={file.url} controls className="w-full max-w-md"/>
        </div>);
        }
        if (type === 'application/pdf') {
            return (<iframe src={file.url} className="w-full h-[70vh] border-0" title={file.name}/>);
        }
        if (type.startsWith('text/') || type === 'application/json') {
            return (<iframe src={file.url} className="w-full h-[70vh] border border-border rounded" title={file.name}/>);
        }
        return (<div className="flex flex-col items-center gap-4 p-8 text-center">
        <FileIcon className="h-16 w-16 text-muted-foreground"/>
        <div>
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Preview not available for this file type
          </p>
        </div>
        <Button asChild>
          <a href={file.url} download={file.name}>
            <Download className="h-4 w-4 mr-2"/>
            Download File
          </a>
        </Button>
      </div>);
    };
    return (<Dialog open={true} onOpenChange={() => onClose?.()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate pr-4">{file.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-normal">
                {formatFileSize(file.size)}
              </span>
              <Button variant="ghost" size="icon" asChild>
                <a href={file.url} download={file.name}>
                  <Download className="h-4 w-4"/>
                </a>
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>);
}
export function FilePreviewTrigger({ file, children }) {
    const [isOpen, setIsOpen] = useState(false);
    return (<>
      <button onClick={() => setIsOpen(true)} className="inline-flex">
        {children || (<Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2"/>
            Preview
          </Button>)}
      </button>
      {isOpen && (<FilePreview file={file} onClose={() => setIsOpen(false)}/>)}
    </>);
}
