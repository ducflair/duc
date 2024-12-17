import unittest
import io
from src.serialize_duc import serialize_as_flatbuffers, save_as_flatbuffers
from src.parse_duc import parse_duc_flatbuffers
from src.models.AppState import AppState
from src.models.DucElement import (
    DucRectangleElement, DucTextElement, DucArrowElement,
    Point, PointBinding
)
from src.models.BinaryFiles import BinaryFiles, BinaryFileData
from src.enums import FillStyle, StrokeStyle, TextAlign, ElementType, StrokePlacement

class TestDucSerialization(unittest.TestCase):
    def setUp(self):
        self.app_state = AppState(
            name="Test Canvas",
            zoom=1.5,
            scroll_x=100,
            scroll_y=200,
            grid_size=20,
            view_background_color="#ffffff"
        )

        self.elements = [
            DucRectangleElement(
                id="rect1",
                x=10,
                y=20,
                width=100,
                height=50,
                stroke_color="#000000",
                background_color="#ff0000",
                fill_style=FillStyle.SOLID,
                stroke_width=2,
                stroke_style=StrokeStyle.SOLID,
                stroke_placement=StrokePlacement.CENTER
            ),
            DucTextElement(
                id="text1",
                x=150,
                y=30,
                width=200,
                height=40,
                text="Hello, World!",
                font_size=16,
                font_family="Arial",
                text_align=TextAlign.CENTER
            ),
            DucArrowElement(
                id="arrow1",
                x=300,
                y=100,
                width=150,
                height=80,
                points=[Point(0, 0), Point(150, 80)],
                start_binding=PointBinding("rect1", 0.5, 5),
                end_binding=PointBinding("text1", 0.5, 5),
                start_arrowhead="arrow",
                end_arrowhead="triangle"
            )
        ]

        self.binary_files = {}
        self.binary_files["image1"] = BinaryFileData(
            mime_type="image/png",
            id="img1",
            data=b"fake_image_data",
            created=1625097600000,
            last_retrieved=1625097600000
        )

    def test_serialization_and_parsing(self):
        # Serialize the data
        serialized_data = serialize_as_flatbuffers(self.elements, self.app_state, self.binary_files, "duc")

        # Parse the serialized data
        parsed_data = parse_duc_flatbuffers(io.BytesIO(serialized_data))

        # Check if the parsed data matches the original data
        self.assertEqual(parsed_data['type'], "application/vnd.duc-cad")
        self.assertEqual(parsed_data['version'], 2)
        self.assertEqual(parsed_data['source'], "pdf-to-duc")

        # Check AppState
        parsed_app_state = parsed_data['appState']
        self.assertEqual(parsed_app_state.name, self.app_state.name)
        self.assertEqual(parsed_app_state.zoom, self.app_state.zoom)
        self.assertEqual(parsed_app_state.scroll_x, self.app_state.scroll_x)
        self.assertEqual(parsed_app_state.scroll_y, self.app_state.scroll_y)
        self.assertEqual(parsed_app_state.grid_size, self.app_state.grid_size)
        self.assertEqual(parsed_app_state.view_background_color, self.app_state.view_background_color)

        # Check Elements
        parsed_elements = parsed_data['elements']
        self.assertEqual(len(parsed_elements), len(self.elements))

        for original, parsed in zip(self.elements, parsed_elements):
            self.assertEqual(parsed.id, original.id)
            self.assertEqual(parsed.type, original.type)
            self.assertEqual(parsed.x, original.x)
            self.assertEqual(parsed.y, original.y)
            self.assertEqual(parsed.width, original.width)
            self.assertEqual(parsed.height, original.height)
            self.assertEqual(parsed.stroke_color, original.stroke_color)
            self.assertEqual(parsed.background_color, original.background_color)
            self.assertEqual(parsed.fill_style, original.fill_style)
            self.assertEqual(parsed.stroke_width, original.stroke_width)
            self.assertEqual(parsed.stroke_style, original.stroke_style)
            self.assertEqual(parsed.stroke_placement, original.stroke_placement)

            if isinstance(original, DucTextElement):
                self.assertEqual(parsed.text, original.text)
                self.assertEqual(parsed.font_size, original.font_size)
                self.assertEqual(parsed.font_family, original.font_family)
                self.assertEqual(parsed.text_align, original.text_align)

            if isinstance(original, DucArrowElement):
                self.assertEqual(len(parsed.points), len(original.points))
                for p1, p2 in zip(parsed.points, original.points):
                    self.assertEqual(p1.x, p2.x)
                    self.assertEqual(p1.y, p2.y)
                self.assertEqual(parsed.start_binding.element_id, original.start_binding.element_id)
                self.assertEqual(parsed.end_binding.element_id, original.end_binding.element_id)
                self.assertEqual(parsed.start_arrowhead, original.start_arrowhead)
                self.assertEqual(parsed.end_arrowhead, original.end_arrowhead)

        # Check BinaryFiles
        parsed_files = parsed_data['files']
        self.assertEqual(len(parsed_files), len(self.binary_files))
        for key, value in self.binary_files.items():
            self.assertIn(key, parsed_files)
            parsed_file = parsed_files[key]
            self.assertEqual(parsed_file.mime_type, value.mime_type)
            self.assertEqual(parsed_file.id, value.id)
            self.assertEqual(parsed_file.data, value.data)
            self.assertEqual(parsed_file.created, value.created)
            self.assertEqual(parsed_file.last_retrieved, value.last_retrieved)

    def test_save_as_flatbuffers(self):
        # Test the save_as_flatbuffers function
        serialized_data = save_as_flatbuffers(self.elements, self.app_state, self.binary_files)
        self.assertIsInstance(serialized_data, bytes)

        # Parse the serialized data to ensure it's valid
        parsed_data = parse_duc_flatbuffers(io.BytesIO(serialized_data))
        self.assertIsNotNone(parsed_data)
        self.assertEqual(len(parsed_data['elements']), len(self.elements))
        self.assertIsInstance(parsed_data['appState'], AppState)
        self.assertEqual(len(parsed_data['files']), len(self.binary_files))

if __name__ == '__main__':
    unittest.main()
