# 🚀 SnackTracker Deployment Guide

This guide will help you deploy your SnackTracker application to various hosting platforms.

## 📋 Prerequisites

1. **GitHub Repository**: Make sure your code is pushed to GitHub
2. **Database**: You'll need a PostgreSQL database (provided by most hosting platforms)
3. **Environment Variables**: Prepare your environment variables

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# Server
NODE_ENV=production
PORT=3000

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-domain.com

# Session Secret
SESSION_SECRET=your-super-secret-session-key
```

## 🎯 Deployment Options

### Option 1: Railway (Recommended - Full Stack)

**Pros**: Easy setup, includes database, automatic deployments
**Cons**: Limited free tier

#### Steps:
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your SnackTracker repository
5. Railway will automatically detect the Node.js app
6. Add environment variables in the Railway dashboard
7. Railway will automatically deploy your app

#### Environment Variables in Railway:
- `DATABASE_URL`: Railway will provide this automatically
- `NODE_ENV`: `production`
- `FRONTEND_URL`: Your Railway app URL
- `SESSION_SECRET`: Generate a random string

### Option 2: Render (Good Free Tier)

**Pros**: Generous free tier, easy setup
**Cons**: Slower cold starts on free tier

#### Steps:
1. Go to [Render.com](https://render.com)
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `snacktracker-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Add environment variables
7. Deploy

#### Create Database:
1. Go to "New" → "PostgreSQL"
2. Create database
3. Copy the connection string to your environment variables

### Option 3: Vercel (Frontend) + Railway/Render (Backend)

**Pros**: Best performance for frontend, flexible backend choice
**Cons**: More complex setup

#### Frontend (Vercel):
1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable: `VITE_API_URL=https://your-backend-url.com`
5. Deploy

#### Backend (Railway/Render):
Follow the steps above for Railway or Render backend deployment.

### Option 4: Netlify (Frontend) + Supabase (Backend + Database)

**Pros**: Modern stack, great developer experience
**Cons**: Requires code changes for Supabase

#### Frontend (Netlify):
1. Go to [Netlify.com](https://netlify.com)
2. Import your GitHub repository
3. Configure build settings
4. Deploy

#### Backend + Database (Supabase):
1. Go to [Supabase.com](https://supabase.com)
2. Create a new project
3. Get your database URL and API keys
4. Update your backend code to use Supabase

## 🗄️ Database Setup

### PostgreSQL Database Options:

1. **Railway**: Automatically provided
2. **Render**: Built-in PostgreSQL service
3. **Supabase**: Free PostgreSQL with additional features
4. **Neon**: Serverless PostgreSQL
5. **PlanetScale**: MySQL (requires schema changes)

### Database Migration:

After setting up your database, run migrations:

```bash
# Generate migrations
npm run db:generate

# Push migrations to database
npm run db:push
```

## 🔍 Post-Deployment Checklist

- [ ] Environment variables are set correctly
- [ ] Database migrations have been run
- [ ] CORS is configured for your frontend domain
- [ ] Health check endpoint is working (`/api/health`)
- [ ] Frontend can connect to backend API
- [ ] Authentication is working
- [ ] File uploads work (if applicable)
- [ ] SSL/HTTPS is enabled

## 🐛 Troubleshooting

### Common Issues:

1. **CORS Errors**: Check your `FRONTEND_URL` environment variable
2. **Database Connection**: Verify your `DATABASE_URL` is correct
3. **Build Failures**: Check your Node.js version (use 18.x or higher)
4. **Port Issues**: Make sure your app uses `process.env.PORT`

### Debug Commands:

```bash
# Check if app builds locally
npm run build

# Test production build
npm start

# Check database connection
npm run db:push
```

## 📊 Performance Optimization

1. **Enable Compression**: Add compression middleware
2. **Caching**: Implement Redis for session storage
3. **CDN**: Use a CDN for static assets
4. **Database Indexing**: Add indexes to frequently queried columns

## 🔒 Security Checklist

- [ ] Environment variables are not exposed
- [ ] HTTPS is enabled
- [ ] Session secret is strong and unique
- [ ] CORS is properly configured
- [ ] Input validation is in place
- [ ] SQL injection protection (Drizzle ORM handles this)

## 📈 Monitoring

Consider setting up monitoring:
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry, LogRocket
- **Performance**: Vercel Analytics, Google Analytics

## 🆘 Support

If you encounter issues:
1. Check the hosting platform's documentation
2. Review the error logs in your hosting dashboard
3. Test locally with production environment variables
4. Check the troubleshooting section above

---

**Happy Deploying! 🎉** 