// automatically generated by the FlatBuffers compiler, do not modify

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import * as flatbuffers from 'flatbuffers';

import { BinaryFileData } from '../duc/binary-file-data';


export class BinaryFilesEntry {
  bb: flatbuffers.ByteBuffer|null = null;
  bb_pos = 0;
  __init(i:number, bb:flatbuffers.ByteBuffer):BinaryFilesEntry {
  this.bb_pos = i;
  this.bb = bb;
  return this;
}

static getRootAsBinaryFilesEntry(bb:flatbuffers.ByteBuffer, obj?:BinaryFilesEntry):BinaryFilesEntry {
  return (obj || new BinaryFilesEntry()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

static getSizePrefixedRootAsBinaryFilesEntry(bb:flatbuffers.ByteBuffer, obj?:BinaryFilesEntry):BinaryFilesEntry {
  bb.setPosition(bb.position() + flatbuffers.SIZE_PREFIX_LENGTH);
  return (obj || new BinaryFilesEntry()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

key():string|null
key(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
key(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

value(obj?:BinaryFileData):BinaryFileData|null {
  const offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? (obj || new BinaryFileData()).__init(this.bb!.__indirect(this.bb_pos + offset), this.bb!) : null;
}

static startBinaryFilesEntry(builder:flatbuffers.Builder) {
  builder.startObject(2);
}

static addKey(builder:flatbuffers.Builder, keyOffset:flatbuffers.Offset) {
  builder.addFieldOffset(0, keyOffset, 0);
}

static addValue(builder:flatbuffers.Builder, valueOffset:flatbuffers.Offset) {
  builder.addFieldOffset(1, valueOffset, 0);
}

static endBinaryFilesEntry(builder:flatbuffers.Builder):flatbuffers.Offset {
  const offset = builder.endObject();
  return offset;
}

}