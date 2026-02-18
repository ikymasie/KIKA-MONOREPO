#!/usr/bin/env python3
"""
Remove isMaintenanceMode column from seed-data.sql
This column doesn't exist in the current database schema.
"""

import re

def fix_tenants_insert():
    seed_file = 'scripts/seed-data.sql'
    
    with open(seed_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove isMaintenanceMode from column list
    content = re.sub(
        r'lastComplianceReviewDate, isMaintenanceMode, createdAt',
        r'lastComplianceReviewDate, createdAt',
        content
    )
    
    # Remove the value (0 or false) before createdAt in VALUES
    # Pattern: ..., 'date', 0, 'timestamp'... -> ..., 'date', 'timestamp'...
    content = re.sub(
        r"('[\d-]+'), (0|false), ('[\d-]+)",
        r"\1, \3",
        content
    )
    
    with open(seed_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print('✅ Removed isMaintenanceMode from seed-data.sql')
    print('   The file is now compatible with your database schema')

if __name__ == '__main__':
    fix_tenants_insert()
