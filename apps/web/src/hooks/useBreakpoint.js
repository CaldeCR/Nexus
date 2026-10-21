import { useState, useEffect } from 'react';

/**
 * Hook para detectar el breakpoint actual según NEXUS-REDISENO-UI:
 * - mobile: < 768px
 * - tablet: 768px - 1023px
 * - laptop: 1024px - 1279px
 * - desktop: >= 1280px
 */
export function useBreakpoint() {
  const getBreakpoint = () => {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    if (w < 1280) return 'laptop';
    return 'desktop';
  };

  const [breakpoint, setBreakpoint] = useState(getBreakpoint);

  useEffect(() => {
    const handleResize = () => setBreakpoint(getBreakpoint());
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}
