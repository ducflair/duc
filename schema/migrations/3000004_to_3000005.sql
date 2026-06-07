-- Migration: 3000003 → 3000004
-- Add searchable index for extracted external-file text (PDF content search).

CREATE TABLE IF NOT EXISTS external_file_text_index (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id        TEXT    NOT NULL,
    revision_id    TEXT    NOT NULL,
    mime_type      TEXT    NOT NULL,
    extracted_text TEXT    NOT NULL DEFAULT '',
    has_ocr        INTEGER NOT NULL DEFAULT 0,
    updated        INTEGER NOT NULL,
    UNIQUE (file_id, revision_id)
);

CREATE INDEX IF NOT EXISTS idx_external_file_text_index_file_id
    ON external_file_text_index(file_id);

CREATE INDEX IF NOT EXISTS idx_external_file_text_index_revision_id
    ON external_file_text_index(revision_id);

CREATE VIRTUAL TABLE IF NOT EXISTS search_external_file_text USING fts5(
    extracted_text,
    content='external_file_text_index',
    content_rowid='id',
    tokenize='unicode61 remove_diacritics 2',
    prefix='2 3 4 5 6 7 8 9 10'
);

CREATE TRIGGER IF NOT EXISTS trg_external_file_text_index_ai
AFTER INSERT ON external_file_text_index BEGIN
    INSERT INTO search_external_file_text(rowid, extracted_text)
    VALUES (NEW.id, NEW.extracted_text);
END;

CREATE TRIGGER IF NOT EXISTS trg_external_file_text_index_ad
AFTER DELETE ON external_file_text_index BEGIN
    INSERT INTO search_external_file_text(search_external_file_text, rowid, extracted_text)
    VALUES ('delete', OLD.id, OLD.extracted_text);
END;

CREATE TRIGGER IF NOT EXISTS trg_external_file_text_index_au
AFTER UPDATE OF extracted_text ON external_file_text_index BEGIN
    INSERT INTO search_external_file_text(search_external_file_text, rowid, extracted_text)
    VALUES ('delete', OLD.id, OLD.extracted_text);
    INSERT INTO search_external_file_text(rowid, extracted_text)
    VALUES (NEW.id, NEW.extracted_text);
END;

INSERT INTO search_external_file_text(search_external_file_text) VALUES ('rebuild');

PRAGMA user_version = 3000005;