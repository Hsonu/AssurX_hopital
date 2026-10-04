import React, { useState, useEffect, useRef, ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  minHeight?: string | number;
  rootMargin?: string;
  className?: string;
  id?: string;
  fallback?: ReactNode;
}

/**
 * LazySection renders its children only when scrolled near the viewport.
 * This dramatically improves initial page load speed, decreases bandwidth,
 * prevents server connection exhaustion (ERR_CONNECTION_CLOSED), and creates
 * a smooth step-by-step progressive load experience.
 */
export default function LazySection({
  children,
  minHeight = '200px',
  rootMargin = '300px 0px',
  className = '',
  id,
  fallback
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If already visible, no need to observe
    if (isVisible) return;

    // Fallback for environments without IntersectionObserver
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin, // Pre-loads 300px before scrolling into viewport
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isVisible, rootMargin]);

  return (
    <div
      ref={containerRef}
      id={id}
      className={`transition-opacity duration-500 ${className} ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        minHeight: isVisible ? undefined : minHeight,
        contentVisibility: isVisible ? 'visible' : 'auto',
        containIntrinsicSize: isVisible ? undefined : `1px ${typeof minHeight === 'number' ? `${minHeight}px` : minHeight}`
      }}
    >
      {isVisible ? (
        children
      ) : fallback ? (
        fallback
      ) : (
        <div
          className="w-full flex items-center justify-center py-12 text-slate-300"
          style={{ minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }}
        >
          <div className="w-6 h-6 border-2 border-[#009688]/30 border-t-[#009688] rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
