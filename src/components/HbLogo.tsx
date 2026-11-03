import React, { useState, useEffect } from 'react';
import { getCachedUploadUrl, resolveUploadUrl } from '../utils/fileUploader';

interface HbLogoProps {
  className?: string;
  size?: number;
  alt?: string;
  logoUrl?: string;
  disableDarkOutline?: boolean;
}

export const HbLogo: React.FC<HbLogoProps> = ({
  className = 'h-9 w-auto',
  size,
  alt = 'Hope Bokeo HB Logo',
  logoUrl,
  disableDarkOutline = false,
}) => {
  const [currentLogo, setCurrentLogo] = useState<string>(() => {
    if (logoUrl) return getCachedUploadUrl(logoUrl);
    try {
      const saved = localStorage.getItem('hb_custom_logo');
      if (saved) return getCachedUploadUrl(saved);
    } catch {
      // ignore
    }
    return '/hb-logo.svg';
  });

  useEffect(() => {
    let target = '/hb-logo.svg';
    if (logoUrl) {
      target = logoUrl;
    } else {
      try {
        const saved = localStorage.getItem('hb_custom_logo');
        if (saved) {
          target = saved;
        }
      } catch {
        // ignore
      }
    }
    const cached = getCachedUploadUrl(target);
    setCurrentLogo(cached);
    if (target.startsWith('/uploads/') && cached === target) {
      resolveUploadUrl(target)
        .then((resolved) => {
          if (resolved && resolved !== target) {
            setCurrentLogo(resolved);
          }
        })
        .catch(() => {});
    }
  }, [logoUrl]);

  // Listen to custom logo updates in real-time
  useEffect(() => {
    const handleLogoUpdate = (e: any) => {
      if (e?.detail && typeof e.detail === 'string') {
        const target = e.detail;
        setCurrentLogo(getCachedUploadUrl(target));
        if (target.startsWith('/uploads/')) {
          resolveUploadUrl(target)
            .then((resolved) => {
              if (resolved && resolved !== target) {
                setCurrentLogo(resolved);
              }
            })
            .catch(() => {});
        }
      } else {
        try {
          const saved = localStorage.getItem('hb_custom_logo');
          if (saved) {
            setCurrentLogo(getCachedUploadUrl(saved));
            return;
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('hb_logo_updated', handleLogoUpdate as EventListener);
    window.addEventListener('storage', handleLogoUpdate as EventListener);
    return () => {
      window.removeEventListener('hb_logo_updated', handleLogoUpdate as EventListener);
      window.removeEventListener('storage', handleLogoUpdate as EventListener);
    };
  }, []);

  return (
    <img
      src={currentLogo}
      alt={alt}
      className={`object-contain shrink-0 ${
        !disableDarkOutline ? 'hb-logo-dark-outline' : ''
      } ${className}`}
      style={size ? { height: `${size}px`, width: 'auto' } : undefined}
      onError={() => {
        if (currentLogo.startsWith('/uploads/')) {
          resolveUploadUrl(currentLogo)
            .then((resolved) => {
              if (resolved && resolved !== currentLogo) {
                setCurrentLogo(resolved);
              } else {
                setCurrentLogo('/hb-logo.svg');
              }
            })
            .catch(() => {
              setCurrentLogo('/hb-logo.svg');
            });
        } else if (currentLogo !== '/hb-logo.svg') {
          setCurrentLogo('/hb-logo.svg');
        }
      }}
    />
  );
};

