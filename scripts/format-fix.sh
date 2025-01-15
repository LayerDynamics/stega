#!/bin/bash

# Function to format a directory
format_directory() {
    local dir=$1
    echo "Formatting files in ${dir}..."
    
    # Find all TypeScript files and format them in batches
    find "${dir}" -name "*.ts" -type f -print0 | while IFS= read -r -d '' file; do
        echo "Formatting ${file}..."
        deno fmt --options-single-quote=false "${file}"
    done
}

# Main directories to format
format_directory "src"
format_directory "tests"

# Run final verification
echo "Running final format check..."
deno fmt --check

# Run linter with fixes
echo "Running linter fixes..."
deno lint --config deno.json

echo "Formatting complete!"