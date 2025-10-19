# Performance Budget

**Last Updated**: October 19, 2025

## Overview

This document defines the performance budget for our application. These metrics ensure we maintain a fast, responsive user experience.

## Bundle Size Budget

### JavaScript
| Category | Budget | Current | Status |
|----------|--------|---------|--------|
| Initial Bundle | 150 KB | ~120 KB | ✅ PASS |
| Vendor Chunk | 300 KB | ~280 KB | ✅ PASS |
| UI Chunk | 150 KB | ~130 KB | ✅ PASS |
| Route Chunks | 50 KB each | ~40 KB avg | ✅ PASS |
| **Total (First Load)** | **500 KB** | **~450 KB** | ✅ PASS |

### CSS
| Category | Budget | Current | Status |
|----------|--------|---------|--------|
| Critical CSS | 20 KB | ~15 KB | ✅ PASS |
| Main Stylesheet | 50 KB | ~45 KB | ✅ PASS |
| **Total CSS** | **70 KB** | **~60 KB** | ✅ PASS |

### Images
| Type | Budget | Notes |
|------|--------|-------|
| Hero Images | 200 KB | WebP format |
| Thumbnails | 20 KB | Lazy loaded |
| Icons | 5 KB | Inline SVG preferred |
| Avatars | 10 KB | Optimized |

## Loading Performance

### Core Web Vitals

| Metric | Target | Acceptable | Current | Status |
|--------|--------|------------|---------|--------|
| **LCP** (Largest Contentful Paint) | < 2.5s | < 4.0s | ~2.1s | ✅ PASS |
| **FID** (First Input Delay) | < 100ms | < 300ms | ~80ms | ✅ PASS |
| **CLS** (Cumulative Layout Shift) | < 0.1 | < 0.25 | ~0.05 | ✅ PASS |
| **FCP** (First Contentful Paint) | < 1.8s | < 3.0s | ~1.5s | ✅ PASS |
| **TTI** (Time to Interactive) | < 3.8s | < 7.3s | ~3.2s | ✅ PASS |
| **TBT** (Total Blocking Time) | < 200ms | < 600ms | ~180ms | ✅ PASS |

### Page Load Metrics

| Page Type | Target Load Time | Target Time to Interactive |
|-----------|------------------|----------------------------|
| Home Page | < 2.0s | < 3.0s |
| Product Pages | < 2.5s | < 3.5s |
| Dashboard | < 3.0s | < 4.0s |
| Search Results | < 2.5s | < 3.5s |

## Network Performance

### API Response Times

| Endpoint Type | Target | Acceptable | Notes |
|---------------|--------|------------|-------|
| Read (GET) | < 200ms | < 500ms | Cached responses |
| Write (POST/PUT) | < 500ms | < 1000ms | Database operations |
| Search | < 300ms | < 800ms | Full-text search |
| File Upload | < 2s | < 5s | For 10MB files |
| Webhook Delivery | < 3s | < 10s | With retries |

### Database Queries

| Query Type | Target | Acceptable | Notes |
|------------|--------|------------|-------|
| Simple SELECT | < 50ms | < 100ms | Single table |
| JOIN queries | < 100ms | < 200ms | 2-3 tables |
| Aggregations | < 200ms | < 500ms | With proper indexes |
| Full-text Search | < 150ms | < 300ms | Indexed columns |

## Resource Limits

### Memory
| Component | Budget | Alerts At |
|-----------|--------|-----------|
| Client (Browser) | 100 MB | 150 MB |
| Server (Per Process) | 512 MB | 768 MB |
| Database Connections | 10 connections | 15 connections |

### Network
| Metric | Budget | Notes |
|--------|--------|-------|
| Initial Page Load | 1.5 MB | Includes all critical resources |
| API Requests/Page | 10 requests | Initial render |
| WebSocket Messages | 100/min | Per connection |

## Monitoring and Alerts

### Automated Monitoring
- **Lighthouse CI**: Run on every PR
- **Bundle Analyzer**: Weekly automated reports
- **Performance Monitoring**: Continuous with alerts
- **Core Web Vitals**: Real User Monitoring (RUM)

### Alert Thresholds
| Metric | Warning | Critical |
|--------|---------|----------|
| Bundle Size | > 450 KB | > 500 KB |
| LCP | > 2.5s | > 4.0s |
| FID | > 100ms | > 300ms |
| API Response | > 500ms | > 1000ms |
| Error Rate | > 1% | > 5% |

## Optimization Strategies

### Implemented ✅
1. **Code Splitting**: Routes and heavy dependencies lazy loaded (#27)
2. **Tree Shaking**: Unused code eliminated
3. **Minification**: Production builds minified
4. **Compression**: Gzip/Brotli enabled
5. **CDN**: Static assets served via CDN
6. **Image Optimization**: WebP format, lazy loading
7. **Caching**: Browser and server-side caching
8. **Database Indexes**: Optimized query performance

### Planned 🔄
1. **Preloading**: Critical resources (#30)
2. **Service Worker**: Offline support and caching (#29)
3. **HTTP/2 Push**: Critical assets (#30)
4. **Resource Hints**: dns-prefetch, preconnect (#30)
5. **Image Sprites**: For frequently used icons (#30)
6. **Virtual Scrolling**: Large lists (#85)
7. **Pagination**: Infinite scroll optimization (#43)

## Testing

### Performance Testing Tools
- **Lighthouse**: Desktop and mobile scores > 90
- **WebPageTest**: Monthly tests on real devices
- **Chrome DevTools**: Local development profiling
- **Bundle Analyzer**: Webpack bundle analysis

### Load Testing
| Scenario | Target | Current |
|----------|--------|---------|
| Concurrent Users | 1000 users | Tested to 800 |
| Requests/Second | 500 req/s | Tested to 400 |
| Database Queries | 100 queries/s | Tested to 80 |

## Enforcement

### Build Pipeline
```bash
# Bundle size check (fails build if exceeded)
npm run build:analyze

# Lighthouse CI (fails if score < 90)
npm run lighthouse

# Performance tests
npm run test:performance
```

### Code Review Checklist
- [ ] New features don't increase bundle size > 10%
- [ ] Images optimized and lazy loaded
- [ ] API responses < 500ms
- [ ] No unnecessary re-renders
- [ ] Database queries indexed
- [ ] Code split for heavy dependencies

## Reporting

### Weekly Reports
- Bundle size trends
- Core Web Vitals metrics
- API response times
- Error rates

### Monthly Reviews
- Performance budget adjustments
- Optimization opportunities
- User experience metrics
- Competitive benchmarking

## References

- [Web.dev Performance](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

**Budget Revision**: This budget should be reviewed quarterly and adjusted based on:
- User feedback and analytics
- Industry benchmarks
- Technology changes
- Business requirements
