# Master Coding Agent Prompt

You are implementing a simple live cricket scoring React application.

Read all Markdown specification files in this folder before changing code.

## Primary Goal

Build a production-ready but intentionally simple frontend-only cricket scorer with two interchangeable persistence providers:

```text
VITE_USE_LOCAL_STORAGE=true
    -> LocalStorage

VITE_USE_LOCAL_STORAGE=false
    -> Firebase Firestore
```

## Non-Negotiable Architecture

```text
UI
 ↓
Application Services
 ↓
Storage Abstraction

Scoring Engine is independent from all storage.
```

Never put Firebase SDK calls or `localStorage` calls inside React components.

## Non-Negotiable Functional Scope

Implement:
- Teams
- Players
- Match creation
- Overs
- Batting team selection
- Automatic bowling team
- Opening batsmen
- Opening bowler
- Runs 0–6
- Wicket
- Wide
- No-ball
- Strike rotation
- Over calculation
- Batting statistics
- Bowling statistics
- Extras
- Undo
- Second innings
- Target
- Required runs
- Required run rate
- Match completion
- Match history
- Resume
- Scorecard
- JSON export/import
- LocalStorage/Firebase feature flag

Do not add:
- Login
- Signup
- Custom backend
- Tournament management
- Payments
- Ads
- Player profiles
- Team logos
- Unrequested advanced cricket rules

## Important Cricket Rule

Store legal balls, not decimal overs.

```text
6 legal balls = 1 over
```

Wide and no-ball do not consume legal balls.

## Important Data Rule

Every scoring action creates an event.

Events are the authoritative delivery history.

Derived statistics must be reconstructable from events.

## Important Storage Rule

The exact same application data and event model must be used in both providers.

## Important Backup Rule

The JSON backup format must be provider-neutral.

A backup exported from LocalStorage must import into Firebase, and vice versa.

## Important Failure Rule

Never silently lose a scoring event.

Never silently fall back from Firebase to LocalStorage.

## Development Approach

Before implementation:
1. Read all specification files.
2. Inspect existing project structure if code already exists.
3. Identify missing pieces.
4. Implement in the order in `10-agent-tasks.md`.

After implementation:
1. Run tests.
2. Run build.
3. Test LocalStorage mode.
4. Test Firebase mode.
5. Test cross-provider import/export.
6. Fix all functional regressions.

## Code Quality

Prefer:
- Small focused modules
- Pure scoring functions
- Explicit types/models where useful
- Centralized configuration
- Reusable UI components
- Clear error handling
- Minimal dependencies

Avoid:
- Giant components
- Storage logic in UI
- Duplicated scoring logic
- Hidden global state
- Array indexes as IDs
- Floating-point overs as source of truth

## Final Response

When implementation is complete, report:
- What was implemented
- Files created/changed
- How to run
- How to configure LocalStorage mode
- How to configure Firebase mode
- Test/build results
- Any known limitations
