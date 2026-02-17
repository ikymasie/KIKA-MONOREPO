#!/bin/bash

# Add getUserFromRequest import to files that are missing it

FILES=(
  "app/api/regulator/directory/route.ts"
  "app/api/regulator/reporting/route.ts"
  "app/api/regulator/saccos/[id]/route.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Check if getUserFromRequest is already imported
    if ! grep -q "getUserFromRequest" "$file"; then
      echo "Adding import to $file..."
      # Add import after the NextResponse import
      sed -i '' "/import.*NextResponse.*from 'next\/server'/a\\
import { getUserFromRequest } from '@/lib/auth-server';
" "$file"
    fi
    
    # Fix session references
    sed -i '' 's/if (!session?.user/if (!user/g' "$file"
    sed -i '' "s/user.role !== 'regulator'/!user.isRegulator()/g" "$file"
    
    # Fix database import path
    sed -i '' 's/@\/lib\/db/@\/src\/config\/database/g' "$file"
    sed -i '' 's/@\/entities\//@\/src\/entities\//g' "$file"
    
    echo "✓ Fixed $file"
  fi
done

echo "All files fixed!"
