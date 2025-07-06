use std::env;
use std::fs;
use std::path::Path;

// Assuming your crate is named "duc" as per Cargo.toml
// and parse_duc_file is accessible via duc::parse::parse_duc_file or duc::parse_duc_file
use duc::parse_duc_file;

fn main() -> Result<(), String> {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage: {} <path_to_duc_file>", args[0]);
        return Err("No file path provided".to_string());
    }

    let file_path_str = &args[1];
    let file_path = Path::new(file_path_str);

    if !file_path.exists() {
        eprintln!("Error: File not found at '{}'", file_path_str);
        return Err(format!("File not found: {}", file_path_str));
    }

    println!("Attempting to parse duc file: {}", file_path_str);

    let data = match fs::read(file_path) {
        Ok(data) => data,
        Err(e) => {
            eprintln!("Error reading file '{}': {}", file_path_str, e);
            return Err(format!("Failed to read file: {}", e));
        }
    };

    match parse_duc_file(&data) {
        Ok(duc_file) => {
            println!("Successfully parsed .duc file!");
            println!("Number of elements: {}", duc_file.elements.len());
            if let Some(app_state) = &duc_file.app_state {
                println!("App State view background color: {}", app_state.view_background_color);
            } else {
                println!("App State: N/A");
            }
            println!("Number of binary files: {}", duc_file.binary_files.len());
            Ok(())
        }
        Err(e) => {
            eprintln!("Error parsing .duc file: {}", e);
            Err(format!("Failed to parse .duc file: {}", e))
        }
    }
} 