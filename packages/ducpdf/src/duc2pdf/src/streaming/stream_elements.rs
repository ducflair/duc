
// Leverage style resolver from utils to first get the adequate style for the element

// Then, based on the element type, stream the adequate PDF commands to represent it:
  // DucRectangleElement, DucPolygonElement, DucEllipseElement, DucTextElement, DucLinearElement: these are pretty straightforward to stream as basic PDF drawing commands
  // DucTableElement: stream as an actual table
  // DucMermaidElement, DucFreedrawElement: stream as a pdf from the svg conversion we did into resources earlier

  // DucEmbeddableElement, DucXRayElement, DucArrowElement: don't stream these, will just ignore them
  // DucPdfElement: will use the hipdf::embed_pdf with combination of the resources we loaded earlier 
  // DucImageElement: stream an image using the resources we loaded earlier
  // DucBlockInstanceElement: stream the corresponding block as an instance we loaded earlier using hipdf::blocks
  // DucFrameElement: stream as a simple rectangle but be careful since we need might need to clip, since this is a StackLike
  // DucPlotElement: IF CROP: stream as a rectangle element but be careful since we need might need to clip, since this is a StackLike ELSE IF PLOTS: each plot element is an actual pdf document page so it is a little different, we grab the size of the plot and then create the page with the respective StackLike content and handling
  
  // DucLeaderElement, DucDimensionElement, DucFeatureControlFrameElement: ⚠️ WIP, don't stream these for now
  // DucViewportElement: ⚠️ WIP, don't stream these for now - stream as a linear element but be careful since we need might need to clip, since this is a StackLike
  // DucDocElement: ⚠️ WIP, don't stream these for now - still provisioning
  // DucParametricElement: ⚠️ WIP, don't stream these for now - still provisioning



// Process properly StackLike conditions such as clipping, visibility, opacity, blend modes, etc. (style overrides must have been handled in the style resolver in the beginning) these are StackLike:
  // groups: [DucGroup];
  // regions: [DucRegion];
  // layers: [DucLayer];
  // And also from the Elements pool: DucFrame, DucViewport and DucPlot



