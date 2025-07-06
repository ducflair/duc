You're absolutely right - my previous checklist was incomplete. Here's a much more comprehensive version that includes MultiLeaders, Feature Control Frames, detailed dimension types, and many other essential DXF components I missed:

---

# Complete DXF 2D Migration & Support Checklist

## **1. Overall Migration Strategy & File Structure**

   - [ ] **Parse `HEADER` Section:** Read drawing-wide settings and variables first.
   - [ ] **Parse `TABLES` Section:** Read all style and definition tables (Layers, Linetypes, Text Styles, Dimension Styles, MultiLeader Styles, etc.).
   - [ ] **Parse `BLOCKS` Section:** Read all block definitions and store as templates.
   - [ ] **Parse `ENTITIES` Section:** Read and create the actual geometric entities.
   - [ ] **Parse `OBJECTS` Section:** Read non-graphical objects (dictionaries, group definitions, etc.).
   - [ ] **Finalize:** Link all references and build the final drawing model.

---

## **2. `HEADER` Section: Drawing-Wide Settings**

- [ ] **Core Metadata:**
   - [ ] `$ACADVER`: AutoCAD Version
   - [ ] `$DWGCODEPAGE`: Character encoding
   - [ ] `$HANDSEED`: Next available handle value

- [ ] **Units & Precision:**
   - [ ] `$INSUNITS`: Default insertion units
   - [ ] `$MEASUREMENT`: Drawing units system
   - [ ] `$LUNITS`: Linear unit format
   - [ ] `$LUPREC`: Linear unit precision
   - [ ] `$AUNITS`: Angular unit format
   - [ ] `$AUPREC`: Angular unit precision

- [ ] **Drawing Limits & Extents:**
   - [ ] `$LIMMIN`: Lower-left drawing limits
   - [ ] `$LIMMAX`: Upper-right drawing limits
   - [ ] `$EXTMIN`: Lower-left drawing extents
   - [ ] `$EXTMAX`: Upper-right drawing extents

- [ ] **Global Display & Behavior:**
   - [ ] `$LTSCALE`: Global linetype scale
   - [ ] `$CELTSCALE`: Current entity linetype scale
   - [ ] `$CANNOSCALE`: Current annotation scale
   - [ ] `$FILLMODE`: Fill mode for hatches and wide polylines
   - [ ] `$TEXTSTYLE`: Current text style
   - [ ] `$CLAYER`: Current layer
   - [ ] `$DIMSTYLE`: Current dimension style
   - [ ] `$MLEADERSTYLE`: Current multileader style

- [ ] **Annotation & Scaling:**
   - [ ] `$ANNOTATIVEDWG`: Annotative objects enabled
   - [ ] `$CANNOSCALEVALUE`: Current annotation scale value
   - [ ] `$MSLTSCALE`: Model space linetype scale

---

## **3. `TABLES` Section: Definition Tables**

- [ ] **`LAYER` Table:**
   - [ ] Layer Name
   - [ ] State Flags (On/Off, Frozen/Thawed, Locked/Unlocked)
   - [ ] Color (ACI or True Color)
   - [ ] Linetype Name
   - [ ] Lineweight
   - [ ] Plot/No-Plot Flag
   - [ ] Transparency (0-90, where 90 is most transparent)

- [ ] **`LTYPE` Table (Linetype):**
   - [ ] Linetype Name
   - [ ] Description
   - [ ] Pattern Definition (dash/dot/gap lengths)
   - [ ] Complex Linetype Elements:
       - [ ] Text strings within linetypes
       - [ ] Shape/Symbol elements within linetypes

- [ ] **`STYLE` Table (Text Style):**
   - [ ] Style Name
   - [ ] Font File Name (.shx or .ttf)
   - [ ] Big Font File (for Asian fonts)
   - [ ] Fixed Text Height
   - [ ] Width Factor
   - [ ] Oblique Angle
   - [ ] Generation Flags (Backward, Upside-down, Vertical)

- [ ] **`DIMSTYLE` Table (Dimension Style):**
- [ ] **Lines:**
   - [ ] Dimension Line Color (`$DIMCLRD`)
   - [ ] Dimension Line Linetype (`$DIMLTYPE`)
   - [ ] Dimension Line Lineweight (`$DIMLWD`)
   - [ ] Dimension Line Extension (`$DIMDLE`)
   - [ ] Suppress First/Second Dimension Line (`$DIMSD1`, `$DIMSD2`)

- [ ] **Extension Lines:**
   - [ ] Extension Line Color (`$DIMCLRE`)
   - [ ] Extension Line Linetype 1 (`$DIMLTEX1`)
   - [ ] Extension Line Linetype 2 (`$DIMLTEX2`)
   - [ ] Extension Line Lineweight (`$DIMLWE`)
   - [ ] Extension Line Offset (`$DIMEXO`)
   - [ ] Extension Line Extension (`$DIMEXE`)
   - [ ] Suppress First/Second Extension Line (`$DIMSE1`, `$DIMSE2`)

- [ ] **Arrows:**
   - [ ] First Arrow Block Name (`$DIMBLK1`)
   - [ ] Second Arrow Block Name (`$DIMBLK2`)
   - [ ] Leader Arrow Block Name (`$DIMLDRBLK`)
   - [ ] Arrow Size (`$DIMASZ`)
   - [ ] Center Mark Size (`$DIMCEN`)

- [ ] **Text:**
   - [ ] Text Style Name (`$DIMTXSTY`)
   - [ ] Text Color (`$DIMCLRT`)
   - [ ] Text Height (`$DIMTXT`)
   - [ ] Text Gap (`$DIMGAP`)
   - [ ] Text Vertical Position (`$DIMTAD`)
   - [ ] Text Horizontal Justification (`$DIMJUST`)
   - [ ] Text Inside Alignment (`$DIMTIH`)
   - [ ] Text Outside Alignment (`$DIMTOH`)
   - [ ] Text Movement Rules (`$DIMTMOVE`)

- [ ] **Fit:**
   - [ ] Fit Options (`$DIMATFIT`)
   - [ ] Text Position (`$DIMTIX`)
   - [ ] Scale for Dimension Features (`$DIMSCALE`)
   - [ ] Overall Scale (`$DIMSCALE`)

- [ ] **Primary Units:**
   - [ ] Unit Format (`$DIMLUNIT`)
   - [ ] Precision (`$DIMLUPREC`)
   - [ ] Decimal Separator (`$DIMDSEP`)
   - [ ] Prefix (`$DIMPOST`)
   - [ ] Suffix (`$DIMPOST`)
   - [ ] Scale Factor (`$DIMLFAC`)
   - [ ] Zero Suppression (`$DIMZIN`)

- [ ] **Alternate Units:**
   - [ ] Enable Alternate Units (`$DIMALT`)
   - [ ] Alternate Unit Format (`$DIMALTU`)
   - [ ] Alternate Unit Precision (`$DIMALTUP`)
   - [ ] Alternate Unit Scale Factor (`$DIMALTF`)
   - [ ] Alternate Unit Prefix/Suffix (`$DIMAPOST`)

- [ ] **Tolerances:**
   - [ ] Tolerance Display (`$DIMTOL`)
   - [ ] Tolerance Upper Value (`$DIMTP`)
   - [ ] Tolerance Lower Value (`$DIMTM`)
   - [ ] Tolerance Height Scale (`$DIMTFAC`)
   - [ ] Tolerance Vertical Justification (`$DIMTOLJ`)

- [ ] **`MLEADERSTYLE` Table (MultiLeader Style):**
- [ ] **Leader Line:**
   - [ ] Leader Line Type (Straight, Spline)
   - [ ] Leader Line Color
   - [ ] Leader Line Linetype
   - [ ] Leader Line Lineweight
   - [ ] Arrowhead Block Name
   - [ ] Arrowhead Size
   - [ ] Break Size
   - [ ] Dogleg Length
   - [ ] Landing Distance

- [ ] **Leader Structure:**
   - [ ] Maximum Leader Points
   - [ ] First Segment Angle Constraint
   - [ ] Second Segment Angle Constraint
   - [ ] Auto Include Landing
   - [ ] Scale Factor

- [ ] **Content:**
   - [ ] Content Type (None, Block, MText)
   - [ ] Text Style (for MText content)
   - [ ] Text Angle Type
   - [ ] Text Color
   - [ ] Text Height
   - [ ] Text Frame (On/Off)
   - [ ] Block Name (for Block content)
   - [ ] Block Color
   - [ ] Block Scale

- [ ] **Text Options:**
   - [ ] Text Left Attachment
   - [ ] Text Right Attachment
   - [ ] Text Angle Type
   - [ ] Text Alignment Type
   - [ ] Text Direction Attribute
   - [ ] Text Top Attachment
   - [ ] Text Bottom Attachment

- [ ] **`BLOCK_RECORD` Table:**
   - [ ] Block Name
   - [ ] Layout Object Reference
   - [ ] Insert Units
   - [ ] Explodability
   - [ ] Scalability

- [ ] **`UCS` Table (User Coordinate System):**
   - [ ] UCS Name
   - [ ] Origin Point (X, Y, Z)
   - [ ] X-axis Direction Vector
   - [ ] Y-axis Direction Vector

- [ ] **`VIEW` Table:**
   - [ ] View Name
   - [ ] View Center Point
   - [ ] View Direction Vector
   - [ ] View Target Point
   - [ ] View Height
   - [ ] View Width
   - [ ] Twist Angle
   - [ ] Lens Length

- [ ] **`VPORT` Table (Viewport):**
   - [ ] Viewport Name
   - [ ] Lower-left Corner
   - [ ] Upper-right Corner
   - [ ] View Center Point
   - [ ] Snap Base Point
   - [ ] Snap Spacing
   - [ ] Grid Spacing
   - [ ] View Direction Vector
   - [ ] View Target Point
   - [ ] View Height
   - [ ] Aspect Ratio
   - [ ] Lens Length

- [ ] **`APPID` Table (Application ID):**
   - [ ] Application Name
   - [ ] Flags

---

## **4. `BLOCKS` Section: Reusable Entity Groups**

- [ ] **Block Definition (`BLOCK`):**
   - [ ] Block Name
   - [ ] Base Point/Insertion Point
   - [ ] Block Type Flags (Anonymous, Has Attributes, External Reference)
   - [ ] List of Entities within the block
   - [ ] Path Name (for external references)

- [ ] **Attribute Definition (`ATTDEF`):**
   - [ ] Tag
   - [ ] Prompt
   - [ ] Default Value
   - [ ] Flags (Invisible, Constant, Verifiable, Preset)
   - [ ] Text Properties (insertion point, height, style, rotation, etc.)
   - [ ] Field Length
   - [ ] Horizontal Text Justification
   - [ ] Vertical Text Justification

---

## **5. `ENTITIES` Section: The Actual Geometry**

- [ ] **Common Entity Properties:**
   - [ ] Layer Name
   - [ ] Color (ACI, True Color, or ByLayer/ByBlock)
   - [ ] Linetype Name
   - [ ] Linetype Scale
   - [ ] Lineweight
   - [ ] Transparency
   - [ ] Visibility
   - [ ] Handle (unique ID)
   - [ ] Owner Handle
   - [ ] Plot Style Name

- [ ] **Basic Geometric Entities:**
   - [ ] **`LINE`:** Start Point, End Point
   - [ ] **`CIRCLE`:** Center Point, Radius
   - [ ] **`ARC`:** Center Point, Radius, Start Angle, End Angle
   - [ ] **`ELLIPSE`:** Center, Major Axis Endpoint, Minor-to-Major Ratio, Start/End Parameters
   - [ ] **`POINT`:** Location, Point Display Style
   - [ ] **`RAY`:** Start Point, Unit Direction Vector (Infinite line in one direction from a start point)
   - [ ] **`XLINE`:** Base Point, Unit Direction Vector (Infinite line in both directions)

- [ ] **Polyline Entities:**
   - [ ] **`LWPOLYLINE` (Lightweight Polyline):**
       - [ ] Vertices (X, Y coordinates)
       - [ ] Constant Width
       - [ ] Per-vertex Start/End Widths
       - [ ] Bulge Factors (for arc segments)
       - [ ] Closed/Open Flag
       - [ ] Elevation
   - [ ] **`POLYLINE` (Legacy 3D Polyline):**
       - [ ] Vertices List
       - [ ] Flags (Closed, Curve-fit, Spline-fit, 3D)
       - [ ] Surface Type
   - [ ] **`VERTEX`:** (Part of POLYLINE)
       - [ ] Location
       - [ ] Bulge
       - [ ] Start/End Width
       - [ ] Curve-fit Tangent

- [ ] **Spline and Curve Entities:**
   - [ ] **`SPLINE`:**
       - [ ] Degree
       - [ ] Rational/Non-rational
       - [ ] Periodic/Non-periodic
       - [ ] Knot Values
       - [ ] Control Points
       - [ ] Fit Points
       - [ ] Fit Tolerance
       - [ ] Start/End Tangents

- [ ] **Text Entities:**
   - [ ] **`TEXT` (Single-line Text):**
       - [ ] Insertion Point
       - [ ] Height
       - [ ] Text String
       - [ ] Rotation Angle
       - [ ] Width Factor
       - [ ] Oblique Angle
       - [ ] Text Style Name
       - [ ] Text Generation Flags
       - [ ] Horizontal Justification
       - [ ] Vertical Justification
   - [ ] **`MTEXT` (Multi-line Text):**
       - [ ] Insertion Point
       - [ ] Height
       - [ ] Reference Rectangle Width
       - [ ] Text String (with formatting codes)
       - [ ] Rotation Angle
       - [ ] Text Style Name
       - [ ] Attachment Point
       - [ ] Flow Direction
       - [ ] Background Fill Settings
       - [ ] Column Settings

- [ ] **Dimension Entities:**
   - [ ] **`DIMENSION` (Base Properties):**
       - [ ] Dimension Style Name
       - [ ] Dimension Block Name
       - [ ] Definition Point
       - [ ] Middle Point of Dimension Text
       - [ ] Dimension Text Value
       - [ ] Dimension Text Rotation
       - [ ] Horizontal Direction
       - [ ] Leader Length
       - [ ] Dimension Type

   - [ ] **Linear Dimensions (`DIMENSION` with specific types):**
       - [ ] **Linear:** First Extension Line Origin, Second Extension Line Origin, Dimension Line Location
       - [ ] **Aligned:** First Extension Line Origin, Second Extension Line Origin
       - [ ] **Rotated:** First Extension Line Origin, Second Extension Line Origin, Dimension Line Angle

   - [ ] **Angular Dimensions:**
       - [ ] **2-Line Angular:** First Line Start/End, Second Line Start/End, Arc Point
       - [ ] **3-Point Angular:** Vertex Point, First Angle Point, Second Angle Point
       - [ ] **Arc Length:** Arc Center, First Extension Line Origin, Second Extension Line Origin

   - [ ] **Radial Dimensions:**
       - [ ] **Radius:** Circle/Arc Center, Chord Point
       - [ ] **Diameter:** Circle/Arc Center, Far Chord Point

   - [ ] **Ordinate Dimensions:**
       - [ ] Feature Location Point
       - [ ] Leader Endpoint
       - [ ] Use X-Datum/Y-Datum Flag

- [ ] **Leader Entities:**
   - [ ] **`LEADER` (Legacy Leader):**
       - [ ] Leader Path Vertices
       - [ ] Annotation Type (Text, Tolerance, Block Insert)
       - [ ] Annotation Height
       - [ ] Annotation Width
       - [ ] Arrowhead Flag
       - [ ] Path Type (Straight lines, Spline)
       - [ ] Associated Annotation

   - [ ] **`MULTILEADER` (Modern MultiLeader):**
       - [ ] MultiLeader Style Name
       - [ ] Property Override Values
       - [ ] Leader Line Vertices
       - [ ] Arrowhead Information
       - [ ] Content Type (MText, Block, None)
       - [ ] Content Location and Properties
       - [ ] Landing Gap
       - [ ] Dogleg Vector
       - [ ] Break Information

- [ ] **Tolerance and GD&T Entities:**
   - [ ] **`TOLERANCE` (Feature Control Frame):**
       - [ ] Insertion Point
       - [ ] X-Direction Vector
       - [ ] Dimension Style Name
       - [ ] Tolerance String (formatted text containing geometric symbols)
       - [ ] Height
       - [ ] Tolerance Values for Each Compartment:
           - [ ] Geometric Characteristic Symbol
           - [ ] Tolerance Value 1
           - [ ] Material Condition Symbol 1
           - [ ] Tolerance Value 2
           - [ ] Material Condition Symbol 2
           - [ ] Datum Reference 1
           - [ ] Material Condition for Datum 1
           - [ ] Datum Reference 2
           - [ ] Material Condition for Datum 2
           - [ ] Datum Reference 3
           - [ ] Material Condition for Datum 3

- [ ] **Block Reference and Attribute Entities:**
   - [ ] **`INSERT` (Block Reference):**
       - [ ] Block Name
       - [ ] Insertion Point
       - [ ] X Scale Factor
       - [ ] Y Scale Factor
       - [ ] Z Scale Factor
       - [ ] Rotation Angle
       - [ ] Column Count (for array inserts)
       - [ ] Row Count (for array inserts)
       - [ ] Column Spacing
       - [ ] Row Spacing
       - [ ] Attributes Follow Flag

   - [ ] **`ATTRIB` (Attribute Instance):**
       - [ ] Tag
       - [ ] Text Value
       - [ ] Insertion Point
       - [ ] Height
       - [ ] Text Style Name
       - [ ] Rotation Angle
       - [ ] Relative Scale Factor
       - [ ] Oblique Angle
       - [ ] Text Generation Flags
       - [ ] Horizontal Justification
       - [ ] Vertical Justification
       - [ ] Field Length

- [ ] **Hatch and Fill Entities:**
   - [ ] **`HATCH`:**
       - [ ] Pattern Name
       - [ ] Solid Fill Flag
       - [ ] Associativity Flag
       - [ ] Number of Boundary Paths
       - [ ] Hatch Style (Normal, Outer, Ignore)
       - [ ] Pattern Type (User-defined, Predefined, Custom)
       - [ ] Pattern Angle
       - [ ] Pattern Scale
       - [ ] Pattern Double Flag
       - [ ] Number of Pattern Definition Lines
       - [ ] Pixel Size
       - [ ] Seed Points
       - [ ] **Boundary Path Data:**
           - [ ] Path Type Flags (External, Polyline, Derived, Textbox, Outermost)
           - [ ] Boundary Objects (Lines, Arcs, Elliptical Arcs, Splines, Polylines)
           - [ ] Source Boundary Objects

- [ ] **Image and Raster Entities:**
   - [ ] **`IMAGE`:**
       - [ ] Image Definition Object Handle
       - [ ] Insertion Point
       - [ ] U-Vector (defines width and rotation)
       - [ ] V-Vector (defines height and rotation)
       - [ ] Image Size in Pixels
       - [ ] Display Properties (Show Image, Show Image when not aligned with screen, Use clipping boundary)
       - [ ] Clipping Boundary Type
       - [ ] Clipping Boundary Vertices
       - [ ] Brightness (0-100)
       - [ ] Contrast (0-100)
       - [ ] Fade (0-100)

- [ ] **Advanced Geometric Entities:**
   - [ ] **`SOLID` (Filled Triangle/Quadrilateral):**
       - [ ] First Corner
       - [ ] Second Corner
       - [ ] Third Corner
       - [ ] Fourth Corner (optional)

   - [ ] **`TRACE` (Wide Line):**
       - [ ] Start Width Left
       - [ ] Start Width Right
       - [ ] End Width Left
       - [ ] End Width Right
       - [ ] Start Point
       - [ ] End Point

   - [ ] **`3DFACE` (3D Triangle/Quadrilateral):**
       - [ ] First Corner (X, Y, Z)
       - [ ] Second Corner (X, Y, Z)
       - [ ] Third Corner (X, Y, Z)
       - [ ] Fourth Corner (X, Y, Z, optional)
       - [ ] Invisible Edge Flags

- [ ] **Viewport and Layout Entities:**
   - [ ] **`VIEWPORT` (Paper Space Viewport):**
       - [ ] Center Point
       - [ ] Width
       - [ ] Height
       - [ ] View Target Point
       - [ ] View Direction Vector
       - [ ] View Twist Angle
       - [ ] View Height
       - [ ] Lens Length
       - [ ] Front Clipping Plane
       - [ ] Back Clipping Plane
       - [ ] View Mode
       - [ ] Render Mode
       - [ ] UCS per Viewport
       - [ ] UCS Icon Settings

- [ ] **Table Entities:**
   - [ ] **`ACAD_TABLE`:**
       - [ ] Insertion Point
       - [ ] X-Direction Vector
       - [ ] Number of Rows
       - [ ] Number of Columns
       - [ ] Row Heights
       - [ ] Column Widths
       - [ ] Table Style Name
       - [ ] Cell Data (Text, Block References, Formulas)
       - [ ] Cell Properties (Text Style, Height, Color, Alignment)
       - [ ] Cell Borders (Lineweight, Color, Linetype)
       - [ ] Cell Background Color
       - [ ] Merged Cell Information

---

## **6. `OBJECTS` Section: Non-Graphical Objects**

- [ ] **Dictionary Objects:**
   - [ ] **`DICTIONARY`:** Named object collections
   - [ ] **`ACDBDICTIONARYWDFLT`:** Dictionary with default values

- [ ] **Plot and Layout Objects:**
   - [ ] **`LAYOUT`:** Layout definitions (Model Space, Paper Space layouts)
   - [ ] **`PLOTSETTINGS`:** Plot configuration for layouts

- [ ] **Image and External Reference Objects:**
   - [ ] **`IMAGEDEF`:** Image file definitions
   - [ ] **`IMAGEDEF_REACTOR`:** Image definition reactors
   - [ ] **`RASTERVARIABLES`:** Raster image display settings

- [ ] **Group and Selection Objects:**
   - [ ] **`GROUP`:** Named selection sets
   - [ ] **`SORTENTSTABLE`:** Entity display order table

- [ ] **Style and Table Objects:**
   - [ ] **`TABLESTYLE`:** Table style definitions
   - [ ] **`MLINESTYLE`:** Multiline style definitions

---

## **7. Special Handling Requirements**

- [ ] **Annotation Scaling:**
   - [ ] Annotative objects detection and handling
   - [ ] Scale representation for annotative entities
   - [ ] Current annotation scale application

- [ ] **Coordinate Systems:**
   - [ ] World Coordinate System (WCS) vs User Coordinate System (UCS) transformations
   - [ ] Object Coordinate System (OCS) for entities like TEXT, ARC, CIRCLE
   - [ ] Paper Space vs Model Space coordinate handling

- [ ] **Block and External Reference Handling:**
   - [ ] Nested block references
   - [ ] Block attribute inheritance and overrides
   - [ ] External reference (XREF) path resolution and loading
   - [ ] Block explosion and entity extraction

- [ ] **Complex Entity Processing:**
   - [ ] Polyline bulge factor calculation for arc segments
   - [ ] Spline curve tessellation or conversion to polylines
   - [ ] Hatch boundary association and pattern generation
   - [ ] Dimension geometry calculation from definition points

- [ ] **Text and Font Handling:**
   - [ ] AutoCAD Shape Font (.shx) handling or substitution
   - [ ] TrueType Font (.ttf) loading and text rendering
   - [ ] MText formatting code interpretation
   - [ ] Unicode and multi-byte character support

- [ ] **Color and Display Properties:**
   - [ ] AutoCAD Color Index (ACI) to RGB conversion
   - [ ] True Color support (24-bit RGB)
   - [ ] ByLayer and ByBlock property resolution
   - [ ] Transparency handling
   - [ ] Linetype pattern scaling and generation

---

This comprehensive checklist should cover all the major 2D components you'll encounter in DXF files. Start with the basic geometric entities and common properties, then gradually add support for the more complex features like MultiLeaders, Feature Control Frames, and advanced dimension types.