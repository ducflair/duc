# The goal of this test is to create a Duc file with every single property possible to test coverage
# The test will consist of creating the Duc file first with the builders api, and then serializing it to the outputs
# Then in the end will parse the file and check if most properties are present and valid in the python state

# This duc test file must include:
# - All possible element types
# - All possible properties for each element type
# - All possible styles and settings
# - Diverse Layers, Regions, Blocks, Groups
# - Diverse Dictionary key values
# - Thumbnail image from assets (thumbnail.png)
# - On external files at least three files related to elements (test.pdf, test.step and test.jpg)
#    - Respectively these files will be necessary to link to the DucPdfElement, DucParametricElement and DucImageElement
# - Some VersionGraph history
# - Diverse Standards