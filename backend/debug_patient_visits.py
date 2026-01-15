import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from patients.models import Visit, Patient
from medical.models import DoctorNote

def run():
    print("--- Checking Patient CHRISTIN ---")
    patients = Patient.objects.filter(full_name__icontains="CHRISTIN")
    for p in patients:
        print(f"Patient: {p.full_name} | ID: {p.id}")
        visits = Visit.objects.filter(patient=p).order_by('-created_at')
        for v in visits:
            note = DoctorNote.objects.filter(visit=v).first()
            has_note = "YES" if note else "NO"
            print(f"  - Visit: {v.id} | Date: {v.created_at.date()} | Has Note: {has_note}")
            if note:
                 print(f"    Note ID: {note.id} | Meds: {list(note.prescription.keys())}")

if __name__ == "__main__":
    run()
