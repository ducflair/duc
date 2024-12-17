// Export all raw flatbuffers methods
pub mod duc_rs {
  pub use duc_rs::duc_generated::duc::*;
}

pub fn hello() -> String {
  "Hello from ducflair-duc Rust package! Add this to any file: use ducflair_duc::duc::*;".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        assert_eq!(hello(), "Hello from ducflair-duc Rust package!");
    }
}
