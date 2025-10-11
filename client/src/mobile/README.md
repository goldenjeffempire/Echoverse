# EchoVerse Mobile App Structure

## Overview

This directory contains all mobile-specific functionality for the EchoVerse platform, built with Capacitor for iOS and Android.

## Structure

```
mobile/
├── services/          # Native service integrations
│   ├── navigation.ts  # Back button handling & app navigation
│   ├── storage.ts     # Native storage (Preferences API)
│   └── notifications.ts # Push notifications setup
├── components/        # Mobile-optimized components
│   ├── MobileLayout.tsx # Layout with safe areas & keyboard handling
│   └── NativeFeatures.tsx # Camera, share, haptics integration
└── index.ts          # Public API exports
```

## Services

### Navigation Service
Handles native navigation features:
- Back button handling with custom listeners
- External URL opening (in-app browser)
- App info retrieval

```typescript
import { navigationService } from '@/mobile';

// Register back button handler
const unregister = navigationService.registerBackButtonHandler(() => {
  if (hasUnsavedChanges) {
    showConfirmDialog();
    return true; // Handled
  }
  return false; // Not handled
});

// Open external URL
await navigationService.openExternalUrl('https://example.com');
```

### Storage Service
Cross-platform persistent storage:
- Native Preferences API on iOS/Android
- LocalStorage fallback for web
- In-memory caching for performance

```typescript
import { storageService } from '@/mobile';

// Store data
await storageService.set('user_settings', { theme: 'dark' });

// Retrieve data
const settings = await storageService.get('user_settings');

// Remove data
await storageService.remove('user_settings');
```

### Notification Service
Push notification management:
- Permission handling
- Token registration
- Notification listeners
- Delivered notifications management

```typescript
import { notificationService } from '@/mobile';

await notificationService.initialize({
  onRegistered: (token) => {
    console.log('FCM/APNS token:', token);
    // Send to your backend
  },
  onReceived: (notification) => {
    console.log('Notification received:', notification);
  },
  onActionPerformed: (action) => {
    console.log('Notification action:', action);
  }
});
```

## Components

### MobileLayout
Responsive mobile layout with safe area support:

```tsx
import { MobileLayout, MobileHeader, MobileContent, MobileBottomNav } from '@/mobile';

function MyScreen() {
  return (
    <MobileLayout>
      <MobileHeader 
        title="Dashboard"
        leftAction={<BackButton />}
        rightAction={<MenuButton />}
      />
      <MobileContent scrollable>
        {/* Your content */}
      </MobileContent>
      <MobileBottomNav>
        {/* Navigation buttons */}
      </MobileBottomNav>
    </MobileLayout>
  );
}
```

### Native Features Hook
Access native device features:

```tsx
import { useNativeFeatures } from '@/mobile';

function PhotoScreen() {
  const { takePicture, pickImage, shareContent, vibrate } = useNativeFeatures();

  const handleTakePhoto = async () => {
    const imagePath = await takePicture();
    // Use the image path
  };

  return (
    <button onClick={handleTakePhoto}>
      Take Photo
    </button>
  );
}
```

## Setup Instructions

### 1. Install Dependencies
All Capacitor plugins are already installed:
- @capacitor/app
- @capacitor/camera
- @capacitor/keyboard
- @capacitor/push-notifications
- @capacitor/splash-screen
- @capacitor/status-bar

### 2. Configure Push Notifications

#### iOS
1. Add Push Notifications capability in Xcode
2. Configure APNs in Apple Developer Portal
3. Add to `ios/App/App/Info.plist`:
```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

#### Android
1. Add `google-services.json` to `android/app/`
2. Firebase Cloud Messaging is auto-configured

### 3. Build Commands

```bash
# Build for iOS
npm run ios:build

# Build for Android
npm run android:build

# Sync Capacitor
npx cap sync

# Open in Xcode
npx cap open ios

# Open in Android Studio
npx cap open android
```

## Native Feature Availability

| Feature | iOS | Android | Web |
|---------|-----|---------|-----|
| Camera | ✅ | ✅ | ⚠️ Limited |
| Push Notifications | ✅ | ✅ | ❌ |
| Haptics | ✅ | ✅ | ⚠️ Limited |
| Share | ✅ | ✅ | ⚠️ Limited |
| Status Bar | ✅ | ✅ | ❌ |
| Keyboard | ✅ | ✅ | ❌ |
| Storage (Native) | ✅ | ✅ | ❌ |

## Testing

### On Device/Simulator
```bash
# iOS Simulator
npm run ios:build
npx cap open ios
# Run in Xcode

# Android Emulator
npm run android:build
npx cap open android
# Run in Android Studio
```

### Web Preview
```bash
npm run dev
# Mobile features will use web fallbacks
```

## Common Patterns

### Safe Area Handling
```tsx
<MobileLayout safeAreaTop safeAreaBottom>
  {/* Content automatically respects safe areas */}
</MobileLayout>
```

### Keyboard Management
```tsx
<MobileContent>
  {/* Keyboard auto-adjusts layout */}
  <input type="text" />
</MobileContent>
```

### Platform Detection
```tsx
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  // Native-specific code
} else {
  // Web fallback
}
```

## Next Steps

1. **Implement Biometric Auth**: Add Face ID/Touch ID support
2. **Deep Linking**: Configure custom URL schemes
3. **Background Sync**: Implement offline data synchronization
4. **App Icons & Splash**: Create all required assets
5. **Store Submission**: Prepare metadata for App Store & Play Store

## Resources

- [Capacitor Documentation](https://capacitorjs.com)
- [iOS HIG](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design](https://material.io/design)
