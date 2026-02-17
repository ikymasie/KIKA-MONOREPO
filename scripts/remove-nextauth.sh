#!/bin/bash

# Script to remove next-auth imports from regulator API files

FILES=(
  "app/api/regulator/applications/[id]/route.ts"
  "app/api/regulator/users/[id]/route.ts"
  "app/api/regulator/users/route.ts"
  "app/api/regulator/saccos/[id]/route.ts"
  "app/api/regulator/users/[id]/reset-password/route.ts"
  "app/api/regulator/users/[id]/status/route.ts"
  "app/api/regulator/directory/route.ts"
  "app/api/regulator/reporting/route.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Remove next-auth import line
    sed -i '' '/import.*next-auth/d' "$file"
    
    # Remove authOptions import line
    sed -i '' '/import.*authOptions/d' "$file"
    
    # Replace getServerSession with getUserFromRequest
    sed -i '' 's/const session = await getServerSession(authOptions);/const user = await getUserFromRequest(request);/g' "$file"
    
    # Replace session checks with user checks
    sed -i '' "s/if (!session?.user)/if (!user)/g" "$file"
    sed -i '' "s/session.user.role/user.role/g" "$file"
    sed -i '' "s/session.user.id/user.id/g" "$file"
    sed -i '' "s/session?.user.id/user.id/g" "$file"
    
    # Add getUserFromRequest import if not present
    if ! grep -q "getUserFromRequest" "$file"; then
      sed -i '' "1s/^/import { getUserFromRequest } from '@\/lib\/auth-server';\n/" "$file"
    fi
    
    echo "✓ Updated $file"
  fi
done

echo "All files processed!"
