import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from patients.models import Patient, Visit

# Find patient Kundan
patient = Patient.objects.filter(full_name__icontains='Kundan').first()
if patient:
    print(f"=== PATIENT: {patient.full_name} ===\n")
    
    visit = Visit.objects.filter(patient=patient).order_by('-created_at').first()
    if visit:
        print(f"Visit ID: {visit.id}")
        print(f"Status: {visit.status}")
        print(f"Assigned Role: {visit.assigned_role}")
        print(f"visit.doctor: {visit.doctor}")
        if visit.doctor:
            print(f"  - Doctor ID: {visit.doctor.id}")
            print(f"  - Doctor username: {visit.doctor.username}")
            print(f"  - Doctor role: {visit.doctor.role}")
        else:
            print("  - Doctor is NULL!")
else:
    print("Patient 'Kundan' not found")
