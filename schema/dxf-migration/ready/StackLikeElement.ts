return {
  enabled: exportingFrame ? true : frameRendering.enabled,
  outline: exportingFrame ? false : frameRendering.outline,
  name: exportingFrame ? false : frameRendering.name,
  clip: exportingFrame ? true : frameRendering.clip,
};