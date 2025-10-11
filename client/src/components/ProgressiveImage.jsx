/**
 * Progressive Image Loading Component - PHASE 4.6 Enhanced
 *
 * Features:
 * - Blur-up placeholders for smooth loading
 * - Lazy loading with Intersection Observer
 * - Error handling with fallback images
 * - Loading states and animations
 */
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
export function ProgressiveImage({ src, placeholderSrc, alt, className = '', width, height, lazy = true, onLoad, onError, fallbackSrc = '/placeholder-image.png' }) {
    const [imgSrc, setImgSrc] = useState(placeholderSrc || fallbackSrc);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);
    useEffect(() => {
        if (!src) {
            setIsLoading(false);
            setHasError(true);
            return;
        }
        // Lazy loading with Intersection Observer
        if (lazy && imgRef.current) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        loadImage();
                        observer.disconnect();
                    }
                });
            }, { rootMargin: '100px' } // Start loading 100px before viewport
            );
            observer.observe(imgRef.current);
            return () => observer.disconnect();
        }
        else {
            loadImage();
        }
    }, [src, lazy]);
    const loadImage = () => {
        const img = new Image();
        img.onload = () => {
            setImgSrc(src);
            setIsLoading(false);
            onLoad?.();
        };
        img.onerror = () => {
            setImgSrc(fallbackSrc);
            setIsLoading(false);
            setHasError(true);
            onError?.();
            console.error(`[ProgressiveImage] Failed to load: ${src}`);
        };
        img.src = src;
    };
    return (<div className={cn('relative overflow-hidden', className)} style={{ width, height }}>
      <img ref={imgRef} src={imgSrc} alt={alt} className={cn('w-full h-full object-cover transition-all duration-500', isLoading && 'blur-sm scale-105', !isLoading && 'blur-0 scale-100', hasError && 'opacity-50')} width={width} height={height} loading={lazy ? 'lazy' : 'eager'}/>
      
      {isLoading && (<div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse"/>)}

      {hasError && (<div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">Image unavailable</span>
        </div>)}
    </div>);
}
