#[allow(unused_imports)]
#[allow(non_camel_case_types)]
#[allow(non_snake_case)]
#[allow(non_upper_case_globals)]
pub mod parse;
pub mod serialize;
pub mod types;

// SQLite storage layer and high-level document API
pub mod db;
pub mod api;

#[cfg(test)]
mod tests {
    use std::fs;
    use std::path::Path;

    // Initialize logging for tests
    fn init_logging() {
        let _ = env_logger::builder()
            .filter_level(log::LevelFilter::Info)
            .is_test(true)
            .try_init();
    }

    #[test]
    fn test_parse_with_logging() {
        init_logging();

        // Try to load a test DUC file from assets folder
        let test_file_path = Path::new("assets/testing/duc-files/plot_elements.duc");

        if test_file_path.exists() {
            match fs::read(test_file_path) {
                Ok(data) => {
                    println!("Loaded test file: {} bytes", data.len());

                    // Call the parse function to trigger the logging
                    match crate::parse::parse(&data) {
                        Ok(parsed) => {
                            println!("✅ Successfully parsed DUC file");
                            println!("Layers count: {}", parsed.layers.len());
                        }
                        Err(e) => {
                            println!("❌ Parse error: {}", e);
                        }
                    }
                }
                Err(e) => {
                    println!("❌ Failed to read test file: {}", e);
                }
            }
        } else {
            println!("❌ Test file not found: {}", test_file_path.display());
            // Create minimal test data to at least test the parsing pipeline
            let minimal_data = vec![0u8; 100];
            match crate::parse::parse(&minimal_data) {
                Ok(_) => println!("✅ Minimal parse succeeded"),
                Err(e) => println!("❌ Minimal parse failed: {}", e),
            }
        }
    }

    #[test]
    fn test_serialize_roundtrip_compressed() {
        init_logging();

        let test_file_path = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../assets/testing/duc-files/universal.duc");
        if !test_file_path.exists() {
            println!("Skipped — test file not found: {}", test_file_path.display());
            return;
        }

        let original = fs::read(test_file_path).expect("read test file");
        let parsed = crate::parse::parse(&original).expect("parse original");

        let compressed = crate::serialize::serialize(&parsed).expect("serialize");

        assert!(!compressed.is_empty(), "serialized output must not be empty");
        println!(
            "original={} bytes, compressed={} bytes ({:.1}%)",
            original.len(),
            compressed.len(),
            compressed.len() as f64 / original.len() as f64 * 100.0
        );

        let reparsed = crate::parse::parse(&compressed).expect("parse compressed");
        assert_eq!(parsed.elements.len(), reparsed.elements.len());
        assert_eq!(parsed.layers.len(), reparsed.layers.len());
        assert_eq!(parsed.blocks.len(), reparsed.blocks.len());
        println!("Round-trip OK — {} elements preserved", reparsed.elements.len());
    }
}
