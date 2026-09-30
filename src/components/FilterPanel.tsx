import React from 'react';
import {
  Filter,
  RotateCcw,
  Calendar,
  MapPin,
  Building2,
  Church,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Village, Language } from '../types';
import { getLocalizedDistrict, getLocalizedProvince, getLocalizedVillageName } from '../utils/localization';

export type TimeRange = 'all' | 'week' | 'month' | 'year' | 'custom';

interface FilterPanelProps {
  villages: Village[];
  selectedProvince: string;
  setSelectedProvince: (p: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (d: string) => void;
  selectedChurch: string;
  setSelectedChurch: (c: string) => void;
  selectedStatus: string;
  setSelectedStatus: (s: string) => void;
  selectedTimeRange: TimeRange;
  setSelectedTimeRange: (t: TimeRange) => void;
  startDate?: string;
  setStartDate?: (d: string) => void;
  endDate?: string;
  setEndDate?: (d: string) => void;
  onResetFilters: () => void;
  language: Language;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  villages,
  selectedProvince,
  setSelectedProvince,
  selectedDistrict,
  setSelectedDistrict,
  selectedChurch,
  setSelectedChurch,
  selectedStatus,
  setSelectedStatus,
  selectedTimeRange,
  setSelectedTimeRange,
  startDate = '',
  setStartDate,
  endDate = '',
  setEndDate,
  onResetFilters,
  language,
}) => {
  // Extract unique provinces
  const provinces: string[] = Array.from(
    new Set(villages.map((v) => v.province).filter((p): p is string => Boolean(p)))
  );

  // Extract unique districts based on selected province
  const filteredForDistricts =
    selectedProvince === 'all'
      ? villages
      : villages.filter((v) => v.province === selectedProvince);

  const districts: string[] = Array.from(
    new Set(filteredForDistricts.map((v) => v.district).filter((d): d is string => Boolean(d)))
  );

  // Extract unique village/church names based on selected province and district
  const filteredForChurches = filteredForDistricts.filter(
    (v) => selectedDistrict === 'all' || v.district === selectedDistrict
  );

  const churches: string[] = Array.from(
    new Set(filteredForChurches.map((v) => v.name).filter((n): n is string => Boolean(n)))
  );

  // Calculate active filter count
  const isFiltered =
    selectedProvince !== 'all' ||
    selectedDistrict !== 'all' ||
    selectedChurch !== 'all' ||
    selectedStatus !== 'all' ||
    selectedTimeRange !== 'all' ||
    Boolean(startDate) ||
    Boolean(endDate);

  return (
    <div className="bg-white dark:bg-slate-800 p-2 sm:p-3 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm mb-3 sm:mb-4 space-y-2">
      {/* Header with Title & Reset Button */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-none bg-red-50 dark:bg-red-950/50 text-[#cc0000]">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <h2 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-white">
            {language === 'lo'
              ? 'ຕົວກັ່ນຕອງຂໍ້ມູນ (Filter Data)'
              : language === 'th'
              ? 'ตัวกรองข้อมูล (Filter Data)'
              : 'Filter Data'}
          </h2>
        </div>

        {isFiltered && (
          <button
            onClick={onResetFilters}
            className="px-2.5 py-1 text-[11px] text-[#cc0000] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-none font-bold transition flex items-center gap-1 cursor-pointer border border-red-200 dark:border-red-900/50 shadow-xs"
            title={language === 'lo' ? 'ລ້າງຕົວກັ່ນຕອງທັງໝົດ' : 'Reset all filters'}
          >
            <RotateCcw className="w-3 h-3" />
            <span>{language === 'lo' ? 'ລ້າງຄ່າຕົວກັ່ນຕອງ' : 'Reset Filters'}</span>
          </button>
        )}
      </div>

      {/* Main Filter Dropdowns: 1 Single Compact Row From Left to Right */}
      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 pt-0.5">
        {/* 1. Time Range Filter */}
        <div className="flex-1 min-w-[130px] shrink-0 space-y-0.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#cc0000]" />
            <span className="truncate">{language === 'lo' ? 'ກອບເວລາ (Period)' : 'Time Period'}</span>
          </label>
          <select
            value={selectedTimeRange}
            onChange={(e) => {
              const val = e.target.value as TimeRange;
              setSelectedTimeRange(val);
              if (val === 'custom' && setStartDate && setEndDate) {
                const today = new Date().toISOString().split('T')[0];
                if (!startDate) setStartDate(today);
                if (!endDate) setEndDate(today);
              }
            }}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none px-2 py-1 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-[#cc0000] h-7"
          >
            <option value="all">🕒 {language === 'lo' ? 'ທຸກເວລາ (All)' : 'All Time'}</option>
            <option value="week">📅 {language === 'lo' ? 'ອາທິດນີ້' : 'This Week'}</option>
            <option value="month">📆 {language === 'lo' ? 'ເດືອນນີ້' : 'This Month'}</option>
            <option value="year">🗓️ {language === 'lo' ? 'ປີນີ້' : 'This Year'}</option>
            <option value="custom">📅 {language === 'lo' ? 'ກຳນົດເອງ' : 'Custom'}</option>
          </select>
        </div>

        {/* 2. Province Filter */}
        <div className="flex-1 min-w-[130px] shrink-0 space-y-0.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#cc0000]" />
            <span className="truncate">{language === 'lo' ? 'ແຂວງ (Province)' : 'Province'}</span>
          </label>
          <select
            value={selectedProvince}
            onChange={(e) => {
              setSelectedProvince(e.target.value);
              setSelectedDistrict('all');
              setSelectedChurch('all');
            }}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none px-2 py-1 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-[#cc0000] h-7"
          >
            <option value="all">🌐 {language === 'lo' ? 'ທຸກແຂວງ (All)' : 'All Provinces'}</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {getLocalizedProvince(p, language)}
              </option>
            ))}
          </select>
        </div>

        {/* 3. District Filter */}
        <div className="flex-1 min-w-[130px] shrink-0 space-y-0.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-amber-500" />
            <span className="truncate">{language === 'lo' ? 'ເມືອງ (District)' : 'District'}</span>
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
              setSelectedChurch('all');
            }}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none px-2 py-1 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-[#cc0000] h-7"
          >
            <option value="all">📍 {language === 'lo' ? 'ທຸກເມືອງ (All)' : 'All Districts'}</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {getLocalizedDistrict(d, language)}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Church / Village Filter */}
        <div className="flex-1 min-w-[130px] shrink-0 space-y-0.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Church className="w-3 h-3 text-emerald-500" />
            <span className="truncate">{language === 'lo' ? 'ບ້ານ/ຄຣິດຕະຈັກ' : 'Church/Village'}</span>
          </label>
          <select
            value={selectedChurch}
            onChange={(e) => setSelectedChurch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none px-2 py-1 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-[#cc0000] h-7"
          >
            <option value="all">⛪ {language === 'lo' ? 'ທຸກບ້ານ/ຄຣິດຕະຈັກ' : 'All Churches'}</option>
            {churches.map((c) => {
              const matchVillage = villages.find((v) => v.name === c);
              const displayName = matchVillage ? getLocalizedVillageName(matchVillage, language) : c;
              return (
                <option key={c} value={c}>
                  {displayName}
                </option>
              );
            })}
          </select>
        </div>

        {/* 5. Persecution Status Filter */}
        <div className="flex-1 min-w-[130px] shrink-0 space-y-0.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-indigo-500" />
            <span className="truncate">{language === 'lo' ? 'ສະຖານະ (Status)' : 'Status'}</span>
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none px-2 py-1 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-[#cc0000] h-7"
          >
            <option value="all">🚦 {language === 'lo' ? 'ທຸກສະຖານະ (All)' : 'All Statuses'}</option>
            <option value="ປົກກະຕິ">🟢 {language === 'lo' ? 'ປົກກະຕິ' : 'Normal'}</option>
            <option value="ປານກາງ">🟡 {language === 'lo' ? 'ປານກາງ' : 'Moderate'}</option>
            <option value="ວິກິດ">🔴 {language === 'lo' ? 'ວິກິດ' : 'Urgent'}</option>
          </select>
        </div>
      </div>

      {/* Custom Date Range Picker when selectedTimeRange === 'custom' */}
      <AnimatePresence>
        {selectedTimeRange === 'custom' && setStartDate && setEndDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50/70 dark:bg-red-950/30 p-3 rounded-none border border-red-200 dark:border-red-900 flex flex-wrap items-center gap-3"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#cc0000] dark:text-red-400">
              <CalendarDays className="w-4 h-4" />
              <span>{language === 'lo' ? 'ເລືອກວັນທີ:' : 'Select Dates:'}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#cc0000]"
              />
              <span className="text-xs text-slate-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#cc0000]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
