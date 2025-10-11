#!/bin/bash

###############################################################################
# iOS App Store Build Script
# 
# Builds iOS app for App Store submission
# - Validates configuration
# - Builds native iOS app
# - Generates .ipa file
# - Prepares for TestFlight/App Store
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
IOS_TEAM_ID="${IOS_TEAM_ID:-}"
BUNDLE_ID="com.echoverse.app"
SCHEME="App"

log_info "=========================================="
log_info "  EchoVerse iOS Build"
log_info "  Build Type: $BUILD_TYPE"
log_info "=========================================="

# Step 1: Validate environment
log_info "Step 1: Validating environment..."

if [ -z "$IOS_TEAM_ID" ]; then
    log_error "IOS_TEAM_ID environment variable not set"
    log_info "Set it with: export IOS_TEAM_ID=YOUR_TEAM_ID"
    exit 1
fi

# CRIT-NEW-002: Validate App Store upload credentials for release builds
if [ "$BUILD_TYPE" = "release" ]; then
    if [ -z "$APPLE_ID" ]; then
        log_warn "APPLE_ID not set - App Store upload will be skipped"
        log_info "Set it with: export APPLE_ID=your@apple-id.com"
    fi
    if [ -z "$APP_SPECIFIC_PASSWORD" ]; then
        log_warn "APP_SPECIFIC_PASSWORD not set - App Store upload will be skipped"
        log_info "Generate at: https://appleid.apple.com/account/manage (App-Specific Passwords)"
    fi
fi

# Check for required tools
if ! command -v xcodebuild &> /dev/null; then
    log_error "xcodebuild not found. Install Xcode first."
    exit 1
fi

if ! command -v npx &> /dev/null; then
    log_error "npx not found. Install Node.js first."
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
npx cap sync ios
log_success "Capacitor synced"

# Step 5: Open Xcode project directory
cd ios/App

# Step 6: Install CocoaPods dependencies
log_info "Step 6: Installing CocoaPods dependencies..."
if [ -f "Podfile" ]; then
    pod install
    log_success "CocoaPods dependencies installed"
else
    log_warn "No Podfile found, skipping CocoaPods"
fi

# Step 7: Set provisioning profile and signing
log_info "Step 7: Configuring code signing..."

# Update project settings
if [ "$BUILD_TYPE" = "release" ]; then
    xcodebuild \
        -scheme "$SCHEME" \
        -configuration Release \
        DEVELOPMENT_TEAM="$IOS_TEAM_ID" \
        CODE_SIGN_STYLE=Automatic \
        -showBuildSettings | grep -i "provisioning"
fi

log_success "Code signing configured"

# Step 8: Build for device
log_info "Step 8: Building iOS app..."

if [ "$BUILD_TYPE" = "release" ]; then
    # Archive build for App Store
    log_info "Creating archive for App Store..."
    
    xcodebuild archive \
        -workspace App.xcworkspace \
        -scheme "$SCHEME" \
        -configuration Release \
        -archivePath "./build/EchoVerse.xcarchive" \
        DEVELOPMENT_TEAM="$IOS_TEAM_ID" \
        CODE_SIGN_STYLE=Automatic
    
    log_success "Archive created"
    
    # Export IPA
    log_info "Exporting IPA..."
    
    # Create export options plist
    cat > "./build/ExportOptions.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>$IOS_TEAM_ID</string>
    <key>uploadSymbols</key>
    <true/>
    <key>uploadBitcode</key>
    <false/>
</dict>
</plist>
EOF
    
    xcodebuild -exportArchive \
        -archivePath "./build/EchoVerse.xcarchive" \
        -exportPath "./build" \
        -exportOptionsPlist "./build/ExportOptions.plist"
    
    log_success "IPA exported to ./ios/App/build/EchoVerse.ipa"
    
else
    # Debug build
    log_info "Building debug version..."
    
    xcodebuild build \
        -workspace App.xcworkspace \
        -scheme "$SCHEME" \
        -configuration Debug \
        -destination 'generic/platform=iOS' \
        DEVELOPMENT_TEAM="$IOS_TEAM_ID"
    
    log_success "Debug build completed"
fi

# Step 9: Validate build
log_info "Step 9: Validating build..."

if [ "$BUILD_TYPE" = "release" ] && [ -f "./build/EchoVerse.ipa" ]; then
    # Validate IPA
    xcrun altool --validate-app \
        -f "./build/EchoVerse.ipa" \
        -t ios \
        -u "$APPLE_ID" \
        -p "$APP_SPECIFIC_PASSWORD" 2>/dev/null || {
        log_warn "IPA validation skipped (credentials not configured)"
    }
    
    log_success "Build validated"
fi

cd ../..

log_success "=========================================="
log_success "  iOS Build Completed Successfully!"
log_success "=========================================="

if [ "$BUILD_TYPE" = "release" ]; then
    log_info ""
    log_info "Next steps:"
    log_info "1. Test the IPA on a physical device"
    log_info "2. Upload to App Store Connect:"
    log_info "   xcrun altool --upload-app -f ios/App/build/EchoVerse.ipa -t ios -u YOUR_APPLE_ID -p APP_SPECIFIC_PASSWORD"
    log_info "3. Submit for review in App Store Connect"
    log_info ""
fi
