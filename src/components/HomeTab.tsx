import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, ArrowRight, Video, FileText, Image as ImageIcon, Sparkles, BookOpen, HeartHandshake, Users, Target, Shield, Compass, Megaphone, MapPin, X } from 'lucide-react';
import { DonationInfo, EventData, HomePoster, Language } from '../types';
import { EventReportModal } from './EventReportModal';
import { cleanRichHtml } from './RichTextEditor';
import { PdfThumbnail } from './PdfThumbnail';
import { UpcomingEventPoster } from './UpcomingEventPoster';

interface HomeTabProps {
  events: EventData[];
  homePoster?: HomePoster;
  donationInfo?: DonationInfo;
  language: Language;
  onNavigateToDashboard?: () => void;
  onNavigateToAdmin?: (subTab?: 'poster' | 'events' | 'donation') => void;
}

const DEFAULT_HERO_SLIDES = [
  'https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?q=80&w=1600',
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=1600',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1600',
];

const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1&loop=1&playlist=${match[2]}&controls=0&showinfo=0&rel=0&playsinline=1`;
  }
  return null;
};

export const HomeTab: React.FC<HomeTabProps> = ({
  events,
  homePoster,
  donationInfo,
  language,
  onNavigateToDashboard,
  onNavigateToAdmin,
}) => {
  // Collect hero cover images strictly from user-configured list without auto-multiplying
  const heroImages: string[] = [];
  if (Array.isArray(homePoster?.imageUrls) && homePoster.imageUrls.length > 0) {
    homePoster.imageUrls.forEach((url) => {
      if (url && typeof url === 'string' && url.trim() && !heroImages.includes(url.trim())) {
        heroImages.push(url.trim());
      }
    });
  } else if (homePoster?.imageUrl && typeof homePoster.imageUrl === 'string' && homePoster.imageUrl.trim()) {
    heroImages.push(homePoster.imageUrl.trim());
  } else {
    heroImages.push(...DEFAULT_HERO_SLIDES);
  }

  const [currentHeroSlide, setCurrentHeroSlide] = useState<number>(0);
  const [isHeroPaused, setIsHeroPaused] = useState<boolean>(false);
  const [showVideoMode, setShowVideoMode] = useState<boolean>(false);

  // Determine whether to display text overlay on the poster banner
  const shouldShowTextOverlay = homePoster?.hideTextOverlay !== true;

  const activeHeroIndex = currentHeroSlide < heroImages.length ? currentHeroSlide : 0;

  const posterVideoUrl = homePoster?.videoUrl?.trim() || '';
  const ytEmbedUrl = posterVideoUrl ? getYouTubeEmbedUrl(posterVideoUrl) : null;
  const isDirectVideo = posterVideoUrl
    ? Boolean(posterVideoUrl.match(/\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i) || posterVideoUrl.startsWith('data:video'))
    : false;

  // Per-event card image index tracker
  const [cardImageIndices, setCardImageIndices] = useState<Record<string | number, number>>({});

  // Modal event state
  const [selectedReportEvent, setSelectedReportEvent] = useState<EventData | null>(null);

  // Per-card open/close expansion tracker (default open so full description is visible)
  const [closedCardIds, setClosedCardIds] = useState<Record<string | number, boolean>>({});

  const toggleCardOpen = (id: string | number) => {
    setClosedCardIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Upcoming Event / Announcement fields extraction
  const upcomingTitle =
    (language === 'en' && homePoster?.upcomingEventTitleEn?.trim() ? homePoster.upcomingEventTitleEn.trim() : undefined) ||
    (language === 'th' && homePoster?.upcomingEventTitleTh?.trim() ? homePoster.upcomingEventTitleTh.trim() : undefined) ||
    (homePoster?.upcomingEventTitle?.trim() ? homePoster.upcomingEventTitle.trim() : undefined) ||
    (homePoster?.upcomingEventTitleEn?.trim() ? homePoster.upcomingEventTitleEn.trim() : undefined) ||
    (homePoster?.upcomingEventTitleTh?.trim() ? homePoster.upcomingEventTitleTh.trim() : undefined) ||
    '';

  const upcomingDesc =
    (language === 'en' && homePoster?.upcomingEventDescEn?.trim() ? homePoster.upcomingEventDescEn.trim() : undefined) ||
    (language === 'th' && homePoster?.upcomingEventDescTh?.trim() ? homePoster.upcomingEventDescTh.trim() : undefined) ||
    (homePoster?.upcomingEventDesc?.trim() ? homePoster.upcomingEventDesc.trim() : undefined) ||
    (homePoster?.upcomingEventDescEn?.trim() ? homePoster.upcomingEventDescEn.trim() : undefined) ||
    (homePoster?.upcomingEventDescTh?.trim() ? homePoster.upcomingEventDescTh.trim() : undefined) ||
    '';

  const upcomingLocation =
    (language === 'en' && homePoster?.upcomingEventLocationEn?.trim() ? homePoster.upcomingEventLocationEn.trim() : undefined) ||
    (language === 'th' && homePoster?.upcomingEventLocationTh?.trim() ? homePoster.upcomingEventLocationTh.trim() : undefined) ||
    (homePoster?.upcomingEventLocation?.trim() ? homePoster.upcomingEventLocation.trim() : undefined) ||
    (homePoster?.upcomingEventLocationEn?.trim() ? homePoster.upcomingEventLocationEn.trim() : undefined) ||
    (homePoster?.upcomingEventLocationTh?.trim() ? homePoster.upcomingEventLocationTh.trim() : undefined) ||
    '';

  const upcomingDate = homePoster?.upcomingEventDate?.trim() || '';
  const upcomingImageUrl = homePoster?.upcomingEventImageUrl?.trim() || '';
  const upcomingBadge = homePoster?.upcomingEventBadge?.trim() || (language === 'lo' ? 'ແຈ້ງການ & ປະກາດ' : language === 'th' ? 'ประกาศและข่าวสาร' : 'Announcement');
  const isUpcomingHidden = homePoster?.hideUpcomingEvent === true;
  const hasUpcomingEventData = Boolean(upcomingTitle || upcomingDate || upcomingImageUrl || upcomingDesc);

  const [selectedFlyerModal, setSelectedFlyerModal] = useState<string | null>(null);

  const visibleEvents = useMemo(() => {
    return (events || [])
      .filter((e) => !e.hidden)
      .sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateB !== dateA) return dateB.localeCompare(dateA);
        return (b.rowId || 0) - (a.rowId || 0);
      });
  }, [events]);

  // Hero auto-slide timer (2 seconds as requested)
  useEffect(() => {
    if (isHeroPaused || heroImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % heroImages.length);
    }, 2000);

    return () => clearInterval(timer);
  }, [isHeroPaused, heroImages.length]);

  const handleNextHero = () => {
    setCurrentHeroSlide((prev) => (prev + 1) % heroImages.length);
  };

  const handlePrevHero = () => {
    setCurrentHeroSlide((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1));
  };

  // Event card image handlers
  const getEventImages = (e: EventData): string[] => {
    const list: string[] = [];
    if (e.imageUrls && e.imageUrls.length > 0) {
      e.imageUrls.forEach((url) => {
        if (url && url.trim()) list.push(url.trim());
      });
    }
    if (e.imageUrl && !list.includes(e.imageUrl.trim())) {
      list.unshift(e.imageUrl.trim());
    }
    if (list.length === 0) {
      list.push('https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800');
    }
    return list;
  };

  // Helper to aggregate all files (images and documents) for home page event showcase
  const getEventFiles = (e: EventData): { url: string; isDoc: boolean }[] => {
    const list: { url: string; isDoc: boolean }[] = [];
    const seen = new Set<string>();

    const add = (u?: string, isDoc = false) => {
      if (!u || typeof u !== 'string') return;
      const clean = u.trim();
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        list.push({ url: clean, isDoc });
      }
    };

    if (e.imageUrls && e.imageUrls.length > 0) {
      e.imageUrls.forEach((url) => add(url, false));
    }
    if (e.imageUrl) add(e.imageUrl, false);
    if (e.docUrls && e.docUrls.length > 0) {
      e.docUrls.forEach((doc) => add(doc, true));
    }
    if (e.docUrl) add(e.docUrl, true);

    // Also include attached documents & media from monthly sub-reports
    if (Array.isArray(e.monthlyReports)) {
      e.monthlyReports.forEach((r) => {
        if (Array.isArray(r.docUrls)) {
          r.docUrls.forEach((doc) => add(doc, true));
        }
        if (r.docUrl) add(r.docUrl, true);
        if (Array.isArray(r.imageUrls)) {
          r.imageUrls.forEach((img) => add(img, false));
        }
      });
    }

    if (list.length === 0) {
      list.push({
        url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800',
        isDoc: false,
      });
    }
    return list;
  };

  const handlePrevCardImg = (eventId: string | number, max: number, evt: React.MouseEvent) => {
    evt.stopPropagation();
    setCardImageIndices((prev) => {
      const curr = prev[eventId] || 0;
      return { ...prev, [eventId]: curr === 0 ? max - 1 : curr - 1 };
    });
  };

  const handleNextCardImg = (eventId: string | number, max: number, evt: React.MouseEvent) => {
    evt.stopPropagation();
    setCardImageIndices((prev) => {
      const curr = prev[eventId] || 0;
      return { ...prev, [eventId]: (curr + 1) % max };
    });
  };

  const heroTitle =
    language === 'en'
      ? (homePoster?.titleEn || (homePoster?.title && homePoster.title !== 'ປະກາດຂ່າວປະເສີດ ແລະ ສ້າງສາວົກ' ? homePoster.title : 'Proclaim Gospel & Disciple Nations'))
      : language === 'th'
      ? (homePoster?.titleTh || 'ประกาศข่าวประเสริฐ และสร้างสาวก')
      : (homePoster?.title || 'ປະກາດຂ່າວປະເສີດ ແລະ ສ້າງສາວົກ');

  const heroSubtitle =
    language === 'en'
      ? (homePoster?.subtitleEn || (homePoster?.subtitle && homePoster.subtitle !== 'ແຂວງບໍ່ແກ້ວ' ? homePoster.subtitle : 'Bokeo Province (Lao PDR)'))
      : language === 'th'
      ? (homePoster?.subtitleTh || 'แขวงบ่อแก้ว')
      : (homePoster?.subtitle || 'ແຂວງບໍ່ແກ້ວ');

  const heroDesc =
    language === 'en'
      ? (homePoster?.descriptionEn || (homePoster?.description && homePoster.description !== 'ຮ່ວມເປັນສ່ວນໜຶ່ງໃນການຂັບເຄື່ອນວຽກງານຂອງພຣະເຈົ້າໃນແຂວງບໍ່ແກ້ວ ໂດຍການຕິດຕາມ, ຮ່ວມອະທິຖານ ແລະ ສະໜັບສະໜູນວຽກງານພາກສະໜາມ.' ? homePoster.description : 'Be a vital part of advancing God’s work in Bokeo Province through tracking, faithful prayer, and supporting field operations.'))
      : language === 'th'
      ? (homePoster?.descriptionTh || 'ร่วมเป็นส่วนหนึ่งในการขับเคลื่อนพระราชกิจของพระเจ้าในแขวงบ่อแก้ว โดยการติดตาม ร่วมอธิษฐาน และสนับสนุนงานภาคสนาม')
      : (homePoster?.description || 'ຮ່ວມເປັນສ່ວນໜຶ່ງໃນການຂັບເຄື່ອນວຽກງານຂອງພຣະເຈົ້າໃນແຂວງບໍ່ແກ້ວ ໂດຍການຕິດຕາມ, ຮ່ວມອະທິຖານ ແລະ ສະໜັບສະໜູນວຽກງານພາກສະໜາມ.');

  const buttonText =
    language === 'en'
      ? (homePoster?.buttonTextEn || (homePoster?.buttonText && homePoster.buttonText !== 'ເບິ່ງດາສບອດຂໍ້ມູນ' ? homePoster.buttonText : 'View Dashboard'))
      : language === 'th'
      ? (homePoster?.buttonTextTh || 'ดูแดชบอร์ดข้อมูล')
      : (homePoster?.buttonText || 'ເບິ່ງດາສບອດຂໍ້ມູນ');

  // Calculate edge fade mask for hero banner matching announcement poster features
  const homeEdgeFadePercent = typeof homePoster?.posterEdgeFade === 'number'
    ? Math.max(0, Math.min(100, homePoster.posterEdgeFade))
    : 0;
  const homeEdgeFadePx = Math.round((homeEdgeFadePercent / 100) * 80);
  const homeMaskStyle: React.CSSProperties =
    homeEdgeFadePx > 0
      ? {
          WebkitMaskImage: `linear-gradient(to bottom, transparent 0px, black ${homeEdgeFadePx}px, black calc(100% - ${homeEdgeFadePx}px), transparent 100%)`,
          maskImage: `linear-gradient(to bottom, transparent 0px, black ${homeEdgeFadePx}px, black calc(100% - ${homeEdgeFadePx}px), transparent 100%)`,
        }
      : {};

  // Height (0 to 100 scale: 0 is lowest compact height, 100 is max height)
  const posterHeightPercent = useMemo(() => {
    const raw = homePoster?.posterHeight;
    if (raw === undefined || raw === null) return 50;
    const num = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    if (isNaN(num)) return 50;
    if (num > 100) {
      return Math.round(Math.min(Math.max((num - 180) / 380 * 100, 0), 100));
    }
    return Math.min(Math.max(num, 0), 100);
  }, [homePoster?.posterHeight]);

  const computedPosterHeightPx = useMemo(() => {
    // 0 = compact minimum (~220px for text overlay so all text and button fit completely; ~140px clean image)
    // 100 = full banner height (~540px)
    const minPx = shouldShowTextOverlay ? 220 : 140;
    const maxPx = shouldShowTextOverlay ? 540 : 480;
    return Math.round(minPx + (posterHeightPercent / 100) * (maxPx - minPx));
  }, [shouldShowTextOverlay, posterHeightPercent]);

  // Mobile phone specific height (much shorter/lower as requested: ~150px - 210px with text overlay, ~95px - 150px clean image)
  const computedMobilePosterHeightPx = useMemo(() => {
    const minMobilePx = shouldShowTextOverlay ? 150 : 95;
    const maxMobilePx = shouldShowTextOverlay ? 210 : 150;
    return Math.round(minMobilePx + (posterHeightPercent / 100) * (maxMobilePx - minMobilePx));
  }, [shouldShowTextOverlay, posterHeightPercent]);

  return (
    <div className="w-full space-y-0 animate-fade-in">
      {/* 1. Hero Banner Auto-slide Carousel (Full-width edge-to-edge flush right, zero margin, no rounded corners) */}
      {!homePoster?.hidden && !homePoster?.hidePoster && (
        <>
          <style>{`
            .hero-poster-banner {
              min-height: var(--poster-h-mobile, 175px);
              ${!shouldShowTextOverlay ? 'height: var(--poster-h-mobile, 120px);' : ''}
            }
            @media (min-width: 640px) {
              .hero-poster-banner {
                min-height: var(--poster-h-desktop, 380px);
                ${!shouldShowTextOverlay ? 'height: var(--poster-h-desktop, 380px);' : ''}
              }
            }
          `}</style>
          <div
            onMouseEnter={() => setIsHeroPaused(true)}
            onMouseLeave={() => setIsHeroPaused(false)}
            className="hero-poster-banner relative w-full rounded-none overflow-hidden shadow-md bg-slate-950 flex items-end group transition-all"
            style={{
              ['--poster-h-mobile' as any]: `${computedMobilePosterHeightPx}px`,
              ['--poster-h-desktop' as any]: `${computedPosterHeightPx}px`,
              aspectRatio:
                !shouldShowTextOverlay && homePoster?.posterAspectRatio && homePoster.posterAspectRatio !== 'auto'
                  ? homePoster.posterAspectRatio
                  : undefined,
              ...homeMaskStyle,
            }}
          >
            {/* Background Video or Image Carousel Slider */}
            {showVideoMode && posterVideoUrl ? (
              <div className="absolute inset-0 z-0 overflow-hidden bg-black">
                {ytEmbedUrl ? (
                  <iframe
                    src={ytEmbedUrl}
                    title="Hero Background Video"
                    className="w-full h-full object-cover scale-125 opacity-90 pointer-events-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : isDirectVideo ? (
                  <video
                    src={posterVideoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <iframe
                    src={posterVideoUrl}
                    title="Hero Media Embed"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ) : (
              heroImages.map((imgUrl, index) => {
                const custom = homePoster?.imageCustomSettings?.[index];
                const imgFit = custom?.fit || homePoster?.posterFit || 'cover';
                const imgPosition = custom?.position || (Array.isArray(homePoster?.bgPositions) && homePoster.bgPositions[index]) || homePoster?.bgPosition || '50% 50%';
                const imgScale = (custom?.scale !== undefined ? custom.scale : (homePoster?.posterScale !== undefined ? homePoster.posterScale : 100)) / 100;
                const imgBrightness = custom?.brightness ?? homePoster?.posterBrightness;
                const imgContrast = custom?.contrast ?? homePoster?.posterContrast;
                const imgSaturation = custom?.saturation ?? homePoster?.posterSaturation;
                const imgBlur = custom?.blur ?? homePoster?.posterBlur;

                return (
                  <img
                    key={index}
                    src={imgUrl}
                    alt={`Poster banner ${index + 1}`}
                    onError={(e) => {
                      const fallback = DEFAULT_HERO_SLIDES[index % DEFAULT_HERO_SLIDES.length];
                      if ((e.target as HTMLImageElement).src !== fallback) {
                        (e.target as HTMLImageElement).src = fallback;
                      }
                    }}
                    className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out transform ${
                      index === activeHeroIndex
                        ? 'opacity-100 z-0'
                        : 'opacity-0 pointer-events-none -z-10'
                    }`}
                    style={{
                      objectFit: imgFit,
                      objectPosition: imgPosition,
                      transformOrigin: imgPosition,
                      transform: index === activeHeroIndex ? `scale(${imgScale})` : `scale(${imgScale * 1.02})`,
                      filter: [
                        imgBrightness !== undefined ? `brightness(${imgBrightness}%)` : '',
                        imgContrast !== undefined ? `contrast(${imgContrast}%)` : '',
                        imgSaturation !== undefined ? `saturate(${imgSaturation}%)` : '',
                        imgBlur !== undefined ? `blur(${imgBlur}px)` : '',
                      ].filter(Boolean).join(' ') || undefined,
                    }}
                  />
                );
              })
            )}

            {/* Conditional Gradient Overlay - ONLY shown when text overlay is enabled */}
            {shouldShowTextOverlay && (
              <div
                className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-black/25 pointer-events-none z-10"
                style={{
                  opacity: homePoster?.posterOverlayOpacity !== undefined ? homePoster.posterOverlayOpacity / 100 : undefined
                }}
              />
            )}

            {/* Text Content Overlay - ONLY rendered if shouldShowTextOverlay is enabled */}
            {shouldShowTextOverlay && (
              <div
                className={`relative z-20 w-full ${
                  posterHeightPercent < 30
                    ? 'pt-2 sm:pt-6 pb-2 sm:pb-4 px-3 sm:px-6 space-y-1 sm:space-y-2'
                    : posterHeightPercent < 70
                    ? 'pt-2.5 sm:pt-8 pb-2.5 sm:pb-6 px-3.5 sm:px-7 space-y-1 sm:space-y-2.5'
                    : 'pt-3.5 sm:pt-12 pb-3 sm:pb-8 px-4 sm:px-10 space-y-1.5 sm:space-y-3'
                }`}
              >
                {heroSubtitle && (
                  <div className="pt-0.5">
                    <span
                      className={`inline-flex items-center gap-1 sm:gap-1.5 bg-[#cc0000] text-white font-black rounded-none shadow-sm tracking-wider uppercase border-l-2 border-white/60 ${
                        posterHeightPercent < 30
                          ? 'px-2 py-0.5 text-[9px] sm:text-xs'
                          : 'px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs'
                      }`}
                    >
                      <span>{heroSubtitle}</span>
                    </span>
                  </div>
                )}

                <h2
                  className={`font-black text-white leading-tight drop-shadow-lg max-w-4xl tracking-tight ${
                    posterHeightPercent < 30
                      ? 'text-sm sm:text-xl md:text-2xl'
                      : posterHeightPercent < 70
                      ? 'text-sm sm:text-2xl md:text-3xl'
                      : 'text-base sm:text-2xl md:text-3xl lg:text-4xl'
                  }`}
                >
                  {heroTitle}
                </h2>

                <p
                  className="text-slate-100 max-w-3xl leading-snug sm:leading-relaxed font-normal sm:font-semibold drop-shadow-md text-[10.5px] sm:text-sm md:text-base line-clamp-2 sm:line-clamp-none"
                >
                  {heroDesc}
                </p>

                <div className="pt-0.5 sm:pt-1.5 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                  {onNavigateToDashboard && (
                    <button
                      type="button"
                      onClick={onNavigateToDashboard}
                      className="px-2.5 py-1 sm:px-4 sm:py-2 bg-[#cc0000] hover:bg-black text-white border border-red-400/60 hover:border-white/40 text-[10px] sm:text-xs font-bold rounded-lg flex items-center gap-1 sm:gap-1.5 shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer tracking-normal"
                    >
                      <span>{buttonText}</span>
                      <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 1.4 Home Tab Content Container (Evenly padded and flush with site boundary) */}
      <div className="w-full px-2 sm:px-4 lg:px-6 space-y-8 pt-4 sm:pt-6 pb-10">
        {/* 1.5 ງານທີ່ຈະມາເຖິງ (ແຈ້ງການ & ປະກາດ - Upcoming Events Poster Banner: ບໍ່ເອົາຂອບ ຫຼື ບ໋ອກ, ຮູບເປັນພາບພື້ນຫຼັງເຕັມຈໍແບບໂພສເຕີ) */}
        <UpcomingEventPoster
          homePoster={homePoster || null}
          language={language}
          onOpenFlyerModal={(url) => setSelectedFlyerModal(url)}
        />

        {/* 2. Events & Media News Section */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-2.5 sm:mb-4">
          <div>
            <h2 className="text-xs xs:text-sm sm:text-xl font-bold sm:font-black text-slate-900 dark:text-white tracking-tight border-l-2 sm:border-l-4 border-[#cc0000] pl-2 sm:pl-3 flex items-center gap-1.5 sm:gap-2.5">
              <Calendar className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#cc0000] shrink-0" />
              <span>
                {language === 'lo'
                  ? 'ກິດຈະກຳ ແລະ ຂ່າວສານພັນທະກິດ'
                  : language === 'th'
                  ? 'กิจกรรมและข่าวสารพันธกิจ'
                  : 'Field Events & News Gallery'}
              </span>
            </h2>
          </div>
        </div>

        {visibleEvents.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-none p-8 text-center border border-slate-200 dark:border-slate-700 text-slate-400 text-xs font-medium">
            {language === 'lo'
              ? 'ຍັງບໍ່ມີຂໍ້ມູນກິດຈະກຳໃນລະບົບ'
              : language === 'th'
              ? 'ยังไม่มีข้อมูลกิจกรรมในระบบ'
              : 'No upcoming events listed at the moment.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 items-start">
            {visibleEvents.map((e) => {
              const eventId = e.rowId || e.id || Math.random();
              const files = getEventFiles(e);
              const isCardOpen = !closedCardIds[eventId];

              const displayTitle =
                (language === 'en' && e.titleEn?.trim() ? e.titleEn.trim() : undefined) ||
                (language === 'th' && e.titleTh?.trim() ? e.titleTh.trim() : undefined) ||
                (e.title?.trim() ? e.title.trim() : undefined) ||
                (e.titleEn?.trim() ? e.titleEn.trim() : undefined) ||
                (e.titleTh?.trim() ? e.titleTh.trim() : undefined) ||
                (language === 'lo' ? 'ກິດຈະກຳ ແລະ ລາຍງານ' : language === 'th' ? 'กิจกรรมและรายงาน' : 'Event Report');

              const rawDesc =
                (language === 'en' && e.descriptionEn?.trim() ? e.descriptionEn.trim() : undefined) ||
                (language === 'th' && e.descriptionTh?.trim() ? e.descriptionTh.trim() : undefined) ||
                (e.description?.trim() ? e.description.trim() : undefined) ||
                (e.descriptionEn?.trim() ? e.descriptionEn.trim() : undefined) ||
                (e.descriptionTh?.trim() ? e.descriptionTh.trim() : undefined) ||
                '';
              const cleanDesc = rawDesc
                .replace(/<[^>]*>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

              const fileItem = files[0] || {
                url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800',
                isDoc: false,
              };
              const isPdf =
                fileItem.isDoc ||
                fileItem.url.toLowerCase().endsWith('.pdf') ||
                fileItem.url.toLowerCase().includes('application/pdf');

              return (
                <article
                  key={eventId}
                  id={`event-card-${eventId}`}
                  className="bg-white dark:bg-slate-900 rounded-none border border-slate-200 dark:border-slate-800 hover:border-[#cc0000]/50 dark:hover:border-[#cc0000]/60 flex flex-row sm:flex-col overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group"
                >
                  {/* 1. IMAGE: Left side on mobile (height follows text), Top on desktop */}
                  <div
                    className="w-24 xs:w-28 sm:w-full min-w-[90px] xs:min-w-[110px] max-w-[32%] sm:max-w-none bg-slate-100 dark:bg-slate-950 overflow-hidden relative shrink-0 self-stretch sm:self-auto sm:h-44 md:h-48 rounded-none select-none"
                  >
                    {isPdf ? (
                      <div className="absolute inset-0 sm:relative sm:inset-auto w-full h-full">
                        <PdfThumbnail
                          url={fileItem.url}
                          title={displayTitle}
                          className="w-full h-full object-contain block rounded-none bg-slate-100 dark:bg-slate-900"
                        />
                      </div>
                    ) : (
                      <img
                        src={fileItem.url || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800'}
                        alt={displayTitle}
                        className="absolute inset-0 sm:relative sm:inset-auto w-full h-full object-cover rounded-none block"
                        loading="lazy"
                        onError={(err) => {
                          (err.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800';
                        }}
                      />
                    )}
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* 2. CARD CONTENT: Right side on mobile, Bottom on desktop */}
                  <div className="p-2 xs:p-2.5 sm:p-3.5 flex flex-col justify-center flex-1 min-w-0">
                    <div>
                      {/* Title (Clicking title toggles open/close) */}
                      <button
                        type="button"
                        onClick={() => toggleCardOpen(eventId)}
                        className="text-left w-full group/title cursor-pointer focus:outline-none block mb-1 sm:mb-1.5"
                        title={language === 'lo' ? 'ຄິກໃສ່ຫົວຂໍ້ເພື່ອເປີດ/ປິດ' : 'Click title to toggle open/close'}
                      >
                        <h3 className="font-bold sm:font-black text-[11px] xs:text-xs sm:text-xs md:text-sm text-slate-900 dark:text-white uppercase tracking-tight leading-snug group-hover/title:text-[#cc0000] dark:group-hover/title:text-red-400 transition-colors">
                          {displayTitle}
                        </h3>
                      </button>

                      {/* 3. DESCRIPTION with integrated arrow button - eliminates empty gaps completely */}
                      {isCardOpen && cleanDesc && (
                        <p className="text-[10px] xs:text-[10.5px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line text-justify [text-align:justify] break-words">
                          {cleanDesc}
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setSelectedReportEvent(e);
                            }}
                            className="inline-flex w-4.5 h-4.5 xs:w-5 xs:h-5 sm:w-5.5 sm:h-5.5 ml-1.5 align-middle rounded-none items-center justify-center shrink-0 transition-all duration-300 cursor-pointer shadow-xs bg-[#cc0000] hover:bg-black text-white hover:scale-105 active:scale-95 border border-red-700/40 relative -top-[1px]"
                            title={
                              language === 'lo'
                                ? 'ກົດເພື່ອເບິ່ງລາຍລະອຽດ'
                                : language === 'th'
                                ? 'ดูรายละเอียด'
                                : 'View details'
                            }
                          >
                            <ArrowRight className="w-2.5 h-2.5 xs:w-3 xs:h-3 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        </p>
                      )}

                      {/* Fallback button when description is hidden */}
                      {(!isCardOpen || !cleanDesc) && (
                        <div className="mt-1 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setSelectedReportEvent(e);
                            }}
                            className="w-5 h-5 xs:w-5.5 xs:h-5.5 rounded-none flex items-center justify-center shrink-0 transition-all duration-300 cursor-pointer shadow-xs bg-[#cc0000] hover:bg-black text-white hover:scale-105 active:scale-95 border border-red-700/40"
                            title={
                              language === 'lo'
                                ? 'ກົດເພື່ອເບິ່ງລາຍລະອຽດ'
                                : language === 'th'
                                ? 'ดูรายละเอียด'
                                : 'View details'
                            }
                          >
                            <ArrowRight className="w-2.5 h-2.5 xs:w-3 xs:h-3 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      </div>

      {/* Corporate Field Report Modal (Read-only on Home Page) */}
      <EventReportModal
        event={selectedReportEvent}
        isOpen={Boolean(selectedReportEvent)}
        onClose={() => setSelectedReportEvent(null)}
        language={language}
        isAdmin={false}
        onEventUpdated={(updatedEv) => {
          setSelectedReportEvent(updatedEv);
        }}
      />

      {/* Full Resolution Flyer Lightbox Modal */}
      {selectedFlyerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs transition-opacity"
          onClick={() => setSelectedFlyerModal(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-950 rounded-none overflow-hidden shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedFlyerModal(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-none bg-black/80 hover:bg-black text-white border border-white/20 transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedFlyerModal}
              alt="Upcoming Event Flyer"
              className="w-full h-auto max-h-[85vh] object-contain rounded-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
