import React, { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import mammoth from 'mammoth';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Palette,
  Highlighter,
  Code,
  Eye,
  Eraser,
  Sparkles,
  Upload,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Loader2,
  Check,
  FileUp,
  Image as ImageIcon,
  Link as LinkIcon,
  Paperclip,
} from 'lucide-react';
import { Language } from '../types';
import { compressImageFile } from '../utils/imageCompressor';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  label?: string;
  disabled?: boolean;
  language?: Language;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  onFileImportedTitle?: (title: string) => void;
  onImageAttached?: (imageUrl: string) => void;
  onPdfAttached?: (pdfDataUrlOrUrl: string, fileName: string) => void;
}

// Helper to sanitize and preserve formatting from Word, PDF, or rich HTML
export function cleanRichHtml(html: string): string {
  if (!html) return '';

  // Remove MS Word specific comments and XML tags if present
  let cleaned = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<xml[\s\S]*?<\/xml>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/class="Mso[^"]*"/gi, '')
    .replace(/class='Mso[^']*'/gi, '');

  return DOMPurify.sanitize(cleaned, {
    ALLOWED_TAGS: [
      'p', 'div', 'span', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote',
      'font', 'a', 'mark', 'sub', 'sup', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
      'colgroup', 'col', 'caption', 'img', 'figure', 'figcaption', 'hr', 'iframe', 'embed', 'object'
    ],
    ALLOWED_ATTR: [
      'style', 'color', 'size', 'face', 'align', 'valign', 'bgcolor', 'border',
      'cellpadding', 'cellspacing', 'colspan', 'rowspan', 'href', 'target', 'class',
      'src', 'alt', 'width', 'height', 'data', 'type', 'title', 'loading', 'rel'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}

const COLOR_PRESETS = [
  { label: 'Default', value: 'inherit' },
  { label: 'Black', value: '#0f172a' },
  { label: 'Dark Gray', value: '#475569' },
  { label: 'White', value: '#ffffff' },
  { label: 'Red (Hope)', value: '#cc0000' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Amber / Gold', value: '#d97706' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Purple', value: '#9333ea' },
  { label: 'Pink', value: '#db2777' },
  { label: 'Cyan', value: '#0891b2' },
];

const HIGHLIGHT_PRESETS = [
  { label: 'None', value: 'transparent' },
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Cyan', value: '#a5f3fc' },
  { label: 'Pink', value: '#fbcfe8' },
  { label: 'Orange', value: '#fed7aa' },
  { label: 'Purple', value: '#e9d5ff' },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  language = 'lo',
  placeholder = 'ພິມ, ວາງ (Paste) ຂໍ້ຄວາມຈາກ Word ຫຼື ອິມພອດຟາຍທີ່ນີ້...',
  minHeight = '150px',
  className = '',
  onFileImportedTitle,
  onImageAttached,
  onPdfAttached,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHtmlMode, setIsHtmlMode] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      if (html === '<br>' || html.trim() === '') {
        onChange('');
      } else {
        onChange(html);
      }
    }
  };

  // Sync internal innerHTML when `value` prop changes externally
  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, isHtmlMode]);

  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState<boolean>(false);
  const [showImagePrompt, setShowImagePrompt] = useState<boolean>(false);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');

  // Handle local Image Upload -> Convert to compressed base64 or URL and insert inline
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    setImportSuccessMsg(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const compressed = await compressImageFile(file, 1400, 0.82);
          let finalImgUrl = compressed;

          // Try server upload if available
          try {
            const res = await fetch('/api/upload-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ base64Data: compressed, fileName: file.name }),
            });
            const data = await res.json();
            if (data.success && data.url) {
              finalImgUrl = data.url;
            }
          } catch {
            // fallback to base64
          }

          if (finalImgUrl) {
            editorRef.current?.focus();
            const imgHtml = `<p style="text-align: center; margin: 16px 0;"><img src="${finalImgUrl}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); display: inline-block;" /></p><p></p>`;
            document.execCommand('insertHTML', false, imgHtml);
            handleInput();

            if (onImageAttached) {
              onImageAttached(finalImgUrl);
            }
          }
        }
      }

      setImportSuccessMsg(
        language === 'lo'
          ? 'ແຊກຮູບພາບເຂົ້າໃນບົດລາຍງານສຳເລັດ!'
          : language === 'th'
          ? 'แทรกรูปภาพลงในรายงานสำเร็จ!'
          : 'Image inserted into report successfully!'
      );
    } catch (err) {
      console.error('Image insert error:', err);
    } finally {
      setIsUploadingImage(false);
      if (imageFileInputRef.current) imageFileInputRef.current.value = '';
      setTimeout(() => setImportSuccessMsg(null), 4000);
    }
  };

  // Handle direct Image URL insertion
  const handleInsertImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    const url = imageUrlInput.trim();
    editorRef.current?.focus();
    const imgHtml = `<p style="text-align: center; margin: 16px 0;"><img src="${url}" alt="Report photo" style="max-width: 100%; height: auto; border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); display: inline-block;" /></p><p></p>`;
    document.execCommand('insertHTML', false, imgHtml);
    handleInput();
    if (onImageAttached) onImageAttached(url);
    setImageUrlInput('');
    setShowImagePrompt(false);
  };

  // Handle PDF file upload & attachment
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPdf(true);
    setImportSuccessMsg(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Pdf = event.target?.result as string;
        let finalPdfUrl = base64Pdf;

        try {
          const res = await fetch('/api/upload-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Data: base64Pdf, fileName: file.name }),
          });
          const data = await res.json();
          if (data.success && data.url) {
            finalPdfUrl = data.url;
          }
        } catch {
          // fallback to base64
        }

        // Notify parent of PDF
        if (onPdfAttached) {
          onPdfAttached(finalPdfUrl, file.name);
        }

        // Insert interactive PDF link/badge into report text
        editorRef.current?.focus();
        const pdfBadgeHtml = `
          <div style="margin: 16px 0; padding: 14px 18px; background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">📄</span>
              <div>
                <strong style="color: #0f172a; font-size: 13px; display: block;">${file.name}</strong>
                <span style="color: #64748b; font-size: 11px;">PDF Document (${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            </div>
            <a href="${finalPdfUrl}" target="_blank" rel="noopener noreferrer" style="padding: 6px 14px; background-color: #cc0000; color: #ffffff; border-radius: 8px; font-size: 12px; font-weight: bold; text-decoration: none; display: inline-block;">
              ເປີດອ່ານ PDF
            </a>
          </div>
          <p></p>
        `;
        document.execCommand('insertHTML', false, pdfBadgeHtml);
        handleInput();

        setImportSuccessMsg(
          language === 'lo'
            ? `ອິມພອດ ແລະ ແນບຟາຍ PDF "${file.name}" ສຳເລັດ!`
            : language === 'th'
            ? `นำเข้าและแนบไฟล์ PDF "${file.name}" สำเร็จ!`
            : `Imported and attached PDF "${file.name}"!`
        );
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('PDF upload error:', err);
      alert('Failed to upload PDF: ' + err?.message);
    } finally {
      setIsUploadingPdf(false);
      if (pdfFileInputRef.current) pdfFileInputRef.current.value = '';
      setTimeout(() => setImportSuccessMsg(null), 4000);
    }
  };

  const executeCommand = (command: string, val: string | undefined = undefined) => {
    if (disabled || isHtmlMode) return;
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleInput();
  };

  // Intercept Paste to seamlessly keep Word & Rich text styling
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (disabled || isHtmlMode) return;
    e.preventDefault();

    const clipboardData = e.clipboardData;
    const htmlData = clipboardData.getData('text/html');
    const plainText = clipboardData.getData('text/plain');

    if (htmlData && htmlData.trim()) {
      const sanitized = cleanRichHtml(htmlData);
      document.execCommand('insertHTML', false, sanitized);
    } else if (plainText) {
      const formatted = plainText
        .split('\n')
        .map((line) => line.trim())
        .join('<br>');
      document.execCommand('insertHTML', false, formatted);
    }
    handleInput();
  };

  // Handle Document File Import (.docx, .doc, .txt, .html, .md)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportSuccessMsg(null);

    try {
      const fileName = file.name.toLowerCase();
      const rawTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      if (fileName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const sanitized = cleanRichHtml(result.value);
        onChange(sanitized);

        if (onFileImportedTitle) {
          onFileImportedTitle(rawTitle);
        }

        setImportSuccessMsg(
          language === 'lo'
            ? `ອິມພອດຟາຍ Word "${file.name}" ສຳເລັດ!`
            : language === 'th'
            ? `นำเข้าไฟล์ Word "${file.name}" สำเร็จ!`
            : `Imported "${file.name}" successfully!`
        );
      } else if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
        const text = await file.text();
        const sanitized = cleanRichHtml(text);
        onChange(sanitized);
        if (onFileImportedTitle) onFileImportedTitle(rawTitle);
        setImportSuccessMsg(
          language === 'lo'
            ? `ອິມພອດ HTML "${file.name}" ສຳເລັດ!`
            : `Imported "${file.name}" successfully!`
        );
      } else if (fileName.endsWith('.json')) {
        const text = await file.text();
        try {
          const parsed = JSON.parse(text);
          if (parsed.description) onChange(cleanRichHtml(parsed.description));
          else if (typeof parsed === 'string') onChange(cleanRichHtml(parsed));
          if (parsed.title && onFileImportedTitle) onFileImportedTitle(parsed.title);
          setImportSuccessMsg('Imported JSON successfully!');
        } catch {
          onChange(`<p>${text}</p>`);
        }
      } else {
        // Plain text / Markdown (.txt, .md, .rtf)
        const text = await file.text();
        const formatted = text
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => `<p>${line}</p>`)
          .join('');
        onChange(formatted || `<p>${text}</p>`);
        if (onFileImportedTitle) onFileImportedTitle(rawTitle);
        setImportSuccessMsg(
          language === 'lo'
            ? `ອິມພອດຂໍ້ຄວາມ "${file.name}" ສຳເລັດ!`
            : `Imported "${file.name}" successfully!`
        );
      }
    } catch (err: any) {
      console.error('File import error:', err);
      alert(
        language === 'lo'
          ? 'ເກີດຂໍ້ຜິດພາດໃນການອ່ານຟາຍ ກະລຸນາກວດສອບຟາຍ Word/Text ອີກຄັ້ງ'
          : 'Failed to read document file. Please ensure it is a valid .docx or text file.'
      );
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setImportSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        {label && (
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}

        {/* Quick File Import Action in label line */}
        {!disabled && (
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc,.txt,.html,.htm,.md,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg border border-amber-500/30 transition cursor-pointer shadow-xs disabled:opacity-50"
              title={
                language === 'lo'
                  ? 'ອິມພອດຟາຍລາຍງານ (.docx Word, .txt, .html)'
                  : 'Import document report file (.docx Word, .txt, .html)'
              }
            >
              {isImporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              ) : (
                <FileUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              )}
              <span>
                {language === 'lo'
                  ? 'ອິມພອດຟາຍ Word (.docx)'
                  : language === 'th'
                  ? 'นำเข้าไฟล์ Word (.docx)'
                  : 'Import Word (.docx)'}
              </span>
            </button>
          </div>
        )}
      </div>

      {importSuccessMsg && (
        <div className="flex items-center gap-1.5 p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{importSuccessMsg}</span>
        </div>
      )}

      <div
        className={`border border-slate-300 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs transition-colors focus-within:border-[#cc0000] focus-within:ring-1 focus-within:ring-[#cc0000] ${className}`}
      >
        {/* Full MS Word Rich Text Toolbar */}
        {!disabled && (
          <div className="flex items-center flex-wrap gap-1 p-2 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs select-none">
            {/* Format / Headings */}
            <button
              type="button"
              title="Heading 1"
              onClick={() => executeCommand('formatBlock', '<h1>')}
              disabled={isHtmlMode}
              className="px-1.5 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-black text-xs transition cursor-pointer disabled:opacity-40"
            >
              H1
            </button>
            <button
              type="button"
              title="Heading 2"
              onClick={() => executeCommand('formatBlock', '<h2>')}
              disabled={isHtmlMode}
              className="px-1.5 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition cursor-pointer disabled:opacity-40"
            >
              H2
            </button>
            <button
              type="button"
              title="Heading 3"
              onClick={() => executeCommand('formatBlock', '<h3>')}
              disabled={isHtmlMode}
              className="px-1.5 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs transition cursor-pointer disabled:opacity-40"
            >
              H3
            </button>

            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

            {/* Bold */}
            <button
              type="button"
              title={language === 'lo' ? 'ຕົວໜາ (Bold)' : 'Bold'}
              onClick={() => executeCommand('bold')}
              disabled={isHtmlMode}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition cursor-pointer disabled:opacity-40"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            {/* Italic */}
            <button
              type="button"
              title={language === 'lo' ? 'ຕົວອຽງ (Italic)' : 'Italic'}
              onClick={() => executeCommand('italic')}
              disabled={isHtmlMode}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-40"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            {/* Underline */}
            <button
              type="button"
              title={language === 'lo' ? 'ຂີດກ້ອງ (Underline)' : 'Underline'}
              onClick={() => executeCommand('underline')}
              disabled={isHtmlMode}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-40"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            {/* Strikethrough */}
            <button
              type="button"
              title="Strikethrough"
              onClick={() => executeCommand('strikeThrough')}
              disabled={isHtmlMode}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-40"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

            {/* Text Color Dropdown */}
            <div className="relative">
              <button
                type="button"
                title={language === 'lo' ? 'ສີຕົວໜັງສື (Text Color)' : 'Text Color'}
                onClick={() => {
                  setShowColorPicker((prev) => !prev);
                  setShowHighlightPicker(false);
                }}
                disabled={isHtmlMode}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 transition cursor-pointer disabled:opacity-40"
              >
                <Palette className="w-3.5 h-3.5 text-[#cc0000]" />
              </button>

              {showColorPicker && (
                <div className="absolute top-full left-0 mt-1 z-30 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 w-48 space-y-2">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {language === 'lo' ? 'ເລືອກສີຕົວໜັງສື' : 'Select Text Color'}
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {COLOR_PRESETS.map((col) => (
                      <button
                        key={col.label}
                        type="button"
                        title={col.label}
                        onClick={() => {
                          executeCommand('foreColor', col.value);
                          setShowColorPicker(false);
                        }}
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center transition hover:scale-110 shadow-xs cursor-pointer"
                        style={{ backgroundColor: col.value === 'inherit' ? '#e2e8f0' : col.value }}
                      >
                        {col.value === 'inherit' && <span className="text-[9px] font-bold">Auto</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Highlight Color Dropdown */}
            <div className="relative">
              <button
                type="button"
                title={language === 'lo' ? 'ສີໄຮໄລ້ພື້ນ (Highlight)' : 'Highlight'}
                onClick={() => {
                  setShowHighlightPicker((prev) => !prev);
                  setShowColorPicker(false);
                }}
                disabled={isHtmlMode}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 transition cursor-pointer disabled:opacity-40"
              >
                <Highlighter className="w-3.5 h-3.5 text-amber-500" />
              </button>

              {showHighlightPicker && (
                <div className="absolute top-full left-0 mt-1 z-30 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 w-44 space-y-2">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {language === 'lo' ? 'ເລືອກສີໄຮໄລ້' : 'Select Highlight'}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {HIGHLIGHT_PRESETS.map((hl) => (
                      <button
                        key={hl.label}
                        type="button"
                        title={hl.label}
                        onClick={() => {
                          executeCommand('hiliteColor', hl.value);
                          setShowHighlightPicker(false);
                        }}
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center transition hover:scale-110 shadow-xs cursor-pointer"
                        style={{ backgroundColor: hl.value === 'transparent' ? '#ffffff' : hl.value }}
                      >
                        {hl.value === 'transparent' && <span className="text-[9px] font-bold text-slate-400">✕</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

            {/* Align Justify (ເຕັມຊ້າຍ-ຂວາ) */}
            <button
              type="button"
              title={language === 'lo' ? 'ຈັດແຖວເຕັມຊ້າຍ-ຂວາ (Justify)' : 'Align Justify'}
              onClick={() => executeCommand('justifyFull')}
              disabled={isHtmlMode}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-40"
            >
              <AlignJustify className="w-3.5 h-3.5 text-[#cc0000]" />
            </button>

            {/* Align Left */}
            <button
              type="button"
              title={language === 'lo' ? 'ຈັດແຖວຊິດຊ້າຍ (Left)' : 'Align Left'}
              onClick={() => executeCommand('justifyLeft')}
              disabled={isHtmlMode}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-40"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>

            {/* Align Center */}
            <button
              type="button"
              title={language === 'lo' ? 'ຈັດແຖວກາງ (Center)' : 'Align Center'}
              onClick={() => executeCommand('justifyCenter')}
              disabled={isHtmlMode}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-40"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>

            {/* Align Right */}
            <button
              type="button"
              title={language === 'lo' ? 'ຈັດແຖວຊິດຂວາ (Right)' : 'Align Right'}
              onClick={() => executeCommand('justifyRight')}
              disabled={isHtmlMode}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-40"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

            {/* Bullet List */}
            <button
              type="button"
              title={language === 'lo' ? 'ລາຍການຈຸດ (Bullet List)' : 'Bullet List'}
              onClick={() => executeCommand('insertUnorderedList')}
              disabled={isHtmlMode}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-40"
            >
              <List className="w-3.5 h-3.5" />
            </button>

            {/* Numbered List */}
            <button
              type="button"
              title={language === 'lo' ? 'ລາຍການຕົວເລກ (Numbered List)' : 'Numbered List'}
              onClick={() => executeCommand('insertOrderedList')}
              disabled={isHtmlMode}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-40"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            {/* Blockquote */}
            <button
              type="button"
              title="Quote"
              onClick={() => executeCommand('formatBlock', '<blockquote>')}
              disabled={isHtmlMode}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-40"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            {/* Remove formatting */}
            <button
              type="button"
              title={language === 'lo' ? 'ລຶບຟອມແມັດ (Clear Formatting)' : 'Clear Formatting'}
              onClick={() => executeCommand('removeFormat')}
              disabled={isHtmlMode}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-red-500 transition cursor-pointer disabled:opacity-40"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

            {/* Insert Image from Device or URL */}
            <div className="relative">
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageFileSelect}
                className="hidden"
              />
              <button
                type="button"
                title={language === 'lo' ? 'ແຊກຮູບພາບເຂົ້າໃນເນື້ອຫາ (Insert Image)' : 'Insert Image'}
                onClick={() => setShowImagePrompt((prev) => !prev)}
                disabled={isHtmlMode || isUploadingImage}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold transition cursor-pointer disabled:opacity-40 flex items-center gap-1"
              >
                {isUploadingImage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline text-[11px] font-bold">
                  {language === 'lo' ? 'ແຊກຮູບ' : 'Image'}
                </span>
              </button>

              {showImagePrompt && (
                <div className="absolute top-full left-0 mt-1 z-30 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 w-64 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    {language === 'lo' ? 'ແຊກຮູບພາບໃນບົດລາຍງານ' : 'Insert Image to Report'}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      imageFileInputRef.current?.click();
                      setShowImagePrompt(false);
                    }}
                    className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{language === 'lo' ? 'ເລືອກຮູບຈາກເຄື່ອງ' : 'Upload from Device'}</span>
                  </button>
                  <div className="relative flex items-center gap-1">
                    <input
                      type="text"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleInsertImageUrl();
                        }
                      }}
                      placeholder="https://...image.jpg"
                      className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleInsertImageUrl}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-[#cc0000] text-white rounded-lg text-xs font-bold shrink-0 transition"
                    >
                      {language === 'lo' ? 'ໃສ່' : 'Add'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Attach / Import PDF file */}
            <input
              ref={pdfFileInputRef}
              type="file"
              accept=".pdf"
              onChange={handlePdfUpload}
              className="hidden"
            />
            <button
              type="button"
              title={language === 'lo' ? 'ອິມພອດ & ແນບຟາຍ PDF (Attach PDF)' : 'Attach PDF'}
              onClick={() => pdfFileInputRef.current?.click()}
              disabled={isHtmlMode || isUploadingPdf}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold transition cursor-pointer disabled:opacity-40 flex items-center gap-1"
            >
              {isUploadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline text-[11px] font-bold">
                {language === 'lo' ? 'ແນບ PDF' : 'PDF'}
              </span>
            </button>

            <div className="ml-auto flex items-center gap-1.5">
              {/* Toggle Visual / HTML mode */}
              <button
                type="button"
                title={isHtmlMode ? 'ສະແດງແບບ Visual' : 'ເບິ່ງລະຫັດ HTML'}
                onClick={() => setIsHtmlMode((prev) => !prev)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                  isHtmlMode
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                }`}
              >
                {isHtmlMode ? <Eye className="w-3 h-3" /> : <Code className="w-3 h-3" />}
                <span>{isHtmlMode ? 'Visual' : 'HTML'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Editor Body */}
        {isHtmlMode ? (
          <textarea
            rows={6}
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="<p style='text-align: justify;'>...</p>"
            className="w-full p-3 font-mono text-xs bg-slate-950 text-emerald-400 outline-none resize-y"
            style={{ minHeight }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleInput}
            onPaste={handlePaste}
            onBlur={handleInput}
            data-placeholder={placeholder}
            className={`p-4 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none leading-relaxed overflow-y-auto text-justify [text-align-last:left] break-words ${
              disabled ? 'opacity-70 bg-slate-50 dark:bg-slate-900/40 cursor-not-allowed' : ''
            }`}
            style={{ minHeight }}
          />
        )}
      </div>
    </div>
  );
};
