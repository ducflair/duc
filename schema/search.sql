-- ===========================================================================
-- FULL-TEXT SEARCH (FTS5 — auto-synced via triggers)
-- ===========================================================================
-- Uses content= to link FTS virtual tables to source tables.
-- Triggers keep the FTS index automatically in sync on every INSERT/UPDATE/DELETE.
-- No application-level sync needed.
--
-- Depends on: duc.sql (elements, element_text, element_doc, element_model, blocks)
--
-- Query examples:
--   SELECT rowid, rank FROM search_elements WHERE search_elements MATCH 'motor';
--   SELECT rowid, rank FROM search_element_text WHERE search_element_text MATCH 'dimension';

-- FTS over element labels and descriptions.
CREATE VIRTUAL TABLE search_elements USING fts5(
    label,
    description,
    content='elements',
    content_rowid='rowid'
);

CREATE TRIGGER trg_elements_ai AFTER INSERT ON elements BEGIN
    INSERT INTO search_elements(rowid, label, description)
    VALUES (NEW.rowid, NEW.label, NEW.description);
END;
CREATE TRIGGER trg_elements_ad AFTER DELETE ON elements BEGIN
    INSERT INTO search_elements(search_elements, rowid, label, description)
    VALUES ('delete', OLD.rowid, OLD.label, OLD.description);
END;
CREATE TRIGGER trg_elements_au AFTER UPDATE OF label, description ON elements BEGIN
    INSERT INTO search_elements(search_elements, rowid, label, description)
    VALUES ('delete', OLD.rowid, OLD.label, OLD.description);
    INSERT INTO search_elements(rowid, label, description)
    VALUES (NEW.rowid, NEW.label, NEW.description);
END;

-- FTS over text element content.
CREATE VIRTUAL TABLE search_element_text USING fts5(
    text,
    original_text,
    content='element_text',
    content_rowid='rowid'
);

CREATE TRIGGER trg_element_text_ai AFTER INSERT ON element_text BEGIN
    INSERT INTO search_element_text(rowid, text, original_text)
    VALUES (NEW.rowid, NEW.text, NEW.original_text);
END;
CREATE TRIGGER trg_element_text_ad AFTER DELETE ON element_text BEGIN
    INSERT INTO search_element_text(search_element_text, rowid, text, original_text)
    VALUES ('delete', OLD.rowid, OLD.text, OLD.original_text);
END;
CREATE TRIGGER trg_element_text_au AFTER UPDATE OF text, original_text ON element_text BEGIN
    INSERT INTO search_element_text(search_element_text, rowid, text, original_text)
    VALUES ('delete', OLD.rowid, OLD.text, OLD.original_text);
    INSERT INTO search_element_text(rowid, text, original_text)
    VALUES (NEW.rowid, NEW.text, NEW.original_text);
END;

-- FTS over doc element content.
CREATE VIRTUAL TABLE search_element_doc USING fts5(
    text,
    content='element_doc',
    content_rowid='rowid'
);

CREATE TRIGGER trg_element_doc_ai AFTER INSERT ON element_doc BEGIN
    INSERT INTO search_element_doc(rowid, text)
    VALUES (NEW.rowid, NEW.text);
END;
CREATE TRIGGER trg_element_doc_ad AFTER DELETE ON element_doc BEGIN
    INSERT INTO search_element_doc(search_element_doc, rowid, text)
    VALUES ('delete', OLD.rowid, OLD.text);
END;
CREATE TRIGGER trg_element_doc_au AFTER UPDATE OF text ON element_doc BEGIN
    INSERT INTO search_element_doc(search_element_doc, rowid, text)
    VALUES ('delete', OLD.rowid, OLD.text);
    INSERT INTO search_element_doc(rowid, text)
    VALUES (NEW.rowid, NEW.text);
END;

-- FTS over model element source code.
CREATE VIRTUAL TABLE search_element_model USING fts5(
    code,
    content='element_model',
    content_rowid='rowid'
);

CREATE TRIGGER trg_element_model_ai AFTER INSERT ON element_model BEGIN
    INSERT INTO search_element_model(rowid, code)
    VALUES (NEW.rowid, NEW.code);
END;
CREATE TRIGGER trg_element_model_ad AFTER DELETE ON element_model BEGIN
    INSERT INTO search_element_model(search_element_model, rowid, code)
    VALUES ('delete', OLD.rowid, OLD.code);
END;
CREATE TRIGGER trg_element_model_au AFTER UPDATE OF code ON element_model BEGIN
    INSERT INTO search_element_model(search_element_model, rowid, code)
    VALUES ('delete', OLD.rowid, OLD.code);
    INSERT INTO search_element_model(rowid, code)
    VALUES (NEW.rowid, NEW.code);
END;

-- FTS over block labels and descriptions.
CREATE VIRTUAL TABLE search_blocks USING fts5(
    label,
    description,
    content='blocks',
    content_rowid='rowid'
);

CREATE TRIGGER trg_blocks_ai AFTER INSERT ON blocks BEGIN
    INSERT INTO search_blocks(rowid, label, description)
    VALUES (NEW.rowid, NEW.label, NEW.description);
END;
CREATE TRIGGER trg_blocks_ad AFTER DELETE ON blocks BEGIN
    INSERT INTO search_blocks(search_blocks, rowid, label, description)
    VALUES ('delete', OLD.rowid, OLD.label, OLD.description);
END;
CREATE TRIGGER trg_blocks_au AFTER UPDATE OF label, description ON blocks BEGIN
    INSERT INTO search_blocks(search_blocks, rowid, label, description)
    VALUES ('delete', OLD.rowid, OLD.label, OLD.description);
    INSERT INTO search_blocks(rowid, label, description)
    VALUES (NEW.rowid, NEW.label, NEW.description);
END;
