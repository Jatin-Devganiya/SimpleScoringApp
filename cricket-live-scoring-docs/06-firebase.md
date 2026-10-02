# Firebase Specification

## Purpose

Firebase Firestore is the optional persistence provider when:

```text
VITE_USE_LOCAL_STORAGE=false
```

## Firebase SDK

Use the Firebase Web SDK.

Example dependencies:

```bash
npm install firebase
```

## Environment Variables

`.env.example`:

```text
VITE_USE_LOCAL_STORAGE=true

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Do not hard-code project configuration values in source code.

## Initialization

Create:

```text
src/config/firebaseConfig.js
```

It should:
1. Read environment variables.
2. Validate required values.
3. Initialize Firebase once.
4. Export Firestore instance.

Do not initialize Firebase when LocalStorage mode is enabled if this can be avoided.

## Firestore Collections

```text
teams
matches
matches/{matchId}/events
```

### Team Document

```js
{
  id,
  name,
  players: [
    { id, name }
  ],
  createdAt,
  updatedAt
}
```

### Match Document

Keep match metadata and innings state needed for fast resume.

Events should be stored under:

```text
matches/{matchId}/events
```

## Security

There is intentionally no login/signup in the first version.

Therefore, a public Firestore application has important security limitations.

Provide `firestore.rules`.

Do not claim that anonymous/public write access is secure.

The rules should be narrowly scoped to the application's collections and documented clearly.

If stronger security is required later, authentication should be introduced as a separate feature.

## Usage Efficiency

Design for low read/write usage:
- Do not poll.
- Do not reload all teams after every ball.
- Do not rewrite unrelated documents.
- Use direct document updates.
- Load match events only when required.
- Use listeners only where required.

## Failure Handling

If Firebase write fails:
- Do not silently discard the scoring event.
- Keep the event recoverable in application state.
- Show a user-friendly error.
- Avoid duplicate writes during retry.

## Offline

Use Firestore client capabilities where appropriate, but do not make offline support a dependency of the core architecture.

LocalStorage mode must remain completely independent and offline-capable.
