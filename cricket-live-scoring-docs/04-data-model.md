# Data Model

## Application Backup Root

```js
{
  version: 1,
  teams: [],
  matches: [],
  metadata: {
    lastUpdated: "ISO timestamp"
  }
}
```

## Team

```js
{
  id: "team-id",
  name: "Team A",
  players: [
    {
      id: "player-id",
      name: "Player A1"
    }
  ],
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp"
}
```

## Match

```js
{
  id: "match-id",
  team1Id: "team-id",
  team2Id: "team-id",
  battingFirstTeamId: "team-id",
  bowlingFirstTeamId: "team-id",
  totalOvers: 20,
  status: "IN_PROGRESS",
  innings: [
    {
      id: "innings-id",
      battingTeamId: "team-id",
      bowlingTeamId: "team-id",
      currentStrikerId: "player-id",
      currentNonStrikerId: "player-id",
      currentBowlerId: "player-id",
      completed: false,
      startedAt: "ISO timestamp",
      completedAt: null
    }
  ],
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp",
  completedAt: null
}
```

## Scoring Event

```js
{
  id: "event-id",
  inningsId: "innings-id",
  sequence: 12,

  type: "RUN",
  runs: 4,

  legalBall: true,

  overNumber: 3,
  ballNumber: 4,

  strikerId: "player-id",
  nonStrikerId: "player-id",
  bowlerId: "player-id",

  batRuns: 4,
  extraRuns: 0,

  timestamp: "ISO timestamp"
}
```

## Event Types

Recommended:
- `RUN`
- `WICKET`
- `WIDE`
- `NO_BALL`

Future event types can include:
- `BYE`
- `LEG_BYE`
- `DEAD_BALL`
- `PENALTY`

Do not implement future types unless required by the current scope.

## Wicket Event

A wicket event should have enough information to undo and reconstruct state.

Example:

```js
{
  id: "event-id",
  type: "WICKET",
  runs: 0,
  legalBall: true,
  strikerId: "player-id",
  nonStrikerId: "player-id",
  bowlerId: "player-id",
  dismissedPlayerId: "player-id",
  timestamp: "ISO timestamp"
}
```

## No Ball Event

```js
{
  id: "event-id",
  type: "NO_BALL",
  runs: 5,
  batRuns: 4,
  extraRuns: 1,
  legalBall: false,
  strikerId: "player-id",
  nonStrikerId: "player-id",
  bowlerId: "player-id",
  timestamp: "ISO timestamp"
}
```

## Wide Event

```js
{
  id: "event-id",
  type: "WIDE",
  runs: 1,
  batRuns: 0,
  extraRuns: 1,
  legalBall: false,
  strikerId: "player-id",
  nonStrikerId: "player-id",
  bowlerId: "player-id",
  timestamp: "ISO timestamp"
}
```

## Status Values

Match:
- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETED`
- `ABANDONED`

Innings:
- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETED`

Player dismissal/status:
- `NOT_OUT`
- `OUT`

## Important Data Rules

- IDs must be stable unique identifiers.
- Never use array indexes as permanent IDs.
- Store timestamps as ISO strings in portable backup data.
- Keep backup schema versioned.
- Do not store derived statistics as the only source of truth.
- Events are the authoritative delivery history.
