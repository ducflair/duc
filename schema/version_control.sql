-- ===========================================================================
-- VERSION CONTROL
-- ===========================================================================
--
-- Recovery model overview:
--
--   Timeline:  C0 ── D1 ── D2 ── D3 ── C4 ── D5 ── D6 ── C7(boundary) ═══ C8 ── D9 ...
--              ├──── schema_version = 1 ────────────────────┤                ├── schema_version = 2 ──
--              ├────────── chain 1 ─────────────────────────┤                ├────── chain 2 ─────────
--
--   C = checkpoint (full snapshot, self-contained, always recoverable alone)
--   D = delta (lightweight patch, must be applied sequentially from its base checkpoint)
--
-- To restore any version N:
--   1. Find the nearest checkpoint C where C.version_number <= N and C.schema_version matches
--   2. Replay deltas D where D.base_checkpoint_id = C.id AND D.delta_sequence <= needed,
--      ordered by delta_sequence
--   3. Result is the document state at version N in that schema_version
--
-- Schema migration boundaries:
--   - When schema changes, a boundary checkpoint is created in BOTH the old and new schema.
--   - The old-schema boundary checkpoint (is_schema_boundary=1) is the last valid snapshot
--     before migration. Its data_checksum allows integrity verification.
--   - The new-schema boundary checkpoint is linked via schema_migrations.boundary_checkpoint_id.
--   - Deltas NEVER cross schema boundaries. A delta's schema_version must match its
--     base_checkpoint's schema_version. The CHECK constraint enforces this implicitly.
--
-- Visiting old versions across migrations:
--   - Checkpoints are self-contained → can always be loaded as-is for that schema_version.
--   - To bring old data forward: load old checkpoint → run migration_sql forward chain.
--   - reverse_migration_sql allows rolling back to a previous schema if needed.
--   - migration_checksum verifies the migration script hasn't been tampered with.
--

-- Schema migration log.
-- Each row documents how one schema version transitions to the next.
-- After applying a migration, a boundary checkpoint must be created
-- in the new schema version before recording more deltas.
CREATE TABLE schema_migrations (
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    from_schema_version    INTEGER NOT NULL,
    to_schema_version      INTEGER NOT NULL,
    migration_name         TEXT    NOT NULL,
    migration_sql          TEXT,            -- forward migration DDL/DML
    reverse_migration_sql  TEXT,            -- rollback DDL/DML (NULL if irreversible)
    migration_checksum     TEXT,            -- SHA-256 of migration_sql for integrity
    applied_at             INTEGER NOT NULL, -- epoch ms
    boundary_checkpoint_id TEXT,             -- checkpoint created in the NEW schema after migration
    CHECK (to_schema_version > from_schema_version),
    UNIQUE (from_schema_version, to_schema_version)
);

CREATE INDEX idx_schema_migrations_to_version ON schema_migrations(to_schema_version);

-- Singleton row: global version-control pointers and counters.
CREATE TABLE version_graph (
    id                          INTEGER PRIMARY KEY CHECK (id = 1),
    current_version             INTEGER NOT NULL DEFAULT 0,
    current_schema_version      INTEGER NOT NULL DEFAULT 1,
    user_checkpoint_version_id  TEXT,    -- user-designated save point
    latest_version_id           TEXT,    -- most recent version (checkpoint or delta)
    chain_count                 INTEGER NOT NULL DEFAULT 1,
    last_pruned                 INTEGER, -- epoch ms of last pruning pass
    total_size                  INTEGER, -- aggregate bytes of all checkpoints + deltas
    CHECK (current_schema_version >= 1),
    CHECK (chain_count >= 1)
);

-- Schema-versioned chain metadata.
-- Groups one contiguous run of versions that all share the same schema.
-- A new chain begins after every schema migration.
CREATE TABLE version_chains (
    id                   TEXT PRIMARY KEY,
    schema_version       INTEGER NOT NULL,
    start_version        INTEGER NOT NULL,
    end_version          INTEGER,           -- NULL for the currently active chain
    migration_id         INTEGER REFERENCES schema_migrations(id),
    root_checkpoint_id   TEXT,              -- first checkpoint of this chain
    CHECK (schema_version >= 1),
    CHECK (end_version IS NULL OR end_version >= start_version),
    UNIQUE (schema_version, start_version)
) WITHOUT ROWID;

CREATE INDEX idx_version_chains_schema_version ON version_chains(schema_version, start_version);

-- Full-state snapshots at specific version numbers.
-- Each checkpoint is fully self-contained: loading `data` alone reconstructs the
-- complete document state at that version_number.
CREATE TABLE checkpoints (
    id                  TEXT PRIMARY KEY,
    parent_id           TEXT,              -- previous checkpoint (for checkpoint chain traversal)
    chain_id            TEXT NOT NULL REFERENCES version_chains(id),
    version_number      INTEGER NOT NULL,
    schema_version      INTEGER NOT NULL,
    timestamp           INTEGER NOT NULL,  -- epoch ms
    description         TEXT,
    is_manual_save      INTEGER NOT NULL DEFAULT 0,
    is_schema_boundary  INTEGER NOT NULL DEFAULT 0, -- 1 if created at a schema migration boundary
    user_id             TEXT,
    data                BLOB,              -- full state snapshot (application-defined binary format)
    data_checksum       TEXT,              -- SHA-256 of `data` for integrity verification on restore
    storage_key         TEXT,              -- optional external storage reference if data is offloaded
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

-- Incremental deltas (lightweight patches between checkpoints).
-- A delta is valid ONLY against the schema_version it was recorded with.
-- To apply: load base_checkpoint.data, then apply changesets in delta_sequence order.
CREATE TABLE deltas (
    id                  TEXT PRIMARY KEY,
    parent_id           TEXT,              -- previous delta or NULL if first after checkpoint
    base_checkpoint_id  TEXT    NOT NULL REFERENCES checkpoints(id),
    chain_id            TEXT    NOT NULL REFERENCES version_chains(id),
    delta_sequence      INTEGER NOT NULL,  -- 1-based ordinal within base_checkpoint group
    version_number      INTEGER NOT NULL,
    schema_version      INTEGER NOT NULL,
    timestamp           INTEGER NOT NULL,  -- epoch ms
    description         TEXT,
    is_manual_save      INTEGER NOT NULL DEFAULT 0,
    user_id             TEXT,
    changeset           BLOB    NOT NULL,  -- zlib-compressed binary delta payload
    changeset_checksum  TEXT,              -- SHA-256 of uncompressed changeset for integrity
    size_bytes          INTEGER,
    CHECK (schema_version >= 1),
    CHECK (delta_sequence >= 1),
    UNIQUE (version_number)
) WITHOUT ROWID;

CREATE INDEX idx_deltas_parent ON deltas(parent_id);
CREATE INDEX idx_deltas_chain ON deltas(chain_id, version_number);
CREATE INDEX idx_deltas_schema_version ON deltas(schema_version, version_number);
CREATE INDEX idx_deltas_base_checkpoint ON deltas(base_checkpoint_id, delta_sequence);

-- Seed the singleton version graph row.
INSERT INTO version_graph (id, current_version, current_schema_version, chain_count)
VALUES (1, 0, 1, 1);
