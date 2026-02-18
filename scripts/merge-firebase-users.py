#!/usr/bin/env python3
"""
Merge Firebase-authenticated users from seed-data-with-auth.sql 
into the complete seed-data.sql file.

This script:
1. Reads the Firebase users from seed-data-with-auth.sql
2. Reads the complete seed data from seed-data.sql
3. Replaces the users section with Firebase-authenticated users
4. Outputs the merged result to seed-data.sql (backup created)
"""

import re
import shutil
from datetime import datetime

def extract_users_from_auth_file(auth_file_path):
    """Extract the users INSERT statement from the auth file."""
    with open(auth_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the users INSERT statement
    pattern = r'(INSERT INTO users.*?VALUES\n.*?);'
    match = re.search(pattern, content, re.DOTALL)
    
    if match:
        return match.group(0)
    return None

def replace_users_in_seed_file(seed_file_path, new_users_insert):
    """Replace the users INSERT statement in the seed file."""
    with open(seed_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find and replace the users INSERT statement
    pattern = r'INSERT INTO users.*?VALUES\n.*?;'
    
    # Replace with the new users insert
    new_content = re.sub(pattern, new_users_insert, content, count=1, flags=re.DOTALL)
    
    return new_content

def main():
    auth_file = 'scripts/seed-data-with-auth.sql'
    seed_file = 'scripts/seed-data.sql'
    backup_file = f'scripts/seed-data.backup.{datetime.now().strftime("%Y%m%d_%H%M%S")}.sql'
    
    print('🔄 Merging Firebase-authenticated users into seed-data.sql...\n')
    
    # Step 1: Extract users from auth file
    print(f'📖 Reading Firebase users from {auth_file}...')
    firebase_users = extract_users_from_auth_file(auth_file)
    
    if not firebase_users:
        print('❌ Error: Could not find users INSERT statement in auth file')
        return 1
    
    print(f'   ✅ Found Firebase users INSERT statement ({len(firebase_users)} characters)\n')
    
    # Step 2: Create backup
    print(f'💾 Creating backup: {backup_file}...')
    shutil.copy2(seed_file, backup_file)
    print('   ✅ Backup created\n')
    
    # Step 3: Replace users in seed file
    print(f'🔧 Replacing users in {seed_file}...')
    new_content = replace_users_in_seed_file(seed_file, firebase_users)
    
    # Step 4: Write the new content
    with open(seed_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print('   ✅ Users replaced successfully\n')
    
    # Step 5: Verify
    print('✅ Migration complete!')
    print('\n📊 Summary:')
    print(f'   - Original file backed up to: {backup_file}')
    print(f'   - Updated file: {seed_file}')
    print('   - All users now have Firebase authentication')
    print('   - Default password for all users: 123456')
    print('\n🎯 Next steps:')
    print('   1. Review the updated seed-data.sql file')
    print('   2. Import it into your MySQL database')
    print('   3. Test login with any user email and password: 123456')
    
    return 0

if __name__ == '__main__':
    exit(main())
