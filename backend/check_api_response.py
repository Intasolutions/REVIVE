import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from patients.models import Visit
from patients.serializers import VisitSerializer

# Get the pending visit for Kundan
visit = Visit.objects.filter(patient__full_name__icontains='Kundan', status='CLOSED').order_by('-created_at').first()

if visit:
    print(f"=== RAW VISIT DATA ===")
    print(f"Visit ID: {visit.id}")
    print(f"Patient: {visit.patient.full_name}")
    print(f"Status: {visit.status}")
    print(f"visit.doctor: {visit.doctor}")
    print(f"visit.doctor.username: {visit.doctor.username if visit.doctor else 'NULL'}")
    
    print(f"\n=== SERIALIZED DATA (API Response) ===")
    serializer = VisitSerializer(visit)
    data = serializer.data
    
    print(f"doctor: {data.get('doctor')}")
    print(f"doctor_name: {data.get('doctor_name')}")
    print(f"patient_name: {data.get('patient_name')}")
    print(f"\npharmacy_items count: {len(data.get('pharmacy_items', []))}")
    if data.get('pharmacy_items'):
        for item in data['pharmacy_items']:
            print(f"  - {item.get('name')}: qty={item.get('qty')}, dosage={item.get('dosage')}, duration={item.get('duration')}")
else:
    print("No closed visit found for Kundan")
