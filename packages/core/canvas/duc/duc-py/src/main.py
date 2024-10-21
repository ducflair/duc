from models.DucElement import DucRectangleElement, DucTextElement, DucArrowElement, DucDiamondElement, DucLineElement, DucEllipseElement
from models.BinaryFiles import BinaryFiles
from models.AppState import AppState
from enums import FillStyle, TextAlign, ArrowType

def simple_test():
  # Instantiate a default DucRectangleElement
  default_rectangle = DucRectangleElement()

  # Instantiate a default DucTextElement with custom text
  default_text = DucTextElement(text="Hello, World!")

  # Instantiate an empty BinaryFiles dictionary
  binary_files: BinaryFiles = {}

  # Instantiate a default AppState
  app_state = AppState()

  # Print default AppState
  print("AppState:")
  print(app_state)
  print("-" * 50)  # Divider for better readability

  # Print default DucRectangleElement
  print("Default DucRectangleElement:")
  print(default_rectangle)
  print("-" * 50)

  # Print default DucTextElement
  print("DucTextElement with custom text:")
  print(default_text)

def test_duc_element():
  # Example usage of DucElement subclasses

  # Create a rectangle element
  rectangle = DucRectangleElement(
      x=100.0,
      y=150.0,
      width=200.0,
      height=100.0,
      stroke_color="#FF0000",
      fill_style=FillStyle.HACHURE
  )

  # Create an ellipse element
  ellipse = DucEllipseElement(
      x=300.0,
      y=400.0,
      width=150.0,
      height=150.0,
      stroke_color="#00FF00",
      fill_style=FillStyle.SOLID
  )

  # Create a text element
  text_element = DucTextElement(
      x=500.0,
      y=600.0,
      width=300.0,
      height=50.0,
      text="Sample Text",
      font_size=24,
      font_family="Arial",
      text_align=TextAlign.CENTER
  )

  # Create an arrow element
  arrow = DucArrowElement(
      x=700.0,
      y=800.0,
      points=[[0.0, 0.0], [100.0, 100.0]],
      start_arrowhead=ArrowType.SHARP,
      end_arrowhead=ArrowType.ROUND
  )

  # Instantiate AppState with default values
  app_state = AppState()

  # Add elements to AppState
  app_state.groups.extend([rectangle, ellipse, text_element, arrow])

  # Update AppState selections
  app_state.selected_element_ids[rectangle.id] = True
  app_state.selected_element_ids[ellipse.id] = True

  # Print AppState
  print(app_state)

  # Print elements
  print(rectangle)
  print(ellipse)
  print(text_element)
  print(arrow)




if __name__ == "__main__":
  # simple_test()
  test_duc_element()
