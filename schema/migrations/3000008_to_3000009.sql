-- Migration: 3000008 -> 3000009
-- Store version-control checkpoint and delta payload bytes in ordered chunks.

BEGIN IMMEDIATE;
PRAGMA defer_foreign_keys = ON;

DROP INDEX IF EXISTS idx_checkpoints_parent;
DROP INDEX IF EXISTS idx_checkpoints_chain;
DROP INDEX IF EXISTS idx_checkpoints_schema_version;
DROP INDEX IF EXISTS idx_checkpoints_boundary;
DROP INDEX IF EXISTS idx_deltas_parent;
DROP INDEX IF EXISTS idx_deltas_chain;
DROP INDEX IF EXISTS idx_deltas_schema_version;
DROP INDEX IF EXISTS idx_deltas_base_checkpoint;

ALTER TABLE deltas RENAME TO deltas_old;
ALTER TABLE checkpoints RENAME TO checkpoints_old;

CREATE TABLE checkpoints (
    id                  TEXT PRIMARY KEY,
    parent_id           TEXT,
    chain_id            TEXT NOT NULL REFERENCES version_chains(id),
    version_number      INTEGER NOT NULL,
    schema_version      INTEGER NOT NULL,
    timestamp           INTEGER NOT NULL,
    description         TEXT,
    is_manual_save      INTEGER NOT NULL DEFAULT 0,
    is_schema_boundary  INTEGER NOT NULL DEFAULT 0,
    user_id             TEXT,
    data_checksum       TEXT,
    storage_key         TEXT,
    size_bytes          INTEGER,
    CHECK (schema_version >= 1),
    CHECK (is_schema_boundary IN (0, 1)),
    UNIQUE (version_number)
) WITHOUT ROWID;

CREATE INDEX idx_checkpoints_parent ON checkpoints(parent_id);
CREATE INDEX idx_checkpoints_chain ON checkpoints(chain_id, version_number);
CREATE INDEX idx_checkpoints_schema_version ON checkpoints(schema_version, version_number);
CREATE INDEX idx_checkpoints_boundary ON checkpoints(is_schema_boundary)
    WHERE is_schema_boundary = 1;

CREATE TABLE checkpoint_data_chunks (
    checkpoint_id TEXT    NOT NULL REFERENCES checkpoints(id) ON DELETE CASCADE,
    chunk_index   INTEGER NOT NULL CHECK (chunk_index >= 0),
    offset_bytes  INTEGER NOT NULL CHECK (offset_bytes >= 0),
    size_bytes    INTEGER NOT NULL CHECK (size_bytes >= 0),
    data          BLOB    NOT NULL,
    PRIMARY KEY (checkpoint_id, chunk_index)
) WITHOUT ROWID;

CREATE INDEX idx_checkpoint_data_chunks_checkpoint_offset
    ON checkpoint_data_chunks(checkpoint_id, offset_bytes);

INSERT INTO checkpoints (
    id, parent_id, chain_id, version_number, schema_version, timestamp,
    description, is_manual_save, is_schema_boundary, user_id,
    data_checksum, storage_key, size_bytes
)
SELECT
    id, parent_id, chain_id, version_number, schema_version, timestamp,
    description, is_manual_save, is_schema_boundary, user_id,
    data_checksum, storage_key,
    CASE WHEN data IS NULL THEN size_bytes ELSE length(data) END
FROM checkpoints_old;

WITH RECURSIVE chunk_offsets(offset_bytes) AS (
    VALUES(0)
    UNION ALL
    SELECT offset_bytes + 8388608
    FROM chunk_offsets
    WHERE EXISTS (
        SELECT 1
        FROM checkpoints_old
        WHERE data IS NOT NULL
          AND length(data) > offset_bytes + 8388608
    )
)
INSERT INTO checkpoint_data_chunks (
    checkpoint_id, chunk_index, offset_bytes, size_bytes, data
)
SELECT
    source.id,
    chunk_offsets.offset_bytes / 8388608,
    chunk_offsets.offset_bytes,
    length(substr(source.data, chunk_offsets.offset_bytes + 1, 8388608)),
    substr(source.data, chunk_offsets.offset_bytes + 1, 8388608)
FROM checkpoints_old AS source
JOIN chunk_offsets
    ON chunk_offsets.offset_bytes = 0
    OR chunk_offsets.offset_bytes < length(source.data)
WHERE source.data IS NOT NULL;

CREATE TABLE deltas (
    id                  TEXT PRIMARY KEY,
    parent_id           TEXT,
    base_checkpoint_id  TEXT    NOT NULL REFERENCES checkpoints(id),
    chain_id            TEXT    NOT NULL REFERENCES version_chains(id),
    delta_sequence      INTEGER NOT NULL,
    version_number      INTEGER NOT NULL,
    schema_version      INTEGER NOT NULL,
    timestamp           INTEGER NOT NULL,
    description         TEXT,
    is_manual_save      INTEGER NOT NULL DEFAULT 0,
    user_id             TEXT,
    changeset_checksum  TEXT,
    size_bytes          INTEGER,
    CHECK (schema_version >= 1),
    CHECK (delta_sequence >= 1),
    UNIQUE (version_number)
) WITHOUT ROWID;

CREATE INDEX idx_deltas_parent ON deltas(parent_id);
CREATE INDEX idx_deltas_chain ON deltas(chain_id, version_number);
CREATE INDEX idx_deltas_schema_version ON deltas(schema_version, version_number);
CREATE INDEX idx_deltas_base_checkpoint ON deltas(base_checkpoint_id, delta_sequence);

CREATE TABLE delta_changeset_chunks (
    delta_id     TEXT    NOT NULL REFERENCES deltas(id) ON DELETE CASCADE,
    chunk_index  INTEGER NOT NULL CHECK (chunk_index >= 0),
    offset_bytes INTEGER NOT NULL CHECK (offset_bytes >= 0),
    size_bytes   INTEGER NOT NULL CHECK (size_bytes >= 0),
    data         BLOB    NOT NULL,
    PRIMARY KEY (delta_id, chunk_index)
) WITHOUT ROWID;

CREATE INDEX idx_delta_changeset_chunks_delta_offset
    ON delta_changeset_chunks(delta_id, offset_bytes);

INSERT INTO deltas (
    id, parent_id, base_checkpoint_id, chain_id, delta_sequence,
    version_number, schema_version, timestamp, description,
    is_manual_save, user_id, changeset_checksum, size_bytes
)
SELECT
    id, parent_id, base_checkpoint_id, chain_id, delta_sequence,
    version_number, schema_version, timestamp, description,
    is_manual_save, user_id, changeset_checksum, length(changeset)
FROM deltas_old;

WITH RECURSIVE chunk_offsets(offset_bytes) AS (
    VALUES(0)
    UNION ALL
    SELECT offset_bytes + 8388608
    FROM chunk_offsets
    WHERE EXISTS (
        SELECT 1
        FROM deltas_old
        WHERE length(changeset) > offset_bytes + 8388608
    )
)
INSERT INTO delta_changeset_chunks (
    delta_id, chunk_index, offset_bytes, size_bytes, data
)
SELECT
    source.id,
    chunk_offsets.offset_bytes / 8388608,
    chunk_offsets.offset_bytes,
    length(substr(source.changeset, chunk_offsets.offset_bytes + 1, 8388608)),
    substr(source.changeset, chunk_offsets.offset_bytes + 1, 8388608)
FROM deltas_old AS source
JOIN chunk_offsets
    ON chunk_offsets.offset_bytes = 0
    OR chunk_offsets.offset_bytes < length(source.changeset);

DROP TABLE deltas_old;
DROP TABLE checkpoints_old;

PRAGMA user_version = 3000009;
COMMIT;
