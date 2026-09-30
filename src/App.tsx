import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { FilterPanel, TimeRange } from './components/FilterPanel';
import { HomeTab } from './components/HomeTab';
import { DashboardTab } from './components/DashboardTab';
import { AboutTab } from './components/AboutTab';
import { ChurchEditPortal } from './components/ChurchEditPortal';
import { AdminTab } from './components/AdminTab';
import { VillageModal } from './components/VillageModal';
import { EventModal } from './components/EventModal';
import { TeamModal } from './components/TeamModal';
import { AiAssistant } from './components/AiAssistant';
import { AutoUpdateListener } from './components/AutoUpdateListener';
import { HbLogo } from './components/HbLogo';
import { Village, EventData, TeamMember, HomePoster, DonationInfo, Language } from './types';
import { Sparkles, X, Loader2, WifiOff } from 'lucide-react';
import { db, collection, doc, onSnapshot } from './lib/firebase';
import {
  saveVillageToFirestore,
  deleteVillageFromFirestore,
  saveEventToFirestore,
  deleteEventFromFirestore,
  saveTeamToFirestore,
  deleteTeamFromFirestore,
  saveHomePosterToFirestore,
  saveDonationInfoToFirestore,
  initialDefaultData,
} from './lib/firestore-service';
import {
  getInitialActiveTab,
  persistActiveTab,
  normalizeTab,
  initScrollRestoration,
  saveCurrentTabScroll,
  getSavedTabScroll,
  restoreScrollPosition,
} from './utils/navigationState';

function safeCacheEvents(events: EventData[]) {
  try {
    const sanitized = events.map((e) => {
      const cover = e.imageUrl || (Array.isArray(e.imageUrls) ? e.imageUrls[0] : '') || '';
      return {
        ...e,
        imageUrl: cover,
        docUrl: typeof e.docUrl === 'string' && e.docUrl.startsWith('data:') && e.docUrl.length > 50000 ? '' : e.docUrl,
        docUrls: Array.isArray(e.docUrls)
          ? e.docUrls.filter((u) => typeof u === 'string' && (!u.startsWith('data:') || u.length <= 50000))
          : (e.docUrl ? [e.docUrl] : []),
        imageUrls: Array.isArray(e.imageUrls) && e.imageUrls.length > 0
          ? e.imageUrls.slice(0, 10).filter((u) => typeof u === 'string' && (!u.startsWith('data:') || u.length < 200000))
          : (cover ? [cover] : []),
        monthlyReports: Array.isArray(e.monthlyReports)
          ? e.monthlyReports.map((r) => {
              const rCover = r.imageUrl || (Array.isArray(r.imageUrls) ? r.imageUrls[0] : '') || '';
              return {
                ...r,
                imageUrl: rCover,
                docUrl: typeof r.docUrl === 'string' && r.docUrl.startsWith('data:') && r.docUrl.length > 50000 ? '' : r.docUrl,
                docUrls: Array.isArray(r.docUrls)
                  ? r.docUrls.filter((u) => typeof u === 'string' && (!u.startsWith('data:') || u.length <= 50000))
                  : (r.docUrl ? [r.docUrl] : []),
                imageUrls: Array.isArray(r.imageUrls) && r.imageUrls.length > 0
                  ? r.imageUrls.slice(0, 6).filter((u) => typeof u === 'string' && (!u.startsWith('data:') || u.length < 200000))
                  : (rCover ? [rCover] : []),
              };
            })
          : [],
      };
    });
    localStorage.setItem('hb_cached_events', JSON.stringify(sanitized));
  } catch (err) {
    console.warn('Could not cache events to localStorage:', err);
  }
}

export default function App() {
  const [activeTab, setActiveTabState] = useState<string>(() => getInitialActiveTab());

  // Function to navigate tabs while preserving scroll & history
  const setActiveTab = useCallback((newTab: string) => {
    setActiveTabState((prevTab) => {
      if (prevTab === newTab) return prevTab;
      saveCurrentTabScroll(prevTab);
      persistActiveTab(newTab, true);
      const targetScroll = getSavedTabScroll(newTab);
      restoreScrollPosition(targetScroll);
      // Auto-lock admin rooms when switching to any other tab
      if (newTab !== 'admin') {
        try {
          sessionStorage.removeItem('hb_settings_unlocked');
          localStorage.removeItem('hb_settings_unlocked');
          sessionStorage.removeItem('hb_finance_unlocked');
          localStorage.removeItem('hb_finance_unlocked');
          sessionStorage.removeItem('hb_admin_feature');
          localStorage.removeItem('hb_admin_feature');
        } catch {}
      }
      return newTab;
    });
  }, []);

  // Sync activeTab state changes to persistent storage and address bar
  useEffect(() => {
    persistActiveTab(activeTab, false);
    if (activeTab !== 'admin') {
      try {
        sessionStorage.removeItem('hb_settings_unlocked');
        localStorage.removeItem('hb_settings_unlocked');
        sessionStorage.removeItem('hb_finance_unlocked');
        localStorage.removeItem('hb_finance_unlocked');
        sessionStorage.removeItem('hb_admin_feature');
        localStorage.removeItem('hb_admin_feature');
      } catch {}
    }
  }, [activeTab]);

  // Handle browser Back & Forward buttons (popstate) and hash changes smoothly without redirecting to 'home'
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      try {
        const fromState = e.state?.tab;
        const resolved =
          normalizeTab(fromState) ||
          normalizeTab(window.location.hash) ||
          normalizeTab(window.location.pathname);
        if (resolved && resolved.tab !== activeTab) {
          saveCurrentTabScroll(activeTab);
          setActiveTabState(resolved.tab);
          persistActiveTab(resolved.tab, false);
          const targetScroll = getSavedTabScroll(resolved.tab);
          restoreScrollPosition(targetScroll);
        }
      } catch {}
    };

    const handleHashChange = () => {
      try {
        const hash = window.location.hash.replace(/^#/, '');
        const resolved = normalizeTab(hash);
        if (resolved && resolved.tab !== activeTab) {
          saveCurrentTabScroll(activeTab);
          setActiveTabState(resolved.tab);
          persistActiveTab(resolved.tab, false);
          const targetScroll = getSavedTabScroll(resolved.tab);
          restoreScrollPosition(targetScroll);
        }
      } catch {}
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [activeTab]);

  // Scroll Restoration Manager: Tracks scroll, saves on unload, restores on mount
  useEffect(() => {
    const cleanupScroll = initScrollRestoration();

    const handleBeforeUnload = () => {
      saveCurrentTabScroll(activeTab);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    let scrollRaf: number | null = null;
    const handleScroll = () => {
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(() => {
        saveCurrentTabScroll(activeTab);
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Restore saved scroll position on initial load
    const savedPos = getSavedTabScroll(activeTab);
    let cancelRestore: (() => void) | null = null;
    if (savedPos > 0) {
      cancelRestore = restoreScrollPosition(savedPos);
    }

    return () => {
      cleanupScroll();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      window.removeEventListener('scroll', handleScroll);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      if (cancelRestore) cancelRestore();
    };
  }, [activeTab]);
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('hb_language');
      if (saved === 'lo' || saved === 'en' || saved === 'th') {
        return saved as Language;
      }
    } catch {
      // fallback
    }
    return 'lo';
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('hb_dark_mode');
      if (saved !== null) {
        return saved === 'true';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Auto-scheduled Theme Mode State & Schedule Settings
  const [autoThemeEnabled, setAutoThemeEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hb_auto_theme_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [autoThemeStart, setAutoThemeStart] = useState<string>(() => {
    try {
      return localStorage.getItem('hb_auto_theme_start') || '18:00';
    } catch {
      return '18:00';
    }
  });
  const [autoThemeEnd, setAutoThemeEnd] = useState<string>(() => {
    try {
      return localStorage.getItem('hb_auto_theme_end') || '06:00';
    } catch {
      return '06:00';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('hb_auto_theme_enabled', String(autoThemeEnabled));
    } catch {}
  }, [autoThemeEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('hb_auto_theme_start', autoThemeStart);
    } catch {}
  }, [autoThemeStart]);

  useEffect(() => {
    try {
      localStorage.setItem('hb_auto_theme_end', autoThemeEnd);
    } catch {}
  }, [autoThemeEnd]);

  const checkScheduledTheme = useCallback(() => {
    if (!autoThemeEnabled) return;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = autoThemeStart.split(':').map(Number);
    const [endH, endM] = autoThemeEnd.split(':').map(Number);

    const startMinutes = (isNaN(startH) ? 18 : startH) * 60 + (isNaN(startM) ? 0 : startM);
    const endMinutes = (isNaN(endH) ? 6 : endH) * 60 + (isNaN(endM) ? 0 : endM);

    let shouldBeDark = false;
    if (startMinutes > endMinutes) {
      // Overnight range e.g. 18:00 to 06:00
      shouldBeDark = currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      // Same-day range e.g. 08:00 to 18:00
      shouldBeDark = currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    setDarkMode((prev) => (prev !== shouldBeDark ? shouldBeDark : prev));
  }, [autoThemeEnabled, autoThemeStart, autoThemeEnd]);

  useEffect(() => {
    if (autoThemeEnabled) {
      checkScheduledTheme();
      const interval = setInterval(checkScheduledTheme, 10000);
      return () => clearInterval(interval);
    }
  }, [autoThemeEnabled, checkScheduledTheme]);

  useEffect(() => {
    try {
      localStorage.setItem('hb_language', language);
    } catch {
      // ignore
    }
  }, [language]);

  // Data State with Instant Multi-Layer Local Storage Cache & Baseline Hydration
  const [villages, setVillages] = useState<Village[]>(() => {
    try {
      const cached = localStorage.getItem('hb_cached_villages');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return (initialDefaultData?.villages as Village[]) || [];
  });
  const [events, setEvents] = useState<EventData[]>(() => {
    try {
      const cached = localStorage.getItem('hb_cached_events');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return (initialDefaultData?.events as EventData[]) || [];
  });
  const [teams, setTeams] = useState<TeamMember[]>(() => {
    try {
      const cached = localStorage.getItem('hb_cached_teams');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return (initialDefaultData?.teams as TeamMember[]) || [];
  });
  const [homePoster, setHomePoster] = useState<HomePoster | undefined>(() => {
    try {
      const cached = localStorage.getItem('hb_cached_home_poster');
      if (cached) return JSON.parse(cached);
    } catch {}
    return (initialDefaultData?.homePoster as HomePoster) || undefined;
  });
  const [donationInfo, setDonationInfo] = useState<DonationInfo | undefined>(() => {
    try {
      const cached = localStorage.getItem('hb_cached_donation_info');
      if (cached) return JSON.parse(cached);
    } catch {}
    return (initialDefaultData?.donationInfo as DonationInfo) || undefined;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Re-restore scroll position once ministry data finishes loading and lists render
  useEffect(() => {
    if (!isLoading) {
      const savedPos = getSavedTabScroll(activeTab);
      if (savedPos > 0) {
        restoreScrollPosition(savedPos, 5);
      }
    }
  }, [isLoading, activeTab]);

  // Global Filter Slicers (persisted in sessionStorage so filtered view is preserved on refresh)
  const [selectedProvince, setSelectedProvince] = useState<string>(() => {
    try { return sessionStorage.getItem('hb_filter_province') || 'all'; } catch { return 'all'; }
  });
  const [selectedDistrict, setSelectedDistrict] = useState<string>(() => {
    try { return sessionStorage.getItem('hb_filter_district') || 'all'; } catch { return 'all'; }
  });
  const [selectedChurch, setSelectedChurch] = useState<string>(() => {
    try { return sessionStorage.getItem('hb_filter_church') || 'all'; } catch { return 'all'; }
  });
  const [selectedStatus, setSelectedStatus] = useState<string>(() => {
    try { return sessionStorage.getItem('hb_filter_status') || 'all'; } catch { return 'all'; }
  });
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(() => {
    try { return (sessionStorage.getItem('hb_filter_time_range') as TimeRange) || 'all'; } catch { return 'all'; }
  });
  const [startDate, setStartDate] = useState<string>(() => {
    try { return sessionStorage.getItem('hb_filter_start_date') || ''; } catch { return ''; }
  });
  const [endDate, setEndDate] = useState<string>(() => {
    try { return sessionStorage.getItem('hb_filter_end_date') || ''; } catch { return ''; }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('hb_filter_province', selectedProvince);
      sessionStorage.setItem('hb_filter_district', selectedDistrict);
      sessionStorage.setItem('hb_filter_church', selectedChurch);
      sessionStorage.setItem('hb_filter_status', selectedStatus);
      sessionStorage.setItem('hb_filter_time_range', selectedTimeRange);
      sessionStorage.setItem('hb_filter_start_date', startDate);
      sessionStorage.setItem('hb_filter_end_date', endDate);
    } catch {}
  }, [selectedProvince, selectedDistrict, selectedChurch, selectedStatus, selectedTimeRange, startDate, endDate]);

  // Modals for Admin
  const [isVillageModalOpen, setIsVillageModalOpen] = useState<boolean>(false);
  const [villageToEdit, setVillageToEdit] = useState<Village | null>(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);
  const [eventToEdit, setEventToEdit] = useState<EventData | null>(null);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState<boolean>(false);
  const [teamToEdit, setTeamToEdit] = useState<TeamMember | null>(null);

  // Floating AI Drawer
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
  const [isAiExpanded, setIsAiExpanded] = useState<boolean>(false);

  // Handle dark mode class on html and body elements + persist preference in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hb_dark_mode', String(darkMode));
    } catch {
      // ignore
    }
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch Ministry Data
  const fetchMinistryData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ministry-data');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const cleanVillages = (data.villages || []).map((v: any) => ({
            ...v,
            heard: Number(v.heard) || 0,
            believers: Number(v.believers) || 0,
            baptized: Number(v.baptized) || 0,
            attending: typeof v.attending === 'number' ? v.attending : (Number(v.attending) || 0),
            leaders: typeof v.leaders === 'number' ? v.leaders : (Number(v.leaders) || 0),
          }));
          setVillages(cleanVillages);
          setEvents(data.events || []);
          setTeams(data.teams || []);
          try {
            localStorage.setItem('hb_cached_villages', JSON.stringify(cleanVillages));
            safeCacheEvents(data.events || []);
            localStorage.setItem('hb_cached_teams', JSON.stringify(data.teams || []));
          } catch {}

          if (data.homePoster) {
            setHomePoster(data.homePoster);
            try { localStorage.setItem('hb_cached_home_poster', JSON.stringify(data.homePoster)); } catch {}
          }
          if (data.donationInfo) {
            setDonationInfo(data.donationInfo);
            try { localStorage.setItem('hb_cached_donation_info', JSON.stringify(data.donationInfo)); } catch {}
          }
        }
      }
    } catch (err) {
      // Gracefully handle network issues; real-time Firestore listeners will load the data
      console.warn('Ministry data API fetch skipped, using real-time sync data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSaveHomePoster = async (poster: HomePoster) => {
    try {
      setIsSyncing(true);
      await saveHomePosterToFirestore(poster);
      setHomePoster(poster);
      try { localStorage.setItem('hb_cached_home_poster', JSON.stringify(poster)); } catch {}
      triggerSyncIndicator();

      fetch('/api/save-home-poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homePoster: poster }),
      }).catch(() => {});
    } catch (err) {
      setIsSyncing(false);
      console.error('Save poster error:', err);
      throw err;
    }
  };

  const handleSaveDonationInfo = async (info: DonationInfo) => {
    try {
      setIsSyncing(true);
      await saveDonationInfoToFirestore(info);
      setDonationInfo(info);
      try { localStorage.setItem('hb_cached_donation_info', JSON.stringify(info)); } catch {}
      triggerSyncIndicator();

      fetch('/api/save-donation-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      }).catch(() => {});
    } catch (err) {
      setIsSyncing(false);
      console.error('Save donation info error:', err);
      throw err;
    }
  };

  // Offline Mode & Persistence State
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Helper to trigger syncing indicator animation
  const triggerSyncIndicator = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Real-time multi-user Firestore listener subscription
  useEffect(() => {
    fetchMinistryData();

    let unsubVillages: () => void;
    let unsubEvents: () => void;
    let unsubTeams: () => void;
    let unsubHomePoster: () => void;
    let unsubDonation: () => void;

    try {
      unsubVillages = onSnapshot(collection(db, 'villages'), (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              heard: Number(data.heard) || 0,
              believers: Number(data.believers) || 0,
              baptized: Number(data.baptized) || 0,
              attending: typeof data.attending === 'number' ? data.attending : (Number(data.attending) || 0),
              leaders: typeof data.leaders === 'number' ? data.leaders : (Number(data.leaders) || 0),
            } as Village;
          });
          setVillages(list);
          try { localStorage.setItem('hb_cached_villages', JSON.stringify(list)); } catch {}
          setIsLoading(false);
        }
      }, (err) => {
        console.warn('Villages sync notice (offline or reconnecting):', err?.message || err);
      });

      unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as EventData));
          setEvents(list);
          try { localStorage.setItem('hb_cached_events', JSON.stringify(list)); } catch {}
        }
      }, (err) => {
        console.warn('Events sync notice (offline or reconnecting):', err?.message || err);
      });

      unsubTeams = onSnapshot(collection(db, 'teams'), (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TeamMember));
          setTeams(list);
          try { localStorage.setItem('hb_cached_teams', JSON.stringify(list)); } catch {}
        }
      }, (err) => {
        console.warn('Teams sync notice (offline or reconnecting):', err?.message || err);
      });

      unsubHomePoster = onSnapshot(doc(db, 'app_config', 'homePoster'), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as HomePoster;
          setHomePoster(data);
          try { localStorage.setItem('hb_cached_home_poster', JSON.stringify(data)); } catch {}
        }
      }, (err) => {
        console.warn('Home poster sync notice (offline or reconnecting):', err?.message || err);
      });

      unsubDonation = onSnapshot(doc(db, 'app_config', 'donationInfo'), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as DonationInfo;
          setDonationInfo(data);
          try { localStorage.setItem('hb_cached_donation_info', JSON.stringify(data)); } catch {}
        }
      }, (err) => {
        console.warn('Donation info sync notice (offline or reconnecting):', err?.message || err);
      });
    } catch (err) {
      console.warn('Realtime subscription notice:', err);
    }

    return () => {
      if (unsubVillages) unsubVillages();
      if (unsubEvents) unsubEvents();
      if (unsubTeams) unsubTeams();
      if (unsubHomePoster) unsubHomePoster();
      if (unsubDonation) unsubDonation();
    };
  }, [fetchMinistryData]);

  // Filtered Villages according to Slicers & Time Range & Calendar Date Pickers
  const filteredVillages = useMemo(() => {
    const now = new Date();

    const normalizeDateStr = (dateVal: string | undefined): string => {
      if (!dateVal) return '';
      const isoMatch = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
      const dmyMatch = dateVal.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
      if (dmyMatch) {
        return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
      }
      const parsed = new Date(dateVal);
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      return dateVal.split('T')[0];
    };

    return villages.filter((v) => {
      if (activeTab !== 'admin' && v.hidden) return false;
      const matchProv =
        selectedProvince === 'all' ||
        v.province === selectedProvince ||
        (v as any).provinceEn === selectedProvince;

      const matchDist =
        selectedDistrict === 'all' ||
        v.district === selectedDistrict ||
        v.districtEn === selectedDistrict ||
        (v as any).districtTh === selectedDistrict;

      const matchChurch =
        selectedChurch === 'all' ||
        v.name === selectedChurch ||
        v.nameEn === selectedChurch ||
        v.id === selectedChurch ||
        String(v.rowId) === selectedChurch;

      const matchStatus = selectedStatus === 'all' || v.persecution === selectedStatus;

      let matchTime = true;
      if (selectedTimeRange === 'custom') {
        const effectiveStart = startDate || '';
        const effectiveEnd = endDate || '';
        if (effectiveStart || effectiveEnd) {
          let hasActivity = false;
          // 1. Check update history logs
          if (Array.isArray(v.history) && v.history.length > 0) {
            hasActivity = v.history.some((log) => {
              const isBase = log.notes === 'Initial Baseline Record' || (log.id && log.id.startsWith('init_'));
              if (isBase) {
                // If it's the initial planting record, count it ONLY if the church was planted within this window
                const pd = normalizeDateStr(v.initialDate || log.date);
                if (!pd) return false;
                if (effectiveStart && pd < effectiveStart) return false;
                if (effectiveEnd && pd > effectiveEnd) return false;
                return true;
              }
              const ld = normalizeDateStr(log.date);
              if (!ld) return false;
              if (effectiveStart && ld < effectiveStart) return false;
              if (effectiveEnd && ld > effectiveEnd) return false;
              return true;
            });
          } else {
            // 2. Village has no history logs: check if newly planted within this window
            const plantDate = normalizeDateStr(v.initialDate || v.date);
            if (plantDate) {
              let vInRange = true;
              if (effectiveStart && plantDate < effectiveStart) vInRange = false;
              if (effectiveEnd && plantDate > effectiveEnd) vInRange = false;
              hasActivity = vInRange;
            }
          }
          matchTime = hasActivity;
        }
      } else if (selectedTimeRange !== 'all') {
        const maxDays = selectedTimeRange === 'week' ? 7 : selectedTimeRange === 'month' ? 30 : 365;
        let hasActivity = false;
        if (Array.isArray(v.history) && v.history.length > 0) {
          hasActivity = v.history.some((log) => {
            const isBase = log.notes === 'Initial Baseline Record' || (log.id && log.id.startsWith('init_'));
            if (isBase) {
              const pd = normalizeDateStr(v.initialDate || log.date);
              if (!pd) return false;
              const plantDate = new Date(pd);
              if (!isNaN(plantDate.getTime())) {
                const diffDays = (now.getTime() - plantDate.getTime()) / (1000 * 3600 * 24);
                return diffDays >= 0 && diffDays <= maxDays;
              }
              return false;
            }
            const ld = normalizeDateStr(log.date);
            if (!ld) return false;
            const logDate = new Date(ld);
            if (!isNaN(logDate.getTime())) {
              const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
              return diffDays >= 0 && diffDays <= maxDays;
            }
            return false;
          });
        } else {
          const pd = normalizeDateStr(v.initialDate || v.date);
          if (pd) {
            const plantDate = new Date(pd);
            if (!isNaN(plantDate.getTime())) {
              const diffDays = (now.getTime() - plantDate.getTime()) / (1000 * 3600 * 24);
              hasActivity = diffDays >= 0 && diffDays <= maxDays;
            }
          }
        }
        matchTime = hasActivity;
      }

      return matchProv && matchDist && matchChurch && matchStatus && matchTime;
    });
  }, [villages, activeTab, selectedProvince, selectedDistrict, selectedChurch, selectedStatus, selectedTimeRange, startDate, endDate]);

  const handleResetFilters = () => {
    setSelectedProvince('all');
    setSelectedDistrict('all');
    setSelectedChurch('all');
    setSelectedStatus('all');
    setSelectedTimeRange('all');
    setStartDate('');
    setEndDate('');
    try {
      sessionStorage.removeItem('hb_filter_province');
      sessionStorage.removeItem('hb_filter_district');
      sessionStorage.removeItem('hb_filter_church');
      sessionStorage.removeItem('hb_filter_status');
      sessionStorage.removeItem('hb_filter_time_range');
      sessionStorage.removeItem('hb_filter_start_date');
      sessionStorage.removeItem('hb_filter_end_date');
    } catch {}
  };

  // Direct save/update village handler for Church Edit Portal (Room 1) and Admin (Room 2)
  const handleSaveVillageRecord = async (updatedVillage: Village) => {
    try {
      setIsSyncing(true);

      // 1. Instant optimistic update to local state and localStorage for instant reactivity in Insights
      setVillages((prev) => {
        const exists = prev.some(
          (v) => (updatedVillage.id && v.id === updatedVillage.id) || v.rowId === updatedVillage.rowId
        );
        const next = exists
          ? prev.map((v) =>
              (updatedVillage.id && v.id === updatedVillage.id) || v.rowId === updatedVillage.rowId
                ? { ...v, ...updatedVillage }
                : v
            )
          : [...prev, updatedVillage];
        try {
          localStorage.setItem('hb_cached_villages', JSON.stringify(next));
        } catch {}
        return next;
      });
      triggerSyncIndicator();

      // 2. Parallel sync to backend API (which updates in-memory server state and server-side Firestore)
      const apiPromise = fetch('/api/save-village', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedVillage),
      }).catch((e) => console.warn('Backend save-village notice:', e));

      // 3. Parallel sync to client Firestore
      const firestorePromise = saveVillageToFirestore(updatedVillage).catch((e) =>
        console.warn('Client firestore save warning:', e)
      );

      await Promise.allSettled([apiPromise, firestorePromise]);
    } catch (err) {
      console.error('Failed to save village update:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Direct save/update event handler
  const handleSaveEventRecord = async (updatedEvent: EventData) => {
    try {
      setIsSyncing(true);
      await saveEventToFirestore(updatedEvent);
      setEvents((prev) => {
        const next = prev.map((e) =>
          e.rowId === updatedEvent.rowId || (updatedEvent.id && e.id === updatedEvent.id)
            ? { ...e, ...updatedEvent }
            : e
        );
        try {
          localStorage.setItem('hb_cached_events', JSON.stringify(next));
        } catch {}
        return next;
      });
      triggerSyncIndicator();

      fetch('/api/save-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEvent),
      }).catch(() => {});
    } catch (err) {
      setIsSyncing(false);
      console.error('Failed to save event update:', err);
    }
  };

  // Direct save/update team member handler
  const handleSaveTeamRecord = async (updatedTeam: TeamMember) => {
    try {
      setIsSyncing(true);
      const saved = await saveTeamToFirestore(updatedTeam);
      setTeams((prev) => {
        const targetId = updatedTeam.id;
        const targetRowId = updatedTeam.rowId;
        const targetName = updatedTeam.name?.trim().toLowerCase();

        const exists = prev.some(
          (t) =>
            (targetId && t.id === targetId) ||
            (targetRowId && t.rowId === targetRowId) ||
            (targetName && t.name?.trim().toLowerCase() === targetName)
        );

        if (exists) {
          return prev.map((t) =>
            (targetId && t.id === targetId) ||
            (targetRowId && t.rowId === targetRowId) ||
            (targetName && t.name?.trim().toLowerCase() === targetName)
              ? { ...t, ...saved, hidden: Boolean(updatedTeam.hidden) }
              : t
          );
        }
        return [...prev, saved];
      });
      triggerSyncIndicator();

      fetch('/api/save-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTeam),
      }).catch(() => {});
    } catch (err) {
      setIsSyncing(false);
      console.error('Failed to save team update:', err);
    }
  };

  // CRUD actions
  const handleDeleteVillage = async (rowId: number) => {
    try {
      setIsSyncing(true);
      const targetVillage = villages.find((v) => v.rowId === rowId);
      await deleteVillageFromFirestore(rowId, targetVillage?.id);
      setVillages((prev) => prev.filter((v) => v.rowId !== rowId));
      triggerSyncIndicator();

      fetch('/api/delete-village', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId }),
      }).catch(() => {});
    } catch (err) {
      setIsSyncing(false);
      console.error('Delete village error:', err);
    }
  };

  const handleDeleteEvent = async (rowId: number) => {
    try {
      setIsSyncing(true);
      const targetEvent = events.find((e) => e.rowId === rowId);
      await deleteEventFromFirestore(rowId, targetEvent?.id);
      setEvents((prev) => {
        const remaining = prev.filter((e) => e.rowId !== rowId && (!targetEvent?.id || e.id !== targetEvent.id));
        try {
          localStorage.setItem('hb_cached_events', JSON.stringify(remaining));
        } catch {}
        return remaining;
      });
      triggerSyncIndicator();

      fetch('/api/delete-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId, id: targetEvent?.id }),
      }).catch(() => {});
    } catch (err) {
      setIsSyncing(false);
      console.error('Delete event error:', err);
    }
  };

  const handleDeleteTeam = async (rowId: number, id?: string) => {
    try {
      setIsSyncing(true);
      const targetTeam = teams.find((t) => (id && t.id === id) || t.rowId === rowId);
      await deleteTeamFromFirestore(rowId, id || targetTeam?.id);
      setTeams((prev) => prev.filter((t) => (id ? t.id !== id : t.rowId !== rowId)));
      triggerSyncIndicator();

      fetch('/api/delete-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId, id }),
      }).catch(() => {});
    } catch (err) {
      setIsSyncing(false);
      console.error('Delete team error:', err);
    }
  };

  const hasCustomBgColor = Boolean(homePoster?.bgColor && homePoster.bgColor.trim() !== '' && homePoster.bgColor.trim() !== '#ffffff');
  const hasCustomBgImage = Boolean(homePoster?.bgImageUrl && homePoster.bgImageUrl.trim() !== '');
  const bgBrightness = typeof homePoster?.bgBrightness === 'number' ? homePoster.bgBrightness : 100;
  const bgBlur = typeof homePoster?.bgBlur === 'number' ? homePoster.bgBlur : 0;
  const bgWhiteOverlayOpacity = typeof homePoster?.bgWhiteOverlayOpacity === 'number'
    ? homePoster.bgWhiteOverlayOpacity
    : typeof (homePoster as any)?.bgWhiteOpacity === 'number'
    ? (homePoster as any).bgWhiteOpacity
    : 0;

  return (
    <div
      className={`${darkMode ? 'dark text-slate-100' : 'text-slate-800'} ${
        !hasCustomBgColor && !hasCustomBgImage
          ? darkMode
            ? 'bg-slate-950'
            : 'bg-slate-50'
          : hasCustomBgImage
          ? 'bg-transparent'
          : ''
      } min-h-screen w-full max-w-full overflow-x-hidden transition-colors duration-300 flex flex-col font-sans relative`}
      style={{
        backgroundColor: !hasCustomBgImage && hasCustomBgColor ? homePoster!.bgColor : undefined,
      }}
    >
      {/* Auto Update Listener for live sync across Studio and Web */}
      <AutoUpdateListener />

      {/* Blurred & Gently Tinted Background Wallpaper Layer (ສາກຫຼັງພື້ນເວັບໄຊ - ຮູບພາບ, ຄວາມສະຫວ່າງ/ຄວາມມືດ, ຄວາມເບີ ແລະ ຄວາມຂາວບັງພາບ) */}
      {hasCustomBgImage && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
          <div
            className="absolute -inset-4 bg-cover bg-center bg-no-repeat transition-all duration-300 scale-105"
            style={{
              backgroundImage: `url("${homePoster!.bgImageUrl}")`,
              filter: `blur(${bgBlur}px) brightness(${bgBrightness}%)`,
            }}
          />
          {/* White Mask / Overlay Layer (ຄວາມຂາວບັງພາບ - ປັບຄວາມເຂັ້ມສີຂາວບັງພາບຕາມຕ້ອງການ) */}
          {bgWhiteOverlayOpacity > 0 && (
            <div
              className="absolute inset-0 bg-white transition-opacity duration-300"
              style={{ opacity: bgWhiteOverlayOpacity / 100 }}
            />
          )}
          {/* Subtle translucent tint overlay so content remains readable */}
          {hasCustomBgColor ? (
            <div
              className="absolute inset-0 transition-opacity"
              style={{
                backgroundColor: homePoster!.bgColor,
                opacity: 0.18,
              }}
            />
          ) : (
            bgWhiteOverlayOpacity === 0 && <div className="absolute inset-0 bg-white/10 dark:bg-slate-950/40" />
          )}
        </div>
      )}

      {!hasCustomBgImage && hasCustomBgColor && (
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{ backgroundColor: homePoster!.bgColor }}
        />
      )}

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        autoThemeEnabled={autoThemeEnabled}
        setAutoThemeEnabled={setAutoThemeEnabled}
        autoThemeStart={autoThemeStart}
        setAutoThemeStart={setAutoThemeStart}
        autoThemeEnd={autoThemeEnd}
        setAutoThemeEnd={setAutoThemeEnd}
        isSyncing={isSyncing}
        logoUrl={homePoster?.logoUrl}
      />

      {/* Offline Status Notification Banner — Shown ONLY when genuinely offline */}
      {isOffline && (
        <div className="bg-amber-500/15 dark:bg-amber-500/20 border-b border-amber-500/30 px-3 py-1 text-center text-[10px] sm:text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2 z-30 transition animate-fade-in">
          <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            {language === 'lo'
              ? 'ໂໝດອອຟໄລນ໌ (Offline) — ຂໍ້ມູນທີ່ອັບເດດຈະຊິງຄ໌ອັດໂຕໂນມັດເມື່ອມີສັນຍານອິນເຕີເນັດ.'
              : language === 'th'
              ? 'โหมดออฟไลน์ (Offline) — ข้อมูลที่อัปเดตจะซิงค์อัตโนมัติเมื่อเชื่อมต่ออินเทอร์เน็ต'
              : 'Offline Mode — Updates will sync automatically when back online.'}
          </span>
        </div>
      )}

      {/* Main Container — Full width fluid responsive across phone, tablet, and widescreen */}
      <main className={`flex-1 w-full max-w-full ${activeTab === 'home' ? 'p-0 space-y-0' : 'px-0.5 sm:px-1.5 md:px-3 lg:px-4 py-2.5 sm:py-4 space-y-3 sm:space-y-4'} relative overflow-x-hidden`}>
        {/* Global Filter Panel (Shown on Dashboard only) */}
        {activeTab === 'dashboard' && (
          <FilterPanel
            villages={villages}
            selectedProvince={selectedProvince}
            setSelectedProvince={setSelectedProvince}
            selectedDistrict={selectedDistrict}
            setSelectedDistrict={setSelectedDistrict}
            selectedChurch={selectedChurch}
            setSelectedChurch={setSelectedChurch}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            selectedTimeRange={selectedTimeRange}
            setSelectedTimeRange={setSelectedTimeRange}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            onResetFilters={handleResetFilters}
            language={language}
          />
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-none shadow-sm border border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-500 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#cc0000]" />
            <span>
              {language === 'lo'
                ? 'ກຳລັງໂຫຼດຂໍ້ມູນພັນທະກິດ Hope Bokeo...'
                : 'Loading Hope Bokeo ministry data...'}
            </span>
          </div>
        )}

        {/* Tab 1: Home */}
        {activeTab === 'home' && (
          <HomeTab
            events={events}
            homePoster={homePoster}
            donationInfo={donationInfo}
            language={language}
            onNavigateToDashboard={() => setActiveTab('dashboard')}
            onNavigateToAdmin={(subTab) => {
              if (subTab) {
                try {
                  sessionStorage.setItem('hb_admin_sub_tab', subTab);
                  localStorage.setItem('hb_admin_sub_tab', subTab);
                } catch {}
              }
              setActiveTab('admin');
            }}
          />
        )}

        {/* Tab 2: Dashboard (Deep Insights - includes Chart, Excel Data Table & Embedded Map) */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            filteredVillages={filteredVillages}
            language={language}
            selectedProvince={selectedProvince}
            selectedDistrict={selectedDistrict}
            selectedChurch={selectedChurch}
            selectedTimeRange={selectedTimeRange}
            startDate={startDate}
            endDate={endDate}
          />
        )}

        {/* Tab 3: About Us */}
        {activeTab === 'about' && (
          <AboutTab
            teams={teams}
            donationInfo={donationInfo}
            homePoster={homePoster}
            language={language}
          />
        )}

        {/* Tab 4: Room 1 - Church Edit Portal (ອັບເດດຂໍ້ມູນຄຣິດຕະຈັກ) */}
        {activeTab === 'church-portal' && (
          <ChurchEditPortal
            villages={villages}
            onSaveVillage={handleSaveVillageRecord}
            language={language}
            onBack={() => setActiveTab('home')}
          />
        )}

        {/* Tab 5: Master Admin Area (ຫ້ອງແອັດມິນ) */}
        {activeTab === 'admin' && (
          <AdminTab
            villages={villages}
            events={events}
            teams={teams}
            homePoster={homePoster}
            donationInfo={donationInfo}
            onSaveHomePoster={handleSaveHomePoster}
            onSaveDonationInfo={handleSaveDonationInfo}
            onSaveVillage={handleSaveVillageRecord}
            onSaveEvent={handleSaveEventRecord}
            onSaveTeam={handleSaveTeamRecord}
            onRefreshData={fetchMinistryData}
            onOpenAddVillage={() => {
              setVillageToEdit(null);
              setIsVillageModalOpen(true);
            }}
            onEditVillage={(v) => {
              setVillageToEdit(v);
              setIsVillageModalOpen(true);
            }}
            onDeleteVillage={handleDeleteVillage}
            onOpenAddEvent={() => {
              setEventToEdit(null);
              setIsEventModalOpen(true);
            }}
            onEditEvent={(e) => {
              setEventToEdit(e);
              setIsEventModalOpen(true);
            }}
            onDeleteEvent={handleDeleteEvent}
            onOpenAddTeam={() => {
              setTeamToEdit(null);
              setIsTeamModalOpen(true);
            }}
            onEditTeam={(t) => {
              setTeamToEdit(t);
              setIsTeamModalOpen(true);
            }}
            onDeleteTeam={handleDeleteTeam}
            language={language}
            onBackToHome={() => setActiveTab('home')}
          />
        )}
      </main>

      {/* Floating AI Assistant Button & Modal — Always bottom-right, no blur overlay */}
      <div className="fixed bottom-5 right-5 z-40">
        {!isAiOpen && (
          <button
            onClick={() => setIsAiOpen(true)}
            className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#cc0000] hover:bg-black text-white font-bold shadow-lg shadow-red-600/30 flex items-center justify-center border border-white/30 transition transform hover:scale-105 active:scale-95 group"
            title={
              language === 'lo'
                ? 'AI ຜູ້ຊ່ວຍ Hope Bokeo'
                : language === 'th'
                ? 'AI ผู้ช่วย Hope Bokeo'
                : 'Hope Bokeo AI Assistant'
            }
          >
            <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 animate-pulse text-amber-300" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
          </button>
        )}
      </div>

      {/* Floating AI Assistant Modal with Resizable & Expandable Container */}
      {isAiOpen && (
        <>
          {/* Backdrop overlay to catch clicks outside the modal and close AI */}
          <div
            className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAiOpen(false)}
          />
          <div
            className={`fixed z-50 shadow-2xl rounded-none overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 animate-fade-in transition-all duration-300 ${
              isAiExpanded
                ? 'inset-3 sm:inset-8 max-w-5xl mx-auto my-auto h-[92vh] flex flex-col justify-between'
                : 'bottom-4 right-4 w-[94vw] max-w-md sm:max-w-lg'
            }`}
          >
            <AiAssistant
              sheetTitle="Hope Bokeo Ministry"
              headers={['id', 'name', 'district', 'believers', 'baptized', 'persecution', 'needs']}
              rows={villages.map((v) => [
                v.id,
                v.name,
                v.district,
                v.believers.toString(),
                v.baptized.toString(),
                v.persecution,
                v.needs,
              ])}
              language={language}
              whatsappNumber={donationInfo?.prayerContactWhatsapp || '8562076838584'}
              onClose={() => setIsAiOpen(false)}
              isExpanded={isAiExpanded}
              onToggleExpand={() => setIsAiExpanded(!isAiExpanded)}
            />
          </div>
        </>
      )}

      {/* Modals */}
      <VillageModal
        isOpen={isVillageModalOpen}
        onClose={() => setIsVillageModalOpen(false)}
        villageToEdit={villageToEdit}
        onSaveSuccess={(savedVillage?: Village) => {
          if (savedVillage) {
            setVillages((prev) => {
              const exists = prev.some((v) => v.rowId === savedVillage.rowId || v.id === savedVillage.id);
              if (exists) {
                return prev.map((v) =>
                  v.rowId === savedVillage.rowId || v.id === savedVillage.id ? { ...v, ...savedVillage } : v
                );
              }
              return [...prev, savedVillage];
            });
          }
          fetchMinistryData();
        }}
        language={language}
      />

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        eventToEdit={eventToEdit}
        onSaveSuccess={(savedEvent) => {
          if (savedEvent) {
            setEvents((prev) => {
              const idx = prev.findIndex(
                (e) => (savedEvent.id && e.id === savedEvent.id) || e.rowId === savedEvent.rowId
              );
              let updated: EventData[];
              if (idx >= 0) {
                updated = [...prev];
                updated[idx] = { ...prev[idx], ...savedEvent };
              } else {
                updated = [savedEvent, ...prev];
              }
              safeCacheEvents(updated);
              return updated;
            });
          }
          fetchMinistryData();
        }}
        language={language}
      />

      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        teamToEdit={teamToEdit}
        onSaveSuccess={(savedTeam) => {
          if (savedTeam) {
            setTeams((prev) => {
              const idx = prev.findIndex(
                (t) => (savedTeam.id && t.id === savedTeam.id) || t.rowId === savedTeam.rowId
              );
              let updated: TeamMember[];
              if (idx >= 0) {
                updated = [...prev];
                updated[idx] = { ...prev[idx], ...savedTeam };
              } else {
                updated = [...prev, savedTeam];
              }
              try {
                localStorage.setItem('hb_cached_teams', JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
          fetchMinistryData();
        }}
        language={language}
      />

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-1.5 px-3 sm:px-6 text-[11px] text-slate-500 dark:text-slate-400 mt-auto transition-colors">
        <div className="w-full flex items-center justify-center sm:justify-start font-medium leading-tight">
          <span className="inline-flex items-center gap-1.5 flex-wrap">
            <HbLogo logoUrl={homePoster?.logoUrl} className="h-3.5 w-auto text-[#ee1c25] shrink-0" />
            <span>© 2026 Hope Bokeo Ministry • Bokeo Province, Lao PDR • Local Dev & Support</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
