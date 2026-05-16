Examples
========

The source for all examples lives in ``packages/ducpy/src/examples/``.

----

Element Creation
----------------

Demonstrates building rectangles, ellipses, polygons, lines, arrows, text,
frames and plots using the fluent builder DSL.

.. literalinclude:: ../src/examples/element_creation_demo.py
   :language: python
   :linenos:

----

Mutating Elements
-----------------

Shows how to update element properties in place and observe version changes.

.. literalinclude:: ../src/examples/mutation_demo.py
   :language: python
   :linenos:

----

External Files
--------------

Attaching binary blobs (images, PDFs) to a ``duc`` document.

.. literalinclude:: ../src/examples/external_files_demo.py
   :language: python
   :linenos:

----

SQL Builder
-----------

Direct SQLite access via :class:`~ducpy.builders.sql_builder.DucSQL`.
Use this when you need raw queries, bulk inserts, schema introspection, or
anything beyond what the high-level builders expose.

.. literalinclude:: ../src/examples/sql_builder_demo.py
   :language: python
   :linenos:

----

Serialization
-------------

Demonstrates how to serialize builder-created elements directly to a `.duc` file using `duc.serialize_duc`.

.. literalinclude:: ../src/examples/serialization_demo.py
   :language: python
   :linenos:

----

Parsing
-------

Demonstrates how to parse a `.duc` file or raw binary bytes using `duc.parse_duc`, allowing attribute-style access to the document's content.

.. literalinclude:: ../src/examples/parsing_demo.py
   :language: python
   :linenos:
