-- Migration: 3000003 → 3000004
-- Rename element_model.svg_path (TEXT) to thumbnail (BLOB).
-- SQLite does not support ALTER COLUMN, so we recreate the table.

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
