-- Migration: 3000007 -> 3000008
-- Store external file revision bytes in ordered chunks instead of one BLOB row.

BEGIN IMMEDIATE;
PRAGMA defer_foreign_keys = ON;

CREATE TABLE external_file_revision_chunks (
    revision_id  TEXT    NOT NULL REFERENCES external_file_revisions(id) ON DELETE CASCADE,
    chunk_index  INTEGER NOT NULL CHECK (chunk_index >= 0),
    offset_bytes INTEGER NOT NULL CHECK (offset_bytes >= 0),
    size_bytes   INTEGER NOT NULL CHECK (size_bytes >= 0),
    data         BLOB    NOT NULL,
    PRIMARY KEY (revision_id, chunk_index)
) WITHOUT ROWID;

CREATE INDEX idx_external_file_revision_chunks_revision_offset
    ON external_file_revision_chunks(revision_id, offset_bytes);

WITH RECURSIVE chunk_offsets(offset_bytes) AS (
    VALUES(0)
    UNION ALL
    SELECT offset_bytes + 8388608
    FROM chunk_offsets
    WHERE EXISTS (
        SELECT 1
        FROM external_file_revision_data
        WHERE length(data) > offset_bytes + 8388608
    )
)
INSERT INTO external_file_revision_chunks (
    revision_id, chunk_index, offset_bytes, size_bytes, data
)
SELECT
    source.revision_id,
    chunk_offsets.offset_bytes / 8388608,
    chunk_offsets.offset_bytes,
    length(substr(source.data, chunk_offsets.offset_bytes + 1, 8388608)),
    substr(source.data, chunk_offsets.offset_bytes + 1, 8388608)
FROM external_file_revision_data AS source
JOIN chunk_offsets
    ON chunk_offsets.offset_bytes = 0
    OR chunk_offsets.offset_bytes < length(source.data);

UPDATE external_file_revisions
SET size_bytes = (
    SELECT length(source.data)
    FROM external_file_revision_data AS source
    WHERE source.revision_id = external_file_revisions.id
)
WHERE EXISTS (
    SELECT 1
    FROM external_file_revision_data AS source
    WHERE source.revision_id = external_file_revisions.id
);

DROP TABLE external_file_revision_data;

PRAGMA user_version = 3000008;
COMMIT;
