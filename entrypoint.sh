#!/bin/sh
set -e

# The node_modules Docker volume can outlive the image, so install newly added
# production dependencies before starting the app.
if [ ! -f "/app/node_modules/node-dht-sensor/package.json" ]; then
    echo "📦 Installing missing production dependencies..."
    npm install --production
fi

# Define the path Node.js is screaming for
EXPECTED_DIR="/app/node_modules/sqlite3/lib/binding/napi-v6-linux-glibc-arm"
EXPECTED_FILE="$EXPECTED_DIR/node_sqlite3.node"

echo "🔍 Checking sqlite3 binary..."
echo "🎯 Expected at: $EXPECTED_FILE"

find_sqlite_binary() {
    FOUND_BINARY=""
    for candidate in /app/node_modules/sqlite3/lib/binding/*/node_sqlite3.node; do
        if [ -f "$candidate" ]; then
            FOUND_BINARY="$candidate"
            return 0
        fi
    done

    return 1
}

# 1. Check if it exists exactly where expected
if [ -f "$EXPECTED_FILE" ]; then
    echo "✅ Binary found in the correct place!"
else
    echo "⚠️ Binary missing at expected path."

    # 2. Reuse the ARM binary npm built during the image build when the
    # package expects a slightly different N-API directory name at runtime.
    echo "🔎 Searching for built binary..."
    find_sqlite_binary || true

    # 3. Rebuild only when no sqlite binary exists at all.
    if [ -z "$FOUND_BINARY" ]; then
        echo "🚧 Rebuilding sqlite3 from source..."
        npm rebuild sqlite3 --build-from-source
        echo "🔎 Searching for rebuilt binary..."
        find_sqlite_binary || true
    fi

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
