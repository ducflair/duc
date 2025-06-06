// automatically generated by the FlatBuffers compiler, do not modify

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import * as flatbuffers from 'flatbuffers';

export class StrokeSides {
  bb: flatbuffers.ByteBuffer|null = null;
  bb_pos = 0;
  __init(i:number, bb:flatbuffers.ByteBuffer):StrokeSides {
  this.bb_pos = i;
  this.bb = bb;
  return this;
}

static getRootAsStrokeSides(bb:flatbuffers.ByteBuffer, obj?:StrokeSides):StrokeSides {
  return (obj || new StrokeSides()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

static getSizePrefixedRootAsStrokeSides(bb:flatbuffers.ByteBuffer, obj?:StrokeSides):StrokeSides {
  bb.setPosition(bb.position() + flatbuffers.SIZE_PREFIX_LENGTH);
  return (obj || new StrokeSides()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

preference():number {
  const offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? this.bb!.readInt8(this.bb_pos + offset) : 0;
}

values(index: number):number|null {
  const offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? this.bb!.readFloat64(this.bb!.__vector(this.bb_pos + offset) + index * 8) : 0;
}

valuesLength():number {
  const offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? this.bb!.__vector_len(this.bb_pos + offset) : 0;
}

valuesArray():Float64Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? new Float64Array(this.bb!.bytes().buffer, this.bb!.bytes().byteOffset + this.bb!.__vector(this.bb_pos + offset), this.bb!.__vector_len(this.bb_pos + offset)) : null;
}

static startStrokeSides(builder:flatbuffers.Builder) {
  builder.startObject(2);
}

static addPreference(builder:flatbuffers.Builder, preference:number) {
  builder.addFieldInt8(0, preference, 0);
}

static addValues(builder:flatbuffers.Builder, valuesOffset:flatbuffers.Offset) {
  builder.addFieldOffset(1, valuesOffset, 0);
}

static createValuesVector(builder:flatbuffers.Builder, data:number[]|Float64Array):flatbuffers.Offset;
/**
 * @deprecated This Uint8Array overload will be removed in the future.
 */
static createValuesVector(builder:flatbuffers.Builder, data:number[]|Uint8Array):flatbuffers.Offset;
static createValuesVector(builder:flatbuffers.Builder, data:number[]|Float64Array|Uint8Array):flatbuffers.Offset {
  builder.startVector(8, data.length, 8);
  for (let i = data.length - 1; i >= 0; i--) {
    builder.addFloat64(data[i]!);
  }
  return builder.endVector();
}

static startValuesVector(builder:flatbuffers.Builder, numElems:number) {
  builder.startVector(8, numElems, 8);
}

static endStrokeSides(builder:flatbuffers.Builder):flatbuffers.Offset {
  const offset = builder.endObject();
  return offset;
}

static createStrokeSides(builder:flatbuffers.Builder, preference:number, valuesOffset:flatbuffers.Offset):flatbuffers.Offset {
  StrokeSides.startStrokeSides(builder);
  StrokeSides.addPreference(builder, preference);
  StrokeSides.addValues(builder, valuesOffset);
  return StrokeSides.endStrokeSides(builder);
}
}
