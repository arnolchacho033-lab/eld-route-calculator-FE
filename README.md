# ELD Route Calculator — Frontend

A React + TypeScript (Vite) app for planning truck routes and generating
hours-of-service (HOS) logs according to ELD (Electronic Logging Device)
regulations.

## Features

- Trip form with origin, pickup, and dropoff points.
- Route planning via a Django backend (Nominatim geocoding + OSRM routing proxy).
- Interactive map with Leaflet and React Leaflet.
- Per-leg distance, duration, and stop calculations.
- HOS log sheet generation and a stops timeline.

## Stack

- React 19 + TypeScript + Vite
- Leaflet / React Leaflet
- Vitest + Testing Library (tests)
- Oxlint (linting)

## Local development

```bash
npm install
npm run dev
```

By default the app calls the API at `http://localhost:8000` (the Django backend).
To point to another backend, set the `VITE_BACKEND_URL` variable in a `.env.local`
file (see `.env.example`).

## Scripts

```bash
npm run build   # production build
npm run lint    # oxlint
npm test        # vitest (unit tests)
npm run dev     # development server
```

## Deployment

The project is set up for Vercel (Root Directory: `frontend/`). In the project's
environment variables, set `VITE_BACKEND_URL` to the deployed backend URL.
