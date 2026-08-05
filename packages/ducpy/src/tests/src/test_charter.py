import ducpy as duc


def test_charter_roundtrip(test_output_dir):
    charter = (duc.StateBuilder()
        .build_charter()
        .with_title("Permit set")
        .with_description("Coordinate the pre-delivery scope.")
        .with_objective("Produce an approved issue-for-construction package.")
        .with_phase("review")
        .with_updated_at(1_715_000_000_100)
        .add_requirement(
            "All drawings must include dimensions.",
            must=True,
            id="req-1",
            acceptance_criteria=["Every sheet has a dimension layer"],
        )
        .add_constraint(
            "Keep the existing structural grid.",
            hard=True,
            id="constraint-1",
        )
        .add_decision(
            "Use metric units.",
            "The project jurisdiction requires metric submissions.",
            accepted=True,
            id="decision-1",
            issue_ids=["issue-1"],
            decided_at=1_715_000_000_000,
        )
        .add_stakeholder("architect", "reviewer", name="Architect")
        .build())

    path = f"{test_output_dir}/charter_roundtrip.duc"
    duc.serialize_duc(name="CharterRoundtrip", output_path=path, charter=charter)
    parsed = duc.parse_duc(path)

    assert parsed.charter.title == "Permit set"
    assert parsed.charter.phase == "review"
    assert parsed.charter.requirements[0].acceptance_criteria == ["Every sheet has a dimension layer"]
    assert parsed.charter.constraints[0].statement == "Keep the existing structural grid."
    assert parsed.charter.decisions[0].issue_ids == ["issue-1"]
    assert parsed.charter.stakeholders[0].actor.identifier == "architect"
