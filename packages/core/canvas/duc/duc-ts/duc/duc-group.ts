// automatically generated by the FlatBuffers compiler, do not modify

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import * as flatbuffers from 'flatbuffers';

export class DucGroup {
  bb: flatbuffers.ByteBuffer|null = null;
  bb_pos = 0;
  __init(i:number, bb:flatbuffers.ByteBuffer):DucGroup {
  this.bb_pos = i;
  this.bb = bb;
  return this;
}

static getRootAsDucGroup(bb:flatbuffers.ByteBuffer, obj?:DucGroup):DucGroup {
  return (obj || new DucGroup()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

static getSizePrefixedRootAsDucGroup(bb:flatbuffers.ByteBuffer, obj?:DucGroup):DucGroup {
  bb.setPosition(bb.position() + flatbuffers.SIZE_PREFIX_LENGTH);
  return (obj || new DucGroup()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

id():string|null
id(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
id(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

type():string|null
type(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
type(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

isCollapsed():boolean {
  const offset = this.bb!.__offset(this.bb_pos, 8);
  return offset ? !!this.bb!.readInt8(this.bb_pos + offset) : false;
}

label():string|null
label(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
label(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 10);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

scope():string|null
scope(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
scope(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 12);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

writingLayer():string|null
writingLayer(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
writingLayer(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 14);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

static startDucGroup(builder:flatbuffers.Builder) {
  builder.startObject(6);
}

static addId(builder:flatbuffers.Builder, idOffset:flatbuffers.Offset) {
  builder.addFieldOffset(0, idOffset, 0);
}

static addType(builder:flatbuffers.Builder, typeOffset:flatbuffers.Offset) {
  builder.addFieldOffset(1, typeOffset, 0);
}

static addIsCollapsed(builder:flatbuffers.Builder, isCollapsed:boolean) {
  builder.addFieldInt8(2, +isCollapsed, +false);
}

static addLabel(builder:flatbuffers.Builder, labelOffset:flatbuffers.Offset) {
  builder.addFieldOffset(3, labelOffset, 0);
}

static addScope(builder:flatbuffers.Builder, scopeOffset:flatbuffers.Offset) {
  builder.addFieldOffset(4, scopeOffset, 0);
}

static addWritingLayer(builder:flatbuffers.Builder, writingLayerOffset:flatbuffers.Offset) {
  builder.addFieldOffset(5, writingLayerOffset, 0);
}

static endDucGroup(builder:flatbuffers.Builder):flatbuffers.Offset {
  const offset = builder.endObject();
  return offset;
}

static createDucGroup(builder:flatbuffers.Builder, idOffset:flatbuffers.Offset, typeOffset:flatbuffers.Offset, isCollapsed:boolean, labelOffset:flatbuffers.Offset, scopeOffset:flatbuffers.Offset, writingLayerOffset:flatbuffers.Offset):flatbuffers.Offset {
  DucGroup.startDucGroup(builder);
  DucGroup.addId(builder, idOffset);
  DucGroup.addType(builder, typeOffset);
  DucGroup.addIsCollapsed(builder, isCollapsed);
  DucGroup.addLabel(builder, labelOffset);
  DucGroup.addScope(builder, scopeOffset);
  DucGroup.addWritingLayer(builder, writingLayerOffset);
  return DucGroup.endDucGroup(builder);
}
}