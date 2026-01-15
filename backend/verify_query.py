import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from medical.models import DoctorNote
from patients.models import Patient

def run():
    print("--- Verifying Filter Query ---")
    p = Patient.objects.filter(full_name__icontains="arun").first()
    if not p:
        print("Patient arun not found")
        return

    print(f"Patient ID: {p.id}")
    
    # Try the filter used by API
    notes = DoctorNote.objects.filter(visit__patient=p.id)
    print(f"Notes found via visit__patient=p.id: {notes.count()}")
    
    notes2 = DoctorNote.objects.filter(visit__patient__id=p.id)
    print(f"Notes found via visit__patient__id=p.id: {notes2.count()}")

if __name__ == "__main__":
    run()
