#!/bin/bash

# SQLite Backup Script for Production

# Configuration
BACKUP_DIR="./backups"
DB_PATH="./data/remoteway.db"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}_remoteway.db"

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Check if database exists
if [ ! -f "${DB_PATH}" ]; then
    echo "Error: Database file not found at ${DB_PATH}"
    exit 1
fi

echo "Starting backup at $(date)"

# Perform SQLite backup using proper backup method
sqlite3 ${DB_PATH} ".backup '${BACKUP_FILE}'"

if [ $? -eq 0 ]; then
    echo "Backup successful: ${BACKUP_FILE}"

    # Compress the backup
    gzip ${BACKUP_FILE}
    echo "Compressed backup: ${BACKUP_FILE}.gz"

    # Calculate checksum
    sha256sum ${BACKUP_FILE}.gz > ${BACKUP_FILE}.gz.sha256
    echo "Checksum created: ${BACKUP_FILE}.gz.sha256"

    # Clean up old backups
    echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
    find ${BACKUP_DIR} -name "backup_*.db.gz" -mtime +${RETENTION_DAYS} -delete
    find ${BACKUP_DIR} -name "backup_*.db.gz.sha256" -mtime +${RETENTION_DAYS} -delete

    echo "Backup completed successfully at $(date)"
else
    echo "Error: Backup failed at $(date)"
    exit 1
fi

# Optional: Upload to S3 or other remote storage
# aws s3 cp ${BACKUP_FILE}.gz s3://your-bucket/backups/