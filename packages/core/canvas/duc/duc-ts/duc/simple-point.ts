// automatically generated by the FlatBuffers compiler, do not modify

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import * as flatbuffers from 'flatbuffers';

export class SimplePoint {
  bb: flatbuffers.ByteBuffer|null = null;
  bb_pos = 0;
  __init(i:number, bb:flatbuffers.ByteBuffer):SimplePoint {
  this.bb_pos = i;
  this.bb = bb;
  return this;
}

static getRootAsSimplePoint(bb:flatbuffers.ByteBuffer, obj?:SimplePoint):SimplePoint {
  return (obj || new SimplePoint()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

static getSizePrefixedRootAsSimplePoint(bb:flatbuffers.ByteBuffer, obj?:SimplePoint):SimplePoint {
  bb.setPosition(bb.position() + flatbuffers.SIZE_PREFIX_LENGTH);
  return (obj || new SimplePoint()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

x():number {
  const offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? this.bb!.readFloat64(this.bb_pos + offset) : 0.0;
}

y():number {
  const offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? this.bb!.readFloat64(this.bb_pos + offset) : 0.0;
}

static startSimplePoint(builder:flatbuffers.Builder) {
  builder.startObject(2);
}

static addX(builder:flatbuffers.Builder, x:number) {
  builder.addFieldFloat64(0, x, 0.0);
}

static addY(builder:flatbuffers.Builder, y:number) {
  builder.addFieldFloat64(1, y, 0.0);
}

static endSimplePoint(builder:flatbuffers.Builder):flatbuffers.Offset {
  const offset = builder.endObject();
  return offset;
}

static createSimplePoint(builder:flatbuffers.Builder, x:number, y:number):flatbuffers.Offset {
  SimplePoint.startSimplePoint(builder);
  SimplePoint.addX(builder, x);
  SimplePoint.addY(builder, y);
  return SimplePoint.endSimplePoint(builder);
}
}
