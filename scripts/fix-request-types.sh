#!/bin/bash

# Fix all remaining Request type issues in regulator API

find app/api/regulator -name "*.ts" -type f -exec sed -i '' 's/async function GET(request: Request)/async function GET(request: NextRequest)/g' {} \;
find app/api/regulator -name "*.ts" -type f -exec sed -i '' 's/async function POST(request: Request)/async function POST(request: NextRequest)/g' {} \;
find app/api/regulator -name "*.ts" -type f -exec sed -i '' 's/async function PUT(request: Request)/async function PUT(request: NextRequest)/g' {} \;
find app/api/regulator -name "*.ts" -type f -exec sed -i '' 's/async function DELETE(request: Request)/async function DELETE(request: NextRequest)/g' {} \;

# Ensure NextRequest is imported
find app/api/regulator -name "*.ts" -type f -exec sed -i '' 's/from '\''next\/server'\'';/from '\''next\/server'\'';/g' {} \;
find app/api/regulator -name "*.ts" -type f -exec sed -i '' 's/import { NextResponse }/import { NextRequest, NextResponse }/g' {} \;

echo "✓ Fixed all Request types in regulator API"
