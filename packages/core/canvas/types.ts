import React from "react";
import {
  PointerType,
  DucLinearElement,
  NonDeletedDucElement,
  NonDeleted,
  TextAlign,
  DucElement,
  GroupId,
  DucBindableElement,
  Arrowhead,
  ChartType,
  FontFamilyValues,
  FileId,
  DucImageElement,
  Theme,
  StrokeRoundness,
  DucEmbeddableElement,
  DucMagicFrameElement,
  DucFrameLikeElement,
  DucElementType,
  DucIframeLikeElement,
  DucGroup,
  DucNonSelectionElement,
  OrderedDucElement,
} from "./element/types";
import { Action } from "./actions/types";
import { LinearElementEditor } from "./element/linearElementEditor";
import { SuggestedBinding } from "./element/binding";
import { ImportedDataState } from "./data/types";
import type App from "./components/App";
import type { throttleRAF } from "./utils";
import { Spreadsheet } from "./charts";
import { Language } from "./i18n";
import { ClipboardData } from "./clipboard";
import { isOverScrollBars } from "./scene/scrollbars";
import { MaybeTransformHandleType } from "./element/transformHandles";
import Library from "./data/library";
import type { FileSystemHandle } from "./data/filesystem";
import type { BEZIER_MIRRORING, IMAGE_MIME_TYPES, MIME_TYPES } from "./constants";
import { SnapLine } from "./snapping";
import { Merge, MaybePromise, ValueOf, MakeBrand, Mutable } from "./utility-types";
import { SupportedMeasures } from "./duc/utils/measurements";
import { StoreActionType } from "./store";
import { ElementUpdate } from "./element/mutateElement";
import Scene from "./scene/Scene";


export interface BezierHandle {
  x: number;
  y: number;
}

export type BezierMirroring = ValueOf<typeof BEZIER_MIRRORING>;
export interface Point {
  x: number;
  y: number;
  isCurve?: boolean; // defaults to false
  mirroring?: BezierMirroring;
  borderRadius?: number; // Defaults to the Element's borderRadius
  handleIn?: BezierHandle;
  handleOut?: BezierHandle;
}

export type SocketId = string & { _brand: "SocketId" };


export type Collaborator = Readonly<{
  pointer?: CollaboratorPointer;
  button?: "up" | "down";
  selectedElementIds?: AppState["selectedElementIds"];
  username?: string | null;
  userState?: UserIdleState;
  color?: {
    background: string;
    stroke: string;
  };
  // The url of the collaborator's avatar, defaults to username initials
  // if not present
  avatarUrl?: string;
  // user id. If supplied, we'll filter out duplicates when rendering user avatars.
  id?: string;
  socketId?: SocketId;
  isCurrentUser?: boolean;
  isInCall?: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
}>;

export type CollaboratorPointer = {
  x: number;
  y: number;
  tool: "pointer" | "laser";
  /**
   * Whether to render cursor + username. Useful when you only want to render
   * laser trail.
   *
   * @default true
   */
  renderCursor?: boolean;
  /**
   * Explicit laser color.
   *
   * @default string collaborator's cursor color
   */
  laserColor?: string;
};

export type DataURL = string & { _brand: "DataURL" };


export type ObservedAppState = ObservedStandaloneAppState &
  ObservedElementsAppState;

export type ObservedStandaloneAppState = {
  name: AppState["name"];
  viewBackgroundColor: AppState["viewBackgroundColor"];
};

export type ObservedElementsAppState = {
  editingGroupId: AppState["editingGroupId"];
  selectedElementIds: AppState["selectedElementIds"];
  selectedGroupIds: AppState["selectedGroupIds"];
  // Avoiding storing whole instance, as it could lead into state incosistencies, empty undos/redos and etc.
  editingLinearElementId: LinearElementEditor["elementId"] | null;
  // Right now it's coupled to `editingLinearElement`, ideally it should not be really needed as we already have selectedElementIds & editingLinearElementId
  selectedLinearElementId: LinearElementEditor["elementId"] | null;
};

export type BinaryFileData = {
  mimeType:
    | ValueOf<typeof IMAGE_MIME_TYPES>
    // future user or unknown file type
    | typeof MIME_TYPES.binary;
  id: FileId;
  dataURL: DataURL;
  /**
   * Epoch timestamp in milliseconds
   */
  created: number;
  /**
   * Indicates when the file was last retrieved from storage to be loaded
   * onto the scene. We use this flag to determine whether to delete unused
   * files from storage.
   *
   * Epoch timestamp in milliseconds.
   */
  lastRetrieved?: number;
  /**
   * indicates the version of the file. This can be used to determine whether
   * the file dataURL has changed e.g. as part of restore due to schema update.
   */
  version?: number;
};

export type BinaryFileMetadata = Omit<BinaryFileData, "dataURL">;

export type BinaryFiles = Record<DucElement["id"], BinaryFileData>;

export type ToolType =
  | "selection"
  | "rectangle"
  | "diamond"
  | "ellipse"
  | "arrow"
  | "line"
  | "freedraw"
  | "text"
  | "image"
  | "eraser"
  | "hand"
  | "frame"
  | "magicframe"
  | "embeddable"
  | "ruler"
  | "laser";

export type ElementOrToolType = DucElementType | ToolType | "custom";

export type ActiveTool =
  | {
      type: ToolType;
      customType: null;
    }
  | {
      type: "custom";
      customType: string;
    };

export type SidebarName = string;
export type SidebarTabName = string;

export type UserToFollow = {
  socketId: SocketId;
  username: string;
};

type _CommonCanvasAppState = {
  zoom: AppState["zoom"];
  scrollX: AppState["scrollX"];
  scrollY: AppState["scrollY"];
  width: AppState["width"];
  height: AppState["height"];
  viewModeEnabled: AppState["viewModeEnabled"];
  editingGroupId: AppState["editingGroupId"]; // TODO: move to interactive canvas if possible
  selectedElementIds: AppState["selectedElementIds"]; // TODO: move to interactive canvas if possible
  frameToHighlight: AppState["frameToHighlight"]; // TODO: move to interactive canvas if possible
  offsetLeft: AppState["offsetLeft"];
  offsetTop: AppState["offsetTop"];
  theme: AppState["theme"];
  pendingImageElementId: AppState["pendingImageElementId"];
};

export type StaticCanvasAppState = Readonly<
  _CommonCanvasAppState & {
    shouldCacheIgnoreZoom: AppState["shouldCacheIgnoreZoom"];
    /** null indicates transparent bg */
    viewBackgroundColor: AppState["viewBackgroundColor"] | null;
    scope: AppState["scope"];
    groups: AppState["groups"];
    exportScale: AppState["exportScale"];
    selectedElementsAreBeingDragged: AppState["selectedElementsAreBeingDragged"];
    gridSize: AppState["gridSize"];
    gridStep: AppState["gridStep"];
    frameRendering: AppState["frameRendering"];
    currentHoveredFontFamily: AppState["currentHoveredFontFamily"];
    displayDistanceOnDrawing: AppState["displayDistanceOnDrawing"];
    displayAllPointDistances: AppState["displayAllPointDistances"];
    displayAllPointCoordinates: AppState["displayAllPointCoordinates"];
    displayAllPointInfoSelected: AppState["displayAllPointInfoSelected"];
    displayRootAxis: AppState["displayRootAxis"];
    coordDecimalPlaces: AppState["coordDecimalPlaces"];
    newElement: AppState["newElement"];
  }
>;

export type InteractiveCanvasAppState = Readonly<
  _CommonCanvasAppState & {
    // renderInteractiveScene
    activeEmbeddable: AppState["activeEmbeddable"];
    editingLinearElement: AppState["editingLinearElement"];
    selectionElement: AppState["selectionElement"];
    scope: AppState["scope"];
    selectedGroupIds: AppState["selectedGroupIds"];
    selectedLinearElement: AppState["selectedLinearElement"];
    multiElement: AppState["multiElement"];
    isBindingEnabled: AppState["isBindingEnabled"];
    suggestedBindings: AppState["suggestedBindings"];
    isRotating: AppState["isRotating"];
    elementsToHighlight: AppState["elementsToHighlight"];
    // Collaborators
    collaborators: AppState["collaborators"];
    // SnapLines
    snapLines: AppState["snapLines"];
    zenModeEnabled: AppState["zenModeEnabled"];
    editingTextElement: AppState["editingTextElement"];
    elementHovered: AppState["elementHovered"];
    selectionDirection: AppState["selectionDirection"];
    activeTool: AppState["activeTool"];
  }
>;

export interface Ducfig { // User's Config of AppState
	activeTool: {
			/**
			 * indicates a previous tool we should revert back to if we deselect the
			 * currently active tool. At the moment applies to `eraser` and `hand` tool.
			 */
			lastActiveTool: ActiveTool | null;
			locked: boolean;
	} & ActiveTool;
	penMode: boolean;
	penDetected: boolean;
	exportBackground: boolean;
	exportEmbedScene: boolean;
	exportWithDarkMode: boolean;
	exportScale: number;
      
  gridModeEnabled: boolean;
  viewModeEnabled: boolean; // Don't Save
  zenModeEnabled: boolean; // Don't Save
  showStats: boolean; // Don't Save

  showHyperlinkPopup: false | "info" | "editor";
  objectsSnapModeEnabled: boolean;
}

export interface AppState extends Ducfig {
  contextMenu: {
    items: {};
    top: number;
    left: number;
  } | null; 
  showWelcomeScreen: boolean;
  isLoading: boolean;
  errorMessage: React.ReactNode;
  activeEmbeddable: {
    element: NonDeletedDucElement;
    state: "hover" | "active";
  } | null;
    /**
   * for a newly created element
   * - set on pointer down, updated during pointer move, used on pointer up
   */
  newElement: NonDeleted<DucNonSelectionElement> | null;
  /**
   * for a single element that's being resized
   * - set on pointer down when it's selected and the active tool is selection
   */
  resizingElement: NonDeletedDucElement | null;
  /**
   * multiElement is for multi-point linear element that's created by clicking as opposed to dragging
   * - when set and present, the editor will handle linear element creation logic accordingly
   */
  multiElement: NonDeleted<DucLinearElement> | null;
  /**
   * decoupled from newElement, dragging selection only creates selectionElement
   * - set on pointer down, updated during pointer move
   */
  draggingElement: NonDeletedDucElement | null;
  selectionElement: NonDeletedDucElement | null;
  isBindingEnabled: boolean;
  startBoundElement: NonDeleted<DucBindableElement> | null;
  suggestedBindings: SuggestedBinding[];
  frameToHighlight: NonDeleted<DucFrameLikeElement> | null;
  frameRendering: {
    enabled: boolean;
    name: boolean;
    outline: boolean;
    clip: boolean;
  };
  editingFrame: string | null;
  elementsToHighlight: NonDeleted<DucElement>[] | null;
  // element being edited, but not necessarily added to elements array yet
  // (e.g. text element when typing into the input)
  elementHovered: NonDeleted<DucElement> | null;
  editingElement: NonDeletedDucElement | null;
  editingTextElement: NonDeletedDucElement | null;
  editingLinearElement: LinearElementEditor | null;
  viewBackgroundColor: string;
  scope: SupportedMeasures,
  groups: DucGroup[];
  scrollX: number;
  scrollY: number;
  cursorButton: "up" | "down";
  scrolledOutside: boolean;
  name: string | null;
  isResizing: boolean;
  isRotating: boolean;
  zoom: Zoom;
  openMenu: "canvas" | "shape" | null;
  openPopup: "canvasBackground" | "elementBackground" | "elementStroke" | null; // Out of the Binary
  openSidebar: { name: SidebarName; tab?: SidebarTabName } | null; // Out of the Binary
  openDialog:
    | null
    | { name: "imageExport" | "help" | "jsonExport" }
    | {
        name: "settings";
        source:
          | "tool" // when magicframe tool is selected
          | "generation" // when magicframe generate button is clicked
          | "settings"; // when AI settings dialog is explicitly invoked
        tab: "text-to-diagram" | "diagram-to-code";
      }
    | { name: "ttd"; tab: "text-to-diagram" | "mermaid" }; // Out of the Binary
  /**
   * Reflects user preference for whether the default sidebar should be docked.
   *
   * NOTE this is only a user preference and does not reflect the actual docked
   * state of the sidebar, because the host apps can override this through
   * a DefaultSidebar prop, which is not reflected back to the appState.
   */
  defaultSidebarDockedPreference: boolean;  // Out of the Binary
	currentItemStrokeColor: string;
	currentItemBackgroundColor: string;
	currentItemFillStyle: DucElement["fillStyle"];
	currentItemStrokeWidth: number;
  currentItemStrokePlacement: DucElement["strokePlacement"];
	currentItemStrokeStyle: DucElement["strokeStyle"];
	currentItemRoughness: number;
	currentItemOpacity: number;
	currentItemFontFamily: FontFamilyValues;
	currentItemFontSize: number;
	currentHoveredFontFamily: FontFamilyValues | null;
	currentItemTextAlign: TextAlign;
	currentItemStartArrowhead: Arrowhead | null;
	currentItemEndArrowhead: Arrowhead | null;
	currentItemArrowType: "sharp" | "round" | "elbow";
	currentItemRoundness: StrokeRoundness;

  lastPointerDownWith: PointerType;
  selectedElementIds: Readonly<{ [id: string]: true }>;
  previousSelectedElementIds: { [id: string]: true };
  selectedElementsAreBeingDragged: boolean;
  shouldCacheIgnoreZoom: boolean;
  toast: { message: string; closable?: boolean; duration?: number } | null; // Out of the Binary
  theme: Theme; // Is Always overridden on load
  /** grid cell px size */
  gridSize: number;
  gridStep: number;

  /** top-most selected groups (i.e. does not include nested groups) */
  selectedGroupIds: { [groupId: string]: boolean };
  /** group being edited when you drill down to its constituent element
    (e.g. when you double-click on a group's element) */
  editingGroupId: GroupId | null;
  width: number;
  height: number;
  offsetTop: number;
  offsetLeft: number;

  fileHandle: FileSystemHandle | null;
  collaborators: Map<SocketId, Collaborator>;
  currentChartType: ChartType; // Out of the Binary
  pasteDialog:
    | {
        shown: false;
        data: null;
      }
    | {
        shown: true;
        data: Spreadsheet;
      };
  /** imageElement waiting to be placed on canvas */
  pendingImageElementId: DucImageElement["id"] | null;
  selectedLinearElement: LinearElementEditor | null; // Out of the Binary
  snapLines: readonly SnapLine[]; // Out of the Binary
  originSnapOffset: {
    x: number;
    y: number;
  } | null;
  /** the user's clientId & username who is being followed on the canvas */
  userToFollow: UserToFollow | null;
  /** the clientIds of the users following the current user */
  followedBy: Set<SocketId>;

  scaleRatioLocked: boolean;
  displayAllPointDistances: boolean;
  displayDistanceOnDrawing: boolean;
  displayAllPointCoordinates: boolean;
  displayAllPointInfoSelected: boolean;
    
  coordDecimalPlaces: number;

  displayRootAxis: boolean;
  selectionDirection: 'left' | 'right' | null;
  lineBendingMode: boolean;
}

export type UIAppState = Omit<
  AppState,
  | "suggestedBindings"
  | "startBoundElement"
  | "cursorButton"
  | "scrollX"
  | "scrollY"
>;

export type NormalizedZoomValue = number & { _brand: "normalizedZoom" };

export type Zoom = Readonly<{
  value: NormalizedZoomValue;
}>;

export type PointerCoords = Readonly<{
  x: number;
  y: number;
}>;

export type Gesture = {
  pointers: Map<number, PointerCoords>;
  lastCenter: { x: number; y: number } | null;
  initialDistance: number | null;
  initialScale: number | null;
};

export declare class GestureEvent extends UIEvent {
  readonly rotation: number;
  readonly scale: number;
}

// libraries
// -----------------------------------------------------------------------------
/** @deprecated legacy: do not use outside of migration paths */
export type LibraryItem_v1 = readonly NonDeleted<DucElement>[];
/** @deprecated legacy: do not use outside of migration paths */
type LibraryItems_v1 = readonly LibraryItem_v1[];

/** v2 library item */
export type LibraryItem = {
  id: string;
  status: "published" | "unpublished";
  elements: readonly NonDeleted<DucElement>[];
  /** timestamp in epoch (ms) */
  created: number;
  name?: string;
  error?: string;
};
export type LibraryItems = readonly LibraryItem[];
export type LibraryItems_anyVersion = LibraryItems | LibraryItems_v1;

export type LibraryItemsSource =
  | ((
      currentLibraryItems: LibraryItems,
    ) => MaybePromise<LibraryItems_anyVersion | Blob>)
  | MaybePromise<LibraryItems_anyVersion | Blob>;
// -----------------------------------------------------------------------------

export type ExcalidrawInitialDataState = Merge<
  ImportedDataState,
  {
    libraryItems?: MaybePromise<Required<ImportedDataState>["libraryItems"]>;
  }
>;

export type OnUserFollowedPayload = {
  userToFollow: UserToFollow;
  action: "FOLLOW" | "UNFOLLOW";
};

export interface ExcalidrawProps {
  onChange?: (
    elements: readonly OrderedDucElement[],
    appState: AppState,
    files: BinaryFiles,
  ) => void;
  initialData?:
  | (() => MaybePromise<ExcalidrawInitialDataState | null>)
  | MaybePromise<ExcalidrawInitialDataState | null>;
  ducAPI?: (api: DucImperativeAPI) => void;
  isCollaborating?: boolean;
  onPointerUpdate?: (payload: {
    pointer: { x: number; y: number; tool: "pointer" | "laser" };
    button: "down" | "up";
    pointersMap: Gesture["pointers"];
  }) => void;
  onPaste?: (
    data: ClipboardData,
    event: ClipboardEvent | null,
  ) => Promise<boolean> | boolean;
  renderTopRightUI?: (
    isMobile: boolean,
    appState: UIAppState,
  ) => React.ReactElement | null;
  langCode?: Language["code"];
  viewModeEnabled?: boolean;
  zenModeEnabled?: boolean;
  gridModeEnabled?: boolean;
  objectsSnapModeEnabled?: boolean;
  libraryReturnUrl?: string;
  theme?: Theme;
  // @TODO come with better API before v0.18.0
  name?: string;
  renderCustomStats?: (
    elements: readonly NonDeletedDucElement[],
    appState: UIAppState,
  ) => React.ReactElement;
  UIOptions?: Partial<UIOptions>;
  detectScroll?: boolean;
  handleKeyboardGlobally?: boolean;
  onLibraryChange?: (libraryItems: LibraryItems) => void | Promise<any>;
  autoFocus?: boolean;
  generateIdForFile?: (file: File) => string | Promise<string>;
  onLinkOpen?: (
    element: NonDeletedDucElement,
    event: CustomEvent<{
      nativeEvent: MouseEvent | React.PointerEvent<HTMLCanvasElement>;
    }>,
  ) => void;
  onPointerDown?: (
    activeTool: AppState["activeTool"],
    pointerDownState: PointerDownState,
  ) => void;
  onPointerUp?: (
    activeTool: AppState["activeTool"],
    pointerDownState: PointerDownState,
  ) => void;
  onScrollChange?: (scrollX: number, scrollY: number, zoom: Zoom) => void;
  onUserFollow?: (payload: OnUserFollowedPayload) => void;
  children?: React.ReactNode;
  validateEmbeddable?:
    | boolean
    | string[]
    | RegExp
    | RegExp[]
    | ((link: string) => boolean | undefined);
  renderEmbeddable?: (
    element: NonDeleted<DucEmbeddableElement>,
    appState: AppState,
  ) => React.ReactElement | null;
  aiEnabled?: boolean;
  showDeprecatedFonts?: boolean;
}

export type SceneData = {
  elements?: ImportedDataState["elements"];
  appState?: ImportedDataState["appState"];
  collaborators?: Map<SocketId, Collaborator>;
  storeAction?: StoreActionType;
};

export enum UserIdleState {
  ACTIVE = "active",
  AWAY = "away",
  IDLE = "idle",
}

export type ExportOpts = {
  saveFileToDisk?: boolean;
  onExportToBackend?: (
    exportedElements: readonly NonDeletedDucElement[],
    appState: UIAppState,
    files: BinaryFiles,
  ) => void;
  renderCustomUI?: (
    exportedElements: readonly NonDeletedDucElement[],
    appState: UIAppState,
    files: BinaryFiles,
    canvas: HTMLCanvasElement,
  ) => React.ReactElement;
};

// NOTE at the moment, if action name corresponds to canvasAction prop, its
// truthiness value will determine whether the action is rendered or not
// (see manager renderAction). We also override canvasAction values in
// Excalidraw package index.tsx.
export type CanvasActions = Partial<{
  changeViewBackgroundColor: boolean;
  clearCanvas: boolean;
  export: false | ExportOpts;
  loadScene: boolean;
  saveToActiveFile: boolean;
  toggleTheme: boolean | null;
  saveAsImage: boolean;
}>;

export type UIOptions = Partial<{
  dockedSidebarBreakpoint: number;
  canvasActions: CanvasActions;
  tools: {
    image: boolean;
  };
  /** @deprecated does nothing. Will be removed in 0.15 */
  welcomeScreen?: boolean;
}>;

export type AppProps = Merge<
  ExcalidrawProps,
  {
    UIOptions: Merge<
      UIOptions,
      {
        canvasActions: Required<CanvasActions> & { export: ExportOpts };
      }
    >;
    detectScroll: boolean;
    handleKeyboardGlobally: boolean;
    isCollaborating: boolean;
    children?: React.ReactNode;
    aiEnabled: boolean;
  }
>;

/** A subset of App class properties that we need to use elsewhere
 * in the app, eg Manager. Factored out into a separate type to keep DRY. */
export type AppClassProperties = {
  props: AppProps;
  state: AppState;
  interactiveCanvas: HTMLCanvasElement | null;
  /** static canvas */
  canvas: HTMLCanvasElement;
  focusContainer(): void;
  library: Library;
  imageCache: Map<
    FileId,
    {
      image: HTMLImageElement | Promise<HTMLImageElement>;
      mimeType: ValueOf<typeof IMAGE_MIME_TYPES>;
    }
  >;
  files: BinaryFiles;
  device: App["device"];
  scene: App["scene"];
  syncActionResult: App["syncActionResult"];
  fonts: App["fonts"];
  pasteFromClipboard: App["pasteFromClipboard"];
  id: App["id"];
  onInsertElements: App["onInsertElements"];
  onExportImage: App["onExportImage"];
  lastViewportPosition: App["lastViewportPosition"];
  scrollToContent: App["scrollToContent"];
  addFiles: App["addFiles"];
  addElementsFromPasteOrLibrary: App["addElementsFromPasteOrLibrary"];
  togglePenMode: App["togglePenMode"];
  updateGroups: App["updateGroups"];
  toggleLock: App["toggleLock"];
  setActiveTool: App["setActiveTool"];
  setOpenDialog: App["setOpenDialog"];
  insertEmbeddableElement: App["insertEmbeddableElement"];
  onMagicframeToolSelect: App["onMagicframeToolSelect"];
  getName: App["getName"];
  dismissLinearEditor: App["dismissLinearEditor"];
  flowChartCreator: App["flowChartCreator"];
  getEffectiveGridSize: App["getEffectiveGridSize"];
  closeEyeDropper: App["closeEyeDropper"];
  openEyeDropper: App["openEyeDropper"];
  getEyeDropper: App["getEyeDropper"];
  rerenderCanvas: App["rerenderCanvas"];
  setAppState: App["setAppState"];
  // setPlugins: App["setPlugins"];
  // plugins: App["plugins"];
};

export type PointerDownState = Readonly<{
  // The first position at which pointerDown happened
  origin: Readonly<{ x: number; y: number }>;
  // Same as "origin" but snapped to the grid, if grid is on
  originInGrid: Readonly<{ x: number; y: number }>;
  // Scrollbar checks
  scrollbars: ReturnType<typeof isOverScrollBars>;
  // The previous pointer position
  lastCoords: { x: number; y: number };
  // map of original elements data
  originalElements: Map<string, NonDeleted<DucElement>>;
  resize: {
    // Handle when resizing, might change during the pointer interaction
    handleType: MaybeTransformHandleType;
    // This is determined on the initial pointer down event
    isResizing: boolean;
    // This is determined on the initial pointer down event
    offset: { x: number; y: number };
    // This is determined on the initial pointer down event
    arrowDirection: "origin" | "end";
    // This is a center point of selected elements determined on the initial pointer down event (for rotation only)
    center: { x: number; y: number };
  };
  hit: {
    // The element the pointer is "hitting", is determined on the initial
    // pointer down event
    element: NonDeleted<DucElement> | null;
    // The elements the pointer is "hitting", is determined on the initial
    // pointer down event
    allHitElements: NonDeleted<DucElement>[];
    // This is determined on the initial pointer down event
    wasAddedToSelection: boolean;
    // Whether selected element(s) were duplicated, might change during the
    // pointer interaction
    hasBeenDuplicated: boolean;
    hasHitCommonBoundingBoxOfSelectedElements: boolean;
  };
  withCmdOrCtrl: boolean;
  drag: {
    // Might change during the pointer interaction
    hasOccurred: boolean;
    // Might change during the pointer interaction
    offset: { x: number; y: number } | null;
  };
  // We need to have these in the state so that we can unsubscribe them
  eventListeners: {
    // It's defined on the initial pointer down event
    onMove: null | ReturnType<typeof throttleRAF>;
    // It's defined on the initial pointer down event
    onUp: null | ((event: PointerEvent) => void);
    // It's defined on the initial pointer down event
    onKeyDown: null | ((event: KeyboardEvent) => void);
    // It's defined on the initial pointer down event
    onKeyUp: null | ((event: KeyboardEvent) => void);
  };
  boxSelection: {
    hasOccurred: boolean;
  };
}>;

export type UnsubscribeCallback = () => void;

export interface DucImperativeAPI {
  history: {
    clear: InstanceType<typeof App>["resetHistory"];
    undo: () => any;
    redo: InstanceType<typeof App>["redo"];
  };
  files: {
    exportToDucJSON: InstanceType<typeof App>["exportToDucJSON"];
    exportToDucBin: InstanceType<typeof App>["exportToDucBin"];
    exportToPng: InstanceType<typeof App>["exportToPng"];
    exportToSvg: InstanceType<typeof App>["exportToSvg"];
    openFile: InstanceType<typeof App>["openFile"];
  };
  canvas: {
    resetScene: InstanceType<typeof App>["resetScene"];
    rerender: InstanceType<typeof App>["rerenderCanvas"];
    rerenderImages: InstanceType<typeof App>["rerenderImages"];
    updateScene: InstanceType<typeof App>["updateScene"];
    scrollToContent: InstanceType<typeof App>["scrollToContent"];
    scrollToRoot: InstanceType<typeof App>["scrollToRoot"];
    toggleSnapMode: InstanceType<typeof App>["toggleSnapMode"];
    setCurrentScope: InstanceType<typeof App>["setCurrentScope"];
    updateGroups: InstanceType<typeof App>["updateGroups"];
    mutateGroup: InstanceType<typeof App>["mutateGroup"];
    setActiveTool: InstanceType<typeof App>["setActiveTool"];
    setBackgroundColor: (color: string) => void;
    openEyeDropper: InstanceType<typeof App>["openEyeDropper"];
    closeEyeDropper: InstanceType<typeof App>["closeEyeDropper"];
    getEyeDropper: InstanceType<typeof App>["getEyeDropper"];
    handleCanvasContextMenu: InstanceType<typeof App>["handleCanvasContextMenu"];
    maybeUnfollowRemoteUser: InstanceType<typeof App>["maybeUnfollowRemoteUser"];
  };
  state: () => AppClassProperties
  elements: {
    getSceneElements: InstanceType<typeof App>["getSceneElements"];
    getElementById: InstanceType<typeof App>["getElementById"];
    getVisibleElements: InstanceType<typeof App>["getVisibleElements"];
    getSelectedElements: InstanceType<typeof App>["getSelectedElements"];
    getMajoritySelectedElementsType: InstanceType<typeof App>["getMajoritySelectedElementsType"];
    getSelectedElementsType: InstanceType<typeof App>["getSelectedElementsType"];
    getSceneElementsMap: InstanceType<typeof App>["getSceneElementsMap"];
    getSceneElementsIncludingDeleted: InstanceType<typeof App>["getSceneElementsIncludingDeleted"];
    mutateElementWithValues: InstanceType<typeof App>["mutateElementWithValues"];
    replaceAllElements: InstanceType<typeof Scene>["replaceAllElements"];
    sendBackwardElements: InstanceType<typeof App>["sendBackwardElements"];
    mutateSelectedElementsWithValues: InstanceType<typeof App>["mutateSelectedElementsWithValues"];
    // mutateSelectedElementsWithValues: <TElement extends Mutable<DucElement>> ( values: ElementUpdate<TElement> ) => void;
    bringForwardElements: InstanceType<typeof App>["bringForwardElements"];
    sendToBackElements: InstanceType<typeof App>["sendToBackElements"];
    toggleCollapseFrame: InstanceType<typeof App>["toggleCollapseFrame"];
    toggleLockElement: InstanceType<typeof App>["toggleLockElement"];
    toggleElementVisibility: InstanceType<typeof App>["toggleElementVisibility"];
    bringToFrontElement: () => void;
    setZLayerIndexAfterElement: InstanceType<typeof App>["setZLayerIndexAfterElement"];
    setElementFrameId: InstanceType<typeof App>["setElementFrameId"];
    selectElements: InstanceType<typeof App>["selectElements"]; 
    flipHorizontal: InstanceType<typeof App>["flipHorizontal"];
    flipVertical: InstanceType<typeof App>["flipVertical"];
  };

  coordToRealMeasure: InstanceType<typeof App>["coordToRealMeasure"];
  realMeasureToCoord: InstanceType<typeof App>["realMeasureToCoord"];
  
  getAppState: () => InstanceType<typeof App>["state"];
  getScene: () => InstanceType<typeof App>["scene"];
  getFiles: () => InstanceType<typeof App>["files"];
  getName: InstanceType<typeof App>["getName"];
  executeAction: InstanceType<typeof App>["executeAction"];
  refresh: InstanceType<typeof App>["refresh"];

  setToast: InstanceType<typeof App>["setToast"];
  setAppState: InstanceType<typeof App>["setAppState"];
  addFiles: (data: BinaryFileData[]) => void;
  id: string;
  
  setCursor: InstanceType<typeof App>["setCursor"];
  resetCursor: InstanceType<typeof App>["resetCursor"];
  updateLibrary: InstanceType<typeof Library>["updateLibrary"];
  /**
   * Disables rendering of frames (including element clipping), but currently
   * the frames are still interactive in edit mode. As such, this API should be
   * used in conjunction with view mode (props.viewModeEnabled).
   */
  updateFrameRendering: InstanceType<typeof App>["updateFrameRendering"];
  onChange: (
    callback: (
      elements: readonly DucElement[],
      appState: AppState,
      files: BinaryFiles,
    ) => void,
  ) => UnsubscribeCallback;
  onPointerDown: (
    callback: (
      activeTool: AppState["activeTool"],
      pointerDownState: PointerDownState,
      event: React.PointerEvent<HTMLElement>,
    ) => void,
  ) => UnsubscribeCallback;
  onPointerUp: (
    callback: (
      activeTool: AppState["activeTool"],
      pointerDownState: PointerDownState,
      event: PointerEvent,
    ) => void,
  ) => UnsubscribeCallback;
  onScrollChange: (
    callback: (scrollX: number, scrollY: number, zoom: Zoom) => void,
  ) => UnsubscribeCallback;
  onUserFollow: (
    callback: (payload: OnUserFollowedPayload) => void,
  ) => UnsubscribeCallback;
}

export type Device = Readonly<{
  viewport: {
    isMobile: boolean;
    isLandscape: boolean;
  };
  editor: {
    isMobile: boolean;
    canFitSidebar: boolean;
  };
  isTouchScreen: boolean;
}>;

export type FrameNameBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
};

export type FrameNameBoundsCache = {
  get: (
    frameElement: DucFrameLikeElement | DucMagicFrameElement,
  ) => FrameNameBounds | null;
  _cache: Map<
    string,
    FrameNameBounds & {
      zoom: AppState["zoom"]["value"];
      versionNonce: DucFrameLikeElement["versionNonce"];
    }
  >;
};

export type KeyboardModifiersObject = {
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
};

export type Primitive =
  | number
  | string
  | boolean
  | bigint
  | symbol
  | null
  | undefined;

export type JSONValue = string | number | boolean | null | object;

export type EmbedsValidationStatus = Map<
  DucIframeLikeElement["id"],
  boolean
>;

export type ElementsPendingErasure = Set<DucElement["id"]>;

/** Runtime gridSize value. Null indicates disabled grid. */
export type NullableGridSize =
  | (AppState["gridSize"] & MakeBrand<"NullableGridSize">)
  | null;


export type PendingDucElements = DucElement[];



