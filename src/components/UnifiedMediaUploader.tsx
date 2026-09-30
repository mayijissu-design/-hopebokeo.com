import React, { useState } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, Video, FileText, X, Check, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { compressImageFile } from '../utils/imageCompressor';
import { uploadFileDirectly } from '../utils/fileUploader';

interface UnifiedMediaUploaderProps {
  value: string;
  onChange: (url: string) => void;
  language?: Language;
  label?: string;
  acceptTypes?: string;
  fileType?: string;
  placeholder?: string;
  disabled?: boolean;
  maxDimension?: number;
  maxStringLength?: number;
  preserveTransparency?: boolean;
}

export const UnifiedMediaUploader: React.FC<UnifiedMediaUploaderProps> = ({
  value,
  onChange,
  language = 'lo',
  label,
  acceptTypes = 'image/*,.jpg,.jpeg,.png,.webp,.gif,.svg,.bmp,.heic,.heif,.avif,.jfif,.tiff',
  placeholder,
  disabled = false,
  maxDimension = 1600,
  maxStringLength = 180000,
  preserveTransparency = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg|bmp|heic|heif|avif|tiff)$/i.test(file.name)) {
        // Fast instant client-side image compression (<0.1s)
        const compressedBase64 = await compressImageFile(file, maxDimension, 0.82, maxStringLength, preserveTransparency);
        if (compressedBase64) {
          onChange(compressedBase64);
        } else {
          // Fallback to direct data URL if canvas compression didn't produce output
          const reader = new FileReader();
          reader.onload = (ev) => onChange((ev.target?.result as string) || '');
          reader.readAsDataURL(file);
        }
      } else {
        // Fast streaming upload for non-images (PDF, docs, video, audio)
        try {
          const res = await uploadFileDirectly(file);
          onChange(res.url);
        } catch {
          // Fallback only if server unreachable
          const reader = new FileReader();
          const base64Data = await new Promise<string>((resolve, reject) => {
            reader.onload = (ev) => resolve(ev.target?.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
          });
          onChange(base64Data);
        }
      }
    } catch (err) {
      console.error('File selection error:', err);
    } finally {
      setIsUploading(false);
      // Reset input value so selecting the same file again works
      e.target.value = '';
    }
  };

  const isVideo = value?.match(/\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i) || value?.includes('youtube.com') || value?.includes('youtu.be') || value?.startsWith('data:video');
  const isDoc = Boolean(value?.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv)(\?.*)?$/i)) || Boolean(value?.startsWith('data:application/')) || Boolean(value?.startsWith('data:text/'));
  const isImage = Boolean(value) && !isVideo && !isDoc;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      
      <div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-3 space-y-2.5 transition focus-within:border-indigo-500 hover:border-slate-300 dark:hover:border-slate-600">
        {/* Single Input Row: Link Input + Fast Upload Button */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              disabled={disabled}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={
                placeholder ||
                (language === 'lo'
                  ? 'ວ່າງລິ້ງຮູບ URL ຫຼື ເລືອກໄຟລ໌ຮູບຈາກເຄື່ອງ...'
                  : 'Paste image link OR select file from device...')
              }
              className="w-full pl-8 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:cursor-not-allowed disabled:text-slate-400"
            />
            {value && !disabled && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <label className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition ${
            disabled
              ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed pointer-events-none'
              : 'cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
          }`}>
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>
              {language === 'lo' ? 'ເລືອກຮູບຈາກເຄື່ອງ' : 'Choose Local File'}
            </span>
            <input
              type="file"
              disabled={disabled}
              accept={acceptTypes}
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>

        {/* Live Preview Inside Same Unified Box */}
        {value && (
          <div className="relative rounded-xl overflow-hidden bg-slate-200/70 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 p-2 flex items-center gap-3">
            {isImage ? (
              <img
                src={value}
                alt="Preview"
                className="w-12 h-12 object-cover rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 shrink-0 bg-white"
                onError={(e) => {
                  // Fallback icon if URL is broken
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : isVideo ? (
              <div className="w-12 h-12 bg-red-100 dark:bg-red-950/60 text-[#cc0000] rounded-lg flex items-center justify-center shrink-0">
                <Video className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" />
                {isDoc ? (language === 'lo' ? 'ຟາຍເອກະສານພ້ອມໃຊ້ງານ' : 'Document Ready') : (language === 'lo' ? 'ມີຮູບ/ໄຟລ໌ພ້ອມໃຊ້ງານ' : 'Media Ready')}
              </span>
              <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate mt-0.5 font-mono">
                {value.startsWith('data:') ? `Local File (${Math.round(value.length / 1024)} KB)` : value.split('/').pop()?.split('?')[0] || value}
              </p>
            </div>

            {!disabled && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
