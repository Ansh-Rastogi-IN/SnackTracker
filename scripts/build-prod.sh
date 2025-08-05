#!/bin/bash

echo "🚀 Building SnackTracker for production..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the frontend
echo "🔨 Building frontend..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
npm run db:generate
npm run db:push

echo "✅ Production build complete!"
echo "🎯 Ready for deployment!" 