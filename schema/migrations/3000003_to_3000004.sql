-- Migration: 3000003 → 3000004
-- Rename element_model.svg_path (TEXT) to thumbnail (BLOB), and add dedicated
-- references for external files used by doc element Typst source.

CREATE TABLE element_model_new (
    element_id TEXT PRIMARY KEY REFERENCES elements(id) ON DELETE CASCADE,
    model_type TEXT,
    code       TEXT,
    thumbnail  BLOB
);

INSERT INTO element_model_new (element_id, model_type, code, thumbnail)
SELECT element_id, model_type, code, CAST(svg_path AS BLOB)
FROM element_model;

DROP TABLE element_model;

ALTER TABLE element_model_new RENAME TO element_model;

CREATE INDEX idx_element_model_type ON element_model(model_type);

CREATE TABLE IF NOT EXISTS doc_element_referenced_files (
    element_id TEXT NOT NULL REFERENCES element_doc(element_id) ON DELETE CASCADE,
    file_id    TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (element_id, file_id)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_doc_referenced_files_file ON doc_element_referenced_files(file_id);

-- Defensive cleanup for prerelease files that may have stored doc references in
-- model_element_files before this dedicated table existed.
INSERT OR IGNORE INTO doc_element_referenced_files (element_id, file_id, sort_order)
SELECT mf.element_id, mf.file_id, mf.sort_order
FROM model_element_files mf
INNER JOIN element_doc d ON d.element_id = mf.element_id;

DELETE FROM model_element_files
WHERE element_id IN (SELECT element_id FROM element_doc);

PRAGMA user_version = 3000004;
