-- Preserve charter phase changes in drawing files.
BEGIN IMMEDIATE;

CREATE TABLE IF NOT EXISTS duc_charter (
    id            INTEGER PRIMARY KEY CHECK (id = 1),
    title         TEXT    NOT NULL DEFAULT '',
    description   TEXT,
    objective     TEXT    NOT NULL DEFAULT '',
    phase         TEXT    NOT NULL DEFAULT 'intent' CHECK (phase IN ('intent', 'review', 'delivery', 'closed')),
    closed_reason TEXT,
    updated_at    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE duc_charter_phase_history (
    id TEXT PRIMARY KEY,
    previous_phase TEXT NOT NULL CHECK (previous_phase IN ('intent', 'review', 'delivery', 'closed')),
    phase TEXT NOT NULL CHECK (phase IN ('intent', 'review', 'delivery', 'closed') AND phase <> previous_phase),
    changed_at INTEGER NOT NULL,
    closed_reason TEXT,
    sort_order INTEGER NOT NULL UNIQUE,
    CHECK (phase <> 'closed' OR length(trim(coalesce(closed_reason, ''))) > 0)
);

CREATE TRIGGER duc_charter_record_phase AFTER UPDATE OF phase ON duc_charter
WHEN OLD.phase <> NEW.phase
BEGIN
    INSERT INTO duc_charter_phase_history (id, previous_phase, phase, changed_at, closed_reason, sort_order)
    SELECT lower(hex(randomblob(16))), OLD.phase, NEW.phase, CASE WHEN NEW.updated_at <> OLD.updated_at AND NEW.updated_at > 0 THEN NEW.updated_at ELSE CAST(unixepoch('subsec') * 1000 AS INTEGER) END,
           CASE WHEN NEW.phase = 'closed' THEN NEW.closed_reason END, coalesce(max(sort_order), -1) + 1
    FROM duc_charter_phase_history;
END;

PRAGMA user_version = 4000003;
COMMIT;
