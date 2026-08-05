-- Migration: 3000009 -> 4000000
-- Promote prerelease chunked databases to the published breaking format version.

BEGIN IMMEDIATE;
PRAGMA user_version = 4000000;
COMMIT;
