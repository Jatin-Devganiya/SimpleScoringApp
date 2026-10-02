# Development Checklist

## Foundation
- [ ] React/Vite project created
- [ ] Environment configuration created
- [ ] `.env.example` created
- [ ] Firebase dependency installed
- [ ] Application folder structure created

## Storage
- [ ] Storage contract created
- [ ] LocalStorage provider created
- [ ] Firebase provider created
- [ ] Storage factory created
- [ ] Feature flag works
- [ ] No direct storage access from components
- [ ] Firebase mode does not silently fall back

## Teams
- [ ] Create team
- [ ] Edit team
- [ ] Delete team
- [ ] Add player
- [ ] Edit player
- [ ] Delete player
- [ ] Duplicate player validation

## Match
- [ ] Create match
- [ ] Select teams
- [ ] Select overs
- [ ] Select batting team
- [ ] Bowling team auto-selected
- [ ] Select opening batsmen
- [ ] Select opening bowler
- [ ] Start match
- [ ] Resume match

## Scoring
- [ ] 0
- [ ] 1
- [ ] 2
- [ ] 3
- [ ] 4
- [ ] 5
- [ ] 6
- [ ] Wicket
- [ ] Wide
- [ ] No-ball
- [ ] Strike rotation
- [ ] Over completion
- [ ] Current over
- [ ] Extras
- [ ] Batting statistics
- [ ] Bowling statistics
- [ ] CRR
- [ ] Target
- [ ] RRR
- [ ] Innings completion
- [ ] Match completion
- [ ] Undo

## Backup
- [ ] Export LocalStorage
- [ ] Export Firebase
- [ ] Import LocalStorage
- [ ] Import Firebase
- [ ] Version validation
- [ ] Migration/normalization
- [ ] Clear LocalStorage
- [ ] Clear Firebase application data

## Firebase
- [ ] Firebase initialization
- [ ] Environment variables
- [ ] Firestore collections
- [ ] Team CRUD
- [ ] Match CRUD
- [ ] Event persistence
- [ ] Error handling
- [ ] Efficient reads/writes
- [ ] Firestore rules documented

## Quality
- [ ] Mobile UI
- [ ] Tablet UI
- [ ] Desktop UI
- [ ] User-friendly errors
- [ ] Loading states
- [ ] Storage indicator
- [ ] Unit tests
- [ ] Integration tests
- [ ] Production build

## Cross-Storage
- [ ] LocalStorage → Firebase export/import
- [ ] Firebase → LocalStorage export/import
- [ ] Data equivalence verified
- [ ] Scoring equivalence verified
