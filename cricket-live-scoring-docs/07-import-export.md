# Import / Export Specification

## Goal

Create one portable JSON backup format that works with both storage providers.

## Export

Button:

```text
EXPORT DATA
```

Export must contain:

```js
{
  version: 1,
  teams: [],
  matches: [],
  metadata: {
    exportedAt: "ISO timestamp"
  }
}
```

All match innings and scoring events required to reconstruct matches must be included.

## Filename

Example:

```text
cricket-score-backup-2026-10-01.json
```

Use the current date.

## LocalStorage Export

Read the application data and generate the standard backup JSON.

## Firebase Export

Read all application data required for backup and generate exactly the same standard JSON structure.

Do not expose Firebase-specific document structure in the portable format.

## Import

Flow:

```text
Select file
   ↓
Parse JSON
   ↓
Validate
   ↓
Check version
   ↓
Normalize
   ↓
Confirm replacement
   ↓
Import into active storage provider
```

## Validation

Reject:
- Invalid JSON
- Missing version
- Unsupported version
- Missing teams/matches where required
- Invalid IDs
- Invalid match references
- Invalid event structure

Show a friendly error.

## Replacement Warning

Before import:

```text
Importing this backup will replace the current application data.
Continue?
```

Do not silently replace data.

## Cross-Storage Migration

Supported:

```text
LocalStorage
  ↓
Export
  ↓
JSON
  ↓
Firebase
  ↓
Import
```

and:

```text
Firebase
  ↓
Export
  ↓
JSON
  ↓
LocalStorage
  ↓
Import
```

Data must remain equivalent.

## Versioning

Use:

```js
version: 1
```

Create a normalization/migration layer so future versions can be supported.

Conceptually:

```js
validateBackup(data)
normalizeBackup(data)
importBackup(data)
```

## Backup Safety

Never import arbitrary Firebase document paths or executable content.

The backup is data only.
