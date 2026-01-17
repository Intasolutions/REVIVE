import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from patients.models import Patient, Visit

name_query = "myran"
pats = Patient.objects.filter(full_name__icontains=name_query)

if not pats.exists():
    print(f"No patient found matching '{name_query}'")
else:
    with open('myran_status.log', 'w', encoding='utf-8') as f:
        for p in pats:
            f.write(f"Patient: {p.full_name} (ID: {p.id})\n")
            visits = Visit.objects.filter(patient=p).order_by('-created_at')
            for v in visits:
                f.write(f"  - Visit {v.id}\n")
                f.write(f"    Status: {v.status}\n")
                f.write(f"    Assigned Role: {v.assigned_role}\n")
                f.write(f"    Doctor: {v.doctor} (ID: {v.doctor.id if v.doctor else 'None'})\n")
                if v.doctor_note:
                    f.write(f"    Tests: {v.doctor_note.lab_referral_details}\n")
                f.write("-" * 20 + "\n")

