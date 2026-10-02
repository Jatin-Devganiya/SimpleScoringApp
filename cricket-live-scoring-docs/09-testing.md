# Testing and Acceptance Criteria

## 1. Team Tests

Verify:
- Create team
- Edit team
- Delete team
- Add player
- Edit player
- Delete player
- Duplicate player prevention

## 2. Match Setup Tests

Verify:
- Cannot select same team twice.
- Batting team selection automatically determines bowling team.
- Opening batsmen are different.
- Opening batsman belongs to batting team.
- Bowler belongs to bowling team.

## 3. Normal Ball Tests

Sequence:

```text
1
4
0
6
2
```

Verify:
- Each consumes one legal ball.
- Batsman balls are correct.
- Team score is correct.
- Strike rotation is correct.

## 4. Wide Test

Sequence:

```text
1
4
WIDE
2
```

Verify:
- Wide adds one team run.
- Wide adds one extra.
- Wide adds bowler run.
- Wide does not increase legal balls.
- Wide does not increase batsman balls.

## 5. No Ball Test

Sequence:

```text
NO BALL + 4
```

Verify:
- Team +5.
- Batsman +4.
- No-ball extra +1.
- Bowler +5.
- Legal balls unchanged.
- Batsman ball faced unchanged.

## 6. Wicket Test

Verify:
- Wicket increments wickets.
- Wicket consumes legal ball.
- Dismissed batsman is marked out.
- Replacement is required.
- Invalid replacement cannot be selected.

## 7. Over Test

After six legal balls:
- Over changes from `0.5` to `1.0`.
- Strike swaps at over completion.

Include wides/no-balls and confirm they do not incorrectly complete the over.

## 8. Undo Test

After every event type:
- Add event.
- Undo.
- Verify all state returns exactly to the previous state.

Test:
- Run
- Wicket
- Wide
- No-ball
- End-of-over event

## 9. Second Innings Test

Verify:
- Correct opposite batting team.
- Target = first innings score + 1.
- Required runs correct.
- Remaining balls correct.
- Required run rate correct.

## 10. Match Completion Test

Verify:
- Chasing team reaches target.
- All wickets lost.
- Overs exhausted.
- Completed match cannot continue scoring.

## 11. Refresh Test

During an in-progress match:
1. Score several balls.
2. Refresh browser.
3. Resume match.
4. Verify exact state.

## 12. LocalStorage Test

Set:

```text
VITE_USE_LOCAL_STORAGE=true
```

Verify all features.

No Firebase database operation should be required.

## 13. Firebase Test

Set:

```text
VITE_USE_LOCAL_STORAGE=false
```

Verify all features.

Data must survive refresh.

## 14. Cross-Storage Migration Test

### LocalStorage → Firebase
1. Create teams.
2. Create completed match.
3. Create in-progress match.
4. Export.
5. Switch provider.
6. Import.
7. Compare all data.

### Firebase → LocalStorage
Perform the reverse.

## 15. Backup Tests

Verify:
- Export creates valid JSON.
- Invalid JSON is rejected.
- Unsupported version is rejected.
- Import requires confirmation.
- Import restores all events.
- Import does not create duplicate IDs unexpectedly.

## 16. Clear Data Tests

LocalStorage:
- Only application key is cleared.

Firebase:
- Only application collections/documents are cleared.

## 17. UI Tests

Verify on:
- Mobile width
- Tablet width
- Desktop width

Scoring buttons must remain easy to use.

## 18. Regression Principle

Any change to scoring logic must run the complete scoring test suite.

Any change to storage must run both LocalStorage and Firebase test suites.

Business logic must never be tested only against one provider.
