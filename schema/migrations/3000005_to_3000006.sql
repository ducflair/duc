-- Migration: 3000005 → 3000006
-- Move table elements onto the shared document_grid_config table so that
-- file reference and grid layout live in the same place as for PDF/doc elements.
-- Existing element_table rows are preserved; table-specific columns beyond
-- file_id can be dropped once all consumers read from document_grid_config.

BEGIN IMMEDIATE;

-- 1. Insert missing document_grid_config rows for every table element,
--    including tables without an attached file. Use default grid values.
INSERT INTO document_grid_config (
    element_id,
    file_id,
    grid_columns,
    grid_gap_x,
    grid_gap_y,
    grid_first_page_alone,
    grid_scale
)
SELECT
    element_id,
    file_id,
    1,      -- grid_columns
    0.0,    -- grid_gap_x
    0.0,    -- grid_gap_y
    0,      -- grid_first_page_alone
    1.0     -- grid_scale
FROM element_table
WHERE element_id NOT IN (SELECT element_id FROM document_grid_config);

-- 2. Re-create element_table without the file_id column so it references only
--    document_grid_config. This also drops the legacy idx_element_table_file index.
--    Clean up the table an older failed, non-transactional attempt may have left.
DROP TABLE IF EXISTS element_table_new;

CREATE TABLE element_table_new (
    element_id TEXT PRIMARY KEY REFERENCES document_grid_config(element_id) ON DELETE CASCADE
) WITHOUT ROWID;

INSERT INTO element_table_new (element_id)
SELECT element_id FROM element_table;

DROP TABLE element_table;
ALTER TABLE element_table_new RENAME TO element_table;

PRAGMA user_version = 3000006;

COMMIT;
