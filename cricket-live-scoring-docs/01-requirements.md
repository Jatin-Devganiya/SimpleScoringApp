# Functional Requirements

## 1. Teams
A team contains only:
- `id`
- `name`
- `players`

A player contains only:
- `id`
- `name`

Operations:
- Create team
- Edit team
- Delete team
- Add player
- Edit player
- Delete player

Do not add logos, cities, captain, coach, colors, or profiles.

Do not allow duplicate player names within a team.

## 2. Match Creation
Required:
- Team 1
- Team 2
- Number of overs
- Batting team

The other team automatically becomes bowling team.

Rules:
- Same team cannot be selected twice.
- Opening batsman 1 and 2 must be different.
- Opening bowler must belong to bowling team.

## 3. Live Scoring
Buttons:
- 0
- 1
- 2
- 3
- 4
- 5
- 6
- WICKET
- WIDE
- NO BALL

Normal runs and wickets are legal balls.
Wide and no-ball are not legal balls.

## 4. Wicket
A wicket:
- Adds one wicket
- Counts one legal ball
- Counts one batsman ball faced
- Counts one bowler legal ball
- Requires selecting a replacement batsman

Replacement cannot be:
- Already out
- Current non-striker
- Current striker

## 5. Match
First innings completes when:
- All wickets are lost, or
- Overs are exhausted, or
- User manually ends innings.

Second innings uses the opposite team.

## 6. Match Completion
Chasing team wins when score >= target.

Defending team wins when:
- Chasing team does not reach target, and
- Overs are exhausted, or
- All wickets are lost.

## 7. Persistence
Every important operation must be persisted immediately.

Refresh must not lose an in-progress match.

## 8. Undo
Provide `UNDO LAST BALL`.

Undo must restore all state affected by the event.

## 9. Match History
Actions:
- Resume
- View Scorecard
- Delete

## 10. Scorecard
Batting:
- Runs
- Balls
- 4s
- 6s
- Strike rate
- Status

Bowling:
- Overs
- Runs
- Wickets
- Economy

## 11. Backup
Provide:
- Export Data
- Import Data
- Clear All Data

Import must validate version and structure before replacing data.

## 12. Storage Feature Flag
`VITE_USE_LOCAL_STORAGE=true`:
- LocalStorage only
- No Firebase database operations

`VITE_USE_LOCAL_STORAGE=false`:
- Firebase Firestore
- No LocalStorage persistence for application data

Both modes must behave identically.
