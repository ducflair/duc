export type _DucStackBase = DucStackLikeStyles & {
  label: string
  description: string | null;

  isCollapsed: boolean;

  isPlot: DucElement["isPlot"];
  isVisible: DucElement["isVisible"];
  locked: DucElement["locked"];
};

export type DucStackLikeStyles = {
  /** Override for all elements in the stack */
  elementsStrokeOverride: ElementStroke[] | null;
  elementsBackgroundOverride: ElementBackground[] | null;

  opacity: DucElement["opacity"];
  labelingColor: string;
  
  clip: boolean;
  labelVisible: boolean
}

export type _DucStackElementBase = _DucElementBase & _DucStackBase;