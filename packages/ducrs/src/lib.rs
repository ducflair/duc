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

        // Try to load a test DUC file from ducpdf tests
        let test_file_path = Path::new("/Users/jorgesoares/Ducflair/duc/packages/ducpdf/src/duc2pdf/tests/assets/plot_elements.duc");

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
}
