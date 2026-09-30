import React, { useState, useEffect } from 'react';
import { MinistryTimelineItem, Language } from '../types';

interface TimelineImageSlideshowProps {
  images: string[];
  title?: string;
  year?: string;
  language: Language;
}

const TimelineImageSlideshow: React.FC<TimelineImageSlideshowProps> = ({
  images,
  title,
  year,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000); // Transitions every 4 seconds
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="w-full">
      {/* Main Image (Single or Auto-slideshow every 4s, non-clickable) */}
      <div
        className="relative w-full h-40 sm:h-44 bg-slate-100 dark:bg-slate-950 overflow-hidden select-none border border-slate-200 dark:border-slate-800 shadow-xs"
      >
        {images.map((imgUrl, idx) => (
          <img
            key={imgUrl + idx}
            src={imgUrl}
            alt={`${title || year || 'Milestone photo'} ${idx + 1}`}
            className={`absolute inset-0 w-full h-full object-cover block transition-opacity duration-700 ease-in-out select-none ${
              idx === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            referrerPolicy="no-referrer"
          />
        ))}

        {/* Bottom subtle progress dots if multiple photos */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-xs rounded-full">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`block h-1 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-3 bg-white' : 'w-1 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface MinistryTimelineProps {
  timeline: MinistryTimelineItem[];
  language: Language;
  title?: string;
  titleEn?: string;
  titleTh?: string;
}

export const MinistryTimeline: React.FC<MinistryTimelineProps> = ({
  timeline,
  language,
  title,
  titleEn,
  titleTh,
}) => {
  if (!timeline || timeline.length === 0) {
    return null;
  }

  // Sort timeline items by order or keep as is
  const sortedTimeline = [...timeline].sort((a, b) => (a.order || 0) - (b.order || 0));

  const normalizedTitleEn =
    titleEn === 'Ministry Journey & Timeline'
      ? 'Story timeline'
      : (titleEn || (title === 'ຈຸດເລີ່ມຕົ້ນ ແລະ ການເດີນທາງຂອງພັນທະກິດ' ? 'Story timeline' : (title || 'Story timeline')));

  const displayTitle =
    language === 'en'
      ? normalizedTitleEn
      : language === 'th'
      ? (titleTh || title)
      : (title || normalizedTitleEn || titleTh);

  return (
    <div className="pt-4 space-y-6">
      {displayTitle && (
        <div className="border-t border-slate-200 dark:border-slate-700/80 pt-5">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#cc0000]" />
            <span>{displayTitle}</span>
          </h3>
        </div>
      )}

      {/* Vertical Timeline with continuous line on the FAR LEFT */}
      <div className="relative">
        {/* Continuous Far-Left Line */}
        <div
          className="absolute left-3 top-3 bottom-6 w-0.5 sm:w-1 bg-[#cc0000] -translate-x-1/2"
        />

        {/* Timeline items list */}
        <div className="space-y-6 sm:space-y-7">
          {sortedTimeline.map((item, idx) => {
            const itemTitle =
              language === 'en' && item.titleEn
                ? item.titleEn
                : language === 'th' && item.titleTh
                ? item.titleTh
                : item.title;

            const itemDesc =
              language === 'en' && item.descriptionEn
                ? item.descriptionEn
                : language === 'th' && item.descriptionTh
                ? item.descriptionTh
                : item.description;

            // Collect all images (either single imageUrl or imageUrls array)
            const allImages: string[] = [];
            if (item.imageUrl && item.imageUrl.trim()) {
              allImages.push(item.imageUrl.trim());
            }
            if (Array.isArray(item.imageUrls)) {
              item.imageUrls.forEach((url) => {
                if (url && url.trim() && !allImages.includes(url.trim())) {
                  allImages.push(url.trim());
                }
              });
            }

            return (
              <div
                key={item.id || idx}
                className="relative flex items-start group"
              >
                {/* 1. Milestone Dot: EXACTLY Centered ON the line at left-3 */}
                <div
                  className="absolute left-3 top-2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#cc0000] border-2 sm:border-3 border-white dark:border-slate-900 shadow-sm z-10 -translate-x-1/2 group-hover:scale-125 transition-transform"
                />

                {/* 2 & 3. Content without card background, padded right of line */}
                <div className="pl-8 sm:pl-10 flex-1 min-w-0">
                  {/* Top Row: Year in pure RED digits near line */}
                  <div className="flex flex-wrap items-baseline gap-2 mb-1">
                    {/* 2. Year: Only numbers, bold Red, placed right next to line */}
                    <span className="text-xl sm:text-2xl font-black text-[#cc0000] tracking-tight leading-none">
                      {item.year || ''}
                    </span>
                  </div>

                  {/* 4. Layout: Text on Left, Small Event-Sized Image on Right */}
                  <div className="flex flex-col md:flex-row md:items-start gap-4 sm:gap-6 mt-1">
                    {/* LEFT: Text Info (Title + Description) */}
                    <div className="flex-1 min-w-0">
                      {itemTitle && (
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                          {itemTitle}
                        </h3>
                      )}

                      {itemDesc && (
                        <div className="mt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line text-justify [text-align-last:left]">
                          {itemDesc}
                        </div>
                      )}
                    </div>

                    {/* RIGHT: Small Image matching Event Card Size with auto-slideshow every 4s and clean look */}
                    {allImages.length > 0 && (
                      <div className="shrink-0 w-full sm:w-64 md:w-72 mt-2 md:mt-0">
                        <TimelineImageSlideshow
                          images={allImages}
                          title={itemTitle}
                          year={item.year}
                          language={language}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
