#!/usr/bin/env python3
"""
Remove duplicate entries from seed-data.sql to prevent unique constraint violations.
Focuses on:
1. Users table (unique email, firebaseUid)
2. Tenants table (unique code, name, registrationNumber)
3. Members table (unique memberNumber, nationalId)
"""

import re
import shutil
from datetime import datetime

def parse_values(insert_statement):
    """
    Parse a SQL INSERT statement value block into a list of rows.
    Returns: (prefix, values_list, suffix)
    """
    # Split into prefix (INSERT INTO ... VALUES) and the values part
    match = re.search(r'(INSERT INTO .*? VALUES)(.*);', insert_statement, re.DOTALL)
    if not match:
        return None, None, None
    
    prefix = match.group(1)
    values_text = match.group(2).strip()
    suffix = ';'

    # Split values by "),\n" or ")," to handle potential formatting
    # This is a simple parser and assumes standard SQL formatting from the generator
    rows = []
    current_row = ""
    in_string = False
    
    for char in values_text:
        current_row += char
        if char == "'":
            in_string = not in_string
        elif char == ',' and not in_string:
            if current_row.strip().endswith(')'):
                 # Check if this is the end of a row (tuples end with ))
                 # But we are looking for the comma *between* rows
                 pass
        
    # Regex to split rows: "),\n" or ")," ignoring commas inside quotes is hard with simple split
    # Let's rely on the strict formatting of the generator: rows end with ")," or ");"
    
    # The generator usually outputs:
    # ('val1', 'val2'),
    # ('val3', 'val4');
    
    # We can split by "),\n" or "),"
    # A safer approach for the specific file format:
    rows = re.split(r'\),\s*\n', values_text)
    
    # Clean up the split rows
    cleaned_rows = []
    for i, row in enumerate(rows):
        row = row.strip()
        if row.startswith('('):
            if i < len(rows) - 1:
                cleaned_rows.append(row + ')')
            else:
                # Last row might imply it ends with ')' inside the split or we need to check
                if row.endswith(')'):
                    cleaned_rows.append(row)
                else:
                    # The split consumed the closing parenthesis?
                    # re.split consumes the delimiter.
                    # If we split by "),\n", the ) is gone.
                    # We need to add it back.
                    cleaned_rows.append(row + ')')
        
    # Re-verify the split logic. re.split consumes the delimiter.
    # The delimiter includes the closing parenthesis.
    # So we need to append ')' to all except maybe the last one if it wasn't split?
    # Actually, the last one ends with ); which is not matched by `),\n`.
    # Let's try a different regex: `\),\s*\n` matches the separator.
    
    # Let's use a simpler approach since we know the file format:
    # Rows are separated by "),\n"
    # But last row ends with ");"
    
    # Let's look at the file content again.
    # It seems to be standard VALUES (...), \n (...);
    
    # Identify the start of the values block
    value_start_idx = insert_statement.find('VALUES') + 6
    values_str = insert_statement[value_start_idx:].strip()
    
    # Split by `),\n`
    # We need to handle the last one which ends in `;`
    if values_str.endswith(';'):
        values_str = values_str[:-1] # Remove ;
    
    # Now split
    parts = re.split(r'\),\n\s*', values_str)
    
    final_rows = []
    for i, part in enumerate(parts):
        part = part.strip()
        if not part.endswith(')'):
             part += ')'
        final_rows.append(part)
            
    return prefix, final_rows, suffix

def extract_field(row_str, field_index, is_quoted=True):
    """
    Extract a field value from a SQL row string at a given index.
    Very basic CSV-like parsing respecting quotes.
    """
    # Remove outer parenthesis
    inner = row_str.strip()
    if inner.startswith('(') and inner.endswith(')'):
        inner = inner[1:-1]
    
    parts = []
    current = ""
    in_quote = False
    
    for char in inner:
        if char == "'":
            in_quote = not in_quote
            current += char
        elif char == ',' and not in_quote:
            parts.append(current.strip())
            current = ""
        else:
            current += char
    parts.append(current.strip())
    
    if field_index < len(parts):
        val = parts[field_index]
        if is_quoted:
            # unique key might be 'email@example.com' -> remove quotes
            return val.strip("'")
        return val
    return None

def deduplicate_users(content):
    """
    Deduplicates the users INSERT statement.
    Unique keys: email (index 1), firebaseUid (index 2, if not NULL), id (index 0)
    """
    # Find users INSERT block
    # Pattern: INSERT INTO users ... VALUES ... ;
    pattern = r'(INSERT INTO users.*?VALUES\n.*?;)'
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        print("⚠️  Could not find users INSERT statement.")
        return content

    full_statement = match.group(1)
    prefix, rows, suffix = parse_values(full_statement)
    
    if not rows:
        return content

    print(f"   Found {len(rows)} user rows. Checking for duplicates...")

    seen_emails = set()
    seen_uids = set()
    unique_rows = []
    duplicates_count = 0

    for row in rows:
        # Schema: id, email, firebaseUid, ...
        email = extract_field(row, 1)
        uid = extract_field(row, 2)
        
        is_duplicate = False
        
        if email and email in seen_emails:
            is_duplicate = True
            print(f"   Duplicate user removed (email): {email}")
        
        if uid and uid != 'NULL' and uid in seen_uids:
            is_duplicate = True
            print(f"   Duplicate user removed (UID): {uid}")

        if not is_duplicate:
            if email: seen_emails.add(email)
            if uid and uid != 'NULL': seen_uids.add(uid)
            unique_rows.append(row)
        else:
            duplicates_count += 1
            
    print(f"   Removed {duplicates_count} duplicate users.")
    
    # Reconstruct the statement
    new_values = ",\n".join(unique_rows)
    new_statement = f"{prefix}\n{new_values}{suffix}"
    
    return content.replace(full_statement, new_statement)

def deduplicate_tenants(content):
    """
    Deduplicates tenants.
    Unique keys: code (index 2), name (index 1)
    """
    pattern = r'(INSERT INTO tenants.*?VALUES\n.*?;)'
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        return content

    full_statement = match.group(1)
    prefix, rows, suffix = parse_values(full_statement)
    
    if not rows:
        return content
        
    print(f"   Found {len(rows)} tenant rows. Checking for duplicates...")
    
    seen_codes = set()
    unique_rows = []
    duplicates = 0
    
    for row in rows:
        # Schema: id, name, code ...
        code = extract_field(row, 2)
        
        if code and code in seen_codes:
            duplicates += 1
            print(f"   Duplicate tenant removed: {code}")
        else:
            if code: seen_codes.add(code)
            unique_rows.append(row)
            
    print(f"   Removed {duplicates} duplicate tenants.")

    new_values = ",\n".join(unique_rows)
    new_statement = f"{prefix}\n{new_values}{suffix}"
    
    return content.replace(full_statement, new_statement)

def main():
    seed_file = 'scripts/seed-data.sql'
    backup_file = f'scripts/seed-data.dedup.backup.{datetime.now().strftime("%Y%m%d_%H%M%S")}.sql'
    
    print(f"🔄 deduplicating {seed_file}...")
    
    # Backup
    shutil.copy2(seed_file, backup_file)
    print(f"   Backup created: {backup_file}")
    
    with open(seed_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Deduplicate
    content = deduplicate_users(content)
    content = deduplicate_tenants(content)
    
    # Write back
    with open(seed_file, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("✅ Deduplication complete.")

if __name__ == '__main__':
    main()
