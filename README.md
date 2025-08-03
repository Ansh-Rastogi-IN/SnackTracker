# SnackTracker

A digital canteen management system built with React, Express, and TypeScript.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development servers:

Using PowerShell:
```powershell
.\start-dev.ps1
```

Or start servers manually:
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
npx vite --config vite.config.ts
```

## Default Users

You can log in with these test accounts:

- Admin: `ansh@gmail.com` (password: ansh)
- Staff: `test@gmail.com` (password: test)
- Staff (Kuteera): `kuteera@gmail.com` (password: kuteera)
- Staff (Wake n Bite): `wake@gmail.com` (password: wake)

## Available URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Features

- User Authentication (Login/Register)
- Menu Management with Food Images
- Order Management
- Inventory Management
- Expense Tracking
- Sales Reporting
- Role-based access control
- Smart Image Suggestions for Menu Items

## Development

- Backend runs on port 3000
- Frontend runs on port 5173
- API requests are automatically proxied from frontend to backend 