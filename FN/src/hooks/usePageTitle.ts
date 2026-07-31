import { useEffect } from 'react';

const DEFAULT_TITLE = '온도';

export function usePageTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    return () => {
      document.title = previousTitle || DEFAULT_TITLE;
    };
  }, [title]);
}
