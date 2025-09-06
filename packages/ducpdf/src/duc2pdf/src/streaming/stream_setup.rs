// Will use 1.7 for widespread compatibility with printers and viewers
// let mut doc = lopdf::Document::with_version("1.7");


// Process the Dictionary from the duc file

// Add version and source from the root of the duc file
// Add available metadata from DucGlobalState and DucLocalState
  // process and save active standard from the state to use it through out the PDF creation
// Process possible StandardOverrides
// Process UnitSystem from duc (this is not related to the coordinate system, this only is useful for measurements and text formatting)

// Setup coordinate system

// stream the resources

// create ocg layers based on the DucLayers
// create the blocks using the stream elements