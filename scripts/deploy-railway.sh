#!/bin/bash

echo "🚀 Deploying SnackTracker to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "🔐 Logging into Railway..."
railway login

# Link to Railway project (if not already linked)
echo "🔗 Linking to Railway project..."
railway link

# Deploy to Railway
echo "🚀 Deploying..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Your app should be live at: https://your-app-name.railway.app" 