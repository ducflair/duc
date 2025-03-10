// automatically generated by the FlatBuffers compiler, do not modify

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import * as flatbuffers from 'flatbuffers';

import { Point } from '../duc/point';


export class AdvancedPoint {
  bb: flatbuffers.ByteBuffer|null = null;
  bb_pos = 0;
  __init(i:number, bb:flatbuffers.ByteBuffer):AdvancedPoint {
  this.bb_pos = i;
  this.bb = bb;
  return this;
}

static getRootAsAdvancedPoint(bb:flatbuffers.ByteBuffer, obj?:AdvancedPoint):AdvancedPoint {
  return (obj || new AdvancedPoint()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

static getSizePrefixedRootAsAdvancedPoint(bb:flatbuffers.ByteBuffer, obj?:AdvancedPoint):AdvancedPoint {
  bb.setPosition(bb.position() + flatbuffers.SIZE_PREFIX_LENGTH);
  return (obj || new AdvancedPoint()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

x():number {
  const offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? this.bb!.readFloat32(this.bb_pos + offset) : 0.0;
}

y():number {
  const offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? this.bb!.readFloat32(this.bb_pos + offset) : 0.0;
}

isCurve():boolean {
  const offset = this.bb!.__offset(this.bb_pos, 8);
  return offset ? !!this.bb!.readInt8(this.bb_pos + offset) : false;
}

mirroringAll():boolean {
  const offset = this.bb!.__offset(this.bb_pos, 10);
  return offset ? !!this.bb!.readInt8(this.bb_pos + offset) : false;
}

borderRadius():number {
  const offset = this.bb!.__offset(this.bb_pos, 12);
  return offset ? this.bb!.readFloat32(this.bb_pos + offset) : 0.0;
}

handleIn(obj?:Point):Point|null {
  const offset = this.bb!.__offset(this.bb_pos, 14);
  return offset ? (obj || new Point()).__init(this.bb!.__indirect(this.bb_pos + offset), this.bb!) : null;
}

handleOut(obj?:Point):Point|null {
  const offset = this.bb!.__offset(this.bb_pos, 16);
  return offset ? (obj || new Point()).__init(this.bb!.__indirect(this.bb_pos + offset), this.bb!) : null;
}

static startAdvancedPoint(builder:flatbuffers.Builder) {
  builder.startObject(7);
}

static addX(builder:flatbuffers.Builder, x:number) {
  builder.addFieldFloat32(0, x, 0.0);
}

static addY(builder:flatbuffers.Builder, y:number) {
  builder.addFieldFloat32(1, y, 0.0);
}

static addIsCurve(builder:flatbuffers.Builder, isCurve:boolean) {
  builder.addFieldInt8(2, +isCurve, +false);
}

static addMirroringAll(builder:flatbuffers.Builder, mirroringAll:boolean) {
  builder.addFieldInt8(3, +mirroringAll, +false);
}

static addBorderRadius(builder:flatbuffers.Builder, borderRadius:number) {
  builder.addFieldFloat32(4, borderRadius, 0.0);
}

static addHandleIn(builder:flatbuffers.Builder, handleInOffset:flatbuffers.Offset) {
  builder.addFieldOffset(5, handleInOffset, 0);
}

static addHandleOut(builder:flatbuffers.Builder, handleOutOffset:flatbuffers.Offset) {
  builder.addFieldOffset(6, handleOutOffset, 0);
}

static endAdvancedPoint(builder:flatbuffers.Builder):flatbuffers.Offset {
  const offset = builder.endObject();
  return offset;
}

}
