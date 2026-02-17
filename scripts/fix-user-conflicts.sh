#!/bin/bash

# Fix variable naming conflicts in regulator user API files

FILES=(
  "app/api/regulator/users/[id]/route.ts"
  "app/api/regulator/users/[id]/reset-password/route.ts"
  "app/api/regulator/users/[id]/status/route.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    
    # Replace 'const user = await getUserFromRequest' with 'const currentUser = await getUserFromRequest'
    sed -i '' 's/const user = await getUserFromRequest/const currentUser = await getUserFromRequest/g' "$file"
    
    # Replace references to the authenticated user
    sed -i '' 's/if (!session?.user/if (!currentUser/g' "$file"
    sed -i '' 's/includes(user\.role)/includes(currentUser.role)/g' "$file"
    sed -i '' 's/params\.id === user\.id/params.id === currentUser.id/g' "$file"
    
    echo "✓ Fixed $file"
  fi
done

echo "All conflicts resolved!"
