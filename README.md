# VPPS (Voters Poll Precinct Search)

Mobile-first voter precinct lookup app for PPCRV volunteers, with offline search support and a companion Express + MySQL backend.

## Overview

VPPS lets authenticated users:

- sign in with email/password
- download municipality-scoped voter data to local SQLite storage
- search voters offline by barangay and full name
- mark voters as "searched"
- update profile image and change password

The repository includes:

- `app` + `src`: Expo React Native frontend
- `backend`: Express API for auth, sync, and profile endpoints

## Tech Stack

- Frontend: Expo 54, React Native, Expo Router, TypeScript, Expo SQLite, SecureStore
- Backend: Node.js, Express, MySQL2, JWT, bcrypt, multer

## Project Structure

```text
.
├── app/                 # Expo Router screens
├── src/                 # Frontend components, services, db, context
├── backend/
│   ├── src/             # Express API
│   └── scripts/         # Utility scripts (e.g. password hashing)
├── assets/              # App icons/images
└── README.md
```

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm
- MySQL 8+ (or compatible MySQL server)
- Expo Go app or Android/iOS emulator/simulator

## Environment Variables

### Frontend (`.env` at repo root)

```bash
EXPO_PUBLIC_API_URL=http://YOUR_HOST_IP:3000/api
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_GOOGLE_WEB_CLIENT_ID
```

Notes:

- `EXPO_PUBLIC_API_URL` is required.
- Google login UI exists but the current login flow uses email/password.

### Backend (`backend/.env`)

```bash
PORT=3000
APP_BASE_URL=http://YOUR_HOST_IP:3000
JWT_SECRET=replace_with_a_strong_secret

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
```

`APP_BASE_URL` is used to build absolute URLs for uploaded profile images.

## Installation

1. Install frontend dependencies:

```bash
npm install
```

2. Install backend dependencies:

```bash
cd backend
npm install
cd ..
```

## Running Locally

1. Start backend API:

```bash
cd backend
npm run dev
```

2. In another terminal, start Expo app:

```bash
npm start
```

3. Open the app on:

- Android emulator
- iOS simulator
- Expo Go (physical device)

If using a physical device, `EXPO_PUBLIC_API_URL` should use your machine's LAN IP, not `localhost`.

## Available Scripts

### Frontend

- `npm start` - start Expo dev server
- `npm run android` - open Android target
- `npm run ios` - open iOS target
- `npm run web` - run web target
- `npm run lint` - run lint checks

### Backend

- `cd backend && npm run dev` - run API with nodemon
- `cd backend && npm start` - run API with node

### Utility

- `cd backend && node scripts/hash-existing-passwords.js`  
  Hashes plaintext passwords in `app_users` (safe to run once during migration to bcrypt).

## API Endpoints

Base path: `/api`

- `GET /health`
- `POST /auth/login`
- `GET /auth/me` (Bearer token)
- `GET /sync/meta` (Bearer token)
- `GET /sync/voters?page=1&limit=1000` (Bearer token)
- `POST /profile/image` (Bearer token, multipart `avatar`)
- `POST /profile/change-password` (Bearer token)

## Database Notes

Backend queries currently expect these MySQL tables to exist:

- `app_users`
- `municipality`
- `comelec`
- `barangay`
- `tbl_priority`
- `tbl_verify`

The mobile app manages its own local SQLite cache (`vpps.db`) for offline search.

## Core Flow

1. User signs in (`/api/auth/login`) and session is stored in SecureStore.
2. User triggers data update in the **Data** tab.
3. App downloads paged voters from `/api/sync/*` and writes to local SQLite.
4. Search tab reads local data only, so lookup works offline.

## Team

- Developer: TEAM TAGABARYO
- Support: info@tagabaryo.com
- Website: https://tagabaryo.com/
