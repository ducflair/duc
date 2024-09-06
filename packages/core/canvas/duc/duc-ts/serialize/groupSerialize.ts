import * as flatbuffers from 'flatbuffers';
import { DucElement as BinDucElement, DucGroup as BinDucGroup, Point, PointBinding } from '../duc';
import { DucGroup } from '../../../element/types';


export const serializeDucGroup = (builder: flatbuffers.Builder, group: DucGroup): flatbuffers.Offset => {
    const idOffset = builder.createString(group.id);
    const labelOffset = builder.createString(group.label);
    const typeOffset = builder.createString(group.type);
    const writingLayerOffset = builder.createString(group.writingLayer);
    const scopeOffset = builder.createString(group.scope);
    const isCollapsed = group.isCollapsed || false;
    BinDucGroup.startDucGroup(builder);
    BinDucGroup.addId(builder, idOffset);
    BinDucGroup.addType(builder, typeOffset);
    BinDucGroup.addIsCollapsed(builder, isCollapsed);
    BinDucGroup.addLabel(builder, labelOffset);
    BinDucGroup.addScope(builder, scopeOffset);
    BinDucGroup.addWritingLayer(builder, writingLayerOffset);
    return BinDucGroup.endDucGroup(builder);
}
