import React, { useState, useEffect } from 'react';

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
    if (logoUrl) return logoUrl;
    try {
      const saved = localStorage.getItem('hb_custom_logo');
      if (saved) return saved;
    } catch {
      // ignore
    }
    return '/hb-logo.svg';
  });

  useEffect(() => {
    if (logoUrl) {
      setCurrentLogo(logoUrl);
    } else {
      try {
        const saved = localStorage.getItem('hb_custom_logo');
        if (saved) {
          setCurrentLogo(saved);
          return;
        }
      } catch {
        // ignore
      }
      setCurrentLogo('/hb-logo.svg');
    }
  }, [logoUrl]);

  // Listen to custom logo updates in real-time
  useEffect(() => {
    const handleLogoUpdate = (e: any) => {
      if (e?.detail && typeof e.detail === 'string') {
        setCurrentLogo(e.detail);
      } else {
        try {
          const saved = localStorage.getItem('hb_custom_logo');
          if (saved) {
            setCurrentLogo(saved);
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
        if (currentLogo !== '/hb-logo.svg') {
          setCurrentLogo('/hb-logo.svg');
        }
      }}
    />
  );
};

