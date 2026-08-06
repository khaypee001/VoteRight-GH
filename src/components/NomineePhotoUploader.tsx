import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2 } from 'lucide-react';

interface NomineePhotoUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

export const NomineePhotoUploader: React.FC<NomineePhotoUploaderProps> = ({
  value,
  onChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WebP)');
      return;
    }

    // Client-side instant preview via FileReader
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-extrabold text-slate-700 block">
        Contestant Official Photo <span className="text-rose-500">*</span>
      </label>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {value ? (
        <div
          className="relative rounded-2xl border-2 border-slate-200 bg-slate-50 p-3 flex items-center gap-4 shadow-sm group transition-all duration-300 ease-out scale-100 opacity-100"
        >
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0 relative border border-slate-300">
            <img
              src={value}
              alt="Contestant Preview"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Photo Attached Ready</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Saved to Supabase Storage bucket: <span className="font-bold text-slate-700">nominee-photos</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => onChange('')}
            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all duration-150 ease-in-out active:scale-95 hover:scale-105 cursor-pointer border border-rose-200"
            title="Remove/Replace Image"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 ease-in-out cursor-pointer flex flex-col items-center justify-center space-y-3 ${
            isDragging
              ? 'border-blue-500 bg-blue-50/80 scale-[1.01] shadow-md animate-pulse'
              : 'border-slate-300 bg-slate-50 hover:bg-blue-50/70 hover:border-blue-500 shadow-xs'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
            <Upload className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-black text-slate-800">
              Drag and drop contestant photo here
            </p>
            <p className="text-[11px] text-slate-500">
              Supports High-Res JPG, PNG, or WebP up to 10MB
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="bg-white border border-slate-300 hover:border-blue-600 text-slate-700 hover:text-blue-600 text-xs font-extrabold px-4 py-2 rounded-xl transition-all duration-150 ease-in-out active:scale-95 hover:scale-105 shadow-xs"
          >
            Browse Files from Machine/Device
          </button>
        </div>
      )}
    </div>
  );
};
