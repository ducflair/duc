# automatically generated by the FlatBuffers compiler, do not modify

# namespace: Duc

import flatbuffers
from flatbuffers.compat import import_numpy
np = import_numpy()

class AdvancedPoint(object):
    __slots__ = ['_tab']

    @classmethod
    def GetRootAs(cls, buf, offset=0):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = AdvancedPoint()
        x.Init(buf, n + offset)
        return x

    @classmethod
    def GetRootAsAdvancedPoint(cls, buf, offset=0):
        """This method is deprecated. Please switch to GetRootAs."""
        return cls.GetRootAs(buf, offset)
    # AdvancedPoint
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # AdvancedPoint
    def X(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.Get(flatbuffers.number_types.Float32Flags, o + self._tab.Pos)
        return 0.0

    # AdvancedPoint
    def Y(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(6))
        if o != 0:
            return self._tab.Get(flatbuffers.number_types.Float32Flags, o + self._tab.Pos)
        return 0.0

    # AdvancedPoint
    def IsCurve(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(8))
        if o != 0:
            return bool(self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos))
        return False

    # AdvancedPoint
    def MirroringAll(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(10))
        if o != 0:
            return bool(self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos))
        return False

    # AdvancedPoint
    def BorderRadius(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(12))
        if o != 0:
            return self._tab.Get(flatbuffers.number_types.Float32Flags, o + self._tab.Pos)
        return 0.0

    # AdvancedPoint
    def HandleIn(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(14))
        if o != 0:
            x = self._tab.Indirect(o + self._tab.Pos)
            from Duc.Point import Point
            obj = Point()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # AdvancedPoint
    def HandleOut(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(16))
        if o != 0:
            x = self._tab.Indirect(o + self._tab.Pos)
            from Duc.Point import Point
            obj = Point()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

def AdvancedPointStart(builder):
    builder.StartObject(7)

def Start(builder):
    AdvancedPointStart(builder)

def AdvancedPointAddX(builder, x):
    builder.PrependFloat32Slot(0, x, 0.0)

def AddX(builder, x):
    AdvancedPointAddX(builder, x)

def AdvancedPointAddY(builder, y):
    builder.PrependFloat32Slot(1, y, 0.0)

def AddY(builder, y):
    AdvancedPointAddY(builder, y)

def AdvancedPointAddIsCurve(builder, isCurve):
    builder.PrependBoolSlot(2, isCurve, 0)

def AddIsCurve(builder, isCurve):
    AdvancedPointAddIsCurve(builder, isCurve)

def AdvancedPointAddMirroringAll(builder, mirroringAll):
    builder.PrependBoolSlot(3, mirroringAll, 0)

def AddMirroringAll(builder, mirroringAll):
    AdvancedPointAddMirroringAll(builder, mirroringAll)

def AdvancedPointAddBorderRadius(builder, borderRadius):
    builder.PrependFloat32Slot(4, borderRadius, 0.0)

def AddBorderRadius(builder, borderRadius):
    AdvancedPointAddBorderRadius(builder, borderRadius)

def AdvancedPointAddHandleIn(builder, handleIn):
    builder.PrependUOffsetTRelativeSlot(5, flatbuffers.number_types.UOffsetTFlags.py_type(handleIn), 0)

def AddHandleIn(builder, handleIn):
    AdvancedPointAddHandleIn(builder, handleIn)

def AdvancedPointAddHandleOut(builder, handleOut):
    builder.PrependUOffsetTRelativeSlot(6, flatbuffers.number_types.UOffsetTFlags.py_type(handleOut), 0)

def AddHandleOut(builder, handleOut):
    AdvancedPointAddHandleOut(builder, handleOut)

def AdvancedPointEnd(builder):
    return builder.EndObject()

def End(builder):
    return AdvancedPointEnd(builder)
