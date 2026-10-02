# Application Architecture

## Architectural Goal

The application must have one business/application layer and two interchangeable persistence implementations.

```text
React UI
   |
Application Services
   |
Scoring Engine
   |
Storage Interface
   |
+-------------------------+
|                         |
LocalStorageProvider  FirebaseStorageProvider
|                         |
LocalStorage          Firestore
```

## Responsibilities

### UI
Responsible for:
- Rendering
- User input
- Navigation
- Forms
- Buttons
- Displaying state/errors

UI must not directly call:
- `localStorage`
- Firestore SDK

### Scoring Engine
Responsible for:
- Runs
- Wickets
- Legal balls
- Overs
- Strike
- Batting statistics
- Bowling statistics
- Extras
- Match completion
- Target
- Required run rate

It must have no Firebase or LocalStorage dependency.

### Application Services
Responsible for workflows:
- TeamService
- MatchService
- ScoringService
- BackupService
- DataMigrationService

### Storage Provider
Responsible for CRUD/persistence only.

## Provider Contract

Use a common interface/contract such as:

```js
getTeams()
getTeam(teamId)
createTeam(team)
updateTeam(team)
deleteTeam(teamId)

getMatches()
getMatch(matchId)
createMatch(match)
updateMatch(match)
deleteMatch(matchId)

getMatchEvents(matchId)
saveMatchEvent(matchId, event)
deleteMatchEvent(matchId, eventId)

exportData()
importData(data)
clearApplicationData()

subscribeToMatch(matchId, callback) // optional/common capability
```

Exact method names may be improved, but both providers must expose equivalent behavior.

## Storage Factory

```js
createStorageProvider()
```

must choose exactly one provider based on the feature flag.

Do not scatter feature-flag checks throughout the UI.

## Recommended Project Structure

```text
src/
├── config/
│   ├── appConfig.js
│   └── firebaseConfig.js
├── storage/
│   ├── StorageProvider.js
│   ├── LocalStorageProvider.js
│   ├── FirebaseStorageProvider.js
│   └── storageFactory.js
├── services/
│   ├── TeamService.js
│   ├── MatchService.js
│   ├── ScoringService.js
│   ├── BackupService.js
│   └── DataMigrationService.js
├── engines/
│   └── scoringEngine.js
├── components/
├── pages/
└── utils/
```

## Dependency Rules

- Components depend on services.
- Services depend on the storage contract.
- Scoring engine must remain storage-independent.
- LocalStorageProvider depends only on browser storage APIs.
- FirebaseStorageProvider depends only on Firebase SDK.
- Firebase configuration must not leak into unrelated components.
