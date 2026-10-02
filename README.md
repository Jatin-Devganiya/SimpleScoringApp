# Simple Live Cricket Scoring Web App

A fast, mobile-friendly live cricket scoring application built with React.js featuring interchangeable persistence providers: **LocalStorage** and **Firebase Cloud Firestore**.

The entire application operates against a unified repository/service interface, allowing you to toggle between LocalStorage and Firebase with a single feature flag without altering any UI components or scoring logic.

---

## Architecture Overview

```text
                       React UI
                          │
                  Application Services
                 (Team, Match, Scoring)
                          │
                    Scoring Engine
                 (Pure Cricket Rules)
                          │
                  Storage Interface
                 (StorageProvider.js)
                          │
             ┌────────────┴────────────┐
             │                         │
     LocalStorageProvider     FirebaseStorageProvider
             │                         │
        LocalStorage            Cloud Firestore
```

### Key Principles

1. **Storage Decoupling**: React components NEVER call `localStorage` or `firebase.firestore` directly. All operations go through `storageProvider`.
2. **Pure Cricket Scoring Engine**: The scoring rules (runs, wides, no-balls, wickets, strike rotation, overs formatting, economy, strike rate, target, RRR, and undo) reside in a single pure engine (`src/engines/scoringEngine.js`).
3. **Event-Based Delivery Model**: Every delivery is stored as an event. Undo is deterministic and recomputes exact match state reliably.
4. **Cross-Storage Portability**: Backup JSON files (`cricket-score-backup-YYYY-MM-DD.json`) exported from LocalStorage can be imported directly into Firebase, and vice-versa.

---

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Running Locally

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## Storage Modes & Configuration

### Mode 1: LocalStorage (Default)

In `.env`:

```env
VITE_USE_LOCAL_STORAGE=true
```

- Zero cloud dependencies or Firebase configuration required.
- Operates completely offline in the browser.
- Data persists across refreshes in browser `localStorage`.

### Mode 2: Firebase Cloud Firestore

In `.env`:

```env
VITE_USE_LOCAL_STORAGE=false

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

If `VITE_USE_LOCAL_STORAGE=false` is set but credentials are missing, the app displays a clear startup error rather than silently failing.

#### Firebase Setup Guide

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new Firebase project.
3. In **Build > Firestore Database**, click **Create Database** (start in Test Mode or Production Mode).
4. Deploy the security rules provided in [firestore.rules](file:///d:/Projects/SimpleScoringApp/firestore.rules).
5. In **Project Settings**, add a **Web App** and copy the configuration parameters into your `.env` file.

#### Firestore Security Rules

See [firestore.rules](file:///d:/Projects/SimpleScoringApp/firestore.rules):

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /teams/{teamId} {
      allow read, write: if true;
    }
    match /matches/{matchId} {
      allow read, write: if true;
      match /events/{eventId} {
        allow read, write: if true;
      }
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

> **Security Note:** This initial version operates without user authentication for simplicity. In production multi-tenant deployments, Firebase Authentication and user-level match ownership rules should be implemented.

---

## Features

- **Team & Player Management**: Add, edit, and remove teams and squad members.
- **Match Setup**: Configurable overs (5, 10, 15, 20, 50), batting/bowling team selection, and opening lineups.
- **Live Scoring Pad**: Large mobile-friendly buttons for `0`, `1`, `2`, `3`, `4`, `6`, `WICKET`, `WIDE`, `NO BALL`, and `UNDO LAST BALL`.
- **Accurate Cricket Rules**:
  - Overs tracked strictly by legal balls (e.g. `0.0`, `0.1`, ... `1.0`).
  - Strike rotation on odd runs (1, 3, 5) and end of overs.
  - Active striker marked with `★ STRIKER`.
  - Wides: +1 run, +1 extra, bowler runs +1, legal balls unchanged.
  - No Balls: +1 extra run, optional bat runs (`0, 1, 2, 3, 4, 6`), bowler runs incremented, legal balls unchanged.
  - Wickets: Dismissal record, prompts scorer to pick replacement batsman from non-out squad members.
  - Bowling change enforcement after each completed over.
- **Second Innings & Target**: Automatic target computation (`1st innings score + 1`), required runs, remaining balls, and Required Run Rate (RRR).
- **Match Completion**: Detects target achieved, overs completed, or all-out with calculated margin of victory.
- **Undo**: Full historical rollback restoring all batsman, bowler, over, and match statistics.
- **Scorecards**: Comprehensive batting (R, B, 4s, 6s, SR) and bowling (O, R, W, Econ) tables.
- **Backup & Migration**: 1-click export and import of standard JSON backups (`cricket-score-backup-YYYY-MM-DD.json`).
- **Data Wipe**: Safe data wipe functionality with confirmation.

---

## Acceptance Testing Guide

### 1. LocalStorage Acceptance Test
1. Set `VITE_USE_LOCAL_STORAGE=true` in `.env`.
2. Launch `npm run dev`.
3. Click "Seed Sample Teams" or create Team A and Team B with at least 5 players each.
4. Create a 5-over match: Team A batting first.
5. Record deliveries: `1`, `4`, `0`, `6`, `WICKET` (select replacement batsman), `2`, `WIDE`, `NO BALL (+4)`, `4`.
6. Verify score, wickets, legal balls, strike rotation, current over pills, and statistics.
7. Click "UNDO LAST BALL" — verify score and strike revert seamlessly.
8. Refresh the browser — verify match state and events remain fully intact.
9. Navigate to Settings and click "Export Backup (JSON)".

### 2. Cross-Storage Migration Test
1. Set `VITE_USE_LOCAL_STORAGE=false` in `.env` and fill in Firebase credentials.
2. Restart the app.
3. Verify the header shows `Storage: Firebase`.
4. Navigate to Settings and import the backup JSON exported from LocalStorage.
5. Verify that all teams, matches, scores, and events are restored into Firebase Firestore.
