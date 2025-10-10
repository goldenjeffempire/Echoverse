/**
 * MEDIUM PRIORITY FIX #63: Lazy loading images
 * Loads images only when in viewport
 */

import { useState, useEffect } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E',
  threshold = 0.01,
  rootMargin = '50px',
  onLoad,
  onError,
  className = '',
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const { isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin,
    freezeOnceVisible: true,
  });

  useEffect(() => {
    if (!isIntersecting || !imageRef) return;

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      onLoad?.();
    };

    img.onerror = () => {
      onError?.();
    };
  }, [isIntersecting, src, imageRef, onLoad, onError]);

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={className}
      {...props}
    />
  );
}
