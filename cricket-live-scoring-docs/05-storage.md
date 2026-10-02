# Storage Specification

## Feature Flag

Primary configuration:

```text
VITE_USE_LOCAL_STORAGE=true
```

or:

```text
VITE_USE_LOCAL_STORAGE=false
```

Interpretation:

### `true`
Use LocalStorage.
Do not perform Firebase database operations.

### `false`
Use Firebase Firestore.
Do not use LocalStorage as the application database.

If Firebase mode is selected and Firebase configuration is missing, fail clearly. Do not silently fall back to LocalStorage.

## Storage Abstraction

The application must depend on a common provider contract.

Conceptually:

```js
class StorageProvider {
  async getTeams() {}
  async getTeam(id) {}
  async createTeam(team) {}
  async updateTeam(team) {}
  async deleteTeam(id) {}

  async getMatches() {}
  async getMatch(id) {}
  async createMatch(match) {}
  async updateMatch(match) {}
  async deleteMatch(id) {}

  async getMatchEvents(matchId) {}
  async saveMatchEvent(matchId, event) {}
  async deleteMatchEvent(matchId, eventId) {}

  async exportData() {}
  async importData(data) {}
  async clearApplicationData() {}
}
```

The exact implementation can use functions/interfaces instead of classes.

## LocalStorage Provider

Suggested key:

```text
cricket_app_data
```

The value is the complete versioned backup/application object.

Do not let components call `localStorage` directly.

Use safe JSON parsing and stringification.

Handle:
- Missing key
- Invalid JSON
- Quota errors
- Corrupt data

## Firebase Provider

Recommended Firestore structure:

```text
teams/{teamId}
matches/{matchId}
matches/{matchId}/events/{eventId}
```

Do not create a second scoring implementation for Firebase.

Firebase only persists the same data/events produced by the scoring engine.

## Firebase Writes

Prefer efficient operations.

A normal delivery should not rewrite unrelated teams or matches.

Avoid polling.

Do not create unnecessary listeners.

## Real-Time Capability

Provide a provider capability such as:

```js
subscribeToMatch(matchId, callback)
```

only if useful.

The first version assumes one scorer per match.

## Storage Status

Display:
- `Storage: LocalStorage`
- `Storage: Firebase`

This is informational only.

## Cross-Storage Equivalence

The same actions must result in equivalent data:

```text
Create Team
Add Player
Create Match
Score Event
Undo
Complete Match
Export
Import
Delete
```

A backup exported from either provider must be importable into the other.

## Clear Data

LocalStorage:
- Remove only this application's key.

Firebase:
- Delete only this application's collections/documents.
- Never delete unrelated Firebase project data.

Use strong confirmation for Firebase deletion.
