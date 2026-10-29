use hipdf::lopdf::{content::Operation, Object};

/// The text-block helper emits absolute line origins using relative Td operators.
pub(super) fn absolute_line_positions(mut operations: Vec<Operation>) -> Vec<Operation> {
    for operation in &mut operations {
        if operation.operator == "Td" && operation.operands.len() == 2 {
            let x = operation.operands[0].clone();
            let y = operation.operands[1].clone();
            *operation = Operation::new("Tm", vec![Object::Integer(1), Object::Integer(0),
                Object::Integer(0), Object::Integer(1), x, y]);
        }
    }
    operations
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn blank_lines_and_alignment_do_not_accumulate_position_offsets() {
        let operations = absolute_line_positions(vec![
            Operation::new("BT", vec![]),
            Operation::new("Td", vec![10.into(), (-20).into()]),
            Operation::new("Td", vec![30.into(), (-50).into()]),
            Operation::new("Td", vec![20.into(), (-80).into()]),
        ]);
        assert_eq!(operations[0].operator, "BT");
        for (operation, (x, y)) in operations[1..].iter().zip([(10, -20), (30, -50), (20, -80)]) {
            assert_eq!(operation.operator, "Tm");
            assert_eq!(operation.operands[4].as_i64().unwrap(), x);
            assert_eq!(operation.operands[5].as_i64().unwrap(), y);
        }
    }
}
