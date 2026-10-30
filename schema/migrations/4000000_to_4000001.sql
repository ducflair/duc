-- Migration: 4000000 -> 4000001
-- Remove scopes: remove main_scope and scope_exponent_threshold from duc_global_state,
-- remove scope from duc_local_state, remove canvas_scope from duc_issue_anchors,
-- remove scope from elements and drop idx_elements_scope.

BEGIN IMMEDIATE;

ALTER TABLE duc_global_state DROP COLUMN main_scope;
ALTER TABLE duc_global_state DROP COLUMN scope_exponent_threshold;
ALTER TABLE duc_local_state DROP COLUMN scope;
ALTER TABLE duc_issue_anchors DROP COLUMN canvas_scope;
DROP INDEX IF EXISTS idx_elements_scope;
ALTER TABLE elements DROP COLUMN scope;

PRAGMA user_version = 4000001;
COMMIT;
