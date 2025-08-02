// Re-export the generated FlatBuffers code
pub mod generated {
    pub use crate::duc_generated::duc;
}

#[allow(unused_imports)]
#[allow(non_camel_case_types)]
#[allow(non_snake_case)]
#[allow(non_upper_case_globals)]
pub mod duc_generated;
pub mod parse;
pub mod serialize;
pub mod types;
