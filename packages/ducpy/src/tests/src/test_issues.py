import ducpy as duc


def test_issues_roundtrip(test_output_dir):
    issues = [
        duc.StateBuilder()
            .with_id("issue-1")
            .build_issue()
            .with_local_id(1)
            .with_title("Resolve lobby clearance")
            .with_status("open")
            .with_author_id("architect")
            .with_created_at(1_715_000_000_000)
            .with_updated_at(1_715_000_002_000)
            .add_assignee("engineer")
            .add_follower("owner")
            .add_message(
                "architect",
                "Door swing conflicts with the required clearance.",
                name="Architect",
                reactions={"+1": ["engineer"]},
                created_at=1_715_000_001_000,
            )
            .with_canvas_anchor(120.0, 80.0, scope="mm")
            .build(),
        duc.StateBuilder()
            .with_id("issue-2")
            .build_issue()
            .with_local_id(2)
            .with_title("Check model face")
            .with_status("dismissed")
            .with_author_id("engineer")
            .with_dismissed_reason("Duplicate review note.")
            .with_created_at(1_715_000_003_000)
            .with_updated_at(1_715_000_004_000)
            .with_model_anchor(
                element_id="model-1",
                point=[1.0, 2.0, 3.0],
                normal=[0.0, 0.0, 1.0],
                topology_id="face-42",
            )
            .build(),
    ]

    path = f"{test_output_dir}/issues_roundtrip.duc"
    duc.serialize_duc(name="IssuesRoundtrip", output_path=path, issues=issues)
    parsed = duc.parse_duc(path)

    assert len(parsed.issues) == 2
    assert parsed.issues[0].title == "Resolve lobby clearance"
    assert parsed.issues[0].assignee_ids == ["engineer"]
    assert parsed.issues[0].messages[0].reactions["+1"] == ["engineer"]
    assert parsed.issues[0].anchor.type == "canvas"
    assert parsed.issues[0].anchor.scope == "mm"
    assert parsed.issues[1].status == "dismissed"
    assert parsed.issues[1].anchor.type == "model"
    assert list(parsed.issues[1].anchor.point) == [1.0, 2.0, 3.0]
    assert parsed.issues[1].anchor.topology_id == "face-42"
