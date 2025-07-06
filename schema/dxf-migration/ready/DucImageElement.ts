export type ImageCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
};

export type DucImageFilter = {
  brightness: Percentage;
  contrast: Percentage;
}

export type DucImageElement = _DucElementBase &
  Readonly<{
    type: "image";
    fileId: FileId | null;
    /** whether respective file is persisted */
    status: ImageStatus;
    /** X and Y scale factors <-1, 1>, used for image axis flipping */
    scale: [number, number];
    /** whether an element is cropped */
    crop: ImageCrop | null;
    /** clipping boundary for the image */
    clippingBoundary: DucLinearElement | null;
    filter: DucImageFilter | null;
  }>;