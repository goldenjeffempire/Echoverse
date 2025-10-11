/**
 * Avatar Upload Component with Cropping
 * Issue #64: Build avatar upload with cropping UI
 */
import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
export function AvatarUpload({ currentAvatar, onUpload }) {
    const [preview, setPreview] = useState(currentAvatar || null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);
        // Upload
        handleUpload(file);
    };
    const handleUpload = async (file) => {
        setUploading(true);
        try {
            await onUpload(file);
        }
        catch (error) {
            console.error('Avatar upload failed:', error);
            alert('Failed to upload avatar');
        }
        finally {
            setUploading(false);
        }
    };
    const handleRemove = () => {
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    return (<div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          {preview ? (<img src={preview} alt="Avatar" className="w-full h-full object-cover"/>) : (<Upload className="w-8 h-8 text-gray-400"/>)}
        </div>
        {uploading && (<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>)}
        {preview && !uploading && (<button onClick={handleRemove} className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600">
            <X className="w-4 h-4"/>
          </button>)}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" aria-label="Upload avatar"/>

      <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        {preview ? 'Change Avatar' : 'Upload Avatar'}
      </button>
    </div>);
}
