#!/bin/bash

# Enable error handling
set -eo pipefail

# Configure logging
LOG_DIR="../build_logs"
TARGET_DIR="../packages"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
mkdir -p "$LOG_DIR"

# Color setup (only if terminal supports it)
if [ -t 1 ]; then
    TS_COLOR="\033[34m"    # Dark Blue
    PY_COLOR="\033[36m"    # Light Blue
    RUST_COLOR="\033[38;5;208m" # Orange
    RESET="\033[0m"
else
    TS_COLOR=""
    PY_COLOR=""
    RUST_COLOR=""
    RESET=""
fi

# Status flags
TS_SUCCESS=false
PY_SUCCESS=false
RUST_SUCCESS=false


# Create output directories
mkdir -p $TARGET_DIR/duc-ts $TARGET_DIR/duc-py/src/ducpy $TARGET_DIR/duc-rs/src

# Run builds and capture status
echo "Starting code generation..."
echo "==========================="

# TypeScript generation
echo "⚙️  Generating TypeScript bindings..."
if flatc --ts --ts-no-import-ext -o $TARGET_DIR/duc-ts duc.fbs 2>"$LOG_DIR/ts_$TIMESTAMP.log"; then
    TS_SUCCESS=true
fi

# Python generation
echo "⚙️  Generating Python bindings..."
if flatc --python -o $TARGET_DIR/duc-py/src/ducpy duc.fbs 2>"$LOG_DIR/py_$TIMESTAMP.log"; then
    PY_SUCCESS=true
fi

# Rust generation
echo "⚙️  Generating Rust bindings..."
if flatc --rust -o $TARGET_DIR/duc-rs/src duc.fbs 2>"$LOG_DIR/rust_$TIMESTAMP.log"; then
    RUST_SUCCESS=true
fi

# Summary report with colors
echo ""
echo "Generation Results:"
echo "-------------------"
printf "${TS_COLOR}TypeScript:${RESET} %s\n" "$([ "$TS_SUCCESS" = true ] && echo "✅ Success" || echo "❌ Failed")"
printf "${PY_COLOR}Python:    ${RESET} %s\n" "$([ "$PY_SUCCESS" = true ] && echo "✅ Success" || echo "❌ Failed")"
printf "${RUST_COLOR}Rust:      ${RESET} %s\n" "$([ "$RUST_SUCCESS" = true ] && echo "✅ Success" || echo "❌ Failed")"

# Exit with error if any failed
if ! $TS_SUCCESS || ! $PY_SUCCESS || ! $RUST_SUCCESS; then
    echo ""
    echo "Error: Some generations failed - check logs in $LOG_DIR/"
    exit 1
fi

echo ""
echo "All generations completed successfully 🎉"
exit 0