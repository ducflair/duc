//! High-level document API — target-transparent CRUD over a `DucConnection`.

pub mod document;
pub mod meta;
pub mod version_control;

pub use document::DucDocument;
