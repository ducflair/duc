// Re-export the generated FlatBuffers code
mod flatbuffers;
pub mod generated {
    pub use crate::flatbuffers::duc_generated::duc;
}

#[allow(unused_imports)]
#[allow(non_camel_case_types)]
#[allow(non_snake_case)]
#[allow(non_upper_case_globals)]
pub mod parse;
pub mod serialize;
pub mod types;
