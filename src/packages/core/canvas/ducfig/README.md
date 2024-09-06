
# This FlatBuffers schema is used to define the data structure of the Ducfig file format.
Essentially, it is a binary representation of the canvas AppState/User Config.
- [FlatBuffers Docs](https://flatbuffers.dev)
- [FlatBuffers Compiler](https://flatbuffers.ar.je/)


## Generating TypeScript code from FlatBuffers schema
```sh
flatc --ts --ts-no-import-ext -o ducfig-ts ducfig.fbs
```