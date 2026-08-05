"""Tests for IfcOpenShell model text extraction and ranked IFC search."""

from __future__ import annotations

from pathlib import Path

import ifcopenshell

from ducpy.builders.sql_builder import DucSQL
from ducpy.parse import parse_duc_lazy
from ducpy.search import (
    extract_ifc_file_text,
    extract_ifc_text,
    extract_model_ifc_text,
    search_duc_models,
)

ASSET = "universal.duc"


def _asset_input_path(filename: str) -> Path:
    return Path(__file__).resolve().parents[5] / "assets" / "testing" / "duc-files" / filename


def _model_by_label(parsed_asset: dict, label: str) -> dict:
    for element in parsed_asset.get("elements", []) or []:
        if (
            element.get("type") == "model"
            and not element.get("is_deleted")
            and element.get("label") == label
        ):
            return element
    raise AssertionError(f"No model element labelled {label!r} in asset")


def _build_sample_ifc() -> tuple[object, bytes, str]:
    model = ifcopenshell.file(schema="IFC4")
    model.header.file_name.name = "authored-search-model.ifc"
    model.header.file_name.author = ("Search Author",)
    model.header.file_name.organization = ("Ducflair Testing",)
    model.header.file_name.authorization = "Approved for coordination"

    project_global_id = ifcopenshell.guid.new()
    wall_global_id = ifcopenshell.guid.new()

    model.create_entity(
        "IfcProject",
        GlobalId=project_global_id,
        Name="Search Project",
        LongName="Duplex Search Apartment",
        Phase="Design Development",
    )
    wall = model.create_entity(
        "IfcWall",
        GlobalId=wall_global_id,
        Name="Lobby Acoustic Wall",
        Description="User-authored acoustic partition",
        ObjectType="Custom partition family",
        Tag="W-SEARCH-101",
    )

    rating = model.create_entity(
        "IfcPropertySingleValue",
        Name="AcousticRating",
        Description="Sound transmission requirement",
        NominalValue=model.create_entity("IfcLabel", "STC 55"),
    )
    property_set = model.create_entity(
        "IfcPropertySet",
        GlobalId=ifcopenshell.guid.new(),
        Name="Pset_SearchRequirements",
        Description="Custom design properties",
        HasProperties=(rating,),
    )
    model.create_entity(
        "IfcRelDefinesByProperties",
        GlobalId=ifcopenshell.guid.new(),
        RelatedObjects=(wall,),
        RelatingPropertyDefinition=property_set,
    )

    quantity = model.create_entity(
        "IfcQuantityLength",
        Name="Clear Height",
        Description="User-entered clear height",
        LengthValue=2.75,
        Formula="Design clear height",
    )
    quantities = model.create_entity(
        "IfcElementQuantity",
        GlobalId=ifcopenshell.guid.new(),
        Name="BaseQuantities",
        Quantities=(quantity,),
    )
    model.create_entity(
        "IfcRelDefinesByProperties",
        GlobalId=ifcopenshell.guid.new(),
        RelatedObjects=(wall,),
        RelatingPropertyDefinition=quantities,
    )

    material = model.create_entity(
        "IfcMaterial",
        Name="Recycled Search Steel",
        Description="Low carbon framing material",
        Category="Metal framing",
    )
    model.create_entity(
        "IfcRelAssociatesMaterial",
        GlobalId=ifcopenshell.guid.new(),
        RelatedObjects=(wall,),
        RelatingMaterial=material,
    )

    classification = model.create_entity(
        "IfcClassification",
        Source="NBS",
        Edition="2025",
        Name="Uniclass Search System",
        Description="Classification authored for testing",
    )
    classification_reference = model.create_entity(
        "IfcClassificationReference",
        Identification="EF_25_10",
        Name="Wall construction classification",
        ReferencedSource=classification,
    )
    model.create_entity(
        "IfcRelAssociatesClassification",
        GlobalId=ifcopenshell.guid.new(),
        RelatedObjects=(wall,),
        RelatingClassification=classification_reference,
    )

    document = model.create_entity(
        "IfcDocumentInformation",
        Identification="DOC-SEARCH-001",
        Name="Maintenance Search Manual",
        Description="Wall maintenance instructions",
        Location="https://example.test/manual",
        Purpose="Facilities handover",
    )
    model.create_entity(
        "IfcRelAssociatesDocument",
        GlobalId=ifcopenshell.guid.new(),
        RelatedObjects=(wall,),
        RelatingDocument=document,
    )

    model.create_entity(
        "IfcPresentationLayerAssignment",
        Name="A-WALL-SEARCH",
        Description="Authored wall layer",
        AssignedItems=(),
    )
    model.create_entity(
        "IfcOrganization",
        Identification="ORG-SEARCH",
        Name="Search Design Studio",
        Description="Project architect",
    )
    model.create_entity(
        "IfcPostalAddress",
        Purpose="OFFICE",
        Description="Coordination office",
        AddressLines=("10 Search Street",),
        Town="Lisbon",
        PostalCode="1000-001",
        Country="Portugal",
    )

    return model, model.to_string().encode("utf-8"), wall_global_id


def _build_sqlite_ifc_model(tmp_path: Path, ifc_bytes: bytes) -> tuple[Path, dict]:
    path = tmp_path / "sqlite-ifc-model.duc"
    element_id = "sqlite-ifc-model"
    file_id = "sqlite-ifc"
    revision_id = "sqlite-ifc-r1"

    with DucSQL.new(path) as db:
        db.conn.execute(
            "INSERT INTO elements (id, element_type, label) VALUES (?, ?, ?)",
            (element_id, "model", "SQLite IFC model"),
        )
        db.conn.execute(
            "INSERT INTO element_model (element_id, model_type) VALUES (?, ?)",
            (element_id, "ifc"),
        )
        db.conn.execute(
            "INSERT INTO external_files (id, active_revision_id, updated, version) "
            "VALUES (?, ?, ?, ?)",
            (file_id, revision_id, 1, 1),
        )
        db.conn.execute(
            "INSERT INTO external_file_revisions "
            "(id, file_id, size_bytes, mime_type, created) VALUES (?, ?, ?, ?, ?)",
            (revision_id, file_id, len(ifc_bytes), "application/x-step", 1),
        )
        db.conn.execute(
            "INSERT INTO external_file_revision_data (revision_id, data) VALUES (?, ?)",
            (revision_id, ifc_bytes),
        )
        db.conn.execute(
            "INSERT INTO model_element_files (element_id, file_id, sort_order) "
            "VALUES (?, ?, ?)",
            (element_id, file_id, 0),
        )

    element = {
        "id": element_id,
        "type": "model",
        "label": "SQLite IFC model",
        "model_type": "ifc",
        "file_ids": [file_id],
    }
    return path, element


def test_extract_ifc_text_indexes_authored_content_not_step_syntax():
    model, ifc_bytes, wall_global_id = _build_sample_ifc()

    loaded_result = extract_ifc_file_text(model)
    byte_result = extract_ifc_text(ifc_bytes)
    blob = byte_result.text

    for needle in (
        "Duplex Search Apartment",
        "Lobby Acoustic Wall",
        "User-authored acoustic partition",
        "Pset_SearchRequirements",
        "AcousticRating",
        "STC 55",
        "Clear Height",
        "2.75",
        "Recycled Search Steel",
        "Uniclass Search System",
        "Maintenance Search Manual",
        "A-WALL-SEARCH",
        "Search Design Studio",
        "10 Search Street",
        "Search Author",
    ):
        assert needle in blob, f"missing extracted IFC value: {needle!r}"

    assert loaded_result.text == byte_result.text
    assert wall_global_id not in blob
    assert "IfcWall" not in blob
    assert "#1=" not in blob

    kinds = {item.kind for item in byte_result.items}
    assert {
        "attribute",
        "property",
        "quantity",
        "material",
        "classification",
        "document",
        "presentation_layer",
        "actor",
        "address",
        "header",
    } <= kinds


def test_extract_ifc_text_handles_empty_and_invalid_data():
    assert extract_ifc_text(b"").items == ()
    assert extract_ifc_text(b"not an IFC STEP file").items == ()


def test_python_ifc_execution_is_opt_in_and_ignores_source_only_text():
    element = {
        "id": "python-ifc",
        "type": "model",
        "model_type": "python",
        "file_ids": [],
        "code": (
            "import ifcopenshell\n"
            "def build():\n"
            "    model = ifcopenshell.file(schema='IFC4')\n"
            "    model.create_entity(\n"
            "        'IfcWall',\n"
            "        GlobalId=ifcopenshell.guid.new(),\n"
            "        Name='Generated Search Wall',\n"
            "    )\n"
            "build()\n"
            "source_only_secret = 'Never materialized into the IFC model'\n"
        ),
    }

    assert extract_model_ifc_text("unused.duc", element).items == ()

    result = extract_model_ifc_text("unused.duc", element, run_code=True)
    assert "Generated Search Wall" in result.text
    assert "Never materialized into the IFC model" not in result.text


def test_sqlite_backed_ifc_model_is_ranked_by_authored_property(tmp_path):
    _, ifc_bytes, _ = _build_sample_ifc()
    duc_path, element = _build_sqlite_ifc_model(tmp_path, ifc_bytes)

    extracted = extract_model_ifc_text(duc_path, element)
    assert "STC 55" in extracted.text

    response = search_duc_models(
        duc_path,
        "STC 55",
        output_path=tmp_path / "ifc-search.json",
    )
    assert response.total_hits == 1
    assert response.results[0].element_id == element["id"]


def test_universal_external_ifc_model_extracts_real_bim_content():
    asset_path = _asset_input_path(ASSET)
    parsed = parse_duc_lazy(str(asset_path))
    element = _model_by_label(parsed, "Model 8")

    result = extract_model_ifc_text(asset_path, element)

    assert "Duplex Apartment" in result.text
    assert "Living Room" in result.text
    assert "Masonry - Brick" in result.text
    assert "Pset_SpaceCommon" in result.text
