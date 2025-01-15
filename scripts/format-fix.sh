#!/bin/bash

# Exit on any error
set -e

MODE="fix"  # Default mode

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --check) MODE="check" ;;
        --fix) MODE="fix" ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Function to format a directory
format_directory() {
    local dir=$1
    echo "Formatting files in ${dir}..."
    
    # Find all TypeScript files and format them
    find "${dir}" -name "*.ts" -type f -print0 | while IFS= read -r -d '' file; do
        if [ "$MODE" = "fix" ]; then
            echo "Formatting ${file}..."
            deno fmt --options-single-quote=false "${file}"
        fi
    done
}

# Main directories to format
if [ "$MODE" = "fix" ]; then
    format_directory "src"
    format_directory "tests"
fi

# Run verification
echo "Running format check..."
if ! deno fmt --check; then
    echo "Formatting issues found!"
    if [ "$MODE" = "check" ]; then
        exit 1
    else
        # In fix mode, run the formatter
        deno fmt
    fi
fi

# Run linter
echo "Running linter..."
if ! deno lint --config deno.json; then
    echo "Linting issues found!"
    exit 1
fi

echo "Process complete!"