# Simple Live Cricket Scoring Web App

## Purpose
A very simple, fast, mobile-friendly React frontend for live cricket scoring.

The application has two interchangeable storage modes:

- `VITE_USE_LOCAL_STORAGE=true` → browser LocalStorage
- `VITE_USE_LOCAL_STORAGE=false` → Firebase Firestore

There is no custom backend, login, or signup.

## Core Principles
1. Keep scoring extremely fast and simple.
2. Keep cricket/business logic independent from storage.
3. LocalStorage and Firebase must provide the same application behavior.
4. Use one common storage abstraction.
5. Use event-based scoring so matches can be recalculated and undone safely.
6. Export/import must use the same JSON format for both storage modes.
7. In-progress matches must survive refresh.
8. Do not over-engineer the first version.

## Main Features
- Team management
- Player management
- Match creation
- Live scoring
- Runs: 0–6
- Wicket
- Wide
- No Ball
- Strike rotation
- Over calculation
- Batting statistics
- Bowling statistics
- Extras
- Undo last ball
- Second innings
- Target and required run rate
- Match completion
- Match history
- Scorecard
- JSON export/import
- LocalStorage/Firebase feature flag

## Documentation
- `01-requirements.md` — functional requirements
- `02-architecture.md` — application architecture
- `03-scoring-rules.md` — cricket/scoring rules
- `04-data-model.md` — entities and event model
- `05-storage.md` — storage abstraction and LocalStorage/Firebase behavior
- `06-firebase.md` — Firebase setup and Firestore requirements
- `07-import-export.md` — backup/import/export specification
- `08-ui-ux.md` — UI/UX requirements
- `09-testing.md` — acceptance and test cases
- `10-agent-tasks.md` — implementation order for a coding agent

## Technology
- React
- JavaScript or TypeScript
- Vite
- Firebase Web SDK / Firestore
- Browser LocalStorage
- CSS

No ASP.NET Core, Node backend, SQL Server, MongoDB, REST API, or GraphQL backend.
