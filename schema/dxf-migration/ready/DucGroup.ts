

export type _DucStackBase = {
  label: string
  description: string | null;

  isPlot: boolean;
  isCollapsed: boolean;
  locked: boolean;
  isVisible: boolean;

  opacity: Percentage;
  labelingColor: string;

  memberStyles: {
    commonStyleId?: string;
    textStyleId?: string;
    dimensionStyleId?: string;
    leaderStyleId?: string;
    featureControlFrameStyleId?: string;
    tableStyleId?: string;
    docStyleId?: string;
    viewportStyleId?: string;
    plotStyleId?: string;
    hatchStyleId?: string;
  } | null;

  clip: boolean;
};

export type _DucStackElementBase = _DucElementBase & _DucStackBase;


export type DucGroup = _DucStackBase & {
  id: GroupId;
};