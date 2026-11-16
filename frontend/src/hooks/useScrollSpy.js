import { useState, useEffect } from 'react';

export function useScrollSpy(elementIds, offset = 180) {
  const [activeId, setActiveId] = useState(elementIds[0] || '');

  useEffect(() => {
    if (!elementIds || elementIds.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + offset;

      for (let i = elementIds.length - 1; i >= 0; i--) {
        const id = elementIds[i];
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveId(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [elementIds, offset]);

  return activeId;
}

