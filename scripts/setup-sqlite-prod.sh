#!/bin/bash

# Script to set up SQLite for production use

echo "Setting up SQLite for production..."

# Create data directory if it doesn't exist
mkdir -p ./data
mkdir -p ./uploads

# Set proper permissions for data directory
chmod 755 ./data
chmod 755 ./uploads

# Create initial database file if it doesn't exist
if [ ! -f "./data/remoteway.db" ]; then
    echo "Creating initial database file..."
    touch ./data/remoteway.db
    chmod 644 ./data/remoteway.db
fi

# Backup existing database before deployment (if exists)
if [ -f "./data/remoteway.db" ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    echo "Creating backup of existing database..."
    cp ./data/remoteway.db ./data/backup_${TIMESTAMP}_remoteway.db
    echo "Backup created: ./data/backup_${TIMESTAMP}_remoteway.db"
fi

# Set SQLite recommended settings for production
echo "Configuring SQLite for production..."
sqlite3 ./data/remoteway.db <<EOF
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -64000;
PRAGMA temp_store = MEMORY;
PRAGMA mmap_size = 30000000000;
VACUUM;
ANALYZE;
EOF

echo "SQLite production setup complete!"
echo ""
echo "Recommendations:"
echo "1. Set up regular automated backups (daily recommended)"
echo "2. Monitor disk space - SQLite databases can grow over time"
echo "3. Consider implementing a backup rotation policy"
echo "4. Test restore procedures regularly"
echo "5. Monitor database file size and VACUUM periodically"