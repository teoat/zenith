#!/bin/bash
set -e

# Define directories
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
OUTPUT_DIR="$PROJECT_ROOT/release"

echo "=========================================="
echo "🏗️  Starting Simple378 Distribution Build"
echo "=========================================="
echo "Project Root: $PROJECT_ROOT"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
npm run clean

# Build Frontend
echo "📦 Building Frontend (React/Vite)..."
cd "$FRONTEND_DIR"
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi
echo "✅ Frontend build complete."

# Build Electron
echo "🖥️  Building Desktop Application..."
cd "$PROJECT_ROOT"

# Determine platform flags if passed
TARGET_PLATFORM=""
if [[ "$1" == "--mac" ]]; then
    TARGET_PLATFORM="--mac"
elif [[ "$1" == "--win" ]]; then
    TARGET_PLATFORM="--win"
elif [[ "$1" == "--linux" ]]; then
    TARGET_PLATFORM="--linux"
fi

# Run electron-builder
if [ -n "$TARGET_PLATFORM" ]; then
    echo "🎯 Targeting specific platform: $TARGET_PLATFORM"
    npx electron-builder build $TARGET_PLATFORM --publish never
else
    echo "🌍 Building for current OS (auto-detect)..."
    npx electron-builder build --publish never
fi

if [ $? -ne 0 ]; then
    echo "❌ Electron build failed!"
    exit 1
fi

echo "=========================================="
echo "✅ Build Successful!"
echo "📂 Artifacts are in: $OUTPUT_DIR"
echo "=========================================="
