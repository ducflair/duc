

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