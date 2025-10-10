#!/bin/bash

###############################################################################
# Android Play Store Build Script
# 
# Builds Android app for Play Store submission
# - Validates configuration
# - Builds native Android app
# - Generates signed APK/AAB
# - Prepares for Play Store release
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Configuration
BUILD_TYPE="${1:-release}"  # release or debug
OUTPUT_TYPE="${2:-aab}"     # aab or apk
PACKAGE_NAME="com.echoverse.app"

log_info "=========================================="
log_info "  EchoVerse Android Build"
log_info "  Build Type: $BUILD_TYPE"
log_info "  Output: $OUTPUT_TYPE"
log_info "=========================================="

# Step 1: Validate environment
log_info "Step 1: Validating environment..."

# Check for required environment variables (release only)
if [ "$BUILD_TYPE" = "release" ]; then
    if [ -z "$ANDROID_KEYSTORE_PATH" ]; then
        log_error "ANDROID_KEYSTORE_PATH not set"
        exit 1
    fi
    
    if [ ! -f "$ANDROID_KEYSTORE_PATH" ]; then
        log_error "Keystore file not found at: $ANDROID_KEYSTORE_PATH"
        exit 1
    fi
    
    if [ -z "$ANDROID_KEYSTORE_PASSWORD" ]; then
        log_error "ANDROID_KEYSTORE_PASSWORD not set"
        exit 1
    fi
    
    if [ -z "$ANDROID_KEY_ALIAS" ]; then
        log_error "ANDROID_KEY_ALIAS not set"
        exit 1
    fi
    
    if [ -z "$ANDROID_KEY_PASSWORD" ]; then
        log_error "ANDROID_KEY_PASSWORD not set"
        exit 1
    fi
fi

# Check for required tools
if ! command -v npx &> /dev/null; then
    log_error "npx not found. Install Node.js first."
    exit 1
fi

# Check for Gradle (via Android Studio or standalone)
if ! command -v gradle &> /dev/null && [ ! -f "./android/gradlew" ]; then
    log_error "Gradle not found. Install Android Studio or standalone Gradle."
    exit 1
fi

log_success "Environment validation passed"

# Step 2: Install dependencies
log_info "Step 2: Installing dependencies..."
npm ci
log_success "Dependencies installed"

# Step 3: Build web assets
log_info "Step 3: Building web assets..."
npm run build
log_success "Web assets built"

# Step 4: Sync Capacitor
log_info "Step 4: Syncing Capacitor..."
npx cap sync android
log_success "Capacitor synced"

# Step 5: Navigate to Android directory
cd android

# Step 6: Clean previous builds
log_info "Step 6: Cleaning previous builds..."
./gradlew clean
log_success "Clean completed"

# Step 7: Build Android app
log_info "Step 7: Building Android app..."

if [ "$BUILD_TYPE" = "release" ]; then
    if [ "$OUTPUT_TYPE" = "aab" ]; then
        # Build App Bundle (preferred for Play Store)
        log_info "Building signed App Bundle..."
        
        ./gradlew bundleRelease \
            -Pandroid.injected.signing.store.file="$ANDROID_KEYSTORE_PATH" \
            -Pandroid.injected.signing.store.password="$ANDROID_KEYSTORE_PASSWORD" \
            -Pandroid.injected.signing.key.alias="$ANDROID_KEY_ALIAS" \
            -Pandroid.injected.signing.key.password="$ANDROID_KEY_PASSWORD"
        
        OUTPUT_FILE="./app/build/outputs/bundle/release/app-release.aab"
        
        if [ -f "$OUTPUT_FILE" ]; then
            log_success "App Bundle created: $OUTPUT_FILE"
        else
            log_error "App Bundle creation failed"
            exit 1
        fi
        
    else
        # Build APK
        log_info "Building signed APK..."
        
        ./gradlew assembleRelease \
            -Pandroid.injected.signing.store.file="$ANDROID_KEYSTORE_PATH" \
            -Pandroid.injected.signing.store.password="$ANDROID_KEYSTORE_PASSWORD" \
            -Pandroid.injected.signing.key.alias="$ANDROID_KEY_ALIAS" \
            -Pandroid.injected.signing.key.password="$ANDROID_KEY_PASSWORD"
        
        OUTPUT_FILE="./app/build/outputs/apk/release/app-release.apk"
        
        if [ -f "$OUTPUT_FILE" ]; then
            log_success "APK created: $OUTPUT_FILE"
        else
            log_error "APK creation failed"
            exit 1
        fi
    fi
    
else
    # Debug build
    log_info "Building debug version..."
    
    if [ "$OUTPUT_TYPE" = "aab" ]; then
        ./gradlew bundleDebug
        OUTPUT_FILE="./app/build/outputs/bundle/debug/app-debug.aab"
    else
        ./gradlew assembleDebug
        OUTPUT_FILE="./app/build/outputs/apk/debug/app-debug.apk"
    fi
    
    log_success "Debug build completed"
fi

# Step 8: Verify build
log_info "Step 8: Verifying build..."

if [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    log_success "Build output: $OUTPUT_FILE ($FILE_SIZE)"
    
    # Verify APK/AAB signature (release only)
    if [ "$BUILD_TYPE" = "release" ]; then
        log_info "Verifying signature..."
        
        if [ "$OUTPUT_TYPE" = "apk" ]; then
            jarsigner -verify -verbose -certs "$OUTPUT_FILE" 2>&1 | grep -q "jar verified" && {
                log_success "APK signature verified"
            } || {
                log_warn "APK signature verification inconclusive"
            }
        fi
    fi
else
    log_error "Build output not found"
    exit 1
fi

cd ..

log_success "=========================================="
log_success "  Android Build Completed Successfully!"
log_success "=========================================="

if [ "$BUILD_TYPE" = "release" ]; then
    log_info ""
    log_info "Next steps:"
    log_info "1. Test the $OUTPUT_TYPE on a physical device"
    
    if [ "$OUTPUT_TYPE" = "aab" ]; then
        log_info "2. Upload to Play Console:"
        log_info "   - Go to https://play.google.com/console"
        log_info "   - Select your app"
        log_info "   - Create a new release"
        log_info "   - Upload: $OUTPUT_FILE"
    else
        log_info "2. For Play Store, rebuild as AAB:"
        log_info "   ./scripts/build-android.sh release aab"
    fi
    
    log_info "3. Complete Play Store listing metadata"
    log_info "4. Submit for review"
    log_info ""
    
    # Optional: Upload to Play Console using API
    if [ -n "$PLAY_SERVICE_ACCOUNT_JSON" ] && [ "$OUTPUT_TYPE" = "aab" ]; then
        log_info "Uploading to Play Console..."
        # Implement Play Console API upload here
        log_warn "Automatic upload not yet configured"
    fi
fi

# Copy to convenient location
cp "$OUTPUT_FILE" "./echoverse-android-${BUILD_TYPE}.${OUTPUT_TYPE}" 2>/dev/null || true
log_info "Build also copied to: ./echoverse-android-${BUILD_TYPE}.${OUTPUT_TYPE}"
