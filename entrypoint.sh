#!/bin/sh
set -e

# Define the path Node.js is screaming for
EXPECTED_DIR="/app/node_modules/sqlite3/lib/binding/napi-v6-linux-glibc-arm"
EXPECTED_FILE="$EXPECTED_DIR/node_sqlite3.node"

echo "🔍 Checking sqlite3 binary..."
echo "🎯 Expected at: $EXPECTED_FILE"

# 1. Check if it exists exactly where expected
if [ -f "$EXPECTED_FILE" ]; then
    echo "✅ Binary found in the correct place!"
else
    echo "⚠️ Binary missing at expected path."
    
    # 2. Rebuild if we haven't already (or force it)
    echo "🚧 Rebuilding sqlite3 from source..."
    npm rebuild sqlite3 --build-from-source
    
    # 3. Search for where it actually landed
    echo "🔎 Searching for built binary..."
    FOUND_BINARY=$(find /app/node_modules/sqlite3/lib/binding -name "node_sqlite3.node" | head -n 1)
    
    if [ -n "$FOUND_BINARY" ]; then
        echo "💡 Found binary at: $FOUND_BINARY"
        
        # If it's not in the expected folder, create the folder and copy it
        if [ "$FOUND_BINARY" != "$EXPECTED_FILE" ]; then
            echo "🛠 Fixing path mismatch..."
            mkdir -p "$EXPECTED_DIR"
            cp "$FOUND_BINARY" "$EXPECTED_FILE"
            echo "✅ Copied binary to expected location."
        fi
    else
        echo "❌ Critical Error: sqlite3 binary failed to build or cannot be found."
        ls -R /app/node_modules/sqlite3/lib/binding/
        exit 1
    fi
fi

echo "🚀 Starting server..."
exec node server.js
