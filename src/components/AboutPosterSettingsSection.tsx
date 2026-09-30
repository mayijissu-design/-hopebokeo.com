import React, { useState, useRef } from 'react';
import {
  Compass,
  Image as ImageIcon,
  Save,
  Eye,
  EyeOff,
  Check,
  Sparkles,
  Trash2,
  ExternalLink,
  Crosshair,
  ZoomIn,
  Move,
  RotateCcw,
} from 'lucide-react';
import { UnifiedMediaUploader } from './UnifiedMediaUploader';
import { RichTextEditor } from './RichTextEditor';
import { Language, MinistryTimelineItem } from '../types';
import { MinistryTimelineManager } from './MinistryTimelineManager';

interface AboutPosterSettingsSectionProps {
  language: Language;
  posterBokeoImageUrl: string;
  setPosterBokeoImageUrl: (url: string) => void;
  posterBokeoTitle: string;
  setPosterBokeoTitle: (title: string) => void;
  posterBokeoTitleEn: string;
  setPosterBokeoTitleEn: (title: string) => void;
  posterBokeoTitleTh: string;
  setPosterBokeoTitleTh: (title: string) => void;
  posterBokeoDesc: string;
  setPosterBokeoDesc: (desc: string) => void;
  posterBokeoDescEn: string;
  setPosterBokeoDescEn: (desc: string) => void;
  posterBokeoDescTh: string;
  setPosterBokeoDescTh: (desc: string) => void;
  hideBokeoSection: boolean;
  setHideBokeoSection: (hide: boolean) => void;
  // Customization fields matching announcement poster
  bokeoPosterHeight?: number;
  setBokeoPosterHeight?: (val: number) => void;
  bokeoPosterOverlayOpacity?: number;
  setBokeoPosterOverlayOpacity?: (val: number) => void;
  bokeoPosterEdgeFade?: number;
  setBokeoPosterEdgeFade?: (val: number) => void;
  bokeoPosterDim?: number;
  setBokeoPosterDim?: (val: number) => void;
  bokeoPosterScale?: number;
  setBokeoPosterScale?: (val: number) => void;
  bokeoPosterPosition?: string;
  setBokeoPosterPosition?: (val: string) => void;
  bokeoPosterFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  setBokeoPosterFit?: (val: 'cover' | 'contain' | 'fill' | 'scale-down') => void;
  // Ministry Timeline props
  bokeoTimeline?: MinistryTimelineItem[];
  setBokeoTimeline?: (items: MinistryTimelineItem[]) => void;
  bokeoTimelineTitle?: string;
  setBokeoTimelineTitle?: (val: string) => void;
  bokeoTimelineTitleEn?: string;
  setBokeoTimelineTitleEn?: (val: string) => void;
  bokeoTimelineTitleTh?: string;
  setBokeoTimelineTitleTh?: (val: string) => void;
  hideBokeoTimeline?: boolean;
  setHideBokeoTimeline?: (val: boolean) => void;
  isSaving: boolean;
  onSave: () => void;
}

const SAMPLE_POSTERS = [
  {
    name: 'Bokeo Landscape',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200',
  },
  {
    name: 'Hope Community',
    url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=1200',
  },
  {
    name: 'Mountain Sunrise',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200',
  },
  {
    name: 'Hands of Hope',
    url: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=1200',
  },
];

export const AboutPosterSettingsSection: React.FC<AboutPosterSettingsSectionProps> = ({
  language,
  posterBokeoImageUrl,
  setPosterBokeoImageUrl,
  posterBokeoTitle,
  setPosterBokeoTitle,
  posterBokeoTitleEn,
  setPosterBokeoTitleEn,
  posterBokeoTitleTh,
  setPosterBokeoTitleTh,
  posterBokeoDesc,
  setPosterBokeoDesc,
  posterBokeoDescEn,
  setPosterBokeoDescEn,
  posterBokeoDescTh,
  setPosterBokeoDescTh,
  hideBokeoSection,
  setHideBokeoSection,
  bokeoPosterHeight = 50,
  setBokeoPosterHeight,
  bokeoPosterOverlayOpacity = 85,
  setBokeoPosterOverlayOpacity,
  bokeoPosterEdgeFade = 0,
  setBokeoPosterEdgeFade,
  bokeoPosterDim = 0,
  setBokeoPosterDim,
  bokeoPosterScale = 100,
  setBokeoPosterScale,
  bokeoPosterPosition = '50% 50%',
  setBokeoPosterPosition,
  bokeoPosterFit = 'cover',
  setBokeoPosterFit,
  bokeoTimeline = [],
  setBokeoTimeline,
  bokeoTimelineTitle,
  setBokeoTimelineTitle,
  bokeoTimelineTitleEn,
  setBokeoTimelineTitleEn,
  bokeoTimelineTitleTh,
  setBokeoTimelineTitleTh,
  hideBokeoTimeline = false,
  setHideBokeoTimeline,
  isSaving,
  onSave,
}) => {
  const [activeLangTab, setActiveLangTab] = useState<'lo' | 'en' | 'th'>(
    language === 'en' ? 'en' : language === 'th' ? 'th' : 'lo'
  );
  const [isDraggingPoster, setIsDraggingPoster] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const updateFocalPointFromCoords = (clientX: number, clientY: number) => {
    if (!previewRef.current || !setBokeoPosterPosition) return;
    const rect = previewRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const xPercent = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const yPercent = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
    const newPos = `${Math.round(xPercent)}% ${Math.round(yPercent)}%`;
    setBokeoPosterPosition(newPos);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDraggingPoster(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFocalPointFromCoords(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingPoster) {
      updateFocalPointFromCoords(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = () => {
    setIsDraggingPoster(false);
  };

  const currentTitle =
    activeLangTab === 'en'
      ? posterBokeoTitleEn
      : activeLangTab === 'th'
      ? posterBokeoTitleTh
      : posterBokeoTitle;

  const currentDesc =
    activeLangTab === 'en'
      ? posterBokeoDescEn
      : activeLangTab === 'th'
      ? posterBokeoDescTh
      : posterBokeoDesc;

  const handleDescChange = (val: string) => {
    if (activeLangTab === 'en') setPosterBokeoDescEn(val);
    else if (activeLangTab === 'th') setPosterBokeoDescTh(val);
    else setPosterBokeoDesc(val);
  };

  const effectivePoster =
    posterBokeoImageUrl ||
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#cc0000] font-black text-xs uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>
              {language === 'lo'
                ? 'ຕັ້ງຄ່າໜ້າກ່ຽວກັບພວກເຮົາ'
                : language === 'th'
                ? 'ตั้งค่าหน้าเกี่ยวกับเรา'
                : 'About Us Settings'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
              {language === 'lo'
                ? 'ໂພສເຕີ & ເນື້ອຫາ HOPE BOKEO'
                : language === 'th'
                ? 'โปสเตอร์ & ข้อมูล HOPE BOKEO'
                : 'About Us Poster & Overview'}
            </h2>
            <button
              type="button"
              onClick={() => setHideBokeoSection(!hideBokeoSection)}
              className={`p-2 transition rounded-xl flex items-center justify-center border shadow-xs cursor-pointer ${
                hideBokeoSection
                  ? 'bg-amber-50 text-amber-600 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800 hover:bg-emerald-100'
              }`}
              title={
                hideBokeoSection
                  ? (language === 'lo' ? 'ປັດຈຸບັນຖືກເຊື່ອງໄວ້ (ກົດເພື່ອສະແດງ)' : 'Currently hidden (Click to show)')
                  : (language === 'lo' ? 'ປັດຈຸບັນສະແດງຢູ່ (ກົດເພື່ອເຊື່ອງ)' : 'Currently visible (Click to hide)')
              }
            >
              {hideBokeoSection ? (
                <EyeOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="px-5 py-2.5 bg-[#cc0000] hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          {isSaving ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>
            {language === 'lo'
              ? 'ບັນທຶກການຕັ້ງຄ່າ'
              : language === 'th'
              ? 'บันทึกการตั้งค่า'
              : 'Save Settings'}
          </span>
        </button>
      </div>

      {/* Live Realistic Preview showing title inside poster */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider">
              {language === 'lo'
                ? 'ຕົວຢ່າງການສະແດງຜົນເທິງເວັບ (Live Preview)'
                : 'Live Website Preview'}
            </h3>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            {language === 'lo' ? '✓ ຫົວຂໍ້ຢູ່ພາຍໃນໂພສເຕີ' : '✓ Title inside poster banner'}
          </span>
        </div>

        {/* The Poster Mockup */}
        <div
          ref={previewRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 flex items-end shadow-inner transition-all select-none touch-none cursor-crosshair group"
          style={{
            minHeight: `${Math.round(180 + (bokeoPosterHeight / 100) * 260)}px`,
            maxHeight: `${Math.round(180 + (bokeoPosterHeight / 100) * 260)}px`,
            ...(bokeoPosterEdgeFade > 0
              ? {
                  WebkitMaskImage: `linear-gradient(to bottom, transparent 0px, black ${Math.round((bokeoPosterEdgeFade / 100) * 60)}px, black calc(100% - ${Math.round((bokeoPosterEdgeFade / 100) * 60)}px), transparent 100%)`,
                  maskImage: `linear-gradient(to bottom, transparent 0px, black ${Math.round((bokeoPosterEdgeFade / 100) * 60)}px, black calc(100% - ${Math.round((bokeoPosterEdgeFade / 100) * 60)}px), transparent 100%)`,
                }
              : {}),
          }}
        >
          <img
            src={effectivePoster}
            alt="Preview"
            className="absolute inset-0 w-full h-full pointer-events-none select-none transition-all"
            style={{
              objectFit: bokeoPosterFit,
              objectPosition: bokeoPosterPosition,
              transformOrigin: bokeoPosterPosition,
              transform: `scale(${bokeoPosterScale / 100})`,
              filter: `brightness(${Math.max(20, 100 - bokeoPosterDim * 0.75)}%)`,
            }}
            referrerPolicy="no-referrer"
          />

          {/* Focal Center Target Indicator */}
          <div
            className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 border-white bg-[#cc0000] shadow-2xl pointer-events-none flex items-center justify-center text-white ring-4 ring-red-500/40 z-30 transition-transform active:scale-125"
            style={{
              left: bokeoPosterPosition.split(' ')[0],
              top: bokeoPosterPosition.split(' ')[1] || '50%',
            }}
            title={language === 'lo' ? 'ຈຸດສູນກາງຮູບ' : 'Focal Center'}
          >
            <Crosshair className="w-4 h-4 animate-pulse" />
          </div>

          {/* Indicator Overlay with position and scale values */}
          <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-red-500/30 text-[10px] font-mono text-amber-300 shadow">
            <span>📍 {bokeoPosterPosition}</span>
            <span className="text-slate-500">•</span>
            <span>🔍 {bokeoPosterScale}%</span>
          </div>

          <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none bg-slate-950/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-700/60 text-[10px] text-slate-300 flex items-center gap-1.5">
            <Move className="w-3 h-3 text-[#cc0000] shrink-0" />
            <span>
              {language === 'lo'
                ? 'ແຕະ ຫຼື ລາກເທິງຮູບເພື່ອປັບຈຸດສູນກາງ'
                : 'Click or drag on image to set focal position'}
            </span>
          </div>

          <div
            className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none transition-opacity"
            style={{ opacity: bokeoPosterOverlayOpacity / 100 }}
          />

          <div className="relative z-10 w-full p-4 sm:p-6 flex items-end justify-between gap-3">
            <div className="space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#cc0000] text-white font-black text-[10px] uppercase tracking-wider">
                <Compass className="w-3 h-3 text-white" />
                <span>HOPE BOKEO</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white drop-shadow-md truncate">
                {currentTitle || 'HOPE BOKEO - ແຂວງບໍ່ແກ້ວ'}
              </h2>
              <p className="text-[11px] text-slate-200 font-medium line-clamp-1">
                {language === 'lo'
                  ? 'ສູນລວມການຈັດການພັນທະກິດ, ການພັດທະນາຊຸມຊົນ ແລະ ຄຣິດຕະຈັກ 5 ເມືອງ'
                  : 'Centralized ministry and church platform across 5 districts'}
              </p>
            </div>
            <span className="px-2.5 py-1 bg-black/60 border border-white/20 text-white text-[10px] font-bold shrink-0">
              {language === 'lo' ? 'ອ່ານເພີ່ມເຕີມ' : 'Read Story'}
            </span>
          </div>
        </div>
      </div>

      {/* 1. Poster Image Upload & Presets */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#cc0000]" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              {language === 'lo'
                ? '1. ຮູບພາບໂພສເຕີ (Poster Cover Image)'
                : '1. Poster Cover Image'}
            </h3>
          </div>
          {posterBokeoImageUrl && (
            <button
              type="button"
              onClick={() => setPosterBokeoImageUrl('')}
              className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'lo' ? 'ລຶບຮູບ' : 'Remove Image'}</span>
            </button>
          )}
        </div>

        <UnifiedMediaUploader
          value={posterBokeoImageUrl}
          onChange={setPosterBokeoImageUrl}
          language={language}
          acceptTypes="image/*"
          maxDimension={1600}
          maxStringLength={180000}
          label={
            language === 'lo'
              ? 'ເລືອກໄຟລ໌ຮູບພາບ ຫຼື ວາງລິ້ງ URL ຂອງໂພສເຕີ:'
              : 'Upload Image File or Paste Poster URL:'
          }
        />

        {/* Quick Presets */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
            {language === 'lo'
              ? '💡 ຫຼື ເລືອກຈາກຮູບຕົວຢ່າງທີ່ກຽມໄວ້ໃຫ້ (Sample Presets):'
              : '💡 Or select from sample presets:'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {SAMPLE_POSTERS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPosterBokeoImageUrl(sample.url)}
                className={`relative group overflow-hidden border p-1 text-left transition cursor-pointer ${
                  posterBokeoImageUrl === sample.url
                    ? 'border-[#cc0000] ring-2 ring-[#cc0000]/20 bg-red-50 dark:bg-red-950/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                <img
                  src={sample.url}
                  alt={sample.name}
                  className="w-full h-16 object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block truncate mt-1 px-1">
                  {sample.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Poster Background & Appearance Customization matching announcement features */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#cc0000]" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              {language === 'lo'
                ? '2. ປັບແຕ່ງພື້ນຫຼັງ ແລະ ໂປສເຕີ (Poster Background Customization)'
                : '2. Poster Background Customization'}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {language === 'lo' ? 'ປັບຂະໜາດ ແລະ ຄວາມທຶບແສງ' : 'Height & Opacity'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Height Slider with small drag line 0 to 100 */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#cc0000]" />
                <span>{language === 'lo' ? 'ຄວາມສູງພື້ນຫຼັງ (Height):' : 'Poster Height:'}</span>
              </span>
              <span className="font-mono text-[#cc0000] text-xs font-bold">
                {bokeoPosterHeight}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={bokeoPosterHeight}
              onChange={(e) => setBokeoPosterHeight && setBokeoPosterHeight(Number(e.target.value))}
              className="w-full accent-[#cc0000] h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <button type="button" onClick={() => setBokeoPosterHeight && setBokeoPosterHeight(0)} className="hover:text-red-500 cursor-pointer">0% (ກະທັດຮັດ)</button>
              <button type="button" onClick={() => setBokeoPosterHeight && setBokeoPosterHeight(50)} className="hover:text-red-500 cursor-pointer">50% (ມາດຕະຖານ)</button>
              <button type="button" onClick={() => setBokeoPosterHeight && setBokeoPosterHeight(100)} className="hover:text-red-500 cursor-pointer">100% (ສູງສຸດ)</button>
            </div>
          </div>

          {/* Overlay Opacity Slider 0 to 100 */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-500" />
                <span>{language === 'lo' ? 'ຄວາມມືດທຶບເນື້ອຫາ / Overlay:' : 'Content Overlay Opacity:'}</span>
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                {bokeoPosterOverlayOpacity}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={bokeoPosterOverlayOpacity}
              onChange={(e) => setBokeoPosterOverlayOpacity && setBokeoPosterOverlayOpacity(Number(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <button type="button" onClick={() => setBokeoPosterOverlayOpacity && setBokeoPosterOverlayOpacity(0)} className="hover:text-emerald-500 cursor-pointer">0% (ໂປ່ງໃສ)</button>
              <button type="button" onClick={() => setBokeoPosterOverlayOpacity && setBokeoPosterOverlayOpacity(50)} className="hover:text-emerald-500 cursor-pointer">50%</button>
              <button type="button" onClick={() => setBokeoPosterOverlayOpacity && setBokeoPosterOverlayOpacity(100)} className="hover:text-emerald-500 cursor-pointer">100% (ທຶບສຸດ)</button>
            </div>
          </div>

          {/* Edge Fade Slider 0 to 100 */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>{language === 'lo' ? 'ຄວາມຈາງຂອບເທິງ-ລຸ່ມ (Edge Fade):' : 'Edge Fade Mask:'}</span>
              </span>
              <span className="font-mono text-purple-600 dark:text-purple-400 text-xs font-bold">
                {bokeoPosterEdgeFade}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={bokeoPosterEdgeFade}
              onChange={(e) => setBokeoPosterEdgeFade && setBokeoPosterEdgeFade(Number(e.target.value))}
              className="w-full accent-purple-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <button type="button" onClick={() => setBokeoPosterEdgeFade && setBokeoPosterEdgeFade(0)} className="hover:text-purple-500 cursor-pointer">0% (ຄົມຊັດ)</button>
              <button type="button" onClick={() => setBokeoPosterEdgeFade && setBokeoPosterEdgeFade(30)} className="hover:text-purple-500 cursor-pointer">30%</button>
              <button type="button" onClick={() => setBokeoPosterEdgeFade && setBokeoPosterEdgeFade(75)} className="hover:text-purple-500 cursor-pointer">75% (ຈາງມົວ)</button>
            </div>
          </div>

          {/* Background Dim / Tone Slider 0 to 100 */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'lo' ? 'ຄວາມມືດພື້ນຫຼັງ (Background Dim):' : 'Background Dim:'}</span>
              </span>
              <span className="font-mono text-amber-600 dark:text-amber-400 text-xs font-bold">
                {bokeoPosterDim}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={bokeoPosterDim}
              onChange={(e) => setBokeoPosterDim && setBokeoPosterDim(Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <button type="button" onClick={() => setBokeoPosterDim && setBokeoPosterDim(0)} className="hover:text-amber-500 cursor-pointer">0% (ສະຫວ່າງເຕັມທີ່)</button>
              <button type="button" onClick={() => setBokeoPosterDim && setBokeoPosterDim(40)} className="hover:text-amber-500 cursor-pointer">40%</button>
              <button type="button" onClick={() => setBokeoPosterDim && setBokeoPosterDim(80)} className="hover:text-amber-500 cursor-pointer">80% (ມືດ)</button>
            </div>
          </div>

          {/* Zoom / Scale Slider 40% to 250% */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-[#cc0000]" />
                <span>{language === 'lo' ? 'ຂະໜາດຮູບ / ຊູມ (Zoom & Scale):' : 'Zoom & Scale:'}</span>
              </span>
              <span className="font-mono text-[#cc0000] text-xs font-bold">
                {bokeoPosterScale}%
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="250"
              step="5"
              value={bokeoPosterScale}
              onChange={(e) => setBokeoPosterScale && setBokeoPosterScale(Number(e.target.value))}
              className="w-full accent-[#cc0000] h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex items-center justify-between gap-1 pt-0.5">
              {[
                { val: 60, label: '60%' },
                { val: 100, label: '100%' },
                { val: 140, label: '140%' },
                { val: 180, label: '180%' },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setBokeoPosterScale && setBokeoPosterScale(p.val)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition border cursor-pointer ${
                    bokeoPosterScale === p.val
                      ? 'bg-[#cc0000] text-white border-[#cc0000]'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fit Mode & Reset Controls */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>{language === 'lo' ? 'ຮູບແບບການປັບຮູບ (Fit Mode):' : 'Fit Mode:'}</span>
              <button
                type="button"
                onClick={() => {
                  if (setBokeoPosterPosition) setBokeoPosterPosition('50% 50%');
                  if (setBokeoPosterScale) setBokeoPosterScale(100);
                  if (setBokeoPosterFit) setBokeoPosterFit('cover');
                }}
                className="text-[10px] text-slate-500 hover:text-[#cc0000] dark:hover:text-red-400 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'lo' ? 'ຣີເຊັດ' : 'Reset'}</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 pt-1">
              {[
                { id: 'cover', label: 'Cover' },
                { id: 'contain', label: 'Contain' },
                { id: 'fill', label: 'Fill' },
                { id: 'scale-down', label: 'Scale' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setBokeoPosterFit && setBokeoPosterFit(m.id as any)}
                  className={`py-1 rounded text-[10px] font-bold transition border cursor-pointer ${
                    bokeoPosterFit === m.id
                      ? 'bg-[#cc0000] text-white border-[#cc0000]'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Titles & Descriptions with Language Tabs */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#cc0000]" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              {language === 'lo'
                ? '3. ຫົວຂໍ້ ແລະ ເນື້ອຫາ (Title & Description)'
                : '3. Title & Description'}
            </h3>
          </div>

          {/* Language Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            {(['lo', 'th', 'en'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveLangTab(lang)}
                className={`px-3 py-1 text-xs font-black rounded-md transition cursor-pointer ${
                  activeLangTab === lang
                    ? 'bg-[#cc0000] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {lang === 'lo' ? 'La' : lang === 'th' ? 'Tha' : 'En'}
              </button>
            ))}
          </div>
        </div>

        {/* Title Input */}
        <div className="space-y-1">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
            {language === 'lo'
              ? `ຫົວຂໍ້ໂພສເຕີ (${activeLangTab.toUpperCase()})`
              : `Poster Title (${activeLangTab.toUpperCase()})`}
          </label>
          {activeLangTab === 'lo' && (
            <input
              type="text"
              value={posterBokeoTitle}
              onChange={(e) => setPosterBokeoTitle(e.target.value)}
              placeholder="HOPE BOKEO - ແຂວງບໍ່ແກ້ວ"
              className="w-full border border-slate-300 dark:border-slate-600 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-[#cc0000]"
            />
          )}
          {activeLangTab === 'en' && (
            <input
              type="text"
              value={posterBokeoTitleEn}
              onChange={(e) => setPosterBokeoTitleEn(e.target.value)}
              placeholder="HOPE BOKEO - Bokeo Province"
              className="w-full border border-slate-300 dark:border-slate-600 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-[#cc0000]"
            />
          )}
          {activeLangTab === 'th' && (
            <input
              type="text"
              value={posterBokeoTitleTh}
              onChange={(e) => setPosterBokeoTitleTh(e.target.value)}
              placeholder="HOPE BOKEO - แขวงบ่อแก้ว"
              className="w-full border border-slate-300 dark:border-slate-600 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-[#cc0000]"
            />
          )}
        </div>

        {/* Description Rich Text Editor */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
              {language === 'lo'
                ? `ເນື້ອຫາ / ປະຫວັດຄວາມເປັນມາ (${activeLangTab.toUpperCase()})`
                : `Description & Story (${activeLangTab.toUpperCase()})`}
            </label>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
              {language === 'lo'
                ? '✨ ຮອງຮັບການກອບປີລົງແຖວ, ຫົວຂໍ້, ຕົວໜາ ຈາກ Word'
                : '✨ Supports rich text & Word pasting'}
            </span>
          </div>

          <RichTextEditor
            value={currentDesc}
            onChange={handleDescChange}
            language={language}
            placeholder={
              activeLangTab === 'lo'
                ? 'ພິມ ຫຼື ວາງຂໍ້ຄວາມແນະນຳໂຄງການ ໂຮບ ບໍ່ແກ້ວ ທີ່ນີ້...'
                : activeLangTab === 'th'
                ? 'พิมพ์หรือวางข้อความแนะนำโครงการ โฮป บ่อแก้ว ที่นี่...'
                : 'Type or paste overview description here...'
            }
            minHeight="180px"
          />
        </div>

        {/* Ministry Origin & Timeline Manager */}
        {setBokeoTimeline && (
          <div className="pt-2">
            <MinistryTimelineManager
              timeline={bokeoTimeline || []}
              onChangeTimeline={setBokeoTimeline}
              language={language}
              timelineTitle={bokeoTimelineTitle}
              onChangeTimelineTitle={setBokeoTimelineTitle}
              timelineTitleEn={bokeoTimelineTitleEn}
              onChangeTimelineTitleEn={setBokeoTimelineTitleEn}
              timelineTitleTh={bokeoTimelineTitleTh}
              onChangeTimelineTitleTh={setBokeoTimelineTitleTh}
              hideTimeline={hideBokeoTimeline}
              onToggleHideTimeline={setHideBokeoTimeline}
            />
          </div>
        )}

        {/* Bottom Save Button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#cc0000] hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {language === 'lo'
                ? 'ບັນທຶກຂໍ້ມູນທັງໝົດ'
                : language === 'th'
                ? 'บันทึกข้อมูลทั้งหมด'
                : 'Save All Changes'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
