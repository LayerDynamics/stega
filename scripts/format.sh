#!/bin/bash

# Format in batches to avoid memory issues
format_batch() {
    local dir=$1
    echo "Formatting files in ${dir}..."
    find "${dir}" -name "*.ts" -type f -print0 | xargs -0 -n 10 deno fmt
}

# Format source files
format_batch "src"

# Format test files 
format_batch "tests"

# Run final check
deno fmt --check

# Run linter fixes
deno lint --fix

echo "Formatting complete"
