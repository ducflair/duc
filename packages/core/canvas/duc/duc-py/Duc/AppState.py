# automatically generated by the FlatBuffers compiler, do not modify

# namespace: Duc

import flatbuffers
from flatbuffers.compat import import_numpy
np = import_numpy()

class AppState(object):
    __slots__ = ['_tab']

    @classmethod
    def GetRootAs(cls, buf, offset=0):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = AppState()
        x.Init(buf, n + offset)
        return x

    @classmethod
    def GetRootAsAppState(cls, buf, offset=0):
        """This method is deprecated. Please switch to GetRootAs."""
        return cls.GetRootAs(buf, offset)
    # AppState
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # AppState
    def ActiveEmbeddableElement(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            x = self._tab.Indirect(o + self._tab.Pos)
            from Duc.DucElement import DucElement
            obj = DucElement()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # AppState
    def ActiveEmbeddableState(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(6))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # AppState
    def DraggingElement(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(8))
        if o != 0:
            x = self._tab.Indirect(o + self._tab.Pos)
            from Duc.DucElement import DucElement
            obj = DucElement()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # AppState
    def ResizingElement(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(10))
        if o != 0:
            x = self._tab.Indirect(o + self._tab.Pos)
            from Duc.DucElement import DucElement
            obj = DucElement()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # AppState
    def MultiElement(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(12))
        if o != 0:
            x = self._tab.Indirect(o + self._tab.Pos)
            from Duc.DucElement import DucElement
            obj = DucElement()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # AppState
    def SelectionElement(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(14))
        if o != 0:
            x = self._tab.Indirect(o + self._tab.Pos)
            from Duc.DucElement import DucElement
            obj = DucElement()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # AppState
    def FrameToHighlight(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(16))
        if o != 0:
            x = self._tab.Indirect(o + self._tab.Pos)
            from Duc.DucElement import DucElement
            obj = DucElement()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # AppState
    def FrameRenderingEnabled(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(18))
        if o != 0:
            return bool(self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos))
        return False

    # AppState
    def FrameRenderingName(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(20))
        if o != 0:
            return bool(self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos))
        return False

    # AppState
    def FrameRenderingOutline(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(22))
        if o != 0:
            return bool(self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos))
        return False

    # AppState
    def FrameRenderingClip(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(24))
        if o != 0:
            return bool(self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos))
        return False

    # AppState
    def EditingFrame(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(26))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # AppState
    def ElementsToHighlight(self, j):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(28))
        if o != 0:
            x = self._tab.Vector(o)
            x += flatbuffers.number_types.UOffsetTFlags.py_type(j) * 4
            x = self._tab.Indirect(x)
            from Duc.DucElement import DucElement
            obj = DucElement()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # AppState
    def ElementsToHighlightLength(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(28))
        if o != 0:
            return self._tab.VectorLen(o)
        return 0

    # AppState
    def ElementsToHighlightIsNone(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(28))
        return o == 0

    # AppState
    def EditingElement(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(30))
        if o != 0:
            x = self._tab.Indirect(o + self._tab.Pos)
            from Duc.DucElement import DucElement
            obj = DucElement()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # AppState
    def CurrentItemStrokeColor(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(32))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # AppState
    def CurrentItemStrokePlacement(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(34))
        if o != 0:
            return self._tab.Get(flatbuffers.number_types.Int32Flags, o + self._tab.Pos)
        return 0

    # AppState
    def CurrentItemBackgroundColor(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(36))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # AppState
    def CurrentItemFillStyle(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(38))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # AppState
    def CurrentItemStrokeWidth(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(40))
        if o != 0:
            return self._tab.Get(flatbuffers.number_types.Int32Flags, o + self._tab.Pos)
        return 0

    # AppState
    def CurrentItemStrokeStyle(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(42))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # AppState
    def CurrentItemRoughness(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(44))
        if o != 0:
            return self._tab.Get(flatbuffers.number_types.Int32Flags, o + self._tab.Pos)
        return 0

    # AppState
    def CurrentItemOpacity(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(46))
        if o != 0:
            return self._tab.Get(flatbuffers.number_types.Float32Flags, o + self._tab.Pos)
        return 0.0

    # AppState
    def CurrentItemFontFamily(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(48))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # AppState
    def CurrentItemFontSize(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(50))
        if o != 0:
            return self._tab.Get(flatbuffers.number_types.Int32Flags, o + self._tab.Pos)
        return 0

    # AppState
    def CurrentItemTextAlign(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(52))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # AppState
    def CurrentItemStartArrowhead(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(54))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # AppState
    def CurrentItemEndArrowhead(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(56))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # AppState
    def CurrentItemRoundness(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(58))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # AppState
    def ViewBackgroundColor(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(60))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # AppState
    def Scope(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(62))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # AppState
    def WritingLayer(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(64))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # AppState
    def Groups(self, j):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(66))
        if o != 0:
            x = self._tab.Vector(o)
            x += flatbuffers.number_types.UOffsetTFlags.py_type(j) * 4
            x = self._tab.Indirect(x)
            from Duc.DucGroup import DucGroup
            obj = DucGroup()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # AppState
    def GroupsLength(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(66))
        if o != 0:
            return self._tab.VectorLen(o)
        return 0

    # AppState
    def GroupsIsNone(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(66))
        return o == 0

    # AppState
    def ScrollX(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(68))
        if o != 0:
            return self._tab.Get(flatbuffers.number_types.Float32Flags, o + self._tab.Pos)
        return 0.0

    # AppState
    def ScrollY(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(70))
        if o != 0:
            return self._tab.Get(flatbuffers.number_types.Float32Flags, o + self._tab.Pos)
        return 0.0

    # AppState
    def CursorButton(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(72))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # AppState
    def ScrolledOutside(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(74))
        if o != 0:
            return bool(self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos))
        return False

    # AppState
    def Name(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(76))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # AppState
    def Zoom(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(78))
        if o != 0:
            return self._tab.Get(flatbuffers.number_types.Float32Flags, o + self._tab.Pos)
        return 0.0

    # AppState
    def LastPointerDownWith(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(80))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # AppState
    def SelectedElementIds(self, j):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(82))
        if o != 0:
            a = self._tab.Vector(o)
            return self._tab.String(a + flatbuffers.number_types.UOffsetTFlags.py_type(j * 4))
        return ""

    # AppState
    def SelectedElementIdsLength(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(82))
        if o != 0:
            return self._tab.VectorLen(o)
        return 0

    # AppState
    def SelectedElementIdsIsNone(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(82))
        return o == 0

    # AppState
    def PreviousSelectedElementIds(self, j):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(84))
        if o != 0:
            a = self._tab.Vector(o)
            return self._tab.String(a + flatbuffers.number_types.UOffsetTFlags.py_type(j * 4))
        return ""

    # AppState
    def PreviousSelectedElementIdsLength(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(84))
        if o != 0:
            return self._tab.VectorLen(o)
        return 0

    # AppState
    def PreviousSelectedElementIdsIsNone(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(84))
        return o == 0

    # AppState
    def SelectedElementsAreBeingDragged(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(86))
        if o != 0:
            return bool(self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos))
        return False

    # AppState
    def ShouldCacheIgnoreZoom(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(88))
        if o != 0:
            return bool(self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos))
        return False

    # AppState
    def GridSize(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(90))
        if o != 0:
            return self._tab.Get(flatbuffers.number_types.Int32Flags, o + self._tab.Pos)
        return 0

    # AppState
    def SelectedGroupIds(self, j):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(92))
        if o != 0:
            a = self._tab.Vector(o)
            return self._tab.String(a + flatbuffers.number_types.UOffsetTFlags.py_type(j * 4))
        return ""

    # AppState
    def SelectedGroupIdsLength(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(92))
        if o != 0:
            return self._tab.VectorLen(o)
        return 0

    # AppState
    def SelectedGroupIdsIsNone(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(92))
        return o == 0

    # AppState
    def EditingGroupId(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(94))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # AppState
    def PasteDialogShown(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(96))
        if o != 0:
            return bool(self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos))
        return False

    # AppState
    def PasteDialogData(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(98))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # AppState
    def ScaleRatioLocked(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(100))
        if o != 0:
            return bool(self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos))
        return False

    # AppState
    def DisplayAllPointDistances(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(102))
        if o != 0:
            return bool(self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos))
        return False

    # AppState
    def DisplayDistanceOnDrawing(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(104))
        if o != 0:
            return bool(self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos))
        return False

    # AppState
    def DisplayAllPointCoordinates(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(106))
        if o != 0:
            return bool(self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos))
        return False

    # AppState
    def DisplayAllPointInfoSelected(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(108))
        if o != 0:
            return bool(self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos))
        return False

    # AppState
    def DisplayRootAxis(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(110))
        if o != 0:
            return bool(self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos))
        return False

    # AppState
    def EnableLineBendingOnEdit(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(112))
        if o != 0:
            return bool(self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos))
        return False

    # AppState
    def AllowIndependentCurveHandles(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(114))
        if o != 0:
            return bool(self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos))
        return False

    # AppState
    def CoordDecimalPlaces(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(116))
        if o != 0:
            return self._tab.Get(flatbuffers.number_types.Int32Flags, o + self._tab.Pos)
        return 0

def AppStateStart(builder):
    builder.StartObject(57)

def Start(builder):
    AppStateStart(builder)

def AppStateAddActiveEmbeddableElement(builder, activeEmbeddableElement):
    builder.PrependUOffsetTRelativeSlot(0, flatbuffers.number_types.UOffsetTFlags.py_type(activeEmbeddableElement), 0)

def AddActiveEmbeddableElement(builder, activeEmbeddableElement):
    AppStateAddActiveEmbeddableElement(builder, activeEmbeddableElement)

def AppStateAddActiveEmbeddableState(builder, activeEmbeddableState):
    builder.PrependUOffsetTRelativeSlot(1, flatbuffers.number_types.UOffsetTFlags.py_type(activeEmbeddableState), 0)

def AddActiveEmbeddableState(builder, activeEmbeddableState):
    AppStateAddActiveEmbeddableState(builder, activeEmbeddableState)

def AppStateAddDraggingElement(builder, draggingElement):
    builder.PrependUOffsetTRelativeSlot(2, flatbuffers.number_types.UOffsetTFlags.py_type(draggingElement), 0)

def AddDraggingElement(builder, draggingElement):
    AppStateAddDraggingElement(builder, draggingElement)

def AppStateAddResizingElement(builder, resizingElement):
    builder.PrependUOffsetTRelativeSlot(3, flatbuffers.number_types.UOffsetTFlags.py_type(resizingElement), 0)

def AddResizingElement(builder, resizingElement):
    AppStateAddResizingElement(builder, resizingElement)

def AppStateAddMultiElement(builder, multiElement):
    builder.PrependUOffsetTRelativeSlot(4, flatbuffers.number_types.UOffsetTFlags.py_type(multiElement), 0)

def AddMultiElement(builder, multiElement):
    AppStateAddMultiElement(builder, multiElement)

def AppStateAddSelectionElement(builder, selectionElement):
    builder.PrependUOffsetTRelativeSlot(5, flatbuffers.number_types.UOffsetTFlags.py_type(selectionElement), 0)

def AddSelectionElement(builder, selectionElement):
    AppStateAddSelectionElement(builder, selectionElement)

def AppStateAddFrameToHighlight(builder, frameToHighlight):
    builder.PrependUOffsetTRelativeSlot(6, flatbuffers.number_types.UOffsetTFlags.py_type(frameToHighlight), 0)

def AddFrameToHighlight(builder, frameToHighlight):
    AppStateAddFrameToHighlight(builder, frameToHighlight)

def AppStateAddFrameRenderingEnabled(builder, frameRenderingEnabled):
    builder.PrependBoolSlot(7, frameRenderingEnabled, 0)

def AddFrameRenderingEnabled(builder, frameRenderingEnabled):
    AppStateAddFrameRenderingEnabled(builder, frameRenderingEnabled)

def AppStateAddFrameRenderingName(builder, frameRenderingName):
    builder.PrependBoolSlot(8, frameRenderingName, 0)

def AddFrameRenderingName(builder, frameRenderingName):
    AppStateAddFrameRenderingName(builder, frameRenderingName)

def AppStateAddFrameRenderingOutline(builder, frameRenderingOutline):
    builder.PrependBoolSlot(9, frameRenderingOutline, 0)

def AddFrameRenderingOutline(builder, frameRenderingOutline):
    AppStateAddFrameRenderingOutline(builder, frameRenderingOutline)

def AppStateAddFrameRenderingClip(builder, frameRenderingClip):
    builder.PrependBoolSlot(10, frameRenderingClip, 0)

def AddFrameRenderingClip(builder, frameRenderingClip):
    AppStateAddFrameRenderingClip(builder, frameRenderingClip)

def AppStateAddEditingFrame(builder, editingFrame):
    builder.PrependUOffsetTRelativeSlot(11, flatbuffers.number_types.UOffsetTFlags.py_type(editingFrame), 0)

def AddEditingFrame(builder, editingFrame):
    AppStateAddEditingFrame(builder, editingFrame)

def AppStateAddElementsToHighlight(builder, elementsToHighlight):
    builder.PrependUOffsetTRelativeSlot(12, flatbuffers.number_types.UOffsetTFlags.py_type(elementsToHighlight), 0)

def AddElementsToHighlight(builder, elementsToHighlight):
    AppStateAddElementsToHighlight(builder, elementsToHighlight)

def AppStateStartElementsToHighlightVector(builder, numElems):
    return builder.StartVector(4, numElems, 4)

def StartElementsToHighlightVector(builder, numElems):
    return AppStateStartElementsToHighlightVector(builder, numElems)

def AppStateAddEditingElement(builder, editingElement):
    builder.PrependUOffsetTRelativeSlot(13, flatbuffers.number_types.UOffsetTFlags.py_type(editingElement), 0)

def AddEditingElement(builder, editingElement):
    AppStateAddEditingElement(builder, editingElement)

def AppStateAddCurrentItemStrokeColor(builder, currentItemStrokeColor):
    builder.PrependUOffsetTRelativeSlot(14, flatbuffers.number_types.UOffsetTFlags.py_type(currentItemStrokeColor), 0)

def AddCurrentItemStrokeColor(builder, currentItemStrokeColor):
    AppStateAddCurrentItemStrokeColor(builder, currentItemStrokeColor)

def AppStateAddCurrentItemStrokePlacement(builder, currentItemStrokePlacement):
    builder.PrependInt32Slot(15, currentItemStrokePlacement, 0)

def AddCurrentItemStrokePlacement(builder, currentItemStrokePlacement):
    AppStateAddCurrentItemStrokePlacement(builder, currentItemStrokePlacement)

def AppStateAddCurrentItemBackgroundColor(builder, currentItemBackgroundColor):
    builder.PrependUOffsetTRelativeSlot(16, flatbuffers.number_types.UOffsetTFlags.py_type(currentItemBackgroundColor), 0)

def AddCurrentItemBackgroundColor(builder, currentItemBackgroundColor):
    AppStateAddCurrentItemBackgroundColor(builder, currentItemBackgroundColor)

def AppStateAddCurrentItemFillStyle(builder, currentItemFillStyle):
    builder.PrependUOffsetTRelativeSlot(17, flatbuffers.number_types.UOffsetTFlags.py_type(currentItemFillStyle), 0)

def AddCurrentItemFillStyle(builder, currentItemFillStyle):
    AppStateAddCurrentItemFillStyle(builder, currentItemFillStyle)

def AppStateAddCurrentItemStrokeWidth(builder, currentItemStrokeWidth):
    builder.PrependInt32Slot(18, currentItemStrokeWidth, 0)

def AddCurrentItemStrokeWidth(builder, currentItemStrokeWidth):
    AppStateAddCurrentItemStrokeWidth(builder, currentItemStrokeWidth)

def AppStateAddCurrentItemStrokeStyle(builder, currentItemStrokeStyle):
    builder.PrependUOffsetTRelativeSlot(19, flatbuffers.number_types.UOffsetTFlags.py_type(currentItemStrokeStyle), 0)

def AddCurrentItemStrokeStyle(builder, currentItemStrokeStyle):
    AppStateAddCurrentItemStrokeStyle(builder, currentItemStrokeStyle)

def AppStateAddCurrentItemRoughness(builder, currentItemRoughness):
    builder.PrependInt32Slot(20, currentItemRoughness, 0)

def AddCurrentItemRoughness(builder, currentItemRoughness):
    AppStateAddCurrentItemRoughness(builder, currentItemRoughness)

def AppStateAddCurrentItemOpacity(builder, currentItemOpacity):
    builder.PrependFloat32Slot(21, currentItemOpacity, 0.0)

def AddCurrentItemOpacity(builder, currentItemOpacity):
    AppStateAddCurrentItemOpacity(builder, currentItemOpacity)

def AppStateAddCurrentItemFontFamily(builder, currentItemFontFamily):
    builder.PrependUOffsetTRelativeSlot(22, flatbuffers.number_types.UOffsetTFlags.py_type(currentItemFontFamily), 0)

def AddCurrentItemFontFamily(builder, currentItemFontFamily):
    AppStateAddCurrentItemFontFamily(builder, currentItemFontFamily)

def AppStateAddCurrentItemFontSize(builder, currentItemFontSize):
    builder.PrependInt32Slot(23, currentItemFontSize, 0)

def AddCurrentItemFontSize(builder, currentItemFontSize):
    AppStateAddCurrentItemFontSize(builder, currentItemFontSize)

def AppStateAddCurrentItemTextAlign(builder, currentItemTextAlign):
    builder.PrependUOffsetTRelativeSlot(24, flatbuffers.number_types.UOffsetTFlags.py_type(currentItemTextAlign), 0)

def AddCurrentItemTextAlign(builder, currentItemTextAlign):
    AppStateAddCurrentItemTextAlign(builder, currentItemTextAlign)

def AppStateAddCurrentItemStartArrowhead(builder, currentItemStartArrowhead):
    builder.PrependUOffsetTRelativeSlot(25, flatbuffers.number_types.UOffsetTFlags.py_type(currentItemStartArrowhead), 0)

def AddCurrentItemStartArrowhead(builder, currentItemStartArrowhead):
    AppStateAddCurrentItemStartArrowhead(builder, currentItemStartArrowhead)

def AppStateAddCurrentItemEndArrowhead(builder, currentItemEndArrowhead):
    builder.PrependUOffsetTRelativeSlot(26, flatbuffers.number_types.UOffsetTFlags.py_type(currentItemEndArrowhead), 0)

def AddCurrentItemEndArrowhead(builder, currentItemEndArrowhead):
    AppStateAddCurrentItemEndArrowhead(builder, currentItemEndArrowhead)

def AppStateAddCurrentItemRoundness(builder, currentItemRoundness):
    builder.PrependUOffsetTRelativeSlot(27, flatbuffers.number_types.UOffsetTFlags.py_type(currentItemRoundness), 0)

def AddCurrentItemRoundness(builder, currentItemRoundness):
    AppStateAddCurrentItemRoundness(builder, currentItemRoundness)

def AppStateAddViewBackgroundColor(builder, viewBackgroundColor):
    builder.PrependUOffsetTRelativeSlot(28, flatbuffers.number_types.UOffsetTFlags.py_type(viewBackgroundColor), 0)

def AddViewBackgroundColor(builder, viewBackgroundColor):
    AppStateAddViewBackgroundColor(builder, viewBackgroundColor)

def AppStateAddScope(builder, scope):
    builder.PrependUOffsetTRelativeSlot(29, flatbuffers.number_types.UOffsetTFlags.py_type(scope), 0)

def AddScope(builder, scope):
    AppStateAddScope(builder, scope)

def AppStateAddWritingLayer(builder, writingLayer):
    builder.PrependUOffsetTRelativeSlot(30, flatbuffers.number_types.UOffsetTFlags.py_type(writingLayer), 0)

def AddWritingLayer(builder, writingLayer):
    AppStateAddWritingLayer(builder, writingLayer)

def AppStateAddGroups(builder, groups):
    builder.PrependUOffsetTRelativeSlot(31, flatbuffers.number_types.UOffsetTFlags.py_type(groups), 0)

def AddGroups(builder, groups):
    AppStateAddGroups(builder, groups)

def AppStateStartGroupsVector(builder, numElems):
    return builder.StartVector(4, numElems, 4)

def StartGroupsVector(builder, numElems):
    return AppStateStartGroupsVector(builder, numElems)

def AppStateAddScrollX(builder, scrollX):
    builder.PrependFloat32Slot(32, scrollX, 0.0)

def AddScrollX(builder, scrollX):
    AppStateAddScrollX(builder, scrollX)

def AppStateAddScrollY(builder, scrollY):
    builder.PrependFloat32Slot(33, scrollY, 0.0)

def AddScrollY(builder, scrollY):
    AppStateAddScrollY(builder, scrollY)

def AppStateAddCursorButton(builder, cursorButton):
    builder.PrependUOffsetTRelativeSlot(34, flatbuffers.number_types.UOffsetTFlags.py_type(cursorButton), 0)

def AddCursorButton(builder, cursorButton):
    AppStateAddCursorButton(builder, cursorButton)

def AppStateAddScrolledOutside(builder, scrolledOutside):
    builder.PrependBoolSlot(35, scrolledOutside, 0)

def AddScrolledOutside(builder, scrolledOutside):
    AppStateAddScrolledOutside(builder, scrolledOutside)

def AppStateAddName(builder, name):
    builder.PrependUOffsetTRelativeSlot(36, flatbuffers.number_types.UOffsetTFlags.py_type(name), 0)

def AddName(builder, name):
    AppStateAddName(builder, name)

def AppStateAddZoom(builder, zoom):
    builder.PrependFloat32Slot(37, zoom, 0.0)

def AddZoom(builder, zoom):
    AppStateAddZoom(builder, zoom)

def AppStateAddLastPointerDownWith(builder, lastPointerDownWith):
    builder.PrependUOffsetTRelativeSlot(38, flatbuffers.number_types.UOffsetTFlags.py_type(lastPointerDownWith), 0)

def AddLastPointerDownWith(builder, lastPointerDownWith):
    AppStateAddLastPointerDownWith(builder, lastPointerDownWith)

def AppStateAddSelectedElementIds(builder, selectedElementIds):
    builder.PrependUOffsetTRelativeSlot(39, flatbuffers.number_types.UOffsetTFlags.py_type(selectedElementIds), 0)

def AddSelectedElementIds(builder, selectedElementIds):
    AppStateAddSelectedElementIds(builder, selectedElementIds)

def AppStateStartSelectedElementIdsVector(builder, numElems):
    return builder.StartVector(4, numElems, 4)

def StartSelectedElementIdsVector(builder, numElems):
    return AppStateStartSelectedElementIdsVector(builder, numElems)

def AppStateAddPreviousSelectedElementIds(builder, previousSelectedElementIds):
    builder.PrependUOffsetTRelativeSlot(40, flatbuffers.number_types.UOffsetTFlags.py_type(previousSelectedElementIds), 0)

def AddPreviousSelectedElementIds(builder, previousSelectedElementIds):
    AppStateAddPreviousSelectedElementIds(builder, previousSelectedElementIds)

def AppStateStartPreviousSelectedElementIdsVector(builder, numElems):
    return builder.StartVector(4, numElems, 4)

def StartPreviousSelectedElementIdsVector(builder, numElems):
    return AppStateStartPreviousSelectedElementIdsVector(builder, numElems)

def AppStateAddSelectedElementsAreBeingDragged(builder, selectedElementsAreBeingDragged):
    builder.PrependBoolSlot(41, selectedElementsAreBeingDragged, 0)

def AddSelectedElementsAreBeingDragged(builder, selectedElementsAreBeingDragged):
    AppStateAddSelectedElementsAreBeingDragged(builder, selectedElementsAreBeingDragged)

def AppStateAddShouldCacheIgnoreZoom(builder, shouldCacheIgnoreZoom):
    builder.PrependBoolSlot(42, shouldCacheIgnoreZoom, 0)

def AddShouldCacheIgnoreZoom(builder, shouldCacheIgnoreZoom):
    AppStateAddShouldCacheIgnoreZoom(builder, shouldCacheIgnoreZoom)

def AppStateAddGridSize(builder, gridSize):
    builder.PrependInt32Slot(43, gridSize, 0)

def AddGridSize(builder, gridSize):
    AppStateAddGridSize(builder, gridSize)

def AppStateAddSelectedGroupIds(builder, selectedGroupIds):
    builder.PrependUOffsetTRelativeSlot(44, flatbuffers.number_types.UOffsetTFlags.py_type(selectedGroupIds), 0)

def AddSelectedGroupIds(builder, selectedGroupIds):
    AppStateAddSelectedGroupIds(builder, selectedGroupIds)

def AppStateStartSelectedGroupIdsVector(builder, numElems):
    return builder.StartVector(4, numElems, 4)

def StartSelectedGroupIdsVector(builder, numElems):
    return AppStateStartSelectedGroupIdsVector(builder, numElems)

def AppStateAddEditingGroupId(builder, editingGroupId):
    builder.PrependUOffsetTRelativeSlot(45, flatbuffers.number_types.UOffsetTFlags.py_type(editingGroupId), 0)

def AddEditingGroupId(builder, editingGroupId):
    AppStateAddEditingGroupId(builder, editingGroupId)

def AppStateAddPasteDialogShown(builder, pasteDialogShown):
    builder.PrependBoolSlot(46, pasteDialogShown, 0)

def AddPasteDialogShown(builder, pasteDialogShown):
    AppStateAddPasteDialogShown(builder, pasteDialogShown)

def AppStateAddPasteDialogData(builder, pasteDialogData):
    builder.PrependUOffsetTRelativeSlot(47, flatbuffers.number_types.UOffsetTFlags.py_type(pasteDialogData), 0)

def AddPasteDialogData(builder, pasteDialogData):
    AppStateAddPasteDialogData(builder, pasteDialogData)

def AppStateAddScaleRatioLocked(builder, scaleRatioLocked):
    builder.PrependBoolSlot(48, scaleRatioLocked, 0)

def AddScaleRatioLocked(builder, scaleRatioLocked):
    AppStateAddScaleRatioLocked(builder, scaleRatioLocked)

def AppStateAddDisplayAllPointDistances(builder, displayAllPointDistances):
    builder.PrependBoolSlot(49, displayAllPointDistances, 0)

def AddDisplayAllPointDistances(builder, displayAllPointDistances):
    AppStateAddDisplayAllPointDistances(builder, displayAllPointDistances)

def AppStateAddDisplayDistanceOnDrawing(builder, displayDistanceOnDrawing):
    builder.PrependBoolSlot(50, displayDistanceOnDrawing, 0)

def AddDisplayDistanceOnDrawing(builder, displayDistanceOnDrawing):
    AppStateAddDisplayDistanceOnDrawing(builder, displayDistanceOnDrawing)

def AppStateAddDisplayAllPointCoordinates(builder, displayAllPointCoordinates):
    builder.PrependBoolSlot(51, displayAllPointCoordinates, 0)

def AddDisplayAllPointCoordinates(builder, displayAllPointCoordinates):
    AppStateAddDisplayAllPointCoordinates(builder, displayAllPointCoordinates)

def AppStateAddDisplayAllPointInfoSelected(builder, displayAllPointInfoSelected):
    builder.PrependBoolSlot(52, displayAllPointInfoSelected, 0)

def AddDisplayAllPointInfoSelected(builder, displayAllPointInfoSelected):
    AppStateAddDisplayAllPointInfoSelected(builder, displayAllPointInfoSelected)

def AppStateAddDisplayRootAxis(builder, displayRootAxis):
    builder.PrependBoolSlot(53, displayRootAxis, 0)

def AddDisplayRootAxis(builder, displayRootAxis):
    AppStateAddDisplayRootAxis(builder, displayRootAxis)

def AppStateAddEnableLineBendingOnEdit(builder, enableLineBendingOnEdit):
    builder.PrependBoolSlot(54, enableLineBendingOnEdit, 0)

def AddEnableLineBendingOnEdit(builder, enableLineBendingOnEdit):
    AppStateAddEnableLineBendingOnEdit(builder, enableLineBendingOnEdit)

def AppStateAddAllowIndependentCurveHandles(builder, allowIndependentCurveHandles):
    builder.PrependBoolSlot(55, allowIndependentCurveHandles, 0)

def AddAllowIndependentCurveHandles(builder, allowIndependentCurveHandles):
    AppStateAddAllowIndependentCurveHandles(builder, allowIndependentCurveHandles)

def AppStateAddCoordDecimalPlaces(builder, coordDecimalPlaces):
    builder.PrependInt32Slot(56, coordDecimalPlaces, 0)

def AddCoordDecimalPlaces(builder, coordDecimalPlaces):
    AppStateAddCoordDecimalPlaces(builder, coordDecimalPlaces)

def AppStateEnd(builder):
    return builder.EndObject()

def End(builder):
    return AppStateEnd(builder)