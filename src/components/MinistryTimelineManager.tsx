import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  MoveUp,
  MoveDown,
  Image as ImageIcon,
  Save,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  Compass,
} from 'lucide-react';
import { MinistryTimelineItem, Language } from '../types';
import { UnifiedMediaUploader } from './UnifiedMediaUploader';
import { DEFAULT_BOKEO_TIMELINE } from '../data/timelineDefaults';

interface MinistryTimelineManagerProps {
  timeline: MinistryTimelineItem[];
  onChangeTimeline: (items: MinistryTimelineItem[]) => void;
  language: Language;
  timelineTitle?: string;
  onChangeTimelineTitle?: (val: string) => void;
  timelineTitleEn?: string;
  onChangeTimelineTitleEn?: (val: string) => void;
  timelineTitleTh?: string;
  onChangeTimelineTitleTh?: (val: string) => void;
  hideTimeline?: boolean;
  onToggleHideTimeline?: (hide: boolean) => void;
}

export const MinistryTimelineManager: React.FC<MinistryTimelineManagerProps> = ({
  timeline,
  onChangeTimeline,
  language,
  timelineTitle = 'ຈຸດເລີ່ມຕົ້ນ ແລະ ການເດີນທາງຂອງພັນທະກິດ',
  onChangeTimelineTitle,
  timelineTitleEn = 'Story timeline',
  onChangeTimelineTitleEn,
  timelineTitleTh = 'จุดเริ่มต้นและการเดินทางของพันธกิจ',
  onChangeTimelineTitleTh,
  hideTimeline = false,
  onToggleHideTimeline,
}) => {
  const [editingItem, setEditingItem] = useState<MinistryTimelineItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [langTab, setLangTab] = useState<'lo' | 'en' | 'th'>(
    language === 'en' ? 'en' : language === 'th' ? 'th' : 'lo'
  );
  const [timelineTitleLang, setTimelineTitleLang] = useState<'la' | 'tha' | 'en'>('la');
  const [showImageUploadModal, setShowImageUploadModal] = useState<boolean>(false);

  // Handle adding new milestone
  const handleStartCreate = () => {
    const newItem: MinistryTimelineItem = {
      id: `timeline-${Date.now()}`,
      year: new Date().getFullYear().toString(),
      date: '',
      title: '',
      titleEn: '',
      titleTh: '',
      description: '',
      descriptionEn: '',
      descriptionTh: '',
      imageUrl: '',
      imageUrls: [],
      order: (timeline?.length || 0) + 1,
    };
    setEditingItem(newItem);
    setIsCreatingNew(true);
  };

  // Handle start editing existing item
  const handleStartEdit = (item: MinistryTimelineItem) => {
    setEditingItem({
      ...item,
      imageUrls: Array.isArray(item.imageUrls) ? [...item.imageUrls] : item.imageUrl ? [item.imageUrl] : [],
    });
    setIsCreatingNew(false);
  };

  // Save current editing item
  const handleSaveItem = () => {
    if (!editingItem) return;

    if (!editingItem.year.trim()) {
      alert(language === 'lo' ? 'ກະລຸນາໃສ່ປີ (Year)' : 'Please enter the year');
      return;
    }

    const firstImage = editingItem.imageUrls && editingItem.imageUrls.length > 0
      ? editingItem.imageUrls[0]
      : editingItem.imageUrl || '';

    const finalizedItem: MinistryTimelineItem = {
      ...editingItem,
      imageUrl: firstImage,
    };

    let updatedList: MinistryTimelineItem[];
    if (isCreatingNew) {
      updatedList = [...(timeline || []), finalizedItem];
    } else {
      updatedList = (timeline || []).map((t) => (t.id === finalizedItem.id ? finalizedItem : t));
    }

    onChangeTimeline(updatedList);
    setEditingItem(null);
    setIsCreatingNew(false);
  };

  // Delete milestone
  const handleDeleteItem = (id: string) => {
    const confirmMsg =
      language === 'lo'
        ? 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບເຫດການທາມລາຍນີ້?'
        : language === 'th'
        ? 'คุณแน่ใจหรือไม่ว่าต้องการลบเหตุการณ์ไทม์ไลน์นี้?'
        : 'Are you sure you want to delete this timeline milestone?';
    if (window.confirm(confirmMsg)) {
      const updated = (timeline || []).filter((t) => t.id !== id);
      onChangeTimeline(updated);
      if (editingItem && editingItem.id === id) {
        setEditingItem(null);
      }
    }
  };

  // Move item up or down
  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!timeline) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= timeline.length) return;

    const list = [...timeline];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // re-assign order
    const reordered = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    onChangeTimeline(reordered);
  };

  // Reset to default sample timeline
  const handleResetToDefault = () => {
    const confirmMsg =
      language === 'lo'
        ? 'ທ່ານຕ້ອງການໂຫຼດຂໍ້ມູນຕົວຢ່າງເສັ້ນທາມລາຍ HOPE BOKEO ເລີ່ມຕົ້ນບໍ່?'
        : 'Do you want to reset and load the default HOPE BOKEO timeline?';
    if (window.confirm(confirmMsg)) {
      onChangeTimeline(DEFAULT_BOKEO_TIMELINE);
    }
  };

  // Add image to editing item
  const handleAddImage = (url: string) => {
    if (!editingItem || !url.trim()) return;
    const currentImages = editingItem.imageUrls ? [...editingItem.imageUrls] : [];
    if (!currentImages.includes(url.trim())) {
      currentImages.push(url.trim());
    }
    setEditingItem({
      ...editingItem,
      imageUrl: currentImages[0] || '',
      imageUrls: currentImages,
    });
    setShowImageUploadModal(false);
  };

  // Remove image from editing item
  const handleRemoveImage = (indexToRemove: number) => {
    if (!editingItem || !editingItem.imageUrls) return;
    const filtered = editingItem.imageUrls.filter((_, idx) => idx !== indexToRemove);
    setEditingItem({
      ...editingItem,
      imageUrl: filtered[0] || '',
      imageUrls: filtered,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[#cc0000] font-black text-xs uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>
              {language === 'lo'
                ? 'ຈັດການເສັ້ນທາມລາຍ & ຈຸດເລີ່ມຕົ້ນ'
                : language === 'th'
                ? 'จัดการไทม์ไลน์ & จุดเริ่มต้น'
                : 'Timeline & Origin Story Manager'}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
              {language === 'lo'
                ? '⏳ ເສັ້ນທາມລາຍເລື່ອງລາວຈຸດເລີ່ມຕົ້ນຂອງພັນທະກິດ'
                : language === 'th'
                ? '⏳ เส้นไทม์ไลน์เรื่องราวจุดเริ่มต้นของพันธกิจ'
                : '⏳ Ministry Origin Story & Timeline'}
            </h3>
            {onToggleHideTimeline && (
              <button
                type="button"
                onClick={() => onToggleHideTimeline(!hideTimeline)}
                className={`p-1.5 transition rounded-xl flex items-center justify-center border shadow-xs cursor-pointer ${
                  hideTimeline
                    ? 'bg-amber-50 text-amber-600 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800 hover:bg-emerald-100'
                }`}
                title={
                  hideTimeline
                    ? (language === 'lo' ? 'ປັດຈຸບັນຖືກເຊື່ອງໄວ້ (ກົດເພື່ອສະແດງ)' : 'Currently hidden (Click to show)')
                    : (language === 'lo' ? 'ປັດຈຸບັນສະແດງຢູ່ (ກົດເພື່ອເຊື່ອງ)' : 'Currently visible (Click to hide)')
                }
              >
                {hideTimeline ? (
                  <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'lo'
              ? 'ສະແດງເສັ້ນທາມລາຍແລ່ນຈາກເທິງລົງລຸ່ມດ້ານຊ້າຍມື ພ້ອມປີ, ຫົວຂໍ້, ເນື້ອໃນ ແລະ ຮູບພາບ'
              : 'Displays a continuous vertical timeline running top-to-bottom on the far left with year, description, and images'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title={language === 'lo' ? 'ໂຫຼດຂໍ້ມູນຕົວຢ່າງ' : 'Reset to sample data'}
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">
              {language === 'lo' ? 'ໂຫຼດຂໍ້ມູນເລີ່ມຕົ້ນ' : 'Load Defaults'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleStartCreate}
            className="px-3.5 py-1.5 bg-[#cc0000] hover:bg-red-700 text-white text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {language === 'lo'
                ? '+ ເພີ່ມເຫດການໃໝ່'
                : language === 'th'
                ? '+ เพิ่มเหตุการณ์ใหม่'
                : '+ Add Milestone'}
            </span>
          </button>
        </div>
      </div>

      {/* Section Title Input (Single box with La, Tha, En buttons on top) */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 sm:p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
            {language === 'lo'
              ? 'ຫົວຂໍ້ພາກສ່ວນທາມລາຍ (Timeline Section Title)'
              : 'Timeline Section Title'}
          </label>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
            {(['la', 'tha', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setTimelineTitleLang(l)}
                className={`px-2.5 py-0.5 rounded-md text-[10.5px] font-black transition cursor-pointer ${
                  timelineTitleLang === l
                    ? 'bg-[#cc0000] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {l === 'la' ? 'La' : l === 'tha' ? 'Tha' : 'En'}
              </button>
            ))}
          </div>
        </div>
        <input
          type="text"
          value={
            timelineTitleLang === 'la'
              ? timelineTitle
              : timelineTitleLang === 'tha'
              ? timelineTitleTh
              : timelineTitleEn === 'Ministry Journey & Timeline'
              ? 'Story timeline'
              : timelineTitleEn
          }
          onChange={(e) => {
            const val = e.target.value;
            if (timelineTitleLang === 'la') {
              onChangeTimelineTitle && onChangeTimelineTitle(val);
            } else if (timelineTitleLang === 'tha') {
              onChangeTimelineTitleTh && onChangeTimelineTitleTh(val);
            } else {
              onChangeTimelineTitleEn && onChangeTimelineTitleEn(val);
            }
          }}
          placeholder={
            timelineTitleLang === 'la'
              ? 'ຈຸດເລີ່ມຕົ້ນ ແລະ ການເດີນທາງຂອງພັນທະກິດ'
              : timelineTitleLang === 'tha'
              ? 'จุดเริ่มต้นและการเดินทางของพันธกิจ'
              : 'Story timeline'
          }
          className="w-full border border-slate-300 dark:border-slate-600 px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-[#cc0000] focus:ring-1 focus:ring-[#cc0000]/40 rounded-xl"
        />
      </div>

      {/* List of Milestones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300">
          <span>
            {language === 'lo'
              ? `ລາຍການເຫດການທາມລາຍທັງໝົດ (${timeline?.length || 0})`
              : `All Timeline Milestones (${timeline?.length || 0})`}
          </span>
          <span className="text-[11px] text-slate-500 font-normal">
            {language === 'lo'
              ? '💡 ສາມາດກົດຂຶ້ນ-ລົງ ເພື່ອຈັດລຳດັບການສະແດງຜົນ'
              : 'Use Up/Down to reorder milestones'}
          </span>
        </div>

        {(!timeline || timeline.length === 0) ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500 text-xs space-y-3">
            <p>
              {language === 'lo'
                ? 'ຍັງບໍ່ມີຂໍ້ມູນເສັ້ນທາມລາຍເທື່ອ'
                : 'No timeline milestones added yet'}
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-sm hover:bg-slate-200"
              >
                {language === 'lo' ? 'ໂຫຼດຂໍ້ມູນເລີ່ມຕົ້ນ' : 'Load Default Hope Bokeo Milestones'}
              </button>
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-3.5 py-1.5 bg-[#cc0000] text-white text-xs font-bold rounded-sm hover:bg-red-700"
              >
                {language === 'lo' ? '+ ເພີ່ມເຫດການໃໝ່' : '+ Add Milestone'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {timeline.map((item, index) => {
              const displayTitle = item.title || item.titleEn || item.titleTh || 'ບໍ່ມີຫົວຂໍ້ (No Title)';
              const displayYear = item.year || 'N/A';
              const imageCount = (item.imageUrls?.length || 0) + (item.imageUrl && !item.imageUrls?.includes(item.imageUrl) ? 1 : 0);
              const previewImg = item.imageUrl || (item.imageUrls && item.imageUrls[0]) || '';

              return (
                <div
                  key={item.id || index}
                  className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 p-3.5 sm:p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-red-300 dark:hover:border-red-900 transition"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    {/* Far left year node icon */}
                    <div className="w-12 sm:w-16 h-12 bg-white dark:bg-slate-800 border-2 border-[#cc0000] rounded-lg shadow-2xs flex flex-col items-center justify-center shrink-0 p-1">
                      <span className="text-[9px] font-bold text-red-600 uppercase">ປີ/Year</span>
                      <span className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[58px]">
                        {displayYear}
                      </span>
                    </div>

                    {/* Image thumbnail if available */}
                    {previewImg ? (
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-300 dark:border-slate-600">
                        <img
                          src={previewImg}
                          alt={displayTitle}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-5 h-5 opacity-40" />
                      </div>
                    )}

                    {/* Information preview */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white truncate">
                          {displayTitle}
                        </h4>
                        {item.date && (
                          <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-medium">
                            {item.date}
                          </span>
                        )}
                        {imageCount > 0 && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            🖼️ {imageCount} {imageCount === 1 ? 'ຮູບ' : 'ຮູບພາບ'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {item.description || item.descriptionEn || item.descriptionTh || 'ບໍ່ມີເນື້ອໃນ'}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Reorder, Edit, Delete */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 transition cursor-pointer"
                      title="Move Up"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === timeline.length - 1}
                      className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 transition cursor-pointer"
                      title="Move Down"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-bold rounded flex items-center gap-1 transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{language === 'lo' ? 'ແກ້ໄຂ' : 'Edit'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 rounded transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit / Create Milestone Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/80 text-[#cc0000] flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white">
                    {isCreatingNew
                      ? language === 'lo'
                        ? '+ ເພີ່ມເຫດການທາມລາຍໃໝ່'
                        : '+ Add Timeline Milestone'
                      : language === 'lo'
                      ? 'ແກ້ໄຂເຫດການທາມລາຍ'
                      : 'Edit Timeline Milestone'}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {language === 'lo'
                      ? 'ກຳນົດປີ, ຫົວຂໍ້, ເນື້ອໃນເລື່ອງລາວ ແລະ ຮູບພາບ'
                      : 'Define year, title, story description, and photos'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Year and Date row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'lo' ? 'ປີ (Year) *' : 'Year *'}
                  </label>
                  <input
                    type="text"
                    value={editingItem.year}
                    onChange={(e) => setEditingItem({ ...editingItem, year: e.target.value })}
                    placeholder="e.g. 2018 ຫຼື 2018 - 2019"
                    className="w-full border border-slate-300 dark:border-slate-600 px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-[#cc0000] rounded-sm font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {language === 'lo'
                      ? 'ຕົວຢ່າງ: 2018, 2020 - 2021, 2024 - ປັດຈຸບັນ'
                      : 'Examples: 2018, 2020-2021, 2024 - Present'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'lo' ? 'ໄລຍະເວລາ / ວັນທີ (Period / Date)' : 'Period / Date (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={editingItem.date || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                    placeholder="e.g. ມັງກອນ 2018 ຫຼື Q1 2018"
                    className="w-full border border-slate-300 dark:border-slate-600 px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-[#cc0000] rounded-sm"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {language === 'lo' ? 'ໃສ່ ຫຼື ປະຫວ່າງໄວ້ກໍໄດ້' : 'Optional supplementary date'}
                  </span>
                </div>
              </div>

              {/* Multilingual Tabs */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-slate-700 dark:text-slate-300">
                    {language === 'lo' ? 'ຫົວຂໍ້ ແລະ ເນື້ອໃນຕາມພາສາ' : 'Title & Content by Language'}
                  </span>
                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => setLangTab('lo')}
                      className={`px-3 py-1 text-[11px] font-black rounded-md transition cursor-pointer ${
                        langTab === 'lo'
                          ? 'bg-[#cc0000] text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      La
                    </button>
                    <button
                      type="button"
                      onClick={() => setLangTab('th')}
                      className={`px-3 py-1 text-[11px] font-black rounded-md transition cursor-pointer ${
                        langTab === 'th'
                          ? 'bg-[#cc0000] text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      Tha
                    </button>
                    <button
                      type="button"
                      onClick={() => setLangTab('en')}
                      className={`px-3 py-1 text-[11px] font-black rounded-md transition cursor-pointer ${
                        langTab === 'en'
                          ? 'bg-[#cc0000] text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      En
                    </button>
                  </div>
                </div>

                {/* Title by Language */}
                <div className="space-y-1 mb-3">
                  <label className="block font-bold text-slate-600 dark:text-slate-400">
                    {language === 'lo'
                      ? `ຫົວຂໍ້ເຫດການ (${langTab.toUpperCase()})`
                      : `Milestone Title (${langTab.toUpperCase()})`}
                  </label>
                  {langTab === 'lo' && (
                    <input
                      type="text"
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                      placeholder="e.g. ຈຸດເລີ່ມຕົ້ນແຫ່ງການຊົງເອີ້ນ ແລະ ພາລະໃຈ"
                      className="w-full border border-slate-300 dark:border-slate-600 px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-[#cc0000] rounded-sm"
                    />
                  )}
                  {langTab === 'en' && (
                    <input
                      type="text"
                      value={editingItem.titleEn || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, titleEn: e.target.value })}
                      placeholder="e.g. The Calling & Beginning of Hope Bokeo"
                      className="w-full border border-slate-300 dark:border-slate-600 px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-[#cc0000] rounded-sm"
                    />
                  )}
                  {langTab === 'th' && (
                    <input
                      type="text"
                      value={editingItem.titleTh || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, titleTh: e.target.value })}
                      placeholder="e.g. จุดเริ่มต้นแห่งการทรงเรียกและภาระใจ"
                      className="w-full border border-slate-300 dark:border-slate-600 px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-[#cc0000] rounded-sm"
                    />
                  )}
                </div>

                {/* Description by Language */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-400">
                    {language === 'lo'
                      ? `ເນື້ອຫາ / ລາຍລະອຽດເລື່ອງລາວ (${langTab.toUpperCase()})`
                      : `Description & Story Narrative (${langTab.toUpperCase()})`}
                  </label>
                  {langTab === 'lo' && (
                    <textarea
                      rows={4}
                      value={editingItem.description}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      placeholder="ພິມເລື່ອງລາວຈຸດເລີ່ມຕົ້ນ, ການເດີນທາງ, ຫຼື ເຫດການສຳຄັນໃນປີນັ້ນ..."
                      className="w-full border border-slate-300 dark:border-slate-600 p-3 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-[#cc0000] rounded-sm leading-relaxed"
                    />
                  )}
                  {langTab === 'en' && (
                    <textarea
                      rows={4}
                      value={editingItem.descriptionEn || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, descriptionEn: e.target.value })}
                      placeholder="Describe the milestone, events, outreach operations, or ministry developments..."
                      className="w-full border border-slate-300 dark:border-slate-600 p-3 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-[#cc0000] rounded-sm leading-relaxed"
                    />
                  )}
                  {langTab === 'th' && (
                    <textarea
                      rows={4}
                      value={editingItem.descriptionTh || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, descriptionTh: e.target.value })}
                      placeholder="พิมพ์รายละเอียดเรื่องราว การเดินทาง หรือเหตุการณ์สำคัญในปีนั้น..."
                      className="w-full border border-slate-300 dark:border-slate-600 p-3 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-[#cc0000] rounded-sm leading-relaxed"
                    />
                  )}
                </div>
              </div>

              {/* Photos & Images Section */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-black text-slate-700 dark:text-slate-300">
                    {language === 'lo' ? 'ຮູບພາບປະກອບເຫດການ (Photos / Images)' : 'Milestone Photos'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowImageUploadModal(true)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'lo' ? 'ເພີ່ມຮູບພາບ' : 'Add Photo'}</span>
                  </button>
                </div>

                {/* Display current photos */}
                {editingItem.imageUrls && editingItem.imageUrls.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {editingItem.imageUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 aspect-4/3 bg-slate-100 dark:bg-slate-800 group"
                      >
                        <img
                          src={url}
                          alt={`Milestone photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-80 group-hover:opacity-100 transition cursor-pointer shadow-sm"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => setShowImageUploadModal(true)}
                    className="p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-slate-500"
                  >
                    <ImageIcon className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                    <span>
                      {language === 'lo'
                        ? 'ຄລິກເພື່ອອັບໂຫຼດ ຫຼື ໃສ່ລິ້ງຮູບພາບ'
                        : 'Click to upload or enter image URL'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                className="px-5 py-2 bg-[#cc0000] hover:bg-red-700 text-white text-xs font-black rounded shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'lo' ? 'ຕົກລົງ / ບັນທຶກ' : 'Done & Apply'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Uploader Submodal */}
      {showImageUploadModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#cc0000]" />
                <span>
                  {language === 'lo'
                    ? 'ອັບໂຫຼດຮູບພາບປະກອບທາມລາຍ'
                    : 'Add Timeline Photo'}
                </span>
              </h4>
              <button
                type="button"
                onClick={() => setShowImageUploadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <UnifiedMediaUploader
              value=""
              onChange={(url) => {
                handleAddImage(url);
                setShowImageUploadModal(false);
              }}
              language={language}
              label={language === 'lo' ? 'ເລືອກຮູບພາບ ຫຼື ວ່າງລິ້ງຮູບ' : 'Select image file or paste URL'}
              maxDimension={900}
              maxStringLength={70000}
            />

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowImageUploadModal(false)}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded"
              >
                {language === 'lo' ? 'ປິດ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
