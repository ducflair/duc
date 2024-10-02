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
