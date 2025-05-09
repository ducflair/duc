// automatically generated by the FlatBuffers compiler, do not modify

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import * as flatbuffers from 'flatbuffers';

import { BoundElement } from '../duc/bound-element';
import { ElementBackground } from '../duc/element-background';
import { ElementStroke } from '../duc/element-stroke';
import { ImageCrop } from '../duc/image-crop';
import { Point } from '../duc/point';
import { PointBinding } from '../duc/point-binding';
import { SimplePoint } from '../duc/simple-point';


export class DucElement {
  bb: flatbuffers.ByteBuffer|null = null;
  bb_pos = 0;
  __init(i:number, bb:flatbuffers.ByteBuffer):DucElement {
  this.bb_pos = i;
  this.bb = bb;
  return this;
}

static getRootAsDucElement(bb:flatbuffers.ByteBuffer, obj?:DucElement):DucElement {
  return (obj || new DucElement()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

static getSizePrefixedRootAsDucElement(bb:flatbuffers.ByteBuffer, obj?:DucElement):DucElement {
  bb.setPosition(bb.position() + flatbuffers.SIZE_PREFIX_LENGTH);
  return (obj || new DucElement()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
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

xV2():number|null {
  const offset = this.bb!.__offset(this.bb_pos, 8);
  return offset ? this.bb!.readFloat32(this.bb_pos + offset) : null;
}

yV2():number|null {
  const offset = this.bb!.__offset(this.bb_pos, 10);
  return offset ? this.bb!.readFloat32(this.bb_pos + offset) : null;
}

scope():string|null
scope(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
scope(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 14);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

label():string|null
label(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
label(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 18);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

isVisible():boolean {
  const offset = this.bb!.__offset(this.bb_pos, 20);
  return offset ? !!this.bb!.readInt8(this.bb_pos + offset) : false;
}

backgroundColorV3():string|null
backgroundColorV3(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
backgroundColorV3(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 26);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

strokeColorV3():string|null
strokeColorV3(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
strokeColorV3(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 28);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

opacity():number {
  const offset = this.bb!.__offset(this.bb_pos, 38);
  return offset ? this.bb!.readFloat32(this.bb_pos + offset) : 0.0;
}

widthV2():number|null {
  const offset = this.bb!.__offset(this.bb_pos, 40);
  return offset ? this.bb!.readFloat32(this.bb_pos + offset) : null;
}

heightV2():number|null {
  const offset = this.bb!.__offset(this.bb_pos, 42);
  return offset ? this.bb!.readFloat32(this.bb_pos + offset) : null;
}

angleV2():number|null {
  const offset = this.bb!.__offset(this.bb_pos, 44);
  return offset ? this.bb!.readFloat32(this.bb_pos + offset) : null;
}

isDeleted():boolean {
  const offset = this.bb!.__offset(this.bb_pos, 46);
  return offset ? !!this.bb!.readInt8(this.bb_pos + offset) : false;
}

groupIds(index: number):string
groupIds(index: number,optionalEncoding:flatbuffers.Encoding):string|Uint8Array
groupIds(index: number,optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 48);
  return offset ? this.bb!.__string(this.bb!.__vector(this.bb_pos + offset) + index * 4, optionalEncoding) : null;
}

groupIdsLength():number {
  const offset = this.bb!.__offset(this.bb_pos, 48);
  return offset ? this.bb!.__vector_len(this.bb_pos + offset) : 0;
}

frameId():string|null
frameId(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
frameId(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 50);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

boundElements(index: number, obj?:BoundElement):BoundElement|null {
  const offset = this.bb!.__offset(this.bb_pos, 52);
  return offset ? (obj || new BoundElement()).__init(this.bb!.__indirect(this.bb!.__vector(this.bb_pos + offset) + index * 4), this.bb!) : null;
}

boundElementsLength():number {
  const offset = this.bb!.__offset(this.bb_pos, 52);
  return offset ? this.bb!.__vector_len(this.bb_pos + offset) : 0;
}

link():string|null
link(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
link(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 54);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

locked():boolean {
  const offset = this.bb!.__offset(this.bb_pos, 56);
  return offset ? !!this.bb!.readInt8(this.bb_pos + offset) : false;
}

fontSizeV2():number|null {
  const offset = this.bb!.__offset(this.bb_pos, 64);
  return offset ? this.bb!.readInt32(this.bb_pos + offset) : null;
}

fontFamily():string|null
fontFamily(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
fontFamily(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 66);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

text():string|null
text(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
text(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 68);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

containerId():string|null
containerId(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
containerId(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 74);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

lineHeightV2():number|null {
  const offset = this.bb!.__offset(this.bb_pos, 78);
  return offset ? this.bb!.readFloat32(this.bb_pos + offset) : null;
}

autoResize():boolean|null {
  const offset = this.bb!.__offset(this.bb_pos, 80);
  return offset ? !!this.bb!.readInt8(this.bb_pos + offset) : null;
}

points(index: number, obj?:Point):Point|null {
  const offset = this.bb!.__offset(this.bb_pos, 82);
  return offset ? (obj || new Point()).__init(this.bb!.__indirect(this.bb!.__vector(this.bb_pos + offset) + index * 4), this.bb!) : null;
}

pointsLength():number {
  const offset = this.bb!.__offset(this.bb_pos, 82);
  return offset ? this.bb!.__vector_len(this.bb_pos + offset) : 0;
}

lastCommittedPoint(obj?:Point):Point|null {
  const offset = this.bb!.__offset(this.bb_pos, 84);
  return offset ? (obj || new Point()).__init(this.bb!.__indirect(this.bb_pos + offset), this.bb!) : null;
}

startBinding(obj?:PointBinding):PointBinding|null {
  const offset = this.bb!.__offset(this.bb_pos, 86);
  return offset ? (obj || new PointBinding()).__init(this.bb!.__indirect(this.bb_pos + offset), this.bb!) : null;
}

endBinding(obj?:PointBinding):PointBinding|null {
  const offset = this.bb!.__offset(this.bb_pos, 88);
  return offset ? (obj || new PointBinding()).__init(this.bb!.__indirect(this.bb_pos + offset), this.bb!) : null;
}

elbowed():boolean|null {
  const offset = this.bb!.__offset(this.bb_pos, 94);
  return offset ? !!this.bb!.readInt8(this.bb_pos + offset) : null;
}

simulatePressure():boolean|null {
  const offset = this.bb!.__offset(this.bb_pos, 98);
  return offset ? !!this.bb!.readInt8(this.bb_pos + offset) : null;
}

fileId():string|null
fileId(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
fileId(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 100);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

status():string|null
status(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
status(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 102);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

isCollapsed():boolean|null {
  const offset = this.bb!.__offset(this.bb_pos, 106);
  return offset ? !!this.bb!.readInt8(this.bb_pos + offset) : null;
}

name():string|null
name(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
name(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 108);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

groupIdRef():string|null
groupIdRef(optionalEncoding:flatbuffers.Encoding):string|Uint8Array|null
groupIdRef(optionalEncoding?:any):string|Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 110);
  return offset ? this.bb!.__string(this.bb_pos + offset, optionalEncoding) : null;
}

strokeStyleV3():number {
  const offset = this.bb!.__offset(this.bb_pos, 112);
  return offset ? this.bb!.readInt8(this.bb_pos + offset) : 0;
}

fillStyleV3():number {
  const offset = this.bb!.__offset(this.bb_pos, 114);
  return offset ? this.bb!.readInt8(this.bb_pos + offset) : 0;
}

textAlignV3():number|null {
  const offset = this.bb!.__offset(this.bb_pos, 116);
  return offset ? this.bb!.readInt8(this.bb_pos + offset) : null;
}

verticalAlignV3():number {
  const offset = this.bb!.__offset(this.bb_pos, 118);
  return offset ? this.bb!.readInt8(this.bb_pos + offset) : 0;
}

xV3():number {
  const offset = this.bb!.__offset(this.bb_pos, 120);
  return offset ? this.bb!.readFloat64(this.bb_pos + offset) : 0.0;
}

yV3():number {
  const offset = this.bb!.__offset(this.bb_pos, 122);
  return offset ? this.bb!.readFloat64(this.bb_pos + offset) : 0.0;
}

scaleV3(obj?:SimplePoint):SimplePoint|null {
  const offset = this.bb!.__offset(this.bb_pos, 124);
  return offset ? (obj || new SimplePoint()).__init(this.bb!.__indirect(this.bb_pos + offset), this.bb!) : null;
}

pressuresV3(index: number):number|null {
  const offset = this.bb!.__offset(this.bb_pos, 126);
  return offset ? this.bb!.readFloat64(this.bb!.__vector(this.bb_pos + offset) + index * 8) : 0;
}

pressuresV3Length():number {
  const offset = this.bb!.__offset(this.bb_pos, 126);
  return offset ? this.bb!.__vector_len(this.bb_pos + offset) : 0;
}

pressuresV3Array():Float64Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 126);
  return offset ? new Float64Array(this.bb!.bytes().buffer, this.bb!.bytes().byteOffset + this.bb!.__vector(this.bb_pos + offset), this.bb!.__vector_len(this.bb_pos + offset)) : null;
}

strokeWidthV3():number {
  const offset = this.bb!.__offset(this.bb_pos, 128);
  return offset ? this.bb!.readFloat64(this.bb_pos + offset) : 0.0;
}

angleV3():number {
  const offset = this.bb!.__offset(this.bb_pos, 130);
  return offset ? this.bb!.readFloat64(this.bb_pos + offset) : 0.0;
}

roundness():number {
  const offset = this.bb!.__offset(this.bb_pos, 132);
  return offset ? this.bb!.readFloat64(this.bb_pos + offset) : 0.0;
}

widthV3():number {
  const offset = this.bb!.__offset(this.bb_pos, 134);
  return offset ? this.bb!.readFloat64(this.bb_pos + offset) : 0.0;
}

heightV3():number {
  const offset = this.bb!.__offset(this.bb_pos, 136);
  return offset ? this.bb!.readFloat64(this.bb_pos + offset) : 0.0;
}

fontSizeV3():number|null {
  const offset = this.bb!.__offset(this.bb_pos, 138);
  return offset ? this.bb!.readFloat64(this.bb_pos + offset) : null;
}

lineHeightV3():number|null {
  const offset = this.bb!.__offset(this.bb_pos, 140);
  return offset ? this.bb!.readFloat64(this.bb_pos + offset) : null;
}

blending():number|null {
  const offset = this.bb!.__offset(this.bb_pos, 142);
  return offset ? this.bb!.readInt8(this.bb_pos + offset) : null;
}

background(index: number, obj?:ElementBackground):ElementBackground|null {
  const offset = this.bb!.__offset(this.bb_pos, 144);
  return offset ? (obj || new ElementBackground()).__init(this.bb!.__indirect(this.bb!.__vector(this.bb_pos + offset) + index * 4), this.bb!) : null;
}

backgroundLength():number {
  const offset = this.bb!.__offset(this.bb_pos, 144);
  return offset ? this.bb!.__vector_len(this.bb_pos + offset) : 0;
}

stroke(index: number, obj?:ElementStroke):ElementStroke|null {
  const offset = this.bb!.__offset(this.bb_pos, 146);
  return offset ? (obj || new ElementStroke()).__init(this.bb!.__indirect(this.bb!.__vector(this.bb_pos + offset) + index * 4), this.bb!) : null;
}

strokeLength():number {
  const offset = this.bb!.__offset(this.bb_pos, 146);
  return offset ? this.bb!.__vector_len(this.bb_pos + offset) : 0;
}

crop(obj?:ImageCrop):ImageCrop|null {
  const offset = this.bb!.__offset(this.bb_pos, 148);
  return offset ? (obj || new ImageCrop()).__init(this.bb!.__indirect(this.bb_pos + offset), this.bb!) : null;
}

clip():boolean|null {
  const offset = this.bb!.__offset(this.bb_pos, 150);
  return offset ? !!this.bb!.readInt8(this.bb_pos + offset) : null;
}

subset():number|null {
  const offset = this.bb!.__offset(this.bb_pos, 152);
  return offset ? this.bb!.readInt8(this.bb_pos + offset) : null;
}

zIndex():number {
  const offset = this.bb!.__offset(this.bb_pos, 154);
  return offset ? this.bb!.readInt32(this.bb_pos + offset) : 0;
}

static startDucElement(builder:flatbuffers.Builder) {
  builder.startObject(76);
}

static addId(builder:flatbuffers.Builder, idOffset:flatbuffers.Offset) {
  builder.addFieldOffset(0, idOffset, 0);
}

static addType(builder:flatbuffers.Builder, typeOffset:flatbuffers.Offset) {
  builder.addFieldOffset(1, typeOffset, 0);
}

static addXV2(builder:flatbuffers.Builder, xV2:number) {
  builder.addFieldFloat32(2, xV2, null);
}

static addYV2(builder:flatbuffers.Builder, yV2:number) {
  builder.addFieldFloat32(3, yV2, null);
}

static addScope(builder:flatbuffers.Builder, scopeOffset:flatbuffers.Offset) {
  builder.addFieldOffset(5, scopeOffset, 0);
}

static addLabel(builder:flatbuffers.Builder, labelOffset:flatbuffers.Offset) {
  builder.addFieldOffset(7, labelOffset, 0);
}

static addIsVisible(builder:flatbuffers.Builder, isVisible:boolean) {
  builder.addFieldInt8(8, +isVisible, +false);
}

static addBackgroundColorV3(builder:flatbuffers.Builder, backgroundColorV3Offset:flatbuffers.Offset) {
  builder.addFieldOffset(11, backgroundColorV3Offset, 0);
}

static addStrokeColorV3(builder:flatbuffers.Builder, strokeColorV3Offset:flatbuffers.Offset) {
  builder.addFieldOffset(12, strokeColorV3Offset, 0);
}

static addOpacity(builder:flatbuffers.Builder, opacity:number) {
  builder.addFieldFloat32(17, opacity, 0.0);
}

static addWidthV2(builder:flatbuffers.Builder, widthV2:number) {
  builder.addFieldFloat32(18, widthV2, null);
}

static addHeightV2(builder:flatbuffers.Builder, heightV2:number) {
  builder.addFieldFloat32(19, heightV2, null);
}

static addAngleV2(builder:flatbuffers.Builder, angleV2:number) {
  builder.addFieldFloat32(20, angleV2, null);
}

static addIsDeleted(builder:flatbuffers.Builder, isDeleted:boolean) {
  builder.addFieldInt8(21, +isDeleted, +false);
}

static addGroupIds(builder:flatbuffers.Builder, groupIdsOffset:flatbuffers.Offset) {
  builder.addFieldOffset(22, groupIdsOffset, 0);
}

static createGroupIdsVector(builder:flatbuffers.Builder, data:flatbuffers.Offset[]):flatbuffers.Offset {
  builder.startVector(4, data.length, 4);
  for (let i = data.length - 1; i >= 0; i--) {
    builder.addOffset(data[i]!);
  }
  return builder.endVector();
}

static startGroupIdsVector(builder:flatbuffers.Builder, numElems:number) {
  builder.startVector(4, numElems, 4);
}

static addFrameId(builder:flatbuffers.Builder, frameIdOffset:flatbuffers.Offset) {
  builder.addFieldOffset(23, frameIdOffset, 0);
}

static addBoundElements(builder:flatbuffers.Builder, boundElementsOffset:flatbuffers.Offset) {
  builder.addFieldOffset(24, boundElementsOffset, 0);
}

static createBoundElementsVector(builder:flatbuffers.Builder, data:flatbuffers.Offset[]):flatbuffers.Offset {
  builder.startVector(4, data.length, 4);
  for (let i = data.length - 1; i >= 0; i--) {
    builder.addOffset(data[i]!);
  }
  return builder.endVector();
}

static startBoundElementsVector(builder:flatbuffers.Builder, numElems:number) {
  builder.startVector(4, numElems, 4);
}

static addLink(builder:flatbuffers.Builder, linkOffset:flatbuffers.Offset) {
  builder.addFieldOffset(25, linkOffset, 0);
}

static addLocked(builder:flatbuffers.Builder, locked:boolean) {
  builder.addFieldInt8(26, +locked, +false);
}

static addFontSizeV2(builder:flatbuffers.Builder, fontSizeV2:number) {
  builder.addFieldInt32(30, fontSizeV2, null);
}

static addFontFamily(builder:flatbuffers.Builder, fontFamilyOffset:flatbuffers.Offset) {
  builder.addFieldOffset(31, fontFamilyOffset, 0);
}

static addText(builder:flatbuffers.Builder, textOffset:flatbuffers.Offset) {
  builder.addFieldOffset(32, textOffset, 0);
}

static addContainerId(builder:flatbuffers.Builder, containerIdOffset:flatbuffers.Offset) {
  builder.addFieldOffset(35, containerIdOffset, 0);
}

static addLineHeightV2(builder:flatbuffers.Builder, lineHeightV2:number) {
  builder.addFieldFloat32(37, lineHeightV2, null);
}

static addAutoResize(builder:flatbuffers.Builder, autoResize:boolean) {
  builder.addFieldInt8(38, +autoResize, null);
}

static addPoints(builder:flatbuffers.Builder, pointsOffset:flatbuffers.Offset) {
  builder.addFieldOffset(39, pointsOffset, 0);
}

static createPointsVector(builder:flatbuffers.Builder, data:flatbuffers.Offset[]):flatbuffers.Offset {
  builder.startVector(4, data.length, 4);
  for (let i = data.length - 1; i >= 0; i--) {
    builder.addOffset(data[i]!);
  }
  return builder.endVector();
}

static startPointsVector(builder:flatbuffers.Builder, numElems:number) {
  builder.startVector(4, numElems, 4);
}

static addLastCommittedPoint(builder:flatbuffers.Builder, lastCommittedPointOffset:flatbuffers.Offset) {
  builder.addFieldOffset(40, lastCommittedPointOffset, 0);
}

static addStartBinding(builder:flatbuffers.Builder, startBindingOffset:flatbuffers.Offset) {
  builder.addFieldOffset(41, startBindingOffset, 0);
}

static addEndBinding(builder:flatbuffers.Builder, endBindingOffset:flatbuffers.Offset) {
  builder.addFieldOffset(42, endBindingOffset, 0);
}

static addElbowed(builder:flatbuffers.Builder, elbowed:boolean) {
  builder.addFieldInt8(45, +elbowed, null);
}

static addSimulatePressure(builder:flatbuffers.Builder, simulatePressure:boolean) {
  builder.addFieldInt8(47, +simulatePressure, null);
}

static addFileId(builder:flatbuffers.Builder, fileIdOffset:flatbuffers.Offset) {
  builder.addFieldOffset(48, fileIdOffset, 0);
}

static addStatus(builder:flatbuffers.Builder, statusOffset:flatbuffers.Offset) {
  builder.addFieldOffset(49, statusOffset, 0);
}

static addIsCollapsed(builder:flatbuffers.Builder, isCollapsed:boolean) {
  builder.addFieldInt8(51, +isCollapsed, null);
}

static addName(builder:flatbuffers.Builder, nameOffset:flatbuffers.Offset) {
  builder.addFieldOffset(52, nameOffset, 0);
}

static addGroupIdRef(builder:flatbuffers.Builder, groupIdRefOffset:flatbuffers.Offset) {
  builder.addFieldOffset(53, groupIdRefOffset, 0);
}

static addStrokeStyleV3(builder:flatbuffers.Builder, strokeStyleV3:number) {
  builder.addFieldInt8(54, strokeStyleV3, 0);
}

static addFillStyleV3(builder:flatbuffers.Builder, fillStyleV3:number) {
  builder.addFieldInt8(55, fillStyleV3, 0);
}

static addTextAlignV3(builder:flatbuffers.Builder, textAlignV3:number) {
  builder.addFieldInt8(56, textAlignV3, null);
}

static addVerticalAlignV3(builder:flatbuffers.Builder, verticalAlignV3:number) {
  builder.addFieldInt8(57, verticalAlignV3, 0);
}

static addXV3(builder:flatbuffers.Builder, xV3:number) {
  builder.addFieldFloat64(58, xV3, 0.0);
}

static addYV3(builder:flatbuffers.Builder, yV3:number) {
  builder.addFieldFloat64(59, yV3, 0.0);
}

static addScaleV3(builder:flatbuffers.Builder, scaleV3Offset:flatbuffers.Offset) {
  builder.addFieldOffset(60, scaleV3Offset, 0);
}

static addPressuresV3(builder:flatbuffers.Builder, pressuresV3Offset:flatbuffers.Offset) {
  builder.addFieldOffset(61, pressuresV3Offset, 0);
}

static createPressuresV3Vector(builder:flatbuffers.Builder, data:number[]|Float64Array):flatbuffers.Offset;
/**
 * @deprecated This Uint8Array overload will be removed in the future.
 */
static createPressuresV3Vector(builder:flatbuffers.Builder, data:number[]|Uint8Array):flatbuffers.Offset;
static createPressuresV3Vector(builder:flatbuffers.Builder, data:number[]|Float64Array|Uint8Array):flatbuffers.Offset {
  builder.startVector(8, data.length, 8);
  for (let i = data.length - 1; i >= 0; i--) {
    builder.addFloat64(data[i]!);
  }
  return builder.endVector();
}

static startPressuresV3Vector(builder:flatbuffers.Builder, numElems:number) {
  builder.startVector(8, numElems, 8);
}

static addStrokeWidthV3(builder:flatbuffers.Builder, strokeWidthV3:number) {
  builder.addFieldFloat64(62, strokeWidthV3, 0.0);
}

static addAngleV3(builder:flatbuffers.Builder, angleV3:number) {
  builder.addFieldFloat64(63, angleV3, 0.0);
}

static addRoundness(builder:flatbuffers.Builder, roundness:number) {
  builder.addFieldFloat64(64, roundness, 0.0);
}

static addWidthV3(builder:flatbuffers.Builder, widthV3:number) {
  builder.addFieldFloat64(65, widthV3, 0.0);
}

static addHeightV3(builder:flatbuffers.Builder, heightV3:number) {
  builder.addFieldFloat64(66, heightV3, 0.0);
}

static addFontSizeV3(builder:flatbuffers.Builder, fontSizeV3:number) {
  builder.addFieldFloat64(67, fontSizeV3, null);
}

static addLineHeightV3(builder:flatbuffers.Builder, lineHeightV3:number) {
  builder.addFieldFloat64(68, lineHeightV3, null);
}

static addBlending(builder:flatbuffers.Builder, blending:number) {
  builder.addFieldInt8(69, blending, null);
}

static addBackground(builder:flatbuffers.Builder, backgroundOffset:flatbuffers.Offset) {
  builder.addFieldOffset(70, backgroundOffset, 0);
}

static createBackgroundVector(builder:flatbuffers.Builder, data:flatbuffers.Offset[]):flatbuffers.Offset {
  builder.startVector(4, data.length, 4);
  for (let i = data.length - 1; i >= 0; i--) {
    builder.addOffset(data[i]!);
  }
  return builder.endVector();
}

static startBackgroundVector(builder:flatbuffers.Builder, numElems:number) {
  builder.startVector(4, numElems, 4);
}

static addStroke(builder:flatbuffers.Builder, strokeOffset:flatbuffers.Offset) {
  builder.addFieldOffset(71, strokeOffset, 0);
}

static createStrokeVector(builder:flatbuffers.Builder, data:flatbuffers.Offset[]):flatbuffers.Offset {
  builder.startVector(4, data.length, 4);
  for (let i = data.length - 1; i >= 0; i--) {
    builder.addOffset(data[i]!);
  }
  return builder.endVector();
}

static startStrokeVector(builder:flatbuffers.Builder, numElems:number) {
  builder.startVector(4, numElems, 4);
}

static addCrop(builder:flatbuffers.Builder, cropOffset:flatbuffers.Offset) {
  builder.addFieldOffset(72, cropOffset, 0);
}

static addClip(builder:flatbuffers.Builder, clip:boolean) {
  builder.addFieldInt8(73, +clip, null);
}

static addSubset(builder:flatbuffers.Builder, subset:number) {
  builder.addFieldInt8(74, subset, null);
}

static addZIndex(builder:flatbuffers.Builder, zIndex:number) {
  builder.addFieldInt32(75, zIndex, 0);
}

static endDucElement(builder:flatbuffers.Builder):flatbuffers.Offset {
  const offset = builder.endObject();
  return offset;
}

}
