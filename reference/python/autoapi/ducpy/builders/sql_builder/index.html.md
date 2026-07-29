# ducpy.builders.sql_builder

Thin wrapper to open .duc files as SQLite databases and run raw SQL.

A .duc file is a standard SQLite database. This builder just handles
opening/creating/exporting and exposes the raw `sqlite3.Connection`
so you can write whatever SQL you want.

Usage:

```default
import ducpy as duc

# Open existing .duc
with duc.DucSQL("drawing.duc") as db:
    rows = db.sql("SELECT id, label FROM elements WHERE element_type = ?", "rectangle")
    db.sql("UPDATE elements SET label = ? WHERE id = ?", "new-label", rows[0]["id"])

# Create new .duc from scratch
with duc.DucSQL.new() as db:
    db.sql("INSERT INTO elements (id, element_type, x, y, width, height) VALUES (?,?,?,?,?,?)",
           "r1", "rectangle", 0, 0, 100, 50)
    db.save("output.duc")

# From bytes
with duc.DucSQL.from_bytes(raw) as db:
    print(db.sql("SELECT COUNT(*) AS n FROM elements")[0]["n"])
    modified = db.to_bytes()
```

## Classes

| [`DucSQL`](#ducpy.builders.sql_builder.DucSQL)   | Raw SQL access to a `.duc` SQLite database.   |
|--------------------------------------------------|-----------------------------------------------|

## Functions

| [`quote_sql_identifier`](#ducpy.builders.sql_builder.quote_sql_identifier)(→ str)   | Quote a SQLite identifier such as an attached database alias.   |
|-------------------------------------------------------------------------------------|-----------------------------------------------------------------|

## Module Contents

### ducpy.builders.sql_builder.quote_sql_identifier(value: str) → str

Quote a SQLite identifier such as an attached database alias.

### *class* ducpy.builders.sql_builder.DucSQL(path: str | pathlib.Path)

Raw SQL access to a `.duc` SQLite database.

Attributes:
: conn: The underlying `sqlite3.Connection`.
  : Use it directly for cursor-level ops, `conn.executemany`, etc.

Open an existing `.duc` file.

#### conn *: sqlite3.Connection*

#### \_path *: str | None* *= ''*

#### \_temp *: str | None* *= None*

#### \_attached_temps *: list[str]* *= []*

#### \_closed *= False*

#### *classmethod* new(path: str | pathlib.Path | None = None) → [DucSQL](#ducpy.builders.sql_builder.DucSQL)

Create a new `.duc` database with the full schema bootstrapped.

Pass a *path* to write to disk, or omit for in-memory.

#### *classmethod* from_bytes(data: bytes) → [DucSQL](#ducpy.builders.sql_builder.DucSQL)

Open a `.duc` from raw bytes (temp file, cleaned up on close).

#### *classmethod* attach_many(paths: Sequence[str | pathlib.Path], aliases: Sequence[str] | None = None, read_only: bool = True) → [DucSQL](#ducpy.builders.sql_builder.DucSQL)

Open an in-memory SQLite connection with multiple `.duc` files attached.

This is useful for querying multiple drawings in one SQL statement. The
returned `DucSQL` owns only the in-memory connection; attached files are
not deleted on close.

#### sql(query: str, \*args: Any) → List[sqlite3.Row]

Run a SQL statement with positional `?` params. Returns rows.

#### sql_dict(query: str, params: dict) → List[sqlite3.Row]

Run a SQL statement with named `:key` params. Returns rows.

#### commit() → None

#### rollback() → None

#### save(path: str | pathlib.Path | None = None) → None

Write the database to a file. Omit *path* to save in-place.

#### to_bytes(compressed: bool = False) → bytes

Export the database as raw bytes.

#### close() → None

#### \_\_enter_\_() → [DucSQL](#ducpy.builders.sql_builder.DucSQL)

#### \_\_exit_\_(\*exc: Any) → None

#### \_\_del_\_() → None

#### \_\_repr_\_() → str
