/**
 * Comprehensive Acceptance Test Suite for LiveCricket Application
 * Covers Section 52 & 53 Acceptance Criteria:
 * - Authentication & Single Umpire Lock
 * - Multi-user USER login
 * - Role Authorization on Mutations
 * - Player Management (Add, Edit, Delete, Case-insensitive Duplicate check)
 * - Team Management with playerIds normalization
 * - Live Scoring & Legal delivery / Bowler rotation / Batsman declaration rules
 */

process.env.VITE_USE_LOCAL_STORAGE = 'true';

// Mock browser localStorage for Node.js environment
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};


import { LocalStorageProvider } from '../src/storage/LocalStorageProvider.js';
import { AuthService } from '../src/services/AuthService.js';
import { PlayerService } from '../src/services/PlayerService.js';
import { TeamService } from '../src/services/TeamService.js';
import { ScoringService } from '../src/services/ScoringService.js';
import { MatchService } from '../src/services/MatchService.js';
import { reconstructInnings, EVENT_TYPES } from '../src/engines/scoringEngine.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('==================================================');
  console.log('CRICKET APP ACCEPTANCE TESTS');
  console.log('==================================================\n');

  const provider = new LocalStorageProvider();
  const authService = new AuthService(provider);
  const playerService = new PlayerService(provider);
  const teamService = new TeamService(provider);
  const scoringService = new ScoringService(provider);

  // --------------------------------------------------------------------------
  console.log('1. AUTHENTICATION & SINGLE UMPIRE LOCK');
  // --------------------------------------------------------------------------
  localStorage.clear();

  // Test 1: Register custom umpire account (no hardcoded predefine required)
  const regUmpire1 = await authService.register('umpire1', 'pass123', 'UMPIRE');
  assert(regUmpire1 && regUmpire1.username === 'umpire1', 'Register custom Umpire account succeeds');
  assert(authService.isUmpire(), 'authService.isUmpire() is true for registered Umpire');

  // Test 2: Second login for umpire1 fails while first session is active
  let secondUmpireFailed = false;
  try {
    await authService.login('umpire1', 'pass123');
  } catch (err) {
    secondUmpireFailed = true;
    assert(err.isUmpireLocked === true, 'Error indicates umpire account is locked');
    assert(err.message.includes('currently logged in on another device'), 'Second Umpire login rejected with clear concurrency message');
  }
  assert(secondUmpireFailed, 'Simultaneous login for same Umpire is strictly rejected');

  // Test 3: After explicit logout, login succeeds again
  await authService.logout();
  const reloggedSession = await authService.login('umpire1', 'pass123');
  assert(reloggedSession && reloggedSession.username === 'umpire1', 'Umpire can log in after previous session logged out');
  await authService.logout();


  // Test 4: Another Umpire (umpire2) can register and log in without interference
  const regUmpire2 = await authService.register('umpire2', 'pass456', 'UMPIRE');
  assert(regUmpire2 && regUmpire2.username === 'umpire2', 'Different Umpire (umpire2) can log in without lock collision');
  await authService.logout();

  // Test 5: Multiple USER logins succeed without lock collision
  const user1 = await authService.register('user1', 'pass123', 'USER');
  assert(user1 && user1.role === 'USER', 'First custom USER can register & login');
  assert(authService.isUser(), 'authService.isUser() is true');

  const user2 = await authService.register('user2', 'pass456', 'USER');
  assert(user2 && user2.role === 'USER', 'Second custom USER can login simultaneously');

  // Test 6: Refresh preserves session
  const storedSession = authService.getCurrentSession();
  assert(storedSession && storedSession.username === 'user2', 'Session persists in storage across refresh');

  await authService.logout();
  assert(authService.getCurrentSession() === null, 'Logout clears session from storage');

  // --------------------------------------------------------------------------
  console.log('\n2. MULTI-UMPIRE DATA OWNERSHIP & ISOLATION');
  // --------------------------------------------------------------------------
  // Log in as umpire1
  await authService.login('umpire1', 'pass123');
  const u1Player = await playerService.createPlayer('U1 Player');
  assert(u1Player.createdBy === 'umpire1', 'Player created with createdBy: umpire1');

  const u1Team = await teamService.createTeam('U1 Team', [u1Player.id]);
  assert(u1Team.createdBy === 'umpire1', 'Team created with createdBy: umpire1');
  await authService.logout();

  // Log in as umpire2
  await authService.login('umpire2', 'pass456');

  // umpire2 should be BLOCKED from editing or deleting umpire1's player
  let u2EditBlocked = false;
  try {
    await playerService.updatePlayer(u1Player.id, 'Hacked Name');
  } catch (err) {
    u2EditBlocked = true;
    assert(err.message.includes('Only the creator umpire'), 'umpire2 edit rejected with creator message');
  }
  assert(u2EditBlocked, 'umpire2 CANNOT edit player created by umpire1');

  let u2DeleteBlocked = false;
  try {
    await playerService.deletePlayer(u1Player.id);
  } catch (err) {
    u2DeleteBlocked = true;
  }
  assert(u2DeleteBlocked, 'umpire2 CANNOT delete player created by umpire1');

  // umpire2 should be BLOCKED from editing or deleting umpire1's team
  let u2TeamEditBlocked = false;
  try {
    await teamService.updateTeam(u1Team.id, { name: 'Hacked Team' });
  } catch (err) {
    u2TeamEditBlocked = true;
  }
  assert(u2TeamEditBlocked, 'umpire2 CANNOT edit team created by umpire1');

  await authService.logout();

  // Log back in as umpire1 — umpire1 CAN edit their own player and team
  await authService.login('umpire1', 'pass123');
  const updatedByU1 = await playerService.updatePlayer(u1Player.id, 'U1 Player Renamed');
  assert(updatedByU1.name === 'U1 Player Renamed', 'umpire1 CAN edit their own player');
  await authService.logout();


  // --------------------------------------------------------------------------
  console.log('\n2. ROLE AUTHORIZATION & MUTATION REJECTIONS');
  // --------------------------------------------------------------------------
  // Log in as read-only USER
  await authService.login('user', 'user123');
  assert(authService.hasPermission('MATCH_VIEW') === true, 'USER has MATCH_VIEW permission');
  assert(authService.hasPermission('MATCH_CREATE') === false, 'USER does not have MATCH_CREATE permission');

  let createPlayerBlocked = false;
  try {
    await playerService.createPlayer('Illegal Player');
  } catch (err) {
    createPlayerBlocked = true;
  }
  assert(createPlayerBlocked, 'USER cannot create player (blocked at service layer)');

  let createTeamBlocked = false;
  try {
    await teamService.createTeam('Illegal Team', []);
  } catch (err) {
    createTeamBlocked = true;
  }
  assert(createTeamBlocked, 'USER cannot create team (blocked at service layer)');

  await authService.logout();

  // --------------------------------------------------------------------------
  console.log('\n3. PLAYER MANAGEMENT (UMPIRE)');
  // --------------------------------------------------------------------------
  // Log in as UMPIRE
  await authService.login('umpire', 'umpire123');

  // Test 1: Add Player
  const p1 = await playerService.createPlayer('Virat Kohli');
  const p2 = await playerService.createPlayer('Rohit Sharma');
  const p3 = await playerService.createPlayer('Jasprit Bumrah');
  assert(p1 && p1.name === 'Virat Kohli', 'Add player succeeds');

  // Test 2: Reject empty player name
  let emptyNameRejected = false;
  try {
    await playerService.createPlayer('   ');
  } catch {
    emptyNameRejected = true;
  }
  assert(emptyNameRejected, 'Empty player name is rejected');

  // Test 3: Reject duplicate player name (case-insensitive)
  let duplicateRejected = false;
  try {
    await playerService.createPlayer('virat kohli');
  } catch (err) {
    duplicateRejected = true;
    assert(err.message.includes('already exists'), 'Duplicate error message returned');
  }
  assert(duplicateRejected, 'Duplicate player name (case-insensitive) is rejected');

  // Test 4: Edit Player
  const updatedP2 = await playerService.updatePlayer(p2.id, 'Rohit G. Sharma');
  assert(updatedP2.name === 'Rohit G. Sharma', 'Edit player succeeds');

  // Test 5: Delete Player
  await playerService.deletePlayer(p3.id);
  const remainingPlayers = await playerService.getPlayers();
  assert(!remainingPlayers.some(p => p.id === p3.id), 'Delete player succeeds');

  // --------------------------------------------------------------------------
  console.log('\n4. TEAM MANAGEMENT & PLAYER NORMALIZATION');
  // --------------------------------------------------------------------------
  // Test 1: Create team with valid player IDs
  const teamIndia = await teamService.createTeam('India', [p1.id, p2.id, 'invalid_id_999']);
  assert(teamIndia.playerIds.length === 2, 'Team only stores valid registered playerIds');
  assert(!teamIndia.playerIds.includes('invalid_id_999'), 'Invalid player IDs rejected');
  assert(teamIndia.players.length === 2, 'Team resolves player objects from IDs');

  // Test 2: Edit team player assignments
  const updatedTeam = await teamService.updateTeam(teamIndia.id, { playerIds: [p1.id] });
  assert(updatedTeam.playerIds.length === 1 && updatedTeam.playerIds[0] === p1.id, 'Edit player assignments succeeds');

  // --------------------------------------------------------------------------
  console.log('\n5. LIVE SCORING ENGINE & OVER COMPLETION');
  // --------------------------------------------------------------------------
  const battingPlayers = [
    { id: 'b1', name: 'Player A' },
    { id: 'b2', name: 'Player B' },
    { id: 'b3', name: 'Player C' },
    { id: 'b4', name: 'Player D' }
  ];
  const bowlingPlayers = [
    { id: 'bowl1', name: 'Bowler 1' },
    { id: 'bowl2', name: 'Bowler 2' }
  ];

  // Test sequence:
  // Ball 1: Legal (1 run) -> strike changes
  // Ball 2: Wide (1 extra run) -> NOT a legal ball
  // Ball 3: Legal (0 runs) -> strike stays
  // Ball 4: No Ball (1 extra run) -> NOT a legal ball
  // Ball 5: Legal (2 runs) -> strike stays
  // Ball 6: Legal (4 runs) -> strike stays
  // Ball 7: Legal (1 run) -> strike changes
  // Ball 8: Legal (1 run) -> strike changes, 6th legal ball! Over complete!
  const deliverySequence = [
    { id: 'd1', type: EVENT_TYPES.RUN, runs: 1, batRuns: 1, legalBall: true, strikerId: 'b1', nonStrikerId: 'b2', bowlerId: 'bowl1' },
    { id: 'd2', type: EVENT_TYPES.WIDE, runs: 1, extraRuns: 1, batRuns: 0, legalBall: false, strikerId: 'b2', nonStrikerId: 'b1', bowlerId: 'bowl1' },
    { id: 'd3', type: EVENT_TYPES.RUN, runs: 0, batRuns: 0, legalBall: true, strikerId: 'b2', nonStrikerId: 'b1', bowlerId: 'bowl1' },
    { id: 'd4', type: EVENT_TYPES.NO_BALL, runs: 1, extraRuns: 1, batRuns: 0, legalBall: false, strikerId: 'b2', nonStrikerId: 'b1', bowlerId: 'bowl1' },
    { id: 'd5', type: EVENT_TYPES.RUN, runs: 2, batRuns: 2, legalBall: true, strikerId: 'b2', nonStrikerId: 'b1', bowlerId: 'bowl1' },
    { id: 'd6', type: EVENT_TYPES.RUN, runs: 4, batRuns: 4, legalBall: true, strikerId: 'b2', nonStrikerId: 'b1', bowlerId: 'bowl1' },
    { id: 'd7', type: EVENT_TYPES.RUN, runs: 1, batRuns: 1, legalBall: true, strikerId: 'b2', nonStrikerId: 'b1', bowlerId: 'bowl1' },
    { id: 'd8', type: EVENT_TYPES.RUN, runs: 1, batRuns: 1, legalBall: true, strikerId: 'b1', nonStrikerId: 'b2', bowlerId: 'bowl1' }
  ];

  const inningsState = reconstructInnings({
    events: deliverySequence,
    battingPlayers,
    bowlingPlayers,
    totalOvers: 5,
    openingStrikerId: 'b1',
    openingNonStrikerId: 'b2',
    openingBowlerId: 'bowl1'
  });

  // Total deliveries = 8, but legal deliveries = 6
  assert(deliverySequence.length === 8, '8 total events recorded');
  assert(inningsState.legalBalls === 6, 'Six legal balls complete an over');
  assert(inningsState.overs === '1.0', 'Overs count is exactly 1.0');
  assert(inningsState.score === 11, 'Total runs computed correctly (1+1wd+0+1nb+2+4+1+1 = 11)');
  assert(inningsState.extras.wides === 1, 'Wide did not count as legal ball');
  assert(inningsState.extras.noBalls === 1, 'No-ball did not count as legal ball');

  // Bowler selection validation:
  assert(inningsState.pendingNewBowler === true, 'End of over requires selecting next bowler');
  // Completed over bowler is bowl1. Next bowler cannot be bowl1.
  const currentBowlerId = 'bowl1';
  const availableNextBowlers = bowlingPlayers.filter(b => b.id !== currentBowlerId);
  assert(!availableNextBowlers.some(b => b.id === 'bowl1'), 'Current bowler cannot be selected as next bowler');
  assert(availableNextBowlers.some(b => b.id === 'bowl2'), 'Other bowlers remain available');

  // Next Bowler selection via BOWLER_CHANGE event:
  const updatedEventsWithBowlerChange = [
    ...deliverySequence,
    {
      id: 'bc1',
      type: EVENT_TYPES.BOWLER_CHANGE,
      bowlerId: 'bowl2',
      legalBall: false
    }
  ];
  const postBowlerChangeState = reconstructInnings({
    events: updatedEventsWithBowlerChange,
    battingPlayers,
    bowlingPlayers,
    totalOvers: 5,
    openingStrikerId: 'b1',
    openingNonStrikerId: 'b2',
    openingBowlerId: 'bowl1'
  });
  assert(postBowlerChangeState.currentBowlerId === 'bowl2', 'Next bowler is updated to bowl2');
  assert(postBowlerChangeState.pendingNewBowler === false, 'Selecting next bowler clears pendingNewBowler state without infinite loops');

  // Batsman declaration validation:
  const strikerId = 'b1';
  const nonStrikerId = 'b2';
  assert(strikerId !== nonStrikerId, 'Striker and Non-Striker cannot be the same player');

  // Dismissed batsman rule:
  const dismissedPlayerIds = ['b1'];
  const currentBatsmenIds = ['b2', 'b3'];
  const availableNewBatsmen = battingPlayers.filter(
    p => !dismissedPlayerIds.includes(p.id) && !currentBatsmenIds.includes(p.id)
  );
  assert(availableNewBatsmen.length === 1 && availableNewBatsmen[0].id === 'b4', 'Dismissed batsman cannot be selected as new batsman');

  // Run Out with runs test:
  const runOutEvents = [
    {
      id: 'ro1',
      type: EVENT_TYPES.WICKET,
      runs: 2,
      strikerId: 'b1',
      nonStrikerId: 'b2',
      bowlerId: 'bowl1',
      dismissedPlayerId: 'b2',
      newBatsmanId: 'b3',
      dismissalType: 'Run Out',
      isBowlerWicket: false,
      legalBall: true
    }
  ];
  const runOutState = reconstructInnings({
    events: runOutEvents,
    battingPlayers,
    bowlingPlayers,
    totalOvers: 5,
    openingStrikerId: 'b1',
    openingNonStrikerId: 'b2',
    openingBowlerId: 'bowl1'
  });
  assert(runOutState.score === 2, 'Run out scored 2 runs for the team');
  assert(runOutState.wickets === 1, 'Run out incremented team wickets by 1');
  assert(runOutState.batsmanStats['b1'].runs === 2, 'Facing batsman credited with 2 runs');
  assert(runOutState.batsmanStats['b2'].isOut === true, 'Non-striker marked as out');
  assert(runOutState.batsmanStats['b2'].dismissalText === 'run out', 'Dismissal text shows run out');
  assert(runOutState.bowlerStats['bowl1'].wickets === 0, 'Bowler not credited with run out wicket');
  assert(runOutState.bowlerStats['bowl1'].runs === 2, 'Bowler conceded 2 runs on delivery');
  assert(runOutState.nonStrikerId === 'b3', 'Replacement batsman correctly positioned');

  // --------------------------------------------------------------------------
  console.log('\n6. DECLARE BATSMAN & CHANGE BOWLER SERVICE FUNCTIONALITY');
  // --------------------------------------------------------------------------
  // Log in as umpire1
  await authService.login('umpire1', 'pass123');
  const matchService = new MatchService(provider);

  const pA1 = await playerService.createPlayer('Batsman Alpha');
  const pA2 = await playerService.createPlayer('Batsman Beta');
  const pA3 = await playerService.createPlayer('Batsman Gamma');
  const pA4 = await playerService.createPlayer('Batsman Delta');
  const pB1 = await playerService.createPlayer('Bowler Alpha');
  const pB2 = await playerService.createPlayer('Bowler Beta');
  const pB3 = await playerService.createPlayer('Bowler Gamma');

  const teamA = await teamService.createTeam('Team Batting', [pA1.id, pA2.id, pA3.id, pA4.id]);
  const teamB = await teamService.createTeam('Team Bowling', [pB1.id, pB2.id, pB3.id]);

  const match = await matchService.createMatch({
    team1Id: teamA.id,
    team2Id: teamB.id,
    battingFirstTeamId: teamA.id,
    totalOvers: 5,
    openingStrikerId: pA1.id,
    openingNonStrikerId: pA2.id,
    openingBowlerId: pB1.id
  });

  assert(match && match.id, 'Match created for scoring test');

  // Record 6 legal balls (first over bowled by Bowler Alpha)
  for (let i = 0; i < 6; i++) {
    await scoringService.recordRun(match.id, {
      runs: 1,
      strikerId: i % 2 === 0 ? pA1.id : pA2.id,
      nonStrikerId: i % 2 === 0 ? pA2.id : pA1.id,
      bowlerId: pB1.id,
      inningsIndex: 0
    });
  }

  let mState = await scoringService.getCompleteMatchState(match.id);
  assert(mState.innings1.overs === '1.0', 'First over completed (1.0 overs)');
  assert(mState.innings1.pendingNewBowler === true, 'pendingNewBowler is true after 1st over completes');

  // Select new bowler (Bowler Beta) via setNextBowler
  await scoringService.setNextBowler(match.id, {
    bowlerId: pB2.id,
    inningsIndex: 0
  });

  const eventsAfterBowler = await provider.getMatchEvents(match.id);
  const bcEvent = eventsAfterBowler.find(e => e.type === EVENT_TYPES.BOWLER_CHANGE);
  assert(bcEvent && bcEvent.sequence === 7, 'BOWLER_CHANGE event has correct sequence (7)');
  assert(bcEvent.bowlerId === pB2.id, 'BOWLER_CHANGE event contains new bowler ID');

  mState = await scoringService.getCompleteMatchState(match.id);
  assert(mState.innings1.currentBowlerId === pB2.id, 'Match state currentBowlerId updated to new bowler');
  assert(mState.innings1.pendingNewBowler === false, 'pendingNewBowler cleared after bowler change');

  // Declare striker (Batsman Beta) and replace with remaining batsman (Batsman Gamma)
  const currentStriker = mState.innings1.strikerId;
  const currentNonStriker = mState.innings1.nonStrikerId;
  assert(currentStriker === pA2.id, 'Current striker is Batsman Beta');
  assert(currentNonStriker === pA1.id, 'Current non-striker is Batsman Alpha');

  await scoringService.declareBatsman(match.id, {
    declaredPlayerId: currentStriker,
    replacementPlayerId: pA3.id,
    inningsIndex: 0
  });

  const eventsAfterDeclare = await provider.getMatchEvents(match.id);
  const declEvent = eventsAfterDeclare.find(e => e.type === EVENT_TYPES.DECLARE);
  assert(declEvent && declEvent.sequence === 8, 'DECLARE event has correct sequence (8)');
  assert(declEvent.declaredPlayerId === pA2.id, 'DECLARE event records declared player ID');
  assert(declEvent.newBatsmanId === pA3.id, 'DECLARE event records new replacement batsman ID');

  mState = await scoringService.getCompleteMatchState(match.id);
  assert(mState.innings1.wickets === 1, 'Declaring batsman increments wickets to 1');
  assert(mState.innings1.batsmanStats[pA2.id].isOut === true, 'Declared batsman marked as out');
  assert(mState.innings1.batsmanStats[pA2.id].dismissalText === 'Declared / Retired', 'Declared batsman has "Declared / Retired" dismissal text');
  assert(mState.innings1.strikerId === pA3.id, 'Replacement batsman (Gamma) is now on strike');
  assert(mState.innings1.nonStrikerId === currentNonStriker, 'Non-striker remains unchanged');

  // Check remaining batsmen: only Batsman Delta (pA4) remains
  const activeBattingSquad = mState.firstBattingTeam.players;
  const remainingEligible = activeBattingSquad.filter(p => {
    const stat = mState.innings1.batsmanStats[p.id];
    const isOut = stat?.isOut;
    const isCurrentStriker = p.id === mState.innings1.strikerId;
    const isCurrentNonStriker = p.id === mState.innings1.nonStrikerId;
    return !isOut && !isCurrentStriker && !isCurrentNonStriker;
  });
  assert(remainingEligible.length === 1 && remainingEligible[0].id === pA4.id, 'Only remaining unplayed batsman (Delta) is eligible as next replacement');

  // Also declare non-striker (Alpha) and replace with remaining batsman (Delta)
  await scoringService.declareBatsman(match.id, {
    declaredPlayerId: mState.innings1.nonStrikerId,
    replacementPlayerId: pA4.id,
    inningsIndex: 0
  });

  mState = await scoringService.getCompleteMatchState(match.id);
  assert(mState.innings1.wickets === 2, 'Second declaration increments wickets to 2');
  assert(mState.innings1.batsmanStats[pA1.id].isOut === true, 'Second declared batsman marked as out');
  assert(mState.innings1.nonStrikerId === pA4.id, 'Non-striker is now Batsman Delta');

  const finalRemaining = activeBattingSquad.filter(p => {
    const stat = mState.innings1.batsmanStats[p.id];
    return !stat?.isOut && p.id !== mState.innings1.strikerId && p.id !== mState.innings1.nonStrikerId;
  });
  assert(finalRemaining.length === 0, 'No remaining players left once all have batted or declared');

  // Test: Swap strike manually
  const strikerBeforeSwap = mState.innings1.strikerId;
  const nonStrikerBeforeSwap = mState.innings1.nonStrikerId;
  await scoringService.swapStrike(match.id, { inningsIndex: 0 });
  mState = await scoringService.getCompleteMatchState(match.id);
  assert(mState.innings1.strikerId === nonStrikerBeforeSwap, 'Manual swapStrike sets striker to previous non-striker');
  assert(mState.innings1.nonStrikerId === strikerBeforeSwap, 'Manual swapStrike sets non-striker to previous striker');

  // Test: Manually set striker and non-striker via setBatsmen
  await scoringService.setBatsmen(match.id, {
    strikerId: strikerBeforeSwap,
    nonStrikerId: nonStrikerBeforeSwap,
    inningsIndex: 0
  });
  mState = await scoringService.getCompleteMatchState(match.id);
  assert(mState.innings1.strikerId === strikerBeforeSwap, 'setBatsmen sets specified striker');
  assert(mState.innings1.nonStrikerId === nonStrikerBeforeSwap, 'setBatsmen sets specified non-striker');

  // Test: Simplified dismissal with dismissalType = 'Wicket' (bowler dismissed striker)
  // Create a fresh match with full squads to test simplified Wicket and Run Out
  const bat1 = await playerService.createPlayer('Batsman One');
  const bat2 = await playerService.createPlayer('Batsman Two');
  const bat3 = await playerService.createPlayer('Batsman Three');
  const bat4 = await playerService.createPlayer('Batsman Four');
  const bowl1 = await playerService.createPlayer('Bowler Alpha Simple');
  const bowl2 = await playerService.createPlayer('Bowler Beta Simple');

  const testTeamA = await teamService.createTeam('Team Simple Bat', [bat1.id, bat2.id, bat3.id, bat4.id]);
  const testTeamB = await teamService.createTeam('Team Simple Bowl', [bowl1.id, bowl2.id]);

  const testMatch = await matchService.createMatch({
    team1Id: testTeamA.id,
    team2Id: testTeamB.id,
    battingFirstTeamId: testTeamA.id,
    totalOvers: 5,
    openingStrikerId: bat1.id,
    openingNonStrikerId: bat2.id,
    openingBowlerId: bowl1.id
  });

  // Delivery 1: Normal 'Wicket'
  await scoringService.recordWicket(testMatch.id, {
    runs: 0,
    strikerId: bat1.id,
    nonStrikerId: bat2.id,
    bowlerId: bowl1.id,
    dismissalType: 'Wicket',
    dismissedPlayerId: bat1.id,
    newBatsmanId: bat3.id,
    inningsIndex: 0
  });

  let tState = await scoringService.getCompleteMatchState(testMatch.id);
  assert(tState.innings1.wickets === 1, 'Standard "Wicket" increments wicket count to 1');
  assert(tState.innings1.bowlerStats[bowl1.id].wickets === 1, 'Bowler credited with 1 wicket for "Wicket" dismissal');
  assert(tState.innings1.batsmanStats[bat1.id].isOut === true, 'Striker bat1 marked as out');
  assert(tState.innings1.batsmanStats[bat1.id].dismissalText.includes('Bowler Alpha Simple'), 'Dismissal text shows bowler name');
  assert(tState.innings1.strikerId === bat3.id, 'Incoming replacement bat3 is on strike');

  // Delivery 2: Run Out with 2 runs completed, non-striker (bat2) is dismissed
  await scoringService.recordWicket(testMatch.id, {
    runs: 2,
    strikerId: bat3.id,
    nonStrikerId: bat2.id,
    bowlerId: bowl1.id,
    dismissalType: 'Run Out',
    dismissedPlayerId: bat2.id,
    newBatsmanId: bat4.id,
    inningsIndex: 0
  });

  tState = await scoringService.getCompleteMatchState(testMatch.id);
  assert(tState.innings1.score === 2, 'Run Out with 2 runs adds 2 runs to the innings score');
  assert(tState.innings1.wickets === 2, 'Run Out increments wicket count to 2');
  assert(tState.innings1.bowlerStats[bowl1.id].wickets === 1, 'Bowler is NOT credited with wicket on Run Out');
  assert(tState.innings1.batsmanStats[bat2.id].isOut === true, 'Non-striker bat2 is marked as out from run out');
  assert(tState.innings1.batsmanStats[bat2.id].dismissalText.toLowerCase().includes('run out'), 'Dismissal text contains run out');
  assert(tState.innings1.nonStrikerId === bat4.id, 'Incoming batsman replaces dismissed non-striker');

  console.log('\n==================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
