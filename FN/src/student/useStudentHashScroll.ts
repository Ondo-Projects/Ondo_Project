import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollToStudentSection } from './studentUtils';

export function useStudentHashScroll(onNavigateSection?: (sectionId: string) => void) {
  const location = useLocation();

  useEffect(() => {
    const sectionId = location.hash.replace('#', '');
    if (!sectionId) {
      return;
    }

    const timer = window.setTimeout(() => {
      onNavigateSection?.(sectionId);
      scrollToStudentSection(sectionId);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [location.hash, location.pathname, onNavigateSection]);
}
