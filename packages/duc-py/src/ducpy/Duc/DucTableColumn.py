# automatically generated by the FlatBuffers compiler, do not modify

# namespace: Duc

import flatbuffers
from flatbuffers.compat import import_numpy
np = import_numpy()

class DucTableColumn(object):
    __slots__ = ['_tab']

    @classmethod
    def GetRootAs(cls, buf, offset=0):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = DucTableColumn()
        x.Init(buf, n + offset)
        return x

    @classmethod
    def GetRootAsDucTableColumn(cls, buf, offset=0):
        """This method is deprecated. Please switch to GetRootAs."""
        return cls.GetRootAs(buf, offset)
    @classmethod
    def DucTableColumnBufferHasIdentifier(cls, buf, offset, size_prefixed=False):
        return flatbuffers.util.BufferHasIdentifier(buf, offset, b"\x44\x55\x43\x5F", size_prefixed=size_prefixed)

    # DucTableColumn
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # DucTableColumn
    def Id(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # DucTableColumn
    def Width(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(6))
        if o != 0:
            return self._tab.Get(flatbuffers.number_types.Float64Flags, o + self._tab.Pos)
        return 0.0

    # DucTableColumn
    def Style(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(8))
        if o != 0:
            x = self._tab.Indirect(o + self._tab.Pos)
            from Duc.DucTableStyleProps import DucTableStyleProps
            obj = DucTableStyleProps()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

def DucTableColumnStart(builder):
    builder.StartObject(3)

def Start(builder):
    DucTableColumnStart(builder)

def DucTableColumnAddId(builder, id):
    builder.PrependUOffsetTRelativeSlot(0, flatbuffers.number_types.UOffsetTFlags.py_type(id), 0)

def AddId(builder, id):
    DucTableColumnAddId(builder, id)

def DucTableColumnAddWidth(builder, width):
    builder.PrependFloat64Slot(1, width, 0.0)

def AddWidth(builder, width):
    DucTableColumnAddWidth(builder, width)

def DucTableColumnAddStyle(builder, style):
    builder.PrependUOffsetTRelativeSlot(2, flatbuffers.number_types.UOffsetTFlags.py_type(style), 0)

def AddStyle(builder, style):
    DucTableColumnAddStyle(builder, style)

def DucTableColumnEnd(builder):
    return builder.EndObject()

def End(builder):
    return DucTableColumnEnd(builder)
