#!/bin/bash

# ISSUE #108 FIX: Remove console.log statements from production code
# This script finds and removes console.log, console.warn, console.error statements
# while preserving console.error in error boundaries and critical error handling

echo "🧹 Cleaning up console statements from client code..."

# Find all TypeScript/JavaScript files with console statements
files=$(grep -rl "console\.\(log\|warn\|debug\)" client/src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" || true)

if [ -z "$files" ]; then
  echo "✅ No console statements found!"
  exit 0
fi

count=0

for file in $files; do
  # Skip error boundary files - they need console.error
  if [[ "$file" == *"ErrorBoundary"* ]] || [[ "$file" == *"error-handler"* ]]; then
    echo "⏭️  Skipping $file (error handler)"
    continue
  fi
  
  # Remove console.log, console.warn, console.debug (but keep console.error for now)
  if grep -q "console\.\(log\|warn\|debug\)" "$file"; then
    echo "🔧 Cleaning $file"
    
    # Create backup
    cp "$file" "$file.bak"
    
    # Remove console.log, console.warn, console.debug lines
    sed -i.tmp '/console\.\(log\|warn\|debug\)/d' "$file"
    rm "$file.tmp"
    
    ((count++))
  fi
done

echo ""
echo "✅ Cleaned $count files"
echo "💡 Backup files created with .bak extension"
echo "💡 Review changes and remove .bak files when satisfied"

# Optionally: Remove backup files
# read -p "Remove backup files? (y/n) " -n 1 -r
# echo
# if [[ $REPLY =~ ^[Yy]$ ]]; then
#   find client/src -name "*.bak" -delete
#   echo "✅ Backup files removed"
# fi
