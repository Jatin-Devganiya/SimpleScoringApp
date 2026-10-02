# LiveCricket — Live Cricket Scoring Web Application

A fast, mobile-responsive live cricket scoring web application built with **ReactJS** featuring interchangeable persistence engines: **LocalStorage** and **Firebase Cloud Firestore**.

The application operates against a common repository / data-access layer:

```text
                    React UI
                       │
                       ▼
              Authentication Layer
                       │
                       ▼
              Authorization Layer
                       │
                       ▼
               Business Services
          (Player, Team, Match, Scoring)
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
      LocalStorage Repo    Firebase Repo
             │                   │
             ▼                   ▼
        LocalStorage          Firestore
```

---

## 1. Authentication & Role-Based Access

The application features a predefined-user login system without public signup.

### Predefined User Accounts

| Username | Password | Role | Permissions | Concurrency Rule |
| :--- | :--- | :--- | :--- | :--- |
| **`umpire`** | `umpire123` | **`UMPIRE`** | Full CRUD & scoring (Teams, Players, Matches, Scorecards) | **Single Active Session Lock** (Only 1 Umpire at a time) |
| **`user`** | `user123` | **`USER`** | Read-Only (View Matches, Teams, Players, Live Scores) | **Multi-user** (Multiple users allowed simultaneously) |

> Credentials can be customized in [src/config/authConfig.js](file:///d:/Projects/SimpleScoringApp/src/config/authConfig.js).

### Single Umpire Session Lock

1. **Umpire Login**: When an Umpire logs in, an active session lock is created.
2. **Concurrent Rejection**: If another person attempts an Umpire login while a session is active, the login is rejected with:
   > *"The Umpire account is currently in use. Please try again after the existing Umpire session is completed."*
3. **Session Persistence**: The lock survives page refreshes, browser tab reloads, and component re-renders.
4. **Lock Release**: The lock is released only when the Umpire explicitly logs out.
5. **Firebase Atomic Transaction**: In Firebase mode, lock acquisition is performed via `runTransaction` on the `/systemSessions/umpire` document, preventing race conditions.
6. **LocalStorage Mode**: In LocalStorage mode, lock state is managed via `cricketApp.activeUmpireSession`.

### Two-Layer Security & Authorization

1. **UI Layer**: Mutation controls (`Add Player`, `Edit`, `Delete`, `New Match`, Scoring Keypad, `Declare Batsman`, `Change Bowler`) are completely hidden for `USER` role.
2. **Service / Repository Layer**: Every mutation (`create`, `update`, `delete`, `recordRun`, `recordWicket`, etc.) enforces `authService.requireUmpire()`. Even if invoked programmatically, mutations by unauthorized users are rejected.

---

## 2. Key Features

### Players Management (`/players`)
- Master player list with **Add**, **Edit**, **Delete**, and search functionality.
- Case-insensitive duplicate player name prevention (e.g. `Virat Kohli` vs `virat kohli`).
- Whitespace trimming and empty name rejection.

### Team Management with Normalized Players
- Teams store normalized player IDs: `playerIds: string[]`.
- Multi-select dropdown allows selecting only from registered Players.
- Backward-compatible with legacy teams having embedded players.

### Live Scoring & Match Rules
- **Legal Delivery Tracking**: Overs are tracked strictly by 6 legal deliveries. Wides and No Balls do NOT count toward the 6 legal balls.
- **Automatic Next Bowler Popup**: Triggers immediately after the 6th legal delivery of an over. The completed over's bowler cannot be selected as the next bowler.
- **Declare Batsmen**: Scorer can explicitly assign Striker and Non-Striker positions.
- **Wicket Dismissal**: Prompts scorer to select replacement batsman from non-dismissed batting squad members.
- **Strike Rotation**: Strike rotates on odd runs (1, 3, 5) and at the end of each over.
- **Full Undo**: Reverts scoring events and recalculates exact match state.

---

## 3. Storage Modes & Configuration

The application uses the feature flag in `.env`:

```env
# Set to 'true' for LocalStorage, 'false' for Firebase Cloud Firestore
VITE_USE_LOCAL_STORAGE=false
```

### Mode 1: LocalStorage Mode (`VITE_USE_LOCAL_STORAGE=true`)
- Zero external cloud dependencies.
- Operates 100% offline in browser storage.
- Active Umpire session stored in `cricketApp.activeUmpireSession`.

### Mode 2: Firebase Mode (`VITE_USE_LOCAL_STORAGE=false`)
- Real-time cloud sync with Firebase Cloud Firestore.
- Requires Firebase configuration in `.env`:

```env
VITE_USE_LOCAL_STORAGE=false
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-app.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

---

## 4. Firestore Setup & Security Rules

1. Create a Firebase Project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable Cloud Firestore in Production Mode.
3. Deploy the following security rules in [firestore.rules](file:///d:/Projects/SimpleScoringApp/firestore.rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Teams collection
    match /teams/{teamId} {
      allow read, write: if true;
    }

    // Players collection
    match /players/{playerId} {
      allow read, write: if true;
    }

    // Matches and nested events
    match /matches/{matchId} {
      allow read, write: if true;

      match /events/{eventId} {
        allow read, write: if true;
      }
    }

    // System sessions for single-umpire concurrency lock
    match /systemSessions/{sessionId} {
      allow read, write: if true;
    }

    // Deny access to any other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 5. Local Development & Running Tests

### Install Dependencies
```bash
npm install
```

### Run Acceptance Tests
To run the automated test suite covering all 53 acceptance criteria:
```bash
npm test
```

### Run Locally
```bash
npm run dev
```

Visit `http://localhost:3000` (or the port indicated by Vite).

---

## 6. Hosting & Deployment

### Render Static Site
1. Create a **New Static Site** on [Render](https://render.com/).
2. Connect your GitHub repository: `https://github.com/Jatin-Devganiya/SimpleScoringApp`.
3. Configure settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_USE_LOCAL_STORAGE`: `false` (or `true`)
   - Add your Firebase keys if `VITE_USE_LOCAL_STORAGE=false`.
5. Click **Create Static Site**.

### GitHub Pages Deployment
```bash
npm run deploy
```

---

## 7. Troubleshooting

- **"The Umpire account is currently in use"**:
  - Another browser tab or user is actively logged in as Umpire.
  - To release the lock, log out from the active session, or clear `cricketApp.activeUmpireSession` in LocalStorage / delete `/systemSessions/umpire` in Firestore.
- **Firebase missing configuration warning**:
  - Verify that your `.env` contains all required `VITE_FIREBASE_*` variables and restart the dev server.
- **Player not showing in team dropdown**:
  - Players must first be added in the **Players** menu before they can be assigned to a team.
