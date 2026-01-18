
import os
import django
import sys
from django.db.models import Q

# Setup Django environment
sys.path.append(r'e:\Inta Workspace\REVIVE\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from patients.models import Patient, Visit
from pharmacy.models import PharmacySale

def debug_patient(name_fragment="Patient 2"):
    print(f"--- Searching for '{name_fragment}' ---")
    patients = Patient.objects.filter(full_name__icontains=name_fragment)
    
    if not patients.exists():
        print("No patient found.")
        return

    for p in patients:
        print(f"\n[Patient] {p.full_name} (ID: {p.id})")
        
        # 1. Check Visits
        visits = Visit.objects.filter(patient=p).order_by('-created_at')
        print(f"  Total Visits: {visits.count()}")
        for v in visits:
            print(f"    - Visit {v.id} | Status: {v.status} | Updated: {v.updated_at.strftime('%H:%M:%S')}")
            # Check linked sales
            linked_sales = PharmacySale.objects.filter(visit=v)
            if linked_sales.exists():
                print(f"      [LINKED SALES]: {linked_sales.count()}")
                for s in linked_sales:
                    print(f"        Sale {s.id}: Amt={s.total_amount}, Status={s.payment_status}")
            else:
                print("      (No linked sales)")

        # 2. Check Unlinked Sales (Orphaned? or Linked to closed visits?)
        # A sale is linked to patient implicitly via Visit. 
        # But if visit is NULL, we can't easily find it unless we stored patient_id in PharmacySale?
        # Let's check PharmacySale model fields again.
        # PharmacySale: visit FK. No direct patient FK.
        # IF visit is NULL, we can't find who it belongs to easily unless we look at other logs or if I missed a field.
        # Wait, PharmacySaleModel has `visit`.
        
        # If I can't find by patient direct, checking ALL null-visit sales is hard.
        # But wait, did we add Patient FK to PharmacySale? No.
        
        # However, checking the latest sales might reveal them if I just list all sales.
        print("\n  [Checking recent Orphan Sales (Visit=NULL)]:")
        orphans = PharmacySale.objects.filter(visit__isnull=True).order_by('-created_at')[:5]
        for o in orphans:
             print(f"    Orphan Sale {o.id}: Amt={o.total_amount}. (Cannot determine patient easily)")

if __name__ == '__main__':
    debug_patient()
