
# FlatBuffers is the Binary Base for the `duc` CAD file format

- [FlatBuffers Docs](https://flatbuffers.dev)
- [FlatBuffers Compiler](https://flatbuffers.ar.je/)


## Generate All (Recommended for Update duc.fbs) 
```sh
flatc --ts --ts-no-import-ext -o duc-ts duc.fbs
flatc --python -o duc-py duc.fbs
flatc --rust -o duc-rs duc.fbs
```

## Generating TypeScript code from FlatBuffers schema
```sh
flatc --ts --ts-no-import-ext -o duc-ts duc.fbs
```

## Generating Python code from FlatBuffers schema
```sh
flatc --python -o duc-py duc.fbs
```

## Generating Rust code from FlatBuffers schema
```sh
flatc --rust -o duc-rs duc.fbs
```