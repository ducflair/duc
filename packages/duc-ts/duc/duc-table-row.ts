// automatically generated by the FlatBuffers compiler, do not modify

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import * as flatbuffers from 'flatbuffers';

import { DucTableStyleProps } from '../duc/duc-table-style-props';


export class DucTableRow {
  bb: flatbuffers.ByteBuffer|null = null;
  bb_pos = 0;
  __init(i:number, bb:flatbuffers.ByteBuffer):DucTableRow {
  this.bb_pos = i;
  this.bb = bb;
  return this;
}

static getRootAsDucTableRow(bb:flatbuffers.ByteBuffer, obj?:DucTableRow):DucTableRow {
  return (obj || new DucTableRow()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

static getSizePrefixedRootAsDucTableRow(bb:flatbuffers.ByteBuffer, obj?:DucTableRow):DucTableRow {
  bb.setPosition(bb.position() + flatbuffers.SIZE_PREFIX_LENGTH);
  return (obj || new DucTableRow()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

id():string|null
id(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
id(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

height():number {
  const offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? this.bb!.readFloat64(this.bb_pos + offset) : 0.0;
}

style(obj?:DucTableStyleProps):DucTableStyleProps|null {
  const offset = this.bb!.__offset(this.bb_pos, 8);
  return offset ? (obj || new DucTableStyleProps()).__init(this.bb!.__indirect(this.bb_pos + offset), this.bb!) : null;
}

static startDucTableRow(builder:flatbuffers.Builder) {
  builder.startObject(3);
}

static addId(builder:flatbuffers.Builder, idOffset:flatbuffers.Offset) {
  builder.addFieldOffset(0, idOffset, 0);
}

static addHeight(builder:flatbuffers.Builder, height:number) {
  builder.addFieldFloat64(1, height, 0.0);
}

static addStyle(builder:flatbuffers.Builder, styleOffset:flatbuffers.Offset) {
  builder.addFieldOffset(2, styleOffset, 0);
}

static endDucTableRow(builder:flatbuffers.Builder):flatbuffers.Offset {
  const offset = builder.endObject();
  return offset;
}

}
