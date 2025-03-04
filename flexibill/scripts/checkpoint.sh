#!/bin/bash

# Checkpoint management script for FlexiBill development
# Usage: ./checkpoint.sh [create|restore] [checkpoint_name]

ACTION=$1
CHECKPOINT_NAME=$2
CHECKPOINT_DIR="./checkpoints"

if [ -z "$ACTION" ] || [ -z "$CHECKPOINT_NAME" ]; then
  echo "Usage: ./checkpoint.sh [create|restore|list] [checkpoint_name]"
  exit 1
fi

# Create checkpoints directory if it doesn't exist
mkdir -p $CHECKPOINT_DIR

case $ACTION in
  "create")
    CHECKPOINT_PATH="$CHECKPOINT_DIR/$CHECKPOINT_NAME-$(date +%Y%m%d%H%M%S).tar.gz"
    echo "Creating checkpoint: $CHECKPOINT_PATH"
    
    # Create a tarball of the current state
    tar -czf $CHECKPOINT_PATH \
      --exclude="node_modules" \
      --exclude=".git" \
      --exclude="checkpoints" \
      ./flexibill
    
    echo "Checkpoint created successfully!"
    ;;
    
  "restore")
    # Find the latest checkpoint with the given name
    CHECKPOINT_PATH=$(ls -t $CHECKPOINT_DIR/$CHECKPOINT_NAME-*.tar.gz 2>/dev/null | head -1)
    
    if [ -z "$CHECKPOINT_PATH" ]; then
      echo "No checkpoint found with name: $CHECKPOINT_NAME"
      exit 1
    fi
    
    echo "Restoring from checkpoint: $CHECKPOINT_PATH"
    
    # Backup current state before restoring
    BACKUP_PATH="$CHECKPOINT_DIR/pre-restore-$(date +%Y%m%d%H%M%S).tar.gz"
    echo "Creating backup before restore: $BACKUP_PATH"
    tar -czf $BACKUP_PATH \
      --exclude="node_modules" \
      --exclude=".git" \
      --exclude="checkpoints" \
      ./flexibill
    
    # Extract the checkpoint
    tar -xzf $CHECKPOINT_PATH
    
    echo "Checkpoint restored successfully!"
    ;;
    
  "list")
    echo "Available checkpoints:"
    ls -l $CHECKPOINT_DIR | grep "$CHECKPOINT_NAME" | sort -r
    ;;
    
  *)
    echo "Unknown action: $ACTION"
    echo "Usage: ./checkpoint.sh [create|restore|list] [checkpoint_name]"
    exit 1
    ;;
esac