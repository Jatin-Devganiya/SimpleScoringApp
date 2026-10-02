# Coding Agent Implementation Plan

## Objective

Build the complete React live cricket scoring application according to the Markdown specifications in this folder.

## Phase 1 — Project Setup

Tasks:
1. Create React + Vite project.
2. Choose JavaScript or TypeScript and use it consistently.
3. Install required dependencies.
4. Add environment configuration.
5. Add `.env.example`.
6. Create base application structure.
7. Add basic responsive CSS.

Do not implement advanced UI yet.

## Phase 2 — Configuration

Create:
- `appConfig`
- Firebase configuration
- Storage factory

Implement:

```text
VITE_USE_LOCAL_STORAGE=true
```

and:

```text
VITE_USE_LOCAL_STORAGE=false
```

Validate Firebase configuration when Firebase mode is active.

## Phase 3 — Storage Abstraction

Implement:
- StorageProvider contract
- LocalStorageProvider
- FirebaseStorageProvider
- storageFactory

Do not add cricket logic here.

Test CRUD behavior in both providers.

## Phase 4 — Data Model

Implement:
- Team model
- Player model
- Match model
- Innings model
- Scoring event model
- Backup format

Use stable IDs.

## Phase 5 — Team Management

Implement:
- Team list
- Add team
- Edit team
- Delete team
- Add player
- Edit player
- Delete player

Persist through the storage provider only.

## Phase 6 — Cricket Scoring Engine

Implement and unit-test:
- `addRun`
- `addWicket`
- `addWide`
- `addNoBall`
- `formatOvers`
- strike rotation
- over completion
- batting stats
- bowling stats
- extras
- CRR
- target
- RRR
- innings completion
- match completion

No Firebase/LocalStorage dependency.

## Phase 7 — Match Management

Implement:
- Create match
- Match setup
- Opening batsmen
- Opening bowler
- Start innings
- Resume match
- End innings
- Start second innings
- Complete match

## Phase 8 — Live Scoring UI

Implement:
- Score display
- Batsmen
- Bowler
- Score buttons
- Wide
- No-ball
- Wicket replacement
- Current over
- Over history
- Undo

Prioritize mobile usability.

## Phase 9 — Persistence

After every scoring action:
1. Update local state.
2. Persist through active provider.
3. Handle failures.

Refreshing must restore the exact state.

## Phase 10 — Scorecard

Implement:
- Batting scorecard
- Bowling scorecard
- Extras
- Final result

## Phase 11 — Backup

Implement:
- Export
- Import
- Validation
- Version migration
- Clear all data

Use the same portable JSON format in both providers.

## Phase 12 — Firebase

Implement:
- Firestore collections
- CRUD
- Match events
- Required indexes/rules if necessary
- Friendly connection errors
- Efficient reads/writes

Do not add authentication.

## Phase 13 — Cross-Provider Verification

Run:
- LocalStorage complete test suite
- Firebase complete test suite
- LocalStorage → Firebase migration
- Firebase → LocalStorage migration

Compare:
- Teams
- Players
- Matches
- Innings
- Events
- Scores
- Statistics

## Phase 14 — UI Polish

Only after functional correctness:
- Mobile layout
- Touch-friendly buttons
- Empty states
- Error messages
- Loading states
- Storage indicator
- Confirmation dialogs

Avoid unnecessary visual complexity.

## Phase 15 — Final Deliverables

Provide:
- Complete source code
- `package.json`
- `.env.example`
- `firestore.rules`
- README
- Tests
- Build instructions

Commands:

```bash
npm install
npm run dev
npm run build
```

## Coding Rules

1. Do not create a backend.
2. Do not add login/signup.
3. Do not duplicate scoring logic for storage providers.
4. Do not access LocalStorage from React components.
5. Do not access Firebase directly from React components.
6. Keep scoring engine pure and testable.
7. Use stable IDs.
8. Use legal balls as the source of truth for overs.
9. Use events as the source of truth for delivery history.
10. Persist immediately.
11. Handle Firebase failures explicitly.
12. Do not silently fall back from Firebase to LocalStorage.
13. Do not add features outside the defined scope without justification.
14. Keep the UI extremely simple.

## Definition of Done

The project is complete only when:
- All required features work.
- LocalStorage mode works.
- Firebase mode works.
- Both modes behave equivalently.
- Undo works.
- Refresh/resume works.
- Import/export works.
- Cross-provider migration works.
- Scoring tests pass.
- Production build succeeds.
