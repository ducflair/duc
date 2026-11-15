import unittest
import tempfile
from pathlib import Path
import ducpy as duc


class SerializableElementTests(unittest.TestCase):
    def test_type_tags_and_stack_geometry_survive_json_conversion(self):
        elements = [duc.ElementBuilder().with_id('rectangle').with_size(10, 20).build_rectangle().build(),
                    duc.ElementBuilder().with_id('frame').with_size(100, 200).build_frame_element().build()]
        for element in elements:
            for value in (element, element.element):
                serialized = duc.to_serializable(value)
                self.assertEqual(serialized['type'], element.element.__class__.__name__.removeprefix('Duc').removesuffix('Element').lower())
                with tempfile.TemporaryDirectory() as directory:
                    path = Path(directory) / 'roundtrip.duc'
                    duc.serialize_duc(name='fixture', output_path=path, elements=[serialized])
                    self.assertEqual(duc.parse_duc(path)['elements'][0]['id'], serialized['id'])
