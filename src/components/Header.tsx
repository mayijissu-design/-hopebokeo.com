import React, { useState, useRef, useEffect } from 'react';
import { Home, PieChart as PieChartIcon, Users, Lock, Sun, Moon, Church, Menu, X, RefreshCw, Globe, Check } from 'lucide-react';
import { Language } from '../types';
import { HbLogo } from './HbLogo';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  autoThemeEnabled?: boolean;
  setAutoThemeEnabled?: (enabled: boolean) => void;
  autoThemeStart?: string;
  setAutoThemeStart?: (time: string) => void;
  autoThemeEnd?: string;
  setAutoThemeEnd?: (time: string) => void;
  isSyncing?: boolean;
  logoUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  darkMode,
  setDarkMode,
  isSyncing = false,
  logoUrl,
}) => {
  // Mobile right drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Floating Language Selector Menu State & Click-Outside Ref
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languagesList: { id: Language; label: string; flag: string; nativeName: string }[] = [
    { id: 'lo', label: 'Lao', flag: '🇱🇦', nativeName: 'ລາວ' },
    { id: 'th', label: 'Thai', flag: '🇹🇭', nativeName: 'ไทย' },
    { id: 'en', label: 'English', flag: '🇬🇧', nativeName: 'ENG' },
  ];

  const navItems = [
    {
      id: 'home',
      label: language === 'lo' ? 'ໜ້າຫຼັກ' : language === 'th' ? 'หน้าหลัก' : 'Home',
      icon: Home,
    },
    {
      id: 'dashboard',
      label: language === 'lo' ? 'ຂໍ້ມູນເຊິງເລິກ' : language === 'th' ? 'แดชบอร์ดข้อมูล' : 'Insights',
      icon: PieChartIcon,
    },
    {
      id: 'about',
      label: language === 'lo' ? 'ກ່ຽວກັບພວກເຮົາ' : language === 'th' ? 'เกี่ยวกับเรา' : 'About Us',
      icon: Users,
    },
    {
      id: 'admin',
      label: language === 'lo' ? 'ຫ້ອງແອັດມິນ' : language === 'th' ? 'ห้องผู้ดูแลระบบ' : 'Admin',
      icon: Lock,
      iconColor: 'text-amber-500',
    },
  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm transition-colors w-full">
      <div className="w-full pl-2 sm:pl-4 lg:pl-6 pr-1 sm:pr-2 lg:pr-3 h-16 flex items-center justify-between gap-2">
        {/* Logo & Title - Stable, no scale or bounce on tap */}
        <div className="flex items-center gap-2 cursor-pointer shrink-0 select-none" onClick={() => setActiveTab('home')}>
          <HbLogo logoUrl={logoUrl} className="h-9 md:h-12 w-auto text-[#ee1c25] leading-none shrink-0" />
          <div className="flex flex-col justify-center select-none">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900 dark:text-white text-sm md:text-lg leading-none tracking-wider uppercase">
                HOPE
              </span>
              {isSyncing && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-semibold animate-pulse">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                </span>
              )}
            </div>
            <span className="font-black text-[#cc0000] text-[10px] md:text-sm leading-tight tracking-widest uppercase">
              BOKEO
            </span>
          </div>
        </div>

        {/* Desktop Navigation Tabs (Hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs lg:text-sm transition whitespace-nowrap border-b-2 rounded-none ${
                  isActive
                    ? 'border-[#cc0000] text-[#cc0000] dark:text-red-400 font-black'
                    : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-[#cc0000] dark:hover:text-red-400 font-bold'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#cc0000] dark:text-red-400' : (item.iconColor || '')}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Utilities at Far Right: Language (Globe Icon Only), Theme Toggle & Mobile Menu Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Selector: Globe Icon ONLY as requested */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="w-9 h-9 rounded-none bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition shadow-xs text-slate-800 dark:text-slate-100"
              title="Change Language / ປ່ຽນພາສາ"
            >
              <Globe className="w-4 h-4 text-[#cc0000]" />
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none shadow-xl py-2 z-50 animate-fade-in divide-y divide-slate-100 dark:divide-slate-800">
                <div className="px-3.5 py-1 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                  {language === 'lo' ? 'ເລືອກພາສາ' : language === 'th' ? 'เลือกภาษา' : 'Select Language'}
                </div>
                <div className="py-1">
                  {languagesList.map((langItem) => {
                    const isSelected = language === langItem.id;
                    const langLabel = language === 'lo'
                      ? (langItem.id === 'lo' ? 'ພາສາລາວ' : langItem.id === 'th' ? 'ພາສາໄທ' : 'ພາສາອັງກິດ')
                      : language === 'th'
                      ? (langItem.id === 'lo' ? 'ภาษาลาว' : langItem.id === 'th' ? 'ภาษาไทย' : 'ภาษาอังกฤษ')
                      : (langItem.id === 'lo' ? 'Lao' : langItem.id === 'th' ? 'Thai' : 'English');

                    return (
                      <button
                        key={langItem.id}
                        onClick={() => {
                          setLanguage(langItem.id);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold transition rounded-none ${
                          isSelected
                            ? 'bg-red-50 dark:bg-red-950/40 text-[#cc0000] dark:text-red-400 font-black'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{langItem.flag}</span>
                          <span>{langLabel}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#cc0000] dark:text-red-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-9 h-9 rounded-none bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition hover:bg-slate-200 dark:hover:bg-slate-700 shadow-xs text-slate-800 dark:text-slate-100"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 dark:text-slate-200" />
            )}
          </button>

          {/* Mobile Menu Hamburger Button (3-lines) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-none bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition hover:bg-slate-200 dark:hover:bg-slate-700 shadow-xs text-slate-800 dark:text-slate-100"
            title="Menu / ເມນູ"
          >
            <Menu className="w-5 h-5 text-slate-800 dark:text-slate-200" />
          </button>
        </div>
      </div>

      {/* Mobile Right Drawer Slide-over */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Right-aligned Vertical Navigation Drawer */}
          <div className="fixed top-0 right-0 h-full w-72 bg-white dark:bg-slate-900 shadow-2xl z-50 p-5 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between md:hidden animate-fade-in transition-all rounded-none">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <HbLogo logoUrl={logoUrl} className="h-8 w-auto text-[#ee1c25]" />
                  <span className="font-extrabold text-slate-900 dark:text-white text-base">
                    {language === 'lo' ? 'ເມນູຫຼັກ' : language === 'th' ? 'เมนูหลัก' : 'Main Menu'}
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-none bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Vertical Tab Items */}
              <div className="flex flex-col gap-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-none text-sm font-bold transition text-left ${
                        isActive
                          ? 'bg-red-50 dark:bg-red-950/40 text-[#cc0000] dark:text-red-400 font-black border-l-4 border-[#cc0000]'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-[#cc0000]' : (item.iconColor || 'text-slate-500 dark:text-slate-400')}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              <p className="font-black text-slate-600 dark:text-slate-400 tracking-wider">HOPE BOKEO</p>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

