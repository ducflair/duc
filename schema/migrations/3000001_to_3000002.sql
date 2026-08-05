-- Migration: 3000001 → 3000002
-- Splits binary data out of `external_file_revisions` into a dedicated
-- `external_file_revision_data` table so metadata can be read without
-- loading heavy blobs.

PRAGMA foreign_keys = OFF;
BEGIN IMMEDIATE;

-- 1. Stage existing data blobs before the parent table is renamed/recreated.
CREATE TABLE _external_file_revision_data_v3000001 (
    revision_id TEXT PRIMARY KEY,
    data        BLOB NOT NULL
) WITHOUT ROWID;

INSERT INTO _external_file_revision_data_v3000001 (revision_id, data)
    SELECT id, data FROM external_file_revisions;

-- 2. Recreate external_file_revisions without the data column.
ALTER TABLE external_file_revisions RENAME TO _ext_revisions_old_v3000001;

CREATE TABLE external_file_revisions (
    id              TEXT    PRIMARY KEY,
    file_id         TEXT    NOT NULL REFERENCES external_files(id) ON DELETE CASCADE,
    size_bytes      INTEGER NOT NULL DEFAULT 0,
    checksum        TEXT,
    source_name     TEXT,
    mime_type       TEXT    NOT NULL,
    message         TEXT,
    created         INTEGER NOT NULL,
    last_retrieved  INTEGER
) WITHOUT ROWID;

DROP INDEX IF EXISTS idx_external_file_revisions_file;
CREATE INDEX idx_external_file_revisions_file ON external_file_revisions(file_id);

INSERT INTO external_file_revisions (id, file_id, size_bytes, checksum, source_name, mime_type, message, created, last_retrieved)
    SELECT id, file_id, size_bytes, checksum, source_name, mime_type, message, created, last_retrieved
    FROM _ext_revisions_old_v3000001;

-- 3. Create the final data table after the new parent table exists.
CREATE TABLE external_file_revision_data (
    revision_id TEXT PRIMARY KEY REFERENCES external_file_revisions(id) ON DELETE CASCADE,
    data        BLOB NOT NULL
) WITHOUT ROWID;

INSERT INTO external_file_revision_data (revision_id, data)
    SELECT revision_id, data FROM _external_file_revision_data_v3000001;

DROP TABLE _ext_revisions_old_v3000001;
DROP TABLE _external_file_revision_data_v3000001;

COMMIT;
PRAGMA foreign_keys = ON;
PRAGMA user_version = 3000002;
