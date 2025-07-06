/**
 * Base text styling properties shared by all text elements
 */
export type _DucBaseTextStyle = {
  /** Unique identifier for this style */
  id: string;

  /** Human-readable name for the style */
  name: string;

  /** Optional description */
  description?: string;

  background: ElementBackground;
  stroke: ElementBackground;


  /**
   * Unitless line height (aligned to W3C). To get line height in px, multiply
   *  with font size (using `getLineHeightInPx` helper).
   * The primary font family to use for the text
   */
  fontFamily: FontFamilyValues;
  /**
   * Fallback font family for broader compatibility across all systems and languages
   * Useful for emojis, non-latin characters, etc.
   */
  bigFontFamily: string;

  /** Horizontal alignment of the text within its bounding box */
  textAlign: TextAlign;

  /** Vertical alignment of the text within its bounding box */
  verticalAlign: VerticalAlign;

  /** Fixed height (0 = specify per instance) */
  height: PrecisionValue;

  /** Desired height on printed page (for annotative text) */
  paperTextHeight?: PrecisionValue;
  /**
   * Unitless line height multiplier (follows W3C standard).
   * Actual line height in drawing units = fontSize × lineHeight
   * Use `getLineHeightInPx` helper for pixel calculations.
   * 
   * @example 1.2 means 20% extra space between lines
   */
  lineHeight: number & { _brand: "unitlessLineHeight" };
  /**
   * Italic angle in radians for oblique text rendering
   * Positive values slant right, negative values slant left
   */
  obliqueAngle: Radian;
  /**
   * Text height in drawing units (primary size parameter)
   * This determines the height of capital letters
   */
  fontSize: PrecisionValue;
  /**
   * Character width as a ratio of text height
   * Controls horizontal spacing and character proportions
   * 
   * @example 0.7 means each character is 70% as wide as the text is tall
   */
  widthFactor: number;
  
  /** Render upside down */
  isUpsideDown: boolean;

  /** Render backwards/mirrored */
  isBackwards: boolean;
};


export type DucTextStyle = _DucBaseTextStyle;

export type _DucTextStyleProps = Exclude<DucTextStyle, "id" | "name" | "description">;
export type DucTextElement = _DucElementBase & _DucTextStyleProps &
  Readonly<{
    type: "text";

    /** The actual text content to be displayed */
    text: string;

    /**
     * Text sizing behavior:
     * - `true`: Width adjusts to fit text content (single line or natural wrapping)
     * - `false`: Text wraps to fit within the element's fixed width
     * @default true
     */
    autoResize: boolean;

    /** The ID of an element that this text is contained within (e.g., for labels on shapes) */
    containerId: DucGenericElement["id"] | null;

    /** A non-rendered, original version of the text, e.g., before resolving a formula or field */
    originalText: string;
  }>;