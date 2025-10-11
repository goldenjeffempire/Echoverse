/**
 * MEDIUM-004: Image Optimization & Progressive Loading
 */

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  blur?: boolean;
}

export function optimizeImageUrl(src: string, options: ImageOptimizationOptions = {}): string {
  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    blur = false,
  } = options;

  const params = new URLSearchParams();
  
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  params.set('f', format);
  if (blur) params.set('blur', '20');

  return `/api/images/optimize?url=${encodeURIComponent(src)}&${params.toString()}`;
}

// Progressive image component helper
export function generateImageSrcSet(src: string, widths: number[]): string {
  return widths
    .map(width => `${optimizeImageUrl(src, { width })} ${width}w`)
    .join(', ');
}

export function generateImageSizes(breakpoints: Record<string, string>): string {
  return Object.entries(breakpoints)
    .map(([media, size]) => `${media} ${size}`)
    .join(', ');
}

// Lazy loading with Intersection Observer
export function lazyLoadImage(img: HTMLImageElement) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLImageElement;
        const src = target.dataset.src;
        const srcset = target.dataset.srcset;
        
        if (src) {
          target.src = src;
          target.removeAttribute('data-src');
        }
        
        if (srcset) {
          target.srcset = srcset;
          target.removeAttribute('data-srcset');
        }
        
        target.classList.add('loaded');
        observer.unobserve(target);
      }
    });
  }, {
    rootMargin: '50px',
  });

  observer.observe(img);
}

// Blur placeholder data URL
export function getBlurDataURL(width: number = 10, height: number = 10): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f0f0f0');
    gradient.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  return canvas.toDataURL();
}
