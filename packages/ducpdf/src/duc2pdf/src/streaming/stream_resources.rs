
// process images
// process fonts

// process svg -> pdf to keep the vector data (use svg_to_pdf)
  // process the svg files on external_files
  // process the elements that contain `svg_path` like DucMermaidElement or DucFreedrawElement - not processing the element itself, just the svg data it contains so that we can add to the PDF document resources and use later on streaming the elements
// process markdown -> pdf to handle this complex formatting (⚠️ WIP at the moment, will integrate later)
// process pdf embeds (load and initialize only, no embedding yet)


// will need to stream resources with the same id as their respective external file id if any