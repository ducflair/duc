flatc --ts --ts-no-import-ext -o duc-ts duc.fbs
flatc --python -o duc-py/src duc.fbs
flatc --rust -o duc-rs/src duc.fbs