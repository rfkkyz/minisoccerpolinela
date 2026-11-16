import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle, X } from 'lucide-react';

export function FileUpload({
  label,
  accept = 'image/*,application/pdf,.jpg,.jpeg,.png,.webp,.pdf',
  maxSizeMb,
  maxSizeMB,
  maxSize = 5,
  onFileSelect,
  onFileSelected,
  selectedFile: externalFile,
  helperText,
  error,
  className = ''
}) {
  const limitMb = maxSizeMb || maxSizeMB || maxSize || 5;
  const [internalFile, setInternalFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [internalError, setInternalError] = useState('');
  const inputRef = useRef(null);

  const activeFile = externalFile !== undefined ? externalFile : internalFile;

  useEffect(() => {
    if (!activeFile) {
      setPreviewUrl(null);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    if (activeFile instanceof Blob || activeFile instanceof File) {
      if (activeFile.type?.startsWith('image/')) {
        const url = URL.createObjectURL(activeFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      } else {
        setPreviewUrl(null);
      }
    } else if (typeof activeFile === 'string') {
      setPreviewUrl(activeFile);
    }
  }, [activeFile]);

  const validateFileType = (file) => {
    if (!accept || accept === '*') return true;
    const allowed = accept.split(',').map(item => item.trim().toLowerCase());
    const fileName = (file.name || '').toLowerCase();
    const fileType = (file.type || '').toLowerCase();

    return allowed.some(pattern => {
      if (pattern.startsWith('.')) {
        return fileName.endsWith(pattern);
      }
      if (pattern.endsWith('/*')) {
        const prefix = pattern.slice(0, -2);
        return fileType.startsWith(prefix);
      }
      return fileType === pattern;
    });
  };

  const handleFile = (file) => {
    if (!file) return;
    setInternalError('');

    // Check size limit
    if (file.size > limitMb * 1024 * 1024) {
      setInternalError(`Ukuran berkas (${(file.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimum ${limitMb} MB.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    // Check format/type
    if (!validateFileType(file)) {
      setInternalError('Format berkas tidak didukung. Harap pilih file gambar (JPG, PNG, WEBP) atau PDF.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setInternalFile(file);

    if (onFileSelected) {
      onFileSelected(file);
    }
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    if (inputRef.current) inputRef.current.value = '';
    setInternalFile(null);
    setPreviewUrl(null);
    setInternalError('');
    if (onFileSelected) onFileSelected(null);
    if (onFileSelect) onFileSelect(null);
  };

  const displayedError = error || internalError;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block font-sans text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
          {label}
        </label>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all select-none overflow-hidden ${
          dragOver
            ? 'border-[#12A150] bg-emerald-50/60 ring-2 ring-[#7CFFB2]/50'
            : activeFile
            ? 'border-emerald-500 bg-emerald-50/50'
            : 'border-slate-300 hover:border-emerald-400 bg-slate-50/60 hover:bg-emerald-50/20'
        }`}
      >
        {/* Invisible native file input covering the entire box for 100% mobile touch compatibility */}
        {!activeFile && (
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
        )}

        {activeFile ? (
          <div className="relative z-20 flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Pratinjau"
                  className="w-12 h-12 object-cover rounded-xl border border-black/10 shrink-0 shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-[#12A150] shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
              )}
              <div className="overflow-hidden min-w-0">
                <div className="font-sans text-xs font-bold text-[var(--ink)] truncate">
                  {activeFile.name || 'Berkas Terpilih'}
                </div>
                <div className="font-mono text-[11px] text-slate-500">
                  {activeFile.size ? `${(activeFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Siap Diunggah'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-rose-100 hover:text-rose-600 text-slate-600 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              title="Hapus berkas"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2 pointer-events-none">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100/80 flex items-center justify-center text-[#12A150] mb-2.5 shadow-2xs">
              <UploadCloud className="w-6 h-6 stroke-[2.2]" />
            </div>
            <p className="font-sans text-xs text-slate-700 font-medium">
              <span className="font-bold text-[#12A150]">Klik untuk unggah</span> atau seret berkas ke sini
            </p>
            <p className="font-mono text-[10px] text-slate-400 mt-1">
              JPG, PNG, WEBP, atau PDF (maks. {limitMb} MB)
            </p>
          </div>
        )}
      </div>

      {helperText && !displayedError && (
        <p className="font-sans text-[11px] text-slate-500">{helperText}</p>
      )}
      {displayedError && (
        <p className="font-sans text-[11px] text-rose-600 font-medium flex items-center gap-1.5 animate-in fade-in">
          <span>⚠</span>
          <span>{displayedError}</span>
        </p>
      )}
    </div>
  );
}

export default FileUpload;
