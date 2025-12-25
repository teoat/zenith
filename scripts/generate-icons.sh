#!/bin/bash
# generate-icons.sh - Generate all platform icons from source PNG

set -e

SOURCE_ICON="build/icon-source.png"
BUILD_DIR="build"
ICONS_DIR="$BUILD_DIR/icons"

echo "🎨 Generating application icons for all platforms..."

# Check if source icon exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo "❌ Error: Source icon not found at $SOURCE_ICON"
    exit 1
fi

# Create directories
mkdir -p "$ICONS_DIR"

# Check for Python and Pillow
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 not found"
    exit 1
fi

# Check if Pillow is installed
if ! python3 -c "import PIL" 2>/dev/null; then
    echo "📦 Installing Pillow..."
    pip3 install Pillow
fi

echo "Creating icon generation script..."

cat > /tmp/generate_icons.py << 'EOF'
#!/usr/bin/env python3
"""
Generate platform-specific icons from source PNG
"""
from PIL import Image
import os
import struct

def create_ico(source_path, output_path, sizes):
    """Create Windows ICO file with multiple sizes"""
    print(f"  Creating {output_path}...")
    
    source_img = Image.open(source_path)
    
    # Generate images at different sizes
    images = []
    for size in sizes:
        img = source_img.resize((size, size), Image.Resampling.LANCZOS)
        images.append(img)
    
    # Save as ICO
    images[0].save(
        output_path,
        format='ICO',
        sizes=[(s, s) for s in sizes]
    )
    print(f"  ✅ Created: {output_path}")

def create_icns(source_path, output_path):
    """Create macOS ICNS file"""
    print(f"  Creating {output_path}...")
    
    source_img = Image.open(source_path)
    
    # macOS icon sizes
    # Simple approach: create iconset directory and use iconutil
    iconset_dir = "/tmp/AppIcon.iconset"
    os.makedirs(iconset_dir, exist_ok=True)
    
    sizes = {
        'icon_16x16.png': 16,
        'icon_16x16@2x.png': 32,
        'icon_32x32.png': 32,
        'icon_32x32@2x.png': 64,
        'icon_128x128.png': 128,
        'icon_128x128@2x.png': 256,
        'icon_256x256.png': 256,
        'icon_256x256@2x.png': 512,
        'icon_512x512.png': 512,
        'icon_512x512@2x.png': 1024,
    }
    
    for filename, size in sizes.items():
        img = source_img.resize((size, size), Image.Resampling.LANCZOS)
        img.save(os.path.join(iconset_dir, filename), 'PNG')
    
    # Convert to ICNS using iconutil (macOS only)
    import platform
    if platform.system() == 'Darwin':
        import subprocess
        subprocess.run(['iconutil', '-c', 'icns', iconset_dir, '-o', output_path])
        print(f"  ✅ Created: {output_path}")
    else:
        print(f"  ⚠️  Skipping ICNS creation (requires macOS)")
        print(f"     Manual step: Run on macOS - iconutil -c icns {iconset_dir} -o {output_path}")

def create_png_set(source_path, output_dir, sizes):
    """Create PNG icons at various sizes for Linux"""
    print(f"  Creating PNG set in {output_dir}...")
    
    source_img = Image.open(source_path)
    
    for size in sizes:
        img = source_img.resize((size, size), Image.Resampling.LANCZOS)
        output_path = os.path.join(output_dir, f"{size}x{size}.png")
        img.save(output_path, 'PNG')
        print(f"    ✅ {size}x{size}.png")

if __name__ == '__main__':
    import sys
    
    source = sys.argv[1] if len(sys.argv) > 1 else 'build/icon-source.png'
    
    print("🎨 Icon Generator")
    print(f"   Source: {source}\n")
    
    # Windows ICO (multiple sizes in one file)
    print("📦 Windows:")
    create_ico(source, 'build/icon.ico', [16, 32, 48, 64, 128, 256])
    
    # macOS ICNS
    print("\n🍎 macOS:")
    create_icns(source, 'build/icon.icns')
    
    # Linux PNGs
    print("\n🐧 Linux:")
    create_png_set(source, 'build/icons', [16, 32, 48, 64, 128, 256, 512])
    
    print("\n✅ Icon generation complete!")
EOF

chmod +x /tmp/generate_icons.py

# Run the icon generator
python3 /tmp/generate_icons.py "$SOURCE_ICON"

# Verify generated files
echo ""
echo "📋 Generated files:"
ls -lh "$BUILD_DIR/icon.ico" "$BUILD_DIR/icon.icns" 2>/dev/null || true
echo ""
echo "Linux icons:"
ls -lh "$ICONS_DIR/"*.png 2>/dev/null || true

echo ""
echo "✅ Icon generation complete!"
echo ""
echo "Next steps:"
echo "  1. Review icons: open $BUILD_DIR/icon-source.png"
echo "  2. Test build: npm run build:electron"
echo "  3. Check installers in release/ directory"
