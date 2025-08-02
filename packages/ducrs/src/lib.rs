// Re-export the generated FlatBuffers code
pub mod generated {
    pub use crate::duc_generated::duc;
}

#[allow(unused_imports)]
#[allow(non_camel_case_types)]
pub mod types;
pub mod duc_generated;
pub mod parse;
pub mod serialize;
