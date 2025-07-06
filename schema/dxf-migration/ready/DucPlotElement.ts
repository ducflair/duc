export const PAPER_SIZE = {
  // ISO A Series
  A0: "A0",
  A1: "A1", 
  A2: "A2",
  A3: "A3",
  A4: "A4",
  A5: "A5",
  
  // ANSI Series
  ANSI_A: "ANSI_A", // 8.5 x 11
  ANSI_B: "ANSI_B", // 11 x 17
  ANSI_C: "ANSI_C", // 17 x 22
  ANSI_D: "ANSI_D", // 22 x 34
  ANSI_E: "ANSI_E", // 34 x 44
  
  // Architectural
  ARCH_A: "ARCH_A", // 9 x 12
  ARCH_B: "ARCH_B", // 12 x 18
  ARCH_C: "ARCH_C", // 18 x 24
  ARCH_D: "ARCH_D", // 24 x 36
  ARCH_E: "ARCH_E", // 36 x 48
  
  CUSTOM: "CUSTOM",
} as const;


export type PaperSize = ValueOf<typeof PAPER_SIZE>;

export type PlotMargins = {
  /** Left margin */
  left: PrecisionValue;
  /** Right margin */
  right: PrecisionValue;
  /** Top margin */
  top: PrecisionValue;
  /** Bottom margin */
  bottom: PrecisionValue;
  /** Whether margins are enforced */
  enforced: boolean;
};

export type DucPlotStyle = {
  id: string;
  name: string;
  description?: string;
  
  unit: Scope;
  margins: PlotMargins;
};


export type _DucPlotStyleProps = Exclude<DucPlotStyle, "id" | "name" | "description">;
export type DucPlotElement = _DucStackElementBase & _DucPlotStyleProps & {
  type: "plot";

  /** Plot margins */
  margins: PlotMargins;
};