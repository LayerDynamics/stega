#!/bin/bash
set -e  # Exit on any error

echo "Cleaning up existing lockfile..."
rm -f deno.lock

echo "Initializing cache and creating lockfile..."
deno cache src/mod.ts

echo "Writing lockfile..."
deno cache --lock=deno.lock src/mod.ts

echo "Verifying dependencies..."
deno cache --reload --lock=deno.lock src/mod.ts

# Verify the lockfile was created and is not empty
if [ ! -s deno.lock ]; then
    echo "Error: Lockfile generation failed or file is empty"
    exit 1
fi

echo "Successfully generated lockfile"