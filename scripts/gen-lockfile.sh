#!/bin/bash

echo "Cleaning up existing lockfile..."
rm -f deno.lock

echo "Initializing cache and creating lockfile..."
deno cache --reload mod.ts
deno cache --lock deno.lock mod.ts

echo "Verifying dependencies..."
deno cache --lock deno.lock mod.ts

# Verify the lockfile was created and is not empty
if [ ! -s deno.lock ]; then
    echo "Error: Lockfile generation failed or file is empty"
    exit 1
fi

echo "Successfully generated lockfile"