// #[path = "../core/canvas/duc/duc-rs/duc_generated.rs"]
// include!("../../core/canvas/duc/duc-rs/duc_generated.rs");

// mod duc_generated;
// pub mod duc_generated { pub use duc_generated::*; }

pub fn hello() -> String {
    "Hello from ducflair-duc Rust package!".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        assert_eq!(hello(), "Hello from ducflair-duc Rust package!");
    }
}
