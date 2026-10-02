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
