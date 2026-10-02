# Cricket Scoring Rules

## 1. Legal Ball

These are legal balls:
- 0
- 1
- 2
- 3
- 4
- 5
- 6
- Wicket

These are not legal balls:
- Wide
- No Ball

## 2. Overs

Store `legalBalls` internally.

Never use floating-point overs as the source of truth.

Examples:

```text
0 balls -> 0.0
1 ball  -> 0.1
2 balls -> 0.2
5 balls -> 0.5
6 balls -> 1.0
7 balls -> 1.1
```

Use:

```js
formatOvers(legalBalls)
```

## 3. Runs

For a normal run:
- Team score increases by runs.
- Legal ball increases by 1.
- Bowler runs increase by runs.
- Batsman runs increase by runs.
- Batsman balls faced increase by 1.

## 4. Strike Rotation

After legal delivery:
- 1 run -> swap
- 3 runs -> swap
- 5 runs -> swap

At end of every completed over:
- Swap striker and non-striker.

For 0, 2, 4, 6:
- No run-based swap.

Wicket strike behavior must be represented explicitly in the event/state model rather than relying on assumptions about dismissal type.

## 5. Wide

Default wide:
- Team +1
- Wide extras +1
- Bowler runs +1
- Legal balls unchanged
- Batsman balls unchanged

The data model should allow future support for multi-run wides.

## 6. No Ball

Basic no-ball:
- Team +1
- No-ball extras +1
- Bowler runs +1
- Legal balls unchanged

If bat runs are supported:
`NO BALL + 4` means:
- 1 no-ball extra
- 4 batsman runs
- 5 total team/bowler runs

The model should allow the no-ball event to carry `batRuns` and `extraRuns`.

## 7. Wicket

Default wicket:
- Wickets +1
- Legal balls +1
- Batsman balls +1
- Bowler legal balls +1
- Current batsman becomes out
- Replacement batsman must be selected

## 8. Batting Statistics

Store/calculate:
- Runs
- Balls
- Fours
- Sixes
- Strike rate
- Status

Formula:

```text
Strike Rate = Runs / Balls * 100
```

If balls = 0, strike rate = 0.

## 9. Bowling Statistics

Store/calculate:
- Legal balls
- Overs
- Runs conceded
- Wickets
- Economy

Formula:

```text
Economy = Runs Conceded / Legal Overs
```

Calculate from legal balls to avoid decimal-over errors.

## 10. Team Score

Display:
- Runs
- Wickets
- Overs
- Extras

## 11. Current Run Rate

Use:

```text
CRR = Team Runs / (Legal Balls / 6)
```

If legal balls = 0, CRR = 0.

## 12. Target

Second innings:

```text
Target = First Innings Runs + 1
```

## 13. Required Runs

```text
Required Runs = Target - Current Runs
```

## 14. Required Run Rate

```text
RRR = Required Runs / Remaining Legal Balls * 6
```

If remaining balls = 0, do not divide by zero.

## 15. Innings Completion

Complete innings when:
- Maximum legal balls are reached, or
- All wickets are lost, or
- User manually ends innings.

## 16. Match Completion

Second innings completes when:
- Current score reaches target, or
- Legal balls are exhausted, or
- All wickets are lost, or
- User manually ends innings.

## 17. Event-Based Source of Truth

Every delivery must be an immutable scoring event.

Derived statistics should be recalculable from the event list.

This is required for reliable:
- Undo
- Scorecard
- Backup/restore
- Data migration
- Debugging
