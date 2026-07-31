import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollToTeacherSection } from './teacherUtils';

export function useTeacherHashScroll(onNavigateSection?: (sectionId: string) => void) {
  const location = useLocation();

  useEffect(() => {
    const sectionId = location.hash.replace('#', '');
    if (!sectionId) {
      return;
    }

    const timer = window.setTimeout(() => {
      onNavigateSection?.(sectionId);
      scrollToTeacherSection(sectionId);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [location.hash, location.pathname, onNavigateSection]);
}
