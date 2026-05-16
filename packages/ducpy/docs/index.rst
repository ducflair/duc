ducpy
===================

.. raw:: html

   <p align="center">
     <br/>
     <a href="https://duc.ducflair.com" target="_blank">
       <img width="256px" src="https://cdn.jsdelivr.net/gh/ducflair/assets@main/src/duc/duc-extended.png" />
     </a>
     <p align="center">2D CAD File Format</p>
     <p align="center">
       <a href="https://pypi.org/project/ducpy/"><img src="https://shields.io/badge/Pip-blue?logo=Pypi&logoColor=white&style=round-square" alt="Pip" /></a>
       <a href="https://github.com/ducflair/duc/releases"><img src="https://img.shields.io/pypi/v/ducpy?style=round-square&label=latest%20stable" alt="PyPI ducpy@latest release" /></a>
       <a href="https://pypi.org/project/ducpy/"><img src="https://img.shields.io/pypi/dm/ducpy?style=round-square&color=salmon" alt="Downloads" /></a>
     </p>
   </p>

Overview
--------

**Builders API (High-level)**
    The easy way to build, manage ``.duc`` files.
    Construct elements, apply styles, manage layers, build blocks,
    and handle document state with the
    :doc:`builders <autoapi/ducpy/builders/index>` module.

**SQL Builder (Low-level)**
    A ``.duc`` file is a zlib-compressed SQLite database. Use the
    :doc:`sql_builder <autoapi/ducpy/builders/sql_builder/index>`
    for direct schema access, bulk queries, and low-level manipulation.

**Search**
    Query/search elements and files programmatically via the
    :doc:`search <autoapi/ducpy/search/index>` API.

**File I/O**
    Read and write ``.duc`` files using the
    :doc:`parse <autoapi/ducpy/parse/index>` and
    :doc:`serialize <autoapi/ducpy/serialize/index>` modules.

.. toctree::
   :maxdepth: 2
   :caption: Contents:

   autoapi/index
   examples
   downloads