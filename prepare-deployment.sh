#!/bin/bash

# 🚀 DID Management - Deployment Preparation Script
# Run this before deploying to Vercel

echo "🎯 Preparing DID Management for Production Deployment..."
echo "=============================================="

# Check current directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project root confirmed"

# Build frontend for production
echo "📦 Building frontend for production..."
cd frontend
npm run build

if [[ $? -eq 0 ]]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Verify build directory exists
if [[ -d "build" ]]; then
    echo "✅ Build directory created"
else
    echo "❌ Build directory not found"
    exit 1
fi

cd ..

echo ""
echo "🎉 Pre-deployment preparation complete!"
echo "=============================================="
echo ""
echo "🔥 NEXT STEPS FOR VERCEL DEPLOYMENT:"
echo ""
echo "1. Go to https://vercel.com/dashboard"
echo "2. Click 'Add New...' → 'Project'"
echo "3. Import from GitHub: yosinurigroup/DID-Management"
echo "4. ⚠️  IMPORTANT: Set Root Directory to 'frontend'"
echo "5. Add environment variables:"
echo "   - MONGODB_URI: your_mongodb_connection_string"
echo "   - NODE_ENV: production"
echo "6. Click Deploy"
echo ""
echo "📋 Your project will be available at:"
echo "   https://did-management-app.vercel.app"
echo ""
echo "✨ Ready for deployment!"