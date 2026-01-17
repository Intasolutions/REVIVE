import os
import sys
import re
import django

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "revive_cms.settings")
django.setup()

from lab.models import LabTest

# Try valid PDF libraries
try:
    from pypdf import PdfReader
except ImportError:
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        print("No PDF library found.")
        sys.exit(1)

def get_category_from_header(header):
    header = header.upper()
    keywords = {
        'HAEMATOLOGY': 'HAEMATOLOGY',
        'HEMATOLOGY': 'HAEMATOLOGY',
        'IMMUNO': 'IMMUNO_HAEMATOLOGY',
        'BIOCHEMISTRY': 'BIOCHEMISTRY',
        'URINE': 'URINE',
        'STOOL': 'STOOL',
        'MICROBIOLOGY': 'MICROBIOLOGY',
        'SEROLOGY': 'SEROLOGY',
        'HORMONE': 'HORMONE',
        'X-RAY': 'XRAY',
        'XRAY': 'XRAY',
    }
    for k, v in keywords.items():
        if k in header:
            return v
    return None

def run_import():
    target = "../TEST LIST.pdf"
    if not os.path.exists(target):
        print(f"File not found: {target}")
        print("Please place 'TEST LIST.pdf' in the parent directory.")
        return

    reader = PdfReader(target)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"

    print(f"Extracted {len(text)} lines.")
    
    current_category = 'OTHERS'
    added_count = 0
    updated_count = 0
    
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Check for Category Header
        cat_match = get_category_from_header(line)
        if cat_match:
            current_category = cat_match
            print(f"--- Switch Category: {current_category} ---")
            continue

        # Regex: Exact match from dry_run
        match = re.search(r'^(.*?)\s+(\d+(?:\.\d{1,2})?)$', line)
        
        if match:
            name = match.group(1).strip()
            price_str = match.group(2)
            
            # Filters
            if len(name) < 2: 
                # print(f"SKIPPED (Short): {name}")
                continue
            if name.isdigit(): 
                # print(f"SKIPPED (Digit): {name}")
                continue
            if "Total" in name or "Page" in name or "Amount" in name: 
                # print(f"SKIPPED (Keyword): {name}")
                continue
            
            # Clean name
            clean_name = re.sub(r'^\d+[\s\.]+', '', name) # Remove leading "1 " or "1. "
            clean_name = re.sub(r'\s+', ' ', clean_name) # Collapse multiple spaces <--- ADDED FIX
            clean_name = clean_name.strip('. ')

            if not clean_name: 
                # print(f"SKIPPED (Empty after clean): {name}")
                continue

            try:
                test, created = LabTest.objects.get_or_create(
                    name=clean_name,
                    defaults={
                        'category': current_category,
                        'price': float(price_str)
                    }
                )
                if created:
                    print(f"Added: {clean_name} [{current_category}] - {price_str}")
                    added_count += 1
                else:
                    if float(test.price) != float(price_str):
                        test.price = float(price_str)
                        test.save()
                        print(f"Updated: {clean_name} - {price_str}")
                        updated_count += 1
            except Exception as e:
                print(f"Error adding {clean_name}: {e}")
        else:
            # print(f"NO MATCH: {line[:20]}...")
            pass
                
    print(f"=== Import Complete. Added {added_count} tests. Updated {updated_count}. ===")

if __name__ == "__main__":
    run_import()
