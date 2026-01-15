import os
import django
import sys
import json

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from patients.models import Visit, Patient
from medical.models import DoctorNote

def run():
    print("--- Checking Patient arun ---")
    patients = Patient.objects.filter(full_name__icontains="arun")
    for p in patients:
        print(f"Patient: {p.full_name} | ID: {p.id}")
        
        visits = Visit.objects.filter(patient=p).order_by('-created_at')
        if visits.exists():
            for v in visits:
                note = DoctorNote.objects.filter(visit=v).first()
                note_status = "YES" if note else "NO"
                print(f"  - Visit: {v.id}")
                print(f"    Date: {v.created_at}")
                print(f"    Has Note: {note_status}")
                if note:
                    print(f"    Note Presc: {json.dumps(note.prescription)}")
        else:
            print("  No visits found.")

if __name__ == "__main__":
    run()
