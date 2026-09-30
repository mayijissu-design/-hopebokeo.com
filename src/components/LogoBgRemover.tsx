import React, { useState, useEffect } from 'react';
import { Wand2, Check, RotateCcw, Download, Sliders, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Language } from '../types';
import { removeImageBackground, BgRemovalOptions } from '../utils/backgroundRemover';

interface LogoBgRemoverProps {
  currentLogoUrl: string;
  onApplyLogo: (newUrl: string) => void;
  language: Language;
  disabled?: boolean;
}

export const LogoBgRemover: React.FC<LogoBgRemoverProps> = ({
  currentLogoUrl,
  onApplyLogo,
  language,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalSnapshot, setOriginalSnapshot] = useState<string>('');
  const [previewResult, setPreviewResult] = useState<string>('');
  const [tolerance, setTolerance] = useState<number>(35);
  const [mode, setMode] = useState<'flood' | 'all'>('flood');
  const [hasApplied, setHasApplied] = useState(false);

  // Initialize snapshot when opening
  useEffect(() => {
    if (isOpen && currentLogoUrl && !originalSnapshot) {
      setOriginalSnapshot(currentLogoUrl);
      runRemoval(currentLogoUrl, tolerance, mode);
    }
  }, [isOpen, currentLogoUrl]);

  const runRemoval = async (src: string, tol: number, md: 'flood' | 'all') => {
    if (!src) return;
    setIsProcessing(true);
    try {
      const opts: BgRemovalOptions = {
        tolerance: tol,
        mode: md,
        feather: true,
      };
      const result = await removeImageBackground(src, opts);
      setPreviewResult(result);
    } catch (err) {
      console.error('Failed to remove background:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToleranceChange = (newTol: number) => {
    setTolerance(newTol);
    if (originalSnapshot) {
      runRemoval(originalSnapshot, newTol, mode);
    }
  };

  const handleModeChange = (newMode: 'flood' | 'all') => {
    setMode(newMode);
    if (originalSnapshot) {
      runRemoval(originalSnapshot, tolerance, newMode);
    }
  };

  const handleApply = () => {
    if (previewResult) {
      onApplyLogo(previewResult);
      setHasApplied(true);
      setTimeout(() => setHasApplied(false), 2500);
      setIsOpen(false);
    }
  };

  const handleResetOriginal = () => {
    if (originalSnapshot) {
      onApplyLogo(originalSnapshot);
      setPreviewResult(originalSnapshot);
      setOriginalSnapshot('');
      setIsOpen(false);
    }
  };

  const handleDownload = () => {
    if (!previewResult) return;
    const a = document.createElement('a');
    a.href = previewResult;
    a.download = 'hope_bokeo_logo_transparent.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!currentLogoUrl) return null;

  return (
    <div className="mt-2 border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl p-3 space-y-2.5 transition">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-600 text-white rounded-lg shadow-xs">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>{language === 'lo' ? 'ເຄື່ອງມືລຶບພື້ນຫຼັງໂລໂກ້' : 'Logo Background Remover'}</span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/70 text-purple-700 dark:text-purple-300">
                AI Magic
              </span>
            </h4>
          </div>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!isOpen) {
              setOriginalSnapshot(currentLogoUrl);
              runRemoval(currentLogoUrl, tolerance, mode);
            }
            setIsOpen(!isOpen);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
            isOpen
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-95'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>
            {isOpen
              ? language === 'lo'
                ? 'ປິດເຄື່ອງມື'
                : 'Close Tool'
              : language === 'lo'
              ? 'ລຶບພື້ນຫຼັງໂລໂກ້'
              : 'Remove Background'}
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="pt-2 border-t border-purple-200/70 dark:border-purple-900/40 space-y-3">
          {/* Controls: Mode & Tolerance Slider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {/* Mode selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-purple-500" />
                <span>{language === 'lo' ? 'ຮູບແບບການລຶບ:' : 'Removal Mode:'}</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleModeChange('flood')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer text-center ${
                    mode === 'flood'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {language === 'lo' ? 'ອັດຕະໂນມັດ (ຕິດຂອບ)' : 'Auto (Border Flood)'}
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer text-center ${
                    mode === 'all'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {language === 'lo' ? 'ລຶບສີຂາວທັງໝົດ' : 'Remove All White'}
                </button>
              </div>
              <p className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-1">
                {mode === 'flood'
                  ? language === 'lo'
                    ? '✓ ຮັກສາລວດລາຍສີຂາວພາຍໃນຕົວໜັງສື'
                    : '✓ Preserves white inside letters/icons'
                  : language === 'lo'
                  ? '✓ ລຶບທຸກຈຸດສີຂາວທົ່ວຮູບ'
                  : '✓ Erases all white pixels everywhere'}
              </p>
            </div>

            {/* Tolerance Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{language === 'lo' ? 'ຄວາມກວ້າງ/ລະອຽດ (Tolerance):' : 'Tolerance:'}</span>
                </label>
                <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400">
                  {tolerance}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="2"
                value={tolerance}
                onChange={(e) => handleToleranceChange(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                <span>{language === 'lo' ? 'ລະອຽດ (10)' : 'Tight (10)'}</span>
                <span>{language === 'lo' ? 'ມາດຕະຖານ (35)' : 'Default (35)'}</span>
                <span>{language === 'lo' ? 'ກວ້າງ (80)' : 'Broad (80)'}</span>
              </div>
            </div>
          </div>

          {/* Live Previews: Checkerboard (Transparency) vs Dark Mode (With White Outline) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Checkerboard (Pure Transparency check) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col items-center justify-between text-center min-h-[110px]">
              <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                {language === 'lo' ? '1. ພື້ນໂປ່ງໃສ (Transparent)' : '1. Transparent Grid'}
              </span>
              <div
                className="w-full h-14 rounded-lg flex items-center justify-center p-1.5"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                  backgroundSize: '12px 12px',
                  backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
                  backgroundColor: '#f8fafc',
                }}
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                ) : (
                  <img
                    src={previewResult || currentLogoUrl}
                    alt="Transparent Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>
            </div>

            {/* 2. Light Header Preview */}
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col items-center justify-between text-center min-h-[110px]">
              <span className="text-[9.5px] font-bold text-slate-500 mb-1">
                {language === 'lo' ? '2. ເທິງ Header ສີຂາວ' : '2. Light Header'}
              </span>
              <div className="w-full h-14 bg-white border border-slate-100 rounded-lg flex items-center justify-center p-1.5">
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                ) : (
                  <img
                    src={previewResult || currentLogoUrl}
                    alt="Light Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>
            </div>

            {/* 3. Dark Header Preview (With White Outline Highlight) */}
            <div className="dark dark-preview-container bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center justify-between text-center min-h-[110px]">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[9.5px] font-bold text-white">
                  {language === 'lo' ? '3. ໂໝດມືດ (ຂອບສີຂາວ)' : '3. Dark Mode (White Stroke)'}
                </span>
                <span className="text-[8px] bg-indigo-500/30 text-indigo-200 px-1 py-0.2 rounded font-bold">
                  Active
                </span>
              </div>
              <div className="w-full h-14 bg-slate-950 rounded-lg flex items-center justify-center p-1.5 border border-slate-800">
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                ) : (
                  <img
                    src={previewResult || currentLogoUrl}
                    alt="Dark Mode Outline Preview"
                    className="max-h-full max-w-full object-contain hb-logo-dark-outline"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: Apply, Undo, Download */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              {originalSnapshot && (
                <button
                  type="button"
                  onClick={handleResetOriginal}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{language === 'lo' ? 'ຟື້ນຟູຕົ້ນສະບັບ' : 'Reset Original'}</span>
                </button>
              )}
              {previewResult && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>{language === 'lo' ? 'ດາວໂຫຼດໄຟລ໌ PNG' : 'Download PNG'}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleApply}
              disabled={isProcessing || !previewResult}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>
                {hasApplied
                  ? language === 'lo'
                    ? '✓ ບັນທຶກແລ້ວ'
                    : '✓ Applied!'
                  : language === 'lo'
                  ? 'ນຳໃຊ້ໂລໂກ້ໂປ່ງໃສນີ້'
                  : 'Apply Transparent Logo'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
