from patients.models import Visit

# Search for visit
visit_id_prefix = "28f2b11e"
visits = Visit.objects.filter(id__istartswith=visit_id_prefix)

print(f"Found {visits.count()} visits.")
for v in visits:
    print(f"ID: {v.id}")
    print(f"Patient: {v.patient.full_name}")
    print(f"Vitals: {v.vitals}")
