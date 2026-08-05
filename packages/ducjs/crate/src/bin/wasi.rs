//! ducjs WASI binary — streaming .duc serializer for Node.js.
//!
//! Reads a JSON manifest from stdin or a file, streams external files
//! into a SQLite database, then gzip-compresses to produce a .duc file.
//!
//! Usage:
//!   ducjs-wasi <output.duc> [manifest.jsonl]
//!   ducjs-wasi --state-json <state.json> <output.duc>
//!
//! Manifest format (JSON lines, one per file):
//!   {"fileId":"...","revisionId":"...","sourcePath":"...","mimeType":"...","sizeBytes":123}
//!
//! When no manifest path is given, reads JSON lines from stdin.

use std::env;
use std::fs;
use std::io::{self, BufRead, BufReader, BufWriter, Read, Write};
use std::path::Path;

use duc::api::DucDocument;

const CHUNK_SIZE: usize = 1024 * 1024; // 1MB

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() >= 4 && args[1] == "--state-json" {
        if let Err(e) = run_state_json(&args[3], &args[2], args.get(4).map(String::as_str)) {
            eprintln!("Error: {e}");
            std::process::exit(1);
        }
        return;
    }

    if args.len() < 2 {
        eprintln!("Usage: ducjs-wasi <output.duc> [manifest.jsonl]");
        eprintln!("       ducjs-wasi --state-json <state.json> <output.duc>");
        eprintln!("  If no manifest path given, reads JSON lines from stdin.");
        std::process::exit(1);
    }

    let output_path = &args[1];
    let manifest_path = args.get(2).cloned();

    if let Err(e) = run(output_path, manifest_path) {
        eprintln!("Error: {e}");
        std::process::exit(1);
    }
}

fn run_state_json(
    output_path: &str,
    state_json_path: &str,
    external_manifest_path: Option<&str>,
) -> Result<(), String> {
    let db_path = format!("{output_path}.sqlite");

    let _ = fs::remove_file(output_path);
    let _ = fs::remove_file(&db_path);

    eprintln!("Reading state JSON: {state_json_path}");
    let state_file = fs::File::open(state_json_path)
        .map_err(|e| format!("cannot open state JSON {state_json_path}: {e}"))?;
    let state: duc::types::ExportedDataState = serde_json::from_reader(BufReader::new(state_file))
        .map_err(|e| format!("parse state JSON: {e}"))?;

    eprintln!("Opening database: {db_path}");
    let mut doc = DucDocument::open(&db_path).map_err(|e| format!("open failed: {e}"))?;
    doc.write_document_state(&state)
        .map_err(|e| format!("write state failed: {e}"))?;

    if let Some(manifest_path) = external_manifest_path {
        let manifest = fs::File::open(manifest_path)
            .map_err(|e| format!("cannot open external manifest {manifest_path}: {e}"))?;
        let entries = read_manifest(manifest)?;
        let mut total_bytes = 0u64;
        for entry in &entries {
            stream_file_data(&mut doc, entry, &mut total_bytes)?;
        }
        eprintln!(
            "Streamed {} external revisions, {total_bytes} bytes total.",
            entries.len()
        );
    }
    doc.checkpoint_wal()
        .map_err(|e| format!("checkpoint failed: {e}"))?;
    drop(doc);

    eprintln!("Compressing to .duc (gzip)...");
    compress_to_gzip(&db_path, output_path)?;
    let _ = fs::remove_file(&db_path);
    eprintln!("Done. Output: {output_path}");
    Ok(())
}

fn run(output_path: &str, manifest_path: Option<String>) -> Result<(), String> {
    let db_path = format!("{output_path}.sqlite");

    let _ = fs::remove_file(output_path);
    let _ = fs::remove_file(&db_path);

    eprintln!("Opening database: {db_path}");
    let mut doc = DucDocument::open(&db_path).map_err(|e| format!("open failed: {e}"))?;

    eprintln!("Database opened and bootstrapped.");

    let entries: Vec<ManifestEntry> = match manifest_path {
        Some(ref path) => {
            let file =
                fs::File::open(path).map_err(|e| format!("cannot open manifest {path}: {e}"))?;
            read_manifest(file)?
        }
        None => {
            eprintln!("Reading manifest from stdin...");
            read_manifest(io::stdin())?
        }
    };

    eprintln!("Manifest: {} entries", entries.len());

    let mut total_files = 0u64;
    let mut total_bytes = 0u64;

    for entry in &entries {
        eprintln!("  Streaming: {} ({})", entry.source_path, entry.file_id);
        stream_file(&mut doc, entry, &mut total_bytes)?;
        total_files += 1;
    }

    eprintln!("Streamed {total_files} files, {total_bytes} bytes total.");

    eprintln!("Checkpointing WAL...");
    doc.checkpoint_wal()
        .map_err(|e| format!("checkpoint failed: {e}"))?;

    let db_size = doc
        .db_size_bytes()
        .map_err(|e| format!("db_size_bytes failed: {e}"))?;
    eprintln!(
        "Database size: {db_size} bytes ({:.2} GB)",
        db_size as f64 / (1024.0 * 1024.0 * 1024.0)
    );

    drop(doc);

    eprintln!("Compressing to .duc (gzip)...");
    compress_to_gzip(&db_path, output_path)?;

    let compressed_size = fs::metadata(output_path).map(|m| m.len()).unwrap_or(0);
    eprintln!(
        "Compressed: {compressed_size} bytes ({:.2} GB)",
        compressed_size as f64 / (1024.0 * 1024.0 * 1024.0)
    );

    let _ = fs::remove_file(&db_path);

    eprintln!("Done. Output: {output_path}");
    Ok(())
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ManifestEntry {
    file_id: String,
    revision_id: String,
    source_path: String,
    #[serde(default)]
    mime_type: String,
    #[serde(default)]
    size_bytes: i64,
}

fn read_manifest<R: Read>(reader: R) -> Result<Vec<ManifestEntry>, String> {
    let buf = BufReader::new(reader);
    let mut entries = Vec::new();

    for (line_num, line) in buf.lines().enumerate() {
        let line = line.map_err(|e| format!("read line {}: {e}", line_num + 1))?;
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        let entry: ManifestEntry = serde_json::from_str(trimmed)
            .map_err(|e| format!("parse line {}: {e}", line_num + 1))?;
        entries.push(entry);
    }

    Ok(entries)
}

fn stream_file(
    doc: &mut DucDocument,
    entry: &ManifestEntry,
    total_bytes: &mut u64,
) -> Result<(), String> {
    let path = Path::new(&entry.source_path);
    let file =
        fs::File::open(path).map_err(|e| format!("cannot open {}: {e}", entry.source_path))?;
    let file_size = file
        .metadata()
        .map(|m| m.len() as i64)
        .unwrap_or(entry.size_bytes);

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0);

    let source_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(&entry.file_id);

    let sql1 = format!(
        "INSERT OR REPLACE INTO external_files (id, active_revision_id, updated) VALUES ('{}', '{}', {})",
        escape_sql(&entry.file_id),
        escape_sql(&entry.revision_id),
        now
    );
    let sql2 = format!(
        "INSERT OR REPLACE INTO external_file_revisions (id, file_id, size_bytes, source_name, mime_type, created) VALUES ('{}', '{}', {}, '{}', '{}', {})",
        escape_sql(&entry.revision_id),
        escape_sql(&entry.file_id),
        file_size,
        escape_sql(source_name),
        escape_sql(&entry.mime_type),
        now
    );

    doc.execute_batch(&sql1)
        .map_err(|e| format!("insert external_files: {e}"))?;
    doc.execute_batch(&sql2)
        .map_err(|e| format!("insert external_file_revisions: {e}"))?;

    let mut reader = BufReader::new(file);
    let mut chunk = vec![0u8; CHUNK_SIZE];
    let mut chunk_index: i64 = 0;
    let mut offset: i64 = 0;

    loop {
        let bytes_read = reader
            .read(&mut chunk)
            .map_err(|e| format!("read chunk {chunk_index}: {e}"))?;
        if bytes_read == 0 {
            break;
        }

        doc.write_external_file_revision_chunk(
            &entry.revision_id,
            chunk_index,
            offset,
            &chunk[..bytes_read],
        )
        .map_err(|e| format!("write chunk {chunk_index} at offset {offset}: {e}"))?;

        offset += bytes_read as i64;
        chunk_index += 1;
        *total_bytes += bytes_read as u64;

        if chunk_index % 100 == 0 {
            eprintln!(
                "    chunk {chunk_index}, offset {offset} ({:.1} MB)",
                offset as f64 / (1024.0 * 1024.0)
            );
        }
    }

    eprintln!("    Done: {source_name} ({offset} bytes)");
    Ok(())
}

fn stream_file_data(
    doc: &mut DucDocument,
    entry: &ManifestEntry,
    total_bytes: &mut u64,
) -> Result<(), String> {
    let path = Path::new(&entry.source_path);
    let file =
        fs::File::open(path).map_err(|e| format!("cannot open {}: {e}", entry.source_path))?;
    doc.clear_external_file_revision_chunks(&entry.revision_id)
        .map_err(|e| format!("clear external revision {}: {e}", entry.revision_id))?;

    let mut reader = BufReader::new(file);
    let mut chunk = vec![0u8; CHUNK_SIZE];
    let mut chunk_index: i64 = 0;
    let mut offset: i64 = 0;
    loop {
        let bytes_read = reader
            .read(&mut chunk)
            .map_err(|e| format!("read chunk {chunk_index}: {e}"))?;
        if bytes_read == 0 {
            break;
        }
        doc.write_external_file_revision_chunk(
            &entry.revision_id,
            chunk_index,
            offset,
            &chunk[..bytes_read],
        )
        .map_err(|e| format!("write chunk {chunk_index} at offset {offset}: {e}"))?;
        offset += bytes_read as i64;
        chunk_index += 1;
        *total_bytes += bytes_read as u64;
    }

    if entry.size_bytes > 0 && offset != entry.size_bytes {
        return Err(format!(
            "external revision {} wrote {offset} bytes, expected {}",
            entry.revision_id, entry.size_bytes
        ));
    }
    Ok(())
}

fn compress_to_gzip(input_path: &str, output_path: &str) -> Result<(), String> {
    use flate2::write::GzEncoder;
    use flate2::Compression;

    let input = fs::File::open(input_path).map_err(|e| format!("open input: {e}"))?;
    let output = fs::File::create(output_path).map_err(|e| format!("create output: {e}"))?;

    let reader = BufReader::new(input);
    let writer = BufWriter::new(output);
    let mut encoder = GzEncoder::new(writer, Compression::default());

    let mut buf = vec![0u8; 1024 * 1024];
    let mut reader = reader;
    loop {
        let n = reader.read(&mut buf).map_err(|e| format!("read: {e}"))?;
        if n == 0 {
            break;
        }
        encoder
            .write_all(&buf[..n])
            .map_err(|e| format!("write: {e}"))?;
    }

    encoder.finish().map_err(|e| format!("gzip finish: {e}"))?;

    Ok(())
}

fn escape_sql(s: &str) -> String {
    s.replace('\'', "''")
}
