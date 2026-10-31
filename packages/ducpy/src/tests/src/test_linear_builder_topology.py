import gzip
import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path

import ducpy as duc
from ducpy.classes.ElementsClass import DucLine, DucLineReference


class LinearBuilderTopologyTests(unittest.TestCase):
    def lines(self, builder):
        element = builder.build()
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'line.duc'
            duc.serialize_duc(name='topology', elements=[element], output_path=path)
            data = path.read_bytes()
            with closing(sqlite3.connect(':memory:')) as connection:
                connection.deserialize(gzip.decompress(data) if data[:2] == b'\x1f\x8b' else data)
                return connection.execute('SELECT start_index,end_index FROM linear_element_lines WHERE element_id=? ORDER BY sort_order', ('line',)).fetchall()

    def test_points_generate_connected_lines(self):
        for points in ([(0, 0), (10, 0), (10, 20)], [duc.DucPoint(0, 0), duc.DucPoint(10, 0), duc.DucPoint(10, 20)]):
            self.assertEqual(self.lines(duc.ElementBuilder().with_id('line').build_linear_element().with_points(points)), [(0, 1), (1, 2)])

    def test_explicit_line_topology_is_preserved(self):
        builder = duc.ElementBuilder().with_id('line').build_linear_element().with_points([(0, 0), (10, 0), (10, 20)])
        self.assertEqual(self.lines(builder.with_lines([DucLine(DucLineReference(0), DucLineReference(2))])), [(0, 2)])
        self.assertEqual(self.lines(builder.with_lines([])), [])

    def test_arrow_points_generate_connected_lines(self):
        self.assertEqual(self.lines(duc.ElementBuilder().with_id('line').build_arrow_element().with_points([(0, 0), (10, 0), (10, 20)])), [(0, 1), (1, 2)])


if __name__ == '__main__':
    unittest.main()
