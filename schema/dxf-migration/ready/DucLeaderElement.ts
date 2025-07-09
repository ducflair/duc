

export type _DucLeaderStyleProps = Exclude<DucLeaderStyle, "id" | "name" | "description">;
export type DucLeaderElement = DucLinearElement & _DucLeaderStyleProps & {
  type: "leader";
  
  textContent: DucTextElement | null;
  blockContent: DucBlockInstanceElement | null;
};

export type DucLeaderStyle = {
  id: string;
  name: string;
  description?: string;

  background: ElementBackground;
  stroke: ElementStroke;
  headStyles?: [DucHead, DucHead];
  textStyle?: _DucTextStyleProps;

  landing: {
    /** Whether to show landing line */
    show: boolean;
    /** Length of landing line */
    length: PrecisionValue;
    /** Gap between arrow and landing */
    gap: PrecisionValue;
  };
  
  /** Maximum number of leader points */
  maxPoints: number;

  /** Maximum number of leader lines allowed */
  maxLeaders?: number;
  
  /** First segment angle constraint */
  firstSegmentAngle?: Radian;
  
  /** Second segment angle constraint */
  secondSegmentAngle?: Radian;
};