use super::*;
use rusqlite::{params, OptionalExtension};

const LEGACY_SCHEMA: &str = r#"
    PRAGMA application_id = 1146569567;
    PRAGMA user_version = 3000007;
    PRAGMA foreign_keys = ON;

    CREATE TABLE external_files (
        id TEXT PRIMARY KEY,
        active_revision_id TEXT NOT NULL,
        updated INTEGER NOT NULL,
        version INTEGER
    ) WITHOUT ROWID;
    CREATE TABLE external_file_revisions (
        id TEXT PRIMARY KEY,
        file_id TEXT NOT NULL REFERENCES external_files(id) ON DELETE CASCADE,
        size_bytes INTEGER NOT NULL DEFAULT 0,
        checksum TEXT,
        source_name TEXT,
        mime_type TEXT NOT NULL,
        message TEXT,
        created INTEGER NOT NULL,
        last_retrieved INTEGER
    ) WITHOUT ROWID;
    CREATE TABLE external_file_revision_data (
        revision_id TEXT PRIMARY KEY REFERENCES external_file_revisions(id) ON DELETE CASCADE,
        data BLOB NOT NULL
    ) WITHOUT ROWID;

    CREATE TABLE schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_schema_version INTEGER NOT NULL,
        to_schema_version INTEGER NOT NULL,
        migration_name TEXT NOT NULL,
        migration_sql TEXT,
        migration_checksum TEXT,
        applied_at INTEGER NOT NULL,
        boundary_checkpoint_id TEXT,
        CHECK (to_schema_version > from_schema_version),
        UNIQUE (from_schema_version, to_schema_version)
    );
    CREATE TABLE version_graph (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        current_version INTEGER NOT NULL DEFAULT 0,
        current_schema_version INTEGER NOT NULL DEFAULT 1,
        user_checkpoint_version_id TEXT,
        latest_version_id TEXT,
        chain_count INTEGER NOT NULL DEFAULT 1,
        total_size INTEGER
    );
    CREATE TABLE version_chains (
        id TEXT PRIMARY KEY,
        schema_version INTEGER NOT NULL,
        start_version INTEGER NOT NULL,
        end_version INTEGER,
        migration_id INTEGER REFERENCES schema_migrations(id),
        root_checkpoint_id TEXT,
        UNIQUE (schema_version, start_version)
    ) WITHOUT ROWID;
    CREATE TABLE checkpoints (
        id TEXT PRIMARY KEY,
        parent_id TEXT,
        chain_id TEXT NOT NULL REFERENCES version_chains(id),
        version_number INTEGER NOT NULL,
        schema_version INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        description TEXT,
        is_manual_save INTEGER NOT NULL DEFAULT 0,
        is_schema_boundary INTEGER NOT NULL DEFAULT 0,
        user_id TEXT,
        data BLOB,
        data_checksum TEXT,
        storage_key TEXT,
        size_bytes INTEGER,
        UNIQUE (version_number)
    ) WITHOUT ROWID;
    CREATE TABLE deltas (
        id TEXT PRIMARY KEY,
        parent_id TEXT,
        base_checkpoint_id TEXT NOT NULL REFERENCES checkpoints(id),
        chain_id TEXT NOT NULL REFERENCES version_chains(id),
        delta_sequence INTEGER NOT NULL,
        version_number INTEGER NOT NULL,
        schema_version INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        description TEXT,
        is_manual_save INTEGER NOT NULL DEFAULT 0,
        user_id TEXT,
        changeset BLOB NOT NULL,
        changeset_checksum TEXT,
        size_bytes INTEGER,
        UNIQUE (version_number)
    ) WITHOUT ROWID;
"#;

fn read_chunks(conn: &Connection, table: &str, owner_column: &str, owner_id: &str) -> Vec<u8> {
    let sql = format!("SELECT data FROM {table} WHERE {owner_column} = ?1 ORDER BY chunk_index");
    let mut statement = conn.prepare(&sql).expect("prepare chunk query");
    let chunks = statement
        .query_map([owner_id], |row| row.get::<_, Vec<u8>>(0))
        .expect("query chunks");
    let mut bytes = Vec::new();
    for chunk in chunks {
        bytes.extend(chunk.expect("read chunk"));
    }
    bytes
}

fn chunk_layout(
    conn: &Connection,
    table: &str,
    owner_column: &str,
    owner_id: &str,
) -> Vec<(i64, i64, i64)> {
    let sql = format!(
        "SELECT chunk_index, offset_bytes, size_bytes
         FROM {table}
         WHERE {owner_column} = ?1
         ORDER BY chunk_index"
    );
    let mut statement = conn.prepare(&sql).expect("prepare layout query");
    statement
        .query_map([owner_id], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })
        .expect("query chunk layout")
        .collect::<rusqlite::Result<Vec<_>>>()
        .expect("read chunk layout")
}

#[test]
fn migration_chain_preserves_the_prerelease_schema_step() {
    let next_version = |from_version| {
        MIGRATIONS
            .iter()
            .find(|(from, _, _)| *from == from_version)
            .map(|(_, to, _)| *to)
    };

    assert_eq!(next_version(3_000_007), Some(3_000_008));
    assert_eq!(next_version(3_000_008), Some(3_000_009));
    assert_eq!(next_version(3_000_009), Some(4_000_000));
}

#[test]
fn migrates_prerelease_3000001_split_revision_storage_without_data_loss() {
    let conn = Connection::open_in_memory().expect("open database");
    conn.execute_batch(
        r#"
        PRAGMA application_id = 1146569567;
        PRAGMA user_version = 3000001;
        PRAGMA foreign_keys = ON;

        CREATE TABLE external_files (
            id TEXT PRIMARY KEY,
            active_revision_id TEXT NOT NULL,
            updated INTEGER NOT NULL,
            version INTEGER
        ) WITHOUT ROWID;
        CREATE TABLE external_file_revisions (
            id TEXT PRIMARY KEY,
            file_id TEXT NOT NULL REFERENCES external_files(id) ON DELETE CASCADE,
            size_bytes INTEGER NOT NULL DEFAULT 0,
            checksum TEXT,
            source_name TEXT,
            mime_type TEXT NOT NULL,
            message TEXT,
            created INTEGER NOT NULL,
            last_retrieved INTEGER
        ) WITHOUT ROWID;
        CREATE TABLE external_file_revision_data (
            revision_id TEXT PRIMARY KEY REFERENCES external_file_revisions(id) ON DELETE CASCADE,
            data BLOB NOT NULL
        ) WITHOUT ROWID;
        CREATE TABLE _external_file_revision_data_v3000001 (
            revision_id TEXT PRIMARY KEY,
            data BLOB NOT NULL
        ) WITHOUT ROWID;
        CREATE TABLE external_file_revision_chunks (
            revision_id TEXT NOT NULL REFERENCES external_file_revisions(id) ON DELETE CASCADE,
            chunk_index INTEGER NOT NULL,
            offset_bytes INTEGER NOT NULL,
            size_bytes INTEGER NOT NULL,
            data BLOB NOT NULL,
            PRIMARY KEY (revision_id, chunk_index)
        ) WITHOUT ROWID;

        INSERT INTO external_files (id, active_revision_id, updated)
        VALUES ('file-1', 'revision-1', 1),
               ('file-2', 'revision-2', 1);
        INSERT INTO external_file_revisions (
            id, file_id, size_bytes, mime_type, created
        ) VALUES ('revision-1', 'file-1', 4, 'application/octet-stream', 1),
                 ('revision-2', 'file-2', 4, 'application/octet-stream', 1);
        INSERT INTO external_file_revision_data (revision_id, data)
        VALUES ('revision-1', X'01020304');
        INSERT INTO external_file_revision_chunks (
            revision_id, chunk_index, offset_bytes, size_bytes, data
        ) VALUES ('revision-2', 0, 0, 2, X'0506'),
                 ('revision-2', 1, 2, 2, X'0708');
        "#,
    )
    .expect("create split prerelease schema");

    normalize_external_revision_storage(&conn).expect("normalize split storage");
    normalize_external_revision_storage(&conn).expect("retry normalized split storage");
    let (_, _, migration) = MIGRATIONS
        .iter()
        .find(|(from, to, _)| *from == 3_000_001 && *to == 3_000_002)
        .expect("find revision split migration");
    conn.execute_batch(migration)
        .expect("run canonical migration");

    let data: Vec<u8> = conn
        .query_row(
            "SELECT data FROM external_file_revision_data WHERE revision_id = 'revision-1'",
            [],
            |row| row.get(0),
        )
        .expect("read migrated revision data");
    assert_eq!(data, vec![1, 2, 3, 4]);
    let chunked_data: Vec<u8> = conn
        .query_row(
            "SELECT data FROM external_file_revision_data WHERE revision_id = 'revision-2'",
            [],
            |row| row.get(0),
        )
        .expect("read migrated chunked revision data");
    assert_eq!(chunked_data, vec![5, 6, 7, 8]);
    assert_eq!(
        conn.pragma_query_value::<i64, _>(None, "user_version", |row| row.get(0))
            .expect("read user version"),
        3_000_002
    );
    assert_eq!(
        conn.query_row("SELECT count(*) FROM pragma_foreign_key_check", [], |row| {
            row.get::<_, i64>(0)
        },)
            .expect("check foreign keys"),
        0
    );
}

#[test]
fn table_grid_migration_preserves_tables_without_files() {
    let conn = Connection::open_in_memory().expect("open database");
    conn.execute_batch(
        r#"
        PRAGMA foreign_keys = ON;
        PRAGMA user_version = 3000005;

        CREATE TABLE elements (
            id TEXT PRIMARY KEY
        ) WITHOUT ROWID;
        CREATE TABLE document_grid_config (
            element_id            TEXT PRIMARY KEY REFERENCES elements(id) ON DELETE CASCADE,
            file_id               TEXT,
            grid_columns          INTEGER NOT NULL DEFAULT 1,
            grid_gap_x            REAL NOT NULL DEFAULT 0.0,
            grid_gap_y            REAL NOT NULL DEFAULT 0.0,
            grid_first_page_alone INTEGER NOT NULL DEFAULT 0,
            grid_scale            REAL NOT NULL DEFAULT 1.0
        ) WITHOUT ROWID;
        CREATE TABLE element_table (
            element_id TEXT PRIMARY KEY REFERENCES elements(id) ON DELETE CASCADE,
            file_id    TEXT
        ) WITHOUT ROWID;

        INSERT INTO elements (id) VALUES ('table-without-file'), ('table-with-config');
        INSERT INTO element_table (element_id, file_id)
        VALUES ('table-without-file', NULL), ('table-with-config', 'legacy-file');
        INSERT INTO document_grid_config (
            element_id, file_id, grid_columns, grid_gap_x, grid_gap_y,
            grid_first_page_alone, grid_scale
        ) VALUES ('table-with-config', 'current-file', 2, 3.0, 4.0, 1, 0.5);

        CREATE TABLE element_table_new (
            element_id TEXT PRIMARY KEY REFERENCES document_grid_config(element_id) ON DELETE CASCADE
        ) WITHOUT ROWID;
        INSERT INTO element_table_new (element_id) VALUES ('table-with-config');
        "#,
    )
    .expect("create legacy table schema");

    let (_, _, migration) = MIGRATIONS
        .iter()
        .find(|(from, to, _)| *from == 3_000_005 && *to == 3_000_006)
        .expect("find table grid migration");
    conn.execute_batch(migration)
        .expect("migrate table grid config");

    let migrated_without_file: (Option<String>, i64, f64) = conn
        .query_row(
            "SELECT file_id, grid_columns, grid_scale
             FROM document_grid_config
             WHERE element_id = 'table-without-file'",
            [],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .expect("read migrated table config");
    assert_eq!(migrated_without_file, (None, 1, 1.0));

    let preserved_config: (Option<String>, i64, f64) = conn
        .query_row(
            "SELECT file_id, grid_columns, grid_scale
             FROM document_grid_config
             WHERE element_id = 'table-with-config'",
            [],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .expect("read existing table config");
    assert_eq!(preserved_config, (Some("current-file".to_string()), 2, 0.5));

    let migrated_table_count: i64 = conn
        .query_row("SELECT count(*) FROM element_table", [], |row| row.get(0))
        .expect("count migrated tables");
    assert_eq!(migrated_table_count, 2);
    assert_eq!(
        conn.pragma_query_value::<i64, _>(None, "user_version", |row| row.get(0))
            .expect("read user version"),
        3_000_006
    );
    let foreign_key_errors: i64 = conn
        .query_row("SELECT count(*) FROM pragma_foreign_key_check", [], |row| {
            row.get(0)
        })
        .expect("check foreign keys");
    assert_eq!(foreign_key_errors, 0);
}

#[test]
fn migrates_legacy_payloads_losslessly_into_bounded_chunks() {
    let conn = Connection::open_in_memory().expect("open database");
    conn.execute_batch(LEGACY_SCHEMA)
        .expect("apply legacy schema");

    let payload: Vec<u8> = (0..(8 * 1024 * 1024 + 17))
        .map(|index| (index % 251) as u8)
        .collect();
    conn.execute(
        "INSERT INTO external_files (id, active_revision_id, updated)
         VALUES ('file-1', 'revision-1', 1)",
        [],
    )
    .expect("insert external file");
    conn.execute(
        "INSERT INTO external_file_revisions
         (id, file_id, size_bytes, mime_type, created)
         VALUES ('revision-1', 'file-1', 1, 'application/octet-stream', 1)",
        [],
    )
    .expect("insert external revision");
    conn.execute(
        "INSERT INTO external_file_revision_data (revision_id, data) VALUES (?1, ?2)",
        params!["revision-1", &payload],
    )
    .expect("insert external data");

    conn.execute(
        "INSERT INTO version_graph (id, current_version, current_schema_version)
         VALUES (1, 3, 3000007)",
        [],
    )
    .expect("insert version graph");
    conn.execute(
        "INSERT INTO version_chains (id, schema_version, start_version)
         VALUES ('chain-1', 3000007, 1)",
        [],
    )
    .expect("insert version chain");
    conn.execute(
        "INSERT INTO checkpoints
         (id, chain_id, version_number, schema_version, timestamp, data, size_bytes)
         VALUES ('checkpoint-1', 'chain-1', 1, 3000007, 1, ?1, 2)",
        [&payload],
    )
    .expect("insert checkpoint");
    conn.execute(
        "INSERT INTO checkpoints
         (id, parent_id, chain_id, version_number, schema_version, timestamp,
          data, storage_key, size_bytes)
         VALUES ('checkpoint-external', 'checkpoint-1', 'chain-1', 2, 3000007, 2,
                 NULL, 'remote-key', 99)",
        [],
    )
    .expect("insert external checkpoint");
    conn.execute(
        "INSERT INTO deltas
         (id, base_checkpoint_id, chain_id, delta_sequence, version_number,
          schema_version, timestamp, changeset, size_bytes)
         VALUES ('delta-1', 'checkpoint-1', 'chain-1', 1, 3, 3000007, 3, ?1, 3)",
        [&payload],
    )
    .expect("insert delta");

    bootstrap(&conn).expect("migrate legacy database");

    assert_eq!(
        conn.pragma_query_value::<i64, _>(None, "user_version", |row| row.get(0))
            .expect("read user_version"),
        4_000_000
    );
    let expected_layout = vec![(0, 0, 8_388_608), (1, 8_388_608, 17)];
    assert_eq!(
        chunk_layout(
            &conn,
            "external_file_revision_chunks",
            "revision_id",
            "revision-1"
        ),
        expected_layout
    );
    assert_eq!(
        chunk_layout(
            &conn,
            "checkpoint_data_chunks",
            "checkpoint_id",
            "checkpoint-1"
        ),
        expected_layout
    );
    assert_eq!(
        chunk_layout(&conn, "delta_changeset_chunks", "delta_id", "delta-1"),
        expected_layout
    );
    assert_eq!(
        read_chunks(
            &conn,
            "external_file_revision_chunks",
            "revision_id",
            "revision-1"
        ),
        payload
    );
    assert_eq!(
        read_chunks(
            &conn,
            "checkpoint_data_chunks",
            "checkpoint_id",
            "checkpoint-1"
        ),
        payload
    );
    assert_eq!(
        read_chunks(&conn, "delta_changeset_chunks", "delta_id", "delta-1"),
        payload
    );

    let migrated_size: i64 = conn
        .query_row(
            "SELECT size_bytes FROM checkpoints WHERE id = 'checkpoint-1'",
            [],
            |row| row.get(0),
        )
        .expect("read checkpoint size");
    assert_eq!(migrated_size, payload.len() as i64);
    let external_size: i64 = conn
        .query_row(
            "SELECT size_bytes FROM checkpoints WHERE id = 'checkpoint-external'",
            [],
            |row| row.get(0),
        )
        .expect("read external checkpoint size");
    assert_eq!(external_size, 99);
    let external_chunk: Option<i64> = conn
        .query_row(
            "SELECT 1 FROM checkpoint_data_chunks
             WHERE checkpoint_id = 'checkpoint-external'",
            [],
            |row| row.get(0),
        )
        .optional()
        .expect("query external checkpoint chunks");
    assert!(external_chunk.is_none());

    let foreign_key_errors: i64 = conn
        .query_row("SELECT count(*) FROM pragma_foreign_key_check", [], |row| {
            row.get(0)
        })
        .expect("check foreign keys");
    assert_eq!(foreign_key_errors, 0);
}
