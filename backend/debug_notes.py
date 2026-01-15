import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from medical.models import DoctorNote
from patients.models import Visit
from pharmacy.models import PharmacyStock

def run_debug():
    print("--- Debugging Doctor Notes ---")
    try:
        latest_note = DoctorNote.objects.order_by('-created_at').first()
        if latest_note:
            print(f"Latest Note ID: {latest_note.id}")
            print(f"Visit ID (in Note): {latest_note.visit.id}")
            print(f"Prescription Data: {latest_note.prescription}")
            print(f"Created At: {latest_note.created_at}")
            
            visit = latest_note.visit
            # v_id is serialzier field, model uses id
            print(f"Linked Visit ID: {visit.id}") 
            print(f"Linked Visit Patient: {visit.patient.full_name}")
        else:
            print("No DoctorNotes found.")
    except Exception as e:
        print(f"Error fetching notes: {e}")

    print("\n--- Recent Visits ---")
    visits = Visit.objects.order_by('-created_at')[:3]
    for v in visits:
        print(f"Visit ID: {v.id} | Patient: {v.patient.full_name}")

    print("\n--- Pharmacy Stock (First 5) ---")
    stock = PharmacyStock.objects.all()[:5]
    for s in stock:
        # Use getattr to be safe if mrp missing? no model has it.
        print(f"Item: {s.name} | MRP: {s.mrp} | ID: {s.id}")

if __name__ == "__main__":
    run_debug()
