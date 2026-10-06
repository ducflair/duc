/// Decodes standard AutoCAD text escape sequences (%%c, %%d, %%p, etc.)
pub fn decode_cad_text_escapes(text: &str) -> String {
    let mut result = String::with_capacity(text.len());
    let mut chars = text.chars().peekable();

    while let Some(ch) = chars.next() {
        if ch == '%' {
            if chars.peek() == Some(&'%') {
                chars.next(); // consume second '%'
                match chars.next() {
                    Some('c') | Some('C') => result.push('Ø'),
                    Some('d') | Some('D') => result.push('°'),
                    Some('p') | Some('P') => result.push('±'),
                    Some('%') => result.push('%'),
                    Some('u') | Some('U') => {} // underline toggle
                    Some('o') | Some('O') => {} // overline toggle
                    Some(other) => {
                        result.push('%');
                        result.push('%');
                        result.push(other);
                    }
                    None => {
                        result.push('%');
                        result.push('%');
                    }
                }
            } else {
                result.push(ch);
            }
        } else if ch == '\\' {
            // Check for Unicode escape \U+XXXX
            let remaining: String = chars.clone().take(6).collect();
            if remaining.len() >= 6 && (remaining.starts_with("U+") || remaining.starts_with("u+")) {
                let hex_str = &remaining[2..6];
                if let Ok(code) = u32::from_str_radix(hex_str, 16) {
                    if let Some(unicode_char) = char::from_u32(code) {
                        result.push(unicode_char);
                        for _ in 0..6 {
                            chars.next();
                        }
                        continue;
                    }
                }
            }
            result.push(ch);
        } else {
            result.push(ch);
        }
    }

    result
}

/// Parses and cleans MTEXT formatted strings, extracting plain text lines.
pub fn clean_mtext(text: &str) -> Vec<String> {
    let normalized = text
        .replace("\r\n", "\\P")
        .replace(['\n', '\r'], "\\P")
        .replace("^J", "\\P");

    let mut lines = Vec::new();
    let mut current_line = String::new();
    let mut chars = normalized.chars().peekable();

    while let Some(ch) = chars.next() {
        match ch {
            '{' | '}' => {
                // Formatting group scopes - skip
            }
            '\\' => {
                match chars.next() {
                    Some('\\') => current_line.push('\\'),
                    Some('{') => current_line.push('{'),
                    Some('}') => current_line.push('}'),
                    Some('~') => current_line.push(' '), // Non-breaking space
                    Some('P') | Some('p') => {
                        // Paragraph / Newline break
                        lines.push(decode_cad_text_escapes(&current_line));
                        current_line.clear();
                    }
                    Some('L') | Some('l') | Some('O') | Some('o') | Some('K') | Some('k') | Some('X') => {
                        // Single-letter format toggle
                    }
                    Some(code)
                        if code == 'A'
                            || code == 'C'
                            || code == 'f'
                            || code == 'F'
                            || code == 'H'
                            || code == 'Q'
                            || code == 'T'
                            || code == 'W'
                            || code == 'S' =>
                    {
                        // Long format code terminated by ';'
                        for next_ch in chars.by_ref() {
                            if next_ch == ';' {
                                break;
                            }
                        }
                    }
                    Some('U') | Some('u') => {
                        if chars.peek() == Some(&'+') {
                            chars.next(); // consume '+'
                            let mut hex_str = String::with_capacity(4);
                            for _ in 0..4 {
                                if let Some(&next_ch) = chars.peek() {
                                    if next_ch.is_ascii_hexdigit() {
                                        hex_str.push(chars.next().unwrap());
                                    } else {
                                        break;
                                    }
                                }
                            }
                            if let Ok(code) = u32::from_str_radix(&hex_str, 16) {
                                if let Some(ch) = char::from_u32(code) {
                                    current_line.push(ch);
                                }
                            }
                        }
                    }
                    Some(other) => {
                        // Unknown escape, skip
                        if other == ';' {
                            // Empty format code
                        }
                    }
                    None => {}
                }
            }
            _ => {
                current_line.push(ch);
            }
        }
    }

    if !current_line.is_empty() || lines.is_empty() {
        lines.push(decode_cad_text_escapes(&current_line));
    }

    lines
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_decode_cad_escapes() {
        assert_eq!(decode_cad_text_escapes("Diameter %%c50"), "Diameter Ø50");
        assert_eq!(decode_cad_text_escapes("Angle 45%%d"), "Angle 45°");
        assert_eq!(decode_cad_text_escapes("Tolerance %%p0.05"), "Tolerance ±0.05");
    }

    #[test]
    fn test_clean_mtext() {
        let raw = r"{\fArial|b0|i0|c0;\C1;Hello \PWorld}";
        let lines = clean_mtext(raw);
        assert_eq!(lines, vec!["Hello ", "World"]);
    }
}
