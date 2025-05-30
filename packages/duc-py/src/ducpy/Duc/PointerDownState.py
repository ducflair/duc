# automatically generated by the FlatBuffers compiler, do not modify

# namespace: Duc

import flatbuffers
from flatbuffers.compat import import_numpy
np = import_numpy()

class PointerDownState(object):
    __slots__ = ['_tab']

    @classmethod
    def GetRootAs(cls, buf, offset=0):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = PointerDownState()
        x.Init(buf, n + offset)
        return x

    @classmethod
    def GetRootAsPointerDownState(cls, buf, offset=0):
        """This method is deprecated. Please switch to GetRootAs."""
        return cls.GetRootAs(buf, offset)
    @classmethod
    def PointerDownStateBufferHasIdentifier(cls, buf, offset, size_prefixed=False):
        return flatbuffers.util.BufferHasIdentifier(buf, offset, b"\x44\x55\x43\x5F", size_prefixed=size_prefixed)

    # PointerDownState
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # PointerDownState
    def PrevSelectedPointsIndices(self, j):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            a = self._tab.Vector(o)
            return self._tab.Get(flatbuffers.number_types.Int32Flags, a + flatbuffers.number_types.UOffsetTFlags.py_type(j * 4))
        return 0

    # PointerDownState
    def PrevSelectedPointsIndicesAsNumpy(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.GetVectorAsNumpy(flatbuffers.number_types.Int32Flags, o)
        return 0

    # PointerDownState
    def PrevSelectedPointsIndicesLength(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.VectorLen(o)
        return 0

    # PointerDownState
    def PrevSelectedPointsIndicesIsNone(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        return o == 0

    # PointerDownState
    def LastClickedPoint(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(6))
        if o != 0:
            return self._tab.Get(flatbuffers.number_types.Int32Flags, o + self._tab.Pos)
        return 0

    # PointerDownState
    def LastClickedIsEndPoint(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(8))
        if o != 0:
            return bool(self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos))
        return False

    # PointerDownState
    def Origin(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(10))
        if o != 0:
            x = self._tab.Indirect(o + self._tab.Pos)
            from Duc.SimplePoint import SimplePoint
            obj = SimplePoint()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # PointerDownState
    def SegmentMidpoint(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(12))
        if o != 0:
            x = self._tab.Indirect(o + self._tab.Pos)
            from Duc.SegmentMidpointState import SegmentMidpointState
            obj = SegmentMidpointState()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # PointerDownState
    def HandleType(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(14))
        if o != 0:
            return self._tab.Get(flatbuffers.number_types.Int8Flags, o + self._tab.Pos)
        return None

def PointerDownStateStart(builder):
    builder.StartObject(6)

def Start(builder):
    PointerDownStateStart(builder)

def PointerDownStateAddPrevSelectedPointsIndices(builder, prevSelectedPointsIndices):
    builder.PrependUOffsetTRelativeSlot(0, flatbuffers.number_types.UOffsetTFlags.py_type(prevSelectedPointsIndices), 0)

def AddPrevSelectedPointsIndices(builder, prevSelectedPointsIndices):
    PointerDownStateAddPrevSelectedPointsIndices(builder, prevSelectedPointsIndices)

def PointerDownStateStartPrevSelectedPointsIndicesVector(builder, numElems):
    return builder.StartVector(4, numElems, 4)

def StartPrevSelectedPointsIndicesVector(builder, numElems):
    return PointerDownStateStartPrevSelectedPointsIndicesVector(builder, numElems)

def PointerDownStateAddLastClickedPoint(builder, lastClickedPoint):
    builder.PrependInt32Slot(1, lastClickedPoint, 0)

def AddLastClickedPoint(builder, lastClickedPoint):
    PointerDownStateAddLastClickedPoint(builder, lastClickedPoint)

def PointerDownStateAddLastClickedIsEndPoint(builder, lastClickedIsEndPoint):
    builder.PrependBoolSlot(2, lastClickedIsEndPoint, 0)

def AddLastClickedIsEndPoint(builder, lastClickedIsEndPoint):
    PointerDownStateAddLastClickedIsEndPoint(builder, lastClickedIsEndPoint)

def PointerDownStateAddOrigin(builder, origin):
    builder.PrependUOffsetTRelativeSlot(3, flatbuffers.number_types.UOffsetTFlags.py_type(origin), 0)

def AddOrigin(builder, origin):
    PointerDownStateAddOrigin(builder, origin)

def PointerDownStateAddSegmentMidpoint(builder, segmentMidpoint):
    builder.PrependUOffsetTRelativeSlot(4, flatbuffers.number_types.UOffsetTFlags.py_type(segmentMidpoint), 0)

def AddSegmentMidpoint(builder, segmentMidpoint):
    PointerDownStateAddSegmentMidpoint(builder, segmentMidpoint)

def PointerDownStateAddHandleType(builder, handleType):
    builder.PrependInt8Slot(5, handleType, None)

def AddHandleType(builder, handleType):
    PointerDownStateAddHandleType(builder, handleType)

def PointerDownStateEnd(builder):
    return builder.EndObject()

def End(builder):
    return PointerDownStateEnd(builder)
