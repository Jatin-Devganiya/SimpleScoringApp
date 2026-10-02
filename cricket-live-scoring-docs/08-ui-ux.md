# UI / UX Specification

## Primary Goal

The scorer must be able to score quickly without navigating complicated screens.

## Main Navigation

Simple sections:
- Dashboard
- Teams
- Matches
- Settings / Backup

Live scoring should be easy to resume.

## Team Screen

Simple list:

```text
Teams

Team A
  5 Players
  Edit
  Delete

Team B
  7 Players
  Edit
  Delete

+ Add Team
```

## Match Creation

Keep it short:

```text
Team 1
Team 2
Overs
Batting Team

START
```

Then:

```text
Opening Batsman
Opening Batsman
Opening Bowler

START MATCH
```

## Live Score Layout

Prioritize:

```text
TEAM A 87/3
10.2 OV

CRR 8.42

★ Striker
Player A 35 (24)

Non-Striker
Player B 30 (22)

Bowler
Player B1 2/18

[ 0 ] [ 1 ] [ 2 ]
[ 3 ] [ 4 ] [ 5 ]
[ 6 ] [ WICKET ]

[ WIDE ] [ NO BALL ]

Current Over:
1 | 4 | 0 | W | WD | 6

[ UNDO ]
```

Exact visual styling may change.

## Touch Targets

Scoring buttons must be large and easy to tap.

Normal score should require one tap.

## Wicket Workflow

```text
WICKET
  ↓
Select replacement batsman
  ↓
Continue
```

Do not force unnecessary forms.

## No Ball Workflow

```text
NO BALL
  ↓
Select additional bat runs if supported
  ↓
Continue
```

## Current Over

Show simple symbols:
- `0`
- `1`
- `2`
- `3`
- `4`
- `5`
- `6`
- `W`
- `WD`
- `NB`

## Status

Clearly show:
- In Progress
- Completed
- First Innings
- Second Innings

## Storage Indicator

Show:

```text
Storage: LocalStorage
```

or:

```text
Storage: Firebase
```

## Error Messages

Use plain language.

Examples:
- `Unable to save match. Please try again.`
- `Firebase connection is unavailable.`
- `This backup file is invalid.`
- `Please select two different teams.`

Do not show stack traces to users.

## Responsive Design

Mobile-first, but also support:
- Tablet
- Desktop

Avoid excessive animations.

The application is a utility/scoring tool, not a content-heavy website.
