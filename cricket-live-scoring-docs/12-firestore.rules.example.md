# Firestore Rules Guidance

This file is documentation for the Firestore rules that should be created as:

```text
firestore.rules
```

## Important Security Warning

The initial application has no login/signup.

Therefore, any rules that allow public reads/writes can expose the database to unauthorized access and abuse.

Do not present public-write Firestore as secure.

For development/testing, permissive rules may be used temporarily, but production use should introduce authentication and authorization.

## Required Scope

If rules are implemented for the initial unauthenticated version, restrict rules to only:

```text
/teams/{teamId}
/matches/{matchId}
/matches/{matchId}/events/{eventId}
```

Do not allow access to unrelated collections.

## Future Production Direction

A later authenticated version should use:
- Firebase Authentication
- Per-user ownership
- Match ownership
- Validated writes
- Restricted reads
- Role-based access if required

The current application deliberately does not implement authentication.
