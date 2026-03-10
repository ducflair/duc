-- Migration: 3000000 → 3000001
-- Restructures the flat `external_files` table into
-- `external_files` (logical file record) + `external_file_revisions` (snapshots).

ALTER TABLE external_files RENAME TO _ext_files_old_v3000000;

CREATE TABLE external_files (
    id                  TEXT    PRIMARY KEY,
    active_revision_id  TEXT    NOT NULL,
    updated             INTEGER NOT NULL,
    version             INTEGER
) WITHOUT ROWID;

CREATE TABLE external_file_revisions (
    id              TEXT    PRIMARY KEY,
    file_id         TEXT    NOT NULL REFERENCES external_files(id) ON DELETE CASCADE,
    size_bytes      INTEGER NOT NULL DEFAULT 0,
    checksum        TEXT,
    source_name     TEXT,
    mime_type       TEXT    NOT NULL,
    message         TEXT,
    created         INTEGER NOT NULL,
    last_retrieved  INTEGER,
    data            BLOB    NOT NULL
) WITHOUT ROWID;

CREATE INDEX idx_external_files_active        ON external_files(active_revision_id);
CREATE INDEX idx_external_file_revisions_file ON external_file_revisions(file_id);

INSERT INTO external_files (id, active_revision_id, updated, version)
    SELECT id, id || '_rev1', created, version FROM _ext_files_old_v3000000;

INSERT INTO external_file_revisions (id, file_id, size_bytes, checksum, source_name, mime_type, message, created, last_retrieved, data)
    SELECT id || '_rev1', id, length(data), NULL, NULL, mime_type, NULL, created, last_retrieved, data
    FROM _ext_files_old_v3000000;

DROP TABLE _ext_files_old_v3000000;

PRAGMA user_version = 3000001;
