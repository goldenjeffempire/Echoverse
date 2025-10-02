# EchoVerse Platform Design Guidelines

## Design Approach: Enterprise Design System with Modern Polish

**Selected Approach**: Hybrid approach combining Material Design principles with custom enterprise patterns
**Justification**: This comprehensive platform requires both the reliability of established design systems and the flexibility for complex enterprise workflows.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Light Mode: 239 68% 68% (vibrant blue-purple)
- Dark Mode: 239 68% 85% (lighter variant for contrast)

**Secondary Colors:**
- Light Mode: 202 85% 60% (complementary blue)
- Dark Mode: 202 85% 75%

**Neutral Grays:**
- Light Mode: 220 14% 96% (backgrounds), 220 13% 9% (text)
- Dark Mode: 220 13% 9% (backgrounds), 220 14% 96% (text)

**Accent Colors:**
- Success: 142 76% 36%
- Warning: 38 92% 50%
- Error: 0 84% 60%

### B. Typography
**Primary Font**: Inter (via Google Fonts CDN)
**Secondary Font**: JetBrains Mono (for code/technical content)

**Scale**:
- Headlines: 2xl-6xl (32px-60px)
- Body: base-lg (16px-18px)
- UI Elements: sm-base (14px-16px)
- Captions: xs-sm (12px-14px)

### C. Layout System
**Spacing Units**: Tailwind 2, 4, 6, 8, 12, 16 for consistent rhythm
**Grid**: 12-column responsive grid with 4/6/8 spacing between elements
**Breakpoints**: Standard Tailwind (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)

### D. Component Library

**Navigation**:
- Sidebar navigation for admin/dashboard areas
- Top navigation bar for marketing/public pages
- Breadcrumbs for complex workflows
- Tab navigation for settings/configuration

**Data Display**:
- Cards with subtle shadows and rounded corners
- Tables with zebra striping and hover states
- Charts using muted color variants
- Dashboard widgets with clear hierarchy

**Forms**:
- Consistent input styling with focus states
- Multi-step forms with progress indicators
- Inline validation with helpful error messages
- Toggle switches for boolean settings

**Feedback**:
- Toast notifications (top-right positioning)
- Modal dialogs for destructive actions
- Loading skeletons for data-heavy components
- Progress bars for long operations

### E. Visual Treatments

**Gradients**:
- Subtle header gradients: 239 68% 68% to 202 85% 60%
- Dashboard backgrounds: very light neutral gradients
- CTA buttons: primary color to slightly darker variant

**Shadows**:
- Cards: soft, subtle shadows (0 1px 3px rgba(0,0,0,0.1))
- Elevated elements: medium shadows for modals/dropdowns
- No harsh or dramatic shadows

**Borders**:
- Hairline borders (1px) in neutral-200/neutral-700
- Rounded corners: 6px for cards, 4px for buttons, 8px for modals

## Platform-Specific Guidelines

**AI Website Builder**: Clean, minimal interface with drag-drop zones clearly defined. Preview/edit split-screen layout.

**E-Commerce Dashboard**: Dense data tables with clear action buttons. Revenue charts prominently displayed.

**CMS Interface**: Content-first layout with sidebar navigation. Rich text editor with minimal chrome.

**Social/Community**: Chat interfaces with bubble styling. User avatars and status indicators throughout.

**Marketing Tools**: Vibrant CTAs and progress visualizations. Funnel diagrams with connected flow states.

## Images
No large hero images required. Use:
- Small product thumbnails (64x64px)
- User avatars (32x32px, 48x48px)
- Dashboard icons via Heroicons CDN
- Placeholder illustrations for empty states

## Accessibility & Performance
- WCAG 2.1 AA compliance
- Consistent dark mode across all components
- Icon-only interactions include text labels
- Focus management for complex workflows
- Keyboard navigation for all interactive elements