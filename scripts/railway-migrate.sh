#!/bin/bash

echo "🗄️ Running database migrations on Railway..."

# Install Railway CLI if not installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "🔐 Logging into Railway..."
railway login

# Link to project
echo "🔗 Linking to Railway project..."
railway link

# Run migrations
echo "🚀 Running database migrations..."
railway run npm run db:generate
railway run npm run db:push

echo "✅ Database migrations complete!" 