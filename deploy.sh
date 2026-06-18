#!/bin/bash
set -e

echo "🚀 Vanderbot 2.0 Mobile UI Deployment"
echo "========================================"

# Build the project
echo "📦 Building static export..."
NODE_OPTIONS="" npx next build

# Verify dist folder
if [ ! -d "dist" ]; then
    echo "❌ Build failed - no dist folder found"
    exit 1
fi

echo "✅ Build complete"
echo ""
echo "📁 Output: $(pwd)/dist"
echo "📄 Files: $(find dist -type f | wc -l)"
echo ""
echo "To deploy:"
echo "  1. Push to GitHub: git push origin main"
echo "  2. Or copy dist/ to your static host"
echo "  3. Or use: npx serve dist"
