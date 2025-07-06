export const LEADER_CONTENT_TYPE = {
  TEXT: 10,
  BLOCK: 11,
  NONE: 12,
} as const;

export type LeaderContent = 
  | {
      type: typeof LEADER_CONTENT_TYPE.TEXT;
      /** Reference to the text element */
      textElement: DucTextElement;
    }
  | {
      type: typeof LEADER_CONTENT_TYPE.BLOCK;
      /** Reference to the block instance */
      blockInstance: DucBlockInstanceElement;
    }
  | {
      type: typeof LEADER_CONTENT_TYPE.NONE;
    };

export type _DucLeaderStyleProps = Exclude<DucLeaderStyle, "id" | "name" | "description">;
export type DucLeaderElement = DucLinearElement & _DucLeaderStyleProps & {
  type: "leader";
  
  /** Content of the leader */
  content: LeaderContent;
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