-- Migration: 4000001 -> 4000002
-- Allow a drawing to keep its background color across themes.

BEGIN IMMEDIATE;

ALTER TABLE duc_global_state ADD COLUMN lock_background_color
    INTEGER NOT NULL DEFAULT 0 CHECK (lock_background_color IN (0, 1));

PRAGMA user_version = 4000002;
COMMIT;
