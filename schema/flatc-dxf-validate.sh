#!/bin/bash

# DXF R2018 FlatBuffers Schema Validation Script
# This script validates the DXF R2018 FlatBuffers schema for syntax and structural correctness

set -eo pipefail

# Colors for output
if [ -t 1 ]; then
    GREEN="\033[32m"
    RED="\033[31m"
    YELLOW="\033[33m"
    BLUE="\033[34m"
    RESET="\033[0m"
else
    GREEN=""
    RED=""
    YELLOW=""
    BLUE=""
    RESET=""
fi

SCHEMA_FILE="dxf-R2018.fbs"
LOG_DIR="../build_logs"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
VALIDATION_LOG="$LOG_DIR/validation_$TIMESTAMP.log"

mkdir -p "$LOG_DIR"

echo -e "${BLUE}DXF R2018 FlatBuffers Schema Validation${RESET}"
echo "========================================"
echo ""

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Error: Schema file '$SCHEMA_FILE' not found${RESET}"
    exit 1
fi

echo -e "${YELLOW}📁 Schema file: $SCHEMA_FILE${RESET}"
echo ""

# Validate schema syntax
echo "🔍 Validating schema syntax..."
if flatc --binary --schema -o /tmp/flatc-validation-test "$SCHEMA_FILE" > "$VALIDATION_LOG" 2>&1; then
    echo -e "${GREEN}✅ Schema syntax is valid${RESET}"
    SYNTAX_VALID=true
    rm -f /tmp/flatc-validation-test/*
else
    echo -e "${RED}❌ Schema syntax validation failed${RESET}"
    echo "Check log: $VALIDATION_LOG"
    cat "$VALIDATION_LOG"
    SYNTAX_VALID=false
fi

echo ""

# Test code generation (without saving files)
echo "🔧 Testing code generation capabilities..."

TEST_SUCCESS=true

# Test TypeScript generation
echo "  - Testing TypeScript generation..."
if flatc --ts --ts-no-import-ext -o /tmp/flatc-test-ts "$SCHEMA_FILE" > /dev/null 2>&1; then
    echo -e "    ${GREEN}✅ TypeScript generation OK${RESET}"
    rm -rf /tmp/flatc-test-ts
else
    echo -e "    ${RED}❌ TypeScript generation failed${RESET}"
    TEST_SUCCESS=false
fi

# Test Python generation
echo "  - Testing Python generation..."
if flatc --python -o /tmp/flatc-test-py "$SCHEMA_FILE" > /dev/null 2>&1; then
    echo -e "    ${GREEN}✅ Python generation OK${RESET}"
    rm -rf /tmp/flatc-test-py
else
    echo -e "    ${RED}❌ Python generation failed${RESET}"
    TEST_SUCCESS=false
fi

# Test Rust generation
echo "  - Testing Rust generation..."
if flatc --rust -o /tmp/flatc-test-rust "$SCHEMA_FILE" > /dev/null 2>&1; then
    echo -e "    ${GREEN}✅ Rust generation OK${RESET}"
    rm -rf /tmp/flatc-test-rust
else
    echo -e "    ${RED}❌ Rust generation failed${RESET}"
    TEST_SUCCESS=false
fi

echo ""

# Schema analysis
echo "📊 Schema analysis:"
echo "  - Namespace: $(grep '^namespace' "$SCHEMA_FILE" | cut -d' ' -f2 | tr -d ';')"
echo "  - Tables: $(grep -c '^table ' "$SCHEMA_FILE")"
echo "  - Unions: $(grep -c '^union ' "$SCHEMA_FILE")"
echo "  - Root type: $(grep '^root_type' "$SCHEMA_FILE" | cut -d' ' -f2 | tr -d ';')"

echo ""

# Final validation result
if [ "$SYNTAX_VALID" = true ] && [ "$TEST_SUCCESS" = true ]; then
    echo -e "${GREEN}🎉 Schema validation passed! Ready for code generation.${RESET}"
    exit 0
else
    echo -e "${RED}❌ Schema validation failed. Please fix errors before code generation.${RESET}"
    exit 1
fi
