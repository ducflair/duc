-- Migration: 3000006 → 3000007
-- Remove duc_global_state.name, migrate it into duc_charter.title, and add
-- normalized charter/issue tables.

CREATE TEMP TABLE _duc_global_state_name AS
SELECT name FROM duc_global_state WHERE id = 1;

CREATE TABLE duc_global_state_new (
    id                       INTEGER PRIMARY KEY CHECK (id = 1),
    view_background_color    TEXT    NOT NULL,
    main_scope               TEXT    NOT NULL,
    scope_exponent_threshold INTEGER NOT NULL DEFAULT 3
);

INSERT INTO duc_global_state_new (id, view_background_color, main_scope, scope_exponent_threshold)
SELECT id, view_background_color, main_scope, scope_exponent_threshold
FROM duc_global_state;

DROP TABLE duc_global_state;
ALTER TABLE duc_global_state_new RENAME TO duc_global_state;

CREATE TABLE duc_charter (
    id            INTEGER PRIMARY KEY CHECK (id = 1),
    title         TEXT    NOT NULL DEFAULT '',
    description   TEXT,
    objective     TEXT    NOT NULL DEFAULT '',
    phase         TEXT    NOT NULL DEFAULT 'intent' CHECK (phase IN ('intent', 'review', 'delivery', 'closed')),
    closed_reason TEXT,
    updated_at    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE duc_charter_requirements (
    id         TEXT    PRIMARY KEY,
    statement  TEXT    NOT NULL,
    must       INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
) WITHOUT ROWID;

CREATE TABLE duc_charter_requirement_acceptance_criteria (
    requirement_id TEXT    NOT NULL REFERENCES duc_charter_requirements(id) ON DELETE CASCADE,
    sort_order     INTEGER NOT NULL DEFAULT 0,
    criterion      TEXT    NOT NULL,
    PRIMARY KEY (requirement_id, sort_order)
) WITHOUT ROWID;

CREATE TABLE duc_charter_constraints (
    id         TEXT    PRIMARY KEY,
    statement  TEXT    NOT NULL,
    hard       INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
) WITHOUT ROWID;

CREATE TABLE duc_charter_decisions (
    id         TEXT    PRIMARY KEY,
    accepted   INTEGER NOT NULL DEFAULT 1,
    decision   TEXT    NOT NULL,
    rationale  TEXT    NOT NULL,
    decided_at INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
) WITHOUT ROWID;

CREATE TABLE duc_charter_decision_issue_ids (
    decision_id TEXT    NOT NULL REFERENCES duc_charter_decisions(id) ON DELETE CASCADE,
    issue_id    TEXT    NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (decision_id, sort_order)
) WITHOUT ROWID;

CREATE TABLE duc_charter_stakeholders (
    sort_order       INTEGER PRIMARY KEY,
    actor_identifier TEXT    NOT NULL,
    actor_name       TEXT,
    role             TEXT    NOT NULL
);

INSERT INTO duc_charter (id, title, objective, phase, updated_at)
SELECT 1, COALESCE((SELECT name FROM _duc_global_state_name LIMIT 1), ''), '', 'intent', 0;

DROP TABLE _duc_global_state_name;

CREATE TABLE duc_issues (
    id               TEXT    PRIMARY KEY,
    local_id         INTEGER NOT NULL,
    title            TEXT    NOT NULL,
    status           TEXT    NOT NULL CHECK (status IN ('open', 'closed', 'dismissed')),
    dismissed_reason TEXT,
    due_date         INTEGER,
    author_id        TEXT    NOT NULL,
    created_at       INTEGER NOT NULL,
    updated_at       INTEGER NOT NULL,
    deleted_at       INTEGER,
    sort_order       INTEGER NOT NULL DEFAULT 0
) WITHOUT ROWID;

CREATE UNIQUE INDEX idx_duc_issues_local_id ON duc_issues(local_id);
CREATE INDEX idx_duc_issues_status ON duc_issues(status);
CREATE INDEX idx_duc_issues_updated ON duc_issues(updated_at);

CREATE TABLE duc_issue_assignees (
    issue_id         TEXT    NOT NULL REFERENCES duc_issues(id) ON DELETE CASCADE,
    actor_identifier TEXT    NOT NULL,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (issue_id, actor_identifier)
) WITHOUT ROWID;

CREATE TABLE duc_issue_followers (
    issue_id         TEXT    NOT NULL REFERENCES duc_issues(id) ON DELETE CASCADE,
    actor_identifier TEXT    NOT NULL,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (issue_id, actor_identifier)
) WITHOUT ROWID;

CREATE TABLE duc_issue_messages (
    id                TEXT    PRIMARY KEY,
    issue_id          TEXT    NOT NULL REFERENCES duc_issues(id) ON DELETE CASCADE,
    author_identifier TEXT    NOT NULL,
    author_name       TEXT,
    content           TEXT    NOT NULL,
    reply_to_id       TEXT,
    created_at        INTEGER NOT NULL,
    edited_at         INTEGER,
    deleted_at        INTEGER,
    sort_order        INTEGER NOT NULL DEFAULT 0
) WITHOUT ROWID;

CREATE INDEX idx_duc_issue_messages_issue ON duc_issue_messages(issue_id, sort_order);

CREATE TABLE duc_issue_message_reactions (
    message_id        TEXT    NOT NULL REFERENCES duc_issue_messages(id) ON DELETE CASCADE,
    emoji             TEXT    NOT NULL,
    actor_identifier  TEXT    NOT NULL,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (message_id, emoji, actor_identifier)
) WITHOUT ROWID;

CREATE TABLE duc_issue_anchors (
    issue_id        TEXT PRIMARY KEY REFERENCES duc_issues(id) ON DELETE CASCADE,
    anchor_type     TEXT NOT NULL CHECK (anchor_type IN ('canvas', 'element', 'model')),
    canvas_x        REAL,
    canvas_y        REAL,
    canvas_scope    TEXT,
    element_id      TEXT,
    anchor_x        REAL,
    anchor_y        REAL,
    model_point_x   REAL,
    model_point_y   REAL,
    model_point_z   REAL,
    model_normal_x  REAL,
    model_normal_y  REAL,
    model_normal_z  REAL,
    topology_id     TEXT
) WITHOUT ROWID;

CREATE TABLE model_viewer_state_new (
    owner_type                 TEXT    NOT NULL CHECK (owner_type IN ('element', 'issue_anchor')),
    owner_id                   TEXT    NOT NULL,
    camera_control             TEXT    NOT NULL DEFAULT 'orbit',
    camera_ortho               INTEGER NOT NULL DEFAULT 0,
    camera_up                  TEXT    NOT NULL DEFAULT 'Z',
    camera_position_x          REAL    NOT NULL DEFAULT 0.0,
    camera_position_y          REAL    NOT NULL DEFAULT 0.0,
    camera_position_z          REAL    NOT NULL DEFAULT 0.0,
    camera_quaternion_x        REAL    NOT NULL DEFAULT 0.0,
    camera_quaternion_y        REAL    NOT NULL DEFAULT 0.0,
    camera_quaternion_z        REAL    NOT NULL DEFAULT 0.0,
    camera_quaternion_w        REAL    NOT NULL DEFAULT 1.0,
    camera_target_x            REAL    NOT NULL DEFAULT 0.0,
    camera_target_y            REAL    NOT NULL DEFAULT 0.0,
    camera_target_z            REAL    NOT NULL DEFAULT 0.0,
    camera_zoom                REAL    NOT NULL DEFAULT 1.0,
    camera_pan_speed           REAL    NOT NULL DEFAULT 1.0,
    camera_rotate_speed        REAL    NOT NULL DEFAULT 1.0,
    camera_zoom_speed          REAL    NOT NULL DEFAULT 1.0,
    camera_holroyd             INTEGER NOT NULL DEFAULT 0,
    display_wireframe          INTEGER NOT NULL DEFAULT 0,
    display_transparent        INTEGER NOT NULL DEFAULT 0,
    display_black_edges        INTEGER NOT NULL DEFAULT 0,
    display_grid_uniform       INTEGER,
    display_grid_xy            INTEGER NOT NULL DEFAULT 0,
    display_grid_xz            INTEGER NOT NULL DEFAULT 0,
    display_grid_yz            INTEGER NOT NULL DEFAULT 0,
    display_axes_visible       INTEGER NOT NULL DEFAULT 0,
    display_axes_at_origin     INTEGER NOT NULL DEFAULT 0,
    material_metalness         REAL    NOT NULL DEFAULT 0.0,
    material_roughness         REAL    NOT NULL DEFAULT 0.5,
    material_default_opacity   REAL    NOT NULL DEFAULT 1.0,
    material_edge_color        INTEGER NOT NULL DEFAULT 0,
    material_ambient_intensity REAL    NOT NULL DEFAULT 0.5,
    material_direct_intensity  REAL    NOT NULL DEFAULT 0.5,
    clip_x_enabled             INTEGER NOT NULL DEFAULT 0,
    clip_x_value               REAL    NOT NULL DEFAULT 0.0,
    clip_x_normal_x            REAL,
    clip_x_normal_y            REAL,
    clip_x_normal_z            REAL,
    clip_y_enabled             INTEGER NOT NULL DEFAULT 0,
    clip_y_value               REAL    NOT NULL DEFAULT 0.0,
    clip_y_normal_x            REAL,
    clip_y_normal_y            REAL,
    clip_y_normal_z            REAL,
    clip_z_enabled             INTEGER NOT NULL DEFAULT 0,
    clip_z_value               REAL    NOT NULL DEFAULT 0.0,
    clip_z_normal_x            REAL,
    clip_z_normal_y            REAL,
    clip_z_normal_z            REAL,
    clip_intersection          INTEGER NOT NULL DEFAULT 0,
    clip_show_planes           INTEGER NOT NULL DEFAULT 0,
    clip_object_color_caps     INTEGER NOT NULL DEFAULT 0,
    explode_active             INTEGER NOT NULL DEFAULT 0,
    explode_value              REAL    NOT NULL DEFAULT 0.0,
    zebra_active               INTEGER NOT NULL DEFAULT 0,
    zebra_stripe_count         INTEGER NOT NULL DEFAULT 10,
    zebra_stripe_direction     REAL    NOT NULL DEFAULT 0.0,
    zebra_color_scheme         TEXT    NOT NULL DEFAULT 'blackwhite',
    zebra_opacity              REAL    NOT NULL DEFAULT 1.0,
    zebra_mapping_mode         TEXT    NOT NULL DEFAULT 'reflection',
    PRIMARY KEY (owner_type, owner_id)
) WITHOUT ROWID;

INSERT INTO model_viewer_state_new (
    owner_type, owner_id,
    camera_control, camera_ortho, camera_up,
    camera_position_x, camera_position_y, camera_position_z,
    camera_quaternion_x, camera_quaternion_y, camera_quaternion_z, camera_quaternion_w,
    camera_target_x, camera_target_y, camera_target_z,
    camera_zoom, camera_pan_speed, camera_rotate_speed, camera_zoom_speed, camera_holroyd,
    display_wireframe, display_transparent, display_black_edges,
    display_grid_uniform, display_grid_xy, display_grid_xz, display_grid_yz,
    display_axes_visible, display_axes_at_origin,
    material_metalness, material_roughness, material_default_opacity,
    material_edge_color, material_ambient_intensity, material_direct_intensity,
    clip_x_enabled, clip_x_value, clip_x_normal_x, clip_x_normal_y, clip_x_normal_z,
    clip_y_enabled, clip_y_value, clip_y_normal_x, clip_y_normal_y, clip_y_normal_z,
    clip_z_enabled, clip_z_value, clip_z_normal_x, clip_z_normal_y, clip_z_normal_z,
    clip_intersection, clip_show_planes, clip_object_color_caps,
    explode_active, explode_value,
    zebra_active, zebra_stripe_count, zebra_stripe_direction,
    zebra_color_scheme, zebra_opacity, zebra_mapping_mode
)
SELECT
    'element', element_id,
    camera_control, camera_ortho, camera_up,
    camera_position_x, camera_position_y, camera_position_z,
    camera_quaternion_x, camera_quaternion_y, camera_quaternion_z, camera_quaternion_w,
    camera_target_x, camera_target_y, camera_target_z,
    camera_zoom, camera_pan_speed, camera_rotate_speed, camera_zoom_speed, camera_holroyd,
    display_wireframe, display_transparent, display_black_edges,
    display_grid_uniform, display_grid_xy, display_grid_xz, display_grid_yz,
    display_axes_visible, display_axes_at_origin,
    material_metalness, material_roughness, material_default_opacity,
    material_edge_color, material_ambient_intensity, material_direct_intensity,
    clip_x_enabled, clip_x_value, clip_x_normal_x, clip_x_normal_y, clip_x_normal_z,
    clip_y_enabled, clip_y_value, clip_y_normal_x, clip_y_normal_y, clip_y_normal_z,
    clip_z_enabled, clip_z_value, clip_z_normal_x, clip_z_normal_y, clip_z_normal_z,
    clip_intersection, clip_show_planes, clip_object_color_caps,
    explode_active, explode_value,
    zebra_active, zebra_stripe_count, zebra_stripe_direction,
    zebra_color_scheme, zebra_opacity, zebra_mapping_mode
FROM model_viewer_state;

DROP TABLE model_viewer_state;
ALTER TABLE model_viewer_state_new RENAME TO model_viewer_state;

CREATE TRIGGER model_viewer_state_delete_element
AFTER DELETE ON elements
BEGIN
    DELETE FROM model_viewer_state WHERE owner_type = 'element' AND owner_id = OLD.id;
END;

CREATE TRIGGER model_viewer_state_delete_issue_anchor
AFTER DELETE ON duc_issue_anchors
BEGIN
    DELETE FROM model_viewer_state WHERE owner_type = 'issue_anchor' AND owner_id = OLD.issue_id;
END;

PRAGMA user_version = 3000007;
