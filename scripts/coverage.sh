#!/bin/bash

set -e  # Exit on any error

# Ensure clean state and setup directories
rm -rf cov cov.lcov tmp .deno
mkdir -p cov tmp .deno

# Set environment variables
CURRENT_DIR=$(pwd)
export DENO_DIR="${CURRENT_DIR}/.deno"
export DENO_INSTALL_ROOT="${CURRENT_DIR}/.deno"
export TMPDIR="${CURRENT_DIR}/tmp"

# Clear and prepare cache
echo "Preparing environment..."
deno cache --reload mod.ts
deno cache --reload 'tests/**/*.ts' 'src/**/*.ts'

# Run tests first without coverage to generate dynamic files
echo "Running initial test pass..."
DENO_DIR="${CURRENT_DIR}/.deno" deno test --allow-read --allow-env --allow-write

# Cache any dynamically created test files
echo "Caching dynamic test files..."
if [ -d "tmp" ]; then
    find tmp -name "*.ts" -type f | while read -r file; do
        echo "Caching dynamic file: $file"
        DENO_DIR="${CURRENT_DIR}/.deno" deno cache "$file" || true
        # Copy dynamic files to a persistent location
        cp "$file" "tests/fixtures/dynamic/$(basename "$file")" || true
    done
fi

# Run tests with coverage
echo "Running tests with coverage..."
DENO_DIR="${CURRENT_DIR}/.deno" deno test --allow-read --allow-env --allow-write --coverage=cov --parallel

# Generate coverage report with retry logic
echo "Generating coverage report..."
max_attempts=3
attempt=1

while [ $attempt -le $max_attempts ]; do
    if DENO_DIR="${CURRENT_DIR}/.deno" deno coverage cov --lcov --output=cov.lcov; then
        break
    else
        echo "Coverage generation attempt $attempt failed"
        if [ $attempt -eq $max_attempts ]; then
            # Try to recover dynamic files before failing
            mkdir -p tests/fixtures/dynamic
            find tmp -name "*.ts" -type f -exec cp {} tests/fixtures/dynamic/ \;
            echo "Failed to generate coverage after $max_attempts attempts"
            exit 1
        fi
        attempt=$((attempt + 1))
        echo "Retrying coverage generation..."
        sleep 2
    fi
done

# Cleanup
rm -rf tmp .deno

echo "Coverage processing complete"
